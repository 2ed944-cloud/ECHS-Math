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
    description:"Six consolidated IB Mathematics: Applications and Interpretation SL lessons with coherent AP-style teaching screens, transparent technology, four-level practice, IB tasks and mastery evidence.",
    portalSummary:"6 lessons · 434 purposeful Learn screens · 556 studio questions · 86 quiz questions · 29 extended tasks",
    release:"6.0.0",
    architectureNotes:[
      "Approximation, bounds and percentage error are consolidated in Lesson 1.1.",
      "Financial applications, loans, annuities and amortization are consolidated in Lesson 1.4.",
      "Lesson 1.5 is expanded into a definitive exponent-laws and logarithms pathway.",
      "Technology for Equations and Systems is renumbered as Lesson 1.6."
    ],
    essential_questions:[
      "How can number and algebra models communicate scale, change, finance and uncertainty?",
      "How do additive and multiplicative structures support prediction and decision-making?",
      "How do logarithms invert multiplicative change and compress wide numerical scales?",
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
        "Distinguish fixed monetary change from fixed percentage change.",
        "Use nominal, periodic and effective rates with consistent time units.",
        "Calculate compound growth, depreciation, inflation and real value.",
        "Model ordinary annuities, annuities due, mixed deposits and withdrawal funds.",
        "Calculate loan payments, total interest and outstanding balances.",
        "Construct amortization evidence and compare repayment strategies.",
        "Evaluate financial decisions using timing, fees, inflation, sensitivity and risk."
      ],"6.0.0",100,120,16,6),
      makeLesson("1.5","Exponent Laws and Logarithms","logarithms",[
        "Simplify integer, zero, negative and rational exponents exactly and state necessary restrictions.",
        "Solve exponential equations using common bases, substitution, logarithms or graph intersection.",
        "Interpret logarithms as inverse exponents and use change of base.",
        "Apply logarithms to growth, decay, threshold and logarithmic-scale contexts.",
        "Verify technology output and interpret domain, units, discrete timing and model limitations."
      ],"6.0.0",73,96,14,5,["IBAI.U1.ALGEBRA","IBAI.U1.MODELING"]),
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
    financialLesson.organization_release="6.1.0";
    financialLesson.organization="one lesson with seven internal teaching blocks";
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
  course.updatedUnits="Unit 1 · six-lesson architecture · Lessons 1.4 and 1.5 organized into internal teaching blocks";
  window.dispatchEvent(new CustomEvent("echs:ib-ai-unit-ready",{detail:{courseId:course.id,unit:1,lessons:unit.lessons.length,release:unit.release}}));
})();
