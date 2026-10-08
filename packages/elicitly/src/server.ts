import { registerDisplayTool, registerFormTools } from "@elicitly/tools"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { makeAdapter } from "./mcp.js"
import { contributeFingerprintMessages, contributeFingerprintPrompt } from "./prompts.js"

/** Extra origins for elicit_display's view CSP, from a comma-separated env var.
 * Only https origins are accepted; anything else is dropped. */
export function displayResourceDomains(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((d) => d.trim())
    .filter((d) => /^https:\/\/[^/\s]+$/.test(d))
}

export function buildServer(version: string): {
  server: McpServer
  instrumentTransport: ReturnType<typeof makeAdapter>["instrumentTransport"]
} {
  const server = new McpServer({ name: "elicitly", version })
  const { elicit, clientView, instrumentTransport } = makeAdapter(server)
  registerFormTools(server, { elicit, clientView, serverInfo: { name: "elicitly", version } })
  registerDisplayTool(server, {
    version,
    extraResourceDomains: displayResourceDomains(process.env.ELICITLY_DISPLAY_RESOURCE_DOMAINS),
  })
  server.registerPrompt(
    contributeFingerprintPrompt.name,
    {
      title: contributeFingerprintPrompt.title,
      description: contributeFingerprintPrompt.description,
    },
    () => contributeFingerprintMessages(),
  )
  return { server, instrumentTransport }
}
