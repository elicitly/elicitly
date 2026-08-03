export type ElicitSchema = {
  type: "object"
  properties: Record<string, unknown>
  required?: string[]
}

export function scalarSchema(options: string[]): ElicitSchema {
  return {
    type: "object",
    properties: { value: { type: "string", enum: options } },
    required: ["value"],
  }
}
