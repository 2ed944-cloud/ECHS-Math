(function(){
'use strict';
const {R,slides,S,V,cards,concept,W,T,Q,Section}=window.__ECHS_FN4_BUILD;
Section('Function notation','Ask precise input-output questions','Function notation records the rule, the chosen input and the resulting output.','function-machine');
concept('Function notation','Read f(x) as “f of x”','It is not multiplication',R`The letter \(f\) names the function; \(x\) is a placeholder for an allowed input.`,[
 {label:'RULE',math:R`\[f(x)=2x^2-3x+1\]`,text:'The formula describes how the output is obtained.'},
 {label:'FUNCTION VALUE',math:R`\[f(4)=21\]`,text:R`The point \((4,21)\) lies on the graph.`,className:'accent'}
]);
W('Function notation','Evaluate a function value',R`For \(f(x)=2x^2-3x+1\), calculate \(f(5)\).`,[
R`Replace every occurrence of \(x\) by 5.`,R`\(f(5)=2(5)^2-3(5)+1\).`,R`Evaluate: \(50-15+1=36\).`
],R`\[\boxed{f(5)=36}\]`);
S('Function notation','Negative inputs need brackets','content','Protect the sign',R`<div class="fn4-compare"><article class="good"><span>CORRECT</span><div class="fn4-math">\[f(-3)=2(-3)^2-3(-3)+1=28\]</div><p>The exponent applies to the entire input.</p></article><article class="bad"><span>COMMON ERROR</span><div class="fn4-math">\[2(-3^2)\ne2(-3)^2\]</div><p>Without brackets, the exponent may be applied before the negative sign.</p></article></div>`);
concept('Function notation','The input may be an expression','Substitute the whole expression',R`Replacing \(x\) changes every occurrence of \(x\).`,[
 {label:'EXAMPLE',math:R`\[g(x)=3x-4\]`,text:''},
 {label:'SUBSTITUTION',math:R`\[g(a+2)=3(a+2)-4=3a+2\]`,text:'Brackets preserve the structure.',className:'accent'}
]);
S('Function notation','Images and preimages ask opposite questions','content','Know the direction',R`<div class="fn4-image-preimage"><div><span>IMAGE</span><b>input known</b><div class="fn4-math">\[f(3)=11\]</div><p>11 is the image of 3.</p></div><i>⇄</i><div><span>PREIMAGE</span><b>output known</b><div class="fn4-math">\[f(x)=11\]</div><p>Every solution is a preimage of 11.</p></div></div><div class="fn4-note">An output can have more than one preimage without violating the function rule.</div>`);
S('Function notation','Read an image from a graph','content','Move vertically, then horizontally',R`<div class="fn4-two">${V('image-preimage')}<div class="fn4-key"><ol><li>Start at the input on the \(x\)-axis.</li><li>Move vertically to the graph.</li><li>Read the output from the \(y\)-axis.</li></ol></div></div>`);
S('Function notation','Find every preimage from a graph','content','Use a horizontal line',R`<div class="fn4-two">${V('preimage-horizontal')}<div class="fn4-key"><ol><li>Draw or imagine the line \(y=k\).</li><li>Every intersection gives a preimage of \(k\).</li><li>State all solutions in the required domain.</li></ol><div class="fn4-math">\[f(x)=3.5\Rightarrow x=-5\text{ or }x=1\]</div></div></div>`);
S('Function notation','Read notation from a table','content','A table stores ordered pairs',R`<div class="fn4-two"><table class="fn4-table"><tr><th>\(x\)</th><th>\(-2\)</th><th>0</th><th>3</th><th>7</th></tr><tr><th>\(f(x)\)</th><td>5</td><td>\(-1\)</td><td>5</td><td>12</td></tr></table><div class="fn4-key"><ul><li>\(f(0)=-1\).</li><li>The image of 7 is 12.</li><li>The preimages of 5 are \(-2\) and 3.</li><li>\((3,5)\) is on the graph.</li></ul></div></div>`);
S('Function notation','Interpret notation with variables and units','content','Complete the sentence',R`<div class="fn4-context"><span>DELIVERY MODEL</span><div class="fn4-math">\[C(12)=47\]</div><p class="weak"><b>Incomplete:</b> “12 gives 47.”</p><p class="strong"><b>Complete:</b> For a delivery distance of 12 km, the model predicts a charge of QAR 47.</p></div>`);
concept('Function notation','Independent and dependent variables','The output depends on the input','State the variable and its units before interpreting a value.',[
 {label:'INDEPENDENT VARIABLE',title:'Input',text:R`Chosen, controlled or observed. Example: distance \(d\) in kilometres.`},
 {label:'DEPENDENT VARIABLE',title:'Output',text:R`Determined by the function. Example: charge \(C(d)\) in QAR.`,className:'accent'}
]);
W('Function notation','Find images and preimages',R`Let \(p(x)=x^2-5\). Calculate \(p(-4)\), then determine all preimages of 11.`,[
R`\(p(-4)=(-4)^2-5=11\).`,R`Set \(p(x)=11\): \(x^2-5=11\).`,R`Solve \(x^2=16\), so \(x=-4\) or \(x=4\).`
],R`\[p(-4)=11,\qquad p(x)=11\Rightarrow x=\pm4\]`);
T('Function notation','Notation in context',R`A tank contains \(V(t)=480-24t\) litres after \(t\) minutes.`,[
R`Calculate and interpret \(V(7.5)\).`,R`Find the preimage of 120 and interpret it.`,R`State the independent and dependent variables.`
],'fn4-notation-context',R`\(V(7.5)=300\), so 300 L remain after 7.5 minutes. Solving \(480-24t=120\) gives \(t=15\), so the tank contains 120 L after 15 minutes. Time is independent; volume is dependent.`);
Q('Function notation checkpoint',[
R`Explain the difference between \(f\) and \(f(x)\).`,R`State the point represented by \(f(6)=-2\).`,R`Explain why an output can have two preimages.`,R`Describe how to solve \(f(x)=4\) from a graph.`
],'fn4-notation-check',R`\(f\) names the function; \(f(x)\) is its output at input \(x\). The point is \((6,-2)\). Different inputs may share an output. Draw \(y=4\) and read every intersection.`);

Section('Domain and range','Describe permitted inputs and attained outputs','The domain is read horizontally; the range is read vertically.','domain-range-projection');
concept('Domain and range','Domain and range are sets','Definitions','Use only inputs for which the function is defined and outputs the function actually attains.',[
 {label:'DOMAIN',title:'All permitted inputs',math:R`\[D_f=\{x:f(x)\text{ is defined}\}\]`},
 {label:'RANGE',title:'All outputs produced',math:R`\[R_f=\{f(x):x\in D_f\}\]`,className:'accent'}
]);
S('Domain and range','Finite domains and ranges','content','List each value once',R`<div class="fn4-two">${V('finite-domain-range')}<div class="fn4-key"><div class="fn4-math">\[D=\{-3,0,2,6\}\]</div><div class="fn4-math">\[R=\{1,5,8\}\]</div><p>The repeated output 5 appears once in the range set.</p></div></div>`);
S('Domain and range','Equivalent notations','content','Make endpoint inclusion unambiguous',R`<table class="fn4-table"><thead><tr><th>Inequality</th><th>Interval</th><th>Set-builder</th></tr></thead><tbody><tr><td>\(-2\le x&lt;5\)</td><td>\([-2,5)\)</td><td>\(\{x\in\mathbb R:-2\le x&lt;5\}\)</td></tr><tr><td>\(x&lt;3\)</td><td>\(( -\infty,3)\)</td><td>\(\{x\in\mathbb R:x&lt;3\}\)</td></tr><tr><td>\(x\le0\) or \(x&gt;4\)</td><td>\(( -\infty,0]\cup(4,\infty)\)</td><td>\(\{x\in\mathbb R:x\le0\text{ or }x&gt;4\}\)</td></tr></tbody></table>`);
S('Domain and range','Open and closed endpoints','content','Included or excluded',R`${V('number-line-endpoints')}<div class="fn4-two"><div class="fn4-key"><b>Closed point · square bracket</b><p>The endpoint is included.</p></div><div class="fn4-key"><b>Open point · round bracket</b><p>The endpoint is excluded.</p></div></div>`);
S('Domain and range','Read endpoints from a graph','content','Project onto both axes',R`<div class="fn4-two">${V('endpoint-domain-range')}<div class="fn4-key"><p>The left endpoint \((-2,-1)\) is open; the right endpoint \((5,4)\) is closed.</p><div class="fn4-math">\[D=(-2,5]\]</div><div class="fn4-math">\[R=(-1,4]\]</div></div></div>`);
S('Domain and range','The rule and domain define the function','content','The domain changes the range',R`<div class="fn4-compare"><article><span>FUNCTION \(f\)</span><div class="fn4-math">\[f(x)=x^2,\quad x\in\mathbb R\]</div><p>Range: \([0,\infty)\).</p></article><article><span>FUNCTION \(g\)</span><div class="fn4-math">\[g(x)=x^2,\quad -2\le x\le3\]</div><p>Range: \([0,9]\).</p></article></div><div class="fn4-note">Identical formulas do not guarantee identical functions.</div>`);
concept('Domain and range','Polynomial rules','Natural domain','Addition, subtraction, multiplication and non-negative integer powers are defined for every real input.',[
 {label:'EXAMPLE',math:R`\[p(x)=4x^3-2x+7\]`,text:''},
 {label:'DOMAIN',math:R`\[D_p=\mathbb R\]`,className:'accent'}
]);
concept('Domain and range','Denominator restrictions','Exclude zeros','A rational expression is undefined wherever its denominator is zero.',[
 {label:'RULE',math:R`\[r(x)=\frac7{(x-3)(x+2)}\]`},
 {label:'DOMAIN',math:R`\[D_r=\mathbb R\setminus\{-2,3\}\]`,className:'accent'}
]);
concept('Domain and range','Even-root restrictions','Solve an inequality','A real square root requires a non-negative radicand.',[
 {label:'RULE',math:R`\[s(x)=\sqrt{12-3x}\]`},
 {label:'RESTRICTION',math:R`\[12-3x\ge0\Rightarrow x\le4\]`,className:'accent'}
]);
W('Domain and range','Combine algebraic restrictions',R`Determine the natural domain of \(f(x)=\dfrac{\sqrt{2x+8}}{x^2-9}\).`,[
R`Root restriction: \(2x+8\ge0\Rightarrow x\ge-4\).`,
R`Denominator restriction: \(x^2-9\ne0\Rightarrow x\ne-3,3\).`,
R`Start with \([-4,\infty)\), then remove \(-3\) and 3.`
],R`\[\boxed{D_f=[-4,-3)\cup(-3,3)\cup(3,\infty)}\]`);
concept('Domain and range','Contextual domains','Use what is meaningful','A formula may accept inputs that the situation does not.',[
 {label:'RULE',math:R`\[H(t)=1.5+3.2t\]`,text:R`Algebraically defined for all real \(t\).`},
 {label:'LIFT JOURNEY',math:R`\[0\le t\le6\]`,text:'The journey begins at 0 s and ends at 6 s.',className:'accent'}
]);
concept('Domain and range','Discrete and continuous domains','Match the variable','Counts use whole numbers; measurements can usually vary continuously.',[
 {label:'CONTINUOUS',math:R`\[0\le t\le12\]`,text:'time, distance, mass, temperature'},
 {label:'DISCRETE',math:R`\[n\in\{0,1,2,\ldots,40\}\]`,text:'students, vehicles, completed payments',className:'accent'}
]);
S('Domain and range','Read range vertically from a graph','content','Include only attained outputs',R`<div class="fn4-two">${V('range-from-graph')}<div class="fn4-key"><p>The lowest output is \(-3\), attained at a closed point. The graph approaches 6 at an open endpoint but never reaches 6.</p><div class="fn4-math">\[R=[-3,6)\]</div></div></div>`);
concept('Domain and range','Range of a monotonic function','Use endpoints',R`For \(f(x)=-3x+10\) on \(0\le x\le4\), the function decreases throughout the interval.`,[
 {label:'ENDPOINT OUTPUTS',math:R`\[f(0)=10,\qquad f(4)=-2\]`},
 {label:'RANGE',math:R`\[R=[-2,10]\]`,className:'accent'}
]);
S('Domain and range','Turning points can control the range','content','Check endpoints and interior extrema',R`<div class="fn4-two">${V('range-quadratic')}<div class="fn4-key"><div class="fn4-math">\[q(x)=(x-2)^2-3,\quad -1\le x\le5\]</div><p>The vertex gives the minimum \(-3\). Both endpoints give 6.</p><div class="fn4-result">\[R=[-3,6]\]</div></div></div>`);
S('Domain and range','An asymptote can exclude a range value','content','Approached is not attained',R`<div class="fn4-two">${V('reciprocal-asymptote')}<div class="fn4-key"><div class="fn4-math">\[g(x)=\frac3{x-2}+1\]</div><p>The graph approaches but never reaches \(y=1\).</p><div class="fn4-result">\[R_g=\mathbb R\setminus\{1\}\]</div></div></div>`);
W('Domain and range','Contextual domain and range',R`A lift height is modelled by \(h(t)=1.5+3.2t\) metres for a six-second journey. State its contextual domain and range.`,[
R`Time starts at \(t=0\) and ends at \(t=6\): \(D=[0,6]\).`,R`The function is increasing, so evaluate the endpoints.`,R`\(h(0)=1.5\) and \(h(6)=20.7\).`
],R`\[\boxed{D=[0,6],\qquad R=[1.5,20.7]\text{ m}}\]`);
T('Domain and range','Mixed restrictions','Complete each item.',[
R`State the natural domain of \(a(x)=\sqrt{x+5}\).`,R`State the natural domain of \(b(x)=\dfrac4{x^2-16}\).`,R`Find the range of \(c(x)=2x-1\) for \(-3&lt;x\le4\).`,R`State a realistic domain for occupied seats in a 480-seat theatre.`
],'fn4-domain-mixed',R`1. \([-5,\infty)\). 2. \(\mathbb R\setminus\{-4,4\}\). 3. \((-7,7]\). 4. \(n\in\{0,1,\ldots,480\}\).`);
Q('Domain and range checkpoint',[
R`Explain why a calculator window is not a domain.`,R`Explain why a formula may have a wider domain than a model.`,R`State how an open endpoint can affect the range.`,R`State the two most common algebraic restrictions in this lesson.`
],'fn4-domain-check',R`A window displays only part of a graph. Context may restrict inputs. An open endpoint may exclude its output unless another input attains it. Denominators must be non-zero; even-root radicands must be non-negative.`);

})();
