import {readFile} from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(process.argv[2]||'.');
const read=relative=>readFile(path.join(root,relative),'utf8');
const lessonPath='lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.1_standard_form_ECHS.html';
const runtimePath='lessons/ib-math-ai/unit-1/data/lesson-1.1-ti84-real-inline-v6-9.js';
const bridgePath='lessons/ib-math-ai/unit-1/data/lesson-1.1-ti84-local-bridge-v6-8-2.js';
const cssPath='lessons/ib-math-ai/unit-1/assets/css/lesson-1.1-ti84-real-v6-9.css';
const learnerPath='lessons/ib-math-ai/unit-1/data/lesson-1.1-learner-view-v6-6.js';
const catalogPath='data/ib-math-ai-unit-1-delivery-catalog.json';
const portalPath='data/ib-math-ai-unit-1-update.js';

const [html,runtime,bridge,css,learner,catalogRaw,portal]=await Promise.all([
  read(lessonPath),read(runtimePath),read(bridgePath),read(cssPath),read(learnerPath),read(catalogPath),read(portalPath)
]);
const failures=[];
const requireText=(text,needle,label)=>{if(!text.includes(needle))failures.push(`${label} missing ${needle}`);};
const forbidText=(text,needle,label)=>{if(text.includes(needle))failures.push(`${label} still contains ${needle}`);};

for(const marker of [
  'lesson-1.1-ti84-real-v6-9.css?v=6.9.1',
  'lesson-1.1-ti84-real-inline-v6-9.js?v=6.9.1',
  'lesson-1.1-ti84-local-bridge-v6-8-2.js?v=6.8.2',
  '1.1 · Scientific Notation, Approximation and Error'
])requireText(html,marker,'Lesson 1.1 HTML');
for(const obsolete of [
  'lesson-1.1-ti84-local-v6-8.css?v=6.8.0',
  'lesson-1.1-ti84-local-v6-8.js?v=6.8.0',
  'lesson-1.1-ti84-local-input-v6-8-1.js?v=6.8.1',
  'lesson-1.1-ti84-inline-dock-v6-4.js',
  'lesson-1.1-ti84-simulator-v6-7.js'
])forbidText(html,obsolete,'Lesson 1.1 HTML');

for(const marker of [
  "const URL='https://ti84calc.com/ti84calc'",
  "model:'TI-84 Plus CE'",
  "provider:'ti84calc.com'",
  'realCalculatorInterface:true',
  "layoutRelease:'6.9.1'",
  'horizontalShellScroll:false',
  'visibleHeaderAnchoring:true',
  'function visibleRouteBottom(topbarBottom)',
  'rect.top<=topbarBottom+90',
  'settleGeometry()',
  'sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups allow-modals allow-downloads"',
  "document.addEventListener('echs:ti84:simulator',open)",
  "document.body.classList.add('ti84-inline-open')",
  'ti84-inline-dock',
  'ti84-inline-launch',
  'l11-real84-header-launch'
])requireText(runtime,marker,'Real TI-84 runtime');

for(const marker of [
  ':root{--ti84-inline-width:clamp(500px,36vw,640px)',
  '#ti84-inline-dock.ti84-inline-dock.open',
  'body.ti84-inline-open .app-shell',
  'body.ti84-inline-open .footer',
  '#ti84-inline-dock .ti84-inline-frame-shell{position:relative!important;min-width:0!important;min-height:0!important;height:auto!important;overflow:hidden!important',
  '#ti84-inline-dock .ti84-inline-frame-shell iframe{position:relative!important;inset:auto!important;display:none!important;width:100%!important;height:100%!important;min-width:0!important;min-height:0!important',
  '@media(max-width:980px)'
])requireText(css,marker,'Real TI-84 styles');
for(const forbidden of [
  '#ti84-inline-dock .ti84-inline-frame-shell{position:relative;min-height:0;overflow:auto',
  'min-height:900px'
])forbidText(css,forbidden,'Real TI-84 styles');

for(const marker of ['echs:ti84:open','echs:ti84:simulator','pairedPracticeConnected:true','.ti84-paired-strip button'])requireText(bridge,marker,'TI-84 bridge');
for(const marker of ['core (teach in class)','estimated teaching time:','extension','practice','revision'])requireText(learner,marker,'Learner-label cleanup');

let catalog;
try{catalog=JSON.parse(catalogRaw);}catch(error){failures.push(`Delivery catalog JSON is invalid: ${error.message}`);catalog={};}
const lesson11=(catalog.lessons||[]).find(item=>item.number==='1.1')||{};
if(lesson11.title!=='Scientific Notation, Approximation and Error')failures.push(`Catalog title is ${lesson11.title}`);
if(lesson11.release!=='6.9.0')failures.push(`Catalog release is ${lesson11.release}`);
if(lesson11.default_scope!=='IB SL Core')failures.push('Catalog default scope is not IB SL Core');
if(lesson11.calculator?.model!=='TI-84 Plus CE')failures.push('Catalog calculator model is not TI-84 Plus CE');
if(lesson11.calculator?.simulator!=='real TI-84 Plus CE online simulator')failures.push('Catalog real simulator label is missing');
if(lesson11.calculator?.provider!=='ti84calc.com'||lesson11.calculator?.external_dependency!==true)failures.push('Catalog external real-simulator metadata is incomplete');
if(lesson11.calculator?.lazy_loaded!==true||lesson11.calculator?.sandboxed!==true)failures.push('Catalog simulator safety/loading metadata is incomplete');
if(JSON.stringify(lesson11.scope_counts)!==JSON.stringify({learn:{core:70,all:79},practice:{core:88,all:96},quiz:{core:12,all:14},tasks:{core:4,all:5}}))failures.push(`Catalog scope counts are incorrect: ${JSON.stringify(lesson11.scope_counts)}`);

for(const marker of [
  '"1.1","Scientific Notation, Approximation and Error"',
  '"6.9.0",79,96,14,5',
  'model:"TI-84 Plus CE"',
  'simulator:"real TI-84 Plus CE online simulator"',
  'provider:"ti84calc.com"',
  'externalDependency:true',
  '{label:"Complete interactive lesson",url,type:"resource"}'
])requireText(portal,marker,'Unit 1 portal metadata');
forbidText(portal,'simulator:"ECHS local lesson simulator"','Unit 1 portal metadata');
forbidText(portal,'externalDependency:false','Unit 1 portal metadata');

console.log('IB AI SL Lesson 1.1 real TI-84 Plus CE v6.9.1 layout validation');
console.log(`Root: ${root}`);
console.log(`Failures: ${failures.length}`);
for(const failure of failures)console.log(`- ${failure}`);
if(failures.length)process.exit(1);
console.log('Status: PASS');
