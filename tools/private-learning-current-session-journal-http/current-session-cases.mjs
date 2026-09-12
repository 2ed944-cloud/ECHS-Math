// Additional canonical-session cases; the original HTTP20/B12 bodies are untouched.
import assert from 'node:assert/strict';
import {createHash,randomUUID} from 'node:crypto';
import {CONTRACT} from '../private-learning-browser-journal-http/runtime/contract.mjs';

export const LABELS=Object.freeze([
 'C01 Canonical discovery and explicit learning delivery agree with real SQL',
 'C02 Guest nonstudent and invalid canonical sessions never open a journal',
 'C03 Missing SQL owner and foreign canonical profiles cannot establish authority',
 'C04 Shared canonical work survives disposal but rejects an obsolete session',
 'C05 Session replacement and late state cannot restore captured handles',
 'C06 Committed native response bodies cancel without ACK and retry exact bytes',
 'C07 The bridge deadline cancels its native body with caller signal still live',
 'C08 Real SQL revocation expiry and demotion override stale synthetic profiles',
 'C09 New generation changes context while preserving immutable exact receipts',
 'C10 A labeled changed-incarnation wire mutation cannot acknowledge old work',
 'C11 All five legacy upload holds remain effective across entry lifecycle',
 'C12 Controller disposal and foreign channel notifications cannot adopt a store',
]);
const path=route=>'/functions/v1/learning-journal/'+route,me='/functions/v1/account-api/me',config='/source/config/institution.json';
const hash=raw=>createHash('sha256').update(raw).digest('hex'),same=(a,b)=>assert.deepEqual(a,b);
const dump=p=>p.evaluate(()=>fixture.dump()),pending=p=>p.evaluate(()=>fixture.pending);
const wire=(p,id)=>p.evaluate(id=>fixture.wire(id),id),deliver=(p,id,index=0)=>p.evaluate(({id,index})=>fixture.deliver(id,index),{id,index});
async function opened(p){return p.evaluate(()=>fixture.open())}
async function denied(p){await p.evaluate(()=>fixture.startOpen());assert.equal((await pending(p)).ok,false)}
async function prepare(p,id){await opened(p);return p.evaluate(id=>fixture.prepare(id),id)}
const effectsUnchanged=(a,b)=>{for(const key of ['states','commands','attempts','history','bundles','lineage','contexts'])same(a[key],b[key])};
async function reset(api,c){const state=await api('state','{}',c);assert.equal(state.status,200);const result=await api('apply',JSON.stringify({contract:CONTRACT,action:'reset',operation_id:randomUUID(),incarnation_id:c.owner.incarnation_id,adoption_epoch:1,reset_generation:state.data.reset_generation,expected_owner_revision:state.data.owner_revision}),c);assert.equal(result.status,200);return result}
async function holdFinished(hold){const value=await hold.finished;assert.equal(value.settled,true);assert.equal(value.failed,false)}

export async function exercise({group,newPage,newContext,beforeImport,freshCase,register,command,api,arm,journal,accounts,rpcPayloads,mutate,close}){
 await group(0,async({c,context})=>{
  const p=await newPage(context,c);assert.equal(journal.length,0);await opened(p);
  const initial=await p.evaluate(()=>({owner:fixture.handles[0].binding(),view:fixture.handles[0].snapshot(),effects:fixture.effects.length})),initialDump=await dump(p);
  assert.equal(initial.view.revision,0);assert.equal(initial.effects,0);assert.equal(Object.values(initialDump).flat().length,0);
  for(const key of ['organization_id','account_id','incarnation_id','adoption_epoch'])assert.equal(initial.owner[key],c.owner[key]);
  assert.equal(initial.owner.revoked,false);assert.ok(accounts.filter(row=>row.path===me&&row.status===200).length>=2);assert.ok(journal.length>=1);assert.ok(journal.every(row=>row.path===path('state')&&row.raw==='{}'&&row.status===200));
  const start=await p.evaluate(()=>fixture.prepare('canonical-positive')),id=start.wire.intent.id,ack=await deliver(p,id);assert.equal(ack.acknowledged,true);assert.equal(ack.duplicate,false);
  const stored=await wire(p,id),sql=await command('operation',c,{operation_id:id});assert.ok(sql);assert.equal(stored.exact_raw,start.wire.intent.exact_raw);same(JSON.parse(stored.pending_intent.receipt),JSON.parse(sql.receipt_text));
  assert.equal(JSON.parse(sql.receipt_text).request_sha256,hash(sql.request_text));assert.ok(rpcPayloads.some(row=>row.operation_id===id&&row.payload_sha256===hash(stored.exact_raw)));
  const after=await dump(p);effectsUnchanged(start.before,after);assert.equal(after.records.length,0);assert.equal(await p.evaluate(()=>fixture.effects.length),start.effects);same(await p.evaluate(()=>fixture.handles[0].snapshot()),start.projection);
  const replay=await deliver(p,id);assert.equal(replay.acknowledged,true);assert.equal(replay.duplicate,true);same(await wire(p,id),stored);assert.equal((await command('snapshot',c)).learning_journal_operations.count,1);
  return {canonical_client:true,empty_raw_state:true,no_automatic_command:true,initial_revision:0,initial_rows:0,composite_matches_sql:true,sql_receipt_equal:true,raw_forwarding_equal:true,exact_replay:true,delivery_effects_unchanged:true,operations:1};
 });
 await group(1,async({c,context})=>{
  const p=await newPage(context);await denied(p);same(await p.evaluate(()=>fixture.databases()),[]);
  const teacher=await freshCase('teacher');await p.evaluate(value=>fixture.setSession(value),teacher.session);await denied(p);same(await p.evaluate(()=>fixture.databases()),[]);
  const invalid=await p.evaluate(value=>{fixture.clearSession();let rejected=false;try{fixture.setSession({...value,expires_at:'2000-01-01T00:00:00.000Z'})}catch{rejected=true}return rejected},c.session);assert.equal(invalid,true);await denied(p);same(await p.evaluate(()=>fixture.databases()),[]);assert.equal(journal.length,0);
  return {subcases:3,journal_requests:0,journal_databases:0,no_adoption:true};
 });
 await group(2,async({context})=>{
  const missing=await freshCase('student',true),before=await command('snapshot',missing);assert.equal(before.learning_journal_owners.count,0);
  const p=await newPage(context,missing);await denied(p);same(await p.evaluate(()=>fixture.databases()),[]);same(await command('snapshot',missing),before);await p.close();
  for(const field of ['id','organization_id']){
   const c=await freshCase(),token=await command('new_session',c);c.token=token;c.session=register(c,{[field]:randomUUID()});
   const q=await newPage(context,c);await denied(q);same(await q.evaluate(()=>fixture.databases()),[]);assert.ok(journal.some(row=>row.token==='Bearer '+token&&row.path===path('state')&&row.status===200));await q.close();
  }
  assert.equal(journal.filter(row=>row.path===path('apply')).length,0);
  return {missing_owner_is_real_sql:true,missing_owner_rows_before:0,missing_owner_rows_after:0,foreign_profile_subcases:2,journal_databases:0,apply_requests:0};
 });
 await group(3,async({c})=>{
  for(const route of [me,config]){
   const context=await newContext(),hold=arm(route),p=await newPage(context,c);await p.evaluate(()=>fixture.startOpen());await hold.entered;await p.evaluate(()=>fixture.startShared());await p.evaluate(()=>fixture.controllers[0].dispose());assert.equal((await pending(p)).ok,false);
   let abortObserved=false;hold.aborted.then(()=>abortObserved=true);assert.equal(abortObserved,false);hold.release();assert.equal((await p.evaluate(()=>fixture.shared)).ok,true);await holdFinished(hold);assert.equal(abortObserved,false);same(await p.evaluate(()=>fixture.databases()),[]);await close(context);
  }
  const context=await newContext(),hold=arm(me),p=await newPage(context,c),next=await freshCase();await p.evaluate(()=>fixture.startOpen());await hold.entered;await p.evaluate(()=>fixture.startShared());await p.evaluate(value=>fixture.setSession(value),next.session);assert.equal((await pending(p)).ok,false);hold.release();assert.equal((await p.evaluate(()=>fixture.shared)).ok,false);await holdFinished(hold);same(await p.evaluate(()=>fixture.databases()),[]);assert.equal(journal.length,0);
  return {shared_me_survives_disposal:true,shared_config_survives_disposal:true,old_session_waiter_rejected:true,late_bridge_progress_refused:true,journal_requests:0,journal_databases:0};
 });
 await group(4,async({c,context})=>{
  const p=await newPage(context,c);await opened(p);await p.evaluate(()=>fixture.handles[0].saveSettings({dailyGoal:17}));const before=await dump(p);
  const next={...c,token:await command('new_session',c)};next.session=register(next);await p.evaluate(value=>fixture.setSession(value),next.session);
  same(await p.evaluate(()=>{try{fixture.handles[0].snapshot();return {denied:false}}catch{return {denied:true,aborted:fixture.handles[0].signal.aborted}}}),{denied:true,aborted:true});same(await dump(p),before);
  await opened(p);const other=await freshCase();await p.evaluate(value=>fixture.setSession(value),other.session);await p.evaluate(value=>fixture.setSession(value),next.session);assert.equal(await p.evaluate(()=>fixture.handles[1].signal.aborted),true);same(await dump(p),before);
  await opened(p);const q=await newPage(context);await q.evaluate(value=>fixture.setSession(value),other.session);await p.waitForFunction(()=>fixture.handles[2].signal.aborted,undefined,{timeout:3000});same(await dump(p),before);await close(context);
  const lateContext=await newContext(),late=await newPage(lateContext,c),hold=arm(path('state'),c);await late.evaluate(()=>fixture.startOpen());await hold.entered;await late.evaluate(value=>fixture.setSession(value),other.session);assert.equal((await pending(late)).ok,false);await hold.aborted;await holdFinished(hold);same(await late.evaluate(()=>fixture.databases()),[]);
  return {same_account_new_login_fenced:true,a_b_a_fenced:true,cross_page_storage_fenced:true,late_state_body_aborted:true,late_state_store_unopened:true,prior_store_bytes_preserved:true};
 });
 await group(5,async({c})=>{
  for(const action of ['dispose','clear']){
   const actor=action==='dispose'?c:await freshCase(),context=await newContext(),p=await newPage(context,actor),start=await prepare(p,'body-'+action),id=start.wire.intent.id,hold=arm(path('apply'),actor);
   await p.evaluate(id=>fixture.startDeliver(id),id);await hold.entered;const sql=await command('operation',actor,{operation_id:id});assert.ok(sql);assert.equal(JSON.parse(sql.receipt_text).request_sha256,hash(sql.request_text));
   await p.evaluate(action=>action==='dispose'?fixture.controllers[0].dispose():fixture.clearSession(),action);const result=await pending(p);assert.ok(!result.ok||result.value.acknowledged===false);await hold.aborted;await holdFinished(hold);same(await dump(p),start.before);
   await p.evaluate(value=>fixture.setSession(value),actor.session);const index=await opened(p);assert.equal((await wire(p,id)).exact_raw,start.wire.intent.exact_raw);assert.equal((await deliver(p,id,index)).acknowledged,true);assert.equal((await command('snapshot',actor)).learning_journal_operations.count,1);effectsUnchanged(start.before,await dump(p));await close(context);
  }
  return {subcases:2,sql_commit_proved:true,prefix_written:true,request_abort_observed:true,late_ack_refused:true,unchanged_stores:11,exact_retry:true,one_operation_each:true,hold_cleanup_complete:true};
 });
 await group(6,async({c,context})=>{
  const p=await newPage(context,c),index=await p.evaluate(()=>fixture.direct()),hold=arm(path('state'),c),began=performance.now();await p.evaluate(index=>fixture.startDirectBody(index),index);await hold.entered;
  const result=await pending(p),elapsed=performance.now()-began;assert.deepEqual(result,{ok:false,caller_aborted:false,headers_received:true});assert.ok(elapsed>=9000&&elapsed<12000);await hold.aborted;await holdFinished(hold);same(await p.evaluate(()=>fixture.databases()),[]);
  return {direct_port:true,caller_signal_aborted:false,bridge_deadline_observed:true,native_body_rejected:true,server_abort_observed:true,t3_deadline_attribution:false,hold_cleanup_complete:true};
 });
 await group(7,async()=>{
  for(const action of ['revoke','expire','demote']){
   const c=await freshCase(),context=await newContext(),p=await newPage(context,c),start=await prepare(p,'sql-'+action);await command(action,c);const before=await command('snapshot',c);
   assert.equal(await p.evaluate(async()=>{const account=await ECHSInstitution.me(true);return account.role==='student'&&account.status==='active'}),true);
   const result=await deliver(p,start.wire.intent.id);assert.equal(result.acknowledged,false);assert.ok(journal.some(row=>row.path===path('apply')&&row.token==='Bearer '+c.token&&[401,403].includes(row.status)));same(await dump(p),start.before);same(await command('snapshot',c),before);await close(context);
  }
  return {subcases:3,synthetic_me_intentionally_stale:true,canonical_profile_valid:true,journal_denied:true,unchanged_stores:11,sql_unchanged_after_denial:true,pending_preserved:true};
 });
 await group(8,async({c,context})=>{
  const p=await newPage(context,c),start=await prepare(p,'generation'),id=start.wire.intent.id;assert.equal((await deliver(p,id)).acknowledged,true);const first=await wire(p,id),owner=await p.evaluate(()=>fixture.handles[0].binding());
  await p.evaluate(()=>fixture.handles[0].recordAttempt({question:fixture.question('generation-next'),correct:false}));await reset(api,c);const current=await api('state','{}',c);assert.equal(current.data.reset_generation,1);
  same(await p.evaluate(()=>fixture.handles[0].binding()),owner);const replay=await deliver(p,id);assert.equal(replay.acknowledged,true);assert.equal(replay.duplicate,true);assert.equal(replay.generation_blocked,true);same(await wire(p,id),first);assert.equal((await p.evaluate(()=>fixture.handles[0].materializeNext())).reason,'generation_changed');
  return {authority_identity_unchanged:true,new_generation_context_only:true,first_raw_reply_unchanged:true,receipt_unchanged:true,old_context_materialization_blocked:true};
 });
 await group(9,async({c,context})=>{
  const p=await newPage(context,c),start=await prepare(p,'mutated-incarnation'),id=start.wire.intent.id;let original;
  mutate((reply,row)=>{assert.equal(row.path,path('apply'));assert.equal(reply.status,200);original=row.replyRaw;const value=JSON.parse(original);value.receipt.incarnation_id=randomUUID();return new Response(JSON.stringify(value),{status:reply.status,headers:reply.headers})});
  assert.equal((await deliver(p,id)).acknowledged,false);assert.equal(typeof original,'string');same(await dump(p),start.before);const sql=await command('operation',c,{operation_id:id});same(JSON.parse(original).receipt,JSON.parse(sql.receipt_text));assert.equal((await wire(p,id)).exact_raw,start.wire.intent.exact_raw);assert.equal((await deliver(p,id)).acknowledged,true);
  return {wire_mutation_only:true,actual_sql_incarnation_transition:false,original_sql_reply_retained_privately:true,acknowledged:false,unchanged_stores:11,exact_retry:true};
 });
 await group(10,async({c,context})=>{
  const probe=async page=>{
   const value=await page.evaluate(async accountId=>{const key='echs_institution_pending_sync_v1:'+accountId,raw=JSON.stringify({accountId,payload:{attempts:[{id:'synthetic-held'}],sessions:[],mastery:[],review:[],lessons:[]}});localStorage.setItem(key,raw);const native=setTimeout;let scheduled=0;window.setTimeout=function(fn,ms,...args){if(ms===1200)scheduled++;return Reflect.apply(native,window,[fn,ms,...args])};let values;
    try{values=[ECHSInstitution.learningPayload(),await ECHSInstitution.syncLearning(),await ECHSInstitution.flushPending()];window.dispatchEvent(new Event('online'));document.dispatchEvent(new CustomEvent('echs:learning-updated'));for(const name of ['echs:learning-attempt','echs:learning-session','echs:lesson-completed'])window.dispatchEvent(new CustomEvent(name))}finally{window.setTimeout=native}
    return {values,scheduled,queue_equal:localStorage.getItem(key)===raw,marker:document.documentElement.dataset.ownedLearning};
   },c.owner.account_id);
   same(value.values,Array.from({length:3},()=>({status:'held',reason:'versioned_sync_required',uploaded:0,acknowledged:0})));assert.equal(value.scheduled,0);assert.equal(value.queue_equal,true);assert.equal(value.marker,'p2-practice');
  };
  await beforeImport(context,c,probe);
  const pendingContext=await newContext(),hold=arm(me),p=await newPage(pendingContext,c);await p.evaluate(()=>fixture.startOpen());await hold.entered;await probe(p);await p.evaluate(()=>fixture.controllers[0].dispose());hold.release();await pending(p);await holdFinished(hold);await close(pendingContext);
  const missing=await freshCase('student',true),failureContext=await newContext(),bad=await newPage(failureContext,missing);await denied(bad);await probe(bad);await close(failureContext);
  const readyContext=await newContext(),ready=await newPage(readyContext,c);await opened(ready);await probe(ready);await close(readyContext);
  return {guarded_paths:5,stages:4,online_and_learning_events:true,legacy_queue_preserved:true,legacy_request_attempts:0,early_html_marker:true,client_before_classic:true};
 });
 await group(11,async({c,context})=>{
  const p=await newPage(context,c);await p.evaluate(()=>fixture.holdNextNativeOpen());await p.evaluate(()=>fixture.startOpen());const entered=await p.evaluate(()=>fixture.openHold.entered);assert.equal(entered.upgrade_held,true);assert.equal(entered.request_success,true);assert.equal(entered.deadline,false);
  await p.evaluate(()=>{fixture.controllers[0].dispose();fixture.openHold.release()});assert.equal((await pending(p)).ok,false);const ended=await p.evaluate(()=>fixture.openHold.finished);assert.equal(ended.late_open_success,true);assert.equal(ended.deadline,false);assert.equal(await p.evaluate(()=>fixture.deleteFreshDatabase()),true);await close(context);
  const positiveContext=await newContext(),positive=await newPage(positiveContext,c);await positive.evaluate(()=>fixture.holdNextNativeOpen());await positive.evaluate(()=>fixture.startOpen());await positive.evaluate(()=>fixture.openHold.entered);await positive.evaluate(()=>fixture.openHold.release());assert.equal((await pending(positive)).ok,true);assert.equal((await positive.evaluate(()=>fixture.openHold.finished)).late_open_success,true);await positive.evaluate(()=>fixture.disposeAll());assert.equal(await positive.evaluate(()=>fixture.deleteFreshDatabase()),true);await close(positiveContext);
  const channelContext=await newContext(),channelPage=await newPage(channelContext,c);await opened(channelPage);await channelPage.evaluate(()=>fixture.handles[0].saveSettings({dailyGoal:19}));const before=await dump(channelPage),requests=journal.length,owner=await channelPage.evaluate(()=>fixture.handles[0].binding());assert.equal(await channelPage.evaluate(()=>fixture.foreignNotification()),true);same(await dump(channelPage),before);same(await channelPage.evaluate(()=>fixture.handles[0].binding()),owner);assert.equal(journal.length,requests);
  return {dispose_during_native_open:true,late_handle_refused:true,foreign_incarnation_ignored:true,channel_is_not_authority:true,store_bytes_preserved:true,no_adoption:true};
 });
}
