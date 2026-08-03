import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { describe, expect, it, vi } from "vitest"
import { makeElicitAdapter } from "./adapter.js"

describe("makeElicitAdapter", () => {
  it("clientView reads protocolVersion from the injected getter", () => {
    const server = new McpServer({ name: "t", version: "0" })
    let version: string | null = null
    const { clientView } = makeElicitAdapter(server, { getProtocolVersion: () => version })
    expect(clientView().protocolVersion).toBeNull()
    version = "2025-11-25"
    expect(clientView().protocolVersion).toBe("2025-11-25")
  })

  it("elicit returns accepted content verbatim", async () => {
    const server = new McpServer({ name: "t", version: "0" })
    const content = { value: "ok" }
    vi.spyOn(server.server, "elicitInput").mockResolvedValue({ action: "accept", content })
    const { elicit } = makeElicitAdapter(server, { getProtocolVersion: () => null })
    expect(
      await elicit({ message: "m", requestedSchema: { type: "object", properties: {} } }),
    ).toEqual({
      action: "accept",
      content,
    })
  })

  it("elicit normalizes decline/cancel to null content", async () => {
    const server = new McpServer({ name: "t", version: "0" })
    vi.spyOn(server.server, "elicitInput").mockResolvedValue({ action: "cancel" })
    const { elicit } = makeElicitAdapter(server, { getProtocolVersion: () => null })
    expect(
      await elicit({ message: "m", requestedSchema: { type: "object", properties: {} } }),
    ).toEqual({
      action: "cancel",
      content: null,
    })
  })

  it("elicit converts timeoutSeconds to a millisecond RequestOptions.timeout", async () => {
    const server = new McpServer({ name: "t", version: "0" })
    const spy = vi
      .spyOn(server.server, "elicitInput")
      .mockResolvedValue({ action: "accept", content: {} })
    const { elicit } = makeElicitAdapter(server, { getProtocolVersion: () => null })
    await elicit({
      message: "m",
      requestedSchema: { type: "object", properties: {} },
      timeoutSeconds: 120,
    })
    expect(spy).toHaveBeenCalledWith(expect.anything(), { timeout: 120000 })
  })

  it("elicit omits the timeout override when timeoutSeconds is not given (SDK default applies)", async () => {
    const server = new McpServer({ name: "t", version: "0" })
    const spy = vi
      .spyOn(server.server, "elicitInput")
      .mockResolvedValue({ action: "accept", content: {} })
    const { elicit } = makeElicitAdapter(server, { getProtocolVersion: () => null })
    await elicit({ message: "m", requestedSchema: { type: "object", properties: {} } })
    expect(spy).toHaveBeenCalledWith(expect.anything(), undefined)
  })
})
