(function(){
  'use strict';
  const d=window.LESSON_DATA;if(!d||String(d.lesson?.number)!=='2.2')return;
  const R=String.raw;let n=0;const P=[];
  const id=()=>`IBAI-2.2-V5-P${String(++n).padStart(3,'0')}`;
  const base=(level,command,prompt,answer,solution,marks=2,calculator='No calculator needed',hint='Write the relevant model or feature before calculating.')=>({id:id(),level,command,prompt,answer,solution,marks,calculator,hint,tags:['linear-quadratic','lesson-2.2','v5']});
  const N=(level,command,prompt,value,answer,solution,marks=2,calculator='No calculator needed',hint='Show the governing equation and retain sufficient precision.',tolerance=1e-4)=>({...base(level,command,prompt,answer,solution,marks,calculator,hint),check:{mode:'number',value,tolerance}});
  const X=(level,command,prompt,accepted,answer,solution,marks=2,calculator='No calculator needed',hint='State the equation, units and restriction explicitly.')=>({...base(level,command,prompt,answer,solution,marks,calculator,hint),check:{mode:'text',accepted}});
  const M=(level,command,prompt,choices,correct,solution,marks=2,calculator='No calculator needed',hint='Use the defining structure rather than appearance alone.')=>({...base(level,command,prompt,choices[correct],solution,marks,calculator,hint),choices,correct,check:{mode:'choice',value:correct}});

  P.push(
    N('Foundation','Calculate',R`Find the gradient through \((2,5)\) and \((8,23)\).`,3,R`\(3\)`,R`\(m=(23-5)/(8-2)=18/6=3\).`),
    X('Foundation','Determine',R`Determine the equation of the line with gradient \(-2\) through \((3,11)\).`,['y=-2x+17','2x+y=17'],R`\(y=-2x+17\)`,R`Use \(y-11=-2(x-3)\), then simplify.`,3),
    X('Foundation','Interpret',R`For \(C(n)=7n+18\), where \(C\) is cost in QAR and \(n\) is the number of items, interpret both parameters.`,['7 qar per item and 18 qar fixed','each item adds 7 qar fixed cost 18 qar','gradient 7 intercept 18'],R`Each item adds 7 QAR and the fixed cost is 18 QAR.`,R`The coefficient of \(n\) is the rate; \(C(0)=18\) is the fixed charge.`,3),
    N('Foundation','Calculate',R`A line has equation \(y=4x-9\). Calculate the output when \(x=6\).`,15,R`\(15\)`,R`\(y=4(6)-9=15\).`),
    X('Foundation','State',R`State the gradient of the line \(3x-2y=8\).`,['3/2','1.5'],R`\(\frac32\)`,R`Rearrange to \(y=\frac32x-4\).`),
    X('Foundation','State',R`State the gradient of a line perpendicular to one with gradient \(\frac45\).`,['-5/4','-1.25'],R`\(-\frac54\)`,R`The perpendicular gradient is the negative reciprocal.`),
    N('Foundation','Determine',R`Find the x-coordinate where \(y=3x-4\) and \(y=-x+12\) intersect.`,4,R`\(4\)`,R`Set \(3x-4=-x+12\), so \(4x=16\).`),
    M('Foundation','Classify','Two distinct lines have the same gradient. Which statement is true?',['They intersect once.','They are parallel and have no common point.','They are perpendicular.','They have infinitely many common points.'],1,'Distinct lines with equal gradients have different intercepts and are parallel.'),
    X('Foundation','State',R`State the roots of \(q(x)=(x-2)(x+5)\).`,['2 and -5','x=2,-5','{-5,2}'],R`\(x=2\) and \(x=-5\)`,R`Set each factor equal to zero.`),
    N('Foundation','Calculate',R`Find the y-intercept of \(q(x)=2x^2-7x+9\).`,9,R`\(9\)`,R`The y-intercept is \(q(0)=9\).`),
    X('Foundation','State',R`State the vertex of \(q(x)=3(x-4)^2-7\).`,['(4,-7)','4,-7'],R`\((4,-7)\)`,R`Vertex form \(a(x-h)^2+k\) has vertex \((h,k)\).`),
    X('Foundation','State',R`State the axis of symmetry of \(q(x)=-2(x+3)^2+5\).`,['x=-3','-3'],R`\(x=-3\)`,R`The axis is \(x=h\), where \(h=-3\).`),
    M('Foundation','Identify','Which quadratic opens downward?',[R`\(2x^2-x+4\)`,R`\(-3x^2+5x+1\)`,R`\((x-2)^2-9\)`,R`\(0.5x^2+7\)`],1,'A negative coefficient of \(x^2\) gives a downward-opening parabola.'),
    N('Foundation','Calculate',R`For \(q(x)=x^2-6x+5\), calculate \(q(3)\).`,-4,R`\(-4\)`,R`\(q(3)=9-18+5=-4\).`),
    X('Foundation','State',R`State the exact roots of \(x^2-9=0\).`,['-3 and 3','x=±3','{-3,3}'],R`\(x=-3,3\)`,R`Factor as \((x-3)(x+3)=0\).`),
    M('Foundation','Classify',R`For a quadratic, what does \(b^2-4ac=0\) mean?`,['No real roots.','Two distinct real roots.','One repeated real root.','The y-intercept is zero.'],2,'A zero discriminant gives one repeated real root.'),
    X('Foundation','Determine',R`Write \(x^2-6x+5\) in factored form.`,['(x-1)(x-5)','(x-5)(x-1)'],R`\((x-1)(x-5)\)`,R`The numbers multiply to 5 and add to −6.`),
    X('Foundation','Determine',R`Write \(x^2-6x+5\) in vertex form.`,['(x-3)^2-4','(x−3)^2−4'],R`\((x-3)^2-4\)`,R`Complete the square: \(x^2-6x+9-4\).`),
    M('Foundation','Select','Which TI-84 command directly finds an x-intercept?',['Maximum','Zero','Intersect','TABLE'],1,'Zero finds an input where the selected function equals zero.','2','TI-84 expected'),
    M('Foundation','Select','Which TI-84 command is most direct for the coordinates of a vertex of a downward-opening parabola?',['Zero','Maximum','Intersect','TBLSET'],1,'Use Maximum when the parabola opens downward.','2','TI-84 expected')
  );

  P.push(
    N('Application','Determine',R`A delivery charge is 42 QAR for 5 km and 78 QAR for 17 km. Determine the gradient in QAR per kilometre.`,3,R`\(3\text{ QAR/km}\)`,R`\((78-42)/(17-5)=3\).`,3),
    X('Application','Construct',R`A gym charges 150 QAR initially and 45 QAR per month. Construct a cost model in terms of months \(n\).`,['45n+150','C(n)=45n+150'],R`\(C(n)=45n+150\)`,R`The monthly rate is the gradient and the joining fee is the intercept.`,3),
    X('Application','Determine',R`Determine the line through \((4,19)\) and \((10,43)\).`,['y=4x+3','4x-y+3=0'],R`\(y=4x+3\)`,R`The gradient is 4 and \(19=4(4)+c\) gives \(c=3\).`,4),
    X('Application','Determine',R`Find the line parallel to \(3x-2y=8\) and passing through \((-2,5)\).`,['y=3/2x+8','2y=3x+16','3x-2y=-16'],R`\(y=\frac32x+8\)`,R`The parallel gradient is \(3/2\). Use point–gradient form.`,4),
    X('Application','Determine',R`Find the line perpendicular to \(y=\frac12x+7\) through \((4,-1)\).`,['y=-2x+7','2x+y=7'],R`\(y=-2x+7\)`,R`The perpendicular gradient is −2.`,4),
    N('Application','Determine',R`Plans are \(P(x)=35+1.8x\) and \(Q(x)=11+2.6x\). Determine the break-even input.`,30,R`\(30\)`,R`Solve \(35+1.8x=11+2.6x\).`,3,'TI-84 permitted'),
    X('Application','Interpret',R`For the plans in the previous question, the common cost at break-even is 89 QAR. Interpret the point \((30,89)\).`,['at 30 units both cost 89 qar','30 units common cost 89 qar'],R`At 30 units, both plans cost 89 QAR.`,R`Both coordinates must be interpreted with units.`,3),
    X('Application','Determine',R`For \(q(x)=-2x^2+12x+14\), determine the roots and vertex.`,['roots -1,7 vertex (3,32)','x=-1,7 and (3,32)'],R`Roots \(-1,7\); vertex \((3,32)\).`,R`Factor to \(-2(x-7)(x+1)\); the axis is \(x=3\), and \(q(3)=32\).`,5,'TI-84 permitted'),
    X('Application','Determine',R`For \(p(x)=(x-2)(x-6)\), determine the axis and vertex.`,['x=4 vertex (4,-4)','axis 4 vertex 4,-4'],R`Axis \(x=4\); vertex \((4,-4)\).`,R`The axis is halfway between the roots; \(p(4)=-4\).`,4),
    X('Application','Construct',R`A quadratic has roots \(-2\) and \(5\) and passes through \((0,-20)\). Construct the model.`,['2(x+2)(x-5)','2x^2-6x-20'],R`\(q(x)=2(x+2)(x-5)\)`,R`Use \(-20=a(2)(-5)\), so \(a=2\).`,4),
    X('Application','Construct',R`A parabola has vertex \((4,-3)\) and passes through \((6,5)\). Construct the model.`,['2(x-4)^2-3','2x^2-16x+29'],R`\(q(x)=2(x-4)^2-3\)`,R`Use \(5=4a-3\), giving \(a=2\).`,4),
    N('Application','Determine',R`For \(h(t)=-4.9t^2+18t+1.5\), determine the positive zero to 3 decimal places.`,3.755,R`\(3.755\)`,R`The two roots are approximately −0.0815 and 3.7550; retain the positive root.`,4,'TI-84 expected','Use Zero near the positive crossing and verify by substitution.',0.001),
    N('Application','Determine',R`Revenue is \(R(p)=-20p^2+800p\). Determine the price that maximizes revenue.`,20,R`\(20\text{ QAR}\)`,R`The vertex input is \(-800/[2(-20)]=20\).`,3,'TI-84 permitted'),
    N('Application','Determine',R`For the revenue model \(R(p)=-20p^2+800p\), determine the maximum revenue.`,8000,R`\(8000\text{ QAR}\)`,R`Evaluate \(R(20)=8000\).`,3,'TI-84 permitted'),
    N('Application','Determine',R`A three-sided enclosure has area \(A(x)=x(100-2x)\). Determine its maximum area.`,1250,R`\(1250\text{ m}^2\)`,R`The vertex occurs at \(x=25\), giving \(A(25)=1250\).`,4,'TI-84 permitted'),
    X('Application','Determine',R`Find the exact intersections of \(y=2x+7\) and \(y=-x^2+10x+3\).`,['(4-2sqrt3,15-4sqrt3) and (4+2sqrt3,15+4sqrt3)','x=4±2sqrt3'],R`\((4-2\sqrt3,15-4\sqrt3)\) and \((4+2\sqrt3,15+4\sqrt3)\)`,R`Equating gives \(x^2-8x+4=0\), so \(x=4\pm2\sqrt3\); substitute into the line.`,6,'TI-84 permitted'),
    N('Application','Determine',R`For \(C(n)=0.5n^2+8n+20\), determine the first whole number \(n\) for which \(C(n)\ge160\).`,11,R`\(11\)`,R`The continuous crossing is about 10.55. Since \(C(10)=150\) and \(C(11)=168.5\), report 11.`,4,'TI-84 expected','Use TABLE to compare adjacent whole-number inputs.',0),
    X('Application','Determine',R`For inputs \(0,1,2,3\), outputs are \(5,8,13,20\). Determine a quadratic model.`,['x^2+2x+5','q(x)=x^2+2x+5'],R`\(q(x)=x^2+2x+5\)`,R`Second differences are 2, so \(a=1\); then \(c=5\) and \(b=2\).`,5),
    N('Application','Calculate',R`A linear model predicts 47 but the observed value is 49. Calculate the residual \(\text{observed}-\text{predicted}\).`,2,R`\(2\)`,R`Residual \(=49-47=2\).`),
    M('Application','Decide',R`A quadratic model was fitted using temperatures from 20°C to 36°C. A prediction at 50°C is:`,['interpolation','extrapolation','a residual','an exact value'],1,'50°C is outside the observed interval, so the prediction is extrapolation.')
  );

  window.__ECHS_LQ5_PRACTICE={R,P,n,base,N,X,M};
})();
