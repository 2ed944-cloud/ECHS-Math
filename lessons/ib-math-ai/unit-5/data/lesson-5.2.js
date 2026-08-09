(function(){
'use strict';
const root=document.querySelector('.empty-state')||document.body;
const base=new URL('../data/lesson-5.2-package/',document.baseURI);
const parts=["chunk-00.b64","chunk-01.b64","chunk-02.b64","chunk-03.b64","chunk-04.b64","chunk-05.b64"];
const expectedDigest='ffd722348618d04ee16fcd6027d4b296259c7237946b3e242e1663407f94cf25';
function status(title,detail){root.innerHTML=`<div class="u52-package-status"><strong>${title}</strong><span>${detail}</span></div>`;}
function loadScript(url){return new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=url;script.onload=resolve;script.onerror=()=>reject(new Error(`Could not load ${url}`));document.head.append(script);});}
function evaluate(source,name){const script=document.createElement('script');script.textContent=`${source}\n//# sourceURL=${name}`;document.head.append(script);script.remove();}
async function digest(bytes){if(!crypto?.subtle)return null;const value=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(value)].map(byte=>byte.toString(16).padStart(2,'0')).join('');}
async function decodeGzip(encoded){
 if(typeof DecompressionStream==='undefined')throw new Error('This browser does not support the built-in gzip decoder required by this lesson.');
 const binary=atob(encoded);const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i+=1)bytes[i]=binary.charCodeAt(i);
 const actual=await digest(bytes);if(actual&&actual!==expectedDigest)throw new Error('Lesson package integrity check failed.');
 const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
 return new Response(stream).text();
}
async function boot(){
 status('Loading Lesson 5.2…','Preparing the complete derivative-functions lesson, exact graphs, practice, IB tasks and TI‑84 verification.');
 const encoded=(await Promise.all(parts.map(async name=>{const response=await fetch(new URL(`${name}?v=5.2.0`,base),{cache:'no-store'});if(!response.ok)throw new Error(`Missing lesson package chunk: ${name}`);return (await response.text()).replace(/\s+/g,'');}))).join('');
 const pack=JSON.parse(await decodeGzip(encoded));
 if(pack.schema!=='echs-ib-ai-5.2-package-v1'||pack.version!=='5.2.0'||!Array.isArray(pack.modules)||pack.modules.length!==3||pack.metrics?.slides!==64||pack.metrics?.practice!==60||pack.metrics?.tasks!==3||pack.metrics?.quiz!==12)throw new Error('Lesson package validation failed.');
 const style=document.createElement('style');style.dataset.lesson52='definitive';style.textContent=pack.css;document.head.append(style);document.documentElement.classList.remove('u52-loading');document.documentElement.classList.add('u52-ready');
 pack.modules.forEach((source,index)=>evaluate(source,`unit5/lesson-5.2/module-${index+1}.js`));
 await loadScript(new URL('../../unit-2/assets/js/katex-global.js?v=5.2.0',document.baseURI));
 evaluate(pack.engine,'unit5/lesson-5.2/engine.js');
 evaluate(pack.interactions,'unit5/lesson-5.2/interactions.js');
 evaluate(pack.ti84,'unit5/lesson-5.2/ti84-simulator.js');
}
boot().catch(error=>{console.error('[ECHS Lesson 5.2]',error);document.documentElement.classList.remove('u52-loading');document.documentElement.classList.add('u52-load-error');status('Lesson 5.2 could not finish loading.',`${error.message} Refresh once; if the problem continues, return to the Unit 5 page.`);});
})();
