import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source=await readFile(new URL('../question-bank/js/ib-exact-lesson-bank-aliases.js',import.meta.url),'utf8');
const requests=[];
const documentElement={dataset:{}};
const baseQuestion={
  id:'IB-ALIAS-TEST-001',
  bank_code:'ECHS-IBAI-CURATED-01',
  type:'mcq',
  prompt_html:'<p>Test prompt</p>',
  course_mappings:[{
    course:'ib-math-ai',unit:1,lesson_key:'u1-approximation-error',lesson_title:'Approximation and error',skill_key:'IBAI.U1.NUMBER',mapping_verified:true
  }],
  classification:{ib_lesson:'u1-approximation-error',topic:'u1-approximation-error'},
  metadata:{student_ready:true},
  source:{source_content_fingerprint:'ib-alias-test-fingerprint'}
};
const row={payload:baseQuestion,course_mappings:baseQuestion.course_mappings,bank_code:baseQuestion.bank_code,trust_tier:'student_ready_verified',student_visible:true,mapping_verified:true};
const ECHSBank={
  async loadBundle(){return[];},
  bankLabel(code){return `Original ${code}`;}
};
const context={
  console,
  URLSearchParams,
  location:{search:'?course=ib-math-ai&unit=1&topic=1.6&title=1.6%20%C2%B7%20Approximation'},
  document:{documentElement},
  ECHSBank,
  ECHSLearning:{},
  ECHSPortalAccess:{normaliseCourseKey:value=>String(value||'')},
  ECHSInstitution:{
    async api(service,path){
      requests.push({service,path});
      const lesson=new URL(`https://example.test${path}`).searchParams.get('lesson');
      return lesson==='u1-approximation-error'?{total:1,questions:[row]}:{total:0,questions:[]};
    }
  },
  CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail;}},
  dispatchEvent(){},
  setTimeout(callback){callback();return 1;}
};
context.window=context;
vm.createContext(context);
vm.runInContext(source,context,{filename:'ib-exact-lesson-bank-aliases.js'});

const questions=await context.ECHSBank.loadBundle({course_key:'ib-math-ai'});
assert.equal(documentElement.dataset.ibLessonAliasLayer,'ready');
assert.equal(documentElement.dataset.ibAliasPolicy,'exact-only');
assert.ok(requests.some(row=>row.service==='practice-bank-api'&&row.path.includes('lesson=u1-approximation-error')),'exact approximation lesson scope was not requested');
assert.ok(!requests.some(row=>row.path.includes('lesson=u1-number')),'broad u1-number scope must not be requested for Lesson 1.6');
assert.ok(!requests.some(row=>row.path.includes('lesson=u1-modeling')),'generic modelling fallback must not be requested');
assert.equal(questions.length,1);
assert.equal(questions[0]._private_bank,true);
assert.equal(questions[0]._ib_visible_lesson,'1.6');
assert.equal(questions[0].classification.primary_topic,'1.6');
assert.equal(questions[0].classification.ib_lesson,'1.6');
assert.equal(questions[0].classification.source_lesson_key,'u1-approximation-error');
assert.equal(context.ECHSBank.bankLabel('ECHS-IBAI-CURATED-01'),'IB Mathematics AI Bank 5');
console.log('IB private-bank exact visible-lesson aliases: PASS');
