(function(){
'use strict';
const data=window.LESSON_DATA;if(!data||String(data.lesson?.number)!=='1.6')return;
const num=(value,tolerance=1e-6)=>({mode:'number',value,tolerance});
data.quiz=[
  {id:'IBAI-1.6-Q01',level:'Quiz',prompt:'Solve \\(2x+3y=13\\) and \\(4x-y=5\\). Enter \\(x\\).',answer:'\\(2\\)',solution:'From \\(y=4x-5\\), substitution gives \\(14x=28\\), so \\((x,y)=(2,3)\\). Verify both equations.',marks:2,calculator:'GDC expected',command:'Calculate',hint:'Record the variable order and verify both equations.',tags:['quiz','2x2 system'],check:num(2)},
  {id:'IBAI-1.6-Q02',level:'Quiz',prompt:'Solve \\(x-2y=-7\\) and \\(3x+y=11\\). Enter \\(y\\).',answer:'\\(32/7\\)',solution:'The common solution is \\((15/7,32/7)\\), so \\(y\\approx4.57143\\).',marks:2,calculator:'GDC expected',command:'Calculate',hint:'Use a simultaneous-equation solver or substitution.',tags:['quiz','2x2 system'],check:num(32/7,0.005)},
  {id:'IBAI-1.6-Q03',level:'Quiz',prompt:'Find the greatest real root of \\(x^2-9x+20=0\\).',answer:'\\(5\\)',solution:'\\((x-4)(x-5)=0\\), so the greatest root is 5.',marks:2,calculator:'GDC allowed / verify algebraically',command:'Calculate',hint:'Audit the complete root set.',tags:['quiz','polynomial roots'],check:num(5)},
  {id:'IBAI-1.6-Q04',level:'Quiz',prompt:'Find the smallest real root of \\(x^3-2x^2-5x+6=0\\).',answer:'\\(-2\\)',solution:'\\((x+2)(x-1)(x-3)=0\\), so the smallest root is -2.',marks:2,calculator:'GDC expected',command:'Calculate',hint:'Use degree to check completeness.',tags:['quiz','polynomial roots'],check:num(-2)},
  {id:'IBAI-1.6-Q05',level:'Quiz',prompt:'A rectangle has area 84 cm² and its length is 5 cm more than its width. Find the physically valid width.',answer:'\\(7\\text{ cm}\\)',solution:'Solve \\(w(w+5)=84\\). The roots are 7 and -12; reject the negative length.',marks:2,calculator:'GDC expected',command:'Determine',hint:'Apply the physical domain after solving.',tags:['quiz','domain','quadratic model'],check:num(7)},
  {id:'IBAI-1.6-Q06',level:'Quiz',prompt:'For \\(h(t)=-4.9t^2+16t+1\\), find the positive time when \\(h=0\\).',answer:'\\(3.32665\\text{ s}\\)',solution:'A polynomial solver gives approximately -0.06135 and 3.32665. Elapsed time requires the positive root.',marks:2,calculator:'GDC expected',command:'Calculate',hint:'Report both mathematical roots before applying the domain.',tags:['quiz','polynomial model','domain'],check:num(3.3266535485,0.005)},
  {id:'IBAI-1.6-Q07',level:'Quiz',prompt:'Solve \\(x+y+z=9\\), \\(2x-y+z=4\\), \\(x+2y-z=3\\). Enter \\(z\\).',answer:'\\(32/7\\)',solution:'Using the order \\(x,y,z\\), the solution is \\((9/7,22/7,32/7)\\). Verify all three equations.',marks:3,calculator:'GDC expected',command:'Calculate',hint:'Preserve the same coefficient order in every row.',tags:['quiz','3x3 system'],check:num(32/7,0.005)},
  {id:'IBAI-1.6-Q08',level:'Quiz',prompt:'Solve \\(4x+9=55(0.86)^x\\) for \\(x\\ge0\\).',answer:'\\(5.89866\\)',solution:'Graph both sides or solve their difference. A broad scan followed by numerical refinement gives \\(x\\approx5.89866\\); substitution verifies the equality.',marks:3,calculator:'GDC expected',command:'Determine',hint:'State a non-negative graph window or initial guess.',tags:['quiz','numerical intersection'],check:num(5.89866,0.01)},
  {id:'IBAI-1.6-Q09',level:'Quiz',prompt:'A degree-4 solver lists the real roots \\(-2,3,3,6\\). How many distinct x-intercepts are represented?',answer:'\\(3\\)',solution:'The repeated root 3 counts twice for multiplicity but once as a distinct x-intercept.',marks:2,calculator:'No calculator',command:'State',hint:'Separate multiplicity from distinct roots.',tags:['quiz','multiplicity'],check:num(3)},
  {id:'IBAI-1.6-Q10',level:'Quiz',prompt:'A production model gives algebraic roots \\(-6\\) and \\(14\\), where the variable is a number of units. Enter the contextually admissible root.',answer:'\\(14\\)',solution:'Negative production is outside the stated interpretation, so 14 is admissible.',marks:2,calculator:'No calculator',command:'Interpret',hint:'State the contextual restriction.',tags:['quiz','admissibility'],check:num(14)},
  {id:'IBAI-1.6-Q11',level:'Quiz',prompt:'A line \\(L(x)=mx+c\\) passes through \\((2,11)\\) and \\((5,23)\\). Find \\(c\\).',answer:'\\(3\\)',solution:'The equations are \\(2m+c=11\\), \\(5m+c=23\\). Hence \\(m=4\\) and \\(c=3\\).',marks:3,calculator:'GDC allowed',command:'Determine',hint:'Treat the unknown parameters as system variables.',tags:['quiz','parameter fitting'],check:num(3)},
  {id:'IBAI-1.6-Q12',level:'Quiz',prompt:'Classify the system \\(4x+8y=12\\), \\(x+2y=4\\). Enter 0 for no solution, 1 for a unique solution, or -1 for infinitely many solutions.',answer:'\\(0\\)',solution:'Multiplying the second equation by 4 gives \\(4x+8y=16\\), which contradicts the first equation. The system is inconsistent.',marks:2,calculator:'GDC allowed',command:'Classify',hint:'Compare scalar multiples before solving.',tags:['quiz','classification'],check:num(0)},
  {id:'IBAI-1.6-Q13',level:'Quiz',prompt:'For the candidate \\((2,-1)\\), calculate the maximum absolute residual in \\(3x+2y=4\\) and \\(x-y=3\\).',answer:'\\(0\\)',solution:'The residuals are \\(3(2)+2(-1)-4=0\\) and \\(2-(-1)-3=0\\).',marks:2,calculator:'No calculator',command:'Calculate',hint:'Residual = left side − right side.',tags:['quiz','residuals'],check:num(0)},
  {id:'IBAI-1.6-Q14',level:'Quiz',prompt:'A continuous model crosses a target at \\(n=18.24\\). The variable records completed whole periods. Find the first recorded period at or after the crossing.',answer:'\\(19\\)',solution:'The continuous value lies between 18 and 19. The first admissible completed period is 19; a complete solution verifies periods 18 and 19.',marks:2,calculator:'No calculator',command:'Determine',hint:'Use the contextual reporting rule, not ordinary rounding.',tags:['quiz','discrete decision'],check:num(19)}
];

data.exam=[
  {
    id:'IBAI-1.6-E01',style:'Paper 2-style systems task',title:'Event-ticket allocation',calculator:'GDC expected',total_marks:12,
    context:'A school event sells adult, student and child tickets. A total of 300 tickets is sold. Adult tickets cost QAR 40, student tickets cost QAR 25 and child tickets cost QAR 15. Total revenue is QAR 8700. The number of student tickets is twice the number of child tickets.',
    parts:[
      {label:'a',prompt:'Define variables, state appropriate restrictions and form a system of three equations.',marks:4,answer:'Let \\(a,s,c\\) be non-negative integer ticket counts. Then \\(a+s+c=300\\), \\(40a+25s+15c=8700\\), and \\(s=2c\\).',markscheme:'A1 variables and units; A1 non-negative integer restrictions; A1 total-count equation; A1 revenue and relation equations.'},
      {label:'b',prompt:'Record the coefficient order and solve the system.',marks:3,answer:'Using order \\(a,s,c\\), the solution is \\((120,120,60)\\).',markscheme:'M1 consistent coefficient order and appropriate technology; A1 two values; A1 complete triple.'},
      {label:'c',prompt:'Verify the total count, revenue and student-child relation.',marks:3,answer:'\\(120+120+60=300\\), \\(40(120)+25(120)+15(60)=8700\\), and \\(120=2(60)\\).',markscheme:'A1 count; A1 revenue; A1 relation.'},
      {label:'d',prompt:'Explain what a negative ticket count from a correctly entered solver would indicate.',marks:2,answer:'It would violate the non-negativity restriction and indicate that the stated constraints or data are infeasible for ticket counts; the model must be reviewed rather than editing one output.',markscheme:'A1 identifies violation; A1 gives valid implication or response.'}
    ]
  },
  {
    id:'IBAI-1.6-E02',style:'Paper 2-style parameter task',title:'Quadratic calibration',calculator:'GDC expected',total_marks:12,
    context:'A calibration curve is \\(P(t)=at^2+bt+c\\). Measurements give \\(P(0)=4\\), \\(P(2)=18\\) and \\(P(-1)=3\\).',
    parts:[
      {label:'a',prompt:'Form a system of three equations in \\(a,b,c\\).',marks:3,answer:'\\(c=4\\), \\(4a+2b+c=18\\), \\(a-b+c=3\\).',markscheme:'A1 for each correctly substituted condition.'},
      {label:'b',prompt:'Solve for \\(a,b,c\\) and state the calibrated model.',marks:3,answer:'\\(a=2,b=3,c=4\\), so \\(P(t)=2t^2+3t+4\\).',markscheme:'M1 appropriate system method; A1 parameters; A1 model.'},
      {label:'c',prompt:'Determine all real values of \\(t\\) for which \\(P(t)=39\\).',marks:3,answer:'\\(2t^2+3t-35=0=(2t-7)(t+5)\\), so \\(t=3.5\\) or \\(t=-5\\).',markscheme:'M1 forms equation; A1 one root; A1 both roots.'},
      {label:'d',prompt:'If \\(t\\) is elapsed time, state the relevant value and justify your choice.',marks:2,answer:'\\(t=3.5\\), because elapsed time is non-negative.',markscheme:'A1 value; R1 domain justification.'},
      {label:'e',prompt:'State one limitation of using this quadratic far outside the calibration interval.',marks:1,answer:'The measured relationship may not remain quadratic when extrapolated beyond the observed inputs.',markscheme:'A1 relevant modelling limitation.'}
    ]
  },
  {
    id:'IBAI-1.6-E03',style:'Paper 2-style modelling task',title:'Break-even and capacity',calculator:'Graph or polynomial solver expected',total_marks:13,
    context:'A product has revenue \\(R(x)=52x-0.04x^2\\) and cost \\(C(x)=900+18x\\), where \\(x\\) is the number of units and \\(0\\le x\\le700\\).',
    parts:[
      {label:'a',prompt:'Form a polynomial equation for break-even.',marks:2,answer:'\\(52x-0.04x^2=900+18x\\), equivalently \\(0.04x^2-34x+900=0\\).',markscheme:'M1 sets revenue equal to cost; A1 correct polynomial.'},
      {label:'b',prompt:'Find both mathematical break-even roots.',marks:3,answer:'\\(x\\approx27.3507\\) and \\(x\\approx822.6493\\).',markscheme:'M1 appropriate root technology; A1 each root.'},
      {label:'c',prompt:'Determine which roots are admissible in the stated model.',marks:2,answer:'Only \\(x\\approx27.3507\\) lies in \\([0,700]\\); the second root exceeds capacity.',markscheme:'M1 compares with domain; A1 conclusion.'},
      {label:'d',prompt:'Calculate the profit at \\(x=400\\).',marks:2,answer:'\\(R(400)-C(400)=14400-8100=\\text{QAR }6300\\).',markscheme:'M1 substitutes in profit; A1 value and unit.'},
      {label:'e',prompt:'Determine the unit quantity that maximizes profit and the maximum profit.',marks:3,answer:'\\(P(x)=-0.04x^2+34x-900\\) has vertex at \\(x=425\\), with maximum profit QAR 6325.',markscheme:'M1 vertex or technology method; A1 quantity; A1 maximum profit.'},
      {label:'f',prompt:'State one reason the revenue model may fail outside the stated domain.',marks:1,answer:'Demand, price or capacity assumptions may change, so the quadratic could predict unrealistic revenue.',markscheme:'A1 relevant limitation.'}
    ]
  },
  {
    id:'IBAI-1.6-E04',style:'Paper 2-style intersection task',title:'Competing population models',calculator:'GDC expected',total_marks:11,
    context:'Two populations are modelled by \\(A(t)=500(1.12)^t\\) and \\(B(t)=900(1.04)^t\\), where \\(t\\) is measured in years.',
    parts:[
      {label:'a',prompt:'Write an equation whose positive solution gives the time at which the populations are equal.',marks:1,answer:'\\(500(1.12)^t=900(1.04)^t\\).',markscheme:'A1 correct equality.'},
      {label:'b',prompt:'Use technology to determine the continuous intersection time.',marks:3,answer:'\\(t\\approx7.93149\\) years.',markscheme:'M1 transparent graph or numerical method; A1 output; A1 appropriate precision.'},
      {label:'c',prompt:'Find the common population at the intersection.',marks:2,answer:'Approximately \\(1228.41\\).',markscheme:'M1 substitution; A1 value.'},
      {label:'d',prompt:'The populations are recorded at the end of each whole year. Determine the first recorded year for which \\(A>B\\), and verify adjacent years.',marks:3,answer:'Year 8. At year 7, \\(A\\approx1105.34<B\\approx1184.34\\); at year 8, \\(A\\approx1237.98>B\\approx1231.71\\).',markscheme:'M1 discrete decision; A1 year 7 comparison; A1 year 8 conclusion.'},
      {label:'e',prompt:'State one limitation of comparing the populations with constant percentage-growth models.',marks:2,answer:'Growth rates may change because of resources, migration or policy, so long-term extrapolation may be unreliable.',markscheme:'A1 relevant assumption; A1 implication.'}
    ]
  },
  {
    id:'IBAI-1.6-E05',style:'Paper 2-style feasibility task',title:'Resource-package allocation',calculator:'GDC expected',total_marks:13,
    context:'An event uses three package types \\(x,y,z\\). There are 80 packages in total. Their resource costs are 4, 7 and 10 units, and the total resource budget is 500 units. The number of type-x packages is twice the number of type-z packages.',
    parts:[
      {label:'a',prompt:'Define restrictions and form a system of equations.',marks:4,answer:'\\(x,y,z\\) are non-negative integers; \\(x+y+z=80\\), \\(4x+7y+10z=500\\), \\(x=2z\\).',markscheme:'A1 variables/restrictions; A1 total; A1 resource equation; A1 relation.'},
      {label:'b',prompt:'Solve the system.',marks:3,answer:'\\((x,y,z)=(40,20,20)\\).',markscheme:'M1 appropriate technology and order; A1 partial output; A1 triple.'},
      {label:'c',prompt:'Verify all three conditions.',marks:2,answer:'\\(40+20+20=80\\), \\(4(40)+7(20)+10(20)=500\\), and \\(40=2(20)\\).',markscheme:'A1 numerical constraints; A1 relation.'},
      {label:'d',prompt:'If the budget is changed to 480 while the other conditions remain, the solver gives \\((53.333,0,26.667)\\). Comment on feasibility.',marks:3,answer:'The values are non-negative but not integers, so they cannot represent whole packages. The changed constraints have no feasible whole-package solution as stated.',markscheme:'A1 notes non-negativity; A1 identifies integrality failure; A1 contextual conclusion.'},
      {label:'e',prompt:'State one way the allocation model could be refined.',marks:1,answer:'Include capacity, availability or minimum-demand inequalities for each package type.',markscheme:'A1 relevant refinement.'}
    ]
  }
];

if(data.quiz.length!==14)throw new Error(`Lesson 1.6 Quiz expected 14 questions, found ${data.quiz.length}`);
if(data.exam.length!==5)throw new Error(`Lesson 1.6 expected 5 IB tasks, found ${data.exam.length}`);
for(const task of data.exam){
  const total=task.parts.reduce((sum,part)=>sum+part.marks,0);
  if(total!==task.total_marks)throw new Error(`${task.id} mark total ${total} does not equal ${task.total_marks}`);
}
data.assessmentDesign=Object.assign({},data.assessmentDesign,{quizQuestions:14,extendedTasks:5,quizSuggestedMinutes:30});
data.bankBridge={course:'ib-math-ai',unit:1,lesson:'1.6',skillKeys:data.lesson.skill_keys,visibility:'authenticated-school-access',embeddedPrivatePrompts:false};
data.v6Audit.actualQuiz=data.quiz.length;
data.v6Audit.actualTasks=data.exam.length;
})();
