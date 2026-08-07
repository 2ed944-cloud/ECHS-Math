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
    description:"Six consolidated IB Mathematics: Applications and Interpretation SL lessons with coherent AP-style teaching screens, transparent technology, four-level practice, IB tasks and mastery evidence.",
    portalSummary:"6 lessons · 471 purposeful Learn screens · 600 studio questions · 86 quiz questions · 31 extended tasks",
    release:"6.0.0",
    architectureNotes:[
      "Approximation, bounds and percentage error are consolidated in Lesson 1.1.",
      "Lesson 1.1 uses a scientific-notation-first core route; number-set review remains available without being presented as required classroom content.",
      "Lesson 1.1 uses the same real TI-84 Plus CE online simulator pattern as Lesson 1.4, paired with lesson-specific EE, SCI/NORMAL and guard-digit training.",
      "Financial applications, loans, annuities and amortization remain consolidated in Lesson 1.4, with the current IB SL core shown by default and broader reference-supported applications available as extension.",
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
        "Calculate with powers of ten and units, using estimation and the TI-84 only where technology adds value.",
        "Round to decimal places and significant figures while preserving meaningful zeros and guard digits.",
        "Construct direct and calculated bounds and quantify absolute and percentage error.",
        "Validate technology output and communicate scale, precision and uncertainty in context."
      ],"6.9.0",79,96,14,5,["IBAI.U1.NUMBER","IBAI.U1.MODELING"]),
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
        "Use repeated percentage change for compound interest and annual reducing-balance depreciation.",
        "Convert nominal annual rates to the periodic rate and number of periods required by a financial model.",
        "Use financial technology transparently to calculate loan repayments, total repayment and total interest.",
        "Interpret amortization by separating the interest and principal portions of each repayment.",
        "Compare loan options using payment size, total interest and affordability.",
        "Access annuities, mixed deposits, withdrawal funds, inflation, real value and advanced balances as clearly labelled extensions after core mastery."
      ],"6.0.0",100,120,16,6),
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

  const lesson12=unit.lessons.find(lesson=>lesson.number==="1.2");
if(lesson12){
  const fullNotesUrl="notes/ib-math-ai/unit-1/IB_AI_SL_1.2_Arithmetic_Sequences_Full_Notes_Student.html";
  lesson12.resources=Array.isArray(lesson12.resources)?lesson12.resources:[];
  if(!lesson12.resources.some(resource=>resource&&resource.url===fullNotesUrl)){
    lesson12.resources.splice(1,0,{label:"Full Notes 1.2 · Coloured LaTeX",url:fullNotesUrl,type:"notes"});
  }
}

  const lesson13=unit.lessons.find(lesson=>lesson.number==="1.3");
  if(lesson13){
    const fullNotesUrl="notes/ib-math-ai/unit-1/IB_AI_SL_1.3_Geometric_Sequences_Full_Notes_Student.html";
    lesson13.resources=Array.isArray(lesson13.resources)?lesson13.resources:[];
    if(!lesson13.resources.some(resource=>resource&&resource.url===fullNotesUrl)){
      lesson13.resources.splice(1,0,{label:"Full Notes 1.3 · Coloured LaTeX",url:fullNotesUrl,type:"notes"});
    }
  }

  const lesson11=unit.lessons.find(lesson=>lesson.number==="1.1");
  if(lesson11){
    lesson11.organization_release="6.9.0";
    lesson11.defaultScope="IB SL Core";
    lesson11.allContentAvailable=true;
    lesson11.scopeCounts={learn:{core:70,all:79},practice:{core:88,all:96},quiz:{core:12,all:14},tasks:{core:4,all:5}};
    lesson11.calculator={classroom:true,model:"TI-84 Plus CE",simulator:"real TI-84 Plus CE online simulator",provider:"ti84calc.com",externalDependency:true,lazyLoaded:true,sandboxed:true,workflows:["EE entry","SCI/NORMAL","brackets and guard digits"]};
  }

  const financialLesson=unit.lessons.find(lesson=>lesson.number==="1.4");
  if(financialLesson){
    financialLesson.organization_release="6.1.0";
    financialLesson.organization="one lesson with seven internal teaching blocks";
    financialLesson.scope_release="6.2.0";
    financialLesson.defaultScope="IB SL Core";
    financialLesson.allContentAvailable=true;
    financialLesson.officialCoreSections=[
      {code:"SL 1.4",title:"Financial applications of geometric sequences and series — compound interest and annual depreciation"},
      {code:"SL 1.7",title:"Loan repayments and amortization"}
    ];
    financialLesson.scopeNote="The complete 100-screen collection remains available; the default route skips clearly labelled reference-supported extensions until the learner selects All content.";
    financialLesson.teachingBlocks=[
      {code:"1.4A",title:"Percentage Change and Financial Growth",estimatedClassroomTime:"60–75 minutes"},
      {code:"1.4B",title:"Compounding and Rate Conventions",estimatedClassroomTime:"60–75 minutes"},
      {code:"1.4C",title:"Depreciation, Inflation and Real Value",estimatedClassroomTime:"60–75 minutes"},
      {code:"1.4D",title:"Regular Deposits and Savings",estimatedClassroomTime:"60–75 minutes"},
      {code:"1.4E",title:"Loans and Repayment",estimatedClassroomTime:"60–75 minutes"},
      {code:"1.4F",title:"Financial Decision Making",estimatedClassroomTime:"60–75 minutes"},
      {code:"1.4G",title:"Mastery and Mixed Financial Applications",estimatedClassroomTime:"60–75 minutes"}
    ];
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
  course.updatedUnits="Unit 1 · Lesson 1.1 scientific notation with real TI-84 Plus CE simulator · Lesson 1.4 core-first finance · Lessons 1.5 and 1.6 definitive pathways";
  window.dispatchEvent(new CustomEvent("echs:ib-ai-unit-ready",{detail:{courseId:course.id,unit:1,lessons:unit.lessons.length,release:unit.release}}));
})();
