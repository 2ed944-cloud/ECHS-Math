(()=>{
  let current=null,accounts=[],csvRows=[];
  const $=id=>document.getElementById(id);
  const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const date=value=>value?new Date(value).toLocaleDateString(undefined,{year:"numeric",month:"short",day:"numeric"}):"Never";
  const initials=name=>ECHSInstitution.initials(name);
  const isAdmin=()=>current?.role==="admin";
  const mayCreate=()=>isAdmin()||Boolean(current?.can_manage_accounts);
  const mayReset=row=>isAdmin()||row.role==="student";

  function open(dialog){dialog.showModal()}
  function closeDialogs(){document.querySelectorAll("dialog[open]").forEach(dialog=>dialog.close())}
  document.querySelectorAll("[data-close-dialog]").forEach(button=>button.addEventListener("click",closeDialogs));

  function configureRoleView(){
    if(isAdmin())return;
    document.querySelector(".institutionTopbar h1").textContent="School Account Directory";
    document.querySelector(".institutionTopbar p").textContent="View school accounts and reset permitted student passwords.";
    const hero=document.querySelector(".iHeroText h2");
    if(hero)hero.innerHTML="Student accounts.<span>Visible, secure and supported.</span>";
    const heroText=document.querySelector(".iHeroText>p");
    if(heroText)heroText.textContent="Teachers can view accounts allowed by school settings and reset student passwords without seeing the previous password.";
    document.querySelectorAll("[data-admin-only]").forEach(node=>node.classList.add("hidden"));
    if(!mayCreate()){
      ["openCreate","heroCreate","openImport","heroImport"].forEach(id=>$(id)?.classList.add("hidden"));
    }else{
      $("createRole").innerHTML='<option value="student">Student</option><option value="parent">Parent</option>';
      $("createManage").closest(".iControl")?.classList.add("hidden");
    }
  }

  function metrics(){
    $("totalAccounts").textContent=accounts.length;
    $("activeAccounts").textContent=accounts.filter(row=>row.status==="active").length;
    $("studentAccounts").textContent=accounts.filter(row=>row.role==="student").length;
    $("teacherAccounts").textContent=accounts.filter(row=>row.role==="teacher").length;
    $("parentAccounts").textContent=accounts.filter(row=>row.role==="parent").length;
    $("suspendedAccounts").textContent=accounts.filter(row=>row.status!=="active").length;
    const week=Date.now()-7*86400000;
    $("recentLogins").textContent=accounts.filter(row=>row.last_login_at&&new Date(row.last_login_at).getTime()>=week).length;
  }

  function render(){
    const q=$("accountSearch").value.trim().toLowerCase(),role=$("roleFilter").value,status=$("statusFilter").value;
    const rows=accounts.filter(row=>(!role||row.role===role)&&(!status||row.status===status)&&(!q||[row.display_name,row.username,row.email,row.external_id,row.grade].some(value=>String(value??"").toLowerCase().includes(q))));
    $("accountRows").innerHTML=rows.length?rows.map(row=>`<tr>
      <td><div class="accountIdentity"><span class="avatarInitial">${esc(initials(row.display_name))}</span><div><strong>${esc(row.display_name)}</strong><br><small>${esc(row.email||"No email")}</small></div></div></td>
      <td><strong>${esc(row.username)}</strong></td><td><span class="statusPill ${esc(row.role)}">${esc(row.role)}</span></td>
      <td>${esc(row.grade||row.external_id||"—")}</td><td><span class="statusPill ${esc(row.status)}">${esc(row.status)}</span></td>
      <td>${esc(date(row.last_login_at))}</td><td><div class="tableActions">
        ${mayReset(row)?`<button class="iButton secondary small" data-reset="${esc(row.id)}">Reset password</button>`:""}
        ${isAdmin()&&row.id!==current.id?`<button class="iButton ${row.status==="active"?"danger":"teal"} small" data-status="${esc(row.id)}" data-next="${row.status==="active"?"suspended":"active"}">${row.status==="active"?"Suspend":"Activate"}</button>`:""}
      </div></td></tr>`).join(""):`<tr><td colspan="7"><div class="emptyInstitution">No matching accounts.</div></td></tr>`;
    document.querySelectorAll("[data-reset]").forEach(button=>button.addEventListener("click",()=>{
      const row=accounts.find(item=>item.id===button.dataset.reset);if(!row||!mayReset(row))return;
      $("passwordAccountId").value=row.id;$("passwordTarget").textContent=`Set a new school-managed password for ${row.display_name} (@${row.username}).`;
      $("newPassword").value="";$("resetCredential").classList.add("hidden");open($("passwordDialog"));
    }));
    document.querySelectorAll("[data-status]").forEach(button=>button.addEventListener("click",()=>changeStatus(button.dataset.status,button.dataset.next)));
    metrics();
  }

  async function load(){
    const payload=await ECHSInstitution.api("account-api","/accounts");
    accounts=payload.accounts||[];render();
  }

  function download(name,text,type="text/csv"){
    const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),500);
  }
  function csvEscape(value){return `"${String(value??"").replace(/"/g,'""')}"`}
  function credentialsCSV(rows){const keys=["display_name","username","initial_password","role","email","external_id","grade","class_name"];return [keys.join(","),...rows.map(row=>keys.map(key=>csvEscape(row[key])).join(","))].join("\n")}

  function parseCSV(text){
    const rows=[];let row=[],field="",quoted=false;
    for(let i=0;i<text.length;i++){const c=text[i],next=text[i+1];
      if(quoted){if(c==='"'&&next==='"'){field+='"';i++;}else if(c==='"')quoted=false;else field+=c;}
      else if(c==='"')quoted=true;else if(c===","){row.push(field);field="";}else if(c==="\n"){row.push(field);rows.push(row);row=[];field="";}else if(c!=="\r")field+=c;
    }
    row.push(field);if(row.some(value=>value.trim()))rows.push(row);
    const headers=(rows.shift()||[]).map(value=>value.trim().toLowerCase().replace(/\s+/g,"_"));
    return rows.filter(values=>values.some(value=>value.trim())).map(values=>Object.fromEntries(headers.map((key,index)=>[key,values[index]?.trim()||""])));
  }

  async function readCSV(file){
    const text=await file.text();csvRows=parseCSV(text).slice(0,500);
    if(!isAdmin())csvRows=csvRows.map(row=>({...row,role:["student","parent"].includes(String(row.role).toLowerCase())?String(row.role).toLowerCase():"student"}));
    $("importPreview").innerHTML=`<div class="iNotice"><strong>${csvRows.length} rows ready.</strong> ${esc(csvRows.slice(0,3).map(row=>row.display_name||row.full_name||row.name).filter(Boolean).join(", "))}${csvRows.length>3?"…":""}</div>`;
    $("runImport").disabled=!csvRows.length;
  }

  async function changeStatus(id,status){
    if(!isAdmin())return;
    if(!confirm(`${status==="suspended"?"Suspend":"Activate"} this account?`))return;
    await ECHSInstitution.api("account-api",`/accounts/${id}/status`,{method:"PATCH",body:JSON.stringify({status})});await load();
  }

  async function init(){
    current=await ECHSInstitution.requireAuth(["admin","teacher"]);if(!current)return;
    ECHSInstitution.mountIdentity(current);configureRoleView();await load();
    ["accountSearch","roleFilter","statusFilter"].forEach(id=>$(id).addEventListener(id==="accountSearch"?"input":"change",render));
    ["openCreate","heroCreate"].forEach(id=>$(id).addEventListener("click",()=>{if(!mayCreate())return;$("createForm").reset();$("createdCredential").classList.add("hidden");open($("createDialog"));}));
    ["openImport","heroImport"].forEach(id=>$(id).addEventListener("click",()=>{if(!mayCreate())return;csvRows=[];$("importPreview").innerHTML="";$("runImport").disabled=true;$("csvFile").value="";open($("importDialog"));}));
    $("downloadTemplate").addEventListener("click",()=>download("echs-account-import-template.csv",isAdmin()?"display_name,email,username,password,role,grade,external_id,class_name\nAmina Hassan,amina@example.edu,,,student,11,S001,AP Precalculus\nMr Ahmed,ahmed@example.edu,ahmed.teacher,,teacher,,,":"display_name,email,username,password,role,grade,external_id,class_name\nAmina Hassan,amina@example.edu,,,student,11,S001,AP Precalculus"));
    $("csvFile").addEventListener("change",event=>event.target.files[0]&&readCSV(event.target.files[0]));
    ["dragenter","dragover"].forEach(type=>$("csvDrop").addEventListener(type,event=>{event.preventDefault();$("csvDrop").classList.add("drag")}));
    ["dragleave","drop"].forEach(type=>$("csvDrop").addEventListener(type,event=>{$("csvDrop").classList.remove("drag");if(type==="drop"){event.preventDefault();const file=event.dataTransfer.files[0];if(file)readCSV(file)}}));
    $("createForm").addEventListener("submit",async event=>{
      event.preventDefault();if(!mayCreate())return;
      const form=new FormData(event.target),payload=Object.fromEntries(form.entries());payload.can_manage_accounts=isAdmin()&&$("createManage").checked;
      if(!isAdmin()&&!["student","parent"].includes(payload.role))payload.role="student";
      const response=await ECHSInstitution.api("account-api","/accounts",{method:"POST",body:JSON.stringify(payload)}),row=response.account;
      $("createdCredential").innerHTML=`<strong>Account created — record this password now</strong><p>Username: <code>${esc(row.username)}</code><br>Password: <code>${esc(row.initial_password)}</code></p><button class="iButton gold small" type="button" id="downloadOne">Download credential</button>`;
      $("createdCredential").classList.remove("hidden");$("downloadOne").onclick=()=>download(`${row.username}-credential.csv`,credentialsCSV([row]));await load();
    });
    $("importForm").addEventListener("submit",async event=>{
      event.preventDefault();if(!mayCreate())return;
      $("runImport").disabled=true;$("runImport").textContent="Importing…";
      try{const response=await ECHSInstitution.api("account-api","/accounts/import",{method:"POST",body:JSON.stringify({rows:csvRows})});
        const created=response.created||[],errors=response.errors||[];$("importPreview").innerHTML=`<div class="iNotice"><strong>${created.length} accounts created.</strong> ${errors.length?`${errors.length} rows need correction.`:"Credential file is ready."}</div>${errors.length?`<div class="iNotice danger" style="margin-top:8px">${errors.map(item=>`Row ${item.row}: ${esc(item.message)}`).join("<br>")}</div>`:""}<button class="iButton gold" id="downloadCredentials" type="button" style="margin-top:12px">Download usernames and initial passwords</button>`;
        $("downloadCredentials").onclick=()=>download(`echs-account-credentials-${new Date().toISOString().slice(0,10)}.csv`,credentialsCSV(created));await load();
      }finally{$("runImport").disabled=false;$("runImport").textContent="Import accounts";}
    });
    $("passwordForm").addEventListener("submit",async event=>{
      event.preventDefault();const target=accounts.find(row=>row.id===$("passwordAccountId").value);if(!target||!mayReset(target))return;
      const response=await ECHSInstitution.api("account-api",`/accounts/${target.id}/reset-password`,{method:"POST",body:JSON.stringify({password:$("newPassword").value})});
      $("resetCredential").innerHTML=`<strong>Password reset completed</strong><p>New password: <code>${esc(response.initial_password)}</code></p><p>All previous sessions were revoked.</p>`;$("resetCredential").classList.remove("hidden");await load();
    });
  }
  init().catch(error=>{console.error(error);alert(error.message)});
})();