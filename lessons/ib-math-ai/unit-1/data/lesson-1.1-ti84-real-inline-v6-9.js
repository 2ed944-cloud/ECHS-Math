(function(){
'use strict';
const data=window.LESSON_DATA;
if(!data||String(data.lesson?.number)!=='1.1'||typeof document==='undefined')return;

const URL='https://ti84calc.com/ti84calc';
const $=(selector,root=document)=>root.querySelector(selector);
const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
let host=null,frame=null,routeButton=null,headerButton=null,loaded=false,loadTimer=null,lastFocus=null;

function retireLocalSimulator(){
  document.body.classList.remove('l11-ti84-local-open','l11-ti84-simulator-open');
  $$('#l11-ti84-local,#l11-ti84-simulator,.l11-ti84-local-launch,.l11-ti84-sim-launch').forEach(node=>node.remove());
}

function panel(){
  const aside=document.createElement('aside');
  aside.id='ti84-inline-dock';
  aside.className='ti84-inline-dock';
  aside.setAttribute('aria-hidden','true');
  aside.innerHTML=`
    <header class="ti84-inline-head">
      <button type="button" id="ti84-inline-close" aria-label="Close TI-84 simulator">×</button>
      <div><span>TI‑84 PLUS CE · LIVE LESSON 1.1 VIEW</span><h2>Simulator beside the slide</h2></div>
    </header>
    <div class="ti84-inline-guidance">
      <p><b>Classroom routine:</b> keep the mathematical example visible, predict the exponent or scale, enter one calculator step, then rewrite E-notation as mathematical notation.</p>
      <small id="ti84-inline-current">Current slide</small>
    </div>
    <div class="ti84-inline-frame-shell" id="ti84-inline-frame-shell">
      <div class="ti84-inline-placeholder">
        <b>Real TI‑84 Plus CE practice</b>
        <p>This uses the same working TI‑84 Plus CE simulator used in Lesson 1.4, with the physical key layout and calculator screen.</p>
        <button type="button" id="ti84-inline-load">Load TI‑84 Plus CE</button>
        <small>Third-party classroom simulator. Do not enter personal information.</small>
      </div>
      <iframe title="TI-84 Plus CE online simulator beside Lesson 1.1" src="about:blank" data-src="${URL}" loading="lazy" sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups allow-modals allow-downloads" allow="fullscreen; clipboard-read; clipboard-write" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
    </div>`;
  return aside;
}

function geometry(){
  if(!host)return;
  const topbar=$('.topbar');
  const route=$('.routebar');
  const top=Math.max(
    Math.round(topbar?.getBoundingClientRect().bottom||0),
    Math.round(route?.getBoundingClientRect().bottom||0),
    90
  );
  document.documentElement.style.setProperty('--ti84-inline-top',`${top}px`);
}

function updateContext(){
  if(!host)return;
  const title=$('.slide-title')?.textContent?.trim()||data.lesson?.title||'Lesson 1.1';
  const label=$('#ti84-inline-current',host);
  if(label)label.textContent=`Current slide: ${title}`;
}

function markLoaded(){
  const shell=$('#ti84-inline-frame-shell',host);
  shell?.classList.remove('loading');
  shell?.classList.add('loaded');
  if(loadTimer){clearTimeout(loadTimer);loadTimer=null;}
}

function load(){
  if(!frame||loaded)return;
  loaded=true;
  const shell=$('#ti84-inline-frame-shell',host);
  shell?.classList.add('loading');
  frame.src=frame.dataset.src;
  frame.addEventListener('load',markLoaded,{once:true});
  loadTimer=setTimeout(markLoaded,9000);
}

function closeClassroom(){
  const coach=$('#ti84-classroom-coach-1-1');
  if(coach?.classList.contains('open'))coach.querySelector('[data-close]')?.click();
}

function open(){
  build();
  retireLocalSimulator();
  closeClassroom();
  geometry();
  updateContext();
  lastFocus=document.activeElement;
  host.classList.add('open');
  host.setAttribute('aria-hidden','false');
  document.body.classList.add('ti84-inline-open');
  routeButton?.classList.add('active');
  routeButton?.setAttribute('aria-pressed','true');
  headerButton?.classList.add('active');
  headerButton?.setAttribute('aria-pressed','true');
  load();
  $('#ti84-inline-close',host)?.focus();
}

function close(){
  if(!host)return;
  host.classList.remove('open');
  host.setAttribute('aria-hidden','true');
  document.body.classList.remove('ti84-inline-open');
  routeButton?.classList.remove('active');
  routeButton?.setAttribute('aria-pressed','false');
  headerButton?.classList.remove('active');
  headerButton?.setAttribute('aria-pressed','false');
  lastFocus?.focus?.();
}

function toggle(){host?.classList.contains('open')?close():open();}

function build(){
  retireLocalSimulator();
  if(host?.isConnected)return;
  host=$('#ti84-inline-dock');
  if(!host){host=panel();document.body.append(host);}
  frame=$('iframe',host);
  $('#ti84-inline-close',host)?.addEventListener('click',close);
  $('#ti84-inline-load',host)?.addEventListener('click',load);
}

function attachRouteButton(){
  const route=$('.routebar');
  if(!route)return;
  routeButton=$('.ti84-inline-launch',route);
  if(routeButton)return;
  routeButton=document.createElement('button');
  routeButton.type='button';
  routeButton.className='ti84-inline-launch';
  routeButton.setAttribute('aria-controls','ti84-inline-dock');
  routeButton.setAttribute('aria-pressed','false');
  routeButton.innerHTML='<span>▣</span><b>TI‑84 Simulator</b>';
  routeButton.addEventListener('click',toggle);
  const classroom=$('.ti84-classroom-launch',route);
  classroom?route.insertBefore(routeButton,classroom):route.append(routeButton);
}

function attachHeaderButton(){
  const actions=$('.header-actions');
  if(!actions)return;
  headerButton=$('#l11-real84-header-launch',actions);
  if(headerButton)return;
  headerButton=document.createElement('button');
  headerButton.id='l11-real84-header-launch';
  headerButton.type='button';
  headerButton.className='header-tool l11-real84-header-launch';
  headerButton.setAttribute('aria-controls','ti84-inline-dock');
  headerButton.setAttribute('aria-pressed','false');
  headerButton.setAttribute('aria-label','Open real TI-84 Plus CE simulator');
  headerButton.title='TI-84 Plus CE simulator';
  headerButton.innerHTML='84<span class="tool-label">TI‑84</span>';
  headerButton.addEventListener('click',toggle);
  const menu=$('#toggle-route-menu',actions);
  menu?actions.insertBefore(headerButton,menu):actions.append(headerButton);
}

function wireClassroomButton(){
  const coach=$('#ti84-classroom-coach-1-1');
  const button=coach?.querySelector('.ti84-open-separate-simulator');
  if(!button||button.dataset.realTi84==='1')return;
  button.dataset.realTi84='1';
  button.textContent='Open TI‑84 Plus CE';
  button.setAttribute('aria-controls','ti84-inline-dock');
  button.addEventListener('click',event=>{
    event.preventDefault();
    event.stopImmediatePropagation();
    coach.querySelector('[data-close]')?.click();
    setTimeout(open,30);
  },true);
}

function init(){
  build();
  attachRouteButton();
  attachHeaderButton();
  wireClassroomButton();
  geometry();
  updateContext();
  window.addEventListener('resize',geometry,{passive:true});
  if(window.ResizeObserver)new ResizeObserver(geometry).observe($('.routebar')||document.body);
  const app=$('#app');
  if(app)new MutationObserver(()=>{updateContext();wireClassroomButton();}).observe(app,{childList:true,subtree:true});
  const coach=$('#ti84-classroom-coach-1-1');
  if(coach)new MutationObserver(()=>{wireClassroomButton();if(coach.classList.contains('open'))close();}).observe(coach,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&host?.classList.contains('open'))close();});
  document.addEventListener('click',event=>{const route=event.target.closest?.('[data-route]');if(route&&route.dataset.route!=='learn')close();});
  document.addEventListener('echs:ti84:simulator',open);
  document.addEventListener('echs:ti84:inline-open',open);
  document.addEventListener('echs:ti84:inline-close',close);
  data.ti84InlineSimulator={
    release:'6.9.0',
    provider:'ti84calc.com',
    model:'TI-84 Plus CE',
    layout:'docked beside slide',
    realCalculatorInterface:true,
    lazy:true,
    sandboxed:true,
    workflows:['EE entry','SCI/NORMAL','brackets and guard digits']
  };
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();
