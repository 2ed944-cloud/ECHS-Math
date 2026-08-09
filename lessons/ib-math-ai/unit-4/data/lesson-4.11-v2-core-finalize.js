(function(){
'use strict';
const B=window.U411_CORE;if(!B)return;
const {data,U,D,esc,enc,plot,lab,tiButton,slides}=B;
data.slides=slides;
data.lesson.slide_count=slides.length;
data.lesson.release_notes=[
  '64-screen concept-to-exam learning sequence',
  'Equation-derived normal curves with exact shaded boundaries',
  'High-accuracy local normal CDF and inverse-normal engine',
  'Five interactive probability, quantile, and parameter investigations',
  'Verified normalcdf, invNorm, ShadeNorm, and full TI‑84 simulator pathways',
  'Independent five-level practice, original IB tasks, and timed quiz'
];
window.U411={U,D,esc,enc,plot,lab,tiButton};
if(slides.length!==64)console.warn(`Lesson 4.11 expected 64 slides; built ${slides.length}.`);
})();
