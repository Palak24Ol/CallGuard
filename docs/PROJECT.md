# CallGuard — banking call scam detection

## Objective

Warn a customer when a bank-related call contains an unsafe request or suspicious context, including a call from someone who knows the customer's details or claims to be a genuine employee. The project is limited to calls and associated caller-number information. It does not monitor bank employee databases or transactions.

## Delivered architecture

- `dist/engine.js`: shared, deterministic JavaScript rule engine; no custom model training.
- `dist/catalog.js`: 20 curated call scenarios and primary-source references.
- `dist/scenario-lab.js`: 85,248 synthetic combinations generated on demand.
- `dist/batch-worker.js`: full matrix checking in a browser background worker, with progress and cancellation.
- `dist/app.js`: transcript editing/import, incremental simulation, optional speech recognition, local watchlist, evidence and export.
- `server.mjs`: dependency-free Node HTTP server bound to localhost, serving only `dist/` with security headers.
- `tests/engine.test.mjs`: regression tests, adverse variants, legitimate calls, speaker separation, input validation, and reputation behavior.
- `tests/coverage.mjs`: complete synthetic matrix evaluation, with per-rule results.

## Detection pipeline

1. Enforce the transcript length limit (40,000 characters).
2. Parse caller/customer labels. Unlabelled initial speech is caller speech; continuation lines retain the last speaker.
3. Split sentences and selected contrast/conjunction clauses. Preserve URLs and decimal points.
4. Normalize Unicode and punctuation for direct matching.
5. Suppress selected negated/educational instructions, except negative coercive instructions such as “do not contact your bank”.
6. Evaluate 37 independently explainable rules; deduplicate by rule ID.
7. Track up to three previous caller clauses for indirect code requests and selected combined action/purpose patterns. Ignore customer speech and preventive clauses as seeds.
8. Inspect visible URL structure without fetching or opening links.
9. Normalize the phone number and consult explicitly enabled fictional records and device-local user reports.
10. Return categorical risk, exact supporting text, reasons, next actions, and limitations.

### Risk combination

- Any high-risk rule: high-risk indicators.
- At least two distinct caution rules: high-risk indicators.
- A caution rule plus a pressure/trust context rule: high-risk indicators.
- One caution rule: caution.
- Context alone: pressure or trust cues, with no fraud verdict.
- No matched rule: no listed warning detected; always unverified, never “safe”.

These thresholds are transparent project heuristics. They are not a calibrated fraud probability or an official RBI scoring policy. Context can overlap between rules; evaluation against real, consented, labelled calls is necessary before operational use.

## Coverage strategy

The generator combines 8 caller-role claims × 12 pretexts × 37 tactic examples × 4 pressure settings × 3 number states × 2 personal-detail settings = **85,248 combinations**.

The generated cases are deliberately built from known rule examples. Their expected-rule match rate is a software coverage measure, NOT a real-world detection-accuracy result. A single request phrased thousands of different ways is not automatically covered by generating thousands of surrounding contexts. The separate hand-authored regression tests include paraphrases, non-scam calls, negation, speaker ambiguity, and cross-sentence situations. A future research evaluation should add an independent, consented labelled dataset, separate test set, per-language false-positive/false-negative rates, and time-to-warning measurements. Do not claim “all possible scams” or 100% real-world accuracy.

### What is not detectable from these inputs

Correct caller knowledge, a recognised voice, a bank logo, an employee ID, or an official-looking phone number cannot prove honesty. A malicious employee who makes no observable suspicious request cannot be distinguished from an honest employee based on identical speech. Deepfake voice identification and voiceprint matching are not implemented. Number spoofing is a reason to distrust identity claims, not something this app can directly verify.

## Number reputation

- Seed numbers use fictional +1 202 555 01xx demo records. They do not accuse actual Indian phone subscribers.
- Sample flagged records are labelled as fictional throughout the UI and may be disabled.
- Real user-entered reports are labelled local and unverified, never promoted to “confirmed scam”.
- Reports expire after 90 days; expiry is surfaced, not silently converted into a safe verdict.
- Formatting variants normalize before matching. International numbers require a country code; local Indian mobile formats are supported.
- There is no external reputation feed, public blacklist, crowdsourced network, Truecaller API, bank directory, or government lookup.
- Adding a licensed provider later requires backend credentials, provenance, update/expiry dates, correction/removal processes, a confidence policy, and API failure handling. A provider outage must produce unknown/unavailable, never safe.

## Speech input and real phone calls

The microphone feature uses `SpeechRecognition` or `webkitSpeechRecognition` if present in the browser. It requires explicit user initiation and browser microphone permission. Some browsers send audio to a vendor-hosted recognition service. CallGuard itself does not save raw audio or transcripts. The UI states this before starting.

Microphone input is a single-speaker demo; it treats recognised speech as caller speech. It does not automatically separate nearby speakers. It does not capture the remote party from an ordinary phone call, intercept calls, or block/hang up. Recognition ends on stop or when the tab becomes hidden. A supported HTTPS/localhost browser is required. If unavailable or denied, text input and the simulator remain usable. Audio-file upload/transcription is not implemented.

## Privacy and security

Transcript processing is browser-local. Transcripts are not persisted or sent to an application backend. Only explicitly saved suspicion reports and the sample-data preference use localStorage. UI rendering escapes user-controlled values. Export omits raw transcripts and masks numeric secrets, phone numbers, email/UPI addresses and URLs in evidence on a best-effort basis. Names or unusually phrased secrets can remain; review reports before sharing.

The local server allows GET/HEAD only, binds to loopback, prevents file traversal and hidden-file serving, and uses a restrictive content security policy. No secret API keys, external fonts, analytics, or runtime dependencies are included. Private hosting access is supplied by the hosting platform, not by a custom login in this app.

## Viva demonstration

1. Start with “The convincing employee”: legitimate-sounding personal knowledge, then a dangerous OTP request.
2. Play the call incrementally and note when the warning changes.
3. Compare “Bank safety advice”: the words OTP and AnyDesk appear without dangerous instructions.
4. Show the mixed-advice case, indirect digits, and customer-speaker case.
5. Load the flagged-number sample and then disable sample data to show unknown is not safe.
6. Add a local report, verify normalization with another format, and remove it.
7. Open Scenario lab, change identity/pretext/pressure, and load a generated call.
8. Run full synthetic coverage; explain why it does not establish real-world accuracy.

## Primary references

- RBI BE(A)WARE booklet: https://systemhealth.rbi.org.in/cms.rbi.org.in/cms/assets/Documents/BEAWARE07032022.pdf
- ICICI mobile banking safety: https://www.icici.bank.in/personal-banking/help/online-safe-banking/mobile-banking
- DoT/PIB Chakshu: https://www.pib.gov.in/PressReleasePage.aspx?PRID=2011383&lang=2&reg=3
- Web Speech API: https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition

Reviewed 15 September 2026. References inform pattern choices; they do not validate the implementation or endorse the project.
