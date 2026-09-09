import { inspectLessonAsset, lessonAssetByteLimit, LESSON_ASSET_LIMITS } from './asset-bytes.mjs';

export const LESSON_MEDIA_CAPABILITIES = Object.freeze({ contract:'echs.lesson.media.v1',
  blocks:Object.freeze({image:Object.freeze([1]),video:Object.freeze([1]),table:Object.freeze([1]),resource:Object.freeze([1])}),
  asset_delivery:'authenticated-bytes',mime_types:Object.freeze(['image/png','image/jpeg','image/webp','application/pdf']),
  max_image_bytes:4194304,max_resource_bytes:8388608 });
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CONTRACT='echs.lesson.store.v1';
export function confirmedMediaCapabilities(value) {
  if(!value || Array.isArray(value) || Object.keys(value).length!==6 || value.contract!==LESSON_MEDIA_CAPABILITIES.contract ||
    value.asset_delivery!=='authenticated-bytes' || value.max_image_bytes!==4194304 || value.max_resource_bytes!==8388608 ||
    !value.blocks || Object.keys(value.blocks).length!==4 || !Array.isArray(value.mime_types) || value.mime_types.length!==4) return null;
  for(const type of ['image','video','table','resource']) if(!Array.isArray(value.blocks[type]) || value.blocks[type].length!==1 || value.blocks[type][0]!==1) return null;
  if(value.mime_types.some((mime,index)=>mime!==LESSON_MEDIA_CAPABILITIES.mime_types[index]))return null;
  return LESSON_MEDIA_CAPABILITIES;
}
export class LessonMediaRequestError extends Error {
  constructor(status,code,message){super(message);this.name='LessonMediaRequestError';this.status=status;this.code=code;}
}
const invalid=()=>new LessonMediaRequestError(422,'invalid_asset_request','The request does not match the lesson asset contract.');
const unavailable=()=>new LessonMediaRequestError(503,'asset_unavailable','Lesson assets are temporarily unavailable.');
const conflict=()=>new LessonMediaRequestError(409,'asset_upload_conflict','This upload identifier is already in use.');

function filename(req) {
  const encoded=req.headers.get('x-echs-asset-name');
  if(!encoded || encoded.length>1920)throw invalid();
  let name;try{name=decodeURIComponent(encoded);}catch{throw invalid();}
  if(name.length<1 || name.length>160 || !name.trim() || ['.','..'].includes(name) || /[/\\<>\u0000-\u001f\u007f]/.test(name) || encodeURIComponent(name)!==encoded)throw invalid();
  return name;
}
async function binaryBody(req,limit,timeoutMs) {
  const declared=req.headers.get('content-length');
  if(declared!==null && (!/^[1-9][0-9]*$/.test(declared) || Number(declared)>limit))throw new LessonMediaRequestError(413,'asset_too_large','The file exceeds the lesson asset limit.');
  const reader=req.body?.getReader();if(!reader)throw invalid();
  let timer,interrupt,bodyError,total=0;const chunks=[];
  const cancelled=new Promise((_,reject)=>{
    interrupt=()=>{bodyError=new LessonMediaRequestError(408,'asset_upload_timeout','The upload did not complete in time.');reject(bodyError);void reader.cancel().catch(()=>{});};
    timer=setTimeout(interrupt,timeoutMs);req.signal.addEventListener('abort',interrupt,{once:true});if(req.signal.aborted)interrupt();
  });
  try {
    while(true){const {value,done}=await Promise.race([reader.read(),cancelled]);if(bodyError)throw bodyError;if(done)break;
      total+=value.byteLength;if(total>limit){void reader.cancel().catch(()=>{});throw new LessonMediaRequestError(413,'asset_too_large','The file exceeds the lesson asset limit.');}chunks.push(value);}
    if(total<1 || (declared!==null && total!==Number(declared)))throw invalid();
    const bytes=new Uint8Array(total);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}return bytes;
  }finally{clearTimeout(timer);req.signal.removeEventListener('abort',interrupt);reader.releaseLock();}
}
function readyMetadata(asset) {
  if(!asset || !UUID.test(asset.id) || asset.state!=='ready' || !LESSON_MEDIA_CAPABILITIES.mime_types.includes(asset.mime_type) ||
    !Number.isInteger(asset.byte_length) || asset.byte_length<1 || asset.byte_length>lessonAssetByteLimit(asset.mime_type) || !/^[0-9a-f]{64}$/.test(asset.sha256))throw unavailable();
  if(asset.mime_type==='application/pdf' ? asset.width!==null||asset.height!==null :
    !Number.isInteger(asset.width)||!Number.isInteger(asset.height)||asset.width<1||asset.height<1||asset.width>4096||asset.height>4096||asset.width*asset.height>LESSON_ASSET_LIMITS.pixels)throw unavailable();
  return {asset_id:asset.id,mime_type:asset.mime_type,byte_length:asset.byte_length,width:asset.width,height:asset.height,sha256:asset.sha256,state:'ready'};
}
const scopeOf=asset=>({organization_id:asset.organization_id,lesson_id:asset.lesson_id,asset_id:asset.id});
const expectedOf=asset=>({mime:asset.mime_type,bytes:asset.byte_length,sha256:asset.sha256});

/** Only the existing handler's authenticated actor/hash and fixed dependencies enter here. */
export async function handleLessonAsset({target,req,actor,tokenHash,invoke,reply,storage,timeoutMs}) {
  if(!storage || typeof storage.put!=='function' || typeof storage.get!=='function' || typeof storage.removeTemporary!=='function')throw unavailable();
  const lessonId=target.payload.lesson_id;
  const rpc=async(action,payload)=>{
    const data=await invoke('lesson_asset_store',{p_token_hash:tokenHash,p_action:action,p_payload:{lesson_id:lessonId,...payload}});
    if(data?.ok!==true || data.contract!=='echs.lesson.assets.v1' || data.lesson_id!==lessonId || data.organization_id!==actor.organization_id ||
      data.account_id!==actor.account_id || !UUID.test(data.class_id) || (target.payload.class_id && data.class_id!==target.payload.class_id))throw unavailable();
    const check=asset=>{if(!asset || asset.organization_id!==actor.organization_id || asset.lesson_id!==lessonId || asset.class_id!==data.class_id || !UUID.test(asset.id) ||
      (payload.asset_id && asset.id!==payload.asset_id) || !['pending','ready','cleanup'].includes(asset.state))throw unavailable();};
    if(data.asset)check(data.asset);
    if(data.assets){if(!Array.isArray(data.assets)||data.assets.length>128)throw unavailable();data.assets.forEach(check);}
    return data;
  };
  const envelope=asset=>({ok:true,contract:CONTRACT,lesson_id:lessonId,asset:readyMetadata(asset)});
  if(target.action==='asset_list') {
    const data=await rpc('list',{});if(!Array.isArray(data.assets))throw unavailable();
    return reply({ok:true,contract:CONTRACT,lesson_id:lessonId,assets:data.assets.map(readyMetadata)});
  }
  const readPayload={asset_id:target.payload.asset_id,...(target.payload.class_id?{class_id:target.payload.class_id}:{})};
  if(target.action==='asset_read' || target.action==='asset_bytes') {
    const data=await rpc('read',readPayload);const meta=readyMetadata(data.asset);
    if(target.action==='asset_read')return reply(envelope(data.asset));
    let bytes;try{bytes=await storage.get({scope:scopeOf(data.asset),expected:expectedOf(data.asset)});}catch{throw unavailable();}
    const latest=await rpc('read',readPayload);
    if(JSON.stringify(readyMetadata(latest.asset))!==JSON.stringify(meta) || req.signal.aborted)throw unavailable();
    const headers=new Headers(reply({}).headers);headers.set('content-type',meta.mime_type);headers.set('content-length',String(meta.byte_length));
    headers.set('content-disposition',meta.mime_type==='application/pdf'?'attachment; filename="lesson-resource.pdf"':'inline');
    headers.set('content-security-policy',"sandbox; default-src 'none'");
    return new Response(bytes,{status:200,headers});
  }
  if(target.action==='asset_cleanup') {
    if(req.headers.get('content-type')!=='application/json')throw invalid();
    const bytes=await binaryBody(req,32,timeoutMs);if(new TextDecoder().decode(bytes).trim()!=='{}')throw invalid();
    const data=await rpc('cleanup_expired',{asset_id:target.payload.asset_id});if(data.asset?.state!=='cleanup')throw unavailable();
    try{await storage.removeTemporary({scope:scopeOf(data.asset),state:'cleanup'});}catch{throw unavailable();}
    return reply({ok:true,contract:CONTRACT,lesson_id:lessonId,asset_id:data.asset.id,state:'cleanup'});
  }
  if(target.action!=='asset_upload')throw invalid();
  const assetId=req.headers.get('x-echs-asset-id');if(!UUID.test(assetId||''))throw invalid();
  const mime=req.headers.get('content-type');if(!LESSON_MEDIA_CAPABILITIES.mime_types.includes(mime))throw new LessonMediaRequestError(415,'asset_mime_not_allowed','Use PNG, JPEG, WebP, or PDF.');
  const originalName=filename(req);
  // Scope authorization precedes byte ingestion. Reserve repeats it after hashing.
  await rpc('list',{});
  const bytes=await binaryBody(req,lessonAssetByteLimit(mime),timeoutMs);
  let inspected;try{inspected=await inspectLessonAsset(bytes,mime);}catch(error){throw new LessonMediaRequestError(422,'invalid_asset',error?.name==='LessonAssetError'?error.message:'The file is invalid.');}
  const reservation=await rpc('reserve',{asset_id:assetId.toLowerCase(),original_name:originalName,mime_type:mime,byte_length:inspected.bytes,
    width:inspected.width,height:inspected.height,sha256:inspected.sha256});
  const asset=reservation.asset;
  if(!asset || asset.uploaded_by!==actor.account_id || asset.original_name!==originalName || asset.mime_type!==mime || asset.byte_length!==inspected.bytes ||
    asset.width!==inspected.width || asset.height!==inspected.height || asset.sha256!==inspected.sha256)throw unavailable();
  if(asset.state==='ready')return reply(envelope(asset),200);
  if(asset.state!=='pending')throw conflict();
  const scope=scopeOf(asset),expected=expectedOf(asset);
  try {
    // A replay may encounter a completed object after its upload acknowledgement
    // was lost. No upsert/retry is issued: verify that exact object's bytes first.
    try{await storage.put({scope,bytes,mime});}catch{await storage.get({scope,expected});}
  }catch{throw unavailable();}
  try {
    const final=await rpc('finalize',{asset_id:asset.id});return reply(envelope(final.asset),final.reused?200:201);
  }catch(error){
    // A finalize response can be lost after commit. Reconcile before any cleanup.
    let state;try{state=await rpc('status',{asset_id:asset.id});}catch{throw error;}
    if(state.asset?.state==='ready')return reply(envelope(state.asset),200);
    // Only a definite rejected transition after successful upload is cleaned up.
    // Network/5xx and lost authority keep the pending upload available for retry.
    if(state.asset?.state==='pending' && error?.status===409 && error?.code==='invalid_transition') {
      try {const cleanup=await rpc('cleanup',{asset_id:asset.id});if(cleanup.asset?.state==='cleanup')await storage.removeTemporary({scope:scopeOf(cleanup.asset),state:'cleanup'});}catch{/* retain a private terminal/pending object on uncertain cleanup */}
    }
    throw error;
  }
}
