import {finance, firstThreshold} from './ib-models.mjs';
import {graph, table, format} from './visuals.mjs';

let nextId = 0;
const money = value => new Intl.NumberFormat('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(value);
const numeric = text => /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(text) && Number.isFinite(Number(text));

// This view has no persistence or grading connection. Predictions compare public
// model quantities only; the surrounding lesson retains access and navigation.
export function mountFinance({root, window: win, scene}) {
  const doc = root.ownerDocument;
  if (!doc || !win || scene?.model !== 'finance') throw new TypeError('invalid_finance_view');
  const initial = {...scene.initial};
  finance(initial);
  const params = {...initial}, id = `ei-finance-${++nextId}`, removers = [], controls = [];
  let disposed = false, state = null, task = null;
  let showSimple = (initial.kind ?? 'compound') === 'compound', showReal = (initial.inflationPercent ?? 0) !== 0;
  const el = (tag, text, cls) => { const node = doc.createElement(tag); if (text !== undefined) node.textContent = text; if (cls) node.className = cls; return node; };
  const on = (node, event, fn) => { node.addEventListener(event, fn); removers.push(() => node.removeEventListener(event, fn)); };
  const outer = el('div', undefined, 'ei-grid'), left = el('section', undefined, 'ei-card'), right = el('section', undefined, 'ei-card');
  left.append(el('h3', 'Linked financial representations', 'ei-section-title'));
  right.append(el('h3', 'Change the model', 'ei-section-title'));
  const output = el('div'), controlsBox = el('div', undefined, 'ei-controls'), error = el('p', undefined, 'ei-feedback');
  error.setAttribute('role', 'status');
  const prediction = el('div', undefined, 'ei-prediction'), predictionLabel = el('label', undefined, 'ei-field-label');
  const predictionInput = el('input'), check = el('button', 'Test my prediction', 'ei-primary'), feedback = el('p', undefined, 'ei-feedback');
  predictionInput.type = 'text'; predictionInput.inputMode = 'decimal'; predictionInput.maxLength = 60; predictionInput.autocomplete = 'off';
  predictionInput.id = `${id}-prediction`; predictionLabel.htmlFor = predictionInput.id; check.type = 'button'; feedback.setAttribute('role', 'status');
  feedback.id = `${id}-feedback`; predictionInput.setAttribute('aria-describedby', feedback.id);
  prediction.append(predictionLabel, predictionInput, check, feedback);
  const reset = el('button', 'Reset model and prediction'); reset.type = 'button';
  left.append(output); right.append(controlsBox, error, prediction, reset); outer.append(left, right); root.append(outer);

  function clearFeedback(clearInput = false) {
    feedback.textContent = ''; delete feedback.dataset.result;
    if (clearInput) predictionInput.value = '';
  }
  function checkbox(labelText, name, checked, changed) {
    const wrap = el('div', undefined, 'ei-control'), label = el('label', labelText), input = el('input');
    input.type = 'checkbox'; input.id = `${id}-${name}`; input.checked = checked; label.htmlFor = input.id;
    on(input, 'change', () => { if (!disposed) { changed(input.checked); draw(); } });
    wrap.append(label, input); controlsBox.append(wrap); return input;
  }
  for (const spec of scene.controls ?? []) {
    const {key, label, min, max, step = 1} = spec;
    if (!(key in initial) || !['principal', 'annualRatePercent', 'compoundsPerYear', 'years', 'inflationPercent'].includes(key) ||
        ![min, max, step].every(Number.isFinite) || step <= 0 || max < min) throw new TypeError('invalid_finance_control');
    const wrap = el('div', undefined, 'ei-control'), l = el('label', label), input = el('input'), value = el('output');
    input.type = 'range'; input.id = `${id}-${key}`; input.dataset.parameter = key; input.min = String(min); input.max = String(max); input.step = String(step); input.value = String(initial[key]);
    l.htmlFor = input.id; value.setAttribute('for', input.id); value.textContent = format(initial[key], 6);
    on(input, 'input', () => {
      if (disposed) return;
      const raw = input.value.trim(), n = Number(raw), increment = (n - min) / step;
      if (!numeric(raw) || n < min || n > max || Math.abs(increment - Math.round(increment)) > 1e-8) {
        error.textContent = 'Use a value on the displayed control scale.'; task = null; check.disabled = true; clearFeedback(); return;
      }
      try { finance({...params, [key]: n}); }
      catch { error.textContent = 'Use complete credit periods and a valid rate for this model.'; task = null; check.disabled = true; clearFeedback(); return; }
      params[key] = n; value.textContent = format(n, 6); clearFeedback(true); draw();
    });
    controls.push({input, value, key}); wrap.append(l, input, value); controlsBox.append(wrap);
  }
  const simpleToggle = (initial.kind ?? 'compound') === 'compound' ? checkbox('Show simple-interest comparison', 'simple', showSimple, value => { showSimple = value; }) : null;
  const realToggle = checkbox('Show time-0 purchasing power', 'real', showReal, value => { showReal = value; });

  function draw() {
    if (disposed) return;
    error.textContent = ''; check.disabled = false;
    state = finance(params); const s = state;
    const series = [{label: s.kind === 'depreciation' ? 'Remaining value' : 'Nominal balance', points: s.rows.map(r => ({x: r.years, y: r.balance})), connect: false}];
    if (showSimple && s.kind === 'compound') series.push({label: 'Simple interest', points: s.rows.filter(r => r.simpleBalance !== null).map(r => ({x: r.years, y: r.simpleBalance})), connect: false});
    if (showReal) series.push({label: 'Real value', points: s.rows.map(r => ({x: r.years, y: r.realBalance})), connect: false});
    output.replaceChildren(graph(doc, {title: 'Financial values at completed credit periods', xLabel: 'Elapsed time / years', yLabel: 'QAR', series}));
    const formula = s.kind === 'compound'
      ? `FV = ${format(s.principal)} × (1 + ${format(s.annualRatePercent)}/(100 × ${s.compoundsPerYear}))^(${s.compoundsPerYear} × ${format(s.years, 6)})`
      : s.kind === 'simple'
        ? `V = ${format(s.principal)} × (1 + (${format(s.annualRatePercent)}/100) × ${format(s.years, 6)})`
        : `V = ${format(s.principal)} × (1 − ${format(s.annualRatePercent)}/100)^${format(s.years, 6)}`;
    output.append(el('p', `${formula}. The annual rate shown is a percentage.`, 'ei-formula'));
    const changeLabel = s.kind === 'depreciation' ? 'Value lost since purchase' : s.interest < 0 ? 'Interest lost' : 'Interest earned';
    output.append(el('p', `${s.kind === 'depreciation' ? 'Value remaining' : 'Final nominal balance'}: QAR ${money(s.balance)}. ${changeLabel}: QAR ${money(Math.abs(s.interest))}.`, 'ei-formula'));
    output.append(el('p', `N = ${s.periods} completed ${s.compoundsPerYear === 4 ? 'quarters' : s.compoundsPerYear === 12 ? 'months' : 'periods'}; ${s.compoundsPerYear} period(s) per year. ${s.kind === 'compound' ? `The periodic interest rate is ${format(s.annualRatePercent / s.compoundsPerYear, 6)}%.` : ''}`, 'ei-note'));
    if (showReal) output.append(el('p', `Time-0 purchasing power: QAR ${money(s.realBalance)}. Divide the nominal balance by (1 + ${format(s.inflationPercent)}/100)^${format(s.years, 6)}.`, 'ei-note'));
    const headers = ['Completed period', 'Elapsed years', s.kind === 'depreciation' ? 'Value remaining / QAR' : 'Nominal / QAR'];
    if (showSimple && s.kind === 'compound') headers.push('Simple interest / QAR');
    if (showReal) headers.push('Time-0 purchasing power / QAR');
    const rows = s.rows.map(r => {
      const row = [r.period, format(r.years, 6), money(r.balance)];
      if (showSimple && s.kind === 'compound') row.push(r.simpleBalance === null ? 'Outside model domain' : money(r.simpleBalance));
      if (showReal) row.push(money(r.realBalance)); return row;
    });
    output.append(table(doc, headers, rows, 'Every completed period, including time 0. QAR displays rounded to two decimal places.'));
    output.append(el('p', 'Points represent completed credit dates. Calculations retain precision; only displayed money is rounded. Constant rates, no later deposits or withdrawals, no fees or taxes.', 'ei-note'));
    if (scene.id === 'f-explain') {
      const threshold = firstThreshold({initial: s.principal, factor: s.periodicFactor, target: 6000, relation: 'atLeast', maxPeriods: 1200});
      const periodName = s.compoundsPerYear === 4 ? 'quarter' : 'credit period';
      if (threshold.found) {
        const proof = el('div', undefined, 'ei-formula'); proof.dataset.thresholdEvidence = 'true';
        proof.append(el('p', `First ${periodName} at or above QAR 6,000.00: ${threshold.period}, after ${format(threshold.period / s.compoundsPerYear, 6)} years.`));
        if (threshold.previous) proof.append(el('p', `${periodName[0].toUpperCase() + periodName.slice(1)} ${threshold.previous.period}: QAR ${money(threshold.previous.value)} < QAR 6,000.00; ${periodName} ${threshold.period}: QAR ${money(threshold.value)} ≥ QAR 6,000.00.`));
        else proof.append(el('p', 'The initial balance already meets the target at time 0.'));
        output.append(proof);
        task = {integer: true, answer: threshold.period, label: `Predict the first completed ${periodName} with at least QAR 6,000.00`,
          hint: 'Use the first whole credit period that meets the target, then check the preceding period.',
          explanation: `${periodName[0].toUpperCase() + periodName.slice(1)} ${threshold.period} is the first qualifying credit date; this is ${format(threshold.period / s.compoundsPerYear, 6)} years.`};
      } else { task = null; check.disabled = true; output.append(el('p', 'The target is not reached in the first 1200 periods.', 'ei-note')); }
    } else {
      const future = finance({...params, years: (s.periods + 1) / s.compoundsPerYear});
      task = {integer: false, answer: future.balance, label: `Predict the ${s.kind === 'depreciation' ? 'remaining value' : 'nominal balance'} at completed period ${s.periods + 1} / QAR`,
        hint: s.kind === 'simple' ? 'Add interest on the original principal for one period.' : 'Apply one more periodic factor to the current value.',
        explanation: `At period ${s.periods + 1}, the model gives QAR ${money(future.balance)}.`};
    }
    predictionLabel.textContent = task?.label ?? 'Prediction unavailable for these inputs';
    predictionInput.inputMode = task?.integer ? 'numeric' : 'decimal'; clearFeedback();
  }
  on(predictionInput, 'input', () => { if (!disposed) clearFeedback(); });
  on(check, 'click', () => {
    if (disposed || !task || check.disabled) return;
    const raw = predictionInput.value.trim(), answer = Number(raw);
    if (!numeric(raw) || (task.integer && (!Number.isInteger(answer) || answer < 0))) {
      feedback.textContent = task.integer ? 'Enter a nonnegative whole number of credit periods.' : 'Enter a finite number without units or commas; for example, 5858.30.'; feedback.dataset.result = 'retry'; return;
    }
    const correct = task.integer ? answer === task.answer : Math.abs(answer - task.answer) <= 0.005 + 8 * Number.EPSILON * Math.max(1, Math.abs(task.answer));
    feedback.dataset.result = correct ? 'correct' : 'retry';
    feedback.textContent = correct ? `Your prediction agrees with the model. ${task.explanation}` : `Recheck your prediction. ${task.hint} ${task.explanation}`;
  });
  on(reset, 'click', () => {
    if (disposed) return;
    Object.assign(params, initial); controls.forEach(({input, value, key}) => { input.value = String(initial[key]); value.textContent = format(initial[key], 6); });
    showSimple = (initial.kind ?? 'compound') === 'compound'; showReal = (initial.inflationPercent ?? 0) !== 0;
    if (simpleToggle) simpleToggle.checked = showSimple; realToggle.checked = showReal;
    clearFeedback(true); draw();
  });
  draw();
  return Object.freeze({dispose() { if (disposed) return; disposed = true; removers.splice(0).forEach(fn => fn()); outer.remove(); }});
}
