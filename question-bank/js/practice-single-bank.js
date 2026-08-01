/* Keep each student practice session inside one explicitly selected bank. */
(function(){
  "use strict";
  function install(){
    if(!window.ECHSBank||!window.ECHSLearning)return setTimeout(install,40);
    if(document.documentElement.dataset.practiceBankIsolation==="ready")return;
    const query=new URLSearchParams(location.search);
    const CALCULUS_PRACTICE_BANKS=new Set(["ADAMS10","CALCT3BC"]);
    const courseSelect=()=>document.getElementById("course");
    const selectedCourse=()=>String(courseSelect()?.value||query.get("course")||"").trim().toLowerCase();
    const isCalculusCourse=()=>["ap-calculus","ap calculus","calculus"].includes(selectedCourse());
    const optionCode=option=>{
      const value=String(option?.value||"").trim().toUpperCase();
      if(CALCULUS_PRACTICE_BANKS.has(value))return value;
      const label=String(option?.textContent||"").toUpperCase();
      return [...CALCULUS_PRACTICE_BANKS].find(code=>label.includes(code))||value;
    };
    function enforceCalculusSourceInventory(){
      const bank=document.getElementById("bank");
      if(!bank||!isCalculusCourse())return;
      [...bank.options].forEach(option=>{
        if(!option.value||option.value==="all")return;
        if(!CALCULUS_PRACTICE_BANKS.has(optionCode(option))&&option.dataset.privateBank!=="true")option.remove();
      });
      const available=[...bank.options].filter(option=>option.value&&option.value!=="all");
      if(available.length&&!available.includes(bank.selectedOptions?.[0])){
        bank.value=available[0].value;
        preferredBank=bank.value;
      }
      document.documentElement.dataset.calculusPracticeInventory="bundled-and-private";
    }
    const saved=query.get("resume")==="1"?ECHSLearning.getContinue?.():null;
    let preferredBank=query.get("bank")||(saved?.type==="practice"?saved.bankCode:"")||"";
    const originalFilter=ECHSBank.filterQuestions.bind(ECHSBank);
    const originalContinue=ECHSLearning.setContinue?.bind(ECHSLearning);
    const originalStart=ECHSLearning.startSession?.bind(ECHSLearning);
    const isStudent=()=>document.body?.classList?.contains("roleStudent")||window.ECHSPortalAccess?.current?.role==="student";
    const select=()=>document.getElementById("bank");
    function enforceSelection(){
      enforceCalculusSourceInventory();
      const bank=select();
      if(!bank||!isStudent())return bank?.value||"all";
      const available=[...bank.options].filter(option=>option.value&&option.value!=="all");
      if(!available.length)return bank.value||preferredBank||"all";
      if(preferredBank&&available.some(option=>option.value===preferredBank))bank.value=preferredBank;
      else if(!available.some(option=>option.value===bank.value))bank.value=available[0].value;
      [...bank.options].filter(option=>option.value==="all").forEach(option=>option.remove());
      preferredBank=bank.value;
      document.documentElement.dataset.studentPracticeBank=bank.value;
      return bank.value;
    }
    ECHSBank.filterQuestions=(questions,filters={})=>{
      const bank=isStudent()?enforceSelection():filters.bank;
      return originalFilter(questions,{...filters,bank:bank||filters.bank||"all"});
    };
    if(originalContinue)ECHSLearning.setContinue=payload=>{
      if(!isStudent())return originalContinue(payload);
      const bankCode=enforceSelection();
      const next={...payload,bankCode};
      if(next.url&&bankCode&&bankCode!=="all"){
        try{const url=new URL(next.url,location.href);url.searchParams.set("bank",bankCode);next.url=url.href;}catch{}
      }
      return originalContinue(next);
    };
    if(originalStart)ECHSLearning.startSession=payload=>originalStart(isStudent()?{...payload,bankCode:enforceSelection()}:payload);
    function revealBankIdentity(root=document){
      if(!isStudent())return;
      const label=select()?.selectedOptions?.[0]?.textContent?.trim();
      if(!label)return;
      root.querySelectorAll?.(".questionCard .pill.teal").forEach(pill=>{
        if(/ECHS mapped practice/i.test(pill.textContent||""))pill.textContent=label;
      });
    }
    function syncSessionLock(){
      const bank=select();if(!bank||!isStudent())return;
      bank.disabled=Boolean(document.querySelector("#shell .questionCard"));
      bank.title=bank.disabled?"The bank is fixed for the current session.":"Choose one mapped bank for this session.";
    }
    const bankSelect=select();
    courseSelect()?.addEventListener("change",()=>queueMicrotask(enforceSelection));
    if(bankSelect){
      bankSelect.addEventListener("change",()=>{preferredBank=bankSelect.value;enforceSelection();document.documentElement.dataset.studentPracticeBank=bankSelect.value;});
      new MutationObserver(()=>queueMicrotask(enforceSelection)).observe(bankSelect,{childList:true,subtree:true});
    }
    const shell=document.getElementById("shell");
    if(shell)new MutationObserver(records=>{records.forEach(record=>record.addedNodes.forEach(node=>{if(node.nodeType===1)revealBankIdentity(node);}));syncSessionLock();}).observe(shell,{childList:true,subtree:true});
    window.addEventListener?.("echs:private-bank-summary",()=>queueMicrotask(enforceSelection));
    document.addEventListener?.("echs:portal-access",()=>queueMicrotask(enforceSelection));
    queueMicrotask(()=>{enforceSelection();syncSessionLock();});
    document.documentElement.dataset.practiceBankIsolation="ready";
  }
  install();
})();
