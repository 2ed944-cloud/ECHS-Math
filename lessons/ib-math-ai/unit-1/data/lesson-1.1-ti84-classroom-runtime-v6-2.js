(function(){
'use strict';

const data=window.LESSON_DATA;
const workflows=window.ECHS_TI84_CLASSROOM_WORKFLOWS;
if(!data||String(data.lesson?.number)!=='1.1'||!workflows)return;

const SIMULATOR_URL='https://ti84calc.com/ti84calc';
const STORAGE_KEY='echs:ib-ai:u1:1.1:ti84-classroom';
const $=(selector,root=document)=>root.querySelector(selector);
const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const display=value=>`<div class="ti84-display-math" data-ti84-tex="${esc(value)}" data-ti84-display="1"></div>`;

const slideWorkflow={
  'Calculator fluency':'ee-operation',
  'The anatomy of normalized standard form':'ee-operation',
  'Premature rounding and guard digits':'guard-digits',
  'Rounding in scientific and contextual data':'sci-display'
};

let host=null;
let frame=null;
let previousFocus=null;
let frameRequested=false;
let activeId='ee-operation';
let mode='teacher';
let manualIndex=0;
let tiIndex=0;
let revealAnswer=false;

function renderMath(root){
  if(!window.katex)return;
  $$('[data-ti84-tex]',root).forEach(node=>{
    try{
      node.innerHTML=window.katex.renderToString(node.dataset.ti84Tex,{displayMode:node.dataset.ti84Display==='1',throwOnError:false,strict:'ignore'});
    }catch(_){node.textContent=node.dataset.ti84Tex;}
  });
}
function restore(){
  try{
    const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
    if(workflows[saved.activeId])activeId=saved.activeId;
    if(['teacher','follow','drill'].includes(saved.mode))mode=saved.mode;
  }catch(_){}
}
function save(){
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify({activeId,mode,manualIndex,tiIndex}));}catch(_){}
}

function buildPanel(){
  const element=document.createElement('section');
  element.id='ti84-classroom-coach';
  element.className='ti84-classroom-coach';
  element.setAttribute('aria-hidden','true');
  element.innerHTML=`<div class="ti84-coach-backdrop" data-ti84-close></div>
  <div class="ti84-coach-dialog" role="dialog" aria-modal="true" aria-labelledby="ti84-coach-title">
    <header class="ti84-coach-head"><div><span>ECHS · LESSON 1.1 CALCULATOR TRAINING</span><h2 id="ti84-coach-title">TI‑84 Classroom · Scientific Notation & Accuracy</h2><p>Estimate first, enter transparently, retain guard digits, report in IB notation and verify.</p></div><button type="button" data-ti84-close aria-label="Close TI-84 classroom practice">×</button></header>
    <div class="ti84-coach-toolbar"><label><span>Paired example</span><select id="ti84-workflow-select"></select></label><div class="ti84-mode-switch" role="group" aria-label="TI-84 classroom mode"><button type="button" class="active" data-ti84-mode="teacher">Teacher demo</button><button type="button" data-ti84-mode="follow">Students follow</button><button type="button" data-ti84-mode="drill">Exam drill</button></div><button type="button" class="ti84-reset" id="ti84-reset">Reset example</button></div>
    <div class="ti84-coach-grid">
      <section class="ti84-method-panel" aria-label="Mathematical method"><div class="ti84-panel-label"><span>1</span><b>Mathematics and estimate</b></div><div id="ti84-manual-content"></div></section>
      <section class="ti84-procedure-panel" aria-label="TI-84 procedure"><div class="ti84-panel-label"><span>2</span><b>TI‑84 key sequence</b></div><div id="ti84-procedure-content"></div></section>
      <section class="ti84-simulator-panel" aria-label="TI-84 online simulator"><div class="ti84-panel-label"><span>3</span><b>Practise on the simulator</b></div><div class="ti84-simulator-toolbar"><button type="button" id="ti84-load-simulator">Load simulator</button><a href="${SIMULATOR_URL}" target="_blank" rel="noopener noreferrer">Open in new tab ↗</a></div><div class="ti84-simulator-stage" id="ti84-simulator-stage"><div class="ti84-simulator-placeholder"><b>TI‑84 Online Practice</b><span>Load the simulator, then mirror each projected step on the physical calculator.</span><small>Third-party tool hosted by ti84calc.com. Do not enter personal information.</small></div><iframe title="TI-84 online simulator for Lesson 1.1 classroom practice" src="about:blank" data-src="${SIMULATOR_URL}" loading="lazy" sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups allow-modals allow-downloads" allow="fullscreen; clipboard-read; clipboard-write" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div></section>
      <section class="ti84-evidence-panel" id="ti84-evidence-content" aria-label="Verification and IB conclusion"></section>
    </div>
  </div>`;
  return element;
}

function build(){
  if(host)return;
  host=buildPanel();
  document.body.append(host);
  frame=$('iframe',host);
  const select=$('#ti84-workflow-select',host);
  Object.entries(workflows).forEach(([id,item])=>{
    const option=document.createElement('option');
    option.value=id;
    option.textContent=`${item.code} · ${item.title}`;
    select.append(option);
  });
  select.value=activeId;
  select.addEventListener('change',()=>setWorkflow(select.value));
  $$('[data-ti84-mode]',host).forEach(button=>button.addEventListener('click',()=>setMode(button.dataset.ti84Mode)));
  $$('[data-ti84-close]',host).forEach(node=>node.addEventListener('click',close));
  $('#ti84-reset',host).addEventListener('click',reset);
  $('#ti84-load-simulator',host).addEventListener('click',loadSimulator);
  frame.addEventListener('load',()=>{
    if(frameRequested){
      $('#ti84-simulator-stage',host)?.classList.remove('loading');
      $('#ti84-simulator-stage',host)?.classList.add('loaded');
    }
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&host.classList.contains('open')){event.preventDefault();close();}
  });
  render();
}
function setWorkflow(id){
  if(!workflows[id])return;
  activeId=id;manualIndex=0;tiIndex=0;revealAnswer=false;
  $('#ti84-workflow-select',host).value=id;
  save();render();
}
function setMode(value){
  mode=['teacher','follow','drill'].includes(value)?value:'teacher';
  manualIndex=0;tiIndex=0;revealAnswer=false;
  $$('[data-ti84-mode]',host).forEach(button=>button.classList.toggle('active',button.dataset.ti84Mode===mode));
  save();render();
}
function reset(){manualIndex=0;tiIndex=0;revealAnswer=false;save();render();}

function manualHTML(item){
  const visible=mode==='follow'?item.manualSteps.length:mode==='teacher'?manualIndex+1:revealAnswer?item.manualSteps.length:0;
  return `<div class="ti84-problem"><span>${esc(item.group)} · ${esc(item.code)}</span><h3>${esc(item.prompt)}</h3>${display(item.math)}</div><div class="ti84-manual-steps">${item.manualSteps.map((step,index)=>`<article class="${index<visible?'revealed':'locked'}"><b>${index+1}</b><p>${index<visible?esc(step):'Complete this step on paper before revealing it.'}</p></article>`).join('')}</div><div class="ti84-step-controls"><button type="button" id="ti84-manual-prev" ${manualIndex===0?'disabled':''}>Previous</button><button type="button" id="ti84-manual-next" ${manualIndex>=item.manualSteps.length-1?'disabled':''}>Reveal next step</button></div>`;
}
function procedureHTML(item){
  const visible=mode==='drill'&&!revealAnswer?0:tiIndex+1;
  const current=item.tiSteps[Math.min(tiIndex,item.tiSteps.length-1)];
  return `<div class="ti84-current-instruction"><span>STEP ${tiIndex+1} OF ${item.tiSteps.length}</span><h3>${esc(current.label)}</h3><p>${mode==='drill'&&!revealAnswer?'Choose the keys on your physical calculator before revealing the route.':esc(current.detail)}</p></div><div class="ti84-key-sequence">${item.tiSteps.map((step,index)=>`<article class="${index===tiIndex?'current':''} ${index<visible?'revealed':'locked'}"><div class="ti84-key-row">${index<visible?step.keys.map(key=>`<kbd>${esc(key)}</kbd>`).join('<i>→</i>'):'<span class="ti84-hidden-route">key route hidden</span>'}</div><b>${index<visible?esc(step.label):`Step ${index+1}`}</b></article>`).join('')}</div><div class="ti84-entry-card"><span>Calculator entry/display</span>${mode==='drill'&&!revealAnswer?'<b>Hidden during exam drill</b>':display(item.entry)}</div><div class="ti84-step-controls"><button type="button" id="ti84-ti-prev" ${tiIndex===0?'disabled':''}>Previous key step</button><button type="button" id="ti84-ti-next" ${tiIndex>=item.tiSteps.length-1?'disabled':''}>Next key step</button></div><div class="ti84-alt-route"><b>Physical calculator note</b><p>${esc(item.handheldAlternative)}</p></div>`;
}
function evidenceHTML(item){
  const show=mode!=='drill'||revealAnswer;
  return `<div class="ti84-evidence-flow"><article><span>Expected output</span>${show?display(item.output):'<b>Hidden until the drill is complete</b>'}</article><article><span>Independent verification</span><p>${show?esc(item.verification):'Use an estimate, inverse operation, units or bounds before revealing.'}</p></article><article class="ib"><span>IB exam communication</span><p>${show?esc(item.ibStatement):'Write a complete calculator-supported conclusion in mathematical notation.'}</p></article></div><div class="ti84-evidence-actions">${mode==='drill'?'<button type="button" id="ti84-reveal-answer">Reveal output and model statement</button>':''}<button type="button" id="ti84-copy-statement" ${show?'':'disabled'}>Copy model statement</button></div>`;
}
function render(){
  if(!host)return;
  const item=workflows[activeId];
  $('#ti84-manual-content',host).innerHTML=manualHTML(item);
  $('#ti84-procedure-content',host).innerHTML=procedureHTML(item);
  $('#ti84-evidence-content',host).innerHTML=evidenceHTML(item);
  $('#ti84-manual-prev',host)?.addEventListener('click',()=>{manualIndex=Math.max(0,manualIndex-1);save();render();});
  $('#ti84-manual-next',host)?.addEventListener('click',()=>{manualIndex=Math.min(item.manualSteps.length-1,manualIndex+1);save();render();});
  $('#ti84-ti-prev',host)?.addEventListener('click',()=>{tiIndex=Math.max(0,tiIndex-1);save();render();});
  $('#ti84-ti-next',host)?.addEventListener('click',()=>{tiIndex=Math.min(item.tiSteps.length-1,tiIndex+1);save();render();});
  $('#ti84-reveal-answer',host)?.addEventListener('click',()=>{revealAnswer=true;render();});
  $('#ti84-copy-statement',host)?.addEventListener('click',async event=>{
    try{await navigator.clipboard.writeText(item.ibStatement);event.currentTarget.textContent='Copied';}
    catch(_){event.currentTarget.textContent='Copy unavailable';}
  });
  renderMath(host);
}
function loadSimulator(){
  if(!frame)return;
  frameRequested=true;
  const stage=$('#ti84-simulator-stage',host);
  stage?.classList.remove('loaded');stage?.classList.add('loading');
  frame.src=frame.dataset.src;
  $('#ti84-load-simulator',host).textContent='Reload simulator';
  setTimeout(()=>stage?.classList.remove('loading'),10000);
}
function open(id=activeId){
  build();
  if(workflows[id])setWorkflow(id);
  previousFocus=document.activeElement;
  host.classList.add('open');
  host.setAttribute('aria-hidden','false');
  document.body.classList.add('ti84-coach-open');
  $('[data-ti84-close]',host)?.focus();
}
function close(){
  if(!host)return;
  host.classList.remove('open');
  host.setAttribute('aria-hidden','true');
  document.body.classList.remove('ti84-coach-open');
  previousFocus?.focus?.();
}

function attachLauncher(){
  const routebar=$('.routebar');
  if(!routebar||$('.ti84-classroom-launch',routebar))return;
  const button=document.createElement('button');
  button.type='button';button.className='ti84-classroom-launch';
  button.innerHTML='<span>84</span><b>TI‑84 Classroom</b>';
  button.title='Open lesson-specific TI-84 classroom practice and simulator';
  button.addEventListener('click',()=>open());
  routebar.append(button);
}
function currentWorkflow(title){
  if(slideWorkflow[title])return slideWorkflow[title];
  if(/scientific notation.*(?:operation|calculation)|normalized standard form/i.test(title))return'ee-operation';
  if(/guard digits|premature rounding|false precision/i.test(title))return'guard-digits';
  if(/calculator.*display|display.*scientific|contextual data/i.test(title))return'sci-display';
  return null;
}
function scanSlide(){
  const app=$('#app');
  if(!app)return;
  const title=$('.slide-title',app)?.textContent?.trim()||'';
  const workflowId=currentWorkflow(title);
  const body=$('.slide-body',app);
  if(!workflowId||!body||$('.ti84-paired-strip',body))return;
  const item=workflows[workflowId];
  const strip=document.createElement('aside');
  strip.className='ti84-paired-strip';
  strip.innerHTML=`<div><span>LESSON 1.1 · PAIRED CALCULATOR PRACTICE</span><b>Estimate + physical TI‑84 workflow + IB report</b><small>The simulator supports rehearsal; the written mathematics remains the evidence.</small></div><button type="button"><i>84</i> Open ${esc(item.code)} classroom demo</button>`;
  strip.querySelector('button').addEventListener('click',()=>open(workflowId));
  body.append(strip);
}
function init(){
  restore();build();attachLauncher();scanSlide();
  const app=$('#app');
  if(app)new MutationObserver(scanSlide).observe(app,{childList:true,subtree:true});
  document.addEventListener('echs:ti84:open',event=>open(event.detail?.workflow));
  data.ti84Classroom=Object.assign({},data.ti84Classroom,{runtimeRelease:'6.2.0',lazySimulator:true,lessonSpecific:true});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
