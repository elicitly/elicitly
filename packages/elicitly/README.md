# elicitly — the Free Edition local MCP server

A local (stdio) MCP server that makes **MCP elicitation** easy to use from any
prompt or Agent Skill — and its cross-host support visible.

## Tools

- **elicit_confirm** — an OK/Cancel confirmation modeled on JavaScript's
  `confirm()`; override `labels.ok`/`labels.cancel` to relabel or localize
  (e.g. `Aceptar`/`Cancelar`).
- **elicit_form** — fire a form elicitation with your own JSON schema
  ([`requestedSchema` subset](https://modelcontextprotocol.io/specification/2025-11-25/client/elicitation#requested-schema));
  returns the raw `{action, content}`.
- **elicit_doctor** — reports the connected host's support for the
  [client features](https://modelcontextprotocol.io/docs/learn/client-concepts)
  (elicitation *form* vs *url* mode, sampling, roots), and with
  `probeElicitation: true` runs one live elicitation round-trip and classifies
  the result (`working`, `advertised_but_broken`, `user_declined`,
  `unsupported`).

## Run it

    npx -y elicitly

Register it with any MCP host as a **stdio** server. In Claude Code:

    claude mcp add elicitly -- npx -y elicitly

or in a host config file (`.mcp.json` or client settings):

    {
      "mcpServers": {
        "elicitly": { "command": "npx", "args": ["-y", "elicitly"] }
      }
    }

## Exercise it

1. **elicit_doctor** — passive capability report, no user prompt. Check
   `support.elicitationForm` / `support.elicitationUrl`.
2. **elicit_doctor with `probeElicitation: true`** — one real elicitation
   round-trip; read `probes.elicitationForm.verdict`.
3. **elicit_confirm** — an OK/Cancel prompt (e.g. `message: "Ship it?"`).
4. **elicit_form** — your own JSON schema; inspect the raw `{action, content}`.

Full docs: [elicitly.ai/docs](https://www.elicitly.ai/docs/)

## From source

    pnpm install
    pnpm --filter elicitly build   # produces packages/elicitly/dist/cli.mjs
    claude mcp add elicitly -- node /absolute/path/to/packages/elicitly/dist/cli.mjs

## License

[Apache-2.0](../../LICENSE)
