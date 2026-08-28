(async()=>{
  "use strict";
  const b64=window.__ECHS_L11_GZIP||"";
  if(!b64)throw new Error("Lesson 1.1 compressed payload is missing.");
  const bin=atob(b64);
  const bytes=Uint8Array.from(bin,ch=>ch.charCodeAt(0));
  const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
  const html=await new Response(stream).text();
  document.open();document.write(html);document.close();
})();
