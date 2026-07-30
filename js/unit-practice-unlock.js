/* Add lesson-completion-aware unit practice actions to the authenticated pathway. */
(function(){
  "use strict";
  if(document.body?.dataset.platformPage!=="home")return;
  const STORE="echs_math_complete";
  const esc=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]);
  const normalise=value=>window.ECHSPortalAccess?.normaliseCourseKey?.(value||"")||String(value||"");
  const completionRows=()=>{try{const rows=JSON.parse(localStorage.getItem(STORE)||"[]");return Array.isArray(rows)?rows:[];}catch{return[];}};
  const lessonKey=(course,unitIndex,lesson)=>`${course.id}::${unitIndex}::${lesson.number}::${lesson.title}`;
  const courseKey=course=>normalise(course?.id||course?.course||course?.title||"");
  const activeCourse=()=>{
    const id=document.querySelector("#tabs .tab.active")?.dataset.course||document.querySelector("#courseList .miniCourse.active")?.dataset.course||"";
    const rows=Array.isArray(window.ECHS_COURSES)?window.ECHS_COURSES:[];
    return rows.find(course=>String(course.id)===String(id))||rows.find(course=>courseKey(course)===normalise(id))||null;
  };
  const eligibleLessons=unit=>(unit?.lessons||[]).filter(lesson=>{
    const descriptor=`${lesson?.kind||""} ${lesson?.title||""}`;
    return Boolean(lesson?.url)&&!/assessment|review|exam|test/i.test(descriptor);
  });
  const practiceHref=(course,unitNumber)=>{
    const query=new URLSearchParams({course:courseKey(course),unit:String(unitNumber),scope:"unit",mode:"adaptive"});
    return `question-bank/practice.html?${query}`;
  };

  let access=null,rendering=false;
  function decorate(){
    if(rendering)return;
    const course=activeCourse();
    if(!course)return;
    rendering=true;
    const completed=new Set(completionRows());
    document.querySelectorAll("#units .unit[data-unit-index]").forEach(section=>{
      const index=Number(section.dataset.unitIndex),unit=course.units?.[index],body=section.querySelector(".unitBody");
      if(!unit||!body)return;
      const lessons=eligibleLessons(unit),done=lessons.filter(lesson=>completed.has(lessonKey(course,index,lesson))).length;
      const complete=lessons.length>0&&done===lessons.length,staff=Boolean(access?.allCourses||["teacher","admin"].includes(access?.role));
      const unlocked=staff||complete,percent=lessons.length?Math.round(done/lessons.length*100):0;
      let panel=body.querySelector(":scope > .unitPracticeUnlock");
      if(!panel){panel=document.createElement("div");panel.className="unitPracticeUnlock";body.prepend(panel);}
      const signature=[course.id,index,done,lessons.length,unlocked,staff].join("|");
      if(panel.dataset.signature===signature)return;
      panel.dataset.signature=signature;
      panel.dataset.unlocked=String(unlocked);
      panel.innerHTML=`<div class="unitPracticeProgress"><span class="unitPracticeIcon" aria-hidden="true">${unlocked?"✦":"○"}</span><div><small>${staff?"Staff unit access":"Unit practice pathway"}</small><strong>${unlocked?"Full-unit practice is available":`${done} of ${lessons.length} lessons completed`}</strong><div class="unitPracticeTrack"><i style="width:${staff?100:percent}%"></i></div><span>${staff?"Review every mapped question in this unit.":complete?"All available lessons are complete.":"Complete every available lesson to unlock the complete unit bank."}</span></div></div>${unlocked?`<a class="unitPracticeAction" href="${esc(practiceHref(course,index+1))}">${staff?"Open unit bank":"Practise the full unit"}<span aria-hidden="true">→</span></a>`:`<span class="unitPracticeAction locked" aria-disabled="true">Unit practice locked</span>`}`;
    });
    rendering=false;
  }

  const observer=new MutationObserver(()=>queueMicrotask(decorate));
  observer.observe(document.getElementById("units")||document.body,{childList:true,subtree:true});
  window.addEventListener("storage",event=>{if(event.key===STORE)decorate();});
  window.addEventListener("echs:lesson-completed",decorate);
  (async()=>{try{access=await window.ECHSPortalAccess?.ready;}catch{}decorate();})();
})();
