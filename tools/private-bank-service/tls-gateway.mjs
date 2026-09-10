// Isolated socket fixture, not a production proxy. No credential/body logging.
import http from 'node:http';
import https from 'node:https';
import {Transform} from 'node:stream';
import {pipeline} from 'node:stream/promises';

export const HOST='echsc08servicetest.supabase.co';
const UUID='[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';
const OBJECT=new RegExp('^/storage/v1/object/(?:public/)?private-bank-snapshots/'+UUID+'/'+UUID+'/'+UUID+'$');
const RPC=/^\/rest\/v1\/rpc\/(api_session_lookup|private_bank_snapshot_import|private_bank_snapshot_file|private_bank_snapshot_capabilities)$/;
const REQUEST_HEADERS=new Set(['authorization','apikey','content-type','content-length','content-encoding','x-upsert','cache-control','accept','accept-encoding']);
const HOP=new Set(['connection','keep-alive','proxy-authenticate','proxy-authorization','te','trailer','transfer-encoding','upgrade','set-cookie']);
const need=(value)=>{if(!value)throw new TypeError('Invalid isolated gateway configuration');};
const port=(n)=>Number.isInteger(n)&&n>0&&n<=65535;

export function targetFor(method,path){
 if(typeof method!=='string'||typeof path!=='string'||path.includes('?')||path.includes('#')||path.includes('%')||path.includes('\\'))return null;
 if(method==='POST'&&RPC.test(path))return {service:'rest',path:path.slice('/rest/v1'.length),limit:131072,bodyLimit:4096};
 if(OBJECT.test(path)&&['GET','POST','DELETE','PUT'].includes(method))return {service:'storage',path:path.slice('/storage/v1'.length),limit:16777216,bodyLimit:16777216};
 if(method==='POST'&&path==='/storage/v1/object/list/private-bank-snapshots')return {service:'storage',path:'/object/list/private-bank-snapshots',limit:131072,bodyLimit:4096};
 if(['GET','PUT'].includes(method)&&path==='/storage/v1/bucket/private-bank-snapshots')return {service:'storage',path:'/bucket/private-bank-snapshots',limit:131072,bodyLimit:method==='PUT'?4096:0};
 return null;
}

function bound(limit,counter){let count=0;return new Transform({transform(chunk,_encoding,done){count+=chunk.length;if(count>limit){done(new Error('Bounded fixture stream'));return;}counter(chunk.length);done(null,chunk);}});}

export async function openGateway({cert,key,restPort,storagePort,listenPort=0,timeoutMs=20000}){
 need(Buffer.isBuffer(cert)&&Buffer.isBuffer(key)&&port(restPort)&&port(storagePort));
 need(Number.isInteger(listenPort)&&listenPort>=0&&listenPort<=65535&&Number.isInteger(timeoutMs)&&timeoutMs>=20&&timeoutMs<=30000);
 const upstream={rest:restPort,storage:storagePort};
 const sockets=new Set(),requests=new Set();
 const counts={rest_requests:0,storage_requests:0,denied:0,upstream_errors:0,request_bytes:0,response_bytes:0};
 let closed=false;
 const server=https.createServer({cert,key,minVersion:'TLSv1.2',maxHeaderSize:16384,requestTimeout:timeoutMs,headersTimeout:Math.min(timeoutMs,10000)},(req,res)=>{
  const reject=(status=400)=>{counts.denied++;if(!res.headersSent)res.writeHead(status,{'content-type':'application/json','cache-control':'no-store','connection':'close'});res.end('{"error":"fixture_gateway_rejected"}');req.resume();};
  const target=targetFor(req.method,req.url);
  if(closed||req.socket.remoteAddress!=='127.0.0.1'||req.socket.servername!==HOST||req.headers.host!==HOST||!target)return reject();
  for(const name of ['host','authorization','apikey'])if((req.headersDistinct[name]?.length||0)>1)return reject();
  const length=req.headers['content-length'];
  if(length!==undefined&&(!/^(0|[1-9][0-9]*)$/.test(length)||Number(length)>target.bodyLimit))return reject(413);
  const headers={};for(const [name,value]of Object.entries(req.headers))if(REQUEST_HEADERS.has(name))headers[name]=value;
  counts[target.service+'_requests']++;
  let response,settled=false;
  const outgoing=http.request({hostname:'127.0.0.1',port:upstream[target.service],method:req.method,path:target.path,headers,agent:false});
  requests.add(outgoing);
  const cancel=()=>{outgoing.destroy();response?.destroy();};
  const timer=setTimeout(()=>{if(!res.headersSent){res.writeHead(504,{'content-type':'application/json','connection':'close'});res.end('{"error":"fixture_gateway_timeout"}');}else res.destroy();cancel();},timeoutMs);
  const finish=()=>{if(settled)return;settled=true;clearTimeout(timer);requests.delete(outgoing);req.off('aborted',cancel);res.off('close',cancel);};
  req.once('aborted',cancel);res.once('close',cancel);res.once('finish',finish);res.once('close',finish);
  outgoing.once('response',async incoming=>{
   response=incoming;
   if(incoming.statusCode>=300&&incoming.statusCode<400){incoming.destroy();reject(502);finish();return;}
   const incomingLength=incoming.headers['content-length'];
   if(incomingLength!==undefined&&(!/^(0|[1-9][0-9]*)$/.test(incomingLength)||Number(incomingLength)>target.limit)){incoming.destroy();reject(502);finish();return;}
   const responseHeaders={};for(const [name,value]of Object.entries(incoming.headers))if(!HOP.has(name))responseHeaders[name]=value;
   responseHeaders['cache-control']='no-store';
   res.writeHead(incoming.statusCode,responseHeaders);
   try{await pipeline(incoming,bound(target.limit,n=>{counts.response_bytes+=n;}),res);}catch{counts.upstream_errors++;res.destroy();}finally{finish();}
  });
  outgoing.once('error',()=>{counts.upstream_errors++;if(!res.headersSent)reject(502);else res.destroy();finish();});
  void pipeline(req,bound(target.bodyLimit,n=>{counts.request_bytes+=n;}),outgoing).catch(()=>{counts.upstream_errors++;cancel();if(!res.headersSent)reject(502);else res.destroy();finish();});
 });
 server.on('connection',socket=>{sockets.add(socket);socket.once('close',()=>sockets.delete(socket));});
 server.on('tlsClientError',()=>{});
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(listenPort,'127.0.0.1',()=>{server.off('error',reject);resolve();});});
 return Object.freeze({port:server.address().port,counts:()=>Object.freeze({...counts}),
  async close(){if(closed)return;closed=true;for(const r of requests)r.destroy();for(const s of sockets)s.destroy();await new Promise(resolve=>server.close(resolve));}});
}
