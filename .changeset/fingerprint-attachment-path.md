---
"elicitly": patch
---

contribute-fingerprint now asks how the server is attached (config-file command vs MCPB desktop extension) and records it as an "Attached via" line in the issue body — labeling each capture is what keeps same-or-different claims across attachment paths verifiable per host and build (on Claude Desktop 1.46388.4 the two paths measured identical). README documents that current Claude Desktop advertises no elicitation to local servers, so the dialog tools degrade gracefully there.
