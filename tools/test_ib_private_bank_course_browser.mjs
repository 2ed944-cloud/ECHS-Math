import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source=await readFile(new URL('../question-bank/js/private-bank-practice.js',import.meta.url),'utf8');
const requests=[];
const option={value:'ib-math-ai-all',textContent:'IB Math AI · Full Course (1,957)'};
const documentElement={dataset:{}};
const access={authenticated:true,role:'teacher',current:{role:'teacher'},allCourses:true,courseKeys:[]};
const rows=[
  {
    bank_code:'IBAI-DP-COMPLETE',
    trust_tier:'publisher_key_direct',
    course_mappings:[{course:'ib-math-ai',unit:1,lesson_key:'u1-number',lesson_title:'Number and Algebra',skill_key:'IBAI.U1.NUMBER',mapping_verified:true}],
    payload:{
      id:'IB-COURSE-001',bank_code:'IBAI-DP-COMPLETE',type:'mcq',prompt_html:'<p>IB question 1</p>',
      source:{source_content_fingerprint:'ib-course-1'},metadata:{student_ready:true}
    }
  },
  {
    bank_code:'ECHS-IBAI-CURATED-01',
    trust_tier:'student_ready_verified',
    course_mappings:[{course:'ib-math-ai',unit:1,lesson_key:'u1-sequences',lesson_title:'Sequences',skill_key:'IBAI.U1.SEQUENCES',mapping_verified:true}],
    payload:{
      id:'IB-COURSE-002',bank_code:'ECHS-IBAI-CURATED-01',type:'mcq',prompt_html:'<p>IB question 2</p>',
      source:{source_content_fingerprint:'ib-course-2'},metadata:{student_ready:true},trust:{independent_math_verified:true}
    }
  }
];

const ECHSBank={
  async loadBundle(){return[{id:'AP-STATIC-001',bank_code:'ADAMS10',source:{source_content_fingerprint:'ap-static'}}];},
  bankLabel(code){return code==='ADAMS10'?'AP Calculus Bank 2':`Original ${code}`;}
};
const ECHSLearning={recordAttempt(payload){return payload;}};
const context={
  console,
  URLSearchParams,
  location:{search:''},
  document:{
    documentElement,
    getElementById(id){return id==='bundle'?{options:[option]}:null;}
  },
  ECHSBank,
  ECHSLearning,
  ECHSPortalAccess:{
    ready:Promise.resolve(access),
    current:access,
    normaliseCourseKey:value=>String(value||'')
  },
  ECHSInstitution:{
    async api(_service,path){
      requests.push(path);
      return {total:rows.length,questions:rows};
    }
  },
  CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail;}},
  setTimeout(callback){callback();return 1;},
  localStorage:{getItem(){return'[]';},setItem(){}},
};
context.window=context;
vm.createContext(context);
vm.runInContext(source,context,{filename:'private-bank-practice.js'});

const bundle={id:'ib-math-ai-all',course_key:'ib-math-ai',label:'IB Math AI · Full Course',count:1957,bank_counts:{ADAMS10:1461,CALCT3BC:496}};
const questions=await context.ECHSBank.loadBundle(bundle);

assert.ok(requests.some(path=>path.includes('course=ib-math-ai')),'IB course-wide private API scope was not requested');
assert.equal(questions.length,2,'Only the two uploaded IB questions should remain');
assert.deepEqual(questions.map(question=>question.bank_code).sort(),['ECHS-IBAI-CURATED-01','IBAI-DP-COMPLETE']);
assert.ok(questions.every(question=>question._private_bank===true));
assert.ok(questions.every(question=>Array.isArray(question.course_mappings)&&question.course_mappings.length===1),'row-level mappings were not recovered into payload questions');
assert.equal(context.ECHSBank.bankLabel('IBAI-DP-COMPLETE'),'IB Mathematics AI Bank 2');
assert.equal(context.ECHSBank.bankLabel('ECHS-IBAI-CURATED-01'),'IB Mathematics AI Bank 5');
assert.match(option.textContent,/2 uploaded questions/);
assert.equal(bundle.private_bank_only,true);
assert.equal(bundle.count,2);
assert.deepEqual(bundle.bank_counts,{});
assert.equal(documentElement.dataset.ibCourseBankSource,'private-upload-manager');
assert.equal(documentElement.dataset.ibCourseBankState,'ready');
console.log('IB uploaded private-bank course browser: PASS');
