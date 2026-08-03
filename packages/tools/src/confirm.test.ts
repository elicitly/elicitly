import { describe, expect, it, vi } from "vitest"
import { confirm } from "./confirm.js"
import type { ElicitFn } from "./types.js"

type SchemaArg = {
  message: string
  requestedSchema: { properties: { value: { oneOf: Array<{ const: string; title: string }> } } }
}
const firstArg = (fn: unknown) => (fn as { mock: { calls: SchemaArg[][] } }).mock.calls[0][0]

describe("elicit_confirm", () => {
  it("builds a title-less schema with ok/cancel consts and OK/Cancel default labels", async () => {
    const elicit = vi
      .fn()
      .mockResolvedValue({ action: "accept", content: { value: "ok" } }) as ElicitFn
    await confirm(elicit, "Delete file?")
    const arg = firstArg(elicit)
    expect("title" in arg.requestedSchema).toBe(false)
    expect(arg.requestedSchema.properties.value.oneOf).toEqual([
      { const: "ok", title: "OK" },
      { const: "cancel", title: "Cancel" },
    ])
  })

  it("supports localized labels while keeping stable ok/cancel values", async () => {
    const elicit = vi
      .fn()
      .mockResolvedValue({ action: "accept", content: { value: "cancel" } }) as ElicitFn
    const res = await confirm(elicit, "¿Borrar archivo?", {
      labels: { ok: "Aceptar", cancel: "Cancelar" },
    })
    const arg = firstArg(elicit)
    expect(arg.requestedSchema.properties.value.oneOf).toEqual([
      { const: "ok", title: "Aceptar" },
      { const: "cancel", title: "Cancelar" },
    ])
    expect(res).toEqual({ confirmed: false, action: "accept" })
  })

  it("forwards timeoutSeconds to elicit, clamped like elicit_form", async () => {
    const elicit = vi
      .fn()
      .mockResolvedValue({ action: "accept", content: { value: "ok" } }) as ElicitFn
    await confirm(elicit, "Delete file?", { timeoutSeconds: 30 })
    const arg = firstArg(elicit) as unknown as { timeoutSeconds: number }
    expect(arg.timeoutSeconds).toBe(60)
  })

  it("ok => confirmed true", async () => {
    const elicit: ElicitFn = vi
      .fn()
      .mockResolvedValue({ action: "accept", content: { value: "ok" } })
    expect(await confirm(elicit, "Delete file?")).toEqual({ confirmed: true, action: "accept" })
  })

  it("decline => confirmed false with action decline", async () => {
    const elicit: ElicitFn = vi.fn().mockResolvedValue({ action: "decline", content: null })
    expect(await confirm(elicit, "Delete file?")).toEqual({
      confirmed: false,
      action: "decline",
    })
  })

  it("cancel => confirmed null with message echoed", async () => {
    const elicit: ElicitFn = vi.fn().mockResolvedValue({ action: "cancel", content: null })
    expect(await confirm(elicit, "Delete file?")).toEqual({
      confirmed: null,
      action: "cancel",
      message: "Delete file?",
    })
  })

  it("unsupported (elicit rejects) => confirmed null with action error", async () => {
    const elicit: ElicitFn = vi.fn().mockRejectedValue(new Error("unsupported"))
    expect(await confirm(elicit, "Delete file?")).toEqual({
      confirmed: null,
      action: "error",
      message: "Delete file?",
    })
  })
})
