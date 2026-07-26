/* ECHS Student Learning Dashboard */
(function(){
  "use strict";
  const $=id=>document.getElementById(id);
  const esc=value=>ECHSLearning.escapeHTML(value);
  const labels=ECHSLearning.COURSE_LABELS;

  function formatDate(value){
    if(!value)return"—";
    const date=new Date(value);
    return Number.isNaN(date.getTime())?"—":date.toLocaleString([], {dateStyle:"medium",timeStyle:"short"});
  }
  function weekActivity(){
    const dates=new Set(ECHSLearning.streak().activeDates||[]);
    let count=0;
    for(let offset=0;offset<7;offset++)if(dates.has(ECHSLearning.dateKey(Date.now()-offset*86400000)))count++;
    return count;
  }
  function courseOptions(rows){
    const courses=[...new Set(rows.map(row=>row.course).filter(Boolean))].sort();
    const current=$("courseFilter").value||"all";
    $("courseFilter").innerHTML='<option value="all">All courses</option>'+courses.map(course=>`<option value="${esc(course)}" ${course===current?"selected":""}>${esc(labels[course]||course)}</option>`).join("");
  }
  function renderPlan(){
    const plan=ECHSLearning.dailyPlan();
    $("goalBar").style.width=`${plan.progress}%`;
    $("goalText").textContent=`${plan.todayAttempts} of ${plan.goal} questions completed today.`;
    $("goalMeta").textContent=`Daily goal ${plan.goal}`;
    $("dailyPlan").innerHTML=plan.items.map((item,index)=>`<div class="planItem"><span class="planIcon">${index+1}</span><div><strong>${esc(item.title)}</strong><p>${esc(item.detail)}</p></div><a class="button ghost" href="${esc(item.href)}">Open</a></div>`).join("");
  }
  function renderContinue(){
    const item=ECHSLearning.getContinue();
    $("continueCard").innerHTML=item
      ?`<strong>${esc(item.label||"Incomplete learning activity")}</strong><p>Last updated ${formatDate(item.updatedAt)}.</p><a class="button wine" href="${esc(item.url||"practice.html?resume=1")}">Resume</a>`
      :`<div class="emptyLearning"><strong>No interrupted activity</strong><p>Start a lesson, adaptive set or test and it will appear here.</p><a class="button ghost" href="practice.html?mode=adaptive">Start learning</a></div>`;
  }
  function renderMastery(){
    const all=ECHSLearning.masteryRows();
    courseOptions(all);
    const filter=$("courseFilter").value;
    const rows=all.filter(row=>filter==="all"||row.course===filter);
    $("masteryRows").innerHTML=rows.length?rows.map(row=>{
      const cls=row.level.toLowerCase();
      const href=`practice.html?course=${encodeURIComponent(row.course)}&unit=${encodeURIComponent(row.unit)}&mode=adaptive&autostart=1`;
      return`<tr><td><b>${esc(labels[row.course]||row.course)}</b><br><small>${esc(row.title)}${row.unit!=="all"?` · Unit ${esc(row.unit)}`:""}</small></td><td style="min-width:180px"><div class="masteryTrack"><i style="width:${row.score}%"></i></div><span class="masteryScore">${row.score}%</span></td><td>${row.accuracy}%</td><td>${row.attempts} attempt${row.attempts===1?"":"s"}</td><td><span class="masteryBadge ${cls}">${esc(row.level)}</span></td><td><a class="button ghost" href="${href}">${row.score>=80?"Challenge":"Practise"}</a></td></tr>`;
    }).join(""):`<tr><td colspan="6"><div class="emptyLearning">No mastery evidence yet. Complete a practice set to begin.</div></td></tr>`;
  }
  function renderAchievements(){
    $("achievementGrid").innerHTML=ECHSLearning.earnedAchievements().map(item=>`<article class="achievement ${item.earned?"earned":""}"><span class="achievementIcon">${esc(item.icon)}</span><div><strong>${esc(item.title)}</strong><p>${esc(item.description)}</p>${item.earned?`<small>Earned ${formatDate(item.earned.earnedAt)}</small>`:"<small>Not earned yet</small>"}</div></article>`).join("");
  }
  function renderSessions(){
    const rows=ECHSLearning.recentSessions(12);
    $("recentSessions").innerHTML=rows.length?rows.map(row=>{
      const score=row.score!=null?`${row.score}%`:row.correct!=null&&row.answered?`${row.correct}/${row.answered}`:"In progress";
      return`<div class="reviewRow"><div><strong>${esc((row.type||"practice").replace(/^\w/,c=>c.toUpperCase()))} · ${esc(row.mode||"manual")}</strong><p>${formatDate(row.startedAt)} · ${row.answered||0} answered · ${score}</p></div><span class="statusBadge ${row.status==="completed"?"good":"warning"}">${esc(row.status||"active")}</span></div>`;
    }).join(""):`<div class="emptyLearning">No learning sessions recorded yet.</div>`;
  }
  function render(){
    ECHSLearning.evaluateAchievements();
    const p=ECHSLearning.profile(),s=ECHSLearning.summary();
    $("welcomeTitle").innerHTML=`Welcome back, ${esc(p.name||"Student")}.<span>Your next step is ready.</span>`;
    $("heroMastery").textContent=s.mastered.toLocaleString();
    $("heroAccuracy").textContent=`${s.accuracy}%`;
    $("heroAttempts").textContent=s.attempts.toLocaleString();
    $("heroStreak").textContent=s.streak.toLocaleString();
    $("streakMeta").textContent=`${s.streak}-day streak`;
    $("dueMeta").textContent=`${s.due} review${s.due===1?"":"s"} due`;
    $("dueCount").textContent=s.due.toLocaleString();
    $("mistakeCount").textContent=s.unresolved.toLocaleString();
    $("weekCount").textContent=weekActivity().toLocaleString();
    renderPlan();renderContinue();renderMastery();renderAchievements();renderSessions();
  }

  $("courseFilter").addEventListener("change",renderMastery);
  $("exportReport").addEventListener("click",()=>ECHSLearning.exportReport());
  $("printReport").addEventListener("click",()=>print());

  const dialog=$("profileDialog");
  $("editProfile").addEventListener("click",()=>{
    const p=ECHSLearning.profile(),s=ECHSLearning.settings();
    $("profileName").value=p.name||"";
    $("profileGrade").value=p.grade||"";
    $("profileSchool").value=p.school||"";
    $("profileGoal").value=s.dailyGoal||p.dailyGoal||10;
    dialog.showModal();
  });
  $("saveProfile").addEventListener("click",event=>{
    event.preventDefault();
    const goal=Math.max(1,Math.min(200,Number($("profileGoal").value)||10));
    ECHSLearning.saveProfile({name:$("profileName").value.trim()||"Student",grade:$("profileGrade").value.trim(),school:$("profileSchool").value.trim(),dailyGoal:goal});
    ECHSLearning.saveSettings({dailyGoal:goal});
    dialog.close();render();
  });
  $("resetLearning").addEventListener("click",()=>{
    const confirmation=prompt('Type RESET to delete student learning history from this browser.');
    if(confirmation==="RESET"){ECHSLearning.resetLearningData({keepProfile:true,keepTeacher:true});render();}
  });

  addEventListener("storage",render);
  render();
})();