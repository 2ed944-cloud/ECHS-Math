(function(){
  'use strict';
  const data=window.LESSON_DATA;
  if(!data || !data.lesson || data.lesson.number!=='1.1') return;
  const prefix=`echs:ib-ai:u1:${data.lesson.number}:`;
  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const setText=(node,text)=>{ if(node && node.textContent!==text) node.textContent=text; };
  function storageGet(key){ try{return window.localStorage.getItem(prefix+key);}catch(_){return null;} }
  function storageSet(key,value){ try{window.localStorage.setItem(prefix+key,String(value));}catch(_){} }
  function goToLearnIndex(index){ storageSet('learn-index',index); if(location.hash!=='#learn') location.hash='#learn'; location.reload(); }
  function patch(root){
    root.querySelectorAll('[data-filter]').forEach(button=>{
      const level=button.dataset.filter;
      const count=level==='All'?data.practice.length:data.practice.filter(q=>q.level===level).length;
      setText(button,`${level} · ${count}`);
    });
    root.querySelectorAll('.route-header h1').forEach(node=>{
      if(/Ten-question checkpoint|\d+-question checkpoint/i.test(node.textContent)) setText(node,`${data.quiz.length}-question checkpoint`);
    });
    root.querySelectorAll('.route-header p').forEach(node=>{
      if(/Forty original questions|original, source-informed questions|deliberately distinct questions/i.test(node.textContent)) setText(node,`${data.practice.length} original, deliberately distinct questions are balanced across four levels. Work is saved locally on this device.`);
      if(/Two original tasks per lesson|original extended-response tasks/i.test(node.textContent)) setText(node,`${data.exam.length} original extended-response tasks. Use command terms, show technology transparently and interpret every contextual result.`);
      if(/Questions are distinct from Practice Studio|questions are distinct from Practice Studio/i.test(node.textContent)) setText(node,`Suggested time: 25 minutes. All ${data.quiz.length} questions are distinct from Practice Studio.`);
    });
    const footer=$('#lesson-footer');
    document.body.classList.toggle('route-page-active',!!footer && getComputedStyle(footer).display==='none');
    const start=$('#start-lesson');
    if(start){ const current=Number(storageGet('learn-index')||0); setText(start,current>0?'Continue':'Start'); }
  }
  function closeMenu(){ document.body.classList.remove('lesson-menu-open'); const b=$('#toggle-route-menu'); if(b)b.setAttribute('aria-expanded','false'); }
  function start(){
    patch(document);
    const observer=new MutationObserver(()=>patch(document));
    observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['style']});
    const menuButton=$('#toggle-route-menu');
    menuButton?.addEventListener('click',event=>{event.stopPropagation();const open=document.body.classList.toggle('lesson-menu-open');menuButton.setAttribute('aria-expanded',String(open));});
    $('#lesson-route-menu')?.addEventListener('click',event=>event.stopPropagation());
    $$('.route-btn').forEach(button=>button.addEventListener('click',closeMenu));
    $('#lesson-home')?.addEventListener('click',()=>{window.location.href='../START_HERE.html';});
    document.addEventListener('click',closeMenu);
    document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu();});
    $('#start-lesson')?.addEventListener('click',()=>{const current=Number(storageGet('learn-index')||0);goToLearnIndex(current>0?current:1);});
    $('#toggle-fullscreen')?.addEventListener('click',async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen();}catch(_){}});
    document.addEventListener('fullscreenchange',()=>{const b=$('#toggle-fullscreen');if(b){b.firstChild.nodeValue=document.fullscreenElement?'↙':'⛶';b.title=document.fullscreenElement?'Exit fullscreen':'Fullscreen';}});
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-cover-next]');
    if(!button)return;
    event.preventDefault();
    goToLearnIndex(Number(button.dataset.coverNext||1));
  });
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
})();
