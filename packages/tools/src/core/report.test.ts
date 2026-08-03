import { describe, expect, it } from "vitest"
import { buildPassiveReport, MCP_DEPRECATIONS } from "./report.js"

const serverInfo = { name: "elicitly", version: "0.1.0" }

describe("buildPassiveReport", () => {
  it("echoes the initialize exchange verbatim and derives support flags", () => {
    const clientInfo = { name: "claude-code", title: "Claude Code", version: "2.1.76" }
    const capabilities = { elicitation: { form: {}, url: {} }, sampling: {}, roots: {} }
    const report = buildPassiveReport(
      {
        clientInfo,
        protocolVersion: "2025-11-25",
        capabilities,
        serverCapabilities: { tools: { listChanged: true } },
      },
      serverInfo,
    )
    expect(report.initialize.request).toEqual({ clientInfo, capabilities })
    expect(report.initialize.response).toEqual({
      protocolVersion: "2025-11-25",
      capabilities: { tools: { listChanged: true } },
      serverInfo,
    })
    expect(report.support).toEqual({
      elicitation: true,
      elicitationForm: true,
      elicitationUrl: true,
      sampling: true,
      roots: true,
    })
  })

  it("attaches the 2026-07-28 (SEP-2577) deprecation advisories for sampling/roots/logging", () => {
    const report = buildPassiveReport({ capabilities: { sampling: {}, roots: {} } }, serverInfo)
    expect(report.deprecations).toBe(MCP_DEPRECATIONS)
    expect(report.deprecations.map((d) => d.feature)).toEqual(["sampling", "roots", "logging"])
    for (const d of report.deprecations) {
      expect(d.status).toBe("deprecated")
      expect(d.sinceRevision).toBe("2026-07-28")
      expect(d.sep).toBe("SEP-2577")
    }
  })

  it("includes the deprecation advisories even when the client advertises nothing", () => {
    // The advisory is a static spec fact, not derived from client capabilities.
    expect(buildPassiveReport({}, serverInfo).deprecations).toBe(MCP_DEPRECATIONS)
  })

  it("treats an empty elicitation object as form-only", () => {
    const report = buildPassiveReport({ capabilities: { elicitation: {} } }, serverInfo)
    expect(report.support.elicitation).toBe(true)
    expect(report.support.elicitationForm).toBe(true)
    expect(report.support.elicitationUrl).toBe(false)
  })

  it("degrades missing fields to null/false rather than throwing", () => {
    const report = buildPassiveReport({}, serverInfo)
    expect(report.initialize.request).toEqual({ clientInfo: null, capabilities: null })
    expect(report.initialize.response).toEqual({
      protocolVersion: null,
      capabilities: null,
      serverInfo,
    })
    expect(report.support).toEqual({
      elicitation: false,
      elicitationForm: false,
      elicitationUrl: false,
      sampling: false,
      roots: false,
    })
  })
})
