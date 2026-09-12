// Private browser fixture. Real canonical/controller/T3 modules; no authority override.
import {createOwnedLearning} from './source/js/owned-learning-bootstrap.mjs';
import {createCurrentSessionJournalBridge} from './source/js/current-session-journal-bridge.mjs';
import {JOURNAL_DATABASE} from './source/js/owned-learning-store.mjs';

const controllers=[],handles=[],bridges=[],callers=[],effects=[],changes=[],channels=[];let openHold=null;
const names=Object.freeze(['owners','records','attempts','states','commands','history','bundles','contexts','bindings','lineage','wire']);
const question=id=>({id,type:'mcq',bank_code:'SYNTHETIC',prompt_text:'Synthetic function',metadata:{difficulty:2},classification:{course_scope:'AP Precalculus',ap_unit:1,ap_topic:'1.1',ap_topic_title:'Functions'}});
const code=error=>typeof error?.code==='string'?error.code:'fixture_operation_failed';
const outcome=promise=>Promise.resolve(promise).then(value=>({ok:true,value}),error=>({ok:false,code:code(error)}));
const fixture={controllers,handles,bridges,callers,effects,changes,question,names,DATABASE:JOURNAL_DATABASE,
 setSession(value){ECHSInstitution.setSession(value,true)},
 clearSession(){ECHSInstitution.clearSession(true)},
 create(){const controller=createOwnedLearning({institution:ECHSInstitution,onEffects:rows=>effects.push(...rows),onChange:row=>changes.push(row),channelFactory:name=>{const channel=new BroadcastChannel(name);channels.push(channel);return channel}});controllers.push(controller);return controllers.length-1},
 async open(index){const controller=controllers[index===undefined?this.create():index];if(!controller)throw Error('fixture_controller');const handle=await controller.ready();handles.push(handle);return handles.length-1},
 async classic(){const handle=await ECHSLearning.ready();handles.push(handle);return handles.length-1},
 async databases(){return (await indexedDB.databases()).filter(row=>row.name===JOURNAL_DATABASE)},
 async dump(){
  if(!(await this.databases()).length)return null;
  const request=indexedDB.open(JOURNAL_DATABASE,1),db=await new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)});
  try{const result={};await new Promise((resolve,reject)=>{const tx=db.transaction(names);for(const name of names){const read=tx.objectStore(name).getAll();read.onsuccess=()=>result[name]=read.result}tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error)});return result}finally{db.close()}
 },
 async prepare(id,index=0){const handle=handles[index];await handle.installRemoteContext();await handle.recordAttempt({question:question(id),correct:true,response:'B'});return {wire:await handle.materializeNext(),before:await this.dump(),projection:handle.snapshot(),effects:effects.length}},
 async wire(id){const data=await this.dump();return data?.wire.find(row=>row.id===id)??null},
 async deliver(id,index=0){return handles[index].deliverNext({operation_id:id})},
 startOpen(index){this.pending=outcome(this.open(index));return true},
 startDeliver(id,index=0){this.pending=outcome(this.deliver(id,index));return true},
 startShared(){this.shared=outcome(ECHSInstitution.me(true));return true},
 async direct(){const bridge=await createCurrentSessionJournalBridge({institution:ECHSInstitution});bridges.push(bridge);return bridges.length-1},
 startDirectBody(index){
  const caller=new AbortController();callers.push(caller);
  this.pending=(async()=>{try{const reply=await bridges[index].observationPort.read({route:'state',requestRaw:'{}',signal:caller.signal});this.directHeaders=true;await reply.text();return {ok:true,caller_aborted:caller.signal.aborted}}catch{return {ok:false,caller_aborted:caller.signal.aborted,headers_received:this.directHeaders===true}}finally{caller.abort()}})();
  return true;
 },
 async holdNextNativeOpen(){
  if(openHold||(await this.databases()).length)throw Error('fixture_fresh_open_required');
  const original=IDBFactory.prototype.open;let active=true,enteredResolve,finishedResolve,timer,request,upgrade,success,error;
  const observation={request_success:false,upgrade_held:false,late_open_success:false,deadline:false};
  const entered=new Promise(resolve=>enteredResolve=resolve),finished=new Promise(resolve=>finishedResolve=resolve);
  function release(){active=false;clearTimeout(timer);if(IDBFactory.prototype.open===wrapped)IDBFactory.prototype.open=original}
  function cleanup(){release();if(request){request.removeEventListener('upgradeneeded',upgrade);request.removeEventListener('success',success);request.removeEventListener('error',error)}finishedResolve({...observation});openHold=null}
  function wrapped(...args){
   const result=Reflect.apply(original,this,args);if(args[0]!==JOURNAL_DATABASE)return result;request=result;IDBFactory.prototype.open=original;
   queueMicrotask(()=>{
    upgrade=()=>{if(!request.result.objectStoreNames.contains('owners'))return cleanup();observation.upgrade_held=true;
     const next=()=>{if(!active)return;let read;try{read=request.transaction.objectStore('owners').get(['synthetic-read-only-probe'])}catch{return cleanup()}
      read.onsuccess=()=>{observation.request_success=true;enteredResolve({...observation});next()};read.onerror=cleanup};next();
    };
    success=()=>{observation.late_open_success=true;cleanup()};error=cleanup;
    request.addEventListener('upgradeneeded',upgrade);request.addEventListener('success',success);request.addEventListener('error',error);
   });return result;
  }
  IDBFactory.prototype.open=wrapped;timer=setTimeout(()=>{observation.deadline=true;release();enteredResolve({...observation})},5000);
  openHold={entered,finished,release};this.openHold=openHold;return true;
 },
 async deleteFreshDatabase(){const request=indexedDB.deleteDatabase(JOURNAL_DATABASE);await new Promise((resolve,reject)=>{request.onsuccess=resolve;request.onerror=()=>reject(request.error);request.onblocked=()=>reject(Error('fixture_connection_leak'))});return true},
 async foreignNotification(index=0){
  const owner=handles[index].binding(),channel=channels[index],sender=new BroadcastChannel('echs-owned-learning-journal-notify-v1');let timer,listener;
  const message={contract:'echs.learning.owned.v1',organization_id:owner.organization_id,account_id:owner.account_id,incarnation_id:crypto.randomUUID(),adoption_epoch:owner.adoption_epoch,revision:handles[index].snapshot().revision+1};
  try{await new Promise((resolve,reject)=>{listener=event=>{if(event.data?.incarnation_id===message.incarnation_id)resolve()};channel.addEventListener('message',listener);timer=setTimeout(()=>reject(Error('fixture_channel_deadline')),3000);sender.postMessage(message)});return true}
  finally{clearTimeout(timer);channel.removeEventListener('message',listener);sender.close()}
 },
 async legacyProbe(accountId){
  const key='echs_institution_pending_sync_v1:'+accountId,raw=JSON.stringify({accountId,payload:{attempts:[{id:'synthetic-held'}],sessions:[],review:[],mastery:[],lessons:[]}});localStorage.setItem(key,raw);
  const native=window.setTimeout;let schedules=0;window.setTimeout=function(fn,ms,...args){if(ms===1200)schedules++;return Reflect.apply(native,window,[fn,ms,...args])};
  let values;try{values=[ECHSInstitution.learningPayload(),await ECHSInstitution.syncLearning(),await ECHSInstitution.flushPending()];
   window.dispatchEvent(new Event('online'));document.dispatchEvent(new CustomEvent('echs:learning-updated'));for(const name of ['echs:learning-attempt','echs:learning-session','echs:lesson-completed'])window.dispatchEvent(new CustomEvent(name));
  }finally{window.setTimeout=native}
  return {values,queue_equal:localStorage.getItem(key)===raw,scheduled:schedules,marker:document.documentElement.dataset.ownedLearning};
 },
 disposeAll(){openHold?.release();for(const controller of controllers)controller.dispose();for(const bridge of bridges)bridge.dispose();for(const caller of callers)caller.abort();ECHSLearning.dispose()},
};
window.fixture=fixture;
