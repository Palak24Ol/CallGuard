import { analyze, DEMO_NUMBERS, ENGINE_VERSION } from '../dist/engine.js';
import { scenarioAt, TOTAL_COMBINATIONS } from '../dist/scenario-lab.js';
import { writeFile } from 'node:fs/promises';

const started = performance.now();
const byRule = {}, misses = [];
let passed = 0;
for (let i = 0; i < TOTAL_COMBINATIONS; i++) {
  const c = scenarioAt(i);
  const r = analyze({ transcript: c.lines.join('\n'), phone: c.phone, entries: DEMO_NUMBERS });
  const found = r.findings.some(f => f.id === c.expectedRule);
  byRule[c.expectedRule] ||= { total: 0, matched: 0 };
  byRule[c.expectedRule].total++;
  if (found) { passed++; byRule[c.expectedRule].matched++; }
  else if (misses.length < 100) misses.push({ case: i + 1, expected: c.expectedRule, findings: r.findings.map(f => f.id) });
}
const output = { engineVersion: ENGINE_VERSION, runAt: new Date().toISOString(), total: TOTAL_COMBINATIONS, matched: passed, missed: TOTAL_COMBINATIONS - passed, seconds: Math.round((performance.now() - started) / 1000), byRule, firstMisses: misses, interpretation: 'Synthetic combinations of rule-derived examples. This measures template coverage, not independent real-world accuracy, precision, or recall.' };
if (process.argv.includes('--write')) await writeFile(new URL('../docs/coverage-results.json', import.meta.url), JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify(output, null, 2));
if (passed !== TOTAL_COMBINATIONS) process.exitCode = 1;
