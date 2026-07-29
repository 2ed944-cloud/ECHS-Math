(async function(){
  "use strict";
  const app=document.getElementById("app");
  const query=new URLSearchParams(location.search);
  const requested=query.get("lesson")||query.get("topic")||document.body.dataset.lesson||"1.1";

  function message(title,detail){
    if(!app)return;
    app.innerHTML=`<section class="empty-state" style="max-width:760px;margin:48px auto;padding:30px"><b>${title}</b><p>${detail}</p><button type="button" id="retry-lesson" class="nav-btn">Retry lesson</button> <a class="nav-btn" href="../../../../index.html#courses">Return to course</a></section>`;
    document.getElementById("retry-lesson")?.addEventListener("click",()=>location.reload());
  }
  async function gunzip(base64,label){
    if(!base64||base64.length<20)throw new Error(`${label} payload is missing or incomplete`);
    if(typeof DecompressionStream!=="function")throw new Error("This browser cannot open the compressed lesson package. Use the current Chrome, Edge, Firefox, or Safari release.");
    const bytes=Uint8Array.from(atob(base64),character=>character.charCodeAt(0));
    const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    return await new Response(stream).text();
  }
  function platformContext(){
    const params=new URLSearchParams(location.search);
    const data=window.LESSON_DATA||{};
    const number=String(data.lesson?.number||params.get("topic")||params.get("lesson")||requested);
    return{
      lessonKey:params.get("lessonKey")||"",
      course:params.get("course")||"g11-ib-ai",
      unit:params.get("unit")||"1",
      topic:params.get("topic")||number,
      title:params.get("title")||`${number} · ${data.lesson?.title||"IB Mathematics AI"}`,
      lessonTitle:data.lesson?.title||"IB Mathematics AI"
    };
  }
  function completeLesson(){
    const context=platformContext();
    if(!context.lessonKey){alert("Open this lesson from the G11 IB Mathematics course card before marking it complete.");return;}
    try{
      const completeKey="echs_math_complete";
      const current=JSON.parse(localStorage.getItem(completeKey)||"[]");
      const completed=Array.isArray(current)?current:[];
      if(!completed.includes(context.lessonKey))completed.push(context.lessonKey);
      localStorage.setItem(completeKey,JSON.stringify(completed));
      const eventKey="echs_learning_lesson_events_v2";
      const existing=JSON.parse(localStorage.getItem(eventKey)||"[]");
      const events=Array.isArray(existing)?existing:[];
      events.push({number:context.topic,title:context.lessonTitle,unitTitle:"Unit 1: Number, Algebra, and Financial Models",course:context.course,label:context.title,type:"completed",source:"ib-ai-unit-release",at:new Date().toISOString()});
      localStorage.setItem(eventKey,JSON.stringify(events.slice(-3000)));
      localStorage.removeItem("echs_learning_continue_v2");
    }catch(error){console.warn("Could not persist lesson completion",error);}
    window.dispatchEvent(new CustomEvent("echs:lesson-complete",{detail:context}));
    try{window.opener?.postMessage({type:"echs:lesson-complete",...context},location.origin)}catch{}
    location.href="../../../../index.html#courses";
  }
  function installBridge(){
    window.ECHSCompleteIBLesson=completeLesson;
    const actions=document.querySelector(".header-actions");
    if(actions&&!document.getElementById("platform-complete-lesson")){
      const button=document.createElement("button");
      button.type="button";button.id="platform-complete-lesson";button.className="icon-btn";button.textContent="Complete lesson";
      button.addEventListener("click",completeLesson);actions.prepend(button);
    }
    const injectReviewButton=()=>{
      const review=document.querySelector(".route-page .unit-docs");
      if(review&&!document.getElementById("mark-platform-complete")){
        const button=document.createElement("button");button.type="button";button.id="mark-platform-complete";button.className="secondary-btn";button.textContent="Mark lesson complete and return";button.addEventListener("click",completeLesson);review.appendChild(button);
      }
    };
    new MutationObserver(injectReviewButton).observe(app||document.body,{childList:true,subtree:true});
    injectReviewButton();
  }
  try{
    const payload=window.__IB_AI_PAYLOAD||{};
    const [theme,dataA,dataB,engine]=await Promise.all([
      gunzip(payload.theme,"Theme"),gunzip(payload.dataA,"Lesson data A"),gunzip(payload.dataB,"Lesson data B"),gunzip(payload.engine,"Lesson engine")
    ]);
    const style=document.createElement("style");style.dataset.ibAiUnit="1";style.textContent=theme;document.head.appendChild(style);
    (0,eval)(dataA);(0,eval)(dataB);
    if(!window.LESSON_DATA)throw new Error(`Lesson ${requested} was not found in the uploaded unit package`);
    (0,eval)(engine);
    installBridge();
    document.body.dataset.rendered="1";
  }catch(error){
    console.error("IB Mathematics AI Unit 1 bootstrap failed",error);
    message("Lesson assets could not be loaded.",`${error instanceof Error?error.message:String(error)} Refresh the page after the current platform deployment is complete.`);
  }
})();
