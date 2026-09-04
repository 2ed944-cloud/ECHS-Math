const VERSION = "echs-platform-school-control-v3-hybrid2-mastery1-recovery1-calculus-only-practice-routing-redesign-ib-lesson-query-premium-practice-20260802-fullwidth-filter-drawer2-landing-layout1-unit-collapse1-tangent-logo-collapse2-bank-export1-dynamic-calculus-banks1-multi-route-timetable2-lesson-portal-calm2-multicourse-banks1-ib-ai-1-1-local-ti84-v68-design-v51-ib-ai-u6-61-v1-lesson-visibility-progression-20260830-v1-platform-resilience-20260904-ap-calculus-11-interactive-v1-ap-calculus-12-interactive-v1";
// Practice assignment studio assets are versioned with the authenticated shell.
const STATIC_CACHE = `${VERSION}-static`;
const RUNTIME_CACHE = `${VERSION}-runtime`;
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
const AUTH_DOCUMENT = /\/(?:login\.html|question-bank\/(?:admin|school-control|teacher|student|parent)\.html|question-bank\/official\/admin\/(?:question-trust|private-bank-center|upload-manager)\.html)$/i;
const AUTH_ASSET = /\/(?:css\/(?:institution[^/]*|admin-executive-v4|echs-design-system-v5-1|learning-access|ib-lesson-platform-integration|gamification|mastery-evidence|unit-practice-unlock|smart-learning-route)\.css|js\/(?:institution[^/]*|login|portal-access|lesson-access-guard|ib-lesson-platform-integration|gamification-overlay|unit-practice-unlock|smart-learning-route)\.js|question-bank\/css\/(?:teacher-assignment-studio|lesson-visibility-controls|institution-timetable|practice-scope-access|practice-recovery-polish|practice-executive-v4)\.css|question-bank\/js\/(?:bank|practice-global-bridge|practice-course-isolation|mapped-practice|practice-single-bank|practice-builder|practice-recovery-ui|admin-accounts|student-cloud|teacher-cloud|institution-timetable|teacher-evidence-heatmap|parent-cloud|role-entry|private-bank-assets|mapped-private-bank-practice)\.js|question-bank\/official\/admin\/(?:css\/upload-manager\.css|js\/(?:question-trust|private-bank-center|upload-manager)\.js))$/i;
const FRESH_COURSE_ASSET = /\/(?:data\/[^/]+\.js|js\/(?:portal|platform-foundation|lesson-portal-overhaul|lesson-learning-bridge|login|institution-client)\.js|css\/platform-usability\.css)$/i;
const privateApi = /\/functions\/v1\/(?:account-api|institution-api|learning-sync|mastery-evidence|private-bank-api|practice-bank-api|upload-manager-api|setup-api|login-diagnostics)(?:\/|$)/i;
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
async function networkFirst(request,fallbackUrl,{reload=false}={}){
  const cache=await caches.open(RUNTIME_CACHE);
  try{const response=await(reload?navigationFetch(request):fetch(request));await saveResponse(cache,request,response);return response}
  catch{return(await cache.match(request))||(await caches.match(request))||(fallbackUrl?await caches.match(fallbackUrl):null)||Response.error()}
}
async function freshAuthDocument(request){
  const cache=await caches.open(RUNTIME_CACHE);
  try{const response=await navigationFetch(request);if(!await validAuthShell(response))throw new Error("Invalid authenticated shell response");await saveResponse(cache,request,response);return response}
  catch{const cached=(await cache.match(request))||(await caches.match(request));if(cached&&await validAuthShell(cached))return cached;return(await caches.match("./offline.html"))||Response.error()}
}
async function staleWhileRevalidate(request,event){
  const cache=await caches.open(RUNTIME_CACHE),cached=await cache.match(request)||await caches.match(request);
  const network=fetch(request).then(async response=>{await saveResponse(cache,request,response);return response}).catch(()=>cached||Response.error());
  // Keep the worker alive until an updated asset has actually been stored.
  event.waitUntil(network.then(()=>{}));
  return cached||network;
}
const REQUIRED_SHELL=["./offline.html","./login.html","./js/institution-client.js","./js/login.js","./css/platform-usability.css"];
self.addEventListener("install",event=>{event.waitUntil((async()=>{
  const cache=await caches.open(STATIC_CACHE);
  const shellRequest=url=>new Request(new URL(url,self.location.href),{cache:"reload"});
  await cache.addAll(REQUIRED_SHELL.map(shellRequest));
  // A missing optional lesson asset must not strand everyone on an old release.
  await Promise.allSettled(SHELL.filter(url=>!REQUIRED_SHELL.includes(url)).map(url=>cache.add(shellRequest(url))));
  await self.skipWaiting();
})())});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith("echs-")&&![STATIC_CACHE,RUNTIME_CACHE].includes(key)).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",event=>{
  const request=event.request;if(request.method!=="GET")return;
  const url=new URL(request.url),sameOrigin=url.origin===self.location.origin;
  const sensitive=request.headers.has("authorization")||privateApi.test(url.pathname)||/\.supabase\.co$/i.test(url.hostname)||[...url.searchParams.keys()].some(key=>/^(?:token|access_token|refresh_token|signature|apikey)$/i.test(key));
  if(sensitive){event.respondWith(fetch(request,{cache:"no-store"}));return}
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
