(function(){
  'use strict';
  const {R,S,V,concept,W,T,Q,Section}=window.__ECHS_LQ5_BUILD;

  Section('Quadratic structure','One parabola, several useful forms','Equivalent forms describe the same curve. Choose the form that reveals the feature needed in the question.','section-quadratic');

  S('Quadratic structure','Standard, factored and vertex forms','content','The same parabola, drawn once',R`<div class="lq5-two">${V('same-parabola-forms','The exact parabola y=x squared minus 6x plus 5 with roots 1 and 5 and vertex 3 negative 4')}<div class="lq5-key"><div class="lq5-form-list"><article><span>STANDARD</span><div class="lq5-math">\[x^2-6x+5\]</div><p>Shows \(a,b,c\).</p></article><article><span>FACTORED</span><div class="lq5-math">\[(x-1)(x-5)\]</div><p>Shows roots \(1,5\).</p></article><article><span>VERTEX</span><div class="lq5-math">\[(x-3)^2-4\]</div><p>Shows vertex \((3,-4)\).</p></article></div></div></div><div class="lq5-note"><b>Precision rule:</b> these three equations must produce exactly the same graph. A different opening direction, root position or vertex means the visual is wrong.</div>`);

  concept('Quadratic structure','Standard form reveals coefficients and y-intercept','\(ax^2+bx+c\)','A non-zero quadratic coefficient creates curvature.',[
    {label:'Y-INTERCEPT',math:R`\[q(0)=c\]`,text:'The graph crosses the y-axis at \((0,c)\).'},
    {label:'OPENING',math:R`\[a>0\Rightarrow\text{up},\qquad a<0\Rightarrow\text{down}\]`,text:'The sign of \(a\) determines maximum or minimum.',className:'accent'},
    {label:'AXIS',math:R`\[x=-\frac{b}{2a}\]`,text:'Substitute this input to obtain the vertex.'}
  ],'standard-features');

  concept('Quadratic structure','Factored form reveals roots and symmetry','\(a(x-r_1)(x-r_2)\)','A root is an input where the output is zero.',[
    {label:'ROOTS',math:R`\[x=r_1,\qquad x=r_2\]`,text:'The x-intercepts are \((r_1,0)\) and \((r_2,0)\).'},
    {label:'AXIS',math:R`\[x=\frac{r_1+r_2}{2}\]`,text:'The axis lies halfway between distinct real roots.',className:'accent'},
    {label:'SCALE FACTOR',math:R`\[a\ne0\]`,text:'Roots alone do not determine the vertical scale.'}
  ],'factored-features');

  concept('Quadratic structure','Vertex form reveals the extremum','\(a(x-h)^2+k\)','The vertex is visible without further calculation.',[
    {label:'VERTEX',math:R`\[(h,k)\]`,text:'The graph turns at this point.'},
    {label:'AXIS',math:R`\[x=h\]`,text:'Every pair of symmetric points is equally far from this line.',className:'accent'},
    {label:'EXTREMUM',math:R`\[a>0:\min=k,\qquad a<0:\max=k\]`,text:'Interpret the extremum within the contextual domain.'}
  ],'vertex-features');

  W('Quadratic structure','Read all key features',R`For \(q(x)=-2x^2+12x+14\), determine the intercepts, axis of symmetry and maximum point.`,[
    R`Factor: \(q(x)=-2(x-7)(x+1)\), so the roots are \(-1\) and \(7\).`,
    R`The y-intercept is \(q(0)=14\).`,
    R`The axis is the midpoint of the roots: \(x=3\).`,
    R`\(q(3)=32\). Since \(a=-2<0\), the vertex is a maximum.`
  ],R`\[\boxed{\text{roots }-1,7;\quad y\text{-intercept }14;\quad \text{maximum }(3,32)}\]`,'','quadratic-features');

  T('Quadratic structure','Read features from factorised form',R`For \(p(x)=x^2-8x+12=(x-2)(x-6)\):`,[
    R`State the roots.`,
    R`Determine the axis of symmetry.`,
    R`Find the vertex and classify it.`,
    R`State the y-intercept.`
  ],'lq5-feature-turn',R`Roots \(2,6\); axis \(x=4\); \(p(4)=-4\), so the vertex is \((4,-4)\), a minimum; y-intercept \(12\).`,'feature-reading');

  S('Quadratic structure','Move the vertex and curvature','lab','Predict first, then test',R`<div class="lq5-quadratic-lab" data-lq5-quadratic-lab><div class="lq5-lab-controls"><label>Scale \(a\)<input data-quadratic-a type="range" min="-3" max="3" step="0.5" value="1"></label><label>Horizontal shift \(h\)<input data-quadratic-h type="range" min="-5" max="5" step="1" value="2"></label><label>Vertical shift \(k\)<input data-quadratic-k type="range" min="-6" max="6" step="1" value="-3"></label><output data-quadratic-equation></output></div><svg viewBox="0 0 620 360" data-quadratic-svg></svg></div><div class="lq5-question-strip"><div><b>Predict</b><span>What changes when only \(a\) changes?</span></div><div><b>Predict</b><span>Which parameter moves the axis?</span></div><div><b>Predict</b><span>Which parameter changes the extremum output?</span></div></div>`);

  S('Quadratic structure','The discriminant classifies real roots','content','Root structure before solving',R`<div class="lq5-two">${V('discriminant-cases','Three parabolas showing two roots one repeated root and no real roots')}<div class="lq5-card-grid"><article><span>\(b^2-4ac>0\)</span><p>Two distinct real roots.</p></article><article><span>\(b^2-4ac=0\)</span><p>One repeated real root.</p></article><article><span>\(b^2-4ac<0\)</span><p>No real roots.</p></article></div></div>`);

  S('Quadratic structure','A repeated root touches and turns','content','Multiplicity two',R`<div class="lq5-two">${V('repeated-root','An upward parabola y equals x minus 2 squared touching the x-axis at x equals 2')}<div class="lq5-key"><div class="lq5-math">\[q(x)=a(x-r)^2\]</div><p>The vertex is \((r,0)\). The curve touches the x-axis and reverses direction; it does not cross.</p><div class="lq5-note">For a quadratic, a repeated real root is equivalent to a zero discriminant.</div></div></div>`);

  S('Quadratic structure','Restricted domain changes the range','content','Use the vertex and endpoints',R`<div class="lq5-compare"><article><span>UNRESTRICTED</span><div class="lq5-math">\[q(x)=2(x-3)^2-4\]</div><p>Range: \(y\ge-4\).</p></article><article><span>ON \(0\le x\le5\)</span><p>Minimum remains \(-4\). Compare endpoints: \(q(0)=14\), \(q(5)=4\).</p><div class="lq5-math">\[\boxed{-4\le y\le14}\]</div></article></div>`);

  S('Quadratic structure','Complete the square to reveal the vertex','content','Convert standard to vertex form',R`<div class="lq5-worked-inline"><div class="lq5-math">\[x^2-6x+5=x^2-6x+9-9+5\]</div><div class="lq5-math">\[\boxed{x^2-6x+5=(x-3)^2-4}\]</div><p>The added and subtracted square preserves equality and reveals vertex \((3,-4)\).</p></div>`);

  S('Quadratic structure','The constant term is not the extremum','content','Misconception repair',R`<div class="lq5-clinic"><div>!</div><section><h2>“In \(ax^2+bx+c\), the value \(c\) is the minimum.”</h2><p><b>Repair:</b> \(c=q(0)\) is the y-intercept. The extremum occurs at the vertex, whose input is \(-b/(2a)\).</p></section></div>`);

  Q('Quadratic-structure checkpoint',[
    R`For \(y=3(x-2)(x+4)\), state the roots and axis.`,
    R`For \(y=-2(x+1)^2+9\), state the vertex and maximum.`,
    R`Find the y-intercept of \(2x^2-5x+7\).`,
    R`Explain why two roots do not determine a unique quadratic.`
  ],'lq5-quadratic-check',R`Roots \(2,-4\), axis \(x=-1\). Vertex \((-1,9)\), maximum 9. The y-intercept is 7. Two roots determine \(a(x-r_1)(x-r_2)\), but the non-zero scale factor \(a\) still needs another condition.`);

  Section('Constructing quadratics','Build the equation from the information given','Roots, a vertex, three points or a physical context each suggest an efficient starting form.','section-construct');

  W('Constructing quadratics','Construct from roots and a point',R`An arch meets the ground at \(x=0\) and \(x=12\), and reaches height 9 at \(x=6\). Find a model.`,[
    R`The roots give \(h(x)=a x(x-12)\).`,
    R`Use the point \((6,9)\): \(9=a(6)(-6)=-36a\).`,
    R`Therefore \(a=-\frac14\).`,
    R`The physical arch is modelled only between the ground contacts.`
  ],R`\[\boxed{h(x)=-\frac14x(x-12),\qquad 0\le x\le12}\]`,'','arch-model');

  T('Constructing quadratics','Use two roots and a point',R`A quadratic has roots \(-2\) and \(5\) and passes through \((0,-20)\).`,[
    R`Write a factored model with scale factor \(a\).`,
    R`Use the given point to determine \(a\).`,
    R`Expand the model and verify all three conditions.`
  ],'lq5-roots-point',R`\(q(x)=a(x+2)(x-5)\). Since \(-20=-10a\), \(a=2\). Thus \(q(x)=2(x+2)(x-5)=2x^2-6x-20\).`);

  W('Constructing quadratics','Construct from a vertex and a point',R`A parabola has vertex \((4,-3)\) and passes through \((6,5)\). Find its equation.`,[
    R`Use vertex form: \(y=a(x-4)^2-3\).`,
    R`Substitute \((6,5)\): \(5=4a-3\).`,
    R`Solve \(a=2\).`,
    R`Check the vertex and the given point.`
  ],R`\[\boxed{y=2(x-4)^2-3}\]`);

  S('Constructing quadratics','Three points determine three coefficients','content','Solve a system or use QuadReg as a check',R`<div class="lq5-two"><div class="lq5-key"><p>For \((0,4),(2,10),(5,49)\), let</p><div class="lq5-math">\[q(x)=ax^2+bx+c\]</div><div class="lq5-math">\[c=4,\quad4a+2b+c=10,\quad25a+5b+c=49\]</div><p>Solving gives \(a=2,b=-1,c=4\).</p></div>${V('three-point-fit','A quadratic through the three exact points zero four two ten and five forty-nine')}</div><div class="lq5-result">\[\boxed{q(x)=2x^2-x+4}\]</div>`);

  S('Constructing quadratics','Projectile height is quadratic in time','content','Interpret every feature in context',R`<div class="lq5-two">${V('projectile-model','Projectile height curve with launch height maximum and landing time')}<div class="lq5-key"><div class="lq5-math">\[h(t)=-4.9t^2+18t+1.5\]</div><ul><li>\(h(0)=1.5\): launch height.</li><li>The vertex gives maximum height and time.</li><li>The positive zero gives landing time.</li><li>The negative zero is mathematically valid but outside \(t\ge0\).</li></ul></div></div>`);

  S('Constructing quadratics','An arch model uses only its physical interval','content','Do not extend a context indefinitely',R`<div class="lq5-two">${V('arch-domain','Parabolic arch with ground contacts and vertex')}<div class="lq5-key"><p>The equation may be defined for every real \(x\), but the structure exists only between its supports.</p><div class="lq5-math">\[0\le x\le12\]</div><p>Outside this domain, the same parabola no longer represents the arch.</p></div></div>`);

  W('Constructing quadratics','Revenue model from demand',R`Demand is \(n=800-20p\), where \(p\) is the ticket price in QAR. Construct a revenue model and find its maximum.`,[
    R`Revenue equals price times number sold: \(R(p)=p(800-20p)\).`,
    R`So \(R(p)=-20p^2+800p\).`,
    R`The contextual domain is \(0\le p\le40\).`,
    R`The vertex occurs at \(p=20\), and \(R(20)=8000\).`
  ],R`\[\boxed{\text{Maximum revenue }8000\text{ QAR at }p=20\text{ QAR}}\]`,'','revenue-model');

  W('Constructing quadratics','Optimise an enclosure area',R`A rectangular enclosure uses 100 m of fencing for three sides beside a river. Find the maximum area.`,[
    R`Let each perpendicular side be \(x\) metres. The third fenced side is \(100-2x\).`,
    R`\(A(x)=x(100-2x)=-2x^2+100x\).`,
    R`The vertex input is \(x=25\).`,
    R`The third side is 50 m and the area is \(25\times50=1250\text{ m}^2\).`
  ],R`\[\boxed{A_{\max}=1250\text{ m}^2}\]`,'','area-model');

  W('Constructing quadratics','Line–quadratic intersections exactly',R`Find the intersections of \(y=2x+7\) and \(y=-x^2+10x+3\).`,[
    R`Set the outputs equal: \(2x+7=-x^2+10x+3\).`,
    R`Rearrange: \(x^2-8x+4=0\).`,
    R`Use the quadratic formula: \(x=4\pm2\sqrt3\).`,
    R`Substitute into \(y=2x+7\).`
  ],R`\[\boxed{(4-2\sqrt3,\,15-4\sqrt3),\quad(4+2\sqrt3,\,15+4\sqrt3)}\]`,'','line-quadratic-intersections');

  S('Constructing quadratics','Context decides which solutions survive','content','Mathematical validity is not enough',R`<div class="lq5-filter"><div><b>ALL ROOTS</b><span>solve the equation accurately</span></div><i>→</i><div><b>DOMAIN FILTER</b><span>time, length, price, count, capacity</span></div><i>→</i><div><b>REPORTED ANSWER</b><span>units, precision and meaning</span></div></div>`);

  S('Constructing quadratics','State assumptions that justify the model','content','A model is a controlled simplification',R`${cards([
    {label:'PROJECTILE',title:'Constant gravitational field',text:'Air resistance and wind are ignored.'},
    {label:'REVENUE',title:'Demand rule remains valid',text:'Every unit demanded can be supplied and price is the only changing factor.',className:'accent'},
    {label:'ARCH',title:'Cross-section is parabolic',text:'The chosen coordinates accurately represent the structure.'}
  ])}`);

  Q('Quadratic-construction checkpoint',[
    R`Construct a quadratic with roots \(1,7\) and value \(q(0)=14\).`,
    R`Construct a quadratic with vertex \((2,-5)\) passing through \((4,3)\).`,
    R`State the three equations generated by points \((0,2),(1,5),(3,23)\) for \(ax^2+bx+c\).`,
    R`Explain why the contextual domain must accompany an arch or projectile model.`
  ],'lq5-construct-check',R`\(q(x)=2(x-1)(x-7)\). The vertex model is \(q(x)=2(x-2)^2-5\). The system is \(c=2\), \(a+b+c=5\), \(9a+3b+c=23\). The equation continues mathematically outside the physical interval, but the context does not.`);
})();
