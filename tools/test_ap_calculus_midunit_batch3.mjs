import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),root=new URL('../',import.meta.url),base=new URL('lessons/ap-calculus/unit-1/assets/',root);
const Q=require(new URL('midunit-questions.js',base).pathname),G=require(new URL('midunit-graphs.js',base).pathname);
const near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<tol,`${a} differs from ${b}`);
assert.equal(crypto.createHash('sha256').update(JSON.stringify(Q.questions.slice(0,44))).digest('hex'),'457a016777ab221d56f1cd4c81948309a60343078fbf6056b653795c133f6a1e','All 44 existing questions retain their content and stable IDs');
assert.equal(Q.revision,'midunit-v1');
const added=Q.questions.filter(q=>q.batch==='batch-3');assert.equal(added.length,12);
assert.deepEqual(added.map(q=>q.id),Array.from({length:12},(_,i)=>'q'+(45+i)));
assert.deepEqual(added.map(q=>q.answer),[3,1,0,2,2,3,2,1,3,0,2,1]);
assert.deepEqual(Q.scopeReviewBatch3.excludedReferenceTypes.map(r=>r.topic),['1.9','1.14','1.11']);
const derivative=(c,x)=>G.evaluate(c.slice(0,-1).map((a,i)=>a*(c.length-i-1)),x);
const secant=(c,[a,b])=>(G.evaluate(c,b)-G.evaluate(c,a))/(b-a);
for(const q of added){
 assert.equal(q.topic,'1.1');assert.equal(new Set(q.choices).size,4);const c=q.check;
 if(q.family==='tangent-secant'){
  const d=derivative(c.coefficients,c.target);near(d,c.tangentSlope);
  const errors=c.candidates.map(k=>k.kind==='secant'?Math.abs(secant(c.coefficients,k.interval)-d):Infinity);
  assert.equal(errors.indexOf(Math.min(...errors)),q.answer);assert.equal(errors.filter(x=>Math.abs(x-errors[q.answer])<1e-7).length,1);
  const tangent=q.graph.branches.find(b=>b.kind==='tangent');near(G.evaluate(tangent.coefficients,c.target),G.evaluate(c.coefficients,c.target));near(tangent.coefficients[0],d);
  assert.match(G.svg(q.graph),/stroke-dasharray="8 5"/);assert.match(q.graphCaption,/Dashed maroon/);
 }
 if(q.family==='segment-speed'){
  const ps=q.graph.branches[0].points,i=ps.findIndex((p,i)=>ps[i+1]&&p[0]<c.target&&ps[i+1][0]>c.target);assert.ok(i>=0);
  const slope=(ps[i+1][1]-ps[i][1])/(ps[i+1][0]-ps[i][0]);near(Math.abs(slope),c.speed);near(c.values[q.answer],c.speed);assert.equal(c.values.filter(v=>v===c.speed).length,1);
 }
 if(q.family==='quadratic-secant'){
  // Verify the midpoint identity for several distinct nonlinear quadratics, not just one data example.
  for(const coefficients of [[2,3,5],[-.5,9,12],[.25,-3,20]]){
   const d=derivative(coefficients,c.target);
   if(c.mode==='both'){assert.equal(q.answer,2);for(const interval of c.intervals)near(secant(coefficients,interval),d);}
   else {const exact=c.candidates.flatMap((k,i)=>k.kind==='secant'&&Math.abs(secant(coefficients,k.interval)-d)<1e-7?[i]:[]);assert.deepEqual(exact,[q.answer]);}
  }
 }
}
const mc=vm.createContext({window:{},console});vm.runInContext(fs.readFileSync(new URL('lessons/ib-math-ai/unit-1/assets/js/katex-global.js',root),'utf8'),mc);
const side=(g,x,left)=>{const b=g.branches.find(b=>left?b.domain[0]<x&&b.domain[1]>=x:b.domain[0]<=x&&b.domain[1]>x);assert.ok(b);return G.evaluate(b.coefficients,x);};
assert.equal(Q.frqs.length,2);assert.deepEqual(Q.frqs.map(f=>f.id),['frq01','frq02']);
for(const f of Q.frqs){
 const c=f.check;assert.deepEqual(f.parts.map(p=>p.id),['a','b','c']);assert.deepEqual(f.parts.map(p=>p.topic),['1.5','1.3','1.1']);assert.deepEqual(f.parts.map(p=>p.rubric.length),[2,4,2]);
 for(const s of [f.prompt,...f.parts.flatMap(p=>[p.prompt,p.hint,p.solution])])for(const m of s.matchAll(/\\\((.*?)\\\)/gs))mc.window.katex.renderToString(m[1],{throwOnError:true,strict:'ignore'});
 for(const left of [true,false])near(side(f.graph,c.target,left),c.fLimit);
 c.targets.forEach((x,i)=>{const left=side(f.graph,x,true),right=side(f.graph,x,false);if(c.limits[i]===null){near(left,c.oneSided[0]);near(right,c.oneSided[1]);assert.notEqual(left,right);}else{near(left,c.limits[i]);near(right,c.limits[i]);}});
 const xs=f.table.headers.slice(1).map(Number),ys=f.table.rows[0].slice(1).map(Number);assert.ok(xs[2]<c.target&&xs[3]>c.target);assert.ok(ys[2]<c.gEstimate&&ys[3]>c.gEstimate||ys[2]>c.gEstimate&&ys[3]<c.gEstimate);
 near((ys[3]-ys[2])/(xs[3]-xs[2]),c.rate);near(c.operation==='difference'?c.fLimit-c.gEstimate:c.scale*c.fLimit+c.gEstimate,c.result);
 assert.doesNotMatch(G.svg(f.graph),/NaN|Infinity|undefined/);assert.match(f.parts[0].solution,/estimate/);assert.match(f.parts[2].solution,/finite table/);
 for(const m of f.graph.marks)assert.ok(m.x>=f.graph.domain[0]&&m.x<=f.graph.domain[1]&&m.y>=f.graph.range[0]&&m.y<=f.graph.range[1]);
}
console.log('AP Calculus checkpoint batch 3: PASS (12 unique keys, exact tangents and speed, quadratic midpoint identity, six written parts with verified graphs/tables/KaTeX, first 44 preserved)');
