/* ECHS Mathematics Platform Foundation — Phase 2 */
(function(){
  "use strict";
  const script=document.currentScript;
  const ROOT=script?new URL("../",script.src):new URL("./",location.href);
  const STORE={theme:"echs_platform_theme",bookmarks:"echs_math_bookmarks",completed:"echs_math_complete",attempts:"echs_qbank_attempts_v20"};
  const qs=(selector,root=document)=>root.querySelector(selector),qsa=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const safeJSON=(value,fallback)=>{try{const parsed=JSON.parse(value);return parsed??fallback}catch{return fallback}};
  const rootLink=(path="")=>new URL(path,ROOT).href;

  function preferredTheme(){const saved=localStorage.getItem(STORE.theme);if(saved==="light"||saved==="dark")return saved;return matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}
  function setTheme(theme){document.documentElement.dataset.theme=theme;localStorage.setItem(STORE.theme,theme);qsa("[data-platform-theme]").forEach(button=>{button.textContent=theme==="dark"?"☀":"☾";button.title=theme==="dark"?"Use light appearance":"Use dark appearance";button.setAttribute("aria-label",button.title);});}
  setTheme(preferredTheme());

  function toast(message,actionLabel,action){
    let node=qs(".platformToast");if(!node){node=document.createElement("div");node.className="platformToast";node.setAttribute("role","status");document.body.append(node);}
    node.textContent=message;
    if(actionLabel&&action){const button=document.createElement("button");button.type="button";button.textContent=actionLabel;button.addEventListener("click",action,{once:true});node.append(button);}
    requestAnimationFrame(()=>node.classList.add("show"));clearTimeout(node._hideTimer);node._hideTimer=setTimeout(()=>node.classList.remove("show"),6500);
  }
  function navigationHTML(){
    const path=location.pathname,active=target=>path.endsWith(target)||path.endsWith(target+"/");
    return`<nav class="platformNav" id="platformNav" aria-label="Platform navigation">
      <a href="${rootLink("index.html")}" ${active("ECHS-Math/")||active("index.html")?'aria-current="page"':""}>Lessons</a>
      <a href="${rootLink("question-bank/index.html")}" ${active("question-bank/index.html")?'aria-current="page"':""}>Learning</a>
      <a href="${rootLink("question-bank/practice.html")}" ${active("question-bank/practice.html")?'aria-current="page"':""}>Practice</a>
      <a href="${rootLink("question-bank/mistakes.html")}" ${active("question-bank/mistakes.html")?'aria-current="page"':""}>Review</a>
      <a href="${rootLink("question-bank/dashboard.html")}" ${active("question-bank/dashboard.html")?'aria-current="page"':""}>Student</a>
      <a href="${rootLink("question-bank/official/index.html")}" ${path.includes("/question-bank/official/")?'aria-current="page"':""}>Official AP</a>
    </nav>`;
  }
  function enhanceHeader(){
    const header=qs("header.site")||qs(".siteHeader");if(!header)return;
    const top=qs(".top",header)||header;let nav=qs(".platformNav",header);
    if(!nav){const oldNav=qs("nav",header);if(oldNav)oldNav.classList.add("platformNav");else top.insertAdjacentHTML("beforeend",navigationHTML());nav=qs(".platformNav",header);}
    let actions=qs(".platformHeaderActions",header);if(!actions){actions=document.createElement("div");actions.className="platformHeaderActions";top.append(actions);}
    if(!qs("[data-platform-status]",actions))actions.insertAdjacentHTML("beforeend",'<span class="platformStatus" data-platform-status>Online</span>');
    if(!qs("[data-platform-install]",actions))actions.insertAdjacentHTML("beforeend",'<button class="platformIconButton" type="button" data-platform-install hidden title="Install ECHS Mathematics" aria-label="Install ECHS Mathematics">⇩</button>');
    if(!qs("[data-platform-theme]",actions))actions.insertAdjacentHTML("beforeend",'<button class="platformIconButton" type="button" data-platform-theme title="Change appearance" aria-label="Change appearance">☾</button>');
    if(!qs("[data-platform-menu]",actions))actions.insertAdjacentHTML("beforeend",'<button class="platformIconButton platformMenuButton" type="button" data-platform-menu aria-controls="platformNav" aria-expanded="false" title="Open navigation" aria-label="Open navigation">☰</button>');
    setTheme(document.documentElement.dataset.theme||preferredTheme());
    qsa("[data-platform-theme]").forEach(button=>button.addEventListener("click",()=>setTheme(document.documentElement.dataset.theme==="dark"?"light":"dark")));
    qsa("[data-platform-menu]").forEach(button=>button.addEventListener("click",()=>{const target=qs(".platformNav",header),open=target?.classList.toggle("open");button.setAttribute("aria-expanded",String(Boolean(open)));}));
  }
  function addPageBand(){
    if(qs(".platformPageBand")||!document.body.classList.contains("practiceStudio"))return;
    const main=qs("main");if(!main)return;
    const band=document.createElement("div");band.className="platformPageBand";band.innerHTML=`<strong>ECHS Mathematics Platform</strong><div class="platformPageBandNav"><a href="${rootLink("index.html")}">Lessons</a><a href="${rootLink("question-bank/index.html")}">Learning</a><a href="${rootLink("question-bank/practice.html")}">Practice</a><a href="${rootLink("question-bank/mistakes.html")}">Review</a><a href="${rootLink("question-bank/dashboard.html")}">Student</a><a href="${rootLink("question-bank/teacher.html")}">Teacher</a><a href="${rootLink("question-bank/parent.html")}">Parent</a><a href="${rootLink("question-bank/official/index.html")}">Official AP</a></div>`;
    main.prepend(band);
  }
  function enhanceFooter(){
    const footer=qs("footer");if(!footer||qs(".platformPolicyLinks",footer))return;
    const nav=document.createElement("nav");nav.className="platformPolicyLinks";nav.setAttribute("aria-label","Platform policies");nav.innerHTML=`<a href="${rootLink("privacy.html")}">Privacy</a><a href="${rootLink("accessibility.html")}">Accessibility</a><a href="${rootLink("sources-and-rights.html")}">Sources and rights</a>`;footer.append(nav);
  }
  function ensureDiscoveryMetadata(){
    const noIndex=/\/(?:offline|dashboard|teacher|parent|mistakes)\.html$/i.test(location.pathname);
    if(noIndex&&!qs('meta[name="robots"]')){const robots=document.createElement("meta");robots.name="robots";robots.content="noindex,follow";document.head.append(robots);}
    if(!noIndex&&!qs('link[rel="canonical"]')){const canonical=document.createElement("link");canonical.rel="canonical";canonical.href=`${location.origin}${location.pathname}`;document.head.append(canonical);}
  }
  function updateConnectivity(){const online=navigator.onLine;qsa("[data-platform-status]").forEach(node=>{node.textContent=online?"Online":"Offline";node.classList.toggle("offline",!online);});if(!online)toast("You are offline. Previously cached learning pages remain available.");}
  let installPrompt=null;
  function configureInstall(){
    addEventListener("beforeinstallprompt",event=>{event.preventDefault();installPrompt=event;qsa("[data-platform-install]").forEach(button=>button.hidden=false);});
    qsa("[data-platform-install]").forEach(button=>button.addEventListener("click",async()=>{if(!installPrompt)return;installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;button.hidden=true;}));
    addEventListener("appinstalled",()=>toast("ECHS Mathematics was installed successfully."));
  }
  async function registerServiceWorker(){
    if(!("serviceWorker" in navigator)||location.protocol==="file:")return;
    try{const registration=await navigator.serviceWorker.register(rootLink("sw.js"),{scope:new URL("./",ROOT).pathname});registration.addEventListener("updatefound",()=>{const worker=registration.installing;if(!worker)return;worker.addEventListener("statechange",()=>{if(worker.state==="installed"&&navigator.serviceWorker.controller)toast("A new platform version is ready.","Reload",()=>location.reload());});});}catch(error){console.warn("ECHS service worker registration failed",error);}
  }
  async function loadBankSnapshot(){
    const targets=qsa("[data-platform-bank-snapshot]");if(!targets.length&&!qs("#statQuestions"))return;
    try{
      const [catalogResponse,addonResponse]=await Promise.all([fetch(rootLink("question-bank/data/catalog.json")),fetch(rootLink("question-bank/data/blackboard-addon.json"))]);
      const catalog=catalogResponse.ok?await catalogResponse.json():{banks:[]},addon=addonResponse.ok?await addonResponse.json():{banks:[]};
      const banks=new Map();[...(catalog.banks||[]),...(addon.banks||[])].forEach(bank=>banks.set(bank.code,bank));
      const bankRows=[...banks.values()],total=bankRows.reduce((sum,bank)=>sum+(Number(bank.question_count)||0),0),precalc=bankRows.filter(bank=>["PCALRT5S","CAF5S"].includes(bank.code)).reduce((sum,bank)=>sum+(Number(bank.question_count)||0),0),calc=bankRows.filter(bank=>/CALC|ADAMS|PEARSON_CH0/.test(bank.code)).reduce((sum,bank)=>sum+(Number(bank.question_count)||0),0);
      const stat=qs("#statQuestions");if(stat)stat.textContent=total.toLocaleString();
      targets.forEach(target=>target.innerHTML=`<div class="platformInventoryItem"><b>${total.toLocaleString()}</b><span>publisher questions</span></div><div class="platformInventoryItem"><b>${bankRows.length}</b><span>source collections</span></div><div class="platformInventoryItem"><b>${precalc.toLocaleString()}</b><span>Precalculus questions</span></div><div class="platformInventoryItem"><b>${calc.toLocaleString()}</b><span>Calculus questions</span></div>`);
    }catch(error){console.warn("Could not load platform bank snapshot",error);}
  }
  function populateLearningSnapshot(){
    const target=qs("[data-platform-learning-snapshot]");
    if(window.ECHSLearning){
      const summary=ECHSLearning.summary(),cont=ECHSLearning.getContinue(),profile=ECHSLearning.profile(),plan=ECHSLearning.dailyPlan();
      if(target)target.innerHTML=`<span class="platformTileLabel">Continue learning</span><h2>${cont?ECHSLearning.escapeHTML(cont.label||"Resume your activity"):`${ECHSLearning.escapeHTML(profile.name||"Student")}, your plan is ready`}</h2><p>${summary.streak}-day streak · ${summary.due} due review${summary.due===1?"":"s"} · ${summary.mastered} mastered topic${summary.mastered===1?"":"s"} · ${plan.progress}% of today's goal</p><a class="platformTileAction" href="${cont?.url?ECHSLearning.escapeHTML(cont.url):rootLink("question-bank/dashboard.html")}">${cont?"Resume":"Open dashboard"}</a>`;
      qsa("[data-platform-attempts]").forEach(node=>node.textContent=summary.attempts.toLocaleString());qsa("[data-platform-mastered]").forEach(node=>node.textContent=summary.mastered.toLocaleString());qsa("[data-platform-due]").forEach(node=>node.textContent=summary.due.toLocaleString());
    }else{
      const bookmarks=safeJSON(localStorage.getItem(STORE.bookmarks),[]),completed=safeJSON(localStorage.getItem(STORE.completed),[]),attempts=safeJSON(localStorage.getItem(STORE.attempts),[]),correct=attempts.filter(item=>item&&item.correct).length,accuracy=attempts.length?Math.round(correct/attempts.length*100):0;
      if(target)target.innerHTML=`<span class="platformTileLabel">Continue learning</span><h2>${completed.length?`${completed.length} lessons completed`:"Your learning pathway is ready"}</h2><p>${bookmarks.length} bookmarked lessons · ${attempts.length} responses${attempts.length?` · ${accuracy}% accuracy`:""}</p><a class="platformTileAction" href="${rootLink("question-bank/dashboard.html")}">Open dashboard</a>`;
    }
    const bookmarks=safeJSON(localStorage.getItem(STORE.bookmarks),[]),completed=safeJSON(localStorage.getItem(STORE.completed),[]);
    qsa("[data-platform-bookmarks]").forEach(node=>node.textContent=bookmarks.length.toLocaleString());qsa("[data-platform-completed]").forEach(node=>node.textContent=completed.length.toLocaleString());
  }
  function keyboardShortcuts(event){
    const tag=document.activeElement?.tagName;if(event.key==="/"&&!/INPUT|TEXTAREA|SELECT/.test(tag||"")){const search=qs("#search");if(search){event.preventDefault();search.focus();}}
    if(event.altKey&&event.key.toLowerCase()==="p")location.href=rootLink("question-bank/practice.html");
    if(event.altKey&&event.key.toLowerCase()==="d")location.href=rootLink("question-bank/dashboard.html");
    if(event.altKey&&event.key.toLowerCase()==="r")location.href=rootLink("question-bank/mistakes.html");
  }
  function init(){enhanceHeader();addPageBand();enhanceFooter();ensureDiscoveryMetadata();updateConnectivity();configureInstall();populateLearningSnapshot();loadBankSnapshot();registerServiceWorker();addEventListener("online",updateConnectivity);addEventListener("offline",updateConnectivity);addEventListener("keydown",keyboardShortcuts);}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
  window.ECHSPlatform={ROOT:ROOT.href,setTheme,toast,loadBankSnapshot,populateLearningSnapshot};
})();