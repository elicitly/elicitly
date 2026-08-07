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
    // the human (the SDK's 60s default governs — see makeElicitAdapter); any
    // other rejection means the advertised capability didn't work.
    const action = isRequestTimeout(err) ? "timeout" : "error"
    out.probes = {
      elicitationForm: {
        attempted: true,
        action,
        latencyMs,
        data: null,
        ...(action === "timeout" ? { reason: "no answer within the request timeout window" } : {}),
        verdict: classifyProbe({ action, latencyMs }),
      },
    }
  }
  return out
}
