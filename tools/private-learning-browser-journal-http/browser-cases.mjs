// Twelve actual browser/IDB/HTTPS/SQL groups. All server success is real transport.
import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
import {CONTRACT} from './runtime/contract.mjs';

export const LABELS=Object.freeze([
 'B01 Actual native ACK agrees with committed SQL and applies no learning effect',
 'B02 Older ACK preserves newer pending source and resolves its exact predecessor',
 'B03 Two native pages converge on one operation and one first ACK',
 'B04 Lost reply preserves exact intent through same-context page and store reopen',
 'B05 Actual 207 and partial replies preserve pending intent until exact replay',
 'B06 Actual revoked session denial preserves pending and a fresh session retries',
 'B07 Revocation during observed PostgreSQL owner wait prevents browser ACK',
 'B08 Reset after lost reply retains the old receipt and blocks old-context work',
 'B09 Actual whole-source conflict preserves attempt and mutable pending rows',
 'B10 Disposal during committed deferred response aborts fetch and retains intent',
 'B11 Native ACK transaction abort preserves eleven stores after SQL commit',
 'B12 Known exact replay preserves first raw receipt under a newer wrapper'
]);
const same=(a,b)=>assert.deepEqual(a,b);
const hash=raw=>createHash('sha256').update(raw).digest('hex');
const effectsUnchanged=(before,after)=>{for(const name of ['states','commands','attempts','history','bundles','lineage','contexts'])same(after[name],before[name])};

async function prepare(page,id,correct=false){
 return page.evaluate(async({id,correct})=>{
  await fixture.open();const s=fixture.stores[0];await s.installRemoteContext();
  const local=await s.commit(s.prepare('recordAttempt',[{question:fixture.q(id),correct}]));
  const wire=await s.materializeNext();
  return {local,wire,before:await fixture.dump(),projection:s.projection()};
 },{id,correct});
}
const dump=page=>page.evaluate(()=>fixture.dump());
const deliver=(page,id,index=0)=>page.evaluate(({id,index})=>fixture.stores[index].deliverNext({operation_id:id}),{id,index});
const wire=(page,id,index=0)=>page.evaluate(({id,index})=>fixture.stores[index].wireIntent(id),{id,index});
async function nextCommand(page,id,correct=true,index=0){
 return page.evaluate(async({id,correct,index})=>{fixture.tick();return fixture.stores[index].commit(fixture.stores[index].prepare('recordAttempt',[{question:fixture.q(id),correct}]))},{id,correct,index});
}
async function reset(api,c){
 const state=await api('state','{}',c);assert.equal(state.status,200);
 const result=await api('apply',JSON.stringify({contract:CONTRACT,action:'reset',operation_id:randomUUID(),incarnation_id:c.owner.incarnation_id,adoption_epoch:1,reset_generation:state.data.reset_generation,expected_owner_revision:state.data.owner_revision}),c);
 assert.equal(result.status,200);return result;
}

export async function exercise({group,api,command,arm,newPage,rpcPayloads}){
 await group(0,async(p,c)=>{
  const start=await prepare(p,'normal',true),id=start.wire.intent.id;
  const ack=await deliver(p,id);assert.equal(ack.acknowledged,true);assert.equal(ack.duplicate,false);assert.equal(ack.cleared,3);
  const after=await dump(p),known=await wire(p,id),op=await command('operation',c,{operation_id:id});
  assert.ok(op);const response=JSON.parse(known.first_delivery.reply_raw);
  same(response.receipt,JSON.parse(op.receipt_text));same(JSON.parse(known.pending_intent.receipt),response.receipt);assert.equal(response.receipt.request_sha256,hash(op.request_text));
  assert.equal(known.exact_raw,start.wire.intent.exact_raw);assert.ok(rpcPayloads.some(row=>row.operation_id===id&&row.payload_sha256===hash(known.exact_raw)));
  assert.equal(after.records.length,0);assert.equal(after.owners[0].count,0);assert.equal(after.owners[0].bytes,0);effectsUnchanged(start.before,after);
  same(await p.evaluate(()=>fixture.stores[0].projection()),start.projection);
  assert.equal((await command('snapshot',c)).learning_journal_operations.count,1);
  return {cleared:ack.cleared,sql_receipt_equal:true,raw_forwarding_equal:true,learning_effects_unchanged:true};
 });
 await group(1,async(p,c)=>{
  const start=await prepare(p,'newer'),id=start.wire.intent.id,hold=arm('pause',id,c);
  const delivering=deliver(p,id);await hold.entered;
  await nextCommand(p,'newer');const newer=await dump(p);hold.release();const first=await delivering;assert.equal(first.acknowledged,true);
  const afterFirst=await dump(p),retained=newer.records.filter(row=>!start.before.records.some(old=>JSON.stringify(old)===JSON.stringify(row)));
  same(afterFirst.records,retained);assert.equal(afterFirst.records.length,3);
  const successor=await p.evaluate(()=>fixture.stores[0].materializeNext()),body=JSON.parse(successor.intent.exact_raw);
  assert.ok(body.records.filter(row=>row.kind!=='attempts').every(row=>row.expected_revision===1));
  assert.equal(successor.intent.resolution.filter(row=>row.type==='predecessor').length,2);
  const second=await deliver(p,successor.intent.id);assert.equal(second.acknowledged,true);assert.equal(second.cleared,3);
  assert.equal((await dump(p)).records.length,0);assert.equal((await command('snapshot',c)).learning_journal_operations.count,2);
  return {committed_before_pause:hold.proved,preserved_newer_rows:3,predecessor_revisions:[1,1],operations:2};
 });
 await group(2,async(p,c,context)=>{
  const start=await prepare(p,'two-pages'),id=start.wire.intent.id,q=await newPage(context,c);
  await q.evaluate(()=>fixture.open({initialize:false}));
  const results=await Promise.all([deliver(p,id),deliver(q,id)]);
  assert.ok(results.every(row=>row.acknowledged));assert.equal(results.filter(row=>!row.duplicate).length,1);assert.equal(results.filter(row=>row.duplicate).length,1);
  const a=await dump(p),b=await dump(q);same(a,b);assert.equal(a.wire.length,1);assert.equal(a.records.length,0);assert.equal(a.owners[0].count,0);
  effectsUnchanged(start.before,a);assert.equal((await command('snapshot',c)).learning_journal_operations.count,1);
  return {pages:2,operations:1,first_acknowledgements:1,duplicate_acknowledgements:1};
 });
 await group(3,async(p,c,context)=>{
  const start=await prepare(p,'lost-reply'),id=start.wire.intent.id,fault=arm('drop',id,c);
  let denied;try{denied=await deliver(p,id)}finally{fault.release()}
  await fault.settle();
  assert.equal(denied.acknowledged,false);same(await dump(p),start.before);assert.equal(fault.proved,true);
  const lookup=await api('operation',JSON.stringify({contract:CONTRACT,incarnation_id:c.owner.incarnation_id,adoption_epoch:1,operation_id:id}),c);
  assert.equal(lookup.status,200);assert.equal(lookup.data.found,true);same(await dump(p),start.before);
  await p.evaluate(()=>fixture.disposeAll());await p.close();const reopened=await newPage(context,c);await reopened.evaluate(()=>fixture.open({initialize:false}));
  const pending=await wire(reopened,id);assert.equal(pending.exact_raw,start.wire.intent.exact_raw);assert.equal(pending.pending_intent.state,'pending');
  const ack=await deliver(reopened,id);assert.equal(ack.acknowledged,true);assert.equal(ack.duplicate,false);effectsUnchanged(start.before,await dump(reopened));
  assert.equal((await command('snapshot',c)).learning_journal_operations.count,1);
  return {commit_observed:true,lookup_was_informational:true,page_store_reopened_same_context:true,browser_restart_tested:false,operation_uuid_preserved:true};
 });
 await group(4,async(p,c)=>{
  const outcomes=[];
  for(const mode of ['207','partial']){
   const idTag='incomplete-'+mode;
   const start=mode==='207'?await prepare(p,idTag):await (async()=>{await nextCommand(p,idTag);const w=await p.evaluate(()=>fixture.stores[0].materializeNext());return {wire:w,before:await dump(p)}})();
   const id=start.wire.intent.id,fault=arm(mode,id,c),result=await deliver(p,id);
   assert.equal(result.acknowledged,false);assert.equal(fault.proved,true);same(await dump(p),start.before);
   const nativeStatus=(await p.evaluate(()=>fixture.observations)).at(-1).status;assert.equal(nativeStatus,mode==='207'?207:200);
   const ack=await deliver(p,id);assert.equal(ack.acknowledged,true);effectsUnchanged(start.before,await dump(p));
   outcomes.push({mode,native_status:nativeStatus,committed:true,pending_preserved:true,exact_replay_acknowledged:true});
  }
  assert.equal((await command('snapshot',c)).learning_journal_operations.count,2);return {subcases:outcomes};
 });
 await group(5,async(p,c)=>{
  const start=await prepare(p,'revoked'),id=start.wire.intent.id,before=await command('snapshot',c);
  await command('revoke',c);const result=await deliver(p,id);assert.equal(result.acknowledged,false);
  const observed=await p.evaluate(()=>fixture.observations);assert.equal(observed.at(-1).status,401);same(await dump(p),start.before);same(await command('snapshot',c),before);
  const next=await command('new_session',c);assert.match(next,/^synthetic-journal-http-[a-f0-9]{32}$/);c.token=next;
  await p.evaluate(()=>fixture.disposeAll());await p.evaluate(({owner,token,session_tag})=>fixture.configure({owner,token,session_tag}),c);
  const index=await p.evaluate(()=>fixture.open({initialize:false}));assert.equal((await wire(p,id,index)).exact_raw,start.wire.intent.exact_raw);
  assert.equal((await deliver(p,id,index)).acknowledged,true);return {denial_status:401,pending_preserved:true,same_owner_fresh_session_retry:true};
 });
 await group(6,async(p,c)=>{
  const start=await prepare(p,'wait-revoke'),before=await command('snapshot',c);await command('lock',c);
  let pending;
  try{pending=deliver(p,start.wire.intent.id);await command('wait',c);await command('revoke',c)}finally{await command('unlock',c)}
  const result=await pending;assert.equal(result.acknowledged,false);assert.equal((await p.evaluate(()=>fixture.observations)).at(-1).status,401);
  same(await dump(p),start.before);same(await command('snapshot',c),before);
  return {actual_lock_wait_observed:true,denial_status:401,server_unchanged:true,native_pending_unchanged:true};
 });
 await group(7,async(p,c)=>{
  const start=await prepare(p,'reset-first'),id=start.wire.intent.id,fault=arm('drop',id,c);
  let denied;try{denied=await deliver(p,id)}finally{fault.release()}
  await fault.settle();
  assert.equal(denied.acknowledged,false);assert.equal(fault.proved,true);
  const original=await command('operation',c,{operation_id:id});await reset(api,c);await nextCommand(p,'reset-first');
  const ack=await deliver(p,id);assert.equal(ack.acknowledged,true);assert.equal(ack.generation_blocked,true);
  const known=await wire(p,id),held=await p.evaluate(()=>fixture.stores[0].materializeNext());
  same(JSON.parse(known.pending_intent.receipt),JSON.parse(original.receipt_text));assert.equal(held.reason,'generation_changed');
  assert.equal((await dump(p)).records.length,3);assert.equal((await command('snapshot',c)).learning_journal_operations.count,2);
  return {old_receipt_retained:true,current_generation_blocked:true,old_context_materialization_blocked:true,pending_newer_rows:3};
 });
 await group(8,async(p,c)=>{
  const start=await prepare(p,'cas-conflict'),body=JSON.parse(start.wire.intent.exact_raw),row=body.records.find(row=>row.kind==='review');assert.ok(row);
  const other={contract:CONTRACT,action:'commit',operation_id:randomUUID(),incarnation_id:c.owner.incarnation_id,adoption_epoch:1,reset_generation:0,records:[{...row,value:{...row.value,fixture_other_client:true}}]};
  assert.equal((await api('apply',JSON.stringify(other),c)).status,200);const before=await command('snapshot',c);
  assert.equal((await deliver(p,start.wire.intent.id)).acknowledged,false);assert.equal((await p.evaluate(()=>fixture.observations)).at(-1).status,409);
  same(await dump(p),start.before);same(await command('snapshot',c),before);assert.ok(start.before.records.some(row=>row.kind==='attempts'));
  return {conflict_status:409,whole_source_unchanged:true,attempt_preserved:true,server_unchanged_after_conflict:true};
 });
 await group(9,async(p,c)=>{
  const start=await prepare(p,'dispose'),id=start.wire.intent.id,hold=arm('pause',id,c);
  const pending=deliver(p,id).then(value=>({value}),error=>({failed:true,code:typeof error.code==='string'?error.code:null}));
  await hold.entered;assert.equal(hold.proved,true);await p.evaluate(()=>fixture.stores[0].dispose());
  const result=await pending;assert.ok(result.failed||result.value?.acknowledged===false);await hold.aborted;assert.equal(hold.client.aborted,true);assert.ok(['request-aborted','response-close'].includes(hold.client.event));hold.release();
  same(await dump(p),start.before);assert.equal((await p.evaluate(()=>fixture.observations)).at(-1).aborted,true);
  assert.ok(await command('operation',c,{operation_id:id}));const index=await p.evaluate(()=>fixture.open({initialize:false}));
  assert.equal((await wire(p,id,index)).exact_raw,start.wire.intent.exact_raw);assert.equal((await deliver(p,id,index)).acknowledged,true);
  return {commit_observed:true,fetch_aborted:true,socket_abort_observed:true,late_ack_refused:true,native_intent_preserved:true,exact_replay_acknowledged:true};
 });
 await group(10,async(p,c)=>{
  const start=await prepare(p,'native-abort'),id=start.wire.intent.id;
  const result=await p.evaluate(id=>fixture.deliveryWithNativeAbort(0,id),id);
  assert.equal(result.code,'storage_error');assert.equal(result.native_abort_fired,true);assert.equal(result.native_request_success,true);assert.equal(result.native_abort_observed,true);
  same(await dump(p),start.before);assert.ok(await command('operation',c,{operation_id:id}));assert.equal((await command('snapshot',c)).learning_journal_operations.count,1);
  assert.equal((await deliver(p,id)).acknowledged,true);effectsUnchanged(start.before,await dump(p));
  return {native_request_success:true,native_abort_invoked:true,native_abort_observed:true,unchanged_stores:11,sql_committed:true,exact_retry_acknowledged:true};
 });
 await group(11,async(p,c)=>{
  const start=await prepare(p,'known'),id=start.wire.intent.id;assert.equal((await deliver(p,id)).acknowledged,true);
  const first=await wire(p,id);await nextCommand(p,'known');await reset(api,c);
  const replay=await deliver(p,id);assert.equal(replay.acknowledged,true);assert.equal(replay.duplicate,true);assert.equal(replay.generation_blocked,true);
  same(await wire(p,id),first);assert.equal((await p.evaluate(()=>fixture.stores[0].materializeNext())).reason,'generation_changed');
  assert.equal((await command('snapshot',c)).learning_journal_operations.count,2);
  return {duplicate_acknowledgement:true,first_raw_reply_unchanged:true,immutable_receipt_unchanged:true,new_generation_blocks_materialization:true};
 });
}
