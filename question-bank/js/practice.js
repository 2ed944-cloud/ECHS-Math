/* ECHS Adaptive Practice Studio — Phase 2 */
const UI={
  mode:document.getElementById("mode"),group:document.getElementById("group"),bundle:document.getElementById("bundle"),bank:document.getElementById("bank"),type:document.getElementById("type"),difficulty:document.getElementById("difficulty"),section:document.getElementById("section"),count:document.getElementById("count"),start:document.getElementById("start"),status:document.getElementById("status"),shell:document.getElementById("shell"),heroLoaded:document.getElementById("heroLoaded"),heroBanks:document.getElementById("heroBanks"),heroDue:document.getElementById("heroDue"),heroMastery:document.getElementById("heroMastery")
};
let catalog,loaded=[],set=[],loading=false,session=null,targetCount=10,lastResult=null,questionStartedAt=Date.now();
let state={index:0,response:null,checked:false,correct:0,graded:0,answered:new Set()};
const params=ECHSBank.params(),assignmentId=params.get("assignment"),assignmentTitle=params.get("title");
document.querySelector('.navLink[href="practice.html"]')?.classList.add('active');

const modeCopy={
  manual:["Manual practice","Questions are shuffled from the selected filters."],
  adaptive:["Adaptive practice","The next question responds to your mastery, recent result and suitable difficulty."],
  review:["Spaced review","Only questions currently due in the review schedule are selected."],
  mistakes:["Mistake recovery","Only unresolved questions from the Mistake Bank are selected."]
};
function updateModeCopy(){
  const [title,description]=modeCopy[UI.mode.value]||modeCopy.manual;
  document.getElementById("modeTitle").textContent=title;document.getElementById("modeDescription").textContent=description;
  UI.difficulty.disabled=UI.mode.value==="adaptive";
}
function groupRows(){return ECHSBank.bundleGroups(catalog);}
function displayBundleLabel(row){return ECHSBank.cleanStudentLabel(row?.label||"Practice collection");}
function fillGroups(selected){UI.group.innerHTML=groupRows().map(group=>`<option value="${group.key}" ${group.key===selected?"selected":""}>${ECHSBank.escape(group.label)}</option>`).join("");}
function fillBundles(selectedId){const rows=catalog.bundles[UI.group.value]||[];UI.bundle.innerHTML=rows.map(row=>`<option value="${ECHSBank.escape(row.id)}" ${row.id===selectedId?"selected":""}>${ECHSBank.escape(displayBundleLabel(row))} (${Number(row.count||0).toLocaleString()})</option>`).join("");}
function currentBundle(){return(catalog.bundles[UI.group.value]||[]).find(row=>row.id===UI.bundle.value);}
function setBusy(value){loading=value;UI.start.disabled=value;UI.group.disabled=value;UI.bundle.disabled=value;UI.start.textContent=value?"Loading questions…":"Generate Practice Set";}
window.addEventListener("echs:bundle-progress",event=>{if(!loading)return;const {completed,total}=event.detail||{};if(total>1)UI.status.innerHTML=`<span class="pill">Loading collection ${completed} of ${total}…</span>`;});

function assignmentBanner(){
  const target=document.getElementById("assignmentBanner");
  if(!assignmentId){target.innerHTML="";return;}
  target.innerHTML=`<div class="notice"><strong>Assigned activity:</strong> ${ECHSBank.escape(assignmentTitle||assignmentId)}. Your work will be included when you export a learning report for your teacher.</div>`;
}
function resumeBanner(){
  const target=document.getElementById("resumeBanner"),saved=ECHSLearning.getContinue();
  if(!saved||saved.type!=="practice"){target.innerHTML="";return;}
  target.innerHTML=`<div class="resumeBanner"><div><strong>${ECHSBank.escape(saved.label||"Incomplete practice session")}</strong><p>Question ${(saved.index||0)+1} of ${saved.targetCount||saved.questionIds?.length||"—"} · updated ${new Date(saved.updatedAt).toLocaleString()}</p></div><div><a class="button wine" href="${ECHSBank.escape(saved.url||"practice.html?resume=1")}">Resume</a> <button class="button ghost" id="discardResume">Discard</button></div></div>`;
  document.getElementById("discardResume").onclick=()=>{ECHSLearning.clearContinue();target.innerHTML="";};
}

async function loadCurrent(){
  const row=currentBundle();if(!row)return;
  setBusy(true);UI.status.innerHTML='<span class="pill">Loading collection…</span>';
  try{
    loaded=await ECHSBank.loadBundle(row);if(UI.heroLoaded)UI.heroLoaded.textContent=loaded.length.toLocaleString();
    const banks=[...new Set(loaded.map(question=>question.bank_code).filter(Boolean))].sort();if(UI.heroBanks)UI.heroBanks.textContent=banks.length.toLocaleString();
    const wanted=params.get("bank")||UI.bank.value;UI.bank.innerHTML='<option value="all">All collections</option>'+banks.map(code=>`<option value="${ECHSBank.escape(code)}" ${code===wanted?"selected":""}>${ECHSBank.escape(ECHSBank.bankLabel(code))}</option>`).join("");
    const sections=new Map();loaded.forEach(question=>{const value=String(question.source?.section||"unmapped"),title=question.source?.section_title||question.source?.skill_title||"";sections.set(value,value==="unmapped"?"General practice":`${value}${title?` · ${title}`:""}`);});
    UI.section.innerHTML='<option value="all">All chapters and sections</option>'+[...sections].sort((a,b)=>a[0].localeCompare(b[0],undefined,{numeric:true})).map(([value,label])=>`<option value="${ECHSBank.escape(value)}">${ECHSBank.escape(ECHSBank.cleanStudentLabel(label))}</option>`).join("");
    UI.status.innerHTML=`<span class="pill teal">${loaded.length.toLocaleString()} questions available</span><span class="pill wine">${ECHSBank.escape(displayBundleLabel(row))}</span>`;
  }catch(error){
    UI.status.innerHTML='<span class="pill red">Collection unavailable</span>';UI.shell.innerHTML=`<div class="notice"><strong>Could not load this collection.</strong><br>${ECHSBank.escape(error.message)}</div>`;throw error;
  }finally{setBusy(false);}
}
function filters(){return{bank:UI.bank.value,type:UI.type.value,difficulty:UI.mode.value==="adaptive"?"all":UI.difficulty.value,section:UI.section.value};}
function hydrateAssets(root){if(window.ECHSBlackboardAssets)ECHSBlackboardAssets.hydrate(root).catch(error=>console.warn(error));}
function scrollQuestionIntoView(){UI.shell.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});}
function sessionURL(){
  const query=new URLSearchParams({resume:"1",bundle:currentBundle()?.id||"",mode:UI.mode.value});
  if(assignmentId)query.set("assignment",assignmentId);if(assignmentTitle)query.set("title",assignmentTitle);
  return new URL(`practice.html?${query}`,location.href).href;
}
function persistContinue(){
  if(!session)return;
  ECHSLearning.patchSession(session.id,{questionIds:set.map(q=>q.id),answered:state.graded,correct:state.correct,index:state.index});
  ECHSLearning.setContinue({type:"practice",label:`${modeCopy[UI.mode.value]?.[0]||"Practice"} · ${displayBundleLabel(currentBundle())}`,url:sessionURL(),bundleId:currentBundle()?.id,group:UI.group.value,mode:UI.mode.value,questionIds:set.map(q=>q.id),index:state.index,targetCount,correct:state.correct,graded:state.graded,answeredIds:[...state.answered],sessionId:session.id,assignmentId});
}
function render(){
  const question=set[state.index];
  if(!question){UI.shell.innerHTML='<div class="empty"><div class="emptyState"><div class="emptyStateIcon">!</div><h2>No matching questions</h2><p>The selected collection does not contain questions for this learning mode. Try a full-course collection or change the filters.</p></div></div>';return;}
  state.response=null;state.checked=false;questionStartedAt=Date.now();
  const choices=ECHSBank.choiceOrder(question),classification=question.classification||{},source=question.source||{},auto=ECHSBank.isAutoGradable(question);
  const responseHTML=["mcq","true_false"].includes(question.type)?`<div class="choices">${choices.map((choice,index)=>`<button class="choice" data-id="${ECHSBank.escape(choice.id)}"><span class="choiceLabel">${String.fromCharCode(65+index)}</span><span>${choice.html}</span></button>`).join("")}</div>`:question.type==="fill_blank"?'<div class="control" style="margin-top:1rem"><label for="answerInput">Your answer</label><input id="answerInput" autocomplete="off"></div>':'<div class="control" style="margin-top:1rem"><label for="answerInput">Your response</label><textarea id="answerInput" rows="7"></textarea></div>';
  UI.shell.innerHTML=`<article class="questionCard"><div class="pillRow"><span class="pill wine">Question ${state.index+1} of ${targetCount}</span><span class="pill teal">${ECHSBank.escape(ECHSBank.bankLabel(question.bank_code))}</span><span class="pill gold">${ECHSBank.escape(modeCopy[UI.mode.value]?.[0]||"Practice")}</span>${classification.ap_topic?`<span class="pill">AP ${ECHSBank.escape(classification.ap_topic)}</span>`:""}<span class="pill">${ECHSBank.escape(source.section||"General")}</span><span class="pill">${ECHSBank.escape(ECHSBank.labelType(question.type))}</span>${question.metadata?.difficulty?`<span class="pill">Difficulty ${question.metadata.difficulty}</span>`:""}</div><div class="progressTrack"><i style="width:${((state.index+1)/targetCount)*100}%"></i></div><h2>${ECHSBank.escape(ECHSBank.cleanStudentLabel(classification.ap_topic_title||source.skill_title||source.section_title||question.pool_title||"Practice question"))}</h2><div class="prompt">${question.prompt_html}</div>${responseHTML}<div id="feedback" class="feedback" aria-live="polite"></div><div class="questionFooter"><button class="button primary" id="check">${auto?"Check answer":"Reveal source answer / feedback"}</button><div><button class="button ghost" id="prev" ${state.index===0?"disabled":""}>Back</button> <button class="button wine" id="next">${state.index===targetCount-1?"Finish":"Next"}</button></div></div></article>`;
  hydrateAssets(UI.shell);
  if(["mcq","true_false"].includes(question.type))document.querySelectorAll(".choice").forEach(button=>button.onclick=()=>{if(state.checked)return;document.querySelectorAll(".choice").forEach(item=>item.classList.remove("selected"));button.classList.add("selected");state.response=button.dataset.id;});
  document.getElementById("check").onclick=()=>check(question);
  document.getElementById("prev").onclick=()=>{if(state.index>0){state.index--;render();scrollQuestionIntoView();persistContinue();}};
  document.getElementById("next").onclick=()=>nextQuestion();
  persistContinue();
}
function check(question){
  if(state.checked)return;
  if(!["mcq","true_false"].includes(question.type))state.response=document.getElementById("answerInput")?.value||"";
  const auto=ECHSBank.isAutoGradable(question),correct=auto?ECHSBank.answerIsCorrect(question,state.response):null;
  state.checked=true;lastResult=correct;
  if(auto&&!state.answered.has(question.id)){
    state.graded++;if(correct)state.correct++;state.answered.add(question.id);
    ECHSBank.saveAttempt(question,correct,state.response,{mode:UI.mode.value,sessionId:session?.id,assignmentId,durationMs:Date.now()-questionStartedAt});
  }
  if(["mcq","true_false"].includes(question.type))document.querySelectorAll(".choice").forEach(button=>{if((question.correct_choice_ids||[]).includes(button.dataset.id))button.classList.add("correct");else if(button.dataset.id===state.response)button.classList.add("incorrect");button.disabled=true;});
  const feedback=document.getElementById("feedback");feedback.className=`feedback show ${correct===false?"incorrect":"correct"}`;const accepted=(question.accepted_answers||[]).join(" / ");
  const adaptiveNote=UI.mode.value==="adaptive"&&auto?`<p><b>Adaptive next step:</b> ${correct?"difficulty may increase or the topic may broaden":"the next question will reinforce the prerequisite level"}.</p>`:"";
  feedback.innerHTML=`<strong>${auto?(correct?"Correct.":"Not correct. This question was added to your Mistake Bank."):"Open response: compare your work with the available source feedback."}</strong>${adaptiveNote}${accepted?`<p><b>Accepted answer:</b> ${ECHSBank.escape(accepted)}</p>`:""}${question.solution_html?`<div class="solution">${question.solution_html}</div>`:'<div class="solution">A detailed worked solution was not included in this source collection. The publisher answer key is used for auto-gradable questions.</div>'}`;
  hydrateAssets(feedback);persistContinue();
}
function nextQuestion(){
  if(state.index<set.length-1){state.index++;render();scrollQuestionIntoView();return;}
  if(UI.mode.value==="adaptive"&&set.length<targetCount){
    const candidates=ECHSLearning.selectAdaptive(ECHSBank.filterQuestions(loaded,filters()),1,{excludedIds:set.map(q=>q.id),lastCorrect:lastResult});
    if(candidates.length){set.push(candidates[0]);state.index++;render();scrollQuestionIntoView();return;}
  }
  finish();
}
function finish(){
  const percentage=state.graded?Math.round(state.correct/state.graded*100):null;
  if(session)ECHSLearning.endSession(session.id,{questionIds:set.map(q=>q.id),answered:state.graded,correct:state.correct,score:percentage,assignmentId});
  ECHSLearning.clearContinue();
  UI.shell.innerHTML=`<div class="result"><div class="resultScore">${percentage==null?"Practice complete":`${state.correct} / ${state.graded} (${percentage}%)`}</div><p>You reviewed ${set.length} question(s). Mastery, review timing and the Mistake Bank were updated automatically.</p><div class="heroActions"><a class="button wine" href="dashboard.html">Open Student Dashboard</a><a class="button ghost" href="mistakes.html">Review mistakes</a><button class="button ghost" id="anotherSet">Create another set</button></div></div>`;
  document.getElementById("anotherSet").onclick=()=>{session=null;UI.shell.innerHTML='<div class="empty"><div class="emptyState"><div class="emptyStateIcon">∫</div><h2>Build another practice set</h2><p>Adjust the mode or filters and select Generate Practice Set.</p></div></div>';UI.start.focus();};
  resumeBanner();
}
function eligibleRows(){
  let rows=ECHSBank.filterQuestions(loaded,filters()),mode=UI.mode.value;
  if(mode==="review"){const ids=new Set(ECHSLearning.dueReviews().map(row=>row.questionId));rows=rows.filter(q=>ids.has(String(q.id)));}
  if(mode==="mistakes"){const ids=new Set(ECHSLearning.mistakes().map(row=>row.questionId));rows=rows.filter(q=>ids.has(String(q.id)));}
  return rows;
}
async function start(){
  const rows=eligibleRows();targetCount=UI.count.value==="all"?rows.length:Number(UI.count.value);lastResult=null;
  set=UI.mode.value==="adaptive"?ECHSLearning.selectAdaptive(rows,Math.min(1,targetCount)):ECHSBank.shuffle(rows).slice(0,targetCount);
  state={index:0,response:null,checked:false,correct:0,graded:0,answered:new Set()};
  session=ECHSLearning.startSession({type:"practice",mode:UI.mode.value,bundleId:currentBundle()?.id,bundleLabel:displayBundleLabel(currentBundle()),questionIds:set.map(q=>q.id),targetCount,assignmentId,title:assignmentTitle});
  UI.status.innerHTML=`<span class="pill teal">${rows.length.toLocaleString()} eligible questions</span><span class="pill wine">${targetCount.toLocaleString()} planned</span><span class="pill gold">${ECHSBank.escape(modeCopy[UI.mode.value]?.[0])}</span>`;
  render();scrollQuestionIntoView();resumeBanner();
}
function restore(){
  const saved=ECHSLearning.getContinue();
  if(!saved||saved.type!=="practice"||saved.bundleId!==currentBundle()?.id)return false;
  UI.mode.value=saved.mode||"manual";updateModeCopy();targetCount=Number(saved.targetCount)||saved.questionIds?.length||10;
  const map=new Map(loaded.map(q=>[String(q.id),q]));set=(saved.questionIds||[]).map(id=>map.get(String(id))).filter(Boolean);
  if(!set.length)return false;
  state={index:Math.min(Number(saved.index)||0,set.length-1),response:null,checked:false,correct:Number(saved.correct)||0,graded:Number(saved.graded)||0,answered:new Set(saved.answeredIds||[])};
  session=ECHSLearning.activeSession(saved.sessionId)||ECHSLearning.startSession({type:"practice",mode:UI.mode.value,bundleId:saved.bundleId,questionIds:set.map(q=>q.id),targetCount,assignmentId:saved.assignmentId});
  render();scrollQuestionIntoView();return true;
}

(async()=>{
  try{
    catalog=await ECHSBank.loadCatalog();const selected=ECHSBank.selectedBundleFromParams(catalog);
    fillGroups(selected.group);fillBundles(selected.row?.id);
    UI.mode.value=params.get("mode")||"manual";if(params.get("count"))UI.count.value=params.get("count");if(params.get("difficulty"))UI.difficulty.value=params.get("difficulty");updateModeCopy();
    await loadCurrent();assignmentBanner();resumeBanner();
    const learning=ECHSLearning.summary();UI.heroDue.textContent=learning.due.toLocaleString();UI.heroMastery.textContent=learning.mastered.toLocaleString();
    UI.group.onchange=async()=>{fillBundles();await loadCurrent();};UI.bundle.onchange=loadCurrent;UI.mode.onchange=updateModeCopy;
    UI.start.onclick=()=>start().catch(error=>UI.shell.innerHTML=`<div class="notice">${ECHSBank.escape(error.message)}</div>`);
    if(params.get("resume")==="1"){if(!restore())resumeBanner();}
    else if(params.get("autostart")==="1")start();
  }catch(error){UI.shell.innerHTML=`<div class="notice">${ECHSBank.escape(error.message)}. Serve the folder through HTTP rather than opening it with file://.</div>`;}
})();