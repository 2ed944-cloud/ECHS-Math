(async()=>{
  "use strict";
  const access=await window.ECHSPortalAccess?.ready;
  if(!access?.authenticated)return;
  const target=ECHSPortalAccess.roleHome(access.current);
  const current=new URL(location.href);const next=new URL(target,location.href);
  if(current.pathname!==next.pathname)location.replace(next.href);
})().catch(error=>{const node=document.getElementById("roleEntryStatus");if(node)node.textContent=error.message;});
