(function(){
'use strict';
const B=window.U410_CORE;if(!B)return;
const {U,D,plot,lab,turn,worked,formula,cards,note,reveal,A}=B;

A('ti-route','Technology','The TI‑84 evaluates the model you have already justified','TI‑84 distribution menu','technology',`
<div class="u410-key-route"><span>2nd</span><i>→</i><span>VARS</span><i>→</i><span>DISTR</span><i>→</i><span>binompdf / binomcdf</span></div><div class="u410-ti-choice"><article><b>binompdf</b><p>One exact count \\(P(X=x)\\), or the complete PMF list when x is omitted.</p></article><article><b>binomcdf</b><p>Lower cumulative probability \\(P(X\\le x)\\).</p></article></div><div class="launch-actions center"><button class="primary-btn" data-u410-coach>Open verified binomial coach</button><button class="secondary-btn" data-open-ti84>Practise full TI‑84 keys</button></div>`);

A('pdf-workflow','Technology','Exact means one integer value','TI‑84 · binompdf','worked',worked(
 'For \\(X\\sim B(12,0.72)\\), find \\(P(X=9)\\).',
 ['Translate the event: exactly 9 means one PMF value.','Enter \\(\\operatorname{binompdf}(12,.72,9)\\).',`Output: ${U.fmt(U.pmf(12,.72,9),9)}.`,`Round only in the final answer, for example ${U.fmt(U.pmf(12,.72,9),4)}.`],
 `The probability of exactly 9 successful free throws is approximately ${U.fmt(U.pmf(12,.72,9),4)}.`,plot('pdf-workflow')));

A('cdf-workflow','Technology','Cumulative means from zero through the boundary','TI‑84 · binomcdf','worked',worked(
 'For \\(X\\sim B(15,0.35)\\), find \\(P(X\\le5)\\).',
 ['Translate “at most 5” as \\(X\\le5\\).','Enter \\(\\operatorname{binomcdf}(15,.35,5)\\).',`Output: ${U.fmt(U.cdf(15,.35,5),9)}.`],
 'The calculator has summed the six PMF values from x=0 through x=5.',plot('cdf-workflow')));

A('upper-workflow','Technology','The CDF is lower-tail only','TI‑84 · upper tails','technology',`
<div class="u410-language-grid"><article><span>At least k</span><b>\\(1-\\operatorname{binomcdf}(n,p,k-1)\\)</b><p>Keep k; subtract one inside the CDF.</p></article><article><span>More than k</span><b>\\(1-\\operatorname{binomcdf}(n,p,k)\\)</b><p>The boundary k belongs to the complement.</p></article></div>${turn('Write the TI‑84 expression for \\(P(X\\ge7)\\) when \\(X\\sim B(20,.4)\\).','upper-ti-turn','\\(1-\\operatorname{binomcdf}(20,.4,6)\\).')}`);

A('interval-workflow','Technology','Subtract the cumulative value just below the interval','TI‑84 · inclusive intervals','worked',worked(
 'For \\(X\\sim B(16,0.45)\\), find \\(P(5\\le X\\le9)\\).',
 ['Translate both inclusive endpoints.','Enter \\(\\operatorname{binomcdf}(16,.45,9)-\\operatorname{binomcdf}(16,.45,4)\\).',`Output: ${U.fmt(U.event(16,.45,'between',5,9),9)}.`],
 'The lower subtraction uses 4 because values 0 through 4 lie below the interval.',plot('interval-workflow')));

A('list-mode','Technology','A full list reveals the whole distribution','TI‑84 · PMF list mode','technology',`
<div class="u410-two-column"><article><span>Command</span><h2>binompdf(n,p)</h2><p>On a TI‑84 Plus CE, omitting x returns probabilities for x=0,1,…,n.</p></article><article class="accent"><span>Use</span><h2>Inspect and store</h2><p>Scroll through the list, compare modes, or store the list for a probability plot.</p></article></div>${plot('list-mode')}<div class="callout warning"><b>Version note</b><p>If a classroom calculator’s operating system does not return a list, calculate selected values individually; the mathematical definition is unchanged.</p></div>`);

A('rounding','Technology','Precision belongs inside the calculation','Rounding discipline','reasoning',`
<div class="u410-rounding-chain"><article><span>Calculator</span><b>${U.fmt(U.event(30,.6,'between',16,21),9)}</b><p>Retain full internal precision.</p></article><i>→</i><article><span>Working</span><b>0.829704…</b><p>Carry unrounded values through later steps.</p></article><i>→</i><article><span>Final</span><b>${U.fmt(U.event(30,.6,'between',16,21),3)}</b><p>Round once to the requested accuracy.</p></article></div>${turn('Why can rounding two CDF values before subtraction damage an interval probability?','rounding-turn','The rounding errors can combine in the subtraction. Subtract full-precision calculator values and round only the final probability.')}`);

A('ti-errors','Technology','Most calculator errors begin before the keys','Four high-frequency mistakes','audit',cards([
 ['1','Wrong model','Using binomial commands without checking BINS.'],
 ['2','Wrong boundary','Entering k instead of k−1 for fewer than or at least.'],
 ['3','Wrong command','Using binompdf for a cumulative event.'],
 ['4','Early rounding','Rounding p or intermediate CDF values before the final step.']
],'u410-error-grid'));

A('mean','Moments','Expected count scales with n and p','Mean of a binomial distribution','concept',`
<div class="u410-formula-hero"><span>Long-run centre</span><b>\\[\\mu=E(X)=np\\]</b></div>${worked('A student guesses all 20 four-option questions independently. Find and interpret the mean.',['Here n=20 and p=0.25.','\\(\\mu=np=20(.25)=5\\).'],'Across many 20-question tests, the average number correct approaches 5.',plot('mean-graph'))}`);

A('variance-sd','Moments','Spread is largest near p=0.5','Variance and standard deviation','concept',`
<div class="u410-two-formulas">${formula('Variance','\\operatorname{Var}(X)=np(1-p)','Squared-count units.')}${formula('Standard deviation','\\sigma=\\sqrt{np(1-p)}','Typical distance from the mean in count units.')}</div>${worked('For \\(X\\sim B(24,0.35)\\), calculate the variance and standard deviation.',[`\\(\\operatorname{Var}(X)=24(.35)(.65)=${U.fmt(U.variance(24,.35),5)}\\).`,`\\(\\sigma=\\sqrt{24(.35)(.65)}=${U.fmt(U.sd(24,.35),5)}\\).`],'Standard deviation is reported in successes, not squared successes.',plot('sd-graph'))}`);

A('moment-interpretation','Moments','A mean is not a guaranteed outcome','Interpret moments correctly','reasoning',`
<div class="u410-two-column"><article class="good"><h2>Correct</h2><p>Over many repeated groups of 24 trials, the average success count approaches 8.4.</p><p>A standard deviation of about ${U.fmt(U.sd(24,.35),3)} successes describes typical group-to-group variation.</p></article><article class="warning"><h2>Incorrect</h2><p>“Every group has 8.4 successes.”</p><p>“The probability of success is ${U.fmt(U.sd(24,.35),3)}.”</p></article></div>`);

A('mode-rule','Moments','The highest bar follows an exact rule','Mode of a binomial distribution','formula',`
<div class="u410-mode-rule"><article><span>If \\(m=(n+1)p\\) is not an integer</span><b>Mode \\(=\\lfloor m\\rfloor\\)</b></article><article><span>If \\(m=(n+1)p\\) is an integer</span><b>Modes \\(=m-1\\) and \\(m\\)</b></article></div><div class="callout"><b>Do not use “nearest integer to np” as an exact rule.</b><p>It often works, but it fails in important boundary and two-mode cases.</p></div>`);

A('two-modes','Moments','An integer boundary creates equal adjacent maxima','The two-mode case','worked',worked(
 'Find the mode(s) of \\(X\\sim B(24,0.40)\\).',
 ['Compute \\(m=(n+1)p=25(.4)=10\\).','Because m is an integer, there are two adjacent modes.','The modes are \\(m-1=9\\) and \\(m=10\\).',`Indeed, both probabilities equal ${U.fmt(U.pmf(24,.4,9),7)}.`],
 'State both modal counts; writing only 10 is incomplete.',plot('two-modes')));

A('shape-p','Moments','Changing p moves and reverses the distribution','Effect of p','visual',`
<div class="u410-visual-layout"><article><h2>Fixed n=20</h2><p>As p increases, the mean np moves right. Values below 0.5 create right-skew; p=0.5 is symmetric; values above 0.5 create left-skew.</p></article>${plot('shape-p')}</div>`);

A('skewness','Moments','Success and failure are mirror definitions','Symmetry and skew','reasoning',`
<div class="u410-three-column"><article><span>p&lt;0.5</span><h2>Right-skewed</h2><p>Most mass is near small counts with a longer right tail.</p></article><article class="accent"><span>p=0.5</span><h2>Symmetric</h2><p>Counts x and n−x have equal probability.</p></article><article><span>p&gt;0.5</span><h2>Left-skewed</h2><p>Most mass is near large counts with a longer left tail.</p></article></div>${plot('skewness')}`);

A('compare-parameters','Moments','n controls scale; p controls location and skew','Compare distributions','visual',`
<div class="u410-visual-layout"><article><h2>Read all three features</h2><p><b>Centre:</b> np. <b>Spread:</b> √[np(1−p)]. <b>Shape:</b> driven mainly by p and how close the support is to 0 or n.</p></article>${plot('parameter-compare')}</div>${turn('Two models have the same mean 6: B(12,.5) and B(20,.3). Must they have the same spread?','compare-turn',`No. Their variances are ${U.fmt(U.variance(12,.5),3)} and ${U.fmt(U.variance(20,.3),3)}, so equal means do not force equal distributions.`)}`);
})();
