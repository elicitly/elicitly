import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { describe, expect, it } from "vitest"
import { MAX_CONTEXT_BYTES, MCP_APPS_EXTENSION, registerDisplayTool } from "./register.js"
import { renderTemplate } from "./render.js"
import {
  buildFrameDocument,
  DISPLAY_META_KEY,
  DISPLAY_VIEW_URI,
  displayCsp,
  MCP_APP_MIME_TYPE,
} from "./view.js"

type Rendered = { title: string | null; html: string }

async function connect(opts: { apps?: boolean; extra?: string[] } = {}) {
  const server = new McpServer({ name: "t", version: "9.9.9" })
  registerDisplayTool(server, { version: "9.9.9", extraResourceDomains: opts.extra })
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  const client = new Client(
    { name: "c", version: "0" },
    {
      capabilities: opts.apps
        ? { extensions: { [MCP_APPS_EXTENSION]: { mimeTypes: [MCP_APP_MIME_TYPE] } } }
        : {},
    },
  )
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)])
  return client
}

async function display(client: Client, args: Record<string, unknown>) {
  const res = await client.callTool({ name: "elicit_display", arguments: args })
  const text = (res.content as { type: string; text: string }[])[0].text
  const rendered = (res._meta as Record<string, Rendered> | undefined)?.[DISPLAY_META_KEY]
  return { isError: res.isError === true, text, rendered }
}

describe("renderTemplate", () => {
  it("escapes interpolated values but keeps template markup", async () => {
    const r = await renderTemplate("<b>{{ context.name }}</b>", { name: "<script>x</script>" })
    expect(r).toEqual({ ok: true, html: "<b>&lt;script&gt;x&lt;/script&gt;</b>" })
  })

  it("uses JavaScript-style truthiness (0 and empty string are falsy)", async () => {
    const r = await renderTemplate("{% if context.n %}yes{% else %}no{% endif %}", { n: 0 })
    expect(r).toEqual({ ok: true, html: "no" })
  })

  it("reports parse errors as a message instead of throwing", async () => {
    const r = await renderTemplate("{% badtag %}", {})
    expect(r.ok).toBe(false)
  })
})

describe("displayCsp", () => {
  it("always allows jsDelivr and de-duplicates extra origins", () => {
    expect(displayCsp(["https://img.example.com", "https://cdn.jsdelivr.net"])).toEqual({
      resourceDomains: ["https://cdn.jsdelivr.net", "https://img.example.com"],
    })
  })
})

describe("buildFrameDocument", () => {
  it("wraps the render in a standalone document with the height reporter", () => {
    const doc = buildFrameDocument("<p>hi</p>")
    expect(doc.startsWith("<!doctype html>")).toBe(true)
    expect(doc).toContain("<p>hi</p>")
    expect(doc).toContain("elicitly:'height'")
    expect(doc).toContain("@layer elicitly-base{")
  })
})

describe("registerDisplayTool", () => {
  it("links elicit_display to the view through _meta.ui.resourceUri", async () => {
    const client = await connect()
    const tool = (await client.listTools()).tools.find((t) => t.name === "elicit_display")
    expect(tool?._meta).toEqual({ ui: { resourceUri: DISPLAY_VIEW_URI } })
    expect(tool?.annotations?.readOnlyHint).toBe(true)
  })

  it("names the allowed external origins in the tool description", async () => {
    const client = await connect({ extra: ["https://img.example.com"] })
    const tool = (await client.listTools()).tools.find((t) => t.name === "elicit_display")
    expect(tool?.description).toContain("https://cdn.jsdelivr.net, https://img.example.com")
  })

  it("serves the view as an MCP App resource with its CSP", async () => {
    const client = await connect({ extra: ["https://img.example.com"] })
    const { contents } = await client.readResource({ uri: DISPLAY_VIEW_URI })
    const [view] = contents as { mimeType: string; text: string; _meta: unknown }[]
    expect(view.mimeType).toBe(MCP_APP_MIME_TYPE)
    expect(view.text).toContain('"ui/initialize"')
    // The frame wrapper ships in the view, with its own </script> escaped.
    expect(view.text).toContain("@layer elicitly-base{")
    expect(view.text.match(/<\/script>/g)).toHaveLength(1)
    expect(view._meta).toEqual({
      ui: {
        csp: { resourceDomains: ["https://cdn.jsdelivr.net", "https://img.example.com"] },
        prefersBorder: true,
      },
    })
  })

  it("returns the render under _meta and a summary as text", async () => {
    const client = await connect({ apps: true })
    const r = await display(client, {
      template: "<ul>{% for i in context.items %}<li>{{ i }}</li>{% endfor %}</ul>",
      context: { items: ["a", "b"] },
      title: "Items",
    })
    expect(r.isError).toBe(false)
    expect(r.text).toBe('Displayed "Items".')
    expect(r.rendered?.title).toBe("Items")
    expect(r.rendered?.html).toBe("<ul><li>a</li><li>b</li></ul>")
    expect(Object.keys(r.rendered ?? {}).sort()).toEqual(["html", "title"])
  })

  it("prefers the caller's summary for the text result", async () => {
    const client = await connect({ apps: true })
    const r = await display(client, { template: "x", summary: "Three open invoices." })
    expect(r.text).toBe("Three open invoices.")
  })

  it("warns the model when the host did not advertise MCP Apps", async () => {
    const client = await connect({ apps: false })
    const r = await display(client, { template: "x" })
    expect(r.text).toContain("did not advertise MCP Apps support")
    expect(r.rendered).toBeDefined()
  })

  it("returns a tool error the model can fix when the template fails", async () => {
    const client = await connect({ apps: true })
    const r = await display(client, { template: "{% badtag %}" })
    expect(r.isError).toBe(true)
    expect(r.text).toMatch(/^template failed to render: /)
    expect(r.rendered).toBeUndefined()
  })

  it("rejects an oversized context", async () => {
    const client = await connect({ apps: true })
    const r = await display(client, {
      template: "x",
      context: { blob: "x".repeat(MAX_CONTEXT_BYTES) },
    })
    expect(r.isError).toBe(true)
    expect(r.text).toContain("context exceeds")
  })
})
