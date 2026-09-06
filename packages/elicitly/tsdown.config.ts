import { defineConfig } from "tsdown"

export default defineConfig([
  // npm artifact: runtime deps stay external (installed by npm).
  {
    entry: ["src/cli.ts"],
    format: ["esm"],
    target: "node22",
    // Bundle the private workspace lib into the published CLI:
    deps: { alwaysBundle: ["@elicitly/tools"] },
    clean: true,
  },
  // MCPB artifact: fully self-contained — the desktop-extension bundle ships no
  // node_modules, so every dependency is inlined. Staged and packed by
  // scripts/build-mcpb.mjs (see `build:mcpb`).
  {
    entry: ["src/cli.ts"],
    format: ["esm"],
    target: "node22",
    outDir: "dist-mcpb",
    deps: { alwaysBundle: [/./], onlyBundle: false },
    clean: true,
  },
])
