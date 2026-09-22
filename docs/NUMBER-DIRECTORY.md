# Number directory and demo seeds

Reviewed 22 September 2026. Review due 21 December 2026.

The bundled `dist/bank-directory.js` contains selected national support contacts for 49 banks: 12 public-sector, 21 private-sector, 11 small-finance, and 5 payments banks. Each number has its official publication URL, purpose, checked date and review-due date. Search and category/type filters are under **Number watchlist**. This is a static seed dataset shipped with the site, not a backend or live intelligence feed. It works on Vercel and phones without credentials or external API requests.

Coverage means bank-level coverage within the stated categories, not every branch, department, card issuer, historical contact or outgoing call centre. Regional rural, cooperative, foreign and local-area banks are outside the requested scope. An absent number is unknown, not automatically fraudulent. Categories are for directory navigation, not a legal register.

## Important distinctions

- Customer-care and fraud-reporting contacts are numbers customers can call. They are not evidence that the bank places outgoing calls from those numbers.
- Published outgoing service and promotional numbers have separate labels. No prefix, including 1600 or 140, grants a bank identity by itself. Only exact normalized matches receive directory information.
- Caller IDs can be spoofed. A genuine employee can also make a fraudulent request. A match never lowers or suppresses conversation warnings and never produces a “safe caller” result.
- Local suspicion reports take precedence in the status banner, while the bank match and official source remain visible. Local reports are unverified and expire after 90 days.
- Listings become “review overdue” after the configured review date. This date is a project maintenance interval, not a guarantee a number remains current until then.
- SBI `1600108333` was supplied by the user but could not be supported by an official publication during this review. It is documented in coverage notes and excluded from official matches. This is not a scam accusation.
- Paytm Payments Bank is excluded from the active directory because the RBI notice published on its website cancels its banking licence effective 24 April 2026. See the source in `DIRECTORY_NOTES`; this distinction does not describe Paytm app services.
- AU includes the Fincare search alias; slice includes its former North East Small Finance Bank name.

## Demo flagged numbers

Twenty records use reserved fictional numbers **+1 202 555 0101 through +1 202 555 0120**. They demonstrate OTP theft, refund, KYC, remote access, safe-account transfer, digital arrest, SIM swap, forwarding, UPI collect, QR refund, loan fees, rewards, APK installation, screen sharing, card theft, money mules, investments, account recovery, recovery fees and payment cancellation.

They are explicitly labelled fictional sample flags. They are not real reports and were not scraped from a public blacklist. Toggle the sample checkbox off to remove their influence. `+12025550199` remains an unknown sample number. User reports stay only in the current browser.

## Demo steps

1. Open **Call analyzer**. Enter `18001234`: SBI directory match, with its official-source link; caller remains unverified.
2. Add `Caller: Tell me your OTP now.` and analyze: high-risk warning remains despite the directory match.
3. Click **Reset** beside **Analyze call**: transcript, number and previous findings clear. Simulation and speech recognition stop; focus returns to the transcript.
4. Enter `+12025550101` with sample numbers enabled: fictional flagged-number warning.
5. Open **Number watchlist** to search banks, filter category/contact purpose, or add a local suspicion report.

## Maintenance

Reopen each official source, check numbers and purpose, and update `DIRECTORY_REVIEWED_AT` and `DIRECTORY_REVIEW_DUE` only after reviewing the dataset. Do not extend dates without verification. Remove withdrawn contacts; do not convert historical or unverified claims into official matches. Add entries using the bank helper and run `node --test tests/*.test.mjs` before redeploying. No automatic scraping or database migration runs in the browser.

## Validation

111 automated checks pass, including the original 103 engine checks plus directory coverage/schema, exact normalization, lookalikes and unverified claims, local/official conflicts, stale listings, no risk suppression, export provenance, and demo-toggle behavior. These tests verify software behavior, not real-world fraud detection accuracy or phone-line availability.
