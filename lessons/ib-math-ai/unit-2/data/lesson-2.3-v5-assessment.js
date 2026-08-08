(function(){
  'use strict';
  const d=window.LESSON_DATA;if(!d||String(d.lesson?.number)!=='2.3')return;
  const R=String.raw;
  const q=(id,command,prompt,answer,solution,marks,calculator='No calculator needed',check=null)=>({id:`IBAI-2.3-V5-Q${String(id).padStart(2,'0')}`,level:'Quiz',command,prompt,answer,solution,marks,calculator,hint:'Use exact structure, calculator evidence and contextual restrictions where relevant.',tags:['polynomial-rational','lesson-2.3','quiz','v5'],check});
  d.quiz=[
    q(1,'Identify','Which expression is not a polynomial: \(4x^5-2x+1\), \(3x^2+7\), \(x^{-2}+5\), or \(-8\)?',R`\(x^{-2}+5\)`,R`The exponent −2 is negative; a polynomial uses non-negative integer exponents.`,2,'No calculator needed',{mode:'text',accepted:['x^-2+5','x^{-2}+5','third expression']}),
    q(2,'Describe',R`Describe the end behaviour of \(-3x^8+2x^3-1\).`,R`Both ends fall: \(x\to\pm\infty\Rightarrow f(x)\to-\infty\).`,R`Even degree gives matching ends; the negative leading coefficient makes both ends fall.`,3),
    q(3,'Solve',R`Solve \((x+1)^2(x-3)(x-6)\le0\).`,R`\([3,6]\cup\{-1\}\)`,R`The sign is non-positive between the odd roots 3 and 6, and equality also occurs at the even root −1 without a sign change.`,4),
    q(4,'Construct',R`A cubic has zeros \(-1,2,4\) and passes through \((0,16)\). Find it.`,R`\(f(x)=2(x+1)(x-2)(x-4)\)`,R`Use \(16=a(1)(-2)(-4)=8a\), so \(a=2\).`,4),
    q(5,'Determine','For x=0,1,2,3, the outputs are 3,6,17,42. Determine a cubic model.',R`\(f(x)=x^3+x+3\)`,R`The third differences are constant at 6. Substitution gives \(f(x)=x^3+x+3\).`,5),
    q(6,'Calculate',R`A cubic model predicts 28.878 when the observed value is 28.4. Calculate the residual observed−predicted.`,R`\(-0.478\)`,R`Residual=28.4−28.878=−0.478.`,2,'TI-84 permitted',{mode:'number',value:-0.478,tolerance:0.001}),
    q(7,'Analyse',R`For \(r(x)=\dfrac{(x-2)(x+3)}{(x-2)(x-5)}\), state the hole and vertical asymptote.`,R`Hole \((2,-\tfrac53)\); vertical asymptote \(x=5\).`,R`Cancel x−2 to obtain (x+3)/(x−5), while retaining x≠2,5. Evaluate at 2 for the hole.`,4),
    q(8,'State',R`State the horizontal asymptote of \(\dfrac{5x^3-x}{2x^3+7}\).`,R`\(y=\frac52\)`,R`Equal degrees give the ratio of leading coefficients.`,2),
    q(9,'Determine',R`Find the valid intersection of \(f(x)=\dfrac8{x-2}+3\) and \(g(x)=0.5x+2\) if \(x>2\).`,R`\((6,5)\)`,R`The mathematical intersections are (−2,1) and (6,5); apply x>2.`,4,'TI-84 permitted'),
    q(10,'Determine',R`If \(y\) varies inversely as \(x^2\) and \(y=18\) when \(x=4\), find y when \(x=6\).`,R`\(8\)`,R`k=18(4²)=288; y=288/36=8.`,4),
    q(11,'Determine',R`A power model passes through \((3,54)\) and \((6,432)\). Determine the exponent.`,R`\(n=3\)`,R`The input doubles and output multiplies by 8, so \(2^n=8\).`,3),
    q(12,'Evaluate','A response decreases rapidly and levels near y=4, with a forbidden input x=1. Select a model family and justify it.',R`A shifted rational model \(y=a/(x-1)+4\).`,R`The vertical asymptote x=1 and horizontal asymptote y=4 encode the observed structure.`,4),
    q(13,'Explain','Why can TI-84 Zero fail at an even-multiplicity root, and what should be used instead?',R`There may be no sign change; use factor structure, a local Minimum/Maximum, or TABLE.`,R`The zero routine normally brackets a sign change, which a touch point lacks.`,4,'TI-84 expected'),
    q(14,'State','State the TI-84 list-and-regression route used to fit a cubic model.',R`STAT → EDIT (L1,L2), then STAT → CALC → CubicReg; store to Y1 and inspect residuals.`,R`The lists hold paired data; CubicReg estimates four coefficients.`,3,'TI-84 expected'),
    q(15,'Interpret',R`PwrReg gives \(y=0.0182x^{2.01}\). Interpret the exponent.`,R`The output is approximately proportional to the square of the input; doubling x multiplies y by about 4.`,R`The exponent 2.01 is close to 2, subject to contextual justification.`,3,'TI-84 expected'),
    q(16,'Evaluate',R`A cubic fit has \(R^2=0.997\) on \(0\le x\le6\), then predicts a value four times the observed maximum at \(x=10\). Evaluate the prediction.`,R`It is high-risk extrapolation and should not be accepted without mechanism or new data.`,R`A high in-sample R² does not control the rapidly growing cubic tail outside the data interval.`,4)
  ];
  d.quiz.forEach((item,index)=>item.sequence=index+1);

  const task=(id,title,style,context,parts,calculator='TI-84 expected')=>({id:`IBAI-2.3-V5-T${id}`,title,style,context,parts,calculator,total_marks:parts.reduce((s,p)=>s+p.marks,0),tags:['polynomial-rational','lesson-2.3','ib-task','v5']});
  d.exam=[
    task(1,'Production response: structure, signs and context','Paper 1/2 hybrid · polynomial structure',R`A production response is modelled by \(P(t)=0.5(t+2)(t-3)^2(t-8)\) for \(0\le t\le10\).`,[
      {label:'a',prompt:'State the degree, zeros and multiplicities.',marks:3,answer:R`Degree 4; zeros −2 (mult.1), 3 (mult.2), 8 (mult.1).`,markscheme:'A1 degree; A1 zeros; A1 multiplicities.'},
      {label:'b',prompt:'Describe the unrestricted end behaviour and the behaviour at each real zero.',marks:4,answer:R`Positive quartic: both ends rise. It crosses at −2 and 8; it touches and turns at 3.`,markscheme:'A1 up/up; A1 cross at −2; A1 touch at 3; A1 cross at 8.'},
      {label:'c',prompt:R`Solve \(P(t)\ge0\) on the contextual domain.`,marks:4,answer:R`\(t=3\) or \(8\le t\le10\).`,markscheme:'M1 sign analysis; A1 interval signs; A1 include t=3; A1 final contextual solution.'},
      {label:'d',prompt:'Explain one limitation of using this model beyond t=10.',marks:2,answer:'The quartic tail grows without bound and the model has not been validated beyond 10; the production mechanism may change.',markscheme:'R1 unsupported extrapolation; R1 relevant polynomial/context limitation.'}
    ]),
    task(2,'Measured response: cubic regression and residual evidence','Paper 2 · regression and interpretation',R`The data are \((0,18.0),(1,25.5),(2,23.2),(3,21.2),(4,17.0),(5,20.2),(6,28.4),(7,50.4)\).`,[
      {label:'a',prompt:'Use cubic regression to determine a model, giving coefficients to 4 significant figures.',marks:4,answer:R`\(P(x)=0.6210x^3-5.261x^2+10.98x+18.28\).`,markscheme:'M1 correct lists/regression; A3 four coefficients to required accuracy.'},
      {label:'b',prompt:'Calculate the residual at x=5.',marks:2,answer:R`Predicted \(19.2639\); residual \(20.2-19.2639\approx0.936\).`,markscheme:'A1 predicted value; A1 residual with sign.'},
      {label:'c',prompt:'Use technology to determine the local maximum and minimum within 0≤x≤7.',marks:4,answer:R`Local maximum \((1.381,25.040)\); local minimum \((4.267,17.576)\).`,markscheme:'M1 appropriate graph/window; A1 max coordinates; A1 min coordinates; A1 correct classification.'},
      {label:'d',prompt:'The model predicts about 143.6 at x=9. Evaluate this prediction.',marks:3,answer:'This is extrapolation beyond x=7. The value is far beyond the observed range and is driven by the cubic tail, so it is not defensible without further data or a mechanism.',markscheme:'R1 extrapolation; R1 compare with observed evidence; R1 relevant model limitation.'}
    ]),
    task(3,'Calibration curve: rational structure and intersection','Paper 2 · rational modelling',R`A calibration curve has vertical asymptote \(x=2\), horizontal asymptote \(y=3\), and passes through \((4,7)\). It is modelled by \(f(x)=a/(x-2)+3\).`,[
      {label:'a',prompt:'Determine a and state the mathematical domain.',marks:3,answer:R`\(a=8\), so \(f(x)=8/(x-2)+3\), with \(x≠2\).`,markscheme:'M1 substitute point; A1 a=8; A1 domain.'},
      {label:'b',prompt:'Find both intercepts.',marks:3,answer:R`x-intercept \((-2/3,0)\); y-intercept \((0,-1)\).`,markscheme:'M1 numerator/equation zero; A1 x-intercept; A1 y-intercept.'},
      {label:'c',prompt:'Find the inverse function and state its domain.',marks:4,answer:R`\(f^{-1}(x)=2+8/(x-3)\), domain \(x≠3\).`,markscheme:'M1 swap variables; M1 rearrange; A1 inverse; A1 domain.'},
      {label:'d',prompt:R`Find the intersections with \(g(x)=0.5x+2\). If the practical domain is \(x>2\), state the valid point.`,marks:5,answer:R`Mathematical intersections \((-2,1)\) and \((6,5)\); valid point \((6,5)\).`,markscheme:'M1 set equations equal; M1 obtain quadratic/square equation; A2 both points; A1 contextual selection.'}
    ]),
    task(4,'Bearing mass: power regression and mechanism','Paper 2 · power model',R`Bearing radii r (mm) are 4,6,8,10,12,16 and measured masses M (g) are 2.10,7.00,16.8,32.1,56.9,134.0.`,[
      {label:'a',prompt:'Use power regression to obtain a model M=ar^b.',marks:3,answer:R`\(M\approx0.0326303r^{2.99997}\).`,markscheme:'M1 correct lists/PwrReg; A1 a; A1 b.'},
      {label:'b',prompt:'Explain why M=0.0326r³ is a defensible simplified model.',marks:3,answer:'The fitted exponent is essentially 3, the fit is extremely strong, and mass of similar objects made from one material is proportional to volume.',markscheme:'R1 exponent evidence; R1 fit/data evidence; R1 physical mechanism.'},
      {label:'c',prompt:'Estimate the mass for r=14 mm.',marks:2,answer:R`Using the regression, \(M\approx89.53\) g (about 89.5 g).`,markscheme:'M1 substitute with stored precision; A1 value and units.'},
      {label:'d',prompt:'State the units of the constant in the simplified model and one limitation.',marks:3,answer:R`Units g/mm³. Limitation: material density and geometric similarity must remain constant; distant extrapolation is not guaranteed.`,markscheme:'A1 units; R1 assumption; R1 limitation/domain.'}
    ]),
    task(5,'Cooling response: selecting an asymptotic model','Paper 2 · model choice',R`A response is recorded as \((1,31.0),(2,18.2),(3,12.7),(4,9.9),(5,8.2),(6,7.1)\). It decreases quickly and appears to level above zero.`,[
      {label:'a',prompt:'Explain why a shifted rational model is more plausible than a cubic or pure inverse-power model.',marks:4,answer:'The response is monotone decreasing, has no observed turning point, and approaches a non-zero level. A shifted rational model supplies a horizontal asymptote above zero; a cubic has unstable tails and a pure inverse power approaches zero.',markscheme:'R1 monotone shape; R1 non-zero level; R1 rational asymptote; R1 reject alternatives.'},
      {label:'b',prompt:R`A candidate is \(R(x)=30/(x+0.2)+2\). Calculate \(R(3)\) and its residual.`,marks:3,answer:R`\(R(3)=30/3.2+2=11.375\); residual \(12.7-11.375=1.325\).`,markscheme:'M1 substitution; A1 prediction; A1 signed residual.'},
      {label:'c',prompt:'State a reasonable domain and two limitations.',marks:4,answer:'A reasonable empirical domain is 1≤x≤6 (or a cautiously justified nearby interval). Limitations include measurement error, uncertain asymptotic level, and unsupported extrapolation near the denominator restriction or far beyond the data.',markscheme:'A1 domain; R1 first limitation; R1 second limitation; R1 contextual relevance.'}
    ]),
    task(6,'Integrated model audit','Paper 2 · IB synthesis',R`A school compares two models for a response on \(0<x\le8\): \(P(x)=0.4(x-1)(x-4)^2(x-7)\) and \(R(x)=12/(x-2)+4\).`,[
      {label:'a',prompt:'For P, state the degree, zeros, multiplicities and end behaviour.',marks:4,answer:'Degree 4; zeros 1 (mult.1), 4 (mult.2), 7 (mult.1); positive leading coefficient gives up/up ends.',markscheme:'A1 degree; A1 zeros; A1 multiplicities; A1 ends.'},
      {label:'b',prompt:R`Solve \(P(x)\le0\) on \(0<x\le8\).`,marks:4,answer:R`\(1\le x\le7\).`,markscheme:'M1 critical values; M1 multiplicity/sign logic; A1 unrestricted interval; A1 contextual restriction.'},
      {label:'c',prompt:'For R, state the asymptotes and explain why x=2 must be treated differently from a zero.',marks:3,answer:R`Asymptotes \(x=2\), \(y=4\). At x=2 the function is undefined; it is a denominator restriction, not an input where output equals zero.`,markscheme:'A1 vertical; A1 horizontal; R1 distinction.'},
      {label:'d',prompt:'Describe a transparent TI-84 strategy for finding intersections of P and R and validating them.',marks:4,answer:'Enter both functions, use a window showing both rational branches and the contextual domain, run Intersect near each crossing, then substitute each coordinate into both original models and reject points outside 0<x≤8 or at x=2.',markscheme:'A1 entries/window; M1 repeat Intersect; A1 substitution check; A1 domain/asymptote audit.'}
    ])
  ];
  d.exam.forEach((item,index)=>item.sequence=index+1);
  if(d.quiz.length!==16)throw new Error(`Lesson 2.3 expected 16 quiz questions, received ${d.quiz.length}.`);
  if(d.exam.length!==6)throw new Error(`Lesson 2.3 expected 6 IB tasks, received ${d.exam.length}.`);
  d.exam.forEach(item=>{const sum=item.parts.reduce((s,p)=>s+p.marks,0);if(sum!==item.total_marks)throw new Error(`${item.id} mark total mismatch.`);});
  d.counts.quiz=d.quiz.length;d.counts.exam=d.exam.length;d.audit.quizCount=d.quiz.length;d.audit.taskCount=d.exam.length;
})();
