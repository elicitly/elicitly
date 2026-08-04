# Elicitly — Free Edition

[![npm — elicitly](https://img.shields.io/npm/v/elicitly?label=elicitly)](https://www.npmjs.com/package/elicitly)
[![npm — @elicitly/tools](https://img.shields.io/npm/v/%40elicitly%2Ftools?label=%40elicitly%2Ftools)](https://www.npmjs.com/package/@elicitly/tools)

**Your AI has questions. Your users have answers.** Elicitly connects them —
human-in-the-loop for prompts and [Agent Skills](https://agentskills.io/) over
[MCP elicitation](https://modelcontextprotocol.io/docs/learn/client-concepts).

This repository is the open-source **Free Edition**: the `elicitly` local MCP
server and the `@elicitly/tools` library. The hosted **Pro Edition** — durable
approvals with review pages, an audit trail, and organization dashboards —
lives at [elicitly.ai](https://www.elicitly.ai).

## Quick start

Run the local (stdio) MCP server straight from npm — no clone, no config:

    npx -y elicitly

Register it in your MCP host (Claude Code shown; any stdio host works):

    claude mcp add elicitly -- npx -y elicitly

Then ask your agent to call `elicit_confirm` ("Ship it?"), `elicit_form`
(your own JSON schema), or `elicit_doctor` (does this host actually support
elicitation?).

## Packages

| Package | What it is |
| --- | --- |
| [`elicitly`](./packages/elicitly) | The local stdio MCP server (`npx -y elicitly`) |
| [`@elicitly/tools`](./packages/tools) | Embeddable toolkit: register the elicitation tools on **your own** `McpServer` |

## Why

MCP has a native answer for asking a human — elicitation — but host support is
inconsistent, and only an MCP *server* can trigger it. Nobody wants to roll
their own server just to ask a question. Elicitly is that server (or, via
`@elicitly/tools`, the toolkit inside yours), plus the diagnostic
(`elicit_doctor`) that makes real-world host support visible — feeding the
public [Support Matrix](https://www.elicitly.ai/docs/elicitation/support-matrix/).

## Develop

    pnpm install
    pnpm build        # tsdown builds both packages
    pnpm test         # vitest
    pnpm typecheck    # tsc
    pnpm check        # biome

## License

[Apache-2.0](./LICENSE)
