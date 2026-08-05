(function(){
'use strict';
const data=window.LESSON_DATA;if(!data||String(data.lesson?.number)!=='1.6')return;
const quiz=data.quiz?.find(item=>item.id==='IBAI-1.6-Q08');
if(quiz){
  quiz.answer='\\(4.61013\\)';
  quiz.solution='Graph both sides or solve their difference. A broad scan followed by numerical refinement gives \\(x\\approx4.61013\\); substitution makes both sides approximately equal.';
  quiz.check={mode:'number',value:4.61012765154382,tolerance:0.01};
}
const cosine=data.practice?.find(item=>String(item.prompt).includes('cos x'));
if(cosine){
  cosine.answer='\\(1.39547\\)';
  cosine.solution='A broad graph scan shows several positive intersections. The first positive solution is \\(x\\approx1.39547\\); use additional initial guesses to confirm later intersections are not being confused with the requested first one.';
  cosine.check={mode:'number',value:1.395466143871871,tolerance:0.005};
}
data.v6Audit=Object.assign({},data.v6Audit,{numericalCorrections:'Q08 intersection and first positive x=8 cos(x) solution independently recomputed'});
})();
