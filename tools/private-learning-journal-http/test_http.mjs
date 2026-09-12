import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {createInterface} from 'node:readline';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {createJournalHandler} from './runtime/handler.mjs';
import {createPendingIntent,operationLookup,acknowledgeIntent} from './runtime/pending-intent.mjs';
import {CONTRACT} from './runtime/contract.mjs';
import {readWire} from './runtime/wire.mjs';
import {FIXTURE_ORIGIN,listen,postgrestPort} from './bridge.mjs';

const json=JSON.stringify,clone=x=>JSON.parse(json(x)),hash=x=>createHash('sha256').update(x).digest('hex');
const labels=[
 'S01 Native HTTP state returns the SQL-derived current owner',
 'S02 HTTP commit receipt matches independent committed SQL text and digest',
 'S03 Head reads preserve live missing and tombstone ordering',
 'S04 Concurrent identical HTTP applies retain one immutable operation',
 'S05 Concurrent stale CAS contenders have one winner and no partial state',
 'S06 Stale compound request rolls back attempt and mutable writes',
 'S07 Database failure after head insert rolls back all phases and permits exact retry',
 'S08 Dropped committed HTTP response retains intent until exact raw apply replay',
 'S09 Same UUID different opaque value cannot be acknowledged through lookup or replay',
 'S10 Opaque numeric precision and scale reach actual PostgreSQL without binary64 rewriting',
 'S11 Duplicate-key and invalid UTF-8 HTTP requests never reach PostgREST',
 'S12 Foreign binding and operation lookup cannot reveal another owner receipt',
 'S13 Teacher parent and administrator custom sessions cannot use student journal',
 'S14 Revoked replay and reads fail freshly; a new exact session can retry',
 'S15 Revocation committed during observed PostgreSQL owner wait prevents HTTP commit',
 'S16 Reset retains historical receipt while exact retry reports current generation',
 'S17 Gateway 207 after real commit never acknowledges pending intent',
 'S18 Partial response after real commit retains intent and supports exact retry',
 'S19 Anonymous and authenticated JWTs cannot directly execute service-only RPC',
 'S20 Actual SQL normalized row limit rejects an otherwise valid bounded HTTP envelope'
];
async function control(configPath,python){
 const child=spawn(python,[fileURLToPath(new URL('./controls.py',import.meta.url)),configPath],{stdio:['pipe','pipe','ignore']});
 let sequence=0,readyResolve,readyReject;const pending=new Map();
 let exited=false;const ended=new Promise(resolve=>child.once('exit',()=>{exited=true;resolve();}));
 const controlError=value=>{const error=new Error('control-rejected');if(/^[0-9A-Z]{5}$/.test(value?.sqlstate||''))error.sqlstate=value.sqlstate;return error;};
 const ready=new Promise((resolve,reject)=>{readyResolve=resolve;readyReject=reject;});
 const fail=()=>{readyReject(new Error('control-exit'));for(const p of pending.values()){clearTimeout(p.timer);p.reject(new Error('control-exit'));}pending.clear();};
 child.once('error',fail);child.once('exit',fail);
 const lines=createInterface({input:child.stdout});lines.on('line',line=>{
  if(Buffer.byteLength(line)>2*1024*1024){fail();child.kill();return;}
  let value;try{value=JSON.parse(line);}catch{fail();child.kill();return;}
  if(Object.hasOwn(value,'ready')){value.ready?readyResolve():readyReject(controlError(value));return;}
  const task=pending.get(value.id);if(!task)return;pending.delete(value.id);clearTimeout(task.timer);value.error?task.reject(controlError(value.error)):task.resolve(value.data);
 });
 const timer=setTimeout(()=>{readyReject(new Error('control-start-timeout'));child.kill();},8000);try{await ready;}catch(error){child.kill('SIGKILL');let limit;try{await Promise.race([ended,new Promise((_,reject)=>{limit=setTimeout(()=>reject(new Error('control-not-reaped')),2000);})]);}finally{clearTimeout(limit);lines.close();}throw error;}finally{clearTimeout(timer);}
 return {call:(action,value={})=>new Promise((resolve,reject)=>{const id=++sequence;const timer=setTimeout(()=>{pending.delete(id);reject(new Error('control-timeout'));},8000);pending.set(id,{resolve,reject,timer});child.stdin.write(json({id,action,...value})+'\n');}),close:async()=>{
  child.stdin.end();let timer;try{await Promise.race([ended,new Promise(resolve=>{timer=setTimeout(resolve,2000);})]);}finally{clearTimeout(timer);}
  if(!exited){child.kill('SIGKILL');let limit;try{await Promise.race([ended,new Promise((_,reject)=>{limit=setTimeout(()=>reject(new Error('control-not-reaped')),2000);})]);}finally{clearTimeout(limit);}}
  lines.close();
 }};
}

export function diagnostic(error){
 const result={type:error?.constructor?.name||'Error'};
 if(/^[0-9A-Z]{5}$/.test(error?.sqlstate||''))result.sqlstate=error.sqlstate;
 const code=error?.code||error?.cause?.code;if(['ERR_ASSERTION','ECONNRESET','ECONNREFUSED','EPIPE','ETIMEDOUT','UND_ERR_SOCKET','UND_ERR_CONNECT_TIMEOUT'].includes(code))result.code=code;
 if(['strictEqual','deepStrictEqual','match','notStrictEqual','=='].includes(error?.operator))result.operator=error.operator;
 for(const key of ['actual','expected']){
  const value=error?.[key];if(typeof value==='number'&&Number.isFinite(value))result[key]=value;
  else if(Array.isArray(value)&&value.length<=8&&value.every(x=>typeof x==='number'&&Number.isFinite(x)))result[key]=value.slice();
 }
 const location=/test_http\.mjs:(\d+):(\d+)/.exec(error?.stack||'');if(location)result.location={line:Number(location[1]),column:Number(location[2])};return result;
}

const handlerCodes=new Set(['session-unavailable','actor-unavailable','owner-unavailable','invalid-request','journal-conflict','journal-limit','journal-deadline','journal-busy','journal-unavailable','upstream-rejected','invalid-upstream','content-type','content-encoding','content-length','deadline','cancelled']);
export function recordHttpObservation(rows,route,status,data){
 if(!['state','apply','operation','heads'].includes(route)||!Number.isInteger(status)||status<100||status>599)return;
 const code=data?.error?.code;rows.push({route,status,code:handlerCodes.has(code)?code:null});if(rows.length>12)rows.shift();
}

async function runtimeSnapshot(){const names=['runtime/wire.mjs','runtime/contract.mjs','runtime/handler.mjs','runtime/pending-intent.mjs','bridge.mjs','controls.py','fixture.py','test_http.mjs'];return Promise.all(names.map(async path=>{const raw=await readFile(new URL(path,import.meta.url));return {path,bytes:raw.length,sha256:hash(raw)};}));}

async function main(){
 const [configPath,python,output]=process.argv.slice(2);const config=JSON.parse(await readFile(configPath,'utf8'));
 assert.equal(config.contract,'echs.c04.journal-http-private-run.v1');assert.equal(process.platform,'linux');assert.equal(process.env.GITHUB_ACTIONS,'true');assert.equal(process.env.RUNNER_ENVIRONMENT,'github-hosted');
 const sourceBefore=await runtimeSnapshot();assert.equal(hash(await readFile(new URL('./source-manifest.json',import.meta.url))),config.source_manifest_sha256);
 const observations=[],nativeObservations=[],outcomes=[];let fault=null,server,ctl;
 const report={contract:'echs.c04.journal-http-actual.v1',status:'RUNNING; NOT ACCEPTED',planned_groups:labels,checks:outcomes,real_http_executed:false,postgrest_executed:false,database_executed:false,hosted_edge_executed:false,tls_executed:false,browser_persistence_executed:false,production_calls:0};
 const fresh=(role='student')=>ctl.call('new',{role});
 const command=(action,c,extra={})=>ctl.call(action,{case:c.case,...extra});
 const body=(c,records=[{kind:'review',record_id:'Q1',local_revision:1,action:'put',expected_revision:0,value:{question_id:'Q1',score:.5}}])=>({contract:CONTRACT,action:'commit',operation_id:randomUUID(),incarnation_id:c.owner.incarnation_id,adoption_epoch:1,reset_generation:0,records});
 const snapshot=c=>command('snapshot',c);
 const stored=(c,b)=>command('operation',c,{operation_id:b.operation_id});
 const acknowledge=(intent,r,c,route='apply',requestRaw=intent.raw)=>acknowledgeIntent(intent,{route,requestRaw,status:r.status,replyRaw:r.raw,activeOwner:c.owner});
 async function call(route,raw,c){report.http_attempted=true;const response=await fetch(server.origin+'/functions/v1/learning-journal/'+route,{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+c.token},body:raw,signal:AbortSignal.timeout(12000),redirect:'error'});report.real_http_executed=true;const text=await readWire(response.body,{timeoutMs:12000});const data=JSON.parse(text);recordHttpObservation(nativeObservations,route,response.status,data);return {status:response.status,raw:text,data};}
 async function mark(index,fn){await fn();outcomes.push(labels[index]);}
 try{
  ctl=await control(configPath,python);report.database_executed=true;
  const port=postgrestPort('http://'+config.rest_ip+':3000',{observe:x=>{observations.push(x);report.postgrest_executed=true;}});
  const handler=createJournalHandler({supabaseUrl:FIXTURE_ORIGIN,serviceKey:config.service_key,allowedOrigins:['https://2ed944-cloud.github.io'],fetchImpl:port});
  server=await listen(handler,{afterResponse:async(req,res)=>{if(fault&&req.url.endsWith('/apply')&&res.status===200){const value=fault;fault=null;return value;}return null;}});
  await mark(0,async()=>{const c=await fresh(),r=await call('state','{}',c);assert.equal(r.status,200);for(const [key,value] of Object.entries(c.owner))assert.equal(r.data[key],value);assert.equal(r.data.grading_authoritative,false);assert.equal(r.data.owner_revision,0);});
  await mark(1,async()=>{const c=await fresh(),b=body(c),raw=json(b),intent=createPendingIntent(raw,c.owner),r=await call('apply',raw,c);assert.equal(r.status,200);const op=await stored(c,b);assert.ok(op);assert.deepEqual(JSON.parse(op.receipt_text),r.data.receipt);assert.equal(hash(op.request_text),r.data.receipt.request_sha256);assert.equal(acknowledge(intent,r,c).acknowledged,true);assert.equal((await snapshot(c)).learning_journal_operations.count,1);});
  await mark(2,async()=>{const c=await fresh(),b=body(c);assert.equal((await call('apply',json(b),c)).status,200);const payload={contract:CONTRACT,incarnation_id:c.owner.incarnation_id,adoption_epoch:1,reset_generation:0,keys:[{kind:'review',record_id:'Q1'},{kind:'review',record_id:'missing'}]};const first=await call('heads',json(payload),c);assert.equal(first.status,200);assert.equal(first.data.records[0].value.question_id,'Q1');assert.equal(first.data.records[1].revision,0);const del=body(c,[{kind:'review',record_id:'Q1',local_revision:2,action:'delete',expected_revision:1}]);assert.equal((await call('apply',json(del),c)).status,200);const last=await call('heads',json(payload),c);assert.equal(last.data.records[0].revision,2);assert.equal(last.data.records[0].deleted,true);assert.equal(last.data.records[0].value,null);});
  await mark(3,async()=>{const c=await fresh(),raw=json(body(c));const results=await Promise.all([call('apply',raw,c),call('apply',raw,c)]);assert.deepEqual(results.map(x=>x.status),[200,200]);assert.deepEqual(results.map(x=>x.data.replayed).sort(),[false,true]);assert.deepEqual(results[0].data.receipt,results[1].data.receipt);assert.equal((await snapshot(c)).learning_journal_operations.count,1);});
  await mark(4,async()=>{const c=await fresh();const results=await Promise.all([call('apply',json(body(c)),c),call('apply',json(body(c)),c)]);assert.deepEqual(results.map(x=>x.status).sort(),[200,409]);const state=await snapshot(c);assert.equal(state.learning_journal_operations.count,1);assert.equal(state.learning_journal_versions.count,1);});
  await mark(5,async()=>{const c=await fresh(),before=await snapshot(c),b=body(c,[{kind:'attempts',record_id:'E1',local_revision:1,action:'append',value:{event_id:'E1'}},{kind:'review',record_id:'Q1',local_revision:1,action:'put',expected_revision:99,value:{question_id:'Q1'}}]);assert.equal((await call('apply',json(b),c)).status,409);assert.deepEqual(await snapshot(c),before);assert.equal(await stored(c,b),null);});
  await mark(6,async()=>{const c=await fresh(),b=body(c),before=await snapshot(c);await command('fault',c);try{assert.equal((await call('apply',json(b),c)).status,409);assert.deepEqual(await snapshot(c),before);}finally{await command('unfault',c);}assert.equal((await call('apply',json(b),c)).status,200);});
  await mark(7,async()=>{const c=await fresh(),b=body(c),intent=createPendingIntent(json(b),c.owner);fault='drop';await assert.rejects(()=>call('apply',intent.raw,c));assert.ok(await stored(c,b));const lookupRaw=operationLookup(intent),lookup=await call('operation',lookupRaw,c);assert.equal(lookup.data.found,true);assert.equal(acknowledge(intent,lookup,c,'operation',lookupRaw).acknowledged,false);const replay=await call('apply',intent.raw,c);assert.equal(replay.data.replayed,true);assert.equal(acknowledge(intent,replay,c).acknowledged,true);assert.equal((await snapshot(c)).learning_journal_operations.count,1);});
  await mark(8,async()=>{const c=await fresh(),a=body(c);assert.equal((await call('apply',json(a),c)).status,200);const b=clone(a);b.records[0].value.score=.75;const intent=createPendingIntent(json(b),c.owner),before=await snapshot(c),lookupRaw=operationLookup(intent),lookup=await call('operation',lookupRaw,c);assert.equal(lookup.data.found,true);assert.equal(acknowledge(intent,lookup,c,'operation',lookupRaw).acknowledged,false);const conflict=await call('apply',intent.raw,c);assert.equal(conflict.status,409);assert.equal(acknowledge(intent,conflict,c).acknowledged,false);assert.deepEqual(await snapshot(c),before);});
  await mark(9,async()=>{const c=await fresh(),b=body(c),raw=json(b).replace('"score":0.5','"score":1.2345678901234567890123456789,"scale":1.00,"huge":1e1000');const r=await call('apply',raw,c);assert.equal(r.status,200);const op=await stored(c,b);assert.ok(op.request_text.includes('1.2345678901234567890123456789'));assert.match(op.request_text,/"scale": 1\.00/);assert.equal(hash(op.request_text),r.data.receipt.request_sha256);const heads={contract:CONTRACT,incarnation_id:c.owner.incarnation_id,adoption_epoch:1,reset_generation:0,keys:[{kind:'review',record_id:'Q1'}]};const reply=await call('heads',json(heads),c);assert.equal(reply.status,200);assert.ok(reply.raw.includes('1.2345678901234567890123456789'));assert.match(reply.raw,/"scale":\s*1\.00/);});
  await mark(10,async()=>{const c=await fresh(),before=await snapshot(c),count=observations.length;for(const raw of ['{"x":1,"\\u0078":2}',new Uint8Array([0xff])])assert.equal((await call('apply',raw,c)).status,400);assert.equal(observations.length,count);assert.deepEqual(await snapshot(c),before);});
  await mark(11,async()=>{const a=await fresh(),b=await fresh(),intent=body(a);assert.equal((await call('apply',json(intent),a)).status,200);assert.equal((await call('apply',json(intent),b)).status,409);const lookup={contract:CONTRACT,incarnation_id:b.owner.incarnation_id,adoption_epoch:1,operation_id:intent.operation_id};const r=await call('operation',json(lookup),b);assert.equal(r.status,200);assert.equal(r.data.found,false);assert.equal(r.data.receipt,null);});
  await mark(12,async()=>{for(const role of ['teacher','parent','admin']){const c=await fresh(role),before=await snapshot(c);assert.equal((await call('apply',json(body(c)),c)).status,403);assert.deepEqual(await snapshot(c),before);}});
  await mark(13,async()=>{const c=await fresh(),b=body(c),raw=json(b);assert.equal((await call('apply',raw,c)).status,200);await command('revoke',c);assert.equal((await call('apply',raw,c)).status,401);assert.equal((await call('state','{}',c)).status,401);c.token=await command('new_session',c);const r=await call('apply',raw,c);assert.equal(r.status,200);assert.equal(r.data.replayed,true);assert.equal((await snapshot(c)).learning_journal_operations.count,1);});
  await mark(14,async()=>{const c=await fresh(),b=body(c),before=await snapshot(c);await command('lock',c);let waiting;try{waiting=call('apply',json(b),c);waiting.catch(()=>{});assert.equal(await command('wait',c),true);await command('revoke',c);}finally{await command('unlock',c);}assert.equal((await waiting).status,401);assert.deepEqual(await snapshot(c),before);});
  await mark(15,async()=>{const c=await fresh(),b=body(c),r=await call('apply',json(b),c);assert.equal(r.status,200);const reset={contract:CONTRACT,action:'reset',operation_id:randomUUID(),incarnation_id:c.owner.incarnation_id,adoption_epoch:1,reset_generation:0,expected_owner_revision:1};assert.equal((await call('apply',json(reset),c)).status,200);const replay=await call('apply',json(b),c);assert.equal(replay.status,200);assert.equal(replay.data.replayed,true);assert.deepEqual(replay.data.receipt,r.data.receipt);assert.equal(replay.data.current.reset_generation,1);assert.equal((await snapshot(c)).learning_journal_operations.count,2);});
  for(const [index,mode] of [[16,'207'],[17,'partial']])await mark(index,async()=>{const c=await fresh(),b=body(c),intent=createPendingIntent(json(b),c.owner);fault=mode;if(mode==='207'){const r=await call('apply',intent.raw,c);assert.equal(r.status,207);assert.equal(acknowledge(intent,r,c).acknowledged,false);}else await assert.rejects(()=>call('apply',intent.raw,c));assert.ok(await stored(c,b));const replay=await call('apply',intent.raw,c);assert.equal(replay.status,200);assert.equal(replay.data.replayed,true);assert.equal(acknowledge(intent,replay,c).acknowledged,true);assert.equal((await snapshot(c)).learning_journal_operations.count,1);});
  await mark(18,async()=>{const c=await fresh(),before=await snapshot(c),payload={p_token_hash:hash(c.token),p_payload:body(c)};for(const key of [config.anon_key,config.authenticated_key]){const r=await fetch('http://'+config.rest_ip+':3000/rpc/learning_journal_apply',{method:'POST',headers:{authorization:'Bearer '+key,'content-type':'application/json'},body:json(payload),redirect:'error',signal:AbortSignal.timeout(8000)});assert.ok([401,403].includes(r.status));await r.body.cancel();}assert.deepEqual(await snapshot(c),before);});
  await mark(19,async()=>{const c=await fresh(),b=body(c),before=await snapshot(c);b.records[0].value.oversize='x'.repeat(65537);assert.equal((await call('apply',json(b),c)).status,413);assert.deepEqual(await snapshot(c),before);});
  assert.deepEqual(outcomes,labels);assert.deepEqual(await runtimeSnapshot(),sourceBefore);Object.assign(report,{status:'ACTUAL HTTP POSTGREST SQL PASS',real_http_executed:true,postgrest_executed:true,database_executed:true,http_metrics:server.metrics,rpc_observations:observations,source_files:sourceBefore});
 }catch(error){report.status='FAIL; NO ACCEPTANCE';report.failure=diagnostic(error);report.failed_group=labels[outcomes.length]||'setup';report.rpc_observations=observations.slice(-12);report.http_observations=nativeObservations;}
 finally{
  try{if(server)await server.close();if(ctl)await ctl.close();report.control_reaped=true;}catch(error){report.status='FAIL; NO ACCEPTANCE';report.control_reaped=false;report.cleanup_failure=diagnostic(error);}
  try{assert.deepEqual(await runtimeSnapshot(),sourceBefore);}catch(error){report.status='FAIL; NO ACCEPTANCE';report.source_changed=true;}
  await writeFile(output,json(report)+'\n',{flag:'wx'});
 }
 process.stdout.write(json({status:report.status,passed:outcomes.length,planned:labels.length})+'\n');if(report.status!=='ACTUAL HTTP POSTGREST SQL PASS')process.exitCode=1;
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]))main().catch(()=>{process.stdout.write('{"status":"FAIL BEFORE REPORT; NO ACCEPTANCE"}\n');process.exitCode=1;});
