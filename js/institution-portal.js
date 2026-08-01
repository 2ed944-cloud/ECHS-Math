/* ECHS landing entry, hybrid artwork, and completed-unit practice access. */
(function(){
  "use strict";
  if(document.body?.dataset.platformPage!=="home")return;
  const root=path=>window.ECHSInstitution?.root?.(path)||new URL(path,location.href).href;
  const installStyle=(marker,path)=>{
    if(document.querySelector(`link[${marker}]`))return;
    const link=document.createElement("link");link.rel="stylesheet";link.href=root(path);link.setAttribute(marker,"true");document.head.append(link);
  };
  const installScript=(marker,path)=>{
    if(document.querySelector(`script[${marker}]`))return;
    const script=document.createElement("script");script.src=root(path);script.setAttribute(marker,"true");script.async=true;document.head.append(script);
  };
  installStyle("data-hybrid-landing-hero","css/landing-calculus-motion.css?v=20260801-tangent3");
  installScript("data-hybrid-landing-hero","js/landing-hybrid-hero.js?v=20260801-tangent3");
  installStyle("data-unit-practice-unlock","css/unit-practice-unlock.css?v=20260801-collapse2");
  installScript("data-unit-practice-unlock","js/unit-practice-unlock.js?v=20260730-scope1");
  document.documentElement.dataset.hybridLandingHero="enabled";
  document.documentElement.dataset.unitPracticeUnlock="enabled";
})();

(async()=>{
  const entry=document.getElementById("institutionEntry"),tile=document.querySelector("[data-institution-entry]");
  if(!entry&&!tile)return;
  const cfg=await ECHSInstitution.config();
  const current=cfg.enabled?await ECHSInstitution.me():null;
  if(current){
    const href=ECHSInstitution.root(ECHSInstitution.roleHome(current.role));
    if(entry){entry.href=href;entry.textContent=`${current.display_name.split(/\s+/)[0]} · Dashboard`;entry.classList.add("institutionSignedIn");}
    if(tile){tile.querySelector(".platformTileLabel").textContent=`${current.role} account`;tile.querySelector("h3").textContent=`Welcome back, ${current.display_name}`;tile.querySelector("p").textContent="Open your secure school dashboard, assignments and synchronized progress.";const link=tile.querySelector("a");link.href=href;link.textContent="Open my dashboard";}
  }else{
    if(entry){entry.href=ECHSInstitution.root("login.html");entry.textContent="Sign in";}
    if(tile){const link=tile.querySelector("a");link.href=ECHSInstitution.root("login.html");if(!cfg.enabled)tile.querySelector("p").textContent="The secure institutional account system is prepared and awaiting backend activation.";}
  }
})().catch(error=>console.warn("Institution portal entry was not updated",error));
