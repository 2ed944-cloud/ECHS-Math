import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {stripTypeScriptTypes} from 'node:module';
import {createHash,webcrypto} from 'node:crypto';
const root=path.resolve(process.env.ECHS_MEMBERSHIP_SOURCE_ROOT||fileURLToPath(new URL('../',import.meta.url)));
const baseline=path.resolve(process.env.ECHS_MEMBERSHIP_BASELINE_ROOT||root);
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const copy=x=>JSON.parse(JSON.stringify(x)),hash=x=>createHash('sha256').update(x).digest('hex');
const names=['org','foreignOrg','admin','teacher','unassigned','student','inactiveStudent','secondStudent','parent','foreignTeacher','foreignStudent','class','otherClass','foreignClass'];
const ids=Object.fromEntries(names.map((name,i)=>[name,`00000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`]));
const cap={contract:'echs.membership.v1',atomic_replacement:true,tenant_scoped:true};
function harness(service='institution-api',extra={}){
  let handler;const reads=[],writes=[],rpcs=[];
  const accounts=['admin','teacher','unassigned','student','inactiveStudent','secondStudent','parent','foreignTeacher','foreignStudent'].map(name=>({id:ids[name],organization_id:name.startsWith('foreign')?ids.foreignOrg:ids.org,role:/teacher|unassigned/i.test(name)?'teacher':/student/i.test(name)?'student':name,status:name==='inactiveStudent'?'suspended':'active',username:name,display_name:'Synthetic '+name}));
  const tables=new Map(Object.entries({accounts,classes:[{id:ids.class,organization_id:ids.org,name:'Synthetic class',course_key:'ap-calculus',status:'active'},{id:ids.otherClass,organization_id:ids.org,name:'Other class',course_key:'ap-calculus',status:'archived'},{id:ids.foreignClass,organization_id:ids.foreignOrg,name:'FOREIGN_CLASS_CANARY',course_key:'ap-calculus',status:'active'}],class_memberships:[{class_id:ids.class,account_id:ids.teacher,membership_role:'teacher'},{class_id:ids.class,account_id:ids.student,membership_role:'student'},{class_id:ids.class,account_id:ids.inactiveStudent,membership_role:'student'}],parent_student_links:[{parent_id:ids.parent,student_id:ids.student},{parent_id:ids.parent,student_id:ids.inactiveStudent}],learning_attempts:[],mastery_records:[],review_items:[],learning_sessions:[],assignments:[],assignment_results:[],skill_definitions:[],lesson_catalog:[],lesson_access_overrides:[],lesson_completions:[],timetable_entries:[],...copy(extra)}));
  const state={rpcResult:null,rpcError:null,capability:cap,sessionRevoked:false,rpcThrows:false};
  const db={rpc:async(name,args)=>{
    rpcs.push({name,args:copy(args||{})});
    if(name==='api_session_lookup'){
      const a=tables.get('accounts').find(row=>hash(row.username)===args.p_token_hash&&row.status==='active');
      return {data:a&&!state.sessionRevoked?[{...a,account_id:a.id}]:[],error:null};
    }
    if(name==='api_membership_capabilities')return {data:copy(state.capability),error:state.rpcError};
    if(name==='api_replace_class_memberships'){if(state.rpcThrows)throw new Error('PRIVATE_TRANSPORT_CANARY');return {data:state.rpcResult,error:state.rpcError};}
    throw new Error('Unexpected RPC '+name);
  },from(table){
    const filters=[];let columns='*',head=false,single=false,action='select',input;
    function field(name){if(['class_memberships','assignment_results','parent_student_links'].includes(table)&&name==='organization_id')throw new Error('Query used nonexistent organization_id on '+table);}
    const q={select(value='*',opts={}){columns=value;head=opts.head;reads.push({table,columns});return q;},eq(k,v){field(k);filters.push(r=>r[k]===v);return q;},in(k,v){field(k);filters.push(r=>v.includes(r[k]));return q;},not(k,op,v){filters.push(r=>op==='is'?r[k]!==v:true);return q;},gt(k,v){filters.push(r=>r[k]>v);return q;},order(){return q;},limit(){return q;},single(){single=true;return q;},maybeSingle(){single=true;return q;},delete(){action='delete';return q;},insert(rows){action='insert';input=copy(rows);return q;},upsert(rows){action='upsert';input=copy(rows);return q;},then(resolve,reject){return Promise.resolve().then(()=>{
      const all=tables.get(table)||[];let rows=all.filter(r=>filters.every(f=>f(r)));
      if(action!=='select'){writes.push({table,action,input});if(action==='delete')tables.set(table,all.filter(r=>!filters.every(f=>f(r))));else tables.set(table,[...all,...(Array.isArray(input)?input:[input])]);return {data:input||null,error:null};}
      const count=rows.length;
      if(columns.includes('classes('))rows=rows.map(row=>({...row,classes:tables.get('classes').find(c=>c.id===row.class_id)||null}));
      else if(columns!=='*'&&!columns.includes('('))rows=rows.map(row=>Object.fromEntries(columns.split(',').filter(k=>Object.hasOwn(row,k)).map(k=>[k,row[k]])));
      return {data:head?null:copy(single?rows[0]||null:rows),count,error:null};
    }).then(resolve,reject);}};return q;
  }};
  const policy=fs.readFileSync(path.join(baseline,'supabase/functions/institution-api/lesson-access-policy.js'),'utf8').replace(/export /g,'');
  const context=vm.createContext({createClient:()=>db,Deno:{env:{get:()=>''},serve:fn=>handler=fn},Request,Response,URL,TextEncoder,crypto:webcrypto,console:{error(){}},Date});
  vm.runInContext(policy,context);
  const rawSource=read(`supabase/functions/${service}/index.ts`);
  if(rawSource.includes('../_shared/mastery-status.mjs')){
    const statusPolicy=read('supabase/functions/_shared/mastery-status.mjs');
    vm.runInContext(statusPolicy.replace(/^export /gm,''),context,{filename:'actual/mastery-status.mjs'});
  }
  const source=rawSource.replace(/^import\s[\s\S]*?;\r?\n/gm,'');
  vm.runInContext(stripTypeScriptTypes(source),context,{filename:`actual/${service}/index.ts`});
  const send=(route,{actor='teacher',body,method}={})=>handler(new Request(`https://fixture.invalid/functions/v1/${service}${route}`,{method:method||(body===undefined?'GET':'POST'),headers:{...(actor?{authorization:'Bearer '+actor}:{}),'content-type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})}));
  return {tables,state,reads,writes,rpcs,send};
}
const checks=[];async function check(name,fn){await fn();checks.push(name);}
const forbidden=async h=>{const response=await h;assert.equal(response.status,403);return response;};
await check('Unauthenticated, inactive, revoked and nonstaff actors cannot replace memberships',async()=>{
  for(const actor of ['', 'missing','student','parent','inactiveStudent']){const h=harness();const r=await h.send(`/classes/${ids.class}/members`,{actor,body:{student_ids:[]}});assert.ok([401,403].includes(r.status));assert.equal(h.writes.length,0);assert.equal(h.rpcs.some(x=>x.name==='api_replace_class_memberships'),false);}
  const h=harness();h.state.sessionRevoked=true;assert.equal((await h.send(`/classes/${ids.class}/members`,{body:{}})).status,401);
});
await check('Replacement validates shapes before RPC and delegates every permitted mutation to one atomic RPC',async()=>{
  for(const body of [{student_ids:'x'},{student_ids:[null]},{teacher_ids:[{}]},{student_ids:['bad']},{student_ids:Array(10001).fill(ids.student)}]){const h=harness();assert.equal((await h.send(`/classes/${ids.class}/members`,{body})).status,400);assert.equal(h.writes.length,0);assert.equal(h.rpcs.length,1);}
  const h=harness(),before=copy(h.tables.get('class_memberships'));h.state.rpcResult={ok:true,contract:cap.contract,class_id:ids.class,members:2};
  const response=await h.send(`/classes/${ids.class}/members`,{body:{student_ids:[ids.student,ids.student],teacher_ids:[ids.teacher]}});assert.equal(response.status,200);assert.deepEqual(await response.json(),{ok:true,contract:cap.contract,members:2});
  assert.equal(h.writes.length,0);assert.deepEqual(h.tables.get('class_memberships'),before);assert.deepEqual(h.rpcs[1],{name:'api_replace_class_memberships',args:{p_token_hash:hash('teacher'),p_class_id:ids.class,p_student_ids:[ids.student,ids.student],p_teacher_ids:[ids.teacher]}});
});
await check('Malformed top-level JSON, explicit null arrays and unknown fields never become an empty replacement',async()=>{
  for(const body of [null,[],[ids.student],'empty',0,false,{student_ids:null},{teacher_ids:null},{students:[]},{student_ids:[],unexpected:true}]){
    const h=harness(),before=copy(h.tables.get('class_memberships'));
    assert.equal((await h.send(`/classes/${ids.class}/members`,{actor:'admin',body})).status,400);
    assert.deepEqual(h.rpcs.map(x=>x.name),['api_session_lookup']);assert.equal(h.writes.length,0);assert.deepEqual(h.tables.get('class_memberships'),before);
  }
  for(const actor of ['admin','teacher']){
    const h=harness();h.state.rpcResult={ok:true,contract:cap.contract,class_id:ids.class,members:actor==='admin'?0:1};
    assert.equal((await h.send(`/classes/${ids.class}/members`,{actor,body:{}})).status,200);
    assert.deepEqual(h.rpcs[1].args.p_student_ids,[]);assert.deepEqual(h.rpcs[1].args.p_teacher_ids,[]);
  }
});
await check('Database reauthorization rejection and unavailable rollout never fall back to destructive REST replacement',async()=>{
  for(const [code,status] of [['42501',403],['28000',401],['22023',400],['23514',503],['PGRST202',503],['XX000',503]]){const h=harness(),before=copy(h.tables.get('class_memberships'));h.state.rpcError={code,message:'PRIVATE_SQL_CANARY'};const response=await h.send(`/classes/${ids.class}/members`,{body:{student_ids:[ids.foreignStudent]}});assert.equal(response.status,status);assert.doesNotMatch(await response.text(),/PRIVATE_SQL_CANARY/);assert.equal(h.writes.length,0);assert.deepEqual(h.tables.get('class_memberships'),before);}
  for(const bad of [null,{ok:true,contract:cap.contract,class_id:ids.foreignClass,members:1},{ok:true,contract:cap.contract,class_id:ids.class,members:1.5}]){const h=harness();h.state.rpcResult=bad;assert.equal((await h.send(`/classes/${ids.class}/members`,{body:{}})).status,503);assert.equal(h.writes.length,0);}
  const h=harness();h.state.rpcThrows=true;const response=await h.send(`/classes/${ids.class}/members`,{body:{}});assert.equal(response.status,503);assert.doesNotMatch(await response.text(),/PRIVATE_TRANSPORT_CANARY/);assert.equal(h.writes.length,0);
});
await check('Public membership health probes actual RPC shape without session or private data reads',async()=>{
  const h=harness(),response=await h.send('/health/membership',{actor:''});assert.equal(response.status,200);assert.deepEqual(await response.json(),{ok:true,service:'echs-institution-api',membership_capabilities:cap});assert.deepEqual(h.rpcs.map(x=>x.name),['api_membership_capabilities']);assert.equal(h.reads.length,0);assert.equal(h.writes.length,0);
  for(const bad of [null,{}, {...cap,extra:true},{...cap,tenant_scoped:false}]){const h=harness();h.state.capability=bad;assert.equal((await h.send('/health/membership',{actor:''})).status,503);}
});
await check('Malformed foreign teacher membership cannot grant class reads or writes in either handler',async()=>{
  for(const service of ['institution-api','mastery-evidence']){const h=harness(service);h.tables.get('class_memberships').push({class_id:ids.foreignClass,account_id:ids.teacher,membership_role:'teacher'});await forbidden(h.send(service==='institution-api'?`/classes/${ids.foreignClass}/dashboard`:`/classes/${ids.foreignClass}`));assert.equal(h.writes.length,0);assert.equal(h.reads.some(x=>x.table==='learning_attempts'||x.table==='mastery_records'),false);
    if(service==='institution-api'){await forbidden(h.send('/assignments',{body:{class_id:ids.foreignClass,title:'Invalid'}}));assert.deepEqual((await (await h.send('/classes')).json()).classes.map(x=>x.id),[ids.class]);}
  }
});
await check('Foreign and wrong-role student memberships are filtered before any private evidence query',async()=>{
  for(const service of ['institution-api','mastery-evidence']){const h=harness(service);h.tables.get('class_memberships').push({class_id:ids.class,account_id:ids.foreignStudent,membership_role:'student'},{class_id:ids.class,account_id:ids.parent,membership_role:'student'});h.tables.set('mastery_records',[{account_id:ids.foreignStudent,organization_id:ids.foreignOrg,skill_key:'foreign',title:'FOREIGN_EVIDENCE_CANARY',score:99},{account_id:ids.parent,organization_id:ids.org,skill_key:'wrong-role',title:'WRONG_ROLE_CANARY',score:99}]);
    const response=await h.send(service==='institution-api'?`/classes/${ids.class}/dashboard`:`/classes/${ids.class}`);assert.equal(response.status,200);const body=await response.json();assert.deepEqual(body.students.map(x=>x.id),[ids.student,ids.inactiveStudent]);assert.doesNotMatch(JSON.stringify(body),/FOREIGN_EVIDENCE_CANARY|WRONG_ROLE_CANARY/);assert.equal(h.writes.length,0);
  }
});
await check('Student and family reports revalidate target tenant and actual role; historical inactive students remain readable',async()=>{
  for(const actor of ['teacher','parent','admin']){const h=harness();h.tables.get('class_memberships').push({class_id:ids.class,account_id:ids.foreignStudent,membership_role:'student'},{class_id:ids.class,account_id:ids.parent,membership_role:'student'});h.tables.get('parent_student_links').push({parent_id:ids.parent,student_id:ids.foreignStudent},{parent_id:ids.parent,student_id:ids.teacher});
    for(const target of ['foreignStudent','parent'])await forbidden(h.send(`/dashboard/student?student_id=${ids[target]}`,{actor}));
    for(const target of ['student','inactiveStudent'])assert.equal((await h.send(`/dashboard/student?student_id=${ids[target]}`,{actor})).status,200);
    const children=await (await h.send('/children',{actor})).json();assert.deepEqual(children.students.map(x=>x.id),[ids.student,ids.inactiveStudent]);
  }
  const h=harness();assert.equal((await h.send('/dashboard/student',{actor:'student'})).status,200);await forbidden(h.send(`/dashboard/student?student_id=${ids.secondStudent}`,{actor:'student'}));
});
await check('Student dashboard, timetable and assignment classes exclude malformed foreign-class memberships',async()=>{
  const h=harness();h.tables.get('class_memberships').push({class_id:ids.foreignClass,account_id:ids.student,membership_role:'student'});h.tables.set('assignments',[{id:'bad',organization_id:ids.foreignOrg,class_id:ids.foreignClass,status:'published',title:'FOREIGN_ASSIGNMENT_CANARY'}]);h.tables.set('timetable_entries',[{id:'bad',organization_id:ids.org,class_id:ids.foreignClass,title:'FOREIGN_TIMETABLE_CANARY'}]);
  const dashboard=await(await h.send('/dashboard/student',{actor:'student'})).json();assert.deepEqual(dashboard.classes.map(x=>x.class_id),[ids.class]);assert.doesNotMatch(JSON.stringify(dashboard),/FOREIGN_/);
  for(const route of ['/assignments','/timetable']){const response=await h.send(route,{actor:'student'});assert.equal(response.status,200);assert.doesNotMatch(await response.text(),/FOREIGN_/);}
});
await check('Class counts use same-organization accounts with matching real roles',async()=>{
  const h=harness();h.tables.get('class_memberships').push({class_id:ids.class,account_id:ids.foreignStudent,membership_role:'student'},{class_id:ids.class,account_id:ids.parent,membership_role:'teacher'});const body=await(await h.send('/classes')).json();assert.deepEqual(body.classes[0].counts,{students:2,teachers:1});assert.equal(h.writes.length,0);
});
await check('Legitimate teacher, administrator, student and parent behavior and original private headers remain',async()=>{
  for(const service of ['institution-api','mastery-evidence'])for(const actor of ['teacher','admin']){const h=harness(service);const response=await h.send(service==='institution-api'?`/classes/${ids.class}/dashboard`:`/classes/${ids.class}`,{actor});assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');assert.equal(response.headers.get('x-content-type-options'),'nosniff');assert.equal(h.writes.length,0);}
  for(const actor of ['student','parent','unassigned']){const h=harness();await forbidden(h.send(`/classes/${ids.class}/dashboard`,{actor}));}
});
const report={status:'PASS',contract:'echs.membership-http-tests.v1',checks:checks.length,groups:checks,production_calls:0,limits:'Actual Edge handlers with synthetic database/RPC boundary. Real PostgreSQL replacement atomicity, locking and grants are tested separately; no mocked authorization outcome is claimed as database proof.'};
if(process.env.ECHS_MEMBERSHIP_HTTP_REPORT){fs.mkdirSync(path.dirname(process.env.ECHS_MEMBERSHIP_HTTP_REPORT),{recursive:true});fs.writeFileSync(process.env.ECHS_MEMBERSHIP_HTTP_REPORT,JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report,null,2));
