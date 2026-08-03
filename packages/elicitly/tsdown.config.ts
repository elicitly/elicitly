import { defineConfig } from "tsdown"

export default defineConfig({
  entry: ["src/cli.ts"],
  format: ["esm"],
  target: "node22",
  // Bundle the private workspace lib into the published CLI:
  deps: { alwaysBundle: ["@elicitly/tools"] },
  clean: true,
})
