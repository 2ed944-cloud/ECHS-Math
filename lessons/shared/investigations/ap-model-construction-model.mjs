/**
 * Original idealized open-box model from an 18cm by 10cm sheet.
 * Physical t is in (0,5); the control's quarter-step values are a proper subset.
 * Boundary zero volumes are nonusable limits, not physical boxes. The reported
 * maximum is among 19 displayed samples only, never a global optimum claim.
 */
export const AP_MODEL_CONSTRUCTION_VERSION = 'echs.ap-precalculus.model-construction.v1';
export const AP_MODEL_CONSTRUCTION_LIMITS = Object.freeze({tMin:0.25,tMax:4.75,tStep:0.25,sampleIntervals:100});
const invalid = () => new RangeError('Invalid AP model construction input.');
const clean = value => value === 0 ? 0 : value;
const freeze = value => {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
};
function capture(value) {
  try {
    if (value === null || typeof value !== 'object' || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) throw invalid();
    const descriptors = Object.getOwnPropertyDescriptors(value), names = Reflect.ownKeys(descriptors);
    if (names.length !== 1 || names[0] !== 't') throw invalid();
    const d = descriptors.t;
    if (!Object.hasOwn(d,'value') || !d.enumerable || typeof d.value !== 'number' || !Number.isFinite(d.value)) throw invalid();
    return {t:clean(d.value)};
  } catch { throw invalid(); }
}
const dimensionsAt = t => ({length:clean(18-2*t),width:clean(10-2*t),height:t});
const volumeAt = t => t*(18-2*t)*(10-2*t);

export function openBoxModel(value) {
  const input = capture(value), {t} = input;
  if (t < 0.25 || t > 4.75 || !Number.isInteger(t*4)) throw invalid();
  const table = Array.from({length:19},(_,i)=>{const t=(i+1)/4;return {t,...dimensionsAt(t),volume:volumeAt(t)};});
  const best = table.reduce((best,row)=>row.volume>best.volume?row:best);
  return freeze({version:AP_MODEL_CONSTRUCTION_VERSION,family:'construction',input,
    context:'original-synthetic-ideal-sheet',sheet:{length:18,width:10},
    dimensions:dimensionsAt(t),volume:volumeAt(t),formula:'V(t)=t(18-2t)(10-2t)',
    coefficients:[4,-56,180,0],coefficientOrder:'descending',
    contextDomain:{min:0,max:5,minIncluded:false,maxIncluded:false},algebraicDomain:'all-real',
    units:{cutSize:'cm',length:'cm',width:'cm',height:'cm',volume:'cm³',rate:'cm³ per cm'},
    points:Array.from({length:99},(_,i)=>{const x=(i+1)/20;return {x,y:volumeAt(x)};}),
    boundaryPoints:[0,5].map(t=>({t,volume:0,usable:false,kind:'domain-boundary-limit'})),
    table,adjacentRates:table.slice(1).map((row,i)=>({from:table[i].t,to:row.t,
      change:clean(row.volume-table[i].volume),rate:clean((row.volume-table[i].volume)/(row.t-table[i].t))})),
    sampleMaximum:{t:best.t,volume:best.volume,scope:'quarter-step-samples-only'},
  });
}
