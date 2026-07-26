const VERSION = "echs-platform-auth-shell-v2";
const STATIC_CACHE = `${VERSION}-static`;
const RUNTIME_CACHE = `${VERSION}-runtime`;
const SHELL = [
  "./","./index.html","./offline.html","./manifest.json","./login.html","./config/institution.json",
  "./css/portal.css","./css/practice-integration.css","./css/official-ap-integration.css","./css/platform-foundation.css","./css/institution.css","./css/institution-polish.css","./css/institution-premium.css","./css/institution-responsive.css","./css/institution-completion.css",
  "./data/courses.js","./data/ap-calculus-update.js","./data/ap-precalculus-update.js",
  "./js/portal.js","./js/practice-integration.js","./js/official-ap-integration.js","./js/platform-foundation.js","./js/lesson-learning-bridge.js","./js/institution-client.js","./js/institution-experience.js","./js/institution-completion.js","./js/institution-portal.js","./js/login.js",
  "./question-bank/index.html","./question-bank/practice.html","./question-bank/exam.html","./question-bank/dashboard.html","./question-bank/mistakes.html","./question-bank/student.html","./question-bank/teacher.html","./question-bank/parent.html","./question-bank/admin.html",
  "./question-bank/css/bank.css","./question-bank/css/practice-studio.css","./question-bank/css/learning-system.css",
  "./question-bank/js/learning-system.js","./question-bank/js/sync-adapter.js","./question-bank/js/bank.js","./question-bank/js/learning-home.js","./question-bank/js/practice.js","./question-bank/js/exam.js","./question-bank/js/dashboard.js","./question-bank/js/mistakes.js","./question-bank/js/student-cloud.js","./question-bank/js/teacher-cloud.js","./question-bank/js/parent-cloud.js","./question-bank/js/admin-accounts.js",
  "./question-bank/data/catalog.json","./question-bank/data/blackboard-addon.json",
  "./assets/echs_logo.png","./assets/icon-192.png","./assets/icon-512.png"
];
const AUTH_DOCUMENT = /\/(?:login\.html|question-bank\/(?:admin|teacher|student|parent)\.html)$/i;
const AUTH_ASSET = /\/(?:css\/institution[^/]*\.css|js\/(?:institution[^/]*|login)\.js|question-bank\/js\/(?:admin-accounts|student-cloud|teacher-cloud|parent-cloud)\.js)$/i;
const PRIVATE_API = /\/functions\/v1\/(?:account-api|institution-api|learning-sync|setup-api|login-diagnostics)(?:\/|$)/i;

function reloadRequest(request){
  return new Request(request,{cache:"reload"});
}
async function validAuthShell(response){
  if(!response||!response.ok)return false;
  const type=response.headers.get("content-type")||"";
  if(!type.includes("text/html"))return false;
  const text=await response.clone().text();
  return text.length>1500&&/<!doctype html/i.test(text)&&/<body\b/i.test(text)&&/institutionBody/.test(text);
}
async function networkFirst(request,fallbackUrl,{reload=false}={}){
  const cache=await caches.open(RUNTIME_CACHE);
  try{
    const response=await fetch(reload?reloadRequest(request):request);
    if(response&&response.ok&&response.type!=="opaque")await cache.put(request,response.clone());
    return response;
  }catch(_error){
    return(await cache.match(request))||(await caches.match(request))||(fallbackUrl?await caches.match(fallbackUrl):Response.error());
  }
}
async function freshAuthDocument(request){
  const cache=await caches.open(RUNTIME_CACHE);
  try{
    const response=await fetch(reloadRequest(request));
    if(!await validAuthShell(response))throw new Error("Invalid authenticated shell response");
    await cache.put(request,response.clone());
    return response;
  }catch(_error){
    const cached=(await cache.match(request))||(await caches.match(request));
    if(cached&&await validAuthShell(cached))return cached;
    return(await caches.match("./offline.html"))||Response.error();
  }
}
async function staleWhileRevalidate(request){
  const cache=await caches.open(RUNTIME_CACHE),cached=await cache.match(request)||await caches.match(request);
  const network=fetch(request).then(response=>{
    if(response&&response.ok&&(response.type==="basic"||response.type==="cors"))cache.put(request,response.clone());
    return response;
  }).catch(()=>cached);
  return cached||network;
}

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(STATIC_CACHE)
    .then(cache=>cache.addAll(SHELL.map(url=>new Request(url,{cache:"reload"}))))
    .then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys()
    .then(keys=>Promise.all(keys.filter(key=>key.startsWith("echs-")&&![STATIC_CACHE,RUNTIME_CACHE].includes(key)).map(key=>caches.delete(key))))
    .then(()=>self.clients.claim()));
});
self.addEventListener("fetch",event=>{
  const request=event.request;
  if(request.method!=="GET")return;
  const url=new URL(request.url);
  const sameOrigin=url.origin===self.location.origin;
  if(sameOrigin&&AUTH_DOCUMENT.test(url.pathname)){
    event.respondWith(freshAuthDocument(request));
    return;
  }
  if(sameOrigin&&/\/setup\.html$/i.test(url.pathname)){
    event.respondWith(fetch(reloadRequest(request)));
    return;
  }
  if(request.mode==="navigate"){
    event.respondWith(networkFirst(request,"./offline.html",{reload:true}));
    return;
  }
  if(!sameOrigin){
    if(PRIVATE_API.test(url.pathname)){
      event.respondWith(fetch(request));
      return;
    }
    event.respondWith(staleWhileRevalidate(request));
    return;
  }
  const questionPayload=/\/question-bank\/data\/(?:imported|ap|courses)\//.test(url.pathname);
  const isJson=url.pathname.endsWith(".json");
  if(questionPayload||isJson){
    event.respondWith(networkFirst(request,null,{reload:true}));
    return;
  }
  if(AUTH_ASSET.test(url.pathname)){
    event.respondWith(networkFirst(request,null,{reload:true}));
    return;
  }
  if(["style","script","image","font"].includes(request.destination)){
    event.respondWith(staleWhileRevalidate(request));
    return;
  }
  event.respondWith(networkFirst(request));
});
self.addEventListener("message",event=>{
  if(event.data==="SKIP_WAITING"||event.data?.type==="SKIP_WAITING")self.skipWaiting();
  if(event.data?.type==="PURGE_AUTH_SHELL"){
    event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith("echs-")).map(key=>caches.delete(key)))));
  }
});