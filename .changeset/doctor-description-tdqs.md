---
"@elicitly/tools": patch
"elicitly": patch
---

Tighten the elicit_doctor tool description for TDQS. The old text was one run-on sentence that re-documented every output field (initialize/support/deprecations/probes) — content already in the outputSchema — and gave no when-to-use guidance, scoring B (Conciseness 2/5, Usage Guidelines 2/5) on Glama while elicit_form/elicit_confirm scored A. The new description leads with purpose and when-to-use, states behavior (passive vs probe, read-only), and drops the schema-duplicating field dump. Behavior unchanged.
