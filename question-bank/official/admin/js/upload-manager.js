(function(){
  "use strict";
  const state={kind:"private-bank",file:null,request:null,poll:null};
  const $=id=>document.getElementById(id);
  const tabs=[...document.querySelectorAll("[data-upload-kind]")];
  const drop=$("dropZone"),fileInput=$("zipFile"),summary=$("fileSummary"),nameNode=$("fileName"),metaNode=$("fileMeta"),privateBankFields=$("privateBankFields"),releaseFields=$("releaseFields"),start=$("startUpload"),clear=$("clearUpload"),bar=$("progressBar"),percent=$("progressPercent"),stage=$("progressStage"),history=$("requestList"),clearTerminal=$("clearTerminalRequests");
  const terminalStatuses=new Set(["completed","failed","cancelled"]);
  const formatBytes=value=>{const size=Number(value||0);if(size<1024)return `${size} B`;if(size<1048576)return `${(size/1024).toFixed(1)} KB`;return `${(size/1048576).toFixed(1)} MB`};
  const escapeHTML=value=>String(value??"").replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[char]);
  const safeURL=value=>{try{const url=new URL(String(value||""),location.href);return url.protocol==="https:"&&url.hostname==="github.com"?url.href:""}catch{return""}};
  const api=(path,options={})=>window.ECHSInstitution.api("upload-manager-api",path,options);
  function setProgress(value,text){const n=Math.max(0,Math.min(100,Number(value||0)));bar.style.width=`${n}%`;percent.textContent=`${n}%`;stage.textContent=text||"Ready"}
  function selectKind(kind){
    state.kind=kind;tabs.forEach(tab=>tab.classList.toggle("active",tab.dataset.uploadKind===kind));
    privateBankFields.classList.toggle("hidden",kind!=="private-bank");releaseFields.classList.toggle("hidden",kind!=="course-release");
    $("managerTitle").textContent=kind==="private-bank"?"Upload a private question bank":"Upload a course unit release";
    $("managerCopy").textContent=kind==="private-bank"?"Choose one ECHS private-bank ZIP. The manifest, trust contract, mappings and media are validated before the bank is connected to private practice.":"Choose a reviewed unit ZIP. The processor will validate the package, create a repository branch and open a pull request automatically.";
    resetFile();
  }
  async function digest(file){const buffer=await file.arrayBuffer(),hash=await crypto.subtle.digest("SHA-256",buffer);return [...new Uint8Array(hash)].map(byte=>byte.toString(16).padStart(2,"0")).join("")}
  function resetFile(){state.file=null;state.request=null;fileInput.value="";summary.classList.add("hidden");start.disabled=true;setProgress(0,"Ready for a ZIP package")}
  function acceptFile(file){if(!file)return;if(!file.name.toLowerCase().endsWith(".zip")){alert("Please choose a ZIP package.");return}if(file.size>150*1024*1024){alert("The maximum package size is 150 MB.");return}state.file=file;nameNode.textContent=file.name;metaNode.textContent=`${formatBytes(file.size)} · ZIP package`;summary.classList.remove("hidden");start.disabled=false;setProgress(0,"Ready to validate")}
  async function signedUpload(url,file){return new Promise((resolve,reject)=>{const xhr=new XMLHttpRequest();xhr.open("PUT",url,true);xhr.setRequestHeader("content-type","application/zip");xhr.upload.onprogress=event=>{if(event.lengthComputable)setProgress(12+Math.round((event.loaded/event.total)*68),`Uploading securely · ${formatBytes(event.loaded)} of ${formatBytes(event.total)}`)};xhr.onload=()=>xhr.status>=200&&xhr.status<300?resolve(xhr.response):reject(new Error(`Storage upload failed (${xhr.status})`));xhr.onerror=()=>reject(new Error("Network error while uploading"));xhr.send(file)})}
  async function begin(){
    if(!state.file)return;start.disabled=true;clear.disabled=true;
    try{
      setProgress(3,"Calculating SHA-256 fingerprint");const sha=await digest(state.file);setProgress(7,"Creating secure upload request");
      const courseKey=state.kind==="private-bank"?$("bankCourseKey").value:$("courseKey").value;
      const payload={kind:state.kind,filename:state.file.name,size:state.file.size,sha256:sha,course_key:courseKey,unit_key:state.kind==="course-release"?$("unitKey").value.trim():""};
      if(state.kind==="course-release"&&!payload.unit_key)throw new Error("Enter the unit number, for example 4");
      const created=await api("/requests",{method:"POST",body:payload});state.request=created.request;
      if(created.duplicate){setProgress(created.request.progress,created.request.stage||"This package is already active or completed");watch(created.request.id);await loadHistory();return}
      if(!created.upload?.signed_url)throw new Error("Secure upload URL was not returned");
      setProgress(12,created.retry?"Retrying failed package upload":"Uploading ZIP to private staging");await signedUpload(created.upload.signed_url,state.file);setProgress(82,"Confirming upload");
      const completed=await api(`/requests/${state.request.id}/complete`,{method:"POST",body:{}});state.request=completed.request;setProgress(state.request.progress,state.request.stage);watch(state.request.id);await loadHistory();
    }catch(error){console.error(error);setProgress(0,error.message||"Upload failed");start.disabled=false}finally{clear.disabled=false}
  }
  function watch(id){clearInterval(state.poll);state.poll=setInterval(async()=>{try{const result=await api(`/requests/${id}`);const row=result.request;state.request=row;setProgress(row.progress,row.stage);await loadHistory();if(["completed","pr-opened","failed","cancelled"].includes(row.status)){clearInterval(state.poll);start.disabled=false}}catch(error){console.warn(error)}},5000)}
  function requestCard(row){
    const url=safeURL(row.github_pr_url),link=url?`<a href="${escapeHTML(url)}" target="_blank" rel="noopener">Open pull request ↗</a>`:"";
    const targets=Array.isArray(row.result?.target_courses)?row.result.target_courses:row.course_key?[row.course_key]:[];
    const bankName=row.result?.display_name||row.result?.bank_code||"";
    const result=row.result?.bank_code?`<span>${escapeHTML(bankName)} · ${Number(row.result.questions||0).toLocaleString("en-GB")} questions${targets.length?` · ${escapeHTML(targets.join(", "))}`:""}</span>`:"";
    const status=String(row.status||"unknown").replace(/[^a-z-]/g,"");
    const remove=terminalStatuses.has(status)?`<button class="historyDelete" type="button" data-delete-request="${escapeHTML(row.id)}">Remove</button>`:"";
    return `<article class="requestItem"><div class="requestTop"><strong>${escapeHTML(row.original_filename)}</strong><span class="statusPill ${status}">${escapeHTML(String(row.status||"unknown").replaceAll("-"," "))}</span></div><p>${escapeHTML(row.stage||"Waiting")}${row.error_message?` · ${escapeHTML(row.error_message)}`:""}</p><div class="miniTrack"><span style="width:${Math.max(0,Math.min(100,Number(row.progress||0)))}%"></span></div><div class="requestLinks">${link}${result}${remove}</div></article>`;
  }
  async function loadHistory(){
    try{
      const result=await api("/requests?limit=20"),rows=result.requests||[];
      history.innerHTML=rows.length?rows.map(requestCard).join(""):'<div class="emptyHistory">No uploads yet.</div>';
      clearTerminal.disabled=!rows.some(row=>terminalStatuses.has(String(row.status||"")));
    }catch(error){history.innerHTML='<div class="emptyHistory">Could not load upload history.</div>';clearTerminal.disabled=true}
  }
  async function deleteRequest(id){
    if(!confirm("Remove this completed or failed upload from the history? Imported banks and opened pull requests will not be deleted."))return;
    const button=history.querySelector(`[data-delete-request="${CSS.escape(id)}"]`);if(button)button.disabled=true;
    try{await api(`/requests/${id}`,{method:"DELETE"});if(state.request?.id===id)resetFile();await loadHistory()}catch(error){alert(error.message||"Could not remove this upload");if(button)button.disabled=false}
  }
  async function clearTerminalHistory(){
    if(!confirm("Clear all completed, failed, and cancelled upload records? Imported banks and pull requests will remain available."))return;
    clearTerminal.disabled=true;
    try{const result=await api("/requests/terminal",{method:"DELETE"});if(state.request&&terminalStatuses.has(String(state.request.status||"")))resetFile();await loadHistory();setProgress(0,`${Number(result.deleted||0)} history record${Number(result.deleted||0)===1?"":"s"} removed`)}catch(error){alert(error.message||"Could not clear upload history");await loadHistory()}
  }
  tabs.forEach(tab=>tab.addEventListener("click",()=>selectKind(tab.dataset.uploadKind)));
  ["dragenter","dragover"].forEach(type=>drop.addEventListener(type,event=>{event.preventDefault();drop.classList.add("drag")}));
  ["dragleave","drop"].forEach(type=>drop.addEventListener(type,event=>{event.preventDefault();drop.classList.remove("drag")}));
  drop.addEventListener("drop",event=>acceptFile(event.dataTransfer.files[0]));fileInput.addEventListener("change",()=>acceptFile(fileInput.files[0]));start.addEventListener("click",begin);clear.addEventListener("click",resetFile);
  history.addEventListener("click",event=>{const button=event.target.closest("[data-delete-request]");if(button)deleteRequest(button.dataset.deleteRequest)});
  clearTerminal.addEventListener("click",clearTerminalHistory);
  (async()=>{try{await window.ECHSInstitution.requireAuth(["teacher","admin"]);await loadHistory();setInterval(loadHistory,15000)}catch(error){location.href="../../login.html"}})();
})();
