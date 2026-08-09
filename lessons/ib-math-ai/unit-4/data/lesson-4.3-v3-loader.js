(function(){
  'use strict';
  const script=document.currentScript;
  const loaderBase=new URL('.',script?.src||location.href);
  const sourceRoot=new URL('../',loaderBase);
  const expected={
    chunks:16,
    compressedSha256:'1ea567bdc072ca831c97546662942fa181cebf351cd9eddebc361ee76b30515e',
    payloadSha256:'821023fc67cca30712fdbfb78be50e5469f684488f3a06999e94dbbd2c08e1f1',
    format:'echs-ib-ai-4.3-v3-source-pack',
    version:'3.0.0'
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
    console.error('[ECHS IB AI 4.3 V3]',error);
    const app=document.getElementById('app');
    if(app)app.innerHTML=`<section class="empty-state" role="alert"><h2>Lesson resources could not be verified</h2><p>${String(error?.message||error)}</p><p>Reload the page. If the issue continues, clear the site cache so every V3 chunk is refreshed together.</p></section>`;
    document.body.dataset.rendered='error';
  }
  async function boot(){
    const chunks=window.__ECHS_L43_V3_PACK_CHUNKS;
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
    style.dataset.l43V3SourcePack='3.0.0';
    style.textContent=payload.styles.map(module=>`/* ${module.path} */\n${module.source}`).join('\n');
    document.head.appendChild(style);
    payload.beforeEngine.forEach(evaluate);
    await loadScript('../assets/js/katex-global.js?v=0.16.27');
    await loadScript('../assets/js/engine.js?v=1.0.0');
    payload.afterEngine.forEach(evaluate);
    window.__ECHS_L43_V3_PACK_INFO={
      release:expected.version,verified:true,chunks:expected.chunks,
      compressedSha256:expected.compressedSha256,payloadSha256:expected.payloadSha256,
      counts:payload.counts,
      modules:[...payload.styles,...payload.beforeEngine,...payload.afterEngine].map(module=>module.path)
    };
    document.body.dataset.rendered='1';
    window.dispatchEvent(new CustomEvent('echs:ib-ai:4.3:v3-ready',{detail:window.__ECHS_L43_V3_PACK_INFO}));
  }
  boot().catch(fail);
})();
