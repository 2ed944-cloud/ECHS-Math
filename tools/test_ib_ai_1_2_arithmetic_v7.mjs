/* Mathematical and curriculum contracts for the active arithmetic lesson. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),base=new URL('../lessons/ib-math-ai/unit-1/',import.meta.url);
const M=require(new URL('data/lesson-1.2-arithmetic-model-v7.js',base).pathname),Q=require(new URL('data/lesson-1.2-arithmetic-questions-v7.js',base).pathname);
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} versus ${b}`);
const direct=(a,d,lo,hi)=>Array.from({length:hi-lo+1},(_,i)=>a+(lo+i-1)*d).reduce((a,b)=>a+b,0);
// Independent summation, including a single term, constant and decreasing sequences.
for(const [a,d] of [[12,4],[92,-4],[-10,8],[6,0],[52,-3.5]])for(const n of [1,2,7,20]){
 near(M.sum(a,d,n),direct(a,d,1,n));near(M.rangeSum(a,d,3,n+3),direct(a,d,3,n+3));
 const found=M.recover(4,M.term(a,d,4),10,M.term(a,d,10));near(found.a,a);near(found.d,d);
}
assert.equal(M.recover(2,4,2,8),null);
const answers=[5,47,80,16,6,11,488,119,6600,14,2,8];
assert.equal(Q.questions.length,12);
for(const [i,q] of Q.questions.entries()){near(q.answer,answers[i]);assert.ok(M.checkAnswer(String(answers[i]),q).correct);assert.ok(!M.checkAnswer('123456789',q).correct);}
for(const s of ['1abc','3 cats','Infinity','NaN','1/0','2+3','alert(1)','1e999',''])assert.equal(M.parseNumber(s),null,s);
assert.equal(M.parseNumber('3/4'),.75);assert.equal(M.parseNumber('−4'),-4);assert.equal(M.parseNumber('3.2E-6'),3.2e-6);
assert.equal(M.firstCrossing(90,35,700),19);assert.equal(M.firstCrossing(90,35,685),19);assert.equal(M.firstCrossing(90,35,685,{inclusive:true}),18);
assert.equal(M.firstCrossing(30,10,500,{cumulative:true}),8);
assert.equal(M.firstCrossing(10,-2,20,{max:50}),null);
near(M.balance(6000,2.5,0),6000);near(M.balance(6000,2.5,4),6600);
// Independently check the numerical conclusions in every written task.
const conclusions={
 s01:[17,6,101],s02:[6,7],s03:[20.5,3,-.5,16],s04:[73,855],s05:[13,9,53,297],
 s06:[156,5580,4956],s07:[-18,174],s08:[1.6,1.7,1.5,.8,15.2],
 e01:[245,1950,1260,1475,2930],e02:[4.9,5.3,5,76,504,6.2],
 e03:[450,15200,15650,16100,5,14750],c01:[19,212,53,5,9],c02:[80,152,10,1160],c03:[12,5,-1,456]
};
const calculations={
 s01:[17,6,17+14*6],s02:[(73-31)/(12-5),31-4*6],s03:[52-9*3.5,52-14*3.5,52-15*3.5,Math.ceil(52/3.5+1)],
 s04:[22+17*3,direct(22,3,1,18)],s05:[5*4-7,12-4+1,5*12-7,direct(-2,5,4,12)],
 s06:[4800*.0325,4800*(1+.0325*5),4800*(1+.0325)],s07:[282-300,300-7*18],
 s08:[8.8-7.2,10.5-8.8,12-10.5,(13.6-7.2)/8,7.2+10*.8],
 e01:[80+11*15,direct(80,15,1,12),direct(80,15,1,9),direct(80,15,1,10),direct(80,15,1,12)+4*245],
 e02:[40.9-36,46.2-40.9,(56-36)/4,36+8*5,direct(36,5,1,9),76-69.8],
 e03:[12500*.036,12500+6*450,12500+7*450,12500+8*450,(13000-12500)/(450-350),13000+5*350],
 c01:[9+2*5,direct(9,5,1,8),212/4,(53-2*19)/3,19-2*5],
 c02:[40+5*8,40+14*8,15-6+1,direct(40,8,6,15)],c03:[Math.ceil(71/6),71-11*6,71-12*6,direct(71,-6,1,12)]
};
for(const id of Object.keys(conclusions))calculations[id].forEach((v,i)=>near(v,conclusions[id][i]));
assert.equal(Q.frqs.length,14);assert.equal(Q.frqs.reduce((s,f)=>s+f.parts.length,0),49);assert.equal(Q.frqs.reduce((s,f)=>s+f.totalMarks,0),100);
assert.deepEqual(Q.frqs.map(f=>f.id[0]),[...Array(8).fill('s'),...Array(3).fill('e'),...Array(3).fill('c')]);
for(const f of Q.frqs){assert.equal(f.parts.reduce((s,p)=>s+p.marks,0),f.totalMarks);assert.ok(f.calculator);for(const p of f.parts){assert.ok(p.marks>=1&&p.marks<=4);assert.equal((p.rubric.match(/<li>/g)||[]).length,p.marks);assert.ok(p.prompt&&p.rubric);}}
const html=fs.readFileSync(new URL('lessons/IB_AI_SL_1.2_arithmetic_sequences_ECHS.html',base),'utf8');
assert.equal((html.match(/class="slide"/g)||[]).length,47);assert.equal((html.match(/data-lab="/g)||[]).length,8);
for(const q of Q.questions)assert.equal(html.split('data-question="'+q.id+'"').length,2);
for(const f of Q.frqs)assert.equal(html.split('data-frq="'+f.id+'"').length,2);
for(const topic of ['data-official-section="SL 1.2"','Simple interest','approximate','sigma','TI-Nspire CX / CX II','1.2A','1.2B'])assert.ok(html.includes(topic),topic);
assert.doesNotMatch(html,/ti84|engine\.js|scope=all|AP-style|No calculator/i);
const ctx=vm.createContext({window:{}});vm.runInContext(fs.readFileSync(new URL('assets/js/katex-global.js',base),'utf8'),ctx);
let equations=0;
const visit=x=>{if(typeof x==='string'){assert.doesNotMatch(x,/[\x00-\x08\x0b\x0c\x0e-\x1f]/);for(const m of x.matchAll(/\\\((.*?)\\\)/gs)){ctx.window.katex.renderToString(m[1],{throwOnError:true,strict:'ignore'});equations++;}}else if(x&&typeof x==='object')Object.values(x).forEach(visit);};visit(Q);
for(const match of html.matchAll(/data-tex="([^"]+)"/g)){const tex=match[1].replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#x27;/g,"'").replace(/&amp;/g,'&');ctx.window.katex.renderToString(tex,{throwOnError:true,strict:'ignore'});equations++;}
assert.ok(equations>100);
const catalog=JSON.parse(fs.readFileSync(new URL('../data/ib-math-ai-unit-1-delivery-catalog.json',import.meta.url),'utf8')),meta=catalog.lessons.find(x=>x.number==='1.2');
assert.equal(meta.release,'7.0.0');assert.equal(meta.learn_slides,47);assert.equal(meta.assessment.written_marks,100);assert.equal(meta.assessment.written_parts,49);assert.deepEqual(meta.official_core_sections.map(x=>x.code),['SL 1.2']);assert.equal(meta.calculator.external_dependency,false);
const portal=vm.createContext({window:{}});vm.runInContext(fs.readFileSync(new URL('../data/ib-math-ai-unit-1-update.js',import.meta.url),'utf8'),portal);const route=portal.window.ECHS_IB_MATH_AI_UNIT_1.lessons.find(x=>x.number==='1.2');
assert.equal(route.release,meta.release);assert.equal(route.learnSlides,47);assert.equal(route.assessment.writtenMarks,100);assert.equal(route.resources.find(x=>x.type==='assessment').label,'IB-style written tasks · 14');
assert.ok(route.resources.filter(x=>x.type==='notes').every(x=>x.label.includes('Earlier')));
console.log(`IB AI SL 1.2 mathematics: PASS (47 slides, 8 labs, 12 checks, 49 written parts / 100 marks, ${equations} equations, thresholds, simple interest and approximate models)`);
