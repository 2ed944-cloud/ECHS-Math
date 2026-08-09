(function(){
'use strict';
const R=window.U410_RUNTIME;if(!R||!R.simulator)return;
const {$,$$,simulator}=R;
let modal,coachPreviousFocus;
function closeCoach(){if(!modal)return;modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.body.classList.remove('u410-modal-open');coachPreviousFocus?.focus?.()}
function openCoach(){
  coachPreviousFocus=document.activeElement;
  if(!modal){
    modal=document.createElement('div');modal.className='u410-modal';modal.setAttribute('aria-hidden','true');
    modal.innerHTML='<section role="dialog" aria-modal="true" aria-labelledby="u410-coach-title"><header><div><small>ECHS · Lesson 4.10</small><h2 id="u410-coach-title">Binomial TI‑84 Coach</h2></div><button type="button" data-close aria-label="Close binomial coach">×</button></header><main data-sim></main></section>';
    document.body.append(modal);$('[data-close]',modal).onclick=closeCoach;modal.onclick=e=>{if(e.target===modal)closeCoach()};simulator($('[data-sim]',modal));
  }
  modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.classList.add('u410-modal-open');$('[data-close]',modal)?.focus();
}

const FULL='https://ti84calc.com/ti84calc';
let panel,back,frame,fullLoaded=false,fullPreviousFocus,loadTimer;
function markFullLoaded(){panel?.querySelector('.u1-ti84-sim-stage')?.classList.add('is-loaded');if(loadTimer){clearTimeout(loadTimer);loadTimer=null}}
function loadFull(force=false){if(!panel)return;if(force){fullLoaded=false;frame.src='about:blank';$('.u1-ti84-sim-stage',panel)?.classList.remove('is-loaded')}if(fullLoaded)return;fullLoaded=true;frame.addEventListener('load',markFullLoaded,{once:true});frame.src=frame.dataset.src;loadTimer=setTimeout(markFullLoaded,9000)}
function buildFull(){
  if(panel?.isConnected)return;
  back=document.createElement('div');back.className='u1-ti84-sim-backdrop';document.body.append(back);
  panel=document.createElement('aside');panel.className='u1-ti84-sim';panel.setAttribute('aria-hidden','true');panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Full TI-84 Plus CE simulator for binomial distributions');
  panel.innerHTML=`<header class="u1-ti84-sim-head"><div><span>ECHS · TI‑84 PLUS CE</span><h2>Full simulator · binomial distribution</h2></div><button type="button" class="u1-ti84-sim-close" aria-label="Close TI-84 simulator">×</button></header><div class="u1-ti84-sim-guide"><p><b>Mission:</b> 2nd → VARS → DISTR. Use binompdf for one exact count and binomcdf for a lower cumulative probability. Translate upper tails first.</p><button type="button" class="u1-ti84-sim-reload">Reload</button><a href="${FULL}" target="_blank" rel="noopener noreferrer">Open separately ↗</a></div><div class="u1-ti84-sim-stage"><div class="u1-ti84-sim-placeholder"><strong>TI‑84 Plus CE simulator</strong><p>The local coach supplies verified numerical output; this panel is for authentic key practice.</p><button type="button" class="u1-ti84-sim-load">Load simulator</button><span class="u1-ti84-sim-status">External interactive simulator · internet connection required.</span></div><iframe title="TI-84 Plus CE interactive calculator simulator for binomial distributions" src="about:blank" data-src="${FULL}" loading="lazy" sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups allow-modals allow-downloads" allow="fullscreen; clipboard-read; clipboard-write" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>`;
  document.body.append(panel);frame=$('iframe',panel);$('.u1-ti84-sim-close',panel).onclick=closeFull;$('.u1-ti84-sim-load',panel).onclick=()=>loadFull();$('.u1-ti84-sim-reload',panel).onclick=()=>loadFull(true);back.onclick=closeFull;
}
function openFull(){closeCoach();buildFull();fullPreviousFocus=document.activeElement;panel.classList.add('is-open');back.classList.add('is-open');panel.setAttribute('aria-hidden','false');document.body.classList.add('u1-ti84-sim-open');loadFull();$('.u1-ti84-sim-close',panel)?.focus()}
function closeFull(){if(!panel)return;panel.classList.remove('is-open');back.classList.remove('is-open');panel.setAttribute('aria-hidden','true');document.body.classList.remove('u1-ti84-sim-open');fullPreviousFocus?.focus?.()}
function focusables(root){return $$('button,a[href],input,select,textarea,[tabindex]:not([tabindex="-1"])',root).filter(n=>!n.disabled&&!n.hidden&&n.getClientRects().length)}
function trapTab(e,root){const nodes=focusables(root);if(!nodes.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}
function start(){
  document.addEventListener('click',e=>{if(e.target.closest('[data-u410-coach]')){e.preventDefault();openCoach()}if(e.target.closest('[data-open-ti84]')){e.preventDefault();openFull()}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeCoach();closeFull();return}if(e.key==='Tab'){if(modal?.classList.contains('open'))trapTab(e,modal);else if(panel?.classList.contains('is-open'))trapTab(e,panel)}});
  const route=$('.routebar');if(route&&!$('.u410-route-ti',route)){const b=document.createElement('button');b.type='button';b.className='u410-route-ti';b.setAttribute('aria-label','Open full TI-84 Plus CE simulator');b.innerHTML='<span>84</span> Binomial';b.onclick=openFull;route.append(b)}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.ECHS_IB_AI_4_10_TI84={release:'2.0.0',model:'TI-84 Plus CE',focusedCoach:true,fullSimulator:true,openCoach,closeCoach,openFull,closeFull};
})();
