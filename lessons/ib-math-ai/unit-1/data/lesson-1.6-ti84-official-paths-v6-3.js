(function(){
'use strict';
const data=window.LESSON_DATA;
const workflows=window.ECHS_TI84_CLASSROOM_WORKFLOWS;
if(!data||String(data.lesson?.number)!=='1.6'||!workflows)return;
const step=(keys,label,detail)=>({keys,label,detail});

workflows['system-2x2'].tiSteps=[
  step(['2nd','x⁻¹ (MATRIX)'],'Open the MATRIX menu','The blue 2nd function above x⁻¹ is MATRIX.'),
  step(['→','→','1:[A]'],'Open EDIT and choose [A]','The MATRIX tabs are NAMES, MATH and EDIT. Move right twice, then choose 1:[A].'),
  step(['2','ENTER','3','ENTER'],'Set the dimensions to 2×3','Use two rows and three columns because the last column stores the constants.'),
  step(['2','ENTER','1','ENTER','11','ENTER','1','ENTER','(−)','1','ENTER','1','ENTER'],'Enter the augmented matrix','Enter [2,1|11] and [1,−1|1]. Use the (−) key for a negative coefficient.'),
  step(['2nd','MODE (QUIT)'],'Return to the home screen','QUIT leaves matrix [A] stored.'),
  step(['2nd','x⁻¹ (MATRIX)','→ (MATH)','↓ to rref(','ENTER'],'Paste rref(','Open MATRIX, move once to MATH, scroll to rref( and press ENTER.'),
  step(['2nd','x⁻¹ (MATRIX)','1:[A]',')','ENTER'],'Evaluate rref([A])','The last column of the reduced matrix gives x=4 and y=3.')
];
workflows['system-2x2'].handheldAlternative='Official matrix route: 2nd MATRIX → EDIT → [A] → enter the 2×3 augmented matrix → QUIT → 2nd MATRIX → MATH → rref( → [A] → ENTER. If PlySmlt2 is installed, it may be used as a second check.';

workflows['system-3x3'].tiSteps=[
  step(['2nd','x⁻¹ (MATRIX)'],'Open the MATRIX menu','Use an augmented matrix so the route is available even when an App is disabled or absent.'),
  step(['→','→','1:[A]'],'Open EDIT and choose [A]','Keep the variable order a, s, c in every row.'),
  step(['3','ENTER','4','ENTER'],'Set the dimensions to 3×4','Three equations require three rows; the fourth column stores constants.'),
  step(['1','ENTER','1','ENTER','1','ENTER','300','ENTER'],'Enter row 1','Enter a+s+c=300 as [1,1,1|300].'),
  step(['40','ENTER','25','ENTER','15','ENTER','8700','ENTER'],'Enter row 2','Enter 40a+25s+15c=8700.'),
  step(['0','ENTER','1','ENTER','(−)','2','ENTER','0','ENTER'],'Enter row 3','Rewrite s=2c as 0a+s−2c=0.'),
  step(['2nd','MODE (QUIT)'],'Return to the home screen','Matrix [A] remains stored.'),
  step(['2nd','x⁻¹ (MATRIX)','→ (MATH)','↓ to rref(','ENTER','2nd','x⁻¹ (MATRIX)','1:[A]',')','ENTER'],'Evaluate rref([A])','Read a=120, s=120 and c=60 from the last column.')
];
workflows['system-3x3'].handheldAlternative='Optional App check: APPS → PlySmlt2 → Simultaneous Equation Solver. Select 3 equations and 3 unknowns, preserve the order a,s,c, then enter the same coefficients. The matrix route above is the fully reproducible core method.';

workflows['cubic-roots'].tiSteps=[
  step(['Y='],'Open the function editor','Clear any old functions that could obscure the graph.'),
  step(['X,T,θ,n','^','3','−','4','X,T,θ,n','x²','−','X,T,θ,n','+','4'],'Enter Y₁=x³−4x²−x+4','Use the X,T,θ,n key for x and check every sign before graphing.'),
  step(['ZOOM','6:ZStandard','GRAPH'],'Display the graph','Confirm that the relevant intercepts are visible; change WINDOW if necessary.'),
  step(['2nd','TRACE (CALC)','2:zero'],'Choose the Zero command','The official Zero route is 2nd → TRACE/CALC → 2:zero.'),
  step(['move left of the root','ENTER'],'Set Left Bound','Place the cursor on the left side of one intercept.'),
  step(['move right of the root','ENTER'],'Set Right Bound','The selected root must lie between the two bounds.'),
  step(['move near the root','ENTER'],'Supply a Guess','The calculator reports the zero. Record it with sufficient precision.'),
  step(['repeat Zero for each intercept'],'Find the complete root set','Repeat with separate bounds around −1, 1 and 4; use degree and factorization to audit completeness.')
];
workflows['cubic-roots'].handheldAlternative='Optional App check: APPS → PlySmlt2 → Polynomial Root Finder. Set ORDER 3 and enter coefficients 1, −4, −1, 4. The graph-Zero route remains essential exam training because it teaches bounds and completeness.';

workflows['exact-intersections'].tiSteps=[
  step(['Y='],'Open the function editor','Enter Y₁=2x+1 and Y₂=x²−3; clear unrelated functions.'),
  step(['ZOOM','6:ZStandard','GRAPH'],'Graph both functions','Confirm that both intersections are visible before using Intersect.'),
  step(['2nd','TRACE (CALC)','5:intersect'],'Choose Intersect','The official route is 2nd → TRACE/CALC → 5:intersect.'),
  step(['ENTER'],'Confirm First curve?','Move to Y₁ if needed, then press ENTER.'),
  step(['ENTER'],'Confirm Second curve?','Move to Y₂ if needed, then press ENTER.'),
  step(['move near the left crossing','ENTER'],'Supply a Guess','The guess selects the nearby intersection when more than one is visible.'),
  step(['2nd','TRACE (CALC)','5:intersect','ENTER','ENTER','move near the right crossing','ENTER'],'Repeat for the second point','Record both x- and y-coordinates for each intersection.')
];
workflows['exact-intersections'].handheldAlternative='Physical TI‑84 Plus CE route: Y= → GRAPH → 2nd TRACE (CALC) → 5:intersect → ENTER for first curve → ENTER for second curve → move near the desired crossing → ENTER for Guess.';

workflows['numerical-intersection'].tiSteps=[
  step(['Y='],'Enter the two model functions','Set Y₁=5x+12 and Y₂=80(0.9)^x.'),
  step(['WINDOW'],'Set a contextual window','Use Xmin=0 and an Xmax large enough to inspect the stated domain; choose a y-range containing both models.'),
  step(['GRAPH'],'Inspect the graph','Check the number of relevant crossings and widen the window once if needed.'),
  step(['2nd','TRACE (CALC)','5:intersect'],'Choose Intersect','Use the standard Intersect command after both graphs are visible.'),
  step(['ENTER','ENTER'],'Confirm the two curves','Select Y₁ and Y₂.'),
  step(['move near the crossing','ENTER'],'Supply a Guess','Record x and y with guard digits.'),
  step(['substitute the reported x'],'Verify the result','Evaluate both original expressions and compare their values before rounding.')
];
workflows['numerical-intersection'].handheldAlternative='The function entries, window and domain are part of the method. A graph image without those settings is not a reproducible calculator solution.';

workflows['rounded-rref'].tiSteps=[
  step(['2nd','x⁻¹ (MATRIX)','→','→','1:[A]'],'Open matrix [A] in EDIT','Use the variable order x,y throughout.'),
  step(['2','ENTER','3','ENTER'],'Set 2×3 dimensions','The last column contains 4 and 13.'),
  step(['5','ENTER','(−)','2','ENTER','4','ENTER','3','ENTER','1','ENTER','13','ENTER'],'Enter [5,−2|4] and [3,1|13]','Use the (−) key for the negative coefficient.'),
  step(['2nd','MODE (QUIT)'],'Return to the home screen','Matrix [A] remains stored.'),
  step(['2nd','x⁻¹ (MATRIX)','→ (MATH)','↓ to rref(','ENTER'],'Paste rref(','Select rref( from the MATRIX MATH menu.'),
  step(['2nd','x⁻¹ (MATRIX)','1:[A]',')','ENTER'],'Evaluate rref([A])','Read x=30/11 and y=53/11, or retain the displayed guard digits.'),
  step(['evaluate 5x−2y−4','evaluate 3x+y−13'],'Check both residuals','Use the unrounded stored values where possible.')
];
workflows['rounded-rref'].handheldAlternative='This sequence follows the official TI matrix/rref workflow. Exact fractions should be retained when displayed; decimal rounding belongs at the final reporting step.';

data.ti84Classroom=Object.assign({},data.ti84Classroom,{officialPathAudit:'6.3.0',officialSources:['TI Solution 34516: Zero','TI Solution 34599: Matrix and rref','TI-84 Plus CE guide: Intersect','TI PlySmlt2 application guide'],primaryCalculator:'TI-84 Plus CE handheld'});
})();
