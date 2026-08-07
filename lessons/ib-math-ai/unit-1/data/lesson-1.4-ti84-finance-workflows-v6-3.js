(function(){
'use strict';
const data=window.LESSON_DATA;
if(!data||String(data.lesson?.number)!=='1.4')return;

const step=(keys,label,detail)=>({keys,label,detail});
const workflow=(id,code,group,title,prompt,math,manualSteps,tiSteps,entry,output,verification,ibStatement,handheldAlternative='')=>({
  id,code,group,title,prompt,math,manualSteps,tiSteps,entry,output,verification,ibStatement,handheldAlternative
});

const commonTVMStart=[
  step(['APPS','Finance','1:TVM Solver...'],'Open TVM Solver','Press APPS, choose Finance, then select 1:TVM Solver.'),
];
const solveTarget=(target)=>[
  step(['↑/↓ to '+target],'Move to the unknown','Place the cursor on '+target+' after every other required field is entered.'),
  step(['ALPHA','ENTER (SOLVE)'],'Solve the highlighted variable','The green SOLVE command is above ENTER. Record the full calculator output before rounding.')
];

const workflows={
  'effective-rate':workflow(
    'effective-rate','F1','Rates','Nominal rate to effective annual rate',
    'Find the effective annual rate for 4.8% nominal interest compounded monthly.',
    String.raw`r_{\mathrm{eff}}=\left(1+\frac{0.048}{12}\right)^{12}-1`,
    [
      'Recognize that 4.8% is a nominal annual rate, so the monthly periodic rate is 0.048/12.',
      'Use the one-year multiplier (1+0.048/12)^12.',
      'Subtract 1 and convert the result to a percentage.',
      'Keep guard digits until the final percentage is reported.'
    ],
    [
      step(['APPS','Finance','C:eff('],'Open the effective-rate function','In the Finance menu choose C:eff(. The function expects the nominal percentage and the number of compounding periods per year.'),
      step(['4.8',',','12',')'],'Enter the rate and frequency','Enter 4.8,12). Use 4.8 rather than 0.048 because the Finance function uses percent form.'),
      step(['ENTER'],'Evaluate','The calculator returns the effective annual rate as a percentage.')
    ],
    String.raw`\operatorname{eff}(4.8,12)`,
    String.raw`4.907020753\%`,
    'Check independently that (1+0.048/12)^12−1=0.0490702075.',
    'The effective annual rate is approximately 4.91%, since 4.8% nominal compounded monthly produces a one-year growth factor of about 1.049070.',
    'Home-screen alternative: type (1+0.048/12)^12−1 and multiply by 100.'
  ),
  'compound-lump':workflow(
    'compound-lump','F2','Compound interest','Future value of one lump sum',
    'QAR 10,000 is invested for 5 years at 5% nominal interest compounded monthly. Find the future value.',
    String.raw`A=10000\left(1+\frac{0.05}{12}\right)^{60}`,
    [
      'Convert five years to N=60 monthly periods.',
      'Use the annual nominal rate I%=5 with P/Y=12 and C/Y=12.',
      'Choose one cash-flow viewpoint: the initial investment leaves the investor, so PV is negative and FV is positive.',
      'Verify the TVM output with the compound-interest formula.'
    ],
    [
      ...commonTVMStart,
      step(['N=60','I%=5','PV=(−)10000','PMT=0','FV=0'],'Enter the values','Use the physical (−) key for the negative present value; subtraction is a different key.'),
      step(['P/Y=12','C/Y=12','PMT: END'],'Set the frequency','For this monthly model use 12 payment periods and 12 compoundings per year. PMT is zero, so END/BEGIN does not change the result.'),
      ...solveTarget('FV')
    ],
    String.raw`N=60,\ I\%=5,\ PV=-10000,\ PMT=0,\ FV=?,\ P/Y=C/Y=12`,
    String.raw`FV=12833.58679`,
    'Check that 10000(1+0.05/12)^60=12833.586785.',
    'The investment is worth approximately QAR 12,833.59 after five years.',
    'The opposite sign convention, PV positive and FV negative, is equally valid if it is used consistently.'
  ),
  'annuity-fv':workflow(
    'annuity-fv','F3','Regular deposits','Future value of an ordinary annuity',
    'Deposit QAR 600 at each month-end for 8 years at 5.4% nominal interest compounded monthly.',
    String.raw`FV=600\frac{(1+0.054/12)^{96}-1}{0.054/12}`,
    [
      'The deposits occur at month-end, so use END mode.',
      'There are N=8×12=96 payments.',
      'From the saver viewpoint each deposit is an outflow, so PMT is negative and the accumulated FV is positive.',
      'Compare the future value with total contributions 600×96=57,600.'
    ],
    [
      ...commonTVMStart,
      step(['N=96','I%=5.4','PV=0','PMT=(−)600','FV=0'],'Enter the cash flows','The regular deposits have the opposite sign from the final balance.'),
      step(['P/Y=12','C/Y=12','PMT: END'],'Select monthly END mode','Move to PMT: END BEGIN and select END because each deposit is made at month-end.'),
      ...solveTarget('FV')
    ],
    String.raw`N=96,\ I\%=5.4,\ PV=0,\ PMT=-600,\ FV=?,\ P/Y=C/Y=12,\ END`,
    String.raw`FV=71845.74787`,
    'Total contributions are QAR 57,600, so interest earned is 71,845.74787−57,600=14,245.74787.',
    'The month-end deposits accumulate to approximately QAR 71,845.75; about QAR 14,245.75 of this is interest.',
    'Do not divide I% by 12 before entering TVM Solver when P/Y and C/Y are both 12.'
  ),
  'annuity-due':workflow(
    'annuity-due','F4','Payment timing','Future value of an annuity due',
    'Deposit QAR 500 at the beginning of each month for 5 years at 6% nominal interest compounded monthly.',
    String.raw`FV_{\mathrm{due}}=500\frac{(1+0.06/12)^{60}-1}{0.06/12}(1+0.06/12)`,
    [
      'There are 60 deposits, but every deposit is made one period earlier than in an ordinary annuity.',
      'Use BEGIN mode rather than adding an extra payment.',
      'Enter PMT as negative and solve for the positive accumulated balance.',
      'Check that the BEGIN result equals the END result multiplied by 1.005.'
    ],
    [
      ...commonTVMStart,
      step(['N=60','I%=6','PV=0','PMT=(−)500','FV=0'],'Enter the values','Keep N=60; payment timing changes, not the number of deposits.'),
      step(['P/Y=12','C/Y=12','PMT: BEGIN'],'Select BEGIN mode','Move to PMT: END BEGIN, highlight BEGIN and press ENTER.'),
      ...solveTarget('FV')
    ],
    String.raw`N=60,\ I\%=6,\ PV=0,\ PMT=-500,\ FV=?,\ P/Y=C/Y=12,\ BEGIN`,
    String.raw`FV=35059.44033`,
    'The corresponding END-mode value is 34,885.01525 and 34,885.01525×1.005=35,059.44033.',
    'Beginning-of-month deposits accumulate to approximately QAR 35,059.44.',
    'Return the calculator to END mode after this example unless the next problem also states beginning-of-period payments.'
  ),
  'withdrawal-pmt':workflow(
    'withdrawal-pmt','F5','Withdrawal annuities','Monthly withdrawal from a retirement fund',
    'QAR 500,000 earns 5.25% nominal compounded monthly. Find the month-end withdrawal that exhausts the fund after 25 years.',
    String.raw`R=500000\frac{0.0525/12}{1-(1+0.0525/12)^{-300}}`,
    [
      'Use N=25×12=300 and END mode.',
      'Choose the retiree viewpoint: the initial fund deposit is an outflow, so PV is negative; withdrawals are positive inflows.',
      'Set FV=0 because the fund is exhausted immediately after the final withdrawal.',
      'Verify the payment with the present-value annuity formula.'
    ],
    [
      ...commonTVMStart,
      step(['N=300','I%=5.25','PV=(−)500000','PMT=0','FV=0'],'Enter the fund model','PV and PMT must have opposite signs.'),
      step(['P/Y=12','C/Y=12','PMT: END'],'Use monthly END mode','Withdrawals occur at month-end.'),
      ...solveTarget('PMT')
    ],
    String.raw`N=300,\ I\%=5.25,\ PV=-500000,\ PMT=?,\ FV=0,\ P/Y=C/Y=12,\ END`,
    String.raw`PMT=2996.238576`,
    'Substitution into PV=R[1−(1+i)^−300]/i reproduces QAR 500,000 to rounding.',
    'The fund supports a monthly withdrawal of approximately QAR 2,996.24 for 25 years under the stated fixed-rate assumptions.',
    'Using PV positive produces PMT negative; report the withdrawal magnitude and explain the sign convention.'
  ),
  'loan-payment':workflow(
    'loan-payment','F6','Loans','Level monthly repayment',
    'A QAR 120,000 loan is repaid monthly over 6 years at 5.1% nominal interest compounded monthly.',
    String.raw`R=120000\frac{0.051/12}{1-(1+0.051/12)^{-72}}`,
    [
      'Use N=72 monthly repayments and END mode.',
      'From the borrower viewpoint the loan received is PV=+120000 and repayments leave the borrower, so PMT is negative.',
      'Set FV=0 because the loan is extinguished after the final payment.',
      'Verify the first row: interest is 120000(0.051/12)=510.'
    ],
    [
      ...commonTVMStart,
      step(['N=72','I%=5.1','PV=120000','PMT=0','FV=0'],'Enter the loan contract','Enter the annual nominal rate as 5.1, not 0.051.'),
      step(['P/Y=12','C/Y=12','PMT: END'],'Set monthly END mode','Repayments are made at each month-end.'),
      ...solveTarget('PMT')
    ],
    String.raw`N=72,\ I\%=5.1,\ PV=120000,\ PMT=?,\ FV=0,\ P/Y=C/Y=12,\ END`,
    String.raw`PMT=-1938.163150`,
    'First-month interest is QAR 510.00, principal repaid is 1938.163150−510=1428.163150, and the closing balance is QAR 118,571.83685.',
    'The required monthly repayment is approximately QAR 1,938.16. The negative calculator sign indicates money leaving the borrower.',
    'Keep the full PMT value for balance calculations; round only the reported currency amount.'
  ),
  'outstanding-balance':workflow(
    'outstanding-balance','F7','Outstanding balance','Balance and amortization evidence after 24 payments',
    'A QAR 90,000 loan at 4.9% nominal monthly is repaid over 60 months. Find the balance immediately after payment 24 and the interest paid in payments 1–24.',
    String.raw`B_{24}=90000(1+i)^{24}-R\frac{(1+i)^{24}-1}{i},\qquad i=\frac{0.049}{12}`,
    [
      'First solve the TVM model for the exact monthly payment.',
      'Use bal(24) only after the TVM variables and END mode have been set correctly.',
      'Use ΣInt(1,24) and ΣPrn(1,24) for cumulative interest and principal; interpret signs using the same viewpoint.',
      'Check that original principal minus principal repaid equals the outstanding balance.'
    ],
    [
      ...commonTVMStart,
      step(['N=60','I%=4.9','PV=90000','PMT=0','FV=0','P/Y=12','C/Y=12','PMT: END'],'Enter the loan model','Solve PMT first and retain the calculator value −1694.290817846.'),
      step(['↑/↓ to PMT','ALPHA','ENTER (SOLVE)'],'Solve and retain PMT','Do not replace the stored payment with a rounded currency value.'),
      step(['2nd','MODE (QUIT)'],'Return to the home screen','The TVM settings remain stored for the Finance functions.'),
      step(['APPS','Finance','9:bal(','24',')','ENTER'],'Calculate the balance','bal(24) gives the balance immediately after payment 24.'),
      step(['APPS','Finance','A:ΣInt(','1',',','24',')','ENTER'],'Calculate cumulative interest','Use the magnitude if the displayed sign follows the borrower cash-flow convention.'),
      step(['APPS','Finance','0:ΣPrn(','1',',','24',')','ENTER'],'Calculate cumulative principal','Interest plus principal equals the total of the first 24 payments.')
    ],
    String.raw`PMT=-1694.290817846,\quad \operatorname{bal}(24),\quad \Sigma\operatorname{Int}(1,24),\quad \Sigma\operatorname{Prn}(1,24)`,
    String.raw`B_{24}=56615.97563,\quad |\Sigma Int|=7278.95526,\quad |\Sigma Prn|=33384.02437`,
    '90,000−33,384.02437=56,615.97563 and 7,278.95526+33,384.02437=24(1,694.290817846).',
    'Immediately after payment 24, the outstanding balance is approximately QAR 56,615.98. During payments 1–24, about QAR 7,278.96 is interest and QAR 33,384.02 reduces principal.',
    'Finance-menu letters can vary by model or language. Select the named function bal(, ΣInt( or ΣPrn( if its menu label differs.'
  )
};

window.ECHS_TI84_FINANCE_WORKFLOWS=workflows;
data.ti84FinanceClassroom={
  release:'6.3.0',
  simulator:'local-echs-gdc-v7',
  pairedMethod:'manual → TI-84 Finance → verify → IB conclusion',
  modes:['teacher','follow','drill'],
  workflowIds:Object.keys(workflows),
  officialMenuAudit:'TVM Solver, eff(, bal(, ΣInt( and ΣPrn(',
  signConvention:'opposite cash-flow directions use opposite signs'
};
})();