import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import zlib from 'node:zlib';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const dataDir=path.join(root,'lessons/ib-math-ai/unit-5/data');
const packageDir=path.join(dataDir,'lesson-5.5-package');
const lessonPath=path.join(root,'lessons/ib-math-ai/unit-5/lessons/IB_AI_SL_5.5_optimisation_modelling_ECHS.html');
const loaderPath=path.join(dataDir,'lesson-5.5.js');
const fixesPath=path.join(dataDir,'lesson-5.5-runtime-fixes.js');
const chunks=['chunk-00.b64','chunk-01.b64','chunk-02-00.b64','chunk-02-01.b64','chunk-02-02.b64','chunk-03-00.b64','chunk-03-01.b64','chunk-03-02.b64'];

for(const file of [lessonPath,loaderPath,fixesPath,...chunks.map(name=>path.join(packageDir,name))]){
  assert.ok(fs.existsSync(file),`Missing Lesson 5.5 runtime-audit file: ${path.relative(root,file)}`);
}

const encoded=chunks.map(name=>fs.readFileSync(path.join(packageDir,name),'utf8').replace(/\s+/g,'')).join('');
const pack=JSON.parse(zlib.gunzipSync(Buffer.from(encoded,'base64')).toString('utf8'));
const context=vm.createContext({window:{},console,URLSearchParams,Math,Date,JSON,String,Number,Array,Object,Set,Map,RegExp});
pack.preEngine.forEach((source,index)=>new vm.Script(source,{filename:pack.moduleNames.preEngine[index]}).runInContext(context));
new vm.Script(fs.readFileSync(fixesPath,'utf8'),{filename:'lesson-5.5-runtime-fixes.js'}).runInContext(context);

const d=context.window.LESSON_DATA;
assert.deepEqual(JSON.parse(JSON.stringify(context.window.__ECHS_LESSON55_RUNTIME_FIXES__)),{applied:8,version:'5.5.1'});
const slide=title=>{
  const item=d.slides.find(entry=>entry.title===title);
  assert.ok(item,`Missing audited slide: ${title}`);
  return item.html;
};
assert.match(slide('A fixed perimeter produces a one-variable area'),/\\\(0\\le x\\le P\/2\\\)/);
assert.match(slide('A fixed volume can become a minimum-surface problem'),/\\\(h=V_0\/\(\\pi r\^2\)\\\)/);
assert.match(slide('A fixed volume can become a minimum-surface problem'),/\\\(r>0\\\)/);
assert.match(slide('Check adjacent whole-number decisions'),/step \\\(1\\\)/);
assert.match(slide('Find derivative candidates, then compare a table'),/\\\(Y_1\\\).*\\\(Y_2\\\)/);
const restricted=d.exam.find(task=>task.id==='IBAI-5.5-V1-T5')?.parts.find(part=>part.label==='c')?.prompt;
assert.equal(restricted,String.raw`Monitoring stops after 3 hours. Determine the maximum observed concentration on \([0,3]\).`);

const serialized=JSON.stringify({slides:d.slides,practice:d.practice,quiz:d.quiz,exam:d.exam});
for(const remnant of [
  'Let the side lengths be (x) and (y)',
  'The feasible domain is (0le xle P/2)',
  'Let a closed cylinder have radius (r)',
  'So (h=V_0/(pi r^2))',
  'The physical domain is (r>0)',
  'step (1) near the continuous optimum',
  'objective in (Y_1)',
  'on ([0,3])'
]) assert.ok(!serialized.includes(remnant),`Uncorrected Lesson 5.5 remnant: ${remnant}`);

const loader=fs.readFileSync(loaderPath,'utf8');
assert.match(loader,/pack\.preEngine\.forEach[\s\S]*lesson-5\.5-runtime-fixes\.js\?v=5\.5\.1[\s\S]*katex-global\.js/,'Runtime corrections must load after lesson data and before KaTeX rendering.');
assert.match(fs.readFileSync(lessonPath,'utf8'),/lesson-5\.5\.js\?v=5\.5\.1/,'Lesson shell must use the corrected loader cache key.');

console.log('PASS · IB AI SL Lesson 5.5 runtime math corrections');
