// Native Node TLS/stream tests only. No Chromium, PostgREST or SQL acceptance.
import assert from 'node:assert/strict';
import https from 'node:https';
import {readFile,mkdtemp,mkdir,rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {staticMap,boundedHook,listenHttps} from './https-bridge.mjs';

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
let directory,positive,negative;
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
 });
 await positive.close();positive=null;await negative.close();negative=null;
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
}finally{
 if(positive)await positive.close();if(negative)await negative.close();
 if(directory){assert.equal(dirname(resolve(directory)),resolve(tmpdir()));assert.ok(directory.split(/[\\/]/).at(-1).startsWith('echs-browser-tls-'));await rm(directory,{recursive:true,force:false});}
}
