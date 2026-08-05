(function(){
'use strict';

const data=window.LESSON_DATA;
if(!data||String(data.lesson?.number)!=='1.6')return;

const TI_SOFTWARE_URL='https://education.ti.com/en/software/search';
const TI_ONLINE_URL='https://education.ti.com/en/products/online-calculators/ti-84ce-online-calc';
const TI_GUIDE_URL='https://education.ti.com/html/webhelp/EG_TI84PlusCEOLC/EN/Content/Home_84CE_OLC.HTML';
const THIRD_PARTY_URL='https://ti84calc.com/ti84calc';
const $=(selector,root=document)=>root.querySelector(selector);
const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];

let host=null;
let frame=null;
let frameLoaded=false;
let previousFocus=null;

function externalPanel(){
  const element=document.createElement('section');
  element.id='gdc-external-tools';
  element.className='gdc-external-tools';
  element.setAttribute('aria-hidden','true');
  element.innerHTML=`<div class="gdc-external-backdrop" data-external-close></div>
  <div class="gdc-external-dialog" role="dialog" aria-modal="true" aria-labelledby="gdc-external-title">
    <header class="gdc-external-head">
      <div><span>CONNECTED CALCULATOR RESOURCES</span><h2 id="gdc-external-title">TI‑84 Practice & Official TI Tools</h2><p>Use external tools for practice; record IB evidence in the ECHS GDC Laboratory.</p></div>
      <button type="button" data-external-close aria-label="Close external calculator resources">×</button>
    </header>
    <nav class="gdc-external-tabs" aria-label="External GDC resources">
      <button type="button" class="active" data-external-tab="practice">TI‑84 Online Practice</button>
      <button type="button" data-external-tab="official">Official TI Tools</button>
      <button type="button" data-external-tab="guidance">Classroom Guidance</button>
    </nav>
    <div class="gdc-external-content">
      <section class="gdc-external-pane active" data-external-pane="practice">
        <div class="gdc-third-party-notice"><b>Third-party practice tool</b><span>This calculator is hosted by ti84calc.com, requires internet access and is not an official Texas Instruments product. Do not enter personal information.</span></div>
        <div class="gdc-embed-toolbar"><div><span>TI‑84 ONLINE PRACTICE</span><b>Calculator simulator</b></div><div><button type="button" id="gdc-load-external">Load calculator</button><a href="${THIRD_PARTY_URL}" target="_blank" rel="noopener noreferrer">Open in new tab</a></div></div>
        <div class="gdc-embed-stage" id="gdc-embed-stage">
          <div class="gdc-embed-placeholder"><span>▣</span><h3>Load only when needed</h3><p>The external calculator is not downloaded until you press the button above.</p><button type="button" id="gdc-load-external-placeholder">Load TI‑84 practice</button></div>
          <iframe title="Third-party TI-84 online practice calculator" data-src="${THIRD_PARTY_URL}" src="about:blank" loading="lazy" allow="fullscreen; clipboard-read; clipboard-write" allowfullscreen sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups allow-modals allow-downloads" referrerpolicy="strict-origin-when-cross-origin"></iframe>
        </div>
        <div class="gdc-external-fallback"><span>If the embedded calculator is blocked or does not load, use “Open in new tab.”</span><button type="button" id="gdc-return-echs">Return to ECHS GDC Lab</button></div>
      </section>

      <section class="gdc-external-pane" data-external-pane="official">
        <div class="gdc-official-hero"><div class="gdc-ti-wordmark">TI</div><div><span>OFFICIAL TEXAS INSTRUMENTS RESOURCES</span><h3>Licensed software, online calculator and guidebooks</h3><p>These links open on the official Texas Instruments Education website.</p></div></div>
        <div class="gdc-official-grid">
          <a href="${TI_SOFTWARE_URL}" target="_blank" rel="noopener noreferrer"><span>DOWNLOADS</span><b>Software, OS updates and apps</b><p>Find TI Connect, operating systems, apps and licensed emulator software.</p><small>Open official software search ↗</small></a>
          <a href="${TI_ONLINE_URL}" target="_blank" rel="noopener noreferrer"><span>ONLINE CALCULATOR</span><b>TI‑84 Plus CE online calculator</b><p>Official browser-based calculator access. A TI account and active subscription may be required.</p><small>Open official calculator overview ↗</small></a>
          <a href="${TI_GUIDE_URL}" target="_blank" rel="noopener noreferrer"><span>GUIDEBOOK</span><b>TI‑84 Plus CE online eGuide</b><p>Official instructions for graphs, matrices, equations, apps, modes and troubleshooting.</p><small>Open official eGuide ↗</small></a>
        </div>
        <div class="gdc-license-note"><b>Licensing and assessment note</b><p>Official TI online and emulator products may require a school or individual license. Browser-based calculators should be used for classroom learning and practice only unless the assessment rules explicitly allow them.</p></div>
      </section>

      <section class="gdc-external-pane" data-external-pane="guidance">
        <div class="gdc-guidance-grid">
          <article><span>1</span><div><b>Learn with the ECHS GDC</b><p>Use the built-in systems, polynomial, intersection and matrix workspaces. They are aligned directly with Lesson 1.6.</p></div></article>
          <article><span>2</span><div><b>Practise the physical-key workflow</b><p>Use the embedded third-party TI‑84 simulator when you need familiar keypad practice.</p></div></article>
          <article><span>3</span><div><b>Record transparent evidence</b><p>Return to the ECHS evidence panel and state the problem, entry, settings, output, independent check and interpretation.</p></div></article>
          <article><span>4</span><div><b>Follow exam rules</b><p>Online calculators and external websites are not substitutes for an approved handheld calculator during a controlled assessment.</p></div></article>
        </div>
        <button class="gdc-guidance-return" type="button" id="gdc-guidance-return">Open ECHS GDC Laboratory</button>
      </section>
    </div>
  </div>`;
  return element;
}

function build(){
  if($('#gdc-external-tools'))return;
  host=externalPanel();
  document.body.append(host);
  frame=$('iframe',host);
  $$('[data-external-close]',host).forEach(node=>node.addEventListener('click',close));
  $$('[data-external-tab]',host).forEach(button=>button.addEventListener('click',()=>selectTab(button.dataset.externalTab)));
  $('#gdc-load-external',host)?.addEventListener('click',loadFrame);
  $('#gdc-load-external-placeholder',host)?.addEventListener('click',loadFrame);
  $('#gdc-return-echs',host)?.addEventListener('click',returnToECHS);
  $('#gdc-guidance-return',host)?.addEventListener('click',returnToECHS);
  frame?.addEventListener('load',()=>{
    if(!frameLoaded||frame.src==='about:blank')return;
    $('#gdc-embed-stage',host)?.classList.add('loaded');
    $('#gdc-load-external',host).textContent='Reload calculator';
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&host?.classList.contains('open')){event.preventDefault();close();}
  });
  attachLaunchers();
}

function attachLaunchers(){
  const gdcDialog=$('.echs-gdc-dialog');
  if(gdcDialog&&!$('.gdc-connected-resources',gdcDialog)){
    const head=$('.gdc-dialog-head',gdcDialog);
    const button=document.createElement('button');
    button.type='button';button.className='gdc-connected-resources';button.innerHTML='<span>↗</span><b>TI‑84 & Official TI</b>';
    button.addEventListener('click',()=>open('practice'));
    head?.insertBefore(button,$('.gdc-close',head));
  }
  const routebar=$('.routebar');
  if(routebar&&!$('.gdc-route-resource',routebar)){
    const button=document.createElement('button');
    button.type='button';button.className='gdc-route-resource';button.innerHTML='<span>▣</span> GDC Tools';button.addEventListener('click',()=>open('practice'));
    routebar.append(button);
  }
}

function selectTab(tab){
  $$('[data-external-tab]',host).forEach(button=>button.classList.toggle('active',button.dataset.externalTab===tab));
  $$('[data-external-pane]',host).forEach(pane=>pane.classList.toggle('active',pane.dataset.externalPane===tab));
}

function loadFrame(){
  if(!frame)return;
  frameLoaded=true;
  $('#gdc-embed-stage',host)?.classList.add('loading');
  frame.src=frame.dataset.src;
  setTimeout(()=>$('#gdc-embed-stage',host)?.classList.remove('loading'),9000);
}

function open(tab='practice'){
  build();selectTab(tab);previousFocus=document.activeElement;
  host.classList.add('open');host.setAttribute('aria-hidden','false');document.body.classList.add('gdc-external-open');
  $('[data-external-close]',host)?.focus();
}
function close(){
  if(!host)return;host.classList.remove('open');host.setAttribute('aria-hidden','true');document.body.classList.remove('gdc-external-open');
  previousFocus?.focus?.();
}
function returnToECHS(){
  close();
  const launch=$('#echs-gdc-launch');
  if(launch){launch.click();return;}
  document.dispatchEvent(new CustomEvent('echs:gdc:open'));
}

function init(){
  build();
  new MutationObserver(()=>attachLaunchers()).observe(document.body,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();

data.gdcLab=Object.assign({},data.gdcLab,{
  externalResourcesRelease:'6.1.1',
  thirdPartyPractice:{provider:'ti84calc.com',url:THIRD_PARTY_URL,embedded:true,lazy:true,officialTI:false},
  officialTI:{softwareSearch:TI_SOFTWARE_URL,onlineCalculator:TI_ONLINE_URL,eGuide:TI_GUIDE_URL,embedded:false},
  privacyDesign:'external iframe loads only after explicit learner action',
  masteryPolicy:'external calculator output is not mastery evidence without ECHS setup, verification and interpretation'
});
})();
