(function(){
  'use strict';

  const data=window.LESSON_DATA;
  if(!data||String(data.lesson?.number)!=='1.4'||!Array.isArray(data.slides))return;

  const search=String(window.location&&window.location.search||'');
  const requestedAll=/(?:^|[?&])scope=all(?:&|$)/i.test(search);
  const icons={Core:'🟢',Practice:'🔵',Extension:'🟠',Revision:'🟣'};
  const blockFocus={
    '1.4A':'Connect percentage change to simple and compound financial growth while reading cash flows on a common valuation date.',
    '1.4B':'Use nominal and periodic rates consistently, apply non-annual compounding and verify completed-period growth questions.',
    '1.4C':'Secure annual reducing-balance depreciation first; inflation and real-value analysis remain clearly marked reference-supported extension material.',
    '1.4D':'Explore regular deposits, payment timing and withdrawal funds as reference-supported extension after the required growth foundations.',
    '1.4E':'Use financial technology to calculate loan repayments and interpret the interest–principal structure of amortization.',
    '1.4F':'Compare payment size, total interest and affordability only after the core loan calculations are secure.',
    '1.4G':'Consolidate the IB SL core through synthesis, revision and independent mastery evidence.'
  };

  const blocks=Array.isArray(data.lesson.teaching_blocks)?data.lesson.teaching_blocks:[];
  const byCode=Object.fromEntries(blocks.map(block=>[block.code,block]));
  blocks.forEach(block=>{if(blockFocus[block.code])block.learning_focus=blockFocus[block.code];});
  data.slides.forEach(slide=>{
    if(blockFocus[slide.teachingBlock])slide.learningFocus=blockFocus[slide.teachingBlock];
  });

  function moveBoundary(code,previousCode,startTitle){
    const oldIndex=data.slides.findIndex(slide=>slide.teachingBlock===code&&slide.blockBoundary);
    const newIndex=data.slides.findIndex(slide=>slide.title===startTitle);
    if(oldIndex<0||newIndex<oldIndex)return;
    const block=byCode[code];
    const previousBlock=byCode[previousCode];
    for(let index=oldIndex;index<newIndex;index+=1){
      const slide=data.slides[index];
      slide.teachingBlock=previousCode;
      slide.teachingBlockTitle=previousBlock.title;
      slide.learningFocus=blockFocus[previousCode];
      slide.blockBoundary=false;
      slide.eyebrow=slide.originalEyebrow;
    }
    const newBoundary=data.slides[newIndex];
    newBoundary.teachingBlock=code;
    newBoundary.teachingBlockTitle=block.title;
    newBoundary.learningFocus=blockFocus[code];
    newBoundary.blockBoundary=true;
    const boundaryText=`Teaching Block · Lesson ${code} · Estimated classroom time: ${newBoundary.estimatedClassroomTime} · Learning focus: ${blockFocus[code]}`;
    newBoundary.eyebrow=newBoundary.originalEyebrow?`${boundaryText} · ${newBoundary.originalEyebrow}`:boundaryText;
    previousBlock.end_slide=newIndex;
    previousBlock.screen_count=previousBlock.end_slide-previousBlock.start_slide+1;
    block.start_slide=newIndex+1;
    block.screen_count=block.end_slide-block.start_slide+1;
  }

  moveBoundary('1.4F','1.4E','Loan term trades payment size against total interest');
  moveBoundary('1.4G','1.4F','One financial structure, many applications');
  data.teachingBlocks=blocks;

  const extensionSections=new Set([
    'Effective rates','Inflation','Real value','Financial comparison','Regular deposits',
    'Payment timing','Mixed savings','Savings targets','Withdrawal annuities',
    'Outstanding balance','Decision modelling','Extension'
  ]);
  const extensionTitle=/(effective annual rate|advertised rates|frequent compounding|nominal return versus purchasing power|real value|inflation|ordinary annuity|annuity due|beginning of each|ordinary versus due|mixed future value|initial deposit plus|combine cash-flow components|savings and annuities|withdrawal fund|retirement income|retirement scenarios|retrospective balance|prospective balance|outstanding balance|extra principal|extra monthly repayment|sensitivity|risk analysis|growing annuit|derive the future value of an ordinary annuity|derive the loan-payment formula|annuity and loan explorer|generative financial studio|integrated ib-style financial decision)/i;
  const revisionSections=new Set(['Learning route','Diagnostic','Checkpoint','Synthesis','Exit ticket','Mastery','Simple interest']);
  const revisionTitle=/(learning intentions|six-lesson number and algebra route|readiness check|checkpoint|misconception clinic|independent exit ticket|mastery routes|transition to logarithms)/i;

  function slideScope(slide){
    const section=String(slide.originalSection||slide.section||'');
    const title=String(slide.title||'');
    return extensionSections.has(section)||extensionTitle.test(title)?'extension':'core';
  }
  function slideClassification(slide,scope){
    const section=String(slide.originalSection||slide.section||'');
    const title=String(slide.title||'');
    if(scope==='extension')return'Extension';
    if(revisionSections.has(section)||revisionTitle.test(title))return'Revision';
    if(slide.kind==='worked'||slide.kind==='student'||slide.kind==='lab')return'Practice';
    return'Core';
  }

  data.slides.forEach(slide=>{
    const scope=slideScope(slide);
    const classification=slideClassification(slide,scope);
    slide.scope=scope;
    slide.ibSyllabusScope=scope==='core'?'Current IB AI SL core':'Reference-supported extension';
    slide.classification=classification;
    slide.classificationIcon=icons[classification];
    slide.section=slide.blockBoundary
      ?`Teaching Block · ${slide.teachingBlock} · ${icons[classification]} ${classification}`
      :`${slide.teachingBlock} · ${icons[classification]} ${classification} · ${slide.originalSection||slide.section}`;
  });

  const extensionQuestionPattern=/(effective annual|\bEAR\b|inflation|real value|purchasing power|regular deposit|savings plan|savings balance|annuit|beginning[- ]of[- ](?:period|month|year)|mixed deposit|initial deposit.*regular|lump sum.*regular|withdrawal|retirement fund|retirement income|retrospective|prospective|outstanding balance|extra payment|extra repayment|prepayment|sensitivity|risk analysis|growing annuit)/i;
  function assessmentScope(item){
    const tags=Array.isArray(item.tags)?item.tags.join(' '):String(item.tags||'');
    const text=[item.title,item.context,item.prompt,item.answer,item.solution,tags].filter(Boolean).join(' ');
    return extensionQuestionPattern.test(text)?'extension':'core';
  }

  const taskScopeById={
    'FINV6-1.4-E01':'extension',
    'FINV6-1.4-E02':'extension',
    'FINV6-1.4-E03':'core',
    'FINV6-1.4-E04':'extension',
    'FINV6-1.4-E05':'extension',
    'FINV6-1.4-E06':'core'
  };

  data.practice.forEach(item=>{item.scope=assessmentScope(item);});
  data.quiz.forEach(item=>{item.scope=assessmentScope(item);});
  data.exam.forEach(item=>{item.scope=taskScopeById[item.id]||assessmentScope(item);});

  const allPractice=data.practice.slice();
  const allQuiz=data.quiz.slice();
  const allExam=data.exam.slice();
  data.scopeCollections={slides:data.slides,practice:allPractice,quiz:allQuiz,exam:allExam};

  if(!requestedAll){
    data.practice=allPractice.filter(item=>item.scope==='core');
    data.quiz=allQuiz.filter(item=>item.scope==='core');
    data.exam=allExam.filter(item=>item.scope==='core');
  }

  const coreSlideCount=data.slides.filter(slide=>slide.scope==='core').length;
  const extensionSlideCount=data.slides.length-coreSlideCount;
  const scopeCounts={
    learn:{core:coreSlideCount,extension:extensionSlideCount,total:data.slides.length},
    practice:{core:allPractice.filter(item=>item.scope==='core').length,extension:allPractice.filter(item=>item.scope==='extension').length,total:allPractice.length},
    quiz:{core:allQuiz.filter(item=>item.scope==='core').length,extension:allQuiz.filter(item=>item.scope==='extension').length,total:allQuiz.length},
    exam:{core:allExam.filter(item=>item.scope==='core').length,extension:allExam.filter(item=>item.scope==='extension').length,total:allExam.length}
  };

  Object.assign(data.lesson,{
    scope_release:'6.2.0',
    default_scope:'core',
    active_scope:requestedAll?'all':'core',
    scope_modes:[
      {id:'core',label:'IB SL Core',description:'Current IB Mathematics AI SL requirements and essential prerequisite practice.'},
      {id:'all',label:'All content',description:'IB SL core plus clearly marked reference-supported extension material.'}
    ],
    official_scope:{
      course:'Current Mathematics: applications and interpretation course, first assessment 2021',
      core_sections:[
        {code:'SL 1.4',title:'Financial applications of geometric sequences and series — compound interest and annual depreciation'},
        {code:'SL 1.7',title:'Loan repayments and amortization'}
      ],
      extension_basis:'Pearson, Haese and MAI 2.19 reference-supported applications retained outside the default core path',
      upcoming_course_note:'The revised course begins first teaching in August 2027 for first assessment in May 2029.'
    },
    scope_counts:scopeCounts
  });

  data.v6Audit=Object.assign({},data.v6Audit,{
    ibScopeRelease:'6.2.0',
    currentIbSections:['SL 1.4','SL 1.7'],
    defaultCoreScope:true,
    allOriginalSlidesRetained:data.scopeCollections.slides.length===100,
    allOriginalPracticeRetained:data.scopeCollections.practice.length===120,
    allOriginalQuizRetained:data.scopeCollections.quiz.length===16,
    allOriginalTasksRetained:data.scopeCollections.exam.length===6,
    advancedTopicsRemainAccessible:true,
    extensionExcludedFromDefaultMastery:true,
    coreAssessmentExcludesReferenceExtensions:true
  });
})();
