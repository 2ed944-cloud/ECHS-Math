// Local candidate: exact registered bytes only. No record receipt or readiness API.
import {TransportError,UUID,HASH,MIMES,MAX_OBJECT_BYTES,closed,fail,deadline,boundedBody,cancelResponse} from './transport.mjs';
const STORE='echs.private-bank.snapshot-store.v1',CONTRACT='echs.private-bank.snapshot-transport.v1';
const encoder=new TextEncoder();
const id=v=>typeof v==='string'&&UUID.test(v),hash=v=>typeof v==='string'&&HASH.test(v);
const integer=(v,max)=>Number.isSafeInteger(v)&&v>=0&&v<=max;
const date=v=>typeof v==='string'&&v.length<=64&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,6})?(?:Z|[+-]\d\d:\d\d)$/.test(v)&&Number.isFinite(Date.parse(v));
async function digest(bytes){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');}
function sessionProjection(value,now){
 if(!Array.isArray(value)||value.length!==1)fail('28000');
 const row=closed(value[0],['session_id','account_id','organization_id','username','display_name','email','role','status','grade','can_manage_accounts','organization_name','organization_settings','expires_at']);
 if(!id(row.session_id)||!id(row.account_id)||!id(row.organization_id)||!date(row.expires_at)||Date.parse(row.expires_at)<=now())fail('28000');
 if(row.status!=='active')fail('28000');if(row.role!=='admin')fail('42501');
 return Object.freeze({session_id:row.session_id,account_id:row.account_id,organization_id:row.organization_id,expires_at:row.expires_at});
}
function storeProjection(value,session,snapshot){
 const row=closed(value,['ok','contract','account_id','organization_id','snapshot_id','state','reused','manifest_sha256','bank_codes','counts']);
 if(row.ok!==true||row.contract!==STORE||row.account_id!==session.account_id||row.organization_id!==session.organization_id||row.snapshot_id!==snapshot||!['staging','ready','aborted'].includes(row.state)||typeof row.reused!=='boolean'||!hash(row.manifest_sha256))fail('invalid-scope');
 if(!Array.isArray(row.bank_codes)||row.bank_codes.length<1||row.bank_codes.length>100||new Set(row.bank_codes).size!==row.bank_codes.length||row.bank_codes.some(b=>typeof b!=='string'||! /^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/.test(b)))fail('invalid-upstream');
 const counts=closed(row.counts,['questions','files','verified_files','verified_sources']);if(Object.values(counts).some(n=>!integer(n,1000000)))fail('invalid-upstream');
 if(counts.verified_files>counts.files||counts.verified_sources>counts.verified_files)fail('invalid-upstream');
 return Object.freeze({state:row.state,manifest_sha256:row.manifest_sha256});
}
function fileProjection(value,session,snapshot,fileId){
 const row=closed(value,['ok','contract','account_id','organization_id','snapshot_id','file']);
 if(row.ok!==true||row.contract!==STORE||row.account_id!==session.account_id||row.organization_id!==session.organization_id||row.snapshot_id!==snapshot)fail('invalid-scope');
 const f=closed(row.file,['organization_id','snapshot_id','file_id','kind','source_path','mime_type','byte_length','sha256','record_layout','source_occurrence_count','source_record_root','state','verified_at','source_content_verified_at']);
 if(f.organization_id!==session.organization_id||f.snapshot_id!==snapshot||f.file_id!==fileId||!['source-json','media','manifest'].includes(f.kind)||!MIMES.includes(f.mime_type)||!integer(f.byte_length,MAX_OBJECT_BYTES)||f.byte_length<1||!hash(f.sha256))fail('invalid-scope');
 if(typeof f.source_path!=='string'||f.source_path.length>512||! /^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(f.source_path)||f.source_path.split('/').some(p=>!p||p==='.'||p==='..'))fail('invalid-upstream');
 if((f.kind==='media')===(f.mime_type==='application/json'))fail('invalid-upstream');
 if(f.kind==='source-json'){
  if(!['questions','review-questions'].includes(f.record_layout)||!integer(f.source_occurrence_count,100000)||f.source_occurrence_count<1||!hash(f.source_record_root))fail('invalid-upstream');
 }else if(f.record_layout!==null||f.source_occurrence_count!==null||f.source_record_root!==null||f.source_content_verified_at!==null)fail('invalid-upstream');
 if(!['reserved','verified'].includes(f.state)||(f.state==='reserved'&&(f.verified_at!==null||f.source_content_verified_at!==null))||(f.state==='verified'&&!date(f.verified_at))||(f.source_content_verified_at!==null&&!date(f.source_content_verified_at)))fail('invalid-upstream');
 return Object.freeze(f);
}
function fingerprint(file){return JSON.stringify(Object.fromEntries(Object.entries(file).filter(([k])=>!['state','verified_at','source_content_verified_at'].includes(k))));}
function errorStatus(code){if(code==='28000')return 401;if(code==='42501')return 403;if(code==='P0002')return 404;if(['40001','23514','integrity-conflict','terminal'].includes(code))return 409;if(['body-size'].includes(code))return 413;if(['mime','body-encoding'].includes(code))return 415;if(code==='timeout')return 504;if(code==='aborted')return 408;if(['route','request','22023'].includes(code))return 400;return 503;}
export function createSnapshotTransportHandler({rpc,storage,endpoint,allowedOrigin,deadlineMs=20000,now=Date.now}){
 let base,origin;try{base=new URL(endpoint);origin=new URL(allowedOrigin);}catch{throw new TypeError('Explicit endpoint and staff origin required');}
 if(base.protocol!=='https:'||! /^[a-z0-9]+\.supabase\.co$/.test(base.hostname)||base.port||base.search||base.hash||base.username||base.password||base.pathname!=='/functions/v1/private-bank-snapshot-transport'||origin.protocol!=='https:'||origin.origin!==allowedOrigin||typeof rpc!=='function'||typeof storage?.put!=='function'||typeof storage?.get!=='function'||typeof now!=='function'||!Number.isInteger(deadlineMs)||deadlineMs<1||deadlineMs>30000)throw new TypeError('Closed transport configuration required');
 const prefix=base.pathname+'/snapshots/';
 function reply(req,status,value){const headers={'content-type':'application/json; charset=utf-8','cache-control':'private, no-store','x-content-type-options':'nosniff','vary':'Origin'};
  if(req.headers.get('origin')===allowedOrigin){headers['access-control-allow-origin']=allowedOrigin;headers['access-control-allow-methods']='GET, POST, OPTIONS';headers['access-control-allow-headers']='authorization, content-type, x-echs-request-id';}
  return new Response(status===204?null:JSON.stringify(value),{status,headers});}
 return async function handler(req){
  let ctx=null,raw=null,readback=null,session=null,tokenHash=null,capturedFile=null,capturedStore=null;
  try{
   if(!(req instanceof Request))fail('request');const url=new URL(req.url);
   if(url.origin!==base.origin||url.search||url.hash||!url.pathname.startsWith(prefix))return reply(req,404,{ok:false,error:{code:'not-found'}});
   const parts=url.pathname.slice(prefix.length).split('/'),snapshot=parts[0],fileId=parts[2],upload=parts.length===4&&parts[3]==='bytes';
   if(!id(snapshot)||parts[1]!=='files'||!id(fileId)||!(parts.length===3||upload))return reply(req,404,{ok:false,error:{code:'not-found'}});
   const requestOrigin=req.headers.get('origin');if(requestOrigin!==null&&requestOrigin!==allowedOrigin)fail('42501');
   if(req.method==='OPTIONS')return reply(req,204,null);
   if((upload&&req.method!=='POST')||(!upload&&req.method!=='GET'))return reply(req,405,{ok:false,error:{code:'method-not-allowed'}});
   if(!upload&&req.body!==null)fail('request');
   for(const name of req.headers.keys())if(name.startsWith('x-echs-')&&name!=='x-echs-request-id')fail('request');
   const requestId=req.headers.get('x-echs-request-id');if(upload?!id(requestId):requestId!==null)fail('request');
   const header=req.headers.get('authorization')||'';if(!/^Bearer [A-Za-z0-9._~-]{20,4096}$/.test(header))fail('28000');
   ctx=deadline(req.signal,deadlineMs);ctx.check();tokenHash=await ctx.run(digest(encoder.encode(header.slice(7))));
   function current(){ctx.check();if(session&&Date.parse(session.expires_at)<=now())fail('28000');}
   async function call(name,args){current();const result=await ctx.run(rpc(name,args,{signal:ctx.signal}));current();return result;}
   async function fresh(requireStaging){
    const next=sessionProjection(await call('api_session_lookup',{p_token_hash:tokenHash}),now);
    if(session&&JSON.stringify(session)!==JSON.stringify(next))fail('28000');session=next;
    const file=fileProjection(await call('private_bank_snapshot_file',{p_token_hash:tokenHash,p_action:'status',p_payload:{snapshot_id:snapshot,file_id:fileId}}),session,snapshot,fileId);
    // file.status omits terminal state. Check snapshot status last, immediately
    // before the next I/O boundary; SQL transactions never span Storage I/O.
    const selected=storeProjection(await call('private_bank_snapshot_import',{p_token_hash:tokenHash,p_action:'status',p_payload:{snapshot_id:snapshot}}),session,snapshot);
    if(capturedStore&&selected.manifest_sha256!==capturedStore.manifest_sha256)fail('invalid-scope');
    if(requireStaging&&selected.state!=='staging')fail('terminal');
    if(file.kind==='manifest'&&file.sha256!==selected.manifest_sha256)fail('invalid-scope');
    if(capturedFile&&fingerprint(file)!==fingerprint(capturedFile))fail('invalid-scope');
    capturedFile=file;capturedStore=selected;return file;
   }
   let file=await fresh(upload);
   const project=()=>({ok:true,contract:CONTRACT,snapshot_id:snapshot,file_id:fileId,
    file:{byte_length:capturedFile.byte_length,mime_type:capturedFile.mime_type,sha256:capturedFile.sha256,bytes_verified:capturedFile.state==='verified'}});
   if(!upload){file=await fresh(false);current();return reply(req,200,project());}
   if(req.headers.get('content-type')!==file.mime_type)fail('mime');
   raw=await boundedBody(req,file.byte_length,ctx,file.byte_length);current();
   if(await ctx.run(digest(raw))!==file.sha256)fail('integrity-conflict');current();
   file=await fresh(true);const scope=Object.freeze({organization_id:session.organization_id,snapshot_id:snapshot,file_id:fileId});
   if(file.state==='reserved'){
    current();try{await ctx.run(storage.put(scope,raw,file.mime_type,{signal:ctx.signal}));}
    catch(error){current();if(error instanceof TransportError&&['invalid-upstream','invalid-scope','invalid-body'].includes(error.code))throw error;
     // A failed/uncertain write is never overwritten or deleted. Reauthorize and
     // inspect exactly the same immutable key; a later retry keeps that identity.
    }
    file=await fresh(true);
   }
   current();const response=await ctx.run(storage.get(scope,{signal:ctx.signal}),cancelResponse);current();
   if(!(response instanceof Response)||response.status!==200||response.headers.get('content-type')!==file.mime_type){cancelResponse(response);fail('invalid-upstream');}
   try{readback=await boundedBody(response,file.byte_length,ctx,file.byte_length);}catch(error){if(error instanceof TransportError&&['body-size','body-encoding'].includes(error.code))fail('invalid-upstream');throw error;}finally{cancelResponse(response);}
   current();const readbackHash=await ctx.run(digest(readback));current();if(readbackHash!==file.sha256)fail('integrity-conflict');
   readback.fill(0);readback=null;raw.fill(0);raw=null;
   file=await fresh(true);
   if(file.state!=='verified'){
    try{
     const receipt=await call('private_bank_snapshot_file',{p_token_hash:tokenHash,p_action:'verify_bytes',p_payload:{snapshot_id:snapshot,request_id:requestId,file_id:fileId,
      sha256:readbackHash,byte_length:file.byte_length,mime_type:file.mime_type}});
     storeProjection(receipt,session,snapshot);
    }catch(error){current();if(error instanceof TransportError&&['28000','42501','40001','23514','P0002','22023'].includes(error.code))throw error;
     // A lost receipt acknowledgement is reconciled with a fresh scoped status,
     // never inferred from the upload or read-back acknowledgement alone.
    }
   }
   file=await fresh(true);if(file.state!=='verified')fail('receipt-unconfirmed');current();
   return reply(req,200,project());
  }catch(error){const code=error instanceof TransportError?error.code:'upstream';const status=errorStatus(code);
   return reply(req,status,{ok:false,error:{code:status===401?'session-required':status===403?'administrator-required':status===404?'not-found':status===409?'conflict':status===413?'size-limit':status===415?'unsupported-mime':status===504?'deadline':status===408?'cancelled':status===400?'invalid-request':'unavailable'}});
  }finally{raw?.fill(0);readback?.fill(0);ctx?.close();session=capturedFile=capturedStore=tokenHash=null;try{void req.body?.cancel().catch(()=>{});}catch{}}
 };
}
