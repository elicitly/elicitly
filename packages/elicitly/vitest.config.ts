import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      // cli.ts is the stdio bootstrap — side effects only, exercised by hand
      // and by hosts, not unit-testable without spawning a process.
      include: ["src/**"],
      exclude: ["src/cli.ts"],
      reporter: ["text", "html", "lcov"],
      thresholds: { statements: 90, branches: 90, functions: 90, lines: 90 },
    },
  },
})
