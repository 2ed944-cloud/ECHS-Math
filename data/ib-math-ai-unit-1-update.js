(function(){
  "use strict";

  const base="lessons/ib-math-ai/unit-1/lessons/";
  const makeLesson=(number,title,slug,outcomes,release="5.3.0",learnSlides=36,practiceQuestions=52,quizQuestions=14,extendedTasks=3)=>{
    const url=`${base}IB_AI_SL_${number}_${slug}_ECHS.html`;
    return {
      number,title,outcomes,url,status:"ready",new:true,
      lesson_key:`u1-${slug.replaceAll("_","-")}`,
      release,learnSlides,practiceQuestions,quizQuestions,extendedTasks,
      keywords:["ib","mathematics","applications","interpretation","number","algebra",number,slug.replaceAll("_","-")],
      skill_keys:number==="1.1"||number==="1.6"?["IBAI.U1.NUMBER","IBAI.U1.MODELING"]:
        number==="1.8"?["IBAI.U1.ALGEBRA","IBAI.U1.MATRICES","IBAI.U1.MODELING"]:
        number==="1.5"?["IBAI.U1.ALGEBRA","IBAI.U1.MODELING"]:["IBAI.U1.SEQUENCES","IBAI.U1.MODELING"],
      resources:[
        {label:`Complete interactive lesson · v${release}`,url,type:"resource"},
        {label:`Practice Studio · ${practiceQuestions} questions`,url:`${url}#practice`,type:"practice"},
        {label:`IB-style assessment tasks · ${extendedTasks}`,url:`${url}#exam`,type:"assessment"}
      ]
    };
  };

  const unit={
    title:"Unit 1: Number and Algebra",
    description:"Eight classroom-ready IB Mathematics: Applications and Interpretation SL lessons with coherent AP-style teaching screens, transparent technology, four-level practice, IB tasks and mastery evidence.",
    portalSummary:"8 lessons · 331 purposeful Learn screens · 460 studio questions · 112 quiz questions · 26 extended tasks",
    release:"5.3.1",
    essential_questions:[
      "How can number and algebra models communicate scale, change, finance and uncertainty?",
      "How do additive and multiplicative structures support prediction and decision-making?",
      "How should technology be used transparently to solve, verify and interpret models?",
      "How do precision, assumptions and constraints affect the reliability of a conclusion?"
    ],
    lessons:[
      makeLesson("1.1","Number Foundations, Scientific Notation and Approximation","standard_form",[
        "Classify exact values in the smallest appropriate number set from natural to complex numbers.",
        "Round to decimal places and significant figures while preserving meaningful zeros.",
        "Construct direct and calculated bounds and quantify absolute and percentage error.",
        "Calculate with normalized scientific notation, units and orders of magnitude.",
        "Validate technology output with estimation, uncertainty and contextual interpretation."
      ],"6.0.0",79,96,14,5),
      makeLesson("1.2","Arithmetic Sequences and Series","arithmetic_sequences",[
        "Use sequence, series and sigma notation.","Move between recursive and explicit arithmetic rules.","Find terms, parameters and finite sums.","Evaluate additive models and thresholds."
      ]),
      makeLesson("1.3","Geometric Sequences and Series","geometric_sequences",[
        "Recognize positive, fractional and negative ratios.","Use explicit geometric rules.","Find finite sums and inverse parameters.","Model growth, decay and thresholds."
      ]),
      makeLesson("1.4","Financial Applications of Sequences","financial_models",[
        "Distinguish additive and compound financial change.","Use periodic and effective rates.","Model depreciation, inflation and real return.","Compare net outcomes and assumptions."
      ]),
      makeLesson("1.5","Exponent Laws and Logarithms","logarithms",[
        "Simplify zero, negative and rational exponents.","Solve exponential equations exactly or logarithmically.","Interpret logarithms as inverse exponents.","Apply domain and model checks."
      ]),
      makeLesson("1.6","Approximation, Bounds and Percentage Error","approximation_error",[
        "Round and report suitable precision.","Construct measurement bounds.","Propagate bounds through calculations.","Evaluate absolute and percentage error."
      ]),
      makeLesson("1.7","Loans, Annuities and Amortization","loans_annuities",[
        "Interpret cash-flow timing and TVM variables.","Calculate annuity values and loan payments.","Construct amortization evidence.","Compare repayment strategies."
      ]),
      makeLesson("1.8","Technology for Equations and Systems","technology_equations",[
        "Model and solve two- and three-variable systems.","Classify unique, inconsistent and dependent systems.","Determine model parameters from conditions.","Verify numerical roots and intersections."
      ])
    ]
  };

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
  course.updatedUnits="Unit 1 · 8 coherent teaching lessons · Lesson 1.1 v6.0.0";
  window.dispatchEvent(new CustomEvent("echs:ib-ai-unit-ready",{detail:{courseId:course.id,unit:1,lessons:unit.lessons.length,release:unit.release}}));
})();
