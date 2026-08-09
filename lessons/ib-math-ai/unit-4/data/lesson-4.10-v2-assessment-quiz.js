(function(){
'use strict';
const B=window.U410_ASSESS;if(!B)return;
const {data,U,qs}=B;
const q=(id,level,command,type,prompt,ans,extra={})=>({id,level,command,type,prompt,marks:1,calculator:'No GDC',tags:['binomial'],...extra,...(type==='mcq'?{choices:ans.choices,correct_index:ans.correct_index,answer:ans.choices[ans.correct_index]}:{numeric_answer:Number(ans.value),tolerance:Number(ans.tolerance),answer:U.fmt(ans.value,9)})});

data.quiz=[
 q('IBAI-U4-L4-10-Q001','Foundation','Identify','mcq','Which setting is not binomial?',{choices:['Count heads in 12 independent coin tosses','Count defects in 20 independent items with constant p','Roll until the first six','Count correct answers in 10 independent guesses'],correct_index:2},{solution:'The number of trials is not fixed.'}),
 q('IBAI-U4-L4-10-Q002','Application','Calculate','numeric','For X~B(9,0.40), find P(X=3).',{value:U.pmf(9,.4,3),tolerance:.000001},{calculator:'GDC required',solution:'Use binompdf(9,.4,3).'}),
 q('IBAI-U4-L4-10-Q003','Application','Calculate','numeric','For X~B(15,0.20), find P(X≤4).',{value:U.cdf(15,.2,4),tolerance:.000001},{calculator:'GDC required',solution:'Use binomcdf(15,.2,4).'}),
 q('IBAI-U4-L4-10-Q004','Application','Calculate','numeric','For X~B(10,0.30), find P(X≥5).',{value:U.event(10,.3,'atLeast',5),tolerance:.000001},{calculator:'GDC required',solution:'Use 1−binomcdf(10,.3,4).'}),
 q('IBAI-U4-L4-10-Q005','Application','Calculate','numeric','For X~B(18,0.50), find P(7≤X≤11).',{value:U.event(18,.5,'between',7,11),tolerance:.000001},{calculator:'GDC required',solution:'Use F(11)−F(6).'}),
 q('IBAI-U4-L4-10-Q006','Foundation','Calculate','numeric','For X~B(24,0.35), enter μ.',{value:8.4,tolerance:1e-10},{solution:'μ=np=8.4.'}),
 q('IBAI-U4-L4-10-Q007','Application','Calculate','numeric','For X~B(24,0.35), enter the standard deviation σ.',{value:U.sd(24,.35),tolerance:.00001},{calculator:'GDC allowed',solution:'σ=√[24(.35)(.65)].'}),
 q('IBAI-U4-L4-10-Q008','Reasoning','Determine','mcq','For X~B(19,0.25), which modal statement is correct?',{choices:['Mode 4 only','Mode 5 only','Modes 4 and 5','Modes 5 and 6'],correct_index:2},{solution:'(n+1)p=5 is integer, giving modes 4 and 5.'}),
 q('IBAI-U4-L4-10-Q009','Reasoning','Evaluate','mcq','A sample of 20 is drawn without replacement from 2000 items. Which modelling statement is strongest?',{choices:['Exactly binomial','Not exact, but the 1% sample fraction may justify a binomial approximation','Geometric','Impossible to model'],correct_index:1},{solution:'Dependence is slight when the sampling fraction is small.'}),
 q('IBAI-U4-L4-10-Q010','Challenge','Solve','numeric','With p=0.10, find the smallest n such that P(at least one success)≥0.95.',{value:U.thresholdAtLeastOne(.1,.95),tolerance:0},{calculator:'GDC required',solution:'Solve 1−.9^n≥.95 and verify the smallest integer.'}),
 q('IBAI-U4-L4-10-Q011','HOT','Audit','mcq','Which TI-84 expression correctly finds P(X>6) for X~B(20,.4)?',{choices:['1−binomcdf(20,.4,5)','1−binomcdf(20,.4,6)','binomcdf(20,.4,6)','binompdf(20,.4,6)'],correct_index:1},{calculator:'TI-84 workflow',solution:'More than 6 has complement X≤6.'}),
 q('IBAI-U4-L4-10-Q012','HOT','Interpret','mcq','What does μ=8.4 mean for repeated groups of 24 trials?',{choices:['Every group has 8.4 successes','X can equal 8.4','The average success count over many groups approaches 8.4','The probability of success is 8.4'],correct_index:2},{solution:'Expected value is a long-run average.'})
];

data.lesson.exam_task_count=data.exam.length;
data.lesson.quiz_count=data.quiz.length;
if(qs.length!==80||data.exam.length!==5||data.quiz.length!==12)console.warn('Lesson 4.10 assessment count mismatch.',qs.length,data.exam.length,data.quiz.length);
})();
