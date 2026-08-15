import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { describe, expect, it } from "vitest"
import { buildServer } from "./server.js"

describe("buildServer", () => {
  it("assembles an McpServer with the elicitation tools registered", () => {
    const { server, captureSession } = buildServer("0.0.0-test")
    expect(server).toBeInstanceOf(McpServer)
    expect(typeof captureSession).toBe("function")
    const registered = Object.keys(
      (server as unknown as { _registeredTools: Record<string, unknown> })._registeredTools,
    )
    expect(registered).toEqual(
      expect.arrayContaining(["elicit_confirm", "elicit_form", "elicit_doctor"]),
    )
  })
})
