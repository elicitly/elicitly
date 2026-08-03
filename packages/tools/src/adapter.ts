import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { ClientView } from "./core/index.js"
import type { ClientInfoFn, ElicitFn } from "./types.js"

/**
 * Build the transport-agnostic `elicit` / `clientView` pair over an McpServer.
 * The negotiated protocol version is not retained by the SDK, so the caller
 * supplies it via `getProtocolVersion` (stdio apps capture it off the transport;
 * the hosted McpAgent owns its HTTP transport and may return null).
 */
export function makeElicitAdapter(
  server: McpServer,
  { getProtocolVersion }: { getProtocolVersion: () => string | null },
): { elicit: ElicitFn; clientView: ClientInfoFn } {
  const low = server.server

  const elicit: ElicitFn = async ({ message, requestedSchema, timeoutSeconds }) => {
    // Our ElicitSchema is intentionally generic raw JSON Schema (validator-agnostic);
    // the SDK types requestedSchema strictly, so cast at this single boundary.
    // timeoutSeconds is left undefined when the caller doesn't supply one (e.g.
    // doctor's direct probe call) so the SDK's own 60s default governs — the
    // more generous default lives in elicitForm, not here.
    const res = await low.elicitInput(
      { message, requestedSchema } as Parameters<typeof low.elicitInput>[0],
      timeoutSeconds !== undefined ? { timeout: timeoutSeconds * 1000 } : undefined,
    )
    if (res.action === "accept") {
      return { action: "accept", content: (res.content as Record<string, unknown>) ?? null }
    }
    return { action: res.action as "decline" | "cancel", content: null }
  }

  const clientView: ClientInfoFn = (): ClientView => ({
    // Echo the SDK-retained initialize data verbatim (see buildPassiveReport):
    // no reshaping, so the report compares 1:1 against a wire trace.
    clientInfo: low.getClientVersion?.() ?? null,
    protocolVersion: getProtocolVersion(),
    capabilities: (low.getClientCapabilities?.() ?? null) as ClientView["capabilities"],
    // getCapabilities() exists at runtime but is typed private in the SDK d.ts.
    serverCapabilities:
      (low as unknown as { getCapabilities?: () => unknown }).getCapabilities?.() ?? null,
  })

  return { elicit, clientView }
}
