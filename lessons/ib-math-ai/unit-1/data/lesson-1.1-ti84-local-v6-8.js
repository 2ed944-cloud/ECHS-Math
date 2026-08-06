(function(){
'use strict';

const data=window.LESSON_DATA;
if(!data||String(data.lesson?.number)!=='1.1')return;

const trimZeros=value=>String(value)
  .replace(/(\.\d*?[1-9])0+(?=e|$)/i,'$1')
  .replace(/\.0+(?=e|$)/i,'')
  .replace(/e\+/i,'E')
  .replace(/e/i,'E');

function scientificParts(value,digits=10){
  if(!Number.isFinite(value))throw new Error('Result is not finite.');
  if(Object.is(value,-0)||value===0)return{coefficient:'0',exponent:0};
  const exponent=Math.floor(Math.log10(Math.abs(value)));
  const coefficient=value/(10**exponent);
  return{coefficient:trimZeros(coefficient.toPrecision(digits)),exponent};
}

function prepareExpression(raw){
  const source=String(raw||'')
    .replace(/[×·]/g,'*')
    .replace(/÷/g,'/')
    .replace(/[−–—]/g,'-')
    .replace(/\s+/g,'');
  if(!source)throw new Error('Enter a calculation first.');
  if(!/^[0-9.+\-*/()Ee]+$/.test(source))throw new Error('Unsupported key in the expression.');
  let converted=source.replace(/((?:\d+(?:\.\d*)?|\.\d+))[Ee]([+\-]?\d+)/g,'($1*10**($2))');
  if(/[Ee]/.test(converted))throw new Error('Complete the exponent after EE.');
  if(!/^[0-9.+\-*/()]+$/.test(converted.replace(/\*\*/g,'')))throw new Error('The expression is incomplete.');
  return converted;
}

function evaluate(raw){
  const expression=prepareExpression(raw);
  let value;
  try{
    value=Function(`"use strict";return (${expression});`)();
  }catch(_){
    throw new Error('Check brackets and operation signs.');
  }
  if(typeof value!=='number'||!Number.isFinite(value))throw new Error('The result is undefined or outside the calculator range.');
  return value;
}

function formatNormal(value){
  if(Object.is(value,-0)||value===0)return'0';
  const absolute=Math.abs(value);
  if(absolute>=1e-4&&absolute<1e10){
    const rounded=Number(value.toPrecision(10));
    return trimZeros(rounded.toString());
  }
  const parts=scientificParts(value,10);
  return`${parts.coefficient}E${parts.exponent}`;
}

function formatScientific(value){
  const parts=scientificParts(value,10);
  return`${parts.coefficient}E${parts.exponent}`;
}

function mathematicalNotation(value){
  const parts=scientificParts(value,10);
  if(parts.exponent===0)return parts.coefficient;
  return`${parts.coefficient} × 10^${parts.exponent}`;
}

const engine={evaluate,prepareExpression,formatNormal,formatScientific,mathematicalNotation,scientificParts};
window.ECHS_TI84_LOCAL_ENGINE_1_1=engine;
if(typeof document==='undefined')return;

const $=(selector,root=document)=>root.querySelector(selector);
const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
const workflows={
  'ee-entry':{
    code:'A1',
    title:'EE entry and a negative exponent',
    prompt:'Enter −6.04 × 10⁻⁶ using EE, then rewrite the display in mathematical notation.',
    expression:'-6.04E-6',
    prediction:'The answer is negative and has magnitude a little larger than 6 × 10⁻⁶.',
    sequence:['(−)','6','.','0','4','2nd',', (EE)','(−)','6','ENTER'],
    check:'−6.04E−6 means −6.04 × 10⁻⁶; EE replaces “×10 raised to”.'
  },
  'sci-normal':{
    code:'A2',
    title:'SCI and NORMAL display modes',
    prompt:'Evaluate 7.629032258 × 10¹⁰, then compare SCI and NORMAL displays.',
    expression:'7.629032258E10',
    prediction:'The exponent must remain 10. The mode changes the display, not the stored value.',
    sequence:['7','.','6','2','9','0','3','2','2','5','8','2nd',', (EE)','1','0','ENTER','MODE'],
    check:'SCI forces E-notation. NORMAL may also use E-notation when the value is too large for the screen.'
  },
  'guard-digits':{
    code:'B1',
    title:'Brackets, guard digits and final rounding',
    prompt:'Calculate (4.73 × 10⁸) ÷ (6.2 × 10⁻³), then give the result to 2 significant figures.',
    expression:'(4.73E8)/(6.2E-3)',
    prediction:'The scale is about 10¹¹ because 10⁸ ÷ 10⁻³ = 10¹¹; the coefficient will be below 1 before normalization.',
    sequence:['(','4','.','7','3','2nd',', (EE)','8',')','÷','(','6','.','2','2nd',', (EE)','(−)','3',')','ENTER'],
    check:'Keep the full calculator value 7.629032258E10, then round once: 7.6 × 10¹⁰.'
  }
};

let panel=null;
let headerButton=null;
let classroomButton=null;
let mode='normal';
let input='';
let answer=null;
let activeWorkflow='guard-digits';
let previousFocus=null;

function retireLegacy(){
  document.body.classList.remove('ti84-inline-open','l11-ti84-simulator-open');
  document.documentElement.style.removeProperty('--ti84-inline-top');
  document.documentElement.style.removeProperty('--ti84-inline-scale');
  document.documentElement.style.removeProperty('--ti84-inline-width');
  $$('#ti84-inline-dock,#l11-ti84-simulator,.ti84-inline-launch,#l11-ti84-sim-launch').forEach(node=>node.remove());
}

function displayText(raw){
  return String(raw||'')
    .replace(/E-/g,'E−')
    .replace(/\*/g,'×')
    .replace(/\//g,'÷')
    .replace(/-/g,'−');
}

function panelMarkup(){
  const aside=document.createElement('aside');
  aside.id='l11-ti84-local';
  aside.className='l11-ti84-local';
  aside.setAttribute('aria-hidden','true');
  aside.innerHTML=`
    <header class="l11-ti84-local-head">
      <div><span>TI‑84 PLUS CE · LESSON 1.1</span><h2>Scientific notation simulator</h2></div>
      <button type="button" data-local-close aria-label="Close TI-84 simulator">×</button>
    </header>
    <div class="l11-ti84-local-layout">
      <section class="l11-ti84-device" aria-label="Lesson 1.1 TI-84 practice calculator">
        <div class="l11-ti84-screen" role="status" aria-live="polite">
          <div class="l11-ti84-screen-mode"><span data-local-mode>NORMAL</span><span>FLOAT</span><span>DEG</span></div>
          <div class="l11-ti84-screen-history" data-local-history>Ready</div>
          <div class="l11-ti84-screen-input"><span data-local-input>0</span><i aria-hidden="true"></i></div>
          <div class="l11-ti84-screen-result" data-local-result></div>
        </div>
        <div class="l11-ti84-topkeys">
          <button type="button" data-action="second" class="second">2nd</button>
          <button type="button" data-action="mode">MODE</button>
          <button type="button" data-action="delete">DEL</button>
          <button type="button" data-action="clear">CLEAR</button>
        </div>
        <div class="l11-ti84-keypad">
          <button type="button" data-key="(">(</button><button type="button" data-key=")">)</button><button type="button" data-key="E" class="ee">EE</button><button type="button" data-key="/" class="operator">÷</button>
          <button type="button" data-key="7">7</button><button type="button" data-key="8">8</button><button type="button" data-key="9">9</button><button type="button" data-key="*" class="operator">×</button>
          <button type="button" data-key="4">4</button><button type="button" data-key="5">5</button><button type="button" data-key="6">6</button><button type="button" data-key="-" class="operator">−</button>
          <button type="button" data-key="1">1</button><button type="button" data-key="2">2</button><button type="button" data-key="3">3</button><button type="button" data-key="+" class="operator">+</button>
          <button type="button" data-key="0" class="zero">0</button><button type="button" data-key=".">.</button><button type="button" data-key="-" class="negative">(−)</button><button type="button" data-action="enter" class="enter">ENTER</button>
        </div>
      </section>
      <section class="l11-ti84-guide">
        <div class="l11-ti84-workflow-tabs" role="tablist" aria-label="Lesson 1.1 calculator workflows">
          ${Object.entries(workflows).map(([key,value])=>`<button type="button" data-workflow="${key}" role="tab"><b>${value.code}</b><span>${value.title}</span></button>`).join('')}
        </div>
        <article class="l11-ti84-task">
          <span data-local-code></span>
          <h3 data-local-title></h3>
          <p data-local-prompt></p>
          <div class="l11-ti84-prediction"><b>Predict first</b><p data-local-prediction></p></div>
          <div class="l11-ti84-sequence"><b>Physical TI‑84 route</b><div data-local-sequence></div></div>
          <div class="l11-ti84-guide-actions">
            <button type="button" data-action="load-example">Load example</button>
            <button type="button" data-action="reset-example">Reset</button>
          </div>
          <div class="l11-ti84-check"><b>Independent check</b><p data-local-check></p></div>
          <div class="l11-ti84-written" data-local-written hidden><b>Write mathematically</b><p data-local-written-text></p></div>
        </article>
      </section>
    </div>`;
  return aside;
}

function renderWorkflow(){
  if(!panel)return;
  const flow=workflows[activeWorkflow];
  $$('[data-workflow]',panel).forEach(button=>{
    const selected=button.dataset.workflow===activeWorkflow;
    button.classList.toggle('active',selected);
    button.setAttribute('aria-selected',String(selected));
  });
  $('[data-local-code]',panel).textContent=`${flow.code} · LESSON-SPECIFIC PRACTICE`;
  $('[data-local-title]',panel).textContent=flow.title;
  $('[data-local-prompt]',panel).textContent=flow.prompt;
  $('[data-local-prediction]',panel).textContent=flow.prediction;
  $('[data-local-check]',panel).textContent=flow.check;
  $('[data-local-sequence]',panel).innerHTML=flow.sequence.map(key=>`<kbd>${key}</kbd>`).join('<i>→</i>');
}

function renderScreen(message=''){
  if(!panel)return;
  $('[data-local-mode]',panel).textContent=mode==='sci'?'SCI':'NORMAL';
  $('[data-local-input]',panel).textContent=input?displayText(input):'0';
  const result=$('[data-local-result]',panel);
  const written=$('[data-local-written]',panel);
  if(message){
    result.textContent=message;
    result.dataset.state='error';
  }else if(answer!==null){
    result.textContent=mode==='sci'?formatScientific(answer):formatNormal(answer);
    result.dataset.state='ready';
  }else{
    result.textContent='';
    result.dataset.state='idle';
  }
  if(answer!==null&&!message){
    written.hidden=false;
    $('[data-local-written-text]',panel).textContent=`${mode==='sci'?formatScientific(answer):formatNormal(answer)}  ⇒  ${mathematicalNotation(answer)}`;
  }else written.hidden=true;
}

function loadExample(){
  input=workflows[activeWorkflow].expression;
  answer=null;
  $('[data-local-history]',panel).textContent='Example loaded — estimate before pressing ENTER';
  renderScreen();
}

function appendKey(key){
  if(answer!==null){
    input='';
    answer=null;
  }
  const last=input.slice(-1);
  if(key==='E'){
    if(!/\d/.test(last)||/[Ee]/.test(input.slice(input.lastIndexOf(/[+\-*/()]/)+1)))return;
    input+='E';
  }else if(key==='.'){
    const segment=input.split(/[+\-*/()Ee]/).pop();
    if(segment.includes('.'))return;
    input+=segment?' .'.trim(): '0.';
  }else if(/[+*/]/.test(key)){
    if(!input||/[+\-*/.(Ee]$/.test(input))return;
    input+=key;
  }else if(key==='-'){
    if(last==='-')return;
    input+='-';
  }else if(key===')'){
    const opens=(input.match(/\(/g)||[]).length,closes=(input.match(/\)/g)||[]).length;
    if(opens<=closes||/[+\-*/.(Ee]$/.test(input))return;
    input+=')';
  }else if(key==='('){
    if(/[0-9.)]$/.test(input))input+='*';
    input+='(';
  }else{
    if(last===')')input+='*';
    input+=key;
  }
  renderScreen();
}

function calculate(){
  try{
    answer=evaluate(input);
    const flow=workflows[activeWorkflow];
    $('[data-local-history]',panel).textContent=`${flow.code}: ${displayText(input)}`;
    renderScreen();
  }catch(error){
    answer=null;
    renderScreen(error.message||'Check the expression.');
  }
}

function handleAction(action){
  if(action==='mode'){
    mode=mode==='normal'?'sci':'normal';
    renderScreen();
    return;
  }
  if(action==='delete'){
    input=input.slice(0,-1);answer=null;renderScreen();return;
  }
  if(action==='clear'){
    input='';answer=null;$('[data-local-history]',panel).textContent='Cleared';renderScreen();return;
  }
  if(action==='enter'){calculate();return;}
  if(action==='load-example'){loadExample();return;}
  if(action==='reset-example'){
    input='';answer=null;mode='normal';$('[data-local-history]',panel).textContent='Ready';renderScreen();return;
  }
  if(action==='second'){
    $('[data-local-history]',panel).textContent='2nd active — use EE for ×10^';
  }
}

function closeCoach(){
  const coach=$('#ti84-classroom-coach-1-1');
  if(coach?.classList.contains('open'))coach.querySelector('[data-close]')?.click();
}

function open(workflow){
  build();
  retireLegacy();
  closeCoach();
  if(workflows[workflow])activeWorkflow=workflow;
  previousFocus=document.activeElement;
  panel.classList.add('open');
  panel.setAttribute('aria-hidden','false');
  document.body.classList.add('l11-ti84-local-open');
  headerButton?.classList.add('active');
  headerButton?.setAttribute('aria-pressed','true');
  renderWorkflow();
  renderScreen();
  $('[data-local-close]',panel)?.focus();
}

function close(){
  if(!panel)return;
  panel.classList.remove('open');
  panel.setAttribute('aria-hidden','true');
  document.body.classList.remove('l11-ti84-local-open');
  headerButton?.classList.remove('active');
  headerButton?.setAttribute('aria-pressed','false');
  previousFocus?.focus?.();
}

function build(){
  if(panel?.isConnected)return;
  panel=panelMarkup();
  document.body.append(panel);
  $('[data-local-close]',panel).addEventListener('click',close);
  $$('[data-workflow]',panel).forEach(button=>button.addEventListener('click',()=>{
    activeWorkflow=button.dataset.workflow;
    input='';answer=null;
    renderWorkflow();renderScreen();
  }));
  $$('[data-key]',panel).forEach(button=>button.addEventListener('click',()=>appendKey(button.dataset.key)));
  $$('[data-action]',panel).forEach(button=>button.addEventListener('click',()=>handleAction(button.dataset.action)));
  renderWorkflow();
  renderScreen();
}

function installHeaderButton(){
  const actions=$('.header-actions');
  if(!actions)return;
  headerButton=$('#l11-ti84-local-launch',actions);
  if(headerButton)return;
  headerButton=document.createElement('button');
  headerButton.id='l11-ti84-local-launch';
  headerButton.type='button';
  headerButton.className='header-tool l11-ti84-local-launch';
  headerButton.setAttribute('aria-controls','l11-ti84-local');
  headerButton.setAttribute('aria-pressed','false');
  headerButton.setAttribute('aria-label','Open the Lesson 1.1 TI-84 simulator');
  headerButton.title='TI-84 simulator';
  headerButton.innerHTML='84<span class="tool-label">TI‑84</span>';
  headerButton.addEventListener('click',()=>panel?.classList.contains('open')?close():open(activeWorkflow));
  const menu=$('#toggle-route-menu',actions);
  menu?actions.insertBefore(headerButton,menu):actions.append(headerButton);
}

function bindClassroomButton(){
  const toolbar=$('#ti84-classroom-coach-1-1 .ti84-coach-toolbar');
  if(!toolbar)return;
  let button=$('.ti84-open-separate-simulator',toolbar);
  if(button&&!button.dataset.localV68){
    const clone=button.cloneNode(true);
    button.replaceWith(clone);
    button=clone;
  }
  if(!button){
    button=document.createElement('button');
    button.type='button';
    button.className='ti84-open-separate-simulator';
    toolbar.append(button);
  }
  if(button.dataset.localV68)return;
  button.dataset.localV68='1';
  button.textContent='Open simulator';
  button.setAttribute('aria-controls','l11-ti84-local');
  button.addEventListener('click',event=>{
    event.preventDefault();
    event.stopImmediatePropagation();
    const selected=$('#ti84-select-1-1')?.value;
    open(selected||activeWorkflow);
  },true);
  classroomButton=button;
}

function bindPairedStrips(){
  $$('.ti84-paired-strip button').forEach(button=>{
    if(button.dataset.localV68)return;
    const clone=button.cloneNode(true);
    clone.dataset.localV68='1';
    clone.textContent=button.textContent;
    clone.addEventListener('click',event=>{
      event.preventDefault();
      const title=$('.slide-title')?.textContent||'';
      const workflow=/guard|round|mixed|estimate/i.test(title)?'guard-digits':'ee-entry';
      const eventOpen=new CustomEvent('echs:ti84:open',{detail:{workflow}});
      document.dispatchEvent(eventOpen);
    });
    button.replaceWith(clone);
  });
}

function maintain(){
  retireLegacy();
  build();
  installHeaderButton();
  bindClassroomButton();
  bindPairedStrips();
}

function init(){
  maintain();
  const observer=new MutationObserver(()=>requestAnimationFrame(maintain));
  observer.observe(document.body,{childList:true,subtree:true});
  document.addEventListener('echs:ti84:simulator',event=>open(event.detail?.workflow));
  document.addEventListener('echs:ti84:open',event=>{
    if(event.detail?.simulator===true)open(event.detail?.workflow);
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&panel?.classList.contains('open'))close();
  });
  document.addEventListener('click',event=>{
    const route=event.target.closest?.('[data-route]');
    if(route&&route.dataset.route!=='learn')close();
  });
  data.ti84InlineSimulator={
    release:'6.8.0',
    provider:'ECHS local lesson simulator',
    externalDependency:false,
    iframe:false,
    lessonSpecific:true,
    workflows:Object.keys(workflows),
    layout:'overlay beside slide on desktop; full screen on mobile'
  };
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();
