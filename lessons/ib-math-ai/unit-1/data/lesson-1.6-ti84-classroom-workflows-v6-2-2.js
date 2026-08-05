(function(){
'use strict';

const data=window.LESSON_DATA;
if(!data||String(data.lesson?.number)!=='1.6')return;

const workflows={
  'system-2x2':{
    code:'A1',group:'Systems',title:'2×2 system · elimination and TI‑84 RREF',
    prompt:'Solve 2x + y = 11 and x − y = 1.',
    math:'\\begin{cases}2x+y=11\\\\x-y=1\\end{cases}',
    manualSteps:[
      'Write the equations in the same variable order: x, y.',
      'Add the equations: (2x+y)+(x−y)=11+1, so 3x=12.',
      'Therefore x=4. Substitute into x−y=1 to obtain y=3.',
      'State the ordered pair and verify it in both original equations.'
    ],
    tiSteps:[
      {keys:['2nd','x⁻¹'],label:'Open MATRIX',detail:'Use the MATRIX menu, then move to EDIT.'},
      {keys:['→','→','1'],label:'Edit matrix [A]',detail:'Choose [A] and set its dimensions to 2 rows by 3 columns.'},
      {keys:['2','ENTER','3','ENTER'],label:'Set 2×3 dimensions',detail:'The final column is the constants column.'},
      {keys:['2','1','11','1','−1','1'],label:'Enter the augmented matrix',detail:'Enter rows [2, 1 | 11] and [1, −1 | 1].'},
      {keys:['2nd','MODE'],label:'Return to the home screen',detail:'QUIT keeps matrix [A] stored.'},
      {keys:['2nd','x⁻¹','MATH','rref(','2nd','x⁻¹','[A]',')','ENTER'],label:'Calculate rref([A])',detail:'Read the last column of the reduced matrix.'}
    ],
    entry:'[A]=\\begin{bmatrix}2&1&11\\\\1&-1&1\\end{bmatrix}',
    output:'\\operatorname{rref}([A])=\\begin{bmatrix}1&0&4\\\\0&1&3\\end{bmatrix}',
    verification:'2(4)+3=11 and 4−3=1, so both residuals are zero.',
    ibStatement:'Using rref on the augmented matrix in the order x, y gives x=4 and y=3. Substitution satisfies both original equations, so (4,3) is the unique solution.',
    handheldAlternative:'Fast handheld route: APPS → PlySmlt2 → Simultaneous Eqn Solver → 2 equations → 2 unknowns → enter the same coefficient rows → SOLVE.'
  },
  'system-3x3':{
    code:'B1',group:'Systems',title:'3×3 contextual system · manual reduction and TI‑84',
    prompt:'An event sells 300 adult, student and child tickets. Adult tickets cost QAR 40, student tickets QAR 25 and child tickets QAR 15. Revenue is QAR 8700 and s=2c. Find a, s and c.',
    math:'\\begin{cases}a+s+c=300\\\\40a+25s+15c=8700\\\\s=2c\\end{cases}',
    manualSteps:[
      'Use s=2c in a+s+c=300 to obtain a+3c=300, hence a=300−3c.',
      'Substitute a=300−3c and s=2c into the revenue equation.',
      '40(300−3c)+25(2c)+15c=8700, so 12000−55c=8700.',
      'Thus c=60, s=120 and a=120. Check the total and revenue.'
    ],
    tiSteps:[
      {keys:['APPS'],label:'Open the applications list',detail:'On the handheld, choose PlySmlt2 if installed.'},
      {keys:['PlySmlt2'],label:'Choose Simultaneous Eqn Solver',detail:'Select 3 equations and 3 unknowns.'},
      {keys:['NEXT'],label:'Open the coefficient editor',detail:'Keep the variable order a, s, c in every row.'},
      {keys:['1','1','1','300'],label:'Enter row 1',detail:'a+s+c=300.'},
      {keys:['40','25','15','8700'],label:'Enter row 2',detail:'40a+25s+15c=8700.'},
      {keys:['0','1','−2','0'],label:'Enter row 3',detail:'s=2c becomes 0a+s−2c=0.'},
      {keys:['SOLVE'],label:'Solve and read a, s, c',detail:'The order shown matches the chosen variable order.'}
    ],
    entry:'\\begin{bmatrix}1&1&1&300\\\\40&25&15&8700\\\\0&1&-2&0\\end{bmatrix}',
    output:'a=120,\\qquad s=120,\\qquad c=60',
    verification:'120+120+60=300, 40(120)+25(120)+15(60)=8700 and 120=2(60).',
    ibStatement:'Solving the three-variable system in the order a, s, c gives (120,120,60). The values satisfy all three conditions, so the event sold 120 adult, 120 student and 60 child tickets.',
    handheldAlternative:'If PlySmlt2 is unavailable in the web simulator, enter the 3×4 augmented matrix and use rref([A]); students can still use PlySmlt2 on their physical TI‑84 Plus CE.'
  },
  'cubic-roots':{
    code:'C1',group:'Polynomials',title:'Cubic roots · factor manually and locate zeros on TI‑84',
    prompt:'Solve x³ − 4x² − x + 4 = 0.',
    math:'x^3-4x^2-x+4=0',
    manualSteps:[
      'Group the terms: x²(x−4)−1(x−4).',
      'Factor the common binomial: (x²−1)(x−4).',
      'Use the difference of squares: (x−1)(x+1)(x−4)=0.',
      'Therefore x=−1, 1 or 4. Substitute or expand to verify completeness.'
    ],
    tiSteps:[
      {keys:['Y='],label:'Open the function editor',detail:'Clear old functions first.'},
      {keys:['X³','−','4X²','−','X','+','4'],label:'Enter Y₁=x³−4x²−x+4',detail:'Use the X,T,θ,n key for x.'},
      {keys:['ZOOM','6'],label:'Use ZStandard',detail:'Check that all three intercepts are visible; widen the window if necessary.'},
      {keys:['2nd','TRACE','2:zero'],label:'Select zero',detail:'Choose a left bound, right bound and guess around the first intercept.'},
      {keys:['ENTER','ENTER','ENTER'],label:'Record the first zero',detail:'Repeat the zero command near each remaining intercept.'},
      {keys:['repeat'],label:'Audit the complete root list',detail:'A cubic must account for three roots counted with multiplicity.'}
    ],
    entry:'Y_1=x^3-4x^2-x+4',
    output:'x=-1,\\qquad x=1,\\qquad x=4',
    verification:'(x−4)(x−1)(x+1) expands to x³−4x²−x+4, and each reported value makes the polynomial zero.',
    ibStatement:'The TI‑84 zero command gives x=−1, 1 and 4. Factorization as (x−4)(x−1)(x+1) verifies all three roots and confirms the list is complete.',
    handheldAlternative:'Fast handheld route: APPS → PlySmlt2 → Polynomial Root Finder → ORDER 3 → enter coefficients 1, −4, −1, 4 → SOLVE.'
  },
  'exact-intersections':{
    code:'C2',group:'Graphs',title:'Two intersections · exact algebra and TI‑84 intersect',
    prompt:'Find the intersections of y=2x+1 and y=x²−3.',
    math:'2x+1=x^2-3',
    manualSteps:[
      'Set the functions equal: x²−3=2x+1.',
      'Rearrange to x²−2x−4=0.',
      'Use the quadratic formula: x=1±√5.',
      'Substitute into y=2x+1 to obtain the two exact intersection points.'
    ],
    tiSteps:[
      {keys:['Y='],label:'Enter both functions',detail:'Set Y₁=2x+1 and Y₂=x²−3.'},
      {keys:['ZOOM','6'],label:'Graph in a standard window',detail:'Confirm that both crossings are visible.'},
      {keys:['2nd','TRACE','5:intersect'],label:'Open Intersect',detail:'Select the first curve, the second curve and a guess near the left crossing.'},
      {keys:['ENTER','ENTER','ENTER'],label:'Record the left intersection',detail:'The calculator reports both x and y.'},
      {keys:['2nd','TRACE','5:intersect'],label:'Repeat near the right crossing',detail:'Move the guess near the second point before pressing ENTER.'}
    ],
    entry:'Y_1=2x+1,\\qquad Y_2=x^2-3',
    output:'(-1.236068,-1.472136)\\quad\\text{and}\\quad(3.236068,7.472136)',
    verification:'The x-values equal 1±√5 approximately, and each reported point satisfies both equations.',
    ibStatement:'Graphing Y₁=2x+1 and Y₂=x²−3 and applying Intersect near each crossing gives approximately (−1.236,−1.472) and (3.236,7.472). Algebra gives the exact x-values 1±√5.',
    handheldAlternative:'The graph method is the same on the physical TI‑84 Plus CE and the embedded simulator: Y= → ZOOM 6 → 2nd TRACE → Intersect.'
  },
  'numerical-intersection':{
    code:'C3',group:'Graphs',title:'Numerical model · graph, bracket and verify',
    prompt:'Solve 5x+12=80(0.9)^x for x≥0.',
    math:'5x+12=80(0.9)^x,\\qquad x\\ge0',
    manualSteps:[
      'Define h(x)=5x+12−80(0.9)^x and state the domain x≥0.',
      'Use a table or trial values to bracket a sign change between nearby x-values.',
      'A closed-form elementary solution is not expected; use technology to refine the root.',
      'Substitute the reported x-value into both sides and compare them.'
    ],
    tiSteps:[
      {keys:['Y='],label:'Enter the two model functions',detail:'Set Y₁=5x+12 and Y₂=80(0.9)^x.'},
      {keys:['WINDOW'],label:'Choose a contextual window',detail:'For example, use x from 0 to 15 and a y-range that contains both models.'},
      {keys:['GRAPH'],label:'Inspect the number of relevant crossings',detail:'Widen the window once to check that no other x≥0 intersection is hidden.'},
      {keys:['2nd','TRACE','5:intersect'],label:'Apply Intersect',detail:'Choose both curves and guess near the visible crossing.'},
      {keys:['ENTER','ENTER','ENTER'],label:'Record x and y with guard digits',detail:'Keep more digits than the final answer requires.'}
    ],
    entry:'Y_1=5x+12,\\qquad Y_2=80(0.9)^x,\\qquad 0\\le x\\le15',
    output:'x\\approx6.05443,\\qquad y\\approx42.2722',
    verification:'5(6.05443)+12≈42.2722 and 80(0.9)^6.05443≈42.2722, so the residual is close to zero.',
    ibStatement:'Using a graph window 0≤x≤15, the TI‑84 Intersect command gives x≈6.05443. Substitution makes both sides approximately 42.2722, so the non-negative solution is valid.',
    handheldAlternative:'The window and domain are part of the method. A screenshot without the entered functions and window does not communicate a reproducible solution.'
  },
  'rounded-rref':{
    code:'D1',group:'Verification',title:'Rounded solver output · exact elimination, RREF and residuals',
    prompt:'Solve 5x−2y=4 and 3x+y=13, then judge a six-decimal output.',
    math:'\\begin{cases}5x-2y=4\\\\3x+y=13\\end{cases}',
    manualSteps:[
      'From 3x+y=13, write y=13−3x.',
      'Substitute: 5x−2(13−3x)=4, so 11x=30 and x=30/11.',
      'Then y=13−90/11=53/11.',
      'Convert only at the end: x≈2.727273 and y≈4.818182.'
    ],
    tiSteps:[
      {keys:['2nd','x⁻¹','EDIT','[A]'],label:'Enter a 2×3 augmented matrix',detail:'Rows are [5, −2 | 4] and [3, 1 | 13].'},
      {keys:['2nd','MODE'],label:'Quit the editor',detail:'The matrix remains stored as [A].'},
      {keys:['2nd','x⁻¹','MATH','rref(','[A]',')'],label:'Calculate rref([A])',detail:'Read the exact or decimal values from the last column.'},
      {keys:['ENTER'],label:'Record guard digits',detail:'Do not round inside a later substitution.'},
      {keys:['HOME'],label:'Calculate both residuals',detail:'Evaluate 5x−2y−4 and 3x+y−13 using the stored values.'}
    ],
    entry:'[A]=\\begin{bmatrix}5&-2&4\\\\3&1&13\\end{bmatrix}',
    output:'x=\\frac{30}{11}\\approx2.727273,\\qquad y=\\frac{53}{11}\\approx4.818182',
    verification:'Using the six-decimal values, both residuals have magnitude below 5×10⁻⁷; the exact fractions satisfy both equations exactly.',
    ibStatement:'RREF gives x=30/11 and y=53/11, or approximately 2.727273 and 4.818182. Both residuals are negligible at six-decimal precision, confirming the rounded pair.',
    handheldAlternative:'Use exact fractions when the calculator displays them; retain guard digits when the question requires a decimal answer.'
  }
};

window.ECHS_TI84_CLASSROOM_WORKFLOWS=workflows;
data.ti84Classroom={
  release:'6.2.2',simulator:'https://ti84calc.com/ti84calc',workflowCount:Object.keys(workflows).length,
  modes:['teacher','follow','drill'],pairedMethod:'manual → TI-84 → verify → IB conclusion',
  mappedSlides:[
    'Opening problem · can every calculator answer be trusted?',
    'Worked example · solve and verify a 2×2 system',
    'Coefficient order is part of the mathematics',
    'Worked example · all real roots of a cubic',
    'Worked example · exact intersections',
    'Student turn · numerical intersection and graph window',
    'Worked example · verify a rounded system solution'
  ],
  thirdPartySimulator:true,physicalCalculatorPractice:true,
  officialBasis:['TI-84 Plus CE eGuide','PlySmlt2 example activities','TI-84 graph and matrix workflows']
};
})();
