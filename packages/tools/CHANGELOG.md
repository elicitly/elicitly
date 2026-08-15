# @elicitly/tools

## 0.3.0

### Minor Changes

- 8a57609: `elicit_doctor`: the fast-cancel probe verdict is now
  `advertised_but_autocanceled` (was `advertised_but_broken`) and the
  human-implausibility threshold is 2000ms (was 250ms). Field data forced both:
  Claude Code 2.1.223 auto-cancels streamable-HTTP elicitation at ~1.5s measured
  server-side (network latency the 250ms local-stdio bound never accounted for),
  which the old classifier misreported as `user_declined` — blaming a human for
  a dismissal no human ever saw. The new name is also more precise: the host
  processed the request and refused it; nothing about the wire is broken.

## 0.2.0

### Minor Changes

- cf15481: `elicit_doctor`: new `advertised_but_unanswered` probe verdict. The elicitation
  probe previously reported `unsupported` when the SDK's request timeout fired
  (nobody answered the dialog within the ~60s window), conflating a working host
  with a broken one. The doctor now detects the SDK's `RequestTimeout` error
  (-32001) and reports `action: "timeout"` with verdict
  `advertised_but_unanswered` instead.
- 2dd6fa6: Breaking: `elicit_confirm` no longer echoes the MCP elicitation `action` (or
  the `message`) in its result. The contract is now `confirmed` alone —
  `true` = proceed, `false` = a human explicitly said no (whether they chose the
  Cancel option or declined the dialog), `null` = no answer was obtained — plus
  `reason: "dismissed" | "error"` only on the `null` case.
  
  Rationale: `{ confirmed: false, action: "accept" }` (an accepted form whose
  selected choice was Cancel) was technically correct and rhetorically
  hazardous — LLM callers can misread the stray "accept" as a yes. Which
  control carried the "no" has no caller value, so the protocol action is no
  longer surfaced; `elicit_form` remains the raw passthrough for callers who
  need it.

## 0.1.1

### Patch Changes

- 1cd0b61: Releases now publish via npm trusted publishing (GitHub Actions OIDC) with
  automatic provenance — no long-lived npm token in CI. No runtime changes.
