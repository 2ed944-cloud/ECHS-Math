import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source=await readFile(new URL('../question-bank/js/practice-single-bank.js',import.meta.url),'utf8');
const options=[];
function option(value,textContent){
  const row={value,textContent,remove(){const index=options.indexOf(row);if(index>=0)options.splice(index,1);}};
  options.push(row);return row;
}
option('all','All course banks');option('IB-A','IB Mathematics AI Bank 1');option('IB-B','IB Mathematics AI Bank 2');
const bank={value:'all',options,disabled:false,title:'',addEventListener(){},get selectedOptions(){return options.filter(row=>row.value===this.value);}};
const shell={querySelectorAll(){return[];}};
const ECHSBank={filterQuestions(questions,filters){return questions.filter(question=>!filters.bank||filters.bank==='all'||question.bank_code===filters.bank);}};
const ECHSLearning={
  getContinue(){return null;},
  setContinue(payload){return payload;},
  startSession(payload){return payload;}
};
const context={
  console,URL,URLSearchParams,ECHSBank,ECHSLearning,
  location:{search:'',href:'https://example.test/question-bank/practice.html'},
  document:{
    documentElement:{dataset:{}},
    body:{classList:{contains:name=>name==='roleStudent'}},
    getElementById:id=>id==='bank'?bank:id==='shell'?shell:null,
    querySelector(){return null;},addEventListener(){},querySelectorAll(){return[];}
  },
  ECHSPortalAccess:{current:{role:'student'}},
  MutationObserver:class{constructor(callback){this.callback=callback;}observe(){}},
  queueMicrotask(callback){callback();},
  setTimeout(callback){callback();return 1;},
  addEventListener(){}
};
context.window=context;
vm.createContext(context);
vm.runInContext(source,context,{filename:'practice-single-bank.js'});
assert.equal(context.document.documentElement.dataset.practiceBankIsolation,'ready');
assert.equal(bank.value,'IB-A');
assert.ok(!options.some(row=>row.value==='all'),'student all-bank option was not removed');
const rows=context.ECHSBank.filterQuestions([{id:'A',bank_code:'IB-A'},{id:'B',bank_code:'IB-B'}],{bank:'all'});
assert.deepEqual(rows.map(row=>row.id),['A']);
const continued=context.ECHSLearning.setContinue({type:'practice',url:'https://example.test/question-bank/practice.html?resume=1'});
assert.equal(continued.bankCode,'IB-A');
assert.equal(new URL(continued.url).searchParams.get('bank'),'IB-A');
const session=context.ECHSLearning.startSession({type:'practice'});
assert.equal(session.bankCode,'IB-A');
console.log('Student single-bank session isolation: PASS');
