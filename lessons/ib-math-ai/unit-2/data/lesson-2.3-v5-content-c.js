(function(){
  'use strict';
  const b=window.__ECHS_PR5_BUILD;if(!b)throw new Error('Lesson 2.3 v5 builder missing.');
  const {R,S,V,cards,concept,W,T,Q,Section,TI}=b;

  Section('2.3E','Direct, Inverse and Power Variation','Recognise a power relationship from scaling, tables, graphs and regression. Interpret the exponent as a multiplicative rate, and restrict the model to physically meaningful inputs.','variation-overview');

  concept('2.3E','Direct power variation','One percentage scale controls another',
    R`A power model has the form \(y=kx^n\), where \(k\ne0\).`,[
      {label:'DIRECT',math:R`\[n=1:\ y=kx\]`,text:'Doubling x doubles y.'},
      {label:'SQUARE',math:R`\[n=2:\ y=kx^2\]`,text:'Doubling x multiplies y by 4.'},
      {label:'CUBE',math:R`\[n=3:\ y=kx^3\]`,text:'Doubling x multiplies y by 8.'},
      {label:'GENERAL',math:R`\[x\mapsto cx\Rightarrow y\mapsto c^ny\]`,text:'The exponent controls scaling.'}
    ],'direct-power');

  concept('2.3E','Inverse variation','A negative exponent produces reciprocal decay',
    R`Inverse power variation can be written \(y=kx^{-n}=\dfrac{k}{x^n}\), usually with \(x>0\) in context.`,[
      {label:'INVERSE',math:R`\[y=\frac{k}{x}\]`,text:'Doubling x halves y.'},
      {label:'INVERSE SQUARE',math:R`\[y=\frac{k}{x^2}\]`,text:'Doubling x quarters y.'},
      {label:'INVARIANT',math:R`\[yx^n=k\]`,text:'The product is constant for exact variation.'}
    ],'inverse-variation');

  S('2.3E','Power laws become lines on logarithmic axes','content','Linearise to interpret the exponent',`<div class="pr5-two"><article class="pr5-panel"><div class="pr5-math">\[y=kx^n\]</div><p>Take logarithms of both sides.</p></article><article class="pr5-panel"><div class="pr5-math">\[\log y=\log k+n\log x\]</div><p>On a log–log plot, gradient \(n\) and intercept \(\log k\) identify the power model.</p></article></div>${V('log-log-line','Power data as a straight line on logarithmic axes')}`);

  W('2.3E','Identify inverse-square variation from a table',
    R`For \(x=2,4,8,16\), a response is \(48,12,3,0.75\). Determine a model.`,[
      'Each time x doubles, y is divided by 4.',
      R`Therefore \(y\propto x^{-2}\), so \(y=k/x^2\).`,
      R`Use \((2,48)\): \(48=k/4\), hence \(k=192\).`,
      R`Check \(x=16\): \(192/16^2=0.75\).`
    ],R`\[\boxed{y=\frac{192}{x^2}}\]`,'The repeated scale factor identifies the exponent before any regression is used.','variation-table');

  W('2.3E','Build a cubic power model from geometry',
    R`The mass \(M\) of similar metal bearings varies directly as the cube of radius \(r\). A bearing of radius 10 mm has mass 32.6 g. Find a model and estimate the mass at 14 mm.`,[
      R`Write \(M=kr^3\).`,
      R`Use \(32.6=k(10)^3\), giving \(k=0.0326\).`,
      R`At \(r=14\): \(M=0.0326(14)^3=89.4544\).`
    ],R`\[\boxed{M=0.0326r^3;\qquad M(14)\approx89.5\text{ g}}\]`,'The exponent 3 is physically justified by volume scaling; it is not merely a fitted number.','bearing-power');

  T('2.3E','Apply inverse-square variation',
    R`Light intensity satisfies \(I=k/d^2\). At distance \(d=3\) m, \(I=80\) units.`,[
      'Find k with units.',
      R`Find the intensity at \(d=5\) m.`,
      'Explain the effect of doubling the distance.',
      'State a reasonable domain.'
    ],'pr5-inverse-square',R`\(k=80(3)^2=720\) intensity·m². \(I(5)=720/25=28.8\). Doubling distance divides intensity by 4. A physical domain is \(d>0\), further restricted to distances for which the point-source model is valid.`,'inverse-square-student');

  S('2.3E','Measured power data need regression','content','The exponent may be estimated',`<div class="pr5-two"><article class="pr5-panel"><table class="pr5-small-table"><tr><th>radius r (mm)</th><td>4</td><td>6</td><td>8</td><td>10</td><td>12</td><td>16</td></tr><tr><th>mass M (g)</th><td>2.10</td><td>7.00</td><td>16.8</td><td>32.1</td><td>56.9</td><td>134.0</td></tr></table><p>Measurement and rounding create small deviations from an exact law.</p></article>${V('power-data-fit','Bearing mass data with a power regression curve')}</div>`);

  TI('Fit a power model from lists','pwrreg','Enter positive x-values in L1 and positive y-values in L2, run PwrReg, store the model, inspect the scatter plot and interpret both a and b in y=ax^b.');

  W('2.3E','Interpret a power regression',
    R`For the bearing data, PwrReg gives \(M\approx0.0326303r^{2.99997}\) with \(R^2\approx0.99996\) on the transformed data.`,[
      R`The exponent is essentially \(3\), consistent with similar solids whose mass is proportional to volume.`,
      R`The scale factor is approximately \(0.0326\text{ g/mm}^3\).`,
      R`A scientifically defensible simplified model is \(M=0.0326r^3\), provided the material and shape remain similar.`
    ],R`\[\boxed{M\approx0.0326r^3}\]`,'Use the fitted exponent and the mechanism together; do not round the exponent to 3 without explaining why.','power-regression');

  concept('2.3E','Units depend on the exponent','Dimensional meaning audits a model',
    R`In \(y=kx^n\), the units of \(k\) are \([y]/[x]^n\).`,[
      {math:R`\[M=0.0326r^3\]`,text:'If M is grams and r is millimetres, k has units g/mm³.'},
      {math:R`\[I=720d^{-2}\]`,text:'If I is intensity units and d is metres, k has units intensity·m².'},
      {label:'AUDIT',text:'A unit mismatch can reveal a transcription or exponent error.'}
    ],'parameter-units');

  concept('2.3E','Power models need a valid domain','Zero and negative inputs may be impossible',
    'A regression formula may accept inputs that the context does not.',[
      {label:'POSITIVE DATA',text:'PwrReg requires positive list values because logarithms are used internally.'},
      {label:'PHYSICAL INPUT',text:'Radius, distance, area and mass are commonly positive.'},
      {label:'EXTRAPOLATION',text:'A power law may fail when material, geometry or operating regime changes.'},
      {label:'NEAR ZERO',text:'Inverse models grow without bound, often signalling the limit of the model rather than a physical infinity.'}
    ],'power-domain');

  Q('Checkpoint E · Variation',[
    R`A response is multiplied by 8 when the input doubles. State the power exponent.`,
    R`If \(y=45/x\), find the invariant product and the value when \(x=9\).`,
    'Explain what the gradient of a log–log graph represents.',
    'State why PwrReg should not be used when list values include zero or negative values.'
  ],'pr5-check-e',R`Exponent 3. The invariant is \(xy=45\); when \(x=9\), \(y=5\). The log–log gradient is the power exponent. PwrReg linearises with logarithms, which are not real for non-positive data, and the intended power domain is normally positive.`);

  Section('2.3F','TI-84 Evidence, Validation and IB Synthesis','Choose technology because it reveals a feature or estimates a model, not because it removes the need to reason. Record the entry, settings, output, check and contextual conclusion.','ti84-synthesis');

  S('2.3F','Choose a method intentionally','content','Structure first, technology second',`<div class="pr5-method-board"><article><b>FACTORS / SIGN CHART</b><span>Exact zeros, multiplicity and inequalities.</span></article><article><b>ZERO</b><span>Decimal roots visible in a suitable window.</span></article><article><b>CUBICREG</b><span>Fit measured rise–fall–rise data.</span></article><article><b>PWRREG</b><span>Fit positive multiplicative data.</span></article><article><b>INTERSECT</b><span>Compare two models; repeat near every crossing.</span></article><article><b>TABLE</b><span>Audit thresholds and behaviour near excluded inputs.</span></article></div>`);

  TI('Find a polynomial zero','zero','Enter the function in Y1, choose a window that shows the relevant crossing, then use CALC → Zero with Left Bound, Right Bound and Guess. Audit even-multiplicity roots separately.');
  TI('Fit and store a cubic regression','cubicreg','Use STAT EDIT for L1 and L2, STAT CALC → CubicReg, and store the equation in Y1 so the scatter plot, curve and residual evidence can be inspected together.');
  TI('Fit a power regression','pwrreg','Use only positive paired data, run PwrReg, interpret a and b, and compare the fitted exponent with the physical mechanism.');
  TI('Find polynomial or rational intersections','intersect','Graph both models, ensure every relevant branch and crossing is visible, then run CALC → Intersect near each crossing and apply the contextual domain.');
  TI('Use TABLE near a threshold or asymptote','table','Set TblStart and ΔTbl deliberately. Compare adjacent admissible inputs, or approach a forbidden input from each side without treating an undefined entry as a value.');

  concept('2.3F','Five pieces of transparent technology evidence','A calculator output is not a complete solution',
    '',[
      {label:'1',title:'Problem / model',text:'State what is being solved or fitted.'},
      {label:'2',title:'Entry / lists',text:'Record functions, variables and data.'},
      {label:'3',title:'Window / settings',text:'State a relevant domain, scale or table step.'},
      {label:'4',title:'Output + check',text:'Report all relevant values and verify independently.'},
      {label:'5',title:'Interpretation',text:'Use units, restrictions and appropriate precision.'}
    ],'technology-evidence');

  S('2.3F','Residual laboratory','lab','Compare a line, quadratic and cubic',`<div class="pr5-lab" data-pr5-residual-lab><div class="pr5-model-buttons"><button type="button" data-residual-model="linear">Linear</button><button type="button" data-residual-model="quadratic">Quadratic</button><button type="button" data-residual-model="cubic" class="active">Cubic</button></div><div class="pr5-residual-grid"><svg viewBox="0 0 760 340" data-residual-fit aria-label="Data and selected regression model"></svg><svg viewBox="0 0 760 250" data-residual-plot aria-label="Residual plot for selected model"></svg></div><div class="pr5-lab-verdict" data-residual-verdict></div></div>`);

  W('2.3F','Combine rational structure, technology and context',
    R`For \(f(x)=\dfrac8{x-2}+3\) and \(g(x)=0.5x+2\), find all intersections and then retain only those satisfying \(x>2\).`,[
      R`Algebra gives \((x-2)^2=16\), so \(x=-2\) or \(x=6\).`,
      R`The corresponding points are \((-2,1)\) and \((6,5)\).`,
      R`TI-84 Intersect can verify both points, but the asymptote \(x=2\) means both branches must be shown separately.`,
      R`The contextual domain \(x>2\) rejects \((-2,1)\).`
    ],R`\[\boxed{\text{valid intersection }(6,5)}\]`,'State the mathematical solutions before applying the contextual restriction.','rational-context-intersection');

  T('2.3F','Choose, fit and defend a model',
    'A response is measured at x=1,2,3,4,5,6 and gives y=31.0,18.2,12.7,9.9,8.2,7.1.',[
      'Decide whether a polynomial, pure inverse-power or shifted rational model is most plausible.',
      'Use an appropriate TI-84 regression or transformed model and record coefficients.',
      'Inspect residuals and graph shape.',
      'State a reasonable domain and one limitation.',
      'Write a one-sentence IB conclusion.'
    ],'pr5-final-model',R`The decreasing response that levels above zero suggests a shifted rational model more strongly than a polynomial or pure inverse power. Fit/estimate the asymptote and scale, inspect residuals, use only the measured or justified positive domain, and avoid claiming the horizontal level is physically exact without evidence.`,'final-model-choice');

  S('2.3F','IB mini-synthesis','student','Connect multiple representations',`<div class="pr5-ib-mini"><h2>A production response is modelled by \(P(t)=0.5(t+2)(t-3)^2(t-8)\) for \(0\le t\le10\).</h2><ol><li>State the degree, zeros and multiplicities.</li><li>Describe the end behaviour of the unrestricted polynomial.</li><li>Explain the graph behaviour at \(t=3\).</li><li>Use technology to locate any local extrema in the contextual domain.</li><li>Solve \(P(t)\ge0\) on \([0,10]\).</li><li>Evaluate one limitation of using the model beyond \(t=10\).</li></ol><textarea class="student-note tall" data-note="pr5-ib-mini"></textarea><details><summary>Solution framework</summary><div class="solution-panel">Degree 4; zeros −2 (mult.1), 3 (mult.2), 8 (mult.1). Unrestricted ends up/up. At 3 the graph touches the axis and does not change sign. On [0,10], signs are negative on [0,3), zero at 3, negative on (3,8), and non-negative on [8,10], so \(P(t)\ge0\) at \(t=3\) and for \(8\le t\le10\). Report extrema from the calculator with coordinates and an algebraic/table check. Extrapolation beyond 10 is unsupported and the quartic tail may become unrealistic.</div></details></div>`);

  S('2.3F','Mastery evidence checklist','content','Prove understanding from more than one source',`<div class="pr5-mastery-grid"><label><input type="checkbox" data-reflect="pr5-m1"><span>I can use degree and leading coefficient to audit end behaviour and turning points.</span></label><label><input type="checkbox" data-reflect="pr5-m2"><span>I can connect factors, multiplicity, intercept behaviour and signs.</span></label><label><input type="checkbox" data-reflect="pr5-m3"><span>I can fit and evaluate polynomial models using residual evidence.</span></label><label><input type="checkbox" data-reflect="pr5-m4"><span>I can distinguish holes, vertical asymptotes and horizontal end behaviour.</span></label><label><input type="checkbox" data-reflect="pr5-m5"><span>I can interpret direct, inverse and power variation with units.</span></label><label><input type="checkbox" data-reflect="pr5-m6"><span>I can use TI-84 workflows transparently and verify every output.</span></label></div>`);

  Q('Exit ticket · Polynomial and rational models',[
    R`For \(-2(x+1)^2(x-4)\), state degree, end behaviour and intercept behaviour.`,
    R`State the asymptotes and domain of \(\dfrac6{x-5}-2\).`,
    R`A power model is \(y=3.2x^{1.5}\). State the factor by which y changes when x is multiplied by 4.`,
    'Give the TI-84 route for CubicReg and one residual check.',
    'Explain why model validity is not guaranteed by a large \(R^2\).'
  ],'pr5-exit',R`Degree 3, positive left end and negative right end; touch at −1, cross at 4. Domain \(x\ne5\), asymptotes \(x=5\), \(y=-2\). Multiplying x by 4 multiplies y by \(4^{1.5}=8\). Use STAT EDIT → lists, STAT CALC → CubicReg, then inspect residuals (observed−predicted) for size and pattern. \(R^2\) measures in-sample association/fit, not mechanism, domain, stability or extrapolation validity.`);
})();
