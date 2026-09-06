import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),root=new URL('../',import.meta.url),base=new URL('lessons/ap-calculus/unit-1/',root);
const Q=require(new URL('assets/midunit-questions.js',base).pathname),G=require(new URL('assets/midunit-graphs.js',base).pathname);
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} differs from ${b}`);
assert.ok(Q.questions.length>=44);assert.equal(new Set(Q.questions.map(q=>q.id)).size,Q.questions.length);
assert.equal(new Set(Q.questions.map(q=>q.family)).size,22);
const mathContext=vm.createContext({window:{},console});vm.runInContext(fs.readFileSync(new URL('lessons/ib-math-ai/unit-1/assets/js/katex-global.js',root),'utf8'),mathContext);
const side=(g,c,left)=>{const b=g.branches.find(b=>b.domain&&(left?b.domain[0]<c&&b.domain[1]>=c:b.domain[0]<=c&&b.domain[1]>c));assert.ok(b);return G.evaluate(b.coefficients,c);};
for(const q of Q.questions){
  assert.equal(q.choices.length,4);assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4);assert.ok(q.hint.length>20&&q.solution.length>70);
  for(const s of [q.prompt,...q.choices,q.hint,q.solution])for(const m of s.matchAll(/\\\((.*?)\\\)/gs))mathContext.window.katex.renderToString(m[1],{throwOnError:true,strict:'ignore'});
  const c=q.check;
  if(q.family==='polynomial'){
    for(const r of c.roots)close(G.evaluate(c.coefficients,r),c.target);
    // Four distinct real roots of a quartic exhaust all possible intersections.
    assert.equal(new Set(c.roots).size,c.coefficients.length-1);assert.equal(c.roots.filter(r=>r>0).length,c.count);
    const words={One:1,Two:2,Three:3,Four:4};assert.equal(words[q.choices[q.answer]],c.count);
  }
  if(q.family==='flat-motion'){
    const pts=q.graph.branches[0].points,i=pts.findIndex((p,i)=>i<pts.length-1&&p[0]<c.time&&pts[i+1][0]>c.time);
    assert.ok(i>=0);close(Math.abs((pts[i+1][1]-pts[i][1])/(pts[i+1][0]-pts[i][0])),c.speed);assert.equal(q.choices[q.answer],'0 m/s');
  }
  if(q.family==='table-speed'){
    const estimates=c.candidates.map(t=>{const i=c.times.indexOf(t);return(c.positions[i+1]-c.positions[i-1])/(c.times[i+1]-c.times[i-1]);});
    assert.equal(c.candidates[estimates.indexOf(Math.max(...estimates))],c.best);
    assert.match(q.choices[q.answer],new RegExp('t='+c.best+'\\b'));
    assert.deepEqual(q.table.headers.slice(1).map(Number),c.times);assert.deepEqual(q.table.rows[0].slice(1).map(Number),c.positions);
  }
  if(q.choiceGraphs){const matching=[];q.choiceGraphs.forEach((g,i)=>{close(side(g,c.target,true),c.left[i]);close(side(g,c.target,false),c.right[i]);if(Math.abs(c.left[i]-c.limit)<1e-8&&Math.abs(c.right[i]-c.limit)<1e-8)matching.push(i);});assert.deepEqual(matching,[q.answer]);}
  if(q.family==='one-sided-graph'||q.family==='jump-limit'){
    close(side(q.graph,c.target,true),c.left);close(side(q.graph,c.target,false),c.right);
    const filled=q.graph.marks.filter(m=>m.x===c.target&&!m.open);assert.equal(filled.length,1);close(filled[0].y,c.at);
    if(q.family==='jump-limit'){assert.notEqual(c.left,c.right);assert.match(q.choices[q.answer],/does not exist/);}
  }
  for(const g of [q.graph,...(q.graphs||[]),...(q.choiceGraphs||[])].filter(Boolean)){
    const svg=G.svg(g);assert.match(svg,/<title /);assert.doesNotMatch(svg,/NaN|Infinity|undefined/);
    for(const m of g.marks)assert.ok(m.x>=g.domain[0]&&m.x<=g.domain[1]&&m.y>=g.range[0]&&m.y<=g.range[1]);
  }
  if(q.family==='finite-evidence'){
    assert.match(q.choices[q.answer],/cannot be definitively determined/);
    const xs=q.table.headers.slice(1).map(s=>Number(s.replace('−','-'))),ys=q.table.rows[0].slice(1).map(s=>Number(s.replace('−','-'))),gap=Math.min(...xs.filter(x=>x!==c.target).map(x=>Math.abs(x-c.target)))/2;
    // Two different limits can agree at every sampled input and at the assigned point.
    const model=L=>x=>{const i=xs.indexOf(x);if(i>=0)return ys[i];return Math.abs(x-c.target)<gap?L:0;};
    for(const L of [0,11]){const f=model(L);xs.forEach((x,i)=>assert.equal(f(x),ys[i]));assert.equal(f(c.target+gap/10),L);assert.equal(f(c.target-gap/10),L);}
  }
}
const ctx=vm.createContext({window:{}});vm.runInContext(fs.readFileSync(new URL('data/courses.js',root),'utf8'),ctx);vm.runInContext(fs.readFileSync(new URL('data/ap-calculus-update.js',root),'utf8'),ctx);
const course=ctx.window.ECHS_COURSES.find(c=>c.id==='ap-calculus-ab'),ls=course.units[0].lessons,index=ls.findIndex(l=>l.number==='1.M');
assert.equal(ls[index-1].number,'1.6');assert.equal(ls[index+1].number,'1.7');assert.equal(ls.filter(l=>l.number==='1.M').length,1);assert.equal(ls[index].title,Q.title);assert.equal(ls[index].practice,'embedded');assert.equal(ls[index].kind,'review');
assert.ok(fs.existsSync(new URL(ls[index].url,root)));
const portal=fs.readFileSync(new URL('js/portal.js',root),'utf8'),routing=vm.createContext({URL,URLSearchParams,location:{href:'https://example.test/ECHS-Math/index.html'},practiceCourse:()=> 'ap-calculus',lessonAccessKey:()=> 'ap-calculus::0::1.M'});
for(const name of ['lessonURL','practiceURL'])vm.runInContext(portal.split('\n').find(l=>l.startsWith(`function ${name}(`)),routing);
const href=vm.runInContext('practiceURL',routing)(course,0,ls[index],'checkpoint-key'),url=new URL(href);
assert.ok(url.pathname.endsWith(ls[index].url));assert.equal(url.hash,'#question=q01');assert.equal(url.searchParams.get('lessonKey'),'checkpoint-key');assert.equal(url.searchParams.get('accessKey'),'ap-calculus::0::1.M');
assert.match(vm.runInContext('practiceURL',routing)(course,0,ls[index-1],'ordinary-key'),/question-bank\/practice.html/);
console.log(`AP Calculus middle-unit content: PASS (${Q.questions.length} questions, 22 families, exact graph data, polynomial roots, speed estimates, KaTeX, finite-data counterexamples, card order and practice routing)`);

await import("./test_ap_calculus_midunit_batch2.mjs");
