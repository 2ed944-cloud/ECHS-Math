import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source=await readFile(new URL('../question-bank/js/ib-private-bank-lesson-aliases.js',import.meta.url),'utf8');
const requests=[];
const documentElement={dataset:{}};
const baseQuestion={
  id:'IB-ALIAS-TEST-001',
  bank_code:'ECHS-IBAI-CURATED-01',
  type:'mcq',
  prompt_html:'<p>Test prompt</p>',
  course_mappings:[{
    course:'ib-math-ai',unit:1,lesson_key:'u1-number',lesson_title:'Number systems',skill_key:'IBAI.U1.NUMBER',mapping_verified:true
  }],
  classification:{ib_lesson:'u1-number',ap_topic:'u1-number'},
  metadata:{student_ready:true},
  source:{source_content_fingerprint:'ib-alias-test-fingerprint'}
};
const row={payload:baseQuestion,bank_code:baseQuestion.bank_code,trust_tier:'student_ready_verified'};
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
    async api(_service,path){
      requests.push(path);
      const lesson=new URL(`https://example.test${path}`).searchParams.get('lesson');
      return lesson==='u1-number'?{total:1,questions:[row]}:{total:0,questions:[]};
    }
  },
  CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail;}},
  dispatchEvent(){},
  setTimeout(callback){callback();return 1;}
};
context.window=context;
vm.createContext(context);
vm.runInContext(source,context,{filename:'ib-private-bank-lesson-aliases.js'});

const questions=await context.ECHSBank.loadBundle({course_key:'ib-math-ai'});
assert.equal(documentElement.dataset.ibLessonAliasLayer,'ready');
assert.ok(requests.some(path=>path.includes('lesson=u1-number')),'aggregate u1-number scope was not requested');
assert.equal(questions.length,1);
assert.equal(questions[0]._private_bank,true);
assert.equal(questions[0]._ib_visible_lesson,'1.6');
assert.equal(questions[0].classification.ap_topic,'1.6');
assert.equal(questions[0].classification.ib_lesson,'1.6');
assert.equal(questions[0].classification.source_lesson_key,'u1-number');
assert.equal(context.ECHSBank.bankLabel('ECHS-IBAI-CURATED-01'),'IB Mathematics AI Bank 5');
console.log('IB private-bank visible-lesson aliases: PASS');
