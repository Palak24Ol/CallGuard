# Caller-supplied link warning

CallGuard now raises a caution when caller speech offers/sends a link, asks the customer to use one, or contains a supported web address. No banking/KYC keyword is required. English and selected Hinglish/Hindi forms include “link bhejungi”, “link pe jaake”, and “लिंक भेजा है”.

The assessment says: **Pause this activity. Do not open the caller’s link until independently verified. Use the official app or a contact you already trust.**

The warning means unverified, not proven malicious. It does not inspect the website, follow the URL, read phone messages, or block anything on the phone. Customer speech and recognized preventive advice do not trigger this rule. A bank-number match cannot suppress it. Multiple caution checks in the same category do not count as independent categories; pressure or other suspicious requests can still escalate the result.

The existing `phishing-link` rule was broadened, so the conversation-rule count remains 37. Engine version: 1.1.1. The screenshot's exact transcript is covered by a regression check. 135 automated checks passed (111 prior checks plus 24 link-related checks). This is software validation, not proof of detection for every possible phrase.

Demo transcript:

    Caller: Hello Mein aapke bank se baat kar rahi Hoon Mein abhi aapko Ek link bhejungi us link per jaakar AAP apna kyc update kar lijiyega.

Expected result: **Caution · verify first**, with a caller-supplied-link finding and the instruction not to open it until independently verified.
