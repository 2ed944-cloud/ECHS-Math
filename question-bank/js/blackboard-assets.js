const ECHSBlackboardAssets={
  zipCache:new Map(),
  urlCache:new Map(),
  async loadZip(packagePath){
    if(!packagePath)throw new Error('Missing Blackboard media package path');
    if(this.zipCache.has(packagePath))return this.zipCache.get(packagePath);
    const task=(async()=>{
      if(typeof JSZip==='undefined')throw new Error('JSZip is not available');
      const response=await fetch(packagePath);
      if(!response.ok)throw new Error('Could not load Blackboard media package: '+packagePath);
      let payload;
      if(packagePath.endsWith('.b64')){
        const text=(await response.text()).replace(/\s+/g,'');
        const binary=atob(text),bytes=new Uint8Array(binary.length);
        for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
        payload=bytes;
      }else payload=await response.arrayBuffer();
      return JSZip.loadAsync(payload);
    })();
    this.zipCache.set(packagePath,task);
    return task;
  },
  mime(path){
    const ext=(path.split('.').pop()||'').toLowerCase();
    return({jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',gif:'image/gif',svg:'image/svg+xml',webp:'image/webp'})[ext]||'application/octet-stream';
  },
  async resolve(packagePath,assetPath){
    const key=packagePath+'#'+assetPath;
    if(this.urlCache.has(key))return this.urlCache.get(key);
    const task=(async()=>{
      const zip=await this.loadZip(packagePath),entry=zip.file(assetPath.replace(/^\//,''));
      if(!entry)throw new Error('Missing source image: '+assetPath);
      const bytes=await entry.async('uint8array');
      return URL.createObjectURL(new Blob([bytes],{type:this.mime(assetPath)}));
    })();
    this.urlCache.set(key,task);
    return task;
  },
  async hydrate(root=document){
    const images=[...root.querySelectorAll('img[data-bbzip-package][data-bbzip-path]')];
    await Promise.all(images.map(async image=>{
      if(image.dataset.bbzipLoaded==='1')return;
      image.dataset.bbzipLoaded='1';
      try{
        image.src=await this.resolve(image.dataset.bbzipPackage,image.dataset.bbzipPath);
        image.classList.remove('bbzip-pending');
      }catch(error){
        image.classList.add('bbzip-missing');
        image.title=error.message;
        if(!image.alt)image.alt='Source figure unavailable';
      }
    }));
  }
};
window.ECHSBlackboardAssets=ECHSBlackboardAssets;