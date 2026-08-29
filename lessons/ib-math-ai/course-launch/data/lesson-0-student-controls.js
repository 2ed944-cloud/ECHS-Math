/* IB Math AI Lesson 0 — fullscreen and classroom interaction controls */
(function(){
  'use strict';

  const STORE='echs-ib-math-ai-lesson-0';
  const questStore=`${STORE}:connection-quest`;
  const lines=[
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];

  const normalise=value=>String(value||'').trim().toLowerCase().replace(/\s+/g,' ');

  function bindFullscreen(){
    const button=document.getElementById('fullscreenToggle');
    if(!button||button.dataset.bound==='1')return;
    button.dataset.bound='1';

    const label=button.querySelector('[data-fullscreen-label]');
    const icon=button.querySelector('.fullscreen-icon');
    const root=document.documentElement;
    const nativeElement=()=>document.fullscreenElement||document.webkitFullscreenElement||null;
    const fallbackActive=()=>document.body.classList.contains('presentation-mode');
    const active=()=>Boolean(nativeElement()||fallbackActive());

    function update(){
      const on=active();
      button.setAttribute('aria-pressed',on?'true':'false');
      button.setAttribute('aria-label',on?'Exit full screen':'Enter full screen');
      button.title=on?'Exit full screen (Esc)':'Full screen (F)';
      if(label)label.textContent=on?'Exit full screen':'Full screen';
      if(icon)icon.textContent=on?'↙':'⛶';
    }

    async function enter(){
      document.body.classList.remove('presentation-mode');
      try{
        if(root.requestFullscreen){
          try{await root.requestFullscreen({navigationUI:'hide'});}
          catch(firstError){await root.requestFullscreen();}
          return;
        }
        if(root.webkitRequestFullscreen){
          root.webkitRequestFullscreen();
          return;
        }
      }catch(error){
        console.warn('Native fullscreen unavailable; using presentation mode.',error);
      }
      document.body.classList.add('presentation-mode');
      update();
    }

    async function exit(){
      try{
        if(document.fullscreenElement&&document.exitFullscreen){
          await document.exitFullscreen();
          return;
        }
        if(document.webkitFullscreenElement&&document.webkitExitFullscreen){
          document.webkitExitFullscreen();
          return;
        }
      }catch(error){
        console.warn('Fullscreen exit failed; restoring page layout.',error);
      }
      document.body.classList.remove('presentation-mode');
      update();
    }

    async function toggle(){
      if(active())await exit();
      else await enter();
    }

    button.addEventListener('click',toggle);
    document.addEventListener('fullscreenchange',update);
    document.addEventListener('webkitfullscreenchange',update);
    document.addEventListener('keydown',event=>{
      const element=document.activeElement;
      const editing=['INPUT','TEXTAREA','SELECT'].includes(element?.tagName)||element?.isContentEditable;
      if(editing)return;
      if(event.key==='f'||event.key==='F'){
        event.preventDefault();
        toggle();
      }else if(event.key==='Escape'&&fallbackActive()){
        document.body.classList.remove('presentation-mode');
        update();
      }
    });
    update();
  }

  function refreshQuest(quest,message){
    const cells=[...quest.querySelectorAll('.quest-cell')];
    const meter=quest.querySelector('.quest-meter');
    const status=quest.querySelector('.quest-status');

    cells.forEach(cell=>cell.classList.remove('quest-line'));
    const win=lines.find(line=>line.every(index=>cells[index]?.classList.contains('done')));
    if(win)win.forEach(index=>cells[index]?.classList.add('quest-line'));

    const count=cells.filter(cell=>cell.classList.contains('done')).length;
    if(meter)meter.textContent=`${count} of 9 connections confirmed`;
    if(status){
      status.className=`quest-status${win?' success':''}`;
      status.textContent=message||(win
        ?'Connection line complete! Be ready to introduce one classmate and one useful idea.'
        :'Goal: complete one row, column, or diagonal using three different classmates.');
    }
  }

  function bindQuest(){
    const quest=document.querySelector('.ibai-connection-quest');
    if(!quest||quest.dataset.bound==='1')return;
    quest.dataset.bound='1';
    const cells=[...quest.querySelectorAll('.quest-cell')];

    cells.forEach((cell,index)=>{
      const input=cell.querySelector('.quest-name');
      const button=cell.querySelector('.quest-confirm');
      if(!input||!button)return;

      const nameKey=`${questStore}:name:${index}`;
      const doneKey=`${questStore}:done:${index}`;
      input.value=localStorage.getItem(nameKey)||'';
      const done=localStorage.getItem(doneKey)==='1';
      cell.classList.toggle('done',done);
      button.textContent=done?'✓ Connection confirmed':'Confirm connection';

      input.addEventListener('input',()=>{
        localStorage.setItem(nameKey,input.value);
        cell.classList.remove('needs-name');
        if(cell.classList.contains('done')){
          cell.classList.remove('done','quest-line');
          localStorage.setItem(doneKey,'0');
          button.textContent='Confirm connection';
          refreshQuest(quest,'Name changed. Confirm this connection again.');
        }
      });

      function toggle(){
        const name=normalise(input.value);
        const isDone=cell.classList.contains('done');

        if(!name){
          cell.classList.add('needs-name');
          refreshQuest(quest,'Write the classmate’s first name before confirming.');
          input.focus();
          return;
        }

        if(!isDone){
          const duplicate=cells.some((other,otherIndex)=>
            otherIndex!==index&&
            other.classList.contains('done')&&
            normalise(other.querySelector('.quest-name')?.value)===name
          );
          if(duplicate){
            refreshQuest(quest,'Use a different classmate for each confirmed connection.');
            input.focus();
            return;
          }
        }

        cell.classList.toggle('done',!isDone);
        localStorage.setItem(doneKey,isDone?'0':'1');
        button.textContent=isDone?'Confirm connection':'✓ Connection confirmed';
        refreshQuest(quest);
      }

      button.addEventListener('click',toggle);
      input.addEventListener('keydown',event=>{
        if(event.key==='Enter'){
          event.preventDefault();
          toggle();
        }
      });
    });

    const reset=quest.querySelector('.quest-reset');
    reset?.addEventListener('click',()=>{
      cells.forEach((cell,index)=>{
        cell.classList.remove('done','quest-line','needs-name');
        const input=cell.querySelector('.quest-name');
        const button=cell.querySelector('.quest-confirm');
        if(input)input.value='';
        if(button)button.textContent='Confirm connection';
        localStorage.removeItem(`${questStore}:name:${index}`);
        localStorage.removeItem(`${questStore}:done:${index}`);
      });
      refreshQuest(quest,'Quest reset. Find a classmate, ask the follow-up, then record the first name.');
    });

    refreshQuest(quest);
  }

  function bindRules(){
    const button=document.getElementById('normAck');
    const status=document.getElementById('normAckStatus');
    if(!button||!status||button.dataset.bound==='1')return;
    button.dataset.bound='1';
    const key=`${STORE}:norms-acknowledged`;

    function show(){
      const acknowledged=localStorage.getItem(key)==='1';
      button.classList.toggle('acknowledged',acknowledged);
      button.textContent=acknowledged?'✓ Classroom agreements acknowledged':'I understand and can follow these agreements';
      status.textContent=acknowledged
        ?'Thank you. These agreements protect everyone’s opportunity to learn.'
        :'';
    }

    button.addEventListener('click',()=>{
      localStorage.setItem(key,localStorage.getItem(key)==='1'?'0':'1');
      show();
    });
    show();
  }

  function bindDiagnosticStart(){
    const button=document.getElementById('beginDiagnostic');
    if(!button||button.dataset.bound==='1')return;
    button.dataset.bound='1';
    button.addEventListener('click',()=>document.getElementById('nextBtn')?.click());
  }

  function reinforceLogo(){
    const image=document.querySelector('.school-network-logo');
    if(!image||image.dataset.logoBound==='1')return;
    image.dataset.logoBound='1';
    image.addEventListener('error',()=>{
      if(image.dataset.fallbackUsed==='1')return;
      image.dataset.fallbackUsed='1';
      image.src='../../../assets/echs_logo.png?v=20260829-ibai4';
    });
  }

  function init(){
    bindFullscreen();
    bindQuest();
    bindRules();
    bindDiagnosticStart();
    reinforceLogo();
  }

  setTimeout(init,0);
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0),{once:true});
  }
  window.addEventListener('load',init,{once:true});
})();