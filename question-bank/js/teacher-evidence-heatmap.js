/* Recorded student-by-skill practice, projected independently of cached certification claims. */
(function(){
  "use strict";
  if(document.body?.dataset.premiumPage!=="teacher")return;
  if(!window.ECHSLearning?.projectMasteryRecord){const node=document.getElementById("classHeatmap");if(node){node.dataset.masteryStatusUnavailable="true";node.textContent="Practice status unavailable. Reload the page; verified mastery is unavailable.";}return;}
  const escape=value=>ECHSLearning.escapeHTML(value);
  const target=()=>document.getElementById("classHeatmap");
  const selector=()=>document.getElementById("classSelector");
  // Initial HTML has a loading option whose implicit value is its label.
  // Only actual institution class UUIDs may start an evidence request.
  const selectedClass=()=>{const value=selector()?.value;return /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value||"")?value:"";};
  let requestToken=0;
  let mutationGuard=false;

  function levelClass(score,confidence){
    if(score>=65&&confidence>=.5)return"proficient";
    if(score>=35)return"developing";
    return"starting";
  }
  function compactSkill(skill,index){
    const lesson=Array.isArray(skill.lesson_ids)&&skill.lesson_ids[0];
    return lesson?`L${lesson}`:`S${index+1}`;
  }
  function cellTitle(student,skill,row){
    if(!row)return`${student.display_name} · ${skill.title} · No evidence yet`;
    const diagnostic=(key,suffix,multiplier=1)=>typeof row[key]==="number"&&Number.isFinite(row[key])?`${Math.round(row[key]*multiplier)}${suffix}`:`${suffix.trim()} unavailable`;
    return[
      student.display_name,
      skill.title,
      row.display_level,
      `${ECHSLearning.evidencePercent(row)} provisional practice; authenticated grading unavailable`,
      diagnostic('confidence','% recorded confidence',100),
      diagnostic('attempts',' reported attempts'),
      diagnostic('independent_evidence',' reported independent'),
      diagnostic('retention_evidence',' reported retention'),
      diagnostic('transfer_evidence',' reported transfer')
    ].join(" · ");
  }
  function renderMessage(message,type="loading"){
    const node=target();if(!node)return;
    mutationGuard=true;
    node.dataset.authoritativeEvidence="true";
    node.dataset.gradingAuthoritative="false";
    node.className=`heatmap evidenceHeatmap evidence-${type}`;
    node.innerHTML=`<div class="evidenceHeatmapMessage"><strong>${type==="error"?"Evidence unavailable":"Recorded practice evidence"}</strong><span>${escape(message)}</span></div>`;
    mutationGuard=false;
  }
  function render(data){
    const node=target();if(!node)return;
    const students=data.students||[],skills=data.skills||[],matrix=(data.matrix||[]).map(ECHSLearning.projectMasteryRecord);
    if(!students.length)return renderMessage("Add students to this class to build a skill evidence matrix.","empty");
    if(!skills.length)return renderMessage("No recorded skill evidence exists for this class yet. Verified mastery is unavailable.","empty");
    const byKey=new Map(matrix.map(row=>[`${row.account_id}::${row.skill_key}`,row]));
    const columns=`minmax(128px,1.45fr) repeat(${skills.length},minmax(58px,1fr))`;
    let html='<span class="heatmapHead evidenceLearnerHead">Learner</span>';
    html+=skills.map((skill,index)=>`<span class="heatmapHead evidenceSkillHead" title="${escape(skill.title)}"><b>${escape(compactSkill(skill,index))}</b><small>${skill.average_score==null?"—":`${Math.round(skill.average_score)}%`}</small></span>`).join("");
    students.forEach(student=>{
      html+=`<span class="heatmapName evidenceLearnerName" title="${escape(student.display_name)}">${escape(student.display_name.split(/\s+/)[0])}</span>`;
      skills.forEach(skill=>{
        const row=byKey.get(`${student.id}::${skill.skill_key}`);
        if(!row||row.evidence_status==="insufficient"){html+=`<span class="heatmapCell evidenceCell noEvidence" title="${escape(cellTitle(student,skill,row))}" aria-label="${escape(cellTitle(student,skill,row))}">—</span>`;return;}
        const score=Math.round(Number(row.score||0)),confidence=Number(row.confidence||0),level=levelClass(score,confidence);
        html+=`<a class="heatmapCell evidenceCell ${level}" href="student.html?student_id=${encodeURIComponent(student.id)}#journeySection" title="${escape(cellTitle(student,skill,row))}" aria-label="${escape(cellTitle(student,skill,row))}" style="--evidence-score:${score}%"><strong>${score}</strong><small>${typeof row.confidence==="number"?`${Math.round(confidence*100)}c`:"—c"}</small></a>`;
      });
    });
    html+=`<div class="evidenceLegend" style="grid-column:1/-1"><span><i class="starting"></i>Starting practice</span><span><i class="developing"></i>Developing practice</span><span><i class="proficient"></i>Proficient practice</span><span><i class="noEvidence"></i>Insufficient evidence</span><b>Provisional practice · ${Math.round(Number(data.coverage?.percent||0))}% recorded coverage. Verified mastery is unavailable.</b></div>`;
    mutationGuard=true;
    node.dataset.authoritativeEvidence="true";
    node.dataset.gradingAuthoritative="false";
    node.className="heatmap evidenceHeatmap";
    node.style.gridTemplateColumns=columns;
    node.innerHTML=html;
    mutationGuard=false;
    const coverage=document.getElementById("coverageMetric");if(coverage)coverage.textContent=`${Math.round(Number(data.coverage?.percent||0))}%`;
  }
  async function refresh(){
    const classId=selectedClass(),node=target();
    const token=++requestToken;
    if(!node)return;
    if(!classId)return renderMessage("Choose a class to view recorded practice evidence.","empty");
    renderMessage("Loading real student-by-skill evidence…");
    try{
      if(!window.ECHSMasteryEvidence)await new Promise(resolve=>document.addEventListener("echs:mastery-evidence-ready",resolve,{once:true}));
      const data=await ECHSMasteryEvidence.classEvidence(classId);
      if(token!==requestToken)return;
      render(data);
    }catch(error){
      if(token!==requestToken)return;
      renderMessage(error?.message||"The mastery evidence service could not be reached.","error");
    }
  }
  function install(){
    const select=selector(),node=target();
    if(!select||!node)return setTimeout(install,80);
    select.addEventListener("change",()=>setTimeout(refresh,0),true);
    const observer=new MutationObserver(()=>{
      if(mutationGuard||node.dataset.authoritativeEvidence==="true")return;
      refresh();
    });
    observer.observe(node,{childList:true,subtree:true});
    const waitForClass=()=>selectedClass()?refresh():setTimeout(waitForClass,100);
    waitForClass();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});else install();
})();
