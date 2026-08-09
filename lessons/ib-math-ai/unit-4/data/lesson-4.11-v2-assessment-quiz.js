(function(){
'use strict';
const B=window.U411_ASSESS;if(!B)return;
const {data,U,qs}=B;
const q=(id,level,command,type,prompt,ans,extra={})=>({
 id,level,command,type,prompt,marks:1,calculator:'GDC allowed',tags:[],...extra,
 ...(type==='mcq'
   ?{choices:ans.choices,correct_index:ans.correct_index,answer:ans.choices[ans.correct_index]}
   :type==='short'
     ?{answer:ans.value}
     :{numeric_answer:Number(ans.value),tolerance:Number(ans.tolerance),answer:U.fmt(ans.value,10)})
});

const c88=U.central(.88,21.5,1.8);
data.quiz=[
 q('U4-11-Q01','Foundation','Interpret','mcq','For X~N(24,3²), what is σ?',{choices:['3','6','9','24'],correct_index:0},{calculator:'No GDC',solution:'The second parameter is σ²=9, so σ=3.'}),
 q('U4-11-Q02','Application','Calculate','numeric','For X~N(24,3²), find P(X<27).',{value:U.cdf(27,24,3),tolerance:.0005},{calculator:'GDC required',solution:'normalcdf(−1E99,27,24,3).'}),
 q('U4-11-Q03','Application','Calculate','numeric','For X~N(24,3²), find P(X>29).',{value:U.sf(29,24,3),tolerance:.0005},{calculator:'GDC required',solution:'normalcdf(29,1E99,24,3).'}),
 q('U4-11-Q04','Application','Calculate','numeric','For X~N(24,3²), find P(22<X<28).',{value:U.prob(22,28,24,3),tolerance:.0005},{calculator:'GDC required',solution:'normalcdf(22,28,24,3).'}),
 q('U4-11-Q05','Application','Calculate','numeric','For X~N(24,3²), find P(X<18 or X>30).',{value:1-U.prob(18,30,24,3),tolerance:.0005},{calculator:'GDC required',solution:'Use 1−normalcdf(18,30,24,3).'}),
 q('U4-11-Q06','Foundation','Standardize','numeric','For X~N(24,3²), find the z-score of 19.5.',{value:-1.5,tolerance:.00001},{calculator:'No GDC',solution:'(19.5−24)/3=−1.5.'}),
 q('U4-11-Q07','Application','Find','numeric','For X~N(24,3²), find the 40th percentile.',{value:U.inv(.40,24,3),tolerance:.02},{calculator:'GDC required',solution:'invNorm(.40,24,3).'}),
 q('U4-11-Q08','Application','Find','numeric','For X~N(24,3²), find the threshold for the top 12%.',{value:U.inv(.88,24,3),tolerance:.02},{calculator:'GDC required',solution:'Top .12 means left area .88.'}),
 q('U4-11-Q09','Application','Find','numeric','Temperature T~N(21.5,1.8²). Find the lower boundary of the middle 88%.',{value:c88.lo,tolerance:.02},{calculator:'GDC required',solution:'Each tail=.06; use invNorm(.06,21.5,1.8).'}),
 q('U4-11-Q10','Application','Find','numeric','Temperature T~N(21.5,1.8²). Find the upper boundary of the middle 88%.',{value:c88.hi,tolerance:.02},{calculator:'GDC required',solution:'Use invNorm(.94,21.5,1.8).'}),
 q('U4-11-Q11','Reasoning','Calculate','numeric','For X~N(24,3²), find the expected number above 29 in 700 observations.',{value:700*U.sf(29,24,3),tolerance:.2},{calculator:'GDC required',solution:'700×normalcdf(29,1E99,24,3).'}),
 q('U4-11-Q12','Challenge','Solve','numeric','A normal variable has σ=6 and P(X<52)=.75. Find μ.',{value:U.solveMean(52,.75,6),tolerance:.03},{calculator:'GDC required',solution:'μ=52−6z_.75.'}),
 q('U4-11-Q13','Challenge','Solve','numeric','A normal variable has μ=30 and P(X<38)=.80. Find σ.',{value:U.solveSd(38,.80,30),tolerance:.03},{calculator:'GDC required',solution:'σ=(38−30)/z_.80.'}),
 q('U4-11-Q14','Foundation','Explain','mcq','Why is P(X=μ)=0 for a continuous normal variable?',{choices:['The curve is symmetric','A point has zero width and zero area','μ is not in the domain','σ is positive'],correct_index:1},{calculator:'No GDC',solution:'Continuous probability is area over an interval.'}),
 q('U4-11-Q15','Reasoning','Audit','mcq','A student wants the top 4% but enters invNorm(.04,μ,σ). What boundary is returned?',{choices:['The 96th percentile','The 4th percentile','The mean','A central 4% interval'],correct_index:1},{calculator:'No GDC',solution:'The default area is cumulative from the left.'}),
 q('U4-11-Q16','HOT','Round','numeric','Scores are N(68,10²), only whole scores occur, and the top 6% qualify. Find the smallest qualifying score.',{value:Math.ceil(U.inv(.94,68,10)),tolerance:0},{calculator:'GDC required',solution:'Use invNorm(.94,68,10), then round upward.'})
];

data.lesson.exam_task_count=data.exam.length;
data.lesson.quiz_count=data.quiz.length;
data.lesson.quiz_minutes=18;
if(qs.length!==80||data.exam.length!==5||data.quiz.length!==16){
 console.warn('Lesson 4.11 assessment count mismatch.',qs.length,data.exam.length,data.quiz.length);
}
})();