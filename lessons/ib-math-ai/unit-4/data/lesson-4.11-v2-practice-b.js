(function(){
'use strict';
const B=window.U411_ASSESS;if(!B)return;
const {U,D,qs,mcq,num,short}=B;

// APPLICATION · remaining 8 (total Application = 20)
num('Application','Calculate','Laboratory temperature is \\(T\sim N(21.5,1.8^2)\\). Find \\(P(T&lt;20)\\).',U.cdf(20,21.5,1.8),.0005,'normalcdf(−1E99,20,21.5,1.8).',{calculator:'GDC required'});
num('Application','Calculate','Battery life is \\(B\sim N(11.5,1.2^2)\\). Find \\(P(10&lt;B&lt;13)\\).',U.prob(10,13,11.5,1.2),.0005,'normalcdf(10,13,11.5,1.2).',{calculator:'GDC required'});
num('Application','Calculate','Package mass is \\(M\sim N(250,12^2)\\). Find \\(P(M&gt;270)\\).',U.sf(270,250,12),.0005,'normalcdf(270,1E99,250,12).',{calculator:'GDC required'});
num('Application','Find','Delivery time is \\(D\sim N(28,4.5^2)\\). Find the 60th percentile.',U.inv(.60,28,4.5),.02,'invNorm(.60,28,4.5).',{calculator:'GDC required'});
num('Application','Find','Package mass is \\(M\sim N(250,12^2)\\). Find the boundary for the bottom 5%.',U.inv(.05,250,12),.02,'invNorm(.05,250,12).',{calculator:'GDC required'});
num('Application','Find','For \\(S\sim N(68,10^2)\\), find the lower boundary of the middle 95%.',U.central(.95,68,10).lo,.02,'Each tail is .025; lower=invNorm(.025,68,10).',{calculator:'GDC required'});
num('Application','Find','For \\(S\sim N(68,10^2)\\), find the upper boundary of the middle 95%.',U.central(.95,68,10).hi,.02,'Upper=invNorm(.975,68,10).',{calculator:'GDC required'});
num('Application','Calculate','For \\(V\sim N(500,8^2)\\), find the expected number outside 486–514 mL in 240 bottles.',240*(1-U.prob(486,514,500,8)),.15,'240[1−normalcdf(486,514,500,8)].',{calculator:'GDC required'});

// REASONING · 18
num('Reasoning','Reason','For any normal distribution, enter \\(P(X&lt;\mu)\\).',.5,0,'Symmetry places half the area on each side of μ.',{calculator:'No GDC'});
mcq('Reasoning','Use symmetry','For a normal distribution, which equality is always true?',['P(X<μ−k)=P(X<μ+k)','P(X<μ−k)=P(X>μ+k)','P(X>μ−k)=P(X>μ+k)','P(X=μ−k)=P(X=μ+k)>0'],1,'Mirror tails at equal distances from μ have equal area.',{calculator:'No GDC'});
mcq('Reasoning','Compare','In the same normal distribution, which lower-tail probability is larger?',['P(X<μ−σ)','P(X<μ+0.4σ)','They are equal','Cannot tell'],1,'A larger boundary has a larger cumulative probability.',{calculator:'No GDC'});
mcq('Reasoning','Audit','What is wrong with normalcdf(40,20,30,5)?',['Mean is missing','Bounds are reversed','σ must be 25','Nothing'],1,'The lower bound must be less than the upper bound.');
mcq('Reasoning','Audit','For \\(X\sim N(30,5^2)\\), which calculator parameter pair is correct?',['μ=30,σ=25','μ=30,σ=5','μ=5,σ=30','μ=25,σ=5'],1,'The calculator requests μ and σ, not variance.');
mcq('Reasoning','Explain','Why is \\(P(X&lt;10)=P(X\le10)\\) for a continuous normal model?',['The curve is symmetric','P(X=10)=0','10 is below μ','The SD is positive'],1,'A single endpoint contributes zero area.',{calculator:'No GDC'});
mcq('Reasoning','Verify','Which two commands are equivalent for \\(X\sim N(32,6^2)\\) and x=41?',['normalcdf(−1E99,41,32,6) and normalcdf(−1E99,1.5,0,1)','normalcdf(−1E99,41,0,1) and invNorm(.41,32,6)','normalcdf(41,1E99,32,6) and normalcdf(−1E99,1.5,0,1)','invNorm(.5,32,6) and normalcdf(−1E99,41,32,6)'],0,'41 corresponds to z=(41−32)/6=1.5.');
num('Reasoning','Convert','A threshold leaves 6% above it. Enter the portable invNorm lower-tail area.',.94,.000001,'1−.06=.94.',{calculator:'No GDC'});
num('Reasoning','Convert','For the middle 86%, enter the area in each tail.',.07,.000001,'(1−.86)/2=.07.',{calculator:'No GDC'});
mcq('Reasoning','Order','Which statement is correct?',['The 30th percentile exceeds the 70th','The 70th percentile exceeds the 30th','Both equal μ','Order depends on σ'],1,'The inverse CDF is increasing.',{calculator:'No GDC'});
mcq('Reasoning','Locate','A quantile has cumulative area .08. Relative to μ it must be',['above μ','equal to μ','below μ','at μ+σ'],2,'Any cumulative area below .5 gives a value below the mean.',{calculator:'No GDC'});
num('Reasoning','Solve','A normal variable has σ=8 and \\(P(X&lt;74)=.84\\). Find μ.',U.solveMean(74,.84,8),.03,'Find z=.84 quantile, then μ=74−8z.',{calculator:'GDC required'});
num('Reasoning','Solve','A normal variable has μ=50 and \\(P(X&lt;62)=.90\\). Find σ.',U.solveSd(62,.90,50),.03,'σ=(62−50)/z_.90.',{calculator:'GDC required'});
num('Reasoning','Infer','A normal variable has 10th percentile 48 and 90th percentile 72. Find μ.',60,.0001,'Symmetric percentile boundaries have midpoint μ=(48+72)/2.',{calculator:'No GDC'});
mcq('Reasoning','Evaluate','A normal model for a nonnegative measurement has μ=100 and σ=4. Which statement is best?',['The model is impossible because normals include negatives','The negative tail is negligible, so the model may be useful in the relevant range','All nonnegative data are normal','σ should be squared before judging'],1,'A model can be useful when impossible-tail probability is negligible and shape evidence supports it.',{calculator:'No GDC'});
mcq('Reasoning','Interpret','An expected count is 16.7. Which statement is valid?',['Exactly 16.7 items will occur','Exactly 17 items will occur','About 17 items are expected in repeated comparable samples','The event probability is 16.7'],2,'An expected count is a long-run/model average, not a guaranteed observed count.',{calculator:'No GDC'});
mcq('Reasoning','Round','A continuous cut score is 80.815, but only integer scores occur and qualification means at least the cut. What is the first qualifying score?',['80','80.8','81','82'],2,'Directional rounding gives the smallest integer not below the cut.',{calculator:'No GDC'});
mcq('Reasoning','Distinguish','Which statement correctly separates density and probability?',['Density at x equals P(X=x)','Probability is area over an interval; density is curve height','Density must be below 1','A taller curve always has more total area'],1,'Continuous probability is area; the density height is not a point probability.',{calculator:'No GDC'});
})();
