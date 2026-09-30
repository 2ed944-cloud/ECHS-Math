import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {CATALOG,loadLesson,resolveLesson} from '../lessons/shared/classroom/precalc-unit1/catalog.mjs';
import {freshState,revise,attempted,parseNumber,checkAnswer,classroomRequested,rateRows,evaluatePolynomial} from '../lessons/shared/classroom/precalc-unit1/state.mjs';
const require=createRequire(import.meta.url),katex=require('../question-bank/official/tools/node_modules/katex');
let count=0,math=0,models=0;
const numeric=new Map(Object.entries({
  '1.1/piecewise':10+6*3-4*4,
  '1.2/warm-up':(44-20)/6,'1.2/graph-endpoints':(4-2)/(3-1),
  '1.2/table-rate':(30-76)/(25-13),'1.2/units':(52-96)/(85-5),
  '1.2/formula':((3*5-5**2)-(3*2-2**2))/(5-2),'1.2/symmetric':((5-3)**2-(1-3)**2)/4,'1.2/exit-check':(5-15)/(7-2),
  '1.3/warm-up':(13-1)/(6-0),'1.3/linear-turn':((12*5+5)-(12*2+5))/3,'1.3/quadratic-turn':((2*5**2+2*5+1)-(2*2**2+2*2+1))/3,
  '1.4/cancel-degree':Math.max(2,1,0),'1.4/domain-extrema':Math.min(1**2,3**2),'1.4/cubic-average':((2**3-3*2)-((-2)**3-3*(-2)))/4,'1.4/degree-bound':4+1,
  '1.5/count-zeros':2+2,'1.7/warm-up':4,'1.7/equal-turn':-6/2,'1.7/cost':18+360/120,
  '1.8/warm-up':3,'1.8/canceled-zero':-1,'1.8/zero-count':new Set([1,1]).size,
  '1.10/warm-up':3,'1.10/hole-turn':-2-2,'1.11/vertex-turn':2*(4-4)**2-7,'1.11/expansion-turn':3*2**2,
  '1.13/residual':5-(4*1+2),'1.14/scale':-6/(1*-3),'1.14/construct-from-table':4/(0-2)**2,
  '1.14/add-hole':3*(1+1)/(1-2),'1.14/box':2*(12-4)*(10-4)
}));
const keys=new Set();
function walk(value) {
  if(typeof value==='string') {
    assert.equal((value.match(/\\\(/g)||[]).length,(value.match(/\\\)/g)||[]).length,'Balanced math delimiters: '+value);
    for(const match of value.matchAll(/\\\(([\s\S]*?)\\\)/g)){katex.renderToString(match[1],{throwOnError:true,trust:false,strict:'error'});math++;}
  } else if(Array.isArray(value))value.forEach(walk);else if(value&&typeof value==='object')Object.values(value).forEach(walk);
}
for(const entry of CATALOG) {
  assert.ok(fs.existsSync(entry.path));assert.equal(resolveLesson('/ECHS-Math/'+entry.path),entry);
  const lesson=await loadLesson(entry.topic);assert.equal(lesson.curriculum.version,'ap-precalculus-2026-27');assert.equal(lesson.original,true);assert.equal(lesson.slides[0].kind,'cover');assert.equal(lesson.slides.at(-1).kind,'reflection');
  const ids=new Set();
  for(const slide of lesson.slides) {
    assert.match(slide.id,/^[a-z0-9-]+$/);assert.ok(!ids.has(slide.id));ids.add(slide.id);
    assert.ok(slide.title&&slide.prompt&&Array.isArray(slide.steps));if(slide.kind!=='cover')assert.ok(slide.steps.length>=2);
    if(slide.answer?.kind==='number') {
      const key=entry.topic+'/'+slide.id;keys.add(key);assert.equal(slide.answer.value,numeric.get(key),'Independent numeric check '+key);
      assert.equal(checkAnswer(slide,{draft:String(slide.answer.value)}),true);
      assert.equal(checkAnswer(slide,{draft:String(slide.answer.value+1)}),false);
    }
    if(slide.answer?.kind==='choice'){assert.ok(slide.answer.index>=0&&slide.answer.index<slide.answer.options.length);assert.equal(new Set(slide.answer.options).size,slide.answer.options.length);}
    if(slide.graph){assert.ok(slide.graph.coefficients.every(Number.isFinite));assert.ok(slide.graph.domain[0]<slide.graph.domain[1]);assert.ok(slide.graph.range[0]<slide.graph.range[1]);}
    if(slide.table){for(const row of slide.table.rows)assert.equal(row.length,slide.table.headers.length);}
    if(slide.model){models++;assert.ok(['native','rates','polynomial','rational','equivalence','modeling'].includes(slide.model.kind));}
    walk(slide);count++;
  }
}
assert.deepEqual(keys,new Set(numeric.keys()));assert.equal(count,204);assert.equal(models,16);
const state=freshState(),activity={kind:'activity',answer:{kind:'reflection'}};
assert.equal(attempted(state,activity),false);state.paper=true;assert.equal(attempted(state,activity),true);
state.revealed=3;state.exploring=true;state.checked=true;revise(state,{draft:'Revised answer',paper:false});assert.equal(state.revealed,0);assert.equal(state.exploring,false);assert.equal(state.checked,null);
assert.equal(parseNumber('−23 / 6'),-23/6);assert.equal(parseNumber('1e-3'),.001);for(const text of ['','NaN','Infinity','1/0','2+3','1;alert(1)','0x12'])assert.equal(parseNumber(text),null);
for(const route of ['?forum=1#toy-car-lab','?classroom=0','?quiz=1','#slide-4','#slide=2','?mode=studio'])assert.equal(classroomRequested('https://example.org/'+route),false);
for(const route of ['','?classroom=1#slide-4','#classroom-function','?course=ap-precalculus'])assert.equal(classroomRequested('https://example.org/'+route),true);
for(const a of [-2,0,1,2])for(const b of [-6,0,3])for(const h of [.25,1,2]) {
  const rows=rateRows({a,b,c:7,start:-2,width:h});
  for(let i=0;i<rows.length-1;i++) {
    assert.ok(Math.abs((rows[i+1].rate-rows[i].rate)-2*a*h)<1e-9);
    assert.ok(Math.abs((rows[i+1].change-rows[i].change)-2*a*h*h)<1e-9);
    assert.ok(Math.abs((rows[i+1].rate-rows[i].rate)/h-2*a)<1e-9);
  }
}
// Independent polynomial identity / graph samples, hole values and one-sided signs.
for(let x=-4;x<=4;x+=.25){
  assert.equal(evaluatePolynomial([1,-3,1,5],x),(x+1)*((x-2)**2+1));
  assert.equal(evaluatePolynomial([1,0,-3,2],x),(x+2)*(x-1)**2);
  assert.equal(evaluatePolynomial([1,6,12,8],x),(x+2)**3);
  if(x!==1)assert.ok(Math.abs((x**3-2*x*x-5*x+6)/(x-1)-(x*x-x-6))<1e-8);
}
for(const epsilon of [.01,.0001])for(const pole of [-3,2]) {
  const f=x=>(x+1)/((x-2)*(x+3));assert.ok(f(pole-epsilon)<0);assert.ok(f(pole+epsilon)>0);
}
console.log(JSON.stringify({lessons:14,slides:count,models,katexExpressions:math,numericAnswers:keys.size,statesAndMath:'passed'}));
