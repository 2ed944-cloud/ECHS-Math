/* ECHS Mathematics institutional client — custom account sessions */
(function(){
  "use strict";
  const script=document.currentScript;
  const ROOT=script?new URL("../",script.src):new URL("./",location.href);
  const KEYS={token:"echs_institution_token_v1",account:"echs_institution_account_v1",expires:"echs_institution_expires_v1",pending:"echs_institution_pending_sync_v1"};
  let configPromise=null,mePromise=null;

  function safeJSON(value,fallback){try{const parsed=JSON.parse(value);return parsed??fallback}catch{return fallback}}
  function root(path=""){return new URL(path,ROOT).href}
  function storage(){return localStorage}
  function token(){return storage().getItem(KEYS.token)||sessionStorage.getItem(KEYS.token)||""}
  function account(){return safeJSON(storage().getItem(KEYS.account)||sessionStorage.getItem(KEYS.account),"")}
  function expiresAt(){return storage().getItem(KEYS.expires)||sessionStorage.getItem(KEYS.expires)||""}
  function isExpired(){const value=Date.parse(expiresAt());return !Number.isFinite(value)||value<=Date.now()}
  function clearSession(){[storage(),sessionStorage].forEach(store=>{store.removeItem(KEYS.token);store.removeItem(KEYS.account);store.removeItem(KEYS.expires)});mePromise=null}
  function setSession(data,remember){
    clearSession();
    const store=remember?storage():sessionStorage;
    store.setItem(KEYS.token,data.token);
    store.setItem(KEYS.account,JSON.stringify(data.account));
    store.setItem(KEYS.expires,data.expires_at);
  }
  function requestError(message,status=0,code="request_error"){
    const error=new Error(message||"Institutional request failed");
    error.status=status;
    error.code=code;
    return error;
  }
  async function request(url,options={}){
    const {timeoutMs=20000,...init}=options;
    const controller=typeof AbortController!=="undefined"?new AbortController():null;
    let timedOut=false;
    const abort=()=>controller?.abort(init.signal?.reason);
    if(init.signal?.aborted)abort();else init.signal?.addEventListener("abort",abort,{once:true});
    const timer=controller?setTimeout(()=>{timedOut=true;controller.abort()},timeoutMs):null;
    try{return await fetch(url,{...init,signal:controller?.signal||init.signal})}
    catch(error){
      if(timedOut)throw requestError("The connection took too long. Please try again.",0,"timeout");
      if(init.signal?.aborted)throw error;
      throw requestError("Could not connect to ECHS. Check your connection and try again.",0,"network_error");
    }finally{if(timer)clearTimeout(timer);init.signal?.removeEventListener("abort",abort)}
  }
  async function config(){
    if(!configPromise)configPromise=request(root("config/institution.json"),{cache:"no-store",timeoutMs:12000})
      .then(response=>{if(!response.ok)throw new Error("Institution configuration could not be loaded");return response.json()})
      .catch(error=>{configPromise=null;return{enabled:false,configuration_error:error.message,api_base:""}});
    return configPromise;
  }
  async function api(service,path,options={}){
    const cfg=await config();
    if(cfg.configuration_error)throw requestError(cfg.configuration_error,0,"configuration_unavailable");
    if(!cfg.enabled)throw requestError("Institutional accounts are not configured yet",503,"unconfigured");
    const base=String(cfg.api_base||"").replace(/\/$/,"");
    const headers=new Headers(options.headers||{});
    if(options.body&&!headers.has("content-type"))headers.set("content-type","application/json");
    const currentToken=token();if(currentToken)headers.set("authorization",`Bearer ${currentToken}`);
    const body=options.body&&typeof options.body!=="string"&&!(options.body instanceof FormData)&&!(options.body instanceof Blob)?JSON.stringify(options.body):options.body;
    const response=await request(`${base}/${service}${path}`,{timeoutMs:options.method&&options.method!=="GET"?45000:20000,...options,cache:"no-store",body,headers});
    const payload=await response.json().catch(()=>({ok:false,error:{message:`HTTP ${response.status}`}}));
    if(response.status===401&&currentToken&&token()===currentToken){clearSession();document.dispatchEvent(new CustomEvent("echs:institution-signed-out"))}
    if(!response.ok&&response.status!==207)throw requestError(payload?.error?.message||`Request failed (${response.status})`,response.status,payload?.error?.code||"request_error");
    if(payload?.ok===false&&response.status!==207)throw requestError(payload?.error?.message||"The request could not be completed. Please try again.",response.status,payload?.error?.code||"request_error");
    return payload;
  }
  async function login(username,password,remember=false){
    const payload=await api("account-api","/login",{method:"POST",body:{username,password,remember}});
    setSession(payload,remember);mePromise=Promise.resolve(payload.account);return payload.account;
  }
  async function logout(){
    try{if(token())await api("account-api","/logout",{method:"POST",body:{}})}catch(_error){}
    clearSession();location.href=root("login.html");
  }
  async function me(force=false){
    if(!token()||isExpired()){clearSession();return null}
    const requestedToken=token();
    if(force||!mePromise)mePromise=api("account-api","/me").then(payload=>{
      if(token()!==requestedToken)throw requestError("Your session changed. Please reload this page.",409,"session_changed");
      const current=payload.account;
      const store=storage().getItem(KEYS.token)?storage():sessionStorage;
      store.setItem(KEYS.account,JSON.stringify(current));
      return current;
    }).catch(error=>{
      mePromise=null;
      if(error?.status===401){if(token()===requestedToken)clearSession();return null}
      throw error;
    });
    return mePromise;
  }
  function roleHome(role){return role==="admin"?"question-bank/school-control.html":role==="teacher"?"question-bank/teacher.html":role==="parent"?"question-bank/parent.html":"question-bank/student.html"}
  function showAuthUnavailable(error){
    if(document.getElementById("institutionAuthUnavailable"))return;
    const notice=document.createElement("div");
    notice.id="institutionAuthUnavailable";
    notice.setAttribute("role","alert");
    notice.style.cssText="position:relative;z-index:9999;margin:12px;padding:14px 16px;border:1px solid #e7b2bd;border-radius:14px;background:#fff1f3;color:#7b1835;font:600 14px/1.45 system-ui,sans-serif";
    notice.innerHTML='<strong>Account session could not be verified.</strong><br><span></span> <button type="button" style="margin-left:8px;padding:6px 10px;border:0;border-radius:8px;background:#7b1835;color:white;cursor:pointer">Retry</button>';
    notice.querySelector("span").textContent=String(error?.message||"The account service is temporarily unavailable.");
    notice.querySelector("button").addEventListener("click",()=>location.reload());
    document.body.prepend(notice);
  }
  async function requireAuth(roles=[]){
    const cfg=await config();
    if(!cfg.enabled){document.documentElement.dataset.institution="unconfigured";return null}
    let current;
    try{current=await me()}catch(error){
      document.documentElement.dataset.institution="unavailable";
      showAuthUnavailable(error);
      document.dispatchEvent(new CustomEvent("echs:institution-auth-error",{detail:{message:error?.message||"Session verification failed"}}));
      return null;
    }
    if(!current){const next=encodeURIComponent(location.href);location.replace(root(`login.html?next=${next}`));return null}
    if(roles.length&&!roles.includes(current.role)){location.replace(root(roleHome(current.role)));return null}
    delete document.documentElement.dataset.institutionRole;
    document.documentElement.dataset.institutionAccessRole=current.role;
    mountUploadManagerLink(current);
    return current;
  }
  function initials(name){return String(name||"?").split(/\s+/).slice(0,2).map(part=>part[0]).join("").toUpperCase()}
  function mountIdentity(current){
    const safeText=(selector,value)=>document.querySelectorAll(selector).forEach(node=>{
      if(node===document.documentElement||node===document.head||node===document.body){console.error(`Blocked identity text write to document root for ${selector}`);return}
      node.textContent=value;
    });
    const username=current?.username||String(current?.email||"").split("@")[0]||"";
    safeText("[data-institution-name]",current?.display_name||"Guest");
    safeText("[data-institution-username]",username);
    safeText("[data-institution-role]",current?.role||"");
    safeText("[data-institution-org]",current?.organization_name||"ECHS Mathematics");
    safeText("[data-institution-initials]",initials(current?.display_name));
    document.querySelectorAll("[data-institution-logout]").forEach(button=>button.addEventListener("click",logout));
    mountUploadManagerLink(current);
  }
  function mountUploadManagerLink(current=account()){
    if(!current||!["teacher","admin"].includes(current.role))return;
    document.querySelectorAll(".institutionNav").forEach(nav=>{
      if(nav.querySelector('[data-upload-manager-link]'))return;
      const link=document.createElement("a");
      link.href=root("question-bank/official/admin/upload-manager.html");
      link.dataset.uploadManagerLink="true";
      link.innerHTML='<span class="institutionNavIcon">⇧</span>Upload Banks & Units';
      const adminLink=nav.querySelector('#adminNav');
      if(adminLink)nav.insertBefore(link,adminLink);else nav.append(link);
    });
  }
  function normaliseCourse(value){
    const key=String(value||"").trim().toLowerCase().replace(/&/g,"and").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
    const aliases={"ap-calculus-ab":"ap-calculus","ap-calculus-bc":"ap-calculus","g12-ap-calculus-ab":"ap-calculus","ap-precalculus-g10-g11":"ap-precalculus","g11-ib-ai":"ib-math-ai","ib-mathematics-ai":"ib-math-ai","g9-pre-precalculus":"grade-9","grade-9-pre-precalculus":"grade-9","g10-algebra2-ap-readiness":"algebra-2","algebra-2-concepts":"algebra-2"};
    if(aliases[key])return aliases[key];if(key.includes("precalculus"))return"ap-precalculus";if(key.includes("calculus"))return"ap-calculus";if(key.includes("algebra-2")||key.includes("algebra2"))return"algebra-2";if((key.includes("ib")&&key.includes("math"))||key==="g11-ib-ai")return"ib-math-ai";if(key.includes("grade-9")||key.includes("pre-precalculus"))return"grade-9";return key;
  }
  function localLessonCompletions(){
    const completed=safeJSON(localStorage.getItem("echs_math_complete"),[]);
    if(!Array.isArray(completed))return[];
    return completed.map(value=>{const parts=String(value||"").split("::");if(parts.length<4)return null;const course=normaliseCourse(parts[0]),unitIndex=Number(parts[1]),topic=String(parts[2]||"").trim();if(!course||!Number.isInteger(unitIndex)||unitIndex<0||!topic)return null;return{access_key:`${course}::${unitIndex}::${topic}`,course_key:course,unit_index:unitIndex,topic,title:parts.slice(3).join("::"),completed_at:new Date().toISOString(),source:"authenticated-lesson-pathway"}}).filter(Boolean);
  }
  function localLearningPayload(){
    if(window.ECHSLearning&&typeof window.ECHSLearning.exportStudentReport==="function"){
      const learning=window.ECHSLearning;
      // The downloadable summary intentionally omits raw events. Sync the engine's
      // stable event/session IDs so the server can deduplicate repeated uploads.
      return {attempts:learning.attempts(),sessions:learning.sessions(),mastery:learning.masteryRows(),review:Object.values(learning.reviewMap()),lessons:localLessonCompletions()};
    }
    const attempts=safeJSON(localStorage.getItem("echs_learning_events_v2"),[]);
    return {attempts,sessions:safeJSON(localStorage.getItem("echs_learning_sessions_v2"),[]),mastery:Object.values(safeJSON(localStorage.getItem("echs_learning_mastery_v2"),{})),review:Object.values(safeJSON(localStorage.getItem("echs_learning_reviews_v2"),{})),lessons:localLessonCompletions()};
  }
  async function syncLearning(){
    // An offline reload may queue local work; the server still verifies the
    // account when this queue is flushed after reconnecting.
    const current=navigator.onLine?await me():token()&&!isExpired()?account():null;
    if(!current||current.role!=="student")return{skipped:true};
    const payload=localLearningPayload();
    const pendingKey=`${KEYS.pending}:${current.id}`;
    if(!navigator.onLine){localStorage.setItem(pendingKey,JSON.stringify({accountId:current.id,payload}));return{queued:true}}
    const pendingBefore=localStorage.getItem(pendingKey);
    const result=await api("learning-sync","/sync",{method:"POST",body:payload});
    if(token()&&account()?.id===current.id&&localStorage.getItem(pendingKey)===pendingBefore)localStorage.removeItem(pendingKey);return result;
  }
  async function flushPending(){
    if(!navigator.onLine)return;
    try{
      const current=await me();
      if(!current||current.role!=="student")return;
      const ownedKey=`${KEYS.pending}:${current.id}`,pendingKey=localStorage.getItem(ownedKey)?ownedKey:KEYS.pending;
      const serialized=localStorage.getItem(pendingKey),pending=safeJSON(serialized,null);
      // Legacy unowned queues are preserved, but never sent under a different school account.
      if(!pending?.accountId||pending.accountId!==current.id||!pending.payload)return;
      await api("learning-sync","/sync",{method:"POST",body:pending.payload});
      if(localStorage.getItem(pendingKey)===serialized)localStorage.removeItem(pendingKey);
    }catch(error){console.warn("Pending learning sync failed",error)}
  }
  function ensurePolish(){
    if(document.body.classList.contains("institutionBody")&&!document.querySelector('link[href*="platform-usability.css"]')){
      const usability=document.createElement("link");usability.rel="stylesheet";usability.href=root("css/platform-usability.css?v=20260904");document.head.append(usability);
    }
    if(!document.body.classList.contains("institutionBody")||document.querySelector('link[data-institution-polish]'))return;
    const link=document.createElement("link");link.rel="stylesheet";link.href=root("css/institution-polish.css?v=20260726-phase3");link.dataset.institutionPolish="true";document.head.append(link);
  }
  function setupMobileSidebar(){
    const toggle=document.querySelector("[data-institution-menu]"),sidebar=document.querySelector(".institutionSidebar");
    if(!toggle||!sidebar)return;
    if(!sidebar.id)sidebar.id="institutionSidebar";
    toggle.setAttribute("aria-controls",sidebar.id);toggle.setAttribute("aria-label","Toggle navigation");
    const setOpen=open=>{sidebar.classList.toggle("open",open);toggle.setAttribute("aria-expanded",String(open))};
    setOpen(false);
    toggle.addEventListener("click",()=>setOpen(!sidebar.classList.contains("open")));
    document.addEventListener("click",event=>{if(innerWidth>950||!sidebar.classList.contains("open"))return;if(!sidebar.contains(event.target)&&!toggle.contains(event.target))setOpen(false);else if(event.target.closest("a")&&sidebar.contains(event.target))setOpen(false)});
    document.addEventListener("keydown",event=>{if(event.key==="Escape"&&sidebar.classList.contains("open")){setOpen(false);toggle.focus()}});
  }
  function mountTimetableModule(){
    const page=document.body?.dataset?.premiumPage;
    if(!["student","teacher","admin"].includes(page))return;
    if(!document.querySelector('link[data-institution-timetable]')){
      const link=document.createElement("link");link.rel="stylesheet";link.href=root("question-bank/css/institution-timetable.css?v=20260802-timetable1");link.dataset.institutionTimetable="true";document.head.append(link);
    }
    if(!document.querySelector('script[data-institution-timetable]')){
      const script=document.createElement("script");script.src=root("question-bank/js/institution-timetable.js?v=20260802-timetable1");script.defer=true;script.dataset.institutionTimetable="true";document.body.append(script);
    }
  }
  function mountSmartLearningRoute(){
    const page=document.body?.dataset?.platformPage==="home"?"lessons":document.body?.dataset?.premiumPage;
    if(!["lessons","teacher","admin"].includes(page))return;
    if(!document.querySelector('link[data-smart-learning-route]')){
      const link=document.createElement("link");link.rel="stylesheet";link.href=root("css/smart-learning-route.css?v=20260802-route-design3");link.dataset.smartLearningRoute="true";document.head.append(link);
    }
    if(!document.querySelector('script[data-smart-learning-route]')){
      const script=document.createElement("script");script.src=root("js/smart-learning-route.js?v=20260802-route-design3");script.defer=true;script.dataset.smartLearningRoute="true";document.body.append(script);
    }
  }
  let syncTimer=null;
  function scheduleLearningSync(){clearTimeout(syncTimer);syncTimer=setTimeout(()=>syncLearning().catch(error=>console.warn("Institution learning sync failed",error)),1200)}
  function bind(){
    ensurePolish();setupMobileSidebar();mountUploadManagerLink();mountTimetableModule();mountSmartLearningRoute();
    addEventListener("online",flushPending);
    document.addEventListener("echs:learning-updated",scheduleLearningSync);
    window.addEventListener("echs:learning-attempt",scheduleLearningSync);
    window.addEventListener("echs:learning-session",scheduleLearningSync);
    window.addEventListener("echs:lesson-completed",scheduleLearningSync);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bind,{once:true});else bind();

  window.ECHSInstitution={ROOT:ROOT.href,root,config,api,login,logout,me,requireAuth,account,token,setSession,clearSession,roleHome,mountIdentity,mountUploadManagerLink,syncLearning,flushPending,initials};
})();
