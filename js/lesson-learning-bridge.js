/* Connect portal lesson activity to the Phase 2 learning system */
(function(){
  "use strict";
  if(!window.ECHSLearning)return;
  const lessonEventsKey="echs_learning_lesson_events_v2";
  function lessonContext(target){
    const card=target.closest(".lesson"),unit=target.closest(".unit");
    if(!card)return null;
    const number=card.querySelector(".lessonNo")?.textContent?.trim()||"Lesson";
    const title=card.querySelector("h4")?.textContent?.trim()||"Mathematics lesson";
    const unitTitle=unit?.querySelector(".unitHeading strong")?.textContent?.trim()||"";
    const course=localStorage.getItem("echs_math_selected_course")||"unassigned";
    return{number,title,unitTitle,course,label:`${number} · ${title}`};
  }
  document.addEventListener("click",event=>{
    const open=event.target.closest("#units .linkBtn[href]");
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