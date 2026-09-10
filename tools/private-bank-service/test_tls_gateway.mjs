// Real loopback HTTP/TLS only; the upstream echo is explicitly synthetic, not Storage.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import https from 'node:https';
import crypto from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {HOST,openGateway,targetFor} from './tls-gateway.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const [secretDir,reportPath]=process.argv.slice(2);
assert(secretDir&&reportPath&&path.dirname(path.resolve(reportPath))===path.join(here,'results'));
await assert.rejects(fs.stat(reportPath),{code:'ENOENT'});
const ca=await fs.readFile(path.join(secretDir,'ca.pem')),cert=await fs.readFile(path.join(secretDir,'server.pem')),key=await fs.readFile(path.join(secretDir,'server-key.pem'));
const certificate=new crypto.X509Certificate(cert);assert.equal(certificate.checkHost(HOST),HOST);
let calls=0,mode='echo',observed;
const sockets=new Set();
const backend=http.createServer(async(req,res)=>{calls++;let chunks=[];for await(const chunk of req)chunks.push(chunk);observed={method:req.method,path:req.url,bytes:Buffer.concat(chunks),headers:req.headers};
 if(mode==='redirect'){res.writeHead(302,{location:'https://example.invalid/'});res.end();return;}
 if(mode==='stall')return;
 res.writeHead(200,{'content-type':'application/json','x-fixture-service':'synthetic-http','content-encoding':'identity'});res.end(observed.bytes.length?observed.bytes:Buffer.from('{"synthetic":true}'));});
backend.on('connection',s=>{sockets.add(s);s.once('close',()=>sockets.delete(s));});
await new Promise(resolve=>backend.listen(0,'127.0.0.1',resolve));
const gateway=await openGateway({cert,key,restPort:backend.address().port,storagePort:backend.address().port,timeoutMs:250});
const rpc='/rest/v1/rpc/private_bank_snapshot_capabilities';
const object='/storage/v1/object/private-bank-snapshots/'+['11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333'].join('/');
function request({url=rpc,body=Buffer.from('{}'),method='POST',hostname=HOST,trust=ca,host=HOST,extra={}}={}){
 return new Promise((resolve,reject)=>{const r=https.request({hostname,port:gateway.port,servername:hostname,ca:trust,rejectUnauthorized:true,
   lookup:(name,options,cb)=>{assert.equal(name,hostname);if(options.all)cb(null,[{address:'127.0.0.1',family:4}]);else cb(null,'127.0.0.1',4);},method,path:url,headers:{host,'content-type':'application/json','content-length':body.length,...extra},agent:false},res=>{
    const authorized=res.socket.authorized;const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,bytes:Buffer.concat(chunks),authorized}));res.on('error',reject);
   });r.setTimeout(1500,()=>r.destroy(new Error('Fixture client timeout')));r.on('error',reject);r.end(body);});
}
const groups=[];async function group(name,fn){try{await fn();groups.push({name,status:'PASS'});}catch(error){groups.push({name,status:'FAIL',error_type:error.constructor.name});}}
try{
 await group('trusted generated CA and exact SAN complete a real TLS handshake',async()=>{let r=await request();assert.equal(r.status,200);assert.equal(r.authorized,true);assert.deepEqual(r.bytes,Buffer.from('{}'));assert.equal(r.headers['x-fixture-service'],'synthetic-http');});
 await group('untrusted CA fails before the upstream request',async()=>{let n=calls;await assert.rejects(request({trust:null}));assert.equal(calls,n);});
 await group('wrong certificate hostname fails before the upstream request',async()=>{let n=calls;await assert.rejects(request({hostname:'other.supabase.co'}));assert.equal(calls,n);});
 await group('host and path spoofing cannot turn fixture into a forward proxy',async()=>{let n=calls;for(const opts of [{host:'other.supabase.co'},{url:'https://example.invalid/'},{url:'/rest/v1/rpc/unknown'},{url:rpc+'?redirect=x'},{url:'/storage/v1/object/%2e%2e/x'}])assert.equal((await request(opts)).status,400);assert.equal(calls,n);});
 await group('fixed Storage path, MIME and bytes cross genuine HTTP sockets unchanged',async()=>{const bytes=crypto.randomBytes(4097);let r=await request({url:object,body:bytes,extra:{'content-type':'image/png','x-upsert':'false','authorization':'Bearer synthetic-only','cookie':'must-not-forward'}});assert.equal(r.status,200);assert.deepEqual(r.bytes,bytes);assert.deepEqual(observed.bytes,bytes);assert.equal(observed.path,object.slice('/storage/v1'.length));assert.equal(observed.headers['x-upsert'],'false');assert.equal(observed.headers.cookie,undefined);assert.equal(observed.headers.authorization,'Bearer synthetic-only');});
 await group('upstream redirect is refused without following any target',async()=>{mode='redirect';try{assert.equal((await request()).status,502);}finally{mode='echo';}});
 await group('oversized RPC request is rejected before the service socket',async()=>{let n=calls;assert.equal((await request({body:Buffer.alloc(4097)})).status,413);assert.equal(calls,n);});
 await group('real stalled upstream is bounded and loses its socket',async()=>{mode='stall';try{let start=Date.now();assert.equal((await request()).status,504);assert(Date.now()-start<1400);}finally{mode='echo';}});
 await group('configuration and pure target checks reject unexpected services',async()=>{assert.equal(targetFor('POST','/rest/v1/rpc/evil'),null);await assert.rejects(openGateway({cert,key,restPort:'443',storagePort:123}));await assert.rejects(openGateway({cert,key,restPort:123,storagePort:123,listenPort:-1}));});
 await group('gateway disposal closes live sockets and rejects subsequent access',async()=>{await gateway.close();await gateway.close();await assert.rejects(request());});
}finally{await gateway.close();for(const s of sockets)s.destroy();await new Promise(resolve=>backend.close(resolve));key.fill(0);}
const source_sha256={};for(const name of ['tls-gateway.mjs','test_tls_gateway.mjs','generate_tls.py'])source_sha256[name]=crypto.createHash('sha256').update(await fs.readFile(path.join(here,name))).digest('hex');
const report={contract:'echs.c08.tls-gateway-tests.v1',status:groups.every(g=>g.status==='PASS')?'PASS':'FAIL',passed:groups.filter(g=>g.status==='PASS').length,total:groups.length,groups,source_sha256,
 actual_tls_sockets:true,certificate_verification:true,hostname_verification:true,upstream:'SYNTHETIC_HTTP_ONLY',storage_service_executed:false,postgrest_service_executed:false,production_calls:false};
await fs.mkdir(path.dirname(reportPath),{recursive:true});await fs.writeFile(reportPath,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:report.status,passed:report.passed,total:report.total,actual_tls_sockets:true,actual_storage_service:false}));if(report.status!=='PASS')process.exitCode=1;
