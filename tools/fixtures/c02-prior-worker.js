const VERSION = "echs-platform-school-control-v3-hybrid2-mastery1-recovery1-calculus-only-practice-routing-redesign-ib-lesson-query-premium-practice-20260802-fullwidth-filter-drawer2-landing-layout1-unit-collapse1-tangent-logo-collapse2-bank-export1-dynamic-calculus-banks1-multi-route-timetable2-lesson-portal-calm2-multicourse-banks1-ib-ai-1-1-local-ti84-v68-design-v51-ib-ai-u6-61-v1-lesson-visibility-progression-20260830-v1-platform-resilience-20260904-ap-calculus-11-interactive-v1-ap-calculus-12-interactive-v1-ap-calculus-13-14-interactive-v1-ap-calculus-16-interactive-v1-ap-calculus-15-interactive-v1-ap-calculus-15-ap-scope-v2-ib-ai-11-16-merged-v7-ap-precalculus-11-ap-scope-v3-ap-precalculus-12-ap-scope-v3-ib-ai-14-17-finance-v8-ap-precalculus11-heading-focus-v1-ap-precalculus11-context-practice-v4-ap-calculus-midunit-v1-midunit-batch2-midunit-batch3-ib-ai-12-sl-alignment-v7-ap-calculus-17-116-ab1-owned-sync-v1-lesson-content-009-v2-lesson-media-010-v1-lesson-recovery-011-v1-lesson-history-012-v1-lesson-presentation-013-v1-ib-reference-import-014-v1-public-question-boundary-c01-v1";
// Practice assignment studio assets are versioned with the authenticated shell.
const STATIC_CACHE = `${VERSION}-static`;
const RUNTIME_CACHE = `${VERSION}-runtime`;
// Exact reviewed build output. This metadata is public and contains paths only.
// A valid cached copy with this same pin supports already-approved media offline.
const PUBLIC_QUESTION_BOUNDARY_SHA256 = "c4fcdce623c44155185719ab4612045a5f3ef7fd1b979a7019c3e68655b13069";
const PUBLIC_QUESTION_BOUNDARY_URL = new URL("./question-bank/official/data/student/publication-boundary.json",self.location.href).href;
const PUBLIC_SITE_PATH = new URL("./",self.location.href).pathname;
const PUBLIC_STUDENT_FILES = new Set([
  "archive-id-map.json","archive-index.json","catalog.json","gate.json","id-map.json","media-manifest.json","question-index.json","publication-boundary.json",
  ...Array.from({length:16},(_,index)=>`questions/chunk-${String(index).padStart(3,"0")}.json`),
  ...Array.from({length:21},(_,index)=>`archive-questions/chunk-${String(index).padStart(3,"0")}.json`)
]);
const PUBLIC_RIGHTS_FILES = new Set(["README.md","echs-ap-official-student-practice-2026-07-28.json"]);
let publicMediaBoundaryPromise=null;
let publicMediaBoundaryRetryAt=0;
async function readPublicMediaBoundary(response){
  if(!response?.ok||!/^application\/json(?:\s*;|$)/i.test(response.headers.get("content-type")||""))return null;
  const reader=response.body?.getReader();if(!reader)return null;
  const chunks=[];let size=0,timedOut=false,timer;
  const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{timedOut=true;reader.cancel().catch(()=>{});reject(new Error("Boundary read timed out"))},3000)});
  try{
    while(true){const part=await Promise.race([reader.read(),deadline]);if(timedOut)return null;if(part.done)break;size+=part.value.byteLength;if(size>262144){reader.cancel().catch(()=>{});return null}chunks.push(part.value)}
    const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength}
    const hash=[...new Uint8Array(await crypto.subtle.digest("SHA-256",bytes))].map(x=>x.toString(16).padStart(2,"0")).join("");
    if(hash!==PUBLIC_QUESTION_BOUNDARY_SHA256)return null;
    const value=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(bytes));
    if(!value||Object.keys(value).sort().join(",")!=="contract,counts,media"||value.contract!=="echs.public-question-boundary.v1")return null;
    const counts=value.counts,expected={student_ready:1104,archive_records:1217,restricted_archive:113,direct_media:1193,media_files:1277};
    if(!counts||Object.keys(counts).sort().join(",")!==Object.keys(expected).sort().join(",")||Object.keys(expected).some(key=>counts[key]!==expected[key]))return null;
    if(!Array.isArray(value.media)||value.media.length!==1277)return null;
    let previous="";for(const path of value.media){if(typeof path!=="string"||path.length>512||!/^media\/(?:[A-Za-z0-9_.-]+\/)*[A-Za-z0-9_.-]+\.(?:svg|png|jpe?g|webp)$/.test(path)||path.split("/").some(x=>x==="."||x==="..")||path<=previous)return null;previous=path}
    return new Set(value.media);
  }catch{return null}finally{clearTimeout(timer);reader.releaseLock()}
}
async function loadPublicMediaBoundary(){
  if(publicMediaBoundaryPromise)return publicMediaBoundaryPromise;
  if(Date.now()<publicMediaBoundaryRetryAt)return null;
  publicMediaBoundaryPromise=(async()=>{
    const cache=await caches.open(STATIC_CACHE);let response;const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),4000);
    try{response=await fetch(PUBLIC_QUESTION_BOUNDARY_URL,{cache:"no-store",credentials:"omit",redirect:"error",signal:controller.signal})}
    catch{const cached=await cache.match(PUBLIC_QUESTION_BOUNDARY_URL);return cached?readPublicMediaBoundary(cached):null}
    finally{clearTimeout(timer)}
    // An HTTP error or malformed online response never falls back to old data.
    const approved=await readPublicMediaBoundary(response.clone());
    if(approved)try{await cache.put(PUBLIC_QUESTION_BOUNDARY_URL,response)}catch{/* Approval stays in memory if storage is unavailable. */}
    else response.body?.cancel().catch(()=>{});
    return approved;
  })().catch(()=>null).then(value=>{if(!value){publicMediaBoundaryRetryAt=Date.now()+5000;publicMediaBoundaryPromise=null}return value});
  return publicMediaBoundaryPromise;
}
function publicQuestionPath(url){
  if(url.origin!==self.location.origin)return null;
  let decoded;try{decoded=decodeURIComponent(url.pathname)}catch{return /question-bank|\.staging|packages|\.deploy|\.echs-backups|artifacts/i.test(url.pathname)?{path:"",noncanonical:true}:null}
  const scoped=decoded.replace(/\\/g,"/");
  if(!scoped.startsWith(PUBLIC_SITE_PATH))return null;
  const path=scoped.slice(PUBLIC_SITE_PATH.length);
  if(!/^(?:question-bank\/official\/|\.staging(?:\/|$)|packages(?:\/|$)|\.deploy(?:\/|$)|\.echs-backups(?:\/|$)|artifacts(?:\/|$))/.test(path))return null;
  return {path,noncanonical:decoded!==url.pathname||scoped!==decoded||path.split("/").some(x=>x==="."||x==="..")};
}
function deniedPublicQuestionPath(url,media){
  const info=publicQuestionPath(url);if(!info)return false;
  const {path,noncanonical}=info;if(noncanonical)return true;
  if(/^(?:\.staging|packages|\.deploy|\.echs-backups|artifacts)(?:\/|$)/.test(path))return true;
  const relative=path.slice("question-bank/official/".length);
  if(relative.startsWith("media/"))return Boolean(url.search)||!media?.has(relative);
  if(relative.startsWith("admin/data/"))return relative!=="admin/data/question-trust-manifest.json";
  if(relative.startsWith("data/student/"))return !PUBLIC_STUDENT_FILES.has(relative.slice("data/student/".length));
  if(relative.startsWith("data/rights/"))return !PUBLIC_RIGHTS_FILES.has(relative.slice("data/rights/".length));
  if(relative.startsWith("data/"))return true;
  return false;
}
function changedPublicProjectionPath(url){
  const info=publicQuestionPath(url);if(!info)return false;
  return /^question-bank\/official\/(?:admin\/(?:teacher|import)\.html|data\/student\/(?:archive-index\.json|archive-questions\/chunk-\d{3}\.json))$/.test(info.path);
}
async function purgeDeniedPublicQuestionCache(){
  const approved=await loadPublicMediaBoundary();
  for(const name of await caches.keys()){
    const cache=await caches.open(name);
    for(const request of await cache.keys()){const url=new URL(request.url);if(deniedPublicQuestionPath(url,approved)||changedPublicProjectionPath(url))await cache.delete(request)}
  }
}
const SHELL = [
  "./","./index.html","./offline.html","./manifest.json","./login.html","./config/institution.json",
  "./css/platform-usability.css","./css/portal.css","./css/lesson-portal-overhaul.css","./css/practice-integration.css","./css/official-ap-integration.css","./css/platform-foundation.css","./css/institution.css","./css/institution-polish.css","./css/institution-premium.css","./css/institution-responsive.css","./css/institution-completion.css","./css/learning-access.css","./css/ib-lesson-platform-integration.css","./css/gamification.css","./css/landing-premium.css","./css/platform-executive-v4.css","./css/echs-design-system-v5-1.css","./css/admin-executive-v4.css","./css/landing-calculus-motion.css","./css/mastery-evidence.css","./css/unit-practice-unlock.css","./css/smart-learning-route.css",
  "./data/courses.js","./data/ap-calculus-update.js","./data/ap-precalculus-update.js","./data/ib-math-ai-lesson-catalog.json","./data/knowledge-graph/schema-v1.json","./data/knowledge-graph/ap-calculus-unit-1.json","./data/knowledge-graph/ap-precalculus-v1.json","./data/knowledge-graph/ib-math-ai-v1.json",
  "./js/portal.js","./js/lesson-portal-overhaul.js","./js/preview-portal-access.js","./js/practice-integration.js","./js/official-ap-integration.js","./js/platform-foundation.js","./js/lesson-learning-bridge.js","./js/institution-client.js","./js/institution-experience.js","./js/institution-completion.js","./js/institution-portal.js","./js/institution-mastery-evidence.js","./js/landing-hybrid-hero.js","./js/login.js","./js/portal-access.js","./js/lesson-access-guard.js","./js/ib-lesson-platform-integration.js","./js/gamification-overlay.js","./js/unit-practice-unlock.js","./js/smart-learning-route.js",
  "./question-bank/index.html","./question-bank/practice.html","./question-bank/exam.html","./question-bank/dashboard.html","./question-bank/mistakes.html","./question-bank/student.html","./question-bank/teacher.html","./question-bank/parent.html","./question-bank/admin.html","./question-bank/school-control.html","./question-bank/official/admin/question-trust.html","./question-bank/official/admin/private-bank-center.html","./question-bank/official/admin/upload-manager.html",
  "./question-bank/css/bank.css","./question-bank/css/teacher-assignment-studio.css","./question-bank/css/lesson-visibility-controls.css","./question-bank/css/institution-timetable.css","./question-bank/css/practice-studio.css","./question-bank/css/practice-premium.css","./question-bank/css/practice-executive-v4.css","./question-bank/css/practice-builder-compact.css","./question-bank/css/practice-scope-access.css","./question-bank/css/practice-recovery-polish.css","./question-bank/css/learning-system.css","./question-bank/official/admin/css/upload-manager.css",
  "./question-bank/js/learning-system.js","./question-bank/js/sync-adapter.js","./question-bank/js/bank.js","./question-bank/js/practice-global-bridge.js","./question-bank/js/practice-course-isolation.js","./question-bank/js/private-bank-assets.js","./question-bank/js/mapped-private-bank-practice.js","./question-bank/js/learning-home.js","./question-bank/js/mapped-practice.js","./question-bank/js/practice-single-bank.js","./question-bank/js/practice-builder.js","./question-bank/js/practice-recovery-ui.js","./question-bank/js/exam.js","./question-bank/js/dashboard.js","./question-bank/js/mistakes.js","./question-bank/js/student-cloud.js","./question-bank/js/teacher-cloud.js","./question-bank/js/institution-timetable.js","./question-bank/js/teacher-evidence-heatmap.js","./question-bank/js/parent-cloud.js","./question-bank/js/admin-accounts.js","./question-bank/js/role-entry.js","./question-bank/official/admin/js/question-trust.js","./question-bank/official/admin/js/private-bank-center.js","./question-bank/official/admin/js/upload-manager.js",
  "./question-bank/data/catalog.json","./question-bank/data/blackboard-addon.json","./question-bank/data/course-routing.json","./question-bank/official/admin/data/question-trust-manifest.json","./question-bank/private-sources/data/private-bank-registry.json",
  "./assets/echs_logo.png","./assets/icon-192.png","./assets/icon-512.png"
];
const AUTH_DOCUMENT = /\/(?:login\.html|lesson-studio\.html|question-bank\/(?:admin|school-control|teacher|student|parent)\.html|question-bank\/official\/admin\/(?:question-trust|private-bank-center|upload-manager)\.html)$/i;
const AUTH_ASSET = /\/(?:js\/(?:lesson-studio|lesson-runtime)\/(?:[^/]+\/)*[^/]+\.mjs|css\/(?:lesson-studio|lesson-media|lesson-document|lesson-presentation|lesson-import)\.css|css\/(?:institution[^/]*|admin-executive-v4|echs-design-system-v5-1|learning-access|ib-lesson-platform-integration|gamification|mastery-evidence|unit-practice-unlock|smart-learning-route)\.css|js\/(?:institution[^/]*|login|portal-access|lesson-access-guard|ib-lesson-platform-integration|gamification-overlay|unit-practice-unlock|smart-learning-route)\.js|question-bank\/css\/(?:teacher-assignment-studio|lesson-visibility-controls|institution-timetable|practice-scope-access|practice-recovery-polish|practice-executive-v4)\.css|question-bank\/js\/(?:bank|practice-global-bridge|practice-course-isolation|mapped-practice|practice-single-bank|practice-builder|practice-recovery-ui|admin-accounts|student-cloud|teacher-cloud|institution-timetable|teacher-evidence-heatmap|parent-cloud|role-entry|private-bank-assets|mapped-private-bank-practice)\.js|question-bank\/official\/admin\/(?:css\/upload-manager\.css|js\/(?:question-trust|private-bank-center|upload-manager)\.js))$/i;
const FRESH_COURSE_ASSET = /\/(?:data\/[^/]+\.js|js\/(?:portal|platform-foundation|lesson-portal-overhaul|lesson-learning-bridge|login|institution-client)\.js|css\/platform-usability\.css)$/i;
const privateApi = /\/functions\/v1\/(?:lesson-api|account-api|institution-api|learning-sync|mastery-evidence|private-bank-api|practice-bank-api|upload-manager-api|setup-api|login-diagnostics)(?:\/|$)/i;
function reloadRequest(request){return new Request(request,{cache:"reload"});}
async function validAuthShell(response){if(!response||!response.ok)return false;const type=response.headers.get("content-type")||"";if(!type.includes("text/html"))return false;const text=await response.clone().text();return text.length>1500&&/<!doctype html/i.test(text)&&/<body\b/i.test(text)&&/institutionBody/.test(text);}
function cacheable(request,response){
  return request.method==="GET"&&!request.headers.has("authorization")&&response?.ok&&response.type!=="opaque"&&!/no-store|private/i.test(response.headers.get("cache-control")||"");
}
async function saveResponse(cache,request,response){
  if(cacheable(request,response))try{await cache.put(request,response.clone())}catch{/* Storage pressure must not block learning. */}
}
async function navigationFetch(request){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
  try{return await fetch(reloadRequest(request),{signal:controller.signal})}finally{clearTimeout(timer)}
}
async function networkFirst(request,fallbackUrl,{reload=false,currentOnly=false}={}){
  const cache=await caches.open(RUNTIME_CACHE);
  try{const response=await(reload?navigationFetch(request):fetch(request));await saveResponse(cache,request,response);return response}
  catch{return(await cache.match(request))||(!currentOnly?await caches.match(request):null)||(fallbackUrl?await caches.match(fallbackUrl):null)||Response.error()}
}
async function freshAuthDocument(request){
  const cache=await caches.open(RUNTIME_CACHE);
  try{const response=await navigationFetch(request);if(!await validAuthShell(response))throw new Error("Invalid authenticated shell response");await saveResponse(cache,request,response);return response}
  catch{const cached=(await cache.match(request))||(await caches.match(request));if(cached&&await validAuthShell(cached))return cached;return(await caches.match("./offline.html"))||Response.error()}
}
async function staleWhileRevalidate(request,event,{currentOnly=false}={}){
  const cache=await caches.open(RUNTIME_CACHE),cached=await cache.match(request)||(!currentOnly?await caches.match(request):null);
  const network=fetch(request).then(async response=>{await saveResponse(cache,request,response);return response}).catch(()=>cached||Response.error());
  // Keep the worker alive until an updated asset has actually been stored.
  event.waitUntil(network.then(()=>{}));
  return cached||network;
}
const REQUIRED_SHELL=["./offline.html","./login.html","./js/institution-client.js","./js/login.js","./css/platform-usability.css"];
const OPTIONAL_SHELL_TIMEOUT_MS=4000;
async function precacheOptionalShell(cache,requests){
  const controller=new AbortController();let stopped=false,timer;
  const deadline=new Promise(resolve=>{timer=setTimeout(()=>{stopped=true;controller.abort();resolve()},OPTIONAL_SHELL_TIMEOUT_MS)});
  const work=Promise.allSettled(requests.map(async request=>{
    let response;
    try{
      response=await fetch(request,{signal:controller.signal});
      if(stopped||!response.ok){response.body?.cancel().catch(()=>{});return}
      await cache.put(request,response);
    }catch{if(response?.body&&!response.body.locked)response.body.cancel().catch(()=>{})}
  }));
  // A stalled fetch, response body, or storage operation cannot hold install open.
  // Late responses are discarded; the fixed optional list contains public assets.
  try{await Promise.race([work,deadline])}finally{stopped=true;clearTimeout(timer);controller.abort()}
}
self.addEventListener("install",event=>{event.waitUntil((async()=>{
  const cache=await caches.open(STATIC_CACHE);
  const shellRequest=url=>new Request(new URL(url,self.location.href),{cache:"reload"});
  await cache.addAll(REQUIRED_SHELL.map(shellRequest));
  await loadPublicMediaBoundary();
  // A missing optional lesson asset must not strand everyone on an old release.
  await precacheOptionalShell(cache,SHELL.filter(url=>!REQUIRED_SHELL.includes(url)).map(shellRequest));
  await self.skipWaiting();
})())});
self.addEventListener("activate",event=>{event.waitUntil(purgeDeniedPublicQuestionCache().then(()=>caches.keys()).then(keys=>Promise.all(keys.filter(key=>key.startsWith("echs-")&&![STATIC_CACHE,RUNTIME_CACHE].includes(key)).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",event=>{
  const request=event.request;if(request.method!=="GET")return;
  const url=new URL(request.url),sameOrigin=url.origin===self.location.origin;
  const sensitive=request.headers.has("authorization")||privateApi.test(url.pathname)||/\.supabase\.co$/i.test(url.hostname)||[...url.searchParams.keys()].some(key=>/^(?:token|access_token|refresh_token|signature|apikey)$/i.test(key));
  if(sensitive){event.respondWith(fetch(request,{cache:"no-store"}));return}
  const official=publicQuestionPath(url);
  if(official&&(official.noncanonical||changedPublicProjectionPath(url)||/^(?:question-bank\/official\/(?:media|data|admin\/data)\/|\.staging(?:\/|$)|packages(?:\/|$)|\.deploy(?:\/|$)|\.echs-backups(?:\/|$)|artifacts(?:\/|$))/.test(official.path))){
    // Removed raw files and unapproved media must never use stale cache fallback.
    // Approved images retain the same runtime cache path and offline behavior.
    event.respondWith((async()=>{
      const media=official.path.startsWith("question-bank/official/media/")?await loadPublicMediaBoundary():null;
      if(deniedPublicQuestionPath(url,media))return fetch(request,{cache:"no-store"});
      if(official.path.startsWith("question-bank/official/media/"))return staleWhileRevalidate(request,event,{currentOnly:true});
      if(url.pathname.endsWith(".json")||changedPublicProjectionPath(url))return networkFirst(request,null,{reload:true,currentOnly:true});
      if(request.mode==="navigate")return networkFirst(request,"./offline.html",{reload:true,currentOnly:true});
      return staleWhileRevalidate(request,event,{currentOnly:true});
    })());return;
  }
  if(sameOrigin&&AUTH_DOCUMENT.test(url.pathname)){event.respondWith(freshAuthDocument(request));return}
  const setupPage=sameOrigin&&/\/setup\.html$/i.test(url.pathname);
  if(setupPage){event.respondWith(fetch(request,{cache:"no-store"}));return}
  if(request.mode==="navigate"){if(sameOrigin)event.respondWith(networkFirst(request,"./offline.html",{reload:true}));return}
  if(!sameOrigin){
    const publicCDN=["cdn.jsdelivr.net","cdnjs.cloudflare.com","fonts.googleapis.com","fonts.gstatic.com"].includes(url.hostname);
    if(publicCDN&&["style","script","image","font"].includes(request.destination))event.respondWith(staleWhileRevalidate(request,event));
    return;
  }
  const questionPayload=/\/question-bank\/data\/(?:imported|ap|courses)\//.test(url.pathname),isJson=url.pathname.endsWith(".json");
  if(questionPayload||isJson||AUTH_ASSET.test(url.pathname)||FRESH_COURSE_ASSET.test(url.pathname)){event.respondWith(networkFirst(request,null,{reload:true}));return}
  if(["style","script","image","font"].includes(request.destination)){event.respondWith(staleWhileRevalidate(request,event));return}
  event.respondWith(networkFirst(request));
});
self.addEventListener("message",event=>{if(event.data==="SKIP_WAITING"||event.data?.type==="SKIP_WAITING")self.skipWaiting();if(event.data?.type==="PURGE_AUTH_SHELL"){event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith("echs-")).map(key=>caches.delete(key)))))} });
