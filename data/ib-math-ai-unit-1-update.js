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
        {label:`Complete interactive lesson · v${release}`,url,type:"resource"},
        {label:`Practice Studio · ${practiceQuestions} questions`,url:`${url}#practice`,type:"practice"},
        {label:`IB-style assessment tasks · ${extendedTasks}`,url:`${url}#exam`,type:"assessment"}
      ]
    };
  };

  const unit={
    title:"Unit 1: Number and Algebra",
    description:"Six consolidated IB Mathematics: Applications and Interpretation SL lessons with a core-first learning path, transparent technology, levelled practice, IB tasks and optional extensions.",
    portalSummary:"6 lessons · 328 core Learn screens · 432 core studio questions · 80 core quiz questions · 24 core tasks",
    release:"6.2.0",
    architectureNotes:[
      "Approximation, bounds and percentage error are consolidated in Lesson 1.1.",
      "Lesson 1.4 opens with the current IB SL core—compound interest and annual depreciation—while broader financial applications remain optional in the same lesson.",
      "Technology for Equations and Systems is renumbered as Lesson 1.6."
    ],
    essential_questions:[
      "How can number and algebra models communicate scale, change, finance and uncertainty?",
      "How do additive and multiplicative structures support prediction and decision-making?",
      "How should technology be used transparently to solve, verify and interpret models?",
      "How do precision, timing, assumptions and constraints affect the reliability of a conclusion?"
    ],
    lessons:[
      makeLesson("1.1","Number Foundations, Scientific Notation and Approximation","standard_form",[
        "Classify exact values in the smallest appropriate number set from natural to complex numbers.",
        "Round to decimal places and significant figures while preserving meaningful zeros.",
        "Construct direct and calculated bounds and quantify absolute and percentage error.",
        "Calculate with normalized scientific notation, units and orders of magnitude.",
        "Validate technology output with estimation, uncertainty and contextual interpretation."
      ],"6.0.0",79,96,14,5,["IBAI.U1.NUMBER","IBAI.U1.MODELING"]),
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
        "Translate percentage increase and decrease into multiplicative factors.",
        "Model annual and non-annual compound interest with consistent periods.",
        "Use technology transparently after identifying the model and settings.",
        "Solve first-completed-period growth questions with adjacent-period checks.",
        "Model annual reducing-balance depreciation and replacement thresholds.",
        "Interpret currency, time, assumptions and reasonableness in context."
      ],"6.2.0",31,40,10,3),
      makeLesson("1.5","Exponent Laws and Logarithms","logarithms",[
        "Simplify zero, negative and rational exponents.",
        "Solve exponential equations exactly or logarithmically.",
        "Interpret logarithms as inverse exponents.",
        "Apply domain and model checks."
      ],"5.3.0",36,52,14,3,["IBAI.U1.ALGEBRA","IBAI.U1.MODELING"]),
      makeLesson("1.6","Technology for Equations and Systems","technology_equations",[
        "Model and solve two- and three-variable systems.",
        "Classify unique, inconsistent and dependent systems.",
        "Determine model parameters from conditions.",
        "Verify numerical roots and intersections using substitution, residuals and constraints."
      ],"5.3.3-renumbered",36,52,14,3,["IBAI.U1.ALGEBRA","IBAI.U1.MATRICES","IBAI.U1.MODELING"])
    ]
  };

  const financialLesson=unit.lessons.find(lesson=>lesson.number==="1.4");
  if(financialLesson){
    financialLesson.organizationRelease="6.2.0";
    financialLesson.organization="IB SL core-first path with optional broader financial applications";
    financialLesson.syllabusCore="SL 1.4 — financial applications: compound interest and annual depreciation";
    financialLesson.coreLearnSlides=31;
    financialLesson.corePracticeQuestions=40;
    financialLesson.coreQuizQuestions=10;
    financialLesson.coreExtendedTasks=3;
    financialLesson.preservedUniqueLearnSlides=100;
    financialLesson.extensionLearnSlides=71;
    financialLesson.extensionPracticeQuestions=80;
    financialLesson.extensionQuizQuestions=12;
    financialLesson.extensionExtendedTasks=6;
    financialLesson.extensionUrl=`${financialLesson.url}?scope=extension#learn`;
    financialLesson.teachingBlocks=[
      {code:"1.4A",title:"Percentage Change and Compound Growth",estimatedClassroomTime:"60–75 minutes",scope:"core"},
      {code:"1.4B",title:"Compounding Conventions and Completed Periods",estimatedClassroomTime:"60–75 minutes",scope:"core"},
      {code:"1.4C",title:"Annual Depreciation",estimatedClassroomTime:"60–75 minutes",scope:"core"},
      {code:"1.4D",title:"Technology and Core Mastery",estimatedClassroomTime:"45–60 minutes",scope:"core"},
      {code:"1.4E",title:"Broader Financial Context and Real Value",estimatedClassroomTime:"Optional · 60–75 minutes",scope:"extension"},
      {code:"1.4F",title:"Savings, Annuities and Loans",estimatedClassroomTime:"Optional · 75–90 minutes",scope:"extension"},
      {code:"1.4G",title:"Amortization, Decisions and Enrichment",estimatedClassroomTime:"Optional · 75–90 minutes",scope:"extension"}
    ];
    financialLesson.resources=[
      {label:"IB SL Core lesson · 31 screens",url:financialLesson.url,type:"resource"},
      {label:"IB SL Core Practice · 40 questions",url:`${financialLesson.url}#practice`,type:"practice"},
      {label:"IB SL Core assessment tasks · 3",url:`${financialLesson.url}#exam`,type:"assessment"},
      {label:"Optional broader financial applications",url:financialLesson.extensionUrl,type:"resource"}
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
  course.updatedUnits="Unit 1 · six-lesson architecture · Lesson 1.4 aligned to the current IB SL core with optional extensions";
  window.dispatchEvent(new CustomEvent("echs:ib-ai-unit-ready",{detail:{courseId:course.id,unit:1,lessons:unit.lessons.length,release:unit.release}}));
})();
