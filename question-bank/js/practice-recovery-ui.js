/* Role-aware recovery and ready-state experience for mapped practice. */
(function(){
  "use strict";
  const status=()=>document.getElementById("status");
  const shell=()=>document.getElementById("shell");
  const escape=value=>window.ECHSBank?.escape?.(value)||String(value||"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]);
  let access=null,lastState="",lastSummary=null;

  function fixAuthenticatedHeader(){
    if(!access?.authenticated)return;
    document.querySelectorAll('.platformHeaderActions a[href*="login"],.platformHeaderActions button[data-action="sign-in"],.platformNav a[href*="login"]').forEach(node=>node.remove());
    document.querySelectorAll(".platformNav a").forEach(link=>{if(/^sign in$/i.test(link.textContent?.trim()||""))link.remove();});
    document.querySelectorAll("[data-role-home]").forEach(link=>{
      link.href=window.ECHSPortalAccess?.roleHome?.(access.current)||link.href;
      link.textContent=access.role==="admin"?"Administration":access.role==="teacher"?"Teacher dashboard":"My dashboard";
    });
  }
  function addTransportPill(kind){
    const row=status();if(!row)return;
    row.querySelectorAll("[data-practice-transport]").forEach(node=>node.remove());
    const pill=document.createElement("span");pill.dataset.practiceTransport="1";
    if(kind==="protected-compatibility"){
      pill.className="pill transportPill";pill.textContent="Protected recovery · staff mapped rows";
      const withheld=[...row.querySelectorAll(".pill")].find(node=>/withheld rows/i.test(node.textContent||""));
      if(withheld)withheld.textContent="Recovery view · strict withheld audit temporarily unavailable";
    }else if(kind==="strict-api"){
      pill.className="pill transportPill strict";pill.textContent="Strict mapped connection";
    }else return;
    row.appendChild(pill);
  }
  function currentTargetLabel(){
    return document.getElementById("bundle")?.selectedOptions?.[0]?.textContent?.replace(/\s*\([^)]*questions[^)]*\)\s*$/i,"").trim()||"Mapped practice";
  }
  function bankLabels(questions){
    const codes=[...new Set((questions||[]).map(question=>question?.bank_code).filter(Boolean))];
    return codes.map(code=>window.ECHSBank?.bankLabel?.(code,document.getElementById("course")?.value)||code);
  }
  function renderReadyDashboard(detail){
    const root=shell();
    if(!root||root.querySelector(".questionCard,.result,.connectionRecovery")||!detail?.complete||!Array.isArray(detail.questions)||!detail.questions.length)return;
    const labels=bankLabels(detail.questions),target=currentTargetLabel(),count=detail.questions.length;
    root.innerHTML=`<section class="scopeReadyPanel" aria-label="Selected practice scope is ready">
      <div class="scopeReadyLead"><span class="scopeReadyIcon" aria-hidden="true">✓</span><div><small>Mapped scope ready</small><h2>${escape(target)}</h2><p>${Number(count).toLocaleString()} questions are connected to this selection across ${labels.length.toLocaleString()} bank${labels.length===1?"":"s"}.</p></div></div>
      <div class="scopeReadyMetrics"><article><b>${Number(count).toLocaleString()}</b><span>questions ready</span></article><article><b>${labels.length.toLocaleString()}</b><span>mapped banks</span></article><article><b>${detail.blocked?Number(detail.blocked).toLocaleString():"0"}</b><span>withheld by scope checks</span></article></div>
      <div class="scopeReadyBanks"><strong>Available banks</strong><div>${labels.slice(0,8).map(label=>`<span>${escape(label)}</span>`).join("")}${labels.length>8?`<span>+${labels.length-8} more</span>`:""}</div></div>
      <div class="scopeReadyActions"><button class="button wine" type="button" data-start-ready>Start this practice</button><button class="button ghost" type="button" data-adjust-ready>Adjust choices</button></div>
    </section>`;
    root.querySelector("[data-start-ready]")?.addEventListener("click",()=>document.getElementById("start")?.click());
    root.querySelector("[data-adjust-ready]")?.addEventListener("click",()=>{
      document.getElementById("builderAdjust")?.click();
      document.getElementById("practiceBuilder")?.scrollIntoView({behavior:"smooth",block:"start"});
    });
  }
  function recoveryCard(message){
    const root=shell();if(!root||root.querySelector(".questionCard,.connectionRecovery"))return;
    root.innerHTML=`<div class="empty"><div class="emptyState"><div class="emptyStateIcon">↻</div><h2>IB bank connection needs a retry</h2><div class="connectionRecovery"><strong>The strict mapped service did not answer.</strong><p>${escape(message||"A protected staff recovery route will be tried automatically. Student access remains blocked until strict course isolation is available.")}</p><div class="connectionRecoveryActions"><button class="button wine" type="button" data-retry-practice>Retry this scope</button><a class="button ghost" href="official/admin/private-bank-center.html">Open bank diagnostics</a></div></div></div></div>`;
    root.querySelector("[data-retry-practice]")?.addEventListener("click",()=>{
      const target=document.getElementById("bundle");
      if(target)target.dispatchEvent(new Event("change",{bubbles:true}));
      else location.reload();
    });
  }
  function renderState(){
    fixAuthenticatedHeader();
    const state=document.documentElement.dataset.ibCourseBankState||"",transport=document.documentElement.dataset.practiceBankTransport||"";
    if(transport)addTransportPill(transport);
    if(state==="error"||transport==="unavailable")recoveryCard("No IB questions were returned. Retry the current course scope; administrators can also verify the protected bank service from the diagnostics page.");
    else if(lastSummary)renderReadyDashboard(lastSummary);
    lastState=`${state}|${transport}`;
  }
  window.addEventListener("echs:private-bank-summary",event=>{
    const detail=event.detail||{};lastSummary=detail;
    queueMicrotask(()=>{
      if(detail.fallback)document.documentElement.dataset.practiceBankTransport="protected-compatibility";
      else if(detail.complete)document.documentElement.dataset.practiceBankTransport="strict-api";
      renderState();renderReadyDashboard(detail);
    });
  });
  new MutationObserver(()=>{
    const next=`${document.documentElement.dataset.ibCourseBankState||""}|${document.documentElement.dataset.practiceBankTransport||""}`;
    if(next!==lastState)setTimeout(renderState,0);
    fixAuthenticatedHeader();
  }).observe(document.documentElement,{attributes:true,subtree:true,childList:true,attributeFilter:["data-ib-course-bank-state","data-practice-bank-transport"]});
  (async()=>{
    try{access=await window.ECHSPortalAccess?.ready;}catch{}
    fixAuthenticatedHeader();renderState();
  })();
})();