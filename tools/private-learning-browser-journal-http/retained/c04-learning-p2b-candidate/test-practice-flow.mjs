// Actual old engine differential proof for the fixed compound commands.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {createLearningTransition,BASELINE_SHA256} from './source/question-bank/js/learning-transition.mjs';
import {validatePracticeFlow as validateFlow,runPracticeFlow as runFlow} from './source/question-bank/js/practice-flow.mjs';
const practiceURL='http://synthetic.invalid/question-bank/practice.html';
const validatePracticeFlow=(value,options={})=>validateFlow(value,{practiceURL,...options});
const runPracticeFlow=(transition,value,options={})=>runFlow(transition,value,{practiceURL,...options});
const here=new URL('./',import.meta.url),baseline=new URL('../c04-learning-candidate/baseline/question-bank/js/learning-system.js',here),bytes=fs.readFileSync(baseline);
const hash=v=>createHash('sha256').update(v).digest('hex'),plain=v=>v===undefined?undefined:JSON.parse(JSON.stringify(v));
assert.equal(hash(bytes),BASELINE_SHA256);
const START=Date.parse('2026-09-02T10:00:00.000Z');
const random=seed=>()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
function original(initial={}){
 const data=new Map(Object.entries(initial).map(([k,v])=>[k,JSON.stringify(v)])),effects=[];
 const c={Date,Math:Object.create(Math),URL,URLSearchParams,Blob,console,location:{search:'',href:'http://synthetic.invalid/question-bank/practice.html'},localStorage:{getItem:k=>data.get(k)??null,setItem(k,v){data.set(k,String(v))},removeItem(k){data.delete(k)}},CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail}},addEventListener(){},dispatchEvent(e){effects.push(plain({type:e.type,detail:e.detail}));return true},document:{createElement(){throw Error('No DOM in arithmetic proof')}},setTimeout(){throw Error('No timers in arithmetic proof')}};
 c.window=c;vm.createContext(c);vm.runInContext(bytes.toString(),c,{filename:'actual-before-P1-learning-system.js'});
 return{environment(at,seed){c.Date=class extends Date{constructor(...args){super(...(args.length?args:[at]))}static now(){return at}};c.Math.random=random(seed)},run:(name,...args)=>c.ECHSLearning[name==='initialize'?'profile':name](...args),state:()=>Object.fromEntries([...data].map(([k,v])=>[k,JSON.parse(v)])),effects};
}
// Separate explicit legacy call sequence, not runPracticeFlow calling itself.
function oldFlow(o,f){
 if(f.action==='start'){let session=o.run('startSession',f.session);const cont={...f.continuation,sessionId:session.id};session=o.run('patchSession',session.id,{questionIds:cont.questionIds,answered:cont.graded,correct:cont.correct,index:cont.index});return{action:f.action,session,continuation:o.run('setContinue',cont),attempt:null}}
 const current=o.run('activeSession',f.sessionId);
 if(f.action==='discard'){o.run('clearContinue');return{action:f.action,session:current,continuation:null,attempt:null}}
 if(f.action==='finish'){const session=o.run('endSession',f.sessionId,f.patch);o.run('clearContinue');return{action:f.action,session,continuation:null,attempt:null}}
 const attempt=f.action==='answer'?o.run('recordAttempt',f.attempt):null;
 return{action:f.action,session:o.run('patchSession',f.sessionId,f.patch),continuation:o.run('setContinue',f.continuation),attempt};
}
const q=(id,privateFields={})=>({id,bank_code:'SYNTHETIC',type:'mcq',prompt_text:'Synthetic affine function',metadata:{difficulty:2},classification:{course_scope:'AP Calculus',ap_unit:1,ap_topic:'1.1',ap_topic_title:'Rates'},...privateFields});
function startFlow(mode='manual',ids=['q1','q2'],count=ids.length){
 const meta={mode,course:'ap-calculus',scope:'lesson',targetId:'ap-calculus:1:1.1',bankCode:'SYNTHETIC',assignmentId:'synthetic-assignment',targetCount:count};
 return{action:'start',session:{type:'practice',...meta,unit:'1',topic:'1.1',title:'Synthetic assignment',bundleLabel:'Rates',questionIds:ids},continuation:{type:'practice',...meta,label:'Practice · Rates',url:'http://synthetic.invalid/question-bank/practice.html?resume=1&x=1&x=2&bank=SYNTHETIC&assignment=synthetic-assignment',questionIds:ids,index:0,correct:0,graded:0,answeredIds:[]}};
}
function resume(result){const c=plain(result.continuation);delete c.schemaVersion;delete c.updatedAt;return c}
function patch(c){return{questionIds:c.questionIds,answered:c.graded,correct:c.correct,index:c.index}}
function answer(result,id,correct){const c=resume(result);c.graded++;if(correct)c.correct++;c.answeredIds.push(id);return{action:'answer',sessionId:result.session.id,attempt:{question:q(id),correct,response:correct?'B':'A',durationMs:875,mode:c.mode,sessionId:c.sessionId,context:{course:c.course,unit:'1',topic:'1.1',assignmentId:c.assignmentId}},patch:patch(c),continuation:c}}
let comparisons=0;
function pair(){const old=original();let state={},step=0;old.environment(START,1);old.run('initialize');state=old.state();return{call(flow){const at=START+(++step)*1000,seed=29+step;old.environment(at,seed);const before=old.effects.length,expected=oldFlow(old,plain(flow)),t=createLearningTransition(state,{at,seed}),actual=runPracticeFlow(t,flow);assert.deepEqual(plain(actual),plain(expected),'Every return field');assert.deepEqual(t.state(),old.state(),'Every stored field');assert.deepEqual(t.effects(),old.effects.slice(before),'Every original effect');state=t.state();comparisons++;return actual},state:()=>structuredClone(state)}}
const results=[];function test(name,fn){try{fn();results.push({name,status:'PASS'})}catch(error){results.push({name,status:'FAIL',error:String(error.stack||error)})}}
test('Start preserves original generated IDs and all route/bank/assignment metadata',()=>{
 const p=pair(),r=p.call(startFlow());assert.equal(r.session.scope,'lesson');assert.equal(r.session.targetId,'ap-calculus:1:1.1');assert.equal(r.session.bankCode,'SYNTHETIC');assert.equal(r.session.id,r.continuation.sessionId);assert.match(r.continuation.url,/x=1&x=2/);assert.equal(r.session.answered,0);
});
test('Manual, review and mistakes preserve correct/incorrect/zero evidence, review timing and finish',()=>{
 for(const mode of ['manual','review','mistakes'])for(const values of [[true,true],[false,false],[false,true]]){
  const p=pair();let r=p.call(startFlow(mode));r=p.call(answer(r,'q1',values[0]));const c=resume(r);c.index=1;r=p.call({action:'checkpoint',sessionId:r.session.id,patch:patch(c),continuation:c});r=p.call(answer(r,'q2',values[1]));const score=values.filter(Boolean).length*50;
  r=p.call({action:'finish',sessionId:r.session.id,patch:{questionIds:r.session.questionIds,answered:2,correct:values.filter(Boolean).length,score,course:'ap-calculus',unit:'1',topic:'1.1',assignmentId:'synthetic-assignment'}});
  assert.equal(r.session.score,score);assert.equal(r.continuation,null);const t=createLearningTransition(p.state(),{at:START,seed:2});assert.equal(t.run('summary').verified_mastery,false);assert.equal(t.run('summary').accuracy,score);assert.equal(t.run('attempts').length,2);
 }
});
test('Adaptive append, Back and repeated checkpoint preserve the original sequence',()=>{
 const p=pair();let r=p.call(startFlow('adaptive',['q1'],3));r=p.call(answer(r,'q1',false));let c=resume(r);c.questionIds.push('q2');c.index=1;r=p.call({action:'checkpoint',sessionId:r.session.id,patch:patch(c),continuation:c});r=p.call(answer(r,'q2',true));c=resume(r);c.index=0;r=p.call({action:'checkpoint',sessionId:r.session.id,patch:patch(c),continuation:c});r=p.call({action:'checkpoint',sessionId:r.session.id,patch:patch(resume(r)),continuation:resume(r)});assert.deepEqual(r.continuation.answeredIds,['q1','q2']);assert.equal(r.continuation.index,0);
});
test('Ungraded finish retains null score and discard retains the original active session',()=>{
 const p=pair();let r=p.call(startFlow());r=p.call({action:'finish',sessionId:r.session.id,patch:{questionIds:r.session.questionIds,answered:0,correct:0,score:null}});assert.equal(r.session.score,null);assert.equal(p.state().echs_learning_events_v2,undefined);
 r=p.call(startFlow());r=p.call({action:'discard',sessionId:r.session.id});assert.equal(r.session.status,'active');assert.equal(r.continuation,null);
});
test('Closed inputs reject getters, inherited fields, cycles, credentials and impossible progress before effects',()=>{
 let touched=0;const getter={action:'start',get session(){touched++;return{}},continuation:{}};
 for(const value of [getter,{...startFlow(),authority:{}},Object.create(startFlow()),{...startFlow(),token:'not-a-token'},{...startFlow(),continuation:{...startFlow().continuation,graded:1,answeredIds:['q1']}}, {...startFlow(),session:{...startFlow().session,questionIds:['q1','q1']}}])assert.throws(()=>validatePracticeFlow(value));
 const cycle=startFlow();cycle.session.loop=cycle;assert.throws(()=>validatePracticeFlow(cycle));assert.equal(touched,0);
 const large=startFlow();large.session.title='x'.repeat(4194305);assert.throws(()=>validatePracticeFlow(large));const deep=startFlow();let d=deep;for(let i=0;i<30;i++)d=d.extra={};assert.throws(()=>validatePracticeFlow(deep));
 const original=startFlow(),clean=validatePracticeFlow(original);clean.session.title='Changed';assert.equal(original.session.title,'Synthetic assignment');
});
test('Wrong session, scope, duplicated answer and forged counters leave the input snapshot unchanged',()=>{
 const p=pair();let r=p.call(startFlow());const snapshot=p.state();const bad=[];const a=answer(r,'q1',true);bad.push({...a,sessionId:'missing'});const scope=structuredClone(a);scope.continuation.bankCode='other';bad.push(scope);const counts=structuredClone(a);counts.patch.correct=0;counts.continuation.correct=0;bad.push(counts);const wrongAssignment=structuredClone(a);wrongAssignment.attempt.context.assignmentId='other';bad.push(wrongAssignment);const replaced=structuredClone(a);replaced.continuation.questionIds=['q1','q3'];replaced.patch.questionIds=['q1','q3'];bad.push(replaced);
 for(const flow of bad){const t=createLearningTransition(snapshot,{at:START,seed:3});assert.throws(()=>runPracticeFlow(t,flow));assert.deepEqual(t.state(),snapshot);assert.deepEqual(t.effects(),[])}
 r=p.call(a);const twice=answer(r,'q1',true);assert.throws(()=>runPracticeFlow(createLearningTransition(p.state(),{at:START,seed:4}),twice));
 const before=p.state(),c=resume(r);c.answeredIds=[];c.graded=0;c.correct=0;assert.throws(()=>runPracticeFlow(createLearningTransition(before,{at:START,seed:5}),{action:'checkpoint',sessionId:r.session.id,patch:patch(c),continuation:c}));assert.deepEqual(p.state(),before);
});
test('Complete private metadata is immutable input to the first attempt, without solution payload persistence',()=>{
 const t=createLearningTransition({}, {at:START,seed:7});t.run('initialize');const started=runPracticeFlow(t,startFlow());const flow=answer(started,'q1',false);flow.attempt.question={...q('q1'),_private_bank:true,_staff_only:true,skill_key:'ap:1.1',trust_tier:'publisher_key_direct',metadata:{alignment_status:'explicit-map'},solution_html:'Synthetic protected solution'};
 const result=runPracticeFlow(t,flow);assert.equal(result.attempt.skill_key,'ap:1.1');assert.equal(result.attempt.bankCode,'SYNTHETIC');assert.equal(result.attempt.assignmentId,'synthetic-assignment');assert.equal(result.attempt.staff_review_only,true);assert.ok(!JSON.stringify(t.state()).includes('Synthetic protected solution'));assert.deepEqual(t.effects().find(e=>e.type==='echs:learning-attempt').detail,result.attempt);assert.equal(t.run('summary').verified_mastery,false);
});
test('Adaptive numerical selection and score/review outputs remain the actual old formulas after composite actions',()=>{
 const p=pair();let r=p.call(startFlow('adaptive'));r=p.call(answer(r,'q1',false));const old=original(p.state());old.environment(START+5000,97);const t=createLearningTransition(p.state(),{at:START+5000,seed:97}),pool=Array.from({length:15},(_,i)=>q('candidate'+i));for(const method of ['masteryMap','reviewMap','summary','weakTopics'])assert.deepEqual(plain(t.run(method)),plain(old.run(method)));assert.deepEqual(t.run('selectAdaptive',[pool,8,{lastCorrect:false}]),plain(old.run('selectAdaptive',pool,8,{lastCorrect:false})));assert.deepEqual(t.state(),old.state());comparisons+=5;
});
await test('Continuation URLs bind the trusted canonical practice route including repository prefix',()=>{
 const canonical='https://synthetic.invalid/ECHS-Math/question-bank/practice.html';
 for(const url of ['practice.html?resume=1','./practice.html?resume=1',canonical+'?resume=1','/ECHS-Math/question-bank/practice.html?resume=1']){const value=startFlow();value.continuation.url=url;assert.equal(validatePracticeFlow(value,{practiceURL:canonical}).continuation.url,url)}
 for(const url of ['https://external.invalid/ECHS-Math/question-bank/practice.html','//synthetic.invalid/ECHS-Math/question-bank/practice.html','//external.invalid/practice.html','http://synthetic.invalid/ECHS-Math/question-bank/practice.html','/question-bank/practice.html','../other/practice.html','https://user@synthetic.invalid/ECHS-Math/question-bank/practice.html','javascript:alert(1)',' '+canonical]){const value=startFlow();value.continuation.url=url;assert.throws(()=>validatePracticeFlow(value,{practiceURL:canonical}),e=>e.code==='invalid_practice')}
});
const report={contract:'echs.c04.p2.practice-flow-tests.v1',status:results.every(x=>x.status==='PASS')?'PASS':'FAIL',groups:results.length,comparisons,baseline_sha256:BASELINE_SHA256,source_sha256:hash(fs.readFileSync(new URL('source/question-bank/js/practice-flow.mjs',here))),results,active_source_edits:0,network_calls:0,limits:['Pure compound transitions against actual pinned old engine. Native transaction/UI adoption is separately unverified by this suite.','Private metadata before immutable commit is an intentional P1 delta, not authenticated grading.']};
const flag=process.argv.indexOf('--report');if(flag>=0)fs.writeFileSync(process.argv[flag+1],JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report,null,2));if(report.status!=='PASS')process.exitCode=1;
