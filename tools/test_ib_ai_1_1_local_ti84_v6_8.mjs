import {readFile} from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

const root=path.resolve(process.argv[2]||'.');
const read=relative=>readFile(path.join(root,relative),'utf8');
const lessonPath='lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.1_standard_form_ECHS.html';
const runtimePath='lessons/ib-math-ai/unit-1/data/lesson-1.1-ti84-local-v6-8.js';
const inputPath='lessons/ib-math-ai/unit-1/data/lesson-1.1-ti84-local-input-v6-8-1.js';
const cssPath='lessons/ib-math-ai/unit-1/assets/css/lesson-1.1-ti84-local-v6-8.css';
const learnerPath='lessons/ib-math-ai/unit-1/data/lesson-1.1-learner-view-v6-6.js';
const catalogPath='data/ib-math-ai-unit-1-delivery-catalog.json';
const portalPath='data/ib-math-ai-unit-1-update.js';

const [html,runtime,inputFix,css,learner,catalogRaw,portal]=await Promise.all([
  read(lessonPath),read(runtimePath),read(inputPath),read(cssPath),read(learnerPath),read(catalogPath),read(portalPath)
]);
const failures=[];
const requireText=(text,needle,label)=>{if(!text.includes(needle))failures.push(`${label} missing ${needle}`);};
const forbidText=(text,needle,label)=>{if(text.includes(needle))failures.push(`${label} still contains ${needle}`);};

for(const marker of [
  'lesson-1.1-ti84-local-v6-8.css?v=6.8.0',
  'lesson-1.1-ti84-local-v6-8.js?v=6.8.0',
  'lesson-1.1-ti84-local-input-v6-8-1.js?v=6.8.1',
  '1.1 · Scientific Notation, Approximation and Error'
])requireText(html,marker,'Lesson 1.1 HTML');
for(const legacy of [
  'lesson-1.1-ti84-inline-dock-v6-4.js',
  'lesson-1.6-ti84-inline-dock-v6-3.css',
  'lesson-1.1-ti84-simulator-v6-7.js',
  'lesson-1.1-ti84-simulator-v6-7.css'
])forbidText(html,legacy,'Lesson 1.1 HTML');

for(const marker of [
  'ECHS_TI84_LOCAL_ENGINE_1_1',
  'externalDependency:false',
  'iframe:false',
  "'ee-entry'",
  "'sci-normal'",
  "'guard-digits'",
  'l11-ti84-local',
  'l11-ti84-local-launch'
])requireText(runtime,marker,'Local TI-84 runtime');
for(const forbidden of ['ti84calc.com','<iframe','data-src="http',"provider:'ti84calc.com'"])forbidText(runtime,forbidden,'Local TI-84 runtime');
for(const marker of ['currentNumberSegment','multiOperandEE:true','stopImmediatePropagation','l11-ti84-local'])requireText(inputFix,marker,'Local TI-84 input controller');
for(const marker of ['#ti84-inline-dock','#l11-ti84-simulator','margin-right:0!important','#l11-ti84-local.open','grid-template-columns:minmax(340px','.l11-ti84-keypad'])requireText(css,marker,'Local TI-84 styles');

for(const marker of ['core (teach in class)','estimated teaching time:','extension','practice','revision'])requireText(learner,marker,'Learner-label cleanup');

let catalog;
try{catalog=JSON.parse(catalogRaw);}catch(error){failures.push(`Delivery catalog JSON is invalid: ${error.message}`);catalog={};}
const lesson11=(catalog.lessons||[]).find(item=>item.number==='1.1')||{};
if(lesson11.title!=='Scientific Notation, Approximation and Error')failures.push(`Catalog title is ${lesson11.title}`);
if(lesson11.release!=='6.8.0')failures.push(`Catalog release is ${lesson11.release}`);
if(lesson11.default_scope!=='IB SL Core')failures.push('Catalog default scope is not IB SL Core');
if(lesson11.calculator?.simulator!=='ECHS local lesson simulator'||lesson11.calculator?.external_dependency!==false)failures.push('Catalog calculator metadata is not local-only');
if(JSON.stringify(lesson11.scope_counts)!==JSON.stringify({learn:{core:70,all:79},practice:{core:88,all:96},quiz:{core:12,all:14},tasks:{core:4,all:5}}))failures.push(`Catalog scope counts are incorrect: ${JSON.stringify(lesson11.scope_counts)}`);

for(const marker of [
  '"1.1","Scientific Notation, Approximation and Error"',
  '"6.8.0",79,96,14,5',
  'simulator:"ECHS local lesson simulator"',
  'externalDependency:false'
])requireText(portal,marker,'Unit 1 portal metadata');
forbidText(portal,'"1.1","Number Foundations, Scientific Notation and Approximation"','Unit 1 portal metadata');

const sandbox={window:{LESSON_DATA:{lesson:{number:'1.1'}}},console};
vm.createContext(sandbox);
try{vm.runInContext(runtime,sandbox,{filename:runtimePath});}catch(error){failures.push(`Local TI-84 runtime did not initialize without a DOM: ${error.stack||error}`);}
const engine=sandbox.window.ECHS_TI84_LOCAL_ENGINE_1_1;
if(!engine){
  failures.push('Local TI-84 calculation engine was not exported');
}else{
  const close=(actual,expected,tolerance=1e-12)=>Math.abs(actual-expected)<=tolerance*Math.max(1,Math.abs(expected));
  const checks=[
    ['negative EE',engine.evaluate('-6.04E-6'),-6.04e-6],
    ['guard digits',engine.evaluate('(4.73E8)/(6.2E-3)'),(4.73e8)/(6.2e-3)],
    ['two EE operands',engine.evaluate('4.73E8+6.2E-3'),4.73e8+6.2e-3],
    ['multiplication',engine.evaluate('(3E4)*(2E-2)'),600]
  ];
  for(const [label,actual,expected] of checks)if(!close(actual,expected))failures.push(`${label} produced ${actual}, expected ${expected}`);
  if(engine.formatScientific((4.73e8)/(6.2e-3))!=='7.629032258E10')failures.push(`Unexpected SCI output: ${engine.formatScientific((4.73e8)/(6.2e-3))}`);
  if(engine.mathematicalNotation(-6.04e-6)!=='-6.04 × 10^-6')failures.push(`Unexpected mathematical notation: ${engine.mathematicalNotation(-6.04e-6)}`);
  let unsafeAccepted=false;
  try{engine.evaluate('globalThis.process.exit()');unsafeAccepted=true;}catch{}
  if(unsafeAccepted)failures.push('Unsafe expression was accepted');
}

console.log('IB AI SL Lesson 1.1 local TI-84 v6.8 validation');
console.log(`Root: ${root}`);
console.log(`Failures: ${failures.length}`);
for(const failure of failures)console.log(`- ${failure}`);
if(failures.length)process.exit(1);
console.log('Status: PASS');
