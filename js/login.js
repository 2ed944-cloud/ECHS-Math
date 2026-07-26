(async()=>{
"use strict";
const form=document.getElementById("loginForm"),button=document.getElementById("loginButton"),errorBox=document.getElementById("loginError"),warning=document.getElementById("configWarning"),cfg=await ECHSInstitution.config(),platformRoot=new URL(ECHSInstitution.root(""),location.href);
if(!cfg.enabled){warning.classList.remove("hidden");button.disabled=true;form.querySelectorAll("input").forEach(input=>input.disabled=true)}
const existing=await ECHSInstitution.me();if(existing){location.replace(ECHSInstitution.root(ECHSInstitution.roleHome(existing.role)));return}
const params=new URLSearchParams(location.search);
form.addEventListener("submit",async event=>{event.preventDefault();errorBox.classList.remove("show");button.disabled=true;button.textContent="Signing in…";try{const account=await ECHSInstitution.login(form.username.value,form.password.value,form.remember.checked),next=params.get("next");if(next){try{const candidate=new URL(next,location.href);if(candidate.origin!==location.origin)throw new Error("External redirect blocked");if(candidate.pathname.startsWith(platformRoot.pathname))return location.replace(candidate.href)}catch(_error){}}location.replace(ECHSInstitution.root(ECHSInstitution.roleHome(account.role)))}catch(error){errorBox.textContent=error.message||"Sign-in failed";errorBox.classList.add("show");button.disabled=false;button.textContent="Sign in to ECHS Mathematics"}});
})();
