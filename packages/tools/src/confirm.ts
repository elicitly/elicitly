import type { ElicitSchema } from "./core/index.js"
import { elicitForm } from "./elicitForm.js"
import type { ElicitFn } from "./types.js"

export type ConfirmOptions = {
  labels?: { ok?: string; cancel?: string }
  timeoutSeconds?: number
}

export type ConfirmResult = {
  confirmed: boolean | null
  /** Present only when `confirmed` is null: why no answer was obtained. */
  reason?: "dismissed" | "error"
}

/**
 * Modeled on JavaScript's window.confirm(): OK/Cancel by default, with label
 * overrides. Deliberate deviation: the result stays three-state — an explicit
 * Cancel choice is `confirmed: false` (as is declining the elicitation), while
 * a dismissed/errored elicitation is `confirmed: null` — where JS collapses
 * all of these to false. The MCP-level action is deliberately not echoed:
 * `action: "accept"` beside `confirmed: false` invites misreading, and which
 * control carried the "no" has no caller value.
 */
export async function confirm(
  elicit: ElicitFn,
  message: string,
  options: ConfirmOptions = {},
): Promise<ConfirmResult> {
  const okLabel = options.labels?.ok ?? "OK"
  const cancelLabel = options.labels?.cancel ?? "Cancel"
  const requestedSchema: ElicitSchema = {
    type: "object",
    properties: {
      value: {
        type: "string",
        oneOf: [
          { const: "ok", title: okLabel },
          { const: "cancel", title: cancelLabel },
        ],
      },
    },
    required: ["value"],
  }

  const result = await elicitForm(elicit, message, requestedSchema, options.timeoutSeconds)
  if (result.action === "accept") {
    return { confirmed: result.content?.value === "ok" }
  }
  if (result.action === "cancel") {
    return { confirmed: null, reason: "dismissed" }
  }
  if (result.action === "error") {
    return { confirmed: null, reason: "error" }
  }
  return { confirmed: false }
}
