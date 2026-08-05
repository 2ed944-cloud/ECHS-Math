(function(){
  'use strict';
  const data=window.LESSON_DATA,copyBank=window.__ECHS_L14_V62;
  if(!data||String(data.lesson?.number)!=='1.4'||!copyBank)return;

  const deep=value=>JSON.parse(JSON.stringify(value));
  const original={
    slides:data.slides.map(deep),
    practice:data.practice.map(deep),
    quiz:data.quiz.map(deep),
    exam:data.exam.map(deep),
    objectives:[...(data.lesson.objectives||[])],vocab:[...(data.lesson.vocab||[])],
    subtitle:data.lesson.subtitle,technology:data.lesson.technology
  };
  const clone=deep;
  const fixString=value=>typeof value==='string'?value.replace(/([€£$])\(([^\\]+)\\\)/g,'$1\\($2\\)'):value;
  const repair=value=>{
    if(typeof value==='string')return fixString(value);
    if(Array.isArray(value))return value.map(repair);
    if(value&&typeof value==='object'){
      const result={};for(const [key,item] of Object.entries(value))result[key]=repair(item);return result;
    }
    return value;
  };
  const repaired={
    slides:repair(original.slides),practice:repair(original.practice),quiz:repair(original.quiz),exam:repair(original.exam)
  };
  const custom=[...(copyBank.slides||[]),...(copyBank.slides2||[])];
  const customByTitle=new Map(custom.map(slide=>[slide.title,repair(slide)]));
  const originalByTitle=new Map(repaired.slides.map(slide=>[slide.title,slide]));
  const coreTitles=[
    '1.4 · Financial Applications','Learning intentions and mastery evidence','Readiness check · six ideas that matter',
    'Simple interest is arithmetic change','Worked example · fixed monetary growth','Student turn · direct simple interest',
    'Compound interest is geometric change','Derive the compound formula from repeated multiplication','Worked example · annual compounding',
    'Student turn · annual compound growth','Simple and compound interest separate over time','Misconception clinic · compound does not mean “add Pr repeatedly”',
    'Nominal annual rate is not the periodic rate','Synchronize rate, payment and time units','The general compound-interest model',
    'Worked example · quarterly compounding','Student turn · match rates to periods','Unknown time is a threshold problem',
    'Worked example · first whole year above a target','Student turn · target balances','Checkpoint · interest and rates',
    'Reducing-balance depreciation is compound decay','Worked example · annual reducing-balance depreciation','Student turn · value and loss',
    'Straight-line and reducing-balance depreciation are different models','A depreciation threshold is a first-below problem','Worked example · replacement threshold',
    'Interactive SL core explorer','Generative core practice · interest and depreciation','Independent exit ticket','Mastery routes and transition to logarithms'
  ];
  const corePracticeIds=[
    'FINV6-1.4-F01','FINV6-1.4-F02','FINV6-1.4-F03','FINV6-1.4-F04','FINV6-1.4-F05','FINV6-1.4-F06','FINV6-1.4-F07','FINV6-1.4-F08','FINV6-1.4-F09','FINV6-1.4-F10',
    'FINV6-1.4-F11','FINV6-1.4-F12','FINV6-1.4-F13','FINV6-1.4-F14','FINV6-1.4-F15','FINV6-1.4-F16','FINV6-1.4-F17','FINV6-1.4-F18','FINV6-1.4-F19','FINV6-1.4-F20',
    'FINV6-1.4-A01','FINV6-1.4-A02','FINV6-1.4-A03','FINV6-1.4-A04','FINV6-1.4-A05','FINV6-1.4-A11','FINV6-1.4-A12',
    'FINV6-1.4-R01','FINV6-1.4-R02','FINV6-1.4-R03','FINV6-1.4-R04','FINV6-1.4-R05','FINV6-1.4-R06','FINV6-1.4-R07','FINV6-1.4-R27',
    'FINV6-1.4-C16','FINV6-1.4-C17','FINV6-1.4-C19','FINV6-1.4-C23','FINV6-1.4-C24'
  ];
  const coreTitleSet=new Set(coreTitles),corePracticeSet=new Set(corePracticeIds);
  const coreSlides=coreTitles.map(title=>clone(customByTitle.get(title)||originalByTitle.get(title))).filter(Boolean);
  const corePractice=corePracticeIds.map(id=>repaired.practice.find(item=>item.id===id)).filter(Boolean).map(clone);
  const coreQuiz=repair(copyBank.quiz||[]);
  const coreExam=repair(copyBank.exam||[]);
  const opening=originalByTitle.get('Opening decision · three plans, one fair comparison');
  const extensionSlides=[opening,...repaired.slides.filter(slide=>!coreTitleSet.has(slide.title)&&slide.title!==opening?.title)].filter(Boolean).map(clone);
  const extensionPractice=repaired.practice.filter(item=>!corePracticeSet.has(item.id)).map(clone);
  const extensionQuiz=repaired.quiz.filter(item=>!['FINV6-1.4-Q01','FINV6-1.4-Q02','FINV6-1.4-Q03','FINV6-1.4-Q04'].includes(item.id)).map(clone);
  const extensionExam=repaired.exam.map(clone);
  const scope=/(?:^|[?&])scope=extension(?:&|$)/.test(String(location.search||''))?'extension':'core';

  const definitions={
    core:[
      {code:'1.4A',title:'Percentage Change and Compound Growth',time:'60–75 minutes',focus:'Connect percentage factors to simple and compound financial growth.',start:'1.4 · Financial Applications'},
      {code:'1.4B',title:'Compounding Conventions and Completed Periods',time:'60–75 minutes',focus:'Match nominal rates, periodic rates, compounding frequency and completed periods.',start:'Nominal annual rate is not the periodic rate'},
      {code:'1.4C',title:'Annual Depreciation',time:'60–75 minutes',focus:'Model annual reducing-balance depreciation and first-below replacement thresholds.',start:'Reducing-balance depreciation is compound decay'},
      {code:'1.4D',title:'Technology and Core Mastery',time:'45–60 minutes',focus:'Use technology after the model is understood and consolidate the official SL 1.4 core.',start:'Interactive SL core explorer'}
    ],
    extension:[
      {code:'1.4E',title:'Broader Financial Context and Real Value',time:'Optional · 60–75 minutes',focus:'Extend compound growth to effective rates, inflation, real value and fair comparison.',start:'Opening decision · three plans, one fair comparison'},
      {code:'1.4F',title:'Savings, Annuities and Loans',time:'Optional · 75–90 minutes',focus:'Explore regular deposits, payment timing, withdrawal funds and level loan repayments.',start:'Regular deposits accumulate as a geometric sum'},
      {code:'1.4G',title:'Amortization, Decisions and Enrichment',time:'Optional · 75–90 minutes',focus:'Interpret amortization, balances, repayment strategy, sensitivity and mixed decisions.',start:'Amortization is a balance recurrence'}
    ]
  };
  function annotate(slides,blocks,mode){
    const starts=blocks.map(block=>slides.findIndex(slide=>slide.title===block.start));
    if(starts.some(index=>index<0))throw new Error(`Lesson 1.4 ${mode} scope boundary missing`);
    let active=0;
    slides.forEach((slide,index)=>{
      const boundary=starts.indexOf(index);if(boundary>=0)active=boundary;
      const block=blocks[active];
      const revision=/readiness|checkpoint|misconception|exit ticket|mastery/i.test(slide.title);
      const classification=mode==='extension'?(revision?'Revision':'Extension'):(revision?'Revision':(['worked','student','lab'].includes(slide.kind)?'Practice':'Core'));
      const icon={Core:'🟢',Practice:'🔵',Extension:'🟠',Revision:'🟣'}[classification];
      slide.originalSection=slide.originalSection||slide.section;slide.originalEyebrow=slide.originalEyebrow??slide.eyebrow;
      slide.teachingBlock=block.code;slide.teachingBlockTitle=block.title;slide.classification=classification;slide.classificationIcon=icon;slide.blockBoundary=boundary>=0;slide.scope=mode;slide.scopeIndex=index;
      slide.section=`Lesson ${block.code} · ${icon} ${classification} · ${slide.originalSection}`;
      if(boundary>=0){const lead=`Teaching Block · Lesson ${block.code} · Estimated classroom time: ${block.time} · Learning focus: ${block.focus}`;slide.eyebrow=slide.originalEyebrow?`${lead} · ${slide.originalEyebrow}`:lead;}
    });
    return blocks.map((block,index)=>{const start=starts[index],end=index===blocks.length-1?slides.length-1:starts[index+1]-1;return{code:block.code,title:block.title,estimated_classroom_time:block.time,learning_focus:block.focus,start_slide:start+1,end_slide:end+1,screen_count:end-start+1,scope:mode};});
  }
  const coreBlocks=annotate(coreSlides,definitions.core,'core'),extensionBlocks=annotate(extensionSlides,definitions.extension,'extension');

  data.schemaVersion='1.4.2';data.version='6.2.0';data.buildDate='2026-08-05';data.financialScope=scope;data.storageScope=scope;
  data.lesson.release='6.2.0';data.lesson.scope_model='IB SL core first; broader textbook applications remain optional at the same URL.';
  data.lesson.syllabus_focus='Current IB Mathematics: applications and interpretation SL 1.4 — financial applications: compound interest and annual depreciation.';
  data.lesson.source_basis=[
    'International Baccalaureate Mathematics: applications and interpretation subject brief and current SL 1.4 syllabus mapping',
    'Pearson Mathematics: Applications and Interpretation SL — percentage change, compound interest and technology-supported modelling',
    'Haese Mathematics Core Topics SL 1 — compound interest and annual depreciation',
    'Haese Mathematics: Applications and Interpretation SL 2 — optional loans and annuities extension',
    'Christos Nikolaidis MAI 2.19 — optional wider financial applications and exam-style practice'
  ];
  data.lesson.financial_scope_catalog={
    current_syllabus_core:'SL 1.4 — financial applications: compound interest and annual depreciation',
    core:{learn_screens:coreSlides.length,practice_questions:corePractice.length,quiz_questions:coreQuiz.length,extended_tasks:coreExam.length,blocks:coreBlocks},
    extension:{learn_screens:extensionSlides.length,practice_questions:extensionPractice.length,quiz_questions:extensionQuiz.length,extended_tasks:extensionExam.length,blocks:extensionBlocks},
    preserved_unique_content:{learn_screens:original.slides.length,practice_questions:original.practice.length,quiz_questions:original.quiz.length,extended_tasks:original.exam.length}
  };
  data.financialScopeCatalog=data.lesson.financial_scope_catalog;
  if(scope==='core'){
    data.lesson.subtitle='A compact IB AI SL core route through percentage factors, compound interest, rate conventions, technology and annual depreciation.';
    data.lesson.objectives=[
      'Translate percentage increases and decreases into multiplicative factors.',
      'Model annual and non-annual compound interest with consistent periods.',
      'Use technology transparently after identifying the correct model and settings.',
      'Solve first-completed-period compound-growth questions and verify adjacent periods.',
      'Model annual reducing-balance depreciation and replacement thresholds.',
      'Interpret currency, time, assumptions and reasonableness in context.'
    ];
    data.lesson.vocab=['principal','simple interest','compound interest','growth factor','decay factor','nominal annual rate','periodic rate','compounding period','future value','annual depreciation','retention factor'];
    data.lesson.technology='Use the GDC after selecting the model. Record the periodic rate and number of completed periods, retain guard digits and verify threshold answers with adjacent periods.';
    data.slides=coreSlides;data.practice=corePractice;data.quiz=coreQuiz;data.exam=coreExam;data.teachingBlocks=coreBlocks;
  }else{
    data.lesson.subtitle='Optional broader applications: effective rates, inflation, real value, annuities, loans, amortization and financial decisions.';
    data.lesson.objectives=original.objectives;data.lesson.vocab=original.vocab;data.lesson.technology=original.technology;
    data.slides=extensionSlides;data.practice=extensionPractice;data.quiz=extensionQuiz;data.exam=extensionExam;data.teachingBlocks=extensionBlocks;
  }
  data.lesson.teaching_blocks=data.teachingBlocks;
  data.lesson.pacing={active_scope:scope,core_first:true,block_sequence:data.teachingBlocks.map(block=>block.code),learn_screens:data.slides.length,practice_questions:data.practice.length,timed_quiz_questions:data.quiz.length,extended_tasks:data.exam.length,same_lesson_url:true,optional_extension_query:'?scope=extension'};
  data.v6Audit=Object.assign({},data.v6Audit,{ibScopeReaudit:true,currentSL14Core:'compound interest and annual depreciation',coreFirstPath:true,advancedApplicationsRetained:true,currencyDelimiterRepair:true,sameCanonicalURL:true,coreCounts:{slides:31,practice:40,quiz:10,exam:3},extensionCounts:{slides:71,practice:80,quiz:12,exam:6}});
  window.__ECHS_L14_ORIGINAL_V6=original;
})();
