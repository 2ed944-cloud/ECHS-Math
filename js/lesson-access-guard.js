/* Browser-level lesson access and lesson-to-practice bridge. */
(async()=>{
  "use strict";
  const STORE="echs_math_complete";
  const esc=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  function completed(key){try{return JSON.parse(localStorage.getItem(STORE)||"[]").includes(String(key));}catch{return false;}}
  function markCompleted(key){if(!key)return;let rows=[];try{rows=JSON.parse(localStorage.getItem(STORE)||"[]");if(!Array.isArray(rows))rows=[];}catch{}if(!rows.includes(String(key)))rows.push(String(key));localStorage.setItem(STORE,JSON.stringify(rows));window.dispatchEvent(new CustomEvent("echs:lesson-completed",{detail:{key}}));}
  try{
    const access=await window.ECHSPortalAccess?.ready;
    if(!access)return;
    if(!access.authenticated){const next=encodeURIComponent(location.href);location.replace(ECHSInstitution.root(`login.html?next=${next}`));return;}
    if(access.role==="parent"){location.replace(ECHSInstitution.root("question-bank/parent.html"));return;}
    const params=new URLSearchParams(location.search),course=params.get("course")||document.querySelector('meta[name="echs-course"]')?.content||"",lessonKey=params.get("lessonKey")||"",unit=params.get("unit")||"",topic=params.get("topic")||"",title=params.get("title")||document.title||"Lesson";
    if(access.role==="student"&&!ECHSPortalAccess.courseAllowed(course,access)){location.replace(ECHSInstitution.root("question-bank/student.html?notice=course-not-assigned"));return;}
    const practiceParams=new URLSearchParams({course,unit,topic,from:lessonKey,title,mode:"adaptive",autostart:"1"});
    const practiceHref=ECHSInstitution.root(`question-bank/practice.html?${practiceParams}`),pathHref=ECHSInstitution.root("index.html#courses"),dashboardHref=ECHSPortalAccess.roleHome(access.current),isComplete=completed(lessonKey);
    document.documentElement.dataset.lessonGate="allowed";
    const bar=document.createElement("div");bar.className="echsLessonAccessBar";bar.dataset.echsLessonAccess="1";
    bar.innerHTML=`<a class="lessonBack" href="${esc(pathHref)}">← Learning pathway</a><span class="lessonAccessTitle">${esc(title)} · ${access.role==="student"?"Assigned course":"Full course access"}</span><div class="lessonAccessActions">${lessonKey?`<button type="button" data-finish-lesson>${isComplete?"Open focused practice":"Finish lesson & unlock practice"}</button>`:""}<a href="${esc(dashboardHref)}">Dashboard</a></div>`;
    document.body.prepend(bar);
    const finish=bar.querySelector("[data-finish-lesson]");if(finish)finish.addEventListener("click",()=>{if(!completed(lessonKey))markCompleted(lessonKey);location.href=practiceHref;});
  }catch(error){
    console.error("Lesson access check failed",error);
    const next=encodeURIComponent(location.href);location.replace(ECHSInstitution.root(`login.html?next=${next}`));
  }
})();
