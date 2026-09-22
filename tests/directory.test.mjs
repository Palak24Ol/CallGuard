import test from 'node:test';
import assert from 'node:assert/strict';
import { analyze, lookupNumber, normalizePhone, DEMO_NUMBERS, exportReport } from '../dist/engine.js';
import { BANK_DIRECTORY, BANK_NUMBERS } from '../dist/bank-directory.js';
const now = new Date('2026-09-22T12:00:00Z');
const lookup = (n, entries = []) => lookupNumber(n, entries, now);

test('Every scoped bank has sourced contacts with review dates and exact lookup', () => {
  assert.deepEqual(Object.fromEntries(['Public sector', 'Private sector', 'Small finance', 'Payments'].map(c => [c, BANK_DIRECTORY.filter(b => b.category === c).length])), {'Public sector':12,'Private sector':21,'Small finance':11,'Payments':5});
  assert.equal(new Set(BANK_DIRECTORY.map(b => b.id)).size, BANK_DIRECTORY.length);
  assert.equal(new Set(BANK_NUMBERS.map(e => normalizePhone(e.number))).size, BANK_NUMBERS.length);
  for (const e of BANK_NUMBERS) {
    assert.ok(normalizePhone(e.number), e.number);
    assert.equal(new URL(e.sourceUrl).protocol, 'https:');
    assert.equal(e.checkedAt, '2026-09-22');
    assert.ok(new Date(e.reviewDue) > now);
    assert.equal(lookup(e.number).state, 'official');
    assert.ok(lookup(e.number).officialMatches.some(x => x.bankId === e.bankId));
  }
});
test('Service formats normalize without treating a foreign country prefix as Indian', () => {
  for (const n of ['1800 1234', '+91-1800-1234', '0091 1800 1234', '9118001234']) assert.equal(lookup(n).officialMatches[0].bankId, 'sbi');
  assert.equal(normalizePhone('044-71225000'), '+914471225000');
  assert.equal(lookup('155299').officialMatches[0].bankId, 'ippb');
  assert.equal(lookup('1800 1200 1200').officialMatches[0].bankId, 'au');
  assert.equal(lookup('+1 800 1234').state, 'unknown');
});
test('Lookalikes, unverified SBI claim and unlisted 1600 numbers never receive bank identity', () => {
  for (const n of ['1600108333', '1600999999', '18001235', '+9918001234', '180012340', '155298', '18001234 ext 1', '180O1234']) assert.equal(lookup(n).officialMatches.length, 0, n);
});
test('Official number never suppresses an OTP scam', () => {
  for (const phone of ['18001234', '1600313900']) {
    const r = analyze({phone, transcript:'Caller: Tell me your OTP now.', now});
    assert.equal(r.reputation.state, 'official');
    assert.equal(r.level, 'high');
    assert.ok(r.findings.some(e => e.id === 'secret-request'));
  }
});
test('A bank match alone does not certify safety or generate fraud findings', () => {
  const r = analyze({phone:'18001234', now});
  assert.equal(r.level, 'unverified');
  assert.equal(r.findings.length, 0);
});
test('A local flag wins over a bank listing while retaining both sources', () => {
  const entries = [{number:'18001234',source:'local',label:'Asked for OTP',expiresAt:'2026-12-01'}];
  const r = analyze({phone:'18001234', entries, now});
  assert.equal(r.reputation.state, 'reported');
  assert.equal(r.reputation.officialMatches[0].bankId, 'sbi');
  assert.equal(r.level, 'caution');
  entries[0].expiresAt='2020-01-01';
  assert.equal(lookup('18001234', entries).state,'stale');
});
test('Official snapshot visibly ages and exports its provenance', () => {
  assert.equal(lookupNumber('18001234',[],new Date('2027-01-01')).state, 'official-stale');
  const report = exportReport(analyze({phone:'18001234', now}));
  assert.equal(report.bankMatches[0].checkedAt,'2026-09-22');
  assert.ok(report.bankMatches[0].sourceUrl.startsWith('https://'));
});
test('All twenty fictional seeds flag only when enabled; unknown demo remains unknown', () => {
  assert.equal(DEMO_NUMBERS.length,20);
  for (const e of DEMO_NUMBERS) {
    assert.match(e.number,/^\+120255501(?:0[1-9]|1\d|20)$/);
    assert.equal(lookup(e.number,DEMO_NUMBERS).state,'demo-flagged');
    assert.equal(lookup(e.number,[]).state,'unknown');
  }
  assert.equal(lookup('+12025550199',DEMO_NUMBERS).state,'unknown');
  assert.equal(lookup('18001234',[]).state,'official');
});
