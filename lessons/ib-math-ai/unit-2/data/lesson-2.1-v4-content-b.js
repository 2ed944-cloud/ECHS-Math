(function(){
  'use strict';
  const {R,S,V,concept,W,T,Q,Section}=window.__ECHS_FN4_BUILD;

  T('Function notation','Notation in context',R`A tank contains \(V(t)=480-24t\) litres after \(t\) minutes.`,[
    R`Calculate and interpret \(V(7.5)\).`,
    R`Find the preimage of 120 and interpret it.`,
    R`State the independent and dependent variables, including units.`
  ],'fn4-notation-context',R`\(V(7.5)=300\), so 300 L remain after 7.5 minutes. Solving \(480-24t=120\) gives \(t=15\), so the tank contains 120 L after 15 minutes. Time is independent; volume is dependent.`);

  Q('Function notation checkpoint',[
    R`Explain the difference between \(f\) and \(f(x)\).`,
    R`State the point represented by \(f(6)=-2\).`,
    R`Explain why an output can have two preimages.`,
    R`Describe how to solve \(f(x)=4\) from a graph.`
  ],'fn4-notation-check',R`\(f\) names the function; \(f(x)\) is its output at input \(x\). The point is \((6,-2)\). Different inputs may share an output. Draw \(y=4\) and read every intersection.`);

  Section('Domain and range','Describe permitted inputs and attained outputs','The domain is read horizontally; the range is read vertically.','domain-range-projection');

  concept('Domain and range','Domain and range are sets','Definitions','Use only inputs for which the function is defined and outputs the function actually attains.',[
    {label:'DOMAIN',title:'All permitted inputs',math:R`\[D_f=\{x:f(x)\text{ is defined}\}\]`},
    {label:'RANGE',title:'All outputs produced',math:R`\[R_f=\{f(x):x\in D_f\}\]`,className:'accent'}
  ],'domain-range-projection');

  S('Domain and range','Finite domains and ranges','content','List each value once',R`<div class="fn4-two">${V('finite-domain-range','A mapping diagram with finite domain and range')}<div class="fn4-key"><div class="fn4-math">\[D=\{-3,0,2,6\}\]</div><div class="fn4-math">\[R=\{1,5,8\}\]</div><p>The repeated output 5 appears once in the range set.</p></div></div>`);

  S('Domain and range','Equivalent notations','content','Make endpoint inclusion unambiguous',R`<table class="fn4-table"><thead><tr><th>Inequality</th><th>Interval</th><th>Set-builder</th></tr></thead><tbody><tr><td>\(-2\le x\lt5\)</td><td>\([-2,5)\)</td><td>\(\{x\in\mathbb R:-2\le x\lt5\}\)</td></tr><tr><td>\(x\lt3\)</td><td>\((-\infty,3)\)</td><td>\(\{x\in\mathbb R:x\lt3\}\)</td></tr><tr><td>\(x\le0\) or \(x\gt4\)</td><td>\((-\infty,0]\cup(4,\infty)\)</td><td>\(\{x\in\mathbb R:x\le0\text{ or }x\gt4\}\)</td></tr></tbody></table>`);

  S('Domain and range','Open and closed endpoints','content','Included or excluded',R`${V('number-line-endpoints','Number lines comparing open and closed endpoints')}<div class="fn4-two compact"><div class="fn4-key"><b>Closed point · square bracket</b><p>The endpoint is included.</p></div><div class="fn4-key"><b>Open point · round bracket</b><p>The endpoint is excluded.</p></div></div>`);

  S('Domain and range','Read endpoints from a graph','content','Project onto both axes',R`<div class="fn4-two">${V('endpoint-domain-range','A line segment with an open left endpoint and closed right endpoint')}<div class="fn4-key"><p>The left endpoint \((-2,-1)\) is open; the right endpoint \((5,4)\) is closed.</p><div class="fn4-math">\[D=(-2,5]\]</div><div class="fn4-math">\[R=(-1,4]\]</div></div></div>`);

  S('Domain and range','The rule and domain define the function','content','The domain changes the range',R`<div class="fn4-compare"><article><span>FUNCTION \(f\)</span><div class="fn4-math">\[f(x)=x^2,\quad x\in\mathbb R\]</div><p>Range: \([0,\infty)\).</p></article><article><span>FUNCTION \(g\)</span><div class="fn4-math">\[g(x)=x^2,\quad -2\le x\le3\]</div><p>Range: \([0,9]\).</p></article></div><div class="fn4-note">Identical formulae do not guarantee identical functions.</div>`);

  concept('Domain and range','Denominator restrictions','Exclude zeros','A rational expression is undefined wherever its denominator is zero.',[
    {label:'RULE',math:R`\[r(x)=\frac7{(x-3)(x+2)}\]`,text:'Set each denominator factor equal to zero.'},
    {label:'DOMAIN',math:R`\[D_r=\mathbb R\setminus\{-2,3\}\]`,text:'Every other real input is permitted.',className:'accent'}
  ],'rational-domain');

  concept('Domain and range','Even-root restrictions','Solve an inequality','A real square root requires a non-negative radicand.',[
    {label:'RULE',math:R`\[s(x)=\sqrt{12-3x}\]`},
    {label:'RESTRICTION',math:R`\[12-3x\ge0\Rightarrow x\le4\]`,className:'accent'}
  ],'root-domain');

  W('Domain and range','Combine algebraic restrictions',R`Determine the natural domain of \(f(x)=\dfrac{\sqrt{2x+8}}{x^2-9}\).`,[
    R`Root restriction: \(2x+8\ge0\Rightarrow x\ge-4\).`,
    R`Denominator restriction: \(x^2-9\ne0\Rightarrow x\ne-3,3\).`,
    R`Start with \([-4,\infty)\), then remove \(-3\) and 3.`
  ],R`\[\boxed{D_f=[-4,-3)\cup(-3,3)\cup(3,\infty)}\]`);

  concept('Domain and range','Contextual domains','Use what is meaningful','A formula may accept inputs that the situation does not.',[
    {label:'RULE',math:R`\[H(t)=1.5+3.2t\]`,text:R`Algebraically defined for every real \(t\).`},
    {label:'LIFT JOURNEY',math:R`\[0\le t\le6\]`,text:'The journey begins at 0 s and ends at 6 s.',className:'accent'}
  ],'context-domain');

  concept('Domain and range','Discrete and continuous domains','Match the variable','Counts use whole numbers; measurements can usually vary continuously.',[
    {label:'CONTINUOUS',math:R`\[0\le t\le12\]`,text:'time, distance, mass, temperature'},
    {label:'DISCRETE',math:R`\[n\in\{0,1,2,\ldots,40\}\]`,text:'students, vehicles, completed payments',className:'accent'}
  ],'discrete-continuous');

  S('Domain and range','Read range vertically from a graph','content','Include only attained outputs',R`<div class="fn4-two">${V('range-from-graph','A graph with a closed minimum and open upper endpoint')}<div class="fn4-key"><p>The lowest output is \(-3\), attained at a closed point. The graph approaches 6 at an open endpoint but never reaches 6.</p><div class="fn4-math">\[R=[-3,6)\]</div></div></div>`);

  concept('Domain and range','Range of a monotonic function','Use endpoints','For \(f(x)=-3x+10\) on \(0\le x\le4\), the function decreases throughout the interval.',[
    {label:'ENDPOINT OUTPUTS',math:R`\[f(0)=10,\qquad f(4)=-2\]`},
    {label:'RANGE',math:R`\[R=[-2,10]\]`,className:'accent'}
  ],'monotonic-range');

  S('Domain and range','Turning points can control the range','content','Check endpoints and interior extrema',R`<div class="fn4-two">${V('range-quadratic','A restricted quadratic with a vertex and two endpoints')}<div class="fn4-key"><div class="fn4-math">\[q(x)=(x-2)^2-3,\quad -1\le x\le5\]</div><p>The vertex gives the minimum \(-3\). Both endpoints give 6.</p><div class="fn4-result">\[R=[-3,6]\]</div></div></div>`);

  S('Domain and range','An asymptote can exclude a range value','content','Approached is not attained',R`<div class="fn4-two">${V('reciprocal-asymptote','A translated reciprocal graph with horizontal asymptote y equals 1')}<div class="fn4-key"><div class="fn4-math">\[g(x)=\frac3{x-2}+1\]</div><p>The graph approaches but never reaches \(y=1\).</p><div class="fn4-result">\[R_g=\mathbb R\setminus\{1\}\]</div></div></div>`);

  T('Domain and range','Contextual domain and range',R`A lift height is modelled by \(h(t)=1.5+3.2t\) metres for a six-second journey.`,[
    R`State the contextual domain.`,
    R`Determine the range.`,
    R`Interpret the two endpoint outputs.`
  ],'fn4-domain-context',R`\(D=[0,6]\). Since the function increases, \(h(0)=1.5\) and \(h(6)=20.7\), so \(R=[1.5,20.7]\) m. The lift begins at 1.5 m and reaches 20.7 m after 6 s.`);

  S('Domain and range','A viewing window is not a domain','content','Common error',R`<div class="fn4-misconception"><div>!</div><section><h2>“My calculator window is \(-10\le x\le10\), so that is the domain.”</h2><p><b>Correction:</b> a window displays part of a graph. The domain comes from the rule and the context and may extend far beyond the visible screen.</p></section></div>`);

  Q('Domain and range checkpoint',[
    R`State the difference between mathematical and contextual domain.`,
    R`Determine the domain of \(\sqrt{5-2x}\).`,
    R`Explain how an open endpoint affects the range.`,
    R`State when a domain should be discrete.`
  ],'fn4-domain-check',R`A mathematical domain comes from the rule; a contextual domain comes from the situation. For \(\sqrt{5-2x}\), require \(x\le2.5\). An open endpoint excludes its output unless another point attains that output. A domain is discrete when the input is counted in separate whole-number steps.`);
})();
