import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { MAX_TEMPLATE_CHARS, renderTemplate } from "./render.js"
import {
  buildViewHtml,
  DISPLAY_META_KEY,
  DISPLAY_VIEW_URI,
  displayCsp,
  MCP_APP_MIME_TYPE,
} from "./view.js"

/** Serialized `context` cap, in bytes — matches the Pro per-field payload limit. */
export const MAX_CONTEXT_BYTES = 64 * 1024

/** MCP Apps extension identifier a host advertises under `capabilities.extensions`. */
export const MCP_APPS_EXTENSION = "io.modelcontextprotocol/ui"

export type DisplayToolOptions = {
  /** Version string baked into the view (shown in logs). */
  version: string
  /** Origins added to the view's CSP `resourceDomains` (images, scripts, styles, fonts). */
  extraResourceDomains?: readonly string[]
}

/**
 * Register `elicit_display` and its MCP Apps view (`ui://elicitly/display`).
 *
 * The view is one static resource; each call renders the caller's LiquidJS
 * template server-side and returns the HTML under `_meta["elicitly/display"]`,
 * which hosts deliver to the view but keep out of the model's context. The
 * text content tells the model what happened — including when the host never
 * advertised MCP Apps support, so it can present the information another way.
 */
export function registerDisplayTool(server: McpServer, opts: DisplayToolOptions): void {
  const csp = displayCsp(opts.extraResourceDomains)
  const viewHtml = buildViewHtml(opts.version)

  server.registerResource(
    "elicitly_display_view",
    DISPLAY_VIEW_URI,
    {
      title: "Elicitly display view",
      description: "MCP Apps view that renders elicit_display results.",
      mimeType: MCP_APP_MIME_TYPE,
    },
    async () => ({
      contents: [
        {
          uri: DISPLAY_VIEW_URI,
          mimeType: MCP_APP_MIME_TYPE,
          text: viewHtml,
          _meta: { ui: { csp, prefersBorder: true } },
        },
      ],
    }),
  )

  server.registerTool(
    "elicit_display",
    {
      title: "Show the user rendered content",
      description: `Show information to the user as rendered HTML instead of Markdown: pass a LiquidJS template and a JSON context, and hosts that support MCP Apps render it inline in the conversation. Use it for tables, reports, and summaries the user should scan; it does not collect a decision (use elicit_confirm or elicit_form for that). Values interpolated with {{ context.* }} are HTML-escaped; truthiness is JavaScript-style. Templates may load Tailwind (https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4) and DaisyUI (https://cdn.jsdelivr.net/npm/daisyui@5) with their own <script>/<link> tags; the view follows the host's light/dark theme via data-theme. External images, scripts, styles, and fonts load only from: ${csp.resourceDomains.join(", ")} — anything else is blocked. Use data: URIs for images you already have that are not publicly reachable (generated, read from a local file, or from a private source the user gave you), passed in context rather than the template (64 KB vs 32 KB). Don't download a public image just to work around the allowlist: if its origin isn't allowed, leave it out and tell the user which origin to allow. The rendered HTML is not returned to you — the result only says whether it could be shown.`,
      inputSchema: {
        template: z
          .string()
          .min(1)
          .max(MAX_TEMPLATE_CHARS)
          .describe(
            `LiquidJS template producing an HTML fragment, rendered against {{ context.* }}. Max ${MAX_TEMPLATE_CHARS} characters.`,
          ),
        context: z
          .record(z.string(), z.unknown())
          .optional()
          .describe(
            `JSON data exposed to the template as \`context\`. Max ${MAX_CONTEXT_BYTES / 1024} KB serialized.`,
          ),
        title: z
          .string()
          .trim()
          .min(1)
          .max(120)
          .optional()
          .describe("Heading shown above the render."),
        summary: z
          .string()
          .trim()
          .min(1)
          .max(500)
          .optional()
          .describe(
            "One or two sentences describing what is shown; returned as the tool's text result.",
          ),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
      _meta: { ui: { resourceUri: DISPLAY_VIEW_URI } },
    },
    async ({ template, context, title, summary }) => {
      if (context && new TextEncoder().encode(JSON.stringify(context)).length > MAX_CONTEXT_BYTES) {
        return errorResult(`context exceeds ${MAX_CONTEXT_BYTES / 1024} KB serialized`)
      }
      const rendered = await renderTemplate(template, context)
      if (!rendered.ok) return errorResult(`template failed to render: ${rendered.error}`)

      const label = summary ?? (title ? `Displayed "${title}".` : "Displayed the rendered content.")
      const supported = hostSupportsApps(server)
      const text =
        supported === false
          ? `${label} However, this host did not advertise MCP Apps support, so the user may not see the render — present the key information in your reply as well.`
          : label
      return {
        content: [{ type: "text", text }],
        _meta: {
          [DISPLAY_META_KEY]: {
            title: title ?? null,
            html: rendered.html,
          },
        },
      }
    },
  )
}

/** true/false when the host's initialize capabilities are known; null when not. */
function hostSupportsApps(server: McpServer): boolean | null {
  const caps = server.server.getClientCapabilities()
  if (!caps) return null
  const ext = (caps as { extensions?: Record<string, unknown> }).extensions
  return Boolean(ext && MCP_APPS_EXTENSION in ext)
}

function errorResult(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true }
}
