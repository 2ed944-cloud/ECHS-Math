(function(){
  'use strict';
  const B=window.U413_CORE_BUILDER;if(!B)return;
  const {data,slides}=B;
  data.slides=slides;
  data.lesson.slide_count=data.slides.length;
  data.lesson.release_notes=['Rebuilt with exact pooled-test mathematics','Precise Student-t and sample-distribution graphics','Local 2-SampTTest workflow simulator','Full TI-84 simulator integration','Independent, varied practice and IB assessment'];
  if(data.slides.length!==58)console.warn(`Lesson 4.13 expected 58 slides; built ${data.slides.length}.`);
})();
