import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {assertLessonAssetMetadata, supportsLessonMedia, readLessonAssetResponse} from '../../js/lesson-runtime/asset-contract.mjs';

const id = 'e640a58c-2f75-476a-8af5-93fd585f3322';
const url = `https://fixture.supabase.co/functions/v1/lesson-api/lessons/${id}/assets/${id}/bytes`;
const bytes = new Uint8Array([1, 7, 8, 9]);
const metadata = () => ({asset_id:id,mime_type:'image/png',byte_length:bytes.length,width:2,height:2,sha256:createHash('sha256').update(bytes).digest('hex'),state:'ready'});
const capability = () => ({contract:'echs.lesson.media.v1',blocks:{image:[1],video:[1],table:[1],resource:[1]},asset_delivery:'authenticated-bytes',mime_types:['image/png','image/jpeg','image/webp','application/pdf'],max_image_bytes:4194304,max_resource_bytes:8388608});
function response(body=bytes, headers={}, status=200) {
  const result = new Response(body, {status,headers:{'content-type':'image/png','cache-control':'private, no-store',...headers}});
  Object.defineProperty(result,'url',{value:url});return result;
}
const options = (extra={}) => ({metadata:metadata(),expectedUrl:url,signal:new AbortController().signal,assertCurrent(){},...extra});

test('media negotiation accepts only the complete supported separate contract',()=>{
  assert.equal(supportsLessonMedia(capability()),true);
  for(const mutate of [v=>delete v.blocks.resource,v=>v.blocks.image.push(2),v=>v.extra=true,v=>v.contract='future',v=>v.asset_delivery='signed-url',v=>v.mime_types.push('image/svg+xml'),v=>v.max_resource_bytes++]) {
    const value=capability();mutate(value);assert.equal(supportsLessonMedia(value),false);
  }
  for(const value of [null,[],{},'media'])assert.equal(supportsLessonMedia(value),false);
});
test('asset metadata is exact, defensive, bounded and carries no authority or path',()=>{
  const source=metadata(),copy=assertLessonAssetMetadata(source,{assetId:id,kind:'image'});assert.notEqual(copy,source);assert.ok(Object.isFrozen(copy));
  for(const mutate of [v=>v.url='https://fixture.example/secret',v=>v.storage_path='private/path',v=>v.state='pending',v=>v.asset_id='other',v=>v.byte_length=4194305,v=>v.width=4097,v=>v.height=0,v=>v.sha256='wrong',v=>v.mime_type='image/svg+xml']) {
    const value=metadata();mutate(value);assert.throws(()=>assertLessonAssetMetadata(value));
  }
  assert.throws(()=>assertLessonAssetMetadata(source,{kind:'resource'}));
  assert.throws(()=>assertLessonAssetMetadata(source,{assetId:'540ab853-25a6-4455-8755-6e8dd621b070'}));
});
test('PDF metadata requires null dimensions and the resource byte budget',()=>{
  const value={...metadata(),mime_type:'application/pdf',width:null,height:null,byte_length:8388608};
  assert.equal(assertLessonAssetMetadata(value,{kind:'resource'}).byte_length,8388608);
  for(const patch of [{width:1},{height:0},{byte_length:8388609}])assert.throws(()=>assertLessonAssetMetadata({...value,...patch}));
});
test('metadata accessors never run before rejection',()=>{
  let reads=0;const value=metadata();Object.defineProperty(value,'sha256',{enumerable:true,get(){reads++;return 'x';}});
  assert.throws(()=>assertLessonAssetMetadata(value));assert.equal(reads,0);
});
test('authenticated response bytes are verified before creating an in-memory Blob',async()=>{
  let checks=0;const result=await readLessonAssetResponse(response(bytes,{'content-length':'4'}),options({assertCurrent(){checks++;}}));
  assert.equal(result.blob.type,'image/png');assert.deepEqual(new Uint8Array(await result.blob.arrayBuffer()),bytes);assert.ok(checks>=3);
  assert.equal(result.metadata.asset_id,id);assert.ok(Object.isFrozen(result));
});
test('wrong URL, status, MIME, privacy headers and declared sizes fail before bytes escape',async()=>{
  const cases=[response(bytes,{},404),response(bytes,{'content-type':'text/html'}),response(bytes,{'cache-control':'public,max-age=3600'}),response(bytes,{'content-length':'8'})];
  const foreign=response();Object.defineProperty(foreign,'redirected',{value:true});cases.push(foreign);
  for(const value of cases)await assert.rejects(readLessonAssetResponse(value,options()));
  await assert.rejects(readLessonAssetResponse(response(),options({expectedUrl:url+'?different'})));
});
test('truncated, excessive or tampered bytes never become a downloadable asset',async()=>{
  for(const value of [new Uint8Array([1,2]),new Uint8Array([1,2,3,4,5]),new Uint8Array([1,2,3,4])])await assert.rejects(readLessonAssetResponse(response(value),options()));
});
test('an excessive streaming response is cancelled without reading the remaining body',async()=>{
  let cancelled=false;const stream=new ReadableStream({start(controller){controller.enqueue(new Uint8Array(5));},cancel(){cancelled=true;}});
  await assert.rejects(readLessonAssetResponse(response(stream),options()));assert.equal(cancelled,true);
});
test('aborting a stalled private stream cancels the reader and rejects delivery',async()=>{
  const abort=new AbortController();let cancelled=false,started;
  const begun=new Promise(resolve=>started=resolve);
  const stream=new ReadableStream({pull(){started();},cancel(){cancelled=true;}});
  const reading=readLessonAssetResponse(response(stream),options({signal:abort.signal}));
  await begun;abort.abort(new Error('Session closed'));
  await assert.rejects(reading,/Session closed/);assert.equal(cancelled,true);
});
test('account revocation after integrity computation still prevents returning private bytes',async()=>{
  let current=true;
  const crypto={subtle:{async digest(...args){const hash=await globalThis.crypto.subtle.digest(...args);current=false;return hash;}}};
  await assert.rejects(readLessonAssetResponse(response(),options({crypto,assertCurrent(){if(!current)throw new Error('Account changed');}})),/Account changed/);
});
