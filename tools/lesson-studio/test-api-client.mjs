import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import katex from '../lesson-runtime/node_modules/katex/dist/katex.mjs';
import { createStudioClient,STUDIO_API_CONTRACT,supportsStudioContentV2,supportsDraftRecovery } from '../../js/lesson-studio/api-client.mjs';

test('v2 authoring requires the exact complete capability contract; absent, partial and future contracts fail closed',()=>{
  const capability={contract:'echs.lesson.authoring.v1',content_version:2,blocks:{'rich-text':[1,2],math:[1,2],callout:[1,2],'legacy-embedded':[1]},math_expression_version:1};
  assert.equal(supportsStudioContentV2(capability),true);
  for(const value of [null,undefined,false,{},[],{...capability,content_version:3},{...capability,contract:'other'},
    {...capability,math_expression_version:2},{...capability,blocks:{...capability.blocks,math:[1]}},
    {...capability,blocks:{...capability.blocks,math:[1,2,3]}},{...capability,blocks:{math:[1,2]}},
    {...capability,blocks:{...capability.blocks,question:[1]}},{...capability,extra:true}])assert.equal(supportsStudioContentV2(value),false);
});

const id=n=>`10000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const ids={actor:id(1),org:id(2),class:id(3),course:id(4),lesson:id(5),version:id(6),publication:id(7),pin:id(8)};
const NOTE='PRIVATE-STUDIO-NOTE-CANARY';
const copy=value=>structuredClone(value);
const base=JSON.parse(fs.readFileSync(new URL('../lesson-runtime/fixtures/published-original.lesson.json',import.meta.url),'utf8'));
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));

function record(){
  const document=copy(base);
  Object.assign(document,{lesson_id:ids.lesson,course_version_id:ids.course,unit_id:'legacy:ap-calculus:unit:1',topic_id:'legacy:ap-calculus:topic:1.7',document_version:1});
  document.publication={status:'draft',audience:'institutional',revision:1};
  const lesson={id:ids.lesson,organization_id:ids.org,class_id:ids.class,course_version_id:ids.course,
    access_key:'ap-calculus::0::1.7',route_path:'lessons/ap-calculus/unit-1/1-7-selecting-limit-procedures.html',unit_id:document.unit_id,topic_id:document.topic_id,slug:document.slug,
    head_revision:1,head_version_id:ids.version,workflow_state:'draft',active_publication_id:null};
  const head={id:ids.version,organization_id:ids.org,lesson_id:ids.lesson,version_number:1,document,private_notes:NOTE};
  return {ok:true,contract:STUDIO_API_CONTRACT,lesson,head,versions:[Object.fromEntries(Object.entries(head).filter(([key])=>!['document','private_notes'].includes(key)))],reviews:[],publications:[]};
}
function reply(url,data,status=200,headers={}){
  const response=new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'no-store, private','x-content-type-options':'nosniff',...headers}});
  Object.defineProperty(response,'url',{value:url,configurable:true});return response;
}
function harness(t,{role='teacher',timeoutMs=500,assetTimeoutMs=500,meHook,configHook,fetchHook}={}){
  const local=new Map(),session=new Map(),writes=[];
  const storage=map=>({getItem:key=>map.get(key)??null,setItem:(key,value)=>{writes.push(key);map.set(key,String(value));},removeItem:key=>{writes.push(key);map.delete(key);}});
  const win=new EventTarget();win.document=new EventTarget();win.location={href:'https://2ed944-cloud.github.io/ECHS-Math/question-bank/lesson-studio.html'};
  win.localStorage=storage(local);win.sessionStorage=storage(session);
  let account={id:ids.actor,organization_id:ids.org,role,status:'active',display_name:'Fixture teacher'};
  let token='studio-fixture-opaque-token-one';
  const put=(newToken=token,newAccount=account)=>{token=newToken;account=copy(newAccount);local.set('echs_institution_token_v1',token);local.set('echs_institution_expires_v1',new Date(Date.now()+3600000).toISOString());};put();
  const config={enabled:true,api_base:'https://fixture123.supabase.co/functions/v1',site_base:'https://2ed944-cloud.github.io/ECHS-Math/'};
  let clearCount=0,meCount=0;
  const institution={token:()=>token,account:()=>copy(account),config:async()=>configHook?configHook(config):config,
    me:async force=>{assert.equal(force,true);meCount++;return meHook?meHook(account):copy(account);},
    clearSession:()=>{clearCount++;token='';local.delete('echs_institution_token_v1');local.delete('echs_institution_expires_v1');}};
  let stored=record();const invalidations=[],calls=[];
  const course={id:ids.course,version_key:'ap-calculus-ab-current',course_code:'ap-calculus-ab',status:'active',is_placeholder:false};
  const pin={id:ids.pin,organization_id:ids.org,class_id:ids.class,course_version_id:ids.course,assigned_by:ids.actor,state:'active'};
  const envelope=fields=>({ok:true,contract:STUDIO_API_CONTRACT,...fields});
  async function fetchImpl(url,init){
    calls.push({url,init});if(fetchHook)return fetchHook(url,init,{stored,reply});
    const parsed=new URL(url),suffix=parsed.pathname.replace('/functions/v1/lesson-api','');const body=init.body?JSON.parse(init.body):null;
    const actor={id:account.id,organization_id:account.organization_id,role:account.role};
    if(suffix==='/context'){
      if(parsed.searchParams.has('class_id'))return reply(url,envelope({actor,class:{id:ids.class,organization_id:ids.org,status:'active',name:'Fixture class'},current_assignment:pin,course_versions:[course],catalog:[{access_key:stored.lesson.access_key,course_key:'ap-calculus',unit_index:0,topic:'1.7',title:'Selecting limits',unit_id:stored.lesson.unit_id,topic_id:stored.lesson.topic_id,route_path:stored.lesson.route_path,is_ready:true}]}));
      return reply(url,envelope({actor,classes:[{id:ids.class,name:'Fixture class',course_key:'ap-calculus',current_assignment:pin,course_versions:[course]}]}));
    }
    if(suffix==='/lessons'&&init.method==='GET')return reply(url,envelope({lessons:[stored.lesson]}));
    if(suffix.includes('/course-version')){assert.deepEqual(Object.keys(body).sort(),['course_version_id','expected_assignment_id','reason']);return reply(url,envelope({assignment:{...pin,course_version_id:body.course_version_id}}));}
    if(suffix==='/lessons'){
      stored=record();stored.head.private_notes=body.private_notes;return reply(url,stored,201);
    }
    if(suffix.endsWith('/history'))return reply(url,envelope({versions:stored.versions,next_before_version:null}));
    if(suffix.includes('/versions/'))return reply(url,envelope({lesson:stored.lesson,version:stored.head}));
    if(suffix.endsWith('/recovery-key'))return reply(url,{ok:true,contract:'echs.lesson.recovery.v1',account_id:ids.actor,organization_id:ids.org,class_id:ids.class,lesson_id:ids.lesson,key_id:id(90),key_base64:Buffer.alloc(32,7).toString('base64')});
    if(init.method==='GET')return reply(url,stored);
    assert.ok(!Object.hasOwn(body,'lesson_id'),'path lesson ID is not duplicated in strict HTTP body');
    assert.ok(!Object.hasOwn(body,'validated_version_id'),'only server supplies validated version ID');
    const state=suffix.split('/').at(-1);stored=copy(stored);stored.lesson.head_revision++;
    if(state==='draft'||state==='restore'){
      stored.head.id=id(100+stored.lesson.head_revision);stored.lesson.head_version_id=stored.head.id;stored.head.version_number=stored.lesson.head_revision;
      stored.head.document=copy(body.document||stored.head.document);stored.head.document.document_version=stored.head.version_number;stored.head.document.publication.revision=stored.head.version_number;
      stored.head.private_notes=body.private_notes??stored.head.private_notes;stored.lesson.workflow_state='draft';
      stored.versions=[Object.fromEntries(Object.entries(stored.head).filter(([key])=>!['document','private_notes'].includes(key)))];
    } else stored.lesson.workflow_state=({'request-review':'review',approve:'approved',publish:'published',unpublish:'draft'})[state];
    if(state==='publish')stored.lesson.active_publication_id=ids.publication;
    if(state==='unpublish')stored.lesson.active_publication_id=null;
    return reply(url,stored);
  }
  const client=createStudioClient({window:win,institution,fetch:fetchImpl,mathEngine:katex,timeoutMs,assetTimeoutMs,onInvalidSession:error=>invalidations.push(error)});
  t.after(()=>client.dispose());
  return {client,win,institution,config,calls,invalidations,writes,local,put,get stored(){return stored;},get clearCount(){return clearCount;},get meCount(){return meCount;}};
}

test('recovery capability is independent, exact and fails closed for incomplete or future contracts',()=>{
  const value={contract:'echs.lesson.recovery.v1',cipher:'AES-256-GCM',checkpoint_version:1,max_plaintext_bytes:4194304};
  assert.equal(supportsDraftRecovery(value),true);
  for(const key of Object.keys(value)){const bad={...value};delete bad[key];assert.equal(supportsDraftRecovery(bad),false);}
  for(const bad of [null,[],{},false,{...value,cipher:'AES-CBC'},{...value,checkpoint_version:2},{...value,max_plaintext_bytes:9999999},{...value,extra:true}])assert.equal(supportsDraftRecovery(bad),false);
});
test('recovery key requires a known lesson and uses authenticated uncached exact empty POST without persisting its key',async t=>{
  const h=harness(t);await h.client.initialize();assert.throws(()=>h.client.recoveryKey(ids.lesson),{code:'invalid_request'});
  await h.client.get(ids.lesson);const value=await h.client.recoveryKey(ids.lesson),call=h.calls.at(-1);
  assert.equal(value.key_base64,Buffer.alloc(32,7).toString('base64'));assert.equal(call.init.body,'{}');assert.equal(call.init.method,'POST');
  assert.equal(call.init.cache,'no-store');assert.equal(call.init.credentials,'omit');assert.match(call.init.headers.authorization,/^Bearer /);
  assert.deepEqual(h.writes,[]);assert.equal(JSON.stringify([...h.local.values()]).includes(value.key_base64),false);
});
test('recovery key rejects wrong account organization class lesson key encoding and extra private response fields',async t=>{
  const valid={ok:true,contract:'echs.lesson.recovery.v1',account_id:ids.actor,organization_id:ids.org,class_id:ids.class,lesson_id:ids.lesson,key_id:id(90),key_base64:Buffer.alloc(32,7).toString('base64')};
  const invalid=[{account_id:id(99)},{organization_id:id(99)},{class_id:id(99)},{lesson_id:id(99)},{key_id:'invalid'},{key_base64:'A'.repeat(44)},{key_base64:'A'.repeat(42)+'B='},{key_base64:Buffer.alloc(31).toString('base64')},{contract:STUDIO_API_CONTRACT},{private_notes:NOTE}];
  for(const change of invalid){const h=harness(t,{fetchHook:(url,init,{stored,reply})=>reply(url,url.endsWith('/recovery-key')?{...valid,...change}:stored)});await h.client.initialize();await h.client.get(ids.lesson);await assert.rejects(h.client.recoveryKey(ids.lesson),{code:'invalid_response'});assert.deepEqual(h.writes,[]);}
});
test('a late recovery key cannot cross an account change or configuration change',async t=>{
  const wait=deferred();let entered;const started=new Promise(resolve=>{entered=resolve;});
  const h=harness(t,{fetchHook:async(url,init,{stored,reply})=>{if(url.endsWith('/recovery-key')){entered();return wait.promise;}return reply(url,stored);}});
  await h.client.initialize();await h.client.get(ids.lesson);const job=h.client.recoveryKey(ids.lesson);await started;
  h.put('synthetic-new-owner-token', {...h.client.actor(),id:id(99)});
  wait.resolve(reply(h.calls.at(-1).url,{ok:true,contract:'echs.lesson.recovery.v1',account_id:ids.actor,organization_id:ids.org,class_id:ids.class,lesson_id:ids.lesson,key_id:id(90),key_base64:Buffer.alloc(32,7).toString('base64')}));
  await assert.rejects(job,{code:'session_changed'});assert.deepEqual(h.writes,[]);
});

test('verified staff initialization is forced, defensive, and refuses use before verification',async t=>{
  const h=harness(t);assert.throws(()=>h.client.actor(),{code:'not_initialized'});
  assert.equal(await h.client.initialize(),h.client);assert.equal(h.meCount,1);
  const actor=h.client.actor();actor.organization_id=id(99);assert.equal(h.client.actor().organization_id,ids.org);
  await h.client.initialize();assert.equal(h.meCount,1);assert.deepEqual(h.writes,[]);
});
test('only current configured HTTPS Supabase and site roots are accepted before authentication',async t=>{
  for(const changes of [{api_base:'https://evil.invalid/functions/v1'},{api_base:'http://fixture123.supabase.co/functions/v1'},
    {api_base:'https://fixture123.supabase.co/functions/v1?next=evil'},{api_base:'https://fixture123.supabase.co/functions/v1/'},
    {api_base:'https://fixture123.supabase.co/functions/v1/lesson-api'},{site_base:'https://evil.invalid/ECHS-Math/'},{site_base:'https://2ed944-cloud.github.io/other/'},{enabled:false}]){
    const h=harness(t);Object.assign(h.config,changes);await assert.rejects(h.client.initialize(),{code:'invalid_configuration'});assert.equal(h.calls.length,0);assert.equal(h.meCount,0);
  }
});
test('student, suspended and expired cached identities fail closed; mismatched verified account is rejected',async t=>{
  const student=harness(t,{role:'student'});await assert.rejects(student.client.initialize(),{code:'sign_in_required'});
  const expired=harness(t);expired.local.set('echs_institution_expires_v1','2000-01-01');await assert.rejects(expired.client.initialize(),{code:'session_expired'});
  const mismatch=harness(t,{meHook:account=>({...account,organization_id:id(99)})});await assert.rejects(mismatch.client.initialize(),{code:'sign_in_required'});assert.equal(mismatch.clearCount,1);
});
test('initial configuration/session race never calls me for the successor account',async t=>{
  const pause=deferred();const h=harness(t,{configHook:()=>pause.promise});const init=h.client.initialize();
  h.put('studio-fixture-successor-token',{id:id(22),organization_id:id(23),role:'teacher',status:'active'});pause.resolve(h.config);
  await assert.rejects(init,{code:'session_changed'});assert.equal(h.meCount,0);assert.equal(h.clearCount,0);assert.equal(h.invalidations.length,1);
});
test('configuration changes during verified me or subsequent requests are rejected without destination fetch',async t=>{
  const pause=deferred();const h=harness(t,{meHook:()=>pause.promise});const init=h.client.initialize();await tick();h.config.api_base='https://changed123.supabase.co/functions/v1';pause.resolve(h.institution.account());
  await assert.rejects(init,{code:'configuration_changed'});assert.equal(h.calls.length,0);
  const later=harness(t);await later.client.initialize();later.config.api_base='https://changed123.supabase.co/functions/v1';await assert.rejects(later.client.get(ids.lesson),{code:'configuration_changed'});assert.equal(later.calls.length,0);
});
test('context, class catalog, listing, head and history validate scopes without persisting private records',async t=>{
  const h=harness(t);await h.client.initialize();await h.client.context();await h.client.context(ids.class);await h.client.list(ids.class);
  const read=await h.client.get(ids.lesson);read.head.private_notes='changed';assert.equal((await h.client.get(ids.lesson)).head.private_notes,NOTE);
  assert.equal((await h.client.history(ids.lesson,{limit:1})).versions[0].id,ids.version);
  assert.equal((await h.client.version(ids.lesson,ids.version)).version.private_notes,NOTE);
  for(const call of h.calls){assert.match(call.url,/^https:\/\/fixture123\.supabase\.co\/functions\/v1\/lesson-api\//);assert.equal(call.init.cache,'no-store');assert.equal(call.init.credentials,'omit');assert.equal(call.init.redirect,'error');assert.equal(call.init.referrerPolicy,'no-referrer');assert.equal(call.init.headers.authorization,'Bearer studio-fixture-opaque-token-one');assert.ok(call.init.signal instanceof AbortSignal);}
  assert.deepEqual(h.writes,[]);assert.equal(JSON.stringify([...h.local]).includes(NOTE),false);
});
test('all mutation routes send the strict HTTP body and validate returned revision/identity',async t=>{
  const h=harness(t,{role:'admin'});await h.client.initialize();await h.client.pin(ids.class,{course_version_id:ids.course,expected_assignment_id:null,reason:'Explicit class pin'});
  let result=await h.client.create({class_id:ids.class,course_version_id:ids.course,access_key:'ap-calculus::0::1.7',expected_revision:0,document:record().head.document,private_notes:NOTE});
  result=await h.client.save(ids.lesson,{expected_revision:result.lesson.head_revision,document:result.head.document,private_notes:NOTE+'-saved'});
  result=await h.client.requestReview(ids.lesson,result.lesson.head_revision);
  result=await h.client.approve(ids.lesson,{expected_revision:result.lesson.head_revision,checks:{curriculum:true,mathematics:true,accessibility:true,rights:true,student_safe:true},comment:'Independent review'});
  result=await h.client.publish(ids.lesson,result.lesson.head_revision);
  result=await h.client.restore(ids.lesson,{expected_revision:result.lesson.head_revision,version_id:result.head.id});
  result=await h.client.unpublish(ids.lesson,{expected_revision:result.lesson.head_revision,reason:'Withdraw'});
  assert.equal(result.lesson.head_revision,7);assert.equal(result.lesson.active_publication_id,null);assert.deepEqual(h.writes,[]);
});
test('client rejects arbitrary authority fields, invalid math, notes bounds and teacher pin before any fetch',async t=>{
  const h=harness(t);await h.client.initialize();
  const body={expected_revision:1,document:record().head.document,private_notes:''};
  for(const extra of [{organization_id:ids.org},{validated_version_id:ids.version},{private_notes:'x'.repeat(20001)}])assert.throws(()=>h.client.save(ids.lesson,{...body,...extra}),{code:'invalid_request'});
  const bad=copy(body);bad.document.slides[0].blocks=[{id:'bad-math',type:'math',version:1,content:{tex:'\\frac{',spoken:'bad math',display:true}}];assert.throws(()=>h.client.save(ids.lesson,bad),{code:'invalid_request'});
  assert.throws(()=>h.client.pin(ids.class,{course_version_id:ids.course,expected_assignment_id:null,reason:'Forbidden'}),{code:'invalid_request'});
  assert.throws(()=>h.client.get('https://evil.invalid'),{code:'invalid_request'});assert.throws(()=>h.client.history(ids.lesson,{limit:101}),{code:'invalid_request'});assert.equal(h.calls.length,0);
});
test('foreign identity, changed binding, invalid mathematics and private history payloads never escape',async t=>{
  for(const change of [r=>r.lesson.organization_id=id(99),r=>r.head.lesson_id=id(99),r=>r.lesson.id=id(99),r=>r.head.document.course_version_id=id(99),
    r=>r.head.document.publication.audience='public',r=>r.head.document.slides[0].blocks[0].content.paragraphs[0].children[1].tex='\\frac{',r=>r.versions[0].private_notes=NOTE]){
    const h=harness(t,{fetchHook:(url,_,{stored})=>{const value=copy(stored);change(value);return reply(url,value);}});await h.client.initialize();await assert.rejects(h.client.get(ids.lesson),{code:'invalid_response'});assert.deepEqual(h.writes,[]);
  }
  let calls=0;const changed=harness(t,{fetchHook:(url,_,{stored})=>{const value=copy(stored);if(calls++)value.lesson.class_id=id(99);return reply(url,value);}});await changed.client.initialize();await changed.client.get(ids.lesson);await assert.rejects(changed.client.get(ids.lesson),{code:'invalid_response'});
});
test('redirects, foreign final URLs and missing readable private headers fail; unexposed nosniff is optional',async t=>{
  for(const change of [(response)=>Object.defineProperty(response,'redirected',{value:true}),response=>Object.defineProperty(response,'url',{value:'https://evil.invalid',configurable:true}),
    response=>response.headers.delete('cache-control'),response=>response.headers.set('cache-control','no-store'),response=>response.headers.set('content-type','text/html')]){
    const h=harness(t,{fetchHook:(url,_,{stored})=>{const response=reply(url,stored);change(response);return response;}});await h.client.initialize();await assert.rejects(h.client.get(ids.lesson),{code:'invalid_response'});
  }
  const cors=harness(t,{fetchHook:(url,_,{stored})=>{const response=reply(url,stored);response.headers.delete('x-content-type-options');return response;}});await cors.client.initialize();assert.equal((await cors.client.get(ids.lesson)).head.private_notes,NOTE);
});
test('late old-account success and 401 never return private notes or clear successor session',async t=>{
  for(const status of [200,401]){
    const pause=deferred();const h=harness(t,{fetchHook:()=>pause.promise});await h.client.initialize();const pending=h.client.get(ids.lesson);await tick();
    h.put('studio-fixture-successor-token',{id:id(22),organization_id:id(23),role:'teacher',status:'active'});
    pause.resolve(reply(h.calls[0].url,status===200?record():{ok:false,error:{code:'sign_in_required'}},status));
    await assert.rejects(pending,{code:'session_changed'});assert.equal(h.clearCount,0);assert.equal(h.invalidations.length,1);
  }
});
test('owned 401 clears only its own session; 403 invalidates access without clearing a valid login',async t=>{
  for(const status of [401,403]){
    const h=harness(t,{fetchHook:url=>reply(url,{ok:false,error:{code:'server-private-error'}},status)});await h.client.initialize();await assert.rejects(h.client.get(ids.lesson),{status});
    assert.equal(h.clearCount,status===401?1:0);assert.equal(h.invalidations.length,1);assert.throws(()=>h.client.actor());
  }
});
test('scoped404 and revision409 preserve the active session and expose safe fixed messages',async t=>{
  for(const [status,code] of [[404,'lesson_unavailable'],[409,'revision_conflict'],[422,'invalid_request']]){
    const h=harness(t,{fetchHook:url=>reply(url,{ok:false,error:{message:NOTE,code:'anything'}},status)});await h.client.initialize();
    await assert.rejects(h.client.get(ids.lesson),error=>error.status===status&&error.code===code&&!error.message.includes(NOTE));assert.equal(h.clearCount,0);assert.equal(h.invalidations.length,0);h.client.assertCurrent();
  }
});
test('timeout and explicit abort reject even when transport ignores abort; disposal rejects outstanding work',async t=>{
  const h=harness(t,{timeoutMs:15,fetchHook:()=>new Promise(()=>{})});await h.client.initialize();await assert.rejects(h.client.get(ids.lesson),{code:'timeout'});h.client.assertCurrent();
  const abort=harness(t,{fetchHook:()=>new Promise(()=>{})});await abort.client.initialize();const controller=new AbortController();const pending=abort.client.get(ids.lesson,{signal:controller.signal});controller.abort();await assert.rejects(pending,{code:'aborted'});
  const closed=harness(t,{fetchHook:()=>new Promise(()=>{})});await closed.client.initialize();const waiting=closed.client.get(ids.lesson);closed.client.dispose();await assert.rejects(waiting,{code:'disposed'});assert.throws(()=>closed.client.actor(),{code:'disposed'});
});
test('stream bounds, malformed JSON and stalled private body are rejected or aborted',async t=>{
  for(const kind of ['oversize','json','stall']){
    const h=harness(t,{timeoutMs:25,fetchHook:url=>{
      const body=kind==='oversize'?'x'.repeat(2*1024*1024+1):kind==='json'?'{':new ReadableStream({start(){}});
      const response=new Response(body,{headers:{'content-type':'application/json','cache-control':'no-store, private','x-content-type-options':'nosniff'}});Object.defineProperty(response,'url',{value:url});return response;
    }});await h.client.initialize();await assert.rejects(h.client.get(ids.lesson),{code:kind==='stall'?'timeout':'invalid_response'});
  }
});
test('same-tab session replacement and native storage/signout events invalidate automatically',async t=>{
  const sameTab=harness(t);await sameTab.client.initialize();sameTab.put('studio-fixture-changed-token');await new Promise(resolve=>setTimeout(resolve,240));assert.equal(sameTab.invalidations.length,1);
  const peer=harness(t);await peer.client.initialize();peer.put('studio-fixture-changed-token');peer.win.dispatchEvent(new Event('storage'));assert.equal(peer.invalidations.length,1);
  const signedOut=harness(t);await signedOut.client.initialize();signedOut.win.document.dispatchEvent(new Event('echs:institution-signed-out'));assert.equal(signedOut.invalidations.length,1);
});
test('authoring route and lesson-query changes reject pending private responses without clearing login',async t=>{
  const pause=deferred();const h=harness(t,{fetchHook:()=>pause.promise});await h.client.initialize();const pending=h.client.get(ids.lesson);await tick();
  h.win.location.href+='?lesson='+id(99);pause.resolve(reply(h.calls[0].url,record()));
  await assert.rejects(pending,{code:'route_changed'});assert.equal(h.clearCount,0);assert.equal(h.invalidations.length,1);
  const event=harness(t);await event.client.initialize();event.win.location.href+='?class='+id(99);event.win.dispatchEvent(new Event('popstate'));assert.equal(event.invalidations[0].code,'route_changed');
  const anchor=harness(t);await anchor.client.initialize();anchor.win.location.href+='#preview';anchor.client.assertCurrent();await anchor.client.get(ids.lesson);assert.equal(anchor.invalidations.length,0);
});

const assetBytes=new Uint8Array([1,7,8,9]);
const assetFile=()=>new File([assetBytes],'Original image.png',{type:'image/png'});
const assetMeta=(assetId=id(71))=>({asset_id:assetId,mime_type:'image/png',byte_length:4,width:2,height:2,sha256:createHash('sha256').update(assetBytes).digest('hex'),state:'ready'});
async function assetHarness(t,{hook,assetTimeoutMs=500}={}){
  const h=harness(t,{assetTimeoutMs,fetchHook:async(url,init)=>{
    if(!url.includes('/assets'))return reply(url,record());
    if(hook)return hook(url,init);
    const asset=assetMeta(init.headers['x-echs-asset-id']||id(71));
    if(url.endsWith('/bytes')){
      const result=new Response(assetBytes,{headers:{'content-type':asset.mime_type,'cache-control':'private, no-store'}});Object.defineProperty(result,'url',{value:url});return result;
    }
    return reply(url,{ok:true,contract:STUDIO_API_CONTRACT,lesson_id:ids.lesson,...(url.endsWith('/assets')&&init.method==='GET'?{assets:[asset]}:{asset})},init.method==='POST'?201:200);
  }});
  await h.client.initialize();await h.client.get(ids.lesson);return h;
}
test('asset upload sends bounded immutable bytes to the known lesson and reuses its logical ID on retry',async t=>{
  const file=assetFile();let uploads=0;
  const h=await assetHarness(t,{hook:async(url,init)=>{
    uploads++;assert.equal(init.method,'POST');assert.equal(init.headers['content-type'],'image/png');
    assert.equal(init.headers['x-echs-asset-name'],'Original%20image.png');assert.deepEqual(new Uint8Array(init.body),assetBytes);
    assert.equal(init.credentials,'omit');assert.equal(init.cache,'no-store');assert.equal(init.redirect,'error');
    if(uploads===1)throw new Error('Lost acknowledgement');
    return reply(url,{ok:true,contract:STUDIO_API_CONTRACT,lesson_id:ids.lesson,asset:assetMeta(init.headers['x-echs-asset-id'])},200);
  }});
  await assert.rejects(h.client.uploadAsset(ids.lesson,file),{code:'network_error'});
  const saved=await h.client.uploadAsset(ids.lesson,file);
  assert.equal(h.calls[1].init.headers['x-echs-asset-id'],saved.asset_id);assert.equal(h.calls[2].init.headers['x-echs-asset-id'],saved.asset_id);
  assert.deepEqual(h.writes,[]);
});
test('assets require a known lesson and reject unsafe file declarations before network access',async t=>{
  const h=await assetHarness(t);const before=h.calls.length;
  for(const file of [new File(['x'],'script.svg',{type:'image/svg+xml'}),new File(['x'],'../image.png',{type:'image/png'}),new File([],'empty.png',{type:'image/png'}),new File([new Uint8Array(4194305)],'large.png',{type:'image/png'})])await assert.rejects(h.client.uploadAsset(ids.lesson,file),{code:'invalid_request'});
  await assert.rejects(h.client.uploadAsset(id(99),assetFile()),{code:'invalid_request'});
  assert.equal(h.calls.length,before);
});
test('asset listing and metadata-then-bytes delivery validate scope, integrity and privacy',async t=>{
  const h=await assetHarness(t);assert.equal((await h.client.listAssets(ids.lesson))[0].asset_id,id(71));
  const loaded=await h.client.loadAsset(ids.lesson,id(71),{kind:'image'});assert.deepEqual(new Uint8Array(await loaded.blob.arrayBuffer()),assetBytes);
  assert.equal(loaded.metadata.sha256,assetMeta().sha256);assert.deepEqual(h.writes,[]);
  assert.ok(h.calls.at(-2).url.endsWith('/assets/'+id(71)));assert.ok(h.calls.at(-1).url.endsWith('/assets/'+id(71)+'/bytes'));
});
test('foreign metadata, private extra fields, wrong digest and duplicate asset lists are rejected',async t=>{
  for(const mutate of [d=>d.lesson_id=id(99),d=>d.storage_path='private/path',d=>d.asset.asset_id=id(99),d=>d.asset.sha256='0'.repeat(64)]){
    const h=await assetHarness(t,{hook:async(url,init)=>{
      const data={ok:true,contract:STUDIO_API_CONTRACT,lesson_id:ids.lesson,asset:assetMeta(init.headers['x-echs-asset-id']||id(71))};mutate(data);return reply(url,data,init.method==='POST'?201:200);
    }});
    await assert.rejects(h.client.uploadAsset(ids.lesson,assetFile()));
  }
  const duplicate=await assetHarness(t,{hook:async url=>reply(url,{ok:true,contract:STUDIO_API_CONTRACT,lesson_id:ids.lesson,assets:[assetMeta(),assetMeta()]})});
  await assert.rejects(duplicate.client.listAssets(ids.lesson));
});
test('account changes during an upload reject its late receipt and do not clear the successor login',async t=>{
  const pause=deferred(),started=deferred();let receipt;
  const h=await assetHarness(t,{hook:async(url,init)=>{receipt=reply(url,{ok:true,contract:STUDIO_API_CONTRACT,lesson_id:ids.lesson,asset:assetMeta(init.headers['x-echs-asset-id'])},201);started.resolve();return pause.promise;}});
  const pending=h.client.uploadAsset(ids.lesson,assetFile());await started.promise;
  h.put('new-asset-successor-token',{id:id(22),organization_id:id(23),role:'teacher',status:'active'});pause.resolve(receipt);
  await assert.rejects(pending,{code:'session_changed'});assert.equal(h.clearCount,0);assert.deepEqual(h.writes,[]);
});
test('asset timeout and explicit cancellation reject even when the fetch ignores its signal',async t=>{
  const stalled=await assetHarness(t,{assetTimeoutMs:10,hook:()=>new Promise(()=>{})});
  await assert.rejects(stalled.client.uploadAsset(ids.lesson,assetFile()),{code:'timeout'});
  const started=deferred();const h=await assetHarness(t,{hook:()=>{started.resolve();return new Promise(()=>{});}});
  const abort=new AbortController();const reading=h.client.loadAsset(ids.lesson,id(71),{signal:abort.signal});await started.promise;abort.abort();
  await assert.rejects(reading,{code:'aborted'});assert.equal(h.calls.length,2);
});
test('a changed backend configuration rejects pending asset metadata without fetching the successor origin',async t=>{
  const pause=deferred(),started=deferred();let receipt;
  const h=await assetHarness(t,{hook:async url=>{receipt=reply(url,{ok:true,contract:STUDIO_API_CONTRACT,lesson_id:ids.lesson,asset:assetMeta()});started.resolve();return pause.promise;}});
  const pending=h.client.loadAsset(ids.lesson,id(71));await started.promise;h.config.api_base='https://successor.supabase.co/functions/v1';pause.resolve(receipt);
  await assert.rejects(pending,{code:'configuration_changed'});assert.equal(h.calls.length,2);assert.equal(h.clearCount,0);
});
