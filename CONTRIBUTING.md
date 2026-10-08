# Contributing

Thanks for helping make MCP elicitation better for everyone.

## Setup

    pnpm install
    pnpm build && pnpm test && pnpm typecheck && pnpm check

All four gates must pass before a PR; CI runs the same commands.

## Making a change

- Include a changeset (`pnpm changeset`) with any change that should ship —
  both packages version in lockstep.
- `packages/tools/src/core/` is the SDK-free layer: nothing under it may
  import the MCP SDK, zod, or anything outside `core/`.
- The `elicitly` package bundles `@elicitly/tools` at build time; its manifest
  must never grow a runtime dependency on it.
- This repository is the Free Edition. Features of the hosted Pro Edition
  (approvals, review pages, dashboards — see https://www.elicitly.ai) are out
  of scope here.

## Testing in Claude Desktop

- **Local build:** register `packages/elicitly/dist/cli.mjs` as a stdio
  server in `claude_desktop_config.json` (use an absolute path to `node` —
  Claude Desktop doesn't inherit your shell's `PATH`), then quit and reopen
  Claude Desktop after each `pnpm build`.
- **Extension bundle:** `pnpm --filter elicitly build:mcpb`, then open
  `packages/elicitly/dist-mcpb/elicitly.mcpb`. Opening a bundle with the same
  version as the installed extension does **not** replace it — uninstall the
  extension first (Settings → Extensions → Elicitly → Uninstall).
- Tool definitions are loaded per conversation: after changing code or
  extension settings, test in a **new** chat.

## Host support reports

Found a host where elicitation is advertised but broken? Run `elicit_doctor`
with `probeElicitation: true` and contribute the report to the public
Support Matrix: https://www.elicitly.ai/docs/elicitation/support-matrix/

## License

By contributing, you agree that your contributions are licensed under the
[Apache License 2.0](./LICENSE), the same license that covers the project
(inbound = outbound).
