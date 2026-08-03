import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { confirm } from "./confirm.js"
import type { ElicitSchema } from "./core/index.js"
import { doctor } from "./doctor.js"
import { elicitForm } from "./elicitForm.js"
import type { ClientInfoFn, ElicitFn } from "./types.js"

/**
 * Register the three form-mode tools (elicit_confirm, elicit_doctor, elicit_form) on an
 * McpServer. Shared by the Free (stdio) server and the Pro (hosted) McpAgent so
 * both expose the identical tool contract. Registration order is the wire
 * tools/list order (the SDK returns insertion order) — keep it alphabetical.
 */
export function registerFormTools(
  server: McpServer,
  deps: {
    elicit: ElicitFn
    clientView: ClientInfoFn
    serverInfo: { name: string; version: string }
  },
): void {
  const { elicit, clientView, serverInfo } = deps

  // One label rule everywhere: trimmed, 1-40 chars. The cap keeps a relabeled
  // button from becoming a persuasive paragraph; placement/styling stay fixed.
  const label = z.string().trim().min(1).max(40)

  server.registerTool(
    "elicit_confirm",
    {
      description:
        'Ask the user an OK/Cancel confirmation via elicitation (convenience wrapper over elicit_form), modeled on JavaScript\'s confirm(). `message` is the question shown to the user. Override labels.ok / labels.cancel to relabel or localize (e.g. labels: { ok: "Aceptar", cancel: "Cancelar" }); labels are capped at 40 characters. timeoutSeconds bounds how long to wait for the answer (default 300, clamped 60-3600).',
      inputSchema: {
        message: z.string(),
        labels: z.object({ ok: label.optional(), cancel: label.optional() }).strict().optional(),
        timeoutSeconds: z.number().optional(),
      },
    },
    async ({ message, labels, timeoutSeconds }) => ({
      content: [
        {
          type: "text",
          text: JSON.stringify(await confirm(elicit, message, { labels, timeoutSeconds })),
        },
      ],
    }),
  )

  server.registerTool(
    "elicit_doctor",
    {
      description:
        "Report the connected host's elicitation/sampling/roots support. initialize.request/response echo the handshake verbatim; support holds Elicitly's derived booleans; deprecations flags client features (sampling, roots, logging) moved to Deprecated in the MCP 2026-07-28 spec (SEP-2577); probeElicitation adds a live form-elicitation round-trip under probes.elicitationForm. Client-features background: https://modelcontextprotocol.io/docs/learn/client-concepts",
      inputSchema: { probeElicitation: z.boolean().optional() },
    },
    async ({ probeElicitation }) => ({
      content: [
        {
          type: "text",
          text: JSON.stringify(
            await doctor({ clientView, elicit, serverInfo }, probeElicitation ?? false),
          ),
        },
      ],
    }),
  )

  server.registerTool(
    "elicit_form",
    {
      description:
        "Trigger a form elicitation with a caller-supplied JSON schema; returns the raw {action, content}. requestedSchema uses the MCP elicitation subset of JSON Schema: https://modelcontextprotocol.io/specification/2025-11-25/client/elicitation#requested-schema. timeoutSeconds bounds how long to wait for the answer (default 300, clamped 60-3600) — raise it for forms with several fields.",
      inputSchema: {
        message: z.string(),
        requestedSchema: z.record(z.string(), z.unknown()),
        timeoutSeconds: z.number().optional(),
      },
    },
    async ({ message, requestedSchema, timeoutSeconds }) => ({
      content: [
        {
          type: "text",
          text: JSON.stringify(
            await elicitForm(
              elicit,
              message,
              requestedSchema as unknown as ElicitSchema,
              timeoutSeconds,
            ),
          ),
        },
      ],
    }),
  )
}
