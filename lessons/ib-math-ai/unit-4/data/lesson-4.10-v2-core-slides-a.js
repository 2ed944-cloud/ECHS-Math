(function(){
'use strict';
const B=window.U410_CORE;if(!B)return;
const {data,U,D,plot,lab,turn,worked,formula,cards,note,reveal,A}=B;

A('cover','Launch','IB Mathematics: Applications and Interpretation SL','Binomial Distribution and Repeated Trials','cover',`
<div class="cover-grid u410-cover"><div class="cover-copy"><span class="unit-kicker">Unit 4 · Statistics and Probability</span><span class="lesson-number">4.10</span><h1>Binomial <em>Distribution</em></h1><p>Turn repeated success–failure trials into an exact probability model. Check assumptions first, translate language precisely, and use the TI‑84 as auditable evidence—not as a substitute for reasoning.</p><div class="pill-row"><span>BINS conditions</span><span>PMF and CDF</span><span>Mean and spread</span><span>TI‑84 coach</span></div><div class="launch-actions"><button class="primary-btn" data-u410-coach>Open binomial coach</button><button class="secondary-btn" data-open-ti84>Open full TI‑84</button></div></div><div class="cover-visual">${plot('cover','tall')}</div></div>`);

A('inquiry','Launch','A repeated process produces one random count','Opening inquiry','inquiry',`
<div class="inquiry-panel"><span class="mini-label">Opening decision</span><blockquote>A basketball player attempts 12 free throws. Each attempt has success probability 0.72. What must be true before the number of successful shots can be modelled by a binomial distribution?</blockquote><div class="inquiry-cues"><span>Two outcomes?</span><span>Independent?</span><span>Fixed trials?</span><span>Same p?</span></div>${note('inquiry')}</div>`);

A('outcomes','Launch','What mastery looks like','Learning outcomes','objectives',`
<div class="objective-list">${data.lesson.objectives.map((x,i)=>`<label><input type="checkbox" data-reflect="objective-${i}"><span>${x}</span></label>`).join('')}</div><div class="callout"><b>Success standard</b><p>A complete response names the model, checks assumptions, translates the event, records exact calculator evidence, and interprets the probability in context.</p></div>`);

A('route-map','Launch','One connected modelling chain','Lesson route','roadmap',`
<div class="u410-route-map"><article><b>1</b><span>Audit BINS</span><p>Decide whether the model is defensible.</p></article><i>→</i><article><b>2</b><span>Define X</span><p>State what is counted and its support.</p></article><i>→</i><article><b>3</b><span>Translate event</span><p>Preserve strict and inclusive boundaries.</p></article><i>→</i><article><b>4</b><span>Compute and interpret</span><p>Use PMF/CDF evidence with context.</p></article></div>`);

A('random-variable','Model','The experiment becomes a count','Define the random variable','concept',`
<div class="u410-two-column"><article><span>Experiment</span><h2>12 free throws</h2><p>Each trial produces success or failure.</p></article><article class="accent"><span>Random variable</span><h2>\\(X=\\) number made</h2><p>\\(X\\in\\{0,1,2,\\ldots,12\\}\\).</p></article></div>${plot('trial-strip')}`);

A('bins-overview','Model','Four conditions protect the probability model','The BINS audit','concept',cards([
 ['B','Binary outcomes','Every trial must be classified as success or failure.'],
 ['I','Independent trials','Knowing one outcome should not change another trial probability.'],
 ['N','Number fixed','The number of trials is set before the experiment begins.'],
 ['S','Same probability','The success probability p is constant across trials.']
],'u410-bins-grid'));

A('binary','Model','Success is a definition—not a compliment','B · Binary outcomes','concept',`
<div class="u410-two-column"><article class="good"><h2>Valid coding</h2><p>A sensor is defective / not defective. A response supports / does not support. A shot is made / missed.</p></article><article class="warning"><h2>Not yet binary</h2><p>A five-level satisfaction rating needs a clearly justified success category before a binomial model can be used.</p></article></div>${turn('A survey response is Strongly agree, Agree, Neutral, Disagree, or Strongly disagree. How could it become binary?','binary-turn','Define success before data analysis, for example Agree or Strongly agree; all remaining responses are failure. The definition must match the research question.')}`);

A('independence','Model','Repeated does not automatically mean independent','I · Independent trials','concept',`
<div class="u410-two-column"><article class="good"><h2>Separate production lines</h2><p>Independent component faults may be plausible when units do not influence one another.</p></article><article class="warning"><h2>Clustered outcomes</h2><p>Responses from friends, repeated measurements on one person, or contagious events may be dependent.</p></article></div>${plot('dependence')}`);

A('fixed-n','Model','The stopping rule determines the distribution','N · Fixed number of trials','concept',`
<div class="u410-two-column"><article class="good"><h2>Count successes in 10 rolls</h2><p>The experiment always ends after trial 10: binomial structure.</p></article><article class="warning"><h2>Roll until the first six</h2><p>The number of trials is random: geometric waiting-time structure.</p></article></div>${plot('fixed-waiting')}`);

A('same-p','Model','A changing environment changes the model','S · Same success probability','concept',`
<div class="u410-two-column"><article class="good"><h2>Constant difficulty</h2><p>Independent questions with the same four options give \\(p=0.25\\) for every random guess.</p></article><article class="warning"><h2>Changing difficulty</h2><p>Mixed two-, three-, and four-option questions do not share one value of \\(p\\).</p></article></div>${plot('changing-p')}`);

A('bins-worked','Model','Name each condition in context','Worked BINS audit','worked',worked(
 'Twenty independently manufactured sensors are tested. Historical evidence supports a defect probability of 0.04 for each sensor. Let X be the number defective.',
 ['Binary: defective or not defective.','Independent: the statement specifies independently manufactured units.','Number fixed: exactly 20 sensors are tested.','Same probability: each sensor uses p=0.04.','Therefore \\(X\\sim B(20,0.04)\\) is defensible.'],
 'The model is binomial because the four BINS conditions are satisfied.',plot('defect-pmf')));

A('bins-turn','Model','Do not force the model','Student turn: audit a scenario','practice',turn(
 'A player takes shots until the first successful shot. Is the number of successes binomial? Explain precisely.',
 'bins-turn-note',
 'No. The number of trials is not fixed: the experiment stops at the first success. In fact, the number of successes is always 1, while the waiting time follows a geometric-type model.',plot('binomial-geometric')));

A('without-replacement','Model','Finite-population sampling creates dependence','Sampling without replacement','reasoning',`
<div class="u410-two-column"><article class="warning"><h2>Exact statement</h2><p>After one selected item is known, the remaining success proportion changes. A hypergeometric model is exact.</p></article><article class="good"><h2>Approximation</h2><p>When the sample fraction \\(n/N\\) is small, the change in probability is slight and a binomial approximation may be reasonable.</p></article></div><div class="formula-panel">A common classroom guideline is \\(n/N\\le 0.10\\), but context and required accuracy still matter.</div>`);

A('finite-comparison','Model','Approximate is not the same as exact','Hypergeometric versus binomial','worked',worked(
 'A warehouse has 800 components, including 64 defective. A sample of 20 is taken without replacement. Compare P(X=2).',
 [`Population defect proportion: \\(p=64/800=0.08\\).`,`Sampling fraction: \\(20/800=0.025\\), so dependence is weak.`,`Exact hypergeometric: \\(P(X=2)=${U.fmt(U.hypergeomPmf(800,64,20,2),7)}\\).`,`Binomial approximation: \\(P(X=2)=${U.fmt(U.pmf(20,.08,2),7)}\\).`,`The values are close, but only the hypergeometric value is exact.`],
 'State explicitly when a binomial result is an approximation.',plot('finite-compare')));

A('binomial-geometric','Model','Ask what is random','Binomial or waiting time?','reasoning',`
<div class="u410-decision-grid"><article><span>Fixed</span><h2>Number of trials</h2><p>Random variable counts successes → binomial.</p></article><article><span>Random</span><h2>Trial of first success</h2><p>Random variable measures waiting time → geometric.</p></article></div>${turn('“How many attempts are needed until the first correct response?” Which feature rules out a binomial model?','geo-turn','The number of trials is not fixed in advance; it is the random variable.')}`);

A('model-check','Model','A correct command cannot repair a wrong model','Checkpoint: model before mathematics','checkpoint',`
<div class="u410-checklist"><label><input type="checkbox"><span>I can define success and failure.</span></label><label><input type="checkbox"><span>I can justify or challenge independence.</span></label><label><input type="checkbox"><span>I can distinguish fixed trials from waiting time.</span></label><label><input type="checkbox"><span>I can justify constant p or state an approximation.</span></label></div>${lab('bins')}${reveal('Model checkpoint','Only after all four conditions are defensible should you write \\(X\\sim B(n,p)\\) and calculate probabilities.')}`);
})();
