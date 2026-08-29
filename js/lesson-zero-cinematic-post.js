(function(){
'use strict';
const data=window.ECHS_L0_DATA||window.ECHS_CALC_L0_DATA;
if(!data||!Array.isArray(data.slides))return;
const course=window.ECHS_CALC_L0_DATA?'calculus':'precalculus';
const store=`echs-ap-${course}-lesson-0:connection-quest`;
const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
function refreshQuest(quest,message){
  const cells=[...quest.querySelectorAll('.quest-cell')];
  const meter=quest.querySelector('.quest-meter');
  const status=quest.querySelector('.quest-status');
  cells.forEach(cell=>cell.classList.remove('quest-line'));
  const win=lines.find(line=>line.every(index=>cells[index]?.classList.contains('done')));
  if(win)win.forEach(index=>cells[index]?.classList.add('quest-line'));
  if(meter)meter.textContent=`${cells.filter(cell=>cell.classList.contains('done')).length} of 9 connections confirmed`;
  if(status){
    status.className=`quest-status${win?' success':''}`;
    status.textContent=message||(win?'Connection line complete! Return ready to introduce one person and one useful strategy.':'Goal: complete one row, column, or diagonal using three different classmates.');
  }
}
function enhanceQuest(quest){
  if(quest.dataset.postEnhanced==='1')return;
  quest.dataset.postEnhanced='1';
  const footer=quest.querySelector('.quest-footer');
  if(!footer)return;
  let reset=footer.querySelector('.quest-reset');
  if(!reset){
    reset=document.createElement('button');
    reset.type='button';
    reset.className='quest-reset';
    reset.textContent='Reset quest';
    footer.appendChild(reset);
  }
  quest.addEventListener('input',event=>{
    const input=event.target.closest?.('.quest-name');
    if(!input)return;
    const cell=input.closest('.quest-cell');
    if(!cell?.classList.contains('done'))return;
    const index=Number(cell.dataset.index);
    cell.classList.remove('done','quest-line');
    const confirm=cell.querySelector('.quest-confirm');
    if(confirm)confirm.textContent='Confirm connection';
    localStorage.setItem(`${store}:done:${index}`,'0');
    refreshQuest(quest,'Name changed. Confirm this connection again.');
  },true);
  reset.addEventListener('click',()=>{
    quest.querySelectorAll('.quest-cell').forEach((cell,index)=>{
      cell.classList.remove('done','quest-line','needs-name');
      const input=cell.querySelector('.quest-name');
      const confirm=cell.querySelector('.quest-confirm');
      if(input)input.value='';
      if(confirm)confirm.textContent='Confirm connection';
      localStorage.removeItem(`${store}:name:${index}`);
      localStorage.removeItem(`${store}:done:${index}`);
    });
    refreshQuest(quest,'Quest reset. Find a classmate, ask the follow-up, then record the first name.');
  });
  refreshQuest(quest);
}
function apply(){
  document.querySelectorAll('.slide').forEach((slide,index)=>{
    const record=data.slides[index];
    if(!record)return;
    slide.dataset.stage=record.stage||'';
    if(record.id==='welcome')slide.classList.add('title-slide');
  });
  document.querySelectorAll('.connection-quest').forEach(enhanceQuest);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(apply,0),{once:true});
else setTimeout(apply,0);
window.addEventListener('load',apply,{once:true});
})();
