import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root=path.resolve(process.argv[2]||'.');
const rel={
  build:'lessons/ib-math-ai/unit-2/data/lesson-2.2-v5-build.js',
  compat:'lessons/ib-math-ai/unit-2/data/lesson-2.2-v5-compat.js',
  a:'lessons/ib-math-ai/unit-2/data/lesson-2.2-v5-content-a.js',
  b:'lessons/ib-math-ai/unit-2/data/lesson-2.2-v5-content-b.js',
  c:'lessons/ib-math-ai/unit-2/data/lesson-2.2-v5-content-c.js',
  finalize:'lessons/ib-math-ai/unit-2/data/lesson-2.2-v5-finalize.js',
  practiceA:'lessons/ib-math-ai/unit-2/data/lesson-2.2-v5-practice-a.js',
  practiceB:'lessons/ib-math-ai/unit-2/data/lesson-2.2-v5-practice-b.js',
  assessment:'lessons/ib-math-ai/unit-2/data/lesson-2.2-v5-assessment.js',
  precision:'lessons/ib-math-ai/unit-2/data/lesson-2.2-v5-precision.js',
  graphics:'lessons/ib-math-ai/unit-2/data/lesson-2.2-v5-graphics.js',
  visualPrecision:'lessons/ib-math-ai/unit-2/data/lesson-2.2-v5-visual-precision.js',
  interactions:'lessons/ib-math-ai/unit-2/data/lesson-2.2-v5-interactions.js',
  ti84:'lessons/ib-math-ai/unit-2/data/lesson-2.2-v5-ti84.js',
  autoload:'lessons/ib-math-ai/unit-2/data/lesson-2.2-v5-ti84-autoload.js',
  html:'lessons/ib-math-ai/unit-2/lessons/IB_AI_SL_2.2_linear_quadratic_models_ECHS.html'
};
const read=key=>fs.readFileSync(path.join(root,rel[key]),'utf8');
const context={window:{},console};context.window.window=context.window;vm.createContext(context);
for(const key of ['build','compat','a','b','c','finalize','practiceA','practiceB','assessment','precision'])vm.runInContext(read(key),context,{filename:rel[key]});
const data=context.window.LESSON_DATA;
const fail=(condition,message)=>{if(!condition)throw new Error(message);};
const unique=(values,label)=>fail(new Set(values).size===values.length,`${label} contains duplicates`);
const allText=[];
const collect=value=>{if(value==null)return;if(typeof value==='string')allText.push(value);else if(Array.isArray(value))value.forEach(collect);else if(typeof value==='object')Object.values(value).forEach(collect);};
collect(data.slides);collect(data.practice);collect(data.quiz);collect(data.exam);

fail(data.version==='5.0.0','release is not 5.0.0');
fail(data.lesson.number==='2.2','wrong lesson number');
fail(data.slides.length===80,`expected 80 Learn screens, received ${data.slides.length}`);
fail(data.practice.length===80,`expected 80 Practice questions, received ${data.practice.length}`);
fail(data.quiz.length===16,`expected 16 Quiz questions, received ${data.quiz.length}`);
fail(data.exam.length===6,`expected 6 IB tasks, received ${data.exam.length}`);
unique(data.slides.map(item=>item.title),'slide titles');
unique(data.practice.map(item=>item.id),'practice IDs');unique(data.practice.map(item=>item.prompt),'practice prompts');
unique(data.quiz.map(item=>item.id),'quiz IDs');unique(data.quiz.map(item=>item.prompt),'quiz prompts');
unique(data.exam.map(item=>item.id),'task IDs');
for(const level of ['Foundation','Application','Reasoning','Challenge'])fail(data.practice.filter(item=>item.level===level).length===20,`${level} should contain 20 Practice questions`);
fail(data.slides.every(item=>item.section&&item.title&&item.kind&&item.html),'slide metadata is incomplete');
fail(data.lesson.teaching_blocks.length===6,'expected six teaching blocks');
for(const task of data.exam){const total=task.parts.reduce((sum,part)=>sum+Number(part.marks||0),0);fail(total===task.total_marks,`${task.id} marks ${total} != ${task.total_marks}`);fail(task.parts.every(part=>part.answer&&part.markscheme),`${task.id} is missing an answer or markscheme`);}

for(const text of allText){
  fail(!/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(text),'control character found in lesson content');
  fail(!/▲rac|\brac\{|▲qrt|\bqrt\{|extQAR|\\pm\\sqrt\{[^}]*$/.test(text),`malformed mathematics token found: ${text.slice(0,100)}`);
  const pairs=[['\\(', '\\)'],['\\[','\\]']];
  for(const [open,close] of pairs){const a=(text.match(new RegExp(open.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'))||[]).length;const b=(text.match(new RegExp(close.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'))||[]).length;fail(a===b,`unbalanced math delimiters in: ${text.slice(0,120)}`);}
}
fail(!allText.join('\n').includes('ECHS GDC'),'ECHS GDC must not appear');

const graphics=read('graphics')+read('visualPrecision');
const visualIds=[...new Set(data.slides.flatMap(slide=>[...slide.html.matchAll(/data-lq5-visual="([^"]+)"/g)].map(match=>match[1])))];
for(const id of visualIds)fail(graphics.includes(`case '${id}'`)||graphics.includes(`data-lq5-visual=\"${id}\"`)||graphics.includes(`[data-lq5-visual="${id}"]`),`visual renderer missing for ${id}`);
fail(!graphics.includes('lq5-visual-placeholder')||visualIds.every(id=>graphics.includes(`case '${id}'`)||read('visualPrecision').includes(`data-lq5-visual="${id}"`)),'a used visual would fall back to the placeholder');

const byId=(items,id)=>items.find(item=>item.id===id);
fail(byId(data.practice,'IBAI-2.2-V5-P068').answer.includes('m=0'),'tangency correction P068 missing');
fail(byId(data.practice,'IBAI-2.2-V5-P069').answer.includes('sqrt{22}'),'exact intersection correction P069 missing');
fail(byId(data.practice,'IBAI-2.2-V5-P072').check.value===25,'threshold correction P072 missing');
fail(byId(data.quiz,'IBAI-2.2-V5-Q12').solution.includes('6.61'),'quiz threshold precision correction missing');
fail(byId(data.exam,'IBAI-2.2-V5-T2').parts.find(part=>part.label==='d').answer.includes('3.49'),'bridge-clearance precision correction missing');
fail(data.slides.some(slide=>slide.html.includes('6.25')&&slide.title.includes('Paper 2 synthesis')),'fountain maximum 6.25 missing');

const approx=(a,b,t=1e-6)=>Math.abs(a-b)<=t;
const disc=Math.sqrt(18**2-4*(-4.9)*1.5);const roots=[(-18+disc)/(2*-4.9),(-18-disc)/(2*-4.9)].sort((x,y)=>x-y);
fail(approx(roots[0],-0.08148,1e-4)&&approx(roots[1],3.7550,1e-4),'projectile roots are incorrect');
fail(approx(-800/(2*-20),20)&&approx(-20*20**2+800*20,8000),'revenue maximum is incorrect');
const ix=[4-2*Math.sqrt(3),4+2*Math.sqrt(3)];fail(approx(ix[0],0.535898,1e-6)&&approx(ix[1],7.464102,1e-6),'line-quadratic intersections are incorrect');
const C=n=>.5*n*n+8*n+20;fail(C(10)===150&&C(11)===168.5,'threshold table values are incorrect');
fail(approx(-.25*5**2+2.5*5,6.25),'fountain maximum is incorrect');

const ti=read('ti84')+read('autoload');
for(const token of ['2:zero','4:maximum','3:minimum','5:intersect','TBLSET','Left Bound','Right Bound','First curve','Second curve','TblStart=9','ΔTbl=1','https://ti84calc.com/ti84calc','Teacher demo','Students follow','Exam drill','sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups allow-modals allow-downloads"'])fail(ti.includes(token),`TI-84 contract token missing: ${token}`);
fail(!ti.includes('ECHS GDC'),'TI file contains ECHS GDC');

const html=read('html');
for(const key of ['build','compat','a','b','c','finalize','practiceA','practiceB','assessment','precision','graphics','visualPrecision','interactions','ti84','autoload'])fail(html.includes(path.basename(rel[key])),`HTML does not load ${path.basename(rel[key])}`);
fail(!/lesson-2\.2-definitive-v3|lesson-2\.2-ti84-workflows-v3|lesson-2\.2-ti84-classroom-ui-v3/.test(html),'old v3 runtime remains loaded');

console.log(JSON.stringify({release:data.version,slides:data.slides.length,practice:data.practice.length,levels:Object.fromEntries(['Foundation','Application','Reasoning','Challenge'].map(level=>[level,data.practice.filter(item=>item.level===level).length])),quiz:data.quiz.length,tasks:data.exam.length,visuals:visualIds.length,ti84:['zero','minimum','maximum','intersect','table']},null,2));
