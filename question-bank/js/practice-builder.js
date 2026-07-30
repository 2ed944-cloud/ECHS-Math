/* Compact Focused Practice Builder controller — mapped scope edition. */
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
    ).filter(Boolean).join(" · ")||"Ready to adjust your mapped practice";
  }

  function setCollapsed(value,{focus=false}={}){
    builder.classList.toggle("isCollapsed",Boolean(value));
    toggle.setAttribute("aria-expanded",String(!value));
    controls.hidden=Boolean(value);
    compact.hidden=!value;
    compact.setAttribute("aria-hidden",String(!value));
    if(toggleText)toggleText.textContent=value?"Expand":"Minimise";
    const icon=toggle.querySelector(".builderToggleIcon");
    if(icon)icon.textContent=value?"⌄":"⌃";
    updateSummary();
    if(focus)(value?adjust:toggle)?.focus({preventScroll:true});
  }

  toggle.addEventListener("click",()=>setCollapsed(!isCollapsed(),{focus:true}));
  adjust?.addEventListener("click",()=>setCollapsed(false,{focus:true}));
  [mode,course,bank,scope,bundle,type,count].filter(Boolean).forEach(node=>node.addEventListener("change",updateSummary));

  const observer=new MutationObserver(()=>{
    const hasQuestion=Boolean(document.querySelector("#shell .questionCard"));
    updateSummary();
    if(hasQuestion&&!isCollapsed())setCollapsed(true);
  });
  observer.observe(shell,{childList:true,subtree:true});
  setCollapsed(false);
})();
