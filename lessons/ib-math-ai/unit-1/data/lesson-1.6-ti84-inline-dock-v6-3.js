(function(){
'use strict';
const data=window.LESSON_DATA;
if(!data||String(data.lesson?.number)!=='1.6')return;
const URL='https://ti84calc.com/ti84calc';
const $=(selector,root=document)=>root.querySelector(selector);
let host=null,frame=null,button=null,loaded=false;

function panel(){
  const aside=document.createElement('aside');
  aside.id='ti84-inline-dock';aside.className='ti84-inline-dock';aside.setAttribute('aria-hidden','true');
  aside.innerHTML=`<header class="ti84-inline-head"><div><span>TI‑84 PLUS CE · LIVE CLASSROOM VIEW</span><h2>Simulator beside the slide</h2></div><button type="button" id="ti84-inline-close" aria-label="Close TI-84 simulator">×</button></header>
  <div class="ti84-inline-guidance"><p><b>Classroom routine:</b> keep the worked example visible, demonstrate one calculator step, then students repeat it on the TI‑84 in their hands.</p><a href="${URL}" target="_blank" rel="noopener noreferrer">Open separately ↗</a></div>
  <div class="ti84-inline-frame-shell" id="ti84-inline-frame-shell"><div class="ti84-inline-placeholder"><span>TI‑84</span><h3>Ready for the projected example</h3><p>The third-party simulator loads only after the teacher opens it. Do not enter personal information.</p><button type="button" id="ti84-inline-load">Load simulator</button></div><iframe title="TI-84 Plus CE online practice simulator beside the lesson slide" src="about:blank" data-src="${URL}" loading="lazy" sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups allow-modals allow-downloads" allow="fullscreen; clipboard-read; clipboard-write" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`;
  return aside;
}
function geometry(){
  const route=$('.routebar');
  const top=Math.max(0,Math.round(route?.getBoundingClientRect().bottom||128));
  document.documentElement.style.setProperty('--ti84-inline-top',`${top}px`);
  const width=host?.getBoundingClientRect().width||600;
  const scale=Math.min(1,Math.max(.68,(width-10)/600));
  document.documentElement.style.setProperty('--ti84-inline-scale',String(scale));
}
function load(){
  if(!frame||loaded)return;
  loaded=true;const shell=$('#ti84-inline-frame-shell',host);shell?.classList.add('loading');frame.src=frame.dataset.src;
  frame.addEventListener('load',()=>{shell?.classList.remove('loading');shell?.classList.add('loaded');},{once:true});
  setTimeout(()=>{shell?.classList.remove('loading');shell?.classList.add('loaded');},9000);
}
function open(){
  build();geometry();host.classList.add('open');host.setAttribute('aria-hidden','false');document.body.classList.add('ti84-inline-open');button?.classList.add('active');button?.setAttribute('aria-pressed','true');load();
}
function close(){
  if(!host)return;host.classList.remove('open');host.setAttribute('aria-hidden','true');document.body.classList.remove('ti84-inline-open');button?.classList.remove('active');button?.setAttribute('aria-pressed','false');
}
function toggle(){host?.classList.contains('open')?close():open();}
function attachButton(){
  const route=$('.routebar');if(!route)return;
  button=$('.ti84-inline-launch',route);
  if(button)return;
  button=document.createElement('button');button.type='button';button.className='ti84-inline-launch';button.setAttribute('aria-controls','ti84-inline-dock');button.setAttribute('aria-pressed','false');button.innerHTML='<span>▣</span><b>TI‑84 Simulator</b>';
  button.addEventListener('click',toggle);
  const classroom=$('.ti84-classroom-launch',route);classroom?route.insertBefore(button,classroom):route.append(button);
}
function build(){
  if(host)return;
  host=panel();document.body.append(host);frame=$('iframe',host);
  $('#ti84-inline-close',host)?.addEventListener('click',close);$('#ti84-inline-load',host)?.addEventListener('click',load);
}
function init(){
  build();attachButton();geometry();
  window.addEventListener('resize',geometry,{passive:true});
  new ResizeObserver(geometry).observe($('.routebar')||document.body);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&host.classList.contains('open'))close();});
  document.addEventListener('click',event=>{const routeButton=event.target.closest?.('[data-route]');if(routeButton&&routeButton.dataset.route!=='learn')close();});
  data.ti84InlineSimulator={release:'6.3.0',provider:'ti84calc.com',layout:'docked beside slide',lazy:true,sandboxed:true};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
