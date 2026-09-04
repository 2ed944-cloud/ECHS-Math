import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const storage=()=>{const values=new Map();return{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)}};
function clientHarness(fetcher){
  const localStorage=storage(),sessionStorage=storage(),events=[];
  const document={currentScript:{src:'https://example.test/ECHS-Math/js/institution-client.js'},readyState:'loading',addEventListener(){},dispatchEvent:e=>events.push(e.type)};
  const window={addEventListener(){}};
  const context=vm.createContext({document,window,location:{href:'https://example.test/ECHS-Math/'},localStorage,sessionStorage,navigator:{onLine:true},fetch:fetcher,URL,Headers,FormData,Blob,AbortController,Date,console,setTimeout,clearTimeout,CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail}},addEventListener(){}});
  vm.runInContext(read('js/institution-client.js'),context);
  return{client:window.ECHSInstitution,window,context,localStorage,sessionStorage,events};
}
const config={enabled:true,api_base:'https://example.test/functions/v1'};
const response=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});
const a={id:'student-a',role:'student',display_name:'Student A'};
const b={id:'student-b',role:'student',display_name:'Student B'};
const session=(account,token)=>({account,token,expires_at:new Date(Date.now()+3600000).toISOString()});
let scenario='success',requests=[],releaseLate;
const h=clientHarness(async(url,options={})=>{
  if(String(url).endsWith('institution.json'))return response(config);
  requests.push({url,options});
  if(scenario==='network')throw new TypeError('Failed to fetch');
  if(scenario==='late401')return new Promise(resolve=>{releaseLate=()=>resolve(response({ok:false,error:{message:'expired'}},401))});
  if(scenario==='timeout')return new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError'))));
  if(scenario==='multi')return response({ok:false,results:[{ok:true},{ok:false}]},207);
  if(String(url).endsWith('/me'))return response({ok:true,account:a});
  return response({ok:true});
});
h.client.setSession(session(a,'token-a'),true);
scenario='network';await assert.rejects(h.client.me(true),/Could not connect/);assert.equal(h.client.token(),'token-a','A network failure must preserve the session');
scenario='success';assert.equal((await h.client.me(true)).id,a.id);
scenario='late401';const late=h.client.api('account-api','/me');await new Promise(resolve=>setImmediate(resolve));h.client.setSession(session(b,'token-b'),true);releaseLate();await assert.rejects(late,/expired/);assert.equal(h.client.token(),'token-b','An old request must not sign out a newly authenticated user');
scenario='timeout';await assert.rejects(h.client.api('account-api','/me',{timeoutMs:5}),/too long/);assert.equal(h.client.token(),'token-b');
scenario='multi';assert.equal((await h.client.api('institution-api','/batch')).results.length,2,'Partial batch results remain available');
scenario='success';h.client.setSession(session(a,'token-a'),true);
h.window.ECHSLearning={exportStudentReport:()=>({summary:{}}),attempts:()=>[{id:'event-1',questionId:'q1',correct:true}],sessions:()=>[{id:'session-1',answered:1}],masteryRows:()=>[],reviewMap:()=>({q1:{questionId:'q1',unresolved:false}})};
await h.client.syncLearning();const sent=JSON.parse(requests.at(-1).options.body);assert.equal(sent.attempts[0].id,'event-1');assert.equal(sent.sessions[0].id,'session-1');assert.equal(sent.review[0].questionId,'q1');assert.equal(requests.at(-1).options.cache,'no-store');
h.context.navigator.onLine=false;await h.client.syncLearning();const pending=JSON.parse(h.localStorage.getItem('echs_institution_pending_sync_v1:student-a'));assert.equal(pending.accountId,a.id);
h.context.navigator.onLine=true;h.client.setSession(session(b,'token-b'),true);
// Force a verified B account without changing the pending A upload.
const q=clientHarness(async(url,options)=>String(url).endsWith('institution.json')?response(config):String(url).endsWith('/me')?response({ok:true,account:b}):(requests.push({url,options}),response({ok:true})));
q.client.setSession(session(b,'token-b'),true);q.localStorage.setItem('echs_institution_pending_sync_v1',JSON.stringify(pending));const before=requests.length;await q.client.flushPending();assert.equal(requests.length,before,'A queued upload cannot be sent as another student');assert.ok(q.localStorage.getItem('echs_institution_pending_sync_v1'));
q.localStorage.setItem('echs_institution_expires_v1','invalid');assert.equal(await q.client.me(true),null,'Invalid expiry cannot create a durable session');
const offlineReload=clientHarness(async()=>{throw new Error('Offline sync must not request the server')});offlineReload.client.setSession(session(a,'token-a'),true);offlineReload.context.navigator.onLine=false;await offlineReload.client.syncLearning();assert.ok(offlineReload.localStorage.getItem('echs_institution_pending_sync_v1:student-a'),'An offline reload can queue work without a verification request');
let configCalls=0;const retry=clientHarness(async()=>{if(++configCalls===1)throw new TypeError('offline');return response(config)});assert.ok((await retry.client.config()).configuration_error);assert.equal((await retry.client.config()).enabled,true,'Configuration loading can recover without clearing credentials');

// Service worker privacy, cache failures, and optional install assets.
const handlers={},cacheWrites=[],networkRequests=[];let offline=false;
const cache={match:async()=>null,put:async(request)=>{cacheWrites.push(request.url)},addAll:async()=>{},add:async()=>{throw new Error('optional missing')}};
const worker=vm.createContext({self:{location:{href:'https://example.test/ECHS-Math/sw.js',origin:'https://example.test'},addEventListener:(name,fn)=>handlers[name]=fn,skipWaiting:async()=>{},clients:{claim:async()=>{}}},caches:{open:async()=>cache,match:async()=>null,keys:async()=>[],delete:async()=>true},Request,Response,URL,AbortController,setTimeout,clearTimeout,fetch:async(request,options)=>{networkRequests.push({url:request.url,options});if(offline)throw new TypeError('offline');return new Response('asset',{headers:{'cache-control':request.url.includes('private-header')?'private, no-store':'public'}})}});
vm.runInContext(read('sw.js'),worker);
const dispatch=async(request)=>{let result;const waits=[];handlers.fetch({request,respondWith:value=>result=value,waitUntil:value=>waits.push(value)});const response=await result;await Promise.all(waits);return response};
await dispatch(new Request('https://example.test/ECHS-Math/protected.json',{headers:{authorization:'Bearer abc'}}));
await dispatch(new Request('https://school.supabase.co/storage/v1/object/sign/bank.pdf?token=abc'));
assert.equal(cacheWrites.length,0,'Authenticated responses and signed assets must bypass caches');assert.ok(networkRequests.every(r=>r.options?.cache==='no-store'));
await dispatch(new Request('https://example.test/ECHS-Math/private-header.json'));assert.equal(cacheWrites.length,0,'Private response headers prohibit cache writes');
offline=true;const request=new Request('https://cdn.jsdelivr.net/npm/katex/dist/katex.min.js');Object.defineProperty(request,'destination',{value:'script'});assert.equal((await dispatch(request)).type,'error','A failed first asset request must return a Response, not undefined');
let installation;handlers.install({waitUntil:p=>installation=p});await installation;
console.log('Platform resilience: PASS (session races, timeouts, sync payloads, queue ownership, private caching, optional assets)');
