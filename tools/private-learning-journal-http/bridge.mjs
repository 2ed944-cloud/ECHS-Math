// Fixture-only native HTTP adapter; no deployment entrypoint or environment read.
import http from 'node:http';
import {Readable} from 'node:stream';
import {isIP} from 'node:net';

export const FIXTURE_ORIGIN='https://abcdefghijklmnopqrst.supabase.co';
const RPC=/^\/rest\/v1\/rpc\/learning_journal_(state|apply|operation|heads)$/;
export function postgrestPort(restOrigin,{fetchImpl=fetch,observe=()=>{}}={}){
 const target=new URL(restOrigin),parts=target.hostname.split('.').map(Number);
 const privateIp=isIP(target.hostname)===4&&(parts[0]===10||parts[0]===127||parts[0]===172&&parts[1]>=16&&parts[1]<=31||parts[0]===192&&parts[1]===168);
 if(target.protocol!=='http:'||target.port!=='3000'||target.origin!==restOrigin||target.pathname!=='/'||target.search||target.hash||target.username||target.password||!privateIp)throw new Error('fixture-target');
 return async(url,options)=>{
  const source=new URL(url);if(source.origin!==FIXTURE_ORIGIN||!RPC.test(source.pathname)||source.search||source.hash||options.method!=='POST'||options.redirect!=='error'||options.cache!=='no-store')throw new Error('fixture-route');
  const response=await fetchImpl(restOrigin+'/rpc/'+source.pathname.split('/').at(-1),options);
  observe({route:source.pathname.split('/').at(-1),status:response.status});return response;
 };
}

export function waitDrain(response,signal){
 return new Promise((resolve,reject)=>{
  const cleanup=()=>{response.removeListener('drain',drain);response.removeListener('close',close);response.removeListener('error',close);signal.removeEventListener('abort',close);};
  const drain=()=>{cleanup();resolve();},close=()=>{cleanup();reject(new Error('client-closed'));};
  response.once('drain',drain);response.once('close',close);response.once('error',close);signal.addEventListener('abort',close,{once:true});
  if(response.destroyed||signal.aborted)close();
 });
}

export async function listen(handler,{afterResponse=async()=>null}={}){
 const sockets=new Set(),metrics={requests:0,responses:0,dropped:0};
 const server=http.createServer(async(req,res)=>{
  metrics.requests++;const controller=new AbortController();const abort=()=>controller.abort();
  req.once('aborted',abort);res.once('close',()=>{if(!res.writableEnded)abort();});
  try{
   if(!req.url?.startsWith('/')||req.url.startsWith('//'))throw new Error('request-target');
   const headers=new Headers();for(let i=0;i<req.rawHeaders.length;i+=2)headers.append(req.rawHeaders[i],req.rawHeaders[i+1]);
   const options={method:req.method,headers,signal:controller.signal};if(req.method!=='GET'&&req.method!=='HEAD')Object.assign(options,{body:Readable.toWeb(req),duplex:'half'});
   const request=new Request('http://127.0.0.1:'+server.address().port+req.url,options);
   const reply=await handler(request),fault=await afterResponse(request,reply);
   if(fault==='drop'){metrics.dropped++;res.destroy();return;}
   if(fault==='partial'){metrics.dropped++;res.writeHead(200,{'content-type':'application/json'});res.write('{"ok":');res.destroy();return;}
   res.writeHead(fault==='207'?207:reply.status,Object.fromEntries(reply.headers));
   if(reply.body){for await(const part of Readable.fromWeb(reply.body)){if(!res.write(part))await waitDrain(res,controller.signal);}}
   res.end();metrics.responses++;
  }catch{if(!res.headersSent&&!res.destroyed){res.writeHead(502,{'content-type':'application/json','cache-control':'no-store'});res.end('{"ok":false,"error":{"code":"fixture-adapter-failed"}}');}else res.destroy();}
  finally{req.removeListener('aborted',abort);}
 });
 server.requestTimeout=12000;server.headersTimeout=5000;server.keepAliveTimeout=1000;server.maxHeadersCount=32;
 server.on('connection',socket=>{sockets.add(socket);socket.once('close',()=>sockets.delete(socket));});
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 return {origin:'http://127.0.0.1:'+server.address().port,metrics,close:async()=>{for(const socket of sockets)socket.destroy();await new Promise(resolve=>server.close(resolve));}};
}
