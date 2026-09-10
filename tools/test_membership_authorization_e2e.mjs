import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import readline from 'node:readline';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {stripTypeScriptTypes} from 'node:module';
import {createHash,webcrypto} from 'node:crypto';
const root=path.resolve(process.env.ECHS_MEMBERSHIP_SOURCE_ROOT||fileURLToPath(new URL('../',import.meta.url))),baseline=path.resolve(process.env.ECHS_MEMBERSHIP_BASELINE_ROOT||root);
const reportPath=path.resolve(process.env.ECHS_MEMBERSHIP_E2E_REPORT||'reports/membership-authorization-e2e.json');
const report={status:'RUNNING; NOT PASS',contract:'echs.membership-real-http-sql.v1',production_calls:0,checks:[],rpc_names:[]};
const hash=value=>createHash('sha256').update(value).digest('hex');
function save(){fs.mkdirSync(path.dirname(reportPath),{recursive:true});fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');}
let child,readyResolve,readyReject,nextId=0,lostAck=false;const waiting=new Map();
const ready=new Promise((resolve,reject)=>{readyResolve=resolve;readyReject=reject;});
async function request(value){const id=++nextId;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{waiting.delete(id);reject(new Error('Fixture RPC timed out'));},15000);waiting.set(id,{resolve,reject,timer});child.stdin.write(JSON.stringify({id,...value})+'\n');});}
const control=async name=>{const value=await request({control:name});assert.equal(value.error,null);return value.data;};
try{
  assert.ok(process.env.ECHS_MEMBERSHIP_TEST_DSN,'Explicit disposable test DSN is required');
  child=spawn(process.env.PYTHON||'python',[path.join(root,'tools/membership_authorization_rpc_fixture.py'),'--database-report',process.env.ECHS_MEMBERSHIP_DATABASE_REPORT||'reports/membership-authorization-database.json'],{stdio:['pipe','pipe','pipe'],windowsHide:true});
  const startup=setTimeout(()=>readyReject(new Error('Fixture startup timeout')),15000);
  child.once('error',()=>readyReject(new Error('Fixture process unavailable')));child.once('exit',code=>{if(code!==0)readyReject(new Error('Fixture startup or process failed'));for(const item of waiting.values()){clearTimeout(item.timer);item.reject(new Error('Fixture process ended'));}waiting.clear();});
  let stderr='';child.stderr.on('data',chunk=>{stderr=(stderr+chunk.toString()).slice(-1000);});
  readline.createInterface({input:child.stdout}).on('line',line=>{
    let value;try{value=JSON.parse(line);}catch{return readyReject(new Error('Malformed fixture response'));}
    if(Object.hasOwn(value,'ready')){clearTimeout(startup);if(value.ready)readyResolve(value);else readyReject(new Error('Fixture rejected startup: '+(value.error?.type||'unknown')));return;}
    const item=waiting.get(value.id);if(!item)return;clearTimeout(item.timer);waiting.delete(value.id);item.resolve(value);
  });
  const fixture=await ready,ids=fixture.ids;report.postgres_version=fixture.postgres_version;
  let handler;
  const db={from(){throw new Error('Membership endpoints must not use nontransactional table transport');},async rpc(name,args){
    assert.ok(['api_session_lookup','api_membership_capabilities','api_replace_class_memberships'].includes(name));report.rpc_names.push(name);
    const value=await request({name,args});
    if(lostAck&&name==='api_replace_class_memberships'&&!value.error){lostAck=false;throw new Error('Synthetic lost acknowledgement after committed SQL');}
    return {data:value.data,error:value.error};
  }};
  const context=vm.createContext({createClient:()=>db,Deno:{env:{get:()=>''},serve:fn=>handler=fn},Request,Response,URL,TextEncoder,crypto:webcrypto,console:{error(){}},Date});
  vm.runInContext(fs.readFileSync(path.join(baseline,'supabase/functions/institution-api/lesson-access-policy.js'),'utf8').replace(/export /g,''),context);
  const source=fs.readFileSync(path.join(root,'supabase/functions/institution-api/index.ts'),'utf8');report.handler_sha256=hash(source);
  if(source.includes('../_shared/mastery-status.mjs')){
    const statusPolicy=fs.readFileSync(path.join(root,'supabase/functions/_shared/mastery-status.mjs'),'utf8');
    report.mastery_status_sha256=hash(statusPolicy);
    vm.runInContext(statusPolicy.replace(/^export /gm,''),context,{filename:'actual/mastery-status.mjs'});
  }
  vm.runInContext(stripTypeScriptTypes(source.replace(/^import\s[\s\S]*?;\r?\n/gm,'')),context,{filename:'actual/institution-api/index.ts'});
  const send=(actor,body,cls=ids.class)=>handler(new Request(`https://fixture.invalid/functions/v1/institution-api/classes/${cls}/members`,{method:'POST',headers:{...(actor?{authorization:'Bearer '+fixture.tokens[actor]}:{}),'content-type':'application/json'},body:JSON.stringify(body)}));
  async function check(name,fn){await fn();report.checks.push(name);save();console.log('PASS '+name);}
  await check('Actual unauthenticated HTTP health reaches the service-only PostgreSQL capability RPC',async()=>{
    const response=await handler(new Request('https://fixture.invalid/functions/v1/institution-api/health/membership'));assert.equal(response.status,200);assert.deepEqual(await response.json(),{ok:true,service:'echs-institution-api',membership_capabilities:{contract:'echs.membership.v1',atomic_replacement:true,tenant_scoped:true}});assert.equal(response.headers.get('cache-control'),'no-store');
  });
  await check('Actual school-session lookup denies missing, inactive, student and parent HTTP writes',async()=>{
    const before=await control('roster');for(const actor of ['', 'student','parent','inactive_student']){const response=await send(actor,{student_ids:[]});assert.ok([401,403].includes(response.status));}assert.deepEqual(await control('roster'),before);
  });
  await check('Real SQL denies foreign/wrong-role/inactive assignments and preserves the exact previous roster',async()=>{
    const before=await control('roster');for(const target of ['foreign_student','parent','inactive_student']){const response=await send('teacher',{student_ids:[ids[target]]});assert.equal(response.status,403);assert.doesNotMatch(await response.text(),/foreign_student|inactive_student|organization_id/);assert.deepEqual(await control('roster'),before);}
    for(const actor of ['foreign_teacher','unassigned_teacher'])assert.equal((await send(actor,{})).status,403);
    assert.equal((await send('teacher',{},ids.foreign_class)).status,403);assert.equal((await send('admin',{},ids.archived_class)).status,403);assert.deepEqual(await control('roster'),before);
  });
  await check('Teacher replacement deduplicates through actual SQL, retains self and preserves unchanged joined timestamps on retry',async()=>{
    const body={student_ids:[ids.second_student,ids.second_student],teacher_ids:[]};const response=await send('teacher',body);assert.equal(response.status,200);assert.deepEqual(await response.json(),{ok:true,contract:'echs.membership.v1',members:2});
    const before=await control('roster');assert.deepEqual(new Set(before.map(x=>x.account_id)),new Set([ids.teacher,ids.second_student]));assert.equal((await send('teacher',body)).status,200);assert.deepEqual(await control('roster'),before);
  });
  await check('Database insertion failure rolls back replacement behind the real HTTP handler and returns a safe retryable error',async()=>{
    const before=await control('roster');await control('fail_insert');const response=await send('teacher',{student_ids:[ids.third_student]});assert.equal(response.status,503);assert.doesNotMatch(await response.text(),/Synthetic failure|c09_http_fail|third_student/);assert.deepEqual(await control('roster'),before);await control('clear_failure');
  });
  await check('Lost acknowledgement after committed SQL is reconciled by an idempotent retry without duplicate or lost memberships',async()=>{
    const body={student_ids:[ids.student],teacher_ids:[ids.teacher]};lostAck=true;assert.equal((await send('teacher',body)).status,503);const committed=await control('roster');assert.deepEqual(new Set(committed.map(x=>x.account_id)),new Set([ids.student,ids.teacher]));assert.equal((await send('teacher',body)).status,200);assert.deepEqual(await control('roster'),committed);
  });
  await check('Revoked teacher session is rejected and administrator empty replacement remains explicitly valid',async()=>{
    const before=await control('roster');await control('revoke_teacher');assert.equal((await send('teacher',{})).status,401);assert.deepEqual(await control('roster'),before);const response=await send('admin',{});assert.equal(response.status,200);assert.equal((await response.json()).members,0);assert.deepEqual(await control('roster'),[]);
  });
  report.status='PASS';report.rpc_names=[...new Set(report.rpc_names)].sort();report.limits=['Actual Edge handler and service-role PostgreSQL RPCs; Supabase SDK network transport is replaced by a closed fixed-RPC stdio adapter.','Test-only fixture controls affect newly generated synthetic IDs in the explicit loopback database. No production data or requests.'];save();console.log(JSON.stringify({status:'PASS',groups:report.checks.length,rpc_names:report.rpc_names}));
}catch(error){report.status='FAIL';report.error={type:error.name,message:String(error.message).slice(0,600)};save();console.error('Membership HTTP/SQL failure: '+error.name+': '+String(error.message).slice(0,600));process.exitCode=1;}
finally{if(child){child.stdin.end();await new Promise(resolve=>{if(child.exitCode!==null)return resolve();const timer=setTimeout(()=>{child.kill();resolve();},2000);child.once('exit',()=>{clearTimeout(timer);resolve();});});}}
