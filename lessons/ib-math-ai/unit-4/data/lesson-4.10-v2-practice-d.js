(function(){
'use strict';
const B=window.U410_ASSESS;if(!B)return;
const {data,U,qs,mcq,num,short}=B;
// CHALLENGE · 8
num('Challenge','Calculate','For X~B(80,.06), find P(2≤X≤7).',U.event(80,.06,'between',2,7),1e-6,'Use F(7)−F(1).',{calculator:'GDC required'});
short('Challenge','Determine','Find the mode(s) of X~B(49,.20).','9 and 10','(49+1)(.2)=10 is integer, so the modes are 9 and 10.');
num('Challenge','Solve','For X~B(19,p), the modes are 4 and 5. Find p.',.25,1e-10,'Two modes mean (n+1)p=5, so 20p=5.');
num('Challenge','Solve','Each trial succeeds with probability .07. Find the smallest n for which P(at least one success)≥.80.',U.thresholdAtLeastOne(.07,.8),0,'Solve 1−.93^n≥.8 and verify n−1.',{calculator:'GDC required'});
num('Challenge','Solve','Ten independent trials have P(at least one success)=.90. Find p.',1-.1**(1/10),1e-6,'1−(1−p)^10=.9, so 1−p=.1^(1/10).',{calculator:'GDC required'});
num('Challenge','Calculate','For X~B(22,.42), find P(X=8 | X≤10).',U.pmf(22,.42,8)/U.cdf(22,.42,10),1e-6,'Divide the intersection P(X=8) by P(X≤10).',{calculator:'GDC required'});
num('Challenge','Calculate','Eight independent modules work with probability .92. Find P(at least 7 work).',U.event(8,.92,'atLeast',7),1e-6,'Use 1−F(6), or add P(7)+P(8).',{calculator:'GDC required'});
num('Challenge','Calculate','A population has N=120, K=30 successes. A sample of n=12 is drawn without replacement. Find exact P(X=4).',U.hypergeomPmf(120,30,12,4),1e-6,'Use the hypergeometric probability; binomial would only be an approximation.',{calculator:'GDC required'});
// HOT · 12
mcq('HOT','Audit','A student uses 1−binomcdf(20,.4,7) for P(X≥7). What is the error?',['Wrong n','Wrong p','It calculates P(X>7); the CDF boundary should be 6','It should use binompdf'],2,'At least 7 has complement X≤6.');
short('HOT','Evaluate','A report says “all trials have p=.3, therefore they are independent.” Explain the flaw.','Equal marginal probabilities do not imply independence; outcomes may still influence or be correlated with one another.','Constant p and independence are distinct BINS conditions.');
mcq('HOT','Compare','If X counts successes in n trials with probability p and Y counts failures, which identity is correct?',['Y=X','Y=n−X and Y~B(n,1−p)','Y=1−X','Y~B(p,n)'],1,'Every trial is either success or failure, so the counts sum to n.');
short('HOT','Design','Give a plausible binomial model for an ECHS context and state all four BINS conditions.','Example: X=number of students among 25 independently sampled students who submit by a fixed deadline; success/failure is submit/not, observations are independently sampled, n=25 is fixed, and a common submission probability p is assumed.','Any coherent context earns credit when all four conditions are explicit.');
mcq('HOT','Critique','A student rounds F(9)=.8736 to .87 and F(4)=.1027 to .10 before subtracting. Best critique?',['Correct because both have two decimals','The interval answer .77 may be materially distorted; subtract full-precision values first','CDF values cannot be subtracted','The lower boundary should be 5'],1,'Intermediate rounding can change the final probability.');
mcq('HOT','Evaluate','Which moment pair cannot belong to a binomial distribution?',['μ=8, v=4','μ=8, v=0','μ=8, v=9','μ=8, v=6'],2,'A binomial variance cannot exceed its mean.');
mcq('HOT','Select','Which model is exact for 20 draws without replacement from 80 items containing 16 successes?',['B(20,.2)','Hypergeometric','Geometric','Normal with no correction'],1,'Without-replacement draws are dependent; hypergeometric is exact.');
num('HOT','Optimize','For n=40, enter the maximum possible binomial variance over 0≤p≤1.',10,1e-10,'Maximum occurs at p=.5: 40(.5)(.5)=10.');
mcq('HOT','Reason','For a binomial PMF, the ratio P(X=x+1)/P(X=x) is greater than 1 when',['The PMF is increasing from x to x+1','The PMF is decreasing','Both probabilities are zero','x is the mean'],0,'A ratio above 1 means the next bar is taller.');
short('HOT','Determine','For X~B(9,p), give the p interval for which the unique mode is 4.','0.4<p<0.5, with boundary cases producing two modes.','The unique mode is floor(10p)=4 when 4<10p<5.');
mcq('HOT','Reverse','The command 1−binomcdf(25,.08,2) calculates',['P(X≥2)','P(X>2)=P(X≥3)','P(X≤2)','P(X=2)'],1,'The complement of X≤2 is X>2.');
short('HOT','Interpret','A 100-run simulation gives an event frequency .31 while the exact probability is .24. What should be checked before rejecting the model?','Check sampling variation by increasing repetitions, then recheck BINS assumptions and the event translation; a single finite simulation discrepancy is not decisive.','Separate Monte Carlo variability from model error and coding error.');

data.practice=qs;
data.practice_levels={Foundation:16,Application:20,Reasoning:18,Challenge:14,HOT:12};
data.lesson.practice_count=qs.length;
if(qs.length!==80)console.warn(`Lesson 4.10 expected 80 practice questions; built ${qs.length}.`);
})();
