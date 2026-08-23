---
"@elicitly/tools": patch
---

`elicit_doctor`'s live probe now bounds its own elicitation timeout to 40s (`PROBE_TIMEOUT_S`), below the ~60s tool-call limit common to MCP hosts. Previously the probe inherited the SDK's 60s default and raced the host limit, so on hosts like Claude Desktop the finished `advertised_but_unanswered` report never returned in-band — the host killed the call first. The report now completes and returns within the host window. Fixes [#14](https://github.com/elicitly/elicitly/issues/14).
