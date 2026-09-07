import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url),base=new URL('../lessons/ap-calculus/unit-1/',import.meta.url);
const load=name=>require(fileURLToPath(new URL('assets/'+name,base)));
const M=load('limit-lesson-models.js'),L=load('unit1-continuation-labs.js');
const k=vm.createContext({window:{},console});vm.runInContext(fs.readFileSync(new URL('../lessons/ib-math-ai/unit-1/assets/js/katex-global.js',import.meta.url),'utf8'),k);
const manifest=JSON.parse(fs.readFileSync(new URL('../docs/releases/ap-calculus-1-7-1-16-coverage.json',import.meta.url),'utf8'));
let equations=0,questions=0;
for(let n=7;n<=16;n++){
 const d=load(`lesson-1-${n}-ab.js`),entry=manifest.lessons.find(l=>l.topic===`1.${n}`);assert.equal(d.number,`1.${n}`);assert.equal(d.questions.length,16);assert.equal(d.frqs.length,2);assert.equal(new Set(d.questions.map(q=>q.id)).size,16);
 for(const q of d.questions){questions++;assert.equal(q.topic,d.number);assert.equal(q.source,'Original ECHS item');for(const key of ['prompt','hint','solution','lo','skill','representation'])assert.ok(q[key],`${d.number}/${q.id} lacks ${key}`);assert.equal(typeof q.calculator,'boolean');if(q.type==='mcq'){assert.equal(q.choices.length,4);assert.equal(new Set(q.choices).size,4);assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4);}else{assert.equal(q.type,'number');assert.ok(M.correctAnswer(String(q.answer),q.answer),`${d.number}/${q.id}: unsupported answer ${q.answer}`);}if(q.visual){assert.ok(q.visual.caption);assert.ok(q.visual.paths.length);}}
 for(const f of d.frqs){assert.equal(f.parts.length,3);for(const p of f.parts)assert.ok(p.prompt&&p.rubric);}
 function visit(x){if(typeof x==='string'){for(const match of x.matchAll(/\\\((.*?)\\\)/gs)){k.window.katex.renderToString(match[1],{throwOnError:true,strict:'ignore'});equations++;}}else if(Array.isArray(x))x.forEach(visit);else if(x&&typeof x==='object')Object.values(x).forEach(visit);}
 visit(d);
 const html=fs.readFileSync(new URL('../'+entry.url,import.meta.url),'utf8');assert.match(html,new RegExp('data-lesson="1\\.'+n+'"'));assert.equal((html.match(/data-question=/g)||[]).length,16);assert.equal((html.match(/data-frq=/g)||[]).length,2);assert.ok(html.includes('apclassroom.collegeboard.org/25/home?unit=1&amp;subunit=')||html.includes(`apclassroom.collegeboard.org/25/home?unit=1&subunit=${n}`));
 for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)){const ref=match[1].split('?')[0];if(!/^https?:/.test(ref))assert.ok(fs.existsSync(new URL(ref,new URL('../'+entry.url,import.meta.url))),`Missing local reference ${ref}`);}
 for(let c=0;c<L.labels[n].length;c++)for(const t of ([9,10,11,13].includes(n)?[-1,0,1,2,3,4,5,6]:n===16?[-1,0,1,2,3,4,5,6,7]:[1,2,3,4])){const lab=L.model(n,c,t);assert.ok(lab.fields.length);k.window.katex.renderToString(lab.tex,{throwOnError:true,strict:'ignore'});for(const f of lab.fields)assert.ok(f.options?f.options.includes(f.answer):M.correctAnswer(String(f.answer),f.answer));}
}
// Independent mathematical identities and edge cases for the live controls.
assert.equal(L.model(7,1).fields[1].answer,-6);assert.equal(L.model(7,2).fields[1].answer,1/6);assert.equal(L.model(7,3).fields[1].answer,'DNE');
assert.equal(L.model(8,0).fields[2].answer,'The limit is 3');assert.equal(L.model(8,1).fields[2].answer,'The bounds are inconclusive');
assert.equal(L.model(10,0,2).fields[0].answer,'None');assert.equal(L.model(10,0,5).fields[0].answer,'Removable');assert.equal(L.model(10,1,2).fields[0].answer,'Jump');
assert.equal(L.model(11,0,2).fields.at(-1).answer,'Yes');assert.equal(L.model(11,1,2).fields.at(-1).answer,'No');assert.equal(L.model(13,1,2).fields[0].answer,'DNE');
for(const [c,expected] of [[0,['-infinity','infinity','DNE']],[1,['infinity','-infinity','DNE']],[2,['infinity','infinity','infinity']],[3,['-infinity','-infinity','-infinity']]])assert.deepEqual(L.model(14,c).fields.map(f=>f.answer),expected);
assert.deepEqual(L.model(15,2).fields.map(f=>f.answer),[-1,1]);assert.equal(L.model(16,0,3).fields[1].answer,'Yes');assert.equal(L.model(16,0,0).fields[1].answer,'No');assert.equal(L.model(16,0,6).fields[1].answer,'No');assert.equal(L.model(16,1,3).fields[1].answer,'No');
assert.equal(M.correctAnswer('1/6',1/6),true);assert.equal(M.correctAnswer('0/0',0),false);assert.equal(M.correctAnswer('DNE','infinity'),false);assert.equal(M.correctAnswer('-∞','-infinity'),true);
console.log(`Unit 1 continuation content: PASS (${questions} original questions, 20 FRQs, ${equations} authored equations, all investigation branches and local references).`);
