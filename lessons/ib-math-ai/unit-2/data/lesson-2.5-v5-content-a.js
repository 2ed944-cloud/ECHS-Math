(function(){
  'use strict';
  const B=window.__ECHS_TCI5_BUILD;if(!B)throw new Error('Lesson 2.5 v5 builder is missing.');
  const {R,S,V,Cover,Section,Concept,Worked,Student,Checkpoint,Misconception}=B;

  Cover(
    'Transformations, Composition, and Inverses',
    'Track every input and output deliberately, transform exact graph features, reverse one-to-one processes, and use technology as evidence rather than as a substitute for reasoning.',
    'cover',
    ['Point mapping','Exact graphs','Domain restrictions','Inverse processes','TI‑84 evidence']
  );

  S('Launch','A reversible calibration','content','Inquiry launch',R`<div class="tci5-inquiry"><div><span>START WITH THE PROCESS</span><h2>A sensor converts temperature by \\(S(T)=1.6T+12\\).</h2><p>The forward rule turns a physical temperature into a signal. The inverse rule must recover the temperature from the signal. What must be true for this reversal to be unique, meaningful and correctly unit-labelled?</p><textarea class="student-note" data-note="inquiry-calibration" placeholder="State one mathematical condition and one contextual condition."></textarea></div>${V('reversible-process','Forward and reverse sensor process')}</div>`);

  S('Launch','Learning outcomes','content','By the end',R`<div class="tci5-outcomes"><label><input type="checkbox" data-reflect="tci5-o1"><span>Describe and construct translations, reflections, stretches and compressions of familiar graphs.</span></label><label><input type="checkbox" data-reflect="tci5-o2"><span>Use the coordinate map for \\(g(x)=a f(b(x-h))+k\\) without sign or reciprocal errors.</span></label><label><input type="checkbox" data-reflect="tci5-o3"><span>Transform points, intercepts, extrema, asymptotes, domain and range precisely.</span></label><label><input type="checkbox" data-reflect="tci5-o4"><span>Find inverse functions, select valid restrictions and interpret reversed units.</span></label><label><input type="checkbox" data-reflect="tci5-o5"><span>Build and interpret compositions for multi-stage processes.</span></label><label><input type="checkbox" data-reflect="tci5-o6"><span>Use TI‑84 graphs and evaluations transparently, then verify them independently.</span></label></div>`);

  S('Launch','Lesson architecture','content','Six connected blocks',R`<div class="tci5-roadmap"><article><b>A</b><h2>Single transformations</h2><p>Translations, reflections and scales.</p></article><article><b>B</b><h2>Combined transformations</h2><p>Coordinate maps and transformed features.</p></article><article><b>C</b><h2>Inverse functions</h2><p>One-to-one behaviour, restrictions and units.</p></article><article><b>D</b><h2>Composition</h2><p>Ordered multi-stage processes.</p></article><article><b>E</b><h2>TI‑84 evidence</h2><p>Overlay, reflection and composition checks.</p></article><article><b>F</b><h2>IB synthesis</h2><p>Interpretation, validation and communication.</p></article></div>`);

  S('Launch','Prerequisite diagnostic','student','Do this without a calculator',R`<div class="tci5-diagnostic"><ol><li>The point \\((3,-2)\\) lies on \\(y=f(x)\\). State \\(f(3)\\).</li><li>Solve \\(2x-5=9\\).</li><li>State the domain of \\(y=\\sqrt{x-4}\\).</li><li>Explain why \\(x^2\\) gives the same output at \\(x=3\\) and \\(x=-3\\).</li></ol><textarea class="student-note" data-note="diagnostic-2-5" placeholder="Record all four responses."></textarea><details><summary>Check the prerequisite reasoning</summary><div class="solution-panel">1. \\(f(3)=-2\\). 2. \\(x=7\\). 3. \\(x\\ge4\\). 4. Squaring removes the sign, so the unrestricted quadratic is not one-to-one.</div></details></div>`);

  Concept('Launch','Vocabulary and notation','Use each symbol accurately','Inverse notation is especially vulnerable to ambiguity.',[
    {title:'Transformation',math:R`\\(g(x)=a f(b(x-h))+k\\)`,text:'A rule that changes coordinates or graph features in a controlled way.'},
    {title:'Composition',math:R`\\((f\\circ g)(x)=f(g(x))\\)`,text:'Apply the inner function first, then the outer function.'},
    {title:'Inverse function',math:R`\\(f^{-1}(y)=x\\iff f(x)=y\\)`,text:'Reverses an input-output pairing on an appropriate domain.'},
    {title:'Reciprocal',math:R`\\(\\dfrac{1}{f(x)}\\)`,text:'A different operation; it does not reverse the function.'},
    {title:'One-to-one',text:'Distinct allowed inputs produce distinct outputs.'},
    {title:'Identity',math:R`\\(I(x)=x\\)`,text:'The result of composing a function with its inverse on valid domains.'}
  ],'notation-map',R`Use \\(f^{-1}\\) only for the inverse function; use \\(1/f\\) for the reciprocal.`);

  S('Launch','IB command terms and evidence','content','Answer the verb',R`<div class="tci5-command-grid"><article><b>Describe</b><p>Name every transformation, factor, direction and axis.</p></article><article><b>Determine</b><p>Obtain the unique result and justify restrictions.</p></article><article><b>Sketch</b><p>Show labelled axes, key features, correct shape and asymptotes.</p></article><article><b>Verify</b><p>Use substitution, composition or mapped points to confirm.</p></article><article><b>Interpret</b><p>State the reversed variables, units and contextual meaning.</p></article><article><b>Comment</b><p>Judge uniqueness, validity, precision or modelling limitations.</p></article></div>`);

  S('Launch','Manual-first calculator contract','content','Technology with purpose',R`<div class="tci5-contract"><article><span>BEFORE THE TI‑84</span><h2>Predict structure</h2><ul><li>Identify the parent graph or process.</li><li>Predict direction, scale, fixed features and domain.</li><li>Write the exact equation or composition.</li></ul></article><article><span>ON THE TI‑84</span><h2>Collect evidence</h2><ul><li>Enter each expression with deliberate parentheses.</li><li>Choose a window that reveals the claimed feature.</li><li>Use graph, table or function evaluation—not visual guessing.</li></ul></article><article><span>AFTER THE TI‑84</span><h2>Verify and communicate</h2><ul><li>Map a point or substitute an output.</li><li>Check domain, range and units.</li><li>Write a mathematical conclusion, not “the calculator says”.</li></ul></article></div>`);

  Section('Block A · Single transformations','Control inputs and outputs separately','A transformation is reliable only when you can predict exactly how a general point \\((u,v)\\) moves.','block-a');

  Concept('Block A · Single transformations','The master transformation','One formula, four controls','Let \\((u,v)\\) lie on \\(y=f(x)\\), so \\(v=f(u)\\). For \\(g(x)=a f(b(x-h))+k\\), the transformed input must satisfy \\(b(x-h)=u\\).',[
    {label:'OUTSIDE',title:'Vertical control',math:R`\\(a\\text{ and }k\\)`,list:['Multiply outputs by \\(a\\).','Translate outputs by \\(k\\).','If \\(a<0\\), reflect in the x-axis.']},
    {label:'INSIDE',title:'Horizontal control',math:R`\\(b\\text{ and }h\\)`,list:['Divide x-coordinates by \\(b\\).','Translate by \\(h\\).','If \\(b<0\\), reflect in the y-axis.']}
  ],'master-transform',R`The exact coordinate map is \\((u,v)\\mapsto\\left(h+\\dfrac{u}{b},\,k+av\\right)\\), where \\(b\\ne0\\).`);

  Worked('Block A · Single transformations','Derive the coordinate map',R`A point \\((u,v)\\) lies on \\(y=f(x)\\). Derive its image on \\(g(x)=a f(b(x-h))+k\\).`,[
    R`Because \\(v=f(u)\\), force the transformed input to equal \\(u\\): \\(b(x-h)=u\\).`,
    R`Solve for the new x-coordinate: \\(x=h+\\dfrac{u}{b}\\).`,
    R`The transformed output is \\(g(x)=av+k\\).`,
    R`Therefore \\((u,v)\\mapsto\\left(h+\\dfrac{u}{b},\,k+av\\right)\\).`
  ],R`\\[T(u,v)=\\left(h+\\frac{u}{b},\,k+av\\right)\\]`,'This map prevents the most common horizontal-sign and reciprocal errors.','point-map-derivation');

  Concept('Block A · Single transformations','Vertical translations','Outputs change directly','Adding outside the function changes every y-coordinate by the same amount.',[
    {title:'Rule',math:R`\\(g(x)=f(x)+k\\)`,text:'Translate up by \\(k\\) when \\(k>0\\), down by \\(|k|\\) when \\(k<0\\).'},
    {title:'Point map',math:R`\\((u,v)\\mapsto(u,v+k)\\)`,text:'x-coordinates do not change.'},
    {title:'Features',text:'Every horizontal asymptote, intercept height, maximum and minimum shifts by the same vertical amount.'}
  ],'vertical-translation');

  Concept('Block A · Single transformations','Horizontal translations','The inside sign is opposite','Replacing \\(x\\) by \\(x-h\\) moves the graph to the right by \\(h\\).',[
    {title:'Rule',math:R`\\(g(x)=f(x-h)\\)`,text:'Right by \\(h\\) when \\(h>0\\); left when \\(h<0\\).'},
    {title:'Point map',math:R`\\((u,v)\\mapsto(u+h,v)\\)`,text:'y-coordinates do not change.'},
    {title:'Reason',math:R`\\(x-h=u\\Rightarrow x=u+h\\)`,text:'The coordinate equation—not a memorised slogan—explains the sign.'}
  ],'horizontal-translation');

  S('Block A · Single transformations','An exact translation overlay','content','Read points, not just shape',R`<div class="tci5-graph-study"><div>${V('translation-graph','Exact graph of y=x squared and y=(x-2) squared minus 3')}</div><div><h2>Base and image</h2><p>The base graph is \\(f(x)=x^2\\). The image is \\(g(x)=(x-2)^2-3\\).</p><ul><li>Vertex: \\((0,0)\\mapsto(2,-3)\\).</li><li>Point: \\((2,4)\\mapsto(4,1)\\).</li><li>Axis of symmetry: \\(x=0\\mapsto x=2\\).</li><li>Range: \\(y\\ge0\\mapsto y\\ge-3\\).</li></ul></div></div>`);

  Worked('Block A · Single transformations','Translate a rational graph',R`The graph of \\(f(x)=\\dfrac{1}{x-1}+2\\) is translated 3 units left and 4 units down. Determine the new rule and asymptotes.`,[
    R`A shift 3 left replaces \\(x\\) by \\(x+3\\): \\(f(x+3)=\\dfrac{1}{x+2}+2\\).`,
    R`A shift 4 down gives \\(g(x)=\\dfrac{1}{x+2}-2\\).`,
    R`The vertical asymptote \\(x=1\\) moves to \\(x=-2\\).`,
    R`The horizontal asymptote \\(y=2\\) moves to \\(y=-2\\).`
  ],R`\\[g(x)=\\frac{1}{x+2}-2,\qquad x=-2,\quad y=-2\\]`,'Transform the graph features using the same coordinate map as ordinary points.','translated-rational');

  Student('Block A · Single transformations','Translation audit',R`The base graph \\(y=|x|\\) is transformed to \\(y=|x+4|+2\\).`,[
    'Describe both translations in words.',
    R`State the image of the vertex \\((0,0)\\).`,
    R`State the new range.`,
    R`Explain the sign of the horizontal translation using \\(x+4=u\\).`
  ],'turn-translation',R`Translate 4 units left and 2 units up. The vertex becomes \\((-4,2)\\), and the range is \\(y\\ge2\\). Since \\(x+4=u\\), the new coordinate is \\(x=u-4\\).`,'translation-absolute');

  Concept('Block A · Single transformations','Reflections: input or output?','Two different axes','A negative outside changes outputs. A negative inside changes inputs.',[
    {title:'x-axis reflection',math:R`\\(g(x)=-f(x)\\)`,text:'Point map \\((u,v)\\mapsto(u,-v)\\).'},
    {title:'y-axis reflection',math:R`\\(g(x)=f(-x)\\)`,text:'Point map \\((u,v)\\mapsto(-u,v)\\).'},
    {title:'Both axes',math:R`\\(g(x)=-f(-x)\\)`,text:'Point map \\((u,v)\\mapsto(-u,-v)\\), equivalent to a 180° rotation about the origin.'}
  ],'reflection-rules');

  S('Block A · Single transformations','Reflections compared on one grid','content','The function is deliberately asymmetric',R`<div class="tci5-graph-study"><div>${V('reflection-graph','Comparison of f(x), negative f(x), and f(negative x)')}</div><div><h2>Why asymmetry matters</h2><p>For an even function such as \\(x^2\\), \\(f(-x)=f(x)\\), so a y-axis reflection appears unchanged. Here the base function is asymmetric, making the two reflections visibly different.</p><ul><li>Maroon: \\(y=f(x)\\).</li><li>Teal: \\(y=-f(x)\\).</li><li>Gold: \\(y=f(-x)\\).</li></ul></div></div>`);

  Concept('Block A · Single transformations','Reflection point maps','Track coordinates explicitly','Start with a point on the base graph and change only the coordinate controlled by the transformation.',[
    {title:'Given',math:R`\\(f(3)=-5\\)`,text:'The base graph contains \\((3,-5)\\).'},
    {title:'On \\(y=-f(x)\\)',math:R`\\((3,-5)\\mapsto(3,5)\\)`,text:'Only the output sign changes.'},
    {title:'On \\(y=f(-x)\\)',math:R`\\((3,-5)\\mapsto(-3,-5)\\)`,text:'Only the input coordinate changes.'}
  ],'reflection-points');

  Worked('Block A · Single transformations','Combine two reflections',R`Describe \\(g(x)=-e^{-x}\\) as a transformation of \\(f(x)=e^x\\), and map the point \\((0,1)\\).`,[
    R`Replacing \\(x\\) by \\(-x\\) reflects the graph in the y-axis: \\(e^{-x}\\).`,
    R`Multiplying by \\(-1\\) reflects the result in the x-axis: \\(-e^{-x}\\).`,
    R`The point \\((0,1)\\) remains at x-coordinate 0 after the first reflection and becomes \\((0,-1)\\) after the second.`,
    R`The horizontal asymptote \\(y=0\\) is unchanged by both reflections.`
  ],R`\\[(0,1)\\mapsto(0,-1)\\]`,'The two sign changes act on different coordinates and should be named separately.','double-reflection');

  Student('Block A · Single transformations','Reflection audit',R`The point \\((-4,7)\\) lies on \\(y=f(x)\\). Consider \\(g(x)=2-f(-x)\\).`,[
    'State the reflection involved.',
    'Determine the image of the point.',
    R`Explain why the transformation is not the same as \\(2-f(x)\\).`
  ],'turn-reflection',R`The inside negative reflects in the y-axis, so \\((-4,7)\\mapsto(4,7)\\). Then \\(2-v\\) maps the output to \\(2-7=-5\\). The image is \\((4,-5)\\). In \\(2-f(x)\\), the x-coordinate would remain \\(-4\\).`,'reflection-affine');

  Concept('Block A · Single transformations','Vertical scales','Outside factors act directly on y','For \\(g(x)=a f(x)\\), multiply each output by \\(a\\).',[
    {title:'Stretch',math:R`\\(|a|>1\\)`,text:'Distances from the x-axis multiply by \\(|a|\\).'},
    {title:'Compression',math:R`\\(0<|a|<1\\)`,text:'Distances from the x-axis shrink.'},
    {title:'Reflection',math:R`\\(a<0\\)`,text:'The sign change adds a reflection in the x-axis.'},
    {title:'Point map',math:R`\\((u,v)\\mapsto(u,av)\\)`,text:'Zeros remain fixed because \\(a\cdot0=0\\).'}
  ],'vertical-scale');

  Concept('Block A · Single transformations','Horizontal scales','Inside factors act reciprocally on x','For \\(g(x)=f(bx)\\), solve \\(bx=u\\), so the new coordinate is \\(u/b\\).',[
    {title:'Compression',math:R`\\(|b|>1\\)`,text:'Horizontal distances divide by \\(|b|\\).'},
    {title:'Stretch',math:R`\\(0<|b|<1\\)`,text:'Horizontal distances multiply by \\(1/|b|\\).'},
    {title:'Reflection',math:R`\\(b<0\\)`,text:'The input sign adds a y-axis reflection.'},
    {title:'Point map',math:R`\\((u,v)\\mapsto(u/b,v)\\)`,text:'y-values remain unchanged.'}
  ],'horizontal-scale');

  S('Block A · Single transformations','Horizontal and vertical scaling compared','content','Use a non-homogeneous base function',R`<div class="tci5-graph-study"><div>${V('scale-graph','Exact comparison of vertical and horizontal scaling')}</div><div><h2>Base function</h2><p>Use \\(f(x)=x^2-2x\\). It has zeros at 0 and 2.</p><ul><li>\\(2f(x)\\) keeps zeros at 0 and 2 but doubles y-values.</li><li>\\(f(2x)\\) moves the second zero from 2 to 1.</li><li>\\(f(x/2)\\) moves the second zero from 2 to 4.</li></ul><p>This separates vertical and horizontal effects more clearly than using \\(x^2\\) alone.</p></div></div>`);

  Worked('Block A · Single transformations','Scale a point and a feature',R`The point \\((6,-2)\\) lies on \\(y=f(x)\\). Determine its image on \\(g(x)=-3f(2x)\\), and describe the scale/reflection.`,[
    R`Solve \\(2x=6\\), giving the new x-coordinate \\(x=3\\).`,
    R`Multiply the output by \\(-3\\): \\(-3(-2)=6\\).`,
    R`Therefore the point maps to \\((3,6)\\).`,
    R`The graph is horizontally compressed by factor \\(1/2\\), vertically stretched by factor 3, and reflected in the x-axis.`
  ],R`\\[(6,-2)\\mapsto(3,6)\\]`,'The sign of the outside factor changes orientation as well as scale.','scale-point');

  Student('Block A · Single transformations','Scale audit',R`The graph of \\(y=f(x)\\) contains \\((-8,5)\\). Let \\(g(x)=\\tfrac12 f(-x/4)\\).`,[
    'Describe the horizontal scale and reflection.',
    'Describe the vertical scale.',
    'Determine the image of the point.',
    R`Write the coordinate map for a general point \\((u,v)\\).`
  ],'turn-scale',R`Here \\(b=-1/4\\), so the graph is reflected in the y-axis and stretched horizontally by factor 4. The vertical factor is \\(1/2\\). The map is \\((u,v)\\mapsto(-4u,v/2)\\), so \\((-8,5)\\mapsto(32,2.5)\\).`,'scale-audit');

  Misconception('Inside factors are not ordinary multipliers',R`“\\(f(3x)\\) stretches the graph horizontally by factor 3.”`,R`A base point at input \\(u\\) reappears when \\(3x=u\\), hence at \\(x=u/3\\). The graph is compressed horizontally by factor \\(1/3\\). Derive the new coordinate instead of reading the inside factor directly.`,'reciprocal-error');

  Checkpoint('Checkpoint A · Single transformations',[
    R`Describe \\(y=-2f(3x)+5\\) from \\(y=f(x)\\).`,
    R`Map \\((9,-4)\\) under that transformation.`,
    R`A base horizontal asymptote is \\(y=2\\). Determine its image.`,
    R`Explain why \\(f(-x)\\) and \\(-f(x)\\) may look identical for some special functions but are still different operations.`
  ],'checkpoint-a',R`Horizontal compression by \\(1/3\\); reflection in the x-axis; vertical stretch by 2; translate 5 up. The point maps to \\((3,13)\\). The asymptote maps to \\(y=-2(2)+5=1\\). For an odd function the two expressions may coincide, and for an even function \\(f(-x)=f(x)\\), but the coordinate actions remain different.`);
})();
