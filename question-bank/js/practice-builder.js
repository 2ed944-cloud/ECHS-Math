/* Full-width Focused Practice filter drawer controller. */
(function(){
  "use strict";
  const builder=document.getElementById("practiceBuilder");
  const toggle=document.getElementById("builderToggle");
  const toggleText=toggle?.querySelector(".builderToggleText");
  const controls=document.getElementById("builderControls");
  const compact=document.getElementById("builderCompactSummary");
  const compactTitle=document.getElementById("builderCompactTitle");
  const compactMeta=document.getElementById("builderCompactMeta");
  const adjust=document.getElementById("builderAdjust");
  const shell=document.getElementById("shell");
  const mode=document.getElementById("mode");
  const course=document.getElementById("course");
  const bank=document.getElementById("bank");
  const scope=document.getElementById("scope");
  const bundle=document.getElementById("bundle");
  const type=document.getElementById("type");
  const count=document.getElementById("count");
  if(!builder||!toggle||!controls||!compact||!shell)return;

  const modeLabels={manual:"Focused practice",adaptive:"Adaptive practice",review:"Spaced review",mistakes:"Mistake recovery"};
  const selectedText=node=>node?.options?.[node.selectedIndex]?.textContent?.trim()||"";
  const isCollapsed=()=>builder.classList.contains("isCollapsed");
  const backdrop=document.createElement("button");
  backdrop.type="button";
  backdrop.className="builderBackdrop";
  backdrop.setAttribute("aria-label","Close practice filters");
  document.body.append(backdrop);
  let returnFocus=null;

  function hasQuestion(){return Boolean(document.querySelector("#shell .questionCard"));}
  function updateSummary(){
    const question=document.querySelector("#shell .questionCard");
    const pills=question?[...question.querySelectorAll(".pill")].map(node=>node.textContent.trim()):[];
    const questionLabel=pills.find(value=>/^Question\s+/i.test(value));
    const skillLabel=pills.find(value=>/^Skill\s+/i.test(value));
    const typeLabel=pills.find(value=>/Multiple choice|True \/ False|Fill in the blank|Open response/i.test(value));
    compactTitle.textContent=modeLabels[mode?.value]||selectedText(mode)||"Focused practice";
    compactMeta.textContent=(question
      ?[questionLabel,skillLabel,typeLabel]
      :[selectedText(course),selectedText(bank),selectedText(scope),selectedText(bundle),count?.value?`${count.value} questions`:"",selectedText(type)]
    ).filter(Boolean).join(" · ")||"Choose a course, bank and exact target";
    if(adjust)adjust.textContent=question?"Adjust filters":"Choose filters";
  }

  function focusableNodes(){
    return [...builder.querySelectorAll('button:not([disabled]),select:not([disabled]),input:not([disabled]),textarea:not([disabled]),[href],[tabindex]:not([tabindex="-1"])')].filter(node=>!node.hidden&&node.getClientRects().length);
  }

  function setCollapsed(value,{focus=false}={}){
    const collapsed=Boolean(value),opening=!collapsed;
    if(opening&&isCollapsed())returnFocus=document.activeElement;
    builder.classList.toggle("isCollapsed",collapsed);
    document.body.classList.toggle("practiceFiltersOpen",opening);
    toggle.setAttribute("aria-expanded",String(opening));
    controls.hidden=collapsed;
    compact.hidden=opening;
    compact.setAttribute("aria-hidden",String(opening));
    if(opening){
      builder.setAttribute("role","dialog");
      builder.setAttribute("aria-modal","true");
      builder.setAttribute("aria-label","Practice filters");
    }else{
      builder.removeAttribute("role");
      builder.removeAttribute("aria-modal");
      builder.removeAttribute("aria-label");
    }
    if(toggleText)toggleText.textContent="Close";
    const icon=toggle.querySelector(".builderToggleIcon");
    if(icon)icon.textContent=opening?"×":"↗";
    updateSummary();
    if(focus){
      if(opening)(course||toggle).focus({preventScroll:true});
      else if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});
      else adjust?.focus({preventScroll:true});
    }
  }

  toggle.addEventListener("click",()=>setCollapsed(true,{focus:true}));
  adjust?.addEventListener("click",()=>setCollapsed(false,{focus:true}));
  backdrop.addEventListener("click",()=>setCollapsed(true,{focus:true}));
  [mode,course,bank,scope,bundle,type,count].filter(Boolean).forEach(node=>node.addEventListener("change",updateSummary));

  document.addEventListener("keydown",event=>{
    if(event.key==="Escape"&&!isCollapsed()){
      event.preventDefault();
      setCollapsed(true,{focus:true});
    }
  });
  builder.addEventListener("keydown",event=>{
    if(event.key!=="Tab"||isCollapsed())return;
    const nodes=focusableNodes();
    if(!nodes.length)return;
    const first=nodes[0],last=nodes[nodes.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  });

  const observer=new MutationObserver(()=>{
    updateSummary();
    if(hasQuestion()&&!isCollapsed())setCollapsed(true);
  });
  observer.observe(shell,{childList:true,subtree:true});
  setCollapsed(true);
})();
