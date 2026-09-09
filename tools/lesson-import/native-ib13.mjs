// Original ECHS explanations, reviewed against mathematical facts in the pinned lesson.
// Tool-only authored source. No original questions, worked answers, reveals or teacher payloads.
const text = value => ({type:'text',text:value});
const math = (tex,spoken) => ({type:'math',source:{mode:'tex',tex},spoken});
const paragraph = (...children) => ({type:'paragraph',children:children.map(value=>typeof value==='string'?text(value):value)});
const rich = (...nodes) => ({type:'rich-text',version:2,content:{nodes}});
const equation = (tex,spoken) => ({type:'math',version:2,content:{source:{mode:'tex',tex},spoken,display:true}});
const list = (...items) => rich({type:'list',style:'unordered',items:items.map(item=>({type:'list-item',children:[text(item)]}))});
const table = (caption,labels,rows) => ({type:'table',version:1,content:{caption,row_header:true,
  columns:labels.map((label,index)=>({id:`column-${index+1}`,label})),
  rows:rows.map((cells,index)=>({id:`row-${index+1}`,cells:cells.map(cell=>[typeof cell==='string'?text(cell):cell])}))}});
const entry = (coverage,blocks,reviewNotes=[]) => ({coverage,blocks,reviewNotes});

export const NATIVE_IB13 = {
  3: entry(['constant ratio','representations','ratio behaviour','terms and indices','finite sums','interpretation'],[
    rich(paragraph('Use the same geometric relationship in a list, a table, a graph, an explicit rule and a recurrence. Explain what stays constant when the term number increases by one.')),
    list('Identify a constant ratio and distinguish it from a constant difference.','Connect the initial value and multiplier to both recursive and explicit rules.','Explain the separate effects of the sign and magnitude of the multiplier.','Find terms, indices and unknown parameters, checking whether all solutions fit the context.','Use finite sums and sigma notation with the correct first index and number of terms.','Interpret units, integer stages, thresholds and the limitations of a model.'),
    rich(paragraph('A useful learning check follows this sequence: identify the structure, represent it, calculate, verify and interpret. Explaining the reasoning matters as much as obtaining a value.'))
  ]),
  5: entry(['sequence','ratio denominator','recurrence','series','partial sum'],[
    rich(paragraph('A sequence lists values in order. The subscript tells us the position, beginning here with the first term.')),
    equation('u_1,u_2,u_3,\\ldots','u one, u two, u three, and so on'),
    equation('r=\\frac{u_{n+1}}{u_n}\\quad(u_n\\ne0)','The common ratio is u sub n plus one divided by u sub n, when u sub n is nonzero'),
    rich(paragraph('The recurrence describes multiplication directly, including cases where a quotient cannot be formed. Throughout this lesson, term indices are positive integers.')),
    equation('u_{n+1}=r u_n','The next term equals the common ratio times the current term'),
    rich(paragraph('A series adds the terms. A partial sum stops after a specified number of terms, so it is a total rather than a term at one position.')),
    equation('S_n=u_1+u_2+\\cdots+u_n','S sub n is the sum of the first n terms')
  ]),
  6: entry(['arithmetic difference','geometric ratio','percentage multiplier'],[
    table('Compare the operation between consecutive terms',['Structure','Terms','Repeated operation'],[
      ['Arithmetic','4, 7, 10, 13, …','Add 3 each time'],['Geometric','4, 12, 36, 108, …','Multiply by 3 each time']]),
    rich(paragraph('Adding the same amount produces a constant difference. Multiplying by the same factor produces a constant ratio whenever the earlier term is nonzero. Test the operation, rather than judging a pattern by how quickly it appears to grow.')),
    equation('r=1+\\frac{p}{100}','A repeated increase of p percent has multiplier one plus p divided by one hundred'),
    rich(paragraph('The percentage is applied to the new amount at every step. A percentage increase therefore gives a multiplicative rule, not a fixed additive increment.'))
  ]),
  8: entry(['ratio table','consistent quotient','finite observations'],[
    rich(paragraph('Divide each term by its predecessor. Matching quotients establish a common ratio for the listed transitions; a finite list alone does not prove how every later term will behave.')),
    table('Consecutive ratios for 18, 54, 162, 486',['Earlier term','Next term','Quotient'],[
      ['18','54',math('54/18=3','Fifty-four divided by eighteen equals three')],
      ['54','162',math('162/54=3','One hundred sixty-two divided by fifty-four equals three')],
      ['162','486',math('486/162=3','Four hundred eighty-six divided by one hundred sixty-two equals three')]]),
    rich(paragraph('All three transitions multiply by 3. An explicit rule or a stated model is needed to justify extending that relationship beyond the observed terms.'))
  ],['The original visual ratio grid is reflowed into an accessible semantic table; no CSS row-span claim is preserved.']),
  9: entry(['six ratio cases','sign versus magnitude','zero cases'],[
    rich(paragraph('First assume the initial term is nonzero. A positive multiplier keeps its sign; a negative multiplier changes its sign at each step. The absolute value of the multiplier controls the magnitude.')),
    table('Behaviour of a nonzero geometric sequence',['Multiplier','Signs','Magnitude'],[
      [math('r>1','r is greater than one'),'Same sign as the first term','Increases'],
      [math('0<r<1','r is between zero and one'),'Same sign as the first term','Decreases toward zero'],
      [math('r=1','r equals one'),'Unchanged','Constant'],
      [math('-1<r<0','r is between negative one and zero'),'Alternate','Decreases toward zero'],
      [math('r=-1','r equals negative one'),'Alternate','Constant'],
      [math('r<-1','r is less than negative one'),'Alternate','Increases']]),
    rich(paragraph('Increasing magnitude does not always mean increasing value: a negative first term with a multiplier above 1 becomes more negative. If the first term is zero, all terms are zero. If the multiplier is zero, every term after the first is zero.'))
  ],['Explicit nonzero and sign assumptions repair the source shorthand about growth.']),
  13: entry(['ratio versus difference','positive decay','negative ratio'],[
    table('Three distinctions to check',['Observation','Correct interpretation'],[
      ['100, 120, 144','The differences are 20 and 24, but both ratios are 1.2.'],
      ['100, 80, 64','The values decrease with the positive ratio 0.8.'],
      ['A negative common ratio','Successive nonzero terms alternate in sign.']]),
    rich(paragraph('Decreasing positive terms do not require a negative multiplier. Check the quotient and then describe sign and magnitude separately.'))
  ]),
  26: entry(['separated terms','odd index gap','even index gap','real sign ambiguity'],[
    rich(paragraph('When two nonzero terms are separated by several steps, dividing them gives a power of the common ratio. The number of steps is the difference between their indices.')),
    equation('\\frac{u_q}{u_p}=r^{q-p}\\quad(1\\le p<q)','u sub q divided by u sub p equals r to the power q minus p, for positive indices p less than q'),
    table('Parity of the index gap',['Gap','Equation','Possible real ratios'],[
      ['Odd, with k a nonnegative integer',math('r^{2k+1}=c','r to the power two k plus one equals c'),'One real root, with the same sign as c'],
      ['Even, with k a positive integer',math('r^{2k}=c','r to the power two k equals c'),'Two opposite roots when c is positive; none when c is negative']]),
    rich(paragraph('Here c is nonzero because both given terms are nonzero. An even gap can hide sign changes between the observations. Keep both possible ratios until another term or a contextual restriction rules one out.'))
  ],['Nonzero terms and positive integer gaps are stated explicitly.']),
  34: entry(['growth threshold','positive domain','first integer stage','adjacent verification'],[
    rich(paragraph('Assume a positive first term, a positive threshold and a common ratio above 1. The terms then increase strictly. A growth threshold asks for the first allowed integer stage, not a decimal crossing.')),
    equation('u_1r^{n-1}>T\\quad(u_1>0,\\ T>0,\\ r>1)','Find positive integer n such that u one times r to the n minus one exceeds T, with positive u one and T and r greater than one'),
    rich(paragraph('Check stage 1 first. If it already exceeds the threshold, the first stage is 1. Otherwise locate the crossing and test consecutive integer stages.')),
    equation('u_{k-1}\\le T\\quad\\text{and}\\quad u_k>T','The previous term is at most T and the current term is greater than T'),
    rich(paragraph('For k at least 2, these two checks establish the first qualifying stage because every earlier term is smaller. Include the stage number and its meaning in the final statement.'))
  ],['Positive initial value and threshold added; stage 1 handled separately.']),
  35: entry(['logarithmic boundary','positive domain','strict inequality','integer interpretation'],[
    rich(paragraph('For a positive growth model with a multiplier above 1, logarithms locate the threshold boundary. Use the same logarithm base in numerator and denominator.')),
    equation('n-1>\\frac{\\log(T/u_1)}{\\log r}\\quad(u_1>0,\\ T>0,\\ r>1)','n minus one exceeds log of T divided by u one, divided by log r; u one and T are positive and r exceeds one'),
    rich(paragraph('A numerical solver or table can locate the same crossing. Its decimal output is a boundary, not automatically an admissible term number. Choose a positive integer and substitute into the original inequality.')),
    rich(paragraph('Ordinary rounding can select the wrong stage. If the boundary lands exactly on an integer, strict “greater than” still excludes equality. Check the previous and chosen stages, and check stage 1 separately when it already qualifies.'))
  ],['A solving scaffold, not a claim that general logarithm laws are a new SL 1.3 objective.']),
  37: entry(['positive decay','log sign','first integer below threshold'],[
    rich(paragraph('A positive sequence with a multiplier between 0 and 1 decreases strictly. To find when it first falls below a positive threshold, keep the direction of the inequality attached to each algebraic step.')),
    equation('u_1r^{n-1}\\lt T\\quad(u_1\\gt0,\\ T\\gt0,\\ 0\\lt r\\lt1)','u one times r to the n minus one is less than T, with positive u one and T and r between zero and one'),
    equation('n-1>\\frac{\\log(T/u_1)}{\\log r}','n minus one is greater than log of T divided by u one, divided by log r'),
    rich(paragraph('The logarithm of the multiplier is negative, so division reverses the inequality. Take the first positive integer stage satisfying the original condition and verify the adjacent terms. If stage 1 is already below the threshold, it is the answer. A positive geometric sequence cannot fall below a nonpositive threshold.'))
  ],['Positive threshold and initial-value restrictions added.']),
  39: entry(['minimality','monotonicity','growth and decay comparisons'],[
    rich(paragraph('An adjacent-stage check proves a first crossing only when the model is monotone in the required direction. Assume positive terms with a constant multiplier above 1 for growth or between 0 and 1 for decay.')),
    table('Verification at the first qualifying stage k, where k is at least 2',['Model','Previous stage','Chosen stage'],[
      ['Growth beyond T',math('u_{k-1}\\le T','u sub k minus one is at most T'),math('u_k>T','u sub k is greater than T')],
      ['Decay below T',math('u_{k-1}\\ge T','u sub k minus one is at least T'),math('u_k<T','u sub k is less than T')]]),
    rich(paragraph('Monotonicity rules out all earlier stages once the previous one fails. Equality at the previous stage is allowed because the target condition is strict. For a first-stage answer, test stage 1 directly; there is no stage 0 in this indexing convention.'))
  ],['Monotonicity and first-stage exception added to make the minimality claim valid.']),
  42: entry(['sigma lower bound','sigma upper bound','summand','term count'],[
    equation('\\sum_{k=1}^{8}5(2)^{k-1}','The sum, from k equals one to eight, of five times two to the power k minus one'),
    table('Read every part of the sigma expression',['Part','Meaning'],[
      ['Lower index 1','Begin by substituting k = 1.'],['Upper index 8','Finish by substituting k = 8.'],
      ['Summand 5 times 2 to the power k minus 1','This rule supplies each term being added.'],['Number of terms','There are eight integer index values, including both endpoints.']]),
    rich(paragraph('The index is a running placeholder. It changes from one term to the next; the sigma symbol instructs us to add all the resulting values.'))
  ]),
  43: entry(['shifted sigma bounds','inclusive count','first included term'],[
    equation('\\sum_{k=p}^{q}u_k=u_p+u_{p+1}+\\cdots+u_q','The sum from k equals p to q includes u sub p through u sub q'),
    rich(paragraph('Take p and q to be integers with p at least 1 and q at least p. Both endpoint terms are included.')),
    equation('\\text{number of terms}=q-p+1','The number of included terms is q minus p plus one'),
    rich(paragraph('For a geometric sequence, the first term of this shorter sum is u sub p, while the common ratio stays the same. Use that first included term and the new count in the finite-sum formula. If p equals q, the sum has exactly one term.'))
  ]),
  44: entry(['finite-sum derivation','shifted product','cancellation','nonunit denominator'],[
    rich(paragraph('Let n be a positive integer. Write the finite sum, then multiply the entire equation by the common ratio. The shifted terms line up.')),
    equation('S_n=u_1+u_1r+u_1r^2+\\cdots+u_1r^{n-1}','S sub n equals u one plus u one r plus u one r squared, continuing through u one r to the n minus one'),
    equation('rS_n=u_1r+u_1r^2+\\cdots+u_1r^n','r S sub n is the same sequence of terms shifted one power of r higher'),
    rich(paragraph('Subtract the second equation from the first. Every shared middle term cancels; the initial term and the new final term remain.')),
    equation('(1-r)S_n=u_1(1-r^n)','One minus r times S sub n equals u one times one minus r to the n'),
    equation('S_n=u_1\\frac{1-r^n}{1-r}\\quad(r\\ne1)','S sub n equals u one times one minus r to the n divided by one minus r, provided r is not one'),
    rich(paragraph('Division is valid only when the multiplier is not 1. This is a finite-sum derivation; it does not require a limit or an infinite-series assumption.'))
  ]),
  45: entry(['equivalent sum forms','sign cancellation','r equals one'],[
    equation('S_n=u_1\\frac{1-r^n}{1-r}=u_1\\frac{r^n-1}{r-1}\\quad(r\\ne1)','The two finite geometric-sum forms are equal when r is not one'),
    rich(paragraph('Changing the sign of both numerator and denominator leaves the quotient unchanged. Both forms work for every real multiplier other than 1; choosing one can make arithmetic more convenient.')),
    equation('S_n=nu_1\\quad(r=1)','When r equals one, S sub n is n times u one'),
    rich(paragraph('When the multiplier is 1, all n terms equal the initial term. Add those equal terms directly instead of dividing by zero in the quotient formula. In both cases, n is a positive integer.'))
  ]),
  55: entry(['individual term','cumulative sum','quantity and unit interpretation'],[
    equation('u_n=u_1r^{n-1}','u sub n equals u one times r to the n minus one'),
    equation('S_n=u_1\\frac{1-r^n}{1-r}\\quad(r\\ne1)','S sub n is u one times one minus r to the n divided by one minus r, for r not equal to one'),
    table('Choose the quantity the context asks for',['Question about the model','Quantity'],[
      ['How many new files are produced in period n?','The single-period term u sub n'],
      ['How many files are produced across the first n distinct periods?','The cumulative sum S sub n']]),
    rich(paragraph('Define what one term measures before adding terms. Summing a stock measured repeatedly can count the same material more than once; it is not automatically a total of new arrivals or a time-integrated exposure. For a multiplier of 1, use n times the initial term for the sum.'))
  ],['The ambiguous sum of medication stock readings is replaced by explicit disjoint-period quantities and a units warning.']),
  58: entry(['compounding','percentage base','exact versus additive comparison'],[
    rich(paragraph('Three successive increases of 10 percent act on three different starting amounts. Each new amount becomes the base for the next increase.')),
    equation('1.1^3=1.331','One point one cubed equals one point three three one'),
    equation('1+3(0.10)=1.30','One plus three times zero point one equals one point three'),
    rich(paragraph('The multiplicative calculation gives 133.1 percent of the original amount, an increase of 33.1 percent. Adding three copies of 10 percent would give only 30 percent and misses the growth applied to previous increases.'))
  ]),
  62: entry(['synthetic observations','model comparison','rounded residual ratios','validation'],[
    rich(paragraph('These numbers are synthetic observations used to illustrate model checking. Compare measurements at equally spaced stages with the proposed constant-ratio model.')),
    equation('u_n=100(1.2)^{n-1}','u sub n equals one hundred times one point two to the n minus one'),
    table('Illustrative observed values and geometric predictions',['Stage','Observed','Model','Observed divided by model'],[
      ['1','100','100','1.000'],['2','121','120','1.008'],['3','143','144','0.993'],['4','174','172.8','1.007']]),
    rich(paragraph('The last column is rounded to three decimal places. Ratios near 1 show close agreement here, but the observations do not follow the rule exactly. Check measurement units, timing, residual patterns and plausible capacity limits before extrapolating.'))
  ],['Numbers explicitly labeled synthetic; observed/model ratios rounded to three decimals.']),
  63: entry(['capacity limits','changing conditions','extrapolation'],[
    rich(paragraph('A constant multiplier describes one regime of behaviour. It can become unreliable when the conditions that produced it change.')),
    list('Physical growth may be limited by food, space or other resources.','An adoption model can run out of eligible new users.','A change in rules, bandwidth or storage policy can alter a digital growth process.'),
    rich(paragraph('State the interval or stages for which the assumptions are credible. A good fit to early observations does not justify extending exponential growth indefinitely. Explain which constraint could cause the model to fail, without claiming a new model has already been established.'))
  ]),
  72: entry(['geometric and financial indices','completed periods','rate units'],[
    equation('u_n=u_1r^{n-1}','The nth geometric term is u one times r to the n minus one'),
    equation('A=P(1+i)^n','The amount after n completed periods equals P times one plus i to the n'),
    rich(paragraph('In the financial form, P is the amount at time 0, i is the rate per period and n counts completed periods. In the sequence form, the first listed term has index 1. The exponent differs because the starting point is indexed differently.')),
    rich(paragraph('Match the rate to the length of a period and state whether it describes growth, depreciation or another change. The multiplier still acts repeatedly on the current amount; the interpretation and units come from the model.'))
  ])
};
