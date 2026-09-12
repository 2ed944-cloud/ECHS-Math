// Isolated P2a: fixed sequences of the original engine transitions, never caller code.
export const PRACTICE_FLOW_CONTRACT='echs.learning.practice-flow.v1';
export class PracticeFlowError extends Error{constructor(code){super('Practice action unavailable: '+code);this.name='PracticeFlowError';this.code=code}}
const fail=code=>{throw new PracticeFlowError(code)};
const forbidden=new Set(['__proto__','prototype','constructor','token','access_token','refresh_token','authorization','password','service_key','serviceKey']);
const enc=new TextEncoder();
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function input(value){
 let nodes=0,bytes=0;const seen=new Set();
 function visit(v,depth){
  if(++nodes>100000||depth>24)fail('practice_bounds');
  if(v===null||typeof v==='boolean'||typeof v==='string'||typeof v==='number'){
   if(typeof v==='number'&&!Number.isFinite(v))fail('invalid_practice');
   bytes+=enc.encode(JSON.stringify(v)).length;if(bytes>4194304)fail('practice_bounds');return v;
  }
  const array=Array.isArray(v);if(!v||typeof v!=='object'||seen.has(v)||Object.getPrototypeOf(v)!==(array?Array.prototype:Object.prototype))fail('invalid_practice');
  const keys=Reflect.ownKeys(v),descriptors=Object.getOwnPropertyDescriptors(v);
  if(keys.length>100000||keys.some(k=>typeof k!=='string'||forbidden.has(k))||(array&&(keys.length!==v.length+1||v.length>100000)))fail('invalid_practice');
  seen.add(v);const result=array?[]:{};bytes+=2;
  for(const key of keys){if(array&&key==='length')continue;const d=descriptors[key];if(!Object.hasOwn(d,'value')||!d.enumerable||(array&&(!/^(0|[1-9][0-9]*)$/.test(key)||Number(key)>=v.length)))fail('invalid_practice');bytes+=enc.encode(JSON.stringify(key)).length+2;if(bytes>4194304)fail('practice_bounds');result[key]=visit(d.value,depth+1)}
  seen.delete(v);return result;
 }
 return visit(value,0);
}
function object(value,required,optional=[]){if(!value||typeof value!=='object'||Array.isArray(value)||required.some(k=>!Object.hasOwn(value,k))||Object.keys(value).some(k=>![...required,...optional].includes(k)))fail('invalid_practice')}
function text(value,{empty=false,max=4096}={}){if(typeof value!=='string'||(!empty&&!value)||value.length>max)fail('invalid_practice')}
function id(value){if(!(typeof value==='string'&&value.length>0&&value.length<=256)&&!(Number.isSafeInteger(value)&&value>=0))fail('invalid_practice');return String(value)}
function ids(value){if(!Array.isArray(value)||value.length>1000)fail('invalid_practice');const result=value.map(id);if(new Set(result).size!==result.length)fail('invalid_practice');return result}
function count(value){if(!Number.isSafeInteger(value)||value<0||value>1000)fail('invalid_practice')}
const SESSION_FIELDS=['type','mode','questionIds','targetCount','bundleId','bundleLabel','assignmentId','title','course','unit','topic','scope','targetId','bankCode'];
const CONTINUATION_FIELDS=['type','label','url','targetId','course','scope','mode','questionIds','index','targetCount','correct','graded','answeredIds','sessionId','assignmentId','bankCode','bundleId','group'];
const PATCH_FIELDS=['questionIds','answered','correct','index','score','assignmentId','course','unit','topic'];
function optionalMetadata(value){
 for(const key of ['type','mode','label','bundleId','bundleLabel','targetId','bankCode','assignmentId','title','course','topic','scope','group'])if(value[key]!==undefined&&value[key]!==null)text(value[key],{empty:true,max:key==='label'||key==='title'||key==='bundleLabel'?2000:256});
 if(value.unit!==undefined&&value.unit!==null&&!(typeof value.unit==='string'&&value.unit.length<=256)&&!Number.isSafeInteger(value.unit))fail('invalid_practice');
 if(value.mode!==undefined&&!['manual','adaptive','review','mistakes'].includes(value.mode))fail('invalid_practice');
 if(value.scope!==undefined&&value.scope!==null&&!['course','unit','lesson','assignment'].includes(value.scope))fail('invalid_practice');
}
function continuation(value,sessionId,practiceURL){
 object(value,['type','label','url','questionIds','index','targetCount','correct','graded','answeredIds'],CONTINUATION_FIELDS);
 if(value.type!=='practice')fail('invalid_practice');optionalMetadata(value);text(value.url);text(value.label,{empty:true,max:2000});
 let route,canonical;try{canonical=new URL(practiceURL);route=new URL(value.url,canonical)}catch{fail('invalid_practice')}
 if(!['http:','https:'].includes(canonical.protocol)||canonical.username||canonical.password||!canonical.pathname.endsWith('/question-bank/practice.html')||
   /^[\\/]{2}/.test(value.url)||/[\u0000-\u0020\u007f\\]/.test(value.url)||route.origin!==canonical.origin||route.pathname!==canonical.pathname||route.username||route.password)fail('invalid_practice');
 const questions=ids(value.questionIds),answered=ids(value.answeredIds);for(const n of ['index','targetCount','correct','graded'])count(value[n]);
 if(!questions.length||value.targetCount<questions.length||value.index>=questions.length||value.correct>value.graded||value.graded!==answered.length||answered.some(q=>!questions.includes(q)))fail('invalid_practice');
 if(sessionId===null){if(Object.hasOwn(value,'sessionId'))fail('invalid_practice')}
 else if(value.sessionId!==sessionId)fail('practice_session_conflict');
 return value;
}
function patch(value,cont){
 object(value,['questionIds','answered','correct'],PATCH_FIELDS);ids(value.questionIds);count(value.answered);count(value.correct);optionalMetadata(value);
 if(value.correct>value.answered)fail('invalid_practice');if(value.index!==undefined)count(value.index);
 if(value.score!==undefined&&value.score!==null&&(!Number.isFinite(value.score)||value.score<0||value.score>100))fail('invalid_practice');
 if(cont&&(!equal(value.questionIds,cont.questionIds)||value.answered!==cont.graded||value.correct!==cont.correct||value.index!==cont.index))fail('invalid_practice');
}
export function validatePracticeFlow(value,{practiceURL='https://candidate.invalid/question-bank/practice.html'}={}){
 const v=input(value);if(!v||!['start','answer','checkpoint','finish','discard'].includes(v.action))fail('invalid_practice');
 if(v.action==='start'){
  object(v,['action','session','continuation']);object(v.session,['type','questionIds'],SESSION_FIELDS);optionalMetadata(v.session);ids(v.session.questionIds);
  if(v.session.type!=='practice')fail('invalid_practice');if(v.session.targetCount!==undefined)count(v.session.targetCount);
  continuation(v.continuation,null,practiceURL);if(!equal(v.session.questionIds,v.continuation.questionIds))fail('invalid_practice');
  if(v.continuation.index!==0||v.continuation.graded!==0||v.continuation.correct!==0||v.continuation.answeredIds.length)fail('invalid_practice');
  for(const key of ['course','scope','targetId','bankCode','assignmentId','mode','targetCount'])if(v.session[key]!==v.continuation[key])fail('invalid_practice');
 }else{
  const extras=v.action==='answer'?['attempt','patch','continuation']:v.action==='checkpoint'?['patch','continuation']:v.action==='finish'?['patch']:[];
  object(v,['action','sessionId',...extras]);text(v.sessionId,{max:256});
  if(v.continuation)continuation(v.continuation,v.sessionId,practiceURL);if(v.patch)patch(v.patch,v.continuation);
  if(v.action==='answer'){
   object(v.attempt,['question','correct','response','mode','sessionId','context'],['durationMs']);
   object(v.attempt.context,[],['course','unit','topic','assignmentId']);
   if(!v.attempt.question||typeof v.attempt.question!=='object'||Array.isArray(v.attempt.question))fail('invalid_practice');
   const qid=id(v.attempt.question.id);if(typeof v.attempt.correct!=='boolean'||typeof v.attempt.response!=='string'||v.attempt.sessionId!==v.sessionId||v.attempt.mode!==v.continuation.mode||!ids(v.continuation.answeredIds).includes(qid))fail('invalid_practice');
   if(v.attempt.durationMs!==undefined&&v.attempt.durationMs!==null&&(!Number.isFinite(v.attempt.durationMs)||v.attempt.durationMs<0))fail('invalid_practice');
  }
 }
 return v;
}
export function runPracticeFlow(transition,value,options={}){
 const flow=validatePracticeFlow(value,options),run=(name,...args)=>transition.run(name,args);
 if(flow.action==='start'){
  let session=run('startSession',flow.session);
  const resume={...flow.continuation,sessionId:session.id};
  session=run('patchSession',session.id,{questionIds:resume.questionIds,answered:resume.graded,correct:resume.correct,index:resume.index});
  return{action:flow.action,session,continuation:run('setContinue',resume),attempt:null};
 }
 const existing=run('activeSession',flow.sessionId),prior=run('getContinue');
 if(!existing||prior?.sessionId!==flow.sessionId)fail('practice_session_conflict');
 if(flow.continuation)for(const key of ['course','scope','targetId','bankCode','assignmentId','mode','targetCount'])if(flow.continuation[key]!==prior[key])fail('practice_scope_conflict');
 if(flow.action==='discard'){run('clearContinue');return{action:flow.action,session:existing,continuation:null,attempt:null}}
 const priorQuestions=(prior.questionIds||[]).map(String),nextQuestions=flow.patch.questionIds.map(String);
 if(!equal(nextQuestions,priorQuestions)&&!(flow.action==='checkpoint'&&prior.mode==='adaptive'&&nextQuestions.length>priorQuestions.length&&nextQuestions.length<=prior.targetCount&&equal(nextQuestions.slice(0,priorQuestions.length),priorQuestions)))fail('practice_scope_conflict');
 for(const key of ['course','unit','topic','assignmentId'])if(Object.hasOwn(flow.patch,key)&&flow.patch[key]!==existing[key])fail('practice_scope_conflict');
 if(flow.continuation){
  const previous=(prior.answeredIds||[]).map(String),next=flow.continuation.answeredIds.map(String);
  const expected=flow.action==='answer'?[...previous,String(flow.attempt.question.id)]:previous;
  if(!equal(next,expected))fail('practice_progress_conflict');
 }
 let attempt=null;
 if(flow.action==='answer'){
  if((prior.answeredIds||[]).map(String).includes(String(flow.attempt.question.id)))fail('practice_answered');
  if(!(prior.questionIds||[]).map(String).includes(String(flow.attempt.question.id)))fail('practice_scope_conflict');
  if(flow.patch.answered!==Number(existing.answered||0)+1||flow.patch.correct!==Number(existing.correct||0)+(flow.attempt.correct?1:0))fail('practice_progress_conflict');
  for(const key of ['course','assignmentId'])if(flow.attempt.context[key]!==existing[key])fail('practice_scope_conflict');
  attempt=run('recordAttempt',flow.attempt);
 }else if(flow.patch.answered!==Number(existing.answered||0)||flow.patch.correct!==Number(existing.correct||0))fail('practice_progress_conflict');
 if(flow.action==='finish'){
  const session=run('endSession',flow.sessionId,flow.patch);run('clearContinue');return{action:flow.action,session,continuation:null,attempt:null};
 }
 return{action:flow.action,session:run('patchSession',flow.sessionId,flow.patch),continuation:run('setContinue',flow.continuation),attempt};
}
