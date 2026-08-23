---
"elicitly": patch
---

Harden the `contribute-fingerprint` prompt for hosts that deliver MCP prompts as file attachments and for hosts that never render the probe dialog. The prompt now opens by stating it is user-initiated (so a cautious model doesn't read it as injected instructions and refuse), and it treats a probe timeout as a valid finding (`advertised_but_unanswered`) rather than a dead end — including the report as-is, and falling back to `probeElicitation: false` with a note only if the tool call itself is killed. Mirrors the hosted edition's prompt. Fixes [#15](https://github.com/elicitly/elicitly/issues/15).
