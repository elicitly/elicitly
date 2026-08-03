import {
  buildPassiveReport,
  classifyProbe,
  type PassiveReport,
  type ServerInfo,
  scalarSchema,
} from "./core/index.js"
import type { ClientInfoFn, ElicitFn } from "./types.js"

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
  } catch {
    const latencyMs = Date.now() - start
    out.probes = {
      elicitationForm: {
        attempted: true,
        action: "error",
        latencyMs,
        data: null,
        verdict: classifyProbe({ action: "error", latencyMs }),
      },
    }
  }
  return out
}
