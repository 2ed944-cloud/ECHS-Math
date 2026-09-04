import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
for(const path of ['question-bank/js/mapped-practice.js','question-bank/js/practice.js']){
  const source=read(path),start=source.indexOf('function check(question)'),end=source.indexOf('function nextQuestion()',start);
  const feedback={},input={value:'',focus(){}},state={checked:false,response:null,correct:0,graded:0,answered:new Set()};let attempts=0;
  const context=vm.createContext({state,document:{getElementById:id=>id==='feedback'?feedback:input,querySelector:()=>({focus(){}}),querySelectorAll:()=>[]},ECHSBank:{isAutoGradable:q=>q.type!=='open_response',answerIsCorrect:()=>true,saveAttempt:()=>attempts++,escape:String},UI:{mode:{value:'manual'}},session:{id:'session-1'},assignmentId:null,questionStartedAt:Date.now(),lastResult:null,currentTarget:()=>({unit:1,topic:'1.1'}),currentCourse:()=> 'ap-calculus',isMultiRouteAssignment:()=>false,hydrateAssets(){},persistContinue(){}});
  vm.runInContext(source.slice(start,end),context);
  for(const type of ['mcq','fill_blank','open_response']){context.question={id:'q1',type,accepted_answers:[]};vm.runInContext('check(question)',context);assert.equal(state.checked,false,`${path}: empty responses stay editable`);assert.equal(attempts,0,`${path}: blank responses cannot reduce mastery`);assert.doesNotMatch(feedback.textContent,/Correct|solution/)}
  input.value='0';context.question={id:'q2',type:'fill_blank',accepted_answers:['0']};vm.runInContext('check(question)',context);assert.equal(attempts,1,`${path}: zero is a real answer`);assert.equal(state.correct,1);
}
const source=read('question-bank/js/mapped-practice.js'),start=source.indexOf('function practiceKeyboard('),end=source.indexOf('document.addEventListener("keydown", practiceKeyboard)',start);
let modal=false,focusedControl=false,clicks=0;const context=vm.createContext({document:{body:{classList:{contains:()=>modal}},querySelector:s=>s==='#shell .questionCard'?{}:null,querySelectorAll:()=>[],getElementById:()=>({click:()=>clicks++})},state:{checked:false}});vm.runInContext(source.slice(start,end),context);context.event={key:'Enter',target:{closest:()=>focusedControl?{}:null},preventDefault(){}};
modal=true;vm.runInContext('practiceKeyboard(event)',context);assert.equal(clicks,0,'Filter navigation cannot submit an answer behind the drawer');modal=false;focusedControl=true;vm.runInContext('practiceKeyboard(event)',context);assert.equal(clicks,0,'Native button and link activation remains intact');focusedControl=false;vm.runInContext('practiceKeyboard(event)',context);assert.equal(clicks,1,'Enter remains available on the practice canvas');
console.log('Practice interactions: PASS (blank answer guards, numeric zero, modal and native keyboard behavior)');
