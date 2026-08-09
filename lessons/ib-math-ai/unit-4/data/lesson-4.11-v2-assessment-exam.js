(function(){
'use strict';
const B=window.U411_ASSESS;if(!B)return;
const {data,U,D,qs}=B;

data.practice=qs;
data.practice_levels={Foundation:16,Application:20,Reasoning:18,Challenge:14,HOT:12};
data.lesson.practice_count=qs.length;

const ev=(name,value,d=6)=>`\\\\(${name}=${U.fmt(value,d)}\\\\)`;
const central90=U.central(.90,68,10);
const bottleOutside=1-U.prob(486,514,500,8);
const recoveredMu=U.solveMean(74,.84,8);

data.exam=[
{
 id:'U4-11-IB1',
 title:'Education City shuttle times',
 context:'Probability, expected count, and interpretation',
 calculator:'GDC required',
 total_marks:13,
 instructions:'Shuttle journey time X minutes is modelled by X~N(32,6²). During one month, 450 comparable journeys are recorded.',
 parts:[
  {label:'a',marks:2,prompt:'State the mean and standard deviation, with units.',answer:'μ=32 minutes, σ=6 minutes.',solution:'The second normal parameter is σ²=36, so the standard deviation is 6 minutes.'},
  {label:'b',marks:2,prompt:'Find P(X<35).',answer:ev('P(X<35)',U.cdf(35,32,6),6),solution:`normalcdf(−1E99,35,32,6)=${U.fmt(U.cdf(35,32,6),8)}.`},
  {label:'c',marks:2,prompt:'Find P(X>43).',answer:ev('P(X>43)',U.sf(43,32,6),6),solution:`normalcdf(43,1E99,32,6)=${U.fmt(U.sf(43,32,6),8)}.`},
  {label:'d',marks:3,prompt:'Find the expected number of journeys lasting from 35 to 43 minutes.',answer:`${U.fmt(450*U.prob(35,43,32,6),3)} journeys, approximately.`,solution:`450×normalcdf(35,43,32,6)=${U.fmt(450*U.prob(35,43,32,6),6)}; about ${Math.round(450*U.prob(35,43,32,6))} journeys.`},
  {label:'e',marks:2,prompt:'Interpret the answer to part (c) in context.',answer:`Approximately ${U.pct(U.sf(43,32,6),2)} of comparable shuttle journeys are modelled to exceed 43 minutes.`,solution:'State the percentage, journey-time context, and model language.'},
  {label:'f',marks:2,prompt:'State one piece of evidence that should be checked before relying on the model.',answer:'Check that observed journey times are roughly unimodal and symmetric without severe outliers or changing traffic regimes.',solution:'Normality is a model assumption requiring contextual/data support.'}
 ]
},
{
 id:'U4-11-IB2',
 title:'Assessment percentiles and cut scores',
 context:'Inverse normal and central intervals',
 calculator:'GDC required',
 total_marks:13,
 instructions:'Assessment score S is modelled by S~N(68,10²). Scores are recorded as whole numbers.',
 parts:[
  {label:'a',marks:2,prompt:'Find the 82nd percentile.',answer:`${U.fmt(U.inv(.82,68,10),4)} points.`,solution:`invNorm(.82,68,10)=${U.fmt(U.inv(.82,68,10),8)}.`},
  {label:'b',marks:2,prompt:'Find the continuous threshold for the top 10%.',answer:`${U.fmt(U.inv(.90,68,10),4)} points.`,solution:'Top .10 means lower-tail area .90.'},
  {label:'c',marks:1,prompt:'Find the smallest whole-number score that qualifies for the top 10% rule.',answer:`${Math.ceil(U.inv(.90,68,10))}`,solution:'Round upward because qualification requires a score at least as large as the continuous cut.'},
  {label:'d',marks:4,prompt:'Find the interval containing the middle 90% of scores.',answer:`${U.fmt(central90.lo,4)} to ${U.fmt(central90.hi,4)} points.`,solution:`Each tail is .05. Lower=invNorm(.05,68,10); upper=invNorm(.95,68,10).`},
  {label:'e',marks:2,prompt:'Explain why invNorm(.10,68,10) is not the top-10% threshold.',answer:'It returns the 10th percentile because .10 is cumulative area to the left.',solution:'The top-10% cut has .90 to its left.'},
  {label:'f',marks:2,prompt:'Give a symmetry check for part (d).',answer:'The two boundaries should be equally distant from 68 and should sum to 136.',solution:'Mirror quantiles p=.05 and p=.95 satisfy x_.05+x_.95=2μ.'}
 ]
},
{
 id:'U4-11-IB3',
 title:'Recovering an unknown mean',
 context:'Quantile equation and model verification',
 calculator:'GDC required',
 total_marks:12,
 instructions:'A continuous variable Y is normally distributed with standard deviation 8. It is known that P(Y<74)=0.84.',
 parts:[
  {label:'a',marks:2,prompt:'Find the standard-normal z-value corresponding to cumulative area 0.84.',answer:`z=${U.fmt(U.inv(.84),6)}`,solution:'Use invNorm(.84,0,1).'},
  {label:'b',marks:3,prompt:'Hence find the mean μ.',answer:`μ=${U.fmt(recoveredMu,5)}`,solution:`74=μ+z(.84)(8), so μ=74−8z=${U.fmt(recoveredMu,8)}.`},
  {label:'c',marks:2,prompt:'Verify the recovered model using a normalcdf command.',answer:`normalcdf(−1E99,74,${U.fmt(recoveredMu,8)},8)≈0.84`,solution:`The computed probability is ${U.fmt(U.cdf(74,recoveredMu,8),8)}.`},
  {label:'d',marks:2,prompt:'Find P(Y>80).',answer:ev('P(Y>80)',U.sf(80,recoveredMu,8),6),solution:`normalcdf(80,1E99,${U.fmt(recoveredMu,8)},8).`},
  {label:'e',marks:3,prompt:'Find the value exceeded by 5% of observations and interpret it.',answer:`${U.fmt(U.inv(.95,recoveredMu,8),4)}; about 5% are modelled above this value.`,solution:'Right tail .05 means lower-tail area .95.'}
 ]
},
{
 id:'U4-11-IB4',
 title:'Bottle-volume quality control',
 context:'Two tails, expected rejects, and threshold design',
 calculator:'GDC required',
 total_marks:14,
 instructions:'Bottle volume V mL is modelled by V~N(500,8²). A batch contains 1200 bottles. A bottle is rejected if its volume is below 486 mL or above 514 mL.',
 parts:[
  {label:'a',marks:3,prompt:'Find the rejection probability.',answer:ev('p',bottleOutside,7),solution:`p=1−normalcdf(486,514,500,8)=${U.fmt(bottleOutside,9)}.`},
  {label:'b',marks:2,prompt:'Find the expected number rejected.',answer:`${U.fmt(1200*bottleOutside,3)}; about ${Math.round(1200*bottleOutside)} bottles.`,solution:'Multiply the unrounded rejection probability by 1200.'},
  {label:'c',marks:2,prompt:'Are the two rejection tails equal? Justify.',answer:'Yes. The limits are 14 mL below and above μ=500, and the model is symmetric.',solution:'Equal standardized distances create equal tail areas.'},
  {label:'d',marks:3,prompt:'Find an upper warning limit exceeded by only 2% of bottles.',answer:`${U.fmt(U.inv(.98,500,8),4)} mL.`,solution:'A 2% right tail leaves .98 to the left; use invNorm(.98,500,8).'},
  {label:'e',marks:2,prompt:'If volumes are measured to the nearest 0.1 mL, state the warning limit suitably.',answer:`Approximately ${U.fmt(U.inv(.98,500,8),1)} mL.`,solution:'Round only the final boundary to the measurement precision.'},
  {label:'f',marks:2,prompt:'Explain why the expected count need not equal the observed rejected count.',answer:'It is a model-based long-run average; random sample variation remains.',solution:'Expected value is not a deterministic prediction.'}
 ]
},
{
 id:'U4-11-IB5',
 title:'Package mass and conditional selection',
 context:'Probability structure and model critique',
 calculator:'GDC required',
 total_marks:13,
 instructions:'Package mass M g is modelled by M~N(250,12²). A package is called heavy if M>260 g and very heavy if M>274 g.',
 parts:[
  {label:'a',marks:2,prompt:'Find the probability that a package is heavy.',answer:ev('P(M>260)',U.sf(260,250,12),6),solution:'Use normalcdf(260,1E99,250,12).'},
  {label:'b',marks:2,prompt:'Find the probability that a package is very heavy.',answer:ev('P(M>274)',U.sf(274,250,12),6),solution:'Use normalcdf(274,1E99,250,12).'},
  {label:'c',marks:3,prompt:'Given that a package is heavy, find the probability that it is very heavy.',answer:ev('P(M>274|M>260)',U.sf(274,250,12)/U.sf(260,250,12),6),solution:'Because very heavy is contained in heavy, divide P(M>274) by P(M>260).'},
  {label:'d',marks:2,prompt:'Find the mass below which the lightest 7% lie.',answer:`${U.fmt(U.inv(.07,250,12),4)} g.`,solution:'Use invNorm(.07,250,12).'},
  {label:'e',marks:2,prompt:'Explain why normalpdf(260,250,12) is not the answer to part (a).',answer:'normalpdf returns density height at 260, whereas part (a) asks for right-tail area.',solution:'Probability over an interval requires a CDF.'},
  {label:'f',marks:2,prompt:'State one limitation of using an unbounded normal model for mass.',answer:'It assigns tiny probability to impossible negative masses; usefulness depends on that tail being negligible and the observed distribution being approximately normal.',solution:'A mathematical model need not be literally true at extreme values to be useful in an appropriate range.'}
 ]
}
];
})();
