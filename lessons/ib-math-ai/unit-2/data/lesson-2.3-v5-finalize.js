(function(){
  'use strict';
  const build=window.__ECHS_PR5_BUILD;
  if(!build||!Array.isArray(build.slides))throw new Error('Lesson 2.3 v5 slide builder is missing.');
  const {slides}=build;
  if(slides.length!==80)throw new Error(`Lesson 2.3 v5 expected 80 Learn screens, received ${slides.length}.`);
  window.LESSON_DATA={
    schemaVersion:'5.0.0',version:'5.0.0',buildDate:'2026-08-08',
    course:'IB Mathematics: Applications and Interpretation SL',
    unit:{number:2,title:'Functions'},
    lesson:{
      number:'2.3',slug:'polynomial-rational-models',title:'Polynomial and Rational Models',
      subtitle:'Polynomial structure, rational asymptotes, variation, regression, TI-84 evidence and model validation.',
      syllabus_focus:'Polynomial and rational behaviour, degree, zeros, multiplicity, inequalities, regression, asymptotes, direct and inverse variation, power models and technology-supported validation for IB Mathematics AI SL.',
      technology:'TI-84 Plus CE is used for Zero, Minimum/Maximum, CubicReg, PwrReg, Intersect and TABLE when technology adds genuine evidence. Algebraic structure and independent verification remain compulsory.',
      inquiry:'How do algebraic structure, graph behaviour, data evidence and contextual restrictions work together to select and defend a polynomial, rational or power model?',
      objectives:[
        'Use degree and leading coefficient to determine polynomial end behaviour and audit turning points.',
        'Connect zeros, factors, multiplicity, intercept behaviour and polynomial inequalities.',
        'Fit and evaluate polynomial models using finite differences, regression, residuals and contextual evidence.',
        'Determine rational domains, holes, intercepts and asymptotes and interpret them in context.',
        'Recognize and model direct, inverse and power variation, including power regression.',
        'Use TI-84 workflows transparently, verify each output and communicate a defensible IB conclusion.'
      ],
      vocab:['polynomial','degree','leading coefficient','end behaviour','turning point','zero','factor','multiplicity','residual','cubic regression','rational function','excluded input','hole','vertical asymptote','horizontal asymptote','direct variation','inverse variation','power regression','interpolation','extrapolation'],
      skill_keys:['IBAI.U2.POLY_RATIONAL'],
      teaching_blocks:[
        {code:'2.3A',title:'Polynomial Structure and End Behaviour',estimated_classroom_time:'75–90 minutes'},
        {code:'2.3B',title:'Zeros, Factors, Multiplicity and Sign',estimated_classroom_time:'75–90 minutes'},
        {code:'2.3C',title:'Polynomial Models and Regression',estimated_classroom_time:'75–90 minutes'},
        {code:'2.3D',title:'Rational Structure, Domain and Asymptotes',estimated_classroom_time:'75–90 minutes'},
        {code:'2.3E',title:'Direct, Inverse and Power Variation',estimated_classroom_time:'60–75 minutes'},
        {code:'2.3F',title:'TI-84 Evidence, Validation and IB Synthesis',estimated_classroom_time:'75–90 minutes'}
      ]
    },
    slides,practice:[],quiz:[],exam:[],
    review:{
      title:'Polynomial and rational modelling mastery',
      criteria:[
        'I can determine polynomial end behaviour and turning-point limits from degree and leading coefficient.',
        'I can connect factors and multiplicity to zeros, graph behaviour and inequality signs.',
        'I can fit and evaluate polynomial regression models using residual evidence.',
        'I can distinguish holes, excluded inputs and vertical/horizontal asymptotes.',
        'I can build and interpret direct, inverse and power models with units and domain.',
        'I can use TI-84 workflows transparently and verify every reported result.'
      ],
      transfer:'Use the model-selection and validation habits from this lesson when comparing exponential, logarithmic and other non-linear models.'
    },
    counts:{slides:slides.length,practice:0,quiz:0,exam:0},
    rights:{student_content:'Original ECHS-authored instructional and assessment content informed by the IB Mathematics AI curriculum, supplied reference scope and official calculator guidance.'},
    audit:{release:'5.0.0',learnScreenCount:slides.length,allVisualsPurposeBuilt:true,manualFirstTechnology:true,sourceScopeReviewed:true,studentFacingDevelopmentLabels:false}
  };
  delete window.__ECHS_PR5_BUILD;
})();
