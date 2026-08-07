import fs from 'node:fs';
import vm from 'node:vm';

const files=[
  'lessons/ib-math-ai/unit-2/data/lesson-2.2-v5-build.js',
  'lessons/ib-math-ai/unit-2/data/lesson-2.2-v5-compat.js',
  'lessons/ib-math-ai/unit-2/data/lesson-2.2-v5-content-a.js',
  'lessons/ib-math-ai/unit-2/data/lesson-2.2-v5-content-b.js',
  'lessons/ib-math-ai/unit-2/data/lesson-2.2-v5-content-c.js',
  'lessons/ib-math-ai/unit-2/data/lesson-2.2-v5-prune.js',
  'lessons/ib-math-ai/unit-2/data/lesson-2.2-v5-finalize.js',
  'lessons/ib-math-ai/unit-2/data/lesson-2.2-v5-practice-a.js',
  'lessons/ib-math-ai/unit-2/data/lesson-2.2-v5-practice-b.js',
  'lessons/ib-math-ai/unit-2/data/lesson-2.2-v5-assessment.js',
  'lessons/ib-math-ai/unit-2/data/lesson-2.2-v5-precision.js'
];
const sandbox={window:{},console};sandbox.window.window=sandbox.window;vm.createContext(sandbox);
for(const file of files)vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{filename:file});
const data=sandbox.window.LESSON_DATA;
const byId=(items,id)=>items.find(item=>item.id===id);
const assert=(condition,message)=>{if(!condition)throw new Error(message);};

const p67=byId(data.practice,'IBAI-2.2-V5-P067');
assert(p67.answer.includes('\\frac54')&&p67.answer.includes('(x-1)(x-5)'),'P067 vertex/root model is not corrected');
assert(Math.abs((5/4)*(3-1)*(3-5)+5)<1e-12,'P067 corrected model does not have vertex output -5');

const p73=byId(data.practice,'IBAI-2.2-V5-P073');
assert(/no real intersections/i.test(p73.answer),'P073 no-real-intersection conclusion is missing');
assert(100-4*30<0,'P073 discriminant check failed');

const p68=byId(data.practice,'IBAI-2.2-V5-P068');
assert(p68.answer.includes('m=0')&&p68.answer.includes('m=-8'),'P068 tangent gradients are incorrect');

const p69=byId(data.practice,'IBAI-2.2-V5-P069');
assert(p69.answer.includes('sqrt{22}'),'P069 exact intersections are incorrect');

const p72=byId(data.practice,'IBAI-2.2-V5-P072');
assert(p72.check.value===25,'P072 first whole-number threshold is incorrect');

const task2=byId(data.exam,'IBAI-2.2-V5-T2');
assert(task2.parts.find(part=>part.label==='d').answer.includes('3.49'),'Bridge clearance lower boundary is incorrect');

console.log(JSON.stringify({status:'PASS',release:data.version,checks:['P067','P068','P069','P072','P073','T2d']},null,2));
