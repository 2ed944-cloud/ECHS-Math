(function(){
'use strict';
const root=document.querySelector('.empty-state')||document.body;
const base=new URL('../data/lesson-5.3-package/',document.baseURI);
const parts=Array.from({length:11},(_,index)=>`chunk-${String(index).padStart(2,'0')}.b64`);
const EXPECTED_SHA256='1614ffa997a1605e8bc371a0e8d2eff95329ca2508b5052e3f454837e105c8dd';
function status(title,detail){root.innerHTML=`<div class="u5-package-status"><strong>${title}</strong><span>${detail}</span></div>`;}
function loadScript(url){return new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=url;script.onload=resolve;script.onerror=()=>reject(new Error(`Could not load ${url}`));document.head.append(script);});}
function evaluate(source,name){const script=document.createElement('script');script.textContent=`${source}\n//# sourceURL=${name}`;document.head.append(script);script.remove();}
function encodedBytes(encoded){const binary=atob(encoded);const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i+=1)bytes[i]=binary.charCodeAt(i);return bytes;}
async function digestHex(bytes){if(!globalThis.crypto?.subtle)throw new Error('This browser cannot verify the lesson package.');const hash=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(hash)].map(value=>value.toString(16).padStart(2,'0')).join('');}
async function decodeGzip(bytes){if(typeof DecompressionStream==='undefined')throw new Error('This browser does not support the built-in gzip decoder required by this lesson.');const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));return new Response(stream).text();}
async function boot(){
  status('Loading Lesson 5.3…','Preparing exact tangent–normal geometry, equation-derived graphics, practice, IB tasks and TI‑84 training.');
  const encoded=(await Promise.all(parts.map(async name=>{const response=await fetch(new URL(`${name}?v=1.0.0`,base),{cache:'no-store'});if(!response.ok)throw new Error(`Missing lesson package chunk: ${name}`);return (await response.text()).replace(/\s+/g,'');}))).join('');
  const bytes=encodedBytes(encoded);
  if(await digestHex(bytes)!==EXPECTED_SHA256)throw new Error('Lesson package integrity check failed.');
  const pack=JSON.parse(await decodeGzip(bytes));
  if(pack.schema!=='echs-ib-ai-5.3-package-v1'||pack.release!=='1.0.0'||!Array.isArray(pack.modules)||pack.modules.length!==6||typeof pack.css!=='string'||typeof pack.interactions!=='string')throw new Error('Lesson package validation failed.');
  const style=document.createElement('style');style.dataset.lesson53='definitive';style.textContent=pack.css;document.head.append(style);
  pack.modules.forEach((source,index)=>evaluate(source,`unit5/lesson-5.3/module-${index+1}.js`));
  const lesson=window.LESSON_DATA;
  if(!lesson||lesson.lesson?.number!=='5.3'||lesson.slides?.length!==48||lesson.practice?.length!==48||lesson.quiz?.length!==12||lesson.exam?.length!==3)throw new Error('Lesson data validation failed.');
  await loadScript(new URL('../../unit-2/assets/js/katex-global.js?v=5.2.0',document.baseURI));
  await loadScript(new URL('../../unit-2/assets/js/engine.js?v=5.1.3',document.baseURI));
  evaluate(pack.interactions,'unit5/lesson-5.3/interactions.js');
}
boot().catch(error=>{console.error('[ECHS Lesson 5.3]',error);status('Lesson 5.3 could not finish loading.',`${error.message} Refresh once; if the problem continues, return to the Unit 5 page.`);});
})();
