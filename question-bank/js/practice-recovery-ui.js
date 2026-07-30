/* Role-aware recovery state for mapped practice. */
(function(){
  "use strict";
  const status=()=>document.getElementById("status");
  const shell=()=>document.getElementById("shell");
  const escape=value=>window.ECHSBank?.escape?.(value)||String(value||"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]);
  let access=null,lastState="";

  function fixAuthenticatedHeader(){
    if(!access?.authenticated)return;
    document.querySelectorAll('.platformHeaderActions a[href*="login"],.platformHeaderActions button[data-action="sign-in"]').forEach(node=>node.remove());
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
      pill.className="pill transportPill";pill.textContent="Protected recovery route · student-ready rows";
      const withheld=[...row.querySelectorAll(".pill")].find(node=>/withheld rows/i.test(node.textContent||""));
      if(withheld)withheld.textContent="Staff view requested · withheld rows require strict API";
    }else if(kind==="strict-api"){
      pill.className="pill transportPill strict";pill.textContent="Strict mapped connection";
    }else return;
    row.appendChild(pill);
  }
  function recoveryCard(message){
    const root=shell();if(!root||root.querySelector(".questionCard,.connectionRecovery"))return;
    root.innerHTML=`<div class="empty"><div class="emptyState"><div class="emptyStateIcon">↻</div><h2>IB bank connection needs a retry</h2><div class="connectionRecovery"><strong>The mapped bank service did not answer.</strong><p>${escape(message||"The protected recovery route will be tried automatically for staff. Student course isolation remains enforced.")}</p><div class="connectionRecoveryActions"><button class="button wine" type="button" data-retry-practice>Retry this scope</button><a class="button ghost" href="official/admin/private-bank-center.html">Open bank diagnostics</a></div></div></div></div>`;
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
    lastState=`${state}|${transport}`;
  }
  window.addEventListener("echs:private-bank-summary",event=>{
    const detail=event.detail||{};
    queueMicrotask(()=>{
      if(detail.fallback)document.documentElement.dataset.practiceBankTransport="protected-compatibility";
      else if(detail.complete)document.documentElement.dataset.practiceBankTransport="strict-api";
      renderState();
    });
  });
  new MutationObserver(()=>{
    const next=`${document.documentElement.dataset.ibCourseBankState||""}|${document.documentElement.dataset.practiceBankTransport||""}`;
    if(next!==lastState)setTimeout(renderState,0);
  }).observe(document.documentElement,{attributes:true,attributeFilter:["data-ib-course-bank-state","data-practice-bank-transport"]});
  (async()=>{
    try{access=await window.ECHSPortalAccess?.ready;}catch{}
    fixAuthenticatedHeader();renderState();
  })();
})();