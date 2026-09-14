// Controlled DOM component tests; native browser/access checks are separate.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mountFinance} from '../../lessons/shared/investigations/finance-view.mjs';
import {IB_CONTENT} from '../../lessons/shared/investigations/ib-content.mjs';
const require = createRequire(import.meta.url);
const {parseHTML} = require(process.env.ECHS_TEST_DOM_MODULE || 'linkedom');
const results = [];
const scene = id => IB_CONTENT.finance.scenes.find(s => s.id === id);
function group(name, body) { body(); results.push({name, status: 'PASS'}); }
function fixture(id, replacement) {
  const {document, window} = parseHTML('<html><body><main><p id="retained">Existing content</p><div id="finance"></div></main></body></html>');
  window.fetch = () => { throw new Error('No network from teaching component'); };
  const root = document.getElementById('finance');
  const mounted = mountFinance({root, window, scene: replacement ?? scene(id)});
  const emit = (input, value, type = 'input') => { input.value = String(value); input.dispatchEvent(new window.Event(type)); };
  const parameter = key => root.querySelector(`[data-parameter="${key}"]`);
  const predict = value => { const input = root.querySelector('.ei-prediction input'); emit(input, value); root.querySelector('.ei-prediction button').click(); return root.querySelector('.ei-prediction .ei-feedback'); };
  return {root, window, document, mounted, emit, parameter, predict};
}
group('The authored control roster and fixed financial kind are retained', () => {
  for (const s of IB_CONTENT.finance.scenes.filter(s => s.model === 'finance')) {
    const f = fixture(s.id);
    assert.deepEqual([...f.root.querySelectorAll('[data-parameter]')].map(n => n.dataset.parameter), s.controls.map(c => c.key));
    assert.equal(f.root.querySelectorAll('select').length, 0);
    for (const c of s.controls) {
      const input = f.parameter(c.key); assert.equal(input.value, String(s.initial[c.key]));
      assert.equal(input.min, String(c.min)); assert.equal(input.max, String(c.max)); assert.equal(input.step, String(c.step));
      assert.ok([...f.root.querySelectorAll('label')].some(l => l.htmlFor === input.id && l.textContent === c.label));
    }
    f.mounted.dispose();
  }
});
group('Money columns retain two decimal places including zero and whole balances', () => {
  const f = fixture('f-warmup'); let rows = [...f.root.querySelectorAll('tbody tr')];
  assert.equal(rows.length, 2); assert.match(rows[0].textContent, /4,000\.00/); assert.match(rows[1].textContent, /4,200\.00/);
  assert.match(f.root.textContent, /Interest earned: QAR 200\.00/);
  f.emit(f.parameter('years'), 0); rows = [...f.root.querySelectorAll('tbody tr')];
  assert.equal(rows.length, 1); assert.match(f.root.textContent, /Interest earned: QAR 0\.00/); f.mounted.dispose();
});
group('Frequency changes re-render every completed period and reset exactly', () => {
  const f = fixture('f-discover'); assert.equal(f.root.querySelectorAll('tbody tr').length, 17);
  f.emit(f.parameter('compoundsPerYear'), 12); assert.equal(f.root.querySelectorAll('tbody tr').length, 49);
  assert.match(f.root.textContent, /N = 48 completed months/); assert.match(f.root.textContent, /periodic interest rate is 0\.5%/);
  [...f.root.querySelectorAll('button')].find(b => b.textContent === 'Reset model and prediction').click();
  assert.equal(f.parameter('compoundsPerYear').value, '4'); assert.equal(f.root.querySelectorAll('tbody tr').length, 17);
  assert.equal(f.document.getElementById('retained').textContent, 'Existing content'); f.mounted.dispose();
});
group('Threshold task tests whole quarters and presents both adjacent balances', () => {
  const f = fixture('f-explain'); assert.equal(f.root.querySelectorAll('tbody tr').length, 13);
  const proof = f.root.querySelector('[data-threshold-evidence]');
  assert.match(proof.textContent, /quarter.*10.*2\.5 years/); assert.match(proof.textContent, /Quarter 9: QAR 5,975\.46/); assert.match(proof.textContent, /quarter 10: QAR 6,094\.97/);
  assert.equal(f.predict('9').dataset.result, 'retry'); assert.equal(f.predict('10').dataset.result, 'correct');
  assert.match(f.predict('2.5').textContent, /whole number/); assert.match(f.predict('-1').textContent, /whole number/);
  f.emit(f.parameter('years'), 0); assert.equal(f.root.querySelectorAll('tbody tr').length, 1); assert.match(f.root.querySelector('[data-threshold-evidence]').textContent, /Quarter 9/); f.mounted.dispose();
});
group('Monetary predictions accept final rounding but reject a wrong cent or malformed value', () => {
  const f = fixture('f-warmup');
  assert.equal(f.predict('4410.00').dataset.result, 'correct'); assert.equal(f.predict('4410.01').dataset.result, 'retry');
  assert.match(f.predict('4,410.00').textContent, /without units or commas/);
  assert.match(f.predict('Infinity').textContent, /finite number/); assert.match(f.predict('').textContent, /finite number/);
  assert.match(f.predict('4410').textContent, /QAR 4,410\.00/); f.mounted.dispose();
});
group('Depreciation labels remaining value and loss, retaining the fixed annual model', () => {
  const f = fixture('f-depreciation');
  assert.match(f.root.textContent, /Value remaining: QAR 4,608\.00/); assert.match(f.root.textContent, /Value lost since purchase: QAR 4,392\.00/);
  assert.doesNotMatch(f.root.textContent, /Interest earned/); assert.equal(f.parameter('compoundsPerYear'), null);
  assert.equal(f.root.querySelector('input[id$="-simple"]'), null);
  assert.equal(f.predict('3686.40').dataset.result, 'correct'); f.mounted.dispose();
});
group('Purchasing-power and simple-interest displays are independently optional', () => {
  const f = fixture('f-inflation'); let headers = [...f.root.querySelectorAll('thead th')].map(n => n.textContent);
  assert.ok(headers.includes('Time-0 purchasing power / QAR') && headers.includes('Simple interest / QAR'));
  const real = f.root.querySelector('input[id$="-real"]'); real.checked = false; real.dispatchEvent(new f.window.Event('change'));
  headers = [...f.root.querySelectorAll('thead th')].map(n => n.textContent); assert.ok(!headers.includes('Time-0 purchasing power / QAR'));
  const simple = f.root.querySelector('input[id$="-simple"]'); simple.checked = false; simple.dispatchEvent(new f.window.Event('change'));
  assert.equal(f.root.querySelectorAll('thead th').length, 3);
  assert.equal(f.root.querySelectorAll('svg polyline').length, 0, 'Credit points must not imply available continuous balances'); f.mounted.dispose();
});
group('Changed and invalid inputs cannot retain successful prediction feedback', () => {
  const f = fixture('f-warmup'); assert.equal(f.predict('4410').dataset.result, 'correct');
  f.emit(f.parameter('years'), 2); assert.equal(f.root.querySelector('.ei-prediction input').value, ''); assert.equal(f.root.querySelector('.ei-prediction .ei-feedback').textContent, '');
  f.emit(f.parameter('years'), 2.5); assert.equal(f.root.querySelector('.ei-prediction button').disabled, true); assert.match(f.root.textContent, /displayed control scale/);
  f.emit(f.parameter('years'), 3); assert.equal(f.root.querySelector('.ei-prediction button').disabled, false);
  assert.equal(f.predict('4862.025').dataset.result, 'correct'); f.mounted.dispose();
});
group('Labels are text, controls have associations and feedback is announced', () => {
  const original = scene('f-warmup'); const f = fixture(null, {...original, controls: [{...original.controls[0], label: '<img src=x onerror=alert(1)>'}]});
  assert.equal(f.root.querySelector('img'), null); assert.match(f.root.textContent, /<img src=x/);
  assert.ok(f.root.querySelector('.ei-prediction .ei-feedback').getAttribute('role') === 'status');
  assert.ok(f.root.querySelector('table caption').textContent.includes('Every completed period'));
  assert.equal(f.root.querySelector('svg').getAttribute('role'), 'img'); f.mounted.dispose();
});
group('Disposal removes only the owned view and detaches every live control listener', () => {
  const f = fixture('f-warmup'), input = f.parameter('years'), held = f.root.firstElementChild;
  const previous = held.textContent; f.mounted.dispose(); f.mounted.dispose();
  assert.equal(f.root.childNodes.length, 0); assert.equal(f.document.getElementById('retained').textContent, 'Existing content');
  f.emit(input, 6); assert.equal(held.textContent, previous);
  const again = mountFinance({root: f.root, window: f.window, scene: scene('f-warmup')}); assert.equal(f.root.querySelectorAll('tbody tr').length, 2); again.dispose();
});
console.log(JSON.stringify({contract: 'echs.finance-investigation-view-tests.v1', status: 'PASS', checks: results.length, results,
  scope: 'Controlled DOM component tests only; no native browser, auth, publication or mastery acceptance.'}, null, 2));
