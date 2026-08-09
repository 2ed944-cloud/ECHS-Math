(function(){'use strict';const B=window.U415_ASSESS;if(!B)return;const {data,U,D,qs,mcq,num,short}=B;
data.practice=qs;data.practice_levels={Foundation:16,Application:20,Reasoning:18,Challenge:14,HOT:12};data.lesson.practice_count=qs.length;
const ev=(r,d=5)=>`\\(\\chi^2=${U.fmt(r.stat,d)},\\ p=${U.fmt(r.p,d)},\\ df=${r.df}\\)`;
data.exam=[
{id:'U4-15-IB1',title:'ECHS transport model',context:'Complete GOF workflow',calculator:'GDC required',total_marks:13,instructions:'A random sample of 120 students gives counts 60 bus, 32 car, 18 metro, 10 walk. The planning model is 0.40,0.25,0.20,0.15. Use 5%.',parts:[
{label:'a',marks:2,prompt:'State contextual H₀ and H₁.',answer:'H₀: population distribution is 0.40,0.25,0.20,0.15; H₁: it is not.',solution:'State the complete population model under H₀ and a global departure under H₁.'},
{label:'b',marks:3,prompt:'Find expected counts and check the frequency condition.',answer:'48,30,24,18; all >5.',solution:'Multiply each probability by 120; the expected total is 120 and min E=18.'},
{label:'c',marks:1,prompt:'State df.',answer:'3',solution:'df=4−1=3.'},
{label:'d',marks:3,prompt:'Carry out the TI-84 test and record setup and output.',answer:ev(D.transport.r,6),solution:`L1={60,32,18,10}, L2={48,30,24,18}, df=3; output ${ev(D.transport.r,6)}.`},
{label:'e',marks:2,prompt:'State the decision and conclusion.',answer:'Reject H₀; sufficient evidence that the population distribution differs.',solution:`Because p=${U.fmt(D.transport.r.p,6)}<.05, reject H₀ and conclude in population context.`},
{label:'f',marks:2,prompt:'Identify the two largest contributions and directions.',answer:'Walk underrepresented; Bus overrepresented.',solution:'Walk contributes 3.5556 with O<E; Bus contributes 3.000 with O>E.'}]},
{id:'U4-15-IB2',title:'Jersey inventory proportions',context:'Non-integer expectations and non-rejection',calculator:'GDC required',total_marks:12,instructions:'Historical proportions XS,S,M,L,XL are .12,.20,.30,.25,.13. A random sample of 180 gives 21,37,56,42,24.',parts:[
{label:'a',marks:2,prompt:'Why is this GOF rather than independence?',answer:'One categorical variable is compared with a stated distribution.',solution:'Only jersey size is measured; there is no second categorical variable.'},
{label:'b',marks:3,prompt:'Find E and comment on non-integer expectations.',answer:'21.6,36,54,45,23.4; non-integers are valid.',solution:'Expected frequencies are model averages and need not be integers; all exceed 5.'},
{label:'c',marks:3,prompt:'Carry out the test.',answer:ev(D.jersey.r,6),solution:`Use df=4. Output: ${ev(D.jersey.r,6)}.`},
{label:'d',marks:2,prompt:'Conclude at 10%.',answer:'Do not reject H₀; insufficient evidence of a different population size distribution.',solution:`p=${U.fmt(D.jersey.r.p,6)}>.10.`},
{label:'e',marks:2,prompt:'Why is this not proof of exact fit?',answer:'Non-rejection may reflect limited power and does not establish equality.',solution:'Compatibility with H₀ is not probability or proof of H₀.'}]},
{id:'U4-15-IB3',title:'Strong model departure',context:'Critical value and diagnosis',calculator:'GDC required',total_marks:13,instructions:'P=(.35,.30,.20,.15), O=(62,18,11,9), n=100. Use 1%.',parts:[
{label:'a',marks:3,prompt:'Find E and verify conditions.',answer:'35,30,20,15; all >5.',solution:'Multiply probabilities by 100.'},
{label:'b',marks:3,prompt:'Calculate the four contributions and χ².',answer:'20.8286,4.8,4.05,2.4; χ²=32.0786.',solution:'Apply (O−E)²/E to each category and sum.'},
{label:'c',marks:2,prompt:'The 1% critical value for df=3 is 11.345. Decide.',answer:'Reject H₀.',solution:'32.0786>11.345.'},
{label:'d',marks:2,prompt:'Record the GDC p-value and confirm.',answer:`p=${U.fmt(D.strong.r.p,8)}`,solution:`${ev(D.strong.r,8)}; p<.01.`},
{label:'e',marks:2,prompt:'Which category drives the result and in which direction?',answer:'A; overrepresented.',solution:'A contributes about 20.83 and O=62>E=35.'},
{label:'f',marks:1,prompt:'State one unsupported conclusion.',answer:'The test cannot establish the cause.',solution:'GOF detects mismatch, not mechanism.'}]},
{id:'U4-15-IB4',title:'Sparse rare outcomes',context:'Validity audit and regrouping',calculator:'GDC required',total_marks:12,instructions:'P=(.90,.06,.03,.01), O=(91,6,2,1), n=100.',parts:[
{label:'a',marks:2,prompt:'Find E.',answer:'90,6,3,1.',solution:'E=np.'},
{label:'b',marks:2,prompt:'Why is the ordinary SL conclusion invalid?',answer:'E=3 and E=1 are not >5.',solution:'The chi-square approximation condition fails.'},
{label:'c',marks:2,prompt:'Why can a calculator p-value not be used to accept H₀?',answer:'The condition fails and non-rejection is never proof.',solution:'Software output does not repair validity.'},
{label:'d',marks:2,prompt:'If context justifies Common versus non-common, state new O,E,df.',answer:'O=(91,9), E=(90,10), df=1.',solution:'Combine the final three categories and probabilities.'},
{label:'e',marks:2,prompt:'Carry out the regrouped test.',answer:ev(U.gof([91,9],[.9,.1]),6),solution:`${ev(U.gof([91,9],[.9,.1]),6)}.`},
{label:'f',marks:2,prompt:'Why is this a different question?',answer:'It tests a coarser two-category model and loses detail among rare categories.',solution:'Grouping changes k, df, model, and interpretation.'}]}
];
})();
