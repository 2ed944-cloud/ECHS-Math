(function(){
  'use strict';
  const build=window.__ECHS_LQ5_BUILD;
  if(!build||!Array.isArray(build.slides))return;
  const repeated=new Set([
    'Manual first; technology when it adds value',
    'Compare linear and quadratic candidates'
  ]);
  build.slides=build.slides.filter(slide=>!repeated.has(slide.title));
  window.__ECHS_LQ5_BUILD=build;
})();
