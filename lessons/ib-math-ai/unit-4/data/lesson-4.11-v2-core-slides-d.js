(function(){
'use strict';
const B=window.U411_CORE;if(!B)return;
const {U,D,A,plot,lab,tiButton,worked,turn,cards,keyRoute,screen,reveal}=B;

// 49
A('u411-49','Quantiles','Student turn','Build a central interval from two cumulative areas','activity',`
${(()=>{const c=U.central(.80,11.5,1.2);return turn(
`Battery life is \\(B\sim N(11.5,1.2^2)\\). Find the interval containing the middle 80%.`,
'u411-central-turn',
`<p>Each tail has area \\((1-0.80)/2=0.10\\).</p>
<p>Lower: <b>invNorm(0.10,11.5,1.2)</b> \\(\approx ${U.fmt(c.lo,4)}\\).</p>
<p>Upper: <b>invNorm(0.90,11.5,1.2)</b> \\(\approx ${U.fmt(c.hi,4)}\\).</p>
<p>The middle 80% is approximately ${U.fmt(c.lo,2)} to ${U.fmt(c.hi,2)} hours.</p>`,
plot('central',{mu:11.5,sd:1.2,area:.80,label:'Central 80% interval'})
)})()}
`);

// 50
A('u411-50','Quantiles','Live investigation','Convert percentile, top-tail, and central-area language','lab',`
${lab('quantile',{mu:68,sd:10,mode:'percentile',area:.82})}
<div class="u411-rule" style="margin-top:14px"><strong>Read the diagram before the answer:</strong> a percentile has one boundary; a central interval has two symmetric boundaries; a top-tail request must first be converted to left area.</div>`);

// 51
A('u411-51','Quantiles','TI‑84 versions','LEFT, CENTER, and RIGHT are optional conveniences','concept',`
<div class="u411-three">
  <article class="u411-card teal"><span class="u411-label">LEFT</span><h2>Area from \\(−\infty\\) to x</h2><p>This is the traditional cumulative interpretation and the most portable input style.</p></article>
  <article class="u411-card gold"><span class="u411-label">CENTER</span><h2>Symmetric central area</h2><p>On supported OS versions, this can return a positive half-width for a central region.</p></article>
  <article class="u411-card maroon"><span class="u411-label">RIGHT</span><h2>Area from x to \\(+\infty\\)</h2><p>On supported OS versions, this can accept the right-tail area directly.</p></article>
</div>
<div class="u411-ti-note" style="margin-top:15px"><strong>Exam-safe habit:</strong> convert every request to a lower-tail cumulative area first. Then the setup works across calculator versions and is easy to justify on paper.</div>`);

// 52
A('u411-52','Quantiles','Reasonableness','Quantiles must preserve order and symmetry','checkpoint',`
<div class="u411-four">
  <article class="u411-card"><span class="u411-big">p &lt; 0.5</span><p>The quantile lies below \\(\mu\\).</p></article>
  <article class="u411-card"><span class="u411-big">p = 0.5</span><p>The quantile equals \\(\mu\\).</p></article>
  <article class="u411-card"><span class="u411-big">p &gt; 0.5</span><p>The quantile lies above \\(\mu\\).</p></article>
  <article class="u411-card"><span class="u411-big">p₁ &lt; p₂</span><p>Then \\(x_{p_1}&lt;x_{p_2}\\).</p></article>
</div>
<div class="u411-rule" style="margin-top:15px">Mirror check: \\(x_p+x_{1-p}=2\mu\\). For example, the 10th and 90th percentiles are equally far from the mean.</div>`);

// 53
A('u411-53','Parameters','Inverse modelling','Use a known quantile to solve for the mean or SD','lab',`
${lab('parameter-solver',{solve:'mean',x:74,p:.84,mu:66,sd:8})}
<div class="u411-formula" style="margin-top:15px">
  <b>\\(x_p=\mu+z_p\sigma\\)</b>
  <p>Once the standard-normal quantile \\(z_p\\) is known, this is a linear equation in the missing parameter.</p>
</div>`);

// 54
A('u411-54','Parameters','Worked example','Find an unknown mean from one percentile','worked',`
${(()=>{const p=.84,x=74,sd=8,z=U.inv(p),mu=U.solveMean(x,p,sd);return worked(
`A normal variable has standard deviation 8 and \\(P(X&lt;74)=0.84\\). Find \\(\mu\\).`,
[
`Find the standard-normal quantile: \\(z_{0.84}=\text{invNorm}(0.84,0,1)\approx ${U.fmt(z,6)}\\).`,
`Use \\(x=\mu+z\sigma\\): \\(74=\mu+(${U.fmt(z,6)})(8)\\).`,
`Therefore \\(\mu\approx ${U.fmt(mu,5)}\\).`,
`Verify with normalcdf: \\(P(X&lt;74)=${U.fmt(U.cdf(74,mu,8),6)}\\).`
],
`The model mean is approximately ${U.fmt(mu,2)} units.`,
plot('percentile',{mu,sd:8,area:.84,label:'Known 84th-percentile boundary x=74'})
)})()}
`);

// 55
A('u411-55','Parameters','Worked example','Find an unknown standard deviation','worked',`
${(()=>{const p=.90,x=62,mu=50,z=U.inv(p),sd=U.solveSd(x,p,mu);return worked(
`A normal variable has mean 50 and \\(P(X&lt;62)=0.90\\). Find \\(\sigma\\).`,
[
`\\(z_{0.90}=\text{invNorm}(0.90,0,1)\approx ${U.fmt(z,6)}\\).`,
`Use \\(62=50+z\sigma\\).`,
`\\(\sigma=(62-50)/${U.fmt(z,6)}\approx ${U.fmt(sd,5)}\\).`,
`The result is positive and places 62 above the mean, consistent with p=0.90.`
],
`The standard deviation is approximately ${U.fmt(sd,2)} units.`,
plot('percentile',{mu,sd,area:.90,label:'Known 90th-percentile boundary x=62'})
)})()}
`);

// 56
A('u411-56','Parameters','Student turn','Solve, then verify the recovered model','activity',`
${(()=>{const p=.25,x=18,sd=4,z=U.inv(p),mu=U.solveMean(x,p,sd);return turn(
`A normal variable has \\(\sigma=4\\) and its 25th percentile is 18. Find \\(\mu\\).`,
'u411-parameter-turn',
`<p>\\(z_{0.25}\approx ${U.fmt(z,6)}\\).</p>
<p>\\(18=\mu+(${U.fmt(z,6)})(4)\\), so \\(\mu\approx ${U.fmt(mu,5)}\\).</p>
<p>Verification: normalcdf(−1E99,18,${U.fmt(mu,8)},4) \\(\approx ${U.fmt(U.cdf(18,mu,4),6)}\\).</p>`,
plot('percentile',{mu,sd:4,area:.25,label:'25th percentile fixed at 18'})
)})()}
`);

// 57
A('u411-57','Parameters','IB challenge','Two quantiles determine both \\(\mu\\) and \\(\sigma\\)','worked',`
${(()=>{const r=U.solveTwo(48,.10,72,.90);return worked(
`A normal variable has 10th percentile 48 and 90th percentile 72. Find \\(\mu\\) and \\(\sigma\\).`,
[
`The cumulative z-values are \\(z_{0.10}\approx ${U.fmt(r.z1,6)}\\) and \\(z_{0.90}\approx ${U.fmt(r.z2,6)}\\).`,
`Write \\(48=\mu+z_{0.10}\sigma\\) and \\(72=\mu+z_{0.90}\sigma\\).`,
`Subtract: \\(24=(z_{0.90}-z_{0.10})\sigma\\), giving \\(\sigma\approx ${U.fmt(r.sd,5)}\\).`,
`Then \\(\mu=48-z_{0.10}\sigma=60\\). Symmetry also reveals the midpoint 60 immediately.`
],
`The recovered model is approximately \\(N(60,${U.fmt(r.sd,4)}^2)\\).`,
plot('two-quantiles',{mu:r.mu,sd:r.sd,p1:.10,p2:.90,label:'10th and 90th percentiles'})
)})()}
`);

// 58
A('u411-58','Applications','Expected frequency','Probability scales to an expected count','concept',`
<div class="u411-formula">
  <span class="u411-label" style="color:#cfe2e8">For n comparable observations</span>
  <b>\\(\text{expected count}=n\times P(\text{event})\\)</b>
  <p>This is a long-run/model expectation, not a guarantee that the observed count will equal it.</p>
</div>
<div class="u411-two" style="margin-top:15px">
  <article class="u411-card teal"><h2>Keep probability unrounded</h2><p>Multiply n by the calculator probability before rounding the count.</p></article>
  <article class="u411-card maroon"><h2>Interpret whole items sensibly</h2><p>“About 17 bottles” is an interpretation; the expected value itself may be 16.7.</p></article>
</div>`);

// 59
A('u411-59','Applications','Worked example','Expected number outside specification limits','worked',`
${(()=>{const p=1-U.prob(486,514,500,8),e=240*p;return worked(
`Bottle volume is \\(V\sim N(500,8^2)\\). In a batch of 240 bottles, how many are expected outside 486–514 mL?`,
[
`Find the outside probability: \\(1-P(486&lt;V&lt;514)\\).`,
`\\(p=1-\text{normalcdf}(486,514,500,8)\approx ${U.fmt(p,7)}\\).`,
`Expected count: \\(240p\approx ${U.fmt(e,5)}\\).`,
`Report a contextual approximation, not a certainty.`
],
`Approximately ${Math.round(e)} bottles are expected to fall outside the specified interval.`,
plot('outside',{mu:500,sd:8,lower:486,upper:514,label:'Outside specification limits'})
)})()}
`);

// 60
A('u411-60','Applications','Decision thresholds','Rounding a cut score depends on what values are possible','concept',`
<div class="u411-two">
  <article class="u411-card blue">
    <span class="u411-label">Continuous measurement</span>
    <h2>Keep a decimal threshold</h2>
    <p>If a sensor cut is ${U.fmt(U.inv(.90,68,10),3)}, report to the justified measurement precision.</p>
  </article>
  <article class="u411-card good">
    <span class="u411-label">Integer score</span>
    <h2>Use directional rounding</h2>
    <p>If “at least the top 10%” begins above ${U.fmt(U.inv(.90,68,10),3)}, the first possible whole score is ${Math.ceil(U.inv(.90,68,10))}.</p>
  </article>
</div>
<div class="u411-warning" style="margin-top:15px">Do not automatically round to the nearest integer. A minimum, maximum, at-least, or at-most condition determines the direction.</div>`);

// 61
A('u411-61','Exam synthesis','Complete model','One context, three normal-distribution decisions','worked',`
${(()=>{const p=U.prob(24,35,28,4.5),cut=U.inv(.92,28,4.5),late=U.sf(35,28,4.5),e=600*late;return `
<div class="u411-table-wrap"><table class="u411-table">
<thead><tr><th>Part</th><th>Mathematical translation</th><th>Calculator evidence</th><th>Interpretation</th></tr></thead>
<tbody>
<tr><th>Between 24 and 35 min</th><td>\\(P(24&lt;X&lt;35)\\)</td><td>normalcdf(24,35,28,4.5) = ${U.fmt(p,5)}</td><td>${U.pct(p,2)} of deliveries</td></tr>
<tr><th>Slowest 8% threshold</th><td>left area = 0.92</td><td>invNorm(0.92,28,4.5) = ${U.fmt(cut,4)}</td><td>about ${U.fmt(cut,1)} min</td></tr>
<tr><th>Expected over 35 min in 600</th><td>\\(600P(X&gt;35)\\)</td><td>600·${U.fmt(late,7)} = ${U.fmt(e,4)}</td><td>about ${Math.round(e)} deliveries</td></tr>
</tbody></table></div>
<div class="u411-success" style="margin-top:15px"><strong>Structure:</strong> sketch → translate → calculate → check → interpret. Every part uses the same model \\(X\sim N(28,4.5^2)\\).</div>
${plot('between',{mu:28,sd:4.5,lower:24,upper:35,label:'Part (a): delivery interval'})}`})()}
`);

// 62
A('u411-62','Exam synthesis','Student task','Original IB-style multi-part response','activity',`
${(()=>{const p=U.cdf(238,250,12),cut=U.inv(.97,250,12),central=U.central(.94,250,12);return turn(
`Package mass is modelled by \\(M\sim N(250,12^2)\\). (a) Find \\(P(M&lt;238)\\). (b) Find the mass exceeded by 3% of packages. (c) Find the middle 94% interval. (d) State one model limitation.`,
'u411-ib-task',
`<ol>
<li><b>(a)</b> normalcdf(−1E99,238,250,12) = \\(${U.fmt(p,5)}\\).</li>
<li><b>(b)</b> Right tail 0.03 means left area 0.97. invNorm(0.97,250,12) = \\(${U.fmt(cut,4)}\\) g.</li>
<li><b>(c)</b> Each tail is 0.03, so the middle interval is approximately \\(${U.fmt(central.lo,3)}&lt;M&lt;${U.fmt(central.hi,3)}\\) g.</li>
<li><b>(d)</b> The normal model assumes an approximately symmetric continuous distribution and extends to impossible extreme values; evidence should support its use in the relevant range.</li>
</ol>`,
plot('percentile',{mu:250,sd:12,area:.97,label:'Part (b): 97th percentile'})
)})()}
`);

// 63
A('u411-63','Mastery','Error-proofing','The seven checks that protect most marks','checkpoint',`
<div class="u411-checklist">
  <article><b>1</b><span>Did I identify whether x or area is known?</span></article>
  <article><b>2</b><span>Did I sketch the correct tail, interval, or two-tail region?</span></article>
  <article><b>3</b><span>Did I use \\(\sigma\\), not \\(\sigma^2\\), in the calculator?</span></article>
  <article><b>4</b><span>Do lower and upper bounds appear in increasing order?</span></article>
  <article><b>5</b><span>For top p%, did I convert to left area \\(1-p\\)?</span></article>
  <article><b>6</b><span>For a central interval, did I split the remainder into two equal tails?</span></article>
  <article><b>7</b><span>Did I preserve precision and finish with context and units?</span></article>
</div>`);

// 64
A('u411-64','Mastery','Exit ticket','From bell curve to defensible conclusion','summary',`
<div class="u411-exit">
  <article><span class="u411-label">Explain</span><h2>Why is \\(P(X=x)=0\\)?</h2><p>Use area and zero interval width.</p></article>
  <article><span class="u411-label">Calculate</span><h2>Write one normalcdf command</h2><p>Include bounds, mean, and standard deviation.</p></article>
  <article><span class="u411-label">Reverse</span><h2>Convert top 7% to invNorm area</h2><p>The portable lower-tail input is 0.93.</p></article>
</div>
${turn(
`Final reflection: describe the full workflow for a normal-distribution question in one precise paragraph.`,
'u411-exit',
`<p>I identify the model and units, sketch the requested region, decide whether the task is probability or inverse probability, enter normalcdf or invNorm with consistent bounds and parameters, check the answer using symmetry/z-position, retain full precision, and interpret the rounded result in context.</p>`
)}
<div class="u411-ti-actions" style="margin-top:15px">${tiButton('Reopen the verified TI‑84 coach','normalcdf')}<button class="u411-ti-button secondary" type="button" data-route-jump="practice">Continue to Practice Studio</button></div>
`);
})();
