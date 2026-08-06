(function(){
'use strict';
const data=window.LESSON_DATA;
if(!data||String(data.lesson?.number)!=='1.4')return;
const URL='https://ti84calc.com/ti84calc';
const $=(selector,root=document)=>root.querySelector(selector);
let host=null,frame=null,button=null,loaded=false;

function panel(){
  const aside=document.createElement('aside');
  aside.id='fin84-inline-dock';
  aside.className='fin84-inline-dock';
  aside.setAttribute('aria-hidden','true');
  aside.innerHTML=`<header class="fin84-inline-head"><button type="button" id="fin84-inline-close" aria-label="Close TI-84 simulator">×</button><div><span>TI‑84 PLUS CE · LIVE FINANCE VIEW</span><h2>Simulator beside the slide</h2></div></header>
  <div class="fin84-inline-guidance"><p><b>Classroom routine:</b> keep the financial model visible, enter one TVM or Finance-menu step, then students repeat it on their physical TI‑84.</p><small id="fin84-inline-current">Current slide</small></div>
  <div class="fin84-inline-frame-shell" id="fin84-inline-frame-shell">
    <div class="fin84-inline-placeholder"><span>TI‑84</span><h3>Ready for the projected finance example</h3><p>The simulator loads only after the teacher opens it. Do not enter personal information.</p><button type="button" id="fin84-inline-load">Load simulator</button></div>
    <iframe title="TI-84 Plus CE online practice simulator beside the Financial Applications slide" src="about:blank" data-src="${URL}" loading="lazy" sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups allow-modals allow-downloads" allow="fullscreen; clipboard-read; clipboard-write" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>
  </div>`;
  return aside;
}
function geometry(){
  const route=$('.routebar');
  const top=Math.max(0,Math.round(route?.getBoundingClientRect().bottom||128));
  document.documentElement.style.setProperty('--fin84-inline-top',`${top}px`);
  const width=host?.getBoundingClientRect().width||600;
  const scale=Math.min(1,Math.max(.68,(width-10)/600));
  document.documentElement.style.setProperty('--fin84-inline-scale',String(scale));
}
function updateContext(){
  const title=$('.slide-title')?.textContent?.trim()||'Current lesson slide';
  const label=$('#fin84-inline-current',host);
  if(label)label.textContent=`Current slide: ${title}`;
}
function load(){
  if(!frame||loaded)return;
  loaded=true;
  const shell=$('#fin84-inline-frame-shell',host);
  shell?.classList.add('loading');
  frame.src=frame.dataset.src;
  frame.addEventListener('load',()=>{shell?.classList.remove('loading');shell?.classList.add('loaded');},{once:true});
  setTimeout(()=>{shell?.classList.remove('loading');shell?.classList.add('loaded');},9000);
}
function open(){
  build();geometry();updateContext();
  document.dispatchEvent(new CustomEvent('echs:ti84-finance-classroom-close'));
  host.classList.add('open');
  host.setAttribute('aria-hidden','false');
  document.body.classList.add('fin84-inline-open');
  button?.classList.add('active');
  button?.setAttribute('aria-pressed','true');
  load();
}
function close(){
  if(!host)return;
  host.classList.remove('open');
  host.setAttribute('aria-hidden','true');
  document.body.classList.remove('fin84-inline-open');
  button?.classList.remove('active');
  button?.setAttribute('aria-pressed','false');
}
function toggle(){host?.classList.contains('open')?close():open();}
function attachButton(){
  const route=$('.routebar');
  if(!route)return;
  button=$('.fin84-inline-launch',route);
  if(button)return;
  button=document.createElement('button');
  button.type='button';
  button.className='fin84-inline-launch';
  button.setAttribute('aria-controls','fin84-inline-dock');
  button.setAttribute('aria-pressed','false');
  button.innerHTML='<span>▣</span><b>TI‑84 Simulator</b>';
  button.addEventListener('click',toggle);
  const classroom=$('.fin84-classroom-launch',route);
  classroom?route.insertBefore(button,classroom):route.append(button);
}
function build(){
  if(host)return;
  host=panel();
  document.body.append(host);
  frame=$('iframe',host);
  $('#fin84-inline-close',host)?.addEventListener('click',close);
  $('#fin84-inline-load',host)?.addEventListener('click',load);
}
function init(){
  build();attachButton();geometry();updateContext();
  window.addEventListener('resize',geometry,{passive:true});
  new ResizeObserver(geometry).observe($('.routebar')||document.body);
  const app=$('#app');
  if(app)new MutationObserver(updateContext).observe(app,{childList:true,subtree:true});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&host.classList.contains('open'))close();});
  document.addEventListener('click',event=>{const routeButton=event.target.closest?.('[data-route]');if(routeButton&&routeButton.dataset.route!=='learn')close();});
  document.addEventListener('echs:ti84-finance-inline-close',close);
  data.ti84FinanceInlineSimulator={release:'6.3.0',provider:'ti84calc.com',layout:'docked beside slide',lazy:true,sandboxed:true};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();