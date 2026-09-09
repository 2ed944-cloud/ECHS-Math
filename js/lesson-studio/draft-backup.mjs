import {assertDraftCheckpoint} from './draft-session.mjs';

export const DRAFT_BACKUP_DATABASE='echs-lesson-draft-backups-v1';
export const DRAFT_BACKUP_STORE='checkpoints';
export const MAX_BACKUP_PLAINTEXT_BYTES=4*1024*1024;
export const MAX_BACKUP_CIPHERTEXT_BYTES=MAX_BACKUP_PLAINTEXT_BYTES+16;
const FORMAT='echs.lesson.backup.v1',UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const encoder=new TextEncoder(),TIMEOUT=5000,MAX_CANDIDATES=32;
const keyFields=['ok','contract','account_id','organization_id','class_id','lesson_id','key_id','key_base64'];
const recordFields=['id','contract','scope','branch_id','sequence','updated_at','deleted','iv','ciphertext'];
const bufferLength=Object.getOwnPropertyDescriptor(ArrayBuffer.prototype,'byteLength').get;
const fail=()=>{throw new Error('Encrypted draft recovery is unavailable.');};
function closed(value,keys){
  if(!value||![Object.prototype,null].includes(Object.getPrototypeOf(value)))fail();
  const descriptors=Object.getOwnPropertyDescriptors(value);
  if(Reflect.ownKeys(descriptors).length!==keys.length||keys.some(name=>!descriptors[name]||!Object.hasOwn(descriptors[name],'value')||!descriptors[name].enumerable))fail();
  return Object.fromEntries(keys.map(name=>[name,descriptors[name].value]));
}
function length(value){try{return bufferLength.call(value);}catch{fail();}}
function validSequence(value){return Number.isSafeInteger(value)&&value>=1&&value<Number.MAX_SAFE_INTEGER;}
function stamp(){return new Date().toISOString();}

/** Fresh server-authorized key only. The factory is async; disposal is synchronous.
 * Keys/plaintext never enter IndexedDB. Ciphertext is retained across disposal.
 * Failed writes return false and never prevent the host's normal server saves.
 * Every tab receives a fresh branch; clear permits later edits in that branch.
 * Only one active and one newest waiting write retain plaintext. Tombstones
 * reject pre-delete writes; a later explicit edit may recreate that branch.
 */
export async function createDraftBackup({key,indexedDB=globalThis.indexedDB,crypto=globalThis.crypto,
  isCurrent,onStatus=()=>{},mathEngine}={}){
  if(!indexedDB?.open||!crypto?.subtle?.importKey||!crypto?.subtle?.encrypt||!crypto?.subtle?.decrypt||
    !crypto?.getRandomValues||!crypto?.randomUUID||typeof isCurrent!=='function'||typeof onStatus!=='function')fail();
  let supplied=closed(key,keyFields);key=null;
  if(supplied.ok!==true||supplied.contract!=='echs.lesson.recovery.v1'||
    ['account_id','organization_id','class_id','lesson_id','key_id'].some(name=>typeof supplied[name]!=='string'||!UUID.test(supplied[name]))||
    typeof supplied.key_base64!=='string'||!/^[A-Za-z0-9+/]{43}=$/.test(supplied.key_base64))fail();
  const scope=[supplied.account_id,supplied.organization_id,supplied.class_id,supplied.lesson_id,supplied.key_id];
  const scopeKey=JSON.stringify(scope),identity=Object.freeze({organization_id:scope[1],class_id:scope[2],lesson_id:scope[3]});
  const branchId=crypto.randomUUID();if(!UUID.test(branchId))fail();
  const recordId=branch=>scopeKey+'/'+branch;
  const epochs=new Map(),requests=new Set(),transactions=new Set(),cryptoCancellations=new Set();
  const tasks=[];
  let db=null,cipherKey=null,disposed=false,running=false,callback=onStatus,observedTombstone=0;
  const epoch=branch=>epochs.get(branch)||0;
  function current(){
    if(disposed)return false;
    try{if(isCurrent()===true)return true;}catch{}
    dispose();return false;
  }
  function emit(status,code,savedAt){
    if(!current())return;
    try{callback({status,...(code?{code}:{}),...(savedAt?{savedAt}:{})});}catch{}
  }
  function alive(branch,generation){return current()&&epoch(branch)===generation;}
  function dispose(){
    if(disposed)return;disposed=true;cipherKey=null;
    for(const request of requests){request.cancelled=true;request.abort?.();request.bytes?.fill(0);request.bytes=null;}
    for(const cancel of cryptoCancellations)cancel();cryptoCancellations.clear();
    requests.clear();for(const task of tasks.splice(0))task.resolve(false);
    for(const entry of transactions){try{entry.tx.abort();}catch{}}
    transactions.clear();try{db?.close();}catch{}db=null;callback=()=>{};
    isCurrent=()=>false;supplied=null;
  }
  function generation(branch){
    const next=epoch(branch)+1;epochs.set(branch,next);
    for(const request of requests)if(request.branch===branch){request.cancelled=true;request.abort?.();request.bytes?.fill(0);request.bytes=null;}
    for(const entry of transactions)if(entry.branch===branch){try{entry.tx.abort();}catch{}}
    return next;
  }
  function foreignChange(tombstoneSequence=0){
    observedTombstone=Math.max(observedTombstone,tombstoneSequence);
    // Every currently queued intent predates this observation. Cancel those
    // intents too, including when the active write failed before reaching CAS.
    generation(branchId);emit('warning','checkpoint_changed');
  }
  function enqueue(work,pending){
    if(pending){
      for(let i=tasks.length-1;i>=0;i--){
        const previous=tasks[i];if(!previous.pending||previous.pending.branch!==pending.branch)continue;
        previous.pending.cancelled=true;previous.pending.bytes?.fill(0);previous.pending.bytes=null;
        requests.delete(previous.pending);tasks.splice(i,1);previous.resolve(false);
      }
    }
    const result=new Promise(resolve=>tasks.push({work,pending,resolve}));
    if(!running)void drain();return result;
  }
  async function drain(){
    running=true;
    try{while(tasks.length){const task=tasks.shift();try{task.resolve(await task.work());}catch{task.resolve(false);}}}
    finally{running=false;}
  }
  async function boundedCrypto(work,pending,cleanAbandoned){
    let cancel,timer,abandoned=false;
    // WebCrypto cannot be aborted. A cancelled decrypt can still materialize
    // plaintext later, so wipe its result even when the caller never receives it.
    const observed=Promise.resolve(work).then(value=>{if(abandoned){cleanAbandoned?.(value);throw new Error('Backup operation ended.');}return value;});
    const ended=new Promise((_,reject)=>{cancel=()=>{abandoned=true;reject(new Error('Backup operation ended.'));};timer=setTimeout(cancel,TIMEOUT);});
    cryptoCancellations.add(cancel);if(pending)pending.abort=cancel;
    try{return await Promise.race([observed,ended]);}
    finally{clearTimeout(timer);cryptoCancellations.delete(cancel);if(pending)pending.abort=null;}
  }
  function aad(branch,sequence,updatedAt){return encoder.encode(JSON.stringify([FORMAT,scope,branch,sequence,updatedAt]));}
  function record(value,branch){
    const data=closed(value,recordFields);
    if(data.id!==recordId(data.branch_id)||data.contract!==FORMAT||data.scope!==scopeKey||
      typeof data.branch_id!=='string'||!UUID.test(data.branch_id)||(branch!==undefined&&data.branch_id!==branch)||
      !validSequence(data.sequence)||typeof data.updated_at!=='string'||!Number.isFinite(Date.parse(data.updated_at))||
      new Date(data.updated_at).toISOString()!==data.updated_at||typeof data.deleted!=='boolean')fail();
    if(data.deleted){if(data.iv!==null||data.ciphertext!==null)fail();}
    else if(length(data.iv)!==12||length(data.ciphertext)<17||length(data.ciphertext)>MAX_BACKUP_CIPHERTEXT_BYTES)fail();
    return data;
  }
  function transaction(mode,branch,generation,work){
    return new Promise((resolve,reject)=>{
      if(!alive(branch,generation)||!db){reject(new Error('Backup closed.'));return;}
      let entry,timer,result;
      try{
        const tx=db.transaction(DRAFT_BACKUP_STORE,mode);entry={tx,branch};transactions.add(entry);
        timer=setTimeout(()=>{try{tx.abort();}catch{}},TIMEOUT);
        const finish=()=>{clearTimeout(timer);transactions.delete(entry);};
        tx.oncomplete=()=>{finish();if(alive(branch,generation))resolve(result);else reject(new Error('Backup changed.'));};
        tx.onerror=()=>{};tx.onabort=()=>{finish();reject(new Error('Backup storage failed.'));};
        work(tx.objectStore(DRAFT_BACKUP_STORE),value=>{result=value;},()=>alive(branch,generation));
      }catch(error){clearTimeout(timer);if(entry){transactions.delete(entry);try{entry.tx.abort();}catch{}}reject(error);}
    });
  }
  function read(branch,generation){
    return transaction('readonly',branch,generation,(store,done)=>{
      const request=store.get(recordId(branch));request.onsuccess=()=>done(request.result);
    });
  }
  try{
    if(!current())fail();
    let raw=new Uint8Array(atob(supplied.key_base64).split('').map(value=>value.charCodeAt(0)));
    if(raw.byteLength!==32||btoa(String.fromCharCode(...raw))!==supplied.key_base64){raw.fill(0);fail();}
    supplied=null;
    try{cipherKey=await boundedCrypto(crypto.subtle.importKey('raw',raw,{name:'AES-GCM'},false,['encrypt','decrypt']));}
    finally{raw.fill(0);raw=null;}
    if(!current())fail();
    db=await new Promise((resolve,reject)=>{
      const request=indexedDB.open(DRAFT_BACKUP_DATABASE,1);let ended=false;
      const timer=setTimeout(()=>{ended=true;reject(new Error('Backup storage unavailable.'));},TIMEOUT);
      const failed=()=>{if(ended)return;ended=true;clearTimeout(timer);reject(new Error('Backup storage unavailable.'));};
      request.onerror=failed;request.onblocked=failed;
      request.onupgradeneeded=()=>{
        if(ended||!current()){try{request.transaction.abort();}catch{}return;}
        const store=request.result.createObjectStore(DRAFT_BACKUP_STORE,{keyPath:'id'});store.createIndex('scope','scope',{unique:false});
      };
      request.onsuccess=()=>{if(ended||!current()){request.result.close();failed();return;}ended=true;clearTimeout(timer);resolve(request.result);};
    });
    if(!current())fail();
    db.onversionchange=()=>{emit('error','storage_changed');dispose();};
  }catch{dispose();fail();}

  function write(checkpoint){
    if(!current())return Promise.resolve(false);
    const captured=epoch(branchId);let bytes;
    try{
      let validated=assertDraftCheckpoint(checkpoint,{identity,mathEngine});checkpoint=null;
      bytes=encoder.encode(JSON.stringify(validated));validated=null;
      if(bytes.length>MAX_BACKUP_PLAINTEXT_BYTES){bytes.fill(0);fail();}
    }catch{emit('error','invalid_checkpoint');return Promise.resolve(false);}
    const pending={branch:branchId,generation:captured,bytes,cancelled:false};requests.add(pending);bytes=null;
    emit('saving');
    return enqueue(async()=>{
      let encrypted;
      try{
        if(pending.cancelled||!alive(branchId,captured))return false;
        const previous=await read(branchId,captured);if(pending.cancelled||!alive(branchId,captured))return false;
        const prior=previous===undefined?null:record(previous,branchId);
        if(prior?.deleted&&prior.sequence>observedTombstone){foreignChange(prior.sequence);return false;}
        const previousSequence=prior?.sequence||0;
        const sequence=previousSequence+1;if(!validSequence(sequence))fail();
        const updatedAt=stamp(),iv=crypto.getRandomValues(new Uint8Array(12));
        encrypted=await boundedCrypto(crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad(branchId,sequence,updatedAt),tagLength:128},cipherKey,pending.bytes),pending);
        pending.bytes?.fill(0);pending.bytes=null;
        if(pending.cancelled||!alive(branchId,captured))return false;
        if(length(encrypted)>MAX_BACKUP_CIPHERTEXT_BYTES)fail();
        const next={id:recordId(branchId),contract:FORMAT,scope:scopeKey,branch_id:branchId,sequence,updated_at:updatedAt,
          deleted:false,iv:iv.buffer,ciphertext:encrypted};
        let foreignTombstone=0;
        const committed=await transaction('readwrite',branchId,captured,(store,done,active)=>{
          const request=store.get(next.id);request.onsuccess=()=>{
            try{
              const latest=request.result===undefined?null:record(request.result,branchId),actual=latest?.sequence||0;
              if(!active()||actual!==previousSequence){if(latest?.deleted)foreignTombstone=latest.sequence;done(false);return;}
              store.put(next);done(true);
            }catch{done(false);}
          };
        });
        if(!committed&&alive(branchId,captured)){foreignChange(foreignTombstone);return false;}
        const newer=[...requests].some(request=>request!==pending&&!request.cancelled);
        if(!newer){if(committed)emit('saved',undefined,updatedAt);else if(alive(branchId,captured))emit('warning','checkpoint_changed');}
        return committed===true;
      }catch{if(!pending.cancelled&&alive(branchId,captured)&&![...requests].some(request=>request!==pending&&!request.cancelled))emit('error','storage_unavailable');return false;}
      finally{pending.bytes?.fill(0);pending.bytes=null;requests.delete(pending);encrypted=null;}
    },pending);
  }
  async function list(){
    if(!current())return [];
    const captured=epoch(branchId);
    try{
      const rows=await transaction('readonly',branchId,captured,(store,done)=>{
        const result=[];const request=store.index('scope').openCursor(scopeKey);
        request.onsuccess=()=>{const cursor=request.result;if(!cursor){done(result);return;}
          // Tombstones may outlive many reloads. They must not crowd recoverable
          // branches out of the bounded candidate list; the transaction is timed.
          if(cursor.value?.deleted!==true)result.push(cursor.value);
          if(result.length>MAX_CANDIDATES){done(result);return;}cursor.continue();};
      });
      if(!alive(branchId,captured))return [];
      const candidates=[];let warning=rows.length>MAX_CANDIDATES;
      for(const value of rows.slice(0,MAX_CANDIDATES)){
        let plain=null;
        try{
          const data=record(value);if(data.deleted)continue;
          plain=await boundedCrypto(crypto.subtle.decrypt({name:'AES-GCM',iv:data.iv,additionalData:aad(data.branch_id,data.sequence,data.updated_at),tagLength:128},cipherKey,data.ciphertext),undefined,value=>new Uint8Array(value).fill(0));
          if(!alive(branchId,captured))return [];
          if(length(plain)>MAX_BACKUP_PLAINTEXT_BYTES)fail();
          const text=new TextDecoder('utf-8',{fatal:true}).decode(plain);
          const checkpoint=assertDraftCheckpoint(JSON.parse(text),{identity,mathEngine});
          const latest=await read(data.branch_id,epoch(data.branch_id));
          if(!alive(branchId,captured))return [];
          const stillStored=latest&&record(latest,data.branch_id);
          if(!stillStored||stillStored.deleted||stillStored.sequence!==data.sequence)continue;
          candidates.push({branch_id:data.branch_id,updated_at:data.updated_at,checkpoint});
        }catch{if(!current())return [];warning=true;}
        finally{if(plain)new Uint8Array(plain).fill(0);}
      }
      if(warning)emit('warning','invalid_or_excess_backup');
      return candidates.sort((a,b)=>b.updated_at.localeCompare(a.updated_at)||a.branch_id.localeCompare(b.branch_id));
    }catch{if(current())emit('error','storage_unavailable');return [];}
  }
  function remove(branch){
    if(!current())return Promise.resolve(false);
    if(typeof branch!=='string'||!UUID.test(branch)){emit('error','invalid_branch');return Promise.resolve(false);}
    const captured=generation(branch);
    return enqueue(async()=>{
      try{
        if(!alive(branch,captured))return false;
        let tombstoneSequence=0;
        const removed=await transaction('readwrite',branch,captured,(store,done,active)=>{
          const request=store.get(recordId(branch));request.onsuccess=()=>{
            try{
              const previous=request.result;
              const prior=previous===undefined?0:record(previous,branch).sequence,sequence=prior+1;
              if(!active()||!validSequence(sequence)){done(false);return;}
              store.put({id:recordId(branch),contract:FORMAT,scope:scopeKey,branch_id:branch,sequence,updated_at:stamp(),deleted:true,iv:null,ciphertext:null});tombstoneSequence=sequence;done(true);
            }catch{done(false);}
          };
        });
        if(removed&&branch===branchId)observedTombstone=Math.max(observedTombstone,tombstoneSequence);
        if(!removed)emit('error','storage_unavailable');else if(branch===branchId&&![...requests].some(request=>!request.cancelled))emit('ready');return removed===true;
      }catch{if(alive(branch,captured))emit('error','storage_unavailable');return false;}
    });
  }
  emit('ready');
  return Object.freeze({branch_id:branchId,write,list,remove,clear:()=>remove(branchId),dispose});
}
