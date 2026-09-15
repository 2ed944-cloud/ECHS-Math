/** Original stateless AP1.12–1.14 teaching scenes, school year2026–27.
 * Discover scenes use model:'modeling' and one closed family: transform,
 * selection or construction. Controls declare the complete numeric model input.
 * Historical source hashes are verified snapshots; no accepted commit is implied.
 */
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const refs=topic=>[
 {title:`AP Precalculus CED, effective Fall 2026, Topic ${topic}`,url:'https://apcentral.collegeboard.org/media/pdf/ap-precalculus-course-and-exam-description.pdf',checked:'2026-09-15'},
 {title:'AP Precalculus clarifications effective Fall 2026',url:'https://apcentral.collegeboard.org/media/pdf/ap-precalculus-ced-clarification-and-guidance-effective-fall-2026.pdf',checked:'2026-09-15'}
];
const provenance=()=>({type:'original-teaching-examples',restrictedMaterialCopied:false,syntheticContexts:true,awardsMastery:false,automaticallyGraded:false,calculatorPolicy:'calculator_optional'});
export const AP_MODELING_CONTENT=freeze({
 'ap-function-transformations':{
  version:'echs.lesson-investigation.v1',id:'ap-precalculus-1.12-function-transformations',title:'Map inputs, outputs and whole sets',course:'AP Precalculus',topic:'1.12',
  curriculum:{version:'ap-precalculus-2026-27',assessedOnExam:true,learningObjectives:['1.12.A'],essentialKnowledge:['1.12.A.1','1.12.A.2','1.12.A.3','1.12.A.4','1.12.A.5','1.12.A.6'],practices:['1.C','3.A']},
  pin:{kind:'reviewed-existing-lesson-before-addition',path:'lessons/ap-precalculus/unit-1/AP_Precalculus_1.12_Transformations_of_Functions_ECHS_Refined.html',sha256:'ac25a0e8da9597e519cc368699d3ef1a11c428a57ec9819881f028c698be0f73'},
  sourceRefs:refs('1.12'),provenance:provenance(),
  scenes:[
   {id:'transform-map-warmup',title:'Map one point before drawing a curve',kind:'warmup',model:null,
    text:['Suppose the point (−2,2) lies on the graph of f. Consider g(x)=−2f(−0.5(x−4))+1. You know one parent point, but the full parent rule has not been supplied.','Follow the input and output operations separately. The new input must make the inside expression equal to the old input.'],
    prompts:['Solve −0.5(x−4)=−2 to find the new input. Then transform the parent output2.','Which point on g can you locate? Can this one pair determine the entire graph or domain of g?'],
    worked:['The input equation gives x=8. The output is −2(2)+1=−3, so the point (8,−3) lies on g.','One corresponding point is determined. The entire graph, domain and range require more information about f.'],initial:{},controls:[]},
   {id:'transform-map-discover',title:'Transform a restricted parent and its point table',kind:'discover',model:'modeling',family:'transform',
    text:['Now declare f(u)=u²+u for −2≤u≤3, and g(x)=a f(b(x−h))+k. The horizontal magnitude is positive; Reverse input chooses b negative or positive. Start with a=−2, b=−0.5, h=4, k=1 and u=−2.','Predict before changing one control. Compare the paired points, two graphs and domain/range statements. The parent is not even, so reversing its input has a visible effect.'],
    prompts:['Check the selected pair (−2,2) → (8,−3). Which input does u=3 map to?','Find the complete starting domain and range of g. Explain why reversing b reverses the endpoint order.','Set a=0. What happens to the range and selected outputs? Does the restricted input domain disappear?'],
    worked:['The correspondence is x=h+u/b and y=a f(u)+k. At u=3, the parent output is12, and the image point is (−2,−23).','The parent range is [−0.25,12], with its minimum at u=−0.5. Initially g has domain [−2,8] and range [−23,1.5]. Negative input scale reverses the domain endpoint order; negative output scale reverses the range endpoint order.','With a=0, every allowed input gives output k, so the range is {k}. The domain still consists of inputs whose inside value belongs to [−2,3]. The result is a constant on that domain, not an invertible dilation.'],
    initial:{a:-2,horizontalMagnitude:0.5,reverseInput:1,h:4,k:1,u:-2},controls:[
     {key:'a',label:'Output factor a',min:-3,max:3,step:0.5},
     {key:'horizontalMagnitude',label:'Horizontal magnitude |b|',min:0.5,max:2,step:0.5},
     {key:'reverseInput',label:'Reverse input: 0 no, 1 yes',min:0,max:1,step:1},
     {key:'h',label:'Horizontal shift h',min:-4,max:4,step:0.5},
     {key:'k',label:'Vertical shift k',min:-4,max:4,step:0.5},
     {key:'u',label:'Selected parent input u',min:-2,max:3,step:0.5}
    ]},
   {id:'transform-map-notes',title:'A point map also transforms the domain and range',kind:'notes',model:null,
    text:['For b≠0, solving b(x−h)=u gives x=h+u/b. The output map is y=af(u)+k. Apply the input map to the complete parent domain, and the output map to the complete parent range.','Preimage and image can refer to sets of graph points before and after a transformation. Do not confuse those sets with the inverse image of a single function output. A point table is evidence about selected points, not a replacement for the complete domain.','The explorer keeps |b| positive. If b=0 were allowed, the inside input would always be0. The expression would be defined only when0 belongs to the parent domain; it would then be constant a f(0)+k.'],
    prompts:['Why does multiplying the inside input by2 produce a horizontal scale of1/2?','What changes if a is negative? What changes if a=0?','For this declared parent, explain why b=0 would require different domain reasoning from the reciprocal input formula.'],
    worked:['Each old input u is reached at x=h+u/2, so horizontal distances from h are divided by2.','A negative a reverses output order. At a=0 the allowed outputs collapse to k, while the transformed input domain is retained.','Here0 belongs to [−2,3] and f(0)=0. With b=0, every real x would be an allowed input and g(x)=k; x=h+u/b cannot be used. This boundary state is not selectable in the new explorer.'],initial:{},controls:[]},
   {id:'transform-map-transfer',title:'Transform sets when the whole rule is unknown',kind:'transfer',model:null,
    text:['A function f has domain [1,5] and range [−2,4]. Define g(x)=3f(−2(x+1))−1. No other information about f is given.','Use the set information to make justified conclusions, and identify what remains unknown.'],
    prompts:['Construct the full domain and range of g. Explain the reversal in the input endpoints.','What equation must an input satisfy to be a zero of g? Can the supplied sets locate every such input?'],
    worked:['The condition 1≤−2(x+1)≤5 gives domain [−3.5,−1.5]. The output map sends [−2,4] to range [−7,11].','A zero requires f(−2(x+1))=1/3. Since1/3 is in the declared range, at least one such input exists, but the sets do not locate it or determine how many there are.'],initial:{},controls:[]}
  ]
 },
 'ap-model-selection':{
  version:'echs.lesson-investigation.v1',id:'ap-precalculus-1.13-model-selection',title:'Compare evidence before choosing a model',course:'AP Precalculus',topic:'1.13',
  curriculum:{version:'ap-precalculus-2026-27',assessedOnExam:true,learningObjectives:['1.13.A','1.13.B'],essentialKnowledge:['1.13.A.1','1.13.A.2','1.13.A.5','1.13.A.6','1.13.A.7','1.13.B.1','1.13.B.2','1.13.B.3','1.13.B.4'],practices:['2.A','3.C']},
  pin:{kind:'reviewed-existing-lesson-before-addition',path:'lessons/ap-precalculus/unit-1/AP_Precalculus_1.13_Function_Model_Selection_and_Assumption_Articulation_ECHS_Refined.html',sha256:'6c3a6768d4a72e5fe26750aa065b17f3e5147f3a30748863122bde67feb8f0ae'},
  sourceRefs:refs('1.13'),provenance:provenance(),
  scenes:[
   {id:'model-choice-warmup',title:'Use a table to propose a family',kind:'warmup',model:null,
    text:['This synthetic test-rig table records position relative to a marked origin in centimeters: at times0,1,2,3,4 seconds, the positions are1,2,5,10,17 centimeters. These are designed teaching values, not measurements from an actual experiment.','A mathematical family may explain the observed pattern. A physical model also needs assumptions about how the motion continues.'],
    prompts:['Calculate the first and second differences. Why does the input spacing matter?','Propose a simple function matching these values. Does a five-row match establish a unique global law?'],
    worked:['The first differences are1,3,5,7 centimeters and the second differences are2,2,2 centimeters. Equal one-second intervals permit this ordinary difference comparison.','Q(x)=x²+1 matches all five readings. It is a simple quadratic candidate, but finitely many matches alone do not establish a unique function on all real inputs.'],initial:{},controls:[]},
   {id:'model-choice-discover',title:'See the signed residual for every observation',kind:'discover',model:'modeling',family:'selection',
    text:['Compare the fixed candidates L(x)=4x−1 and Q(x)=x²+1 against the same synthetic position readings. A residual is observed position minus predicted position. The table, model graph and separate residual graph describe the same five observations.','The perturbation δ changes only the recorded position at x=2, from5 to5+δ centimeters. Neither candidate is refitted when δ changes. This is a comparison of declared functions, not a fitted regression.'],
    prompts:['At δ=0, list the five residuals for each candidate. What does a negative residual mean on the data graph?','Set δ=4. Compare the sums of squared errors. Does the smaller sum establish the true physical model?','Find the δ value where the two sums of squared errors are equal. What additional evidence would help choose a model?'],
    worked:['At δ=0, L has residuals2,−1,−2,−1,2 centimeters, while Q has five zero residuals. A negative residual means the observation lies below the candidate curve.','At δ=4, SSE(L)=14cm² and SSE(Q)=16cm². The linear candidate has the smaller error sum for these changed observations, but this statistic alone does not establish a mechanism or justify extrapolation.','SSE(L)=δ²−4δ+14 and SSE(Q)=δ², so the sums agree at δ=3.5. Context, repeated observations, residual structure and the intended use matter. RMSE is √(SSE/5) centimeters; it has the same ranking here because both candidates use the same five observations.'],
    initial:{delta:0,candidate:1},controls:[
     {key:'delta',label:'Change in the x=2 observation δ (cm)',min:-4,max:4,step:0.5},
     {key:'candidate',label:'Highlighted candidate: 0 linear, 1 quadratic',min:0,max:1,step:1}
    ]},
   {id:'model-choice-notes',title:'Separate finite agreement, fitting and model validity',kind:'notes',model:null,
    text:['An exact match to a finite table is different from a justified prediction outside its observed interval. The function H(x)=x²+1+0.1x(x−1)(x−2)(x−3)(x−4) agrees with Q(x)=x²+1 at x=0,1,2,3,4.','A fitted regression chooses coefficients according to a specified fitting method. This explorer does not do that: its candidate coefficients remain fixed. Residuals provide evidence about those candidates over the supplied observations, not a universal acceptance test.','Ordinary finite differences require equal input spacing. With unequal time intervals, compare quantities such as average rates before attributing a pattern to a polynomial degree.'],
    prompts:['Verify the five agreements between H and Q, then compare their predictions at x=5.','State one restriction and one assumption needed before using either function beyond the synthetic observed interval [0,4].','Why are zero residuals insufficient by themselves to establish a correct physical model?'],
    worked:['At each listed input, a factor in the extra product is zero. At x=5, Q(5)=26 but H(5)=38; finite agreement does not force agreement elsewhere.','The recorded time interval is [0,4] seconds. Extending a model needs evidence that its proposed motion pattern remains appropriate; the original table supplies no observation at x=5.','A flexible formula can interpolate data without capturing a mechanism. Units, domain, measurement quality and plausible behavior must support the intended use.'],initial:{},controls:[]},
   {id:'model-choice-transfer',title:'Choose separate rules for separate regimes',kind:'transfer',model:null,
    text:['In a synthetic charging model, a device starts at20% charge. It gains10 percentage points per minute for the first4 minutes, then gains2 percentage points per minute through minute14. These are deliberately simplified teaching rates, not specifications for a real device.','Choose nonoverlapping intervals and state the assumptions before using the model.'],
    prompts:['Write a piecewise formula P(t) on [0,14], assigning t=4 to exactly one rule. Does the model join continuously?','Find P(10) and P(14). Explain why extending the first rule to t=10 gives an invalid contextual prediction.','Name one condition that could make this simplified model unsuitable for a real device.'],
    worked:['One choice is P(t)=20+10t for0≤t<4, and P(t)=52+2t for4≤t≤14. Both expressions give60 at the switch, so the model is continuous there.','P(10)=72% and P(14)=80%. The first rule alone would give120% at t=10, outside both its assigned regime and the contextual range of charge percentages.','The model assumes constant gain within each regime. Temperature, battery condition or changing charging control could alter the rates. These are assumptions to investigate, not claims about a measured device.'],initial:{},controls:[]}
  ]
 },
 'ap-model-construction':{
  version:'echs.lesson-investigation.v1',id:'ap-precalculus-1.14-model-construction',title:'Construct a model and defend its domain',course:'AP Precalculus',topic:'1.14',
  curriculum:{version:'ap-precalculus-2026-27',assessedOnExam:true,learningObjectives:['1.14.A','1.14.B','1.14.C'],essentialKnowledge:['1.14.A.1','1.14.B.1','1.14.C.1'],practices:['1.C','3.B']},
  pin:{kind:'reviewed-existing-lesson-before-addition',path:'lessons/ap-precalculus/unit-1/AP_Precalculus_1.14_Function_Model_Construction_and_Application_ECHS_Refined.html',sha256:'b5f8a7b64d72cb4982abc666f3ca77b49f9ceb8ea5210211caf7389eaf3f4d0e'},
  sourceRefs:refs('1.14'),provenance:provenance(),
  scenes:[
   {id:'model-build-warmup',title:'Derive the dimensions before multiplying',kind:'warmup',model:null,
    text:['An idealized18cm by10cm rectangular sheet is used to make an open box. Remove a square of side t centimeters from each corner, then fold up the sides. This is a synthetic geometric design; ignore thickness, tabs and material loss beyond the four squares.','Distinguish the algebraic expression for volume from the inputs that describe a usable box.'],
    prompts:['Express the length, width and height in terms of t. Explain each subtraction.','Find the admissible interval for t. What happens at each endpoint?'],
    worked:['The dimensions are18−2t,10−2t and t centimeters. Each base dimension loses a cut from both ends.','All three dimensions must be positive, giving0<t<5. At t=0 there is no height; at t=5 the width is zero. Neither endpoint gives a usable box.'],initial:{},controls:[]},
   {id:'model-build-discover',title:'Connect the sheet, box, table and volume graph',kind:'discover',model:'modeling',family:'construction',
    text:['The constructed model is V(t)=t(18−2t)(10−2t), in cubic centimeters, on0<t<5. Move the cut size and compare the diagram, dimensions, volume and sampled graph.','The control and table use quarter-centimeter steps from0.25 to4.75. A largest displayed sample is not, by itself, proof of the continuous model’s global maximum.'],
    prompts:['Check the volumes for t=1,2,3 centimeters. Why does increasing the cut not always increase the volume?','Calculate average volume changes over [1,2] and [2,3]. Interpret their signs and units.','Which cut in the quarter-step table gives its largest volume? What would be needed to claim a maximum over every admissible real t?'],
    worked:['V(1)=128, V(2)=168 and V(3)=144cm³. Increasing t raises the height but shortens both base dimensions.','The average changes are40 and−24cm³ per cm. The negative second value means the volume decreases as the cut grows over [2,3]; it does not mean the box has negative volume.','The largest value among the displayed quarter-step samples is168cm³ at t=2. A continuous global-maximum claim requires further reasoning about all inputs in (0,5), not only the sampled table.'],
    initial:{t:2},controls:[{key:'t',label:'Corner cut t (cm)',min:0.25,max:4.75,step:0.25}]},
   {id:'model-build-notes',title:'A useful model includes conditions and intended use',kind:'notes',model:null,
    text:['The factored expression records the three dimensions. Expansion gives V(t)=4t³−56t²+180t. These are equivalent polynomial expressions, but only0<t<5 describes the usable boxes in this context.','A model record should include variables and units, assumptions, formula, admissible domain, a check against its constraints and the question it is intended to answer. Here the construction is exact under the stated idealizations; it is not a regression fitted to measurements.','The full lesson also considers technology-based regression and piecewise construction. This box explorer supports one contextual cubic model; it does not replace those other modeling methods.'],
    prompts:['Expand the product and check one numerical value in both forms. Which form most directly explains the context?','Why can t=6 be evaluated algebraically but not used as a box design?','What extra information would be needed to model the usable interior capacity of a thick sheet?'],
    worked:['Expansion gives4t³−56t²+180t. At t=2, both forms give168cm³. The factored form makes the three dimensions visible.','At t=6 the formula gives−72cm³, but the width10−2t is negative. The input violates the physical domain, so this value is not a physical box volume.','Material thickness and the fold/join construction would be needed to determine the interior dimensions. The idealized model deliberately omits them.'],initial:{},controls:[]},
   {id:'model-build-transfer',title:'Apply an inverse model to a discrete context',kind:'transfer',model:null,
    text:['Suppose one ideal pump fills a fixed tank in36 minutes. In a synthetic planning model, n identical independent pumps work together at unchanged individual rates, with n∈{1,2,3,4,5,6}.','The model is T(n)=36/n minutes. The assumptions describe the teaching model; they are not a performance claim for an actual pumping system.'],
    prompts:['Explain the inverse relationship and calculate T(3) and T(6).','State the contextual domain. Why are zero or fractional pumps outside it, even though the formula has values at some other real inputs?','Give one reason a real six-pump installation might not finish in the predicted time.'],
    worked:['If each pump contributes the same independent rate, the total rate is multiplied by n and the time is divided by n. T(3)=12 minutes and T(6)=6 minutes.','The contextual domain is the six integers1 through6. Zero pumps do not fill the tank and make the denominator zero; fractional pumps are not options in this plan.','Shared pipe capacity, pressure changes or unequal pump rates could prevent rates from adding as assumed. Check such conditions before using the model for a real system.'],initial:{},controls:[]}
  ]
 }
});
