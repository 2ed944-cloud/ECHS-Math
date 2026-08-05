(function(){
'use strict';
if(window.__ECHS_TI84_GUARD_ACTIVE__)return;
window.__ECHS_TI84_GUARD_ACTIVE__=true;
const original=document.addEventListener;
window.__ECHS_TI84_ORIGINAL_ADD_EVENT_LISTENER__=original;
document.addEventListener=function(type,listener,options){
  if(type==='DOMContentLoaded'&&!window.__ECHS_TI84_LEGACY_INIT_SUPPRESSED__){
    window.__ECHS_TI84_LEGACY_INIT_SUPPRESSED__=true;
    window.__ECHS_TI84_LEGACY_INIT__=listener;
    return;
  }
  return original.call(document,type,listener,options);
};
})();
