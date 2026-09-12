// Isolated T1 successor: original transitions plus same-transaction source bundles.
import {createLearningTransition,MUTATIONS,QUERIES,DOMAIN_KEYS} from '../question-bank/js/learning-transition.mjs';
import {validatePracticeFlow,runPracticeFlow,PracticeFlowError} from '../question-bank/js/practice-flow.mjs';
export const JOURNAL_DATABASE = 'echs-owned-learning-source-bundles-candidate-v1';
export const JOURNAL_CONTRACT = 'echs.learning.sync-journal.v1';
export const SOURCE_CONTRACT = 'echs.learning.owned-source.v1';
export const JOURNAL_LIMITS = Object.freeze({rowBytes:65536,batchBytes:4194304,batchRows:1000,
  snapshotRows:500,snapshotBytes:4194304,pendingRows:20000,pendingBytes:33554432,
  attemptIds:50000,receipts:8,depth:24,nodes:100000,timeoutMs:5000});
const KINDS = ['attempts','sessions','review','lessons','mastery'];
const IDS = {attempts:['event_id','client_event_id','id'],sessions:['client_session_id','clientSessionId','id'],
  review:['question_id','questionId','id'],lessons:['access_key'],mastery:['skill_key','key']};
const STORES = ['owners','records','attempts','states','commands','history','bundles'];
export const BUNDLE_CONTRACT='echs.learning.source-bundle.v1';
export const BUNDLE_LIMITS=Object.freeze({rowBytes:4194304,totalBytes:33554432,count:50000,read:100,readBytes:4194304,removals:1000});
const STATE_LIMIT=16777216,COMMAND_LIMIT=33554432,HISTORY_LIMIT=67108864;
export const ENGINE_CONTRACT='echs.learning.owned.v1';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const HASH=/^[0-9a-f]{64}$/;
const encoder=new TextEncoder();
const forbidden=new Set(['__proto__','prototype','constructor','token','access_token','refresh_token','authorization','serviceKey','service_key','password']);
export class SyncJournalError extends Error {constructor(code){super(`Learning sync journal unavailable: ${code}`);this.name='SyncJournalError';this.code=code;}}
const fail=code=>{throw new SyncJournalError(code)};
function plain(value){return value&&typeof value==='object'&&!Array.isArray(value)&&[Object.prototype,null].includes(Object.getPrototypeOf(value));}
function closed(value,keys){if(!plain(value)||Object.keys(value).length!==keys.length||keys.some(k=>!Object.hasOwn(value,k)))fail('invalid_input');}
function clone(value,limit=JOURNAL_LIMITS.batchBytes,nodeLimit=JOURNAL_LIMITS.nodes,preserveUndefined=false){
  let bytes=0,nodes=0;const active=new Set();
  const charge=n=>{if((bytes+=n)>limit)fail('data_bounds')};
  function visit(v,depth){
    if(++nodes>nodeLimit||depth>JOURNAL_LIMITS.depth)fail('data_bounds');
    // Original read models contain optional undefined properties. Preserve them
    // only for defensive query output; commands and stored JSON remain strict.
    if(v===undefined&&preserveUndefined){charge(9);return v}
    if(v===null||typeof v==='boolean'){charge(String(v).length);return v}
    if(typeof v==='string'){if(v.length>limit)fail('data_bounds');charge(encoder.encode(JSON.stringify(v)).length);return v}
    if(typeof v==='number'){if(!Number.isFinite(v))fail('invalid_data');charge(JSON.stringify(v).length);return v}
    const array=Array.isArray(v);if(!v||typeof v!=='object'||active.has(v)||(!array&&!plain(v))||(array&&Object.getPrototypeOf(v)!==Array.prototype))fail('invalid_data');
    const keys=Reflect.ownKeys(v),descriptors=Object.getOwnPropertyDescriptors(v);
    if(keys.length>JOURNAL_LIMITS.nodes||keys.some(k=>typeof k!=='string'||forbidden.has(k)))fail('invalid_data');
    if(array&&(keys.length!==v.length+1||v.length>JOURNAL_LIMITS.nodes))fail('invalid_data');
    active.add(v);charge(2);let count=0;const out=array?[]:{};
    for(const k of (array?keys:keys.sort())){
      if(array&&k==='length')continue;const d=descriptors[k];
      if(!Object.hasOwn(d,'value')||!d.enumerable||(array&&(!/^(0|[1-9][0-9]*)$/.test(k)||Number(k)>=v.length)))fail('invalid_data');
      if(count++)charge(1);if(!array)charge(encoder.encode(JSON.stringify(k)).length+1);out[k]=visit(d.value,depth+1);
    }
    active.delete(v);return out;
  }
  try{return visit(value,0)}catch(e){if(e instanceof SyncJournalError)throw e;fail('invalid_data')}
}
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value)}return value};
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function identity(value,now){
  const out=clone(value,4096);closed(out,['kind','organization_id','account_id','incarnation_id','adoption_epoch','role','status','revoked','expires_at','session_id','epoch']);
  if(out.kind!=='account'||!UUID.test(out.organization_id)||!UUID.test(out.account_id)||!UUID.test(out.incarnation_id)||out.adoption_epoch!==1||out.revoked!==false||out.role!=='student'||out.status!=='active'||
    !Number.isSafeInteger(out.expires_at)||out.expires_at<=now()||typeof out.session_id!=='string'||! /^[A-Za-z0-9_-]{16,128}$/.test(out.session_id)||
    !Number.isSafeInteger(out.epoch)||out.epoch<0)fail('invalid_owner');
  return out;
}
function rowId(kind,row){
  if(!plain(row))fail('invalid_record');const value=IDS[kind].map(k=>row[k]).find(v=>v!==undefined&&v!==null);
  if(!((typeof value==='string'&&value.length>0&&value.length<=256)||(Number.isSafeInteger(value)&&value>=0)))fail('missing_record_id');
  return String(value);
}
function payloadRows(value,owner,now){
  const input=clone(value);closed(input,['contract','owner','payload']);
  if(input.contract!==SOURCE_CONTRACT||!equal(identity(input.owner,now),owner))fail('source_owner_mismatch');
  closed(input.payload,KINDS);const rows=[],seen=new Set();
  for(const kind of KINDS){
    if(!Array.isArray(input.payload[kind]))fail('invalid_payload');
    for(const row of input.payload[kind]){
      const id=rowId(kind,row),key=JSON.stringify([kind,id]);if(seen.has(key))fail('duplicate_record_id');seen.add(key);
      const text=JSON.stringify(row),bytes=encoder.encode(text).length;if(bytes>JOURNAL_LIMITS.rowBytes)fail('data_bounds');
      rows.push({kind,id,row,text,bytes});if(rows.length>JOURNAL_LIMITS.batchRows)fail('data_bounds');
    }
  }
  return rows;
}

export async function openOwnedLearningStore({authority,indexedDB=globalThis.indexedDB,crypto=globalThis.crypto,
  IDBKeyRange=globalThis.IDBKeyRange,now=()=>Date.now(),clock=now,random=Math.random,search='',externalSignal=null,onInvalidate=()=>{},
  practiceURL=new URL('../question-bank/practice.html',import.meta.url).href}={}){
  if(typeof authority?.capture!=='function'||typeof authority?.verify!=='function'||typeof authority?.subscribe!=='function'||
    typeof indexedDB?.open!=='function'||typeof crypto?.subtle?.digest!=='function'||typeof IDBKeyRange?.only!=='function'||typeof IDBKeyRange?.bound!=='function'||
    typeof now!=='function'||typeof clock!=='function'||typeof random!=='function'||typeof crypto?.randomUUID!=='function'||typeof search!=='string'||search.length>4096||typeof onInvalidate!=='function')fail('unavailable');
  if(externalSignal&&externalSignal.aborted)fail('disposed');
  let owner=identity(authority.capture(),now),db=null,unsubscribe=null,reason=null,callback=onInvalidate;
  let view=null;let receipts=new Map();const controller=new AbortController(),transactions=new Set();
  const scope=[owner.organization_id,owner.account_id,owner.incarnation_id,owner.adoption_epoch];
  const binding={organization_id:scope[0],account_id:scope[1],incarnation_id:scope[2],adoption_epoch:scope[3]};
  let expiryTimer;
  function armExpiry(){if(reason)return;const left=owner.expires_at-now();if(left<=0){dispose('owner_changed');return}expiryTimer=setTimeout(()=>{try{current();armExpiry()}catch{}},Math.min(left,60000))}
  function dispose(code='disposed'){
    if(reason)return;reason=code;clearTimeout(expiryTimer);owner=null;view=null;receipts.clear();
    try{unsubscribe?.()}catch{}unsubscribe=null;externalSignal?.removeEventListener('abort',externalAbort);
    controller.abort(new SyncJournalError(code));for(const tx of transactions){try{tx.abort()}catch{}}
    try{db?.close()}catch{}db=null;const fn=callback;callback=()=>{};try{fn({code})}catch{}
  }
  const externalAbort=()=>dispose('disposed');externalSignal?.addEventListener('abort',externalAbort,{once:true});
  function current(){
    if(reason)fail(reason);
    let found;try{found=identity(authority.capture(),now)}catch{dispose('owner_changed');fail('owner_changed')}
    if(reason)fail(reason);if(!equal(found,owner)){dispose('owner_changed');fail('owner_changed')}
    return owner;
  }
  async function bounded(promise){
    // The operation has already started. A synchronous authority notification
    // can invalidate this handle before current(), so observe its rejection
    // even when that guard exits before Promise.race is installed.
    const observed=Promise.resolve(promise);observed.catch(()=>{});
    current();let timer,abort;const ended=new Promise((_,reject)=>{
      abort=()=>reject(new SyncJournalError(reason||'owner_changed'));controller.signal.addEventListener('abort',abort,{once:true});
      timer=setTimeout(()=>reject(new SyncJournalError('timeout')),JOURNAL_LIMITS.timeoutMs);
    });
    try{const result=await Promise.race([observed,ended]);current();return result}
    finally{clearTimeout(timer);controller.signal.removeEventListener('abort',abort)}
  }
  function meta(value){
    if(value===undefined)return{contract:JOURNAL_CONTRACT,...binding,revision:0,count:0,bytes:0,attempt_ids:0,bundle_count:0,bundle_bytes:0,reset_barrier_id:null};
    const v=clone(value,4096);closed(v,['contract','organization_id','account_id','incarnation_id','adoption_epoch','revision','count','bytes','attempt_ids','bundle_count','bundle_bytes','reset_barrier_id']);
    if(v.contract!==JOURNAL_CONTRACT||v.organization_id!==scope[0]||v.account_id!==scope[1]||v.incarnation_id!==scope[2]||v.adoption_epoch!==scope[3]||
      !Number.isSafeInteger(v.revision)||v.revision<0||v.revision>=Number.MAX_SAFE_INTEGER||
      !Number.isSafeInteger(v.count)||v.count<0||v.count>JOURNAL_LIMITS.pendingRows||!Number.isSafeInteger(v.bytes)||v.bytes<0||v.bytes>JOURNAL_LIMITS.pendingBytes||
      !Number.isSafeInteger(v.attempt_ids)||v.attempt_ids<0||v.attempt_ids>JOURNAL_LIMITS.attemptIds||
      !Number.isSafeInteger(v.bundle_count)||v.bundle_count<0||v.bundle_count>BUNDLE_LIMITS.count||!Number.isSafeInteger(v.bundle_bytes)||v.bundle_bytes<0||v.bundle_bytes>BUNDLE_LIMITS.totalBytes||
      !(v.reset_barrier_id===null||typeof v.reset_barrier_id==='string'&&UUID.test(v.reset_barrier_id)))fail('invalid_store');return v;
  }
  function record(value,kind,id){
    if(value===undefined)return null;const v=clone(value,JOURNAL_LIMITS.rowBytes+2048);
    closed(v,['contract','source_contract','organization_id','account_id','incarnation_id','adoption_epoch','kind','id','revision','bytes','row']);
    if(v.contract!==JOURNAL_CONTRACT||v.source_contract!==SOURCE_CONTRACT||v.organization_id!==scope[0]||v.account_id!==scope[1]||v.incarnation_id!==scope[2]||v.adoption_epoch!==scope[3]||
      !KINDS.includes(v.kind)||(kind!==undefined&&v.kind!==kind)||(id!==undefined&&v.id!==id)||rowId(v.kind,v.row)!==v.id||
      !Number.isSafeInteger(v.revision)||v.revision<1||!Number.isSafeInteger(v.bytes)||v.bytes<2||v.bytes>JOURNAL_LIMITS.rowBytes||
      encoder.encode(JSON.stringify(v.row)).length!==v.bytes)fail('invalid_store');return v;
  }
  function stamp(value,id){
    if(value===undefined)return null;const v=clone(value,4096);closed(v,['contract','organization_id','account_id','incarnation_id','adoption_epoch','id','sha256']);
    if(v.contract!==JOURNAL_CONTRACT||v.organization_id!==scope[0]||v.account_id!==scope[1]||v.incarnation_id!==scope[2]||v.adoption_epoch!==scope[3]||v.id!==id||!HASH.test(v.sha256))fail('invalid_store');return v;
  }
  function transact(mode,work){
    current();return new Promise((resolve,reject)=>{
      let tx,result,error,settled=false,timer;
      const end=(ok,value)=>{if(settled)return;settled=true;clearTimeout(timer);transactions.delete(tx);result=null;ok?resolve(value):reject(value)};
      const stop=e=>{error=e instanceof SyncJournalError?e:new SyncJournalError('storage_error');try{tx.abort()}catch{end(false,error)}};
      const guard=fn=>(...args)=>{try{current();fn(...args)}catch(e){stop(e)}};
      try{
        tx=db.transaction(STORES,mode,{durability:'strict'});transactions.add(tx);
        timer=setTimeout(()=>stop(new SyncJournalError('timeout')),JOURNAL_LIMITS.timeoutMs);
        tx.oncomplete=()=>{try{current();end(true,result)}catch(e){end(false,e)}};
        tx.onabort=()=>end(false,error||new SyncJournalError(reason||'storage_error'));
        tx.onerror=()=>{}; // Default request errors abort the entire transaction.
        if(tx.durability!=='strict')fail('durability_unavailable');
        const stores=Object.fromEntries(STORES.map(name=>[name,tx.objectStore(name)]));
        work(stores,guard,value=>{result=value});
      }catch(e){if(tx)stop(e);else end(false,e instanceof SyncJournalError?e:new SyncJournalError('storage_error'))}
    });
  }
  try{
    unsubscribe=authority.subscribe(()=>{try{current()}catch{}});
    if(typeof unsubscribe!=='function')fail('unavailable');if(reason){unsubscribe();unsubscribe=null}current();armExpiry();
    const verified=clone(await bounded(Promise.resolve(authority.verify(freeze(clone(owner))))),8192);
    closed(verified,['contract','verified','identity']);
    if(verified.contract!=='echs.journal-owner-authority.v1'||verified.verified!==true||!equal(identity(verified.identity,now),owner))fail('verification_failed');
    await bounded(new Promise((resolve,reject)=>{
      let ended=false;const request=indexedDB.open(JOURNAL_DATABASE,1);
      request.onupgradeneeded=event=>{
        try{current();if(event.oldVersion!==0)fail('invalid_store');const d=request.result;
          d.createObjectStore('owners',{keyPath:['organization_id','account_id','incarnation_id','adoption_epoch']});
          const records=d.createObjectStore('records',{keyPath:['organization_id','account_id','incarnation_id','adoption_epoch','kind','id']});records.createIndex('owner',['organization_id','account_id','incarnation_id','adoption_epoch']);
          d.createObjectStore('attempts',{keyPath:['organization_id','account_id','incarnation_id','adoption_epoch','id']});
          d.createObjectStore('states',{keyPath:['organization_id','account_id','incarnation_id','adoption_epoch']});
          d.createObjectStore('commands',{keyPath:['organization_id','account_id','incarnation_id','adoption_epoch','id']});
          d.createObjectStore('history',{keyPath:['organization_id','account_id','incarnation_id','adoption_epoch','id']});
          const bundles=d.createObjectStore('bundles',{keyPath:['organization_id','account_id','incarnation_id','adoption_epoch','id']});
          bundles.createIndex('ownerRevision',['organization_id','account_id','incarnation_id','adoption_epoch','revision'],{unique:true});
        }catch(e){request.transaction.abort();reject(e)}
      };
      request.onblocked=()=>{ended=true;reject(new SyncJournalError('storage_blocked'))};
      request.onerror=()=>reject(new SyncJournalError('storage_error'));
      request.onsuccess=()=>{
        const value=request.result;
        if(ended||reason){value.close();reject(new SyncJournalError(reason||'storage_blocked'));return}
        try{current();if(value.version!==1||!equal([...value.objectStoreNames].sort(),[...STORES].sort()))fail('invalid_store');
          const tx=value.transaction(STORES,'readonly');
          for(const [name,path]of [['owners',['organization_id','account_id','incarnation_id','adoption_epoch']],['records',['organization_id','account_id','incarnation_id','adoption_epoch','kind','id']],['attempts',['organization_id','account_id','incarnation_id','adoption_epoch','id']],['states',['organization_id','account_id','incarnation_id','adoption_epoch']],['commands',['organization_id','account_id','incarnation_id','adoption_epoch','id']],['history',['organization_id','account_id','incarnation_id','adoption_epoch','id']],['bundles',['organization_id','account_id','incarnation_id','adoption_epoch','id']]]){
            const s=tx.objectStore(name);if(!equal(s.keyPath,path)||s.autoIncrement||s.indexNames.length!==(name==='records'||name==='bundles'?1:0))fail('invalid_store');
          }
          const idx=tx.objectStore('records').index('owner');if(!equal(idx.keyPath,['organization_id','account_id','incarnation_id','adoption_epoch'])||idx.unique||idx.multiEntry)fail('invalid_store');
          const bi=tx.objectStore('bundles').index('ownerRevision');if(!equal(bi.keyPath,['organization_id','account_id','incarnation_id','adoption_epoch','revision'])||!bi.unique||bi.multiEntry)fail('invalid_store');
          current();db=value;db.onversionchange=()=>dispose('version_changed');db.onclose=()=>dispose('storage_closed');resolve();
        }catch(e){value.close();reject(e)}
      };
    }));
  }catch(e){dispose(e.code||'unavailable');throw e instanceof SyncJournalError?e:new SyncJournalError('unavailable')}

  function writeRows(s,guard,rows,set){
        const get=s.owners.get(scope);get.onsuccess=guard(()=>{
          const m=meta(get.result);let index=0,changed=0,unchanged=0;const assigned=[];
          const next=()=>{
            if(index===rows.length){set({changed,unchanged,pending:m.count,meta:m,assigned});return}
            const item=rows[index++],key=[...scope,item.kind,item.id],read=s.records.get(key);
            read.onsuccess=guard(()=>{
              const old=record(read.result,item.kind,item.id);
              if(old&&(old.revision>m.revision||m.count<1||m.bytes<old.bytes))fail('invalid_store');
              const put=()=>{
                if(old&&equal(old.row,item.row)){unchanged++;next();return}
                if(m.revision>=Number.MAX_SAFE_INTEGER-1)fail('journal_full');
                m.revision++;m.count+=old?0:1;m.bytes+=item.bytes-(old?.bytes||0);
                if(m.count>JOURNAL_LIMITS.pendingRows||m.bytes>JOURNAL_LIMITS.pendingBytes)fail('journal_full');
                s.records.put({contract:JOURNAL_CONTRACT,source_contract:SOURCE_CONTRACT,...binding,kind:item.kind,id:item.id,revision:m.revision,bytes:item.bytes,row:item.row});
                assigned.push({kind:item.kind,record_id:item.id,local_revision:m.revision,value_json:item.text});changed++;next();
              };
              if(item.kind!=='attempts'){put();return}
              const remembered=s.attempts.get([...scope,item.id]);remembered.onsuccess=guard(()=>{
                const prior=stamp(remembered.result,item.id);
                if(prior&&prior.sha256!==item.sha256)fail('immutable_attempt_conflict');
                if(prior&&!old){unchanged++;next();return} // Already acknowledged exact attempt.
                if(!prior){if(old)fail('invalid_store');if(++m.attempt_ids>JOURNAL_LIMITS.attemptIds)fail('journal_full');
                  s.attempts.add({contract:JOURNAL_CONTRACT,...binding,id:item.id,sha256:item.sha256});}
                put();
              });
            });
          };next();
        });
  }
  async function snapshot(options={}){
    current();const o=clone(options,4096);if(!plain(o)||Object.keys(o).some(k=>k!=='limit'))fail('invalid_input');
    const limit=o.limit??JOURNAL_LIMITS.snapshotRows;if(!Number.isInteger(limit)||limit<1||limit>JOURNAL_LIMITS.snapshotRows)fail('invalid_input');
    if(receipts.size>=JOURNAL_LIMITS.receipts)fail('receipt_limit');
    const selected=await transact('readonly',(s,guard,set)=>{
      const get=s.owners.get(scope);get.onsuccess=guard(()=>{
        const m=meta(get.result),rows=[];let bytes=0;const cursor=s.records.index('owner').openCursor(IDBKeyRange.only(scope));
        cursor.onsuccess=guard(()=>{
          const entry=cursor.result;if(!entry){set(rows);return}
          const row=record(entry.value);if(row.revision>m.revision||m.count<1||m.bytes<row.bytes)fail('invalid_store');
          if(rows.length===limit||bytes+row.bytes>JOURNAL_LIMITS.snapshotBytes){set(rows);return}
          rows.push(row);bytes+=row.bytes;cursor.result.continue();
        });
      });
    });
    current();if(receipts.size>=JOURNAL_LIMITS.receipts)fail('receipt_limit');
    const payload=Object.fromEntries(KINDS.map(k=>[k,selected.filter(r=>r.kind===k).map(r=>r.row)]));
    const result=freeze({contract:JOURNAL_CONTRACT,source_contract:SOURCE_CONTRACT,owner:clone(owner),payload,count:selected.length});
    receipts.set(result,selected.map(({kind,id,revision,bytes})=>({kind,id,revision,bytes})));return result;
  }

  function engine(value){
    if(value===undefined)return{contract:ENGINE_CONTRACT,...binding,revision:0,data:{},command_count:0,command_bytes:0,history_count:0,history_bytes:0};
    const v=clone(value,STATE_LIMIT,2000000);
    closed(v,['contract','organization_id','account_id','incarnation_id','adoption_epoch','revision','data','command_count','command_bytes','history_count','history_bytes']);
    if(v.contract!==ENGINE_CONTRACT||v.organization_id!==scope[0]||v.account_id!==scope[1]||v.incarnation_id!==scope[2]||v.adoption_epoch!==scope[3]||!plain(v.data)||Object.keys(v.data).some(k=>!DOMAIN_KEYS.includes(k))||
      !Number.isSafeInteger(v.revision)||v.revision<0||v.revision>=Number.MAX_SAFE_INTEGER||
      !Number.isSafeInteger(v.command_count)||v.command_count<0||v.command_count>50000||!Number.isSafeInteger(v.command_bytes)||v.command_bytes<0||v.command_bytes>COMMAND_LIMIT||
      !Number.isSafeInteger(v.history_count)||v.history_count<0||v.history_count>50000||!Number.isSafeInteger(v.history_bytes)||v.history_bytes<0||v.history_bytes>HISTORY_LIMIT)fail('invalid_store');
    const arrays=['echs_learning_events_v2','echs_learning_sessions_v2','echs_learning_classes_v2','echs_learning_assignments_v2','echs_learning_submissions_v2','echs_learning_lesson_events_v2','echs_math_complete','echs_math_bookmarks'];
    for(const[key,data]of Object.entries(v.data)){
      if(key==='echs_learning_continue_v2'){if(data!==null&&!plain(data))fail('invalid_store')}
      else if(arrays.includes(key)){if(!Array.isArray(data))fail('invalid_store')}
      else if(!plain(data))fail('invalid_store');
    }
    return v;
  }
  function commandRecord(value){
    if(value===undefined)return null;const v=clone(value,JOURNAL_LIMITS.batchBytes);
    closed(v,['contract','organization_id','account_id','incarnation_id','adoption_epoch','id','sha256','receipt']);
    if(v.contract!==ENGINE_CONTRACT||v.organization_id!==scope[0]||v.account_id!==scope[1]||v.incarnation_id!==scope[2]||v.adoption_epoch!==scope[3]||!UUID.test(v.id)||!HASH.test(v.sha256))fail('invalid_store');
    const r=v.receipt;closed(r,['contract','operation_id','revision','durability','duplicate','result','effects']);
    if(r.contract!==ENGINE_CONTRACT||r.operation_id!==v.id||r.durability!=='committed'||r.duplicate!==false||!Number.isSafeInteger(r.revision)||r.revision<1||!Array.isArray(r.effects))fail('invalid_store');
    return v;
  }
  function namedObject(value,keys){if(!plain(value)||Object.keys(value).some(k=>!keys.includes(k)))fail('invalid_command')}
  function validateArgs(method,args){
    if(method==='practice'){if(!Array.isArray(args)||args.length!==1)fail('invalid_command');validatePracticeFlow(args[0],{practiceURL});return}
    if(!MUTATIONS.includes(method)||!Array.isArray(args))fail('invalid_command');
    const noArgs=['initialize','clearContinue','evaluateAchievements'];
    if(noArgs.includes(method)){if(args.length)fail('invalid_command');return}
    if(method==='recordAttempt'){
      if(args.length!==1)fail('invalid_command');const p=args[0];
      namedObject(p,['question','correct','response','mode','sessionId','durationMs','context']);
      if(!plain(p.question)||!((typeof p.question.id==='string'&&p.question.id.length>0&&p.question.id.length<=256)||(Number.isSafeInteger(p.question.id)&&p.question.id>=0))||typeof p.correct!=='boolean')fail('invalid_command');
      if(p.context!==undefined)namedObject(p.context,['course','unit','topic','assignmentId']);return;
    }
    if(method==='markReviewResolved'){if(args.length<1||args.length>2||typeof args[0]!=='string'||!args[0]||(args.length===2&&typeof args[1]!=='boolean'))fail('invalid_command');return}
    if(['patchSession','endSession'].includes(method)){
      if(args.length<1||args.length>2||typeof args[0]!=='string'||!args[0])fail('invalid_command');
      if(args[1]!==undefined)namedObject(args[1],['questionIds','answered','correct','index','secondsRemaining','assignmentId','score','autoSubmitted','total','graded','durationMs','durationSeconds','duration_seconds','status','completedAt','completed_at','endedAt']);return;
    }
    if(method==='updateStreak'){if(args.length>1||(args.length&&typeof args[0]!=='string'))fail('invalid_command');return}
    if(args.length>1)fail('invalid_command');const p=args[0]??{};
    if(method==='saveProfile')namedObject(p,['name','grade','school','dailyGoal']);
    else if(method==='saveSettings')namedObject(p,['adaptive','dailyGoal','reviewReminder']);
    else if(method==='startSession')namedObject(p,['type','mode','questionIds','targetCount','bundleId','bundleLabel','assignmentId','title','course','unit','topic','scope','targetId','bankCode']);
    else if(method==='resetLearningData')namedObject(p,['keepProfile','keepTeacher']);
    else if(method==='setContinue'){
      if(args.length!==1)fail('invalid_command');if(args[0]!==null)namedObject(p,['type','label','url','bundleId','questionIds','answers','seconds','sessionId','assignmentId','title','group','mode','index','targetCount','correct','graded','answeredIds','course','unitTitle','scope','targetId','bankCode']);
    }else fail('invalid_command');
  }
  function intent(value){
    const v=clone(value);closed(v,['contract','owner','operation_id','method','args','at','seed','search','expected_revision']);
    if(v.contract!==ENGINE_CONTRACT||!equal(identity(v.owner,now),current())||!UUID.test(v.operation_id)||!Number.isSafeInteger(v.at)||!Number.isInteger(v.seed)||v.seed<0||v.seed>4294967295||
      typeof v.search!=='string'||v.search.length>4096||!Number.isSafeInteger(v.expected_revision)||v.expected_revision<0)fail('invalid_command');
    validateArgs(v.method,v.args);return v;
  }
  function adopt(value){current();if(!view||value.revision>=view.revision)view=engine(value)}
  async function refresh(){
    current();const found=await transact('readonly',(s,guard,set)=>{const read=s.states.get(scope);read.onsuccess=guard(()=>set(engine(read.result)))});
    adopt(found);return projection();
  }
  function projection(){current();if(!view)fail('not_ready');return freeze({contract:ENGINE_CONTRACT,revision:view.revision,data:clone(view.data,STATE_LIMIT,2000000)})}
  function prepare(method,args=[]){
    current();if(!view)fail('not_ready');const at=clock(),sample=random(),operation_id=crypto.randomUUID();
    if(!Number.isFinite(sample)||sample<0||sample>=1)fail('invalid_command');
    return freeze(intent({contract:ENGINE_CONTRACT,owner:clone(current()),operation_id,method,args,at,seed:Math.floor(sample*4294967296),search,expected_revision:view.revision}));
  }
  async function digest(value){const bytes=await bounded(crypto.subtle.digest('SHA-256',encoder.encode(JSON.stringify(value))));return[...new Uint8Array(bytes)].map(n=>n.toString(16).padStart(2,'0')).join('')}
  async function lookup(operationId){
    current();if(typeof operationId!=='string'||!UUID.test(operationId))fail('invalid_command');
    const found=await transact('readonly',(s,guard,set)=>{const r=s.commands.get([...scope,operationId]);r.onsuccess=guard(()=>{
      const command=commandRecord(r.result);
      const bundle=s.bundles.get([...scope,operationId]);bundle.onsuccess=guard(()=>{if(!command){if(bundle.result!==undefined)fail('invalid_store');set(null);return}checkedBundle(bundle.result,command);set(command)});
    })});
    current();return found?freeze(clone(found.receipt)):null;
  }
  const rowDomains={attempts:'echs_learning_events_v2',sessions:'echs_learning_sessions_v2',review:'echs_learning_reviews_v2',mastery:'echs_learning_mastery_v2'};
  const domainRows=(data,kind)=>['attempts','sessions'].includes(kind)?data[rowDomains[kind]]||[]:Object.values(data[rowDomains[kind]]||{});
  const bundleKeys=['contract','owner','id','command_sha256','command_revision','method','practice_action','at','seed','local_domains','records','deletion_candidates','unbound_reset_barrier','prior_reset_barrier_id','local_reset_options','wire_state','grading_authoritative'];
  function checkedBundle(value,command=null){
    if(value===undefined)fail('missing_source_bundle');
    const v=clone(value,BUNDLE_LIMITS.rowBytes*3+4096,2000000);
    closed(v,['contract','organization_id','account_id','incarnation_id','adoption_epoch','id','revision','bytes','raw']);
    if(v.contract!==BUNDLE_CONTRACT||v.organization_id!==scope[0]||v.account_id!==scope[1]||v.incarnation_id!==scope[2]||v.adoption_epoch!==scope[3]||!UUID.test(v.id)||
      !Number.isSafeInteger(v.revision)||v.revision<1||v.revision>BUNDLE_LIMITS.count||typeof v.raw!=='string'||!Number.isSafeInteger(v.bytes)||v.bytes<2||v.bytes>BUNDLE_LIMITS.rowBytes||encoder.encode(v.raw).length!==v.bytes)fail('invalid_source_bundle');
    let b;try{b=clone(JSON.parse(v.raw),BUNDLE_LIMITS.rowBytes,2000000)}catch{fail('invalid_source_bundle')}
    if(JSON.stringify(b)!==v.raw)fail('invalid_source_bundle');closed(b,bundleKeys);closed(b.owner,['organization_id','account_id','incarnation_id','adoption_epoch']);
    if(b.contract!==BUNDLE_CONTRACT||!equal(b.owner,clone(binding))||b.id!==v.id||b.command_revision!==v.revision||!HASH.test(b.command_sha256)||
      !(MUTATIONS.includes(b.method)||b.method==='practice')||!Number.isSafeInteger(b.at)||!Number.isInteger(b.seed)||b.seed<0||b.seed>4294967295||
      b.grading_authoritative!==false||b.unbound_reset_barrier!==(b.method==='resetLearningData')||!(b.prior_reset_barrier_id===null||UUID.test(b.prior_reset_barrier_id))||b.prior_reset_barrier_id===b.id)fail('invalid_source_bundle');
    if(b.method==='practice'?!['start','answer','checkpoint','finish','discard'].includes(b.practice_action):b.practice_action!==null)fail('invalid_source_bundle');
    if(b.unbound_reset_barrier){namedObject(b.local_reset_options,['keepProfile','keepTeacher']);}
    else if(b.local_reset_options!==null)fail('invalid_source_bundle');
    if(!Array.isArray(b.local_domains)||b.local_domains.length>DOMAIN_KEYS.length||!Array.isArray(b.records)||b.records.length>JOURNAL_LIMITS.batchRows||!Array.isArray(b.deletion_candidates)||b.deletion_candidates.length>BUNDLE_LIMITS.removals)fail('invalid_source_bundle');
    const domains=new Set(),records=new Set(),removals=new Set();
    for(const d of b.local_domains){closed(d,['key','action']);if(!DOMAIN_KEYS.includes(d.key)||!['put','remove'].includes(d.action)||domains.has(d.key))fail('invalid_source_bundle');domains.add(d.key)}
    for(const r of b.records){closed(r,['kind','record_id','local_revision','value_json']);const key=JSON.stringify([r.kind,r.record_id]);
      if(!Object.hasOwn(rowDomains,r.kind)||typeof r.record_id!=='string'||!Number.isSafeInteger(r.local_revision)||r.local_revision<1||records.has(key)||typeof r.value_json!=='string'||encoder.encode(r.value_json).length>JOURNAL_LIMITS.rowBytes)fail('invalid_source_bundle');
      let row;try{row=clone(JSON.parse(r.value_json),JOURNAL_LIMITS.rowBytes)}catch{fail('invalid_source_bundle')}
      if(JSON.stringify(row)!==r.value_json||rowId(r.kind,row)!==r.record_id)fail('invalid_source_bundle');records.add(key);
    }
    for(const r of b.deletion_candidates){closed(r,['kind','record_id','prior_value_json','reason']);const key=JSON.stringify([r.kind,r.record_id]);
      if(!Object.hasOwn(rowDomains,r.kind)||typeof r.record_id!=='string'||removals.has(key)||records.has(key)||typeof r.prior_value_json!=='string'||encoder.encode(r.prior_value_json).length>JOURNAL_LIMITS.rowBytes||
        !['local-reset-source-removal','source-window-removal','unclassified-source-removal'].includes(r.reason))fail('invalid_source_bundle');
      let row;try{row=clone(JSON.parse(r.prior_value_json),JOURNAL_LIMITS.rowBytes)}catch{fail('invalid_source_bundle')}
      if(JSON.stringify(row)!==r.prior_value_json||rowId(r.kind,row)!==r.record_id)fail('invalid_source_bundle');removals.add(key);
    }
    const localOnly=!b.records.length&&!b.deletion_candidates.length&&!b.unbound_reset_barrier;
    if(b.wire_state!==(localOnly?'local-only':'unbound'))fail('invalid_source_bundle');
    if(command&&(command.id!==v.id||command.sha256!==b.command_sha256||command.receipt.revision!==v.revision))fail('invalid_source_bundle');
    return v;
  }
  function makeBundle(cmd,fingerprint,before,after,revision,assigned){
    const m=assigned.meta;if(m.bundle_count!==revision-1)fail('invalid_store');
    const removals=[];
    for(const kind of Object.keys(rowDomains)){
      const remaining=new Set(domainRows(after,kind).map(row=>rowId(kind,row)));
      for(const row of domainRows(before,kind))if(!remaining.has(rowId(kind,row))){
        removals.push({kind,record_id:rowId(kind,row),prior_value_json:JSON.stringify(row),reason:cmd.method==='resetLearningData'?'local-reset-source-removal':['attempts','sessions'].includes(kind)?'source-window-removal':'unclassified-source-removal'});
        if(removals.length>BUNDLE_LIMITS.removals)fail('source_bundle_full');
      }
    }
    const reset=cmd.method==='resetLearningData';
    const payload=clone({contract:BUNDLE_CONTRACT,owner:binding,id:cmd.operation_id,command_sha256:fingerprint,command_revision:revision,method:cmd.method,
      practice_action:cmd.method==='practice'?cmd.args[0].action:null,at:cmd.at,seed:cmd.seed,
      local_domains:DOMAIN_KEYS.filter(key=>!equal(before[key],after[key])).map(key=>({key,action:Object.hasOwn(after,key)?'put':'remove'})),
      records:assigned.assigned,deletion_candidates:removals,unbound_reset_barrier:reset,prior_reset_barrier_id:m.reset_barrier_id,
      local_reset_options:reset?(cmd.args[0]||{}):null,wire_state:assigned.assigned.length||removals.length||reset?'unbound':'local-only',grading_authoritative:false},BUNDLE_LIMITS.rowBytes,2000000);
    const raw=JSON.stringify(payload),bytes=encoder.encode(raw).length;
    m.bundle_count++;m.bundle_bytes+=bytes;if(m.bundle_count>BUNDLE_LIMITS.count||m.bundle_bytes>BUNDLE_LIMITS.totalBytes)fail('source_bundle_full');
    if(reset)m.reset_barrier_id=cmd.operation_id;
    return checkedBundle({contract:BUNDLE_CONTRACT,...binding,id:cmd.operation_id,revision,bytes,raw});
  }
  function sourceBundle(id){
    current();if(typeof id!=='string'||!UUID.test(id))fail('invalid_command');
    return transact('readonly',(s,guard,set)=>{const r=s.commands.get([...scope,id]);r.onsuccess=guard(()=>{
      const command=commandRecord(r.result);
      const b=s.bundles.get([...scope,id]);b.onsuccess=guard(()=>{if(!command){if(b.result!==undefined)fail('invalid_store');set(null);return}set(freeze(checkedBundle(b.result,command)))});
    })});
  }
  function sourceBundles(options={}){
    const o=clone(options,4096);namedObject(o,['after_revision','limit']);const after=o.after_revision??0,limit=o.limit??BUNDLE_LIMITS.read;
    if(!Number.isSafeInteger(after)||after<0||after>=Number.MAX_SAFE_INTEGER||!Number.isInteger(limit)||limit<1||limit>BUNDLE_LIMITS.read)fail('invalid_input');
    return transact('readonly',(s,guard,set)=>{const owner=s.owners.get(scope);owner.onsuccess=guard(()=>{
      const m=meta(owner.result),rows=[];let bytes=0,scanned=0;
      const cursor=s.bundles.index('ownerRevision').openCursor(IDBKeyRange.bound([...scope,after+1],[...scope,Number.MAX_SAFE_INTEGER]));
      cursor.onsuccess=guard(()=>{const entry=cursor.result;if(!entry){if(after+scanned<m.bundle_count)fail('invalid_store');set(freeze(rows));return}
        const row=checkedBundle(entry.value);if(++scanned>m.bundle_count||row.revision!==after+scanned||row.revision>m.bundle_count||row.bytes>m.bundle_bytes)fail('invalid_store');
        if(rows.length===limit||bytes+row.bytes>BUNDLE_LIMITS.readBytes){set(freeze(rows));return}
        const command=s.commands.get([...scope,row.id]);command.onsuccess=guard(()=>{
          const known=commandRecord(command.result);if(!known)fail('invalid_store');checkedBundle(row,known);
          bytes+=row.bytes;if(bytes>m.bundle_bytes)fail('invalid_store');rows.push(row);if(rows.length===limit){set(freeze(rows));return}entry.continue();
        });
      });
    })});
  }
  function changedRows(before,after){
    // P1 records changed rows only. Reset retains pending intent and immutable
    // history; transport stays held until an explicit cancellation/tombstone policy.
    const definitions={attempts:['echs_learning_events_v2',v=>v||[]],sessions:['echs_learning_sessions_v2',v=>v||[]],review:['echs_learning_reviews_v2',v=>Object.values(v||{})],mastery:['echs_learning_mastery_v2',v=>Object.values(v||{})]};
    const payload={attempts:[],sessions:[],review:[],lessons:[],mastery:[]};
    for(const[kind,[key,rows]]of Object.entries(definitions)){
      const prior=new Map(rows(before[key]).map(row=>[rowId(kind,row),row]));
      payload[kind]=rows(after[key]).filter(row=>!prior.has(rowId(kind,row))||!equal(prior.get(rowId(kind,row)),row));
    }
    return payloadRows({contract:SOURCE_CONTRACT,owner:clone(current()),payload},current(),now);
  }
  async function commit(value){
    current();let cmd=intent(value),candidateAttempt=null;
    const stable={operation_id:cmd.operation_id,method:cmd.method,args:cmd.args,at:cmd.at,seed:cmd.seed,search:cmd.search,expected_revision:cmd.expected_revision};
    const fingerprint=await digest(stable);
    if(cmd.method==='recordAttempt'||(cmd.method==='practice'&&cmd.args[0].action==='answer')){
      const transition=createLearningTransition({},cmd),attemptArgs=cmd.method==='practice'?[cmd.args[0].attempt]:cmd.args;
      const row=clone(transition.run('recordAttempt',attemptArgs),JOURNAL_LIMITS.rowBytes);
      candidateAttempt={id:rowId('attempts',row),row,sha256:await digest(row)};
    }
    try{
      const result=await transact('readwrite',(s,guard,set)=>{
        const prior=s.commands.get([...scope,cmd.operation_id]);prior.onsuccess=guard(()=>{
          const remembered=commandRecord(prior.result),read=s.states.get(scope);
          if(remembered&&remembered.sha256!==fingerprint)fail('operation_conflict');
          read.onsuccess=guard(()=>{
            const existing=engine(read.result);
            if(remembered){if(remembered.receipt.revision>existing.revision)fail('invalid_store');const known=s.bundles.get([...scope,cmd.operation_id]);known.onsuccess=guard(()=>{checkedBundle(known.result,remembered);set({engine:existing,receipt:{...remembered.receipt,duplicate:true,effects:[]}})});return}
            if(!['recordAttempt','initialize','updateStreak'].includes(cmd.method)&&cmd.expected_revision!==existing.revision)fail('state_conflict');
            if(existing.revision>=Number.MAX_SAFE_INTEGER-1||existing.command_count>=50000)fail('engine_full');
            const apply=()=>{
              const transition=createLearningTransition(existing.data,cmd);let raw;
              try{raw=cmd.method==='practice'?runPracticeFlow(transition,cmd.args[0],{practiceURL}):transition.run(cmd.method,cmd.args)}catch(error){if(error instanceof PracticeFlowError)fail(error.code);throw error}
              // The legacy profile read initializes missing data. Do that write inside
              // reset's transaction so subsequent captured-handle reads stay pure.
              if(cmd.method==='resetLearningData')transition.run('initialize');
              const data=clone(transition.state(),STATE_LIMIT,2000000),effects=clone(transition.effects()),result=raw===undefined?null:clone(raw);
              const rows=changedRows(existing.data,data);
              for(const row of rows)if(row.kind==='attempts'){
                if(!candidateAttempt||row.id!==candidateAttempt.id||!equal(row.row,candidateAttempt.row))fail('invalid_transition');row.sha256=candidateAttempt.sha256;
              }
              const receipt={contract:ENGINE_CONTRACT,operation_id:cmd.operation_id,revision:existing.revision+1,durability:'committed',duplicate:false,result,effects};
              const saved={contract:ENGINE_CONTRACT,...binding,id:cmd.operation_id,sha256:fingerprint,receipt};
              existing.command_count++;existing.command_bytes+=encoder.encode(JSON.stringify(saved)).length;
              if(existing.command_bytes>COMMAND_LIMIT)fail('engine_full');
              if(candidateAttempt){
                const archived={contract:ENGINE_CONTRACT,...binding,id:candidateAttempt.id,sha256:candidateAttempt.sha256,row:candidateAttempt.row};
                existing.history_count++;existing.history_bytes+=encoder.encode(JSON.stringify(archived)).length;
                if(existing.history_count>50000||existing.history_bytes>HISTORY_LIMIT)fail('engine_full');s.history.add(archived);
              }
              const next=engine({...existing,data,revision:receipt.revision});
              writeRows(s,guard,rows,assigned=>{
                const bundle=makeBundle(cmd,fingerprint,existing.data,data,receipt.revision,assigned);
                s.bundles.add(bundle);s.owners.put(assigned.meta);s.states.put(next);s.commands.add(saved);set({engine:next,receipt});
              });
            };
            if(candidateAttempt){const r=s.attempts.get([...scope,candidateAttempt.id]);r.onsuccess=guard(()=>{
              const previous=stamp(r.result,candidateAttempt.id);if(previous)fail(previous.sha256===candidateAttempt.sha256?'duplicate_attempt':'immutable_attempt_conflict');apply();
            })}else apply();
          });
        });
      });
      adopt(result.engine);return freeze(clone(result.receipt));
    }finally{cmd=null;candidateAttempt=null}
  }
  function query(method,args=[],environment={}){
    current();if(!view)fail('not_ready');if(!QUERIES.includes(method))fail('invalid_query');
    const options=clone(environment,4096);namedObject(options,['at','seed']);
    const transition=createLearningTransition(view.data,{at:options.at??clock(),seed:options.seed??Math.floor(random()*4294967296),search});
    let value=transition.run(method,clone(args));
    // The legacy achievement catalogue carries internal predicate functions.
    // Only its data is a public projection; eligibility still runs unchanged
    // inside the original transition when a mutation evaluates achievements.
    if(method==='earnedAchievements')value=value.map(({test,...row})=>row);
    if(!equal(clone(transition.state(),STATE_LIMIT,2000000),view.data)||transition.effects().length)fail('query_wrote_state');
    current();if(value===undefined||value===Infinity||value===-Infinity)return value;
    return freeze(clone(value,STATE_LIMIT,2000000,true));
  }
  try{await refresh()}catch(error){dispose(error.code||'storage_error');throw error}
  return Object.freeze({prepare,commit,lookup,refresh,projection,query,snapshot,sourceBundle,sourceBundles,binding:()=>freeze(clone(current())),
    releaseSnapshot(sent){current();if(!receipts.delete(sent))fail('unknown_snapshot')},
    state(){try{current()}catch{}return Object.freeze({status:reason?'disposed':view?'ready':'initializing',reason,contract:ENGINE_CONTRACT,sync:{status:'held',reason:'versioned_sync_required'}})},
    signal:controller.signal,dispose:()=>dispose()});
}
