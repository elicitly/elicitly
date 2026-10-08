---
"@elicitly/tools": patch
"elicitly": patch
---

Output schemas for `elicit_confirm`, `elicit_doctor`, and `elicit_form` (and the objects nested in them) now allow additional properties. Hosts cache tool definitions and validate `structuredContent` against the cached schema, so a strict schema would turn any future result field into an error until the host refreshes its tool list. Result types are unchanged.
