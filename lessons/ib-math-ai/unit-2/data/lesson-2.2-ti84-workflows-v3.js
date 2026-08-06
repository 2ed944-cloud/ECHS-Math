(function(){
'use strict';
const data=window.LESSON_DATA;
if(!data||String(data.lesson?.number)!=='2.2')return;
const workflows={
  zero:{
    title:'D1 · Find a quadratic zero',tag:'ROOTS · CONTEXTUAL SELECTION',problem:'For h(t) = −4.9t² + 18t + 1.5, find the positive time when h = 0.',
    manual:['Set −4.9t² + 18t + 1.5 = 0.','Use the quadratic formula or inspect the factor/graph structure.','The two roots are approximately −0.0815 and 3.7550.','Apply t ≥ 0, reject the negative root, and verify h(3.7550) ≈ 0.'],
    keys:['Press [Y=].','Enter −4.9X²+18X+1.5 in Y₁.','Press [GRAPH]. Adjust [WINDOW] so the positive crossing is visible.','Press [2nd] [TRACE] to open CALC.','Choose 2:zero.','Move left of the positive crossing and press [ENTER] for Left Bound.','Move right of the crossing and press [ENTER] for Right Bound.','Move near the crossing and press [ENTER] for Guess.'],
    entry:'Y₁ = −4.9X² + 18X + 1.5',output:'x ≈ 3.7550 (the other zero is x ≈ −0.0815)',verify:'Substitute the retained positive root into h(t); the residual should be close to zero.',ib:'Using the TI‑84 Zero command on h(t), the positive root is t ≈ 3.755. Since t ≥ 0, the object reaches the ground after approximately 3.76 s.'
  },
  maximum:{
    title:'D2 · Locate a maximum',tag:'VERTEX · OPTIMISATION',problem:'Revenue is R(p) = −20p² + 800p for 0 ≤ p ≤ 40. Find the maximizing price and revenue.',
    manual:['Because a = −20 < 0, the parabola opens downward.','The vertex input is p = −b/(2a) = 20.','Evaluate R(20) = 8000.','Check that p = 20 belongs to 0 ≤ p ≤ 40.'],
    keys:['Press [Y=].','Enter −20X²+800X in Y₁.','Choose a window that includes 0 ≤ X ≤ 40 and the top of the parabola.','Press [GRAPH].','Press [2nd] [TRACE] to open CALC.','Choose 4:maximum.','Set Left Bound, Right Bound, then Guess around the vertex.'],
    entry:'Y₁ = −20X² + 800X; contextual window 0 ≤ X ≤ 40',output:'Maximum at (20, 8000)',verify:'Use −b/(2a) for the input and substitute p = 20 into the original model.',ib:'The TI‑84 Maximum command gives (20, 8000). Therefore the model predicts a maximum revenue of 8000 QAR at a ticket price of 20 QAR.'
  },
  intersect:{
    title:'D3 · Find two intersections',tag:'EQUAL OUTPUTS · REPEAT NEAR EACH CROSSING',problem:'Find the intersections of y = 2x + 7 and y = −x² + 10x + 3.',
    manual:['Set 2x + 7 = −x² + 10x + 3.','Rearrange to x² − 8x + 4 = 0.','Hence x = 4 ± 2√3.','Substitute each x-value into y = 2x + 7.'],
    keys:['Press [Y=].','Enter 2X+7 in Y₁ and −X²+10X+3 in Y₂.','Press [GRAPH] and ensure both crossings are visible.','Press [2nd] [TRACE] to open CALC.','Choose 5:intersect.','Confirm First curve with [ENTER].','Confirm Second curve with [ENTER].','Move near one crossing and press [ENTER] for Guess; repeat near the other crossing.'],
    entry:'Y₁ = 2X + 7; Y₂ = −X² + 10X + 3',output:'(0.535898, 8.071797) and (7.464102, 21.928203)',verify:'Substitute each x-coordinate into both models and compare the y-values.',ib:'Using Intersect near each crossing gives approximately (0.536, 8.072) and (7.464, 21.928). Both points satisfy the two equations.'
  },
  table:{
    title:'D4 · Verify a whole-number threshold',tag:'TABLE · ADJACENT INPUTS',problem:'For C(n) = 0.5n² + 8n + 20, find the first whole number n for which C(n) ≥ 160.',
    manual:['Solve C(n) = 160 continuously to locate the crossing near n = 10.55.','Because n is a whole-number count, ordinary rounding is not enough.','Evaluate the adjacent admissible inputs n = 10 and n = 11.','C(10) = 150 < 160 and C(11) = 168.5 ≥ 160, so report 11.'],
    keys:['Press [Y=] and enter 0.5X²+8X+20 in Y₁.','Press [2nd] [WINDOW] to open TBLSET.','Set TblStart = 9 and ΔTbl = 1; use Auto for independent and dependent values.','Press [2nd] [GRAPH] to open TABLE.','Read Y₁ at X = 10 and X = 11.','Compare both values with the target 160.'],
    entry:'Y₁ = 0.5X² + 8X + 20; TblStart = 9; ΔTbl = 1',output:'Y₁(10) = 150 and Y₁(11) = 168.5',verify:'The value immediately before 11 is below the target and the value at 11 meets it.',ib:'The continuous crossing is about 10.55. The table gives C(10)=150 and C(11)=168.5, so the first whole-number input meeting the target is n=11.'
  }
};
window.ECHS_TI84_LESSON_22=workflows;
})();
