(function(){
  'use strict';
  const {R,S,V,cards,W,T,Q,Section,TI}=window.__ECHS_LQ5_BUILD;

  Section('Solving and technology','Exact structure, TI-84 evidence and verification','Use the most transparent method, record what was entered, and verify every decimal output independently.','section-ti84');

  S('Solving and technology','Choose an efficient solving route','content','Structure before buttons',R`<div class="lq5-route-grid"><article><span>FACTOR</span><p>Integer or obvious roots; preserves exact values.</p></article><article><span>QUADRATIC FORMULA</span><p>Exact roots for any quadratic.</p></article><article><span>ZERO</span><p>Decimal roots and visual evidence.</p></article><article><span>MAXIMUM / MINIMUM</span><p>Numerical vertex coordinates.</p></article><article><span>INTERSECT</span><p>Solve \(f(x)=g(x)\) graphically.</p></article><article><span>TABLE</span><p>Discrete thresholds and adjacent admissible inputs.</p></article></div><div class="lq5-note"><b>Exam habit:</b> state the equation or model before using technology.</div>`);

  S('Solving and technology','Quadratic formula','content','Retain exact structure, then round',R`<div class="lq5-two"><div class="lq5-key"><div class="lq5-math hero">\[x=\frac{-b\pm\sqrt{b^2-4ac}}{2a}\]</div><p>Substitute coefficients with brackets, simplify exactly when useful, and round only the final numerical result.</p></div>${V('quadratic-formula-map','Coefficient positions a b and c mapped into the quadratic formula')}</div>`);

  W('Solving and technology','Exact and approximate roots',R`Solve \(3x^2+x-5=0\). Give exact roots and approximations to 3 significant figures.`,[
    R`Identify \(a=3,b=1,c=-5\).`,
    R`\(x=\dfrac{-1\pm\sqrt{1-4(3)(-5)}}{6}=\dfrac{-1\pm\sqrt{61}}6\).`,
    R`Using full precision, the roots are approximately \(1.135\) and \(-1.468\).`,
    R`To 3 significant figures: \(1.14\) and \(-1.47\).`
  ],R`\[\boxed{x=\frac{-1\pm\sqrt{61}}6\approx1.14,\,-1.47}\]`);

  S('Solving and technology','What must appear in a technology-supported solution?','content','Entry · window · output · check · meaning',R`<div class="lq5-evidence-grid"><article><b>1. MODEL</b><span>State the equation or functions.</span></article><article><b>2. ENTRY</b><span>Record \(Y_1,Y_2\) or the expression used.</span></article><article><b>3. WINDOW</b><span>Use a domain and scale that reveal the relevant feature.</span></article><article><b>4. OUTPUT</b><span>Report every relevant coordinate or value.</span></article><article><b>5. CHECK</b><span>Substitute, compare exact algebra, or inspect adjacent table values.</span></article><article><b>6. INTERPRET</b><span>Apply units, domain, precision and context.</span></article></div>`);

  TI('Find a zero','zero','Enter the quadratic in \(Y_1\), display the relevant crossing, then use CALC → zero with Left Bound, Right Bound and Guess.');

  TI('Find a maximum or minimum','extremum','Use CALC → maximum or minimum only after the vertex is visible in a contextual window.');

  TI('Find every intersection','intersect','Enter both functions, display all relevant crossings, and repeat Intersect near each solution.');

  TI('Verify a discrete threshold with TABLE','table','Locate the continuous crossing, then use TBLSET and TABLE to test the adjacent admissible whole-number inputs.');

  W('Solving and technology','Projectile: manual structure and TI-84 evidence',R`For \(h(t)=-4.9t^2+18t+1.5\), find the positive time when the height is zero.`,[
    R`The quadratic formula gives roots approximately \(-0.0815\) and \(3.7550\).`,
    R`On the TI-84, enter the model in \(Y_1\) and use Zero near the positive crossing.`,
    R`Apply the contextual restriction \(t\ge0\), so reject the negative root.`,
    R`Substitute the retained value: \(h(3.7550)\approx0\).`
  ],R`\[\boxed{t\approx3.76\text{ s}}\]`,R`The object reaches the ground approximately 3.76 seconds after launch.`,'projectile-zero');

  W('Solving and technology','Two line–quadratic intersections',R`Use exact algebra and TI-84 Intersect to solve \(y=2x+7\) and \(y=-x^2+10x+3\).`,[
    R`Exact algebra gives \(x=4\pm2\sqrt3\).`,
    R`Enter the line in \(Y_1\) and the quadratic in \(Y_2\).`,
    R`Choose a window showing both crossings and run Intersect near each one.`,
    R`The decimal points are approximately \((0.536,8.072)\) and \((7.464,21.928)\).`
  ],R`\[\boxed{(4-2\sqrt3,15-4\sqrt3),\quad(4+2\sqrt3,15+4\sqrt3)}\]`,R`The TI-84 values verify the exact coordinates after rounding.`,'intersect-two');

  T('Solving and technology','A whole-number threshold',R`For \(C(n)=0.5n^2+8n+20\), find the first whole number \(n\) for which \(C(n)\ge160\).`,[
    R`Solve \(C(n)=160\) continuously to locate the crossing.`,
    R`Use TABLE to evaluate the adjacent whole-number inputs.`,
    R`State the first admissible count and justify why the previous count fails.`
  ],'lq5-threshold',R`The positive continuous crossing is approximately \(10.55\). The table gives \(C(10)=150<160\) and \(C(11)=168.5\ge160\). Therefore the first admissible whole number is \(\boxed{11}\).`,'threshold-table');

  S('Solving and technology','A missing feature may be outside the display','content','The window is part of the evidence',R`<div class="lq5-two">${V('window-comparison','The same quadratic shown in a bad window and a contextual window')}<div class="lq5-key"><ul><li>A standard \([-10,10]\) window may hide a root near \(x=38.6\).</li><li>Use context, a table or algebra to estimate where the feature lies.</li><li>Set x- and y-ranges that show the feature and nearby behaviour.</li><li>“Not visible” never proves “does not exist”.</li></ul></div></div>`);

  S('Solving and technology','A decimal output is not a conclusion','content','Check independently',R`<div class="lq5-verify-grid"><article><b>ROOT</b><span>Substitute into the original equation.</span></article><article><b>INTERSECTION</b><span>Compare both output values.</span></article><article><b>EXTREMUM</b><span>Use the vertex formula or nearby values.</span></article><article><b>DISCRETE THRESHOLD</b><span>Test adjacent admissible inputs.</span></article></div>`);

  Q('TI-84 and solving checkpoint',[
    R`Write the complete TI-84 route for Zero.`,
    R`Explain why Intersect must be repeated when two crossings exist.`,
    R`State an independent check for a maximum found by technology.`,
    R`Explain why \(n=10.55\) cannot be the final answer when \(n\) counts complete packages.`
  ],'lq5-ti-check',R`Use \([Y=]\), enter the function, \([GRAPH]\), \([2nd][TRACE]\), choose 2:zero, then Left Bound, Right Bound and Guess. Intersect uses the guess to select one crossing, so repeat near the other. Verify an extremum using \(-b/(2a)\) or nearby values. A package count must be a whole number and must satisfy the inequality, so adjacent integers are tested.`);

  Section('Model choice and validation','Choose a model from evidence, then test its limits','A fitted equation is not automatically a defensible model. Examine rate structure, residuals, domain, assumptions and extrapolation risk.','section-validation');

  S('Model choice and validation','First and second differences','content','Equal input spacing',R`<div class="lq5-two">${V('difference-structure','A linear table with constant first differences and a quadratic table with constant second differences')}<div class="lq5-key"><div class="lq5-math">\[\text{linear: constant }\Delta y\]</div><div class="lq5-math">\[\text{quadratic: constant }\Delta^2 y\]</div><p>Difference evidence is meaningful only when the input spacing is equal.</p></div></div>`);

  S('Model choice and validation','Compare difference structures','lab','Switch between data sets',R`<div class="lq5-difference-lab" data-lq5-difference-lab><div class="lq5-model-buttons"><button type="button" data-model-set="linear" class="active">Linear data</button><button type="button" data-model-set="quadratic">Quadratic data</button><button type="button" data-model-set="neither">Neither model</button></div><div data-model-table></div><div class="lq5-model-verdict" data-model-verdict></div></div>`);

  W('Model choice and validation','Select and construct a model',R`For \(t=0,1,2,3\), outputs are \(5,8,13,20\). Select a model and determine it.`,[
    R`First differences are \(3,5,7\); second differences are constant at \(2\).`,
    R`A quadratic model is supported. For unit spacing, \(2a=2\), so \(a=1\).`,
    R`Since \(q(0)=5\), \(c=5\).`,
    R`Using \(q(1)=8\): \(1+b+5=8\), so \(b=2\).`
  ],R`\[\boxed{q(t)=t^2+2t+5}\]`);

  S('Model choice and validation','Residuals show what the model misses','content','Observed minus predicted',R`<div class="lq5-two">${V('residual-patterns','Random residuals compared with a curved residual pattern')}<div class="lq5-key"><div class="lq5-math">\[r=y_{\text{observed}}-y_{\text{predicted}}\]</div><ul><li>Small, patternless residuals support the model.</li><li>A curved pattern suggests that a linear model misses curvature.</li><li>One small residual does not prove the whole model is good.</li></ul></div></div>`);

  S('Model choice and validation','Inspect a residual pattern','lab','Move from values to a decision',R`<div class="lq5-residual-lab" data-lq5-residual-lab><div class="lq5-model-buttons"><button type="button" data-residual-set="random" class="active">Patternless residuals</button><button type="button" data-residual-set="curve">Curved residuals</button><button type="button" data-residual-set="outlier">One influential point</button></div><svg viewBox="0 0 720 360" data-residual-svg></svg><div data-residual-verdict class="lq5-model-verdict"></div></div>`);

  S('Model choice and validation','Interpolation and extrapolation carry different risk','content','Distance from evidence matters',R`<div class="lq5-two">${V('interpolation-extrapolation','Observed interval with interpolation inside and extrapolation outside')}<div class="lq5-card-grid"><article><span>INTERPOLATION</span><p>Prediction inside the observed or validated interval. Usually lower risk.</p></article><article><span>EXTRAPOLATION</span><p>Prediction outside the evidence. The relationship or constraints may change.</p></article></div></div>`);

  S('Model choice and validation','Compare linear and quadratic candidates','content','Fit, meaning and risk',R`<table class="lq5-table wide"><thead><tr><th>Evidence</th><th>Linear model</th><th>Quadratic model</th></tr></thead><tbody><tr><th>Rate</th><td>Constant</td><td>Changes steadily</td></tr><tr><th>Shape</th><td>Straight</td><td>One turning point</td></tr><tr><th>Parameters</th><td>Rate and initial value</td><td>Curvature, axis, vertex and roots</td></tr><tr><th>Typical risk</th><td>Misses curvature</td><td>Produces unrealistic extremes outside the domain</td></tr><tr><th>Validation</th><td colspan="2">Residual pattern, parameter meaning, domain and assumptions</td></tr></tbody></table>`);

  S('Model choice and validation','State assumptions and limitations specifically','content','Avoid generic evaluation',R`${cards([
    {label:'CONDITIONS',title:'What is held constant?',text:'Pricing policy, gravity, demand behaviour or physical dimensions.'},
    {label:'DATA',title:'How reliable are measurements?',text:'Rounding, sample size and unusual observations can affect the fit.',className:'accent'},
    {label:'DOMAIN',title:'Where is the model defensible?',text:'State the measured, physical or policy interval.'},
    {label:'OMISSIONS',title:'Which variables are excluded?',text:'Wind, capacity, competitor response or changing conditions.'}
  ])}`);

  T('Model choice and validation','Paper 2 synthesis: fountain model',R`A fountain stream is modelled by \(h(x)=-0.25x^2+2.5x\), where both variables are measured in metres.`,[
    R`Find the horizontal range of the stream.`,
    R`Find the maximum height and where it occurs.`,
    R`State a suitable contextual domain.`,
    R`Give one relevant limitation and explain how it could affect a prediction.`
  ],'lq5-fountain-synthesis',R`The roots are \(0\) and \(10\), so the horizontal range is 10 m. The vertex occurs at \(x=5\), with \(h(5)=6.25\), so the maximum height is 6.25 m. Use \(0\le x\le10\). A relevant limitation is that wind and changing water pressure are ignored, so the actual trajectory may differ from the parabola.`,'fountain-model');

  Q('Exit ticket and transfer',[
    R`A line passes through \((2,7)\) and \((8,25)\). Find its equation and interpret its gradient.`,
    R`For \(q(x)=-x^2+6x+7\), state the roots, vertex and maximum.`,
    R`Write one TI-84 route and an independent check for a line–quadratic intersection.`,
    R`Explain how first and second differences guide model choice.`,
    R`State one domain restriction and one limitation for a contextual quadratic model.`
  ],'lq5-exit',R`The line is \(y=3x+1\), with gradient 3 output units per input unit. The quadratic roots are \(-1,7\), vertex \((3,16)\), maximum 16. For Intersect: enter both functions, graph, use \([2nd][TRACE]\) 5:intersect, select curves and guess; verify by substitution. Constant first differences support a line, while constant second differences support a quadratic for equal input spacing. Context-specific restrictions and limitations must match the variables used.`);
})();
