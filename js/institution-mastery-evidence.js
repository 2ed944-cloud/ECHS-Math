/* ECHS Mathematics Mastery Evidence 2.0 client */
(function(){
  "use strict";
  const script=document.currentScript;
  const ROOT=script?new URL("../",script.src):new URL("./",location.href);
  const root=path=>new URL(path,ROOT).href;

  // Dashboard and event-driven syncing share the canonical raw payload and owned
  // queue. Keep this facade for existing teacher/student integrations.
  const learningPayload=()=>ECHSInstitution.learningPayload();
  const syncLearning=()=>ECHSInstitution.syncLearning();
  const flushPending=()=>ECHSInstitution.flushPending();

  const classEvidence=classId=>ECHSInstitution.api("mastery-evidence",`/classes/${encodeURIComponent(classId)}`);
  const skillGraph=()=>fetch(root("data/knowledge-graph/ap-calculus-unit-1.json"),{cache:"no-store"}).then(response=>{if(!response.ok)throw new Error("Knowledge graph could not be loaded");return response.json()});
  const questionTrust=()=>fetch(root("question-bank/official/admin/data/question-trust-manifest.json"),{cache:"no-store"}).then(response=>{if(!response.ok)throw new Error("Question trust manifest could not be loaded");return response.json()});

  function addTrustNavigation(){
    const current=ECHSInstitution.account?.(),nav=document.querySelector(".institutionNav");
    if(!current||!nav||!["teacher","admin"].includes(current.role))return;
    const adminLink=nav.querySelector("#adminNav");
    const add=(selector,attribute,href,label,icon)=>{
      if(nav.querySelector(selector))return;
      const link=document.createElement("a");
      link.href=root(href);
      link.setAttribute(attribute,"true");
      link.innerHTML=`<span class="institutionNavIcon">${icon}</span>${label}`;
      if(adminLink)nav.insertBefore(link,adminLink);else nav.append(link);
    };
    add("[data-question-trust-link]","data-question-trust-link","question-bank/official/admin/question-trust.html","Question Trust","⌾");
    add("[data-private-bank-link]","data-private-bank-link","question-bank/official/admin/private-bank-center.html","Private Banks","▦");
  }

  function install(){
    if(!window.ECHSInstitution)return setTimeout(install,40);
    document.documentElement.dataset.masteryAuthority="server";
    window.ECHSMasteryEvidence={ROOT:ROOT.href,learningPayload,syncLearning,flushPending,classEvidence,skillGraph,questionTrust};
    addTrustNavigation();
    document.dispatchEvent(new CustomEvent("echs:mastery-evidence-ready"));
  }
  install();
})();
