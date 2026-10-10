---
"@elicitly/tools": patch
"elicitly": patch
---

`elicit_display`: a render now shrinks when its content gets shorter, for example after the chat panel widens and a layout un-stacks. Before, the view reported `scrollHeight`, which never drops below the space already given, so the render could grow but not shrink and kept empty space at the bottom. The view and its template frame now report the height of the content itself.
