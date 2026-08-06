(function(){
'use strict';

const data=window.LESSON_DATA;
const engine=window.ECHS_TI84_LOCAL_ENGINE_1_1;
if(!data||String(data.lesson?.number)!=='1.1'||!engine||typeof document==='undefined')return;

const examples={
  'ee-entry':'-6.04E-6',
  'sci-normal':'7.629032258E10',
  'guard-digits':'(4.73E8)/(6.2E-3)'
};
let input='';
let answer=null;
let mode='normal';
let panel=null;

const $=(selector,root=document)=>root.querySelector(selector);
const selectedWorkflow=()=>panel?.querySelector('[data-workflow].active')?.dataset.workflow||'guard-digits';
const displayText=value=>String(value||'').replace(/E-/g,'E−').replace(/\*/g,'×').replace(/\//g,'÷').replace(/-/g,'−');

function render(message=''){
  if(!panel)return;
  const modeNode=$('[data-local-mode]',panel);
  const inputNode=$('[data-local-input]',panel);
  const resultNode=$('[data-local-result]',panel);
  const written=$('[data-local-written]',panel);
  if(modeNode)modeNode.textContent=mode==='sci'?'SCI':'NORMAL';
  if(inputNode)inputNode.textContent=input?displayText(input):'0';
  if(resultNode){
    if(message){
      resultNode.textContent=message;
      resultNode.dataset.state='error';
    }else if(answer!==null){
      resultNode.textContent=mode==='sci'?engine.formatScientific(answer):engine.formatNormal(answer);
      resultNode.dataset.state='ready';
    }else{
      resultNode.textContent='';
      resultNode.dataset.state='idle';
    }
  }
  if(written){
    written.hidden=answer===null||Boolean(message);
    const text=$('[data-local-written-text]',written);
    if(text&&!written.hidden){
      const display=mode==='sci'?engine.formatScientific(answer):engine.formatNormal(answer);
      text.textContent=`${display}  ⇒  ${engine.mathematicalNotation(answer)}`;
    }
  }
}

function reset(history='Ready'){
  input='';
  answer=null;
  mode='normal';
  const historyNode=$('[data-local-history]',panel);
  if(historyNode)historyNode.textContent=history;
  render();
}

function currentNumberSegment(){
  return input.split(/[+\-*/()]/).pop()||'';
}

function appendKey(key){
  if(answer!==null){input='';answer=null;}
  const last=input.slice(-1);
  if(key==='E'){
    const segment=currentNumberSegment();
    if(!/\d$/.test(segment)||/[Ee]/.test(segment))return;
    input+='E';
  }else if(key==='.'){
    const segment=input.split(/[+\-*/()Ee]/).pop()||'';
    if(segment.includes('.'))return;
    input+=segment?'.':'0.';
  }else if(/[+*/]/.test(key)){
    if(!input||/[+\-*/.(Ee]$/.test(input))return;
    input+=key;
  }else if(key==='-'){
    if(last==='-')return;
    input+='-';
  }else if(key===')'){
    const opens=(input.match(/\(/g)||[]).length;
    const closes=(input.match(/\)/g)||[]).length;
    if(opens<=closes||/[+\-*/.(Ee]$/.test(input))return;
    input+=')';
  }else if(key==='('){
    if(/[0-9.)]$/.test(input))input+='*';
    input+='(';
  }else{
    if(last===')')input+='*';
    input+=key;
  }
  render();
}

function calculate(){
  try{
    answer=engine.evaluate(input);
    const history=$('[data-local-history]',panel);
    if(history)history.textContent=`${selectedWorkflow().toUpperCase()}: ${displayText(input)}`;
    render();
  }catch(error){
    answer=null;
    render(error?.message||'Check the expression.');
  }
}

function handleAction(action){
  if(action==='mode'){
    mode=mode==='normal'?'sci':'normal';
    render();
  }else if(action==='delete'){
    input=input.slice(0,-1);answer=null;render();
  }else if(action==='clear'){
    reset('Cleared');
  }else if(action==='enter'){
    calculate();
  }else if(action==='load-example'){
    input=examples[selectedWorkflow()]||'';
    answer=null;
    const history=$('[data-local-history]',panel);
    if(history)history.textContent='Example loaded — estimate before pressing ENTER';
    render();
  }else if(action==='reset-example'){
    reset();
  }else if(action==='second'){
    const history=$('[data-local-history]',panel);
    if(history)history.textContent='2nd active — press EE for ×10^';
  }
}

function install(){
  panel=document.getElementById('l11-ti84-local');
  if(!panel||panel.dataset.inputFix==='6.8.1')return;
  panel.dataset.inputFix='6.8.1';
  panel.addEventListener('click',event=>{
    const workflow=event.target.closest?.('[data-workflow]');
    if(workflow){
      queueMicrotask(()=>reset('Workflow selected — predict before entering'));
      return;
    }
    const key=event.target.closest?.('[data-key]');
    if(key){
      event.preventDefault();
      event.stopImmediatePropagation();
      appendKey(key.dataset.key);
      return;
    }
    const action=event.target.closest?.('[data-action]');
    if(action){
      event.preventDefault();
      event.stopImmediatePropagation();
      handleAction(action.dataset.action);
    }
  },true);
  new MutationObserver(()=>{
    if(panel.classList.contains('open')&&panel.dataset.wasOpen!=='1'){
      panel.dataset.wasOpen='1';
      reset();
    }else if(!panel.classList.contains('open')){
      panel.dataset.wasOpen='0';
    }
  }).observe(panel,{attributes:true,attributeFilter:['class']});
  reset();
  data.ti84InlineSimulator=Object.assign({},data.ti84InlineSimulator,{inputRelease:'6.8.1',multiOperandEE:true});
}

function init(){
  install();
  if(!panel)new MutationObserver(install).observe(document.body,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();
