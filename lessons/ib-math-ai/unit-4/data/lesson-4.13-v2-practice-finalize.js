(function(){
  'use strict';
  const B=window.U413_PRACTICE_BUILDER;if(!B)return;
  const {data,qs}=B;
  data.practice=qs;
  data.practice_levels={Foundation:16,Application:20,Reasoning:18,Challenge:14,HOT:12};
  data.lesson.practice_count=qs.length;
  if(qs.length!==80)console.warn(`Lesson 4.13 expected 80 practice questions; built ${qs.length}.`);
})();
