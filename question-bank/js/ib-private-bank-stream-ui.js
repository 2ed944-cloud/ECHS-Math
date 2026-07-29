/* Refresh the focused-practice inventory while authenticated IB questions stream in. */
(function(){
  "use strict";
  const number=value=>Number(value||0).toLocaleString();
  const escape=value=>window.ECHSBank?.escape?.(value)||String(value||"").replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[char]);

  function updateSelect(select,options,allLabel,labelFor){
    if(!select)return;
    const wanted=select.value||"all";
    select.innerHTML=`<option value="all">${escape(allLabel)}</option>`+options.map(value=>`<option value="${escape(value)}">${escape(labelFor(value))}</option>`).join("");
    select.value=options.includes(wanted)?wanted:"all";
  }

  function refresh(event){
    const detail=event.detail||{};
    if(detail.course!=="ib-math-ai"||!Array.isArray(detail.questions))return;
    const questions=detail.questions;
    const loaded=Number(detail.loaded??questions.length);
    const total=Number(detail.total??loaded);
    const complete=detail.complete===true;
    const heroLoaded=document.getElementById("heroLoaded");
    const heroBanks=document.getElementById("heroBanks");
    const status=document.getElementById("status");
    const shell=document.getElementById("shell");
    if(heroLoaded)heroLoaded.textContent=number(loaded);

    const banks=[...new Set(questions.map(question=>question?.bank_code).filter(Boolean))].sort();
    if(heroBanks)heroBanks.textContent=number(banks.length);
    updateSelect(document.getElementById("bank"),banks,"All ECHS banks",code=>window.ECHSBank?.bankLabel?.(code)||code);

    const sections=new Map();
    questions.forEach(question=>{
      const value=String(question?.source?.section||"unmapped");
      const title=question?.source?.section_title||question?.source?.skill_title||"";
      sections.set(value,value==="unmapped"?"General practice":`${value}${title?` · ${title}`:""}`);
    });
    const sectionValues=[...sections.keys()].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
    updateSelect(document.getElementById("section"),sectionValues,"All practice sections",value=>window.ECHSBank?.cleanStudentLabel?.(sections.get(value))||sections.get(value));

    document.documentElement.dataset.ibCourseBankLoaded=String(loaded);
    document.documentElement.dataset.privateQuestionRows=String(loaded);
    if(!status||shell?.querySelector(".questionCard,.result"))return;
    const blocked=Number(detail.blocked||0);
    if(detail.partialError){
      status.innerHTML=`<span class="pill gold">${number(loaded)} questions ready</span><span class="pill">Background loading will retry after refresh</span>`;
    }else if(complete){
      status.innerHTML=`<span class="pill teal">${number(loaded)} questions available</span>${blocked?`<span class="pill gold">${number(blocked)} non-catalog mappings withheld</span>`:""}`;
    }else{
      status.innerHTML=`<span class="pill teal">${number(loaded)} questions ready now</span><span class="pill">Loading ${number(total)} mapped questions in the background…</span>`;
    }
  }

  window.addEventListener("echs:private-bank-summary",refresh);
  document.documentElement.dataset.ibPrivateStreamUi="ready";
})();
