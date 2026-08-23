---
"elicitly": patch
---

The `contribute-fingerprint` prompt now embeds the `elicit_doctor` report pretty-printed (2-space indentation) in the pre-filled GitHub issue instead of a single minified line, so the human reviewing the issue can actually read it. Values are unchanged — only whitespace — and the existing paste-manually fallback still covers the rare oversize URL.
