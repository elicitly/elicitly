import type { ClientView, ElicitSchema } from "./core/index.js"

export type ElicitResult =
  | { action: "accept"; content: Record<string, unknown> | null }
  | { action: "decline" | "cancel"; content: null }

export type ElicitFn = (args: {
  message: string
  requestedSchema: ElicitSchema
  /** How long to hold the request open awaiting a human answer, in seconds. */
  timeoutSeconds?: number
}) => Promise<ElicitResult>

export type ClientInfoFn = () => ClientView
