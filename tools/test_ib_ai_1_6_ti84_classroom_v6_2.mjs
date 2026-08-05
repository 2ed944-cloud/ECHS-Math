import fs from 'node:fs';
import vm from 'node:vm';

const root=process.argv[2]||'.';
const workflowFile=`${root}/lessons/ib-math-ai/unit-1/data/lesson-1.6-ti84-classroom-workflows-v6-2-2.js`;
const runtimeFile=`${root}/lessons/ib-math-ai/unit-1/data/lesson-1.6-ti84-classroom-runtime-v6-2-1.js`;
const htmlFile=`${root}/lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.6_technology_equations_ECHS.html`;
const cssFile=`${root}/lessons/ib-math-ai/unit-1/assets/css/lesson-1.6-ti84-classroom-coach-v6-2.css`;
const errors=[];
const workflowSource=fs.readFileSync(workflowFile,'utf8');
const runtimeSource=fs.readFileSync(runtimeFile,'utf8');
const html=fs.readFileSync(htmlFile,'utf8');
const css=fs.readFileSync(cssFile,'utf8');

const sandbox={window:{LESSON_DATA:{lesson:{number:'1.6'}}},console};
sandbox.window.window=sandbox.window;
vm.createContext(sandbox);
try{vm.runInContext(workflowSource,sandbox,{filename:workflowFile});}catch(error){errors.push(`Workflow assembly failed: ${error.stack}`);}

const workflows=sandbox.window.ECHS_TI84_CLASSROOM_WORKFLOWS||{};
const metadata=sandbox.window.LESSON_DATA.ti84Classroom||{};
if(Object.keys(workflows).length!==6)errors.push(`Expected 6 paired workflows; found ${Object.keys(workflows).length}`);
if(metadata.release!=='6.2.2')errors.push(`Release mismatch: ${metadata.release}`);
if(metadata.simulator!=='https://ti84calc.com/ti84calc')errors.push('TI-84 simulator URL mismatch');
if(metadata.pairedMethod!=='manual → TI-84 → verify → IB conclusion')errors.push('Paired method contract missing');
if((metadata.mappedSlides||[]).length!==7)errors.push(`Expected 7 mapped lesson screens; found ${(metadata.mappedSlides||[]).length}`);

const expected=['system-2x2','system-3x3','cubic-roots','exact-intersections','numerical-intersection','rounded-rref'];
for(const id of expected){
  const item=workflows[id];
  if(!item){errors.push(`Missing workflow ${id}`);continue;}
  if(!item.prompt||!item.math||!item.entry||!item.output||!item.verification||!item.ibStatement)errors.push(`${id}: incomplete paired evidence`);
  if(!Array.isArray(item.manualSteps)||item.manualSteps.length<4)errors.push(`${id}: insufficient manual steps`);
  if(!Array.isArray(item.tiSteps)||item.tiSteps.length<5)errors.push(`${id}: insufficient TI-84 steps`);
  if(item.tiSteps.some(step=>!step.label||!step.detail||!Array.isArray(step.keys)||!step.keys.length))errors.push(`${id}: malformed TI-84 step`);
}
const prompts=Object.values(workflows).map(item=>item.prompt);
if(new Set(prompts).size!==prompts.length)errors.push('Workflow prompts are duplicated');
if(!workflows['system-2x2'].output.includes('4')||!workflows['system-2x2'].output.includes('3'))errors.push('2×2 output audit failed');
if(!workflows['system-3x3'].output.includes('120')||!workflows['system-3x3'].output.includes('60'))errors.push('3×3 output audit failed');
if(!workflows['cubic-roots'].output.includes('-1')||!workflows['cubic-roots'].output.includes('4'))errors.push('Cubic-root output audit failed');
if(!workflows['exact-intersections'].output.includes('3.236068'))errors.push('Exact-intersection decimal audit failed');
if(!workflows['numerical-intersection'].output.includes('6.05443'))errors.push('Numerical-intersection audit failed');
if(!workflows['rounded-rref'].output.includes('30}{11')||!workflows['rounded-rref'].output.includes('53}{11'))errors.push('RREF exact-value audit failed');

for(const marker of [
  'lesson-1.6-ti84-classroom-coach-v6-2.css?v=6.2.0',
  'lesson-1.6-ti84-classroom-workflows-v6-2-2.js?v=6.2.2',
  'lesson-1.6-ti84-classroom-runtime-v6-2-1.js?v=6.2.1'
])if(!html.includes(marker))errors.push(`Wrapper missing ${marker}`);
if(html.includes('lesson-1.6-ti84-classroom-data-guard')||html.includes('lesson-1.6-ti84-classroom-coach-v6-2.js'))errors.push('Wrapper still loads the superseded TI-84 runtime');
if(!(html.indexOf('lesson-1.6-technology-v6-gdc-external-tools.js')<html.indexOf('lesson-1.6-ti84-classroom-workflows-v6-2-2.js')&&html.indexOf('lesson-1.6-ti84-classroom-workflows-v6-2-2.js')<html.indexOf('lesson-1.6-ti84-classroom-runtime-v6-2-1.js')))errors.push('TI-84 resource, workflow and runtime load order is invalid');
for(const marker of ['.ti84-classroom-launch','.ti84-paired-strip','.ti84-coach-grid','.ti84-simulator-stage','.ti84-evidence-flow'])if(!css.includes(marker))errors.push(`CSS missing ${marker}`);
for(const marker of ['Teacher demo','Students follow','Exam drill','Load simulator','Manual mathematics','TI‑84 key sequence'])if(!runtimeSource.includes(marker))errors.push(`Coach UI missing ${marker}`);
for(const marker of ['Third-party tool hosted by ti84calc.com','physical calculator','PlySmlt2','rref([A])','5:intersect','2:zero'])if(!(workflowSource+runtimeSource).includes(marker))errors.push(`Instructional contract missing ${marker}`);
if(!runtimeSource.includes("new MutationObserver(()=>scanSlide()).observe(app"))errors.push('Runtime does not limit slide observation to #app');
if(runtimeSource.includes("observe(document.body"))errors.push('Runtime must not observe the full document body');

console.log('IB AI SL Lesson 1.6 TI-84 Classroom Practice v6.2.2');
console.log(JSON.stringify({workflows:Object.keys(workflows).length,mappedSlides:(metadata.mappedSlides||[]).length,modes:metadata.modes||[]},null,2));
if(errors.length){for(const error of errors)console.error(`ERROR: ${error}`);process.exit(1);}
console.log('Status: PASS');
