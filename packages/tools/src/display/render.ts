import { Liquid } from "liquidjs"

/** Template source cap, in characters — same contract as the Pro review pages. */
export const MAX_TEMPLATE_CHARS = 32 * 1024

const engine = new Liquid({
  outputEscape: "escape",
  ownPropertyOnly: true,
  // JavaScript-style truthiness: 0/""/null/undefined/false are falsy (empty
  // arrays/objects stay truthy), matching how JS/TS template authors think
  // instead of Shopify Liquid's default where 0 and "" are truthy.
  jsTruthy: true,
  parseLimit: 100_000, // chars
  renderLimit: 1_000, // ms
  memoryLimit: 10_000_000,
})

export type RenderOutcome = { ok: true; html: string } | { ok: false; error: string }

/**
 * Render a caller template against `context`, exposed to the template under the
 * `context` key. Failures come back as a message (not a throw) so the tool can
 * hand the model something it can fix.
 */
export async function renderTemplate(template: string, context: unknown): Promise<RenderOutcome> {
  if (template.length > MAX_TEMPLATE_CHARS) {
    return { ok: false, error: `template exceeds ${MAX_TEMPLATE_CHARS} characters` }
  }
  try {
    return { ok: true, html: await engine.parseAndRender(template, { context: context ?? null }) }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}
