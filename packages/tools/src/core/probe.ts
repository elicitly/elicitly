export const FAST_CANCEL_MS = 250

export type ElicitAction = "accept" | "decline" | "cancel"
export type Verdict =
  | "working"
  | "unsupported"
  | "advertised_but_broken"
  | "advertised_but_unanswered"
  | "user_declined"

export function classifyProbe(input: {
  action: ElicitAction | "error" | "timeout"
  latencyMs: number
}): Verdict {
  if (input.action === "accept") return "working"
  // "unanswered", not "unrendered": a timeout proves only that no answer
  // arrived in the window — the host may have shown the dialog to a human who
  // never finished, or silently dropped the request.
  if (input.action === "timeout") return "advertised_but_unanswered"
  if (input.action === "error") return "unsupported"
  if (input.latencyMs < FAST_CANCEL_MS) return "advertised_but_broken"
  return "user_declined"
}
