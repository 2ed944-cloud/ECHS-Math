import { assertLessonDocument } from '../lesson-runtime/schema.mjs';

export const STUDIO_API_CONTRACT = 'echs.lesson.store.v1';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TOKEN = /^[^\s]{16,2048}$/;
const MAX_DOCUMENT = 1024 * 1024;
const MAX_REQUEST = MAX_DOCUMENT + 128 * 1024;
const MAX_RESPONSE = 2 * 1024 * 1024;
const encoder = new TextEncoder();
const own = (value,key) => Object.prototype.hasOwnProperty.call(value,key);
const copy = value => structuredClone(value);
const roles = new Set(['teacher','admin']);
const families = new Set(['ap-calculus','ap-precalculus','ib-math-ai']);
const courseCodes = new Set(['ap-calculus-ab','ap-calculus-bc','ap-precalculus','ib-math-ai-sl']);
const KEYS = {token:'echs_institution_token_v1',expires:'echs_institution_expires_v1'};

export class StudioClientError extends Error {
  constructor(code,status=0,message='Lesson Studio could not complete this request.') {
    super(message);this.name='StudioClientError';this.code=code;this.status=status;
  }
}
const failure = (code,status=0) => new StudioClientError(code,status,({
  session_changed:'Your account session changed. Reopen Lesson Studio.',
  session_expired:'Your school session expired. Sign in again.',
  route_changed:'The lesson workspace address changed. Reopen Lesson Studio.',
  sign_in_required:'Sign in with an active teacher or administrator account.',
  authorization_changed:'Your account no longer has Lesson Studio access.',
  configuration_changed:'The school connection changed. Reopen Lesson Studio.',
  invalid_configuration:'Lesson Studio requires the configured secure school connection.',
  invalid_response:'The lesson service returned an invalid response.',
  invalid_request:'The lesson request is invalid.',
  revision_conflict:'The lesson changed. Reload before saving again.',
  lesson_unavailable:'This lesson or class is unavailable to your account.',
  invalid_transition:'The current lesson state does not permit that operation.',
  timeout:'The lesson request timed out. Check its saved state before retrying.',
  aborted:'The lesson request was cancelled.',
  network_error:'The lesson service could not be reached. Check its saved state before retrying.',
  disposed:'This Lesson Studio session has closed.',
  not_initialized:'Lesson Studio has not verified your session yet.'
})[code]);
function requireValue(condition,code='invalid_response'){if(!condition)throw failure(code);}
function object(value){return value!==null&&typeof value==='object'&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype;}
function text(value,max,empty=false){return typeof value==='string'&&value.length<=max&&(empty||value.trim().length>0)&&!value.includes('\0');}
function integer(value,min=1,max=2147483647){return Number.isInteger(value)&&value>=min&&value<=max;}
function identifier(value,code='invalid_request'){requireValue(typeof value==='string'&&UUID.test(value),code);return value;}
function shape(value,allowed,required=allowed){requireValue(object(value)&&required.every(key=>own(value,key))&&Object.keys(value).every(key=>allowed.includes(key)),'invalid_request');}
function revision(value){requireValue(integer(value,1,2147483646),'invalid_request');return value;}
function safeJSON(value,depth=0){
  requireValue(depth<=32);
  if(value===null||['string','boolean'].includes(typeof value))return;
  if(typeof value==='number'){requireValue(Number.isFinite(value));return;}
  requireValue(Array.isArray(value)||object(value));
  for(const [key,child] of Object.entries(value)){
    requireValue(!['__proto__','prototype','constructor','toJSON'].includes(key));safeJSON(child,depth+1);
  }
}

/** In-memory, account-owned client. SQL remains the authority for every scope. */
export function createStudioClient({window:win=globalThis.window,institution=win?.ECHSInstitution,fetch:fetchImpl=win?.fetch?.bind(win),timeoutMs=10000,onInvalidSession=()=>{},mathEngine}={}) {
  if(!win||typeof fetchImpl!=='function'||!institution||!['token','account','config','me'].every(key=>typeof institution[key]==='function'))throw new TypeError('Existing school session and browser dependencies are required.');
  if(!mathEngine||mathEngine.version!=='0.16.27'||typeof mathEngine.renderToString!=='function')throw new TypeError('Pinned KaTeX 0.16.27 is required.');
  if(!integer(timeoutMs,1,30000)||typeof onInvalidSession!=='function')throw new TypeError('A bounded timeout and session callback are required.');
  let owner=null,verified=null,configuration=null,initialized=false,closed=false,invalid=null,initializing=null,guardTimer=null;
  const controllers=new Set(),bindings=new Map(),listeners=[];

  function snapshot(){
    try {
      const account=institution.account(),token=institution.token();
      requireValue(object(account)&&UUID.test(account.id||'')&&UUID.test(account.organization_id||'')&&roles.has(account.role)&&account.status==='active'&&TOKEN.test(token||''),'sign_in_required');
      let expires='';
      for(const store of [win.localStorage,win.sessionStorage])if(store?.getItem(KEYS.token)===token){expires=store.getItem(KEYS.expires)||'';break;}
      requireValue(Number.isFinite(Date.parse(expires))&&Date.parse(expires)>Date.now(),'session_expired');
      const page=new URL(win.location.href);page.hash='';
      return {token,id:account.id,organization_id:account.organization_id,role:account.role,status:account.status,route:page.href};
    } catch(error){throw error instanceof StudioClientError?error:failure('sign_in_required');}
  }
  const same = (a,b) => a&&b&&['token','id','organization_id','role','status','route'].every(key=>a[key]===b[key]);
  function invalidate(error,clearOwn=false){
    if(invalid||closed)return;
    invalid=error;initialized=false;verified=null;bindings.clear();clearInterval(guardTimer);guardTimer=null;
    if(clearOwn&&owner){
      try {if(same(owner,snapshot()))institution.clearSession?.();}catch{}
    }
    for(const controller of controllers)controller.abort(error);
    try {onInvalidSession(error);}catch{}
  }
  function assertOwner(){
    if(closed)throw failure('disposed');if(invalid)throw invalid;
    let now;
    try {now=snapshot();}catch(error){invalidate(error);throw error;}
    if(!same(owner,now)){const error=failure(owner?.route!==now.route?'route_changed':'session_changed',401);invalidate(error);throw error;}
  }
  function assertCurrent(){if(closed)throw failure('disposed');if(invalid)throw invalid;if(!owner)throw failure('not_initialized');assertOwner();if(!initialized)throw failure('not_initialized');return copy(verified);}
  function listen(target,name,handler){target?.addEventListener?.(name,handler);listeners.push(()=>target?.removeEventListener?.(name,handler));}
  function startListeners(){
    if(listeners.length)return;
    const check=()=>{try {assertOwner();}catch{}};
    listen(win,'storage',check);listen(win,'focus',check);listen(win,'popstate',check);listen(win.document,'visibilitychange',check);
    listen(win.document,'echs:institution-signed-out',()=>invalidate(failure('sign_in_required',401)));
    listen(win.document,'echs:institution-auth-error',()=>invalidate(failure('authorization_changed',403)));
    listen(win,'pagehide',()=>dispose());
    // localStorage changes in this window do not emit a storage event here.
    // Observe the canonical client without replacing any of its methods.
    guardTimer=setInterval(check,200);
  }
  function configValue(raw){
    requireValue(object(raw)&&raw.enabled===true&&!raw.configuration_error,'invalid_configuration');
    let api,site,current;
    try {api=new URL(raw.api_base);site=new URL(raw.site_base);current=new URL(win.location.href);}catch{throw failure('invalid_configuration');}
    requireValue(api.protocol==='https:'&&/^[a-z0-9]+\.supabase\.co$/.test(api.hostname)&&!api.port&&!api.username&&!api.password&&api.pathname==='/functions/v1'&&!api.search&&!api.hash,'invalid_configuration');
    requireValue(site.protocol==='https:'&&site.origin===current.origin&&site.pathname==='/ECHS-Math/'&&!site.username&&!site.password&&!site.search&&!site.hash&&current.pathname.startsWith(site.pathname),'invalid_configuration');
    return {api:api.href,site:site.href,origin:site.origin};
  }
  async function checkConfiguration(signal){
    const next=configValue(await institution.config());check(signal);
    if(configuration&&(next.api!==configuration.api||next.site!==configuration.site)){const error=failure('configuration_changed');invalidate(error);throw error;}
    return next;
  }
  function check(signal){if(signal?.aborted)throw signal.reason instanceof StudioClientError?signal.reason:failure('aborted');assertOwner();}
  async function bounded(work,signal){
    const controller=new AbortController();controllers.add(controller);
    let rejectAbort;
    const aborted=new Promise((_,reject)=>{rejectAbort=reject;});
    const stop=()=>rejectAbort(controller.signal.reason instanceof StudioClientError?controller.signal.reason:failure('aborted'));
    controller.signal.addEventListener('abort',stop,{once:true});
    const external=()=>controller.abort(failure('aborted'));
    signal?.addEventListener('abort',external,{once:true});
    if(signal?.aborted)external();
    const timer=setTimeout(()=>controller.abort(failure('timeout')),timeoutMs);
    try {return await Promise.race([Promise.resolve().then(()=>{check(controller.signal);return work(controller.signal);}),aborted]);}
    finally{clearTimeout(timer);signal?.removeEventListener('abort',external);controller.signal.removeEventListener('abort',stop);controllers.delete(controller);}
  }
  async function initialize(options={}){
    if(closed)throw failure('disposed');if(invalid)throw invalid;if(initialized){assertCurrent();return client;}if(initializing)return initializing;
    try {owner=snapshot();}catch(error){invalidate(error);throw error;}
    startListeners();
    initializing=bounded(async signal=>{
      configuration=await checkConfiguration(signal);check(signal);
      const account=await institution.me(true);check(signal);
      requireValue(object(account)&&account.id===owner.id&&account.organization_id===owner.organization_id&&account.role===owner.role&&account.status==='active','sign_in_required');
      await checkConfiguration(signal);check(signal);
      verified={id:account.id,organization_id:account.organization_id,role:account.role,status:account.status};
      if(text(account.display_name,240,true))verified.display_name=account.display_name;
      initialized=true;return client;
    },options.signal).catch(error=>{
      if(error?.status===401||['sign_in_required','session_expired','session_changed'].includes(error?.code))invalidate(failure(error.code||'sign_in_required',401),error?.status===401||error?.code==='sign_in_required');
      throw error;
    }).finally(()=>{initializing=null;});
    return initializing;
  }

  function localRoute(route){
    requireValue(text(route,400)&&/^lessons\/([A-Za-z0-9][A-Za-z0-9._-]*\/)*[A-Za-z0-9][A-Za-z0-9._-]*\.html$/.test(route));
    const parsed=new URL(route,configuration.site);requireValue(parsed.origin===configuration.origin&&parsed.href.startsWith(configuration.site));return route;
  }
  function accountScope(value){requireValue(object(value)&&value.id===owner.id&&value.organization_id===owner.organization_id&&value.role===owner.role);}
  function assignment(value,classId){
    if(value===null)return;
    requireValue(object(value)&&UUID.test(value.id||'')&&value.organization_id===owner.organization_id&&value.class_id===classId&&UUID.test(value.course_version_id||'')&&UUID.test(value.assigned_by||'')&&value.state==='active');
  }
  function courses(rows){requireValue(Array.isArray(rows)&&rows.length<=100);const ids=new Set();for(const row of rows){requireValue(object(row)&&UUID.test(row.id||'')&&!ids.has(row.id)&&courseCodes.has(row.course_code)&&row.status==='active'&&row.is_placeholder===false&&text(row.version_key,200));ids.add(row.id);}}
  function metadata(row,expectedId,expectedClass){
    requireValue(object(row)&&UUID.test(row.id||'')&&(!expectedId||row.id===expectedId)&&row.organization_id===owner.organization_id&&UUID.test(row.class_id||'')&&(!expectedClass||row.class_id===expectedClass)&&UUID.test(row.course_version_id||'')&&text(row.access_key,400)&&text(row.unit_id,160)&&text(row.topic_id,160)&&integer(row.head_revision)&&UUID.test(row.head_version_id||'')&&['draft','review','approved','published'].includes(row.workflow_state)&&(row.active_publication_id===null||UUID.test(row.active_publication_id||'')));
    localRoute(row.route_path);
    if(own(row,'slug'))requireValue(text(row.slug,160));
    const binding=Object.fromEntries(['id','organization_id','class_id','course_version_id','access_key','route_path','unit_id','topic_id',...(own(row,'slug')?['slug']:[])].map(key=>[key,row[key]]));
    const known=bindings.get(row.id);if(known)requireValue(Object.keys(known).every(key=>binding[key]===known[key]));
    return binding;
  }
  function draft(document,binding,versionNumber,code='invalid_response'){
    try {
      assertLessonDocument(document,{mathEngine});
      requireValue(encoder.encode(JSON.stringify(document)).length<=MAX_DOCUMENT,code);
      requireValue(document.lesson_id===binding.id&&document.course_version_id===binding.course_version_id&&document.unit_id===binding.unit_id&&document.topic_id===binding.topic_id&&(!binding.slug||document.slug===binding.slug)&&document.document_version===versionNumber&&document.publication.status==='draft'&&document.publication.audience==='institutional'&&document.publication.revision===versionNumber,code);
    } catch(error){throw failure(code);}
  }
  function versionRow(row,lesson,full){
    requireValue(object(row)&&UUID.test(row.id||'')&&row.organization_id===owner.organization_id&&row.lesson_id===lesson.id&&integer(row.version_number));
    if(full){requireValue(text(row.private_notes,20000,true));draft(row.document,lesson,row.version_number);}
    else requireValue(!own(row,'document')&&!own(row,'private_notes'));
  }
  function validateResponse(data,action,args){
    safeJSON(data);requireValue(object(data)&&data.ok===true&&data.contract===STUDIO_API_CONTRACT);
    const learned=[];
    if(action==='context'){
      accountScope(data.actor);
      if(args.class_id){
        requireValue(object(data.class)&&data.class.id===args.class_id&&data.class.organization_id===owner.organization_id&&data.class.status==='active'&&text(data.class.name,240));
        assignment(data.current_assignment,args.class_id);courses(data.course_versions);
        requireValue(Array.isArray(data.catalog)&&data.catalog.length<=3000);
        const keys=new Set();for(const row of data.catalog){
          requireValue(object(row)&&families.has(row.course_key)&&integer(row.unit_index,0,100)&&text(row.topic,200)&&text(row.title,500)&&row.access_key===`${row.course_key}::${row.unit_index}::${row.topic}`&&!keys.has(row.access_key)&&row.unit_id===`legacy:${row.course_key}:unit:${row.unit_index+1}`&&text(row.topic_id,160)&&row.topic_id.startsWith(`legacy:${row.course_key}:topic`)&&typeof row.is_ready==='boolean');localRoute(row.route_path);keys.add(row.access_key);
        }
      } else {
        requireValue(Array.isArray(data.classes)&&data.classes.length<=1000);const ids=new Set();
        for(const row of data.classes){requireValue(object(row)&&UUID.test(row.id||'')&&!ids.has(row.id)&&text(row.name,240)&&text(row.course_key,100));assignment(row.current_assignment,row.id);courses(row.course_versions);ids.add(row.id);}
      }
    } else if(action==='pin_course'){
      assignment(data.assignment,args.class_id);requireValue(data.assignment?.course_version_id===args.course_version_id&&data.assignment?.assigned_by===owner.id);
    } else if(action==='list'){
      requireValue(Array.isArray(data.lessons)&&data.lessons.length<=3000);const ids=new Set();for(const row of data.lessons){requireValue(!ids.has(row.id));learned.push(metadata(row,null,args.class_id));ids.add(row.id);}
    } else if(action==='history'){
      requireValue(Array.isArray(data.versions)&&data.versions.length<=(args.limit||25)&&(data.next_before_version===null||integer(data.next_before_version)));
      const ids=new Set();let previous=args.before_version||Infinity;
      for(const row of data.versions){versionRow(row,{id:args.lesson_id},false);requireValue(!ids.has(row.id)&&row.version_number<previous);ids.add(row.id);previous=row.version_number;}
      if(data.next_before_version!==null)requireValue(data.versions.length>0&&data.next_before_version===data.versions.at(-1).version_number);
    } else {
      const binding=metadata(data.lesson,action==='create'?args.document.lesson_id:args.lesson_id,action==='create'?args.class_id:undefined);learned.push(binding);
      if(action==='create')requireValue(binding.course_version_id===args.course_version_id&&binding.access_key===args.access_key&&data.lesson.head_revision===1);
      else if(!['get','version'].includes(action))requireValue(data.lesson.head_revision===args.expected_revision+1);
      if(action==='version'){versionRow(data.version,binding,true);requireValue(data.version.id===args.version_id);}
      else {
        versionRow(data.head,binding,true);requireValue(data.head.id===data.lesson.head_version_id&&data.head.version_number<=data.lesson.head_revision);
        for(const key of ['versions','reviews','publications'])requireValue(Array.isArray(data[key])&&data[key].length<=25);
        for(const row of data.versions)versionRow(row,binding,false);
        for(const key of ['reviews','publications'])for(const row of data[key])requireValue(object(row)&&UUID.test(row.id||'')&&row.organization_id===owner.organization_id&&row.lesson_id===binding.id&&integer(row.revision)&&!own(row,'document')&&!own(row,'private_notes'));
        if(['create','save','restore','unpublish'].includes(action))requireValue(data.lesson.workflow_state==='draft');
        if(action==='request_review')requireValue(data.lesson.workflow_state==='review');
        if(action==='approve')requireValue(data.lesson.workflow_state==='approved');
        if(action==='publish')requireValue(data.lesson.workflow_state==='published'&&UUID.test(data.lesson.active_publication_id||''));
        if(action==='unpublish')requireValue(data.lesson.active_publication_id===null);
        if(['create','save','restore'].includes(action))requireValue(data.head.version_number===data.lesson.head_revision);
      }
    }
    return learned;
  }
  async function readResponse(response,signal){
    const declared=response.headers.get('content-length');
    requireValue(declared===null||(/^\d+$/.test(declared)&&Number(declared)<=MAX_RESPONSE));
    // Content-Type and Cache-Control are CORS-safelisted response headers.
    // The deployed API also sends nosniff, but does not expose that header to
    // cross-origin JavaScript; the browser enforces it independently.
    requireValue(/^application\/json(?:\s*;.*)?$/i.test(response.headers.get('content-type')||'')&&/\bno-store\b/i.test(response.headers.get('cache-control')||'')&&/\bprivate\b/i.test(response.headers.get('cache-control')||''));
    const reader=response.body?.getReader();requireValue(reader);const chunks=[];let size=0;
    const cancel=()=>{reader.cancel().catch(()=>{});};signal.addEventListener('abort',cancel,{once:true});
    try {
      while(true){const {value,done}=await reader.read();check(signal);if(done)break;size+=value.byteLength;requireValue(size<=MAX_RESPONSE);chunks.push(value);}
      const bytes=new Uint8Array(size);let offset=0;for(const part of chunks){bytes.set(part,offset);offset+=part.byteLength;}
      try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{throw failure('invalid_response');}
    } finally{signal.removeEventListener('abort',cancel);reader.cancel().catch(()=>{});reader.releaseLock();}
  }
  async function request(action,path,args,method='GET',options={}){
    assertCurrent();const requestOwner=owner;
    return bounded(async signal=>{
      await checkConfiguration(signal);check(signal);
      const url=configuration.api+'/lesson-api'+path;
      const payload=copy(args);
      if(action!=='create'){delete payload.lesson_id;if(action==='pin_course')delete payload.class_id;}
      const body=method==='POST'?JSON.stringify(payload):undefined;
      requireValue(body===undefined||encoder.encode(body).length<=MAX_REQUEST,'invalid_request');
      let response;
      try {response=await fetchImpl(url,{method,mode:'cors',credentials:'omit',redirect:'error',cache:'no-store',referrerPolicy:'no-referrer',signal,
        headers:{accept:'application/json',authorization:'Bearer '+requestOwner.token,...(body===undefined?{}:{'content-type':'application/json'})},...(body===undefined?{}:{body})});}
      catch(error){check(signal);throw failure('network_error');}
      check(signal);requireValue(!response.redirected&&response.url===url);
      if(response.status===401){const error=failure('sign_in_required',401);invalidate(error,true);throw error;}
      if(response.status===403){const error=failure('authorization_changed',403);invalidate(error);throw error;}
      const data=await readResponse(response,signal);check(signal);
      if(!response.ok){
        const codes={404:'lesson_unavailable',409:'revision_conflict',422:'invalid_request',400:'invalid_request',413:'invalid_request',415:'invalid_request',503:'network_error'};
        const code=response.status===409&&data?.error?.code==='invalid_transition'?'invalid_transition':codes[response.status]||'network_error';throw failure(code,response.status);
      }
      requireValue(response.status===(action==='create'?201:200));
      const learned=validateResponse(data,action,args);check(signal);
      for(const binding of learned)bindings.set(binding.id,binding);
      return copy(data);
    },options.signal);
  }
  function documentBody(body,create=false){
    shape(body,create?['class_id','course_version_id','access_key','expected_revision','document','private_notes']:['expected_revision','document','private_notes']);
    requireValue(text(body.private_notes,20000,true),'invalid_request');
    if(create){identifier(body.class_id);identifier(body.course_version_id);requireValue(text(body.access_key,400)&&body.expected_revision===0,'invalid_request');}
    else revision(body.expected_revision);
    try {assertLessonDocument(body.document,{mathEngine});requireValue(encoder.encode(JSON.stringify(body.document)).length<=MAX_DOCUMENT&&body.document.publication.status==='draft'&&body.document.publication.audience==='institutional','invalid_request');}catch{throw failure('invalid_request');}
  }
  const pathFor=id=>'/lessons/'+identifier(id);
  const post=(action,suffix,id,body,options)=>request(action,pathFor(id)+suffix,{lesson_id:id,...body},'POST',options);
  function dispose(){if(closed)return;closed=true;initialized=false;verified=null;owner=null;configuration=null;bindings.clear();clearInterval(guardTimer);guardTimer=null;for(const controller of controllers)controller.abort(failure('disposed'));for(const remove of listeners.splice(0))remove();}
  const client={initialize,assertCurrent,actor:()=>assertCurrent(),dispose,
    context:(classId,options={})=>{if(classId!==undefined)identifier(classId);return request('context','/context'+(classId?'?class_id='+classId:''),classId?{class_id:classId}:{},'GET',options);},
    list:(classId,options={})=>request('list','/lessons?class_id='+identifier(classId),{class_id:classId},'GET',options),
    get:(id,options={})=>request('get',pathFor(id),{lesson_id:id},'GET',options),
    create:(body,options={})=>{documentBody(body,true);return request('create','/lessons',copy(body),'POST',options);},
    save:(id,body,options={})=>{documentBody(body);requireValue(body.document.lesson_id===id,'invalid_request');return post('save','/draft',id,copy(body),options);},
    history:(id,options={},requestOptions={})=>{shape(options,['before_version','limit'],[]);if(own(options,'before_version'))revision(options.before_version);if(own(options,'limit'))requireValue(integer(options.limit,1,100),'invalid_request');const qs=new URLSearchParams(options);return request('history',pathFor(id)+'/history'+(qs.size?'?'+qs:''),{lesson_id:id,...options},'GET',requestOptions);},
    version:(id,versionId,options={})=>request('version',pathFor(id)+'/versions/'+identifier(versionId),{lesson_id:id,version_id:versionId},'GET',options),
    pin:(classId,body,options={})=>{assertCurrent();requireValue(owner.role==='admin','invalid_request');shape(body,['course_version_id','expected_assignment_id','reason']);identifier(body.course_version_id);if(body.expected_assignment_id!==null)identifier(body.expected_assignment_id);requireValue(text(body.reason,1000),'invalid_request');return request('pin_course','/classes/'+identifier(classId)+'/course-version',{class_id:classId,...copy(body)},'POST',options);},
    requestReview:(id,expected,options={})=>post('request_review','/request-review',id,{expected_revision:revision(expected)},options),
    approve:(id,body,options={})=>{shape(body,['expected_revision','checks','comment']);revision(body.expected_revision);const keys=['curriculum','mathematics','accessibility','rights','student_safe'];shape(body.checks,keys);requireValue(keys.every(key=>body.checks[key]===true)&&text(body.comment,2000),'invalid_request');return post('approve','/approve',id,copy(body),options);},
    publish:(id,expected,options={})=>post('publish','/publish',id,{expected_revision:revision(expected)},options),
    restore:(id,body,options={})=>{shape(body,['expected_revision','version_id']);revision(body.expected_revision);identifier(body.version_id);return post('restore','/restore',id,copy(body),options);},
    unpublish:(id,body,options={})=>{shape(body,['expected_revision','reason']);revision(body.expected_revision);requireValue(text(body.reason,1000),'invalid_request');return post('unpublish','/unpublish',id,copy(body),options);}
  };
  return Object.freeze(client);
}
