---
"@elicitly/tools": minor
"elicitly": minor
---

`elicit_doctor`: the fast-cancel probe verdict is now
`advertised_but_autocanceled` (was `advertised_but_broken`) and the
human-implausibility threshold is 2000ms (was 250ms). Field data forced both:
Claude Code 2.1.223 auto-cancels streamable-HTTP elicitation at ~1.5s measured
server-side (network latency the 250ms local-stdio bound never accounted for),
which the old classifier misreported as `user_declined` — blaming a human for
a dismissal no human ever saw. The new name is also more precise: the host
processed the request and refused it; nothing about the wire is broken.
