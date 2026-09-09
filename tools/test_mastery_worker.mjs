/* Actual worker with isolated CacheStorage/fetch; no network or browser data. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash,webcrypto} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url),source=fs.readFileSync(new URL('sw.js',root),'utf8');
const prior=fs.readFileSync(new URL('tools/fixtures/c02-prior-worker.js',root),'utf8');
const base='https://fixture.test/ECHS-Math/',origin=new URL(base).origin;
const expected=['js/learning-evidence-status.mjs','js/portal.js','js/lesson-portal-overhaul.js','js/smart-learning-route.js','js/gamification-overlay.js','js/institution-experience.js','question-bank/js/learning-system.js','question-bank/js/teacher-evidence-heatmap.js','question-bank/js/student-cloud.js','question-bank/js/parent-cloud.js','question-bank/js/teacher-cloud.js','question-bank/js/dashboard.js','question-bank/js/learning-home.js','question-bank/js/parent.js','css/echs-design-system-v5-1.css','css/lesson-portal-overhaul.css'];
const documents=['index.html','preview.html','question-bank/student.html','question-bank/teacher.html','question-bank/parent.html','question-bank/dashboard.html'];
const shellResponse=(institutional=true)=>new Response('<!doctype html><html><body'+(institutional?' class="institutionBody"':'')+'><p>Provisional practice</p>'+'.'.repeat(1600)+'</body></html>',{headers:{'content-type':'text/html'}});
const urlOf=request=>typeof request==='string'?new URL(request,base).href:request.url;
class MemoryCache{
  entries=new Map();
  async put(request,response){this.entries.set(urlOf(request),response.clone())}
  async match(request,{ignoreSearch=false}={}){
    const wanted=new URL(urlOf(request));
    for(const [key,value]of this.entries){const url=new URL(key);if(key===wanted.href||(ignoreSearch&&url.origin===wanted.origin&&url.pathname===wanted.pathname))return value.clone()}
  }
  async keys(){return [...this.entries.keys()].map(url=>new Request(url))}
  async delete(request){return this.entries.delete(urlOf(request))}
}
function harness(){
  const stores=new Map(),handlers={},requests=[];let mode='offline',claims=0;
  const caches={async open(name){if(!stores.has(name))stores.set(name,new MemoryCache());return stores.get(name)},async keys(){return [...stores.keys()]},async delete(name){return stores.delete(name)},async match(request){for(const cache of stores.values()){const result=await cache.match(request);if(result)return result}}};
  const context=vm.createContext({self:{location:{href:base+'sw.js',origin},addEventListener:(name,fn)=>handlers[name]=fn,clients:{claim:async()=>claims++},skipWaiting:async()=>{}},Request,Response,URL,AbortController,TextDecoder,Uint8Array,crypto:webcrypto,setTimeout,clearTimeout,caches,console,fetch:async(request,options={})=>{requests.push({url:urlOf(request),request,options});if(mode==='offline')throw new TypeError('Synthetic offline');return new Response(mode==='bad-http'?'UNAVAILABLE':'CURRENT NETWORK BYTES',{status:mode==='bad-http'?503:200,headers:{'content-type':'text/javascript'}})}});
  vm.runInContext(source,context,{filename:'sw.js'});
  const names=vm.runInContext('({static:STATIC_CACHE,runtime:RUNTIME_CACHE})',context);
  async function dispatch(url,options){let result;const waits=[];handlers.fetch({request:new Request(url,options),respondWith:r=>{result=r},waitUntil:r=>waits.push(r)});const response=await result;await Promise.all(waits);return response}
  async function activate(){let result;handlers.activate({waitUntil:r=>{result=r}});await result}
  return {names,context,caches,requests,dispatch,activate,setMode(value){mode=value},get claims(){return claims}};
}
const checks=[];
async function test(name,run){await run();checks.push({name,status:'PASS'});console.log(`PASS ${checks.length}: ${name}`)}
await test('Exact release paths and prior-worker source binding',()=>{
  const h=harness();assert.deepEqual(Array.from(vm.runInContext('MASTERY_REPORT_ASSETS',h.context)),expected);
  assert.equal(createHash('sha256').update(prior).digest('hex'),'c0be954dcfc94284ed4299985fa7ead8e6d97b29325f5c92b52b68af50ead30a');
  assert.match(source,/public-question-boundary-c01-v1-mastery-truthfulness-c02-v1/);
});
await test('Every reporting asset rejects an old unknown cache even before activation',async()=>{
  const h=harness(),old=await h.caches.open('historical-unknown');
  for(const file of expected)for(const query of ['', '?v=old', '?v=old&echsEvidence=c02-v1']){const url=base+file+query;await old.put(url,new Response('FORGED OLD MASTERED'));assert.equal((await h.dispatch(url)).type,'error',url)}
});
await test('Activation removes old query variants but preserves current-release and unrelated bytes',async()=>{
  const h=harness(),old=await h.caches.open('historical-unknown'),current=await h.caches.open(h.names.runtime),shell=await h.caches.open(h.names.static);
  for(const file of expected){await old.put(base+file+'?v=old',new Response('OLD'));await current.put(base+file,new Response('CURRENT'));await shell.put(base+file,new Response('SHELL'))}
  await old.put(base+'assets/icon-192.png',new Response('UNRELATED'));await h.activate();
  for(const file of expected){assert.equal(await old.match(base+file+'?v=old'),undefined);assert.ok(await current.match(base+file));assert.ok(await shell.match(base+file))}
  assert.ok(await old.match(base+'assets/icon-192.png'));assert.equal(h.claims,1);
});
await test('Exact current runtime or installed shell works offline, with deliberate public query matching',async()=>{
  const h=harness(),current=await h.caches.open(h.names.runtime),shell=await h.caches.open(h.names.static);
  for(const file of expected){const url=base+file+'?v=prior&echsEvidence=c02-v1';await shell.put(base+file,new Response('CURRENT SHELL'));assert.equal(await(await h.dispatch(url)).text(),'CURRENT SHELL');await current.put(url,new Response('CURRENT RUNTIME'));assert.equal(await(await h.dispatch(url)).text(),'CURRENT RUNTIME')}
});
await test('Online responses bypass stale bytes and use reload before current cache update',async()=>{
  const h=harness();h.setMode('online');const url=base+expected[0]+'?echsEvidence=c02-v1';await(await h.caches.open(h.names.runtime)).put(url,new Response('PREVIOUS REQUEST'));
  assert.equal(await(await h.dispatch(url)).text(),'CURRENT NETWORK BYTES');assert.equal(h.requests.at(-1).request.cache,'reload');assert.ok(h.requests.at(-1).options.signal instanceof AbortSignal);
  h.setMode('offline');assert.equal(await(await h.dispatch(url)).text(),'CURRENT NETWORK BYTES');
});
await test('HTTP failure remains a failure and cannot replace current successful bytes',async()=>{
  const h=harness(),url=base+expected[1];await(await h.caches.open(h.names.runtime)).put(url,new Response('CURRENT VALID'));h.setMode('bad-http');const response=await h.dispatch(url);assert.equal(response.status,503);assert.equal(await response.text(),'UNAVAILABLE');h.setMode('offline');assert.equal(await(await h.dispatch(url)).text(),'CURRENT VALID');
});
await test('Authorization and token-bearing URLs remain no-store and never use public fallback',async()=>{
  const h=harness(),url=base+expected[2];await(await h.caches.open(h.names.runtime)).put(url,new Response('PUBLIC'));
  for(const [target,options]of [[url,{headers:{authorization:'Bearer SYNTHETIC'}}],[url+'?token=SYNTHETIC',undefined],['https://school.supabase.co/functions/v1/mastery-evidence/sync',undefined]]){await assert.rejects(h.dispatch(target,options),/offline/);assert.equal(h.requests.at(-1).options.cache,'no-store')}
});
await test('Only exact same-site asset paths receive the new fallback rule',()=>{
  const h=harness();for(const url of ['https://other.test/ECHS-Math/'+expected[0],origin+'/other/'+expected[0],base+'extra/'+expected[0],base+'js/portal.js.bak',base+'js%2fportal.js'])assert.equal(vm.runInContext(`masteryReportAsset(new URL(${JSON.stringify(url)}))`,h.context),false,url);
});
await test('All six entry documents and home alias reject and purge stale cross-release HTML',async()=>{
  const h=harness(),old=await h.caches.open('historical-document-cache');
  assert.deepEqual(Array.from(vm.runInContext('MASTERY_REPORT_DOCUMENTS',h.context)),documents);
  for(const name of [...documents,''])for(const query of ['', '?course=ap-calculus-ab']){const url=base+name+query;await old.put(url,shellResponse());assert.equal((await h.dispatch(url)).type,'error',url)}
  await old.put(base+'unrelated-help.html',shellResponse());await h.activate();
  for(const name of [...documents,''])assert.equal(await old.match(base+name),undefined);
  assert.ok(await old.match(base+'unrelated-help.html'));
});
await test('Only valid current institutional shells can supply offline role HTML',async()=>{
  const h=harness(),shell=await h.caches.open(h.names.static);
  for(const name of documents){await shell.put(base+name,shellResponse());assert.match(await(await h.dispatch(base+name+'?course=exact')) .text(),/Provisional practice/)}
  await shell.put(base+'question-bank/student.html',shellResponse(false));assert.equal((await h.dispatch(base+'question-bank/student.html')).type,'error','Missing institutionBody does not weaken validAuthShell');
  await shell.put(base+'index.html',new Response('<html>Bad shell</html>',{headers:{'content-type':'text/html'}}));assert.equal((await h.dispatch(base+'index.html')).type,'error');
});
await test('Entry HTTP errors and malformed online HTML never expose a cached older page',async()=>{
  const h=harness(),url=base+'question-bank/teacher.html';await(await h.caches.open(h.names.static)).put(url,shellResponse());h.setMode('bad-http');assert.equal((await h.dispatch(url)).status,503);h.setMode('online');assert.equal((await h.dispatch(url)).type,'error');
});
await test('C01 publication checks, optional deadline, and shell declarations are byte-preserved',()=>{
  const section=(text,start,end)=>text.slice(text.indexOf(start),text.indexOf(end,text.indexOf(start)));
  for(const [start,end]of [['const PUBLIC_QUESTION_BOUNDARY_SHA256','const PUBLIC_SITE_PATH'],['const PUBLIC_STUDENT_FILES','const SHELL'],['const SHELL','const AUTH_DOCUMENT'],['const REQUIRED_SHELL','self.addEventListener("activate"']])assert.equal(section(source,start,end),section(prior,start,end),start);
  assert.equal(section(source,'  const official=publicQuestionPath(url);','  if(sameOrigin&&AUTH_DOCUMENT'),section(prior,'  const official=publicQuestionPath(url);','  if(sameOrigin&&AUTH_DOCUMENT'));
});
const report={contract:'echs.mastery-worker.v1',status:'PASS',checks,passed:checks.length,source_sha256:createHash('sha256').update(source).digest('hex'),paths:expected,documents,production_calls:0};
const output=new URL('artifacts/mastery-truthfulness/worker.json',root);fs.mkdirSync(fileURLToPath(new URL('./',output)),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(`Mastery worker: ${checks.length} groups PASS`);
