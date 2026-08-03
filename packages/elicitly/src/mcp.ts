import type { ClientInfoFn, ElicitFn } from "@elicitly/tools"
import { makeElicitAdapter } from "@elicitly/tools"
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js"

export function makeAdapter(server: McpServer): {
  elicit: ElicitFn
  clientView: ClientInfoFn
  captureSession: (transport: Transport) => void
} {
  // The SDK computes the negotiated protocol version in _oninitialize but never
  // retains it, so we capture it ourselves from the outgoing initialize response.
  const session: { protocolVersion: string | null } = { protocolVersion: null }

  const { elicit, clientView } = makeElicitAdapter(server, {
    getProtocolVersion: () => session.protocolVersion,
  })

  // Wrap the transport's send to record the negotiated protocol version from the
  // initialize response. Must be called before `server.connect(transport)`.
  const captureSession = (transport: Transport): void => {
    const originalSend = transport.send.bind(transport)
    transport.send = (message, options) => {
      const result = (message as { result?: { protocolVersion?: unknown } }).result
      if (result && typeof result.protocolVersion === "string") {
        session.protocolVersion = result.protocolVersion
      }
      return originalSend(message, options)
    }
  }

  return { elicit, clientView, captureSession }
}
