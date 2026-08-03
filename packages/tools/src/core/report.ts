export type ClientView = {
  /** Verbatim `clientInfo` from the client's initialize request. */
  clientInfo?: unknown
  /** Negotiated protocol version (sent in the server's initialize response). */
  protocolVersion?: string | null
  /** Verbatim `ClientCapabilities` from the client's initialize request. */
  capabilities?: {
    elicitation?: unknown
    sampling?: unknown
    roots?: unknown
  } | null
  /** Verbatim `ServerCapabilities` from the server's initialize response. */
  serverCapabilities?: unknown
}

export type ServerInfo = { name: string; version: string }

export type InitializeEcho = {
  request: { clientInfo: unknown; capabilities: unknown }
  response: { protocolVersion: string | null; capabilities: unknown; serverInfo: ServerInfo }
}

export type SupportReport = {
  elicitation: boolean
  elicitationForm: boolean
  elicitationUrl: boolean
  sampling: boolean
  roots: boolean
}

/** An MCP client feature the doctor reports on that the spec has moved to the
 * Deprecated lifecycle state. Advisory only — Elicitly neither requires nor
 * emits any of these; the notice helps integrators avoid building on features
 * scheduled for removal. */
export type DeprecationNotice = {
  feature: "sampling" | "roots" | "logging"
  status: "deprecated"
  /** MCP spec revision that moved the feature to Deprecated. */
  sinceRevision: string
  sep: string
  note: string
}

export type PassiveReport = {
  initialize: InitializeEcho
  support: SupportReport
  /** Spec-level deprecation advisories for the features doctor surfaces. */
  deprecations: readonly DeprecationNotice[]
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null
}

/**
 * MCP client features Elicitly's doctor surfaces (`support.sampling`,
 * `support.roots`) — plus Logging, on the same SEP — that the `2026-07-28` spec
 * revision moved to the Deprecated lifecycle state (SEP-2577). They remain fully
 * functional during a minimum twelve-month window (SEP-2596 feature-lifecycle
 * policy); new integrations should not adopt them. Verified against
 * https://modelcontextprotocol.io/specification/2026-07-28/changelog.
 */
export const MCP_DEPRECATIONS: readonly DeprecationNotice[] = [
  {
    feature: "sampling",
    status: "deprecated",
    sinceRevision: "2026-07-28",
    sep: "SEP-2577",
    note: "Deprecated as of MCP 2026-07-28; integrate with an LLM provider API directly instead. Remains functional during a ≥12-month window.",
  },
  {
    feature: "roots",
    status: "deprecated",
    sinceRevision: "2026-07-28",
    sep: "SEP-2577",
    note: "Deprecated as of MCP 2026-07-28; pass directories or files via tool parameters, resource URIs, or server configuration instead. Remains functional during a ≥12-month window.",
  },
  {
    feature: "logging",
    status: "deprecated",
    sinceRevision: "2026-07-28",
    sep: "SEP-2577",
    note: "Deprecated as of MCP 2026-07-28; log to stderr (stdio) or use OpenTelemetry instead. Remains functional during a ≥12-month window.",
  },
]

/**
 * Split the initialize handshake into a verbatim echo and Elicitly's
 * interpretation. `initialize.request` is what the client sent, exactly as the
 * SDK retained it (the client's *requested* protocolVersion is not retained by
 * the SDK, so the request block has none; the negotiated version appears in
 * `initialize.response`). `initialize.response` is what the server replied.
 * `support` is derived: booleans applying the spec's rules — e.g. an empty
 * `elicitation: {}` advertises form mode only.
 */
export function buildPassiveReport(view: ClientView, serverInfo: ServerInfo): PassiveReport {
  const caps = view.capabilities ?? null
  const elicit = caps?.elicitation
  const hasElicit = elicit !== undefined && elicit !== null

  // Empty {} means form-only per spec; presence of `form` also counts.
  const elicitationForm =
    hasElicit && (isObject(elicit) ? "form" in elicit || Object.keys(elicit).length === 0 : true)
  const elicitationUrl = hasElicit && isObject(elicit) && "url" in elicit

  return {
    initialize: {
      request: {
        clientInfo: view.clientInfo ?? null,
        capabilities: caps,
      },
      response: {
        protocolVersion: view.protocolVersion ?? null,
        capabilities: view.serverCapabilities ?? null,
        serverInfo,
      },
    },
    support: {
      elicitation: hasElicit,
      elicitationForm,
      elicitationUrl,
      sampling: caps?.sampling !== undefined && caps?.sampling !== null,
      roots: caps?.roots !== undefined && caps?.roots !== null,
    },
    deprecations: MCP_DEPRECATIONS,
  }
}
