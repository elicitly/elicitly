import type { ElicitSchema } from "./core/index.js"
import { clampTimeoutSeconds } from "./timeout.js"
import type { ElicitFn } from "./types.js"

export type ElicitFormResult =
  | { action: "accept"; content: Record<string, unknown> | null }
  | { action: "decline" | "cancel" | "error"; content: null }

export async function elicitForm(
  elicit: ElicitFn,
  message: string,
  requestedSchema: ElicitSchema,
  timeoutSeconds?: number,
): Promise<ElicitFormResult> {
  try {
    const result = await elicit({
      message,
      requestedSchema,
      timeoutSeconds: clampTimeoutSeconds(timeoutSeconds),
    })
    if (result.action === "accept") {
      return { action: "accept", content: result.content }
    }
    return { action: result.action, content: null }
  } catch {
    return { action: "error", content: null }
  }
}
