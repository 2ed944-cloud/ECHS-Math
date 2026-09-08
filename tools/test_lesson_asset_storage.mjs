import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { createLessonAssetStorage } from '../supabase/functions/lesson-api/asset-storage.mjs';
import { LessonAssetError } from '../supabase/functions/lesson-api/asset-bytes.mjs';

// Synthetic fetch boundary only: no Supabase credentials, network or storage writes.
const URL = 'https://fixture.supabase.co';
const KEY = 'synthetic-service-key-not-a-production-secret';
const scope = Object.freeze({organization_id:'10000000-0000-4000-8000-000000000001',lesson_id:'10000000-0000-4000-8000-000000000002',asset_id:'10000000-0000-4000-8000-000000000003'});
const object = Object.values(scope).join('/');
const objectURL = `${URL}/storage/v1/object/lesson-assets/${object}`;
const PNG = new Uint8Array(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAADCAIAAAA2iEnWAAAAFElEQVR4nGOUDJjGwMDAxAAGUAoAEsQBBc88udgAAAAASUVORK5CYII=', 'base64'));
const expected = Object.freeze({mime:'image/png',bytes:PNG.length,sha256:createHash('sha256').update(PNG).digest('hex')});
const json = (body,status=200,headers={}) => new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json',...headers}});
const raster = (body=PNG,headers={}) => new Response(body,{headers:{'content-type':'image/png',...headers}});
const storage = (fetchImpl,options={}) => createLessonAssetStorage({url:URL,serviceKey:KEY,fetchImpl,...options});
const reject = (promise,code) => assert.rejects(promise,error=>error instanceof LessonAssetError && (!code || error.code===code));
function memoryStore() {
  const calls=[],objects=new Map();
  return {calls,objects,api:storage(async(target,options)=>{
    calls.push({target:String(target),options});
    if(options.method==='POST') {
      if(objects.has(String(target)))return json({code:'Duplicate',message:'PRIVATE_BUCKET_CANARY'},400);
      objects.set(String(target),{bytes:options.body.slice(),mime:options.headers['content-type']});
      return json({Key:`lesson-assets/${object}`,Id:'storage-internal-id'},201);
    }
    if(options.method==='GET') {
      const value=objects.get(String(target));return value?raster(value.bytes,{'content-type':value.mime}):json({message:'PRIVATE_NOT_FOUND'},404);
    }
    assert.equal(options.method,'DELETE');const {prefixes}=JSON.parse(options.body);assert.deepEqual(prefixes,[object]);
    const deleted=objects.delete(objectURL);return json(deleted?[{name:object,id:'storage-internal-id'}]:[]);
  })};
}

test('fixed private Storage REST requests implement immutable put, integrity-checked get and terminal cleanup', async () => {
  const s=memoryStore();const result=await s.api.put({scope,bytes:PNG,mime:'image/png'});
  assert.deepEqual(result,{...expected,width:2,height:3});assert.ok(Object.isFrozen(result));
  assert.deepEqual(await s.api.get({scope,expected}),PNG);
  assert.deepEqual(await s.api.removeTemporary({scope,state:'cleanup'}),{removed:true});
  assert.equal(s.objects.size,0);
  assert.deepEqual(s.calls.map(call=>[call.target,call.options.method]),[[objectURL,'POST'],[objectURL,'GET'],[`${URL}/storage/v1/object/lesson-assets`,'DELETE']]);
  for(const {options} of s.calls) {
    assert.equal(options.headers.apikey,KEY);assert.equal(options.headers.authorization,`Bearer ${KEY}`);
    assert.equal(options.redirect,'error');assert.equal(options.cache,'no-store');assert.equal(options.credentials,'omit');
    assert.ok(options.signal instanceof AbortSignal);
  }
  assert.equal(s.calls[0].options.headers['x-upsert'],'false');assert.equal(s.calls[0].options.headers['cache-control'],'max-age=0');
  assert.equal(s.calls[0].options.headers['content-type'],'image/png');
  assert.equal(JSON.stringify(result).includes('storage'),false);assert.equal(JSON.stringify(result).includes(object),false);
});
test('server configuration rejects arbitrary hosts, paths, query tokens and unbounded timeouts before fetch', () => {
  for(const url of ['http://fixture.supabase.co','https://attacker.example','https://fixture.supabase.co.evil.example','https://user:pass@fixture.supabase.co','https://fixture.supabase.co:1234','https://fixture.supabase.co/path','https://fixture.supabase.co?token=private','https://fixture.supabase.co#x']) assert.throws(()=>storage(()=>{}, {url}),TypeError);
  for(const serviceKey of ['',null,'short','has whitespace in this credential']) assert.throws(()=>storage(()=>{},{serviceKey}),TypeError);
  for(const timeoutMs of [0,-1,Infinity,NaN,30001,1.5]) assert.throws(()=>storage(()=>{},{timeoutMs}),TypeError);
  assert.throws(()=>storage(null),TypeError);
});
test('closed scope prevents path traversal, arbitrary bucket/URL injection and getters before network', async () => {
  let calls=0;const api=storage(async()=>{calls++;return json({});});
  for(const invalid of [{...scope,asset_id:'../secret'},{...scope,asset_id:scope.asset_id+'?token=x'},{...scope,bucket:'public'},Object.assign(Object.create({}),scope)]) {
    await reject(api.get({scope:invalid,expected}),'asset_storage_invalid_input');
  }
  await reject(api.get({scope:{...scope,asset_id:'ABCDEFAB-0000-4000-8000-000000000003'},expected}),'asset_storage_invalid_input');
  let reads=0;const getter={...scope};Object.defineProperty(getter,'asset_id',{enumerable:true,get(){reads++;return scope.asset_id;}});
  await reject(api.get({scope:getter,expected}),'asset_storage_invalid_input');assert.equal(reads,0);
  await reject(api.put({scope,bytes:PNG,mime:'image/png',url:'https://attacker.example'}),'asset_storage_invalid_input');
  assert.equal(calls,0);
});
test('file validation and expected metadata bounds reject bad inputs before credentials are sent', async () => {
  let calls=0;const api=storage(async()=>{calls++;return json({});});
  await reject(api.put({scope,bytes:new Uint8Array(10),mime:'image/png'}),'asset_invalid_format');
  await reject(api.put({scope,bytes:PNG,mime:'text/html'}),'asset_mime_not_allowed');
  await reject(api.put({scope,bytes:new Uint8Array(4*1024*1024+1),mime:'image/png'}),'asset_too_large');
  for(const invalid of [{...expected,bytes:0},{...expected,bytes:4*1024*1024+1},{...expected,sha256:'wrong'},{...expected,url:'https://attacker.example'}]) await reject(api.get({scope,expected:invalid}));
  assert.equal(calls,0);
});
test('put sends its validated snapshot even if the caller changes the input while hashing', async () => {
  let sent;const api=storage(async(_target,options)=>{sent=options.body.slice();return json({Key:`lesson-assets/${object}`});});
  const input=PNG.slice();const promise=api.put({scope,bytes:input,mime:'image/png'});input.fill(0);
  assert.equal((await promise).sha256,expected.sha256);assert.deepEqual(sent,PNG);
});
test('duplicate uploads never overwrite or retry; existing bytes survive both 400 and 409 collisions', async () => {
  const s=memoryStore();await s.api.put({scope,bytes:PNG,mime:'image/png'});
  await reject(s.api.put({scope,bytes:PNG,mime:'image/png'}),'asset_storage_conflict');
  assert.equal(s.calls.length,2);assert.deepEqual(await s.api.get({scope,expected}),PNG);
  let calls=0;const api=storage(async()=>{calls++;return json({message:KEY},409);});
  await reject(api.put({scope,bytes:PNG,mime:'image/png'}),'asset_storage_conflict');assert.equal(calls,1);
});
test('cleanup refuses pending/ready/unknown states and uses exact idempotent object deletion only', async () => {
  const s=memoryStore();
  for(const state of ['pending','ready','published','deleted',null,true]) await reject(s.api.removeTemporary({scope,state}),'asset_storage_cleanup_required');
  assert.equal(s.calls.length,0);assert.deepEqual(await s.api.removeTemporary({scope,state:'cleanup'}),{removed:true});
  assert.equal(s.calls.length,1);assert.equal(s.calls[0].options.method,'DELETE');
  const wrong=storage(async()=>json([{name:'some-other-object'}]));await reject(wrong.removeTemporary({scope,state:'cleanup'}),'asset_storage_invalid_response');
});
test('redirect status, redirected responses and changed origins are refused without exposing response contents', async () => {
  for(const response of [new Response(null,{status:302,headers:{location:'https://attacker.example/?token='+KEY}}),Object.assign(raster(),{fake:true})]) {
    if(response.fake)Object.defineProperty(response,'redirected',{value:true});
    await reject(storage(async()=>response).get({scope,expected}),'asset_storage_invalid_response');
  }
  const response=raster();Object.defineProperty(response,'url',{value:'https://attacker.example/private'});
  await reject(storage(async()=>response).get({scope,expected}),'asset_storage_invalid_response');
});
test('download integrity checks exact MIME, declared/actual length, complete container and SHA-256', async () => {
  for(const response of [raster(PNG,{'content-type':'text/html'}),raster(PNG,{'content-length':String(PNG.length+1)}),raster(PNG,{'content-length':'-1'}),raster(PNG.subarray(0,PNG.length-1))]) await reject(storage(async()=>response).get({scope,expected}));
  await reject(storage(async()=>raster()).get({scope,expected:{...expected,sha256:'0'.repeat(64)}}),'asset_storage_integrity');
  const corrupt=PNG.slice();corrupt[45]^=1;await reject(storage(async()=>raster(corrupt)).get({scope,expected}));
});
test('chunked response limits cancel immediately, including a nonsettling cancellation implementation', async () => {
  let cancelled=false;
  const body=new ReadableStream({start(controller){controller.enqueue(new Uint8Array(PNG.length+1));},cancel(){cancelled=true;return new Promise(()=>{});}});
  const before=Date.now();await reject(storage(async()=>raster(body),{timeoutMs:50}).get({scope,expected}),'asset_storage_invalid_response');
  assert.equal(cancelled,true);assert.ok(Date.now()-before<1000);
});
test('response JSON is bounded and malformed upload responses never claim successful storage', async () => {
  for(const response of [new Response('<html>'+KEY+'</html>',{headers:{'content-type':'text/html'}}),json({Key:'wrong-object'}),json({message:'x'.repeat(65536)}),new Response('{bad JSON', {headers:{'content-type':'application/json'}})]) await reject(storage(async()=>response).put({scope,bytes:PNG,mime:'image/png'}),'asset_storage_invalid_response');
});
test('stalled fetch and stalled body terminate by deadline even if injected fetch ignores AbortSignal', async () => {
  let calls=0;const api=storage(async()=>{calls++;return new Promise(()=>{});},{timeoutMs:15});
  const before=Date.now();await reject(api.put({scope,bytes:PNG,mime:'image/png'}),'asset_storage_timeout');assert.equal(calls,1);assert.ok(Date.now()-before<1000);
  let cancelled=false;const body=new ReadableStream({start(){},cancel(){cancelled=true;}});
  await reject(storage(async()=>raster(body),{timeoutMs:15}).get({scope,expected}),'asset_storage_timeout');assert.equal(cancelled,true);
});
test('late responses after timeout are cancelled and no automatic write retry occurs', async () => {
  let cancelled=false,calls=0;let complete;
  const api=storage(async()=>{calls++;return new Promise(resolve=>{complete=resolve;});},{timeoutMs:15});
  await reject(api.put({scope,bytes:PNG,mime:'image/png'}),'asset_storage_timeout');
  complete(new Response(new ReadableStream({start(){},cancel(){cancelled=true;}}),{headers:{'content-type':'application/json'}}));
  await new Promise(resolve=>setTimeout(resolve,0));assert.equal(cancelled,true);assert.equal(calls,1);
});
test('HTTP failures and thrown transport exceptions expose safe codes without keys, URLs or internal details', async () => {
  for(const status of [401,403,404,413,429,500,503]) {
    const api=storage(async()=>json({message:`${KEY} ${objectURL} PRIVATE_DIAGNOSTIC`},status));
    await assert.rejects(api.get({scope,expected}),error=>{
      assert.ok(error instanceof LessonAssetError);const text=String(error)+JSON.stringify(error);
      for(const privateValue of [KEY,objectURL,'PRIVATE_DIAGNOSTIC'])assert.equal(text.includes(privateValue),false);
      return error.code===(status===404?'asset_storage_not_found':'asset_storage_unavailable');
    });
  }
  await assert.rejects(storage(async()=>{throw new Error(KEY+' '+objectURL);}).get({scope,expected}),error=>error.code==='asset_storage_unavailable'&&!String(error).includes(KEY));
});
