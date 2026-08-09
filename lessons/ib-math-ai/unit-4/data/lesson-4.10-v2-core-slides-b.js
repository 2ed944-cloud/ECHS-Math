(function(){
'use strict';
const B=window.U410_CORE;if(!B)return;
const {U,D,plot,lab,turn,worked,formula,cards,note,reveal,A}=B;

A('pmf-meaning','Probability','A distribution assigns mass to integer counts','Probability mass function','concept',`
<div class="u410-visual-layout"><article><h2>\\(P(X=x)\\)</h2><p>The height above integer \\(x\\) is the probability of exactly \\(x\\) successes. There is no probability between the bars because the random variable is discrete.</p>${formula('Support','x=0,1,2,\\ldots,n','Every possible success count.')}</article>${plot('pmf-basic')}</div>`);

A('pmf-derivation','Probability','Choose positions, then multiply one arrangement','Where the formula comes from','reasoning',`
<div class="u410-three-step"><article><b>1</b><h3>One arrangement</h3><p>\\(p^x(1-p)^{n-x}\\)</p></article><article><b>2</b><h3>Choose success positions</h3><p>\\(\\binom{n}{x}\\) arrangements</p></article><article><b>3</b><h3>Combine</h3><p>\\(\\binom{n}{x}p^x(1-p)^{n-x}\\)</p></article></div>${plot('combinations')}`);

A('pmf-formula','Probability','Exact probability is one PMF value','Binomial probability formula','formula',`
<div class="u410-formula-hero"><span>For \\(X\\sim B(n,p)\\)</span><b>\\[P(X=x)=\\binom{n}{x}p^x(1-p)^{n-x}\\]</b></div>${cards([
 ['n','Trials','Fixed number of trials.'],['x','Successes','Requested integer count.'],['p','Success probability','Constant across trials.'],['1−p','Failure probability','Complement on each trial.']
],'u410-symbol-grid')}`);

A('exact-worked','Probability','Manual structure reveals the model','Worked exact probability','worked',worked(
 'A fair die is rolled 10 times. Find the probability of exactly two sixes.',
 ['Define success as rolling a six, so \\(n=10\\), \\(p=1/6\\), \\(x=2\\).','Use \\(P(X=2)=\\binom{10}{2}(1/6)^2(5/6)^8\\).',`Evaluate: \\(P(X=2)=${U.fmt(U.pmf(10,1/6,2),7)}\\).`],
 `There is about a ${U.pct(U.pmf(10,1/6,2),2)} probability of exactly two sixes in 10 rolls.`,plot('exact-two')));

A('exact-turn','Probability','One phrase selects one bar','Student turn: exactly','practice',turn(
 'For \\(X\\sim B(8,0.25)\\), calculate \\(P(X=3)\\) and state a contextual interpretation.',
 'exact-turn-note',
 `\\(P(X=3)=\\binom83(.25)^3(.75)^5=${U.fmt(U.pmf(8,.25,3),7)}\\). In repeated groups of eight trials, about ${U.pct(U.pmf(8,.25,3),2)} of groups would contain exactly three successes.`,plot('exact-three')));

A('support','Probability','The support is finite and discrete','Possible and impossible values','concept',`
<div class="u410-support"><div>${Array.from({length:13},(_,i)=>`<span>${i}</span>`).join('')}</div><p>For \\(X\\sim B(12,p)\\), values 0 through 12 are possible. Values such as −1, 4.5, and 13 have probability zero.</p></div>${turn('Can the mean of a binomial distribution be 8.4 even though X cannot equal 8.4?','support-turn','Yes. The mean is the long-run average across many repetitions, not necessarily an attainable single count.')}`);

A('pmf-reading','Probability','Area language becomes bar-sum language','Read a PMF graph','visual',`
<div class="u410-visual-layout"><article><h2>Selected event</h2><p>The probability of an event is the sum of the heights of all bars whose integer values satisfy the event.</p><div class="formula-panel">For \\(5\\le X\\le 8\\), add the four bars at 5, 6, 7, and 8.</div></article>${plot('pmf-selected')}</div>`);

A('cdf-meaning','Probability','CDF accumulates probability from the left','Cumulative distribution function','concept',`
<div class="u410-visual-layout"><article><h2>\\(F(k)=P(X\\le k)\\)</h2><p>The CDF is a step function. At integer \\(k\\), it contains every PMF bar from 0 through \\(k\\).</p>${formula('Endpoint','F(n)=1','All possible counts have been included.')}</article>${plot('cdf-basic')}</div>`);

A('language-map','Probability','Translate words before touching the calculator','Discrete boundary map','concept',`
<div class="u410-language-grid"><article><span>Exactly k</span><b>\\(X=k\\)</b><p>One PMF value.</p></article><article><span>At most k</span><b>\\(X\\le k\\)</b><p>Lower cumulative through k.</p></article><article><span>Fewer than k</span><b>\\(X\\le k-1\\)</b><p>Strict boundary shifts by one.</p></article><article><span>At least k</span><b>\\(X\\ge k\\)</b><p>Complement of \\(X\\le k-1\\).</p></article><article><span>More than k</span><b>\\(X\\ge k+1\\)</b><p>Complement of \\(X\\le k\\).</p></article><article><span>Between a and b</span><b>\\(a\\le X\\le b\\)</b><p>Subtract cumulative values.</p></article></div>`);

A('at-most','Probability','Inclusive lower tail','At most','worked',worked(
 'For \\(X\\sim B(15,0.35)\\), find \\(P(X\\le5)\\).',
 ['“At most 5” includes 0,1,2,3,4,5.','Use the lower cumulative command \\(\\operatorname{binomcdf}(15,.35,5)\\).',`Result: \\(P(X\\le5)=${U.fmt(U.cdf(15,.35,5),7)}\\).`],
 'The selected probability is the sum of the first six PMF bars.',plot('cdf-atmost')));

A('fewer-than','Probability','Strict inequalities shift the integer boundary','Fewer than','worked',worked(
 'For \\(X\\sim B(18,0.40)\\), find \\(P(X<7)\\).',
 ['Because X is integer, \\(X<7\\) means \\(X\\le6\\).','Use \\(\\operatorname{binomcdf}(18,.4,6)\\), not 7.',`Result: ${U.fmt(U.event(18,.4,'lessThan',7),7)}.`],
 'Write the event translation explicitly to prevent an off-by-one error.',plot('less-than')));

A('at-least','Probability','Upper tails use the complement','At least','worked',worked(
 'For \\(X\\sim B(20,0.04)\\), find \\(P(X\\ge2)\\).',
 ['The complement of \\(X\\ge2\\) is \\(X\\le1\\).','Compute \\(1-\\operatorname{binomcdf}(20,.04,1)\\).',`Result: ${U.fmt(U.event(20,.04,'atLeast',2),7)}.`],
 'Subtract the last excluded integer, not the first included integer.',plot('tail-atleast')));

A('more-than','Probability','More than k excludes k','More than','worked',worked(
 'For \\(X\\sim B(20,0.40)\\), find \\(P(X>6)\\).',
 ['The complement is \\(X\\le6\\).','Use \\(1-\\operatorname{binomcdf}(20,.4,6)\\).',`Result: ${U.fmt(U.event(20,.4,'moreThan',6),7)}.`],
 'Compare: “at least 6” would subtract the CDF at 5.',plot('more-than')));

A('inclusive-interval','Probability','Both endpoints matter','Inclusive interval','worked',worked(
 'For \\(X\\sim B(16,0.45)\\), find \\(P(5\\le X\\le9)\\).',
 ['Upper cumulative: \\(P(X\\le9)=F(9)\\).','Remove values below 5: \\(P(X\\le4)=F(4)\\).','Compute \\(F(9)-F(4)\\).',`Result: ${U.fmt(U.event(16,.45,'between',5,9),7)}.`],
 'For an inclusive lower bound a, subtract F(a−1).',plot('interval')));

A('at-least-one','Probability','One complement replaces many terms','At least one','concept',`
<div class="u410-formula-hero"><span>Repeated-trial shortcut</span><b>\\[P(X\\ge1)=1-P(X=0)=1-(1-p)^n\\]</b></div>${worked('Twelve independent units each have fault probability 0.15. Find the probability of at least one fault.',['Use the complement of no faults.',`\\(1-(.85)^{12}=${U.fmt(1-.85**12,7)}\\).`],'The event contains every positive count, so the complement is efficient.',plot('zero-complement'))}`);

A('event-lab','Probability','Test every boundary visually','Interactive event translator','lab',`${lab('event')}<div class="callout"><b>Audit prompt</b><p>Before calculating, say which integer bars are included. Then compare the exact probability and TI‑84 expression.</p></div>`);
})();
