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
    const { clientView, instrumentTransport } = makeAdapter(server)
    const sent: JSONRPCMessage[] = []
    const transport = fakeTransport(sent)
    instrumentTransport(transport)

    await transport.send(initResponse("2025-11-25"))
    expect(clientView().protocolVersion).toBe("2025-11-25")

    // a later non-initialize response must not clobber it, and send still chains through
    await transport.send({ jsonrpc: "2.0", id: 2, result: {} })
    expect(clientView().protocolVersion).toBe("2025-11-25")
    expect(sent).toHaveLength(2)
  })
})

describe("tools/list JSON Schema dialect rewrite", () => {
  it("serves 2020-12 (never draft-07) and no draft-specific keywords", async () => {
    // Exercise the real pipeline: registered zod schemas → SDK conversion →
    // instrumented transport. SDK 1.30.0 hardcodes draft-07 as its zod-v4
    // target; the wrapper must correct the declared dialect on the way out,
    // and the rewrite is only sound while our schemas avoid keywords whose
    // meaning differs between the dialects — so both are asserted here.
    const { buildServer } = await import("./server.js")
    const { server, instrumentTransport } = buildServer("0.0.0-test")
    const sent: JSONRPCMessage[] = []
    const transport = fakeTransport(sent)
    instrumentTransport(transport)
    await server.connect(transport)
    // onmessage dispatches without returning the response promise; yield to
    // the microtask queue after each message so the reply lands in `sent`.
    const tick = () => new Promise((resolve) => setTimeout(resolve, 0))
    transport.onmessage?.({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-11-25",
        capabilities: {},
        clientInfo: { name: "t", version: "0" },
      },
    })
    await tick()
    transport.onmessage?.({ jsonrpc: "2.0", method: "notifications/initialized" })
    transport.onmessage?.({ jsonrpc: "2.0", id: 2, method: "tools/list" })
    await tick()

    const listResponse = sent.find((m) => "id" in m && m.id === 2) as unknown as {
      result: { tools: Array<Record<string, unknown>> }
    }
    const tools = listResponse.result.tools
    expect(tools.length).toBeGreaterThan(0)

    const draftSpecific = new Set(["definitions", "dependencies", "additionalItems"])
    const walk = (node: unknown): void => {
      if (Array.isArray(node)) for (const v of node) walk(v)
      if (typeof node !== "object" || node === null) return
      for (const [k, v] of Object.entries(node)) {
        expect(draftSpecific.has(k), `draft-specific keyword "${k}"`).toBe(false)
        if (k === "items") expect(Array.isArray(v), "array-form items").toBe(false)
        walk(v)
      }
    }
    for (const tool of tools) {
      for (const key of ["inputSchema", "outputSchema"]) {
        const schema = tool[key] as { $schema?: string } | undefined
        if (!schema) continue
        expect(schema.$schema, `${tool.name} ${key}`).not.toContain("draft-07")
        if (schema.$schema) {
          expect(schema.$schema).toBe("https://json-schema.org/draft/2020-12/schema")
        }
        walk(schema)
      }
    }
  })
})
