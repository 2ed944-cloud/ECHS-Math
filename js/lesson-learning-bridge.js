/* Connect portal lesson activity to the Phase 2 learning system */
(function(){
  "use strict";
  if(!window.ECHSLearning)return;
  const lessonEventsKey="echs_learning_lesson_events_v2";
  function lessonContext(target){
    const card=target.closest(".lesson"),unit=target.closest(".unit");
    const params=target.href?new URL(target.href,location.href).searchParams:new URLSearchParams();
    const number=card?.dataset.number||card?.querySelector(".lessonNo")?.textContent?.trim()||params.get("topic")||"Lesson";
    const fullTitle=params.get("title")||"";
    const title=card?.dataset.title||card?.querySelector("h4")?.textContent?.trim()||fullTitle.replace(/^.*? · /,"")||"Mathematics lesson";
    const unitTitle=card?.dataset.unitTitle||unit?.querySelector(".unitHeading strong")?.textContent?.trim()||"";
    const course=params.get("course")||card?.dataset.courseId||"unassigned";
    return{number,title,unitTitle,course,label:`${number} · ${title}`};
  }
  document.addEventListener("click",event=>{
    const open=event.target.closest("#units .linkBtn[href], .lessonDetailDialog .linkBtn[href]");
    if(open){
      const context=lessonContext(open);if(!context)return;
      ECHSLearning.setContinue({type:"lesson",label:context.label,url:open.href,course:context.course,unitTitle:context.unitTitle});
      const rows=ECHSLearning.read(lessonEventsKey,[]);rows.push({...context,type:"opened",at:new Date().toISOString()});ECHSLearning.write(lessonEventsKey,rows.slice(-3000));
    }
    const complete=event.target.closest("#units [data-action='complete']");
    if(complete){
      const context=lessonContext(complete);if(!context)return;
      const willComplete=!complete.classList.contains("done");
      setTimeout(()=>{
        const rows=ECHSLearning.read(lessonEventsKey,[]);rows.push({...context,type:willComplete?"completed":"reopened",at:new Date().toISOString()});ECHSLearning.write(lessonEventsKey,rows.slice(-3000));
        if(willComplete&&ECHSLearning.getContinue()?.label===context.label)ECHSLearning.clearContinue();
      },0);
    }
  },true);
})();
