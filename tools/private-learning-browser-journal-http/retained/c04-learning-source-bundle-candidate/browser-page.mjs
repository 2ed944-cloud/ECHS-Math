import {openOwnedLearningStore,JOURNAL_DATABASE,BUNDLE_LIMITS} from './source/js/owned-learning-store.mjs';
import {openOwnedLearningStore as openOriginal,JOURNAL_DATABASE as ORIGINAL_DATABASE} from '/original/js/owned-learning-store.mjs';
import {createHeldLearningTransport} from './source/js/owned-learning-transport.mjs';
const originalIdentity=v=>Object.fromEntries(['kind','organization_id','account_id','role','status','expires_at','session_id','epoch'].map(k=>[k,v[k]]));
const fresh=()=>({kind:'account',organization_id:'10000000-0000-4000-8000-000000000001',account_id:'20000000-0000-4000-8000-000000000002',incarnation_id:'30000000-0000-4000-8000-000000000003',adoption_epoch:1,role:'student',status:'active',revoked:false,expires_at:Date.now()+3600000,session_id:'synthetic_session_123456789',epoch:1});
let identity=fresh(),now=Date.now(),time=1800000000000,seed=.314159,hook=null;const listeners=new Set(),stores=[];
function authority(prior=false){return {capture(){if(hook)hook();return structuredClone(prior?originalIdentity(identity):identity)},subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn)},async verify(value){return {contract:prior?'echs.owner-authority.v1':'echs.journal-owner-authority.v1',verified:true,identity:structuredClone(value)}}};}
const names=['owners','records','attempts','states','commands','history','bundles'];
async function database(){const r=indexedDB.open(JOURNAL_DATABASE,1);return new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});}
const q=id=>({id,type:'mcq',bank_code:'SYNTHETIC',prompt_text:'Synthetic function',metadata:{difficulty:2},classification:{course_scope:'AP Precalculus',ap_unit:1,ap_topic:'1.1',ap_topic_title:'Functions'}});
const continuationKeys=['type','label','url','targetId','course','scope','mode','questionIds','index','targetCount','correct','graded','answeredIds','sessionId','assignmentId','bankCode'];
const f=window.fixture={DATABASE:JOURNAL_DATABASE,LIMITS:BUNDLE_LIMITS,stores,names,q,authority,now:()=>now,
 async open({prior=false,initialize=true,...extra}={}){const s=await (prior?openOriginal:openOwnedLearningStore)({authority:authority(prior),clock:()=>time,random:()=>seed,now:()=>now,practiceURL:location.origin+'/question-bank/practice.html',...extra});stores.push(s);if(initialize)await s.commit(s.prepare('initialize'));return stores.length-1},
 tick(){time+=1000;seed=(seed+.137)%1},
 change(patch,notify=true){Object.assign(identity,patch);if(notify)for(const fn of [...listeners])fn()},
 hook(fn){hook=fn},notify(){for(const fn of [...listeners])fn()},listeners:()=>listeners.size,
 expire(){now=identity.expires_at+1},identity:()=>structuredClone(identity),
 async compare(method,args){const command=stores[0].prepare(method,args);const a=await stores[0].commit(command),b=await stores[1].commit({...command,owner:stores[1].binding()});
  if(JSON.stringify(stores[0].projection().data)!==JSON.stringify(stores[1].projection().data)||JSON.stringify(a.result)!==JSON.stringify(b.result)||JSON.stringify(a.effects)!==JSON.stringify(b.effects))throw Error('Original transition mismatch');f.tick();return {receipt:a,bundle:await stores[0].sourceBundle(a.operation_id)}},
 flow(action,correct=true){const s=stores[0];if(action==='start'){
  const metadata={type:'practice',mode:'manual',course:'ap-precalculus',scope:'course',targetId:'ap-precalculus',bankCode:'SYNTHETIC',targetCount:2,questionIds:['q1','q2']};
  return {action,session:metadata,continuation:{...metadata,label:'Synthetic practice',url:'/question-bank/practice.html',index:0,correct:0,graded:0,answeredIds:[]}};
 }const saved=s.query('getContinue'),cont=Object.fromEntries(continuationKeys.filter(k=>saved[k]!==undefined).map(k=>[k,structuredClone(saved[k])])),sessionId=saved.sessionId;
  if(action==='discard')return {action,sessionId};
  if(action==='answer'){const id=saved.questionIds[saved.index];cont.answeredIds.push(id);cont.graded++;if(correct)cont.correct++;
   return {action,sessionId,attempt:{question:q(id),correct,response:correct?'B':'C',mode:'manual',sessionId,context:{course:'ap-precalculus',unit:'1',topic:'1.1'}},patch:{questionIds:cont.questionIds,answered:cont.graded,correct:cont.correct,index:cont.index},continuation:cont};
  }if(action==='checkpoint'){cont.index++;return {action,sessionId,patch:{questionIds:cont.questionIds,answered:cont.graded,correct:cont.correct,index:cont.index},continuation:cont}}
  return {action:'finish',sessionId,patch:{questionIds:cont.questionIds,answered:cont.graded,correct:cont.correct,score:cont.graded?100*cont.correct/cont.graded:null}};
 },
 async dump(){const db=await database(),result={};await new Promise((resolve,reject)=>{const tx=db.transaction(names);for(const name of names){const r=tx.objectStore(name).getAll();r.onsuccess=()=>result[name]=r.result}tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error)});db.close();return result},
 async mutate(name,id,fn){const db=await database();await new Promise((resolve,reject)=>{const tx=db.transaction([name],'readwrite'),s=tx.objectStore(name),r=s.get(id);r.onsuccess=()=>s.put(fn(r.result));tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error)});db.close()},
 async seedSessionWindow(){for(const [i,name]of [JOURNAL_DATABASE,ORIGINAL_DATABASE].entries()){
  const open=indexedDB.open(name,1),db=await new Promise((resolve,reject)=>{open.onsuccess=()=>resolve(open.result);open.onerror=()=>reject(open.error)}),owner=stores[i].binding(),key=[owner.organization_id,owner.account_id,...(i===0?[owner.incarnation_id,owner.adoption_epoch]:[])];
  await new Promise((resolve,reject)=>{const tx=db.transaction(['states'],'readwrite'),s=tx.objectStore('states'),r=s.get(key);r.onsuccess=()=>{const value=r.result;value.data.echs_learning_sessions_v2=Array.from({length:1000},(_,j)=>({id:'window-'+j,status:'completed',questionIds:[],answered:0,correct:0}));s.put(value)};tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error)});db.close();await stores[i].refresh();
 }},
 injectWrite(name,fn){const originalAdd=IDBObjectStore.prototype.add,originalPut=IDBObjectStore.prototype.put;let done=false;
  for(const [method,original] of [['add',originalAdd],['put',originalPut]])IDBObjectStore.prototype[method]=function(...args){const r=original.apply(this,args);if(!done&&this.name===name){done=true;IDBObjectStore.prototype.add=originalAdd;IDBObjectStore.prototype.put=originalPut;r.addEventListener('success',()=>fn(this.transaction),{once:true})}return r};
 },
 loseCompletion(){const original=IDBDatabase.prototype.transaction;let done=false;IDBDatabase.prototype.transaction=function(...args){const tx=original.apply(this,args);if(!done&&this.name===JOURNAL_DATABASE&&args[1]==='readwrite'){done=true;IDBDatabase.prototype.transaction=original;Object.defineProperty(tx,'oncomplete',{set(fn){},get(){return null},configurable:true})}return tx}},
 async held(){return createHeldLearningTransport({assertCurrent:()=>stores[0].binding()}).send()},
};
