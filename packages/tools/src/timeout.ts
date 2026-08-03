const DEFAULT_TIMEOUT_S = 300
const MIN_TIMEOUT_S = 60
const MAX_TIMEOUT_S = 3600

/**
 * clamp(timeoutSeconds ?? 5m, 60s, 1h) — how long a synchronous elicitation
 * request stays open waiting for a human to answer. Deliberately more
 * generous than the SDK's bare 60s request default (a form takes longer to
 * read and fill out than a machine round-trip), but capped well under
 * elicit_approval's 24h ceiling — unlike that tool, this holds a live
 * connection open rather than a stored async record.
 */
export function clampTimeoutSeconds(timeoutSeconds: number | undefined): number {
  return Math.min(Math.max(timeoutSeconds ?? DEFAULT_TIMEOUT_S, MIN_TIMEOUT_S), MAX_TIMEOUT_S)
}
