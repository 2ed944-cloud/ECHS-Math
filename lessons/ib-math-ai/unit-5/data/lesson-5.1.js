(function(){
'use strict';
const root=document.querySelector('.empty-state')||document.body;
const base=new URL('../data/lesson-5.1-package/',document.baseURI);
const parts=["chunk-00.b64","chunk-01.b64","chunk-02.b64","chunk-03a.b64","chunk-03b.b64","chunk-04a.b64","chunk-04b.b64","chunk-05a.b64","chunk-05b.b64","chunk-06a.b64","chunk-06b.b64","chunk-07a.b64","chunk-07b.b64","chunk-08a.b64","chunk-08b.b64","chunk-09a.b64","chunk-09b.b64","chunk-10a.b64","chunk-10b.b64","chunk-11a.b64","chunk-11b.b64","chunk-12a.b64","chunk-12b.b64","chunk-13a.b64","chunk-13b.b64","chunk-14a.b64","chunk-14b.b64","chunk-15a.b64","chunk-15b.b64","chunk-16a.b64","chunk-16b.b64"];
function status(title,detail){root.innerHTML=`<div class="u5-package-status"><strong>${title}</strong><span>${detail}</span></div>`;}
function loadScript(url){return new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=url;script.onload=resolve;script.onerror=()=>reject(new Error(`Could not load ${url}`));document.head.append(script);});}
function evaluate(source,name){const script=document.createElement('script');script.textContent=`${source}
//# sourceURL=${name}`;document.head.append(script);script.remove();}
async function decodeGzip(encoded){
 if(typeof DecompressionStream==='undefined')throw new Error('This browser does not support the built-in gzip decoder required by this lesson.');
 const binary=atob(encoded);const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i+=1)bytes[i]=binary.charCodeAt(i);
 const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
 return new Response(stream).text();
}
async function boot(){
 status('Loading Lesson 5.1…','Preparing the complete calculus lesson, exact graphics, practice, IB tasks and TI‑84 training.');
 const encoded=(await Promise.all(parts.map(async name=>{const response=await fetch(new URL(`${name}?v=5.1.3`,base),{cache:'no-store'});if(!response.ok)throw new Error(`Missing lesson package chunk: ${name}`);return (await response.text()).replace(/\s+/g,'');}))).join('');
 const pack=JSON.parse(await decodeGzip(encoded));
 if(pack.schema!=='echs-ib-ai-5.1-package-v1'||!Array.isArray(pack.modules)||pack.modules.length!==5)throw new Error('Lesson package validation failed.');
 const style=document.createElement('style');style.dataset.lesson51='definitive';style.textContent=pack.css;document.head.append(style);
 pack.modules.forEach((source,index)=>evaluate(source,`unit5/lesson-5.1/module-${index+1}.js`));
 await loadScript(new URL('../../unit-2/assets/js/katex-global.js?v=5.2.0',document.baseURI));
 await loadScript(new URL('../../unit-2/assets/js/engine.js?v=5.1.3',document.baseURI));
 evaluate(pack.interactions,'unit5/lesson-5.1/interactions.js');
}
boot().catch(error=>{console.error('[ECHS Lesson 5.1]',error);status('Lesson 5.1 could not finish loading.',`${error.message} Refresh once; if the problem continues, return to the Unit 5 page.`);});
})();
