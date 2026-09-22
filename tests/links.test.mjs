import test from 'node:test';
import assert from 'node:assert/strict';
import { analyze } from '../dist/engine.js';

const examples = [
  'Caller: Hello Mein aapke bank se baat kar rahi Hoon Mein abhi aapko Ek link bhejungi us link per jaakar AAP apna kyc update kar lijiyega.',
  'Caller: I will send you a link for your appointment.',
  'Caller: I have sent a link to your phone.',
  'Caller: Open the link for the delivery address.',
  'Caller: Main aapko ek link bhej raha hoon.',
  'Caller: Link pe jaake form bhar do.',
  'Caller: लिंक भेज रही हूँ, उस पर जाकर फॉर्म भरें।',
  'Caller: आपके फोन पर लिंक भेजा है।',
  'Caller: https://appointment.example/form',
  'Caller: Go to www.appointment.example',
  'Caller: Open appointment.example/form',
  'Caller: I sent a link.\nCustomer: What is it for?\nCaller: For an appointment.'
];
for (const [i, transcript] of examples.entries()) test(`Caller link requires verification ${i+1}`,()=>{
  const r=analyze({transcript});
  assert.ok(r.findings.some(f=>f.id==='phishing-link'),transcript);
  assert.equal(r.level,'caution');
  assert.match(r.nextStep,/Do not open.*until independently verified/);
});
for (const transcript of [
  'Caller: Never open a link sent by a stranger.',
  'Caller: Do not click https://appointment.example.',
  'Caller: Link mat kholo.',
  'Caller: लिंक मत खोलिए।',
  'Caller: I will not send any link.',
  'Customer: He sent a link to my phone.\nCaller: Please visit your branch.',
  'Caller: Please visit your branch to update KYC.',
  'Caller: You can find the repayment schedule in the app.'
]) test(`Safety advice or customer speech is not a link request: ${transcript}`,()=>assert.equal(analyze({transcript}).level,'unverified'));
test('A known bank number does not remove the transcript link warning',()=>assert.equal(analyze({phone:'18001234',transcript:examples[0]}).level,'caution'));
test('Multiple checks of one link do not create independent caution categories',()=>{
  const r=analyze({transcript:'Caller: Open https://bit.ly/example for your appointment.'});
  assert.ok(r.findings.some(f=>f.id==='url-caution'));
  assert.equal(r.level,'caution');
});
test('A link plus pressure or a credential request still escalates',()=>{
  assert.equal(analyze({transcript:'Caller: I sent you a link. Your account will be blocked within two minutes.'}).level,'high');
  assert.equal(analyze({transcript:'Caller: Open this link. Tell me your OTP.'}).level,'high');
});
test('Advice does not suppress a separate link instruction',()=>assert.ok(analyze({transcript:'Caller: Never share your OTP, but open the link I sent.'}).findings.some(f=>f.id==='phishing-link')));
