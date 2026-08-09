(function(){
'use strict';
const B=window.U411_CORE;if(!B)return;
const {U,D,A,plot,lab,tiButton,worked,turn,cards,keyRoute,screen,reveal}=B;

// 17
A('u411-17','Probability','Student turn','Upper-tail command and interpretation','activity',`
${turn(
`Device battery life is \\(B\sim N(11.5,1.2^2)\\). Find \\(P(B&gt;13)\\).`,
'u411-upper-turn',
`<p>“More than 13” is the right tail.</p>
<p><b>normalcdf(13,1E99,11.5,1.2)</b> gives \\(${U.fmt(U.sf(13,11.5,1.2),6)}\\).</p>
<p>Approximately ${U.pct(U.sf(13,11.5,1.2),2)} of devices are modelled to last more than 13 hours.</p>`,
plot('upper',{mu:11.5,sd:1.2,lower:13,label:'P(B > 13)'})
)}
`);

// 18
A('u411-18','Probability','Live investigation','Move the bounds; watch the command and area agree','lab',`
${lab('probability',{mu:500,sd:8,mode:'between',lower:492,upper:510})}
<div class="u411-rule" style="margin-top:14px"><strong>Visual audit:</strong> the command's first number must be the left boundary and its second number the right boundary. The shaded curve should match both.</div>`);

// 19
A('u411-19','Probability','Worked example','Probability between two values','worked',`
${worked(
`Bottle fill volume follows \\(V\sim N(500,8^2)\\). Find \\(P(492&lt;V&lt;510)\\).`,
[
`Shade only the interval from 492 to 510.`,
`Enter <b>normalcdf(492,510,500,8)</b>.`,
`The probability is \\(${U.fmt(U.prob(492,510,500,8),6)}\\).`,
`The bounds are not symmetric about 500, so do not double one side.`
],
`About ${U.pct(U.prob(492,510,500,8),2)} of bottles are modelled to have a volume between 492 mL and 510 mL.`,
plot('between',{mu:500,sd:8,lower:492,upper:510,label:'P(492 < V < 510)'})
)}
`);

// 20
A('u411-20','Probability','Student turn','Interval probability with units','activity',`
${turn(
`Student height is modelled by \\(H\sim N(172,7^2)\\). Find \\(P(165&lt;H&lt;180)\\).`,
'u411-between-turn',
`<p>Enter <b>normalcdf(165,180,172,7)</b>.</p>
<p>\\(P(165&lt;H&lt;180)\approx ${U.fmt(U.prob(165,180,172,7),6)}\\).</p>
<p>Approximately ${U.pct(U.prob(165,180,172,7),2)} of students are modelled to have heights between 165 cm and 180 cm.</p>`,
plot('between',{mu:172,sd:7,lower:165,upper:180,label:'P(165 < H < 180)'})
)}
`);

// 21
A('u411-21','Probability','Two tails','Outside an interval: two equivalent structures','concept',`
<div class="u411-two">
  <article class="u411-card teal">
    <span class="u411-label">Complement route</span>
    <h2>\\(1-P(a&lt;X&lt;b)\\)</h2>
    <p>Usually the fastest route when the middle interval is simple.</p>
    <div class="u411-evidence">1 − normalcdf(a,b,μ,σ)</div>
  </article>
  <article class="u411-card maroon">
    <span class="u411-label">Add the tails</span>
    <h2>\\(P(X&lt;a)+P(X&gt;b)\\)</h2>
    <p>Best when each tail has a separate contextual meaning.</p>
    <div class="u411-evidence">normalcdf(−1E99,a,μ,σ) + normalcdf(b,1E99,μ,σ)</div>
  </article>
</div>
${plot('outside',{mu:0,sd:1,lower:-1.2,upper:1.6,label:'Outside is the union of two disjoint tails'})}`);

// 22
A('u411-22','Probability','Student turn','Calculate and explain a two-tail event','activity',`
${turn(
`Assessment scores satisfy \\(S\sim N(68,10^2)\\). Find \\(P(S&lt;50\text{ or }S&gt;86)\\).`,
'u411-outside-turn',
`<p>The bounds are equally distant from 68, so the two tails are equal.</p>
<p>Using the complement: \\(1-\text{normalcdf}(50,86,68,10)=${U.fmt(1-U.prob(50,86,68,10),6)}\\).</p>
<p>Approximately ${U.pct(1-U.prob(50,86,68,10),2)} of scores lie outside 50 to 86 under the model.</p>`,
plot('outside',{mu:68,sd:10,lower:50,upper:86,label:'P(S < 50 or S > 86)'})
)}
`);

// 23
A('u411-23','Reasoning','Standardization','A z-score measures signed distance in standard deviations','concept',`
<div class="u411-formula">
  <span class="u411-label" style="color:#cfe2e8">Standardize a raw value</span>
  <b>\\(z=\dfrac{x-\mu}{\sigma}\\)</b>
  <p>z is unit-free: positive means above the mean; negative means below the mean.</p>
</div>
<div class="u411-three" style="margin-top:16px">
  <article class="u411-card teal"><span class="u411-big">z = 0</span><p>Exactly at the mean.</p></article>
  <article class="u411-card gold"><span class="u411-big">z = 1.5</span><p>1.5 standard deviations above the mean.</p></article>
  <article class="u411-card maroon"><span class="u411-big">z = −2</span><p>2 standard deviations below the mean.</p></article>
</div>`);

// 24
A('u411-24','Reasoning','Worked example','Use z to predict the size of an answer','worked',`
${worked(
`For \\(X\sim N(32,6^2)\\), interpret the position of 40 and verify \\(P(X&lt;40)\\).`,
[
`Standardize: \\(z=(40-32)/6=1.333\ldots\\).`,
`A boundary 1.33 SD above the mean leaves most area to its left, so the answer should be well above 0.5.`,
`Either use <b>normalcdf(−1E99,40,32,6)</b> or <b>normalcdf(−1E99,1.333…,0,1)</b>.`,
`Both give \\(${U.fmt(U.cdf(40,32,6),6)}\\), apart from premature rounding of z.`
],
`The z-score is a reasoning bridge and an audit; the calculator can still use the original units directly.`,
plot('z-map',{mu:32,sd:6,boundary:40,label:'x=40 maps to z=1.333…'})
)}
`);

// 25
A('u411-25','Reasoning','Invariant area','Equal z-scores create equal cumulative probabilities','concept',`
<div class="u411-compare">
  <article class="u411-card blue">
    <span class="u411-label">Commute model</span>
    <h2>\\(X\sim N(32,6^2)\\)</h2>
    <p>\\(x=41\\) gives \\(z=1.5\\).</p>
    <span class="u411-big">\\(P(X&lt;41)=${U.fmt(U.cdf(41,32,6),4)}\\)</span>
  </article>
  <article class="u411-card good">
    <span class="u411-label">Score model</span>
    <h2>\\(S\sim N(68,10^2)\\)</h2>
    <p>\\(s=83\\) also gives \\(z=1.5\\).</p>
    <span class="u411-big">\\(P(S&lt;83)=${U.fmt(U.cdf(83,68,10),4)}\\)</span>
  </article>
</div>
${plot('equal-z',{pairs:[{mu:32,sd:6,x:41},{mu:68,sd:10,x:83}],label:'Same standardized location, same area'})}`);

// 26
A('u411-26','Reasoning','Reasonableness','The 68–95–99.7 rule is an estimate, not a replacement','concept',`
${plot('empirical',{mu:0,sd:1,label:'Approximate central areas'})}
<div class="u411-three" style="margin-top:14px">
  <article class="u411-card teal"><span class="u411-big">≈ 68%</span><p>within \\(\mu\pm\sigma\\)</p></article>
  <article class="u411-card gold"><span class="u411-big">≈ 95%</span><p>within \\(\mu\pm2\sigma\\)</p></article>
  <article class="u411-card maroon"><span class="u411-big">≈ 99.7%</span><p>within \\(\mu\pm3\sigma\\)</p></article>
</div>
<div class="u411-warning" style="margin-top:14px">Use these values to detect impossible calculator output. Use normalcdf for the requested accurate probability.</div>`);

// 27
A('u411-27','Reasoning','Misconception repair','Curve height is density, not interval probability','concept',`
<div class="u411-misconception">
  <article class="wrong"><span class="u411-label">Wrong inference</span><h2>“The curve is high at x, so P(X=x) is high.”</h2><p>A point has zero width and therefore zero area in a continuous model.</p></article>
  <i>→</i>
  <article class="right"><span class="u411-label">Correct inference</span><h2>“Intervals near the centre can have more area.”</h2><p>Probability comes from integrating density over a non-zero interval.</p></article>
</div>
${plot('density-v-area',{mu:0,sd:1,lower:-.25,upper:.25,label:'Height and shaded area are different quantities'})}`);

// 28
A('u411-28','Reasoning','Input audit','Never mix raw x-bounds with the standard-normal parameters','concept',`
<div class="u411-two">
  <article class="u411-card good">
    <span class="u411-label">Raw-value route</span>
    <h2>normalcdf(40,1E99,32,6)</h2>
    <p>Bounds are in minutes, so use the original mean and SD.</p>
  </article>
  <article class="u411-card good">
    <span class="u411-label">Standardized route</span>
    <h2>normalcdf(1.333…,1E99,0,1)</h2>
    <p>Bounds are z-scores, so use mean 0 and SD 1.</p>
  </article>
</div>
<div class="u411-warning" style="margin-top:15px"><strong>Invalid hybrid:</strong> normalcdf(40,1E99,0,1). The units and parameters no longer describe the same variable.</div>`);

// 29
A('u411-29','Reasoning','Precision','Carry full precision; round the final reported result','concept',`
<div class="u411-three">
  <article class="u411-card maroon"><span class="u411-symbol">1</span><h2>Store exact inputs</h2><p>Enter the given \\(\mu,\sigma\\), bounds, and areas without unnecessary rounding.</p></article>
  <article class="u411-card teal"><span class="u411-symbol">2</span><h2>Keep calculator digits</h2><p>Do not round z or an intermediate quantile before the next calculation.</p></article>
  <article class="u411-card gold"><span class="u411-symbol">3</span><h2>Round in context</h2><p>Probability: often 3 s.f. or stated precision. People/items: use a sensible whole-number interpretation.</p></article>
</div>
<div class="u411-evidence" style="margin-top:15px"><strong>Evidence line:</strong> command → full output → final rounded statement with units/context.</div>`);

// 30
A('u411-30','Reasoning','Checkpoint','Four fast audits before moving on','checkpoint',`
${turn(
`Answer without a calculator first; then reveal the audit.`,
'u411-prob-checkpoint',
`<ol>
<li>\\(P(X&lt;\mu)=0.5\\).</li>
<li>If \\(b&gt;\mu\\), then \\(P(X&lt;b)&gt;0.5\\).</li>
<li>For a continuous model, \\(P(X&lt;a)=P(X\le a)\\).</li>
<li>To find an outside probability, use two tails or 1 minus the middle.</li>
</ol>`,
`<div class="u411-checks">
<article class="u411-card"><h2>1</h2><p>What is \\(P(X&lt;\mu)\\)?</p></article>
<article class="u411-card"><h2>2</h2><p>Is a lower tail at \\(b&gt;\mu\\) above or below 0.5?</p></article>
<article class="u411-card"><h2>3</h2><p>Does including one endpoint matter?</p></article>
</div>`
)}
`);

// 31
A('u411-31','Technology','TI‑84 map','The three distribution tools you actually need','concept',`
${keyRoute(['2nd','VARS','DISTR'])}
<div class="u411-three" style="margin-top:18px">
  <article class="u411-card teal"><span class="u411-label">2: normalcdf</span><h2>Area between bounds</h2><p>Probability when x-values are known.</p></article>
  <article class="u411-card maroon"><span class="u411-label">3: invNorm</span><h2>Boundary from area</h2><p>Percentile, cut score, or central interval.</p></article>
  <article class="u411-card gold"><span class="u411-label">DRAW: ShadeNorm</span><h2>Visual verification</h2><p>Draw the curve and shaded interval to catch a tail error.</p></article>
</div>
<div class="u411-ti-actions" style="margin-top:16px">${tiButton('Open local TI‑84 normal-distribution coach','normalcdf')}<button class="u411-ti-button secondary" type="button" data-open-ti84>Open full TI‑84 simulator</button></div>`);

// 32
A('u411-32','Technology','normalcdf wizard','Every field has a mathematical meaning','concept',`
<div class="u411-ti-fields">
  <article><span>Lower bound</span><b>left edge</b></article>
  <article><span>Upper bound</span><b>right edge</b></article>
  <article><span>μ</span><b>population mean</b></article>
  <article><span>σ</span><b>population SD</b></article>
</div>
${screen([
'normalcdf',
'lower: 492',
'upper: 510',
'μ: 500',
'σ: 8',
'Paste → normalcdf(492,510,500,8)',
`Ans = ${U.fmt(U.prob(492,510,500,8),10)}`
])}
<div class="u411-rule" style="margin-top:15px"><strong>Wizard or typed syntax:</strong> both are valid. The statistical model, bounds, and interpretation must agree.</div>`);
})();
