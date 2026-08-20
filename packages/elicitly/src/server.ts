import { registerFormTools } from "@elicitly/tools"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { makeAdapter } from "./mcp.js"
import { contributeFingerprintMessages, contributeFingerprintPrompt } from "./prompts.js"

export function buildServer(version: string): {
  server: McpServer
  captureSession: ReturnType<typeof makeAdapter>["captureSession"]
} {
  const server = new McpServer({ name: "elicitly", version })
  const { elicit, clientView, captureSession } = makeAdapter(server)
  registerFormTools(server, { elicit, clientView, serverInfo: { name: "elicitly", version } })
  server.registerPrompt(
    contributeFingerprintPrompt.name,
    {
      title: contributeFingerprintPrompt.title,
      description: contributeFingerprintPrompt.description,
    },
    () => contributeFingerprintMessages(),
  )
  return { server, captureSession }
}
