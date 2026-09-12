import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {chromium} from '../../foundations/question-bank/official/tools/node_modules/playwright/index.mjs';
import {createPracticeAtomicFixture,A,B} from './practice-atomic-fixture.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const harness=['practice-atomic-fixture.mjs','test-practice-atomic.mjs'].map(path=>({path,sha256:sha(readFileSync(new URL(path,import.meta.url)))}));
const host=await createPracticeAtomicFixture(),outside=[],pageErrors=[],cases=[],results=[];
const browser=await chromium.launch({headless:true,executablePath:process.env.ECHS_CHROMIUM_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-proxy-server','--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1']});
const test=(name,run)=>cases.push({name,run});
async function context(){const c=await browser.newContext();await c.route('**/*',r=>new URL(r.request().url()).origin===host.origin?r.continue():(outside.push(r.request().url()),r.abort()));return c}
async function page(c){const p=await c.newPage();p.on('pageerror',e=>pageErrors.push(String(e)));await p.goto(host.origin+'/candidate/',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.fixtureReady);return p}
async function sign(p,session=host.session()){await p.evaluate(s=>ECHSInstitution.setSession(s,true),session)}
async function open(p){return(await p.evaluate(()=>fixture.create({notifications:false}))).handle}
async function dump(p){return p.evaluate(()=>fixture.dump())}
async function prepare(p,h,flow){return p.evaluate(({h,flow})=>fixture.prepare(h,'practice',[flow]),{h,flow})}
async function commit(p,h,i){return p.evaluate(({h,i})=>fixture.commit(h,i),{h,i})}
async function code(p,h,i){return p.evaluate(async({h,i})=>{try{return{ok:true,receipt:await fixture.commit(h,i)}}catch(e){return{ok:false,code:e.code}}},{h,i})}
async function current(p,h){return p.evaluate(h=>{const c=handles[h].getContinue();return{continuation:c,session:c?handles[h].activeSession(c.sessionId):null}},h)}
async function pair(){const c=await context(),p=await page(c),q=await page(c);await sign(p);const a=await open(p);await q.waitForFunction(id=>ECHSInstitution.account()?.id===id,A.id);const b=await open(q);await p.evaluate(h=>handles[h].refresh(),a);return{c,p,q,a,b}}
function start(){const meta={mode:'manual',course:'ap-calculus',scope:'lesson',targetId:'ap:1:1.1',bankCode:'SYNTHETIC',assignmentId:'assignment-synthetic',targetCount:2};return{action:'start',session:{type:'practice',...meta,unit:'1',topic:'1.1',questionIds:['q1','q2']},continuation:{type:'practice',...meta,label:'Synthetic rates',url:'practice.html?course=ap-calculus&scope=lesson&target=ap%3A1%3A1.1&bank=SYNTHETIC',questionIds:['q1','q2'],index:0,correct:0,graded:0,answeredIds:[]}}}
function cont(value){const c=structuredClone(value.continuation);delete c.schemaVersion;delete c.updatedAt;return c}
const patch=c=>({questionIds:c.questionIds,answered:c.graded,correct:c.correct,index:c.index});
function answer(value,id='q1',correct=true){const c=cont(value);c.graded++;if(correct)c.correct++;c.answeredIds.push(id);return{action:'answer',sessionId:c.sessionId,attempt:{question:{id,bank_code:'SYNTHETIC',type:'mcq',_private_bank:true,_staff_only:true,skill_key:'ap:1.1',trust_tier:'publisher_key_direct',metadata:{alignment_status:'explicit-map'},classification:{course_scope:'AP Calculus',ap_unit:1,ap_topic:'1.1'},solution_html:'Synthetic excluded solution'},correct,response:'B',mode:c.mode,sessionId:c.sessionId,durationMs:850,context:{course:c.course,unit:'1',topic:'1.1',assignmentId:c.assignmentId}},patch:patch(c),continuation:c}}
async function begin(p,h){const i=await prepare(p,h,start());return(await commit(p,h,i.index)).result}
async function hold(p){await p.evaluate(()=>fixture.hold());await p.waitForFunction(()=>lockActive)}
async function release(p){await p.evaluate(()=>{lockReleased=true});await p.evaluate(()=>lockDone)}
async function pending(p){await p.waitForFunction(()=>window.pendingResult!==undefined);return p.evaluate(()=>pendingResult)}

test('A compound answer commits full attempt, session, resume, history and all pending records once',async()=>{
 const c=await context();try{const p=await page(c);await sign(p);const h=await open(p),s=await begin(p,h),i=await prepare(p,h,answer(s));const before=await dump(p),receipt=await commit(p,h,i.index),data=await dump(p);
 assert.equal(receipt.durability,'committed');assert.equal(data.commands.length,before.commands.length+1);assert.equal(receipt.result.session.answered,1);assert.equal(receipt.result.continuation.graded,1);assert.equal(receipt.result.attempt.skill_key,'ap:1.1');assert.equal(receipt.result.attempt.staff_review_only,true);
 const state=data.states[0].data;assert.equal(state.echs_learning_events_v2.length,1);assert.equal(state.echs_learning_sessions_v2[0].answered,1);assert.equal(state.echs_learning_continue_v2.graded,1);assert.equal(data.history.length,1);assert.equal(data.attempts.length,1);for(const kind of ['attempts','sessions','review','mastery'])assert.equal(data.records.filter(x=>x.kind===kind).length,1);
 assert.ok(!JSON.stringify(data).includes('Synthetic excluded solution'));assert.ok(!JSON.stringify(data).includes('synthetic-a'));assert.equal(await p.evaluate(h=>handles[h].summary().verified_mastery,h),false);
 }finally{await c.close()}
});
test('Start, answer, checkpoint, finish and discard each abort atomically after request success and retry exactly',async()=>{
 const c=await context();try{const p=await page(c);await sign(p);const h=await open(p);
 for(const action of ['start','answer','checkpoint','finish','discard']){
  let flow;if(action==='start')flow=start();else{const s=await current(p,h);if(action==='answer')flow=answer(s);else if(action==='checkpoint'){const c=cont(s);c.index=1;flow={action,sessionId:c.sessionId,patch:patch(c),continuation:c}}else if(action==='finish')flow={action,sessionId:s.session.id,patch:{questionIds:s.session.questionIds,answered:s.session.answered,correct:s.session.correct,score:100}};else flow={action,sessionId:s.session.id}}
  const i=await prepare(p,h,flow),before=await dump(p),effects=await p.evaluate(()=>window.effects.length);await p.evaluate(()=>fixture.failCommandOnce());assert.equal((await code(p,h,i.index)).code,'storage_error');assert.equal(await p.evaluate(()=>abortedAfterRequestSuccess),true);assert.deepEqual(await dump(p),before);assert.equal(await p.evaluate(()=>window.effects.length),effects);assert.equal((await commit(p,h,i.index)).durability,'committed');if(action==='finish')await begin(p,h);
 }
 }finally{await c.close()}
});
test('Lost acknowledgement lookup and identical retry preserve a single answer and complete metadata',async()=>{
 const c=await context();try{const p=await page(c);await sign(p);const h=await open(p),s=await begin(p,h),i=await prepare(p,h,answer(s));const first=await commit(p,h,i.index),before=await dump(p),effects=await p.evaluate(()=>window.effects.length);const looked=await p.evaluate(async({h,id})=>handles[h].lookup(id),{h,id:first.operation_id});assert.equal(looked.result.attempt.id,first.result.attempt.id);const retry=await commit(p,h,i.index);assert.equal(retry.duplicate,true);assert.deepEqual(await dump(p),before);assert.equal(await p.evaluate(()=>window.effects.length),effects);
 assert.equal(await p.evaluate(async({h,i})=>{const changed=structuredClone(intents[i]);changed.args[0].attempt.response='A';try{await handles[h].commit(changed);return'accepted'}catch(e){return e.code}},{h,i:i.index}),'operation_conflict');
 }finally{await c.close()}
});
test('Two real tabs answering the same revision have one atomic winner and no lost mutable continuation',async()=>{
 const {c,p,q,a,b}=await pair();try{const s=await begin(p,a);await q.evaluate(h=>handles[h].refresh(),b);const left=await prepare(p,a,answer(s,'q1',true)),right=await prepare(q,b,answer(s,'q1',false));const values=await Promise.all([code(p,a,left.index),code(q,b,right.index)]);assert.equal(values.filter(v=>v.ok).length,1);assert.equal(values.find(v=>!v.ok).code,'state_conflict');await p.evaluate(h=>handles[h].refresh(),a);const data=await dump(p),r=await current(p,a);assert.equal(data.history.length,1);assert.equal(data.records.filter(r=>r.kind==='attempts').length,1);assert.equal(r.session.answered,1);assert.equal(r.continuation.graded,1);assert.deepEqual(r.continuation.answeredIds,['q1']);
 }finally{await c.close()}
});
test('Pending answer offers no success or private callback before the native transaction completes',async()=>{
 const {c,p,q,a}=await pair();try{const s=await begin(p,a),i=await prepare(p,a,answer(s)),effects=await p.evaluate(()=>window.effects.length),n=await p.evaluate(()=>transactions);await hold(q);await p.evaluate(({h,i})=>fixture.start(()=>fixture.commit(h,i)),{h:a,i:i.index});await p.waitForFunction(n=>transactions>n,n);await p.waitForTimeout(80);assert.equal(await p.evaluate(()=>pendingResult),undefined);assert.equal(await p.evaluate(()=>window.effects.length),effects);assert.equal((await current(p,a)).session.answered,0);await release(q);assert.equal((await pending(p)).value.durability,'committed');assert.equal((await current(p,a)).session.answered,1);
 }finally{await c.close()}
});
test('Account switch during queued answer aborts old state; fresh B and legitimate return to A remain separate',async()=>{
 const {c,p,q,a}=await pair();try{const s=await begin(p,a),i=await prepare(p,a,answer(s));await hold(q);await p.evaluate(({h,i})=>fixture.start(()=>fixture.commit(h,i)),{h:a,i:i.index});await p.waitForTimeout(60);await sign(p,host.session(B,'synthetic-b'));assert.equal((await pending(p)).ok,false);assert.equal(await p.locator('#profile').textContent(),'');await release(q);const b=await open(p);assert.equal((await current(p,b)).continuation,null);await sign(p);const returned=await open(p),old=await current(p,returned);assert.equal(old.session.id,s.session.id);assert.equal(old.session.answered,0);assert.equal((await dump(p)).history.length,0);
 }finally{await c.close()}
});
test('A tab crash during an answer retains all compound data or none and a stable operation lookup',async()=>{
 const {c,p,q,a,b}=await pair();try{const s=await begin(p,a),i=await prepare(p,a,answer(s));await hold(q);await p.evaluate(({h,i})=>fixture.start(()=>fixture.commit(h,i)),{h:a,i:i.index});await p.waitForTimeout(60);await p.close();await release(q);await q.evaluate(h=>handles[h].refresh(),b);const data=await dump(q),s2=await current(q,b),count=data.history.length;assert.ok(count===0||count===1);assert.equal(data.attempts.length,count);assert.equal(data.records.filter(r=>r.kind==='attempts').length,count);assert.equal(s2.session.answered,count);assert.equal(s2.continuation.graded,count);const found=await q.evaluate(async({h,id})=>handles[h].lookup(id),{h:b,id:i.value.operation_id});assert.equal(Boolean(found),count===1);
 }finally{await c.close()}
});
test('Duplicate question and wrong scope refuse without mutation; zero and ungraded finish stay distinct',async()=>{
 const c=await context();try{const p=await page(c);await sign(p);const h=await open(p),s=await begin(p,h);let i=await prepare(p,h,answer(s,'q1',false));const receipt=await commit(p,h,i.index),before=await dump(p);const wrong=answer(receipt.result,'q2',true);wrong.continuation.bankCode='other';i=await prepare(p,h,wrong);assert.equal((await code(p,h,i.index)).code,'practice_scope_conflict');assert.deepEqual(await dump(p),before);const f={action:'finish',sessionId:s.session.id,patch:{questionIds:['q1','q2'],answered:1,correct:0,score:0}};i=await prepare(p,h,f);assert.equal((await commit(p,h,i.index)).result.session.score,0);const empty=await begin(p,h);i=await prepare(p,h,{action:'finish',sessionId:empty.session.id,patch:{questionIds:['q1','q2'],answered:0,correct:0,score:null}});assert.equal((await commit(p,h,i.index)).result.session.score,null);
 }finally{await c.close()}
});
test('Compound commands remain transport-held and never rewrite any old raw queue or trigger uploader events',async()=>{
 const c=await context();try{const p=await page(c),raw={echs_qbank_attempts_v20:'[{"id":"other"}]',echs_learning_events_v2:'[{"id":"other"}]',echs_math_complete:'["other::1::1.1::Other"]'};await p.evaluate(raw=>Object.entries(raw).forEach(([k,v])=>localStorage.setItem(k,v)),raw);await sign(p);const h=await open(p),s=await begin(p,h),i=await prepare(p,h,answer(s));await commit(p,h,i.index);assert.deepEqual(await p.evaluate(h=>handles[h].sync(),h),{status:'held',reason:'versioned_sync_required',uploaded:0,acknowledged:0});assert.deepEqual(await p.evaluate(keys=>Object.fromEntries(keys.map(k=>[k,localStorage.getItem(k)])),Object.keys(raw)),raw);assert.deepEqual(await p.evaluate(()=>rawEvents),[]);await p.waitForTimeout(1300);assert.deepEqual(host.requests.filter(r=>/sync/.test(r.path)),[]);
 }finally{await c.close()}
});
let version;try{version=browser.version();for(const test of cases){try{await test.run();results.push({name:test.name,status:'PASS'});console.log('PASS '+test.name)}catch(error){results.push({name:test.name,status:'FAIL',error:String(error.stack||error)});console.log('FAIL '+test.name+' '+error.message)}}}finally{await browser.close();await host.close()}
const unchanged=host.unchanged()&&harness.every(r=>r.sha256===sha(readFileSync(new URL(r.path,import.meta.url))));
const report={contract:'echs.c04.p2.practice-atomic-browser.v1',status:results.every(r=>r.status==='PASS')&&!outside.length&&!pageErrors.length&&!host.unexpected.length&&unchanged?'PASS':'FAIL',groups:results.length,results,browser:version,requests:host.requests.length,outside,pageErrors,unexpected:host.unexpected,sources:host.sources(),harness_sources:harness,source_unchanged:unchanged,active_source_edits:0,limits:['Actual native IndexedDB/canonical client/compound flow acceptance with synthetic fixture controls; production mapped-page control integration is not tested here.','Remote effects held; no server CAS, active adoption or authenticated grading claimed.']};
const flag=process.argv.indexOf('--report');if(flag>=0)writeFileSync(process.argv[flag+1],JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report,null,2));if(report.status!=='PASS')process.exitCode=1;
