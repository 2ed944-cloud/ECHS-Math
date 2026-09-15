/**
 * Original synthetic observations and two fixed candidate functions, never a fit.
 * Residual means observed minus predicted. SSE/RMSE compare these five records;
 * the smaller statistic does not identify a true global generating mechanism.
 */
export const AP_MODEL_SELECTION_VERSION = 'echs.ap-precalculus.model-selection.v1';
export const AP_MODEL_SELECTION_LIMITS = Object.freeze({deltaMin:-4,deltaMax:4,deltaStep:0.5,sampleIntervals:80});
const invalid = () => new RangeError('Invalid AP model selection input.');
const clean = value => value === 0 ? 0 : value;
const freeze = value => {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
};
function capture(value) {
  try {
    if (value === null || typeof value !== 'object' || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) throw invalid();
    const keys = ['delta','candidate'], descriptors = Object.getOwnPropertyDescriptors(value), names = Reflect.ownKeys(descriptors);
    if (names.length !== keys.length || names.some(key => typeof key !== 'string' || !keys.includes(key))) throw invalid();
    const result = {};
    for (const key of keys) {
      const d = descriptors[key];
      if (!d || !Object.hasOwn(d,'value') || !d.enumerable || typeof d.value !== 'number' || !Number.isFinite(d.value)) throw invalid();
      result[key] = clean(d.value);
    }
    return result;
  } catch { throw invalid(); }
}
const differences = values => values.slice(1).map((value,i)=>clean(value-values[i]));

export function modelSelection(value) {
  const input = capture(value), {delta,candidate} = input;
  if (delta < -4 || delta > 4 || !Number.isInteger(delta*2) || !Number.isInteger(candidate) || candidate < 0 || candidate > 1) throw invalid();
  const observations = [1,2,5+delta,10,17].map((y,x)=>({x,y}));
  const definitions = [
    {id:'linear',formula:'L(x)=4x-1',coefficients:[4,-1],at:x=>4*x-1},
    {id:'quadratic',formula:'Q(x)=x²+1',coefficients:[1,0,1],at:x=>x*x+1},
  ];
  const candidates = definitions.map(({id,formula,coefficients,at})=>{
    const rows = observations.map(({x,y:observed})=>{
      const predicted = clean(at(x)), residual = clean(observed-predicted);
      return {x,observed,predicted,residual,squaredResidual:residual*residual};
    });
    const sse = rows.reduce((sum,p)=>sum+p.squaredResidual,0);
    return {id,formula,coefficients,fitted:false,rows,sse,rmse:Math.sqrt(sse/rows.length),
      points:Array.from({length:81},(_,i)=>{const x=i/20;return {x,y:clean(at(x))};})};
  });
  const firstDifferences = differences(observations.map(p=>p.y));
  const difference = candidates[0].sse-candidates[1].sse;
  return freeze({version:AP_MODEL_SELECTION_VERSION,family:'selection',input,
    dataSource:'original-synthetic-observations',domain:[0,4],domainMeaning:'observed-input-interval',
    candidateAlgebraicDomain:'all-real',observations,firstDifferences,
    secondDifferences:differences(firstDifferences),candidates,selected:candidates[candidate],
    ranking:{best:difference===0?'tie':difference<0?'linear':'quadratic',metric:'sse'},
  });
}
