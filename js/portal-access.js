/* ECHS Mathematics role and course access resolver */
(function(){
  "use strict";
  const COURSE_KEYS={
    "ap-calculus":"ap-calculus","ap-calculus-ab":"ap-calculus","ap-calculus-bc":"ap-calculus",
    "ap-precalculus":"ap-precalculus","ap-precalculus-g10-g11":"ap-precalculus",
    "algebra-2":"algebra-2","algebra-2-concepts":"algebra-2",
    "ib-math-ai":"ib-math-ai","ib-mathematics-ai":"ib-math-ai",
    "grade-9":"grade-9","grade-9-pre-precalculus":"grade-9"
  };
  const normalise=value=>{
    const key=String(value||"").trim().toLowerCase().replace(/&/g,"and").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
    if(COURSE_KEYS[key])return COURSE_KEYS[key];
    if(key.includes("precalculus"))return"ap-precalculus";
    if(key.includes("calculus"))return"ap-calculus";
    if(key.includes("algebra-2")||key.includes("algebra2"))return"algebra-2";
    if(key.includes("ib")&&key.includes("math"))return"ib-math-ai";
    if(key.includes("grade-9"))return"grade-9";
    return key;
  };
  const extractClass=row=>row?.classes||row?.class||row||{};
  const roleHome=current=>window.ECHSInstitution?.root(window.ECHSInstitution.roleHome(current?.role||"student"))||"../login.html";
  function updateRoleLinks(access){
    document.querySelectorAll("[data-role-home]").forEach(link=>{
      link.href=roleHome(access.current);
      link.textContent=access.role==="teacher"?"Teacher dashboard":access.role==="admin"?"Administration":access.role==="parent"?"Family dashboard":"My dashboard";
    });
    document.querySelectorAll("[data-role-access]").forEach(node=>{
      const roles=String(node.dataset.roleAccess||"").split(/\s+/).filter(Boolean);
      node.hidden=roles.length&&!roles.includes(access.role);
    });
  }
  async function resolve(){
    const guest={ready:true,authenticated:false,role:"guest",current:null,classes:[],courseKeys:[],allCourses:false,error:null};
    if(!window.ECHSInstitution)return{...guest,error:"Institution client is unavailable"};
    const cfg=await ECHSInstitution.config();
    if(!cfg.enabled)return{...guest,unconfigured:true};
    const current=await ECHSInstitution.me();
    if(!current)return guest;
    const access={ready:true,authenticated:true,role:current.role,current,classes:[],courseKeys:[],allCourses:["teacher","admin"].includes(current.role),error:null};
    if(current.role==="student"){
      const payload=await ECHSInstitution.api("institution-api","/dashboard/student");
      access.classes=(payload.classes||[]).map(extractClass).filter(Boolean);
      access.courseKeys=[...new Set(access.classes.map(row=>normalise(row.course_key||row.course||row.name)).filter(Boolean))];
      access.dashboard=payload;
    }
    if(current.role==="parent")access.courseKeys=[];
    return access;
  }
  function enforcePage(access){
    const body=document.body;if(!body)return;
    const roles=String(body.dataset.requireAccount||"").split(/\s+/).filter(Boolean);
    if(!roles.length)return;
    if(!access.authenticated){
      const next=encodeURIComponent(location.href);
      location.replace(ECHSInstitution.root(`login.html?next=${next}`));return;
    }
    if(!roles.includes(access.role)){location.replace(roleHome(access.current));return;}
  }
  const ready=resolve().catch(error=>({ready:true,authenticated:false,role:"guest",current:null,classes:[],courseKeys:[],allCourses:false,error:error?.message||String(error)})).then(access=>{
    window.ECHSPortalAccess.current=access;
    document.documentElement.dataset.platformRole=access.role;
    updateRoleLinks(access);
    enforcePage(access);
    document.dispatchEvent(new CustomEvent("echs:portal-access",{detail:access}));
    return access;
  });
  window.ECHSPortalAccess={
    ready,current:null,normaliseCourseKey:normalise,
    courseAllowed(value,access){const row=access||this.current;if(!row?.authenticated)return false;if(row.allCourses)return true;return row.courseKeys.includes(normalise(value));},
    lessonCompleted(key){try{return JSON.parse(localStorage.getItem("echs_math_complete")||"[]").includes(String(key));}catch{return false;}},
    roleHome
  };
})();
