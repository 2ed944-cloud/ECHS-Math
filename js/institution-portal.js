/* ECHS landing entry and hybrid calculus artwork */
(function(){
  "use strict";
  if(document.body?.dataset.platformPage!=="home")return;
  const root=path=>window.ECHSInstitution?.root?.(path)||new URL(path,location.href).href;
  if(!document.querySelector('link[data-hybrid-landing-hero]')){
    const link=document.createElement("link");
    link.rel="stylesheet";
    link.href=root("css/landing-calculus-motion.css?v=20260727-hybrid1");
    link.dataset.hybridLandingHero="true";
    link.setAttribute("data-hybrid-landing-hero","true");
    document.head.append(link);
  }
  if(!document.querySelector('script[data-hybrid-landing-hero]')){
    const script=document.createElement("script");
    script.src=root("js/landing-hybrid-hero.js?v=20260727-hybrid1");
    script.dataset.hybridLandingHero="true";
    script.setAttribute("data-hybrid-landing-hero","true");
    script.async=true;
    document.head.append(script);
  }
})();

(async()=>{
  const entry=document.getElementById("institutionEntry"),tile=document.querySelector("[data-institution-entry]");
  if(!entry&&!tile)return;
  const cfg=await ECHSInstitution.config();
  const current=cfg.enabled?await ECHSInstitution.me():null;
  if(current){
    const href=ECHSInstitution.root(ECHSInstitution.roleHome(current.role));
    if(entry){entry.href=href;entry.textContent=`${current.display_name.split(/\s+/)[0]} · Dashboard`;entry.classList.add("institutionSignedIn")}
    if(tile){tile.querySelector(".platformTileLabel").textContent=`${current.role} account`;tile.querySelector("h3").textContent=`Welcome back, ${current.display_name}`;tile.querySelector("p").textContent="Open your secure school dashboard, assignments and synchronized progress.";const link=tile.querySelector("a");link.href=href;link.textContent="Open my dashboard"}
  }else{
    if(entry){entry.href=ECHSInstitution.root("login.html");entry.textContent="Sign in"}
    if(tile){const link=tile.querySelector("a");link.href=ECHSInstitution.root("login.html");if(!cfg.enabled){tile.querySelector("p").textContent="The secure institutional account system is prepared and awaiting backend activation."}}
  }
})().catch(error=>console.warn("Institution portal entry was not updated",error));
