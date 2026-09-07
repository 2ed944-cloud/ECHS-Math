/* Original ECHS AI SL 1.2 questions and classroom markschemes. */
(function(root){const data={
  "revision": "ib-ai-sl-1-2-arithmetic-v7",
  "questions": [
    {
      "id": "q01",
      "type": "number",
      "group": "Learning check",
      "prompt": "Find the common difference of \\(9,14,19,24,\\ldots\\).",
      "answer": 5,
      "unit": "exact value",
      "hint": "Subtract an earlier term from the next term.",
      "solution": "Each step adds \\(14-9=19-14=5\\), so \\(d=5\\)."
    },
    {
      "id": "q02",
      "type": "number",
      "group": "Learning check",
      "prompt": "An arithmetic sequence has \\(u_n=50-3n\\). Find its first term.",
      "answer": 47,
      "unit": "exact value",
      "hint": "The first term has index 1.",
      "solution": "Substitute \\(n=1\\): \\(u_1=50-3=47\\). The intercept 50 would correspond to index 0."
    },
    {
      "id": "q03",
      "type": "number",
      "group": "Learning check",
      "prompt": "Find \\(u_{18}\\) when \\(u_1=12\\) and \\(d=4\\).",
      "answer": 80,
      "unit": "exact value",
      "hint": "There are 17 changes between term 1 and term 18.",
      "solution": "\\(u_{18}=12+17(4)=80\\)."
    },
    {
      "id": "q04",
      "type": "number",
      "group": "Learning check",
      "prompt": "Find \\(u_{20}\\) when \\(u_1=92\\) and \\(d=-4\\).",
      "answer": 16,
      "unit": "exact value",
      "hint": "Keep the negative sign on the common difference.",
      "solution": "\\(u_{20}=92+19(-4)=16\\)."
    },
    {
      "id": "q05",
      "type": "number",
      "group": "Learning check",
      "prompt": "An arithmetic sequence has \\(u_4=29\\) and \\(u_{10}=65\\). Find \\(d\\).",
      "answer": 6,
      "unit": "exact value",
      "hint": "The difference 65 − 29 spans 10 − 4 steps.",
      "solution": "\\(d=\\frac{65-29}{10-4}=6\\)."
    },
    {
      "id": "q06",
      "type": "number",
      "group": "Learning check",
      "prompt": "An arithmetic sequence has \\(u_4=29\\) and \\(d=6\\). Find \\(u_1\\).",
      "answer": 11,
      "unit": "exact value",
      "hint": "Move backward three steps from term 4.",
      "solution": "\\(u_1=29-3(6)=11\\)."
    },
    {
      "id": "q07",
      "type": "number",
      "group": "Learning check",
      "prompt": "An arithmetic sequence starts at 8 and has common difference 3. Calculate the sum of its first 16 terms.",
      "answer": 488,
      "unit": "exact total",
      "hint": "Find the last term, then average the first and last terms and multiply by 16.",
      "solution": "\\(u_{16}=8+15(3)=53\\) and \\(S_{16}=\\frac{16}{2}(8+53)=488\\)."
    },
    {
      "id": "q08",
      "type": "number",
      "group": "Learning check",
      "prompt": "Evaluate \\(\\displaystyle\\sum_{k=3}^{9}(2k+5)\\).",
      "answer": 119,
      "unit": "exact total",
      "hint": "There are 9 − 3 + 1 terms; the first summand uses k = 3.",
      "solution": "\\(9-3+1=7\\) terms run from \\(11\\) to \\(23\\). Their sum is \\(\\frac72(11+23)=119\\)."
    },
    {
      "id": "q09",
      "type": "number",
      "group": "Learning check",
      "prompt": "A hypothetical account pays simple interest at 2.5% per year on an original principal of 6000 QAR. There are no deposits or withdrawals. Find the balance after 4 years.",
      "answer": 6600,
      "unit": "QAR",
      "hint": "Simple interest is calculated on the original principal each year.",
      "solution": "Annual interest is \\(6000(0.025)=150\\) QAR. The balance is \\(6000+4(150)=6600\\) QAR."
    },
    {
      "id": "q10",
      "type": "number",
      "group": "Learning check",
      "prompt": "A student reads 150 pages in week 1 and increases the weekly target by 40 pages. Find the first week with a target greater than 650 pages.",
      "answer": 14,
      "unit": "whole-number week",
      "hint": "The inequality is strict. Check the candidate week and the week before it.",
      "solution": "\\(150+40(n-1)>650\\) gives \\(n>13.5\\). Week 14 is first: \\(u_{13}=630\\) and \\(u_{14}=670\\)."
    },
    {
      "id": "q11",
      "type": "number",
      "group": "Learning check",
      "prompt": "Readings at equal intervals are 5.0, 7.1, 9.0, 11.2 and 13.0. Estimate a common difference using the mean of the four consecutive changes.",
      "answer": 2,
      "unit": "per reading",
      "hint": "Average the changes, or divide the total change by the number of gaps.",
      "solution": "\\(\\widehat d=\\frac{13.0-5.0}{4}=2.0\\) per reading. The individual differences vary, so this is an approximate model."
    },
    {
      "id": "q12",
      "type": "number",
      "group": "Learning check",
      "prompt": "Weekly donations are 30 QAR in week 1 and increase by 10 QAR each week. Find the least number of weeks for the cumulative donations to exceed 500 QAR.",
      "answer": 8,
      "unit": "whole-number weeks",
      "hint": "Use the sum, not the donation in one week. Check adjacent totals.",
      "solution": "\\(S_n=\\frac n2[60+10(n-1)]\\). \\(S_7=420\\) and \\(S_8=520\\), so the least number is 8."
    }
  ],
  "frqs": [
    {
      "id": "s01",
      "title": "Reading an arithmetic rule",
      "context": "<p>The first three terms of an arithmetic sequence are \\(17,23,29\\).</p>",
      "parts": [
        {
          "prompt": "Write down \\(u_1\\) and \\(d\\).",
          "marks": 2,
          "rubric": "<p>\\(u_1=17,\\ d=6\\).</p><ul><li>A1: first term 17.</li><li>A1: common difference 6.</li></ul>",
          "label": "(a)"
        },
        {
          "prompt": "Calculate \\(u_{15}\\).",
          "marks": 2,
          "rubric": "<p>\\(u_{15}=17+14(6)=101\\).</p><ul><li>M1: uses 14 increments of 6 from 17.</li><li>A1: obtains 101.</li></ul>",
          "label": "(b)"
        },
        {
          "prompt": "State the possible values of the term index \\(n\\).",
          "marks": 1,
          "rubric": "<p>The index is a positive integer: \\(n=1,2,3,\\ldots\\).</p><ul><li>A1: positive integers beginning at 1.</li></ul>",
          "label": "(c)"
        }
      ],
      "totalMarks": 5,
      "calculator": true,
      "calculatorLabel": "GDC available · show your working",
      "style": "short"
    },
    {
      "id": "s02",
      "title": "Recovering missing parameters",
      "context": "<p>An arithmetic sequence has \\(u_5=31\\) and \\(u_{12}=73\\).</p>",
      "parts": [
        {
          "prompt": "Find the common difference.",
          "marks": 2,
          "rubric": "<p>\\(d=\\frac{73-31}{12-5}=6\\).</p><ul><li>M1: divides the change in values by seven index gaps.</li><li>A1: obtains 6.</li></ul>",
          "label": "(a)"
        },
        {
          "prompt": "Find the first term.",
          "marks": 2,
          "rubric": "<p>\\(u_1=31-4(6)=7\\).</p><ul><li>M1: subtracts four increments from term 5.</li><li>A1: obtains 7.</li></ul>",
          "label": "(b)"
        },
        {
          "prompt": "Write an expression for \\(u_n\\).",
          "marks": 2,
          "rubric": "<p>\\(u_n=7+6(n-1)=6n+1\\).</p><ul><li>M1: uses the arithmetic nth-term structure.</li><li>A1: correct equivalent expression.</li></ul>",
          "label": "(c)"
        }
      ],
      "totalMarks": 6,
      "calculator": true,
      "calculatorLabel": "GDC available · show your working",
      "style": "short"
    },
    {
      "id": "s03",
      "title": "A decreasing sequence",
      "context": "<p>An arithmetic sequence begins \\(52,48.5,45,\\ldots\\).</p>",
      "parts": [
        {
          "prompt": "Calculate \\(u_{10}\\).",
          "marks": 2,
          "rubric": "<p>\\(d=-3.5,\\quad u_{10}=52+9(-3.5)=20.5\\).</p><ul><li>M1: uses −3.5 over nine changes.</li><li>A1: obtains 20.5.</li></ul>",
          "label": "(a)"
        },
        {
          "prompt": "Determine the first index whose term is not positive. Verify your answer.",
          "marks": 3,
          "rubric": "<p>\\(u_n=55.5-3.5n\\le0\\) gives \\(n\\ge15.857\\ldots\\). Thus \\(n=16\\), with \\(u_{15}=3>0\\) and \\(u_{16}=-0.5\\le0\\).</p><ul><li>M1: forms a suitable inequality or uses a sequence table.</li><li>A1: obtains index 16.</li><li>R1: checks terms 15 and 16 to establish that it is first.</li></ul>",
          "label": "(b)"
        }
      ],
      "totalMarks": 5,
      "calculator": true,
      "calculatorLabel": "GDC available · show your working",
      "style": "short"
    },
    {
      "id": "s04",
      "title": "Seats in a school theatre",
      "context": "<p>A theatre section has 22 seats in row 1, and each later row has 3 more seats. There are 18 rows.</p>",
      "parts": [
        {
          "prompt": "Find the number of seats in row 18.",
          "marks": 2,
          "rubric": "<p>\\(u_{18}=22+17(3)=73\\) seats.</p><ul><li>M1: uses 17 row-to-row increases.</li><li>A1: obtains 73 seats.</li></ul>",
          "label": "(a)"
        },
        {
          "prompt": "Calculate the total number of seats.",
          "marks": 3,
          "rubric": "<p>\\(S_{18}=\\frac{18}{2}(22+73)=855\\) seats.</p><ul><li>M1: selects an arithmetic-series sum formula.</li><li>M1: substitutes consistent values for n, first and last term.</li><li>A1: obtains 855 seats.</li></ul>",
          "label": "(b)"
        },
        {
          "prompt": "Explain why \\(u_{18}\\) is not the total for the section.",
          "marks": 1,
          "rubric": "<p>It counts only the final row; the section total adds the seats in all 18 rows.</p><ul><li>R1: distinguishes a single row count from the accumulated total.</li></ul>",
          "label": "(c)"
        }
      ],
      "totalMarks": 6,
      "calculator": true,
      "calculatorLabel": "GDC available · show your working",
      "style": "short"
    },
    {
      "id": "s05",
      "title": "A sum with shifted limits",
      "context": "<p>Consider \\(T=\\displaystyle\\sum_{k=4}^{12}(5k-7)\\).</p>",
      "parts": [
        {
          "prompt": "Write down the first summand and the number of summands.",
          "marks": 2,
          "rubric": "<p>The first summand is \\(5(4)-7=13\\); there are \\(12-4+1=9\\) summands.</p><ul><li>A1: first summand 13.</li><li>A1: nine summands.</li></ul>",
          "label": "(a)"
        },
        {
          "prompt": "Calculate T.",
          "marks": 2,
          "rubric": "<p>The final summand is \\(5(12)-7=53\\), so \\(T=\\frac92(13+53)=297\\).</p><ul><li>M1: uses nine terms from 13 to 53 in a correct sum method.</li><li>A1: obtains 297.</li></ul>",
          "label": "(b)"
        },
        {
          "prompt": "Express the same total as a sigma sum starting at \\(j=1\\).",
          "marks": 2,
          "rubric": "<p>\\(T=\\sum_{j=1}^{9}[13+5(j-1)]\\); the equivalent summand \\(5j+8\\) is also valid.</p><ul><li>A1: correct summand with first value 13 and difference 5.</li><li>A1: limits 1 and 9.</li></ul>",
          "label": "(c)"
        }
      ],
      "totalMarks": 6,
      "calculator": true,
      "calculatorLabel": "GDC available · show your working",
      "style": "short"
    },
    {
      "id": "s06",
      "title": "Simple interest and time zero",
      "context": "<p>A hypothetical account has an initial balance of 4800 QAR and pays simple interest at 3.25% per year. There are no fees, deposits or withdrawals.</p>",
      "parts": [
        {
          "prompt": "Calculate the interest earned each year.",
          "marks": 2,
          "rubric": "<p>\\(I=4800(0.0325)=156\\) QAR.</p><ul><li>M1: applies the rate to the original principal.</li><li>A1: obtains 156 QAR.</li></ul>",
          "label": "(a)"
        },
        {
          "prompt": "Find the balance after 5 years.",
          "marks": 2,
          "rubric": "<p>\\(B_5=4800+5(156)=5580\\) QAR.</p><ul><li>M1: adds five equal interest payments to the principal.</li><li>A1: obtains 5580 QAR.</li></ul>",
          "label": "(b)"
        },
        {
          "prompt": "If \\(u_1\\) is the balance at the end of year 1, write down \\(u_1\\) and d.",
          "marks": 2,
          "rubric": "<p>\\(u_1=4956,\\quad d=156\\). The initial balance at time zero is not \\(u_1\\) with this indexing.</p><ul><li>A1: first end-of-year balance 4956 QAR.</li><li>A1: difference 156 QAR per year.</li></ul>",
          "label": "(c)"
        }
      ],
      "totalMarks": 6,
      "calculator": true,
      "calculatorLabel": "GDC available · show your working",
      "style": "short"
    },
    {
      "id": "s07",
      "title": "A tank with a fixed outflow",
      "context": "<p>A tank contains 300 litres at time 0. Readings at 1, 2 and 3 minutes are 282, 264 and 246 litres. Assume the fixed outflow continues while water remains. Let \\(u_1\\) denote the reading at time 0.</p>",
      "parts": [
        {
          "prompt": "State the common difference between readings.",
          "marks": 1,
          "rubric": "<p>\\(d=-18\\) litres per reading.</p><ul><li>A1: −18 litres for each one-minute step.</li></ul>",
          "label": "(a)"
        },
        {
          "prompt": "Estimate the water remaining at 7 minutes.",
          "marks": 2,
          "rubric": "<p>Time 7 minutes corresponds to \\(u_8\\). \\(u_8=300+7(-18)=174\\) litres.</p><ul><li>M1: uses seven changes from time zero.</li><li>A1: obtains 174 litres.</li></ul>",
          "label": "(b)"
        },
        {
          "prompt": "Explain why extending this arithmetic model to every future minute is inappropriate.",
          "marks": 2,
          "rubric": "<p>The formula eventually gives negative volumes. The outflow cannot continue unchanged after the tank is empty.</p><ul><li>R1: identifies the negative-volume consequence.</li><li>R1: relates the failure to the empty tank.</li></ul>",
          "label": "(c)"
        }
      ],
      "totalMarks": 5,
      "calculator": true,
      "calculatorLabel": "GDC available · show your working",
      "style": "short"
    },
    {
      "id": "s08",
      "title": "Data that are nearly arithmetic",
      "context": "<p>A sensor records voltages at times 0, 2, 4, 6 and 8 seconds: 7.2, 8.8, 10.5, 12.0 and 13.6 volts.</p>",
      "parts": [
        {
          "prompt": "Explain why the readings are not exactly arithmetic.",
          "marks": 2,
          "rubric": "<p>The successive changes are \\(1.6,1.7,1.5,1.6\\) volts. They are not identical.</p><ul><li>A1: correctly identifies the changes.</li><li>R1: uses unequal differences to reject an exact arithmetic pattern.</li></ul>",
          "label": "(a)"
        },
        {
          "prompt": "Estimate d per reading using the total change divided by the number of intervals.",
          "marks": 2,
          "rubric": "<p>\\(\\widehat d=\\frac{13.6-7.2}{4}=1.6\\) volts per two-second reading interval.</p><ul><li>M1: divides the endpoint change by four gaps.</li><li>A1: 1.6 volts per reading, or 0.8 volts per second with the distinction stated.</li></ul>",
          "label": "(b)"
        },
        {
          "prompt": "Use this model to predict the reading at 10 seconds.",
          "marks": 2,
          "rubric": "<p>There are five two-second changes from time zero: \\(7.2+5(1.6)=15.2\\) volts.</p><ul><li>M1: uses five reading intervals, or ten seconds at 0.8 V/s.</li><li>A1: prediction 15.2 volts.</li></ul>",
          "label": "(c)"
        },
        {
          "prompt": "State one reason the prediction may differ from the actual reading.",
          "marks": 1,
          "rubric": "<p>For example, measurement noise or a changing signal can alter the increment; the prediction extrapolates the approximate pattern.</p><ul><li>R1: relevant limitation linked to an approximate model.</li></ul>",
          "label": "(d)"
        }
      ],
      "totalMarks": 7,
      "calculator": true,
      "calculatorLabel": "GDC available · show your working",
      "style": "short"
    },
    {
      "id": "e01",
      "title": "A school club builds a fund",
      "context": "<p>A school club saves 80 QAR in week 1 and increases its weekly saving by 15 QAR each week for 12 weeks. The fund starts at zero and earns no interest.</p>",
      "parts": [
        {
          "prompt": "Write a formula for the amount saved in week n.",
          "marks": 2,
          "rubric": "<p>\\(u_n=80+15(n-1)=15n+65\\).</p><ul><li>M1: arithmetic nth-term structure.</li><li>A1: correct equivalent expression.</li></ul>",
          "label": "(a)"
        },
        {
          "prompt": "Find the amount saved in week 12.",
          "marks": 2,
          "rubric": "<p>\\(u_{12}=80+11(15)=245\\) QAR.</p><ul><li>M1: substitutes the correct index.</li><li>A1: obtains 245 QAR.</li></ul>",
          "label": "(b)"
        },
        {
          "prompt": "Calculate the total saved over 12 weeks.",
          "marks": 3,
          "rubric": "<p>\\(S_{12}=\\frac{12}{2}(80+245)=1950\\) QAR.</p><ul><li>M1: appropriate arithmetic-sum formula.</li><li>M1: consistent substitution.</li><li>A1: obtains 1950 QAR.</li></ul>",
          "label": "(c)"
        },
        {
          "prompt": "Determine the first week at which the cumulative fund is at least 1400 QAR. Verify that it is first.",
          "marks": 3,
          "rubric": "<p>\\(S_9=1260<1400\\) and \\(S_{10}=1475\\ge1400\\). Therefore week 10 is first.</p><ul><li>M1: works with cumulative sums, using a formula or GDC table.</li><li>A1: identifies week 10.</li><li>R1: verifies both adjacent totals.</li></ul>",
          "label": "(d)"
        },
        {
          "prompt": "The club then saves a constant 245 QAR for each of the next four weeks. Find the total fund at the end of week 16.",
          "marks": 2,
          "rubric": "<p>\\(1950+4(245)=2930\\) QAR.</p><ul><li>M1: adds four fixed payments to the existing fund.</li><li>A1: obtains 2930 QAR.</li></ul>",
          "label": "(e)"
        },
        {
          "prompt": "State an assumption needed for the original 12-week model.",
          "marks": 1,
          "rubric": "<p>The club can make every planned payment and maintain the fixed weekly increase.</p><ul><li>R1: relevant assumption about regular payments or affordability.</li></ul>",
          "label": "(f)"
        }
      ],
      "totalMarks": 13,
      "calculator": true,
      "calculatorLabel": "GDC available · show your working",
      "style": "extended"
    },
    {
      "id": "e02",
      "title": "An approximate production model",
      "context": "<p>A school workshop records the area of shade panels completed in five consecutive months: 36.0, 40.9, 46.2, 51.1 and 56.0 square metres. Model monthly output as approximately arithmetic.</p>",
      "parts": [
        {
          "prompt": "Calculate the four first differences and comment on the model.",
          "marks": 2,
          "rubric": "<p>The differences are \\(4.9,5.3,4.9,4.9\\). They are close to 5 but not identical, supporting an approximate arithmetic model.</p><ul><li>A1: correct differences.</li><li>R1: identifies approximate rather than exact arithmetic behaviour.</li></ul>",
          "label": "(a)"
        },
        {
          "prompt": "Estimate d using the mean of the four differences and write an expression for the output in month n.",
          "marks": 2,
          "rubric": "<p>\\(\\widehat d=\\frac{56.0-36.0}{4}=5.0\\) and \\(u_n=36+5(n-1)\\).</p><ul><li>A1: estimated difference 5.0 square metres per monthly step.</li><li>A1: correct nth-term model.</li></ul>",
          "label": "(b)"
        },
        {
          "prompt": "Predict the output in month 9 and identify whether this is interpolation or extrapolation.",
          "marks": 2,
          "rubric": "<p>\\(u_9=36+8(5)=76\\) square metres; month 9 lies beyond the observed months, so this is extrapolation.</p><ul><li>A1: 76 square metres.</li><li>R1: extrapolation with reference to the observed range.</li></ul>",
          "label": "(c)"
        },
        {
          "prompt": "Estimate the total output over the first 9 months.",
          "marks": 3,
          "rubric": "<p>\\(S_9=\\frac92(36+76)=504\\) square metres. This uses the model for all nine months.</p><ul><li>M1: selects a sum method for modelled monthly outputs.</li><li>M1: consistent use of nine terms and endpoints.</li><li>A1: estimate 504 square metres.</li></ul>",
          "label": "(d)"
        },
        {
          "prompt": "The observed output in month 9 is 69.8 square metres. Compare it with the prediction and suggest one practical reason for the difference.",
          "marks": 2,
          "rubric": "<p>The model overestimates output by \\(76-69.8=6.2\\) square metres. Limited staff, material supply or space could reduce the planned increment.</p><ul><li>A1: overestimate of 6.2 square metres.</li><li>R1: plausible contextual reason affecting the increment.</li></ul>",
          "label": "(e)"
        }
      ],
      "totalMarks": 11,
      "calculator": true,
      "calculatorLabel": "GDC available · show your working",
      "style": "extended"
    },
    {
      "id": "e03",
      "title": "Comparing fixed annual increases",
      "context": "<p>Plan A begins with 12 500 QAR and pays simple interest at 3.6% per year. Plan B begins with 13 000 QAR and receives a fixed grant of 350 QAR at the end of each year, with no interest. Both are hypothetical models with no other cash flows.</p>",
      "parts": [
        {
          "prompt": "Calculate the annual interest under Plan A.",
          "marks": 2,
          "rubric": "<p>\\(12500(0.036)=450\\) QAR.</p><ul><li>M1: applies the rate to the original principal.</li><li>A1: 450 QAR per year.</li></ul>",
          "label": "(a)"
        },
        {
          "prompt": "Find the balance of Plan A after 6 years.",
          "marks": 2,
          "rubric": "<p>\\(12500+6(450)=15200\\) QAR.</p><ul><li>M1: uses six equal increases from time zero.</li><li>A1: obtains 15 200 QAR.</li></ul>",
          "label": "(b)"
        },
        {
          "prompt": "Find the first end-of-year balance of Plan A that is at least 16 000 QAR. State the year and check the previous year.",
          "marks": 3,
          "rubric": "<p>\\(12500+450t\\ge16000\\) gives \\(t\\ge7.777\\ldots\\). Year 8 is first: \\(B_7=15650\\) and \\(B_8=16100\\) QAR.</p><ul><li>M1: suitable inequality or sequence table.</li><li>A1: year 8 and balance 16 100 QAR.</li><li>R1: preceding-year check.</li></ul>",
          "label": "(c)"
        },
        {
          "prompt": "Determine when the two plans have the same balance.",
          "marks": 3,
          "rubric": "<p>\\(12500+450t=13000+350t\\) gives \\(100t=500\\), so \\(t=5\\). Both balances are 14 750 QAR.</p><ul><li>M1: equates the two arithmetic balance expressions.</li><li>M1: solves the resulting linear equation.</li><li>A1: year 5, with a consistent balance check.</li></ul>",
          "label": "(d)"
        },
        {
          "prompt": "Explain why adding Plan A’s balances after years 1 to 6 does not give its balance after 6 years.",
          "marks": 1,
          "rubric": "<p>Each balance contains the same original principal and earlier interest. Summing the snapshots counts the same money repeatedly.</p><ul><li>R1: identifies repeated counting of the same funds.</li></ul>",
          "label": "(e)"
        }
      ],
      "totalMarks": 11,
      "calculator": true,
      "calculatorLabel": "GDC available · show your working",
      "style": "extended"
    },
    {
      "id": "c01",
      "title": "Recover a sequence from a term and a sum",
      "context": "<p>An arithmetic sequence satisfies \\(u_3=19\\) and \\(S_8=212\\).</p>",
      "parts": [
        {
          "prompt": "Form two equations in \\(u_1\\) and d.",
          "marks": 2,
          "rubric": "<p>\\(u_1+2d=19\\) and \\(\\frac82(2u_1+7d)=212\\), equivalently \\(2u_1+7d=53\\).</p><ul><li>A1: correct term equation.</li><li>A1: correct sum equation.</li></ul>",
          "label": "(a)"
        },
        {
          "prompt": "Find \\(u_1\\) and d.",
          "marks": 3,
          "rubric": "<p>Twice the first equation is \\(2u_1+4d=38\\). Subtracting from the sum equation gives \\(3d=15\\), so \\(d=5\\) and \\(u_1=9\\).</p><ul><li>M1: elimination, substitution or a clearly recorded technology method.</li><li>A1: d = 5.</li><li>A1: first term 9.</li></ul>",
          "label": "(b)"
        },
        {
          "prompt": "Verify both given conditions.",
          "marks": 1,
          "rubric": "<p>\\(u_3=9+2(5)=19\\) and \\(S_8=4(18+35)=212\\).</p><ul><li>R1: verifies the term and sum by substitution.</li></ul>",
          "label": "(c)"
        }
      ],
      "totalMarks": 6,
      "calculator": true,
      "calculatorLabel": "GDC available · show your working",
      "style": "challenge"
    },
    {
      "id": "c02",
      "title": "Adding only part of a programme",
      "context": "<p>A training programme has a target of 40 minutes in session 1. Each later session has a target 8 minutes longer. Consider only sessions 6 through 15, inclusive.</p>",
      "parts": [
        {
          "prompt": "Find the targets for sessions 6 and 15.",
          "marks": 2,
          "rubric": "<p>\\(u_6=40+5(8)=80\\) and \\(u_{15}=40+14(8)=152\\) minutes.</p><ul><li>A1: 80 minutes.</li><li>A1: 152 minutes.</li></ul>",
          "label": "(a)"
        },
        {
          "prompt": "Find the total training time for sessions 6 through 15.",
          "marks": 3,
          "rubric": "<p>There are \\(15-6+1=10\\) sessions, so the total is \\(\\frac{10}{2}(80+152)=1160\\) minutes.</p><ul><li>M1: counts ten sessions.</li><li>M1: uses first and last included terms in a correct sum method.</li><li>A1: obtains 1160 minutes.</li></ul>",
          "label": "(b)"
        },
        {
          "prompt": "Explain why \\(S_{15}-S_5\\) gives the required total, while \\(S_{15}-S_6\\) does not.",
          "marks": 1,
          "rubric": "<p>Removing the first five sessions leaves sessions 6–15. Removing the first six would also discard session 6.</p><ul><li>R1: explains the inclusive lower endpoint.</li></ul>",
          "label": "(c)"
        }
      ],
      "totalMarks": 6,
      "calculator": true,
      "calculatorLabel": "GDC available · show your working",
      "style": "challenge"
    },
    {
      "id": "c03",
      "title": "When a decreasing model must stop",
      "context": "<p>A workshop models daily production as \\(71,65,59,\\ldots\\) items, decreasing by 6 items per day. Use the model only while daily production is positive.</p>",
      "parts": [
        {
          "prompt": "Find the final day with positive production. Verify the stopping point.",
          "marks": 3,
          "rubric": "<p>\\(u_n=77-6n>0\\) gives \\(n<12.833\\ldots\\). Day 12 is last: \\(u_{12}=5>0\\) and \\(u_{13}=-1\\).</p><ul><li>M1: suitable inequality or sequence table.</li><li>A1: day 12.</li><li>R1: verifies days 12 and 13.</li></ul>",
          "label": "(a)"
        },
        {
          "prompt": "Calculate the total production during the valid days.",
          "marks": 3,
          "rubric": "<p>\\(S_{12}=\\frac{12}{2}(71+5)=456\\) items.</p><ul><li>M1: sums the first twelve terms.</li><li>M1: consistent substitution or recorded GDC sum.</li><li>A1: 456 items.</li></ul>",
          "label": "(b)"
        },
        {
          "prompt": "Explain why the formula is not a valid production model after this point.",
          "marks": 1,
          "rubric": "<p>It predicts a negative count of produced items, which is not meaningful for this context.</p><ul><li>R1: connects the negative prediction to the contextual restriction.</li></ul>",
          "label": "(c)"
        }
      ],
      "totalMarks": 7,
      "calculator": true,
      "calculatorLabel": "GDC available · show your working",
      "style": "challenge"
    }
  ],
  "alignment": {
    "officialSection": "SL 1.2",
    "syllabus": "Mathematics: applications and interpretation, first assessment 2021; current pre-2029 course",
    "coverage": [
      "arithmetic sequences and finite series",
      "nth term and sum formulas",
      "sigma notation",
      "technology with explicit identification of first term and common difference",
      "simple interest",
      "approximate differences, prediction and model limitations"
    ],
    "excluded": [
      "geometric-series methods",
      "infinite series",
      "mathematical induction",
      "compound interest and annuities"
    ],
    "guide": "https://www.woodstockschool.in/wp-content/uploads/2019/10/Mathematics-applications-and-interpretation-guide.pdf",
    "specimens": "https://ibo.org/globalassets/new-structure/university-admission/pdfs/dp-mathematics-applications-and-interpretation-specimen-papers-en.pdf"
  }
};if(typeof module==="object"&&module.exports)module.exports=data;else root.ArithmeticLessonQuestions=data;})(typeof window==="undefined"?globalThis:window);
