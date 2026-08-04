(function(){
  'use strict';
  const data=window.LESSON_DATA;
  if(!data||String(data.lesson?.number)!=='1.4')return;
  const fmt=(value,dp=2)=>Number(value.toFixed(dp)).toLocaleString('en-US',{minimumFractionDigits:dp,maximumFractionDigits:dp});
  const compound=(P,j,m,t)=>P*(1+j/m)**(m*t);
  const effective=(j,m)=>(1+j/m)**m-1;
  const fvOrd=(R,i,n)=>Math.abs(i)<1e-14?R*n:R*((1+i)**n-1)/i;
  const fvDue=(R,i,n)=>fvOrd(R,i,n)*(1+i);
  const pvAnn=(R,i,n)=>Math.abs(i)<1e-14?R*n:R*(1-(1+i)**(-n))/i;
  const pmt=(PV,i,n)=>Math.abs(i)<1e-14?PV/n:PV*i/(1-(1+i)**(-n));
  const balance=(PV,i,R,k)=>Math.abs(i)<1e-14?PV-R*k:PV*(1+i)**k-R*((1+i)**k-1)/i;
  const payoffPeriods=(PV,i,R)=>-Math.log(1-PV*i/R)/Math.log(1+i);
  const firstAbove=(fn,target,max=1000)=>{let n=1;while(fn(n)<=target&&n<max)n+=1;return n;};

  const quiz=[];
  const add=(id,level,prompt,answer,solution,marks=2,calculator='No calculator',command='Calculate',extra={})=>quiz.push(Object.assign({id:`FINV6-1.4-Q${String(id).padStart(2,'0')}`,level,prompt,answer,solution,marks,calculator,command,hint:'Use a cash-flow timeline and record the rate convention.',tags:['financial applications','independent quiz']},extra));
  add(1,'Foundation','A nominal annual rate of \\(6.6\\%\\) is compounded monthly. State the monthly periodic rate as a decimal.','\\(0.0055\\).','\\(0.066/12=0.0055\\).',1,'No calculator','State',{check:{mode:'number',value:.0055,tolerance:1e-10}});
  {const value=compound(14500,.048,4,5);add(2,'Application','Find the value of QAR \\(14,500\\) after \\(5\\) years at \\(4.8\\%\\) nominal interest compounded quarterly.',`QAR \\(${fmt(value)}\\).`,`\\(14500(1+0.048/4)^{20}=${fmt(value)}\\).`,3,'GDC allowed','Calculate',{check:{mode:'number',value:Number(value.toFixed(2)),tolerance:.03}});}
  {const a=effective(.061,12),b=.062;add(3,'Reasoning','Which one-year return is larger: \\(6.1\\%\\) nominal compounded monthly or \\(6.2\\%\\) compounded annually?',a>b?'The monthly-compounded option.':'The annual option.',`The monthly option has EAR \\(${fmt(a*100,3)}\\%\\), compared with \\(6.2\\%\\).`,3,'GDC allowed','Compare',{choices:['6.1% nominal monthly','6.2% annual','They are equal','Cannot be compared'],correct:a>b?0:1});}
  {const value=95000*.86**4;add(4,'Application','A vehicle worth QAR \\(95,000\\) depreciates by \\(14\\%\\) annually. Find its value after \\(4\\) years.',`QAR \\(${fmt(value)}\\).`,`\\(95000(0.86)^4=${fmt(value)}\\).`,3,'GDC allowed','Calculate',{check:{mode:'number',value:Number(value.toFixed(2)),tolerance:.03}});}
  {const value=18000/1.028**5;add(5,'Application','A nominal amount is QAR \\(18,000\\) after \\(5\\) years. Inflation averaged \\(2.8\\%\\) annually. Find its real value in base-year currency.',`QAR \\(${fmt(value)}\\).`,`\\(18000/(1.028)^5=${fmt(value)}\\).`,3,'GDC allowed','Calculate',{check:{mode:'number',value:Number(value.toFixed(2)),tolerance:.03}});}
  {const value=fvOrd(450,.046/12,84);add(6,'Application','QAR \\(450\\) is deposited at each month-end for \\(7\\) years at \\(4.6\\%\\) nominal compounded monthly. Find the future value.',`QAR \\(${fmt(value)}\\).`,`Use \\(i=0.046/12\\), \\(n=84\\) in the ordinary-annuity formula.`,3,'GDC allowed','Calculate',{check:{mode:'number',value:Number(value.toFixed(2)),tolerance:.04}});}
  {const value=fvDue(1200,.032,12);add(7,'Application','QAR \\(1,200\\) is deposited at the beginning of each year for \\(12\\) years at \\(3.2\\%\\) annually. Find the future value.',`QAR \\(${fmt(value)}\\).`,`Find the ordinary-annuity value and multiply by \\(1.032\\).`,3,'GDC allowed','Calculate',{check:{mode:'number',value:Number(value.toFixed(2)),tolerance:.04}});}
  {const i=.05/12,n=48,value=8000*(1+i)**n+fvOrd(250,i,n);add(8,'Application','An account begins with QAR \\(8,000\\), followed by QAR \\(250\\) at each month-end for \\(4\\) years at \\(5\\%\\) nominal monthly. Find the final balance.',`QAR \\(${fmt(value)}\\).`,`Add the accumulated initial amount and ordinary-annuity future value.`,4,'GDC allowed','Calculate',{check:{mode:'number',value:Number(value.toFixed(2)),tolerance:.04}});}
  {const fn=n=>fvOrd(400,.048/12,n),n=firstAbove(fn,30000);add(9,'Challenge','QAR \\(400\\) is deposited monthly at \\(4.8\\%\\) nominal compounded monthly. Find the least number of deposits for the balance to exceed QAR \\(30,000\\).',`\\(${n}\\) deposits.`,`\\(FV_{${n-1}}=${fmt(fn(n-1))}\\) and \\(FV_{${n}}=${fmt(fn(n))}\\).`,4,'GDC allowed','Determine',{check:{mode:'number',value:n,tolerance:1e-9}});}
  add(10,'Foundation','From a borrower’s viewpoint, which TVM setup has a consistent sign convention?','\\(PV>0\\) and \\(PMT<0\\).','The loan is money received now; repayments are money paid later.',1,'No calculator','Identify',{choices:['PV and PMT both positive','PV positive and PMT negative','PV and PMT both zero','FV positive and N negative'],correct:1});
  {const value=pmt(65000,.053/12,60);add(11,'Application','Find the monthly payment on a QAR \\(65,000\\) loan over \\(5\\) years at \\(5.3\\%\\) nominal compounded monthly.',`QAR \\(${fmt(value)}\\).`,`Use \\(R=PV\\,i/[1-(1+i)^{-60}]\\) with \\(i=0.053/12\\).`,3,'GDC allowed','Calculate',{check:{mode:'number',value:Number(value.toFixed(2)),tolerance:.04}});}
  {const B=40000,i=.0045,R=900,interest=B*i,principal=R-interest,closing=B-principal;add(12,'Application','A loan opens the month at QAR \\(40,000\\), with monthly rate \\(0.0045\\) and payment QAR \\(900\\). Find interest, principal repaid and closing balance.',`QAR \\(${fmt(interest)}\\), QAR \\(${fmt(principal)}\\), QAR \\(${fmt(closing)}\\).`,`Interest \\(=iB\\); principal \\(=R-I\\); closing \\(=B-P\\).`,3,'No calculator','Calculate',{check:{mode:'text',accepted:[`${fmt(interest)},${fmt(principal)},${fmt(closing)}`,`${interest} ${principal} ${closing}`]}});}
  {const PV=100000,i=.052/12,n=84,R=pmt(PV,i,n),value=balance(PV,i,R,30);add(13,'Challenge','A QAR \\(100,000\\) loan at \\(5.2\\%\\) nominal monthly is repaid over \\(84\\) months. Find the outstanding balance after \\(30\\) payments.',`QAR \\(${fmt(value)}\\).`,`Use the exact payment \\(R=${fmt(R,6)}\\) in a retrospective or prospective balance formula.`,4,'GDC allowed','Calculate',{check:{mode:'number',value:Number(value.toFixed(2)),tolerance:.05}});}
  {const PV=110000,i=.05/12,n=72,regular=pmt(PV,i,n),newR=regular+200,newN=Math.ceil(payoffPeriods(PV,i,newR)-1e-12);add(14,'Challenge','A QAR \\(110,000\\) loan at \\(5\\%\\) nominal monthly is scheduled for \\(72\\) payments. The borrower adds QAR \\(200\\) to each regular payment. Estimate the new number of payments.',`About \\(${newN}\\) payments.`,`Regular payment is QAR \\(${fmt(regular)}\\); the larger payment gives ${payoffPeriods(PV,i,newR).toFixed(3)} periods, so \\(${newN}\\) payments are required.`,4,'GDC allowed','Determine',{check:{mode:'number',value:newN,tolerance:1e-9}});}
  {const i=.056/12,r5=pmt(100000,i,60),r8=pmt(100000,i,96);add(15,'Reasoning','For the same QAR \\(100,000\\) principal at \\(5.6\\%\\) nominal monthly, compare a \\(5\\)-year loan with an \\(8\\)-year loan.',`The 5-year payment is QAR \\(${fmt(r5)}\\) with interest QAR \\(${fmt(60*r5-100000)}\\); the 8-year payment is QAR \\(${fmt(r8)}\\) with interest QAR \\(${fmt(96*r8-100000)}\\).`,`The longer term reduces payment size but increases total interest.`,4,'GDC allowed','Compare');}
  add(16,'Reasoning','A recommendation changes when the assumed rate moves from \\(4.7\\%\\) to \\(4.8\\%\\). What is the best conclusion?','The choice is sensitive and should be reported using scenarios.','A small plausible input change reverses the result, so the recommendation is not robust.',2,'No calculator','Evaluate',{choices:['The 4.8% model is always correct','The choice is robust','The choice is sensitive','Rates should be ignored'],correct:2});
  data.quiz=quiz;

  const tasks=[];
  const task=(id,style,title,total,calculator,context,parts)=>tasks.push({id:`FINV6-1.4-E0${id}`,style,title,total_marks:total,calculator,context,parts});

  const e1Nom=compound(24000,.042,12,4),e1Real=e1Nom/1.034**4,e1Dep=68000*.87**4;
  task(1,'Paper 1-style financial growth','Nominal value, real value and depreciation',13,'GDC expected','A school invests QAR \\(24,000\\) for \\(4\\) years at \\(4.2\\%\\) nominal interest compounded monthly. Inflation averages \\(3.4\\%\\) annually. A separate item of equipment worth QAR \\(68,000\\) depreciates by \\(13\\%\\) annually.',[
    {label:'a',prompt:'State the monthly periodic interest rate and the number of compounding periods.',marks:2,answer:'\\(i=0.042/12=0.0035\\), \\(N=48\\).',markscheme:'A1 periodic rate; A1 period count.'},
    {label:'b',prompt:'Calculate the nominal value of the investment after \\(4\\) years.',marks:2,answer:`QAR \\(${fmt(e1Nom)}\\).`,markscheme:'M1 compound model; A1 value.'},
    {label:'c',prompt:'Calculate the real value of the investment in base-year currency.',marks:3,answer:`QAR \\(${fmt(e1Real)}\\).`,markscheme:'M1 inflation factor; M1 division/indexing; A1 value.'},
    {label:'d',prompt:'Calculate the equipment value after \\(4\\) years.',marks:2,answer:`QAR \\(${fmt(e1Dep)}\\).`,markscheme:'M1 depreciation factor; A1 value.'},
    {label:'e',prompt:'Explain one difference between the inflation model and the depreciation model.',marks:2,answer:'Inflation increases a price index with factor above one, while depreciation decreases asset value with a retention factor below one.',markscheme:'R1 identifies direction/factor; R1 contextual meaning.'},
    {label:'f',prompt:'State one limitation of using a constant annual inflation or depreciation rate.',marks:2,answer:'Rates and market conditions can change over time, so the projected values may be unreliable.',markscheme:'A1 relevant limitation; R1 effect on reliability.'}
  ]);

  const e2i=.049/12,e2n=72,e2fv=fvOrd(900,e2i,e2n),e2due=fvDue(900,e2i,e2n),e2Target=firstAbove(n=>fvOrd(900,e2i,n),80000);
  task(2,'Paper 2-style savings annuity','Education savings plan',14,'GDC expected','A family deposits QAR \\(900\\) at the end of each month into an account paying \\(4.9\\%\\) nominal interest compounded monthly.',[
    {label:'a',prompt:'Write down the periodic rate and the number of deposits made in \\(6\\) years.',marks:2,answer:'\\(i=0.049/12\\), \\(n=72\\).',markscheme:'A1 each.'},
    {label:'b',prompt:'Calculate the value immediately after the final deposit at the end of \\(6\\) years.',marks:3,answer:`QAR \\(${fmt(e2fv)}\\).`,markscheme:'M1 ordinary-annuity model; M1 substitution; A1 value.'},
    {label:'c',prompt:'Calculate the total contributions and the interest earned.',marks:3,answer:`Contributions QAR \\(${fmt(900*72)}\\); interest QAR \\(${fmt(e2fv-900*72)}\\).`,markscheme:'A1 contributions; M1 subtraction; A1 interest.'},
    {label:'d',prompt:'Find the value if every deposit is instead made at the beginning of each month.',marks:2,answer:`QAR \\(${fmt(e2due)}\\).`,markscheme:'M1 annuity-due factor; A1 value.'},
    {label:'e',prompt:'Determine the least number of end-of-month deposits required for the account to exceed QAR \\(80,000\\).',marks:3,answer:`\\(${e2Target}\\) deposits, with the adjacent values checked.`,markscheme:'M1 solve/table; A1 integer count; A1 adjacent verification.'},
    {label:'f',prompt:'State one reason the actual account balance may differ from the model.',marks:1,answer:'Examples include variable rates, fees, missed deposits or tax.',markscheme:'A1 relevant reason.'}
  ]);

  const e3PV=85000,e3i=.052/12,e3n=72,e3R=pmt(e3PV,e3i,e3n),e3B=balance(e3PV,e3i,e3R,24),e3New=Math.ceil(payoffPeriods(e3PV,e3i,e3R+250)-1e-12);
  task(3,'Paper 2-style loan and amortization','Accessible transport loan',16,'GDC expected','A school borrows QAR \\(85,000\\) for an accessible transport vehicle. The loan is repaid monthly over \\(6\\) years at \\(5.2\\%\\) nominal interest compounded monthly.',[
    {label:'a',prompt:'Set up the TVM variables from the borrower’s viewpoint, including signs and timing.',marks:3,answer:'\\(N=72\\), \\(I\\%=5.2\\), \\(PV=+85000\\), \\(FV=0\\), \\(P/Y=C/Y=12\\), END mode, and \\(PMT<0\\).',markscheme:'A1 N/rate/frequencies; A1 PV/FV; A1 signs/timing.'},
    {label:'b',prompt:'Calculate the required monthly repayment.',marks:2,answer:`QAR \\(${fmt(e3R)}\\).`,markscheme:'M1 solve/model; A1 payment.'},
    {label:'c',prompt:'Calculate total repayment and total interest using the exact model payment.',marks:3,answer:`Total QAR \\(${fmt(e3R*72)}\\); interest QAR \\(${fmt(e3R*72-e3PV)}\\).`,markscheme:'M1 total; M1 subtract principal; A1 values.'},
    {label:'d',prompt:'For the first payment, calculate the interest and principal components.',marks:2,answer:`Interest QAR \\(${fmt(e3PV*e3i)}\\); principal QAR \\(${fmt(e3R-e3PV*e3i)}\\).`,markscheme:'A1 interest; A1 principal.'},
    {label:'e',prompt:'Calculate the outstanding balance immediately after payment \\(24\\).',marks:3,answer:`QAR \\(${fmt(e3B)}\\).`,markscheme:'M1 correct balance formula; M1 exact payment; A1 result.'},
    {label:'f',prompt:'If QAR \\(250\\) is added to each payment, estimate the new number of payments.',marks:2,answer:`About \\(${e3New}\\) payments.`,markscheme:'M1 new-payment term solve; A1 whole payment count.'},
    {label:'g',prompt:'State one practical issue to check before recommending the extra-payment strategy.',marks:1,answer:'Examples include liquidity, emergency savings or a prepayment penalty.',markscheme:'A1 relevant issue.'}
  ]);

  const e4PV=650000,e4i=.054/12,e4n=25*12,e4R=pmt(e4PV,e4i,e4n),e4B20=balance(e4PV,e4i,e4R,20*12),e4Life=Math.ceil(payoffPeriods(e4PV,e4i,3500)-1e-12);
  task(4,'Paper 2-style annuity withdrawal','Retirement income fund',15,'GDC expected','A retiree places QAR \\(650,000\\) in a fund earning \\(5.4\\%\\) nominal interest compounded monthly. Withdrawals are made at each month-end.',[
    {label:'a',prompt:'Calculate the monthly withdrawal that will exhaust the fund after \\(25\\) years.',marks:3,answer:`QAR \\(${fmt(e4R)}\\).`,markscheme:'M1 PV annuity model; M1 substitution; A1 value.'},
    {label:'b',prompt:'Calculate the total amount withdrawn and the interest generated over \\(25\\) years.',marks:3,answer:`Withdrawn QAR \\(${fmt(e4R*e4n)}\\); interest QAR \\(${fmt(e4R*e4n-e4PV)}\\).`,markscheme:'M1 total withdrawals; M1 subtract PV; A1 values.'},
    {label:'c',prompt:'Calculate the balance after \\(20\\) years under this plan.',marks:3,answer:`QAR \\(${fmt(e4B20)}\\).`,markscheme:'M1 balance model; M1 remaining periods or retrospective method; A1 value.'},
    {label:'d',prompt:'If the retiree instead withdraws QAR \\(3,500\\) monthly, estimate how many payments the fund supports.',marks:3,answer:`About \\(${e4Life}\\) payments.`,markscheme:'M1 solve for N; A1 whole count; A1 interpretation.'},
    {label:'e',prompt:'Explain why a fixed monthly withdrawal may lose purchasing power.',marks:2,answer:'Inflation increases prices while the nominal withdrawal remains unchanged.',markscheme:'R1 inflation effect; R1 purchasing-power interpretation.'},
    {label:'f',prompt:'State one assumption of the model.',marks:1,answer:'The interest rate and withdrawal timing remain fixed.',markscheme:'A1 relevant assumption.'}
  ]);

  const e5A=30000*1.044**6,e5B=29820*(1+.043/12)**72,e5RealA=e5A/1.025**6,e5RealB=e5B/1.025**6;
  task(5,'Paper 2-style financial comparison','Two investment offers',14,'GDC expected','Mira has QAR \\(30,000\\) to invest for \\(6\\) years. Bank A pays \\(4.4\\%\\) compounded annually. Bank B charges QAR \\(180\\) immediately and invests the remaining amount at \\(4.3\\%\\) nominal interest compounded monthly. Inflation is modeled at \\(2.5\\%\\) annually.',[
    {label:'a',prompt:'Calculate the nominal future value at Bank A.',marks:2,answer:`QAR \\(${fmt(e5A)}\\).`,markscheme:'M1 model; A1 value.'},
    {label:'b',prompt:'Calculate the net nominal future value at Bank B.',marks:3,answer:`QAR \\(${fmt(e5B)}\\).`,markscheme:'M1 subtract fee; M1 monthly model; A1 value.'},
    {label:'c',prompt:'Calculate the real value of each investment.',marks:3,answer:`Bank A QAR \\(${fmt(e5RealA)}\\); Bank B QAR \\(${fmt(e5RealB)}\\).`,markscheme:'M1 inflation factor; A1 each real value.'},
    {label:'d',prompt:'Recommend a bank using the numerical evidence.',marks:2,answer:`Bank ${e5A>e5B?'A':'B'} under the stated assumptions because it has the larger same-date net value.`,markscheme:'A1 choice; R1 comparative evidence.'},
    {label:'e',prompt:'State two omitted factors that could change the recommendation.',marks:2,answer:'Examples: tax, variable rates, access, risk, further fees or penalties.',markscheme:'A1 each factor.'},
    {label:'f',prompt:'Explain why comparing the advertised rates alone is insufficient.',marks:2,answer:'The plans differ in fees and compounding frequency, so effective net outcomes differ from nominal labels.',markscheme:'R1 fee/timing issue; R1 compounding/effective-value issue.'}
  ]);

  const e6i=.048/12,e6n=48,e6Savings=45000*(1+e6i)**e6n+fvOrd(2200,e6i,e6n),e6Price=180000*1.026**4,e6Gap=e6Price-e6Savings,e6Loan=pmt(e6Gap,.054/12,36);
  task(6,'Paper 2-style integrated financial model','School vehicle replacement plan',16,'GDC expected','A school plans to replace a vehicle in \\(4\\) years. It has QAR \\(45,000\\) now and deposits QAR \\(2,200\\) at each month-end in an account earning \\(4.8\\%\\) nominal interest compounded monthly. The current vehicle price is QAR \\(180,000\\), with price inflation modeled at \\(2.6\\%\\) annually.',[
    {label:'a',prompt:'Calculate the future value of the current QAR \\(45,000\\).',marks:2,answer:`QAR \\(${fmt(45000*(1+e6i)**e6n)}\\).`,markscheme:'M1 compound model; A1 value.'},
    {label:'b',prompt:'Calculate the future value of the monthly deposits.',marks:3,answer:`QAR \\(${fmt(fvOrd(2200,e6i,e6n))}\\).`,markscheme:'M1 ordinary annuity; M1 settings; A1 value.'},
    {label:'c',prompt:'Hence find the total savings after \\(4\\) years.',marks:1,answer:`QAR \\(${fmt(e6Savings)}\\).`,markscheme:'A1 sum.'},
    {label:'d',prompt:'Calculate the projected vehicle price and the funding gap.',marks:3,answer:`Price QAR \\(${fmt(e6Price)}\\); gap QAR \\(${fmt(e6Gap)}\\).`,markscheme:'M1 inflation model; A1 price; A1 gap.'},
    {label:'e',prompt:'The gap is financed over \\(3\\) years at \\(5.4\\%\\) nominal compounded monthly. Calculate the monthly repayment and total interest.',marks:4,answer:`Payment QAR \\(${fmt(e6Loan)}\\); interest QAR \\(${fmt(36*e6Loan-e6Gap)}\\).`,markscheme:'M1 loan setup; M1 payment; M1 total interest; A1 values.'},
    {label:'f',prompt:'Evaluate one limitation and one sensitivity test for the plan.',marks:3,answer:'A limitation is that investment, inflation or loan rates may change. Test nearby rates, delayed deposits or a different replacement date to see whether the funding recommendation remains viable.',markscheme:'A1 limitation; A1 relevant sensitivity input; R1 effect on decision.'}
  ]);
  data.exam=tasks;

  const mathSegment=/(\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\])/g;
  const sanitizeMath=value=>value.replace(mathSegment,segment=>segment.replace(/</g,'\\lt ').replace(/>/g,'\\gt '));
  const visited=new WeakSet();
  const sanitizeDeep=value=>{
    if(typeof value==='string')return sanitizeMath(value);
    if(!value||typeof value!=='object'||visited.has(value))return value;
    visited.add(value);
    if(Array.isArray(value)){for(let i=0;i<value.length;i+=1)value[i]=sanitizeDeep(value[i]);return value;}
    for(const key of Object.keys(value))value[key]=sanitizeDeep(value[key]);
    return value;
  };
  sanitizeDeep(data);
  data.v6Audit={
    release:'6.0.0',purposefulScreens:data.slides.length,practiceQuestions:data.practice.length,
    practiceDistribution:Object.fromEntries(['Foundation','Application','Reasoning','Challenge'].map(level=>[level,data.practice.filter(item=>item.level===level).length])),
    quizQuestions:data.quiz.length,extendedTasks:data.exam.length,
    unifiedFinancialApplications:true,mergedLegacyLoansAnnuities:true,approximationRemainsInLesson11:true,
    cashFlowTimelines:true,nominalPeriodicEffectiveRates:true,compoundInterest:true,depreciationInflationRealValue:true,
    ordinaryAnnuity:true,annuityDue:true,withdrawalAnnuity:true,loanPayments:true,amortization:true,outstandingBalances:true,
    extraPaymentStrategies:true,interactiveCompoundExplorer:true,interactiveCashFlowExplorer:true,generativeStudio:true,
    focusedAssessmentPager:true,noInlineSvg:data.slides.every(item=>!/<svg/i.test(item.html)),
    growingAnnuityExtensionExcludedFromCore:true,
    sourceBasis:['Pearson financial applications','Haese Core Topics SL 1','Haese Loans and annuities','Nikolaidis MAI 2.19']
  };
  delete window.__ECHS_FINANCE_V6;
})();
