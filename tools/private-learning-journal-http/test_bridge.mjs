import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {writeFile} from 'node:fs/promises';
import {postgrestPort,listen,waitDrain,FIXTURE_ORIGIN} from './bridge.mjs';
const tests=[];const test=(name,fn)=>tests.push({name,fn});
test('B01 fixture target is canonical private IPv4 at exact port3000',()=>{
 for(const target of ['http://127.0.0.1:3000/','http://8.8.8.8:3000','https://127.0.0.1:3000','http://127.0.0.1:3001','http://user@127.0.0.1:3000','http://localhost:3000'])assert.throws(()=>postgrestPort(target));
 for(const target of ['http://127.0.0.1:3000','http://172.29.0.3:3000','http://10.1.2.3:3000'])assert.equal(typeof postgrestPort(target),'function');
});
test('B02 fixed route mapping preserves raw body headers signal and exact status',async()=>{
 let seen;const options={method:'POST',body:'{"value":1.0000000000000001}',headers:{authorization:'synthetic'},signal:new AbortController().signal,redirect:'error',cache:'no-store'};
 const port=postgrestPort('http://127.0.0.1:3000',{fetchImpl:async(url,actual)=>{seen={url,actual};return new Response('{}',{status:207});}});
 const response=await port(FIXTURE_ORIGIN+'/rest/v1/rpc/learning_journal_apply',options);assert.equal(response.status,207);assert.equal(seen.url,'http://127.0.0.1:3000/rpc/learning_journal_apply');assert.equal(seen.actual,options);
 await assert.rejects(()=>port('https://other.invalid/rest/v1/rpc/learning_journal_apply',options));await assert.rejects(()=>port(FIXTURE_ORIGIN+'/rest/v1/rpc/learning_journal_apply?x=1',options));
});
test('B03 backpressure resolves on drain and removes all listeners',async()=>{const response=new EventEmitter(),controller=new AbortController();const done=waitDrain(response,controller.signal);response.emit('drain');await done;assert.equal(response.eventNames().length,0);});
test('B04 close error abort and already-aborted backpressure settle and clean listeners',async()=>{
 for(const event of ['close','error','abort','already']){const response=new EventEmitter(),controller=new AbortController();if(event==='already')controller.abort();const done=waitDrain(response,controller.signal);if(event==='abort')controller.abort();else if(event!=='already')response.emit(event);await assert.rejects(()=>done);assert.equal(response.eventNames().length,0);}
});
test('B05 native loopback POST preserves streamed bytes and response status',async()=>{
 const server=await listen(async request=>new Response(await request.text(),{status:207,headers:{'content-type':'application/json'}}));
 try{const response=await fetch(server.origin+'/functions/v1/learning-journal/apply',{method:'POST',body:'{"score":1.000000000000001}',signal:AbortSignal.timeout(2000)});assert.equal(response.status,207);assert.equal(await response.text(),'{"score":1.000000000000001}');assert.equal(server.metrics.requests,1);}finally{await server.close();}
});
test('B06 deliberate dropped response produces a real socket failure',async()=>{const server=await listen(async()=>new Response('{}'),{afterResponse:async()=> 'drop'});try{await assert.rejects(()=>fetch(server.origin+'/functions/v1/learning-journal/apply',{method:'POST',body:'{}',signal:AbortSignal.timeout(2000)}));assert.equal(server.metrics.dropped,1);}finally{await server.close();}});
test('B07 client disconnect cancels an active streaming response producer',async()=>{
 let stopped;const cancelled=new Promise(resolve=>{stopped=resolve;});let timer;
 const server=await listen(async()=>new Response(new ReadableStream({start(controller){timer=setInterval(()=>controller.enqueue(new Uint8Array(65536)),1);},cancel(){clearInterval(timer);stopped();}})));
 try{const controller=new AbortController();const response=await fetch(server.origin+'/functions/v1/learning-journal/state',{method:'POST',body:'{}',signal:controller.signal});const reader=response.body.getReader();await reader.read();controller.abort();let limit;try{await Promise.race([cancelled,new Promise((_,reject)=>{limit=setTimeout(()=>reject(new Error('producer-not-cancelled')),2000);})]);}finally{clearTimeout(limit);}}finally{clearInterval(timer);await server.close();}
});
const outcomes=[];for(const {name,fn} of tests){try{await fn();outcomes.push({name,status:'PASS'});}catch(error){outcomes.push({name,status:'FAIL',error:String(error.stack||error)});}}
const report={contract:'echs.c04.journal-http-loopback-adapter.v1',status:outcomes.every(x=>x.status==='PASS')?'PASS':'FAIL',groups:outcomes.length,outcomes,real_loopback_http:true,postgrest_executed:false,database_executed:false,production_calls:0};
if(process.argv[2])await writeFile(process.argv[2],JSON.stringify(report)+'\n',{flag:'wx'});process.stdout.write(JSON.stringify(report)+'\n');if(report.status!=='PASS')process.exitCode=1;
