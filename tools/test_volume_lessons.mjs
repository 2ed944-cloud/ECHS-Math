/** Node-only release checks for the three original Unit 8 volume lessons.
 * Run: node tools/test_volume_lessons.mjs
 * No installed packages, network, browser, student state, or credentials.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {LESSONS} from '../lessons/ap-calculus/unit-8/assets/volume-lessons.mjs';
import {SCENARIOS, SHAPES, buildModel} from '../lessons/ap-calculus/unit-8/assets/volume-model.mjs';
import {renderRegion, renderVolume} from '../lessons/ap-calculus/unit-8/assets/volume-renderer.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const dir='lessons/ap-calculus/unit-8';
const expected=[
  {id:'cross-sections',number:'8.5',catalogNumber:'94-96',title:'Volumes by Cross Sections',file:'8-5-volumes-cross-sections.html',topics:['8.7','8.8']},
  {id:'disks-washers',number:'8.6',catalogNumber:'97-98',title:'Volumes by Disc and Washer Methods',file:'8-6-disks-and-washers.html',topics:['8.9','8.11']},
  {id:'about-a-line',number:'8.7',catalogNumber:'99-100',title:'Volume About a Line',file:'8-7-volume-about-a-line.html',topics:['8.10','8.12']}
];
const practices=new Set(['Implementing Mathematical Processes','Connecting Representations','Justification','Communication and Notation']);
const representations=new Set(['analytical','graphical','numerical','verbal']);
const kinds=new Set(['intro','lab','notes','example','question','reflection','summary']);
const engine=read(`${dir}/assets/volume-lesson.mjs`);
const css=read(`${dir}/assets/volume-lesson.css`);
const ids=new Set(), formulas=[];
let stages=0, questions=0, assertions=0;
function check(condition,message){assertions++;assert.ok(condition,message);}
function equal(actual,wanted,message){assertions++;assert.deepEqual(actual,wanted,message);}

equal(Object.keys(LESSONS).sort(),expected.map(x=>x.id).sort(),'Only the three scoped lessons');
for(const spec of expected){
  const lesson=LESSONS[spec.id];
  equal([lesson.id,lesson.number,lesson.title],[spec.id,spec.number,spec.title],`${spec.id}: lesson identity`);
  equal(lesson.cedTopics,spec.topics,`${spec.id}: platform numbers must not replace official CED topic numbers`);
  equal(lesson.curriculumVersion,'ap-calculus-2026-27');
  equal(lesson.scope,'AP Calculus AB / BC');
  check(/Original ECHS/.test(lesson.provenance),'Original public content provenance required');
  check(/do not establish verified mastery/.test(lesson.evidencePolicy),'No self-check mastery certification');
  check(lesson.objectives.length>=2&&lesson.objectives.length<=4,'Focused measurable objectives');
  for(const objective of lesson.objectives)check(/^(Construct|Calculate|Justify|Determine|Distinguish|Evaluate|Explain)\b/.test(objective),`Measurable objective: ${objective}`);
  equal(lesson.stages[0].kind,'intro');equal(lesson.stages.at(-1).kind,'summary');
  check(lesson.stages.findIndex(s=>s.kind==='example')>=0&&lesson.stages.findIndex(s=>s.kind==='example')<lesson.stages.findIndex(s=>s.kind==='question'),'A worked example must precede independent practice');
  check(lesson.stages.some(s=>s.phase==='Diagnose'),'A misconception check is required');
  check(lesson.stages.some(s=>s.phase==='Reflect'),'Exit explanation required');
  const covered=new Set();
  for(const stage of lesson.stages){
    stages++;
    check(typeof stage.id==='string'&&stage.id.length>0&&!ids.has(stage.id),`Unique stable stage identity: ${stage.id}`);ids.add(stage.id);
    check(kinds.has(stage.kind),`Supported stage kind: ${stage.id}`);
    check(typeof stage.title==='string'&&stage.title.length>0,`${stage.id}: title`);
    for(const key of ['body','formulas','parts','hints','solution','solutionFormulas','choices'])if(stage[key]!==undefined){
      check(Array.isArray(stage[key])&&stage[key].every(s=>typeof s==='string'&&s.trim()),`${stage.id}: ${key} must contain nonempty plain strings`);
    }
    for(const practice of stage.practices||[]){check(practices.has(practice),`${stage.id}: valid AP mathematical practice`);covered.add(practice);}
    for(const representation of stage.representations||[])check(representations.has(representation),`${stage.id}: valid representation`);
    for(const tex of [...stage.formulas||[],...stage.solutionFormulas||[]])formulas.push([stage.id,tex]);
    if(stage.scenario){
      const scenario=SCENARIOS.find(x=>x.id===stage.scenario);
      check(scenario,`${stage.id}: a reviewed model must exist`);
      const model=buildModel({scenario:stage.scenario,shape:stage.shape||'square',axisOffset:stage.axisOffset});
      check(Number.isFinite(model.exactVolume)&&model.exactVolume>0,`${stage.id}: finite positive volume`);
      if(scenario.kind==='shell')check(stage.enrichment===true,`${stage.id}: shells must be explicitly optional enrichment`);
    }
    if(stage.kind==='question'){
      questions++;
      check(stage.original===true&&stage.calculatorPolicy&&stage.practices?.length&&stage.representations?.length,`${stage.id}: original practice provenance and metadata`);
      check(stage.prompt&&stage.hints?.length&&stage.solution?.length,`${stage.id}: question, hints, and worked reasoning`);
      check(stage.choices?.length===4&&new Set(stage.choices).size===4,`${stage.id}: four distinct choices`);
      check(Number.isInteger(stage.correct)&&stage.correct>=0&&stage.correct<4,`${stage.id}: valid answer index`);
    }
    if(stage.kind==='reflection')check(stage.prompt&&stage.solution?.length,`${stage.id}: independent response and comparison`);
    if(stage.original===true)check(stage.calculatorPolicy,`${stage.id}: calculator policy`);
  }
  equal([...covered].sort(),[...practices].sort(),`${spec.id}: all four mathematical practices`);
  check(lesson.stages.filter(s=>s.kind==='question').length>=2,`${spec.id}: at least two original MCQs`);
  check(lesson.stages.some(s=>s.kind==='reflection'&&s.parts?.length>=3&&s.original),`${spec.id}: original multipart application`);

  const html=read(`${dir}/${spec.file}`);
  check(html.includes(`data-volume-lesson="${spec.id}"`),'Entry root selects correct lesson');
  check(html.includes('data-practice="embedded"')&&html.includes('data-practice-start="practice"')&&html.includes('id="practice"'),'Embedded practice contract');
  check(html.includes('name="echs-course" content="ap-calculus"'),'Platform guard course metadata');
  check(html.includes('<noscript>')&&html.includes('id="static-content"')&&html.includes('id="visual-fallback"'),'Static and rendering failure alternatives');
  const pageIds=[...html.matchAll(/\bid="([^"\s]+)"/g)].map(m=>m[1]);
  equal(pageIds.length,new Set(pageIds).size,`${spec.file}: unique DOM IDs`);
  const dynamicIds=new Set([...engine.matchAll(/\bid="([^"\s]+)"/g)].map(m=>m[1]));
  for(const [,id] of engine.matchAll(/\$\('([^']+)'\)/g))check(pageIds.includes(id)||dynamicIds.has(id),`${spec.file}: engine control ${id} exists`);
  for(const [,url] of html.matchAll(/\b(?:src|href)="([^"]+)"/g)){
    if(/^(?:https?:|#)/.test(url))continue;
    check(fs.existsSync(path.resolve(root,dir,url.split(/[?#]/)[0])),`${spec.file}: missing local asset/link ${url}`);
  }
  for(const [,id] of html.matchAll(/\b(?:for|aria-controls|aria-labelledby)="([^"]+)"/g))for(const target of id.split(/\s+/))check(pageIds.includes(target),`${spec.file}: accessibility target ${target}`);
  check(/<canvas[^>]*id="solid-canvas"[^>]*tabindex="0"/.test(html),'Keyboard focusable 3D canvas');
  check(html.includes('aria-live="polite"'),'Screen-reader stage announcements');
}
check(/prefers-reduced-motion/.test(engine)&&/prefers-reduced-motion/.test(css),'Reduced-motion handling');
check(/import\('\.\/volume-renderer\.mjs/.test(engine),'Renderer must remain lazy-loaded');
check(/pagehide/.test(engine)&&/resize\.disconnect\(\)/.test(engine)&&/observer\.disconnect\(\)/.test(engine)&&/events\.abort\(\)/.test(engine),'Lifecycle cleanup');
check(!/\b(?:localStorage|sessionStorage|indexedDB|fetch|XMLHttpRequest|WebSocket|supabase)\b/.test(engine),'No learner-storage, network, or database mutation in self-check engine');
check(!/\b(?:recordAttempt|awardMastery|setMastery|markLessonComplete|dispatchEvent)\s*\(/.test(engine),'No synthetic institutional evidence');
for(const [,url] of engine.matchAll(/(?:from\s*|import\()'([^']+\.mjs[^']*)'/g))check(fs.existsSync(path.resolve(root,dir,'assets',url.split('?')[0])),`Engine module exists: ${url}`);

// Execute only known local catalog/KaTeX assets; no DOM or network is exposed.
const catalogContext={window:{}};vm.runInNewContext(read('data/courses.js'),catalogContext,{timeout:1000});
const records=catalogContext.window.ECHS_COURSES.flatMap(course=>course.units.flatMap(unit=>unit.lessons.map(lesson=>({course,unit,lesson}))));
const scoped=records.filter(({lesson})=>lesson.url?.startsWith(`${dir}/`));
equal(scoped.length,3,'Exactly three Unit 8 volume catalog records');
for(const spec of expected){
  const matches=scoped.filter(({lesson})=>lesson.url===`${dir}/${spec.file}`);equal(matches.length,1,'Stable unique catalog URL');
  const {course,unit,lesson}=matches[0];
  equal(course.course,'G12 AP Calculus AB');check(unit.title.startsWith('Unit 8:'),'Unit 8 mapping');
  equal([lesson.number,lesson.title],[spec.catalogNumber,`${spec.number} ${spec.title}`],'Preserve existing number and title identity');
  equal([lesson.status,lesson.practice,lesson.practiceHash],['ready','embedded','practice'],'Ready with embedded practice');
}

const katexContext={window:{}};vm.runInNewContext(read('lessons/ib-math-ai/unit-1/assets/js/katex-global.js'),katexContext,{timeout:5000});
for(const scenario of SCENARIOS)for(const shape of scenario.kind==='cross'?SHAPES:[SHAPES[0]])for(const axisOffset of scenario.allowedAxisOffsets){
  const m=buildModel({scenario:scenario.id,shape:shape.id,axisOffset});
  formulas.push([`${scenario.id}/${shape.id}/${axisOffset}`,m.integralTex]);
  formulas.push([scenario.id,m.kind==='cross'?`A(${m.variable})=${m.shapeDescriptor.areaTex},\\quad w=${m.widthTex}`:m.kind==='shell'?`dV=2\\pi rh\\,d${m.variable},\\quad r=${m.radiusTex},\\ h=${m.widthTex}`:`A(${m.variable})=\\pi(R^2-r^2),\\quad R=${m.outerRadiusTex},\\ r=${m.innerRadiusTex}`]);
}
for(const [id,tex]of formulas){
  try{katexContext.window.katex.renderToString(tex,{displayMode:true,throwOnError:true,strict:'error',trust:false,maxExpand:100,maxSize:10});}
  catch(e){assert.fail(`${id}: invalid KaTeX ${tex}\n${e.message}`);}assertions++;
}

// Independent answer verification: selected choices alone are never the oracle.
// Each choice is modeled from the visible question, with unique correct geometry.
const item=id=>Object.values(LESSONS).flatMap(l=>l.stages).find(s=>s.id===id);
const near=(a,b)=>Math.abs(a-b)<1e-10;
function checkChoices(id,values,wanted){
  const matches=values.flatMap((value,i)=>near(value,wanted)?[i]:[]);
  equal(matches.length,1,`${id}: independently unique intended answer`);
  equal(item(id).correct,matches[0],`${id}: answer agrees with independent geometry`);
}
const w=3; // semicircle at x=1: diameter=3, radius=1.5
checkChoices('cs-mcq-diameter',[w,Math.PI*w*w/4,Math.PI*w*w/8,Math.PI*w*w/2],Math.PI*(w/2)**2/2);
checkChoices('cs-mcq-leg',[1,2,Math.SQRT2,.5],(.5*w*w)/(.5*(w/Math.SQRT2)**2));
const y=.5;
checkChoices('dw-mcq-y-axis',[Math.PI*(4*y*y-y**4),Math.PI*(2*y-y*y)**2,Math.PI*(y**4-4*y*y),Math.PI*(2*y-y*y)],Math.PI*((2*y)**2-(y*y)**2));
const dx=.07;
checkChoices('dw-mcq-slice',[4*Math.PI*dx,8*Math.PI,8*Math.PI*dx,2*Math.PI*dx],Math.PI*(3**2-1**2)*dx);
const radii=[[1.5,1.75],[.5,.25],[.25,0],[1.75,1.5]];
equal(radii.flatMap((r,i)=>near(r[0],2-.5**2)&&near(r[1],2-.5)?[i]:[]),[item('line-mcq-above').correct],'Outer radius from the farther boundary');
checkChoices('line-mcq-vertical',[Math.PI*((2-Math.sqrt(y))**2-(2-y)**2),Math.PI*((2-y)**2-(2-Math.sqrt(y))**2),Math.PI*((2-y*y)**2-(2-y)**2),Math.PI*(Math.sqrt(y)-y)**2],Math.PI*((2-y)**2-(2-Math.sqrt(y))**2));
// Direct polynomial antiderivatives verify new FRQ and contextual numbers.
const integral=(coeff,a,b)=>coeff.reduce((sum,c,p)=>sum+c*(b**(p+1)-a**(p+1))/(p+1),0);
check(near(integral([0,0,1,-2,1],0,1),1/30),'Square shared-base volume');
check(near(integral([0,0,4,-4,1],0,2),16/15),'Original square FRQ volume');
check(near((1/15)*27,9/5)&&near((9/5)*1000,1800),'Qatar scale factor and liters');
check(near([1/8,3/8,5/8,7/8].reduce((s,x)=>s+(x-x*x)**2/4,0),137/4096),'Four-midpoint table exact total');
check(near([1/8,3/8,5/8,7/8].reduce((s,x)=>s+(x*x-x**4)/4,0),567/4096),'Four-washer midpoint estimate');
for(const a of [.1,1,2.5])check(near(Math.PI*integral([0,2*a,1-2*a,0,-1],0,1),Math.PI*(2/15+a/3)),'Moving-axis FRQ parameter family');

// A lightweight canvas records valid geometry without pretending to test browser UI.
function canvas(){
  const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}})}, {get(target,key){return key in target?target[key]:(...args)=>{if(['moveTo','lineTo','rect','fillRect','clearRect','setTransform'].includes(key))check(args.every(Number.isFinite),`Finite canvas geometry: ${key}`);};}});
  return {width:600,height:400,getContext:()=>ctx,getBoundingClientRect:()=>({width:600,height:400})};
}
for(const n of [3,4,5,12,48]){
  const model=buildModel({scenario:'cross-x'}), state={mode:'stack',slices:n,showSlice:false,showRegion:false,showAxes:false};
  const solid=renderVolume(canvas(),model,state),region=renderRegion(canvas(),model,state);
  equal(solid.polygonCount,6*n,`Displayed ${n}-slice square stack must contain ${n} prisms`);
  check(near(region.stripThickness,1/n),'Graph thickness matches reported midpoint partition');
}
for(const scenario of SCENARIOS){
  const model=buildModel({scenario:scenario.id});
  for(const state of [{},{cutaway:true},{sweep:90,mode:'slice'},{mode:'stack',slices:3}]){
    check(renderVolume(canvas(),model,state).available,`${scenario.id}: geometry renders`);
    check(renderRegion(canvas(),model,state).available,`${scenario.id}: generating region renders`);
  }
}
equal(renderVolume({getContext:()=>null},buildModel()).available,false,'Canvas-unavailable renderer contract');
console.log(`PASS: 3 lesson identities; ${stages} stages; ${questions} independently checked MCQs; ${formulas.length} KaTeX formulas; ${assertions} schema, link, geometry, accessibility and evidence-boundary assertions.`);
