import {need,MAX_BYTES} from './journal/wire.mjs';
import {CONTRACT,closed,canonical,parseProtocolWire,validateRequest,validateReply} from './journal/contract.mjs';
import {createPendingIntent,acknowledgeIntent} from './journal/pending-intent.mjs';
export const SYNC_LIMITS=Object.freeze({contexts:64,contextBytes:33554432,wireBytes:33554432,wireCount:50000,bindingBytes:33554432,bindingCount:50000,lineageBytes:33554432,lineageCount:100000});
export const CONTEXT_CONTRACT='echs.learning.remote-context.v1';
export const BINDING_CONTRACT='echs.learning.bundle-binding.v2';
export const LINEAGE_CONTRACT='echs.learning.source-lineage.v1';
export const WIRE_CONTRACT='echs.learning.bound-wire.v2';
const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(v);
const integer=(v,min=0)=>Number.isSafeInteger(v)&&v>=min;
const nullableId=v=>v===null||uuid(v);
export const byteLength=v=>new TextEncoder().encode(v).length;
// Logical retained UTF-8 bytes, including envelopes and duplicated raw strings.
// This is a deterministic application budget, not the browser's disk allocation.
export const retainedBytes=v=>byteLength(canonical(v));
const scopeKeys=['organization_id','account_id','incarnation_id','adoption_epoch'];
const mutable=['sessions','review','mastery'];
export function scopeOf(value){return Object.fromEntries(scopeKeys.map(k=>[k,value[k]]));}
function scoped(value,scope){need(scopeKeys.every(k=>value[k]===scope[k]),'sync_scope');}
export function observation(route,requestRaw,status,replyRaw,scope){
 need(status===200,'observation_status');const request=parseProtocolWire(route,requestRaw).value;validateRequest(route,request);
 const response=parseProtocolWire(route,replyRaw,{reply:true}).value;validateReply(route,request,response);
 if(route==='state')scoped(response,scope);else need(request.incarnation_id===scope.incarnation_id&&request.adoption_epoch===scope.adoption_epoch,'sync_scope');
 return {route,request_raw:requestRaw,status,reply_raw:replyRaw};
}
export function checkContext(v,scope){
 closed(v,['contract',...scopeKeys,'id','parent_id','generation','owner_revision','installed_command_revision','installed_row_revision','installed_sync_serial','coverage','observations','bytes']);scoped(v,scope);
 need(v.contract===CONTEXT_CONTRACT&&uuid(v.id)&&nullableId(v.parent_id)&&v.parent_id!==v.id&&['generation','owner_revision','installed_command_revision','installed_row_revision','installed_sync_serial','bytes'].every(k=>integer(v[k])),'context_shape');
 need(Array.isArray(v.observations)&&[2,3].includes(v.observations.length),'context_observations');
 const parsed=v.observations.map(o=>{closed(o,['route','request_raw','status','reply_raw']);observation(o.route,o.request_raw,o.status,o.reply_raw,scope);return {request:parseProtocolWire(o.route,o.request_raw).value,reply:parseProtocolWire(o.route,o.reply_raw,{reply:true}).value};});
 need(v.observations[0].route==='state'&&v.observations.at(-1).route==='state','context_observations');
 for(const p of [parsed[0],parsed.at(-1)])need(p.reply.reset_generation===v.generation&&p.reply.owner_revision===v.owner_revision,'context_changed');
 closed(v.coverage,['all_missing','keys']);need(typeof v.coverage.all_missing==='boolean'&&Array.isArray(v.coverage.keys),'context_coverage');
 if(v.observations.length===2)need(v.generation===0&&v.owner_revision===0&&v.coverage.all_missing===true&&v.coverage.keys.length===0,'empty_owner_required');
 else{
  need(v.observations[1].route==='heads'&&v.coverage.all_missing===false,'context_coverage');const p=parsed[1];
  need(p.reply.current.reset_generation===v.generation&&p.reply.current.owner_revision===v.owner_revision&&JSON.stringify(p.request.keys)===JSON.stringify(v.coverage.keys),'context_changed');
  need(p.reply.records.every(r=>r.revision===0&&!r.deleted&&r.value===null&&r.value_sha256===null),'nonmissing_head');
 }
 const raw=canonical(v.observations);need(byteLength(raw)===v.bytes&&v.bytes<=SYNC_LIMITS.contextBytes,'context_bytes');return v;
}
export function checkPreparedOrigin(v){closed(v,['context_id','generation','reset_barrier_id']);need(nullableId(v.context_id)&&nullableId(v.reset_barrier_id)&&(v.context_id===null?v.generation===null:integer(v.generation)),'prepared_context');return v;}
export function checkLineage(v,scope,kind,id){
 if(v===undefined)return null;closed(v,['contract',...scopeKeys,'kind','record_id','bundle_id','source_record_index','local_revision','context_id','generation']);scoped(v,scope);
 need(v.contract===LINEAGE_CONTRACT&&v.kind===kind&&v.record_id===id&&uuid(v.bundle_id)&&integer(v.source_record_index)&&integer(v.local_revision,1)&&nullableId(v.context_id)&&(v.context_id===null?v.generation===null:integer(v.generation)),'lineage_shape');return v;
}
export function checkBinding(v,scope,bundle){
 need(v!==undefined,'missing_bundle_origin');closed(v,['contract',...scopeKeys,'id','command_revision','origin','state','operation_id','hold_reason']);scoped(v,scope);
 need(v.contract===BINDING_CONTRACT&&v.id===bundle.id&&v.command_revision===bundle.command_revision&&['local-only','unbound','held','bound','acknowledged'].includes(v.state)&&nullableId(v.operation_id),'binding_shape');
 closed(v.origin,['context_id','generation','reset_barrier_id','rows']);checkPreparedOrigin({context_id:v.origin.context_id,generation:v.origin.generation,reset_barrier_id:v.origin.reset_barrier_id});
 need(v.origin.reset_barrier_id===bundle.prior_reset_barrier_id,'binding_reset');
 const localOnly=bundle.wire_state==='local-only'&&bundle.records.length===0&&!bundle.unbound_reset_barrier&&bundle.prior_reset_barrier_id===null&&bundle.deletion_candidates.length===0;
 need((v.state==='local-only')===localOnly,'binding_local_only');
 need(Array.isArray(v.origin.rows)&&v.origin.rows.length===bundle.records.length,'binding_rows');
 for(let i=0;i<v.origin.rows.length;i++){
  const b=v.origin.rows[i],r=bundle.records[i];need(b&&typeof b==='object','binding_base');
  if(b.type==='predecessor'){
   closed(b,['type','bundle_id','source_record_index','local_revision']);need(uuid(b.bundle_id)&&b.bundle_id!==v.id&&integer(b.source_record_index)&&integer(b.local_revision,1)&&b.local_revision<r.local_revision,'binding_predecessor');
  }else if(b.type==='missing'){closed(b,['type','context_id','expected_revision']);need(uuid(b.context_id)&&b.expected_revision===0&&mutable.includes(r.kind),'binding_missing');}
  else{closed(b,['type']);need(b.type==='unknown'||b.type==='append'&&r.kind==='attempts','binding_base');}
 }
 need(['bound','acknowledged'].includes(v.state)?uuid(v.operation_id)&&v.hold_reason===null:v.operation_id===null,'binding_operation');
 need(v.state==='held'?typeof v.hold_reason==='string'&&/^[a-z_]{1,64}$/.test(v.hold_reason):v.hold_reason===null,'binding_hold');return v;
}
export function makeBinding(bundle,scope,prepared,context,lineages,coverage){
 checkPreparedOrigin(prepared);const rows=bundle.records.map((r,i)=>{
  if(!context)return {type:'unknown'};
  if(r.kind==='attempts')return {type:'append'};
  const prev=lineages[i];if(prev)return prev.context_id!==null&&prev.generation===context.generation?{type:'predecessor',bundle_id:prev.bundle_id,source_record_index:prev.source_record_index,local_revision:prev.local_revision}:{type:'unknown'};
  const proof=coverage.get(JSON.stringify([r.kind,r.record_id]))||coverage.get('*');return proof?{type:'missing',context_id:proof,expected_revision:0}:{type:'unknown'};
 });
 let reason=null;if(bundle.unbound_reset_barrier||bundle.prior_reset_barrier_id!==null)reason='reset_barrier';else if(bundle.deletion_candidates.length)reason='deletion_policy';else if(bundle.records.length&&(!context||rows.some(r=>r.type==='unknown')))reason='unknown_origin';
 const v={contract:BINDING_CONTRACT,...scope,id:bundle.id,command_revision:bundle.command_revision,origin:{...prepared,rows},state:reason?'held':bundle.wire_state==='local-only'?'local-only':'unbound',operation_id:null,hold_reason:reason};return checkBinding(v,scope,bundle);
}
export function checkResolution(bundle,binding,rows){
 need(Array.isArray(rows)&&rows.length===bundle.records.length,'wire_resolution');
 rows.forEach((r,i)=>{const base=binding.origin.rows[i];
  if(base.type==='predecessor'){
   closed(r,['type','bundle_id','source_record_index','local_revision','operation_id','record_revision','record_generation','accepted_generation']);
   need(r.type==='predecessor'&&r.bundle_id===base.bundle_id&&r.source_record_index===base.source_record_index&&r.local_revision===base.local_revision&&uuid(r.operation_id)&&integer(r.record_revision,1)&&r.record_revision<Number.MAX_SAFE_INTEGER&&r.record_generation===binding.origin.generation&&r.accepted_generation===binding.origin.generation,'wire_predecessor');
  }else need(['append','missing'].includes(base.type)&&canonical(r)===canonical(base),'wire_resolution');
 });return rows;
}
export function makeWire(bundle,binding,scope,operationId,resolution=binding.origin.rows){
 checkBinding(binding,scope,bundle);need(binding.state==='unbound'&&binding.origin.context_id!==null&&binding.origin.reset_barrier_id===null&&bundle.prior_reset_barrier_id===null&&!bundle.unbound_reset_barrier&&!bundle.deletion_candidates.length,'wire_held');
 need(resolution.every(r=>r.type!=='predecessor'||Object.hasOwn(r,'operation_id')),'predecessor_ack_required');checkResolution(bundle,binding,resolution);
 need(bundle.records.length>=1&&bundle.records.length<=128,'wire_record_limit');
 const records=bundle.records.map((row,i)=>{need(byteLength(row.value_json)<=65536,'wire_row_limit');const base=resolution[i];need(base.type!=='predecessor'||base.operation_id!==operationId,'wire_predecessor');const metadata={kind:row.kind,record_id:row.record_id,local_revision:row.local_revision,action:row.kind==='attempts'?'append':'put'};
  if(row.kind!=='attempts')metadata.expected_revision=base.type==='predecessor'?base.record_revision:base.expected_revision;
  return JSON.stringify(metadata).slice(0,-1)+',"value":'+row.value_json+'}';});
 const metadata={contract:CONTRACT,action:'commit',operation_id:operationId,incarnation_id:scope.incarnation_id,adoption_epoch:scope.adoption_epoch,reset_generation:binding.origin.generation};
 const raw=JSON.stringify(metadata).slice(0,-1)+',"records":['+records.join(',')+']}';need(byteLength(raw)<=MAX_BYTES,'wire_byte_limit');
 const source_origin={context_id:binding.origin.context_id,generation:binding.origin.generation,reset_barrier_id:binding.origin.reset_barrier_id};
 const pending=createPendingIntent(raw,scope);return {contract:WIRE_CONTRACT,...scope,id:operationId,bundle_id:bundle.id,source_origin,exact_raw:raw,raw_bytes:byteLength(raw),resolution,pending_intent:pending,first_delivery:null};
}
export function checkWire(v,scope,bundle,binding){
 closed(v,['contract',...scopeKeys,'id','bundle_id','source_origin','exact_raw','raw_bytes','resolution','pending_intent','first_delivery']);scoped(v,scope);
 need(v.contract===WIRE_CONTRACT&&v.id===binding.operation_id&&v.bundle_id===bundle.id&&['bound','acknowledged'].includes(binding.state),'wire_binding');
 checkPreparedOrigin(v.source_origin);need(canonical(v.source_origin)===canonical({context_id:binding.origin.context_id,generation:binding.origin.generation,reset_barrier_id:binding.origin.reset_barrier_id}),'wire_source_origin');
 const rebuilt=makeWire(bundle,{...binding,state:'unbound',operation_id:null},scope,v.id,v.resolution);
 need(v.exact_raw===rebuilt.exact_raw&&v.raw_bytes===rebuilt.raw_bytes,'wire_changed');
 if(binding.state==='bound')need(v.first_delivery===null&&canonical(v.pending_intent)===canonical(rebuilt.pending_intent),'wire_changed');
 else{
  const evidence=v.first_delivery;closed(evidence,['route','request_raw','status','reply_raw']);need(evidence.route==='apply'&&evidence.request_raw===v.exact_raw&&evidence.status===200,'wire_first_delivery');
  const accepted=acknowledgeIntent(rebuilt.pending_intent,{route:evidence.route,requestRaw:evidence.request_raw,status:evidence.status,replyRaw:evidence.reply_raw,activeOwner:scope});
  need(accepted.acknowledged&&canonical(v.pending_intent)===canonical(accepted.intent),'wire_receipt');
 }return v;
}
export function acknowledgeWire(v,scope,bundle,binding,evidence){
 checkWire(v,scope,bundle,binding);closed(evidence,['route','request_raw','status','reply_raw']);
 const accepted=acknowledgeIntent(v.pending_intent,{route:evidence.route,requestRaw:evidence.request_raw,status:evidence.status,replyRaw:evidence.reply_raw,activeOwner:scope});
 if(!accepted.acknowledged)return null;
 const data=parseProtocolWire(evidence.route,evidence.reply_raw,{reply:true}).value;
 return {wire:v.first_delivery===null?{...v,pending_intent:accepted.intent,first_delivery:evidence}:v,current:data.current};
}
