import assert from 'node:assert/strict';
import test from 'node:test';
import {resolve, dirname} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const option = process.argv.indexOf('--repo');
const repo = resolve(option < 0 ? resolve(dirname(fileURLToPath(import.meta.url)), '../..') : process.argv[option + 1]);
const {factorLedger, rationalAt, sampleRational, AP_RATIONAL_MODEL_VERSION, AP_RATIONAL_LIMITS} =
  await import(pathToFileURL(resolve(repo, 'lessons/shared/investigations/ap-rational-model.mjs')));
const factor = (root, multiplicity = 1) => ({root, multiplicity});
const rule = (numerator = [], denominator = [], scale = 1) => ({scale, numerator, denominator});
const near = (actual, expected) => assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) <= 2e-11 * Math.max(1, Math.abs(expected)), `${actual} != ${expected}`);
const bad = action => assert.throws(action, error => error instanceof RangeError && error.message === 'Invalid AP rational model input.');
const numeric = action => assert.throws(action, error => error instanceof RangeError && error.message === 'AP rational result is outside the finite numeric range.');
const mul = (a, b) => {
  const out = Array(a.length + b.length - 1).fill(0);
  a.forEach((x, i) => b.forEach((y, j) => out[i + j] += x * y));
  return out;
};
const expand = (rows, scale = 1) => {
  let out = [scale];
  for (const {root, multiplicity} of rows) for (let j = 0; j < multiplicity; j++) out = mul(out, [-root, 1]);
  return out;
};
const poly = (coefficients, x) => coefficients.reduceRight((y, c) => y * x + c, 0);
const direct = (input, x) => poly(expand(input.numerator, input.scale), x) / poly(expand(input.denominator), x);

test('01 empty products and immutable versioned public shapes are explicit', () => {
  const model = factorLedger(rule([], [], -2));
  assert.equal(model.version, AP_RATIONAL_MODEL_VERSION);
  assert.equal(model.family, 'real-linear-factors');
  assert.deepEqual(model.originalDegrees, {numerator:0, denominator:0});
  assert.deepEqual(model.reducedDegrees, {numerator:0, denominator:0});
  assert.deepEqual(model.zeros, []); assert.deepEqual(model.exclusions, []);
  assert.deepEqual(model.signIntervals, [{left:null, right:null, sign:-1}]);
  assert.equal(model.tails.horizontalAsymptote, -2);
  assert.equal(model.tails.left.value, -2); assert.equal(model.tails.right.value, -2);
  assert.deepEqual(rationalAt(model.input, 0), {x:0, kind:'defined', y:-2});
  assert.ok(Object.isFrozen(AP_RATIONAL_LIMITS));
});

test('02 cancellation merges exact repeated factors and retains every original exclusion', () => {
  const input = rule([factor(-1), factor(-1, 2), factor(2)], [factor(-1, 3), factor(3)], 2);
  const model = factorLedger(input);
  assert.deepEqual(model.originalDegrees, {numerator:4, denominator:4});
  assert.deepEqual(model.reducedDegrees, {numerator:1, denominator:1});
  assert.equal(model.factors.find(row => row.x === -1).cancelledMultiplicity, 3);
  assert.deepEqual(model.exclusions.map(row => [row.x, row.kind, row.y]), [[-1, 'hole', 1.5], [3, 'pole', null]]);
  assert.deepEqual(model.zeros, [{x:2, multiplicity:1, crosses:true}]);
  assert.deepEqual(rationalAt(input, -1), {x:-1, kind:'hole', y:null});
  for (const x of [-4, -.5, 0, 1, 2, 2.5, 4]) near(rationalAt(input, x).y, 2 * (x - 2) / (x - 3));
});

test('03 all 72 singleton multiplicity/scale pairs distinguish holes from residual poles', () => {
  let count = 0;
  for (let n = 1; n <= 6; n++) for (let d = 1; d <= 6; d++) for (const scale of [-2, 2]) {
    const input = rule([factor(1, n)], [factor(1, d)], scale), model = factorLedger(input), at = model.exclusions[0];
    assert.equal(at.cancelledMultiplicity, Math.min(n, d));
    assert.equal(at.remainingDenominatorMultiplicity, Math.max(0, d - n));
    assert.equal(at.remainingNumeratorMultiplicity, Math.max(0, n - d));
    assert.deepEqual(model.zeros, [], 'excluded numerator root is never an x-intercept');
    if (n >= d) {
      assert.equal(at.kind, 'hole'); assert.equal(at.y, n === d ? scale : 0);
      assert.deepEqual(at.leftLimit, {kind:'finite', value:at.y});
      assert.deepEqual(at.rightLimit, at.leftLimit);
    } else {
      assert.equal(at.kind, 'pole'); assert.equal(at.y, null);
      const right = scale > 0 ? 'positive-infinity' : 'negative-infinity';
      const left = (d - n) % 2 ? (scale > 0 ? 'negative-infinity' : 'positive-infinity') : right;
      assert.equal(at.leftLimit.kind, left); assert.equal(at.rightLimit.kind, right);
    }
    for (const x of [-1, .5, 1.5, 3]) near(rationalAt(input, x).y, scale * (x - 1) ** (n - d));
    count++;
  }
  assert.equal(count, 72);
});

test('04 valid intercept multiplicity and excluded zero-height hole stay distinct', () => {
  const model = factorLedger(rule([factor(-2, 2), factor(0, 3), factor(3)], [factor(0)]));
  assert.deepEqual(model.zeros, [{x:-2, multiplicity:2, crosses:false}, {x:3, multiplicity:1, crosses:true}]);
  assert.equal(model.exclusions[0].kind, 'hole'); assert.equal(model.exclusions[0].y, 0);
  assert.deepEqual(rationalAt(model.input, 0), {x:0, kind:'hole', y:null});
  assert.deepEqual(rationalAt(model.input, -2), {x:-2, kind:'defined', y:0});
});

test('05 zero and negative-zero scale give all-domain zeros, only original-domain holes', () => {
  for (const scale of [0, -0]) {
    const input = rule([factor(-1, 3)], [factor(0, 2), factor(2, 3)], scale), model = factorLedger(input);
    assert.equal(model.zeroEverywhereOnDomain, true); assert.equal(Object.is(model.input.scale, -0), false);
    assert.deepEqual(model.zeros, [], 'no misleading finite list of every real-domain zero');
    assert.ok(model.exclusions.every(row => row.kind === 'hole' && row.y === 0 && row.leftLimit.value === 0 && row.rightLimit.value === 0));
    assert.ok(model.signIntervals.every(row => row.sign === 0 && !Object.is(row.sign, -0)));
    assert.equal(model.tails.degreeDifference, null); assert.equal(model.tails.leadingTerm, null);
    assert.equal(model.tails.horizontalAsymptote, 0);
    for (const x of [-25, -1, 1, 3, 25]) assert.equal(rationalAt(input, x).y, 0);
    for (const x of [0, 2]) assert.deepEqual(rationalAt(input, x), {x, kind:'hole', y:null});
  }
});

test('06 exact coincidences merge; arbitrarily close distinct roots do not cancel', () => {
  const nearRoot = 1 + 1e-10, model = factorLedger(rule([factor(1)], [factor(nearRoot)]));
  assert.equal(model.exclusions[0].kind, 'pole'); assert.equal(model.exclusions[0].cancelledMultiplicity, 0);
  assert.deepEqual(model.zeros, [{x:1, multiplicity:1, crosses:true}]);
  assert.equal(factorLedger(rule([factor(-0)], [factor(0)])).exclusions[0].kind, 'hole');
  assert.equal(factorLedger(rule([factor(-0)], [factor(0)])).factors.length, 1);
});

test('07 algebraic sign intervals agree with independent expanded polynomials', () => {
  const inputs = [
    rule([factor(-2, 2), factor(1)], [factor(-1), factor(1), factor(3, 2)], -2),
    rule([factor(-3), factor(0, 3)], [factor(-2, 2), factor(0)], .25),
    rule([], [factor(-1, 3), factor(2, 2)], -4),
  ];
  for (const input of inputs) {
    const model = factorLedger(input);
    for (const interval of model.signIntervals) {
      const x = interval.left === null ? interval.right - 1 : interval.right === null ? interval.left + 1 : (interval.left + interval.right) / 2;
      assert.equal(interval.sign, Math.sign(direct(input, x)));
    }
    for (const exclusion of model.exclusions.filter(row => row.kind === 'pole')) {
      assert.equal(exclusion.leftLimit.kind, direct(input, exclusion.x - .001) > 0 ? 'positive-infinity' : 'negative-infinity');
      assert.equal(exclusion.rightLimit.kind, direct(input, exclusion.x + .001) > 0 ? 'positive-infinity' : 'negative-infinity');
    }
  }
});

test('08 formal degrees and algebraic tails cover all 98 bounded degree pairs', () => {
  let count = 0;
  for (let n = 0; n <= 6; n++) for (let d = 0; d <= 6; d++) for (const scale of [-3, 3]) {
    const model = factorLedger(rule(n ? [factor(2, n)] : [], d ? [factor(-1, d)] : [], scale));
    assert.deepEqual(model.originalDegrees, {numerator:n, denominator:d});
    assert.equal(model.tails.degreeDifference, n - d);
    assert.deepEqual(model.tails.leadingTerm, {coefficient:scale, exponent:n - d});
    if (n <= d) {
      const expected = n === d ? scale : 0;
      assert.equal(model.tails.horizontalAsymptote, expected);
      assert.deepEqual(model.tails.left, {kind:'finite', value:expected});
      assert.deepEqual(model.tails.right, model.tails.left);
    } else {
      assert.equal(model.tails.horizontalAsymptote, null);
      assert.equal(model.tails.right.kind, scale > 0 ? 'positive-infinity' : 'negative-infinity');
      assert.equal(model.tails.left.kind, scale * (-1) ** (n - d) > 0 ? 'positive-infinity' : 'negative-infinity');
    }
    count++;
  }
  assert.equal(count, 98);
});

test('09 evaluations equal separately expanded original quotients away from exclusions', () => {
  for (const scale of [-4, -.25, .25, 4]) for (let m = 1; m <= 3; m++) {
    const input = rule([factor(-2, m), factor(1, 2)], [factor(-2), factor(3, 2)], scale);
    for (const x of [-25, -4, -1, 0, .5, 1, 2, 2.5, 4, 25]) near(rationalAt(input, x).y, direct(input, x));
  }
});

test('10 graph segments break at both sampled and unsampled original exclusions', () => {
  const input = rule([factor(.25)], [factor(.25), factor(1)]);
  const sampled = sampleRational(input, {start:-1, step:.5, count:6});
  assert.equal(sampled.rows.length, 7); assert.equal(sampled.rows[4].kind, 'pole');
  assert.equal(sampled.rows[4].y, null);
  assert.deepEqual(sampled.segments.map(rows => rows.map(row => row.x)), [[-1, -.5, 0], [.5], [1.5, 2]]);
  for (const segment of sampled.segments) for (const point of segment) near(point.y, 1 / (point.x - 1));
  const holes = sampleRational(rule([factor(0), factor(1)], [factor(0), factor(1)]), {start:-1, step:1, count:3});
  assert.deepEqual(holes.rows.map(row => row.kind), ['defined', 'hole', 'hole', 'defined']);
  assert.deepEqual(holes.segments, [[{x:-1, y:1}], [{x:2, y:1}]]);
  const zero = sampleRational(rule([], [factor(.25)], 0), {start:0, step:.5, count:1});
  assert.deepEqual(zero.segments, [[{x:0, y:0}], [{x:.5, y:0}]]);
});

test('11 closed sampling/evaluation limits reject invalid grids and foreign fields', () => {
  for (const x of [NaN, Infinity, -Infinity, 25.001, -25.001, '1', null, true, new Number(1)]) bad(() => rationalAt(rule(), x));
  for (const options of [null, {}, {start:0, step:1}, {start:0, step:1, count:1, extra:0},
    {start:25, step:1, count:1}, {start:-25, step:0, count:1}, {start:0, step:-1, count:1},
    {start:0, step:.00001, count:1}, {start:0, step:5.1, count:1}, {start:0, step:1, count:0},
    {start:0, step:.1, count:129}, {start:0, step:1, count:1.5}]) bad(() => sampleRational(rule(), options));
  assert.equal(sampleRational(rule(), {start:-25, step:5, count:10}).rows.at(-1).x, 25);
  assert.equal(sampleRational(rule(), {start:0, step:.0001, count:128}).rows.length, 129);
});

test('12 strict records and factor arrays reject malformed values without accessor execution', () => {
  const malformed = [null, undefined, {}, [], new Date(), rule([], [], '1'), rule([], [], .1), rule([], [], 4.01),
    rule([factor(4.01)]), rule([factor(NaN)]), rule([factor(0, 0)]), rule([factor(0, 1.5)]),
    rule([factor(0, 7)]), rule([factor(0, 4), factor(1, 3)]), rule([factor(0), factor(1), factor(2), factor(3)]),
    rule([factor(0)], null), {...rule(), extra:1}, {...rule(), [Symbol('foreign')]:1}];
  for (const input of malformed) bad(() => factorLedger(input));
  let calls = 0;
  const hostile = () => { calls++; throw new Error('PRIVATE INPUT MARKER'); };
  const accessor = {...rule()}; Object.defineProperty(accessor, 'scale', {get:hostile, enumerable:true});
  const row = {multiplicity:1}; Object.defineProperty(row, 'root', {get:hostile, enumerable:true});
  const array = [factor(0)]; Object.defineProperty(array, '0', {get:hostile, enumerable:true});
  const sparse = Array(1), extra = [factor(0)]; extra.marker = 1;
  const inherited = Object.create(rule());
  const hidden = rule(); Object.defineProperty(hidden, 'scale', {value:1, enumerable:false});
  for (const input of [accessor, rule([row]), rule(array), rule(sparse), rule(extra), inherited, hidden]) bad(() => factorLedger(input));
  assert.equal(calls, 0);
  const proxy = new Proxy({}, {getPrototypeOf:hostile}); bad(() => factorLedger(proxy));
  assert.equal(calls, 1, 'proxy trap failure is sanitized, not exposed');
});

test('13 extreme finite arithmetic fails explicitly instead of fabricating a zero or Infinity', () => {
  numeric(() => rationalAt(rule([factor(0, 6)]), 1e-300));
  numeric(() => rationalAt(rule([], [factor(0, 6)]), 1e-300));
  const cancelled = rule([factor(0, 6)], [factor(0, 6)]);
  assert.equal(rationalAt(cancelled, 1e-300).y, 1);
  assert.equal(factorLedger(cancelled).exclusions[0].y, 1);
});

test('14 captured original inputs and every output branch are deeply immutable', () => {
  const input = rule([factor(-1), factor(1, 2)], [factor(-1)]);
  const ledger = factorLedger(input), sampled = sampleRational(input, {start:-2, step:1, count:4});
  input.scale = 4; input.numerator[0].root = 3; input.denominator.push(factor(2));
  assert.equal(ledger.input.scale, 1); assert.equal(ledger.input.numerator[0].root, -1);
  assert.equal(sampled.input.denominator.length, 1);
  const visit = value => {
    if (value && typeof value === 'object') { assert.ok(Object.isFrozen(value)); Object.values(value).forEach(visit); }
  };
  visit(ledger); visit(sampled); visit(rationalAt(rule(), 2));
  assert.throws(() => { ledger.exclusions[0].kind = 'pole'; }, TypeError);
  assert.throws(() => { sampled.segments[0].push({x:0, y:9}); }, TypeError);
});
