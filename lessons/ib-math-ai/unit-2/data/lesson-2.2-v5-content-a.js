(function(){
  'use strict';
  const {R,S,V,concept,W,T,Q,Section}=window.__ECHS_LQ5_BUILD;

  S('Linear and Quadratic Models','Linear and Quadratic Models','cover','IB Mathematics: Applications and Interpretation SL',R`<div class="lq5-cover"><div><div class="lq5-kicker">RATE · INTERSECTION · ROOTS · VERTEX · MODELLING</div><h1><span>2.2</span><b>Linear and</b><b>Quadratic Models</b></h1><p>Build models from structure and context, solve them exactly when possible, use the TI‑84 Plus CE transparently, and judge whether every answer is meaningful.</p><div class="lq5-central"><b>Central question</b><span>When is constant change enough, and when does curvature produce a better model?</span></div><button class="primary-btn" data-cover-next="1">Begin lesson</button></div>${V('cover-models','A line and a parabola compared accurately on common axes')}</div>`);

  S('Launch','Two transport plans','inquiry','Opening decision',R`<div class="lq5-opening"><div><span>DOHA ACTIVITY TRIP</span><h2>Two providers quote different transport costs.</h2><div class="lq5-plan-grid"><article><b>Plan A</b><div class="lq5-math">\[A(d)=180+3.2d\]</div></article><article><b>Plan B</b><div class="lq5-math">\[B(d)=60+5.6d\]</div></article></div><p>Cost is in QAR and distance \(d\) is in kilometres.</p></div>${V('opening-plans','Two linear cost models and their break-even point')}</div><div class="lq5-question-strip"><div><b>1</b><span>Which plan is cheaper for a short journey?</span></div><div><b>2</b><span>At what distance do the costs match?</span></div><div><b>3</b><span>What assumption makes each model linear?</span></div></div>`);

  S('Launch','Learning intentions','content','By the end of the lesson',R`<div class="lq5-goals">${[
    'Construct and interpret linear models from rates, points, tables and contexts.',
    'Use parallel, perpendicular and intersection reasoning with contextual restrictions.',
    'Connect standard, factored and vertex forms of a quadratic to roots, intercepts, symmetry and extrema.',
    'Construct quadratic models from roots, a vertex, three points or a context.',
    'Use TI-84 Zero, Minimum, Maximum, Intersect and TABLE with clear evidence and independent checks.',
    'Choose and evaluate a model using differences, residuals, assumptions, domain and extrapolation risk.'
  ].map((value,index)=>`<label><input type="checkbox" data-reflect="lq5-goal-${index+1}"><span>${value}</span></label>`).join('')}</div>`);

  T('Launch','Readiness check','Recall four ideas before beginning.',[
    R`Calculate the gradient through \((2,5)\) and \((8,23)\).`,
    R`Solve \(3x-7=20\).`,
    R`Factor \(x^2-7x+12\).`,
    R`Explain why a negative value of elapsed time may be rejected.`
  ],'lq5-readiness',R`Gradient \(3\); \(x=9\); \((x-3)(x-4)\); elapsed time normally has the contextual restriction \(t\ge0\).`);

  Section('Linear models','Constant rate and initial value','A straight-line model is justified only when the output changes by a constant amount for equal changes in the input.','section-linear');

  concept('Linear models','A linear model has constant rate','Structure','For equal changes in the independent variable, the dependent variable changes by equal amounts.',[
    {label:'SYMBOLIC',math:R`\[y=mx+c\]`,text:'The parameter \(m\) is constant throughout the domain.'},
    {label:'NUMERICAL',title:'Constant first differences',text:'For equally spaced inputs, consecutive output differences are equal.',className:'accent'}
  ],'constant-rate',R`<b>Model decision:</b> a visually straight trend is not enough; the rate and context must also support a linear rule.`);

  S('Linear models','Gradient is a rate with units','content','Change in output divided by change in input',R`<div class="lq5-two">${V('gradient-triangle','Gradient triangle showing change in output and change in input')}<div class="lq5-key"><div class="lq5-math">\[m=\frac{y_2-y_1}{x_2-x_1}\]</div><p>The numerator and denominator carry units. A complete interpretation names both variables.</p><div class="lq5-note"><b>Sentence frame:</b> for each additional input unit, the model predicts a change of \(m\) output units.</div></div></div>`);

  W('Linear models','Gradient from measurements',R`A delivery charge is 42 QAR for 5 km and 78 QAR for 17 km. Find and interpret the gradient.`,[
    R`Use the two measured points: \((5,42)\) and \((17,78)\).`,
    R`\(m=\dfrac{78-42}{17-5}=\dfrac{36}{12}=3\).`,
    R`The units are QAR per kilometre.`
  ],R`\[\boxed{m=3\text{ QAR/km}}\]`,R`Each additional kilometre increases the predicted charge by 3 QAR.`,'delivery-rate');

  T('Linear models','Interpret a decreasing rate',R`A tank contains 68 L after 2 minutes and 48 L after 7 minutes.`,[
    R`Find the gradient.`,
    R`Interpret its sign and units.`,
    R`State the modelling assumption represented by a constant gradient.`
  ],'lq5-negative-rate',R`\(m=(48-68)/(7-2)=-4\text{ L/min}\). The tank loses 4 L each minute. The model assumes a constant outflow rate over the interval.`,'tank-rate');

  S('Linear models','The roles of \(m\) and \(c\)','lab','Change one parameter at a time',R`<div class="lq5-two"><div class="lq5-key"><div class="lq5-math">\[y=mx+c\]</div><ul><li>\(m\): constant rate and direction.</li><li>\(c=f(0)\): initial or fixed value.</li><li>Changing \(m\) rotates the line around its y-intercept.</li><li>Changing \(c\) shifts the line vertically.</li></ul></div><div class="lq5-linear-lab" data-lq5-linear-lab><div class="lq5-lab-controls"><label>Gradient \(m\)<input type="range" min="-5" max="5" step="0.5" value="2" data-linear-m></label><label>Intercept \(c\)<input type="range" min="-8" max="8" step="1" value="3" data-linear-c></label><output data-linear-equation>y=2x+3</output></div><svg viewBox="0 0 620 360" data-linear-svg></svg></div></div>`);

  W('Linear models','Build a model from context',R`A gym charges a 150 QAR joining fee and 45 QAR per month. Write a model and find the cost after 8 months.`,[
    R`Let \(n\) be the number of months.`,
    R`The monthly rate gives gradient \(45\).`,
    R`The joining fee gives intercept \(150\).`,
    R`\(C(n)=45n+150\), so \(C(8)=510\).`
  ],R`\[\boxed{C(n)=45n+150,\qquad C(8)=510\text{ QAR}}\]`,R`A reasonable domain is \(n\in\{0,1,2,\ldots\}\) while the pricing policy remains unchanged.`);

  T('Linear models','Construct and interpret a pricing model',R`A service charges 12 QAR per bottle plus a fixed 25 QAR delivery fee.`,[
    R`Write a cost model \(C(b)\).`,
    R`Interpret both parameters with units.`,
    R`State a realistic domain if at most 80 bottles can be delivered.`
  ],'lq5-context-line',R`\(C(b)=12b+25\). The rate is 12 QAR per bottle and the fixed fee is 25 QAR. A realistic domain is \(b\in\{0,1,\ldots,80\}\).`);

  S('Linear models','A line through two points','content','Rate first, then intercept',R`<div class="lq5-process"><div><b>1</b><span>Calculate \(m\).</span></div><div><b>2</b><span>Use \(y-y_1=m(x-x_1)\).</span></div><div><b>3</b><span>Simplify to a requested form.</span></div><div><b>4</b><span>Check both original points.</span></div></div><div class="lq5-worked-inline"><p>Through \((4,19)\) and \((10,43)\):</p><div class="lq5-math">\[m=\frac{43-19}{10-4}=4,\qquad y-19=4(x-4)\]</div><div class="lq5-math">\[\boxed{y=4x+3}\]</div></div>`);

  S('Linear models','Constant first differences identify a line','content','Equal input spacing',R`<div class="lq5-two"><table class="lq5-table"><thead><tr><th>\(x\)</th><th>0</th><th>1</th><th>2</th><th>3</th><th>4</th></tr></thead><tbody><tr><th>\(y\)</th><td>7</td><td>11</td><td>15</td><td>19</td><td>23</td></tr><tr><th>\(\Delta y\)</th><td></td><td>4</td><td>4</td><td>4</td><td>4</td></tr></tbody></table><div class="lq5-key"><p>Because the input step is 1 and the first difference is 4, the gradient is 4.</p><div class="lq5-math">\[\boxed{y=4x+7}\]</div></div></div>`);

  S('Linear models','Do not swap rate and initial value','content','Misconception repair',R`<div class="lq5-clinic"><div>!</div><section><span>COMMON ERROR</span><h2>“The gradient is where the line crosses the y-axis.”</h2><p><b>Repair:</b> the y-intercept is \(c=f(0)\). The gradient is a ratio of changes and requires two points, a rate statement or equivalent information.</p></section></div>`);

  Q('Linear-model checkpoint',[
    R`Find the line through \((-2,9)\) and \((4,-3)\).`,
    R`Interpret the gradient in a cost-versus-distance model.`,
    R`Explain how constant first differences support a linear model.`,
    R`State a realistic domain for a model whose input counts students in a room of capacity 28.`
  ],'lq5-linear-check',R`The gradient is \(-2\), giving \(y=-2x+5\). A gradient is the change in cost per unit distance. Constant first differences show constant rate for equal input spacing. The student-count domain is \(\{0,1,\ldots,28\}\).`);

  Section('Line relationships','Parallel, perpendicular and intersecting models','Gradients describe direction, while intersections represent simultaneous conditions or decision thresholds.','section-lines');

  S('Line relationships','Useful forms of a straight line','content','Choose the form that matches the information',R`${cards([
    {label:'GRADIENT–INTERCEPT',math:R`\[y=mx+c\]`,text:'Shows rate and y-intercept.'},
    {label:'POINT–GRADIENT',math:R`\[y-y_1=m(x-x_1)\]`,text:'Efficient when a point and gradient are known.',className:'accent'},
    {label:'GENERAL FORM',math:R`\[Ax+By+C=0\]`,text:'Useful for rearranging and comparing lines.'}
  ])}<div class="lq5-note">A vertical line has equation \(x=k\) and cannot be written with a finite gradient.</div>`);

  concept('Line relationships','Parallel and perpendicular gradients','Direction','Compare gradients after writing both lines in a clear form.',[
    {label:'PARALLEL',math:R`\[m_1=m_2\]`,text:'Different intercepts give distinct parallel lines.'},
    {label:'PERPENDICULAR',math:R`\[m_1m_2=-1\]`,text:'For non-vertical lines, gradients are negative reciprocals.',className:'accent'}
  ],'parallel-perpendicular',R`A horizontal line and a vertical line form a special perpendicular pair.`);

  W('Line relationships','Perpendicular line through a point',R`Find the line perpendicular to \(y=\frac12x+7\) and passing through \((4,-1)\).`,[
    R`The given gradient is \(\frac12\).`,
    R`The perpendicular gradient is \(-2\).`,
    R`Use \(y+1=-2(x-4)\).`,
    R`Simplify and verify that \((1/2)(-2)=-1\).`
  ],R`\[\boxed{y=-2x+7}\]`,'','perpendicular-example');

  T('Line relationships','Construct a parallel line',R`Find the line parallel to \(3x-2y=8\) and passing through \((-2,5)\).`,[
    R`Find the gradient of the given line.`,
    R`Use the point–gradient equation.`,
    R`Verify the point and the parallel condition.`
  ],'lq5-parallel-line',R`\(3x-2y=8\Rightarrow y=\frac32x-4\). The required line is \(y-5=\frac32(x+2)\), so \(\boxed{y=\frac32x+8}\).`);

  S('Line relationships','An intersection satisfies both models','content','Equality of outputs',R`<div class="lq5-two">${V('intersection-lines','Two lines meeting at one accurately plotted point')}<div class="lq5-key"><div class="lq5-math">\[f(x)=g(x)\]</div><p>Solve for the common input, then substitute to obtain the common output.</p><div class="lq5-note">Report a coordinate pair and interpret both coordinates.</div></div></div>`);

  W('Line relationships','Break-even between two plans',R`Plan P costs \(35+1.8x\) QAR and Plan Q costs \(11+2.6x\) QAR. Find and interpret the break-even point.`,[
    R`Set the costs equal: \(35+1.8x=11+2.6x\).`,
    R`Solve \(24=0.8x\), so \(x=30\).`,
    R`The common cost is \(35+1.8(30)=89\) QAR.`,
    R`Before 30 units, Q is cheaper; after 30 units, P is cheaper.`
  ],R`\[\boxed{(30,89)}\]`,R`The plans cost the same at 30 units, when each costs 89 QAR.`,'break-even');

  S('Line relationships','One, none or infinitely many common points','content','Compare gradients and intercepts',R`<div class="lq5-system-cases">${V('line-system-cases','Three exact line-system classifications')}</div><div class="lq5-card-grid"><article><span>ONE SOLUTION</span><p>Different gradients.</p></article><article><span>NO SOLUTION</span><p>Same gradient, different intercepts.</p></article><article><span>INFINITELY MANY</span><p>The same line written in equivalent forms.</p></article></div>`);

  S('Line relationships','Mathematical and contextual solutions are different decisions','content','Apply the domain after solving',R`<div class="lq5-compare"><article><span>MATHEMATICAL</span><h2>Intersection at \(x=-12\)</h2><p>The equations are satisfied.</p></article><article><span>CONTEXTUAL</span><h2>Reject when \(x\ge0\)</h2><p>If \(x\) counts items or time, the intersection is outside the modelled domain.</p></article></div>`);

  S('Line relationships','Whole-number and capacity restrictions','content','Continuous crossing, discrete report',R`<div class="lq5-process"><div><b>1</b><span>Solve continuously.</span></div><div><b>2</b><span>Apply lower and upper bounds.</span></div><div><b>3</b><span>If the input is a count, test adjacent integers.</span></div><div><b>4</b><span>State the first or best admissible value.</span></div></div>`);

  S('Line relationships','Manual first; technology when it adds value','content','Choose deliberately',R`${cards([
    {label:'MANUAL',title:'Exact linear algebra',text:'Use substitution or elimination for simple line intersections.'},
    {label:'TI-84 INTERSECT',title:'Graphical verification',text:'Use when comparing a line with a nonlinear model or when decimal coordinates are expected.',className:'accent'},
    {label:'ALWAYS',title:'Verify and interpret',text:'Check both equations, then apply units and restrictions.'}
  ])}`);

  S('Line relationships','An x-value alone is not an intersection point','content','Misconception repair',R`<div class="lq5-clinic"><div>!</div><section><h2>“The intersection is \(x=7\).”</h2><p><b>Repair:</b> substitute to find the common output and report \((7,y)\). In context, explain what both coordinates mean.</p></section></div>`);

  Q('Line-relationship checkpoint',[
    R`Find the perpendicular gradient to \(-\frac35\).`,
    R`Solve \(y=2x+9\) and \(y=25-x\).`,
    R`Classify two lines with equal gradients and unequal intercepts.`,
    R`Explain why a negative break-even input may be rejected.`
  ],'lq5-lines-check',R`The perpendicular gradient is \(5/3\). The intersection is \((16/3,59/3)\). Equal gradients with unequal intercepts give no solution. A negative break-even input is invalid when the context requires a non-negative input.`);
})();
