// Synthetic loopback host for actual candidate code and canonical authority.
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const here=new URL('./',import.meta.url),repo=new URL('../../foundations/',here);
export const A={id:'11111111-1111-4111-8111-111111111111',organization_id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',role:'student',display_name:'Synthetic A'};
export const B={id:'22222222-2222-4222-8222-222222222222',organization_id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',role:'student',display_name:'Synthetic B'};
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
export async function createPracticeAtomicFixture(){
 const names=['question-bank/js/learning-system.js','question-bank/js/learning-transition.mjs','js/owned-learning-store.mjs','js/owned-learning-bootstrap.mjs','js/owned-learning-transport.mjs','question-bank/js/practice-flow.mjs'];
 const paths=new Map(names.map(name=>[name,new URL('source/'+name,here)]));paths.set('js/institution-client.js',new URL('source/js/institution-client.js',here));
 const sources=new Map([...paths].map(([name,path])=>[name,readFileSync(path)]));
 const accounts=new Map(),requests=[],unexpected=[],gates=[];let origin,holdToken=null;
 const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>P2 compound practice transaction fixture</title></head><body><main><h1>Owned learning candidate</h1><p id="status">Initializing</p><p id="profile"></p><p id="attempts"></p><button id="record">Record synthetic response</button></main>
 <script src="/candidate/js/institution-client.js"></script><script src="/candidate/question-bank/js/learning-system.js"></script><script type="module">
 import {createOwnedLearning} from '/candidate/js/owned-learning-bootstrap.mjs';
 import {openOwnedLearningStore,JOURNAL_DATABASE} from '/candidate/js/owned-learning-store.mjs';
 window.DB_NAME=JOURNAL_DATABASE;window.controllers=[];window.handles=[];window.intents=[];window.effects=[];window.privateErrors=[];window.rawEvents=[];window.openCount=0;window.transactions=0;
 for(const type of ['echs:learning-attempt','echs:learning-session','echs:achievement','echs:lesson-completed'])addEventListener(type,e=>rawEvents.push(e.type));
 document.addEventListener('echs:learning-updated',e=>rawEvents.push(e.type));
 const nativeOpen=IDBFactory.prototype.open;IDBFactory.prototype.open=function(name,...rest){if(name===JOURNAL_DATABASE)openCount++;return nativeOpen.call(this,name,...rest)};
 const nativeTransaction=IDBDatabase.prototype.transaction;IDBDatabase.prototype.transaction=function(names,...rest){if(this.name===JOURNAL_DATABASE&&Array.isArray(names)&&names.length===6)transactions++;return nativeTransaction.call(this,names,...rest)};
 const q=id=>({id,bank_code:'SYNTHETIC',type:'mcq',prompt_text:'Synthetic function',metadata:{difficulty:2},classification:{course_scope:'AP Precalculus',ap_unit:1,ap_topic:'1.1',ap_topic_title:'Functions'}});
 function clear(){document.querySelector('#profile').textContent='';document.querySelector('#attempts').textContent=''}
 window.fixture={
  async create(options={}){
   let controller,postCommitDone=false;const args={authority:ECHSInstitution.ownerAuthority,onChange:state=>{
    document.querySelector('#status').textContent=state.status;
    if(state.status!=='ready')clear();else if(controller){try{const h=controller.capture();document.querySelector('#profile').textContent=h.profile().name;document.querySelector('#attempts').textContent=String(h.summary().attempts);
     if(!postCommitDone&&h.summary().attempts>0){postCommitDone=true;if(options.refreshOnCommit)window.postCommitRefresh=h.refresh();if(options.switchOnCommit)ECHSInstitution.setSession(options.switchOnCommit,true)}
    }catch{clear()}}
   },onEffects:rows=>effects.push(...rows)};
   if(options.notifications===false)args.channelFactory=()=>null;
   if(options.fixedTime!==undefined)args.clock=()=>options.fixedTime;
   if(options.fixedRandom!==undefined)args.random=()=>options.fixedRandom;
   controller=createOwnedLearning(args);controllers.push(controller);const h=await controller.ready();handles.push(h);
   document.querySelector('#record').onclick=async()=>{try{await h.recordAttempt({question:q('clicked'),correct:true,response:'B'})}catch(e){privateErrors.push(e.code)}};
   return{controller:controllers.length-1,handle:handles.length-1};
  },
  async classic(){const h=await ECHSLearning.ready();handles.push(h);return handles.length-1},
  async reentrantReady(dispose=false){
   let controller,phase='initializing';const seen=new Set(),promises=[];
   const reenter=label=>state=>{if(state.status===phase&&!seen.has(label+phase)){seen.add(label+phase);promises.push(controller.ready());if(dispose)controller.dispose()}};
   controller=createOwnedLearning({authority:ECHSInstitution.ownerAuthority,channelFactory:()=>null,onChange:reenter('change')});controllers.push(controller);controller.subscribe(reenter('subscriber'));
   const first=controller.ready();let values=await Promise.allSettled([first,...promises]);
   const describe=entry=>entry.status==='rejected'?{status:'rejected',code:entry.reason.code}:{status:'fulfilled',valid:entry.value?.contract==='echs.learning.owned.v1',same:entry.value===controller.capture(),account_id:entry.value?.binding().account_id};
   const initial=values.map(describe);if(dispose)return{initial};
   const h=await first;phase='refreshing';promises.length=0;const refreshed=h.refresh();values=await Promise.allSettled(promises);await refreshed;
   return{initial,refreshed:values.map(describe)};
  },
  prepare(h,method,args=[]){const value=handles[h].prepare(method,args);intents.push(value);return{index:intents.length-1,value}},
  commit(h,index){return handles[h].commit(intents[index])},
  attempt(h,id,correct=true,extra={}){return handles[h].recordAttempt({question:{...q(id),...(extra.question||{})},correct,response:'synthetic response',...(extra.input||{})})},
  start(work){window.pendingResult=undefined;Promise.resolve().then(work).then(value=>pendingResult={ok:true,value},error=>pendingResult={ok:false,code:error.code||error.name})},
  async dump(){const r=indexedDB.open(JOURNAL_DATABASE,1),db=await new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});const value={};await new Promise((resolve,reject)=>{const tx=db.transaction(['owners','records','attempts','states','commands','history']);for(const name of ['owners','records','attempts','states','commands','history']){const q=tx.objectStore(name).getAll();q.onsuccess=()=>value[name]=q.result}tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error)});db.close();return value},
  async hold(){const request=indexedDB.open(JOURNAL_DATABASE,1),db=await new Promise(resolve=>request.onsuccess=()=>resolve(request.result));window.lockReleased=false;window.lockActive=false;const tx=db.transaction(['states'],'readwrite'),store=tx.objectStore('states'),deadline=Date.now()+14000;
   window.lockDone=new Promise(resolve=>{tx.oncomplete=()=>{db.close();resolve()};tx.onabort=()=>{db.close();resolve()}});function pump(){const r=store.get(['fixture','lock']);r.onsuccess=()=>{window.lockActive=true;if(!window.lockReleased&&Date.now()<deadline)pump()}}pump();return true;
  },
  failCommandOnce(){const original=IDBObjectStore.prototype.add;window.abortedAfterRequestSuccess=false;IDBObjectStore.prototype.add=function(...args){const result=original.apply(this,args);if(this.name==='commands'){IDBObjectStore.prototype.add=original;result.addEventListener('success',()=>{abortedAfterRequestSuccess=true;this.transaction.abort()},{once:true})}return result}},
  failQuotaOnce(){const original=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...args){if(this.name==='records'){IDBObjectStore.prototype.put=original;throw new DOMException('Synthetic capacity refusal','QuotaExceededError')}return original.apply(this,args)}},
  openStore:options=>openOwnedLearningStore({authority:ECHSInstitution.ownerAuthority,...options}),
 };window.fixtureReady=true;
 </script></body></html>`;
 const server=createServer(async(req,res)=>{try{
  const u=new URL(req.url,origin||'http://127.0.0.1');requests.push({path:u.pathname,method:req.method});res.setHeader('cache-control','no-store');
  if(u.pathname==='/candidate/config/institution.json'){res.setHeader('content-type','application/json');res.end(JSON.stringify({enabled:true,api_base:origin+'/api'}));return}
  if(u.pathname==='/api/account-api/me'){
   const token=String(req.headers.authorization||'').replace(/^Bearer /,''),value=accounts.get(token),frozen=value?structuredClone(value):null;
   if(token===holdToken)await new Promise(resolve=>gates.push(resolve));res.setHeader('content-type','application/json');
   if(!frozen||frozen.fail){res.statusCode=401;res.end(JSON.stringify({ok:false,error:{code:'unauthenticated'}}));return}
   res.end(JSON.stringify({ok:true,account:{...frozen.account,expires_at:frozen.expires_at}}));return;
  }
  if(u.pathname==='/candidate/'){res.setHeader('content-type','text/html');res.end(html);return}
  const name=u.pathname.startsWith('/candidate/')?u.pathname.slice(11):null;
  if(sources.has(name)){res.setHeader('content-type','text/javascript');res.end(sources.get(name));return}
  unexpected.push({path:u.pathname,method:req.method});res.statusCode=404;res.end('Unavailable');
 }catch{res.statusCode=500;res.end('Fixture error')}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin='http://127.0.0.1:'+server.address().port;
 return{origin,requests,unexpected,session(account=A,token='synthetic-a',lifetime=3600000){const value={account,token,expires_at:new Date(Date.now()+lifetime).toISOString()};accounts.set(token,value);return value},
  fail(token){accounts.get(token).fail=true},hold(token){holdToken=token},release(){holdToken=null;gates.splice(0).forEach(fn=>fn())},
  sources:()=>[...sources].map(([name,bytes])=>({path:name,bytes:bytes.length,sha256:hash(bytes)})),unchanged:()=>[...paths].every(([name,path])=>sources.get(name).equals(readFileSync(path))),
  async close(){holdToken=null;gates.splice(0).forEach(fn=>fn());await new Promise(resolve=>server.close(resolve))},
 };
}
