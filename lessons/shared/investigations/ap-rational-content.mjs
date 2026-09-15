/** Original teaching activities; no AP Classroom questions, images or scoring keys. */
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const initial=overrides=>({scale:1,numeratorRoot:-1,numeratorMultiplicity:1,denominatorRoot:2,denominatorMultiplicity:1,commonRoot:0,commonNumeratorMultiplicity:0,commonDenominatorMultiplicity:0,...overrides});
const control=(key,label,min,max,step)=>({key,label,min,max,step});
const metadata=(id,topic,title,filename,sha256,essentialKnowledge,practices)=>({
 version:'echs.lesson-investigation.v1',id,title,course:'AP Precalculus',topic,
 curriculum:{version:'ap-precalculus-2026-27',assessedOnExam:true,learningObjectives:[topic+'.A'],essentialKnowledge,practices},
 pin:{kind:'reviewed-existing-lesson-before-addition',path:'lessons/ap-precalculus/unit-1/'+filename,sha256},
 sourceRefs:[
  {title:'AP Precalculus CED, effective Fall 2026, Topic '+topic,url:'https://apcentral.collegeboard.org/media/pdf/ap-precalculus-course-and-exam-description.pdf',checked:'2026-09-14'},
  {title:'AP Precalculus clarification effective Fall 2026',url:'https://apcentral.collegeboard.org/media/pdf/ap-precalculus-ced-clarification-and-guidance-effective-fall-2026.pdf',checked:'2026-09-14'}
 ],
 provenance:{type:'original-teaching-examples',restrictedMaterialCopied:false,awardsMastery:false,calculatorPolicy:'calculator_optional'}
});
export const AP_RATIONAL_CONTENT=freeze({
 'ap-rational-tails':{
  ...metadata('ap-precalculus-1.7-rational-tails','1.7','Compare the two ends of a quotient','AP_Precalculus_1.7_Rational_Functions_and_End_Behavior_ECHS_Refined.html','e8a25483949458b822453c3bf218200d20eeff9bb53cb62e210dfb63125921ae',['1.7.A.1','1.7.A.2','1.7.A.3','1.7.A.4','1.7.A.5','1.7.A.6'],['1.B','3.A']),
  scenes:[
   {id:'rational-tails-warmup',title:'Three quotients, three tail patterns',kind:'warmup',model:null,
    text:['Compare A(x)=(x+1)/(x−2), B(x)=(x+1)/(x−2)² and C(x)=(x+1)²/(x−2). All three exclude x=2. Predict each end behavior using its leading terms before calculating any outputs.','A finite graph window provides examples. A claim about arbitrarily large positive or negative inputs needs algebraic reasoning.'],
    prompts:['Which function approaches 1 at both ends? Which approaches 0?','For C, give the signs of the outputs far to the left and right.','Calculate A(−10) and A(10). Explain why two values near 1 do not by themselves prove its end behavior.'],
    worked:['A has equal degrees and leading coefficient ratio 1, so both limits are 1. B has one extra denominator degree, so both limits are 0.','C has leading-term quotient x. Its left outputs decrease without bound and its right outputs increase without bound.','A(−10)=3/4 and A(10)=11/8. The identity A(x)=1+3/(x−2) explains why the difference from 1 approaches zero at both ends.'],initial:{},controls:[]},
   {id:'rational-tails-explorer',title:'Change degree and scale, then explain the ends',kind:'discover',model:'rational',family:'linear-factors',
    text:['Start with R(x)=−2(x+1)/(x−2). The numerator and denominator are displayed as their original factors, and the graph keeps every original domain exclusion.','Change one multiplicity at a time. Distinguish a leading-term comparison from a complete polynomial-division result. When the scale is zero, describe the zero function on its stated domain without assigning a degree to its zero numerator.'],
    prompts:['At the starting setting, predict both tail values and explain their negative sign.','Keep the scale at −2. Compare numerator/denominator multiplicities (1,2), (2,1) and (3,1).','Set the scale to 0. Is x=2 suddenly in the original domain? What happens to the finite outputs?'],
    worked:['At equal degrees the leading coefficient ratio is −2, so both tails approach −2.','The leading comparisons are −2/x, −2x and −2x². Their pairs of end limits are (0,0), (+∞,−∞) and (−∞,−∞), listed left then right.','With scale 0, every allowed input has output 0. The original denominator still excludes x=2; the graph has a missing point there.'],
    initial:initial({scale:-2}),controls:[control('numeratorMultiplicity','Numerator multiplicity',1,3,1),control('denominatorMultiplicity','Denominator multiplicity',1,3,1),control('scale','Scale',-4,4,0.25)]},
   {id:'rational-tails-notes',title:'A leading term need not be the asymptote itself',kind:'notes',model:null,
    text:['For C(x)=(x+1)²/(x−2), the leading-term quotient is x. Polynomial division gives C(x)=x+4+9/(x−2), with x≠2.','The ratio C(x)/x approaches 1 at either end, but the vertical difference C(x)−x approaches 4. The difference C(x)−(x+4) approaches 0.'],
    prompts:['Which line is the slant asymptote: y=x or y=x+4? Justify it with a difference.','Can a graph cross a horizontal asymptote? Check F(x)=1+x/(x²+1) at x=0 and at large positive and negative inputs.'],
    worked:['The slant asymptote is y=x+4 because the remaining difference is 9/(x−2), which approaches 0. The leading-term comparison predicts a parallel direction, not the complete line.','F(0)=1, and its difference from 1 is negative for x<0 and positive for x>0. It crosses y=1 while still approaching 1 at both ends. A horizontal asymptote describes the ends, not a barrier.'],initial:{},controls:[]},
   {id:'rational-tails-transfer',title:'An average cost with a meaningful domain',kind:'transfer',model:null,
    text:['An original workshop model has total cost 14n+210 QAR for n items, where n is a positive integer. Its average cost is C(n)=(14n+210)/n QAR per item.','Explain the model in words as well as symbols. Negative item counts and n=0 are outside this context.'],
    prompts:['Find the average costs for 30 and 210 items.','Describe the long-run average cost and whether it is attained for any allowed finite n.','Find the smallest whole-number order with average cost strictly below 15 QAR per item.'],
    worked:['C(30)=21 and C(210)=15 QAR per item.','C(n)=14+210/n approaches 14 from above as n grows. It never equals 14 at a finite positive item count.','The strict inequality 210/n<1 requires n>210, so the smallest allowed order is 211 items.'],initial:{},controls:[]}
  ]
 },
 'ap-rational-zeros':{
  ...metadata('ap-precalculus-1.8-rational-zeros','1.8','Zeros must belong to the original domain','AP_Precalculus_1.8_Rational_Functions_and_Zeros_ECHS_Refined.html','d32dd693d7fa634261d0e8f9c831332a865a9c1174a2394d4e6e35fc9e9cea4f',['1.8.A.1','1.8.A.2'],['1.A','3.C']),
  scenes:[
   {id:'rational-zeros-warmup',title:'A numerator zero that is not an intercept',kind:'warmup',model:null,
    text:['Let R(x)=(x+2)(x−1)/[(x−1)(x−3)]. Record the domain before cancelling.','Use an interval sign chart that includes every numerator root and original denominator root. Keep excluded boundaries open when solving inequalities.'],
    prompts:['Which of −2 and 1 is a zero of R? Explain the difference.','Classify the features at x=1 and x=3.','Solve R(x)≤0, retaining any missing point inside the solution.'],
    worked:['The domain excludes 1 and 3. Only x=−2 is a zero, since the original expression is undefined at 1.','The reduced expression is (x+2)/(x−3) on the original domain. There is a hole at (1,−3/2) and a vertical asymptote at x=3.','The solution is [−2,1)∪(1,3). The valid zero −2 is included, but neither denominator exclusion is included.'],initial:{},controls:[]},
   {id:'rational-zeros-explorer',title:'Sign changes can happen at missing points too',kind:'discover',model:'rational',family:'linear-factors',
    text:['Start with R(x)=(x+2)²(x−1)/[(x−3)(x−1)]. Compare the valid zero at −2 with the missing input at 1.','Change the base numerator multiplicity from even to odd, then restore it. Next increase the common numerator multiplicity from 1 to 2 while its denominator multiplicity remains 1.'],
    prompts:['At the starting setting, does the sign change across x=−2? Find the hole height at x=1.','What changes at −2 when its multiplicity becomes 1?','With common numerator multiplicity 2, the graph changes sign across x=1. Why is x=1 still not a zero?'],
    worked:['The double zero −2 does not change the sign. The hole at x=1 has height 9/(−2)=−9/2.','An odd multiplicity at the valid root −2 reverses the sign across it. The original missing point at 1 remains excluded.','One factor x−1 remains after cancellation, so the missing point has limiting height 0 and the sign reverses there. A sign reversal does not make an excluded input part of the domain.'],
    initial:initial({numeratorRoot:-2,numeratorMultiplicity:2,denominatorRoot:3,commonRoot:1,commonNumeratorMultiplicity:1,commonDenominatorMultiplicity:1}),controls:[control('numeratorMultiplicity','Multiplicity at x = −2',1,3,1),control('commonNumeratorMultiplicity','Numerator multiplicity at x = 1',1,3,1)]},
   {id:'rational-zeros-notes',title:'Repair two rules about rational zeros',kind:'notes',model:null,
    text:['Claim A: “Every numerator root is an intercept.” Check the original denominator at that input before accepting the claim.','Claim B: “A zero scale means there are no zeros.” The expression Z(x)=0·(x+2)/(x−3) has value 0 at every allowed input. It remains undefined at 3.'],
    prompts:['Give a cancelled-factor example that disproves Claim A.','Describe the complete zero set of Z, including its domain restriction.','Explain why formal factor counts cannot give the degree of the zero numerator.'],
    worked:['For (x−1)/(x−1), the input 1 is excluded. On its domain the function equals 1 and has no zeros.','Every real number except 3 is a zero of Z. Its graph is y=0 with a hole at (3,0).','After multiplying by zero the numerator is the zero polynomial. Its degree is undefined; counting written factors does not change that fact.'],initial:{},controls:[]},
   {id:'rational-zeros-transfer',title:'Include valid zeros and exclude denominator roots',kind:'transfer',model:null,
    text:['Consider T(x)=−(x−2)²/[(x+1)(x−4)]. The factor at x=2 has even multiplicity.','State inequality solutions as sets of allowed inputs, not just shaded portions of a finite graph.'],
    prompts:['List the domain exclusions and all valid zeros.','Solve T(x)≥0.','Solve T(x)≤0, accounting for the isolated equality point.'],
    worked:['The domain excludes −1 and 4; the only zero is 2.','The denominator is negative on (−1,4), so T is positive there except for its zero at 2. The nonnegative solution is the whole interval (−1,4).','The nonpositive solution is (−∞,−1)∪{2}∪(4,∞). The isolated valid zero is included even though nearby middle-interval outputs are positive.'],initial:{},controls:[]}
  ]
 },
 'ap-rational-poles':{
  ...metadata('ap-precalculus-1.9-rational-poles','1.9','Read both sides of a vertical asymptote','AP_Precalculus_1.9_Rational_Functions_and_Vertical_Asymptotes_ECHS_Refined.html','ccbf5d31c70547ba9a97b0bc0b48c63d3935468448afcb4377343b9430bbfd6f',['1.9.A.1','1.9.A.2'],['2.A','3.C']),
  scenes:[
   {id:'rational-poles-warmup',title:'The same excluded input, different directions',kind:'warmup',model:null,
    text:['Compare A(x)=(x+1)/(x−2) with B(x)=(x+1)/(x−2)² near x=2. The numerator is positive on both nearby sides.','Use signs before using large decimal values. A sampled output is finite; the limit statement describes unbounded behavior.'],
    prompts:['Describe A as x approaches 2 from the left and from the right.','Describe B from both sides of 2.','What happens to all four directions if each function is multiplied by −1?'],
    worked:['For A the denominator changes sign: the left limit is −∞ and the right limit is +∞.','For B the denominator is positive on both sides: both one-sided limits are +∞.','A negative scale reverses each sign. The directions become (+∞,−∞) for −A and (−∞,−∞) for −B.'],initial:{},controls:[]},
   {id:'rational-poles-explorer',title:'Cancel factors and count what remains',kind:'discover',model:'rational',family:'linear-factors',
    text:['Start with R(x)=(x+1)x/[(x−2)x²]. Both x=0 and x=2 are excluded in the original expression.','At x=0, compare the numerator and denominator multiplicities. Change them one at a time, and use the original-domain ledger with the graph.'],
    prompts:['At the starting setting, find the one-sided limits at x=0 and at x=2.','Keep the denominator multiplicity at 0 equal to 2. Compare numerator multiplicities 1, 2 and 3.','Restore the initial multiplicities and reverse the scale. What changes and what stays excluded?'],
    worked:['The reduced expression is (x+1)/[x(x−2)]. At 0 the left/right limits are (+∞,−∞); at 2 they are (−∞,+∞).','Numerator multiplicity 1 leaves a pole at 0. Multiplicity 2 gives a hole at (0,−1/2). Multiplicity 3 gives a hole at (0,0). The input remains excluded in all three cases.','Changing the scale from 1 to −1 reverses each infinite direction. The original domain still excludes both 0 and 2.'],
    initial:initial({commonNumeratorMultiplicity:1,commonDenominatorMultiplicity:2}),controls:[control('commonNumeratorMultiplicity','Numerator multiplicity at x = 0',1,3,1),control('commonDenominatorMultiplicity','Denominator multiplicity at x = 0',1,3,1),control('scale','Scale',-4,4,0.25)]},
   {id:'rational-poles-notes',title:'A small denominator is not the whole argument',kind:'notes',model:null,
    text:['For F(x)=(x−1)²/(x−1), both numerator and denominator approach 0 near 1. The graph has a hole, not a vertical asymptote.','For G(x)=(x−1)/(x−1)³, cancellation leaves 1/(x−1)² on the original domain. A pole remains because the denominator had the greater multiplicity.'],
    prompts:['Find the missing-point height for F.','Find both one-sided limits for G at 1.','Rewrite the rule “a denominator root always makes a vertical asymptote” so that it is correct.'],
    worked:['F agrees with x−1 except at x=1, so its hole is at (1,0).','Both one-sided limits for G are +∞ because the remaining denominator is a positive square.','First compare numerator and denominator multiplicities at the original denominator root. For a nonzero numerator polynomial, a vertical asymptote remains when the denominator multiplicity is larger. With zero scale, every allowed output is zero. Neither case restores an excluded input.'],initial:{},controls:[]},
   {id:'rational-poles-transfer',title:'One hole and one pole in the same expression',kind:'transfer',model:null,
    text:['Let S(x)=−3(x−1)/[(x+2)²(x−1)]. Analyze every original denominator root.','Support each classification with the remaining factors and the local sign.'],
    prompts:['Classify x=1 and x=−2, including coordinates for any hole.','Give the left and right limits at the vertical asymptote.','Does S have any zeros?'],
    worked:['On its original domain S=−3/(x+2)². There is a hole at (1,−1/3) and a vertical asymptote at x=−2.','The square is positive on both sides of −2 and the numerator is negative, so both one-sided limits are −∞.','There are no zeros. The only written numerator root was the excluded input 1.'],initial:{},controls:[]}
  ]
 },
 'ap-rational-holes':{
  ...metadata('ap-precalculus-1.10-rational-holes','1.10','A missing input can have a finite limit','AP_Precalculus_1.10_Rational_Functions_and_Holes_ECHS_Refined.html','24a70414208984e6d3fccc05674193a9a8b5a1fe1fb6412ff5b7d4223871c56a',['1.10.A.1','1.10.A.2'],['3.C','2.A']),
  scenes:[
   {id:'rational-holes-warmup',title:'Keep the exclusion after cancellation',kind:'warmup',model:null,
    text:['Use F(x)=(x−2)(x+1)/[(x−2)(x−3)]. The cancelled expression is useful, but its original domain must travel with it.','Separate three statements: the value at an input, a limit near the input, and the coordinate of a missing point.'],
    prompts:['Find the original domain and classify both denominator roots.','What is F(2)? What is the limit as x approaches 2?','Give the coordinate of the hole and explain why it is not a filled point.'],
    worked:['The domain excludes 2 and 3. The factor at 2 cancels fully; a denominator factor remains at 3.','F(2) is undefined, while the limit is (2+1)/(2−3)=−3.','The hole is (2,−3). The finite limiting height does not make the original undefined input valid.'],initial:{},controls:[]},
   {id:'rational-holes-explorer',title:'Move a hole toward a remaining pole',kind:'discover',model:'rational',family:'linear-factors',
    text:['The original family is R(x)=(x+1)(x−c)/[(x−2)(x−c)]. Start with c=1 and keep the factor multiplicities fixed.','The graph window includes finite hole heights. At the exact collision c=2, reconsider the original multiplicities instead of extending a finite-height formula through a division by zero.'],
    prompts:['Find the hole when c=1. Then predict its coordinates for c=1.75 and c=2.25 before moving the control.','At c=2, explain why there is no finite hole at that input.','Compare inputs very close to an exclusion with the excluded input itself. Does a smaller sampling step repair the domain?'],
    worked:['For c≠2 the hole is (c,(c+1)/(c−2)). The three specified holes are (1,−2), (1.75,−11) and (2.25,13).','At c=2 the denominator has two factors x−2 and the numerator only one. One denominator factor remains, so x=2 is a pole and no finite hole is drawn.','Every sampled allowed input remains distinct from the missing input. A finer grid improves numerical evidence but never adds an excluded input to the original domain.'],
    initial:initial({commonRoot:1,commonNumeratorMultiplicity:1,commonDenominatorMultiplicity:1}),controls:[control('commonRoot','Common-factor location c',-3,3,0.25)]},
   {id:'rational-holes-notes',title:'A hole on the axis is still not a zero',kind:'notes',model:null,
    text:['Consider H(x)=(x−1)³/[(x−1)(x+2)]. After cancellation the remaining expression is (x−1)²/(x+2), with both original exclusions retained.','The limiting height at x=1 is zero. A hollow point on the x-axis means that the original function has no value at that input.'],
    prompts:['Classify x=1 and x=−2, and list all valid zeros.','Suppose a new function is defined to equal H away from 1 and to have value 0 at 1. Is it the same function?'],
    worked:['There is a hole at (1,0), a vertical asymptote at x=−2, and no valid zeros. The only root of the reduced numerator is excluded in the original domain.','The new function has a different domain because it includes 1. It is a continuous extension at that missing input, but it is not identical to the original H.'],initial:{},controls:[]},
   {id:'rational-holes-transfer',title:'Connect a factorization, a table and a missing point',kind:'transfer',model:null,
    text:['Let P(x)=(x−3)(x+2)/[(x−3)(x+4)]. Two nearby values are P(2.9)=49/69 and P(3.1)=51/71.','Use algebra to decide what the finite table supports and what it cannot establish by itself.'],
    prompts:['Find the hole exactly, and give both one-sided limits at that input.','List the remaining vertical asymptote and valid zero.','Explain why averaging two nearby table entries is not an exact method for the hole height.'],
    worked:['The hole is (3,5/7), and both one-sided limits at 3 are 5/7. The identity P(x)=(x+2)/(x+4) on the original domain gives the exact value.','The remaining vertical asymptote is x=−4, and the valid zero is x=−2.','The reduced function is not linear, so symmetric input distances do not guarantee symmetric output distances. The two table values provide evidence near 5/7; the algebra establishes the exact limiting height.'],initial:{},controls:[]}
  ]
 }
});
