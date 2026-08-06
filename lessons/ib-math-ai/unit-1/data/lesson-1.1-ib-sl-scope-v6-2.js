(function(){
  'use strict';

  const data=window.LESSON_DATA;
  if(!data||String(data.lesson?.number)!=='1.1'||!Array.isArray(data.slides))return;

  const requestedAll=/(?:^|[?&])scope=all(?:&|$)/i.test(String(window.location&&window.location.search||''));
  const icons={Core:'🟢',Practice:'🔵',Extension:'🟠',Revision:'🟣'};
  const normalize=value=>String(value||'').toLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim();
  const slideByTitle=title=>data.slides.find(slide=>normalize(slide.title)===normalize(title));

  function setCover(){
    const cover=data.slides.find(slide=>slide.kind==='cover');
    if(!cover)return;
    cover.title='1.1 · Scientific Notation, Approximation and Error';
    cover.html=String(cover.html||'')
      .replace(/Scientific Notation and Orders of Magnitude/g,'Scientific Notation, Approximation and Error')
      .replace(/Represent very large and very small quantities efficiently, calculate with powers of ten, and interpret scale\./g,'Represent scale efficiently, report accuracy honestly, construct bounds, quantify error and validate every calculator result.')
      .replace(/Unified definitive lesson/g,'Core-first definitive lesson');
  }

  function setUnitRoute(){
    const slide=slideByTitle('Your place in Unit 1');
    if(!slide)return;
    slide.html=`
      <div class="scope-six-route" aria-label="Six-lesson Unit 1 route">
        <div class="scope-route-node active"><b>1.1</b><span>Scientific notation, approximation and error</span></div>
        <div class="scope-route-node"><b>1.2</b><span>Arithmetic sequences and series</span></div>
        <div class="scope-route-node"><b>1.3</b><span>Geometric sequences and series</span></div>
        <div class="scope-route-node"><b>1.4</b><span>Financial applications</span></div>
        <div class="scope-route-node"><b>1.5</b><span>Exponent laws and logarithms</span></div>
        <div class="scope-route-node"><b>1.6</b><span>Technology for equations and systems</span></div>
      </div>
      <p class="callout"><b>Why these ideas belong together:</b> SL 1.1 establishes powers-of-ten notation; SL 1.6 uses accuracy, bounds, error and estimation to decide whether numerical results are meaningful.</p>`;
  }

  function setSyllabusFocus(){
    const slide=slideByTitle('Syllabus focus');
    if(!slide)return;
    slide.html=`
      <div class="scope-focus-grid">
        <article class="scope-card"><span>IB AI SL CORE · SL 1.1</span><h3>Scientific notation</h3><ul><li>Operate with numbers written as \\(a\\times10^k\\), where \\(1\\le a&lt;10\\) and \\(k\\in\\mathbb Z\\).</li><li>Use very large and very small quantities in context.</li><li>Translate calculator output such as <code>5.2E30</code> into \\(5.2\\times10^{30}\\).</li></ul></article>
        <article class="scope-card"><span>IB AI SL CORE · SL 1.6</span><h3>Approximation and error</h3><ul><li>Decimal places, significant figures and appropriate accuracy.</li><li>Upper and lower bounds of rounded quantities.</li><li>Percentage error, measurement limitations, estimation and reasonableness.</li></ul></article>
        <article class="scope-card extension"><span>REFERENCE-SUPPORTED EXTENSION</span><h3>Optional enrichment</h3><p>Detailed number-set taxonomy, complex-number placement, recurring-decimal structure, rounding cells and machine-representation ideas remain available for enrichment but do not count toward default SL mastery.</p></article>
        <article class="scope-card"><span>ASSESSMENT PRINCIPLE</span><h3>Mathematics first, technology second</h3><p>Students estimate the scale, enter values transparently, retain guard digits, report the requested accuracy and verify units or bounds.</p></article>
      </div>
      <div class="scope-notation-rule"><b>IB communication rule:</b> calculator notation is an input/display convention, not an acceptable final mathematical form. Final answers use \\(a\\times10^k\\) and include justified accuracy and units.</div>`;
  }

  function setLearningIntentions(){
    const slide=slideByTitle('Learning intentions');
    if(!slide)return;
    slide.html=`
      <div class="scope-learning-grid">
        <div><h3>By the end of the IB SL core route, you can…</h3><ul class="check-list"><li>Convert between ordinary notation and normalized scientific notation.</li><li>Multiply, divide, add and subtract quantities written with powers of ten.</li><li>Round to decimal places or significant figures and preserve meaningful zeros.</li><li>Construct direct and calculated bounds for positive measured quantities.</li><li>Calculate percentage error and judge whether a result is reasonable.</li><li>Use the TI‑84 <b>EE</b> entry and <b>SCI/NORM</b> display modes without copying calculator notation into the final answer.</li></ul></div>
        <div class="evidence"><h3>Evidence of understanding</h3><ul class="check-list"><li>Estimate before calculating.</li><li>Keep guard digits until the final line.</li><li>State units and requested accuracy.</li><li>Choose endpoints deliberately in a bound.</li><li>Translate <code>E</code> notation into \\(\\times10^k\\).</li><li>Explain what the answer means in context.</li></ul></div>
      </div>`;
  }

  function setCoreVocabulary(){
    const slide=slideByTitle('Core vocabulary');
    if(!slide)return;
    slide.html=`<div class="vocab-grid"><div class="vocab-chip">standard form</div><div class="vocab-chip">coefficient</div><div class="vocab-chip">integer exponent</div><div class="vocab-chip">order of magnitude</div><div class="vocab-chip">decimal place</div><div class="vocab-chip">significant figure</div><div class="vocab-chip">guard digit</div><div class="vocab-chip">lower bound</div><div class="vocab-chip">upper-bound endpoint</div><div class="vocab-chip">percentage error</div><div class="vocab-chip">estimate</div><div class="vocab-chip">reasonable result</div></div><p class="callout">Use \\(=\\) for equality, \\(\\approx\\) for approximation and \\(a\\times10^k\\) for the final mathematical report.</p>`;
  }

  function fixIbNaturalNumberNotation(){
    const slide=slideByTitle('Natural numbers and integers');
    if(slide){
      slide.html=`
        <div class="nf-two">
          <div class="nf-definition-card"><span>IB NATURAL-NUMBER NOTATION</span><div class="nf-big-math">\\[\\mathbb N=\\{0,1,2,3,\\ldots\\}\\]</div><p>In IB notation, \\(0\\in\\mathbb N\\). When only the positive integers are required, use \\(\\mathbb Z^+=\\{1,2,3,\\ldots\\}\\).</p><div class="nf-example-row"><div><b>natural</b><span>\\(0,17,144\\)</span></div><div><b>positive integer</b><span>\\(17\\in\\mathbb Z^+\\)</span></div><div><b>not natural</b><span>\\(-4,\\tfrac12\\)</span></div></div></div>
          <div class="nf-definition-card"><span>INTEGERS</span><div class="nf-big-math">\\[\\mathbb Z=\\{\\ldots,-2,-1,0,1,2,\\ldots\\}\\]</div><p>Integers contain the natural numbers and the negative whole numbers. Every integer is rational because \\(n=\\frac n1\\).</p><div class="nf-example-row"><div><b>integer</b><span>\\(-36\\)</span></div><div><b>also rational</b><span>\\(-36=-\\tfrac{36}{1}\\)</span></div><div><b>not integer</b><span>\\(2.7\\)</span></div></div></div>
        </div>
        <div class="nf-note"><b>Smallest-set language under IB notation:</b> the smallest standard set containing \\(0\\) is \\(\\mathbb N\\), and \\(\\mathbb N\\subset\\mathbb Z\\subset\\mathbb Q\\subset\\mathbb R\\).</div>`;
    }
    const checkpoint=slideByTitle('Mastery checkpoint · number sets');
    if(checkpoint){
      checkpoint.html=`<div class="nf-checkpoint"><div><b>1</b><p>State the smallest IB set containing \\(0\\).</p></div><div><b>2</b><p>Explain why every integer is rational.</p></div><div><b>3</b><p>Classify \\(\\sqrt{18}\\).</p></div><div><b>4</b><p>Is \\(0.1010010001\\ldots\\) rational? Justify.</p></div><div><b>5</b><p>State the relationship between \\(\\mathbb R\\) and \\(\\mathbb C\\).</p></div><div><b>6</b><p>Correct: \\(\\mathbb N\\in\\mathbb Z\\).</p></div></div><details class="solution-reveal"><summary>Check the reasoning</summary><p>1. \\(\\mathbb N\\), because IB uses \\(\\mathbb N=\\{0,1,2,\\ldots\\}\\). 2. \\(n=n/1\\). 3. \\(3\\sqrt2\\) is irrational. 4. The displayed pattern is non-terminating and not eventually periodic, so irrational. 5. \\(\\mathbb R\\subset\\mathbb C\\). 6. Sets use \\(\\subset\\): \\(\\mathbb N\\subset\\mathbb Z\\).</p></details>`;
    }
  }

  function upgradeCalculatorFluency(){
    const slide=slideByTitle('Calculator fluency');
    if(!slide||String(slide.html).includes('nf-ti84-core-note'))return;
    slide.html+=`<aside class="nf-ti84-core-note"><span>84</span><div><h3>Lesson-specific TI‑84 classroom route</h3><p>Use <code>2nd → EE</code> to enter \\(\\times10^k\\), use the dedicated <code>(−)</code> key for a negative exponent, switch between <code>SCI</code> and <code>NORM</code> only to control the display, retain guard digits, then rewrite every final <code>E</code> output as \\(a\\times10^k\\). Open <b>TI‑84 Classroom</b> from the lesson navigation to practise on the embedded simulator.</p></div></aside>`;
  }

  setCover();
  setUnitRoute();
  setSyllabusFocus();
  setLearningIntentions();
  setCoreVocabulary();
  fixIbNaturalNumberNotation();
  upgradeCalculatorFluency();

  const extensionSectionPattern=/^(number sets?|number-set|numerical representation|machine precision)$/i;
  const extensionTitlePattern=/(number[- ]set|natural numbers and integers|rational numbers|irrational and real|complex numbers|classify precisely|smallest[- ]set|decimal behaviour|decimal behavior|recurring decimal|terminating decimal|prime factors?|rounding cells?|granularity|neighbou?ring representable|machine representation|floating[- ]point|binary representation|double[- ]rounding|deriv(?:e|ing).*(?:rounding|decimal)|beyond the real line)/i;
  const revisionPattern=/(diagnostic|misconception|checkpoint|exit ticket|mastery|synthesis|retrieval|review|prior[- ]knowledge|summary|recap)/i;

  function slideScope(slide){
    const section=String(slide.originalSection||slide.section||'');
    const text=[section,slide.title,slide.eyebrow].filter(Boolean).join(' ');
    return extensionSectionPattern.test(section)||extensionTitlePattern.test(text)?'extension':'core';
  }
  function slideClassification(slide,scope){
    const text=[slide.section,slide.title,slide.eyebrow].filter(Boolean).join(' ');
    if(scope==='extension')return'Extension';
    if(revisionPattern.test(text))return'Revision';
    if(['student','inquiry','lab','worked'].includes(slide.kind))return'Practice';
    return'Core';
  }

  data.slides.forEach(slide=>{
    slide.originalSection=slide.originalSection||slide.section;
    const scope=slideScope(slide);
    const classification=slideClassification(slide,scope);
    slide.scope=scope;
    slide.ibSyllabusScope=scope==='core'?'IB AI SL core · SL 1.1 / SL 1.6':'Reference-supported extension';
    slide.classification=classification;
    slide.classificationIcon=icons[classification];
  });

  function itemText(item){
    const tags=Array.isArray(item.tags)?item.tags.join(' '):String(item.tags||'');
    const choices=Array.isArray(item.choices)?item.choices.join(' '):'';
    const parts=Array.isArray(item.parts)?item.parts.flatMap(part=>[part.prompt,part.answer,part.markscheme]).filter(Boolean).join(' '):'';
    return [item.title,item.context,item.prompt,item.answer,item.solution,choices,parts,tags]
      .filter(Boolean).join(' ');
  }
  const extensionQuestionPattern=/(smallest (?:appropriate )?(?:number )?set|number[- ]set|natural number|integer is rational|rational number|irrational|complex number|\\mathbb\s*[NCQRZ]|recurring decimal|terminating decimal|prime factor criterion|rounding cell|representable (?:machine )?value|floating[- ]point|double[- ]rounding)/i;
  function assessmentScope(item){return extensionQuestionPattern.test(itemText(item))?'extension':'core';}

  const optical=data.exam.find(item=>item.id==='NFV6-1.1-E05');
  if(optical&&Array.isArray(optical.parts)&&optical.parts.length){
    const originalPart=Object.assign({},optical.parts[0]);
    optical.parts[0]={
      label:'a',
      prompt:'Write the measured diameter \\(4.20\\text{ cm}\\) in normalized scientific notation and state the number of significant figures shown.',
      marks:2,
      answer:'\\(4.20\\times10^0\\text{ cm}\\), showing 3 significant figures.',
      markscheme:'A1 normalized scientific notation with the trailing zero retained; A1 states 3 significant figures.'
    };
    if(!data.exam.some(item=>item.id==='NFV6-1.1-E06')){
      data.exam.push({
        id:'NFV6-1.1-E06',style:'Extension · number-set communication',title:'Number-set classification and IB notation',calculator:'No calculator',total_marks:5,scope:'extension',
        context:'This optional task consolidates precise set notation beyond the assessed SL 1.1 and SL 1.6 route.',
        parts:[
          originalPart,
          {label:'b',prompt:'Using IB notation, state the smallest set containing \\(0\\), and distinguish \\(\\mathbb N\\) from \\(\\mathbb Z^+\\).',marks:3,answer:'\\(0\\in\\mathbb N\\), where \\(\\mathbb N=\\{0,1,2,\\ldots\\}\\); \\(\\mathbb Z^+=\\{1,2,3,\\ldots\\}\\).',markscheme:'A1 smallest set \\(\\mathbb N\\); A1 natural-number set includes zero; A1 positive-integer set excludes zero.'}
        ]
      });
    }
  }

  [data.practice,data.quiz].forEach(collection=>collection.forEach(item=>{item.scope=assessmentScope(item);}));
  data.exam.forEach(item=>{item.scope=item.id==='NFV6-1.1-E06'?'extension':assessmentScope(item);});

  const allPractice=data.practice.slice();
  const allQuiz=data.quiz.slice();
  const allExam=data.exam.slice();
  data.scopeCollections={slides:data.slides,practice:allPractice,quiz:allQuiz,exam:allExam};

  if(!requestedAll){
    data.practice=allPractice.filter(item=>item.scope==='core');
    data.quiz=allQuiz.filter(item=>item.scope==='core');
    data.exam=allExam.filter(item=>item.scope==='core');
  }

  const countScope=(collection,scope)=>collection.filter(item=>item.scope===scope).length;
  const scopeCounts={
    learn:{core:countScope(data.slides,'core'),extension:countScope(data.slides,'extension'),total:data.slides.length},
    practice:{core:countScope(allPractice,'core'),extension:countScope(allPractice,'extension'),total:allPractice.length},
    quiz:{core:countScope(allQuiz,'core'),extension:countScope(allQuiz,'extension'),total:allQuiz.length},
    exam:{core:countScope(allExam,'core'),extension:countScope(allExam,'extension'),total:allExam.length}
  };

  Object.assign(data.lesson,{
    title:'Scientific Notation, Approximation and Error',
    subtitle:'Operate with powers of ten, choose and communicate accuracy, construct bounds, quantify error and validate technology-supported results.',
    syllabus_focus:'IB AI SL 1.1 and SL 1.6 — scientific notation; decimal places and significant figures; appropriate accuracy; bounds; percentage error; estimation and reasonableness.',
    objectives:[
      'Convert between ordinary notation and normalized scientific notation and operate with powers of ten.',
      'Round to decimal places and significant figures while preserving meaningful zeros.',
      'Choose an appropriate degree of accuracy from the data and context.',
      'Construct upper and lower bounds for rounded quantities and calculate bounds for positive expressions.',
      'Calculate percentage error and interpret measurement limitations.',
      'Estimate scale and decide whether a calculator result is reasonable.',
      'Use TI-84 EE and SCI/NORM modes transparently, retain guard digits and report final answers in mathematical notation.'
    ],
    extension_objectives:[
      'Classify values in a detailed hierarchy of number sets using IB notation.',
      'Explore recurring-decimal structure, rounding cells and machine-representation limits.'
    ],
    vocab:['standard form','coefficient','integer exponent','order of magnitude','decimal place','significant figure','guard digit','rounding unit','lower bound','upper-bound endpoint','error interval','absolute error','percentage error','estimate','reasonable result'],
    technology:'Use TI-84 EE for scientific-notation entry and SCI/NORM for display control. Estimate first, retain guard digits, translate E notation into a × 10^k, and verify units, bounds or scale.',
    scope_release:'6.2.0',default_scope:'core',active_scope:requestedAll?'all':'core',
    scope_modes:[
      {id:'core',label:'IB SL Core',description:'The assessed SL 1.1 and SL 1.6 learning route.'},
      {id:'all',label:'All content',description:'IB SL core plus clearly marked enrichment and numerical-precision extensions.'}
    ],
    official_scope:{
      core_sections:[
        {code:'SL 1.1',title:'Operations with numbers in the form a × 10^k'},
        {code:'SL 1.6',title:'Approximation, bounds, percentage error and estimation'}
      ],
      calculator_communication:'E notation may be used for entry or display, but final mathematical answers use a × 10^k.',
      extension_basis:'Number-set taxonomy and deeper numerical representation retained as optional reference-supported enrichment.'
    },
    scope_counts:scopeCounts
  });

  data.v6Audit=Object.assign({},data.v6Audit,{
    ibScopeRelease:'6.2.0',currentIbSections:['SL 1.1','SL 1.6'],defaultCoreScope:true,
    allOriginalSlidesRetained:data.scopeCollections.slides.length===79,
    allOriginalPracticeRetained:data.scopeCollections.practice.length===96,
    allOriginalQuizRetained:data.scopeCollections.quiz.length===14,
    originalFiveCoreTasksRetained:data.scopeCollections.exam.filter(item=>item.scope==='core').length===5,
    numberSetsMovedToExtension:true,complexNumbersMovedToExtension:true,
    ibNaturalNumberConvention:true,calculatorNotationRuleExplicit:true,
    advancedTopicsRemainAccessible:true,extensionExcludedFromDefaultMastery:true,
    coreAssessmentExcludesReferenceExtensions:true
  });
})();
