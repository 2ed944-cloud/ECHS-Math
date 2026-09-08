import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import katex from './lesson-runtime/node_modules/katex/dist/katex.mjs';
import { createLessonHandler, LESSON_API_CONTRACT, MAX_REQUEST_BYTES } from '../supabase/functions/lesson-api/handler.mjs';
import { createRpcTransport } from '../supabase/functions/lesson-api/transport.mjs';
import { MAX_PERSISTED_DOCUMENT_BYTES } from '../supabase/functions/lesson-api/document-contract.mjs';
import { assertLessonDocument } from '../js/lesson-runtime/schema.mjs';

const clone = value => JSON.parse(JSON.stringify(value));
const id = n => `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const ids = { actor:id(1), org:id(2), class:id(3), lesson:id(4), course:id(5), version:id(6), publication:id(7) };
const token = 'fixture-school-opaque-token-007';
const tokenHash = createHash('sha256').update(token).digest('hex');
const actor = { account_id:ids.actor, organization_id:ids.org, role:'teacher', status:'active', expires_at:'2099-01-01T00:00:00Z' };
const base = JSON.parse(fs.readFileSync(new URL('./lesson-runtime/fixtures/published-original.lesson.json', import.meta.url)));
function fixture() {
  const document = clone(base);
  Object.assign(document, { lesson_id:ids.lesson, course_version_id:ids.course, unit_id:'legacy:ap-calculus:unit:1', topic_id:'legacy:ap-calculus:topic:1.7', document_version:1 });
  document.publication = { status:'draft', audience:'institutional', revision:1 };
  const lesson = { id:ids.lesson, organization_id:ids.org, class_id:ids.class, course_version_id:ids.course,
    access_key:'ap-calculus::0::1.7', route_path:'lessons/ap-calculus/unit-1/1-7-selecting-limit-procedures.html',
    unit_id:document.unit_id, topic_id:document.topic_id, head_revision:1, head_version_id:ids.version,
    workflow_state:'draft', active_publication_id:null };
  return { ok:true, contract:LESSON_API_CONTRACT, lesson, head:{ id:ids.version, version_number:1, document, private_notes:'PRIVATE_NOTES_CANARY_DO_NOT_DELIVER' }, versions:[], reviews:[], publications:[] };
}
function published() {
  const current = fixture(); const document = clone(current.head.document);
  document.publication = { status:'published', audience:'institutional', revision:4 };
  return { ok:true, contract:LESSON_API_CONTRACT, lesson_id:ids.lesson, class_id:ids.class, publication_id:ids.publication, revision:4, document,
    private_notes:'PRIVATE_NOTES_CANARY_DO_NOT_DELIVER', head:current.head, reviews:[{comment:'PRIVATE_REVIEW_CANARY'}],
    binding:{ account_id:ids.actor, organization_id:ids.org, class_id:ids.class, course_key:'ap-calculus', access_key:current.lesson.access_key,
      route_path:current.lesson.route_path, document:{lesson_id:ids.lesson,course_version_id:ids.course,unit_id:document.unit_id,topic_id:document.topic_id,document_version:1,publication_revision:4} } };
}
function harness({ session=actor, stored=fixture(), onStore, onRpc, bodyTimeoutMs } = {}) {
  const calls = [];
  const rpc = async (name,args) => {
    calls.push({name,args:clone(args)});
    const intercepted = await onRpc?.(name,args); if (intercepted) return intercepted;
    if (name === 'lesson_store_health') return { data:{ok:true,contract:LESSON_API_CONTRACT}, error:null };
    assert.equal(args.p_token_hash, tokenHash, 'only the SHA-256 school-token hash crosses the RPC boundary');
    if (name === 'api_session_lookup') return { data:session ? [clone(session)] : [], error:null };
    assert.equal(name,'lesson_store'); assert.deepEqual(Object.keys(args).sort(),['p_action','p_payload','p_token_hash']);
    const result = await onStore?.(args.p_action,args.p_payload);
    if (result) return result;
    if (args.p_action === 'context') return { data:{ok:true,contract:LESSON_API_CONTRACT, catalog:[{ access_key:stored.lesson.access_key, unit_id:stored.lesson.unit_id, topic_id:stored.lesson.topic_id }]},error:null };
    if (args.p_action === 'deliver') return {data:published(),error:null};
    if (args.p_action === 'version') return {data:{ok:true,contract:LESSON_API_CONTRACT,lesson:stored.lesson,version:stored.head},error:null};
    return {data:clone(stored),error:null};
  };
  return { calls, handler:createLessonHandler({rpc,mathEngine:katex,bodyTimeoutMs}) };
}
function request(path, {body,method=body===undefined?'GET':'POST',authorization=`Bearer ${token}`,origin='https://2ed944-cloud.github.io',headers={},raw} = {}) {
  return new Request(`https://fixture.supabase.co/functions/v1/lesson-api${path}`, {method,
    headers:{...(authorization ? {authorization}:{}),...(origin ? {origin}:{}),...(body!==undefined||raw!==undefined?{'content-type':'application/json'}:{}),...headers},
    ...(body!==undefined||raw!==undefined?{body:raw??JSON.stringify(body)}:{})});
}
async function expectStatus(h,path,options,status) {
  const response=await h.handler(request(path,options)); const json=await response.json();
  assert.equal(response.status,status,JSON.stringify(json)); assert.match(response.headers.get('cache-control'),/no-store/);
  assert.equal(response.headers.get('x-content-type-options'),'nosniff'); return json;
}
const draftBody = () => ({ class_id:ids.class,course_version_id:ids.course,access_key:'ap-calculus::0::1.7',document:fixture().head.document,private_notes:'Teacher private note',expected_revision:0 });
const lessonPath = `/lessons/${ids.lesson}`;

function documentBytes(bytes, version = 1) {
  const document = fixture().head.document;
  document.document_version = version; document.publication.revision = version;
  const nodes = [];
  document.slides = Array.from({length:8},(_,slide) => ({id:`byte-slide-${slide}`,title:'Original bounded test text',layout:'single',
    blocks:Array.from({length:40},(_,block) => {
      const node = {type:'text',text:'x'}; nodes.push(node);
      return {id:`byte-block-${slide}-${block}`,type:'rich-text',version:1,content:{paragraphs:[{type:'paragraph',children:[node]}]}};
    })}));
  let remaining = bytes - Buffer.byteLength(JSON.stringify(document),'utf8');
  assert.ok(remaining >= 0);
  for (const node of nodes) {
    const add = Math.min(3999,remaining); node.text += 'x'.repeat(add); remaining -= add;
    if (!remaining) break;
  }
  assert.equal(remaining,0); assert.equal(Buffer.byteLength(JSON.stringify(document),'utf8'),bytes);
  assertLessonDocument(document,{mathEngine:katex});
  return document;
}

test('stalled and aborted request streams time out, cancel the reader and never write',async()=>{
  for(const abort of [false,true]) {
    const h=harness({bodyTimeoutMs:30}); let cancelled=false;
    const signal=new AbortController();
    const body=new ReadableStream({start(c){c.enqueue(new TextEncoder().encode('{'));},cancel(){cancelled=true;}});
    const req=new Request('https://fixture.supabase.co/functions/v1/lesson-api/lessons',{method:'POST',
      headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body,duplex:'half',signal:signal.signal});
    const pending=h.handler(req); if(abort)signal.abort();
    const response=await pending;assert.equal(response.status,408);assert.equal((await response.json()).error.code,'request_timeout');
    assert.equal(cancelled,true);assert.equal(h.calls.some(c=>c.args?.p_action==='create'),false);
  }
});

test('health exposes only contract readiness, and exact-origin preflight never authenticates or stores',async()=>{
  const h=harness(); const health=await expectStatus(h,'/health',{authorization:null},200);
  assert.deepEqual(health,{ok:true,service:'lesson-api',contract:LESSON_API_CONTRACT});
  const options=await h.handler(request('/lessons',{method:'OPTIONS',authorization:null})); assert.equal(options.status,204);
  assert.equal(options.headers.get('access-control-allow-origin'),'https://2ed944-cloud.github.io');
  await expectStatus(h,'/health',{origin:'https://attacker.example'},403); assert.equal(h.calls.length,1);
});
test('missing, malformed and oversized bearer tokens never reach database authentication',async()=>{
  for(const authorization of [null,'Basic abc','Bearer short',`Bearer ${'x'.repeat(2049)}`,'Bearer token with spaces']){
    const h=harness();await expectStatus(h,'/context',{authorization},401);assert.equal(h.calls.length,0);
  }
});
test('revoked, expired and inactive school sessions fail before private record lookup',async()=>{
  for(const session of [null,{...actor,status:'suspended'},{...actor,expires_at:'2001-01-01T00:00:00Z'},{...actor,expires_at:'invalid'}]){
    const h=harness({session});await expectStatus(h,lessonPath,{},401);assert.equal(h.calls.length,1);
  }
});
test('students cannot access authoring routes; parents cannot read delivered documents; teachers cannot pin classes',async()=>{
  for(const path of ['/context','/lessons?class_id='+ids.class,lessonPath,lessonPath+'/history']){
    const h=harness({session:{...actor,role:'student'}});await expectStatus(h,path,{},403);assert.equal(h.calls.length,1);
  }
  const h=harness({session:{...actor,role:'student'}});await expectStatus(h,lessonPath+'/publish',{body:{expected_revision:1}},403);
  await expectStatus(harness({session:{...actor,role:'parent'}}),lessonPath+'/published?class_id='+ids.class,{},403);
  await expectStatus(harness(),`/classes/${ids.class}/course-version`,{body:{course_version_id:ids.course,expected_assignment_id:null,reason:'Reviewed course pin'}},403);
});
test('create resolves catalog identity, validates canonical math, and keeps actor/org/binding out of client-controlled writes',async()=>{
  const h=harness();const body=draftBody();await expectStatus(h,'/lessons',{body},201);
  assert.deepEqual(h.calls.filter(c=>c.name==='lesson_store').map(c=>c.args.p_action),['context','create']);
  assert.deepEqual(h.calls.at(-1).args.p_payload,body);assert.equal(JSON.stringify(h.calls).includes(token),false);
  for(const field of ['organization_id','actor_id','role','binding','validated_version_id']){
    const bad=harness();await expectStatus(bad,'/lessons',{body:{...draftBody(),[field]:ids.org}},422);
    assert.equal(bad.calls.some(c=>c.args?.p_action==='create'),false);
  }
});
test('draft writes reject wrong scope/version, public labels, private document fields and malformed mathematics',async()=>{
  const changes=[d=>d.course_version_id=id(99),d=>d.unit_id='wrong-unit',d=>d.topic_id='wrong-topic',d=>d.document_version=2,
    d=>d.publication.audience='public',d=>d.publication.status='published',d=>d.teacher_notes='PRIVATE',
    d=>{d.slides[0].blocks=[{id:'bad-math',type:'math',version:1,content:{tex:'\\frac{',spoken:'broken math',display:true}}];}];
  for(const mutate of changes){const h=harness();const body=draftBody();mutate(body.document);await expectStatus(h,'/lessons',{body},422);assert.equal(h.calls.some(c=>c.args?.p_action==='create'),false);}
});
test('request validation bounds JSON bytes, notes, duplicate queries, unsupported content types and malformed JSON',async()=>{
  await expectStatus(harness(),'/lessons',{body:draftBody(),headers:{'content-type':'text/plain'}},415);
  await expectStatus(harness(),'/lessons',{method:'POST',raw:'{'},400);
  await expectStatus(harness(),'/lessons',{method:'POST',raw:' '.repeat(MAX_REQUEST_BYTES+1)},413);
  await expectStatus(harness(),'/lessons',{body:{...draftBody(),private_notes:'x'.repeat(20001)}},422);
  await expectStatus(harness(),'/lessons?class_id='+ids.class+'&class_id='+ids.class,{},422);
  await expectStatus(harness(),lessonPath+'/history?limit=101',{},422);
  await expectStatus(harness(),lessonPath+'?organization_id='+ids.org,{},422);
});
test('stale save and publication revisions fail before mutation; invalid changed drafts cannot be saved',async()=>{
  for(const suffix of ['draft','approve','publish']){
    const h=harness();const body=suffix==='draft'?{expected_revision:2,document:fixture().head.document,private_notes:''}:
      suffix==='approve'?{expected_revision:2,checks:{curriculum:true,mathematics:true,accessibility:true,rights:true,student_safe:true},comment:'Independent review'}:{expected_revision:2};
    await expectStatus(h,lessonPath+'/'+suffix,{body},409);assert.equal(h.calls.filter(c=>c.name==='lesson_store').length,1);
  }
  const h=harness();const document=fixture().head.document;document.lesson_id=id(99);
  await expectStatus(h,lessonPath+'/draft',{body:{expected_revision:1,document,private_notes:''}},422);
});
test('approve and publish validate the stored immutable head and supply its ID themselves for transactional CAS',async()=>{
  for(const action of ['approve','publish']){
    const h=harness();const body=action==='approve'?{expected_revision:1,checks:{curriculum:true,mathematics:true,accessibility:true,rights:true,student_safe:true},comment:'Independent review'}:{expected_revision:1};
    await expectStatus(h,lessonPath+'/'+action,{body},200);assert.equal(h.calls.at(-1).args.p_payload.validated_version_id,ids.version);
    assert.equal(h.calls.at(-1).args.p_action,action);
    await expectStatus(harness(),lessonPath+'/'+action,{body:{...body,validated_version_id:id(99)}},422);
  }
  const stored=fixture();stored.head.document.slides[0].blocks=[{id:'legacy',type:'legacy-embedded',version:1,content:{source:stored.lesson.route_path,anchor:'s1',sha256:'a'.repeat(64),summary:'Legacy source reference'}}];
  const h=harness({stored});await expectStatus(h,lessonPath+'/publish',{body:{expected_revision:1}},503);assert.equal(h.calls.some(c=>c.args?.p_action==='publish'),false);
});

test('publishing an exact-limit draft rejects the larger published snapshot before any write RPC',async()=>{
  for (const [bytes,status] of [[MAX_PERSISTED_DOCUMENT_BYTES - 4,200],[MAX_PERSISTED_DOCUMENT_BYTES,413]]) {
    const stored = fixture(); stored.head.document = documentBytes(bytes);
    const projected = clone(stored.head.document); projected.publication.status = 'published'; projected.publication.revision = 2;
    assert.equal(Buffer.byteLength(JSON.stringify(projected),'utf8'),bytes + 4);
    const h = harness({stored}); const response = await expectStatus(h,lessonPath+'/publish',{body:{expected_revision:1}},status);
    const actions = h.calls.filter(call => call.name === 'lesson_store').map(call => call.args.p_action);
    assert.deepEqual(actions,status === 200 ? ['get','publish'] : ['get']);
    if (status === 413) assert.equal(response.error.code,'document_too_large');
  }
});

test('save and restore reserve version 9-to-10 digit growth and reject overflow before mutation RPCs',async()=>{
  for (const action of ['save','restore']) {
    for (const [bytes,status] of [[MAX_PERSISTED_DOCUMENT_BYTES - 2,200],[MAX_PERSISTED_DOCUMENT_BYTES - 1,413]]) {
      const stored = fixture(); stored.lesson.head_revision = 9; stored.head.version_number = 9;
      stored.head.document = documentBytes(bytes,9);
      const projected = clone(stored.head.document); projected.document_version = 10; projected.publication.revision = 10;
      assert.equal(Buffer.byteLength(JSON.stringify(projected),'utf8'),bytes + 2);
      const body = action === 'save' ? {expected_revision:9,document:stored.head.document,private_notes:''} : {expected_revision:9,version_id:ids.version};
      const h = harness({stored}); const response = await expectStatus(h,lessonPath + (action === 'save' ? '/draft' : '/restore'),{body},status);
      const read = action === 'save' ? 'get' : 'version';
      assert.deepEqual(h.calls.filter(call => call.name === 'lesson_store').map(call => call.args.p_action),status === 200 ? [read,action] : [read]);
      if (status === 413) assert.equal(response.error.code,'document_too_large');
    }
  }
});
test('publication RPC repeats authority/CAS checks after Edge validation and database errors never expose SQL details',async()=>{
  for(const [code,status]of [['40001',409],['28000',401],['42501',404],['P0002',404],['23514',409],['XX000',503]]){
    const h=harness({onStore:action=>action==='publish'?{data:null,error:{code,message:'PRIVATE_DATABASE_SECRET',details:'teacher_notes'}}:null});
    const result=await expectStatus(h,lessonPath+'/publish',{body:{expected_revision:1}},status);
    assert.equal(JSON.stringify(result).includes('PRIVATE_DATABASE_SECRET'),false);assert.equal(JSON.stringify(result).includes('teacher_notes'),false);
  }
});
test('restore validates the selected immutable version and preserves optimistic revision rather than overwriting history',async()=>{
  const h=harness();await expectStatus(h,lessonPath+'/restore',{body:{expected_revision:1,version_id:ids.version}},200);
  assert.deepEqual(h.calls.filter(c=>c.name==='lesson_store').map(c=>c.args.p_action),['version','restore']);
  assert.deepEqual(h.calls.at(-1).args.p_payload,{lesson_id:ids.lesson,expected_revision:1,version_id:ids.version});
  await expectStatus(harness(),lessonPath+'/versions/'+ids.version,{},200);
  const history=harness({onStore:action=>action==='history'?{data:{ok:true,contract:LESSON_API_CONTRACT,versions:[],next_before_version:null},error:null}:null});
  await expectStatus(history,lessonPath+'/history?before_version=12&limit=10',{},200);
  assert.deepEqual(history.calls.at(-1).args.p_payload,{lesson_id:ids.lesson,before_version:12,limit:10});
});
test('student delivery projects only published document and authorized binding, never notes, reviews, histories or arbitrary extras',async()=>{
  const h=harness({session:{...actor,role:'student'}});const body=await expectStatus(h,lessonPath+'/published?class_id='+ids.class,{},200);
  assert.deepEqual(Object.keys(body).sort(),['binding','class_id','contract','document','lesson_id','ok','publication_id','revision']);
  assert.equal(body.document.publication.audience,'institutional');assert.equal(body.binding.route,'https://2ed944-cloud.github.io/ECHS-Math/'+fixture().lesson.route_path);
  assert.equal(JSON.stringify(body).includes('PRIVATE'),false);assert.equal('route_path' in body.binding,false);
});
test('wrong actor/class/route/version, malformed stored math and unpublished snapshots cannot pass the student delivery boundary',async()=>{
  const changes=[p=>p.binding.account_id=id(99),p=>p.binding.organization_id=id(99),p=>p.binding.class_id=id(99),p=>p.lesson_id=id(99),
    p=>p.binding.route_path='lessons/../private.html',p=>p.binding.route_path='https://attacker.example/steal',p=>p.binding.route_path+='?token=leak',
    p=>p.binding.document.document_version=88,p=>p.binding.document.publication_revision=9,p=>p.document.publication.status='draft',p=>p.document.answer_key='secret'];
  for(const mutate of changes){const payload=published();mutate(payload);const h=harness({session:{...actor,role:'student'},onStore:action=>action==='deliver'?{data:payload,error:null}:null});await expectStatus(h,lessonPath+'/published?class_id='+ids.class,{},503);}
});
test('admin pin changes require an explicit expected assignment and never accept actor or organization overrides',async()=>{
  const h=harness({session:{...actor,role:'admin'},onStore:action=>action==='pin_course'?{data:{ok:true,contract:LESSON_API_CONTRACT,assignment:{id:id(50)}},error:null}:null});
  const body={course_version_id:ids.course,expected_assignment_id:null,reason:'Reviewed AB course version for this class'};
  await expectStatus(h,`/classes/${ids.class}/course-version`,{body},200);assert.deepEqual(h.calls.at(-1).args.p_payload,{class_id:ids.class,...body});
  const bad={...body};delete bad.expected_assignment_id;await expectStatus(h,`/classes/${ids.class}/course-version`,{body:bad},422);
});
test('RPC transport fixes service host and method, refuses redirects and suppresses response details',async()=>{
  const seen=[];const rpc=createRpcTransport({url:'https://fixture.supabase.co',serviceKey:'fixture-service-credential-only',fetch:async(url,options)=>{
    seen.push({url:String(url),options});return new Response(JSON.stringify({code:'42501',message:'PRIVATE_SERVER_MESSAGE',details:'CANARY'}),{status:403,headers:{'content-type':'application/json'}});
  }});
  const result=await rpc('lesson_store',{p_token_hash:tokenHash,p_action:'get',p_payload:{lesson_id:ids.lesson}});
  assert.deepEqual(result,{data:null,error:{code:'42501'}});assert.equal(seen[0].url,'https://fixture.supabase.co/rest/v1/rpc/lesson_store');
  assert.equal(seen[0].options.redirect,'error');assert.equal(seen[0].options.credentials,'omit');assert.equal(seen[0].options.cache,'no-store');
  await assert.rejects(rpc('arbitrary_rpc',{}));assert.equal(seen.length,1);
  assert.throws(()=>createRpcTransport({url:'https://attacker.example',serviceKey:'fixture-service-credential-only'}));
});
test('RPC transport bounds database response size and cancels stalled requests without retrying writes',async()=>{
  let cancelled=false;const rpc=createRpcTransport({url:'https://fixture.supabase.co',serviceKey:'fixture-service-credential-only',fetch:async()=>new Response(new ReadableStream({start(controller){controller.enqueue(new Uint8Array(5*1024*1024+1));},cancel(){cancelled=true;}}),{headers:{'content-type':'application/json'}})});
  await assert.rejects(rpc('lesson_store',{}));assert.equal(cancelled,true);
  let requests=0;const stalled=createRpcTransport({url:'https://fixture.supabase.co',serviceKey:'fixture-service-credential-only',timeoutMs:10,fetch:async(_url,{signal})=>{requests++;return new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>reject(new Error('aborted'))));}});
  await assert.rejects(stalled('lesson_store',{}));assert.equal(requests,1);
});
