import { ErrorCode } from "@modelcontextprotocol/sdk/types.js"
import {
  buildPassiveReport,
  classifyProbe,
  type PassiveReport,
  type ServerInfo,
  scalarSchema,
} from "./core/index.js"
import type { ClientInfoFn, ElicitFn } from "./types.js"

/**
 * The SDK rejects an unanswered request with McpError RequestTimeout (-32001);
 * a structural check (not instanceof) so a duplicated SDK copy still matches.
 */
function isRequestTimeout(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: unknown }).code === ErrorCode.RequestTimeout
  )
}

/** One-line rejection summary for the probe report, clipped to 300 chars. */
function describeError(err: unknown): string {
  const s = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
  return s.length > 300 ? `${s.slice(0, 300)}…` : s
}

export type DoctorProbe = {
  attempted: boolean
  reason?: string
  action?: string
  latencyMs?: number
  data?: string | null
  verdict?: string
}

export type DoctorReport = PassiveReport & {
  /** Active, opt-in experiments — distinct from the passive `support` inference. */
  probes?: { elicitationForm: DoctorProbe }
}

/**
 * How long the probe holds the elicitation open. Deliberately below the ~60s
 * tool-call timeout common to MCP hosts (Claude Desktop): the SDK's own
 * default is also 60s, so an unbounded probe RACES the host limit and the
 * finished `advertised_but_unanswered` report never returns in-band — the
 * host kills the call first. 40s leaves room to serialize the report inside
 * the host window, and a dialog unanswered for 40s already classifies as
 * unanswered. See elicitly/elicitly#14, elicitly-pro#60.
 */
export const PROBE_TIMEOUT_S = 40

export async function doctor(
  deps: {
    clientView: ClientInfoFn
    elicit: ElicitFn
    serverInfo: ServerInfo
  },
  probeElicitation: boolean,
): Promise<DoctorReport> {
  const out: DoctorReport = buildPassiveReport(deps.clientView(), deps.serverInfo)

  if (!probeElicitation) return out

  if (!out.support.elicitation) {
    out.probes = {
      elicitationForm: { attempted: false, reason: "client did not advertise elicitation" },
    }
    return out
  }

  const start = Date.now()
  try {
    const res = await deps.elicit({
      message: "Elicitly diagnostic: select any option to confirm interactive elicitation works.",
      requestedSchema: scalarSchema(["ok"]),
      timeoutSeconds: PROBE_TIMEOUT_S,
    })
    const latencyMs = Date.now() - start
    const data =
      res.action === "accept" ? ((res.content?.value as string | undefined) ?? null) : null
    out.probes = {
      elicitationForm: {
        attempted: true,
        action: res.action,
        latencyMs,
        data,
        verdict: classifyProbe({ action: res.action, latencyMs }),
      },
    }
  } catch (err) {
    const latencyMs = Date.now() - start
    // A timeout means elicitation is likely fine and the probe simply outlasted
    // the human (PROBE_TIMEOUT_S governs — bounded below host tool-call limits
    // so this report still returns in-band); any other rejection means the
    // advertised capability didn't work. The raw
    // rejection rides `reason` so a fingerprint pinpoints WHERE it broke
    // (client error response vs. malformed result vs. transport) — this is
    // diagnostic output for the person probing, deliberately not telemetry:
    // host bugs are theirs to fix, and alerting ourselves on them is noise.
    const action = isRequestTimeout(err) ? "timeout" : "error"
    out.probes = {
      elicitationForm: {
        attempted: true,
        action,
        latencyMs,
        data: null,
        reason:
          action === "timeout" ? "no answer within the request timeout window" : describeError(err),
        verdict: classifyProbe({ action, latencyMs }),
      },
    }
  }
  return out
}
