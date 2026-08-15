/**
 * A cancel/decline faster than this is treated as host-automated, not human.
 * A human answer requires dialog render + read + act — sub-2s dismissals of a
 * just-appeared dialog are implausible, while observed auto-cancels routinely
 * exceed the old 250ms bound once a remote relay's network latency is in the
 * measurement (e.g. Claude Code 2.1.223 auto-canceled a streamable-HTTP
 * elicitation at 1533ms server-side). Trade-off: a human mashing Escape within
 * 2s is misread as automated — rarer and less misleading than the reverse.
 */
export const FAST_CANCEL_MS = 2000

export type ElicitAction = "accept" | "decline" | "cancel"
export type Verdict =
  | "working"
  | "unsupported"
  | "advertised_but_autocanceled"
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
  // Applies to cancel AND decline: an instant "no" of either flavor means the
  // host auto-answered without ever asking a human.
  if (input.latencyMs < FAST_CANCEL_MS) return "advertised_but_autocanceled"
  return "user_declined"
}
