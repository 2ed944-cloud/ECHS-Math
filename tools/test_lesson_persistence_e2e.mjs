#!/usr/bin/env node
// Actual Request/Response handler + pinned KaTeX + actual session-authenticated
// PostgreSQL RPCs. The subprocess is a parameterized transport, not an auth mock.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import katex from './lesson-runtime/node_modules/katex/dist/katex.mjs';
import { createLessonHandler, LESSON_API_CONTRACT } from '../supabase/functions/lesson-api/handler.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const reportIndex = process.argv.indexOf('--report');
const reportPath = path.resolve(reportIndex < 0 ? path.join(root,'reports/lesson-persistence-e2e.json') : process.argv[reportIndex+1]);
const report = { status:'RUNNING; NOT PASS', production_calls:false, external_network:false,
  transport:'Actual HTTP handler and KaTeX through parameterized Python stdio to real PostgreSQL service-role RPCs', checks:[] };
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
  child = spawn(process.env.ECHS_PYTHON || 'python',[fileURLToPath(new URL('./lesson_persistence_rpc_fixture.py',import.meta.url))],
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
  const rpc = (name,args) => new Promise((resolve,reject)=>{
    assert.ok(['api_session_lookup','lesson_store','lesson_store_health'].includes(name));
    rpcCalls.push({name,action:args.p_action});
    const id=++sequence;
    const timer=setTimeout(()=>{pending.delete(id);reject(new Error('Database RPC timed out'));},15000);
    pending.set(id,{resolve,reject,timer});
    child.stdin.write(JSON.stringify({id,name,args})+'\n',error=>{if(error){clearTimeout(timer);pending.delete(id);reject(error);}});
  });
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
  assert.deepEqual(await expect('/health',null),{ok:true,service:'lesson-api',contract:LESSON_API_CONTRACT});
  assert.equal((await expect('/context','teacher')).classes[0].id,fixture.class);
  assert.deepEqual((await expect('/context','unassigned_teacher')).classes,[]);
  await expect('/context',null,undefined,401);
  await expect('/context','not-a-real-opaque-school-token',undefined,401);
  await expect('/context','teacher',undefined,403,{origin:'https://untrusted.invalid'});
  passed('real health/session lookup, no-store headers, missing/invalid sessions and origin refusal');

  const base=JSON.parse(fs.readFileSync(new URL('./lesson-runtime/fixtures/published-original.lesson.json',import.meta.url),'utf8'));
  Object.assign(base,{lesson_id:randomUUID(),course_version_id:fixture.course_version_id,unit_id:'legacy:ap-calculus:unit:1',topic_id:'legacy:ap-calculus:topic:1.7',document_version:1});
  base.publication={status:'draft',audience:'institutional',revision:1};
  const createBody={class_id:fixture.class,course_version_id:fixture.course_version_id,access_key:fixture.access_key,document:base,private_notes:NOTE,expected_revision:0};
  await expect('/lessons','teacher',createBody,404);
  const pinPath=`/classes/${fixture.class}/course-version`;
  const pinBody={course_version_id:fixture.course_version_id,expected_assignment_id:null,reason:'Explicit isolated HTTP course approval'};
  await expect(pinPath,'teacher',pinBody,403);
  const pin=await expect(pinPath,'admin',pinBody);
  assert.equal(pin.assignment.assigned_by,fixture.admin);
  await expect(pinPath,'admin',pinBody,409);
  await expect(pinPath,'admin',{...pinBody,course_version_id:randomUUID(),expected_assignment_id:pin.assignment.id},409);
  const context=await expect('/context?class_id='+fixture.class,'teacher');
  assert.equal(context.current_assignment.id,pin.assignment.id);
  assert.equal(context.catalog[0].access_key,fixture.access_key);
  passed('actual explicit administrator pin and conflict/failed-replacement rollback control create eligibility');

  const malformed=clone(createBody);
  malformed.document.slides[0].blocks=[{id:'invalid-math',type:'math',version:1,content:{tex:'\\frac{',spoken:'Invalid fraction',display:true}}];
  await expect('/lessons','teacher',malformed,422);
  await expect('/lessons','teacher',{...createBody,organization_id:fixture.foreign_organization},422);
  await expect('/lessons','student',createBody,403);
  let record=await expect('/lessons','teacher',createBody,201);
  const lessonPath='/lessons/'+record.lesson.id;
  const firstVersion=record.head.id;
  assert.equal(record.lesson.head_revision,1);
  assert.equal(record.lesson.class_id,fixture.class);
  assert.equal(record.head.private_notes,NOTE);
  assert.equal((await expect(lessonPath,'teacher')).head.id,firstVersion);
  assert.equal((await expect('/lessons?class_id='+fixture.class,'teacher')).lessons[0].id,record.lesson.id);
  const history=await expect(lessonPath+'/history?limit=1','teacher');
  assert.equal(history.versions[0].id,firstVersion);
  assert.ok(!JSON.stringify(history).includes(NOTE));
  assert.equal((await expect(lessonPath+'/versions/'+firstVersion,'teacher')).version.private_notes,NOTE);
  passed('actual KaTeX and schema reject malformed content before real draft create/get/list/history/version recovery');

  for(const actor of ['student','parent'])await expect(lessonPath,actor,undefined,403);
  for(const actor of ['foreign_teacher','unassigned_teacher'])await expect(lessonPath,actor,undefined,404);
  await expect(lessonPath+'/history','student',undefined,403);
  await expect(lessonPath+'/versions/'+firstVersion,'student',undefined,403);
  await expect(lessonPath+'/published?class_id='+fixture.class,'student',undefined,404);
  await expect(lessonPath+'/published?class_id='+fixture.class,'parent',undefined,403);
  await expect(lessonPath+'/published?class_id='+fixture.foreign_class,'student',undefined,404);
  passed('student authoring, parent delivery, cross-tenant staff, unassigned staff and unpublished delivery fail closed');

  const mutation=async(suffix,actor,extra={},status=200)=>expect(lessonPath+'/'+suffix,actor,{expected_revision:record.lesson.head_revision,...extra},status);
  await mutation('publish','teacher',{},409);
  record=await mutation('request-review','teacher');
  await mutation('approve','teacher',{checks,comment:REVIEW},404);
  await mutation('approve','reviewer',{checks:{...checks,student_safe:false},comment:REVIEW},422);
  record=await mutation('approve','reviewer',{checks,comment:REVIEW});
  assert.equal(record.lesson.workflow_state,'approved');
  record=await mutation('publish','teacher');
  assert.equal(record.lesson.workflow_state,'published');
  const publishedPath=lessonPath+'/published?class_id='+fixture.class;
  const published=await expect(publishedPath,'student');
  assert.equal(published.document.publication.status,'published');
  assert.equal(published.document.publication.audience,'institutional');
  assert.equal(published.binding.account_id,fixture.student);
  assert.equal(published.binding.organization_id,fixture.organization);
  assert.equal(published.binding.class_id,fixture.class);
  assert.equal(published.binding.document.course_version_id,fixture.course_version_id);
  assert.equal(published.binding.route,'https://2ed944-cloud.github.io/ECHS-Math/'+fixture.route_path);
  for(const privateMarker of [NOTE,REVIEW,'private_notes','reviews','head_version_id'])assert.ok(!JSON.stringify(published).includes(privateMarker));
  passed('independent five-check review and real publication produce account/class-bound student document without notes or staff metadata');

  const staleRevision=record.lesson.head_revision-1;
  await expect(lessonPath+'/draft','teacher',{expected_revision:staleRevision,document:record.head.document,private_notes:NOTE},409);
  const changed=clone(record.head.document);
  changed.title='Saved newer draft remains private';
  record=await mutation('draft','teacher',{document:changed,private_notes:NOTE+'-NEW'});
  assert.equal(record.head.document.title,changed.title);
  assert.deepEqual((await expect(publishedPath,'student')).document,published.document);
  await expect(lessonPath+'/versions/'+record.head.id,'student',undefined,403);
  passed('stale HTTP save conflicts; accepted newer draft leaves exact published document live and private version inaccessible');

  record=await mutation('restore','teacher',{version_id:firstVersion});
  assert.notEqual(record.head.id,firstVersion);
  assert.equal(record.head.private_notes,NOTE);
  assert.equal(record.head.document.title,base.title);
  assert.deepEqual((await expect(publishedPath,'student')).document,published.document);
  const page=await expect(lessonPath+'/history?limit=1','teacher');
  assert.ok(page.next_before_version);
  const next=await expect(lessonPath+`/history?limit=1&before_version=${page.next_before_version}`,'teacher');
  assert.notEqual(page.versions[0].id,next.versions[0].id);
  passed('HTTP restore appends a private draft and paginated immutable history while retaining prior live snapshot');

  record=await mutation('unpublish','teacher',{reason:'Explicit isolated HTTP withdrawal'});
  assert.equal(record.lesson.active_publication_id,null);
  await expect(publishedPath,'student',undefined,404);
  await expect(publishedPath+'&publication_id='+published.publication_id,'student',undefined,422);
  assert.equal((await expect(lessonPath+'/versions/'+firstVersion,'teacher')).version.private_notes,NOTE);
  assert.ok(rpcCalls.some(call=>call.name==='lesson_store'&&call.action==='deliver'));
  assert.ok(rpcCalls.some(call=>call.name==='lesson_store'&&call.action==='restore'));
  report.rpc_count=rpcCalls.length;
  passed('HTTP unpublish withdraws delivery and old-publication substitution while preserving original staff history');
  report.status='PASS';saveReport();console.log(`Lesson HTTP/real-PostgreSQL integration: PASS; ${report.checks.length} groups`);
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
