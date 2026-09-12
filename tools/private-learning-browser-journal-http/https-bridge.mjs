// Isolated loopback TLS fixture. Fixed static buffers and unchanged native J049.
import https from 'node:https';
import {Readable} from 'node:stream';
import {waitDrain} from './bridge.mjs';

const API=/^\/functions\/v1\/learning-journal\/(state|apply|operation|heads)$/;
const STATIC=/^\/[A-Za-z0-9_./-]*$/;
const TYPES=new Set(['text/html; charset=utf-8','text/javascript; charset=utf-8','image/x-icon']);
const CSP="default-src 'none'; script-src 'self'; connect-src 'self'; img-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'";
const closedError=()=>new Error('fixture-client-closed');

export function staticMap(entries){
 if(!Array.isArray(entries)||entries.length<2||entries.length>16)throw new Error('fixture-static-count');
 const result=new Map();
 for(const row of entries){
  if(!row||Object.keys(row).sort().join(',')!=='body,path,type'||typeof row.path!=='string'||!STATIC.test(row.path)||row.path.includes('..')||row.path.includes('//')||API.test(row.path)||result.has(row.path)||!TYPES.has(row.type)||!(row.body instanceof Uint8Array)||row.body.byteLength>1048576)throw new Error('fixture-static-entry');
  result.set(row.path,{type:row.type,body:Buffer.from(row.body)});
 }
 if(!result.has('/')||!result.has('/browser-page.mjs'))throw new Error('fixture-static-required');
 return result;
}

export function boundedHook(hook,request,response,signal,timeoutMs=8000,client=null){
 if(typeof hook!=='function'||!Number.isInteger(timeoutMs)||timeoutMs<1||timeoutMs>8000)throw new Error('fixture-hook');
 return new Promise((resolve,reject)=>{
  let alive=true;
  const finish=(fn,value)=>{if(!alive)return;alive=false;clearTimeout(timer);signal.removeEventListener('abort',abort);fn(value);};
  const abort=()=>finish(reject,closedError());
  const timer=setTimeout(()=>finish(reject,new Error('fixture-hook-deadline')),timeoutMs);
  signal.addEventListener('abort',abort,{once:true});
  if(signal.aborted){abort();return;}
  Promise.resolve().then(()=>{if(!alive)throw closedError();return hook(request,response,signal,client)}).then(value=>finish(resolve,value),error=>finish(reject,error));
 });
}

export function flushPrefix(response,signal){
 return new Promise((resolve,reject)=>{
  let active=true;
  const done=(error)=>{if(!active)return;active=false;clearTimeout(timer);signal.removeEventListener('abort',abort);response.removeListener('close',abort);error?reject(error):resolve()};
  const abort=()=>done(closedError()),timer=setTimeout(()=>done(new Error('fixture-prefix-deadline')),1000);
  signal.addEventListener('abort',abort,{once:true});response.once('close',abort);
  if(signal.aborted||response.destroyed){abort();return;}
  response.flushHeaders();response.write('{"ok":',error=>done(error));
 });
}

export async function closeTrackedServer(server,sockets,tasks,controllers,timeoutMs=2000){
 if(!Number.isInteger(timeoutMs)||timeoutMs<1||timeoutMs>2000)throw new Error('fixture-close-config');
 const listeners=[],failures=[];let timer;
 // server.close's callback can run before destroyed TLS sockets emit close.
 // Subscribe before destruction and wait for those actual events, not a delay.
 const socketClosures=[...sockets].map(socket=>new Promise(resolve=>{
  const closed=()=>resolve();listeners.push([socket,closed]);socket.once('close',closed);
 }));
 try{
  const deadline=new Promise((_,reject)=>timer=setTimeout(()=>reject(new Error('fixture-close-deadline')),timeoutMs));
  for(const controller of controllers){try{controller.abort()}catch(error){failures.push(error)}}
  for(const socket of sockets){try{socket.destroy()}catch(error){failures.push(error)}}
  const serverClosed=new Promise(resolve=>{
   try{server.close(error=>{if(error&&error.code!=='ERR_SERVER_NOT_RUNNING')failures.push(error);resolve()})}
   catch(error){failures.push(error);resolve()}
  });
  const work=Promise.all([...tasks].map(task=>Promise.resolve(task).catch(error=>failures.push(error))));
  await Promise.race([Promise.all([serverClosed,work,...socketClosures]),deadline]);
  if(failures.length)throw new Error('fixture-close-operation-failed');
  if(sockets.size||tasks.size||controllers.size||server.listening)throw new Error('fixture-listener-not-closed');
  return {listeners_closed:true,sockets_remaining:0,response_tasks_remaining:0};
 }finally{
  clearTimeout(timer);for(const [socket,closed] of listeners)socket.removeListener('close',closed);
 }
}

export async function listenHttps({key,cert,entries,handlerFactory,afterResponse=async()=>null,hookTimeoutMs=8000}){
 if(!Buffer.isBuffer(key)||!Buffer.isBuffer(cert)||key.length>65536||cert.length>65536||typeof handlerFactory!=='function')throw new Error('fixture-tls-config');
 const routes=staticMap(entries),sockets=new Set(),tasks=new Set(),controllers=new Set();
 const metrics={requests:0,static:0,api:0,responses:0,dropped:0,aborted:0,rejected:0};
 let origin,handler,closing=false,closePromise;
 const server=https.createServer({key,cert,minVersion:'TLSv1.2'},(req,res)=>{
  const task=handle(req,res);tasks.add(task);void task.finally(()=>tasks.delete(task));
 });
 async function handle(req,res){
  metrics.requests++;const controller=new AbortController();controllers.add(controller);
  const client={aborted:false,event:null};
  const abort=event=>{client.aborted=true;client.event=event;if(!controller.signal.aborted){metrics.aborted++;controller.abort();}};
  const requestAborted=()=>abort('request-aborted'),close=()=>{if(!res.writableEnded)abort('response-close')};
  req.once('aborted',requestAborted);res.once('close',close);let reply;
  try{
   if(closing||!origin||typeof req.url!=='string'||!req.url.startsWith('/')||req.url.startsWith('//'))throw new Error('fixture-target');
   const path=req.url;
   if(req.method==='GET'&&routes.has(path)){
    const row=routes.get(path);metrics.static++;
    res.writeHead(200,{'content-type':row.type,'content-length':row.body.length,'cache-control':'no-store','content-security-policy':CSP,'x-content-type-options':'nosniff','referrer-policy':'no-referrer'});
    res.end(row.body);metrics.responses++;return;
   }
   if(!API.test(path)||!['POST','OPTIONS'].includes(req.method)){metrics.rejected++;res.writeHead(404,{'content-type':'application/json','cache-control':'no-store'});res.end('{"ok":false}');return;}
   metrics.api++;
   const headers=new Headers();for(let i=0;i<req.rawHeaders.length;i+=2)headers.append(req.rawHeaders[i],req.rawHeaders[i+1]);
   const options={method:req.method,headers,signal:controller.signal};
   if(req.method==='POST')Object.assign(options,{body:Readable.toWeb(req),duplex:'half'});
   const request=new Request(origin+path,options);
   reply=await handler(request);
   const fault=await boundedHook(afterResponse,request,reply,controller.signal,hookTimeoutMs,client);
   if(fault!==null&&!['drop','partial','207'].includes(fault))throw new Error('fixture-fault');
   if(controller.signal.aborted||res.destroyed)throw closedError();
   if(fault==='drop'){metrics.dropped++;res.destroy();return;}
   if(fault==='partial'){metrics.dropped++;res.writeHead(200,{'content-type':'application/json','content-length':'1048576','cache-control':'no-store'});await flushPrefix(res,controller.signal);res.destroy();return;}
   res.writeHead(fault==='207'?207:reply.status,Object.fromEntries(reply.headers));
   if(reply.body){for await(const part of Readable.fromWeb(reply.body)){if(!res.write(part))await waitDrain(res,controller.signal);}}
   res.end();metrics.responses++;
  }catch{
   if(!res.headersSent&&!res.destroyed){res.writeHead(502,{'content-type':'application/json','cache-control':'no-store'});res.end('{"ok":false,"error":{"code":"fixture-adapter-failed"}}');}else res.destroy();
  }finally{
   controller.abort();controllers.delete(controller);req.removeListener('aborted',requestAborted);res.removeListener('close',close);
   try{if(reply?.body&&!reply.body.locked)await reply.body.cancel()}catch{}
  }
 }
 server.requestTimeout=12000;server.headersTimeout=5000;server.keepAliveTimeout=1000;server.maxHeadersCount=32;
 server.on('connection',socket=>{sockets.add(socket);socket.once('close',()=>sockets.delete(socket))});
 server.on('tlsClientError',()=>{});
 try{
  await new Promise((resolve,reject)=>{const fail=error=>{server.removeListener('listening',ready);reject(error)},ready=()=>{server.removeListener('error',fail);resolve()};server.once('error',fail);server.once('listening',ready);server.listen(0,'127.0.0.1')});
  origin='https://127.0.0.1:'+server.address().port;handler=handlerFactory(origin);if(typeof handler!=='function')throw new Error('fixture-handler');
 }catch(error){for(const socket of sockets)socket.destroy();if(server.listening)await new Promise(resolve=>server.close(resolve));throw error;}
 return {origin,metrics,close:()=>{
  closing=true;return closePromise??=closeTrackedServer(server,sockets,tasks,controllers);
 }};
}
