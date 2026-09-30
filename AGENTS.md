# AGENTS.md

This is the open-source Elicitly **Free Edition**: `packages/elicitly` (the
local stdio MCP server published as `elicitly`) and `packages/tools` (the
embeddable `@elicitly/tools` toolkit). The hosted Pro Edition lives in a
separate private repository — nothing here may depend on it or reference its
internals.

- Gates before any push: `pnpm build && pnpm test && pnpm typecheck && pnpm check`.
- `packages/tools/src/core/` is the SDK-free layer: nothing under it may
  import the MCP SDK, zod, or anything outside `core/`.
- The published CLI bundles `@elicitly/tools` (tsdown `alwaysBundle`) — the
  `elicitly` manifest must never grow a runtime dependency on it.
- Releases go through Changesets (`pnpm changeset`), lockstep 0.x across both
  packages.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
