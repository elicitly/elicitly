export const FAST_CANCEL_MS = 250

export type ElicitAction = "accept" | "decline" | "cancel"
export type Verdict = "working" | "unsupported" | "advertised_but_broken" | "user_declined"

export function classifyProbe(input: {
  action: ElicitAction | "error"
  latencyMs: number
}): Verdict {
  if (input.action === "accept") return "working"
  if (input.action === "error") return "unsupported"
  if (input.latencyMs < FAST_CANCEL_MS) return "advertised_but_broken"
  return "user_declined"
}
