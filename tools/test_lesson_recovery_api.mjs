import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomUUID} from 'node:crypto';
import katex from './lesson-runtime/node_modules/katex/dist/katex.mjs';
import {createLessonHandler} from '../supabase/functions/lesson-api/handler.mjs';
import {createRpcTransport} from '../supabase/functions/lesson-api/transport.mjs';
import {LESSON_RECOVERY_CAPABILITIES as CAP} from '../supabase/functions/lesson-api/recovery-contract.mjs';
const token='original-recovery-fixture-token',hash=createHash('sha256').update(token).digest('hex');
const ids={account:randomUUID(),org:randomUUID(),class:randomUUID(),lesson:randomUUID(),key:randomUUID()};
const key=Buffer.from(Array.from({length:32},(_,i)=>i)).toString('base64');
const secret='PRIVATE_RECOVERY_INTERNAL_CANARY';
const actor={account_id:ids.account,organization_id:ids.org,status:'active',role:'teacher',expires_at:'2099-01-01T00:00:00Z'};
const receipt=()=>({ok:true,contract:CAP.contract,account_id:ids.account,organization_id:ids.org,class_id:ids.class,lesson_id:ids.lesson,key_id:ids.key,key_base64:key});
const origin='https://recoveryfixture.supabase.co',credential='isolated-recovery-service-fixture';
function fixture({session=actor,cap=CAP,onRpc,now=()=>Date.now()}={}) {
  const calls=[],errors=[];
  const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json'}});
  const rpc=createRpcTransport({url:origin,serviceKey:credential,fetch:async(url,options)=>{
    try {
      const target=new URL(url);assert.equal(target.origin,origin);assert.equal(target.search,'');assert.equal(target.hash,'');
      assert.equal(options.method,'POST');assert.equal(options.redirect,'error');assert.equal(options.cache,'no-store');assert.equal(options.credentials,'omit');
      assert.equal(options.headers.apikey,credential);assert.equal(options.headers.authorization,'Bearer '+credential);
      const name=target.pathname.replace('/rest/v1/rpc/','');assert.equal(target.pathname,'/rest/v1/rpc/'+name);
      assert.ok(['api_session_lookup','lesson_store','lesson_store_health','lesson_content_capabilities','lesson_media_capabilities','lesson_recovery_capabilities','lesson_draft_recovery_key'].includes(name));
      const args=JSON.parse(options.body);calls.push({name,args});
      if(name.endsWith('_capabilities')||name==='lesson_store_health')assert.deepEqual(args,{});else assert.equal(args.p_token_hash,hash);
      const changed=await onRpc?.(name,args,json);if(changed!==undefined)return changed;
      if(name==='api_session_lookup')return json(session?[session]:[]);
      if(name==='lesson_recovery_capabilities')return json(cap);
      if(name==='lesson_content_capabilities'||name==='lesson_media_capabilities')return json(null);
      if(name==='lesson_store_health')return json({ok:true,contract:'echs.lesson.store.v1'});
      if(name==='lesson_store'){assert.ok(['get','context'].includes(args.p_action));return json({ok:true,contract:'echs.lesson.store.v1',lesson:{id:ids.lesson,organization_id:ids.org,class_id:ids.class},private_notes:secret});}
      assert.deepEqual(args,{p_token_hash:hash,p_payload:{lesson_id:ids.lesson}});return json(receipt());
    }catch(error){if(error instanceof assert.AssertionError)errors.push(error);throw error;}
  }});
  return {calls,errors,rpc,handler:createLessonHandler({rpc,mathEngine:katex,now,bodyTimeoutMs:30})};
}
function request(path='/lessons/'+ids.lesson+'/recovery-key',body,options={}) {
  if(arguments.length===0)body={};
  return new Request('https://fixture.invalid/functions/v1/lesson-api'+path,{method:body===undefined?'GET':'POST',headers:{origin:options.origin||'https://2ed944-cloud.github.io',
    ...(options.noToken?{}:{authorization:'Bearer '+token}),...(body===undefined?{}:{'content-type':options.type||'application/json'})},
    ...(body===undefined?{}:{body:typeof body==='string'?body:JSON.stringify(body)}),signal:options.signal});
}
async function result(f,req,status=200){const response=await f.handler(req),data=await response.json();assert.equal(response.status,status);assert.match(response.headers.get('cache-control'),/no-store/);assert.match(response.headers.get('cache-control'),/private/);assert.equal(response.headers.get('x-content-type-options'),'nosniff');assert.deepEqual(f.errors,[]);return data;}
test('public recovery health traverses actual fixed transport to the actual capability name only',async()=>{
  const f=fixture();assert.deepEqual(await result(f,request('/health/recovery',undefined,{noToken:true})),{ok:true,service:'lesson-api',contract:'echs.lesson.store.v1',recovery_capabilities:CAP});
  assert.deepEqual(f.calls,[{name:'lesson_recovery_capabilities',args:{}}]);assert.ok(!JSON.stringify(f.calls).includes(key));
});
test('missing or malformed capability fails closed without exposing key/database internals',async()=>{
  for(const cap of [null,{},[],{...CAP,extra:true},{...CAP,cipher:'AES-128-GCM'},{...CAP,max_plaintext_bytes:4194305}]){
    const f=fixture({cap});const data=await result(f,request('/health/recovery',undefined,{noToken:true}),503);assert.ok(!JSON.stringify(data).includes(secret));
    const ctx=await result(f,request('/context',undefined));assert.equal(ctx.recovery_capabilities,null);assert.equal(ctx.authoring_capabilities,null);assert.equal(ctx.media_capabilities,null);
  }
});
test('exact key release performs current get before RPC, binds all identities and projects only eight private fields',async()=>{
  const f=fixture(),data=await result(f,request());assert.deepEqual(data,receipt());assert.equal(Buffer.from(data.key_base64,'base64').length,32);
  assert.deepEqual(f.calls.map(c=>c.name),['api_session_lookup','lesson_store','lesson_draft_recovery_key']);assert.equal(f.calls[1].args.p_action,'get');
  assert.ok(!JSON.stringify(data).includes(secret));assert.ok(!JSON.stringify(f.calls).includes(token));assert.ok(!JSON.stringify(f.calls).includes(key));
});
test('missing/inactive/expired sessions and nonstaff roles cannot request recovery material',async()=>{
  const missing=fixture();await result(missing,request(undefined,{}, {noToken:true}),401);assert.equal(missing.calls.length,0);
  for(const session of [null,{...actor,status:'suspended'},{...actor,expires_at:'2000-01-01T00:00:00Z'}]){const f=fixture({session});await result(f,request(),401);assert.equal(f.calls.length,1);}
  for(const role of ['student','parent']){const f=fixture({session:{...actor,role}});await result(f,request(),403);assert.equal(f.calls.length,1);}
});
test('body/query/verb/origin are closed and cannot supply actor scope, key or RPC inputs',async()=>{
  for(const body of [{actor_id:ids.account},{class_id:ids.class},{key_base64:key},[],null,'{bad']){const f=fixture();await result(f,request(undefined,body),body==='{bad'?400:422);assert.ok(!f.calls.some(c=>c.name==='lesson_draft_recovery_key'));}
  for(const path of ['/lessons/'+ids.lesson+'/recovery-key?class_id='+ids.class,'/health/recovery?lesson_id='+ids.lesson]){const f=fixture();await result(f,request(path,path.startsWith('/health')?undefined:{}),422);assert.equal(f.calls.length,0);}
  const get=fixture();await result(get,request('/lessons/'+ids.lesson+'/recovery-key',undefined),404);assert.equal(get.calls.length,0);
  const cors=fixture();await result(cors,request(undefined,{}, {origin:'https://untrusted.invalid'}),403);assert.equal(cors.calls.length,0);
  const type=fixture();await result(type,request(undefined,{}, {type:'text/plain'}),415);
});
test('current get and the independent release RPC each enforce scope and sanitize database denials',async()=>{
  for(const stage of ['lesson_store','lesson_draft_recovery_key'])for(const [code,status] of [['42501',404],['P0002',404],['28000',401],['XX000',503]]){
    const f=fixture({onRpc:(name,args,json)=>name===stage?json({code,message:secret,detail:key},400):undefined});const data=await result(f,request(),status);
    assert.ok(!JSON.stringify(data).includes(key));assert.ok(!JSON.stringify(data).includes(secret));if(stage==='lesson_store')assert.ok(!f.calls.some(c=>c.name==='lesson_draft_recovery_key'));
  }
});
test('foreign account/org/class/lesson, invalid IDs and noncanonical key material cannot leave the server',async()=>{
  const variants=[];for(const name of ['account_id','organization_id','class_id','lesson_id','key_id'])variants.push({...receipt(),[name]:name==='key_id'?'bad':randomUUID()});
  for(const material of ['',key.slice(0,-1),key+'\n',Buffer.alloc(31).toString('base64'),key.slice(0,-2)+'B=',secret])variants.push({...receipt(),key_base64:material});
  variants.push({...receipt(),extra:secret});
  for(const value of variants){const f=fixture({onRpc:(name,args,json)=>name==='lesson_draft_recovery_key'?json(value):undefined});const data=await result(f,request(),503);assert.ok(!JSON.stringify(data).includes(key));}
});
test('incorrect preflight lesson identity fails before any key release',async()=>{
  for(const field of ['id','organization_id','class_id']){const f=fixture({onRpc:(name,args,json)=>name==='lesson_store'?json({ok:true,contract:'echs.lesson.store.v1',lesson:{id:ids.lesson,organization_id:ids.org,class_id:ids.class,[field]:'bad'}}):undefined});await result(f,request(),503);assert.ok(!f.calls.some(c=>c.name==='lesson_draft_recovery_key'));}
});
test('request abort and clock expiry during an in-flight release discard the returned material',async()=>{
  const controller=new AbortController();const f=fixture({onRpc:(name)=>{if(name==='lesson_draft_recovery_key')controller.abort();}});await result(f,request(undefined,{}, {signal:controller.signal}),503);
  let time=Date.parse('2098-01-01T00:00:00Z');const g=fixture({now:()=>time,onRpc:(name)=>{if(name==='lesson_draft_recovery_key')time=Date.parse('2100-01-01T00:00:00Z');}});await result(g,request(),401);
});
test('independent capability does not change existing health or allow arbitrary database function names',async()=>{
  const f=fixture();assert.deepEqual(await result(f,request('/health',undefined,{noToken:true})),{ok:true,service:'lesson-api',contract:'echs.lesson.store.v1'});
  const before=f.calls.length;await assert.rejects(f.rpc('private.lesson_draft_recovery_keys',{}));assert.equal(f.calls.length,before);
});
