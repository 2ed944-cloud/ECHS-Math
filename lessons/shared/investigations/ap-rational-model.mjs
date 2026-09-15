/**
 * Declared real-linear-factor families for AP Precalculus 1.7–1.10.
 * factorLedger({scale,numerator,denominator}) uses factor arrays {root,multiplicity}.
 * rationalAt(input,x) returns {x,kind:'defined'|'hole'|'pole',y:number|null}.
 * sampleRational(input,{start,step,count}) returns count+1 rows and graph segments;
 * every original denominator exclusion splits segments, even between sample points.
 * Factor comparisons/cancellation are exact numeric equality, with no root solver.
 * Null interval endpoints mean infinity; infinities never appear as plot numbers.
 * Features follow the declared algebra, not an inference from finite samples.
 * Arithmetic is IEEE-754. Unrepresentable nonzero numeric results throw RangeError.
 */
export const AP_RATIONAL_MODEL_VERSION = 'echs.ap-precalculus.rational-model.v1';
export const AP_RATIONAL_LIMITS = Object.freeze({
  factorsPerList: 3, degreePerList: 6, root: 4, coordinate: 25,
  minimumScale: 0.25, maximumScale: 4, samples: 128,
  minimumStep: 0.0001, maximumStep: 5,
});
const invalid = () => new RangeError('Invalid AP rational model input.');
const numericRange = () => new RangeError('AP rational result is outside the finite numeric range.');
const clean = number => number === 0 ? 0 : number;
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
function factors(value) {
  try {
    if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) throw invalid();
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const length = descriptors.length.value;
    if (!Number.isInteger(length) || length < 0 || length > AP_RATIONAL_LIMITS.factorsPerList ||
        Reflect.ownKeys(descriptors).length !== length + 1) throw invalid();
    const result = [];
    let degree = 0;
    for (let i = 0; i < length; i++) {
      const descriptor = descriptors[String(i)];
      if (!descriptor || !Object.hasOwn(descriptor, 'value') || !descriptor.enumerable) throw invalid();
      const row = closed(descriptor.value, ['root', 'multiplicity']);
      const root = number(row.root, -AP_RATIONAL_LIMITS.root, AP_RATIONAL_LIMITS.root);
      const multiplicity = number(row.multiplicity, 1, AP_RATIONAL_LIMITS.degreePerList, true);
      degree += multiplicity;
      result.push({root, multiplicity});
    }
    if (degree > AP_RATIONAL_LIMITS.degreePerList) throw invalid();
    return result;
  } catch { throw invalid(); }
}
function prepare(value) {
  const captured = closed(value, ['scale', 'numerator', 'denominator']);
  const scale = number(captured.scale, -AP_RATIONAL_LIMITS.maximumScale, AP_RATIONAL_LIMITS.maximumScale);
  if (scale !== 0 && Math.abs(scale) < AP_RATIONAL_LIMITS.minimumScale) throw invalid();
  const numerator = factors(captured.numerator), denominator = factors(captured.denominator);
  const byRoot = new Map();
  for (const [side, rows] of [['numerator', numerator], ['denominator', denominator]]) {
    for (const {root, multiplicity} of rows) {
      if (!byRoot.has(root)) byRoot.set(root, {x:root, numeratorMultiplicity:0, denominatorMultiplicity:0});
      byRoot.get(root)[side + 'Multiplicity'] += multiplicity;
    }
  }
  const roots = [...byRoot.values()].sort((a, b) => a.x - b.x).map(row => {
    const cancelledMultiplicity = Math.min(row.numeratorMultiplicity, row.denominatorMultiplicity);
    return {...row, cancelledMultiplicity,
      remainingNumeratorMultiplicity:row.numeratorMultiplicity - cancelledMultiplicity,
      remainingDenominatorMultiplicity:row.denominatorMultiplicity - cancelledMultiplicity};
  });
  return {input:{scale, numerator, denominator}, roots};
}
function reducedAt(model, x) {
  const scale = model.input.scale;
  if (scale === 0) return 0;
  if (model.roots.some(row => row.remainingNumeratorMultiplicity > 0 && x === row.x)) return 0;
  let numerator = scale, denominator = 1;
  for (const row of model.roots) {
    numerator *= (x - row.x) ** row.remainingNumeratorMultiplicity;
    denominator *= (x - row.x) ** row.remainingDenominatorMultiplicity;
  }
  const result = numerator / denominator;
  // A zero without an exact numerator root would be floating-point underflow.
  if (!Number.isFinite(result) || result === 0) throw numericRange();
  return clean(result);
}
function limits(kind, value = null) { return {kind, value}; }
const infinite = sign => limits(sign > 0 ? 'positive-infinity' : 'negative-infinity');

export function factorLedger(value) {
  const model = prepare(value), {input, roots} = model;
  const scale = input.scale;
  const signs = Array(roots.length + 1);
  signs[roots.length] = Math.sign(scale);
  for (let i = roots.length - 1; i >= 0; i--) {
    const net = roots[i].remainingNumeratorMultiplicity - roots[i].remainingDenominatorMultiplicity;
    signs[i] = signs[i + 1] * (Math.abs(net) % 2 ? -1 : 1);
  }
  const signIntervals = signs.map((sign, i) => ({
    left:i === 0 ? null : roots[i - 1].x, right:i === roots.length ? null : roots[i].x, sign:clean(sign),
  }));
  const exclusions = roots.flatMap((row, i) => {
    if (row.denominatorMultiplicity === 0) return [];
    const pole = scale !== 0 && row.remainingDenominatorMultiplicity > 0;
    const y = pole ? null : reducedAt(model, row.x);
    return [{...row, kind:pole ? 'pole' : 'hole', y,
      leftLimit:pole ? infinite(signs[i]) : limits('finite', y),
      rightLimit:pole ? infinite(signs[i + 1]) : limits('finite', y)}];
  });
  const zeros = scale === 0 ? [] : roots.filter(row => row.denominatorMultiplicity === 0).map(row => ({
    x:row.x, multiplicity:row.numeratorMultiplicity, crosses:row.numeratorMultiplicity % 2 === 1,
  }));
  const degree = (rows, key) => rows.reduce((sum, row) => sum + row[key], 0);
  const originalDegrees = {numerator:degree(input.numerator, 'multiplicity'), denominator:degree(input.denominator, 'multiplicity')};
  const reducedDegrees = {numerator:degree(roots, 'remainingNumeratorMultiplicity'), denominator:degree(roots, 'remainingDenominatorMultiplicity')};
  const gap = reducedDegrees.numerator - reducedDegrees.denominator;
  const finiteTail = scale === 0 ? 0 : gap < 0 ? 0 : gap === 0 ? scale : null;
  const tails = {
    degreeDifference:scale === 0 ? null : gap,
    horizontalAsymptote:finiteTail,
    leadingTerm:scale === 0 ? null : {coefficient:scale, exponent:gap},
    left:finiteTail === null ? infinite(scale * (Math.abs(gap) % 2 ? -1 : 1)) : limits('finite', finiteTail),
    right:finiteTail === null ? infinite(scale) : limits('finite', finiteTail),
  };
  return freeze({version:AP_RATIONAL_MODEL_VERSION, family:'real-linear-factors', input,
    originalDegrees, reducedDegrees, zeroEverywhereOnDomain:scale === 0,
    factors:roots, exclusions, zeros, signIntervals, tails});
}

export function rationalAt(value, inputX) {
  const model = prepare(value);
  const x = number(inputX, -AP_RATIONAL_LIMITS.coordinate, AP_RATIONAL_LIMITS.coordinate);
  const excluded = model.roots.find(row => row.x === x && row.denominatorMultiplicity > 0);
  if (excluded) return freeze({x, kind:model.input.scale !== 0 && excluded.remainingDenominatorMultiplicity > 0 ? 'pole' : 'hole', y:null});
  return freeze({x, kind:'defined', y:reducedAt(model, x)});
}

export function sampleRational(value, options) {
  const model = prepare(value), captured = closed(options, ['start', 'step', 'count']);
  const start = number(captured.start, -AP_RATIONAL_LIMITS.coordinate, AP_RATIONAL_LIMITS.coordinate);
  const step = number(captured.step, AP_RATIONAL_LIMITS.minimumStep, AP_RATIONAL_LIMITS.maximumStep);
  const count = number(captured.count, 1, AP_RATIONAL_LIMITS.samples, true);
  number(start + step * count, -AP_RATIONAL_LIMITS.coordinate, AP_RATIONAL_LIMITS.coordinate);
  const exclusions = model.roots.filter(row => row.denominatorMultiplicity > 0);
  const rows = [], segments = [];
  let current = [];
  const finish = () => { if (current.length) segments.push(current); current = []; };
  for (let i = 0; i <= count; i++) {
    const x = clean(start + i * step);
    const excluded = exclusions.find(row => row.x === x);
    const kind = excluded ? model.input.scale !== 0 && excluded.remainingDenominatorMultiplicity > 0 ? 'pole' : 'hole' : 'defined';
    const y = excluded ? null : reducedAt(model, x);
    const row = {x, kind, y};
    if (i && exclusions.some(exclusion => exclusion.x > rows[i - 1].x && exclusion.x < x)) finish();
    rows.push(row);
    if (excluded) finish();
    else current.push({x, y});
  }
  finish();
  return freeze({input:model.input, sampling:{start, step, count}, rows, segments});
}
