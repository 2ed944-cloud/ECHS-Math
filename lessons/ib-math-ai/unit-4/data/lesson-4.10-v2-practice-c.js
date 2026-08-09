(function(){
'use strict';
const B=window.U410_ASSESS;if(!B)return;
const {U,mcq,num,short}=B;
// REASONING · 14
mcq('Reasoning','Audit','A researcher records 10 daily outcomes from each of 30 people and treats all 300 outcomes as independent. Main concern?',['Binary condition','Clustered dependence within each person','n is too large','p must be .5'],1,'Repeated outcomes from the same person may be correlated.');
mcq('Reasoning','Audit','Ten cards are drawn without replacement from a 30-card deck. Why is the count of red cards not exactly binomial?',['Outcomes are not binary','n is not fixed','Trials are dependent and p changes','The support is infinite'],2,'Without replacement, the deck composition changes after each draw.');
mcq('Reasoning','Evaluate','A sample of 15 is drawn without replacement from 1000 items. Best statement?',['Exactly binomial','Not exact, but the 1.5% fraction may justify a binomial approximation','Geometric','No probability model is possible'],1,'Dependence is weak when the sampling fraction is small.');
mcq('Reasoning','Distinguish','Which question describes a geometric rather than binomial random variable?',['Number of sixes in 20 rolls','Number of correct guesses in 12 questions','Number of rolls until first six','Number defective in 25 items'],2,'The waiting time has a random number of trials.');
mcq('Reasoning','Determine','For X~B(24,.4), which modal statement is correct?',['Mode 9 only','Mode 10 only','Modes 9 and 10','Modes 10 and 11'],2,'(25)(.4)=10 is integer, giving 9 and 10.');
short('Reasoning','Explain','Why are there two modes when (n+1)p is an integer m?','The adjacent probabilities at m−1 and m are equal and both are maximal.','The PMF ratio crosses 1 exactly between the two adjacent counts.');
mcq('Reasoning','Describe','For fixed n and p=.2, the binomial distribution is usually',['Left-skewed','Right-skewed','Perfectly uniform','Symmetric'],1,'Mass is near low counts with a longer right tail.');
mcq('Reasoning','Compare','The PMF of B(n,.8) is the mirror image of',['B(n,.8)','B(n,.2)','B(.8,n)','A geometric model'],1,'Exchanging success and failure maps X to n−X.');
mcq('Reasoning','Explain','For fixed n, np(1−p) is largest when',['p=0','p=.25','p=.5','p=1'],2,'The product p(1−p) is maximized at .5.');
mcq('Reasoning','Evaluate','A variable has μ=4 and variance=5. Can it be binomial?',['Yes, with p=.2','Yes, with n=5','No, binomial variance cannot exceed its mean','Only if n is large'],2,'For a binomial variable, variance=μ(1−p)≤μ.');
mcq('Reasoning','Audit','Why should two CDF values not be rounded before subtraction?',['CDF values are always integers','Rounding errors can combine and alter the interval probability','The TI-84 forbids subtraction','It changes n'],1,'Keep full precision until the final result.');
mcq('Reasoning','Interpret','A simulation of 50 groups gives relative frequency .28 while the exact probability is .22. Best conclusion?',['The exact model is wrong','The calculator is wrong','Sampling variation is plausible; increase repetitions before judging convergence','Use .28 as the new p'],2,'Finite simulations fluctuate around theoretical probabilities.');
mcq('Reasoning','Interpret','Why can μ=8.4 be valid even though X is integer-valued?',['The mean is rounded','The mean is a long-run average, not necessarily an attainable outcome','X can be decimal','p must be integer'],1,'Expectation need not belong to the support.');
mcq('Reasoning','Evaluate','Mean μ=8 and variance v=0 imply which binomial situation?',['p=0','p=1 and n=8','n=0','No binomial model'],1,'p=1−v/μ=1 and n=μ/p=8; X is always 8.');
// CHALLENGE · 6
num('Challenge','Recover','A binomial variable has μ=9.6 and variance 5.76. Find p.',U.recover(9.6,5.76).p,1e-10,'p=1−v/μ=.4.');
num('Challenge','Calculate','For X~B(14,.55), find P(X≥9 | X≥6).',U.event(14,.55,'atLeast',9)/U.event(14,.55,'atLeast',6),1e-6,'Because {X≥9} is contained in {X≥6}, divide the two upper-tail probabilities.',{calculator:'GDC required'});
num('Challenge','Solve','With p=.03, find the smallest n such that P(at least one success)≥.99.',U.thresholdAtLeastOne(.03,.99),0,'Solve 1−.97^n≥.99 and verify minimality.',{calculator:'GDC required'});
num('Challenge','Compare','For N=200, K=20, n=15, enter the absolute difference between exact hypergeometric P(X=2) and the B(15,.1) approximation.',Math.abs(U.hypergeomPmf(200,20,15,2)-U.pmf(15,.1,2)),1e-7,'Compute both values without rounding first.',{calculator:'GDC required'});
num('Challenge','Recover','A binomial variable has n=32 and mean 11.2. Find p.',11.2/32,1e-10,'p=μ/n=.35.');
num('Challenge','Recover','A binomial variable has μ=12 and variance 7.2. Find n.',U.recover(12,7.2).n,0,'p=1−7.2/12=.4, then n=12/.4=30.');
})();
