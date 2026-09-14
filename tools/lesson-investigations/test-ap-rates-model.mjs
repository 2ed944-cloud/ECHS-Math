import assert from 'node:assert/strict';
import test from 'node:test';
import { sampleRates, secant, motionAt, AP_RATES_LIMITS } from '../../lessons/shared/investigations/ap-rates-model.mjs';
import content from '../../lessons/shared/investigations/ap-rates-content.mjs';

const near = (actual, expected, tolerance = 1e-9) => assert.ok(Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)), `${actual} differs from ${expected}`);
const direct = (x, p) => p.a * x * x + p.b * x + p.c;
const differences = rows => rows.slice(1).map((value, i) => value - rows[i]);
const invalid = call => assert.throws(call, error => error instanceof RangeError && error.message === 'Invalid AP rates model input.');

test('linear interval rates ignore location, width and intercept', () => {
  for (const b of [-4, 0, 2.5]) for (const c of [-7, 0, 8]) for (const start of [-6, 0, 4]) for (const step of [0.25, 1, 2]) {
    const state = sampleRates({ a: 0, b, c, start, step, count: 4 });
    state.intervalRates.forEach(rate => near(rate, b));
    state.firstDifferences.forEach(change => near(change, b * step));
    state.secondDifferences.forEach(change => assert.equal(change, 0));
    assert.equal(state.direction, b > 0 ? 'increasing' : b < 0 ? 'decreasing' : 'constant');
    assert.equal(state.concavity, 'neither');
  }
});
test('quadratic tables agree with independent endpoint subtraction', () => {
  for (const a of [-2, -0.5, 0.5, 2]) for (const b of [-3, 0, 4]) for (const c of [-5, 3]) for (const step of [0.25, 1, 2]) {
    const p = { a, b, c, start: -2, step, count: 6 }, state = sampleRates(p);
    const y = state.rows.map(({ x }) => direct(x, p)), first = differences(y), second = differences(first), rates = first.map(change => change / step);
    state.rows.forEach((row, i) => near(row.y, y[i]));
    state.firstDifferences.forEach((change, i) => near(change, first[i]));
    state.secondDifferences.forEach((change, i) => near(change, second[i]));
    state.intervalRates.forEach((rate, i) => near(rate, rates[i]));
    state.rateChanges.forEach((change, i) => near(change, rates[i + 1] - rates[i]));
    state.normalizedRateChanges.forEach((change, i) => near(change, (rates[i + 1] - rates[i]) / step));
    assert.equal(state.concavity, a > 0 ? 'up' : 'down');
  }
});
test('nonunit width changes raw second difference and rate change on different scales', () => {
  const p = { a: 1, b: -4, c: 1, start: 0, count: 4 };
  const one = sampleRates({ ...p, step: 1 }), two = sampleRates({ ...p, step: 2 });
  assert.deepEqual(two.rows.map(row => row.y), [1, -3, 1, 13, 33]);
  assert.deepEqual(two.firstDifferences, [-4, 4, 12, 20]);
  assert.deepEqual(two.intervalRates, [-2, 2, 6, 10]);
  two.secondDifferences.forEach((value, i) => assert.equal(value, 4 * one.secondDifferences[i]));
  two.rateChanges.forEach((value, i) => assert.equal(value, 2 * one.rateChanges[i]));
  assert.deepEqual(two.normalizedRateChanges, one.normalizedRateChanges);
});
test('negative but increasing rates are distinct from increasing magnitudes', () => {
  const state = sampleRates({ a: 1, b: 0, c: 0, start: -4, step: 1, count: 3 });
  assert.deepEqual(state.intervalRates, [-7, -5, -3]);
  assert.ok(state.intervalRates.every((value, i, rows) => !i || value > rows[i - 1]));
  assert.ok(state.intervalRates.every((value, i, rows) => !i || Math.abs(value) < Math.abs(rows[i - 1])));
  assert.equal(state.direction, 'decreasing'); assert.equal(state.concavity, 'up');
});
test('all four direction and concavity combinations have explicit model witnesses', () => {
  for (const [a, b, expectedDirection, expectedConcavity] of [[1, 1, 'increasing', 'up'], [-1, 10, 'increasing', 'down'], [1, -10, 'decreasing', 'up'], [-1, -1, 'decreasing', 'down']]) {
    const state = sampleRates({ a, b, c: 0, start: 0, step: 1, count: 4 });
    assert.equal(state.direction, expectedDirection); assert.equal(state.concavity, expectedConcavity);
  }
});
test('turning motion has zero net interval change but nonconstant position', () => {
  const p = { a: -0.5, b: 4, c: 0 }, table = sampleRates({ ...p, start: 0, step: 2, count: 4 });
  assert.deepEqual(table.intervalRates, [3, 1, -1, -3]);
  assert.equal(table.direction, 'increasing-then-decreasing');
  assert.deepEqual(table.turningPoint, { x: 4, y: 8 });
  assert.equal(secant({ ...p, left: 2, right: 6 }).rate, 0);
  assert.equal(motionAt({ ...p, t: 2 }).position, 6); assert.equal(motionAt({ ...p, t: 4 }).position, 8);
  assert.equal(motionAt({ ...p, t: 4 }).direction, 'stationary'); assert.equal(motionAt({ ...p, t: 5 }).direction, 'decreasing');
  assert.equal(motionAt({ ...p, t: 8 }).quantity, 'directed-position');
});
test('turning point at an endpoint does not invent a direction reversal', () => {
  const start = sampleRates({ a: 1, b: 0, c: 0, start: 0, step: 1, count: 2 });
  const end = sampleRates({ a: 1, b: 0, c: 0, start: -2, step: 1, count: 2 });
  assert.equal(start.direction, 'increasing'); assert.equal(end.direction, 'decreasing');
  assert.deepEqual(start.turningPoint, { x: 0, y: 0 }); assert.deepEqual(end.turningPoint, { x: 0, y: 0 });
});
test('secant reversal changes numerator and denominator together', () => {
  const forwards = secant({ a: 1, b: 0, c: 0, left: 1, right: 3 });
  const backwards = secant({ a: 1, b: 0, c: 0, left: 3, right: 1 });
  assert.equal(forwards.rate, 4); assert.equal(backwards.rate, 4);
  assert.equal(backwards.width, -forwards.width); assert.equal(backwards.change, -forwards.change);
  assert.deepEqual(backwards.endpoints, [...forwards.endpoints].reverse());
});
test('small intervals remain finite without dividing cancelling endpoint values', () => {
  const p = { a: 2, b: -3, c: 100, start: 50, step: AP_RATES_LIMITS.minimumStep, count: 8 }, state = sampleRates(p);
  state.intervalRates.forEach((rate, i) => {
    const left = state.rows[i].x, right = state.rows[i + 1].x;
    near(rate, (direct(right, p) - direct(left, p)) / (right - left), 1e-7);
  });
  const tiny = motionAt({ a: Number.MIN_VALUE, b: 100, c: 100, t: 100 });
  assert.equal(tiny.turningTime, null); assert.ok(Number.isFinite(tiny.position));
});
test('bounded options reject invalid arithmetic and ambiguous intervals', () => {
  for (const value of [NaN, Infinity, -Infinity, '2', true, null, undefined, new Number(1)]) invalid(() => sampleRates({ a: value }));
  for (const value of [0, -1, 0.00001, 21]) invalid(() => sampleRates({ step: value }));
  for (const value of [1, 9, 2.5]) invalid(() => sampleRates({ count: value }));
  for (const key of ['a', 'b', 'c']) invalid(() => sampleRates({ [key]: 101 }));
  invalid(() => sampleRates({ start: 99, step: 1, count: 2 })); invalid(() => motionAt({ t: -101 }));
  invalid(() => secant({ left: 1, right: 1 })); invalid(() => secant({ left: 0, right: 0.00001 }));
  invalid(() => secant({ left: Infinity })); invalid(() => sampleRates({ width: 1 }));
});
test('options reject accessors without invoking them and never mutate caller input', () => {
  let calls = 0; const hostile = Object.defineProperty({}, 'a', { enumerable: true, get() { calls++; return 1; } });
  invalid(() => sampleRates(hostile)); assert.equal(calls, 0);
  for (const value of [null, [], Object.create({ a: 1 }), 1, '1']) invalid(() => sampleRates(value));
  invalid(() => sampleRates({ [Symbol('a')]: 1 }));
  const p = { a: 1, b: 2, c: 3, start: 0, step: 1, count: 4 }, original = structuredClone(p), state = sampleRates(p);
  assert.deepEqual(p, original); assert.notEqual(state.input, p);
  assert.ok(Object.isFrozen(state) && Object.isFrozen(state.rows) && Object.isFrozen(state.rows[0]));
});
test('all initial states and slider endpoint combinations stay inside model bounds', () => {
  assert.equal(content.scenes.length, 4);
  for (const scene of content.scenes) {
    const combinations = scene.controls.reduce((states, control) => states.flatMap(state => [control.min, control.max].map(value => ({ ...state, [control.key]: value }))), [{ ...scene.initial }]);
    for (const initial of [scene.initial, ...combinations]) {
      const state = sampleRates(initial);
      for (const row of state.rows) assert.ok(Number.isFinite(row.x) && Number.isFinite(row.y));
      for (const row of state.rows) near(motionAt({ a: initial.a, b: initial.b, c: initial.c, t: row.x }).position, row.y);
    }
  }
});
test('finite samples have a concrete nonunique-function witness', () => {
  const nodes = [0, 1, 2, 3], linear = x => 2 * x + 1;
  const alternative = x => linear(x) + nodes.reduce((product, node) => product * (x - node), 1);
  nodes.forEach(x => assert.equal(alternative(x), linear(x)));
  assert.notEqual(alternative(0.5), linear(0.5));
  assert.match(sampleRates().assumption, /Finite samples alone/);
});
test('transfer rate calculations preserve interval and per-input units', () => {
  const sensor = [4, 7, 10, 13]; assert.deepEqual(differences(sensor).map(change => change / 2), [1.5, 1.5, 1.5]);
  const rates = [7, 1, -5]; assert.deepEqual(differences(rates), [-6, -6]); assert.deepEqual(differences(rates).map(change => change / 3), [-2, -2]);
  const nonquadratic = [2, 4, 8, 16, 32]; assert.deepEqual(differences(differences(nonquadratic)), [2, 4, 8]);
});
test('declarative content has stable original teaching provenance and closed scene vocabulary', () => {
  assert.equal(content.topic, '1.3'); assert.equal(content.provenance.restrictedMaterialCopied, false); assert.equal(content.provenance.awardsMastery, false);
  assert.deepEqual(content.scenes.map(scene => scene.kind), ['warmup', 'motion', 'differences', 'transfer']);
  assert.equal(new Set(content.scenes.map(scene => scene.id)).size, 4);
  for (const scene of content.scenes) {
    assert.equal(scene.model, 'sampleRates'); assert.ok(Object.isFrozen(scene));
    assert.ok(scene.text.length && scene.text.every(text => typeof text === 'string' && text.length > 0));
    assert.ok(scene.prompts.length && scene.prompts.every(text => typeof text === 'string' && text.length > 0));
    assert.ok(scene.worked.every(text => typeof text === 'string' && text.length > 0));
    scene.controls.forEach(control => assert.ok(Object.hasOwn(scene.initial, control.key)));
  }
});
