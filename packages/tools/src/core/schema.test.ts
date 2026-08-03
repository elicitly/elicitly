import { describe, expect, it } from "vitest"
import { scalarSchema } from "./schema.js"

describe("scalarSchema", () => {
  it("builds a title-less enum object schema", () => {
    const schema = scalarSchema(["yes", "no"])
    expect(schema).toEqual({
      type: "object",
      properties: { value: { type: "string", enum: ["yes", "no"] } },
      required: ["value"],
    })
  })

  it("never includes a top-level title (Codex #31163 portability)", () => {
    const schema = scalarSchema(["ok"]) as Record<string, unknown>
    expect("title" in schema).toBe(false)
  })
})
