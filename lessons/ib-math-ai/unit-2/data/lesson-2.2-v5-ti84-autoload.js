(function(){
  'use strict';
  if(String(window.LESSON_DATA?.lesson?.number)!=='2.2')return;
  function revealWhenLoaded(frame,loading){
    if(!frame)return;
    let revealed=false;
    const reveal=()=>{
      if(revealed)return;
      revealed=true;
      if(loading)loading.hidden=true;
      frame.classList.add('ready');
    };
    frame.addEventListener('load',reveal,{once:true});
    window.setTimeout(reveal,1500);
  }
  function autoload(){
    const dock=document.querySelector('#lq5-ti-dock.open');
    if(!dock)return;
    const frame=dock.querySelector('[data-ti-frame]');
    const loading=dock.querySelector('[data-ti-loading]');
    const button=dock.querySelector('[data-ti-load]');
    if(button){
      revealWhenLoaded(frame,loading);
      button.click();
    }
  }
  document.addEventListener('click',event=>{
    if(event.target.closest('#lq5-ti-simulator,[data-open-dock]'))setTimeout(autoload,40);
    if(event.target.closest('[data-ti-reload]')){
      const dock=document.querySelector('#lq5-ti-dock.open');
      revealWhenLoaded(dock?.querySelector('[data-ti-frame]'),dock?.querySelector('[data-ti-loading]'));
    }
  });
  window.addEventListener('echs:lq5:open-ti84',()=>setTimeout(autoload,40));
})();
