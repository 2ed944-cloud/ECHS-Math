(function(){
  'use strict';

  const data=window.LESSON_DATA;
  if(!data||String(data.lesson?.number)!=='1.4'||!Array.isArray(data.slides))return;

  const blocks=[
    {
      code:'1.4A',
      title:'Percentage Change and Financial Growth',
      time:'60–75 minutes',
      focus:'Connect percentage change to simple and compound financial growth while reading cash flows on a common valuation date.',
      startTitle:'1.4 · Financial Applications'
    },
    {
      code:'1.4B',
      title:'Compounding and Rate Conventions',
      time:'60–75 minutes',
      focus:'Use nominal, periodic and effective rates consistently and solve completed-period growth questions.',
      startTitle:'Nominal annual rate is not the periodic rate'
    },
    {
      code:'1.4C',
      title:'Depreciation, Inflation and Real Value',
      time:'60–75 minutes',
      focus:'Model depreciation and inflation, then distinguish nominal value from real purchasing power.',
      startTitle:'Reducing-balance depreciation is compound decay'
    },
    {
      code:'1.4D',
      title:'Regular Deposits and Savings',
      time:'60–75 minutes',
      focus:'Build ordinary-annuity savings models before exploring timing shifts, mixed deposits and withdrawal funds.',
      startTitle:'Regular deposits accumulate as a geometric sum'
    },
    {
      code:'1.4E',
      title:'Loans and Repayment',
      time:'60–75 minutes',
      focus:'Model loan repayments and amortization from cash-flow equivalence, then interpret balances and repayment evidence.',
      startTitle:'TVM variables encode a cash-flow equation'
    },
    {
      code:'1.4F',
      title:'Financial Decision Making',
      time:'60–75 minutes',
      focus:'Compare financial strategies only after computational fluency, using total cost, timing, implementation and sensitivity.',
      startTitle:'Extra principal paid early reduces many future interest charges'
    },
    {
      code:'1.4G',
      title:'Mastery and Mixed Financial Applications',
      time:'60–75 minutes',
      focus:'Consolidate the entire lesson through mixed applications, synthesis, revision and mastery evidence.',
      startTitle:'Integrated IB-style financial decision'
    }
  ];

  const boundaryByTitle=new Map(blocks.map((block,index)=>[block.startTitle,{block,index}]));
  const boundaryIndices=blocks.map(block=>data.slides.findIndex(slide=>slide.title===block.startTitle));
  if(boundaryIndices.some(index=>index<0))return;

  const icons={Core:'🟢',Practice:'🔵',Extension:'🟠',Revision:'🟣'};
  const extensionSection=/^(Payment timing|Mixed savings|Withdrawal annuities|Outstanding balance|Decision modelling|Extension)$/i;
  const extensionTitle=/(annuity due|beginning of each|ordinary versus due|mixed savings|initial deposit plus|combine cash-flow|withdrawal|retirement income|retirement scenarios|retrospective|prospective|outstanding balance|sensitivity|risk analysis|growing annuit)/i;
  const revisionSection=/^(Learning route|Diagnostic|Checkpoint|Synthesis|Exit ticket|Mastery)$/i;
  const revisionTitle=/(learning intentions|six-lesson number and algebra route|readiness check|checkpoint|misconception clinic|one financial structure|independent exit ticket|mastery routes|transition to logarithms)/i;

  function classificationFor(slide){
    const section=String(slide.section||'');
    const title=String(slide.title||'');
    if(extensionSection.test(section)||extensionTitle.test(title))return'Extension';
    if(revisionSection.test(section)||revisionTitle.test(title))return'Revision';
    if(slide.kind==='worked'||slide.kind==='student'||slide.kind==='lab')return'Practice';
    return'Core';
  }

  let activeBlockIndex=0;
  data.slides.forEach((slide,index)=>{
    const boundary=boundaryByTitle.get(slide.title);
    if(boundary)activeBlockIndex=boundary.index;
    const block=blocks[activeBlockIndex];
    const classification=classificationFor(slide);
    const icon=icons[classification];
    const isBoundary=Boolean(boundary);

    slide.originalSection=slide.section;
    slide.originalEyebrow=slide.eyebrow;
    slide.teachingBlock=block.code;
    slide.teachingBlockTitle=block.title;
    slide.estimatedClassroomTime=block.time;
    slide.learningFocus=block.focus;
    slide.classification=classification;
    slide.classificationIcon=icon;
    slide.blockBoundary=isBoundary;
    slide.section=isBoundary
      ?`Teaching Block · ${block.code} · ${icon} ${classification}`
      :`${block.code} · ${icon} ${classification} · ${slide.originalSection}`;
    if(isBoundary){
      const boundaryText=`Teaching Block · Lesson ${block.code} · Estimated classroom time: ${block.time} · Learning focus: ${block.focus}`;
      slide.eyebrow=slide.originalEyebrow?`${boundaryText} · ${slide.originalEyebrow}`:boundaryText;
    }
    slide.originalLearnIndex=index;
  });

  blocks.forEach((block,index)=>{
    const start=boundaryIndices[index];
    const end=index===blocks.length-1?data.slides.length-1:boundaryIndices[index+1]-1;
    block.startIndex=start;
    block.endIndex=end;
    block.screenCount=end-start+1;
    block.startSlideNumber=start+1;
    block.endSlideNumber=end+1;
  });

  data.organizationSchemaVersion='1.0.0';
  data.organizationBuildDate='2026-08-05';
  data.lesson.organization_release='6.1.0';
  data.lesson.organization='Seven internal teaching blocks within one unchanged lesson route';
  data.lesson.teaching_blocks=blocks.map(block=>({
    code:block.code,
    title:block.title,
    estimated_classroom_time:block.time,
    learning_focus:block.focus,
    start_slide:block.startSlideNumber,
    end_slide:block.endSlideNumber,
    screen_count:block.screenCount
  }));
  data.lesson.pacing={
    format:'single lesson with internal teaching blocks',
    total_teaching_blocks:blocks.length,
    total_learn_screens:data.slides.length,
    block_sequence:blocks.map(block=>block.code),
    practice_studio_unchanged:true,
    timed_quiz_unchanged:true,
    ib_tasks_unchanged:true,
    mastery_route_unchanged:true
  };
  data.teachingBlocks=data.lesson.teaching_blocks;
  data.v6Audit=Object.assign({},data.v6Audit,{
    organizationOnlyRefactor:true,
    teachingBlockRelease:'6.1.0',
    teachingBlockCount:7,
    learnScreenCountPreserved:data.slides.length===100,
    originalLearnOrderPreserved:true,
    existingSlideHtmlPreserved:true,
    existingSlideTitlesPreserved:true,
    practiceStudioPreserved:true,
    timedQuizPreserved:true,
    ibTasksPreserved:true,
    masteryRoutePreserved:true,
    legacyRoutesPreserved:true
  });
})();
