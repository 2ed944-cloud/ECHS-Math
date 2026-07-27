(async()=>{
  "use strict";
  const root=document.documentElement;
  const requested=String(root.dataset.institutionGuard||"").split(",").map(value=>value.trim()).filter(Boolean);
  root.dataset.authGuardState="checking";

  function block(message){
    root.dataset.authGuardState="blocked";
    document.body.innerHTML=`<main style="min-height:100vh;display:grid;place-items:center;padding:24px;background:#f7f4ee;font-family:Inter,system-ui,sans-serif"><section role="alert" style="max-width:620px;padding:28px;border:1px solid rgba(116,24,61,.18);border-radius:22px;background:#fff;box-shadow:0 22px 60px rgba(16,42,67,.13);color:#102a43"><span style="display:inline-block;margin-bottom:10px;color:#74183d;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase">Protected ECHS workspace</span><h1 style="margin:0 0 10px;font:600 30px/1.1 Fraunces,Georgia,serif">Access could not be verified</h1><p style="margin:0 0 18px;color:#607080;line-height:1.65">${String(message||"The school account service is temporarily unavailable.").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]))}</p><a href="${ECHSInstitution.root("login.html")}" style="display:inline-flex;padding:11px 15px;border-radius:12px;background:#74183d;color:#fff;text-decoration:none;font-weight:900">Return to sign in</a></section></main>`;
    document.body.style.visibility="visible";
  }

  try{
    const current=await ECHSInstitution.requireAuth(requested);
    if(!current){
      if(root.dataset.institution==="unconfigured")block("Institutional account access is not configured. Protected learning content remains closed.");
      else if(root.dataset.institution==="unavailable")block("The account session could not be verified. Protected learning content remains closed.");
      return;
    }
    ECHSInstitution.mountIdentity(current);
    document.body.dataset.accessRole=current.role;
    root.dataset.authGuardState="ready";
    document.dispatchEvent(new CustomEvent("echs:institution-ready",{detail:current}));
  }catch(error){
    console.error("Institution access guard failed",error);
    block(error?.message||"Access verification failed");
    document.dispatchEvent(new CustomEvent("echs:institution-auth-error",{detail:{message:error?.message||"Access verification failed"}}));
  }
})();