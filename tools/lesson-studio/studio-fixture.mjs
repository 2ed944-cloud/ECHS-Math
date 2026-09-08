import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import katex from '../lesson-runtime/node_modules/katex/dist/katex.mjs';
import {createLessonHandler,LESSON_API_CONTRACT} from '../../supabase/functions/lesson-api/handler.mjs';

// Original synthetic data only. This fixture exercises the real HTTP handler;
// its in-memory RPC adapter is not evidence of database authorization or RLS.
export const STUDIO_ORIGIN = 'https://echs-studio-fixture.example.test';
export const STUDIO_BASE = STUDIO_ORIGIN + '/ECHS-Math/';
export const STUDIO_API = 'https://studiofixture.supabase.co/functions/v1';
const repository = fileURLToPath(new URL('../../',import.meta.url));
const uuid = number => `50000000-0000-4000-8000-${String(number).padStart(12,'0')}`;
export const STUDIO_IDS = Object.freeze({teacher:uuid(1),admin:uuid(2),student:uuid(3),parent:uuid(4),other:uuid(5),organization:uuid(6),
  otherOrganization:uuid(7),class:uuid(8),otherClass:uuid(9),course:uuid(10),assignment:uuid(11),lesson:uuid(12)});
const clone = value => structuredClone(value);
const tokenFor = role => `synthetic-studio-${role}-token-008`;
const now = '2026-09-08T12:00:00.000Z';
const expires = '2099-01-01T00:00:00.000Z';
const accountFor = role => role === 'guest' ? null : ({id:STUDIO_IDS[role],organization_id:role === 'other' ? STUDIO_IDS.otherOrganization : STUDIO_IDS.organization,
  role:role === 'other' ? 'teacher' : role,status:'active',display_name:`Synthetic ${role}`,username:`fixture-${role}`,organization_name:'Synthetic fixture school'});
const error = (code,message = 'Synthetic fixture rejection.') => ({ok:false,error:{code,message}});
const data = extra => ({ok:true,contract:LESSON_API_CONTRACT,...extra});
const types = {'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.json':'application/json','.css':'text/css','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf','.svg':'image/svg+xml','.png':'image/png'};

export function studioStorageState(role = 'teacher') {
  const account = accountFor(role);
  return {cookies:[],origins:[{origin:STUDIO_ORIGIN,localStorage:account ? [
    {name:'echs_institution_token_v1',value:tokenFor(role)},
    {name:'echs_institution_account_v1',value:JSON.stringify(account)},
    {name:'echs_institution_expires_v1',value:expires}
  ] : []}]};
}

export function createStudioFixture({pinned = true} = {}) {
  const calls = [], rpcCalls = [], external = [], failures = [], holds = [];
  const records = new Map(); let serial = 100;
  const accounts = new Map(['teacher','admin','student','parent','other'].map(role => [createHash('sha256').update(tokenFor(role)).digest('hex'),accountFor(role)]));
  const selectedClass = {id:STUDIO_IDS.class,organization_id:STUDIO_IDS.organization,name:'Fixture AP Calculus AB',course_key:'ap-calculus',status:'active',section:'A',academic_year:'2026-27'};
  const course = {id:STUDIO_IDS.course,course_code:'ap-calculus-ab',record:{title:'AP Calculus AB'},version_key:'fixture-ap-ab-2026-27',status:'active',is_placeholder:false};
  let assignment = pinned ? {id:STUDIO_IDS.assignment,organization_id:STUDIO_IDS.organization,class_id:STUDIO_IDS.class,course_version_id:STUDIO_IDS.course,
    state:'active',assigned_by:STUDIO_IDS.admin,created_at:now,reason:'Original fixture class pin'} : null;
  const catalog = ['1.7','1.8','1.9'].map((topic,index) => ({access_key:`ap-calculus::0::${topic}`,course_key:'ap-calculus',
    title:`Original fixture lesson ${topic}`,route_path:`lessons/ap-calculus/unit-1/lesson-${topic.replace('.','-')}.html`,
    unit_id:'legacy:ap-calculus:unit:1',topic_id:`legacy:ap-calculus:topic:${topic}`,topic,unit_index:0,is_ready:true,position:index}));
  const snapshot = record => data({lesson:clone(record.lesson),head:clone(record.head),
    versions:record.history.map(({document,private_notes,...entry}) => clone(entry)).reverse(),reviews:[],publications:[]});
  const rpc = async (name,args) => {
    const account = accounts.get(args.p_token_hash);
    rpcCalls.push({name,action:args.p_action,lesson_id:args.p_payload?.lesson_id});
    if (name === 'api_session_lookup') return {data:account ? [{account_id:account.id,organization_id:account.organization_id,role:account.role,status:account.status,expires_at:expires}] : [],error:null};
    assert.equal(name,'lesson_store');
    if (!account || !['teacher','admin'].includes(account.role)) return {data:null,error:{code:'42501'}};
    const payload = args.p_payload;
    const actor = {id:account.id,organization_id:account.organization_id,role:account.role};
    if (account.organization_id !== STUDIO_IDS.organization) return {data:args.p_action === 'context' ? data({actor,classes:[]}) : null,error:args.p_action === 'context' ? null : {code:'42501'}};
    if (args.p_action === 'context') return {data:payload.class_id ? data({actor,class:clone(selectedClass),current_assignment:clone(assignment),catalog:clone(catalog),course_versions:[clone(course)]}) :
      data({actor,classes:[{...clone(selectedClass),current_assignment:clone(assignment),course_versions:[clone(course)]}]}),error:null};
    if (args.p_action === 'list') return {data:data({lessons:[...records.values()].map(record => clone(record.lesson))}),error:null};
    if (args.p_action === 'pin_course') {
      if (account.role !== 'admin' || payload.class_id !== selectedClass.id || payload.course_version_id !== course.id) return {data:null,error:{code:'42501'}};
      if (payload.expected_assignment_id !== (assignment?.id || null)) return {data:null,error:{code:'40001'}};
      assignment = {id:uuid(serial++),organization_id:account.organization_id,class_id:selectedClass.id,course_version_id:course.id,state:'active',
        assigned_by:account.id,created_at:now,reason:payload.reason};
      return {data:data({assignment:clone(assignment)}),error:null};
    }
    if (args.p_action === 'create') {
      const binding = catalog.find(item => item.access_key === payload.access_key);
      if (!binding || !assignment || payload.class_id !== selectedClass.id || payload.course_version_id !== assignment.course_version_id) return {data:null,error:{code:'42501'}};
      if ([...records.values()].some(record => record.lesson.access_key === binding.access_key)) return {data:null,error:{code:'23505'}};
      const versionId = uuid(serial++), document = clone(payload.document);
      const head = {id:versionId,lesson_id:document.lesson_id,organization_id:account.organization_id,version_number:1,document,private_notes:payload.private_notes,created_by:account.id,created_at:now};
      const record = {lesson:{id:document.lesson_id,organization_id:account.organization_id,class_id:selectedClass.id,course_version_id:course.id,
        access_key:binding.access_key,legacy_course_key:'ap-calculus',route_path:binding.route_path,unit_id:binding.unit_id,topic_id:binding.topic_id,slug:document.slug,
        created_by:account.id,created_at:now,updated_at:now,head_revision:1,head_version_id:versionId,workflow_state:'draft',
        approved_version_id:null,approved_review_id:null,active_publication_id:null},head,history:[clone(head)]};
      records.set(document.lesson_id,record); return {data:snapshot(record),error:null};
    }
    const record = records.get(payload.lesson_id);
    if (!record) return {data:null,error:{code:'P0002'}};
    if (args.p_action === 'get') return {data:snapshot(record),error:null};
    if (args.p_action === 'save') {
      if (payload.expected_revision !== record.lesson.head_revision) return {data:null,error:{code:'40001'}};
      const revision = record.lesson.head_revision + 1, document = clone(payload.document), versionId = uuid(serial++);
      document.document_version = revision; document.publication = {...document.publication,status:'draft',revision};
      const head = {id:versionId,organization_id:account.organization_id,lesson_id:record.lesson.id,version_number:revision,document,
        private_notes:payload.private_notes,created_by:account.id,created_at:now};
      Object.assign(record.lesson,{head_revision:revision,head_version_id:versionId,workflow_state:'draft'});
      record.head = head; record.history.push(clone(head)); return {data:snapshot(record),error:null};
    }
    throw new Error(`Unexpected Studio008 RPC action: ${args.p_action}`);
  };
  const handler = createLessonHandler({rpc,mathEngine:katex,allowedOrigins:[STUDIO_ORIGIN],siteBase:STUDIO_BASE});
  function actionFor(url,method) {
    if (url.pathname.endsWith('/course-version')) return 'pin_course';
    if (url.pathname.endsWith('/context')) return 'context';
    if (url.pathname.endsWith('/draft')) return 'save';
    if (url.pathname.endsWith('/lessons')) return method === 'POST' ? 'create' : 'list';
    if (/\/lessons\/[0-9a-f-]+$/i.test(url.pathname)) return 'get';
    return 'unknown';
  }
  const routeRequest = async route => {
    const request = route.request(), url = new URL(request.url()), method = request.method();
    if (url.origin === STUDIO_ORIGIN) {
      if (!url.pathname.startsWith('/ECHS-Math/')) {external.push(url.href); return route.abort();}
      const relative = decodeURIComponent(url.pathname.slice('/ECHS-Math/'.length));
      if (relative === 'config/institution.json') return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({enabled:true,api_base:STUDIO_API,site_base:STUDIO_BASE,institution_name:'Synthetic fixture school'})});
      if (relative === '__studio-peer.html' || relative === 'login.html' || /^question-bank\/(?:student|parent|teacher|school-control)\.html$/.test(relative)) {
        return route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><html lang="en"><title>Local fixture destination</title><p>Local fixture destination.</p></html>'});
      }
      const file = path.resolve(repository,relative);
      if (!file.startsWith(path.resolve(repository) + path.sep)) return route.fulfill({status:403,body:''});
      try {return await route.fulfill({status:200,contentType:types[path.extname(file)] || 'application/octet-stream',body:await readFile(file)});}
      catch {return route.fulfill({status:404,body:''});}
    }
    if (url.origin !== new URL(STUDIO_API).origin || !url.pathname.startsWith('/functions/v1/')) {external.push(url.href); return route.abort();}
    if (method === 'OPTIONS') return route.fulfill({status:204,headers:{'access-control-allow-origin':STUDIO_ORIGIN,
      'access-control-allow-methods':'GET, POST, OPTIONS','access-control-allow-headers':'authorization, content-type'}});
    const authorization = request.headers().authorization || '';
    if (url.pathname === '/functions/v1/account-api/me') {
      const role = ['teacher','admin','student','parent','other'].find(role => authorization === `Bearer ${tokenFor(role)}`);
      const account = role ? accountFor(role) : null;
      calls.push({service:'account',action:'me',method,role});
      return route.fulfill({status:account ? 200 : 401,contentType:'application/json',headers:{'cache-control':'no-store','x-content-type-options':'nosniff','access-control-allow-origin':STUDIO_ORIGIN},body:JSON.stringify(account ? {ok:true,account} : error('sign_in_required'))});
    }
    if (!url.pathname.startsWith('/functions/v1/lesson-api/')) {external.push(url.href); return route.abort();}
    const action = actionFor(url,method), body = request.postData();
    calls.push({service:'lesson',action,method,path:url.pathname,query:url.search,body:body ? JSON.parse(body) : undefined});
    const failure = failures.find(item => item.action === action && !item.used);
    const respondFailure = () => {
      failure.used = true;
      if (failure.network) return route.abort('internetdisconnected');
      return route.fulfill({status:failure.status,contentType:'application/json',headers:{'cache-control':'no-store, private','x-content-type-options':'nosniff','access-control-allow-origin':STUDIO_ORIGIN},body:JSON.stringify(error(failure.code))});
    };
    if (failure && !failure.afterCommit) return respondFailure();
    const response = await handler(new Request(url.href,{method,headers:request.headers(),...(body === null ? {} : {body})}));
    const result = await response.text();
    if (failure?.afterCommit) return respondFailure();
    const hold = holds.find(item => item.action === action && !item.used);
    if (hold) {hold.used = true; hold.startedResolve(); await hold.released;}
    try {await route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:result});}
    catch (error) {if (!hold) throw error; /* An aborted old request may outlive its page. */}
  };
  return {
    calls,rpcCalls,external,records,catalog,accountFor,tokenFor,
    async attach(context) {await context.route('**/*',routeRequest);},
    failNext(action,{status=409,code='revision_conflict',network=false,afterCommit=false} = {}) {failures.push({action,status,code,network,afterCommit,used:false});},
    holdNext(action) {
      let startedResolve, release;
      const item = {action,used:false,started:new Promise(resolve => {startedResolve=resolve;}),released:new Promise(resolve => {release=resolve;})};
      item.startedResolve = startedResolve; holds.push(item); return {started:item.started,release};
    },
    latest() {const record = [...records.values()].at(-1); return record ? snapshot(record) : null;},
    advanceServer(change) {
      const record = [...records.values()].at(-1); assert.ok(record,'Create a fixture lesson first.');
      const document = clone(record.head.document); change?.(document); const revision = record.lesson.head_revision + 1;
      document.document_version = revision; document.publication.revision = revision;
      const versionId = uuid(serial++); record.head = {...record.head,id:versionId,version_number:revision,document};
      Object.assign(record.lesson,{head_revision:revision,head_version_id:versionId}); record.history.push(clone(record.head));
    }
  };
}
