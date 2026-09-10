// Actual service worker, isolated CacheStorage/fetch, no network or user data.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash,webcrypto} from 'node:crypto';
const root=new URL('../',import.meta.url),source=fs.readFileSync(new URL('sw.js',root),'utf8');
const prior=fs.readFileSync(new URL('tools/fixtures/c04-prior-worker.js',root));
const base='https://fixture.test/ECHS-Math/',expected=['js/institution-client.js','js/owner-storage.mjs'];
const urlOf=r=>typeof r==='string'?new URL(r,base).href:r.url;
class Cache{
 entries=new Map();
 async put(r,v){this.entries.set(urlOf(r),v.clone())}
 async match(r,{ignoreSearch=false}={}){const u=new URL(urlOf(r));for(const[k,v]of this.entries){const x=new URL(k);if(k===u.href||(ignoreSearch&&x.origin===u.origin&&x.pathname===u.pathname))return v.clone()}}
 async keys(){return [...this.entries.keys()].map(x=>new Request(x))}
 async delete(r){return this.entries.delete(urlOf(r))}
}
function harness(){
 const stores=new Map(),handlers={},requests=[];let mode='offline';
 const caches={async open(n){if(!stores.has(n))stores.set(n,new Cache());return stores.get(n)},async keys(){return [...stores.keys()]},async delete(n){return stores.delete(n)},async match(r){for(const c of stores.values()){const v=await c.match(r);if(v)return v}}};
 const context=vm.createContext({self:{location:{href:base+'sw.js',origin:new URL(base).origin},addEventListener:(n,f)=>handlers[n]=f,clients:{claim:async()=>{}},skipWaiting:async()=>{}},Request,Response,URL,AbortController,TextDecoder,Uint8Array,crypto:webcrypto,setTimeout,clearTimeout,caches,console,
  fetch:async(request,options={})=>{requests.push({request,options});if(mode==='offline')throw new TypeError('Fixture offline');return new Response(mode==='error'?'Unavailable':'Current source',{status:mode==='error'?503:200,headers:{'content-type':'text/javascript'}})}});
 vm.runInContext(source,context);const names=vm.runInContext('({static:STATIC_CACHE,runtime:RUNTIME_CACHE})',context);
 async function dispatch(url,options){let result;const waits=[];handlers.fetch({request:new Request(url,options),respondWith:r=>result=r,waitUntil:r=>waits.push(r)});const response=await result;await Promise.all(waits);return response}
 async function activate(){let result;handlers.activate({waitUntil:r=>result=r});await result}
 return{context,names,caches,requests,dispatch,activate,setMode:value=>mode=value};
}
const checks=[];async function test(name,fn){await fn();checks.push(name);console.log('PASS '+name)}
await test('Exact two public authority module paths and preserved production worker baseline',()=>{
 const h=harness();assert.deepEqual(Array.from(vm.runInContext('OWNER_AUTHORITY_ASSETS',h.context)),expected);
 assert.equal(createHash('sha256').update(prior).digest('hex'),'d2205deb9e8ad884093fca20433d0d4bf79774e743beddfd61cc70c195d7b0ff');assert.match(source,/owner-authority-c04-v1/);
});
await test('Old foreign caches never supply ownership code before activation',async()=>{
 const h=harness(),old=await h.caches.open('unknown-history');for(const p of expected)for(const query of ['', '?v=old']){await old.put(base+p+query,new Response('Old authority'));assert.equal((await h.dispatch(base+p+query)).type,'error')}
});
await test('Activation purges old authority variants while retaining unrelated and current public assets',async()=>{
 const h=harness(),old=await h.caches.open('foreign-history'),current=await h.caches.open(h.names.runtime);for(const p of expected){await old.put(base+p+'?v=old',new Response('Old'));await current.put(base+p,new Response('Current'))}
 await old.put(base+'assets/logo.svg',new Response('Keep'));await h.activate();for(const p of expected){assert.equal(await old.match(base+p+'?v=old'),undefined);assert.ok(await current.match(base+p))}assert.ok(await old.match(base+'assets/logo.svg'));
});
await test('Offline use is limited to current runtime or current installed public module',async()=>{
 const h=harness(),runtime=await h.caches.open(h.names.runtime),shell=await h.caches.open(h.names.static);for(const p of expected){await shell.put(base+p,new Response('Installed'));assert.equal(await(await h.dispatch(base+p+'?v=existing')).text(),'Installed');await runtime.put(base+p+'?v=existing',new Response('Runtime'));assert.equal(await(await h.dispatch(base+p+'?v=existing')).text(),'Runtime')}
});
await test('Online fetch reloads and replaces only this release cache',async()=>{
 const h=harness(),url=base+expected[0];h.setMode('online');assert.equal(await(await h.dispatch(url)).text(),'Current source');assert.equal(h.requests.at(-1).request.cache,'reload');h.setMode('offline');assert.equal(await(await h.dispatch(url)).text(),'Current source');
});
await test('Online errors do not return cached authority as a successful fresh response',async()=>{
 const h=harness(),url=base+expected[0];await(await h.caches.open(h.names.runtime)).put(url,new Response('Current cached'));h.setMode('error');assert.equal((await h.dispatch(url)).status,503);h.setMode('offline');assert.equal(await(await h.dispatch(url)).text(),'Current cached');
});
await test('Credential requests remain uncached and cannot reach public fallback',async()=>{
 const h=harness(),url=base+expected[0];await(await h.caches.open(h.names.runtime)).put(url,new Response('Public'));for(const [u,o]of [[url,{headers:{authorization:'Bearer SYNTHETIC'}}],[url+'?token=SYNTHETIC',undefined],['https://school.supabase.co/functions/v1/account-api/me',undefined]]){await assert.rejects(h.dispatch(u,o),/offline/);assert.equal(h.requests.at(-1).options.cache,'no-store')}
});
await test('Other origins, path prefixes and encoded aliases are outside the authority asset set',()=>{
 const h=harness();for(const url of ['https://elsewhere.test/ECHS-Math/'+expected[0],'https://fixture.test/other/'+expected[0],base+'extra/'+expected[0],base+'js/institution-client.js.bak',base+'js%2finstitution-client.js'])assert.equal(vm.runInContext(`ownerAuthorityAsset(new URL(${JSON.stringify(url)}))`,h.context),false);
});
const report={contract:'echs.c04.owner-worker.v1',status:'PASS',checks,source_sha256:createHash('sha256').update(source).digest('hex'),paths:expected,production_calls:0};
const arg=process.argv.indexOf('--report');if(arg>=0){const path=process.argv[arg+1];assert.ok(path&&!fs.existsSync(path),'New report path required');fs.writeFileSync(path,JSON.stringify(report,null,2)+'\n',{flag:'wx'})}
console.log(JSON.stringify(report,null,2));
