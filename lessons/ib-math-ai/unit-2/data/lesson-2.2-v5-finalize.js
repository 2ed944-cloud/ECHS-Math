(function(){
  'use strict';
  const build=window.__ECHS_LQ5_BUILD;
  if(!build||!Array.isArray(build.slides))throw new Error('Lesson 2.2 v5 slide builder is missing.');
  const {slides}=build;
  if(slides.length!==80)throw new Error(`Lesson 2.2 v5 expected 80 Learn screens, received ${slides.length}.`);
  window.LESSON_DATA={
    schemaVersion:'5.0.0',
    version:'5.0.0',
    buildDate:'2026-08-07',
    course:'IB Mathematics: Applications and Interpretation SL',
    unit:{number:2,title:'Functions'},
    lesson:{
      number:'2.2',
      slug:'linear-quadratic-models',
      title:'Linear and Quadratic Models',
      subtitle:'Rates, lines, quadratic structure, construction, TI-84 evidence and model validation.',
      syllabus_focus:'Straight lines, linear and quadratic models, graph features, intersections, extrema, modelling, technology and contextual evaluation for IB Mathematics AI SL.',
      technology:'TI-84 Plus CE is used for Zero, Minimum, Maximum, Intersect and TABLE when technology adds genuine evidence. Manual structure and independent verification remain compulsory.',
      inquiry:'When is a constant-rate line sufficient, when is curvature required, and what evidence makes a model defensible?',
      objectives:[
        'Construct and interpret linear models from rates, points, tables and contexts.',
        'Use parallel, perpendicular and intersection reasoning with contextual restrictions.',
        'Connect standard, factored and vertex forms to roots, intercepts, symmetry and extrema.',
        'Construct quadratic models from roots, a vertex, points and applied contexts.',
        'Use TI-84 Zero, Minimum, Maximum, Intersect and TABLE transparently and verify every output.',
        'Choose and evaluate a model using differences, residuals, assumptions, domain and extrapolation risk.'
      ],
      vocab:['gradient','rate of change','intercept','parallel','perpendicular','break-even','quadratic','root','axis of symmetry','vertex','discriminant','residual','interpolation','extrapolation','contextual domain'],
      skill_keys:['IBAI.U2.LINEAR_QUADRATIC'],
      teaching_blocks:[
        {code:'2.2A',title:'Linear Models and Constant Rate',estimated_classroom_time:'75–90 minutes'},
        {code:'2.2B',title:'Line Relationships and Decisions',estimated_classroom_time:'60–75 minutes'},
        {code:'2.2C',title:'Quadratic Structure and Exact Features',estimated_classroom_time:'75–90 minutes'},
        {code:'2.2D',title:'Constructing Quadratic Models',estimated_classroom_time:'75–90 minutes'},
        {code:'2.2E',title:'Solving and TI-84 Evidence',estimated_classroom_time:'75–90 minutes'},
        {code:'2.2F',title:'Model Choice, Validation and IB Synthesis',estimated_classroom_time:'75–90 minutes'}
      ]
    },
    slides,
    practice:[],
    quiz:[],
    exam:[],
    review:{
      title:'Linear and quadratic modelling mastery',
      criteria:[
        'I can construct and interpret a linear model from a rate, points, a table or a context.',
        'I can use line relationships and intersections with appropriate restrictions.',
        'I can move among standard, factored and vertex forms and read quadratic features accurately.',
        'I can construct a quadratic model from the information provided.',
        'I can use the TI-84 transparently and verify the result independently.',
        'I can choose and evaluate a model using differences, residuals, domain and assumptions.'
      ],
      transfer:'Use the language of roots, multiplicity and end behaviour to prepare for polynomial and rational models in Lesson 2.3.'
    },
    counts:{slides:slides.length,practice:0,quiz:0,exam:0},
    rights:{student_content:'Original ECHS-authored instructional and assessment content informed by the IB Mathematics AI curriculum and official calculator guidance.'},
    audit:{release:'5.0.0',learnScreenCount:slides.length,allVisualsPurposeBuilt:true,manualFirstTechnology:true,studentFacingDevelopmentLabels:false}
  };
  delete window.__ECHS_LQ5_BUILD;
})();
