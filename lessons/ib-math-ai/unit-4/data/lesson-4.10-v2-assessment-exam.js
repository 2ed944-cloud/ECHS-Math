(function(){
'use strict';
const B=window.U410_ASSESS;if(!B)return;
const {data,U}=B;
const p=(v,d=7)=>U.fmt(v,d);

data.exam=[
{
 id:'IBAI-U4-L4-10-IB1',title:'Free-throw performance',context:'Complete binomial workflow',calculator:'GDC required',total_marks:15,
 instructions:'A player takes 12 free throws. Treat the attempts as independent and suppose the probability of making each throw is 0.72. Let X be the number made.',
 parts:[
  {label:'a',marks:3,prompt:'State the distribution of X and justify the model using the four BINS conditions.',answer:'X~B(12,0.72); made/missed, independent attempts, fixed n=12, constant p=0.72.',solution:'Define success and address all four conditions in context.'},
  {label:'b',marks:2,prompt:'Find P(X=9).',answer:p(U.pmf(12,.72,9)),solution:`binompdf(12,.72,9)=${p(U.pmf(12,.72,9),9)}.`},
  {label:'c',marks:2,prompt:'Find P(X≥10).',answer:p(U.event(12,.72,'atLeast',10)),solution:`1−binomcdf(12,.72,9)=${p(U.event(12,.72,'atLeast',10),9)}.`},
  {label:'d',marks:3,prompt:'Find the mean and standard deviation.',answer:`μ=8.64, σ=${p(U.sd(12,.72),5)}`,solution:'μ=12(.72)=8.64 and σ=√[12(.72)(.28)].'},
  {label:'e',marks:2,prompt:'Find the mode.',answer:'9',solution:'(n+1)p=13(.72)=9.36 is not integer, so the unique mode is floor(9.36)=9.'},
  {label:'f',marks:3,prompt:'Interpret the answer to part (c) in context and state one modelling limitation.',answer:`The probability of making at least 10 of 12 throws is about ${p(U.event(12,.72,'atLeast',10),4)}; actual attempts may not be independent or have constant p.`,solution:'Interpret the event, not the calculator command, and identify a plausible BINS limitation.'}
 ]
},
{
 id:'IBAI-U4-L4-10-IB2',title:'Sensor quality control',context:'Rare-event probabilities and complements',calculator:'GDC required',total_marks:14,
 instructions:'Twenty independently manufactured sensors are tested. Each has probability 0.04 of being defective. Let X be the number defective.',
 parts:[
  {label:'a',marks:2,prompt:'State the distribution of X and its support.',answer:'X~B(20,0.04), with X∈{0,1,…,20}.',solution:'The random variable counts defective sensors.'},
  {label:'b',marks:2,prompt:'Find P(X≤1).',answer:p(U.cdf(20,.04,1)),solution:`binomcdf(20,.04,1)=${p(U.cdf(20,.04,1),9)}.`},
  {label:'c',marks:2,prompt:'Find P(X≥2).',answer:p(U.event(20,.04,'atLeast',2)),solution:`1−binomcdf(20,.04,1)=${p(U.event(20,.04,'atLeast',2),9)}.`},
  {label:'d',marks:2,prompt:'Find P(X≥1) using a complement.',answer:p(1-.96**20),solution:`1−P(X=0)=1−.96^20=${p(1-.96**20,9)}.`},
  {label:'e',marks:2,prompt:'Explain why the CDF boundary in part (c) is 1 rather than 2.',answer:'The complement of X≥2 is X≤1.',solution:'The first included value in the upper tail is not included in the lower-tail complement.'},
  {label:'f',marks:2,prompt:'Find P(X=1 | X≤1).',answer:p(U.pmf(20,.04,1)/U.cdf(20,.04,1)),solution:'Divide P(X=1) by P(X≤1).'},
  {label:'g',marks:2,prompt:'State one reason the historical value p=0.04 might fail for a new production batch.',answer:'A change in materials, calibration, environment, or process could change the defect probability.',solution:'The constant-p assumption must be justified by current process conditions.'}
 ]
},
{
 id:'IBAI-U4-L4-10-IB3',title:'Proposal support survey',context:'Interval probability and distribution features',calculator:'GDC required',total_marks:15,
 instructions:'A random sample of 30 residents is selected independently from a large population. Historical evidence gives probability 0.60 that a selected resident supports a proposal. Let X be the number who support it.',
 parts:[
  {label:'a',marks:3,prompt:'Explain why a binomial model is reasonable and state the distribution.',answer:'Support/not, independent random selections, n=30 fixed, common p=.60; X~B(30,.60).',solution:'Address all four BINS conditions.'},
  {label:'b',marks:3,prompt:'Find P(16≤X≤21), showing the calculator expression.',answer:p(U.event(30,.6,'between',16,21)),solution:`binomcdf(30,.6,21)−binomcdf(30,.6,15)=${p(U.event(30,.6,'between',16,21),9)}.`},
  {label:'c',marks:2,prompt:'Find P(X>20).',answer:p(U.event(30,.6,'moreThan',20)),solution:`1−binomcdf(30,.6,20)=${p(U.event(30,.6,'moreThan',20),9)}.`},
  {label:'d',marks:3,prompt:'Find and interpret the mean and standard deviation.',answer:`μ=18; σ=${p(U.sd(30,.6),5)}.`,solution:'Across repeated samples the average support count approaches 18; σ describes typical sample-to-sample variation in counts.'},
  {label:'e',marks:2,prompt:'Find the mode.',answer:'18',solution:'(31)(.6)=18.6, so the unique mode is floor(18.6)=18.'},
  {label:'f',marks:2,prompt:'Interpret the answer to part (b).',answer:`There is about a ${U.pct(U.event(30,.6,'between',16,21),2)} chance that 16 through 21 of the 30 selected residents support the proposal.`,solution:'Use sample-count context and include both endpoints.'}
 ]
},
{
 id:'IBAI-U4-L4-10-IB4',title:'Recovering a hidden binomial model',context:'Parameters from mean and variance',calculator:'GDC required',total_marks:14,
 instructions:'A binomial random variable X has mean 9.6 and variance 5.76.',
 parts:[
  {label:'a',marks:3,prompt:'Show that p=0.40.',answer:'p=1−5.76/9.6=0.40.',solution:'Since variance/mean=1−p.'},
  {label:'b',marks:2,prompt:'Find n and state the distribution.',answer:'n=24; X~B(24,0.40).',solution:'n=μ/p=9.6/.4=24.'},
  {label:'c',marks:3,prompt:'Find P(X≥12).',answer:p(U.event(24,.4,'atLeast',12)),solution:`1−binomcdf(24,.4,11)=${p(U.event(24,.4,'atLeast',12),9)}.`},
  {label:'d',marks:2,prompt:'Find the mode(s).',answer:'9 and 10',solution:'(24+1)(.4)=10 is an integer, so the adjacent modes are 9 and 10.'},
  {label:'e',marks:2,prompt:'Explain why there are two modes rather than one.',answer:'Because (n+1)p=10 is an integer, the adjacent counts 9 and 10 have equal maximum probability.',solution:'For a binomial distribution, integer m=(n+1)p gives modes m−1 and m.'},
  {label:'f',marks:2,prompt:'Explain why mean 9.6 does not imply a possible observed value of 9.6.',answer:'X is an integer count; 9.6 is a long-run average.',solution:'Separate support from expectation.'}
 ]
},
{
 id:'IBAI-U4-L4-10-IB5',title:'Finite-population inspection',context:'Exact hypergeometric versus binomial approximation',calculator:'GDC required',total_marks:15,
 instructions:'A warehouse contains 800 components, of which 64 are defective. Twenty components are sampled without replacement. Let X be the number defective in the sample.',
 parts:[
  {label:'a',marks:2,prompt:'Explain why X is not exactly binomial.',answer:'Without replacement, the selections are dependent and the defect probability changes after each draw.',solution:'Identify the failed I and S conditions.'},
  {label:'b',marks:2,prompt:'Calculate the sampling fraction and comment on a binomial approximation.',answer:'20/800=0.025=2.5%; the approximation is plausible under the common 10% guideline.',solution:'Small sampling fraction means weak dependence.'},
  {label:'c',marks:3,prompt:'Find the exact hypergeometric probability P(X=2).',answer:p(U.hypergeomPmf(800,64,20,2)),solution:`C(64,2)C(736,18)/C(800,20)=${p(U.hypergeomPmf(800,64,20,2),9)}.`},
  {label:'d',marks:2,prompt:'Use B(20,0.08) to approximate P(X=2).',answer:p(U.pmf(20,.08,2)),solution:`binompdf(20,.08,2)=${p(U.pmf(20,.08,2),9)}.`},
  {label:'e',marks:2,prompt:'Find the absolute approximation error in part (d).',answer:p(Math.abs(U.hypergeomPmf(800,64,20,2)-U.pmf(20,.08,2))),solution:'Subtract the unrounded exact and approximate probabilities, then take the absolute value.'},
  {label:'f',marks:2,prompt:'Find the exact probability P(X≤2).',answer:p(U.hypergeomRange(800,64,20,0,2)),solution:'Add the exact hypergeometric probabilities for x=0,1,2.'},
  {label:'g',marks:2,prompt:'Write a precise conclusion about the approximation.',answer:'The binomial value is close because the sample is only 2.5% of the population, but it remains an approximation; the hypergeometric model is exact.',solution:'Distinguish numerical closeness from model exactness.'}
 ]
}
];
})();
