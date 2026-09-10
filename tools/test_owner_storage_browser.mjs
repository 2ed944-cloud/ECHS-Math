// Actual-Chromium acceptance of the canonical client and owner-storage foundation.
// Only a loopback fixture server is reachable. No production or learner requests.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {chromium} from '../question-bank/official/tools/node_modules/playwright/index.mjs';

const here=new URL('./',import.meta.url),candidate=new URL('../',here);
const sourcePaths=['js/institution-client.js','js/owner-storage.mjs'];
const sources=new Map(sourcePaths.map(p=>[p,readFileSync(new URL(p,candidate))]));
const hash=b=>createHash('sha256').update(b).digest('hex');
const A={id:'11111111-1111-4111-8111-111111111111',organization_id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',role:'student',display_name:'Synthetic A',username:'synthetic-a'};
const B={id:'22222222-2222-4222-8222-222222222222',organization_id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',role:'student',display_name:'Synthetic B',username:'synthetic-b'};
const accounts=new Map(),requests=[],releaseGates=[];
let holdToken=null,heldCount=0,origin;
const TOKEN='echs_institution_token_v1',ACCOUNT='echs_institution_account_v1',EXPIRES='echs_institution_expires_v1';
const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Isolated ownership fixture</title></head><body>
<main><h1>Ownership lifecycle fixture</h1><p id="projection">No active owner</p></main>
<script src="/fixture/js/institution-client.js"></script>
<script type="module">
import {createOwnerStorage,createGuestOwnerStorage} from '/fixture/js/owner-storage.mjs';
const events=[],invalidations=[],handles=[];
window.addEventListener('storage',e=>events.push({key:e.key}));
const onInvalidate=event=>{invalidations.push(event);document.querySelector('#projection').textContent='Owner unavailable'};
const store=createOwnerStorage({storage:localStorage,authority:ECHSInstitution.ownerAuthority,onInvalidate});
const guests=createGuestOwnerStorage({authority:ECHSInstitution.ownerAuthority,onInvalidate});
window.test={events,invalidations,handles,store,guests,
 async open(domain='attempts',guest=false){const h=await(guest?guests:store).open({domain,revision:1});handles.push(h);document.querySelector('#projection').textContent=guest?'Guest':ECHSInstitution.account().display_name;return handles.length-1},
 signIn(data,remember=true){ECHSInstitution.setSession(data,remember)},
 read(index,item='row'){try{return{ok:true,value:handles[index].read(item)}}catch(e){return{ok:false,code:e.code}}},
 write(index,value,item='row'){return handles[index].write(item,value)},
 current(index){return{aborted:handles[index].signal.aborted,state:handles[index].state()}},
 clear(){ECHSInstitution.clearSession()},
};window.fixtureReady=true;
</script></body></html>`;
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,origin||'http://127.0.0.1');requests.push({path:url.pathname,method:req.method});
  res.setHeader('cache-control','no-store');
  if(url.pathname==='/fixture/config/institution.json'){
   res.setHeader('content-type','application/json');res.end(JSON.stringify({enabled:true,api_base:origin+'/api'}));return;
  }
  if(url.pathname==='/api/account-api/me'){
   const token=String(req.headers.authorization||'').replace(/^Bearer /,'');
   const frozen=accounts.get(token)?structuredClone(accounts.get(token)):null;
   if(token===holdToken){heldCount++;await new Promise(resolve=>releaseGates.push(resolve))}
   res.setHeader('content-type','application/json');
   if(!frozen||frozen.status===401){res.statusCode=401;res.end(JSON.stringify({ok:false,error:{code:'unauthenticated',message:'Synthetic sign-in required'}}));return}
   res.end(JSON.stringify({ok:true,account:{...frozen.account,expires_at:frozen.expires_at}}));return;
  }
  const file=url.pathname.startsWith('/fixture/')?url.pathname.slice('/fixture/'.length):null;
  if(sources.has(file)){res.setHeader('content-type','text/javascript');res.end(sources.get(file));return}
  if(url.pathname==='/fixture/'||url.pathname==='/fixture/login.html'){res.setHeader('content-type','text/html');res.end(html);return}
  res.statusCode=404;res.end('Fixture route unavailable');
 }catch{res.statusCode=500;res.end('Fixture failure')}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,executablePath:process.env.ECHS_CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined),args:['--no-proxy-server','--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1']});
const cases=[],results=[],unexpectedNetwork=[];
const test=(name,run)=>cases.push({name,run});
const session=(account,token='synthetic-a',lifetime=3600000)=>{const data={account,token,expires_at:new Date(Date.now()+lifetime).toISOString()};accounts.set(token,data);return data};
async function context(){const c=await browser.newContext();await c.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():(unexpectedNetwork.push(new URL(route.request().url()).origin),route.abort()));return c}
async function page(c){const p=await c.newPage();await p.goto(origin+'/fixture/');await p.waitForFunction(()=>window.fixtureReady);return p}
async function sign(p,s){await p.evaluate(s=>test.signIn(s),s)}
async function open(p){return p.evaluate(()=>test.open())}
async function waitHeld(count){const deadline=Date.now()+5000;while(heldCount<count&&Date.now()<deadline)await new Promise(r=>setTimeout(r,10));assert.equal(heldCount,count)}
function release(){holdToken=null;for(const done of releaseGates.splice(0))done()}

test('Two native tabs invalidate old owner, preserve original bytes and isolate successor reads',async()=>{
 const c=await context();try{const p=await page(c),q=await page(c);const a=session(A),b=session(B,'synthetic-b');
  await sign(p,a);const h=await open(p);await p.evaluate(h=>{localStorage.setItem('echs_learning_events_v2','[{"id":"unowned-synthetic"}]');test.write(h,{id:'a-event',score:73})},h);
  const owned=await p.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('echs_owned_v1:')).map(k=>[k,localStorage.getItem(k)]));
  await sign(q,b);await p.waitForFunction(h=>test.handles[h].signal.aborted,h);assert.equal((await p.evaluate(h=>test.read(h),h)).ok,false);
  const bh=await open(q);assert.equal((await q.evaluate(h=>test.read(h),bh)).value,null);await q.evaluate(h=>test.write(h,{id:'b-event'}),bh);
  assert.deepEqual(await p.evaluate(keys=>keys.map(([k])=>[k,localStorage.getItem(k)]),owned),owned);
  assert.equal(await p.evaluate(()=>localStorage.getItem('echs_learning_events_v2')),'[{"id":"unowned-synthetic"}]');
  assert.equal(await p.locator('#projection').textContent(),'Owner unavailable');
 }finally{await c.close()}
});

test('Native A-to-B-to-A credential events invalidate the old epoch even when final credentials match',async()=>{
 const c=await context();try{const p=await page(c),q=await page(c),a=session(A),b=session(B,'synthetic-b');await sign(p,a);const h=await open(p);
  await q.evaluate(({a,b})=>{test.signIn(b);test.signIn(a)},{a,b});await p.waitForFunction(h=>test.handles[h].signal.aborted,h);
  assert.equal(await p.evaluate(()=>ECHSInstitution.account().id),A.id);assert.equal((await p.evaluate(h=>test.read(h),h)).ok,false);
 }finally{await c.close()}
});

test('Unrelated native storage events leave the verified account handle usable',async()=>{
 const c=await context();try{const p=await page(c),q=await page(c);await sign(p,session(A));const h=await open(p);await p.evaluate(h=>test.write(h,{kept:true}),h);
  await q.evaluate(()=>localStorage.setItem('unrelated-fixture-preference','changed'));await p.waitForFunction(()=>test.events.some(e=>e.key==='unrelated-fixture-preference'));
  assert.deepEqual(await p.evaluate(h=>test.read(h),h),{ok:true,value:{kept:true}});
 }finally{await c.close()}
});

test('Delayed old 401 cannot redirect or mark the successor unavailable',async()=>{
 const c=await context();try{const p=await page(c),a=session(A),b=session(B,'synthetic-b');await sign(p,a);accounts.get(a.token).status=401;holdToken=a.token;const expected=heldCount+1;
  await p.evaluate(()=>{window.authResult=undefined;ECHSInstitution.requireAuth(['student']).then(x=>window.authResult=x)});await waitHeld(expected);await sign(p,b);release();
  await p.waitForFunction(()=>window.authResult!==undefined);assert.equal(p.url(),origin+'/fixture/');
  assert.equal(await p.evaluate(()=>ECHSInstitution.account().id),B.id);assert.equal(await p.locator('#institutionAuthUnavailable').count(),0);
  assert.notEqual(await p.evaluate(()=>document.documentElement.dataset.institution),'unavailable');
 }finally{release();await c.close()}
});

test('Current session 401 still signs out and redirects to sign-in',async()=>{
 const c=await context();try{const p=await page(c),a=session(A);await sign(p,a);accounts.get(a.token).status=401;
  await p.evaluate(()=>{void ECHSInstitution.requireAuth(['student'])});await p.waitForURL(url=>url.pathname==='/fixture/login.html');
  assert.equal(await p.evaluate(key=>localStorage.getItem(key),TOKEN),null);
 }finally{await c.close()}
});

test('Idle expiry aborts handle and clears projection before a storage read',async()=>{
 const c=await context();try{const p=await page(c);await sign(p,session(A,'synthetic-short',1800));const h=await open(p);
  await p.waitForFunction(h=>test.handles[h].signal.aborted,h,{timeout:5000});assert.equal(await p.locator('#projection').textContent(),'Owner unavailable');
 }finally{await c.close()}
});

test('Browser storage property failure emits controlled invalidation and preserves stored raw bytes',async()=>{
 const c=await context();try{const p=await page(c);await sign(p,session(A));const h=await open(p);
  const result=await p.evaluate(({h,b})=>{const old=localStorage;old.setItem('unchanged-raw','keep');Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new DOMException('Fixture blocked','SecurityError')}});
   let code;try{test.signIn(b)}catch(e){code=e.code}return{code,aborted:test.handles[h].signal.aborted,raw:old.getItem('unchanged-raw')}} ,{h,b:session(B,'synthetic-b')});
  assert.deepEqual(result,{code:'session_unavailable',aborted:true,raw:'keep'});
 }finally{await c.close()}
});

test('Guest data is ephemeral and an old guest handle cannot read a later guest session',async()=>{
 const c=await context();try{const p=await page(c);const h=await p.evaluate(()=>test.open('attempts',true));await p.evaluate(h=>test.write(h,{id:'guest-event'}),h);
  assert.equal(await p.evaluate(()=>Object.keys(localStorage).some(k=>k.includes('guest'))),false);await sign(p,session(A));
  await p.evaluate(()=>test.clear());const newer=await p.evaluate(()=>test.open('attempts',true));assert.equal((await p.evaluate(h=>test.read(h),newer)).value,null);
  assert.equal((await p.evaluate(h=>test.read(h),h)).ok,false);
 }finally{await c.close()}
});

try{
 for(const entry of cases){try{await entry.run();results.push({name:entry.name,status:'PASS'})}catch(e){results.push({name:entry.name,status:'FAIL',error:String(e.stack||e)});release()}}
 const unchanged=sourcePaths.every(p=>sources.get(p).equals(readFileSync(new URL(p,candidate))));
 const report={contract:'echs.c04.owner-browser.v1',status:results.every(x=>x.status==='PASS')&&unchanged&&!unexpectedNetwork.length?'PASS':'FAIL',browser:browser.version(),source_files:sourcePaths.map(path=>({path,bytes:sources.get(path).length,sha256:hash(sources.get(path))})),source_unchanged_during_run:unchanged,groups:results.length,passed:results.filter(x=>x.status==='PASS').length,results,loopback_requests:requests.length,unexpected_network:unexpectedNetwork,production_calls:0,active_source_edits:0,limits:['Actual Chromium tabs, native browser storage/events/timers; loopback synthetic HTTP accounts only.','Does not adopt any legacy learning producer/reader, prove real server revocation, or make localStorage compare/delete atomic across tabs.']};
 const arg=process.argv.indexOf('--report');if(arg>=0){const path=process.argv[arg+1];assert.ok(path&&!existsSync(path),'New report path required');writeFileSync(path,JSON.stringify(report,null,2)+'\n',{flag:'wx'})}
 console.log(JSON.stringify(report,null,2));if(report.status!=='PASS')process.exitCode=1;
}finally{release();await browser.close();await new Promise(resolve=>server.close(resolve))}
