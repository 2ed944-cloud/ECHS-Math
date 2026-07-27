/* Signed private Blackboard media loader for authenticated ECHS practice. */
(function(){
  "use strict";
  const cache=new Map();
  function objectPath(value){
    const match=String(value||"").match(/^private-bank:\/\/([^/]+)\/(.+)$/);
    return match?`${match[1]}/${match[2]}`:"";
  }
  async function signed(path){
    const current=cache.get(path);
    if(current&&current.expires>Date.now()+30000)return current.url;
    const result=await window.ECHSInstitution.api("private-bank-api",`/media-url?path=${encodeURIComponent(path)}`);
    const url=result?.signed_url;
    if(!url)throw new Error("Private question media could not be authorised");
    cache.set(path,{url,expires:Date.now()+Math.max(60,Number(result.expires_in||300))*1000});
    return url;
  }
  async function hydrate(root=document){
    const images=[...root.querySelectorAll("img[data-private-src]")];
    await Promise.all(images.map(async image=>{
      const path=objectPath(image.dataset.privateSrc);
      if(!path||image.dataset.privateHydrated==="true")return;
      try{image.src=await signed(path);image.dataset.privateHydrated="true";image.classList.remove("private-bank-media-pending");}
      catch(error){console.warn("Private bank media unavailable",error);image.dataset.privateHydrated="error";}
    }));
  }
  window.ECHSPrivateBankAssets={hydrate,signed,objectPath};
})();
