(function(){
'use strict';
const R=window.U411_RUNTIME;if(!R||!R.mountLab||!R.simulator)return;
const {data,$,$$,mountPlot,mountLab,simulator}=R;
let modal=null,coachPreviousFocus=null,coachMode='normalcdf',coachState={};
function normalizeMode(v){v=String(v||'normalcdf').toLowerCase();return v==='invnorm'?'invNorm':v==='shadenorm'?'ShadeNorm':'normalcdf'}
function contextualState(button,mode){
  const text=(button?.closest('.stage,.slide,.screen,.student-turn,.worked-grid')?.textContent||button?.parentElement?.parentElement?.textContent||'').replace(/\s+/g,' ');
  if(mode==='invNorm')return{area:.82,mu:68,sd:10,tail:'LEFT'};
  if(/upper-tail mission|X\s*>\s*43|more than 43/i.test(text))return{lower:43,upper:Infinity,mu:32,sd:6};
  if(/lower-tail mission|X\s*<\s*40|shorter than 40/i.test(text))return{lower:-Infinity,upper:40,mu:32,sd:6};
  if(/V\s*<\s*492|less than 492/i.test(text))return{lower:-Infinity,upper:492,mu:500,sd:8};
  if(/492.*510|Bottle/i.test(text))return{lower:492,upper:510,mu:500,sd:8};
  return{};
}
function closeCoach(){if(!modal)return;modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.body.classList.remove('u411-modal-open');coachPreviousFocus?.focus?.()}
function buildCoach(){
  if(modal?.isConnected)return;modal=document.createElement('div');modal.className='u411-modal';modal.setAttribute('aria-hidden','true');modal.innerHTML='<section role="dialog" aria-modal="true" aria-labelledby="u411-coach-title"><header><div><small>ECHS · Lesson 4.11</small><h2 id="u411-coach-title">TI‑84 Normal Distribution Coach</h2></div><button type="button" data-close aria-label="Close TI-84 coach">×</button></header><main data-sim></main></section>';document.body.append(modal);$('[data-close]',modal).addEventListener('click',closeCoach);modal.addEventListener('click',e=>{if(e.target===modal)closeCoach()});
}
function openCoach(mode='normalcdf',state={}){
  closeFull();buildCoach();coachPreviousFocus=document.activeElement;coachMode=normalizeMode(mode);coachState=state||{};simulator($('[data-sim]',modal),coachMode,coachState);modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.classList.add('u411-modal-open');$('[data-close]',modal)?.focus();
}
const FULL='https://ti84calc.com/ti84calc';let panel=null,backdrop=null,frame=null,fullLoaded=false,fullPreviousFocus=null,loadTimer=null;
function markFullLoaded(){panel?.querySelector('.u1-ti84-sim-stage')?.classList.add('is-loaded');if(loadTimer){clearTimeout(loadTimer);loadTimer=null}}
function loadFull(force=false){
  buildFull();if(!frame)return;if(force){fullLoaded=false;frame.src='about:blank';$('.u1-ti84-sim-stage',panel)?.classList.remove('is-loaded')}if(fullLoaded)return;fullLoaded=true;frame.addEventListener('load',markFullLoaded,{once:true});frame.src=frame.dataset.src;loadTimer=setTimeout(markFullLoaded,9000);
}
function buildFull(){
  if(panel?.isConnected)return;backdrop=document.createElement('div');backdrop.className='u1-ti84-sim-backdrop';document.body.append(backdrop);panel=document.createElement('aside');panel.className='u1-ti84-sim';panel.setAttribute('aria-hidden','true');panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Full TI-84 Plus CE simulator for Lesson 4.11');panel.innerHTML=`<header class="u1-ti84-sim-head"><div><span>ECHS · TI‑84 PLUS CE</span><h2>Full simulator · normal probability and quantiles</h2></div><button type="button" class="u1-ti84-sim-close" aria-label="Close TI-84 simulator">×</button></header><div class="u1-ti84-sim-guide"><p><b>Mission:</b> use 2nd → VARS → DISTR. Choose normalcdf for an area and invNorm for a boundary. Sketch first; enter σ, not σ².</p><button type="button" class="u1-ti84-sim-reload">Reload</button><button type="button" class="u1-ti84-sim-local">Open verified local coach</button><a href="${FULL}" target="_blank" rel="noopener noreferrer">Open separately ↗</a></div><div class="u1-ti84-sim-stage"><div class="u1-ti84-sim-placeholder"><strong>TI‑84 Plus CE simulator</strong><p>The external simulator is loaded only after this panel opens. The local lesson coach remains available for exact offline calculations and visual checking.</p><button type="button" class="u1-ti84-sim-load">Load simulator</button><span class="u1-ti84-sim-status">External interactive simulator · internet connection required.</span></div><iframe title="TI-84 Plus CE interactive calculator simulator for normal distributions" src="about:blank" data-src="${FULL}" loading="lazy" sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups allow-modals allow-downloads" allow="fullscreen; clipboard-read; clipboard-write" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>`;document.body.append(panel);frame=$('iframe',panel);$('.u1-ti84-sim-close',panel).addEventListener('click',closeFull);$('.u1-ti84-sim-load',panel).addEventListener('click',()=>loadFull());$('.u1-ti84-sim-reload',panel).addEventListener('click',()=>loadFull(true));$('.u1-ti84-sim-local',panel).addEventListener('click',()=>openCoach('normalcdf'));backdrop.addEventListener('click',closeFull);
}
function openFull(){closeCoach();buildFull();fullPreviousFocus=document.activeElement;panel.classList.add('is-open');backdrop.classList.add('is-open');panel.setAttribute('aria-hidden','false');document.body.classList.add('u1-ti84-sim-open');loadFull();$('.u1-ti84-sim-close',panel)?.focus()}
function closeFull(){if(!panel)return;panel.classList.remove('is-open');backdrop.classList.remove('is-open');panel.setAttribute('aria-hidden','true');document.body.classList.remove('u1-ti84-sim-open');fullPreviousFocus?.focus?.()}
function focusables(root){return $$('button,a[href],input,select,textarea,[tabindex]:not([tabindex="-1"])',root).filter(n=>!n.disabled&&!n.hidden&&n.getClientRects().length)}
function trapTab(e,root){const nodes=focusables(root);if(!nodes.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}
function storageJSON(key,fallback){try{const raw=localStorage.getItem(`echs:ib-ai:u4:${data.lesson.number}:${key}`);return raw==null?fallback:JSON.parse(raw)}catch{return fallback}}
function storageNumber(key,fallback=0){try{const v=Number(localStorage.getItem(`echs:ib-ai:u4:${data.lesson.number}:${key}`));return Number.isFinite(v)?v:fallback}catch{return fallback}}
function patchQuizSetup(root=document){
  const setup=root.matches?.('.quiz-setup')?root:root.querySelector?.('.quiz-setup');if(!setup||setup.dataset.u411Patched==='1')return;setup.dataset.u411Patched='1';
  const total=Array.isArray(data.quiz)?data.quiz.length:16,minutes=Number(data.lesson?.quiz_minutes)||18,page=setup.closest('.route-page'),heading=page?.querySelector('.route-header h1');if(heading)heading.textContent=`${total}-question evidence check`;
  const options=setup.querySelector('.timer-options');if(!options)return;let target=options.querySelector(`[data-time="${minutes}"]`);if(!target){target=document.createElement('button');target.type='button';target.className='timer-option';target.dataset.time=String(minutes);target.textContent=`${minutes} minutes`;options.append(target)}
  options.querySelectorAll('[data-time]').forEach(b=>b.classList.toggle('active',b===target));options.addEventListener('click',e=>{const b=e.target.closest?.('[data-time]');if(!b||!options.contains(b))return;options.querySelectorAll('[data-time]').forEach(x=>x.classList.remove('active'));b.classList.add('active')});
}
function patchMastery(root=document){
  const panel=root.matches?.('.mastery-panel')?root:root.querySelector?.('.mastery-panel');if(!panel)return;const total=Array.isArray(data.quiz)?data.quiz.length:16,target=Math.max(1,Math.ceil(total*.7)),visited=storageJSON('visited',[]).length,results=storageJSON('practice-results',{}),attempted=Object.values(results||{}).filter(x=>x?.attempted).length,correct=Object.values(results||{}).filter(x=>x?.correct===true).length,accuracy=attempted?correct/attempted:0,quiz=storageNumber('quiz-best',0),ready=visited>=45&&attempted>=20&&accuracy>=.7&&quiz>=target,note=panel.querySelector('.evidence-note');if(!note)return;note.innerHTML=`<b>${ready?'Strong lesson evidence':'Evidence still developing'}</b><p>${ready?'You have a balanced local evidence set. Mark the lesson complete and continue building retention evidence in platform Practice.':`Visit the core learning slides, attempt at least 20 varied questions, reach 70% practice accuracy, and score at least ${target}/${total} on the quiz.`}</p>`;
}
function patchPlatformUI(root=document){patchQuizSetup(root);patchMastery(root)}
function hydrate(root=document){root.querySelectorAll?.('[data-u411-plot]').forEach(mountPlot);root.querySelectorAll?.('[data-u411-lab]').forEach(mountLab);patchPlatformUI(root)}
function installRouteButton(){
  const route=$('.routebar');if(!route||$('.u411-route-ti',route))return;const b=document.createElement('button');b.type='button';b.className='u411-route-ti';b.setAttribute('aria-label','Open verified TI-84 normal-distribution coach');b.innerHTML='<span>84</span>TI‑84 coach';b.addEventListener('click',()=>openCoach('normalcdf'));route.append(b);
}
function start(){
  hydrate();installRouteButton();document.addEventListener('click',e=>{
    const coach=e.target.closest?.('[data-u411-coach]');if(coach){e.preventDefault();const mode=normalizeMode(coach.dataset.u411Coach),state=contextualState(coach,mode);openCoach(mode,state);return}
    const full=e.target.closest?.('[data-open-ti84]');if(full){e.preventDefault();openFull();return}
    const jump=e.target.closest?.('[data-route-jump]');if(jump){e.preventDefault();const route=jump.dataset.routeJump;document.querySelector(`[data-route="${CSS.escape(route)}"]`)?.click();return}
  });
  document.addEventListener('echs:u411:coach',e=>openCoach(e.detail?.mode,e.detail?.state||{}));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(modal?.classList.contains('open')){e.preventDefault();closeCoach()}else if(panel?.classList.contains('is-open')){e.preventDefault();closeFull()}return}if(e.key==='Tab'){if(modal?.classList.contains('open'))trapTab(e,modal);else if(panel?.classList.contains('is-open'))trapTab(e,panel)}});
  new MutationObserver(records=>records.forEach(r=>r.addedNodes.forEach(n=>{if(n.nodeType===1){hydrate(n);installRouteButton()}}))).observe(document.body,{childList:true,subtree:true});
  data.ti84Simulator={release:'4.11.2',model:'TI-84 Plus CE',localCoach:true,functions:['normalcdf','invNorm','ShadeNorm'],externalProvider:'ti84calc.com',externalEmbedded:true,lazy:true,keyboardFocusTrap:true};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
