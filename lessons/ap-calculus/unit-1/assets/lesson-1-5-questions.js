/* Original ECHS AP Topic 1.5 practice and relevant AP-level challenges. */
(function(root){const data={
  "questions": [
    {
      "id": "launch",
      "type": "mcq",
      "group": "Opening prediction",
      "prompt": "Given \\(\\lim_{x\\to1}f(x)=2\\) and \\(\\lim_{x\\to1}g(x)=3\\), find \\(\\lim_{x\\to1}[f(x)+g(x)]\\).",
      "choices": [
        "6",
        "5",
        "The sum of the point values at 1.",
        "Cannot be determined."
      ],
      "answer": 1,
      "hint": "Use the two finite limits at the same target.",
      "solution": "The sum law gives \\(\\lim_{x\\to1}[f(x)+g(x)]=2+3=5\\). The values at 1 are not needed."
    },
    {
      "id": "law-check",
      "type": "number",
      "group": "Guided check",
      "prompt": "Let \\(\\lim_{x\\to2}f(x)=2\\), \\(\\lim_{x\\to2}g(x)=-3\\), and \\(\\lim_{x\\to2}h(x)=4\\). Find \\(\\lim_{x\\to2}[3f(x)-2g(x)]\\).",
      "answer": 12,
      "unit": "exact value",
      "hint": "Keep the minus sign when substituting the negative limit.",
      "solution": "\\(\\lim_{x\\to2}[3f(x)-2g(x)]=3(2)-2(-3)=12\\) by the constant-multiple and difference laws."
    },
    {
      "id": "root-check",
      "type": "number",
      "group": "Guided check",
      "prompt": "Let \\(\\lim_{x\\to2}f(x)=2\\), \\(\\lim_{x\\to2}g(x)=-3\\), and \\(\\lim_{x\\to2}h(x)=4\\). Find \\(\\lim_{x\\to2}\\sqrt{h(x)+5}\\).",
      "answer": 3,
      "unit": "exact value",
      "hint": "Determine the limiting radicand before taking the root.",
      "solution": "The sum law gives \\(\\lim_{x\\to2}[h(x)+5]=9\\). The radicand is positive near 2, so \\(\\lim_{x\\to2}\\sqrt{h(x)+5}=\\sqrt9=3\\)."
    },
    {
      "id": "quotient-check",
      "type": "mcq",
      "group": "Quotient check",
      "prompt": "Given \\(\\lim_{x\\to0}f(x)=0\\) and \\(\\lim_{x\\to0}g(x)=0\\), with \\(g(x)\\ne0\\) for all sufficiently small nonzero \\(x\\), what does the quotient law establish about \\(\\lim_{x\\to0}\\frac{f(x)}{g(x)}\\)?",
      "choices": [
        "The limit is 0.",
        "The limit is 1.",
        "The limit does not exist.",
        "The quotient law is inconclusive."
      ],
      "answer": 3,
      "hint": "Check the limiting denominator.",
      "solution": "The quotient law requires a nonzero denominator limit. For example, \\(f(x)=g(x)=x\\) gives limit 1, whereas \\(f(x)=x^2\\), \\(g(x)=x\\) gives limit 0. Thus the stated component limits alone do not decide the quotient limit."
    },
    {
      "id": "compose-check",
      "type": "number",
      "group": "Guided check",
      "prompt": "Given \\(\\lim_{x\\to2}g(x)=4\\) and \\(F(u)=u^2+1\\), find \\(\\lim_{x\\to2}F(g(x))\\).",
      "answer": 17,
      "unit": "exact value",
      "hint": "Use 4 as the outer input.",
      "solution": "Because the polynomial F is continuous at 4, \\(\\lim_{x\\to2}F(g(x))=F(4)=4^2+1=17\\)."
    },
    {
      "id": "exit",
      "type": "mcq",
      "group": "AP exit check",
      "prompt": "Which condition justifies \\(\\lim_{x\\to c}\\frac{P(x)}{Q(x)}=\\frac{P(c)}{Q(c)}\\)?",
      "choices": [
        "P and Q are polynomials and Q(c) ≠ 0.",
        "P(c) = 0 is the only condition.",
        "The graph looks smooth at one nearby input.",
        "The quotient is defined at one nearby input."
      ],
      "answer": 0,
      "hint": "The quotient law has a nonzero-denominator condition.",
      "solution": "Polynomial laws give \\(\\lim_{x\\to c}P(x)=P(c)\\) and \\(\\lim_{x\\to c}Q(x)=Q(c)\\). The quotient law then applies if \\(Q(c)\\ne0\\)."
    },
    {
      "id": "ap01",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Let \\(\\lim_{x\\to2}f(x)=2\\), \\(\\lim_{x\\to2}g(x)=-3\\), and \\(\\lim_{x\\to2}h(x)=4\\). Find \\(\\lim_{x\\to2}[3f(x)-2g(x)]\\).",
      "choices": [
        "0",
        "−12",
        "12",
        "−3"
      ],
      "answer": 2,
      "hint": "Apply the constant-multiple and difference laws.",
      "solution": "\\(\\lim_{x\\to2}[3f(x)-2g(x)]=3(2)-2(-3)=12\\)."
    },
    {
      "id": "ap02",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Let \\(\\lim_{x\\to2}f(x)=2\\), \\(\\lim_{x\\to2}g(x)=-3\\), and \\(\\lim_{x\\to2}h(x)=4\\). Find \\(\\lim_{x\\to2}f(x)[g(x)]^2\\).",
      "choices": [
        "18",
        "−18",
        "36",
        "−6"
      ],
      "answer": 0,
      "hint": "Square the limiting value of g before multiplying.",
      "solution": "By the power and product laws, \\(\\lim_{x\\to2}f(x)[g(x)]^2=2(-3)^2=18\\)."
    },
    {
      "id": "ap03",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Let \\(\\lim_{x\\to2}f(x)=2\\), \\(\\lim_{x\\to2}g(x)=-3\\), and \\(\\lim_{x\\to2}h(x)=4\\). Find \\(\\lim_{x\\to2}\\frac{f(x)}{g(x)}\\).",
      "choices": [
        "−3/2",
        "2/3",
        "0",
        "−2/3"
      ],
      "answer": 3,
      "hint": "The denominator limit is nonzero.",
      "solution": "\\(\\lim_{x\\to2}\\frac{f(x)}{g(x)}=\\frac2{-3}=-\\frac23\\), since −3 is nonzero."
    },
    {
      "id": "ap04",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Let \\(\\lim_{x\\to2}f(x)=2\\), \\(\\lim_{x\\to2}g(x)=-3\\), and \\(\\lim_{x\\to2}h(x)=4\\). Find \\(\\lim_{x\\to2}\\sqrt{h(x)+5}\\).",
      "choices": [
        "9",
        "3",
        "7",
        "Cannot be determined."
      ],
      "answer": 1,
      "hint": "Use the sum law, then the square-root property.",
      "solution": "\\(\\lim_{x\\to2}[h(x)+5]=4+5=9>0\\), so \\(\\lim_{x\\to2}\\sqrt{h(x)+5}=3\\)."
    },
    {
      "id": "ap05",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Let \\(\\lim_{x\\to2}f(x)=2\\), \\(\\lim_{x\\to2}g(x)=-3\\), and \\(\\lim_{x\\to2}h(x)=4\\). Find \\(\\lim_{x\\to2}[g(x)]^3\\).",
      "choices": [
        "27",
        "−9",
        "−27",
        "9"
      ],
      "answer": 2,
      "hint": "An odd power preserves the sign.",
      "solution": "By the power law, \\(\\lim_{x\\to2}[g(x)]^3=(-3)^3=-27\\)."
    },
    {
      "id": "ap06",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "If \\(\\lim_{x\\to-1}p(x)=-8\\), find \\(\\lim_{x\\to-1}\\sqrt[3]{p(x)}\\).",
      "choices": [
        "2",
        "−4",
        "There is no real limit.",
        "−2"
      ],
      "answer": 3,
      "hint": "A real cube root accepts negative inputs.",
      "solution": "The cube-root function is continuous at −8, so \\(\\lim_{x\\to-1}\\sqrt[3]{p(x)}=\\sqrt[3]{-8}=-2\\)."
    },
    {
      "id": "ap07",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Let \\(\\lim_{x\\to2}f(x)=2\\), \\(\\lim_{x\\to2}g(x)=-3\\), and \\(\\lim_{x\\to2}h(x)=4\\). Which denominator prevents direct use of the quotient law to evaluate the corresponding limit as \\(x\\to2\\)?",
      "choices": [
        "\\(g(x)+3\\)",
        "\\(g(x)-3\\)",
        "\\(h(x)+1\\)",
        "\\(f(x)+1\\)"
      ],
      "answer": 0,
      "hint": "Compute each denominator limit at 2.",
      "solution": "\\(\\lim_{x\\to2}[g(x)+3]=0\\). The other denominator limits are −6, 5, and 3, which are nonzero."
    },
    {
      "id": "ap08",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Evaluate \\(\\lim_{x\\to-2}(x^3-3x+1)\\).",
      "choices": [
        "−13",
        "−1",
        "1",
        "3"
      ],
      "answer": 1,
      "hint": "A polynomial limit is its value at the target.",
      "solution": "\\(\\lim_{x\\to-2}(x^3-3x+1)=(-2)^3-3(-2)+1=-8+6+1=-1\\)."
    },
    {
      "id": "ap09",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Evaluate \\(\\lim_{x\\to2}\\frac{x^2+1}{x+1}\\).",
      "choices": [
        "1",
        "3",
        "5",
        "5/3"
      ],
      "answer": 3,
      "hint": "Verify the denominator at 2 before dividing.",
      "solution": "The numerator tends to 5 and denominator to 3. Thus \\(\\lim_{x\\to2}\\frac{x^2+1}{x+1}=\\frac53\\)."
    },
    {
      "id": "ap10",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Let \\(\\lim_{x\\to5}g(x)=-3\\) and \\(F(u)=u^2+1\\). Find \\(\\lim_{x\\to5}F(g(x))\\).",
      "choices": [
        "−8",
        "26",
        "10",
        "Cannot be determined without g(5)."
      ],
      "answer": 2,
      "hint": "The outer input tends to −3, not 5.",
      "solution": "F is continuous at −3, so \\(\\lim_{x\\to5}F(g(x))=F(-3)=(-3)^2+1=10\\)."
    },
    {
      "id": "ap11",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Let \\(\\lim_{x\\to1}f(x)=3\\), \\(\\lim_{x\\to1}g(x)=-1\\), \\(f(1)=8\\), and \\(g(1)=2\\). Find \\(\\lim_{x\\to1}[2f(x)-g(x)]\\).",
      "choices": [
        "14",
        "7",
        "5",
        "DNE"
      ],
      "answer": 1,
      "hint": "Use nearby limits, not the assigned point values.",
      "solution": "\\(\\lim_{x\\to1}[2f(x)-g(x)]=2(3)-(-1)=7\\). The assigned values determine the expression at 1, which is 14."
    },
    {
      "id": "ap12",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "<div class=\"table-wrap\"><table><caption>Exact one-sided limits at x = 1; these are not sampled point values</caption><thead><tr><th scope=\"col\">Approach</th><th scope=\"col\">Limit of \\(f(x)\\)</th><th scope=\"col\">Limit of \\(g(x)\\)</th></tr></thead><tbody><tr><td>\\(x\\to1^-\\)</td><td>2</td><td>3</td></tr><tr><td>\\(x\\to1^+\\)</td><td>−2</td><td>−3</td></tr></tbody></table></div>Find \\(\\lim_{x\\to1}[f(x)+g(x)]\\).",
      "choices": [
        "DNE",
        "0",
        "5",
        "−5"
      ],
      "answer": 0,
      "hint": "Apply the sum law separately on each side.",
      "solution": "\\(\\lim_{x\\to1^-}[f(x)+g(x)]=2+3=5\\), but \\(\\lim_{x\\to1^+}[f(x)+g(x)]=-2-3=-5\\). The unequal side limits imply that the two-sided limit does not exist."
    },
    {
      "id": "ap13",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "<div class=\"table-wrap\"><table><caption>Exact one-sided limits at x = 1; these are not sampled point values</caption><thead><tr><th scope=\"col\">Approach</th><th scope=\"col\">Limit of \\(f(x)\\)</th><th scope=\"col\">Limit of \\(g(x)\\)</th></tr></thead><tbody><tr><td>\\(x\\to1^-\\)</td><td>2</td><td>3</td></tr><tr><td>\\(x\\to1^+\\)</td><td>−2</td><td>−3</td></tr></tbody></table></div>Find \\(\\lim_{x\\to1}f(x)g(x)\\).",
      "choices": [
        "−6",
        "DNE",
        "6",
        "0"
      ],
      "answer": 2,
      "hint": "A product may have matching side limits even if its factors jump.",
      "solution": "\\(\\lim_{x\\to1^-}f(x)g(x)=2(3)=6\\) and \\(\\lim_{x\\to1^+}f(x)g(x)=(-2)(-3)=6\\). Hence \\(\\lim_{x\\to1}f(x)g(x)=6\\)."
    },
    {
      "id": "ap14",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "If \\(\\lim_{x\\to3}f(x)=-2\\), find \\(\\lim_{x\\to3}\\sqrt{[f(x)]^2}\\).",
      "choices": [
        "2",
        "−2",
        "4",
        "DNE"
      ],
      "answer": 0,
      "hint": "The square root symbol means the nonnegative root.",
      "solution": "\\(\\lim_{x\\to3}[f(x)]^2=4\\). Taking its square root gives \\(\\lim_{x\\to3}\\sqrt{[f(x)]^2}=2\\). Equivalently, the expression is \\(|f(x)|\\)."
    },
    {
      "id": "ap15",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "The graph shows the inner function \\(g\\) near \\(x=2\\). Open circles mark excluded endpoints; the filled point gives \\(g(2)=3\\). <div data-laws-plot=\"innerJump\"></div>Let \\(F(u)=u^2\\). Find \\(\\lim_{x\\to2}F(g(x))\\).",
      "choices": [
        "DNE",
        "9",
        "0",
        "1"
      ],
      "answer": 3,
      "hint": "Read both inner side limits and square each one.",
      "solution": "The graph gives \\(\\lim_{x\\to2^-}g(x)=-1\\) and \\(\\lim_{x\\to2^+}g(x)=1\\). The one-sided power laws give \\(\\lim_{x\\to2^-}F(g(x))=(-1)^2=1\\) and \\(\\lim_{x\\to2^+}F(g(x))=1^2=1\\). Therefore \\(\\lim_{x\\to2}F(g(x))=1\\), even though the two-sided inner limit does not exist. The point value \\(F(g(2))=9\\) does not change this result."
    },
    {
      "id": "ap16",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "The graph shows the inner function \\(g\\) near \\(x=2\\). Open circles mark excluded endpoints; the filled point gives \\(g(2)=3\\). <div data-laws-plot=\"innerJump\"></div>Let \\(H(u)=u+2\\). Find \\(\\lim_{x\\to2}H(g(x))\\).",
      "choices": [
        "2",
        "DNE",
        "1",
        "3"
      ],
      "answer": 1,
      "hint": "Add 2 to each inner side limit and compare.",
      "solution": "By the one-sided sum law, \\(\\lim_{x\\to2^-}H(g(x))=-1+2=1\\) and \\(\\lim_{x\\to2^+}H(g(x))=1+2=3\\). These differ, so \\(\\lim_{x\\to2}H(g(x))\\) does not exist. Neither side alone determines the two-sided answer."
    },
    {
      "id": "ch01",
      "type": "mcq",
      "group": "Challenge MCQ 1",
      "prompt": "Given \\(\\lim_{x\\to4}[f(x)+g(x)]=10\\) and \\(\\lim_{x\\to4}[f(x)-g(x)]=4\\), find \\(\\lim_{x\\to4}f(x)\\).",
      "choices": [
        "7",
        "3",
        "14",
        "Cannot be determined."
      ],
      "answer": 0,
      "hint": "Add the two expressions before taking half.",
      "solution": "Since \\(f(x)=\\frac12[(f(x)+g(x))+(f(x)-g(x))]\\), the sum and constant-multiple laws give \\(\\lim_{x\\to4}f(x)=\\frac12(10+4)=7\\). We do not need to assume the individual limits first."
    },
    {
      "id": "ch02",
      "type": "mcq",
      "group": "Challenge MCQ 2",
      "prompt": "Given \\(\\lim_{x\\to-2}f(x)=2\\) and \\(\\lim_{x\\to-2}g(x)=-1\\), find the constant \\(k\\) for which \\(\\lim_{x\\to-2}[kf(x)+(k-3)g(x)]=12\\).",
      "choices": [
        "3",
        "6",
        "9",
        "12"
      ],
      "answer": 2,
      "hint": "Apply the laws with k held constant.",
      "solution": "The laws give \\(\\lim_{x\\to-2}[kf(x)+(k-3)g(x)]=2k-(k-3)=k+3\\). Thus \\(k+3=12\\), so \\(k=9\\)."
    },
    {
      "id": "ch03",
      "type": "mcq",
      "group": "Challenge MCQ 3",
      "prompt": "Given \\(\\lim_{x\\to3}f(x)=4\\) and \\(\\lim_{x\\to3}g(x)=-3\\), find \\(\\lim_{x\\to3}\\sqrt{[g(x)-f(x)]^2}\\).",
      "choices": [
        "−7",
        "7",
        "49",
        "DNE"
      ],
      "answer": 1,
      "hint": "Use the difference and power laws, then take the nonnegative square root.",
      "solution": "The difference law gives \\(\\lim_{x\\to3}[g(x)-f(x)]=-3-4=-7\\). The power and root laws then give \\(\\lim_{x\\to3}\\sqrt{[g(x)-f(x)]^2}=\\sqrt{(-7)^2}=7\\)."
    },
    {
      "id": "ch04",
      "type": "mcq",
      "group": "Challenge MCQ 4",
      "prompt": "Given \\(\\lim_{x\\to2}f(x)=3\\) and \\(\\lim_{x\\to2}g(x)=-2\\), for which \\(k\\) is the quotient law unavailable for \\(\\lim_{x\\to2}\\frac{f(x)+1}{kf(x)+g(x)}\\)?",
      "choices": [
        "−2/3",
        "3/2",
        "−3/2",
        "2/3"
      ],
      "answer": 3,
      "hint": "Find the denominator limit as an expression in k.",
      "solution": "The denominator has limit \\(3k-2\\). It is zero exactly when \\(k=2/3\\); the quotient theorem then cannot be used."
    },
    {
      "id": "ch05",
      "type": "mcq",
      "group": "Challenge MCQ 5",
      "prompt": "Let \\(\\lim_{x\\to1}f(x)=4\\) and \\(\\lim_{x\\to1}[f(x)g(x)]=10\\). What is \\(\\lim_{x\\to1}g(x)\\)?",
      "choices": [
        "40",
        "5/2",
        "DNE",
        "Cannot be determined."
      ],
      "answer": 1,
      "hint": "Write g as (fg)/f; the limiting denominator is nonzero.",
      "solution": "Because \\(f(x)\\) tends to nonzero 4, it is nonzero sufficiently near 1. Thus \\(g(x)=\\frac{f(x)g(x)}{f(x)}\\) there, and \\(\\lim_{x\\to1}g(x)=10/4=5/2\\) by the quotient law."
    },
    {
      "id": "ch06",
      "type": "mcq",
      "group": "Challenge MCQ 6",
      "prompt": "Let \\(\\lim_{x\\to0}f(x)=2\\) and \\(\\lim_{x\\to0}[f(x)+g(x)]=9\\). Find \\(\\lim_{x\\to0}g(x)\\).",
      "choices": [
        "18",
        "11",
        "7",
        "Cannot be determined."
      ],
      "answer": 2,
      "hint": "Use g=(f+g)−f.",
      "solution": "The difference law applied to the known expressions gives \\(\\lim_{x\\to0}g(x)=9-2=7\\)."
    },
    {
      "id": "ch07",
      "type": "mcq",
      "group": "Challenge MCQ 7",
      "prompt": "<div class=\"table-wrap\"><table><caption>Exact one-sided limits at x = 1; these are not sampled point values</caption><thead><tr><th scope=\"col\">Approach</th><th scope=\"col\">Limit of \\(f(x)\\)</th><th scope=\"col\">Limit of \\(g(x)\\)</th></tr></thead><tbody><tr><td>\\(x\\to1^-\\)</td><td>2</td><td>3</td></tr><tr><td>\\(x\\to1^+\\)</td><td>−2</td><td>−3</td></tr></tbody></table></div>Find \\(\\lim_{x\\to1}\\frac{f(x)}{g(x)}\\).",
      "choices": [
        "2/3",
        "−2/3",
        "DNE",
        "3/2"
      ],
      "answer": 0,
      "hint": "Check each denominator side limit separately.",
      "solution": "The side denominator limits are nonzero. Hence \\(\\lim_{x\\to1^-}\\frac{f(x)}{g(x)}=2/3\\) and \\(\\lim_{x\\to1^+}\\frac{f(x)}{g(x)}=(-2)/(-3)=2/3\\). Thus \\(\\lim_{x\\to1}\\frac{f(x)}{g(x)}=2/3\\)."
    },
    {
      "id": "ch08",
      "type": "mcq",
      "group": "Challenge MCQ 8",
      "prompt": "Let \\(\\lim_{x\\to-1}f(x)=4\\), \\(\\lim_{x\\to-1}g(x)=-1\\), and \\(\\lim_{x\\to-1}h(x)=0\\). Which limit is guaranteed to exist as a finite real number by the stated information?",
      "choices": [
        "\\(\\lim_{x\\to-1}\\frac{f(x)}{h(x)}\\)",
        "\\(\\lim_{x\\to-1}\\sqrt{g(x)}\\)",
        "\\(\\lim_{x\\to-1}\\frac{h(x)}{h(x)}\\), without any domain information about h",
        "\\(\\lim_{x\\to-1}\\sqrt{f(x)-g(x)}\\)"
      ],
      "answer": 3,
      "hint": "Check the denominator and real-root conditions.",
      "solution": "\\(\\lim_{x\\to-1}[f(x)-g(x)]=4-(-1)=5>0\\), so the last limit equals \\(\\sqrt5\\). The first has a zero denominator limit; the second has a negative radicand near −1; the third need not be defined near −1 (for example, h could be identically zero)."
    },
    {
      "id": "ch09",
      "type": "mcq",
      "group": "Challenge MCQ 9",
      "prompt": "Given \\(\\lim_{x\\to3}f(x)=3\\) and \\(\\lim_{x\\to3}g(x)=1\\), evaluate \\(\\lim_{x\\to3}\\frac{[f(x)]^2+g(x)}{f(x)-g(x)}\\).",
      "choices": [
        "10",
        "5",
        "4",
        "DNE"
      ],
      "answer": 1,
      "hint": "Preserve both numerator and denominator structure.",
      "solution": "The numerator tends to \\(3^2+1=10\\), and the denominator tends to \\(3-1=2\\ne0\\). The quotient limit is \\(10/2=5\\)."
    },
    {
      "id": "ch10",
      "type": "mcq",
      "group": "Challenge MCQ 10",
      "prompt": "Given \\(\\lim_{x\\to2}g(x)=4\\) and \\(F(4)=7\\), which extra condition is sufficient to conclude \\(\\lim_{x\\to2}F(g(x))=7\\)?",
      "choices": [
        "g(2) = 7.",
        "F(2) = 4.",
        "F is continuous at 4.",
        "g(2) exists."
      ],
      "answer": 2,
      "hint": "The continuity condition belongs at the inner limiting input.",
      "solution": "Continuity of F at 4 gives \\(\\lim_{x\\to2}F(g(x))=F(4)=7\\). A value at one point by itself does not describe the nearby outer behavior."
    },
    {
      "id": "ch11",
      "type": "mcq",
      "group": "Challenge MCQ 11",
      "prompt": "The graph shows the inner function \\(g\\) near \\(x=2\\). Open circles mark excluded endpoints; the filled point gives \\(g(2)=3\\). <div data-laws-plot=\"innerJump\"></div>For \\(K(u)=u^2+ku\\), which constant \\(k\\) makes \\(\\lim_{x\\to2}K(g(x))\\) exist?",
      "choices": [
        "0",
        "1",
        "−1",
        "Every real k."
      ],
      "answer": 0,
      "hint": "Compute K(−1) and K(1), then make them equal.",
      "solution": "The one-sided polynomial laws give \\(\\lim_{x\\to2^-}K(g(x))=1-k\\) and \\(\\lim_{x\\to2^+}K(g(x))=1+k\\). They agree exactly when \\(1-k=1+k\\), so \\(k=0\\). The common limit is 1."
    },
    {
      "id": "ch12",
      "type": "mcq",
      "group": "Challenge MCQ 12",
      "prompt": "The graph shows the inner function \\(g\\) near \\(x=2\\). Open circles mark excluded endpoints; the filled point gives \\(g(2)=3\\). <div data-laws-plot=\"innerJump\"></div>Let \\(R(u)=\\frac{u^2+3}{u+3}\\). Which pair equals \\(\\left(\\lim_{x\\to2^-}R(g(x)),\\lim_{x\\to2^+}R(g(x))\\right)\\)?",
      "choices": [
        "\\((1,2)\\)",
        "\\((2,2)\\)",
        "\\((1,1)\\)",
        "\\((2,1)\\)"
      ],
      "answer": 3,
      "hint": "Use the one-sided power, sum and quotient laws; check both denominators.",
      "solution": "On the left, \\(\\lim_{x\\to2^-}R(g(x))=\\frac{(-1)^2+3}{-1+3}=2\\). On the right, \\(\\lim_{x\\to2^+}R(g(x))=\\frac{1^2+3}{1+3}=1\\). Both denominator limits are nonzero. Since the sides differ, the two-sided composite limit does not exist."
    }
  ],
  "frqs": [
    {
      "id": "ap-frq1",
      "title": "Combine known limits and check the conditions",
      "group": "AP-style FRQ",
      "calculator": false,
      "context": "Let \\(\\lim_{x\\to2}f(x)=2\\), \\(\\lim_{x\\to2}g(x)=-3\\), and \\(\\lim_{x\\to2}h(x)=4\\). ",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Evaluate \\(\\lim_{x\\to2}[3f(x)-2g(x)]\\). Name the laws used.",
          "rubric": "<ol><li>1 point: Use the constant-multiple and difference laws at \\(x\\to2\\).</li><li>1 point: Substitute \\(3(2)-2(-3)\\).</li><li>1 point: Conclude \\(\\lim_{x\\to2}[3f(x)-2g(x)]=12\\).</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Evaluate \\(\\lim_{x\\to2}\\frac{\\sqrt{h(x)+5}}{g(x)}\\). Justify the root and quotient steps.",
          "rubric": "<ol><li>1 point: The radicand tends to \\(4+5=9>0\\), so the numerator tends to 3 by the root property.</li><li>1 point: The denominator tends to \\(-3\\ne0\\), permitting the quotient law.</li><li>1 point: Conclude \\(\\lim_{x\\to2}\\frac{\\sqrt{h(x)+5}}{g(x)}=-1\\).</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "Can the quotient law directly evaluate \\(\\lim_{x\\to2}\\frac{f(x)-2}{g(x)+3}\\)? Explain what the given information establishes.",
          "rubric": "<ol><li>1 point: The numerator limit is \\(2-2=0\\).</li><li>1 point: The denominator limit is \\(-3+3=0\\), violating the nonzero-denominator condition.</li><li>1 point: The form 0/0 is indeterminate. These givens alone do not determine the quotient limit; further nearby information is needed.</li></ol>"
        }
      ]
    },
    {
      "id": "ap-frq2",
      "title": "One-sided laws from an exact table",
      "group": "AP-style FRQ",
      "calculator": false,
      "context": "<div class=\"table-wrap\"><table><caption>Exact one-sided limits at x = 1; these are not sampled point values</caption><thead><tr><th scope=\"col\">Approach</th><th scope=\"col\">Limit of \\(f(x)\\)</th><th scope=\"col\">Limit of \\(g(x)\\)</th></tr></thead><tbody><tr><td>\\(x\\to1^-\\)</td><td>2</td><td>3</td></tr><tr><td>\\(x\\to1^+\\)</td><td>−2</td><td>−3</td></tr></tbody></table></div>Also, \\(f(1)=7\\) and \\(g(1)=4\\).",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Determine \\(\\lim_{x\\to1}[f(x)+g(x)]\\), showing both sides.",
          "rubric": "<ol><li>1 point: \\(\\lim_{x\\to1^-}[f(x)+g(x)]=2+3=5\\).</li><li>1 point: \\(\\lim_{x\\to1^+}[f(x)+g(x)]=-2-3=-5\\).</li><li>1 point: The unequal side limits mean \\(\\lim_{x\\to1}[f(x)+g(x)]\\) does not exist.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Determine \\(\\lim_{x\\to1}f(x)g(x)\\), showing both sides.",
          "rubric": "<ol><li>1 point: The one-sided product law gives \\(\\lim_{x\\to1^-}f(x)g(x)=6\\).</li><li>1 point: It also gives \\(\\lim_{x\\to1^+}f(x)g(x)=(-2)(-3)=6\\).</li><li>1 point: The sides agree, so \\(\\lim_{x\\to1}f(x)g(x)=6\\), even though neither factor has a two-sided limit.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "Determine \\(\\lim_{x\\to1}\\frac{f(x)}{g(x)}\\) and explain why the assigned values at 1 do not determine it.",
          "rubric": "<ol><li>1 point: The left quotient limit is \\(2/3\\), with nonzero denominator limit 3.</li><li>1 point: The right quotient limit is \\((-2)/(-3)=2/3\\), with nonzero denominator limit −3.</li><li>1 point: Thus \\(\\lim_{x\\to1}\\frac{f(x)}{g(x)}=2/3\\). The assigned values give \\(f(1)/g(1)=7/4\\), a separate point value.</li></ol>"
        }
      ]
    },
    {
      "id": "ap-frq3",
      "title": "A jumping inner function: two composite outcomes",
      "group": "AP-style FRQ",
      "calculator": false,
      "context": "The graph shows the inner function \\(g\\) near \\(x=2\\). Open circles mark excluded endpoints; the filled point gives \\(g(2)=3\\). <div data-laws-plot=\"innerJump\"></div>Let \\(F(u)=u^2\\) and \\(H(u)=u+2\\).",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Find \\(\\lim_{x\\to2^-}g(x)\\), \\(\\lim_{x\\to2^+}g(x)\\), and \\(\\lim_{x\\to2}g(x)\\). Justify the two-sided conclusion.",
          "rubric": "<ol><li>1 point: The left branch approaches the open point at height −1: \\(\\lim_{x\\to2^-}g(x)=-1\\).</li><li>1 point: The right branch approaches height 1: \\(\\lim_{x\\to2^+}g(x)=1\\).</li><li>1 point: The side limits differ, so \\(\\lim_{x\\to2}g(x)\\) does not exist.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Use limit laws on each side to find \\(\\lim_{x\\to2}F(g(x))\\). Compare it with \\(F(g(2))\\).",
          "rubric": "<ol><li>1 point: The one-sided power law gives \\(\\lim_{x\\to2^-}F(g(x))=(-1)^2=1\\).</li><li>1 point: The same law gives \\(\\lim_{x\\to2^+}F(g(x))=1^2=1\\), so \\(\\lim_{x\\to2}F(g(x))=1\\).</li><li>1 point: The point value is \\(F(g(2))=F(3)=9\\). It does not control the limit because the limit uses nearby inputs.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "Use limit laws on each side to decide whether \\(\\lim_{x\\to2}H(g(x))\\) exists. Explain why the two-sided composition rule cannot start with a single inner limit here.",
          "rubric": "<ol><li>1 point: The one-sided sum law gives \\(\\lim_{x\\to2^-}H(g(x))=-1+2=1\\).</li><li>1 point: It gives \\(\\lim_{x\\to2^+}H(g(x))=1+2=3\\). These differ, so \\(\\lim_{x\\to2}H(g(x))\\) does not exist.</li><li>1 point: There is no single two-sided inner limit to substitute into H. Instead, use the finite inner limit on each side and compare the resulting outer limits.</li></ol>"
        }
      ]
    },
    {
      "id": "ch-frq1",
      "title": "Recover limits and find a parameter",
      "group": "Challenge FRQ",
      "calculator": false,
      "context": "You know \\(\\lim_{x\\to4}[f(x)+g(x)]=10\\) and \\(\\lim_{x\\to4}[f(x)-g(x)]=4\\).",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Find \\(\\lim_{x\\to4}f(x)\\) without assuming its existence in advance.",
          "rubric": "<ol><li>1 point: Use the identity \\(f(x)=\\frac12[(f(x)+g(x))+(f(x)-g(x))]\\).</li><li>1 point: The sum and constant-multiple laws apply to the two given finite limits.</li><li>1 point: Conclude \\(\\lim_{x\\to4}f(x)=\\frac12(10+4)=7\\).</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Find \\(\\lim_{x\\to4}g(x)\\), then evaluate \\(\\lim_{x\\to4}\\frac{f(x)}{g(x)}\\).",
          "rubric": "<ol><li>1 point: Use \\(g(x)=\\frac12[(f(x)+g(x))-(f(x)-g(x))]\\) to get \\(\\lim_{x\\to4}g(x)=3\\).</li><li>1 point: The denominator limit 3 is nonzero, so the quotient law applies.</li><li>1 point: Conclude \\(\\lim_{x\\to4}\\frac{f(x)}{g(x)}=7/3\\).</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "Find the constant \\(k\\) for which \\(\\lim_{x\\to4}[kf(x)-2g(x)]=15\\).",
          "rubric": "<ol><li>1 point: Use the limits established in parts (a) and (b) to get \\(7k-2(3)\\).</li><li>1 point: Set \\(7k-6=15\\).</li><li>1 point: Solve \\(k=3\\); substitution verifies the requested limiting value 15.</li></ol>"
        }
      ]
    },
    {
      "id": "ch-frq2",
      "title": "Graph limits versus assigned values",
      "group": "Challenge FRQ",
      "calculator": false,
      "context": "The graphs show \\(f\\) and \\(g\\) near \\(x=1\\). Open circles give the missing branch endpoints.<div class=\"graph-pair\"><div data-laws-plot=\"holeF\"></div><div data-laws-plot=\"holeG\"></div></div>",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Find \\(\\lim_{x\\to1}f(x)\\), \\(\\lim_{x\\to1}g(x)\\), and \\(\\lim_{x\\to1}[2f(x)+g(x)]\\).",
          "rubric": "<ol><li>1 point: Both branches of f approach 3, so \\(\\lim_{x\\to1}f(x)=3\\).</li><li>1 point: Both branches of g approach 1, so \\(\\lim_{x\\to1}g(x)=1\\).</li><li>1 point: The constant-multiple and sum laws give \\(\\lim_{x\\to1}[2f(x)+g(x)]=2(3)+1=7\\).</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Evaluate \\(\\lim_{x\\to1}\\frac{f(x)-g(x)}{f(x)+g(x)}\\), explaining why the quotient law applies.",
          "rubric": "<ol><li>1 point: The numerator limit is \\(3-1=2\\).</li><li>1 point: The denominator limit is \\(3+1=4\\ne0\\).</li><li>1 point: Therefore \\(\\lim_{x\\to1}\\frac{f(x)-g(x)}{f(x)+g(x)}=2/4=1/2\\).</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "Let \\(P(u)=u^2+2u\\). Find \\(\\lim_{x\\to1}P(g(x))\\) and \\(P(g(1))\\). Explain the difference.",
          "rubric": "<ol><li>1 point: P is continuous at the inner limit 1, so \\(\\lim_{x\\to1}P(g(x))=P(1)=3\\).</li><li>1 point: The filled point gives \\(g(1)=4\\), so \\(P(g(1))=P(4)=24\\).</li><li>1 point: The limiting value uses nearby g-values; the assigned center value answers a different question.</li></ol>"
        }
      ]
    },
    {
      "id": "ch-frq3",
      "title": "A jump combined with a zero limit",
      "group": "Challenge FRQ",
      "calculator": false,
      "context": "The graphs show \\(f\\) and \\(g\\) near \\(x=2\\). Read each side separately.<div class=\"graph-pair\"><div data-laws-plot=\"jumpF\"></div><div data-laws-plot=\"zeroG\"></div></div>",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Determine \\(\\lim_{x\\to2}[f(x)+g(x)]\\).",
          "rubric": "<ol><li>1 point: \\(\\lim_{x\\to2^-}[f(x)+g(x)]=4+0=4\\).</li><li>1 point: \\(\\lim_{x\\to2^+}[f(x)+g(x)]=-1+0=-1\\).</li><li>1 point: The side limits differ, so \\(\\lim_{x\\to2}[f(x)+g(x)]\\) does not exist.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Determine \\(\\lim_{x\\to2}f(x)g(x)\\) using one-sided laws.",
          "rubric": "<ol><li>1 point: \\(\\lim_{x\\to2^-}f(x)g(x)=4(0)=0\\).</li><li>1 point: \\(\\lim_{x\\to2^+}f(x)g(x)=(-1)(0)=0\\).</li><li>1 point: The matching sides imply \\(\\lim_{x\\to2}f(x)g(x)=0\\). Do not apply a two-sided product law to f, whose two-sided limit is absent.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "Determine \\(\\lim_{x\\to2}\\frac{g(x)}{f(x)}\\) and check the denominator on each side.",
          "rubric": "<ol><li>1 point: The left denominator limit is \\(4\\ne0\\); thus \\(\\lim_{x\\to2^-}\\frac{g(x)}{f(x)}=0/4=0\\).</li><li>1 point: The right denominator limit is \\(-1\\ne0\\); thus \\(\\lim_{x\\to2^+}\\frac{g(x)}{f(x)}=0/(-1)=0\\).</li><li>1 point: The sides agree, so \\(\\lim_{x\\to2}\\frac{g(x)}{f(x)}=0\\).</li></ol>"
        }
      ]
    },
    {
      "id": "ch-frq4",
      "title": "Composite laws with a jumping inner input",
      "group": "Challenge FRQ",
      "calculator": false,
      "context": "The graph shows the inner function \\(g\\) near \\(x=2\\). Open circles mark excluded endpoints; the filled point gives \\(g(2)=3\\). <div data-laws-plot=\"innerJump\"></div>Let \\(R(u)=\\frac{u^2+3}{u+3}\\) and \\(K(u)=u^2+ku\\), where \\(k\\) is constant.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Evaluate \\(\\lim_{x\\to2^-}R(g(x))\\) and \\(\\lim_{x\\to2^+}R(g(x))\\). Show the one-sided limit laws and denominator checks.",
          "rubric": "<ol><li>1 point: On the left, the power and sum laws give numerator limit \\((-1)^2+3=4\\) and denominator limit \\(-1+3=2\\ne0\\).</li><li>1 point: The quotient law gives \\(\\lim_{x\\to2^-}R(g(x))=4/2=2\\).</li><li>1 point: On the right, numerator and denominator limits are both 4. Since \\(4\\ne0\\), \\(\\lim_{x\\to2^+}R(g(x))=4/4=1\\).</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Decide whether \\(\\lim_{x\\to2}R(g(x))\\) exists and compare this question with evaluating \\(R(g(2))\\).",
          "rubric": "<ol><li>1 point: The side limits 2 and 1 differ, so \\(\\lim_{x\\to2}R(g(x))\\) does not exist.</li><li>1 point: The filled point gives \\(g(2)=3\\), so \\(R(g(2))=R(3)=12/6=2\\).</li><li>1 point: A defined composite point value does not force a composite limit to exist; both nearby sides must agree.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "Find all constants \\(k\\) for which \\(\\lim_{x\\to2}K(g(x))\\) exists, and state its value.",
          "rubric": "<ol><li>1 point: The one-sided polynomial laws give \\(\\lim_{x\\to2^-}K(g(x))=1-k\\) and \\(\\lim_{x\\to2^+}K(g(x))=1+k\\).</li><li>1 point: Equality requires \\(1-k=1+k\\), hence \\(k=0\\).</li><li>1 point: For \\(k=0\\), both sides equal 1, so \\(\\lim_{x\\to2}K(g(x))=1\\).</li></ol>"
        }
      ]
    }
  ],
  "revision": "ap-topic-1-5-v2"
};if(typeof module!=="undefined"&&module.exports)module.exports=data;else root.LimitLessonQuestions=data;})(typeof window!=="undefined"?window:globalThis);
