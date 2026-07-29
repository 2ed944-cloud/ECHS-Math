(async function(){
  "use strict";
  const payload=window.__IB_AI_PAYLOAD||{};
  async function gunzip(base64){
    const bytes=Uint8Array.from(atob(base64),c=>c.charCodeAt(0));
    if(typeof DecompressionStream!=="function")throw new Error("This browser does not support compressed lesson assets.");
    const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    return await new Response(stream).text();
  }
  try{
    const [theme,dataA,dataB,engine]=await Promise.all([gunzip(payload.theme),gunzip(payload.dataA),gunzip(payload.dataB),gunzip(payload.engine)]);
    const style=document.createElement("style");style.textContent=theme;document.head.appendChild(style);
    (0,eval)(dataA);(0,eval)(dataB);(0,eval)(engine);
  }catch(error){
    console.error(error);
    const app=document.getElementById("app");if(app)app.innerHTML='<div class="empty-state"><b>Lesson assets could not be loaded.</b><br>Refresh the page or use a current version of Chrome, Edge, Firefox, or Safari.</div>';
  }
})();
