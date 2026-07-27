/* ECHS Mathematics Mastery Evidence 2.0 client */
(function(){
  "use strict";
  const script=document.currentScript;
  const ROOT=script?new URL("../",script.src):new URL("./",location.href);
  const PENDING_KEY="echs_mastery_evidence_pending_v1";
  const safeJSON=(value,fallback)=>{try{return JSON.parse(value)??fallback}catch{return fallback}};
  const root=path=>new URL(path,ROOT).href;

  function learningPayload(){
    if(window.ECHSLearning&&typeof ECHSLearning.exportStudentReport==="function"){
      const report=ECHSLearning.exportStudentReport();
      return{
        attempts:report.attempts||[],
        sessions:report.sessions||[],
        review:report.review||report.mistakes||[],
        mastery:report.mastery||[]
      };
    }
    return{
      attempts:safeJSON(localStorage.getItem("echs_learning_events_v2"),[]),
      sessions:safeJSON(localStorage.getItem("echs_learning_sessions_v2"),[]),
      review:Object.values(safeJSON(localStorage.getItem("echs_learning_reviews_v2"),{})),
      mastery:Object.values(safeJSON(localStorage.getItem("echs_learning_mastery_v2"),{}))
    };
  }

  async function syncLearning(){
    const current=await window.ECHSInstitution?.me?.();
    if(!current||current.role!=="student")return{skipped:true};
    const payload=learningPayload();
    if(!navigator.onLine){localStorage.setItem(PENDING_KEY,JSON.stringify(payload));return{queued:true,authoritative:true}}
    const result=await ECHSInstitution.api("mastery-evidence","/sync",{method:"POST",body:JSON.stringify(payload)});
    localStorage.removeItem(PENDING_KEY);
    document.dispatchEvent(new CustomEvent("echs:mastery-authority",{detail:{source:"server",result}}));
    return result;
  }

  async function flushPending(){
    const pending=safeJSON(localStorage.getItem(PENDING_KEY),null);
    if(!pending||!navigator.onLine)return{skipped:true};
    const result=await ECHSInstitution.api("mastery-evidence","/sync",{method:"POST",body:JSON.stringify(pending)});
    localStorage.removeItem(PENDING_KEY);
    return result;
  }

  const classEvidence=classId=>ECHSInstitution.api("mastery-evidence",`/classes/${encodeURIComponent(classId)}`);
  const skillGraph=()=>fetch(root("data/knowledge-graph/ap-calculus-unit-1.json"),{cache:"no-store"}).then(response=>{if(!response.ok)throw new Error("Knowledge graph could not be loaded");return response.json()});
  const questionTrust=()=>fetch(root("question-bank/official/admin/data/question-trust-manifest.json"),{cache:"no-store"}).then(response=>{if(!response.ok)throw new Error("Question trust manifest could not be loaded");return response.json()});

  function install(){
    if(!window.ECHSInstitution)return setTimeout(install,40);
    ECHSInstitution.syncLearning=syncLearning;
    ECHSInstitution.flushPending=flushPending;
    document.documentElement.dataset.masteryAuthority="server";
    addEventListener("online",()=>flushPending().catch(error=>console.warn("Pending mastery evidence sync failed",error)));
    window.ECHSMasteryEvidence={ROOT:ROOT.href,learningPayload,syncLearning,flushPending,classEvidence,skillGraph,questionTrust};
    document.dispatchEvent(new CustomEvent("echs:mastery-evidence-ready"));
  }
  install();
})();
