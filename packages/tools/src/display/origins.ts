/**
 * Find the external origins a rendered template loads that the view's CSP will
 * block. The tool result is the only channel the model reads fresh on every
 * call (tool descriptions can be stale in an open conversation), so naming the
 * blocked origins there lets the model fix the template or tell the user what
 * to allow. Best effort: a pattern scan of the markup, not an HTML parser, and
 * it can't see URLs that scripts or loaded stylesheets request at runtime.
 */

/** Elements whose URL attributes the browser fetches as subresources (not <a> links). */
const RESOURCE_TAG =
  /<(img|script|link|source|video|audio|track|iframe|embed|object|input)\b([^>]*)>/gi
const URL_ATTR = /\b(src|href|srcset|poster|data)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi
const CSS_URL = /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi

export type BlockedOrigin = { origin: string; references: number }

export function findBlockedOrigins(html: string, allowed: readonly string[]): BlockedOrigin[] {
  const counts = new Map<string, number>()
  const count = (origin: string) => counts.set(origin, (counts.get(origin) ?? 0) + 1)
  const note = (raw: string) => {
    const origin = externalOrigin(raw)
    if (origin && !isAllowed(origin, allowed)) count(origin)
  }

  for (const [, tag, attrs] of html.matchAll(RESOURCE_TAG)) {
    for (const [, name, quoted] of attrs.matchAll(URL_ATTR)) {
      const value = quoted.replace(/^(["'])(.*)\1$/s, "$2")
      const attr = name.toLowerCase()
      if (tag.toLowerCase() === "iframe" && attr === "src") {
        // Nested frames are never allowed (frameDomains stays empty).
        const origin = externalOrigin(value)
        if (origin) count(origin)
      } else if (attr === "srcset") {
        for (const candidate of value.split(",")) note(candidate.trim().replace(/\s.*$/s, ""))
      } else {
        note(value)
      }
    }
  }
  for (const [, , url] of html.matchAll(CSS_URL)) note(url)

  return [...counts].map(([origin, references]) => ({ origin, references }))
}

/** The origin of an absolute http(s) URL; null for data:, relative, and anything unparseable. */
function externalOrigin(raw: string): string | null {
  const value = raw.trim().replaceAll("&amp;", "&").replaceAll("&#38;", "&")
  if (!/^https?:\/\//i.test(value)) return null
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

/** CSP source matching for the forms we accept: exact https origins and `https://*.host`
 * (any subdomain, not the bare host). */
function isAllowed(origin: string, allowed: readonly string[]): boolean {
  return allowed.some((source) => {
    if (source === origin) return true
    const wildcard = /^https:\/\/\*\.(.+)$/.exec(source)
    return wildcard !== null && origin.startsWith("https://") && origin.endsWith(`.${wildcard[1]}`)
  })
}
