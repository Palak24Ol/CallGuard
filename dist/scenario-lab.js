import { RULES, DEMO_NUMBERS } from './engine.js';

export const DIMENSIONS = {
  identities: ['Branch employee', 'Relationship manager', 'Fraud desk officer', 'Card support agent', 'KYC executive', 'Loan department employee', 'Bank IT support', 'RBI representative'],
  pretexts: ['an account security review', 'a KYC update', 'an unknown card transaction', 'a refund for an extra charge', 'a debit card replacement', 'a loan application', 'reward points about to expire', 'a dormant account', 'a failed UPI payment', 'an insurance charge on your account', 'a pension or subsidy credit', 'a FASTag or wallet issue'],
  tactics: RULES.map(r => ({ id: r.id, name: r.title, text: r.examples[0] })),
  pressure: ['No added pressure', 'Urgent deadline', 'Secrecy', 'Avoid independent verification'],
  numbers: ['No number supplied', 'Unknown fictional number', 'Flagged fictional number'],
  knowledge: ['No personal details', 'Claims to know the customer’s balance']
};
const pressureLines = ['', 'Your account will be blocked within two minutes.', 'Keep this secret and do not tell anyone.', 'Do not disconnect or contact your branch.'];
const phones = ['', '+12025550199', DEMO_NUMBERS[0].number];
const keys = Object.keys(DIMENSIONS);
export const TOTAL_COMBINATIONS = keys.reduce((n, k) => n * DIMENSIONS[k].length, 1);

export function scenarioAt(index) {
  if (!Number.isInteger(index) || index < 0 || index >= TOTAL_COMBINATIONS) throw new RangeError('Scenario index is outside the available combinations.');
  let cursor = index;
  const selection = {};
  for (const key of keys) { selection[key] = cursor % DIMENSIONS[key].length; cursor = Math.floor(cursor / DIMENSIONS[key].length); }
  return buildScenario(selection, index);
}

export function buildScenario(selection, index = null) {
  for (const key of keys) if (!Number.isInteger(selection[key]) || !DIMENSIONS[key][selection[key]]) throw new RangeError('Choose a valid ' + key);
  const tactic = DIMENSIONS.tactics[selection.tactics];
  const lines = [
    `Caller: Hello. I am your ${DIMENSIONS.identities[selection.identities].toLowerCase()}. I am calling about ${DIMENSIONS.pretexts[selection.pretexts]}.`,
    ...(selection.knowledge ? ['Caller: I know your balance and your last transaction, so trust me.'] : []),
    'Customer: What do you need me to do?',
    'Caller: ' + tactic.text,
    ...(selection.pressure ? ['Caller: ' + pressureLines[selection.pressure]] : [])
  ];
  return { id: index === null ? 'custom-combination' : `matrix-${index + 1}`, name: tactic.name, category: 'Generated scenario', label: 'Synthetic combination', description: 'A generated variation for testing, not a real call or evidence of real-world accuracy.', phone: phones[selection.numbers], lines, expectedRule: tactic.id, selection };
}
