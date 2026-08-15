---
"@elicitly/tools": minor
"elicitly": minor
---

`elicit_doctor`: error probes now carry the underlying rejection in
`probes.elicitationForm.reason` (one line, clipped to 300 chars). A bare
`action: "error"` verdict couldn't distinguish a client error response from a
malformed result from a transport failure — the detail that decides whether a
broken host fingerprint is the host's bug or the server's. Deliberately
diagnostic output rather than telemetry: host bugs are unactionable noise in
an error tracker, but gold in a fingerprint.
