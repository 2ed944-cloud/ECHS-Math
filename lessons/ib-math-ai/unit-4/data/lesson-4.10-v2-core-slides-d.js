(function(){
'use strict';
const B=window.U410_CORE;if(!B)return;
const {U,D,plot,lab,turn,worked,formula,cards,note,reveal,A}=B;

A('explorer','Investigation','Connect parameters, shape, event, and calculator syntax','Distribution explorer','lab',`${lab('explorer')}<div class="callout"><b>Investigation</b><p>Hold n fixed and vary p; then hold the mean approximately fixed while changing n and p. Record what changes and what does not.</p></div>`);

A('simulation','Investigation','Exact probability predicts long-run frequency','Repeated-sample simulation','lab',`${lab('simulation')}<div class="callout warning"><b>Simulation is evidence, not the definition.</b><p>A short run fluctuates. The exact binomial distribution remains the theoretical benchmark when BINS holds.</p></div>`);

A('long-run','Investigation','Sampling variability shrinks relative to the number of repetitions','Probability versus empirical frequency','reasoning',`
<div class="u410-two-column"><article><span>Theoretical</span><h2>Fixed probability</h2><p>For \\(X\\sim B(12,.72)\\), \\(P(X=9)=${U.fmt(U.pmf(12,.72,9),5)}\\).</p></article><article class="accent"><span>Empirical</span><h2>Random relative frequency</h2><p>In R simulated groups, the fraction with X=9 changes from run to run but tends to settle near the theoretical value as R grows.</p></article></div>${plot('convergence')}`);

A('recover-parameters','Investigation','Mean and variance can reveal n and p','Recover a hidden binomial model','reasoning',`
<div class="u410-formula-hero"><span>Given \\(\\mu=np\\) and \\(v=np(1-p)\\)</span><b>\\[p=1-\\frac{v}{\\mu},\\qquad n=\\frac{\\mu}{p}\\]</b></div>${worked('A binomial variable has mean 9.6 and variance 5.76. Recover n and p.',['\\(p=1-5.76/9.6=0.40\\).','\\(n=9.6/.40=24\\), an integer.','Therefore \\(X\\sim B(24,.40)\\).'],'Always verify 0<p≤1 and integer n before accepting the recovered model.')}`);

A('recover-lab','Investigation','Not every pair of moments is binomial-compatible','Moment recovery lab','lab',`${lab('recover')}<div class="callout"><b>Validity gate</b><p>A positive mean alone is insufficient. The recovered p must lie in (0,1] and n must be a non-negative integer.</p></div>`);

A('threshold','Investigation','Repeated opportunities can make a rare event likely','At-least-one threshold','worked',worked(
 'Each independent inspection detects a rare fault with probability 0.08. Find the smallest n such that the probability of at least one detection is at least 0.95.',
 ['Write \\(1-(.92)^n\\ge.95\\).','Equivalently, \\((.92)^n\\le.05\\).','Using logarithms, \\(n\\ge\\ln(.05)/\\ln(.92)\\).',`The smallest integer is \\(n=${U.thresholdAtLeastOne(.08,.95)}\\).`,`Verify n−1 fails and n succeeds.`],
 'A threshold question needs the first integer that meets the target, not a rounded decimal solution.',plot('threshold')));

A('threshold-lab','Investigation','Verify minimality numerically','Repeated-trial threshold lab','lab',`${lab('threshold')}<div class="callout warning"><b>Integer audit</b><p>Check both \\(n-1\\) and \\(n\\). Rounding a logarithmic answer to the nearest integer can select a value that does not meet the target.</p></div>`);

A('reliability','Applications','System reliability is a binomial count when components act independently','Reliability modelling','worked',worked(
 'Eight independent modules each work with probability 0.92. Find the probability that at least seven work.',
 ['Let X be the number that work: \\(X\\sim B(8,.92)\\).','Translate: \\(P(X\\ge7)=1-P(X\\le6)\\).',`Calculate: ${U.fmt(U.event(8,.92,'atLeast',7),7)}.`],
 `The probability that at least seven of the eight modules work is approximately ${U.fmt(U.event(8,.92,'atLeast',7),4)}.`,plot('reliability')));

A('quality-control','Applications','Rare defect counts are discrete and right-skewed','Quality control','worked',worked(
 'Twenty independent sensors have defect probability 0.04. Find the probability of at most one defective sensor.',
 ['Let X be the number defective: \\(X\\sim B(20,.04)\\).','Use \\(P(X\\le1)=\\operatorname{binomcdf}(20,.04,1)\\).',`Result: ${U.fmt(U.cdf(20,.04,1),7)}.`],
 'The result applies only if the historical p and independence assumptions remain credible.',plot('quality-control')));

A('finite-approximation','Applications','Use an approximation label and quantify the sampling fraction','Without-replacement approximation','reasoning',`
<div class="u410-finite-audit"><article><span>Population</span><b>N=800</b></article><article><span>Sample</span><b>n=20</b></article><article><span>Fraction</span><b>2.5%</b></article><article><span>Decision</span><b>Approximation plausible</b></article></div>${turn('A sample of 60 is drawn without replacement from a population of 300. Is a binomial approximation automatically justified by the 10% guideline?','finite-turn','No. The sampling fraction is 20%, which exceeds the common 10% guideline; dependence and changing p are too substantial for that shortcut.')}`);

A('assumption-audit','Applications','Software returns a number even when assumptions fail','Model audit before output','audit',`${plot('assumption-audit')}<div class="u410-audit-list"><label><input type="checkbox"><span>Success/failure is defined before analysis.</span></label><label><input type="checkbox"><span>Trials or sampled units are plausibly independent.</span></label><label><input type="checkbox"><span>The number of trials is fixed.</span></label><label><input type="checkbox"><span>A common p is plausible.</span></label><label><input type="checkbox"><span>The event boundary matches the words.</span></label></div>`);

A('communication','Applications','A probability answer needs a mathematical sentence and a contextual sentence','IB-ready communication','concept',`
<div class="u410-response-chain"><article><b>1</b><span>Define X</span><p>Number of successes in n trials.</p></article><article><b>2</b><span>State model</span><p>\\(X\\sim B(n,p)\\), with assumptions.</p></article><article><b>3</b><span>Translate</span><p>Write the event using inequalities.</p></article><article><b>4</b><span>Evidence</span><p>Record TI‑84 expression and output.</p></article><article><b>5</b><span>Round</span><p>Only the final probability.</p></article><article><b>6</b><span>Interpret</span><p>Return to the repeated-trial context.</p></article></div>`);

A('ib-worked','Applications','Full model-to-conclusion chain','IB-style worked task','worked',worked(
 'In a random sample of 30 residents, each independently supports a proposal with probability 0.60. Let X be the number who support it. Find P(16≤X≤21), then state the mean and standard deviation.',
 ['BINS is plausible from the stated binary, independent, fixed-n, constant-p setup.','\\(X\\sim B(30,.60)\\).','Interval command: \\(\\operatorname{binomcdf}(30,.6,21)-\\operatorname{binomcdf}(30,.6,15)\\).',`Probability: ${U.fmt(U.event(30,.6,'between',16,21),7)}.`,`Mean: \\(30(.6)=18\\).`,`Standard deviation: \\(\\sqrt{30(.6)(.4)}=${U.fmt(U.sd(30,.6),5)}\\).`],
 `There is approximately a ${U.pct(U.event(30,.6,'between',16,21),2)} probability that 16 through 21 of the 30 residents support the proposal.`,plot('ib-worked')));

A('exam-turn','Applications','Write the chain before revealing the model response','Student turn: exam synthesis','practice',turn(
 'A player makes each of 14 independent free throws with probability 0.65. Find the probability of more than 10 successes, state the mean and standard deviation, and interpret the probability.',
 'exam-turn-note',
 `Let \\(X\\sim B(14,.65)\\). \\(P(X>10)=1-\\operatorname{binomcdf}(14,.65,10)=${U.fmt(U.event(14,.65,'moreThan',10),7)}\\). \\(\\mu=9.1\\), \\(\\sigma=${U.fmt(U.sd(14,.65),4)}\\). Thus the chance of at least 11 successful throws is approximately ${U.pct(U.event(14,.65,'moreThan',10),2)}.`,plot('exam-turn')));

A('mastery','Closure','Check the complete probability workflow','Mastery checklist','mastery',`
<div class="u410-mastery-grid"><label><input type="checkbox"><span>I check BINS before writing a binomial model.</span></label><label><input type="checkbox"><span>I distinguish exact, cumulative, and upper-tail events.</span></label><label><input type="checkbox"><span>I handle strict boundaries without off-by-one errors.</span></label><label><input type="checkbox"><span>I use binompdf and binomcdf appropriately.</span></label><label><input type="checkbox"><span>I interpret mean and standard deviation in context.</span></label><label><input type="checkbox"><span>I apply the exact one-mode/two-mode rule.</span></label><label><input type="checkbox"><span>I label finite-population binomial results as approximations.</span></label><label><input type="checkbox"><span>I keep full precision until the final answer.</span></label></div>`);

A('exit','Closure','One final chain','Exit ticket','exit',`
<div class="u410-exit-grid"><article><h2>Model</h2><p>Why is “roll until first six” not binomial?</p></article><article><h2>Boundary</h2><p>Write the TI‑84 expression for \\(P(X\\ge5)\\) when \\(X\\sim B(18,.3)\\).</p></article><article><h2>Moments</h2><p>Find \\(\\mu\\), \\(\\sigma\\), and the mode(s) for \\(B(19,.25)\\).</p></article></div>${note('exit-ticket')}${reveal('Model response',`The trial count is not fixed. Use \\(1-\\operatorname{binomcdf}(18,.3,4)\\). For \\(B(19,.25)\\), \\(\\mu=4.75\\), \\(\\sigma=${U.fmt(U.sd(19,.25),4)}\\), and because \\((19+1)(.25)=5\\), the modes are 4 and 5.`)}`);
})();
