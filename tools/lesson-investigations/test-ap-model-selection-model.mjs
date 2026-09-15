import assert from 'node:assert/strict';
import test from 'node:test';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const args=process.argv.slice(2);assert.ok(args.length===0||(args.length===2&&args[0]==='--repo'&&args[1]),'Use --repo PATH');
const repo=resolve(args[1]||resolve(dirname(fileURLToPath(import.meta.url)),'../..'));
const {modelSelection:model,AP_MODEL_SELECTION_VERSION:version,AP_MODEL_SELECTION_LIMITS:limits}=
  await import(pathToFileURL(resolve(repo,'lessons/shared/investigations/ap-model-selection-model.mjs')));
const near=(a,b)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=1e-12*Math.max(1,Math.abs(b)));
const bad=value=>assert.throws(()=>model(value),e=>e instanceof RangeError&&e.message==='Invalid AP model selection input.');
function frozen(v){if(typeof v==='number'){assert.ok(Number.isFinite(v));assert.ok(!Object.is(v,-0));}else if(v&&typeof v==='object'){assert.ok(Object.isFrozen(v));Object.values(v).forEach(frozen);}}

test('01 original five observations and independently tabulated residuals agree',()=>{
  const r=model({delta:0,candidate:1});assert.equal(r.version,version);assert.equal(r.family,'selection');
  assert.deepEqual(r.observations.map(p=>p.y),[1,2,5,10,17]);assert.deepEqual(r.firstDifferences,[1,3,5,7]);assert.deepEqual(r.secondDifferences,[2,2,2]);
  assert.deepEqual(r.candidates[0].rows.map(p=>p.residual),[2,-1,-2,-1,2]);assert.equal(r.candidates[0].sse,14);near(r.candidates[0].rmse,Math.sqrt(2.8));
  assert.ok(r.candidates[1].rows.every(p=>p.residual===0));assert.equal(r.selected.sse,0);assert.equal(r.selected.rmse,0);
});
test('02 every perturbation and selected candidate matches an integer residual-energy oracle',()=>{
  const predictions=[[-1,3,7,11,15],[1,2,5,10,17]],original=[1n,2n,5n,10n,17n];let cases=0;
  for(let d=-8;d<=8;d++)for(const candidate of [0,1]){
    const r=model({delta:d/2,candidate});cases++;
    predictions.forEach((values,c)=>{
      const residuals=original.map((y,x)=>2n*y+(x===2?BigInt(d):0n)-2n*BigInt(values[x]));
      const energy=residuals.reduce((sum,n)=>sum+n*n,0n);const expected=Number(energy)/4;
      assert.deepEqual(r.candidates[c].rows.map(p=>p.residual),residuals.map(n=>Number(n)/2));
      assert.equal(r.candidates[c].sse,expected);near(r.candidates[c].rmse**2,expected/5);
      r.candidates[c].rows.forEach((p,x)=>{assert.equal(p.predicted,values[x]);assert.equal(p.observed-p.predicted,p.residual);assert.equal(p.squaredResidual,p.residual**2);});
    });
    assert.strictEqual(r.selected,r.candidates[candidate]);
  }
  assert.equal(cases,34);
});
test('03 ranking crosses at delta3.5 and reports a genuine tie',()=>{
  for(const [delta,best,scores]of [[0,'quadratic',[14,0]],[3.5,'tie',[12.25,12.25]],[4,'linear',[14,16]],[-4,'quadratic',[46,16]]]){
    const r=model({delta,candidate:0});assert.deepEqual(r.candidates.map(p=>p.sse),scores);assert.deepEqual(r.ranking,{best,metric:'sse'});
  }
});
test('04 changing observations never refits either fixed function',()=>{
  const baseline=model({delta:0,candidate:0});
  for(let delta=-4;delta<=4;delta+=0.5){const r=model({delta,candidate:1});r.candidates.forEach((p,i)=>{assert.equal(p.fitted,false);assert.deepEqual(p.points,baseline.candidates[i].points);assert.deepEqual(p.coefficients,baseline.candidates[i].coefficients);assert.equal(p.formula,baseline.candidates[i].formula);});}
});
test('05 point samples connect the same predictions shown in the residual table',()=>{
  const r=model({delta:-2,candidate:0});
  for(const c of r.candidates){assert.equal(c.points.length,81);assert.equal(c.points[0].x,0);assert.equal(c.points.at(-1).x,4);assert.ok(c.points.every((p,i,all)=>i===0||p.x>all[i-1].x));for(const row of c.rows)assert.equal(c.points.find(p=>p.x===row.x).y,row.predicted);}
  assert.deepEqual(r.domain,[0,4]);assert.equal(r.domainMeaning,'observed-input-interval');assert.equal(r.candidateAlgebraicDomain,'all-real');
});
test('06 perturbation changes exactly one observation and gives a signed residual pattern',()=>{
  for(let delta=-4;delta<=4;delta+=0.5){
    const r=model({delta,candidate:1});assert.deepEqual(r.observations.map(p=>p.y),[1,2,5+delta,10,17]);
    assert.deepEqual(r.firstDifferences,[1,3+delta,5-delta,7]);assert.deepEqual(r.secondDifferences,[2+delta,2-2*delta,2+delta]);
    assert.deepEqual(r.selected.rows.map(p=>p.residual),[0,0,delta===0?0:delta,0,0]);
  }
});
test('07 immutable snapshots contain finite numbers and no executable definition',()=>{
  const input={delta:0,candidate:1},r=model(input);input.delta=4;assert.equal(r.input.delta,0);frozen(r);frozen(limits);
  assert.throws(()=>{r.selected.rows[0].residual=4;},TypeError);assert.deepEqual(model(Object.assign(Object.create(null),r.input)),r);
  const walk=v=>{assert.notEqual(typeof v,'function');if(v&&typeof v==='object')Object.values(v).forEach(walk);};walk(r);
});
test('08 rejects nonfinite, coerced, out-of-range and off-grid values',()=>{
  for(const [key,values]of Object.entries({delta:[-4.5,4.5,0.25],candidate:[-1,2,0.5]}))for(const value of [...values,NaN,Infinity,-Infinity,true,false,null,undefined,'0',{},[],1n])bad({delta:0,candidate:0,[key]:value});
});
test('09 requires exactly two ordinary enumerable data properties',()=>{
  for(const v of [undefined,null,[],new Date(),{}, {delta:0},{candidate:0},{delta:0,candidate:0,fit:true},Object.create({delta:0,candidate:0})])bad(v);
  bad({delta:0,candidate:0,[Symbol('x')]:1});bad(Object.defineProperty({delta:0,candidate:0},'delta',{enumerable:false}));
});
test('10 accessors are never evaluated and hostile inspection errors stay fixed',()=>{
  let calls=0;bad({get delta(){calls++;throw Error('private');},candidate:0});assert.equal(calls,0);
  for(const trap of ['ownKeys','getOwnPropertyDescriptor','getPrototypeOf'])bad(new Proxy({delta:0,candidate:0},{[trap](){throw Error('private');}}));
});
