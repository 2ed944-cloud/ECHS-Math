/* ECHS Mathematics institutional client — custom account sessions */
(function(){
  "use strict";
  const script=document.currentScript;
  const ROOT=script?new URL("../",script.src):new URL("./",location.href);
  const KEYS={token:"echs_institution_token_v1",account:"echs_institution_account_v1",expires:"echs_institution_expires_v1",pending:"echs_institution_pending_sync_v1"};
  let configPromise=null,mePromise=null;
  // C04 session-lifecycle foundation: local ownership is not grading authority.
  const OWNER_CONTRACT="echs.owner-authority.v1",ME_CACHE_MS=30000;
  const SESSION_EVENT="echs:institution-session-change";
  const authorityListeners=new Set();
  const sessionNonce=`owner_${Date.now().toString(36)}_${Math.random().toString(36).slice(2).padEnd(12,"0")}`;
  let sessionEpoch=0,sessionState=null,sessionCommitting=false,sessionBlocked=false;
  let verifiedEpoch=-1,verifiedAt=0,expiryTimer=null,authClear=null;

  function safeJSON(value,fallback){try{const parsed=JSON.parse(value);return parsed??fallback}catch{return fallback}}
  function root(path=""){return new URL(path,ROOT).href}
  function storage(){return localStorage}
  function cleanAccount(value){
    if(!value||typeof value!=="object"||Array.isArray(value))throw requestError("Account information is invalid",0,"invalid_session");
    const fields=["id","organization_id","organization_name","username","display_name","email","role","grade","can_manage_accounts","expires_at","home","status"];
    const result={};
    for(const key of Reflect.ownKeys(value)){
      const descriptor=Object.getOwnPropertyDescriptor(value,key);
      if(typeof key!=="string"||!fields.includes(key)||!descriptor||!Object.hasOwn(descriptor,"value"))throw requestError("Account information is invalid",0,"invalid_session");
      const item=descriptor.value;
      if(item!==null&&typeof item!=="string"&&typeof item!=="boolean"&&!(typeof item==="number"&&Number.isFinite(item)))throw requestError("Account information is invalid",0,"invalid_session");
      if(typeof item==="string"&&item.length>4000)throw requestError("Account information is invalid",0,"invalid_session");
      result[key]=item;
    }
    const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    if(!uuid.test(result.id)||!uuid.test(result.organization_id)||!["student","teacher","admin","parent"].includes(result.role)||
      (result.status!==undefined&&result.status!=="active"))throw requestError("Account information is invalid",0,"invalid_session");
    return result;
  }
  function readSessionState(){
    if(sessionCommitting)return{kind:"unavailable",signature:"committing",reason:"storage_unavailable"};
    if(sessionBlocked)return{kind:"unavailable",signature:"blocked",reason:"storage_unavailable"};
    let areas;
    try{areas=[storage(),sessionStorage].map(store=>({store,token:store.getItem(KEYS.token),account:store.getItem(KEYS.account),expires:store.getItem(KEYS.expires)}))}
    catch{return{kind:"unavailable",signature:"storage_unavailable",reason:"storage_unavailable"}}
    try{
      const used=areas.filter(area=>area.token!==null||area.account!==null||area.expires!==null);
      if(!used.length)return{kind:"guest",signature:"guest"};
      if(used.length!==1)throw new Error("Ambiguous session storage");
      const area=used[0],current=cleanAccount(safeJSON(area.account,null)),expires=Date.parse(area.expires);
      if(typeof area.token!=="string"||!area.token||area.token.length>4096||typeof area.account!=="string"||area.account.length>20000||
        !Number.isSafeInteger(expires)||expires<=Date.now())throw new Error("Incomplete or expired session");
      const index=areas.indexOf(area),status=current.status||"active";
      return{kind:"account",token:area.token,account:current,expires,expiresRaw:area.expires,area:index,
        signature:JSON.stringify([index,area.token,current.id,current.organization_id,current.role,status,expires])};
    }catch{return{kind:"unavailable",signature:"invalid_session",reason:"invalid_session"}}
  }
  function notifyTransition(reason){
    const detail=Object.freeze({contract:OWNER_CONTRACT,epoch:sessionEpoch,state:sessionState.kind,reason});
    for(const listener of [...authorityListeners]){try{listener(detail)}catch{}}
    document.dispatchEvent(new CustomEvent(SESSION_EVENT,{detail}));
  }
  function armExpiryTimer(){
    if(expiryTimer!==null)clearTimeout(expiryTimer);expiryTimer=null;
    if(sessionState?.kind!=="account")return;
    const expectedEpoch=sessionEpoch,delay=Math.max(1,Math.min(60000,sessionState.expires-Date.now()));
    const timer=setTimeout(()=>{
      if(expiryTimer!==timer||sessionEpoch!==expectedEpoch)return;
      expiryTimer=null;observeSession("expiry_timer");
      if(sessionState.kind==="account")armExpiryTimer();
    },delay);
    expiryTimer=timer;timer?.unref?.(); // Optional Node fixture handle; browser timers are numeric.
  }
  function observeSession(reason="observe",force=false,notify=true){
    if(sessionCommitting)return{kind:"unavailable",signature:"committing"};
    const next=readSessionState();
    if(!sessionState||force||next.signature!==sessionState.signature){
      sessionState=next;sessionEpoch++;mePromise=null;verifiedEpoch=-1;verifiedAt=0;authClear=null;
      armExpiryTimer();
      if(notify)notifyTransition(reason);
    }else sessionState=next;
    return sessionState;
  }
  function captureRequest(){
    const state=observeSession();
    if(state.kind==="unavailable")throw requestError("Session storage is unavailable. Sign in again when storage is available.",0,"session_unavailable");
    return{epoch:sessionEpoch,signature:state.signature,token:state.token||"",kind:state.kind};
  }
  function sameRequest(owner){const state=observeSession();return state.kind!=="unavailable"&&owner.epoch===sessionEpoch&&owner.signature===state.signature}
  function assertRequest(owner){if(!sameRequest(owner))throw requestError("Your session changed. Please reload this page.",409,"session_changed")}
  function sameAuthRequest(owner,allowCleared=false){
    const state=observeSession();
    return(owner.epoch===sessionEpoch&&owner.signature===state.signature)||
      (allowCleared&&state.kind==="guest"&&authClear?.from===owner.epoch&&authClear?.to===sessionEpoch);
  }
  function clearAuthSession(owner){
    if(!sameAuthRequest(owner))throw requestError("Your session changed. Please reload this page.",409,"session_changed");
    clearSession();
    // Only this request's direct transition to guest authorizes its sign-in UI.
    // A synchronous successor login from a listener must never inherit this receipt.
    if(sessionEpoch!==owner.epoch+1||sessionState.kind!=="guest")throw requestError("Your session changed. Please reload this page.",409,"session_changed");
    authClear={from:owner.epoch,to:sessionEpoch};
  }
  function token(){const state=observeSession();return state.kind==="account"?state.token:""}
  function account(){const state=observeSession();return state.kind==="account"?{...state.account}:null}
  function expiresAt(){const state=observeSession();return state.kind==="account"?state.expiresRaw:""}
  function isExpired(){return observeSession().kind!=="account"}
  function freshVerification(at){const age=Date.now()-at;return age>=0&&age<ME_CACHE_MS}
  function commitSession(data,remember,reason){
    if(sessionCommitting)throw requestError("Session storage is changing",409,"session_changed");
    let current=null;
    if(data){
      current=cleanAccount(data.account);
      if(typeof data.token!=="string"||!data.token||data.token.length>4096||typeof data.expires_at!=="string"||
        !Number.isSafeInteger(Date.parse(data.expires_at))||Date.parse(data.expires_at)<=Date.now())throw requestError("Session information is invalid",0,"invalid_session");
    }
    sessionCommitting=true;
    let failed=false;const stores=[];
    try{
      stores.push(storage());stores.push(sessionStorage);
      for(const store of stores)for(const key of [KEYS.token,KEYS.account,KEYS.expires])store.removeItem(key);
      if(data){
        const store=stores[remember?0:1];
        store.setItem(KEYS.account,JSON.stringify(current));store.setItem(KEYS.expires,data.expires_at);
        store.setItem(KEYS.token,data.token); // The coherent triplet commits with its token last.
      }
    }catch{
      failed=true;
      // Reuse only acquired references: a blocked global property must not throw
      // again here and bypass the mandatory invalidation/notification below.
      for(const store of stores)for(const key of [KEYS.token,KEYS.account,KEYS.expires]){try{store.removeItem(key)}catch{}}
    }finally{sessionCommitting=false;sessionBlocked=failed}
    if(!failed){
      const stored=readSessionState();
      failed=data?stored.kind!=="account"||stored.token!==data.token||stored.account.id!==current.id||stored.account.organization_id!==current.organization_id||
        stored.account.role!==current.role||stored.expires!==Date.parse(data.expires_at)||stored.area!==(remember?0:1):stored.kind!=="guest";
      sessionBlocked=failed;
    }
    const state=observeSession(failed?"storage_unavailable":reason,true);
    if(failed||(data?state.kind!=="account":state.kind!=="guest")){
      throw requestError("Session storage is unavailable. Sign in again when storage is available.",0,"session_unavailable");
    }
  }
  function clearSession(){commitSession(null,false,"clear_session")}
  function setSession(data,remember){
    commitSession(data,!!remember,"set_session");
  }
  function requestError(message,status=0,code="request_error"){
    const error=new Error(message||"Institutional request failed");
    error.status=status;
    error.code=code;
    return error;
  }
  // Both internal callers consume JSON while cancellation and the deadline are
  // still active. A fetch resolving headers is not completion of its body.
  async function request(url,options={},consume){
    const {timeoutMs=20000,...init}=options;
    const controller=typeof AbortController!=="undefined"?new AbortController():null;
    let timedOut=false,headersReceived=false,consumed=false;
    const abort=()=>controller?.abort(init.signal?.reason);
    if(init.signal?.aborted)abort();else init.signal?.addEventListener("abort",abort,{once:true});
    const timer=controller?setTimeout(()=>{timedOut=true;controller.abort()},timeoutMs):null;
    try{
      const response=await fetch(url,{...init,signal:controller?.signal||init.signal});headersReceived=true;
      const result=await consume(response);
      if(timedOut)throw requestError("The connection took too long. Please try again.",0,"timeout");
      if(init.signal?.aborted)throw init.signal.reason||new DOMException("The request was cancelled","AbortError");
      consumed=true;return result;
    }
    catch(error){
      if(timedOut)throw requestError("The connection took too long. Please try again.",0,"timeout");
      if(init.signal?.aborted)throw error;
      if(headersReceived)throw error;
      throw requestError("Could not connect to ECHS. Check your connection and try again.",0,"network_error");
    }finally{if(!consumed)controller?.abort();if(timer)clearTimeout(timer);init.signal?.removeEventListener("abort",abort)}
  }
  async function config(){
    if(!configPromise)configPromise=request(root("config/institution.json"),{cache:"no-store",timeoutMs:12000},
      response=>{if(!response.ok)throw new Error("Institution configuration could not be loaded");return response.json()})
      .catch(error=>{configPromise=null;return{enabled:false,configuration_error:error.message,api_base:""}});
    return configPromise;
  }
  async function api(service,path,options={}){
    const {sessionGuard,...requestOptions}=options;
    const requestOwner=captureRequest();
    const cfg=await config();
    if(cfg.configuration_error)throw requestError(cfg.configuration_error,0,"configuration_unavailable");
    if(!cfg.enabled)throw requestError("Institutional accounts are not configured yet",503,"unconfigured");
    assertRequest(requestOwner);
    if(sessionGuard)assertSyncSession(sessionGuard);
    const base=String(cfg.api_base||"").replace(/\/$/,"");
    const headers=new Headers(options.headers||{});
    if(options.body&&!headers.has("content-type"))headers.set("content-type","application/json");
    const currentToken=requestOwner.token;if(currentToken)headers.set("authorization",`Bearer ${currentToken}`);
    const body=options.body&&typeof options.body!=="string"&&!(options.body instanceof FormData)&&!(options.body instanceof Blob)?JSON.stringify(options.body):options.body;
    const {response,payload}=await request(`${base}/${service}${path}`,{timeoutMs:options.method&&options.method!=="GET"?45000:20000,...requestOptions,cache:"no-store",body,headers},
      async response=>({response,payload:await response.json().catch(()=>({ok:false,error:{message:`HTTP ${response.status}`}}))}));
    if(response.status===401&&currentToken&&sameRequest(requestOwner)){
      try{clearAuthSession(requestOwner)}catch{}
      if(sameAuthRequest(requestOwner,true))document.dispatchEvent(new CustomEvent("echs:institution-signed-out"));
    }
    if(!response.ok&&response.status!==207)throw requestError(payload?.error?.message||`Request failed (${response.status})`,response.status,payload?.error?.code||"request_error");
    if(payload?.ok===false&&response.status!==207)throw requestError(payload?.error?.message||"The request could not be completed. Please try again.",response.status,payload?.error?.code||"request_error");
    assertRequest(requestOwner);
    return payload;
  }
  async function login(username,password,remember=false){
    if(observeSession().kind==="unavailable")clearSession();
    const payload=await api("account-api","/login",{method:"POST",body:{username,password,remember}});
    setSession(payload,remember);return account();
  }
  async function logout(){
    const owner=captureRequest();
    try{if(token())await api("account-api","/logout",{method:"POST",body:{}})}catch(_error){}
    if(sameRequest(owner)){clearSession();location.href=root("login.html")}
  }
  async function me(force=false){
    const initial=observeSession();
    if(initial.kind==="guest")return null;
    if(initial.kind==="unavailable"&&initial.reason==="invalid_session"){clearAuthSession({epoch:sessionEpoch,signature:initial.signature});return null}
    if(initial.kind!=="account")throw requestError("Session storage is unavailable. Sign in again when storage is available.",0,"session_unavailable");
    const requested=captureRequest();
    if(mePromise&&mePromise.epoch===requested.epoch&&(!mePromise.settled||(!force&&freshVerification(mePromise.verifiedAt))))return mePromise.promise.then(value=>{if(value===null&&sameAuthRequest(requested,true))return null;assertRequest(requested);return{...value}});
    const entry={epoch:requested.epoch,settled:false,verifiedAt:0,promise:null};
    mePromise=entry;
    entry.promise=(async()=>{
      try{
        const payload=await api("account-api","/me");assertRequest(requested);
        const current=cleanAccount(payload.account);
        if(typeof current.expires_at!=="string")throw requestError("The verified account expiry is invalid",0,"invalid_verified_session");
        const serverExpiry=Date.parse(current.expires_at);
        if(payload.ok!==true||current.id!==initial.account.id||!Number.isSafeInteger(serverExpiry)||serverExpiry<=Date.now())throw requestError("The verified account did not match this session",0,"invalid_verified_session");
        const store=initial.area===0?storage():sessionStorage;
        sessionCommitting=true;let failed=false;
        try{store.setItem(KEYS.account,JSON.stringify(current));store.setItem(KEYS.expires,current.expires_at)}catch{failed=true}
        finally{sessionCommitting=false;sessionBlocked=failed}
        if(!failed){
          const stored=readSessionState();
          failed=stored.kind!=="account"||stored.token!==requested.token||stored.area!==initial.area||sessionEpoch!==requested.epoch||
            stored.account.id!==current.id||stored.account.organization_id!==current.organization_id||stored.account.role!==current.role||stored.expires!==serverExpiry;
          sessionBlocked=failed;
        }
        const updated=observeSession(failed?"storage_unavailable":"verified_account");
        if(failed||updated.kind!=="account")throw requestError("Session storage is unavailable",0,"session_unavailable");
        if(updated.account.id!==current.id||updated.account.organization_id!==current.organization_id||updated.account.role!==current.role||updated.expires!==serverExpiry)throw requestError("The verified account did not match this session",0,"invalid_verified_session");
        entry.verifiedAt=Date.now();verifiedAt=entry.verifiedAt;verifiedEpoch=sessionEpoch;
        // A server-confirmed role/org/expiry change is a new local authority epoch.
        // Existing captured handles must reopen rather than adopt that transition.
        if(sessionEpoch!==requested.epoch)throw requestError("Your session changed. Please reload this page.",409,"session_changed");
        return{...current};
      }catch(error){
        if(mePromise===entry)mePromise=null;
        if(error?.status===401){
          if(sameRequest(requested))clearAuthSession(requested);
          if(sameAuthRequest(requested,true))return null;
          throw requestError("Your session changed. Please reload this page.",409,"session_changed");
        }
        if(["invalid_session","invalid_verified_session"].includes(error?.code)&&sameRequest(requested))observeSession("verification_failed",true);
        throw error;
      }finally{entry.settled=true}
    })();
    return entry.promise;
  }
  function authorityCapture(){
    const state=observeSession();
    const base={epoch:sessionEpoch,session_id:`${sessionNonce}_${sessionEpoch}`};
    if(state.kind==="guest")return Object.freeze({kind:"guest",...base});
    if(state.kind!=="account")throw requestError("Current ownership is unavailable",0,"authority_unavailable");
    return Object.freeze({kind:"account",organization_id:state.account.organization_id,account_id:state.account.id,role:state.account.role,
      status:"active",expires_at:state.expires,...base});
  }
  function sameCapture(left,right){
    const keys=Object.keys(right);return left&&typeof left==="object"&&Object.keys(left).length===keys.length&&keys.every(key=>{
      const descriptor=Object.getOwnPropertyDescriptor(left,key);return descriptor&&Object.hasOwn(descriptor,"value")&&descriptor.value===right[key];
    });
  }
  const ownerAuthority=Object.freeze({
    capture:authorityCapture,
    async verify(captured){
      const before=authorityCapture();
      if(before.kind!=="account"||!sameCapture(captured,before))throw requestError("Your session changed. Please reload this page.",409,"session_changed");
      const current=await me(true),after=authorityCapture();
      if(!current||!sameCapture(captured,after)||verifiedEpoch!==after.epoch||!freshVerification(verifiedAt))throw requestError("Current ownership could not be verified",0,"verification_failed");
      return Object.freeze({contract:OWNER_CONTRACT,verified:true,identity:after});
    },
    subscribe(listener){if(typeof listener!=="function")throw new TypeError("A listener is required");authorityListeners.add(listener);return()=>authorityListeners.delete(listener)},
  });
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
    const initial=observeSession(),owner={epoch:sessionEpoch,signature:initial.signature};
    const cfg=await config();
    if(!sameAuthRequest(owner))return null;
    if(!cfg.enabled){document.documentElement.dataset.institution="unconfigured";return null}
    let current;
    try{current=await me()}catch(error){
      if(!sameAuthRequest(owner))return null;
      document.documentElement.dataset.institution="unavailable";
      if(!sameAuthRequest(owner))return null;
      showAuthUnavailable(error);
      if(!sameAuthRequest(owner))return null;
      document.dispatchEvent(new CustomEvent("echs:institution-auth-error",{detail:{message:error?.message||"Session verification failed"}}));
      return null;
    }
    if(!current){
      if(!sameAuthRequest(owner,true))return null;
      const next=encodeURIComponent(location.href);location.replace(root(`login.html?next=${next}`));return null;
    }
    if(!sameAuthRequest(owner))return null;
    if(roles.length&&!roles.includes(current.role)){location.replace(root(roleHome(current.role)));return null}
    if(!sameAuthRequest(owner))return null;
    delete document.documentElement.dataset.institutionRole;
    if(!sameAuthRequest(owner))return null;
    document.documentElement.dataset.institutionAccessRole=current.role;
    if(!sameAuthRequest(owner))return null;
    mountUploadManagerLink(current);
    return sameAuthRequest(owner)?current:null;
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
  const ownedLearningHeld=()=>document.documentElement?.dataset?.ownedLearning==="p2-practice"||window.ECHSLearning?.contract==="echs.learning.owned.v1";
  const heldLearning=()=>({status:"held",reason:"versioned_sync_required",uploaded:0,acknowledged:0});
  function localLearningPayload(){if(ownedLearningHeld())return heldLearning();
    if(window.ECHSLearning&&typeof window.ECHSLearning.exportStudentReport==="function"){
      const learning=window.ECHSLearning;
      // The downloadable summary intentionally omits raw events. Sync the engine's
      // stable event/session IDs so the server can deduplicate repeated uploads.
      return {attempts:learning.attempts(),sessions:learning.sessions(),mastery:learning.masteryRows(),review:Object.values(learning.reviewMap()),lessons:localLessonCompletions()};
    }
    const attempts=safeJSON(localStorage.getItem("echs_learning_events_v2"),[]);
    return {attempts,sessions:safeJSON(localStorage.getItem("echs_learning_sessions_v2"),[]),mastery:Object.values(safeJSON(localStorage.getItem("echs_learning_mastery_v2"),{})),review:Object.values(safeJSON(localStorage.getItem("echs_learning_reviews_v2"),{})),lessons:localLessonCompletions()};
  }
  function syncSession(){
    const current=account(),currentToken=token();
    return current?.id&&current.role==="student"&&currentToken&&!isExpired()?{accountId:current.id,...captureRequest()}:null;
  }
  function assertSyncSession(owner){
    if(owner.epoch!==undefined)assertRequest(owner);
    if(token()!==owner.token||account()?.id!==owner.accountId||account()?.role!=="student"||isExpired())throw requestError("Your session changed. Please reload this page.",409,"session_changed");
  }
  function mergeLearningPayload(previous,current){
    const keys={attempts:row=>row.event_id??row.client_event_id??row.id,sessions:row=>row.client_session_id??row.clientSessionId??row.id,review:row=>row.question_id??row.questionId??row.id,lessons:row=>row.access_key,mastery:row=>row.skill_key??row.key};
    return Object.fromEntries(Object.entries(keys).map(([field,key])=>{
      const rows=new Map();
      for(const row of [...(Array.isArray(previous?.[field])?previous[field]:[]),...(Array.isArray(current?.[field])?current[field]:[])])rows.set(String(key(row)??JSON.stringify(row)),row);
      return[field,[...rows.values()]];
    }));
  }
  async function sendLearningQueue(owner,pendingKey,serialized){if(ownedLearningHeld())return heldLearning();
    const pending=safeJSON(serialized,null);
    // Old unowned queues, including the former mastery bridge queue, are never adopted.
    if(!pending?.accountId||pending.accountId!==owner.accountId||!pending.payload)return{skipped:true};
    assertSyncSession(owner);
    const verified=await me();
    assertSyncSession(owner);
    if(verified?.id!==owner.accountId||verified.role!=="student")throw requestError("Student sign-in is required",401,"student_required");
    const result=await api("mastery-evidence","/sync",{method:"POST",body:pending.payload,sessionGuard:owner});
    assertSyncSession(owner);
    // Pages and Edge Functions deploy separately. An older endpoint can accept
    // evidence while silently ignoring completions; retain that snapshot for retry.
    if(pending.payload.lessons?.length&&result.sync_contract!=="echs-learning-sync-v1")return{...result,queued:true,reason:"completion_sync_unavailable"};
    if(localStorage.getItem(pendingKey)===serialized)localStorage.removeItem(pendingKey);
    if(result.authoritative)document.dispatchEvent(new CustomEvent("echs:mastery-authority",{detail:{source:"server",result}}));
    return result;
  }
  async function syncLearning(){if(ownedLearningHeld())return heldLearning();
    // Capture ownership and persist the snapshot before any asynchronous verification
    // or request. A failed online send is just as recoverable as an offline send.
    const owner=syncSession();
    if(!owner)return{skipped:true};
    const pendingKey=`${KEYS.pending}:${owner.accountId}`,previous=safeJSON(localStorage.getItem(pendingKey),null);
    const payload=mergeLearningPayload(previous?.accountId===owner.accountId?previous.payload:null,localLearningPayload());
    const serialized=JSON.stringify({accountId:owner.accountId,payload});
    localStorage.setItem(pendingKey,serialized);
    if(!navigator.onLine)return{queued:true};
    return sendLearningQueue(owner,pendingKey,serialized);
  }
  async function flushPending(){if(ownedLearningHeld())return heldLearning();
    if(!navigator.onLine)return{skipped:true};
    const owner=syncSession();
    if(!owner)return{skipped:true};
    const ownedKey=`${KEYS.pending}:${owner.accountId}`,pendingKey=localStorage.getItem(ownedKey)?ownedKey:KEYS.pending;
    try{return await sendLearningQueue(owner,pendingKey,localStorage.getItem(pendingKey))}
    catch(error){console.warn("Pending learning sync failed",error);return{queued:true,error:error.code||"sync_failed"}}
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
  function scheduleLearningSync(){if(ownedLearningHeld())return heldLearning();clearTimeout(syncTimer);syncTimer=setTimeout(()=>syncLearning().catch(error=>console.warn("Institution learning sync failed",error)),1200)}
  function bind(){
    ensurePolish();setupMobileSidebar();mountUploadManagerLink();mountTimetableModule();mountSmartLearningRoute();
    addEventListener("online",flushPending);
    document.addEventListener("echs:learning-updated",scheduleLearningSync);
    window.addEventListener("echs:learning-attempt",scheduleLearningSync);
    window.addEventListener("echs:learning-session",scheduleLearningSync);
    window.addEventListener("echs:lesson-completed",scheduleLearningSync);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bind,{once:true});else bind();

  observeSession("bootstrap",false,false);
  window.addEventListener("storage",event=>{if(event.key===null||[KEYS.token,KEYS.account,KEYS.expires].includes(event.key))observeSession("storage",true)});
  window.addEventListener("focus",()=>{observeSession("focus");if(mePromise?.settled)mePromise=null});
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState!=="hidden"){observeSession("visibility");if(mePromise?.settled)mePromise=null}});
  window.ECHSInstitution={ROOT:ROOT.href,root,config,api,login,logout,me,requireAuth,account,token,setSession,clearSession,roleHome,mountIdentity,mountUploadManagerLink,learningPayload:localLearningPayload,syncLearning,flushPending,initials,ownerAuthority};
})();
