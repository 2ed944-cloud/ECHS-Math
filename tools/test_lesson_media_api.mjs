import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import katex from './lesson-runtime/node_modules/katex/dist/katex.mjs';
import { createLessonHandler, LESSON_API_CONTRACT } from '../supabase/functions/lesson-api/handler.mjs';
import { createRpcTransport } from '../supabase/functions/lesson-api/transport.mjs';
import { createLessonAssetStorage } from '../supabase/functions/lesson-api/asset-storage.mjs';
import { LESSON_MEDIA_CAPABILITIES } from '../supabase/functions/lesson-api/media-handler.mjs';

// End-to-end server-module regression: only fixed PostgREST and Storage HTTP
// responses are simulated. No production network, credentials, accounts or files.
// SQL/RLS and actual Storage deployment remain separate acceptance checks.
const ORIGIN = 'https://fixture.supabase.co';
const SITE = 'https://2ed944-cloud.github.io';
const KEY = 'synthetic-service-credential-not-a-production-secret';
const TOKEN = 'synthetic-school-session-token-media-010';
const PRIVATE = 'PRIVATE_ASSET_INTERNAL_CANARY';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const tokenHash = hash(TOKEN);
const clone = value => JSON.parse(JSON.stringify(value));
const id = n => `10000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const ids = { actor:id(1),org:id(2),class:id(3),lesson:id(4),asset:id(5) };
const actor = {account_id:ids.actor,organization_id:ids.org,role:'teacher',status:'active',expires_at:'2099-01-01T00:00:00Z'};
const PATH = `/lessons/${ids.lesson}/assets`;
const objectKey = `${ids.org}/${ids.lesson}/${ids.asset}`;
const objectURL = `${ORIGIN}/storage/v1/object/lesson-assets/${objectKey}`;
// Original 2x3 solid-color PNG also used by the independent container tests.
const PNG = new Uint8Array(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAADCAIAAAA2iEnWAAAAFElEQVR4nGOUDJjGwMDAxAAGUAoAEsQBBc88udgAAAAASUVORK5CYII=','base64'));
function pdf() {
  let source = '%PDF-1.7\n';
  const root = source.length; source += '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  const pages = source.length; source += '2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj\n';
  const xref = source.length;
  source += `xref\n0 3\n0000000000 65535 f \n${String(root).padStart(10,'0')} 00000 n \n${String(pages).padStart(10,'0')} 00000 n \ntrailer\n<< /Size 3 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(source);
}
const PDF = pdf();
const meta = (bytes=PNG,mime='image/png') => ({asset_id:ids.asset,mime_type:mime,byte_length:bytes.length,
  width:mime==='application/pdf'?null:2,height:mime==='application/pdf'?null:3,sha256:hash(bytes),state:'ready'});
function row(state='ready',bytes=PNG,mime='image/png') {
  const {asset_id,...metadata}=meta(bytes,mime);
  return {id:asset_id,...metadata,state,organization_id:ids.org,lesson_id:ids.lesson,class_id:ids.class,
    uploaded_by:ids.actor,original_name:mime==='application/pdf'?'resource.pdf':'original.png',
    created_at:'2026-09-08T00:00:00Z',ready_at:state==='ready'?'2026-09-08T00:01:00Z':null,cleanup_at:null,
    private_notes:PRIVATE,storage_path:objectKey};
}
const json = (body,status=200) => new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});
const failure = (code,status=400) => json({code,message:PRIVATE,details:KEY},status);
const authoring = {contract:'echs.lesson.authoring.v1',content_version:2,
  blocks:{'rich-text':[1,2],math:[1,2],callout:[1,2],'legacy-embedded':[1]},math_expression_version:1};

function harness({session=actor,asset=row(),capabilities=LESSON_MEDIA_CAPABILITIES,withoutStorage=false,
  onRpc,onStorage,bodyTimeoutMs=1000}={}) {
  const state={session:clone(session),asset:clone(asset),authorized:true,expired:false,objects:new Map(),calls:[],storageCalls:[],events:[],assertions:[]};
  if(asset)state.objects.set(objectURL,{bytes:asset.mime_type==='application/pdf'?PDF.slice():PNG.slice(),mime:asset.mime_type});
  const envelope = extra => ({ok:true,contract:'echs.lesson.assets.v1',lesson_id:ids.lesson,organization_id:ids.org,
    class_id:ids.class,account_id:ids.actor,private_notes:PRIVATE,...extra});
  const safe = fn => async (...args) => {try{return await fn(...args);}catch(error){if(error instanceof assert.AssertionError)state.assertions.push(error);throw error;}};
  const rpc=createRpcTransport({url:ORIGIN,serviceKey:KEY,fetch:safe(async(target,options)=>{
    const url=new URL(target);assert.equal(url.origin,ORIGIN);assert.equal(url.search,'');assert.equal(url.hash,'');
    assert.equal(options.method,'POST');assert.equal(options.headers.apikey,KEY);assert.equal(options.headers.authorization,`Bearer ${KEY}`);
    assert.equal(options.headers['content-type'],'application/json');assert.equal(options.redirect,'error');
    assert.equal(options.credentials,'omit');assert.equal(options.cache,'no-store');assert.ok(options.signal instanceof AbortSignal);
    const name=url.pathname.slice('/rest/v1/rpc/'.length);assert.equal(url.pathname,`/rest/v1/rpc/${name}`);
    assert.ok(['api_session_lookup','lesson_store','lesson_store_health','lesson_content_capabilities','lesson_media_capabilities','lesson_asset_store','lesson_recovery_capabilities'].includes(name));
    if(name==='lesson_recovery_capabilities'){assert.deepEqual(JSON.parse(options.body),{});return json({code:'42883'},404);}
    const args=JSON.parse(options.body);state.calls.push({name,args});state.events.push(`rpc:${name==='lesson_asset_store'?args.p_action:name}`);
    if(['lesson_media_capabilities','lesson_content_capabilities','lesson_store_health'].includes(name))assert.deepEqual(args,{});
    else assert.equal(args.p_token_hash,tokenHash,'the raw school token never crosses PostgREST');
    const overridden=await onRpc?.({name,args,state,envelope});if(overridden!==undefined)return overridden;
    if(name==='lesson_media_capabilities')return json(capabilities);
    if(name==='lesson_content_capabilities')return json(authoring);
    if(name==='lesson_store_health')return json({ok:true,contract:LESSON_API_CONTRACT});
    if(name==='api_session_lookup'){assert.deepEqual(Object.keys(args),['p_token_hash']);return json(state.session?[state.session]:[]);}
    assert.deepEqual(Object.keys(args).sort(),['p_action','p_payload','p_token_hash']);
    if(name==='lesson_store'){assert.equal(args.p_action,'context');return state.authorized?json({ok:true,contract:LESSON_API_CONTRACT,classes:[],catalog:[]}):failure('42501',403);}
    const {p_action:action,p_payload:payload}=args;
    if(!state.authorized || payload.lesson_id!==ids.lesson || (payload.class_id && payload.class_id!==ids.class))return failure('42501',403);
    if(payload.asset_id && payload.asset_id!==ids.asset)return failure('P0002',404);
    if(action==='list')return json(envelope({assets:state.asset?.state==='ready'?[state.asset]:[]}));
    if(action==='reserve') {
      const expected={lesson_id:ids.lesson,asset_id:ids.asset,original_name:payload.mime_type==='application/pdf'?'resource.pdf':'original.png',
        mime_type:payload.mime_type,byte_length:payload.mime_type==='application/pdf'?PDF.length:PNG.length,
        width:payload.mime_type==='application/pdf'?null:2,height:payload.mime_type==='application/pdf'?null:3,
        sha256:hash(payload.mime_type==='application/pdf'?PDF:PNG)};
      assert.deepEqual(payload,expected,'reserve receives inspected independent byte metadata, never client-supplied hashes or paths');
      if(!state.asset)state.asset=row('pending',payload.mime_type==='application/pdf'?PDF:PNG,payload.mime_type);
      if(state.asset.sha256!==payload.sha256 || state.asset.original_name!==payload.original_name)return failure('23505',409);
      return json(envelope({asset:state.asset,reused:state.asset.state==='ready'}));
    }
    if(!state.asset)return failure('P0002',404);
    if(action==='read')return state.asset.state==='ready'?json(envelope({asset:state.asset})):failure('P0002',404);
    if(action==='status')return json(envelope({asset:state.asset}));
    if(action==='finalize') {state.asset.state='ready';state.asset.ready_at='2026-09-08T00:01:00Z';return json(envelope({asset:state.asset,reused:false}));}
    if(action==='cleanup' || action==='cleanup_expired') {
      if(state.asset.state!=='pending' || (action==='cleanup_expired'&&!state.expired))return failure('23514',409);
      state.asset.state='cleanup';return json(envelope({asset:state.asset}));
    }
    assert.fail(`Unexpected media action ${action}`);
  })});
  const storage=createLessonAssetStorage({url:ORIGIN,serviceKey:KEY,fetchImpl:safe(async(target,options)=>{
    const url=new URL(target);assert.equal(url.origin,ORIGIN);assert.equal(url.search,'');assert.equal(url.hash,'');
    assert.equal(options.headers.apikey,KEY);assert.equal(options.headers.authorization,`Bearer ${KEY}`);
    assert.equal(options.redirect,'error');assert.equal(options.credentials,'omit');assert.equal(options.cache,'no-store');
    assert.ok(options.signal instanceof AbortSignal);
    state.storageCalls.push({url:url.href,method:options.method});state.events.push(`storage:${options.method}`);
    const overridden=await onStorage?.({url,options,state});if(overridden!==undefined)return overridden;
    if(options.method==='POST') {
      assert.equal(url.href,objectURL);assert.equal(options.headers['x-upsert'],'false');
      assert.equal(options.headers['cache-control'],'max-age=0');assert.ok(options.body instanceof Uint8Array);
      if(state.objects.has(url.href))return failure('Duplicate',400);
      state.objects.set(url.href,{bytes:options.body.slice(),mime:options.headers['content-type']});
      return json({Key:`lesson-assets/${objectKey}`,Id:PRIVATE},201);
    }
    if(options.method==='GET') {
      assert.equal(url.href,objectURL);const value=state.objects.get(url.href);
      return value?new Response(value.bytes,{headers:{'content-type':value.mime,'content-length':String(value.bytes.length)}}):failure('not_found',404);
    }
    assert.equal(options.method,'DELETE');assert.equal(url.href,`${ORIGIN}/storage/v1/object/lesson-assets`);
    assert.deepEqual(JSON.parse(options.body),{prefixes:[objectKey]});assert.equal(state.asset.state,'cleanup','storage deletion requires a database-confirmed terminal state');
    const removed=state.objects.delete(objectURL);return json(removed?[{name:objectKey,id:PRIVATE}]:[]);
  })});
  return {state,rpc,handler:createLessonHandler({rpc,mathEngine:katex,assetStorage:withoutStorage?undefined:storage,bodyTimeoutMs})};
}
function request(path=PATH,{method='GET',body,headers={},authorization=`Bearer ${TOKEN}`,origin=SITE,signal}={}) {
  return new Request(`${ORIGIN}/functions/v1/lesson-api${path}`,{method,
    headers:{...(authorization?{authorization}:{}),...(origin?{origin}:{}),...headers},
    ...(body===undefined?{}:{body,...(body instanceof ReadableStream?{duplex:'half'}:{})}),...(signal?{signal}:{})});
}
function upload(options={}) {
  return {method:'POST',body:PNG,...options,headers:{'content-type':'image/png','x-echs-asset-name':encodeURIComponent('original.png'),'x-echs-asset-id':ids.asset,...options.headers}};
}
function privateHeaders(response) {
  assert.equal(response.headers.get('cache-control'),'no-store, private');assert.equal(response.headers.get('pragma'),'no-cache');
  assert.equal(response.headers.get('x-content-type-options'),'nosniff');assert.equal(response.headers.get('vary'),'Origin, Authorization');
  assert.equal(response.headers.get('access-control-allow-origin'),SITE);
}
async function expect(h,path,options,status) {
  const response=await h.handler(request(path,options));const body=await response.json();
  assert.deepEqual(h.state.assertions,[]);assert.equal(response.status,status,JSON.stringify(body));privateHeaders(response);
  assert.match(response.headers.get('content-type'),/^application\/json/);
  assert.equal(JSON.stringify(body).includes(PRIVATE),false);assert.equal(JSON.stringify(body).includes(KEY),false);
  assert.equal(JSON.stringify(body).includes(TOKEN),false);return body;
}
const actions = h => h.state.calls.filter(call=>call.name==='lesson_asset_store').map(call=>call.args.p_action);

test('production RPC allowlist includes both media functions and rejects arbitrary RPC before HTTP',async()=>{
  const h=harness();const health=await expect(h,'/health/media',{authorization:null},200);
  assert.deepEqual(health,{ok:true,service:'lesson-api',contract:LESSON_API_CONTRACT,media_capabilities:LESSON_MEDIA_CAPABILITIES});
  assert.deepEqual(h.state.calls.map(c=>c.name),['lesson_media_capabilities']);
  await expect(h,PATH,{},200);assert.deepEqual(actions(h),['list']);
  const count=h.state.calls.length;await assert.rejects(h.rpc('arbitrary_admin_rpc',{}),TypeError);assert.equal(h.state.calls.length,count);
});

test('media readiness fails closed for missing storage, missing RPC and malformed contracts; context stays usable',async()=>{
  const cases=[{withoutStorage:true},{capabilities:null},{capabilities:{...LESSON_MEDIA_CAPABILITIES,extra:true}},
    {capabilities:{...LESSON_MEDIA_CAPABILITIES,blocks:{image:[1],video:[1],table:[2],resource:[1]}}},
    {onRpc:({name})=>name==='lesson_media_capabilities'?failure('PGRST202',404):undefined},
    {onRpc:({name})=>name==='lesson_media_capabilities'?new Response(PRIVATE,{status:500,headers:{'content-type':'text/html'}}):undefined}];
  for(const options of cases) {
    const h=harness(options);await expect(h,'/health/media',{authorization:null},503);
    const context=await expect(h,'/context?class_id='+ids.class,{},200);assert.equal(context.media_capabilities,null);
    assert.deepEqual(context.authoring_capabilities,authoring);assert.equal(h.state.storageCalls.length,0);
  }
  const denied=harness();denied.state.authorized=false;
  await expect(denied,'/context?class_id='+ids.class,{},404);
  assert.equal(denied.state.calls.some(c=>c.name==='lesson_media_capabilities'),false,'capability probing follows scoped authorization');
});

test('CORS preflight supports upload headers without authentication; foreign origins never reach transport',async()=>{
  const h=harness();const response=await h.handler(request(PATH,{method:'OPTIONS',authorization:null}));assert.equal(response.status,204);
  assert.match(response.headers.get('access-control-allow-headers'),/x-echs-asset-id, x-echs-asset-name/);assert.equal(h.state.calls.length,0);
  const foreign=await h.handler(request(PATH,{origin:'https://foreign.example'}));assert.equal(foreign.status,403);
  assert.equal(foreign.headers.get('access-control-allow-origin'),null);assert.equal(h.state.calls.length,0);
});

test('staff list and metadata responses project exact ready fields without paths, notes or upload identities',async()=>{
  const h=harness();assert.deepEqual(await expect(h,PATH,{},200),{ok:true,contract:LESSON_API_CONTRACT,lesson_id:ids.lesson,assets:[meta()]});
  assert.deepEqual(await expect(h,`${PATH}/${ids.asset}`,{},200),{ok:true,contract:LESSON_API_CONTRACT,lesson_id:ids.lesson,asset:meta()});
  assert.equal(h.state.storageCalls.length,0);assert.equal(JSON.stringify(h.state.calls).includes(TOKEN),false);
});

test('raw PNG and PDF uploads inspect bytes, reserve exact metadata and return immutable ready references',async()=>{
  for(const [bytes,mime,name] of [[PNG,'image/png','original.png'],[PDF,'application/pdf','resource.pdf']]) {
    const h=harness({asset:null});const result=await expect(h,PATH,upload({body:bytes,headers:{'content-type':mime,'x-echs-asset-name':encodeURIComponent(name),'x-echs-asset-id':ids.asset}}),201);
    assert.deepEqual(result,{ok:true,contract:LESSON_API_CONTRACT,lesson_id:ids.lesson,asset:meta(bytes,mime)});
    assert.deepEqual(h.state.events,['rpc:api_session_lookup','rpc:list','rpc:reserve','storage:POST','rpc:finalize']);
    assert.deepEqual(h.state.objects.get(objectURL).bytes,bytes);assert.equal(h.state.asset.state,'ready');
  }
});

test('bad MIME, binary format, filenames and client asset identifiers never reserve or write',async()=>{
  const cases=[['image/svg+xml',PNG,415],['text/html',PNG,415],['image/png; charset=utf-8',PNG,415],
    ['image/png',new TextEncoder().encode('<svg/>'),422],['image/jpeg',PNG,422],['application/pdf',PNG,422]];
  for(const [mime,body,status] of cases) {
    const h=harness({asset:null});await expect(h,PATH,upload({body,headers:{'content-type':mime,'x-echs-asset-id':ids.asset,'x-echs-asset-name':'original.png'}}),status);
    assert.equal(actions(h).includes('reserve'),false);assert.equal(h.state.storageCalls.length,0);
  }
  for(const headers of [{'x-echs-asset-id':'../foreign'},{'x-echs-asset-name':'..%2Fsecret.png'},{'x-echs-asset-name':'bad%ZZ'},
    {'x-echs-asset-name':'%6friginal.png'},{'x-echs-asset-name':'%20%20'},{'x-echs-asset-name':'%3Csvg%3E'}]) {
    const h=harness({asset:null});await expect(h,PATH,upload({headers:{'content-type':'image/png','x-echs-asset-id':ids.asset,'x-echs-asset-name':'original.png',...headers}}),422);
    assert.equal(actions(h).includes('reserve'),false);assert.equal(h.state.storageCalls.length,0);
  }
});

test('declared and streamed byte limits, content-length mismatches and empty uploads never reserve',async()=>{
  for(const [options,status] of [[upload({headers:{'content-length':'4194305'}}),413],
    [upload({body:new Uint8Array(4194305)}),413],[upload({body:new Uint8Array()}),422],
    [upload({headers:{'content-length':String(PNG.length+1)}}),422]]) {
    const h=harness({asset:null});const response=await h.handler(request(PATH,options));assert.equal(response.status,status);
    assert.equal(actions(h).includes('reserve'),false);assert.equal(h.state.storageCalls.length,0);assert.deepEqual(h.state.assertions,[]);
  }
});

test('stalled or aborted binary bodies are cancelled before reservation and storage',async()=>{
  for(const abort of [false,true]) {
    let cancelled=false;const controller=new AbortController();
    const body=new ReadableStream({start(c){c.enqueue(PNG.subarray(0,8));},cancel(){cancelled=true;}});
    const h=harness({asset:null,bodyTimeoutMs:25});const pending=h.handler(request(PATH,upload({body,signal:controller.signal})));
    if(abort)controller.abort();const response=await pending;assert.equal(response.status,408,`aborted before body read: ${abort}`);
    assert.equal((await response.json()).error.code,'asset_upload_timeout');assert.equal(cancelled,true);
    assert.equal(actions(h).includes('reserve'),false);assert.equal(h.state.storageCalls.length,0);
  }
});

test('missing asset RPC and mismatched reserve hash, ownership or metadata cannot reach Storage',async()=>{
  const missing=harness({onRpc:({name})=>name==='lesson_asset_store'?failure('PGRST202',404):undefined});
  await expect(missing,PATH,upload(),503);assert.equal(missing.state.storageCalls.length,0);
  for(const mutate of [asset=>asset.sha256='0'.repeat(64),asset=>asset.uploaded_by=id(99),asset=>asset.original_name='foreign.png',
    asset=>asset.byte_length++,asset=>asset.width++,asset=>asset.organization_id=id(99)]) {
    const h=harness({asset:null,onRpc:({name,args,envelope})=>{
      if(name!=='lesson_asset_store'||args.p_action!=='reserve')return;
      const asset=row('pending');mutate(asset);return json(envelope({asset,reused:false}));
    }});
    await expect(h,PATH,upload(),503);assert.deepEqual(actions(h),['list','reserve']);assert.equal(h.state.storageCalls.length,0);
  }
});

test('a nonready finalization acknowledgement is not delivered or treated as permission to delete',async()=>{
  const h=harness({asset:null,onRpc:({name,args,state,envelope})=>{
    if(name==='lesson_asset_store'&&args.p_action==='finalize')return json(envelope({asset:state.asset,reused:false}));
  }});
  await expect(h,PATH,upload(),503);assert.deepEqual(actions(h),['list','reserve','finalize','status']);
  assert.equal(h.state.asset.state,'pending');assert.deepEqual(h.state.storageCalls.map(c=>c.method),['POST']);
  assert.equal(h.state.objects.size,1);
});

test('missing, expired and inactive sessions fail before asset scope lookup',async()=>{
  for(const session of [null,{...actor,status:'suspended'},{...actor,expires_at:'2000-01-01T00:00:00Z'}]) {
    const h=harness({session});await expect(h,PATH,{},401);assert.deepEqual(actions(h),[]);assert.equal(h.state.storageCalls.length,0);
  }
  const h=harness();await expect(h,PATH,{authorization:null},401);assert.equal(h.state.calls.length,0);
});

test('students require explicit class delivery and cannot list, upload or clean up; parents cannot read',async()=>{
  for(const [path,options] of [[PATH,{}],[PATH,upload()],[`${PATH}/${ids.asset}`,{}],[`${PATH}/${ids.asset}/cleanup`,{method:'POST',body:'{}',headers:{'content-type':'application/json'}}]]) {
    const h=harness({session:{...actor,role:'student'}});await expect(h,path,options,403);assert.deepEqual(actions(h),[]);
  }
  const parent=harness({session:{...actor,role:'parent'}});await expect(parent,`${PATH}/${ids.asset}?class_id=${ids.class}`,{},403);
  const student=harness({session:{...actor,role:'student'}});await expect(student,`${PATH}/${ids.asset}?class_id=${ids.class}`,{},200);
  assert.deepEqual(student.state.calls.at(-1).args.p_payload,{lesson_id:ids.lesson,asset_id:ids.asset,class_id:ids.class});
});

test('foreign class/lesson/asset IDs and unexpected query fields fail without Storage access',async()=>{
  for(const [path,status] of [[`${PATH}/${ids.asset}?class_id=${id(99)}`,404],
    [`/lessons/${id(99)}/assets/${ids.asset}`,404],[`${PATH}/${id(99)}`,404],
    [`${PATH}/${ids.asset}?class_id=${ids.class}&class_id=${ids.class}`,422],[`${PATH}?organization_id=${ids.org}`,422],
    [`${PATH}/${ids.asset}/bytes?url=https://foreign.example`,422]]) {
    const h=harness();await expect(h,path,{},status);assert.equal(h.state.storageCalls.length,0);
  }
  const h=harness();h.state.authorized=false;await expect(h,PATH,upload(),404);
  assert.deepEqual(actions(h),['list']);assert.equal(h.state.storageCalls.length,0);
});

test('database envelope scope, readiness and metadata corruption fail closed before private bytes',async()=>{
  const changes=[data=>data.organization_id=id(99),data=>data.account_id=id(99),data=>data.lesson_id=id(99),data=>data.class_id=id(99),
    data=>data.asset.organization_id=id(99),data=>data.asset.id=id(99),data=>data.asset.class_id=id(99),data=>data.asset.state='pending',
    data=>data.asset.mime_type='text/html',data=>data.asset.sha256='bad',data=>data.asset.byte_length=0,data=>data.asset.width=5000];
  for(const mutate of changes) {
    const h=harness({onRpc:({name,args,state,envelope})=>{
      if(name!=='lesson_asset_store'||args.p_action!=='read')return;
      const data=envelope({asset:clone(state.asset)});mutate(data);return json(data);
    }});
    await expect(h,`${PATH}/${ids.asset}/bytes?class_id=${ids.class}`,{},503);assert.equal(h.state.storageCalls.length,0);
  }
});

test('student byte delivery checks exact hash and repeats class authorization, with sandboxed private MIME headers',async()=>{
  for(const [bytes,mime] of [[PNG,'image/png'],[PDF,'application/pdf']]) {
    const h=harness({asset:row('ready',bytes,mime),session:{...actor,role:'student'}});
    const response=await h.handler(request(`${PATH}/${ids.asset}/bytes?class_id=${ids.class}`));assert.equal(response.status,200);privateHeaders(response);
    assert.equal(response.headers.get('content-type'),mime);assert.equal(response.headers.get('content-length'),String(bytes.length));
    assert.equal(response.headers.get('content-security-policy'),"sandbox; default-src 'none'");
    assert.equal(response.headers.get('content-disposition'),mime==='application/pdf'?'attachment; filename="lesson-resource.pdf"':'inline');
    assert.deepEqual(new Uint8Array(await response.arrayBuffer()),bytes);
    assert.deepEqual(h.state.events,['rpc:api_session_lookup','rpc:read','storage:GET','rpc:read']);assert.deepEqual(h.state.assertions,[]);
  }
});

test('corrupt object bytes, false stored hash and redirected Storage responses never reach the browser',async()=>{
  for(const mode of ['bytes','hash','redirect']) {
    const h=harness({onStorage:({options})=>{
      if(mode!=='redirect'||options.method!=='GET')return;
      return new Response(null,{status:302,headers:{location:'https://foreign.example/?private='+PRIVATE}});
    }});
    if(mode==='bytes')h.state.objects.get(objectURL).bytes[45]^=1;
    if(mode==='hash')h.state.asset.sha256='0'.repeat(64);
    await expect(h,`${PATH}/${ids.asset}/bytes`,{},503);assert.deepEqual(actions(h),['read']);
  }
});

test('authorization loss or changed metadata during Storage retrieval discards the loaded bytes',async()=>{
  for(const mode of ['revoked','changed','aborted']) {
    const controller=new AbortController();
    const h=harness({onStorage:({options,state})=>{
      if(options.method!=='GET')return;
      if(mode==='revoked')state.authorized=false;
      if(mode==='changed')state.asset.sha256='1'.repeat(64);
      if(mode==='aborted')controller.abort();
    }});
    const result=await expect(h,`${PATH}/${ids.asset}/bytes?class_id=${ids.class}`,{signal:controller.signal},mode==='revoked'?404:503);
    assert.equal(result.ok,false);assert.deepEqual(actions(h),['read','read']);assert.equal(h.state.storageCalls.length,1);
  }
});

test('authorization is repeated after body hashing and before ready transition; uncertain loss never deletes',async()=>{
  for(const deniedAction of ['reserve','finalize']) {
    const h=harness({asset:null,onRpc:({name,args,state})=>{
      if(name==='lesson_asset_store'&&args.p_action===deniedAction){state.authorized=false;return failure('42501',403);}
    }});
    await expect(h,PATH,upload(),404);assert.equal(h.state.storageCalls.some(c=>c.method==='DELETE'),false);
    assert.equal(h.state.storageCalls.length,deniedAction==='reserve'?0:1);
    assert.equal(h.state.asset?.state??null,deniedAction==='reserve'?null:'pending');
  }
});

test('ready upload replay returns the same reference without a second Storage write',async()=>{
  const h=harness({asset:null});const first=await expect(h,PATH,upload(),201);const second=await expect(h,PATH,upload(),200);
  assert.deepEqual(second,first);assert.deepEqual(h.state.storageCalls.map(c=>c.method),['POST']);
  assert.deepEqual(actions(h),['list','reserve','finalize','list','reserve']);
});

test('lost upload acknowledgement reconciles exact existing bytes without upsert, delete or duplicate write',async()=>{
  const h=harness({asset:null,onStorage:({url,options,state})=>{
    if(options.method!=='POST')return;
    state.objects.set(url.href,{bytes:options.body.slice(),mime:options.headers['content-type']});throw new Error(PRIVATE);
  }});
  assert.deepEqual((await expect(h,PATH,upload(),201)).asset,meta());
  assert.deepEqual(h.state.storageCalls.map(c=>c.method),['POST','GET']);assert.equal(h.state.asset.state,'ready');
  const wrong=harness({asset:row('pending')});wrong.state.objects.get(objectURL).bytes[45]^=1;
  await expect(wrong,PATH,upload(),503);assert.deepEqual(actions(wrong),['list','reserve']);assert.equal(wrong.state.asset.state,'pending');
  assert.equal(wrong.state.storageCalls.some(c=>c.method==='DELETE'),false);
});

test('lost finalize acknowledgement reconciles committed ready state without cleaning its object',async()=>{
  const h=harness({asset:null,onRpc:({name,args,state})=>{
    if(name==='lesson_asset_store'&&args.p_action==='finalize'){state.asset.state='ready';throw new Error(PRIVATE);}
  }});
  assert.deepEqual((await expect(h,PATH,upload(),200)).asset,meta());assert.deepEqual(actions(h),['list','reserve','finalize','status']);
  assert.deepEqual(h.state.storageCalls.map(c=>c.method),['POST']);assert.equal(h.state.objects.size,1);
});

test('only definite rejected finalize plus pending reconciliation transitions to cleanup before deletion',async()=>{
  const h=harness({asset:null,onRpc:({name,args})=>name==='lesson_asset_store'&&args.p_action==='finalize'?failure('23514',409):undefined});
  assert.equal((await expect(h,PATH,upload(),409)).error.code,'invalid_transition');
  assert.deepEqual(h.state.events,['rpc:api_session_lookup','rpc:list','rpc:reserve','storage:POST','rpc:finalize','rpc:status','rpc:cleanup','storage:DELETE']);
  assert.equal(h.state.asset.state,'cleanup');assert.equal(h.state.objects.size,0);
});

test('ambiguous finalize/status/cleanup failures preserve private objects instead of destructive retries',async()=>{
  for(const mode of ['finalize-unknown','status-unknown','cleanup-unknown','delete-unknown']) {
    const h=harness({asset:null,onRpc:({name,args})=>{
      if(name!=='lesson_asset_store')return;
      if(args.p_action==='finalize')return failure(mode==='finalize-unknown'?'unavailable':'23514',500);
      if((mode==='status-unknown'&&args.p_action==='status')||(mode==='cleanup-unknown'&&args.p_action==='cleanup'))throw new Error(PRIVATE);
    },onStorage:({options})=>{if(mode==='delete-unknown'&&options.method==='DELETE')throw new Error(PRIVATE);}});
    await expect(h,PATH,upload(),mode==='finalize-unknown'?503:409);assert.equal(h.state.objects.size,1);
    assert.equal(h.state.storageCalls.filter(c=>c.method==='DELETE').length,mode==='delete-unknown'?1:0);
    assert.equal(actions(h).filter(a=>a==='cleanup').length,['cleanup-unknown','delete-unknown'].includes(mode)?1:0);
  }
});

test('explicit cleanup accepts only an empty JSON request and a database-confirmed expired terminal transition',async()=>{
  const path=`${PATH}/${ids.asset}/cleanup`;
  for(const state of ['ready','pending']) {
    const h=harness({asset:row(state)});await expect(h,path,{method:'POST',body:'{}',headers:{'content-type':'application/json'}},409);
    assert.equal(h.state.storageCalls.length,0);assert.equal(h.state.objects.size,1);
  }
  for(const body of ['{"state":"cleanup"}','{"asset_id":"'+id(99)+'"}','[]']) {
    const h=harness({asset:row('pending')});h.state.expired=true;
    await expect(h,path,{method:'POST',body,headers:{'content-type':'application/json'}},body.length>32?413:422);
    assert.deepEqual(actions(h),[]);assert.equal(h.state.storageCalls.length,0);
  }
  const h=harness({asset:row('pending')});h.state.expired=true;
  assert.deepEqual(await expect(h,path,{method:'POST',body:'{}',headers:{'content-type':'application/json'}},200),
    {ok:true,contract:LESSON_API_CONTRACT,lesson_id:ids.lesson,asset_id:ids.asset,state:'cleanup'});
  assert.deepEqual(h.state.events,['rpc:api_session_lookup','rpc:cleanup_expired','storage:DELETE']);assert.equal(h.state.objects.size,0);
});
