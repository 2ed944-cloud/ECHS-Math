(function(){
  'use strict';
  const data=window.LESSON_DATA,U=window.U413_STATS,D=window.U413_DATASETS;
  if(!data||String(data.lesson?.number)!=='4.13'||!U||!D)return;
  const qs=[];let seq=0;
  const id=()=>`U4-13-P${String(++seq).padStart(3,'0')}`;
  const add=q=>qs.push({id:id(),marks:1,calculator:'No GDC',tags:[],...q});
  const mcq=(level,command,prompt,choices,correct_index,solution,extra={})=>add({level,command,type:'mcq',prompt,choices,correct_index,answer:choices[correct_index],solution,...extra});
  const numeric=(level,command,prompt,answer,tolerance,solution,extra={})=>add({level,command,type:'numeric',prompt,numeric_answer:Number(answer),tolerance:Number(tolerance),answer:U.fmt(Number(answer),6),solution,...extra});
  const short=(level,command,prompt,answer,solution,extra={})=>add({level,command,type:'short',prompt,answer,solution,...extra});
  const result=(dataset,alternative='neq')=>U.pooledArrays(D[dataset].a,D[dataset].b,alternative);
  const statsResult=(values,alternative='neq')=>U.pooledSummary(...values,alternative);
  const evidence=(r,d=4)=>`\\(t=${U.fmt(r.t,d)},\\ p=${U.fmt(r.p,d)},\\ df=${r.df}\\)`;
  window.U413_PRACTICE_BUILDER={data,U,D,qs,mcq,numeric,short,result,statsResult,evidence};
})();
