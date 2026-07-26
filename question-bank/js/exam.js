/* ECHS Test Generator — Phase 2 */
const X={group:document.getElementById("group"),bundle:document.getElementById("bundle"),bank:document.getElementById("bank"),difficulty:document.getElementById("difficulty"),count:document.getElementById("count"),minutes:document.getElementById("minutes"),start:document.getElementById("start"),setup:document.getElementById("setup"),exam:document.getElementById("exam")};
let catalog,loaded=[],questions=[],answers={},seconds=0,timer=null,session=null,lastPersist=0,questionStartTimes={};
const params=ECHSBank.params(),assignmentId=params.get("assignment"),assignmentTitle=params.get("title");
document.querySelector('.navLink[href="exam.html"]')?.classList.add("active");

function fillGroups(selected){X.group.innerHTML=ECHSBank.bundleGroups(catalog).filter(group=>group.key!=="scopes").map(group=>`<option value="${group.key}" ${group.key===selected?"selected":""}>${ECHSBank.escape(group.label)}</option>`).join("");}
function fillBundles(selectedId){X.bundle.innerHTML=(catalog.bundles[X.group.value]||[]).map(row=>`<option value="${ECHSBank.escape(row.id)}" ${row.id===selectedId?"selected":""}>${ECHSBank.escape(ECHSBank.cleanStudentLabel(row.label))} (${Number(row.auto_gradable_count||row.count||0).toLocaleString()})</option>`).join("");}
function currentBundle(){return(catalog.bundles[X.group.value]||[]).find(row=>row.id===X.bundle.value);}
async function load(){
  const row=currentBundle();if(!row)return;X.start.disabled=true;X.start.textContent="Loading…";
  try{loaded=await ECHSBank.loadBundle(row);const banks=[...new Set(loaded.map(question=>question.bank_code).filter(Boolean))].sort();X.bank.innerHTML='<option value="all">All collections</option>'+banks.map(code=>`<option value="${ECHSBank.escape(code)}">${ECHSBank.escape(ECHSBank.bankLabel(code))}</option>`).join("");}
  finally{X.start.disabled=false;X.start.textContent="Start Test";}
}
function assignmentBanner(){
  if(!assignmentId)return;
  document.getElementById("assignmentBanner").innerHTML=`<div class="notice"><strong>Assigned test:</strong> ${ECHSBank.escape(assignmentTitle||assignmentId)}. Export your learning report after submission for teacher review.</div>`;
}
function resumeBanner(){
  const saved=ECHSLearning.getContinue(),target=document.getElementById("resumeBanner");
  if(!saved||saved.type!=="exam"){target.innerHTML="";return;}
  target.innerHTML=`<div class="resumeBanner"><div><strong>${ECHSBank.escape(saved.label||"Incomplete test")}</strong><p>${saved.questionIds?.length||0} questions · ${Math.ceil((saved.seconds||0)/60)} minutes remaining</p></div><div><a class="button wine" href="${ECHSBank.escape(saved.url||"exam.html?resume=1")}">Resume test</a> <button class="button ghost" id="discardExam">Discard</button></div></div>`;
  document.getElementById("discardExam").onclick=()=>{ECHSLearning.clearContinue();target.innerHTML="";};
}
function persist(){
  if(!session)return;
  ECHSLearning.patchSession(session.id,{questionIds:questions.map(q=>q.id),answered:Object.keys(answers).length,secondsRemaining:seconds,assignmentId});
  const query=new URLSearchParams({resume:"1",bundle:currentBundle()?.id||""});if(assignmentId)query.set("assignment",assignmentId);if(assignmentTitle)query.set("title",assignmentTitle);
  ECHSLearning.setContinue({type:"exam",label:`Timed test · ${ECHSBank.cleanStudentLabel(currentBundle()?.label||"Assessment")}`,url:new URL(`exam.html?${query}`,location.href).href,bundleId:currentBundle()?.id,questionIds:questions.map(q=>q.id),answers,seconds,sessionId:session.id,assignmentId,title:assignmentTitle});
}
function render(){
  questionStartTimes={};questions.forEach(q=>questionStartTimes[q.id]=Date.now());
  X.exam.innerHTML=`<section class="panel examBar"><strong>${questions.length}-question assessment</strong><span class="timer" id="timer" aria-live="polite"></span><button class="button primary" id="submit">Submit Test</button></section>`+questions.map((question,index)=>{
    const choices=ECHSBank.choiceOrder(question),saved=answers[question.id];
    return`<article class="questionCard" style="margin-top:1rem"><div class="pillRow"><span class="pill wine">${index+1}</span><span class="pill teal">${ECHSBank.escape(ECHSBank.bankLabel(question.bank_code))}</span>${question.classification?.ap_topic?`<span class="pill gold">AP ${ECHSBank.escape(question.classification.ap_topic)}</span>`:""}<span class="pill">${ECHSBank.escape(question.source?.section||"General")}</span></div><div class="prompt" style="margin-top:.8rem">${question.prompt_html}</div>${["mcq","true_false"].includes(question.type)?`<div class="choices">${choices.map((choice,choiceIndex)=>`<button class="choice ${saved===choice.id?"selected":""}" data-q="${ECHSBank.escape(question.id)}" data-c="${ECHSBank.escape(choice.id)}"><span class="choiceLabel">${String.fromCharCode(65+choiceIndex)}</span><span>${choice.html}</span></button>`).join("")}</div>`:`<div class="control" style="margin-top:1rem"><label>Answer</label><input data-input="${ECHSBank.escape(question.id)}" value="${ECHSBank.escape(saved||"")}" autocomplete="off"></div>`}</article>`;
  }).join("");
  if(window.ECHSBlackboardAssets)ECHSBlackboardAssets.hydrate(X.exam).catch(console.warn);
  document.querySelectorAll(".choice").forEach(button=>button.onclick=()=>{document.querySelectorAll(`.choice[data-q="${CSS.escape(button.dataset.q)}"]`).forEach(item=>item.classList.remove("selected"));button.classList.add("selected");answers[button.dataset.q]=button.dataset.c;persist();});
  document.querySelectorAll("[data-input]").forEach(input=>input.oninput=()=>{answers[input.dataset.input]=input.value;persist();});
  document.getElementById("submit").onclick=()=>submit(false);tick();persist();
}
function tick(){
  const element=document.getElementById("timer");if(!element)return;
  const minutes=Math.floor(seconds/60),remaining=seconds%60;element.textContent=`${String(minutes).padStart(2,"0")}:${String(remaining).padStart(2,"0")}`;
  if(seconds<=0){submit(true);return;}seconds--;
  if(Date.now()-lastPersist>15000){lastPersist=Date.now();persist();}
  timer=setTimeout(tick,1000);
}
async function start(){
  let rows=ECHSBank.filterQuestions(loaded,{bank:X.bank.value,difficulty:X.difficulty.value,type:"all",section:"all"}).filter(ECHSBank.isAutoGradable.bind(ECHSBank));
  questions=ECHSBank.shuffle(rows).slice(0,Number(X.count.value));answers={};seconds=Math.max(1,Number(X.minutes.value)||20)*60;
  if(!questions.length){X.exam.innerHTML='<div class="notice">No auto-gradable questions match the selected filters.</div>';return;}
  session=ECHSLearning.startSession({type:"exam",mode:"test",bundleId:currentBundle()?.id,bundleLabel:ECHSBank.cleanStudentLabel(currentBundle()?.label||"Assessment"),questionIds:questions.map(q=>q.id),targetCount:questions.length,assignmentId,title:assignmentTitle});
  X.setup.classList.add("hidden");render();resumeBanner();
}
function restore(){
  const saved=ECHSLearning.getContinue();if(!saved||saved.type!=="exam"||saved.bundleId!==currentBundle()?.id)return false;
  const map=new Map(loaded.map(q=>[String(q.id),q]));questions=(saved.questionIds||[]).map(id=>map.get(String(id))).filter(Boolean);if(!questions.length)return false;
  answers=saved.answers||{};seconds=Math.max(1,Number(saved.seconds)||1);session=ECHSLearning.activeSession(saved.sessionId)||ECHSLearning.startSession({type:"exam",mode:"test",bundleId:saved.bundleId,questionIds:questions.map(q=>q.id),targetCount:questions.length,assignmentId:saved.assignmentId});
  X.setup.classList.add("hidden");render();return true;
}
function submit(autoSubmitted=false){
  if(timer)clearTimeout(timer);timer=null;
  let correct=0;
  const review=questions.map((question,index)=>{
    const response=answers[question.id]??"",ok=ECHSBank.answerIsCorrect(question,response);if(ok)correct++;
    ECHSBank.saveAttempt(question,ok,response,{mode:"test",sessionId:session?.id,assignmentId,durationMs:Date.now()-(questionStartTimes[question.id]||Date.now())});
    const correctText=["mcq","true_false"].includes(question.type)?question.choices.filter(choice=>question.correct_choice_ids.includes(choice.id)).map(choice=>choice.text).join(" / "):(question.accepted_answers||[]).join(" / ");
    return`<div class="reviewItem ${ok?"correct":"incorrect"}"><strong>${index+1}. ${ok?"Correct":"Incorrect · added to Mistake Bank"}</strong><p>${ECHSBank.escape(String(question.prompt_text||"").slice(0,260))}</p><small>Correct answer: ${ECHSBank.escape(correctText||"See source key")}</small></div>`;
  }).join("");
  const percentage=questions.length?Math.round(correct/questions.length*100):0;
  if(session)ECHSLearning.endSession(session.id,{answered:questions.length,correct,score:percentage,autoSubmitted,assignmentId});
  ECHSLearning.clearContinue();
  X.exam.innerHTML=`<div class="result"><div class="resultScore">${correct} / ${questions.length} (${percentage}%)</div><p>${autoSubmitted?"Time expired and the test was submitted automatically.":"Your test was submitted."} Mastery, review timing and the Mistake Bank were updated.</p><div class="heroActions"><a class="button wine" href="dashboard.html">Open Student Dashboard</a><a class="button ghost" href="mistakes.html">Review mistakes</a><button class="button ghost" id="exportAfterTest">Export learning report</button><button class="button ghost" onclick="location.reload()">Create another test</button></div><div class="sectionHead"><div><h2>Review</h2></div></div>${review}</div>`;
  document.getElementById("exportAfterTest").onclick=()=>ECHSLearning.exportReport();resumeBanner();
}
(async()=>{
  try{
    catalog=await ECHSBank.loadCatalog();const selected=ECHSBank.selectedBundleFromParams(catalog);fillGroups(selected.group);fillBundles(selected.row?.id);
    if(params.get("count"))X.count.value=params.get("count");if(params.get("minutes"))X.minutes.value=params.get("minutes");if(params.get("difficulty"))X.difficulty.value=params.get("difficulty");
    await load();assignmentBanner();resumeBanner();
    const summary=ECHSLearning.summary();document.getElementById("heroDue").textContent=summary.due;document.getElementById("heroMastery").textContent=summary.mastered;document.getElementById("heroAccuracy").textContent=`${summary.accuracy}%`;
    X.group.onchange=async()=>{fillBundles();await load();};X.bundle.onchange=load;X.start.onclick=()=>start().catch(error=>X.exam.innerHTML=`<div class="notice">${ECHSBank.escape(error.message)}</div>`);
    if(params.get("resume")==="1")restore();else if(assignmentId)start();
  }catch(error){X.exam.innerHTML=`<div class="notice">${ECHSBank.escape(error.message)}</div>`;}
})();