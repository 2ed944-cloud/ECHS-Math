/** Original public teaching scenes; no AP Classroom question, image or scoring key. */
const deepFreeze=value=>{
  if(value&&typeof value==='object'){Object.values(value).forEach(deepFreeze);Object.freeze(value);}
  return value;
};
const metadata=(id,topic,title,filename,sha256,learningObjectives,essentialKnowledge,practices)=>({
  version:'echs.lesson-investigation.v1',id,title,course:'AP Precalculus',topic,
  curriculum:{version:'ap-precalculus-2026-27',assessedOnExam:true,learningObjectives,essentialKnowledge,practices},
  pin:{kind:'reviewed-existing-lesson-before-addition',path:'lessons/ap-precalculus/unit-1/'+filename,sha256},
  sourceRefs:[
    {title:`AP Precalculus CED, effective Fall 2026, Topic ${topic}`,url:'https://apcentral.collegeboard.org/media/pdf/ap-precalculus-course-and-exam-description.pdf',checked:'2026-09-14'},
    {title:'AP Precalculus clarifications effective Fall 2026',url:'https://apcentral.collegeboard.org/media/pdf/ap-precalculus-ced-clarification-and-guidance-effective-fall-2026.pdf',checked:'2026-09-14'}
  ],
  provenance:{type:'original-teaching-examples',restrictedMaterialCopied:false,awardsMastery:false,calculatorPolicy:'calculator_optional'}
});

export const AP_POLYNOMIAL_CONTENT=deepFreeze({
  'ap-polynomial-rates':{
    ...metadata('ap-precalculus-1.4-polynomial-rates','1.4','Turns, inflection and interval evidence',
      'AP_Precalculus_1.4_Polynomial_Functions_and_Rates_of_Change_ECHS_Refined.html',
      'aada3d510554fe649f3a36f5f0082a94003ba7750e29bdeb752b7f6bc20acf10',
      ['1.4.A'],['1.4.A.1','1.4.A.2','1.4.A.3','1.4.A.4','1.4.A.5'],['2.A','3.A']),
    scenes:[
      {id:'poly-rates-warmup',title:'A positive average can hide a turn',kind:'warmup',model:null,
        text:[
          'Use the declared polynomial p(x)=x³−3x. At x=−2,−1,0,1,2 its outputs are −2,2,0,−2,2. Compare the four unit-interval averages before describing the graph.',
          'A secant describes net output change over its entire interval. It does not say that the function moves in one direction at every intermediate input.'
        ],
        prompts:[
          'Calculate all four unit-interval average rates. Which are positive and which are negative?',
          'The averages on [−1,0] and [0,1] are equal. Does that make p a straight line on [−1,1]? Compare the actual output at x=0.5 with the line joining (0,0) and (1,−2).',
          'Identify the degree and leading coefficient. Explain why this cubic has no global maximum or minimum on all real inputs, even though it turns.'
        ],
        worked:[
          'The four average rates are 4,−2,−2,4 output units per input unit. The equal middle averages do not establish a constant slope throughout either interval.',
          'The joining line gives −1 at x=0.5, but p(0.5)=−1.375. The cubic therefore differs from that line between the sampled endpoints.',
          'The degree is 3 and the leading coefficient is 1. The full function is unbounded below on the left and above on the right, so its local turns are not global extrema on ℝ.'
        ],initial:{},controls:[]},
      {id:'poly-rates-explorer',title:'Move through two turns, a flat point and no turns',kind:'discover',model:'polynomial',family:'cubic-rates',
        text:[
          'The family is p(x)=x³−3kx. The scale stays at 1 while k changes. Compare the full polynomial with its named restriction −4≤x≤4; global extrema of that restriction need not be global extrema of the full polynomial.',
          'The secant endpoints stay at x=−2 and x=0.5. Predict what will happen before moving k through positive, zero and negative values. Use the linked graph and numerical features as evidence; no differentiation procedure is required.'
        ],
        prompts:[
          'At k=1, the secant average is positive. Find a region where the function is nevertheless decreasing.',
          'Compare k=1, k=0 and k=−1. Does a flat point always mean a local maximum or minimum?',
          'Locate the concavity change for all three settings. Separate increasing outputs from increasing rates.',
          'At k=1, compare the outputs at the restriction endpoints and both interior turns before reporting the restricted global extrema.'
        ],
        worked:[
          'At k=1, p(−2)=−2 and p(0.5)=−1.375, so the average is 0.625/2.5=0.25. The function still decreases between x=−1 and x=1.',
          'For k=1 the local maximum is (−1,2) and local minimum is (1,−2). At k=0, x³ keeps increasing through its stationary inflection at the origin. At k=−1, x³+3x is increasing throughout. In each case concavity changes at x=0.',
          'For k=1 on [−4,4], the candidate outputs are −52,2,−2,52 at x=−4,−1,1,4. The restricted global minimum is −52 at −4 and the restricted global maximum is 52 at 4.'
        ],
        initial:{a:1,k:1,left:-4,right:4,from:-2,to:0.5},
        controls:[{key:'k',label:'Shape parameter k',min:-4,max:4,step:0.25}]},
      {id:'poly-rates-error-analysis',title:'Two claims about extrema to repair',kind:'notes',model:null,
        text:[
          'Claim A: “A flat point is always a turn.” The declared polynomial x³ has a stationary point at zero but continues increasing across it. Its concavity changes there; its direction does not.',
          'Claim B: “An endpoint can never be a local extremum.” On a restricted domain, compare an included endpoint with the nearby inputs that belong to that domain. Also compare all endpoint and interior candidates before calling any value global.',
          'For q(x)=5−(x+1)² on [−2,2], compare the two endpoints with the vertex. Then consider the same quadratic on all real inputs. State the domain with every extremum claim.'
        ],
        prompts:[
          'Give a counterexample to Claim A using output values on both sides of zero.',
          'Find both local minima of q on [−2,2]. Which one is global on that restriction?',
          'What changes when the domain of q is all real numbers? Explain the role of its negative leading coefficient and even degree.'
        ],
        worked:[
          'For x³, the values at −1,0,1 are −1,0,1, consistent with increasing through zero rather than reversing direction.',
          'The candidate values are q(−2)=4, q(−1)=5 and q(2)=−4. Both included endpoints are one-sided local minima on the restriction; only −4 is the restricted global minimum. The vertex value 5 is the global maximum.',
          'On ℝ, q still has global maximum 5 at x=−1, but it has no global minimum. The restriction endpoints no longer define endpoint extrema.'
        ],initial:{},controls:[]},
      {id:'poly-rates-transfer',title:'Reverse the scale and justify the whole comparison',kind:'transfer',model:null,
        text:[
          'Now use h(x)=−0.5(x³−12x). Its turning inputs are x=−2 and x=2. Analyze the restriction [−3,3], then distinguish it from the full polynomial on ℝ.',
          'Write a claim, the relevant values and a domain statement. This original teaching task does not create an assessment or mastery result.'
        ],
        prompts:[
          'Compare all four endpoint/turn values to find the restricted global minimum and maximum.',
          'Calculate the average rate on [−3,3]. Explain why its sign does not settle monotonicity throughout the interval.',
          'Classify the two included endpoints locally on the restriction. Then state whether either restricted global value is global on ℝ.'
        ],
        worked:[
          'The outputs at x=−3,−2,2,3 are −4.5,−8,8,4.5. The restricted global minimum is −8 at −2; the restricted global maximum is 8 at 2.',
          'The average rate is (4.5−(−4.5))/6=1.5. The function decreases, increases and decreases over successive parts of this interval, so a positive net average does not mean increasing throughout.',
          'The left endpoint is a one-sided local maximum and the right endpoint is a one-sided local minimum on [−3,3]. On ℝ, the negative leading cubic is unbounded in both directions; neither restricted global value remains global.'
        ],initial:{},controls:[]}
    ]
  },
  'ap-polynomial-zeros':{
    ...metadata('ap-precalculus-1.5-polynomial-zeros','1.5','Account for every zero',
      'AP_Precalculus_1.5_Polynomial_Functions_and_Complex_Zeros_ECHS_Refined.html',
      'e53b2bcbdae24b003a94a9f1f79479bc3555e44b21743184525c5953683b5fea',
      ['1.5.A','1.5.B'],['1.5.A.1','1.5.A.2','1.5.A.3','1.5.A.4','1.5.A.5','1.5.A.6','1.5.B.1','1.5.B.2'],['1.B','2.B']),
    scenes:[
      {id:'poly-zeros-warmup',title:'Five zeros need not make five intercepts',kind:'warmup',model:null,
        text:[
          'Start from the real-coefficient factorization p(x)=(x+2)²(x−1)(x²+9). Record each distinct zero together with its multiplicity before counting.',
          'Real zeros correspond to points on the real input/output graph. Nonreal zeros belong in a complex-number representation; they are not additional x-intercepts.'
        ],
        prompts:[
          'Account for all five zeros counted with multiplicity. How many distinct real intercepts are there?',
          'Predict crossing or touching at each real zero. Use nearby factor signs to justify the prediction.',
          'Calculate p(0) to check the sign between the two real zeros.'
        ],
        worked:[
          'The zero −2 has multiplicity 2, the zero 1 has multiplicity 1, and 3i and −3i each have multiplicity 1. The total is 5, matching the degree, but there are only two distinct real intercepts.',
          'The double factor at −2 preserves the nearby sign, so the graph touches there. The simple factor at 1 changes the sign, so the graph crosses there. The quadratic factor is positive for every real input.',
          'p(0)=4·(−1)·9=−36. The output is negative between −2 and 1.'
        ],initial:{},controls:[]},
      {id:'poly-zeros-explorer',title:'Move a conjugate pair onto the real axis',kind:'discover',model:'polynomial',family:'zero-structure',
        text:[
          'The family is p(x)=(x−r)ᵐ[(x−u)²+v²]. Its real coefficients keep the nonreal zeros in a conjugate pair. Change v toward zero and track multiplicity, sign and the real graph together.',
          'Changing v does not change the degree. At v=0, u becomes a real zero of multiplicity two; if u=r, combine that multiplicity with m before drawing a sign strip.'
        ],
        prompts:[
          'At the initial setting r=1,m=2,u=−1,v=1, predict the real intercepts and the two nonreal zeros.',
          'Set v=0 while retaining r=1,m=2,u=−1. Account for degree and symmetry without counting the same zero twice.',
          'Set r=1,u=1,v=0,m=3. What is the merged multiplicity, and does the real graph cross or touch?',
          'Set r=u=0 and v=2. Compare m=1 with m=2 using the identities for odd and even functions.'
        ],
        worked:[
          'Initially the degree is 4: the real zero 1 has multiplicity 2 and the nonreal zeros are −1±i. When v=0 with u=−1, the real zeros −1 and 1 each have multiplicity 2; (x−1)²(x+1)² is even.',
          'For r=u=1,v=0,m=3, the rule becomes (x−1)⁵. There is one distinct real zero, multiplicity 5, and the sign changes across it.',
          'With r=u=0,v=2, m=1 gives x(x²+4), an odd function. With m=2 it becomes x²(x²+4), an even function. Degree parity alone would not establish those identities for an arbitrary polynomial.'
        ],
        initial:{a:1,r:1,m:2,u:-1,v:1},controls:[
          {key:'r',label:'Real zero r',min:-3,max:3,step:0.5},
          {key:'m',label:'Multiplicity m of the real factor',min:1,max:4,step:1},
          {key:'u',label:'Real part u of the conjugate pair',min:-3,max:3,step:0.5},
          {key:'v',label:'Imaginary magnitude v',min:0,max:3,step:0.25}
        ]},
      {id:'poly-zeros-error-analysis',title:'Degree parity is not function symmetry',kind:'notes',model:null,
        text:[
          'A student sees degree 4 and declares g(x)=(x−1)²(x²+4) even. Test the actual identity g(−x)=g(x); the parity of the degree alone does not settle the parity of the function.',
          'A real graph cannot display the imaginary part of a complex zero as a real output at that zero. Keep the real graph and complex-number plot separately labeled.',
          'The zero function is a useful boundary case: both symmetry identities hold, even though the zero polynomial has no defined degree or leading coefficient.'
        ],
        prompts:[
          'Compare g(2) and g(−2). Then use g(0) to rule out odd symmetry.',
          'Explain why placing a zero 2+3i at the real graph point (2,3) would be incorrect.',
          'Verify both identities for z(x)=0. Explain why “both even and odd” does not assign it an even or odd degree.'
        ],
        worked:[
          'g(2)=8 and g(−2)=72, so g is not even. Also g(0)=4, whereas an odd function defined at zero must have value zero. This degree-4 polynomial is neither even nor odd.',
          'The coordinates (2,3) describe real and imaginary parts on a complex plane. A real function graph instead uses a real input and its real output; they are different representations.',
          'For z(x)=0, z(−x)=z(x)=−z(x)=0. Both function identities hold; no nonzero leading term exists from which to define the zero polynomial’s degree.'
        ],initial:{},controls:[]},
      {id:'poly-zeros-transfer',title:'Construct a rule, then qualify a table',kind:'transfer',model:null,
        text:[
          'Construct a real-coefficient degree-5 polynomial with zero −1 of multiplicity 3, zeros 2+i and 2−i, and p(0)=10. Use the factorization to explain the real crossing behavior.',
          'Separately, the stated quadratic q(x)=2x²−3x+1 is sampled at inputs −1,1,3,5. Compare raw first differences, raw second differences and interval average rates. Keep the input step visible.'
        ],
        prompts:[
          'Find the scale factor and an equivalent factored rule for p. Check its degree, p(0) and zero count.',
          'Find the four q outputs, both second differences and all three average rates.',
          'If only those four table points were supplied without a declared rule, would they uniquely prove a global quadratic model? Explain the limitation.'
        ],
        worked:[
          'The rule is p(x)=2(x+1)³[(x−2)²+1]. Substituting zero gives 2·1·5=10. Its degree is 5, the leading coefficient is 2, and its only real zero is −1 of odd multiplicity 3, so the real graph crosses there.',
          'The q outputs are 6,0,10,36. With input step 2, the first differences are −6,10,26; the second differences are 16,16; the average rates are −3,5,13. A raw second difference and an average rate have different meanings.',
          'The stated quadratic has constant second differences for equal steps. A finite table alone is not a unique global rule: other functions can agree at those inputs and differ between them or beyond them.'
        ],initial:{},controls:[]}
    ]
  },
  'ap-polynomial-tails':{
    ...metadata('ap-precalculus-1.6-polynomial-tails','1.6','A small window cannot decide a tail',
      'AP_Precalculus_1.6_Polynomial_Functions_and_End_Behavior_ECHS_Refined.html',
      'b6863c19bd2ead7a45a9767b9a8560c9020bed9f7b94d6409096d9a653efd45c',
      ['1.6.A'],['1.6.A.1','1.6.A.2','1.6.A.3'],['3.A']),
    scenes:[
      {id:'poly-tails-warmup',title:'Make two separate end-behavior claims',kind:'warmup',model:null,
        text:[
          'Consider q(x)=−2x⁵+7x³−9. Begin with the degree and signed leading term, then describe the left and right ends separately.',
          'A few finite outputs may have the same sign without determining either tail. Do not draw an infinity symbol as though it were a finite point on a graph.'
        ],
        prompts:[
          'State the degree and leading coefficient, then write both limit statements.',
          'Compute q(−2) and q(2). Do their signs contradict either limit?',
          'Would replacing −9 with 500 change the algebraic tails? Explain using degrees rather than a narrow graph window.'
        ],
        worked:[
          'The degree is 5 and the leading coefficient is −2. As x→−∞, q(x)→+∞; as x→+∞, q(x)→−∞.',
          'q(−2)=−1 and q(2)=−17. Both are negative finite outputs; that does not contradict eventual positive growth on the far left.',
          'Changing the constant shifts the graph vertically but does not change its nonzero leading term or either tail.'
        ],initial:{},controls:[]},
      {id:'poly-tails-explorer',title:'Keep the rule fixed while widening the window',kind:'discover',model:'polynomial',family:'tails',
        text:[
          'The family is p(x)=xⁿ+bxⁿ⁻¹+c with a fixed leading scale of 1. Start with n=4,b=−8,c=1. The displayed positive-input values can look inconsistent with the positive right-hand tail in a small window.',
          'For the first comparison, change only the window from 4 to 24. Then explore n, b and c separately. The leading degree and sign determine tails; a finite window provides local numerical evidence.',
          'When n=1, the b term is a constant and combines with c. With b=−8,c=1, the rule is x−7, not a quadratic.'
        ],
        prompts:[
          'At the initial setting, predict the sign of p(4). Can a negative value there refute a positive-infinity right tail?',
          'Keep n=4,b=−8,c=1 and widen to 24. Compare p(x)/x⁴ with the absolute vertical gap from x⁴.',
          'Change n from 4 to 5 while keeping the leading scale positive. Which tail changes?',
          'Write the leading term before and after changing only b or c. Explain which tail claims must remain unchanged.'
        ],
        worked:[
          'For x⁴−8x³+1, p(4)=−255 while 4⁴=256. The ratio is −255/256 and the absolute gap is 511. Both algebraic tails are still positive infinity.',
          'At x=24, p(24)=221185 and 24⁴=331776. The ratio is 221185/331776≈0.666670, closer to 1, while the absolute gap is 110591, larger than before. Relative agreement is different from a shrinking vertical separation.',
          'For positive leading scale, degree 4 has two positive-infinity tails; degree 5 has a negative-infinity left tail and positive-infinity right tail. Lower-degree coefficients can reshape the finite graph without changing these conclusions.'
        ],
        initial:{a:1,n:4,b:-8,c:1,window:4},controls:[
          {key:'n',label:'Degree n',min:1,max:6,step:1},
          {key:'b',label:'Coefficient b of the next lower power',min:-12,max:12,step:1},
          {key:'c',label:'Additional constant c',min:-8,max:8,step:1},
          {key:'window',label:'Displayed input magnitude',min:1,max:24,step:1}
        ]},
      {id:'poly-tails-error-analysis',title:'Similar tails do not mean the curves meet',kind:'notes',model:null,
        text:[
          'A student argues: “If the leading term dominates, the vertical gap from that term must tend to zero.” Test the claim with s(x)=x³+2x and its leading term x³.',
          'The relative comparison s(x)/x³=1+2/x² tends to 1 as |x| grows. The vertical difference is 2x, whose absolute magnitude grows. These statements are compatible.',
          'Keep nonconstant polynomials separate from constants. The constant function 5 has degree 0 and finite value 5 at both ends. The zero polynomial also has finite zero tails, but no defined degree.'
        ],
        prompts:[
          'Compare full output, leading-term output, ratio and absolute gap at x=10 and x=20.',
          'Repair the student’s argument using a relative comparison.',
          'Explain why “every polynomial tends to positive or negative infinity” needs a nonconstant condition.'
        ],
        worked:[
          'At x=10 the outputs are 1020 and 1000, the ratio is 1.02 and the absolute gap is 20. At x=20 they are 8040 and 8000, the ratio is 1.005 and the absolute gap is 40.',
          'The ratio approaches 1 even though the absolute gap grows. Matching polynomial tails do not require the two curves to approach each other in vertical distance.',
          'Nonzero constants and the zero polynomial supply finite-tail counterexamples; the nonconstant qualification is essential.'
        ],initial:{},controls:[]},
      {id:'poly-tails-transfer',title:'Check a sign reversal and a modelling boundary',kind:'transfer',model:null,
        text:[
          'Analyze r(x)=−0.5x⁶+3x⁵−1. A positive finite output can coexist with two negative-infinity tails.',
          'Then consider the real factorization t(x)=−3(x+2)²(x−1)³. Determine its leading term without expanding every coefficient.',
          'If a polynomial is used as a context model only for 0≤x≤8, its algebraic extension outside that domain does not automatically describe the real system.'
        ],
        prompts:[
          'Write both tails of r and calculate r(2). Explain why there is no contradiction.',
          'Find the degree, leading coefficient and two tails of t from its factors.',
          'Distinguish a full polynomial’s algebraic tail from a defensible prediction beyond the stated modelling domain.'
        ],
        worked:[
          'r has degree 6 and leading coefficient −0.5, so r(x)→−∞ at both ends. Yet r(2)=−32+96−1=63. A positive finite value does not decide eventual behavior.',
          'The leading term of t is −3x⁵. Its degree is 5; the left tail is positive infinity and the right tail is negative infinity.',
          'An algebraic formula can be evaluated outside a context’s validated domain, but that calculation alone does not justify the extrapolation.'
        ],initial:{},controls:[]}
    ]
  }
});
export default AP_POLYNOMIAL_CONTENT;
