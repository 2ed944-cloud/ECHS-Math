import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { createOwnerStorage, createGuestOwnerStorage, OWNER_AUTHORITY_CONTRACT, OWNER_LIMITS } from '../js/owner-storage.mjs';

const A = '11111111-1111-4111-8111-111111111111', B = '22222222-2222-4222-8222-222222222222';
const ORG = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', ORG2 = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const clone = value => structuredClone(value);
const account = (id = A, extra = {}) => ({ kind:'account', organization_id:ORG, account_id:id,
  role:'student', status:'active', expires_at:2000000, session_id:'opaque_session_000001', epoch:1, ...extra });
const guest = (extra = {}) => ({ kind:'guest', epoch:0, session_id:'opaque_guest_00000001', ...extra });
function deferred() { let resolve, reject; const promise = new Promise((yes,no) => { resolve=yes; reject=no; }); return { promise,resolve,reject }; }
function setup(initial = account()) {
  let current = clone(initial), time = 1000000, verifier, hook;
  const subscribers = new Set(), map = new Map(), calls = [], invalidations = [];
  const authority = { capture:() => clone(current), verify:async identity => verifier ? verifier(identity) :
    { contract:OWNER_AUTHORITY_CONTRACT, verified:true, identity:clone(identity) },
  subscribe(fn) { subscribers.add(fn); return () => subscribers.delete(fn); } };
  function call(name, ...args) { calls.push([name,...args]); if (hook) hook(name,...args); }
  const storage = { get length() { call('length'); return map.size; },
    key(i) { call('key',i); return [...map.keys()][i] ?? null; },
    getItem(key) { call('getItem',key); return map.get(key) ?? null; },
    setItem(key,value) { call('setItem',key,value); map.set(key,value); },
    removeItem(key) { call('removeItem',key); map.delete(key); } };
  const options = { storage,authority,now:() => time,onInvalidate:value => invalidations.push(value) };
  return { map,calls,storage,authority,options,invalidations, get current() { return clone(current); },
    transition(next, notify = true) { current=clone(next); if (notify) [...subscribers].forEach(fn => fn()); },
    setVerifier(fn) { verifier=fn; }, setHook(fn) { hook=fn; }, advance(ms) { time += ms; },
    factory() { return createOwnerStorage(options); }, guestFactory() { const { storage,...rest }=options; return createGuestOwnerStorage(rest); } };
}
const open = (factory,domain='attempts') => factory.open({domain,revision:1});
function throwsCode(fn,code) { assert.throws(fn,error => error?.name==='OwnerStorageError' && error.code===code); }
async function rejectsCode(promise,code) { await assert.rejects(promise,error => error?.name==='OwnerStorageError' && error.code===code); }
const tests=[]; const test=(name,run) => tests.push({name,run});

test('Verification completes before private hydration; every new handle verifies afresh', async () => {
  const env=setup(), factory=env.factory(), gate=deferred(); let verifies=0;
  env.setVerifier(async identity => { verifies++; await gate.promise; return {contract:OWNER_AUTHORITY_CONTRACT,verified:true,identity}; });
  const opening=open(factory); assert.equal(env.calls.length,0); gate.resolve(); const handle=await opening;
  assert.equal(env.calls.length,0); handle.write('events',[{id:'event-A',score:97}]); await open(factory);
  assert.equal(verifies,2); factory.dispose();
});
test('Closed envelopes preserve raw IDs/numbers; no bearer or session identity persists', async () => {
  const env=setup(), factory=env.factory(), h=await open(factory);
  const value={id:'original-event',score:97.5,assisted:true,answers:['x',0],nested:{label:'مرحبا'}};
  h.write('events',value); value.nested.label='changed';
  assert.equal(h.read('events').nested.label,'مرحبا');
  const read=h.read('events'); read.answers.push('changed'); assert.equal(h.read('events').answers.length,2);
  const raw=[...env.map.values()][0], envelope=JSON.parse(raw);
  assert.deepEqual(Object.keys(envelope),['contract','owner','domain','revision','item','data']);
  assert.deepEqual(envelope.owner,{organization_id:ORG,account_id:A});
  assert.ok(!raw.includes('session') && !raw.includes('expires') && !raw.includes('opaque_'));
  assert.ok(![...env.map.keys()].join().includes('opaque_'));
  throwsCode(() => h.write('x', {token:undefined}),'invalid_data'); factory.dispose();
});
test('B never reads or resets A; returning to A restores exact preserved bytes', async () => {
  const env=setup(), factory=env.factory(), first=await open(factory);
  env.map.set('echs_learning_events_v2','LEGACY-UNOWNED'); first.write('events',[{id:'A-event'}]);
  const aEntry=[...env.map.entries()].find(([key]) => key.includes(A));
  env.transition(account(B,{epoch:2,session_id:'opaque_session_000002'}));
  assert.equal(first.state().status,'disposed'); assert.ok(first.signal.aborted);
  throwsCode(() => first.read('events'),'owner_changed');
  const second=await open(factory); assert.deepEqual(second.read('events',[]),[]);
  second.write('events',[{id:'B-event'}]); assert.deepEqual(second.reset(),{removed:1,changed:0});
  assert.equal(env.map.get(aEntry[0]),aEntry[1]); assert.equal(env.map.get('echs_learning_events_v2'),'LEGACY-UNOWNED');
  env.transition(account(A,{epoch:3,session_id:'opaque_session_000003'}));
  const again=await open(factory); assert.deepEqual(again.read('events'),[{id:'A-event'}]); factory.dispose();
});
test('Role, org, expiry, session and same-token epoch changes invalidate synchronously', async () => {
  for (const patch of [{role:'teacher'},{organization_id:ORG2},{expires_at:1900000},{session_id:'opaque_session_000002'},{epoch:2}]) {
    const env=setup(), factory=env.factory(), h=await open(factory); h.write('events',{id:'A'});
    env.transition(account(A,patch)); assert.ok(h.signal.aborted); assert.equal(h.state().status,'disposed');
    throwsCode(() => h.export(),'owner_changed'); assert.equal(env.invalidations.length,1); factory.dispose();
  }
});
test('Missed notification still fails per-operation identity check; expiry rejects reads', async () => {
  const env=setup(), factory=env.factory(), h=await open(factory);
  env.transition(account(B,{epoch:2}),false); throwsCode(() => h.write('events',{id:'A'}),'owner_changed'); assert.equal(env.map.size,0);
  const second=await open(factory); env.advance(1000001); throwsCode(() => second.read('events'),'authority_unavailable'); factory.dispose();
});
test('Capture may synchronously notify and invalidate an already-checking handle without a null-identity error', async () => {
  const env=setup(), factory=env.factory(), handle=await open(factory), original=env.authority.capture;
  let armed=true;
  env.authority.capture=()=>{if(armed){armed=false;env.transition(account(B,{epoch:2}))}return original()};
  throwsCode(()=>handle.read('events'),'owner_changed'); assert.ok(handle.signal.aborted);
  assert.equal(handle.state().reason,'owner_changed'); factory.dispose();
});
test('Held verification A-to-B or disposal cannot create a stale handle', async () => {
  for (const dispose of [false,true]) {
    const env=setup(), factory=env.factory(), gate=deferred(); env.setVerifier(identity => gate.promise.then(() => ({contract:OWNER_AUTHORITY_CONTRACT,verified:true,identity})));
    const opening=open(factory); dispose ? factory.dispose() : env.transition(account(B,{epoch:2}));
    gate.resolve(); await rejectsCode(opening,dispose?'disposed':'owner_changed'); assert.equal(env.calls.length,0);
  }
});
test('Late failed A verification cannot clear or replace a verified B epoch', async () => {
  const env=setup(), factory=env.factory(), gate=deferred(); env.setVerifier(() => gate.promise);
  const old=open(factory); env.transition(account(B,{epoch:2})); env.setVerifier(null);
  const b=await open(factory); b.write('events',[{id:'B'}]); gate.reject(new Error('synthetic old 401'));
  await rejectsCode(old,'owner_changed'); assert.equal(env.current.account_id,B); assert.deepEqual(b.read('events'),[{id:'B'}]); factory.dispose();
});
test('Unverified, foreign and extra-field authority receipts fail closed without storage reads', async () => {
  for (const receipt of [
    {contract:OWNER_AUTHORITY_CONTRACT,verified:1,identity:account()},
    {contract:OWNER_AUTHORITY_CONTRACT,verified:false,identity:account()},
    {contract:OWNER_AUTHORITY_CONTRACT,verified:true,identity:account(B)},
    {contract:OWNER_AUTHORITY_CONTRACT,verified:true,identity:account(),token:'do-not-log'},
  ]) {
    const env=setup(), factory=env.factory(); env.setVerifier(() => receipt);
    await assert.rejects(open(factory),error => error.name==='OwnerStorageError'); assert.equal(env.calls.length,0); factory.dispose();
  }
  const env=setup({...account(),token:'bearer-secret'}),factory=env.factory();
  await rejectsCode(open(factory),'authority_unavailable'); factory.dispose();
});
test('Guest work is ephemeral and separate; sign-in cannot adopt or export it', async () => {
  const env=setup(guest()), gf=env.guestFactory(), pf=env.factory();
  await rejectsCode(open(pf),'authority_unavailable'); const g=await open(gf); g.write('events',[{id:'guest'}]);
  assert.equal(env.map.size,0); assert.equal(env.calls.length,0); assert.equal(g.export().contract,'echs.guest-export.v1');
  env.transition(account()); assert.ok(g.signal.aborted); throwsCode(() => g.read('events'),'owner_changed');
  const a=await open(pf); assert.equal(a.read('events'),null);
  env.transition(guest({epoch:2})); const nextGuest=await open(gf); assert.equal(nextGuest.read('events'),null);
  gf.dispose(); pf.dispose();
  throwsCode(() => createGuestOwnerStorage(env.options),'invalid_input');
});
test('Late guest invalidation after a missed event preserves the newer epoch and its other domains', async () => {
  for (const nextIdentity of [guest({epoch:2}), guest({epoch:1,session_id:'opaque_guest_00000002'})]) {
  const env=setup(guest({epoch:1})), factory=env.guestFactory(), old=await open(factory);
  old.write('events',{marker:'old'});
  env.transition(nextIdentity,false);
  const fresh=await open(factory), settings=await open(factory,'settings');
  fresh.write('events',{marker:'new'}); settings.write('main',{marker:'new-setting'});
  assert.equal(fresh.read('events').marker,'new');
  throwsCode(() => old.assertCurrent(),'owner_changed');
  assert.equal(fresh.read('events')?.marker,'new');
  assert.equal(settings.read('main')?.marker,'new-setting');
  assert.equal(fresh.state().status,'ready'); assert.equal(settings.state().status,'ready');
  assert.equal(env.map.size,0); factory.dispose();
  }
});
test('Exact namespace export/reset excludes other owners, orgs, domains and legacy data', async () => {
  const env=setup(), factory=env.factory(), h=await open(factory), settings=await open(factory,'settings');
  h.write('b',{id:'b'}); h.write('a',{id:'a'}); settings.write('main',{preference:'A'});
  const outside=[['echs_learning_events_v2','raw'],[`echs_owned_v1:${ORG}:${B}:attempts:1:events`,'B'],
    [`echs_owned_v1:${ORG2}:${A}:attempts:1:events`,'foreign'],[`echs_owned_v1:${ORG}:${A}:attempts:2:events`,'future']];
  outside.forEach(([k,v]) => env.map.set(k,v));
  assert.deepEqual(h.keys(),['a','b']); const exported=h.export(); assert.equal(exported.owner.account_id,A);
  assert.deepEqual(exported.items.map(row => row.item),['a','b']); assert.deepEqual(h.reset(),{removed:2,changed:0});
  outside.forEach(([k,v]) => assert.equal(env.map.get(k),v)); assert.equal(settings.read('main').preference,'A'); factory.dispose();
});
test('Queue compare-before-delete preserves a changed pending payload', async () => {
  const env=setup(), factory=env.factory(), queue=await open(factory,'sync-queue');
  queue.write('pending',{events:[{id:'original'}]}); const sent=queue.read('pending');
  queue.write('pending',{events:[{id:'original'},{id:'new'}]});
  assert.equal(queue.compareAndRemove('pending',sent),false); assert.equal(queue.read('pending').events.length,2);
  const latest=queue.read('pending'); assert.equal(queue.compareAndRemove('pending',latest),true); assert.equal(queue.read('pending'),null); factory.dispose();
});
test('Reset compares each captured byte string and retains concurrently changed records', async () => {
  const env=setup(), factory=env.factory(), h=await open(factory); h.write('events',{id:'old'});
  let reads=0; env.setHook((name,key) => { if(name==='getItem' && ++reads===2) {
    const body=JSON.parse(env.map.get(key)); body.data.id='new'; env.map.set(key,JSON.stringify(body));
  } });
  assert.deepEqual(h.reset(),{removed:0,changed:1}); env.setHook(null); assert.equal(h.read('events').id,'new'); factory.dispose();
});
test('Storage callbacks changing account cannot redirect keys or return stale private data', async () => {
  for (const method of ['getItem','setItem','removeItem']) {
    const env=setup(), factory=env.factory(), h=await open(factory); h.write('events',{id:'A'});
    env.setHook(name => { if(name===method) { env.setHook(null); env.transition(account(B,{epoch:2})); } });
    const action=method==='getItem' ? () => h.read('events') : method==='setItem' ? () => h.write('events',{id:'A2'}) : () => h.remove('events');
    throwsCode(action,'owner_changed'); assert.ok([...env.map.keys()].every(key => !key.includes(B))); factory.dispose();
  }
});
test('Held async work aborts and never returns old export after owner change or disposal', async () => {
  for (const dispose of [false,true]) {
    const env=setup(), factory=env.factory(), h=await open(factory), gate=deferred(); h.write('events',{id:'private-A'});
    let signal; const pending=h.run(async capturedSignal => { signal=capturedSignal; const value=h.export(); await gate.promise; return value; });
    dispose ? h.dispose() : env.transition(account(B,{epoch:2})); assert.ok(signal.aborted); gate.resolve();
    await rejectsCode(pending,dispose?'disposed':'owner_changed'); factory.dispose();
  }
});
test('Malformed/foreign/unknown envelope fields are refused and left byte-preserved', async () => {
  const env=setup(), factory=env.factory(), h=await open(factory); h.write('events',{id:'A'});
  const key=[...env.map.keys()][0], original=env.map.get(key), valid=JSON.parse(original);
  for (const malformed of ['not JSON','null',JSON.stringify({...valid,token:'secret'}),
    JSON.stringify({...valid,owner:{organization_id:ORG,account_id:B}}),JSON.stringify({...valid,item:'other'}),
    JSON.stringify({...valid,revision:2}),JSON.stringify({...valid,domain:'settings'}),
    JSON.stringify({...valid,owner:{...valid.owner,role:'admin'}})]) {
    env.map.set(key,malformed); throwsCode(() => h.read('events'),'invalid_envelope');
    throwsCode(() => h.reset(),'invalid_envelope'); assert.equal(env.map.get(key),malformed);
  }
  env.map.set(key,original); assert.equal(h.read('events').id,'A'); factory.dispose();
});
test('Accessors, prototypes, cycles, sparse arrays and non-JSON data execute no getters', async () => {
  const env=setup(), factory=env.factory(), h=await open(factory); let invoked=0;
  const getter={get secret() { invoked++; return 'private'; }}, cycle={}; cycle.self=cycle;
  const inherited=Object.create({private:'x'}); inherited.id='event';
  for (const value of [getter,cycle,inherited,new Date(),[,'hole'],Infinity,NaN,1n,undefined,()=>{}, {toJSON(){invoked++;return 'bad';}}, {[Symbol('x')]:1}])
    throwsCode(() => h.write('events',value),'invalid_data');
  assert.equal(invoked,0); assert.equal(env.map.size,0); factory.dispose();
});
test('Closed domain/revision/item inputs and UTF-8/depth/node bounds reject before writes', async () => {
  const env=setup(), factory=env.factory();
  for (const input of [{domain:'unknown',revision:1},{domain:'attempts',revision:2},{domain:'attempts',revision:1,owner:B}])
    await assert.rejects(factory.open(input),error => error.name==='OwnerStorageError');
  const h=await open(factory);
  for (const item of ['', '../B', 'a:b', '__proto__', 'constructor', 'x'.repeat(129)]) throwsCode(() => h.write(item,1),'invalid_item');
  throwsCode(() => h.write('events','é'.repeat(OWNER_LIMITS.itemBytes/2 + 1)),'data_bounds');
  let deep={}; for(let i=0;i<26;i++) deep={next:deep}; throwsCode(() => h.write('events',deep),'data_bounds');
  throwsCode(() => h.write('events',Array(100001).fill(1)),'data_bounds');
  throwsCode(() => h.write('events',Array(1000).fill('x'.repeat(10000))),'data_bounds');
  assert.equal(env.map.size,0); factory.dispose();
});
test('Blocked reads/writes/enumeration/deletes never silently switch to shared memory', async () => {
  const env=setup(), factory=env.factory(), h=await open(factory); h.write('events',{id:'A'});
  for (const method of ['getItem','setItem','length','removeItem']) {
    env.setHook(name => { if(name===method) throw new Error('sensitive platform exception'); });
    const action=method==='getItem'?()=>h.read('events'):method==='setItem'?()=>h.write('events',{id:'new'}):method==='length'?()=>h.export():()=>h.remove('events');
    throwsCode(action,'storage_unavailable');
  }
  env.setHook(null); assert.equal(h.read('events').id,'A'); factory.dispose();
});
test('Disposition clears references, is idempotent and does not wipe persistent owner work', async () => {
  const env=setup(), factory=env.factory(), h=await open(factory); h.write('events',{id:'A'}); const before=[...env.map.entries()];
  factory.dispose(); factory.dispose(); h.dispose(); assert.equal(env.invalidations.length,1);
  assert.deepEqual(h.state(),{status:'disposed',reason:'disposed'}); assert.deepEqual([...env.map.entries()],before);
  throwsCode(() => h.assertCurrent(),'disposed'); await rejectsCode(open(factory),'disposed');
});

const results=[];
for (const entry of tests) {
  try { await entry.run(); results.push({name:entry.name,status:'PASS'}); }
  catch(error) { results.push({name:entry.name,status:'FAIL',error:String(error?.stack||error)}); }
}
const report={contract:'echs.c04.owner-storage-tests.v1',status:results.every(row=>row.status==='PASS')?'PASS':'FAIL',
  source:'js/owner-storage.mjs',source_sha256:createHash('sha256').update(readFileSync(new URL('../js/owner-storage.mjs',import.meta.url))).digest('hex'),
  raw_storage_adoption:false,production_calls:0,checks:results.length,passed:results.filter(row=>row.status==='PASS').length,results,
  limits:['Synthetic Map/authority tests of the repository core; canonical client and real-browser acceptance are separate suites. No raw engine/sync adoption acceptance.',
    'Storage operations are synchronous and owner-keyed, not a multi-key or cross-tab atomic transaction. Reset may stop after partial deletion if storage fails or authority changes.']};
if(process.argv.includes('--report')) {
  const position=process.argv.indexOf('--report'), path=process.argv[position+1]; assert.ok(path,'--report requires a path');
  writeFileSync(path,JSON.stringify(report,null,2)+'\n');
}
console.log(JSON.stringify(report,null,2));
if(report.status!=='PASS') process.exitCode=1;
