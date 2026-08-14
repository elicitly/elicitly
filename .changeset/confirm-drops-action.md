---
"@elicitly/tools": minor
"elicitly": minor
---

Breaking: `elicit_confirm` no longer echoes the MCP elicitation `action` (or
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
