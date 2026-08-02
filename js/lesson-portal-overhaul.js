/* ECHS Lesson Portal — role-aware visual layer */
(function(){
  "use strict";
  const qs=(selector,root=document)=>root.querySelector(selector);
  const qsa=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
  const text=(selector,value)=>{const node=qs(selector);if(node)node.textContent=value;};
  const safeSummary=()=>{try{return window.ECHSLearning&&typeof ECHSLearning.summary==="function"?ECHSLearning.summary():{};}catch(_error){return{};}};
  const role=()=>document.documentElement.dataset.platformRole||document.body.dataset.platformRole||"student";

  function masteryScore(card){
    const values=qsa(".pathStage small",card).map(node=>String(node.textContent||"").match(/(\d+)%/)).filter(Boolean);
    return values.length?Number(values[0][1]):0;
  }
  function routeFrom(score,completed){
    if(score>=80)return{name:"Challenge",reason:"Mastery evidence is strong. Use a short challenge set to deepen transfer and reasoning.",index:2};
    if(score>0&&score<50)return{name:"Support",reason:"Recent evidence suggests a supported route with prerequisite review and shorter practice.",index:0};
    if(completed)return{name:"Core",reason:"The lesson is complete. Continue with focused practice and spaced review before mastery.",index:1};
    return{name:"Core",reason:"Continue the assigned lesson and build varied evidence before mastery is awarded.",index:1};
  }
  function enhanceLesson(card){
    if(card.dataset.portalEnhanced==="1")return;
    card.dataset.portalEnhanced="1";
    const completed=card.dataset.completed==="true";
    const ready=card.dataset.ready==="true";
    const score=masteryScore(card);
    const mastered=score>=80;
    const row=document.createElement("div");
    row.className="lessonStateRow";
    const state=document.createElement("span");
    state.className="lessonState "+(mastered?"mastered":completed?"complete":ready?"ready":"");
    state.textContent=mastered?"Mastered":completed?"Lesson complete":score>0?"In progress":ready?"Ready to learn":"Coming soon";
    const evidence=document.createElement("span");
    evidence.className="lessonEvidence";
    evidence.textContent=score?score+"% mastery":completed?"Practice unlocked":"No evidence yet";
    row.append(state,evidence);
    const summary=qs(".lessonSummary",card);
    (summary||qs(".learningPathRail",card)||qs(".objectiveBlock",card))?.before(row);
    qs(".learningPathRail",card)?.classList.add("compactRail");
    const blocks=qsa(":scope > .objectiveBlock, :scope > .resourceBlock",card);
    if(blocks.length){
      const details=document.createElement("details");
      details.className="lessonDetails";
      const trigger=document.createElement("summary");
      trigger.textContent="Objectives and resources";
      details.append(trigger);
      blocks[0].before(details);
      blocks.forEach(block=>details.append(block));
    }
    const lessonLink=qs(".linkBtn:not(.flow)",card);
    if(lessonLink)lessonLink.setAttribute("aria-label","Open "+(qs("h4",card)?.textContent||"lesson"));
  }
  function enhanceUnit(unit){
    const cards=qsa(".lesson",unit);
    if(!cards.length)return;
    cards.forEach(enhanceLesson);
    const completed=cards.filter(card=>card.dataset.completed==="true").length;
    const mastered=cards.filter(card=>masteryScore(card)>=80).length;
    const metric=qs(".unitMetrics",unit);
    if(metric){
      metric.innerHTML="<b>"+completed+"/"+cards.length+"</b><small>complete · "+mastered+" mastered</small><span class=\"unitMiniTrack\"><i style=\"width:"+(cards.length?Math.round(completed/cards.length*100):0)+"%\"></i></span>";
    }
  }
  function renderCommand(){
    const command=qs("#lessonCommand");
    if(!command)return;
    const course=qs("#courseHero h2")?.textContent?.trim()||qs(".tab.active")?.textContent?.trim()||"Assigned course";
    const cards=qsa("#units .lesson");
    const next=cards.find(card=>card.dataset.ready==="true"&&card.dataset.completed!=="true")||cards.find(card=>card.dataset.ready==="true")||cards[0];
    const summary=safeSummary();
    const due=Number(summary.due||0);
    text("#commandCourse",course);
    text("#commandReviewCount",String(due));
    const review=qs("#commandReview");
    if(review)review.setAttribute("aria-label",due?due+" review items due":"Open review queue");
    if(!next){
      text("#lessonCommandTitle","Your course roadmap is ready");
      text("#lessonCommandText","Choose a unit below to review its lessons, objectives and available learning resources.");
      text("#commandUnit","Choose a unit");
      text("#commandEvidence",summary.mastered?summary.mastered+" mastered skills":"Building");
      return;
    }
    const title=qs("h4",next)?.textContent?.trim()||"Next lesson";
    const unit=next.closest(".unit");
    const unitTitle=qs(".unitHeading strong",unit)?.textContent?.trim()||"Current unit";
    const score=masteryScore(next);
    const completed=next.dataset.completed==="true";
    const recommendation=routeFrom(score,completed);
    const teacher=/teacher|admin/.test(role());
    text("#lessonCommandTitle",teacher?"Plan or preview: "+title:"Continue: "+title);
    text("#lessonCommandText",teacher?"Open the lesson for planning, preview it as a learner, or connect it to targeted practice.":"This is the clearest next step in your assigned course. Complete the lesson before focused practice is unlocked.");
    text("#commandUnit",unitTitle);
    text("#commandEvidence",score?score+"% mastery":completed?"Lesson complete":"Starting");
    text("#commandRoute",teacher?"Complete access":recommendation.name);
    text("#commandRouteReason",teacher?"Your role can preview every lesson and connect it to assignments, practice and class evidence.":recommendation.reason);
    qsa(".routeScale i",command).forEach((node,index)=>node.classList.toggle("active",teacher?index===1:index===recommendation.index));
    const primary=qs("#commandPrimary");
    const lessonLink=qs(".linkBtn:not(.flow)",next);
    const practiceLink=qs(".lessonPracticeBtn:not(.locked)",next);
    const target=lessonLink||practiceLink;
    if(primary&&target){
      primary.href=target.href;
      primary.innerHTML=(teacher?"Open lesson preview":"Continue lesson")+" <span aria-hidden=\"true\">→</span>";
    }
  }
  function update(){
    qsa("#units .unit").forEach(enhanceUnit);
    renderCommand();
  }
  function start(){
    const units=qs("#units");
    if(units){
      new MutationObserver(()=>requestAnimationFrame(update)).observe(units,{childList:true,subtree:true});
    }
    const tabs=qs("#tabs");
    if(tabs)new MutationObserver(()=>requestAnimationFrame(renderCommand)).observe(tabs,{childList:true,subtree:true,attributes:true});
    update();
    setTimeout(update,250);
    setTimeout(update,900);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
