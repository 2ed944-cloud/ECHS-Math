#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
UNIT = ROOT / "lessons/ib-math-ai/unit-1"
DATA = UNIT / "data"
CSS = UNIT / "assets/css"
LESSONS = UNIT / "lessons"

FILES = {
    "1.2": "IB_AI_SL_1.2_arithmetic_sequences_ECHS.html",
    "1.3": "IB_AI_SL_1.3_geometric_sequences_ECHS.html",
    "1.4": "IB_AI_SL_1.4_financial_models_ECHS.html",
    "1.5": "IB_AI_SL_1.5_logarithms_ECHS.html",
    "1.6": "IB_AI_SL_1.6_technology_equations_ECHS.html",
}


def wf(title, problem, model, enter, read, interpret, verify, tag="GDC skill"):
    return dict(title=title, problem=problem, model=model, enter=enter, read=read,
                interpret=interpret, verify=verify, tag=tag)


def q(prompt, choices, correct, solution, label="GDC skill", level="Application"):
    return dict(prompt=prompt, choices=choices, correct=correct, solution=solution,
                label=label, level=level)


def task(title, context, parts, marks):
    return dict(title=title, context=context, parts=parts, marks=marks)


PACKS = {
"1.2": {
"name": "Arithmetic Sequences and Series",
"intensity": "Light calculator integration",
"workflows": [
wf("Generate and inspect a sequence",
   r"The sequence has \(u_1=7\) and \(d=4\). Generate its first terms.",
   r"Write \(u_n=7+4(n-1)\). Identify the initial term and common difference before touching the GDC.",
   "Use SEQ mode, or enter Y1=7+4(X-1) and open TABLE with integer X values beginning at 1.",
   r"The table begins \(7,11,15,19,\ldots\).",
   "The GDC confirms the constant increase of 4; it does not establish the model for you.",
   r"Substitute \(n=4\): \(7+4(3)=19\), matching the table."),
wf("Table verification",
   r"Use a table for \(u_n=5+3(n-1)\).",
   r"The input is the term number \(n\), so use integer rows \(n=1,2,3,\ldots\).",
   "Enter Y1=5+3(X-1). Set TblStart=1 and DeltaTbl=1.",
   r"Read individual terms, test a proposed value, and locate the first row near a threshold.",
   r"A value belongs only when an integer \(n\) produces it; a nearby decimal graph location is not a term number.",
   r"For example, \(u_{12}=5+3(11)=38\)."),
wf("Finite sigma and an indexing trap",
   r"Evaluate \(\sum_{k=1}^{40}(5+3(k-1))\).",
   r"This is the sum of 40 terms with \(u_1=5\) and \(d=3\).",
   "MATH > 0:sum(, then enter sum(seq(5+3(K-1),K,1,40)).",
   r"The correct result is \(2540\). Entering \(K=0\) to \(40\) returns \(2542\): it includes an unintended term and has 41 terms.",
   "Bounds and index definition are mathematical information, not formatting details.",
   r"Formula check: \(S_{40}=\frac{40}{2}[2(5)+39(3)]=2540\)."),
wf("Thresholds and calculator decisions",
   "A theatre has 18 seats in the first row and each successive row has 3 more. Find the first row with more than 70 seats.",
   r"Model \(u_n=18+3(n-1)\), then solve the integer condition \(u_n>70\).",
   "Enter Y1=18+3(X-1), inspect the table near the threshold, and keep X integer.",
   r"The first qualifying row is \(n=19\).",
   "A threshold answer names a whole row, not a decimal crossing. Simple terms may need no GDC; long sums and threshold checks often make it useful.",
   r"Adjacent-stage check: \(u_{18}=69\le70\) and \(u_{19}=72>70\).", "GDC useful")
],
"practice": [
q("Which entry correctly generates the sequence with u1=7 and d=4 from n=1?", ["7+4X", "7+4(X-1)", "4+7(X-1)", "7(X-1)+4"], 1, "The explicit term is 7+4(n-1)."),
q("For u_n=5+3(n-1), which TABLE setting supports sequence terms most directly?", ["TblStart=0, ΔTbl=0.1", "TblStart=1, ΔTbl=1", "TblStart=-10, ΔTbl=5", "Ask mode with decimal inputs only"], 1, "Term number n is discrete and begins at 1."),
q("A student enters sum(seq(5+3(K-1),K,0,40)). What is the main error?", ["The common difference is wrong", "The expression is geometric", "The bounds include an unintended K=0 term", "The calculator cannot evaluate sigma"], 2, "The intended 40 terms use K=1,...,40."),
q("The calculator gives 2540 for the 40-term sum. Which verification is strongest?", ["Repeat ENTER", "Use S40=40/2[2(5)+39(3)]", "Round to 2500", "Graph a continuous line"], 1, "An independent arithmetic-series formula verifies the output."),
q("For the theatre threshold, the table shows u18=69 and u19=72. What should be reported?", ["18.33", "18", "19", "72 rows"], 2, "The first whole row exceeding 70 seats is row 19."),
q("Should a GDC be used to prove that a sequence is arithmetic?", ["Yes; a table alone is proof", "No; show the difference of consecutive terms is constant", "Yes; use zoom-fit", "Only if the first term is positive"], 1, "Proof requires mathematical reasoning; a finite table cannot prove the general result.", "No GDC needed", "Reasoning")
],
"tasks": [
task("Auditorium capacity threshold", "Rows contain 18, 21, 24, ... seats. The school needs total capacity above 4200 seats.", [
"Construct formulas for u_n and S_n.",
"Use a GDC table or numerical search to find the first possible number of rows.",
"Verify the answer with adjacent totals and interpret it in context."
], 8)
]
},
"1.3": {
"name": "Geometric Sequences and Series",
"intensity": "Light-to-moderate calculator integration",
"workflows": [
wf("Discrete geometric table",
   r"Generate values of \(u_n=120(0.86)^{n-1}\).",
   r"The initial value is 120 and the common ratio is 0.86, a 14% decrease per stage.",
   "Enter Y1=120(0.86)^(X-1); set TblStart=1 and DeltaTbl=1.",
   "The table lists successive discrete stages.",
   "Only integer n-values are terms. A curve between stages is a visual aid, not an additional sequence term.",
   r"Check any row directly, for example \(u_2=120(0.86)=103.2\)."),
wf("Large powers and guard digits",
   r"Calculate \(8500(1.037)^{18}\).",
   r"This represents 18 repeated increases of 3.7% from an initial value of 8500.",
   "Enter 8500*(1.037)^18 with parentheses around the growth factor.",
   r"The display is approximately \(16346.9427\).",
   "Retain the full displayed value during later work; round only the final requested answer.",
   r"Substitute the rounded result only after the full-precision computation; a rough estimate should exceed 8500."),
wf("Geometric finite sum and index",
   r"Evaluate \(\sum_{k=0}^{24}600(1.025)^k\).",
   r"There are 25 payments/terms because the index begins at 0 and ends at 24.",
   "Enter sum(seq(600(1.025)^K,K,0,24)).",
   r"The result is approximately \(20494.6584\). Starting at \(K=1\) omits the initial 600.",
   "Indexing tells you which cash flow or stage occurs first.",
   r"Formula check: \(600\frac{1-1.025^{25}}{1-1.025}\)."),
wf("Threshold by logarithms or table",
   r"For \(P_n=15000(0.82)^n\), find the first integer \(n\) for which \(P_n<1000\).",
   r"Solve \(15000(0.82)^n<1000\), remembering that \(0.82<1\).",
   "Use logs to estimate n, or enter Y1=15000(0.82)^X and inspect integer table rows.",
   r"The crossing estimate lies between 13 and 14; the first integer stage is \(14\).",
   "A non-integer solver result locates the continuous crossing, not the discrete stage answer.",
   r"\(P_{13}\approx1136.77\ge1000\) and \(P_{14}\approx932.15<1000\)."),
wf("Calculator trap: 13.42 is not automatically the answer",
   "A numerical solver reports n=13.42 for a repeated-stage decay model. Is 13.42 the contextual answer?",
   "Determine whether n counts time continuously or labels completed stages.",
   "Use the decimal result only to identify neighboring integer stages 13 and 14.",
   "The calculator has found a continuous crossing.",
   "If the context counts complete stages and asks when the value is first below a threshold, test stage 14.",
   "Evaluate both adjacent stages and state the inequality that proves minimality.", "GDC useful")
],
"practice": [
q("Which table entry represents u_n=120(0.86)^(n-1)?", ["120(0.86)^X", "120(0.86)^(X-1)", "0.86(120)^(X-1)", "120-0.86(X-1)"], 1, "Replace n by X while preserving n-1."),
q("What does the ratio 0.86 mean?", ["86% growth", "14% growth", "14% decay per stage", "A decrease of 0.86 units"], 2, "1-0.86=0.14, so the value decreases 14% per stage."),
q("Why keep guard digits in 8500(1.037)^18?", ["To make the display longer", "To avoid accumulated rounding error in later calculations", "Because money is never rounded", "To change the common ratio"], 1, "Intermediate rounding can alter the final answer."),
q("How many terms are in sum from k=0 to 24?", ["24", "25", "26", "23"], 1, "Inclusive integer count is 24-0+1=25."),
q("A student sums k=1 to 24 instead. What was omitted?", ["The last term", "The initial term 600", "The common ratio", "Two terms"], 1, "At k=0 the term is 600."),
q("A solver returns n=13.42 for a discrete threshold. What should happen next?", ["Report 13.42 stages", "Round to 13 without checking", "Test n=13 and n=14", "Discard the model"], 2, "Adjacent integer verification is essential."),
q("Which statement best identifies a discrete model?", ["Medicine concentration measured at every instant", "Account balance recorded after each yearly deposit", "A smooth temperature curve", "Distance along a road"], 1, "Deposits create stage-indexed values.", "GDC useful", "Reasoning")
],
"tasks": [
task("Medicine decay and cumulative exposure", "Immediately after each fixed interval, 120 mg remains at stage 1 and 86% remains from one stage to the next.", [
"Interpret the initial value and common ratio, including units.",
"Find the first stage below 20 mg and verify adjacent stages.",
"Find the total amount represented by the first 12 recorded stages and explain the indexing used."
], 9)
]
},
"1.4": {
"name": "Financial Applications",
"intensity": "Deep calculator integration / financial technology",
"workflows": [
wf("Direct compound interest or TVM?",
   r"An investment follows \(A=P(1+r/m)^{mt}\). Choose the efficient method.",
   "Identify P, nominal annual rate r, compounding frequency m, and time t before selecting a tool.",
   "For one future value, direct substitution is often fastest. For an unknown payment, rate, term, or loan balance, use TVM.",
   "Both methods should agree when configured with the same rate convention.",
   "A solver is a representation of the model, not a replacement for defining its variables.",
   "Estimate direction and magnitude, then compare with the alternative method when practical."),
wf("TVM variables and cash-flow timeline",
   "Translate a loan or investment into N, I%, PV, PMT, FV, P/Y and C/Y.",
   "N counts payment periods; I% is the nominal annual percentage; PV and FV are values at opposite timeline ends; PMT is each regular cash flow.",
   "Draw a timeline first. Enter P/Y for payments per year and C/Y for compounding periods per year.",
   "The solver returns the unknown while preserving the sign convention.",
   "Arrows toward you and away from you must have opposite signs.",
   "Substitute into the recurrence or compare the final balance with the required FV."),
wf("Why is PMT negative?",
   "A borrower enters PV=250000 and obtains PMT=-3380.35. Is this an error?",
   "The borrower receives the principal now and pays instalments later: the cash flows have opposite directions.",
   "Set N=96, I%=5.4, PV=250000, FV=0, P/Y=C/Y=12; solve PMT.",
   r"The display gives approximately \(-3380.35\).",
   "The negative sign means a monthly outflow from the borrower's perspective, not a negative payment size.",
   "Use the magnitude in affordability calculations and preserve the sign in the TVM model."),
wf("Rate conventions and P/Y-C/Y trap",
   "A nominal annual rate is quoted with monthly payments. Diagnose a wrong monthly answer.",
   "Distinguish nominal annual rate, periodic rate, effective annual rate, payment frequency, and compounding frequency.",
   "Enter the quoted nominal annual I%; set P/Y and C/Y deliberately. Do not divide I% manually and also set C/Y=12.",
   "A wrong P/Y or C/Y can produce a plausible but incorrect payment.",
   "The calculator must know how annual rates are distributed across periods.",
   r"For monthly compounding, check that the periodic rate corresponds to \(r/12\), and compare the effective rate \((1+r/12)^{12}-1\)."),
wf("Repayment, term and outstanding balance",
   "Use technology to find a monthly repayment, number of repayments, or balance after k payments.",
   "Model the loan with a fixed periodic rate and regular cash flows.",
   "Solve the unknown in TVM; for a balance after k payments, use AMORT or reset N to the elapsed period and inspect the remaining value.",
   "Read payment magnitude, remaining principal, and cumulative interest separately.",
   "Outstanding balance is not the sum of unpaid instalments; each future instalment includes interest.",
   "Check that the balance decreases and that principal plus interest portions equal each payment."),
wf("Amortization, rounding and final payment",
   "A QAR 10000 loan at 6% nominal monthly is repaid over 24 months.",
   "The exact regular payment is determined by the annuity model; currency payments are then rounded operationally.",
   "Use N=24, I%=6, PV=10000, FV=0, P/Y=C/Y=12. Keep the unrounded PMT internally.",
   r"The exact payment is about \(443.2061\); regular payments may be QAR 443.21, making the final payment slightly different (about QAR 443.11).",
   "Rounding every intermediate balance would accumulate error. The final payment clears the remaining balance.",
   "Use AMORT: payment = interest portion + principal portion, and confirm the ending balance is zero."),
wf("Compare financial options and decide",
   "Compare two loans or investments; do not stop after obtaining calculator outputs.",
   "Use identical time horizons and rate conventions, then calculate payment, total paid, total interest or final value as appropriate.",
   "Store full-precision results for both options and include fees at the correct time.",
   "The lower monthly payment may still have the higher total cost.",
   "A recommendation must address affordability, total cost/value, assumptions and the decision criterion.",
   "Recalculate one option by a second representation and perform a sensitivity check on any stated assumption.", "GDC useful")
],
"practice": [
q("Which TVM variable counts the number of payment periods?", ["I%", "N", "PV", "C/Y"], 1, "N is the number of payment periods."),
q("In a borrower's TVM setup, PV is positive and PMT is negative. What does this mean?", ["The solver failed", "Loan and repayments are opposite cash-flow directions", "The interest rate is negative", "Payments are refunds"], 1, "Signs encode direction on the cash-flow timeline."),
q("Monthly payments and monthly compounding are intended. Which setting is normally appropriate?", ["P/Y=1, C/Y=1", "P/Y=12, C/Y=12", "P/Y=12, C/Y=1 always", "Divide I% by 12 and also use C/Y=12"], 1, "Set both frequencies to 12 when both occur monthly."),
q("Why is dividing I% by 12 and also setting C/Y=12 usually wrong?", ["The annual rate is converted twice", "The loan has no interest", "N becomes negative", "PV changes sign"], 0, "The calculator already converts nominal annual I% using C/Y."),
q("A TVM solver returns PMT=-3380.35. What payment should be reported for affordability?", ["QAR -3380.35 as a debt cancellation", "A monthly outflow of QAR 3380.35", "QAR 0", "An annual receipt of QAR 3380.35"], 1, "Interpret the sign and report the payment magnitude with direction."),
q("Outstanding balance after 18 payments is best described as...", ["18 times PMT", "remaining principal at that time", "total interest already paid", "future value before any payments"], 1, "The balance is the remaining principal under the loan model."),
q("Within one amortization payment, which identity is correct?", ["payment=interest-principal", "payment=interest+principal", "payment=balance+rate", "payment=PV+FV"], 1, "Each payment covers interest and reduces principal."),
q("Why can the final loan payment differ from the regular payment?", ["The interest rate changes automatically", "Rounded regular payments leave a small residual balance", "The calculator forgets N", "PV becomes zero too soon"], 1, "Currency rounding can leave a slightly different final amount."),
q("Loan A has a higher monthly payment but a lower total paid than Loan B. Which conclusion is justified?", ["A is always affordable", "B is always cheaper", "A has lower total cost, but affordability must also be considered", "Payment size alone decides"], 2, "A complete decision separates total cost from monthly affordability."),
q("Which is strongest evidence of financial mastery?", ["A screenshot of PMT", "Correct TVM entries only", "Model, entries, interpretation, verification and recommendation", "Repeated use of SOLVE"], 2, "Button-pushing alone is not mastery.", "GDC useful", "Reasoning")
],
"tasks": [
task("Investment method choice", "QAR 18000 is invested for 7 years at a nominal rate compounded quarterly.", [
"Use the compound-interest formula and identify every variable.",
"Confirm the future value with TVM settings and explain why the two methods agree.",
"Find and interpret the effective annual rate."
], 9),
task("Loan, amortization and final payment", "A QAR 10000 loan is repaid monthly over 24 months at 6% nominal annual interest compounded monthly.", [
"Find the exact and regular rounded monthly payment.",
"Use amortization information to describe interest and principal in an early and a late payment.",
"Find total interest and determine the adjusted final payment without premature rounding."
], 12),
task("Compare two offers", "Two lenders quote different rates, terms and setup fees for the same principal.", [
"Build a correct TVM model for each offer, including P/Y and C/Y.",
"Compare monthly payment, total repaid and total interest including fees.",
"Write a supported recommendation addressing affordability, cost and assumptions."
], 14)
]
},
"1.5": {
"name": "Exponent Laws and Logarithms",
"intensity": "Focused calculator integration",
"workflows": [
wf("LOG, LN and change of base",
   r"Evaluate \(\log_a b\) while preserving mathematical notation.",
   r"LOG computes \(\log_{10}\); LN computes \(\log_e\). Use \(\log_a b=\frac{\log b}{\log a}\).",
   "Enter log(b)/log(a), or ln(b)/ln(a), with complete parentheses.",
   "Both entries give the same numerical value.",
   "Write the change-of-base expression in working; the button sequence is not mathematical justification.",
   r"Check by raising the base: if \(x=\log_a b\), then \(a^x\) should reproduce \(b\)."),
wf("Solve an exponential equation",
   r"Solve \(3^x=17\).",
   r"Take logarithms: \(x\log3=\log17\), hence \(x=\frac{\log17}{\log3}\).",
   "Enter log(17)/log(3) and retain guard digits.",
   r"\(x\approx2.579\).",
   "The decimal is an approximation to the exact logarithmic expression.",
   r"Substitute: evaluate \(3^{2.579}\) and compare with 17."),
wf("Graph intersection: find every solution",
   r"Solve \(2^x=5x\) numerically.",
   r"Represent both sides as \(y_1=2^x\) and \(y_2=5x\).",
   "Choose a window that shows near-zero and larger positive x-values; use CALC > intersect for each visible crossing.",
   r"There are two positive solutions, approximately \(0.2355\) and \(4.4880\).",
   "The first intersection returned is not automatically the only solution.",
   "Substitute each value into both sides and scan an expanded window for further crossings."),
wf("Logarithm domain and extraneous candidate",
   r"Solve \(\log(x-2)+\log x=\log3\).",
   r"Domain first: \(x>2\). Combining logs gives \(x(x-2)=3\).",
   "Solve x^2-2x-3=0, then test candidates in the original logarithms.",
   r"Algebra gives \(x=3\) or \(x=-1\); the GDC reports an error for the logarithm at \(-1\).",
   r"The error represents a mathematical domain violation. Only \(x=3\) is admissible.",
   "State the domain and substitute the retained candidate into the original equation."),
wf("Calculator notation, context and verification",
   "A decay equation gives a decimal stage value. Present a mathematically and contextually valid answer.",
   "Write the model and logarithmic rearrangement before the decimal approximation.",
   "Use LOG/LN or graph intersection; keep full precision until the final step.",
   "The calculator display is evidence, not final written notation.",
   "Apply domain, units and integer-stage restrictions. For a first-stage threshold, check neighboring integers.",
   "Substitute into the original equation or compare both sides numerically.", "GDC useful")
],
"practice": [
q("What does the TI-84 LOG key calculate?", ["Natural logarithm", "Base-10 logarithm", "Any base automatically", "An exponent law"], 1, "LOG is log base 10."),
q("Which entry evaluates log_7(20)?", ["log(7)/log(20)", "log(20)/log(7)", "log(140)", "ln(7-20)"], 1, "Change of base puts log of the argument over log of the base."),
q("Which exact setup solves 3^x=17?", ["x=log3/log17", "x=log17/log3", "x=17/3", "x=ln(20)"], 1, "Taking logs gives x log 3=log 17."),
q("A graph of 2^x and 5x shows one intersection in the current window. What should the student do?", ["Assume uniqueness", "Inspect a suitable wider window for another crossing", "Delete one graph", "Round the first root to an integer"], 1, "The equation has two positive solutions; window choice matters."),
q("For log(x-2)+log x=log3, which candidate is rejected?", ["3", "-1", "Both", "Neither"], 1, "The domain x>2 excludes -1."),
q("What does a DOMAIN error from log(-2) communicate?", ["The battery is low", "The real logarithm input must be positive", "The graph window is too small", "Use degrees mode"], 1, "Real logarithms require positive arguments."),
q("Which final response is mathematically strongest after a numerical root?", ["x=2.579 because the screen says so", "x≈2.579, with substitution verifying the original equation", "Ans", "2.579E0 only"], 1, "Use proper notation and verify.", "GDC useful", "Reasoning")
],
"tasks": [
task("Environmental decay threshold", "A pollutant mass is modelled by M_n=5000(0.78)^n grams after n complete treatment cycles.", [
"Use logarithms to estimate when the mass first falls below 1000 g.",
"Use a GDC table to identify the correct integer cycle and verify adjacent stages.",
"Explain why a non-integer crossing is not the final contextual answer and state assumptions."
], 10)
]
},
"1.6": {
"name": "Technology for Equations and Systems",
"intensity": "Deep calculator integration / essential GDC skills",
"workflows": [
wf("Find all polynomial roots",
   r"Solve \(x^3-4x^2-x+4=0\).",
   "Define f(x) and anticipate up to three real roots.",
   "Graph f, use CALC > zero around each crossing, or use a polynomial solver if available.",
   r"The real roots are \(-1,1,4\).",
   "A single root result does not complete a question asking for all roots.",
   r"Factor or substitute: \((x-4)(x-1)(x+1)=0\)."),
wf("Multiple graph intersections",
   r"Solve \(x^2+1=3x\).",
   r"Graph \(y_1=x^2+1\) and \(y_2=3x\).",
   "Choose a window showing both crossings; use INTERSECT separately at each.",
   r"\(x\approx0.382\) and \(x\approx2.618\).",
   "Each intersection is a solution of the original equation.",
   "Substitute each x-value or solve x^2-3x+1=0 independently."),
wf("Two-variable system",
   r"Solve \(2x+3y=17\), \(5x-y=9\).",
   "Keep a fixed variable order x,y and translate coefficients carefully.",
   "Use simultaneous-equation solver, rref of an augmented matrix, or graph both lines.",
   r"\(x=44/17\approx2.588\), \(y=67/17\approx3.941\).",
   "The ordered pair is the common solution to both equations.",
   "Substitute into both original equations and check zero residuals."),
wf("Three-variable system and zero coefficient",
   r"Solve \(x+y+z=12\), \(2x-y+3z=19\), \(3x+2y-z=10\).",
   "Use the same x,y,z order in every row. Enter an explicit zero when a variable is absent, for example 4x+0y-2z=8.",
   "Enter the 3x4 augmented matrix and use rref, or use the simultaneous-equation solver.",
   r"\((x,y,z)=(37/13,46/13,73/13)\).",
   "Omitting a zero shifts coefficients and creates a different system.",
   "Substitute the triple into all three equations."),
wf("Matrices and solution types",
   r"Represent a system as \(AX=B\) and interpret unique, none or infinitely many solutions.",
   "Construct A from ordered coefficients, X from variables and B from constants.",
   "Use rref([A|B]); use A^{-1}B only when A is square and invertible.",
   "A pivot in every variable column gives a unique solution; an inconsistent row gives none; a free variable gives infinitely many.",
   "Calculator evidence must be translated into a statement about the original equations.",
   "Check determinant/rank where appropriate and substitute any unique solution."),
wf("Fit model parameters",
   r"Find \(f(x)=ax^2+bx+c\) through \((0,2),(1,6),(3,20)\).",
   "Construct c=2, a+b+c=6, and 9a+3b+c=20 before using technology.",
   "Solve the coefficient system in the order a,b,c.",
   r"\(a=1,b=3,c=2\), so \(f(x)=x^2+3x+2\).",
   "The parameters describe one model satisfying all three data points.",
   "Substitute x=0,1,3 into the fitted function."),
wf("Numerical equation solving",
   r"Solve \(x^3-2x=220\) numerically.",
   r"Define \(f(x)=x^3-2x-220\) and identify a bracket with a sign change.",
   "Graph f and use ZERO, or use a numerical solver with a sensible initial estimate.",
   r"The positive root is approximately \(6.148\).",
   "A numerical approximation is appropriate because elementary algebra is inefficient here.",
   "Evaluate the residual f(6.148) and refine if the required accuracy is not met."),
wf("Filter contextual solutions and verify",
   "A projectile model returns t=-2.4 and t=7.8 when height is zero. Which solution is relevant?",
   "Apply the domain t≥0, time units and the physical event described.",
   "Use graph/solver to obtain candidates, then record both before filtering.",
   "The contextual landing time is 7.8 s; -2.4 lies outside the modelled time interval.",
   "Technology supplies candidates; context determines admissibility.",
   "Substitute t=7.8 into the height model and confirm a near-zero residual.", "GDC useful")
],
"practice": [
q("After ZERO finds x=-1 for a cubic, what is the next best action?", ["Stop", "Search the full relevant window for other roots", "Round to 0", "Delete the function"], 1, "A cubic can have multiple real roots."),
q("For x^2+1=3x, how many real intersections are relevant?", ["0", "1", "2", "3"], 2, "The line intersects the parabola twice."),
q("In the system 2x+3y=17 and 5x-y=9, which coefficient row is correct?", ["[2,3,17] and [5,-1,9]", "[2,17,3] and [5,9,-1]", "[3,2,17] and [-1,5,9]", "[2,3] only"], 0, "Use ordered coefficients followed by the constant."),
q("Why enter 4x+0y-2z=8 as [4,0,-2,8]?", ["To make the matrix square", "To preserve variable order", "To remove z", "To force a zero solution"], 1, "The zero is a positional coefficient."),
q("Which rref evidence indicates no solution?", ["A row [0,0,0|1]", "An identity matrix", "A free variable only", "All zeros including the constant"], 0, "0=1 is inconsistent."),
q("When is X=A^(-1)B appropriate?", ["For every system", "When A is square and invertible", "Only for one equation", "When det(A)=0"], 1, "A^-1 exists only for an invertible square coefficient matrix."),
q("Before fitting a quadratic through three points, what must be done?", ["Guess a,b,c from the graph", "Construct one equation from each point", "Use finance solver", "Round the coordinates"], 1, "Technology solves the model equations; it does not construct them."),
q("A numerical solver returns x≈6.148. Which is the strongest check?", ["Press ENTER again", "Evaluate the residual in the original equation", "Change to degree mode", "Round to 6"], 1, "A near-zero residual verifies the approximation."),
q("A context produces x=-2.4 and x=7.8 but requires x≥0. Which answer is admissible?", ["Both", "-2.4 only", "7.8 only", "Neither"], 2, "The domain excludes the negative candidate."),
q("Which evidence should count toward mastery?", ["Calculator output alone", "Model construction, execution, interpretation and verification", "Fast button entry only", "One screenshot"], 1, "Mastery requires mathematical judgment as well as technology.", "GDC useful", "Reasoning")
],
"tasks": [
task("Event ticket system", "An event sold 420 premium, standard and student tickets. Premium cost QAR45, standard QAR28 and student QAR16. Revenue was QAR12600, and premium sales were 60% of standard sales.", [
"Define variables and construct a three-equation system.",
"Solve using a GDC matrix or simultaneous-equation workflow.",
"Interpret and verify the integer solution in all equations."
], 12),
task("Quadratic calibration", "A sensor response is modelled by f(x)=ax^2+bx+c and passes through three measured points.", [
"Construct the coefficient equations in a fixed a,b,c order.",
"Use technology to solve for the parameters.",
"Verify every data point and discuss whether extrapolation is justified."
], 11),
task("Projectile feasibility", "A height model has two algebraic zeros, one before launch and one after launch.", [
"Use graphing or numerical solving to find all real candidate times.",
"Apply domain and unit restrictions to select the physical answer.",
"Verify by substitution and explain why calculator output alone is insufficient."
], 10)
]
}
}

JS_TEMPLATE = r'''(() => {
  'use strict';
  const PACKS = __PACKS__;
  const data = window.LESSON_DATA;
  if (!data || !data.lesson) return;
  const number = String(data.lesson.number || data.lesson.id || '').match(/1\.[2-6]/)?.[0];
  const pack = PACKS[number];
  if (!pack || data.__gdcV7Applied) return;
  data.__gdcV7Applied = true;

  const esc = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const stage = (label, value) => `<section class="gdc-v7-stage"><h4>${label}</h4><div>${value}</div></section>`;
  const slideHtml = (w, i) => `<article class="gdc-v7-card" data-gdc-workflow="${i}">
    <div class="gdc-v7-eyebrow"><span>${esc(w.tag)}</span><button type="button" class="gdc-v7-open" data-workflow="${i}">Open local TI-84 / GDC coach</button></div>
    <h3>${esc(w.title)}</h3><p class="gdc-v7-problem">${w.problem}</p>
    <div class="gdc-v7-grid">${stage('MODEL',w.model)}${stage('ENTER',w.enter)}${stage('READ',w.read)}${stage('INTERPRET',w.interpret)}${stage('VERIFY',w.verify)}</div>
  </article>`;
  const existingSlideIds = new Set((data.slides || []).map(x => x.id));
  const slides = pack.workflows.map((w,i) => ({
    id:`U1-GDC-V7-${number}-S${String(i+1).padStart(2,'0')}`,
    section:'TI-84 / GDC Lab', title:w.title, objective:'Use technology efficiently, then interpret and verify mathematically.',
    duration:i===0?'8 min':'6 min', type:'gdc-lab', html:slideHtml(w,i), content:slideHtml(w,i), notes:'Calculator output alone is not mastery.'
  })).filter(x => !existingSlideIds.has(x.id));
  data.slides = Array.isArray(data.slides) ? data.slides.concat(slides) : slides;

  const existingQ = new Set((data.practice || []).map(x => x.id));
  const practice = pack.practice.map((p,i) => ({
    id:`U1-GDC-V7-${number}-P${String(i+1).padStart(2,'0')}`,
    level:p.level, difficulty:p.level, command:'Interpret / Verify', calculator:p.label, calculatorLabel:p.label,
    tags:['GDC Skill','Technology Check',number], prompt:p.prompt, question:p.prompt,
    choices:p.choices, options:p.choices, correct:p.correct, answerIndex:p.correct, answer:p.choices[p.correct],
    solution:p.solution, explanation:p.solution, hint:'Return to MODEL → ENTER → READ → INTERPRET → VERIFY.', marks:1
  })).filter(x => !existingQ.has(x.id));
  data.practice = Array.isArray(data.practice) ? data.practice.concat(practice) : practice;

  const existingExam = new Set((data.exam || []).map(x => x.id));
  const exams = pack.tasks.map((t,i) => ({
    id:`U1-GDC-V7-${number}-T${String(i+1).padStart(2,'0')}`,
    title:t.title, style:'Original IB-style extended task', calculator:'GDC useful', context:t.context,
    parts:t.parts.map((text,j)=>({label:String.fromCharCode(97+j),prompt:text,marks:Math.max(2,Math.round(t.marks/t.parts.length))})),
    questions:t.parts, totalMarks:t.marks, marks:t.marks,
    guidance:'Award credit for model construction, technology execution, interpretation and independent verification—not output alone.'
  })).filter(x => !existingExam.has(x.id));
  data.exam = Array.isArray(data.exam) ? data.exam.concat(exams) : exams;

  data.gdcV7 = {version:'7.0.0', lesson:number, name:pack.name, intensity:pack.intensity,
    labels:['No GDC needed','GDC useful','GDC skill'], stages:['MODEL','ENTER','READ','INTERPRET','VERIFY'], workflows:pack.workflows,
    counts:{screens:slides.length,practice:practice.length,tasks:exams.length}, localOnly:true};

  const renderMath = root => {
    if (!window.renderMathInElement || !root) return;
    try { window.renderMathInElement(root,{delimiters:[{left:'$$',right:'$$',display:true},{left:'\\[',right:'\\]',display:true},{left:'\\(',right:'\\)',display:false}],throwOnError:false}); } catch (_) {}
  };
  const dialogHtml = () => `<div class="gdc-v7-shell" role="dialog" aria-modal="true" aria-labelledby="gdc-v7-title">
    <header><div><span class="gdc-v7-kicker">ECHS LOCAL • ${esc(pack.intensity)}</span><h2 id="gdc-v7-title">TI-84 / GDC Lab — ${esc(pack.name)}</h2></div><button class="gdc-v7-close" type="button" aria-label="Close GDC lab">×</button></header>
    <div class="gdc-v7-toolbar"><label>Workflow <select class="gdc-v7-select">${pack.workflows.map((w,i)=>`<option value="${i}">${i+1}. ${esc(w.title)}</option>`).join('')}</select></label>
    <div class="gdc-v7-modes" role="group" aria-label="Learning mode"><button type="button" data-mode="teacher" class="is-active">Teacher</button><button type="button" data-mode="follow">Follow</button><button type="button" data-mode="drill">Drill</button></div></div>
    <main class="gdc-v7-workspace"></main><footer><span>No iframe • no paid API • static/offline-safe</span><button class="gdc-v7-reveal" type="button">Reveal next stage</button></footer>
  </div>`;
  let overlay, opener, mode='teacher', reveal=5;
  const focusables = () => overlay ? [...overlay.querySelectorAll('button,select,[href],[tabindex]:not([tabindex="-1"])')].filter(x=>!x.disabled) : [];
  const renderWorkflow = () => {
    if (!overlay) return; const i=Number(overlay.querySelector('.gdc-v7-select').value||0); const w=pack.workflows[i];
    const stages=[['MODEL',w.model],['ENTER',w.enter],['READ',w.read],['INTERPRET',w.interpret],['VERIFY',w.verify]];
    const shown=mode==='teacher'?5:Math.max(1,reveal);
    overlay.querySelector('.gdc-v7-workspace').innerHTML=`<div class="gdc-v7-screen"><span class="gdc-v7-badge">${esc(w.tag)}</span><h3>${esc(w.title)}</h3><p>${w.problem}</p></div><div class="gdc-v7-modal-grid">${stages.map((s,j)=>`<section class="gdc-v7-stage ${j<shown?'is-shown':'is-hidden'}"><h4>${s[0]}</h4><div>${j<shown?s[1]:'Think first. Reveal when ready.'}</div></section>`).join('')}</div>`;
    const revealBtn=overlay.querySelector('.gdc-v7-reveal'); revealBtn.hidden=mode==='teacher'; revealBtn.textContent=shown>=5?'Reset stages':'Reveal next stage';
    renderMath(overlay);
  };
  const close = () => { if (!overlay) return; overlay.remove(); document.body.classList.remove('gdc-v7-lock'); overlay=null; opener?.focus?.(); };
  const open = (index=0, source=null) => {
    opener=source||document.activeElement; overlay=document.createElement('div'); overlay.className='gdc-v7-overlay'; overlay.innerHTML=dialogHtml(); document.body.appendChild(overlay); document.body.classList.add('gdc-v7-lock');
    overlay.querySelector('.gdc-v7-select').value=String(index); renderWorkflow(); overlay.querySelector('.gdc-v7-close').focus();
    overlay.addEventListener('click',e=>{ if(e.target===overlay||e.target.closest('.gdc-v7-close')) close(); });
    overlay.querySelector('.gdc-v7-select').addEventListener('change',()=>{reveal=mode==='drill'?1:2;renderWorkflow();});
    overlay.querySelector('.gdc-v7-modes').addEventListener('click',e=>{const b=e.target.closest('[data-mode]');if(!b)return;mode=b.dataset.mode;reveal=mode==='drill'?1:2;overlay.querySelectorAll('[data-mode]').forEach(x=>x.classList.toggle('is-active',x===b));renderWorkflow();});
    overlay.querySelector('.gdc-v7-reveal').addEventListener('click',()=>{reveal=reveal>=5?(mode==='drill'?1:2):reveal+1;renderWorkflow();});
  };
  document.addEventListener('click',e=>{const b=e.target.closest('.gdc-v7-open,.gdc-v7-launch');if(!b)return;e.preventDefault();open(Number(b.dataset.workflow||0),b);});
  document.addEventListener('keydown',e=>{if(!overlay)return;if(e.key==='Escape'){e.preventDefault();close();return;}if(e.key==='Tab'){const f=focusables();if(!f.length)return;const first=f[0],last=f[f.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
  const installLauncher = () => {
    if (document.querySelector('.gdc-v7-launch')) return;
    const host=document.querySelector('.route-tabs,.mode-tabs,.top-actions,.header-actions,.lesson-actions,header'); if(!host)return;
    const b=document.createElement('button'); b.type='button'; b.className='gdc-v7-launch'; b.innerHTML='<span>TI-84</span> GDC Lab'; b.setAttribute('aria-label','Open local TI-84 and GDC lab'); host.appendChild(b);
  };
  const refresh=()=>{installLauncher();renderMath(document);};
  new MutationObserver(refresh).observe(document.body,{childList:true,subtree:true});
  setTimeout(()=>{refresh();window.dispatchEvent(new HashChangeEvent('hashchange'));},0);
})();
'''

CSS_TEXT = r'''
.gdc-v7-card{border:1px solid rgba(111,25,52,.18);border-radius:24px;background:linear-gradient(145deg,#fff,#fbf7f4);box-shadow:0 18px 45px rgba(20,35,55,.09);padding:clamp(18px,3vw,34px);max-width:1120px;margin:0 auto}.gdc-v7-eyebrow{display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap}.gdc-v7-eyebrow span,.gdc-v7-badge{display:inline-flex;border-radius:999px;background:#6f1934;color:#fff;padding:6px 11px;font-weight:800;font-size:.78rem;letter-spacing:.05em;text-transform:uppercase}.gdc-v7-open,.gdc-v7-launch{border:0;border-radius:999px;background:linear-gradient(135deg,#6f1934,#15374d);color:#fff;padding:10px 15px;font-weight:800;cursor:pointer;box-shadow:0 9px 24px rgba(21,55,77,.18)}.gdc-v7-launch{margin-inline-start:8px}.gdc-v7-launch span{background:#f3cc72;color:#37200b;padding:3px 7px;border-radius:7px;margin-inline-end:5px}.gdc-v7-problem,.gdc-v7-screen p{font-size:clamp(1rem,1.8vw,1.22rem);line-height:1.65;color:#243746}.gdc-v7-grid,.gdc-v7-modal-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px;margin-top:18px}.gdc-v7-stage{border-radius:17px;border:1px solid rgba(21,55,77,.13);background:#fff;padding:15px;min-height:120px}.gdc-v7-stage:last-child{grid-column:1/-1;background:#f2fbf9}.gdc-v7-stage h4{margin:0 0 8px;color:#6f1934;font-size:.79rem;letter-spacing:.12em}.gdc-v7-stage div{line-height:1.58}.gdc-v7-overlay{position:fixed;inset:0;z-index:100000;background:rgba(7,18,29,.72);backdrop-filter:blur(8px);display:grid;place-items:center;padding:18px}.gdc-v7-shell{width:min(1040px,100%);max-height:min(92vh,900px);overflow:auto;background:#f8f5f1;border-radius:28px;box-shadow:0 28px 80px rgba(0,0,0,.35);color:#172b3a}.gdc-v7-shell>header{position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;gap:18px;align-items:center;padding:20px 24px;background:linear-gradient(135deg,#68172f,#15374d);color:#fff}.gdc-v7-shell h2{margin:4px 0 0;font-size:clamp(1.15rem,2vw,1.65rem)}.gdc-v7-kicker{font-size:.72rem;font-weight:850;letter-spacing:.09em;color:#f5d98f}.gdc-v7-close{border:1px solid rgba(255,255,255,.35);background:rgba(255,255,255,.12);color:#fff;border-radius:50%;width:42px;height:42px;font-size:1.6rem;cursor:pointer}.gdc-v7-toolbar{display:flex;align-items:end;justify-content:space-between;gap:16px;flex-wrap:wrap;padding:16px 24px;background:#fff;border-bottom:1px solid #e5ddd6}.gdc-v7-toolbar label{display:grid;gap:6px;font-size:.78rem;font-weight:800;color:#5c3342}.gdc-v7-select{max-width:min(620px,78vw);padding:10px 12px;border:1px solid #c9c1ba;border-radius:12px;background:#fff}.gdc-v7-modes{display:flex;gap:6px;background:#eef2f4;padding:5px;border-radius:13px}.gdc-v7-modes button{border:0;background:transparent;border-radius:9px;padding:8px 11px;font-weight:800;cursor:pointer}.gdc-v7-modes button.is-active{background:#15374d;color:#fff}.gdc-v7-workspace{padding:22px 24px}.gdc-v7-screen{border-radius:20px;background:#fff;padding:18px 20px;border-left:5px solid #c69b42}.gdc-v7-stage.is-hidden{background:repeating-linear-gradient(135deg,#f3f0ed,#f3f0ed 10px,#faf8f6 10px,#faf8f6 20px);color:#6e6863}.gdc-v7-shell>footer{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:15px 24px;background:#fff;border-top:1px solid #e5ddd6;font-size:.8rem}.gdc-v7-reveal{border:0;border-radius:12px;background:#6f1934;color:#fff;padding:10px 14px;font-weight:800;cursor:pointer}.gdc-v7-lock{overflow:hidden}.gdc-v7-open:focus-visible,.gdc-v7-launch:focus-visible,.gdc-v7-shell button:focus-visible,.gdc-v7-shell select:focus-visible{outline:3px solid #f0bd4f;outline-offset:3px}@media(max-width:720px){.gdc-v7-grid,.gdc-v7-modal-grid{grid-template-columns:1fr}.gdc-v7-stage:last-child{grid-column:auto}.gdc-v7-overlay{padding:0}.gdc-v7-shell{width:100%;height:100dvh;max-height:none;border-radius:0}.gdc-v7-toolbar,.gdc-v7-workspace,.gdc-v7-shell>header,.gdc-v7-shell>footer{padding-left:16px;padding-right:16px}.gdc-v7-shell>footer{align-items:flex-start;flex-direction:column}.gdc-v7-select{max-width:88vw}.gdc-v7-launch{font-size:.78rem;padding:8px 10px}}
'''.strip() + "\n"

QA_PY = r'''#!/usr/bin/env python3
from __future__ import annotations
import json, math, re, subprocess, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
UNIT=ROOT/'lessons/ib-math-ai/unit-1'
LESSONS=UNIT/'lessons'
TARGETS={'1.2':'IB_AI_SL_1.2_arithmetic_sequences_ECHS.html','1.3':'IB_AI_SL_1.3_geometric_sequences_ECHS.html','1.4':'IB_AI_SL_1.4_financial_models_ECHS.html','1.5':'IB_AI_SL_1.5_logarithms_ECHS.html','1.6':'IB_AI_SL_1.6_technology_equations_ECHS.html'}
EXPECTED={'1.2':(4,6,1),'1.3':(5,7,1),'1.4':(7,10,3),'1.5':(5,7,1),'1.6':(8,10,3)}
errors=[]
def need(ok,msg):
    if not ok: errors.append(msg)
js=(UNIT/'data/unit-1-gdc-integration-v7.js').read_text(encoding='utf-8')
css=(UNIT/'assets/css/unit-1-gdc-integration-v7.css').read_text(encoding='utf-8')
need('MODEL' in js and 'ENTER' in js and 'READ' in js and 'INTERPRET' in js and 'VERIFY' in js,'missing five-stage framework')
need('iframe' not in js.lower() and 'ti84calc.com' not in js.lower(),'new runtime contains external calculator dependency')
need('@media(max-width:720px)' in css,'mobile CSS missing')
for n,f in TARGETS.items():
    text=(LESSONS/f).read_text(encoding='utf-8')
    need('../assets/css/unit-1-gdc-integration-v7.css' in text,f'{n}: CSS not wired')
    need('../data/unit-1-gdc-integration-v7.js' in text,f'{n}: JS not wired')
    need(text.count('unit-1-gdc-integration-v7.js')==1,f'{n}: duplicate JS wiring')
    if n in {'1.4','1.6'}:
        need('ti84calc.com' not in text.lower(),f'{n}: external calculator URL remains active')
        need('ti84-finance-classroom-v6-3.js' not in text if n=='1.4' else 'ti84-classroom-runtime-v6-2-1.js' not in text,f'{n}: legacy iframe runtime remains')
node=r''' + "'''" + r'''
const fs=require('fs'),vm=require('vm');const code=fs.readFileSync(process.argv[1],'utf8');
for(const n of ['1.2','1.3','1.4','1.5','1.6']){global.window={LESSON_DATA:{lesson:{number:n},slides:[],practice:[],exam:[]}};global.document={addEventListener(){},body:{},querySelector(){return null}};global.MutationObserver=function(){this.observe=()=>{}};global.HashChangeEvent=function(){};global.setTimeout=()=>{};vm.runInThisContext(code);const d=window.LESSON_DATA;console.log(JSON.stringify({n,s:d.slides.filter(x=>String(x.id).includes('GDC-V7')).length,p:d.practice.filter(x=>String(x.id).includes('GDC-V7')).length,t:d.exam.filter(x=>String(x.id).includes('GDC-V7')).length,ids:[...d.slides,...d.practice,...d.exam].map(x=>x.id),stages:d.slides.every(x=>['MODEL','ENTER','READ','INTERPRET','VERIFY'].every(k=>x.html.includes(k)))}));}
''' + "'''" + r'''
proc=subprocess.run(['node','-e',node,str(UNIT/'data/unit-1-gdc-integration-v7.js')],text=True,capture_output=True)
need(proc.returncode==0,'node data audit failed: '+proc.stderr)
tot=[0,0,0]
if proc.returncode==0:
    for line in proc.stdout.splitlines():
        row=json.loads(line); exp=EXPECTED[row['n']]
        need((row['s'],row['p'],row['t'])==exp,f"{row['n']}: count mismatch {(row['s'],row['p'],row['t'])} != {exp}")
        need(len(row['ids'])==len(set(row['ids'])),f"{row['n']}: duplicate IDs")
        need(row['stages'],f"{row['n']}: a teaching screen lacks a stage")
        tot=[tot[i]+(row['s'],row['p'],row['t'])[i] for i in range(3)]
need(tuple(tot)==(29,40,9),f'total counts wrong: {tot}')
need(sum(5+3*(k-1) for k in range(1,41))==2540,'arithmetic sigma wrong')
need(sum(18+3*(n-1) for n in range(1,38))==4144 and sum(18+3*(n-1) for n in range(1,39))==4351,'auditorium totals wrong')
need(abs(8500*(1.037**18)-16346.942714984983)<1e-8,'large power wrong')
need(abs(sum(600*(1.025**k) for k in range(25))-20494.658359731715)<1e-8,'geometric sum wrong')
ng=next(n for n in range(100) if 15000*(.82**n)<1000); need(ng==14,'geometric threshold wrong')
need(abs(math.log(17,3)-2.578901923)<1e-8,'exponential root wrong')
roots=[]
for a,b in [(0.2,0.3),(4.4,4.6)]:
    for _ in range(80):
        m=(a+b)/2
        if (2**a-5*a)*(2**m-5*m)<=0:b=m
        else:a=m
    roots.append((a+b)/2)
need(abs(roots[0]-.235455)<1e-5 and abs(roots[1]-4.488001)<1e-5,'intersection roots wrong')
need(all(abs(v)<1e-10 for v in [37/13+46/13+73/13-12,2*37/13-46/13+3*73/13-19,3*37/13+2*46/13-73/13-10]),'3x3 solution wrong')
for f in [UNIT/'data/unit-1-gdc-integration-v7.js',ROOT/'tools/browser_qa_ib_ai_unit1_gdc_v7.mjs']:
    p=subprocess.run(['node','--check',str(f)],capture_output=True,text=True);need(p.returncode==0,f'JS syntax failed {f}: {p.stderr}')
try:
    subprocess.run(['git','fetch','origin','main','--quiet'],cwd=ROOT,check=False)
    changed=subprocess.run(['git','diff','--name-only','origin/main...HEAD'],cwd=ROOT,text=True,capture_output=True).stdout.splitlines()
    need(not any('IB_AI_SL_1.1_' in x or 'lesson-1.1' in x for x in changed),'Lesson 1.1 was modified')
except Exception as exc: errors.append('git scope check failed: '+str(exc))
if errors:
    print('IB AI Unit 1 GDC v7 QA: FAIL')
    print('\n'.join('- '+e for e in errors));sys.exit(1)
print(json.dumps({'status':'PASS','lessons':EXPECTED,'totals':{'screens':29,'practice':40,'tasks':9},'lesson11Modified':False,'externalCalculatorDependencies':0},indent=2))
'''

BROWSER_MJS = r'''import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
const root=new URL('../',import.meta.url).pathname;const port=4173;const server=spawn('python3',['-m','http.server',String(port),'--directory',root],{stdio:'ignore'});await new Promise(r=>setTimeout(r,1200));
const files=['IB_AI_SL_1.2_arithmetic_sequences_ECHS.html','IB_AI_SL_1.3_geometric_sequences_ECHS.html','IB_AI_SL_1.4_financial_models_ECHS.html','IB_AI_SL_1.5_logarithms_ECHS.html','IB_AI_SL_1.6_technology_equations_ECHS.html'];
const devices=[['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]];const out='artifacts/ib-ai-unit1-gdc-v7';await fs.mkdir(out,{recursive:true});let failures=[];
try{const browser=await chromium.launch({headless:true});for(const [device,viewport] of devices){for(const file of files){const context=await browser.newContext({viewport});const page=await context.newPage();const errors=[];const external=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('request',r=>{const u=new URL(r.url());if(!['127.0.0.1','localhost'].includes(u.hostname)&&!['data:','blob:'].includes(u.protocol))external.push(r.url())});try{await page.goto(`http://127.0.0.1:${port}/lessons/ib-math-ai/unit-1/lessons/${file}#learn`,{waitUntil:'networkidle'});await page.waitForSelector('.gdc-v7-launch',{timeout:12000});if(await page.locator('iframe').count())throw new Error('iframe present');await page.locator('.gdc-v7-launch').focus();await page.keyboard.press('Enter');await page.waitForSelector('.gdc-v7-shell');if(await page.locator('.gdc-v7-stage').count()<5)throw new Error('five stages missing');const first=page.locator('.gdc-v7-shell button,.gdc-v7-shell select').first();const last=page.locator('.gdc-v7-shell button,.gdc-v7-shell select').last();await first.focus();await page.keyboard.press('Shift+Tab');if(!(await last.evaluate(el=>el===document.activeElement)))throw new Error('focus trap failed');await page.keyboard.press('Escape');await page.waitForSelector('.gdc-v7-shell',{state:'detached'});await page.evaluate(()=>{location.hash='#learn';window.dispatchEvent(new HashChangeEvent('hashchange'))});await page.waitForTimeout(350);const body=await page.locator('body').evaluate(el=>({sw:el.scrollWidth,cw:el.clientWidth,text:el.innerText}));if(body.sw>body.cw+3)throw new Error(`horizontal overflow ${body.sw}/${body.cw}`);if(!body.text.includes('TI-84')&&!body.text.includes('GDC'))throw new Error('GDC content not discoverable');if(external.some(x=>/ti84calc|desmos|geogebra/i.test(x)))throw new Error('external calculator request');if(errors.length)throw new Error('console/page errors: '+errors.join(' | '));await page.screenshot({path:`${out}/${device}-${file.replace('.html','')}.png`,fullPage:false});}catch(e){failures.push(`${device} ${file}: ${e.message}`)}finally{await context.close()}}}await browser.close()}finally{server.kill('SIGTERM')}
if(failures.length){console.error(failures.join('\n'));process.exit(1)}console.log('Chromium desktop/mobile QA passed for all five lessons.');
'''

WORKFLOW = r'''name: IB AI Unit 1 GDC v7 QA
on:
  pull_request:
    paths:
      - 'lessons/ib-math-ai/unit-1/**'
      - 'tools/qa_ib_ai_unit1_gdc_v7.py'
      - 'tools/browser_qa_ib_ai_unit1_gdc_v7.mjs'
      - '.github/workflows/ib-ai-unit1-gdc-v7-qa.yml'
  workflow_dispatch:
permissions:
  contents: read
jobs:
  static-and-browser:
    runs-on: ubuntu-latest
    timeout-minutes: 25
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - name: Install Chromium
        run: |
          npm install --no-save playwright@1.55.0
          npx playwright install --with-deps chromium
      - name: Static, syntax and mathematics QA
        run: python tools/qa_ib_ai_unit1_gdc_v7.py
      - name: Chromium desktop and mobile QA
        run: node tools/browser_qa_ib_ai_unit1_gdc_v7.mjs
      - name: Upload browser evidence
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: ib-ai-unit1-gdc-v7-browser-evidence
          path: artifacts/ib-ai-unit1-gdc-v7
          if-no-files-found: ignore
'''


def write(path: Path, content: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8", newline="\n")


js = JS_TEMPLATE.replace("__PACKS__", json.dumps(PACKS, ensure_ascii=False, separators=(",", ":")))
write(DATA / "unit-1-gdc-integration-v7.js", js)
write(CSS / "unit-1-gdc-integration-v7.css", CSS_TEXT)
write(ROOT / "tools/qa_ib_ai_unit1_gdc_v7.py", QA_PY)
write(ROOT / "tools/browser_qa_ib_ai_unit1_gdc_v7.mjs", BROWSER_MJS)
write(ROOT / ".github/workflows/ib-ai-unit1-gdc-v7-qa.yml", WORKFLOW)

css_tag = '  <link rel="stylesheet" href="../assets/css/unit-1-gdc-integration-v7.css">\n'
js_tag = '  <script src="../data/unit-1-gdc-integration-v7.js" defer></script>\n'
legacy = {
    "1.4": ["lesson-1.4-ti84-finance-classroom-v6-3.js", "lesson-1.4-ti84-finance-inline-v6-3.js"],
    "1.6": ["lesson-1.6-ti84-classroom-runtime-v6-2-1.js", "lesson-1.6-ti84-inline-dock-v6-3.js"],
}
for number, filename in FILES.items():
    path = LESSONS / filename
    text = path.read_text(encoding="utf-8")
    text = re.sub(r'\s*<link[^>]+unit-1-gdc-integration-v7\.css[^>]*>\s*', '\n', text)
    text = re.sub(r'\s*<script[^>]+unit-1-gdc-integration-v7\.js[^>]*></script>\s*', '\n', text)
    for old in legacy.get(number, []):
        text = re.sub(r'\s*<script[^>]+src=["\'][^"\']*' + re.escape(old) + r'[^"\']*["\'][^>]*></script>\s*', '\n', text)
    text = text.replace("</head>", css_tag + "</head>", 1)
    text = text.replace("</body>", js_tag + "</body>", 1)
    path.write_text(text, encoding="utf-8", newline="\n")

for rel in ["lesson-1.4-ti84-finance-workflows-v6-3.js", "lesson-1.6-ti84-classroom-workflows-v6-2-2.js"]:
    p = DATA / rel
    if p.exists():
        t = p.read_text(encoding="utf-8")
        t = t.replace("https://ti84calc.com/ti84calc", "local-echs-gdc-v7")
        t = t.replace("thirdPartySimulator:true", "thirdPartySimulator:false")
        p.write_text(t, encoding="utf-8", newline="\n")

print(json.dumps({"installed": True, "counts": {k: [len(v['workflows']), len(v['practice']), len(v['tasks'])] for k,v in PACKS.items()}, "totals": [29,40,9]}, indent=2))
