import test from 'node:test';
import assert from 'node:assert/strict';
import { analyze, normalizePhone, lookupNumber, DEMO_NUMBERS, RULES, MAX_TRANSCRIPT, exportReport } from '../dist/engine.js';
import { SCENARIOS } from '../dist/catalog.js';
import { scenarioAt, TOTAL_COMBINATIONS, buildScenario } from '../dist/scenario-lab.js';

const detect = transcript => analyze({ transcript });
const hasRule = (text, id) => assert.ok(detect(text).findings.some(f => f.id === id), `Missing ${id} for: ${text}`);
const adversarial = [
  ['Read your one-time passcode out loud.', 'secret-request'],
  ['Would you please provide the CVV for verification?', 'secret-request'],
  ['PIN bataiye, account check karna hai.', 'secret-request'],
  ['अपना पासवर्ड बताओ।', 'secret-request'],
  ['Please move the funds into the secure account.', 'safe-account'],
  ['Send funds to reverse that debit.', 'cancel-payment'],
  ['For cashback, enter the PIN in the app.', 'refund-pin'],
  ['To receive money, scan the QR.', 'qr-receive'],
  ['Transfer the charges to my private wallet.', 'personal-payee'],
  ['Pay the deposit to release the prize.', 'advance-fee'],
  ['Download TeamViewer so I can help.', 'remote-access'],
  ['Please install our APK file.', 'apk-install'],
  ['Give the app notification access.', 'permissions'],
  ['Please dial *401 to verify the account.', 'forwarding'],
  ['Activate the SIM replacement for your account.', 'sim-swap'],
  ['Please merge this incoming call with us.', 'merge-call'],
  ['Replace your registered mobile with this one.', 'account-change'],
  ['Authorize the collect request.', 'payment-approval'],
  ['Deactivate transaction alerts for verification.', 'disable-security'],
  ['Visit the link for bank login.', 'phishing-link'],
  ['Forward your passport to my personal email.', 'identity-documents'],
  ['Your card will be suspended immediately.', 'coercion'],
  ['Never contact the bank about this.', 'secrecy'],
  ['Police here: pay the deposit for your case.', 'authority-threat'],
  ['We know your balance, please trust us.', 'insider-claim'],
  ['Send funds to our risk-free return scheme.', 'investment'],
  ['Lend your bank account to our team.', 'money-mule'],
  ['Give us the OTP to recover your stolen money.', 'recovery-scam'],
  ['Copy the security message to my number.', 'forward-sms'],
  ['Tell me the recovery key.', 'recovery-secrets'],
  ['Provide the ATM withdrawal code.', 'atm-withdrawal'],
  ['Surrender your card to the pickup agent.', 'card-collection'],
  ['Open the sent link for video KYC.', 'biometric-request'],
  ['Clear your call history and messages.', 'erase-evidence'],
  ['Transfer a verification amount.', 'test-payment'],
  ['Apply for a loan and send the amount to us.', 'loan-diversion'],
  ['Allow the new device request.', 'login-approval'],
  ['Raise your UPI limit.', 'raise-limits'],
  ['Fill your password in our form.', 'credential-link']
];
for (const [text, id] of adversarial) test(`Variant: ${id}: ${text}`, () => hasRule(text, id));

const benign = [
  'Never share your OTP with anyone.',
  'Do not give your PIN to a caller.',
  "Don't install AnyDesk.",
  'Do not transfer money to a safe account.',
  'Never scan a QR code to receive a refund.',
  'We will not ask for your password.',
  'Your appointment is at the branch tomorrow.',
  'Your loan repayment is due next week. Check your app independently.',
  'You can find the repayment schedule in the app.',
  'Your replacement debit card has been dispatched.',
  'Your service request has been received.',
  'Please bring your identity documents to the branch.',
  'Never approve a collect request to receive cashback.',
  'Do not enable call forwarding.',
  'Never merge a verification call.',
  'Never give your debit card to a courier.',
  'Never disable Play Protect.',
  'Do not send your PAN on WhatsApp.',
  'Do not activate an eSIM at a caller’s request.',
  'Do not grant notification access.',
  'Never enter your password on this page.',
  'We never ask for your card number.',
  'Scammers may ask you to tell them your OTP.',
  'The fraudster said install AnyDesk.',
  'Kisi ko OTP mat batao.',
  'अपना ओटीपी मत बताओ।',
  'Caller: Please report this at your branch.\nCustomer: He told me to send money to a safe account.',
  'Customer: Give me your OTP and install AnyDesk.\nCaller: We never request a PIN.',
  'Customer: Read my OTP?\nNo, I will not do that.\nCaller: Please visit your branch.',
  'Never share your OTP, and never install AnyDesk.',
  'Please read the service request reference number from your letter.',
  'Your bank does not need your password for a support call.'
];
for (const [i, text] of benign.entries()) test(`Benign / educational ${i + 1}`, () => assert.equal(detect(text).level, 'unverified', text));

test('Mixed advice cannot suppress a real request after but', () => hasRule('Never share your OTP, but tell me your CVV.', 'secret-request'));
test('Mixed advice cannot suppress a real request after and', () => hasRule('Do not share your OTP and install AnyDesk.', 'remote-access'));
test('Dangerous request before safety advice is retained', () => hasRule('Tell me your OTP. Never share your password.', 'secret-request'));
test('Indirect digits request across caller turns', () => hasRule('Caller: A message will arrive shortly.\nCustomer: I have it.\nCaller: Give me those six digits.', 'indirect-code'));
test('Code reference too far away does not seed indirect detection', () => assert.ok(!detect('Caller: You will receive a code.\nCaller: One unrelated line.\nCaller: Another line.\nCaller: A third line.\nCaller: A fourth line.\nCaller: Read those six digits.').findings.some(f => f.id === 'indirect-code')));
test('Customer code references do not seed caller context', () => assert.ok(!detect('Customer: I received a code.\nCaller: Read those six digits.').findings.some(f => f.id === 'indirect-code')));
test('Safety advice does not seed indirect requests', () => assert.ok(!detect('Caller: Never share an OTP.\nCaller: Read those six digits.').findings.some(f => f.id === 'indirect-code')));
test('Single caution plus pressure escalates', () => assert.equal(detect('Pay a processing fee to release your loan. Your account will be blocked.').level, 'high'));
test('Context alone is not high risk', () => assert.equal(detect('I know your balance. Do not disconnect.').level, 'review'));
test('Repetition of one caution rule does not inflate severity', () => { const r = detect('Read out your full card number. Share your card expiry date.'); assert.equal(r.level, 'caution'); assert.equal(r.findings.length, 1); });
test('Routine identity claim is not proof or a warning by itself', () => assert.equal(detect('I am a bank employee, ID 7642.').level, 'unverified'));
test('No transcript is unverified', () => { const r = detect(''); assert.equal(r.level, 'unverified'); assert.equal(r.callerClauses, 0); });
test('Oversized input is rejected, never silently truncated', () => assert.throws(() => detect('a'.repeat(MAX_TRANSCRIPT + 1)), RangeError));
test('Non-text transcript is rejected', () => assert.throws(() => detect(null), TypeError));

test('Indian mobile normalization variants agree', () => {
  for (const n of ['9876543210', '09876543210', '+91 98765 43210', '919876543210', '0091-9876543210']) assert.equal(normalizePhone(n), '+919876543210');
});
test('International formatting normalizes', () => assert.equal(normalizePhone('+1 (202) 555-0101'), '+12025550101'));
test('Malformed numbers cannot accidentally match', () => { for (const n of ['', 'call me', '+91abc9876543210', '+91 123', '++12025550101', '12025550101', '999', '+12025550101x2']) assert.equal(normalizePhone(n), null, n); });
test('Unknown number never means safe', () => { const r = analyze({ phone: '+12025550199', entries: DEMO_NUMBERS }); assert.equal(r.reputation.state, 'unknown'); assert.equal(r.level, 'unverified'); assert.ok(r.limitations.some(x => x.includes('does not mean safe'))); });
test('Flagged number detected before caller speech', () => { const r = analyze({ phone: '+1 202 555 0101', entries: DEMO_NUMBERS }); assert.equal(r.level, 'high'); assert.equal(r.reputation.state, 'demo-flagged'); });
test('Turning sample data off removes fictional reputation evidence', () => assert.equal(analyze({ phone: '+12025550101', entries: [] }).reputation.state, 'unknown'));
test('Local reports remain unverified caution', () => { const r = analyze({ phone: '+12025550199', entries: [{ number: '+12025550199', source: 'local', label: 'Suspicion', expiresAt: '2099-01-01' }] }); assert.equal(r.level, 'caution'); assert.equal(r.reputation.state, 'reported'); });
test('Expired reports are distinct from current reports', () => { const r = lookupNumber('+12025550199', [{ number: '+12025550199', source: 'local', expiresAt: '2020-01-01' }], new Date('2026-09-15')); assert.equal(r.state, 'stale'); });
test('URL shortening flagged but not visited', () => hasRule('Open https://bit.ly/bank-check for bank KYC.', 'url-caution'));
test('Username URL trick flagged', () => hasRule('Open https://trusted.bank@example.com/login.', 'url-caution'));
test('Safety advice with a suspicious URL is not an instruction', () => assert.equal(detect('Do not click https://bit.ly/fake for bank verification.').level, 'unverified'));
test('Exports exclude raw transcript and redact codes / number', () => { const report = exportReport(analyze({ phone: '+12025550101', transcript: 'Caller: Tell me the OTP 123456 and the password is secretvalue.' })); const json = JSON.stringify(report); assert.ok(!json.includes('123456')); assert.ok(!json.includes('secretvalue')); assert.ok(!json.includes('+12025550101')); assert.ok(!('transcript' in report)); });
test('Unicode punctuation does not bypass an OTP request', () => hasRule('Tell me your ＯＴＰ.', 'secret-request'));
test('Catalog rule IDs are unique', () => assert.equal(new Set(RULES.map(r => r.id)).size, RULES.length));
test('Every advertised rule example is supported', () => { for (const r of RULES) for (const example of r.examples) hasRule(example, r.id); });
test('All curated suspicious scenarios produce signals', () => { for (const s of SCENARIOS.filter(s => s.category !== 'Legitimate example')) { const r = analyze({ transcript: s.lines.join('\n'), phone: s.phone, entries: DEMO_NUMBERS }); assert.ok(r.findings.length, s.id); } });
test('All curated legitimate scenarios avoid warnings', () => { for (const s of SCENARIOS.filter(s => s.category === 'Legitimate example')) assert.equal(detect(s.lines.join('\n')).level, 'unverified', s.id); });
test('Matrix boundaries and invalid selection are checked', () => { assert.equal(scenarioAt(0).id, 'matrix-1'); assert.equal(scenarioAt(TOTAL_COMBINATIONS - 1).id, `matrix-${TOTAL_COMBINATIONS}`); assert.throws(() => scenarioAt(-1)); assert.throws(() => scenarioAt(TOTAL_COMBINATIONS)); assert.throws(() => buildScenario({})); });
