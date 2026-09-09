/* ECHS Parent Learning Report */
(function(){
  "use strict";
  // A mixed cached release must fail closed before rendering any practice claims.
  if(!window.ECHSLearning?.projectLearningReport||!window.ECHSLearning?.projectMasteryRecord){
    const main=document.querySelector(".institutionMain")||document.querySelector("main");
    if(main){const notice=document.createElement("p");notice.setAttribute("role","status");notice.dataset.masteryStatusUnavailable="true";notice.textContent="Practice status is unavailable in this cached version. Reload the page to continue. Verified mastery is unavailable.";main.replaceChildren(notice);}
    return;
  }

  const $=id=>document.getElementById(id),esc=ECHSLearning.escapeHTML,labels=ECHSLearning.COURSE_LABELS;
  let report=null;

  function localReport(){return ECHSLearning.exportStudentReport();}
  function formatDate(value){const d=new Date(value);return Number.isNaN(d.getTime())?"—":d.toLocaleDateString([], {dateStyle:"long"});}
  function topicRows(rows,emptyText){
    return rows.length?rows.map(row=>`<div class="reviewRow"><div><strong>${esc(row.title)}</strong><p>${esc(labels[row.course]||row.course)}${row.unit?` · Unit ${esc(row.unit)}`:""} · ${ECHSLearning.evidencePercent(row)} provisional practice · ${row.attempts||0} attempts</p></div><span class="masteryBadge ${row.evidence_status==="insufficient"?"starting":"developing"}">${esc(row.level||"Developing")}</span></div>`).join(""):`<div class="emptyLearning">${esc(emptyText)}</div>`;
  }
  function planItems(){
    const weak=(report.weakTopics||[]).slice(0,3),due=report.summary?.due||0,goal=Math.max(5,Math.min(15,Math.round((report.summary?.attempts||0)/20)||10));
    const items=[
      {title:"Day 1 · Review mistakes",detail:due?`Complete ${Math.min(due,10)} due review questions.`:"Complete a short adaptive diagnostic set."},
      {title:"Day 2 · Strengthen one topic",detail:weak[0]?`Focus on ${weak[0].title} for ${goal} questions.`:"Practise the current course for 10 questions."},
      {title:"Day 3 · Lesson connection",detail:"Reopen the matching lesson, review one worked example and complete its student-turn question."},
      {title:"Day 4 · Spaced review",detail:"Return to the Review Centre and complete newly due questions."},
      {title:"Day 5 · Second priority",detail:weak[1]?`Focus on ${weak[1].title}.`:"Complete a mixed adaptive set."},
      {title:"Day 6 · Timed confidence check",detail:"Complete a short 10-question test under calm timed conditions."},
      {title:"Day 7 · Reflect and celebrate",detail:"Review progress, note one improvement and recognise an earned achievement."}
    ];
    return items.map(item=>`<div class="studyStep"><div><strong>${esc(item.title)}</strong><p>${esc(item.detail)}</p></div></div>`).join("");
  }
  function render(){
    if(!report)report=localReport();
    report=ECHSLearning.projectLearningReport(report);
    const student=report.student||{},summary=report.summary||{},mastery=report.mastery||[];
    const strengths=mastery.filter(row=>row.score>=65).sort((a,b)=>b.score-a.score).slice(0,6);
    const weak=(report.weakTopics||mastery.filter(row=>row.score<65)).slice(0,6);
    $("heroStudent").textContent=student.name||"Student";
    $("heroAccuracy").textContent=ECHSLearning.evidencePercent(summary,"accuracy");
    $("heroMastered").textContent=summary.mastered||0;
    $("heroStreak").textContent=summary.streak||0;
    $("reportTitle").textContent=`${student.name||"Student"}'s mathematics learning report`;
    $("reportSubtitle").textContent=`Generated ${formatDate(report.generatedAt)}${student.grade?` · Grade ${student.grade}`:""}${student.school?` · ${student.school}`:""}. Practice indicators are provisional; verified mastery is unavailable.`;
    $("overallScore").textContent=ECHSLearning.evidencePercent(summary,"accuracy");
    $("parentDue").textContent=summary.due||0;$("parentStreak").textContent=summary.streak||0;
    $("parentMetrics").innerHTML=`<div class="metric"><b>${summary.attempts||0}</b><span>practice attempts</span></div><div class="metric"><b>${summary.uniqueQuestions||0}</b><span>unique questions</span></div><div class="metric"><b>${summary.mastered||0}</b><span>topics mastered</span></div><div class="metric"><b>${summary.unresolved||0}</b><span>mistakes to review</span></div>`;
    $("strengthList").innerHTML=topicRows(strengths,"More practice evidence is needed before strengths can be identified.");
    $("weakList").innerHTML=topicRows(weak,"No priority weakness is currently identified.");
    $("familyPlan").innerHTML=planItems();
    const earned=(report.achievements||[]).slice().sort((a,b)=>new Date(b.earnedAt)-new Date(a.earnedAt)).slice(0,6);
    $("parentAchievements").innerHTML=earned.length?earned.map(item=>`<article class="achievement earned"><span class="achievementIcon">${esc(item.icon||"★")}</span><div><strong>${esc(item.title)}</strong><p>${esc(item.description||"Learning achievement")}</p><small>${formatDate(item.earnedAt)}</small></div></article>`).join(""):'<div class="emptyLearning">Achievements will appear as learning evidence grows.</div>';
  }
  $("useCurrent").onclick=()=>{report=localReport();render();};
  $("importReport").onchange=async event=>{try{const data=JSON.parse(await event.target.files[0].text());if(data.schema!=="echs-learning-report")throw new Error("This is not an ECHS learning report.");report=data;render();}catch(error){alert(error.message);}event.target.value="";};
  $("printReport").onclick=()=>print();
  render();
})();