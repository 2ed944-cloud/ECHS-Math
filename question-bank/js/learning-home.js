/* ECHS Learning Center home */
(function(){
  "use strict";
  const $=id=>document.getElementById(id),esc=ECHSLearning.escapeHTML;
  const profile=ECHSLearning.profile(),summary=ECHSLearning.summary(),plan=ECHSLearning.dailyPlan();
  $("homeWelcome").textContent=`${profile.name||"Student"}, your learning plan is ready`;
  $("homeGoalBar").style.width=`${plan.progress}%`;
  $("homeGoalText").textContent=`${plan.todayAttempts} of ${plan.goal} questions completed today.`;
  $("homeStreak").textContent=summary.streak;$("homeMastered").textContent=summary.mastered;$("homeDue").textContent=summary.due;$("homeMistakes").textContent=summary.unresolved;
  $("homePlan").innerHTML=plan.items.slice(0,4).map((item,index)=>`<div class="planItem"><span class="planIcon">${index+1}</span><div><strong>${esc(item.title)}</strong><p>${esc(item.detail)}</p></div><a class="button ghost" href="${esc(item.href)}">Open</a></div>`).join("");
})();