/* Keep each student practice session inside one explicitly selected bank. */
(function(){
  "use strict";
  const KATEX_VERSION="0.16.27";
  const KATEX_BASE=`https://cdn.jsdelivr.net/npm/katex@${KATEX_VERSION}/dist`;
  let mathRuntimePromise=null;
  let mathRenderQueued=false;

  function ensureMathStyles(){
    if(!document.getElementById("echs-practice-katex-css")){
      const link=document.createElement("link");
      link.id="echs-practice-katex-css";
      link.rel="stylesheet";
      link.href=`${KATEX_BASE}/katex.min.css`;
      link.crossOrigin="anonymous";
      document.head.append(link);
    }
    if(!document.getElementById("echs-practice-katex-overrides")){
      const style=document.createElement("style");
      style.id="echs-practice-katex-overrides";
      style.textContent=`
        .questionBody .katex,
        .feedback .katex,
        .solution .katex { font-size: 1.08em; }
        .questionBody .katex-display,
        .feedback .katex-display,
        .solution .katex-display {
          max-width: 100%;
          margin: .75rem 0;
          padding: .15rem 0;
          overflow-x: auto;
          overflow-y: hidden;
        }
        .choice .katex { font-size: 1.04em; }
        .prompt .katex-html,
        .choice .katex-html,
        .solution .katex-html { white-space: nowrap; }
        @media (max-width: 640px) {
          .questionBody .katex,
          .feedback .katex,
          .solution .katex { font-size: 1em; }
        }
      `;
      document.head.append(style);
    }
  }
  function loadMathScript(id,src,ready){
    if(ready())return Promise.resolve();
    const existing=document.getElementById(id);
    if(existing){
      return new Promise((resolve,reject)=>{
        if(ready()){resolve();return;}
        existing.addEventListener("load",()=>ready()?resolve():reject(new Error(`Loaded ${src}, but the expected KaTeX API is unavailable.`)),{once:true});
        existing.addEventListener("error",()=>{existing.remove();reject(new Error(`Could not load ${src}.`));},{once:true});
      });
    }
    return new Promise((resolve,reject)=>{
      const script=document.createElement("script");
      script.id=id;
      script.src=src;
      script.async=true;
      script.crossOrigin="anonymous";
      script.addEventListener("load",()=>ready()?resolve():reject(new Error(`Loaded ${src}, but the expected KaTeX API is unavailable.`)),{once:true});
      script.addEventListener("error",()=>{script.remove();reject(new Error(`Could not load ${src}.`));},{once:true});
      document.head.append(script);
    });
  }
  function ensureMathRuntime(){
    ensureMathStyles();
    if(window.katex&&typeof window.renderMathInElement==="function"){
      document.documentElement.dataset.practiceKatex="ready";
      return Promise.resolve();
    }
    if(mathRuntimePromise)return mathRuntimePromise;
    document.documentElement.dataset.practiceKatex="loading";
    mathRuntimePromise=loadMathScript(
      "echs-practice-katex-js",
      `${KATEX_BASE}/katex.min.js`,
      ()=>Boolean(window.katex),
    ).then(()=>loadMathScript(
      "echs-practice-katex-auto-render-js",
      `${KATEX_BASE}/contrib/auto-render.min.js`,
      ()=>typeof window.renderMathInElement==="function",
    )).then(()=>{
      document.documentElement.dataset.practiceKatex="ready";
    }).catch(error=>{
      document.documentElement.dataset.practiceKatex="failed";
      mathRuntimePromise=null;
      document.getElementById("echs-practice-katex-js")?.remove();
      document.getElementById("echs-practice-katex-auto-render-js")?.remove();
      console.error("ECHS practice KaTeX runtime could not be loaded",error);
      throw error;
    });
    return mathRuntimePromise;
  }
  function renderMath(root){
    if(!root)return;
    ensureMathRuntime().then(()=>{
      if(typeof window.renderMathInElement!=="function")return;
      try{
        window.renderMathInElement(root,{
          delimiters:[
            {left:"\\[",right:"\\]",display:true},
            {left:"\\(",right:"\\)",display:false},
          ],
          ignoredTags:["script","noscript","style","textarea","pre","code","option"],
          ignoredClasses:["katex","katex-display","no-katex"],
          throwOnError:false,
          strict:"warn",
          trust:false,
          output:"htmlAndMathml",
        });
        root.querySelectorAll?.(".katex").forEach(node=>node.setAttribute("data-echs-math-rendered","true"));
      }catch(error){
        console.warn("ECHS practice KaTeX render warning",error);
      }
    }).catch(()=>{});
  }
  function scheduleMath(root){
    if(!root||mathRenderQueued)return;
    mathRenderQueued=true;
    const run=()=>{
      mathRenderQueued=false;
      renderMath(root.isConnected===false?document.getElementById("shell"):root);
    };
    if(typeof window.requestAnimationFrame==="function")window.requestAnimationFrame(run);
    else setTimeout(run,0);
  }

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
    if(shell)new MutationObserver(records=>{
      records.forEach(record=>record.addedNodes.forEach(node=>{if(node.nodeType===1)revealBankIdentity(node);}));
      syncSessionLock();
      scheduleMath(shell);
    }).observe(shell,{childList:true,subtree:true});
    window.addEventListener?.("echs:private-bank-summary",()=>queueMicrotask(()=>{enforceSelection();scheduleMath(shell);}));
    document.addEventListener?.("echs:portal-access",()=>queueMicrotask(enforceSelection));
    queueMicrotask(()=>{enforceSelection();syncSessionLock();scheduleMath(shell);});
    ensureMathRuntime().then(()=>scheduleMath(shell)).catch(()=>{});
    document.documentElement.dataset.practiceBankIsolation="ready";
  }
  install();
})();
