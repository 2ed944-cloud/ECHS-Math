import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const bankSource=await readFile(new URL('../question-bank/js/bank.js',import.meta.url),'utf8');
const isolationSource=await readFile(new URL('../question-bank/js/practice-course-isolation.js',import.meta.url),'utf8');
const context={
  console,
  URLSearchParams,
  location:{search:'?course=ib-math-ai&unit=1&topic=1.1'},
  document:{documentElement:{dataset:{}}},
  ECHSPortalAccess:{normaliseCourseKey:value=>String(value||'')},
  fetch(){throw new Error('fetch should not run in isolation test');},
  CustomEvent:class{},
  dispatchEvent(){},
  setTimeout(callback){callback();return 1;}
};
context.window=context;
vm.createContext(context);
vm.runInContext(`${bankSource}\nwindow.ECHSBank=ECHSBank;`,context,{filename:'bank.js'});
vm.runInContext(isolationSource,context,{filename:'practice-course-isolation.js'});
const bank=context.ECHSBank;

assert.equal(context.document.documentElement.dataset.practiceCourseIsolation,'ready');
const ibQuestion={
  id:'IB-1',bank_code:'IBAI-DP-COMPLETE',
  course_mappings:[{course:'ib-math-ai',unit:1,lesson_key:'1.1',mapping_verified:true}],
  classification:{course_scope:'ib-math-ai',primary_unit:1,primary_topic:'1.1'}
};
const calcQuestion={
  id:'CALC-1',bank_code:'CALCT3BC',
  course_mappings:[{course:'ap-calculus',unit:1,lesson_key:'1.1',mapping_verified:true}],
  classification:{course_scope:'ap-calculus',primary_unit:1,primary_topic:'1.1'}
};
assert.equal(bank.mappingCompatible(ibQuestion,{course:'ib-math-ai',unit:1,topic:'1.1'}),true);
assert.equal(bank.mappingCompatible(ibQuestion,{course:'ap-calculus',unit:1,topic:'1.1'}),false);
assert.equal(bank.mappingCompatible(calcQuestion,{course:'ib-math-ai',unit:1,topic:'1.1'}),false);
assert.deepEqual(bank.filterQuestions([ibQuestion,calcQuestion],{course:'ib-math-ai',unit:1,topic:'1.1'}).map(row=>row.id),['IB-1']);

const catalog={bundles:{
  topics:[{id:'1.1',topic:'1.1',course_key:'ap-calculus'}],
  ib_topics:[{id:'ib-1.1',topic:'1.1',course_key:'ib-math-ai'}],
  course_units:[{id:'ib-u1',course_key:'ib-math-ai',unit:1}],
  course_all:[{id:'ib-all',course_key:'ib-math-ai'}]
}};
const selected=bank.selectedBundleFromParams(catalog);
assert.notEqual(selected.group,'topics','IB topic request must not select the AP Calculus topics group');
assert.equal(selected.row.course_key,'ib-math-ai');
console.log('Practice course isolation and course-aware bundle selection: PASS');
