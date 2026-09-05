(function(){
  "use strict";

  const base="lessons/ib-math-ai/unit-1/lessons/";
  const makeLesson=(number,title,slug,outcomes,release="5.3.0",learnSlides=36,practiceQuestions=52,quizQuestions=14,extendedTasks=3,skillKeys=["IBAI.U1.SEQUENCES","IBAI.U1.MODELING"])=>{
    const url=`${base}IB_AI_SL_${number}_${slug}_ECHS.html`;
    return {
      number,title,outcomes,url,status:"ready",new:true,
      lesson_key:`u1-${slug.replaceAll("_","-")}`,
      release,learnSlides,practiceQuestions,quizQuestions,extendedTasks,
      keywords:["ib","mathematics","applications","interpretation","number","algebra",number,slug.replaceAll("_","-")],
      skill_keys:skillKeys,
      resources:[
        {label:"Complete interactive lesson",url,type:"resource"},
        {label:`Practice Studio · ${practiceQuestions} questions`,url:`${url}#practice`,type:"practice"},
        {label:`IB-style assessment tasks · ${extendedTasks}`,url:`${url}#exam`,type:"assessment"}
      ]
    };
  };

  const unit={
    title:"Unit 1: Number and Algebra",
    description:"Six consolidated IB Mathematics: Applications and Interpretation SL lessons with coherent interactive teaching screens, transparent technology, four-level practice, IB tasks and mastery evidence.",
    portalSummary:"6 lessons · 402 purposeful Learn screens · 424 learning and practice questions · 56 quiz questions · 58 written tasks",
    release:"6.0.0",
    architectureNotes:[
      "Approximation, bounds and percentage error are consolidated in Lesson 1.1.",
      "Lesson 1.1 uses a scientific-notation-first merged route covering official SL 1.1 + SL 1.6, with relevant SL challenges after IB-style written tasks.",
      "Lesson 1.1 uses TI-Nspire CX / CX II procedures and guided calculator practice for scientific notation, accurate entry and guard digits.",
      "Lesson 1.4 remains merged with official SL 1.7: compound interest, depreciation, real value, loans, amortization and end-of-period annuities, with TI-Nspire guidance and IB-style written tasks.",
      "Lesson 1.5 is expanded into a definitive exponent-laws and logarithms pathway.",
      "Lesson 1.6 is rebuilt as a definitive technology, equations, systems, verification and modelling pathway."
    ],
    essential_questions:[
      "How can number and algebra models communicate scale, change, finance and uncertainty?",
      "How do additive and multiplicative structures support prediction and decision-making?",
      "How do logarithms invert multiplicative change and compress wide numerical scales?",
      "How should technology be used transparently to solve, verify and interpret models?",
      "How do precision, timing, assumptions and constraints affect the reliability of a conclusion?"
    ],
    lessons:[
      makeLesson("1.1","Scientific Notation, Approximation and Error","standard_form",[
        "Write, interpret and compare quantities in normalized scientific notation and across orders of magnitude.",
        "Calculate with powers of ten and units, using estimation and TI-Nspire procedures where technology adds value.",
        "Round to decimal places and significant figures while preserving meaningful zeros and guard digits.",
        "Construct direct and calculated bounds and quantify absolute and percentage error.",
        "Validate technology output and communicate scale, precision and uncertainty in context."
      ],"7.0.0",43,12,0,14,["IBAI.U1.NUMBER","IBAI.U1.MODELING"]),
      makeLesson("1.2","Arithmetic Sequences and Series","arithmetic_sequences",[
        "Distinguish sequence terms, series and partial sums using precise notation.",
        "Recognize and prove arithmetic structure through constant first differences.",
        "Move among recursive, explicit, tabular, graphical and contextual representations.",
        "Find terms, indices, parameters and finite arithmetic sums, including shifted sigma notation.",
        "Solve threshold and inverse problems with integer-domain checks.",
        "Evaluate assumptions, limitations and technology output in discrete linear models."
      ],"6.0.0",73,96,14,5),
      makeLesson("1.3","Geometric Sequences and Series","geometric_sequences",[
        "Distinguish additive change from multiplicative change using differences and ratios.",
        "Recognize positive, fractional and negative common ratios and describe their behaviour.",
        "Move among recursive, explicit, tabular, graphical and contextual representations.",
        "Find terms, indices, first terms and common ratios, including separated-term ambiguity.",
        "Use sigma notation and finite geometric-series formulas, including shifted sums.",
        "Solve growth, decay, inverse and threshold problems with adjacent-stage verification.",
        "Evaluate assumptions, saturation, precision and technology output in geometric models."
      ],"6.0.0",73,96,14,5),
      makeLesson("1.4","Financial Applications","financial_models",[
        "Model compound interest, annual depreciation and inflation-adjusted real value within SL 1.4.",
        "Match annual rates, compounding periods, payment timing and cash-flow signs in TI-Nspire Finance Solver.",
        "Use technology to solve for present value, future value, rate, duration and regular payments.",
        "Interpret amortization schedules, outstanding balances, total interest and final repayments.",
        "Model end-of-period savings and withdrawal annuities within SL 1.7.",
        "Communicate and justify solutions to original IB-style short, extended and challenging written questions."
],"8.0.0",67,28,0,24),
      makeLesson("1.5","Exponent Laws and Logarithms","logarithms",[
        "Simplify integer, zero, negative and rational exponents exactly and state necessary restrictions.",
        "Solve exponential equations using common bases, substitution, logarithms or graph intersection.",
        "Interpret logarithms as inverse exponents and use change of base.",
        "Apply logarithms to growth, decay, threshold and logarithmic-scale contexts.",
        "Verify technology output and interpret domain, units, discrete timing and model limitations."
      ],"6.0.0",73,96,14,5,["IBAI.U1.ALGEBRA","IBAI.U1.MODELING"]),
      makeLesson("1.6","Technology for Equations and Systems","technology_equations",[
        "Use polynomial-root, graph-intersection and numerical-solver technology to find all relevant real solutions.",
        "Solve and classify two-variable systems and connect common solutions with graph intersections.",
        "Solve three-variable systems while preserving variable order and zero coefficients.",
        "Determine model parameters from independent data conditions.",
        "Verify roots and system solutions using substitution, residuals, factorization or a second representation.",
        "Interpret domain, units, precision, integrality, non-negativity and model limitations."
      ],"6.0.0",73,96,14,5,["IBAI.U1.ALGEBRA","IBAI.U1.MATRICES","IBAI.U1.MODELING"])
    ]
  };

  const upsertFullNotes=(number,items)=>{
    const lesson=unit.lessons.find(value=>value.number===number);
    if(!lesson)return;
    lesson.resources=Array.isArray(lesson.resources)?lesson.resources:[];
    const urls=new Set(items.map(item=>item.url));
    lesson.resources=lesson.resources.filter(resource=>!resource||!urls.has(resource.url));
    lesson.resources.splice(1,0,...items);
  };

  upsertFullNotes("1.1",[
    {label:"Companion Notes 1.1 · Earlier Edition",url:"notes/ib-math-ai/unit-1/IB_AI_SL_1.1_Scientific_Notation_Approximation_and_Error_Full_Notes_Student.html",type:"notes"},
    {label:"Companion Notes 1.1 · Earlier PDF Edition",url:"notes/ib-math-ai/unit-1/IB_AI_SL_1.1_Scientific_Notation_Approximation_and_Error_Full_Notes_Student.pdf",type:"notes"}
  ]);
  upsertFullNotes("1.2",[
    {label:"Full Notes 1.2 · Lesson-Synchronised Edition",url:"notes/ib-math-ai/unit-1/IB_AI_SL_1.2_Arithmetic_Sequences_Full_Notes_Student.html",type:"notes"},
    {label:"Full Notes 1.2 · Original Coloured LaTeX PDF",url:"notes/ib-math-ai/unit-1/IB_AI_SL_1.2_Arithmetic_Sequences_Full_Notes_Student.pdf",type:"notes"}
  ]);
  upsertFullNotes("1.3",[
    {label:"Full Notes 1.3 · Lesson-Synchronised Edition",url:"notes/ib-math-ai/unit-1/IB_AI_SL_1.3_Geometric_Sequences_Full_Notes_Student.html",type:"notes"},
    {label:"Full Notes 1.3 · Original Coloured LaTeX PDF",url:"notes/ib-math-ai/unit-1/IB_AI_SL_1.3_Geometric_Sequences_Full_Notes_Student.pdf",type:"notes"}
  ]);
  upsertFullNotes("1.5",[
    {label:"Full Notes 1.5 · Lesson-Synchronised Edition",url:"notes/ib-math-ai/unit-1/IB_AI_SL_1.5_Exponent_Laws_and_Logarithms_Full_Notes_Student.html",type:"notes"},
    {label:"Full Notes 1.5 · Original Coloured LaTeX PDF",url:"notes/ib-math-ai/unit-1/IB_AI_SL_1.5_Exponent_Laws_and_Logarithms_Full_Notes_Student.pdf",type:"notes"}
  ]);
  upsertFullNotes("1.6",[
    {label:"Full Notes 1.6 · Lesson-Synchronised Edition",url:"notes/ib-math-ai/unit-1/IB_AI_SL_1.6_Technology_for_Equations_and_Systems_Full_Notes_Student.html",type:"notes"},
    {label:"Full Notes 1.6 · Original Coloured LaTeX PDF",url:"notes/ib-math-ai/unit-1/IB_AI_SL_1.6_Technology_for_Equations_and_Systems_Full_Notes_Student.pdf",type:"notes"}
  ]);


  const lesson11=unit.lessons.find(lesson=>lesson.number==="1.1");
  if(lesson11){
    lesson11.organization_release="7.0.0";
    lesson11.defaultScope="IB SL Core";
    lesson11.allContentAvailable=false;
    lesson11.officialCoreSections=[{code:"SL 1.1",title:"Scientific notation"},{code:"SL 1.6",title:"Approximation, bounds, percentage error and estimation"}];
    lesson11.scopeCounts={learn:{core:43,all:43},practice:{core:12,all:12},quiz:{core:0,all:0},tasks:{core:14,all:14}};
    lesson11.calculator={classroom:true,model:"TI-Nspire CX / CX II",mode:"guided calculator practice",externalDependency:false,workflows:["scientific entry","Auto and decimal approximation","brackets and guard digits","percentage error"]};
    lesson11.assessment={learningChecks:12,shortResponseTasks:8,extendedResponseTasks:3,challengeTasks:3,writtenParts:46,writtenMarks:82};
    lesson11.resources[1].label="Learning checks and IB-style written practice";
    lesson11.resources[2].label="IB-style written tasks · 14";
  }

  const financialLesson=unit.lessons.find(lesson=>lesson.number==="1.4");
  if(financialLesson){
    financialLesson.organization_release="8.0.0";
    financialLesson.organization="one merged lesson with seven teaching blocks";
    financialLesson.scope_release="8.0.0";
    financialLesson.defaultScope="IB SL Core";
    financialLesson.allContentAvailable=false;
    financialLesson.officialCoreSections=[{code:"SL 1.4",title:"Compound interest, annual depreciation and real value"},{code:"SL 1.7",title:"Amortization and annuities using technology"}];
    financialLesson.scopeNote="Merged SL 1.4 + SL 1.7 with end-of-period payments; all challenges stay within the combined SL scope.";
    financialLesson.scopeCounts={learn:{core:67,all:67},practice:{core:28,all:28},quiz:{core:0,all:0},tasks:{core:24,all:24}};
    financialLesson.calculator={model:"TI-Nspire CX / CX II",mode:"guided calculator practice",externalDependency:false};
    financialLesson.assessment={learningChecks:28,shortResponseTasks:12,extendedResponseTasks:8,challengeTasks:4,writtenParts:60,writtenMarks:139};
    financialLesson.resources=[
      {label:"Complete interactive lesson · SL 1.4 + SL 1.7",url:financialLesson.url,type:"resource"},
      {label:"Student notes · print the merged lesson",url:financialLesson.url,type:"notes"},
      {label:"Learning checks and IB-style written practice",url:financialLesson.url+"#practice",type:"practice"},
      {label:"IB-style written tasks · 24",url:financialLesson.url+"#exam",type:"assessment"}
    ];
    financialLesson.teachingBlocks=[{code:"1.4A",title:"Percentage Factors and Compound Growth",estimatedClassroomTime:"60–75 minutes"},
{code:"1.4B",title:"Compounding, Missing Values and Thresholds",estimatedClassroomTime:"60–75 minutes"},
{code:"1.4C",title:"Depreciation, Inflation and Real Value",estimatedClassroomTime:"60–75 minutes"},
{code:"1.4D",title:"Loan Repayments and Total Interest",estimatedClassroomTime:"60–75 minutes"},
{code:"1.4E",title:"Amortization and Outstanding Balances",estimatedClassroomTime:"60–75 minutes"},
{code:"1.4F",title:"End-of-Period Annuities",estimatedClassroomTime:"60–75 minutes"},
{code:"1.4G",title:"IB-Style Written Practice and Review",estimatedClassroomTime:"60–75 minutes"}];
  }

  const logarithmLesson=unit.lessons.find(lesson=>lesson.number==="1.5");
  if(logarithmLesson){
    logarithmLesson.organization_release="6.1.0";
    logarithmLesson.organization="one lesson with four internal teaching blocks";
    logarithmLesson.teachingBlocks=[
      {code:"1.5A",title:"Exponent Laws and Exact Powers",estimatedClassroomTime:"60–75 minutes"},
      {code:"1.5B",title:"Exponential Equations and Common Bases",estimatedClassroomTime:"60–75 minutes"},
      {code:"1.5C",title:"Logarithms and Model Inversion",estimatedClassroomTime:"60–75 minutes"},
      {code:"1.5D",title:"Logarithmic Scales, Modelling and Mastery",estimatedClassroomTime:"60–75 minutes"}
    ];
  }

  const technologyLesson=unit.lessons.find(lesson=>lesson.number==="1.6");
  if(technologyLesson){
    technologyLesson.organization_release="6.1.0";
    technologyLesson.organization="one lesson with four internal teaching blocks";
    technologyLesson.officialSection={code:"SL 1.8",title:"Use of technology to solve systems of linear equations in up to three variables and polynomial equations"};
    technologyLesson.teachingBlocks=[
      {code:"1.6A",title:"Two-Variable Systems and Classification",estimatedClassroomTime:"60–75 minutes"},
      {code:"1.6B",title:"Three Variables, Parameter Fitting and Feasibility",estimatedClassroomTime:"60–75 minutes"},
      {code:"1.6C",title:"Polynomial Roots, Intersections and Numerical Solving",estimatedClassroomTime:"60–75 minutes"},
      {code:"1.6D",title:"Verification, Constraints, Modelling and Mastery",estimatedClassroomTime:"60–75 minutes"}
    ];
  }

  window.ECHS_IB_MATH_AI_UNIT_1=unit;
  if(!Array.isArray(window.ECHS_COURSES))return;

  const normalize=value=>String(value||"").toLowerCase().replace(/[–—−]/g,"-").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  const isIB=course=>{
    if(!course)return false;
    const values=[course.id,course.course,course.title,course.shortTitle].map(normalize);
    return values.includes("g11-ib-ai")||values.includes("ib-math-ai")||values.some(value=>value.includes("ib-mathematics-applications-and-interpretation")||value.includes("ib-math-ai"));
  };

  let index=window.ECHS_COURSES.findIndex(course=>normalize(course?.id)==="g11-ib-ai");
  if(index<0)index=window.ECHS_COURSES.findIndex(isIB);
  if(index<0){console.error("Canonical G11 IB Mathematics AI course was not found");return;}

  const course=window.ECHS_COURSES[index];
  window.ECHS_COURSES=window.ECHS_COURSES.filter((candidate,candidateIndex)=>candidateIndex===index||!isIB(candidate));
  course.id="g11-ib-ai";
  course.grade="G11";
  course.title="G11 IB Mathematics: Applications and Interpretation";
  course.shortTitle="IB Math AI";
  course.course=course.title;
  if(!Array.isArray(course.units))course.units=[];
  const unitIndex=course.units.findIndex((value,valueIndex)=>valueIndex===0||/^unit\s*1(?:\s*:|\b)/i.test(String(value?.title||"")));
  if(unitIndex>=0)course.units[unitIndex]=unit;else course.units.unshift(unit);
  course.unitCount=course.units.length;
  course.lessonCount=course.units.reduce((total,value)=>total+(Array.isArray(value?.lessons)?value.lessons.length:0),0);
  course.status="Started";
  course.updatedUnits="Unit 1 · Lesson 1.1 merged SL 1.1 + SL 1.6 with TI-Nspire guidance · Lesson 1.4 + 1.7 merged financial applications · Lessons 1.5 and 1.6 definitive pathways";
  window.dispatchEvent(new CustomEvent("echs:ib-ai-unit-ready",{detail:{courseId:course.id,unit:1,lessons:unit.lessons.length,release:unit.release}}));
})();
