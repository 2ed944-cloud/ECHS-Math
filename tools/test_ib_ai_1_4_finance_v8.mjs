import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),base=new URL('../lessons/ib-math-ai/unit-1/',import.meta.url);
const M=require(new URL('data/lesson-1.4-finance-model-v8.js',base).pathname),Q=require(new URL('data/lesson-1.4-finance-questions-v8.js',base).pathname);
export const answers=['1.045','0.5','18','5202.00','202.00','5721.24','6575.42','5.00','3','4','0.82','14739.00','18750.00','10000.00','-1.89','0','-5000','4.75','48','18000','422.73','50.00','200.00','9800.00','401.00','0','1169.00','5010.00'];
assert.equal(Q.questions.length,28);assert.equal(Q.frqs.length,24);
Q.questions.forEach((q,i)=>{assert.ok(M.checkAnswer(answers[i],q).correct,q.id);assert.ok(!M.checkAnswer('9999999',q).correct,q.id);});
for(const value of ['','NaN','Infinity','1e999','1abc','0/0','2+3','alert(1)'])assert.equal(M.parseNumber(value),null);
assert.ok(!M.checkAnswer('5202',Q.questions[3]).correct,'Retain requested decimal places');
assert.ok(!M.checkAnswer('5',Q.questions[7]).correct,'Retain requested significant figures');
const near=(a,b,eps=1e-7)=>assert.ok(Math.abs(a-b)<=eps*Math.max(1,Math.abs(b)),`${a} versus ${b}`);
// Independent period-by-period accumulation, rather than copying the implementation formula.
const grow=(p,i,n)=>{for(let j=0;j<n;j++)p+=p*i;return p;};
const savings=(a,i,n)=>{let p=0;for(let j=0;j<n;j++)p+=p*i+a;return p;};
const repay=(p,a,i,n)=>{for(let j=0;j<n;j++)p+=p*i-a;return p;};
for(const k of [1,2,4,12])for(const r of [0,3.6,6])for(const t of [1,3,10]){
 near(M.compound(5000,r,k,t),grow(5000,r/(100*k),k*t));
 near(M.annuityFV(200,r,k,k*t),savings(200,r/(100*k),k*t));
 const a=M.loanPayment(18000,r,k,k*t);near(repay(18000,a,r/(100*k),k*t),0,1e-6);
 near(M.present(M.compound(5000,r,k,t),r,k,t),5000);
 near(M.rate(5000,M.compound(5000,r,k,t),k,t),r);
}
near(M.depreciation(24000,15,3),14739);near(M.depreciation(24000,0,3),24000);
near(M.realValue(10000,5,1,2,5),10000);assert.ok(M.realValue(10000,4,1,8,6)<10000);
assert.equal(M.compound(1000,4,0,3),null);assert.equal(M.compound(-10,4,12,3),null);assert.equal(M.depreciation(1000,100,2),null);
assert.equal(M.firstPeriod(1000,1331,10,1,false),3);assert.equal(M.firstPeriod(1000,1331,10,1,true),4);
assert.equal(M.firstPeriod(5000,7000,3.6,12),113);assert.equal(M.firstPeriod(5000,7000,0,12),null);
near(M.loanPayment(18000,6,12,48),422.7305228628412);
const row=M.schedule(10000,250,6,12,2);assert.equal(row[0].interest,50);assert.equal(row[0].principal,200);assert.equal(row[0].balance,9800);assert.equal(row[1].balance,9599);
const insufficient=M.schedule(5000,40,12,12,1)[0];assert.equal(insufficient.principal,-10);assert.equal(insufficient.balance,5010);
const final=M.schedule(10000,250,6,12,60);assert.equal(final.length,45);assert.ok(final.at(-1).payment<250);assert.equal(final.at(-1).balance,0);
for(const [values,unknown,expected] of [
 [{N:36,I:4.5,PV:-5000,PMT:0,FV:0,PpY:12,CpY:12},'FV',5721.239161024466],
 [{N:5,I:4,PV:0,PMT:0,FV:8000,PpY:1,CpY:1},'PV',-6575.416854074816],
 [{N:3,I:0,PV:-4000,PMT:0,FV:4630.5,PpY:1,CpY:1},'I',5],
 [{N:0,I:3.6,PV:-5000,PMT:0,FV:7000,PpY:12,CpY:12},'N',112.32556433326432],
 [{N:48,I:6,PV:18000,PMT:0,FV:0,PpY:12,CpY:12},'PMT',-422.7305228628412],
 [{N:36,I:4.8,PV:0,PMT:-200,FV:0,PpY:12,CpY:12},'FV',savings(200,.004,36)],
 [{N:12,I:0,PV:1200,PMT:0,FV:0,PpY:12,CpY:12},'PMT',-100],
 [{N:0,I:6,PV:10000,PMT:-250,FV:0,PpY:12,CpY:12},'N',44.740189293727084],
 ])near(M.solver(values,unknown).answer,expected);
assert.ok(M.solver({N:36,I:5,PV:100,PMT:0,FV:0,PpY:4,CpY:12},'FV').error);
const fund=M.solver({N:60,I:3.6,PV:0,PMT:1200,FV:0,PpY:12,CpY:12},'PV').answer;near(repay(-fund,1200,.003,60),0,1e-6);
const payment=M.loanPayment(30000,4.8,12,60),outstanding=repay(30000,payment,.004,24);near(-M.solver({N:24,I:4.8,PV:30000,PMT:-payment,FV:0,PpY:12,CpY:12},'FV').answer,outstanding);
// Verify written finance answers with independent accumulation and amortization.
const cash=n=>n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const include=(id,n)=>assert.ok(JSON.stringify(Q.frqs.find(f=>f.id===id)).replaceAll(',','').includes(cash(n).replaceAll(',','')),id+' missing independently checked '+cash(n));
include('s01',grow(3600,.032,4));include('s02',grow(7500,.012,10));include('s05',grow(2800,-.12,4));include('s06',1458);include('s07',11576.25);include('s08',grow(6000,.0035,60));
include('e01',grow(8000,.04,6));include('e01',grow(8000,.0395/12,72));include('e02',grow(5000,.003,112));include('e02',grow(5000,.003,113));include('e03',grow(32000,-.18,5));include('e04',grow(15000,.01,32)/grow(1,.055,8));include('e05',grow(2000,.04,5));include('c01',grow(grow(9000,.03,2),.012,12));include('c02',grow(9000,.04,5));include('c02',grow(18000,-.12,5));
include('s09',48*M.loanPayment(18000,6,12,48)-18000);include('s10',9599);include('s11',savings(200,.004,36));include('s12',-fund);include('e07',outstanding);include('e07',outstanding*.004);include('c04',final.at(-1).payment);include('c04',final.reduce((s,r)=>s+r.payment,0)-10000);
assert.equal(Q.frqs.reduce((s,f)=>s+f.parts.length,0),60);assert.equal(Q.frqs.reduce((s,f)=>s+f.totalMarks,0),139);
for(const f of Q.frqs){assert.equal(f.parts.reduce((s,p)=>s+p.marks,0),f.totalMarks);assert.ok(f.calculator);for(const p of f.parts){assert.equal((p.rubric.match(/<li>/g)||[]).length,p.marks);assert.ok(p.prompt&&p.rubric);}}
const html=fs.readFileSync(new URL('lessons/IB_AI_SL_1.4_financial_models_ECHS.html',base),'utf8');
assert.equal((html.match(/class="slide"/g)||[]).length,67);assert.equal((html.match(/data-lab="/g)||[]).length,12);assert.ok(html.includes('data-merged-sections="SL 1.4 + SL 1.7"'));
for(const q of Q.questions)assert.equal(html.split('data-question="'+q.id+'"').length,2);for(const f of Q.frqs)assert.equal(html.split('data-frq="'+f.id+'"').length,2);
const sections=[...html.matchAll(/<section class="slide" id="([^"]+)"/g)].map(m=>m[1]);assert.ok(sections.indexOf('challenge-c01')>sections.indexOf('extended-e08'));
assert.doesNotMatch(html,/engine\.js|unit-1-gdc-integration|ti84-finance|scope=all|[\x00-\x08\x0b\x0c\x0e-\x1f]/);
const legacy=fs.readFileSync(new URL('lessons/IB_AI_SL_1.7_loans_annuities_ECHS.html',base),'utf8');assert.ok(legacy.includes('location.search+location.hash'));
const catalog=JSON.parse(fs.readFileSync(new URL('../data/ib-math-ai-unit-1-delivery-catalog.json',import.meta.url))),entry=catalog.lessons.find(l=>l.number==='1.4');assert.equal(entry.assessment.written_marks,139);assert.deepEqual(entry.official_core_sections.map(s=>s.code),['SL 1.4','SL 1.7']);
console.log('Merged IB AI SL 1.4 + 1.7 mathematics: PASS — accumulation, loans, annuities, inflation, thresholds, 28 checks and 139 written marks.');
