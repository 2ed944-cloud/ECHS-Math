import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const paths=[
  'lessons/ib-math-ai/unit-1/data/lesson-1.6-technology-v6-foundations.js',
  'lessons/ib-math-ai/unit-1/data/lesson-1.6-technology-v6-systems.js',
  'lessons/ib-math-ai/unit-1/data/lesson-1.6-technology-v6-polynomials.js',
  'lessons/ib-math-ai/unit-1/data/lesson-1.6-technology-v6-practice.js',
  'lessons/ib-math-ai/unit-1/data/lesson-1.6-technology-v6-assessment.js',
  'lessons/ib-math-ai/unit-1/data/lesson-1.6-technology-v6-corrections.js'
];
const sources=await Promise.all(paths.map(path=>readFile(new URL(path,root),'utf8')));
const context={window:{LESSON_DATA:{lesson:{number:'1.8'},slides:[],practice:[],quiz:[],exam:[]}},console,Math,Number,String,Object,Array,Set,Map,JSON};
vm.createContext(context);
for(let index=0;index<sources.length;index++)vm.runInContext(sources[index],context,{filename:paths[index]});
const data=context.window.LESSON_DATA;
const fail=message=>{throw new Error(message)};
const expect=(condition,message)=>{if(!condition)fail(message)};
const normal=value=>String(value??'').toLowerCase().replace(/<[^>]*>/g,' ').replace(/[−–—]/g,'-').replace(/\s+/g,' ').trim();

expect(data.schemaVersion==='1.4.0',`schema ${data.schemaVersion}`);
expect(data.version==='6.0.0',`version ${data.version}`);
expect(data.lesson.number==='1.6','lesson number');
expect(data.lesson.syllabus_code==='SL 1.8','official syllabus code');
expect(data.lesson.skill_keys.join(',')==='IBAI.U1.ALGEBRA,IBAI.U1.MATRICES,IBAI.U1.MODELING','skill keys');
expect(data.slides.length===73,`expected 73 slides, found ${data.slides.length}`);
expect(data.practice.length===96,`expected 96 practice questions, found ${data.practice.length}`);
expect(data.quiz.length===14,`expected 14 quiz questions, found ${data.quiz.length}`);
expect(data.exam.length===5,`expected 5 IB tasks, found ${data.exam.length}`);
expect(data.teachingBlocks?.map(block=>block.code).join(',')==='1.6A,1.6B,1.6C,1.6D','teaching blocks');
expect(data.teachingBlocks.every(block=>block.estimatedClassroomTime==='60–75 minutes'),'teaching-block pacing');

const requiredTitles=[
  '1.6 · Technology for Equations and Systems',
  'A solution must satisfy every equation',
  'Interactive system classifier',
  'Coefficient order is part of the mathematics',
  'Residual laboratory · measure how well a candidate fits',
  'Root, zero and x-intercept are the same condition',
  'Interactive polynomial-root explorer',
  'The verification evidence chain',
  'Exit ticket · independent technology evidence'
];
const titles=data.slides.map(slide=>slide.title);
for(const title of requiredTitles)expect(titles.includes(title),`missing slide: ${title}`);
expect(new Set(titles).size===titles.length,'duplicate slide title');
for(const [index,slide] of data.slides.entries()){
  expect(slide.title&&slide.section&&slide.html&&slide.kind,`incomplete slide ${index+1}`);
  expect(!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(slide.html),`control character in slide ${index+1}`);
  expect((slide.html.match(/\\\(/g)||[]).length===(slide.html.match(/\\\)/g)||[]).length,`inline math delimiters in slide ${index+1}`);
  expect((slide.html.match(/\\\[/g)||[]).length===(slide.html.match(/\\\]/g)||[]).length,`display math delimiters in slide ${index+1}`);
}
const joinedSlides=data.slides.map(slide=>slide.html).join('\n');
for(const marker of ['data-te-lab="system"','data-te-lab="residual"','data-te-lab="polynomial"'])expect(joinedSlides.includes(marker),`missing lab marker ${marker}`);

const levels=Object.fromEntries(['Foundation','Application','Reasoning','Challenge'].map(level=>[level,data.practice.filter(item=>item.level===level).length]));
expect(Object.values(levels).every(count=>count===24),`practice levels ${JSON.stringify(levels)}`);
const allItems=[...data.practice,...data.quiz];
const ids=[...allItems.map(item=>item.id),...data.exam.map(task=>task.id)];
expect(ids.every(Boolean)&&new Set(ids).size===ids.length,'assessment IDs missing or duplicated');
const pp=data.practice.map(item=>normal(item.prompt)),qp=data.quiz.map(item=>normal(item.prompt));
expect(new Set(pp).size===pp.length,'duplicate Practice prompt');
expect(new Set(qp).size===qp.length,'duplicate Quiz prompt');
expect(!pp.some(prompt=>new Set(qp).has(prompt)),'Quiz repeats Practice prompt');
for(const item of allItems){
  expect(item.prompt&&item.answer&&item.solution,`incomplete question ${item.id}`);
  expect(Number.isInteger(item.marks)&&item.marks>0,`invalid marks ${item.id}`);
  if(item.choices){expect(Array.isArray(item.choices)&&item.choices.length>=2,`invalid choices ${item.id}`);expect(Number.isInteger(item.correct)&&item.correct>=0&&item.correct<item.choices.length,`invalid correct index ${item.id}`);}
  else expect(item.check&&['number','text'].includes(item.check.mode),`missing check contract ${item.id}`);
  for(const value of [item.prompt,item.answer,item.solution]){
    expect(!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value),`control character ${item.id}`);
    expect((value.match(/\\\(/g)||[]).length===(value.match(/\\\)/g)||[]).length,`inline math delimiters ${item.id}`);
  }
}
for(const task of data.exam){
  expect(task.context&&Array.isArray(task.parts)&&task.parts.length>=4,`incomplete task ${task.id}`);
  const total=task.parts.reduce((sum,part)=>sum+part.marks,0);
  expect(total===task.total_marks,`${task.id} totals ${total}/${task.total_marks}`);
  for(const part of task.parts)expect(part.prompt&&part.answer&&part.markscheme&&part.marks>0,`incomplete ${task.id}${part.label}`);
}

const q8=data.quiz.find(item=>item.id==='IBAI-1.6-Q08');
expect(Math.abs(q8.check.value-4.61012765154382)<1e-12,'Q08 independently recomputed root');
const cosine=data.practice.find(item=>String(item.prompt).includes('x=8\\cos x'));
expect(cosine&&Math.abs(cosine.check.value-1.395466143871871)<1e-12,'first positive x=8 cos(x) root');
expect(Math.abs((52*400-0.04*400**2)-(900+18*400)-6300)<1e-9,'break-even profit check');
expect(Math.abs((-0.04*425**2+34*425-900)-6325)<1e-9,'profit maximum check');

const wrapper=await readFile(new URL('lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.6_technology_equations_ECHS.html',root),'utf8');
const ordered=[
  'lesson-1.6-technology-v6-foundations.js',
  'lesson-1.6-technology-v6-systems.js',
  'lesson-1.6-technology-v6-polynomials.js',
  'lesson-1.6-technology-v6-practice.js',
  'lesson-1.6-technology-v6-assessment.js',
  'lesson-1.6-technology-v6-corrections.js',
  'assets/js/katex-global.js',
  'assets/js/engine.js',
  'lesson-1.6-technology-v6-interactions.js'
];
let last=-1;for(const marker of ordered){const at=wrapper.indexOf(marker);expect(at>last,`wrapper load order ${marker}`);last=at;}
expect(wrapper.includes('lesson-1.6-technology-equations-v6.css?v=6.0.0'),'Lesson 1.6 CSS link');
expect(!wrapper.includes('lesson-1.6-technology-renumber-v6.js'),'legacy renumber patch must not load');

const interactionSource=await readFile(new URL('lessons/ib-math-ai/unit-1/data/lesson-1.6-technology-v6-interactions.js',root),'utf8');
for(const marker of ['mountSystem','mountResidual','mountPolynomial','MutationObserver'])expect(interactionSource.includes(marker),`interaction implementation ${marker}`);
const css=await readFile(new URL('lessons/ib-math-ai/unit-1/assets/css/lesson-1.6-technology-equations-v6.css',root),'utf8');
for(const marker of ['--echs-access-bar-height','te-lab-shell','te-poly-shell','@media(max-height:900px)','@media(max-width:600px)'])expect(css.includes(marker),`CSS contract ${marker}`);

console.log('IB AI SL Lesson 1.6 definitive v6 validation');
console.log(JSON.stringify({slides:data.slides.length,practice:data.practice.length,levels,quiz:data.quiz.length,tasks:data.exam.length,blocks:data.teachingBlocks.length},null,2));
console.log('Status: PASS');
