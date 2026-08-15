import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      include: ["src/**"],
      reporter: ["text", "html"],
      thresholds: { statements: 90, branches: 90, functions: 90, lines: 90 },
    },
  },
})
