(function(){
  'use strict';
  const d=window.LESSON_DATA;if(!d||String(d.lesson?.number)!=='2.3')return;
  const R=String.raw;let n=0;const P=[];
  const id=()=>`IBAI-2.3-V5-P${String(++n).padStart(3,'0')}`;
  const base=(level,command,prompt,answer,solution,marks=2,calculator='No calculator needed',hint='Write the governing structure before calculating.')=>({id:id(),level,command,prompt,answer,solution,marks,calculator,hint,tags:['polynomial-rational','lesson-2.3','v5']});
  const N=(level,command,prompt,value,answer,solution,marks=2,calculator='No calculator needed',hint='Retain sufficient precision and verify the result.',tolerance=1e-4)=>({...base(level,command,prompt,answer,solution,marks,calculator,hint),check:{mode:'number',value,tolerance}});
  const X=(level,command,prompt,accepted,answer,solution,marks=2,calculator='No calculator needed',hint='State the relevant structure, restriction and units explicitly.')=>({...base(level,command,prompt,answer,solution,marks,calculator,hint),check:{mode:'text',accepted}});
  const M=(level,command,prompt,choices,correct,solution,marks=2,calculator='No calculator needed',hint='Use the defining structure rather than appearance alone.')=>({...base(level,command,prompt,choices[correct],solution,marks,calculator,hint),choices,correct,check:{mode:'choice',value:correct}});

  P.push(
    M('Foundation','Identify','Which function is a polynomial?',[R`\(3x^4-2x+7\)`,R`\(x^{-1}+4\)`,R`\(\sqrt{x}+1\)`,R`\(2^x\)`],0,'Only the first expression uses finitely many non-negative integer powers of x.'),
    X('Foundation','State',R`State the degree and leading coefficient of \(-5x^7+2x^3-x+9\).`,['degree 7 leading coefficient -5','7,-5','n=7 a=-5'],R`Degree \(7\); leading coefficient \(-5\).`,R`The largest exponent is 7 and its coefficient is −5.`),
    M('Foundation','Describe',R`Which end behaviour belongs to \(4x^6-9x+1\)?`,['left down, right down','left up, right up','left down, right up','left up, right down'],1,'Even degree and positive leading coefficient give up/up ends.'),
    M('Foundation','Describe',R`Which end behaviour belongs to \(-2x^5+x^2\)?`,['left up, right down','left down, right up','both up','both down'],0,'Odd degree gives opposite ends; a negative leading coefficient makes the right end fall.'),
    N('Foundation','State',R`State the maximum possible number of turning points of a degree-8 polynomial.`,7,R`\(7\)`,R`A degree-n polynomial has at most n−1 turning points.`),
    X('Foundation','State',R`State the real zeros of \(f(x)=3(x+2)(x-5)^2\).`,['-2 and 5','x=-2,5','{-2,5}'],R`\(x=-2\) and \(x=5\).`,R`Set each factor equal to zero.`),
    N('Foundation','State',R`State the multiplicity of the zero \(x=5\) in \(3(x+2)(x-5)^2\).`,2,R`\(2\)`,R`The exponent on the factor \((x-5)\) is 2.`),
    M('Foundation','Describe',R`At a zero of even multiplicity, a polynomial graph usually:`,['crosses and changes sign','touches and turns without changing sign','has a vertical asymptote','has a hole'],1,'Even multiplicity produces no sign change.'),
    N('Foundation','Calculate',R`Find the y-intercept of \(f(x)=0.12(x+3)(x-1)^2(x-4)\).`,-1.44,R`\(-1.44\)`,R`Evaluate f(0)=0.12(3)(1)(−4)=−1.44.`),
    X('Foundation','State',R`If \(x=7\) is a zero of a polynomial, state a corresponding factor.`,['x-7','(x-7)'],R`\((x-7)\)`,R`The factor theorem gives \(f(7)=0\iff(x-7)\) is a factor.`),
    X('Foundation','State',R`State the domain of \(r(x)=\dfrac{x+1}{x-4}\).`,['x≠4','all real except 4','R\\{4}'],R`\(x\ne4\)`,R`The denominator must not equal zero.`),
    X('Foundation','State',R`State the vertical and horizontal asymptotes of \(f(x)=\dfrac6{x+3}-2\).`,['x=-3 y=-2','vertical x=-3 horizontal y=-2'],R`\(x=-3\) and \(y=-2\).`,R`In \(a/(x-h)+k\), the asymptotes are x=h and y=k.`),
    X('Foundation','Identify',R`For \(g(x)=\dfrac{x^2-9}{x-3}\), identify the discontinuity at \(x=3\).`,['hole at (3,6)','removable hole (3,6)','hole'],R`A removable hole at \((3,6)\).`,R`The factor x−3 cancels, leaving x+3 with x=3 still excluded.`),
    N('Foundation','Determine',R`Find the x-intercept of \(r(x)=\dfrac{2x-7}{x+4}\).`,3.5,R`\(x=\frac72\)`,R`A rational zero occurs when the numerator is zero and the denominator is non-zero.`),
    N('Foundation','Determine',R`If \(y\) varies directly as \(x\) and \(y=18\) when \(x=6\), find the constant of variation.`,3,R`\(k=3\)`,R`Use y=kx, so k=18/6.`),
    N('Foundation','Determine',R`If \(y=45/x\), calculate \(y\) when \(x=9\).`,5,R`\(5\)`,R`Substitute x=9: y=45/9.`),
    N('Foundation','Determine',R`For a power model \(y=kx^n\), doubling x multiplies y by 8. Determine n.`,3,R`\(n=3\)`,R`Solve 2^n=8.`),
    N('Foundation','Calculate',R`A model predicts 12.7 and the observed value is 13.4. Calculate the residual observed−predicted.`,0.7,R`\(0.7\)`,R`Residual =13.4−12.7=0.7.`),
    M('Foundation','Select','Which TI-84 command directly locates a visible x-intercept?',['Maximum','Zero','CubicReg','PwrReg'],1,'Zero locates an input where the selected function equals zero.','2','TI-84 expected'),
    M('Foundation','Explain','Why must PwrReg list values be positive?',['The graph must be increasing.','The calculator linearises with logarithms.','Power models always have exponent 2.','Residuals cannot be negative.'],1,'Power regression uses logarithms; real logarithms require positive x- and y-values.','2','TI-84 expected')
  );

  P.push(
    X('Application','Analyse',R`Analyse \(p(x)=0.12(x+3)(x-1)^2(x-4)\): state degree, zeros with multiplicity and end behaviour.`,['degree 4; -3(1),1(2),4(1); up/up','degree 4 roots -3 1 4 ends up'],R`Degree 4; zeros −3 (mult.1), 1 (mult.2), 4 (mult.1); ends up/up.`,R`Add factor exponents for degree and use the positive leading coefficient.`,5),
    X('Application','Construct',R`A cubic has zeros \(-2,1,5\) and passes through \((0,20)\). Construct it.`,['2(x+2)(x-1)(x-5)','2x^3-8x^2-14x+20'],R`\(f(x)=2(x+2)(x-1)(x-5)\)`,R`Use f(x)=a(x+2)(x−1)(x−5) and 20=10a.`,5),
    X('Application','Solve',R`Solve \((x+3)(x-1)^2(x-4)>0\).`,['(-∞,-3)∪(4,∞)','x<-3 or x>4'],R`\((−\infty,-3)\cup(4,\infty)\)`,R`The sign is positive outside the two odd-multiplicity roots; the even root at 1 does not change sign.`,4),
    M('Application','Interpret',R`The polynomial \((x-2)^2(x^2+1)\) has degree 4. How many distinct real x-intercepts does it have?`,['0','1','2','4'],1,'Only x=2 is real; it has multiplicity 2. The factor x²+1 has non-real zeros.'),
    X('Application','Determine',R`For x=0,1,2,3,4, the outputs are 2,4,12,32,70. Determine an exact cubic model.`,['x^3+x+2','f(x)=x^3+x+2'],R`\(f(x)=x^3+x+2\)`,R`Constant third differences are 6, so the leading coefficient is 1; substitution gives the remaining coefficients.`,5),
    N('Application','Predict',R`Use \(P(x)=0.6209596x^3-5.26114719x^2+10.97936508x+18.27575758\) to predict \(P(8)\).`,87.3286,R`\(87.329\) approximately`,R`Substitute x=8 using full precision.`,3,'TI-84 permitted','Store the regression equation and evaluate at x=8.',0.001),
    N('Application','Calculate',R`For an observed value 25.5 and predicted value 24.6149, calculate the residual.`,0.8851,R`\(0.8851\)`,R`Residual=25.5−24.6149.`,2),
    M('Application','Select','For one data set, the models have \(R^2\) values 0.383, 0.712 and 0.995, with the cubic leaving small patternless residuals. Which is best supported inside the observed interval?',['Linear','Quadratic','Cubic','No model can be selected'],2,'The cubic has much stronger fit and residual evidence, subject to contextual plausibility.'),
    N('Application','Determine',R`For \(f(x)=\dfrac{a}{x-2}+3\) passing through \((4,7)\), determine a.`,8,R`\(8\)`,R`7=a/2+3, so a=8.`),
    X('Application','Determine',R`For \(f(x)=\dfrac8{x-2}+3\), determine both intercepts.`,['x-intercept -2/3, y-intercept -1','(-2/3,0) and (0,-1)'],R`x-intercept \((-\frac23,0)\); y-intercept \((0,-1)\).`,R`Rewrite as (3x+2)/(x−2) for the zero; evaluate f(0) for the y-intercept.`,4),
    X('Application','Determine',R`Find the intersections of \(\dfrac8{x-2}+3\) and \(0.5x+2\).`,['(-2,1) and (6,5)','x=-2,6'],R`\((-2,1)\) and \((6,5)\)`,R`Equating gives (x−2)²=16; substitute into the line.`,5,'TI-84 permitted'),
    X('Application','Solve',R`Solve \(\dfrac{(x+2)(x-4)}{x-1}>0\).`,['(-2,1)∪(4,∞)','-2<x<1 or x>4'],R`\((-2,1)\cup(4,\infty)\)`,R`Use critical values −2,1,4 and exclude x=1.`,5),
    X('Application','Determine',R`Find the hole in \(h(x)=\dfrac{x^2-x-6}{x-3}\).`,['(3,5)','hole at 3,5'],R`Hole at \((3,5)\).`,R`Factor numerator=(x−3)(x+2); simplify to x+2 while retaining x≠3.`,4),
    N('Application','State',R`State the horizontal asymptote of \(r(x)=\dfrac{3x^2-1}{2x^2+5x}\).`,1.5,R`\(y=\frac32\)`,R`Equal degrees give the ratio of leading coefficients 3/2.`),
    N('Application','Estimate',R`Mass varies as the cube of radius: \(M=0.0326r^3\). Estimate M when \(r=14\) mm.`,89.4544,R`\(89.5\text{ g}\) approximately`,R`M=0.0326(14³)=89.4544.`,3,'TI-84 permitted','Use full precision before rounding.',0.01),
    N('Application','Determine',R`Light intensity is \(I=720/d^2\). Determine I at \(d=5\) m.`,28.8,R`\(28.8\)`,R`I=720/25.`),
    N('Application','Determine',R`In a power model, multiplying x by 3 multiplies y by 27. Determine the exponent.`,3,R`\(3\)`,R`3^n=27, so n=3.`),
    X('Application','Interpret',R`PwrReg gives \(M=0.0326303r^{2.99997}\). Interpret the exponent.`,['mass is approximately proportional to radius cubed','exponent approximately 3 volume scaling','doubling radius multiplies mass by about 8'],R`Mass is approximately proportional to the cube of radius; doubling radius multiplies mass by about 8.`,R`The exponent 2.99997 is essentially 3 and is consistent with volume scaling.`,3,'TI-84 expected'),
    X('Application','Describe',R`For \(f(x)=8/(x-2)+3\), describe the table behaviour at x=1.9, 2 and 2.1.`,['large negative, undefined, large positive','f(1.9)=-77 undefined at 2 f(2.1)=83'],R`\(f(1.9)=-77\), undefined at 2, and \(f(2.1)=83\).`,R`Substitute or use TABLE; the values show opposite unbounded branches around x=2.`,4,'TI-84 expected'),
    X('Application','Interpret',R`The mathematical intersections of two models are \((-2,1)\) and \((6,5)\), but the practical domain is \(x>2\). State the valid intersection.`,['(6,5)','6,5'],R`\((6,5)\)`,R`Apply the contextual domain after finding all mathematical solutions.`,2)
  );

  window.__ECHS_PR5_PRACTICE={R,P,n,base,N,X,M};
})();
