/* Signed private question media loader with course isolation. */
(function(){
  "use strict";
  const cache=new Map();
  function objectPath(value){
    const match=String(value||"").match(/^private-bank:\/\/([^/]+)\/(.+)$/);
    return match?`${match[1]}/${match[2]}`:"";
  }
  function activeCourse(){
    return document.documentElement.dataset.practiceCourse||
      new URLSearchParams(location.search).get("course")||"";
  }
  async function isStaff(){
    try{const access=await window.ECHSPortalAccess?.ready;return["teacher","admin"].includes(access?.role||"");}
    catch{return["teacher","admin"].includes(window.ECHSPortalAccess?.current?.role||"");}
  }
  async function signed(path){
    const course=activeCourse(),key=`${course}|${path}`,current=cache.get(key);
    if(current&&current.expires>Date.now()+30000)return current.url;
    const query=new URLSearchParams({path});
    if(course)query.set("course",course);
    let result;
    try{result=await window.ECHSInstitution.api("practice-bank-api",`/media-url?${query}`);}
    catch(error){
      if(!await isStaff())throw error;
      const legacy=new URLSearchParams({path});
      result=await window.ECHSInstitution.api("private-bank-api",`/media-url?${legacy}`);
      document.documentElement.dataset.practiceMediaTransport="protected-compatibility";
    }
    const url=result?.signed_url;
    if(!url)throw new Error("Private question media could not be authorised");
    cache.set(key,{url,expires:Date.now()+Math.max(60,Number(result.expires_in||300))*1000});
    return url;
  }
  async function hydrate(root=document){
    const images=[...root.querySelectorAll("img[data-private-src]")];
    await Promise.all(images.map(async image=>{
      const path=objectPath(image.dataset.privateSrc);
      if(!path||image.dataset.privateHydrated==="true"||image.dataset.privateHydrated==="loading")return;
      image.dataset.privateHydrated="loading";
      try{
        image.src=await signed(path);
        image.dataset.privateHydrated="true";
        image.classList.remove("private-bank-media-pending");
      }catch(error){
        console.warn("Private bank media unavailable",error);
        image.dataset.privateHydrated="error";
      }
    }));
  }
  function observe(){
    hydrate(document).catch(()=>{});
    new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>{
      if(node.nodeType===1)hydrate(node).catch(()=>{});
    }))).observe(document.documentElement,{subtree:true,childList:true});
  }
  window.ECHSPrivateBankAssets={hydrate,signed,objectPath};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",observe,{once:true});else observe();
})();