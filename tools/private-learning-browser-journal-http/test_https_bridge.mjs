// Native Node TLS/stream tests only. No Chromium, PostgREST or SQL acceptance.
import assert from 'node:assert/strict';
import https from 'node:https';
import {readFile,mkdtemp,mkdir,rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {EventEmitter} from 'node:events';
import {staticMap,boundedHook,listenHttps,closeTrackedServer} from './https-bridge.mjs';
import {cleanupFixture,closeContext} from './test_browser_http.mjs';

const hash=raw=>createHash('sha256').update(raw).digest('hex');
const entries=()=>[{path:'/',type:'text/html; charset=utf-8',body:Buffer.from('<!doctype html><title>Fixture</title>')},{path:'/browser-page.mjs',type:'text/javascript; charset=utf-8',body:Buffer.from('globalThis.fixture=true;')}];
const checks=[];
async function test(name,fn){let timer;try{await Promise.race([fn(),new Promise((_,reject)=>timer=setTimeout(()=>reject(new Error('test-group-deadline')),10000))]);checks.push(name)}finally{clearTimeout(timer)}}
function call(origin,path='/',{ca,method='GET',body,headers={},closeAfterHeaders=false}={}){
 return new Promise((resolve,reject)=>{
  const req=https.request(origin+path,{method,ca,headers,rejectUnauthorized:true,agent:false,timeout:2000},response=>{
   const chunks=[];let count=0;
   const peer=response.socket.getPeerCertificate(true)?.raw;
   if(closeAfterHeaders){response.destroy();req.destroy();resolve({status:response.statusCode,closed:true});return;}
   response.on('data',chunk=>{count+=chunk.length;if(count>1048576){req.destroy(new Error('test-body-limit'));return;}chunks.push(chunk)});
   response.once('end',()=>resolve({status:response.statusCode,headers:response.headers,raw:Buffer.concat(chunks).toString(),peer_sha256:peer?hash(peer):null}));
   response.once('error',reject);
  });
  req.once('timeout',()=>req.destroy(new Error('test-request-deadline')));req.once('error',reject);req.end(body);
 });
}
let directory,positive,negative,primaryError;
try{
 await test('L01 static map is a closed copied buffer allowlist',async()=>{
  const original=entries(),map=staticMap(original);original[0].body.fill(0);assert.notEqual(map.get('/').body[0],0);
  for(const path of ['/../key','/%2e%2e/key','//key','/key?value','/functions/v1/learning-journal/apply'])assert.throws(()=>staticMap([...entries(),{path,type:'text/javascript; charset=utf-8',body:Buffer.from('x')}]),/fixture-static-entry/);
  assert.throws(()=>staticMap([...entries(),entries()[0]]),/fixture-static-entry/);
 });
 await test('L02 already aborted hook never invokes callback',async()=>{
  const c=new AbortController();c.abort();let called=false;
  await assert.rejects(boundedHook(()=>{called=true},null,null,c.signal,20),/fixture-client-closed/);assert.equal(called,false);
 });
 await test('L03 hanging hook deadline is bounded and late completion is inert',async()=>{
  const c=new AbortController();let release;const start=performance.now();
  await assert.rejects(boundedHook(()=>new Promise(resolve=>release=resolve),null,null,c.signal,15),/fixture-hook-deadline/);
  assert.ok(performance.now()-start<2000);release('drop');
 });
 await test('L04 hook abort completes independently from held callback',async()=>{
  const c=new AbortController();let ready,release;const started=new Promise(resolve=>ready=resolve);
  const task=boundedHook(()=>{ready();return new Promise(resolve=>release=resolve)},null,null,c.signal,1000);
  await started;c.abort();await assert.rejects(task,/fixture-client-closed/);release(null);
  // A server callback alone cannot acknowledge socket or task cleanup.
  const socket=new EventEmitter(),sockets=new Set([socket]),tasks=new Set(),controllers=new Set();
  const server={listening:true,close(callback){this.listening=false;callback()}};
  let destroyed=false;socket.destroy=()=>{destroyed=true};socket.once('close',()=>sockets.delete(socket));
  let releaseTask;const pendingTask=new Promise(resolve=>releaseTask=resolve);tasks.add(pendingTask);
  pendingTask.finally(()=>tasks.delete(pendingTask));let closed=false;
  const cleanup=closeTrackedServer(server,sockets,tasks,controllers,1000).then(result=>{closed=true;return result});
  await new Promise(resolve=>setImmediate(resolve));assert.equal(destroyed,true);assert.equal(closed,false);
  socket.emit('close');await new Promise(resolve=>setImmediate(resolve));assert.equal(closed,false);
  releaseTask();assert.deepEqual(await cleanup,{listeners_closed:true,sockets_remaining:0,response_tasks_remaining:0});
  assert.equal(socket.listenerCount('close'),0);
  const never=new EventEmitter();never.destroy=()=>{};const neverSet=new Set([never]);
  const start=performance.now();await assert.rejects(closeTrackedServer({listening:false,close:callback=>callback()},neverSet,new Set(),new Set(),15),/fixture-close-deadline/);
  assert.ok(performance.now()-start<2000);assert.equal(neverSet.size,1);assert.equal(never.listenerCount('close'),0);
  const stale=new EventEmitter();stale.destroy=()=>queueMicrotask(()=>stale.emit('close'));
  await assert.rejects(closeTrackedServer({listening:false,close:callback=>callback()},new Set([stale]),new Set(),new Set(),1000),/fixture-listener-not-closed/);
 });
 directory=await mkdtemp(join(tmpdir(),'echs-browser-tls-'));const secrets=join(directory,'secrets');await mkdir(secrets,{mode:0o700});
 const script="import importlib.util,json,sys;from pathlib import Path;s=importlib.util.spec_from_file_location('fixture_certs',sys.argv[1]);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);print(json.dumps(m.generate_tls(Path(sys.argv[2]),sys.argv[3])))";
 const generated=spawnSync(process.argv[2]||'python',['-B','-c',script,fileURLToPath(new URL('./certs.py',import.meta.url)),secrets,process.argv[3]||'openssl'],{encoding:'utf8',timeout:45000,maxBuffer:32768,stdio:['ignore','pipe','pipe']});
 assert.equal(generated.status,0);const bundle=JSON.parse(generated.stdout);
 const cert=await readFile(bundle.positive.certificate_path),key=await readFile(bundle.positive.key_path);
 const otherCert=await readFile(bundle.negative.certificate_path),otherKey=await readFile(bundle.negative.key_path);
 await test('L05 exact leaf serves TLS and static source with no API call',async()=>{
  let calls=0;positive=await listenHttps({cert,key,entries:entries(),handlerFactory:()=>()=>{calls++;return new Response('{}')}});
  const response=await call(positive.origin,'/',{ca:cert});assert.equal(response.status,200);assert.match(response.headers['content-security-policy'],/connect-src 'self'/);assert.equal(calls,0);assert.equal(response.peer_sha256,bundle.positive.metadata.der_sha256);
 });
 await test('L06 unlisted and encoded paths cannot expose private files',async()=>{
  for(const path of ['/control-private.json','/certs.py','/retained/source-manifest-v1.json','/%2e%2e/key','/browser-page.mjs?token=x'])assert.equal((await call(positive.origin,path,{ca:cert})).status,404);
 });
 await test('L07 unrelated same-SAN leaf fails TLS before any HTTP request',async()=>{
  negative=await listenHttps({cert:otherCert,key:otherKey,entries:entries(),handlerFactory:()=>()=>new Response('{}')});
  await assert.rejects(call(negative.origin,'/',{ca:cert}),error=>['DEPTH_ZERO_SELF_SIGNED_CERT','CERT_SIGNATURE_FAILURE','UNABLE_TO_VERIFY_LEAF_SIGNATURE'].includes(error.code));
  assert.equal(negative.metrics.requests,0);assert.equal(negative.metrics.api,0);
  assert.deepEqual(await negative.close(),{listeners_closed:true,sockets_remaining:0,response_tasks_remaining:0});
  assert.deepEqual(await negative.close(),{listeners_closed:true,sockets_remaining:0,response_tasks_remaining:0});negative=null;
 });
 await positive.close();positive=null;
 await test('L08 exact native request body status and response forwarding',async()=>{
  const raw='{"n":900719925474099312345,"small":1e-99}';let received;
  positive=await listenHttps({cert,key,entries:entries(),handlerFactory:origin=>async request=>{assert.equal(request.url,origin+'/functions/v1/learning-journal/apply');received=await request.text();return new Response(raw,{status:409,headers:{'content-type':'application/json'}})}});
  const response=await call(positive.origin,'/functions/v1/learning-journal/apply',{ca:cert,method:'POST',body:raw,headers:{'content-type':'application/json'}});assert.equal(response.status,409);assert.equal(response.raw,raw);assert.equal(received,raw);
  await positive.close();positive=null;
  // A partial reply is proven to contain flushed HTTP200 plus a prefix,
  // rather than merely any socket failure before response headers.
  positive=await listenHttps({cert,key,entries:entries(),handlerFactory:()=>()=>new Response('{}'),afterResponse:()=> 'partial'});
  const partial=await new Promise((resolve,reject)=>{
   const req=https.request(positive.origin+'/functions/v1/learning-journal/apply',{method:'POST',ca:cert,rejectUnauthorized:true,agent:false,timeout:2000},res=>{
    const parts=[];res.on('data',part=>parts.push(part));res.once('end',()=>reject(new Error('partial-unexpected-complete')));
    res.once('error',()=>resolve({status:res.statusCode,raw:Buffer.concat(parts).toString(),complete:res.complete}));
   });req.once('timeout',()=>req.destroy(new Error('partial-deadline')));req.once('error',reject);req.end('{}');
  });
  assert.deepEqual(partial,{status:200,raw:'{"ok":',complete:false});await positive.close();positive=null;
 });
 await test('L09 closing a held response aborts its callback and reaps tasks',async()=>{
  const successful={listeners_closed:true,sockets_remaining:0,response_tasks_remaining:0};
  for(const [bodyFails,closeFails,pagesFail] of [[true,false,false],[false,true,false],[true,true,false],[false,false,true]]){
   const bodyError=new Error('primary-case'),closeError=new Error('required-close'),order=[];
   const context={pages(){order.push('pages');if(pagesFail)throw new Error('page-enumeration');return []},async close(){order.push('close');if(closeFails)throw closeError}},contexts=new Set([context]);
   const operation=async()=>{let primary;try{if(bodyFails)throw bodyError;return 'case-result'}catch(error){primary=error;throw error}finally{await closeContext(context,contexts,primary)}};
   if(bodyFails||closeFails)await assert.rejects(operation(),error=>error===(bodyFails?bodyError:closeError));
   else assert.equal(await operation(),'case-result');
   assert.deepEqual(order,['pages','close']);assert.equal(contexts.has(context),closeFails);
  }
  for(const failing of [null,'context','browser','negative','server','control','pages']){
   const order=[],context={pages(){order.push('pages');if(failing==='pages')throw new Error('injected-pages');return []},async close(){order.push('context');if(failing==='context')throw new Error('injected-context')}};
   const second={pages(){return []},async close(){order.push('second-context')}};
   const owned={contexts:new Set([context,second])};
   for(const role of ['browser','negative','server','control']){
    owned[role==='control'?'ctl':role]={async close(){order.push(role);if(failing===role)throw new Error('injected-'+role);return successful}};
   }
   const cleanup=await cleanupFixture(owned),failed=failing!==null&&failing!=='pages';
   assert.deepEqual(order,['pages','context','second-context','browser','negative','server','control']);
   assert.equal(cleanup.cleanup_complete,!failed);assert.equal('cleanup_failure' in cleanup,failed);
   assert.deepEqual(cleanup.cleanup,{contexts_closed:failing!=='context',browser_connection_closed:failing!=='browser',control_reaped:failing!=='control',listeners_closed:!['negative','server'].includes(failing),response_tasks_remaining:['negative','server'].includes(failing)?null:0});
   const primary={failure:{name:'PrimaryCaseFailure'},failed_group:'B04'},report={...primary};Object.assign(report,cleanup);
   assert.deepEqual(report.failure,primary.failure);assert.equal(report.failed_group,primary.failed_group);
  }
  let ready,aborted=false,release;const entered=new Promise(resolve=>ready=resolve);
  positive=await listenHttps({cert,key,entries:entries(),handlerFactory:()=>()=>new Response('{}'),afterResponse:(_req,_reply,signal)=>{signal.addEventListener('abort',()=>aborted=true,{once:true});ready();return new Promise(resolve=>release=resolve)}});
  const pending=call(positive.origin,'/functions/v1/learning-journal/apply',{ca:cert,method:'POST',body:'{}'}).catch(error=>({code:error.code}));
  await entered;const closed=await positive.close();positive=null;release(null);await pending;
  assert.equal(aborted,true);assert.deepEqual(closed,{listeners_closed:true,sockets_remaining:0,response_tasks_remaining:0});
  let enteredResolve,holdRelease,client;const atHook=new Promise(resolve=>enteredResolve=resolve);
  positive=await listenHttps({cert,key,entries:entries(),handlerFactory:()=>()=>new Response('{}'),afterResponse:(_request,_reply,_signal,observation)=>{client=observation;enteredResolve();return new Promise(resolve=>holdRelease=resolve)}});
  const req=https.request(positive.origin+'/functions/v1/learning-journal/apply',{method:'POST',ca:cert,rejectUnauthorized:true,agent:false,timeout:2000});
  const clientEnded=new Promise(resolve=>req.once('error',resolve));req.end('{}');await atHook;
  assert.equal(client.aborted,false);req.destroy();await clientEnded;
  const start=performance.now();while(!client.aborted&&performance.now()-start<1000)await new Promise(resolve=>setTimeout(resolve,5));
  assert.equal(client.aborted,true);assert.ok(['request-aborted','response-close'].includes(client.event));holdRelease(null);
  await positive.close();positive=null;
 });
 await test('L10 dropped streaming client cancels native producer',async()=>{
  let cancelled=false;positive=await listenHttps({cert,key,entries:entries(),handlerFactory:()=>()=>new Response(new ReadableStream({pull(c){c.enqueue(new Uint8Array(65536))},cancel(){cancelled=true}}),{headers:{'content-type':'application/json'}})});
  await call(positive.origin,'/functions/v1/learning-journal/apply',{ca:cert,method:'POST',body:'{}',closeAfterHeaders:true});
  const start=performance.now();while(!cancelled&&performance.now()-start<1500)await new Promise(resolve=>setTimeout(resolve,10));assert.equal(cancelled,true);await positive.close();positive=null;
 });
 process.stdout.write(JSON.stringify({status:'NODE LOOPBACK TLS PASS; NO BROWSER OR SQL ACCEPTANCE',groups:checks.length,checks})+'\n');
}catch(error){primaryError=error;throw error}finally{
 const failures=[];
 for(const listener of [positive,negative]){if(listener){try{await listener.close()}catch(error){failures.push(error)}}}
 if(directory){try{assert.equal(dirname(resolve(directory)),resolve(tmpdir()));assert.ok(directory.split(/[\\/]/).at(-1).startsWith('echs-browser-tls-'));await rm(directory,{recursive:true,force:false});}catch(error){failures.push(error)}}
 if(failures.length){
  if(primaryError)process.stderr.write('fixture-cleanup-incomplete\n');
  else throw failures[0];
 }
}
