/* Original ECHS IB AI SL 1.4 + 1.7 tasks with classroom markschemes. */
(function(root){const data={
  "revision": "ib-ai-sl-1-4-1-7-v8",
  "questions": [
    {
      "id": "q01",
      "type": "number",
      "group": "Learning check",
      "prompt": "Write down the annual multiplier for an investment earning 4.5% compound interest per year.",
      "answer": 1.045,
      "unit": "multiplier",
      "hint": "Add the decimal rate to 1.",
      "solution": "\\(1+4.5/100=1.045\\)"
    },
    {
      "id": "q02",
      "type": "number",
      "group": "Learning check",
      "prompt": "An account pays a nominal annual rate of 6%, compounded monthly. Write down the monthly interest rate as a percentage.",
      "answer": 0.5,
      "unit": "% per month",
      "hint": "Divide the annual percentage by 12.",
      "solution": "\\(6/12=0.5\\%\\) each month; the decimal rate is 0.005."
    },
    {
      "id": "q03",
      "type": "number",
      "group": "Learning check",
      "prompt": "An account compounds half-yearly. Write down the number of compounding periods in 9 years.",
      "answer": 18,
      "unit": "periods",
      "hint": "Two periods occur each year.",
      "solution": "\\(N=2\\times9=18\\)."
    },
    {
      "id": "q04",
      "type": "number",
      "group": "Learning check",
      "prompt": "A single deposit of USD 5000 earns 2% per year compounded annually. Calculate its value after 2 years, to the nearest cent.",
      "answer": "5202.00",
      "unit": "USD",
      "hint": "Use the factor 1.02 twice.",
      "solution": "\\(5000(1.02)^2=5202\\); USD 5202.00.",
      "dp": 2
    },
    {
      "id": "q05",
      "type": "number",
      "group": "Learning check",
      "prompt": "For a single deposit of USD 5000 earning 2% per year compounded annually for 2 years, calculate the total interest earned, to the nearest cent.",
      "answer": "202.00",
      "unit": "USD",
      "hint": "Subtract the deposit from the final balance.",
      "solution": "\\(5202-5000=202\\); USD 202.00.",
      "dp": 2
    },
    {
      "id": "q06",
      "type": "number",
      "group": "Learning check",
      "prompt": "USD 5000 earns a nominal annual rate of 4.5%, compounded monthly, for 3 years. There are no further deposits or withdrawals. Calculate the final balance to the nearest cent.",
      "answer": "5721.24",
      "unit": "USD",
      "hint": "Use monthly rate 0.045/12 and 36 periods.",
      "solution": "\\(5000(1+0.045/12)^{36}\\) = USD 5,721.24.",
      "dp": 2
    },
    {
      "id": "q07",
      "type": "number",
      "group": "Learning check",
      "prompt": "Calculate the single deposit needed now to obtain USD 8000 after 5 years at 4% per year compounded annually. Give your answer to the nearest cent.",
      "answer": "6575.42",
      "unit": "USD",
      "hint": "Divide the target by the five-year growth factor.",
      "solution": "\\(PV=8000/(1.04)^5\\) = USD 6,575.42.",
      "dp": 2
    },
    {
      "id": "q08",
      "type": "number",
      "group": "Learning check",
      "prompt": "An investment grows from USD 4000 to USD 4630.50 in exactly 3 years, with annual compounding and no cash flows. Find the annual interest rate, to 3 significant figures.",
      "answer": "5.00",
      "unit": "% per year",
      "hint": "Solve 4000(1+r/100)^3=4630.50.",
      "solution": "\\(r=100((4630.50/4000)^{1/3}-1)=5.00\\%\\).",
      "sf": 3
    },
    {
      "id": "q09",
      "type": "number",
      "group": "Learning check",
      "prompt": "USD 1000 earns 10% per year compounded annually. Interest is credited only at year-end. Find the first completed year when the balance is at least USD 1331.",
      "answer": 3,
      "unit": "years",
      "hint": "Check the exact balance at consecutive year-ends.",
      "solution": "\\(V_2=1210,\\quad V_3=1331\\). Equality is allowed: year 3."
    },
    {
      "id": "q10",
      "type": "number",
      "group": "Learning check",
      "prompt": "USD 1000 earns 10% per year compounded annually. Interest is credited only at year-end. Find the first completed year when the balance exceeds USD 1331.",
      "answer": 4,
      "unit": "years",
      "hint": "Exceeds is a strict inequality.",
      "solution": "\\(V_3=1331,\\quad V_4=1464.10\\). The first qualifying year is 4."
    },
    {
      "id": "q11",
      "type": "number",
      "group": "Learning check",
      "prompt": "Write down the annual multiplier for an asset depreciating by 18% of its current value each year.",
      "answer": 0.82,
      "unit": "multiplier",
      "hint": "Retain 82% of the current value.",
      "solution": "\\(1-18/100=0.82\\)."
    },
    {
      "id": "q12",
      "type": "number",
      "group": "Learning check",
      "prompt": "A machine costs USD 24000 and depreciates by 15% of its current value each year. Calculate its value after 3 years, to the nearest cent.",
      "answer": "14739.00",
      "unit": "USD",
      "hint": "Multiply the initial value by 0.85 cubed.",
      "solution": "\\(24000(0.85)^3\\) = USD 14,739.00.",
      "dp": 2
    },
    {
      "id": "q13",
      "type": "number",
      "group": "Learning check",
      "prompt": "An asset worth USD 12000 now depreciates by 20% of its current value each year. Find its value 2 years ago under this model, to the nearest cent.",
      "answer": "18750.00",
      "unit": "USD",
      "hint": "Work backwards by dividing by 0.8 squared.",
      "solution": "\\(12000/(0.8)^2=18750\\); USD 18750.00.",
      "dp": 2
    },
    {
      "id": "q14",
      "type": "number",
      "group": "Learning check",
      "prompt": "An investment has a nominal value of USD 11025 after 2 years. Inflation is 5% per year. Calculate its real value in today’s dollars, to the nearest cent.",
      "answer": "10000.00",
      "unit": "today’s USD",
      "hint": "Divide by the price-level factor.",
      "solution": "\\(11025/(1.05)^2=10000\\); USD 10000.00 in today’s purchasing power.",
      "dp": 2
    },
    {
      "id": "q15",
      "type": "number",
      "group": "Learning check",
      "prompt": "An investment earns 4% annually and inflation is 6% annually. Calculate the real percentage change after one year, to 3 significant figures.",
      "answer": "-1.89",
      "unit": "%",
      "hint": "Use the ratio of the two annual factors, then subtract 1.",
      "solution": "\\(100(1.04/1.06-1)=-1.88679\\ldots\\%\\approx-1.89\\%\\).",
      "sf": 3
    },
    {
      "id": "q16",
      "type": "number",
      "group": "Learning check",
      "prompt": "For a single deposit of USD 5000 with no regular payments, write down the PMT entry in TI-Nspire Finance Solver.",
      "answer": 0,
      "unit": "PMT",
      "hint": "A lump sum has no repeated payment.",
      "solution": "\\(PMT=0\\). Clear any value left from an earlier problem."
    },
    {
      "id": "q17",
      "type": "number",
      "group": "Learning check",
      "prompt": "For an investor paying USD 5000 into an account now and receiving a positive final balance later, write down the signed PV entry in Finance Solver.",
      "answer": -5000,
      "unit": "signed USD",
      "hint": "Money paid out is negative from the investor’s viewpoint.",
      "solution": "\\(PV=-5000\\). The mathematical present value is USD 5000; the solver sign records cash-flow direction."
    },
    {
      "id": "q18",
      "type": "number",
      "group": "Learning check",
      "prompt": "An account compounds quarterly. Finance Solver gives N = 18.2 for reaching a target. Interest is credited only at quarter-end. Find the earliest qualifying time in years.",
      "answer": 4.75,
      "unit": "years",
      "hint": "Round up the period count first, then divide by 4.",
      "solution": "\\(N=19\\text{ quarters},\\quad t=19/4=4.75\\text{ years}\\)."
    },
    {
      "id": "q19",
      "type": "number",
      "group": "Learning check",
      "prompt": "A loan of USD 18000 is repaid monthly over 4 years, at 6% nominal annually compounded monthly. Write down N in Finance Solver.",
      "answer": 48,
      "unit": "payments",
      "hint": "Count 12 payments per year.",
      "solution": "\\(N=12\\times4=48\\)."
    },
    {
      "id": "q20",
      "type": "number",
      "group": "Learning check",
      "prompt": "A borrower receives USD 18000 today and repays it with end-of-month payments. Using the borrower’s cash-flow convention, write down the signed PV entry.",
      "answer": 18000,
      "unit": "signed USD",
      "hint": "The borrower receives money at the start.",
      "solution": "\\(PV=+18000\\). Payments are negative because money leaves the borrower."
    },
    {
      "id": "q21",
      "type": "number",
      "group": "Learning check",
      "prompt": "A loan of USD 18000 is fully repaid over 48 months at 6% nominal annually, compounded monthly. Payments are at month-end. Use technology to find the monthly payment amount to the nearest cent.",
      "answer": "422.73",
      "unit": "USD",
      "hint": "Set N=48, I%=6, PV=18000, FV=0, PpY=CpY=12, PmtAt=END; solve PMT.",
      "solution": "Finance Solver gives \\(PMT\\approx-422.73052286\\). Monthly payment amount: USD 422.73.",
      "dp": 2
    },
    {
      "id": "q22",
      "type": "number",
      "group": "Learning check",
      "prompt": "A loan has an opening balance of USD 10000. The nominal annual rate is 6%, compounded monthly. Calculate the interest charged in the first month, to the nearest cent.",
      "answer": "50.00",
      "unit": "USD",
      "hint": "Use the monthly rate 0.06/12 on the opening balance.",
      "solution": "\\(10000(0.06/12)=50\\); USD 50.00.",
      "dp": 2
    },
    {
      "id": "q23",
      "type": "number",
      "group": "Learning check",
      "prompt": "A month-end loan payment is USD 250. Interest charged for that month is USD 50. Calculate the principal repaid, to the nearest cent.",
      "answer": "200.00",
      "unit": "USD",
      "hint": "Split the payment into interest and principal.",
      "solution": "\\(250-50=200\\); USD 200.00.",
      "dp": 2
    },
    {
      "id": "q24",
      "type": "number",
      "group": "Learning check",
      "prompt": "A loan has an opening balance of USD 10000. In the first month, USD 50 interest is charged and a USD 250 payment is made at month-end. Find the balance just after this payment, to the nearest cent.",
      "answer": "9800.00",
      "unit": "USD",
      "hint": "Add interest, then subtract the payment.",
      "solution": "\\(10000+50-250=9800\\); USD 9800.00.",
      "dp": 2
    },
    {
      "id": "q25",
      "type": "number",
      "group": "Learning check",
      "prompt": "USD 200 is deposited at the end of each month into an account paying 6% nominal annually, compounded monthly. Initially the account is empty. Find the balance immediately after the second deposit, to the nearest cent.",
      "answer": "401.00",
      "unit": "USD",
      "hint": "The first deposit earns one month of interest; the second earns none yet.",
      "solution": "\\(200(1.005)+200=401\\); USD 401.00.",
      "dp": 2
    },
    {
      "id": "q26",
      "type": "number",
      "group": "Learning check",
      "prompt": "For an end-of-month savings annuity with no initial deposit, write down the PV entry in Finance Solver.",
      "answer": 0,
      "unit": "PV",
      "hint": "There is no lump sum at time 0.",
      "solution": "\\(PV=0\\). PMT is negative from the saver’s viewpoint; final FV is positive."
    },
    {
      "id": "q27",
      "type": "number",
      "group": "Learning check",
      "prompt": "A loan is repaid by exactly 36 equal payments of USD 310.25. The amount borrowed is USD 10000. Calculate the total interest paid, to the nearest cent.",
      "answer": "1169.00",
      "unit": "USD",
      "hint": "Total payments minus amount borrowed.",
      "solution": "\\(36(310.25)-10000=1169\\); USD 1169.00.",
      "dp": 2
    },
    {
      "id": "q28",
      "type": "number",
      "group": "Learning check",
      "prompt": "A loan balance is USD 5000 just after a payment. Next month’s rate is 1% and the next month-end payment is USD 40. Calculate the balance just after the next payment, to the nearest cent.",
      "answer": "5010.00",
      "unit": "USD",
      "hint": "Compare interest with the payment before subtracting.",
      "solution": "\\(5000(1.01)-40=5010\\); USD 5010.00. The payment is smaller than the USD 50 interest.",
      "dp": 2
    }
  ],
  "frqs": [
    {
      "id": "s01",
      "title": "A single deposit",
      "context": "Lina deposits USD 3600 at 3.2% per year compounded annually. No money is added or withdrawn.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Calculate the balance after 4 years. Give your answer to the nearest cent.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> \\(3600(1.032)^4\\) = USD 4,083.39.</p><ol><li>M1: use the factor 1.032 to power 4, with initial value 3600.</li><li>A1: USD 4,083.39.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Calculate the total interest earned over these 4 years, to the nearest cent.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> \\(3600(1.032)^4-3600\\) = USD 483.39.</p><ol><li>M1: subtract 3600 from the unrounded final balance.</li><li>A1: USD 483.39.</li></ol>"
        }
      ],
      "totalMarks": 4,
      "calculator": true,
      "calculatorLabel": "GDC available · Short response"
    },
    {
      "id": "s02",
      "title": "Quarterly compounding",
      "context": "A single deposit of USD 7500 earns a nominal annual rate of 4.8%, compounded quarterly, for 30 months.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Write down the quarterly interest rate and the number of compounding periods.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> \\(1.2\\%\\text{ per quarter},\\quad N=10\\).</p><ol><li>A1: 1.2% per quarter (or decimal 0.012 with clear label).</li><li>A1: 10 periods.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Calculate the final balance to the nearest cent. Assume no other cash flows.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> \\(7500(1.012)^{10}\\) = USD 8,450.19.</p><ol><li>M1: substitute the quarterly rate and 10 periods.</li><li>A1: USD 8,450.19.</li></ol>"
        }
      ],
      "totalMarks": 4,
      "calculator": true,
      "calculatorLabel": "GDC available · Short response"
    },
    {
      "id": "s03",
      "title": "Funding a future cost",
      "context": "A course will cost USD 6200 in 4 years. An account pays a nominal annual rate of 3.6%, compounded monthly, with no fees.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Find the single deposit needed today. Give your answer to the nearest cent.",
          "marks": 3,
          "rubric": "<p><strong>Worked answer:</strong> \\(PV=6200/(1+0.036/12)^{48}\\) = USD 5,369.66.</p><ol><li>M1: use monthly factor 1.003 and 48 periods.</li><li>M1: divide 6200 by the full growth factor (or solve for PV).</li><li>A1: USD 5,369.66.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "State one assumption, other than no fees, needed for this model to give the required balance.",
          "marks": 1,
          "rubric": "<p><strong>Worked answer:</strong> For example: the interest rate stays at 3.6% nominal annually for all 4 years. Also accept no withdrawals or the course cost remaining USD 6200.</p><ol><li>R1: a relevant assumption, linked to the stated model.</li></ol>"
        }
      ],
      "totalMarks": 4,
      "calculator": true,
      "calculatorLabel": "GDC available · Short response"
    },
    {
      "id": "s04",
      "title": "Finding a rate",
      "context": "A deposit of USD 4200 grows to USD 5000 in 5 years. Interest is compounded annually, with no other cash flows.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Find the annual interest rate, as a percentage to 3 significant figures.",
          "marks": 3,
          "rubric": "<p><strong>Worked answer:</strong> \\(4200(1+r/100)^5=5000\\); \\(r=100((5000/4200)^{1/5}-1)\\) = 3.55%.</p><ol><li>M1: a correct equation or Finance Solver entries.</li><li>M1: solve for the annual percentage rate.</li><li>A1: 3.55% per year.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Explain why 19.0% is not the annual compound rate.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> \\(100(5000-4200)/4200\\approx19.0\\%\\) is the increase over the entire 5-year period.</p><ol><li>R1: identifies 19.0% as a total five-year increase.</li><li>R1: explains that the annual compound factor is applied five times.</li></ol>"
        }
      ],
      "totalMarks": 5,
      "calculator": true,
      "calculatorLabel": "GDC available · Short response"
    },
    {
      "id": "s05",
      "title": "Annual depreciation",
      "context": "A camera costs USD 2800. Its value decreases by 12% of its current value at the end of each year.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Write down a model for its value V after n completed years.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> \\(V=2800(0.88)^n\\), \\(n=0,1,2,\\ldots\\).</p><ol><li>A1: multiplier 0.88.</li><li>A1: model 2800(0.88)^n with n measured in completed years.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Calculate the value after 4 years, to the nearest cent.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> \\(2800(0.88)^4\\) = USD 1,679.15.</p><ol><li>M1: evaluate the model at n=4.</li><li>A1: USD 1,679.15.</li></ol>"
        }
      ],
      "totalMarks": 4,
      "calculator": true,
      "calculatorLabel": "GDC available · Short response"
    },
    {
      "id": "s06",
      "title": "Recovering a depreciation rate",
      "context": "A vehicle’s value falls from USD 18000 to USD 13122 over exactly 3 years. It depreciates at a constant annual percentage rate.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Find the annual depreciation rate, as a percentage.",
          "marks": 3,
          "rubric": "<p><strong>Worked answer:</strong> \\(18000(1-d/100)^3=13122\\) gives \\(1-d/100=0.9\\), so \\(d=10\\%\\).</p><ol><li>M1: use a three-year decay model.</li><li>M1: find the annual retention factor 0.9.</li><li>A1: 10% annual depreciation.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Calculate the loss in value during the third year, to the nearest cent.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> \\(18000(0.9)^2-18000(0.9)^3=1458\\); USD 1458.00.</p><ol><li>M1: subtract the year-3 value from the year-2 value.</li><li>A1: USD 1458.00.</li></ol>"
        }
      ],
      "totalMarks": 5,
      "calculator": true,
      "calculatorLabel": "GDC available · Short response"
    },
    {
      "id": "s07",
      "title": "Nominal value and purchasing power",
      "context": "USD 10000 is invested at 5% per year compounded annually for 3 years. Inflation stays at 2.5% per year.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Calculate the nominal final value, to the nearest cent.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> \\(10000(1.05)^3=11576.25\\); USD 11576.25.</p><ol><li>M1: compound by 1.05 for 3 years.</li><li>A1: USD 11576.25.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Calculate the real final value in today’s dollars, to the nearest cent.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> \\(11576.25/(1.025)^3\\) = USD 10,749.70 in today’s purchasing power.</p><ol><li>M1: divide the nominal final balance by the inflation factor cubed.</li><li>A1: USD 10,749.70 in today’s dollars.</li></ol>"
        }
      ],
      "totalMarks": 4,
      "calculator": true,
      "calculatorLabel": "GDC available · Short response"
    },
    {
      "id": "s08",
      "title": "A calculator setup audit",
      "context": "A single USD 6000 deposit earns 4.2% nominal annually, compounded monthly, for 5 years. A student enters N=5, I%=0.35, PV=6000, PMT=200, PpY=12 and CpY=12, then solves for FV.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Correct N, I%, PV and PMT using the investor cash-flow convention.",
          "marks": 3,
          "rubric": "<p><strong>Worked answer:</strong> \\(N=60,\\ I\\%=4.2,\\ PV=-6000,\\ PMT=0\\). PpY=CpY=12 remains correct.</p><ol><li>A1: N=60.</li><li>A1: I%=4.2, the nominal annual percentage.</li><li>A1: PV=-6000 and PMT=0.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Calculate the correct final balance to the nearest cent.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> \\(6000(1+0.042/12)^{60}\\) = USD 7,399.35.</p><ol><li>M1: a correct expression or corrected solver setup.</li><li>A1: USD 7,399.35.</li></ol>"
        }
      ],
      "totalMarks": 5,
      "calculator": true,
      "calculatorLabel": "GDC available · Short response"
    },
    {
      "id": "s09",
      "title": "Repaying a car loan",
      "context": "A borrower receives USD 18000 at 6% nominal annually, compounded monthly. The loan is fully repaid by 48 equal end-of-month payments. Assume no fees and use the unrounded payment in later calculations.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Use technology to find the monthly payment amount, to the nearest cent. State the Finance Solver entries.",
          "marks": 3,
          "rubric": "<p><strong>Worked answer:</strong> \\(N=48,\\ I\\%=6,\\ PV=18000,\\ FV=0,\\ PpY=CpY=12\\), PmtAt=END. Solve PMT: \\(PMT\\approx-422.73052286\\). Amount: USD 422.73.</p><ol><li>M1: matching monthly frequency, 48 payments and END.</li><li>M1: PV=18000, FV=0; solve for negative PMT.</li><li>A1: USD 422.73 per month.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Find the total interest paid, to the nearest cent.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> \\(48\\times422.7305228628-18000\\) = USD 2,291.07.</p><ol><li>M1: multiply the unrounded payment amount by 48 and subtract 18000.</li><li>A1: USD 2,291.07.</li></ol>"
        }
      ],
      "totalMarks": 5,
      "calculator": true,
      "calculatorLabel": "GDC available · Short response"
    },
    {
      "id": "s10",
      "title": "The first two loan payments",
      "context": "A USD 10000 loan earns interest at 6% nominal annually, compounded monthly. The borrower pays USD 250 at each month-end.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Find the interest and principal portions of the first payment, to the nearest cent.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> Interest: \\(10000(0.06/12)=50\\). Principal: \\(250-50=200\\). Both amounts are in USD.</p><ol><li>A1: USD 50.00 interest.</li><li>A1: USD 200.00 principal.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Find the balance immediately after the second payment, to the nearest cent.",
          "marks": 3,
          "rubric": "<p><strong>Worked answer:</strong> After payment 1: USD 9800.00. Month-2 interest: \\(9800(0.005)=49\\). New balance: \\(9800+49-250=9599\\); USD 9599.00.</p><ol><li>M1: use the reduced balance of 9800 for month-2 interest.</li><li>M1: add 49 interest and subtract 250.</li><li>A1: USD 9599.00.</li></ol>"
        }
      ],
      "totalMarks": 5,
      "calculator": true,
      "calculatorLabel": "GDC available · Short response"
    },
    {
      "id": "s11",
      "title": "Regular saving",
      "context": "An account starts with zero balance and pays 4.8% nominal annually, compounded monthly. Noor deposits USD 200 at each month-end for 3 years.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Use technology to find the balance immediately after the 36th deposit, to the nearest cent. State your setup.",
          "marks": 3,
          "rubric": "<p><strong>Worked answer:</strong> \\(N=36,\\ I\\%=4.8,\\ PV=0,\\ PMT=-200,\\ PpY=CpY=12\\), END; solve FV = USD 7,727.62.</p><ol><li>M1: set 36 end-of-month payments with monthly compounding.</li><li>M1: PV=0, PMT=-200; solve for FV.</li><li>A1: USD 7,727.62.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Calculate the interest earned, to the nearest cent.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> \\(FV-36(200)\\) = USD 527.62.</p><ol><li>M1: subtract all USD 7200 of deposits.</li><li>A1: USD 527.62.</li></ol>"
        }
      ],
      "totalMarks": 5,
      "calculator": true,
      "calculatorLabel": "GDC available · Short response"
    },
    {
      "id": "s12",
      "title": "A withdrawal fund",
      "context": "A fund pays 3.6% nominal annually, compounded monthly. It must provide 60 withdrawals of USD 1200, each at month-end, leaving zero balance immediately after the last withdrawal.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Find the amount required in the fund today, to the nearest cent. State your technology setup.",
          "marks": 3,
          "rubric": "<p><strong>Worked answer:</strong> \\(N=60,\\ I\\%=3.6,\\ PMT=1200,\\ FV=0,\\ PpY=CpY=12\\), END. Solve PV = -65801.87413528. The required deposit amount is USD 65,801.87.</p><ol><li>M1: 60 monthly withdrawals, END and FV=0.</li><li>M1: PMT=1200 and solve PV with the opposite sign.</li><li>A1: USD 65,801.87.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Explain why the initial fund can be less than USD 72000.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> USD 72000 is the total withdrawn. While money remains invested, it earns interest, which funds part of the withdrawals.</p><ol><li>R1: identifies 72000 as the total withdrawals.</li><li>R1: explains the contribution of interest earned on the remaining balance.</li></ol>"
        }
      ],
      "totalMarks": 5,
      "calculator": true,
      "calculatorLabel": "GDC available · Short response"
    },
    {
      "id": "e01",
      "title": "Comparing two accounts",
      "context": "Sam invests USD 8000 for 6 years with no other cash flows. Account A pays 4% per year compounded annually. Account B pays 3.95% nominal annually, compounded monthly. Both rates stay constant and there are no fees.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Calculate the final balance in each account, to the nearest cent.",
          "marks": 3,
          "rubric": "<p><strong>Worked answer:</strong> \\(A=8000(1.04)^6,\\quad B=8000(1+0.0395/12)^{72}\\). A: USD 10,122.55; B: USD 10,135.58.</p><ol><li>M1: correct expressions with matching rates and period counts.</li><li>A1: A = USD 10,122.55.</li><li>A1: B = USD 10,135.58.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Determine which account gives the larger final balance and by how much, to the nearest cent. Justify your choice.",
          "marks": 3,
          "rubric": "<p><strong>Worked answer:</strong> Account B, by USD 13.03. Compare unrounded balances before rounding the difference.</p><ol><li>M1: subtract the two unrounded final balances.</li><li>A1: USD 13.03.</li><li>R1: B has the greater balance despite the smaller nominal annual rate.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "Calculate the percentage increase in Account B over one year, to 3 significant figures.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> \\(100((1+0.0395/12)^{12}-1)\\) = 4.02%.</p><ol><li>M1: compound the monthly factor 12 times and subtract 1.</li><li>A1: 4.02%.</li></ol>"
        }
      ],
      "totalMarks": 8,
      "calculator": true,
      "calculatorLabel": "GDC available · Extended response"
    },
    {
      "id": "e02",
      "title": "The first credit date",
      "context": "USD 5000 earns 3.6% nominal annually, compounded monthly. Interest is credited only at month-end. There are no other cash flows.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Write an expression for the balance after n completed months.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> \\(V_n=5000(1.003)^n\\).</p><ol><li>A1: monthly factor 1.003.</li><li>A1: initial value 5000 and exponent n measured in months.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Find the first completed month at which the balance is at least USD 7000. Show that the previous month does not meet the target.",
          "marks": 3,
          "rubric": "<p><strong>Worked answer:</strong> \\(5000(1.003)^n=7000\\) gives \\(n\\approx112.325564\\). At month 112: USD 6,993.18; at month 113: USD 7,014.16. First qualifying month: 113.</p><ol><li>M1: solve the target equation or inspect a table.</li><li>A1: 113 months.</li><li>R1: demonstrate the failed previous month and successful chosen month.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "Express this waiting time in years and months.",
          "marks": 1,
          "rubric": "<p><strong>Worked answer:</strong> 9 years and 5 months.</p><ol><li>A1: 9 years and 5 months.</li></ol>"
        }
      ],
      "totalMarks": 6,
      "calculator": true,
      "calculatorLabel": "GDC available · Extended response"
    },
    {
      "id": "e03",
      "title": "A replacement threshold",
      "context": "A machine costs USD 32000 and depreciates by 18% of its current value each year. The business plans to replace it at the first year-end when its value is below USD 12000.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Find the machine’s value after 4 years, to the nearest cent.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> \\(32000(0.82)^4\\) = USD 14,467.90.</p><ol><li>M1: correct decay calculation.</li><li>A1: USD 14,467.90.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Determine the replacement year. Support your answer with values at two consecutive year-ends.",
          "marks": 3,
          "rubric": "<p><strong>Worked answer:</strong> At year 4: USD 14,467.90; at year 5: USD 11,863.67. Replace at the end of year 5.</p><ol><li>M1: find the threshold or test consecutive integer years.</li><li>A1: year 5.</li><li>R1: year 4 is above USD 12000 and year 5 is below it.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "Explain why subtracting USD 5760 every year is not the stated model.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> USD 5760 is 18% of the initial value. Here each year’s loss is 18% of the current, decreasing value, so the annual loss gets smaller.</p><ol><li>R1: identifies the fixed subtraction as 18% of the original value.</li><li>R1: explains that reducing-balance depreciation uses the changing current value.</li></ol>"
        }
      ],
      "totalMarks": 7,
      "calculator": true,
      "calculatorLabel": "GDC available · Extended response"
    },
    {
      "id": "e04",
      "title": "Growing money, falling purchasing power",
      "context": "A single USD 15000 investment earns 4% nominal annually, compounded quarterly, for 8 years. Annual inflation is 5.5%. Assume both rates stay fixed.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Calculate the nominal final balance, to the nearest cent.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> \\(15000(1.01)^{32}\\) = USD 20,624.11.</p><ol><li>M1: factor 1.01 and 32 periods.</li><li>A1: USD 20,624.11.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Calculate the real final value in today’s dollars and its percentage change from the initial USD 15000. Give the real value to the nearest cent and the percentage change to 3 significant figures.",
          "marks": 3,
          "rubric": "<p><strong>Worked answer:</strong> \\(R=15000(1.01)^{32}/(1.055)^8\\) = USD 13,438.65; \\(100(R/15000-1)\\) = -10.4%.</p><ol><li>M1: divide the nominal value by the eight-year price factor.</li><li>A1: USD 13,438.65 in today’s dollars.</li><li>A1: -10.4% change.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "Explain how the nominal value can rise while the real value falls.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> The balance increases, but prices grow faster. The investment’s one-year factor \\((1.01)^4\\approx1.04060\\) is smaller than the price factor 1.055, so purchasing power falls.</p><ol><li>R1: distinguishes money amount from purchasing power.</li><li>R1: compares the annual factors or uses the calculated nominal and real values correctly.</li></ol>"
        }
      ],
      "totalMarks": 7,
      "calculator": true,
      "calculatorLabel": "GDC available · Extended response"
    },
    {
      "id": "e05",
      "title": "Interpreting a table and graph",
      "context": "A financial model gives the following exact year-end balances, with no deposits or withdrawals after year 0: <table><caption>Investment balance</caption><thead><tr><th>Completed years</th><th>Balance (USD)</th></tr></thead><tbody><tr><td>0</td><td>2000</td></tr><tr><td>1</td><td>2080</td></tr><tr><td>2</td><td>2163.20</td></tr><tr><td>3</td><td>2249.728</td></tr></tbody></table><div data-finance-graph=\"table-investment\"></div>",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Show that the data fit annual compound growth at 4%.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> \\(2080/2000=2163.2/2080=2249.728/2163.2=1.04\\). Each annual increase is 4% of the current balance.</p><ol><li>M1: use consecutive ratios from the table.</li><li>A1: common ratio 1.04 with interpretation as 4% per year.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Use this model to predict the year-5 balance, to the nearest cent.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> \\(2000(1.04)^5\\) = USD 2,433.31.</p><ol><li>M1: evaluate 2000(1.04)^5.</li><li>A1: USD 2,433.31.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "The graph joins the year-end points with a line. Explain why it does not by itself establish the actual credited balance halfway through year 2.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> The data specify completed-year balances. The connecting line is a mathematical interpolation; the account’s terms would be needed to know how or when interest is credited within a year.</p><ol><li>R1: identifies that only year-end balances are supplied.</li><li>R1: distinguishes an interpolated model from actual intra-year crediting rules.</li></ol>"
        }
      ],
      "totalMarks": 6,
      "calculator": true,
      "calculatorLabel": "GDC available · Extended response"
    },
    {
      "id": "e06",
      "title": "Loan term and affordability",
      "context": "A USD 24000 loan has a nominal annual interest rate of 5.4%, compounded monthly. It is fully repaid through equal month-end payments. Consider terms of 3 years and 5 years. Ignore fees and retain unrounded payment amounts in totals.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Find the monthly payment for each term, to the nearest cent.",
          "marks": 3,
          "rubric": "<p><strong>Worked answer:</strong> Use I%=5.4, PV=24000, FV=0, PpY=CpY=12, END. For N=36, payment USD 723.62. For N=60, payment USD 457.32.</p><ol><li>M1: two correct Finance Solver setups differing in N.</li><li>A1: USD 723.62 for 3 years.</li><li>A1: USD 457.32 for 5 years.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Find the total interest for each term, to the nearest cent.",
          "marks": 3,
          "rubric": "<p><strong>Worked answer:</strong> 3 years: \\(36\\times723.6196404459-24000\\) = USD 2,050.31. 5 years: \\(60\\times457.3209477949-24000\\) = USD 3,439.26.</p><ol><li>M1: total payments minus 24000 in both cases.</li><li>A1: USD 2,050.31 for 3 years.</li><li>A1: USD 3,439.26 for 5 years.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "The borrower can pay at most USD 500 per month. Determine which of these terms is affordable, and state its interest-cost trade-off.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> The 5-year term is affordable at USD 457.32 per month; the 3-year term is above USD 500. The longer term has lower payments but costs more total interest.</p><ol><li>R1: selects 5 years using the USD 500 limit.</li><li>R1: identifies the larger total interest with the longer term.</li></ol>"
        }
      ],
      "totalMarks": 8,
      "calculator": true,
      "calculatorLabel": "GDC available · Extended response"
    },
    {
      "id": "e07",
      "title": "Reading an amortization schedule",
      "context": "A USD 30000 loan is fully repaid by 60 equal month-end payments at 4.8% nominal annually, compounded monthly. Use the unrounded payment for all subsequent calculations.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Find the payment amount, to the nearest cent, using technology.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> N=60, I%=4.8, PV=30000, FV=0, PpY=CpY=12, END. Solve PMT ≈ -563.3922603087. Payment amount: USD 563.39.</p><ol><li>M1: correct solver setup with END and FV=0.</li><li>A1: USD 563.39.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Find the outstanding balance immediately after payment 24, to the nearest cent. Show your technology method.",
          "marks": 3,
          "rubric": "<p><strong>Worked answer:</strong> Keep I%=4.8, PV=30000, PMT=-563.3922603087, PpY=CpY=12 and END; change N to 24 and solve FV. The solver gives FV ≈ -18854.4154608319. The amount still owed is USD 18,854.42. An amortization table is also valid.</p><ol><li>M1: uses 24 completed payments and the original unrounded payment.</li><li>M1: solves FV or reads the amortization schedule at payment 24.</li><li>A1: USD 18,854.42 owed.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "Find the interest and principal portions of payment 25, each to the nearest cent.",
          "marks": 3,
          "rubric": "<p><strong>Worked answer:</strong> Interest = \\(B_{24}(0.048/12)\\) = USD 75.42. Principal = payment − interest = USD 487.97.</p><ol><li>M1: charge interest on the balance just after payment 24.</li><li>A1: USD 75.42 interest.</li><li>A1: USD 487.97 principal.</li></ol>"
        }
      ],
      "totalMarks": 8,
      "calculator": true,
      "calculatorLabel": "GDC available · Extended response"
    },
    {
      "id": "e08",
      "title": "A savings target with regular deposits",
      "context": "An initially empty account earns 4.2% nominal annually, compounded monthly. Equal deposits are made at each month-end for 4 years, with a target balance of USD 12000 immediately after the last deposit.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Find the regular deposit needed, to the nearest cent. State the Finance Solver entries.",
          "marks": 3,
          "rubric": "<p><strong>Worked answer:</strong> N=48, I%=4.2, PV=0, FV=12000, PpY=CpY=12, END; solve PMT ≈ -230.0239436671. Deposit amount: USD 230.02.</p><ol><li>M1: monthly settings, N=48 and END.</li><li>M1: PV=0, FV=12000; solve the negative PMT.</li><li>A1: USD 230.02.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Using the unrounded payment, find the total amount deposited and the interest earned, each to the nearest cent.",
          "marks": 3,
          "rubric": "<p><strong>Worked answer:</strong> Deposited: \\(48\\times230.0239436671\\) = USD 11,041.15. Interest: \\(12000-48\\times230.0239436671\\) = USD 958.85.</p><ol><li>M1: use the unrounded payment for both totals.</li><li>A1: USD 11,041.15 deposited.</li><li>A1: USD 958.85 interest.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "Explain why multiplying the first deposit by a four-year growth factor and then multiplying by 48 would overestimate the balance.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> The deposits enter at different dates. The first earns interest for 47 months; the last is included immediately after it is made and earns no interest yet. Treating all 48 as present for 4 years overcounts interest.</p><ol><li>R1: identifies different investment durations.</li><li>R1: correctly uses 47 months for the first deposit and zero for the last, or an equally clear timing explanation.</li></ol>"
        }
      ],
      "totalMarks": 8,
      "calculator": true,
      "calculatorLabel": "GDC available · Extended response"
    },
    {
      "id": "c01",
      "title": "A rate change halfway through",
      "context": "USD 9000 is invested for 5 years with no withdrawals or extra deposits. For the first 2 years the rate is 3% per year compounded annually. For the next 3 years the nominal annual rate is 4.8%, compounded quarterly.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Calculate the final balance to the nearest cent.",
          "marks": 3,
          "rubric": "<p><strong>Worked answer:</strong> \\(9000(1.03)^2(1+0.048/4)^{12}\\) = USD 11,017.50.</p><ol><li>M1: compound the first 2 years with factor 1.03.</li><li>M1: apply 12 quarterly factors of 1.012 to that unrounded balance.</li><li>A1: USD 11,017.50.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Find the constant annual compound rate that would produce the same final balance over 5 years. Give the percentage to 3 significant figures.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> \\(9000(1+r/100)^5=11017.50126116\\); \\(r=100((FV/9000)^{1/5}-1)\\) = 4.13%.</p><ol><li>M1: equate five-year factors, using the unrounded final value.</li><li>A1: 4.13%.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "Explain why averaging 3% and 4.8% is not a valid method here.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> The rates apply for different lengths of time, and the second rate compounds quarterly. The total effect is the product of the stage growth factors.</p><ol><li>R1: identifies unequal durations and/or different compounding frequencies.</li><li>R1: explains that growth factors must be compounded, rather than adding or averaging the quoted percentages.</li></ol>"
        }
      ],
      "totalMarks": 7,
      "calculator": true,
      "calculatorLabel": "GDC available · SL 1.4 challenge"
    },
    {
      "id": "c02",
      "title": "Savings meet a falling price",
      "context": "Maya has USD 9000 invested at 4% per year compounded annually. A used vehicle currently costs USD 18000 and is modelled to depreciate by 12% of its current value each year. She compares her balance with the vehicle’s modelled price only at year-end.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Write expressions for the savings S and the vehicle price C after n completed years.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> \\(S_n=9000(1.04)^n,\\quad C_n=18000(0.88)^n\\).</p><ol><li>A1: correct savings model.</li><li>A1: correct depreciation model.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Find the first completed year at which Maya can afford the vehicle. Justify your answer with consecutive-year comparisons.",
          "marks": 3,
          "rubric": "<p><strong>Worked answer:</strong> At year 4: savings USD 10,528.73, price USD 10,794.52. At year 5: savings USD 10,949.88, price USD 9,499.17. The first qualifying year is 5.</p><ol><li>M1: solve or tabulate the two models.</li><li>A1: year 5.</li><li>R1: shows S<C at year 4 and S≥C at year 5.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "State one limitation of using these models to plan the purchase.",
          "marks": 1,
          "rubric": "<p><strong>Worked answer:</strong> For example: the actual resale price may change with condition or market demand, rather than depreciating at a fixed 12% each year. Also accept a clearly explained variable interest rate or omitted purchase costs.</p><ol><li>R1: a relevant limitation with its consequence for the prediction.</li></ol>"
        }
      ],
      "totalMarks": 6,
      "calculator": true,
      "calculatorLabel": "GDC available · SL 1.4 challenge"
    },
    {
      "id": "c03",
      "title": "An inflation-adjusted target",
      "context": "A single investment must increase its purchasing power by 3% over one year. Inflation is 2.5% over that year. The investment compounds quarterly at a constant nominal annual percentage rate r, with no fees or other cash flows.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Show that the required nominal one-year growth factor is 1.05575.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> \\(\\frac{(1+r/400)^4}{1.025}=1.03\\) implies \\((1+r/400)^4=1.03(1.025)=1.05575\\).</p><ol><li>M1: relate real growth to nominal growth divided by the price factor.</li><li>A1: obtain 1.05575, with supporting working.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Find r to 3 significant figures.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> \\(r=400(1.05575^{1/4}-1)\\) = 5.46%.</p><ol><li>M1: solve the quarterly growth equation.</li><li>A1: 5.46% nominal per year.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "A student adds the two percentages and claims the annual nominal growth is exactly 5.5%. Explain the error.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> The factors multiply: \\(1.03\\times1.025=1.05575\\), giving 5.575% nominal growth over the year. Adding percentages omits their product contribution. The quoted nominal annual rate with quarterly compounding is a different quantity again.</p><ol><li>R1: correctly identifies factor multiplication and 5.575% total nominal growth.</li><li>R1: explains why addition misses the interaction term.</li></ol>"
        }
      ],
      "totalMarks": 6,
      "calculator": true,
      "calculatorLabel": "GDC available · SL 1.4 challenge"
    },
    {
      "id": "c04",
      "title": "A smaller final repayment",
      "context": "A USD 10000 loan has interest at 6% nominal annually, compounded monthly. Payments of USD 250 are made at month-end until the remaining balance can be cleared by a smaller final payment. Interest and balances are not rounded between months in this model.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Use technology to find the model number N of equal USD 250 payments needed to clear the loan. Give N to 3 decimal places.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> I%=6, PV=10000, PMT=-250, FV=0, PpY=CpY=12, END; solve N ≈ 44.740.</p><ol><li>M1: correct Finance Solver setup, solving N.</li><li>A1: 44.740 periods.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Find the number of full USD 250 payments and the smaller final payment, to the nearest cent.",
          "marks": 3,
          "rubric": "<p><strong>Worked answer:</strong> There are 44 full payments. After payment 44, the balance is USD 184.25 (unrounded internally). One more month’s interest gives a final payment of USD 185.17, made at the end of month 45.</p><ol><li>M1: use 44 full payments before the last payment.</li><li>M1: find the remaining balance and add one month of interest.</li><li>A1: 44 full payments and USD 185.17 at month 45.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "Calculate the total interest paid, to the nearest cent.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> \\(44(250)+185.1671692129-10000\\) = USD 1,185.17.</p><ol><li>M1: total full payments plus unrounded final payment minus 10000.</li><li>A1: USD 1,185.17.</li></ol>"
        }
      ],
      "totalMarks": 7,
      "calculator": true,
      "calculatorLabel": "GDC available · SL 1.4 challenge"
    }
  ]
};if(typeof module!=='undefined'&&module.exports)module.exports=data;else root.FinanceLessonQuestions=data;})(typeof window!=='undefined'?window:globalThis);
