import assert from 'node:assert/strict';
import {writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createPracticeActions} from './source/question-bank/js/practice-actions.mjs';
const defer=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return{promise,resolve,reject}};
const error=code=>Object.assign(new Error(code),{code});
function fixture(options={}){
 const abort=new AbortController(),events=[],writes=[],lookups=[],cache=new Map();let id=0,current=true;
 const learning={signal:abort.signal,refresh:options.refresh||async function(){},snapshot:options.snapshot||(()=>({revision:1})),prepare(method,args){return Object.freeze({operation_id:'operation-'+(++id),method,args:structuredClone(args)})},async commit(intent){writes.push(intent);const result={operation_id:intent.operation_id,durability:'committed',revision:1,duplicate:false,result:{action:intent.args[0].action},effects:[]};if(options.commit)return options.commit(intent,result,cache);cache.set(intent.operation_id,result);return result},async lookup(id){lookups.push(id);return options.lookup?options.lookup(id,cache):cache.get(id)||null}};
 const controller=createPracticeActions({learning,isCurrent:()=>current,onChange:s=>{events.push({type:'state',state:s});options.onChange?.(s,controller)},onCommit:r=>events.push({type:'commit',receipt:r})});
 return{controller,events,writes,lookups,cache,abort,switch(){current=false},learning};
}
const results=[];async function test(name,fn){try{await fn();results.push({name,status:'PASS'})}catch(e){results.push({name,status:'FAIL',error:String(e.stack||e)})}}
await test('No saved callback or second mutation before durable receipt; pending metadata excludes raw input',async()=>{
 const held=defer(),f=fixture({commit:()=>held.promise}),work=f.controller.act({action:'answer',privateResponse:'Synthetic raw answer'});await Promise.resolve();assert.equal(f.controller.snapshot().status,'saving');assert.equal(f.events.filter(x=>x.type==='commit').length,0);assert.ok(!JSON.stringify(f.controller.snapshot()).includes('Synthetic'));assert.throws(()=>f.controller.act({action:'finish'}),e=>e.code==='action_pending');held.resolve({operation_id:'operation-1',durability:'committed',revision:1,result:{action:'answer'}});await work;assert.equal(f.controller.snapshot().pending,null);assert.equal(f.events.filter(x=>x.type==='commit').length,1);
});
await test('Unknown local acknowledgement requires exact lookup and never duplicates a confirmed command',async()=>{
 const f=fixture({commit:(intent,r,cache)=>{cache.set(intent.operation_id,r);throw error('lost_ack')}});await assert.rejects(f.controller.act({action:'answer'}),e=>e.code==='lost_ack');assert.equal(f.controller.snapshot().pending.operationId,'operation-1');const result=await f.controller.retry();assert.equal(result.operation_id,'operation-1');assert.deepEqual(f.lookups,['operation-1']);assert.equal(f.writes.length,1);
});
await test('Definitely absent command uses the identical prepared intent only after explicit Retry',async()=>{
 let count=0;const f=fixture({commit:(_,r)=>{if(++count===1)throw error('storage_error');return r}});await assert.rejects(f.controller.act({action:'checkpoint'}));assert.equal(f.writes.length,1);await f.controller.retry();assert.equal(f.writes.length,2);assert.equal(f.writes[0],f.writes[1]);assert.deepEqual(f.lookups,['operation-1']);
});
await test('Failed reconciliation preserves the captured pending command and sends no new write',async()=>{
 const f=fixture({commit:()=>{throw error('lost_ack')},lookup:()=>{throw error('storage_unavailable')}});await assert.rejects(f.controller.act({action:'start'}));await assert.rejects(f.controller.retry(),e=>e.code==='storage_unavailable');assert.equal(f.writes.length,1);assert.equal(f.controller.snapshot().pending.action,'start');
});
await test('A state conflict retains intent without rebasing its expected revision',async()=>{
 const f=fixture({commit:()=>{throw error('state_conflict')}});await assert.rejects(f.controller.act({action:'finish'}));assert.equal(f.controller.snapshot().status,'conflict');await assert.rejects(f.controller.retry());assert.equal(f.writes[0],f.writes[1]);
});
await test('Disposal and owner change ignore late receipts and synchronously clear private pending references',async()=>{
 for(const mode of ['dispose','abort','switch']){const held=defer(),f=fixture({commit:()=>held.promise}),work=f.controller.act({action:'answer',response:'Private'});await Promise.resolve();if(mode==='dispose')f.controller.dispose();else if(mode==='abort')f.abort.abort();else f.switch();held.resolve({operation_id:'operation-1',durability:'committed',revision:1});await assert.rejects(work);assert.equal(f.controller.snapshot().status,'disposed');assert.equal(f.controller.snapshot().pending,null);assert.equal(f.events.filter(x=>x.type==='commit').length,0)}
});
await test('Reentrant UI state callback cannot replace an in-flight command or return an early receipt',async()=>{
 const held=defer();let reentrant=null;const f=fixture({commit:()=>held.promise,onChange:(state,c)=>{if(state.status==='saving')reentrant=c.retry()}});const first=f.controller.act({action:'answer'});assert.equal(first,reentrant);held.resolve({operation_id:'operation-1',durability:'committed',revision:1});await first;assert.equal(f.writes.length,1);assert.equal(f.lookups.length,0);
});
await test('Late lookup after disposal cannot re-deliver private receipt or issue a retry',async()=>{
 const held=defer(),f=fixture({commit:()=>{throw error('lost_ack')},lookup:()=>held.promise});await assert.rejects(f.controller.act({action:'answer'}));const retry=f.controller.retry();await Promise.resolve();f.controller.dispose();held.resolve({operation_id:'operation-1',result:{response:'Private'}});await assert.rejects(retry);assert.equal(f.writes.length,1);assert.equal(f.events.filter(x=>x.type==='commit').length,0);
});
await test('A confirmed commit remains known when the required fresh projection cannot be read',async()=>{
 let unavailable=true;const f=fixture({commit:(intent,r,cache)=>{cache.set(intent.operation_id,r);throw error('lost_ack')},refresh:async()=>{if(unavailable)throw error('storage_unavailable')}});
 await assert.rejects(f.controller.act({action:'answer'}));await assert.rejects(f.controller.retry(),e=>e.code==='storage_unavailable');
 assert.equal(f.controller.snapshot().pending.knownCommitted,true);assert.equal(f.controller.snapshot().lastOperation,'operation-1');assert.equal(f.events.filter(x=>x.type==='commit').length,0);assert.equal(f.writes.length,1);
 unavailable=false;await f.controller.retry();assert.equal(f.writes.length,1);assert.equal(f.events.filter(x=>x.type==='commit').length,1);
});
await test('A later same-owner revision prevents applying stale UI state after a recovered commit',async()=>{
 const f=fixture({commit:(intent,r,cache)=>{cache.set(intent.operation_id,r);throw error('lost_ack')},snapshot:()=>({revision:2})});
 await assert.rejects(f.controller.act({action:'answer'}));await assert.rejects(f.controller.retry(),e=>e.code==='committed_state_changed');
 assert.equal(f.controller.snapshot().status,'conflict');assert.equal(f.controller.snapshot().pending.knownCommitted,true);assert.equal(f.events.filter(x=>x.type==='commit').length,0);
 await assert.rejects(f.controller.retry(),e=>e.code==='committed_state_changed');assert.equal(f.writes.length,1);
});
await test('Direct committed receipt cannot apply stale UI state over a newer projection',async()=>{
 const f=fixture({snapshot:()=>({revision:2})});await assert.rejects(f.controller.act({action:'checkpoint'}),e=>e.code==='committed_state_changed');
 assert.equal(f.controller.snapshot().pending.knownCommitted,true);assert.equal(f.controller.snapshot().lastOperation,'operation-1');assert.equal(f.events.filter(x=>x.type==='commit').length,0);assert.equal(f.writes.length,1);
 await assert.rejects(f.controller.retry(),e=>e.code==='committed_state_changed');assert.equal(f.writes.length,1);
});
await test('Direct known commit survives a temporarily unavailable projection without a second write',async()=>{
 let unavailable=true;const f=fixture({snapshot:()=>{if(unavailable)throw error('projection_stale');return{revision:1}}});await assert.rejects(f.controller.act({action:'answer'}),e=>e.code==='projection_stale');
 assert.equal(f.controller.snapshot().pending.knownCommitted,true);assert.equal(f.events.filter(x=>x.type==='commit').length,0);unavailable=false;await f.controller.retry();assert.equal(f.writes.length,1);assert.equal(f.events.filter(x=>x.type==='commit').length,1);
});
const report={contract:'echs.c04.p2.practice-action-tests.v1',status:results.every(x=>x.status==='PASS')?'PASS':'FAIL',groups:results.length,results,source_sha256:createHash('sha256').update(readFileSync(new URL('source/question-bank/js/practice-actions.mjs',import.meta.url))).digest('hex'),limits:['Page action lifecycle with controlled dependencies; actual native commit is separately tested. No mapped DOM or production adoption claim.']};const flag=process.argv.indexOf('--report');if(flag>=0)writeFileSync(process.argv[flag+1],JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report,null,2));if(report.status!=='PASS')process.exitCode=1;
