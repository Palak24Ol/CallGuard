import { analyze, RULES, DEMO_NUMBERS, normalizePhone, lookupNumber, exportReport, MAX_TRANSCRIPT } from './engine.js';
import { SCENARIOS, SOURCES } from './catalog.js';
import { DIMENSIONS, TOTAL_COMBINATIONS, buildScenario, scenarioAt } from './scenario-lab.js';

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const labels = { high: 'High risk', medium: 'Caution', context: 'Context' };
const STORAGE_KEY = 'callguard-local-reports-v1';
let reports = [], includeDemo = true, result, timer = null, playbackIndex = 0, activeScenario = null, recognition = null, listening = false, worker = null, lastBatch = null, debounce, toastTimer;

function toast(text) { $('toast').textContent = text; $('toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').hidden = true, 5000); }
function error(text) { $('input-error').textContent = text; $('input-error').hidden = !text; }
function readStorage() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (Array.isArray(raw)) reports = raw.slice(0, 500).filter(r => r && normalizePhone(r.number) && r.source === 'local' && typeof r.label === 'string' && r.label.length <= 100 && typeof r.reason === 'string' && r.reason.length <= 200 && /^\d{4}-\d{2}-\d{2}$/.test(r.expiresAt) && /^\d{4}-\d{2}-\d{2}$/.test(r.updatedAt));
    includeDemo = localStorage.getItem('callguard-include-demo') !== 'false';
  } catch { reports = []; toast('Browser storage is unavailable. You can still analyze calls.'); }
}
function entries() { return [...(includeDemo ? DEMO_NUMBERS : []), ...reports]; }
function saveReports(next) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); reports = next; return true; }
  catch { toast('Could not save to this browser. No report was added or removed.'); return false; }
}
function reputationMessage(state) {
  return {
    missing: 'A number check cannot establish caller identity.',
    invalid: 'Use + and a country code, or a valid 10-digit Indian mobile. Do not include an extension.',
    unknown: 'No match in this device’s data. Unlisted does not mean safe.',
    reported: 'Saved on this browser only. Unverified report; caller ID may be spoofed.',
    'demo-flagged': 'Fictional flagged-number match for demonstration only.',
    stale: 'This local report has expired. Verify independently; old reports can be wrong.'
  }[state];
}
function assess() {
  clearTimeout(debounce);
  try {
    result = analyze({ transcript: $('transcript').value, phone: $('caller-number').value, entries: entries() });
    error(''); renderResult();
  } catch (e) { error(e.message); }
}
function renderResult() {
  $('char-count').textContent = `${$('transcript').value.length.toLocaleString()} / 40,000`;
  const rep = result.reputation;
  $('reputation-title').textContent = rep.title;
  $('reputation-detail').textContent = reputationMessage(rep.state);
  $('reputation-strip').classList.toggle('flagged', ['demo-flagged', 'reported'].includes(rep.state));
  $('assessment').dataset.level = result.level;
  $('assessment-heading').textContent = result.label;
  $('risk-icon').textContent = { high: '!', caution: '!', review: 'i', unverified: '?' }[result.level];
  $('next-step').textContent = result.nextStep;
  $('finding-count').textContent = `${result.findings.length} indicator${result.findings.length === 1 ? '' : 's'}`;
  $('risk-caption').textContent = result.level === 'high' ? 'Stop and verify the request' : 'Unverified ≠ safe';
  $('combination-note').hidden = !result.combination;
  $('combination-note').textContent = result.combination || '';
  $('assessment-announcement').textContent = `${result.label}. ${result.findings.length} indicators. ${result.nextStep}`;
  $('findings').innerHTML = result.findings.length ? result.findings.map(f => `<article class="finding"><div class="finding-head"><h3>${esc(f.title)}</h3><span class="pill ${esc(f.severity)}">${labels[f.severity]}</span></div><blockquote>“${esc(f.evidence)}”</blockquote><p>${esc(f.description)}</p><details><summary>Recommended action${f.line ? ` · transcript line ${f.line}` : ''}</summary><p class="advice">${esc(f.advice)}</p></details></article>`).join('') : `<div class="empty-state"><strong>${result.callerClauses ? 'No configured rule matched this text.' : 'Add caller speech to begin.'}</strong>${esc(result.coverage)}<p>A new scam, a transcription error, or an indirect request can escape these rules. This is not a safety certificate.</p></div>`;
}
function stopSimulation(announce = false) {
  if (timer) clearInterval(timer);
  timer = null;
  $('play-scenario').textContent = '▶ Play call';
  if (announce) $('simulation-status').textContent = 'Simulation stopped. Transcript retained for review.';
}
function stopMic() {
  listening = false;
  if (recognition) { const r = recognition; recognition = null; r.onend = null; r.stop(); }
  $('mic-start').disabled = false; $('mic-stop').disabled = true;
  $('mic-status').textContent = 'Microphone is off.'; $('interim-text').textContent = '';
}
function selectedScenario() { return SCENARIOS.find(s => s.id === $('scenario-select').value) || SCENARIOS[0]; }
function describeScenario() { const s = selectedScenario(); $('scenario-description').textContent = s.description; $('scenario-label').textContent = s.label; }
function loadScenario(s, full = true) {
  stopSimulation(); stopMic(); activeScenario = s;
  $('caller-number').value = s.phone;
  $('transcript').value = full ? s.lines.join('\n') : '';
  $('mode-badge').textContent = s.id.startsWith('matrix-') || s.id === 'custom-combination' ? 'Generated transcript' : 'Sample transcript';
  $('simulation-status').textContent = full ? `Loaded: ${s.name}. No real call was placed.` : 'Simulation starting…';
  assess();
}
function playScenario(s = selectedScenario()) {
  if (timer) { stopSimulation(true); return; }
  loadScenario(s, false); playbackIndex = 0;
  $('play-scenario').textContent = '■ Stop demo';
  const step = () => {
    $('transcript').value += ($('transcript').value ? '\n' : '') + s.lines[playbackIndex++];
    $('transcript').scrollTop = $('transcript').scrollHeight;
    $('simulation-status').textContent = `Simulating ${s.name} · line ${playbackIndex} of ${s.lines.length}`;
    assess();
    if (playbackIndex >= s.lines.length) { stopSimulation(); $('simulation-status').textContent = 'Simulation complete. Review when the warning first appeared.'; }
  };
  timer = setInterval(step, 1700); step();
}
function showView(view) {
  if (!['analyzer', 'watchlist', 'rules', 'lab', 'about'].includes(view)) view = 'analyzer';
  document.querySelectorAll('.view').forEach(el => el.hidden = el.id !== 'view-' + view);
  document.querySelectorAll('[data-view]').forEach(el => { el.classList.toggle('active', el.dataset.view === view); if (el.dataset.view === view) el.setAttribute('aria-current', 'page'); else el.removeAttribute('aria-current'); });
  $('page-name').textContent = { analyzer: 'Call analyzer', watchlist: 'Number watchlist', rules: 'Detection rules', lab: 'Scenario lab', about: 'Project guide' }[view];
  if (view !== 'analyzer') { stopSimulation(); if (listening) stopMic(); }
  if (view === 'watchlist') renderWatchlist();
}
function renderWatchlist() {
  $('include-demo').checked = includeDemo;
  $('watch-count').textContent = `${entries().length} records on this device`;
  $('watch-table').innerHTML = entries().map(r => `<tr><td>${esc(r.number)}<small>${esc(r.label)}</small></td><td><span class="pill ${r.source === 'demo' ? 'neutral' : 'medium'}">${r.source === 'demo' ? 'Fictional sample' : 'Local · unverified'}</span></td><td>${esc(r.reason)}</td><td>${r.source === 'demo' ? 'Demo only' : esc(r.expiresAt)}${r.source !== 'demo' && new Date(r.expiresAt + 'T23:59:59Z') < new Date() ? '<small>Expired</small>' : ''}</td><td>${r.source === 'local' ? `<button class="text-button danger-button" data-remove="${esc(r.number)}" aria-label="Remove local report for ${esc(r.number)}">Remove</button>` : ''}</td></tr>`).join('') || '<tr><td colspan="5">No local records. Add a report or enable the fictional samples.</td></tr>';
}
function renderRules() {
  const q = $('rule-search').value.trim().toLowerCase(); const severity = $('rule-filter').value;
  const matches = RULES.filter(r => (severity === 'all' || r.severity === severity) && `${r.title} ${r.category} ${r.description} ${r.examples.join(' ')}`.toLowerCase().includes(q));
  $('rule-cards').innerHTML = matches.map(r => `<article class="rule-card"><div class="finding-head"><div><div class="category">${esc(r.category)}</div><h3>${esc(r.title)}</h3></div><span class="pill ${r.severity}">${labels[r.severity]}</span></div><p>${esc(r.description)}</p><div class="rule-example">“${esc(r.examples[0])}”</div></article>`).join('') || '<p class="muted">No matching rules. Try another search or signal type.</p>';
}
function download(data, filename) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function initLab() {
  const nav = document.createElement('button'); nav.className = 'nav-button'; nav.dataset.view = 'lab'; nav.innerHTML = '<span aria-hidden="true">▧</span> Scenario lab';
  document.querySelector('.sidebar nav').insertBefore(nav, document.querySelector('[data-view="about"]'));
  const section = document.createElement('section'); section.id = 'view-lab'; section.className = 'view'; section.hidden = true;
  section.innerHTML = `<div class="page-heading"><div><div class="eyebrow">COMBINATIONS, NOT JUST EXAMPLES</div><h1>${TOTAL_COMBINATIONS.toLocaleString()} ways to test the rules.</h1><p>Vary who calls, their excuse, their request, and how they pressure the customer.</p></div></div><div class="scope-note"><span class="note-icon">i</span><span><strong>Synthetic coverage, not universal coverage.</strong> These variations reuse known request patterns. Passing them does not prove detection of unseen wording or every real scam.</span></div><div class="lab-grid"><section class="card"><h2>Build a call scenario</h2><div id="lab-fields" class="lab-fields"></div><div class="toolbar"><button id="lab-load" class="button primary">Open in analyzer →</button><button id="lab-random" class="button secondary">Shuffle combination</button></div><p class="field-help">All numbers and conversations in this lab are fictional. No calls are placed.</p></section><section class="card"><div class="card-heading"><h2>Generated conversation</h2><span class="pill neutral">Synthetic</span></div><pre id="lab-preview" class="lab-preview"></pre><p id="lab-expected" class="field-help"></p></section></div><section class="card batch-card"><div class="card-heading"><h2>Test every generated combination</h2><span class="pill neutral">${TOTAL_COMBINATIONS.toLocaleString()} cases</span></div><p>Checks that the intended rule is found even when the caller’s identity, excuse, and number change. Runs in the background of this tab. It does not test every possible wording.</p><div class="toolbar"><button id="batch-start" class="button primary">Run full coverage check</button><button id="batch-cancel" class="button secondary" disabled>Cancel</button><button id="batch-export" class="text-button" disabled>Export results ↓</button></div><progress id="batch-progress" max="${TOTAL_COMBINATIONS}" value="0" aria-label="Scenario coverage progress"></progress><p id="batch-status" role="status">Ready. No test has been run in this tab.</p><div id="batch-misses"></div></section>`;
  $('main').insertBefore(section, $('view-about'));
  const titles = { identities: 'Caller identity claim', pretexts: 'Reason for calling', tactics: 'Suspicious request or tactic', pressure: 'Additional pressure', numbers: 'Number status', knowledge: 'Personal details' };
  $('lab-fields').innerHTML = Object.entries(DIMENSIONS).map(([key, values]) => `<div><label for="lab-${key}">${titles[key]}</label><select id="lab-${key}">${values.map((v, i) => `<option value="${i}">${esc(v.name || v)}</option>`).join('')}</select></div>`).join('');
  const getCase = () => buildScenario(Object.fromEntries(Object.keys(DIMENSIONS).map(k => [k, Number($('lab-' + k).value)])));
  const update = () => { const c = getCase(); $('lab-preview').textContent = c.lines.join('\n\n'); $('lab-expected').textContent = `Expected rule: ${c.expectedRule}. Number flags are checked separately.`; };
  $('lab-fields').addEventListener('change', update);
  $('lab-load').onclick = () => { loadScenario(getCase()); location.hash = 'analyzer'; showView('analyzer'); window.scrollTo({ top: 0 }); };
  $('lab-random').onclick = () => { const bytes = new Uint32Array(1); crypto.getRandomValues(bytes); const c = scenarioAt(bytes[0] % TOTAL_COMBINATIONS); for (const [k, v] of Object.entries(c.selection)) $('lab-' + k).value = v; update(); };
  $('batch-start').onclick = () => {
    if (worker) return;
    try { worker = new Worker('./batch-worker.js', { type: 'module' }); }
    catch { $('batch-status').textContent = 'Background workers are unavailable in this browser. Run the included test script locally instead.'; return; }
    lastBatch = null; $('batch-export').disabled = true; $('batch-start').disabled = true; $('batch-cancel').disabled = false; $('batch-progress').value = 0; $('batch-misses').textContent = ''; $('batch-status').textContent = 'Testing combinations…';
    worker.onmessage = ({ data }) => {
      $('batch-progress').value = data.completed;
      $('batch-status').textContent = `${data.completed.toLocaleString()} / ${data.total.toLocaleString()} tested · ${data.passed.toLocaleString()} expected-rule matches · ${(data.completed - data.passed).toLocaleString()} misses`;
      if (data.type === 'complete') { lastBatch = data; $('batch-status').textContent += ` · completed in ${data.seconds}s. Synthetic coverage only.`; $('batch-export').disabled = false; $('batch-misses').textContent = data.misses.length ? 'First misses: ' + data.misses.map(m => `case ${m.case} (${m.rule})`).join(', ') : 'No misses in the configured combination set. New phrasing and real calls still need separate evaluation.'; finishWorker(); }
    };
    worker.onerror = () => { $('batch-status').textContent = 'The coverage check failed to complete. No success result is available.'; finishWorker(); };
    worker.postMessage({ start: true });
  };
  $('batch-cancel').onclick = () => { finishWorker(); $('batch-status').textContent += ' · cancelled, incomplete.'; };
  $('batch-export').onclick = () => { if (lastBatch) download(lastBatch, 'callguard-synthetic-coverage.json'); };
  update();
}
function finishWorker() { if (worker) worker.terminate(); worker = null; $('batch-start').disabled = false; $('batch-cancel').disabled = true; }

readStorage(); initLab();
$('scenario-select').innerHTML = SCENARIOS.map(s => `<option value="${s.id}">${esc(s.name)} · ${esc(s.category)}</option>`).join('');
$('scenario-count').textContent = `${SCENARIOS.length} curated + ${TOTAL_COMBINATIONS.toLocaleString()} generated`;
$('rule-total').textContent = RULES.length;
$('source-list').innerHTML = SOURCES.map(s => `<div><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.name)} ↗</a><small>${esc(s.note)}</small></div>`).join('');
document.querySelector('.sidebar nav').addEventListener('click', e => { const b = e.target.closest('[data-view]'); if (b) { location.hash = b.dataset.view; showView(b.dataset.view); } });
window.addEventListener('hashchange', () => showView(location.hash.slice(1)));
$('analyze').onclick = assess;
$('transcript').addEventListener('input', () => { stopSimulation(); $('mode-badge').textContent = 'Your transcript'; $('char-count').textContent = `${$('transcript').value.length.toLocaleString()} / 40,000`; clearTimeout(debounce); debounce = setTimeout(assess, 200); });
$('caller-number').addEventListener('input', assess);
$('reset').onclick = () => { stopSimulation(); stopMic(); activeScenario = null; $('transcript').value = ''; $('caller-number').value = ''; $('mode-badge').textContent = 'Your transcript'; $('simulation-status').textContent = 'Ready to simulate. No call will be placed.'; assess(); $('transcript').focus(); };
$('scenario-select').onchange = () => { stopSimulation(); describeScenario(); };
$('load-scenario').onclick = () => loadScenario(selectedScenario());
$('play-scenario').onclick = () => playScenario();
$('export-report').onclick = () => { assess(); if (!$('transcript').value.trim() && !$('caller-number').value.trim()) { toast('Add a transcript or number before exporting.'); return; } download(exportReport(result), 'callguard-assessment.json'); toast('Report downloaded. Review the redacted evidence before sharing.'); };
$('import-file').onchange = async e => {
  const file = e.target.files[0]; if (!file) return;
  try { if (!file.name.toLowerCase().endsWith('.txt')) throw new Error('Choose a plain text (.txt) transcript.'); if (file.size > 160000) throw new Error('File is too large. Use a transcript of at most 40,000 characters.'); const text = await file.text(); if (text.length > MAX_TRANSCRIPT) throw new Error('Transcript exceeds 40,000 characters. Split it into smaller parts.'); if (text.includes('\u0000')) throw new Error('This file does not look like a plain text transcript.'); stopSimulation(); stopMic(); $('transcript').value = text; $('mode-badge').textContent = 'Imported transcript'; assess(); toast('Transcript imported into this tab.'); }
  catch (err) { error(err.message); } finally { e.target.value = ''; }
};
$('mic-open').onclick = () => { $('mic-panel').hidden = !$('mic-panel').hidden; if ($('mic-panel').hidden && listening) stopMic(); };
$('mic-stop').onclick = stopMic;
$('mic-start').onclick = () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) { $('mic-status').textContent = 'Speech recognition is not supported here. Use a supported Chrome/Edge browser or paste a transcript.'; return; }
  if (!window.isSecureContext) { $('mic-status').textContent = 'Microphone mode requires HTTPS or localhost.'; return; }
  stopSimulation(); stopMic(); const r = new SpeechRecognition(); recognition = r;
  r.lang = $('speech-language').value; r.continuous = true; r.interimResults = true;
  r.onstart = () => { listening = true; $('mic-start').disabled = true; $('mic-stop').disabled = false; $('mode-badge').textContent = 'Microphone · single speaker'; $('mic-status').textContent = 'Listening. Nearby speech is treated as caller speech. Stop before changing speakers.'; };
  r.onresult = event => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const text = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        const next = $('transcript').value + ($('transcript').value ? '\n' : '') + 'Caller: ' + text;
        if (next.length > MAX_TRANSCRIPT) { stopMic(); error('Transcript limit reached. Microphone stopped.'); return; }
        $('transcript').value = next; assess();
      } else interim += text;
    }
    $('interim-text').textContent = interim ? 'Recognising: ' + interim : '';
  };
  r.onerror = e => { listening = false; $('mic-status').textContent = `Speech service stopped (${e.error}). Check browser microphone access or use text input.`; $('mic-start').disabled = false; $('mic-stop').disabled = true; };
  r.onend = () => { listening = false; recognition = null; $('mic-start').disabled = false; $('mic-stop').disabled = true; if ($('mic-status').textContent.startsWith('Listening')) $('mic-status').textContent = 'Speech service ended. Select start to listen again.'; $('interim-text').textContent = ''; };
  try { r.start(); } catch { recognition = null; $('mic-status').textContent = 'Could not start recognition. Check browser permissions and try again.'; }
};
document.addEventListener('visibilitychange', () => { if (document.hidden && listening) stopMic(); });
window.addEventListener('pagehide', () => { stopSimulation(); if (listening) stopMic(); if (worker) worker.terminate(); });
$('lookup-form').onsubmit = e => { e.preventDefault(); const r = lookupNumber($('lookup-phone').value, entries()); $('lookup-result').innerHTML = `<strong>${esc(r.title)}</strong><p>${esc(reputationMessage(r.state))}</p>${r.entries.map(x => `<p>${esc(x.label)} — ${esc(x.reason)}</p>`).join('')}`; };
$('include-demo').onchange = e => { includeDemo = e.target.checked; try { localStorage.setItem('callguard-include-demo', String(includeDemo)); } catch { toast('This preference cannot be saved in this browser.'); } renderWatchlist(); assess(); $('lookup-result').textContent = 'Data selection changed. Check the number again.'; };
$('report-form').onsubmit = e => {
  e.preventDefault(); const number = normalizePhone($('report-phone').value);
  $('report-error').hidden = true;
  if (!number) { $('report-error').textContent = 'Enter a valid international number or 10-digit Indian mobile.'; $('report-error').hidden = false; return; }
  if (reports.length >= 500 && !reports.some(r => r.number === number)) { $('report-error').textContent = 'Local limit of 500 reports reached. Remove an old report first.'; $('report-error').hidden = false; return; }
  const now = new Date(), expires = new Date(now); expires.setDate(expires.getDate() + 90);
  const item = { number, label: $('report-reason').value, reason: $('report-note').value.trim() || $('report-reason').value, source: 'local', status: 'reported', updatedAt: now.toISOString().slice(0, 10), expiresAt: expires.toISOString().slice(0, 10) };
  if (saveReports([...reports.filter(r => r.number !== number), item])) { $('report-form').reset(); renderWatchlist(); assess(); toast('Saved locally as unverified. No external report was submitted.'); }
};
$('watch-table').onclick = e => { const b = e.target.closest('[data-remove]'); if (b && saveReports(reports.filter(r => r.number !== b.dataset.remove))) { renderWatchlist(); assess(); toast('Local report removed.'); } };
$('rule-search').oninput = renderRules; $('rule-filter').onchange = renderRules;
describeScenario(); renderRules(); renderWatchlist(); loadScenario(SCENARIOS[0]); showView(location.hash.slice(1));
