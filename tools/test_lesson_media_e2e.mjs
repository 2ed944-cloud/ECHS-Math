#!/usr/bin/env node
// Actual Request/Response handler + pinned KaTeX + actual session-authenticated
// production RPC transport + PostgreSQL RPCs. The subprocess is a parameterized
// database bridge behind the fixed HTTP adapter, not an authorization mock.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import katex from './lesson-runtime/node_modules/katex/dist/katex.mjs';
import { createLessonHandler, LESSON_API_CONTRACT } from '../supabase/functions/lesson-api/handler.mjs';
import { createLessonAssetStorage } from '../supabase/functions/lesson-api/asset-storage.mjs';
import { LESSON_MEDIA_CAPABILITIES } from '../supabase/functions/lesson-api/media-handler.mjs';
import { inspectLessonAsset } from '../supabase/functions/lesson-api/asset-bytes.mjs';
import { createRpcTransport } from '../supabase/functions/lesson-api/transport.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const reportIndex = process.argv.indexOf('--report');
const reportPath = path.resolve(reportIndex < 0 ? path.join(root,'reports/lesson-media-e2e.json') : process.argv[reportIndex+1]);
const report = { status:'RUNNING; NOT PASS', production_calls:false, external_network:false,
  transport:'Actual HTTP handler, KaTeX and createRpcTransport through fixed PostgREST HTTP adapter and parameterized Python stdio to real PostgreSQL service-role RPCs', checks:[] };
const saveReport = () => { fs.mkdirSync(path.dirname(reportPath),{recursive:true});fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n'); };
const passed = label => { report.checks.push(label);console.log('PASS '+label);saveReport(); };
const clone = value => structuredClone(value);
const NOTE = 'PRIVATE_HTTP_NOTES_CANARY_NOT_FOR_STUDENTS';
const REVIEW = 'PRIVATE_HTTP_REVIEW_CANARY_NOT_FOR_STUDENTS';
const checks = Object.fromEntries(['curriculum','mathematics','accessibility','rights','student_safe'].map(key=>[key,true]));

let child;
let childExited;
try {
  assert.ok(process.env.ECHS_LESSON_TEST_DSN,'ECHS_LESSON_TEST_DSN must name the isolated migrated loopback database');
  // There is no HTTP listener and no fetch fallback: the real handler receives
  // standard Request objects and every allowed RPC goes to the real database.
  globalThis.fetch = async () => { throw new Error('Network calls are forbidden in the isolated lesson integration'); };
  child = spawn(process.env.ECHS_PYTHON || 'python',[fileURLToPath(new URL('./lesson_persistence_rpc_fixture.py',import.meta.url)), '--media'],
    {cwd:root,env:process.env,stdio:['pipe','pipe','pipe'],windowsHide:true});
  childExited = new Promise(resolve=>child.once('close',(code,signal)=>resolve({code,signal})));
  let readyResolve,readyReject;
  const pending = new Map();let sequence=0;
  const ready = new Promise((resolve,reject)=>{readyResolve=resolve;readyReject=reject;});
  const startupTimer = setTimeout(()=>readyReject(new Error('PostgreSQL fixture startup timed out')),30000);
  let stderr='';
  child.stderr.on('data',chunk=>{stderr=(stderr+chunk.toString()).slice(-1000);});
  child.on('error',error=>readyReject(error));
  const lines = readline.createInterface({input:child.stdout});
  lines.on('line',line=>{
    let result;
    try { result=JSON.parse(line); } catch { readyReject(new Error('Invalid fixture protocol output'));return; }
    if(result.event==='ready'){clearTimeout(startupTimer);readyResolve(result);return;}
    if(result.event==='startup_error'){clearTimeout(startupTimer);readyReject(new Error('Isolated database fixture refused startup: '+result.error?.code));return;}
    const awaiting=pending.get(result.id);
    if(awaiting){pending.delete(result.id);clearTimeout(awaiting.timer);awaiting.resolve(result.result);}
  });
  childExited.then(({code,signal})=>{
    clearTimeout(startupTimer);
    const error=new Error(`Database fixture exited (${code??signal})${stderr?': '+stderr:''}`);
    readyReject(error);
    for(const item of pending.values()){clearTimeout(item.timer);item.reject(error);}pending.clear();
  });
  const initialized = await ready;
  const fixture = initialized.fixture;
  report.postgres_version=initialized.postgres_version;
  const rpcCalls=[];
  const databaseRpc = (name,args) => new Promise((resolve,reject)=>{
    assert.ok(['api_session_lookup','lesson_store','lesson_store_health','lesson_content_capabilities','lesson_media_capabilities','lesson_asset_store','fixture_storage_metadata','fixture_storage_remove'].includes(name));
    rpcCalls.push({name,action:args.p_action});
    const id=++sequence;
    const timer=setTimeout(()=>{pending.delete(id);reject(new Error('Database RPC timed out'));},15000);
    pending.set(id,{resolve,reject,timer});
    child.stdin.write(JSON.stringify({id,name,args})+'\n',error=>{if(error){clearTimeout(timer);pending.delete(id);reject(error);}});
  });
  const transportCalls=[]; let loseFinalizeAck=false;
  const rpc=createRpcTransport({url:'https://isolatedfixture.supabase.co',serviceKey:'isolated-fixture-only-service-key',fetch:async(url,options)=>{
    const target=new URL(url);
    assert.equal(target.origin,'https://isolatedfixture.supabase.co'); assert.equal(target.search,''); assert.equal(target.hash,'');
    const match=/^\/rest\/v1\/rpc\/(api_session_lookup|lesson_store|lesson_store_health|lesson_content_capabilities|lesson_media_capabilities|lesson_asset_store)$/.exec(target.pathname);
    assert.ok(match,'Only the fixed production RPC routes may reach the isolated database');
    assert.equal(options.method,'POST'); assert.equal(options.redirect,'error'); assert.equal(options.credentials,'omit'); assert.equal(options.cache,'no-store');
    assert.equal(options.headers.apikey,'isolated-fixture-only-service-key');
    assert.equal(options.headers.authorization,'Bearer isolated-fixture-only-service-key');
    assert.equal(options.headers['content-type'],'application/json'); assert.ok(options.signal instanceof AbortSignal);
    const args=JSON.parse(options.body); transportCalls.push({name:match[1],action:args.p_action});
    const result=await databaseRpc(match[1],args);
    if(loseFinalizeAck && match[1]==='lesson_asset_store' && args.p_action==='finalize' && !result.error){loseFinalizeAck=false;throw new Error('Simulated lost finalize acknowledgement');}
    const status=result.error?({'28000':401,'42501':403,'P0002':404,'40001':409,'23505':409,'22023':400,'23514':400}[result.error.code]||500):200;
    return new Response(JSON.stringify(result.error?{code:result.error.code}:result.data),{status,headers:{'content-type':'application/json'}});
  }});
  // Actual production Storage transport talks only to this fixed HTTP provider
  // fixture. It stores bytes in memory and records simulated completed provider
  // metadata in isolated PG. All school authorization still runs in real SQL.
  const objects=new Map();let loseStorageAck=false;const storageCalls=[];
  const assetStorage=createLessonAssetStorage({url:'https://isolatedfixture.supabase.co',serviceKey:'isolated-fixture-only-service-key',fetchImpl:async(url,options)=>{
    const target=new URL(url);assert.equal(target.origin,'https://isolatedfixture.supabase.co');assert.equal(target.search,'');assert.equal(target.hash,'');
    assert.equal(options.headers.authorization,'Bearer isolated-fixture-only-service-key');assert.equal(options.headers.apikey,'isolated-fixture-only-service-key');
    assert.equal(options.redirect,'error');assert.equal(options.credentials,'omit');assert.equal(options.cache,'no-store');
    const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json'}});
    const base='/storage/v1/object/lesson-assets';assert.ok(target.pathname===base || target.pathname.startsWith(base+'/'));
    let key=target.pathname.slice(base.length+1);
    if(options.method==='DELETE'){assert.equal(target.pathname,base);const payload=JSON.parse(options.body);assert.deepEqual(Object.keys(payload),['prefixes']);assert.equal(payload.prefixes.length,1);key=payload.prefixes[0];}
    const parts=key.split('/');assert.equal(parts.length,3);assert.equal(parts[0],fixture.organization);
    assert.ok(parts.every(id=>/^[0-9a-f-]{36}$/.test(id)));storageCalls.push({method:options.method,asset_id:parts[2]});
    if(options.method==='POST') {
      assert.equal(options.headers['x-upsert'],'false');if(objects.has(key))return json({code:'Duplicate'},409);
      const bytes=new Uint8Array(options.body);const meta=await inspectLessonAsset(bytes,options.headers['content-type']);
      const record=await databaseRpc('fixture_storage_metadata',{lesson_id:parts[1],asset_id:parts[2]});assert.equal(record.error,null);
      objects.set(key,{bytes,mime:meta.mime});if(loseStorageAck){loseStorageAck=false;throw new Error('Simulated lost Storage upload acknowledgement');}
      return json({Key:'lesson-assets/'+key},200);
    }
    if(options.method==='GET'){const value=objects.get(key);return value?new Response(value.bytes,{headers:{'content-type':value.mime,'content-length':String(value.bytes.length)}}):json({code:'NotFound'},404);}
    assert.equal(options.method,'DELETE');const deleted=await databaseRpc('fixture_storage_remove',{lesson_id:parts[1],asset_id:parts[2]});assert.equal(deleted.error,null);objects.delete(key);return json([{name:key}]);
  }});
  const handler=createLessonHandler({rpc,mathEngine:katex,assetStorage});
  const tokens=fixture.tokens;
  const makeRequest=(endpoint,actor='teacher',body,options={})=>new Request('https://isolated.invalid/functions/v1/lesson-api'+endpoint,{
    method:body===undefined?'GET':'POST',headers:{origin:options.origin||'https://2ed944-cloud.github.io',
      ...(actor===null?{}:{authorization:'Bearer '+(tokens[actor]||actor)}),...(body===undefined?{}:{'content-type':'application/json'})},
    ...(body===undefined?{}:{body:JSON.stringify(body)})});
  const expect=async(endpoint,actor,body,status=200,options={})=>{
    const response=await handler(makeRequest(endpoint,actor,body,options));
    const result=await response.json();
    assert.equal(response.status,status,`${endpoint}: ${JSON.stringify(result)}`);
    assert.match(response.headers.get('cache-control'),/no-store/);
    assert.equal(response.headers.get('x-content-type-options'),'nosniff');
    if(status<300)assert.equal(result.contract,LESSON_API_CONTRACT);
    return result;
  };

  report.transport='Actual lesson HTTP handler + createRpcTransport + service-role SQL; actual createLessonAssetStorage + fixed in-memory Storage HTTP fixture and isolated provider metadata';
  assert.deepEqual(await expect('/health/media',null),{ok:true,service:'lesson-api',contract:LESSON_API_CONTRACT,media_capabilities:LESSON_MEDIA_CAPABILITIES});
  assert.deepEqual(rpcCalls,[{name:'lesson_media_capabilities',action:undefined}]);assert.equal(storageCalls.length,0);
  const context=await expect('/context','teacher');assert.deepEqual(context.media_capabilities,LESSON_MEDIA_CAPABILITIES);assert.equal(context.authoring_capabilities.contract,'echs.lesson.authoring.v1');
  await expect('/context','student',undefined,403);
  passed('public media health and authenticated capability reach real SQL through the production allowlist without private asset reads');
  await expect(`/classes/${fixture.class}/course-version`,'admin',{course_version_id:fixture.course_version_id,expected_assignment_id:null,reason:'Explicit media HTTP fixture'});
  const original=JSON.parse(fs.readFileSync(new URL('./lesson-runtime/fixtures/published-original.lesson.json',import.meta.url),'utf8'));
  Object.assign(original,{lesson_id:randomUUID(),course_version_id:fixture.course_version_id,unit_id:'legacy:ap-calculus:unit:1',topic_id:'legacy:ap-calculus:topic:1.7',document_version:1});original.publication={status:'draft',audience:'institutional',revision:1};
  let record=await expect('/lessons','teacher',{class_id:fixture.class,course_version_id:fixture.course_version_id,access_key:fixture.access_key,document:original,private_notes:NOTE,expected_revision:0},201);
  const lessonPath='/lessons/'+record.lesson.id,assetsPath=lessonPath+'/assets',firstVersion=record.head.id;
  const PNG=new Uint8Array(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAADCAIAAAA2iEnWAAAAFElEQVR4nGOUDJjGwMDAxAAGUAoAEsQBBc88udgAAAAASUVORK5CYII=','base64'));
  function pdf(){let source='%PDF-1.7\n% Original fixture\n';const rootOffset=source.length;source+='1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';const pagesOffset=source.length;source+='2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj\n';const offset=source.length;source+=`xref\n0 3\n0000000000 65535 f \n${String(rootOffset).padStart(10,'0')} 00000 n \n${String(pagesOffset).padStart(10,'0')} 00000 n \ntrailer\n<< /Size 3 /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF\n`;return new TextEncoder().encode(source);}
  async function upload(bytes,mime,id=randomUUID(),status=201,actor='teacher',name='PRIVATE_ORIGINAL_FILENAME') {
    const request=new Request('https://isolated.invalid/functions/v1/lesson-api'+assetsPath,{method:'POST',headers:{origin:'https://2ed944-cloud.github.io',authorization:'Bearer '+tokens[actor],'content-type':mime,'x-echs-asset-id':id,'x-echs-asset-name':encodeURIComponent(name)},body:bytes});
    const response=await handler(request);const data=await response.json();assert.equal(response.status,status,JSON.stringify(data));assert.match(response.headers.get('cache-control'),/no-store/);
    if(status<300){assert.equal(data.lesson_id,record.lesson.id);assert.equal(data.contract,LESSON_API_CONTRACT);assert.deepEqual(Object.keys(data.asset).sort(),['asset_id','mime_type','byte_length','width','height','sha256','state'].sort());assert.equal(JSON.stringify(data).includes('PRIVATE'),false);}
    return data;
  }
  const pngId=randomUUID();loseStorageAck=true;const image=(await upload(PNG,'image/png',pngId)).asset;
  assert.equal(image.width,2);assert.equal(image.height,3);assert.equal(image.sha256,(await inspectLessonAsset(PNG,'image/png')).sha256);
  const callsBefore=storageCalls.length;assert.deepEqual((await upload(PNG,'image/png',pngId,200)).asset,image);assert.equal(storageCalls.length,callsBefore);
  await upload(PNG,'image/png',pngId,409,'teacher','Different filename');await upload(PNG,'image/png',pngId,409,'reviewer');
  loseFinalizeAck=true;const resource=(await upload(pdf(),'application/pdf',randomUUID(),200)).asset;assert.equal(resource.width,null);assert.equal(resource.height,null);
  passed('real reserve/finalize and immutable same-ID replay reconcile both lost Storage and committed SQL acknowledgements without duplicate uploads');
  for(const [actor,status] of [['student',403],['parent',403],['foreign_teacher',404],['unassigned_teacher',404]])await upload(PNG,'image/png',randomUUID(),status,actor);
  const beforeBad=rpcCalls.filter(c=>c.action==='reserve').length;await upload(new Uint8Array([1,2,3]),'image/png',randomUUID(),422);assert.equal(rpcCalls.filter(c=>c.action==='reserve').length,beforeBad);
  assert.equal((await expect(assetsPath,'teacher')).assets.length,2);
  await expect(assetsPath+'/'+pngId+'?class_id='+fixture.class,'student',undefined,404);
  passed('actual school sessions and exact class membership guard every asset route; malformed bytes never reserve and unpublished assets cannot reach students');
  const {cases}=JSON.parse(fs.readFileSync(new URL('./lesson-runtime/fixtures/media-cases.json',import.meta.url),'utf8'));
  const mixed=clone(record.head.document),blocks=cases.slice(0,4).map(item=>clone(item.block));blocks[0].content.asset_id=pngId;blocks[3].content.asset_id=resource.asset_id;mixed.slides=[{id:'media',title:'Original media',layout:'single',blocks}];
  const mutate=(action,actor='teacher',extra={},status=200)=>expect(lessonPath+'/'+action,actor,{expected_revision:record.lesson.head_revision,...extra},status);
  const wrong=clone(mixed);wrong.slides[0].blocks[0].content.asset_id=resource.asset_id;await mutate('draft','teacher',{document:wrong,private_notes:NOTE},409);
  record=await mutate('draft','teacher',{document:mixed,private_notes:NOTE});const mediaVersion=record.head.id;
  record=await mutate('request-review');record=await mutate('approve','reviewer',{checks,comment:REVIEW});record=await mutate('publish');
  const studentQuery='?class_id='+fixture.class;
  const live=await expect(lessonPath+'/published'+studentQuery,'student');assert.deepEqual(live.document.slides,mixed.slides);assert.equal(JSON.stringify(live).includes('PRIVATE'),false);
  assert.deepEqual((await expect(assetsPath+'/'+pngId+studentQuery,'student')).asset,image);
  for(const asset of [image,resource]) {
    const response=await handler(makeRequest(assetsPath+'/'+asset.asset_id+'/bytes'+studentQuery,'student'));
    assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),asset.mime_type);assert.match(response.headers.get('cache-control'),/no-store/);assert.equal(response.headers.get('x-content-type-options'),'nosniff');
    if(asset.mime_type==='application/pdf')assert.match(response.headers.get('content-disposition'),/^attachment;/);
    const inspected=await inspectLessonAsset(new Uint8Array(await response.arrayBuffer()),asset.mime_type);assert.equal(inspected.sha256,asset.sha256);
  }
  passed('independent review/publication bind image and PDF references to immutable real versions; actual authenticated byte transport verifies MIME/size/SHA and excludes private notes');
  const unseen=(await upload(PNG,'image/png')).asset;
  await expect(assetsPath+'/'+unseen.asset_id+studentQuery,'student',undefined,404);
  await expect(assetsPath+'/'+image.asset_id+'?class_id='+fixture.foreign_class,'student',undefined,404);
  await expect(assetsPath+'/'+image.asset_id,'student',undefined,403);
  record=await mutate('restore','teacher',{version_id:firstVersion});assert.deepEqual((await expect(assetsPath+'/'+pngId+studentQuery,'student')).asset,image);
  record=await mutate('unpublish','teacher',{reason:'Explicit original media withdrawal'});
  await expect(assetsPath+'/'+pngId+studentQuery,'student',undefined,404);await expect(assetsPath+'/'+pngId+'/bytes'+studentQuery,'student',undefined,404);
  assert.equal((await expect(lessonPath+'/versions/'+mediaVersion,'teacher')).version.id,mediaVersion);assert.deepEqual((await expect(assetsPath+'/'+pngId,'teacher')).asset,image);
  await expect(assetsPath+'/'+pngId+'/cleanup','teacher',{},409);
  passed('current publication gates refuse unreferenced/foreign assets and post-unpublish bytes while preserving immutable staff history and ready assets');
  report.rpc_count=rpcCalls.length;report.storage_request_count=storageCalls.length;report.status='PASS';saveReport();console.log(`Lesson media HTTP/real-PostgreSQL: PASS; ${report.checks.length} groups`);
} catch(error) {
  report.status='FAIL';report.error=String(error?.message||error);saveReport();
  process.exitCode=1;console.error(report.error);
} finally {
  if(child){
    child.stdin.end();
    let timer;
    const timedOut=await Promise.race([childExited.then(()=>false),new Promise(resolve=>{timer=setTimeout(()=>resolve(true),10000);})]);
    clearTimeout(timer);if(timedOut)child.kill();
  }
}
