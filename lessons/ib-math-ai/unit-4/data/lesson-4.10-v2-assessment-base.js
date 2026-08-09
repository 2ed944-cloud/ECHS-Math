(function(){
'use strict';
const data=window.LESSON_DATA,X=window.U410;if(!data||!X)return;
const {U,D}=X,qs=[];let seq=0;
const id=()=>`IBAI-U4-L4-10-P${String(++seq).padStart(3,'0')}`;
const add=q=>qs.push({id:id(),marks:1,calculator:'No GDC',tags:['binomial'],...q});
const mcq=(level,command,prompt,choices,correct_index,solution,extra={})=>add({level,command,type:'mcq',prompt,choices,correct_index,answer:choices[correct_index],solution,...extra});
const num=(level,command,prompt,answer,tolerance,solution,extra={})=>add({level,command,type:'numeric',prompt,numeric_answer:Number(answer),tolerance:Number(tolerance),answer:U.fmt(answer,9),solution,...extra});
const short=(level,command,prompt,answer,solution,extra={})=>add({level,command,type:'short',prompt,answer,solution,...extra});
const syntax=(n,p,type,a,b)=>U.syntax(n,p,type,a,b);
window.U410_ASSESS={data,U,D,qs,mcq,num,short,syntax};
})();
