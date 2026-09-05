(function(){
'use strict';

const RELEASE='7.0.0';
const lesson=window.LESSON_DATA;
if(!lesson||String(lesson.lesson&&lesson.lesson.number)!=='1.1') return;

const workflows={
  ee:{
    title:'EE entry · scientific notation',
    prompt:'Enter 4.20 × 10⁻⁴ without typing a long chain of zeros.',
    steps:[
      'Type the coefficient 4.20.',
      'Press EE to insert “×10 to the power of”.',
      'Use the negative-sign key, then type 4.',
      'Press enter and read the display structurally.',
      'Write the final value as 4.20 × 10⁻⁴, not 4.20E−4.'
    ],
    expected:'4.20E−4 represents 4.20 × 10⁻⁴.'
  },
  quotient:{
    title:'Quotient · brackets and guard digits',
    prompt:'Evaluate (4.73 × 10⁸) ÷ (6.2 × 10⁻³).',
    steps:[
      'Estimate first: the answer should be close to 8 × 10¹⁰.',
      'Bracket the numerator and denominator.',
      'Enter each power of ten with EE.',
      'Keep the unrounded output as guard digits.',
      'Report 7.6 × 10¹⁰ to 2 significant figures.'
    ],
    expected:'Output ≈ 7.629032258E10; final report 7.6 × 10¹⁰.'
  },
  settings:{
    title:'Document Settings · display only',
    prompt:'Switch between Normal and Scientific display.',
    steps:[
      'Open Settings in this training emulator.',
      'Choose Exponential Format: Scientific.',
      'Choose Display Digits: Float 6.',
      'Apply the setting and evaluate a small number.',
      'Return to Normal after the demonstration if required.'
    ],
    expected:'A display setting changes presentation, not the stored value.'
  },
  free:{
    title:'Free calculation · predict, enter, verify',
    prompt:'Use the Calculator page for Lesson 1.1 arithmetic.',
    steps:[
      'Predict the sign and power-of-ten scale.',
      'Enter the expression using EE for scientific notation.',
      'Press enter.',
      'Compare the output with the estimate.',
      'Rewrite E notation and round only in the final line.'
    ],
    expected:'Show mathematical setup, useful output, final accuracy and units.'
  }
};

lesson.tiNspire={
  release:RELEASE,
  model:'TI‑Nspire CX II',
  simulatorType:'lesson-specific training emulator',
  officialSoftware:false,
  workflows:Object.keys(workflows),
  calculatorPage:true,
  scientificEntry:true,
  documentSettings:true,
  casNotice:'Use the current school-approved IB examination profile; disable CAS when required.'
};

const storageKey='echs:ib-ai:u1:1.1:nspire-v7-settings';
const state={
  open:false,
  expression:'',
  answer:0,
  history:[],
  settings:{format:'normal',digits:6},
  workflow:'free'
};

function loadSettings(){
  try{
    const saved=JSON.parse(localStorage.getItem(storageKey)||'null');
    if(saved&&['normal','scientific'].includes(saved.format)&&[6,12].includes(Number(saved.digits))){
      state.settings={format:saved.format,digits:Number(saved.digits)};
    }
  }catch(_){}
}
function saveSettings(){
  try{localStorage.setItem(storageKey,JSON.stringify(state.settings));}catch(_){}
}
loadSettings();

function escapeHtml(value){
  return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}
function displayMinus(value){return String(value).replace(/-/g,'−');}
function compactNumber(value,digits){
  if(!Number.isFinite(value)) throw new Error('Result is not a finite real number.');
  if(value===0) return '0';
  return Number(value.toPrecision(digits)).toString();
}
function scientificNumber(value,digits){
  if(value===0) return '0';
  const text=Number(value.toPrecision(digits)).toExponential();
  const parts=text.split('e');
  return `${parts[0]}E${Number(parts[1])}`;
}
function formatResult(value){
  const digits=state.settings.digits;
  let text;
  if(state.settings.format==='scientific'){
    text=scientificNumber(value,digits);
  }else{
    const magnitude=Math.abs(value);
    text=(magnitude!==0&&(magnitude>=1e10||magnitude<1e-8))
      ? scientificNumber(value,digits)
      : compactNumber(value,digits);
  }
  return displayMinus(text);
}
function normalizedExpression(value){
  return String(value||'')
    .replace(/[×·]/g,'*')
    .replace(/÷/g,'/')
    .replace(/[−–—]/g,'-')
    .replace(/π/g,'pi')
    .replace(/\s+/g,'');
}

function tokenize(source){
  const input=normalizedExpression(source);
  const tokens=[];
  let i=0;
  while(i<input.length){
    const slice=input.slice(i);
    const number=slice.match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:E[+-]?\d+)?/i);
    if(number){
      tokens.push({type:'number',value:Number(number[0])});
      i+=number[0].length;
      continue;
    }
    const ident=slice.match(/^(?:sqrt|abs|pi|ans)/i);
    if(ident){
      tokens.push({type:'ident',value:ident[0].toLowerCase()});
      i+=ident[0].length;
      continue;
    }
    const char=input[i];
    if('+-*/^()'.includes(char)){
      tokens.push({type:char,value:char});
      i++;
      continue;
    }
    throw new Error(`Unsupported symbol “${char}”.`);
  }
  tokens.push({type:'eof'});
  return tokens;
}

function evaluateExpression(source){
  const tokens=tokenize(source);
  let position=0;
  const peek=()=>tokens[position];
  const take=type=>{
    const token=peek();
    if(token.type!==type) throw new Error(`Expected “${type}”.`);
    position++;
    return token;
  };
  function parseExpression(){
    let value=parseTerm();
    while(peek().type==='+'||peek().type==='-'){
      const op=take(peek().type).type;
      const right=parseTerm();
      value=op==='+'?value+right:value-right;
    }
    return value;
  }
  function parseTerm(){
    let value=parsePower();
    while(peek().type==='*'||peek().type==='/'){
      const op=take(peek().type).type;
      const right=parsePower();
      if(op==='/'&&right===0) throw new Error('Division by zero is undefined.');
      value=op==='*'?value*right:value/right;
    }
    return value;
  }
  function parsePower(){
    let value=parseUnary();
    if(peek().type==='^'){
      take('^');
      value=Math.pow(value,parsePower());
    }
    return value;
  }
  function parseUnary(){
    if(peek().type==='+'){take('+');return parseUnary();}
    if(peek().type==='-'){take('-');return -parseUnary();}
    return parsePrimary();
  }
  function parsePrimary(){
    const token=peek();
    if(token.type==='number'){position++;return token.value;}
    if(token.type==='ident'){
      position++;
      if(token.value==='pi') return Math.PI;
      if(token.value==='ans') return Number(state.answer)||0;
      const argument=peek().type==='('?(take('('),parseExpression()):parseUnary();
      if(peek().type===')') take(')');
      if(token.value==='sqrt'){
        if(argument<0) throw new Error('Square root is not real for this input.');
        return Math.sqrt(argument);
      }
      if(token.value==='abs') return Math.abs(argument);
    }
    if(token.type==='('){
      take('(');
      const value=parseExpression();
      take(')');
      return value;
    }
    throw new Error('Complete the expression before evaluating.');
  }
  const result=parseExpression();
  if(peek().type!=='eof') throw new Error('Check the expression structure.');
  if(!Number.isFinite(result)) throw new Error('Result is not a finite real number.');
  return result;
}

function markup(){
  return `
    <button class="nspire-launcher" id="nspire-launcher" type="button" aria-haspopup="dialog">
      <span>TI‑Nspire</span><b>CX II lesson emulator</b>
    </button>
    <div class="nspire-backdrop" id="nspire-backdrop" hidden></div>
    <section class="nspire-dialog" id="nspire-dialog" role="dialog" aria-modal="true" aria-label="TI-Nspire CX II lesson emulator" hidden>
      <header class="nspire-dialog-head">
        <div><span>ECHS CLASSROOM TECHNOLOGY</span><b>TI‑Nspire™ CX II · Lesson 1.1</b></div>
        <button type="button" class="nspire-close" id="nspire-close" aria-label="Close emulator">×</button>
      </header>
      <div class="nspire-dialog-body">
        <div class="nspire-device" aria-label="Lesson-specific TI-Nspire calculator emulator">
          <div class="nspire-brand-row"><b>TI‑Nspire™</b><span>CX II</span></div>
          <div class="nspire-screen">
            <div class="nspire-status"><span>Calculator</span><span id="nspire-status-mode"></span></div>
            <div class="nspire-history" id="nspire-history" aria-live="polite"></div>
            <div class="nspire-input-row"><span>1:</span><div id="nspire-input" aria-label="Calculator input"></div><i class="nspire-cursor"></i></div>
            <div class="nspire-message" id="nspire-message">Predict first, then enter the expression.</div>
          </div>
          <div class="nspire-soft-row">
            <button type="button" data-nspire-action="home">home</button>
            <button type="button" data-nspire-action="settings">settings</button>
            <button type="button" data-nspire-action="clear">clear</button>
            <button type="button" data-nspire-action="delete">del</button>
          </div>
          <div class="nspire-keypad">
            <button type="button" class="function" data-token="sqrt(">√</button>
            <button type="button" class="function" data-token="abs(">abs</button>
            <button type="button" class="function" data-token="pi">π</button>
            <button type="button" class="function" data-token="^">x<sup>y</sup></button>
            <button type="button" class="function" data-token="(">(</button>
            <button type="button" class="function" data-token=")">)</button>
            <button type="button" class="ee-key" data-token="E">EE</button>
            <button type="button" class="operator" data-token="/">÷</button>

            <button type="button" data-token="7">7</button>
            <button type="button" data-token="8">8</button>
            <button type="button" data-token="9">9</button>
            <button type="button" class="operator" data-token="*">×</button>

            <button type="button" data-token="4">4</button>
            <button type="button" data-token="5">5</button>
            <button type="button" data-token="6">6</button>
            <button type="button" class="operator" data-token="-">−</button>

            <button type="button" data-token="1">1</button>
            <button type="button" data-token="2">2</button>
            <button type="button" data-token="3">3</button>
            <button type="button" class="operator" data-token="+">+</button>

            <button type="button" class="neg-key" data-token="-">(−)</button>
            <button type="button" data-token="0">0</button>
            <button type="button" data-token=".">.</button>
            <button type="button" class="enter-key" data-nspire-action="evaluate">enter</button>
          </div>
        </div>
        <aside class="nspire-coach">
          <span class="nspire-coach-label">GUIDED WORKFLOW</span>
          <h2 id="nspire-coach-title"></h2>
          <p id="nspire-coach-prompt"></p>
          <ol id="nspire-coach-steps"></ol>
          <div class="nspire-expected" id="nspire-expected"></div>
          <div class="nspire-preset-grid">
            <button type="button" data-nspire-preset-button="4.20E-4" data-workflow="ee">EE entry</button>
            <button type="button" data-nspire-preset-button="(4.73E8)/(6.2E-3)" data-workflow="quotient">Quotient</button>
            <button type="button" data-nspire-preset-button="(6.2E5)+(3.7E4)" data-workflow="free">Addition</button>
            <button type="button" data-nspire-action="settings">Display settings</button>
          </div>
          <div class="nspire-writing-check">
            <b>IB writing check</b>
            <label><input type="checkbox"> Mathematical setup shown</label>
            <label><input type="checkbox"> E display rewritten as ×10<sup>k</sup></label>
            <label><input type="checkbox"> Rounding completed only at the end</label>
            <label><input type="checkbox"> Units and interpretation included</label>
          </div>
          <p class="nspire-disclaimer">Lesson-specific training emulator; it is not official Texas Instruments software and does not replace practice on the school’s approved handheld or official software.</p>
        </aside>
      </div>
      <div class="nspire-settings-panel" id="nspire-settings-panel" hidden>
        <div class="nspire-settings-card">
          <div class="nspire-settings-head"><b>Document Settings</b><button type="button" data-nspire-action="close-settings">×</button></div>
          <label>Exponential Format
            <select id="nspire-format">
              <option value="normal">Normal</option>
              <option value="scientific">Scientific</option>
            </select>
          </label>
          <label>Display Digits
            <select id="nspire-digits">
              <option value="6">Float 6</option>
              <option value="12">Float 12</option>
            </select>
          </label>
          <div class="nspire-settings-note"><b>Classroom route:</b> home → Settings → Document Settings → Exponential Format. Select OK rather than Make Default on a shared device.</div>
          <div class="nspire-settings-actions">
            <button type="button" class="secondary-btn" data-nspire-action="close-settings">Cancel</button>
            <button type="button" class="primary-btn" data-nspire-action="apply-settings">OK</button>
          </div>
        </div>
      </div>
    </section>`;
}

function inject(){
  if(document.getElementById('nspire-dialog')) return;
  document.body.insertAdjacentHTML('beforeend',markup());
  bindStatic();
  renderAll();
}
function nodes(){
  return {
    launcher:document.getElementById('nspire-launcher'),
    dialog:document.getElementById('nspire-dialog'),
    backdrop:document.getElementById('nspire-backdrop'),
    input:document.getElementById('nspire-input'),
    history:document.getElementById('nspire-history'),
    message:document.getElementById('nspire-message'),
    mode:document.getElementById('nspire-status-mode'),
    settings:document.getElementById('nspire-settings-panel'),
    format:document.getElementById('nspire-format'),
    digits:document.getElementById('nspire-digits'),
    coachTitle:document.getElementById('nspire-coach-title'),
    coachPrompt:document.getElementById('nspire-coach-prompt'),
    coachSteps:document.getElementById('nspire-coach-steps'),
    expected:document.getElementById('nspire-expected')
  };
}
function renderCoach(){
  const w=workflows[state.workflow]||workflows.free;
  const n=nodes();
  if(!n.coachTitle) return;
  n.coachTitle.textContent=w.title;
  n.coachPrompt.textContent=w.prompt;
  n.coachSteps.innerHTML=w.steps.map(step=>`<li>${escapeHtml(step)}</li>`).join('');
  n.expected.textContent=w.expected;
}
function renderAll(){
  const n=nodes();
  if(!n.input) return;
  n.input.textContent=displayMinus(state.expression);
  n.mode.textContent=`Float ${state.settings.digits} · ${state.settings.format==='scientific'?'Scientific':'Normal'}`;
  n.history.innerHTML=state.history.length
    ? state.history.slice(-5).map(item=>`<div><span>${escapeHtml(displayMinus(item.expression))}</span><b>${escapeHtml(item.output)}</b></div>`).join('')
    : '<p>No calculations yet.</p>';
  n.format.value=state.settings.format;
  n.digits.value=String(state.settings.digits);
  renderCoach();
}
function setMessage(text,type=''){
  const n=nodes();
  if(!n.message) return;
  n.message.textContent=text;
  n.message.dataset.type=type;
}
function openEmulator(options={}){
  inject();
  const n=nodes();
  state.open=true;
  if(typeof options.preset==='string'){
    state.expression=options.preset;
  }
  state.workflow=options.workflow||state.workflow||'free';
  n.dialog.hidden=false;
  n.backdrop.hidden=false;
  document.body.classList.add('nspire-open');
  renderAll();
  if(options.settings) openSettings();
  setTimeout(()=>n.dialog.querySelector('button')?.focus(),0);
}
function closeEmulator(){
  const n=nodes();
  if(!n.dialog) return;
  state.open=false;
  n.dialog.hidden=true;
  n.backdrop.hidden=true;
  document.body.classList.remove('nspire-open');
  closeSettings();
}
function openSettings(){
  const n=nodes();
  n.settings.hidden=false;
  n.format.value=state.settings.format;
  n.digits.value=String(state.settings.digits);
}
function closeSettings(){
  const n=nodes();
  if(n.settings) n.settings.hidden=true;
}
function applySettings(){
  const n=nodes();
  state.settings.format=n.format.value;
  state.settings.digits=Number(n.digits.value);
  saveSettings();
  closeSettings();
  renderAll();
  setMessage('Display settings applied. The stored values are unchanged.','success');
}
function appendToken(token){
  state.expression+=token;
  renderAll();
  setMessage('Press enter when the expression is complete.');
}
function clearEntry(){
  state.expression='';
  renderAll();
  setMessage('Entry cleared.');
}
function deleteToken(){
  const longTokens=['sqrt(','abs(','ans','pi'];
  const match=longTokens.find(token=>state.expression.endsWith(token));
  state.expression=match?state.expression.slice(0,-match.length):state.expression.slice(0,-1);
  renderAll();
}
function calculate(){
  if(!state.expression.trim()){
    setMessage('Enter an expression first.','error');
    return;
  }
  try{
    const value=evaluateExpression(state.expression);
    const output=formatResult(value);
    state.answer=value;
    state.history.push({expression:state.expression,output});
    if(state.history.length>12) state.history.shift();
    renderAll();
    setMessage('Result calculated. Compare it with your estimate, then write the final answer in mathematical notation.','success');
  }catch(error){
    setMessage(error.message||'Check the expression.','error');
  }
}
function usePreset(expression,workflow='free'){
  state.expression=expression||'';
  state.workflow=workflow;
  renderAll();
  setMessage(expression?'Preset loaded. Predict the result before pressing enter.':'Calculator page ready.');
}

function handleAction(action){
  if(action==='evaluate') calculate();
  if(action==='clear') clearEntry();
  if(action==='delete') deleteToken();
  if(action==='settings') {state.workflow='settings';renderCoach();openSettings();}
  if(action==='close-settings') closeSettings();
  if(action==='apply-settings') applySettings();
  if(action==='home') {
    state.workflow='free';
    state.expression='';
    renderAll();
    setMessage('New Calculator page ready.');
  }
}

function bindStatic(){
  const n=nodes();
  n.launcher.addEventListener('click',()=>openEmulator({workflow:'free'}));
  document.getElementById('nspire-close').addEventListener('click',closeEmulator);
  n.backdrop.addEventListener('click',closeEmulator);
  n.dialog.addEventListener('click',event=>{
    const tokenButton=event.target.closest('[data-token]');
    if(tokenButton){appendToken(tokenButton.dataset.token);return;}
    const actionButton=event.target.closest('[data-nspire-action]');
    if(actionButton){handleAction(actionButton.dataset.nspireAction);return;}
    const presetButton=event.target.closest('[data-nspire-preset-button]');
    if(presetButton){
      usePreset(presetButton.dataset.nspirePresetButton,presetButton.dataset.workflow||'free');
    }
  });
}

document.addEventListener('click',event=>{
  const trigger=event.target.closest('[data-nspire-open]');
  if(!trigger) return;
  event.preventDefault();
  openEmulator({
    preset:trigger.dataset.nspirePreset??'',
    workflow:trigger.dataset.nspireWorkflow|| (trigger.dataset.nspireSettings==='true'?'settings':'free'),
    settings:trigger.dataset.nspireSettings==='true'
  });
});

document.addEventListener('keydown',event=>{
  if(!state.open) return;
  if(event.key==='Escape'){
    const n=nodes();
    if(n.settings&&!n.settings.hidden) closeSettings(); else closeEmulator();
    return;
  }
  if(event.target&&/INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
  if(event.key==='Enter'){event.preventDefault();calculate();return;}
  if(event.key==='Backspace'){event.preventDefault();deleteToken();return;}
  const allowed='0123456789.+-*/^()';
  if(allowed.includes(event.key)){event.preventDefault();appendToken(event.key);}
});

function start(){
  inject();
  window.ECHS_NSPIRE_LESSON_1_1={
    release:RELEASE,
    open:openEmulator,
    evaluate:evaluateExpression,
    format:value=>formatResult(Number(value)),
    getState:()=>JSON.parse(JSON.stringify(state))
  };
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
else start();

})();
