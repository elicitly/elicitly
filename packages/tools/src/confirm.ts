import type { ElicitSchema } from "./core/index.js"
import { elicitForm } from "./elicitForm.js"
import type { ElicitFn } from "./types.js"

export type ConfirmOptions = {
  labels?: { ok?: string; cancel?: string }
  timeoutSeconds?: number
}

export type ConfirmResult = {
  confirmed: boolean | null
  action?: "accept" | "decline" | "cancel" | "error"
  message?: string
}

/**
 * Modeled on JavaScript's window.confirm(): OK/Cancel by default, with label
 * overrides. Deliberate deviation: the result stays three-state — an explicit
 * Cancel choice is `confirmed: false`, while a dismissed/errored elicitation is
 * `confirmed: null` — where JS collapses both to false.
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
    return { confirmed: result.content?.value === "ok", action: "accept" }
  }
  if (result.action === "cancel") {
    return { confirmed: null, action: "cancel", message }
  }
  if (result.action === "error") {
    return { confirmed: null, action: "error", message }
  }
  return { confirmed: false, action: "decline" }
}
