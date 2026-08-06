(function(){
'use strict';
const data=window.LESSON_DATA;
if(!data||String(data.lesson?.number)!=='1.1')return;

const SIMULATOR_URL='https://ti84calc.com/ti84calc';
const BASE_WIDTH=600;
const BASE_HEIGHT=900;
const $=(selector,root=document)=>root.querySelector(selector);
const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
let panel=null;
let frame=null;
let stage=null;
let canvas=null;
let headerButton=null;
let loaded=false;
let loading=false;
let lastFocus=null;
let cleanupScheduled=false;

function retireLegacySimulator(){
  document.body.classList.remove('ti84-inline-open');
  document.documentElement.style.removeProperty('--ti84-inline-scale');
  document.documentElement.style.removeProperty('--ti84-inline-top');
  $$('#ti84-inline-dock').forEach(node=>node.remove());
  $$('.ti84-inline-launch').forEach(node=>node.remove());
}

function panelMarkup(){
  const aside=document.createElement('aside');
  aside.id='l11-ti84-simulator';
  aside.className='l11-ti84-simulator';
  aside.setAttribute('aria-hidden','true');
  aside.innerHTML=`
    <header class="l11-sim-head">
      <div>
        <span>TI‑84 PLUS CE · LESSON 1.1</span>
        <h2>Simulator beside the slide</h2>
      </div>
      <div class="l11-sim-head-actions">
        <a href="${SIMULATOR_URL}" target="_blank" rel="noopener noreferrer">Open full size ↗</a>
        <button type="button" data-l11-sim-close aria-label="Close TI-84 simulator">×</button>
      </div>
    </header>
    <div class="l11-sim-guide">
      <p><b>Classroom routine:</b> predict the exponent, enter the expression, retain guard digits, then rewrite calculator E-notation as \\(a\\times10^k\\).</p>
      <span id="l11-sim-status" role="status">Ready to load</span>
    </div>
    <div class="l11-sim-stage" id="l11-sim-stage">
      <div class="l11-sim-placeholder" id="l11-sim-placeholder">
        <div class="l11-sim-mark">84</div>
        <h3>TI‑84 online practice</h3>
        <p>The simulator loads inside this panel and the lesson remains visible beside it.</p>
        <button type="button" id="l11-sim-load">Load simulator</button>
        <small>Third-party classroom tool. Do not enter personal information.</small>
      </div>
      <div class="l11-sim-canvas" id="l11-sim-canvas" hidden>
        <iframe
          id="l11-ti84-frame"
          title="TI-84 Plus CE simulator for Lesson 1.1"
          src="about:blank"
          data-src="${SIMULATOR_URL}"
          loading="lazy"
          sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups allow-modals allow-downloads"
          allow="fullscreen; clipboard-read; clipboard-write"
          referrerpolicy="strict-origin-when-cross-origin"
          allowfullscreen></iframe>
      </div>
    </div>`;
  return aside;
}

function build(){
  if(panel&&panel.isConnected)return;
  panel=panelMarkup();
  document.body.append(panel);
  frame=$('#l11-ti84-frame',panel);
  stage=$('#l11-sim-stage',panel);
  canvas=$('#l11-sim-canvas',panel);
  $$('[data-l11-sim-close]',panel).forEach(button=>button.addEventListener('click',close));
  $('#l11-sim-load',panel)?.addEventListener('click',load);
  frame?.addEventListener('load',()=>{
    if(frame.src==='about:blank')return;
    loaded=true;
    loading=false;
    canvas.hidden=false;
    $('#l11-sim-placeholder',panel)?.setAttribute('hidden','');
    const status=$('#l11-sim-status',panel);
    if(status)status.textContent='Simulator loaded';
    panel.classList.remove('is-loading');
    geometry();
  });
}

function geometry(){
  if(!panel||!panel.classList.contains('open'))return;
  const topbar=$('.topbar');
  const routebar=$('.routebar');
  const footer=$('#lesson-footer');
  const top=Math.max(
    Math.round(topbar?.getBoundingClientRect().bottom||0),
    Math.round(routebar?.getBoundingClientRect().bottom||0),
    88
  )+10;
  const bottom=Math.max(Math.round(footer?.getBoundingClientRect().height||0)+10,76);
  document.documentElement.style.setProperty('--l11-sim-top',`${top}px`);
  document.documentElement.style.setProperty('--l11-sim-bottom',`${bottom}px`);
  const innerWidth=Math.max(320,(stage?.clientWidth||panel.clientWidth)-24);
  const scale=Math.min(1,Math.max(.64,innerWidth/BASE_WIDTH));
  if(canvas){
    canvas.style.width=`${Math.round(BASE_WIDTH*scale)}px`;
    canvas.style.height=`${Math.round(BASE_HEIGHT*scale)}px`;
  }
  if(frame){
    frame.style.width=`${BASE_WIDTH}px`;
    frame.style.height=`${BASE_HEIGHT}px`;
    frame.style.transform=`scale(${scale})`;
  }
}

function load(){
  build();
  if(loaded){geometry();return;}
  if(loading)return;
  loading=true;
  panel.classList.add('is-loading');
  canvas.hidden=false;
  const placeholder=$('#l11-sim-placeholder',panel);
  if(placeholder)placeholder.hidden=true;
  const status=$('#l11-sim-status',panel);
  if(status)status.textContent='Loading simulator…';
  frame.src=frame.dataset.src;
  setTimeout(()=>{
    if(!loaded&&panel?.isConnected){
      loading=false;
      panel.classList.remove('is-loading');
      if(status)status.textContent='Still loading — use “Open full size” if the network blocks embedding';
    }
  },12000);
}

function closeCoach(){
  const coach=$('#ti84-classroom-coach-1-1');
  if(coach?.classList.contains('open'))coach.querySelector('[data-close]')?.click();
}

function open(){
  retireLegacySimulator();
  build();
  closeCoach();
  lastFocus=document.activeElement;
  requestAnimationFrame(()=>{
    panel.classList.add('open');
    panel.setAttribute('aria-hidden','false');
    document.body.classList.add('l11-ti84-simulator-open');
    headerButton?.classList.add('active');
    headerButton?.setAttribute('aria-pressed','true');
    geometry();
    load();
    panel.querySelector('[data-l11-sim-close]')?.focus();
  });
}

function close(){
  if(!panel)return;
  panel.classList.remove('open');
  panel.setAttribute('aria-hidden','true');
  document.body.classList.remove('l11-ti84-simulator-open');
  headerButton?.classList.remove('active');
  headerButton?.setAttribute('aria-pressed','false');
  lastFocus?.focus?.();
}

function bindHeaderButton(){
  const actions=$('.header-actions');
  if(!actions)return;
  headerButton=$('#l11-ti84-sim-launch',actions);
  if(!headerButton){
    headerButton=document.createElement('button');
    headerButton.id='l11-ti84-sim-launch';
    headerButton.type='button';
    headerButton.className='header-tool l11-ti84-sim-launch';
    headerButton.setAttribute('aria-controls','l11-ti84-simulator');
    headerButton.setAttribute('aria-pressed','false');
    headerButton.setAttribute('aria-label','Open TI-84 simulator beside the slide');
    headerButton.title='TI-84 simulator';
    headerButton.innerHTML='84<span class="tool-label">TI‑84</span>';
    headerButton.addEventListener('click',()=>panel?.classList.contains('open')?close():open());
    const menu=$('#toggle-route-menu',actions);
    menu?actions.insertBefore(headerButton,menu):actions.append(headerButton);
  }
}

function bindClassroomButton(){
  const coach=$('#ti84-classroom-coach-1-1');
  const toolbar=coach?.querySelector('.ti84-coach-toolbar');
  if(!toolbar)return;
  let button=toolbar.querySelector('.ti84-open-separate-simulator');
  if(button&&!button.dataset.l11V67){
    const replacement=button.cloneNode(true);
    button.replaceWith(replacement);
    button=replacement;
  }
  if(!button){
    button=document.createElement('button');
    button.type='button';
    button.className='ti84-open-separate-simulator';
    toolbar.append(button);
  }
  if(button.dataset.l11V67)return;
  button.dataset.l11V67='1';
  button.textContent='Open simulator';
  button.setAttribute('aria-controls','l11-ti84-simulator');
  button.addEventListener('click',event=>{
    event.preventDefault();
    event.stopImmediatePropagation();
    open();
  },true);
}

function maintain(){
  if(cleanupScheduled)return;
  cleanupScheduled=true;
  requestAnimationFrame(()=>{
    cleanupScheduled=false;
    retireLegacySimulator();
    build();
    bindHeaderButton();
    bindClassroomButton();
    if(panel.classList.contains('open'))geometry();
  });
}

function init(){
  retireLegacySimulator();
  build();
  bindHeaderButton();
  bindClassroomButton();
  window.addEventListener('resize',geometry,{passive:true});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&panel?.classList.contains('open'))close();});
  document.addEventListener('click',event=>{
    const route=event.target.closest?.('[data-route]');
    if(route&&route.dataset.route!=='learn')close();
  });
  document.addEventListener('echs:ti84:simulator',open);
  const coach=$('#ti84-classroom-coach-1-1');
  if(coach)new MutationObserver(()=>{if(coach.classList.contains('open'))close();bindClassroomButton();}).observe(coach,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});
  new MutationObserver(maintain).observe(document.body,{childList:true,subtree:false});
  data.ti84InlineSimulator=Object.assign({},data.ti84InlineSimulator,{
    release:'6.7.0',
    provider:'ti84calc.com',
    layout:'independent overlay beside slide',
    legacyDockRetired:true,
    lazy:true,
    sandboxed:true
  });
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();
