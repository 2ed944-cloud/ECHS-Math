(function(){
  'use strict';
  const {R,S,V,concept,W,T,Q,Section}=window.__ECHS_FN4_BUILD;

  S('Functions','Functions, Domain, Range, and Representations','cover','IB Mathematics: Applications and Interpretation SL',R`<div class="fn4-cover"><div><div class="fn4-kicker">RELATIONS · NOTATION · DOMAIN · RANGE · GRAPHS</div><h1><span>2.1</span><b>Functions,</b><b>Domain, Range,</b><b>and Representations</b></h1><p>A function assigns exactly one output to every permitted input. Develop that idea through contexts, mappings, tables, formulae and graphs.</p><div class="fn4-central"><b>Central idea</b><span>A function is a rule together with the inputs for which that rule is used.</span></div><button class="primary-btn" data-cover-next="1">Begin lesson</button></div>${V('cover-parking','A function shown as a context, table, formula and graph')}</div>`);

  S('Launch','Airport parking: one time, one charge','inquiry','Opening problem',R`<div class="fn4-opening"><div><span>SHORT-STAY CAR PARK</span><h2>The charge depends on the time parked.</h2><table class="fn4-table compact"><thead><tr><th>Time \(t\) (hours)</th><th>Charge \(C\) (QAR)</th></tr></thead><tbody><tr><td>\(0\lt t\le1\)</td><td>10</td></tr><tr><td>\(1\lt t\le2\)</td><td>18</td></tr><tr><td>\(2\lt t\le3\)</td><td>24</td></tr><tr><td>\(3\lt t\le6\)</td><td>32</td></tr><tr><td>\(6\lt t\le12\)</td><td>48</td></tr><tr><td>\(12\lt t\le24\)</td><td>70</td></tr></tbody></table></div>${V('parking-step','Step graph of the airport parking tariff')}</div><div class="fn4-question-strip"><div><b>1</b><span>What inputs are permitted?</span></div><div><b>2</b><span>What outputs are possible?</span></div><div><b>3</b><span>Why does each time produce only one charge?</span></div></div>`);

  S('Launch','Learning intentions','content','By the end of the lesson',R`<div class="fn4-goals">${[
    'Decide whether a relation is a function from ordered pairs, a mapping, a table, an equation or a graph.',
    'Use function notation to calculate images and determine preimages.',
    'State mathematical and contextual domains and ranges using accurate notation.',
    'Identify intercepts, extrema, sign, direction of change, endpoints and discontinuities.',
    'Use graphing technology to find zeros, extrema and intersections and record the evidence.',
    'Connect a function and its inverse relation by reflection in \(y=x\).'
  ].map((value,index)=>`<label><input type="checkbox" data-reflect="fn4-goal-${index+1}"><span>${value}</span></label>`).join('')}</div>`);

  T('Launch','Readiness check','Recall four ideas before beginning.',[
    R`In the ordered pair \((-3,7)\), identify the input and the output.`,
    R`Evaluate \(2(-4)^2-3(-4)\).`,
    R`Write \(-2\le x\lt5\) using interval notation.`,
    R`State whether \(x=4\) is permitted in \(\dfrac1{x-4}\).`
  ],'fn4-readiness',R`Input \(-3\), output 7; \(44\); \([-2,5)\); \(x=4\) is excluded because it makes the denominator zero.`);

  Section('Relations and functions','What makes a relation a function?','Inspect the input–output structure rather than the appearance of the representation.','mapping-types');

  concept('Relations and functions','Relations connect two variables','Definition','A relation is any set of ordered pairs connecting values of two variables.',[
    {label:'ORDERED PAIRS',math:R`\[R=\{(-2,3),(0,-1),(2,3)\}\]`,text:'Each ordered pair records an input and an output.'},
    {label:'REPRESENTATIONS',title:'Many forms',list:['ordered pairs','mapping diagram','table','equation','graph','verbal rule'],className:'accent'}
  ],'relation-representations');

  S('Relations and functions','One relation in four representations','content','Every ordered pair must be preserved',R`<div class="fn4-representation-grid"><article><span>ORDERED PAIRS</span><b>\(\{(0,5),(1,8),(2,11),(3,14)\}\)</b></article><article><span>TABLE</span><table class="fn4-table mini"><tr><th>\(x\)</th><td>0</td><td>1</td><td>2</td><td>3</td></tr><tr><th>\(y\)</th><td>5</td><td>8</td><td>11</td><td>14</td></tr></table></article><article><span>FORMULA</span><b>\(y=3x+5\)</b></article><article><span>GRAPH</span><b>A straight line through \((0,5)\) with gradient 3.</b></article></div><div class="fn4-note">A mismatch means that the representations do not describe the same relation.</div>`);

  concept('Relations and functions','A function has one output for every permitted input','Definition','The word permitted matters: only inputs in the domain are tested.',[
    {label:'ALLOWED',title:'Many-to-one',text:'Different inputs may share the same output.'},
    {label:'NOT ALLOWED',title:'One-to-many',text:'One input may not have two different outputs.',className:'danger'}
  ],'function-rule',R`<b>Function rule:</b> no permitted input is paired with two different outputs.`);

  S('Relations and functions','Three mapping patterns','content','Follow arrows from each input',R`${V('mapping-types','One-to-one, many-to-one and one-to-many mapping diagrams')}<div class="fn4-caption"><b>One-to-one</b> and <b>many-to-one</b> are functions. <b>One-to-many</b> is not.</div>`);

  S('Relations and functions','Test ordered pairs and tables','content','Inspect first coordinates',R`<div class="fn4-compare"><article class="good"><span>FUNCTION</span><div class="fn4-math">\[\{(-2,5),(0,1),(3,5),(7,9)\}\]</div><p>Each input appears once. Repeated output 5 is permitted.</p></article><article class="bad"><span>NOT A FUNCTION</span><div class="fn4-math">\[\{(-2,5),(0,1),(3,5),(0,9)\}\]</div><p>The input 0 is paired with two different outputs.</p></article></div><div class="fn4-note">In a table, scan the input column before studying the outputs.</div>`);

  concept('Relations and functions','Test an equation algebraically','Choose one input','Ask how many real values of \(y\) are possible for a fixed input \(x\).',[
    {label:'FUNCTION',math:R`\[y=3x-1\]`,text:'Every real input produces one real output.'},
    {label:'NOT A FUNCTION OF x',math:R`\[x=y^2\]`,text:R`For \(x=4\), the outputs are \(y=2\) and \(y=-2\).`,className:'danger'}
  ]);

  S('Relations and functions','The vertical-line test','content','A graphical test',R`<div class="fn4-two">${V('vertical-test','A parabola passing and a circle failing the vertical-line test')}<div class="fn4-key"><ol><li>Move an imaginary vertical line across the graph.</li><li>If every vertical line meets the relation at most once, the relation is a function of \(x\).</li><li>One vertical line with two intersections is enough to reject it.</li></ol></div></div>`);

  W('Relations and functions','Classify a relation from an equation',R`Determine whether \(x^2+y=9\) defines \(y\) as a function of \(x\).`,[
    R`Rearrange for the output variable: \(y=9-x^2\).`,
    R`For every real input \(x\), this rule produces exactly one real output.`,
    R`Therefore the relation defines \(y\) as a function of \(x\).`
  ],R`\[\boxed{y=9-x^2\text{ is a function of }x}\]`);

  T('Relations and functions','Mixed classification','Decide whether \(y\) is a function of \(x\) for each relation.',[
    R`\(y^2=x+4\)`,
    R`\(y=\sqrt{x+4}\)`,
    R`\(x+y=7\)`,
    R`\((-1,3),(0,5),(2,3),(0,8)\)`
  ],'fn4-relations-mixed',R`1. Not a function: many inputs have two values of \(y\). 2. A function on \(x\ge-4\): the principal square root gives one output. 3. A function because \(y=7-x\). 4. Not a function because input 0 has two outputs.`);

  Q('Relations checkpoint',[
    R`Explain why a many-to-one relation can still be a function.`,
    R`State the decisive feature in a table.`,
    R`State the decisive feature in a graph.`,
    R`Give one equation that is not \(y\) as a function of \(x\).`
  ],'fn4-relations-check',R`Many-to-one still gives one output per input. In a table, look for one input paired with different outputs. In a graph, use the vertical-line test. One example is \(x=y^2\).`);

  Section('Function notation','Ask precise input–output questions','Function notation records the rule, the chosen input and the resulting output.','function-machine');

  concept('Function notation','Read \(f(x)\) as “f of x”','It is not multiplication','The letter \(f\) names the function; \(x\) is a placeholder for an allowed input.',[
    {label:'RULE',math:R`\[f(x)=2x^2-3x+1\]`,text:'The formula describes how the output is obtained.'},
    {label:'FUNCTION VALUE',math:R`\[f(4)=21\]`,text:R`The point \((4,21)\) lies on the graph.`,className:'accent'}
  ]);

  W('Function notation','Evaluate a function value',R`For \(f(x)=2x^2-3x+1\), calculate \(f(5)\).`,[
    R`Replace every occurrence of \(x\) by 5.`,
    R`\(f(5)=2(5)^2-3(5)+1\).`,
    R`Evaluate: \(50-15+1=36\).`
  ],R`\[\boxed{f(5)=36}\]`);

  S('Function notation','Negative inputs need brackets','content','Protect the sign',R`<div class="fn4-compare"><article class="good"><span>CORRECT</span><div class="fn4-math">\[f(-3)=2(-3)^2-3(-3)+1=28\]</div><p>The exponent applies to the entire input.</p></article><article class="bad"><span>COMMON ERROR</span><div class="fn4-math">\[2(-3^2)\ne2(-3)^2\]</div><p>Without brackets, the exponent may be applied before the negative sign.</p></article></div>`);

  S('Function notation','Images and preimages ask opposite questions','content','Know the direction',R`<div class="fn4-image-preimage"><div><span>IMAGE</span><b>input known</b><div class="fn4-math">\[f(3)=11\]</div><p>11 is the image of 3.</p></div><i>⇄</i><div><span>PREIMAGE</span><b>output known</b><div class="fn4-math">\[f(x)=11\]</div><p>Every solution is a preimage of 11.</p></div></div><div class="fn4-note">An output may have more than one preimage without violating the function rule.</div>`);

  S('Function notation','Read images and preimages from a graph','content','Vertical for image · horizontal for preimage',R`<div class="fn4-two">${V('image-preimage','A graph showing an image and two preimages')}<div class="fn4-key"><ol><li>To find \(f(a)\), start at \(x=a\) and move vertically to the graph.</li><li>To solve \(f(x)=k\), use the horizontal line \(y=k\).</li><li>Every relevant intersection gives a preimage.</li></ol></div></div>`);

  S('Function notation','Read notation from a table','content','A table stores ordered pairs',R`<div class="fn4-two"><table class="fn4-table"><tr><th>\(x\)</th><th>\(-2\)</th><th>0</th><th>3</th><th>7</th></tr><tr><th>\(f(x)\)</th><td>5</td><td>\(-1\)</td><td>5</td><td>12</td></tr></table><div class="fn4-key"><ul><li>\(f(0)=-1\).</li><li>The image of 7 is 12.</li><li>The preimages of 5 are \(-2\) and 3.</li><li>\((3,5)\) lies on the graph.</li></ul></div></div>`);

  S('Function notation','Interpret notation with variables and units','content','Complete the sentence',R`<div class="fn4-context"><span>DELIVERY MODEL</span><div class="fn4-math">\[C(12)=47\]</div><p class="weak"><b>Incomplete:</b> “12 gives 47.”</p><p class="strong"><b>Complete:</b> For a delivery distance of 12 km, the model predicts a charge of QAR 47.</p><div class="fn4-two compact"><div><b>Independent variable</b><span>distance \(d\), measured in kilometres</span></div><div><b>Dependent variable</b><span>charge \(C(d)\), measured in QAR</span></div></div></div>`);

  W('Function notation','Find images and preimages',R`Let \(p(x)=x^2-5\). Calculate \(p(-4)\), then determine all preimages of 11.`,[
    R`\(p(-4)=(-4)^2-5=11\).`,
    R`Set \(p(x)=11\): \(x^2-5=11\).`,
    R`Solve \(x^2=16\), so \(x=-4\) or \(x=4\).`
  ],R`\[p(-4)=11,\qquad p(x)=11\Rightarrow x=\pm4\]`);
})();
