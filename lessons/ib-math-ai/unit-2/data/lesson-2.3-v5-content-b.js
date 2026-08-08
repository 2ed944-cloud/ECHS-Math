(function(){
  'use strict';
  const b=window.__ECHS_PR5_BUILD;if(!b)throw new Error('Lesson 2.3 v5 builder missing.');
  const {R,S,V,cards,concept,W,T,Q,Section,TI}=b;

  Section('2.3C','Polynomial Models and Regression','Use differences, graph shape, parameter meaning, residuals and contextual judgment to choose and defend a polynomial model. A high coefficient of determination is evidence, not permission to extrapolate without limits.','polynomial-models');

  concept('2.3C','When is a polynomial model plausible?','Model family before regression',
    'A polynomial model is plausible when the response is smooth, has a limited number of turns, and no structural asymptote is expected in the relevant domain.',[
      {label:'TABLE',text:'For equally spaced inputs, constant finite differences can identify an exact polynomial degree.'},
      {label:'GRAPH',text:'A cubic may show up to two turns; a quartic may show up to three.'},
      {label:'CONTEXT',text:'The mechanism should permit smooth change rather than a forbidden input or multiplicative saturation.'},
      {label:'RESIDUALS',text:'A suitable fit leaves small, patternless residuals.'}
    ],'model-plausibility');

  S('2.3C','Finite differences can reveal degree','content','Equal input spacing is essential',`<div class="pr5-difference-board"><table><thead><tr><th>x</th><td>0</td><td>1</td><td>2</td><td>3</td><td>4</td></tr></thead><tbody><tr><th>y</th><td>2</td><td>4</td><td>12</td><td>32</td><td>70</td></tr><tr><th>Δy</th><td></td><td>2</td><td>8</td><td>20</td><td>38</td></tr><tr><th>Δ²y</th><td></td><td></td><td>6</td><td>12</td><td>18</td></tr><tr><th>Δ³y</th><td></td><td></td><td></td><td>6</td><td>6</td></tr></tbody></table><article><h2>Constant third differences</h2><p>The data lie exactly on a cubic for unit-spaced inputs.</p><div class="pr5-math">\[y=x^3+x+2\]</div></article></div>`);

  W('2.3C','Recover a cubic from finite differences',
    R`The values \(2,4,12,32,70\) occur at \(x=0,1,2,3,4\). Show that \(f(x)=x^3+x+2\) fits the data.`,[
      R`Third differences are constant at \(6\), so a cubic is plausible; for unit spacing, \(6a=6\), hence \(a=1\).`,
      R`Use \(f(0)=2\) to obtain the constant term \(d=2\).`,
      R`Substitute \(x=1,2\), or solve the remaining coefficient equations, to obtain \(b=0\) and \(c=1\).`,
      R`Check: \(f(4)=64+4+2=70\).`
    ],R`\[\boxed{f(x)=x^3+x+2}\]`,'Finite differences establish structure; substitution confirms the coefficients.','cubic-differences');

  S('2.3C','A measured data set needs regression','content','Exact interpolation is rarely appropriate',`<div class="pr5-two"><article class="pr5-panel"><h2>Measured values</h2><table class="pr5-small-table"><tr><th>x</th><td>0</td><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td><td>7</td></tr><tr><th>P</th><td>18.0</td><td>25.5</td><td>23.2</td><td>21.2</td><td>17.0</td><td>20.2</td><td>28.4</td><td>50.4</td></tr></table><p>The rise–fall–rise pattern suggests a cubic rather than a line.</p></article>${V('cubic-data-fit','Measured data and cubic regression curve')}</div>`);

  TI('Fit a cubic model from lists','cubicreg','Enter the explanatory variable in L1 and the response in L2, run CubicReg, store the equation in Y1, then inspect the graph and residuals.');

  W('2.3C','Interpret a cubic regression',
    R`For the data on the previous screen, a cubic regression gives \(P(x)=0.62096x^3-5.26115x^2+10.97937x+18.27576\).`,[
      R`The model has \(R^2\approx0.9953\), so it explains about 99.53% of the observed variation in this data set.`,
      R`Predicted values are approximately \(18.276,24.615,24.158,20.629,17.756,19.264,28.878,50.324\).`,
      R`Residuals \(P_{\text{observed}}-P_{\text{predicted}}\) are approximately \(-0.276,0.885,-0.958,0.571,-0.756,0.936,-0.478,0.076\).`,
      'The residuals are small relative to the response values and alternate without a strong visible curve.'
    ],R`\[\boxed{P(x)\approx0.621x^3-5.26x^2+10.98x+18.28}\]`,'Keep full calculator precision for later calculations; round coefficients only when reporting.','cubic-regression');

  concept('2.3C','Residuals are signed evidence','Observed minus predicted',
    R`For a data point \((x_i,y_i)\), the residual is \(e_i=y_i-\widehat y_i\).`,[
      {label:'POSITIVE',text:'The observation lies above the model.'},
      {label:'NEGATIVE',text:'The observation lies below the model.'},
      {label:'GOOD PATTERN',text:'Small residuals scattered around zero without a systematic shape.'},
      {label:'WARNING',text:'Curvature, fan shape or long runs of one sign indicate missing structure.'}
    ],'residual-plot');

  S('2.3C','Compare candidate models','content','Fit and simplicity both matter',`<div class="pr5-model-compare"><table><thead><tr><th>Model</th><th>Equation</th><th>\(R^2\)</th><th>SSres</th></tr></thead><tbody><tr><td>Linear</td><td>\(2.715x+15.983\)</td><td>0.383</td><td>499.09</td></tr><tr><td>Quadratic</td><td>\(1.259x^2-6.097x+24.796\)</td><td>0.712</td><td>232.83</td></tr><tr class="best"><td>Cubic</td><td>\(0.621x^3-5.261x^2+10.979x+18.276\)</td><td>0.995</td><td>3.78</td></tr></tbody></table>${V('model-comparison','Linear quadratic and cubic fits to one data set')}</div><div class="pr5-note">The cubic is strongly supported inside the observed interval, but the context still determines whether its turns and future growth are plausible.</div>`);

  T('2.3C','Select a polynomial model responsibly',
    'A sensor response at equally spaced times is 7.1, 10.0, 11.4, 11.5, 10.3, 7.8.',[
      'Calculate first and second differences and describe their pattern.',
      'Use a graphing calculator to compare a quadratic and cubic fit.',
      'Inspect residuals rather than choosing only from the larger value of \(R^2\).',
      'State a reasonable domain and one limitation.'
    ],'pr5-model-select',R`The first differences decrease approximately steadily, so a quadratic is a plausible parsimonious model. A cubic may improve the numerical fit slightly, but it should be chosen only if the residual pattern and context support an additional turn. The validated time interval is the safest domain.`,'model-selection');

  W('2.3C','Use a cubic model only inside its evidence window',
    R`The fitted model has local extrema at approximately \((1.381,25.040)\) and \((4.267,17.576)\). Interpret these points for \(0\le x\le7\).`,[
      'The first point is a local maximum: the predicted response rises to about 25.04, then decreases.',
      'The second point is a local minimum: the predicted response falls to about 17.58, then rises.',
      'Both inputs lie inside the observed interval, so the interpretations are interpolation-based.'
    ],R`\[\boxed{\text{local max }(1.381,25.040),\quad \text{local min }(4.267,17.576)}\]`,'Do not call either value a global maximum or minimum without checking endpoints and the stated domain.','cubic-extrema-labelled');

  concept('2.3C','Interpolation and extrapolation have different risk','Distance from data matters',
    'Polynomial tails can grow rapidly. A numerically excellent fit inside the data range may become implausible just beyond it.',[
      {label:'INTERPOLATION',text:'Prediction inside the observed interval; normally lower risk.'},
      {label:'NEAR EXTRAPOLATION',text:'A short extension may be defensible if the mechanism remains stable.'},
      {label:'DISTANT EXTRAPOLATION',text:'High risk: the leading term can dominate and produce unrealistic values.'}
    ],'extrapolation-risk');

  concept('2.3C','Overfitting hides behind a perfect fit','More degree is not automatically better',
    'A degree-7 polynomial can interpolate eight data points exactly, but that does not make it a strong model.',[
      {label:'FIT',text:'How closely does the model match the observed data?'},
      {label:'PARSIMONY',text:'Can a simpler model explain the pattern almost as well?'},
      {label:'STABILITY',text:'Do small data changes cause large coefficient or prediction changes?'},
      {label:'MEANING',text:'Does the model family match the mechanism and domain?'}
    ],'overfit-comparison');

  Q('Checkpoint C · Polynomial modelling',[
    'What difference pattern identifies an exact cubic for equally spaced inputs?',
    R`Define the residual for an observed value \(y\) and prediction \(\widehat y\).`,
    'Why is a high \(R^2\) not enough to justify distant extrapolation?',
    'State two reasons to prefer a quadratic over a slightly better-fitting cubic.'
  ],'pr5-check-c',R`Constant third differences. Residual \(e=y-\widehat y\). A high \(R^2\) describes fit to observed data, not stability or mechanism outside the interval. Prefer the quadratic when residuals are comparably small, the context allows only one turn, or simplicity and stability are stronger.`);

  Section('2.3D','Rational Structure, Domain and Asymptotes','A rational model is governed by numerator and denominator structure. Excluded inputs, zeros, holes and asymptotes must be distinguished algebraically before technology is trusted.','rational-overview');

  concept('2.3D','Rational functions begin with domain restrictions','The denominator may not be zero',
    R`A rational function is a quotient of polynomials: \(f(x)=\dfrac{P(x)}{Q(x)}\), with \(Q(x)≠0\).`,[
      {math:R`\[f(x)=\frac{x+1}{x-3}\]`,text:'Domain: \(x≠3\).'},
      {math:R`\[g(x)=\frac{x^2-4}{x^2-x-6}\]`,text:'Factor the denominator before stating restrictions: \(x≠3,-2\).'}
    ],'rational-domain',R`Simplifying an expression does not restore an input excluded by the original denominator.`);

  S('2.3D','Reciprocal parent and transformations','content','Shift, stretch and reflect',`<div class="pr5-two"><article class="pr5-panel"><div class="pr5-math">\[y=\frac1x\]</div><p>Parent asymptotes: \(x=0\) and \(y=0\).</p></article><article class="pr5-panel"><div class="pr5-math">\[y=\frac{a}{x-h}+k\]</div><p>Vertical asymptote \(x=h\); horizontal asymptote \(y=k\). The sign of \(a\) determines branch orientation.</p></article></div>${V('reciprocal-transform','Reciprocal parent and transformed rational graph')}`);

  concept('2.3D','Asymptotes describe limiting behaviour','A graph may approach without meeting',
    R`For \(f(x)=\dfrac8{x-2}+3\):`,[
      {label:'VERTICAL',math:R`\[x=2\]`,text:'The denominator is zero and the function grows without bound nearby.'},
      {label:'HORIZONTAL',math:R`\[y=3\]`,text:'As \(|x|\to\infty\), \(8/(x-2)\to0\).'},
      {label:'DOMAIN',math:R`\[x≠2\]`,text:'The forbidden input must be stated.'},
      {label:'RANGE',math:R`\[y≠3\]`,text:'This transformed reciprocal never equals its horizontal asymptote.'}
    ],'rational-asymptotes');

  W('2.3D','Determine a rational model from asymptotes and a point',
    R`A calibration curve has vertical asymptote \(x=2\), horizontal asymptote \(y=3\), and passes through \((4,7)\). Find a model of the form \(f(x)=\dfrac a{x-2}+3\).`,[
      R`Substitute the point: \(7=\dfrac a{4-2}+3\).`,
      R`Thus \(4=a/2\), so \(a=8\).`,
      R`State the excluded input \(x≠2\).`
    ],R`\[\boxed{f(x)=\frac8{x-2}+3,\qquad x≠2}\]`,'The asymptotes locate the transformed reciprocal; the point determines the scale and branch orientation.','rational-calibration');

  S('2.3D','A hole is not a vertical asymptote','content','Cancellation preserves the exclusion',R`<div class="pr5-hole-comparison"><div class="pr5-two"><article class="pr5-panel"><h2>Removable hole</h2><div class="pr5-math">\[g(x)=\frac{x^2-1}{x-1}=x+1,\quad x≠1\]</div><p>The graph is the line \(y=x+1\) with the point \((1,2)\) removed.</p></article><article class="pr5-panel"><h2>Vertical asymptote</h2><div class="pr5-math">\[h(x)=\frac1{x-1}\]</div><p>No factor cancels; values become unbounded as \(x\to1^\pm\).</p></article></div>${V('hole-vs-asymptote','A removable hole compared with a vertical asymptote')}</div>`);

  concept('2.3D','Signs determine rational branches','Factor numerator and denominator',
    R`For \(r(x)=\dfrac{(x+2)(x-4)}{x-1}\), the critical inputs are \(-2,1,4\).`,[
      {label:'ZEROS',text:'−2 and 4.'},
      {label:'FORBIDDEN INPUT',text:'1.'},
      {label:'SIGN INTERVALS',text:'Test \((−\infty,-2),(-2,1),(1,4),(4,\infty)\).'},
      {label:'CAUTION',text:'Never include the vertical asymptote in an inequality solution.'}
    ],'rational-sign-chart');

  W('2.3D','Solve a rational inequality',
    R`Solve \(\dfrac{(x+2)(x-4)}{x-1}>0\).`,[
      R`Critical inputs: zeros \(-2,4\) and excluded input \(1\).`,
      R`The signs from left to right are negative, positive, negative, positive.`,
      R`Use open endpoints because the inequality is strict; \(x=1\) is never included.`
    ],R`\[\boxed{(-2,1)\cup(4,\infty)}\]`,'A sign chart is more reliable than reading a clipped graph near the asymptote.','rational-inequality');

  concept('2.3D','Degree comparison predicts rational end behaviour','Compare numerator and denominator degrees',
    '',[
      {label:'NUMERATOR LOWER',math:R`\[\deg P<\deg Q\Rightarrow y=0\]`,text:'Horizontal asymptote 0.'},
      {label:'EQUAL DEGREE',math:R`\[\deg P=\deg Q\Rightarrow y=\frac{\text{lead }P}{\text{lead }Q}\]`,text:'Horizontal asymptote is the ratio of leading coefficients.'},
      {label:'NUMERATOR ONE HIGHER',text:'Polynomial division gives an oblique linear end-behaviour model.'}
    ],'rational-degree-comparison',R`An asymptote is an end-behaviour model. A rational graph may cross a horizontal or oblique asymptote.`);

  W('2.3D','Find line–rational intersections exactly',
    R`Find the intersections of \(f(x)=\dfrac8{x-2}+3\) and \(g(x)=\tfrac12x+2\).`,[
      R`Set \(\dfrac8{x-2}+3=\tfrac12x+2\).`,
      R`Then \(\dfrac8{x-2}=\tfrac12(x-2)\).`,
      R`Multiply by \(x-2\), noting \(x≠2\): \((x-2)^2=16\).`,
      R`Thus \(x=-2\) or \(x=6\); substitute into the line.`
    ],R`\[\boxed{(-2,1)\quad\text{and}\quad(6,5)}\]`,'If the practical domain is \(x>2\), only \((6,5)\) is admissible.','line-rational-intersections');

  concept('2.3D','Context can exclude an entire branch','The formula may be broader than the model',
    R`Suppose \(x\) represents a concentration above a critical value \(2\). Then \(x>2\), even though the algebraic rational function also has a branch for \(x<2\).`,[
      {label:'MATHEMATICAL DOMAIN',math:R`\[x≠2\]`,text:'Both branches exist.'},
      {label:'CONTEXTUAL DOMAIN',math:R`\[x>2\]`,text:'Only the right branch represents the experiment.'},
      {label:'MODEL LIMIT',text:'Predictions extremely close to \(x=2\) may be physically impossible even when the formula becomes very large.'}
    ],'context-rational');

  S('2.3D','Graphing near an asymptote can create false connections','content','Pixel display versus mathematical discontinuity',`<div class="pr5-two"><article class="pr5-panel"><h2>What the screen may show</h2><p>A steep segment or apparent vertical line connecting two branches.</p></article><article class="pr5-panel"><h2>What the mathematics says</h2><p>The function is undefined at the asymptote. Use algebra, TABLE and a window on each side; do not trace across the forbidden input.</p></article></div>${V('asymptote-artifact','Correct separate branches near a vertical asymptote')}`);

  Q('Checkpoint D · Rational structure',[
    R`State the domain and asymptotes of \(f(x)=\dfrac{-5}{x+3}+2\).`,
    R`Explain why \(\dfrac{x^2-9}{x-3}\) has a hole rather than a vertical asymptote at \(x=3\).`,
    R`Find the x-intercept of \(\dfrac{2x-7}{x+4}\).`,
    'State one independent check after using TI-84 Intersect on a rational model.'
  ],'pr5-check-d',R`Domain \(x≠-3\); asymptotes \(x=-3\), \(y=2\). The common factor cancels, but \(x=3\) remains excluded, producing a hole at \((3,6)\). The x-intercept is \(x=7/2\). Substitute each reported coordinate into both original equations and check the contextual domain.`);
})();
