(function(){
  'use strict';
  const B=window.__ECHS_TCI5_BUILD;if(!B)throw new Error('Lesson 2.5 v5 builder is missing.');
  const {R,S,V,Section,Concept,Worked,Student,Checkpoint,Misconception,TI}=B;

  S('Block C · Inverse functions','Coordinates, tables and mappings swap','content','The rule of four',R`<div class="tci5-swap-layout"><div>${V('inverse-table','Table and mapping diagram for an inverse function')}</div><div><h2>Equivalent statements</h2><div class="tci5-equivalence"><span>\\(f(2)=7\\)</span><b>⇔</b><span>\\((2,7)\\) lies on \\(f\\)</span><b>⇔</b><span>\\(f^{-1}(7)=2\\)</span><b>⇔</b><span>\\((7,2)\\) lies on \\(f^{-1}\\)</span></div><p>A table for the inverse is obtained by swapping the input and output columns, provided the swapped input column has no repeated value with conflicting outputs.</p></div></div>`);

  Concept('Block C · Inverse functions','Algebraic inverse method','Swap variables, then solve','For a formula, the symbol \\(x\\) is a placeholder. The inverse is found by reversing the input-output equation.',[
    {label:'1',title:'Write the relation',math:R`\\(y=f(x)\\)`,text:'Include any domain restriction.'},
    {label:'2',title:'Swap roles',math:R`\\(x=f(y)\\)`,text:'This represents reflection in \\(y=x\\).'},
    {label:'3',title:'Solve for y',text:'Use algebra to isolate the new output.'},
    {label:'4',title:'Rename and restrict',math:R`\\(y=f^{-1}(x)\\)`,text:'State inverse domain and range.'},
    {label:'5',title:'Verify',math:R`\\(f^{-1}(f(x))=x\\)`,text:'Check both compositions on appropriate domains.'}
  ],'inverse-algebra-steps');

  Worked('Block C · Inverse functions','Inverse with units: temperature conversion',R`The rule \\(F(C)=1.8C+32\\) converts Celsius temperature to Fahrenheit. Find and interpret the inverse.`,[
    R`Write \\(y=1.8x+32\\).`,
    R`Swap input and output: \\(x=1.8y+32\\).`,
    R`Solve: \\(y=\\dfrac{x-32}{1.8}\\).`,
    R`Therefore \\(F^{-1}(x)=\\dfrac{x-32}{1.8}\\).`,
    R`The inverse takes a Fahrenheit temperature as input and returns the corresponding Celsius temperature.`
  ],R`\\[F^{-1}(x)=\\frac{x-32}{1.8}\\]`,'For example, \\(F^{-1}(86)=30\\), so 86°F corresponds to 30°C.','temperature-inverse');

  Student('Block C · Inverse functions','Linear inverse audit',R`A sensor maps pressure \\(p\\) in kPa to voltage \\(V\\) by \\(V(p)=0.04p+0.6\\), for \\(0\\le p\\le250\\).`,[
    'Find \\(V^{-1}(x)\\).',
    'State the domain and range of the inverse, including units.',
    'Calculate and interpret \\(V^{-1}(6.2)\\).',
    'Verify one composition identity.'
  ],'turn-linear-inverse',R`\\(V^{-1}(x)=25(x-0.6)\\). The original range is \\(0.6\\le V\\le10.6\\), so the inverse domain is \\([0.6,10.6]\\) volts and its range is \\([0,250]\\) kPa. \\(V^{-1}(6.2)=140\\), so 6.2 V corresponds to 140 kPa. Also \\(V^{-1}(V(p))=25(0.04p+0.6-0.6)=p\\).`,'sensor-linear-inverse');

  Concept('Block C · Inverse functions','Domain and range swap','Sets and units reverse roles','For an inverse function, the original range becomes the inverse domain, and the original domain becomes the inverse range.',[
    {title:'Original',math:R`\\(f:D\\to R\\)`,text:'Inputs belong to \\(D\\); outputs belong to \\(R\\).'},
    {title:'Inverse',math:R`\\(f^{-1}:R\\to D\\)`,text:'The sets reverse.'},
    {title:'Units',text:'If \\(f\\) maps seconds to metres, \\(f^{-1}\\) maps metres to seconds.'},
    {title:'Context',text:'Values outside the original range are not valid inputs to the inverse model.'}
  ],'domain-range-swap');

  Concept('Block C · Inverse functions','Why a quadratic needs a restriction','Choose one monotonic branch','For \\(f(x)=(x-2)^2+1\\), most outputs above 1 occur twice unless the domain is restricted.',[
    {title:'Right branch',math:R`\\(x\\ge2\\)`,text:'The inverse is \\(f^{-1}(x)=2+\\sqrt{x-1}\\).'},
    {title:'Left branch',math:R`\\(x\\le2\\)`,text:'The inverse is \\(f^{-1}(x)=2-\\sqrt{x-1}\\).'},
    {title:'Inverse domain',math:R`\\(x\\ge1\\)`,text:'This is the range of either restricted branch.'},
    {title:'Choice',text:'The context determines which branch is meaningful; algebra alone does not.'}
  ],'quadratic-restriction');

  S('Block C · Inverse functions','A restricted quadratic and its inverse','content','Exact reflection in y=x',R`<div class="tci5-graph-study"><div>${V('inverse-quadratic','Restricted quadratic and square-root inverse')}</div><div><h2>Right-hand branch</h2><p>Original: \\(f(x)=(x-2)^2+1\\), \\(x\\ge2\\).</p><p>Inverse: \\(f^{-1}(x)=2+\\sqrt{x-1}\\), \\(x\\ge1\\).</p><ul><li>\\((2,1)\\leftrightarrow(1,2)\\).</li><li>\\((3,2)\\leftrightarrow(2,3)\\).</li><li>\\((4,5)\\leftrightarrow(5,4)\\).</li></ul></div></div>`);

  Worked('Block C · Inverse functions','Select and derive a branch',R`Let \\(f(x)=9-(x-4)^2\\). Restrict the domain to \\(x\\ge4\\), then find the inverse and its domain.`,[
    R`Write \\(y=9-(x-4)^2\\), with \\(x\\ge4\\).`,
    R`Swap: \\(x=9-(y-4)^2\\).`,
    R`Then \\((y-4)^2=9-x\\).`,
    R`Because the original restriction requires \\(y\\ge4\\), select the positive branch: \\(y=4+\\sqrt{9-x}\\).`,
    R`The original range is \\(x\\le9\\), so the inverse domain is \\(x\\le9\\).`
  ],R`\\[f^{-1}(x)=4+\\sqrt{9-x},\qquad x\\le9\\]`,'The square-root sign is chosen from the original domain restriction, not by preference.','quadratic-branch-worked');

  Student('Block C · Inverse functions','Branch selection challenge',R`For \\(f(x)=(x+3)^2-2\\), choose the restriction \\(x\\le-3\\).`,[
    'Find the inverse formula.',
    'State its domain and range.',
    R`Map the point \\((-5,2)\\) to the inverse graph.`,
    'Explain why the negative square-root branch is required.'
  ],'turn-quadratic-branch',R`Swap and solve: \\(y=-3-\\sqrt{x+2}\\). Thus \\(f^{-1}(x)=-3-\\sqrt{x+2}\\), with domain \\(x\\ge-2\\) and range \\(y\\le-3\\). The point \\((-5,2)\\) maps to \\((2,-5)\\). The original restriction requires inverse outputs at most \\(-3\\), so the negative branch is necessary.`,'quadratic-branch-turn');

  Misconception('Inverse is not reciprocal',R`“\\(f^{-1}(x)=1/f(x)\\).”`,R`The inverse swaps inputs and outputs; the reciprocal keeps the same input and replaces the output by its multiplicative reciprocal. For \\(f(x)=2x\\), \\(f^{-1}(x)=x/2\\), whereas \\(1/f(x)=1/(2x)\\). These have different graphs, domains and meanings.`,'inverse-reciprocal');

  Concept('Block C · Inverse functions','Composition identities','The strongest algebraic verification','Functions \\(f\\) and \\(g\\) are inverses when both compositions return the identity on the appropriate domains.',[
    {title:'First direction',math:R`\\(g(f(x))=x\\)`,text:'Start with an allowed input to \\(f\\), then reverse.'},
    {title:'Second direction',math:R`\\(f(g(x))=x\\)`,text:'Start with an allowed input to \\(g\\), then reverse.'},
    {title:'Domain caution',text:'A symbolic simplification can hide an invalid input; state the domain on which the identity holds.'}
  ],'inverse-composition-identities');

  Worked('Block C · Inverse functions','Verify a rational inverse',R`Let \\(f(x)=\\dfrac{x-1}{x+2}\\), \\(x\\ne-2\\). Show that \\(g(x)=\\dfrac{1+2x}{1-x}\\) is its inverse.`,[
    R`Compute \\(g(f(x))=\\dfrac{1+2\\left(\\frac{x-1}{x+2}\\right)}{1-\\left(\\frac{x-1}{x+2}\\right)}\\).`,
    R`The numerator becomes \\(\\dfrac{3x}{x+2}\\); the denominator becomes \\(\\dfrac{3}{x+2}\\).`,
    R`Hence \\(g(f(x))=x\\), for \\(x\\ne-2\\).`,
    R`Similarly, \\(f(g(x))=x\\), for \\(x\\ne1\\).`,
    R`The excluded value 1 is the original range restriction and therefore the inverse domain restriction.`
  ],R`\\[g=f^{-1},\qquad D_f=\\mathbb R\\setminus\\{-2\\},\quad D_g=\\mathbb R\\setminus\\{1\\}\\]`,'A complete verification includes restrictions, not only cancellation.','rational-inverse-verify');

  Concept('Block C · Inverse functions','Inverse units and interpretation','Variables exchange roles','An inverse answer is incomplete unless the input, output and units are named.',[
    {title:'Distance model',math:R`\\(d(t)\\)`,text:'Input: time in seconds. Output: distance in metres.'},
    {title:'Inverse model',math:R`\\(d^{-1}(s)\\)`,text:'Input: distance in metres. Output: time in seconds.'},
    {title:'Interpretation',text:'“\\(d^{-1}(100)=8.4\\)” means the model predicts 8.4 seconds to reach 100 metres.'},
    {title:'Restriction',text:'This interpretation is valid only where distance changes one-to-one with time.'}
  ],'inverse-units');

  Concept('Block C · Inverse functions','Algebraically invertible, practically ambiguous','Measurement can destroy uniqueness','A formula may be one-to-one while the reported data are rounded or censored.',[
    {title:'Rounding',text:'Several true inputs may display the same rounded output.'},
    {title:'Sensor resolution',text:'A device may record outputs only to the nearest 0.1 V.'},
    {title:'Noise',text:'Observed reversal becomes an estimate rather than an exact inverse.'},
    {title:'Communication',text:'Report uncertainty or an interval of possible inputs when the context requires it.'}
  ],'practical-inverse',R`Mathematical invertibility and measurement recoverability are related but not identical.`);

  Checkpoint('Checkpoint C · Inverse functions',[
    R`Find the inverse of \\(f(x)=5-3x\\).`,
    R`State the inverse domain if the original domain is \\(-2\\le x\\le4\\).`,
    R`Explain why \\(f(x)=x^2\\) on all real numbers has an inverse relation but not an inverse function.`,
    R`For \\(g(x)=(x-1)^2+4\\), \\(x\\ge1\\), find \\(g^{-1}(x)\\) and verify one composition.`
  ],'checkpoint-c',R`\\(f^{-1}(x)=(5-x)/3\\). The original endpoint outputs are \\(f(-2)=11\\) and \\(f(4)=-7\\), so the inverse domain is \\([-7,11]\\). The unrestricted quadratic is not one-to-one. For the restricted function, \\(g^{-1}(x)=1+\\sqrt{x-4}\\), \\(x\\ge4\\), and \\(g^{-1}(g(x))=1+|x-1|=x\\) because \\(x\\ge1\\).`);

  Section('Block D · Composition','Model processes in the order they occur','Composition connects multiple functions, but the output set of one stage must be valid input for the next.','block-d');

  S('Block D · Composition','Read composition from right to left','content','The inner process happens first',R`<div class="tci5-composition-study"><div>${V('composition-flow','Flow diagram for f composed with g')}</div><div><h2>Notation</h2><p>\\((f\\circ g)(x)=f(g(x))\\).</p><ul><li>Start with \\(x\\).</li><li>Apply \\(g\\) to obtain \\(g(x)\\).</li><li>Use that output as the input to \\(f\\).</li><li>Check that \\(g(x)\\) lies in the domain of \\(f\\).</li></ul></div></div>`);

  Concept('Block D · Composition','Composition is generally not commutative','Order represents a real process','Reversing the stages usually changes both the formula and the meaning.',[
    {title:'Example rules',math:R`\\(f(x)=2x+5,\quad g(x)=x^2\\)`,text:'One rule scales/shifts; the other squares.'},
    {title:'First order',math:R`\\((f\\circ g)(x)=2x^2+5\\)`,text:'Square first, then scale and add.'},
    {title:'Reverse order',math:R`\\((g\\circ f)(x)=(2x+5)^2\\)`,text:'Scale/add first, then square.'},
    {title:'Conclusion',math:R`\\(f\\circ g\\ne g\\circ f\\)`,text:'Unless a special structure makes them equal.'}
  ],'composition-order');

  Worked('Block D · Composition','Evaluate both orders',R`Let \\(f(x)=3x-1\\) and \\(g(x)=x^2+2\\). Calculate \\((f\\circ g)(2)\\) and \\((g\\circ f)(2)\\).`,[
    R`For \\(f\\circ g\\): \\(g(2)=6\\), then \\(f(6)=17\\).`,
    R`For \\(g\\circ f\\): \\(f(2)=5\\), then \\(g(5)=27\\).`,
    R`The results differ because the intermediate values differ.`,
    R`Therefore order must be tied to the stated process.`
  ],R`\\[(f\\circ g)(2)=17,\qquad(g\\circ f)(2)=27\\]`,'Write the intermediate output; it is evidence of correct order.','composition-worked');

  Concept('Block D · Composition','Build a composite formula','Substitute the whole inner expression','Parentheses preserve the inner output as a single input to the outer rule.',[
    {title:'Given',math:R`\\(f(u)=\\sqrt{u-1},\quad g(x)=2x+5\\)`,text:'The placeholder in \\(f\\) is \\(u\\).'},
    {title:'Composite',math:R`\\((f\\circ g)(x)=\\sqrt{(2x+5)-1}=\\sqrt{2x+4}\\)`,text:'Substitute all of \\(g(x)\\) for \\(u\\).'},
    {title:'Domain',math:R`\\(2x+4\\ge0\\Rightarrow x\\ge-2\\)`,text:'The composite domain is not automatically the domain of either function alone.'}
  ],'composition-formula');

  Concept('Block D · Composition','Domain of a composite','Two conditions must hold','For \\(f\\circ g\\), the input must be allowed by \\(g\\), and the output \\(g(x)\\) must be allowed by \\(f\\).',[
    {title:'Formal condition',math:R`\\(x\\in D_g\quad\\text{and}\quad g(x)\\in D_f\\)`,text:'Both are required.'},
    {title:'Example',math:R`\\(f(u)=\\sqrt{u},\ g(x)=3-x\\)`,text:'Require \\(3-x\\ge0\\), so \\(x\\le3\\).'},
    {title:'Common error',text:'Stating only the domain of the inner function even when the outer function creates a stronger restriction.'}
  ],'composite-domain');

  S('Block D · Composition','A multi-stage pricing model','content','Process order has financial meaning',R`<div class="tci5-composition-study"><div>${V('pricing-pipeline','Discount delivery fee and tax pipeline')}</div><div><h2>Stages</h2><p>A listed price \\(x\\) is discounted by 12%, then a fixed delivery charge of 18 QAR is added, then 5% tax is applied.</p><p>\\[d(x)=0.88x,\quad c(y)=y+18,\quad t(z)=1.05z\\]</p><p>\\[P(x)=(t\\circ c\\circ d)(x)=1.05(0.88x+18)=0.924x+18.9\\]</p><p>Changing the order changes which amounts receive tax or discount.</p></div></div>`);

  Concept('Block D · Composition','Inverse of a composite','Reverse the stages and reverse each operation','If every stage is invertible, then the inverse of a composition reverses order.',[
    {title:'Rule',math:R`\\[(f\\circ g)^{-1}=g^{-1}\\circ f^{-1}\\]`,text:'Undo the outer process first.'},
    {title:'Three stages',math:R`\\[(t\\circ c\\circ d)^{-1}=d^{-1}\\circ c^{-1}\\circ t^{-1}\\]`,text:'Remove tax, subtract delivery, then undo the discount.'},
    {title:'Reason',text:'The last forward operation is the first obstacle when reversing.'}
  ],'inverse-composite');

  Student('Block D · Composition','Design and reverse a process',R`A raw measurement \\(x\\) is first converted from centimetres to metres, then increased by a 3% calibration factor, then reduced by an offset of 0.2.`,[
    'Define three stage functions.',
    'Write and simplify the composite function.',
    'Find its inverse.',
    'Explain the reverse order in words.',
    'State suitable units at each stage.'
  ],'turn-composite-process',R`One choice is \\(g(x)=x/100\\), \\(f(u)=1.03u\\), and \\(r(v)=v-0.2\\). Then \\(P(x)=r(f(g(x)))=0.0103x-0.2\\). Its inverse is \\(P^{-1}(y)=(y+0.2)/0.0103\\). Reverse by adding 0.2, dividing by 1.03, then multiplying by 100.`,'process-design');

  Checkpoint('Checkpoint D · Composition',[
    R`For \\(f(x)=2x-3\\) and \\(g(x)=5x+4\\), find both \\(f\\circ g\\) and \\(g\\circ f\\).`,
    R`Find the domain of \\(h(x)=\\sqrt{7-2x}\\). Express \\(h\\) as a composition of two simpler functions.`,
    R`Explain why \\((f\\circ g)^{-1}=f^{-1}\\circ g^{-1}\\) is generally wrong.`,
    R`A process adds 8 and then multiplies by 3. Reverse an output of 60.`
  ],'checkpoint-d',R`\\((f\\circ g)(x)=10x+5\\) and \\((g\\circ f)(x)=10x-11\\). For \\(h\\), one choice is \\(g(x)=7-2x\\), \\(f(u)=\\sqrt{u}\\), with domain \\(x\\le3.5\\). The inverse order must reverse because the last forward operation must be undone first. From 60, divide by 3 then subtract 8, giving 12.`);

  Section('Block E · Technology and IB synthesis','Use technology only where it adds evidence','The TI‑84 should confirm a prediction, reveal a feature efficiently, or evaluate a composite accurately—never replace the mathematical model.','block-e');

  TI('Overlay a base graph and its translation','transform-overlay',R`Compare \\(Y_1=X^2\\) with \\(Y_2=(X-2)^2-3\\). Predict the vertex and three mapped points first. Then use GRAPH and TABLE to verify the exact translation.`,R`Y₁=X²; Y₂=(X−2)²−3`,R`Window, equations entered, base/image vertices, one mapped point pair and a sentence describing 2 right and 3 down.`);

  TI('Verify an inverse by reflection','inverse-overlay',R`Graph \\(Y_1=2X-3\\), \\(Y_2=(X+3)/2\\), and \\(Y_3=X\\). Use mapped points and the fixed point \\((3,3)\\) to verify reflection in \\(y=x\\).`,R`Y₁=2X−3; Y₂=(X+3)/2; Y₃=X`,R`A suitable square-scale window, at least two swapped point pairs, the fixed point and an algebraic composition check.`);

  TI('Check a forward and reverse conversion','composition-check',R`Store \\(Y_1=1.8X+32\\) and \\(Y_2=(X-32)/1.8\\), then evaluate \\(Y_2(Y_1(30))\\) and \\(Y_1(Y_2(86))\\) from the home screen.`,R`Y₂(Y₁(30)); Y₁(Y₂(86))`,R`Both calculator outputs, the exact algebraic identities, and an interpretation using °C and °F.`);

  S('Block E · Technology and IB synthesis','What counts as calculator evidence?','content','A screenshot is not a solution',R`<div class="tci5-evidence-standard"><article><span>1</span><h2>Model entry</h2><p>Record the equation or function stored, including parentheses and restrictions.</p></article><article><span>2</span><h2>Window or input</h2><p>State the viewing window, table settings or evaluated expression.</p></article><article><span>3</span><h2>Relevant output</h2><p>Report the coordinate, value or table row used—not every display digit.</p></article><article><span>4</span><h2>Independent check</h2><p>Map a point, substitute, compose or compare exact structure.</p></article><article><span>5</span><h2>IB conclusion</h2><p>Use units, suitable precision, domain and contextual meaning.</p></article></div>`);

  S('Block E · Technology and IB synthesis','IB task deconstruction: transformations','content','Where the marks are earned',R`<div class="tci5-mark-audit"><header><span>PAPER 2 STYLE</span><h2>\\(g(x)=-3f(2(x-4))+5\\), with \\((6,-2)\\) on \\(f\\)</h2></header><div><article><b>M1</b><p>Set \\(2(x-4)=6\\).</p></article><article><b>A1</b><p>Obtain \\(x=7\\).</p></article><article><b>M1</b><p>Compute \\(y=-3(-2)+5\\).</p></article><article><b>A1</b><p>State the point \\((7,11)\\).</p></article><article><b>R1</b><p>Describe the horizontal factor as \\(1/2\\), not 2.</p></article><article><b>R1</b><p>Distinguish x-axis reflection from y-axis reflection.</p></article></div></div>`);

  S('Block E · Technology and IB synthesis','IB task deconstruction: inverse model','content','Formula, sets, units and verification',R`<div class="tci5-mark-audit"><header><span>FULL-MARK RESPONSE</span><h2>A calibration model \\(S(T)=1.6T+12\\), \\(-20\\le T\\le80\\)</h2></header><div><article><b>Formula</b><p>\\(S^{-1}(x)=(x-12)/1.6\\).</p></article><article><b>Domain</b><p>Original range: \\([-20,140]\\), so this is the inverse domain.</p></article><article><b>Range</b><p>Inverse range: \\([-20,80]\\) °C.</p></article><article><b>Interpret</b><p>\\(S^{-1}(100)=55\\): signal 100 corresponds to 55°C.</p></article><article><b>Verify</b><p>\\(S^{-1}(S(T))=T\\).</p></article><article><b>Validity</b><p>Do not use inverse inputs outside \\([-20,140]\\).</p></article></div></div>`);

  S('Block E · Technology and IB synthesis','Case study: calibrating a reversible sensor','student','Mini investigation',R`<div class="tci5-case-study"><div>${V('sensor-case','Finite-domain sensor and inverse calibration graph')}</div><div><h2>Sensor model</h2><p>\\(S(T)=1.6T+12\\) for \\(-20\\le T\\le80\\).</p><ol><li>Construct a table of five temperatures and signals.</li><li>Graph the finite-domain model and its inverse on a square scale.</li><li>Explain the swapped units and endpoint coordinates.</li><li>Estimate how ±0.5 signal-unit measurement error affects recovered temperature.</li><li>State one condition under which the linear inverse would be unreliable.</li></ol><textarea class="student-note tall" data-note="sensor-case" placeholder="Develop the investigation with calculations and interpretation."></textarea></div></div>`);

  S('Block E · Technology and IB synthesis','Evaluate validity and precision','content','A strong model answer includes limits',R`<div class="tci5-evaluation-grid"><article><h2>Uniqueness</h2><p>Is the selected domain one-to-one?</p></article><article><h2>Attainable outputs</h2><p>Does the inverse input belong to the original range?</p></article><article><h2>Measurement precision</h2><p>How does output rounding propagate backward?</p></article><article><h2>Structural accuracy</h2><p>Are transformations based on exact coordinate maps?</p></article><article><h2>Technology evidence</h2><p>Can the graph/table output be independently reproduced?</p></article><article><h2>Communication</h2><p>Are variables, units, restrictions and precision explicit?</p></article></div>`);

  S('Closure','Mastery checklist','content','Can you do this independently?',R`<div class="tci5-outcomes mastery"><label><input type="checkbox" data-reflect="tci5-m1"><span>I can derive and use \\((u,v)\\mapsto(h+u/b,k+av)\\).</span></label><label><input type="checkbox" data-reflect="tci5-m2"><span>I can transform points, extrema, asymptotes, domain and range without visual guessing.</span></label><label><input type="checkbox" data-reflect="tci5-m3"><span>I can distinguish input reflections, output reflections, horizontal scales and vertical scales.</span></label><label><input type="checkbox" data-reflect="tci5-m4"><span>I can decide whether an inverse function exists and select a valid domain restriction.</span></label><label><input type="checkbox" data-reflect="tci5-m5"><span>I can find, verify and interpret an inverse with correct units.</span></label><label><input type="checkbox" data-reflect="tci5-m6"><span>I can construct compositions, determine their domains and reverse their order correctly.</span></label><label><input type="checkbox" data-reflect="tci5-m7"><span>I can use the TI‑84 as transparent evidence and verify the output independently.</span></label></div>`);

  S('Closure','Choose the next evidence route','content','Learn → practise → demonstrate',R`<div class="tci5-next-route"><article><span>60 QUESTIONS</span><h2>Practice Studio</h2><p>Build fluency across Foundation, Application, Reasoning and Challenge.</p><button class="primary-btn route-jump" data-go="practice">Open Practice Studio</button></article><article><span>5 EXTENDED TASKS</span><h2>IB Tasks</h2><p>Write complete transformation, inverse and composition responses.</p><button class="primary-btn route-jump" data-go="exam">Open IB Tasks</button></article><article><span>12 QUESTIONS</span><h2>Timed Quiz</h2><p>Test independent recall and reasoning.</p><button class="primary-btn route-jump" data-go="quiz">Open Timed Quiz</button></article><article><span>LOCAL EVIDENCE</span><h2>Mastery</h2><p>Review attempted questions and mark completion.</p><button class="primary-btn route-jump" data-go="review">Open Mastery</button></article></div><div class="tci5-complete"><h2>Lesson 2.5 complete</h2><p>Transform the coordinates, protect the domain, reverse only one-to-one processes, and make every calculator result defensible.</p></div>`);
})();
