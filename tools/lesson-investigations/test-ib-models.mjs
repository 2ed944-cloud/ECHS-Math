import assert from 'node:assert/strict';
import {arithmetic, geometric, finance, firstThreshold} from '../../lessons/shared/investigations/ib-models.mjs';
import {IB_CONTENT} from '../../lessons/shared/investigations/ib-content.mjs';

let checks = 0;
const results = [];
function check(name, body) { body(); checks += 1; results.push({name, status: 'PASS'}); }
const close = (actual, expected, tolerance = 2e-12) => assert.ok(Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)), `${actual} != ${expected}`);
const invalid = (body, code = 'ib_invalid_input') => assert.throws(body, error => error instanceof RangeError && error.message === code);

check('Arithmetic term versus finite sum and zero-term sum', () => {
  const x = arithmetic({first: 12, difference: 4, index: 8, count: 3});
  assert.equal(x.term, 40); assert.equal(x.sum, 48); assert.equal(x.rows.length, 8);
  assert.deepEqual(x.rows[0], {index: 1, term: 12, sum: 12});
  assert.equal(arithmetic({first: 5, difference: 2, index: 1, count: 0}).sum, 0);
});
check('Arithmetic independent repeated-addition checks across signs and counts', () => {
  for (const first of [-17, 0, 3.5, 81]) for (const difference of [-4, 0, 0.5, 9]) for (const count of [1, 2, 7, 30]) {
    let term = first, sum = 0;
    for (let j = 0; j < count; j += 1) { sum += term; if (j < count - 1) term += difference; }
    const x = arithmetic({first, difference, index: count, count}); close(x.term, term); close(x.sum, sum);
    assert.equal(x.rows.at(-1).sum, x.sum);
  }
});
check('Arithmetic indexing, selected ranges and context examples', () => {
  const x = arithmetic({first: 9, difference: 3, index: 6, count: 6});
  assert.equal(x.term, 24); assert.equal(x.sum, 99); assert.equal(x.sum - x.rows[1].sum, 78);
  const estimate = (111 - 81) / 3; assert.equal(estimate, 10);
  assert.equal(arithmetic({first: 81, difference: estimate, index: 7}).term, 141);
});
check('Geometric explicit finite examples and special ratios', () => {
  let x = geometric({first: 6, ratio: 2, index: 5, count: 5}); close(x.term, 96); close(x.sum, 186);
  x = geometric({first: 7, ratio: 1, index: 8, count: 8}); assert.equal(x.term, 7); assert.equal(x.sum, 56);
  x = geometric({first: 7, ratio: 0, index: 8, count: 8}); assert.equal(x.term, 0); assert.equal(x.sum, 7);
  assert.equal(geometric({first: 7, ratio: 0, index: 1, count: 0}).term, 7);
  assert.equal(geometric({first: 0, ratio: 1e100, index: 100, count: 100}).sum, 0);
});
check('Geometric independent repeated multiplication across signs', () => {
  for (const first of [-3, 0, 0.75, 8]) for (const ratio of [-2, -1, -0.5, 0, 0.5, 1, 1.25, 2]) for (const count of [1, 2, 7, 20]) {
    let term = first, sum = 0;
    for (let j = 0; j < count; j += 1) { sum += term; if (j < count - 1) term *= ratio; }
    const x = geometric({first, ratio, index: count, count}); close(x.term, term); close(x.sum, sum);
  }
});
check('Near-one geometric ratio keeps the finite sum stable', () => {
  for (const ratio of [1 + 1e-12, 1 - 1e-12]) {
    const x = geometric({first: 3, ratio, index: 500, count: 500});
    let sum = 0, term = 3; for (let j = 0; j < 500; j += 1) { sum += term; term *= ratio; }
    close(x.sum, sum); assert.ok(Number.isFinite(x.sum));
  }
});
check('Geometric ambiguity, finite bounce distance and whole stages', () => {
  assert.equal(geometric({first: 3, ratio: 2, index: 3}).term, 12);
  assert.equal(geometric({first: 3, ratio: -2, index: 3}).term, 12);
  close(2 + 2 * geometric({first: 1.5, ratio: 0.75, index: 4, count: 4}).sum, 10.203125);
  const x = geometric({first: 40, ratio: 3, index: 5, count: 5}); close(x.term, 3240); close(x.sum, 4840);
});
check('Finance nominal quarterly setup and independent period recurrence', () => {
  const x = finance({principal: 5000, annualRatePercent: 8, compoundsPerYear: 4, years: 2});
  let expected = 5000; for (let j = 0; j < 8; j += 1) expected += expected * 0.02;
  assert.equal(x.periods, 8); close(x.periodicFactor, 1.02); close(x.balance, expected);
  assert.equal(x.balance.toFixed(2), '5858.30'); assert.equal(x.interest.toFixed(2), '858.30');
  assert.equal(x.rows[0].balance, 5000); assert.equal(x.rows[1].years, 0.25); assert.equal(x.rows.at(-1).balance, x.balance);
});
check('Simple interest, zero time, zero rate and zero principal', () => {
  const simple = finance({principal: 6000, annualRatePercent: 6, compoundsPerYear: 4, years: 4, kind: 'simple'});
  assert.equal(simple.balance, 7440); assert.equal(simple.periodicFactor, null); assert.equal(simple.effectiveAnnualRatePercent, null);
  const compound = finance({principal: 6000, annualRatePercent: 6, compoundsPerYear: 4, years: 4});
  assert.ok(compound.balance > simple.balance); assert.equal(compound.simpleBalance, simple.balance);
  assert.equal(finance({years: 0}).rows.length, 1);
  assert.equal(finance({annualRatePercent: 0}).balance, 5000);
  assert.equal(finance({principal: 0, annualRatePercent: 1000, years: 10}).balance, 0);
});
check('Finance matches every complete monthly and quarterly credit date', () => {
  for (const m of [1, 2, 3, 4, 12]) for (const periods of [0, 1, 6, 18]) {
    const x = finance({principal: 1000, annualRatePercent: 12, compoundsPerYear: m, years: periods / m});
    let amount = 1000;
    for (const row of x.rows) { close(row.balance, amount); assert.equal(row.years, row.period / m); amount *= 1 + 0.12 / m; }
  }
  invalid(() => finance({compoundsPerYear: 1, years: 0.5}), 'ib_credit_date');
  invalid(() => finance({compoundsPerYear: 4, years: 0.3}), 'ib_credit_date');
});
check('Depreciation distinguishes value, total loss and annual loss', () => {
  const x = finance({principal: 9000, annualRatePercent: 20, compoundsPerYear: 1, years: 3, kind: 'depreciation'});
  close(x.balance, 4608); close(x.interest, -4392); assert.equal(x.simpleBalance, null);
  close(x.rows[0].balance - x.rows[1].balance, 1800); close(x.rows[2].balance - x.rows[3].balance, 1152);
  assert.equal(finance({principal: 9000, annualRatePercent: 100, compoundsPerYear: 1, years: 3, kind: 'depreciation'}).balance, 0);
});
check('Inflation comparison uses matching dates and annual effective factors', () => {
  const x = finance({principal: 8000, annualRatePercent: 4, compoundsPerYear: 1, years: 4, inflationPercent: 6});
  assert.ok(x.balance > 8000 && x.realBalance < 8000); close(x.realBalance, 8000 * (1.04 / 1.06) ** 4);
  close(x.realAnnualRatePercent, 100 * (1.04 / 1.06 - 1)); assert.notEqual(x.realAnnualRatePercent, -2);
  const quarterly = finance({annualRatePercent: 8, compoundsPerYear: 4, years: 2, inflationPercent: 3});
  close(quarterly.effectiveAnnualRatePercent, 100 * (1.02 ** 4 - 1));
  close(quarterly.realAnnualRatePercent, 100 * (1.02 ** 4 / 1.03 - 1));
});
check('Threshold preserves strict versus inclusive decimal boundaries', () => {
  for (const [relation, expected] of [['atLeast', 2], ['above', 3]]) {
    const x = firstThreshold({initial: 100, factor: 1.1, target: 121, relation});
    assert.equal(x.period, expected); assert.equal(x.previous.period, expected - 1); assert.equal(x.previous.matches, false);
  }
  assert.equal(firstThreshold({initial: 100, factor: 0.9, target: 81, relation: 'atMost'}).period, 2);
  assert.equal(firstThreshold({initial: 100, factor: 0.9, target: 81, relation: 'below'}).period, 3);
  assert.equal(firstThreshold({initial: 100, factor: 1.1, target: 121.000000000001, relation: 'above'}).period, 3);
});
check('Threshold has an initial-time result, a bounded miss and zero cases', () => {
  const initial = firstThreshold({initial: 100, factor: 1.1, target: 50}); assert.equal(initial.period, 0); assert.equal(initial.previous, null);
  const miss = firstThreshold({initial: 100, factor: 1, target: 101, maxPeriods: 30});
  assert.equal(miss.found, false); assert.equal(miss.period, null); assert.equal(miss.checkedThrough, 30); assert.equal(miss.previous.period, 30);
  assert.equal(firstThreshold({initial: 0, factor: 0, target: 0}).period, 0);
  assert.equal(firstThreshold({initial: 20, factor: 0, target: 0, relation: 'atMost'}).period, 1);
  assert.equal(firstThreshold({initial: 1, factor: 0.1, target: 0, relation: 'atMost', maxPeriods: 400}).found, false);
});
check('Finance threshold checks the adjacent quarter and converts time last', () => {
  const x = firstThreshold({initial: 5000, factor: 1.02, target: 6000});
  assert.equal(x.period, 10); assert.equal(x.period / 4, 2.5); assert.ok(x.previous.value < 6000 && x.value >= 6000);
  const table = finance({principal: 5000, annualRatePercent: 8, compoundsPerYear: 4, years: 3}).rows;
  close(x.value, table[10].balance); close(x.previous.value, table[9].balance);
});
check('Reject nonnumeric entries, invalid indices and unbounded allocation', () => {
  for (const value of [NaN, Infinity, -Infinity, true, '5', null]) {
    invalid(() => arithmetic({first: value})); invalid(() => geometric({ratio: value})); invalid(() => finance({principal: value}));
  }
  for (const index of [0, -1, 1.5, 501, '2']) invalid(() => arithmetic({index}));
  for (const count of [-1, 2.5, 501]) invalid(() => geometric({count}));
  for (const maxPeriods of [-1, 1.5, 1201]) invalid(() => firstThreshold({initial: 1, factor: 2, target: 3, maxPeriods}));
});
check('Reject finance domain mistakes and nonfinite mathematical output', () => {
  for (const values of [{principal: -1}, {compoundsPerYear: 0}, {compoundsPerYear: 2.5}, {inflationPercent: -100}, {kind: 'loan'}, {annualRatePercent: -400}, {years: -1}, {kind: 'depreciation', compoundsPerYear: 4}, {kind: 'depreciation', compoundsPerYear: 1, annualRatePercent: 101}]) invalid(() => finance(values));
  invalid(() => finance({principal: 100, annualRatePercent: -50, compoundsPerYear: 1, years: 3, kind: 'simple'}), 'ib_finance_domain');
  invalid(() => geometric({first: 1, ratio: 1e100, index: 10}), 'ib_numeric_range');
  invalid(() => arithmetic({first: 1e308, difference: 1e308, index: 3}), 'ib_numeric_range');
  invalid(() => firstThreshold({initial: 1, factor: -2, target: 3}));
  invalid(() => firstThreshold({initial: 1, factor: 2, target: 3, relation: 'equals'}));
});
check('Teaching models do not mutate inputs and freeze returned tables', () => {
  const input = Object.freeze({first: 5, ratio: -1, index: 5, count: 5}); const x = geometric(input);
  assert.deepEqual(input, {first: 5, ratio: -1, index: 5, count: 5});
  assert.ok(Object.isFrozen(x) && Object.isFrozen(x.rows) && Object.isFrozen(x.rows[0]));
  assert.throws(() => { x.rows[0].term = 900; }, TypeError);
});
check('Content keeps the three official topic mappings and original teaching scope', () => {
  assert.deepEqual(Object.keys(IB_CONTENT), ['arithmetic', 'geometric', 'finance']);
  const ids = new Set();
  for (const [key, topic] of Object.entries(IB_CONTENT)) {
    assert.equal(topic.curriculum, 'ib-ai-sl-first-assessment-2021'); assert.ok(Object.isFrozen(topic));
    for (const kind of ['warmup', 'discover', 'notes', 'explain', 'apply', 'exit']) assert.ok(topic.scenes.some(s => s.kind === kind), `${key}: ${kind}`);
    for (const s of topic.scenes) {
      assert.ok(!ids.has(s.id)); ids.add(s.id);
      assert.deepEqual(Object.keys(s), ['id', 'title', 'kind', 'model', 'text', 'prompts', 'initial', 'controls']);
      assert.ok(s.text.length && s.prompts.length && s.text.every(t => typeof t === 'string') && s.prompts.every(t => typeof t === 'string'));
      assert.ok(s.model === null || s.model === key); assert.ok(!JSON.stringify(s).includes('mastery'));
    }
  }
  assert.match(IB_CONTENT.arithmetic.topic, /^1\.2/); assert.match(IB_CONTENT.geometric.topic, /^1\.3/); assert.match(IB_CONTENT.finance.topic, /^1\.4/);
});
check('Every live scene and every individual control setting gives a finite model', () => {
  const models = {arithmetic, geometric, finance};
  for (const topic of Object.values(IB_CONTENT)) for (const s of topic.scenes) if (s.model) {
    const model = models[s.model]; model(s.initial);
    for (const c of s.controls) {
      assert.ok(c.step > 0 && c.max >= c.min && c.key in s.initial);
      const steps = Math.round((c.max - c.min) / c.step);
      for (let j = 0; j <= steps; j += 1) {
        const result = model({...s.initial, [c.key]: c.min + j * c.step});
        assert.ok(result.rows.length > 0 && result.rows.length <= 1201);
        for (const row of result.rows) assert.ok(Object.values(row).every(v => v === null || Number.isFinite(v)));
      }
    }
  }
});

console.log(JSON.stringify({contract: 'echs.ib-investigation-model-tests.v1', status: 'PASS', checks, results,
  scope: 'Pure mathematical models and original content data; browser, authentication and mastery behavior not exercised.'}, null, 2));
