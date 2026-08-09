(function(){
'use strict';
const B=window.U411_ASSESS;if(!B)return;
const {U,D,qs,mcq,num,short}=B;

// FOUNDATION · 16
mcq('Foundation','Interpret','In \\(X\sim N(50,7^2)\\), the second parameter shown is',['the standard deviation','the variance','the range','the median'],1,'Normal notation is N(μ,σ²).',{calculator:'No GDC'});
num('Foundation','Identify','For \\(X\sim N(50,7^2)\\), what value belongs in the calculator σ field?',7,0,'The calculator requests the standard deviation, not the variance.',{calculator:'No GDC'});
num('Foundation','Recall','Enter the total area under any probability density curve.',1,0,'Total probability is 1.',{calculator:'No GDC'});
num('Foundation','Explain','For a continuous normal model, enter \\(P(X=42)\\).',0,0,'A single point has zero width and therefore zero area.',{calculator:'No GDC'});
mcq('Foundation','Select','Which command finds \\(P(X&lt;40)\\) for \\(X\sim N(32,6^2)\\)?',['normalcdf(40,1E99,32,6)','normalcdf(−1E99,40,32,6)','invNorm(.40,32,6)','normalcdf(−1E99,40,32,36)'],1,'A lower tail runs from negative infinity to 40, and σ=6.');
mcq('Foundation','Select','Which command finds \\(P(X&gt;40)\\) for \\(X\sim N(32,6^2)\\)?',['normalcdf(40,1E99,32,6)','normalcdf(−1E99,40,32,6)','invNorm(.60,32,6)','normalcdf(40,−1E99,32,6)'],0,'An upper tail runs from 40 to positive infinity.');
mcq('Foundation','Select','Which command finds \\(P(20&lt;X&lt;35)\\) for \\(X\sim N(28,4^2)\\)?',['normalcdf(20,35,28,4)','normalcdf(−1E99,20,28,4)','normalcdf(35,20,28,4)','invNorm(.20,.35,28)'],0,'Use the two finite bounds in increasing order.');
mcq('Foundation','Structure','Which expression finds \\(P(X&lt;a\text{ or }X&gt;b)\\)?',['normalcdf(a,b,μ,σ)','1−normalcdf(a,b,μ,σ)','invNorm(a,b,μ)','normalcdf(b,a,μ,σ)'],1,'Outside is the complement of the middle interval.');
mcq('Foundation','Interpret','A z-score of −1.7 means the value is',['1.7 units below the mean','1.7 standard deviations below the mean','1.7 standard deviations above the mean','in the lower 1.7%'],1,'z measures signed distance in standard deviations.',{calculator:'No GDC'});
mcq('Foundation','Interpret','The 73rd percentile corresponds to which invNorm area?',['.27','.50','.73','73'],2,'A percentile is a lower-tail cumulative area.');
num('Foundation','Convert','For a threshold marking the top 8%, enter the portable lower-tail invNorm area.',.92,.000001,'1−.08=.92.',{calculator:'No GDC'});
num('Foundation','Convert','For the middle 90%, enter the area in each tail.',.05,.000001,'(1−.90)/2=.05.',{calculator:'No GDC'});
mcq('Foundation','Estimate','Approximately what proportion lies within one standard deviation of the mean?',['.50','.68','.90','.997'],1,'The empirical-rule estimate is about 68%.',{calculator:'No GDC'});
mcq('Foundation','Evaluate','Which setting most strongly supports a normal model?',['Strongly right-skewed counts','Two distinct clusters','Roughly symmetric unimodal continuous measurements','Categorical colour labels'],2,'A normal model is most defensible for roughly symmetric unimodal continuous data.',{calculator:'No GDC'});
mcq('Foundation','Recall','On a TI‑84, 1E99 is used as',['the variance','a practical positive-infinity bound','a probability','the 99th percentile'],1,'1E99 is an extremely large number used as a bound.');
mcq('Foundation','Choose','Which function reverses a known cumulative area to find x?',['normalpdf','normalcdf','invNorm','1-Var Stats'],2,'invNorm maps area to a boundary.');

// APPLICATION · first 12
num('Application','Calculate','For \\(X\sim N(32,6^2)\\), find \\(P(X&lt;35)\\).',U.cdf(35,32,6),.0005,'normalcdf(−1E99,35,32,6).',{calculator:'GDC required'});
num('Application','Calculate','For \\(X\sim N(32,6^2)\\), find \\(P(X&gt;40)\\).',U.sf(40,32,6),.0005,'normalcdf(40,1E99,32,6).',{calculator:'GDC required'});
num('Application','Calculate','For \\(V\sim N(500,8^2)\\), find \\(P(490&lt;V&lt;506)\\).',U.prob(490,506,500,8),.0005,'normalcdf(490,506,500,8).',{calculator:'GDC required'});
num('Application','Calculate','For \\(H\sim N(172,7^2)\\), find \\(P(H&lt;158\text{ or }H&gt;186)\\).',1-U.prob(158,186,172,7),.0005,'Use 1−normalcdf(158,186,172,7).',{calculator:'GDC required'});
num('Application','Standardize','For \\(X\sim N(32,6^2)\\), find the z-score of x=44.',2,.000001,'(44−32)/6=2.',{calculator:'No GDC'});
num('Application','Unstandardize','Scores have μ=68 and σ=10. Find x when z=1.4.',82,.000001,'x=68+1.4(10)=82.',{calculator:'No GDC'});
num('Application','Find','For \\(S\sim N(68,10^2)\\), find the 70th percentile.',U.inv(.70,68,10),.02,'invNorm(.70,68,10).',{calculator:'GDC required'});
num('Application','Find','For \\(H\sim N(172,7^2)\\), find the 25th percentile.',U.inv(.25,172,7),.02,'invNorm(.25,172,7).',{calculator:'GDC required'});
num('Application','Find','For \\(S\sim N(68,10^2)\\), find the cut score for the top 15%.',U.inv(.85,68,10),.02,'Top .15 means left area .85.',{calculator:'GDC required'});
num('Application','Find','For \\(B\sim N(11.5,1.2^2)\\), find the lower boundary of the middle 80%.',U.central(.80,11.5,1.2).lo,.01,'Each tail is .10; use invNorm(.10,11.5,1.2).',{calculator:'GDC required'});
num('Application','Find','For \\(B\sim N(11.5,1.2^2)\\), find the upper boundary of the middle 80%.',U.central(.80,11.5,1.2).hi,.01,'Use invNorm(.90,11.5,1.2).',{calculator:'GDC required'});
num('Application','Calculate','For \\(V\sim N(500,8^2)\\), how many of 300 bottles are expected below 488 mL?',300*U.cdf(488,500,8),.15,'Multiply the unrounded lower-tail probability by 300.',{calculator:'GDC required'});
})();
