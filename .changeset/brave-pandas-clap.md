---
"@elicitly/tools": minor
"elicitly": minor
---

`elicit_doctor`: new `advertised_but_unanswered` probe verdict. The elicitation
probe previously reported `unsupported` when the SDK's request timeout fired
(nobody answered the dialog within the ~60s window), conflating a working host
with a broken one. The doctor now detects the SDK's `RequestTimeout` error
(-32001) and reports `action: "timeout"` with verdict
`advertised_but_unanswered` instead.
