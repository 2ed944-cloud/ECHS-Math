(function(){
'use strict';
const data=window.LESSON_DATA;
const lesson=String(data&&data.lesson&&data.lesson.number||'');
if(!/^(?:1\.[2-6]|2\.1)$/.test(lesson)||typeof document==='undefined')return;

const URL='https://ti84calc.com/ti84calc';
const $=(s,r=document)=>r.querySelector(s);
let panel=null,backdrop=null,frame=null,routeButton=null,headerButton=null,previousFocus=null,loaded=false,loadTimer=null;

function currentTitle(){return $('.slide-title')?.textContent?.trim()||data.lesson?.title||`Lesson ${lesson}`;}
function updateContext(){
  if(!panel)return;
  const title=$('[data-u1-ti84-current]',panel);
  if(title)title.textContent=`Current lesson view: ${currentTitle()}`;
}
function markup(){
  const aside=document.createElement('aside');
  aside.id='u1-ti84-simulator';
  aside.className='u1-ti84-sim';
  aside.setAttribute('aria-hidden','true');
  aside.setAttribute('role','dialog');
  aside.setAttribute('aria-modal','true');
  aside.setAttribute('aria-label',`TI-84 Plus CE simulator for Lesson ${lesson}`);
  aside.innerHTML=`
    <header class="u1-ti84-sim-head">
      <div><span>ECHS · TI‑84 PLUS CE</span><h2>Interactive calculator simulator · Lesson ${lesson}</h2></div>
      <button type="button" class="u1-ti84-sim-close" aria-label="Close TI-84 simulator">×</button>
    </header>
    <div class="u1-ti84-sim-guide">
      <p><b>Use it with the GDC pathway:</b> model first, enter carefully, read the display, interpret the result, then verify mathematically. <span data-u1-ti84-current></span></p>
      <button type="button" class="u1-ti84-sim-reload">Reload</button>
      <a href="${URL}" target="_blank" rel="noopener noreferrer">Open separately ↗</a>
    </div>
    <div class="u1-ti84-sim-stage">
      <div class="u1-ti84-sim-placeholder">
        <strong>TI‑84 Plus CE simulator</strong>
        <p>The simulator is loaded only when you choose it, so the lesson itself stays fast. Use the same calculator workflow shown in the lesson.</p>
        <button type="button" class="u1-ti84-sim-load">Load simulator</button>
        <span class="u1-ti84-sim-status">Interactive simulator · internet connection required for this embedded calculator.</span>
      </div>
      <iframe title="TI-84 Plus CE interactive calculator simulator for IB Mathematics AI SL" src="about:blank" data-src="${URL}" loading="lazy" sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups allow-modals allow-downloads" allow="fullscreen; clipboard-read; clipboard-write" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
    </div>`;
  return aside;
}
function focusables(){
  if(!panel)return[];
  return [...panel.querySelectorAll('button,a[href],select,input,[tabindex]:not([tabindex="-1"])')].filter(el=>!el.disabled&&!el.hidden&&el.getClientRects().length);
}
function setButtons(active){
  [routeButton,headerButton].forEach(b=>{if(!b)return;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active));});
}
function markLoaded(){
  panel?.querySelector('.u1-ti84-sim-stage')?.classList.add('is-loaded');
  if(loadTimer){clearTimeout(loadTimer);loadTimer=null;}
}
function load(force=false){
  build();
  if(!frame)return;
  if(force){loaded=false;frame.src='about:blank';panel.querySelector('.u1-ti84-sim-stage')?.classList.remove('is-loaded');}
  if(loaded)return;
  loaded=true;
  frame.addEventListener('load',markLoaded,{once:true});
  frame.src=frame.dataset.src;
  loadTimer=setTimeout(markLoaded,9000);
}
function open(){
  build();updateContext();previousFocus=document.activeElement;
  panel.classList.add('is-open');backdrop.classList.add('is-open');
  panel.setAttribute('aria-hidden','false');document.body.classList.add('u1-ti84-sim-open');setButtons(true);load();
  panel.querySelector('.u1-ti84-sim-close')?.focus();
}
function close(){
  if(!panel)return;
  panel.classList.remove('is-open');backdrop.classList.remove('is-open');panel.setAttribute('aria-hidden','true');document.body.classList.remove('u1-ti84-sim-open');setButtons(false);previousFocus?.focus?.();
}
function toggle(){panel?.classList.contains('is-open')?close():open();}
function build(){
  if(panel?.isConnected)return;
  backdrop=document.createElement('div');backdrop.className='u1-ti84-sim-backdrop';document.body.append(backdrop);
  panel=markup();document.body.append(panel);frame=$('iframe',panel);
  backdrop.addEventListener('click',close);
  panel.querySelector('.u1-ti84-sim-close')?.addEventListener('click',close);
  panel.querySelector('.u1-ti84-sim-load')?.addEventListener('click',()=>load());
  panel.querySelector('.u1-ti84-sim-reload')?.addEventListener('click',()=>load(true));
}
function installLaunchers(){
  const route=$('.routebar');
  if(route&&!$('.u1-ti84-sim-launch',route)){
    routeButton=document.createElement('button');routeButton.type='button';routeButton.className='u1-ti84-sim-launch';routeButton.setAttribute('aria-controls','u1-ti84-simulator');routeButton.setAttribute('aria-pressed','false');routeButton.innerHTML='<span>84</span><b>TI‑84 Simulator</b>';routeButton.addEventListener('click',toggle);route.append(routeButton);
  }else if(route)routeButton=$('.u1-ti84-sim-launch',route);
  const actions=$('.header-actions');
  if(actions&&!$('#u1-ti84-header-launch',actions)){
    headerButton=document.createElement('button');headerButton.id='u1-ti84-header-launch';headerButton.type='button';headerButton.className='header-tool';headerButton.setAttribute('aria-controls','u1-ti84-simulator');headerButton.setAttribute('aria-pressed','false');headerButton.setAttribute('aria-label','Open TI-84 simulator');headerButton.title='TI-84 Simulator';headerButton.innerHTML='84<span class="tool-label">TI‑84</span>';headerButton.addEventListener('click',toggle);const menu=$('#toggle-route-menu',actions);menu?actions.insertBefore(headerButton,menu):actions.append(headerButton);
  }else if(actions)headerButton=$('#u1-ti84-header-launch',actions);
}
function init(){
  build();installLaunchers();updateContext();
  const app=$('#app');if(app)new MutationObserver(()=>{installLaunchers();updateContext();}).observe(app,{childList:true,subtree:true});
  document.addEventListener('keydown',e=>{
    if(!panel?.classList.contains('is-open'))return;
    if(e.key==='Escape'){e.preventDefault();close();return;}
    if(e.key==='Tab'){
      const items=focusables();if(!items.length)return;
      const first=items[0],last=items[items.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    }
  });
  document.addEventListener('click',e=>{
    const direct=e.target.closest?.('[data-open-ti84]');
    if(direct){e.preventDefault();open();return;}
    if(e.target.closest?.('.gdc-v7-simulator')){e.preventDefault();document.querySelector('.gdc-v7-close')?.click();setTimeout(open,20);return;}
    const route=e.target.closest?.('[data-route]');if(route&&route.dataset.route!=='learn')close();
  });
  document.addEventListener('echs:ti84:simulator',open);
  data.ti84Simulator={release:'7.1.2',provider:'ti84calc.com',model:'TI-84 Plus CE',lessons:['1.2','1.3','1.4','1.5','1.6','2.1'],embedded:true,lazy:true,keyboardFocusTrap:true};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();