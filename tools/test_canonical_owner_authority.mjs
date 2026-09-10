import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createOwnerStorage } from '../js/owner-storage.mjs';

const candidate=readFileSync(new URL('../js/institution-client.js',import.meta.url),'utf8');
const baseline=readFileSync(new URL('./fixtures/institution-client.pre-c04.js',import.meta.url),'utf8');
const KEYS={token:'echs_institution_token_v1',account:'echs_institution_account_v1',expires:'echs_institution_expires_v1'};
const A={id:'11111111-1111-4111-8111-111111111111',organization_id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',role:'student',display_name:'Synthetic A'};
const B={...A,id:'22222222-2222-4222-8222-222222222222',display_name:'Synthetic B'};
const copy=value=>JSON.parse(JSON.stringify(value));
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no});return{promise,resolve,reject}};
const response=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});
function harness(){
  let clock=Date.now(),hook=null,timerId=0;
  const docListeners=new Map(),winListeners=new Map(),events=[],requests=[],timers=new Map(),notices=[],links=[];
  const add=(map,name,fn)=>map.set(name,[...(map.get(name)||[]),fn]);
  function store(area){const data=new Map();return{data,get length(){return data.size},key:i=>[...data.keys()][i]??null,
    getItem(key){if(hook)hook(area,'getItem',key);return data.get(key)??null},
    setItem(key,value){if(hook)hook(area,'setItem',key,value);data.set(key,String(value))},
    removeItem(key){if(hook)hook(area,'removeItem',key);data.delete(key)}}}
  const local=store('local'),session=store('session');
  const state={configEnabled:true,configFail:false,configGate:null,meGate:null,syncGate:null,apiGate:null,failMe:false,meStatus:200,serverPatch:null,apiStatus:200,completions:true};
  const expiry=()=>new Date(clock+3600000).toISOString();
  const document={currentScript:{src:'https://fixture.invalid/js/institution-client.js'},readyState:'loading',visibilityState:'visible',
    body:{dataset:{},classList:{contains:()=>false},prepend:node=>notices.push(node)},documentElement:{dataset:{}},querySelector:()=>null,
    getElementById:id=>notices.find(node=>node.id===id)||null,
    createElement:tag=>({tag,style:{},dataset:{},setAttribute(){},querySelector:selector=>selector==='span'?{textContent:''}:{addEventListener(){}}}),
    querySelectorAll:selector=>selector==='.institutionNav'?[{querySelector:selector=>selector==='[data-upload-manager-link]'?links[0]||null:null,append:node=>links.push(node),insertBefore:node=>links.push(node)}]:[],
    addEventListener:(name,fn)=>add(docListeners,name,fn),dispatchEvent:event=>{events.push(event);for(const fn of docListeners.get(event.type)||[])fn(event)}};
  class Clock extends Date { static now(){return clock} }
  const sandbox={document,localStorage:local,sessionStorage:session,navigator:{onLine:true},Date:Clock,
    location:{href:'https://fixture.invalid/question-bank/student.html',replace(url){this.href=url}},URL,Headers,FormData,Blob,AbortController,
    console:{log(){},warn(){},error(){}},CustomEvent:class{constructor(type,init={}){this.type=type;this.detail=init.detail}},
    setTimeout:(fn,delay)=>{const id=++timerId;timers.set(id,{fn,delay});return id},clearTimeout:id=>timers.delete(id),
    addEventListener:(name,fn)=>add(winListeners,name,fn),
    fetch:async(url,options={})=>{
      const href=String(url);assert.equal(new URL(href).origin,'https://fixture.invalid');
      if(href.endsWith('/institution.json')){if(state.configGate)await state.configGate.promise;if(state.configFail)throw new Error('synthetic config failure');return response({enabled:state.configEnabled,api_base:'https://fixture.invalid/functions/v1'})}
      assert.equal(sandbox.navigator.onLine,true,'Synthetic offline network');
      const auth=options.headers?.get('authorization'),entry={url:href,auth,options,body:options.body?JSON.parse(options.body):null};requests.push(entry);
      if(href.endsWith('/me')){
        const current=copy(auth==='Bearer token-b'?B:A),account={...current,expires_at:expiry(),...state.serverPatch};
        const code=state.meStatus,gate=state.meGate,fail=state.failMe;
        if(gate)await gate.promise;if(fail)throw new Error('synthetic offline');
        return code===200?response({ok:true,account}):response({ok:false,error:{code:'unauthenticated',message:'expired'}},code);
      }
      if(href.endsWith('/mastery-evidence/sync')){if(state.syncGate)await state.syncGate.promise;return response({ok:true,authoritative:true,...(state.completions?{sync_contract:'echs-learning-sync-v1'}:{})})}
      if(href.endsWith('/login'))return response({ok:true,account:A,token:'token-a',expires_at:expiry()});
      const status=state.apiStatus;if(state.apiGate)await state.apiGate.promise;
      return response(status===207?{ok:false,results:[{ok:true},{ok:false}]}:status===200?{ok:true,value:'private-A'}:{ok:false,error:{message:'expired',code:'unauthenticated'}},status);
    }};
  sandbox.window=sandbox;const context=vm.createContext(sandbox);vm.runInContext(candidate,context,{filename:'js/institution-client.js'});
  const client=sandbox.ECHSInstitution;
  // JSON realm bridge only: authentication, cache, transitions and request handling
  // remain the actual VM client. The imported core expects same-realm JSON objects.
  const authority={capture:()=>copy(client.ownerAuthority.capture()),verify:async captured=>copy(await client.ownerAuthority.verify(captured)),
    subscribe:fn=>client.ownerAuthority.subscribe(fn)};
  const ownerStorage=createOwnerStorage({storage:local,authority,now:()=>clock});
  return{client,state,local,session,events,requests,context,sandbox,ownerStorage,authority,notices,links,
    signIn(account=A,token=account.id===B.id?'token-b':'token-a',remember=true){client.setSession({account,token,expires_at:expiry()},remember)},
    rawSession(account,token='token-b',area=local){area.data.set(KEYS.account,JSON.stringify(account));area.data.set(KEYS.token,token);area.data.set(KEYS.expires,expiry())},
    fire(name,detail={}){for(const fn of winListeners.get(name)||[])fn({type:name,...detail});for(const fn of docListeners.get(name)||[])fn({type:name,...detail})},
    advance(ms){clock+=ms},setHook(fn){hook=fn},transitions:()=>events.filter(event=>event.type==='echs:institution-session-change'),
    timers:()=>[...timers.values()],
    meRequests:()=>requests.filter(row=>row.url.endsWith('/me')),syncRequests:()=>requests.filter(row=>row.url.endsWith('/sync')),
    open:()=>ownerStorage.open({domain:'attempts',revision:1}),dispose:()=>ownerStorage.dispose(),
  };
}
const cases=[];const test=(name,run)=>cases.push({name,run});
test('Actual client setSession emits one committed account transition; core verifies before hydration',async()=>{
  const h=harness();let captures=[];h.client.ownerAuthority.subscribe(()=>captures.push(h.authority.capture()));
  h.signIn();assert.equal(h.transitions().length,1);assert.equal(captures.length,1);assert.equal(captures[0].kind,'account');
  assert.equal(h.meRequests().length,0);const handle=await h.open();assert.equal(h.meRequests().length,1);handle.write('events',[{id:'A-event'}]);
  assert.ok(!JSON.stringify(captures).includes('token-a'));
  const envelope=[...h.local.data].find(([key])=>key.startsWith('echs_owned_v1:'))[1];assert.ok(!envelope.includes('token-a'));h.dispose();
});
test('Account A-to-B-to-A synchronously revokes handles and preserves original work',async()=>{
  const h=harness();h.signIn();const a=await h.open();a.write('events',[{id:'A'}]);h.signIn(B);assert.ok(a.signal.aborted);
  const b=await h.open();assert.equal(b.read('events'),null);b.write('events',[{id:'B'}]);h.signIn();const again=await h.open();
  assert.deepEqual(again.read('events'),[{id:'A'}]);assert.throws(()=>b.read('events'),{code:'owner_changed'});h.dispose();
});
test('Same token/account setSession starts a new epoch and cannot reuse the old verification',async()=>{
  const h=harness();h.signIn();const before=h.authority.capture(),a=await h.open();h.signIn();const after=h.authority.capture();
  assert.ok(after.epoch>before.epoch);assert.notEqual(after.session_id,before.session_id);assert.ok(a.signal.aborted);
  await h.open();assert.equal(h.meRequests().length,2);h.dispose();
});
test('Concurrent core opens and forced me calls share only the same in-flight epoch request',async()=>{
  const h=harness();h.signIn();h.state.meGate=deferred();const pending=[h.open(),h.open(),h.client.me(true),h.client.me(true)];
  await tick();assert.equal(h.meRequests().length,1);h.state.meGate.resolve();await Promise.all(pending);
  await h.client.me();assert.equal(h.meRequests().length,1);await h.open();assert.equal(h.meRequests().length,2);h.dispose();
});
test('Late successful me A-to-B and same-token new epochs cannot replace the new account/cache',async()=>{
  for(const same of [false,true]){const h=harness();h.signIn();h.state.meGate=deferred();const old=h.open();const rejection=assert.rejects(old);await tick();
    h.signIn(same?A:B);h.state.meGate.resolve();await rejection;assert.equal(h.client.account().id,same?A.id:B.id);
    h.state.meGate=null;const fresh=await h.open();assert.equal(fresh.assertCurrent().account_id,same?A.id:B.id);h.dispose()}
});
test('Late me401 cannot clear a newer same-token or different-account epoch',async()=>{
  for(const same of [false,true]){const h=harness();h.signIn();h.state.meStatus=401;h.state.meGate=deferred();const old=h.open();const rejection=assert.rejects(old);await tick();
    h.signIn(same?A:B);h.state.meGate.resolve();await rejection;assert.equal(h.client.token(),same?'token-a':'token-b');
    h.state.meGate=null;h.state.meStatus=200;await h.open();h.dispose()}
});
test('An old failed verification cannot clear a newer successful mePromise',async()=>{
  const h=harness();h.signIn();h.state.meGate=deferred();h.state.failMe=true;const old=h.client.me(true);const rejected=assert.rejects(old);await tick();
  h.signIn(B);const oldGate=h.state.meGate;h.state.meGate=null;h.state.failMe=false;await h.client.me(true);
  oldGate.resolve();await rejected;await h.client.me();assert.equal(h.meRequests().length,2);assert.equal(h.client.account().id,B.id);h.dispose();
});
test('Current401 invalidates synchronously, while late generic401 never clears a successor',async()=>{
  const h=harness();h.signIn();const handle=await h.open();h.state.apiStatus=401;await assert.rejects(h.client.api('institution-api','/report'));
  assert.ok(handle.signal.aborted);assert.equal(h.client.token(),'');assert.equal(h.authority.capture().kind,'guest');
  h.signIn();h.state.apiGate=deferred();const old=h.client.api('institution-api','/report');const rejected=assert.rejects(old,/expired/);await tick();
  h.signIn();h.state.apiGate.resolve();await rejected;assert.equal(h.client.token(),'token-a');h.dispose();
});
test('Generic private success and held configuration dispatch are epoch-guarded',async()=>{
  const h=harness();h.signIn();h.state.apiGate=deferred();const old=h.client.api('institution-api','/report');const rejected=assert.rejects(old,{code:'session_changed'});await tick();
  h.signIn();h.state.apiGate.resolve();await rejected;h.dispose();
  const p=harness();p.signIn();p.state.configGate=deferred();const dispatch=p.client.api('institution-api','/report');const denied=assert.rejects(dispatch,{code:'session_changed'});await tick();
  p.signIn(B);p.state.configGate.resolve();await denied;assert.equal(p.requests.length,0);p.dispose();
});
test('Storage/focus/visibility changes revoke before returning another owner’s private state',async()=>{
  for(const event of ['storage','focus','visibilitychange']){const h=harness();h.signIn();const a=await h.open();a.write('events',[{id:'A'}]);
    h.rawSession(B);h.fire(event,{key:KEYS.account});assert.ok(a.signal.aborted);const b=await h.open();assert.equal(b.read('events'),null);h.dispose()}
});
test('Missed raw storage signal, invalid expiry and server role change fail closed',async()=>{
  const h=harness();h.signIn();const a=await h.open();h.rawSession(B);assert.throws(()=>a.read('events'),{code:'owner_changed'});
  const b=await h.open();h.local.data.set(KEYS.expires,'invalid');assert.throws(()=>b.read('events'),{code:'authority_unavailable'});assert.equal(await h.client.me(),null);h.dispose();
  for(const patch of [{role:'teacher'},{organization_id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'},{expires_at:'2099-01-01T00:00:00Z'}]){
    const p=harness();p.signIn();const old=await p.open();p.state.serverPatch=patch;
    await assert.rejects(p.open());assert.ok(old.signal.aborted);for(const [key,value]of Object.entries(patch))assert.equal(p.client.account()[key],value);p.dispose();
  }
});
test('Ordinary me cache has a30-second bound; focus forces recheck, offline never verifies a new handle',async()=>{
  const h=harness();h.signIn();await h.client.me();await h.client.me();assert.equal(h.meRequests().length,1);
  h.fire('focus');await h.client.me();assert.equal(h.meRequests().length,2);
  h.advance(30001);h.state.serverPatch={expires_at:h.local.data.get(KEYS.expires)};await h.client.me();assert.equal(h.meRequests().length,3);
  h.advance(-1);await h.client.me();assert.equal(h.meRequests().length,4,'A backward clock adjustment cannot extend a cached proof');
  h.state.failMe=true;await assert.rejects(h.open());assert.equal(h.client.token(),'token-a');h.dispose();
});
test('Partial and dual-area sessions cannot be combined into a valid owner',async()=>{
  const h=harness();h.local.data.set(KEYS.token,'token-a');h.session.data.set(KEYS.account,JSON.stringify(A));h.session.data.set(KEYS.expires,new Date(Date.now()+3600000).toISOString());
  assert.throws(()=>h.authority.capture(),{code:'authority_unavailable'});assert.equal(h.client.token(),'');assert.equal(h.client.account(),null);
  h.signIn();h.rawSession(B,'token-b',h.session);assert.throws(()=>h.authority.capture(),{code:'authority_unavailable'});h.dispose();
});
test('Blocked/partial commits never expose guest or old-account success; explicit recovery verifies anew',async()=>{
  const h=harness();h.signIn();const old=await h.open();let fired=false;h.setHook((area,method,key)=>{if(!fired&&method==='setItem'&&key===KEYS.expires){fired=true;throw new Error('synthetic quota')}});
  const count=h.transitions().length;assert.throws(()=>h.signIn(B),{code:'session_unavailable'});assert.equal(h.transitions().length,count+1);
  assert.ok(old.signal.aborted);assert.equal(h.transitions().at(-1).detail.state,'unavailable');assert.throws(()=>h.authority.capture());
  h.setHook(null);h.signIn(B);await h.open();assert.equal(h.client.account().id,B.id);h.dispose();
});
test('Blocked storage property access invalidates existing handles and emits one controlled failure transition',async()=>{
  const observations=[];
  for(const property of ['localStorage','sessionStorage']){const h=harness();h.signIn();const old=await h.open(),count=h.transitions().length;
    Object.defineProperty(h.sandbox,property,{configurable:true,get(){const error=new Error('synthetic property access denied');error.name='SecurityError';throw error}});
    let error;try{h.signIn(B)}catch(value){error=value}
    observations.push({property,name:error?.name,code:error?.code,message:error?.message,aborted:old.signal.aborted,transitions:h.transitions().length-count,state:h.transitions().at(-1).detail.state});h.dispose();
  }
  assert.ok(observations.every(row=>row.code==='session_unavailable'&&row.aborted&&row.transitions===1&&row.state==='unavailable'),JSON.stringify(observations));
});
test('Idle expiry aborts before any new read, and a queued old timer cannot affect a successor',async()=>{
  const h=harness();h.signIn();const old=await h.open(),timers=h.timers();assert.equal(timers.length,1);assert.ok(timers[0].delay>0&&timers[0].delay<=60000);
  h.advance(3600001);timers[0].fn();assert.ok(old.signal.aborted);assert.equal(h.transitions().at(-1).detail.reason,'expiry_timer');h.dispose();
  const p=harness();p.signIn();await p.open();const stale=p.timers()[0];p.signIn(B);const fresh=await p.open(),before=p.transitions().length;
  stale.fn();assert.ok(!fresh.signal.aborted);assert.equal(p.transitions().length,before);p.dispose();
});
test('Verified metadata storage failure or a mixed-token readback cannot produce an authority receipt',async()=>{
  for(const mode of ['throw','mixed']){const h=harness();h.signIn();const old=await h.open();let fired=false;
    h.setHook((area,method,key)=>{if(!fired&&method==='setItem'&&key===KEYS.account){fired=true;if(mode==='throw')throw new Error('synthetic quota');h.local.data.set(KEYS.token,'token-b')}});
    await assert.rejects(h.open());assert.ok(old.signal.aborted);assert.throws(()=>h.authority.capture(),{code:'authority_unavailable'});
    assert.equal(h.client.account(),null);h.setHook(null);h.dispose();
  }
});
test('Non-identity metadata update does not force a spurious first-open account transition',async()=>{
  const h=harness();h.signIn();const before=h.authority.capture(),count=h.transitions().length;h.state.serverPatch={display_name:'Verified synthetic A'};
  await h.open();assert.equal(h.client.account().display_name,'Verified synthetic A');assert.equal(h.authority.capture().epoch,before.epoch);assert.equal(h.transitions().length,count);h.dispose();
});
test('Malformed verification response cannot certify a cached account or preserve a proof lease',async()=>{
  const h=harness();h.signIn();const old=await h.open();h.state.serverPatch={status:'suspended'};await assert.rejects(h.open());assert.ok(old.signal.aborted);h.dispose();
});
test('Login/logout and partial207 API contracts remain; late logout cannot clear a new login',async()=>{
  const h=harness();const logged=await h.client.login('synthetic','synthetic',true);assert.equal(logged.id,A.id);assert.equal(h.meRequests().length,0);
  h.state.apiStatus=207;const partial=await h.client.api('institution-api','/batch');assert.equal(partial.results.length,2);
  h.state.apiStatus=200;h.state.apiGate=deferred();const logout=h.client.logout();await tick();h.signIn(B);h.state.apiGate.resolve();await logout;
  assert.equal(h.client.token(),'token-b');assert.ok(!h.sandbox.location.href.endsWith('/login.html'));h.dispose();
});
test('Original raw sync payload/queue/completion algorithms remain byte-equivalent and epoch guarded',async()=>{
  function segment(source,name){const start=source.search(new RegExp('^  (?:async )?function '+name+'\\(', 'm'));assert.ok(start>=0);const tail=source.slice(start+1);const end=tail.search(/^  (?:async )?function /m);return source.slice(start,end<0?undefined:start+1+end)}
  for(const name of ['normaliseCourse','localLessonCompletions','localLearningPayload','mergeLearningPayload','sendLearningQueue','syncLearning','flushPending'])assert.equal(segment(candidate,name),segment(baseline,name),name);
  const h=harness();h.signIn();h.local.data.set('echs_learning_events_v2',JSON.stringify([{id:'unchanged-event',correct:true}]));
  h.local.data.set('echs_math_complete',JSON.stringify(['ap-calculus::0::1.7::Synthetic']));
  h.state.completions=false;const sent=await h.client.syncLearning();assert.equal(sent.reason,'completion_sync_unavailable');
  const key='echs_institution_pending_sync_v1:'+A.id;assert.ok(h.local.data.has(key));assert.equal(h.syncRequests()[0].body.attempts[0].id,'unchanged-event');
  assert.equal(h.syncRequests()[0].body.lessons[0].access_key,'ap-calculus::0::1.7');assert.equal(h.syncRequests()[0].options.sessionGuard,undefined);
  h.state.completions=true;await h.client.flushPending();assert.equal(h.local.data.has(key),false);
  h.state.syncGate=deferred();const old=h.client.syncLearning();const denied=assert.rejects(old,{code:'session_changed'});await tick();h.signIn();h.state.syncGate.resolve();await denied;assert.ok(h.local.data.has(key));h.dispose();
});

test('requireAuth preserves current401, concurrent401, initial guest and expired-session sign-in redirects',async()=>{
  for(const mode of ['current','concurrent','guest','expired']){
    const h=harness();if(mode!=='guest')h.signIn();if(mode==='expired')h.advance(3600001);h.state.meStatus=401;
    const pending=h.client.requireAuth(['student']);if(mode==='concurrent')await Promise.all([pending,h.client.requireAuth(['student'])]);else await pending;
    assert.equal(h.client.token(),'');assert.equal(new URL(h.sandbox.location.href).pathname,'/login.html');assert.equal(h.notices.length,0);h.dispose();
  }
});

test('Late requireAuth success, network and401 results cannot redirect, label or mark a successor unavailable',async()=>{
  for(const mode of ['success','network','401'])for(const same of [false,true]){
    const h=harness();h.signIn();h.state.meStatus=mode==='401'?401:200;h.state.failMe=mode==='network';h.state.meGate=deferred();
    const url=h.sandbox.location.href,pending=h.client.requireAuth(['teacher']);await tick();h.signIn(same?A:B);
    h.sandbox.document.documentElement.dataset.institution='successor';h.sandbox.document.documentElement.dataset.institutionAccessRole='successor';
    const eventCount=h.events.length;h.state.meGate.resolve();assert.equal(await pending,null);
    assert.equal(h.client.account().id,same?A.id:B.id);assert.equal(h.sandbox.location.href,url);assert.equal(h.notices.length,0);assert.equal(h.links.length,0);
    assert.equal(h.events.length,eventCount);assert.equal(h.sandbox.document.documentElement.dataset.institution,'successor');
    assert.equal(h.sandbox.document.documentElement.dataset.institutionAccessRole,'successor');h.dispose();
  }
});

test('requireAuth captures before held config; late enabled, disabled or failed config cannot adopt a successor',async()=>{
  for(const mode of ['enabled','disabled','failed']){
    const h=harness();h.signIn();h.state.configGate=deferred();h.state.configEnabled=mode!=='disabled';h.state.configFail=mode==='failed';
    const url=h.sandbox.location.href,pending=h.client.requireAuth(['student']);await tick();h.signIn(B);
    h.sandbox.document.documentElement.dataset.institution='successor';h.state.configGate.resolve();assert.equal(await pending,null);
    assert.equal(h.sandbox.location.href,url);assert.equal(h.sandbox.document.documentElement.dataset.institution,'successor');
    assert.equal(h.sandbox.document.documentElement.dataset.institutionAccessRole,undefined);assert.equal(h.meRequests().length,0);assert.equal(h.notices.length,0);h.dispose();
  }
});

test('Current auth failures/config and allowed role/teacher links retain their original UI behavior',async()=>{
  for(const mode of ['network','blocked','disabled','student','teacher','role']){
    const h=harness();h.signIn();h.state.failMe=mode==='network';h.state.configEnabled=mode!=='disabled';
    if(mode==='blocked')Object.defineProperty(h.sandbox,'localStorage',{get(){throw new Error('synthetic blocked property')}});
    if(mode==='teacher'){h.signIn({...A,role:'teacher'});h.state.serverPatch={role:'teacher'}}
    const result=await h.client.requireAuth(mode==='role'?['teacher']:[]);
    if(['network','blocked'].includes(mode)){assert.equal(result,null);assert.equal(h.notices.length,1);assert.equal(h.sandbox.document.documentElement.dataset.institution,'unavailable');assert.equal(h.events.filter(e=>e.type==='echs:institution-auth-error').length,1)}
    if(mode==='disabled')assert.equal(h.sandbox.document.documentElement.dataset.institution,'unconfigured');
    if(mode==='student'||mode==='teacher'){assert.equal(result.id,A.id);assert.equal(h.sandbox.document.documentElement.dataset.institutionAccessRole,mode);assert.equal(h.links.length,mode==='teacher'?1:0)}
    if(mode==='role')assert.equal(new URL(h.sandbox.location.href).pathname,'/question-bank/student.html');h.dispose();
  }
});

test('A successor signed in synchronously during401 clearing never inherits the prior sign-in redirect',async()=>{
  const h=harness();h.signIn();const url=h.sandbox.location.href;h.state.meStatus=401;
  h.client.ownerAuthority.subscribe(event=>{if(event.reason==='clear_session')h.signIn(B)});
  assert.equal(await h.client.requireAuth(['student']),null);assert.equal(h.client.account().id,B.id);
  assert.equal(h.sandbox.location.href,url);assert.equal(h.notices.length,0);assert.equal(h.events.filter(e=>e.type==='echs:institution-signed-out').length,0);h.dispose();
});

test('Relevant queued credential/clear events revoke ABA captures; unrelated events preserve them',async()=>{
  for(const key of [KEYS.token,KEYS.account,KEYS.expires,null]){
    const h=harness();h.signIn();const old=await h.open(),before=h.authority.capture();old.write('events',[{id:'preserved-A'}]);
    h.rawSession(B);h.rawSession(A,'token-a');h.fire('storage',{key,oldValue:'A',newValue:'B'});
    assert.ok(old.signal.aborted);assert.ok(h.authority.capture().epoch>before.epoch);const fresh=await h.open();assert.deepEqual(fresh.read('events'),[{id:'preserved-A'}]);h.dispose();
  }
  const h=harness();h.signIn();const old=await h.open(),before=h.authority.capture();
  for(const key of ['unrelated-ui-setting','',undefined])h.fire('storage',{key});assert.ok(!old.signal.aborted);assert.equal(h.authority.capture().epoch,before.epoch);h.dispose();
});

test('Malformed me expiry types cannot certify on first verification or a repeated open',async()=>{
  for(const expires_at of [9999,0,true,false,null]){
    const h=harness();h.signIn();const initialExpiry=h.local.data.get(KEYS.expires),old=await h.open();
    h.state.serverPatch={expires_at};await assert.rejects(h.client.me(true),{code:'invalid_verified_session'});
    assert.ok(old.signal.aborted);await assert.rejects(h.open(),{code:'owner_changed'});
    assert.equal(h.local.data.get(KEYS.expires),initialExpiry);assert.equal(h.client.account().id,A.id);h.dispose();
  }
});

const results=[];
for(const entry of cases){try{await entry.run();results.push({name:entry.name,status:'PASS'})}catch(error){results.push({name:entry.name,status:'FAIL',error:String(error.stack||error)})}}
const report={contract:'echs.c04.canonical-owner-authority-tests.v1',status:results.every(row=>row.status==='PASS')?'PASS':'FAIL',checks:results.length,passed:results.filter(row=>row.status==='PASS').length,
  source_sha256:createHash('sha256').update(candidate).digest('hex'),baseline_sha256:createHash('sha256').update(baseline).digest('hex'),core_sha256:createHash('sha256').update(readFileSync(new URL('../js/owner-storage.mjs',import.meta.url))).digest('hex'),results,
  production_calls:0,raw_storage_adoption:false,limits:['Actual repository client and storage core with synthetic fetch/storage/clock and a JSON-only VM realm bridge.','No actual server revocation, multi-tab browser or full producer/reader/bootstrap adoption acceptance.','Legacy raw learning/sync inputs remain unchanged and unadopted by this session-lifecycle foundation.']};
if(process.argv.includes('--report'))writeFileSync(process.argv[process.argv.indexOf('--report')+1],JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));if(report.status!=='PASS')process.exitCode=1;
