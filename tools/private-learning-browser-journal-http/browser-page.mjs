// Synthetic owner adapter and actual fetch ports for isolated native-IDB tests.
import {openOwnedLearningStore,JOURNAL_DATABASE} from '/source/js/owned-learning-store.mjs';

const names=Object.freeze(['owners','records','attempts','states','commands','history','bundles','contexts','bindings','lineage','wire']);
let identity=null,sessionToken=null,at=1800000000000,seed=.314159,restoreAbort=null;
const listeners=new Set(),stores=[],observations=[];
const clone=value=>structuredClone(value);
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const authority={capture:()=>clone(identity),verify:async value=>({contract:'echs.journal-owner-authority.v1',verified:true,identity:clone(value)}),subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn)}};

async function actualFetch({route,requestRaw,signal},allowed){
 if(!allowed.includes(route)||typeof requestRaw!=='string'||!(signal instanceof AbortSignal)||!sessionToken)throw new Error('fixture-port');
 const row={route,status:null,aborted:false};observations.push(row);
 const abort=()=>{row.aborted=true};signal.addEventListener('abort',abort,{once:true});
 try{
  const response=await fetch(location.origin+'/functions/v1/learning-journal/'+route,{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+sessionToken},body:requestRaw,credentials:'omit',redirect:'error',cache:'no-store',signal});
  row.status=response.status;return response;
 }finally{signal.removeEventListener('abort',abort);if(signal.aborted)row.aborted=true;}
}

async function dump(){
 const request=indexedDB.open(JOURNAL_DATABASE,1);
 const db=await new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(new Error('fixture-database'))});
 const result={};
 try{
  await new Promise((resolve,reject)=>{
   const tx=db.transaction(names,'readonly');
   for(const name of names){const get=tx.objectStore(name).getAll();get.onsuccess=()=>{result[name]=get.result}}
   tx.oncomplete=resolve;tx.onabort=()=>reject(new Error('fixture-readonly-abort'));tx.onerror=()=>{};
  });
 }finally{db.close()}
 return result;
}

function configure({owner,token,session_tag}){
 if(stores.some(store=>store.state().status!=='disposed'))throw new Error('fixture-live-authority');
 if(!owner||!['organization_id','account_id','incarnation_id'].every(key=>uuid.test(owner[key]))||owner.adoption_epoch!==1||typeof token!=='string'||!/^synthetic-journal-http-[a-f0-9]{32}$/.test(token)||typeof session_tag!=='string'||!/^synthetic_[a-f0-9]{32}$/.test(session_tag))throw new Error('fixture-synthetic-identity');
 const epoch=(identity?.epoch??0)+1;
 identity={kind:'account',organization_id:owner.organization_id,account_id:owner.account_id,incarnation_id:owner.incarnation_id,adoption_epoch:1,role:'student',status:'active',revoked:false,expires_at:Date.now()+3600000,session_id:session_tag,epoch};
 sessionToken=token;
}

function injectAckAbort(){
 if(restoreAbort)throw new Error('fixture-fault-already-armed');
 const original=IDBObjectStore.prototype.put;let armed=false,fired=false,requestSuccess=false,transactionAbort=false;
 const restore=()=>{if(IDBObjectStore.prototype.put===wrapped)IDBObjectStore.prototype.put=original;restoreAbort=null};
 function wrapped(...args){
  const result=original.apply(this,args);
  if(!armed&&this.name==='wire'&&args[0]?.pending_intent?.state==='acknowledged'){
   armed=true;restore();const tx=this.transaction;
   tx.addEventListener('abort',()=>{transactionAbort=true},{once:true});
   result.addEventListener('success',()=>{requestSuccess=true;tx.abort();fired=true},{once:true});
  }
  return result;
 }
 IDBObjectStore.prototype.put=wrapped;restoreAbort=restore;
 return ()=>({native_abort_fired:fired,native_request_success:requestSuccess,native_abort_observed:transactionAbort});
}

const q=id=>({id,type:'mcq',bank_code:'SYNTHETIC',prompt_text:'Synthetic function',metadata:{difficulty:2},classification:{course_scope:'AP Precalculus',ap_unit:1,ap_topic:'1.1',ap_topic_title:'Functions'}});
window.fixture=Object.freeze({
 names,DATABASE:JOURNAL_DATABASE,stores,observations,q,configure,dump,
 tick(){at+=1000;seed=(seed+.137)%1},
 async open({initialize=true}={}){
  if(!identity)throw new Error('fixture-authority-not-configured');
  const store=await openOwnedLearningStore({authority,now:()=>Date.now(),clock:()=>at,random:()=>seed,practiceURL:location.origin+'/question-bank/practice.html',observationPort:{read:value=>actualFetch(value,['state','heads'])},deliveryPort:{deliver:value=>actualFetch(value,['apply'])}});
  stores.push(store);if(initialize)await store.commit(store.prepare('initialize'));return stores.length-1;
 },
 async deliveryWithNativeAbort(index,operation_id){
  const fired=injectAckAbort();let code=null,value=null;
  try{value=await stores[index].deliverNext({operation_id})}catch(error){code=error.code}
  finally{restoreAbort?.()}
  return {code,value,...fired()};
 },
 disposeAll(){for(const store of stores)store.dispose();restoreAbort?.();sessionToken=null;return {disposed:stores.every(store=>store.state().status==='disposed'),authority_listeners:listeners.size}},
});
