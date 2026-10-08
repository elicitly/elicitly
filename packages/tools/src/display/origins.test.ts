import { describe, expect, it } from "vitest"
import { findBlockedOrigins } from "./origins.js"

const allowed = ["https://cdn.jsdelivr.net", "https://*.example.com"]

describe("findBlockedOrigins", () => {
  it("reports subresources from origins outside the allowlist, counted per origin", () => {
    const html =
      "<img src=\"https://upload.wikimedia.org/a.png\"><img src='https://upload.wikimedia.org/b.png'>" +
      '<script src="https://evil.test/x.js"></script>'
    expect(findBlockedOrigins(html, allowed)).toEqual([
      { origin: "https://upload.wikimedia.org", references: 2 },
      { origin: "https://evil.test", references: 1 },
    ])
  })

  it("allows exact origins and wildcard subdomains, but not the bare wildcard host", () => {
    const html =
      '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/daisyui@5">' +
      '<img src="https://img.example.com/a.png"><img src="https://example.com/b.png">'
    expect(findBlockedOrigins(html, allowed)).toEqual([
      { origin: "https://example.com", references: 1 },
    ])
  })

  it("ignores data:, relative, and plain <a> links", () => {
    const html =
      '<img src="data:image/png;base64,AAAA"><img src="/local.png">' +
      '<a href="https://anywhere.test/page">link</a>'
    expect(findBlockedOrigins(html, allowed)).toEqual([])
  })

  it("checks srcset candidates, CSS url(), unquoted attributes, and http:", () => {
    const html =
      '<img srcset="https://a.test/1x.png 1x, https://img.example.com/2x.png 2x">' +
      "<div style=\"background:url('https://b.test/bg.png')\"></div>" +
      "<img src=http://img.example.com/c.png>"
    expect(findBlockedOrigins(html, allowed)).toEqual([
      { origin: "https://a.test", references: 1 },
      { origin: "http://img.example.com", references: 1 },
      { origin: "https://b.test", references: 1 },
    ])
  })

  it("always reports iframes, since nested frames are never allowed", () => {
    expect(
      findBlockedOrigins('<iframe src="https://cdn.jsdelivr.net/x.html"></iframe>', allowed),
    ).toEqual([{ origin: "https://cdn.jsdelivr.net", references: 1 }])
  })

  it("skips URLs that don't parse", () => {
    expect(findBlockedOrigins('<img src="https://">', allowed)).toEqual([])
  })

  it("decodes &amp; before parsing the URL", () => {
    expect(findBlockedOrigins('<img src="https://c.test/i.png?a=1&amp;b=2">', allowed)).toEqual([
      { origin: "https://c.test", references: 1 },
    ])
  })
})
