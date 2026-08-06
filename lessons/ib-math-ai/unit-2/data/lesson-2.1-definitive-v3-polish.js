(function(){
  'use strict';
  const data=window.LESSON_DATA;
  if(!data||String(data.lesson?.number)!=='2.1')return;

  const practice=Array.isArray(data.scopeCollections?.practice)?data.scopeCollections.practice:data.practice;
  const tasks=Array.isArray(data.scopeCollections?.exam)?data.scopeCollections.exam:data.exam;

  const excludedValue=practice?.find(item=>item.id==='IBAI-2.1-P05');
  if(excludedValue){
    excludedValue.answer='\\(x\\ne4\\)';
    excludedValue.solution='The denominator is zero at \\(x=4\\), so the domain excludes \\(x=4\\).';
  }

  const deliveryTask=tasks?.find(task=>task.id==='U2-2.1-T1');
  if(deliveryTask){
    deliveryTask.context='A delivery service models the fee \\(C\\), in QAR, for a trip of \\(d\\) kilometres. For \\(0\\le d\\le10\\), \\(C(d)=12+1.8d\\). For \\(10\\lt d\\le30\\), \\(C(d)=30+0.9(d-10)\\).';
  }

  const solarTask=tasks?.find(task=>task.id==='U2-2.1-V3-T4');
  if(solarTask){
    solarTask.context='The electrical output of a school solar array is modelled by \\(P(t)=-0.5(t-6)^2+24\\) for \\(0\\le t\\le12\\), where \\(t\\) is hours after 6:00 and \\(P(t)\\) is measured in kilowatts.';
  }

  data.audit=Object.assign({},data.audit,{
    assessmentMathPolishRelease:'3.0.2',
    malformedNotEqualDelimiterRepaired:true,
    taskContextsUseStableInlineMath:true,
    htmlSensitiveInequalityEscaped:true
  });
})();
