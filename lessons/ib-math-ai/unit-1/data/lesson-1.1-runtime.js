(function(){
  'use strict';
  const data=window.LESSON_DATA;
  if(!data || !data.lesson || data.lesson.number!=='1.1') return;

  data.version='4.0.1';
  const cover=data.slides && data.slides[0];
  if(cover && typeof cover.html==='string'){
    cover.html=cover.html.replace(
      /<div class="v4-release-badge">[\s\S]*?<\/div>/,
      '<div class="cover-key-idea"><b>Central idea:</b> the coefficient carries the significant digits; the exponent communicates the scale.</div><button class="route-jump cover-start" data-go="learn" data-cover-next="1">Begin lesson <span aria-hidden="true">→</span></button>'
    );
  }

  function setText(node,text){
    if(node && node.textContent!==text) node.textContent=text;
  }
  function patch(root){
    root.querySelectorAll('[data-filter]').forEach(button=>{
      const level=button.dataset.filter;
      const count=level==='All'?data.practice.length:data.practice.filter(q=>q.level===level).length;
      setText(button,`${level} · ${count}`);
    });
    root.querySelectorAll('.route-header h1').forEach(node=>{
      if(/question checkpoint/i.test(node.textContent)) setText(node,`${data.quiz.length}-question checkpoint`);
    });
    root.querySelectorAll('.route-header p').forEach(node=>{
      if(/original questions/i.test(node.textContent)) setText(node,`${data.practice.length} original questions are balanced across four levels. Work is saved locally on this device.`);
      else if(/original extended-response tasks|original tasks per lesson/i.test(node.textContent)) setText(node,`${data.exam.length} original extended-response tasks. Use command terms, show technology transparently and interpret every contextual result.`);
      else if(/questions are distinct from Practice Studio/i.test(node.textContent)) setText(node,`Suggested time: 25 minutes. All ${data.quiz.length} questions are distinct from Practice Studio.`);
    });
  }
  function start(){
    patch(document);
    const observer=new MutationObserver(()=>patch(document));
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();

  document.addEventListener('click',function(event){
    const button=event.target.closest('[data-cover-next]');
    if(!button) return;
    event.preventDefault();
    try{
      const prefix=`echs:ib-ai:u1:${window.LESSON_DATA.lesson.number}:`;
      window.localStorage.setItem(prefix+'learn-index',String(Number(button.dataset.coverNext||1)));
      window.location.reload();
    }catch(_){
      window.location.hash='#learn';
    }
  });
})();
