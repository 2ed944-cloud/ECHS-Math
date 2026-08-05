(function(){
'use strict';
const data=window.LESSON_DATA;if(!data||String(data.lesson?.number)!=='1.6')return;
const questions=[];
const clean=n=>Math.abs(n)<1e-12?0:Number(n);
const signed=(c,v,first=false)=>{
  c=clean(c);if(c===0)return '';
  const sign=c<0?'-':first?'':'+';
  const mag=Math.abs(c)===1?'':Math.abs(c);
  return `${sign}${mag}${v}`;
};
const eq2=(a,b,c)=>`${signed(a,'x',true)}${signed(b,'y')}=${clean(c)}`;
const eq3=(a,b,c,d)=>`${signed(a,'x',true)}${signed(b,'y')}${signed(c,'z')}=${clean(d)}`;
const add=(level,prompt,answer,solution,check,extra={})=>{
  const id=`IBAI-1.6-P${String(questions.length+1).padStart(3,'0')}`;
  questions.push(Object.assign({id,level,prompt,answer,solution,marks:level==='Foundation'?2:level==='Application'?3:level==='Reasoning'?3:4,calculator:level==='Foundation'?'GDC allowed / verify independently':'GDC expected',command:'Determine',hint:'Record the mathematical entry and verify the result.',tags:[level.toLowerCase(),'technology','verification'],check},extra));
};
const num=(value,tolerance=1e-6)=>({mode:'number',value,tolerance});
const choice=(choices,correct)=>({choices,correct});

// 24 Foundation questions: exact 2×2 systems, polynomial roots and classification.
[
  [2,1,1,-1,4,3,'x'],[3,2,1,1,4,2,'y'],[5,-2,3,1,3,2,'x'],[4,3,2,-1,2,-2,'y'],[1,2,3,-1,5,2,'x'],
  [2,-3,5,1,1,-2,'y'],[6,1,2,-1,2,3,'x'],[3,-4,1,2,-2,1,'y'],[7,2,3,-5,1,4,'x'],[2,5,4,-1,3,-1,'y']
].forEach(([a,b,c,d,x,y,target],i)=>{
  const r1=a*x+b*y,r2=c*x+d*y,value=target==='x'?x:y;
  add('Foundation',`Solve \\(${eq2(a,b,r1)}\\) and \\(${eq2(c,d,r2)}\\). Enter \\(${target}\\).`,`\\(${value}\\)`,`The common solution is \\((x,y)=(${x},${y})\\). Substitution gives both stated constants.`,num(value),{command:'Calculate',tags:['foundation','2x2 system','substitution']});
});
[
 ['Find the greatest real root of \\(x^2-7x+12=0\\).',4,'\\((x-3)(x-4)=0\\).'],
 ['Find the smallest real root of \\(x^2+x-12=0\\).',-4,'\\((x+4)(x-3)=0\\).'],
 ['Find the positive root of \\(2x^2-5x-3=0\\).',3,'\\((2x+1)(x-3)=0\\).'],
 ['Find the repeated root of \\(x^2-10x+25=0\\).',5,'\\((x-5)^2=0\\).'],
 ['The roots of \\(x^2-2x-15=0\\) are added. Find the sum.',2,'The roots are \\(-3\\) and \\(5\\), so their sum is 2.'],
 ['Find the largest root of \\(x^3-6x^2+11x-6=0\\).',3,'\\((x-1)(x-2)(x-3)=0\\).'],
 ['Find the smallest root of \\(x^3+2x^2-x-2=0\\).',-2,'\\((x+2)(x-1)(x+1)=0\\).'],
 ['Find the largest real root of \\(x^4-5x^2+4=0\\).',2,'Let \\(u=x^2\\): \\((u-1)(u-4)=0\\), so roots are \\(\\pm1,\\pm2\\).']
].forEach(([prompt,value,solution])=>add('Foundation',prompt,`\\(${value}\\)`,solution,num(value),{command:'Calculate',tags:['foundation','polynomial roots']}));
[
 ['\\(y=2x+1\\) and \\(y=-x+7\\)','Unique',0,'Different gradients give one intersection.'],
 ['\\(y=3x-2\\) and \\(y=3x+5\\)','No solution',1,'Equal gradients and different intercepts give parallel distinct lines.'],
 ['\\(2x+4y=8\\) and \\(x+2y=4\\)','Infinitely many',2,'The first equation is twice the second.'],
 ['\\(4x-2y=6\\) and \\(2x-y=5\\)','No solution',1,'Doubling the second gives \\(4x-2y=10\\), contradicting the first.'],
 ['\\(x-y=3\\) and \\(2x+y=9\\)','Unique',0,'The equations are independent.'],
 ['\\(6x+3y=12\\) and \\(2x+y=4\\)','Infinitely many',2,'The first equation is three times the second.']
].forEach(([system,answer,correct,solution])=>add('Foundation',`Classify the system ${system}.`,answer,solution,null,Object.assign({command:'Classify',tags:['foundation','system classification']},choice(['Unique','No solution','Infinitely many'],correct))));

// 24 Application questions: 3×3 systems, parameter fitting, contexts and numerical intersections.
[
  [[[1,1,1],[2,-1,1],[1,3,-2]],[3,2,7],'z'],
  [[[2,1,-1],[1,-2,3],[3,1,2]],[2,1,-1],'x'],
  [[[1,2,0],[0,1,3],[2,-1,1]],[4,2,1],'y'],
  [[[3,0,2],[1,-1,1],[2,4,-1]],[1,3,2],'z'],
  [[[1,-1,2],[2,3,1],[-1,2,4]],[-2,1,3],'x'],
  [[[4,1,0],[0,2,-1],[1,1,1]],[2,-1,4],'z'],
  [[[2,-3,1],[1,2,2],[3,1,-1]],[3,2,-1],'y'],
  [[[1,0,2],[2,-1,1],[-1,3,2]],[5,2,-1],'x']
].forEach(([A,s,target])=>{
  const b=A.map(row=>row.reduce((sum,c,j)=>sum+c*s[j],0));
  const text=A.map((row,i)=>`\\(${eq3(row[0],row[1],row[2],b[i])}\\)`).join(', ');
  const j={x:0,y:1,z:2}[target],value=s[j];
  add('Application',`Solve the 3×3 system ${text}. Enter \\(${target}\\).`,`\\(${value}\\)`,`Using the consistent order \\(x,y,z\\), the solution is \\(( ${s.join(', ')} )\\). Verify all three rows.`,num(value),{command:'Calculate',tags:['application','3x3 system','coefficient order']});
});
[
 ['A line \\(L(x)=mx+c\\) passes through \\((3,17)\\) and \\((-2,-8)\\). Find \\(m\\).',5,'Solve \\(3m+c=17\\), \\(-2m+c=-8\\); subtraction gives \\(m=5\\).'],
 ['A line \\(L(x)=mx+c\\) passes through \\((1,7)\\) and \\((4,19)\\). Find \\(c\\).',3,'The slope is 4, then \\(4+c=7\\), so \\(c=3\\).'],
 ['For \\(P(x)=ax^2+bx+c\\), \\(P(0)=4\\), \\(P(2)=18\\), \\(P(-1)=3\\). Find \\(a\\).',2,'The system gives \\(a=2,b=3,c=4\\).'],
 ['For \\(P(x)=ax^2+bx+c\\), \\(P(0)=5\\), \\(P(1)=4\\), \\(P(2)=5\\). Find \\(b\\).',-2,'The system gives \\(P(x)=x^2-2x+5\\).'],
 ['For \\(P(x)=ax^2+bx+c\\), \\(P(0)=2\\), \\(P(1)=5\\), \\(P(3)=5\\). Find \\(a\\).',-1,'The fitted model is \\(-x^2+4x+2\\).'],
 ['A quadratic \\(Q(x)=ax^2+bx+c\\) has \\(Q(0)=1\\), \\(Q(1)=6\\), \\(Q(2)=15\\). Find \\(b\\).',3,'Solving gives \\(Q(x)=2x^2+3x+1\\).']
].forEach(([prompt,value,solution])=>add('Application',prompt,`\\(${value}\\)`,solution,num(value),{tags:['application','parameter fitting']}));
[
 ['Adult tickets cost QAR 30 and student tickets QAR 18. A total of 220 tickets earns QAR 5160. Find the adult count.',100,'Solve \\(a+s=220\\), \\(30a+18s=5160\\).'],
 ['A 40 L mixture uses ingredients costing QAR 8/L and QAR 5/L and costs QAR 260. Find litres of the QAR 8/L ingredient.',20,'Solve \\(A+B=40\\), \\(8A+5B=260\\).'],
 ['Plans cost \\(C_1=120+0.35m\\) and \\(C_2=75+0.50m\\). Find break-even usage \\(m\\).',300,'Set the costs equal and solve.'],
 ['A rectangle has perimeter 54 cm and length 3 cm more than width. Find the width.',12,'Use \\(2L+2W=54\\), \\(L=W+3\\).'],
 ['Counts satisfy \\(A+B+C=140\\), \\(12A+18B+25C=2430\\), \\(A-C=20\\). Find \\(B\\).',60,'The solution is \\((A,B,C)=(50,60,30)\\).'],
 ['A budget system is \\(x+y+z=80\\), \\(4x+7y+10z=500\\), \\(x=2z\\). Find \\(y\\).',20,'The solution is \\((40,20,20)\\).']
].forEach(([prompt,value,solution])=>add('Application',prompt,`\\(${value}\\)`,solution,num(value),{tags:['application','context model','systems']}));
[
 ['Solve \\(5x+12=80(0.9)^x\\) for \\(x\\ge0\\).',6.0544313015,'Graph both sides or solve their difference; verify the two values agree.',0.005],
 ['Solve \\(3x+10=60(0.88)^x\\) for \\(x\\ge0\\).',5.9793267586,'Use a broad graph window, then a numerical intersection.',0.005],
 ['Populations satisfy \\(A=500(1.12)^t\\), \\(B=900(1.04)^t\\). Find when they are equal.',7.9314903352,'Solve \\((1.12/1.04)^t=1.8\\) or use graph intersection.',0.005],
 ['For \\(h=-4.9t^2+18t+1.5\\), find the positive time when \\(h=0\\).',3.7549934837,'Use a polynomial solver and retain the positive root.',0.005]
].forEach(([prompt,value,solution,tol])=>add('Application',prompt,`\\(${Number(value.toFixed(5))}\\)`,solution,num(value,tol),{tags:['application','numerical intersection','domain']}));

// 24 Reasoning questions: verification, completeness, multiplicity, domain and tolerance.
[
 ['A solver returns \\(x=2.0000001\\) for an exact integer system and exact substitution supports 2. What should be reported?',2,'Report 2; the tiny discrepancy is numerical.'],
 ['Residuals are \\(2\times10^{-5}\\) and \\(-1\times10^{-5}\\). Find the maximum absolute residual.',0.00002,'Take the larger absolute value.'],
 ['A degree-4 solver lists roots \\(2,2,-1,4\\). How many distinct real roots are shown?',3,'Root 2 repeats, so the distinct values are -1, 2 and 4.'],
 ['A contextual quadratic gives times \\(-3\\) and \\(7\\). Enter the admissible elapsed time.',7,'Elapsed time is non-negative.'],
 ['A continuous threshold occurs at period \\(11.67\\). Enter the first whole period at or after the crossing.',12,'The first admissible whole period is 12; verify periods 11 and 12.'],
 ['A root list is \\(-2,1,5\\) for a monic cubic. Find \\(p(0)\\).',10,'\\(p(x)=(x+2)(x-1)(x-5)\\), so \\(p(0)=10\\).'],
 ['For \\(p(x)=x^3-6x^2+11x-6\\), find the sum of the real roots.',6,'The roots are 1, 2 and 3.'],
 ['A solver gives \\(z=-4\\) where variables are quantities. Enter 1 if feasible and 0 if infeasible.',0,'A negative quantity violates non-negativity.']
].forEach(([prompt,value,solution])=>add('Reasoning',prompt,`\\(${value}\\)`,solution,num(value,Math.abs(value)<0.001?5e-6:1e-6),{tags:['reasoning','verification','constraints']}));
[
 ['A graph window shows no intersection. Does this prove no real solution?','No',1,'A poor window can hide intersections.'],
 ['Two equations are scalar multiples. Which classification applies?','Dependent',2,'They describe the same line and have infinitely many solutions.'],
 ['Two lines have the same gradient and different intercepts. Which classification applies?','Inconsistent',1,'They are parallel and distinct.'],
 ['A repeated root has even multiplicity. How does the graph usually meet the x-axis?','Touches and turns',2,'Even multiplicity produces tangency rather than crossing.'],
 ['A solver repeatedly converges to one root from one initial guess. Is the root set necessarily complete?','No',1,'Use other guesses, a table, graph scan or algebraic structure.'],
 ['A candidate has zero residuals for the equations entered. Does this prove the word model was translated correctly?','No',1,'Residuals cannot detect a wrong model entry.'],
 ['A degree-3 polynomial has how many complex roots counted with multiplicity?','Three',2,'The Fundamental Theorem of Algebra gives three.'],
 ['A missing \\(y\\)-term in \\(3x+2z=17\\) should be entered with which coefficient?','Zero',0,'The coefficient row is \\([3,0,2\mid17]\\).']
].forEach(([prompt,answer,correct,solution])=>add('Reasoning',prompt,answer,solution,null,Object.assign({command:'Explain',tags:['reasoning','technology judgement']},choice(['Zero','No','Three','Dependent','Inconsistent','Touches and turns'],correct))));
[
 ['A model is reported to 3 decimal places. Which residual is clearly smaller than half a unit in the last reported place?','\\(2\times10^{-5}\\)',0],
 ['Which evidence best checks a 3×3 solution?','Substitute the triple into all three original equations',1],
 ['Which action best protects against a hidden tangent root?','Inspect the graph and use a polynomial-root tool',2],
 ['Which statement distinguishes fitting from validation?','Fitting satisfies supplied conditions; validation tests suitability and other evidence',3],
 ['Which reporting rule answers “first whole period above a target”?','Use the ceiling-type decision and verify adjacent periods',4],
 ['Which record makes technology use reproducible?','Equations, variable order or window, full output, verification and conclusion',5],
 ['Which response to a negative ticket count is valid?','Conclude the constraints or data are infeasible, then review the model',6],
 ['Which root statement is complete for \\((x-2)^2(x+1)=0\\)?','\\(x=-1\\) once and \\(x=2\\) with multiplicity 2',7]
].forEach(([prompt,answer,correct])=>{
  const choices=[
    '\\(2\\times10^{-5}\\)','Substitute the triple into all three original equations','Inspect the graph and use a polynomial-root tool',
    'Fitting satisfies supplied conditions; validation tests suitability and other evidence','Use the ceiling-type decision and verify adjacent periods',
    'Equations, variable order or window, full output, verification and conclusion','Conclude the constraints or data are infeasible, then review the model',
    '\\(x=-1\\) once and \\(x=2\\) with multiplicity 2'
  ];
  add('Reasoning',prompt,answer,'The selected statement supplies the required verification or interpretation.',null,Object.assign({command:'Select',tags:['reasoning','evidence chain']},choice(choices,correct)));
});

// 24 Challenge questions: advanced systems, roots, intersections and modelling decisions.
[
  [[[2,1,-1],[1,-2,3],[3,-1,2]],[4,-2,1],'x'],
  [[[1,3,2],[2,-1,1],[-1,2,4]],[-1,3,2],'z'],
  [[[4,0,-1],[2,3,1],[1,-2,5]],[2,1,-3],'y'],
  [[[3,2,1],[-1,4,2],[2,-3,3]],[1,-2,4],'z'],
  [[[2,-1,4],[3,2,-2],[1,5,1]],[-2,3,1],'x'],
  [[[5,1,0],[0,3,2],[2,-1,4]],[1,-2,3],'y']
].forEach(([A,s,target])=>{
  const b=A.map(row=>row.reduce((sum,c,j)=>sum+c*s[j],0));
  const text=A.map((row,i)=>`\\(${eq3(row[0],row[1],row[2],b[i])}\\)`).join(', ');
  const j={x:0,y:1,z:2}[target],value=s[j];
  add('Challenge',`Solve ${text}. Enter \\(${target}\\), then verify all equations.`,`\\(${value}\\)`,`The consistent coefficient order gives solution \\(( ${s.join(', ')} )\\).`,num(value),{tags:['challenge','3x3 system']});
});
[
 ['Find the largest real root of \\(x^4-6x^3+7x^2+6x-8=0\\).',4,'\\((x-4)(x-2)(x-1)(x+1)=0\\).'],
 ['Find the sum of absolute values of all real roots of \\(x^4-10x^2+9=0\\).',8,'Roots are \\(\\pm1,\\pm3\\).'],
 ['Find the multiplicity of root 2 in \\(x^3-3x^2+4=0\\).',2,'\\((x-2)^2(x+1)=0\\).'],
 ['Find the greatest real root of \\(x^4-13x^2+36=0\\).',3,'Let \\(u=x^2\\); roots are \\(\\pm2,\\pm3\\).'],
 ['Find the smallest root of \\(x^3+4x^2+x-6=0\\).',-3,'\\((x+3)(x-1)(x+2)=0\\).'],
 ['A degree-5 polynomial has real roots \\(-2,1,1,4,4\\). Find the number of distinct x-intercepts.',3,'Repeated roots count once as distinct intercepts.']
].forEach(([prompt,value,solution])=>add('Challenge',prompt,`\\(${value}\\)`,solution,num(value),{tags:['challenge','polynomial roots','multiplicity']}));
[
 ['Solve \\(120(1.07)^t=500+20t\\) for the positive intersection.',33.7115320349,0.05,'Use a broad scan before numerical refinement.'],
 ['For \\(h=-4.9t^2+22t+1.8\\), find the positive ground time.',4.5701751009,0.005,'Select the positive polynomial root.'],
 ['A box has dimensions \\(x+2,x,x-1\\) and volume 240. Find the physically valid \\(x\\).',6,0.001,'Solve \\((x+2)x(x-1)=240\\) with \\(x>1\\).'],
 ['Solve \\(2^x=30\\) using a numerical or logarithmic method.',4.9068905956,0.005,'Verify \\(2^x\\) is approximately 30.'],
 ['Find the first positive solution of \\(x=8\cos x\\) in radians.',1.390029729,0.005,'Use a graph scan and a numerical intersection.'],
 ['Solve \\(e^{-0.3t}=0.2\\) for \\(t\\).',5.3647930414,0.005,'Take logarithms or use a numerical solver.']
].forEach(([prompt,value,tol,solution])=>add('Challenge',prompt,`\\(${Number(value.toFixed(5))}\\)`,solution,num(value,tol),{tags:['challenge','numerical equation','domain']}));
[
 ['A café system gives \\(A=50,B=60,C=30\\). Revenue is \\(12A+18B+25C\\). Find the revenue.',2430,'Substitute all three values.'],
 ['A monic cubic has roots \\(-2,3,5\\). Find its constant term.',30,'At \\(x=0\\), \\(p(0)=2(-3)(-5)=30\\).'],
 ['For profit \\(P(x)=34x-0.04x^2-900\\), find the maximizing \\(x\\).',425,'The vertex is at \\(-b/(2a)=425\\).'],
 ['Break-even roots are 27.3507 and 822.6493 with capacity \\(0\\le x\\le700\\). How many admissible roots remain?',1,'Only the first root lies in the domain.'],
 ['A continuous threshold is 27.3507 units and the question asks for the first whole unit after crossing. Enter the reported value.',28,'Use the first admissible integer above the crossing and verify 27 and 28.'],
 ['Residuals are \\(-0.002,0.006,-0.004\\). Find the maximum absolute residual.',0.006,'The maximum magnitude is 0.006.']
].forEach(([prompt,value,solution])=>add('Challenge',prompt,`\\(${value}\\)`,solution,num(value,Math.abs(value)<0.01?0.0005:1e-6),{tags:['challenge','model verification','decision']}));

if(questions.length!==96)throw new Error(`Lesson 1.6 Practice expected 96 questions, found ${questions.length}`);
data.practice=questions;
data.assessmentDesign=Object.assign({},data.assessmentDesign,{practiceLevels:{Foundation:24,Application:24,Reasoning:24,Challenge:24},calculatorPolicy:'Technology is integrated, but every output requires transparent entry, verification and interpretation.'});
data.v6Audit.actualPractice=questions.length;
})();
