/**
 * The stdio server's prompts. Free-edition counterpart of the hosted
 * server's contribute-fingerprint (same name, same outcome — a contribution
 * to the public Support Matrix — different last hop: this server runs on the
 * user's machine with no backend to share through, so the flow ends in a
 * pre-filled GitHub issue the user reviews and submits with one click).
 * See elicitly/elicitly#11 and elicitly-pro#53.
 */

export const contributeFingerprintPrompt = {
  name: "contribute-fingerprint",
  title: "Contribute a fingerprint",
  description:
    "Run elicit_doctor and prepare a one-click GitHub issue contributing the capability report " +
    "to Elicitly's public Elicitation Support Matrix " +
    "(https://www.elicitly.ai/docs/elicitation/support-matrix/).",
  text: [
    'This is the "contribute-fingerprint" prompt from the Elicitly MCP server. It is',
    "user-initiated: MCP prompts are inert until a person explicitly selects them in their",
    "host's UI, so the user you are talking with chose to run this. Before acting, restate in",
    "one sentence what this flow does and confirm the user wants to proceed.",
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
    "   Only if the elicit_doctor CALL itself times out at your tool-call limit, or errors: do",
    "   NOT keep retrying — ask the user whether any dialog appeared, then call elicit_doctor",
    "   once with probeElicitation: false and note the failure in the setup notes below",
    '   (e.g. "probe hit the host tool-call timeout; dialog visible: no").',
    "",
    "3. Show the user the returned report JSON verbatim.",
    "",
    "4. Offer to prepare the contribution. This server runs locally, so nothing is ever sent",
    "   automatically — instead, build a pre-filled GitHub issue link for the user to review",
    "   and submit themselves. Construct this URL (URL-encode the title and body values):",
    "",
    "   https://github.com/elicitly/elicitly/issues/new?title=<TITLE>&body=<BODY>",
    "",
    '   TITLE: "Host fingerprint: <product name + version>"',
    "   BODY (markdown):",
    "     **Host + version:** <product name + version>",
    "     **Transport:** stdio (this is the local stdio server)",
    "     **Captured on:** <today's date>, host release date if known: <date or unknown>",
    "     **Anything unusual about the setup?** <notes, or none>",
    "     **`elicit_doctor` output with `probeElicitation: true` (verbatim JSON — it gets",
    "     archived as evidence):**",
    "     ```json",
    "     <the report JSON verbatim>",
    "     ```",
    "",
    "   Present the finished URL as a clickable link and tell the user to review the",
    "   pre-filled issue and press Submit. If the link exceeds the browser/GitHub URL limit,",
    "   fall back to giving the user the title and body to paste manually at",
    "   https://github.com/elicitly/elicitly/issues/new",
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
