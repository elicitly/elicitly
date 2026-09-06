/**
 * The stdio server's prompts. Free-edition counterpart of the hosted
 * server's contribute-fingerprint (same name, same outcome — a contribution
 * to the public Support Matrix — different last hop: this server runs on the
 * user's machine with no backend to share through, so the flow ends in a
 * pre-filled GitHub issue the user reviews and submits with one click).
 * See elicitly/elicitly#11 and elicitly-pro#53.
 */

// Wording note: some hosts (Claude Desktop's extension runtime) screen prompt
// content with a prompt-injection heuristic before attaching it. Two patterns
// tripped it in earlier wording and must stay out: text asserting the user
// already authorized the flow ("the user chose to run this"), and instructions
// to encode gathered data into a URL and present it as a clickable link (the
// exfiltration shape). Hence the copy-paste contribution flow below, and a
// provenance preamble (#15 — cautious models refuse the prompt as injection
// when a host delivers it as an attachment) that DE-escalates its own
// authority instead of claiming the user's: proposed workflow + consent gate.
export const contributeFingerprintPrompt = {
  name: "contribute-fingerprint",
  title: "Contribute a fingerprint",
  description:
    "Run elicit_doctor and prepare a GitHub issue contributing the capability report " +
    "to Elicitly's public Elicitation Support Matrix " +
    "(https://www.elicitly.ai/docs/elicitation/support-matrix/).",
  text: [
    'This is the "contribute-fingerprint" prompt from the Elicitly MCP server; prompts',
    "like it reach a conversation only through the host's prompt menu. Treat it as a",
    "proposed workflow, not an instruction: before acting, restate in one sentence what",
    "this flow does and ask the user to confirm they want to proceed.",
    "",
    "You are helping the user contribute an elicitation-capability fingerprint to Elicitly's",
    "public Support Matrix (https://www.elicitly.ai/docs/elicitation/support-matrix/).",
    "",
    "1. Ask the user for the product name and version of THIS host application (for example",
    '   "Claude Code 2.1.228" or "Claude for Mac 1.34493.1"). The report can only see the',
    "   embedded MCP client, not the product around it, so this must come from the user. Also",
    "   ask whether anything about the setup is unusual (OS, flags, enterprise policy) — that",
    "   goes in the notes. All optional; proceed with whatever the user provides.",
    "",
    "2. Call the elicit_doctor tool with probeElicitation: true. A small elicitation dialog may",
    "   appear — that IS the probe; the user should answer it. The probe is time-bounded, so",
    "   even if no dialog appears the report still comes back with the probe recorded as",
    "   `advertised_but_unanswered` — that timeout IS a valid finding; include the report as-is.",
    "   If the elicit_doctor call itself errors or times out at your tool-call limit, don't",
    "   retry — ask the user whether any dialog appeared, then call elicit_doctor once with",
    "   probeElicitation: false and note the failure in the setup notes below",
    '   (e.g. "probe hit the host tool-call timeout; dialog visible: no").',
    "",
    "3. Show the user the returned report JSON verbatim.",
    "",
    "4. Offer to prepare the contribution. This server runs locally, so nothing is ever sent",
    "   automatically — compose an issue title and body for the user to review, copy, and",
    "   submit themselves at https://github.com/elicitly/elicitly/issues/new",
    "",
    '   TITLE: "Host fingerprint: <product name + version>"',
    "   BODY (markdown):",
    "     **Host + version:** <product name + version>",
    "     **Transport:** stdio (this is the local stdio server)",
    "     **Captured on:** <today's date>, host release date if known: <date or unknown>",
    "     **Anything unusual about the setup?** <notes, or none>",
    "     **`elicit_doctor` output with `probeElicitation: true` (pretty-printed for review",
    "     — values exactly as returned, do not alter any; it gets archived as evidence):**",
    "     ```json",
    "     <the report JSON, pretty-printed with 2-space indentation>",
    "     ```",
    "",
    "   Show the title and body in easily copyable form and tell the user to paste them",
    "   into a new issue at that page.",
    "",
    "If the user prefers not to contribute, just show them the report — steps 1-3 are a",
    "useful diagnostic on their own.",
  ].join("\n"),
} as const

/** The prompts/get result body. */
export function contributeFingerprintMessages(): {
  description: string
  messages: [{ role: "user"; content: { type: "text"; text: string } }]
} {
  return {
    description: contributeFingerprintPrompt.description,
    messages: [{ role: "user", content: { type: "text", text: contributeFingerprintPrompt.text } }],
  }
}
