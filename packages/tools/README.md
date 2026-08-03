# @elicitly/tools

Embeddable **MCP elicitation toolkit**: put the Elicitly tools —
`elicit_confirm`, `elicit_form`, `elicit_doctor` — on your **own** `McpServer`,
with the elicitation-schema types and the capability report/probe layer they
build on.

```ts
import { makeElicitAdapter, registerFormTools } from "@elicitly/tools"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

const server = new McpServer({ name: "my-server", version: "1.0.0" })
const { elicit, clientView } = makeElicitAdapter(server, {
  getProtocolVersion: () => null,
})
registerFormTools(server, {
  elicit,
  clientView,
  serverInfo: { name: "my-server", version: "1.0.0" },
})
```

Your server now exposes the three elicitation tools with the same wire
contract as [`elicitly`](https://www.npmjs.com/package/elicitly) — dialogs
rendered by the connected host, results returned as typed JSON.

## What's inside

- `registerFormTools(server, deps)` — registers `elicit_confirm`,
  `elicit_doctor`, `elicit_form` (alphabetical wire order).
- `makeElicitAdapter(server, opts)` — bridges an `McpServer` to the injected
  `elicit` function the tools use (SDK-coupled edge, kept in one place).
- `confirm` / `elicitForm` / `doctor` — the tool handlers themselves,
  SDK-agnostic and unit-tested; use them directly for custom registration.
- `core/` (re-exported) — the SDK-free layer: elicitation-schema types
  (`ElicitSchema`, `scalarSchema`) and the passive capability report + probe
  classification (`buildPassiveReport`, `classifyProbe`).

## License

[Apache-2.0](../../LICENSE)
