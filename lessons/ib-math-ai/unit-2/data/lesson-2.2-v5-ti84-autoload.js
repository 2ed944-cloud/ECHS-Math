(function(){
  'use strict';
  if(String(window.LESSON_DATA?.lesson?.number)!=='2.2')return;
  function autoload(){const button=document.querySelector('#lq5-ti-dock.open [data-ti-load]');if(button)button.click();}
  document.addEventListener('click',event=>{if(event.target.closest('#lq5-ti-simulator,[data-open-dock]'))setTimeout(autoload,40);});
  window.addEventListener('echs:lq5:open-ti84',()=>setTimeout(autoload,40));
})();
