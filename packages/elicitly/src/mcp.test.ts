import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js"
import type { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js"
import { describe, expect, it } from "vitest"
import { makeAdapter } from "./mcp.js"

function fakeTransport(sink: JSONRPCMessage[]): Transport {
  return {
    async start() {},
    async close() {},
    async send(message: JSONRPCMessage) {
      sink.push(message)
    },
  }
}

const initResponse = (version: string): JSONRPCMessage => ({
  jsonrpc: "2.0",
  id: 1,
  result: { protocolVersion: version, capabilities: {}, serverInfo: { name: "t", version: "0" } },
})

describe("makeAdapter protocol version capture", () => {
  it("reports null protocolVersion before initialization", () => {
    const server = new McpServer({ name: "t", version: "0" })
    const { clientView } = makeAdapter(server)
    expect(clientView().protocolVersion).toBeNull()
  })

  it("captures the negotiated protocolVersion from the initialize response", async () => {
    const server = new McpServer({ name: "t", version: "0" })
    const { clientView, captureSession } = makeAdapter(server)
    const sent: JSONRPCMessage[] = []
    const transport = fakeTransport(sent)
    captureSession(transport)

    await transport.send(initResponse("2025-11-25"))
    expect(clientView().protocolVersion).toBe("2025-11-25")

    // a later non-initialize response must not clobber it, and send still chains through
    await transport.send({ jsonrpc: "2.0", id: 2, result: {} })
    expect(clientView().protocolVersion).toBe("2025-11-25")
    expect(sent).toHaveLength(2)
  })
})
