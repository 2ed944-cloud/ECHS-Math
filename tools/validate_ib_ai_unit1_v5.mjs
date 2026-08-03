#!/usr/bin/env node
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
const root=path.resolve(process.argv[2]||'.');
const lessons={'1.2':'arithmetic_sequences','1.3':'geometric_sequences','1.4':'financial_models','1.5':'logarithms','1.6':'approximation_error','1.7':'loans_annuities','1.8':'technology_equations'};
const errors=[];
function load(ctx,rel){const p=path.join(root,rel);if(!fs.existsSync(p)){errors.push(`missing ${rel}`);return}try{vm.runInContext(fs.readFileSync(p,'utf8'),ctx,{filename:rel})}catch(e){errors.push(`${rel}: ${e.stack||e}`)}}
for(const number of Object.keys(lessons)){
 const sandbox={window:{},console};vm.createContext(sandbox);
 load(sandbox,`lessons/ib-math-ai/unit-1/data/lesson-${number}.js`);
 load(sandbox,`lessons/ib-math-ai/unit-1/data/lesson-${number}-v3.js`);
 load(sandbox,'lessons/ib-math-ai/unit-1/data/unit-1-v5-content-data.js');
 load(sandbox,'lessons/ib-math-ai/unit-1/data/unit-1-v5-apply.js');
 const d=sandbox.window.LESSON_DATA;
 if(!d){errors.push(`${number}: LESSON_DATA missing`);continue}
 const expected={slides:36,practice:52,quiz:14,exam:3};
 for(const [key,count] of Object.entries(expected)){if(!Array.isArray(d[key])||d[key].length!==count)errors.push(`${number}: ${key} expected ${count}, got ${d[key]&&d[key].length}`)}
 for(const key of ['practice','quiz','exam']){const ids=(d[key]||[]).map(x=>x.id).filter(Boolean);if(new Set(ids).size!==ids.length)errors.push(`${number}: duplicate ${key} ids`)}
 const pPrompts=new Set((d.practice||[]).map(q=>String(q.prompt||'').replace(/\s+/g,' ').trim().toLowerCase()));
 for(const q of d.quiz||[]){const norm=String(q.prompt||'').replace(/\s+/g,' ').trim().toLowerCase();if(norm&&pPrompts.has(norm))errors.push(`${number}: quiz repeats practice prompt ${q.id}`)}
 const serialized=JSON.stringify(d);if(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(serialized))errors.push(`${number}: control character in final data`);
 if(number==='1.2'){const fixed=(d.practice||[]).find(x=>String(x.id)==='u1-12-c08');if(fixed&&Number(fixed.check&&fixed.check.value)!==-60)errors.push('1.2: audited S10 repair not applied')}
}
console.log('IB Mathematics AI Unit 1 v5 data validator');console.log('Errors:',errors.length);for(const e of errors)console.error(' ERROR:',e);if(errors.length)process.exit(1);console.log('Status: PASS');
