---
"elicitly": minor
---

New `contribute-fingerprint` MCP prompt (the server's first prompt — hosts that support prompts surface it, e.g. as a slash command in Claude Code): a guided flow that runs `elicit_doctor` with a live probe, shows the report, and prepares a pre-filled GitHub issue contributing the fingerprint to the public [Elicitation Support Matrix](https://www.elicitly.ai/docs/elicitation/support-matrix/) — one click to submit, nothing sent automatically. Free-edition counterpart of the hosted server's prompt (which shares directly via `elicit_doctor`'s `share: true`).
