const UI={
  group:document.getElementById("group"),bundle:document.getElementById("bundle"),bank:document.getElementById("bank"),type:document.getElementById("type"),difficulty:document.getElementById("difficulty"),section:document.getElementById("section"),count:document.getElementById("count"),start:document.getElementById("start"),status:document.getElementById("status"),shell:document.getElementById("shell"),heroLoaded:document.getElementById("heroLoaded"),heroBanks:document.getElementById("heroBanks")
};
let catalog,loaded=[],set=[],loading=false,state={index:0,response:null,checked:false,correct:0,graded:0,answered:new Set()};
document.querySelector('.navLink[href="practice.html"]')?.classList.add('active');

function groupRows(){return ECHSBank.bundleGroups(catalog);}
function displayBundleLabel(row){return ECHSBank.cleanStudentLabel(row?.label||'Practice collection');}
function fillGroups(selected){UI.group.innerHTML=groupRows().map(group=>`<option value="${group.key}" ${group.key===selected?'selected':''}>${ECHSBank.escape(group.label)}</option>`).join('');}
function fillBundles(selectedId){
  const rows=catalog.bundles[UI.group.value]||[];
  UI.bundle.innerHTML=rows.map(row=>`<option value="${ECHSBank.escape(row.id)}" ${row.id===selectedId?'selected':''}>${ECHSBank.escape(displayBundleLabel(row))} (${Number(row.count||0).toLocaleString()})</option>`).join('');
}
function currentBundle(){return(catalog.bundles[UI.group.value]||[]).find(row=>row.id===UI.bundle.value);}
function setBusy(value){loading=value;UI.start.disabled=value;UI.group.disabled=value;UI.bundle.disabled=value;UI.start.textContent=value?'Loading questions…':'Generate Practice Set';}

window.addEventListener('echs:bundle-progress',event=>{
  if(!loading)return;
  const {completed,total}=event.detail||{};
  if(total>1)UI.status.innerHTML=`<span class="pill">Loading collection ${completed} of ${total}…</span>`;
});

async function loadCurrent(){
  const row=currentBundle();if(!row)return;
  setBusy(true);UI.status.innerHTML='<span class="pill">Loading collection…</span>';
  try{
    loaded=await ECHSBank.loadBundle(row);
    if(UI.heroLoaded)UI.heroLoaded.textContent=loaded.length.toLocaleString();
    const banks=[...new Set(loaded.map(question=>question.bank_code).filter(Boolean))].sort();
    if(UI.heroBanks)UI.heroBanks.textContent=banks.length.toLocaleString();
    const wanted=ECHSBank.params().get('bank')||UI.bank.value;
    UI.bank.innerHTML='<option value="all">All collections</option>'+banks.map(code=>`<option value="${ECHSBank.escape(code)}" ${code===wanted?'selected':''}>${ECHSBank.escape(ECHSBank.bankLabel(code))}</option>`).join('');
    const sections=new Map();
    loaded.forEach(question=>{
      const value=String(question.source?.section||'unmapped');
      const title=question.source?.section_title||question.source?.skill_title||'';
      sections.set(value,value==='unmapped'?'General practice':`${value}${title?` · ${title}`:''}`);
    });
    UI.section.innerHTML='<option value="all">All chapters and sections</option>'+[...sections].sort((a,b)=>a[0].localeCompare(b[0],undefined,{numeric:true})).map(([value,label])=>`<option value="${ECHSBank.escape(value)}">${ECHSBank.escape(ECHSBank.cleanStudentLabel(label))}</option>`).join('');
    UI.status.innerHTML=`<span class="pill teal">${loaded.length.toLocaleString()} questions available</span><span class="pill wine">${ECHSBank.escape(displayBundleLabel(row))}</span>`;
  }catch(error){
    UI.status.innerHTML='<span class="pill red">Collection unavailable</span>';
    UI.shell.innerHTML=`<div class="notice"><strong>Could not load this collection.</strong><br>${ECHSBank.escape(error.message)}</div>`;
    throw error;
  }finally{setBusy(false);}
}

function filters(){return{bank:UI.bank.value,type:UI.type.value,difficulty:UI.difficulty.value,section:UI.section.value};}
function hydrateAssets(root){if(window.ECHSBlackboardAssets)ECHSBlackboardAssets.hydrate(root).catch(error=>console.warn(error));}
function scrollQuestionIntoView(){UI.shell.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});}

function render(){
  const question=set[state.index];
  if(!question){UI.shell.innerHTML='<div class="empty"><div class="emptyState"><div class="emptyStateIcon">!</div><h2>No matching questions</h2><p>Change one or more filters, then generate the set again.</p></div></div>';return;}
  state.response=null;state.checked=false;
  const choices=ECHSBank.choiceOrder(question),classification=question.classification||{},source=question.source||{},auto=ECHSBank.isAutoGradable(question);
  const responseHTML=["mcq","true_false"].includes(question.type)
    ?`<div class="choices">${choices.map((choice,index)=>`<button class="choice" data-id="${ECHSBank.escape(choice.id)}"><span class="choiceLabel">${String.fromCharCode(65+index)}</span><span>${choice.html}</span></button>`).join('')}</div>`
    :question.type==='fill_blank'
      ?'<div class="control" style="margin-top:1rem"><label for="answerInput">Your answer</label><input id="answerInput" autocomplete="off"></div>'
      :'<div class="control" style="margin-top:1rem"><label for="answerInput">Your response</label><textarea id="answerInput" rows="7"></textarea></div>';
  UI.shell.innerHTML=`<article class="questionCard"><div class="pillRow"><span class="pill wine">Question ${state.index+1} of ${set.length}</span><span class="pill teal">${ECHSBank.escape(ECHSBank.bankLabel(question.bank_code))}</span>${classification.ap_topic?`<span class="pill gold">AP ${ECHSBank.escape(classification.ap_topic)}</span>`:''}<span class="pill">${ECHSBank.escape(source.section||'General')}</span><span class="pill">${ECHSBank.escape(ECHSBank.labelType(question.type))}</span>${question.metadata?.difficulty?`<span class="pill">Difficulty ${question.metadata.difficulty}</span>`:''}</div><div class="progressTrack"><i style="width:${((state.index+1)/set.length)*100}%"></i></div><h2>${ECHSBank.escape(ECHSBank.cleanStudentLabel(classification.ap_topic_title||source.skill_title||source.section_title||question.pool_title||'Practice question'))}</h2><div class="prompt">${question.prompt_html}</div>${responseHTML}<div id="feedback" class="feedback" aria-live="polite"></div><div class="questionFooter"><button class="button primary" id="check">${auto?'Check answer':'Reveal source answer / feedback'}</button><div><button class="button ghost" id="prev" ${state.index===0?'disabled':''}>Back</button> <button class="button wine" id="next">${state.index===set.length-1?'Finish':'Next'}</button></div></div></article>`;
  hydrateAssets(UI.shell);
  if(["mcq","true_false"].includes(question.type))document.querySelectorAll('.choice').forEach(button=>button.onclick=()=>{if(state.checked)return;document.querySelectorAll('.choice').forEach(item=>item.classList.remove('selected'));button.classList.add('selected');state.response=button.dataset.id;});
  document.getElementById('check').onclick=()=>check(question);
  document.getElementById('prev').onclick=()=>{if(state.index>0){state.index--;render();scrollQuestionIntoView();}};
  document.getElementById('next').onclick=()=>{if(state.index<set.length-1){state.index++;render();scrollQuestionIntoView();}else finish();};
}

function check(question){
  if(state.checked)return;
  if(!["mcq","true_false"].includes(question.type))state.response=document.getElementById('answerInput')?.value||'';
  const auto=ECHSBank.isAutoGradable(question),correct=auto?ECHSBank.answerIsCorrect(question,state.response):null;
  state.checked=true;
  if(auto&&!state.answered.has(question.id)){state.graded++;if(correct)state.correct++;state.answered.add(question.id);ECHSBank.saveAttempt(question,correct,state.response);}
  if(["mcq","true_false"].includes(question.type))document.querySelectorAll('.choice').forEach(button=>{if((question.correct_choice_ids||[]).includes(button.dataset.id))button.classList.add('correct');else if(button.dataset.id===state.response)button.classList.add('incorrect');button.disabled=true;});
  const feedback=document.getElementById('feedback');feedback.className=`feedback show ${correct===false?'incorrect':'correct'}`;
  const accepted=(question.accepted_answers||[]).join(' / ');
  feedback.innerHTML=`<strong>${auto?(correct?'Correct.':'Not correct. Review the highlighted answer.'):'Open response: compare your work with the available source feedback.'}</strong>${accepted?`<p><b>Accepted answer:</b> ${ECHSBank.escape(accepted)}</p>`:''}${question.solution_html?`<div class="solution">${question.solution_html}</div>`:'<div class="solution">A detailed worked solution was not included in this source collection. The publisher answer key is used for auto-gradable questions.</div>'}`;
  hydrateAssets(feedback);
}

function finish(){
  const percentage=state.graded?Math.round(state.correct/state.graded*100):null;
  UI.shell.innerHTML=`<div class="result"><div class="resultScore">${percentage==null?'Practice complete':`${state.correct} / ${state.graded} (${percentage}%)`}</div><p>You reviewed ${set.length} question(s). ${state.graded?`${state.graded} auto-gradable response(s) were saved to your dashboard.`:'This set contained open-response items.'}</p><div class="heroActions"><a class="button wine" href="dashboard.html">Open My Progress</a><button class="button ghost" id="anotherSet">Create another set</button></div></div>`;
  document.getElementById('anotherSet').onclick=()=>{UI.shell.innerHTML='<div class="empty"><div class="emptyState"><div class="emptyStateIcon">∫</div><h2>Build another practice set</h2><p>Adjust the filters and choose Generate Practice Set.</p></div></div>';UI.start.focus();};
}

async function start(){
  let rows=ECHSBank.shuffle(ECHSBank.filterQuestions(loaded,filters()));
  const count=UI.count.value==='all'?rows.length:Number(UI.count.value);
  set=rows.slice(0,count);state={index:0,response:null,checked:false,correct:0,graded:0,answered:new Set()};
  UI.status.innerHTML=`<span class="pill teal">${loaded.length.toLocaleString()} questions available</span><span class="pill wine">${set.length.toLocaleString()} selected</span>`;
  render();scrollQuestionIntoView();
}

(async()=>{
  try{
    catalog=await ECHSBank.loadCatalog();
    const selected=ECHSBank.selectedBundleFromParams(catalog);
    fillGroups(selected.group);fillBundles(selected.row?.id);await loadCurrent();
    UI.group.onchange=async()=>{fillBundles();await loadCurrent();};UI.bundle.onchange=loadCurrent;
    UI.start.onclick=()=>start().catch(error=>UI.shell.innerHTML=`<div class="notice">${ECHSBank.escape(error.message)}</div>`);
    if(ECHSBank.params().get('autostart')==='1')start();
  }catch(error){UI.shell.innerHTML=`<div class="notice">${ECHSBank.escape(error.message)}. Serve the folder through HTTP rather than opening it with file://.</div>`;}
})();
