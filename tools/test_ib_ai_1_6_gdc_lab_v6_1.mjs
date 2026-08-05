import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const html=await readFile(new URL('lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.6_technology_equations_ECHS.html',root),'utf8');
const js=await readFile(new URL('lessons/ib-math-ai/unit-1/data/lesson-1.6-technology-v6-gdc-lab.js',root),'utf8');
const css=await readFile(new URL('lessons/ib-math-ai/unit-1/assets/css/lesson-1.6-technology-v6-gdc-lab.css',root),'utf8');

const fail=message=>{throw new Error(message)};
const expect=(condition,message)=>{if(!condition)fail(message)};

expect(html.includes('lesson-1.6-technology-v6-gdc-lab.css?v=6.1.0'),'wrapper GDC CSS');
expect(html.includes('lesson-1.6-technology-v6-gdc-lab.js?v=6.1.0'),'wrapper GDC JavaScript');
expect(html.indexOf('lesson-1.6-technology-equations-v6.css')<html.indexOf('lesson-1.6-technology-v6-gdc-lab.css'),'GDC CSS order');
expect(html.indexOf('lesson-1.6-technology-v6-interactions.js')<html.indexOf('lesson-1.6-technology-v6-gdc-lab.js'),'GDC interaction order');
expect(html.indexOf('lesson-1.6-technology-v6-gdc-lab.js')<html.indexOf('unit-1-v5-runtime.js'),'GDC runtime order');

for(const marker of [
  'ECHS GDC Laboratory','solveSystemMode','solvePolynomialMode','solveIntersectionMode','solveMatrixMode',
  'rref(','determinant(','inverse(','quadraticRoots(','cubicRoots(','findIntersections(',
  'gdcEvidenceRecorder','Alt+G','externalApi:false','offline:true','data-gdc-key',
  'IB TECHNOLOGY EVIDENCE','Calculator entry','Independent check','Contextual interpretation'
])expect(js.includes(marker),`missing GDC contract ${marker}`);

for(const marker of [
  '.echs-gdc-dialog','.gdc-device','.gdc-screen-panel','.gdc-keypad','.gdc-evidence-panel',
  '.gdc-context-launch','@media(max-height:800px)','@media(max-width:760px)','--gdc-screen'
])expect(css.includes(marker),`missing GDC CSS contract ${marker}`);

for(const forbidden of ['<iframe','fetch(','XMLHttpRequest','https://','http://','ti.com','casio.com']){
  expect(!js.toLowerCase().includes(forbidden.toLowerCase()),`external or branded dependency detected: ${forbidden}`);
}
expect(!/\.katex[^\{]*\{[^}]*display\s*:/s.test(css),'GDC CSS must not alter KaTeX internals');

// Independently verify the numerical examples used by the GDC presets.
function solve2(a,b,c,d,e,f){
  const det=a*e-b*d;
  return[(c*e-b*f)/det,(a*f-c*d)/det];
}
const [x,y]=solve2(2,3,13,4,-1,5);
expect(Math.abs(x-2)<1e-12&&Math.abs(y-3)<1e-12,'default 2x2 system solution');

function polynomial(x){return x**3-2*x**2-5*x+6;}
for(const rootValue of [-2,1,3])expect(Math.abs(polynomial(rootValue))<1e-12,`cubic preset root ${rootValue}`);

function bisection(fn,a,b){
  let fa=fn(a);
  for(let i=0;i<100;i++){
    const mid=(a+b)/2,fm=fn(mid);
    if(Math.abs(fm)<1e-14)return mid;
    if(fa*fm<=0)b=mid;else{a=mid;fa=fm;}
  }
  return(a+b)/2;
}
const intersection=bisection(value=>4*value+9-55*(0.86**value),4,5);
expect(Math.abs(intersection-4.61012765154382)<1e-9,'linear-exponential GDC preset intersection');

// Execute the metadata tail in a minimal environment to confirm the lesson contract.
const tail=js.slice(js.indexOf('data.gdcLab='));
const close=tail.lastIndexOf('})();');
const snippet=`(function(){const data=window.LESSON_DATA;${tail.slice(0,close)}})();`;
const context={window:{LESSON_DATA:{lesson:{number:'1.6'},interactions:{}}}};
vm.createContext(context);
vm.runInContext(snippet,context);
expect(context.window.LESSON_DATA.gdcLab.release==='6.1.0','GDC metadata release');
expect(context.window.LESSON_DATA.gdcLab.modes.length===4,'four GDC modes');
expect(context.window.LESSON_DATA.gdcLab.evidenceFields.length===6,'six-field technology evidence');

console.log('IB AI SL Lesson 1.6 ECHS GDC Laboratory v6.1 validation');
console.log(JSON.stringify({modes:4,evidenceFields:6,offline:true,externalApi:false,defaultSystem:[x,y],intersection},null,2));
console.log('Status: PASS');
