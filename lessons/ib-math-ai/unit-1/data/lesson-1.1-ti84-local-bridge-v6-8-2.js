(function(){
'use strict';

const data=window.LESSON_DATA;
if(!data||String(data.lesson?.number)!=='1.1'||typeof document==='undefined')return;

function openLocalSimulator(workflow){
  document.dispatchEvent(new CustomEvent('echs:ti84:simulator',{detail:{workflow}}));
}

document.addEventListener('echs:ti84:open',event=>{
  if(event.detail?.simulator===true)return;
  openLocalSimulator(event.detail?.workflow);
});

document.addEventListener('click',event=>{
  const button=event.target.closest?.('.ti84-paired-strip button');
  if(!button)return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const title=document.querySelector('.slide-title')?.textContent||'';
  const workflow=/guard|round|mixed|estimate|quotient/i.test(title)?'guard-digits':'ee-entry';
  openLocalSimulator(workflow);
},true);

data.ti84InlineSimulator=Object.assign({},data.ti84InlineSimulator,{
  bridgeRelease:'6.8.2',
  pairedPracticeConnected:true
});
})();
