/**
 * Reviewed, renderer-independent Unit 8 volume models.
 * Original examples; AP Calculus AB/BC CED 2026–27 topics 8.7–8.12.
 * Shells are enrichment. No assessment, authentication, or mastery writes.
 */
export const CURRICULUM = Object.freeze({
  version: 'AP-CALCULUS-2026-27',
  topics: Object.freeze(['8.7', '8.8', '8.9', '8.10', '8.11', '8.12']),
  source: 'https://apcentral.collegeboard.org/media/pdf/ap-calculus-ab-and-bc-course-and-exam-description.pdf'
});

export const SHAPES = Object.freeze([
  {id:'square', label:'Square', coefficient:1, areaTex:'w^2', exactText:'1/30'},
  {id:'rectangle', label:'Rectangle: height = twice the base', coefficient:2, areaTex:'2w^2', exactText:'1/15'},
  {id:'equilateral', label:'Equilateral triangle', coefficient:Math.sqrt(3)/4, areaTex:'\\frac{\\sqrt{3}}{4}w^2', exactText:'√3/120'},
  {id:'right-leg', label:'Isosceles right triangle: base is a leg', coefficient:1/2, areaTex:'\\frac12w^2', exactText:'1/60'},
  {id:'right-hypotenuse', label:'Isosceles right triangle: base is the hypotenuse', coefficient:1/4, areaTex:'\\frac14w^2', exactText:'1/120'},
  {id:'semicircle', label:'Semicircle: base is the diameter', coefficient:Math.PI/8, areaTex:'\\frac{\\pi}{8}w^2', exactText:'π/240'}
].map(Object.freeze));

const OFFSETS = Object.freeze([-2,-1,0,1,2,3]);
const descriptor = (id,label,kind,axis,shifted=false) => Object.freeze({
  id,label,kind,axis,bounds:Object.freeze(kind==='disk' ? [0,4] : [0,1]),
  defaultAxisOffset:shifted ? -1 : 0,
  allowedAxisOffsets:shifted ? OFFSETS : Object.freeze([0]),
  enrichment:kind==='shell',
  description:kind==='cross' ? 'Stack known cross-sectional areas above the region between y = x² and y = x.'
    : kind==='disk' ? 'Revolve a region touching the axis; each perpendicular slice produces a disk.'
    : kind==='washer' ? 'Revolve the region between y = x² and y = x; subtract the inner disk from the outer disk.'
    : 'Enrichment: revolve parallel slices into cylindrical shells and compare with perpendicular washers.'
});
export const SCENARIOS = Object.freeze([
  descriptor('cross-x','Known cross sections perpendicular to the x-axis','cross','x'),
  descriptor('cross-y','Known cross sections perpendicular to the y-axis','cross','y'),
  descriptor('disk-x','Disks about the x-axis','disk','x'),
  descriptor('disk-y','Disks about the y-axis','disk','y'),
  descriptor('shifted-disk-x','Disks about y = k','disk','x',true),
  descriptor('shifted-disk-y','Disks about x = k','disk','y',true),
  descriptor('washer-x','Washers about the x-axis','washer','x'),
  descriptor('washer-y','Washers about the y-axis','washer','y'),
  descriptor('shifted-washer-x','Washers about y = k','washer','x',true),
  descriptor('shifted-washer-y','Washers about x = k','washer','y',true),
  descriptor('shell-y','Shells about the y-axis (enrichment)','shell','y'),
  descriptor('shell-x','Shells about the x-axis (enrichment)','shell','x')
]);

const gcd = (a,b) => b ? gcd(b,a%b) : a;
function piFraction(n,d) {
  const g=gcd(Math.abs(n),d); n/=g; d/=g;
  const numerator=n===1 ? 'π' : `${n}π`;
  return d===1 ? numerator : `${numerator}/${d}`;
}
function shiftTex(expression,k) {
  if(k===0) return expression;
  return `${expression}${k>0 ? '-' : '+'}${Math.abs(k)}`;
}
function translatedTex(expression,k) {
  if(k===0) return expression;
  return `${k}+${expression}`;
}

/**
 * baseAt(t): transverse interval at axial coordinate t for cross/disk/washer.
 * For shells, t is radial planar coordinate and baseAt(t) is the interval
 * along the axis. areaAt(t) then means the shell volume density 2πrh.
 * radiiAt(t) is null for cross sections and shells (use shellAt instead).
 */
export function buildModel({scenario='cross-x',shape='square',axisOffset}={}) {
  const spec=SCENARIOS.find(s=>s.id===scenario);
  if(!spec) throw new RangeError(`Unknown volume scenario: ${scenario}`);
  const section=SHAPES.find(s=>s.id===shape);
  if(!section) throw new RangeError(`Unknown cross-section shape: ${shape}`);
  const k=axisOffset===undefined ? spec.defaultAxisOffset : axisOffset;
  if(!Number.isFinite(k) || !spec.allowedAxisOffsets.includes(k))
    throw new RangeError(`Axis offset must be one of ${spec.allowedAxisOffsets.join(', ')} for ${scenario}`);
  const [a,b]=spec.bounds;
  const checked=t=>{
    if(!Number.isFinite(t) || t<a-1e-12 || t>b+1e-12)
      throw new RangeError(`Slice parameter must be in [${a}, ${b}]`);
    return Math.min(b,Math.max(a,t));
  };
  const {kind,axis}=spec;
  const variable=kind==='shell' ? (axis==='y'?'x':'y') : axis;
  const xSlice=variable==='x';
  const widthTex=xSlice ? 'x-x^2' : '\\sqrt{y}-y';
  const baseAt=t=>{
    t=checked(t);
    if(kind==='disk') return [k,k+Math.sqrt(t)];
    return xSlice ? [t*t,t] : [t,Math.sqrt(t)];
  };
  const radiiAt=t=>{
    const [lo,hi]=baseAt(t);
    if(kind==='cross'||kind==='shell') return null;
    if(kind==='disk') return {outer:hi-k,inner:0};
    // All reviewed washer axes lie outside the interior of the base region.
    return {outer:Math.max(Math.abs(lo-k),Math.abs(hi-k)),inner:Math.min(Math.abs(lo-k),Math.abs(hi-k))};
  };
  const shellAt=t=>{
    t=checked(t);
    if(kind!=='shell') return null;
    const [low,high]=baseAt(t);
    return {radius:Math.abs(t-k),height:high-low,low,high};
  };
  const areaAt=t=>{
    if(kind==='shell') {const s=shellAt(t);return 2*Math.PI*s.radius*s.height;}
    if(kind==='cross') {const [lo,hi]=baseAt(t);return section.coefficient*(hi-lo)**2;}
    const {outer,inner}=radiiAt(t);
    return Math.PI*(outer*outer-inner*inner);
  };
  let exactVolume,exactText,integralTex,radiusTex=null,outerRadiusTex=null,innerRadiusTex=null;
  if(kind==='cross') {
    exactVolume=section.coefficient/30; exactText=section.exactText;
    const coefficient=section.areaTex.replace('w^2','');
    integralTex=`V=\\int_0^1 ${coefficient}\\left(${widthTex}\\right)^2\\,d${variable}`;
  } else if(kind==='disk') {
    exactVolume=8*Math.PI; exactText='8π'; radiusTex=`\\sqrt{${variable}}`;
    outerRadiusTex=radiusTex; innerRadiusTex='0';
    integralTex=`V=\\pi\\int_0^4\\left(\\sqrt{${variable}}\\right)^2\\,d${variable}=8\\pi`;
  } else if(kind==='washer') {
    const lower=xSlice?'x^2':'y', upper=xSlice?'x':'\\sqrt{y}';
    outerRadiusTex=k<=0 ? shiftTex(upper,k) : `${k}-${lower}`;
    innerRadiusTex=k<=0 ? shiftTex(lower,k) : `${k}-${upper}`;
    const n=xSlice ? (k<=0 ? 2-5*k : 5*k-2) : (k<=0 ? 1-2*k : 2*k-1);
    const d=xSlice ? 15 : 6;
    exactVolume=n*Math.PI/d; exactText=piFraction(n,d);
    integralTex=`V=\\pi\\int_0^1\\left[\\left(${outerRadiusTex}\\right)^2-\\left(${innerRadiusTex}\\right)^2\\right]\\,d${variable}`;
  } else {
    exactVolume=axis==='y'?Math.PI/6:2*Math.PI/15;
    exactText=axis==='y'?'π/6':'2π/15'; radiusTex=variable;
    integralTex=`V=2\\pi\\int_0^1 ${variable}\\left(${widthTex}\\right)\\,d${variable}`;
  }
  const baseDescription=kind==='disk'
    ? `${a} ≤ ${variable} ≤ ${b}; ${k} ≤ ${axis==='x'?'y':'x'} ≤ ${translatedTex(`√${variable}`,k)}. The region moves with the axis.`
    : 'The region bounded by y = x² and y = x, with 0 ≤ x ≤ 1 (equivalently, y ≤ x ≤ √y for 0 ≤ y ≤ 1).';
  const sliceAt=t=>{
    t=checked(t); const [baseLow,baseHigh]=baseAt(t); const radii=radiiAt(t); const shell=shellAt(t);
    return {parameter:t,baseLow,baseHigh,width:baseHigh-baseLow,area:areaAt(t),
      outer:radii?.outer??null,inner:radii?.inner??null,
      radius:shell?.radius??(kind==='disk'?radii.outer:null),height:shell?.height??null};
  };
  return Object.freeze({id:scenario,kind,axis,axisOffset:k,bounds:spec.bounds,variable,shape:section.id,
    shapeDescriptor:section,scenario:spec,baseAt,areaAt,radiiAt,shellAt,sliceAt,
    areaKind:kind==='shell'?'shell-integrand':'cross-sectional-area',
    exactVolume,exactText,integralTex,baseDescription,units:'units',
    radiusTex,outerRadiusTex,innerRadiusTex,widthTex,
    axisLabel:`${axis==='x'?'y':'x'} = ${k}`,
    curriculum:CURRICULUM,enrichment:kind==='shell'});
}

/** Midpoint approximation; shell terms are 2πrh Δt, not planar slice areas. */
export function midpointSum(model,n=24) {
  if(!Number.isInteger(n)||n<1||n>1000000) throw new RangeError('Partition count must be an integer from 1 to 1000000');
  if(!model||typeof model.areaAt!=='function'||!Array.isArray(model.bounds)) throw new TypeError('A volume model is required');
  const [a,b]=model.bounds,dt=(b-a)/n;
  let sum=0;
  for(let i=0;i<n;i++) sum+=model.areaAt(a+(i+0.5)*dt);
  return sum*dt;
}
