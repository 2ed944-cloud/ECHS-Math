/* Unit 6 runtime bridge: corrects the legacy Unit 2 storage/completion constants in the shared engine. */
(()=>{
  const data=window.LESSON_DATA;
  const unit=String(data?.unit?.number??"");
  const lesson=String(data?.lesson?.number??"");
  if(unit!=="6"||!lesson)return;

  const legacyPrefix=`echs:ib-ai:u2:${lesson}:`;
  const correctPrefix=`echs:ib-ai:u6:${lesson}:`;
  const originals={
    getItem:Storage.prototype.getItem,
    setItem:Storage.prototype.setItem,
    removeItem:Storage.prototype.removeItem
  };
  const mate=(key,from,to)=>to+key.slice(from.length);

  Storage.prototype.getItem=function(key){
    const k=String(key);
    if(k.startsWith(legacyPrefix)){
      const corrected=mate(k,legacyPrefix,correctPrefix);
      const current=originals.getItem.call(this,corrected);
      return current===null?originals.getItem.call(this,k):current;
    }
    return originals.getItem.call(this,k);
  };

  Storage.prototype.setItem=function(key,value){
    const k=String(key);
    if(k.startsWith(legacyPrefix)){
      const corrected=mate(k,legacyPrefix,correctPrefix);
      originals.setItem.call(this,corrected,String(value));
      return originals.setItem.call(this,k,String(value));
    }
    return originals.setItem.call(this,k,String(value));
  };

  Storage.prototype.removeItem=function(key){
    const k=String(key);
    if(k.startsWith(legacyPrefix)){
      originals.removeItem.call(this,mate(k,legacyPrefix,correctPrefix));
      return originals.removeItem.call(this,k);
    }
    if(k.startsWith(correctPrefix)){
      originals.removeItem.call(this,mate(k,correctPrefix,legacyPrefix));
      return originals.removeItem.call(this,k);
    }
    return originals.removeItem.call(this,k);
  };

  try{
    for(let i=0;i<window.localStorage.length;i+=1){
      const key=window.localStorage.key(i);
      if(key&&key.startsWith(legacyPrefix)){
        const corrected=mate(key,legacyPrefix,correctPrefix);
        if(originals.getItem.call(window.localStorage,corrected)===null){
          originals.setItem.call(window.localStorage,corrected,originals.getItem.call(window.localStorage,key));
        }
      }
    }
  }catch(_error){/* private-mode storage may be unavailable */}

  const installCompletionRepair=()=>{
    const button=document.getElementById("mark-lesson-complete");
    if(!button||button.dataset.u6CompletionRepair==="true")return;
    button.dataset.u6CompletionRepair="true";
    button.addEventListener("click",event=>{
      event.preventDefault();
      event.stopImmediatePropagation();
      const title=String(data?.lesson?.title||`Lesson ${lesson}`);
      const key=`ib-math-ai::6::${lesson}::${title}`;
      const payload={course:"ib-math-ai",unit:6,lesson,title,completedAt:new Date().toISOString(),version:data?.version||""};
      try{window.localStorage.setItem(key,JSON.stringify(payload));}catch(_error){/* still dispatch completion */}
      const detail={course:"ib-math-ai",unit:6,lesson,title,key,payload};
      document.dispatchEvent(new CustomEvent("echs:lesson-complete",{detail,bubbles:true}));
      try{window.parent?.postMessage({type:"echs:lesson-complete",detail},"*");}catch(_error){/* standalone lesson */}
      button.disabled=true;
      button.textContent="Lesson completed ✓";
      const feedback=document.querySelector("#completion-feedback,[data-completion-feedback],.completion-feedback,#review-feedback");
      if(feedback){feedback.textContent="Completion saved for IB Mathematics AI SL Unit 6.";feedback.hidden=false;}
    },true);
  };

  const observer=new MutationObserver(installCompletionRepair);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",installCompletionRepair,{once:true});
  else installCompletionRepair();
})();
