#!/usr/bin/env node
// ECHS-012: existing production handler/transport/RPC contracts, real isolated PG15.
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
import {createHistorySession} from '../js/lesson-studio/history-session.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const reportPath=path.join(root,'reports/lesson-history-e2e.json');
const report={status:'RUNNING; NOT PASS',production_calls:false,external_network:false,
  transport:'Actual HTTP handler and createRpcTransport into real PostgreSQL service-role RPCs',checks:[]};
const save=()=>{fs.mkdirSync(path.dirname(reportPath),{recursive:true});fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');};
const passed=label=>{report.checks.push(label);console.log('PASS '+label);save();};
const clone=value=>JSON.parse(JSON.stringify(value));
const REVIEW={curriculum:true,mathematics:true,accessibility:true,rights:true,student_safe:true};
const NOTE='PRIVATE_HISTORY_CANARY';
const COMMENT='PRIVATE_HISTORY_REVIEW_COMMENT';
const VERSION_KEYS=['id','organization_id','lesson_id','version_number','created_by','created_at','restored_from_version_id'].sort();
const REVIEW_KEYS=['id','organization_id','lesson_id','version_id','revision','event_type','actor_id','checks','comment','created_at'].sort();
const PUBLICATION_KEYS=['id','organization_id','lesson_id','source_version_id','revision','event_type','actor_id','reason','created_at'].sort();
let child,closed,phase='startup';
const studioClients=[],historyControllers=[];
try {
  assert.ok(process.env.ECHS_LESSON_TEST_DSN,'Explicit isolated loopback database required');
  const prior=JSON.parse(fs.readFileSync(path.join(root,'reports/lesson-recovery-database.json'),'utf8'));
  assert.equal(prior.status,'PASS');assert.equal(prior.migrations.length,25);assert.equal(prior.checks.length,67);assert.equal(prior.production_calls,false);
  for(const item of prior.migrations){assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root,'supabase/migrations',item.file))).digest('hex'),item.sha256);}
  report.migration_count=25;report.prior_recovery_checks=67;report.source_migrations_verified=true;
  globalThis.fetch=async()=>{throw new Error('External requests forbidden in history integration');};
  child=spawn(process.env.ECHS_PYTHON||'python',[fileURLToPath(new URL('./lesson_persistence_rpc_fixture.py',import.meta.url)),'--history'],{cwd:root,env:process.env,stdio:['pipe','pipe','pipe'],windowsHide:true});
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
  const context=await expect('/context','teacher');assert.equal(context.authoring_capabilities.content_version,2);assert.equal(context.media_capabilities.contract,'echs.lesson.media.v1');assert.equal(context.recovery_capabilities.contract,'echs.lesson.recovery.v1');
  const pinPath='/classes/'+fixture.class+'/course-version';
  let pin=await expect(pinPath,'admin',{course_version_id:fixture.course_version_id,expected_assignment_id:null,reason:'Explicit isolated history class pin'});
  const doc=JSON.parse(fs.readFileSync(new URL('./lesson-runtime/fixtures/published-original.lesson.json',import.meta.url),'utf8'));
  Object.assign(doc,{lesson_id:randomUUID(),course_version_id:fixture.course_version_id,unit_id:'legacy:ap-calculus:unit:1',topic_id:'legacy:ap-calculus:topic:1.7',document_version:1});doc.publication={status:'draft',audience:'institutional',revision:1};
  let record=await expect('/lessons','teacher',{class_id:fixture.class,course_version_id:fixture.course_version_id,access_key:fixture.access_key,document:doc,private_notes:NOTE+'-original',expected_revision:0},201);
  const lessonPath='/lessons/'+record.lesson.id,livePath=lessonPath+'/published?class_id='+fixture.class;
  const original=clone(record.head),storedVersions=[clone(record.head)];
  const mutate=(action,actor='teacher',extra={},status=200)=>expect(lessonPath+'/'+action,actor,{expected_revision:record.lesson.head_revision,...extra},status);
  const read=()=>expect(lessonPath,'teacher');
  const sameIdentity=(before,after)=>{for(const key of ['id','organization_id','class_id','course_version_id','access_key','route_path','unit_id','topic_id','created_by','created_at'])assert.equal(after.lesson[key],before.lesson[key]);};
  const advanced=(before,after)=>{sameIdentity(before,after);assert.equal(after.lesson.head_revision,before.lesson.head_revision+1);};
  const unchangedHead=(before,after)=>assert.deepEqual(after.head,before.head);
  const reviewEvent=(after,type,actor)=>{const event=after.reviews.find(item=>item.revision===after.lesson.head_revision);assert.ok(event);assert.deepEqual(Object.keys(event).sort(),REVIEW_KEYS);assert.equal(event.event_type,type);assert.equal(event.actor_id,fixture[actor]);assert.equal(event.version_id,after.head.id);assert.equal(event.lesson_id,after.lesson.id);return event;};
  const publicationEvent=(after,type,actor,source)=>{const event=after.publications.find(item=>item.revision===after.lesson.head_revision);assert.ok(event);assert.deepEqual(Object.keys(event).sort(),PUBLICATION_KEYS);assert.equal(event.event_type,type);assert.equal(event.actor_id,fixture[actor]);assert.equal(event.source_version_id,source);assert.equal(event.lesson_id,after.lesson.id);return event;};
  passed('all25 migrations and exact deployed capability contracts precede real authenticated history fixture creation');

  for(let index=2;index<=29;index++){const document=clone(record.head.document);document.title='Original isolated history draft '+index;record=await mutate('draft','teacher',{document,private_notes:NOTE+'-'+index});storedVersions.push(clone(record.head));}
  assert.equal(record.versions.length,25);assert.equal(record.versions.at(-1).version_number,5);
  const pages=[];let cursor;do{const page=await expect(lessonPath+'/history?limit=7'+(cursor?'&before_version='+cursor:''),'teacher');assert.deepEqual(Object.keys(page).sort(),['ok','contract','versions','next_before_version'].sort());
    assert.ok(page.versions.length<=7);for(const version of page.versions){assert.deepEqual(Object.keys(version).sort(),VERSION_KEYS);assert.equal(version.lesson_id,record.lesson.id);assert.equal(version.organization_id,fixture.organization);assert.equal(version.created_by,fixture.teacher);}
    assert.ok(!JSON.stringify(page).includes(NOTE));pages.push(...page.versions);cursor=page.next_before_version;
  }while(cursor!==null);
  assert.deepEqual(pages.map(item=>item.id),storedVersions.toReversed().map(item=>item.id));assert.equal(new Set(pages.map(item=>item.id)).size,29);
  assert.deepEqual((await expect(lessonPath+'/history?before_version=1','teacher')).versions,[]);
  assert.equal((await expect(lessonPath+'/history?limit=100','teacher')).next_before_version,null);
  assert.equal((await expect(lessonPath+'/history','teacher')).versions.length,25);
  assert.deepEqual((await expect(lessonPath+'/versions/'+original.id,'reviewer')).version,original);
  passed('29 immutable private versions paginate newest-first without gaps, duplication, document bodies or private notes');

  for(const query of ['limit=0','limit=101','limit=1&limit=2','before_version=0','before_version=-1','before_version=1.5','before_version=2147483647','unknown=1'])await expect(lessonPath+'/history?'+query,'teacher',undefined,422);
  await expect(lessonPath+'/versions/'+randomUUID(),'teacher',undefined,404);
  for(const actor of ['student','parent',null])for(const endpoint of [lessonPath,lessonPath+'/history',lessonPath+'/versions/'+original.id])await expect(endpoint,actor,undefined,actor===null?401:403);
  for(const actor of ['foreign_teacher','unassigned_teacher'])for(const endpoint of [lessonPath+'/history',lessonPath+'/versions/'+original.id])await expect(endpoint,actor,undefined,404);
  for(const action of ['restore','request-review','approve','publish','unpublish'])await mutate(action,'student',{version_id:original.id},403);
  passed('history/version bounds, student/parent/guest denial and actual cross-tenant/class authorization remain fail-closed');

  let before=clone(record);record=await mutate('request-review');advanced(before,record);unchangedHead(before,record);assert.equal(record.lesson.workflow_state,'review');reviewEvent(record,'requested','teacher');
  await mutate('approve','teacher',{checks:REVIEW,comment:COMMENT},404);
  await mutate('approve','reviewer',{checks:{...REVIEW,student_safe:false},comment:COMMENT},422);
  await mutate('approve','reviewer',{checks:{...REVIEW,extra:true},comment:COMMENT},422);
  before=clone(record);record=await mutate('approve','reviewer',{checks:REVIEW,comment:COMMENT});advanced(before,record);unchangedHead(before,record);
  const approved=reviewEvent(record,'approved','reviewer');assert.deepEqual(approved.checks,REVIEW);assert.equal(approved.comment,COMMENT);assert.equal(record.lesson.approved_review_id,approved.id);assert.equal(record.lesson.approved_version_id,record.head.id);
  before=clone(record);record=await mutate('publish');advanced(before,record);unchangedHead(before,record);assert.equal(record.lesson.workflow_state,'published');
  const firstPublication=publicationEvent(record,'published','teacher',record.head.id);assert.equal(record.lesson.active_publication_id,firstPublication.id);assert.equal(record.lesson.approved_review_id,approved.id);
  const live=await expect(livePath,'student');assert.equal(live.publication_id,firstPublication.id);assert.equal(live.revision,record.lesson.head_revision);
  for(const marker of [NOTE,COMMENT,'private_notes','reviews','head_version_id'])assert.ok(!JSON.stringify(live).includes(marker));
  passed('independent five-check review and publication produce exact actor/version/revision facts and a private-note-free student snapshot');

  before=clone(record);record=await mutate('restore','reviewer',{version_id:original.id});advanced(before,record);assert.notEqual(record.head.id,original.id);assert.notEqual(record.head.id,before.head.id);assert.equal(record.head.created_by,fixture.reviewer);assert.equal(record.head.restored_from_version_id,original.id);assert.equal(record.head.version_number,record.lesson.head_revision);assert.equal(record.head.private_notes,original.private_notes);assert.equal(record.head.document.title,original.document.title);assert.equal(record.lesson.workflow_state,'draft');assert.equal(record.lesson.approved_version_id,null);assert.equal(record.lesson.approved_review_id,null);assert.equal(record.lesson.active_publication_id,firstPublication.id);
  assert.deepEqual((await expect(lessonPath+'/versions/'+original.id,'teacher')).version,original);assert.deepEqual(await expect(livePath,'student'),live);
  record=await mutate('request-review');await mutate('approve','teacher',{checks:REVIEW,comment:COMMENT},404);await mutate('approve','reviewer',{checks:REVIEW,comment:COMMENT},404);
  record=await mutate('approve','admin',{checks:REVIEW,comment:COMMENT});assert.equal(reviewEvent(record,'approved','admin').id,record.lesson.approved_review_id);
  await expect(lessonPath+'/restore','teacher',{expected_revision:before.lesson.head_revision,version_id:original.id},409);
  passed('restore appends a new draft, preserves old live publication and immutable source, and neither original author nor restoring author may approve it');

  const held=clone(record),oldPin=clone(pin);
  pin=await expect(pinPath,'admin',{course_version_id:fixture.alternate_course_version_id,expected_assignment_id:pin.assignment.id,reason:'Explicit isolated compatible course change'});
  await mutate('publish','teacher',{},404);await expect(livePath,'student',undefined,404);assert.deepEqual(await read(),held);
  await expect(pinPath,'admin',{course_version_id:fixture.course_version_id,expected_assignment_id:oldPin.assignment.id,reason:'Stale pin conflict'},409);
  assert.equal((await expect('/context?class_id='+fixture.class,'teacher')).current_assignment.id,pin.assignment.id);
  assert.equal((await expect(lessonPath+'/history','teacher')).versions[0].id,record.head.id);
  record=await mutate('restore','teacher',{version_id:original.id});assert.equal(record.lesson.active_publication_id,firstPublication.id);
  pin=await expect(pinPath,'admin',{course_version_id:fixture.course_version_id,expected_assignment_id:pin.assignment.id,reason:'Explicit return to original isolated course'});
  assert.deepEqual(await expect(livePath,'student'),live);
  passed('actual administrator pin replacement blocks publication/delivery without destroying history; stale replacement rolls back and explicit repin restores old delivery');

  const lostAction=async(action,dbAction,actor,extra,confirm)=>{
    const base=clone(record),count=calls.filter(item=>item.action===dbAction).length;dropAfter=dbAction;
    await mutate(action,actor,extra,503);assert.equal(dropAfter,null);assert.equal(calls.filter(item=>item.action===dbAction).length,count+1,'No automatic mutation replay');
    const current=await read();advanced(base,current);confirm(base,current);record=current;
    await expect(lessonPath+'/'+action,actor,{expected_revision:base.lesson.head_revision,...extra},409);
    assert.deepEqual(await read(),record);
  };
  await lostAction('restore','restore','teacher',{version_id:original.id},(base,current)=>{assert.equal(current.head.restored_from_version_id,original.id);assert.equal(current.head.created_by,fixture.teacher);assert.equal(current.head.version_number,current.lesson.head_revision);assert.notEqual(current.head.id,base.head.id);assert.equal(current.head.private_notes,original.private_notes);assert.equal(current.lesson.workflow_state,'draft');assert.equal(current.lesson.active_publication_id,firstPublication.id);assert.equal(current.lesson.approved_version_id,null);});
  passed('lost restore acknowledgement is reconciled from new immutable source/actor/revision facts; stale replay cannot append a duplicate restore');
  await lostAction('request-review','request_review','teacher',{},(base,current)=>{unchangedHead(base,current);assert.equal(current.lesson.workflow_state,'review');reviewEvent(current,'requested','teacher');assert.equal(current.lesson.active_publication_id,firstPublication.id);});
  await lostAction('approve','approve','reviewer',{checks:REVIEW,comment:COMMENT},(base,current)=>{unchangedHead(base,current);assert.equal(current.lesson.workflow_state,'approved');const event=reviewEvent(current,'approved','reviewer');assert.deepEqual(event.checks,REVIEW);assert.equal(event.comment,COMMENT);assert.equal(current.lesson.approved_review_id,event.id);assert.equal(current.lesson.approved_version_id,current.head.id);});
  passed('lost review/approval acknowledgements retain precise head, independent actor, all five checks, comment and approved event pointers');
  await lostAction('publish','publish','teacher',{},(base,current)=>{unchangedHead(base,current);assert.equal(current.lesson.workflow_state,'published');const event=publicationEvent(current,'published','teacher',current.head.id);assert.equal(current.lesson.active_publication_id,event.id);assert.equal(current.lesson.approved_review_id,base.lesson.approved_review_id);assert.equal(current.lesson.approved_version_id,base.lesson.approved_version_id);});
  const secondLive=await expect(livePath,'student');assert.notEqual(secondLive.publication_id,live.publication_id);assert.equal(secondLive.document.title,original.document.title);
  await lostAction('unpublish','unpublish','teacher',{reason:'  Explicit isolated withdrawal  '},(base,current)=>{unchangedHead(base,current);assert.equal(current.lesson.workflow_state,'draft');assert.equal(current.lesson.active_publication_id,null);assert.equal(current.lesson.approved_review_id,null);assert.equal(current.lesson.approved_version_id,null);const event=publicationEvent(current,'unpublished','teacher',base.head.id);assert.equal(event.reason,'Explicit isolated withdrawal');});
  await expect(livePath,'student',undefined,404);await expect(livePath+'&publication_id='+live.publication_id,'student',undefined,422);
  passed('lost publish/unpublish acknowledgements reconcile exact publication source/actor/revision and withdrawal reason; old publication substitution remains denied');

  before=clone(record);dropBefore='restore';await mutate('restore','teacher',{version_id:original.id},503);assert.equal(dropBefore,null);assert.deepEqual(await read(),before);
  const count=calls.filter(item=>item.action==='restore').length;record=await mutate('restore','teacher',{version_id:original.id});advanced(before,record);assert.equal(calls.filter(item=>item.action==='restore').length,count+1);
  // A competing actor can advance by exactly one, so an increment is not proof
  // that this actor's pending operation succeeded. Confirming actor/source is vital.
  before=clone(record);record=await mutate('restore','reviewer',{version_id:original.id});advanced(before,record);assert.notEqual(record.head.created_by,fixture.teacher);
  assert.equal(record.head.created_by,fixture.reviewer);assert.equal(record.head.restored_from_version_id,original.id);
  passed('pre-commit failure leaves exact state unchanged for an explicit retry; another actor revision increment is distinguishable from acknowledgement');

  record=await mutate('request-review','reviewer');record=await mutate('approve','admin',{checks:REVIEW,comment:COMMENT});record=await mutate('publish','reviewer');
  const activeSource=record.head.id,activePublication=record.lesson.active_publication_id;
  record=await mutate('restore','teacher',{version_id:original.id});assert.notEqual(record.head.id,activeSource);assert.equal(record.lesson.active_publication_id,activePublication);
  before=clone(record);record=await mutate('unpublish','teacher',{reason:'Withdraw earlier live version while a newer draft exists'});advanced(before,record);unchangedHead(before,record);
  const withdrawal=publicationEvent(record,'unpublished','teacher',activeSource);assert.notEqual(withdrawal.source_version_id,record.head.id);assert.equal(record.lesson.active_publication_id,null);await expect(livePath,'student',undefined,404);
  passed('withdrawing while a newer draft exists records the old live source version, keeps the current draft and clears only publication and approval pointers');

  const beforeHistory=await read();const all=await expect(lessonPath+'/history?limit=100','teacher');assert.equal(all.next_before_version,null);assert.equal(new Set(all.versions.map(item=>item.version_number)).size,all.versions.length);
  assert.ok(all.versions.some((item,index)=>index&&all.versions[index-1].version_number-item.version_number>1),'Workflow revisions create legitimate document-version gaps');
  for(const version of storedVersions){assert.deepEqual((await expect(lessonPath+'/versions/'+version.id,'teacher')).version,version);}
  assert.deepEqual(await read(),beforeHistory);for(const pub of record.publications)assert.ok(!Object.hasOwn(pub,'document'));
  assert.ok(calls.some(item=>item.action==='history')&&calls.some(item=>item.action==='restore')&&calls.some(item=>item.action==='deliver'));
  passed('all original snapshots remain byte-equivalent through workflow history and read-only pagination never changes lesson state');

  // Exercise the actual strict controller and browser client, not a parallel
  // hand-written predicate. Only DOM/session interfaces and Fetch delivery are
  // in-process adapters; me/session lookup and every authoring result are real SQL.
  async function studio(actorName){
    const token=fixture.tokens[actorName],account={id:fixture[actorName],organization_id:fixture.organization,role:actorName==='admin'?'admin':'teacher',status:'active',display_name:'Isolated history staff'};
    const local=new Map([['echs_institution_token_v1',token],['echs_institution_expires_v1',new Date(Date.now()+3600000).toISOString()]]),session=new Map(),writes=[];
    const storage=map=>({getItem:key=>map.get(key)??null,setItem:(key,value)=>{writes.push(key);map.set(key,String(value));},removeItem:key=>{writes.push(key);map.delete(key);}});
    const win=new EventTarget();win.document=new EventTarget();win.location={href:'https://2ed944-cloud.github.io/ECHS-Math/lesson-studio.html?class='+fixture.class+'&lesson='+record.lesson.id};win.localStorage=storage(local);win.sessionStorage=storage(session);
    const institution={token:()=>token,account:()=>clone(account),config:async()=>({enabled:true,api_base:'https://historyfixture.supabase.co/functions/v1',site_base:'https://2ed944-cloud.github.io/ECHS-Math/'}),me:async force=>{
      assert.equal(force,true);const lookup=await rpc('api_session_lookup',{p_token_hash:createHash('sha256').update(token).digest('hex')});assert.equal(lookup.error,null);assert.equal(lookup.data.length,1);
      const row=lookup.data[0];assert.equal(row.account_id,account.id);assert.equal(row.organization_id,account.organization_id);assert.equal(row.role,account.role);assert.equal(row.status,'active');assert.ok(Date.parse(row.expires_at)>Date.now());return clone(account);
    }};
    const client=createStudioClient({window:win,institution,mathEngine:katex,timeoutMs:15000,fetch:async(url,options)=>{
      const target=new URL(url);assert.equal(target.origin,'https://historyfixture.supabase.co');assert.ok(target.pathname.startsWith('/functions/v1/lesson-api/'));assert.equal(options.mode,'cors');assert.equal(options.credentials,'omit');assert.equal(options.redirect,'error');assert.equal(options.cache,'no-store');assert.equal(options.referrerPolicy,'no-referrer');
      const response=await handler(new Request(url,{...options,headers:{...options.headers,origin:'https://2ed944-cloud.github.io'}}));
      // Response.url is supplied by native Fetch; preserve the actual handler
      // response body/status/headers and supply only that transport metadata.
      Object.defineProperty(response,'url',{value:url});return response;
    }});studioClients.push(client);await client.initialize();const initial=await client.get(record.lesson.id);
    const controller=createHistorySession({client,record:initial,mathEngine:katex,isCurrent:()=>true});historyControllers.push(controller);return {client,controller,writes};
  }
  phase='production history controller: initialize and paginate';
  const teacherStudio=await studio('teacher'),teacherHistory=teacherStudio.controller;
  let state=await teacherHistory.refresh();assert.equal(state.status,'ready');assert.equal(state.versions.length,25);assert.ok(state.nextBefore);
  state=await teacherHistory.loadMore();assert.equal(state.status,'ready');assert.ok(state.versions.length>25);assert.equal(state.nextBefore,null);
  state=await teacherHistory.select(original.id);assert.equal(state.status,'ready');assert.deepEqual(state.selected.version,original);
  phase='production history controller: committed restore acknowledgement lost';
  const restores=calls.filter(item=>item.action==='restore').length;dropAfter='restore';
  state=await teacherHistory.act('restore',{version_id:original.id});assert.equal(state.status,'uncertain');assert.equal(state.pending.action,'restore');assert.equal(dropAfter,null);
  state=await teacherHistory.reconcile();assert.equal(state.status,'ready');assert.equal(state.pending,null);assert.equal(state.record.head.restored_from_version_id,original.id);assert.equal(calls.filter(item=>item.action==='restore').length,restores+1);
  phase='production history controller: request review and independent approval';
  state=await teacherHistory.act('requestReview',{});assert.equal(state.status,'ready');assert.equal(state.record.lesson.workflow_state,'review');assert.equal(state.canApprove,false);
  const reviewerStudio=await studio('reviewer'),reviewerHistory=reviewerStudio.controller;
  state=await reviewerHistory.refresh();assert.equal(state.status,'ready');assert.equal(state.canApprove,true);
  state=await reviewerHistory.act('approve',{checks:REVIEW,comment:COMMENT});assert.equal(state.status,'ready');assert.equal(state.record.lesson.workflow_state,'approved');assert.equal(state.record.reviews[0].actor_id,fixture.reviewer);
  phase='production history controller: publish and withdraw';
  state=await teacherHistory.refresh();assert.equal(state.status,'ready');assert.equal(state.record.lesson.workflow_state,'approved');
  state=await teacherHistory.act('publish',{});assert.equal(state.status,'ready');assert.equal(state.record.lesson.workflow_state,'published');
  const controllerLive=await expect(livePath,'student');assert.equal(controllerLive.publication_id,state.record.lesson.active_publication_id);
  state=await teacherHistory.act('unpublish',{reason:'Explicit strict-controller withdrawal'});assert.equal(state.status,'ready');assert.equal(state.record.lesson.active_publication_id,null);assert.equal(state.record.publications[0].reason,'Explicit strict-controller withdrawal');
  await expect(livePath,'student',undefined,404);assert.deepEqual(teacherStudio.writes,[]);assert.deepEqual(reviewerStudio.writes,[]);record=state.record;
  passed('production Studio client and strict history-session consume actual SQL metadata and confirm paginated restore lost-ack, independent review, publish and withdrawal without persistence or replay');
  report.strict_history_session_integration=true;report.production_studio_client_integration=true;report.rpc_count=calls.length;report.status='PASS';save();
  console.log(`Lesson history HTTP/real-PostgreSQL: PASS; ${report.checks.length} groups`);
} catch(error){
  // Useful CI location/phase diagnostics without printing documents, notes,
  // session tokens, SQL rows, DSNs or untrusted upstream messages.
  const safe=value=>typeof value==='string'&&/^[A-Za-z0-9_.=-]{1,80}$/.test(value)?value:undefined;
  report.status='FAIL';report.error_type=error?.name||'Error';report.last_passed_group=report.checks.at(-1)||null;
  const states=new Set(['ready','uncertain','conflict','error','disposed','draft','review','approved','published']);
  report.diagnostic={phase,code:safe(error?.code),operator:safe(error?.operator),actual_state:states.has(error?.actual)?error.actual:undefined,expected_state:states.has(error?.expected)?error.expected:undefined,actual_number:typeof error?.actual==='number'?error.actual:undefined,expected_number:typeof error?.expected==='number'?error.expected:undefined,source_location:String(error?.stack||'').match(/test_lesson_history_e2e\.mjs:\d+:\d+/)?.[0],controllers:historyControllers.map(controller=>{try{const value=controller.snapshot();return {status:safe(value.status),error_code:safe(value.error?.code)};}catch{return {status:'snapshot_failed'};}})};save();process.exitCode=1;console.error('History integration failed: '+JSON.stringify({type:report.error_type,...report.diagnostic,last_http:report.last_http}));
}
finally{for(const controller of historyControllers)controller.dispose();for(const client of studioClients)client.dispose();if(child){child.stdin.end();let timer;const expired=await Promise.race([closed.then(()=>false),new Promise(resolve=>{timer=setTimeout(()=>resolve(true),10000);})]);clearTimeout(timer);if(expired)child.kill();}}
