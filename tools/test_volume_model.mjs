import assert from 'node:assert/strict';
import {buildModel,SCENARIOS,SHAPES,midpointSum,CURRICULUM} from '../lessons/ap-calculus/unit-8/assets/volume-model.mjs';

let checks=0;
const near=(actual,expected,tolerance=1e-11)=>{checks++;assert.ok(Math.abs(actual-expected)<=tolerance,`${actual} differs from ${expected}`);};
// Independent quadrature uses analytic geometry supplied here, not model.areaAt.
function simpson(f,a,b,n=20000) {
  const h=(b-a)/n; let sum=f(a)+f(b);
  for(let i=1;i<n;i++) sum+=(i%2?4:2)*f(a+i*h);
  return sum*h/3;
}
const coeff={square:1,rectangle:2,equilateral:Math.sqrt(3)/4,'right-leg':0.5,'right-hypotenuse':0.25,semicircle:Math.PI/8};
for(const axis of ['x','y']) for(const shape of SHAPES) {
  const m=buildModel({scenario:`cross-${axis}`,shape:shape.id});
  const independent=t=>coeff[shape.id]*(axis==='x'?t-t*t:Math.sqrt(t)-t)**2;
  // y = u² removes the square-root endpoint from independent quadrature.
  near(m.exactVolume,simpson(axis==='y'?u=>independent(u*u)*2*u:independent,0,1),1e-11);
  for(const t of [0,0.1,0.5,0.9,1]) near(m.areaAt(t),independent(t));
  near(m.areaAt(0),0); near(m.areaAt(1),0);
  assert.equal(m.radiiAt(0.5),null);
}
for(const axis of ['x','y']) for(const k of [-2,-1,0,1,2,3]) {
  const disk=buildModel({scenario:`shifted-disk-${axis}`,axisOffset:k});
  near(disk.exactVolume,8*Math.PI);
  near(midpointSum(disk,1),8*Math.PI);
  near(disk.areaAt(4),4*Math.PI);
  assert.deepEqual(disk.baseAt(4),[k,k+2]);
  assert.deepEqual(disk.radiiAt(0),{outer:0,inner:0});
  const washer=buildModel({scenario:`shifted-washer-${axis}`,axisOffset:k});
  // Squared distance of each boundary from the chosen external axis.
  const independent=t=>{
    const low=axis==='x'?t*t:t, high=axis==='x'?t:Math.sqrt(t);
    return Math.PI*Math.abs((high-k)**2-(low-k)**2);
  };
  near(washer.exactVolume,simpson(axis==='y'?u=>independent(u*u)*2*u:independent,0,1),1e-11);
  for(const t of [0,0.25,0.5,0.75,1]) {
    const r=washer.radiiAt(t); assert.ok(r.outer>=r.inner&&r.inner>=0);
    near(washer.areaAt(t),independent(t));
  }
  near(washer.areaAt(0),0); near(washer.areaAt(1),0);
}
const known={
  'washer-x':2*Math.PI/15,'washer-y':Math.PI/6,
  'shell-x':2*Math.PI/15,'shell-y':Math.PI/6,
  'disk-x':8*Math.PI,'disk-y':8*Math.PI
};
for(const [scenario,expected] of Object.entries(known)) near(buildModel({scenario}).exactVolume,expected);
const sy=buildModel({scenario:'shell-y'}), sx=buildModel({scenario:'shell-x'});
assert.equal(sy.variable,'x'); assert.equal(sx.variable,'y');
assert.deepEqual(sy.baseAt(0.5),[0.25,0.5]);
assert.deepEqual(sy.shellAt(0.5),{radius:0.5,height:0.25,low:0.25,high:0.5});
near(sx.shellAt(0.25).height,0.25);
near(sy.exactVolume,simpson(x=>2*Math.PI*x*(x-x*x),0,1));
near(sx.exactVolume,simpson(u=>2*Math.PI*(u*u)*(u-u*u)*2*u,0,1),1e-11);
for(const scenario of SCENARIOS) {
  const m=buildModel({scenario:scenario.id});
  const e8=Math.abs(midpointSum(m,8)-m.exactVolume), e256=Math.abs(midpointSum(m,256)-m.exactVolume);
  assert.ok(e256<=e8+1e-12,`${scenario.id}: refinement must improve this reviewed preset`);
  const [a,b]=m.bounds;
  for(const t of [a,(a+b)/2,b]) {
    assert.ok(Number.isFinite(m.areaAt(t))&&m.areaAt(t)>=0);
    const s=m.sliceAt(t); near(s.area,m.areaAt(t)); assert.ok(s.baseHigh>=s.baseLow);
  }
  for(const t of [a-0.01,b+0.01,NaN,Infinity,'0.5']) assert.throws(()=>m.baseAt(t),RangeError);
  assert.ok(m.integralTex.includes(`d${m.variable}`));
  assert.ok(m.exactText&&m.baseDescription);
  assert.equal(m.enrichment,m.kind==='shell');
}
assert.equal(buildModel({scenario:'shifted-washer-x',axisOffset:2}).exactText,'8π/15');
assert.equal(buildModel({scenario:'shifted-washer-x',axisOffset:-1}).exactText,'7π/15');
assert.equal(buildModel({scenario:'shifted-washer-y',axisOffset:2}).exactText,'π/2');
assert.throws(()=>buildModel({scenario:'unknown'}),RangeError);
assert.throws(()=>buildModel({shape:'unknown'}),RangeError);
for(const k of [0.25,0.5,0.75,NaN,Infinity,'-1']) assert.throws(()=>buildModel({scenario:'shifted-washer-x',axisOffset:k}),RangeError);
assert.throws(()=>buildModel({scenario:'washer-x',axisOffset:1}),RangeError);
for(const n of [0,-1,1.5,NaN,1000001]) assert.throws(()=>midpointSum(sx,n),RangeError);
assert.equal(CURRICULUM.version,'AP-CALCULUS-2026-27');
assert.equal(new Set(SCENARIOS.map(s=>s.id)).size,SCENARIOS.length);
console.log(`PASS: ${SCENARIOS.length} scenarios, ${SHAPES.length} cross sections, ${checks} numerical checks plus domain, radius, orientation, refinement and metadata assertions.`);
