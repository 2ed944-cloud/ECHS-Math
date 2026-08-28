(()=>{"use strict";
const D=window.ECHS_CALC_L0_DATA,Q=window.ECHS_CALC_L0_DIAGNOSTIC;
if(!D||!Q)throw new Error("AP Calculus Lesson 0 data failed to load.");
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const viewport=$("#slideViewport"),stage=$("#currentStage"),counter=$("#slideCounter"),fill=$("#progressFill"),prev=$("#prevBtn"),next=$("#nextBtn"),toast=$("#toast");
const STORE="echs-ap-calculus-lesson-0";
let current=0,timer=null,remaining=90,submitted=false;
const state={
 track:localStorage.getItem(STORE+":track")||"AB",
 answers:JSON.parse(localStorage.getItem(STORE+":answers")||"{}"),
 confidence:JSON.parse(localStorage.getItem(STORE+":confidence")||"{}")
};
function say(msg){toast.textContent=msg;toast.classList.add("show");clearTimeout(toast._t);toast._t=setTimeout(()=>toast.classList.remove("show"),1800)}
function save(){localStorage.setItem(STORE+":answers",JSON.stringify(state.answers));localStorage.setItem(STORE+":track",state.track);localStorage.setItem(STORE+":confidence",JSON.stringify(state.confidence))}
function markup(s,i){return `<section class="slide" data-id="${s.id}" aria-hidden="true"><div class="slide-inner">${s.id==="welcome"?"":`<header class="slide-head"><div><p class="slide-eyebrow">${s.stage}</p><h2 class="slide-title">${s.title}</h2>${s.subtitle?`<p class="slide-subtitle">${s.subtitle}</p>`:""}</div><span class="slide-number-big">${i+1}</span></header>`}<div class="slide-body">${s.body}</div></div></section>`}
viewport.innerHTML=D.slides.map(markup).join("");
const slides=$$(".slide",viewport);
function typeset(root=document){
 try{if(window.MathJax?.typesetPromise)return window.MathJax.typesetPromise([root]).catch(()=>{});}catch(e){}
 try{if(window.renderMathInElement){window.renderMathInElement(root,{delimiters:[{left:"\\(",right:"\\)",display:false},{left:"\\[",right:"\\]",display:true}],throwOnError:false});}}catch(e){}
}
function show(i,push=true){current=Math.max(0,Math.min(i,slides.length-1));slides.forEach((el,j)=>{el.classList.toggle("active",j===current);el.setAttribute("aria-hidden",j===current?"false":"true")});const s=D.slides[current];stage.textContent=s.stage;counter.textContent=`${current+1} / ${slides.length}`;fill.style.width=`${(current+1)/slides.length*100}%`;prev.disabled=current===0;next.disabled=current===slides.length-1;localStorage.setItem(STORE+":slide",String(current));if(push)history.replaceState(null,"","#"+s.id);viewport.scrollTop=0;typeset(slides[current])}
function go(id){const i=D.slides.findIndex(s=>s.id===id);if(i>=0)show(i)}
prev.onclick=()=>show(current-1);next.onclick=()=>show(current+1);$$(".route-pill").forEach(b=>b.onclick=()=>go(b.dataset.go));
document.addEventListener("keydown",e=>{if(["INPUT","TEXTAREA","SELECT"].includes(document.activeElement?.tagName))return;if(e.key==="ArrowRight")show(current+1);if(e.key==="ArrowLeft")show(current-1)});
function bindSaved(){ $$("[data-save-key]").forEach(el=>{const key=STORE+":field:"+el.dataset.saveKey;if(el.value==="")el.value=localStorage.getItem(key)||"";el.addEventListener("input",()=>localStorage.setItem(key,el.value))})}
function updateTrackUI(){
 $$(".track-btn[data-track]").forEach(b=>b.classList.toggle("selected",b.dataset.track===state.track));
 const t=$("#trackCurrent");if(t)t.textContent=state.track;
 const sel=$("#identityTrack");if(sel)sel.value=state.track==="BC"?"AP Calculus BC":"AP Calculus AB";
 renderStrand("G");renderSubmitSummary();renderBCResult();
}
$$(".track-btn[data-track]").forEach(b=>b.onclick=()=>{state.track=b.dataset.track;save();updateTrackUI();say(`${state.track} track selected`)});
$$(".rep-btn").forEach(b=>b.onclick=()=>{$$(".rep-btn").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");localStorage.setItem(STORE+":rep",b.dataset.rep)});
const savedRep=localStorage.getItem(STORE+":rep");if(savedRep)$(`.rep-btn[data-rep="${savedRep}"]`)?.classList.add("selected");
$("#identityTrack")?.addEventListener("change",e=>{state.track=e.target.value.includes("BC")?"BC":"AB";save();updateTrackUI()});
$$(".bingo-cell").forEach(b=>b.onclick=()=>b.classList.toggle("done"));
function timerText(){const el=$("#pairTimer");if(el)el.textContent=`${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,"0")}`}
$("#pairStart")?.addEventListener("click",()=>{if(timer){clearInterval(timer);timer=null;return}timer=setInterval(()=>{remaining=Math.max(0,remaining-1);timerText();if(!remaining){clearInterval(timer);timer=null;say("Switch partners")}},1000)});
$("#pairReset")?.addEventListener("click",()=>{clearInterval(timer);timer=null;remaining=90;timerText()});
const commonStrands=["A","B","C","D","E","F"];
function qFor(strand){return Q.questions.filter(q=>q.strand===strand)}
function renderStrand(strand){
 const host=$("#diagnostic-"+strand);if(!host)return;
 if(strand==="G"&&state.track!=="BC"){host.innerHTML='<div class="notice">BC extension is hidden because AB is selected. Switch to BC on the Track slide to activate it.</div>';return}
 host.innerHTML=qFor(strand).map(q=>`<article class="diagnostic-item" data-q="${q.id}"><header><span>${q.id}</span><strong>${Q.strands[strand].name}</strong></header><p>${q.prompt}</p><div class="choices">${q.choices.map((c,i)=>`<button class="choice-btn ${state.answers[q.id]===i?"selected":""}" data-i="${i}">${String.fromCharCode(65+i)}. ${c}</button>`).join("")}</div></article>`).join("");
 $$(".diagnostic-item",host).forEach(card=>{const qid=card.dataset.q;$$(".choice-btn",card).forEach(btn=>btn.onclick=()=>{state.answers[qid]=Number(btn.dataset.i);save();$$(".choice-btn",card).forEach(x=>x.classList.remove("selected"));btn.classList.add("selected");renderSubmitSummary()})});
 typeset(host)
}
[...commonStrands,"G"].forEach(renderStrand);
function requiredQuestions(){return Q.questions.filter(q=>commonStrands.includes(q.strand)||(state.track==="BC"&&q.strand==="G"))}
function renderSubmitSummary(){
 const host=$("#diagnosticSubmitSummary");if(!host)return;
 const req=requiredQuestions(),answered=req.filter(q=>Number.isInteger(state.answers[q.id])).length;
 host.innerHTML=`<strong>${answered} / ${req.length} answered.</strong> ${state.track==="BC"?"BC includes the 6-item extension.":"AB requires the 36 common items."}`;
}
renderSubmitSummary();
function band(p){if(p>=85)return["Ready","Your prerequisites are broadly secure. Maintain them through cumulative retrieval."];if(p>=70)return["Ready with targeted repair","Begin calculus while repairing the weakest one or two strands."];if(p>=55)return["Priority repair","You can begin the course, but prerequisite repair should be scheduled immediately."];return["Intensive prerequisite support","Multiple prerequisite strands need structured repair alongside Unit 1."]}
function commonResults(){
 const qs=Q.questions.filter(q=>commonStrands.includes(q.strand));const correct=qs.filter(q=>state.answers[q.id]===q.correct).length;return{correct,total:36,pct:Math.round(correct/36*100)}
}
function strandResults(strand){
 const qs=qFor(strand);const correct=qs.filter(q=>state.answers[q.id]===q.correct).length;return{correct,total:qs.length,pct:Math.round(correct/qs.length*100)}
}
function renderOverall(){
 const host=$("#overallResult");if(!host||!submitted)return;
 const r=commonResults(),[label,note]=band(r.pct);
 host.innerHTML=`<div class="result-summary"><div class="score-ring" style="--score:${r.pct}%"><strong>${r.pct}%</strong></div><div><h3>${label}</h3><p><strong>${r.correct} / ${r.total}</strong> common prerequisite items correct.</p><p>${note}</p><div class="notice">This is a support-planning snapshot, not an achievement grade and not a stand-alone placement decision.</div></div></div>`
}
function renderProfile(){
 const host=$("#strandProfile");if(!host||!submitted)return;
 host.innerHTML=commonStrands.map(s=>{const r=strandResults(s),cl=r.pct>=80?"secure":r.pct>=60?"repair":"priority";return `<div class="strand-row"><strong>${s} · ${Q.strands[s].name}</strong><div class="bar"><i class="${cl}" style="width:${r.pct}%"></i></div><span>${r.correct}/6</span></div>`}).join("")
}
function renderBCResult(){
 const host=$("#bcResult");if(!host)return;
 if(!submitted){host.innerHTML='<div class="notice">BC extension results appear after submission.</div>';return}
 if(state.track!=="BC"){host.innerHTML='<div class="notice">AB selected. BC extension is not part of your readiness profile.</div>';return}
 const r=strandResults("G");host.innerHTML=`<div class="result-card"><h3>BC extension · ${r.correct}/6 (${r.pct}%)</h3><p>${r.pct>=80?"Strong readiness for BC-specific prerequisite notation and structures.":r.pct>=60?"Some targeted BC prerequisite review is recommended.":"Prioritize parametric/polar/sequence foundations before Units 9–10."}</p></div>`
}
function renderPriorities(){
 const host=$("#repairPriorities");if(!host||!submitted)return;
 const rows=commonStrands.map(s=>({s,...strandResults(s)})).sort((a,b)=>a.pct-b.pct);
 host.innerHTML=rows.map((r,i)=>`<article class="result-card"><h3>${i+1}. ${r.s} · ${Q.strands[r.s].name} — ${r.correct}/6</h3><p><strong>Repair focus:</strong> ${Q.strands[r.s].repair}.</p></article>`).join("")
}
function renderMissed(){
 const host=$("#missedReview");if(!host||!submitted)return;
 const missed=requiredQuestions().filter(q=>state.answers[q.id]!==q.correct);
 host.innerHTML=missed.length?missed.map(q=>`<article class="missed"><h4>${q.id} · ${Q.strands[q.strand].name}</h4><p>${q.prompt}</p><p><strong>Your choice:</strong> ${q.choices[state.answers[q.id]]??"No response"}</p><p><strong>Correct:</strong> ${q.choices[q.correct]}</p><p>${q.explanation}</p></article>`).join(""):'<div class="notice success"><strong>No missed items.</strong> Maintain prerequisite fluency through retrieval rather than stopping review entirely.</div>';typeset(host)
}
function renderConfidence(){
 const host=$("#confidenceControls");if(!host)return;
 host.innerHTML=commonStrands.map(s=>`<label>${s} · ${Q.strands[s].name}<select data-conf="${s}"><option value="">Choose 1–4</option>${[1,2,3,4].map(v=>`<option value="${v}" ${state.confidence[s]==v?"selected":""}>${v} · ${["","Low","Developing","Confident","Very confident"][v]}</option>`).join("")}</select></label>`).join("");
 $$("select[data-conf]",host).forEach(sel=>sel.onchange=()=>{state.confidence[sel.dataset.conf]=Number(sel.value)||null;save();renderConfidenceComparison()});renderConfidenceComparison()
}
function renderConfidenceComparison(){
 const host=$("#confidenceComparison");if(!host||!submitted){if(host)host.textContent="Submit the diagnostic to compare confidence with evidence.";return}
 const notes=[];commonStrands.forEach(s=>{const c=state.confidence[s],p=strandResults(s).pct;if(!c)return;if(c>=3&&p<60)notes.push(`${s}: confidence is ahead of evidence—slow down and verify.`);if(c<=2&&p>=80)notes.push(`${s}: evidence is stronger than confidence—build trust through retrieval.`)});
 host.innerHTML=notes.length?notes.map(x=>`<p>${x}</p>`).join(""):"<p>Your confidence/evidence profile is reasonably aligned, or more confidence ratings are needed.</p>"
}
function renderFirstWeek(){
 const host=$("#firstWeekPlan");if(!host||!submitted)return;
 const rows=commonStrands.map(s=>({s,...strandResults(s)})).sort((a,b)=>a.pct-b.pct).slice(0,2);
 host.innerHTML=`<div class="timeline"><article><b>Day 1–2</b><p>Repair ${rows[0].s}: ${Q.strands[rows[0].s].repair}.</p></article><article><b>Day 3–4</b><p>Repair ${rows[1].s}: ${Q.strands[rows[1].s].repair}.</p></article><article><b>Day 5</b><p>Mixed no-calculator retrieval from both priority strands.</p></article><article><b>Ongoing</b><p>Continue Unit 1 while embedding micro-repair instead of delaying calculus.</p></article></div>`
}
function markDiagnostics(){
 requiredQuestions().forEach(q=>{const card=$(`.diagnostic-item[data-q="${q.id}"]`);if(!card)return;$$(".choice-btn",card).forEach((b,i)=>{b.classList.remove("correct","incorrect");if(i===q.correct)b.classList.add("correct");else if(i===state.answers[q.id])b.classList.add("incorrect")})})
}
function renderAllResults(){renderOverall();renderProfile();renderBCResult();renderPriorities();renderMissed();renderConfidence();renderFirstWeek();markDiagnostics();typeset(document)}
$("#submitDiagnostic")?.addEventListener("click",()=>{
 const req=requiredQuestions(),answered=req.filter(q=>Number.isInteger(state.answers[q.id])).length;if(answered<req.length){say(`Complete all ${req.length} required items first`);return}
 submitted=true;localStorage.setItem(STORE+":submitted","1");renderAllResults();say("Diagnostic submitted");go("overall-result")
});
$("#clearDiagnostic")?.addEventListener("click",()=>{state.answers={};submitted=false;localStorage.removeItem(STORE+":submitted");save();[...commonStrands,"G"].forEach(renderStrand);renderSubmitSummary();say("Responses cleared")});
function exportSummary(){
 if(!submitted){say("Submit the diagnostic first");return}
 const r=commonResults(),lines=[`AP Calculus Lesson 0 Diagnostic`,`Track: ${state.track}`,`Common readiness: ${r.correct}/36 (${r.pct}%)`,""];
 commonStrands.forEach(s=>{const x=strandResults(s);lines.push(`${s} ${Q.strands[s].name}: ${x.correct}/6 (${x.pct}%)`)});
 if(state.track==="BC"){const x=strandResults("G");lines.push(`BC Extension: ${x.correct}/6 (${x.pct}%)`)}
 lines.push("","Top repair priorities:");
 commonStrands.map(s=>({s,...strandResults(s)})).sort((a,b)=>a.pct-b.pct).slice(0,3).forEach((x,i)=>lines.push(`${i+1}. ${x.s} ${Q.strands[x.s].name}: ${Q.strands[x.s].repair}`));
 const blob=new Blob([lines.join("\n")],{type:"text/plain"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="AP_Calculus_Lesson_0_Diagnostic_Summary.txt";a.click();URL.revokeObjectURL(a.href)
}
$("#exportSummary")?.addEventListener("click",exportSummary);
function markComplete(){
 const params=new URLSearchParams(location.search),key=params.get("lessonKey");if(key){let arr=[];try{arr=JSON.parse(localStorage.getItem("echs_math_complete")||"[]")}catch{}if(!Array.isArray(arr))arr=[];if(!arr.includes(key)){arr.push(key);localStorage.setItem("echs_math_complete",JSON.stringify(arr))}}
 localStorage.setItem(STORE+":complete","1");say("Lesson 0 marked complete")
}
$("#markComplete")?.addEventListener("click",markComplete);
submitted=localStorage.getItem(STORE+":submitted")==="1";
bindSaved();updateTrackUI();renderConfidence();if(submitted)renderAllResults();
const hash=location.hash.replace(/^#/,""),hi=D.slides.findIndex(s=>s.id===hash),saved=Number(localStorage.getItem(STORE+":slide")||0);show(hi>=0?hi:saved,false);
setTimeout(()=>typeset(document),600);
})();