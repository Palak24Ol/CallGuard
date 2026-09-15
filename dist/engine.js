// Rules are deliberately explicit and inspectable. This is a risk-warning system,
// not an identity verifier, statistical probability model, or banking control.
export const ENGINE_VERSION = '1.0.0';
export const MAX_TRANSCRIPT = 40000;
const regexCache = new Map();
const re = p => { if (!regexCache.has(p)) regexCache.set(p, new RegExp(p, 'iu')); return regexCache.get(p); };
const has = (t, p) => re(p).test(t);
const any = (t, patterns) => patterns.some(p => has(t, p));
const request = t => has(t, 'tell|read|share|send|give|provide|confirm|reveal|forward|bol(?:o|iye)|bata(?:o|iye|na)|bhej|de do|बताइ|बताओ|बोलिए|भेज|दीजिए|दें');
const action = t => has(t, 'please|you (?:must|need|have to|should)|transfer|send|pay|move|deposit|install|download|open|click|scan|enter|approve|accept|activate|dial|press|merge|enable|disable|do it|karo|kijiye|kar do|bhej|करें|करो|कीजिए|भेज|डाल|दबाइ|खोल');
const secret = t => has(t, '\\botp\\b|one[ -]time (?:pass|code)|\\bpin\\b|\\bcvv\\b|password|passcode|verification code|security code|transaction code|ओटीपी|ओ टी पी|पिन|पासवर्ड|सीवीवी');
const money = t => has(t, 'transfer|send|pay|move|deposit|payment|paisa|paise|bhej|भुगतान|पैसे|ट्रांसफर|जमा');
const make = (id, title, category, severity, description, advice, patterns, examples, opts = {}) => ({ id, title, category, severity, description, advice, examples, ...opts, match: typeof patterns === 'function' ? patterns : t => any(t, patterns) });

export const RULES = [
  make('secret-request', 'Secret banking information requested', 'Credentials', 'high', 'A caller asks you to disclose an OTP, PIN, CVV, password, or verification code.', 'Do not reveal the secret. End the call and contact your bank independently.', t => request(t) && secret(t), ['Tell me the OTP to cancel the transaction.', 'Apna OTP batao, main bank se hoon.']),
  make('card-details', 'Full card details requested', 'Credentials', 'medium', 'A caller requests a full card number or expiry details. This needs independent verification.', 'Do not provide full card information on an unsolicited call.', t => request(t) && has(t, '(?:full|complete|16[ -]?digit|poora|pura) (?:card|debit|credit)|card (?:number|expiry|expiration)|कार्ड नंबर'), ['Read out your full card number.', 'Share your card expiry date.']),
  make('safe-account', 'Money moved to a “safe” account', 'Payments', 'high', 'The caller presents a transfer as a way to protect, verify, or unfreeze your money.', 'Do not transfer money. Verify the claim through your bank’s official app or branch.', t => money(t) && has(t, 'safe(?:ty)? account|secure account|security account|protect (?:your |the )?(?:money|funds)|verification account|reserve bank account|unfreeze|सुरक्षित खाते'), ['Transfer your savings to our safe account.', 'Move your money into a security account.']),
  make('cancel-payment', 'Payment requested to stop a payment', 'Payments', 'high', 'The caller asks for a payment or approval to cancel, reverse, or block another transaction.', 'Do not pay or approve a request to cancel a debit. Check with your bank directly.', t => money(t) && has(t, 'cancel|stop|reverse|block|रोक|रद्द') && has(t, 'transaction|debit|payment|charge|fraud|लेनदेन'), ['Pay 5000 to cancel the fraudulent transaction.', 'Send a payment to stop the debit.']),
  make('refund-pin', 'PIN or approval requested to receive money', 'Payments', 'high', 'The caller connects receiving a refund or cashback with entering a PIN or approving a collect request.', 'Check the direction of the payment in your own app. Do not approve a debit to receive a refund.', t => has(t, 'refund|cashback|receive|receiving|credit (?:your|the)|paise mil|रिफंड|पैसे पाने') && has(t, 'enter.*pin|pin.*(?:enter|daal|dalo)|approve|accept.*(?:collect|request)|पिन.*डाल'), ['Enter your UPI PIN to receive the refund.', 'Approve the collect request for cashback.']),
  make('qr-receive', 'QR scan requested to receive money', 'Payments', 'high', 'The caller claims scanning their QR code will deliver money to you.', 'Do not scan a caller’s QR code to receive a payment.', t => has(t, 'scan|स्कैन') && has(t, '\\bqr\\b|क्यूआर') && has(t, 'refund|receive|cashback|credit|money|paise|पैसे|रिफंड'), ['Scan this QR code to receive your refund.', 'Cashback ke paise ke liye QR scan karo.']),
  make('personal-payee', 'Payment to a personal or unofficial destination', 'Payments', 'high', 'The caller directs a bank-related payment to a personal account, private wallet, or cryptocurrency address.', 'Do not pay the caller. Confirm the beneficiary and purpose independently.', t => money(t) && has(t, '(?:my|personal|private|employee|staff) (?:account|upi|wallet)|gift card|bitcoin|crypto(?:currency)?|mera account|mere account|मेरे खाते|निजी खाते'), ['Pay the KYC fee to my personal UPI ID.', 'Send the security deposit in bitcoin.']),
  make('advance-fee', 'Upfront fee for a benefit', 'Payments', 'medium', 'An upfront payment is tied to releasing a loan, prize, refund, reward, or recovered funds. Fees can exist legitimately, so context matters.', 'Verify the offer and fee using a bank channel you opened independently.', t => money(t) && has(t, 'fee|deposit|tax|charge|शुल्क|फीस') && has(t, 'loan|prize|lottery|reward|refund|release|recover|लोन|इनाम'), ['Pay a processing fee to release your loan.', 'Send tax first to claim your lottery prize.']),
  make('remote-access', 'Remote access or screen sharing requested', 'Device access', 'high', 'The caller asks to install remote-control software or share a screen.', 'Do not give remote access or show your banking screen to the caller.', t => (action(t) && has(t, 'anydesk|teamviewer|quick ?support|rustdesk|remote (?:access|control)|screen ?share|screen[ -]sharing')) || has(t, 'share (?:your|the) screen|screen (?:share karo|dikhao)|स्क्रीन.*(?:शेयर|दिखा)'), ['Install AnyDesk to complete your KYC.', 'Share your screen and open the banking app.']),
  make('apk-install', 'Unverified app installation requested', 'Device access', 'high', 'The caller asks you to install a sent APK, an app from a link, or allow unknown sources.', 'Do not install the file. Find your bank app through an independently verified source.', t => action(t) && has(t, '\\bapk\\b|unknown sources|app (?:from|using|through) (?:this|the|my) link|app (?:i|we) sent|अज्ञात.*ऐप'), ['Install the APK I sent for verification.', 'Enable unknown sources to install our bank app.']),
  make('permissions', 'Sensitive phone permissions requested', 'Device access', 'high', 'The caller requests accessibility, device administrator, SMS-reading, or notification access.', 'Do not grant these permissions to an app at a caller’s instruction.', t => has(t, 'allow|enable|grant|turn on|give|permission.*do|अनुमति') && has(t, 'accessibility|device admin|(?:read|reading|access).*sms|sms.*(?:read|reading|access)|notification access'), ['Enable accessibility permission for this app.', 'Grant the app SMS reading access.']),
  make('forwarding', 'Call forwarding or dial code requested', 'Phone takeover', 'high', 'The caller asks you to enable call forwarding or dial a service code.', 'Do not dial the code. Contact your mobile operator independently.', t => (action(t) && has(t, 'call forwarding|forward (?:your |all )?calls|\\*\\*?(?:21|61|62|67|401)')) || has(t, 'dial.*(?:star|asterisk).*\\d'), ['Dial **21* to activate bank verification.', 'Enable call forwarding for the security check.']),
  make('sim-swap', 'SIM or eSIM activation instructions', 'Phone takeover', 'medium', 'An unexpected caller asks for SIM/eSIM activation, an EID, or a SIM change. This can facilitate account takeover.', 'Verify directly with your mobile operator before changing a SIM or eSIM.', t => action(t) && has(t, '\\besim\\b|sim (?:swap|replace|replacement|upgrade|activation)|\\beid\\b|सिम.*(?:बदल|अपग्रेड)'), ['Activate this eSIM to keep your bank account active.', 'Send your EID for the SIM upgrade.']),
  make('merge-call', 'Call merging requested', 'Phone takeover', 'high', 'The caller asks you to merge another incoming or verification call, which may expose a spoken code.', 'Do not merge an incoming verification call with this caller.', t => has(t, 'merge|conference|join.*call|मर्ज') && has(t, 'call|कॉल') && action(t), ['Merge the next incoming call for bank verification.', 'Please conference the verification call with me.']),
  make('account-change', 'Account recovery or contact changes requested', 'Account takeover', 'medium', 'The caller directs changes to a password, registered phone/email, recovery code, or beneficiary.', 'Open your bank app independently and verify why the change is needed.', t => has(t, 'change|replace|reset|add|update|बदल') && has(t, 'registered (?:mobile|phone|email)|recovery (?:code|email|phone)|password|beneficiary|payee|पंजीकृत'), ['Change your registered email to the address I give you.', 'Add this beneficiary for account verification.']),
  make('payment-approval', 'Unsolicited payment approval instruction', 'Payments', 'medium', 'The caller asks you to approve a collect request, payment prompt, or recurring mandate.', 'Read the amount, beneficiary, direction, and mandate details yourself before doing anything.', t => has(t, 'approve|accept|authorize|authorise|स्वीकार') && has(t, 'collect request|payment request|mandate|autopay|payment prompt|debit request'), ['Approve the payment request I just sent.', 'Accept the autopay mandate now.']),
  make('disable-security', 'Security controls disabled', 'Device access', 'high', 'The caller asks you to disable protection, alerts, or two-factor authentication.', 'Keep security protections enabled and end the call.', t => has(t, 'disable|turn off|deactivate|ignore|band kar|बंद') && has(t, 'antivirus|play protect|security warning|fraud warning|transaction alerts|two[ -]factor|2fa|sms alerts|सुरक्षा'), ['Turn off Play Protect to continue.', 'Ignore the fraud warning in your bank app.']),
  make('phishing-link', 'Banking or KYC through a caller-supplied link', 'Links & identity', 'medium', 'The caller instructs you to open a supplied link for banking, credentials, or KYC.', 'Open your bank’s official app yourself; do not use the caller’s link.', t => has(t, 'click|open|visit|follow|खोल|क्लिक') && has(t, 'link|https?://|लिंक') && has(t, 'kyc|bank|login|log in|verify|verification|card|केवाईसी|बैंक'), ['Click the link I sent to update your bank KYC.', 'Open https://bank-login.example to verify your card.']),
  make('identity-documents', 'Identity documents requested on a personal channel', 'Links & identity', 'medium', 'The caller asks to send Aadhaar, PAN, identity documents, or a selfie through WhatsApp or a personal channel.', 'Verify the document request and use an official bank submission channel.', t => request(t) && has(t, 'aadhaar|aadhar|\\bpan\\b|passport|selfie|identity document|आधार|पैन') && has(t, 'whatsapp|personal|telegram|my email|व्हाट्सएप'), ['Send your Aadhaar and selfie to my WhatsApp.', 'Share your PAN on my personal email.']),
  make('coercion', 'Threat or artificial deadline', 'Pressure tactics', 'context', 'The caller threatens account closure, arrest, or penalties, or imposes a very short deadline.', 'Pause. Urgency does not prove a request is legitimate.', t => has(t, '(?:account|card|kyc|sim).{0,55}(?:block|suspend|clos|freez|deactivat)|(?:block|suspend|freez).{0,35}(?:account|card)|within (?:\\d+|two|five|ten) minutes|immediately or|last chance|arrest warrant|अकाउंट.*बंद|खाता.*बंद|तुरंत|abhi nahi.*band'), ['Your account will be blocked within two minutes.', 'Act immediately or we will freeze your account.']),
  make('secrecy', 'Caller discourages independent verification', 'Pressure tactics', 'context', 'The caller tells you to keep the request secret, stay on the line, or avoid the bank or family.', 'End the call and independently contact your bank or someone you trust.', t => has(t, '(?:do not|don.t|never|must not|cannot).{0,30}(?:hang up|disconnect|tell (?:anyone|your family|the bank)|contact (?:your |the )?(?:bank|branch)|call (?:your |the )?(?:bank|branch|customer care))|keep (?:this|it) (?:secret|confidential)|kisi ko mat bata|call mat kaat|किसी को मत बता|कॉल मत काट'), ['Do not disconnect or contact your branch.', 'Kisi ko mat batana, call mat kaatna.'], { keepNegation: true }),
  make('authority-threat', 'Police or regulator used to demand money', 'Impersonation', 'high', 'The caller invokes police, CBI, RBI, courts, or “digital arrest” to demand funds or secrets.', 'Do not transfer money or disclose credentials. Independently verify the claim.', t => has(t, '\\brbi\\b|\\bcbi\\b|police|court|digital arrest|money laundering|पुलिस|डिजिटल अरेस्ट') && ((money(t) && action(t)) || (secret(t) && request(t)) || has(t, 'digital arrest|डिजिटल अरेस्ट')), ['You are under digital arrest; transfer a security deposit.', 'This is RBI, send money to clear the investigation.']),
  make('insider-claim', 'Personal details used to establish trust', 'Impersonation', 'context', 'The caller uses knowledge of your balance or transactions as a reason to trust them. Knowledge does not authenticate a caller.', 'Evaluate the request independently, even if the details are correct.', t => has(t, '(?:i|we) know your (?:balance|account|pan|address|transaction)|your balance is|your last transaction|employee id.{0,40}(?:trust|prove)|mujhe aapka.*pata'), ['I know your balance and your last transaction, so trust me.', 'Your balance is 42000, which proves I work at your bank.']),
  make('investment', 'Guaranteed returns or exclusive investment', 'Offers', 'medium', 'The caller promises guaranteed, very high, or doubled returns and urges investment.', 'Verify the product and seller independently. Do not invest during the call.', t => has(t, 'guaranteed (?:profit|return)|double your money|risk[ -]free (?:profit|return)|bank insider tip|पैसे दोगुने') && has(t, 'invest|send|pay|transfer|deposit|offer|scheme|plan|निवेश'), ['Invest in our scheme for guaranteed returns.', 'Deposit today to double your money.']),
  make('money-mule', 'Account used to route someone else’s funds', 'Payments', 'high', 'The caller offers commission to receive and forward money or lend/rent your bank account.', 'Do not lend your account or move funds for the caller.', t => has(t, '(?:rent|lend|borrow).{0,25}(?:bank )?account|commission.{0,80}(?:receive|forward|transfer)|receive.{0,80}(?:forward|send it on).{0,60}(?:commission|keep)'), ['Rent your bank account to us for a commission.', 'Receive funds and forward them; keep a commission.']),
  make('recovery-scam', 'Recovery service demands access or fees', 'Offers', 'high', 'The caller promises to recover stolen money in exchange for an upfront payment or banking secret.', 'Do not pay unsolicited recovery agents or share banking secrets.', t => has(t, 'recover|recovery|get back') && has(t, 'stolen|lost|scammed|fraud|money') && ((money(t) && has(t, 'fee|upfront|deposit')) || (secret(t) && request(t))), ['Pay an upfront fee to recover your stolen money.', 'Share your OTP so we can recover the lost funds.']),
  make('forward-sms', 'SMS or verification message forwarded', 'Credentials', 'high', 'Forwarded banking or registration messages can expose verification secrets without the caller saying OTP.', 'Do not forward banking or device-registration messages to the caller.', t => has(t, 'forward|copy|send|bhej|भेज') && has(t, '(?:bank|verification|registration|activation|security) (?:sms|message)|(?:sms|message).{0,30}(?:to me|to my|number i|mere)'), ['Forward the bank SMS to me.', 'Send the registration message to my number.']),
  make('recovery-secrets', 'Recovery secret or backup code requested', 'Credentials', 'high', 'The caller asks for backup codes, recovery keys, or a wallet seed phrase.', 'Keep recovery secrets private. Anyone with them may gain access.', t => request(t) && has(t, 'backup codes?|recovery key|seed phrase|recovery phrase|12[ -]word|24[ -]word'), ['Read your backup codes to me.', 'Share your wallet recovery phrase.']),
  make('atm-withdrawal', 'ATM withdrawal used for verification', 'Payments', 'high', 'The caller requests a cardless withdrawal code or asks for an ATM withdrawal as a verification step.', 'Do not provide withdrawal codes or withdraw cash for a caller’s verification.', t => (request(t) && has(t, '(?:cardless|atm|withdrawal).{0,25}code')) || (has(t, 'withdraw|निकाल') && has(t, 'cash|money|पैसे') && has(t, 'verify|verification|safe|security')), ['Tell me the cardless withdrawal code.', 'Withdraw cash for account verification.']),
  make('card-collection', 'Bank card or cash collected by a courier', 'Payments', 'high', 'The caller asks you to hand a card, cash, or cheque to their courier or representative.', 'Do not hand over a card or cash. Verify the collection with your bank independently.', t => has(t, 'give|hand|send|surrender|दे') && has(t, 'card|cash|cheque|कार्ड|नकद') && has(t, 'courier|collector|representative|pickup|pick.up|agent'), ['Hand your debit card to our courier.', 'Give cash to our collection representative for safekeeping.']),
  make('biometric-request', 'Biometric or video verification on a caller’s channel', 'Links & identity', 'medium', 'The caller requests fingerprint authentication or an identity video through their own channel. Legitimate bank verification exists, so independently verify the session.', 'Start any identity verification yourself through your bank’s official channel.', t => action(t) && has(t, 'fingerprint|biometric|video kyc|identity video') && has(t, 'link|whatsapp|my|sent|device|scanner'), ['Open my link to complete video KYC.', 'Please use this fingerprint scanner for bank verification.']),
  make('erase-evidence', 'Caller asks to erase evidence or avoid reporting', 'Pressure tactics', 'context', 'The caller asks you to delete messages or not report the interaction.', 'Keep the evidence and verify independently. Do not follow instructions to hide the interaction.', t => has(t, '(?:delete|erase|clear).{0,25}(?:sms|messages|chat|call history|recording)|(?:do not|don.t|never) report|शिकायत मत|मैसेज.*डिलीट'), ['Delete the SMS and our chat history.', 'Do not report this call.'], { keepNegation: true }),
  make('test-payment', 'Small payment framed as verification', 'Payments', 'medium', 'The caller asks for a test payment to verify an account or activate a service.', 'Do not treat a small amount as proof of safety. Verify the purpose and beneficiary.', t => money(t) && has(t, '(?:test|trial|verification|activation) (?:payment|transfer|amount|fee)|(?:one rupee|1 rupee|small amount).{0,40}(?:verify|activate)'), ['Send a test payment for account verification.', 'Pay one rupee to activate your account.']),
  make('loan-diversion', 'Take a loan and pass the funds on', 'Account takeover', 'high', 'The caller asks you to take or accept a loan and transfer the proceeds for verification or to another account.', 'Do not borrow or transfer money at an unsolicited caller’s instruction.', t => has(t, 'take|accept|apply|activate') && has(t, 'loan') && has(t, 'transfer|send|forward|verification|security'), ['Take a loan and transfer the amount to our account.', 'Accept the loan for security verification.']),
  make('login-approval', 'Sign-in or device-link approval requested', 'Account takeover', 'medium', 'The caller asks you to approve a login, device linking, or authentication notification.', 'Approve only a sign-in you initiated and recognise on your own device.', t => has(t, 'approve|accept|allow|confirm') && has(t, 'login|sign.in|device link|authentication (?:prompt|notification)|new device'), ['Approve the login notification I sent.', 'Accept the new device linking request.']),
  make('raise-limits', 'Payment limits raised at caller’s direction', 'Account takeover', 'medium', 'The caller asks you to increase limits or enable international transactions.', 'Verify the service request independently before changing payment limits.', t => (has(t, 'increase|raise|enhance') && has(t, '(?:payment|transfer|transaction|upi|card) limit')) || (has(t, 'enable|activate') && has(t, 'international transactions|overseas payments')), ['Increase your transfer limit to complete verification.', 'Enable international transactions on your card.']),
  make('credential-link', 'Secrets entered into a caller-supplied page', 'Credentials', 'high', 'The caller asks you to enter banking credentials on a page or link they supplied.', 'Do not enter secrets on that page. Open your bank app independently.', t => has(t, 'enter|type|fill|डाल') && secret(t) && has(t, '(?:this|my|sent|given|our) (?:link|page|website|form)|link (?:i|we) sent'), ['Enter your password on this page.', 'Type the OTP in the link I sent.'])
];

export const DEMO_NUMBERS = [
  { number: '+12025550101', label: 'Sample: reported impersonation', source: 'demo', status: 'flagged', reason: 'Fictional example for a flagged-number test. Not a live intelligence record.', updatedAt: '2026-09-15', expiresAt: '2099-01-01' },
  { number: '+12025550102', label: 'Sample: reported refund scam', source: 'demo', status: 'flagged', reason: 'Fictional example for a refund-call test. Not a live intelligence record.', updatedAt: '2026-09-15', expiresAt: '2099-01-01' }
];

export function normalizePhone(input) {
  if (typeof input !== 'string' || !input.trim()) return null;
  let n = input.trim();
  if (!/^[+\d\s().-]+$/.test(n)) return null;
  n = n.replace(/[\s().-]/g, '');
  if (n.startsWith('00')) n = '+' + n.slice(2);
  if (/^0[6-9]\d{9}$/.test(n)) n = '+91' + n.slice(1);
  else if (/^[6-9]\d{9}$/.test(n)) n = '+91' + n;
  else if (/^91[6-9]\d{9}$/.test(n)) n = '+' + n;
  return /^\+[1-9]\d{7,14}$/.test(n) ? n : null;
}

export function lookupNumber(input, entries = [], now = new Date()) {
  if (!String(input || '').trim()) return { state: 'missing', title: 'Number not provided', entries: [] };
  const number = normalizePhone(input);
  if (!number) return { state: 'invalid', title: 'Check the number format', entries: [] };
  const found = entries.filter(e => normalizePhone(e.number) === number);
  if (!found.length) return { state: 'unknown', title: 'No local record', number, entries: [] };
  const active = found.filter(e => !e.expiresAt || new Date(e.expiresAt + 'T23:59:59Z') >= now);
  if (!active.length) return { state: 'stale', title: 'Expired local report', number, entries: found };
  const demo = active.some(e => e.source === 'demo');
  return { state: demo ? 'demo-flagged' : 'reported', title: demo ? 'Flagged in sample data' : 'Locally reported · unverified', number, entries: active };
}

export function redact(text) {
  return String(text).replace(/https?:\/\/[^\s<>]+/gi, '[link]')
    .replace(/[\w.+-]+@[\w.-]+/g, '[address]')
    .replace(/((?:password|passcode|cvv|pin|otp)\s*(?:is|:|=)\s*)[^\s,;.]+/gi, '$1[redacted]')
    .replace(/\b(?:\d[ -]?){3,}\d\b/g, '[digits]');
}

function preventive(t) {
  // Split adversative clauses before this check so “never share an OTP, but
  // tell me your PIN” cannot suppress the second request.
  return has(t, "\\b(?:never|do not|don't|dont|must not|should not)\\s+(?:ever\\s+)?(?:share|tell|give|read|send|provide|reveal|enter|scan|click|install|download|transfer|pay|approve|merge|dial|enable|activate|disable|open|accept|grant|forward|rent|lend|change|add|invest|deposit|use|turn off|ignore)\\b") ||
    has(t, '(?:bank|we|i|staff|employees?).{0,25}(?:never|will not|won.t|do not|don.t) (?:ask|request|need)') ||
    has(t, '(?:kabhi|kisi ko).{0,30}(?:mat|nahi) (?:bata|bhej|do|share)|(?:otp|pin|password).{0,25}(?:mat bata|share mat|nahi bata)|(?:मत|नहीं).{0,10}(?:बताइ|बताओ|भेज|देना|शेयर)|(?:not asking|not requesting)') ||
    has(t, '^(?:beware|watch out|scammers?|fraudsters?|a scammer|the scammer|a fraudster|the fraudster).{0,65}(?:ask|said|say|request|tell|trick)');
}

export function parseTranscript(transcript) {
  if (typeof transcript !== 'string') throw new TypeError('Transcript must be text.');
  if (transcript.length > MAX_TRANSCRIPT) throw new RangeError(`Transcript exceeds ${MAX_TRANSCRIPT.toLocaleString()} characters. Split the call into smaller parts.`);
  let role = 'caller';
  return transcript.replace(/\r/g, '').split('\n').flatMap((line, lineIndex) => {
    const prefix = line.match(/^\s*(caller|agent|employee|scammer|customer|user|recipient|system)\s*:\s*/i);
    if (prefix) role = ['customer', 'user', 'recipient', 'system'].includes(prefix[1].toLowerCase()) ? 'customer' : 'caller';
    const text = prefix ? line.slice(prefix[0].length) : line;
    return text.split(/(?<=[!?।;])\s*|(?<!\d)\.(?!\d|[a-z])\s+|\s*,?\s*\b(?:but|however|instead|lekin)\b\s*|\s+(?:and|aur)\s+(?=(?:(?:please|never)\s+)?(?:tell|share|install|send|give|transfer|pay|enter|approve|open|disable|enable|read|scan|dial)\b)/iu)
      .map(s => s.trim()).filter(Boolean).map(text => ({ text, role, line: lineIndex + 1 }));
  });
}

function urlFindings(text) {
  const urls = text.match(/https?:\/\/[^\s<>]+/gi) || [];
  return urls.flatMap(raw => {
    try {
      const url = new URL(raw.replace(/[),.;]+$/, ''));
      const host = url.hostname.toLowerCase();
      let detail;
      if (url.username || url.password) detail = 'The address hides its destination behind an @ sign.';
      else if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host) || host.includes('xn--')) detail = 'The address uses an IP address or encoded international domain; verify it independently.';
      else if (['bit.ly', 'tinyurl.com', 't.co', 'cutt.ly', 'shorturl.at', 'rb.gy'].includes(host)) detail = 'A shortened link hides the final destination.';
      else if (/(?:bank|sbi|hdfc|icici|axis|kotak|kyc|secure|verify|login)/.test(host) && /(?:login|verify|kyc|secure|update)/.test(host)) detail = 'Banking or verification wording in a domain is not proof that a bank owns it.';
      if (!detail) return [];
      return [{ id: 'url-caution', title: 'Caller-supplied link needs verification', category: 'Links & identity', severity: 'medium', description: detail, advice: 'Do not open this link. Open your bank app independently.', evidence: raw, line: 0 }];
    } catch { return []; }
  });
}

export function analyze({ transcript = '', phone = '', entries = [], now } = {}) {
  const clauses = parseTranscript(transcript);
  const caller = clauses.filter(c => c.role === 'caller');
  const findings = [];
  const seen = new Set();
  const add = (r, evidence, line = 0) => {
    if (seen.has(r.id)) return;
    seen.add(r.id);
    const { match, examples, keepNegation, ...data } = r;
    findings.push({ ...data, evidence, line });
  };
  for (const clause of caller) {
    const t = clause.text.normalize('NFKC').toLowerCase().replace(/[’‘]/g, "'");
    for (const rule of RULES) {
      if (!rule.keepNegation && preventive(t)) continue;
      if (rule.match(t)) add(rule, clause.text, clause.line);
    }
    if (!preventive(t)) for (const f of urlFindings(clause.text)) add(f, f.evidence, clause.line);
  }
  // Keep a bounded window across caller turns. A customer's words must not
  // become a caller request, and a safety warning must not seed this pattern.
  for (let i = 0; i < caller.length; i++) {
    const c = caller[i];
    if (preventive(c.text)) continue;
    const history = caller.slice(Math.max(0, i - 3), i).filter(x => !preventive(x.text)).map(x => x.text).join(' ');
    if (history) {
      for (const rule of RULES.filter(r => ['money-mule', 'loan-diversion', 'refund-pin', 'qr-receive', 'personal-payee', 'safe-account'].includes(r.id))) {
        if (rule.match((history + ' ' + c.text).toLowerCase())) add(rule, history + ' → ' + c.text, c.line);
      }
    }
    if (has(history, 'receive|receiving|sent|message|sms|code|otp|aayega|bheja|आएगा|मैसेज') &&
        request(c.text) && has(c.text, '(?:six|6|four|4)[ -]?(?:digit|number)|those (?:digits|numbers)|that code|the code|woh code|wo code|chhe ank|वह कोड|छह अंक') && !seen.has('secret-request')) {
      add({ id: 'indirect-code', title: 'Code requested across the conversation', category: 'Credentials', severity: 'high', description: 'An earlier message/code reference is followed by a request to read back its digits.', advice: 'Do not disclose the code, even when the caller avoids the word OTP.' }, history + ' → ' + c.text, c.line);
    }
  }
  const reputation = lookupNumber(phone, entries, now);
  if (['demo-flagged', 'reported', 'stale'].includes(reputation.state)) add({ id: 'number-reputation', title: reputation.title, category: 'Number reputation', severity: reputation.state === 'demo-flagged' ? 'high' : 'medium', description: reputation.state === 'demo-flagged' ? 'This number matches fictional flagged data used only for demonstrations.' : 'A device-local report is a reason to verify, not proof of the caller’s identity or guilt.', advice: 'Verify independently. Caller IDs can be spoofed, and local reports may be wrong or outdated.' }, reputation.entries.map(e => e.label).join('; '));
  const high = findings.filter(f => f.severity === 'high').length;
  const medium = findings.filter(f => f.severity === 'medium').length;
  const context = findings.filter(f => f.severity === 'context').length;
  const combined = !high && ((medium >= 2) || (medium >= 1 && context >= 1));
  const level = high || combined ? 'high' : medium ? 'caution' : context ? 'review' : 'unverified';
  const labels = { high: 'High-risk indicators', caution: 'Caution · verify first', review: 'Pressure or trust cues', unverified: 'No listed warning detected' };
  return {
    engineVersion: ENGINE_VERSION, level, label: labels[level], findings,
    combination: combined ? 'Multiple independent warning categories appeared together. Treat the request as high risk until independently verified.' : null,
    reputation, callerClauses: caller.length,
    coverage: !caller.length ? 'No caller speech to assess.' : 'English, selected Hinglish and Hindi patterns. Unknown wording, transcription errors, and missing context can hide scams.',
    nextStep: level === 'high' ? 'Stop the requested action. End the call and independently contact your bank.' : level === 'caution' ? 'Pause before sharing information, changing settings, or making a payment. Verify with your bank.' : 'This result does not establish safety. Keep banking secrets private and verify unexpected requests.',
    limitations: ['No listed warning does not mean safe.', 'A caller’s identity or honesty cannot be proved from this call.', 'Number data is sample or local-only; no live intelligence provider is connected.', 'Warnings cannot block phone calls or bank transactions.']
  };
}

export function exportReport(result) {
  return {
    project: 'CallGuard', generatedAt: new Date().toISOString(), engineVersion: result.engineVersion,
    risk: result.label, callerNumber: result.reputation.number ? '••••' + result.reputation.number.slice(-4) : null,
    numberStatus: result.reputation.state, combination: result.combination,
    findings: result.findings.map(f => ({ rule: f.id, title: f.title, severity: f.severity, reason: f.description, evidence: redact(f.evidence), line: f.line, recommendedAction: f.advice })),
    nextStep: result.nextStep, limitations: result.limitations,
    privacy: 'Raw transcript excluded. Evidence is automatically redacted on a best-effort basis; review before sharing.'
  };
}

