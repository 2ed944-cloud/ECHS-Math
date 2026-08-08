(function(){'use strict';const B=window.U415_ASSESS;if(!B)return;const {data,U,D,qs,mcq,num,short}=B;
const q=(id,level,command,type,prompt,ans,extra={})=>({id,level,command,type,prompt,marks:1,calculator:'No GDC',tags:[],...extra,...(type==='mcq'?{choices:ans.choices,correct_index:ans.correct_index,answer:ans.choices[ans.correct_index]}:{numeric_answer:Number(ans.value),tolerance:Number(ans.tolerance),answer:U.fmt(ans.value,8)})});
data.quiz=[
q('U4-15-Q01','Foundation','Select','mcq','Which setting is GOF?',{choices:['Compare means','Two-way association','One categorical distribution versus stated probabilities','Correlation'],correct_index:2},{solution:'One categorical variable plus a model.'}),
q('U4-15-Q02','Foundation','Calculate','numeric','For n=150 and p=.20, enter E.',{value:30,tolerance:0},{solution:'150(.20)=30.'}),
q('U4-15-Q03','Foundation','Calculate','numeric','Seven categories: enter df.',{value:6,tolerance:0},{solution:'7−1=6.'}),
q('U4-15-Q04','Application','Calculate','numeric','For O=18,E=24, enter contribution.',{value:1.5,tolerance:.001},{solution:'36/24=1.5.'}),
q('U4-15-Q05','Application','Calculate','numeric','Enter χ² for library data.',{value:D.library.r.stat,tolerance:.002},{calculator:'GDC allowed',solution:'χ²≈1.5714.'}),
q('U4-15-Q06','Reasoning','Determine','mcq',`Transport p=${U.fmt(D.transport.r.p,4)}. Decision pair?`,{choices:['Reject at 1% and 5%','Reject at 5% only','Reject at 1% only','Reject at neither'],correct_index:1},{solution:'p lies between .01 and .05.'}),
q('U4-15-Q07','Application','Find','numeric','Uniform house data: enter p.',{value:D.house.r.p,tolerance:.001},{calculator:'GDC required',solution:'p≈.4488.'}),
q('U4-15-Q08','Reasoning','Audit','mcq','Correct setup for four categories in L1/L2?',{choices:['χ²-Test matrix df=4','χ²GOF-Test O:L1 E:L2 df=3','GOF O:L2 E:L1 df=4','1-Var Stats'],correct_index:1},{calculator:'GDC workflow',solution:'Four categories give df=3.'}),
q('U4-15-Q09','Challenge','Find','numeric','Enter 5% critical value for df=4.',{value:U.critical(.05,4),tolerance:.004},{calculator:'GDC/table allowed',solution:'≈9.488.'}),
q('U4-15-Q10','HOT','Evaluate','mcq','p=.44. Strongest statement?',{choices:['Accept H₀','Model equals sample','Do not reject; insufficient evidence of a different population distribution','P(H₁)=.44'],correct_index:2},{solution:'Use insufficient-evidence language.'})
];
data.lesson.exam_task_count=data.exam.length;data.lesson.quiz_count=data.quiz.length;
if(qs.length!==80||data.exam.length!==4||data.quiz.length!==10)console.warn('Lesson 4.15 assessment count mismatch.',qs.length,data.exam.length,data.quiz.length);
})();
