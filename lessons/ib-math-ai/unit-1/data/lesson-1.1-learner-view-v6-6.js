(function(){
'use strict';
const data=window.LESSON_DATA;
if(!data||String(data.lesson?.number)!=='1.1'||!Array.isArray(data.slides))return;

const oldTitle='1.1 · Number Foundations, Scientific Notation and Approximation';
const newTitle='1.1 · Scientific Notation, Approximation and Error';
const normalize=value=>String(value||'')
  .replace(/[🟢🔵🟠🟣]/g,'')
  .replace(/\s+/g,' ')
  .trim()
  .toLowerCase();

const legacyHeading=text=>{
  const value=normalize(text);
  return /^lesson 1\.1[a-z]$/.test(value)
    || value.startsWith('estimated teaching time:')
    || ['core (teach in class)','practice','extension','revision','ib sl core','core + extension'].includes(value);
};
const activity=slide=>{
  const kind=String(slide.kind||'').toLowerCase();
  const text=`${slide.originalSection||slide.section||''} ${slide.originalTitle||slide.title||''}`;
  return ['student','inquiry','lab','worked','misconception'].includes(kind)
    || /(diagnostic|misconception|checkpoint|exit ticket|mastery|synthesis|retrieval|review|student turn|your turn|opening problem|investigat|practice|worked example)/i.test(text);
};
const marker=slide=>activity(slide)?'practice':slide.scope==='extension'?'extension':'core';

function stripHeadingElements(html){
  return String(html||'').replace(/<h([1-4])\b[^>]*>([\s\S]*?)<\/h\1>/gi,(whole,_level,inside)=>{
    const text=inside.replace(/<[^>]+>/g,' ');
    return legacyHeading(text)?'':whole;
  });
}
function cleanHtml(html){
  return stripHeadingElements(html)
    .replace(/<span\b[^>]*class=["'][^"']*\bib-slide-color\b[^"']*["'][^>]*><\/span>/gi,'')
    .replace(/<div class=["']v3-release-badge["']>[\s\S]*?<\/div>/gi,'')
    .replace(/<div class=["']v3-source-basis["']>[\s\S]*?<\/div>/gi,'')
    .replace(/<div class=["']transition-note["']>[\s\S]*?<\/div>/gi,'')
    .replace(/<span>\s*Current syllabus\s*<\/span>/gi,'')
    .replace(/<span>\s*Unified definitive lesson\s*<\/span>/gi,'')
    .replace(/<p>\s*<b>Platform mastery keys:<\/b>[\s\S]*?<\/p>/gi,'');
}
const allSlides=[...new Set([...(data.slides||[]),...(data.scopeCollections?.slides||[])])];
allSlides.forEach(slide=>{
  if(slide.scope==='extension'){
    slide.title=String(slide.title||'').replace(/^Extension\s*·\s*/i,'');
    if(normalize(slide.section)==='extension')slide.section=slide.originalSection||'';
  }
  const colour=marker(slide);
  slide.html=`<span class="ib-slide-color ib-slide-color-${colour}" aria-hidden="true"></span>${cleanHtml(slide.html)}`;
  slide.learnerMarker=colour;
});
Object.assign(data.lesson,{
  title:'Scientific Notation, Approximation and Error',
  subtitle:'Represent scale, calculate with powers of ten, report precision honestly, construct bounds and quantify error.'
});
data.learnerView=Object.assign({},data.learnerView,{
  release:'6.6.0',
  colourOnlyMarkers:true,
  legacyLabelsRemovedAtDataAndDom:true,
  activityMarkerPrecedence:true
});

if(typeof document==='undefined')return;

function updateParentTitle(){
  try{
    if(window.parent===window)return;
    const parentDocument=window.parent.document;
    const walker=parentDocument.createTreeWalker(parentDocument.body,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())){
      if(node.nodeValue?.includes(oldTitle))node.nodeValue=node.nodeValue.replaceAll(oldTitle,newTitle);
    }
    if(parentDocument.title.includes(oldTitle))parentDocument.title=parentDocument.title.replaceAll(oldTitle,newTitle);
  }catch(_){}
}
function removeLegacyDomLabels(){
  document.querySelectorAll('.l11-scope-banner,.l11-scope-summary').forEach(node=>node.remove());
  document.querySelectorAll('#app h1,#app h2,#app h3,#app h4').forEach(node=>{
    if(legacyHeading(node.textContent)){
      node.classList.add('l11-legacy-label');
      node.remove();
    }
  });
  document.querySelectorAll('#app [data-classification],#app .classification-heading,#app .pacing-heading').forEach(node=>{
    if(legacyHeading(node.textContent))node.remove();
  });
}
function cleanNavigation(){
  const learn=document.querySelector('.route-btn[data-route="learn"]');
  if(learn&&learn.textContent.trim()!=='Learn')learn.textContent='Learn';
  const progress=document.getElementById('progress-label');
  if(progress){
    const match=progress.textContent.match(/\d+\s*\/\s*\d+/);
    if(match&&progress.textContent.trim()!==match[0])progress.textContent=match[0];
  }
  const toggle=document.getElementById('number-scope-toggle');
  if(toggle){
    toggle.classList.add('l11-icon-only');
    const label=toggle.querySelector('.tool-label');
    if(label)label.hidden=true;
  }
  document.querySelectorAll('#drawer-list [data-slide-index]').forEach(button=>{
    button.removeAttribute('title');
    if(/^extension\s*·/i.test(button.textContent||''))button.textContent=button.textContent.replace(/^extension\s*·\s*/i,'');
  });
}
function normalizeMarkers(){
  const body=document.querySelector('#app .slide-body');
  if(!body)return;
  const markers=[...body.querySelectorAll('.ib-slide-color')];
  markers.slice(1).forEach(node=>node.remove());
}
function repairCalculator(){
  const coach=document.getElementById('ti84-classroom-coach-1-1');
  const toolbar=coach?.querySelector('.ti84-coach-toolbar');
  if(toolbar&&!toolbar.querySelector('.ti84-open-separate-simulator')){
    const button=document.createElement('button');
    button.type='button';
    button.className='ti84-open-separate-simulator';
    button.textContent='Open simulator';
    button.addEventListener('click',()=>{
      coach.querySelector('[data-close]')?.click();
      setTimeout(()=>{
        const launch=document.querySelector('.ti84-inline-launch');
        if(launch&&!document.getElementById('ti84-inline-dock')?.classList.contains('open'))launch.click();
      },40);
    });
    toolbar.append(button);
  }
  const inline=document.getElementById('ti84-inline-dock');
  if(coach?.classList.contains('open')&&inline?.classList.contains('open'))inline.querySelector('#ti84-inline-close')?.click();
}
function cleanMastery(){
  document.querySelectorAll('.review-grid .stat-card small').forEach(node=>{
    node.textContent=node.textContent
      .replace(/of IB SL core viewed/i,'of lesson viewed')
      .replace(/core-only weighted evidence/i,'weighted learning evidence');
  });
}
let running=false;
function tidy(){
  if(running)return;
  running=true;
  removeLegacyDomLabels();
  cleanNavigation();
  normalizeMarkers();
  cleanMastery();
  repairCalculator();
  updateParentTitle();
  running=false;
}
function init(){
  tidy();
  const targets=[document.getElementById('app'),document.getElementById('drawer-list'),document.getElementById('progress-label'),document.body].filter(Boolean);
  targets.forEach(target=>new MutationObserver(tidy).observe(target,{childList:true,subtree:true,characterData:true}));
  setTimeout(tidy,100);
  setTimeout(tidy,600);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();
