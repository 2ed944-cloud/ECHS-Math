(function(){
  'use strict';
  const data=window.LESSON_DATA;
  if(!data||String(data.lesson?.number)!=='1.4')return;
  const q=[];
  const fmt=(value,dp=2)=>Number(value.toFixed(dp)).toLocaleString('en-US',{minimumFractionDigits:dp,maximumFractionDigits:dp});
  const simple=(P,r,t)=>P*(1+r*t);
  const compound=(P,j,m,t)=>P*(1+j/m)**(m*t);
  const effective=(j,m)=>(1+j/m)**m-1;
  const fvOrd=(R,i,n)=>Math.abs(i)<1e-14?R*n:R*((1+i)**n-1)/i;
  const fvDue=(R,i,n)=>fvOrd(R,i,n)*(1+i);
  const pvAnn=(R,i,n)=>Math.abs(i)<1e-14?R*n:R*(1-(1+i)**(-n))/i;
  const pmt=(PV,i,n)=>Math.abs(i)<1e-14?PV/n:PV*i/(1-(1+i)**(-n));
  const balance=(PV,i,R,k)=>Math.abs(i)<1e-14?PV-R*k:PV*(1+i)**k-R*((1+i)**k-1)/i;
  const payoffPeriods=(PV,i,R)=>-Math.log(1-PV*i/R)/Math.log(1+i);
  const firstAbove=(fn,target,max=1000)=>{let n=1;while(fn(n)<=target&&n<max)n+=1;return n;};
  const firstBelow=(fn,target,max=1000)=>{let n=0;while(fn(n)>=target&&n<max)n+=1;return n;};
  const add=(level,code,prompt,answer,solution,marks=2,calculator='No calculator',command='Calculate',extra={})=>q.push(Object.assign({id:`FINV6-1.4-${code}`,level,prompt,answer,solution,marks,calculator,command,hint:'Draw a timeline, synchronize periods and preserve guard digits.',tags:['financial applications','sequences','modelling']},extra));

  // FOUNDATION — 30
  [
    [4.8,12],[6.0,12],[5.2,4],[7.8,2],[8.12,26]
  ].forEach(([j,m],index)=>{const i=j/100/m;add('Foundation',`F${String(index+1).padStart(2,'0')}`,`A nominal annual rate is \\(${j}\\%\\), compounded \\(${m}\\) times per year. State the periodic rate as a decimal.`,`\\(${i}\\).`,`Divide the annual decimal rate by \\(${m}\\): \\(${j/100}/${m}=${i}\\).`,1,'No calculator','State',{check:{mode:'number',value:i,tolerance:1e-10}});});
  [
    [3,12],[6,4],[7.5,12],[4,26],[2.5,2]
  ].forEach(([years,m],index)=>{const n=years*m;add('Foundation',`F${String(index+6).padStart(2,'0')}`,`How many compounding periods occur in \\(${years}\\) years when there are \\(${m}\\) periods per year?`,`\\(${n}\\) periods.`,`Use \\(N=mt=${m}(${years})=${n}\\).`,1,'No calculator','Calculate',{check:{mode:'number',value:n,tolerance:1e-9}});});
  [
    ['increase',6.5,1.065],['increase',12,1.12],['decrease',9,0.91],['decrease',18,0.82],['retains',72,0.72]
  ].forEach(([type,p,factor],index)=>{const wording=type==='retains'?`A value retains \\(${p}\\%\\) each period.`:`A value ${type}s by \\(${p}\\%\\) each period.`;add('Foundation',`F${String(index+11).padStart(2,'0')}`,`${wording} State the multiplicative factor.`,`\\(${factor}\\).`,`Convert the percentage statement to the factor \\(${factor}\\).`,1,'No calculator','State',{check:{mode:'number',value:factor,tolerance:1e-10}});});
  [
    [6000,.04,3],[7500,.032,5],[12000,.045,2.5],[18000,.028,7],[9500,.0375,4]
  ].forEach(([P,r,t],index)=>{const A=simple(P,r,t);add('Foundation',`F${String(index+16).padStart(2,'0')}`,`QAR \\(${P.toLocaleString()}\\) earns \\(${r*100}\\%\\) simple interest for \\(${t}\\) years. Find the final amount.`,`QAR \\(${fmt(A)}\\).`,`\\(A=P(1+rt)=${P}[1+${r}(${t})]=${fmt(A)}\\).`,2,'No calculator','Calculate',{check:{mode:'number',value:Number(A.toFixed(2)),tolerance:.02}});});
  [
    [10000,.005,450],[50000,.004,1200],[24000,.006,700],[80000,.0035,1600],[32000,.0042,900]
  ].forEach(([B,i,R],index)=>{const interest=B*i,principal=R-interest,closing=B-principal;add('Foundation',`F${String(index+21).padStart(2,'0')}`,`A loan has opening balance QAR \\(${B.toLocaleString()}\\), periodic rate \\(${i}\\), and payment QAR \\(${R}\\). Find the period interest, principal repaid and closing balance.`,`Interest QAR \\(${fmt(interest)}\\), principal QAR \\(${fmt(principal)}\\), closing balance QAR \\(${fmt(closing)}\\).`,`\\(I=iB=${fmt(interest)}\\), \\(P=R-I=${fmt(principal)}\\), \\(B_{new}=B-P=${fmt(closing)}\\).`,3,'No calculator','Calculate',{check:{mode:'text',accepted:[`${fmt(interest)},${fmt(principal)},${fmt(closing)}`,`${interest} ${principal} ${closing}`]}});});
  const foundationChoices=[
    {prompt:'For a borrower who receives a loan now and repays later, how should PV and PMT be signed?',choices:['Same sign','Opposite signs','Both zero','Signs never matter'],correct:1,answer:'Opposite signs.',solution:'The loan is an inflow and repayments are outflows.'},
    {prompt:'Which description defines an ordinary annuity?',choices:['Payments at period beginnings','Payments at period ends','One lump sum only','Unequal payment dates'],correct:1,answer:'Equal payments at period ends.',solution:'Ordinary annuity payments occur at each period end.'},
    {prompt:'Which description defines an annuity due?',choices:['Payments at period beginnings','Payments at period ends','No interest earned','Only loan payments'],correct:0,answer:'Equal payments at period beginnings.',solution:'Each annuity-due payment occurs one period earlier.'},
    {prompt:'Which quantity represents the amount still owed immediately after a payment?',choices:['Future value of deposits','Outstanding balance','Effective rate','Total contribution'],correct:1,answer:'Outstanding balance.',solution:'The outstanding balance is the remaining debt at that date.'},
    {prompt:'Which comparison is financially valid?',choices:['Gross future value versus net future value','Values on different dates','Net values on the same date','Nominal rate versus currency fee'],correct:2,answer:'Net values on the same valuation date.',solution:'Alternatives must be compared like for like.'}
  ];
  foundationChoices.forEach((item,index)=>add('Foundation',`F${String(index+26).padStart(2,'0')}`,item.prompt,item.answer,item.solution,1,'No calculator','Identify',{choices:item.choices,correct:item.correct}));

  // APPLICATION — 30
  [
    [18000,.046,1,5],[12500,.052,4,4],[9000,.048,12,2.5],[20000,.064,2,7],[25000,.0425,12,3]
  ].forEach(([P,j,m,t],index)=>{const A=compound(P,j,m,t);add('Application',`A${String(index+1).padStart(2,'0')}`,`Invest QAR \\(${P.toLocaleString()}\\) for \\(${t}\\) years at \\(${j*100}\\%\\) nominal interest compounded \\(${m}\\) times per year. Find the future value.`,`QAR \\(${fmt(A)}\\).`,`\\(A=${P}(1+${j}/${m})^{${m*t}}=${fmt(A)}\\).`,3,'GDC allowed','Calculate',{check:{mode:'number',value:Number(A.toFixed(2)),tolerance:.03}});});
  [
    [.06,12],[.059,12],[.048,12],[.052,4],[.071,2]
  ].forEach(([j,m],index)=>{const value=effective(j,m)*100;add('Application',`A${String(index+6).padStart(2,'0')}`,`Find the effective annual rate for \\(${j*100}\\%\\) nominal interest compounded \\(${m}\\) times per year.`,`\\(${fmt(value,3)}\\%\\).`,`\\([(1+${j}/${m})^{${m}}-1]100\\%=${fmt(value,3)}\\%\\).`,3,'GDC allowed','Calculate',{check:{mode:'number',value:Number(value.toFixed(3)),tolerance:.002}});});
  const depReal=[
    {prompt:'A vehicle worth QAR \\(84,000\\) depreciates by \\(12\\%\\) annually for \\(5\\) years. Find its value.',value:84000*.88**5,solution:'\\(84000(0.88)^5\\).'},
    {prompt:'Equipment worth QAR \\(48,000\\) depreciates by \\(18\\%\\) annually for \\(6\\) years. Find its value.',value:48000*.82**6,solution:'\\(48000(0.82)^6\\).'},
    {prompt:'A service costs QAR \\(2,400\\) and inflation is \\(3.2\\%\\) annually. Find its projected cost after \\(7\\) years.',value:2400*1.032**7,solution:'\\(2400(1.032)^7\\).'},
    {prompt:'A future amount is QAR \\(30,000\\) after \\(5\\) years of \\(2.5\\%\\) annual inflation. Find its real value in today’s currency.',value:30000/1.025**5,solution:'\\(30000/(1.025)^5\\).'},
    {prompt:'An investment earns effective \\(5.2\\%\\) while inflation is \\(3.1\\%\\). Find the exact effective real annual rate.',value:((1.052/1.031)-1)*100,solution:'\\([(1.052)/(1.031)-1]100\\%\\).'}
  ];
  depReal.forEach((item,index)=>add('Application',`A${String(index+11).padStart(2,'0')}`,item.prompt,index===4?`\\(${fmt(item.value,3)}\\%\\).`:`QAR \\(${fmt(item.value)}\\).`,`${item.solution}=${index===4?fmt(item.value,3)+'\\%':fmt(item.value)}.`,3,'GDC allowed','Calculate',{check:{mode:'number',value:Number(item.value.toFixed(index===4?3:2)),tolerance:index===4?.002:.03}}));
  [
    [600,.054/12,96,false],[300,.048/12,120,false],[1200,.052/4,24,false],[1500,.0249,25,true],[500,.06/12,60,true]
  ].forEach(([R,i,n,due],index)=>{const value=due?fvDue(R,i,n):fvOrd(R,i,n);add('Application',`A${String(index+16).padStart(2,'0')}`,`${due?'At the beginning':'At the end'} of each period, QAR \\(${R}\\) is deposited for \\(${n}\\) periods at periodic rate \\(${i}\\). Find the future value.`,`QAR \\(${fmt(value)}\\).`,`${due?'Annuity due':'Ordinary annuity'}: \\(FV=${R}[(1+${i})^{${n}}-1]/${i}${due?'(1+'+i+')':''}=${fmt(value)}\\).`,3,'GDC allowed','Calculate',{check:{mode:'number',value:Number(value.toFixed(2)),tolerance:.03}});});
  [
    [120000,.051/12,72],[18000,.054/12,48],[32000,.048/12,72],[90000,.049/12,60],[150000,.05/12,84]
  ].forEach(([PV,i,n],index)=>{const R=pmt(PV,i,n),interest=R*n-PV;add('Application',`A${String(index+21).padStart(2,'0')}`,`A QAR \\(${PV.toLocaleString()}\\) loan is repaid over \\(${n}\\) monthly payments at monthly rate \\(${i}\\). Find the payment and total interest.`,`Payment QAR \\(${fmt(R)}\\); total interest QAR \\(${fmt(interest)}\\).`,`\\(R=PV\\,i/[1-(1+i)^{-n}]=${fmt(R)}\\); interest \\(=nR-PV=${fmt(interest)}\\).`,4,'GDC allowed','Calculate',{check:{mode:'text',accepted:[`${fmt(R)},${fmt(interest)}`,`${Number(R.toFixed(2))} ${Number(interest.toFixed(2))}`]}});});
  const balanceWithdrawal=[
    {prompt:'A QAR \\(90,000\\) loan at \\(4.9\\%\\) nominal monthly is repaid over \\(60\\) months. Find the balance after \\(24\\) payments.',value:(()=>{const i=.049/12,R=pmt(90000,i,60);return balance(90000,i,R,24);})(),solution:'Use the exact payment and the retrospective balance formula.'},
    {prompt:'A QAR \\(60,000\\) loan at \\(5.2\\%\\) nominal monthly is repaid over \\(60\\) months. Find the balance after \\(24\\) payments.',value:(()=>{const i=.052/12,R=pmt(60000,i,60);return balance(60000,i,R,24);})(),solution:'Use \\(B_{24}=PV(1+i)^{24}-R[(1+i)^{24}-1]/i\\).'},
    {prompt:'Find the present amount required to withdraw QAR \\(6,000\\) monthly for \\(25\\) years from a fund earning \\(5.25\\%\\) nominal monthly.',value:pvAnn(6000,.0525/12,300),solution:'Use the present value of an ordinary annuity.'},
    {prompt:'A €\(350,000\\) fund earns \\(5.8\\%\\) nominal monthly. Find the monthly withdrawal that lasts \\(20\\) years.',value:pmt(350000,.058/12,240),solution:'Rearrange the present-value annuity formula for \\(R\\).'},
    {prompt:'A €\(350,000\\) fund earns \\(5.8\\%\\) nominal monthly. Find the monthly withdrawal that lasts \\(15\\) years.',value:pmt(350000,.058/12,180),solution:'Use \\(R=PV\\,i/[1-(1+i)^{-n}]\\).'}
  ];
  balanceWithdrawal.forEach((item,index)=>add('Application',`A${String(index+26).padStart(2,'0')}`,item.prompt,`QAR \\(${fmt(item.value)}\\) approximately.`,`${item.solution} The result is approximately \\(${fmt(item.value)}\\).`,4,'GDC allowed','Calculate',{check:{mode:'number',value:Number(item.value.toFixed(2)),tolerance:.04}}));

  // REASONING — 30 original prompts
  const reasoning=[
    ['Explain why simple interest generates an arithmetic sequence of balances.','The same amount \\(Pr\\) is added each period, so first differences are constant.'],
    ['Explain why compound interest generates a geometric sequence of balances.','Every balance is multiplied by the same factor \\(1+i\\), so consecutive ratios are constant.'],
    ['Explain why \\(5\\%\\) growth followed by \\(5\\%\\) decay does not return to the original amount.','The combined factor is \\(1.05(0.95)=0.9975\\), so the result is \\(0.25\\%\\) below the start.'],
    ['A student uses \\(A=P(1+0.06)^{60}\\) for five years at \\(6\\%\\) nominal monthly. Diagnose the error.','The monthly factor is \\(1+0.06/12\\), not \\(1.06\\); the exponent \\(60\\) is monthly.'],
    ['Explain why an effective annual rate permits a fair comparison of different compounding frequencies.','It converts each convention to the actual one-year growth factor.'],
    ['A target equation gives \\(n=48.2\\) months. Explain the correct reporting procedure.','Choose month \\(49\\) and verify month \\(48\\) fails while month \\(49\\) succeeds.'],
    ['Explain why straight-line depreciation is arithmetic but reducing-balance depreciation is geometric.','Straight-line subtracts a fixed amount; reducing balance multiplies by a fixed retention factor.'],
    ['Explain why nominal investment growth can be positive while real growth is negative.','Inflation can increase prices faster than the investment increases money.'],
    ['Explain why \\(r_{real}\\approx r_{eff}-f\\) is not exact.','Exact comparison divides growth factors: \\((1+r_{eff})/(1+f)-1\\).'],
    ['State one reason a single inflation rate may be unsuitable for one household.','Households consume different baskets, so their experienced price growth may differ from the index.'],
    ['Explain why the earliest ordinary-annuity deposit earns more interest than the final deposit.','It remains invested for more compounding periods.'],
    ['Explain why an annuity due has a larger future value than an otherwise identical ordinary annuity.','Every payment is made one period earlier and earns one extra factor \\(1+i\\).'],
    ['A student adds all deposits and multiplies the total by \\((1+i)^n\\). Diagnose the error.','Deposits occur on different dates and do not all earn \\(n\\) periods of interest.'],
    ['Explain why total contributions must be separated from interest earned.','Contributions are cash supplied by the investor; interest is the additional value generated by the account.'],
    ['Explain why the present value of future withdrawals is less than their undiscounted total when \\(i\\gt0\\).','Money remaining in the fund earns interest before later withdrawals occur.'],
    ['Explain why a finance solver normally needs opposite signs for PV and PMT in a borrower’s loan.','The borrower receives the loan and pays repayments in the opposite cash-flow direction.'],
    ['A solver returns a plausible payment but P/Y and C/Y are wrong. Explain why the result is still invalid.','The periodic rate and payment timing do not represent the contract.'],
    ['Derive the loan-payment formula from the present value of an ordinary annuity.','Rearrange \\(PV=R[1-(1+i)^{-n}]/i\\) to obtain \\(R=PV\\,i/[1-(1+i)^{-n}]\\).'],
    ['Explain why the interest part of a level loan payment decreases over time.','Interest equals periodic rate times opening balance, and the balance falls.'],
    ['Explain why the principal part of a level loan payment rises over time.','The total payment is fixed while the interest component falls.'],
    ['A student calculates interest after subtracting the payment. Diagnose the timing error.','Under the stated end-of-period payment model, interest is applied to the opening balance before the payment.'],
    ['Explain why subtracting \\(kR\\) from the original loan does not give the outstanding balance.','The unpaid balance accrues interest and each payment includes an interest portion.'],
    ['Explain why retrospective and prospective balance formulas should agree.','Both value the same remaining obligation at the same date from opposite time directions.'],
    ['Explain why paying extra principal early saves more interest than paying the same extra amount near the end.','Early reduction lowers the balance on which many future interest charges are calculated.'],
    ['Why can the lowest total-interest loan be unsuitable for a borrower?','Its required payment may be unaffordable or leave inadequate liquidity.'],
    ['Explain why a lender may adjust the final payment even when the formula is correct.','Contractual payments are rounded to cents while the exact theoretical payment has more decimals.'],
    ['State two quantities needed in addition to an advertised rate when comparing savings plans.','Examples: fees, compounding frequency, payment timing, tax, access, risk and valuation date.'],
    ['Explain why a fixed-rate financial model may become unreliable over a long horizon.','Rates, inflation, fees, income and behaviour can change.'],
    ['A recommendation reverses when the rate changes by \\(0.1\\) percentage point. Evaluate the model.','The decision is sensitive and should be reported with scenarios rather than as robust.'],
    ['Explain why a cash-flow timeline is mathematical evidence, not decoration.','It determines exponents, payment timing, sign convention and the common valuation date.']
  ];
  reasoning.forEach((item,index)=>add('Reasoning',`R${String(index+1).padStart(2,'0')}`,item[0],item[1],item[1],3,index%4===0?'GDC allowed':'No calculator',index%5===0?'Evaluate':'Explain'));

  // CHALLENGE — 30
  const mixed=[
    [4800,180,.048,12,3,false],[10500,350,.057,12,4,false],[6200,220,.054,12,4,false],[10000,1000,.05,1,10,false],[25000,750,.049,12,5,true]
  ];
  mixed.forEach(([P,R,j,m,t,due],index)=>{const i=j/m,n=m*t,value=P*(1+i)**n+(due?fvDue(R,i,n):fvOrd(R,i,n));add('Challenge',`C${String(index+1).padStart(2,'0')}`,`An account begins with QAR \\(${P.toLocaleString()}\\). QAR \\(${R}\\) is deposited at each ${due?'period beginning':'period end'} for \\(${t}\\) years at \\(${j*100}\\%\\) nominal compounded \\(${m}\\) times per year. Find the final value.`,`QAR \\(${fmt(value)}\\).`,`Accumulate the lump sum for \\(${n}\\) periods and add the ${due?'annuity-due':'ordinary-annuity'} future value.`,5,'GDC allowed','Calculate',{check:{mode:'number',value:Number(value.toFixed(2)),tolerance:.04}});});
  const targets=[
    [350,.057/12,38394,false],[250,.042/12,20000,false],[1000,.075,15000,true],[600,.054/12,100000,false],[1500,.0249,75000,true]
  ];
  targets.forEach(([R,i,T,due],index)=>{const fn=n=>due?fvDue(R,i,n):fvOrd(R,i,n),n=firstAbove(fn,T);add('Challenge',`C${String(index+6).padStart(2,'0')}`,`QAR \\(${R}\\) is deposited at each ${due?'period beginning':'period end'} at periodic rate \\(${i}\\). Find the least number of deposits for the value to exceed QAR \\(${T.toLocaleString()}\\).`,`\\(${n}\\) deposits.`,`\\(FV_{${n-1}}=${fmt(fn(n-1))}\\) and \\(FV_{${n}}=${fmt(fn(n))}\\), so \\(${n}\\) is first.`,5,'GDC allowed','Determine',{check:{mode:'number',value:n,tolerance:1e-9}});});
  const extras=[
    [150000,.05/12,84,250],[90000,.049/12,60,150],[120000,.051/12,72,300],[60000,.052/12,60,100],[240000,.057/12,180,400]
  ];
  extras.forEach(([PV,i,n,extra],index)=>{const regular=pmt(PV,i,n),newR=regular+extra,newN=Math.ceil(payoffPeriods(PV,i,newR)-1e-12);add('Challenge',`C${String(index+11).padStart(2,'0')}`,`A QAR \\(${PV.toLocaleString()}\\) loan at periodic rate \\(${i}\\) is scheduled for \\(${n}\\) payments. The borrower adds QAR \\(${extra}\\) to the regular payment. Estimate the new number of payments.`,`About \\(${newN}\\) payments.`,`Regular payment is QAR \\(${fmt(regular)}\\); solve the payoff-period formula with new payment QAR \\(${fmt(newR)}\\), giving ${payoffPeriods(PV,i,newR).toFixed(3)} periods and therefore \\(${newN}\\) payments.`,5,'GDC allowed','Determine',{check:{mode:'number',value:newN,tolerance:1e-9}});});
  const comparisons=[
    {prompt:'Plan A invests QAR \\(10,000\\) at \\(4.8\\%\\) annually for \\(3\\) years. Plan B charges QAR \\(300\\) now and invests QAR \\(9,700\\) at \\(5.1\\%\\) annually. Determine the larger year-3 value.',a:10000*1.048**3,b:9700*1.051**3},
    {prompt:'Plan A offers \\(6.0\\%\\) annual compounding. Plan B offers \\(5.9\\%\\) nominal monthly. Compare one-year returns on QAR \\(50,000\\).',a:50000*1.06,b:compound(50000,.059,12,1)},
    {prompt:'Loan A: QAR \\(80,000\\), \\(5\\%\\) nominal monthly over \\(48\\) months. Loan B: the same principal and rate over \\(72\\) months. Compare payments and total interest.',loan:true,PV:80000,i:.05/12,n1:48,n2:72},
    {prompt:'A machine worth QAR \\(100,000\\) loses QAR \\(12,000\\) per year under Model A or depreciates \\(12\\%\\) annually under Model B. Compare values after \\(5\\) years.',a:100000-12000*5,b:100000*.88**5},
    {prompt:'An investment earns effective \\(5.4\\%\\) while inflation is either \\(2.5\\%\\) or \\(4.5\\%\\). Compare the exact real annual rates.',real:true,r:.054,f1:.025,f2:.045}
  ];
  comparisons.forEach((item,index)=>{
    let answer,solution;
    if(item.loan){const r1=pmt(item.PV,item.i,item.n1),r2=pmt(item.PV,item.i,item.n2),int1=r1*item.n1-item.PV,int2=r2*item.n2-item.PV;answer=`Loan A payment QAR \\(${fmt(r1)}\\), interest QAR \\(${fmt(int1)}\\); Loan B payment QAR \\(${fmt(r2)}\\), interest QAR \\(${fmt(int2)}\\).`;solution='The longer term lowers each payment but raises total interest.';}
    else if(item.real){const a=(1+item.r)/(1+item.f1)-1,b=(1+item.r)/(1+item.f2)-1;answer=`Real rates \\(${fmt(a*100,3)}\\%\\) and \\(${fmt(b*100,3)}\\%\\).`;solution='Divide the nominal growth factor by each inflation factor.';}
    else {answer=`Values are \\(${fmt(item.a)}\\) and \\(${fmt(item.b)}\\); ${item.a>item.b?'the first':'the second'} is larger.`;solution='Move both options to the same date and compare net values.';}
    add('Challenge',`C${String(index+16).padStart(2,'0')}`,item.prompt,answer,solution,5,'GDC allowed','Compare');
  });
  const inverse=[
    {prompt:'Find the annual compound rate required for QAR \\(8,000\\) to become QAR \\(14,000\\) in \\(9\\) years.',value:(14000/8000)**(1/9)-1,percent:true},
    {prompt:'Find the nominal annual rate compounded monthly required for QAR \\(20,000\\) to become QAR \\(30,000\\) in \\(5\\) years.',value:12*((30000/20000)**(1/60)-1),percent:true},
    {prompt:'Find the number of full years for QAR \\(5,000\\) to exceed QAR \\(10,000\\) at \\(6.3\\%\\) annually.',value:firstAbove(n=>5000*1.063**n,10000),integer:true},
    {prompt:'Find the first month for QAR \\(1,000\\) to exceed QAR \\(3,000\\) at \\(15\\%\\) nominal compounded monthly.',value:firstAbove(n=>1000*(1+.15/12)**n,3000),integer:true},
    {prompt:'A QAR \\(20,000\\) loan over \\(120\\) months has monthly payment QAR \\(300\\). Estimate the nominal annual rate.',loanRate:true,PV:20000,R:300,n:120}
  ];
  const solveRate=(PV,R,n)=>{let lo=0,hi=.05;for(let k=0;k<100;k++){const mid=(lo+hi)/2;if(pmt(PV,mid,n)>R)hi=mid;else lo=mid;}return 12*(lo+hi)/2;};
  inverse.forEach((item,index)=>{let value=item.value;if(item.loanRate)value=solveRate(item.PV,item.R,item.n);const answer=item.integer?`\\(${value}\\) completed periods.`:`\\(${fmt(value*100,3)}\\%\\) nominal p.a.`;const solution=item.loanRate?'Solve the TVM equation for monthly rate, then multiply by 12.':item.integer?'Solve the exponential boundary and verify adjacent integer periods.':'Isolate the periodic growth factor, then convert to the requested annual convention.';add('Challenge',`C${String(index+21).padStart(2,'0')}`,item.prompt,answer,solution,5,'GDC allowed','Determine',{check:{mode:'number',value:item.integer?value:Number((value*100).toFixed(3)),tolerance:item.integer?1e-9:.003}});});
  const integrated=[
    {prompt:'QAR \\(25,000\\) earns \\(4.2\\%\\) nominal monthly for \\(4\\) years while inflation is \\(3.4\\%\\) annually. Find nominal value, real value and exact real annual rate.',solution:(()=>{const nom=compound(25000,.042,12,4),real=nom/1.034**4,rr=(1+effective(.042,12))/1.034-1;return `Nominal QAR \\(${fmt(nom)}\\), real QAR \\(${fmt(real)}\\), exact real rate \\(${fmt(rr*100,3)}\\%\\).`;})()},
    {prompt:'A QAR \\(180,000\\) vehicle inflates at \\(2.6\\%\\) for \\(4\\) years. Savings begin at QAR \\(45,000\\) with QAR \\(2,200\\) monthly at \\(4.8\\%\\) nominal monthly. Find the funding gap.',solution:(()=>{const price=180000*1.026**4,sav=45000*(1+.048/12)**48+fvOrd(2200,.048/12,48);return `Price QAR \\(${fmt(price)}\\), savings QAR \\(${fmt(sav)}\\), gap QAR \\(${fmt(price-sav)}\\).`;})()},
    {prompt:'For the funding gap in the previous scenario, calculate the payment and total interest for a \\(3\\)-year loan at \\(5.4\\%\\) nominal monthly.',solution:(()=>{const price=180000*1.026**4,sav=45000*(1+.048/12)**48+fvOrd(2200,.048/12,48),gap=price-sav,R=pmt(gap,.054/12,36);return `Payment QAR \\(${fmt(R)}\\), total interest QAR \\(${fmt(36*R-gap)}\\).`;})()},
    {prompt:'A retirement fund of QAR \\(800,000\\) earns \\(5.4\\%\\) nominal monthly. Compare monthly withdrawals for \\(15\\) and \\(20\\) years and discuss the tradeoff.',solution:`About QAR \\(${fmt(pmt(800000,.054/12,180))}\\) for 15 years and QAR \\(${fmt(pmt(800000,.054/12,240))}\\) for 20 years; the shorter term provides more monthly income but for fewer years.`},
    {prompt:'A QAR \\(100,000\\) loan at \\(5.6\\%\\) nominal monthly is offered over \\(5\\) or \\(8\\) years. Compare payment and total interest, then state one practical criterion.',solution:(()=>{const i=.056/12,r5=pmt(100000,i,60),r8=pmt(100000,i,96);return `5-year payment QAR \\(${fmt(r5)}\\), interest QAR \\(${fmt(60*r5-100000)}\\); 8-year payment QAR \\(${fmt(r8)}\\), interest QAR \\(${fmt(96*r8-100000)}\\). Consider affordability and liquidity.`;})()}
  ];
  integrated.forEach((item,index)=>add('Challenge',`C${String(index+26).padStart(2,'0')}`,item.prompt,item.solution,item.solution,6,'GDC allowed',index===4?'Evaluate':'Calculate'));

  data.practice=q;
  data.financialPracticeAudit={total:q.length,distribution:Object.fromEntries(['Foundation','Application','Reasoning','Challenge'].map(level=>[level,q.filter(item=>item.level===level).length]))};
})();
