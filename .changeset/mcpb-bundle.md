---
"elicitly": minor
---

Desktop-extension (MCPB) bundle: `pnpm --filter elicitly build:mcpb` stages and packs a fully self-contained `elicitly.mcpb` (manifest 0.3, all deps inlined, no node_modules), and the release workflow attaches it to each `elicitly@X.Y.Z` GitHub Release. Installable in Claude Desktop with one click; also unlocks Smithery's local-server (MCPB) listing path.
