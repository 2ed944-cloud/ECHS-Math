(async()=>{
const $=id=>document.getElementById(id),esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const current=await ECHSInstitution.requireAuth(["parent","admin","teacher"]);if(!current)return;ECHSInstitution.mountIdentity(current);
const children=(await ECHSInstitution.api("institution-api","/children")).students||[];
$("childSelector").innerHTML=children.length?children.map(row=>`<option value="${row.id}">${esc(row.display_name)}${row.grade?` · Grade ${esc(row.grade)}`:""}</option>`).join(""):`<option value="">No linked student</option>`;
function meter(id,value){const node=$(id),n=Math.max(0,Math.min(100,Math.round(value||0)));node.style.setProperty("--value",n);node.querySelector("strong").textContent=`${n}%`}
function skills(rows,empty){return rows?.length?rows.map(row=>`<div class="skillRow"><div><strong>${esc(row.title||row.topic||row.skill_key)}</strong><small>${esc([row.course,row.unit?`Unit ${row.unit}`:"",row.level].filter(Boolean).join(" · "))}</small><div class="progressBarI" style="margin-top:8px"><i style="width:${Number(row.score||0)}%"></i></div></div><span class="skillScore">${Math.round(Number(row.score||0))}%</span></div>`).join(""):`<div class="emptyInstitution">${empty}</div>`}
function plan(data){const p=data.priorities||[],c=data.counters||{},first=p[0]?.title||"the current lesson";return[
{day:"Day 1",title:"Review together",detail:`Spend 15 minutes reviewing ${first}. Ask the learner to explain one example aloud.`},
{day:"Day 2",title:"Adaptive practice",detail:"Complete a short adaptive set. Focus on careful work rather than speed."},
{day:"Day 3",title:"Mistake recovery",detail:`Resolve ${Math.min(c.open_mistakes||0,5)} mistake-bank item${(c.open_mistakes||0)===1?"":"s"} and discuss what changed.`},
{day:"Day 4",title:"Rest and recall",detail:"Use a five-minute verbal recall: key formulas, vocabulary and one common misconception."},
{day:"Day 5",title:"Assignment check",detail:"Review due assignments and confirm that unfinished work has a clear plan."},
{day:"Day 6",title:"Challenge practice",detail:"Complete one slightly harder set in a strong topic to build confidence and transfer."},
{day:"Day 7",title:"Celebrate progress",detail:`Review the week’s mastery, accuracy and streak. Celebrate effort and one specific improvement.`}
]}
function render(data){const c=data.counters||{},student=data.student||{};$("familyHero").innerHTML=`${esc(student.display_name||"Student")}’s progress.<span>Support that makes a difference.</span>`;$("familyMessage").textContent=`${student.grade?`Grade ${student.grade} · `:""}${c.attempts||0} synchronized responses · ${c.mastered_topics||0} mastered topics`;
$("familyMastery").textContent=`${c.mastery||0}%`;$("familyAccuracy").textContent=`${c.accuracy||0}%`;$("familyStreak").textContent=c.streak||0;$("familyDue").textContent=c.review_due||0;
meter("parentMasteryMeter",c.mastery);meter("parentAccuracyMeter",c.accuracy);meter("parentTopicMeter",c.total_topics?c.mastered_topics/c.total_topics*100:0);meter("parentEngagementMeter",(c.weekly_minutes||0)/120*100);
$("parentMastered").textContent=c.mastered_topics||0;$("parentTopics").textContent=c.total_topics||0;$("parentMinutes").textContent=c.weekly_minutes||0;$("parentAttempts").textContent=c.attempts||0;$("parentMistakes").textContent=c.open_mistakes||0;$("parentReviews").textContent=c.review_due||0;$("parentToday").textContent=c.questions_today||0;
$("familyStrengths").innerHTML=skills(data.strengths,"Strengths appear after practice evidence is collected.");$("familyPriorities").innerHTML=skills(data.priorities,"No priority areas are currently identified.");
const assignments=data.assignments||[];$("familyAssignments").innerHTML=assignments.length?assignments.map(row=>`<div class="assignmentRow"><div><strong>${esc(row.title)}</strong><small>${esc(row.activity_type.toUpperCase())}${row.due_at?` · Due ${new Date(row.due_at).toLocaleDateString()}`:""}</small></div><span class="statusPill ${esc(row.result?.status||"not_started")}">${esc((row.result?.status||"not_started").replace("_"," "))}</span></div>`).join(""):`<div class="emptyInstitution">No current assignments.</div>`;
$("familyPlan").innerHTML=plan(data).map(item=>`<article class="iCard"><div class="iCardHeader"><div><small>${item.day}</small><h3>${esc(item.title)}</h3></div></div><p>${esc(item.detail)}</p></article>`).join("")}
async function load(){const id=$("childSelector").value;if(!id){document.querySelector(".institutionMain").insertAdjacentHTML("afterbegin",'<div class="iNotice warning">No student has been linked to this family account yet. Ask an administrator to create the parent–student link.</div>');return}render(await ECHSInstitution.api("institution-api",`/dashboard/student?student_id=${encodeURIComponent(id)}`))}
$("childSelector").onchange=load;$("printReport").onclick=()=>print();await load()
})().catch(error=>{console.error(error);alert(error.message)})
