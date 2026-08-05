(function(){
  'use strict';

  const data=window.LESSON_DATA;
  const app=document.getElementById('app');
  const drawer=document.getElementById('slide-drawer');
  const drawerList=document.getElementById('drawer-list');
  const progressFill=document.getElementById('progress-fill');
  const progressLabel=document.getElementById('progress-label');
  const previous=document.getElementById('prev-slide');
  const next=document.getElementById('next-slide');
  const headerActions=document.querySelector('.header-actions');
  if(!data||String(data.lesson?.number)!=='1.4'||!data.scopeCollections||!app||!drawerList)return;

  const allMode=data.lesson.active_scope==='all';
  const allSlides=data.scopeCollections.slides;
  const visibleIndices=allSlides
    .map((slide,index)=>({slide,index}))
    .filter(item=>allMode||item.slide.scope==='core')
    .map(item=>item.index);
  const prefix=`echs:ib-ai:u1:${data.lesson.number}:`;
  let correcting=false;
  let scheduled=false;

  function learnIsActive(){
    return document.querySelector('.route-btn[data-route="learn"]')?.classList.contains('active')===true;
  }
  function currentCanonicalIndex(){
    const active=drawerList.querySelector('[data-slide-index].active');
    if(active)return Number(active.dataset.slideIndex);
    const raw=String(progressLabel?.textContent||'').match(/^\s*(\d+)/);
    return raw?Number(raw[1])-1:0;
  }
  function targetFor(direction){
    const current=currentCanonicalIndex();
    let position=visibleIndices.indexOf(current);
    if(position<0){
      if(direction>0)position=visibleIndices.findIndex(index=>index>current)-1;
      else position=visibleIndices.filter(index=>index<current).length;
    }
    const targetPosition=Math.max(0,Math.min(visibleIndices.length-1,position+direction));
    return visibleIndices[targetPosition];
  }
  function openCanonicalIndex(index){
    const button=drawerList.querySelector(`[data-slide-index="${index}"]`);
    if(button){button.click();return true;}
    document.getElementById('open-map')?.click();
    requestAnimationFrame(()=>drawerList.querySelector(`[data-slide-index="${index}"]`)?.click());
    return false;
  }
  function move(direction){
    if(!learnIsActive())return;
    const current=currentCanonicalIndex();
    const target=targetFor(direction);
    if(Number.isInteger(target)&&target!==current)openCanonicalIndex(target);
  }

  function installModeButton(){
    if(!headerActions||document.getElementById('financial-scope-toggle'))return;
    const button=document.createElement('button');
    button.id='financial-scope-toggle';
    button.type='button';
    button.className='header-tool';
    button.title=allMode?'Return to the recommended IB SL core path':'Show all reference-supported extension content';
    button.setAttribute('aria-label',button.title);
    button.innerHTML=`${allMode?'◎':'●'}<span class="tool-label">${allMode?'All content':'IB SL Core'}</span>`;
    button.addEventListener('click',()=>{
      const url=new URL(window.location.href);
      if(allMode)url.searchParams.delete('scope');
      else url.searchParams.set('scope','all');
      window.location.href=url.toString();
    });
    headerActions.insertBefore(button,headerActions.lastElementChild);
  }

  function syncDrawer(){
    const existing=drawerList.querySelector('[data-financial-scope-summary]');
    if(existing)existing.remove();
    const summary=document.createElement('div');
    summary.dataset.financialScopeSummary='true';
    summary.className='empty-state';
    const counts=data.lesson.scope_counts;
    summary.innerHTML=allMode
      ?`<b>All content</b><br>${counts.learn.total} screens: ${counts.learn.core} IB SL core + ${counts.learn.extension} extension.`
      :`<b>IB SL Core</b><br>${counts.learn.core} recommended screens. ${counts.learn.extension} extension screens remain available from the header switch.`;
    drawerList.prepend(summary);

    drawerList.querySelectorAll('[data-slide-index]').forEach(button=>{
      const index=Number(button.dataset.slideIndex);
      const slide=allSlides[index];
      button.hidden=!allMode&&slide?.scope==='extension';
    });
  }

  function syncLearnProgress(){
    if(!learnIsActive())return;
    const current=currentCanonicalIndex();
    if(!allMode&&allSlides[current]?.scope==='extension'&&!correcting){
      correcting=true;
      const nextCore=visibleIndices.find(index=>index>current);
      const previousCore=[...visibleIndices].reverse().find(index=>index<current);
      requestAnimationFrame(()=>{
        openCanonicalIndex(Number.isInteger(nextCore)?nextCore:(previousCore??visibleIndices[0]));
        correcting=false;
      });
      return;
    }
    const position=visibleIndices.indexOf(current);
    if(position<0)return;
    const percent=((position+1)/visibleIndices.length)*100;
    if(progressFill)progressFill.style.width=`${percent}%`;
    if(progressLabel)progressLabel.textContent=allMode
      ?`${current+1} / ${allSlides.length} · All content`
      :`${position+1} / ${visibleIndices.length} · IB SL Core`;
    if(previous)previous.disabled=position===0;
    if(next)next.disabled=position===visibleIndices.length-1;
  }

  function syncRouteLabels(){
    const learnButton=document.querySelector('.route-btn[data-route="learn"]');
    if(learnButton)learnButton.textContent=allMode?'Learn · All content':'Learn · IB SL Core';
    if(document.querySelector('.route-btn[data-route="practice"]')?.classList.contains('active')){
      const paragraph=app.querySelector('.route-header p');
      if(paragraph)paragraph.textContent=`${data.practice.length} ${allMode?'core and extension':'IB SL core'} questions are available in this scope. Work is saved locally on this device.`;
    }
    if(document.querySelector('.route-btn[data-route="quiz"]')?.classList.contains('active')){
      const heading=app.querySelector('.route-header h1');
      const paragraph=app.querySelector('.route-header h1 + p');
      if(heading)heading.textContent=`${data.quiz.length}-question ${allMode?'complete':'IB SL core'} checkpoint`;
      if(paragraph)paragraph.textContent='Suggested time: 25 minutes. Questions are distinct from Practice Studio.';
    }
    if(document.querySelector('.route-btn[data-route="exam"]')?.classList.contains('active')){
      const paragraph=app.querySelector('.route-header p');
      if(paragraph)paragraph.textContent=`${data.exam.length} ${allMode?'core and extension':'IB SL core'} extended-response tasks are available in this scope.`;
    }
  }

  function safeJSON(key,fallback){
    try{return JSON.parse(window.localStorage.getItem(prefix+key))??fallback;}
    catch{return fallback;}
  }
  function syncMastery(){
    if(allMode||!document.querySelector('.route-btn[data-route="review"]')?.classList.contains('active'))return;
    const cards=app.querySelectorAll('.review-grid .stat-card');
    if(cards.length<4)return;
    const visited=new Set(safeJSON('visited-slides',[]));
    const coreVisited=visibleIndices.filter(index=>visited.has(index)).length;
    const learningPercent=Math.round(100*coreVisited/visibleIndices.length);
    const practiceResults=safeJSON('practice-results',{});
    const quizResults=safeJSON('quiz-results',{});
    const practiceAttempted=data.practice.filter(item=>practiceResults[item.id]?.attempted).length;
    const practiceCorrect=data.practice.filter(item=>practiceResults[item.id]?.correct===true).length;
    const quizCorrect=data.quiz.filter(item=>quizResults[item.id]?.correct===true).length;
    const practicePercent=practiceAttempted?Math.round(100*practiceCorrect/practiceAttempted):0;
    const quizPercent=data.quiz.length?Math.round(100*quizCorrect/data.quiz.length):0;
    const mastery=Math.round(.25*learningPercent+.45*practicePercent+.30*quizPercent);
    cards[0].querySelector('b').textContent=`${coreVisited}/${visibleIndices.length}`;
    cards[0].querySelector('small').textContent=`${learningPercent}% of IB SL core viewed`;
    cards[3].querySelector('b').textContent=`${mastery}%`;
    cards[3].querySelector('small').textContent='core-only weighted learning evidence';
  }

  function sync(){
    scheduled=false;
    installModeButton();
    syncDrawer();
    syncLearnProgress();
    syncRouteLabels();
    syncMastery();
  }
  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(sync);
  }

  if(!allMode){
    next?.addEventListener('click',event=>{
      if(!learnIsActive())return;
      event.preventDefault();event.stopImmediatePropagation();move(1);
    },true);
    previous?.addEventListener('click',event=>{
      if(!learnIsActive())return;
      event.preventDefault();event.stopImmediatePropagation();move(-1);
    },true);
    window.addEventListener('keydown',event=>{
      if(!learnIsActive()||/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName||''))return;
      if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
      event.preventDefault();event.stopImmediatePropagation();move(event.key==='ArrowRight'?1:-1);
    },true);
  }

  new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
  new MutationObserver(schedule).observe(drawerList,{childList:true,subtree:false});
  window.addEventListener('hashchange',schedule);
  schedule();
})();
