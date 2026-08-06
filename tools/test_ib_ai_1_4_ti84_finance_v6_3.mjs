import fs from 'node:fs';
import vm from 'node:vm';

const root=process.argv[2]||'.';
const lessonDir=`${root}/lessons/ib-math-ai/unit-1`;
const workflowFile=`${lessonDir}/data/lesson-1.4-ti84-finance-workflows-v6-3.js`;
const classroomFile=`${lessonDir}/data/lesson-1.4-ti84-finance-classroom-v6-3.js`;
const inlineFile=`${lessonDir}/data/lesson-1.4-ti84-finance-inline-v6-3.js`;
const htmlFile=`${lessonDir}/lessons/IB_AI_SL_1.4_financial_models_ECHS.html`;
const multiplicityFile=`${lessonDir}/data/lesson-1.6-multiplicity-2-fix-v6-3-3.js`;
const cssFile=`${lessonDir}/assets/css/lesson-1.4-ti84-finance-v6-3.css`;
const errors=[];

const workflowSource=fs.readFileSync(workflowFile,'utf8');
const classroomSource=fs.readFileSync(classroomFile,'utf8');
const inlineSource=fs.readFileSync(inlineFile,'utf8');
const html=fs.readFileSync(htmlFile,'utf8');
const multiplicity=fs.readFileSync(multiplicityFile,'utf8');
const css=fs.readFileSync(cssFile,'utf8');

const sandbox={window:{LESSON_DATA:{lesson:{number:'1.4'}}},console};
sandbox.window.window=sandbox.window;
vm.createContext(sandbox);
try{vm.runInContext(workflowSource,sandbox,{filename:workflowFile});}catch(error){errors.push(`Workflow assembly failed: ${error.stack}`);}

const workflows=sandbox.window.ECHS_TI84_FINANCE_WORKFLOWS||{};
const metadata=sandbox.window.LESSON_DATA.ti84FinanceClassroom||{};
const ids=['effective-rate','compound-lump','annuity-fv','annuity-due','withdrawal-pmt','loan-payment','outstanding-balance'];
if(Object.keys(workflows).length!==ids.length)errors.push(`Expected ${ids.length} finance workflows; found ${Object.keys(workflows).length}`);
for(const id of ids){
  const item=workflows[id];
  if(!item){errors.push(`Missing workflow ${id}`);continue;}
  if(!item.prompt||!item.math||!item.entry||!item.output||!item.verification||!item.ibStatement)errors.push(`${id}: incomplete evidence`);
  if(!Array.isArray(item.manualSteps)||item.manualSteps.length<4)errors.push(`${id}: insufficient manual steps`);
  if(!Array.isArray(item.tiSteps)||item.tiSteps.length<3)errors.push(`${id}: insufficient TI-84 steps`);
  if(item.tiSteps.some(step=>!step.label||!step.detail||!Array.isArray(step.keys)||!step.keys.length))errors.push(`${id}: malformed TI-84 step`);
}
if(metadata.release!=='6.3.0')errors.push(`Metadata release mismatch: ${metadata.release}`);
if(metadata.simulator!=='https://ti84calc.com/ti84calc')errors.push('Simulator URL mismatch');
if(metadata.pairedMethod!=='manual → TI-84 Finance → verify → IB conclusion')errors.push('Paired-method contract missing');

const flat=id=>workflows[id].tiSteps.flatMap(step=>step.keys).join(' ');
if(!flat('effective-rate').includes('C:eff('))errors.push('Effective-rate Finance route missing C:eff(');
for(const id of ['compound-lump','annuity-fv','annuity-due','withdrawal-pmt','loan-payment','outstanding-balance']){
  const keys=flat(id);
  for(const marker of ['APPS','Finance'])if(!keys.includes(marker))errors.push(`${id}: missing ${marker}`);
}
for(const id of ['compound-lump','annuity-fv','annuity-due','withdrawal-pmt','loan-payment']){
  const keys=flat(id);
  if(!keys.includes('1:TVM Solver...')||!keys.includes('ALPHA')||!keys.includes('ENTER (SOLVE)'))errors.push(`${id}: incomplete TVM Solver route`);
}
const balanceKeys=flat('outstanding-balance');
for(const marker of ['9:bal(','A:ΣInt(','0:ΣPrn('])if(!balanceKeys.includes(marker))errors.push(`Outstanding-balance route missing ${marker}`);
if(!flat('annuity-due').includes('PMT: BEGIN'))errors.push('Annuity-due workflow does not select BEGIN');
if(!flat('annuity-fv').includes('PMT: END')||!flat('loan-payment').includes('PMT: END'))errors.push('END timing route missing');

const near=(actual,expected,tol=1e-7)=>Math.abs(actual-expected)<=tol*Math.max(1,Math.abs(expected));
const fvLump=10000*(1+0.05/12)**60;
const effective=((1+0.048/12)**12-1)*100;
const fvAnnuity=600*((1+0.054/12)**96-1)/(0.054/12);
const fvDue=500*((1+0.06/12)**60-1)/(0.06/12)*(1+0.06/12);
const withdrawal=500000*(0.0525/12)/(1-(1+0.0525/12)**(-300));
const loan=120000*(0.051/12)/(1-(1+0.051/12)**(-72));
const loan90=90000*(0.049/12)/(1-(1+0.049/12)**(-60));
const bal24=90000*(1+0.049/12)**24-loan90*((1+0.049/12)**24-1)/(0.049/12);
const expected=[
  ['compound-lump',fvLump,12833.58679],
  ['effective-rate',effective,4.907020753],
  ['annuity-fv',fvAnnuity,71845.74787],
  ['annuity-due',fvDue,35059.44033],
  ['withdrawal-pmt',withdrawal,2996.238576],
  ['loan-payment',loan,1938.163150],
  ['outstanding-balance',bal24,56615.97563]
];
for(const [id,actual,target] of expected)if(!near(actual,target,2e-9))errors.push(`${id}: numerical audit ${actual} != ${target}`);

for(const marker of [
  'lesson-1.4-ti84-finance-v6-3.css?v=6.3.0',
  'lesson-1.4-ti84-finance-workflows-v6-3.js?v=6.3.0',
  'lesson-1.4-ti84-finance-classroom-v6-3.js?v=6.3.0',
  'lesson-1.4-ti84-finance-inline-v6-3.js?v=6.3.0'
])if(!html.includes(marker))errors.push(`Lesson wrapper missing ${marker}`);
if(!(html.indexOf('lesson-1.4-ti84-finance-workflows-v6-3.js')<html.indexOf('lesson-1.4-ti84-finance-classroom-v6-3.js')&&html.indexOf('lesson-1.4-ti84-finance-classroom-v6-3.js')<html.indexOf('lesson-1.4-ti84-finance-inline-v6-3.js')))errors.push('Finance workflow/runtime/inline load order is invalid');

for(const marker of ['.fin84-classroom-launch','.fin84-inline-launch','.fin84-paired-strip','.fin84-grid','.fin84-inline-dock'])if(!css.includes(marker))errors.push(`CSS missing ${marker}`);
for(const marker of ['Teacher demo','Students follow','Exam drill','TI‑84 Finance keys','Load simulator'])if(!classroomSource.includes(marker))errors.push(`Classroom UI missing ${marker}`);
if(!inlineSource.includes("layout:'docked beside slide'")||!inlineSource.includes('ti84calc.com/ti84calc'))errors.push('Inline simulator contract missing');
if(classroomSource.includes('observe(document.body'))errors.push('Classroom runtime must not observe the full document body');
if(!multiplicity.includes('M48 40 Q181 160 314 40'))errors.push('Multiplicity-2 curve does not touch the x-axis at its vertex');

console.log('IB AI SL Lesson 1.4 TI-84 Finance Classroom v6.3 validation');
console.log(JSON.stringify({workflows:Object.keys(workflows).length,simulator:metadata.simulator,multiplicity2:'vertex on x-axis'},null,2));
if(errors.length){for(const error of errors)console.error(`ERROR: ${error}`);process.exit(1);}
console.log('Status: PASS');