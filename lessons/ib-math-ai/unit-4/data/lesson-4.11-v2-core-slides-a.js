(function(){
'use strict';
const B=window.U411_CORE;if(!B)return;
const {U,D,A,plot,lab,tiButton,worked,turn,cards,keyRoute,screen,reveal}=B;

// 1
A('u411-01','Launch','Normal distribution','Area is the probability language','cover',`
<div class="u411-cover">
  <div>
    <span class="u411-label">IB Mathematics · Applications and Interpretation SL</span>
    <h1>Normal distributions turn <em>position</em> into <em>area</em>.</h1>
    <p>A boundary describes where; the area under the density curve describes how likely. This lesson builds the complete probability → quantile → interpretation chain.</p>
    <div class="u411-pill-row">
      <span class="u411-pill"><strong>64</strong> learning screens</span>
      <span class="u411-pill"><strong>5</strong> live investigations</span>
      <span class="u411-pill"><strong>80</strong> practice questions</span>
      <span class="u411-pill"><strong>TI‑84</strong> normalcdf + invNorm</span>
    </div>
  </div>
  ${plot('cover',{mu:0,sd:1,shade:'between',lower:-1.15,upper:1.15,label:'Probability is area'})}
</div>`);

// 2
A('u411-02','Launch','Route map','The full reasoning chain','concept',`
<div class="u411-flow">
  <article class="active"><b>1 · Model</b><span>Name \\(\mu\\) and \\(\sigma\\)</span></article><i>→</i>
  <article><b>2 · Region</b><span>Translate the inequality</span></article><i>→</i>
  <article><b>3 · Command</b><span>Enter correct bounds</span></article><i>→</i>
  <article><b>4 · Meaning</b><span>Interpret in context</span></article>
</div>
<div class="u411-three" style="margin-top:18px">
  <article class="u411-card maroon"><span class="u411-label">Probability</span><h2>Boundary → area</h2><p>Use <b>normalcdf</b> when the data boundary is known.</p></article>
  <article class="u411-card teal"><span class="u411-label">Quantile</span><h2>Area → boundary</h2><p>Use <b>invNorm</b> when the percentage is known.</p></article>
  <article class="u411-card gold"><span class="u411-label">Audit</span><h2>Sketch before keys</h2><p>The shaded region catches tail and bound errors immediately.</p></article>
</div>`);

// 3
A('u411-03','Launch','Diagnostic','Probability question or inverse question?','activity',`
${turn('Classify each request before calculating: which gives an area, and which gives a boundary?','u411-diagnostic',`
<ol>
  <li>“What proportion of journeys last less than 40 minutes?” → <b>Probability</b>; use normalcdf.</li>
  <li>“Find the journey time below which 90% fall.” → <b>Quantile</b>; use invNorm.</li>
  <li>“Find the middle 80% interval.” → <b>Two inverse boundaries</b>; each tail has area 0.10.</li>
</ol>
<p>The decisive question is: <em>Is x known, or is the area known?</em></p>`,`
<div class="u411-compare">
  <article class="u411-card blue"><span class="u411-big">x known</span><p>Find \\(P(X\text{ in a region})\\).</p></article>
  <article class="u411-card good"><span class="u411-big">area known</span><p>Find the x-value that creates it.</p></article>
</div>`)}
`);

// 4
A('u411-04','Model','Notation','Read \\(X\sim N(\mu,\sigma^2)\\) precisely','concept',`
${cards([
 {label:'Random variable',title:'\\(X\\)',body:'<p>The measured quantity, including its unit: time, mass, score, height, and so on.</p>'},
 {label:'Centre',title:'\\(\mu\\)',body:'<p>The population mean. It has the <b>same unit as X</b>.</p>'},
 {label:'Spread',title:'\\(\sigma\\)',body:'<p>The population standard deviation. It also has the <b>same unit as X</b>.</p>'},
 {label:'Notation parameter',title:'\\(\sigma^2\\)',body:'<p>The variance. It has <b>squared units</b>, even though calculator fields request \\(\sigma\\).</p>'}
])}
<div class="u411-rule" style="margin-top:16px"><strong>Example:</strong> \\(X\sim N(500,8^2)\\) means mean 500 mL and standard deviation 8 mL—not 64 mL.</div>`);

// 5
A('u411-05','Model','Density','For a continuous model, probability is area','concept',`
<div class="u411-visual-layout">
  <article>
    <span class="u411-label">Three non-negotiable facts</span>
    <h2>Density is not probability at a point</h2>
    <div class="u411-checklist">
      <article><b>1</b><span>Total area under the curve is 1.</span></article>
      <article><b>2</b><span>Area over an interval is a probability.</span></article>
      <article><b>3</b><span>\\(P(X=x)=0\\) for every exact value x.</span></article>
    </div>
  </article>
  ${plot('point-zero',{mu:0,sd:1,boundary:0.65,label:'A vertical line has zero area'})}
</div>
<div class="u411-rule" style="margin-top:14px">Therefore \\(P(X&lt;40)=P(X\le 40)\\) in a continuous normal model.</div>`);

// 6
A('u411-06','Model','Symmetry','Mean, median, and mode meet at the centre','concept',`
<div class="u411-visual-layout">
  <article>
    <span class="u411-label">Symmetric density</span>
    <h2>Half the area lies on each side of \\(\mu\\)</h2>
    <p>For a normal distribution, \\(P(X&lt;\mu)=P(X&gt;\mu)=0.5\\).</p>
    <div class="u411-equation-chain"><span>mean</span><i>=</i><span>median</span><i>=</i><span>mode</span></div>
    <p class="u411-muted">Symmetry is also a powerful calculator check: equally distant boundaries from \\(\mu\\) create equal tail areas.</p>
  </article>
  ${plot('symmetry',{mu:68,sd:10,label:'Equal mirror areas'})}
</div>`);

// 7
A('u411-07','Model','Parameter effect','Changing \\(\mu\\) translates the curve','lab',`
${lab('parameters',{mode:'mu',mu:0,sd:1})}
<div class="u411-rule" style="margin-top:14px"><strong>Invariant:</strong> moving \\(\mu\\) changes location, not total area, symmetry, or the number of standard deviations represented by a given z-score.</div>`);

// 8
A('u411-08','Model','Parameter effect','Changing \\(\sigma\\) changes spread and peak height','lab',`
${lab('parameters',{mode:'sd',mu:0,sd:1})}
<div class="u411-two" style="margin-top:14px">
  <article class="u411-card teal"><h2>Larger \\(\sigma\\)</h2><p>Wider and lower, because the same total area 1 is spread farther.</p></article>
  <article class="u411-card maroon"><h2>Smaller \\(\sigma\\)</h2><p>Narrower and taller, because values cluster more tightly around \\(\mu\\).</p></article>
</div>`);

// 9
A('u411-09','Model','Units audit','Variance belongs in notation; standard deviation belongs in the calculator','concept',`
<div class="u411-misconception">
  <article class="wrong"><span class="u411-label">Incorrect</span><h2>Enter 64 as σ</h2><p>Reading \\(N(500,8^2)\\) and typing 64 into the calculator changes the model completely.</p></article>
  <i>→</i>
  <article class="right"><span class="u411-label">Correct</span><h2>Enter 8 as σ</h2><p>The second parameter in notation is variance; the normalcdf and invNorm fields ask for standard deviation.</p></article>
</div>
${plot('variance-audit',{mu:500,sd:8,altSd:64,label:'Correct σ=8 versus incorrect σ=64'})}`);

// 10
A('u411-10','Model','Model judgement','When is a normal model defensible?','concept',`
<div class="u411-three">
  <article class="u411-card teal"><span class="u411-symbol">✓</span><h2>Shape</h2><p>Roughly unimodal and symmetric, without severe skew or multiple clusters.</p></article>
  <article class="u411-card gold"><span class="u411-symbol">✓</span><h2>Context</h2><p>A continuous measurement for which extreme values on either side are plausible.</p></article>
  <article class="u411-card maroon"><span class="u411-symbol">!</span><h2>Evidence</h2><p>A graph, prior model, or stated assumption supports normality; the bell shape is not automatic.</p></article>
</div>
<div class="u411-warning" style="margin-top:16px"><strong>Model boundary:</strong> a normal distribution extends to \\(\pm\infty\\). For variables that cannot be negative, the model is reasonable only when the impossible tail is negligible for the intended use.</div>`);

// 11
A('u411-11','Probability','Region language','Translate words and inequalities into shaded regions','concept',`
<div class="u411-four">
  <article class="u411-card"><span class="u411-label">Lower tail</span><span class="u411-big">\\(P(X&lt;b)\\)</span><p>Shade left of b.</p></article>
  <article class="u411-card"><span class="u411-label">Upper tail</span><span class="u411-big">\\(P(X&gt;a)\\)</span><p>Shade right of a.</p></article>
  <article class="u411-card"><span class="u411-label">Between</span><span class="u411-big">\\(P(a&lt;X&lt;b)\\)</span><p>Shade from a to b.</p></article>
  <article class="u411-card"><span class="u411-label">Outside</span><span class="u411-big">\\(P(X&lt;a\text{ or }X&gt;b)\\)</span><p>Shade both tails.</p></article>
</div>
${plot('regions',{mu:0,sd:1,label:'Four probability regions'})}`);

// 12
A('u411-12','Probability','Lower tail','normalcdf needs a lower and an upper bound','concept',`
${keyRoute(['2nd','VARS','2:normalcdf('])}
<div class="u411-ti-fields" style="margin-top:18px">
  <article><span>Lower</span><b>−1E99</b></article>
  <article><span>Upper</span><b>b</b></article>
  <article><span>μ</span><b>model mean</b></article>
  <article><span>σ</span><b>model SD</b></article>
</div>
<div class="u411-evidence" style="margin-top:16px"><strong>Portable command:</strong> normalcdf(−1E99, b, μ, σ)</div>
<div class="u411-ti-note" style="margin-top:14px">−1E99 is the calculator's practical stand-in for negative infinity. It is not a data value.</div>`);

// 13
A('u411-13','Probability','Worked example','Lower-tail probability in context','worked',`
${worked(
`Morning commute time is modelled by \\(X\sim N(32,6^2)\\). Find \\(P(X&lt;40)\\).`,
[
`Sketch a boundary at 40 and shade left. Since \\(40&gt;32\\), the answer must exceed 0.5.`,
`Enter <b>normalcdf(−1E99,40,32,6)</b>.`,
`The calculator gives \\(P(X&lt;40)\approx ${U.fmt(U.cdf(40,32,6),5)}\\).`,
`Round only after the full-precision calculation.`
],
`Approximately ${U.pct(U.cdf(40,32,6),2)} of morning commutes are shorter than 40 minutes under this model.`,
plot('lower',{mu:32,sd:6,upper:40,label:'P(X < 40)'})
)}
<div class="u411-ti-actions">${tiButton('Try this in the verified TI‑84 coach','normalcdf')}</div>`);

// 14
A('u411-14','Probability','Student turn','Build a lower-tail calculation','activity',`
${turn(
`Bottle volume follows \\(V\sim N(500,8^2)\\). Find \\(P(V&lt;492)\\), showing the command and interpretation.`,
`u411-lower-turn`,
`<p>Sketch left of 492. Enter <b>normalcdf(−1E99,492,500,8)</b>.</p>
<p>\\(P(V&lt;492)\approx ${U.fmt(U.cdf(492,500,8),5)}\\).</p>
<p>About ${U.pct(U.cdf(492,500,8),2)} of bottles are expected to contain less than 492 mL according to the model.</p>`,
plot('lower',{mu:500,sd:8,upper:492,label:'P(V < 492)'})
)}
`);

// 15
A('u411-15','Probability','Upper tail','Use the right region—or use a complement','concept',`
<div class="u411-two">
  <article class="u411-card teal">
    <span class="u411-label">Direct bounds</span>
    <h2>normalcdf(a, 1E99, μ, σ)</h2>
    <p>The lower bound is a; the upper bound stands for positive infinity.</p>
  </article>
  <article class="u411-card maroon">
    <span class="u411-label">Complement</span>
    <h2>\\(1-P(X\le a)\\)</h2>
    <p>Equivalent, but subtracting a value extremely close to 1 can lose displayed precision.</p>
  </article>
</div>
${plot('upper',{mu:0,sd:1,lower:1.15,label:'Upper-tail area'})}
<div class="u411-rule" style="margin-top:14px">For a boundary above the mean, an upper-tail probability should be less than 0.5.</div>`);

// 16
A('u411-16','Probability','Worked example','Upper-tail probability without a tail mix-up','worked',`
${worked(
`For \\(X\sim N(32,6^2)\\), find the probability that a commute exceeds 43 minutes.`,
[
`The wording “exceeds” means shade right of 43.`,
`Enter <b>normalcdf(43,1E99,32,6)</b>.`,
`The output is \\(${U.fmt(U.sf(43,32,6),6)}\\).`,
`A quick z-check gives \\(z=(43-32)/6\approx1.83\\), so a small right tail is sensible.`
],
`The model predicts that approximately ${U.pct(U.sf(43,32,6),2)} of commutes exceed 43 minutes.`,
plot('upper',{mu:32,sd:6,lower:43,label:'P(X > 43)'})
)}
`);
})();
