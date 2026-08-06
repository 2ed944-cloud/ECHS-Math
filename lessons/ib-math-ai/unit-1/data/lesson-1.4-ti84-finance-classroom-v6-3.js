(function(){
'use strict';
const data=window.LESSON_DATA;
const workflows=window.ECHS_TI84_FINANCE_WORKFLOWS;
if(!data||String(data.lesson?.number)!=='1.4'||!workflows)return;

const SIMULATOR_URL='https://ti84calc.com/ti84calc';
const STORAGE_KEY='echs:ib-ai:u1:1.4:ti84-finance-classroom';
const $=(selector,root=document)=>root.querySelector(selector);
const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const tex=value=>`<div class="fin84-display-math" data-fin84-tex="${esc(value)}" data-fin84-display="1"></div>`;
const slideWorkflow={
  'Worked example · nominal to effective':'effective-rate',
  'Interactive compound-interest explorer':'compound-lump',
  'Worked example · monthly savings plan':'annuity-fv',
  'Worked example · retirement deposits at the beginning of each year':'annuity-due',
  'Worked example · retirement income fund':'withdrawal-pmt',
  'TVM variables encode a cash-flow equation':'loan-payment',
  'A complete finance-solver setup':'loan-payment',
  'Worked example · level monthly loan payment':'loan-payment',
  'Worked example · first three payments':'loan-payment',
  'Worked example · verify balance two ways':'outstanding-balance',
  'Interactive annuity and loan explorer':'outstanding-balance'
};

let host=null,frame=null,previousFocus=null,frameLoaded=false;
let activeId='loan-payment',mode='teacher',manualIndex=0,tiIndex=0,revealAnswer=false;

function renderMath(root){
  if(!window.katex)return;
  $$('[data-fin84-tex]',root).forEach(node=>{
    try{node.innerHTML=window.katex.renderToString(node.dataset.fin84Tex,{displayMode:node.dataset.fin84Display==='1',throwOnError:false,strict:'ignore'});}
    catch(_){node.textContent=node.dataset.fin84Tex;}
  });
}
function restore(){
  try{
    const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
    if(workflows[saved.activeId])activeId=saved.activeId;
    if(['teacher','follow','drill'].includes(saved.mode))mode=saved.mode;
  }catch(_){}
}
function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify({activeId,mode,manualIndex,tiIndex}));}catch(_){}}

function panel(){
  const section=document.createElement('section');
  section.id='fin84-classroom';
  section.className='fin84-classroom';
  section.setAttribute('aria-hidden','true');
  section.innerHTML=`<div class="fin84-backdrop" data-fin84-close></div>
  <div class="fin84-dialog" role="dialog" aria-modal="true" aria-labelledby="fin84-title">
    <header class="fin84-head">
      <div><span>ECHS · FINANCIAL CALCULATOR TRAINING</span><h2 id="fin84-title">TI‑84 Finance Classroom</h2><p>Manual mathematics first, then Finance-menu setup, independent verification and IB communication.</p></div>
      <button type="button" data-fin84-close aria-label="Close TI-84 Finance Classroom">×</button>
    </header>
    <div class="fin84-toolbar">
      <label><span>Paired example</span><select id="fin84-workflow-select"></select></label>
      <div class="fin84-mode-switch" role="group" aria-label="TI-84 Finance classroom mode">
        <button type="button" class="active" data-fin84-mode="teacher">Teacher demo</button>
        <button type="button" data-fin84-mode="follow">Students follow</button>
        <button type="button" data-fin84-mode="drill">Exam drill</button>
      </div>
      <button type="button" class="fin84-reset" id="fin84-reset">Reset example</button>
    </div>
    <div class="fin84-grid">
      <section class="fin84-manual-panel" aria-label="Manual financial mathematics"><div class="fin84-panel-label"><span>1</span><b>Manual mathematics</b></div><div id="fin84-manual-content"></div></section>
      <section class="fin84-procedure-panel" aria-label="TI-84 Finance procedure"><div class="fin84-panel-label"><span>2</span><b>TI‑84 Finance keys</b></div><div id="fin84-procedure-content"></div></section>
      <section class="fin84-simulator-panel" aria-label="TI-84 online simulator"><div class="fin84-panel-label"><span>3</span><b>Practise on the simulator</b></div>
        <div class="fin84-simulator-toolbar"><button type="button" id="fin84-load-simulator">Load simulator</button><small>Mirror each projected step on the physical calculator.</small></div>
        <div class="fin84-simulator-stage" id="fin84-simulator-stage">
          <div class="fin84-simulator-placeholder"><b>TI‑84 Online Practice</b><span>The simulator is loaded only when requested.</span><small>Third-party tool hosted by ti84calc.com. Do not enter personal information.</small></div>
          <iframe title="TI-84 Plus CE finance practice simulator" src="about:blank" data-src="${SIMULATOR_URL}" loading="lazy" sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups allow-modals allow-downloads" allow="fullscreen; clipboard-read; clipboard-write" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>
        </div>
      </section>
      <section class="fin84-evidence-panel" id="fin84-evidence-content" aria-label="Verification and IB conclusion"></section>
    </div>
  </div>`;
  return section;
}

function build(){
  if(host)return;
  host=panel();
  document.body.append(host);
  frame=$('iframe',host);
  const select=$('#fin84-workflow-select',host);
  Object.entries(workflows).forEach(([id,item])=>{
    const option=document.createElement('option');
    option.value=id;
    option.textContent=`${item.code} · ${item.title}`;
    select.append(option);
  });
  select.value=activeId;
  select.addEventListener('change',()=>setWorkflow(select.value));
  $$('[data-fin84-mode]',host).forEach(button=>button.addEventListener('click',()=>setMode(button.dataset.fin84Mode)));
  $$('[data-fin84-close]',host).forEach(node=>node.addEventListener('click',close));
  $('#fin84-reset',host).addEventListener('click',reset);
  $('#fin84-load-simulator',host).addEventListener('click',loadSimulator);
  frame.addEventListener('load',()=>{if(frameLoaded)$('#fin84-simulator-stage',host)?.classList.add('loaded');});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&host.classList.contains('open')){event.preventDefault();close();}});
  render();
}
function setWorkflow(id){
  if(!workflows[id])return;
  activeId=id;manualIndex=0;tiIndex=0;revealAnswer=false;
  $('#fin84-workflow-select',host).value=id;
  save();render();
}
function setMode(value){
  mode=['teacher','follow','drill'].includes(value)?value:'teacher';
  manualIndex=0;tiIndex=0;revealAnswer=false;
  $$('[data-fin84-mode]',host).forEach(button=>button.classList.toggle('active',button.dataset.fin84Mode===mode));
  save();render();
}
function reset(){manualIndex=0;tiIndex=0;revealAnswer=false;save();render();}

function manualHTML(item){
  const visible=mode==='follow'?item.manualSteps.length:mode==='teacher'?manualIndex+1:revealAnswer?item.manualSteps.length:0;
  return `<div class="fin84-problem"><span>${esc(item.group)} · ${item.code}</span><h3>${esc(item.prompt)}</h3>${tex(item.math)}</div>
  <div class="fin84-manual-steps">${item.manualSteps.map((step,index)=>`<article class="${index<visible?'revealed':'locked'}"><b>${index+1}</b><p>${index<visible?esc(step):'Complete this step on paper before revealing it.'}</p></article>`).join('')}</div>
  <div class="fin84-step-controls"><button type="button" id="fin84-manual-prev" ${manualIndex===0?'disabled':''}>Previous</button><button type="button" id="fin84-manual-next" ${manualIndex>=item.manualSteps.length-1?'disabled':''}>Reveal next manual step</button></div>`;
}
function procedureHTML(item){
  const visible=mode==='drill'&&!revealAnswer?0:tiIndex+1;
  const current=item.tiSteps[Math.min(tiIndex,item.tiSteps.length-1)];
  return `<div class="fin84-current"><span>STEP ${tiIndex+1} OF ${item.tiSteps.length}</span><h3>${esc(current.label)}</h3><p>${mode==='drill'&&!revealAnswer?'Choose the required keys on the physical calculator before revealing the route.':esc(current.detail)}</p></div>
  <div class="fin84-key-sequence">${item.tiSteps.map((step,index)=>`<article class="${index===tiIndex?'current':''} ${index<visible?'revealed':'locked'}"><div class="fin84-key-row">${index<visible?step.keys.map(key=>`<kbd>${esc(key)}</kbd>`).join('<i>→</i>'):'<span class="fin84-hidden-route">key route hidden</span>'}</div><b>${index<visible?esc(step.label):`Step ${index+1}`}</b></article>`).join('')}</div>
  <div class="fin84-entry-card"><span>Calculator setup</span>${mode==='drill'&&!revealAnswer?'<b>Hidden during exam drill</b>':tex(item.entry)}</div>
  <div class="fin84-step-controls"><button type="button" id="fin84-ti-prev" ${tiIndex===0?'disabled':''}>Previous key step</button><button type="button" id="fin84-ti-next" ${tiIndex>=item.tiSteps.length-1?'disabled':''}>Next key step</button></div>
  <div class="fin84-alt-route"><b>Calculator note</b><p>${esc(item.handheldAlternative)}</p></div>`;
}
function evidenceHTML(item){
  const show=mode!=='drill'||revealAnswer;
  return `<div class="fin84-evidence-flow">
    <article><span>Expected output</span>${show?tex(item.output):'<b>Hidden until the drill is complete</b>'}</article>
    <article><span>Independent verification</span><p>${show?esc(item.verification):'Verify using a formula, one amortization row, a balance identity or a contribution check.'}</p></article>
    <article class="ib"><span>IB exam communication</span><p>${show?esc(item.ibStatement):'Write the entered variables, settings, complete output, verification and financial meaning.'}</p></article>
  </div>
  <div class="fin84-evidence-actions">${mode==='drill'?'<button type="button" id="fin84-reveal-answer">Reveal output and model statement</button>':''}<button type="button" id="fin84-copy-statement" ${show?'':'disabled'}>Copy model statement</button></div>`;
}
function render(){
  if(!host)return;
  const item=workflows[activeId];
  $('#fin84-manual-content',host).innerHTML=manualHTML(item);
  $('#fin84-procedure-content',host).innerHTML=procedureHTML(item);
  $('#fin84-evidence-content',host).innerHTML=evidenceHTML(item);
  $('#fin84-manual-prev',host)?.addEventListener('click',()=>{manualIndex=Math.max(0,manualIndex-1);save();render();});
  $('#fin84-manual-next',host)?.addEventListener('click',()=>{manualIndex=Math.min(item.manualSteps.length-1,manualIndex+1);save();render();});
  $('#fin84-ti-prev',host)?.addEventListener('click',()=>{tiIndex=Math.max(0,tiIndex-1);save();render();});
  $('#fin84-ti-next',host)?.addEventListener('click',()=>{tiIndex=Math.min(item.tiSteps.length-1,tiIndex+1);save();render();});
  $('#fin84-reveal-answer',host)?.addEventListener('click',()=>{revealAnswer=true;render();});
  $('#fin84-copy-statement',host)?.addEventListener('click',async event=>{
    try{await navigator.clipboard.writeText(item.ibStatement);event.currentTarget.textContent='Copied';}
    catch(_){event.currentTarget.textContent='Copy unavailable';}
  });
  renderMath(host);
}
function loadSimulator(){
  if(!frame)return;
  frameLoaded=true;
  const stage=$('#fin84-simulator-stage',host);
  stage?.classList.add('loading');
  frame.src=frame.dataset.src;
  $('#fin84-load-simulator',host).textContent='Reload simulator';
  setTimeout(()=>stage?.classList.remove('loading'),9000);
}
function open(id=activeId){
  build();
  document.dispatchEvent(new CustomEvent('echs:ti84-finance-inline-close'));
  if(workflows[id])setWorkflow(id);
  previousFocus=document.activeElement;
  host.classList.add('open');
  host.setAttribute('aria-hidden','false');
  document.body.classList.add('fin84-classroom-open');
  $('[data-fin84-close]',host)?.focus();
}
function close(){
  if(!host)return;
  host.classList.remove('open');
  host.setAttribute('aria-hidden','true');
  document.body.classList.remove('fin84-classroom-open');
  previousFocus?.focus?.();
}

function attachLauncher(){
  const routebar=$('.routebar');
  if(!routebar||$('.fin84-classroom-launch',routebar))return;
  const button=document.createElement('button');
  button.type='button';
  button.className='fin84-classroom-launch';
  button.innerHTML='<span>84</span><b>TI‑84 Finance Classroom</b>';
  button.addEventListener('click',()=>open());
  routebar.append(button);
}
function scanSlide(){
  const app=$('#app');
  if(!app)return;
  const title=$('.slide-title',app)?.textContent?.trim();
  const workflowId=slideWorkflow[title];
  const body=$('.slide-body',app);
  if(!workflowId||!body||$('.fin84-paired-strip',body))return;
  const item=workflows[workflowId];
  const strip=document.createElement('aside');
  strip.className='fin84-paired-strip';
  strip.innerHTML=`<div><span>PAIRED FINANCE PRACTICE</span><b>Manual method + physical TI‑84 Finance workflow</b><small>Project one key step, then students reproduce it on the calculator in their hands.</small></div><button type="button"><i>84</i> Open ${esc(item.code)} classroom demo</button>`;
  strip.querySelector('button').addEventListener('click',()=>open(workflowId));
  body.append(strip);
}
function init(){
  restore();build();attachLauncher();scanSlide();
  const app=$('#app');
  if(app)new MutationObserver(()=>scanSlide()).observe(app,{childList:true,subtree:true});
  document.addEventListener('echs:ti84-finance-classroom-open',event=>open(event.detail?.workflow));
  document.addEventListener('echs:ti84-finance-classroom-close',close);
  data.ti84FinanceClassroom=Object.assign({},data.ti84FinanceClassroom,{runtimeRelease:'6.3.0',mappedSlides:Object.keys(slideWorkflow),simulatorPrimary:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();