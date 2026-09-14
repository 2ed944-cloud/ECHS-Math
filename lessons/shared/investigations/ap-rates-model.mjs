/**
 * Pure AP 1.3 investigation model, version 1. No DOM, timers, storage or network.
 * The declared function is f(x)=a*x*x+b*x+c; all numbers are unrounded doubles.
 * sampleRates({a,b,c,start,step,count}) returns:
 *   input, model, rows:[{x,y}], intervals:[{left,right,width,change,rate,midpoint}],
 *   intervalRates, firstDifferences (output units), secondDifferences (output units),
 *   rateChanges (output/input), normalizedRateChanges (output/input^2),
 *   direction (whole modeled interval), concavity, turningPoint and identities.
 * count is the number of intervals, so rows.length=count+1. step is positive.
 * secant({a,b,c,left,right}) supports either endpoint order; equal endpoints fail.
 * motionAt({a,b,c,t}) returns directed position and local direction, NOT total travel.
 * Its turningTime is null if no turning point lies in the permitted input range.
 * Model-wide conclusions below use the stated polynomial, never finite data alone.
 */
export const AP_RATES_MODEL_VERSION = 'echs.ap-precalculus.rates-model.v1';
export const AP_RATES_LIMITS = Object.freeze({ coefficient: 100, input: 100, minimumStep: 0.0001, maximumStep: 20, minimumCount: 2, maximumCount: 8 });

const defaults = Object.freeze({ a: 0.5, b: 1, c: 0 });
const invalid = () => new RangeError('Invalid AP rates model input.');
function options(value, fallback) {
  if (value === undefined) value = {};
  try {
    if (value === null || typeof value !== 'object' || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) throw invalid();
    const descriptors = Object.getOwnPropertyDescriptors(value);
    if (Reflect.ownKeys(descriptors).some(key => typeof key !== 'string' || !Object.hasOwn(fallback, key))) throw invalid();
    const output = { ...fallback };
    for (const [key, descriptor] of Object.entries(descriptors)) {
      if (!Object.hasOwn(descriptor, 'value') || !descriptor.enumerable || typeof descriptor.value !== 'number' || !Number.isFinite(descriptor.value)) throw invalid();
      output[key] = descriptor.value === 0 ? 0 : descriptor.value;
    }
    for (const key of ['a', 'b', 'c']) if (Math.abs(output[key]) > AP_RATES_LIMITS.coefficient) throw invalid();
    return output;
  } catch { throw invalid(); }
}
function inputBound(value) { if (Math.abs(value) > AP_RATES_LIMITS.input) throw invalid(); }
function freeze(value) {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
const evaluate = (x, p) => (p.a * x + p.b) * x + p.c;
const direction = n => n > 0 ? 'increasing' : n < 0 ? 'decreasing' : 'stationary';
const concavity = a => a > 0 ? 'up' : a < 0 ? 'down' : 'neither';
const model = p => p.a !== 0 ? 'quadratic' : p.b !== 0 ? 'linear' : 'constant';
function interval(p, left, right, width = right - left) {
  const rate = p.a * (left + right) + p.b;
  return { left, right, width, change: width * rate, rate, midpoint: (left + right) / 2 };
}
export function secant(value) {
  const input = options(value, { ...defaults, left: 0, right: 1 });
  inputBound(input.left); inputBound(input.right);
  if (Math.abs(input.right - input.left) < AP_RATES_LIMITS.minimumStep) throw invalid();
  const result = interval(input, input.left, input.right);
  return freeze({ input, ...result, endpoints: [{ x: input.left, y: evaluate(input.left, input) }, { x: input.right, y: evaluate(input.right, input) }],
    netOutputChange: direction(result.change), slopeSign: direction(result.rate) });
}
export function motionAt(value) {
  const input = options(value, { ...defaults, t: 0 });
  inputBound(input.t);
  const turning = input.a === 0 ? null : input.b === 0 ? 0 : -input.b / (2 * input.a);
  return freeze({ input, position: evaluate(input.t, input), direction: direction(2 * input.a * input.t + input.b),
    turningTime: turning !== null && Math.abs(turning) <= AP_RATES_LIMITS.input ? turning : null, quantity: 'directed-position', units: 'm', timeUnits: 's' });
}
export function sampleRates(value) {
  const input = options(value, { ...defaults, start: 0, step: 1, count: 4 });
  const { a, b, start, step, count } = input;
  if (step < AP_RATES_LIMITS.minimumStep || step > AP_RATES_LIMITS.maximumStep || !Number.isInteger(count) || count < AP_RATES_LIMITS.minimumCount || count > AP_RATES_LIMITS.maximumCount) throw invalid();
  const end = start + step * count; inputBound(start); inputBound(end);
  const rows = Array.from({ length: count + 1 }, (_, i) => { const x = start + i * step; return { x, y: evaluate(x, input) }; });
  const intervals = Array.from({ length: count }, (_, i) => interval(input, rows[i].x, rows[i + 1].x, step));
  const vertex = a === 0 ? null : b === 0 ? 0 : -b / (2 * a);
  let wholeDirection;
  if (a === 0) wholeDirection = b === 0 ? 'constant' : direction(b);
  else if (vertex <= start) wholeDirection = a > 0 ? 'increasing' : 'decreasing';
  else if (vertex >= end) wholeDirection = a > 0 ? 'decreasing' : 'increasing';
  else wholeDirection = a > 0 ? 'decreasing-then-increasing' : 'increasing-then-decreasing';
  return freeze({ input, model: model(input), rows, intervals,
    intervalRates: intervals.map(row => row.rate), firstDifferences: intervals.map(row => row.change),
    secondDifferences: Array(count - 1).fill(2 * a * step * step),
    rateChanges: Array(count - 1).fill(2 * a * step), normalizedRateChanges: Array(count - 1).fill(2 * a),
    direction: wholeDirection, concavity: concavity(a),
    turningPoint: vertex !== null && vertex >= start && vertex <= end ? { x: vertex, y: evaluate(vertex, input) } : null,
    identities: { intervalRate: '2*a*x + a*step + b', secondDifference: '2*a*step^2', rateChange: '2*a*step', normalizedRateChange: '2*a' },
    assumption: 'The function is the declared polynomial. Finite samples alone do not establish its global rule.' });
}
