/* Controlled DOM lifecycle tests. Native dialog/browser integration is separate. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {startInvestigationHost} from '../../lessons/shared/investigations/host.mjs';
import {INVESTIGATION_HOSTS, resolveInvestigationHost} from '../../lessons/shared/investigations/host-manifest.mjs';
const require = createRequire(import.meta.url);
const {parseHTML} = require(process.env.ECHS_TEST_DOM_MODULE || 'linkedom');
const baseURL = 'https://example.test/ECHS-Math/';
const flush = async () => { for (let i=0;i<12;i++) await Promise.resolve(); };
let passed = 0;
async function group(name, fn) { await fn(); passed++; console.log('PASS '+name); }
function deferred() { let resolve, reject; const promise = new Promise((a,b) => {resolve=a;reject=b;}); return {promise,resolve,reject}; }
function fixture(options={}) {
  const spec = INVESTIGATION_HOSTS[options.index || 0];
  const href = new URL(spec.path+'?course='+spec.course+'&lessonKey=kept&accessKey=kept&unit=1&topic=kept#original',baseURL).href;
  const {window:dom,document} = parseHTML('<html><head></head><body><main id="app"><section class="slide" id="original">Original lesson</section></main><nav id="legacy-navigation"><button>Next</button></nav></body></html>');
  const events = document.createElement('div'), subscriptions = new Set(), timers = new Map();
  let timerId=0, focused=null, imports=0, mounts=0, disposals=0, captureHook=null;
  let identity = {kind:'account',organization_id:'synthetic-org',account_id:'synthetic-account',role:'student',status:'active',expires_at:Date.now()+60000,epoch:1,session_id:'synthetic-session-1'};
  const create = document.createElement.bind(document);
  document.createElement = function(tag) {
    const node = create(tag);
    node.focus = () => {focused=node;};
    if (tag==='dialog' && !options.noDialog) {
      node.showModal = () => {node.open=true;};
      node.close = () => {node.open=false;queueMicrotask(() => node.dispatchEvent(new dom.Event('close')));};
    }
    return node;
  };
  const authority = {
    capture() { if (captureHook) captureHook(); return {...identity}; },
    subscribe(fn) { subscriptions.add(fn); options.onSubscribe?.(fn); return () => subscriptions.delete(fn); },
  };
  const access = {authenticated:true,role:'student',current:{id:identity.account_id}};
  const portal = {ready: options.portalPromise || Promise.resolve(access),courseAllowed:()=>true,normaliseCourseKey:value=>value};
  const win = {document,location:{href},MutationObserver:dom.MutationObserver,
    ECHSInstitution:{ownerAuthority:authority},ECHSPortalAccess:portal,
    addEventListener:events.addEventListener.bind(events),removeEventListener:events.removeEventListener.bind(events),
    setTimeout(fn) {timers.set(++timerId,fn);return timerId;},clearTimeout(id){timers.delete(id);}};
  if (options.gate !== false) {document.documentElement.dataset.lessonGate='allowed';document.documentElement.dataset.echsLessonCourse=spec.course;}
  const original = document.getElementById('app').innerHTML, originalNode=document.getElementById('original');
  const module = {mountInvestigation(args) {
    mounts++; assert.equal(args.key,spec.key); assert.equal(args.window,win);
    const content = create('div'); content.id='owned-title'; content.textContent='Controlled activity'; args.dialog.replaceChildren(content); args.dialog.setAttribute('aria-labelledby',content.id);
    options.onMount?.(args);
    return {dispose(){disposals++;options.onDispose?.();}};
  }};
  const host = startInvestigationHost({window:win,baseURL,loadWorkspace() {imports++; return options.load ? options.load(module) : module;}});
  const click = node => node.dispatchEvent(new dom.Event('click',{bubbles:true,cancelable:true}));
  return {win,document,dom,access,portal,authority,timers,subscriptions,host,module,
    button:()=>document.querySelector('.ei-launch'),dialog:()=>document.querySelector('.ei-dialog'),
    counts:()=>({imports,mounts,disposals}),focused:()=>focused,
    setIdentity(change,notify=true){identity={...identity,...change};if(notify)for(const fn of [...subscriptions])fn();},
    setCaptureHook(fn){captureHook=fn;},click,
    emit(type){events.dispatchEvent(new dom.Event(type));},
    invariant(){assert.equal(document.getElementById('app').innerHTML,original);assert.equal(document.getElementById('original'),originalNode);assert.equal(win.location.href,href);},
    cleanup(){host.dispose();assert.equal(subscriptions.size,0);assert.equal(timers.size,0);assert.equal(document.querySelector('.ei-host'),null);assert.equal(document.querySelector('.ei-dialog'),null);},
  };
}

await group('exact seven routes and site origin; query/hash do not select another lesson',async()=>{
  assert.equal(INVESTIGATION_HOSTS.length,7);
  for(const row of INVESTIGATION_HOSTS) {
    const url=new URL(row.path,baseURL);
    assert.equal(resolveInvestigationHost(url.href+'?extra=kept#s3',baseURL),row);
    for(const bad of [url.href+'/extra',url.href.replace('example.test','other.test'),url.href.replace('.html','.html.source'),url.href.replace('https:','file:')]) assert.equal(resolveInvestigationHost(bad,baseURL),null);
  }
});
await group('seven allowed hosts preserve original DOM and URL and import only on open',async()=>{
  for(let index=0;index<INVESTIGATION_HOSTS.length;index++) {
    const f=fixture({index});await flush();assert.ok(f.button());assert.equal(f.counts().imports,0);
    assert.equal(f.dialog().closest('#app'),null);f.click(f.button());await flush();assert.equal(f.counts().mounts,1);
    f.invariant();f.cleanup();assert.equal(f.counts().disposals,1);
  }
});
await group('gate delay plus existing portal decision; no premature launcher',async()=>{
  const ready=deferred(),f=fixture({gate:false,portalPromise:ready.promise});await flush();assert.equal(f.button(),null);
  f.document.documentElement.dataset.echsLessonCourse='ap-precalculus';f.document.documentElement.dataset.lessonGate='allowed';await flush();assert.equal(f.button(),null);
  ready.resolve(f.access);await flush();assert.ok(f.button());f.cleanup();
});
await group('denied role, account, course, gate and expiry fail closed',async()=>{
  for(const mutate of [f=>f.access.authenticated=false,f=>f.access.role='parent',f=>f.access.current.id='other',f=>f.portal.courseAllowed=()=>false,
    f=>f.document.documentElement.dataset.echsLessonCourse='ib-math-ai',f=>f.setIdentity({expires_at:Date.now()-1},false),
    f=>f.win.location.href=f.win.location.href.replace('course=ap-precalculus','course=ib-math-ai')]) {
    const ready=deferred(),f=fixture({portalPromise:ready.promise});mutate(f);ready.resolve(f.access);await flush();assert.equal(f.button(),null);f.cleanup();
  }
});
await group('subscribe before capture and cleanup synchronous subscription invalidation',async()=>{
  const f=fixture({onSubscribe:fn=>fn()});await flush();assert.equal(f.button(),null);f.cleanup();
});
await group('pending portal cannot resurrect after pagehide or initial deadline',async()=>{
  for(const mode of ['pagehide','deadline']) {
    const ready=deferred(),f=fixture({portalPromise:ready.promise});
    if(mode==='pagehide')f.emit('pagehide');else for(const fn of [...f.timers.values()])fn();
    ready.resolve(f.access);await flush();assert.equal(f.button(),null);f.cleanup();
  }
});
await group('same account new session, organization or expiry revokes existing dialog',async()=>{
  for(const change of [{epoch:2,session_id:'synthetic-session-2'},{organization_id:'other-org'},{expires_at:Date.now()-1}]) {
    const f=fixture();await flush();f.click(f.button());await flush();f.setIdentity(change);await flush();assert.equal(f.button(),null);assert.equal(f.counts().disposals,1);f.cleanup();
  }
});
await group('gate removal and query-route changes dispose; hash-only navigation preserves',async()=>{
  const f=fixture();await flush();f.win.location.href=f.win.location.href.replace('#original','#s12');f.emit('hashchange');assert.ok(f.button());
  f.win.location.href+='&different';f.emit('popstate');assert.ok(f.button()); // still only fragment
  f.win.location.href=f.win.location.href.replace('accessKey=kept','accessKey=changed');f.emit('popstate');assert.equal(f.button(),null);f.cleanup();
  const g=fixture();await flush();g.document.documentElement.dataset.lessonGate='denied';await flush();assert.equal(g.button(),null);g.cleanup();
});
await group('late import cannot install after invalidation, close or pagehide',async()=>{
  for(const mode of ['owner','close','pagehide']) {
    const pending=deferred(),f=fixture({load:()=>pending.promise});await flush();f.click(f.button());await flush();assert.equal(f.counts().imports,1);
    if(mode==='owner')f.setIdentity({epoch:2});else if(mode==='close')f.dialog().close();else f.emit('pagehide');
    await flush();pending.resolve(f.module);await flush();assert.equal(f.counts().mounts,0);f.cleanup();
  }
});
await group('reentrant mount invalidation disposes returned renderer',async()=>{
  let f;f=fixture({onMount:()=>f.setIdentity({epoch:2})});await flush();f.click(f.button());await flush();assert.equal(f.counts().mounts,1);assert.equal(f.counts().disposals,1);f.cleanup();
});
await group('reentrant capture invalidation cannot authorize a late open',async()=>{
  const f=fixture();await flush();f.setCaptureHook(()=>{f.setCaptureHook(null);f.setIdentity({epoch:2});});f.click(f.button());await flush();assert.equal(f.counts().imports,0);f.cleanup();
});
await group('double open is single load; close restores focus; reopen recreates UI',async()=>{
  const f=fixture();await flush();f.click(f.button());f.click(f.button());await flush();assert.equal(f.counts().imports,1);assert.equal(f.counts().mounts,1);
  f.dialog().close();await flush();assert.equal(f.focused(),f.button());assert.equal(f.counts().disposals,1);assert.equal(f.dialog().hasAttribute('aria-labelledby'),false);assert.equal(f.dialog().getAttribute('aria-label'),'Mathematics investigation');
  f.click(f.button());await flush();assert.equal(f.counts().imports,1);assert.equal(f.counts().mounts,2);f.invariant();f.cleanup();
});
await group('dialog key boundary keeps native defaults and prevents legacy shortcuts',async()=>{
  const f=fixture();await flush();f.click(f.button());await flush();let legacy=0;
  f.document.addEventListener('keydown',()=>legacy++);
  for(const key of ['ArrowRight','PageDown','Home','s','f','t','Tab','Escape']) {
    const event=new f.dom.Event('keydown',{bubbles:true,cancelable:true});Object.defineProperty(event,'key',{value:key});
    f.dialog().firstChild.dispatchEvent(event);assert.equal(event.defaultPrevented,false);
  }
  assert.equal(legacy,0);f.invariant();f.cleanup();
});
await group('unsupported native dialog has explicit disabled fallback without importing',async()=>{
  const f=fixture({noDialog:true});await flush();assert.equal(f.button().disabled,true);assert.match(f.document.querySelector('.ei-status').textContent,/full lesson remains available/);assert.equal(f.counts().imports,0);f.invariant();f.cleanup();
});
await group('loader error is fixed text and retryable; renderer cleanup error still detaches',async()=>{
  let attempts=0;const f=fixture({load:module=>{if(++attempts===1)throw Error('PRIVATE_SENTINEL');return module;},onDispose:()=>{throw Error('PRIVATE_SENTINEL');}});
  await flush();f.click(f.button());await flush();assert.ok(!f.dialog().textContent.includes('PRIVATE_SENTINEL'));assert.match(f.dialog().textContent,/unavailable/);
  f.dialog().close();await flush();f.click(f.button());await flush();assert.equal(f.counts().mounts,1);f.cleanup();
});
await group('source has no persistence, API, URL mutation or trusted learning event writes',async()=>{
  const text=readFileSync(new URL('../../lessons/shared/investigations/host.mjs',import.meta.url),'utf8');
  for(const pattern of [/localStorage|sessionStorage|indexedDB/,/\bfetch\s*\(/,/\.api\s*\(/,/echs:learning|echs:lesson-completed/,/history\.(pushState|replaceState)/,/location\.(href|hash|search)\s*=/]) assert.equal(pattern.test(text),false,String(pattern));
});
console.log(JSON.stringify({status:'PASS',groups:passed,native_browser:false,native_dialog:false,backend_calls:0}));
