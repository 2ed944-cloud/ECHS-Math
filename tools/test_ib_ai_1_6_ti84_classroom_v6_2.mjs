import fs from 'node:fs';
import vm from 'node:vm';

const root=process.argv[2]||'.';
const workflowFile=`${root}/lessons/ib-math-ai/unit-1/data/lesson-1.6-ti84-classroom-workflows-v6-2-2.js`;
const officialFile=`${root}/lessons/ib-math-ai/unit-1/data/lesson-1.6-ti84-official-paths-v6-3.js`;
const runtimeFile=`${root}/lessons/ib-math-ai/unit-1/data/unit-1-gdc-classroom-training-lesson-quality-v1.js`;
const dockFile=`${root}/lessons/ib-math-ai/unit-1/data/unit-1-ti84-simulator-v7.js`;
const htmlFile=`${root}/lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.6_technology_equations_ECHS.html`;
const cssFile=`${root}/lessons/ib-math-ai/unit-1/assets/css/lesson-1.6-ti84-classroom-coach-v6-2.css`;
const errors=[];
const workflowSource=fs.readFileSync(workflowFile,'utf8');
const officialSource=fs.readFileSync(officialFile,'utf8');
const runtimeSource=fs.readFileSync(runtimeFile,'utf8');
const dockSource=fs.readFileSync(dockFile,'utf8');
const shellSource=fs.readFileSync(`${root}/lessons/ib-math-ai/unit-1/data/unit-1-gdc-integration-lesson-quality-v1.js`,'utf8');
const html=fs.readFileSync(htmlFile,'utf8');
const css=fs.readFileSync(cssFile,'utf8');

const sandbox={window:{LESSON_DATA:{lesson:{number:'1.6'}}},console};sandbox.window.window=sandbox.window;vm.createContext(sandbox);
try{vm.runInContext(workflowSource,sandbox,{filename:workflowFile});vm.runInContext(officialSource,sandbox,{filename:officialFile});}catch(error){errors.push(`Workflow assembly failed: ${error.stack}`);}
const workflows=sandbox.window.ECHS_TI84_CLASSROOM_WORKFLOWS||{};
const metadata=sandbox.window.LESSON_DATA.ti84Classroom||{};
if(Object.keys(workflows).length!==6)errors.push(`Expected 6 paired workflows; found ${Object.keys(workflows).length}`);
if(metadata.release!=='6.2.2')errors.push(`Release mismatch: ${metadata.release}`);
if(metadata.officialPathAudit!=='6.3.0')errors.push(`Official path audit mismatch: ${metadata.officialPathAudit}`);
if(metadata.simulator!=='local-echs-gdc-v7'||metadata.thirdPartySimulator!==false)errors.push('TI-84 simulator URL mismatch');
if(metadata.pairedMethod!=='manual → TI-84 → verify → IB conclusion')errors.push('Paired method contract missing');
if((metadata.mappedSlides||[]).length!==7)errors.push(`Expected 7 mapped lesson screens; found ${(metadata.mappedSlides||[]).length}`);

const expected=['system-2x2','system-3x3','cubic-roots','exact-intersections','numerical-intersection','rounded-rref'];
for(const id of expected){const item=workflows[id];if(!item){errors.push(`Missing workflow ${id}`);continue;}if(!item.prompt||!item.math||!item.entry||!item.output||!item.verification||!item.ibStatement)errors.push(`${id}: incomplete paired evidence`);if(!Array.isArray(item.manualSteps)||item.manualSteps.length<4)errors.push(`${id}: insufficient manual steps`);if(!Array.isArray(item.tiSteps)||item.tiSteps.length<5)errors.push(`${id}: insufficient TI-84 steps`);if(item.tiSteps.some(step=>!step.label||!step.detail||!Array.isArray(step.keys)||!step.keys.length))errors.push(`${id}: malformed TI-84 step`);}
const prompts=Object.values(workflows).map(item=>item.prompt);if(new Set(prompts).size!==prompts.length)errors.push('Workflow prompts are duplicated');
if(!workflows['system-2x2'].output.includes('4')||!workflows['system-2x2'].output.includes('3'))errors.push('2×2 output audit failed');
if(!workflows['system-3x3'].output.includes('120')||!workflows['system-3x3'].output.includes('60'))errors.push('3×3 output audit failed');
if(!workflows['cubic-roots'].output.includes('-1')||!workflows['cubic-roots'].output.includes('4'))errors.push('Cubic-root output audit failed');
if(!workflows['exact-intersections'].output.includes('3.236068'))errors.push('Exact-intersection decimal audit failed');
if(!workflows['numerical-intersection'].output.includes('6.05443'))errors.push('Numerical-intersection audit failed');
if(!workflows['rounded-rref'].output.includes('30}{11')||!workflows['rounded-rref'].output.includes('53}{11'))errors.push('RREF exact-value audit failed');

for(const marker of ['lesson-1.6-ti84-classroom-coach-v6-2.css?v=6.2.0','lesson-1.6-ti84-classroom-workflows-v6-2-2.js?v=6.2.2','lesson-1.6-ti84-official-paths-v6-3.js?v=6.3.0','unit-1-gdc-integration-lesson-quality-v1.js','unit-1-ti84-simulator-v7.js','unit-1-gdc-classroom-training-lesson-quality-v1.js'])if(!html.includes(marker))errors.push(`Wrapper missing ${marker}`);
for(const obsolete of ['lesson-1.6-technology-v6-gdc-lab.js','lesson-1.6-technology-v6-gdc-external-tools.js','lesson-1.6-ti84-classroom-data-guard','lesson-1.6-ti84-classroom-coach-v6-2.js','lesson-1.6-ti84-classroom-runtime-v6-2-1.js','lesson-1.6-ti84-inline-dock-v6-3.js'])if(html.includes(obsolete))errors.push(`Wrapper still loads obsolete asset ${obsolete}`);
const ordered=['lesson-1.6-ti84-classroom-workflows-v6-2-2.js','lesson-1.6-ti84-official-paths-v6-3.js','unit-1-gdc-integration-lesson-quality-v1.js','unit-1-ti84-simulator-v7.js','unit-1-gdc-classroom-training-lesson-quality-v1.js'];
if(!ordered.every((marker,i)=>html.indexOf(marker)>=0&&(i===0||html.indexOf(marker)>html.indexOf(ordered[i-1]))))errors.push('Consolidated workflow, correction, GDC, simulator and training load order is invalid');
for(const marker of ['.ti84-classroom-launch','.ti84-paired-strip','.ti84-coach-grid','.ti84-simulator-stage','.ti84-evidence-flow'])if(!css.includes(marker))errors.push(`CSS missing ${marker}`);
for(const marker of ['data-mode="teacher"','data-mode="follow"','data-mode="drill"','gdc-v7-reveal'])if(!shellSource.includes(marker))errors.push(`GDC stage/mode contract missing ${marker}`);
for(const marker of ['MODEL / MANUAL PLAN','TI‑84 KEY ROUTE','gdc8-reveal-output','window.ECHS_TI84_CLASSROOM_WORKFLOWS',"shell.querySelector('.gdc8-classroom')"])if(!runtimeSource.includes(marker))errors.push(`Paired classroom UI missing ${marker}`);
for(const marker of ['physical calculator','PlySmlt2','rref([A])','5:intersect','2:zero','Left Bound','Right Bound'])if(!(workflowSource+officialSource+runtimeSource).toLowerCase().includes(marker.toLowerCase()))errors.push(`Instructional contract missing ${marker}`);
if(!dockSource.includes(".observe(app,{childList:true,subtree:true})"))errors.push('Simulator must observe its lesson app');
if(dockSource.includes("observe(document.body"))errors.push('Simulator must not observe full document body');
for(const marker of ["provider:'ti84calc.com'","src=\"about:blank\"","sandbox=\"allow-scripts allow-same-origin","keyboardFocusTrap:true"])if(!dockSource.includes(marker))errors.push(`Lazy sandboxed simulator contract missing ${marker}`);

console.log('IB AI SL Lesson 1.6 TI-84 Classroom Practice v6.3');
console.log(JSON.stringify({workflows:Object.keys(workflows).length,mappedSlides:(metadata.mappedSlides||[]).length,modes:metadata.modes||[],officialAudit:metadata.officialPathAudit},null,2));
if(errors.length){for(const error of errors)console.error(`ERROR: ${error}`);process.exit(1);}console.log('Status: PASS');
