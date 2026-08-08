(function(){
  'use strict';
  const B=window.__ECHS_TCI5_BUILD;if(!B)throw new Error('Lesson 2.5 v5 builder is missing.');
  const {legacy,slides,R}=B;
  if(slides.length!==88)throw new Error(`Lesson 2.5 v5 expected 88 Learn screens, received ${slides.length}.`);
  if(!Array.isArray(legacy.practice)||legacy.practice.length!==60)throw new Error('Lesson 2.5 v5 requires the verified 60-question legacy Practice Studio.');
  if(!Array.isArray(legacy.quiz)||legacy.quiz.length!==12)throw new Error('Lesson 2.5 v5 requires the verified 12-question legacy quiz.');
  if(!Array.isArray(legacy.exam)||legacy.exam.length!==3)throw new Error('Lesson 2.5 v5 requires the three verified legacy IB tasks.');

  const inferTags=question=>{
    const text=`${question.prompt||''} ${question.solution||''}`.toLowerCase();
    const tags=[];
    if(/transform|translate|reflect|stretch|compress|asymptote|point/.test(text))tags.push('transformations');
    if(/inverse|one-to-one|restriction|domain|range|reverse/.test(text))tags.push('inverse functions');
    if(/compos|stage|process|then/.test(text))tags.push('composition');
    if(/interpret|model|sensor|temperature|currency|dose|cost|distance/.test(text))tags.push('modelling');
    return [...new Set(tags.length?tags:['core reasoning'])];
  };
  const inferHint=question=>{
    const text=`${question.prompt||''}`.toLowerCase();
    if(/point|coordinate/.test(text)&&/transform|under|maps/.test(text))return 'Let the base point be (u,v). Solve the transformed input for the new x-coordinate, then apply the outside rule to v.';
    if(/asymptote/.test(text))return 'Treat an asymptote location like a coordinate: vertical features use the input map; horizontal features use the output map.';
    if(/inverse/.test(text)&&/find|calculate|formula/.test(text))return 'Write y=f(x), swap x and y, solve for y, then state the exchanged domain and range.';
    if(/restriction|one-to-one/.test(text))return 'Use the horizontal line test and keep one monotonic branch. The chosen branch determines the sign of the square root.';
    if(/compos|stage|process|then/.test(text))return 'Evaluate the inner or first process completely before using its output in the next process.';
    if(/interpret|comment|explain/.test(text))return 'Name the input, output, units and domain restriction before stating the contextual conclusion.';
    if(/describe/.test(text))return 'Separate inside effects from outside effects; remember that horizontal scale is reciprocal.';
    return 'Write the governing rule, track inputs and outputs separately, then verify by substitution.';
  };
  const optionalGdcIds=new Set(['IBAI-2.5-P16','IBAI-2.5-P17','IBAI-2.5-P18','IBAI-2.5-P20','IBAI-2.5-P21']);
  const practice=legacy.practice.map(question=>({
    ...question,
    calculator:optionalGdcIds.has(question.id)?'GDC optional · verify exactly':'No GDC required',
    hint:question.hint||inferHint(question),
    tags:[...new Set([...(question.tags||[]),...inferTags(question)])]
  }));
  const quiz=legacy.quiz.map(question=>({
    ...question,
    calculator:'No GDC required',
    hint:question.hint||inferHint(question),
    tags:[...new Set([...(question.tags||[]),...inferTags(question)])]
  }));
  const exam=legacy.exam.map((task,index)=>({
    ...task,
    calculator:index===0?'GDC permitted · exact map required':'GDC expected · show verification'
  }));

  exam.push({
    id:'U2-2.5-T4',style:'Paper 2 · inverse graph and restriction',title:'A restricted height model',calculator:'GDC expected · algebraic branch required',total_marks:13,
    context:R`A camera records the height of an object using \\(h(t)=9-(t-4)^2\\), where only the descending stage \\(t\\ge4\\) is used and \\(4\\le t\\le7\\).`,
    parts:[
      {label:'a',prompt:'State the range of h on the restricted domain.',marks:2,answer:R`\\(0\\le h\\le9\\).`,markscheme:'M1 evaluate endpoints/monotonic branch; A1 ordered range.'},
      {label:'b',prompt:R`Find \\(h^{-1}(x)\\), including its domain and range.`,marks:5,answer:R`\\(h^{-1}(x)=4+\\sqrt{9-x}\\), domain \\(0\\le x\\le9\\), range \\(4\\le h^{-1}(x)\\le7\\).`,markscheme:'M1 swap; M1 isolate square; A1 select positive branch from t≥4; A1 formula; A1 sets.'},
      {label:'c',prompt:R`Use the TI‑84 to graph the restricted branch, its inverse and \\(y=x\\). Record two swapped point pairs.`,marks:3,answer:R`For example, \\((4,9)\\leftrightarrow(9,4)\\) and \\((7,0)\\leftrightarrow(0,7)\\).`,markscheme:'M1 suitable equations/window; A1 first pair; A1 second pair.'},
      {label:'d',prompt:R`Calculate and interpret \\(h^{-1}(5)\\).`,marks:3,answer:R`\\(h^{-1}(5)=4+2=6\\). On the descending stage, the object is at height 5 units at time 6 units.`,markscheme:'M1 substitution; A1 value; A1 interpretation with branch/context.'}
    ]
  });
  exam.push({
    id:'U2-2.5-T5',style:'Paper 2 · composition and reversal',title:'A calibrated measurement pipeline',calculator:'GDC expected · retain full precision',total_marks:14,
    context:R`A raw reading x is converted to metres by \\(g(x)=x/100\\), scaled by \\(f(u)=1.03u\\), and offset by \\(r(v)=v-0.2\\). The reported value is \\(P=r\\circ f\\circ g\\).`,
    parts:[
      {label:'a',prompt:'Write P(x) and simplify it.',marks:3,answer:R`\\(P(x)=1.03(x/100)-0.2=0.0103x-0.2\\).`,markscheme:'M1 correct order; M1 substitution; A1 simplified rule.'},
      {label:'b',prompt:R`Calculate \\(P(250)\\) and state the output unit.`,marks:2,answer:R`\\(P(250)=2.375\\) metres.`,markscheme:'M1 evaluation; A1 value and unit.'},
      {label:'c',prompt:R`Find \\(P^{-1}(y)\\) and describe the reverse stages in order.`,marks:4,answer:R`\\(P^{-1}(y)=\\dfrac{y+0.2}{0.0103}\\). Add 0.2, divide by 1.03, then multiply by 100.`,markscheme:'M1 reverse offset; M1 reverse scale; M1 reverse conversion; A1 formula/order.'},
      {label:'d',prompt:R`Use stored TI‑84 functions to verify \\(P^{-1}(P(250))\\).`,marks:2,answer:R`The result is 250 (up to calculator display precision).`,markscheme:'M1 stored/evaluated composition; A1 output.'},
      {label:'e',prompt:'Explain why rounding the reported value to one decimal place makes practical reversal less precise.',marks:3,answer:'Different raw readings can produce reported values that round to the same one-decimal value, so the recovered raw reading is an interval or estimate rather than a unique exact value.',markscheme:'R1 many-to-one after rounding; R1 consequence for inverse; R1 clear context.'}
    ]
  });

  window.LESSON_DATA={
    schemaVersion:'5.0.0',version:'5.0.0',buildDate:'2026-08-08',
    course:'IB Mathematics: Applications and Interpretation SL',
    unit:{number:2,title:'Functions'},
    lesson:{
      number:'2.5',slug:'transformations-composition-inverses',title:'Transformations, Composition, and Inverses',
      subtitle:'Exact coordinate maps, transformed graph features, one-to-one reversals, multi-stage processes and transparent TI-84 evidence.',
      syllabus_focus:'Translations, reflections, stretches and compressions; combined transformations; inverse functions with domain restrictions; composition as ordered process modelling; and technology-supported verification for IB Mathematics AI SL.',
      technology:'TI‑84 Plus CE is used selectively to overlay transformed graphs, verify inverse reflection in y=x and evaluate forward/reverse compositions. Every output is paired with exact point mapping, algebra or domain reasoning.',
      inquiry:'When can a process be reversed uniquely, and how can exact coordinate maps and calculator evidence establish that the forward and reverse models agree?',
      objectives:[
        'Describe and construct translations, reflections, stretches and compressions of familiar graphs.',
        'Apply the coordinate map for g(x)=a f(b(x-h))+k to points and key graph features.',
        'Determine transformed domain, range, intercepts, extrema and asymptotes accurately.',
        'Find and interpret inverse functions, including one-to-one restrictions and exchanged units.',
        'Use composition to model ordered multi-stage processes and reverse their order correctly.',
        'Use TI-84 evidence transparently and verify every graph or evaluation independently.'
      ],
      vocab:['translation','reflection','vertical stretch','horizontal compression','coordinate map','transformation','inverse relation','inverse function','one-to-one','horizontal line test','domain restriction','composition','identity','reverse process','fixed point'],
      skill_keys:['IBAI.U2.TRANSFORM','IBAI.U2.INVERSE','IBAI.U2.COMPOSITION'],
      teaching_blocks:[
        {code:'2.5A',title:'Single Transformations',estimated_classroom_time:'75–90 minutes'},
        {code:'2.5B',title:'Combined Transformations and Feature Mapping',estimated_classroom_time:'75–90 minutes'},
        {code:'2.5C',title:'Inverse Functions and Restrictions',estimated_classroom_time:'90–110 minutes'},
        {code:'2.5D',title:'Composition and Reverse Processes',estimated_classroom_time:'60–75 minutes'},
        {code:'2.5E',title:'TI-84 Evidence and IB Synthesis',estimated_classroom_time:'75–90 minutes'}
      ]
    },
    slides,practice,quiz,exam,
    review:{
      title:'Transformations, composition and inverse mastery',
      criteria:[
        'I can derive and use the exact coordinate map for a combined transformation.',
        'I can transform graph features and sets without sign or reciprocal errors.',
        'I can determine whether a function is one-to-one and choose a valid restriction.',
        'I can find, verify and interpret inverse functions with correct units.',
        'I can construct and reverse compositions in the correct order.',
        'I can use TI-84 evidence transparently and independently verify it.'
      ],
      transfer:'Use these coordinate, domain and reversal habits when analysing exponential, logarithmic, sinusoidal and financial models.'
    },
    counts:{slides:slides.length,practice:practice.length,quiz:quiz.length,exam:exam.length},
    rights:{student_content:'Original ECHS-authored instructional and assessment content; the existing verified public Practice Studio and quiz records are preserved and strengthened with tags, hints and calculator expectations.'},
    audit:{release:'5.0.0',learnScreenCount:slides.length,practiceCount:practice.length,quizCount:quiz.length,examTaskCount:exam.length,allVisualsPurposeBuilt:true,manualFirstTechnology:true,legacyAssessmentIdsPreserved:true,calculatorUseSelective:true,studentFacingDevelopmentLabels:false}
  };
  delete window.__ECHS_TCI5_BUILD;
})();
