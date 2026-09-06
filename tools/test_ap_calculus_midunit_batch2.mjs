import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),base=new URL('../lessons/ap-calculus/unit-1/assets/',import.meta.url);
const Q=require(new URL('midunit-questions.js',base).pathname),G=require(new URL('midunit-graphs.js',base).pathname);
const near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<tol,`${a} differs from ${b}`);
assert.equal(Q.revision,'midunit-v1','Extending the set preserves the account storage key');
assert.equal(crypto.createHash('sha256').update(JSON.stringify(Q.questions.slice(0,24))).digest('hex'),'00f1fde5ddcb58929b28d13daef1442618d3583bdf73d4de0cce572c4e2717e9','The first 24 questions remain unchanged');
const rows=Q.questions.filter(q=>q.batch==='batch-2');
assert.equal(rows.length,20);assert.equal(new Set(rows.map(q=>q.family)).size,10);
assert.deepEqual(rows.map(q=>q.id),Array.from({length:20},(_,i)=>'q'+(25+i)));
assert.deepEqual(rows.map(q=>q.answer),[1,2,2,0,1,3,1,2,2,0,1,3,2,0,3,0,3,1,3,1]);
assert.deepEqual(Q.scopeReview.excludedReferenceTypes.map(r=>r.topic),['1.8','1.9']);
assert.equal(Q.scopeReview.addedQuestionIds.length,20);
const side=(g,c,left)=>{const b=g.branches.find(b=>left?b.domain[0]<c&&b.domain[1]>=c:b.domain[0]<=c&&b.domain[1]>c);assert.ok(b);return G.evaluate(b.coefficients,c);};
for(const q of rows){
  assert.ok(['1.5','1.6'].includes(q.topic));
  assert.equal(new Set(q.choices).size,4);
  const c=q.check;
  if(q.family==='piecewise-analytic')near(G.evaluate(c.side==='left'?c.leftCoefficients:c.rightCoefficients,c.target),c.result);
  if(q.family==='graph-limit-laws'){
    for(const left of [true,false]){near(side(q.graphs[0],c.target,left),c.fLimit);near(side(q.graphs[1],c.target,left),c.gLimit);}
    assert.notEqual(c.gLimit,0);near((c.scale*c.fLimit+c.offset)/c.gLimit,c.result);
    const at=q.graphs[0].marks.find(m=>!m.open&&m.x===c.target).y;assert.notEqual((c.scale*at+c.offset)/c.gLimit,c.result);
  }
  if(q.family==='direct-substitution'){
    const model=x=>(c.cosCoefficient*Math.cos(c.cosFrequency*x)+c.expCoefficient*Math.exp(c.numeratorExpRate*x))/(c.denominatorCoefficient*Math.exp(c.denominatorExpRate*x));
    near(model(c.target),c.result);for(const sign of [-1,1])near(model(c.target+sign*1e-6),c.result,1e-5);
  }
  if(q.family==='radical-equivalence'){
    const raw=x=>c.mode==='radical-denominator'?(x-16)/(Math.sqrt(x)-4):(Math.sqrt(x+9)-5)/(x-16);
    const simplified=x=>c.mode==='radical-denominator'?Math.sqrt(x)+4:1/(Math.sqrt(x+9)+5);
    near(simplified(c.target),c.result);for(const delta of [-.1,-.001,.001,.1])near(raw(c.target+delta),simplified(c.target+delta));
  }
  if(q.family==='factor-zero'){
    for(const p of [c.numerator,c.denominator])assert.ok(p.slice(-c.cancelPower).every(v=>v===0));
    const n=c.numerator.slice(0,-c.cancelPower),d=c.denominator.slice(0,-c.cancelPower);
    assert.notEqual(G.evaluate(d,0),0);near(G.evaluate(n,0)/G.evaluate(d,0),c.result);
    for(const x of [-.02,-.001,.001,.02])near(G.evaluate(c.numerator,x)/G.evaluate(c.denominator,x),G.evaluate(n,x)/G.evaluate(d,x));
  }
  if(q.family==='trig-equivalence'){
    const raw=x=>c.mode==='cosine-difference'?(Math.cos(c.frequency*x)-1)/Math.sin(c.frequency*x)**2:(1+Math.sin(c.frequency*x))/Math.cos(c.frequency*x)**2;
    const simplified=x=>c.mode==='cosine-difference'?-1/(1+Math.cos(c.frequency*x)):1/(1-Math.sin(c.frequency*x));
    near(simplified(c.target),c.result);for(const delta of [-.03,-.001,.001,.03])near(raw(c.target+delta),simplified(c.target+delta));
  }
  if(q.family==='complex-fraction'){
    near(c.subtract,c.numeratorConstant/(c.target+c.shift));
    const raw=x=>(c.numeratorConstant/(x+c.shift)-c.subtract)/(x-c.target),simplified=x=>-c.numeratorConstant/((c.target+c.shift)*(x+c.shift));
    near(simplified(c.target),c.result);for(const delta of [-.02,-.001,.001,.02])near(raw(c.target+delta),simplified(c.target+delta));
  }
  if(q.family==='recover-limit'){
    assert.notEqual(c.gLimit,0);near((c.gLimit*c.ratioLimit-c.offset)/c.scale,c.result);
    // Establish the result using functions whose quotient and denominator have the supplied limits.
    for(const x of [c.target-1e-6,c.target+1e-6]){const g=c.gLimit+(x-c.target),ratio=c.ratioLimit+2*(x-c.target),f=(g*ratio-c.offset)/c.scale;near(f,c.result,1e-4);}
  }
  if(q.family==='absolute-value'){
    const f=x=>x===c.target?c.at:c.offset+c.scale*(x-c.target)/Math.abs(x-c.target);
    near(f(c.target-.001),c.left);near(f(c.target+.001),c.right);assert.notEqual(c.left,c.right);assert.match(q.choices[q.answer],/does not exist/);
  }
  if(q.family==='composite-limit'){
    const f=x=>x===c.target?c.at:G.evaluate(x<c.target?c.leftCoefficients:c.rightCoefficients,x);
    near(G.evaluate(c.leftCoefficients,c.target),c.innerLimit);near(G.evaluate(c.rightCoefficients,c.target),c.innerLimit);
    for(const left of [true,false])near(side(q.graph,c.target,left),c.innerLimit);
    assert.ok(c.innerLimit>c.target);near(f(c.innerLimit),c.result);assert.notEqual(f(f(c.target)),c.result);
    for(const delta of [-.00001,.00001]){assert.ok(f(c.target+delta)>c.target);near(f(f(c.target+delta)),c.result,.001);}
  }
}
console.log('AP Calculus checkpoint batch 2: PASS (20 keys, Topics 1.5–1.6, exact rewrites, paired graph limits, composite branches, and preserved original questions)');
