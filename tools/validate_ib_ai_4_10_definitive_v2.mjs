#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const unit=path.join(root,'lessons','ib-math-ai','unit-4');
const dataDir=path.join(unit,'data');
const htmlPath=path.join(unit,'lessons','IB_AI_SL_4.10_binomial_distribution_repeated_trials_ECHS.html');
const cssPath=path.join(unit,'assets','css','lesson-4.10-v2.css');
const modules=[
 'lesson-4.10-v2-core-base.js','lesson-4.10-v2-core-slides-a.js','lesson-4.10-v2-core-slides-b.js','lesson-4.10-v2-core-slides-c.js','lesson-4.10-v2-core-slides-d.js','lesson-4.10-v2-core-finalize.js',
 'lesson-4.10-v2-assessment-base.js','lesson-4.10-v2-practice-a.js','lesson-4.10-v2-practice-b.js','lesson-4.10-v2-practice-c.js','lesson-4.10-v2-practice-d.js','lesson-4.10-v2-assessment-exam.js','lesson-4.10-v2-assessment-quiz.js'
];
const runtime=['lesson-4.10-v2-runtime-graphics.js','lesson-4.10-v2-runtime-labs.js','lesson-4.10-v2-runtime-ui.js'];
let assertions=0;const failures=[];
function check(condition,message){assertions++;if(!condition)failures.push(message)}
function near(a,b,tol=1e-10){return Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=tol}
function norm(s){return String(s??'').toLowerCase().replace(/\\\(|\\\)|\\\[|\\\]/g,' ').replace(/<[^>]*>/g,' ').replace(/[^a-z0-9]+/g,' ').trim()}
function allStrings(value,trail='$',out=[]){if(typeof value==='string')out.push([trail,value]);else if(Array.isArray(value))value.forEach((v,i)=>allStrings(v,`${trail}[${i}]`,out));else if(value&&typeof value==='object')Object.entries(value).forEach(([k,v])=>allStrings(v,`${trail}.${k}`,out));return out}
function count(s,needle){let n=0,i=0;while((i=s.indexOf(needle,i))!==-1){n++;i+=needle.length}return n}

for(const f of [...modules,...runtime]){
 const p=path.join(dataDir,f);check(fs.existsSync(p),`Missing module: ${f}`);
 if(fs.existsSync(p)){const src=fs.readFileSync(p,'utf8');check(src.trim().length>100,`Module unexpectedly short: ${f}`);try{new vm.Script(src,{filename:f});check(true,`Syntax: ${f}`)}catch(e){check(false,`Syntax error in ${f}: ${e.message}`)}}
}
check(fs.existsSync(htmlPath),'Lesson HTML exists');check(fs.existsSync(cssPath),'Lesson CSS exists');

const context={window:{LESSON_DATA:{lesson:{number:'4.10'},unit:{number:4,title:'Statistics and Probability'},slides:[],practice:[],exam:[],quiz:[]}},console:{log(){},warn(){},error(){}}};
vm.createContext(context);
for(const f of modules){try{vm.runInContext(fs.readFileSync(path.join(dataDir,f),'utf8'),context,{filename:f});check(true,`Executed ${f}`)}catch(e){check(false,`Execution failed in ${f}: ${e.stack||e.message}`)}}
const data=context.window.LESSON_DATA,U=context.window.U410?.U;
check(Boolean(U),'Binomial numerical API exported');
check(data.schemaVersion==='4.10.2','Schema version is 4.10.2');
check(data.version==='2.0.0','Release version is 2.0.0');
check(data.lesson?.number==='4.10','Lesson number remains 4.10');
check(data.lesson?.title==='Binomial Distribution and Repeated Trials','Lesson title is definitive');
check(data.lesson?.lesson_key==='u4-distributions-binomial','Stable production lesson_key preserved');
check(Array.isArray(data.lesson?.objectives)&&data.lesson.objectives.length===10,'Ten explicit learning objectives');

// Structural content audit
check(data.slides.length===64,`Expected 64 slides; found ${data.slides.length}`);
const slideIds=new Set();
for(const [i,s] of data.slides.entries()){
 check(typeof s.id==='string'&&s.id.length>1,`Slide ${i+1} has an id`);check(!slideIds.has(s.id),`Unique slide id: ${s.id}`);slideIds.add(s.id);
 check(typeof s.section==='string'&&s.section.length>0,`Slide ${s.id} has section`);check(typeof s.title==='string'&&s.title.length>2,`Slide ${s.id} has title`);check(typeof s.kind==='string'&&s.kind.length>0,`Slide ${s.id} has kind`);check(typeof s.html==='string'&&s.html.length>20,`Slide ${s.id} has substantive HTML`);
}
check(slideIds.has('cover')&&slideIds.has('event-lab')&&slideIds.has('exit'),'Cover, interactive event lab, and exit ticket present');

check(data.practice.length===80,`Expected 80 practice questions; found ${data.practice.length}`);
const expectedLevels={Foundation:16,Application:20,Reasoning:18,Challenge:14,HOT:12},actualLevels={};
const practiceIds=new Set(),practicePrompts=new Set();
for(const [i,q] of data.practice.entries()){
 actualLevels[q.level]=(actualLevels[q.level]||0)+1;
 const expected=`IBAI-U4-L4-10-P${String(i+1).padStart(3,'0')}`;check(q.id===expected,`Stable practice id ${expected}`);check(!practiceIds.has(q.id),`Unique practice id ${q.id}`);practiceIds.add(q.id);
 const np=norm(q.prompt);check(np.length>8,`Substantive prompt ${q.id}`);check(!practicePrompts.has(np),`Unique practice prompt ${q.id}`);practicePrompts.add(np);
 check(['mcq','numeric','short'].includes(q.type),`Known question type ${q.id}`);check(Number.isFinite(q.marks)&&q.marks>0,`Positive marks ${q.id}`);check(typeof q.solution==='string'&&q.solution.length>4,`Solution supplied ${q.id}`);
 if(q.type==='mcq'){check(Array.isArray(q.choices)&&q.choices.length>=3,`Choices supplied ${q.id}`);check(Number.isInteger(q.correct_index)&&q.correct_index>=0&&q.correct_index<q.choices.length,`Valid correct index ${q.id}`);check(q.answer===q.choices[q.correct_index],`Answer matches correct choice ${q.id}`)}
 if(q.type==='numeric'){check(Number.isFinite(q.numeric_answer),`Finite numeric answer ${q.id}`);check(Number.isFinite(q.tolerance)&&q.tolerance>=0,`Valid tolerance ${q.id}`)}
 if(q.type==='short')check(typeof q.answer==='string'&&q.answer.length>2,`Short answer supplied ${q.id}`);
}
for(const [level,n] of Object.entries(expectedLevels))check(actualLevels[level]===n,`${level} count ${n}`);
check(JSON.stringify(data.practice_levels)===JSON.stringify(expectedLevels),'Published practice-level counts match content');

check(data.exam.length===5,`Expected 5 IB tasks; found ${data.exam.length}`);
const examIds=new Set();
for(const t of data.exam){check(!examIds.has(t.id),`Unique exam id ${t.id}`);examIds.add(t.id);check(Array.isArray(t.parts)&&t.parts.length>=5,`Multi-part exam task ${t.id}`);check(t.parts.reduce((s,p)=>s+Number(p.marks||0),0)===t.total_marks,`Mark total correct for ${t.id}`);for(const p of t.parts){check(typeof p.prompt==='string'&&p.prompt.length>4,`Exam prompt ${t.id}${p.label}`);check(typeof p.answer==='string'&&p.answer.length>0,`Exam answer ${t.id}${p.label}`);check(typeof p.solution==='string'&&p.solution.length>3,`Exam solution ${t.id}${p.label}`)}}
const hidden=data.exam.find(t=>t.id.endsWith('IB4'));check(hidden?.parts.find(p=>p.label==='d')?.answer==='9 and 10','Recovered-model task records both modes 9 and 10');

check(data.quiz.length===12,`Expected 12 quiz questions; found ${data.quiz.length}`);
const quizIds=new Set(),quizPrompts=new Set();
for(const [i,q] of data.quiz.entries()){
 const expected=`IBAI-U4-L4-10-Q${String(i+1).padStart(3,'0')}`;check(q.id===expected,`Stable quiz id ${expected}`);check(!quizIds.has(q.id),`Unique quiz id ${q.id}`);quizIds.add(q.id);const np=norm(q.prompt);check(!quizPrompts.has(np),`Unique quiz prompt ${q.id}`);quizPrompts.add(np);check(!practicePrompts.has(np),`Quiz is independent from Practice Studio: ${q.id}`);if(q.type==='numeric'){check(Number.isFinite(q.numeric_answer),`Finite quiz answer ${q.id}`);check(q.tolerance>=0,`Quiz tolerance ${q.id}`)}else{check(q.answer===q.choices[q.correct_index],`Quiz MCQ key ${q.id}`)}}

// Text and KaTeX sanity
const strings=allStrings(data);
for(const [trail,s] of strings){
 const low=s.toLowerCase();check(!/\b(todo|lorem ipsum|tbd)\b/.test(low),`No placeholder text at ${trail}`);check(!/\bundefined\b/.test(low),`No undefined text at ${trail}`);check(!/\bnan\b/.test(low),`No NaN text at ${trail}`);
 check(count(s,'\\(')===count(s,'\\)'),`Balanced inline KaTeX delimiters at ${trail}`);check(count(s,'\\[')===count(s,'\\]'),`Balanced display KaTeX delimiters at ${trail}`);
}

// Exact probability engine audit on a broad grid
const ps=[0,.001,.01,.03,.08,.2,.35,.5,.72,.9,.99,1];
const ns=[...Array.from({length:31},(_,i)=>i),40,50,60,75,100,120];
for(const n of ns)for(const p of ps){
 const d=U.dist(n,p);check(d.length===n+1,`Distribution length n=${n}, p=${p}`);let sum=0,mean=0,second=0,prev=-1e-15;
 for(let k=0;k<=n;k++){
  const q=d[k].p;sum+=q;mean+=k*q;second+=k*k*q;check(Number.isFinite(q)&&q>=-1e-15&&q<=1+1e-15,`PMF range n=${n},p=${p},k=${k}`);check(near(q,U.pmf(n,p,k),2e-12),`PMF consistency n=${n},p=${p},k=${k}`);check(d[k].cdf+2e-14>=prev,`CDF monotonic n=${n},p=${p},k=${k}`);prev=d[k].cdf;check(near(d[k].cdf,U.cdf(n,p,k),2e-11),`CDF consistency n=${n},p=${p},k=${k}`);
  check(near(U.event(n,p,'exact',k),q,2e-12),`Exact-event identity n=${n},p=${p},k=${k}`);check(near(U.event(n,p,'atMost',k),U.cdf(n,p,k),2e-12),`At-most identity n=${n},p=${p},k=${k}`);check(near(U.event(n,p,'lessThan',k),U.cdf(n,p,k-1),2e-12),`Less-than identity n=${n},p=${p},k=${k}`);check(near(U.event(n,p,'atLeast',k),1-U.cdf(n,p,k-1),3e-12),`At-least identity n=${n},p=${p},k=${k}`);check(near(U.event(n,p,'moreThan',k),1-U.cdf(n,p,k),3e-12),`More-than identity n=${n},p=${p},k=${k}`);
 }
 const variance=second-mean*mean;check(near(sum,1,2e-11),`PMF normalization n=${n},p=${p}`);check(near(mean,U.mean(n,p),3e-10),`Mean identity n=${n},p=${p}`);check(near(variance,U.variance(n,p),3e-8),`Variance identity n=${n},p=${p}`);check(near(d[n].cdf,1,2e-12),`CDF endpoint n=${n},p=${p}`);
 const modes=U.modes(n,p),max=Math.max(...d.map(r=>r.p));for(const m of modes)check(near(d[m].p,max,3e-12),`Mode reaches PMF maximum n=${n},p=${p},m=${m}`);
 for(let a=0;a<=n;a+=Math.max(1,Math.floor(n/7)||1)){const b=Math.min(n,a+Math.max(0,Math.floor(n/4)));check(near(U.event(n,p,'between',a,b),U.range(n,p,a,b),3e-11),`Interval identity n=${n},p=${p},a=${a},b=${b}`)}
}

// PMF recurrence, parameter recovery, and threshold minimality
for(const n of [1,2,5,10,25,60,120])for(const p of [.01,.08,.25,.4,.5,.72,.95])for(let k=0;k<n;k++){const a=U.pmf(n,p,k),b=U.pmf(n,p,k+1),ratio=((n-k)/(k+1))*(p/(1-p));if(a>1e-290&&p<1)check(near(b/a,ratio,2e-9*Math.max(1,ratio)),`PMF recurrence n=${n},p=${p},k=${k}`)}
for(const [n,p] of [[8,.25],[19,.25],[24,.4],[30,.6],[60,.03],[100,.99]]){const mu=U.mean(n,p),v=U.variance(n,p),r=U.recover(mu,v);check(r.valid&&r.n===n&&near(r.p,p,2e-12),`Recover n=${n}, p=${p}`)}
for(const p of [.001,.01,.03,.08,.1,.2,.5,.8])for(const target of [.5,.8,.9,.95,.99,.999]){const n=U.thresholdAtLeastOne(p,target),at=1-(1-p)**n,before=1-(1-p)**(n-1);check(Number.isInteger(n)&&n>=1,`Integer threshold p=${p}, target=${target}`);check(at+2e-13>=target,`Threshold reaches target p=${p}, target=${target}`);check(before<target+2e-13,`Threshold is minimal p=${p}, target=${target}`)}

// Hypergeometric audit
for(const [N,K,n] of [[30,12,10],[120,30,12],[200,20,15],[800,64,20]]){let s=0,mean=0;for(let x=0;x<=n;x++){const q=U.hypergeomPmf(N,K,n,x);check(Number.isFinite(q)&&q>=0&&q<=1,`Hypergeometric range N=${N},K=${K},n=${n},x=${x}`);s+=q;mean+=x*q}check(near(s,1,2e-10),`Hypergeometric normalization N=${N},K=${K},n=${n}`);check(near(mean,n*K/N,2e-9),`Hypergeometric mean N=${N},K=${K},n=${n}`)}

// Static integration audit
const html=fs.readFileSync(htmlPath,'utf8'),css=fs.readFileSync(cssPath,'utf8'),graphics=fs.readFileSync(path.join(dataDir,runtime[0]),'utf8'),labs=fs.readFileSync(path.join(dataDir,runtime[1]),'utf8'),ui=fs.readFileSync(path.join(dataDir,runtime[2]),'utf8');
check(html.includes('class="unit4-lesson-4-10-v2"'),'Definitive body class wired');check(html.includes('64 learning slides'),'Drawer slide count updated');check(html.includes('unit-1-ti84-simulator-v7.css'),'Shared TI-84 panel CSS wired');check(labs.includes('focused simulator')&&ui.includes('ti84calc.com/ti84calc'),'Local verified coach and full key-practice simulator wired');
let last=-1;for(const f of [...modules,'lesson-4.10-v2-runtime-graphics.js','lesson-4.10-v2-runtime-labs.js','lesson-4.10-v2-runtime-ui.js']){const i=html.indexOf(f);check(i>last,`HTML module order includes ${f}`);last=i}
const plotKeys=[...new Set(data.slides.flatMap(s=>[...s.html.matchAll(/data-u410-plot="([^"]+)"/g)].map(m=>m[1])))];check(plotKeys.length>=30,`At least 30 distinct exact graphics (${plotKeys.length})`);for(const k of plotKeys)check(graphics.includes(k),`Plot renderer recognizes ${k}`);
const labKeys=[...new Set(data.slides.flatMap(s=>[...s.html.matchAll(/data-u410-lab="([^"]+)"/g)].map(m=>m[1])))];check(labKeys.length>=6,`Six embedded interactive labs (${labKeys.length})`);for(const k of labKeys)check(labs.includes(`${k}:`)||labs.includes(`'${k}'`)||labs.includes(`"${k}"`),`Lab renderer recognizes ${k}`);
check((css.match(/\{/g)||[]).length===(css.match(/\}/g)||[]).length,'CSS braces balanced');check(css.includes('@media(max-width:560px)'),'Mobile CSS present');check(css.includes('@media print'),'Print CSS present');check(css.includes('.u410-ti-shell'),'Focused TI-84 CSS present');

// Canvas runtime smoke test: execute every plot renderer against a strict no-op Canvas 2D surface.
function fakeCanvasNode(key){
 let operations=0;
 const ctx={
  setTransform(){operations++},clearRect(){operations++},beginPath(){operations++},moveTo(){operations++},lineTo(){operations++},stroke(){operations++},fill(){operations++},fillRect(){operations++},arc(){operations++},arcTo(){operations++},closePath(){operations++},save(){operations++},restore(){operations++},setLineDash(){operations++},roundRect(){operations++},fillText(){operations++}
 };
 const canvas={style:{},width:0,height:0,setAttribute(){operations++},getContext(type){check(type==='2d',`Canvas requests 2d context for ${key}`);return ctx}};
 const node={clientWidth:760,dataset:{u410Plot:key},querySelector(sel){return sel==='canvas'?canvas:null},set innerHTML(v){this._html=v},get innerHTML(){return this._html||''}};
 return{node,canvas,get operations(){return operations}};
}
const fakeDocument={readyState:'loading',addEventListener(){},querySelector(){return null},querySelectorAll(){return[]},body:{}};
const runtimeContext={window:{LESSON_DATA:data,U410:context.window.U410,devicePixelRatio:2},document:fakeDocument,console:{log(){},warn(){},error(){}},setTimeout,clearTimeout};
runtimeContext.window.window=runtimeContext.window;vm.createContext(runtimeContext);
try{vm.runInContext(graphics,runtimeContext,{filename:runtime[0]});check(Boolean(runtimeContext.window.U410_RUNTIME),'Graphics runtime exports API')}catch(e){check(false,`Graphics runtime initialization: ${e.stack||e.message}`)}
const graphicsApi=runtimeContext.window.U410_RUNTIME;
if(graphicsApi){for(const key of plotKeys){const f=fakeCanvasNode(key);try{graphicsApi.mountPlot(f.node);check(f.canvas.width>0&&f.canvas.height>0,`Canvas dimensions for ${key}`);check(f.operations>20,`Canvas issued drawing operations for ${key}`)}catch(e){check(false,`Plot ${key} threw during Canvas smoke test: ${e.message}`)}}}
try{vm.runInContext(labs,runtimeContext,{filename:runtime[1]});check(typeof runtimeContext.window.U410_RUNTIME?.simulator==='function','Focused TI-84 simulator function exported')}catch(e){check(false,`Labs runtime initialization: ${e.stack||e.message}`)}
try{vm.runInContext(ui,runtimeContext,{filename:runtime[2]});check(Boolean(runtimeContext.window.ECHS_IB_AI_4_10_TI84),'TI-84 UI runtime exports API')}catch(e){check(false,`TI-84 UI runtime initialization: ${e.stack||e.message}`)}

if(failures.length){console.error(`FAIL · ${failures.length} of ${assertions.toLocaleString()} assertions failed.`);for(const f of failures.slice(0,100))console.error(` - ${f}`);if(failures.length>100)console.error(` - … ${failures.length-100} more`);process.exit(1)}
console.log(`PASS · Lesson 4.10 definitive content, binomial mathematics, assessment schema, graphics/labs routing, TI-84 integration, and static deployment passed ${assertions.toLocaleString()} assertions.`);
