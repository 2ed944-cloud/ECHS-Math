(async()=>{
  "use strict";

  const $=id=>document.getElementById(id);
  const $$=selector=>[...document.querySelectorAll(selector)];
  const params=new URLSearchParams(location.search);
  const preview=params.get("preview")==="1";
  let step=1;
  let connectionReady=false;
  let createdCredentials=null;
  let secretInMemory="";
  let passwordInMemory="";

  const form=$("setupForm");
  const errorBox=$("setupError");
  const nextButton=$("nextStep");
  const backButton=$("backStep");
  const createButton=$("createInstitution");

  function showError(message){
    errorBox.textContent=message||"Unable to continue.";
    errorBox.classList.add("show");
    errorBox.scrollIntoView({block:"nearest",behavior:"smooth"});
  }
  function clearError(){errorBox.textContent="";errorBox.classList.remove("show")}

  function slugify(value){
    return String(value||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"")
      .toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,40);
  }
  function usernameValid(value){return /^[a-z0-9._-]{3,40}$/.test(value)}
  function slugValid(value){return /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/.test(value)}
  function passwordRules(value){
    return {
      length:value.length>=10,
      upper:/[A-Z]/.test(value),
      lower:/[a-z]/.test(value),
      number:/\d/.test(value),
      symbol:/[^A-Za-z0-9]/.test(value)
    };
  }
  function passwordValid(value){return Object.values(passwordRules(value)).every(Boolean)}
  function updatePasswordRules(){
    const rules=passwordRules($("adminPassword").value);
    Object.entries(rules).forEach(([name,valid])=>document.querySelector(`[data-rule="${name}"]`)?.classList.toggle("valid",valid));
  }
  function generatePassword(length=18){
    const lower="abcdefghjkmnpqrstuvwxyz",upper="ABCDEFGHJKMNPQRSTUVWXYZ",digits="23456789",symbols="!@#$%^&*_-+=";
    const all=lower+upper+digits+symbols,bytes=new Uint32Array(length);
    crypto.getRandomValues(bytes);
    const chars=[lower[bytes[0]%lower.length],upper[bytes[1]%upper.length],digits[bytes[2]%digits.length],symbols[bytes[3]%symbols.length]];
    for(let index=4;index<length;index++)chars.push(all[bytes[index]%all.length]);
    for(let index=chars.length-1;index>0;index--){const swap=bytes[index%bytes.length]%(index+1);[chars[index],chars[swap]]=[chars[swap],chars[index]]}
    return chars.join("");
  }

  async function loadConfig(){
    const response=await fetch("config/institution.json",{cache:"no-store",headers:{"cache-control":"no-cache"}});
    if(!response.ok)throw new Error("Institution configuration could not be loaded.");
    const cfg=await response.json();
    const base=String(cfg.setup_api_base||cfg.api_base||"").replace(/\/$/,"");
    if(!/^https:\/\/[a-z0-9]+\.supabase\.co\/functions\/v1$/i.test(base))throw new Error("The deployed Supabase setup endpoint is not configured.");
    return {...cfg,setup_api_base:base};
  }

  const cfg=await loadConfig().catch(error=>{showError(error.message);return null});

  async function api(path,options={}){
    if(preview){
      if(path==="/status")return{ok:true,complete:false,setup_available:true};
      if(path==="/health")return{ok:true,service:"echs-setup-api",version:"preview"};
      throw new Error("Preview mode cannot create an institution.");
    }
    if(!cfg)throw new Error("Institution configuration is unavailable.");
    const response=await fetch(`${cfg.setup_api_base}/setup-api${path}`,{
      ...options,
      cache:"no-store",
      headers:new Headers(options.headers||{})
    });
    const payload=await response.json().catch(()=>({ok:false,error:{message:`HTTP ${response.status}`}}));
    if(!response.ok)throw Object.assign(new Error(payload?.error?.message||"Setup request failed"),{code:payload?.error?.code,status:response.status});
    return payload;
  }

  function setStatus(kind,title,detail){
    const node=$("backendStatus");
    node.className=`setupStatus ${kind}`;
    node.querySelector("strong").textContent=title;
    node.querySelector("small").textContent=detail;
  }

  async function checkConnection(){
    clearError();
    connectionReady=false;
    nextButton.disabled=true;
    $("setupState").textContent="Checking";
    setStatus("checking","Checking the secure backend…","Please keep this page open.");
    try{
      const [health,status]=await Promise.all([api("/health"),api("/status")]);
      if(!health.ok||!status.ok)throw new Error("The setup service did not return a valid response.");
      if(status.complete){
        $("setupState").textContent="Locked";
        setStatus("locked","Initial setup is already complete","The database has permanently closed the bootstrap operation.");
        form.classList.add("hidden");
        $("setupLocked").classList.remove("hidden");
        return;
      }
      if(!status.setup_available)throw new Error("The bootstrap secret is not configured in Supabase.");
      connectionReady=true;
      $("setupState").textContent=preview?"Preview ready":"Ready";
      setStatus("ready",preview?"Safe visual preview":"Secure backend connected",preview?"No live account will be created in preview mode.":"The one-time setup service is available.");
      nextButton.disabled=false;
    }catch(error){
      $("setupState").textContent="Unavailable";
      setStatus("error","Connection check failed",error.message||"The setup service could not be reached.");
      showError(error.message||"The setup service could not be reached.");
    }
  }

  function updateStep(){
    $$('[data-panel]').forEach(panel=>panel.classList.toggle("active",Number(panel.dataset.panel)===step));
    $$('[data-step-indicator]').forEach(item=>{
      const value=Number(item.dataset.stepIndicator);
      item.classList.toggle("active",value===step);
      item.classList.toggle("complete",value<step);
    });
    backButton.classList.toggle("hidden",step===1);
    nextButton.classList.toggle("hidden",step===4);
    createButton.classList.toggle("hidden",step!==4);
    nextButton.disabled=step===1&&!connectionReady;
    if(step===4)fillReview();
    clearError();
    document.querySelector(`[data-panel="${step}"]`)?.scrollIntoView({block:"start",behavior:"smooth"});
  }

  function validateStep(){
    if(step===1){
      if(!connectionReady){showError("Complete the secure connection check first.");return false}
      return true;
    }
    if(step===2){
      const name=$("organizationName").value.trim(),slug=$("organizationSlug").value.trim().toLowerCase();
      if(name.length<2){showError("Enter the institution name.");return false}
      if(!slugValid(slug)){showError("Use lowercase letters, numbers and hyphens for the institution slug.");return false}
      return true;
    }
    if(step===3){
      const name=$("adminName").value.trim(),username=$("adminUsername").value.trim().toLowerCase(),email=$("adminEmail").value.trim(),password=$("adminPassword").value,secret=$("bootstrapSecret").value;
      if(name.length<2){showError("Enter the administrator's full name.");return false}
      if(!usernameValid(username)){showError("Enter a valid lowercase administrator username.");return false}
      if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){showError("Enter a valid email address or leave it blank.");return false}
      if(!passwordValid(password)){showError("The administrator password does not meet all five security requirements.");return false}
      if(secret.length<16){showError("Enter the full ECHS_BOOTSTRAP_SECRET value.");return false}
      return true;
    }
    return true;
  }

  function fillReview(){
    $("reviewOrganization").textContent=`${$("organizationName").value.trim()} · ${$("organizationSlug").value.trim().toLowerCase()}`;
    $("reviewName").textContent=$("adminName").value.trim();
    $("reviewUsername").textContent=`@${$("adminUsername").value.trim().toLowerCase()}`;
    $("reviewEmail").textContent=$("adminEmail").value.trim()||"Not provided";
  }

  nextButton.addEventListener("click",()=>{
    if(!validateStep())return;
    step=Math.min(4,step+1);
    updateStep();
  });
  backButton.addEventListener("click",()=>{step=Math.max(1,step-1);updateStep()});
  $("retryConnection").addEventListener("click",checkConnection);
  $("organizationName").addEventListener("input",event=>{
    const slug=$("organizationSlug");
    if(!slug.dataset.edited)slug.value=slugify(event.target.value);
  });
  $("organizationSlug").addEventListener("input",event=>{event.target.dataset.edited="true";event.target.value=slugify(event.target.value)});
  $("adminUsername").addEventListener("input",event=>event.target.value=event.target.value.toLowerCase().replace(/[^a-z0-9._-]/g,""));
  $("adminPassword").addEventListener("input",updatePasswordRules);
  $("togglePassword").addEventListener("click",()=>{
    const input=$("adminPassword"),show=input.type==="password";
    input.type=show?"text":"password";
    $("togglePassword").textContent=show?"Hide":"Show";
    $("togglePassword").setAttribute("aria-label",show?"Hide password":"Show password");
  });
  $("generatePassword").addEventListener("click",()=>{
    $("adminPassword").value=generatePassword();
    $("adminPassword").type="text";
    $("togglePassword").textContent="Hide";
    updatePasswordRules();
  });

  form.addEventListener("submit",async event=>{
    event.preventDefault();
    clearError();
    if(step!==4||!validateStep())return;
    if(!$("confirmPermanent").checked){showError("Confirm the permanent one-time setup operation.");return}
    if(preview){showError("Preview mode cannot create a live institution.");return}

    createButton.disabled=true;
    createButton.textContent="Creating securely…";
    secretInMemory=$("bootstrapSecret").value;
    passwordInMemory=$("adminPassword").value;

    try{
      const payload=await api("/bootstrap",{
        method:"POST",
        headers:{
          "content-type":"application/json",
          "x-bootstrap-secret":secretInMemory
        },
        body:JSON.stringify({
          organization_name:$("organizationName").value.trim(),
          organization_slug:$("organizationSlug").value.trim().toLowerCase(),
          display_name:$("adminName").value.trim(),
          username:$("adminUsername").value.trim().toLowerCase(),
          email:$("adminEmail").value.trim(),
          password:passwordInMemory
        })
      });

      createdCredentials={
        institution:$("organizationName").value.trim(),
        username:payload.account?.username||$("adminUsername").value.trim().toLowerCase(),
        password:passwordInMemory,
        created_at:new Date().toISOString()
      };
      $("createdUsername").textContent=createdCredentials.username;
      $("createdPassword").textContent=createdCredentials.password;
      secretInMemory="";
      $("bootstrapSecret").value="";
      form.classList.add("hidden");
      $("backendStatus").classList.add("hidden");
      $("setupSuccess").classList.remove("hidden");
      $("setupSuccess").scrollIntoView({block:"start",behavior:"smooth"});
    }catch(error){
      secretInMemory="";
      $("bootstrapSecret").value="";
      if(error.code==="setup_complete"){
        form.classList.add("hidden");
        $("setupLocked").classList.remove("hidden");
      }else showError(error.message||"Initial setup failed.");
    }finally{
      createButton.disabled=false;
      createButton.textContent="Create institution securely";
    }
  });

  function credentialText(){
    if(!createdCredentials)return"";
    return [
      "ECHS Mathematics — Initial Administrator Credential",
      "===================================================",
      `Institution: ${createdCredentials.institution}`,
      `Username: ${createdCredentials.username}`,
      `Initial password: ${createdCredentials.password}`,
      `Created: ${createdCredentials.created_at}`,
      "",
      "Store this record securely. The password cannot be retrieved from the database.",
      "Delete this file after transferring the credential to an approved password manager."
    ].join("\n");
  }
  $("copyCredentials").addEventListener("click",async()=>{
    try{await navigator.clipboard.writeText(credentialText());$("copyCredentials").textContent="Copied"}catch{showError("Copy failed. Use the download button instead.")}
  });
  $("downloadCredentials").addEventListener("click",()=>{
    const blob=new Blob([credentialText()],{type:"text/plain;charset=utf-8"}),url=URL.createObjectURL(blob),link=document.createElement("a");
    link.href=url;link.download=`ECHS-admin-credential-${new Date().toISOString().slice(0,10)}.txt`;link.click();setTimeout(()=>URL.revokeObjectURL(url),700);
  });

  addEventListener("beforeunload",()=>{
    secretInMemory="";passwordInMemory="";createdCredentials=null;
    if($("bootstrapSecret"))$("bootstrapSecret").value="";
    if($("adminPassword"))$("adminPassword").value="";
  });

  updatePasswordRules();
  updateStep();
  await checkConnection();
})().catch(error=>{
  console.error(error);
  const box=document.getElementById("setupError");
  if(box){box.textContent=error.message||"Initial setup could not start.";box.classList.add("show")}
});
