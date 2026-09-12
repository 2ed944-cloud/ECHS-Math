// Narrow successor listener: exact synthetic /me/config plus unchanged J049.
import https from 'node:https';
import {Readable} from 'node:stream';
import {staticMap,closeTrackedServer} from '../private-learning-browser-journal-http/https-bridge.mjs';
import {waitDrain} from '../private-learning-browser-journal-http/bridge.mjs';
import {readWire} from '../private-learning-browser-journal-http/runtime/wire.mjs';
import {SESSION_PATHS} from './session-fixture.mjs';

const JOURNAL=/^\/functions\/v1\/learning-journal\/(state|apply|operation|heads)$/;
const CSP="default-src 'none'; script-src 'self'; connect-src 'self'; img-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'";
const failure=()=>new Error('session-fixture-closed');
function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no});promise.catch(()=>{});return {promise,resolve,reject}}

// This is an extra fixture mode. The accepted drop/partial/pause modes and
// original cases are untouched. Entered means the native prefix write finished.
export function createBodyHold(){
 const entered=deferred(),aborted=deferred(),gate=deferred(),finished=deferred();let claimed=false,settled=false,cleanupFailed=false,closed=false,released=false,cancelWork=null;
 const cleanupState=()=>Object.freeze({claimed,settled:!claimed||settled,failed:cleanupFailed});
 function close(){if(closed)return;closed=true;const error=failure();entered.reject(error);gate.reject(error);cancelWork?.(error);if(!claimed)finished.resolve(cleanupState())}
 return Object.freeze({entered:entered.promise,aborted:aborted.promise,finished:finished.promise,
  release(){if(closed||released)return;released=true;gate.resolve()},close,
  cleanupState,
  async send(output,response,signal){
   if(claimed||closed||!(response instanceof Response)||!(signal instanceof AbortSignal))throw new Error('session-fixture-hold');claimed=true;
   let timer,writeAbort;const stopped=deferred(),work=new AbortController();
   cancelWork=error=>{work.abort();stopped.reject(error)};
   const abort=()=>{aborted.resolve();stopped.reject(failure());close()};
   signal.addEventListener('abort',abort,{once:true});if(signal.aborted)abort();
   timer=setTimeout(()=>{const error=new Error('session-fixture-body-deadline');stopped.reject(error);entered.reject(error);close()},12000);
   const run=(async()=>{
    if(signal.aborted||closed)throw failure();
    const raw=await readWire(response.body,{signal:work.signal,timeoutMs:3000});
    if(signal.aborted||closed)throw failure();const bytes=Buffer.from(raw);
    if(!bytes.length)throw new Error('session-fixture-empty-body');
    await new Promise((resolve,reject)=>{
     writeAbort=()=>reject(failure());work.signal.addEventListener('abort',writeAbort,{once:true});
     if(work.signal.aborted){writeAbort();return}
     output.write(bytes.subarray(0,1),error=>error?reject(new Error('session-fixture-prefix-write')):resolve());
    });
    work.signal.removeEventListener('abort',writeAbort);writeAbort=null;
    if(signal.aborted||closed)throw failure();entered.resolve();
    await gate.promise;if(signal.aborted||closed)throw failure();
    if(bytes.length>1&&!output.write(bytes.subarray(1)))await waitDrain(output,work.signal);
   })();run.catch(()=>{});
   let primary;
   try{await Promise.race([run,stopped.promise])}
   catch(error){primary=error;entered.reject(new Error('session-fixture-hold-failed'));close();throw error}
   finally{
    clearTimeout(timer);signal.removeEventListener('abort',abort);if(writeAbort)work.signal.removeEventListener('abort',writeAbort);cancelWork=null;work.abort();
    let limit;
    try{await Promise.race([run.then(()=>{},()=>{}),new Promise((_,reject)=>limit=setTimeout(()=>reject(new Error('session-fixture-hold-cleanup-deadline')),1000))]);settled=true}
    catch(error){cleanupFailed=true;if(!primary)throw error}
    finally{clearTimeout(limit);finished.resolve(cleanupState())}
   }
  },
 });
}

export async function listenSessionHttps({key,cert,entries,handlerFactory,sessionFactory,selectBodyHold=()=>null}){
 if(!Buffer.isBuffer(key)||!Buffer.isBuffer(cert)||key.length>65536||cert.length>65536||typeof handlerFactory!=='function'||typeof sessionFactory!=='function'||typeof selectBodyHold!=='function')throw new Error('session-fixture-config');
 const routes=staticMap(entries),sockets=new Set(),tasks=new Set(),controllers=new Set(),holds=new Set();
 if(Object.values(SESSION_PATHS).some(path=>routes.has(path)))throw new Error('session-fixture-static-shadow');
 const metrics={requests:0,static:0,config:0,me:0,journal:0,responses:0,aborted:0,rejected:0};
 let origin,handler,session,closing=false,closePromise,holdCleanupFailed=false;
 const server=https.createServer({key,cert,minVersion:'TLSv1.2'},(req,res)=>{
  const task=handle(req,res);tasks.add(task);void task.finally(()=>tasks.delete(task));
 });
 async function handle(req,res){
  metrics.requests++;const controller=new AbortController();controllers.add(controller);let reply;
  const abort=()=>{if(!controller.signal.aborted){metrics.aborted++;controller.abort()}};
  const close=()=>{if(!res.writableEnded)abort()};req.once('aborted',abort);res.once('close',close);
  try{
   if(closing||!origin||typeof req.url!=='string'||!req.url.startsWith('/')||req.url.startsWith('//'))throw failure();
   const path=req.url;
   if(req.method==='GET'&&routes.has(path)){
    const row=routes.get(path);metrics.static++;res.writeHead(200,{'content-type':row.type,'content-length':row.body.length,'cache-control':'no-store','content-security-policy':CSP,'x-content-type-options':'nosniff','referrer-policy':'no-referrer'});res.end(row.body);metrics.responses++;return;
   }
   const profile=path===SESSION_PATHS.me,configuration=path===SESSION_PATHS.config,journal=JOURNAL.test(path);
   if(!(profile||configuration||journal)||journal&&!['POST','OPTIONS'].includes(req.method)||!journal&&req.method!=='GET'){
    metrics.rejected++;res.writeHead(404,{'content-type':'application/json','cache-control':'no-store'});res.end('{"ok":false}');return;
   }
   const headers=new Headers();for(let i=0;i<req.rawHeaders.length;i+=2)headers.append(req.rawHeaders[i],req.rawHeaders[i+1]);
   const options={method:req.method,headers,signal:controller.signal};if(req.method==='POST')Object.assign(options,{body:Readable.toWeb(req),duplex:'half'});
   const request=new Request(origin+path,options);
   if(journal){metrics.journal++;reply=await handler(request)}else{metrics[profile?'me':'config']++;reply=session.response(request)}
   if(!(reply instanceof Response)||controller.signal.aborted||res.destroyed)throw failure();
   const hold=selectBodyHold(request,reply);
   if(hold!==null&&(!hold||typeof hold.send!=='function'||typeof hold.close!=='function'||typeof hold.cleanupState!=='function'))throw new Error('session-fixture-hold');
   res.writeHead(reply.status,Object.fromEntries(reply.headers));
   if(hold){holds.add(hold);try{await hold.send(res,reply,controller.signal)}finally{
    try{const state=hold.cleanupState();if(!state||Object.keys(state).sort().join(',')!=='claimed,failed,settled'||state.claimed!==true||state.settled!==true||state.failed!==false)holdCleanupFailed=true}catch{holdCleanupFailed=true}
    holds.delete(hold);
   }}
   else if(reply.body){for await(const part of Readable.fromWeb(reply.body)){if(!res.write(part))await waitDrain(res,controller.signal)}}
   if(controller.signal.aborted||res.destroyed)throw failure();res.end();metrics.responses++;
  }catch{
   if(!res.headersSent&&!res.destroyed){res.writeHead(502,{'content-type':'application/json','cache-control':'no-store'});res.end('{"ok":false,"error":{"code":"fixture-adapter-failed"}}')}else res.destroy();
  }finally{
   controller.abort();controllers.delete(controller);req.removeListener('aborted',abort);res.removeListener('close',close);
   try{if(reply?.body&&!reply.body.locked)await reply.body.cancel()}catch{}
  }
 }
 server.requestTimeout=12000;server.headersTimeout=5000;server.keepAliveTimeout=1000;server.maxHeadersCount=32;
 server.on('connection',socket=>{sockets.add(socket);socket.once('close',()=>sockets.delete(socket))});server.on('tlsClientError',()=>{});
 try{
  await new Promise((resolve,reject)=>{const fail=error=>{server.removeListener('listening',ready);reject(error)},ready=()=>{server.removeListener('error',fail);resolve()};server.once('error',fail);server.once('listening',ready);server.listen(0,'127.0.0.1')});
  origin='https://127.0.0.1:'+server.address().port;handler=handlerFactory(origin);session=sessionFactory(origin);
  if(typeof handler!=='function'||!session||typeof session.response!=='function'||typeof session.close!=='function')throw new Error('session-fixture-handler');
 }catch(error){
  try{session?.close()}catch{}
  try{await closeTrackedServer(server,sockets,tasks,controllers)}catch{}
  throw error;
 }
 return Object.freeze({origin,metrics,session,close(){
  closing=true;return closePromise??=(async()=>{
   let failed=false,result;for(const hold of holds){try{hold.close()}catch{failed=true}}
   try{result=await closeTrackedServer(server,sockets,tasks,controllers)}catch{failed=true}
   try{session.close()}catch{failed=true}
   if(failed||holdCleanupFailed)throw new Error('session-fixture-cleanup-failed');return result;
  })();
 }});
}
