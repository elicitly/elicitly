/** The single, static MCP Apps view every elicit_display call renders into. */
export const DISPLAY_VIEW_URI = "ui://elicitly/display"

/** MCP Apps resource MIME type (SEP-1865). */
export const MCP_APP_MIME_TYPE = "text/html;profile=mcp-app"

/** Key under the tool result's `_meta` carrying the render — `_meta` is delivered
 * to the view but excluded from the model's context. */
export const DISPLAY_META_KEY = "elicitly/display"

/** Origins every view may load from: jsDelivr serves Tailwind (`@tailwindcss/browser`)
 * and DaisyUI for templates that opt in with their own <script>/<link> tags. */
export const DEFAULT_RESOURCE_DOMAINS = ["https://cdn.jsdelivr.net"] as const

/**
 * The view's CSP metadata. Only `resourceDomains` is ever widened; network
 * (`connectDomains`) and nested-frame (`frameDomains`) origins stay closed so a
 * template can't fetch or frame anything.
 */
export function displayCsp(extraResourceDomains: readonly string[] = []): {
  resourceDomains: string[]
} {
  return { resourceDomains: [...new Set([...DEFAULT_RESOURCE_DOMAINS, ...extraResourceDomains])] }
}

/**
 * The view URI for a given CSP. Hosts may cache UI resources by URI, so a
 * widened allowlist gets its own URI (`?csp=<hash>`) — otherwise a host keeps
 * enforcing the cached, narrower policy until it restarts. The default policy
 * keeps the bare URI.
 */
export function displayViewUri(csp: { resourceDomains: readonly string[] }): string {
  const domains = [...csp.resourceDomains].sort()
  const isDefault =
    domains.length === DEFAULT_RESOURCE_DOMAINS.length &&
    DEFAULT_RESOURCE_DOMAINS.every((d) => domains.includes(d))
  return isDefault ? DISPLAY_VIEW_URI : `${DISPLAY_VIEW_URI}?csp=${fnv1a(domains.join(","))}`
}

/** 32-bit FNV-1a as 8 hex chars — a cache key, not a security boundary; pure JS
 * so the toolkit runs anywhere (Node, Workers). */
function fnv1a(input: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, "0")
}

/** Runs inside the template frame: reports content height (the root's box; see
 * reportSize in the view), routes link clicks to the view (which asks the host
 * to open them via ui/open-link), and applies theme changes the view relays
 * from the host (the sandboxed frame has no other way to learn them; inline
 * color-scheme outranks the layered default). */
const FRAME_JS =
  "(function(){var p=function(m){parent.postMessage(m,'*')};" +
  "addEventListener('message',function(e){var m=e.data;if(e.source!==parent||!m||m.elicitly!=='theme')return;" +
  "if(m.theme!=='light'&&m.theme!=='dark')return;var r=document.documentElement;" +
  "r.setAttribute('data-theme',m.theme);r.style.colorScheme=m.theme});" +
  "var s=function(){p({elicitly:'height',h:Math.ceil(document.documentElement.getBoundingClientRect().height)})};" +
  "addEventListener('load',s);new ResizeObserver(s).observe(document.documentElement);" +
  "addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href]');" +
  "if(a&&/^https?:/i.test(a.href)){e.preventDefault();p({elicitly:'open',url:a.href})}},true);})();"

// The frame document is assembled in the view, not on the server: hosts replay
// stored tool results through the current view, so anything baked into a result
// would be frozen in conversation history while the view keeps improving.
const FRAME_HEAD =
  '<!doctype html><html><head><meta charset="utf-8">' +
  // Defaults sit in the first-declared cascade layer, so any framework a
  // template loads (Tailwind, DaisyUI) overrides them without a fight.
  "<style>@layer elicitly-base{:root{color-scheme:light dark}" +
  "body{margin:0;padding:12px;font:14px/1.5 system-ui,sans-serif;word-break:break-word}" +
  "table{border-collapse:collapse}td,th{border:1px solid currentColor;padding:4px 8px}}</style></head>" +
  "<body>"

const FRAME_TAIL = `<script>${FRAME_JS}</script></body></html>`

/** Wrap rendered template HTML in the standalone document loaded as the frame's srcdoc. */
export function buildFrameDocument(renderedHtml: string): string {
  return FRAME_HEAD + renderedHtml + FRAME_TAIL
}

/** JSON for embedding inside an inline <script>: `<` is escaped so a `</script>`
 * in the value can't end the enclosing script element. */
function scriptJson(value: unknown): string {
  return JSON.stringify(value).replaceAll("<", "\\u003c")
}

/**
 * The view itself: a dependency-free MCP Apps client. It performs the
 * ui/initialize handshake, mounts the render from the tool result into a
 * sandboxed srcdoc frame, mirrors the frame's height to the host
 * (ui/notifications/size-changed), and offers fullscreen when the host lists it.
 * If the frame never reports in (a host CSP that blocks nested frames), it falls
 * back to mounting the HTML directly, without scripts, and logs why.
 */
export function buildViewHtml(version: string): string {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
:root{color-scheme:light dark;--fg:#111827;--muted:#4b5563;--border:#6b7280}
@media (prefers-color-scheme:dark){:root{--fg:#f3f4f6;--muted:#d1d5db;--border:#9ca3af}}
:root[data-theme=light]{color-scheme:light;--fg:#111827;--muted:#4b5563;--border:#6b7280}
:root[data-theme=dark]{color-scheme:dark;--fg:#f3f4f6;--muted:#d1d5db;--border:#9ca3af}
html,body{margin:0;background:transparent;color:var(--fg);font:14px/1.5 var(--font-sans,system-ui,sans-serif)}
header{display:none;align-items:center;gap:8px;padding:8px 12px}
header.on{display:flex}
h1{flex:1;margin:0;font-size:15px;font-weight:600}
button{font:inherit;color:var(--fg);background:transparent;border:1px solid var(--border);border-radius:6px;padding:2px 10px;cursor:pointer}
button:focus-visible{outline:2px solid var(--fg);outline-offset:2px}
iframe{display:block;width:100%;height:0;border:0}
#direct{padding:12px}
#note{display:none;margin:0 12px;color:var(--muted);font-size:12px}
</style></head>
<body>
<header id="bar"><h1 id="title"></h1><button id="full" type="button" hidden>Fullscreen</button></header>
<p id="note" role="status"></p>
<iframe id="frame" title="Rendered content" sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"></iframe>
<div id="direct" hidden></div>
<script>
(function () {
  var VERSION = ${JSON.stringify(version)};
  var META_KEY = ${JSON.stringify(DISPLAY_META_KEY)};
  var FRAME_HEAD = ${scriptJson(FRAME_HEAD)};
  var FRAME_TAIL = ${scriptJson(FRAME_TAIL)};
  var frame = document.getElementById("frame");
  var nextId = 1, pending = {}, ctx = {}, mounted = false, frameSeen = false;

  function post(m) { window.parent.postMessage(m, "*"); }
  function request(method, params) {
    var id = nextId++;
    post({ jsonrpc: "2.0", id: id, method: method, params: params });
    return new Promise(function (res, rej) { pending[id] = { res: res, rej: rej }; });
  }
  function notify(method, params) { post({ jsonrpc: "2.0", method: method, params: params }); }
  function log(level, data) { notify("notifications/message", { level: level, logger: "elicitly-display", data: data }); }

  // Height is the root's box, not scrollHeight: scrollHeight never drops
  // below the space the frame was given, so a render could grow but never
  // shrink (e.g. after a CDN stylesheet tightens the layout). Nothing is
  // reported while the view is still empty, so the host keeps its default.
  function reportSize() {
    var el = document.documentElement;
    var h = Math.ceil(el.getBoundingClientRect().height);
    if (h > 0) notify("ui/notifications/size-changed", { width: el.scrollWidth, height: h });
  }
  new ResizeObserver(reportSize).observe(document.documentElement);

  function applyContext(c) {
    if (!c) return;
    for (var k in c) ctx[k] = c[k];
    if (c.theme) {
      document.documentElement.setAttribute("data-theme", c.theme);
      // A render that's already mounted keeps the theme it was built with
      // unless the frame is told: hosts switch themes on open conversations.
      if (mounted) sendTheme();
    }
    var vars = c.styles && c.styles.variables;
    if (vars) for (var v in vars) document.documentElement.style.setProperty(v, vars[v]);
    var modes = ctx.availableDisplayModes || [];
    var full = document.getElementById("full");
    full.hidden = modes.indexOf("fullscreen") < 0;
    full.textContent = ctx.displayMode === "fullscreen" ? "Exit fullscreen" : "Fullscreen";
    if (!full.hidden) document.getElementById("bar").classList.add("on");
  }

  function sendTheme() {
    if ((ctx.theme === "light" || ctx.theme === "dark") && frame.contentWindow) {
      frame.contentWindow.postMessage({ elicitly: "theme", theme: ctx.theme }, "*");
    }
  }

  function showNote(text) {
    var n = document.getElementById("note");
    n.textContent = text;
    n.style.display = "block";
  }

  function mount(result) {
    var d = result && result._meta && result._meta[META_KEY];
    if (!d) {
      var t = result && result.content && result.content[0] && result.content[0].text;
      showNote(t || "Nothing to display.");
      return;
    }
    mounted = true;
    if (d.title) {
      document.getElementById("title").textContent = d.title;
      document.getElementById("bar").classList.add("on");
    }
    // Follow the host's theme: a frame whose color-scheme differs from its
    // embedder's gets an opaque canvas instead of a transparent one, and
    // data-theme is the switch DaisyUI (and similar frameworks) read.
    var doc = FRAME_HEAD + d.html + FRAME_TAIL;
    if (ctx.theme === "light" || ctx.theme === "dark") {
      doc = doc
        .replace("<html>", '<html data-theme="' + ctx.theme + '">')
        .replace("color-scheme:light dark", "color-scheme:" + ctx.theme);
    }
    frame.srcdoc = doc;
    setTimeout(function () {
      if (frameSeen) return;
      // The nested frame never reported in: mount the markup directly. Template
      // scripts don't run on this path (innerHTML never executes them).
      frame.hidden = true;
      var direct = document.getElementById("direct");
      direct.innerHTML = d.html;
      direct.hidden = false;
      showNote("Shown without template scripts (this host blocked the nested frame).");
      log("warning", { event: "frame-fallback", version: VERSION });
    }, 3000);
  }

  window.addEventListener("message", function (e) {
    var m = e.data;
    if (e.source === frame.contentWindow) {
      if (!m || typeof m !== "object") return;
      if (m.elicitly === "height") {
        // First report: the frame's script is listening now, so catch up on a
        // theme change that landed while it was still loading.
        if (!frameSeen) sendTheme();
        frameSeen = true;
        var h = Number(m.h);
        if (h > 0) frame.style.height = Math.min(h, 4000) + "px";
      } else if (m.elicitly === "open" && typeof m.url === "string") {
        request("ui/open-link", { url: m.url }).catch(function (err) {
          log("warning", { event: "open-link-failed", url: m.url, error: String(err && err.message || err) });
        });
      }
      return;
    }
    if (e.source !== window.parent || !m || m.jsonrpc !== "2.0") return;
    if (m.id != null && !m.method && pending[m.id]) {
      var p = pending[m.id]; delete pending[m.id];
      if (m.error) p.rej(new Error(m.error.message || "request failed")); else p.res(m.result);
      return;
    }
    switch (m.method) {
      case "ui/notifications/tool-result": mount(m.params); break;
      case "ui/notifications/host-context-changed": applyContext(m.params); break;
      case "ui/notifications/tool-cancelled": if (!mounted) showNote("Cancelled."); break;
      case "ui/resource-teardown": post({ jsonrpc: "2.0", id: m.id, result: {} }); break;
      default:
        if (m.id != null) post({ jsonrpc: "2.0", id: m.id, error: { code: -32601, message: "Method not found" } });
    }
  });

  document.getElementById("full").addEventListener("click", function () {
    var want = ctx.displayMode === "fullscreen" ? "inline" : "fullscreen";
    request("ui/request-display-mode", { mode: want }).then(function (r) {
      applyContext({ displayMode: r && r.mode });
    });
  });

  request("ui/initialize", {
    protocolVersion: "2026-01-26",
    appInfo: { name: "elicitly-display", version: VERSION },
    appCapabilities: { availableDisplayModes: ["inline", "fullscreen"] },
  }).then(function (r) {
    applyContext(r && r.hostContext);
    notify("ui/notifications/initialized", {});
    reportSize();
  }, function (err) {
    showNote("Could not connect to the host.");
    log("error", { event: "initialize-failed", error: String(err && err.message || err) });
  });
})();
</script>
</body></html>`
}
