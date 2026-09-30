import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {startClassroom} from '../lessons/shared/classroom/precalc-unit1/runtime.mjs';
import {loadLesson,CATALOG} from '../lessons/shared/classroom/precalc-unit1/catalog.mjs';
const require=createRequire(import.meta.url),{parseHTML}=require(process.env.ECHS_TEST_DOM_MODULE||'linkedom');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function fixture({gate='allowed',role='teacher',assigned=true,account='teacher-a',accessAccount=account,href='https://example.org/'+CATALOG[1].path,expires=Date.now()+3600000}={}) {
  const {window:dom,document:doc}=parseHTML('<!doctype html><html><head></head><body><div class="deck">Historical lesson & questions</div></body></html>');
  // LinkeDOM lacks the native selected-value setter; Chromium verifies the real control.
  Object.defineProperty(dom.HTMLSelectElement.prototype,'value',{configurable:true,get(){return this.querySelector('option[selected]')?.value??'';},set(value){for(const option of this.querySelectorAll('option'))option.toggleAttribute('selected',option.value===String(value));}});
  const events=doc.createElement('div');
  const win={document:doc,location:new URL(href),MutationObserver:dom.MutationObserver,Event:dom.Event,setTimeout,clearTimeout,
    addEventListener:events.addEventListener.bind(events),removeEventListener:events.removeEventListener.bind(events),dispatchEvent:events.dispatchEvent.bind(events)};
  win.history={state:null,replaceState(_state,_title,url){win.location=new URL(url);}};
  doc.documentElement.dataset.lessonGate=gate;doc.documentElement.dataset.echsLessonCourse='ap-precalculus';
  const subscribers=new Set();let owner={kind:'account',organization_id:'school',account_id:account,role,status:'active',expires_at:expires,epoch:1,session_id:'synthetic'};
  win.ECHSInstitution={ownerAuthority:{capture:()=>({...owner}),subscribe:fn=>{subscribers.add(fn);return()=>subscribers.delete(fn);}}};
  win.ECHSPortalAccess={ready:Promise.resolve({authenticated:true,role,current:{id:accessAccount}}),courseAllowed:()=>assigned};
  return{win,doc,change(){owner={...owner,epoch:2};[...subscribers].forEach(fn=>fn());},subscribers};
}
let checks=0;
for(const options of [{},{role:'student'},{role:'admin'}]) {
  const f=fixture(options),host=startClassroom({window:f.win});await tick();await tick();
  assert.ok(f.doc.querySelector('#echsClassroom'));assert.ok(f.doc.documentElement.classList.contains('ec-classroom-active'));checks+=2;
  f.change();assert.equal(f.doc.querySelector('#echsClassroom'),null);assert.equal(f.subscribers.size,0);assert.equal(f.doc.documentElement.classList.contains('ec-classroom-active'),false);checks+=3;host.dispose();
}
for(const options of [{gate:'denied'},{role:'parent'},{role:'student',assigned:false},{accessAccount:'other'},{expires:Date.now()-1},{href:'https://example.org/'+CATALOG[1].path+'?course=ap-calculus'}]) {
  const f=fixture(options),host=startClassroom({window:f.win});await tick();await tick();assert.equal(f.doc.querySelector('#echsClassroom'),null);checks++;host.dispose();
}
{
  const f=fixture();let release;const delayed=new Promise(resolve=>release=resolve);
  const host=startClassroom({window:f.win,loadContent:()=>delayed});await tick();f.change();release(await loadLesson('1.2'));await tick();assert.equal(f.doc.querySelector('#echsClassroom'),null);assert.equal(f.subscribers.size,0);checks+=2;host.dispose();
}
{
  const f=fixture(),host=startClassroom({window:f.win});await tick();await tick();
  const changed=new URL(f.win.location.href);changed.searchParams.set('changed','1');f.win.location=changed;f.win.dispatchEvent(new f.win.Event('popstate'));assert.equal(f.doc.querySelector('#echsClassroom'),null);checks++;host.dispose();
}
console.log(JSON.stringify({syntheticOwnerChecks:checks,status:'passed'}));
