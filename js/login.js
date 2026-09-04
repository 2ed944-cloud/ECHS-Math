(async()=>{
  "use strict";
  const AUTH_SHELL_VERSION="20260727-school-control-v1";
  const AUTH_SHELL_MARKER="echs_auth_shell_cache_version";
  const form=document.getElementById("loginForm"),button=document.getElementById("loginButton");
  const errorBox=document.getElementById("loginError"),warning=document.getElementById("configWarning");
  const username=document.getElementById("username"),password=document.getElementById("password");
  const reveal=document.getElementById("togglePassword"),capsLock=document.getElementById("capsLockNotice");
  const retry=document.getElementById("loginRetry");
  const platformRoot=new URL(ECHSInstitution.root(""),location.href);
  let ready=false,busy=false;

  function showError(message){errorBox.textContent=message;errorBox.classList.add("show");errorBox.focus({preventScroll:true})}
  function setBusy(value,label){busy=value;button.disabled=value||!ready;button.textContent=label||(value?"Signing in…":"Sign in to ECHS Mathematics");form.setAttribute("aria-busy",String(value))}
  async function refreshAuthenticatedShell(){
    try{
      if(localStorage.getItem(AUTH_SHELL_MARKER)===AUTH_SHELL_VERSION)return;
      if("caches" in window){const keys=await caches.keys();await Promise.all(keys.filter(key=>key.startsWith("echs-")).map(key=>caches.delete(key)))}
      if("serviceWorker" in navigator){
        const registration=await navigator.serviceWorker.register(ECHSInstitution.root("sw.js"),{updateViaCache:"none"});
        await registration.update().catch(()=>{});
        if(registration.waiting)registration.waiting.postMessage({type:"SKIP_WAITING"});
        if(navigator.serviceWorker.controller)navigator.serviceWorker.controller.postMessage({type:"PURGE_AUTH_SHELL"});
      }
      localStorage.setItem(AUTH_SHELL_MARKER,AUTH_SHELL_VERSION);
    }catch(error){console.warn("Authenticated shell refresh could not complete",error)}
  }
  function rolePath(role){return role==="admin"?"question-bank/school-control.html":ECHSInstitution.roleHome(role)}
  function versionedRoleHome(role){const target=new URL(ECHSInstitution.root(rolePath(role)));target.searchParams.set("shell",AUTH_SHELL_VERSION);return target.href}
  function destination(role){
    const next=new URLSearchParams(location.search).get("next");
    if(next){
      try{
        const candidate=new URL(next,location.href);
        if(candidate.origin!==location.origin)return versionedRoleHome(role);
        if(candidate.origin===platformRoot.origin&&candidate.pathname.startsWith(platformRoot.pathname)&&!candidate.username&&!candidate.password&&!/\/(?:login|setup)\.html$/i.test(candidate.pathname)){
          if(role==="admin"&&/\/question-bank\/admin\.html$/i.test(candidate.pathname))candidate.pathname=new URL(ECHSInstitution.root("question-bank/school-control.html")).pathname;
          candidate.searchParams.set("shell",AUTH_SHELL_VERSION);return candidate.href;
        }
      }catch{}
    }
    return versionedRoleHome(role);
  }
  async function showSetupState(cfg){
    warning.classList.remove("hidden");
    warning.textContent="School sign-in is not available yet. Please contact your platform administrator.";
    const base=String(cfg.setup_api_base||cfg.api_base||"").replace(/\/$/,"");
    if(!cfg.setup_enabled||!/^https:\/\/[a-z0-9]+\.supabase\.co\/functions\/v1$/i.test(base))return;
    const link=document.createElement("a");link.href=ECHSInstitution.root("setup.html");link.textContent=" Open Initial Setup";
    if(["localhost","127.0.0.1"].includes(location.hostname)){link.href+="?preview=1";warning.append(link);return}
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
    try{
      const response=await fetch(`${base}/setup-api/status`,{cache:"no-store",signal:controller.signal}),status=await response.json();
      if(!response.ok||!status.ok)throw new Error("Setup status unavailable");
      warning.textContent=status.complete?"Your school account service is set up. Your administrator needs to finish activating sign-in.":"An administrator must complete the initial school setup before sign-in opens.";
      if(!status.complete)warning.append(link);
    }catch{warning.textContent="School setup status could not be checked. Your administrator can open setup or retry shortly.";warning.append(link)}
    finally{clearTimeout(timer)}
  }
  async function initialize(){
    ready=false;retry.hidden=true;errorBox.classList.remove("show");setBusy(true,"Connecting…");
    try{
      const cfg=await ECHSInstitution.config();
      if(cfg.configuration_error)throw new Error(cfg.configuration_error);
      if(!cfg.enabled){
        await showSetupState(cfg);
        return;
      }
      warning.classList.add("hidden");ready=true;
      const existing=await ECHSInstitution.me();
      if(existing){location.replace(destination(existing.role));return}
      if(!username.value)username.focus({preventScroll:true});
    }catch(error){showError(error.message||"Could not connect. Please try again.");retry.hidden=false}
    finally{setBusy(false)}
  }
  reveal?.addEventListener("click",()=>{
    const visible=password.type==="password";password.type=visible?"text":"password";
    reveal.textContent=visible?"Hide":"Show";reveal.setAttribute("aria-pressed",String(visible));reveal.setAttribute("aria-label",visible?"Hide password":"Show password");
    password.focus({preventScroll:true});
  });
  const updateCaps=event=>{if(capsLock)capsLock.hidden=!event.getModifierState?.("CapsLock")};
  password.addEventListener("keydown",updateCaps);password.addEventListener("keyup",updateCaps);
  password.addEventListener("blur",()=>{if(capsLock)capsLock.hidden=true});
  retry.addEventListener("click",initialize);
  form.addEventListener("submit",async event=>{
    event.preventDefault();if(busy||!ready)return;
    errorBox.classList.remove("show");setBusy(true);
    try{
      const account=await ECHSInstitution.login(username.value.trim(),password.value,document.getElementById("remember").checked);
      location.replace(destination(account.role));
    }catch(error){showError(error.message||"Sign-in failed. Please try again.")}
    finally{setBusy(false)}
  });
  // A cache refresh must never prevent a school account from reaching sign-in.
  refreshAuthenticatedShell();
  await initialize();
})();
