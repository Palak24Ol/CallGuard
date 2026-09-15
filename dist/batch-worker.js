import { analyze, DEMO_NUMBERS } from './engine.js';
import { scenarioAt, TOTAL_COMBINATIONS } from './scenario-lab.js';

self.onmessage = async () => {
  const started = performance.now();
  let passed = 0;
  const misses = [];
  const byRule = {};
  for (let i = 0; i < TOTAL_COMBINATIONS; i++) {
    const c = scenarioAt(i);
    const r = analyze({ transcript: c.lines.join('\n'), phone: c.phone, entries: DEMO_NUMBERS });
    const found = r.findings.some(f => f.id === c.expectedRule);
    if (found) passed++;
    else if (misses.length < 50) misses.push({ case: i + 1, rule: c.expectedRule });
    byRule[c.expectedRule] ||= { total: 0, passed: 0 };
    byRule[c.expectedRule].total++;
    if (found) byRule[c.expectedRule].passed++;
    if ((i + 1) % 500 === 0) {
      self.postMessage({ type: 'progress', completed: i + 1, total: TOTAL_COMBINATIONS, passed });
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  self.postMessage({ type: 'complete', completed: TOTAL_COMBINATIONS, total: TOTAL_COMBINATIONS, passed, misses, byRule, seconds: Math.round((performance.now() - started) / 1000), note: 'Synthetic template coverage only. These examples are constructed from the rule catalog and do not establish real-world precision or recall.' });
};
