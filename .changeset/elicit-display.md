---
"@elicitly/tools": minor
"elicitly": minor
---

Add `elicit_display`: show the user a LiquidJS template rendered as HTML, inline as an MCP App (`ui://elicitly/display`) in hosts that support MCP Apps. The rendered HTML travels in the result's `_meta`, so it never enters the model's context; when the host didn't advertise MCP Apps, the text result tells the model to present the information itself. Templates may load Tailwind/DaisyUI from jsDelivr, and `ELICITLY_DISPLAY_RESOURCE_DOMAINS` (comma-separated `https://` origins) allows more image/script/style hosts (the Claude Desktop extension exposes it as the "elicit_display: extra allowed origins" setting). `@elicitly/tools` exports `registerDisplayTool` and gains a runtime dependency on `liquidjs` (bundled into the `elicitly` CLI).
