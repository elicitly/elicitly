# elicitly

## 0.6.0

### Minor Changes

- 5386063: Richer tool contracts for elicit_confirm, elicit_doctor, and elicit_form (elicitly/elicitly#25): per-parameter descriptions on every input, human-readable titles, tool annotations (readOnlyHint / destructiveHint / openWorldHint), declared output schemas, and results that now carry `structuredContent` alongside the existing JSON text content. Descriptions gained explicit confirm-vs-form disambiguation and elicit_form now states the MCP-spec prohibition on requesting secrets. No behavioral changes to inputs or validation.

## 0.5.1

### Patch Changes

- 534b305: Harden the `contribute-fingerprint` prompt for hosts that deliver MCP prompts as file attachments and for hosts that never render the probe dialog. The prompt now opens by stating it is user-initiated (so a cautious model doesn't read it as injected instructions and refuse), and it treats a probe timeout as a valid finding (`advertised_but_unanswered`) rather than a dead end — including the report as-is, and falling back to `probeElicitation: false` with a note only if the tool call itself is killed. Mirrors the hosted edition's prompt. Fixes [#15](https://github.com/elicitly/elicitly/issues/15).
- 81c7126: The `contribute-fingerprint` prompt now embeds the `elicit_doctor` report pretty-printed (2-space indentation) in the pre-filled GitHub issue instead of a single minified line, so the human reviewing the issue can actually read it. Values are unchanged — only whitespace — and the existing paste-manually fallback still covers the rare oversize URL.

## 0.5.0

### Minor Changes

- 7f7a169: New `contribute-fingerprint` MCP prompt (the server's first prompt — hosts that support prompts surface it, e.g. as a slash command in Claude Code): a guided flow that runs `elicit_doctor` with a live probe, shows the report, and prepares a pre-filled GitHub issue contributing the fingerprint to the public [Elicitation Support Matrix](https://www.elicitly.ai/docs/elicitation/support-matrix/) — one click to submit, nothing sent automatically. Free-edition counterpart of the hosted server's prompt (which shares directly via `elicit_doctor`'s `share: true`).

## 0.4.1

### Patch Changes

- 8e8b582: Add `mcpName` (`ai.elicitly/elicitly`) for Official MCP Registry ownership verification — the registry reads this field from the published npm artifact to prove the registry entry and the package share an owner.

## 0.4.0

### Minor Changes

- c68112e: `elicit_doctor`: error probes now carry the underlying rejection in
  `probes.elicitationForm.reason` (one line, clipped to 300 chars). A bare
  `action: "error"` verdict couldn't distinguish a client error response from a
  malformed result from a transport failure — the detail that decides whether a
  broken host fingerprint is the host's bug or the server's. Deliberately
  diagnostic output rather than telemetry: host bugs are unactionable noise in
  an error tracker, but gold in a fingerprint.

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
