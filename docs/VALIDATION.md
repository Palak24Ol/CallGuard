# Validation completed

- 103 regression tests passed using Node.js 22.16.0.
- All 85,248 synthetic generated cases matched their intended rule; full per-rule results are in coverage-results.json.
- Syntax checked for the app, rule engine, scenario catalog/generator, browser worker, and local server.
- Local HTTP preview returned 200.
- Browser verified the initial suspicious call, the legitimate bank-safety example (zero warnings), and the scenario lab controls.
- Microphone capture was not activated during automated checking; browser support, microphone permission, and the speech service must be checked on the demonstration device.
- The local npm launcher on this computer is broken; the provided START-CALLGUARD.cmd and direct node commands bypass it and need no package installation.

The synthetic matrix uses rule-derived templates, so its result is not independent real-world accuracy. No claim of universal scam detection is made.
