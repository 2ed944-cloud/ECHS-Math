(function(){
'use strict';
const data=window.LESSON_DATA;
if(!data||String(data.lesson?.number)!=='2.2')return;
const all=data.lesson?.active_scope==='all';
function install(){
  document.documentElement.dataset.lesson22Scope=all?'all':'required';
  const actions=document.querySelector('.header-actions');
  if(actions&&!document.getElementById('l22-more-toggle')){
    const button=document.createElement('button');button.id='l22-more-toggle';button.type='button';button.className='header-tool l22-more-toggle';button.title=all?'Return to the recommended lesson path':'Show optional enrichment';button.setAttribute('aria-label',button.title);button.innerHTML=`${all?'−':'＋'}<span class="tool-label">Enrichment</span>`;button.addEventListener('click',()=>{const url=new URL(location.href);if(all)url.searchParams.delete('scope');else url.searchParams.set('scope','all');location.href=url.toString();});actions.insertBefore(button,actions.lastElementChild||null);
  }
  const drawer=document.getElementById('drawer-list');if(drawer){drawer.querySelectorAll('[data-slide-index]').forEach((button,index)=>{const slide=data.slides[index];if(slide?.scope==='extension')button.classList.add('l22-extension-item');});}
}
const observer=new MutationObserver(install);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{install();const drawer=document.getElementById('drawer-list');if(drawer)observer.observe(drawer,{childList:true});},{once:true});else{install();const drawer=document.getElementById('drawer-list');if(drawer)observer.observe(drawer,{childList:true});}
})();
