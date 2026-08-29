/* Bind compact-route actions to the existing lesson engines. */
(function(){
  'use strict';
  const calculus=window.ECHS_CALC_L0_DATA;
  if(!calculus||!Array.isArray(calculus.slides))return;
  const diagnostic=calculus.slides.find(slide=>slide&&slide.id==='diagnostic-purpose');
  if(!diagnostic)return;
  diagnostic.body=String(diagnostic.body||'').replace(
    'class="route-button" data-go="diag-A"',
    'class="route-pill route-button" data-go="diag-A"'
  );
})();
