export * from "./adapter.js"
export * from "./confirm.js"
// src/core/ is the former @elicitly/core package, absorbed 2026-08-02: the
// elicitation-schema types and the passive report/probe classification. The
// layer rule survives the merge: nothing under core/ may import the MCP SDK,
// zod, or anything outside core/.
export * from "./core/index.js"
export * from "./doctor.js"
export * from "./elicitForm.js"
export * from "./register.js"
export * from "./types.js"
