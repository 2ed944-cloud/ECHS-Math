(function(){
'use strict';
const data=window.LESSON_DATA;if(!data||!data.lesson)return;
const lesson=String(data.lesson.number||'');
document.documentElement.classList.add('echs-unit1-v5','ap-screen-lesson','unit1-lesson-'+lesson.replace('.','-'));
const prefix=`echs:ib-ai:u1:${lesson}:`;
const $=(s,r=document)=>r.querySelector(s);const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const get=k=>{try{return localStorage.getItem(prefix+k)}catch(_){return null}};const set=(k,v)=>{try{localStorage.setItem(prefix+k,String(v))}catch(_){}};
let lastStage=null;
function setText(node,text){if(node&&node.textContent!==text)node.textContent=text}
function resetStage(){const stage=$('.stage');if(!stage||stage===lastStage)return;lastStage=stage;const reset=()=>{stage.scrollTop=0;stage.scrollLeft=0;const app=$('#app');if(app){app.scrollTop=0;app.scrollLeft=0}window.scrollTo(0,0)};reset();requestAnimationFrame(()=>{reset();requestAnimationFrame(reset)})}
function patch(root=document){
  root.querySelectorAll('[data-filter]').forEach(button=>{const level=button.dataset.filter;const count=level==='All'?data.practice.length:data.practice.filter(q=>q.level===level).length;setText(button,`${level} · ${count}`)});
  root.querySelectorAll('.route-header h1').forEach(node=>{if(/question checkpoint/i.test(node.textContent))setText(node,`${data.quiz.length}-question checkpoint`)});
  root.querySelectorAll('.route-header p').forEach(node=>{if(/original questions/i.test(node.textContent))setText(node,`${data.practice.length} original questions are balanced across four levels. Work is saved locally on this device.`);else if(/original tasks per lesson|original extended-response tasks/i.test(node.textContent))setText(node,`${data.exam.length} original extended-response tasks. Use command terms, show technology transparently and interpret every contextual result.`);else if(/questions are distinct from Practice Studio/i.test(node.textContent))setText(node,`Suggested time: 25 minutes. All ${data.quiz.length} questions are distinct from Practice Studio.`)});
  const footer=$('#lesson-footer');document.body.classList.toggle('route-page-active',!!footer&&getComputedStyle(footer).display==='none');
  const start=$('#start-lesson');if(start)setText(start,Number(get('learn-index')||0)>0?'Continue':'Start');
  resetStage();
}
function go(index){set('learn-index',index);if(location.hash!=='#learn')location.hash='#learn';location.reload()}
function closeMenu(){document.body.classList.remove('lesson-menu-open');const b=$('#toggle-route-menu');if(b)b.setAttribute('aria-expanded','false')}
function init(){
 patch(document);new MutationObserver(()=>patch(document)).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['style']});
 $('#start-lesson')?.addEventListener('click',()=>go(Math.max(1,Number(get('learn-index')||1))));
 $('#toggle-fullscreen')?.addEventListener('click',async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen()}catch(_){}});
 $('#toggle-route-menu')?.addEventListener('click',e=>{const open=document.body.classList.toggle('lesson-menu-open');e.currentTarget.setAttribute('aria-expanded',String(open))});
 $('#lesson-home')?.addEventListener('click',()=>{location.href='../START_HERE.html'});
 document.addEventListener('click',e=>{const begin=e.target.closest('[data-cover-next]');if(begin){e.preventDefault();go(Number(begin.dataset.coverNext||1))}const route=e.target.closest('.route-btn');if(route){setTimeout(()=>patch(document),0);if(matchMedia('(max-width:760px)').matches)closeMenu()}});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeMenu();if(document.fullscreenElement)document.exitFullscreen().catch(()=>{})}})
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
