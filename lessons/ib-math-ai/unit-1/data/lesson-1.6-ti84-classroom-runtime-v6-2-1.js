(function(){
'use strict';

if(window.__ECHS_TI84_ORIGINAL_ADD_EVENT_LISTENER__){
  document.addEventListener=window.__ECHS_TI84_ORIGINAL_ADD_EVENT_LISTENER__;
  delete window.__ECHS_TI84_ORIGINAL_ADD_EVENT_LISTENER__;
}

const data=window.LESSON_DATA;
const workflows=window.ECHS_TI84_CLASSROOM_WORKFLOWS;
if(!data||String(data.lesson?.number)!=='1.6'||!workflows)return;

const SIMULATOR_URL='https://ti84calc.com/ti84calc';
const STORAGE_KEY='echs:ib-ai:u1:1.6:ti84-classroom';
const $=(selector,root=document)=>root.querySelector(selector);
const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const display=value=>`<div class="ti84-display-math" data-ti84-tex="${esc(value)}" data-ti84-display="1"></div>`;
const slideWorkflow={
  'Opening problem · can every calculator answer be trusted?':'system-3x3',
  'Worked example · solve and verify a 2×2 system':'system-2x2',
  'Coefficient order is part of the mathematics':'system-3x3',
  'Worked example · all real roots of a cubic':'cubic-roots',
  'Worked example · exact intersections':'exact-intersections',
  'Student turn · numerical intersection and graph window':'numerical-intersection',
  'Worked example · verify a rounded system solution':'rounded-rref'
};

let host=null,frame=null,previousFocus=null,frameLoaded=false;
let activeId='system-2x2',mode='teacher',manualIndex=0,tiIndex=0,revealAnswer=false;

function renderMath(root){
  if(!window.katex)return;
  $$('[data-ti84-tex]',root).forEach(node=>{
    try{node.innerHTML=window.katex.renderToString(node.dataset.ti84Tex,{displayMode:node.dataset.ti84Display==='1',throwOnError:false,strict:'ignore'});}catch(_){node.textContent=node.dataset.ti84Tex;}
  });
}
function restore(){try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');if(workflows[saved.activeId])activeId=saved.activeId;if(['teacher','follow','drill'].includes(saved.mode))mode=saved.mode;}catch(_){}}
function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify({activeId,mode,manualIndex,tiIndex}));}catch(_){}}

function panel(){
  const element=document.createElement('section');
  element.id='ti84-classroom-coach';element.className='ti84-classroom-coach';element.setAttribute('aria-hidden','true');
  element.innerHTML=`<div class="ti84-coach-backdrop" data-ti84-close></div><div class="ti84-coach-dialog" role="dialog" aria-modal="true" aria-labelledby="ti84-coach-title">
  <header class="ti84-coach-head"><div><span>ECHS · EXAM CALCULATOR TRAINING</span><h2 id="ti84-coach-title">TI‑84 Classroom Practice</h2><p>Manual mathematics first, then the exact calculator workflow, verification and IB communication.</p></div><button type="button" data-ti84-close aria-label="Close TI-84 classroom practice">×</button></header>
  <div class="ti84-coach-toolbar"><label><span>Paired example</span><select id="ti84-workflow-select"></select></label><div class="ti84-mode-switch" role="group" aria-label="TI-84 classroom mode"><button type="button" class="active" data-ti84-mode="teacher">Teacher demo</button><button type="button" data-ti84-mode="follow">Students follow</button><button type="button" data-ti84-mode="drill">Exam drill</button></div><button type="button" class="ti84-reset" id="ti84-reset">Reset example</button></div>
  <div class="ti84-coach-grid"><section class="ti84-method-panel" aria-label="Manual method"><div class="ti84-panel-label"><span>1</span><b>Manual mathematics</b></div><div id="ti84-manual-content"></div></section><section class="ti84-procedure-panel" aria-label="TI-84 procedure"><div class="ti84-panel-label"><span>2</span><b>TI‑84 key sequence</b></div><div id="ti84-procedure-content"></div></section><section class="ti84-simulator-panel" aria-label="TI-84 online simulator"><div class="ti84-panel-label"><span>3</span><b>Practise on the simulator</b></div><div class="ti84-simulator-toolbar"><button type="button" id="ti84-load-simulator">Load simulator</button><a href="${SIMULATOR_URL}" target="_blank" rel="noopener noreferrer">Open in new tab ↗</a></div><div class="ti84-simulator-stage" id="ti84-simulator-stage"><div class="ti84-simulator-placeholder"><b>TI‑84 Online Practice</b><span>Load the simulator, then mirror every projected step on the physical calculator in your hand.</span><small>Third-party tool hosted by ti84calc.com. Do not enter personal information.</small></div><iframe title="TI-84 online practice simulator used for classroom demonstration" src="about:blank" data-src="${SIMULATOR_URL}" loading="lazy" sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups allow-modals allow-downloads" allow="fullscreen; clipboard-read; clipboard-write" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div></section><section class="ti84-evidence-panel" id="ti84-evidence-content" aria-label="Verification and IB conclusion"></section></div>
  </div>`;
  return element;
}

function build(){
  if(host)return;
  host=panel();document.body.append(host);frame=$('iframe',host);
  const select=$('#ti84-workflow-select',host);
  Object.entries(workflows).forEach(([id,item])=>{const option=document.createElement('option');option.value=id;option.textContent=`${item.code} · ${item.title}`;select.append(option);});
  select.value=activeId;select.addEventListener('change',()=>setWorkflow(select.value));
  $$('[data-ti84-mode]',host).forEach(button=>button.addEventListener('click',()=>setMode(button.dataset.ti84Mode)));
  $$('[data-ti84-close]',host).forEach(node=>node.addEventListener('click',close));
  $('#ti84-reset',host).addEventListener('click',reset);$('#ti84-load-simulator',host).addEventListener('click',loadSimulator);
  frame.addEventListener('load',()=>{if(frameLoaded)$('#ti84-simulator-stage',host)?.classList.add('loaded');});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&host.classList.contains('open')){event.preventDefault();close();}});
  render();
}
function setWorkflow(id){if(!workflows[id])return;activeId=id;manualIndex=0;tiIndex=0;revealAnswer=false;$('#ti84-workflow-select',host).value=id;save();render();}
function setMode(value){mode=['teacher','follow','drill'].includes(value)?value:'teacher';manualIndex=0;tiIndex=0;revealAnswer=false;$$('[data-ti84-mode]',host).forEach(button=>button.classList.toggle('active',button.dataset.ti84Mode===mode));save();render();}
function reset(){manualIndex=0;tiIndex=0;revealAnswer=false;save();render();}

function manualHTML(item){
  const visible=mode==='follow'?item.manualSteps.length:mode==='teacher'?manualIndex+1:revealAnswer?item.manualSteps.length:0;
  return `<div class="ti84-problem"><span>${esc(item.group)} · ${item.code}</span><h3>${esc(item.prompt)}</h3>${display(item.math)}</div><div class="ti84-manual-steps">${item.manualSteps.map((step,index)=>`<article class="${index<visible?'revealed':'locked'}"><b>${index+1}</b><p>${index<visible?esc(step):'Complete this step on paper before revealing it.'}</p></article>`).join('')}</div><div class="ti84-step-controls"><button type="button" id="ti84-manual-prev" ${manualIndex===0?'disabled':''}>Previous</button><button type="button" id="ti84-manual-next" ${manualIndex>=item.manualSteps.length-1?'disabled':''}>Reveal next manual step</button></div>`;
}
function procedureHTML(item){
  const visible=mode==='drill'&&!revealAnswer?0:tiIndex+1;const current=item.tiSteps[Math.min(tiIndex,item.tiSteps.length-1)];
  return `<div class="ti84-current-instruction"><span>STEP ${tiIndex+1} OF ${item.tiSteps.length}</span><h3>${esc(current.label)}</h3><p>${mode==='drill'&&!revealAnswer?'Choose the required keys on your physical calculator before revealing the route.':esc(current.detail)}</p></div><div class="ti84-key-sequence">${item.tiSteps.map((step,index)=>`<article class="${index===tiIndex?'current':''} ${index<visible?'revealed':'locked'}"><div class="ti84-key-row">${index<visible?step.keys.map(key=>`<kbd>${esc(key)}</kbd>`).join('<i>→</i>'):'<span class="ti84-hidden-route">key route hidden</span>'}</div><b>${index<visible?esc(step.label):`Step ${index+1}`}</b></article>`).join('')}</div><div class="ti84-entry-card"><span>Calculator entry</span>${mode==='drill'&&!revealAnswer?'<b>Hidden during exam drill</b>':display(item.entry)}</div><div class="ti84-step-controls"><button type="button" id="ti84-ti-prev" ${tiIndex===0?'disabled':''}>Previous key step</button><button type="button" id="ti84-ti-next" ${tiIndex>=item.tiSteps.length-1?'disabled':''}>Next key step</button></div><div class="ti84-alt-route"><b>Handheld shortcut or note</b><p>${esc(item.handheldAlternative)}</p></div>`;
}
function evidenceHTML(item){
  const show=mode!=='drill'||revealAnswer;
  return `<div class="ti84-evidence-flow"><article><span>Expected output</span>${show?display(item.output):'<b>Hidden until the drill is complete</b>'}</article><article><span>Independent verification</span><p>${show?esc(item.verification):'Verify with substitution, exact algebra or residuals before revealing.'}</p></article><article class="ib"><span>IB exam communication</span><p>${show?esc(item.ibStatement):'Write a complete calculator-supported conclusion in your own words.'}</p></article></div><div class="ti84-evidence-actions">${mode==='drill'?'<button type="button" id="ti84-reveal-answer">Reveal output and model statement</button>':''}<button type="button" id="ti84-copy-statement" ${show?'':'disabled'}>Copy model statement</button></div>`;
}
function render(){
  if(!host)return;const item=workflows[activeId];
  $('#ti84-manual-content',host).innerHTML=manualHTML(item);$('#ti84-procedure-content',host).innerHTML=procedureHTML(item);$('#ti84-evidence-content',host).innerHTML=evidenceHTML(item);
  $('#ti84-manual-prev',host)?.addEventListener('click',()=>{manualIndex=Math.max(0,manualIndex-1);save();render();});$('#ti84-manual-next',host)?.addEventListener('click',()=>{manualIndex=Math.min(item.manualSteps.length-1,manualIndex+1);save();render();});$('#ti84-ti-prev',host)?.addEventListener('click',()=>{tiIndex=Math.max(0,tiIndex-1);save();render();});$('#ti84-ti-next',host)?.addEventListener('click',()=>{tiIndex=Math.min(item.tiSteps.length-1,tiIndex+1);save();render();});$('#ti84-reveal-answer',host)?.addEventListener('click',()=>{revealAnswer=true;render();});$('#ti84-copy-statement',host)?.addEventListener('click',async event=>{try{await navigator.clipboard.writeText(item.ibStatement);event.currentTarget.textContent='Copied';}catch(_){event.currentTarget.textContent='Copy unavailable';}});renderMath(host);
}
function loadSimulator(){if(!frame)return;frameLoaded=true;$('#ti84-simulator-stage',host)?.classList.add('loading');frame.src=frame.dataset.src;$('#ti84-load-simulator',host).textContent='Reload simulator';setTimeout(()=>$('#ti84-simulator-stage',host)?.classList.remove('loading'),9000);}
function open(id=activeId){build();if(workflows[id])setWorkflow(id);previousFocus=document.activeElement;host.classList.add('open');host.setAttribute('aria-hidden','false');document.body.classList.add('ti84-coach-open');$('[data-ti84-close]',host)?.focus();}
function close(){if(!host)return;host.classList.remove('open');host.setAttribute('aria-hidden','true');document.body.classList.remove('ti84-coach-open');previousFocus?.focus?.();}

function attachLauncher(){
  const routebar=$('.routebar');if(!routebar||$('.ti84-classroom-launch',routebar))return;
  const button=document.createElement('button');button.type='button';button.className='ti84-classroom-launch';button.innerHTML='<span>84</span><b>TI‑84 Classroom</b>';button.addEventListener('click',()=>open());routebar.append(button);
}
function scanSlide(){
  const app=$('#app');if(!app)return;const title=$('.slide-title',app)?.textContent?.trim();const workflowId=slideWorkflow[title];const body=$('.slide-body',app);if(!workflowId||!body||$('.ti84-paired-strip',body))return;
  const item=workflows[workflowId],strip=document.createElement('aside');strip.className='ti84-paired-strip';strip.innerHTML=`<div><span>PAIRED EXAM PRACTICE</span><b>Manual method + physical TI‑84 workflow</b><small>Project the steps, then students mirror them on the calculator in their hands.</small></div><button type="button"><i>84</i> Open ${esc(item.code)} classroom demo</button>`;strip.querySelector('button').addEventListener('click',()=>open(workflowId));body.append(strip);
}
function upgradeConnectedResources(){
  const route=$('.gdc-route-resource');if(route){route.innerHTML='<span>▣</span> TI‑84 Simulator';route.setAttribute('title','Open the embedded TI-84 simulator and official resources');}
  const heading=$('.gdc-external-head h2');if(heading)heading.textContent='TI‑84 Simulator & Official TI Tools';
  const guidance=$('.gdc-guidance-grid');if(guidance){guidance.innerHTML=`<article><span>1</span><div><b>Solve manually first</b><p>Students write the algebraic structure before touching the calculator.</p></div></article><article><span>2</span><div><b>Mirror the projected TI‑84 route</b><p>The teacher advances one key step while students reproduce it on their physical calculators.</p></div></article><article><span>3</span><div><b>Verify independently</b><p>Substitute, factor, compare both sides or calculate residuals.</p></div></article><article><span>4</span><div><b>Write the IB conclusion</b><p>Record the entered objects, settings, complete output, verification and contextual meaning.</p></div></article>`;}
  const pane=$('[data-external-pane="guidance"]');if(pane&&!$('.ti84-guidance-open',pane)){const button=document.createElement('button');button.type='button';button.className='gdc-guidance-return ti84-guidance-open';button.textContent='Open TI‑84 Classroom Practice';button.addEventListener('click',()=>{$('[data-external-close]')?.click();open();});pane.append(button);}
}
function init(){
  restore();build();attachLauncher();upgradeConnectedResources();scanSlide();
  const app=$('#app');if(app)new MutationObserver(()=>scanSlide()).observe(app,{childList:true,subtree:true});
  document.addEventListener('echs:ti84:open',event=>open(event.detail?.workflow));
  data.ti84Classroom=Object.assign({},data.ti84Classroom,{runtimeRelease:'6.2.1',stableAppObserver:true,simulatorPrimary:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
