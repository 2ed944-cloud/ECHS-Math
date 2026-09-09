import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';
import {createHash, webcrypto} from 'node:crypto';

// Actual Edge handlers, synthetic database, no network or production data.
// Attempt-trigger semantics are explicit fixtures; PostgreSQL acceptance is separate.
const root=new URL('../',import.meta.url),read=path=>fs.readFileSync(new URL(path,root),'utf8');
const copy=value=>JSON.parse(JSON.stringify(value));
const hash=value=>createHash('sha256').update(value).digest('hex');
const statusURL=new URL('supabase/functions/_shared/mastery-status.mjs',root);
const statusAPI=fs.existsSync(statusURL)?await import(statusURL.href):{};
const policy=read('supabase/functions/institution-api/lesson-access-policy.js').replace(/export /g,'');
const graph=JSON.parse(read('data/knowledge-graph/ap-calculus-unit-1.json'));
const definition={skill_key:graph.skills[0].id,course:'ap-calculus',unit:'1',topic:'1.1',title:graph.skills[0].title,active:true,lesson_ids:['1.1'],evidence_rules:graph.skills[0].evidence_rules};
const ids={org:'a0000000-0000-4000-8000-000000000001',student:'b0000000-0000-4000-8000-000000000001',teacher:'b0000000-0000-4000-8000-000000000002',parent:'b0000000-0000-4000-8000-000000000003',other:'b0000000-0000-4000-8000-000000000004',class:'c0000000-0000-4000-8000-000000000001'};
const actors=Object.fromEntries(['student','teacher','parent'].map(role=>[role,{account_id:ids[role],organization_id:ids.org,role,status:'active'}]));
function harness(service,seed={}){
  let handler;const writes=[],reads=[],rpcs=[];
  const tables=new Map(Object.entries({
    skill_definitions:[definition],accounts:[{id:ids.student,organization_id:ids.org,role:'student',display_name:'Synthetic learner'}],
    classes:[{id:ids.class,organization_id:ids.org,course_key:'ap-calculus',name:'Synthetic class'}],
    class_memberships:[{class_id:ids.class,account_id:ids.student,membership_role:'student'},{class_id:ids.class,account_id:ids.teacher,membership_role:'teacher'}],
    parent_student_links:[{parent_id:ids.parent,student_id:ids.student}],...copy(seed),
  }));
  const db={
    rpc:async(name,args)=>{rpcs.push(name);assert.equal(name,'api_session_lookup');const actor=Object.entries(actors).find(([role])=>hash(role)===args.p_token_hash)?.[1];return{data:actor?[actor]:[],error:null};},
    from:table=>{
      const filters=[];let ordering=null,limit=Infinity,single=false,projection=null,head=false;
      const query={
        select(columns='*',options={}){reads.push({table,columns});projection=columns;head=options.head===true;return query;},
        eq(key,value){filters.push(row=>row[key]===value);return query;},
        in(key,values){filters.push(row=>values.includes(row[key]));return query;},
        order(key,options={}){ordering={key,asc:options.ascending!==false};return query;},
        limit(value){limit=value;return query;},
        single(){single=true;return query;},maybeSingle(){single=true;return query;},
        then(resolve,reject){
          let rows=(tables.get(table)||[]).filter(row=>filters.every(f=>f(row)));
          if(ordering)rows=[...rows].sort((a,b)=>String(a[ordering.key]).localeCompare(String(b[ordering.key]))*(ordering.asc?1:-1));
          rows=rows.slice(0,limit);const count=rows.length;
          if(projection&&projection!=='*'&&!projection.includes('('))rows=rows.map(row=>Object.fromEntries(projection.split(',').filter(key=>key in row).map(key=>[key,row[key]])));
          return Promise.resolve({data:head?null:single?(rows[0]||null):copy(rows),count,error:null}).then(resolve,reject);
        },
        upsert(input,options){const rows=copy(input);if(table==='learning_attempts')for(const row of rows)row.trust_tier='legacy_verified_boundary';writes.push({table,rows,options});tables.set(table,rows);return Promise.resolve({error:null});},
      };return query;
    },
  };
  const context=vm.createContext({createClient:()=>db,...statusAPI,Deno:{env:{get:()=>''},serve:fn=>handler=fn},Request,Response,URL,TextEncoder,crypto:webcrypto,console,Date});
  vm.runInContext(policy,context);
  const source=read(`supabase/functions/${service}/index.ts`).replace(/^import\s[\s\S]*?;\r?\n/gm,'');
  vm.runInContext(stripTypeScriptTypes(source),context,{filename:`actual/${service}/index.ts`});
  const send=(path,{actor='student',body}={})=>handler(new Request(`https://fixture.invalid/functions/v1/${service}${path}`,{method:body?'POST':'GET',headers:{...(actor?{authorization:`Bearer ${actor}`}:{}) ,'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}));
  return{send,writes,reads,rpcs,tables};
}
function attempts(assistance,mode){return Array.from({length:24},(_,i)=>({id:`event-${i}`,questionId:`unregistered-${i}`,skill_key:definition.skill_key,course:'ap-calculus',unit:'1',topic:'1.1',correct:true,response:'Ungraded claim',mode,difficulty:3,representation:['symbolic','graphical','numerical','contextual'][i%4],assistance_level:assistance,trust_tier:'student_ready_verified',occurred_at:new Date(Date.UTC(2026,0,1+Math.floor(i/8),8,i%8)).toISOString()}));}
const checks=[];
const check=async(name,fn)=>{await fn();checks.push(name);};
const assertProvisional=row=>{assert.equal(row.status_contract,'echs.mastery-status.v1');assert.equal(row.evidence_status,'provisional');assert.equal(row.verified_mastery,false);assert.equal(row.provenance,'client_reported');assert.notEqual(row.level,'Mastered');assert.equal(row.level,row.display_level);assert.ok(row.missing_evidence.includes('grading_provenance_missing'));};
let assisted,claimed;
await check('Hinted high score is provisional; raw score/confidence and stored diagnostics unchanged',async()=>{
  const h=harness('mastery-evidence');const response=await h.send('/sync',{body:{attempts:attempts('hint','practice'),mastery:[{score:100}]}});
  assert.equal(response.status,200);const body=await response.json();assisted=h.tables.get('mastery_records')[0];
  assert.equal(assisted.score,93);assert.equal(assisted.payload.verified,false);assert.equal(assisted.independent_evidence,0);assert.equal(assisted.transfer_evidence,0);
  assertProvisional(body.mastery[0]);assert.equal(body.mastery[0].score,assisted.score);assert.equal(body.mastery[0].confidence,assisted.confidence);
  assert.equal(body.mastery[0].payload.verified,false);assert.equal(body.mastery[0].payload.level,body.mastery[0].display_level);
  assert.equal(body.authoritative,true);assert.equal(body.grading_authoritative,false);assert.equal(body.client_mastery_ignored,true);
  assert.ok(body.mastery[0].missing_evidence.includes('independent_evidence_insufficient'));
});
await check('Caller-claimed verified foundation result is still uncertified',async()=>{
  const h=harness('mastery-evidence');const response=await h.send('/sync',{body:{attempts:attempts('none','challenge')}});assert.equal(response.status,200);
  const body=await response.json();claimed=h.tables.get('mastery_records')[0];assert.equal(claimed.score,97);assert.equal(claimed.payload.verified,true);assert.equal(claimed.payload.verified_question_evidence,0);
  assertProvisional(body.mastery[0]);assert.equal(body.mastery[0].score,97);assert.deepEqual([...new Set(h.reads.map(x=>x.table))].sort(),['learning_attempts','skill_definitions']);
  assert.equal(body.mastery[0].last_verified_at,null);assert.equal(body.mastery[0].legacy_algorithm_diagnostics.verified,true);assert.equal(body.mastery[0].legacy_algorithm_diagnostics.last_verified_at,claimed.last_verified_at);
});
await check('Class evidence projection refuses forged receipt-like metadata and never rewrites rows',async()=>{
  const row={...copy(claimed),verified_mastery:true,evidence_status:'verified',payload:{...claimed.payload,authenticated:true,grading_receipt:'caller-claim',verified_question_evidence:24}};
  const h=harness('mastery-evidence',{mastery_records:[row]});const before=copy(h.tables.get('mastery_records'));
  const response=await h.send(`/classes/${ids.class}`,{actor:'teacher'});assert.equal(response.status,200);const body=await response.json();assertProvisional(body.matrix[0]);assert.equal(body.matrix[0].score,97);assert.equal(body.matrix[0].has_evidence,true);assert.equal(body.grading_authoritative,false);assert.equal(h.writes.length,0);assert.deepEqual(h.tables.get('mastery_records'),before);
});
await check('Student and linked-parent read models count only certified mastery; numeric practice unchanged',async()=>{
  for(const actor of ['student','parent']){
    const h=harness('institution-api',{mastery_records:[assisted, {...copy(claimed),skill_key:'another-skill'}]});
    const response=await h.send(`/dashboard/student?student_id=${ids.student}`,{actor});assert.equal(response.status,200);const body=await response.json();
    assert.equal(body.counters.mastered_topics,0);assert.equal(body.counters.mastery,95);assert.equal(body.counters.total_topics,2);
    body.mastery.forEach(assertProvisional);body.strengths.forEach(assertProvisional);body.priorities.forEach(assertProvisional);assert.equal(h.writes.length,0);
  }
});
await check('Teacher dashboard preserves averages/support priorities but not false mastered counts',async()=>{
  const h=harness('institution-api',{mastery_records:[claimed]});const response=await h.send(`/classes/${ids.class}/dashboard`,{actor:'teacher'});assert.equal(response.status,200);const body=await response.json();
  assert.equal(body.students[0].mastered_topics,0);assert.equal(body.students[0].mastery,97);assert.equal(body.summary.average_mastery,97);assert.equal(body.support_priorities[0].mastery,97);assert.equal(body.students[0].verified_mastery,false);assert.equal(h.writes.length,0);
});
await check('No evidence is distinct from zero accuracy',async()=>{
  const h=harness('institution-api');const response=await h.send('/dashboard/student');assert.equal(response.status,200);const body=await response.json();assert.equal(body.counters.total_topics,0);assert.equal(body.evidence_status,'insufficient');assert.equal(body.verified_mastery,false);
});
await check('Public health declares recomputation versus grading without private reads',async()=>{
  for(const service of ['mastery-evidence','institution-api']){
    const h=harness(service);const response=await h.send('/health',{actor:''});assert.equal(response.status,200);
    const body=await response.json();assert.equal(body.status_contract,'echs.mastery-status.v1');assert.equal(body.grading_authoritative,false);assert.equal(h.reads.length,0);assert.equal(h.writes.length,0);assert.equal(h.rpcs.length,0);
  }
});
await check('Existing authentication, student/teacher/parent scopes and no-write denials survive',async()=>{
  for(const service of ['mastery-evidence','institution-api']){
    const h=harness(service);assert.equal((await h.send(service==='mastery-evidence'?'/sync':'/dashboard/student',{actor:'',...(service==='mastery-evidence'?{body:{attempts:attempts('none','challenge')}}:{})})).status,401);assert.equal(h.writes.length,0);
  }
  const h=harness('mastery-evidence');assert.equal((await h.send(`/classes/${ids.class}`,{actor:'student'})).status,403);assert.equal((await h.send('/sync',{actor:'teacher',body:{attempts:attempts('none','challenge')}})).status,401);
  const institution=harness('institution-api');assert.equal((await institution.send(`/dashboard/student?student_id=${ids.other}`)).status,403);assert.equal((await institution.send(`/dashboard/student?student_id=${ids.other}`,{actor:'parent'})).status,403);assert.equal(institution.writes.length,0);
});
console.log(JSON.stringify({status:'PASS',groups:checks.length,checks,limits:'Actual handlers with synthetic database; no PostgreSQL/production calls. Numeric recomputation and raw stored records preserved.'},null,2));
