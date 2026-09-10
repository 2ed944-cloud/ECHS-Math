// Isolated candidate only. These service transports confer no user authorization.
export const BUCKET='private-bank-snapshots',MAX_OBJECT_BYTES=16777216;
export const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
export const HASH=/^[0-9a-f]{64}$/;
export const MIMES=Object.freeze(['application/json','image/svg+xml','image/png','image/jpeg','image/webp','image/gif']);
export class TransportError extends Error{constructor(code){super('Snapshot operation failed');this.name='TransportError';this.code=code;}}
export const fail=code=>{throw new TransportError(code);};
export function closed(value,keys){
 if(!value||typeof value!=='object'||![Object.prototype,null].includes(Object.getPrototypeOf(value)))fail('invalid-shape');
 const d=Object.getOwnPropertyDescriptors(value);
 if(Reflect.ownKeys(d).length!==keys.length||keys.some(k=>!d[k]||!Object.hasOwn(d[k],'value')||!d[k].enumerable))fail('invalid-shape');
 return Object.fromEntries(keys.map(k=>[k,d[k].value]));
}
export function cancelResponse(response){try{void response?.body?.cancel().catch(()=>{});}catch{/* body may already be locked */}}
export function scopeKey(value){const s=closed(value,['organization_id','snapshot_id','file_id']);for(const id of Object.values(s))if(typeof id!=='string'||!UUID.test(id))fail('invalid-scope');return [s.organization_id,s.snapshot_id,s.file_id].join('/');}
export function deadline(signal,timeoutMs){
 const controller=new AbortController();let failure=null,timer;const cleanups=new Set();
 let rejectWait;const stopped=new Promise((_,reject)=>{rejectWait=reject;});void stopped.catch(()=>{});
 function stop(code){if(failure)return;failure=new TransportError(code);controller.abort();for(const clean of cleanups){try{clean();}catch{}}rejectWait(failure);}
 const abort=()=>stop('aborted');signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();
 timer=setTimeout(()=>stop('timeout'),timeoutMs);
 return {signal:controller.signal,
  check(){if(failure)throw failure;},
  cleanup(fn){cleanups.add(fn);return()=>cleanups.delete(fn);},
  async run(promise,late=()=>{}){
   if(failure){void Promise.resolve(promise).then(late,()=>{});throw failure;}
   const p=Promise.resolve(promise);void p.then(v=>{if(failure)late(v);},()=>{});
   const value=await Promise.race([p,stopped]);if(failure){late(value);throw failure;}return value;
  },
  close(){clearTimeout(timer);signal?.removeEventListener('abort',abort);stop('closed');cleanups.clear();}
 };
}
export async function boundedBody(response,limit,ctx,exact=null){
 const length=response.headers.get('content-length');
 if(length!==null&&(!/^(0|[1-9][0-9]*)$/.test(length)||Number(length)>limit||(exact!==null&&Number(length)!==exact)))fail('body-size');
 const encoding=response.headers.get('content-encoding');if(encoding!==null&&encoding!=='identity')fail('body-encoding');
 const reader=response.body?.getReader();if(!reader)fail('body-size');
 let bytes=new Uint8Array(exact??limit),total=0;
 const unwatch=ctx.cleanup(()=>{bytes?.fill(0);try{void reader.cancel().catch(()=>{});}catch{}});
 try{
  while(true){const chunk=await ctx.run(reader.read(),r=>r?.value?.fill?.(0));ctx.check();if(chunk.done)break;
   if(!(chunk.value instanceof Uint8Array)||total+chunk.value.byteLength>limit)fail('body-size');
   bytes.set(chunk.value,total);total+=chunk.value.byteLength;
  }
  if((length!==null&&Number(length)!==total)||(exact!==null&&total!==exact))fail('body-size');
  if(total!==bytes.length){const shorter=bytes.slice(0,total);bytes.fill(0);bytes=shorter;}
  const result=bytes;bytes=null;return result;
 }finally{unwatch();bytes?.fill(0);try{void reader.cancel().catch(()=>{});}catch{}try{reader.releaseLock();}catch{}}
}
function originOf(url){let base;try{base=new URL(url);}catch{throw new TypeError('Fixed service origin required');}
 if(base.protocol!=='https:'||base.username||base.password||base.search||base.hash||base.port||base.pathname!=='/'||!/^[a-z0-9]+\.supabase\.co$/.test(base.hostname))throw new TypeError('Fixed service origin required');return base.origin;}
function configuration({supabaseUrl,serviceKey,fetchImpl=fetch,timeoutMs=5000}){
 const origin=originOf(supabaseUrl);
 if(typeof serviceKey!=='string'||serviceKey.length<20||serviceKey.length>8192||/\s/.test(serviceKey)||typeof fetchImpl!=='function'||!Number.isInteger(timeoutMs)||timeoutMs<1||timeoutMs>30000)throw new TypeError('Bounded service configuration required');
 return {origin,serviceKey,fetchImpl,timeoutMs};
}
function validResponse(response,target){if(!(response instanceof Response)||response.redirected||response.url!==target||response.status>=300&&response.status<400)fail('invalid-upstream');}
async function jsonResponse(response,ctx){
 if(!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(response.headers.get('content-type')||''))fail('invalid-upstream');
 let bytes;try{bytes=await boundedBody(response,131072,ctx);return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes),(k,v)=>{if(typeof v==='number'&&!Number.isFinite(v))fail('invalid-upstream');return v;});}catch(error){if(error instanceof TransportError&&['timeout','aborted'].includes(error.code))throw error;fail('invalid-upstream');}finally{bytes?.fill(0);}
}
/** Exact service-only RPC allowlist; no browser action forwarding. */
export function createSnapshotRpcTransport(options){
 const c=configuration(options);
 return async function rpc(name,args,{signal}={}){
  if(name==='api_session_lookup'){closed(args,['p_token_hash']);}
  else if(name==='private_bank_snapshot_import'){
   closed(args,['p_token_hash','p_action','p_payload']);if(args.p_action!=='status')fail('rpc-action');closed(args.p_payload,['snapshot_id']);
  }else if(name==='private_bank_snapshot_file'){
   closed(args,['p_token_hash','p_action','p_payload']);
   if(args.p_action==='status')closed(args.p_payload,['snapshot_id','file_id']);
   else if(args.p_action==='verify_bytes')closed(args.p_payload,['snapshot_id','request_id','file_id','sha256','byte_length','mime_type']);else fail('rpc-action');
  }else fail('rpc-action');
  if(typeof args.p_token_hash!=='string'||!HASH.test(args.p_token_hash))fail('rpc-action');
  const body=JSON.stringify(args);if(new TextEncoder().encode(body).length>4096)fail('rpc-action');
  const target=c.origin+'/rest/v1/rpc/'+name,ctx=deadline(signal,c.timeoutMs);let response;
  try{
   ctx.check();response=await ctx.run(c.fetchImpl(target,{method:'POST',headers:{apikey:c.serviceKey,authorization:'Bearer '+c.serviceKey,'content-type':'application/json'},
    body,redirect:'error',credentials:'omit',cache:'no-store',signal:ctx.signal}),cancelResponse);
   validResponse(response,target);const value=await jsonResponse(response,ctx);
   if(response.status!==200){const code=typeof value?.code==='string'&&/^[0-9A-Z]{5}$/.test(value.code)?value.code:'upstream';throw new TransportError(code);}
   return value;
  }catch(error){if(error instanceof TransportError)throw error;fail('upstream');}finally{ctx.close();cancelResponse(response);}
 };
}
/** Immutable fixed-bucket/key transport. GET bytes are checked by the handler. */
export function createSnapshotStorageTransport(options){
 const c=configuration(options);
 async function request(method,scope,{bytes,mime,signal}={}){
  const key=scopeKey(scope),target=c.origin+'/storage/v1/object/'+BUCKET+'/'+key;
  if(method==='POST'&&(!(bytes instanceof Uint8Array)||bytes.length<1||bytes.length>MAX_OBJECT_BYTES||!MIMES.includes(mime)))fail('invalid-body');
  const ctx=deadline(signal,c.timeoutMs);let response;
  try{
   ctx.check();response=await ctx.run(c.fetchImpl(target,{method,headers:{apikey:c.serviceKey,authorization:'Bearer '+c.serviceKey,'accept-encoding':'identity',
    ...(method==='POST'?{'content-type':mime,'x-upsert':'false','cache-control':'max-age=0'}:{})},
    ...(method==='POST'?{body:bytes}:{}),signal:ctx.signal,redirect:'error',credentials:'omit',cache:'no-store'}),cancelResponse);
   validResponse(response,target);
   if(method==='GET'){
    if(response.status!==200){cancelResponse(response);fail(response.status===404?'object-missing':'upstream');}
    // The operation deadline transfers to the read stream until handler consumption.
    const original=response;response=null;
    const reader=original.body?.getReader();if(!reader){ctx.close();fail('invalid-upstream');}
    const stream=new ReadableStream({async pull(controller){try{const r=await ctx.run(reader.read(),r=>r?.value?.fill?.(0));ctx.check();if(r.done){controller.close();ctx.close();reader.releaseLock();}else controller.enqueue(r.value);}catch{try{void reader.cancel().catch(()=>{});}catch{}controller.error(new TransportError('upstream'));ctx.close();}},
     cancel(){try{void reader.cancel().catch(()=>{});}catch{}ctx.close();}});
    return new Response(stream,{status:200,headers:original.headers});
   }
   // No upload acknowledgement, including a duplicate or stale acknowledgement,
   // can certify bytes. Only the later authorized fixed-key read-back can do so.
   if(![200,201,400,409,500,502,503,504].includes(response.status))fail('upstream');
   cancelResponse(response);return Object.freeze({acknowledged:response.status===200||response.status===201});
  }catch(error){ctx.close();if(error instanceof TransportError)throw error;fail('upstream');}
  finally{if(method!=='GET'||response){ctx.close();cancelResponse(response);}}
 }
 return Object.freeze({put:(scope,bytes,mime,{signal}={})=>request('POST',scope,{bytes,mime,signal}),get:(scope,{signal}={})=>request('GET',scope,{signal})});
}
