(async()=>{
  "use strict";
  const root=document.documentElement;
  const requested=String(root.dataset.institutionGuard||"").split(",").map(value=>value.trim()).filter(Boolean);
  root.dataset.authGuardState="checking";
  try{
    const current=await ECHSInstitution.requireAuth(requested);
    if(!current){
      root.dataset.authGuardState=document.documentElement.dataset.institution||"unavailable";
      return;
    }
    ECHSInstitution.mountIdentity(current);
    document.body.dataset.accessRole=current.role;
    root.dataset.authGuardState="ready";
    document.dispatchEvent(new CustomEvent("echs:institution-ready",{detail:current}));
  }catch(error){
    console.error("Institution access guard failed",error);
    root.dataset.authGuardState="unavailable";
    document.dispatchEvent(new CustomEvent("echs:institution-auth-error",{detail:{message:error?.message||"Access verification failed"}}));
  }
})();