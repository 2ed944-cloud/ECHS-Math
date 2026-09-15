import assert from 'node:assert/strict';
import test from 'node:test';
import {resolve, dirname} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const option = process.argv.indexOf('--repo');
const repo = resolve(option < 0 ? resolve(dirname(fileURLToPath(import.meta.url)), '../..') : process.argv[option + 1]);
const {quotientRemainder, quotientAt, sampleQuotient, binomialRow, AP_EQUIVALENCE_MODEL_VERSION, AP_EQUIVALENCE_LIMITS} =
  await import(pathToFileURL(resolve(repo, 'lessons/shared/investigations/ap-equivalence-model.mjs')));
const q = (a = 1, b = 1, c = 2, r = 1) => ({a, b, c, r});
const bin = (a = 1, b = 1, n = 3) => ({a, b, n});
const grid = (start = -1, step = 1, count = 4) => ({start, step, count});
const near = (actual, expected) => assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) <= 3e-12 * Math.max(1, Math.abs(expected)), `${actual} != ${expected}`);
const bad = action => assert.throws(action, error => error instanceof RangeError && error.message === 'Invalid AP equivalence model input.');
const numeric = action => assert.throws(action, error => error instanceof RangeError && error.message === 'AP equivalence result is outside the finite numeric range.');
const clean = number => number === 0 ? 0 : number;
// Independent ascending-power integer convolution: no model coefficient formula.
function multiply(left, right) {
  const output = Array(left.length + right.length - 1).fill(0n);
  left.forEach((a, i) => right.forEach((b, j) => { output[i + j] += a * b; }));
  return output;
}
function power(base, exponent) {
  let value = [1n];
  for (let i = 0; i < exponent; i++) value = multiply(value, base);
  return value;
}
const evaluate = (descending, x) => descending.reduce((value, coefficient) => value * x + coefficient, 0);
const actualDegree = descending => {
  for (let i = 0; i < descending.length; i++) if (descending[i] !== 0) return descending.length - 1 - i;
  return null;
};

test('01 quotient/remainder representation exposes the original domain and full coefficients', () => {
  const model = quotientRemainder(q(2, -3, 1, 4));
  assert.equal(model.version, AP_EQUIVALENCE_MODEL_VERSION);
  assert.equal(model.family, 'linear-quotient-over-linear');
  assert.deepEqual(model.numerator, {coefficients:[2, -5, 7], degree:2, zeroPolynomial:false});
  assert.deepEqual(model.denominator, {coefficients:[1, -1], degree:1, zeroPolynomial:false});
  assert.deepEqual(model.quotient, {coefficients:[2, -3], degree:1, zeroPolynomial:false});
  assert.equal(model.remainder, 4);
  assert.deepEqual(model.remainderTerm, {numerator:4, denominatorCoefficients:[1, -1]});
  assert.deepEqual(model.domain, {excluded:[1]});
  assert.deepEqual(model.trend, {coefficients:[2, -3], coincidesOnDomain:false, differenceLimit:0});
  assert.equal(model.zeroEverywhereOnDomain, false);
  assert.ok(Object.isFrozen(AP_EQUIVALENCE_LIMITS));
});

test('02 all 6561 half-step coefficient combinations satisfy independent division identities', () => {
  let cases = 0, evaluations = 0;
  for (let ai = -4; ai <= 4; ai++) for (let bi = -4; bi <= 4; bi++)
  for (let ci = -4; ci <= 4; ci++) for (let ri = -4; ri <= 4; ri++) {
    const input = q(ai / 2, bi / 2, ci / 2, ri / 2), model = quotientRemainder(input);
    const integer = multiply([BigInt(bi), BigInt(ai)], [-BigInt(ci), 2n]);
    integer[0] += BigInt(ri) * 2n;
    const expected = integer.reverse().map(value => Number(value) / 4);
    assert.deepEqual(model.numerator.coefficients, expected);
    assert.equal(model.numerator.degree, actualDegree(expected));
    assert.equal(model.numerator.zeroPolynomial, expected.every(value => value === 0));
    for (const x of [-25, -3, -.25, 0, .25, 3, 25]) {
      const row = quotientAt(input, x);
      if (x === input.c) { assert.equal(row.y, null); continue; }
      const numeratorY = evaluate(expected, x), denominatorY = x - input.c;
      near(row.y, numeratorY / denominatorY);
      near(denominatorY * row.quotientY + input.r, numeratorY);
      near(row.remainderY * denominatorY, input.r);
      assert.equal(row.kind, 'defined');
      evaluations++;
    }
    cases++;
  }
  assert.equal(cases, 6561); assert.equal(evaluations, 45198);
});

test('03 zero remainder keeps holes, including zero-height and identically zero trends', () => {
  for (const input of [q(1, 1, 2, 0), q(2, -2, 1, 0), q(0, 3, -2, 0), q(0, 0, 0, 0)]) {
    const model = quotientRemainder(input), value = input.a * input.c + input.b;
    assert.deepEqual(model.exclusion, {x:input.c, kind:'hole', y:value,
      leftLimit:{kind:'finite', value}, rightLimit:{kind:'finite', value}});
    assert.deepEqual(quotientAt(input, input.c), {x:input.c, kind:'hole', y:null, quotientY:value, remainderY:null});
    assert.equal(model.trend.coincidesOnDomain, true);
    for (const x of [-25, -.125, 25]) if (x !== input.c) {
      const row = quotientAt(input, x);
      assert.equal(row.y, input.a * x + input.b); assert.equal(row.remainderY, 0);
    }
  }
});

test('04 actual polynomial degrees cover linear, constant and zero degeneracies', () => {
  const cases = [
    [q(1, 0, 0, 0), 2, 1, false],
    [q(0, 2, 3, 0), 1, 0, false],
    [q(0, 0, 3, 2), 0, null, false],
    [q(0, 0, -4, 0), null, null, true],
  ];
  for (const [input, numeratorDegree, quotientDegree, zero] of cases) {
    const model = quotientRemainder(input);
    assert.equal(model.numerator.degree, numeratorDegree);
    assert.equal(model.quotient.degree, quotientDegree);
    assert.equal(model.zeroEverywhereOnDomain, zero);
    assert.equal(model.numerator.zeroPolynomial, numeratorDegree === null);
    assert.equal(model.quotient.zeroPolynomial, quotientDegree === null);
    assert.equal(model.numerator.coefficients.length, 3); assert.equal(model.quotient.coefficients.length, 2);
    assert.deepEqual(model.trend.coefficients, [input.a, input.b]);
  }
});

test('05 every nonzero remainder has the correct signed one-sided pole limits', () => {
  for (const r of [-4, -.25, -Number.MIN_VALUE, Number.MIN_VALUE, .25, 4]) {
    const input = q(0, 0, 0, r), at = quotientRemainder(input).exclusion;
    assert.equal(at.kind, 'pole'); assert.equal(at.y, null);
    assert.deepEqual(at.leftLimit, {kind:r > 0 ? 'negative-infinity' : 'positive-infinity', value:null});
    assert.deepEqual(at.rightLimit, {kind:r > 0 ? 'positive-infinity' : 'negative-infinity', value:null});
    assert.equal(quotientAt(input, 0).kind, 'pole');
    for (const x of [-1, 1]) assert.equal(Math.sign(quotientAt(input, x).y), Math.sign(r) * Math.sign(x));
  }
});

test('06 exact and adjacent exclusions stay distinct without epsilon cancellation', () => {
  const c = 1, input = q(0, 2, c, 0);
  assert.equal(quotientAt(input, c).kind, 'hole');
  assert.deepEqual(quotientAt(input, 1 + Number.EPSILON), {x:1 + Number.EPSILON, kind:'defined', y:2, quotientY:2, remainderY:0});
  const tiny = q(0, 0, 0, Number.MIN_VALUE);
  assert.equal(quotientAt(tiny, Number.MIN_VALUE).y, 1);
  assert.equal(quotientAt(tiny, 0).kind, 'pole');
  const nearHole = quotientAt(q(1, 0, 0, 0), Number.MIN_VALUE);
  assert.equal(nearHole.kind, 'defined'); assert.equal(nearHole.y, Number.MIN_VALUE);
});

test('07 sampled and unsampled exclusions split paths even when cancellation gives zero', () => {
  for (const r of [0, 1, -1]) {
    const sample = sampleQuotient(q(1, 1, .25, r), grid(-1, .5, 6));
    assert.equal(sample.rows.length, 7);
    assert.deepEqual(sample.segments.map(segment => segment.map(row => row.x)), [[-1, -.5, 0], [.5, 1, 1.5, 2]]);
    for (const row of sample.rows) assert.deepEqual(row, quotientAt(q(1, 1, .25, r), row.x));
    const atPoint = sampleQuotient(q(1, 1, 0, r), grid(-1, 1, 2));
    assert.deepEqual(atPoint.segments.map(segment => segment.map(row => row.x)), [[-1], [1]]);
    assert.equal(atPoint.rows[1].kind, r === 0 ? 'hole' : 'pole'); assert.equal(atPoint.rows[1].y, null);
  }
  assert.deepEqual(sampleQuotient(q(0, 0, .25, 0), grid(0, .5, 1)).segments, [[{x:0, y:0}], [{x:.5, y:0}]]);
  for (const c of [-1, 1]) assert.equal(sampleQuotient(q(0, 1, c, 0), grid(-1, 1, 2)).segments.length, 1);
});

test('08 numeric guards preserve representable tiny values and reject overflow or underflow', () => {
  const tiny = Number.MIN_VALUE;
  assert.equal(quotientRemainder(q(tiny, 0, 1, 0)).exclusion.y, tiny);
  assert.equal(quotientAt(q(0, 0, 0, tiny), 1).y, tiny);
  numeric(() => quotientRemainder(q(tiny, 0, .5, 0)));
  numeric(() => quotientRemainder(q(0, tiny, .5, 0)));
  numeric(() => quotientAt(q(tiny, 0, 0, 0), .5));
  numeric(() => quotientAt(q(0, 0, 0, tiny), 25));
  numeric(() => quotientAt(q(0, 0, 0, 4), tiny));
  numeric(() => sampleQuotient(q(tiny, 0, 0, 0), grid(.5, .5, 1)));
  assert.equal(quotientAt(q(1, -1, 0, 0), 1).y, 0, 'genuine addition cancellation is allowed');
});

test('09 all 8712 allowed binomials match independent BigInt repeated convolution', () => {
  let cases = 0, terms = 0;
  for (let ai = -16; ai <= 16; ai++) for (let bi = -16; bi <= 16; bi++) for (let n = 1; n <= 8; n++) {
    const input = bin(ai / 4, bi / 4, n), model = binomialRow(input);
    const integers = power([BigInt(bi), BigInt(ai)], n).reverse();
    const expected = integers.map(value => Number(value) / (4 ** n));
    assert.deepEqual(model.coefficients, expected);
    assert.deepEqual(model.choose, power([1n, 1n], n).map(Number));
    assert.equal(model.degree, actualDegree(expected)); assert.equal(model.zeroPolynomial, expected.every(value => value === 0));
    assert.equal(model.terms.length, n + 1);
    for (let k = 0; k <= n; k++) {
      assert.deepEqual(model.terms[k], {k, choose:model.choose[k], aPower:n - k, bPower:k, xPower:n - k, coefficient:expected[k]});
      terms++;
    }
    cases++;
  }
  assert.equal(cases, 8712); assert.equal(terms, 47916);
});

test('10 expanded binomials and factored expressions agree at independent half-step coordinates', () => {
  let checked = 0;
  for (const a of [-4, -1.25, 0, .25, 4]) for (const b of [-4, -.25, 0, 1.75, 4]) for (let n = 1; n <= 8; n++) {
    const model = binomialRow(bin(a, b, n));
    for (const x of [-3.5, -1, 0, .5, 2.5]) {
      assert.equal(clean(evaluate(model.coefficients, x)), clean((a * x + b) ** n));
      checked++;
    }
  }
  assert.equal(checked, 1000);
});

test('11 complete zero/constant/pure-power binomial rows retain the requested power structure', () => {
  for (let n = 1; n <= 8; n++) {
    const zero = binomialRow(bin(0, 0, n));
    assert.equal(zero.degree, null); assert.equal(zero.zeroPolynomial, true); assert.deepEqual(zero.coefficients, Array(n + 1).fill(0));
    const constant = binomialRow(bin(0, -2, n));
    assert.equal(constant.degree, 0); assert.equal(constant.coefficients.at(-1), (-2) ** n);
    assert.deepEqual(constant.coefficients.slice(0, -1), Array(n).fill(0));
    const monomial = binomialRow(bin(-2, 0, n));
    assert.equal(monomial.degree, n); assert.equal(monomial.coefficients[0], (-2) ** n);
    assert.deepEqual(monomial.coefficients.slice(1), Array(n).fill(0));
  }
  const row = binomialRow(bin(1, 1, 8));
  assert.equal(row.family, 'binomial'); assert.equal(row.version, AP_EQUIVALENCE_MODEL_VERSION);
  assert.deepEqual(row.choose, [1, 8, 28, 56, 70, 56, 28, 8, 1]);
});

test('12 finite primitive coefficients and strict binomial quarter steps reject malformed numbers', () => {
  for (const value of [NaN, Infinity, -Infinity, 4.001, -4.001, '1', true, null, undefined, 1n, new Number(1)]) {
    for (const key of ['a', 'b', 'c', 'r']) bad(() => quotientRemainder({...q(), [key]:value}));
    for (const key of ['a', 'b']) bad(() => binomialRow({...bin(), [key]:value}));
  }
  for (const value of [.1, -.1, .25000000000000006, Number.MIN_VALUE]) bad(() => binomialRow(bin(value)));
  assert.equal(quotientRemainder(q(.1, .2, .3, .4)).input.a, .1, 'quarter restriction belongs only to binomials');
  for (const n of [0, -1, 9, 1.5, NaN, Infinity, '2', true, 2n, new Number(2)]) bad(() => binomialRow(bin(1, 1, n)));
});

test('13 sampler and evaluator bounds are closed, bounded and independent of input validation', () => {
  for (const x of [NaN, Infinity, -Infinity, 25.001, -25.001, '1', null, true, new Number(1)]) bad(() => quotientAt(q(), x));
  for (const options of [null, {}, {start:0, step:1}, {...grid(), extra:0}, grid(25, 1, 1), grid(-25, 0, 1),
    grid(0, -1, 1), grid(0, .00001, 1), grid(0, 5.1, 1), grid(0, 1, 0), grid(0, .1, 129), grid(0, 1, 1.5)]) {
    bad(() => sampleQuotient(q(), options));
  }
  assert.equal(sampleQuotient(q(), grid(-25, 5, 10)).rows.at(-1).x, 25);
  assert.equal(sampleQuotient(q(), grid(0, .0001, 128)).rows.length, 129);
  assert.equal(quotientAt(q(0, 0, 0, 4), .0001).y, 40000, 'plot data is not silently viewport-clamped');
});

test('14 every record boundary rejects foreign/accessor data without invoking getters', () => {
  let calls = 0;
  const getter = () => { calls++; throw Error('PRIVATE INPUT MARKER'); };
  const entrances = [
    [q(), value => quotientRemainder(value)], [q(), value => quotientAt(value, 1)],
    [q(), value => sampleQuotient(value, grid())], [grid(), value => sampleQuotient(q(), value)],
    [bin(), value => binomialRow(value)],
  ];
  for (const [base, invoke] of entrances) {
    const key = Object.keys(base)[0];
    const accessor = {...base}; Object.defineProperty(accessor, key, {get:getter, enumerable:true});
    const hidden = {...base}; Object.defineProperty(hidden, key, {value:base[key], enumerable:false});
    const missing = {...base}; delete missing[key];
    for (const value of [null, undefined, [], new Date(), Object.create(base), missing, {...base, extra:1},
      {...base, [Symbol('extra')]:1}, accessor, hidden]) bad(() => invoke(value));
    invoke(Object.assign(Object.create(null), base));
  }
  assert.equal(calls, 0);
});

test('15 hostile reflection errors are sanitized consistently across the public APIs', () => {
  let calls = 0;
  const hostile = () => { calls++; throw Error('PRIVATE PROXY MARKER'); };
  for (const handler of [{getPrototypeOf:hostile}, {ownKeys:hostile}, {getOwnPropertyDescriptor:hostile}]) {
    const value = new Proxy(q(), handler);
    bad(() => quotientRemainder(value)); bad(() => quotientAt(value, 1)); bad(() => sampleQuotient(value, grid()));
    bad(() => binomialRow(new Proxy(bin(), handler)));
    bad(() => sampleQuotient(q(), new Proxy(grid(), handler)));
  }
  const {proxy, revoke} = Proxy.revocable(q(), {}); revoke(); bad(() => quotientRemainder(proxy));
  assert.equal(calls, 15);
});

test('16 all nested output data is captured, frozen and free of negative zero', () => {
  const input = q(-0, -0, -0, -0), options = grid(-0, 1, 2), binomial = bin(-0, -0, 8);
  const values = [quotientRemainder(input), quotientAt(input, -0), sampleQuotient(input, options), binomialRow(binomial),
    quotientRemainder(q(2, -3, 1, -2)), binomialRow(bin(-.25, 2, 7))];
  input.a = 4; options.step = 5; binomial.b = 4;
  assert.equal(values[0].input.a, 0); assert.equal(values[2].sampling.step, 1); assert.equal(values[3].input.b, 0);
  const visit = value => {
    if (value && typeof value === 'object') { assert.ok(Object.isFrozen(value)); Object.values(value).forEach(visit); }
    if (typeof value === 'number') { assert.ok(Number.isFinite(value)); assert.equal(Object.is(value, -0), false); }
  };
  values.forEach(visit);
  assert.throws(() => { values[0].domain.excluded.push(1); }, TypeError);
  assert.throws(() => { values[2].segments[0][0].y = 9; }, TypeError);
  assert.throws(() => { values[3].terms[0].coefficient = 9; }, TypeError);
});
