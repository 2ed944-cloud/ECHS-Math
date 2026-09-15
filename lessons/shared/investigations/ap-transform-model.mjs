/**
 * Original AP 1.12 teaching family: f(u)=u²+u, -2<=u<=3,
 * g(x)=a*f(b*(x-h))+k. Sets are analytic; graphs are finite samples.
 * b never vanishes. a=0 is a constant collapse on the original mapped domain,
 * not an invertible dilation. Numbers are unrounded IEEE-754 values.
 */
export const AP_TRANSFORM_MODEL_VERSION = 'echs.ap-precalculus.transform-model.v1';
export const AP_TRANSFORM_LIMITS = Object.freeze({
  aMin:-3, aMax:3, horizontalMagnitudeMin:0.5, horizontalMagnitudeMax:2,
  shiftMin:-4, shiftMax:4, uMin:-2, uMax:3, step:0.5, sampleIntervals:100,
});
const invalid = () => new RangeError('Invalid AP transformation model input.');
const clean = value => value === 0 ? 0 : value;
const freeze = value => {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
};
function capture(value) {
  try {
    if (value === null || typeof value !== 'object' || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) throw invalid();
    const keys = ['a','horizontalMagnitude','reverseInput','h','k','u'];
    const descriptors = Object.getOwnPropertyDescriptors(value), names = Reflect.ownKeys(descriptors);
    if (names.length !== keys.length || names.some(key => typeof key !== 'string' || !keys.includes(key))) throw invalid();
    const result = {};
    for (const key of keys) {
      const d = descriptors[key];
      if (!d || !Object.hasOwn(d, 'value') || !d.enumerable || typeof d.value !== 'number' || !Number.isFinite(d.value)) throw invalid();
      result[key] = clean(d.value);
    }
    return result;
  } catch { throw invalid(); }
}
function grid(value, min, max, step) {
  if (value < min || value > max || !Number.isInteger(value / step)) throw invalid();
}

export function transformationModel(value) {
  const input = capture(value), {a,horizontalMagnitude,reverseInput,h,k,u} = input;
  grid(a,-3,3,0.5); grid(horizontalMagnitude,0.5,2,0.5); grid(reverseInput,0,1,1);
  grid(h,-4,4,0.5); grid(k,-4,4,0.5); grid(u,-2,3,0.5);
  const b = (reverseInput === 1 ? -1 : 1) * horizontalMagnitude;
  const row = u => ({u:clean(u), parentY:clean(u*u+u), x:clean(h+u/b), imageY:clean(a*(u*u+u)+k)});
  const mapped = Array.from({length:101}, (_,i) => row(-2+i/20));
  const endpoints = [row(-2),row(3)], selected = row(u);
  const imageDomain = endpoints.map(p=>p.x).sort((x,y)=>x-y);
  const imageRange = [clean(a*(-0.25)+k),clean(a*12+k)].sort((x,y)=>x-y);
  return freeze({version:AP_TRANSFORM_MODEL_VERSION, family:'transform', input, b,
    collapsed:a === 0, inputOrderReversed:b < 0,
    parent:{formula:'f(u)=u²+u', domain:[-2,3], range:[-0.25,12], domainClosed:true,
      points:mapped.map(p=>({x:p.u,y:p.parentY}))},
    image:{formula:'g(x)=a*f(b*(x-h))+k', domain:imageDomain, range:imageRange, domainClosed:true,
      points:mapped.map(p=>({x:p.x,y:p.imageY})).sort((p,q)=>p.x-q.x)},
    selected:{preimage:{x:u,y:selected.parentY},image:{x:selected.x,y:selected.imageY}},
    table:[-2,-1,-0.5,0,1,2,3].map(row),
    endpointImages:endpoints.map(p=>({u:p.u,x:p.x,y:p.imageY})),
  });
}
