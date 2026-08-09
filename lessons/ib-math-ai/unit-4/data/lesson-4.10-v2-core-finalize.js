(function(){
'use strict';
const B=window.U410_CORE;if(!B)return;
const {data,U,D,esc,plot,lab,slides}=B;
data.slides=slides;
data.lesson.slide_count=slides.length;
data.lesson.release_notes=[
  '64-screen model-to-interpretation learning sequence',
  'Numerically stable PMF, CDF, upper-tail, interval, hypergeometric-comparison, and threshold engine',
  'Equation-derived high-DPI binomial graphics and six interactive laboratories',
  'Verified local binomial coach plus full TI-84 Plus CE key-practice panel',
  '80 differentiated questions, five IB-style tasks, and an independent timed quiz'
];
window.U410={U,D,esc,plot,lab,release:'2.0.0'};
window.ECHS_IB_AI_4_10_DEFINITIVE={release:'2.0.0',U,D,slideCount:slides.length};
if(slides.length!==64)console.warn(`Lesson 4.10 expected 64 slides; built ${slides.length}.`);
})();
