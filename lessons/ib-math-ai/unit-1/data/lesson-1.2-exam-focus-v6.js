(() => {
  'use strict';

  const app=document.getElementById('app');
  if(!app)return;
  const lessonNumber=String(window.LESSON_DATA?.lesson?.number||'1.2');
  const prefix=`echs:ib-ai:u1:${lessonNumber}:`;
  const taskStorageKey=prefix+'exam-task-index';
  const partStoragePrefix=prefix+'exam-part-index:';
  let scheduled=false;

  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const text=value=>String(value??'').trim();
  const readNumber=(key,fallback=0)=>{
    try{const value=Number(localStorage.getItem(key));return Number.isFinite(value)?value:fallback;}
    catch{return fallback;}
  };
  const saveNumber=(key,value)=>{try{localStorage.setItem(key,String(value));}catch{}};

  function taskMarks(task){
    const chip=[...task.querySelectorAll('.task-meta>span')].find(node=>/\bmarks?\b/i.test(node.textContent));
    return Number(chip?.textContent.match(/\d+/)?.[0]||0);
  }
  function partMarks(part){return Number(part.querySelector('.marks')?.textContent.match(/\d+/)?.[0]||0);}
  function taskTitle(task,index){return text(task.querySelector('h2')?.textContent)||`Task ${index+1}`;}
  function partLabel(part,index){
    return text(part.querySelector(':scope>p>b')?.textContent).replace(/[()]/g,'')||String.fromCharCode(97+index);
  }
  function scrollToTask(task,smooth=true){
    const target=task.querySelector('.exam-part-tabs')||task;
    target.scrollIntoView({behavior:smooth?'smooth':'instant',block:'start'});
  }

  function enhanceExam(){
    const page=app.querySelector('.route-page');
    const tasks=[...app.querySelectorAll('.exam-task')];
    const active=Boolean(page&&tasks.length);
    document.body.classList.toggle('exam-assessment-active',active);
    if(!active||page.dataset.examPagerEnhanced==='6')return;
    page.dataset.examPagerEnhanced='6';
    page.classList.add('exam-route','exam-route-paged','exam-route-part-paged');

    const header=page.querySelector('.route-header');
    if(header){
      header.classList.add('exam-route-header');
      const copy=document.createElement('div');
      copy.className='exam-route-copy';
      [...header.children].forEach(node=>copy.append(node));
      const description=copy.querySelector('p');
      if(description)description.textContent=`${tasks.length} original extended-response tasks. Select a task, then complete one response part at a time with full mathematical reasoning.`;
      const totalMarks=tasks.reduce((sum,task)=>sum+taskMarks(task),0);
      const partCount=tasks.reduce((sum,task)=>sum+task.querySelectorAll('.exam-part').length,0);
      const overview=document.createElement('div');
      overview.className='exam-overview';
      overview.innerHTML=`<span>${tasks.length} focused tasks</span><span>${partCount} response parts</span><span>${totalMarks} marks total</span>`;
      header.append(copy,overview);
    }

    const taskTabs=document.createElement('nav');
    taskTabs.className='exam-task-tabs';
    taskTabs.setAttribute('aria-label','IB assessment tasks');
    taskTabs.innerHTML=tasks.map((task,index)=>(
      `<button class="exam-task-tab" type="button" role="tab" data-exam-task-tab="${index}" aria-selected="false">`+
      `<small>Task ${index+1}</small><b>${taskTitle(task,index)}</b><span>${taskMarks(task)} marks</span></button>`
    )).join('');
    header?.insertAdjacentElement('afterend',taskTabs);

    const taskParts=[];
    const partTabs=[];

    tasks.forEach((task,taskIndex)=>{
      task.classList.add('exam-task-panel');
      task.dataset.examTaskIndex=String(taskIndex);
      task.setAttribute('role','tabpanel');
      const parts=[...task.querySelectorAll(':scope>.exam-part')];
      taskParts.push(parts);

      const progress=document.createElement('div');
      progress.className='exam-task-progress';
      progress.innerHTML=`<b>Task ${taskIndex+1} of ${tasks.length}</b><div class="exam-completion-track" aria-hidden="true"><span></span></div><span data-exam-completion>0 of ${parts.length} parts started</span>`;
      task.prepend(progress);

      const meta=task.querySelector(':scope>.task-meta');
      const title=task.querySelector(':scope>h2');
      const context=[...task.children].find(node=>node.tagName==='P');
      const intro=document.createElement('div');
      intro.className='exam-task-intro';
      const identity=document.createElement('div');
      identity.className='exam-task-identity';
      if(meta)identity.append(meta);
      if(title)identity.append(title);
      if(context)context.classList.add('exam-context');
      intro.append(identity);
      if(context)intro.append(context);
      task.insertBefore(intro,parts[0]||null);

      const nav=document.createElement('nav');
      nav.className='exam-part-tabs';
      nav.setAttribute('aria-label',`${taskTitle(task,taskIndex)} response parts`);
      nav.innerHTML=parts.map((part,partIndex)=>{
        const label=partLabel(part,partIndex);
        const marks=partMarks(part);
        return `<button class="exam-part-tab" type="button" role="tab" data-exam-part-tab="${taskIndex}:${partIndex}" aria-selected="false"><small>Part (${label})</small><b>${marks} ${marks===1?'mark':'marks'}</b><span data-exam-part-state>Not started</span></button>`;
      }).join('');
      task.insertBefore(nav,parts[0]||null);
      partTabs.push([...nav.querySelectorAll('[data-exam-part-tab]')]);

      const stage=document.createElement('div');
      stage.className='exam-part-stage';
      task.insertBefore(stage,parts[0]||null);
      parts.forEach((part,partIndex)=>{
        part.classList.add('exam-part-card');
        part.dataset.examPartIndex=String(partIndex);
        part.setAttribute('role','tabpanel');
        stage.append(part);
      });

      const footer=document.createElement('div');
      footer.className='exam-step-footer-nav';
      footer.innerHTML=`<button class="secondary-btn" type="button" data-exam-step-previous>Previous part</button><div><b data-exam-step-title>Part 1 of ${parts.length}</b><span data-exam-step-status>Responses are saved automatically on this device.</span></div><button class="primary-btn" type="button" data-exam-step-next>Next part</button>`;
      task.append(footer);
    });

    const taskButtons=[...taskTabs.querySelectorAll('[data-exam-task-tab]')];
    let activeTask=clamp(readNumber(taskStorageKey),0,tasks.length-1);
    let activePart=0;

    const partStarted=part=>[...part.querySelectorAll('[data-exam-note]')].some(field=>text(field.value).length>0);

    function updateCompletion(taskIndex){
      const parts=taskParts[taskIndex];
      const started=parts.filter(partStarted).length;
      const task=tasks[taskIndex];
      const bar=task.querySelector('.exam-completion-track>span');
      if(bar)bar.style.width=`${parts.length?100*started/parts.length:0}%`;
      const label=task.querySelector('[data-exam-completion]');
      if(label)label.textContent=`${started} of ${parts.length} parts started`;
      partTabs[taskIndex].forEach((button,index)=>{
        const startedPart=partStarted(parts[index]);
        button.classList.toggle('is-started',startedPart);
        const state=button.querySelector('[data-exam-part-state]');
        if(state)state.textContent=startedPart?'Response started':'Not started';
      });
    }

    function updateFooter(){
      const task=tasks[activeTask];
      const parts=taskParts[activeTask];
      const part=parts[activePart];
      const previous=task.querySelector('[data-exam-step-previous]');
      const next=task.querySelector('[data-exam-step-next]');
      const title=task.querySelector('[data-exam-step-title]');
      const status=task.querySelector('[data-exam-step-status]');
      const atBeginning=activeTask===0&&activePart===0;
      const atEnd=activeTask===tasks.length-1&&activePart===parts.length-1;
      previous.disabled=atBeginning;
      next.disabled=atEnd;
      previous.textContent=activePart===0&&activeTask>0?'Previous task':'Previous part';
      next.textContent=activePart===parts.length-1&&activeTask<tasks.length-1?'Next task':(atEnd?'Assessment complete':'Next part');
      if(title)title.textContent=`Part (${partLabel(part,activePart)}) · ${activePart+1} of ${parts.length}`;
      if(status)status.textContent=partStarted(part)?'This response is saved automatically.':'Write a complete response before revealing the markscheme.';
    }

    function show(taskIndex,partIndex,shouldScroll=true){
      activeTask=clamp(taskIndex,0,tasks.length-1);
      activePart=clamp(partIndex,0,taskParts[activeTask].length-1);
      saveNumber(taskStorageKey,activeTask);
      saveNumber(partStoragePrefix+activeTask,activePart);

      tasks.forEach((task,index)=>{
        const selected=index===activeTask;
        task.hidden=!selected;
        task.setAttribute('aria-hidden',selected?'false':'true');
      });
      taskButtons.forEach((button,index)=>{
        const selected=index===activeTask;
        button.setAttribute('aria-selected',selected?'true':'false');
        button.tabIndex=selected?0:-1;
      });
      taskParts.forEach((parts,taskIndexValue)=>{
        parts.forEach((part,partIndexValue)=>{
          const selected=taskIndexValue===activeTask&&partIndexValue===activePart;
          part.hidden=!selected;
          part.setAttribute('aria-hidden',selected?'false':'true');
        });
        partTabs[taskIndexValue].forEach((button,partIndexValue)=>{
          const selected=taskIndexValue===activeTask&&partIndexValue===activePart;
          button.setAttribute('aria-selected',selected?'true':'false');
          button.tabIndex=selected?0:-1;
        });
      });
      updateCompletion(activeTask);
      updateFooter();
      if(shouldScroll)scrollToTask(tasks[activeTask]);
    }

    function openTask(index,shouldScroll=true){
      const taskIndex=clamp(index,0,tasks.length-1);
      const savedPart=clamp(readNumber(partStoragePrefix+taskIndex),0,taskParts[taskIndex].length-1);
      show(taskIndex,savedPart,shouldScroll);
    }

    function move(direction){
      let taskIndex=activeTask;
      let partIndex=activePart+direction;
      if(direction>0&&partIndex>=taskParts[taskIndex].length){
        if(taskIndex>=tasks.length-1)return;
        taskIndex+=1;partIndex=0;
      }else if(direction<0&&partIndex<0){
        if(taskIndex<=0)return;
        taskIndex-=1;partIndex=taskParts[taskIndex].length-1;
      }
      show(taskIndex,partIndex);
    }

    taskButtons.forEach(button=>button.addEventListener('click',()=>openTask(Number(button.dataset.examTaskTab))));
    partTabs.forEach((buttons,taskIndex)=>{
      buttons.forEach(button=>button.addEventListener('click',()=>{
        const partIndex=Number(button.dataset.examPartTab.split(':')[1]);
        show(taskIndex,partIndex);
      }));
      buttons[0]?.parentElement?.addEventListener('keydown',event=>{
        if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
        event.preventDefault();
        let next=activePart;
        if(event.key==='ArrowLeft')next-=1;
        if(event.key==='ArrowRight')next+=1;
        if(event.key==='Home')next=0;
        if(event.key==='End')next=taskParts[taskIndex].length-1;
        show(taskIndex,next);
        partTabs[taskIndex][activePart]?.focus();
      });
    });
    tasks.forEach((task,taskIndex)=>{
      task.querySelector('[data-exam-step-previous]')?.addEventListener('click',()=>move(-1));
      task.querySelector('[data-exam-step-next]')?.addEventListener('click',()=>move(1));
      task.querySelectorAll('[data-exam-note]').forEach(field=>field.addEventListener('input',()=>{
        updateCompletion(taskIndex);
        if(taskIndex===activeTask)updateFooter();
      }));
      updateCompletion(taskIndex);
    });
    taskTabs.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      event.preventDefault();
      let next=activeTask;
      if(event.key==='ArrowLeft')next-=1;
      if(event.key==='ArrowRight')next+=1;
      if(event.key==='Home')next=0;
      if(event.key==='End')next=tasks.length-1;
      openTask(next);
      taskButtons[activeTask]?.focus();
    });
    openTask(activeTask,false);
  }

  const schedule=()=>{
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;enhanceExam();});
  };
  new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
  addEventListener('hashchange',schedule);
  schedule();
})();
