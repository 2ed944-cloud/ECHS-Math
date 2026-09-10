// Actual reviewed route/transport + actual PostgreSQL RPCs. Storage HTTP is injected.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
import {spawn} from 'node:child_process';
import readline from 'node:readline';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
const here=fileURLToPath(new URL('./',import.meta.url)),repo=path.resolve(here,'../..'),transport=here;
const hash=raw=>createHash('sha256').update(raw).digest('hex');
const out=process.env.ECHS_TRANSPORT_INTEGRATION_REPORT;
assert.ok(out&&process.env.ECHS_BANK_TEST_DSN&&process.env.ECHS_TRANSPORT_DATABASE_REPORT,'Explicit local integration inputs required');
const report={contract:'echs.c08.transport-real-sql.v1',status:'RUNNING; NOT PASS',checks:[],observations:[],production_calls:0,
 database_executed:false,real_storage_executed:false,real_postgrest_executed:false,hosted_edge_executed:false,external_network_calls:0};
function save(){mkdirSync(path.dirname(out),{recursive:true});writeFileSync(out,JSON.stringify(report,null,2)+'\n');}
const pins=JSON.parse(readFileSync(path.join(here,'source-pins.json'),'utf8'));
for(const row of pins.files){const bytes=readFileSync(path.join(row.root==='repo'?repo:transport,row.path));assert.equal(bytes.length,row.bytes);assert.equal(hash(bytes),row.sha256);}
assert.equal(pins.files.length,37);
assert.deepEqual(Object.fromEntries(pins.files.filter(row=>row.root==='transport').map(row=>[row.path,row.sha256])),{
 'transport.mjs':'11425bcd086ddb2f88c788969ef82e1f2af8a7803d8b8110baabf785bb3152d3',
 'handler.mjs':'ff49fd68970612cd325dec9819707a91a431eb1799cf6c4d88d1fea675f4cf0e'});
report.input_pins_sha256=hash(readFileSync(path.join(here,'source-pins.json')));
report.candidate_source_sha256=Object.fromEntries(['contract.py','rpc-fixture.py','test-http-sql.mjs'].map(f=>[f,hash(readFileSync(path.join(here,f)))]));
const {createSnapshotTransportHandler}=await import(pathToFileURL(path.join(transport,'handler.mjs')));
const {createSnapshotRpcTransport,createSnapshotStorageTransport}=await import(pathToFileURL(path.join(transport,'transport.mjs')));
globalThis.fetch=()=>{throw new Error('Unexpected external network request');};
let child,nextId=0;const waiting=new Map();let resolveReady,rejectReady;
const ready=new Promise((resolve,reject)=>{resolveReady=resolve;rejectReady=reject;});
function request(value){const id=++nextId;return new Promise((resolve,reject)=>{
 const timer=setTimeout(()=>{waiting.delete(id);reject(new Error('Closed SQL fixture timeout'));},12000);
 waiting.set(id,{resolve,reject,timer});child.stdin.write(JSON.stringify({id,...value})+'\n');
});}
async function control(name,fields={}){const r=await request({control:name,...fields});assert.equal(r.error,null,'Closed fixture control failed');return r.data;}
const ORIGIN='https://transportfixture.supabase.co',SITE='https://staff-fixture.example',KEY='synthetic-service-fixture-key-transport-only',ENDPOINT=ORIGIN+'/functions/v1/private-bank-snapshot-transport';
function response(url,status,value,headers={'content-type':'application/json'}){
 const result=new Response(value instanceof Uint8Array?value:JSON.stringify(value),{status,headers});Object.defineProperty(result,'url',{value:url});return result;
}
async function fresh(mode='staging'){
 const c=await control('new_case',{mode});const objects=new Map(),counts={put:0,get:0,receipt:0};const faults={};
 const scope=fields=>({snapshot_id:c.snapshot_id,...fields});
 const stats=()=>control('stats',scope());
 async function fetchImpl(url,options){
  assert.equal(options.redirect,'error');assert.equal(options.credentials,'omit');assert.equal(options.cache,'no-store');
  assert.equal(options.headers.apikey,KEY);assert.equal(options.headers.authorization,'Bearer '+KEY);assert.ok(options.signal instanceof AbortSignal);
  const parsed=new URL(url);assert.equal(parsed.origin,ORIGIN);
  if(parsed.pathname.startsWith('/rest/v1/rpc/')){
   assert.equal(options.method,'POST');const name=parsed.pathname.split('/').at(-1),args=JSON.parse(options.body);
   const result=await request({name,args});
   if(name==='private_bank_snapshot_file'&&args.p_action==='verify_bytes'){
    counts.receipt++;
    if(faults.lostReceipt&&!result.error){faults.lostReceipt=false;throw new Error('Synthetic lost SQL acknowledgement');}
   }
   return result.error?response(url,400,{code:result.error.code}):response(url,200,result.data);
  }
  const prefix='/storage/v1/object/private-bank-snapshots/'+c.ids.org+'/'+c.snapshot_id+'/';assert.ok(parsed.pathname.startsWith(prefix));
  const fileId=parsed.pathname.slice(prefix.length);assert.ok(c.files.some(f=>f.file_id===fileId));
  if(options.method==='POST'){
   counts.put++;assert.equal(options.headers['x-upsert'],'false');assert.equal(options.headers['accept-encoding'],'identity');
   if(faults.staleUpload)return response(url,200,{Key:'ignored acknowledgement'});
   if(objects.has(fileId))return response(url,409,{code:'Duplicate'});
   const bytes=new Uint8Array(options.body).slice();objects.set(fileId,{bytes,mime:options.headers['content-type']});
   if(!faults.omitObjectRow)await control('object_exists',scope({file_id:fileId}));
   if(faults.afterPut)await faults.afterPut();
   if(faults.lostUpload){faults.lostUpload=false;throw new Error('Synthetic lost Storage acknowledgement');}
   return response(url,201,{Key:'ignored acknowledgement'});
  }
  assert.equal(options.method,'GET');counts.get++;const saved=objects.get(fileId);
  if(!saved)return response(url,404,{code:'NotFound'});
  let bytes=saved.bytes.slice();if(faults.corrupt)bytes[0]^=1;if(faults.truncate)bytes=bytes.slice(0,-1);
  if(faults.afterGet)await faults.afterGet();
  return response(url,200,bytes,{'content-type':faults.wrongMime?'application/octet-stream':saved.mime,'content-length':String(bytes.length)});
 }
 const config={supabaseUrl:ORIGIN,serviceKey:KEY,fetchImpl,timeoutMs:5000};
 const rpc=createSnapshotRpcTransport(config),storage=createSnapshotStorageTransport(config);
 const handler=createSnapshotTransportHandler({rpc,storage,endpoint:ENDPOINT,allowedOrigin:SITE});
 function raw(row=c.files[0]){return Uint8Array.from(Buffer.from(c.bytes_base64[row.file_id],'base64'));}
 async function send({actor='admin',row=c.files[0],upload=true,requestId=randomUUID(),bytes=raw(row),mime=row.mime_type,fileId=row.file_id}={}){
  const headers={origin:SITE,...(actor?{authorization:'Bearer '+c.tokens[actor]}:{})};
  if(upload)Object.assign(headers,{'content-type':mime,'x-echs-request-id':requestId});
  const r=await handler(new Request(ENDPOINT+'/snapshots/'+c.snapshot_id+'/files/'+fileId+(upload?'/bytes':''),{method:upload?'POST':'GET',headers,...(upload?{body:bytes}: {})}));
  assert.equal(r.headers.get('cache-control'),'private, no-store');assert.equal(r.headers.get('x-content-type-options'),'nosniff');
  assert.equal(r.headers.get('access-control-allow-origin'),SITE);
  report.observations.push({status:r.status,put_calls:counts.put,get_calls:counts.get,receipt_calls:counts.receipt});
  return r;
 }
 async function seed(row=c.files[0]){await storage.put({organization_id:c.ids.org,snapshot_id:c.snapshot_id,file_id:row.file_id},raw(row),row.mime_type);counts.put=0;}
 return {c,faults,counts,stats,send,seed,raw,objects,rpc,control:name=>control(name,scope())};
}
async function check(label,fn){report.phase=label;save();await fn();report.checks.push(label);save();console.log('PASS '+label);}
try{
 child=spawn(process.env.PYTHON||'python',[path.join(here,'rpc-fixture.py'),'--database-report',process.env.ECHS_TRANSPORT_DATABASE_REPORT],{stdio:['pipe','pipe','pipe'],windowsHide:true});
 const start=setTimeout(()=>rejectReady(new Error('SQL fixture startup timeout')),15000);
 child.once('error',()=>rejectReady(new Error('SQL fixture unavailable')));
 child.stderr.resume(); // Never echo database connection strings or SQL payloads.
 child.once('exit',()=>{rejectReady(new Error('SQL fixture ended'));for(const r of waiting.values()){clearTimeout(r.timer);r.reject(new Error('SQL fixture ended'));}waiting.clear();});
 readline.createInterface({input:child.stdout}).on('line',line=>{let value;try{value=JSON.parse(line);}catch{return rejectReady(new Error('Malformed SQL fixture response'));}
  if(Object.hasOwn(value,'ready')){clearTimeout(start);return value.ready?resolveReady(value):rejectReady(new Error('SQL fixture rejected isolated inputs'));}
  const pending=waiting.get(value.id);if(pending){clearTimeout(pending.timer);waiting.delete(value.id);pending.resolve(value);}
 });
 const initial=await ready;assert.equal(initial.storage_service_executed,false);report.database_executed=true;report.postgres_version=initial.postgres_version;report.migrations=initial.migrations;
 await check('Real session lookup and closed archive status preserve private metadata projection',async()=>{
  const f=await fresh(),r=await f.send({upload:false});assert.equal(r.status,200);const p=await r.json();assert.deepEqual(Object.keys(p).sort(),['contract','file','file_id','ok','snapshot_id']);assert.deepEqual(Object.keys(p.file).sort(),['byte_length','bytes_verified','mime_type','sha256']);assert.equal(p.file.bytes_verified,false);assert.deepEqual(f.counts,{put:0,get:0,receipt:0});
 });
 await check('Anonymous, nonadministrator and foreign-tenant actors are denied by actual SQL before Storage',async()=>{
  const f=await fresh();for(const [actor,status] of [['',401],['teacher',403],['student',403],['parent',403],['foreign_admin',404]])assert.equal((await f.send({actor})).status,status);
  assert.deepEqual(f.counts,{put:0,get:0,receipt:0});assert.equal((await f.stats()).receipt_events,0);
 });
 await check('Actual byte receipt requires immutable upload plus exact readback and remains separate from source records and readiness',async()=>{
  const f=await fresh(),r=await f.send();assert.equal(r.status,200);assert.equal((await r.json()).file.bytes_verified,true);assert.deepEqual(f.counts,{put:1,get:1,receipt:1});
  const stats=await f.stats();assert.equal(stats.state,'staging');assert.equal(stats.receipt_events,1);assert.equal(stats.question_rows,0);assert.equal(stats.files[f.c.files[0].file_id].records_verified,false);
 });
 await check('Changed retry bytes, wrong MIME and excess body never submit another SQL receipt or overwrite',async()=>{
  const f=await fresh();assert.equal((await f.send()).status,200);const changed=f.raw();changed[0]^=1;
  assert.equal((await f.send({bytes:changed})).status,409);assert.equal((await f.send({mime:'image/png'})).status,415);assert.equal((await f.send({bytes:new Uint8Array(f.raw().length+1)})).status,413);
  assert.equal(f.counts.put,1);assert.equal((await f.stats()).receipt_events,1);
 });
 await check('Lost upload acknowledgement and preexisting duplicate object converge only after readback',async()=>{
  for(const mode of ['lost','duplicate']){const f=await fresh();if(mode==='lost')f.faults.lostUpload=true;else await f.seed();assert.equal((await f.send()).status,200);assert.equal(f.counts.put,1);assert.equal(f.counts.get,1);assert.equal((await f.stats()).receipt_events,1);}
 });
 await check('Lost acknowledgement after committed verify_bytes reconciles real SQL status without repeating its event',async()=>{
  const f=await fresh();f.faults.lostReceipt=true;assert.equal((await f.send()).status,200);assert.equal(f.counts.receipt,1);assert.equal((await f.stats()).receipt_events,1);
 });
 await check('Stale successful upload acknowledgement with missing object is not a receipt',async()=>{
  const f=await fresh();f.faults.staleUpload=true;assert.equal((await f.send()).status,503);assert.equal(f.counts.receipt,0);assert.equal((await f.stats()).receipt_events,0);
 });
 await check('Corrupt, truncated and wrong-MIME readback are rejected before actual verify_bytes',async()=>{
  for(const [fault,status] of [['corrupt',409],['truncate',503],['wrongMime',503]]){const f=await fresh();f.faults[fault]=true;assert.equal((await f.send()).status,status);assert.equal(f.counts.receipt,0);assert.equal((await f.stats()).receipt_events,0);}
 });
 await check('Actual SQL requires the fixed Storage metadata object even when injected byte readback succeeds',async()=>{
  const f=await fresh();f.faults.omitObjectRow=true;assert.equal((await f.send()).status,409);assert.equal(f.counts.receipt,1);assert.equal((await f.stats()).receipt_events,0);
 });
 await check('Ready and aborted snapshots allow status but deny upload before any Storage call',async()=>{
  for(const mode of ['ready','aborted']){const f=await fresh(mode);assert.equal((await f.send({upload:false})).status,200);assert.equal((await f.send()).status,409);assert.deepEqual(f.counts,{put:0,get:0,receipt:0});}
 });
 await check('Actual session revocation, expiry, suspension and role demotion during I/O prevent a byte receipt',async()=>{
  for(const [control,status] of [['revoke',401],['expire',401],['suspend',401],['demote',403]]){const f=await fresh();f.faults.afterPut=()=>f.control(control);assert.equal((await f.send()).status,status);const stats=await f.stats();assert.equal(stats.receipt_events,0);assert.equal(stats.object_rows,1);assert.equal(f.counts.receipt,0);}
 });
 await check('Snapshot abort after upload or readback rejects a late success and retains immutable orphan bytes',async()=>{
  for(const point of ['afterPut','afterGet']){const f=await fresh();f.faults[point]=()=>f.control('abort');assert.equal((await f.send()).status,409);const stats=await f.stats();assert.equal(stats.state,'aborted');assert.equal(stats.receipt_events,0);assert.equal(stats.object_rows,1);}
 });
 await check('Request UUID reuse across actual reserve and verify actions fails without changing the file receipt',async()=>{
  const f=await fresh();assert.equal((await f.send({requestId:f.c.reserve_request_id})).status,409);assert.equal((await f.stats()).receipt_events,0);
 });
 await check('Actual registration quota rejection leaves its file unavailable to the upload route',async()=>{
  const f=await fresh('quota');assert.equal(f.c.quota_code,'23514');assert.equal((await f.send({row:f.c.files[3]})).status,404);assert.deepEqual(f.counts,{put:0,get:0,receipt:0});
 });
 await check('Concurrent identical HTTP uploads converge on one real SQL byte event and verified retries avoid overwrite',async()=>{
  const f=await fresh(),requestId=randomUUID();const pair=await Promise.all([f.send({requestId}),f.send({requestId})]);assert.deepEqual(pair.map(r=>r.status),[200,200]);assert.equal((await f.stats()).receipt_events,1);
  const before=f.counts.put;assert.equal((await f.send({requestId})).status,200);assert.equal(f.counts.put,before);assert.equal((await f.stats()).receipt_events,1);
 });
 assert.equal(report.checks.length,15);assert.equal(report.migrations.length,27);report.status='ACTUAL POSTGRESQL AND ROUTE PASS; STORAGE SERVICE AND EDGE NOT RUN';
 report.limits=['Service-role PostgreSQL RPCs execute after all27 migrations and fresh222 archive checks. The PostgREST HTTP adapter is fixed/injected, not a real PostgREST server.',
  'Storage responses use immutable synthetic in-memory bytes plus explicit test-only storage.objects metadata rows. No Supabase Storage REST/service acceptance is claimed.',
  'Ready terminal fixtures are prepared through actual SQL with trusted synthetic receipts solely to test upload denial; the handler implements no record verification, seal or delivery.',
  'Concurrent HTTP requests use a serialized stdio SQL bridge; actual parallel SQL races remain covered separately by the existing222 suite.',
  'No transaction spans SQL authorization and Storage. Revoked/aborted late writes can leave retained orphan bytes without a receipt.'];save();console.log(JSON.stringify({status:report.status,groups:report.checks.length}));
}catch(e){report.status='FAIL; NO ACCEPTANCE';report.error_type=e.name;save();console.error('Transport/SQL integration failed: '+e.name);process.exitCode=1;}
finally{if(child){child.stdin.end();await new Promise(resolve=>{if(child.exitCode!==null)return resolve();const timer=setTimeout(()=>{child.kill();resolve();},2000);child.once('exit',()=>{clearTimeout(timer);resolve();});});}}
