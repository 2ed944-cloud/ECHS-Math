/**
 * Bounded AP Precalculus 1.11 quotient/remainder and binomial teaching families.
 * The original denominator exclusion survives a zero remainder. Degrees describe
 * actual coefficients; the zero polynomial has null degree. All outputs are
 * captured/frozen records. Decimal arithmetic is IEEE-754, not symbolic algebra.
 */
export const AP_EQUIVALENCE_MODEL_VERSION = 'echs.ap-precalculus.equivalence-model.v1';
export const AP_EQUIVALENCE_LIMITS = Object.freeze({
  coefficient:4, coordinate:25, exponent:8, samples:128,
  minimumStep:0.0001, maximumStep:5,
});
const invalid = () => new RangeError('Invalid AP equivalence model input.');
const numericRange = () => new RangeError('AP equivalence result is outside the finite numeric range.');
const clean = value => value === 0 ? 0 : value;
const freeze = value => {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
};
function closed(value, keys) {
  try {
    if (value === null || typeof value !== 'object' ||
        ![Object.prototype, null].includes(Object.getPrototypeOf(value))) throw invalid();
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const names = Reflect.ownKeys(descriptors);
    if (names.length !== keys.length || names.some(key => typeof key !== 'string' || !keys.includes(key))) throw invalid();
    const result = {};
    for (const key of keys) {
      const descriptor = descriptors[key];
      if (!descriptor || !Object.hasOwn(descriptor, 'value') || !descriptor.enumerable) throw invalid();
      result[key] = descriptor.value;
    }
    return result;
  } catch { throw invalid(); }
}
function number(value, low, high, integer = false) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < low || value > high ||
      (integer && !Number.isInteger(value))) throw invalid();
  return clean(value);
}
function finite(value) {
  if (!Number.isFinite(value)) throw numericRange();
  return clean(value);
}
function product(a, b) {
  const value = finite(a * b);
  if (a !== 0 && b !== 0 && value === 0) throw numericRange();
  return value;
}
function ratio(a, b) {
  const value = finite(a / b);
  if (a !== 0 && value === 0) throw numericRange();
  return value;
}
function polynomial(coefficients) {
  const first = coefficients.findIndex(value => value !== 0);
  return {coefficients, degree:first < 0 ? null : coefficients.length - first - 1, zeroPolynomial:first < 0};
}
function prepareQuotient(value) {
  const captured = closed(value, ['a', 'b', 'c', 'r']);
  const input = {};
  for (const key of ['a', 'b', 'c', 'r']) input[key] = number(captured[key], -AP_EQUIVALENCE_LIMITS.coefficient, AP_EQUIVALENCE_LIMITS.coefficient);
  const {a, b, c, r} = input;
  return {input, numerator:polynomial([a, finite(b - product(a, c)), finite(r - product(b, c))])};
}
function trendAt(input, x) { return finite(product(input.a, x) + input.b); }
function point(input, x) {
  const quotientY = trendAt(input, x);
  if (x === input.c) return {x, kind:input.r === 0 ? 'hole' : 'pole', y:null, quotientY, remainderY:null};
  const remainderY = ratio(input.r, finite(x - input.c));
  return {x, kind:'defined', y:finite(quotientY + remainderY), quotientY, remainderY};
}
const finiteLimit = value => ({kind:'finite', value});
const infiniteLimit = sign => ({kind:sign > 0 ? 'positive-infinity' : 'negative-infinity', value:null});

export function quotientRemainder(value) {
  const {input, numerator} = prepareQuotient(value), {a, b, c, r} = input;
  const hole = r === 0, y = hole ? trendAt(input, c) : null;
  return freeze({version:AP_EQUIVALENCE_MODEL_VERSION, family:'linear-quotient-over-linear', input, numerator,
    denominator:polynomial([1, clean(-c)]), quotient:polynomial([a, b]),
    remainder:r, remainderTerm:{numerator:r, denominatorCoefficients:[1, clean(-c)]},
    domain:{excluded:[c]}, exclusion:{x:c, kind:hole ? 'hole' : 'pole', y,
      leftLimit:hole ? finiteLimit(y) : infiniteLimit(-r),
      rightLimit:hole ? finiteLimit(y) : infiniteLimit(r)},
    zeroEverywhereOnDomain:a === 0 && b === 0 && r === 0,
    trend:{coefficients:[a, b], coincidesOnDomain:hole, differenceLimit:0}});
}

export function quotientAt(value, inputX) {
  const {input} = prepareQuotient(value);
  const x = number(inputX, -AP_EQUIVALENCE_LIMITS.coordinate, AP_EQUIVALENCE_LIMITS.coordinate);
  return freeze(point(input, x));
}

export function sampleQuotient(value, options) {
  const {input} = prepareQuotient(value), captured = closed(options, ['start', 'step', 'count']);
  const start = number(captured.start, -AP_EQUIVALENCE_LIMITS.coordinate, AP_EQUIVALENCE_LIMITS.coordinate);
  const step = number(captured.step, AP_EQUIVALENCE_LIMITS.minimumStep, AP_EQUIVALENCE_LIMITS.maximumStep);
  const count = number(captured.count, 1, AP_EQUIVALENCE_LIMITS.samples, true);
  number(start + step * count, -AP_EQUIVALENCE_LIMITS.coordinate, AP_EQUIVALENCE_LIMITS.coordinate);
  const rows = [], segments = [];
  let current = [];
  const finish = () => { if (current.length) segments.push(current); current = []; };
  for (let i = 0; i <= count; i++) {
    const row = point(input, clean(start + i * step));
    if (i && input.c > rows[i - 1].x && input.c < row.x) finish();
    rows.push(row);
    if (row.kind === 'defined') current.push({x:row.x, y:row.y});
    else finish();
  }
  finish();
  return freeze({input, sampling:{start, step, count}, rows, segments});
}

export function binomialRow(value) {
  const captured = closed(value, ['a', 'b', 'n']);
  const a = number(captured.a, -AP_EQUIVALENCE_LIMITS.coefficient, AP_EQUIVALENCE_LIMITS.coefficient);
  const b = number(captured.b, -AP_EQUIVALENCE_LIMITS.coefficient, AP_EQUIVALENCE_LIMITS.coefficient);
  const n = number(captured.n, 1, AP_EQUIVALENCE_LIMITS.exponent, true);
  if (!Number.isInteger(a * 4) || !Number.isInteger(b * 4)) throw invalid();
  const choose = [1], terms = [], coefficients = [];
  for (let k = 0; k <= n; k++) {
    if (k) choose.push(choose[k - 1] * (n - k + 1) / k);
    const coefficient = product(product(choose[k], a ** (n - k)), b ** k);
    terms.push({k, choose:choose[k], aPower:n - k, bPower:k, xPower:n - k, coefficient});
    coefficients.push(coefficient);
  }
  return freeze({version:AP_EQUIVALENCE_MODEL_VERSION, family:'binomial', input:{a, b, n}, choose, terms,
    ...polynomial(coefficients)});
}
