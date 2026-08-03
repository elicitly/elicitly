import { describe, expect, it } from "vitest"
import { classifyProbe, FAST_CANCEL_MS } from "./probe.js"

describe("classifyProbe", () => {
  it("accept => working", () => {
    expect(classifyProbe({ action: "accept", latencyMs: 1840 })).toBe("working")
  })
  it("error => unsupported", () => {
    expect(classifyProbe({ action: "error", latencyMs: 3 })).toBe("unsupported")
  })
  it("fast cancel => advertised_but_broken", () => {
    expect(classifyProbe({ action: "cancel", latencyMs: FAST_CANCEL_MS - 1 })).toBe(
      "advertised_but_broken",
    )
  })
  it("slow cancel => user_declined", () => {
    expect(classifyProbe({ action: "cancel", latencyMs: FAST_CANCEL_MS + 1 })).toBe("user_declined")
  })
  it("fast decline => advertised_but_broken", () => {
    expect(classifyProbe({ action: "decline", latencyMs: 5 })).toBe("advertised_but_broken")
  })
})
