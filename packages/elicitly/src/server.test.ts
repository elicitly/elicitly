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

describe("contribute-fingerprint prompt", () => {
  it("is registered with its title and walks the GitHub-issue contribution flow", async () => {
    const { Client } = await import("@modelcontextprotocol/sdk/client/index.js")
    const { InMemoryTransport } = await import("@modelcontextprotocol/sdk/inMemory.js")
    const { server } = buildServer("0.0.0-test")
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
    const client = new Client({ name: "c", version: "0" })
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)])

    const prompts = (await client.listPrompts()).prompts
    expect(prompts).toHaveLength(1)
    expect(prompts[0]).toMatchObject({
      name: "contribute-fingerprint",
      title: "Contribute a fingerprint",
    })

    const got = await client.getPrompt({ name: "contribute-fingerprint" })
    const text = (got.messages[0]?.content as { text: string } | undefined)?.text ?? ""
    // Free-edition flow: probe + pre-filled GitHub issue, never an automatic send.
    expect(text).toContain("probeElicitation: true")
    expect(text).toContain("github.com/elicitly/elicitly/issues/new")
    expect(text).toContain("nothing is ever sent")
    expect(text).not.toContain("share: true")
    // Hardening (#15): provenance preamble (defuses the injection read when a
    // host delivers the prompt as an attachment) and timeout-as-signal.
    expect(text).toContain("user-initiated")
    expect(text).toContain("advertised_but_unanswered")
    expect(text).toContain("probeElicitation: false")
    // The archived JSON goes into the issue pretty-printed so a human can read it.
    expect(text).toContain("pretty-printed")
  })
})
