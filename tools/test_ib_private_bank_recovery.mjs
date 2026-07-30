import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source=await readFile(new URL('../question-bank/js/mapped-private-bank-practice.js',import.meta.url),'utf8');
const requests=[];
const option={value:'course:ib-math-ai',textContent:'IB Math AI · Uploaded Banks (0)'};
const documentElement={dataset:{}};
const access={authenticated:true,role:'admin',current:{role:'admin'},allCourses:true,courseKeys:[]};
const rows=[{
  bank_code:'ECHS-BB-AT9',trust_tier:'publisher_key_direct',student_visible:true,mapping_verified:true,
  course_mappings:[
    {course:'ap-precalculus',unit:0,lesson_key:'readiness',lesson_title:'Readiness',skill_key:'APPC.READINESS',mapping_verified:true},
    {course:'ib-math-ai',unit:1,lesson_key:'u1-standard-form',lesson_title:'Scientific notation',skill_key:'IBAI.U1.NUMBER',mapping_verified:true}
  ],
  payload:{id:'IB-RECOVERY-001',bank_code:'ECHS-BB-AT9',type:'mcq',prompt_html:'<p>Recovery question</p>',source:{source_content_fingerprint:'recovery-1'}}
}];
const elements={bundle:{options:[option]}};
const ECHSBank={
  async loadBundle(){return[{id:'AP-STATIC-001',bank_code:'ADAMS10',source:{source_content_fingerprint:'ap-static'}}];},
  bankLabel(code){return code;}
};
const ECHSLearning={recordAttempt(payload){return payload;}};
const context={
  console,URLSearchParams,location:{search:''},
  document:{documentElement,getElementById(id){return elements[id]||null;}},
  ECHSBank,ECHSLearning,
  ECHSPortalAccess:{ready:Promise.resolve(access),current:access,normaliseCourseKey:value=>String(value||'')},
  ECHSInstitution:{async api(service,path){
    requests.push({service,path});
    if(service==='practice-bank-api')throw new Error('strict endpoint unavailable');
    if(service==='private-bank-api')return{total:rows.length,questions:rows};
    throw new Error('unexpected service');
  }},
  CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail;}},
  setTimeout(callback){callback();return 1;},dispatchEvent(){},
  localStorage:{getItem(){return'[]';},setItem(){}}
};
context.window=context;
vm.createContext(context);
vm.runInContext(source,context,{filename:'mapped-private-bank-practice.js'});

const bundle={id:'course:ib-math-ai',course_key:'ib-math-ai',label:'IB Math AI · Full Course',staff_view_all:true,count:0,bank_counts:{}};
const questions=await context.ECHSBank.loadBundle(bundle);
assert.ok(requests.some(row=>row.service==='practice-bank-api'),'strict API was not attempted');
assert.ok(requests.some(row=>row.service==='private-bank-api'&&row.path.includes('/student-questions?')),'protected compatibility endpoint was not attempted');
assert.equal(questions.length,1,'staff recovery must retain the mapped IB row');
assert.equal(questions[0].classification.course_scope,'ib-math-ai');
assert.equal(questions[0]._staff_only,true,'shared recovery row must remain staff-only');
assert.equal(documentElement.dataset.ibCourseBankState,'fallback');
assert.equal(documentElement.dataset.practiceBankTransport,'protected-compatibility');
assert.match(option.textContent,/protected recovery/);
assert.ok(!questions.some(question=>question.bank_code==='ADAMS10'),'AP static content leaked into IB recovery');
console.log('IB protected staff recovery: PASS');
