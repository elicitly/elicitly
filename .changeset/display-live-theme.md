---
"@elicitly/tools": patch
"elicitly": patch
---

`elicit_display`: a render that's already on screen now follows the host's theme when it changes (for example an automatic light/dark switch while a conversation stays open). The view relays `ui/notifications/host-context-changed` theme updates into the sandboxed template frame; before, only the title bar switched and the template kept the theme it loaded with.
