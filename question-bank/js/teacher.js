/* ECHS Teacher Dashboard */
(function(){
  "use strict";
  const $=id=>document.getElementById(id),esc=ECHSLearning.escapeHTML,labels=ECHSLearning.COURSE_LABELS;
  const K=ECHSLearning.KEYS;
  let selectedClassId=null;
  const classes=()=>ECHSLearning.read(K.classes,[]);
  const assignments=()=>ECHSLearning.read(K.assignments,[]);
  const reports=()=>ECHSLearning.read(K.submissions,[]);
  const saveClasses=rows=>ECHSLearning.write(K.classes,rows);
  const saveAssignments=rows=>ECHSLearning.write(K.assignments,rows);
  const saveReports=rows=>ECHSLearning.write(K.submissions,rows);

  function currentClass(){return classes().find(row=>row.id===selectedClassId)||classes()[0]||null;}
  function updateStats(){
    const c=classes(),a=assignments(),r=reports();
    $("heroClasses").textContent=c.length;
    $("heroStudents").textContent=c.reduce((sum,row)=>sum+(row.students||[]).length,0);
    $("heroAssignments").textContent=a.length;
    $("heroReports").textContent=r.length;
  }
  function renderClasses(){
    const rows=classes();
    if(!selectedClassId&&rows[0])selectedClassId=rows[0].id;
    $("classList").innerHTML=rows.length?rows.map(row=>`<article class="classCard ${row.id===selectedClassId?"active":""}"><button data-class="${esc(row.id)}"><strong>${esc(row.name)}</strong><p>${esc(labels[row.course]||row.course)} · ${(row.students||[]).length} students</p></button></article>`).join(""):`<div class="emptyLearning">No classes yet.</div>`;
    document.querySelectorAll("[data-class]").forEach(button=>button.onclick=()=>{selectedClassId=button.dataset.class;render();});
  }
  function reportForStudent(student){
    const rows=reports().filter(row=>row.report?.student?.id===student.id||String(row.report?.student?.name||"").toLowerCase()===student.name.toLowerCase());
    return rows.sort((a,b)=>new Date(b.importedAt)-new Date(a.importedAt))[0]?.report||null;
  }
  function renderClassOverview(){
    const cls=currentClass();
    if(!cls){$("classOverview").innerHTML='<div class="emptyLearning"><h2>Create your first class</h2><p>Add a roster, then create assignment links.</p></div>';return;}
    const studentRows=(cls.students||[]).map(student=>{
      const report=reportForStudent(student),summary=report?.summary;
      return`<tr><td><b>${esc(student.name)}</b></td><td>${summary?summary.attempts:"—"}</td><td>${summary?`${summary.accuracy}%`:"—"}</td><td>${summary?summary.mastered:"—"}</td><td>${summary?summary.unresolved:"—"}</td><td>${report?new Date(report.generatedAt).toLocaleDateString():"No report"}</td></tr>`;
    }).join("");
    $("classOverview").innerHTML=`<div class="learningToolbar"><div><span class="learningKicker">${esc(labels[cls.course]||cls.course)}</span><h2>${esc(cls.name)}</h2><p>${(cls.students||[]).length} students · updated ${new Date(cls.updatedAt||cls.createdAt).toLocaleDateString()}</p></div><div><button class="button ghost" id="editCurrentClass">Edit roster</button> <button class="button danger" id="deleteCurrentClass">Delete class</button></div></div><div style="overflow:auto"><table class="rosterTable"><thead><tr><th>Student</th><th>Attempts</th><th>Accuracy</th><th>Mastered</th><th>Mistakes</th><th>Latest report</th></tr></thead><tbody>${studentRows||'<tr><td colspan="6">No students in this class.</td></tr>'}</tbody></table></div>`;
    $("editCurrentClass").onclick=()=>openClassDialog(cls);
    $("deleteCurrentClass").onclick=()=>{if(confirm(`Delete ${cls.name}?`)){saveClasses(classes().filter(row=>row.id!==cls.id));saveAssignments(assignments().filter(row=>row.classId!==cls.id));selectedClassId=null;render();}};
  }
  function assignmentLink(row){
    const params=new URLSearchParams({assignment:row.id,title:row.title,course:row.course,count:String(row.count||10)});
    if(row.unit)params.set("unit",row.unit);
    if(row.difficulty&&row.difficulty!=="all")params.set("difficulty",row.difficulty);
    if(row.kind==="exam"){params.set("minutes",String(row.minutes||20));return new URL(`exam.html?${params}`,location.href).href;}
    params.set("mode",row.kind==="review"?"review":"adaptive");params.set("autostart","1");
    return new URL(`practice.html?${params}`,location.href).href;
  }
  function renderAssignments(){
    const cls=currentClass(),rows=assignments().filter(row=>!cls||row.classId===cls.id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
    $("assignmentList").innerHTML=rows.length?rows.map(row=>`<article class="assignmentCard"><span class="learningKicker">${esc(row.kind)}</span><h3>${esc(row.title)}</h3><p>${esc(labels[row.course]||row.course)}${row.unit?` · Unit ${esc(row.unit)}`:""} · ${row.count} questions${row.kind==="exam"?` · ${row.minutes} minutes`:""}${row.dueAt?` · Due ${new Date(row.dueAt).toLocaleDateString()}`:""}</p><div class="linkBox"><input readonly value="${esc(assignmentLink(row))}" aria-label="Assignment link"><button class="button ghost" data-copy="${esc(row.id)}">Copy</button><button class="button danger" data-delete-assignment="${esc(row.id)}">Delete</button></div></article>`).join(""):`<div class="emptyLearning">No assignments for this class.</div>`;
    document.querySelectorAll("[data-copy]").forEach(button=>button.onclick=async()=>{const row=assignments().find(item=>item.id===button.dataset.copy);await navigator.clipboard.writeText(assignmentLink(row));button.textContent="Copied";});
    document.querySelectorAll("[data-delete-assignment]").forEach(button=>button.onclick=()=>{saveAssignments(assignments().filter(row=>row.id!==button.dataset.deleteAssignment));render();});
  }
  function renderSubmissionSummary(){
    const cls=currentClass(),students=cls?.students||[],matched=students.map(student=>({student,report:reportForStudent(student)})).filter(row=>row.report);
    if(!matched.length){$("submissionSummary").innerHTML='<div class="emptyLearning">Import student learning reports to populate class analytics.</div>';return;}
    const attempts=matched.reduce((sum,row)=>sum+(row.report.summary?.attempts||0),0),accuracy=Math.round(matched.reduce((sum,row)=>sum+(row.report.summary?.accuracy||0),0)/matched.length),mastered=matched.reduce((sum,row)=>sum+(row.report.summary?.mastered||0),0);
    const weak=new Map();matched.forEach(({report})=>(report.weakTopics||[]).forEach(topic=>{const key=topic.key||topic.title;const item=weak.get(key)||{title:topic.title,count:0,total:0};item.count++;item.total+=topic.score||0;weak.set(key,item);}));
    const weakRows=[...weak.values()].sort((a,b)=>b.count-a.count).slice(0,8);
    $("submissionSummary").innerHTML=`<section class="metricGrid"><div class="metric"><b>${matched.length}</b><span>students reporting</span></div><div class="metric"><b>${attempts}</b><span>total attempts</span></div><div class="metric"><b>${accuracy}%</b><span>mean accuracy</span></div><div class="metric"><b>${mastered}</b><span>mastered topics</span></div></section><h3>Common support priorities</h3>${weakRows.length?weakRows.map(row=>`<div class="reviewRow"><div><strong>${esc(row.title)}</strong><p>${row.count} student report${row.count===1?"":"s"} · mean mastery ${Math.round(row.total/row.count)}%</p></div></div>`).join(""):"<p>No common weak topics were reported.</p>"}`;
  }
  function render(){updateStats();renderClasses();renderClassOverview();renderAssignments();renderSubmissionSummary();fillAssignmentClasses();}

  function openClassDialog(row=null){
    $("classId").value=row?.id||"";$("className").value=row?.name||"";$("classCourse").value=row?.course||"ap-calculus";$("studentNames").value=(row?.students||[]).map(student=>student.name).join("\n");$("classDialog").showModal();
  }
  function fillAssignmentClasses(){
    const rows=classes();$("assignmentClass").innerHTML=rows.map(row=>`<option value="${esc(row.id)}" ${row.id===selectedClassId?"selected":""}>${esc(row.name)}</option>`).join("");
  }
  $("newClass").onclick=()=>openClassDialog();
  $("saveClass").onclick=event=>{
    event.preventDefault();
    const id=$("classId").value||ECHSLearning.uid("class"),rows=classes(),existing=rows.find(row=>row.id===id);
    const oldByName=new Map((existing?.students||[]).map(student=>[student.name.toLowerCase(),student]));
    const students=$("studentNames").value.split(/\r?\n/).map(name=>name.trim()).filter(Boolean).map(name=>oldByName.get(name.toLowerCase())||{id:ECHSLearning.uid("student"),name});
    const row={id,name:$("className").value.trim()||"Untitled class",course:$("classCourse").value,students,createdAt:existing?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};
    const index=rows.findIndex(item=>item.id===id);if(index>=0)rows[index]=row;else rows.push(row);saveClasses(rows);selectedClassId=id;$("classDialog").close();render();
  };
  $("newAssignment").onclick=()=>{if(!classes().length){alert("Create a class first.");return;}fillAssignmentClasses();$("assignmentTitle").value="";$("assignmentUnit").value="";$("assignmentCount").value=10;$("assignmentMinutes").value=20;$("assignmentDue").value="";$("assignmentDialog").showModal();};
  $("saveAssignment").onclick=event=>{
    event.preventDefault();
    const cls=classes().find(row=>row.id===$("assignmentClass").value);if(!cls)return;
    const row={id:ECHSLearning.uid("assignment"),title:$("assignmentTitle").value.trim()||"Mathematics assignment",classId:cls.id,course:cls.course,kind:$("assignmentKind").value,unit:$("assignmentUnit").value.trim(),count:Math.max(1,Number($("assignmentCount").value)||10),minutes:Math.max(1,Number($("assignmentMinutes").value)||20),difficulty:$("assignmentDifficulty").value,dueAt:$("assignmentDue").value?new Date(`${$("assignmentDue").value}T23:59:59`).toISOString():null,createdAt:new Date().toISOString()};
    const rows=assignments();rows.push(row);saveAssignments(rows);$("assignmentDialog").close();render();
  };
  $("importReports").onchange=async event=>{
    const rows=reports();
    for(const file of event.target.files){try{const report=JSON.parse(await file.text());if(report.schema!=="echs-learning-report")throw new Error("Not an ECHS learning report");rows.push({id:ECHSLearning.uid("report"),report,sourceName:file.name,importedAt:new Date().toISOString()});}catch(error){alert(`${file.name}: ${error.message}`);}}
    saveReports(rows.slice(-1000));event.target.value="";render();
  };
  $("exportWorkspace").onclick=()=>ECHSLearning.downloadJSON(`ECHS-teacher-workspace-${ECHSLearning.dateKey()}.json`,{schema:"echs-teacher-workspace",schemaVersion:ECHSLearning.VERSION,generatedAt:new Date().toISOString(),classes:classes(),assignments:assignments(),reports:reports()});
  $("importWorkspace").onchange=async event=>{try{const data=JSON.parse(await event.target.files[0].text());if(data.schema!=="echs-teacher-workspace")throw new Error("Not an ECHS teacher workspace");saveClasses(data.classes||[]);saveAssignments(data.assignments||[]);saveReports(data.reports||[]);selectedClassId=null;render();}catch(error){alert(error.message);}event.target.value="";};
  render();
})();