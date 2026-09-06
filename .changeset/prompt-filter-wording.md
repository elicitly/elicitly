---
"elicitly": patch
---

Reword the contribute-fingerprint prompt to pass Claude Desktop's extension prompt-content filter, which rejected it as potential prompt injection. The provenance preamble now de-escalates the prompt's own authority instead of claiming the user's authorization, and the pre-filled GitHub-issue URL becomes a copy-paste flow (compose title and body; the user pastes them at issues/new).
