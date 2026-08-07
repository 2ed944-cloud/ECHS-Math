(function(){
  'use strict';
  const d=window.LESSON_DATA;if(!d||String(d.lesson?.number)!=='2.2')return;
  const R=String.raw;let qn=0;
  const qid=()=>`IBAI-2.2-V5-Q${String(++qn).padStart(2,'0')}`;
  const Q=(command,prompt,answer,solution,marks=3,calculator='No calculator needed',check=null)=>({id:qid(),level:'Quiz',command,prompt,answer,solution,marks,calculator,hint:'Show the governing equation, retain sufficient precision and apply contextual restrictions.',tags:['linear-quadratic','lesson-2.2','quiz','v5'],...(check?{check}:{} )});
  const N=(command,prompt,value,answer,solution,marks=3,calculator='No calculator needed',tolerance=1e-4)=>Q(command,prompt,answer,solution,marks,calculator,{mode:'number',value,tolerance});
  const X=(command,prompt,accepted,answer,solution,marks=3,calculator='No calculator needed')=>Q(command,prompt,answer,solution,marks,calculator,{mode:'text',accepted});
  const M=(command,prompt,choices,correct,solution,marks=2,calculator='No calculator needed')=>({...Q(command,prompt,choices[correct],solution,marks,calculator,{mode:'choice',value:correct}),choices,correct});

  d.quiz=[
    N('Calculate',R`A line passes through \((3,8)\) and \((11,28)\). Calculate its gradient.`,2.5,R`\(2.5\)`,R`\(m=(28-8)/(11-3)=20/8=2.5\).`),
    X('Determine',R`Determine the line perpendicular to \(y=-3x+4\) and passing through \((6,1)\).`,['y=1/3x-1','3y=x-3'],R`\(y=\frac13x-1\)`,R`The perpendicular gradient is \(1/3\). Use \(y-1=\frac13(x-6)\).`,4),
    N('Determine',R`Plans \(A(x)=75+2.4x\) and \(B(x)=15+3.6x\) have the same cost at what input?`,50,R`\(50\)`,R`Solve \(75+2.4x=15+3.6x\), giving \(60=1.2x\).`,3,'TI-84 permitted'),
    X('Determine',R`Determine the equation of the line through \((-2,9)\) and \((4,-3)\).`,['y=-2x+5','2x+y=5'],R`\(y=-2x+5\)`,R`The gradient is \((-3-9)/(4+2)=-2\), and \(9=4+c\) gives \(c=5\).`,4),
    X('Determine',R`For \(q(x)=2(x-1)(x-5)\), determine the roots, axis and vertex.`,['roots 1,5 axis x=3 vertex (3,-8)','x=1,5; x=3; (3,-8)'],R`Roots \(1,5\); axis \(x=3\); vertex \((3,-8)\).`,R`The axis is the midpoint 3, and \(q(3)=2(2)(-2)=-8\).`,5),
    M('Classify',R`For \(4x^2-12x+9=0\), the discriminant implies:`,['two distinct real roots','one repeated real root','no real roots','two non-real roots and one real root'],1,'The discriminant is \(144-144=0\), so the root is repeated.'),
    X('Construct',R`A quadratic has roots \(-3\) and \(4\) and passes through \((0,24)\). Construct the model.`,['-2(x+3)(x-4)','-2x^2+2x+24'],R`\(q(x)=-2(x+3)(x-4)\)`,R`Use \(24=a(3)(-4)=-12a\), so \(a=-2\).`,4),
    X('Solve',R`Solve \(2x^2-5x-3=0\) exactly.`,['x=3 and x=-1/2','{-1/2,3}'],R`\(x=3\) or \(x=-\frac12\)`,R`Factor as \((2x+1)(x-3)=0\).`,4),
    N('Determine',R`For \(h(t)=-4.9t^2+18t+1.5\), determine the positive zero to 3 decimal places.`,3.755,R`\(3.755\)`,R`Use Zero near the positive crossing and reject the negative root because \(t\ge0\).`,4,'TI-84 expected',0.001),
    N('Determine',R`Revenue is \(R(p)=-15p^2+900p\). Determine the maximizing price.`,30,R`\(30\text{ QAR}\)`,R`The vertex input is \(-900/[2(-15)]=30\).`,3,'TI-84 permitted'),
    X('Determine',R`Find the intersections of \(y=x+1\) and \(y=x^2-3x+1\).`,['(0,1) and (4,5)','x=0,4'],R`\((0,1)\) and \((4,5)\)`,R`Set \(x+1=x^2-3x+1\), giving \(x(x-4)=0\).`,5,'TI-84 permitted'),
    N('Determine',R`For \(P(n)=n^2+7n+10\), determine the first whole number \(n\) for which \(P(n)\ge100\).`,7,R`\(7\)`,R`The positive equality root is about 6.47. Since \(P(6)=88<100\) and \(P(7)=108\ge100\), report 7.`,4,'TI-84 expected',0),
    M('Select',R`For equal input spacing, first differences are \(4,8,12,16\). Which model family is supported?`,['constant','linear','quadratic','exponential'],2,'The second differences are constant at 4, supporting a quadratic.'),
    X('Comment',R`A fitted line has residuals \(-5,1,6,2,-4\) in increasing input order. Comment on the pattern.`,['curved pattern linear misses curvature','systematic residuals','quadratic candidate'],R`The residuals form a curved systematic pattern, suggesting that the linear model misses curvature.`,R`Residuals are negative at both ends and positive in the middle, rather than patternless.`,4),
    N('Determine',R`Determine the maximum of \(q(x)=-x^2+6x+7\) on \(4\le x\le8\).`,15,R`\(15\)`,R`The unrestricted vertex is at \(x=3\), outside the interval. The function decreases on the interval, so the maximum is \(q(4)=15\).`,4,'TI-84 permitted'),
    X('Determine',R`The line \(y=kx-4\) is tangent to \(y=x^2-6x+8\). Determine the positive value of \(k\).`,['-6+4sqrt3','0.928','k=-6+4√3'],R`\(k=-6+4\sqrt3\approx0.928\)`,R`Equating gives \(x^2-(6+k)x+12=0\). Tangency requires \((6+k)^2-48=0\); take the positive value of \(k\).`,5,'TI-84 permitted')
  ];

  const task=(id,title,style,calculator,context,total_marks,parts)=>({id,title,style,calculator,context,total_marks,parts,tags:['linear-quadratic','lesson-2.2','ib-task','v5']});
  d.exam=[
    task('IBAI-2.2-V5-T1','Transport plans and break-even','Paper 2 · linear modelling and interpretation','TI-84 permitted',R`Two transport providers charge according to \(A(d)=180+3.2d\) and \(B(d)=60+5.6d\), where \(d\) is distance in kilometres and cost is in QAR.`,14,[
      {label:'a',prompt:'Interpret the gradient and intercept of each model.',marks:4,answer:'Plan A has a fixed charge of 180 QAR and adds 3.2 QAR/km. Plan B has a fixed charge of 60 QAR and adds 5.6 QAR/km.',markscheme:'A1 each correct intercept; A1 each correct gradient interpretation with units.'},
      {label:'b',prompt:'Determine the break-even point.',marks:4,answer:R`\(180+3.2d=60+5.6d\Rightarrow d=50\). The common cost is 340 QAR, so the break-even point is \((50,340)\).`,markscheme:'M1 set equal; A1 d=50; M1 substitute; A1 common cost/coordinate.'},
      {label:'c',prompt:'Determine which plan is cheaper for a journey of 80 km.',marks:2,answer:'A(80)=436 QAR and B(80)=508 QAR, so Plan A is cheaper by 72 QAR.',markscheme:'A1 both values; A1 comparison/difference.'},
      {label:'d',prompt:'State one assumption and one limitation of the models.',marks:4,answer:'Assumption: each provider keeps a constant per-kilometre rate and fixed fee. Limitation: additional charges, traffic, route conditions or pricing changes are ignored; extrapolation beyond the quoted range may be unreliable.',markscheme:'R1 relevant assumption; R1 explanation; R1 relevant limitation; R1 contextual consequence.'}
    ]),
    task('IBAI-2.2-V5-T2','Parabolic pedestrian bridge','Paper 2 · constructing and using a quadratic','TI-84 permitted',R`A bridge arch meets the ground at \(x=0\) and \(x=18\) metres. Its maximum height is 8 metres at the centre.`,15,[
      {label:'a',prompt:'Construct a model in the form \(h(x)=ax(x-18)\).',marks:4,answer:R`At \(x=9\), \(8=a(9)(-9)=-81a\), so \(a=-8/81\). Hence \(h(x)=-\frac8{81}x(x-18)\).`,markscheme:'M1 use roots form; M1 substitute centre point; A1 a; A1 model.'},
      {label:'b',prompt:'State a suitable contextual domain and range.',marks:3,answer:R`Domain \(0\le x\le18\); range \(0\le h\le8\).`,markscheme:'A1 domain endpoints; A1 range endpoints; A1 correct inclusion/units or interpretation.'},
      {label:'c',prompt:'Find the height 3 metres from the left support.',marks:3,answer:R`\(h(3)=-\frac8{81}(3)(-15)=\frac{40}{9}\approx4.44\text{ m}.\)`,markscheme:'M1 substitute x=3; A1 exact/decimal value; A1 units.'},
      {label:'d',prompt:'A vehicle requires 5 m vertical clearance. Determine the interval of x-values for which the clearance is at least 5 m.',marks:5,answer:R`Solve \(-\frac8{81}x(x-18)\ge5\). Equality gives \(8x^2-144x+405=0\), so \(x\approx3.44\) and \(x\approx14.56\). Clearance is at least 5 m for approximately \(3.44\le x\le14.56\).`,markscheme:'M1 form equality/inequality; A1 quadratic; A1 two boundary values; R1 choose interval between roots; A1 final interval.'}
    ]),
    task('IBAI-2.2-V5-T3','Projectile model and TI-84 evidence','Paper 2 · technology-supported quadratic','TI-84 expected',R`A ball is modelled by \(h(t)=-4.9t^2+18t+1.5\), where \(t\) is time in seconds and \(h\) is height in metres.`,16,[
      {label:'a',prompt:'State the launch height.',marks:2,answer:'h(0)=1.5 m.',markscheme:'M1 substitute t=0; A1 height with units.'},
      {label:'b',prompt:'Determine the maximum height and the time at which it occurs.',marks:5,answer:R`\(t=-18/[2(-4.9)]\approx1.8367\) s and \(h\approx18.03\) m. TI-84 Maximum should give the same point.`,markscheme:'M1 vertex input; A1 time; M1 evaluate/use Maximum; A1 height; A1 units/appropriate precision.'},
      {label:'c',prompt:'Use the TI-84 Zero command to determine when the ball reaches the ground. Record the relevant calculator evidence.',marks:5,answer:'Enter Y1=-4.9X²+18X+1.5, graph a window showing the positive crossing, and use 2nd TRACE → 2:zero with Left Bound, Right Bound and Guess. The positive zero is t≈3.755 s; reject the negative root.',markscheme:'A1 correct entry; A1 correct command/bounds; A1 positive zero; R1 reject negative root using t≥0; A1 units/rounding.'},
      {label:'d',prompt:'State one limitation of the model.',marks:4,answer:'The model assumes constant gravity and ignores air resistance, wind and spin; therefore the real path and landing time may differ.',markscheme:'R1 relevant omitted factor; R1 link to assumption; R1 effect on path/height/time; R1 contextual statement.'}
    ]),
    task('IBAI-2.2-V5-T4','Ticket price and revenue','Paper 2 · optimisation and discrete decision','TI-84 expected',R`Demand for tickets is modelled by \(n=900-25p\), where \(p\) is price in QAR and \(n\) is the number of tickets demanded.`,16,[
      {label:'a',prompt:'Construct the revenue model and state a contextual domain.',marks:4,answer:R`\(R(p)=p(900-25p)=-25p^2+900p\), with \(0\le p\le36\).`,markscheme:'M1 revenue=price×demand; A1 model; A1 lower bound; A1 upper bound from non-negative demand.'},
      {label:'b',prompt:'Determine the price that maximizes revenue and the maximum revenue.',marks:5,answer:R`The vertex occurs at \(p=18\). Then \(R(18)=8100\) QAR.`,markscheme:'M1 vertex method/Maximum; A1 p=18; M1 evaluate; A1 8100; A1 units/interpretation.'},
      {label:'c',prompt:'Tickets must be priced to the nearest whole QAR. Explain whether the continuous optimum changes the reported answer.',marks:3,answer:'The continuous optimum is exactly 18 QAR, already a whole number. Check R(17), R(18) and R(19) if needed; R(18) remains greatest.',markscheme:'R1 identify whole-number restriction; A1 report 18; R1 adjacent-value verification.'},
      {label:'d',prompt:'Evaluate one assumption and one limitation.',marks:4,answer:'Assumption: the linear demand rule remains valid as price changes. Limitation: competitor prices, venue capacity and customer behaviour are omitted, so the predicted optimum may not occur in practice.',markscheme:'R1 assumption; R1 explanation; R1 limitation; R1 consequence.'}
    ]),
    task('IBAI-2.2-V5-T5','Choosing a model from data','Paper 2 · differences, residuals and extrapolation','TI-84 permitted',R`For equally spaced inputs \(x=0,1,2,3,4\), observed outputs are \(5,8,13,20,29\).`,17,[
      {label:'a',prompt:'Use differences to justify a model family.',marks:4,answer:'First differences are 3,5,7,9 and second differences are 2,2,2, so a quadratic model is supported.',markscheme:'A1 first differences; A1 second differences; R1 equal spacing; R1 quadratic conclusion.'},
      {label:'b',prompt:'Determine the quadratic model.',marks:5,answer:R`Since \(2a=2\), \(a=1\). Also \(c=5\), and \(1+b+5=8\) gives \(b=2\). Thus \(q(x)=x^2+2x+5\).`,markscheme:'M1 use second difference; A1 a; A1 c; M1 determine b; A1 model.'},
      {label:'c',prompt:'An additional observation at x=5 is 42. Calculate its residual.',marks:3,answer:R`The model predicts \(q(5)=40\). Residual = observed − predicted = \(42-40=2\).`,markscheme:'A1 prediction; M1 residual definition; A1 residual 2.'},
      {label:'d',prompt:'Evaluate a prediction at x=20.',marks:5,answer:'The prediction q(20)=445 is a distant extrapolation beyond x=0 to 5. Even though the quadratic fits the given data, the relationship or constraints may change, so the value should be reported with caution and the domain validated.',markscheme:'A1 prediction 445; R1 identify extrapolation; R1 distance beyond evidence; R1 possible structural/context change; R1 cautious conclusion.'}
    ]),
    task('IBAI-2.2-V5-T6','Line and parabola in a design problem','Paper 2 · exact intersections and technology communication','TI-84 expected',R`A support cable is modelled by \(c(x)=2x+7\) and an arch by \(a(x)=-x^2+10x+3\), with distances measured in metres.`,16,[
      {label:'a',prompt:'Determine the exact intersection coordinates.',marks:6,answer:R`Equating gives \(x^2-8x+4=0\), so \(x=4\pm2\sqrt3\). Substitution into \(c(x)\) gives \((4\pm2\sqrt3,15\pm4\sqrt3)\).`,markscheme:'M1 set equal; A1 quadratic; M1 solve; A1 exact x-values; M1 substitute; A1 exact coordinates.'},
      {label:'b',prompt:'Describe the TI-84 Intersect evidence that verifies both points.',marks:4,answer:'Enter c(x) in Y1 and a(x) in Y2, use a window showing both crossings, select 2nd TRACE → 5:intersect, confirm both curves, and run Guess near each crossing. Outputs are approximately (0.536,8.072) and (7.464,21.928).',markscheme:'A1 correct entries; A1 visible-window requirement; A1 Intersect route; A1 both decimal points/repeat near each crossing.'},
      {label:'c',prompt:'The design uses only 1≤x≤7. Determine which intersections are admissible.',marks:3,answer:'x≈0.536 is below 1 and x≈7.464 is above 7, so neither intersection lies in the design interval.',markscheme:'A1 compare first x; A1 compare second x; A1 conclusion.'},
      {label:'d',prompt:'Explain why the exact and decimal answers both have value.',marks:3,answer:'Exact values preserve algebraic structure and avoid rounding error. Decimal coordinates are useful for graphing, measurement and contextual comparison with design limits.',markscheme:'R1 exact-value advantage; R1 decimal-value advantage; R1 coherent comparison.'}
    ])
  ];

  if(d.quiz.length!==16||d.exam.length!==6)throw new Error('Lesson 2.2 v5 assessment counts are incorrect.');
  d.exam.forEach(taskItem=>{const sum=taskItem.parts.reduce((total,part)=>total+part.marks,0);if(sum!==taskItem.total_marks)throw new Error(`${taskItem.id} mark total mismatch.`);});
  d.counts.quiz=d.quiz.length;d.counts.exam=d.exam.length;
  d.audit.assessmentRelease='5.0.0';d.audit.quizCount=d.quiz.length;d.audit.taskCount=d.exam.length;
})();
