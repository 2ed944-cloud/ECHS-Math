import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {webcrypto, createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const official=path.join(root,'question-bank/official');
const origin='https://example.test',base=origin+'/ECHS-Math/';
const manifestURL=base+'question-bank/official/data/student/publication-boundary.json';
const source=fs.readFileSync(path.join(root,'sw.js'),'utf8');
const paths=new Set();
function seed(value){if(Array.isArray(value))value.forEach(seed);else if(value&&typeof value==='object')for(const [key,item]of Object.entries(value)){if(key==='path'&&typeof item==='string'&&item.startsWith('media/'))paths.add(item);seed(item)}}
for(const file of fs.readdirSync(path.join(official,'data/student/questions')))seed(JSON.parse(fs.readFileSync(path.join(official,'data/student/questions',file),'utf8')));
const directCount=paths.size,pending=[...paths];
while(pending.length){const relative=pending.pop();if(!relative.endsWith('.svg'))continue;const text=fs.readFileSync(path.join(official,relative),'utf8');const refs=[...text.matchAll(/(?:xlink:)?href\s*=\s*["']([^"']+)/g)].map(x=>x[1]);refs.push(...[...text.matchAll(/url\(["']?([^\)"']+)/g)].map(x=>x[1]));for(const ref of refs){if(ref.startsWith('#')||ref.startsWith('data:'))continue;const resolved=path.resolve(official,path.dirname(relative),ref),next=path.relative(official,resolved).split(path.sep).join('/');assert.ok(next.startsWith('media/'));if(!paths.has(next)){paths.add(next);pending.push(next)}}}
const manifest={contract:'echs.public-question-boundary.v1',counts:{student_ready:1104,archive_records:1217,restricted_archive:113,direct_media:1193,media_files:1277},media:[...paths].sort()};
const manifestText=JSON.stringify(manifest,null,2)+'\n';
const pin='c4fcdce623c44155185719ab4612045a5f3ef7fd1b979a7019c3e68655b13069';
assert.equal(directCount,1193);assert.equal(paths.size,1277);assert.equal(createHash('sha256').update(manifestText).digest('hex'),pin);
const safe=base+'question-bank/official/'+manifest.media[0];
const raw=base+'question-bank/official/data/questions/chunk-016.json';
const unapproved=base+'question-bank/official/media/never-approved.svg';
const jsonResponse=text=>new Response(text,{headers:{'content-type':'application/json'}});
const urlOf=request=>typeof request==='string'?new URL(request,base).href:request.url;
class MemoryCache{
  values=new Map();
  async put(request,response){this.values.set(urlOf(request),response.clone())}
  async match(request){return this.values.get(urlOf(request))?.clone()}
  async keys(){return [...this.values.keys()].map(url=>new Request(url))}
  async delete(request){return this.values.delete(urlOf(request))}
  async add(){/* Optional shell fixture. */}
  async addAll(){/* Required shell fixture. */}
}
function harness({offline=false,manifestMode='valid',fastTimeout=false,optionalMode='normal',requiredFailure=false}={}){
  const cacheMap=new Map(),requests=[],handlers={},requiredBatches=[],pendingFetches=[];let cancelCount=0,claimed=0,skipped=0,optionalAborts=0,optionalCancellations=0,clock=Date.now();
  const caches={async open(name){if(!cacheMap.has(name)){
    const cache=new MemoryCache(),put=cache.put.bind(cache);
    cache.addAll=async batch=>{requiredBatches.push(Array.from(batch,urlOf));if(requiredFailure)throw new Error('Synthetic required shell failure')};
    cache.put=async(request,response)=>{const url=urlOf(request);if(url!==manifestURL&&optionalMode==='stalled-store')return new Promise(()=>{});if(url!==manifestURL&&optionalMode==='stalled-read'){await response.arrayBuffer();return}return put(request,response)};
    cacheMap.set(name,cache);
  }return cacheMap.get(name)},async keys(){return [...cacheMap.keys()]},async delete(name){return cacheMap.delete(name)},async match(request){for(const cache of cacheMap.values()){const result=await cache.match(request);if(result)return result}}};
  const context=vm.createContext({self:{location:{href:base+'sw.js',origin},addEventListener:(name,callback)=>handlers[name]=callback,skipWaiting:async()=>{skipped++},clients:{claim:async()=>{claimed++}}},caches,Request,Response,URL,Headers,AbortController,TextDecoder,Uint8Array,crypto:webcrypto,Date:class extends Date{static now(){return clock}},setTimeout:fastTimeout?(callback,delay)=>setTimeout(callback,Math.min(delay,15)):setTimeout,clearTimeout,console,
    fetch:async(request,options={})=>{const url=urlOf(request);requests.push({url,options,request});if(offline)throw new TypeError('Synthetic offline');if(url===manifestURL){if(manifestMode==='network-error')throw new TypeError('Synthetic manifest network failure');if(manifestMode==='http-error')return new Response('',{status:404});if(manifestMode==='malformed')return jsonResponse('{"contract":"wrong"}');if(manifestMode==='extra-key')return jsonResponse(JSON.stringify({...manifest,private:'CANARY'}));if(manifestMode==='oversized')return jsonResponse('x'.repeat(262145));if(manifestMode==='stalled')return new Response(new ReadableStream({cancel(){cancelCount++}}),{headers:{'content-type':'application/json'}});return jsonResponse(manifestText)}
      if(optionalMode==='stalled-fetch'){options.signal.addEventListener('abort',()=>optionalAborts++);return new Promise(resolve=>pendingFetches.push(resolve))}
      if(optionalMode==='stalled-read'){return new Response(new ReadableStream({start(controller){options.signal.addEventListener('abort',()=>{optionalAborts++;controller.error(new Error('Synthetic optional read aborted'))})},cancel(){optionalCancellations++}}))}
      if(optionalMode==='http-error')return new Response('Synthetic missing optional shell',{status:404});
      return new Response('NETWORK PUBLIC RESPONSE',{headers:{'content-type':url.endsWith('.json')?'application/json':'image/svg+xml'}})}
  });
  vm.runInContext(source,context,{filename:'sw.js'});
  const names=vm.runInContext('({static:STATIC_CACHE,runtime:RUNTIME_CACHE})',context);
  async function dispatch(url,options){const waits=[];let response;handlers.fetch({request:new Request(url,options),respondWith:value=>{response=value},waitUntil:value=>waits.push(value)});const result=await response;await Promise.all(waits);return result}
  async function activate(){let result;handlers.activate({waitUntil:value=>{result=value}});await result}
  async function install(){let result;handlers.install({waitUntil:value=>{result=value}});await result}
  async function primeManifest(){await(await caches.open(names.static)).put(manifestURL,jsonResponse(manifestText))}
  return {cacheMap,caches,requests,names,requiredBatches,dispatch,activate,install,primeManifest,setManifestMode(value){manifestMode=value},setOffline(value){offline=value},advance(milliseconds){clock+=milliseconds},releaseLateFetches(){for(const resolve of pendingFetches.splice(0))resolve(new Response(new ReadableStream({cancel(){optionalCancellations++}})))},get cancelCount(){return cancelCount},get claimed(){return claimed},get skipped(){return skipped},get optionalAborts(){return optionalAborts},get optionalCancellations(){return optionalCancellations}};
}

const checks=[];
async function test(name,run){await run();checks.push({name,status:'PASS'});console.log(`PASS ${checks.length}: ${name}`)}
await test('Exact source-derived approved manifest matches worker pin',async()=>{assert.match(source,new RegExp(pin));assert.equal(manifest.media.length,1277)});
await test('Raw canonical and admin data use no-store without cache writes',async()=>{const h=harness();for(const url of [raw,base+'question-bank/official/admin/data/questions/chunk-016.json',base+'question-bank/official/data/admin-audit-overrides.json']){await h.dispatch(url);assert.equal(h.requests.at(-1).options.cache,'no-store')}assert.equal(h.cacheMap.size,0)});
await test('Raw data cannot fall back to an old cached payload offline',async()=>{const h=harness({offline:true});await(await h.caches.open(h.names.runtime)).put(raw,new Response('PRIVATE CANARY'));await assert.rejects(h.dispatch(raw),/offline/)});
await test('Unapproved media cannot fall back offline',async()=>{const h=harness({offline:true});await h.primeManifest();await(await h.caches.open(h.names.runtime)).put(unapproved,new Response('PRIVATE CANARY'));await assert.rejects(h.dispatch(unapproved),/offline/)});
await test('Approved media retains offline cache through a verified same-version manifest',async()=>{const h=harness({offline:true});await h.primeManifest();await(await h.caches.open(h.names.runtime)).put(safe,new Response('APPROVED CACHED MEDIA'));assert.equal(await(await h.dispatch(safe)).text(),'APPROVED CACHED MEDIA')});
await test('Missing manifest fails closed even when image cache is populated',async()=>{const h=harness({offline:true});await(await h.caches.open(h.names.runtime)).put(safe,new Response('UNVERIFIED CANARY'));await assert.rejects(h.dispatch(safe),/offline/)});
await test('Malformed online manifest never falls back to cached approval',async()=>{const h=harness({manifestMode:'malformed'});await h.primeManifest();await(await h.caches.open(h.names.runtime)).put(safe,new Response('OLD CANARY'));assert.equal(await(await h.dispatch(safe)).text(),'NETWORK PUBLIC RESPONSE');assert.equal(h.requests.at(-1).options.cache,'no-store')});
await test('HTTP-failed manifest fails closed rather than using older approval',async()=>{const h=harness({manifestMode:'http-error'});await h.primeManifest();await h.dispatch(safe);assert.equal(h.requests.at(-1).options.cache,'no-store')});
await test('Modified schema and oversized manifests fail closed',async()=>{for(const mode of ['extra-key','oversized']){const h=harness({manifestMode:mode});await h.dispatch(safe);assert.equal(h.requests.at(-1).options.cache,'no-store')}});
await test('Stalled manifest read is bounded and canceled',async()=>{const h=harness({manifestMode:'stalled',fastTimeout:true});await h.dispatch(safe);assert.equal(h.requests.at(-1).options.cache,'no-store');assert.equal(h.cancelCount,1)});
await test('Activation purges denied entries while retaining approved and unrelated entries',async()=>{const h=harness();const cache=await h.caches.open('independent-public-assets');for(const url of [raw,unapproved,safe,base+'assets/echs_logo.png'])await cache.put(url,new Response('CACHED'));await h.activate();assert.equal(await cache.match(raw),undefined);assert.equal(await cache.match(unapproved),undefined);assert.ok(await cache.match(safe));assert.ok(await cache.match(base+'assets/echs_logo.png'));assert.equal(h.claimed,1)});
await test('Failed approval purges media cache without touching unrelated entries',async()=>{const h=harness({manifestMode:'malformed'});const cache=await h.caches.open('independent-public-assets');await cache.put(safe,new Response('CACHED'));await cache.put(base+'assets/echs_logo.png',new Response('CACHED'));await h.activate();assert.equal(await cache.match(safe),undefined);assert.ok(await cache.match(base+'assets/echs_logo.png'))});
await test('Queries, encoded separators, and traversal do not inherit media approval',async()=>{for(const url of [safe+'?download=1',safe.replace('/media/','/media%2f'),base+'question-bank/official/media/%2e%2e/data/questions/chunk-016.json',base+'question-bank%5cofficial%5cdata%5cquestions%5cchunk-016.json']){const h=harness();await h.dispatch(url);assert.equal(h.requests.at(-1).options.cache,'no-store')}});
await test('Package and backup paths bypass stale cache',async()=>{const h=harness({offline:true});for(const part of ['.staging/chunk-0','packages/part.b64','.deploy/trigger.txt','.echs-backups/old.json','artifacts/private-report.json']){const url=base+part;await(await h.caches.open(h.names.runtime)).put(url,new Response('OLD PACKAGE'));await assert.rejects(h.dispatch(url),/offline/)}});
await test('Authenticated API and public trust paths retain their existing distinct behavior',async()=>{const h=harness();await h.dispatch('https://school.supabase.co/functions/v1/lesson-api/lessons',{headers:{authorization:'Bearer SYNTHETIC'}});assert.equal(h.requests.at(-1).options.cache,'no-store');const trust=base+'question-bank/official/admin/data/question-trust-manifest.json';await h.dispatch(trust);assert.ok(await(await h.caches.open(h.names.runtime)).match(trust))});
await test('Tampered cached manifest never authorizes offline content',async()=>{const h=harness({offline:true});await(await h.caches.open(h.names.static)).put(manifestURL,jsonResponse(JSON.stringify({...manifest,media:[unapproved,...manifest.media.slice(1)]})));await(await h.caches.open(h.names.runtime)).put(unapproved,new Response('PRIVATE CANARY'));await assert.rejects(h.dispatch(unapproved),/offline/)});
await test('Unknown student and rights files cannot bypass the closed path boundary',async()=>{const h=harness({offline:true});const cache=await h.caches.open('independent-public-assets');const unknown=[base+'question-bank/official/data/student/raw-private-canary.json',base+'question-bank/official/data/rights/extra-private.json'];for(const url of unknown){await cache.put(url,new Response('PRIVATE CANARY'));await assert.rejects(h.dispatch(url),/offline/)}await h.activate();for(const url of unknown)assert.equal(await cache.match(url),undefined)});
await test('Transient manifest failure recovers after bounded backoff without a worker restart',async()=>{const h=harness({manifestMode:'network-error'});await h.dispatch(safe);assert.equal(h.requests.at(-1).options.cache,'no-store');h.setManifestMode('valid');await h.dispatch(safe);assert.equal(h.requests.filter(x=>x.url===manifestURL).length,1);h.advance(5001);await h.dispatch(safe);assert.equal(h.requests.filter(x=>x.url===manifestURL).length,2);h.setOffline(true);assert.equal(await(await h.dispatch(safe)).text(),'NETWORK PUBLIC RESPONSE')});
await test('Historical same-URL archive bytes and raw teacher shells never supply fallback',async()=>{const h=harness({offline:true});await h.primeManifest();const cache=await h.caches.open('historical-other-cache');const changed=[base+'question-bank/official/data/student/archive-questions/chunk-018.json',base+'question-bank/official/data/student/archive-index.json',base+'question-bank/official/admin/teacher.html',base+'question-bank/official/admin/import.html'];for(const url of changed){await cache.put(url,new Response('PRIVATE OLD SAME URL'));assert.equal((await h.dispatch(url)).type,'error')}await h.activate();for(const url of changed)assert.equal(await cache.match(url),undefined)});
await test('Newly projected archive bytes remain available from the current release cache',async()=>{const h=harness();const archive=base+'question-bank/official/data/student/archive-questions/chunk-018.json';await h.dispatch(archive);h.setOffline(true);assert.equal(await(await h.dispatch(archive)).text(),'NETWORK PUBLIC RESPONSE')});
async function boundedInstall(h){let timer;try{await Promise.race([h.install(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Install exceeded the synthetic global deadline')),1000)})])}finally{clearTimeout(timer)}}
await test('Required shell failure remains fatal before any optional work or activation',async()=>{
  const h=harness({requiredFailure:true});await assert.rejects(h.install(),/required shell failure/);
  assert.equal(h.skipped,0);assert.equal(h.requests.length,0);
  assert.deepEqual(h.requiredBatches[0].map(url=>url.slice(base.length)),['offline.html','login.html','js/institution-client.js','js/login.js','css/platform-usability.css']);
});
await test('Successful install retains required batch and caches every optional public response',async()=>{
  const h=harness();await h.install();assert.equal(h.skipped,1);assert.equal(h.requiredBatches.length,1);assert.equal(h.requiredBatches[0].length,5);
  const optional=h.requests.filter(row=>row.url!==manifestURL);assert.equal(optional.length,109);
  assert.equal((await(await h.caches.open(h.names.static)).keys()).length,110);
  for(const row of optional){assert.equal(row.request.cache,'reload');assert.ok(row.options.signal instanceof AbortSignal);assert.ok(await(await h.caches.open(h.names.static)).match(row.url))}
});
await test('Missing optional shell responses do not block install or enter the cache',async()=>{
  const h=harness({optionalMode:'http-error'});await h.install();assert.equal(h.skipped,1);
  assert.equal((await(await h.caches.open(h.names.static)).keys()).length,1);
});
await test('One global deadline aborts stalled optional fetches and discards late responses',async()=>{
  const h=harness({optionalMode:'stalled-fetch',fastTimeout:true});await boundedInstall(h);
  assert.equal(h.skipped,1);assert.equal(h.optionalAborts,109);assert.equal((await(await h.caches.open(h.names.static)).keys()).length,1);
  h.releaseLateFetches();await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(h.optionalCancellations,109);assert.equal((await(await h.caches.open(h.names.static)).keys()).length,1);
});
await test('Stalled optional response bodies are aborted without holding install open',async()=>{
  const h=harness({optionalMode:'stalled-read',fastTimeout:true});await boundedInstall(h);
  assert.equal(h.skipped,1);assert.equal(h.optionalAborts,109);assert.equal((await(await h.caches.open(h.names.static)).keys()).length,1);
});
await test('Unresponsive optional CacheStorage writes cannot hold install open',async()=>{
  const h=harness({optionalMode:'stalled-store',fastTimeout:true});await boundedInstall(h);
  assert.equal(h.skipped,1);assert.equal(h.requests.filter(row=>row.url!==manifestURL).length,109);
  assert.equal((await(await h.caches.open(h.names.static)).keys()).length,1);
});
const report={stage:'ECHS-C01',suite:'public-question-service-worker',status:'PASS',passed:checks.length,checks,production_calls:false,external_network:false,scope:'Actual worker code in isolated synthetic CacheStorage/fetch lifecycle; real source-derived pinned manifest. Browser caches not modified.'};
fs.mkdirSync(path.join(root,'artifacts/public-question-boundary'),{recursive:true});fs.writeFileSync(path.join(root,'artifacts/public-question-boundary/worker.json'),JSON.stringify(report,null,2)+'\n');
console.log(`Public question worker: ${checks.length} groups PASS`);
