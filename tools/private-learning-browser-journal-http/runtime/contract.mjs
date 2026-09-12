import {need,parseWire} from './wire.mjs';
export const CONTRACT='echs.learning.server-journal.v1';
export const ROUTES=Object.freeze({state:'learning_journal_state',apply:'learning_journal_apply',operation:'learning_journal_operation',heads:'learning_journal_heads'});
export const LIMITS=Object.freeze({record_operations:128,row_bytes:65536,normalized_request_bytes:1048576,heads_per_read:8,read_response_bytes:1048576,depth:24,nodes:100000,retained_operations:50000,retained_attempts:50000,retained_versions:200000,retained_heads:50000,retained_normalized_bytes:268435456,integer_max:9007199254740991});
const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(v);
const hash=v=>typeof v==='string'&&/^[0-9a-f]{64}$/.test(v);
const integer=(v,min=0)=>Number.isSafeInteger(v)&&v>=min;
const mutable=['sessions','review','lessons','mastery'],kinds=['attempts',...mutable];
const aliases={attempts:['event_id','client_event_id','id'],sessions:['client_session_id','clientSessionId','id'],review:['question_id','questionId','id'],lessons:['access_key'],mastery:['skill_key','key']};
export const canonical=v=>v===null||typeof v!=='object'?JSON.stringify(v):Array.isArray(v)?'['+v.map(canonical).join(',')+']':'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';
// Only protocol metadata is projected into JavaScript numeric authority. Opaque
// record-value numbers, including values outside binary64, remain raw JSON.
export function parseProtocolWire(route,raw,{reply=false}={}){
 need(Object.hasOwn(ROUTES,route),'route');const wire=parseWire(raw);
 for(const {path,lexeme} of wire.numbers){
  const opaque=path.length>=3&&path[0]==='records'&&Number.isInteger(path[1])&&path[2]==='value'&&(!reply&&route==='apply'||reply&&route==='heads');
  if(!opaque)need(/^(?:0|[1-9][0-9]*)$/.test(lexeme)&&Number.isSafeInteger(Number(lexeme)),'protocol-integer');
 }
 return wire;
}
export function closed(v,keys){need(v&&Object.getPrototypeOf(v)===Object.prototype&&Reflect.ownKeys(v).length===keys.length,'closed-object');for(const key of keys){const d=Object.getOwnPropertyDescriptor(v,key);need(d&&Object.hasOwn(d,'value'),'closed-object');}return v;}
function recordId(v){return typeof v==='string'&&v.length>0&&v.length<=256&&new TextEncoder().encode(v).length<=1024&&!/[\u0000-\u001f\u007f-\u009f]/.test(v);}
function recordValue(kind,id,value){need(value&&Object.getPrototypeOf(value)===Object.prototype,'record-value');const present=aliases[kind].filter(a=>Object.hasOwn(value,a));need(present.length>0&&present.every(a=>value[a]===id),'value-identity');}
function binding(p){need(p.contract===CONTRACT&&uuid(p.incarnation_id)&&p.adoption_epoch===1,'request-binding');}
export function validateRequest(route,p){
 need(Object.hasOwn(ROUTES,route),'route');
 if(route==='state'){closed(p,[]);return p;}
 if(route==='operation'){closed(p,['contract','incarnation_id','adoption_epoch','operation_id']);binding(p);need(uuid(p.operation_id),'operation-id');return p;}
 if(route==='heads'){
  closed(p,['contract','incarnation_id','adoption_epoch','reset_generation','keys']);binding(p);need(integer(p.reset_generation)&&Array.isArray(p.keys)&&p.keys.length>=1&&p.keys.length<=8,'head-request');const seen=new Set();
  for(const k of p.keys){closed(k,['kind','record_id']);const key=JSON.stringify([k.kind,k.record_id]);need(mutable.includes(k.kind)&&recordId(k.record_id)&&!seen.has(key),'head-key');seen.add(key);}return p;
 }
 if(p?.action==='reset'){closed(p,['contract','action','operation_id','incarnation_id','adoption_epoch','reset_generation','expected_owner_revision']);need(integer(p.expected_owner_revision),'owner-revision');}
 else{closed(p,['contract','action','operation_id','incarnation_id','adoption_epoch','reset_generation','records']);need(p.action==='commit'&&Array.isArray(p.records)&&p.records.length>=1&&p.records.length<=128,'record-count');const seen=new Set();
  for(const r of p.records){const append=r?.kind==='attempts'&&r?.action==='append',put=mutable.includes(r?.kind)&&r?.action==='put',del=mutable.includes(r?.kind)&&r?.action==='delete';need(append||put||del,'record-action');
   closed(r,['kind','record_id','local_revision','action',...(append?[]:['expected_revision']),...(del?[]:['value'])]);
   const key=JSON.stringify([r.kind,r.record_id]);need(recordId(r.record_id)&&integer(r.local_revision,1)&&!seen.has(key),'record-identity');seen.add(key);
   if(!append)need(integer(r.expected_revision,del?1:0),'record-revision');
   if(!del)recordValue(r.kind,r.record_id,r.value);
  }
 }
 binding(p);need(uuid(p.operation_id)&&integer(p.reset_generation),'operation-context');return p;
}
function current(v){closed(v,['reset_generation','owner_revision']);need(integer(v.reset_generation)&&integer(v.owner_revision),'reply-current');}
function receipt(r,request){
 closed(r,['contract','operation_id','incarnation_id','adoption_epoch','accepted_generation','owner_revision','request_sha256','accepted_at','durability','grading_authoritative','action','records','reset_to']);
 need(r.contract==='echs.learning.server-receipt.v1'&&uuid(r.operation_id)&&uuid(r.incarnation_id)&&r.adoption_epoch===1&&integer(r.accepted_generation)&&integer(r.owner_revision,1)&&hash(r.request_sha256),'receipt-identity');
 need(typeof r.accepted_at==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{6}Z$/.test(r.accepted_at)&&Number.isFinite(Date.parse(r.accepted_at))&&r.durability==='committed'&&r.grading_authoritative===false,'receipt-authority');
 need(new Date(r.accepted_at).toISOString()===r.accepted_at.slice(0,23)+'Z','receipt-timestamp');
 need(r.action==='commit'||r.action==='reset','receipt-action');need(Array.isArray(r.records)&&r.records.length<129,'receipt-records');
 if(r.action==='reset')need(r.records.length===0&&r.reset_to===r.accepted_generation+1&&integer(r.reset_to,1),'receipt-reset');
 else need(r.records.length>=1&&r.reset_to===null,'receipt-commit');
 const seen=new Set();for(let i=0;i<r.records.length;i++){const m=r.records[i];closed(m,['request_index','kind','record_id','local_revision','record_revision','record_generation','value_sha256','disposition']);
  const key=JSON.stringify([m.kind,m.record_id]);need(m.request_index===i&&kinds.includes(m.kind)&&recordId(m.record_id)&&integer(m.local_revision,1)&&integer(m.record_revision,1)&&integer(m.record_generation)&&m.record_generation<=r.accepted_generation&&hash(m.value_sha256)&&!seen.has(key),'receipt-record');seen.add(key);
  need(m.kind==='attempts'?m.record_revision===1&&['appended','existing'].includes(m.disposition):['put','deleted'].includes(m.disposition)&&m.record_generation===r.accepted_generation,'receipt-disposition');
  if(m.disposition==='appended')need(m.record_generation===r.accepted_generation,'receipt-generation');
 }
 if(request){need(r.operation_id===request.operation_id&&r.incarnation_id===request.incarnation_id&&r.adoption_epoch===request.adoption_epoch,'receipt-request');
  if(request.action){need(r.action===request.action&&r.accepted_generation===request.reset_generation,'receipt-intent');
   if(request.action==='reset')need(r.owner_revision===request.expected_owner_revision+1,'receipt-owner-revision');
   else{need(r.records.length===request.records.length,'receipt-count');for(let i=0;i<request.records.length;i++){const a=request.records[i],b=r.records[i];need(b.kind===a.kind&&b.record_id===a.record_id&&b.local_revision===a.local_revision,'receipt-local-metadata');if(a.kind!=='attempts')need(b.record_revision===a.expected_revision+1&&b.disposition===(a.action==='delete'?'deleted':'put'),'receipt-cas');}}
  }
 }
 return r;
}
export function validateReply(route,request,data,{intent=null,expectedReceipt=null}={}){
 const requestForReceipt=intent||request;
 if(route==='state'){
  closed(data,['ok','contract','organization_id','account_id','incarnation_id','adoption_epoch','reset_generation','owner_revision','limits','grading_authoritative']);
  need(data.ok===true&&data.contract===CONTRACT&&[data.organization_id,data.account_id,data.incarnation_id].every(uuid)&&data.adoption_epoch===1&&integer(data.reset_generation)&&integer(data.owner_revision)&&data.grading_authoritative===false,'state-reply');closed(data.limits,Object.keys(LIMITS));need(Object.keys(LIMITS).every(k=>data.limits[k]===LIMITS[k]),'state-limits');return data;
 }
 if(route==='heads'){
  closed(data,['ok','contract','current','records']);current(data.current);need(data.current.reset_generation===request.reset_generation&&Array.isArray(data.records)&&data.records.length===request.keys.length,'heads-reply');
  data.records.forEach((r,i)=>{closed(r,['kind','record_id','revision','deleted','value','value_sha256']);need(r.kind===request.keys[i].kind&&r.record_id===request.keys[i].record_id&&integer(r.revision)&&typeof r.deleted==='boolean','head-metadata');if(r.revision===0)need(r.deleted===false&&r.value===null&&r.value_sha256===null,'head-missing');else{need(hash(r.value_sha256)&&(r.deleted?r.value===null:r.value&&Object.getPrototypeOf(r.value)===Object.prototype),'head-value');if(!r.deleted)recordValue(r.kind,r.record_id,r.value);}});
 }else{
  closed(data,route==='apply'?['ok','contract','replayed','receipt','current']:['ok','contract','found','receipt','current']);current(data.current);
  need(route==='apply'?typeof data.replayed==='boolean':typeof data.found==='boolean','receipt-wrapper');
  if(route==='operation'&&!data.found){need(data.receipt===null,'missing-operation');return common(data);}
  const r=receipt(data.receipt,requestForReceipt);need(data.current.owner_revision>=r.owner_revision&&data.current.reset_generation>=(r.reset_to??r.accepted_generation),'receipt-current');
  if(expectedReceipt!==null){receipt(expectedReceipt,requestForReceipt);need(canonical(r)===canonical(expectedReceipt),'known-receipt-changed');}
 }
 return common(data);
}
function common(v){need(v.ok===true&&v.contract===CONTRACT,'reply-contract');return v;}
