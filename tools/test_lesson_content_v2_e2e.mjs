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
import { createRpcTransport } from '../supabase/functions/lesson-api/transport.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const reportIndex = process.argv.indexOf('--report');
const reportPath = path.resolve(reportIndex < 0 ? path.join(root,'reports/lesson-content-v2-e2e.json') : process.argv[reportIndex+1]);
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
  child = spawn(process.env.ECHS_PYTHON || 'python',[fileURLToPath(new URL('./lesson_persistence_rpc_fixture.py',import.meta.url)), '--content-v2'],
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
    assert.ok(['api_session_lookup','lesson_store','lesson_store_health','lesson_content_capabilities'].includes(name));
    rpcCalls.push({name,action:args.p_action});
    const id=++sequence;
    const timer=setTimeout(()=>{pending.delete(id);reject(new Error('Database RPC timed out'));},15000);
    pending.set(id,{resolve,reject,timer});
    child.stdin.write(JSON.stringify({id,name,args})+'\n',error=>{if(error){clearTimeout(timer);pending.delete(id);reject(error);}});
  });
  const transportCalls=[];
  const rpc=createRpcTransport({url:'https://isolatedfixture.supabase.co',serviceKey:'isolated-fixture-only-service-key',fetch:async(url,options)=>{
    const target=new URL(url);
    assert.equal(target.origin,'https://isolatedfixture.supabase.co'); assert.equal(target.search,''); assert.equal(target.hash,'');
    const match=/^\/rest\/v1\/rpc\/(api_session_lookup|lesson_store|lesson_store_health|lesson_content_capabilities)$/.exec(target.pathname);
    assert.ok(match,'Only the fixed production RPC routes may reach the isolated database');
    assert.equal(options.method,'POST'); assert.equal(options.redirect,'error'); assert.equal(options.credentials,'omit'); assert.equal(options.cache,'no-store');
    assert.equal(options.headers.apikey,'isolated-fixture-only-service-key');
    assert.equal(options.headers.authorization,'Bearer isolated-fixture-only-service-key');
    assert.equal(options.headers['content-type'],'application/json'); assert.ok(options.signal instanceof AbortSignal);
    const args=JSON.parse(options.body); transportCalls.push({name:match[1],action:args.p_action});
    const result=await databaseRpc(match[1],args);
    const status=result.error?({'28000':401,'42501':403,'P0002':404,'40001':409,'23505':409,'22023':400,'23514':400}[result.error.code]||500):200;
    return new Response(JSON.stringify(result.error?{code:result.error.code}:result.data),{status,headers:{'content-type':'application/json'}});
  }});
  const handler=createLessonHandler({rpc,mathEngine:katex});
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

  const capabilities={contract:'echs.lesson.authoring.v1',content_version:2,blocks:{'rich-text':[1,2],math:[1,2],callout:[1,2],'legacy-embedded':[1]},math_expression_version:1};
  assert.deepEqual(await expect('/health/authoring',null),{ok:true,service:'lesson-api',contract:LESSON_API_CONTRACT,authoring_capabilities:capabilities});
  assert.deepEqual(rpcCalls,[{name:'lesson_content_capabilities',action:undefined}]);
  assert.deepEqual(transportCalls,rpcCalls);
  assert.deepEqual((await expect('/context','teacher')).authoring_capabilities,capabilities);
  assert.deepEqual((await expect('/context','unassigned_teacher')).classes,[]);
  await expect('/context','student',undefined,403);
  await expect('/context','parent',undefined,403);
  await expect('/context',null,undefined,401);
  assert.ok(rpcCalls.some(call=>call.name==='lesson_content_capabilities'));
  assert.deepEqual(transportCalls,rpcCalls);
  passed('actual handler and production transport confirm public data-free authoring health and authenticated context against installed SQL; student/parent/guest context denied');

  const {cases}=JSON.parse(fs.readFileSync(new URL('./lesson-runtime/fixtures/content-v2-cases.json',import.meta.url),'utf8'));
  const base=JSON.parse(fs.readFileSync(new URL('./lesson-runtime/fixtures/published-original.lesson.json',import.meta.url),'utf8'));
  Object.assign(base,{lesson_id:randomUUID(),course_version_id:fixture.course_version_id,unit_id:'legacy:ap-calculus:unit:1',topic_id:'legacy:ap-calculus:topic:1.7',document_version:1});
  base.publication={status:'draft',audience:'institutional',revision:1};
  const pinBody={course_version_id:fixture.course_version_id,expected_assignment_id:null,reason:'Explicit isolated content-v2 pin'};
  await expect(`/classes/${fixture.class}/course-version`,'teacher',pinBody,403);
  const pin=await expect(`/classes/${fixture.class}/course-version`,'admin',pinBody);
  assert.equal(pin.assignment.assigned_by,fixture.admin);
  let record=await expect('/lessons','teacher',{class_id:fixture.class,course_version_id:fixture.course_version_id,access_key:fixture.access_key,document:base,private_notes:NOTE,expected_revision:0},201);
  const lessonPath='/lessons/'+record.lesson.id,firstVersion=record.head.id;
  const originalDocument=clone(record.head.document);
  const mutation=(suffix,actor='teacher',extra={},status=200)=>expect(lessonPath+'/'+suffix,actor,{expected_revision:record.lesson.head_revision,...extra},status);
  passed('real exact curriculum pin and version-1 draft creation remain supported after all 23 migrations');

  for(const item of cases.filter(item=>!item.valid)) {
    const draft=clone(record.head.document);draft.slides=[{id:'invalid-v2',title:'Invalid fixture',layout:'single',blocks:[item.block]}];
    const writes=rpcCalls.filter(call=>call.name==='lesson_store'&&['save','create'].includes(call.action)).length;
    await mutation('draft','teacher',{document:draft,private_notes:NOTE},422);
    assert.equal(rpcCalls.filter(call=>call.name==='lesson_store'&&['save','create'].includes(call.action)).length,writes,item.label);
  }
  for(const tex of ['\\frac{1}{','\\href{https://example.org}{x}','<img src=x>','\\newcommand{\\x}{y}']) {
    const draft=clone(record.head.document),block=clone(cases[1].block);block.content.source={mode:'tex',tex};
    draft.slides=[{id:'invalid-tex',title:'Invalid mathematics',layout:'single',blocks:[block]}];
    await mutation('draft','teacher',{document:draft,private_notes:NOTE},422);
  }
  assert.equal((await expect(lessonPath,'teacher')).head.id,firstVersion);
  passed('all shared malformed v2 structures and unsafe/malformed actual KaTeX inputs fail before write RPC');

  const mixed=clone(record.head.document);
  mixed.slides.push({id:'content-v2',title:'Original mixed content',layout:'three-panel',blocks:cases.slice(0,3).map(item=>clone(item.block))});
  record=await mutation('draft','teacher',{document:mixed,private_notes:NOTE+' V2'});
  assert.deepEqual(record.head.document.slides,mixed.slides);
  const v2Version=record.head.id;
  assert.equal((await expect(lessonPath+'/versions/'+v2Version,'teacher')).version.private_notes,NOTE+' V2');
  for(const actor of ['student','parent'])await expect(lessonPath,actor,undefined,403);
  for(const actor of ['foreign_teacher','unassigned_teacher'])await expect(lessonPath,actor,undefined,404);
  await expect(lessonPath+'/published?class_id='+fixture.class,'student',undefined,404);
  passed('mixed v1/v2 save and private history preserve class/org authorization and unpublished student denial');

  await mutation('publish','teacher',{},409);
  record=await mutation('request-review');
  await mutation('approve','teacher',{checks,comment:REVIEW},404);
  await mutation('approve','reviewer',{checks:{...checks,student_safe:false},comment:REVIEW},422);
  record=await mutation('approve','reviewer',{checks,comment:REVIEW});
  record=await mutation('publish');
  const publishedPath=lessonPath+'/published?class_id='+fixture.class;
  const live=await expect(publishedPath,'student');
  assert.deepEqual(live.document.slides,mixed.slides);
  assert.equal(live.binding.account_id,fixture.student);assert.equal(live.binding.organization_id,fixture.organization);
  assert.equal(live.binding.class_id,fixture.class);
  for(const marker of [NOTE,REVIEW,'private_notes','reviews','head_version_id'])assert.ok(!JSON.stringify(live).includes(marker));
  await expect(lessonPath+'/published?class_id='+fixture.foreign_class,'student',undefined,404);
  passed('real independent review and publication deliver v2 with exact account/class binding and no notes or review metadata');

  await expect(lessonPath+'/draft','teacher',{expected_revision:record.lesson.head_revision-1,document:record.head.document,private_notes:NOTE},409);
  const changed=clone(record.head.document);changed.title='Newer private version';
  record=await mutation('draft','teacher',{document:changed,private_notes:NOTE+' AFTER'});
  assert.deepEqual((await expect(publishedPath,'student')).document,live.document);
  record=await mutation('restore','teacher',{version_id:firstVersion});
  assert.notEqual(record.head.id,firstVersion);assert.deepEqual(record.head.document.slides,originalDocument.slides);
  assert.equal(record.head.private_notes,NOTE);
  assert.deepEqual((await expect(lessonPath+'/versions/'+firstVersion,'teacher')).version.document,originalDocument);
  assert.deepEqual((await expect(publishedPath,'student')).document,live.document);
  await expect(lessonPath+'/versions/'+v2Version,'student',undefined,403);
  passed('stale-save CAS, v1 restoration and immutable history survive v2; newer/restored drafts never replace the current live snapshot');

  record=await mutation('unpublish','teacher',{reason:'Explicit original content-v2 withdrawal'});
  await expect(publishedPath,'student',undefined,404);
  await expect(publishedPath+'&publication_id='+live.publication_id,'student',undefined,422);
  assert.equal((await expect(lessonPath+'/versions/'+v2Version,'teacher')).version.id,v2Version);
  report.rpc_count=rpcCalls.length;
  passed('unpublication withdraws v2 student delivery and denies old-publication substitution while preserving staff recovery');
  report.status='PASS';saveReport();console.log(`Lesson content-v2 HTTP/real-PostgreSQL: PASS; ${report.checks.length} groups`);
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
