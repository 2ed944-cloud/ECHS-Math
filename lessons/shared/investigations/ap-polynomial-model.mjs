/**
 * Candidate AP 1.4–1.6 models. Pure, bounded, unrounded numeric records only.
 * Coefficients are in ascending order: [constant, x, x², ...].
 * cubicRates: a(x³−3kx), analytic rate/zero/inflection features and a closed domain.
 * zeroStructure: a(x−r)^m((x−u)²+v²), exact declared roots, no numeric root solver.
 * polynomialTails: ax^n+bx^(n−1)+c, with normalized coefficients for n=1.
 * samplePolynomial: count+1 equal-step rows, finite differences and interval rates.
 * Null interval bounds represent infinity only in feature/sign records, never plot points.
 * Conclusions use the declared formulas; finite samples alone do not prove a global rule.
 * Coordinates and arithmetic use IEEE-754 doubles, not symbolic/exact-number objects.
 */
export const AP_POLYNOMIAL_MODEL_VERSION = 'echs.ap-precalculus.polynomial-model.v1';
export const AP_POLYNOMIAL_LIMITS = Object.freeze({
  coordinate: 25, coefficient: 100000, degree: 6, samples: 128,
  minimumStep: 0.0001, maximumStep: 5, minimumScale: 0.25, maximumScale: 4,
  parameter: 4, tailCoefficient: 16, minimumWindow: 1, maximumWindow: 25,
});
const invalid = () => new RangeError('Invalid AP polynomial model input.');
const clean = n => n === 0 ? 0 : n;
const own = (value, key) => Object.hasOwn(value, key);
const bounds = (value, lo, hi) => { if (!Number.isFinite(value) || value < lo || value > hi) throw invalid(); };
const freeze = value => {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
};
function record(value, defaults, arrayKey = null) {
  try {
    if (value === undefined) value = {};
    if (value === null || typeof value !== 'object' || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) throw invalid();
    const descriptors = Object.getOwnPropertyDescriptors(value), output = { ...defaults };
    for (const key of Reflect.ownKeys(descriptors)) {
      if (typeof key !== 'string' || !own(defaults, key)) throw invalid();
      const d = descriptors[key];
      if (!own(d, 'value') || !d.enumerable) throw invalid();
      if (key === arrayKey) output[key] = coefficients(d.value);
      else {
        if (typeof d.value !== 'number' || !Number.isFinite(d.value)) throw invalid();
        output[key] = clean(d.value);
      }
    }
    return output;
  } catch { throw invalid(); }
}
function coefficients(value) {
  try {
    if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) throw invalid();
    const ds = Object.getOwnPropertyDescriptors(value), length = ds.length.value;
    if (!Number.isInteger(length) || length < 1 || length > AP_POLYNOMIAL_LIMITS.degree + 1 || Reflect.ownKeys(ds).length !== length + 1) throw invalid();
    const result = [];
    for (let i = 0; i < length; i++) {
      const d = ds[String(i)];
      if (!d || !own(d, 'value') || !d.enumerable || typeof d.value !== 'number') throw invalid();
      bounds(d.value, -AP_POLYNOMIAL_LIMITS.coefficient, AP_POLYNOMIAL_LIMITS.coefficient);
      result.push(clean(d.value));
    }
    return result;
  } catch { throw invalid(); }
}
function scale(a) { bounds(Math.abs(a), AP_POLYNOMIAL_LIMITS.minimumScale, AP_POLYNOMIAL_LIMITS.maximumScale); }
function coordinate(x) { bounds(x, -AP_POLYNOMIAL_LIMITS.coordinate, AP_POLYNOMIAL_LIMITS.coordinate); }
function polynomial(coeff) {
  const result = coeff.map(clean);
  while (result.length > 1 && result.at(-1) === 0) result.pop();
  const degree = result.length === 1 && result[0] === 0 ? null : result.length - 1;
  const leadingCoefficient = degree === null ? null : result.at(-1);
  const nonconstant = degree !== null && degree > 0;
  return {
    coefficients: result, degree, leadingCoefficient, zeroPolynomial: degree === null,
    tails: nonconstant ? {
      left: (leadingCoefficient > 0) === (degree % 2 === 0) ? 'positive-infinity' : 'negative-infinity',
      right: leadingCoefficient > 0 ? 'positive-infinity' : 'negative-infinity', finiteValue: null,
    } : { left: 'finite', right: 'finite', finiteValue: result[0] },
  };
}
const evaluate = (coeff, x) => clean(coeff.reduceRight((value, c) => value * x + c, 0));
function multiply(a, b) {
  const result = Array(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i++) for (let j = 0; j < b.length; j++) result[i+j] += a[i] * b[j];
  return result.map(clean);
}
function parityFromCoefficients(coeff) {
  const even = coeff.every((v, i) => i % 2 === 0 || v === 0);
  const odd = coeff.every((v, i) => i % 2 === 1 || v === 0);
  return even && odd ? 'both' : even ? 'even' : odd ? 'odd' : 'neither';
}
const behavior = sign => sign > 0 ? 'increasing' : 'decreasing';
const extremaKind = sign => sign > 0 ? 'minimum' : 'maximum';
const assumption = 'The formula is declared. Finite samples do not uniquely identify an arbitrary global function.';

export function cubicRates(value) {
  const input = record(value, { a:1, k:1, left:-4, right:4, from:-2, to:0.5 });
  const { a,k,left,right,from,to } = input;
  scale(a); bounds(k,-4,4); [left,right,from,to].forEach(coordinate);
  if (right-left < AP_POLYNOMIAL_LIMITS.minimumStep || Math.abs(to-from) < AP_POLYNOMIAL_LIMITS.minimumStep || from < left || from > right || to < left || to > right) throw invalid();
  const base = polynomial([0, -3*a*k, 0, a]), f = x => evaluate(base.coefficients,x);
  const turningPoints = k > 0 ? [
    { x:-Math.sqrt(k), y:clean(2*a*k*Math.sqrt(k)), kind:a>0?'maximum':'minimum' },
    { x:Math.sqrt(k), y:clean(-2*a*k*Math.sqrt(k)), kind:a>0?'minimum':'maximum' },
  ] : [];
  const zeroLedger = k > 0 ? [-Math.sqrt(3*k),0,Math.sqrt(3*k)].map(real=>({real:clean(real),imaginary:0,multiplicity:1}))
    : k === 0 ? [{real:0,imaginary:0,multiplicity:3}]
    : [{real:0,imaginary:0,multiplicity:1},{real:0,imaginary:-Math.sqrt(-3*k),multiplicity:1},{real:0,imaginary:Math.sqrt(-3*k),multiplicity:1}];
  const monotonicIntervals = k > 0 ? [
    { left:null, right:-Math.sqrt(k), behavior:behavior(a) },
    { left:-Math.sqrt(k), right:Math.sqrt(k), behavior:behavior(-a) },
    { left:Math.sqrt(k), right:null, behavior:behavior(a) },
  ] : [{left:null,right:null,behavior:behavior(a)}];
  const candidates = [{x:left,y:f(left),source:'left-endpoint'},
    ...turningPoints.filter(p=>p.x>left&&p.x<right).map(p=>({...p,source:'interior-turn'})),
    {x:right,y:f(right),source:'right-endpoint'}];
  // One-sided endpoint classification uses the exact local direction of this family.
  const rightDirectionAt = x => k>0 && x>=-Math.sqrt(k) && x<Math.sqrt(k) ? -a : a;
  const leftDirectionAt = x => k>0 && x>-Math.sqrt(k) && x<=Math.sqrt(k) ? -a : a;
  const localExtrema = [{x:left,y:f(left),kind:extremaKind(rightDirectionAt(left)),source:'left-endpoint'},
    ...turningPoints.filter(p=>p.x>left&&p.x<right).map(p=>({...p,source:'interior-turn'})),
    {x:right,y:f(right),kind:extremaKind(-leftDirectionAt(right)),source:'right-endpoint'}];
  const minimum = Math.min(...candidates.map(p=>p.y)), maximum = Math.max(...candidates.map(p=>p.y));
  const rate = clean(a*(from*from+from*to+to*to-3*k));
  return freeze({version:AP_POLYNOMIAL_MODEL_VERSION,family:'cubic-rates',input,...base,
    zeroLedger,turningPoints,inflection:{x:0,y:0,stationary:k===0},monotonicIntervals,
    concavityIntervals:[{left:null,right:0,concavity:a>0?'down':'up'},{left:0,right:null,concavity:a>0?'up':'down'}],
    restricted:{left,right,candidates,localExtrema,
      globalMinimum:{value:minimum,points:candidates.filter(p=>p.y===minimum).map(p=>p.x)},
      globalMaximum:{value:maximum,points:candidates.filter(p=>p.y===maximum).map(p=>p.x)},
      comparison:'Declared analytic candidates evaluated as unrounded floating-point numbers.'},
    secant:{from,to,width:clean(to-from),rate,change:clean((to-from)*rate),endpoints:[{x:from,y:f(from)},{x:to,y:f(to)}]},assumption});
}

export function zeroStructure(value) {
  const input = record(value,{a:1,r:1,m:2,u:-1,v:1});
  const {a,r,m,u,v}=input;
  scale(a); bounds(r,-4,4); bounds(u,-4,4); bounds(v,0,4);
  if (!Number.isInteger(m)||m<1||m>4) throw invalid();
  let coeff=[a];
  for (let i=0;i<m;i++) coeff=multiply(coeff,[-r,1]);
  coeff=multiply(coeff,[u*u+v*v,-2*u,1]);
  const base=polynomial(coeff), zeroLedger=[];
  const add=(real,imaginary,multiplicity)=>{
    const existing=zeroLedger.find(z=>z.real===real&&z.imaginary===imaginary);
    if(existing) existing.multiplicity+=multiplicity;
    else zeroLedger.push({real:clean(real),imaginary:clean(imaginary),multiplicity});
  };
  add(r,0,m);
  if(v===0) add(u,0,2); else {add(u,-v,1);add(u,v,1);}
  zeroLedger.sort((x,y)=>x.real-y.real||x.imaginary-y.imaginary);
  const realZeros=zeroLedger.filter(z=>z.imaginary===0).map(z=>({x:z.real,multiplicity:z.multiplicity,behavior:z.multiplicity%2?'cross':'touch'}));
  let sign=a>0?1:-1;
  const signIntervals=[];
  for(let i=realZeros.length;i>=0;i--){
    signIntervals.unshift({left:i===0?null:realZeros[i-1].x,right:i===realZeros.length?null:realZeros[i].x,sign});
    if(i>0&&realZeros[i-1].multiplicity%2) sign=-sign;
  }
  // Root symmetry is exact for the declared factorization, not tolerance-based on expanded coefficients.
  const mirrored=zeroLedger.every(z=>zeroLedger.some(w=>w.real===-z.real&&w.imaginary===-z.imaginary&&w.multiplicity===z.multiplicity));
  const symmetry=mirrored?(base.degree%2?'odd':'even'):'neither';
  return freeze({version:AP_POLYNOMIAL_MODEL_VERSION,family:'zero-structure',input,...base,zeroLedger,realZeros,signIntervals,symmetry,
    realZeroMultiplicity:realZeros.reduce((sum,z)=>sum+z.multiplicity,0),
    nonrealZeroMultiplicity:zeroLedger.filter(z=>z.imaginary!==0).reduce((sum,z)=>sum+z.multiplicity,0),
    conjugatePairAtRealAxis:v===0,assumption});
}

export function polynomialTails(value) {
  const input=record(value,{a:1,n:4,b:-8,c:1,window:4});
  const {a,n,b,c,window}=input;
  scale(a); bounds(b,-16,16); bounds(c,-16,16); bounds(window,1,25);
  if(!Number.isInteger(n)||n<1||n>6) throw invalid();
  const coeff=Array(n+1).fill(0);coeff[n]=a;coeff[n-1]+=b;coeff[0]+=c;
  const base=polynomial(coeff);
  const comparisonRows=[-window,-window/2,window/2,window].map(x=>{
    const full=evaluate(base.coefficients,x),leading=a*x**n;
    return {x,full,leading,ratio:full/leading,relativeDifference:(full-leading)/leading,absoluteDifference:Math.abs(full-leading)};
  });
  return freeze({version:AP_POLYNOMIAL_MODEL_VERSION,family:'polynomial-tails',input,...base,
    symmetry:parityFromCoefficients(base.coefficients),comparisonRows,
    comparison:'The ratio approaches 1 as input magnitude grows. Equal end behavior does not require an absolute vertical difference approaching zero.',assumption});
}

export function samplePolynomial(value) {
  const input=record(value,{coefficients:[0,-3,0,1],start:-3,step:0.5,count:12},'coefficients');
  input.coefficients=coefficients(input.coefficients);
  const {start,step,count}=input;
  coordinate(start); bounds(step,0.0001,5);
  if(!Number.isInteger(count)||count<1||count>128) throw invalid();
  const end=start+step*count;coordinate(end);
  const base=polynomial(input.coefficients);
  const rows=Array.from({length:count+1},(_,i)=>{const x=clean(start+i*step);return{x,y:evaluate(base.coefficients,x)};});
  const differences=[];let current=rows.map(p=>p.y);
  for(let order=1;order<=Math.min(6,count);order++){
    current=current.slice(1).map((y,i)=>clean(y-current[i]));
    differences.push({order,values:current.slice()});
  }
  const intervals=rows.slice(1).map((p,i)=>({left:rows[i].x,right:p.x,width:step,change:clean(p.y-rows[i].y),rate:clean((p.y-rows[i].y)/step)}));
  return freeze({version:AP_POLYNOMIAL_MODEL_VERSION,family:'polynomial-samples',input,...base,rows,intervals,differences,
    symmetry:parityFromCoefficients(base.coefficients),assumption});
}
