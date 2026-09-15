/** Original AP1.11 teaching activities, without restricted assessment material. */
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
export const AP_EQUIVALENCE_CONTENT=freeze({
 'ap-equivalent-forms':{
  version:'echs.lesson-investigation.v1',id:'ap-precalculus-1.11-equivalent-forms',title:'Choose a useful form and keep its domain',course:'AP Precalculus',topic:'1.11',
  curriculum:{version:'ap-precalculus-2026-27',assessedOnExam:true,learningObjectives:['1.11.A','1.11.B','1.11.C'],essentialKnowledge:['1.11.A.1','1.11.A.2','1.11.A.3','1.11.B.1','1.11.B.2','1.11.C.1'],practices:['1.B','3.B','3.C']},
  pin:{kind:'reviewed-existing-lesson-before-addition',path:'lessons/ap-precalculus/unit-1/AP_Precalculus_1.11_Equivalent_Representations_of_Polynomial_and_Rational_Expressions_ECHS_Refined.html',sha256:'ceba826c2f3439cad3c436b8e37423961a91cd37b3382ebd4d81671e24cdfc37'},
  sourceRefs:[
   {title:'AP Precalculus CED, effective Fall 2026, Topic 1.11',url:'https://apcentral.collegeboard.org/media/pdf/ap-precalculus-course-and-exam-description.pdf',checked:'2026-09-14'},
   {title:'AP Precalculus clarifications effective Fall 2026',url:'https://apcentral.collegeboard.org/media/pdf/ap-precalculus-ced-clarification-and-guidance-effective-fall-2026.pdf',checked:'2026-09-14'}
  ],
  provenance:{type:'original-teaching-examples',restrictedMaterialCopied:false,awardsMastery:false,calculatorPolicy:'calculator_optional'},
  scenes:[
   {id:'equivalence-warmup',title:'What does each representation reveal?',kind:'warmup',model:null,
    text:['The polynomial P(x)=(x−2)(x+1) can also be written x²−x−2. Factored and expanded forms represent the same polynomial on all real inputs.','Now consider R(x)=P(x)/(x−2). A quotient introduces a domain restriction that expansion or cancellation cannot remove.'],
    prompts:['Use one form to find the zeros of P, and another to describe its end behavior.','Rewrite R in a simpler form with its complete original domain.','Are R and the polynomial Q(x)=x+1 the same function when Q has domain ℝ?'],
    worked:['Factoring shows the zeros −1 and 2. The expanded leading term x² shows that P increases without bound at both ends.','R(x)=x+1 for x≠2. Its graph has a hole at (2,3), and its only valid zero is −1.','They agree at every input in the domain of R, but their domains differ. Q includes the point (2,3), so the two functions are not identical.'],initial:{},controls:[]},
   {id:'equivalence-division-explorer',title:'A quotient, a remainder and a missing input',kind:'discover',model:'equivalence',family:'quotient-remainder',
    text:['The declared family is P(x)=(ax+b)(x−c)+r and R(x)=P(x)/(x−c), with x≠c. Start with a=1, b=1, c=2 and r=3.','Use the expanded numerator, division identity, trend and table to check one another. The quantity R(x)−(ax+b) is r/(x−c), so its end limit is zero.'],
    prompts:['Expand the starting numerator and identify the quotient and remainder. Check R(1) and R(3).','Set r=0 while keeping a=1, b=1 and c=2. What happens at x=2?','Set a=0 while b=1. Is the quotient trend still a slant line? Then set a=b=r=0 and classify the numerator.'],
    worked:['P(x)=x²−x+1. The quotient is x+1 and the remainder is 3; R(1)=−1 and R(3)=7.','The reduced rule agrees with x+1 away from 2. At 2 the original function is undefined, with a hole at (2,3); a zero remainder does not restore the input.','When a=0 and b=1, the trend is horizontal y=1. When a=b=r=0, the numerator is the zero polynomial, whose degree is undefined; the function is zero on its original domain.'],
    initial:{a:1,b:1,c:2,r:3},controls:[
     {key:'a',label:'Quotient slope a',min:-4,max:4,step:0.25},
     {key:'b',label:'Quotient intercept b',min:-4,max:4,step:0.25},
     {key:'c',label:'Excluded input c',min:-4,max:4,step:0.25},
     {key:'r',label:'Remainder r',min:-4,max:4,step:0.25}
    ]},
   {id:'equivalence-notes',title:'Equivalent expressions need a domain statement',kind:'notes',model:null,
    text:['For x≠2, (x²−x−2)/(x−2)=x+1. The identity tells us how to evaluate the original quotient at allowed inputs. It does not define the original quotient at 2.','For (x²−x+1)/(x−2), division gives x+1+3/(x−2). The quotient line y=x+1 is a slant asymptote because the difference approaches zero.'],
    prompts:['Repair the statement “If the remainder is zero, the quotient has no missing points.”','Explain why a ratio comparison alone does not determine the exact intercept of a slant asymptote.'],
    worked:['A zero remainder permits cancellation on the original domain. Any original denominator root remains excluded; in this linear-denominator family it becomes a hole.','Both x and x+1 have ratio approaching 1 relative to x at the ends. To identify the actual asymptote, use an additive difference approaching zero; here that difference from x+1 is 3/(x−2).'],initial:{},controls:[]},
   {id:'equivalence-binomial-explorer',title:'See every coefficient and power in the expansion',kind:'discover',model:'equivalence',family:'binomial',
    text:['Start with (2x−1)³. The Pascal row supplies 1,3,3,1, while the powers of 2 and −1 determine the actual polynomial coefficients.','Change the exponent and coefficient values separately. A zero coefficient can reduce the actual degree; the exponent written outside a degenerate binomial does not by itself settle the degree.'],
    prompts:['Expand the starting expression and check its value at x=2.','Predict the five coefficients when the exponent becomes 4.','Keep n positive. What happens when a=0 but b≠0? What happens when both a and b are zero?'],
    worked:['(2x−1)³=8x³−12x²+6x−1. At x=2, both the original form and expanded form give 27.','(2x−1)⁴=16x⁴−32x³+24x²−8x+1. The Pascal row 1,4,6,4,1 is only one part of each coefficient.','For a=0 and b≠0, the result is the nonzero constant bⁿ with degree 0. For a=b=0 and positive n, the result is the zero polynomial, whose degree is undefined.'],
    initial:{a:2,b:-1,n:3},controls:[
     {key:'a',label:'Coefficient a in ax + b',min:-4,max:4,step:0.25},
     {key:'b',label:'Constant b in ax + b',min:-4,max:4,step:0.25},
     {key:'n',label:'Positive integer exponent n',min:1,max:8,step:1}
    ]},
   {id:'equivalence-transfer',title:'Use binomial expansion before simplifying a quotient',kind:'transfer',model:null,
    text:['Consider F(x)=[(x+1)³−1]/x on its original real domain. This task connects expansion, factorization, division and graph features.','Support each conclusion with the representation that makes it easiest to verify.'],
    prompts:['Expand the numerator, factor it and simplify the quotient with a domain statement.','Classify the original missing input and find any real zeros.','Describe both ends and explain why the trend is quadratic rather than a slant line.'],
    worked:['The numerator is x³+3x²+3x=x(x²+3x+3). Thus F=x²+3x+3 for x≠0.','There is a hole at (0,3). The quadratic discriminant is 9−12=−3, so F has no real zeros.','The leading term x² makes both ends increase without bound. The function coincides with the quadratic on its original domain; a linear slant asymptote does not describe this quadratic growth.'],initial:{},controls:[]}
  ]
 }
});
