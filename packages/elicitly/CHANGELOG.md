# elicitly

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
