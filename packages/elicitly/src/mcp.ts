import type { ClientInfoFn, ElicitFn } from "@elicitly/tools"
import { makeElicitAdapter } from "@elicitly/tools"
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js"

export function makeAdapter(server: McpServer): {
  elicit: ElicitFn
  clientView: ClientInfoFn
  instrumentTransport: (transport: Transport) => void
} {
  // The SDK computes the negotiated protocol version in _oninitialize but never
  // retains it, so we capture it ourselves from the outgoing initialize response.
  const session: { protocolVersion: string | null } = { protocolVersion: null }

  const { elicit, clientView } = makeElicitAdapter(server, {
    getProtocolVersion: () => session.protocolVersion,
  })

  // Wrap the transport's send to (1) record the negotiated protocol version
  // from the initialize response, and (2) correct the JSON Schema dialect on
  // tools/list results: SDK 1.30.0 hardcodes draft-07 as its zod-v4 conversion
  // target with no option exposed, but the MCP spec's dialect is 2020-12 and
  // strict clients (Claude Desktop's local-extension validator) reject the
  // draft-07 declaration outright. Our schemas use no draft-specific keywords
  // (asserted in mcp.test.ts), so only the declared dialect needs rewriting.
  // Must be called before `server.connect(transport)`.
  const instrumentTransport = (transport: Transport): void => {
    const originalSend = transport.send.bind(transport)
    transport.send = (message, options) => {
      const result = (message as { result?: { protocolVersion?: unknown; tools?: unknown } }).result
      if (result && typeof result.protocolVersion === "string") {
        session.protocolVersion = result.protocolVersion
      }
      if (result && Array.isArray(result.tools)) {
        for (const tool of result.tools as Array<
          Record<string, { $schema?: string } | undefined>
        >) {
          for (const key of ["inputSchema", "outputSchema"] as const) {
            const schema = tool[key]
            if (schema?.$schema === "http://json-schema.org/draft-07/schema#") {
              schema.$schema = "https://json-schema.org/draft/2020-12/schema"
            }
          }
        }
      }
      return originalSend(message, options)
    }
  }

  return { elicit, clientView, instrumentTransport }
}
