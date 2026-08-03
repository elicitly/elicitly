import { describe, expect, it, vi } from "vitest"
import { doctor } from "./doctor.js"
import type { ClientInfoFn, ElicitFn } from "./types.js"

const serverInfo = { name: "elicitly", version: "0.1.0" }
const clientView: ClientInfoFn = () => ({
  clientInfo: { name: "claude-code", title: "Claude Code", version: "2.1.76" },
  protocolVersion: "2025-11-25",
  capabilities: { elicitation: { form: {}, url: {} }, sampling: {} },
  serverCapabilities: { tools: { listChanged: true } },
})

describe("elicit_doctor", () => {
  it("returns the passive report without probing by default", async () => {
    const elicit = vi.fn() as unknown as ElicitFn
    const report = await doctor({ clientView, elicit, serverInfo }, false)
    expect(report.support.elicitationUrl).toBe(true)
    expect(report.initialize.request.clientInfo).toEqual({
      name: "claude-code",
      title: "Claude Code",
      version: "2.1.76",
    })
    expect(report.initialize.response).toEqual({
      protocolVersion: "2025-11-25",
      capabilities: { tools: { listChanged: true } },
      serverInfo,
    })
    expect(report.probes).toBeUndefined()
    expect(elicit).not.toHaveBeenCalled()
  })

  it("surfaces the MCP 2026-07-28 deprecation advisories in the report", async () => {
    const elicit = vi.fn() as unknown as ElicitFn
    const report = await doctor({ clientView, elicit, serverInfo }, false)
    expect(report.deprecations.map((d) => d.feature)).toEqual(["sampling", "roots", "logging"])
    expect(report.deprecations.every((d) => d.sep === "SEP-2577")).toBe(true)
  })

  it("probe: accept => working", async () => {
    const elicit: ElicitFn = vi
      .fn()
      .mockResolvedValue({ action: "accept", content: { value: "ok" } })
    const report = await doctor({ clientView, elicit, serverInfo }, true)
    expect(report.probes?.elicitationForm.attempted).toBe(true)
    expect(report.probes?.elicitationForm.verdict).toBe("working")
    expect(report.probes?.elicitationForm.data).toBe("ok")
  })

  it("probe: rejection => unsupported", async () => {
    const elicit: ElicitFn = vi.fn().mockRejectedValue(new Error("no elicitation"))
    const report = await doctor({ clientView, elicit, serverInfo }, true)
    expect(report.probes?.elicitationForm.verdict).toBe("unsupported")
  })

  it("probe skipped when client does not advertise elicitation", async () => {
    const noElicit: ClientInfoFn = () => ({ capabilities: { sampling: {} } })
    const elicit = vi.fn() as unknown as ElicitFn
    const report = await doctor({ clientView: noElicit, elicit, serverInfo }, true)
    expect(report.probes?.elicitationForm.attempted).toBe(false)
    expect(elicit).not.toHaveBeenCalled()
  })
})
