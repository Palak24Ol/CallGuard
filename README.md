# CallGuard

A new college major-project prototype for **banking call scam detection**. Includes 37 conversation rules, indirect-code/link/number checks, 20 curated demos, and 85,248 generated scenario combinations. No custom ML model training is required.

## Run

Install Node.js 20 or newer, then double-click **START-CALLGUARD.cmd** and open **http://127.0.0.1:4173**.

Or in this folder:

```sh
node server.mjs
```

There are no packages to install. The source is in `dist/`; it is authored directly and needs no build step. Keep the terminal running while using the app. If port 4173 is occupied, set `PORT` to an available port before starting.

## Check

```sh
node --test tests/engine.test.mjs
node --check dist/app.js
node tests/coverage.mjs --write
```

The last command checks every generated combination and saves `docs/coverage-results.json`. It may take a few minutes depending on the computer. Coverage checks also run in the app's Scenario lab with progress and cancellation.

## Try

- Play the convincing-employee scenario and see the warning change as the caller asks for an OTP.
- Compare legitimate safety advice and customer-speaker examples.
- Check the fictional flagged number +1 202 555 0101.
- Add/remove your own device-local suspicion reports.
- Generate combinations and export explainable assessment reports.
- Use optional microphone transcription in a supported browser, after reading its privacy notice.

**Important scope:** This is an explainable warning prototype, not automatic phone-call interception, proof of identity, a live scam-number database, or a bank transaction blocker. A no-warning result is never labelled safe. Speech recognition may use the browser vendor’s servers. All generated cases are synthetic; their match rate is not real-world detection accuracy.

See `docs/PROJECT.md` for architecture, rule combinations, privacy, limitations, and viva guidance.

