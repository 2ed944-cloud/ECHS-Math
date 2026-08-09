(function(){
'use strict';
const root=document.querySelector('.empty-state')||document.body;
const base=new URL('../data/lesson-5.5-package/',document.baseURI);
const parts=["chunk-00.b64","chunk-01.b64","chunk-02-00.b64","chunk-02-01.b64","chunk-02-02.b64","chunk-03-00.b64","chunk-03-01.b64","chunk-03-02.b64"];
function status(title,detail){root.innerHTML=`<div class="opt5-package-status"><strong>${title}</strong><span>${detail}</span></div>`;}
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
 status('Loading Lesson 5.5…','Preparing optimisation models, exact graphics, practice, IB tasks and TI‑84 training.');
 const encoded=(await Promise.all(parts.map(async name=>{const response=await fetch(new URL(`${name}?v=5.5.0`,base),{cache:'no-store'});if(!response.ok)throw new Error(`Missing lesson package chunk: ${name}`);return (await response.text()).replace(/\s+/g,'');}))).join('');
 const pack=JSON.parse(await decodeGzip(encoded));
 if(pack.schema!=='echs-ib-ai-5.5-package-v1'||pack.version!=='5.5.0'||!Array.isArray(pack.preEngine)||pack.preEngine.length!==7||!Array.isArray(pack.postEngine)||pack.postEngine.length!==3)throw new Error('Lesson package validation failed.');
 const style=document.createElement('style');style.dataset.lesson55='definitive';style.textContent=pack.css;document.head.append(style);
 pack.preEngine.forEach((source,index)=>evaluate(source,`unit5/lesson-5.5/pre-${index+1}.js`));
 await loadScript(new URL('../../unit-2/assets/js/katex-global.js?v=5.2.0',document.baseURI));
 await loadScript(new URL('../../unit-2/assets/js/engine.js?v=5.5.0',document.baseURI));
 pack.postEngine.forEach((source,index)=>evaluate(source,`unit5/lesson-5.5/post-${index+1}.js`));
}
boot().catch(error=>{console.error('[ECHS Lesson 5.5]',error);status('Lesson 5.5 could not finish loading.',`${error.message} Refresh once; if the problem continues, return to the Unit 5 page.`);});
})();
