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
