import katex from '../node_modules/katex/dist/katex.mjs';
import {mountInstitutionalLesson, mountLesson} from '../../../js/lesson-runtime/renderer.mjs';

const scenario = new URL(location.href).searchParams.get('scenario') || 'allowed';
const lesson = await (await fetch('./published-original.lesson.json')).json();
lesson.publication.audience = 'institutional';
const ids = {
  lesson:lesson.lesson_id, account:'8a0f707a-67da-4aeb-b5a0-e242bd7061f7', organization:'cce5bb0f-0b1e-4a7c-8dd2-69eb38e0981f',
  class:'ecfb78c2-2a67-48c0-9f5b-70e9ef4ae30c', publication:'92026edf-32fb-496a-987a-9889e6c64e38', other:'193264e9-3b2b-468c-9f6c-06d8c84b65e9'
};
let account = {id:ids.account, organization_id:ids.organization, role:'student'}, token = 'local-fixture-token';
const config = {enabled:true, api_base:'https://fixture-project.supabase.co/functions/v1', site_base:location.origin + '/ECHS-Math/'};
const fixture = window.fixture = {ready:false, configCalls:0, apiCalls:[], abortCalls:0, bodyCancelled:0, finishCalls:0, learningCalls:0, storageWrites:0, ids};
fixture.account = value => {account = value;}; fixture.token = value => {token = value;};
fixture.config = config;
const originalSetItem = Storage.prototype.setItem;
Storage.prototype.setItem = function(...args) {fixture.storageWrites++; return originalSetItem.apply(this,args);};
for (const name of ['echs:learning-attempt','echs:learning-session','echs:lesson-completed']) window.addEventListener(name, () => fixture.learningCalls++);
for (const name of ['echs:learning-updated','echs:mastery-authority']) document.addEventListener(name, () => fixture.learningCalls++);
document.querySelector('[data-finish-lesson]').addEventListener('click', () => fixture.finishCalls++);
const delay = milliseconds => new Promise(resolve => setTimeout(resolve,milliseconds));
window.ECHSInstitution = {
  account:() => account, token:() => token,
  async config() {
    fixture.configCalls++;
    if (scenario === 'config-timeout') await new Promise(() => {});
    if (scenario.startsWith('config-') && scenario.endsWith('-race')) {await delay(10); mutate(scenario.slice(7,-5));}
    return config;
  }
};
const access = {authenticated:true,role:'student',current:account};
window.ECHSPortalAccess = {ready:Promise.resolve(access),current:access,courseAllowed:(course,current) => course === 'ap-calculus' && current.courseAllowed !== false};
document.documentElement.dataset.lessonGate = 'allowed';
document.documentElement.dataset.echsLessonCourse = 'ap-calculus';
function mutate(kind) {
  if (kind === 'token') token = 'changed-fixture-token';
  if (kind === 'account') account = {...account,id:ids.other};
  if (kind === 'organization') account = {...account,organization_id:ids.other};
  if (kind === 'route') history.replaceState(null,'','?course=ap-calculus&accessKey=other');
  if (kind === 'gate') document.documentElement.dataset.lessonGate = 'denied';
  if (kind === 'config') config.api_base = 'https://other-project.supabase.co/functions/v1';
  if (kind === 'role') account = {...account,role:'parent'};
  if (kind === 'signout') document.dispatchEvent(new Event('echs:institution-signed-out'));
  if (kind === 'course') document.dispatchEvent(new CustomEvent('echs:portal-access',{detail:{...access,courseAllowed:false}}));
}
fixture.mutate = mutate;
const route = new URL(location.href); route.search = ''; route.hash = '';
const responseData = {
  ok:true,contract:'echs.lesson.store.v1',lesson_id:ids.lesson,class_id:ids.class,publication_id:ids.publication,revision:1,document:lesson,
  binding:{account_id:ids.account,organization_id:ids.organization,class_id:ids.class,course_key:'ap-calculus',access_key:'fixture:continuity',route:route.href,
    document:{lesson_id:ids.lesson,course_version_id:lesson.course_version_id,unit_id:lesson.unit_id,topic_id:lesson.topic_id,document_version:1,publication_revision:1}}
};
fixture.responseData = responseData;
if (scenario === 'draft') lesson.publication.status = 'draft';
if (scenario === 'public') lesson.publication.audience = 'public';
if (scenario === 'teacher') lesson.publication.audience = 'teacher';
if (scenario === 'unknown-document-field') lesson.teacher_notes = 'PRIVATE-FIXTURE-MARKER';
if (scenario === 'unknown-envelope-field') responseData.draft_history = 'PRIVATE-FIXTURE-MARKER';
if (scenario === 'unknown-binding-field') responseData.binding.private_notes = 'PRIVATE-FIXTURE-MARKER';
if (scenario === 'unknown-identity-field') responseData.binding.document.reviewer_notes = 'PRIVATE-FIXTURE-MARKER';
if (scenario === 'bad-contract') responseData.contract = 'other-contract';
if (scenario === 'false-ok') responseData.ok = false;
if (scenario === 'foreign-account') responseData.binding.account_id = ids.other;
if (scenario === 'foreign-organization') responseData.binding.organization_id = ids.other;
if (scenario === 'foreign-class') responseData.binding.class_id = ids.other;
if (scenario === 'foreign-envelope-class') responseData.class_id = ids.other;
if (scenario === 'foreign-lesson') responseData.lesson_id = ids.other;
if (scenario === 'foreign-document') lesson.lesson_id = ids.other;
if (scenario === 'foreign-version') responseData.binding.document.course_version_id = ids.other;
if (scenario === 'wrong-revision') responseData.revision = 2;
if (scenario === 'wrong-identity-revision') responseData.binding.document.publication_revision = 2;
if (scenario === 'wrong-publication') responseData.publication_id = 'invalid';
if (scenario === 'foreign-route') responseData.binding.route = location.origin + '/ECHS-Math/other.html';
if (scenario === 'foreign-origin') responseData.binding.route = 'https://foreign.example.test' + location.pathname;
if (scenario === 'route-query') responseData.binding.route += '?accessKey=other';
if (scenario === 'route-hash') responseData.binding.route += '#slide=1';
if (scenario === 'route-empty-query') responseData.binding.route += '?';
if (scenario === 'route-empty-hash') responseData.binding.route += '#';
if (scenario === 'wrong-access-key') responseData.binding.access_key = 'other';
if (scenario === 'wrong-course') responseData.binding.course_key = 'ib-math-ai';
if (scenario === 'invalid-math') lesson.slides[1].blocks[0].content.tex = '\\frac{1}{';
if (scenario === 'unsafe-markup') lesson.slides[0].blocks[0].content.paragraphs[0].children[0].text = '<script>unsafe</script>';
if (scenario === 'legacy-reference') lesson.slides[0].blocks.push({id:'legacy',type:'legacy-embedded',version:1,content:{source:'lessons/ap-calculus/unit-1/lesson-1-1.html',anchor:'s1',sha256:'a'.repeat(64),summary:'Unverified reference.'}});
if (scenario === 'disabled-config') config.enabled = false;
if (scenario === 'string-enabled-config') config.enabled = 'true';
if (scenario === 'config-error') config.configuration_error = 'Unavailable';
if (scenario === 'bad-api-origin') config.api_base = 'https://evil.example.test/functions/v1';
if (scenario === 'bad-api-http') config.api_base = 'http://fixture-project.supabase.co/functions/v1';
if (scenario === 'bad-api-path') config.api_base += '/other';
if (scenario === 'bad-api-query') config.api_base += '?redirect=other';
if (scenario === 'bad-api-credentials') config.api_base = 'https://secret@fixture-project.supabase.co/functions/v1';
if (scenario === 'bad-api-lookalike') config.api_base = 'https://fixture-project.supabase.co.evil.example/functions/v1';
if (scenario === 'bad-site') config.site_base = 'https://foreign.example.test/ECHS-Math/';
if (scenario === 'guest') {account = null; token = '';}
if (scenario === 'missing-token') token = '';
if (scenario === 'parent') account = {...account,role:'parent'};
if (scenario === 'denied') document.documentElement.dataset.lessonGate = 'pending';
if (scenario === 'access-timeout') window.ECHSPortalAccess.ready = new Promise(() => {});
if (scenario === 'unassigned') access.courseAllowed = false;
const realFetch = window.fetch.bind(window);
window.fetch = async (url, init) => {
  if (!String(url).includes('.supabase.co/')) return realFetch(url,init);
  fixture.apiCalls.push({url:String(url),method:init.method,authorization:init.headers.Authorization === 'Bearer local-fixture-token',
    credentials:init.credentials,cache:init.cache,redirect:init.redirect,referrerPolicy:init.referrerPolicy});
  init.signal.addEventListener('abort',() => fixture.abortCalls++,{once:true});
  if (scenario === 'network-failure') throw new TypeError('Simulated network failure.');
  if (scenario === 'fetch-timeout' || scenario === 'caller-abort') await new Promise((_,reject) => init.signal.addEventListener('abort',() => reject(init.signal.reason),{once:true}));
  if (scenario.startsWith('fetch-') && scenario.endsWith('-race')) {await delay(10); mutate(scenario.slice(6,-5));}
  let text = JSON.stringify(responseData), body = text;
  if (scenario === 'invalid-json') body = '{';
  if (scenario === 'oversized-body') body = ' '.repeat(2 * 1024 * 1024 + 20000);
  if (scenario === 'body-timeout') body = new ReadableStream({cancel(){fixture.bodyCancelled++;}});
  if (scenario === 'body-token-race') body = new ReadableStream({start(stream) {
    const bytes = new TextEncoder().encode(text); stream.enqueue(bytes.slice(0,20));
    setTimeout(() => {mutate('token'); stream.enqueue(bytes.slice(20)); stream.close();},10);
  },cancel(){fixture.bodyCancelled++;}});
  const response = new Response(body,{status:scenario === 'http-denied'?403:200,headers:{'Content-Type':scenario === 'bad-mime'?'text/html':'application/json',
    ...(scenario === 'oversized-header'?{'Content-Length':'999999999'}:{})}});
  Object.defineProperty(response,'url',{value:scenario === 'response-foreign-url'?'https://foreign.example.test/lesson':String(url)});
  if (scenario === 'redirected') Object.defineProperty(response,'redirected',{value:true});
  return response;
};
fixture.remount = options => mountInstitutionalLesson({root:document.querySelector('#lesson'),lessonId:ids.lesson,classId:ids.class,
  enabled:scenario !== 'disabled',mathEngine:katex,accessTimeoutMs:150,requestTimeoutMs:200,...options});
try {
  const cancel = new AbortController();
  if (scenario === 'caller-abort') setTimeout(() => cancel.abort(),30);
  if (scenario === 'public-entry') {
    const binding = {...responseData.binding,route:location.href.split('#')[0]};
    fixture.controller = await mountLesson({root:document.querySelector('#lesson'),lesson,binding,enabled:true,mathEngine:katex,accessTimeoutMs:150});
  } else fixture.controller = await fixture.remount({signal:cancel.signal});
} catch (error) {fixture.error = error.message;}
fixture.ready = true;
