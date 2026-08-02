/* Browser-level lesson access and lesson-to-practice bridge. */
(async()=>{
  "use strict";
  const STORE="echs_math_complete";
  const esc=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  function loadLessonTutor(){
    if(window.__ECHS_LESSON_TUTOR_LOADER__)return;
    window.__ECHS_LESSON_TUTOR_LOADER__=true;
    const current=document.currentScript||[...document.scripts].find(node=>/lesson-access-guard\.js/.test(node.src));
    const root=current?new URL("../",current.src):new URL("/ECHS-Math/",location.origin);
    const node=document.createElement("script");
    node.src=new URL("js/lesson-ai-loader.js?v=20260802-tutorpro3",root).href;
    node.defer=true;
    document.head.append(node);
  }
  function completed(key){try{return JSON.parse(localStorage.getItem(STORE)||"[]").includes(String(key));}catch{return false;}}
  function markCompleted(key){
    if(!key)return;
    let rows=[];
    try{rows=JSON.parse(localStorage.getItem(STORE)||"[]");if(!Array.isArray(rows))rows=[];}catch{}
    if(!rows.includes(String(key)))rows.push(String(key));
    localStorage.setItem(STORE,JSON.stringify(rows));
    window.dispatchEvent(new CustomEvent("echs:lesson-completed",{detail:{key}}));
  }
  function bindFinish(button,lessonKey,practiceHref){
    if(!button)return;
    button.addEventListener("click",()=>{
      if(!completed(lessonKey))markCompleted(lessonKey);
      location.href=practiceHref;
    });
  }
  function installIntegratedAccess({pathHref,dashboardHref,practiceHref,lessonKey,isComplete}){
    const nativeActions=document.querySelector(".topbar .header-actions");
    if(!nativeActions||!document.querySelector(".routebar"))return false;
    if(nativeActions.querySelector('[data-echs-lesson-access="integrated"]'))return true;
    document.body.classList.add("echsLessonNativeAccess");
    document.documentElement.dataset.lessonAccessLayout="integrated";
    const group=document.createElement("div");
    group.className="echsLessonInlineAccess";
    group.dataset.echsLessonAccess="integrated";
    group.innerHTML=`<a class="echsInlinePath" href="${esc(pathHref)}" title="Return to learning pathway" aria-label="Return to learning pathway"><span aria-hidden="true">←</span><span class="echsInlineText">Pathway</span></a>${lessonKey?`<button class="echsInlinePrimary" type="button" data-finish-lesson title="${isComplete?"Open focused practice":"Finish lesson & unlock practice"}" aria-label="${isComplete?"Open focused practice":"Finish lesson & unlock practice"}"><span aria-hidden="true">${isComplete?"✦":"✓"}</span><span class="echsInlineText">${isComplete?"Open practice":"Finish & practice"}</span></button>`:""}<a class="echsInlineDashboard" href="${esc(dashboardHref)}" title="Open dashboard" aria-label="Open dashboard"><span aria-hidden="true">⌂</span><span class="echsInlineText">Dashboard</span></a>`;
    nativeActions.prepend(group);
    bindFinish(group.querySelector("[data-finish-lesson]"),lessonKey,practiceHref);
    return true;
  }
  function installFallbackBar({pathHref,dashboardHref,practiceHref,lessonKey,title,isComplete,role}){
    if(document.querySelector('[data-echs-lesson-access="bar"]'))return;
    document.body.classList.add("hasEchsLessonAccessBar");
    document.documentElement.dataset.lessonAccessLayout="bar";
    const bar=document.createElement("div");
    bar.className="echsLessonAccessBar";
    bar.dataset.echsLessonAccess="bar";
    bar.innerHTML=`<a class="lessonBack" href="${esc(pathHref)}">← Learning pathway</a><span class="lessonAccessTitle">${esc(title)} · ${role==="student"?"Assigned course":"Full course access"}</span><div class="lessonAccessActions">${lessonKey?`<button type="button" data-finish-lesson>${isComplete?"Open focused practice":"Finish lesson & unlock practice"}</button>`:""}<a href="${esc(dashboardHref)}">Dashboard</a></div>`;
    document.body.prepend(bar);
    const syncHeight=()=>document.documentElement.style.setProperty("--echs-access-bar-height",`${Math.ceil(bar.getBoundingClientRect().height)}px`);
    syncHeight();
    new ResizeObserver(syncHeight).observe(bar);
    addEventListener("resize",syncHeight,{passive:true});
    bindFinish(bar.querySelector("[data-finish-lesson]"),lessonKey,practiceHref);
  }
  try{
    const access=await window.ECHSPortalAccess?.ready;
    if(!access)return;
    if(!access.authenticated){const next=encodeURIComponent(location.href);location.replace(ECHSInstitution.root(`login.html?next=${next}`));return;}
    if(access.role==="parent"){location.replace(ECHSInstitution.root("question-bank/parent.html"));return;}
    const params=new URLSearchParams(location.search);
    const rawCourse=params.get("course")||document.querySelector('meta[name="echs-course"]')?.content||"";
    const course=ECHSPortalAccess.normaliseCourseKey?.(rawCourse)||rawCourse;
    const lessonKey=params.get("lessonKey")||"",unit=params.get("unit")||"",topic=params.get("topic")||"",title=params.get("title")||document.title||"Lesson";
    if(access.role==="student"&&!ECHSPortalAccess.courseAllowed(course,access)){location.replace(ECHSInstitution.root("question-bank/student.html?notice=course-not-assigned"));return;}
    const practiceParams=new URLSearchParams({course,unit,topic,from:lessonKey,title,mode:"adaptive",autostart:"1"});
    const practiceHref=ECHSInstitution.root(`question-bank/practice.html?${practiceParams}`),pathHref=ECHSInstitution.root("index.html#courses"),dashboardHref=ECHSPortalAccess.roleHome(access.current),isComplete=completed(lessonKey);
    document.documentElement.dataset.lessonGate="allowed";
    document.documentElement.dataset.echsLessonCourse=course||"unassigned";
    document.documentElement.dataset.echsLessonTitle=title;
    loadLessonTutor();
    const context={course,pathHref,dashboardHref,practiceHref,lessonKey,title,isComplete,role:access.role};
    if(course==="ib-math-ai"&&installIntegratedAccess(context))return;
    installFallbackBar(context);
  }catch(error){
    console.error("Lesson access check failed",error);
    const next=encodeURIComponent(location.href);location.replace(ECHSInstitution.root(`login.html?next=${next}`));
  }
})();
