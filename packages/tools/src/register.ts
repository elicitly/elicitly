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
 *
 * Results carry both `structuredContent` (validated against each tool's
 * outputSchema) and the same JSON as text content, for hosts that read only one.
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
      title: "Ask the user to confirm (OK/Cancel)",
      description:
        'Ask the user an OK/Cancel confirmation via elicitation (convenience wrapper over elicit_form), modeled on JavaScript\'s confirm(). Use this for a single yes/no question; use elicit_form to collect arbitrary fields. Returns three-state {confirmed}: true = proceed, false = a human explicitly said no, null = no answer was obtained (reason: "dismissed" | "error") — ask again later.',
      inputSchema: {
        message: z
          .string()
          .describe("The yes/no question shown to the user in the host's elicitation dialog."),
        labels: z
          .object({
            ok: label.optional().describe('Replacement label for the OK button (e.g. "Aceptar").'),
            cancel: label
              .optional()
              .describe('Replacement label for the Cancel button (e.g. "Cancelar").'),
          })
          .strict()
          .optional()
          .describe(
            "Relabel or localize the OK/Cancel buttons. Each label is trimmed, 1-40 characters; unknown keys are rejected. Button placement and styling stay fixed.",
          ),
        timeoutSeconds: z
          .number()
          .optional()
          .describe("How long to wait for the answer, in seconds (default 300, clamped 60-3600)."),
      },
      outputSchema: {
        confirmed: z
          .boolean()
          .nullable()
          .describe(
            "true = the user chose OK; false = an explicit no (Cancel choice or declined elicitation); null = no answer was obtained.",
          ),
        reason: z
          .enum(["dismissed", "error"])
          .optional()
          .describe(
            'Present only when confirmed is null: "dismissed" = the elicitation was closed unanswered (including timeout), "error" = it failed.',
          ),
      },
      annotations: { destructiveHint: false, openWorldHint: false },
    },
    async ({ message, labels, timeoutSeconds }) => {
      const result = await confirm(elicit, message, { labels, timeoutSeconds })
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
        structuredContent: result,
      }
    },
  )

  server.registerTool(
    "elicit_doctor",
    {
      title: "Diagnose the host's elicitation support",
      description:
        "Report the connected host's elicitation/sampling/roots support. initialize.request/response echo the handshake verbatim; support holds Elicitly's derived booleans; deprecations flags client features (sampling, roots, logging) moved to Deprecated in the MCP 2026-07-28 spec (SEP-2577); probeElicitation adds a live form-elicitation round-trip under probes.elicitationForm. Client-features background: https://modelcontextprotocol.io/docs/learn/client-concepts",
      inputSchema: {
        probeElicitation: z
          .boolean()
          .optional()
          .describe(
            "Also fire one live form-elicitation round-trip (the user may see a dialog) and report the outcome under probes.elicitationForm. Default false: passive capability report only, no prompt.",
          ),
      },
      outputSchema: {
        initialize: z
          .record(z.string(), z.unknown())
          .describe(
            "The MCP initialize handshake echoed verbatim: { request: { clientInfo, capabilities }, response: { protocolVersion, capabilities, serverInfo } }.",
          ),
        support: z
          .object({
            elicitation: z.boolean(),
            elicitationForm: z.boolean(),
            elicitationUrl: z.boolean(),
            sampling: z.boolean(),
            roots: z.boolean(),
          })
          .describe(
            "Elicitly's derived support booleans, inferred from the advertised capabilities.",
          ),
        deprecations: z
          .array(z.record(z.string(), z.unknown()))
          .describe(
            "Spec-level deprecation advisories (MCP 2026-07-28, SEP-2577) for the client features the report surfaces.",
          ),
        probes: z
          .object({ elicitationForm: z.record(z.string(), z.unknown()) })
          .optional()
          .describe(
            "Present only when probeElicitation was true: the live round-trip's attempted/action/latencyMs/verdict.",
          ),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ probeElicitation }) => {
      const report = await doctor({ clientView, elicit, serverInfo }, probeElicitation ?? false)
      return {
        content: [{ type: "text", text: JSON.stringify(report) }],
        structuredContent: report,
      }
    },
  )

  server.registerTool(
    "elicit_form",
    {
      title: "Ask the user to fill a form",
      description:
        "Trigger a form elicitation with a caller-supplied JSON schema; returns the raw {action, content}. For a plain OK/Cancel question, prefer elicit_confirm. MUST NOT be used to request secrets, credentials, or other sensitive information.",
      inputSchema: {
        message: z.string().describe("The instruction shown to the user above the form fields."),
        requestedSchema: z
          .record(z.string(), z.unknown())
          .describe(
            "JSON Schema for the form, restricted to the MCP elicitation requestedSchema subset: a flat object whose properties are strings, numbers/integers, booleans, or enums — no nested objects, arrays of objects, $ref, or allOf. See https://modelcontextprotocol.io/specification/2025-11-25/client/elicitation#requested-schema",
          ),
        timeoutSeconds: z
          .number()
          .optional()
          .describe(
            "How long to wait for the answer, in seconds (default 300, clamped 60-3600) — raise it for forms with several fields.",
          ),
      },
      outputSchema: {
        action: z
          .enum(["accept", "decline", "cancel", "error"])
          .describe(
            "accept = the user submitted the form; decline = an explicit no; cancel = dismissed unanswered (including timeout); error = the elicitation failed.",
          ),
        content: z
          .record(z.string(), z.unknown())
          .nullable()
          .describe(
            "On accept, the submitted values keyed by requestedSchema property name; null for every other action.",
          ),
      },
      annotations: { destructiveHint: false, openWorldHint: false },
    },
    async ({ message, requestedSchema, timeoutSeconds }) => {
      const result = await elicitForm(
        elicit,
        message,
        requestedSchema as unknown as ElicitSchema,
        timeoutSeconds,
      )
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
        structuredContent: result,
      }
    },
  )
}
