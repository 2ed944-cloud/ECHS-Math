(async()=>{
  "use strict";
  const form=document.getElementById("loginForm");
  const button=document.getElementById("loginButton");
  const errorBox=document.getElementById("loginError");
  const warning=document.getElementById("configWarning");
  const cfg=await ECHSInstitution.config();
  const platformRoot=new URL(ECHSInstitution.root(""),location.href);
  const isLocalPreview=["localhost","127.0.0.1"].includes(location.hostname);

  function disableLogin(){
    button.disabled=true;
    form.querySelectorAll("input").forEach(input=>input.disabled=true);
  }

  async function showSetupState(){
    warning.classList.remove("hidden");
    disableLogin();
    const setupPath=String(cfg.setup_path||"setup.html").replace(/^\/+/,"");
    const setupUrl=ECHSInstitution.root(setupPath);
    const base=String(cfg.setup_api_base||cfg.api_base||"").replace(/\/$/,"");
    const hasBackend=Boolean(cfg.setup_enabled)&&/^https:\/\/[a-z0-9]+\.supabase\.co\/functions\/v1$/i.test(base);

    if(!hasBackend){
      warning.innerHTML="<strong>Institutional backend setup is not complete.</strong><br>An administrator must deploy the supplied Supabase migration and Edge Functions before school-managed accounts can be activated.";
      return;
    }

    if(isLocalPreview){
      warning.innerHTML=`<strong>Initial school setup is available.</strong><br>The live status check is skipped in the local visual preview. <a href="${setupUrl}?preview=1">Open the safe setup preview →</a>`;
      return;
    }

    try{
      const response=await fetch(`${base}/setup-api/status`,{cache:"no-store"});
      const status=await response.json();
      if(!response.ok||!status.ok)throw new Error(status?.error?.message||"Setup status is unavailable");
      if(status.complete){
        warning.innerHTML="<strong>The first administrator has been created.</strong><br>The frontend is waiting for its final reviewed activation change. Sign-in will open immediately after that configuration is enabled.";
      }else{
        warning.innerHTML=`<strong>Initial school setup is required.</strong><br>Create the first administrator through the one-time secure wizard. <a href="${setupUrl}">Open Initial Setup →</a>`;
      }
    }catch(error){
      warning.innerHTML=`<strong>The account backend is deployed, but setup status could not be confirmed.</strong><br>${String(error.message||"Try again shortly.")} <a href="${setupUrl}">Open Initial Setup →</a>`;
    }
  }

  if(!cfg.enabled)await showSetupState();

  const existing=await ECHSInstitution.me();
  if(existing){
    location.replace(ECHSInstitution.root(ECHSInstitution.roleHome(existing.role)));
    return;
  }

  const params=new URLSearchParams(location.search);
  form.addEventListener("submit",async event=>{
    event.preventDefault();
    errorBox.classList.remove("show");
    button.disabled=true;
    button.textContent="Signing in…";
    try{
      const account=await ECHSInstitution.login(form.username.value,form.password.value,form.remember.checked);
      const next=params.get("next");
      if(next){
        try{
          const candidate=new URL(next,location.href);
          if(candidate.origin!==location.origin)throw new Error("External redirect blocked");
          if(candidate.pathname.startsWith(platformRoot.pathname))return location.replace(candidate.href);
        }catch(_error){}
      }
      location.replace(ECHSInstitution.root(ECHSInstitution.roleHome(account.role)));
    }catch(error){
      errorBox.textContent=error.message||"Sign-in failed";
      errorBox.classList.add("show");
      button.disabled=false;
      button.textContent="Sign in to ECHS Mathematics";
    }
  });
})();
