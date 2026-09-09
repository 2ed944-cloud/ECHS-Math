import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import katex from '../lesson-runtime/node_modules/katex/dist/katex.mjs';
import {createLessonHandler,LESSON_API_CONTRACT} from '../../supabase/functions/lesson-api/handler.mjs';
import {LESSON_MEDIA_CAPABILITIES} from '../../supabase/functions/lesson-api/media-handler.mjs';

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

export function createStudioFixture({pinned = true, contentV2 = false,media = false,recovery = false,
  referenceCourse = 'ap',referenceVersion = 'current',includeSecondClass = false} = {}) {
  assert.ok(['ap','ib13'].includes(referenceCourse));assert.ok(['current','wrong','future'].includes(referenceVersion));
  const calls = [], rpcCalls = [], external = [], failures = [], holds = [];
  const records = new Map(); let serial = 100;
  const assets=new Map(),assetBytes=new Map();
  const accounts = new Map(['teacher','admin','student','parent','other'].map(role => [createHash('sha256').update(tokenFor(role)).digest('hex'),accountFor(role)]));
  const selectedClass = {id:STUDIO_IDS.class,organization_id:STUDIO_IDS.organization,name:'Fixture AP Calculus AB',course_key:'ap-calculus',status:'active',section:'A',academic_year:'2026-27'};
  const course = {id:STUDIO_IDS.course,course_code:'ap-calculus-ab',record:{title:'AP Calculus AB'},version_key:'fixture-ap-ab-2026-27',status:'active',is_placeholder:false};
  if(referenceCourse==='ib13'){
    Object.assign(selectedClass,{name:'Fixture IB Mathematics AI SL',course_key:'ib-math-ai'});
    Object.assign(course,{id:referenceVersion==='current'?'9a875b4c-61af-5001-9f31-a22044f6f58d':referenceVersion==='future'?'56880c32-495b-5f31-a0aa-b04efa1b34b7':STUDIO_IDS.course,
      course_code:'ib-math-ai-sl',record:{title:'IB Mathematics: Applications and Interpretation SL'},version_key:referenceVersion==='future'?'ib-ai-sl-first-assessment-2029':'ib-ai-sl-first-assessment-2021',
      status:referenceVersion==='future'?'future':'active',is_placeholder:referenceVersion==='future'});
  }
  let assignment = pinned ? {id:STUDIO_IDS.assignment,organization_id:STUDIO_IDS.organization,class_id:STUDIO_IDS.class,course_version_id:course.id,
    state:'active',assigned_by:STUDIO_IDS.admin,created_at:now,reason:'Original fixture class pin'} : null;
  const catalog = ['1.7','1.8','1.9'].map((topic,index) => ({access_key:`ap-calculus::0::${topic}`,course_key:'ap-calculus',
    title:`Original fixture lesson ${topic}`,route_path:`lessons/ap-calculus/unit-1/lesson-${topic.replace('.','-')}.html`,
    unit_id:'legacy:ap-calculus:unit:1',topic_id:`legacy:ap-calculus:topic:${topic}`,topic,unit_index:0,is_ready:true,position:index}));
  if(referenceCourse==='ib13')catalog.splice(0,catalog.length,...[
    ['1.3','Geometric Sequences and Series','IB_AI_SL_1.3_geometric_sequences_ECHS.html',3],
    ['1.4','Financial Models','IB_AI_SL_1.4_financial_models_ECHS.html',4]
  ].map(([topic,title,file,position])=>({access_key:`ib-math-ai::0::${topic}`,course_key:'ib-math-ai',title,
    route_path:`lessons/ib-math-ai/unit-1/lessons/${file}`,unit_id:'legacy:ib-math-ai:unit:1',topic_id:`legacy:ib-math-ai:topic:${topic}`,topic,unit_index:0,is_ready:true,position})));
  const secondClass=includeSecondClass?{...clone(selectedClass),id:STUDIO_IDS.otherClass,name:selectedClass.name+' B',section:'B'}:null;
  const secondAssignment=secondClass&&assignment?{...clone(assignment),id:uuid(13),class_id:secondClass.id}:null;
  const snapshot = record => data({lesson:clone(record.lesson),head:clone(record.head),
    versions:record.history.slice(-25).map(({document,private_notes,...entry}) => clone(entry)).reverse(),
    reviews:clone((record.reviews||[]).slice(-25).reverse()),
    publications:(record.publications||[]).slice(-25).reverse().map(({document,...entry})=>clone(entry))});
  const rpc = async (name,args) => {
    const account = accounts.get(args.p_token_hash);
    rpcCalls.push({name,action:args.p_action,lesson_id:args.p_payload?.lesson_id});
    if (name === 'lesson_content_capabilities') return {data:contentV2 ? {contract:'echs.lesson.authoring.v1',content_version:2,math_expression_version:1,
      blocks:{'rich-text':[1,2],math:[1,2],callout:[1,2],'legacy-embedded':[1]}} : null,error:null};
    if(name==='lesson_media_capabilities')return {data:media?LESSON_MEDIA_CAPABILITIES:null,error:null};
    if(name==='lesson_recovery_capabilities')return {data:recovery?{contract:'echs.lesson.recovery.v1',cipher:'AES-256-GCM',checkpoint_version:1,max_plaintext_bytes:4194304}:null,error:null};
    if(name==='lesson_draft_recovery_key'){
      const record=records.get(args.p_payload?.lesson_id);
      if(!recovery||!record||!account||!['teacher','admin'].includes(account.role)||account.organization_id!==record.lesson.organization_id)return {data:null,error:{code:'42501'}};
      return {data:{ok:true,contract:'echs.lesson.recovery.v1',account_id:account.id,organization_id:account.organization_id,class_id:record.lesson.class_id,lesson_id:record.lesson.id,key_id:uuid(900),key_base64:createHash('sha256').update('synthetic-recovery-key:'+account.id+':'+record.lesson.id).digest('base64')},error:null};
    }
    if (name === 'api_session_lookup') return {data:account ? [{account_id:account.id,organization_id:account.organization_id,role:account.role,status:account.status,expires_at:expires}] : [],error:null};
    if(name==='lesson_asset_store'){
      const p=args.p_payload,record=records.get(p.lesson_id);
      if(!media||!record||!account||!['teacher','admin'].includes(account.role)||account.organization_id!==record.lesson.organization_id)return {data:null,error:{code:'42501'}};
      let asset=assets.get(p.asset_id);
      const envelope={ok:true,contract:'echs.lesson.assets.v1',lesson_id:p.lesson_id,organization_id:account.organization_id,class_id:record.lesson.class_id,account_id:account.id};
      if(args.p_action==='list')return {data:{...envelope,assets:[...assets.values()].filter(a=>a.lesson_id===p.lesson_id&&a.state==='ready').map(clone)},error:null};
      if(args.p_action==='reserve'){
        if(asset){if(asset.lesson_id!==p.lesson_id||asset.uploaded_by!==account.id||asset.sha256!==p.sha256)return {data:null,error:{code:'40001'}};}
        else{asset={...clone(p),id:p.asset_id,organization_id:account.organization_id,class_id:record.lesson.class_id,uploaded_by:account.id,state:'pending'};assets.set(asset.id,asset);}
      }else if(!asset||asset.lesson_id!==p.lesson_id)return {data:null,error:{code:'P0002'}};
      if(args.p_action==='finalize'){if(!assetBytes.has(asset.id))return {data:null,error:{code:'23514'}};asset.state='ready';}
      if(args.p_action==='read'&&asset.state!=='ready')return {data:null,error:{code:'P0002'}};
      return {data:{...envelope,asset:clone(asset),reused:false},error:null};
    }
    assert.equal(name,'lesson_store');
    if (!account || !['teacher','admin'].includes(account.role)) return {data:null,error:{code:'42501'}};
    const payload = args.p_payload;
    const actor = {id:account.id,organization_id:account.organization_id,role:account.role};
    if (account.organization_id !== STUDIO_IDS.organization) return {data:args.p_action === 'context' ? data({actor,classes:[]}) : null,error:args.p_action === 'context' ? null : {code:'42501'}};
    const scopeClass=secondClass&&payload.class_id===secondClass.id?secondClass:selectedClass;
    const scopeAssignment=scopeClass===secondClass?secondAssignment:assignment;
    if(['context','list','create'].includes(args.p_action)&&payload.class_id&&![selectedClass.id,secondClass?.id].includes(payload.class_id))return {data:null,error:{code:'42501'}};
    if (args.p_action === 'context') return {data:payload.class_id ? data({actor,class:clone(scopeClass),current_assignment:clone(scopeAssignment),catalog:clone(catalog),course_versions:[clone(course)]}) :
      data({actor,classes:[{...clone(selectedClass),current_assignment:clone(assignment),course_versions:[clone(course)]},...(secondClass?[{...clone(secondClass),current_assignment:clone(secondAssignment),course_versions:[clone(course)]}]:[])]}),error:null};
    if (args.p_action === 'list') return {data:data({lessons:[...records.values()].filter(record=>record.lesson.class_id===scopeClass.id).map(record => clone(record.lesson))}),error:null};
    if (args.p_action === 'pin_course') {
      if (account.role !== 'admin' || payload.class_id !== selectedClass.id || payload.course_version_id !== course.id) return {data:null,error:{code:'42501'}};
      if (payload.expected_assignment_id !== (assignment?.id || null)) return {data:null,error:{code:'40001'}};
      assignment = {id:uuid(serial++),organization_id:account.organization_id,class_id:selectedClass.id,course_version_id:course.id,state:'active',
        assigned_by:account.id,created_at:now,reason:payload.reason};
      return {data:data({assignment:clone(assignment)}),error:null};
    }
    if (args.p_action === 'create') {
      const binding = catalog.find(item => item.access_key === payload.access_key);
      if (!binding || !scopeAssignment || payload.class_id !== scopeClass.id || payload.course_version_id !== scopeAssignment.course_version_id) return {data:null,error:{code:'42501'}};
      if ([...records.values()].some(record => record.lesson.class_id===scopeClass.id&&record.lesson.access_key === binding.access_key)) return {data:null,error:{code:'23505'}};
      const versionId = uuid(serial++), document = clone(payload.document);
      const head = {id:versionId,lesson_id:document.lesson_id,organization_id:account.organization_id,version_number:1,document,private_notes:payload.private_notes,created_by:account.id,created_at:now,restored_from_version_id:null};
      const record = {lesson:{id:document.lesson_id,organization_id:account.organization_id,class_id:scopeClass.id,course_version_id:course.id,
        access_key:binding.access_key,legacy_course_key:scopeClass.course_key,route_path:binding.route_path,unit_id:binding.unit_id,topic_id:binding.topic_id,slug:document.slug,
        created_by:account.id,created_at:now,updated_at:now,head_revision:1,head_version_id:versionId,workflow_state:'draft',
        approved_version_id:null,approved_review_id:null,active_publication_id:null},head,history:[clone(head)],reviews:[],publications:[]};
      records.set(document.lesson_id,record); return {data:snapshot(record),error:null};
    }
    const record = records.get(payload.lesson_id);
    if (!record) return {data:null,error:{code:'P0002'}};
    if (args.p_action === 'get') return {data:snapshot(record),error:null};
    if(args.p_action==='history'){
      const rows=record.history.filter(v=>v.version_number<(payload.before_version||Infinity)).reverse(),limit=payload.limit||25;
      const versions=rows.slice(0,limit).map(({document,private_notes,...entry})=>clone(entry));
      return {data:data({versions,next_before_version:rows.length>limit?versions.at(-1).version_number:null}),error:null};
    }
    if(args.p_action==='version'){
      const version=record.history.find(v=>v.id===payload.version_id);
      return version?{data:data({lesson:clone(record.lesson),version:clone(version)}),error:null}:{data:null,error:{code:'P0002'}};
    }
    if (args.p_action === 'save'||args.p_action==='restore') {
      if (payload.expected_revision !== record.lesson.head_revision) return {data:null,error:{code:'40001'}};
      const source=args.p_action==='restore'?record.history.find(v=>v.id===payload.version_id):null;
      if(args.p_action==='restore'&&!source)return {data:null,error:{code:'P0002'}};
      const revision = record.lesson.head_revision + 1, document = clone(source?.document||payload.document), versionId = uuid(serial++);
      document.document_version = revision; document.publication = {...document.publication,status:'draft',revision};
      const head = {id:versionId,organization_id:account.organization_id,lesson_id:record.lesson.id,version_number:revision,document,
        private_notes:source?source.private_notes:payload.private_notes,created_by:account.id,created_at:now,restored_from_version_id:source?.id||null};
      Object.assign(record.lesson,{head_revision:revision,head_version_id:versionId,workflow_state:'draft',approved_version_id:null,approved_review_id:null});
      record.head = head; record.history.push(clone(head)); return {data:snapshot(record),error:null};
    }
    if(['request_review','approve','publish','unpublish'].includes(args.p_action)){
      if(payload.expected_revision!==record.lesson.head_revision)return {data:null,error:{code:'40001'}};
      const reject=code=>({data:null,error:{code}}),action=args.p_action,head=record.head,lesson=record.lesson;
      if(action==='request_review'&&lesson.workflow_state!=='draft')return reject('23514');
      if(action==='approve'){
        if(payload.validated_version_id!==head.id)return reject('40001');
        if(lesson.workflow_state!=='review')return reject('23514');
        if([lesson.created_by,head.created_by].includes(account.id))return reject('42501');
        if(!['curriculum','mathematics','accessibility','rights','student_safe'].every(k=>payload.checks?.[k]===true))return reject('22023');
      }
      if(action==='publish'&&(lesson.workflow_state!=='approved'||lesson.approved_version_id!==head.id||payload.validated_version_id!==head.id||!assignment||assignment.course_version_id!==lesson.course_version_id))return reject('23514');
      if(['approve','publish'].includes(action)&&head.document.slides.some(s=>s.blocks.some(b=>b.type==='legacy-embedded')))return reject('23514');
      if(action==='unpublish'&&!lesson.active_publication_id)return reject('23514');
      const revision=lesson.head_revision+1,eventId=uuid(serial++),base={id:eventId,organization_id:lesson.organization_id,lesson_id:lesson.id,revision,actor_id:account.id,created_at:now};
      if(action==='request_review'||action==='approve'){
        record.reviews.push({...base,version_id:head.id,event_type:action==='approve'?'approved':'requested',checks:action==='approve'?clone(payload.checks):null,comment:payload.comment||''});
        lesson.workflow_state=action==='approve'?'approved':'review';
        if(action==='approve')Object.assign(lesson,{approved_version_id:head.id,approved_review_id:eventId});
      }else if(action==='publish'){
        const document=clone(head.document);document.publication={status:'published',audience:'institutional',revision};
        record.publications.push({...base,source_version_id:head.id,event_type:'published',document,reason:''});
        Object.assign(lesson,{workflow_state:'published',active_publication_id:eventId});
      }else{
        const prior=record.publications.find(p=>p.id===lesson.active_publication_id);
        record.publications.push({...base,source_version_id:prior.source_version_id,event_type:'unpublished',document:null,reason:payload.reason.trim()});
        Object.assign(lesson,{workflow_state:'draft',active_publication_id:null,approved_version_id:null,approved_review_id:null});
      }
      lesson.head_revision=revision;return {data:snapshot(record),error:null};
    }
    throw new Error(`Unexpected Studio RPC action: ${args.p_action}`);
  };
  const assetStorage=media?{
    async put({scope,bytes}){if(assetBytes.has(scope.asset_id))throw new Error('Immutable fixture asset.');assetBytes.set(scope.asset_id,bytes.slice());},
    async get({scope}){if(!assetBytes.has(scope.asset_id))throw new Error('Missing fixture bytes.');return assetBytes.get(scope.asset_id).slice();},
    async removeTemporary({scope}){assert.equal(assets.get(scope.asset_id)?.state,'cleanup');assetBytes.delete(scope.asset_id);}
  }:undefined;
  const handler = createLessonHandler({rpc,mathEngine:katex,allowedOrigins:[STUDIO_ORIGIN],siteBase:STUDIO_BASE,assetStorage});
  function actionFor(url,method) {
    if(url.pathname.endsWith('/history'))return 'history';
    if(/\/versions\/[0-9a-f-]+$/.test(url.pathname))return 'version';
    for(const action of ['restore','request-review','approve','publish','unpublish'])if(url.pathname.endsWith('/'+action))return action.replace('-','_');
    if(url.pathname.endsWith('/recovery-key'))return 'recovery_key';
    if(/\/assets\/[0-9a-f-]+\/bytes$/.test(url.pathname))return 'asset_bytes';
    if(/\/assets\/[0-9a-f-]+$/.test(url.pathname))return 'asset_read';
    if(url.pathname.endsWith('/assets'))return method==='POST'?'asset_upload':'asset_list';
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
      'access-control-allow-methods':'GET, POST, OPTIONS','access-control-allow-headers':'authorization, content-type, x-echs-asset-id, x-echs-asset-name'}});
    const authorization = request.headers().authorization || '';
    if (url.pathname === '/functions/v1/account-api/me') {
      const role = ['teacher','admin','student','parent','other'].find(role => authorization === `Bearer ${tokenFor(role)}`);
      const account = role ? accountFor(role) : null;
      calls.push({service:'account',action:'me',method,role});
      return route.fulfill({status:account ? 200 : 401,contentType:'application/json',headers:{'cache-control':'no-store','x-content-type-options':'nosniff','access-control-allow-origin':STUDIO_ORIGIN},body:JSON.stringify(account ? {ok:true,account} : error('sign_in_required'))});
    }
    if (!url.pathname.startsWith('/functions/v1/lesson-api/')) {external.push(url.href); return route.abort();}
    const action = actionFor(url,method), body = request.postDataBuffer();
    calls.push({service:'lesson',action,method,path:url.pathname,query:url.search,body:body&&action!=='asset_upload' ? JSON.parse(body.toString()) : undefined});
    const failure = failures.find(item => item.action === action && !item.used);
    const respondFailure = async () => {
      failure.used = true;
      const held=holds.find(item=>item.action===action&&!item.used);
      if(held){held.used=true;held.startedResolve();await held.released;}
      if (failure.network) return route.abort('internetdisconnected');
      return route.fulfill({status:failure.status,contentType:'application/json',headers:{'cache-control':'no-store, private','x-content-type-options':'nosniff','access-control-allow-origin':STUDIO_ORIGIN},body:JSON.stringify(error(failure.code))});
    };
    if (failure && !failure.afterCommit) return respondFailure();
    const response = await handler(new Request(url.href,{method,headers:request.headers(),...(body === null ? {} : {body})}));
    const result = Buffer.from(await response.arrayBuffer());
    if (failure?.afterCommit) return respondFailure();
    const hold = holds.find(item => item.action === action && !item.used);
    if (hold) {hold.used = true; hold.startedResolve(); await hold.released;}
    try {await route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:result});}
    catch (error) {if (!hold) throw error; /* An aborted old request may outlive its page. */}
  };
  return {
    calls,rpcCalls,external,records,catalog,accountFor,tokenFor,assets,assetBytes,
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
      const versionId = uuid(serial++); record.head = {...record.head,id:versionId,version_number:revision,document,restored_from_version_id:null};
      Object.assign(record.lesson,{head_revision:revision,head_version_id:versionId,workflow_state:'draft',approved_version_id:null,approved_review_id:null}); record.history.push(clone(record.head));
    }
  };
}
