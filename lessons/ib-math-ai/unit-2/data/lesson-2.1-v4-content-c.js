(function(){
  'use strict';
  const {R,S,V,concept,W,T,Q,Section}=window.__ECHS_FN4_BUILD;

  Section('Graph features','Read a graph as mathematical evidence','Axes, scale, domain and endpoints must be read before individual features.','feature-graph');

  concept('Graph features','Intercepts and zeros','Coordinates matter','An intercept is a point; a zero or root is an input value.',[
    {label:'X-INTERCEPT',math:R`\[f(x)=0\]`,text:R`Point \((a,0)\); zero \(x=a\).`},
    {label:'Y-INTERCEPT',math:R`\[f(0)\]`,text:R`Point \((0,f(0))\).`,className:'accent'},
    {label:'CONTEXT',title:'Interpret only valid points',text:'An intercept may represent an initial amount, break-even value or threshold only when it lies in the contextual domain.'}
  ],'intercepts');

  S('Graph features','Local and global extrema','content','State coordinates and status',R`<div class="fn4-two">${V('feature-graph','A graph labelled with intercepts, local extrema and endpoints')}<div class="fn4-key"><ul><li>A <b>local maximum</b> exceeds nearby outputs.</li><li>A <b>global maximum</b> is the greatest output on the whole domain.</li><li>An included endpoint may be a global extremum.</li><li>State coordinates and units whenever they are known.</li></ul></div></div>`);

  S('Graph features','Increasing, decreasing and constant intervals','content','Follow the graph from left to right',R`<div class="fn4-behaviour"><article class="up"><span>INCREASING</span><p>As \(x\) increases, \(f(x)\) increases.</p></article><article class="down"><span>DECREASING</span><p>As \(x\) increases, \(f(x)\) decreases.</p></article><article class="flat"><span>CONSTANT</span><p>The output remains unchanged over an interval.</p></article></div><div class="fn4-note">Intervals of increase or decrease are stated using input values.</div>`);

  S('Graph features','Positive and negative intervals','content','Position relative to the x-axis',R`<div class="fn4-two"><article class="fn4-key"><span>POSITIVE</span><div class="fn4-math">\[f(x)\gt0\]</div><p>The graph lies above the \(x\)-axis.</p></article><article class="fn4-key accent"><span>NEGATIVE</span><div class="fn4-math">\[f(x)\lt0\]</div><p>The graph lies below the \(x\)-axis.</p></article></div>${V('sign-intervals','A graph shaded above and below the x-axis')}`);

  S('Graph features','Positive does not mean increasing','content','Common error',R`<div class="fn4-misconception"><div>!</div><section><h2>“The graph is above the x-axis, so it is increasing.”</h2><p><b>Correction:</b> positive or negative describes the sign of the output. Increasing or decreasing describes how outputs change as the input moves to the right. A graph can be positive and decreasing at the same time.</p></section></div>`);

  S('Graph features','Endpoints, holes and jumps','content','Inclusion changes conclusions',R`<div class="fn4-symbol-grid"><article><i class="closed-dot"></i><b>Closed point</b><p>The coordinate is included.</p></article><article><i class="open-dot"></i><b>Open point</b><p>The coordinate is excluded.</p></article><article><i class="hole-symbol">○</i><b>Hole</b><p>A missing point may remove one input or one output.</p></article><article><i class="jump-symbol">↕</i><b>Jump</b><p>The left and right pieces approach different outputs.</p></article></div>${V('discontinuities','Graphs showing a hole, a jump and an asymptote')}`);

  S('Graph features','A reliable graph-reading protocol','content','Use the same order every time',R`<div class="fn4-protocol"><div><b>1</b><span>Axes, scale and units</span></div><div><b>2</b><span>Domain and range</span></div><div><b>3</b><span>Intercepts and endpoints</span></div><div><b>4</b><span>Extrema and direction</span></div><div><b>5</b><span>Sign and discontinuities</span></div><div><b>6</b><span>Contextual meaning</span></div></div>`);

  S('Graph features','Read a complete feature set','content','One graph · several conclusions',R`<div class="fn4-two">${V('complete-feature-graph','A scaled graph with three zeros, two turning points and endpoint notation')}<div class="fn4-key"><p>Use the labelled scale to identify:</p><ul><li>domain and range;</li><li>x- and y-intercepts;</li><li>local maximum and minimum;</li><li>increasing and decreasing intervals;</li><li>positive and negative intervals;</li><li>open or closed endpoints.</li></ul></div></div>`);

  W('Graph features','Analyse a restricted quadratic',R`For \(f(x)=-(x-2)^2+9\) on \(-1\le x\le6\), determine the intercepts, maximum and range.`,[
    R`The maximum occurs at the vertex \((2,9)\).`,
    R`Solve \(-(x-2)^2+9=0\): \((x-2)^2=9\), so \(x=-1\) or \(x=5\). Both belong to the domain.`,
    R`The endpoint outputs are \(f(-1)=0\) and \(f(6)=-7\).`,
    R`The global minimum is therefore \(-7\), and the range is \([-7,9]\).`
  ],R`\[x\text{-intercepts }(-1,0),(5,0),\quad \max f=9,\quad R=[-7,9]\]`);

  T('Graph features','Analyse a labelled graph','Use the graph to communicate a complete response.',[
    R`State the domain and range.`,
    R`State all intercepts.`,
    R`Give one interval where the function is increasing and one where it is decreasing.`,
    R`State the global maximum and global minimum.`,
    R`Give one interval where \(f(x)\lt0\).`
  ],'fn4-feature-turn',R`Read each value from the labelled axes. Use interval notation for input intervals and coordinates for intercepts and extrema. Check open and closed endpoints before including boundary values.`,'complete-feature-graph');

  concept('Graph features','Intersections solve simultaneous equations','Same point · same input · same output','At an intersection, two functions have equal values.',[
    {label:'EQUATION',math:R`\[f(x)=g(x)\]`,text:'Solve for every input in the required domain.'},
    {label:'GRAPH',title:'Intersection coordinates',text:R`Each point \((x,y)\) satisfies both equations.`,className:'accent'}
  ],'intersections');

  Section('Graphing technology','Use technology transparently','A calculator result becomes mathematical evidence only when the rule, window, operation and interpretation are recorded.','calculator-workflow');

  S('Graphing technology','A transparent workflow','content','Five deliberate moves',R`<div class="fn4-workflow"><div><b>1</b><span>Define variables and domain.</span></div><div><b>2</b><span>Enter the rule accurately.</span></div><div><b>3</b><span>Choose a revealing window or table.</span></div><div><b>4</b><span>Use trace, zero, minimum, maximum or intersect.</span></div><div><b>5</b><span>Verify, round and interpret.</span></div></div>`);

  S('Graphing technology','Trace, table and window have different jobs','content','Choose the right evidence',R`<div class="fn4-card-grid"><article><span>TRACE</span><h2>Read one point</h2><p>Estimate coordinates or inspect behaviour near a feature.</p></article><article><span>TABLE</span><h2>Compare values</h2><p>Check outputs, sign changes, discrete inputs and thresholds.</p></article><article><span>WINDOW</span><h2>Reveal the model</h2><p>A poor window can hide roots, extrema or intersections.</p></article></div>`);

  S('Graphing technology','TI-84 workflow · Zero','content','Find an x-intercept',R`<div class="fn4-two">${V('ti84-zero','TI-84 screen showing the Zero command')}<div class="fn4-key"><ol><li>Enter the function in <b>Y=</b>.</li><li>Choose a window that displays the crossing.</li><li>Press <b>2nd</b> <b>TRACE</b>, then select <b>zero</b>.</li><li>Choose a left bound, right bound and guess.</li><li>Record the zero and check it belongs to the domain.</li></ol></div></div>`);

  S('Graphing technology','TI-84 workflow · Minimum and maximum','content','Locate a turning point',R`<div class="fn4-two">${V('ti84-extremum','TI-84 screen showing a maximum calculation')}<div class="fn4-key"><ol><li>Display the turning point clearly.</li><li>Open <b>CALC</b> and choose minimum or maximum.</li><li>Set bounds on opposite sides of the turning point.</li><li>Record the full coordinate, not only the output.</li></ol></div></div>`);

  S('Graphing technology','TI-84 workflow · Intersect','content','Solve \(f(x)=g(x)\)',R`<div class="fn4-two">${V('ti84-intersect','TI-84 screen showing the Intersect command')}<div class="fn4-key"><ol><li>Enter the two functions in separate Y-slots.</li><li>Display every relevant crossing.</li><li>Choose <b>intersect</b> and identify both curves.</li><li>Repeat for additional intersections.</li><li>Interpret only solutions in the contextual domain.</li></ol></div></div>`);

  S('Graphing technology','The rule of four checks the model','content','Context · table · graph · formula',R`<div class="fn4-representation-grid large"><article><span>CONTEXT</span><b>Meaning, units and restrictions</b></article><article><span>TABLE</span><b>Selected exact values</b></article><article><span>GRAPH</span><b>Shape, features and multiple solutions</b></article><article><span>FORMULA</span><b>Calculation and parameter structure</b></article></div><div class="fn4-note">A disagreement among representations is a warning: the entry, scale, table, formula or interpretation may be wrong.</div>`);

  T('Graphing technology','Model and verify a delivery tariff',R`A delivery service charges \(C(d)=12+1.8d\) QAR for \(0\le d\le10\), and \(C(d)=30+0.9(d-10)\) QAR for \(10\lt d\le30\).`,[
    R`Calculate the charge for 8 km and for 18 km.`,
    R`Explain why the two domain intervals do not overlap at \(d=10\).`,
    R`State the range of the model.`,
    R`Describe one assumption or limitation.`
  ],'fn4-delivery-model',R`\(C(8)=26.4\) QAR and \(C(18)=37.2\) QAR. The first rule owns \(d=10\), while the second begins immediately after 10 km, so each input has one charge. The range is \([12,48]\) QAR. A limitation is that traffic, tolls or surge pricing are ignored.`,'delivery-piecewise');

  Section('Inverse relations','Reverse the input–output direction','The inverse relation swaps coordinates and reflects the graph in the line \(y=x\).','inverse-reflection');

  S('Inverse relations','Swap coordinates to form the inverse relation','content','Input becomes output',R`<div class="fn4-two">${V('inverse-reflection','A function and its inverse relation reflected in y equals x')}<div class="fn4-key"><div class="fn4-math">\[(x,y)\longmapsto(y,x)\]</div><p>If \((3,11)\) lies on a function, then \((11,3)\) lies on its inverse relation.</p><p>The original domain becomes the inverse range, and the original range becomes the inverse domain.</p></div></div>`);

  S('Inverse relations','Interactive reflection','lab','Move one point and observe its reflection',R`<div class="fn4-interactive" data-fn4-inverse><div><label>Choose \(x\)<input type="range" min="-3" max="5" step="1" value="2" data-fn4-inverse-x></label><p>Original function: \(f(x)=2x+1\).</p><div class="fn4-live" data-fn4-inverse-readout></div></div><svg viewBox="0 0 620 360" role="img" aria-label="Interactive inverse reflection"><rect width="620" height="360" rx="22" fill="#fff"/><line x1="45" y1="300" x2="580" y2="300" stroke="#17324d" stroke-width="3"/><line x1="165" y1="330" x2="165" y2="25" stroke="#17324d" stroke-width="3"/><line x1="70" y1="335" x2="555" y2="45" stroke="#d4a72c" stroke-width="4" stroke-dasharray="10 8"/><circle data-fn4-original r="10" fill="#7a1733"/><circle data-fn4-inverse-point r="10" fill="#177e89"/></svg></div>`);

  concept('Inverse relations','When is the inverse relation also a function?','Use a horizontal line','The inverse relation is a function exactly when the original function is one-to-one.',[
    {label:'ONE-TO-ONE',title:'Every output has one preimage',text:'Every horizontal line meets the graph at most once.'},
    {label:'NOT ONE-TO-ONE',title:'Some output has several preimages',text:'After coordinates are swapped, one inverse input would have several outputs.',className:'danger'}
  ],'horizontal-line-test');

  S('Inverse relations','Domain and range swap','content','A structural check',R`<div class="fn4-two"><article class="fn4-key"><span>ORIGINAL</span><div class="fn4-math">\[D_f=[0,6],\qquad R_f=[2,14]\]</div></article><article class="fn4-key accent"><span>INVERSE RELATION</span><div class="fn4-math">\[D_{f^{-1}}=[2,14],\qquad R_{f^{-1}}=[0,6]\]</div></article></div><div class="fn4-note">This swap is visible in the reflection across \(y=x\).</div>`);

  W('Inverse relations','Interpret an inverse relation',R`A temperature conversion function satisfies \(C(68)=20\), where the input is degrees Fahrenheit and the output is degrees Celsius. Interpret the corresponding inverse statement.`,[
    R`The point \((68,20)\) lies on the original function.`,
    R`Swap the coordinates to obtain \((20,68)\) on the inverse relation.`,
    R`Interpret the new input and output units.`
  ],R`\[C^{-1}(20)=68\]`,R`A temperature of 20 °C corresponds to 68 °F.`);

  S('Synthesis','A complete function analysis','content','Connect every representation',R`<div class="fn4-synthesis"><article><b>1 · Function?</b><span>Check one output per permitted input.</span></article><article><b>2 · Notation</b><span>Calculate images and determine preimages.</span></article><article><b>3 · Domain</b><span>Use algebraic and contextual restrictions.</span></article><article><b>4 · Range</b><span>Use attained outputs, endpoints and extrema.</span></article><article><b>5 · Graph</b><span>Read intercepts, sign, direction and discontinuities.</span></article><article><b>6 · Technology</b><span>Record the operation, output and interpretation.</span></article><article><b>7 · Inverse</b><span>Swap coordinates and reflect in \(y=x\).</span></article></div><div class="fn4-next"><button class="primary-btn route-jump" data-go="practice">Practice Studio</button><button class="secondary-btn route-jump" data-go="exam">IB Tasks</button><button class="secondary-btn route-jump" data-go="quiz">Timed Quiz</button><button class="secondary-btn route-jump" data-go="review">Mastery</button></div>`);
})();
