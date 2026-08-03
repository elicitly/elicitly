import { describe, expect, it } from "vitest"
import { clampTimeoutSeconds } from "./timeout.js"

describe("clampTimeoutSeconds", () => {
  it("defaults to 300s when omitted", () => {
    expect(clampTimeoutSeconds(undefined)).toBe(300)
  })

  it("passes a value inside [60, 3600] through unchanged", () => {
    expect(clampTimeoutSeconds(120)).toBe(120)
  })

  it("clamps below 60s up to the 60s floor", () => {
    expect(clampTimeoutSeconds(10)).toBe(60)
  })

  it("clamps above 3600s down to the 1h ceiling", () => {
    expect(clampTimeoutSeconds(999999)).toBe(3600)
  })
})
