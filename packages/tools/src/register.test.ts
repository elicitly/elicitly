import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { describe, expect, it, vi } from "vitest"
import { registerFormTools } from "./register.js"
import type { ClientInfoFn, ElicitFn } from "./types.js"

const clientView: ClientInfoFn = () => ({
  clientInfo: null,
  protocolVersion: null,
  capabilities: null,
})

/** A host that advertises form-mode elicitation — enables elicit_doctor's probe path. */
const advertisingView: ClientInfoFn = () => ({
  clientInfo: { name: "test-host", version: "1.0.0" },
  protocolVersion: "2025-11-25",
  capabilities: { elicitation: { form: {} } },
})

async function connect(elicit: ElicitFn, view: ClientInfoFn = clientView) {
  const server = new McpServer({ name: "t", version: "9.9.9" })
  registerFormTools(server, {
    elicit,
    clientView: view,
    serverInfo: { name: "t", version: "9.9.9" },
  })
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  const client = new Client({ name: "c", version: "0" })
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)])
  return client
}

async function callDoctor(client: Client, args: Record<string, unknown>) {
  const res = await client.callTool({ name: "elicit_doctor", arguments: args })
  return JSON.parse((res.content as { type: string; text: string }[])[0].text)
}

describe("registerFormTools", () => {
  it("registers exactly elicit_confirm, elicit_doctor, elicit_form — in alphabetical wire order", async () => {
    const client = await connect(async () => ({ action: "cancel", content: null }))
    const names = (await client.listTools()).tools.map((t) => t.name)
    expect(names).toEqual(["elicit_confirm", "elicit_doctor", "elicit_form"])
  })

  it("every tool ships title, annotations, outputSchema, and a description on every input property", async () => {
    const client = await connect(async () => ({ action: "cancel", content: null }))
    const { tools } = await client.listTools()
    for (const tool of tools) {
      expect(tool.title, tool.name).toBeTruthy()
      expect(tool.annotations?.openWorldHint, tool.name).toBe(false)
      expect(tool.outputSchema, tool.name).toBeDefined()
      const props = tool.inputSchema.properties as Record<string, { description?: string }>
      for (const [key, prop] of Object.entries(props)) {
        expect(prop.description, `${tool.name}.${key}`).toBeTruthy()
      }
    }
  })

  it("results carry structuredContent that passes the declared outputSchema", async () => {
    const client = await connect(async () => ({ action: "accept", content: { value: "ok" } }))
    await client.listTools() // caches outputSchemas → the client validates structuredContent below
    const res = await client.callTool({ name: "elicit_confirm", arguments: { message: "ok?" } })
    expect(res.structuredContent).toEqual({ confirmed: true })
    const form = await client.callTool({
      name: "elicit_form",
      arguments: { message: "m", requestedSchema: { type: "object", properties: {} } },
    })
    expect(form.structuredContent).toEqual({ action: "accept", content: { value: "ok" } })
    const doc = await client.callTool({ name: "elicit_doctor", arguments: {} })
    expect((doc.structuredContent as { support: object }).support).toMatchObject({
      elicitation: false,
    })
  })

  it("confirm round-trips an accepted OK to confirmed:true", async () => {
    const client = await connect(async () => ({ action: "accept", content: { value: "ok" } }))
    const res = await client.callTool({ name: "elicit_confirm", arguments: { message: "ok?" } })
    const text = (res.content as { type: string; text: string }[])[0].text
    expect(JSON.parse(text)).toEqual({ confirmed: true })
  })

  it("confirm forwards valid labels into the elicitation schema titles", async () => {
    let schema: unknown
    const client = await connect(async (args) => {
      schema = args.requestedSchema
      return { action: "accept", content: { value: "ok" } }
    })
    await client.callTool({
      name: "elicit_confirm",
      arguments: { message: "¿Borrar?", labels: { ok: "Aceptar", cancel: "Cancelar" } },
    })
    const oneOf = (
      schema as { properties: { value: { oneOf: Array<{ const: string; title: string }> } } }
    ).properties.value.oneOf
    expect(oneOf).toEqual([
      { const: "ok", title: "Aceptar" },
      { const: "cancel", title: "Cancelar" },
    ])
  })

  it.each([
    ["a label longer than 40 chars", { ok: "x".repeat(41) }],
    ["a whitespace-only label", { ok: "   " }],
    ["an unknown label key", { aprove: "Ship it" }],
    ["a non-string label", { ok: 7 }],
  ])("confirm rejects %s as a tool error", async (_name, labels) => {
    const client = await connect(async () => ({ action: "accept", content: { value: "ok" } }))
    const res = await client.callTool({
      name: "elicit_confirm",
      arguments: { message: "ok?", labels },
    })
    expect(res.isError).toBe(true)
  })

  it("elicit_doctor probeElicitation=true fires one real elicitation over the wire", async () => {
    const elicit = vi.fn(async () => ({
      action: "accept" as const,
      content: { value: "ok" },
    }))
    const client = await connect(elicit, advertisingView)
    const report = await callDoctor(client, { probeElicitation: true })
    expect(elicit).toHaveBeenCalledTimes(1)
    expect(report.probes.elicitationForm).toMatchObject({
      attempted: true,
      action: "accept",
      data: "ok",
      verdict: "working",
    })
  })

  it("elicit_doctor without probeElicitation stays passive — no probe, no prompt", async () => {
    const elicit = vi.fn(async () => ({ action: "accept" as const, content: { value: "ok" } }))
    const client = await connect(elicit, advertisingView)
    const report = await callDoctor(client, {})
    expect(elicit).not.toHaveBeenCalled()
    expect(report.probes).toBeUndefined()
    expect(report.support.elicitationForm).toBe(true)
  })

  it("elicit_doctor skips the probe when the client never advertised elicitation", async () => {
    const elicit = vi.fn(async () => ({ action: "accept" as const, content: { value: "ok" } }))
    const client = await connect(elicit) // default view: no capabilities
    const report = await callDoctor(client, { probeElicitation: true })
    expect(elicit).not.toHaveBeenCalled()
    expect(report.probes.elicitationForm).toEqual({
      attempted: false,
      reason: "client did not advertise elicitation",
    })
  })

  it("elicit_form forwards a caller-supplied timeoutSeconds, clamped, to elicit", async () => {
    let seen: number | undefined
    const client = await connect(async (args) => {
      seen = args.timeoutSeconds
      return { action: "accept", content: { ok: true } }
    })
    await client.callTool({
      name: "elicit_form",
      arguments: {
        message: "m",
        requestedSchema: { type: "object", properties: {} },
        timeoutSeconds: 999999,
      },
    })
    expect(seen).toBe(3600)
  })

  it("elicit_form defaults timeoutSeconds to 300 when the caller omits it", async () => {
    let seen: number | undefined
    const client = await connect(async (args) => {
      seen = args.timeoutSeconds
      return { action: "accept", content: {} }
    })
    await client.callTool({
      name: "elicit_form",
      arguments: { message: "m", requestedSchema: { type: "object", properties: {} } },
    })
    expect(seen).toBe(300)
  })
})
