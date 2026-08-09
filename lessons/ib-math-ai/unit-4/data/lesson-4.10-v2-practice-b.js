(function(){
'use strict';
const B=window.U410_ASSESS;if(!B)return;
const {U,mcq,num,short}=B;
// APPLICATION · 16
num('Application','Calculate','For X~B(30,.60), find P(X=18).',U.pmf(30,.6,18),1e-6,'Use binompdf(30,.6,18).',{calculator:'GDC required'});
num('Application','Calculate','A fair die is rolled 10 times. Find the probability of exactly two sixes.',U.pmf(10,1/6,2),1e-6,'Use binompdf(10,1/6,2).',{calculator:'GDC required'});
num('Application','Calculate','Twenty sensors each have defect probability .04. Find P(no defects).',U.pmf(20,.04,0),1e-6,'P(X=0)=.96^20.',{calculator:'GDC required'});
num('Application','Calculate','Twelve units each have fault probability .15. Find P(at least one fault).',1-.85**12,1e-6,'Use 1−P(X=0)=1−.85^12.',{calculator:'GDC required'});
num('Application','Calculate','For X~B(20,.04), find P(X≤1).',U.cdf(20,.04,1),1e-6,'Use binomcdf(20,.04,1).',{calculator:'GDC required'});
num('Application','Calculate','For X~B(16,.45), find P(X<5).',U.event(16,.45,'lessThan',5),1e-6,'X<5 means X≤4.',{calculator:'GDC required'});
num('Application','Calculate','For X~B(15,.35), find P(X>8).',U.event(15,.35,'moreThan',8),1e-6,'Use 1−binomcdf(15,.35,8).',{calculator:'GDC required'});
num('Application','Calculate','For X~B(25,.08), find P(1≤X≤3).',U.event(25,.08,'between',1,3),1e-6,'Use F(3)−F(0).',{calculator:'GDC required'});
short('Application','Interpret','For X~B(40,.12), interpret μ=4.8.','Across many groups of 40 arrivals, the average number late approaches 4.8.','Expected value is a long-run average, not a guaranteed group count.');
num('Application','Calculate','For X~B(40,.12), calculate the variance.',U.variance(40,.12),1e-8,'40(.12)(.88)=4.224.');
num('Application','Calculate','For X~B(40,.12), calculate the standard deviation.',U.sd(40,.12),1e-6,'√4.224≈2.055.',{calculator:'GDC allowed'});
short('Application','Determine','Find the mode(s) of X~B(19,.25).','4 and 5','(n+1)p=20(.25)=5 is integer, so modes are 4 and 5.');
num('Application','Solve','With p=.10, find the smallest n such that P(at least one success)≥.95.',U.thresholdAtLeastOne(.1,.95),0,'Solve 1−.9^n≥.95 and verify n−1 fails.',{calculator:'GDC required'});
num('Application','Calculate','A sample of 18 is taken from a population of 900. Enter the sampling fraction as a decimal.',18/900,1e-10,'18/900=.02.');
short('Application','Record','Write the TI-84 expression for P(X≥7) when X~B(20,.4).','1−binomcdf(20,.4,6)','The complement of X≥7 is X≤6.',{calculator:'TI-84 workflow'});
num('Application','Calculate','For X~B(12,.35), find P(X=3 | X≤3).',U.pmf(12,.35,3)/U.cdf(12,.35,3),1e-6,'Conditional probability is P(X=3)/P(X≤3).',{calculator:'GDC required'});
// REASONING · 4
mcq('Reasoning','Distinguish','Which pair is correct for an integer-valued X?',['P(X≥6)=1−F(6), P(X>6)=1−F(5)','P(X≥6)=1−F(5), P(X>6)=1−F(6)','Both use 1−F(6)','Both use 1−F(5)'],1,'At least includes 6; more than excludes 6.');
mcq('Reasoning','Explain','If success and failure labels are exchanged for X~B(n,p), the new success count Y has distribution',['B(n,p)','B(n,1−p)','B(1−n,p)','Geometric'],1,'Y=n−X and has success probability 1−p.');
mcq('Reasoning','Compare','B(12,.5) and B(20,.3) both have mean 6. Which statement is true?',['They are identical','They have the same variance','Their variances are 3 and 4.2','Their supports are identical'],2,'Variance is np(1−p), so equal means do not force equal spread.');
mcq('Reasoning','Interpret','A probability of .18 for exactly 9 successes means',['Exactly 18% of every group succeeds','In many repeated groups, about 18% have exactly 9 successes','Each trial has success probability .18','The mean is 9'],1,'Probability describes long-run relative frequency across repeated groups.');
})();
