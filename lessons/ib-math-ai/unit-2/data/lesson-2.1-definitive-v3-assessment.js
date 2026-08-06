(function(){
  'use strict';
  const data=window.LESSON_DATA;
  if(!data||String(data.lesson?.number)!=='2.1'||!Array.isArray(data.quiz)||!Array.isArray(data.exam))return;

  const quizAdditions=[
    {id:'IBAI-2.1-V3-Q13',level:'Quiz',scope:'extension',command:'Determine',marks:3,calculator:'No GDC required',prompt:'Determine the domain of \\(f(x)=\\dfrac{\\sqrt{2x-6}}{x+1}\\).',answer:'\\([3,\\infty)\\)',solution:'The square root requires \\(2x-6\\ge0\\), so \\(x\\ge3\\). The denominator restriction \\(x\\ne-1\\) is already outside this interval.',hint:'Apply every algebraic restriction, then intersect the resulting sets.',check:{mode:'text',accepted:['[3,∞)','[3,infinity)','x>=3','x ≥ 3']},tags:['extension','domain']},
    {id:'IBAI-2.1-V3-Q14',level:'Quiz',scope:'extension',command:'Find',marks:3,calculator:'No GDC required',prompt:'For \\(f(x)=5x+2\\), find \\(f^{-1}(x)\\).',answer:'\\(f^{-1}(x)=\\dfrac{x-2}{5}\\)',solution:'Write \\(y=5x+2\\), swap x and y, and solve \\(x=5y+2\\) for y.',hint:'Swap the input and output variables before solving.',check:{mode:'text',accepted:['(x-2)/5','f^-1(x)=(x-2)/5','x minus 2 over 5']},tags:['extension','inverse']}
  ];
  const quizIds=new Set(data.quiz.map(item=>item.id));
  quizAdditions.forEach(item=>{if(!quizIds.has(item.id))data.quiz.push(item);});
  data.quiz.forEach((item,index)=>{if(!item.scope)item.scope='core';item.sequence=index+1;item.tags=Array.from(new Set([...(Array.isArray(item.tags)?item.tags:[]),'functions','lesson-2.1',item.scope]));});

  const task4={
    id:'U2-2.1-V3-T4',style:'Paper 2 · graph features and technology',title:'Solar-output function',calculator:'GDC expected',scope:'core',total_marks:12,
    context:`The electrical output of a school solar array is modelled by \\[P(t)=-0.5(t-6)^2+24,\qquad 0\le t\le12,\\] where \\(t\\) is hours after 6:00 and \\(P(t)\\) is measured in kilowatts.`,
    parts:[
      {label:'a',prompt:'Calculate \\(P(2)\\) and interpret the result.',marks:3,answer:'\\(P(2)=16\\) kW. At 8:00, the model predicts an electrical output of 16 kW.',markscheme:'M1 substitution; A1 16; A1 interpretation with time and units.'},
      {label:'b',prompt:'State the contextual domain and range of \\(P\\).',marks:2,answer:'Domain \\(0\le t\le12\\); range \\(6\le P\le24\\) kW.',markscheme:'A1 domain; A1 range from vertex and endpoints.'},
      {label:'c',prompt:'Use technology to find the two times at which the model predicts \\(P(t)=20\\). Give the clock times to the nearest minute.',marks:4,answer:'\\(t=6\\pm\\sqrt8\\), so \\(t\\approx3.172\\) and \\(8.828\\). The clock times are approximately 09:10 and 14:50.',markscheme:'M1 graph/solve equation; A1 two t-values; A1 convert first time; A1 convert second time.'},
      {label:'d',prompt:'Identify the maximum output and state one limitation of the model.',marks:3,answer:'The maximum is 24 kW at \\(t=6\\), corresponding to 12:00. A limitation is that cloud cover, shading or changing weather is not represented.',markscheme:'A1 maximum value; A1 time; R1 relevant limitation.'}
    ]
  };
  if(!data.exam.some(task=>task.id===task4.id))data.exam.push(task4);
  data.exam.forEach((task,index)=>{task.scope=task.id==='U2-2.1-T2'?'extension':(task.scope||'core');task.sequence=index+1;task.tags=Array.from(new Set([...(Array.isArray(task.tags)?task.tags:[]),'functions','lesson-2.1',task.scope]));});

  const allSlides=data.slides.slice(),allPractice=data.practice.slice(),allQuiz=data.quiz.slice(),allExam=data.exam.slice();
  const requestedAll=new URLSearchParams(String(window.location?.search||'')).get('scope')==='all';
  data.scopeCollections={slides:allSlides,practice:allPractice,quiz:allQuiz,exam:allExam};
  if(!requestedAll){data.practice=allPractice.filter(item=>item.scope==='core');data.quiz=allQuiz.filter(item=>item.scope==='core');data.exam=allExam.filter(item=>item.scope==='core');}
  const scopeCounts={
    learn:{core:allSlides.filter(item=>item.scope==='core').length,extension:allSlides.filter(item=>item.scope==='extension').length,total:allSlides.length},
    practice:{core:allPractice.filter(item=>item.scope==='core').length,extension:allPractice.filter(item=>item.scope==='extension').length,total:allPractice.length},
    quiz:{core:allQuiz.filter(item=>item.scope==='core').length,extension:allQuiz.filter(item=>item.scope==='extension').length,total:allQuiz.length},
    exam:{core:allExam.filter(item=>item.scope==='core').length,extension:allExam.filter(item=>item.scope==='extension').length,total:allExam.length}
  };
  Object.assign(data.lesson,{scope_release:'3.0.0',active_scope:requestedAll?'all':'core',scope_modes:[{id:'core',label:'IB SL Core',description:'Current SL function concepts, notation, domain, range, graph features, inverse reflection and technology.'},{id:'all',label:'All content',description:'IB SL core plus clearly marked extension and future-lesson bridges.'}],scope_counts:scopeCounts});
  data.counts=Object.assign({},data.counts,{slides:allSlides.length,practice:allPractice.length,quiz:allQuiz.length,exam:allExam.length,coreSlides:scopeCounts.learn.core,corePractice:scopeCounts.practice.core,coreQuiz:scopeCounts.quiz.core,coreExam:scopeCounts.exam.core,extensionSlides:scopeCounts.learn.extension,extensionPractice:scopeCounts.practice.extension,extensionQuiz:scopeCounts.quiz.extension,extensionExam:scopeCounts.exam.extension});
  data.review={title:'Functions mastery review',criteria:['I can justify whether a relation is a function from a mapping, table, equation, graph or context.','I can use function notation in both image and preimage directions.','I can state mathematical and contextual domains and ranges with correct endpoint notation.','I can read intercepts, extrema, sign, direction of change and discontinuities.','I can use technology transparently and evaluate whether an output belongs to the model.'],transfer:'Before Lesson 2.2, explain how function notation and domain restrictions affect a linear or quadratic model.'};
  data.audit=Object.assign({},data.audit,{assessmentRelease:'3.0.0',allOriginalLegacyQuestionsRetained:allPractice.length>=80,totalPracticeCount:allPractice.length,totalQuizCount:allQuiz.length,totalTaskCount:allExam.length,coreAssessmentCounts:{practice:scopeCounts.practice.core,quiz:scopeCounts.quiz.core,exam:scopeCounts.exam.core},extensionAssessmentCounts:{practice:scopeCounts.practice.extension,quiz:scopeCounts.quiz.extension,exam:scopeCounts.exam.extension},defaultCoreAssessment:true,allContentRestorable:true});
})();
