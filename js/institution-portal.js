(async()=>{
  "use strict";
  const entry=document.getElementById("institutionEntry");
  const tile=document.querySelector("[data-institution-entry]");
  const libraryLinks=[...document.querySelectorAll("[data-teacher-library]")];
  if(!entry&&!tile&&!libraryLinks.length)return;

  const cfg=await ECHSInstitution.config();
  let current=null;
  try{current=cfg.enabled?await ECHSInstitution.me():null}catch(error){console.warn("Institution session could not be checked",error)}

  function updateTile(label,title,message,href,action){
    if(!tile)return;
    const labelNode=tile.querySelector(".platformTileLabel");
    const titleNode=tile.querySelector("h2,h3,strong");
    const messageNode=tile.querySelector("p");
    const link=tile.querySelector("a");
    if(labelNode)labelNode.textContent=label;
    if(titleNode)titleNode.textContent=title;
    if(messageNode)messageNode.textContent=message;
    if(link){link.href=href;link.textContent=action}
  }

  if(current){
    const href=ECHSInstitution.root(ECHSInstitution.roleHome(current.role));
    document.body.dataset.signedIn="true";
    document.body.dataset.accessRole=current.role;
    if(entry){entry.href=href;entry.textContent=`${String(current.display_name||"Account").split(/\s+/)[0]} · Dashboard`;entry.classList.add("institutionSignedIn")}
    updateTile(`${current.role} account`,`Welcome back, ${current.display_name}`,"Open your secure dashboard, assigned work and synchronized progress.",href,"Open my dashboard →");
    libraryLinks.forEach(link=>{
      const allowed=current.role==="teacher"||current.role==="admin";
      link.hidden=!allowed;
      if(allowed)link.href=ECHSInstitution.root("learning-library.html");
    });
  }else{
    document.body.dataset.signedIn="false";
    delete document.body.dataset.accessRole;
    if(entry){entry.href=ECHSInstitution.root("login.html");entry.textContent="Sign in";entry.classList.remove("institutionSignedIn")}
    updateTile("School account","Secure role-based access",cfg.enabled?"Students, teachers, families and administrators enter through school-created accounts.":"The secure institutional account system is prepared and awaiting backend activation.",ECHSInstitution.root("login.html"),"Sign in to my account →");
    libraryLinks.forEach(link=>{link.hidden=true});
  }
})().catch(error=>console.warn("Institution portal entry was not updated",error));