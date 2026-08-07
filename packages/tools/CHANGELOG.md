# @elicitly/tools

## 0.2.0

### Minor Changes

- cf15481: `elicit_doctor`: new `advertised_but_unanswered` probe verdict. The elicitation
  probe previously reported `unsupported` when the SDK's request timeout fired
  (nobody answered the dialog within the ~60s window), conflating a working host
  with a broken one. The doctor now detects the SDK's `RequestTimeout` error
  (-32001) and reports `action: "timeout"` with verdict
  `advertised_but_unanswered` instead.

## 0.1.1

### Patch Changes

- 1cd0b61: Releases now publish via npm trusted publishing (GitHub Actions OIDC) with
  automatic provenance — no long-lived npm token in CI. No runtime changes.
