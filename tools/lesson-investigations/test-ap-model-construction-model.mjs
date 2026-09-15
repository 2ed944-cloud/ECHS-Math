import assert from 'node:assert/strict';
import test from 'node:test';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const args=process.argv.slice(2);assert.ok(args.length===0||(args.length===2&&args[0]==='--repo'&&args[1]),'Use --repo PATH');
const repo=resolve(args[1]||resolve(dirname(fileURLToPath(import.meta.url)),'../..'));
const {openBoxModel:model,AP_MODEL_CONSTRUCTION_VERSION:version,AP_MODEL_CONSTRUCTION_LIMITS:limits}=
  await import(pathToFileURL(resolve(repo,'lessons/shared/investigations/ap-model-construction-model.mjs')));
const near=(a,b)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=1e-12*Math.max(1,Math.abs(b)));
const bad=v=>assert.throws(()=>model(v),e=>e instanceof RangeError&&e.message==='Invalid AP model construction input.');
function frozen(v){if(typeof v==='number'){assert.ok(Number.isFinite(v));assert.ok(!Object.is(v,-0));}else if(v&&typeof v==='object'){assert.ok(Object.isFrozen(v));Object.values(v).forEach(frozen);}}
// Geometric oracle: count quarter-centimetre cubes, without using the cubic rule.
function cubes(q){let count=0;for(let z=0;z<q;z++)for(let x=q;x<72-q;x++)for(let y=q;y<40-q;y++)count++;return count/64;}
function fitCubic(points){
  const rows=points.map(([x,y])=>[1,x,x*x,x*x*x,y]);
  for(let c=0;c<4;c++){
    const pivot=rows.findIndex((r,i)=>i>=c&&r[c]!==0);assert.ok(pivot>=c);[rows[c],rows[pivot]]=[rows[pivot],rows[c]];
    const divisor=rows[c][c];rows[c]=rows[c].map(x=>x/divisor);
    rows.forEach((r,i)=>{if(i!==c){const factor=r[c];rows[i]=r.map((x,j)=>x-factor*rows[c][j]);}});
  }
  return rows.map(r=>r[4]).reverse();
}

test('01 initial box has correct dimensions, volume and distinct domains',()=>{
  const r=model({t:2});assert.equal(r.version,version);assert.equal(r.family,'construction');assert.deepEqual(r.sheet,{length:18,width:10});
  assert.deepEqual(r.dimensions,{length:14,width:6,height:2});assert.equal(r.volume,168);
  assert.deepEqual(r.contextDomain,{min:0,max:5,minIncluded:false,maxIncluded:false});assert.equal(r.algebraicDomain,'all-real');
  assert.equal(r.units.volume,'cm³');assert.equal(r.units.rate,'cm³ per cm');
});
test('02 all nineteen permitted boxes match independently counted geometric unit cubes',()=>{
  for(let q=1;q<=19;q++){
    const r=model({t:q/4});assert.equal(r.volume,cubes(q));assert.equal(r.dimensions.length+2*r.input.t,18);assert.equal(r.dimensions.width+2*r.input.t,10);
    assert.equal(r.dimensions.height,r.input.t);assert.ok(Object.values(r.dimensions).every(x=>x>0));
    assert.deepEqual(r.table.find(row=>row.t===q/4),{t:q/4,...r.dimensions,volume:r.volume});
  }
});
test('03 cubic coefficients come from independent interpolation of four geometric volumes',()=>{
  const expected=fitCubic([[0,0],[1,cubes(4)],[2,cubes(8)],[3,cubes(12)]]),r=model({t:1});
  assert.deepEqual(expected,[4,-56,180,0]);assert.deepEqual(r.coefficients,expected);assert.equal(r.coefficientOrder,'descending');
  for(const p of r.points)near(expected.reduce((y,c)=>y*p.x+c,0),p.y);
});
test('04 applied examples distinguish volume loss from negative volume',()=>{
  const one=model({t:1}),two=model({t:2}),three=model({t:3});assert.deepEqual([one.volume,two.volume,three.volume],[128,168,144]);
  assert.equal(two.volume-one.volume,40);assert.equal(three.volume-two.volume,-24);assert.ok(three.volume>0);
});
test('05 physical sample graph excludes both boundary points and includes every control value',()=>{
  const r=model({t:4.75});assert.equal(r.points.length,99);assert.equal(r.table.length,19);
  for(const p of r.points){assert.ok(p.x>0&&p.x<5&&p.y>0);}
  assert.ok(r.points.every((p,i,all)=>i===0||p.x>all[i-1].x));
  for(const row of r.table)assert.equal(r.points.find(p=>p.x===row.t).y,row.volume);
  assert.deepEqual(r.boundaryPoints,[{t:0,volume:0,usable:false,kind:'domain-boundary-limit'},{t:5,volume:0,usable:false,kind:'domain-boundary-limit'}]);
});
test('06 all adjacent rates agree with independently counted volumes and explicit input width',()=>{
  const r=model({t:2});assert.equal(r.adjacentRates.length,18);
  r.adjacentRates.forEach((row,i)=>{
    assert.equal(row.from,(i+1)/4);assert.equal(row.to,(i+2)/4);const change=cubes(i+2)-cubes(i+1);
    assert.equal(row.change,change);assert.equal(row.rate,change*4);near(row.rate*(row.to-row.from),row.change);
  });
});
test('07 sample maximum is exact on its grid without claiming a global optimum',()=>{
  const r=model({t:1});assert.deepEqual(r.sampleMaximum,{t:2,volume:168,scope:'quarter-step-samples-only'});
  assert.ok(r.table.every(row=>row.volume<=r.sampleMaximum.volume));
  // A valid non-grid box already exceeds the displayed maximum: no calculus needed.
  const side=33n;const offGrid=Number(side*(288n-2n*side)*(160n-2n*side))/4096;
  assert.ok(offGrid>r.sampleMaximum.volume);bad({t:33/16});
});
test('08 frozen detached results and all input grid values round-trip exactly',()=>{
  const input={t:2},r=model(input);input.t=4;assert.equal(r.input.t,2);frozen(r);frozen(limits);
  for(let q=1;q<=19;q++){const r=model({t:q/4});assert.deepEqual(model(r.input),r);}
  assert.deepEqual(model(Object.assign(Object.create(null),{t:2})),r);assert.throws(()=>{r.dimensions.width=999;},TypeError);
});
test('09 physical endpoints, off-grid values and nonnumbers are rejected without coercion',()=>{
  for(const t of [0,5,-0.25,5.25,0.125,2.1,NaN,Infinity,-Infinity,true,false,null,undefined,'2',2n,{},[]])bad({t});
});
test('10 exact record validation avoids accessors and private inspection errors',()=>{
  for(const v of [undefined,null,[],{},new Date(),{t:2,scale:1},Object.create({t:2}),{t:2,[Symbol('x')]:1}])bad(v);
  bad(Object.defineProperty({t:2},'t',{enumerable:false}));let calls=0;bad({get t(){calls++;throw Error('private');}});assert.equal(calls,0);
  for(const trap of ['ownKeys','getOwnPropertyDescriptor','getPrototypeOf'])bad(new Proxy({t:2},{[trap](){throw Error('private');}}));
});
