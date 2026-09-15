import assert from 'node:assert/strict';
import test from 'node:test';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const args=process.argv.slice(2);
assert.ok(args.length===0 || (args.length===2 && args[0]==='--repo' && args[1]),'Use --repo PATH');
const repo=resolve(args[1] || resolve(dirname(fileURLToPath(import.meta.url)),'../..'));
const {transformationModel:model,AP_TRANSFORM_MODEL_VERSION:version,AP_TRANSFORM_LIMITS:limits}=
  await import(pathToFileURL(resolve(repo,'lessons/shared/investigations/ap-transform-model.mjs')));
const initial=()=>({a:-2,horizontalMagnitude:0.5,reverseInput:1,h:4,k:1,u:-2});
const near=(a,b)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=2e-12*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const bad=value=>assert.throws(()=>model(value),error=>error instanceof RangeError&&error.message==='Invalid AP transformation model input.');
function frozen(value){
  if(typeof value==='number'){assert.ok(Number.isFinite(value));assert.ok(!Object.is(value,-0));}
  else if(value&&typeof value==='object'){assert.ok(Object.isFrozen(value));Object.values(value).forEach(frozen);}
}
// Independent polynomial composition: ascending coefficients, generic convolution.
function multiply(a,b){const out=Array(a.length+b.length-1).fill(0);a.forEach((x,i)=>b.forEach((y,j)=>out[i+j]+=x*y));return out;}
const evalPoly=(p,x)=>p.reduceRight((value,c)=>value*x+c,0);
function polynomial(input){
  const b=(input.reverseInput===1?-1:1)*input.horizontalMagnitude,affine=[-b*input.h,b];
  const squared=multiply(affine,affine),out=squared.map((c,i)=>input.a*(c+(affine[i]??0)));
  out[0]+=input.k;return out;
}
// Exact rational inverse of the doubled input equation, independent of floating division.
function exactPoint(input,u){
  const U=BigInt(Math.round(u*2)),A=BigInt(input.a*2),H=BigInt(input.h*2),K=BigInt(input.k*2);
  const B=BigInt(input.horizontalMagnitude*2)*(input.reverseInput===1?-1n:1n);
  return {x:Number(H*B+2n*U)/Number(2n*B),y:Number(A*(U*U+2n*U)+4n*K)/8};
}

test('01 declared initial image, restricted sets and selected point are correct',()=>{
  const r=model(initial());assert.equal(r.version,version);assert.equal(r.family,'transform');
  assert.equal(r.b,-0.5);assert.equal(r.collapsed,false);assert.equal(r.inputOrderReversed,true);
  assert.deepEqual(r.parent.domain,[-2,3]);assert.deepEqual(r.parent.range,[-0.25,12]);
  assert.deepEqual(r.image.domain,[-2,8]);assert.deepEqual(r.image.range,[-23,1.5]);
  assert.deepEqual(r.selected,{preimage:{x:-2,y:2},image:{x:8,y:-3}});
  assert.equal(r.parent.domainClosed,true);assert.equal(r.image.domainClosed,true);
});
test('02 all scales and signs across endpoint shifts satisfy independent rational and polynomial oracles',()=>{
  let cases=0;
  for(let ai=-6;ai<=6;ai++)for(let magnitude=1;magnitude<=4;magnitude++)for(const reverseInput of [0,1])
    for(const h of [-4,0,4])for(const k of [-4,0,4]){
      const input={a:ai/2,horizontalMagnitude:magnitude/2,reverseInput,h,k,u:-2+(cases%11)/2};
      const r=model(input),p=polynomial(input),expected=exactPoint(input,input.u);cases++;
      near(r.selected.image.x,expected.x);near(r.selected.image.y,expected.y);
      for(const row of r.table){const point=exactPoint(input,row.u);near(row.x,point.x);near(row.imageY,point.y);near(evalPoly(p,row.x),row.imageY);}
      const values=r.image.domain.map(x=>evalPoly(p,x));
      if(p[2]!==0){const vertex=-p[1]/(2*p[2]);assert.ok(vertex>=r.image.domain[0]&&vertex<=r.image.domain[1]);values.push(evalPoly(p,vertex));}
      near(r.image.range[0],Math.min(...values));near(r.image.range[1],Math.max(...values));
      for(const point of r.image.points){near(point.y,evalPoly(p,point.x));assert.ok(point.y>=r.image.range[0]-1e-10&&point.y<=r.image.range[1]+1e-10);}
    }
  assert.equal(cases,936);
});
test('03 negative input scale reverses endpoint order but graphs remain ordered and cover both extrema',()=>{
  for(const reverseInput of [0,1]){
    const r=model({...initial(),reverseInput});
    assert.equal(r.parent.points.length,101);assert.equal(r.image.points.length,101);
    assert.ok(r.image.points.every((p,i,all)=>i===0||p.x>all[i-1].x));
    assert.equal(r.endpointImages[0].u,-2);assert.equal(r.endpointImages[1].u,3);
    assert.equal(r.endpointImages[0].x>r.endpointImages[1].x,reverseInput===1);
    assert.ok(r.parent.points.some(p=>p.x===-0.5&&p.y===-0.25));
    near(Math.min(...r.image.points.map(p=>p.y)),r.image.range[0]);near(Math.max(...r.image.points.map(p=>p.y)),r.image.range[1]);
    near(r.image.points[0].x,r.image.domain[0]);near(r.image.points.at(-1).x,r.image.domain[1]);
  }
});
test('04 zero output multiplier collapses the range while preserving the restricted mapped domain',()=>{
  for(const horizontalMagnitude of [0.5,1,1.5,2])for(const reverseInput of [0,1])for(const k of [-4,0,4]){
    const r=model({...initial(),a:0,horizontalMagnitude,reverseInput,k});
    assert.equal(r.collapsed,true);assert.deepEqual(r.image.range,[k,k]);assert.ok(r.image.domain[0]<r.image.domain[1]);
    assert.ok(r.image.points.every(p=>p.y===k));assert.equal(r.selected.image.y,k);frozen(r);
  }
});
test('05 parent table covers asymmetric values and an interior minimum',()=>{
  const r=model(initial());
  assert.deepEqual(r.table.map(p=>[p.u,p.parentY]),[[-2,2],[-1,0],[-0.5,-0.25],[0,0],[1,2],[2,6],[3,12]]);
  for(const row of r.table)near(r.b*(row.x-r.input.h),row.u);
});
test('06 each declared control value can round-trip without coercion or silent clipping',()=>{
  const grids={a:[-3,3,0.5],horizontalMagnitude:[0.5,2,0.5],reverseInput:[0,1,1],h:[-4,4,0.5],k:[-4,4,0.5],u:[-2,3,0.5]};
  let cases=0;for(const [key,[lo,hi,step]]of Object.entries(grids))for(let n=lo;n<=hi;n+=step){const input={...initial(),[key]:n},r=model(input);assert.deepEqual(r.input,input);assert.deepEqual(model(r.input),r);cases++;}
  assert.equal(cases,64);
});
test('07 results are deeply frozen, detached and finite including null-prototype inputs',()=>{
  const input=initial(),r=model(input);input.a=3;assert.equal(r.input.a,-2);frozen(r);frozen(limits);
  assert.throws(()=>{r.table[0].x=999;},TypeError);assert.throws(()=>r.image.points.push({x:0,y:0}),TypeError);
  assert.deepEqual(model(Object.assign(Object.create(null),initial())),r);
});
test('08 invalid numeric bounds, off-grid values and types fail with a fixed error',()=>{
  const edge={a:[-3.5,3.5,0.25],horizontalMagnitude:[0,2.5,0.75],reverseInput:[-1,2,0.5],h:[-4.5,4.5,0.25],k:[-4.5,4.5,0.25],u:[-2.5,3.5,0.25]};
  for(const key of Object.keys(initial()))for(const value of [...edge[key],NaN,Infinity,-Infinity,true,false,null,undefined,'1',1n,{},[]])bad({...initial(),[key]:value});
});
test('09 exact record shape rejects missing, extra, symbolic, hidden and inherited fields',()=>{
  for(const value of [undefined,null,[],new Date(),Object.create(initial()),()=>{}])bad(value);
  for(const key of Object.keys(initial())){const v=initial();delete v[key];bad(v);}
  bad({...initial(),b:-0.5});bad({...initial(),[Symbol('extra')]:1});
  bad(Object.defineProperty(initial(),'u',{value:0,enumerable:false}));bad(Object.assign(new Number(1),initial()));
});
test('10 getters are not invoked and proxy inspection failures cannot leak thrown text',()=>{
  let calls=0;bad(Object.defineProperty(initial(),'u',{get(){calls++;throw Error('private');},enumerable:true}));assert.equal(calls,0);
  for(const trap of ['ownKeys','getOwnPropertyDescriptor','getPrototypeOf'])bad(new Proxy(initial(),{[trap](){throw Error('private');}}));
});
