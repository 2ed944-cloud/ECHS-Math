(function(){
'use strict';
const root=document.querySelector('.empty-state')||document.body;
const base=new URL('../data/lesson-5.4-package/',document.baseURI);
const parts=["chunk-00.b64","chunk-01.b64","chunk-02.b64","chunk-03.b64","chunk-04.b64","chunk-05.b64","chunk-06.b64","chunk-07.b64"];
function status(title,detail){root.innerHTML=`<div class="u54-package-status"><strong>${title}</strong><span>${detail}</span></div>`;}
function loadScript(url){return new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=url;script.onload=resolve;script.onerror=()=>reject(new Error(`Could not load ${url}`));document.head.append(script);});}
function evaluate(source,name){const script=document.createElement('script');script.textContent=`${source}\n//# sourceURL=${name}`;document.head.append(script);script.remove();}
async function decodeGzip(encoded){
 if(typeof DecompressionStream==='undefined')throw new Error('This browser does not support the built-in gzip decoder required by this lesson.');
 const binary=atob(encoded);const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i+=1)bytes[i]=binary.charCodeAt(i);
 const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
 return new Response(stream).text();
}
async function boot(){
 status('Loading Lesson 5.4…','Preparing the complete calculus lesson, exact generated graphs, practice, IB tasks, parameter investigation and TI‑84 training.');
 const encoded=(await Promise.all(parts.map(async name=>{const response=await fetch(new URL(`${name}?v=5.4.0`,base),{cache:'no-store'});if(!response.ok)throw new Error(`Missing lesson package chunk: ${name}`);return (await response.text()).replace(/\s+/g,'');}))).join('');
 const pack=JSON.parse(await decodeGzip(encoded));
 if(pack.schema!=='echs-ib-ai-5.4-package-v1'||pack.version!=='5.4.0'||!Array.isArray(pack.modules)||pack.modules.length!==3)throw new Error('Lesson package validation failed.');
 const style=document.createElement('style');style.dataset.lesson54='definitive';style.textContent=pack.css;document.head.append(style);
 pack.modules.forEach((source,index)=>evaluate(source,`unit5/lesson-5.4/module-${index+1}.js`));
 await loadScript(new URL('../../unit-2/assets/js/katex-global.js?v=5.4.0',document.baseURI));
 await loadScript(new URL('../../unit-2/assets/js/engine.js?v=5.4.0',document.baseURI));
 evaluate(pack.interactions,'unit5/lesson-5.4/interactions.js');
 evaluate(pack.ti84,'unit5/lesson-5.4/ti84-simulator.js');
}
boot().catch(error=>{console.error('[ECHS Lesson 5.4]',error);status('Lesson 5.4 could not finish loading.',`${error.message} Refresh once; if the problem continues, return to the Unit 5 page.`);});
})();
