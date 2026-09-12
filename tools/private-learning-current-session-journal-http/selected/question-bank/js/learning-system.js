/* Isolated current-session classic bootstrap; not installed in an active entry. */
(function(){
  'use strict';
  const script=document.currentScript;
  const moduleURL=new URL('../../js/owned-learning-bootstrap.mjs',script.src);
  const listeners=new Set();let controller=null,disposed=false,notification=0;
  const unavailable=()=>{const error=new Error('Owned learning is not ready');error.code=disposed?'disposed':'not_ready';throw error};
  const loaded=import(moduleURL.href).then(({createOwnedLearning})=>{
    if(disposed)return unavailable();
    controller=createOwnedLearning({institution:window.ECHSInstitution,
      onChange:state=>{const ticket=++notification;for(const listener of [...listeners]){if(ticket!==notification)break;try{listener(state)}catch{}}}});
    return controller;
  });
  // An ignored startup promise must not create an unhandled rejection.
  loaded.catch(()=>{});
  window.ECHSLearning=Object.freeze({contract:'echs.learning.owned.v1',
    ready:()=>loaded.then(value=>value.ready()),
    capture:()=>controller?controller.capture():unavailable(),
    ownership:()=>controller?controller.ownership():Object.freeze({contract:'echs.learning.owned.v1',status:disposed?'disposed':'initializing',sync:Object.freeze({status:'held',reason:'versioned_sync_required'})}),
    subscribe(listener){if(typeof listener!=='function')throw new TypeError('Listener required');if(disposed)return unavailable();listeners.add(listener);return()=>listeners.delete(listener)},
    dispose(){if(disposed)return;disposed=true;controller?.dispose();listeners.clear()},
  });
  // Original learning/achievement DOM events are deliberately not dispatched.
  // Their active listeners still invoke the legacy body-only/raw-store uploader.
})();
