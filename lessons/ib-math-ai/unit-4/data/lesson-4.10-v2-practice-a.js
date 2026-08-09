(function(){
'use strict';
const B=window.U410_ASSESS;if(!B)return;
const {U,mcq,num,short,syntax}=B;
// FOUNDATION · 16
mcq('Foundation','Identify','Which experiment is binomial?',['Record the time until the first late bus','Count red cards in 12 independent issues with constant red probability','Sample 8 cards without replacement from a 20-card deck and count hearts exactly','Record ratings from 1 to 5'],1,'It has binary outcomes, plausible independence, fixed n=12, and constant p.');
mcq('Foundation','Identify','Which condition fails when trials continue until the first success?',['Binary outcomes','Independence','Fixed number of trials','Constant probability'],2,'The number of trials is random.');
mcq('Foundation','Define','Which is a valid binary success definition?',['Rating 1–5','Travel mode','Defective versus not defective','Exact arrival time'],2,'The two categories are success and failure.');
mcq('Foundation','Identify','Which statement most directly supports independence?',['The sample size is 20','Each unit is produced and tested separately','p=.04','There are two outcomes'],1,'Separate production and testing supports the independence assumption.');
mcq('Foundation','Identify','Which scenario violates constant p?',['Twenty identical four-option guesses','Ten shots under unchanged conditions','Questions with two, three, and four options all guessed randomly','Independent fair coin tosses'],2,'The success probability changes with the number of options.');
mcq('Foundation','State','For X~B(12,.4), which value is impossible?',['0','7','12','12.5'],3,'A binomial count takes integer values 0 through n.');
mcq('Foundation','Select','Which TI-84 command finds P(X=4) for X~B(10,.3)?',['binomcdf(10,.3,4)','binompdf(10,.3,4)','1−binomcdf(10,.3,3)','normalcdf(4,4,3,10)'],1,'Exactly one count uses binompdf.');
mcq('Foundation','Select','Which TI-84 command finds the probability of at most 4 successes for X~B(10,.3)?',['binomcdf(10,.3,4)','binompdf(10,.3,4)','1−binomcdf(10,.3,4)','binomcdf(10,.3,3)'],0,'At most 4 is the lower cumulative through 4.');
mcq('Foundation','Translate','For an integer-valued X, X<6 is equivalent to',['X≤6','X≤5','X≥6','X=5'],1,'The largest included integer is 5.');
mcq('Foundation','Select','Which expression finds P(X≥6) for X~B(14,.5)?',['1−binomcdf(14,.5,6)','1−binomcdf(14,.5,5)','binomcdf(14,.5,6)','binompdf(14,.5,6)'],1,'At least 6 has complement X≤5.');
mcq('Foundation','Select','Which expression finds the probability of more than 6 successes for X~B(14,.5)?',['1−binomcdf(14,.5,5)','1−binomcdf(14,.5,6)','binomcdf(14,.5,6)','binompdf(14,.5,7) only'],1,'More than 6 has complement X≤6.');
mcq('Foundation','Select','Which expression finds P(3≤X≤7) for X~B(10,.4)?',['F(7)−F(3)','F(7)−F(2)','F(6)−F(3)','F(10)−F(2)'],1,'Subtract values below 3, namely X≤2.');
num('Foundation','Calculate','For X~B(18,.35), enter the mean.',U.mean(18,.35),1e-10,'μ=np=18(.35)=6.3.');
num('Foundation','Calculate','For X~B(18,.35), enter the variance.',U.variance(18,.35),1e-10,'Var(X)=np(1−p)=18(.35)(.65).');
num('Foundation','Calculate','For X~B(18,.35), enter the standard deviation.',U.sd(18,.35),1e-6,'σ=√[18(.35)(.65)].',{calculator:'GDC allowed'});
mcq('Foundation','Determine','For X~B(10,.30), what is the unique mode?',['2','3','4','Modes 2 and 3'],1,'(n+1)p=3.3 is not integer; floor(3.3)=3.');
// APPLICATION · 4
num('Application','Calculate','For X~B(9,.40), find P(X=3).',U.pmf(9,.4,3),1e-6,'Use binompdf(9,.4,3).',{calculator:'GDC required'});
num('Application','Calculate','For X~B(15,.20), find P(X≤4).',U.cdf(15,.2,4),1e-6,'Use binomcdf(15,.2,4).',{calculator:'GDC required'});
num('Application','Calculate','For X~B(10,.30), find P(X≥5).',U.event(10,.3,'atLeast',5),1e-6,'Use 1−binomcdf(10,.3,4).',{calculator:'GDC required'});
num('Application','Calculate','For X~B(18,.50), find P(7≤X≤11).',U.event(18,.5,'between',7,11),1e-6,'Use F(11)−F(6).',{calculator:'GDC required'});
})();
