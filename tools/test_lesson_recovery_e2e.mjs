#!/usr/bin/env node
// Actual Edge handler + production fixed RPC transport + isolated PostgreSQL.
// Recovery material exists only in memory; reports/logs never include keys.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import {fileURLToPath} from 'node:url';
import katex from './lesson-runtime/node_modules/katex/dist/katex.mjs';
import {createLessonHandler} from '../supabase/functions/lesson-api/handler.mjs';
import {createRpcTransport} from '../supabase/functions/lesson-api/transport.mjs';
import {LESSON_RECOVERY_CAPABILITIES as CAP} from '../supabase/functions/lesson-api/recovery-contract.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),reportPath=path.join(root,'reports/lesson-recovery-e2e.json');
const report={status:'RUNNING; NOT PASS',production_calls:false,external_network:false,transport:'Actual HTTP handler and createRpcTransport through fixed PostgREST adapter into actual PostgreSQL service-role RPCs',checks:[]};
const save=()=>{fs.mkdirSync(path.dirname(reportPath),{recursive:true});fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');};
const passed=label=>{report.checks.push(label);console.log('PASS '+label);save();};
let child,closed;
try {
  assert.ok(process.env.ECHS_LESSON_TEST_DSN,'Explicit isolated loopback database required');
  globalThis.fetch=async()=>{throw new Error('External requests forbidden in recovery integration');};
  child=spawn(process.env.ECHS_PYTHON||'python',[fileURLToPath(new URL('./lesson_persistence_rpc_fixture.py',import.meta.url)),'--recovery'],{cwd:root,env:process.env,stdio:['pipe','pipe','pipe'],windowsHide:true});
  closed=new Promise(resolve=>child.once('close',resolve));let readyResolve,readyReject;const ready=new Promise((resolve,reject)=>{readyResolve=resolve;readyReject=reject;});
  const startup=setTimeout(()=>readyReject(new Error('Isolated fixture startup timeout')),30000),pending=new Map();let sequence=0;
  child.stderr.on('data',()=>{});child.on('error',()=>readyReject(new Error('Isolated fixture process failed')));
  const lines=readline.createInterface({input:child.stdout});
  lines.on('line',line=>{let data;try{data=JSON.parse(line);}catch{readyReject(new Error('Invalid fixture protocol'));return;}
    if(data.event==='ready'){clearTimeout(startup);readyResolve(data);return;}
    if(data.event==='startup_error'){clearTimeout(startup);readyReject(new Error('Isolated fixture refused startup'));return;}
    const waiting=pending.get(data.id);if(waiting){pending.delete(data.id);clearTimeout(waiting.timer);waiting.resolve(data.result);}});
  closed.then(()=>{clearTimeout(startup);readyReject(new Error('Isolated fixture closed'));for(const waiting of pending.values()){clearTimeout(waiting.timer);waiting.reject(new Error('Isolated fixture closed'));}pending.clear();});
  const initialized=await ready,fixture=initialized.fixture;report.postgres_version=initialized.postgres_version;
  const allowed=['api_session_lookup','lesson_store','lesson_store_health','lesson_content_capabilities','lesson_media_capabilities','lesson_recovery_capabilities','lesson_draft_recovery_key'];const calls=[];
  const database=(name,args)=>new Promise((resolve,reject)=>{assert.ok(allowed.includes(name));const id=++sequence,timer=setTimeout(()=>{pending.delete(id);reject(new Error('Isolated RPC timeout'));},15000);pending.set(id,{resolve,reject,timer});child.stdin.write(JSON.stringify({id,name,args})+'\n',error=>{if(error){clearTimeout(timer);pending.delete(id);reject(new Error('Isolated RPC input failed'));}});});
  const rpc=createRpcTransport({url:'https://recoveryfixture.supabase.co',serviceKey:'isolated-recovery-fixture-service-key',fetch:async(url,options)=>{
    const target=new URL(url);assert.equal(target.origin,'https://recoveryfixture.supabase.co');assert.equal(target.search,'');assert.equal(target.hash,'');
    const name=target.pathname.replace('/rest/v1/rpc/','');assert.equal(target.pathname,'/rest/v1/rpc/'+name);assert.ok(allowed.includes(name));
    assert.equal(options.method,'POST');assert.equal(options.cache,'no-store');assert.equal(options.credentials,'omit');assert.equal(options.redirect,'error');assert.ok(options.signal instanceof AbortSignal);
    assert.equal(options.headers.apikey,'isolated-recovery-fixture-service-key');assert.equal(options.headers.authorization,'Bearer isolated-recovery-fixture-service-key');
    const args=JSON.parse(options.body);calls.push({name,action:args.p_action});const result=await database(name,args);
    return new Response(JSON.stringify(result.error?{code:result.error.code}:result.data),{status:result.error?400:200,headers:{'content-type':'application/json'}});
  }});
  const noStorage=()=>{throw new Error('Recovery must not use object Storage');};
  const handler=createLessonHandler({rpc,mathEngine:katex,assetStorage:{put:noStorage,get:noStorage,removeTemporary:noStorage}});
  const request=(endpoint,actor='teacher',body)=>new Request('https://fixture.invalid/functions/v1/lesson-api'+endpoint,{method:body===undefined?'GET':'POST',headers:{origin:'https://2ed944-cloud.github.io',...(actor===null?{}:{authorization:'Bearer '+(fixture.tokens[actor]||actor)}),...(body===undefined?{}:{'content-type':'application/json'})},...(body===undefined?{}:{body:JSON.stringify(body)})});
  const expect=async(endpoint,actor,body,status=200)=>{const response=await handler(request(endpoint,actor,body));assert.equal(response.status,status,'Unexpected HTTP recovery result');assert.match(response.headers.get('cache-control'),/no-store/);assert.match(response.headers.get('cache-control'),/private/);assert.equal(response.headers.get('x-content-type-options'),'nosniff');return response.json();};
  assert.deepEqual(await expect('/health/recovery',null),{ok:true,service:'lesson-api',contract:'echs.lesson.store.v1',recovery_capabilities:CAP});assert.deepEqual(calls,[{name:'lesson_recovery_capabilities',action:undefined}]);
  const context=await expect('/context','teacher');assert.deepEqual(context.recovery_capabilities,CAP);assert.equal(context.authoring_capabilities.contract,'echs.lesson.authoring.v1');assert.equal(context.media_capabilities.contract,'echs.lesson.media.v1');
  await expect('/context','student',undefined,403);await expect('/context',null,undefined,401);
  passed('data-free health and authenticated context reach actual recovery SQL through production transport while preserving authoring/media contracts');
  await expect(`/classes/${fixture.class}/course-version`,'admin',{course_version_id:fixture.course_version_id,expected_assignment_id:null,reason:'Explicit original recovery fixture'});
  const doc=JSON.parse(fs.readFileSync(new URL('./lesson-runtime/fixtures/published-original.lesson.json',import.meta.url),'utf8'));Object.assign(doc,{lesson_id:randomUUID(),course_version_id:fixture.course_version_id,unit_id:'legacy:ap-calculus:unit:1',topic_id:'legacy:ap-calculus:topic:1.7',document_version:1});doc.publication={status:'draft',audience:'institutional',revision:1};
  let record=await expect('/lessons','teacher',{class_id:fixture.class,course_version_id:fixture.course_version_id,access_key:fixture.access_key,document:doc,private_notes:'PRIVATE_RECOVERY_ORIGINAL_NOTES',expected_revision:0},201);
  const lessonPath='/lessons/'+record.lesson.id,keyPath=lessonPath+'/recovery-key';
  const first=await expect(keyPath,'teacher',{}),same=await expect(keyPath,'teacher',{});
  assert.ok(JSON.stringify(first)===JSON.stringify(same),'Same authorized scope must return stable material');assert.deepEqual(Object.keys(first).sort(),['ok','contract','account_id','organization_id','class_id','lesson_id','key_id','key_base64'].sort());
  assert.equal(first.account_id,fixture.teacher);assert.equal(first.organization_id,fixture.organization);assert.equal(first.class_id,fixture.class);assert.equal(first.lesson_id,record.lesson.id);assert.equal(first.contract,CAP.contract);
  assert.ok(/^[A-Za-z0-9+/]{42}[AEIMQUYcgkosw048]=$/.test(first.key_base64),'Canonical32 receipt required');assert.equal(Buffer.from(first.key_base64,'base64').length,32);
  assert.deepEqual(await expect(lessonPath,'teacher'),record);assert.ok(!JSON.stringify(first).includes('PRIVATE_RECOVERY_ORIGINAL_NOTES'));
  passed('real reserve-on-first-release and idempotent recovery return exact canonical32 owner material without changing the stored lesson');
  const reviewer=await expect(keyPath,'reviewer',{}),admin=await expect(keyPath,'admin',{});
  assert.ok(first.key_id!==reviewer.key_id&&first.key_id!==admin.key_id&&reviewer.key_id!==admin.key_id,'Different accounts require distinct key identities');
  assert.ok(first.key_base64!==reviewer.key_base64&&first.key_base64!==admin.key_base64,'Different accounts require distinct key material');
  const cryptoKey=await crypto.subtle.importKey('raw',Buffer.from(first.key_base64,'base64'),'AES-GCM',false,['encrypt','decrypt']);
  const foreignKey=await crypto.subtle.importKey('raw',Buffer.from(reviewer.key_base64,'base64'),'AES-GCM',false,['decrypt']);
  const iv=crypto.getRandomValues(new Uint8Array(12)),aad=new TextEncoder().encode([first.account_id,first.organization_id,first.class_id,first.lesson_id,first.key_id].join(':'));
  const plaintext=new TextEncoder().encode('Original isolated recovery checkpoint');const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad},cryptoKey,plaintext);
  assert.ok(Buffer.from(await crypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:aad},cryptoKey,ciphertext)).equals(Buffer.from(plaintext)),'Own actual SQL key must decrypt the in-memory checkpoint');
  await assert.rejects(crypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:aad},foreignKey,ciphertext));
  await assert.rejects(crypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode('other-scope')},cryptoKey,ciphertext));
  passed('actual separately authorized SQL keys cannot decrypt another account checkpoint; AES-GCM also rejects altered scope binding');
  for(const [actor,status] of [['student',403],['parent',403],['foreign_teacher',404],['unassigned_teacher',404],[null,401]])await expect(keyPath,actor,{},status);
  for(const body of [{account_id:fixture.teacher},{organization_id:fixture.organization},{class_id:fixture.class},{lesson_id:record.lesson.id},{key_id:first.key_id}])await expect(keyPath,'teacher',body,422);
  await expect(keyPath+'?account_id='+fixture.teacher,'teacher',{},422);await expect('/lessons/'+randomUUID()+'/recovery-key','teacher',{},404);await expect(keyPath,'teacher',undefined,404);
  passed('actual database session/class/tenant authorization denies students, parents, foreign or unassigned staff and identity substitutions');
  const mutate=(action,actor='teacher',extra={})=>expect(lessonPath+'/'+action,actor,{expected_revision:record.lesson.head_revision,...extra});
  record=await mutate('request-review');record=await mutate('approve','reviewer',{checks:{curriculum:true,mathematics:true,accessibility:true,rights:true,student_safe:true},comment:'Original isolated review'});record=await mutate('publish');
  const live=await expect(lessonPath+'/published?class_id='+fixture.class,'student');for(const field of ['key_id','key_base64','PRIVATE_RECOVERY_ORIGINAL_NOTES'])assert.ok(!JSON.stringify(live).includes(field));
  record=await mutate('unpublish','teacher',{reason:'Explicit isolated recovery withdrawal'});await expect(lessonPath+'/published?class_id='+fixture.class,'student',undefined,404);
  const recovered=await expect(keyPath,'teacher',{});assert.ok(recovered.key_id===first.key_id&&recovered.key_base64===first.key_base64,'Recovery must survive unrelated publication state');assert.deepEqual(await expect(lessonPath,'teacher'),record);
  passed('recovery neither publishes nor changes revisions; student snapshots contain no key data and staff recovery survives explicit unpublication');
  report.rpc_count=calls.length;report.status='PASS';save();console.log(`Lesson recovery HTTP/real-PostgreSQL: PASS; ${report.checks.length} groups`);
}catch(error){report.status='FAIL';report.error_type=error?.name||'Error';save();process.exitCode=1;console.error('Recovery integration failed: '+report.error_type);}
finally{if(child){child.stdin.end();let timer;const expired=await Promise.race([closed.then(()=>false),new Promise(resolve=>{timer=setTimeout(()=>resolve(true),10000);})]);clearTimeout(timer);if(expired)child.kill();}}
