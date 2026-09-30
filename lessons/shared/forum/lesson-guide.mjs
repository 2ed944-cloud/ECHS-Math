import {INVESTIGATIONS, WORKSHOP, lessonURL} from './investigations.mjs?v=20260930-forum1';

/* Optional adapter for existing lesson engines. Drafts live in this tab only.
 * No auth override, AI request, completion, grade, storage or mastery mutation.
 */
const root = new URL('../../../', import.meta.url);
const relevant = INVESTIGATIONS.filter(e => location.pathname.endsWith('/' + e.path));
const forum = new URLSearchParams(location.search).get('forum') === '1';
const records = new Map();
const mounts = new Map();
const lifetime = new AbortController();
const phases = ['Predict', 'Explore', 'Explain', 'Transfer'];
let disposed = false;

function el(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function on(node, event, action) { node.addEventListener(event, action, {signal: lifetime.signal}); }
function button(text, action, className) {
  const node = el('button', text, className); node.type = 'button'; on(node, 'click', action); return node;
}
function recordFor(entry) {
  if (!records.has(entry.id)) records.set(entry.id, {active: forum, phase: 0, prediction: '', explanation: '', transfer: '', oral: {}, comparison: false, checkpoint: 0});
  return records.get(entry.id);
}
function routeMenu() {
  const actions = document.querySelector('.header-actions, .head-actions');
  if (!actions || document.querySelector('.ew-route')) return;
  const menu = el('details', undefined, 'ew-route');
  const summary = el('summary', 'Workshop route');
  const content = el('nav', undefined, 'ew-route-menu'); content.setAttribute('aria-label', 'PUE forum investigations');
  content.append(el('p', WORKSHOP.title, 'ew-route-title'), el('p', 'Predict → Explore → Explain → Transfer. Work in pairs and swap roles.', 'ew-small'));
  INVESTIGATIONS.forEach((entry, i) => {
    const link = el('a', `${i + 1}. ${entry.label} · ${entry.minutes} min`);
    link.href = lessonURL(entry, root).href; content.append(link);
  });
  const outcomes = el('details'); outcomes.append(el('summary', 'Approved learning outcomes'));
  const list = el('ul'); WORKSHOP.outcomes.forEach(text => list.append(el('li', text))); outcomes.append(list); content.append(outcomes);
  content.append(el('p', 'Use your school account. Course assignments and lesson access still apply.', 'ew-small'));
  menu.append(summary, content); actions.append(menu);
  on(document, 'keydown', event => { if (event.key === 'Escape' && menu.open) { menu.open = false; summary.focus(); } });
}

function mount(entry, host, volume) {
  const record = recordFor(entry);
  const panel = el('section', undefined, 'ew-panel'); panel.dataset.guidedEntry = entry.id;
  panel.setAttribute('aria-label', 'Guided investigation: ' + entry.label);
  let status, content;
  function applyVisibility() {
    const owner = volume ? document.querySelector('#lessonStage') : host.closest('.slide');
    if (!owner) return;
    owner.classList.toggle('ew-guided-active', record.active);
    if (volume) owner.classList.add('ew-volume');
    if (record.active) owner.dataset.guidedPhase = phases[record.phase].toLowerCase();
    else delete owner.dataset.guidedPhase;
    // Hidden SVG/model containers pause their own timers and retain controls.
    const play = host.querySelector('#context-car-play');
    if (record.active && (record.phase === 0 || record.phase === 3) && play?.textContent === 'Pause') play.click();
  }
  function notify(text) { status.textContent = text; }
  function oral(key) {
    return button(record.oral[key] ? 'Discussion recorded for this activity' : 'I shared my reasoning aloud', () => {
      record.oral[key] = true; render(); notify('Oral discussion acknowledged. This is not a grade or mastery record.');
    }, 'ew-secondary');
  }
  function field(key, label) {
    const id = `ew-${entry.id}-${key}`;
    const wrap = el('div', undefined, 'ew-field'); const name = el('label', label); name.htmlFor = id;
    const input = el('textarea'); input.id = id; input.value = record[key]; input.maxLength = 4000; input.rows = 2;
    input.placeholder = key === 'prediction' ? 'Sketch on paper, then record a reason here or discuss it aloud.' : 'Include the setup, evidence, and units where needed.';
    on(input, 'input', () => {
      record[key] = input.value;
      if (key === 'transfer') { record.comparison = false; const comparison = panel.querySelector('.ew-comparison'); if (comparison) comparison.hidden = true; const reveal = panel.querySelector('[data-compare]'); if (reveal) reveal.setAttribute('aria-expanded', 'false'); }
    });
    wrap.append(name, input); content.append(wrap, oral(key));
  }
  function changePhase(index) {
    if (index > 0 && !record.prediction.trim() && !record.oral.prediction) { notify('Make a prediction or share it aloud before opening the model.'); return; }
    if (index === 3 && !record.explanation.trim() && !record.oral.explanation) { notify('Explain the model or discuss your explanation before the independent task.'); return; }
    record.phase = index; render(); panel.querySelector('.ew-phase-title')?.focus({preventScroll: true});
  }
  function render() {
    panel.replaceChildren();
    const head = el('div', undefined, 'ew-head');
    head.append(el('strong', record.active ? 'Mathematical investigation' : 'Build intuition, then check transfer'));
    head.append(button(record.active ? 'Full lesson' : 'Start guided investigation', () => {record.active = !record.active; render();}, 'ew-secondary'));
    panel.append(head);
    if (!record.active) {
      panel.append(el('p', 'Predict · Explore · Explain · Transfer. Use this sequence before opening worked reasoning.', 'ew-small'));
      applyVisibility(); return;
    }
    const steps = el('div', undefined, 'ew-steps'); steps.setAttribute('aria-label', 'Investigation steps');
    phases.forEach((name, i) => {
      const step = button(`${i + 1} ${name}`, () => changePhase(i));
      if (i === record.phase) step.setAttribute('aria-current', 'step');
      steps.append(step);
    }); panel.append(steps);
    content = el('div', undefined, 'ew-content'); panel.append(content);
    const title = el('h3', phases[record.phase], 'ew-phase-title'); title.tabIndex = -1; content.append(title);
    status = el('p', '', 'ew-feedback'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
    if (record.phase === 0) {
      content.append(el('p', entry.predict, 'ew-prompt')); field('prediction', 'My prediction and reason');
      content.append(button('Explore the model', () => changePhase(1), 'ew-primary'));
    } else if (record.phase === 1) {
      const prompt = el('p', undefined, 'ew-prompt');
      prompt.append(el('strong', `Test ${record.checkpoint + 1} of ${entry.explore.length}. `), document.createTextNode(entry.explore[record.checkpoint])); content.append(prompt);
      const actions = el('div', undefined, 'ew-actions');
      if (record.checkpoint > 0) actions.append(button('Previous change', () => {record.checkpoint--; render();}, 'ew-secondary'));
      if (record.checkpoint < entry.explore.length - 1) actions.append(button('Next change', () => {record.checkpoint++; render();}, 'ew-secondary'));
      actions.append(button('Explain what changed', () => changePhase(2), 'ew-primary')); content.append(actions);
    } else if (record.phase === 2) {
      const list = el('ul', undefined, 'ew-reasoning'); entry.explain.forEach(text => list.append(el('li', text))); content.append(list);
      field('explanation', 'Explain what changed, and what stayed the same');
      content.append(button('Try independent transfer', () => changePhase(3), 'ew-primary'));
    } else {
      content.append(el('p', entry.transfer, 'ew-prompt'), el('p', 'The model is hidden. Use a fresh sketch and your own reasoning.', 'ew-small')); field('transfer', 'Independent setup and explanation');
      const comparison = el('div', undefined, 'ew-comparison'); comparison.id = `ew-${entry.id}-comparison`; comparison.hidden = !record.comparison;
      comparison.append(el('h4', 'Compare your reasoning')); entry.comparison.forEach(text => comparison.append(el('p', text)));
      const compare = button('Compare with worked reasoning', () => {
        if (!record.transfer.trim() && !record.oral.transfer) {notify('Attempt the transfer task or explain it aloud before opening the comparison.'); return;}
        record.comparison = !record.comparison; comparison.hidden = !record.comparison; compare.setAttribute('aria-expanded', String(record.comparison));
      }, 'ew-secondary'); compare.dataset.compare = ''; compare.setAttribute('aria-controls', comparison.id); compare.setAttribute('aria-expanded', String(record.comparison));
      content.append(compare, comparison);
      const next = INVESTIGATIONS[INVESTIGATIONS.indexOf(entry) + 1];
      if (next) {const link = el('a', 'Next investigation: ' + next.label, 'ew-next'); link.href = lessonURL(next, root).href; content.append(link);}
      content.append(el('p', WORKSHOP.evidencePolicy, 'ew-small'));
    }
    content.append(status);
    const guidance = el('details', undefined, 'ew-teaching'); guidance.append(el('summary', 'Teaching prompts and next evidence'));
    guidance.append(el('p', 'Likely misconception: ' + entry.misconception), el('p', 'Support: ' + entry.support), el('p', 'Challenge: ' + entry.challenge), el('p', 'After an attempt, a guiding AI hint can ask for the missing geometric or functional relationship. Use a fresh task to check independent understanding.'));
    guidance.append(el('p', `College Board topics ${entry.cedTopics.join(', ')} · Calculator: ${entry.calculatorPolicy}. Original ECHS formative task.`, 'ew-small'));
    panel.append(guidance); applyVisibility();
  }
  if (volume) host.prepend(panel);
  else { const objective = host.querySelector('.objective'); if (objective) objective.after(panel); else host.prepend(panel); }
  render();
  return panel;
}
function refresh() {
  if (disposed) return;
  routeMenu();
  if (document.documentElement.dataset.volumeLesson) {
    const host = document.querySelector('#stage-body'); const entry = relevant.find(e => e.anchor === host?.dataset.investigation);
    if (entry && !host.querySelector('[data-guided-entry]')) mount(entry, host, true);
    if (!entry) {const owner = document.querySelector('#lessonStage'); owner?.classList.remove('ew-guided-active'); if (owner) delete owner.dataset.guidedPhase;}
  } else {
    relevant.forEach(entry => {
      const host = document.getElementById(entry.anchor)?.querySelector('.slide-inner');
      if (host && !mounts.has(entry.id)) mounts.set(entry.id, mount(entry, host, false));
    });
  }
}
if (relevant.length) {
  const sheet = el('link'); sheet.rel = 'stylesheet'; sheet.href = new URL('./lesson-guide.css?v=20260930-forum1', import.meta.url).href; document.head.append(sheet);
  if (forum) document.body.classList.add('ew-forum');
  const observer = new MutationObserver(refresh);
  observer.observe(document.body, {childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'data-investigation']});
  on(window, 'pagehide', event => {if (event.persisted) return; disposed = true; observer.disconnect(); lifetime.abort(); records.clear(); mounts.clear();});
  refresh();
}
