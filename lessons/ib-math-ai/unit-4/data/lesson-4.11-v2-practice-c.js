(function(){
'use strict';
const B=window.U411_ASSESS;if(!B)return;
const {U,D,qs,mcq,num,short}=B;

// CHALLENGE · 14
num('Challenge','Calculate','For \\(X\sim N(28,4.5^2)\\), find \\(P(X&lt;20\text{ or }X&gt;34)\\).',U.cdf(20,28,4.5)+U.sf(34,28,4.5),.0005,'Add the two disjoint tails.',{calculator:'GDC required'});
num('Challenge','Calculate','For \\(M\sim N(250,12^2)\\), find the expected number outside 225–275 g among 850 packages.',850*(1-U.prob(225,275,250,12)),.2,'850[1−normalcdf(225,275,250,12)].',{calculator:'GDC required'});
num('Challenge','Find','For \\(X\sim N(40,6^2)\\), find the width of the central 92% interval.',U.central(.92,40,6).hi-U.central(.92,40,6).lo,.03,'Each tail is .04; subtract the two invNorm boundaries.',{calculator:'GDC required'});
num('Challenge','Compare','For \\(A\sim N(20,3^2)\\) and \\(B\sim N(100,15^2)\\), find \\(P(A&lt;24.5)-P(B&lt;122.5)\\).',0,.00001,'Both boundaries have z=1.5, so the cumulative probabilities are equal.',{calculator:'No GDC'});
num('Challenge','Reason','Without a calculator, find the probability that X lies between its 20th and 85th percentiles.',.65,.000001,'.85−.20=.65.',{calculator:'No GDC'});
num('Challenge','Solve','A normal variable has σ=5 and its 70th percentile is 42. Find μ.',U.solveMean(42,.70,5),.03,'μ=42−5z_.70.',{calculator:'GDC required'});
num('Challenge','Solve','A normal variable has μ=80 and its 30th percentile is 74. Find σ.',U.solveSd(74,.30,80),.03,'Use 74=80+z_.30σ; both numerator and z are negative, so σ>0.',{calculator:'GDC required'});
num('Challenge','Solve','A normal variable has 5th percentile 31 and 95th percentile 49. Find σ.',U.solveTwo(31,.05,49,.95).sd,.03,'Subtract the two quantile equations.',{calculator:'GDC required'});
num('Challenge','Design','Scores are \\(N(68,10^2)\\). The top 7% qualify and scores are integers. Find the smallest qualifying score.',Math.ceil(U.inv(.93,68,10)),0,'Top .07 means left area .93; then round upward to the first integer.',{calculator:'GDC required'});
num('Challenge','Conditional','For \\(X\sim N(32,6^2)\\), find \\(P(X&gt;40\mid X&gt;35)\\).',U.sf(40,32,6)/U.sf(35,32,6),.0007,'Because {X>40} is contained in {X>35}, divide P(X>40) by P(X>35).',{calculator:'GDC required'});
num('Challenge','Calculate','For \\(X\sim N(0,1)\\), find \\(P(|X|&gt;1.75)\\).',2*U.sf(1.75),.0005,'Symmetry gives twice the right-tail probability.',{calculator:'GDC required'});
num('Challenge','Find','Find k such that \\(P(50-k&lt;X&lt;50+k)=.95\\) for \\(X\sim N(50,7^2)\\).',U.inv(.975)*7,.03,'Each tail is .025, so k=z_.975(7).',{calculator:'GDC required'});
num('Challenge','Infer','A central 80% interval for a normal variable is [34,58]. Find μ.',46,.000001,'A symmetric central interval is centred at μ, so μ=(34+58)/2.',{calculator:'No GDC'});
mcq('Challenge','Compare','Two normal distributions have the same μ. Distribution A has smaller σ than B. For a fixed x>μ, which is true?',['P_A(X>x)>P_B(X>x)','P_A(X>x)<P_B(X>x)','The probabilities are equal','Cannot compare'],1,'The same raw distance is more SDs above μ for A, so its right tail is smaller.',{calculator:'No GDC'});

// HOT · 12
mcq('HOT','Evaluate','A student uses invNorm(.10,68,10) for the top 10%. What did the student actually find?',['The 90th percentile','The 10th percentile','The middle 10%','The mean'],1,'Area .10 is the lower 10th percentile.');
num('HOT','Design','A factory wants only 12 of 400 items expected above a threshold. For \\(X\sim N(500,8^2)\\), find the threshold.',U.inv(.97,500,8),.03,'Tail probability is 12/400=.03, so lower-tail area is .97.',{calculator:'GDC required'});
num('HOT','Infer','A normal distribution has 16th percentile 42.05 and 84th percentile 57.95. Using the near-symmetry of these percentiles, estimate μ.',50,.02,'Mirror percentiles have midpoint μ.',{calculator:'No GDC'});
mcq('HOT','Evaluate','Which evidence most seriously challenges a normal model?',['Sample mean near median','A single smooth peak','A pronounced long right tail and several extreme outliers','Continuous units'],2,'Strong skew and extreme outliers conflict with normal symmetry.',{calculator:'No GDC'});
num('HOT','Reverse engineer','In 500 observations, 25 are expected above x. For \\(X\sim N(28,4.5^2)\\), find x.',U.inv(.95,28,4.5),.03,'Right-tail probability .05 gives left area .95.',{calculator:'GDC required'});
mcq('HOT','Compare','For the same central percentage, which normal distribution has the wider interval?',['The one with larger μ','The one with larger σ','The one with smaller μ','They are always equal'],1,'Central interval width is proportional to σ.',{calculator:'No GDC'});
mcq('HOT','Audit','A calculator returns .973 for \\(P(X&gt;\mu+2\sigma)\\). What is the best diagnosis?',['Reasonable','Likely the large left area was calculated instead of the right tail','σ is always 2','The normal model has total area 2'],1,'The right tail beyond μ+2σ is about .023, not .973.',{calculator:'No GDC'});
num('HOT','Quantify error','For \\(X\sim N(32,6^2)\\), compare using exact x=40 with using z rounded to 1.3. Enter the absolute probability error.',Math.abs(U.cdf(40,32,6)-U.cdf(1.3)),.00005,'Compare normalcdf with raw inputs against Φ(1.3).',{calculator:'GDC required'});
mcq('HOT','Predict','Without calculating, which probability is smallest for \\(X\sim N(0,1)\\)?',['P(X>1)','P(X>2)','P(X<1)','P(−1<X<1)'],1,'The farther right-tail boundary creates the smallest region.',{calculator:'No GDC'});
num('HOT','Sensitivity','For \\(X\sim N(500,8^2)\\), how much does the expected count below 490 change when n increases from 200 to 350?',150*U.cdf(490,500,8),.1,'The change is (350−200)P(X<490).',{calculator:'GDC required'});
mcq('HOT','Explain','Why is normalpdf(x,μ,σ) not the answer to \\(P(X&lt;x)\\)?',['normalpdf returns density height, not cumulative area','normalpdf requires variance','normalpdf works only for z=0','normalpdf is always greater than 1'],0,'A CDF integrates density over a region.',{calculator:'No GDC'});
short('HOT','Construct','Write a calculator expression for \\(P(X&gt;40\mid X&gt;35)\\) when \\(X\sim N(32,6^2)\\).','normalcdf(40,1E99,32,6) / normalcdf(35,1E99,32,6)','The smaller event X>40 is contained in X>35, so divide the two upper-tail probabilities.',{calculator:'GDC expression'});
})();
