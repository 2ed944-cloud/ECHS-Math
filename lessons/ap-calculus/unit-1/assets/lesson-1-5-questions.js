/* Original and rebuilt ECHS classroom questions; extension source map retains the former challenge collection. */
(function(root){const data={
  "questions": [
    {
      "id": "launch",
      "type": "mcq",
      "group": "Opening prediction",
      "prompt": "If \\(f(x)\\to2\\) and \\(g(x)\\to3\\), what is \\(\\lim[f(x)+g(x)]\\)?",
      "choices": [
        "6",
        "5",
        "The sum of the point values at the target.",
        "Not determined."
      ],
      "answer": 1,
      "hint": "Use the two established finite limits.",
      "solution": "The sum law gives 2 + 3 = 5. No point value at the target is required."
    },
    {
      "id": "law-check",
      "type": "number",
      "group": "Guided check",
      "prompt": "If \\(f\\to2,g\\to-3\\), find \\(\\lim(3f-2g)\\).",
      "answer": 12,
      "unit": "exact value",
      "hint": "Preserve the minus sign.",
      "solution": "The constant-multiple and difference laws give 3(2)−2(−3)=12."
    },
    {
      "id": "root-check",
      "type": "number",
      "group": "Guided check",
      "prompt": "If \\(h\\to4\\), find \\(\\lim\\sqrt{h+5}\\).",
      "answer": 3,
      "unit": "exact value",
      "hint": "Find the radicand limit first.",
      "solution": "The radicand tends to 9, so it is positive near the target. Continuity of the square root gives 3."
    },
    {
      "id": "quotient-check",
      "type": "mcq",
      "group": "Quotient check",
      "prompt": "If \\(f\\to0,g\\to0\\), with g nonzero away from the target, what does the quotient law alone establish about \\(f/g\\)?",
      "choices": [
        "Its limit is 0.",
        "Its limit is 1.",
        "Its limit is DNE.",
        "The law is inconclusive because the denominator limit is 0."
      ],
      "answer": 3,
      "hint": "Check the hypothesis before calculating.",
      "solution": "The quotient law requires a nonzero denominator limit. Different pairs tending to zero can give different quotient limits."
    },
    {
      "id": "compose-check",
      "type": "number",
      "group": "Guided check",
      "prompt": "If \\(g(x)\\to4\\) and \\(F(t)=t^2+1\\), find \\(\\lim F(g(x))\\).",
      "answer": 17,
      "unit": "exact value",
      "hint": "Evaluate the outer function at the inner limiting value.",
      "solution": "F is a polynomial and continuous at 4. Thus the composite tends to F(4)=17."
    },
    {
      "id": "exit",
      "type": "mcq",
      "group": "AP exit check",
      "prompt": "Which statement correctly justifies direct substitution in a rational function P/Q at c?",
      "choices": [
        "P and Q are polynomials and Q(c) ≠ 0.",
        "P(c) = 0.",
        "The graph looks smooth at c.",
        "The quotient is defined at one nearby point."
      ],
      "answer": 0,
      "hint": "State the denominator condition.",
      "solution": "Polynomial limits are their values at c. The quotient law applies when Q(c) is nonzero."
    },
    {
      "id": "ap01",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "As \\(x\\to c\\), \\(f(x)\\to2,g(x)\\to-3,h(x)\\to4\\). Find \\(\\lim(3f-2g)\\).",
      "choices": [
        "0",
        "−12",
        "12",
        "1"
      ],
      "answer": 2,
      "hint": "Use constant multiples and subtraction.",
      "solution": "3(2)−2(−3)=12."
    },
    {
      "id": "ap02",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "As \\(x\\to c\\), \\(f(x)\\to2,g(x)\\to-3,h(x)\\to4\\). Find \\(\\lim fg^2\\).",
      "choices": [
        "18",
        "−18",
        "36",
        "12"
      ],
      "answer": 0,
      "hint": "Apply the power law before the product law.",
      "solution": "2(−3)²=18."
    },
    {
      "id": "ap03",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "As \\(x\\to c\\), \\(f(x)\\to2,g(x)\\to-3,h(x)\\to4\\). Find \\(\\lim f/g\\).",
      "choices": [
        "\\(2/3\\)",
        "\\(-3/2\\)",
        "DNE",
        "\\(-2/3\\)"
      ],
      "answer": 3,
      "hint": "The denominator limit is nonzero.",
      "solution": "The quotient law gives 2/(−3)=−2/3."
    },
    {
      "id": "ap04",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "As \\(x\\to c\\), \\(f(x)\\to2,g(x)\\to-3,h(x)\\to4\\). Find \\(\\lim\\sqrt{h+5}\\).",
      "choices": [
        "9",
        "3",
        "\\(\\sqrt4+\\sqrt5\\)",
        "DNE"
      ],
      "answer": 1,
      "hint": "Combine inside the root first.",
      "solution": "h+5 tends to 9>0. The root is defined near the target and tends to 3."
    },
    {
      "id": "ap05",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "As \\(x\\to c\\), \\(f(x)\\to2,g(x)\\to-3,h(x)\\to4\\). Find \\(\\lim g^3\\).",
      "choices": [
        "−9",
        "9",
        "−27",
        "27"
      ],
      "answer": 2,
      "hint": "Keep the sign of an odd power.",
      "solution": "The power law gives (−3)³=−27."
    },
    {
      "id": "ap06",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "If \\(p(x)\\to-8\\), find \\(\\lim\\sqrt[3]{p(x)}\\).",
      "choices": [
        "2",
        "DNE",
        "8",
        "−2"
      ],
      "answer": 3,
      "hint": "An odd root is defined for negative real inputs.",
      "solution": "The real cube-root function is continuous at −8; its value is −2."
    },
    {
      "id": "ap07",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "As \\(x\\to c\\), \\(f(x)\\to2,g(x)\\to-3,h(x)\\to4\\). Which denominator prevents direct use of the quotient law?",
      "choices": [
        "\\(g+3\\)",
        "\\(h\\)",
        "\\(g\\)",
        "\\(h-g\\)"
      ],
      "answer": 0,
      "hint": "Evaluate every denominator limit.",
      "solution": "g+3 tends to 0. The other limits are 4, −3 and 7, all nonzero."
    },
    {
      "id": "ap08",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Find \\(\\lim_{x\\to-2}(x^3-3x+1)\\).",
      "choices": [
        "−13",
        "−1",
        "1",
        "DNE"
      ],
      "answer": 1,
      "hint": "Polynomial substitution follows from limit laws.",
      "solution": "(−2)³−3(−2)+1=−8+6+1=−1."
    },
    {
      "id": "ap09",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Find \\(\\lim_{x\\to2}(x^2+1)/(x+1)\\).",
      "choices": [
        "3/5",
        "3",
        "5",
        "5/3"
      ],
      "answer": 3,
      "hint": "Verify that the denominator tends to 3.",
      "solution": "The numerator tends to 5, the denominator to nonzero 3. The quotient tends to 5/3."
    },
    {
      "id": "ap10",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "If \\(g\\to-3\\) and \\(F(t)=t^2+1\\), find \\(\\lim F(g(x))\\).",
      "choices": [
        "−8",
        "−10",
        "10",
        "4"
      ],
      "answer": 2,
      "hint": "Inside first, then the continuous outside function.",
      "solution": "F is continuous at −3, so the limit is F(−3)=10."
    },
    {
      "id": "ap11",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Let \\(f(x)\\to2,g(x)\\to3\\), but \\(f(c)=8,g(c)=-1\\). Find \\(\\lim(2f+g)\\).",
      "choices": [
        "15",
        "7",
        "5",
        "DNE"
      ],
      "answer": 1,
      "hint": "Point values are separate from limiting values.",
      "solution": "2(2)+3=7. The assigned point values do not enter the limit law."
    },
    {
      "id": "ap12",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "At c, f has left/right limits 1,4 and g has left/right limits 3,−1. Find \\(\\lim(f+g)\\).",
      "choices": [
        "DNE",
        "4",
        "3",
        "7"
      ],
      "answer": 0,
      "hint": "Apply the sum law on each side.",
      "solution": "The left sum tends to 1+3=4; the right sum tends to 4−1=3. The two-sided limit does not exist."
    },
    {
      "id": "ap13",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "At c, f has left/right limits 2,−2 and g has left/right limits 3,−3. Find \\(\\lim fg\\).",
      "choices": [
        "−6",
        "DNE",
        "6",
        "0"
      ],
      "answer": 2,
      "hint": "Compute the products on the two sides separately.",
      "solution": "Both products tend to 6. The component two-sided limits fail, but the one-sided product laws establish the result."
    },
    {
      "id": "ap14",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "If \\(f(x)\\to-2\\), find \\(\\lim\\sqrt{[f(x)]^2}\\).",
      "choices": [
        "2",
        "−2",
        "4",
        "DNE"
      ],
      "answer": 0,
      "hint": "The principal square root is nonnegative.",
      "solution": "\\(\\sqrt{f^2}=|f|\\). Continuity of absolute value gives 2."
    },
    {
      "id": "ap15",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "If \\(g\\to4\\), which fact justifies \\(\\sqrt{g}\\to2\\)?",
      "choices": [
        "g must equal 4 at the target.",
        "Every square-root limit equals 2.",
        "The quotient law applies.",
        "g is positive sufficiently near the target, and √t is continuous at 4."
      ],
      "answer": 3,
      "hint": "A positive radicand limit supplies a local domain guarantee.",
      "solution": "For example, sufficiently near the target |g−4|<2, so g>2. The root is defined there, and continuity gives 2."
    },
    {
      "id": "ap16",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Suppose \\(f\\to3,g\\to1\\). Find \\(\\lim(f^2+g)/(f-g)\\).",
      "choices": [
        "4",
        "5",
        "10",
        "DNE"
      ],
      "answer": 1,
      "hint": "Compute the numerator and denominator limits separately.",
      "solution": "The numerator tends to 10 and the denominator to 2≠0, so the quotient tends to 5."
    },
    {
      "id": "ch01",
      "type": "mcq",
      "group": "Challenge MCQ 1",
      "prompt": "If \\(\\lim(f+g)=10\\) and \\(\\lim(f-g)=4\\), what are \\(\\lim f,\\lim g\\)?",
      "choices": [
        "(7,3)",
        "(6,4)",
        "(10,4)",
        "Not determined."
      ],
      "answer": 0,
      "hint": "Express each function using the two combinations.",
      "solution": "\\(f=((f+g)+(f-g))/2\\to7\\), and \\(g=((f+g)-(f-g))/2\\to3\\). This derives the component limits instead of assuming them."
    },
    {
      "id": "ch02",
      "type": "mcq",
      "group": "Challenge MCQ 2",
      "prompt": "Given \\(f\\to2,g\\to-1\\), find k such that \\(kf+(k-3)g\\to12\\).",
      "choices": [
        "3",
        "6",
        "9",
        "12"
      ],
      "answer": 2,
      "hint": "Apply the laws before solving for k.",
      "solution": "2k−(k−3)=k+3=12, so k=9."
    },
    {
      "id": "ch03",
      "type": "mcq",
      "group": "Challenge MCQ 3",
      "prompt": "If \\(g\\to0\\) but g has positive and negative values arbitrarily near c, what is justified about \\(\\sqrt g\\) over the reals?",
      "choices": [
        "Its limit must be DNE.",
        "It is undefined wherever g<0; examine the limit on its actual real domain.",
        "It is real for all nearby x.",
        "Its limit is −1."
      ],
      "answer": 1,
      "hint": "Separate the domain issue from the limit along allowed inputs.",
      "solution": "Negative radicands are excluded. Along admissible inputs where g≥0, continuity of √t at 0 gives √g→0 if c is an accumulation point of that domain. A full two-sided neighborhood is not guaranteed."
    },
    {
      "id": "ch04",
      "type": "mcq",
      "group": "Challenge MCQ 4",
      "prompt": "Let \\(F(t)=0\\) for t<0 and F(t)=1 for t≥0. If g→0 and g>0 near c, find \\(\\lim F(g(x))\\).",
      "choices": [
        "0",
        "DNE",
        "F(c)",
        "1"
      ],
      "answer": 3,
      "hint": "Which outer branch receives the inner values?",
      "solution": "All sufficiently close inner inputs are positive, so F(g(x)) is identically 1 there."
    },
    {
      "id": "ch05",
      "type": "mcq",
      "group": "Challenge MCQ 5",
      "prompt": "If f→0 and g→0, which extra condition guarantees f/g→3?",
      "choices": [
        "f(c)=3g(c).",
        "f=3g and g≠0 on a punctured neighborhood.",
        "f and g have equal limits.",
        "g is sometimes nonzero."
      ],
      "answer": 1,
      "hint": "The quotient needs an exact nearby identity and a domain.",
      "solution": "The condition makes f/g identically 3 for every sufficiently close non-target input."
    },
    {
      "id": "ch06",
      "type": "mcq",
      "group": "Challenge MCQ 6",
      "prompt": "If f→A≠0 and fg→C, what can be concluded about g?",
      "choices": [
        "Its limit need not exist.",
        "Its limit is AC.",
        "g→C/A.",
        "g→A/C always."
      ],
      "answer": 2,
      "hint": "Solve for g where f is nonzero.",
      "solution": "Because f→A≠0, f is nonzero nearby. Apply the quotient law to \\(g=(fg)/f\\) to obtain C/A; no prior assumption that g has a limit is needed."
    },
    {
      "id": "ch07",
      "type": "mcq",
      "group": "Challenge MCQ 7",
      "prompt": "If f=g whenever \\(0<|x-c|<\\delta_0\\), and f→L, what follows?",
      "choices": [
        "g→L.",
        "g(c)=L.",
        "f(c)=g(c).",
        "g is continuous everywhere."
      ],
      "answer": 0,
      "hint": "Limits ignore a single target value.",
      "solution": "Exact agreement on a punctured neighborhood transfers the limit, without determining either point value."
    },
    {
      "id": "ch08",
      "type": "mcq",
      "group": "Challenge MCQ 8",
      "prompt": "If f→2 and g→3, for which k does \\((f+kg)/(kf-g)\\) fail the quotient-law denominator test?",
      "choices": [
        "−3/2",
        "2/3",
        "3",
        "3/2"
      ],
      "answer": 3,
      "hint": "Set the denominator limit to zero.",
      "solution": "2k−3=0 gives k=3/2. This identifies the failed hypothesis; the law alone does not classify side behavior."
    },
    {
      "id": "ch09",
      "type": "mcq",
      "group": "Challenge MCQ 9",
      "prompt": "Let \\(F(t)=|t|/t\\) for t≠0 and \\(g(x)=(x-c)^2\\). Find \\(\\lim F(g(x))\\).",
      "choices": [
        "DNE",
        "1",
        "−1",
        "0"
      ],
      "answer": 1,
      "hint": "The inner expression stays strictly positive off c.",
      "solution": "For x≠c, g(x)>0, so |g(x)|/g(x)=1."
    },
    {
      "id": "ch10",
      "type": "mcq",
      "group": "Challenge MCQ 10",
      "prompt": "If f→−6, find \\(\\lim\\sqrt{f^2}\\).",
      "choices": [
        "−6",
        "36",
        "6",
        "DNE"
      ],
      "answer": 2,
      "hint": "Use the principal square root.",
      "solution": "\\(\\sqrt{f^2}=|f|\\to|-6|=6\\)."
    },
    {
      "id": "ch11",
      "type": "mcq",
      "group": "Challenge MCQ 11",
      "prompt": "When g→0, which condition is sufficient for √g to be defined throughout a punctured neighborhood and tend to 0?",
      "choices": [
        "g is defined and nonnegative throughout that neighborhood.",
        "g(c)=0 only.",
        "g<0 there.",
        "g is positive at one sample."
      ],
      "answer": 0,
      "hint": "The endpoint of the square-root domain needs care.",
      "solution": "Nonnegativity gives a real composite throughout the neighborhood, and √t is continuous on [0,∞), including at 0."
    },
    {
      "id": "ch12",
      "type": "mcq",
      "group": "Challenge MCQ 12",
      "prompt": "Which expression cannot be justified by direct substitution alone?",
      "choices": [
        "\\(\\lim_{x\\to2}(x^2+1)\\)",
        "\\(\\lim_{x\\to2}1/(x+1)\\)",
        "\\(\\lim_{x\\to2}\\sqrt{x+2}\\)",
        "\\(\\lim_{x\\to2}(x^2-4)/(x-2)\\)"
      ],
      "answer": 3,
      "hint": "Look for the zero denominator.",
      "solution": "The last expression gives 0/0. Topic 1.6 supplies the factor-and-cancel method; the substitution theorem alone does not evaluate it."
    },
    {
      "id": "ch13",
      "type": "mcq",
      "group": "Challenge MCQ 13",
      "prompt": "For g→L, where must F be continuous to guarantee F(g)→F(L)?",
      "choices": [
        "At every real number.",
        "At L.",
        "At the original target c only.",
        "At F(L) only."
      ],
      "answer": 1,
      "hint": "The outer input approaches L.",
      "solution": "Continuity at the inner limiting value is sufficient. Discontinuities far from L do not matter."
    },
    {
      "id": "ch14",
      "type": "mcq",
      "group": "Challenge MCQ 14",
      "prompt": "If f→2 and \\(R=(f+g)/(f-g)\\to3\\), find \\(\\lim g\\). Assume R is defined near c.",
      "choices": [
        "2",
        "3",
        "1",
        "Not determined."
      ],
      "answer": 2,
      "hint": "Rearrange the identity without assuming a limit for g.",
      "solution": "\\(g=f(R-1)/(R+1)\\). Since R+1→4≠0, the quotient law gives g→2(2)/4=1."
    },
    {
      "id": "ch15",
      "type": "mcq",
      "group": "Challenge MCQ 15",
      "prompt": "Which change can never affect an existing limit at c?",
      "choices": [
        "Changing only the assigned value at c.",
        "Changing all values to the right of c.",
        "Changing a sequence of points approaching c.",
        "Changing every nearby value."
      ],
      "answer": 0,
      "hint": "A limit concerns non-target inputs.",
      "solution": "Changing only the value at c leaves all sufficiently close non-target values unchanged."
    },
    {
      "id": "ch16",
      "type": "mcq",
      "group": "Challenge MCQ 16",
      "prompt": "If \\(f_j\\to L_j\\) for j=1,…,n with all limits finite, what is \\(\\lim\\prod_{j=1}^n f_j\\)?",
      "choices": [
        "\\(\\sum L_j\\)",
        "Not determined.",
        "\\(\\prod L_j\\) only if every L_j≠0.",
        "\\(\\prod L_j\\)"
      ],
      "answer": 3,
      "hint": "Apply the product law repeatedly.",
      "solution": "Induction using the two-factor product law gives the finite product. Zero factor limits are allowed."
    },
    {
      "id": "ch17",
      "type": "mcq",
      "group": "Challenge MCQ 17",
      "prompt": "Why does P(x)/Q(x) permit substitution when P,Q are polynomials and Q(c)≠0?",
      "choices": [
        "Every function permits substitution.",
        "Polynomial limit laws plus the quotient law meet all the needed hypotheses.",
        "Only the numerator matters.",
        "Because 0/0 equals 0."
      ],
      "answer": 1,
      "hint": "Build the theorem chain.",
      "solution": "Sums, products and powers justify P→P(c), Q→Q(c). The nonzero denominator then licenses their quotient."
    },
    {
      "id": "ch18",
      "type": "mcq",
      "group": "Challenge MCQ 18",
      "prompt": "From fg→AB alone, can one infer f→A and g→B?",
      "choices": [
        "Always.",
        "Only if AB=0.",
        "No; a convergent product need not have convergent factors.",
        "Yes if f(c)=A."
      ],
      "answer": 2,
      "hint": "A forward theorem is not automatically reversible.",
      "solution": "Take f=g=sgn(x) as x→0. Both lack a two-sided limit, but their product is 1 off 0."
    },
    {
      "id": "ch19",
      "type": "mcq",
      "group": "Challenge MCQ 19",
      "prompt": "F has a jump at L and g→L. Which extra information can determine a composite limit?",
      "choices": [
        "The side from which g approaches L, whether it hits L, and the matching outer behavior.",
        "Only F(c).",
        "Only g(c).",
        "The sum F(L)+g(c)."
      ],
      "answer": 0,
      "hint": "Trace the values actually fed into F.",
      "solution": "An approach strictly from one known side plus the matching one-sided outer limit is sufficient. If g hits L arbitrarily nearby, the value F(L) can also matter."
    },
    {
      "id": "ch20",
      "type": "mcq",
      "group": "Challenge MCQ 20",
      "prompt": "If f→4 and fg→10, find \\(\\lim g\\).",
      "choices": [
        "40",
        "6",
        "4/10",
        "5/2"
      ],
      "answer": 3,
      "hint": "Use g=(fg)/f.",
      "solution": "f is nonzero sufficiently near the target. The quotient law gives 10/4=5/2."
    },
    {
      "id": "ch21",
      "type": "mcq",
      "group": "Challenge MCQ 21",
      "prompt": "Which sequence condition expresses \\(\\lim_{x\\to c}f(x)=L\\)?",
      "choices": [
        "One sequence approaching c has outputs tending to L.",
        "Every sequence of domain points xₙ≠c approaching c has f(xₙ)→L.",
        "Only equally spaced samples are needed.",
        "The constant sequence xₙ=c is enough."
      ],
      "answer": 1,
      "hint": "A limit must control every admissible approach.",
      "solution": "The condition quantifies over every domain sequence approaching c while avoiding c. Assume c is an accumulation point of the domain."
    },
    {
      "id": "ch22",
      "type": "mcq",
      "group": "Challenge MCQ 22",
      "prompt": "If f→2 and f+g→9, what is \\(\\lim g\\)?",
      "choices": [
        "11",
        "2",
        "7",
        "Not determined."
      ],
      "answer": 2,
      "hint": "Subtract the known convergent functions.",
      "solution": "g=(f+g)−f→9−2=7."
    },
    {
      "id": "ch23",
      "type": "mcq",
      "group": "Challenge MCQ 23",
      "prompt": "Find \\(\\lim_{x\\to\\pi}e^x\\cos x\\).",
      "choices": [
        "\\(-e^\\pi\\)",
        "\\(e^\\pi\\)",
        "0",
        "DNE"
      ],
      "answer": 0,
      "hint": "Both factors are continuous at π.",
      "solution": "The product law and continuity give e^π cosπ=−e^π. No algebraic manipulation is needed."
    },
    {
      "id": "ch24",
      "type": "mcq",
      "group": "Challenge MCQ 24",
      "prompt": "Find \\(\\lim_{x\\to0}e^x\\sec x\\).",
      "choices": [
        "0",
        "−1",
        "DNE",
        "1"
      ],
      "answer": 3,
      "hint": "Check the cosine denominator.",
      "solution": "e^x→1 and cosx→1≠0, so e^x/cosx→1."
    },
    {
      "id": "ch25",
      "type": "mcq",
      "group": "Challenge MCQ 25",
      "prompt": "Given f→2 and 3f−g→11, find \\(\\lim g\\).",
      "choices": [
        "5",
        "−5",
        "17",
        "Not determined."
      ],
      "answer": 1,
      "hint": "Express g in terms of known convergent combinations.",
      "solution": "g=3f−(3f−g)→6−11=−5."
    },
    {
      "id": "ch26",
      "type": "mcq",
      "group": "Challenge MCQ 26",
      "prompt": "f has one-sided limits −a and a at c, with a>0. For positive integers n, when does \\(\\lim f^n\\) exist?",
      "choices": [
        "Only odd n.",
        "Never.",
        "Exactly for even n, when its value is aⁿ.",
        "For every n, with value 0."
      ],
      "answer": 2,
      "hint": "Compare (−a)ⁿ and aⁿ.",
      "solution": "Even powers agree on both sides; odd powers are opposite nonzero values. Also |f|→a."
    },
    {
      "id": "ch27",
      "type": "mcq",
      "group": "Challenge MCQ 27",
      "prompt": "Let g(u)=3 for u<−1, g(−1)=0, and g(u)=−3 for u>−1. Find \\(\\lim_{x\\to5^+}g(25-x^2)\\).",
      "choices": [
        "−3",
        "3",
        "0",
        "DNE"
      ],
      "answer": 0,
      "hint": "Find the actual landing input; do not assume it is −1.",
      "solution": "25−x²→0 from below. For x sufficiently close to 5, this input is still greater than −1, so the outer value is −3."
    },
    {
      "id": "ch28",
      "type": "mcq",
      "group": "Challenge MCQ 28",
      "prompt": "Let h(x)=x+4 for x<0, h(0)=−4, and h(x)=x−4 for x>0. Find \\(\\lim_{x\\to0}h(h(x))\\).",
      "choices": [
        "−4",
        "4",
        "DNE",
        "0"
      ],
      "answer": 3,
      "hint": "Trace both inner branches through the outer function.",
      "solution": "For small negative x, h(x)=x+4>0 and h(h(x))=(x+4)−4=x. For small positive x, h(x)=x−4<0 and h(h(x))=(x−4)+4=x. Both tend to 0."
    },
    {
      "id": "ch29",
      "type": "mcq",
      "group": "Challenge MCQ 29",
      "prompt": "h(x)→2 as x→−2; g(u)=−3 throughout a neighborhood of 2; f is continuous at −3 with f(−3)=4. Find \\(\\lim_{x\\to-2}f(g(h(x)))\\).",
      "choices": [
        "−3",
        "4",
        "2",
        "DNE"
      ],
      "answer": 1,
      "hint": "Follow h, then g, then f.",
      "solution": "Eventually h(x) lies where g is identically −3, so the composite is f(−3)=4. The stated continuity is sufficient, though local constancy already settles this case."
    },
    {
      "id": "ch30",
      "type": "mcq",
      "group": "Challenge MCQ 30",
      "prompt": "Let v(0)=3, v(x)=x for x≠0; let w(x)=−3 for x<0, w(0)=0, w(x)=3 for x>0. Find \\(\\lim_{x\\to0}v(x)w(x)\\).",
      "choices": [
        "3",
        "DNE",
        "0",
        "−3"
      ],
      "answer": 2,
      "hint": "Compute the product on each side.",
      "solution": "Off 0 the product is 3|x|, whose limit is 0. Point assignments do not enter."
    },
    {
      "id": "ch31",
      "type": "mcq",
      "group": "Challenge MCQ 31",
      "prompt": "If f→4,g→−1,h→0, which expression is guaranteed to have a finite real limit?",
      "choices": [
        "\\(\\sqrt{f-g}\\)",
        "\\(f/h\\)",
        "\\(g/h\\)",
        "\\((h-1)/h\\)"
      ],
      "answer": 0,
      "hint": "Check every radicand and denominator.",
      "solution": "The radicand tends to 5>0, so the square root tends to √5. The other denominators tend to zero while their numerators tend to nonzero values."
    },
    {
      "id": "ch32",
      "type": "mcq",
      "group": "Challenge MCQ 32",
      "prompt": "f and g both jump from −1 on the left to 1 on the right of c. Find \\(\\lim fg\\).",
      "choices": [
        "DNE",
        "−1",
        "0",
        "1"
      ],
      "answer": 3,
      "hint": "Compare the two product branches.",
      "solution": "The product equals 1 on both sides. This does not contradict the product law: failed component hypotheses make that law unavailable, not the conclusion impossible."
    },
    {
      "id": "ch33",
      "type": "mcq",
      "group": "Challenge MCQ 33",
      "prompt": "Find the pair \\(\\lim_{x\\to-3}(5x+9),\\ \\lim_{x\\to4}3x/(x-2)\\).",
      "choices": [
        "(−6,3)",
        "(−6,6)",
        "(6,6)",
        "(−24,6)"
      ],
      "answer": 1,
      "hint": "Use polynomial substitution and check the quotient denominator.",
      "solution": "The first limit is −15+9=−6. The second is 12/2=6, with denominator limit 2≠0."
    },
    {
      "id": "ch34",
      "type": "mcq",
      "group": "Challenge MCQ 34",
      "prompt": "Find: (i) lim(2f+1) if f→6; (ii) lim f⁴ if f→−2; (iii) lim(f+g)/g if f→3,g→−1.",
      "choices": [
        "(13,−16,−2)",
        "(12,16,2)",
        "(13,16,−2)",
        "(13,16,2)"
      ],
      "answer": 2,
      "hint": "Name the linear, power, and quotient laws.",
      "solution": "The results are 2(6)+1=13, (−2)⁴=16, and (3−1)/(−1)=−2; the last denominator limit is nonzero."
    },
    {
      "id": "ch35",
      "type": "mcq",
      "group": "Challenge MCQ 35",
      "prompt": "If f→−3,g→4,h→0, find lim(5f−2g), lim fg, and lim√(g+5).",
      "choices": [
        "(−23,−12,3)",
        "(−7,−12,3)",
        "(23,12,9)",
        "(−23,12,3)"
      ],
      "answer": 0,
      "hint": "Apply each law to the limiting values.",
      "solution": "5(−3)−2(4)=−23; (−3)(4)=−12; √(4+5)=3. The separate quotient f/h cannot be evaluated by the quotient law because h→0."
    },
    {
      "id": "ch36",
      "type": "mcq",
      "group": "Challenge MCQ 36",
      "prompt": "If f→4,g→−2,h→0, what follows for \\(\\sqrt{f-g}\\) and \\((f+2g)/h\\)?",
      "choices": [
        "Both tend to 0.",
        "The first tends to √6; the quotient is always 1.",
        "Both have no finite limit.",
        "The first tends to √6; the quotient is not determined by these component limits."
      ],
      "answer": 3,
      "hint": "The numerator of the quotient also tends to zero.",
      "solution": "f−g→6>0 gives √6. The quotient has form 0/0; for example choose h=x, g=−2 and f=4+x to get 1, or f=4+|x| to get |x|/x and DNE."
    }
  ],
  "frqs": [
    {
      "id": "ap-frq1",
      "title": "A chain of limit laws",
      "group": "AP-style FRQ",
      "calculator": false,
      "context": "As \\(x\\to c\\), \\(f(x)\\to2,g(x)\\to-3,h(x)\\to4\\). Show the law and calculation for each conclusion.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Find \\(\\lim(3f-2g)\\) and \\(\\lim fg^2\\).",
          "rubric": "<ol><li>1 point: Use the finite component limits in the constant-multiple/difference laws to obtain 12.</li><li>1 point: Apply the power law to get g²→9.</li><li>1 point: Apply the product law to get fg²→18.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Find \\(\\lim\\sqrt{h+5}\\).",
          "rubric": "<ol><li>1 point: Use the sum law to obtain h+5→9.</li><li>1 point: Since the radicand limit is positive, h+5 is positive sufficiently near c.</li><li>1 point: Use continuity of the square root to obtain 3.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "Does the quotient law determine a finite limit for \\((f+h)/(g+3)\\)?",
          "rubric": "<ol><li>1 point: The numerator tends to 6.</li><li>1 point: The denominator tends to 0, so the quotient-law hypothesis fails.</li><li>1 point: No finite limit is possible if the quotient is defined on a punctured neighborhood: a finite quotient limit times g+3→0 would force f+h→0, contradicting 6. The one-sided signs need more information.</li></ol>"
        }
      ]
    },
    {
      "id": "ap-frq2",
      "title": "One-sided algebra",
      "group": "AP-style FRQ",
      "calculator": false,
      "context": "<div class=\"table-wrap\"><table><caption>Exact one-sided limits at x = 1</caption><thead><tr><th scope=\"col\">Function</th><th scope=\"col\">Left limit</th><th scope=\"col\">Right limit</th><th scope=\"col\">Value at 1</th></tr></thead><tbody><tr><td>f</td><td>2</td><td>−2</td><td>7</td></tr><tr><td>g</td><td>3</td><td>−3</td><td>4</td></tr></tbody></table></div>",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Find both one-sided limits of f+g and decide its two-sided limit.",
          "rubric": "<ol><li>1 point: Left sum: 2+3=5.</li><li>1 point: Right sum: −2−3=−5.</li><li>1 point: The side limits differ, so the two-sided limit is DNE.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Find \\(\\lim_{x\\to1}fg\\).",
          "rubric": "<ol><li>1 point: The left product tends to 6.</li><li>1 point: The right product also tends to 6.</li><li>1 point: Equal finite side limits establish the two-sided limit 6, even though the component two-sided limits fail.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "Find \\(\\lim_{x\\to1}f/g\\), and explain why f(1)/g(1) is irrelevant.",
          "rubric": "<ol><li>1 point: The side denominator limits 3 and −3 are nonzero.</li><li>1 point: Both side quotients tend to 2/3, so the two-sided quotient tends to 2/3.</li><li>1 point: The point-value ratio 7/4 does not describe nearby behavior.</li></ol>"
        }
      ]
    },
    {
      "id": "ap-frq3",
      "title": "Substitution and composition",
      "group": "AP-style FRQ",
      "calculator": false,
      "context": "Let \\(P(t)=t^3-4\\), \\(R(t)=(t^2+1)/(t-1)\\), and suppose \\(u(x)\\to2\\) as x → c.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Find \\(\\lim P(u(x))\\).",
          "rubric": "<ol><li>1 point: Identify the inner limit 2.</li><li>1 point: P is a polynomial, continuous at 2.</li><li>1 point: The limit is P(2)=4.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Find \\(\\lim R(u(x))\\).",
          "rubric": "<ol><li>1 point: The numerator tends to 5.</li><li>1 point: The denominator tends to 1≠0, so the quotient law applies.</li><li>1 point: The composite limit is R(2)=5.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "For a new outer function H, only H(2)=9 is known. Must \\(H(u(x))\\to9\\)? Explain and state a sufficient extra condition.",
          "rubric": "<ol><li>1 point: A point value alone does not specify nearby outer behavior.</li><li>1 point: H continuous at 2 is sufficient to conclude the limit is 9.</li><li>1 point: For a counterexample use u(x)=2+(x−c)² and H(t)=0 for t≠2, H(2)=9; the composite is 0 off c.</li></ol>"
        }
      ]
    },
    {
      "id": "ch-frq1",
      "title": "A polynomial, a floor function, and a quotient",
      "group": "Challenge FRQ",
      "calculator": false,
      "context": "As x→0, u(x)→2, v(x)→0 and w(x)→9. Let P(t)=t³−4 and J(t)=⌊t⌋. Assume u takes values strictly below and above 2 arbitrarily close to 0.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Find lim P(u(x)) and lim√w(x), justifying both composite steps.",
          "rubric": "<ol><li>1 point: P is continuous at 2, so P(u)→4.</li><li>1 point: w→9>0 guarantees positive w sufficiently near 0.</li><li>1 point: The square root is continuous at 9, so √w→3.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Determine lim J(u(x)). Then classify the cases when u is eventually below 2 or eventually at or above 2.",
          "rubric": "<ol><li>1 point: Near 2, inputs below 2 have floor 1 and inputs at or above 2 have floor 2.</li><li>1 point: The stated hypothesis produces values 1 and 2 arbitrarily close to 0, so no single limit exists.</li><li>1 point: Eventually below gives limit 1; eventually at or above gives limit 2.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "Explain why (u−2)/v is undetermined, and construct two pairs with different outcomes.",
          "rubric": "<ol><li>1 point: Both component limits in the quotient are 0, so the quotient law cannot decide.</li><li>1 point: u=2+x, v=x gives quotient 1 off 0 and has u values on both sides of 2.</li><li>1 point: u=2+x, v=|x| gives x/|x| with opposite one-sided limits; the same inner assumptions hold.</li></ol>"
        }
      ]
    },
    {
      "id": "ch-frq2",
      "title": "Estimate, then justify conditionally",
      "group": "Challenge FRQ",
      "calculator": false,
      "context": "<div class=\"table-wrap\"><table><caption>Original selected values near x = 1</caption><thead><tr><th scope=\"col\">x</th><th scope=\"col\">f(x)</th><th scope=\"col\">g(x)</th></tr></thead><tbody><tr><td>0.9</td><td>2.91</td><td>−1.05</td></tr><tr><td>0.99</td><td>2.991</td><td>−1.005</td></tr><tr><td>1.01</td><td>3.009</td><td>−0.995</td></tr><tr><td>1.1</td><td>3.09</td><td>−0.95</td></tr></tbody></table></div>",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Estimate lim f and lim g from the table.",
          "rubric": "<ol><li>1 point: Left-side f values suggest 3.</li><li>1 point: Right-side f values also suggest 3.</li><li>1 point: Both g trends suggest −1; these are estimates from finite data.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Using those estimates, estimate lim(f²+g)/(f−g) and identify the quotient condition.",
          "rubric": "<ol><li>1 point: The estimated numerator limit is 3²−1=8.</li><li>1 point: The estimated denominator limit is 3−(−1)=4, nonzero.</li><li>1 point: The resulting estimated quotient limit is 2.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "Does the finite table prove that limit? State assumptions that would make the result exact.",
          "rubric": "<ol><li>1 point: A finite table cannot establish all sufficiently nearby behavior.</li><li>1 point: If the exact component limits are known to be 3 and −1, the power/sum/difference laws establish 8 and 4.</li><li>1 point: The quotient law then proves the exact result 2 because the denominator limit is 4≠0.</li></ol>"
        }
      ]
    },
    {
      "id": "ch-frq3",
      "title": "Eight graph-reading decisions",
      "group": "Challenge FRQ",
      "calculator": false,
      "context": "<div class=\"table-wrap\"><table><caption>Exact readings retained from the original graph panels</caption><thead><tr><th scope=\"col\">Problem</th><th scope=\"col\">Given nearby behavior</th></tr></thead><tbody><tr><td>1</td><td>At x=−1: f→2, g→−3.</td></tr><tr><td>2</td><td>At x=0: f→3, h→3.</td></tr><tr><td>3</td><td>As x→−2, h→0; f is continuous at 0 with f(0)=3.</td></tr><tr><td>4</td><td>As x→1, f→4 through positive values.</td></tr><tr><td>5</td><td>As u→3⁺, h(u)→4.</td></tr><tr><td>6</td><td>As x→−5⁺, g→5 and h→5.</td></tr><tr><td>7</td><td>At u=−3, the left/right limits of g are 2,−1.</td></tr><tr><td>8</td><td>f is continuous at u=1 with f(1)=4.</td></tr></tbody></table></div>Use these exact facts. Continuity is explicitly supplied where the original composite needed an outer hypothesis.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Evaluate (1) \\(\\lim_{x\\to-1}\\)(f+g), (2) \\(\\lim_{x\\to0}\\)fh, and (3) \\(\\lim_{x\\to-2}\\)f(h(x)).",
          "rubric": "<ol><li>1 point: (1) The sum is 2−3=−1.</li><li>1 point: (2) The product is 3·3=9.</li><li>1 point: (3) h→0 and f is continuous at 0, giving 3.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Evaluate (4) \\(\\lim_{x\\to1}\\)√f, (5) \\(\\lim_{x\\to0}\\)h(|x|+3), and (6) \\(\\lim_{x\\to-5^+}\\)g/h.",
          "rubric": "<ol><li>1 point: (4) Positive radicands and f→4 give 2.</li><li>1 point: (5) For x≠0, |x|+3 approaches 3 strictly from above, giving 4.</li><li>1 point: (6) The one-sided denominator tends to 5≠0, so the quotient tends to 1.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "Evaluate (7) \\(\\lim_{x\\to-5}\\)g(x+2) and (8) \\(\\lim_{x\\to-2}\\)f(√(x+3)). Record the inner inputs.",
          "rubric": "<ol><li>1 point: (7) x+2 approaches −3 from the corresponding sides; the outer side limits 2 and −1 differ, so DNE.</li><li>1 point: (8) √(x+3) approaches 1 through a valid local real domain.</li><li>1 point: Continuity of f at 1 makes the eighth limit 4.</li></ol>"
        }
      ]
    },
    {
      "id": "ch-frq4",
      "title": "Holes, point values, and combined limits",
      "group": "Challenge FRQ",
      "calculator": false,
      "context": "<div class=\"graph-pair\"><div data-laws-plot=\"holeF\"></div><div data-laws-plot=\"holeG\"></div></div>At x=1, f has two-sided limit 3 and f(1)=−1; g has two-sided limit 1 and g(1)=4. The graphs show the exact stated behavior.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Find lim(f+g) and lim(f−2g).",
          "rubric": "<ol><li>1 point: Apply the sum law to get 3+1=4.</li><li>1 point: Apply constant multiples/difference to get 3−2(1)=1.</li><li>1 point: Use the limits 3 and 1 rather than the separate point assignments.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Find lim fg and lim f/g.",
          "rubric": "<ol><li>1 point: The product tends to 3·1=3.</li><li>1 point: The denominator limit is 1≠0.</li><li>1 point: The quotient tends to 3/1=3.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "Compare lim(f+g) with f(1)+g(1). Explain the difference.",
          "rubric": "<ol><li>1 point: The sum limit is 4.</li><li>1 point: The sum of point values is −1+4=3.</li><li>1 point: A limit describes nearby values; isolated assignments can differ from those limits.</li></ol>"
        }
      ]
    },
    {
      "id": "ch-frq5",
      "title": "A jump can disappear in a product",
      "group": "Challenge FRQ",
      "calculator": false,
      "context": "<div class=\"graph-pair\"><div data-laws-plot=\"jumpF\"></div><div data-laws-plot=\"zeroG\"></div></div>At x=2, f has left/right limits 4,−1, while g has limit 0 and g(2)=3.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Determine lim(f+g).",
          "rubric": "<ol><li>1 point: The left sum tends to 4+0=4.</li><li>1 point: The right sum tends to −1+0=−1.</li><li>1 point: Unequal one-sided limits imply DNE.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Determine lim fg without invoking a nonexistent two-sided limit for f.",
          "rubric": "<ol><li>1 point: The left product tends to 4·0=0.</li><li>1 point: The right product tends to −1·0=0.</li><li>1 point: Both are 0, so the two-sided product limit exists and equals 0.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "Determine lim g/f and justify the method.",
          "rubric": "<ol><li>1 point: On the left the denominator limit is 4≠0, giving 0/4=0.</li><li>1 point: On the right it is −1≠0, giving 0/(−1)=0.</li><li>1 point: Equal one-sided quotient limits establish 0; a direct two-sided component quotient law is unavailable because f has no two-sided limit.</li></ol>"
        }
      ]
    },
    {
      "id": "ch-frq6",
      "title": "A second pair of graphs",
      "group": "Challenge FRQ",
      "calculator": false,
      "context": "<div class=\"graph-pair\"><div data-laws-plot=\"originalF\"></div><div data-laws-plot=\"originalG\"></div></div>The original graph readings are retained: f→1 at −2, f→3 at 1, and f→4 at 2. At −2, g→−1; at 1 its side limits are 1,−1; at 2, g→0; at 4, g→2. The outer f is continuous at 2.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Find \\(\\lim_{x\\to-2}\\)[f(x)+4g(x)].",
          "rubric": "<ol><li>1 point: Read f→1.</li><li>1 point: Read g→−1.</li><li>1 point: The linear-combination limit is 1+4(−1)=−3.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Find \\(\\lim_{x\\to1}\\)fg and \\(\\lim_{x\\to2}\\)g/f.",
          "rubric": "<ol><li>1 point: At 1 the product side limits are 3 and −3.</li><li>1 point: Therefore the product has no two-sided limit at 1.</li><li>1 point: At 2 the quotient tends to 0/4=0, with nonzero denominator limit.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "Find \\(\\lim_{x\\to4}\\)[f(g(x))]².",
          "rubric": "<ol><li>1 point: The inner g tends to 2.</li><li>1 point: Continuity of f at 2 gives f(g)→4.</li><li>1 point: The power law gives 4²=16.</li></ol>"
        }
      ]
    },
    {
      "id": "ch-frq7",
      "title": "Four nested expressions",
      "group": "Challenge FRQ",
      "calculator": false,
      "context": "As x→c, f→3, g→−2, h→4. Evaluate each expression and state its decisive law or domain condition.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Find lim√(3h−2g).",
          "rubric": "<ol><li>1 point: The radicand tends to 12+4=16.</li><li>1 point: It is positive sufficiently near c.</li><li>1 point: The square-root limit is 4.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Find lim[f·5g] and lim(7−g)².",
          "rubric": "<ol><li>1 point: The product limit is 3·5(−2)=−30.</li><li>1 point: The inner difference 7−g tends to 9.</li><li>1 point: The power law gives 81.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "Find lim(2f+3h)/(h−g).",
          "rubric": "<ol><li>1 point: The numerator tends to 6+12=18.</li><li>1 point: The denominator tends to 4+2=6≠0.</li><li>1 point: The quotient limit is 3.</li></ol>"
        }
      ]
    },
    {
      "id": "ch-frq8",
      "title": "Six expressions, complete conditions",
      "group": "Challenge FRQ",
      "calculator": false,
      "context": "As x→c, f→4 and g→−3. Name the relevant limit laws and check every root or quotient condition.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Evaluate (i) lim(2f−3)³ and (ii) lim[(3f)(2g)].",
          "rubric": "<ol><li>1 point: The inner expression in (i) tends to 5.</li><li>1 point: Its cube tends to 125.</li><li>1 point: The product in (ii) tends to (12)(−6)=−72.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Evaluate (iii) lim√(2f−4g) and (iv) lim(5f+2g)/(g−f).",
          "rubric": "<ol><li>1 point: In (iii) the radicand tends to 20>0, so the limit is √20=2√5.</li><li>1 point: In (iv) the numerator tends to 14 and denominator to −7≠0.</li><li>1 point: The quotient limit is −2.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "Evaluate (v) lim[f(g+5)] and (vi) lim 7f²/(1−g).",
          "rubric": "<ol><li>1 point: In (v) the product limit is 4(−3+5)=8.</li><li>1 point: In (vi) the numerator tends to 7·16=112 and denominator to 4≠0.</li><li>1 point: The quotient limit is 28.</li></ol>"
        }
      ]
    },
    {
      "id": "ch-frq9",
      "title": "A table does not supply outer continuity",
      "group": "Challenge FRQ",
      "calculator": false,
      "context": "<div class=\"table-wrap\"><table><caption>Point values and independent component limits</caption><thead><tr><th scope=\"col\">Function</th><th scope=\"col\">Value at −2</th><th scope=\"col\">Value at 3</th><th scope=\"col\">Value at 6</th><th scope=\"col\">Limit as x→c</th></tr></thead><tbody><tr><td>f</td><td>5</td><td>0</td><td>1</td><td>6</td></tr><tr><td>g</td><td>-3</td><td>-2</td><td>-4</td><td>-2</td></tr><tr><td>h</td><td>4</td><td>2</td><td>3</td><td>3</td></tr></tbody></table></div>For each part, decide what the table alone establishes; then compute the conditional value under the stated sufficient continuity assumptions.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Audit lim f(g(x)). Then assume f is continuous at −2.",
          "rubric": "<ol><li>1 point: The inner limit is −2.</li><li>1 point: The point value f(−2)=5 alone does not determine nearby outer behavior.</li><li>1 point: Under continuity at −2, the limit is 5.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Audit lim g(h(x)). Then assume g is continuous at 3.",
          "rubric": "<ol><li>1 point: The inner limit is 3.</li><li>1 point: The point value g(3)=−2 alone is insufficient.</li><li>1 point: Under continuity at 3, the limit is −2.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "Audit lim g(f(x))/h(g(x)). Then assume g is continuous at 6 and h is continuous at −2.",
          "rubric": "<ol><li>1 point: The inner limiting inputs are 6 for g and −2 for h; the original table alone is insufficient.</li><li>1 point: With those continuity assumptions, the numerator tends to g(6)=−4 and the denominator to h(−2)=4≠0.</li><li>1 point: The quotient limit is −1.</li></ol>"
        }
      ]
    },
    {
      "id": "ch-frq10",
      "title": "Counterexamples and reverse reasoning",
      "group": "Challenge FRQ",
      "calculator": false,
      "context": "Use explicit functions on punctured neighborhoods of the target. A failed hypothesis makes a theorem inconclusive; it does not automatically make the desired limit fail.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Construct three pairs f,g→0 at 0 for which f/g tends to 0, tends to 1, and has no two-sided limit.",
          "rubric": "<ol><li>1 point: For 0 use f=x², g=x: both tend to 0 and f/g=x→0.</li><li>1 point: For 1 use f=g=x: the quotient is 1 off 0.</li><li>1 point: For DNE use f=|x|, g=x: both tend to 0 but the quotient has side limits −1 and 1.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Suppose f→2 and g has no finite limit. Prove that f+g cannot have a finite limit.",
          "rubric": "<ol><li>1 point: Assume for contradiction that f+g→S for a finite S.</li><li>1 point: The exact identity g=(f+g)−f and the difference law give g→S−2.</li><li>1 point: This contradicts the hypothesis about g, so no finite sum limit exists.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "Give a product whose limit exists even though both factors lack limits, and explain why this does not reverse the product theorem.",
          "rubric": "<ol><li>1 point: Use f=g=sgn(x) off 0.</li><li>1 point: Each factor has one-sided limits −1 and 1, but fg≡1 and hence fg→1.</li><li>1 point: The forward product theorem requires finite component limits; it does not claim those hypotheses are necessary.</li></ol>"
        }
      ]
    },
    {
      "id": "ch-frq11",
      "title": "Repair the real-root theorem",
      "group": "Challenge FRQ",
      "calculator": false,
      "context": "Let f(x)→L and let n be a positive integer. Discuss limits on the actual real domain of the expression; distinguish this from being defined on a full punctured neighborhood.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "State and justify the root conclusion for odd n.",
          "rubric": "<ol><li>1 point: The real nth-root function exists for every real input when n is odd.</li><li>1 point: It is continuous at every real L.</li><li>1 point: Thus the root tends to the real nth root of L, including negative L.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "For even n, treat L>0 and L=0. Give a sufficient condition for a full punctured-neighborhood statement at L=0.",
          "rubric": "<ol><li>1 point: If L>0, sufficiently nearby f values are positive, so the composite tends to the positive nth root of L.</li><li>1 point: If L=0, along its admissible domain f≥0 the root tends to 0, provided the target is an accumulation point of that domain.</li><li>1 point: Requiring f to be defined and nonnegative throughout a punctured neighborhood makes the full-neighborhood statement valid.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "Explain the obstruction when n is even and L<0. Contrast √(x²) and √x as x→0.",
          "rubric": "<ol><li>1 point: If L<0, f is strictly negative sufficiently near the target, so there are no real root values there and no domain accumulation at that target.</li><li>1 point: √(x²)=|x| is defined on both sides of 0 and tends to 0.</li><li>1 point: √x is defined only for x≥0 and has right-hand limit 0; one must not claim it is defined on a full punctured neighborhood of 0.</li></ol>"
        }
      ]
    },
    {
      "id": "ch-frq12",
      "title": "Directional composition and hitting the target",
      "group": "Challenge FRQ",
      "calculator": false,
      "context": "Let F(t)=0 for t<0 and F(t)=1 for t≥0. For a separate outer H, suppose H has one-sided limits 2 and −2 at input 1, with H(1)=5.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Construct two inner functions approaching 0 that make F(g(x)) approach different values.",
          "rubric": "<ol><li>1 point: Use g₁(x)=(x−c)², which is positive off c and tends to 0.</li><li>1 point: Use g₂(x)=−(x−c)², which is negative off c and tends to 0.</li><li>1 point: The resulting limits are 1 and 0 respectively.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "If g(x)=1+(x−2)², find \\(\\lim_{x\\to2}\\)H(g(x)). Why is continuity of H unnecessary here?",
          "rubric": "<ol><li>1 point: For x≠2, g(x)>1 and g→1 strictly from the right.</li><li>1 point: The given right-hand outer limit is −2, so the composite tends to −2.</li><li>1 point: Only the matching right-hand behavior is used; the left limit and H(1) do not enter because g avoids 1 off the target.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "If g merely tends to 1 and equals 1 along points arbitrarily close to c, can the preceding conclusion still be guaranteed? State a sufficient repair.",
          "rubric": "<ol><li>1 point: No: those points give H(g)=H(1)=5, which prevents convergence to −2.</li><li>1 point: Require g>1 throughout a sufficiently small punctured neighborhood to reuse the right-hand limit, or require compatible outer value when hits occur.</li><li>1 point: More generally, match every inner approach or attained target value with the same outer limiting result.</li></ol>"
        }
      ]
    },
    {
      "id": "ch-frq13",
      "title": "Proof extension: linear laws and a safe denominator",
      "group": "Challenge FRQ",
      "calculator": false,
      "context": "Optional proof extension beyond the required AP Topic 1.5 treatment. Assume the ε–δ definition of finite limits and basic inequalities.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Prove f→L implies kf→kL for real k.",
          "rubric": "<ol><li>1 point: For k=0 the statement is immediate because kf=0.</li><li>1 point: For k≠0 and ε>0, choose δ so 0<|x−c|<δ implies |f−L|<ε/|k|.</li><li>1 point: Then \\(|kf-kL|=|k||f-L|<\\varepsilon\\).</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Prove f→A and g→B imply f+g→A+B.",
          "rubric": "<ol><li>1 point: Choose δ₁ for |f−A|<ε/2 and δ₂ for |g−B|<ε/2.</li><li>1 point: Take δ=min(δ₁,δ₂) so both estimates hold.</li><li>1 point: The triangle inequality gives \\(|(f+g)-(A+B)|\\le|f-A|+|g-B|<\\varepsilon\\).</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "If g→B≠0, prove g is bounded away from zero sufficiently near c.",
          "rubric": "<ol><li>1 point: Use convergence with tolerance |B|/2.</li><li>1 point: Then |g−B|<|B|/2 on a sufficiently small punctured neighborhood.</li><li>1 point: The reverse triangle inequality gives |g|≥|B|−|g−B|>|B|/2>0.</li></ol>"
        }
      ]
    },
    {
      "id": "ch-frq14",
      "title": "Proof extension: bounded factors and absolute values",
      "group": "Challenge FRQ",
      "calculator": false,
      "context": "Optional proof extension. Assume f→A and g→B. For the last example, the squeezing implication may be used as a Topic 1.8 connection.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Find a local bound for |f| and use it to prove the product law.",
          "rubric": "<ol><li>1 point: From |f−A|<1 obtain |f|<|A|+1 near c.</li><li>1 point: Use \\(|fg-AB|\\le |f||g-B|+|B||f-A|\\).</li><li>1 point: Given ε>0, choose a common δ ensuring the bound and |g−B|<ε/[2(|A|+1)], |f−A|<ε/[2(|B|+1)]. The displayed error is then <ε.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Prove |f|→|A|.",
          "rubric": "<ol><li>1 point: Use the reverse triangle inequality ||f|−|A||≤|f−A|.</li><li>1 point: For any ε>0, choose δ making |f−A|<ε.</li><li>1 point: The same δ controls the absolute-value error, proving the conclusion.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "Construct bounded f without a limit and g→0 with fg→0, then verify the claims.",
          "rubric": "<ol><li>1 point: Let f(x)=sin(1/x), g(x)=x for x≠0. Along x=1/(π/2+2πn) and x=1/(3π/2+2πn), f takes values 1 and −1, so it has no limit.</li><li>1 point: f is bounded by 1 in absolute value and g→0.</li><li>1 point: Because \\(|fg|\\le|x|\\to0\\), squeezing gives fg→0; this uses a separate argument, not the two-sided product law with a nonexistent component limit.</li></ol>"
        }
      ]
    },
    {
      "id": "ch-frq15",
      "title": "Proof extension: uniqueness and theorem chains",
      "group": "Challenge FRQ",
      "calculator": false,
      "context": "Optional proof extension. Use the precise definition where requested and state each theorem hypothesis.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Prove two finite limits L and M of the same function at c must be equal. Also give the difference-law interpretation.",
          "rubric": "<ol><li>1 point: If L≠M, take \\(\\varepsilon=|L-M|/3\\) and choose a common punctured neighborhood where both output estimates hold.</li><li>1 point: Choose an admissible x there. Then |L−M|≤|L−f(x)|+|f(x)−M|<2|L−M|/3, a contradiction. The target is assumed to be a domain accumulation point.</li><li>1 point: Thus L=M. Once limit laws are available, the identity f−f≡0 is consistent with 0=L−M.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Justify the limit of a finite product of n functions with known finite limits.",
          "rubric": "<ol><li>1 point: For n=1 the result is immediate.</li><li>1 point: Assume the product of the first n−1 factors tends to their finite product.</li><li>1 point: Apply the two-factor product law to that product and the nth factor, obtaining the product of all n limits.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "If f→A, g→B≠0, and F is continuous at A/B, prove F(f/g)→F(A/B).",
          "rubric": "<ol><li>1 point: The nonzero limit B makes g nonzero sufficiently near c.</li><li>1 point: The quotient law gives f/g→A/B.</li><li>1 point: Continuity of F at the inner landing value A/B gives the stated composite limit.</li></ol>"
        }
      ]
    }
  ],
  "preservedSources": {
    "1.5-F1": "ap-frq1",
    "1.5-F2": "ch-frq1",
    "t15-e2": "ch-frq1",
    "1.5-AAP-01": "ch31",
    "1.5-AAP-02": "ch-frq2",
    "1.5-AAP-17": "ch-frq2",
    "1.5-AAP-03": "ch-frq3",
    "1.5-AAP-07": "ch-frq3",
    "1.5-AAP-04": "ch-frq4",
    "1.5-AAP-05": "ch-frq5",
    "1.5-AAP-06": "ch-frq6",
    "1.5-AAP-08": "ch27",
    "1.5-AAP-09": "ch28",
    "1.5-AAP-10": "ch29",
    "1.5-AAP-11": "ch30",
    "1.5-AAP-14": "ch-frq7",
    "1.5-AAP-15": "ch-frq8",
    "1.5-AAP-16": "ch33",
    "1.5-AAP-18": "ch34",
    "1.5-AAP-19": "ch-frq9",
    "1.5-AAP-20": [
      "ch-frq10",
      "ch-frq11",
      "ch-frq12"
    ],
    "1.5-TLE-01": [
      "ch-frq10",
      "ch-frq11",
      "ch-frq12"
    ],
    "1.5-CH-01": "ch-frq10",
    "hard-15-counterexamples": "ch-frq10",
    "t15-e1": "ch-frq10",
    "1.5-ENR-03": "ch-frq10",
    "1.5-ENR-04": "ch26",
    "1.5-ENR-05": "ap-frq1",
    "1.5-ENR-06": "ch-frq12",
    "1.5-TLE-02": [
      "ap-frq3",
      "ch-frq12",
      "ch-frq15"
    ],
    "graph15-beyond-directional-composition": "ch-frq12",
    "1.5-ENR-07": "ch-frq11",
    "1.5-q-121": "ch01",
    "1.5-q-122": "ch02",
    "1.5-q-123": "ch-frq14",
    "1.5-q-124": "ch03",
    "1.5-q-125": "ch04",
    "1.5-q-126": "ch-frq12",
    "1.5-q-127": "ch05",
    "1.5-q-128": "ch06",
    "1.5-q-129": "ch07",
    "1.5-q-130": "ch08",
    "1.5-q-131": "ch-frq10",
    "1.5-q-132": "ch09",
    "1.5-q-133": "ch10",
    "1.5-q-134": "ch11",
    "1.5-q-135": "ch36",
    "1.5-q-136": "ch-frq15",
    "1.5-q-137": "ch12",
    "1.5-q-138": "ch13",
    "1.5-q-139": "ch14",
    "1.5-q-140": "ch-frq13",
    "1.5-q-141": "ch-frq13",
    "1.5-q-142": "ch-frq14",
    "1.5-q-143": "ch-frq13",
    "1.5-q-144": "ch15",
    "1.5-q-145": "ch16",
    "1.5-q-146": "ch17",
    "1.5-q-147": "ch18",
    "1.5-q-148": "ch19",
    "1.5-q-149": "ch20",
    "1.5-q-150": "ch-frq14",
    "1.5-q-151": "ch21",
    "1.5-q-152": "ch-frq14",
    "1.5-q-153": "ch-frq15",
    "1.5-q-154": "ch-frq15",
    "hard-15-reverse-sum": "ch22",
    "1.6-AAP-10-direct-relocated": "ch23",
    "1.6-AAP-11-direct-relocated": "ch24",
    "hard-15-uniqueness": "ch-frq15",
    "workbook-15-frq": "ch35",
    "graph15-ch-product-without-components": "ch32",
    "graph15-ch-reverse-law": "ch25"
  }
};if(typeof module!=="undefined"&&module.exports)module.exports=data;else root.LimitLessonQuestions=data;})(typeof window!=="undefined"?window:globalThis);
