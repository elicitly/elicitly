---
"@elicitly/tools": minor
"elicitly": minor
---

Richer tool contracts for elicit_confirm, elicit_doctor, and elicit_form (elicitly/elicitly#25): per-parameter descriptions on every input, human-readable titles, tool annotations (readOnlyHint / destructiveHint / openWorldHint), declared output schemas, and results that now carry `structuredContent` alongside the existing JSON text content. Descriptions gained explicit confirm-vs-form disambiguation and elicit_form now states the MCP-spec prohibition on requesting secrets. No behavioral changes to inputs or validation.
