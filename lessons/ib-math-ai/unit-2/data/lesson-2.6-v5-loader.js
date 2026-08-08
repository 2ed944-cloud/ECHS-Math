(function(){
  'use strict';
  const script=document.currentScript;
  const loaderBase=new URL('.',script?.src||location.href);
  const sourceRoot=new URL('../',loaderBase);
  const expected={
    chunks:11,
    compressedSha256:'72640fcce67752ea95cd9b7d40ad8ee4fbb4ec73c8fc824907a46cff6f4c2a95',
    payloadSha256:'874781b6a79a80a32522b667d461229f31921275c482e9ad38e218afff28cb38',
    format:'echs-ib-ai-2.6-v5-source-pack',
    version:'5.0.0'
  };
  const hex=bytes=>[...new Uint8Array(bytes)].map(value=>value.toString(16).padStart(2,'0')).join('');
  async function digest(bytes){return hex(await crypto.subtle.digest('SHA-256',bytes));}
  function decodeBase64(value){
    const binary=atob(value),bytes=new Uint8Array(binary.length);
    for(let index=0;index<binary.length;index+=1)bytes[index]=binary.charCodeAt(index);
    return bytes;
  }
  async function gunzip(bytes){
    if(typeof DecompressionStream!=='function')throw new Error('This lesson requires a current browser with the built-in DecompressionStream API.');
    const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }
  function evaluate(module){
    const source=`${module.source}\n//# sourceURL=${new URL(module.path,sourceRoot).href}`;
    (0,eval)(source);
  }
  function loadScript(relativePath){
    return new Promise((resolve,reject)=>{
      const node=document.createElement('script');
      node.src=new URL(relativePath,loaderBase).href;
      node.async=false;
      node.onload=()=>resolve(node);
      node.onerror=()=>reject(new Error(`Unable to load ${relativePath}`));
      document.head.appendChild(node);
    });
  }
  function fail(error){
    console.error('[ECHS IB AI 2.6 V5]',error);
    const app=document.getElementById('app');
    if(app)app.innerHTML=`<section class="empty-state" role="alert"><h2>Lesson resources could not be verified</h2><p>${String(error?.message||error)}</p><p>Reload the page. If the issue continues, clear the site cache so every V5 chunk is refreshed together.</p></section>`;
    document.body.dataset.rendered='error';
  }
  async function boot(){
    const chunks=window.__ECHS_RV5_PACK_CHUNKS;
    if(!Array.isArray(chunks)||chunks.length!==expected.chunks||chunks.some(value=>typeof value!=='string'||!value.length)){
      throw new Error(`Expected ${expected.chunks} verified lesson chunks; received ${Array.isArray(chunks)?chunks.filter(Boolean).length:0}.`);
    }
    const compressed=decodeBase64(chunks.join(''));
    if(await digest(compressed)!==expected.compressedSha256)throw new Error('Compressed lesson archive failed its SHA-256 integrity check.');
    const raw=await gunzip(compressed);
    if(await digest(raw)!==expected.payloadSha256)throw new Error('Unpacked lesson source failed its SHA-256 integrity check.');
    const payload=JSON.parse(new TextDecoder().decode(raw));
    if(payload.format!==expected.format||payload.version!==expected.version)throw new Error('Unexpected lesson source-pack format or version.');
    const style=document.createElement('style');
    style.dataset.rv5SourcePack='2.6-v5';
    style.textContent=payload.styles.map(module=>`/* ${module.path} */\n${module.source}`).join('\n');
    document.head.appendChild(style);
    payload.beforeEngine.forEach(evaluate);
    await loadScript('../assets/js/katex-global.js');
    await loadScript('../assets/js/engine.js?v=2.0.0');
    payload.afterEngine.forEach(evaluate);
    window.__ECHS_RV5_PACK_INFO={
      release:expected.version,
      verified:true,
      chunks:expected.chunks,
      compressedSha256:expected.compressedSha256,
      payloadSha256:expected.payloadSha256,
      counts:payload.counts,
      modules:[...payload.styles,...payload.beforeEngine,...payload.afterEngine].map(module=>module.path)
    };
    document.body.dataset.rendered='1';
    window.dispatchEvent(new CustomEvent('echs:ib-ai:2.6:v5-ready',{detail:window.__ECHS_RV5_PACK_INFO}));
  }
  boot().catch(fail);
})();
