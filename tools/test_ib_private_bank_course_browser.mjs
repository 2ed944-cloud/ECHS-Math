import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source=await readFile(new URL('../question-bank/js/mapped-private-bank-practice.js',import.meta.url),'utf8');
const requests=[];
const option={value:'course:ib-math-ai',textContent:'IB Math AI · Uploaded Banks (0)'};
const documentElement={dataset:{}};
const access={authenticated:true,role:'teacher',current:{role:'teacher'},allCourses:true,courseKeys:[]};
const rows=[
  {
    bank_code:'IBAI-DP-COMPLETE',trust_tier:'publisher_key_direct',student_visible:true,mapping_verified:true,
    course_mappings:[{course:'ib-math-ai',unit:1,lesson_key:'u1-standard-form',lesson_title:'Scientific notation',skill_key:'IBAI.U1.NUMBER',mapping_verified:true}],
    payload:{id:'IB-COURSE-001',bank_code:'IBAI-DP-COMPLETE',type:'mcq',prompt_html:'<p>IB question 1</p>',source:{source_content_fingerprint:'ib-course-1'},metadata:{student_ready:true}}
  },
  {
    bank_code:'ECHS-IBAI-CURATED-01',trust_tier:'student_ready_verified',student_visible:true,mapping_verified:true,
    course_mappings:[{course:'ib-math-ai',unit:1,lesson_key:'u1-arithmetic-sequences',lesson_title:'Arithmetic sequences',skill_key:'IBAI.U1.SEQUENCES',mapping_verified:true}],
    payload:{id:'IB-COURSE-002',bank_code:'ECHS-IBAI-CURATED-01',type:'mcq',prompt_html:'<p>IB question 2</p>',source:{source_content_fingerprint:'ib-course-2'},metadata:{student_ready:true},trust:{independent_math_verified:true}}
  }
];
const elements={
  bundle:{options:[option]},heroLoaded:{textContent:''},heroBanks:{textContent:''},status:{innerHTML:''},shell:{querySelector(){return null;}},
  bank:{value:'all',innerHTML:''},section:{value:'all',innerHTML:''}
};
const ECHSBank={
  async loadBundle(){return[{id:'AP-STATIC-001',bank_code:'ADAMS10',source:{source_content_fingerprint:'ap-static'}}];},
  bankLabel(code){return code==='ADAMS10'?'AP Calculus Bank 2':`Original ${code}`;},
  escape(value){return String(value??'');},cleanStudentLabel(value){return String(value??'');}
};
const ECHSLearning={recordAttempt(payload){return payload;}};
const context={
  console,URLSearchParams,location:{search:''},
  document:{documentElement,getElementById(id){return elements[id]||null;}},
  ECHSBank,ECHSLearning,
  ECHSPortalAccess:{ready:Promise.resolve(access),current:access,normaliseCourseKey:value=>String(value||'')},
  ECHSInstitution:{async api(service,path){requests.push({service,path});return{total:rows.length,questions:rows};}},
  CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail;}},
  setTimeout(callback){callback();return 1;},dispatchEvent(){},
  localStorage:{getItem(){return'[]';},setItem(){}}
};
context.window=context;
vm.createContext(context);
vm.runInContext(source,context,{filename:'mapped-private-bank-practice.js'});

const bundle={id:'course:ib-math-ai',course_key:'ib-math-ai',label:'IB Math AI · Full Course',count:1957,bank_counts:{ADAMS10:1461,CALCT3BC:496}};
const questions=await context.ECHSBank.loadBundle(bundle);
assert.ok(requests.some(row=>row.service==='practice-bank-api'&&row.path.includes('/questions?')&&row.path.includes('course=ib-math-ai')),'strict IB practice API was not requested');
assert.equal(questions.length,2,'Only uploaded IB questions should remain');
assert.equal(questions.map(question=>question.bank_code).sort().join(','),'ECHS-IBAI-CURATED-01,IBAI-DP-COMPLETE');
assert.ok(questions.every(question=>question._private_bank===true));
assert.ok(questions.every(question=>question.classification.course_scope==='ib-math-ai'));
assert.ok(!questions.some(question=>question.bank_code==='ADAMS10'),'AP static bank leaked into IB course practice');
assert.equal(context.ECHSBank.bankLabel('IBAI-DP-COMPLETE'),'IB Mathematics AI Bank 2');
assert.equal(context.ECHSBank.bankLabel('ECHS-IBAI-CURATED-01'),'IB Mathematics AI Bank 5');
assert.match(option.textContent,/2 uploaded questions/);
assert.equal(bundle.private_bank_only,true);
assert.equal(bundle.count,2);
assert.equal(Object.keys(bundle.bank_counts).length,0);
assert.equal(documentElement.dataset.ibCourseBankSource,'private-upload-manager');
assert.equal(documentElement.dataset.ibCourseBankState,'ready');
console.log('IB uploaded private-bank strict course browser: PASS');
