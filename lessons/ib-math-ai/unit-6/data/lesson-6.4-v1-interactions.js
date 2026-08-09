/* Lesson 6.4 interaction layer · release 6.4.0 */
(()=>{
  const prefix="echs:ib-ai:u6:6.4:reflection:";
  const safeGet=key=>{try{return window.localStorage.getItem(key);}catch(_error){return null;}};
  const safeSet=(key,value)=>{try{window.localStorage.setItem(key,value);}catch(_error){/* private mode */}};

  const cleanSvgMath=text=>String(text||"")
    .replace(/\\\(/g,"").replace(/\\\)/g,"")
    .replace(/\\approx/g,"≈").replace(/\\ldots/g,"…")
    .replace(/\\hat\s*y/g,"ŷ").replace(/\\quad/g," ")
    .replace(/\\le/g,"≤").replace(/\\ge/g,"≥")
    .replace(/\\sim/g,"∼").replace(/\\times/g,"×")
    .replace(/\^\{-1\}/g,"⁻¹").replace(/\^2/g,"²")
    .replace(/\\mathrm\{([^}]+)\}/g,"$1")
    .replace(/\\,/g," ").replace(/\\ /g," ");

  const enhance=()=>{
    document.querySelectorAll("svg text").forEach(node=>{
      if(node.dataset.u64Cleaned==="true")return;
      node.textContent=cleanSvgMath(node.textContent);
      node.dataset.u64Cleaned="true";
    });

    document.querySelectorAll("input[data-reflect]").forEach(input=>{
      if(input.dataset.u64Bound==="true")return;
      input.dataset.u64Bound="true";
      const key=prefix+input.dataset.reflect;
      input.checked=safeGet(key)==="1";
      input.addEventListener("change",()=>safeSet(key,input.checked?"1":"0"));
    });

    document.querySelectorAll("[data-go]").forEach(control=>{
      if(control.dataset.u64RouteBound==="true")return;
      control.dataset.u64RouteBound="true";
      control.addEventListener("click",event=>{
        const route=event.currentTarget.dataset.go;
        const target=document.querySelector(`.route-btn[data-route="${CSS.escape(route)}"]`);
        if(target){target.click();target.focus({preventScroll:true});}
      });
    });

    document.querySelectorAll(".u64-checkline,.u64-checklist").forEach(group=>{
      if(group.dataset.u64Meter==="true")return;
      group.dataset.u64Meter="true";
      const inputs=[...group.querySelectorAll("input[type=checkbox]")];
      if(!inputs.length)return;
      const meter=document.createElement("div");
      meter.className="u64-reflection-meter";
      const update=()=>{
        const complete=inputs.filter(input=>input.checked).length;
        meter.textContent=`Reflection check: ${complete}/${inputs.length}`;
        meter.dataset.complete=String(complete===inputs.length);
      };
      inputs.forEach(input=>input.addEventListener("change",update));
      group.insertAdjacentElement("afterend",meter);
      update();
    });
  };

  const observer=new MutationObserver(enhance);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener("DOMContentLoaded",enhance,{once:true});
  document.addEventListener("echs:route-rendered",enhance);
  enhance();
})();
