import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root=path.resolve(process.argv[2]||'.');
const rel={
 base:'lessons/ib-math-ai/unit-2/data/lesson-2.2.js',
 blockA:'lessons/ib-math-ai/unit-2/data/lesson-2.2-definitive-v3-block-a.js',
 blockB:'lessons/ib-math-ai/unit-2/data/lesson-2.2-definitive-v3-block-b.js',
 blockC:'lessons/ib-math-ai/unit-2/data/lesson-2.2-definitive-v3-block-c.js',
 blockD:'lessons/ib-math-ai/unit-2/data/lesson-2.2-definitive-v3-block-d.js',
 blockE:'lessons/ib-math-ai/unit-2/data/lesson-2.2-definitive-v3-block-e.js',
 foundations:'lessons/ib-math-ai/unit-2/data/lesson-2.2-definitive-v3-foundations.js',
 practice:'lessons/ib-math-ai/unit-2/data/lesson-2.2-definitive-v3-practice.js',
 assessment:'lessons/ib-math-ai/unit-2/data/lesson-2.2-definitive-v3-assessment.js',
 ti84Data:'lessons/ib-math-ai/unit-2/data/lesson-2.2-ti84-workflows-v3.js',
 ti84Ui:'lessons/ib-math-ai/unit-2/data/lesson-2.2-ti84-classroom-ui-v3.js',
 html:'lessons/ib-math-ai/unit-2/lessons/IB_AI_SL_2.2_linear_quadratic_models_ECHS.html'
};
const read=key=>fs.readFileSync(path.join(root,rel[key]),'utf8');
const context={window:{location:{search:''}},URLSearchParams,console};context.window.window=context.window;vm.createContext(context);
for(const key of ['base','blockA','blockB','blockC','blockD','blockE','foundations','practice','assessment'])vm.runInContext(read(key),context,{filename:rel[key]});
const data=context.window.LESSON_DATA;
const fail=(condition,message)=>{if(!condition)throw new Error(message);};
const unique=(items,label)=>{const set=new Set(items);fail(set.size===items.length,`${label} contains duplicates (${items.length-set.size})`);};

fail(data.lesson.number==='2.2','wrong lesson number');
fail(data.version==='3.1.0','release version is not 3.1.0');
fail(data.scopeCollections.slides.length===80,'expected 80 total Learn screens');
fail(data.scopeCollections.slides.filter(x=>x.scope==='core').length===72,'expected 72 required Learn screens');
fail(data.scopeCollections.slides.filter(x=>x.scope==='extension').length===8,'expected 8 enrichment Learn screens');
unique(data.scopeCollections.slides.map(x=>x.title),'slide titles');
const blockCounts=Object.fromEntries(['2.2A','2.2B','2.2C','2.2D','2.2E'].map(code=>[code,data.scopeCollections.slides.filter(x=>x.teachingBlock===code).length]));
fail(Object.values(blockCounts).every(value=>value===16),`teaching blocks are not balanced: ${JSON.stringify(blockCounts)}`);
fail(data.scopeCollections.slides.every(x=>x.estimatedClassroomTime&&x.learningFocus),'slide teaching metadata missing');

const practice=data.scopeCollections.practice;
fail(practice.length===80,'expected 80 Practice questions');
fail(practice.filter(x=>x.scope==='core').length===72,'expected 72 required Practice questions');
fail(practice.filter(x=>x.scope==='extension').length===8,'expected 8 enrichment Practice questions');
for(const level of ['Foundation','Application','Reasoning','Challenge'])fail(practice.filter(x=>x.level===level).length===20,`${level} should contain 20 questions`);
for(let n=1;n<=60;n++)fail(practice.some(x=>x.id===`IBAI-2.2-P${String(n).padStart(2,'0')}`),`legacy practice P${n} missing`);
unique(practice.map(x=>x.id),'practice IDs');unique(practice.map(x=>x.prompt),'practice prompts');
fail(practice.every(x=>!String(x.calculator).includes('GDC')),'legacy GDC labels remain in Practice');

const quiz=data.scopeCollections.quiz,exam=data.scopeCollections.exam;
fail(quiz.length===14&&quiz.filter(x=>x.scope==='core').length===12&&quiz.filter(x=>x.scope==='extension').length===2,'quiz scope counts incorrect');
fail(exam.length===4&&exam.filter(x=>x.scope==='core').length===3&&exam.filter(x=>x.scope==='extension').length===1,'task scope counts incorrect');
unique(quiz.map(x=>x.id),'quiz IDs');unique(quiz.map(x=>x.prompt),'quiz prompts');unique(exam.map(x=>x.id),'task IDs');
for(const task of exam){const parts=Array.isArray(task.parts)?task.parts:[];const total=Number(task.total_marks??task.totalMarks);const sum=parts.reduce((acc,part)=>acc+Number(part.marks??part.mark??0),0);fail(sum===total,`${task.id} marks ${sum} != ${total}`);fail(parts.every(part=>part.answer&&part.markscheme),'task answer or markscheme missing');}
fail(![...practice,...quiz,...exam].some(x=>String(x.calculator||'').includes('GDC')),'legacy GDC label remains');

const ti=read('ti84Data')+read('ti84Ui'),html=read('html');
for(const token of ['2:zero','4:maximum','5:intersect','TBLSET','Left Bound','Right Bound','First curve','Second curve','TblStart = 9','ΔTbl = 1','https://ti84calc.com/ti84calc','data-ti84-workflow','sandbox="allow-scripts allow-same-origin allow-forms allow-popups"'])fail(ti.includes(token),`TI-84 contract token missing: ${token}`);
for(const key of ['zero','maximum','intersect','table'])fail(ti.includes(`${key}:{`),`TI-84 workflow ${key} missing`);
fail(!ti.includes('ECHS GDC'),'ECHS GDC must not be present');
for(const key of ['blockA','blockB','blockC','blockD','blockE','foundations','practice','assessment','ti84Data','ti84Ui']){const asset=path.basename(rel[key]);fail(html.includes(asset),`HTML does not load ${asset}`);}

const approx=(a,b,t=1e-6)=>Math.abs(a-b)<=t;
const disc=Math.sqrt(18**2-4*(-4.9)*1.5);const roots=[(-18+disc)/(2*-4.9),(-18-disc)/(2*-4.9)].sort((a,b)=>a-b);
fail(approx(roots[0],-0.08148,1e-4)&&approx(roots[1],3.7550,1e-4),'projectile TI-84 roots incorrect');
fail(approx(-800/(2*-20),20)&&approx(-20*20**2+800*20,8000),'maximum workflow mathematics incorrect');
const xs=[4-2*Math.sqrt(3),4+2*Math.sqrt(3)];fail(approx(xs[0],0.535898,1e-6)&&approx(xs[1],7.464102,1e-6),'intersection x-values incorrect');
const C=n=>.5*n*n+8*n+20;fail(C(10)===150&&C(11)===168.5,'table threshold values incorrect');

console.log(JSON.stringify({release:data.version,learn:{required:72,total:80},practice:{required:72,total:80,levels:20},quiz:{required:12,total:14},tasks:{required:3,total:4},blocks:blockCounts,ti84:['zero','maximum','intersect','table']},null,2));
