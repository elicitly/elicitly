---
"elicitly": patch
---

Serve tool schemas as JSON Schema 2020-12 (the MCP spec dialect). SDK 1.30.0 hardcodes draft-07 as its zod-v4 conversion target, which strict clients — Claude Desktop's local-extension validator among them — reject with "unsupported dialect", breaking every tool call from the MCPB install. The transport wrapper now corrects the declared dialect on tools/list; a test asserts the served schemas use no keywords whose meaning differs between the dialects.
