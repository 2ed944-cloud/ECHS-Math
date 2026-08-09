(function(){
'use strict';
const B=window.U411_CORE;if(!B)return;
const {U,D,A,plot,lab,tiButton,worked,turn,cards,keyRoute,screen,reveal}=B;

// 33
A('u411-33','Technology','TI‑84 example','Lower tail: left edge is negative infinity','worked',`
<div class="u411-visual-layout">
  <article>
    <span class="u411-label">Mission</span>
    <h2>Find \\(P(X&lt;40)\\) for \\(X\sim N(32,6^2)\\)</h2>
    ${keyRoute(['2nd','VARS','2:normalcdf('])}
    <div class="u411-evidence" style="margin-top:15px">normalcdf(−1E99,40,32,6)</div>
    <p class="u411-muted">Result: \\(${U.fmt(U.cdf(40,32,6),9)}\\)</p>
    <div class="u411-ti-actions">${tiButton('Load this lower-tail mission','normalcdf')}</div>
  </article>
  ${plot('lower',{mu:32,sd:6,upper:40,label:'Calculator bounds match the shaded region'})}
</div>`);

// 34
A('u411-34','Technology','TI‑84 example','Upper tail: right edge is positive infinity','worked',`
<div class="u411-visual-layout">
  <article>
    <span class="u411-label">Mission</span>
    <h2>Find \\(P(X&gt;43)\\) for \\(X\sim N(32,6^2)\\)</h2>
    ${keyRoute(['2nd','VARS','2:normalcdf('])}
    <div class="u411-evidence" style="margin-top:15px">normalcdf(43,1E99,32,6)</div>
    <p class="u411-muted">Result: \\(${U.fmt(U.sf(43,32,6),9)}\\)</p>
    <div class="u411-ti-actions">${tiButton('Load this upper-tail mission','normalcdf')}</div>
  </article>
  ${plot('upper',{mu:32,sd:6,lower:43,label:'Right tail, not the large left complement'})}
</div>`);

// 35
A('u411-35','Technology','TI‑84 example','Between bounds: no infinity entry is needed','worked',`
<div class="u411-visual-layout">
  <article>
    <span class="u411-label">Mission</span>
    <h2>Find \\(P(492&lt;V&lt;510)\\) for \\(V\sim N(500,8^2)\\)</h2>
    <div class="u411-evidence">normalcdf(492,510,500,8)</div>
    <p>Result: \\(${U.fmt(U.prob(492,510,500,8),9)}\\)</p>
    <p class="u411-muted">The first bound must be smaller than the second. Reversed bounds signal an input error.</p>
  </article>
  ${plot('between',{mu:500,sd:8,lower:492,upper:510,label:'Finite lower and upper bounds'})}
</div>`);

// 36
A('u411-36','Technology','Infinity entry','How to type 1E99 correctly','concept',`
<div class="u411-two">
  <article class="u411-card teal">
    <span class="u411-label">Positive infinity proxy</span>
    <span class="u411-big">1E99</span>
    <p>Press <b>1</b>, then <b>2nd</b>, then the comma key marked <b>EE</b>, then <b>99</b>.</p>
  </article>
  <article class="u411-card maroon">
    <span class="u411-label">Negative infinity proxy</span>
    <span class="u411-big">−1E99</span>
    <p>Use the calculator's negative key, not the subtraction operator, before 1E99.</p>
  </article>
</div>
<div class="u411-warning" style="margin-top:15px"><strong>Do not type 1099.</strong> E means “times ten to the power,” so 1E99 represents \\(10^{99}\\).</div>`);

// 37
A('u411-37','Technology','Graph audit','ShadeNorm makes the intended area visible','concept',`
<div class="u411-visual-layout">
  <article>
    <span class="u411-label">Graph route</span>
    <h2>2nd → VARS → DRAW → ShadeNorm(</h2>
    <div class="u411-evidence">ShadeNorm(492,510,500,8)</div>
    <p>On supported TI‑84 workflows, ShadeNorm draws the normal curve and shades the area between the same four inputs used by normalcdf.</p>
    <div class="u411-ti-note">A graph verifies region choice; normalcdf supplies the numerical probability.</div>
  </article>
  ${plot('between',{mu:500,sd:8,lower:492,upper:510,label:'ShadeNorm visual target'})}
</div>`);

// 38
A('u411-38','Technology','Evidence','What a complete calculator record looks like','concept',`
<div class="u411-four">
  <article class="u411-card maroon"><span class="u411-symbol">1</span><h2>Model</h2><p>\\(V\sim N(500,8^2)\\)</p></article>
  <article class="u411-card teal"><span class="u411-symbol">2</span><h2>Region</h2><p>\\(492&lt;V&lt;510\\)</p></article>
  <article class="u411-card gold"><span class="u411-symbol">3</span><h2>Command</h2><p>normalcdf(492,510,500,8)</p></article>
  <article class="u411-card maroon"><span class="u411-symbol">4</span><h2>Meaning</h2><p>${U.pct(U.prob(492,510,500,8),2)} of bottles, approximately.</p></article>
</div>
<div class="u411-evidence" style="margin-top:16px"><strong>IB-ready line:</strong> \\(P(492&lt;V&lt;510)=${U.fmt(U.prob(492,510,500,8),5)}\\), so approximately ${U.pct(U.prob(492,510,500,8),2)} of bottles are modelled to lie in this volume interval.</div>`);

// 39
A('u411-39','Technology','Error analysis','Repair three calculator setups','activity',`
${turn(
`For \\(X\sim N(32,6^2)\\), diagnose each command.`,
'u411-ti-audit',
`<ol>
<li><b>normalcdf(40,−1E99,32,6)</b>: bounds reversed. Correct: normalcdf(−1E99,40,32,6).</li>
<li><b>normalcdf(43,1E99,32,36)</b>: variance entered as SD. Correct σ is 6.</li>
<li><b>normalcdf(1.833,1E99,32,6)</b>: standardized bound mixed with raw parameters. Use either 43,32,6 or 1.833…,0,1.</li>
</ol>`,
`<div class="u411-three">
<article class="u411-card warn"><h2>A</h2><p>normalcdf(40,−1E99,32,6)</p></article>
<article class="u411-card warn"><h2>B</h2><p>normalcdf(43,1E99,32,36)</p></article>
<article class="u411-card warn"><h2>C</h2><p>normalcdf(1.833,1E99,32,6)</p></article>
</div>`
)}
`);

// 40
A('u411-40','Quantiles','Reverse direction','Inverse normal starts with area, not with x','concept',`
<div class="u411-misconception">
  <article class="wrong"><span class="u411-label">Probability question</span><h2>Boundary is known</h2><p>“What proportion is below 78?” Use normalcdf.</p></article>
  <i>↔</i>
  <article class="right"><span class="u411-label">Quantile question</span><h2>Area is known</h2><p>“What value has 82% below it?” Use invNorm.</p></article>
</div>
${plot('percentile',{mu:68,sd:10,area:.82,label:'Area 0.82 determines a boundary'})}`);

// 41
A('u411-41','Quantiles','Definition','A percentile is a lower-tail statement','concept',`
<div class="u411-formula">
  <span class="u411-label" style="color:#cfe2e8">p-th quantile</span>
  <b>\\(P(X&lt;x_p)=p\\)</b>
  <p>The 82nd percentile has lower-tail area 0.82—not 0.18.</p>
</div>
<div class="u411-three" style="margin-top:16px">
  <article class="u411-card teal"><span class="u411-big">25th</span><p>Area left = 0.25</p></article>
  <article class="u411-card gold"><span class="u411-big">50th</span><p>Area left = 0.50 = mean</p></article>
  <article class="u411-card maroon"><span class="u411-big">90th</span><p>Area left = 0.90</p></article>
</div>`);

// 42
A('u411-42','Quantiles','TI‑84 workflow','invNorm converts cumulative area into x','concept',`
${keyRoute(['2nd','VARS','3:invNorm('])}
<div class="u411-ti-fields" style="margin-top:18px">
  <article><span>Area</span><b>lower-tail p</b></article>
  <article><span>μ</span><b>model mean</b></article>
  <article><span>σ</span><b>model SD</b></article>
  <article><span>Tail</span><b>LEFT / portable default</b></article>
</div>
<div class="u411-evidence" style="margin-top:15px"><strong>Portable syntax:</strong> invNorm(p, μ, σ)</div>
<div class="u411-ti-note" style="margin-top:14px">Recent TI‑84 Plus CE operating systems may offer LEFT, CENTER, or RIGHT. Converting the wording to a lower-tail area first remains the most transferable method.</div>`);

// 43
A('u411-43','Quantiles','Worked example','Find a percentile cut score','worked',`
${worked(
`Assessment scores follow \\(S\sim N(68,10^2)\\). Find the 82nd percentile.`,
[
`“82nd percentile” means lower-tail area \\(p=0.82\\).`,
`Enter <b>invNorm(0.82,68,10)</b>.`,
`The boundary is \\(s\approx ${U.fmt(U.inv(.82,68,10),4)}\\).`,
`Check: it must exceed the mean because 0.82>0.50.`
],
`Approximately 82% of scores are below ${U.fmt(U.inv(.82,68,10),1)} points under the model.`,
plot('percentile',{mu:68,sd:10,area:.82,label:'82nd percentile'})
)}
<div class="u411-ti-actions">${tiButton('Try invNorm in the verified coach','invnorm')}</div>`);

// 44
A('u411-44','Quantiles','Student turn','Find and interpret a percentile','activity',`
${turn(
`Package mass is \\(M\sim N(250,12^2)\\). Find the 35th percentile.`,
'u411-percentile-turn',
`<p>Use lower-tail area 0.35: <b>invNorm(0.35,250,12)</b>.</p>
<p>\\(m\approx ${U.fmt(U.inv(.35,250,12),4)}\\) g.</p>
<p>About 35% of packages are modelled to have mass below ${U.fmt(U.inv(.35,250,12),1)} g.</p>
<p>The answer is below 250 g because 0.35&lt;0.5.</p>`,
plot('percentile',{mu:250,sd:12,area:.35,label:'35th percentile'})
)}
`);

// 45
A('u411-45','Quantiles','Tail conversion','Bottom p% and top p% use different lower-tail areas','concept',`
<div class="u411-two">
  <article class="u411-card good">
    <span class="u411-label">Bottom p%</span>
    <h2>Lower-tail area = \\(p\\)</h2>
    <p>Bottom 12% → invNorm(0.12, μ, σ).</p>
  </article>
  <article class="u411-card warn">
    <span class="u411-label">Top p%</span>
    <h2>Lower-tail area = \\(1-p\\)</h2>
    <p>Top 12% → invNorm(0.88, μ, σ).</p>
  </article>
</div>
${plot('top-bottom',{mu:0,sd:1,area:.12,label:'Same 12% area, opposite tails'})}
<div class="u411-rule" style="margin-top:14px">Sketch first. If the requested top-tail cut is above the mean, the lower-tail input must exceed 0.5.</div>`);

// 46
A('u411-46','Quantiles','Worked example','Find the threshold for the top 10%','worked',`
${worked(
`Scores satisfy \\(S\sim N(68,10^2)\\). Find the minimum score marking the top 10%.`,
[
`The right tail is 0.10, so the area to the left is \\(1-0.10=0.90\\).`,
`Enter <b>invNorm(0.90,68,10)</b>.`,
`The cut score is \\(s\approx ${U.fmt(U.inv(.90,68,10),4)}\\).`,
`It is above the mean, as a top-tail threshold should be.`
],
`A score of about ${U.fmt(U.inv(.90,68,10),1)} points marks the beginning of the top 10% under the model.`,
plot('upper',{mu:68,sd:10,lower:U.inv(.9,68,10),label:'Right-tail area 0.10'})
)}
`);

// 47
A('u411-47','Quantiles','Central intervals','Split the leftover area equally between the tails','concept',`
<div class="u411-formula">
  <span class="u411-label" style="color:#cfe2e8">Middle c of a symmetric normal distribution</span>
  <b>\\(\text{each tail}=\dfrac{1-c}{2}\\)</b>
  <p>Then find the lower and upper boundaries using the two cumulative areas.</p>
</div>
<div class="u411-equation-chain">
  <span>middle 90%: \\(c=0.90\\)</span><i>→</i>
  <span>each tail = 0.05</span><i>→</i>
  <span>invNorm(0.05) and invNorm(0.95)</span>
</div>
${plot('central',{mu:0,sd:1,area:.90,label:'Middle 90%; two 5% tails'})}`);

// 48
A('u411-48','Quantiles','Worked example','Find a central 90% interval','worked',`
${(()=>{const c=U.central(.90,500,8);return worked(
`Bottle volume follows \\(V\sim N(500,8^2)\\). Find the interval containing the middle 90%.`,
[
`The unshaded area is \\(1-0.90=0.10\\), so each tail has area 0.05.`,
`Lower bound: <b>invNorm(0.05,500,8)</b> \\(\approx ${U.fmt(c.lo,4)}\\).`,
`Upper bound: <b>invNorm(0.95,500,8)</b> \\(\approx ${U.fmt(c.hi,4)}\\).`,
`The bounds are equally distant from 500 because the distribution is symmetric.`
],
`The middle 90% of bottle volumes is modelled to lie approximately between ${U.fmt(c.lo,1)} mL and ${U.fmt(c.hi,1)} mL.`,
plot('central',{mu:500,sd:8,area:.90,label:'Central 90% interval'})
)})()}
`);
})();
