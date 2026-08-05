import fs from 'node:fs';

const root=process.argv[2]||'.';
const read=path=>fs.readFileSync(`${root}/${path}`,'utf8');
const html=read('lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.6_technology_equations_ECHS.html');
const visuals=read('lessons/ib-math-ai/unit-1/data/lesson-1.6-visual-accuracy-v6-3.js');
const visualCss=read('lessons/ib-math-ai/unit-1/assets/css/lesson-1.6-visual-accuracy-v6-3.css');
const official=read('lessons/ib-math-ai/unit-1/data/lesson-1.6-ti84-official-paths-v6-3.js');
const dock=read('lessons/ib-math-ai/unit-1/data/lesson-1.6-ti84-inline-dock-v6-3.js');
const dockCss=read('lessons/ib-math-ai/unit-1/assets/css/lesson-1.6-ti84-inline-dock-v6-3.css');
const errors=[];
const need=(condition,message)=>{if(!condition)errors.push(message);};

for(const removed of ['lesson-1.6-technology-v6-gdc-lab.css','lesson-1.6-technology-v6-gdc-external-tools.css','lesson-1.6-technology-v6-gdc-lab.js','lesson-1.6-technology-v6-gdc-external-tools.js'])need(!html.includes(removed),`Obsolete GDC asset still loaded: ${removed}`);
for(const asset of ['lesson-1.6-visual-accuracy-v6-3.css?v=6.3.0','lesson-1.6-ti84-inline-dock-v6-3.css?v=6.3.0','lesson-1.6-visual-accuracy-v6-3.js?v=6.3.0','lesson-1.6-ti84-official-paths-v6-3.js?v=6.3.0','lesson-1.6-ti84-inline-dock-v6-3.js?v=6.3.0'])need(html.includes(asset),`Missing v6.3 asset: ${asset}`);
need(html.indexOf('lesson-1.6-ti84-classroom-workflows-v6-2-2.js')<html.indexOf('lesson-1.6-ti84-official-paths-v6-3.js'),'Official path corrections must load after workflow data');
need(html.indexOf('lesson-1.6-ti84-official-paths-v6-3.js')<html.indexOf('lesson-1.6-ti84-classroom-runtime-v6-2-1.js'),'Official path corrections must load before classroom runtime');

for(const title of ['Three equations as three planes','Root, zero and x-intercept are the same condition','Multiplicity changes how a graph meets the axis','Intersections solve an equation in two equivalent ways','Context can reject mathematically valid roots'])need(visuals.includes(`replace('${title}'`),`Missing corrected slide: ${title}`);
for(const marker of ['Multiplicity 1','Multiplicity 2','Multiplicity 3','1-\\sqrt5','1+\\sqrt5','-0.0815','3.7550','three distinct surfaces share one point'])need(visuals.includes(marker),`Visual accuracy marker missing: ${marker}`);
for(const marker of ['.te63-planes-layout','.te63-equivalence','.te63-multiplicity-grid','.te63-intersection-layout','.te63-domain-flow'])need(visualCss.includes(marker),`Visual CSS marker missing: ${marker}`);

for(const marker of ['2nd','x⁻¹ (MATRIX)','→ (MATH)','↓ to rref(','2:zero','5:intersect','Left Bound','Right Bound','First curve?','Second curve?','Guess'])need(official.includes(marker),`Official TI-84 route marker missing: ${marker}`);
need(official.includes("officialPathAudit:'6.3.0'"),'Official TI path audit metadata missing');
need(official.includes("primaryCalculator:'TI-84 Plus CE handheld'"),'Physical TI-84 primary-calculator contract missing');

for(const marker of ['https://ti84calc.com/ti84calc','ti84-inline-dock','ti84-inline-launch','body.classList.add(\'ti84-inline-open\')','sandbox="allow-scripts allow-same-origin','layout:\'docked beside slide\''])need(dock.includes(marker),`Inline simulator contract missing: ${marker}`);
for(const marker of ['body.ti84-inline-open .app-shell','body.ti84-inline-open .footer','--ti84-inline-width','.ti84-inline-dock.open'])need(dockCss.includes(marker),`Inline simulator CSS missing: ${marker}`);

const roots=[(-18-Math.sqrt(18**2-4*(-4.9)*1.5))/(2*(-4.9)),(-18+Math.sqrt(18**2-4*(-4.9)*1.5))/(2*(-4.9))].sort((a,b)=>a-b);
need(Math.abs(roots[0]+0.08152409593)<1e-9&&Math.abs(roots[1]-3.75499348368)<1e-9,'Contextual quadratic root recomputation failed');
const x1=1-Math.sqrt(5),x2=1+Math.sqrt(5);
need(Math.abs((2*x1+1)-(x1*x1-3))<1e-12&&Math.abs((2*x2+1)-(x2*x2-3))<1e-12,'Intersection exact-coordinate audit failed');

console.log('IB AI SL Lesson 1.6 TI-84-only inline release v6.3');
console.log(JSON.stringify({gdcLoaded:false,correctedSlides:5,officialWorkflows:6,simulatorLayout:'beside slide'},null,2));
if(errors.length){for(const error of errors)console.error(`ERROR: ${error}`);process.exit(1);}console.log('Status: PASS');
