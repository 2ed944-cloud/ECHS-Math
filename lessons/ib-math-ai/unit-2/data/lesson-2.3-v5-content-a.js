(function(){
  'use strict';
  const b=window.__ECHS_PR5_BUILD;if(!b)throw new Error('Lesson 2.3 v5 builder missing.');
  const {R,S,V,cards,concept,W,T,Q,Section,TI}=b;

  Section('2.3A','Polynomial Structure and End Behaviour','Read a polynomial as one connected system: degree limits possible turns, the leading term controls the distant ends, and context selects the meaningful interval.','poly-rational-overview');

  S('2.3A','What makes a function polynomial?','content','Structure before graphing',R`<div class="pr5-definition-layout"><div><p class="pr5-lead">A polynomial is a finite sum of terms \(a_kx^k\), where every exponent \(k\) is a non-negative integer and every coefficient is real.</p><div class="pr5-rule-list"><article class="valid"><b>✓</b><div><span>Polynomial</span><strong class="pr5-rule-expression">4<i>x</i><sup>5</sup>−3<i>x</i><sup>2</sup>+7</strong><small>exponents 5, 2 and 0</small></div></article><article><b>×</b><div><span>Not polynomial</span><strong class="pr5-rule-expression"><i>x</i><sup>−1</sup>+2</strong><small>negative exponent</small></div></article><article><b>×</b><div><span>Not polynomial</span><strong class="pr5-rule-expression">√<i>x</i>+<i>x</i></strong><small>fractional exponent \(1/2\)</small></div></article></div><div class="pr5-note"><b>Domain:</b> an unrestricted polynomial has domain \(\mathbb R\); a contextual model may use only a validated interval.</div></div>${V('polynomial-definition-flow','Decision test for polynomial structure')}</div>`);

  concept('2.3A','Degree and leading coefficient','Two pieces control the global skeleton',
    R`For \(f(x)=a_nx^n+\cdots+a_1x+a_0\), the largest exponent \(n\) is the degree and \(a_n\) is the leading coefficient.`,[
      {label:'DEGREE',math:R`\[n\]`,text:'Controls parity, the maximum possible number of turning points and the number of complex zeros counted with multiplicity.'},
      {label:'LEADING SIGN',math:R`\[\operatorname{sign}(a_n)\]`,text:'Controls whether the right-hand end rises or falls.'},
      {label:'LEADING TERM',math:R`\[a_nx^n\]`,text:'Approximates the polynomial for sufficiently large \(|x|\).'}
    ],'degree-leading');

  S('2.3A','Four end-behaviour families','content','Parity × leading sign',`<div class="pr5-wide-visual">${V('end-gallery','Four polynomial end-behaviour families')}</div><div class="pr5-note"><b>Read the arrows as limits:</b> even degree gives matching ends; odd degree gives opposite ends. A positive leading coefficient makes the right end rise.</div>`);

  W('2.3A','Predict end behaviour without graphing',
    R`For \(f(x)=-2x^5+7x^3-x+4\), describe the end behaviour.`,[
      R`The degree is \(5\), which is odd, so the two ends have opposite directions.`,
      R`The leading coefficient is negative, so the right-hand end falls.`,
      R`Therefore \(x\to\infty\Rightarrow f(x)\to-\infty\), and \(x\to-\infty\Rightarrow f(x)\to\infty\).`
    ],R`\[\boxed{x\to-\infty:\ f(x)\to\infty\qquad x\to\infty:\ f(x)\to-\infty}\]`,'The lower-degree terms shape the middle of the graph, but they do not change these distant directions.','odd-negative-end');

  T('2.3A','Match equations to their ends',
    'Compare the four functions without using a calculator.',[
      R`\(A(x)=3x^4-8x+1\)`,R`\(B(x)=-x^6+4x^2\)`,R`\(C(x)=2x^3-x\)`,R`\(D(x)=-5x^3+9\)`,
      'For each function, state the left and right end behaviour and identify the decisive term.'
    ],'pr5-end-match',R`A: up/up from \(3x^4\). B: down/down from \(-x^6\). C: down/up from \(2x^3\). D: up/down from \(-5x^3\).`,'end-match');

  concept('2.3A','Degree limits turning points','A ceiling, not a guarantee',
    R`A degree-\(n\) polynomial has at most \(n-1\) turning points. It may have fewer.`,[
      {label:'DEGREE 2',text:'At most 1 turning point.'},
      {label:'DEGREE 3',text:'At most 2 turning points.'},
      {label:'DEGREE 4',text:'At most 3 turning points.'},
      {label:'DEGREE 5',text:'At most 4 turning points.'}
    ],'turning-points',R`A calculator window can hide a turning point; degree provides a useful audit of what is possible.`);

  W('2.3A','Average rate changes across a cubic',
    R`For \(p(x)=x^3-3x\), compare the average rates of change on \([-2,-1]\), \([-1,0]\), \([0,1]\) and \([1,2]\).`,[
      R`Compute \(p(-2)=-2,\ p(-1)=2,\ p(0)=0,\ p(1)=-2,\ p(2)=2\).`,
      R`Because each interval has width \(1\), the average rates are the successive output changes.`,
      R`The rates are \(4,-2,-2,4\).`
    ],R`\[4,\ -2,\ -2,\ 4\]`,'A polynomial can change direction and rate; a single constant gradient is not an adequate description.','average-rate');

  concept('2.3A','The leading term dominates','Zoom out with a mathematical reason',
    R`For \(f(x)=2x^4-7x^2+3x-9\), divide by \(x^4\):`,[
      {math:R`\[\frac{f(x)}{x^4}=2-\frac7{x^2}+\frac3{x^3}-\frac9{x^4}\]`,text:'As \(|x|\) grows, the fractions approach zero.'},
      {math:R`\[f(x)\sim2x^4\]`,text:'The far-left and far-right shape therefore resembles \(2x^4\).'}
    ],'leading-term',R`This is an end-behaviour model, not an equality for ordinary values of \(x\).`);

  S('2.3A','End-behaviour laboratory','lab','Change degree and leading coefficient',`<div class="pr5-lab" data-pr5-end-lab><div class="pr5-lab-controls"><label>Degree \(n\)<input type="range" min="1" max="6" step="1" value="3" data-end-degree></label><label>Leading coefficient \(a\)<input type="range" min="-3" max="3" step="0.5" value="1" data-end-a></label><output data-end-equation></output></div><svg viewBox="0 0 760 390" data-end-svg aria-label="Interactive leading-term graph"></svg><div class="pr5-lab-verdict" data-end-verdict></div></div>`);

  concept('2.3A','A graphing window can hide global behaviour','Display is not the function',
    'The same polynomial may look almost linear, have no visible zeros, or appear to have the wrong end behaviour in a poor window.',[
      {label:'BEFORE GRAPHING',list:['Use degree and leading sign.','Estimate zeros or evaluate a table.','Choose a window from the context.']},
      {label:'AFTER GRAPHING',list:['Check every expected root/turn.','Zoom out to confirm ends.','Do not treat a clipped feature as nonexistent.']}
    ],'window-comparison');

  W('2.3A','Restrict a polynomial model to its context',
    R`A launched object is modelled by \(h(t)=-0.8t^3+4.8t^2+2t+1\) for \(0\le t\le7\), where \(h\) is height in metres. Explain why the polynomial domain is not all real numbers in this model.`,[
      R`The formula itself is defined for every real \(t\).`,
      R`The experiment begins at \(t=0\) and the model has only been validated through \(t=7\).`,
      R`Negative time and later extrapolation do not represent the intended event.`
    ],R`\[\boxed{0\le t\le7}\]`,'The mathematical domain and the contextual domain answer different questions.','context-domain');

  Q('Checkpoint A · Polynomial structure',[
    R`State the degree and leading coefficient of \(-4x^6+2x^3-x+9\).`,
    R`Describe both ends of \(3x^7-5x^2\).`,
    'State the maximum possible number of turning points of a degree-6 polynomial.',
    'Explain why a graphing window is not evidence of the complete end behaviour.'
  ],'pr5-check-a',R`Degree 6, leading coefficient −4. For \(3x^7-5x^2\): left down, right up. At most 5 turning points. A window shows only a selected finite rectangle; algebra determines global behaviour.`);

  Section('2.3B','Zeros, Factors, Multiplicity and Sign','Use factor structure to connect algebraic zeros, graph behaviour and polynomial inequalities. Multiplicity controls whether the sign changes at an intercept.','factor-structure');

  S('2.3B','Four equivalent statements','content','Translate without losing meaning',`<div class="pr5-equivalence"><div>\(f(r)=0\)</div><strong>⇔</strong><div>\(r\) is a zero/root</div><strong>⇔</strong><div>\((r,0)\) is an x-intercept</div><strong>⇔</strong><div>\((x-r)\) is a factor</div></div><div class="pr5-note">The equivalence applies to polynomial functions. The graph displays real zeros only.</div>`);

  concept('2.3B','Factors reveal roots and multiplicity','Read the exponent on each factor',
    R`If \(f(x)=a\prod (x-r_i)^{m_i}\), then \(r_i\) is a zero of multiplicity \(m_i\).`,[
      {math:R`\[(x+3)^1\]`,text:'Root −3, multiplicity 1.'},
      {math:R`\[(x-1)^2\]`,text:'Root 1, multiplicity 2.'},
      {math:R`\[(x-4)^3\]`,text:'Root 4, multiplicity 3.'}
    ],'factor-multiplicity');

  S('2.3B','Odd and even multiplicity','content','Precise local behaviour',`<div class="pr5-wide-visual">${V('multiplicity-gallery','Multiplicity one, two and three near the x-axis')}</div><div class="pr5-note"><b>Odd multiplicity:</b> the sign changes and the graph crosses. <b>Even multiplicity:</b> the sign does not change and the graph touches and turns. Higher multiplicity makes the graph flatter near the zero.</div>`);

  W('2.3B','Audit a factored polynomial',
    R`Analyse \(p(x)=0.12(x+3)(x-1)^2(x-4)\). State degree, zeros, multiplicities, intercept behaviour and end behaviour.`,[
      R`The degree is \(1+2+1=4\); the leading coefficient is positive.`,
      R`Zeros are \(-3\) (multiplicity 1), \(1\) (multiplicity 2), and \(4\) (multiplicity 1).`,
      R`The graph crosses at \(-3\) and \(4\), but touches and turns at \(1\).`,
      R`Even degree with positive leading coefficient gives up/up end behaviour.`
    ],R`\[\boxed{\deg p=4;\quad -3^{(1)},\ 1^{(2)},\ 4^{(1)};\quad \text{ends up/up}}\]`,'A precise sketch must satisfy all four pieces of evidence simultaneously.','factored-polynomial');

  T('2.3B','Sketch from factors before technology',
    R`Let \(q(x)=-\tfrac12(x+2)^2(x-3)\).`,[
      'State the degree and end behaviour.',
      'Describe the behaviour at each zero.',
      R`Find the y-intercept.`,
      'Sketch a graph consistent with all evidence.'
    ],'pr5-factor-sketch',R`Degree 3 with negative leading coefficient: left up, right down. The graph touches at \(x=-2\) and crosses at \(x=3\). The y-intercept is \(q(0)=6\).`,'student-factored');

  W('2.3B','Construct a polynomial from zeros and one point',
    R`A cubic has zeros \(-2\), \(1\) and \(5\), and passes through \((0,20)\). Find the function.`,[
      R`Write \(f(x)=a(x+2)(x-1)(x-5)\).`,
      R`Use \((0,20)\): \(20=a(2)(-1)(-5)=10a\).`,
      R`Thus \(a=2\).`
    ],R`\[\boxed{f(x)=2(x+2)(x-1)(x-5)}\]`,'The zeros determine the factors, but the additional point determines the vertical scale.','construct-cubic');

  concept('2.3B','Polynomial inequalities use signs between zeros','Zeros partition the number line',
    R`A continuous polynomial can change sign only at a zero of odd multiplicity.`,[
      {label:'1',title:'Mark every real zero',text:'Include multiplicity.'},
      {label:'2',title:'Test one value per interval',text:'Or propagate signs using multiplicity.'},
      {label:'3',title:'Use the inequality symbol',text:'Include zeros for \(\le\) or \(\ge\).'}
    ],'sign-chart');

  W('2.3B','Solve a polynomial inequality',
    R`Solve \((x+3)(x-1)^2(x-4)\le0\).`,[
      R`The zeros are \(-3\), \(1\) (even multiplicity) and \(4\).`,
      R`Starting to the right of \(4\), the sign is positive. It changes at \(4\), does not change at \(1\), and changes at \(-3\).`,
      R`The expression is negative from \(-3\) to \(4\), with equality at all three zeros.`
    ],R`\[\boxed{-3\le x\le4}\]`,'The repeated zero at 1 is included but does not split the negative solution interval.','inequality-sign');

  TI('Find polynomial zeros and audit multiplicity','zero','Use Zero for visible crossings, then compare the calculator output with the factor structure. A repeated zero may produce NO SIGN CHNG and needs algebra, a local extremum or a table check.');

  S('2.3B','NO SIGN CHNG is evidence, not a final answer','content','Repeated-root caution',`<div class="pr5-two"><article class="pr5-panel"><h2>Why the message appears</h2><p>The TI-84 Zero routine normally brackets a sign change. At an even-multiplicity root, both sides can have the same sign.</p></article><article class="pr5-panel"><h2>Repair</h2><ul><li>Inspect the factor structure.</li><li>Use Minimum/Maximum near the touch point.</li><li>Use TABLE values on both sides and at the suspected root.</li></ul></article></div>${V('repeated-zero-caution','Repeated zero with no sign change')}`);

  concept('2.3B','Degree can exceed the number of visible intercepts','Count multiplicity and non-real zeros',
    R`A degree-\(n\) polynomial has exactly \(n\) complex zeros counted with multiplicity, but its real graph may show fewer than \(n\) x-intercepts.`,[
      {math:R`\[(x-2)^2(x^2+1)\]`,text:'Degree 4, but only one real x-intercept, \(x=2\), counted twice.'},
      {math:R`\[x^4+1\]`,text:'Degree 4 with no real zeros and therefore no x-intercepts.'}
    ],'visible-intercepts',R`For IB AI SL graph interpretation, distinguish degree, real zeros, visible intercepts and multiplicity.`);

  Q('Checkpoint B · Zeros and sign',[
    R`For \(-3(x+1)^2(x-4)^3\), state the degree and each zero with multiplicity.`,
    'At which zeros does the graph cross the x-axis?',
    R`Solve \((x+2)(x-3)^2(x-5)>0\).`,
    'Explain why a TI-84 may miss an even-multiplicity zero.'
  ],'pr5-check-b',R`Degree 5; zeros −1 (mult. 2) and 4 (mult. 3). It crosses only at 4. For the inequality: \((-2,3)\cup(3,5)\) (equivalently \((-2,5)\setminus\{3\}\)). The Zero command normally seeks a sign change, which an even-multiplicity zero does not create.`);
})();
