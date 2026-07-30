/* Keep each student practice session inside one explicitly selected bank. */
(function(){
  "use strict";
  function install(){
    if(!window.ECHSBank)return setTimeout(install,40);
    if(document.documentElement.dataset.practiceBankIsolation==="ready")return;
    const originalFilter=ECHSBank.filterQuestions.bind(ECHSBank);
    const isStudent=()=>document.body?.classList?.contains("roleStudent")||window.ECHSPortalAccess?.current?.role==="student";
    const select=()=>document.getElementById("bank");
    function enforceSelection(){
      const bank=select();
      if(!bank||!isStudent())return bank?.value||"all";
      const available=[...bank.options].filter(option=>option.value&&option.value!=="all");
      if(!available.length)return bank.value||"all";
      if(!available.some(option=>option.value===bank.value))bank.value=available[0].value;
      [...bank.options].filter(option=>option.value==="all").forEach(option=>option.remove());
      document.documentElement.dataset.studentPracticeBank=bank.value;
      return bank.value;
    }
    ECHSBank.filterQuestions=(questions,filters={})=>{
      const bank=isStudent()?enforceSelection():filters.bank;
      return originalFilter(questions,{...filters,bank:bank||filters.bank||"all"});
    };
    function revealBankIdentity(root=document){
      if(!isStudent())return;
      const label=select()?.selectedOptions?.[0]?.textContent?.trim();
      if(!label)return;
      root.querySelectorAll?.(".questionCard .pill.teal").forEach(pill=>{
        if(/ECHS mapped practice/i.test(pill.textContent||""))pill.textContent=label;
      });
    }
    const bankSelect=select();
    if(bankSelect){
      bankSelect.addEventListener("change",()=>{enforceSelection();document.documentElement.dataset.studentPracticeBank=bankSelect.value;});
      new MutationObserver(()=>queueMicrotask(enforceSelection)).observe(bankSelect,{childList:true,subtree:true});
    }
    const shell=document.getElementById("shell");
    if(shell)new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>{if(node.nodeType===1)revealBankIdentity(node);}))).observe(shell,{childList:true,subtree:true});
    window.addEventListener?.("echs:private-bank-summary",()=>queueMicrotask(enforceSelection));
    document.addEventListener?.("echs:portal-access",()=>queueMicrotask(enforceSelection));
    queueMicrotask(enforceSelection);
    document.documentElement.dataset.practiceBankIsolation="ready";
  }
  install();
})();
