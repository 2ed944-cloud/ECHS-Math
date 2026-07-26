(async()=>{
  const form=document.getElementById("loginForm"),button=document.getElementById("loginButton"),errorBox=document.getElementById("loginError"),warning=document.getElementById("configWarning");
  const cfg=await ECHSInstitution.config();
  if(!cfg.enabled){warning.classList.remove("hidden");button.disabled=true;}
  const existing=await ECHSInstitution.me();
  if(existing){location.replace(ECHSInstitution.root(ECHSInstitution.roleHome(existing.role)));return;}
  const params=new URLSearchParams(location.search);
  function safeNext(raw){
    if(!raw)return null;
    try{
      const candidate=new URL(raw,location.href),platformRoot=new URL(ECHSInstitution.ROOT);
      if(candidate.origin!==location.origin)return null;
      if(!candidate.pathname.startsWith(platformRoot.pathname))return null;
      return candidate.href;
    }catch{return null;}
  }
  form.addEventListener("submit",async event=>{
    event.preventDefault();errorBox.classList.remove("show");button.disabled=true;button.textContent="Signing in…";
    try{
      const account=await ECHSInstitution.login(form.username.value,form.password.value,form.remember.checked);
      const next=safeNext(params.get("next"));
      location.replace(next||ECHSInstitution.root(ECHSInstitution.roleHome(account.role)));
    }catch(error){errorBox.textContent=error.message||"Sign-in failed";errorBox.classList.add("show");button.disabled=false;button.textContent="Sign in to ECHS Mathematics";}
  });
})();
