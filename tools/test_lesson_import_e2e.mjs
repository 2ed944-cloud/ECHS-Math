#!/usr/bin/env node
// ECHS-014: original native reference import through production client/handler/transport/RPC contracts, real isolated PG15.
// No authorization stubs, external HTTP, source migration or production writes.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {randomUUID,createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import {fileURLToPath} from 'node:url';
import katex from './lesson-runtime/node_modules/katex/dist/katex.mjs';
import {createLessonHandler} from '../supabase/functions/lesson-api/handler.mjs';
import {createRpcTransport} from '../supabase/functions/lesson-api/transport.mjs';
import {createStudioClient} from '../js/lesson-studio/api-client.mjs';
import {createLessonDraft} from '../js/lesson-studio/draft-model.mjs';
import {IB13_REFERENCE} from '../js/lesson-studio/ib13-reference.mjs';
import {createIB13Import,isIB13ImportTarget} from '../js/lesson-studio/ib13-import-model.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const reportPath=path.join(root,'reports/lesson-import-e2e.json');
const report={status:'RUNNING; NOT PASS',production_calls:false,external_network:false,
  transport:'Actual HTTP handler and createRpcTransport into real PostgreSQL service-role RPCs',checks:[]};
const save=()=>{fs.mkdirSync(path.dirname(reportPath),{recursive:true});fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');};
const passed=label=>{report.checks.push(label);console.log('PASS '+label);save();};
const clone=value=>JSON.parse(JSON.stringify(value));
const REVIEW={curriculum:true,mathematics:true,accessibility:true,rights:true,student_safe:true};
const NOTE='PRIVATE_IMPORT_CANARY';
const COMMENT='PRIVATE_IMPORT_REVIEW_COMMENT';
let child,closed,phase='startup';
const studioClients=[];
try {
  assert.ok(process.env.ECHS_LESSON_TEST_DSN,'Explicit isolated loopback database required');
  const prior=JSON.parse(fs.readFileSync(path.join(root,'reports/lesson-recovery-database.json'),'utf8'));
  assert.equal(prior.status,'PASS');assert.equal(prior.migrations.length,25);assert.equal(prior.checks.length,67);assert.equal(prior.production_calls,false);
  for(const item of prior.migrations){assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root,'supabase/migrations',item.file))).digest('hex'),item.sha256);}
  report.migration_count=25;report.prior_recovery_checks=67;report.source_migrations_verified=true;
  globalThis.fetch=async()=>{throw new Error('External requests forbidden in history integration');};
  child=spawn(process.env.ECHS_PYTHON||'python',[fileURLToPath(new URL('./lesson_persistence_rpc_fixture.py',import.meta.url)),'--ib13-import'],{cwd:root,env:process.env,stdio:['pipe','pipe','pipe'],windowsHide:true});
  closed=new Promise(resolve=>child.once('close',resolve));let readyResolve,readyReject;
  const ready=new Promise((resolve,reject)=>{readyResolve=resolve;readyReject=reject;});
  const startup=setTimeout(()=>readyReject(new Error('Isolated fixture startup timeout')),30000),pending=new Map();let sequence=0;
  child.stderr.on('data',()=>{});child.on('error',()=>readyReject(new Error('Isolated fixture process failed')));
  readline.createInterface({input:child.stdout}).on('line',line=>{
    let data;try{data=JSON.parse(line);}catch{readyReject(new Error('Invalid fixture protocol'));return;}
    if(data.event==='ready'){clearTimeout(startup);readyResolve(data);return;}
    if(data.event==='startup_error'){clearTimeout(startup);readyReject(new Error('Isolated fixture refused startup'));return;}
    const waiting=pending.get(data.id);if(waiting){pending.delete(data.id);clearTimeout(waiting.timer);waiting.resolve(data.result);}
  });
  closed.then(()=>{clearTimeout(startup);readyReject(new Error('Isolated fixture closed'));for(const waiting of pending.values()){clearTimeout(waiting.timer);waiting.reject(new Error('Isolated fixture closed'));}pending.clear();});
  const initialized=await ready,fixture=initialized.fixture;report.postgres_version=initialized.postgres_version;
  const allowed=['api_session_lookup','lesson_store','lesson_store_health','lesson_content_capabilities','lesson_media_capabilities','lesson_recovery_capabilities'];
  const calls=[];let dropAfter=null,dropBefore=null;
  const database=(name,args)=>new Promise((resolve,reject)=>{assert.ok(allowed.includes(name));const id=++sequence,timer=setTimeout(()=>{pending.delete(id);reject(new Error('Isolated RPC timeout'));},15000);pending.set(id,{resolve,reject,timer});child.stdin.write(JSON.stringify({id,name,args})+'\n',error=>{if(error){clearTimeout(timer);pending.delete(id);reject(new Error('Isolated RPC input failed'));}});});
  const rpc=createRpcTransport({url:'https://historyfixture.supabase.co',serviceKey:'isolated-history-fixture-service-key',fetch:async(url,options)=>{
    const target=new URL(url);assert.equal(target.origin,'https://historyfixture.supabase.co');assert.equal(target.search,'');assert.equal(target.hash,'');
    const name=target.pathname.replace('/rest/v1/rpc/','');assert.equal(target.pathname,'/rest/v1/rpc/'+name);assert.ok(allowed.includes(name));
    assert.equal(options.method,'POST');assert.equal(options.cache,'no-store');assert.equal(options.credentials,'omit');assert.equal(options.redirect,'error');assert.ok(options.signal instanceof AbortSignal);
    assert.equal(options.headers.apikey,'isolated-history-fixture-service-key');assert.equal(options.headers.authorization,'Bearer isolated-history-fixture-service-key');
    const args=JSON.parse(options.body);calls.push({name,action:args.p_action});
    if(name==='lesson_store'&&args.p_action===dropBefore){dropBefore=null;throw new Error('Deliberate pre-commit transport failure');}
    const result=await database(name,args);
    if(name==='lesson_store'&&args.p_action===dropAfter){dropAfter=null;assert.equal(result.error,null);throw new Error('Deliberate lost acknowledgement after real commit');}
    return new Response(JSON.stringify(result.error?{code:result.error.code}:result.data),{status:result.error?400:200,headers:{'content-type':'application/json'}});
  }});
  const noStorage=()=>{throw new Error('History must not use object Storage');};
  const handler=createLessonHandler({rpc,mathEngine:katex,assetStorage:{put:noStorage,get:noStorage,removeTemporary:noStorage}});
  const request=(endpoint,actor='teacher',body)=>new Request('https://fixture.invalid/functions/v1/lesson-api'+endpoint,{method:body===undefined?'GET':'POST',headers:{origin:'https://2ed944-cloud.github.io',...(actor===null?{}:{authorization:'Bearer '+(fixture.tokens[actor]||actor)}),...(body===undefined?{}:{'content-type':'application/json'})},...(body===undefined?{}:{body:JSON.stringify(body)})});
  const expect=async(endpoint,actor,body,status=200)=>{report.last_http=(body===undefined?'GET ':'POST ')+endpoint.replace(/[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}/gi,'<uuid>');const response=await handler(request(endpoint,actor,body));assert.equal(response.status,status,'Unexpected history HTTP status');assert.match(response.headers.get('cache-control'),/no-store/);assert.match(response.headers.get('cache-control'),/private/);assert.equal(response.headers.get('x-content-type-options'),'nosniff');return response.json();};
  phase='active IB course and real catalog';
  assert.equal(fixture.course_version_id,'9a875b4c-61af-5001-9f31-a22044f6f58d');
  await expect('/classes/'+fixture.class+'/course-version','admin',{course_version_id:fixture.course_version_id,expected_assignment_id:null,reason:'Explicit isolated IB reference import fixture'});
  const context=await expect('/context?class_id='+fixture.class,'teacher');
  assert.equal(context.current_assignment.course_version_id,fixture.course_version_id);
  const catalog=context.catalog.find(item=>item.access_key===fixture.access_key);
  assert.ok(isIB13ImportTarget({courseVersionId:fixture.course_version_id,catalog}));
  assert.equal(catalog.route_path,IB13_REFERENCE.source.path);
  passed('all25 exact migrations precede the real active-2021 IB class pin and catalog binding');

  async function studio(actor){
    const token=fixture.tokens[actor],account={id:fixture[actor],organization_id:fixture.organization,role:actor==='reviewer'?'teacher':actor,status:'active',display_name:'Isolated import '+actor};
    const local=new Map([['echs_institution_token_v1',token],['echs_institution_account_v1',JSON.stringify(account)],['echs_institution_expires_v1',new Date(Date.now()+3600000).toISOString()]]),writes=[];
    const storage=map=>({getItem:key=>map.get(key)??null,setItem:(key,value)=>{writes.push(['set',key]);map.set(key,String(value));},removeItem:key=>{writes.push(['remove',key]);map.delete(key);}});
    const win=new EventTarget();win.document=new EventTarget();win.location={href:'https://2ed944-cloud.github.io/ECHS-Math/lesson-studio.html'};win.localStorage=storage(local);win.sessionStorage=storage(new Map());
    const institution={token:()=>token,account:()=>clone(account),config:async()=>({enabled:true,api_base:'https://historyfixture.supabase.co/functions/v1',site_base:'https://2ed944-cloud.github.io/ECHS-Math/'}),me:async force=>{
      assert.equal(force,true);const lookup=await rpc('api_session_lookup',{p_token_hash:createHash('sha256').update(token).digest('hex')});assert.equal(lookup.error,null);assert.equal(lookup.data.length,1);assert.equal(lookup.data[0].account_id,account.id);assert.equal(lookup.data[0].organization_id,account.organization_id);assert.equal(lookup.data[0].role,account.role);return clone(account);
    }};
    const client=createStudioClient({window:win,institution,mathEngine:katex,timeoutMs:15000,fetch:async(url,options)=>{
      const target=new URL(url);assert.equal(target.origin,'https://historyfixture.supabase.co');assert.ok(target.pathname.startsWith('/functions/v1/lesson-api/'));assert.equal(options.credentials,'omit');assert.equal(options.redirect,'error');assert.equal(options.cache,'no-store');
      const response=await handler(new Request(url,{...options,headers:{...options.headers,origin:'https://2ed944-cloud.github.io'}}));Object.defineProperty(response,'url',{value:url});return response;
    }});studioClients.push(client);await client.initialize();await client.context(fixture.class);return {client,writes};
  }
  const teacher=await studio('teacher'),client=teacher.client;
  phase='pure reviewed document import';
  const base=createLessonDraft({lessonId:randomUUID(),courseVersionId:fixture.course_version_id,catalog,title:'Original IB reference import fixture',objective:'Compare geometric terms and finite sums using reviewed teaching explanations.',skill:'teacher:fixture:geometric-structure',summary:'Original reviewed geometric teaching content with explicit preserved lesson references.'});
  const beforeBase=clone(base),beforeCalls=calls.length;
  const selectedSlideIds=IB13_REFERENCE.slides.filter(slide=>slide.disposition==='native').map(slide=>slide.id);
  const imported=createIB13Import({baseDocument:base,selectedSlideIds,mathEngine:katex});
  assert.deepEqual(base,beforeBase);assert.equal(calls.length,beforeCalls);assert.equal(imported.document.slides.length,78);
  assert.equal(imported.summary.nativeSlides,selectedSlideIds.length);assert.equal(imported.summary.referenceSlides,78-selectedSlideIds.length);
  assert.deepEqual(imported.document.objectives,base.objectives);assert.deepEqual(imported.document.skills,base.skills);
  for(const slide of imported.document.slides)for(const block of slide.blocks)if(block.type==='legacy-embedded')assert.equal(block.content.source,fixture.route_path);
  passed('the source-specific model produces78 canonical slots without RPC calls, metadata rewriting or source mutation');

  phase='lost creation acknowledgement';
  const payload={class_id:fixture.class,course_version_id:fixture.course_version_id,access_key:fixture.access_key,document:imported.document,private_notes:NOTE,expected_revision:0};
  const creates=calls.filter(item=>item.action==='create').length;dropAfter='create';
  await assert.rejects(client.create(payload));assert.equal(dropAfter,null);
  let record=await client.get(imported.document.lesson_id);
  assert.equal(calls.filter(item=>item.action==='create').length,creates+1);assert.equal(record.lesson.head_revision,1);assert.equal(record.versions.length,1);
  assert.deepEqual(record.head.document,imported.document);assert.equal(record.head.private_notes,NOTE);
  assert.equal(record.lesson.route_path,fixture.route_path);assert.equal(record.lesson.legacy_course_key,'ib-math-ai');
  const original=clone(record.head),lessonPath='/lessons/'+record.lesson.id;
  passed('production Studio client and HTTP/SQL persist the complete78-slot import once and reconcile a lost acknowledgement by read');

  phase='private access and duplicate route';
  for(const actor of ['student','parent',null])await expect(lessonPath,actor,undefined,actor===null?401:403);
  for(const actor of ['foreign_teacher','unassigned_teacher'])await expect(lessonPath,actor,undefined,404);
  const duplicate=clone(payload);duplicate.document.lesson_id=randomUUID();await expect('/lessons','teacher',duplicate,409);
  assert.deepEqual((await client.get(record.lesson.id)).head,original);
  await expect(lessonPath+'/published?class_id='+fixture.class,'student',undefined,404);
  passed('student, parent, foreign and unassigned access remain denied and a second import cannot overwrite an occupied route');

  phase='native edit and stale revision';
  const edited=clone(record.head.document),native=edited.slides.find(slide=>selectedSlideIds.includes(slide.id));native.title='Reviewed teacher revision of an imported explanation';
  const saved=await client.save(record.lesson.id,{expected_revision:record.lesson.head_revision,document:edited,private_notes:NOTE+'-edited'});
  assert.equal(saved.lesson.head_revision,2);assert.equal(saved.head.document.slides.length,78);assert.equal(saved.head.document.slides.find(slide=>slide.id===native.id).title,native.title);
  assert.deepEqual(saved.head.document.slides.filter(slide=>slide.id!==native.id),original.document.slides.filter(slide=>slide.id!==native.id));
  await assert.rejects(client.save(record.lesson.id,{expected_revision:1,document:edited,private_notes:''}),error=>error.status===409);
  record=await client.get(record.lesson.id);assert.deepEqual(record.head,saved.head);
  passed('native content edits round-trip through the real versioned store while stale saves cannot replace the current78-slot document');

  phase='subset and malformed selection';
  const subset=createIB13Import({baseDocument:base,selectedSlideIds:[selectedSlideIds[0]],mathEngine:katex});
  assert.equal(subset.summary.nativeSlides,1);assert.equal(subset.summary.referenceSlides,77);assert.equal(subset.document.slides.length,78);
  for(const bad of [[],[selectedSlideIds[0],selectedSlideIds[0]],['unreviewed-slide']])assert.throws(()=>createIB13Import({baseDocument:base,selectedSlideIds:bad,mathEngine:katex}));
  assert.equal(isIB13ImportTarget({courseVersionId:'56880c32-495b-5f31-a0aa-b04efa1b34b7',catalog}),false);
  const wrong=clone(base);wrong.topic_id='legacy:ib-math-ai:topic:1.4';assert.throws(()=>createIB13Import({baseDocument:wrong,selectedSlideIds,mathEngine:katex}));
  passed('partial selection retains every source slot and rejects empty, repeated, unknown and wrong-version/topic import identities');

  phase='unchanged publication gate';
  record=await client.requestReview(record.lesson.id,record.lesson.head_revision);
  const approvalDenial=await expect(lessonPath+'/approve','reviewer',{expected_revision:record.lesson.head_revision,checks:REVIEW,comment:COMMENT},503);
  const publicationDenial=await expect(lessonPath+'/publish','teacher',{expected_revision:record.lesson.head_revision},503);
  assert.equal(approvalDenial.error.code,'invalid_stored_document');assert.equal(publicationDenial.error.code,'invalid_stored_document');
  const after=await client.get(record.lesson.id);assert.equal(after.lesson.active_publication_id,null);assert.equal(after.lesson.head_revision,record.lesson.head_revision);assert.deepEqual(after.head.document,record.head.document);
  await expect(lessonPath+'/published?class_id='+fixture.class,'student',undefined,404);
  passed('unresolved original-lesson references remain unpublishable even with explicit approval declarations');

  phase='retained source and mutation boundaries';
  const old=await expect(lessonPath+'/versions/'+original.id,'teacher');assert.deepEqual(old.version,original);
  assert.deepEqual(teacher.writes,[]);assert.ok(calls.every(call=>allowed.includes(call.name)));assert.ok(!calls.some(call=>/mastery|attempt|learning|completion/.test(call.name)));
  assert.equal(record.head.document.slides.length,78);report.production_studio_client_integration=true;report.migration_count=25;report.native_slides=selectedSlideIds.length;report.reference_slides=78-selectedSlideIds.length;
  report.source_module_sha256=createHash('sha256').update(fs.readFileSync(path.join(root,'js/lesson-studio/ib13-reference.mjs'))).digest('hex');
  passed('immutable original import history remains staff-only and the production client makes no browser-storage or mastery calls');
  assert.equal(report.checks.length,8);report.rpc_count=calls.length;report.status='PASS';save();console.log('Lesson import HTTP/real-PostgreSQL: PASS;8 groups');
}catch(error){
  const safe=value=>typeof value==='string'&&/^[A-Za-z0-9_.=-]{1,80}$/.test(value)?value:undefined;
  report.status='FAIL';report.error_type=error?.name||'Error';report.diagnostic={phase,code:safe(error?.code),operator:safe(error?.operator),actual_number:typeof error?.actual==='number'?error.actual:undefined,expected_number:typeof error?.expected==='number'?error.expected:undefined,source_location:String(error?.stack||'').match(/test_lesson_import_e2e\.mjs:\d+:\d+/)?.[0]};save();process.exitCode=1;console.error('Import integration failed: '+JSON.stringify({type:report.error_type,...report.diagnostic,last_http:report.last_http}));
}finally{for(const client of studioClients)client.dispose();if(child){child.stdin.end();let timer;const expired=await Promise.race([closed.then(()=>false),new Promise(resolve=>{timer=setTimeout(()=>resolve(true),10000);})]);clearTimeout(timer);if(expired)child.kill();}}
