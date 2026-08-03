import { describe, expect, it, vi } from "vitest"
import { scalarSchema } from "./core/index.js"
import { elicitForm } from "./elicitForm.js"
import type { ElicitFn } from "./types.js"

const schema = scalarSchema(["ok"])

describe("elicitForm", () => {
  it("returns content verbatim on accept", async () => {
    const content = { name: "Widget", price: 9.99, enabled: true }
    const elicit: ElicitFn = vi.fn().mockResolvedValue({ action: "accept", content })
    expect(await elicitForm(elicit, "msg", schema)).toEqual({ action: "accept", content })
  })

  it("passes message and schema through untouched, defaulting timeoutSeconds to 300", async () => {
    const elicit = vi.fn().mockResolvedValue({ action: "accept", content: {} }) as ElicitFn
    await elicitForm(elicit, "hello", schema)
    expect(elicit).toHaveBeenCalledWith({
      message: "hello",
      requestedSchema: schema,
      timeoutSeconds: 300,
    })
  })

  it("forwards an explicit timeoutSeconds, clamped to [60, 3600]", async () => {
    const elicit = vi.fn().mockResolvedValue({ action: "accept", content: {} }) as ElicitFn
    await elicitForm(elicit, "hello", schema, 120)
    expect(elicit).toHaveBeenCalledWith({
      message: "hello",
      requestedSchema: schema,
      timeoutSeconds: 120,
    })

    await elicitForm(elicit, "hello", schema, 5)
    expect(elicit).toHaveBeenLastCalledWith({
      message: "hello",
      requestedSchema: schema,
      timeoutSeconds: 60,
    })

    await elicitForm(elicit, "hello", schema, 999999)
    expect(elicit).toHaveBeenLastCalledWith({
      message: "hello",
      requestedSchema: schema,
      timeoutSeconds: 3600,
    })
  })

  it("returns null content on decline/cancel", async () => {
    const elicit: ElicitFn = vi.fn().mockResolvedValue({ action: "cancel", content: null })
    expect(await elicitForm(elicit, "msg", schema)).toEqual({ action: "cancel", content: null })
  })

  it("degrades to error when elicit rejects", async () => {
    const elicit: ElicitFn = vi.fn().mockRejectedValue(new Error("Method not found"))
    expect(await elicitForm(elicit, "msg", schema)).toEqual({ action: "error", content: null })
  })
})
