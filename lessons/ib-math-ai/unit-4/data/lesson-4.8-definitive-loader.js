(function(){
  'use strict';
  const RELEASE='2.0.0';
  const PARTS=["part-01.txt","part-02.txt","part-03.txt","part-04.txt"];
  const EXPECTED_SHA256='09052d5a1f998735e3684dd4278dcaeee891366485360bb92c2d9a3b03e6e3fe';
  const script=document.currentScript;
  const base=script?new URL('lesson-4.8-definitive-bundle/',script.src):new URL('../data/lesson-4.8-definitive-bundle/',location.href);
  const app=document.getElementById('u48-app');
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  async function sha256(bytes){
    const digest=await crypto.subtle.digest('SHA-256',bytes);
    return Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
  }
  async function start(){
    if(typeof DecompressionStream!=='function') throw new Error('A modern browser with DecompressionStream support is required.');
    const responses=await Promise.all(PARTS.map(name=>fetch(new URL(name,base),{cache:'force-cache'})));
    responses.forEach((response,index)=>{if(!response.ok)throw new Error(`Bundle part ${PARTS[index]} returned HTTP ${response.status}.`);});
    const joined=(await Promise.all(responses.map(response=>response.text()))).join('').replace(/\s+/g,'');
    const binary=atob(joined);
    const bytes=new Uint8Array(binary.length);
    for(let i=0;i<binary.length;i+=1)bytes[i]=binary.charCodeAt(i);
    if(await sha256(bytes)!==EXPECTED_SHA256)throw new Error('Lesson bundle integrity check failed.');
    const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    const bundle=JSON.parse(await new Response(stream).text());
    const style=document.createElement('style');
    style.id='u48-definitive-style';
    style.textContent=bundle.css;
    document.head.append(style);
    (0,eval)(`${bundle.data}
//# sourceURL=lesson-4.8-definitive-data.js`);
    (0,eval)(`${bundle.app}
//# sourceURL=lesson-4.8-definitive-app.js`);
    (0,eval)(`${bundle.ti}
//# sourceURL=lesson-4.8-definitive-ti84.js`);
    document.documentElement.dataset.u48Release=RELEASE;
  }
  window.ECHS_U48_BUNDLE_READY=start();
  window.ECHS_U48_BUNDLE_READY.catch(error=>{
    console.error('Lesson 4.8 definitive bundle could not start.',error);
    if(app)app.innerHTML=`<section class="u48-load-error"><h1>Lesson 4.8 could not be opened</h1><p>${esc(error.message)}</p><p>Reload the page in a current version of Chrome, Edge, Firefox, or Safari.</p></section>`;
  });
})();