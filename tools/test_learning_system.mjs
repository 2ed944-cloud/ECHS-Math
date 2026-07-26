import fs from "node:fs";
import vm from "node:vm";

const store=new Map();
globalThis.localStorage={
  getItem:key=>store.has(key)?store.get(key):null,
  setItem:(key,value)=>store.set(key,String(value)),
  removeItem:key=>store.delete(key)
};
globalThis.location={search:"",href:"http://localhost/question-bank/practice.html"};
globalThis.window=globalThis;
globalThis.addEventListener=()=>{};
globalThis.dispatchEvent=()=>true;
globalThis.CustomEvent=class{constructor(type,init={}){this.type=type;this.detail=init.detail;}};
globalThis.document={createElement:()=>({click(){},set href(v){this._href=v;},get href(){return this._href;}})};
globalThis.URL=URL;
globalThis.Blob=Blob;

const source=fs.readFileSync("question-bank/js/learning-system.js","utf8");
vm.runInThisContext(source,{filename:"learning-system.js"});

if(!globalThis.ECHSLearning)throw new Error("ECHSLearning was not created");
const question=(id,difficulty=2,topic="1.1")=>({
  id,bank_code:"TEST",type:"mcq",prompt_text:`Question ${id}`,
  metadata:{difficulty},
  classification:{course_scope:"AP Precalculus",ap_unit:1,ap_topic:topic,ap_topic_title:`Topic ${topic}`},
  source:{section:"1",section_title:"Functions"}
});

const session=ECHSLearning.startSession({type:"practice",mode:"adaptive"});
ECHSLearning.recordAttempt({question:question("q1",1),correct:false,response:"A",mode:"adaptive",sessionId:session.id});
ECHSLearning.recordAttempt({question:question("q1",1),correct:true,response:"B",mode:"review",sessionId:session.id});
ECHSLearning.recordAttempt({question:question("q2",2),correct:true,response:"B",mode:"adaptive",sessionId:session.id});
ECHSLearning.endSession(session.id,{answered:3,correct:2,score:67});

const summary=ECHSLearning.summary();
if(summary.attempts!==3)throw new Error(`Expected 3 attempts, got ${summary.attempts}`);
if(summary.correct!==2)throw new Error(`Expected 2 correct, got ${summary.correct}`);
if(ECHSLearning.mistakes().some(row=>row.questionId==="q1"))throw new Error("Recovered q1 should not remain unresolved");
if(!ECHSLearning.masteryRows().length)throw new Error("Mastery was not updated");

const pool=[question("q3",1,"1.1"),question("q4",2,"1.2"),question("q5",3,"1.3")];
const selected=ECHSLearning.selectAdaptive(pool,2);
if(selected.length!==2)throw new Error("Adaptive selector did not return two questions");
if(new Set(selected.map(row=>row.id)).size!==2)throw new Error("Adaptive selector repeated a question");

ECHSLearning.setContinue({type:"practice",label:"Test resume",url:"practice.html?resume=1"});
if(ECHSLearning.getContinue()?.label!=="Test resume")throw new Error("Continue state was not saved");
ECHSLearning.clearContinue();
if(ECHSLearning.getContinue()!==null)throw new Error("Continue state was not cleared");

const report=ECHSLearning.exportStudentReport();
if(report.schema!=="echs-learning-report")throw new Error("Export report schema is invalid");
if(report.summary.attempts!==3)throw new Error("Export report summary is invalid");

console.log(JSON.stringify({status:"PASS",summary,masteryTopics:ECHSLearning.masteryRows().length,selected:selected.map(row=>row.id)}));