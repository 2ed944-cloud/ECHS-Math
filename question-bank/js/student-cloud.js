(async()=>{
  const $=id=>document.getElementById(id),esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const current=await ECHSInstitution.requireAuth(["student","teacher","admin","parent"]);if(!current)return;ECHSInstitution.mountIdentity(current);
  $("welcomeTitle").textContent=`Welcome, ${current.display_name.split(/\s+/)[0]}`;
  const dailyGoal=Number(localStorage.getItem("echs_student_daily_goal")||10),weeklyGoal=Number(localStorage.getItem("echs_student_weekly_minutes")||120);
  $("dailyGoal").textContent=dailyGoal;$("weeklyGoal").textContent=weeklyGoal;
  function meter(id,value,label){const node=$(id),safe=Math.max(0,Math.min(100,Math.round(value||0)));node.style.setProperty("--value",safe);node.querySelector("strong").textContent=label??`${safe}%`}
  function skillRows(rows,empty){
    if(!rows?.length)return`<div class="emptyInstitution">${empty}</div>`;
    return rows.map(row=>`<div class="skillRow"><div><strong>${esc(row.title||row.topic||row.skill_key)}</strong><small>${esc([row.course,row.unit?`Unit ${row.unit}`:"",row.level].filter(Boolean).join(" · "))}</small><div class="progressBarI" style="margin-top:8px"><i style="width:${Math.max(0,Math.min(100,Number(row.score||0)))}%"></i></div></div><span class="skillScore">${Math.round(Number(row.score||0))}%</span></div>`).join("");
  }
  function assignmentHref(row){
    const c=row.configuration||{},params=new URLSearchParams({assignment:row.id});
    if(c.course)params.set("course",c.course);if(c.unit)params.set("unit",c.unit);if(c.count)params.set("count",c.count);
    if(row.activity_type==="exam")return`exam.html?${params}&minutes=${encodeURIComponent(c.minutes||20)}`;
    if(row.activity_type==="lesson")return c.url||"../index.html#courses";
    params.set("mode",row.activity_type==="review"?"review":row.activity_type==="adaptive"?"adaptive":"manual");
    return`practice.html?${params}`;
  }
  function render(data){
    const c=data.counters||{},mastery=data.mastery||[];
    $("heroMastery").textContent=`${c.mastery||0}%`;$("heroToday").textContent=c.questions_today||0;$("heroStreak").textContent=c.streak||0;$("heroDue").textContent=c.review_due||0;
    $("heroGreeting").innerHTML=`Hello, ${esc(current.display_name.split(/\s+/)[0])}.<span>${c.review_due?`${c.review_due} reviews are ready today.`:"Your next skill is ready."}</span>`;
    meter("masteryMeter",c.mastery);meter("topicsMeter",c.total_topics?c.mastered_topics/c.total_topics*100:0);
    meter("goalMeter",c.questions_today/dailyGoal*100);meter("timeMeter",c.weekly_minutes/weeklyGoal*100);
    $("masteredCount").textContent=c.mastered_topics||0;$("totalTopicCount").textContent=c.total_topics||0;$("todayCount").textContent=c.questions_today||0;$("weeklyMinutes").textContent=c.weekly_minutes||0;
    $("accuracyMetric").textContent=`${c.accuracy||0}%`;$("dueMetric").textContent=c.review_due||0;$("mistakeMetric").textContent=c.open_mistakes||0;$("streakMetric").textContent=c.streak||0;
    $("priorityList").innerHTML=skillRows(data.priorities||[],"Complete practice to generate recommendations.");
    $("strengthList").innerHTML=skillRows(data.strengths||[],"Your strongest areas will appear here.");
    $("masteryList").innerHTML=skillRows(mastery,"Start adaptive practice to build your mastery map.");
    const assignments=data.assignments||[];
    $("assignmentList").innerHTML=assignments.length?assignments.map(row=>{const status=row.result?.status||"not_started",due=row.due_at?new Date(row.due_at):null,overdue=due&&due<new Date()&&status!=="submitted";return`<div class="assignmentRow"><div><strong>${esc(row.title)}</strong><small>${esc(row.activity_type.toUpperCase())}${due?` · Due ${due.toLocaleDateString()}`:""}${row.description?` · ${esc(row.description)}`:""}</small></div><div style="display:flex;align-items:center;gap:8px"><span class="statusPill ${overdue?"overdue":status}">${overdue?"overdue":status.replace("_"," ")}</span><a class="iButton small" href="${esc(assignmentHref(row))}">${status==="submitted"?"Review":"Open"}</a></div></div>`}).join(""):`<div class="emptyInstitution"><h3>No assignments yet</h3><p>Continue with adaptive practice or your lesson pathway.</p></div>`;
    const sessions=data.recent_sessions||[];
    $("recentSessions").innerHTML=sessions.length?sessions.map(row=>`<div class="activityRow"><div><strong>${esc((row.mode||"Learning")+" session")}</strong><small>${new Date(row.started_at).toLocaleString()} · ${esc([row.course,row.unit?`Unit ${row.unit}`:""].filter(Boolean).join(" · "))}</small></div><strong>${row.total?`${row.correct}/${row.total}`:"In progress"}</strong></div>`).join(""):`<div class="emptyInstitution">No cloud sessions yet.</div>`;
  }
  async function load(){
    $("syncStatus").textContent="Syncing…";
    try{await ECHSInstitution.syncLearning();const requested=new URLSearchParams(location.search).get("student_id");const data=await ECHSInstitution.api("institution-api",`/dashboard/student${requested?`?student_id=${encodeURIComponent(requested)}`:""}`);render(data);$("syncStatus").textContent="Cloud connected";$("syncStatus").className="statusPill active";}
    catch(error){$("syncStatus").textContent="Sync unavailable";$("syncStatus").className="statusPill suspended";throw error}
  }
  $("syncNow").addEventListener("click",()=>load().catch(error=>alert(error.message)));
  await load();
})().catch(error=>{console.error(error);document.body.insertAdjacentHTML("beforeend",`<div class="iNotice danger" style="position:fixed;right:20px;bottom:20px;z-index:300">${error.message}</div>`)})
