/**
 * Stage the MCPB desktop-extension bundle under dist-mcpb/bundle/.
 *
 * Assumes tsdown has already produced the self-contained dist-mcpb/cli.mjs
 * (second config in tsdown.config.ts). The `build:mcpb` package script runs
 * this, then `mcpb validate` + `mcpb pack` on the staged directory.
 *
 * The manifest is generated here (not checked in) so its version can never
 * drift from package.json — the same discipline server.json gets from the
 * release workflow.
 */
import { copyFileSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), "..")
const repoRoot = join(pkgRoot, "..", "..")
const staging = join(pkgRoot, "dist-mcpb", "bundle")

const pkg = JSON.parse(readFileSync(join(pkgRoot, "package.json"), "utf8"))
// The prompt's manifest entry must be the EXACT content prompts/get serves —
// Claude Desktop validates the served text against the declaration and rejects
// the prompt as "potential prompt injection" on any mismatch. Import it from
// the built copy of the same module the server registers from.
const { contributeFingerprintPrompt } = await import(
  new URL("../dist-mcpb/prompts.mjs", import.meta.url).href
)
// tool entries below are directory-listing metadata (short, human-facing) —
// the wire contract stays in @elicitly/tools; keep names in sync with it.
const manifest = {
  manifest_version: "0.3",
  name: "elicitly",
  display_name: "Elicitly",
  version: pkg.version,
  description:
    "Human-in-the-loop dialogs for AI agents — confirm, fill a form, and diagnose the host's MCP elicitation support.",
  long_description:
    "Elicitly gives your prompts and Agent Skills MCP elicitation — human-in-the-loop dialogs with no server of your own. " +
    "`elicit_confirm` asks an OK/Cancel question (modeled on JavaScript's confirm()), `elicit_form` collects typed fields from " +
    "your own JSON schema, and `elicit_doctor` reports what the connected host actually supports — because advertising a " +
    "capability is not the same as it working (see the Elicitation Support Matrix at " +
    "https://www.elicitly.ai/docs/elicitation/support-matrix/). Runs entirely on your machine; nothing is sent anywhere.",
  author: { name: "Preneur LLC", url: "https://www.elicitly.ai" },
  homepage: "https://www.elicitly.ai",
  documentation: "https://www.elicitly.ai/docs/",
  support: "https://github.com/elicitly/elicitly/issues",
  repository: { type: "git", url: "https://github.com/elicitly/elicitly" },
  license: "Apache-2.0",
  icon: "icon.png",
  server: {
    type: "node",
    entry_point: "server/cli.mjs",
    mcp_config: {
      command: "node",
      // biome-ignore lint/suspicious/noTemplateCurlyInString: MCPB substitution syntax, not a JS template
      args: ["${__dirname}/server/cli.mjs"],
    },
  },
  tools: [
    {
      name: "elicit_confirm",
      description: "Ask the user an OK/Cancel confirmation (modeled on JavaScript's confirm()).",
    },
    {
      name: "elicit_doctor",
      description:
        "Report the host's support for elicitation (form/url mode), sampling, and roots; optionally run one live elicitation probe.",
    },
    {
      name: "elicit_form",
      description:
        "Ask the user to fill a form defined by your own JSON schema; returns the raw {action, content}.",
    },
  ],
  prompts: [
    {
      name: contributeFingerprintPrompt.name,
      description: contributeFingerprintPrompt.description,
      text: contributeFingerprintPrompt.text,
    },
  ],
  keywords: ["mcp", "elicitation", "human-in-the-loop", "approvals", "agent-skills"],
  // The server itself sends nothing anywhere, but the contribute-fingerprint
  // prompt hands the user a github.com link, and the policy covers the project:
  privacy_policies: ["https://www.elicitly.ai/privacy/"],
  compatibility: {
    platforms: ["darwin", "win32", "linux"],
    runtimes: { node: ">=22" },
  },
}

rmSync(staging, { recursive: true, force: true })
mkdirSync(join(staging, "server"), { recursive: true })

// Copy every emitted module: the two-entry build (cli + prompts) code-splits
// their shared modules into chunk files that cli.mjs imports at runtime.
for (const f of readdirSync(join(pkgRoot, "dist-mcpb"))) {
  if (f.endsWith(".mjs")) {
    copyFileSync(join(pkgRoot, "dist-mcpb", f), join(staging, "server", f))
  }
}
copyFileSync(join(pkgRoot, "mcpb", "icon.png"), join(staging, "icon.png"))
copyFileSync(join(repoRoot, "LICENSE"), join(staging, "LICENSE"))
copyFileSync(join(pkgRoot, "NOTICE"), join(staging, "NOTICE"))
// cli.mjs resolves its version via require("../package.json") — from
// server/cli.mjs that lands on the staging root. A stub keeps it honest
// without shipping the full dev manifest:
writeFileSync(
  join(staging, "package.json"),
  `${JSON.stringify({ name: pkg.name, version: pkg.version }, null, 2)}\n`,
)
writeFileSync(join(staging, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`)

console.log(`staged MCPB bundle ${pkg.version} at ${staging}`)
