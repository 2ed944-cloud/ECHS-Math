(function () {
  'use strict';
  // Capture the requested route before the historical deck writes its own hash.
  // This bootstrap never grants access or changes the existing gate.
  const entryURL=location.href;
  const script=document.currentScript;
  if(!script)return;
  const moduleURL=new URL('./runtime.mjs',script.src);
  moduleURL.search=moduleURL.search||new URL(script.src).search;
  import(moduleURL.href).then(module=>{
    module.startClassroom({entryURL});
    addEventListener('pageshow',event=>{if(event.persisted)module.startClassroom({entryURL:location.href});});
  }).catch(()=>{
    // The complete historical lesson remains usable if this optional adapter fails.
  });
})();
