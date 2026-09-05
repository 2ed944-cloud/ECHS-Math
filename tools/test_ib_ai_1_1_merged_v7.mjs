/* Independent mathematical and publishing contracts for the current merged lesson. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),base=new URL('../lessons/ib-math-ai/unit-1/',import.meta.url);
const M=require(new URL('data/lesson-1.1-merged-model-v7.js',base).pathname);
const Q=require(new URL('data/lesson-1.1-merged-questions-v7.js',base).pathname);
export const answers=['7.25 x 10^-5','3080000','1.92 x 10^3','4.95 x 10^6','6.20','0.00451','4','8.35','3.605','2.4','10','210'];
assert.equal(Q.questions.length,12);
for(const [i,q] of Q.questions.entries()){
  assert.ok(M.checkAnswer(answers[i],q).correct,q.id);
  assert.ok(!M.checkAnswer('123456789',q).correct,q.id);
}
for(const [v,dp,out] of [['2.675',2,'2.68'],['6.2048',2,'6.20'],['-1.25',1,'-1.3'],['149',-1,'150'],['1.005',2,'1.01']])assert.equal(M.roundPlaces(v,dp),out);
for(const [v,sf,out] of [['0.009996',3,'0.0100'],['0.005070',3,'0.00507'],['999.6',3,'1000'],['99.96',3,'100'],['12.40',4,'12.40']])assert.equal(M.roundSF(v,sf),out);
for(const [v,count] of [['0.005070',4],['4.80 x 10^3',3],['4800',2],['4800.',4],['0.0100',3]])assert.equal(M.significantFigures(v),count);
for(const s of ['1abc','3 cats','Infinity','NaN','1/0','2+3','alert(1)','1e999',''])assert.equal(M.parseNumber(s),null,s);
assert.equal(M.parseNumber('3/4'),.75);assert.equal(M.parseNumber('3.2E-6'),3.2e-6);
assert.ok(!M.checkAnswer('0',{answer:1e-15}).correct,'Tiny nonzero numbers are not equal to zero');
assert.ok(!M.checkAnswer('72.5 x 10^-6',Q.questions[0]).correct,'Normalized form is required');
assert.ok(!M.checkAnswer('7.25e-5',Q.questions[0]).correct,'Require mathematical notation when requested');
assert.ok(!M.checkAnswer('6.2',Q.questions[4]).correct,'Required trailing zero');
assert.ok(!M.checkAnswer('0.004510',Q.questions[5]).correct,'Requested significant figures');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,a+' versus '+b);
near(M.percentageError(78.6,80),1.75);near(M.percentageError(81.4,80),1.75);assert.equal(M.percentageError(1,0),null);
const a=M.bounds(5.2,.1),b=M.bounds(3.7,.1);
const expected={sum:[8.8,9,true],difference:[1.4,1.6,false],product:[18.7975,19.6875,true],quotient:[103/75,105/73,false]};
for(const [op,[lo,hi,closed]] of Object.entries(expected)){const result=M.calculatedBounds(a,b,op);near(result.low,lo);near(result.high,hi);assert.equal(result.lowClosed,closed);}
near(8.35*3.15,26.3025);near(8.45*3.25,27.4625);
near(63950/1250,51.16);near(64050/1250,51.24);
near(12.35/3.25,3.8);near(12.45/3.15,83/21);
near(2.495**2,6.225025);near(2.505**2,6.275025);
assert.equal(M.roundSF(String(M.percentageError(19.5,6.25*Math.PI)),3),'0.687');
assert.equal(Q.frqs.length,14);
assert.equal(Q.frqs.reduce((s,f)=>s+f.parts.length,0),46);
assert.equal(Q.frqs.reduce((s,f)=>s+f.totalMarks,0),82);
assert.deepEqual(Q.frqs.map(f=>f.id[0]),[...Array(8).fill('s'),...Array(3).fill('e'),...Array(3).fill('c')]);
for(const f of Q.frqs){assert.equal(f.parts.reduce((s,p)=>s+p.marks,0),f.totalMarks);assert.ok(f.calculator);for(const p of f.parts){assert.ok(p.marks>=1&&p.marks<=4);assert.equal((p.rubric.match(/<li>/g)||[]).length,p.marks);assert.ok(p.prompt&&p.rubric);}}
const html=fs.readFileSync(new URL('lessons/IB_AI_SL_1.1_standard_form_ECHS.html',base),'utf8');
assert.equal((html.match(/class="slide"/g)||[]).length,43);
assert.equal((html.match(/data-lab="/g)||[]).length,8);
for(const q of Q.questions)assert.equal(html.split('data-question="'+q.id+'"').length,2);
for(const f of Q.frqs)assert.equal(html.split('data-frq="'+f.id+'"').length,2);
assert.ok(html.includes('data-merged-sections="SL 1.1 + SL 1.6"'));
assert.doesNotMatch(html,/ti84|engine\.js|scope=all|AP-style|complex numbers|nearest power|epsilon/i);
const ctx=vm.createContext({window:{}});vm.runInContext(fs.readFileSync(new URL('assets/js/katex-global.js',base),'utf8'),ctx);
let equations=0;
for(const str of [JSON.stringify(Q),html]){
  const source=str===html?str:JSON.parse(str);
  const visit=x=>{if(typeof x==='string'){for(const m of x.matchAll(/\\\((.*?)\\\)/gs)){ctx.window.katex.renderToString(m[1],{throwOnError:true,strict:'ignore'});equations++;}}else if(x&&typeof x==='object')Object.values(x).forEach(visit);};
  if(str!==html)visit(source);
}
for(const match of html.matchAll(/data-tex="([^"]+)"/g)){const tex=match[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#x27;/g,"'").replace(/&amp;/g,'&');ctx.window.katex.renderToString(tex,{throwOnError:true,strict:'ignore'});equations++;}
assert.ok(equations>100);
const legacy=fs.readFileSync(new URL('lessons/IB_AI_SL_1.6_approximation_error_ECHS.html',base),'utf8');
assert.match(legacy,/location\.search/,'The merged legacy URL retains access parameters');
console.log('IB AI SL merged 1.1 + 1.6: PASS (43 slides, 8 labs, 12 checks, 46 written parts / 82 marks, '+equations+' equations, rounding and exact bounds)');
