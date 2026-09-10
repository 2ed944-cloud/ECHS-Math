// Actual PostgREST/Storage service acceptance. Linux disposable runner only.
// No fetch response adapter is used for ordinary cases. Explicit lost-ack hooks
// discard real committed upstream responses and are labeled in the report.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import tls from 'node:tls';
import dns from 'node:dns';
import path from 'node:path';
import readline from 'node:readline';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {HOST,openGateway,privateUpstreamHost,fixtureLookup} from './tls-gateway.mjs';
import {createSnapshotTransportHandler} from './runtime/handler.mjs';
import {createSnapshotRpcTransport,createSnapshotStorageTransport} from './runtime/transport.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
export const CHILD_PHASES=Object.freeze(['entry','runtime-check','control-config','private-config','tls-trust','resolver-install','gateway-listen','seed-start','seed-ready','runtime-handler','case-source','schema-readiness','service-cases','report-write','cleanup']);
const SAFE_CODES=new Set(['ENOTFOUND','EAI_AGAIN','EADDRINUSE','EACCES','EPERM','ECONNREFUSED','ECONNRESET','ETIMEDOUT','EPIPE','ENOENT','ERR_TLS_CERT_ALTNAME_INVALID','DEPTH_ZERO_SELF_SIGNED_CERT','UNABLE_TO_VERIFY_LEAF_SIGNATURE','CERT_HAS_EXPIRED','ERR_DLOPEN_FAILED','MODULE_NOT_FOUND','ERR_MODULE_NOT_FOUND','ERR_INVALID_ARG_TYPE','ERR_ASSERTION','CHILD_EXIT']);
const SAFE_TYPES=new Set(['Error','TypeError','RangeError','SyntaxError','AssertionError','AggregateError','SystemError']);
const SEED_PHASES=new Set(['entry','configuration','network-validation','fixture-source','driver-import','database-connect','database-identity','controls-ready']);
const SEED_TYPES=new Set(['Exception','ModuleNotFoundError','ImportError','OperationalError','ProgrammingError','IntegrityError','DataError','InterfaceError','InternalError','NotSupportedError','ContractError','ValueError','KeyError','TypeError','FileNotFoundError','PermissionError','JSONDecodeError']);
export function safeChildDiagnostic(phase,error){
 const code=SAFE_CODES.has(error?.code)?error.code:SAFE_CODES.has(error?.cause?.code)?error.cause.code:null;
 return {contract:'echs.c08.service-child-failure.v1',status:'FAIL',phase:CHILD_PHASES.includes(phase)?phase:'entry',
  error_type:SAFE_TYPES.has(error?.constructor?.name)?error.constructor.name:'Error',code,
  sqlstate:typeof error?.safeCode==='string'&&/^[0-9A-Z]{5}$/.test(error.safeCode)?error.safeCode:null,
  seed_phase:SEED_PHASES.has(error?.seedPhase)?error.seedPhase:null,
  seed_error_type:SEED_TYPES.has(error?.seedType)?error.seedType:null,
  seed_exit_code:Number.isInteger(error?.seedExitCode)&&error.seedExitCode>=0&&error.seedExitCode<=255?error.seedExitCode:null};
}
let phase='entry',diagnosticDir=null,failureDiagnostic=null;
const resources={gateway:null,child:null,privateLines:null,readyTimer:null,key:null,secrets:null};
async function disposeResources(){
 clearTimeout(resources.readyTimer);resources.privateLines?.close();
 const child=resources.child;resources.child=null;
 if(child){try{child.stdin.end();}catch{}if(child.exitCode===null&&child.signalCode===null)await Promise.race([
  new Promise(resolve=>child.once('exit',resolve)),new Promise(resolve=>{const timer=setTimeout(()=>{child.kill();resolve();},3000);timer.unref();})]);}
 const gateway=resources.gateway;resources.gateway=null;if(gateway)await gateway.close();
 resources.key?.fill(0);resources.key=null;
 if(resources.secrets)for(const name of Object.keys(resources.secrets))resources.secrets[name]=null;resources.secrets=null;
}
async function main(){
phase='runtime-check';
const runDir=path.resolve(process.argv[2]||'');
assert.equal(path.dirname(runDir),path.join(here,'runs'));assert.match(path.basename(runDir),/^[0-9a-f]{32}$/);
diagnosticDir=runDir;
assert.equal(process.platform,'linux');assert.equal(typeof tls.setDefaultCACertificates,'function');
phase='control-config';
const control=JSON.parse(await fs.readFile(path.join(runDir,'control.json'),'utf8'));
assert.equal(control.project,'echs-c08-service-'+path.basename(runDir));
assert.equal(control.network.connection_mode,'owned-internal-bridge');assert.equal(control.network.network_name,control.project+'_internal');
assert.equal(control.network.internal,true);assert.equal(control.network.published_ports,false);assert.equal(control.network.ipv6,false);
assert.equal(control.network.containers.length,5);const addresses=Object.fromEntries(control.network.containers.map(r=>[r.service,r]));
assert.equal(Object.keys(addresses).length,5);
for(const [name,port]of Object.entries({db:5432,auth:9999,rest:3000,storage:5000,imgproxy:5001})){
 assert.equal(addresses[name].port,port);assert(privateUpstreamHost(addresses[name].ipv4)&&addresses[name].ipv4!=='127.0.0.1');
}
phase='private-config';
const secrets=JSON.parse(await fs.readFile(path.join(runDir,'secrets','credentials.json'),'utf8'));resources.secrets=secrets;
const secretPath=path.join(runDir,'secrets','tls');
const ca=await fs.readFile(path.join(secretPath,'ca.pem'));
const cert=await fs.readFile(path.join(secretPath,'server.pem')),key=await fs.readFile(path.join(secretPath,'server-key.pem'));
resources.key=key;phase='tls-trust';
// Process-local trust and DNS only. Certificate/SAN checks stay enabled; no
// hosts file, OS trust store, global production DNS or Response.url rewrite.
tls.setDefaultCACertificates([ca.toString()]);
phase='resolver-install';dns.lookup=fixtureLookup({restHost:addresses.rest.ipv4,storageHost:addresses.storage.ipv4});
phase='gateway-listen';
const gateway=await openGateway({cert,key,restHost:addresses.rest.ipv4,storageHost:addresses.storage.ipv4,restPort:3000,storagePort:5000,listenPort:443});
resources.gateway=gateway;
const origin='https://'+HOST,endpoint=origin+'/functions/v1/private-bank-snapshot-transport';
const rawFetch=globalThis.fetch;
phase='seed-start';
const child=spawn(control.python,['-B',path.join(here,'seed_synthetic.py'),'--run-dir',runDir,'--repo',control.repo],
 {stdio:['pipe','pipe','pipe'],env:{PATH:process.env.PATH||'',LANG:'C.UTF-8',PYTHONDONTWRITEBYTECODE:'1'}});
resources.child=child;
let sequence=0,failedControl=false;const pending=new Map();let readyResolve,readyReject;
const ready=new Promise((resolve,reject)=>{readyResolve=resolve;readyReject=reject;});
void ready.catch(()=>{});
const privateLines=readline.createInterface({input:child.stdout});
const readyTimer=setTimeout(()=>readyReject(new Error('Synthetic control readiness deadline')),20000);
resources.privateLines=privateLines;resources.readyTimer=readyTimer;
privateLines.on('line',line=>{try{assert(Buffer.byteLength(line)<=1048576);const row=JSON.parse(line);
 if(Object.hasOwn(row,'ready')){clearTimeout(readyTimer);row.ready===true?readyResolve(row):readyReject(Object.assign(new Error('Synthetic control unavailable'),{safeCode:row.code,seedPhase:row.phase,seedType:row.error_type}));return;}
 const p=pending.get(row.id);if(!p)return;pending.delete(row.id);clearTimeout(p.timer);
 row.error?p.reject(Object.assign(new Error('Synthetic SQL control rejected'),{safeCode:row.error.code})):p.resolve(row.data);
 }catch{failedControl=true;readyReject(new Error('Synthetic control invalid output'));}});
child.stderr.on('data',()=>{failedControl=true;}); // Never persist or print SQL/credential diagnostics.
child.on('error',error=>{failedControl=true;readyReject(error);});
child.stdin.on('error',error=>{failedControl=true;readyReject(error);for(const p of pending.values()){clearTimeout(p.timer);p.reject(error);}pending.clear();});
child.on('exit',code=>{const error=Object.assign(new Error('Synthetic control closed'),{code:'CHILD_EXIT',seedExitCode:code});readyReject(error);for(const p of pending.values()){clearTimeout(p.timer);p.reject(error);}pending.clear();});
function ctl(action,extra={}){const id=++sequence;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{pending.delete(id);reject(new Error('Synthetic control timeout'));},15000);pending.set(id,{resolve,reject,timer});child.stdin.write(JSON.stringify({id,action,...extra})+'\n');});}
const fresh=(size='small')=>ctl('new_case',{size});
const stats=c=>ctl('stats',{snapshot_id:c.snapshot_id});
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const bytes=(c,f)=>{const r=c.recipes[f.file_id];return r.base64?Buffer.from(r.base64,'base64'):Buffer.alloc(r.byte_length,r.repeat_byte);};
const keyOf=(c,f)=>c.ids.org+'/'+c.snapshot_id+'/'+f.file_id;
const objectOf=(c,f)=>origin+'/storage/v1/object/private-bank-snapshots/'+keyOf(c,f);
const urlOf=(c,f,upload=false)=>endpoint+'/snapshots/'+c.snapshot_id+'/files/'+f.file_id+(upload?'/bytes':'');
function handler(fetchImpl){const options={supabaseUrl:origin,serviceKey:secrets.SERVICE_ROLE_KEY,...(fetchImpl?{fetchImpl}:{})};
 return createSnapshotTransportHandler({rpc:createSnapshotRpcTransport(options),storage:createSnapshotStorageTransport(options),endpoint,allowedOrigin:'https://teacher.example.invalid'});}
phase='runtime-handler';const ordinary=handler();
let verifiedTls=false;
async function invoke(c,f,{upload=false,who='admin',body=undefined,requestId=crypto.randomUUID(),mime=f.mime_type,signal,extra={},h=ordinary}={}){
 const headers={...(who?{authorization:'Bearer '+c.tokens[who]}:{}),...(upload?{'content-type':mime,'x-echs-request-id':requestId}:{}),...extra};
 const response=await h(new Request(urlOf(c,f,upload),{method:upload?'POST':'GET',headers,...(upload?{body:body??bytes(c,f)}:{}),signal}));
 const value=await response.json();return {status:response.status,value};
}
async function direct(url,{jwt=secrets.SERVICE_ROLE_KEY,method='GET',body,headers={},timeoutMs=15000}={}){
 const r=await rawFetch(url,{method,headers:{apikey:jwt,authorization:'Bearer '+jwt,...headers},...(body!==undefined?{body}:{}),redirect:'error',signal:AbortSignal.timeout(timeoutMs)});
 assert.equal(r.url,url);assert.equal(r.redirected,false);verifiedTls=true;const result={status:r.status,headers:r.headers,bytes:Buffer.from(await r.arrayBuffer())};return result;
}
function success(result,c,f){assert.equal(result.status,200);assert.deepEqual(result.value,{ok:true,contract:'echs.private-bank.snapshot-transport.v1',snapshot_id:c.snapshot_id,file_id:f.file_id,
 file:{byte_length:f.byte_length,mime_type:f.mime_type,sha256:f.sha256,bytes_verified:true}});}
phase='case-source';const expected=JSON.parse(await fs.readFile(path.join(here,'service-cases.json'),'utf8'));
const groups=[];let shared;
async function group(index,fn){const start=Date.now();try{await fn();groups.push({name:expected[index],status:'PASS',elapsed_ms:Date.now()-start});}
 catch(error){groups.push({name:expected[index],status:'FAIL',elapsed_ms:Date.now()-start,error_type:error.constructor.name,...(typeof error.safeCode==='string'&&/^[0-9A-Z]{5}$/.test(error.safeCode)?{sqlstate:error.safeCode}:{})});}}
const capability={contract:'echs.private-bank.snapshot-store.v1',schema_version:1,immutable_ready:true,student_delivery:false,max_record_bytes:65536,max_object_bytes:16777216,max_snapshot_bytes:268435456};
const readiness={status:'NOT_CHECKED',probes:0,elapsed_ms:0};
async function waitForSchemaCache(){
 const start=Date.now(),deadline=start+20000;readiness.status='FAIL';
 while(Date.now()<deadline){
  readiness.probes++;
  let response;
  try{response=await direct(origin+'/rest/v1/rpc/private_bank_snapshot_capabilities',{method:'POST',body:'{}',headers:{'content-type':'application/json'},timeoutMs:Math.max(1,Math.min(2000,deadline-Date.now()))});}
  catch{response=null;}
  readiness.elapsed_ms=Date.now()-start;
  if(response&&![404,503].includes(response.status)){
   assert.equal(response.status,200);assert.deepEqual(JSON.parse(response.bytes),capability);readiness.status='PASS';return;
  }
  if(Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,Math.min(500,deadline-Date.now())));
 }
 readiness.elapsed_ms=Date.now()-start;throw new Error('Actual schema cache readiness deadline');
}
try{
 phase='seed-ready';await ready;
 phase='schema-readiness';await waitForSchemaCache();phase='service-cases';
 await group(0,async()=>{const r=await direct(origin+'/rest/v1/rpc/private_bank_snapshot_capabilities',{method:'POST',body:'{}',headers:{'content-type':'application/json'}});assert.equal(r.status,200);assert.deepEqual(JSON.parse(r.bytes),capability);});
 await group(1,async()=>{for(const jwt of [secrets.ANON_KEY,secrets.AUTHENTICATED_KEY])for(const name of ['private_bank_snapshot_capabilities','private_bank_snapshot_file']){
  const body=name.endsWith('_file')?JSON.stringify({p_token_hash:'0'.repeat(64),p_action:'status',p_payload:{snapshot_id:crypto.randomUUID(),file_id:crypto.randomUUID()}}):'{}';
  const r=await direct(origin+'/rest/v1/rpc/'+name,{jwt,method:'POST',body,headers:{'content-type':'application/json'}});assert([401,403,404].includes(r.status));}});
 await group(2,async()=>{shared=await fresh();assert.equal(new Set(shared.files.map(f=>f.mime_type)).size,6);for(const f of shared.files){success(await invoke(shared,f,{upload:true}),shared,f);const r=await direct(objectOf(shared,f));assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),f.mime_type);assert.equal(r.bytes.length,f.byte_length);assert.equal(digest(r.bytes),f.sha256);}assert.equal((await stats(shared)).receipt_events,shared.files.length);});
 await group(3,async()=>{const c=await fresh(),f=c.files[0],data=bytes(c,f),url=objectOf(c,f);const options={method:'POST',body:data,headers:{'content-type':f.mime_type,'x-upsert':'false'}};
  assert([200,201].includes((await direct(url,options)).status));const duplicate=await direct(url,{...options,body:Buffer.alloc(data.length,90)});assert.equal(duplicate.status,400);assert.deepEqual((await direct(url)).bytes,data);success(await invoke(c,f,{upload:true}),c,f);});
 await group(4,async()=>{assert(shared);const f=shared.files[0];for(const jwt of [secrets.ANON_KEY,secrets.AUTHENTICATED_KEY]){
  for(const method of ['GET','POST','PUT','DELETE']){const r=await direct(objectOf(shared,f),{jwt,method,...(method==='POST'||method==='PUT'?{body:bytes(shared,f),headers:{'content-type':f.mime_type,'x-upsert':'true'}}:{})});assert([400,401,403,404].includes(r.status));}
  const list=await direct(origin+'/storage/v1/object/list/private-bank-snapshots',{jwt,method:'POST',body:JSON.stringify({prefix:shared.ids.org+'/'+shared.snapshot_id,limit:100}),headers:{'content-type':'application/json'}});
  if(list.status===200)assert.deepEqual(JSON.parse(list.bytes),[]);else assert([400,401,403,404].includes(list.status));
 }assert.equal(digest((await direct(objectOf(shared,f))).bytes),f.sha256);});
 await group(5,async()=>{const c=await fresh(),f=c.files[0];for(const who of ['teacher','student','parent'])assert.equal((await invoke(c,f,{who,upload:true})).status,403);
  assert.equal((await invoke(c,f,{who:'foreign_admin',upload:true})).status,404);assert.equal((await invoke(c,f,{who:null,upload:true})).status,401);assert.equal((await stats(c)).object_rows,0);});
 await group(6,async()=>{for(const action of ['expire','revoke','suspend','demote']){const c=await fresh(),f=c.files[0];await ctl(action,{snapshot_id:c.snapshot_id});const before=gateway.counts().storage_requests;
  assert.equal((await invoke(c,f,{upload:true})).status,action==='demote'?403:401);assert.equal(gateway.counts().storage_requests,before);assert.equal((await stats(c)).receipt_events,0);}});
 await group(7,async()=>{const c=await fresh(),f=c.files[0],wrong=Buffer.alloc(f.byte_length,90);assert([200,201].includes((await direct(objectOf(c,f),{method:'POST',body:wrong,headers:{'content-type':f.mime_type,'x-upsert':'false'}})).status));
  assert.equal((await invoke(c,f,{upload:true})).status,409);assert.equal((await stats(c)).receipt_events,0);assert.deepEqual((await direct(objectOf(c,f))).bytes,wrong);});
 await group(8,async()=>{const c=await fresh(),f=c.files[0];let lost=0;const h=handler(async(url,init)=>{const response=await rawFetch(url,init);if(url===objectOf(c,f)&&init.method==='POST'&&!lost){assert([200,201].includes(response.status));await response.arrayBuffer();lost++;throw new TypeError('Synthetic committed acknowledgement loss');}return response;});
  success(await invoke(c,f,{upload:true,h}),c,f);assert.equal(lost,1);assert.equal((await stats(c)).receipt_events,1);});
 await group(9,async()=>{const c=await fresh(),f=c.files[0];let lost=0;const h=handler(async(url,init)=>{const response=await rawFetch(url,init);if(url.endsWith('/rpc/private_bank_snapshot_file')&&JSON.parse(init.body).p_action==='verify_bytes'&&!lost){assert.equal(response.status,200);await response.arrayBuffer();lost++;throw new TypeError('Synthetic committed acknowledgement loss');}return response;});
  success(await invoke(c,f,{upload:true,h}),c,f);assert.equal(lost,1);assert.equal((await stats(c)).receipt_events,1);});
 await group(10,async()=>{const c=await fresh(),f=c.files[0];let changed=false;const h=handler(async(url,init)=>{const response=await rawFetch(url,init);if(url===objectOf(c,f)&&init.method==='POST'&&!changed){assert([200,201].includes(response.status));changed=true;await ctl('revoke',{snapshot_id:c.snapshot_id});}return response;});
  assert.equal((await invoke(c,f,{upload:true,h})).status,401);const state=await stats(c);assert.equal(state.object_rows,1);assert.equal(state.receipt_events,0);});
 await group(11,async()=>{const c=await fresh(),f=c.files[0],controller=new AbortController();let changed=false;const h=handler(async(url,init)=>{const response=await rawFetch(url,init);if(url===objectOf(c,f)&&init.method==='POST'&&!changed){assert([200,201].includes(response.status));changed=true;controller.abort();}return response;});
  assert.equal((await invoke(c,f,{upload:true,h,signal:controller.signal})).status,408);const state=await stats(c);assert.equal(state.object_rows,1);assert.equal(state.receipt_events,0);});
 await group(12,async()=>{const c=await fresh(),f=c.files[0],requestId=crypto.randomUUID();const results=await Promise.all([invoke(c,f,{upload:true,requestId}),invoke(c,f,{upload:true,requestId})]);for(const r of results)success(r,c,f);const state=await stats(c);assert.equal(state.object_rows,1);assert.equal(state.receipt_events,1);});
 await group(13,async()=>{const c=await fresh(),f=c.files[0];assert.equal(await ctl('abort',{snapshot_id:c.snapshot_id}),'aborted');assert.equal((await invoke(c,f)).status,200);const before=gateway.counts().storage_requests;assert.equal((await invoke(c,f,{upload:true})).status,409);assert.equal(gateway.counts().storage_requests,before);});
 await group(14,async()=>{const c=await fresh();for(const f of c.files)success(await invoke(c,f,{upload:true}),c,f);assert.equal(await ctl('seal_fixture',{snapshot_id:c.snapshot_id}),'ready');const f=c.files[0];success(await invoke(c,f),c,f);const before=gateway.counts().storage_requests;assert.equal((await invoke(c,f,{upload:true})).status,409);assert.equal(gateway.counts().storage_requests,before);});
 await group(15,async()=>{for(const size of ['6mib','11mib','16mib']){const c=await fresh(size),f=c.files.find(f=>f.source_path==='synthetic/size-probe.png');success(await invoke(c,f,{upload:true}),c,f);assert.equal((await stats(c)).receipt_events,1);}});
 await group(16,async()=>{const c=await fresh(),f=c.files[0];const before=gateway.counts().storage_requests;
  assert.equal((await invoke(c,f,{upload:true,mime:'text/plain'})).status,415);assert.equal((await invoke(c,f,{upload:true,body:Buffer.alloc(0)})).status,413);
  assert.equal((await invoke(c,f,{upload:true,body:Buffer.alloc(f.byte_length,90)})).status,409);assert.equal(gateway.counts().storage_requests,before);assert.equal((await stats(c)).receipt_events,0);});
 await group(17,async()=>{const c=await fresh(),f=c.files[0];assert.equal((await invoke(c,f,{upload:true,extra:{'content-encoding':'gzip'}})).status,415);assert.equal((await stats(c)).receipt_events,0);});
 await group(18,async()=>{const c=await fresh(),f=c.files[0],url=origin+'/storage/v1/bucket/private-bank-snapshots';let changed=false;
  try{const r=await direct(url,{method:'PUT',body:JSON.stringify({public:true}),headers:{'content-type':'application/json'}});assert.equal(r.status,200);changed=true;
   const cap=await direct(origin+'/rest/v1/rpc/private_bank_snapshot_capabilities',{method:'POST',body:'{}',headers:{'content-type':'application/json'}});assert.equal(cap.status,200);assert.equal(JSON.parse(cap.bytes),null);
   assert.equal((await invoke(c,f,{upload:true})).status,503);assert.equal((await stats(c)).receipt_events,0);
  }finally{if(changed){const r=await direct(url,{method:'PUT',body:JSON.stringify({public:false}),headers:{'content-type':'application/json'}});assert.equal(r.status,200);}}
  const cap=await direct(origin+'/rest/v1/rpc/private_bank_snapshot_capabilities',{method:'POST',body:'{}',headers:{'content-type':'application/json'}});assert.deepEqual(JSON.parse(cap.bytes),capability);
 });
}catch(error){
 failedControl=true;
 failureDiagnostic=safeChildDiagnostic(phase,error);
 while(groups.length<expected.length)groups.push({name:expected[groups.length],status:'FAIL',elapsed_ms:0,error_type:error.constructor.name});
}finally{
 phase='cleanup';await disposeResources();
}
phase='report-write';
assert.deepEqual(groups.map(g=>g.name),expected);
const report={contract:'echs.c08.actual-storage-service-tests.v1',status:groups.every(g=>g.status==='PASS')&&!failedControl?'PASS':'FAIL',passed:groups.filter(g=>g.status==='PASS').length,total:groups.length,groups,
 head:control.expected_head,tree:control.expected_tree,source_manifest_sha256:control.source_manifest_sha256,services_executed:true,
 actual_postgrest:gateway.counts().rest_requests>0,actual_storage:gateway.counts().storage_requests>0,actual_managed_postgres:true,verified_tls:verifiedTls,synthetic_only:true,production_calls:false,hosted_edge_executed:false,
 runtime_sha256:{'handler.mjs':digest(await fs.readFile(path.join(here,'runtime','handler.mjs'))),'transport.mjs':digest(await fs.readFile(path.join(here,'runtime','transport.mjs')))},
 explicit_fault_cases:[8,9,10,11].map(i=>expected[i]),opaque_mime_fixtures_not_decoder_tests:true,storage_metadata_dml:false,control_error:failedControl,gateway_counts:gateway.counts(),readiness};
await fs.writeFile(path.join(runDir,'service-test-results.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:report.status,passed:report.passed,total:report.total,services_executed:true}));if(report.status!=='PASS')process.exitCode=1;
}
// Importing the diagnostic helper performs no service, filesystem or DNS work.
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{await main();}catch(error){failureDiagnostic=safeChildDiagnostic(phase,error);process.exitCode=1;}
 finally{
  try{await disposeResources();}catch(error){failureDiagnostic??=safeChildDiagnostic('cleanup',error);process.exitCode=1;}
  if(failureDiagnostic&&diagnosticDir)try{await fs.writeFile(path.join(diagnosticDir,'service-child-failure.json'),JSON.stringify(failureDiagnostic,null,2)+'\n',{flag:'wx'});}
   catch{console.log(JSON.stringify({status:'FAIL',phase:'diagnostic-write',error_type:'Error'}));process.exitCode=1;}
 }
}
