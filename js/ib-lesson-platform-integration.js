/* IB Mathematics lesson-to-platform bridge with exact lesson-scoped bank routing. */
(()=>{
  "use strict";
  const app=document.getElementById("app"),practiceTab=document.querySelector('.route-btn[data-route="practice"]');
  if(!app||!practiceTab||!window.LESSON_DATA)return;

  const data=window.LESSON_DATA,params=new URLSearchParams(location.search);
  const normaliseCourse=value=>window.ECHSPortalAccess?.normaliseCourseKey?.(value||"")||String(value||"");
  const course=normaliseCourse(params.get("course")||"ib-math-ai")||"ib-math-ai";
  if(course!=="ib-math-ai")return;
  const lesson=String(params.get("topic")||params.get("lesson")||data.lesson?.number||"").trim();
  const unit=String(params.get("unit")||data.unit?.number||"1").trim();
  const lessonKey=params.get("lessonKey")||"";
  const title=params.get("title")||`${lesson} · ${data.lesson?.title||"IB Mathematics AI"}`;
  const aliasMap={
    // Lesson 1.1 now also owns the former standalone approximation route.
    "1.1":["u1-standard-form","u1-scientific-notation","u1-approximation-error"],
    "1.2":["u1-arithmetic-sequences"],
    "1.3":["u1-geometric-sequences"],
    // Lesson 1.4 unifies the former financial-models and loans/annuities routes.
    "1.4":["u1-financial-models","u1-loans-annuities"],
    "1.5":["u1-logarithms"],
    // Technology for Equations and Systems is renumbered from 1.8 to 1.6.
    "1.6":["u1-technology-equations"]
  };

  function platformPracticeURL(){
    const url=new URL("../../../../question-bank/practice.html",location.href);
    const query=new URLSearchParams({course:"ib-math-ai",unit,topic:lesson,scope:"lesson",title,mode:"adaptive",autostart:"1"});
    if(lessonKey)query.set("from",lessonKey);
    const aliases=aliasMap[lesson]||[];
    if(aliases.length)query.set("aliases",aliases.join(","));
    url.search=query.toString();
    return url.href;
  }
  const practiceHref=platformPracticeURL();

  function decoratePracticeTab(){
    if(practiceTab.querySelector(".ibBankTabBadge"))return;
    const label=document.createElement("span");
    label.className="ibBankTabBadge";
    label.textContent="Banks";
    practiceTab.appendChild(label);
    practiceTab.setAttribute("aria-label","Practice Studio and exact lesson-linked IB question banks");
  }
  function rewriteExistingBankLinks(root=document){
    root.querySelectorAll('.bank-bridge a,.bank-bridge button,[data-bank-bridge] a,[data-bank-bridge] button').forEach(node=>{
      node.dataset.platformBankLink="1";
      if(node.tagName==="A"){
        node.href=practiceHref;node.target="_self";node.rel="";
      }else{
        node.type="button";
        if(!node.dataset.platformBankBound){
          node.dataset.platformBankBound="1";
          node.addEventListener("click",()=>{location.href=practiceHref;});
        }
      }
    });
  }
  async function scopeTotal(scope){
    if(!window.ECHSInstitution?.api)throw new Error("Institutional practice service is not available");
    const query=new URLSearchParams({course:"ib-math-ai",lesson:scope,limit:"1",offset:"0",view:"ready"});
    const result=await ECHSInstitution.api("practice-bank-api",`/questions?${query}`);
    return Number(result?.total||0);
  }
  let summaryPromise=null;
  async function bankSummary(){
    if(summaryPromise)return summaryPromise;
    summaryPromise=(async()=>{
      try{await window.ECHSPortalAccess?.ready;}catch{}
      const scopes=[lesson,...(aliasMap[lesson]||[])].filter(Boolean);
      const unique=[...new Set(scopes)];
      const settled=await Promise.allSettled(unique.map(scope=>scopeTotal(scope)));
      return{
        total:settled.reduce((sum,row)=>sum+(row.status==="fulfilled"?row.value:0),0),
        failed:settled.filter(row=>row.status==="rejected").length
      };
    })();
    return summaryPromise;
  }
  function bridgeMarkup(){
    return`<section class="platformBankBridge" data-platform-bank-bridge="1">
      <div>
        <h2>Linked IB question banks</h2>
        <p>Only questions mapped directly to Lesson ${lesson} or one of its explicitly consolidated legacy lesson keys are included. Broad Unit 1 skill pools are not copied into unrelated lessons.</p>
        <div class="platformBankMeta"><span>Lesson ${lesson}</span><span>Exact lesson mapping</span><span class="platformBankStatus" data-bank-status data-state="loading">Checking linked questions…</span></div>
        <div class="ibBankSourceNote">Original lesson questions remain below. Uploaded prompts stay in protected institutional storage and retain their bank identity.</div>
      </div>
      <div class="platformBankAction"><a class="primary-btn" data-platform-bank-link="1" href="${practiceHref}">Open lesson practice</a><small>Students unlock this after completing the lesson. Teachers and administrators retain full access.</small></div>
    </section>`;
  }
  function ensurePracticeBridge(){
    rewriteExistingBankLinks(app);
    const active=practiceTab.classList.contains("active"),page=app.querySelector(".route-page");
    if(!active||!page)return;
    let bridge=page.querySelector("[data-platform-bank-bridge]");
    if(!bridge){
      const header=page.querySelector(".route-header");
      if(!header)return;
      header.insertAdjacentHTML("afterend",bridgeMarkup());
      bridge=page.querySelector("[data-platform-bank-bridge]");
    }
    const status=bridge?.querySelector("[data-bank-status]");
    if(!status||status.dataset.loaded==="1")return;
    status.dataset.loaded="1";
    bankSummary().then(({total,failed})=>{
      if(total>0){
        status.dataset.state="ready";
        status.textContent=`${total.toLocaleString()} exact lesson questions available`;
      }else{
        status.dataset.state=failed?"error":"empty";
        status.textContent=failed?"Open Practice Studio to retry the protected connection":"No exact lesson-mapped questions are available yet";
      }
    }).catch(error=>{
      console.warn("IB bank summary unavailable",error);
      status.dataset.state="error";
      status.textContent="Open Practice Studio to load the protected banks";
    });
  }

  decoratePracticeTab();
  rewriteExistingBankLinks();
  const observer=new MutationObserver(()=>ensurePracticeBridge());
  observer.observe(app,{childList:true,subtree:true});
  practiceTab.addEventListener("click",()=>queueMicrotask(ensurePracticeBridge));
  window.addEventListener("hashchange",()=>queueMicrotask(ensurePracticeBridge));
  window.ECHSOpenIBBankPractice=()=>{location.href=practiceHref;};
  document.documentElement.dataset.ibLessonBankBridge=lesson||"unit-1";
  document.documentElement.dataset.ibLessonMappingPolicy="exact-only";
  ensurePracticeBridge();
})();
