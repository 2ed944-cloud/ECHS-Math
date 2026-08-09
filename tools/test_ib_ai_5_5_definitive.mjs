import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import zlib from 'node:zlib';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const unit=path.join(root,'lessons/ib-math-ai/unit-5');
const dataDir=path.join(unit,'data');
const lessonPath=path.join(unit,'lessons/IB_AI_SL_5.5_optimisation_modelling_ECHS.html');
const loaderPath=path.join(dataDir,'lesson-5.5.js');
const packageDir=path.join(dataDir,'lesson-5.5-package');
const chunkFiles=fs.readdirSync(packageDir).filter(name=>/^chunk-\d+\.b64$/.test(name)).sort();

for(const file of [lessonPath,loaderPath,...chunkFiles.map(file=>path.join(packageDir,file))]){
  assert.ok(fs.existsSync(file),`Missing required file: ${path.relative(root,file)}`);
  assert.ok(fs.statSync(file).size>100,`Unexpectedly small required file: ${path.relative(root,file)}`);
}
assert.deepEqual(chunkFiles,['chunk-00.b64','chunk-01.b64','chunk-02.b64','chunk-03.b64']);
const encoded=chunkFiles.map(file=>fs.readFileSync(path.join(packageDir,file),'utf8').replace(/\s+/g,'')).join('');
const pack=JSON.parse(zlib.gunzipSync(Buffer.from(encoded,'base64')).toString('utf8'));
assert.equal(pack.schema,'echs-ib-ai-5.5-package-v1');
assert.equal(pack.version,'5.5.0');
assert.equal(pack.preEngine.length,7);
assert.equal(pack.postEngine.length,3);
assert.equal(pack.moduleNames.preEngine.length,7);
assert.deepEqual(pack.moduleNames.postEngine,['lesson-5.5-v1-graphics.js','lesson-5.5-v1-interactions.js','lesson-5.5-v1-ti84.js']);

const context=vm.createContext({window:{},console,URLSearchParams,Math,Date,JSON,String,Number,Array,Object,Set,Map,RegExp});
pack.preEngine.forEach((source,index)=>new vm.Script(source,{filename:pack.moduleNames.preEngine[index]}).runInContext(context));
const d=context.window.LESSON_DATA;
assert.ok(d,'LESSON_DATA was not created.');
assert.equal(d.course,'IB Mathematics: Applications and Interpretation SL');
assert.deepEqual(JSON.parse(JSON.stringify(d.unit)),{number:5,title:'Calculus'});
assert.equal(d.lesson.number,'5.5');
assert.equal(d.lesson.title,'Optimisation and Modelling');
assert.equal(d.lesson.skill_keys[0],'IBAI.U5.OPTIMIZATION');

assert.equal(d.slides.length,80,'Expected 80 Learn screens.');
assert.equal(d.practice.length,80,'Expected 80 Practice Studio questions.');
assert.equal(d.quiz.length,16,'Expected 16 independent quiz questions.');
assert.equal(d.exam.length,6,'Expected 6 IB-style extended tasks.');
assert.deepEqual(Object.fromEntries(['Foundation','Application','Reasoning','Challenge'].map(level=>[level,d.practice.filter(q=>q.level===level).length])),{Foundation:20,Application:20,Reasoning:20,Challenge:20});
assert.equal(d.counts.slides,80);
assert.equal(d.counts.practice,80);
assert.equal(d.counts.quiz,16);
assert.equal(d.counts.exam,6);

const nonEmpty=(value,label)=>assert.ok(typeof value==='string'&&value.trim(),`${label} must be a non-empty string.`);
d.slides.forEach((slide,index)=>{
  nonEmpty(slide.section,`slides[${index}].section`);
  nonEmpty(slide.title,`slides[${index}].title`);
  nonEmpty(slide.kind,`slides[${index}].kind`);
  nonEmpty(slide.html,`slides[${index}].html`);
});

const allowedLevels=new Set(['Foundation','Application','Reasoning','Challenge','Quiz']);
const allowedCalculator=new Set(['No calculator needed','TI-84 permitted','TI-84 expected']);
const allQuestions=[...d.practice,...d.quiz];
allQuestions.forEach((q,index)=>{
  nonEmpty(q.id,`question[${index}].id`);nonEmpty(q.command,`${q.id}.command`);nonEmpty(q.prompt,`${q.id}.prompt`);nonEmpty(q.answer,`${q.id}.answer`);nonEmpty(q.solution,`${q.id}.solution`);
  assert.ok(allowedLevels.has(q.level),`${q.id}: invalid level ${q.level}`);
  assert.ok(allowedCalculator.has(q.calculator),`${q.id}: invalid calculator label ${q.calculator}`);
  assert.ok(Number.isInteger(q.marks)&&q.marks>0,`${q.id}: marks must be a positive integer.`);
  if(Array.isArray(q.choices)){
    assert.ok(q.choices.length>=3,`${q.id}: too few choices.`);
    assert.ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<q.choices.length,`${q.id}: invalid correct choice index.`);
    assert.equal(q.answer,q.choices[q.correct],`${q.id}: answer must equal correct choice.`);
  }
});

const ids=[...allQuestions.map(q=>q.id),...d.exam.map(t=>t.id)];
assert.equal(new Set(ids).size,ids.length,'Assessment IDs must be globally unique inside Lesson 5.5.');
const normalizedPrompt=value=>String(value).toLowerCase().replace(/<[^>]+>/g,' ').replace(/\[()[\]]/g,' ').replace(/\s+/g,' ').trim();
const promptKeys=allQuestions.map(q=>normalizedPrompt(q.prompt));
assert.equal(new Set(promptKeys).size,promptKeys.length,'Practice and quiz prompts must not be duplicated.');

let computedMarks=0;
d.exam.forEach(task=>{
  nonEmpty(task.id,`${task.title}.id`);nonEmpty(task.title,`${task.id}.title`);nonEmpty(task.style,`${task.id}.style`);nonEmpty(task.calculator,`${task.id}.calculator`);nonEmpty(task.context,`${task.id}.context`);
  assert.ok(Array.isArray(task.parts)&&task.parts.length>=3,`${task.id}: expected a multi-part IB task.`);
  const sum=task.parts.reduce((total,part)=>{
    nonEmpty(part.label,`${task.id}.part.label`);nonEmpty(part.prompt,`${task.id}.${part.label}.prompt`);nonEmpty(part.answer,`${task.id}.${part.label}.answer`);nonEmpty(part.markscheme,`${task.id}.${part.label}.markscheme`);
    assert.ok(Number.isInteger(part.marks)&&part.marks>0,`${task.id}.${part.label}: invalid marks.`);
    return total+part.marks;
  },0);
  assert.equal(task.total_marks,sum,`${task.id}: total_marks does not match the sum of parts.`);
  computedMarks+=sum;
});
assert.equal(computedMarks,103,'Unexpected total marks across IB tasks.');
assert.equal(d.audit.assessmentMarks,103);

function walkStrings(value,visit,pathName='root'){
  if(typeof value==='string'){visit(value,pathName);return;}
  if(Array.isArray(value)){value.forEach((item,index)=>walkStrings(item,visit,`${pathName}[${index}]`));return;}
  if(value&&typeof value==='object'){for(const [key,item] of Object.entries(value))walkStrings(item,visit,`${pathName}.${key}`);}
}
const controls=[];
const mathErrors=[];
walkStrings({slides:d.slides,practice:d.practice,quiz:d.quiz,exam:d.exam},(value,label)=>{
  if(/[\u0000-\u0009\u000b\u000c\u000e-\u001f]/.test(value))controls.push(label);
  const counts={openInline:(value.match(/\\\(/g)||[]).length,closeInline:(value.match(/\\\)/g)||[]).length,openDisplay:(value.match(/\\\[/g)||[]).length,closeDisplay:(value.match(/\\\]/g)||[]).length};
  if(counts.openInline!==counts.closeInline||counts.openDisplay!==counts.closeDisplay)mathErrors.push({label,counts});
});
assert.deepEqual(controls,[],'Control characters found in student-facing strings.');
assert.deepEqual(mathErrors,[],'Unbalanced KaTeX delimiters found.');

const graphicsSource=pack.postEngine[0];
const usedVisuals=new Set(d.slides.flatMap(slide=>[...slide.html.matchAll(/data-opt5-visual="([^"]+)"/g)].map(match=>match[1])));
const implementedVisuals=new Set([...graphicsSource.matchAll(/case\s+'([^']+)'\s*:/g)].map(match=>match[1]));
assert.equal(usedVisuals.size,52,'Expected 52 purposeful visual identifiers.');
assert.deepEqual([...usedVisuals].filter(id=>!implementedVisuals.has(id)),[],'A used visual has no renderer.');
assert.deepEqual([...implementedVisuals].filter(id=>!usedVisuals.has(id)),[],'A renderer exists for an unused visual.');

const tiSource=pack.postEngine[2];
const tiUsed=new Set(d.slides.flatMap(slide=>[...slide.html.matchAll(/data-opt5-ti-workflow="([^"]+)"/g)].map(match=>match[1])));
const workflowBlock=tiSource.slice(tiSource.indexOf('const workflows={'),tiSource.indexOf('const esc='));
const tiDefined=new Set([...workflowBlock.matchAll(/^\s{4}([a-z]+):\{/gm)].map(match=>match[1]));
assert.deepEqual([...tiUsed].sort(),['box','derivative','extremum','restricted','table']);
assert.deepEqual([...tiDefined].sort(),['box','derivative','extremum','restricted','table']);
assert.match(tiSource,/manualFirst:true/);
assert.match(tiSource,/https:\/\/ti84calc\.com\/ti84calc/);

const interactionsSource=pack.postEngine[1];
assert.match(interactionsSource,/ib-math-ai::5::/,'Completion bridge must use Unit 5.');
assert.match(interactionsSource,/unit:5/,'Completion event must use Unit 5.');

const html=fs.readFileSync(lessonPath,'utf8');
assert.match(html,/data-unit-number="5"/);
assert.match(html,/data-lesson-number="5\.5"/);
assert.match(html,/data-lesson-key="u5-optimisation-modelling"/);
assert.match(html,/data-skill-keys="IBAI\.U5\.OPTIMIZATION"/);
const scriptSources=[...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(match=>match[1].split('?')[0]);
assert.deepEqual(scriptSources,['../data/lesson-5.5.js']);
const loader=fs.readFileSync(loaderPath,'utf8');
assert.match(loader,/echs-ib-ai-5\.5-package-v1/);
assert.match(loader,/lesson-5\.5-package/);
assert.match(loader,/DecompressionStream/);
assert.match(loader,/pack\.preEngine/);
assert.match(loader,/katex-global\.js/);
assert.match(loader,/engine\.js/);
assert.match(loader,/pack\.postEngine/);

const close=(actual,expected,tol=1e-9,label='value')=>assert.ok(Math.abs(actual-expected)<=tol,`${label}: expected ${expected}, received ${actual}`);
// Fixed perimeter rectangle and river enclosure.
close(10*(20-10),100,1e-12,'40 m perimeter rectangle area');
close(30*(120-2*30),1800,1e-12,'120 m river enclosure area');
close(22.5*(180-4*22.5),2025,1e-12,'River enclosure with two dividers');
// Open-top box from 30 cm by 20 cm.
const cut=(25-5*Math.sqrt(7))/3;
close(cut,3.9237478149,1e-9,'30 by 20 box cut');
close(cut*(30-2*cut)*(20-2*cut),(10000+7000*Math.sqrt(7))/27,1e-8,'30 by 20 box volume exact identity');
// Open-top box from 42 cm by 30 cm.
const cut42=12-Math.sqrt(39);
close(cut42*(42-2*cut42)*(30-2*cut42),1296+312*Math.sqrt(39),1e-8,'42 by 30 box volume');
// Closed cylinder with fixed volume 500 pi.
const r500=Math.cbrt(250);const h500=500/(r500*r500);const s500=2*Math.PI*r500*r500+1000*Math.PI/r500;
close(h500,2*r500,1e-9,'Cylinder height-radius relation');
close(r500,6.2996052495,1e-9,'Cylinder radius');
close(s500,748.0451224746,1e-6,'Cylinder surface area');
// Poster and economics.
close(20*30,600,1e-12,'Poster total area');
close(18*(900-25*18),8100,1e-12,'Revenue maximum');
close(-0.4*47**2+38*47-220,682.4,1e-9,'Discrete profit at 47');
close(-0.4*48**2+38*48-220,682.4,1e-9,'Discrete profit at 48');
// Reciprocal and exponential models.
close(20*Math.sqrt(6),48.9897948557,1e-9,'Travel optimum');
close(120/(20*Math.sqrt(6))+(20*Math.sqrt(6))/20,2*Math.sqrt(6),1e-12,'Travel minimum');
close(12*2.5*Math.exp(-1),30/Math.E,1e-12,'Concentration maximum');
// Synthesis integer decision.
const J=v=>180/v+v/40;
assert.ok(J(85)<J(84)&&J(85)<J(86),'85 km/h should be the best adjacent integer decision.');

const css=pack.css;
assert.match(css,/@media\s*\(max-width:\s*720px\)/,'Responsive mobile rules are required.');
assert.match(css,/\.opt5-visual/);
assert.match(css,/\.opt5-ti-coach/);
assert.match(css,/\.opt5-ti-dock/);

console.log('PASS · IB AI SL Lesson 5.5 definitive audit');
console.log(JSON.stringify({slides:d.slides.length,visuals:usedVisuals.size,practice:d.practice.length,levels:Object.fromEntries(['Foundation','Application','Reasoning','Challenge'].map(level=>[level,d.practice.filter(q=>q.level===level).length])),quiz:d.quiz.length,ibTasks:d.exam.length,assessmentMarks:computedMarks,tiWorkflows:[...tiDefined].sort()},null,2));
