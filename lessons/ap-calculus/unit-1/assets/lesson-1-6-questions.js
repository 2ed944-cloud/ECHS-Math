/* Original ECHS AP-style and extension practice. */
(function(root){const data={
  "questions": [
    {
      "id": "launch",
      "type": "mcq",
      "group": "Opening prediction",
      "prompt": "Substitution in \\(\\frac{x^2-9}{x-3}\\) as \\(x\\to3\\) produces \\(0/0\\). What does this tell you?",
      "choices": [
        "The limit is zero.",
        "The limit is automatically DNE.",
        "The form does not determine the limit; rewrite the expression.",
        "The limit is infinity."
      ],
      "answer": 2,
      "hint": "A form is a diagnostic, not a limit value.",
      "solution": "Factor \\(x^2-9=(x-3)(x+3)\\). For \\(x\\ne3\\), the quotient is \\(x+3\\), so its limit is 6."
    },
    {
      "id": "factor-check",
      "type": "number",
      "group": "Guided check",
      "prompt": "Evaluate \\(\\lim_{x\\to-2}\\frac{x^2-4}{x+2}\\).",
      "answer": -4,
      "unit": "exact value",
      "hint": "Use a difference of squares.",
      "solution": "For \\(x\\ne-2\\), cancel \\(x+2\\) from \\((x-2)(x+2)/(x+2)\\). The limit of \\(x-2\\) is −4."
    },
    {
      "id": "radical-check",
      "type": "number",
      "group": "Guided check",
      "prompt": "Evaluate \\(\\lim_{x\\to4}\\frac{\\sqrt{x+5}-3}{x-4}\\).",
      "answer": 0.16666666666666666,
      "unit": "exact value",
      "hint": "Multiply by the sum of the two numerator terms.",
      "solution": "The conjugate gives \\((x-4)/[(x-4)(\\sqrt{x+5}+3)]\\). For \\(x\\ne4\\), this is \\(1/(\\sqrt{x+5}+3)\\), tending to \\(1/6\\)."
    },
    {
      "id": "fraction-check",
      "type": "number",
      "group": "Guided check",
      "prompt": "Evaluate \\(\\lim_{x\\to1}\\frac{1/(x+1)-1/2}{x-1}\\).",
      "answer": -0.25,
      "unit": "exact value",
      "hint": "Combine the numerator over 2(x+1).",
      "solution": "The numerator is \\((1-x)/[2(x+1)]\\). Cancel \\(x-1\\) with its negative, leaving \\(-1/[2(x+1)]\\to-1/4\\)."
    },
    {
      "id": "identity-check",
      "type": "mcq",
      "group": "Identity check",
      "prompt": "Which exact rewrite evaluates \\(\\lim_{x\\to0}\\frac{\\sin(2x)}{\\sin x}\\)?",
      "choices": [
        "\\(2\\cos x\\)",
        "\\(\\cos(2x)\\)",
        "\\(2/\\cos x\\)",
        "\\(\\sin 2\\)"
      ],
      "answer": 0,
      "hint": "Use the double-angle identity.",
      "solution": "\\(\\sin(2x)=2\\sin x\\cos x\\). For nearby nonzero x, cancel \\(\\sin x\\), then \\(2\\cos x\\to2\\)."
    },
    {
      "id": "exit",
      "type": "mcq",
      "group": "AP exit check",
      "prompt": "A student finds \\(\\lim_{x\\to1}(x^2-1)/(x-1)=2\\). Which justification is complete?",
      "choices": [
        "The original quotient equals 2 at x = 1.",
        "Both numerator and denominator tend to zero.",
        "Cancel x from the numerator and denominator.",
        "For nearby x ≠ 1, the quotient equals x + 1, whose limit is 2."
      ],
      "answer": 3,
      "hint": "Explain both equivalence and evaluation.",
      "solution": "The original quotient is undefined at 1, but agrees with x + 1 on a punctured neighborhood. The polynomial limit is 2."
    },
    {
      "id": "ap01",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "\\(\\displaystyle\\lim_{x\\to3}\\frac{x^2-9}{x-3}=\\)",
      "choices": [
        "0",
        "3",
        "6",
        "DNE"
      ],
      "answer": 2,
      "hint": "Factor a difference of squares.",
      "solution": "\\(x^2-9=(x-3)(x+3)\\). For \\(x\\ne3\\), the quotient equals \\(x+3\\to6\\)."
    },
    {
      "id": "ap02",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "\\(\\displaystyle\\lim_{x\\to2}\\frac{x^2+x-6}{x-2}=\\)",
      "choices": [
        "5",
        "0",
        "2",
        "DNE"
      ],
      "answer": 0,
      "hint": "Find two numbers with product −6 and sum 1.",
      "solution": "\\(x^2+x-6=(x-2)(x+3)\\). Cancel for \\(x\\ne2\\), then \\(x+3\\to5\\)."
    },
    {
      "id": "ap03",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "\\(\\displaystyle\\lim_{x\\to1}\\frac{x^2-1}{x^2-5x+4}=\\)",
      "choices": [
        "\\(2/3\\)",
        "0",
        "DNE",
        "\\(-2/3\\)"
      ],
      "answer": 3,
      "hint": "Factor both polynomials before canceling.",
      "solution": "For \\(x\\ne1\\) near 1, the quotient is \\((x+1)/(x-4)\\), because the factors are \\((x-1)(x+1)\\) and \\((x-1)(x-4)\\). Substitute 1 to get \\(-2/3\\)."
    },
    {
      "id": "ap04",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "\\(\\displaystyle\\lim_{x\\to4}\\frac{\\sqrt{x+5}-3}{x-4}=\\)",
      "choices": [
        "6",
        "\\(1/6\\)",
        "\\(1/3\\)",
        "DNE"
      ],
      "answer": 1,
      "hint": "Rationalize the numerator.",
      "solution": "Multiply by \\((\\sqrt{x+5}+3)/(\\sqrt{x+5}+3)\\). After canceling \\(x-4\\) for \\(x\\ne4\\), the result is \\(1/(\\sqrt{x+5}+3)\\to1/6\\)."
    },
    {
      "id": "ap05",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "\\(\\displaystyle\\lim_{x\\to4}\\frac{x-4}{\\sqrt{x}-2}=\\)",
      "choices": [
        "\\(1/4\\)",
        "0",
        "4",
        "DNE"
      ],
      "answer": 2,
      "hint": "Rationalize the denominator.",
      "solution": "For nearby \\(x\\ne4\\), multiplying by the conjugate gives \\((x-4)(\\sqrt{x}+2)/(x-4)=\\sqrt{x}+2\\to4\\)."
    },
    {
      "id": "ap06",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "\\(\\displaystyle\\lim_{x\\to3}\\frac{1/x-1/3}{x-3}=\\)",
      "choices": [
        "\\(1/9\\)",
        "\\(-1/3\\)",
        "0",
        "\\(-1/9\\)"
      ],
      "answer": 3,
      "hint": "The numerator is (3−x)/(3x).",
      "solution": "For nearby \\(x\\ne3\\), \\((3-x)/[3x(x-3)]=-1/(3x)\\to-1/9\\). The sign changes when \\(3-x=-(x-3)\\)."
    },
    {
      "id": "ap07",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "\\(\\displaystyle\\lim_{x\\to0}\\frac{1-\\cos^2x}{\\sin x}=\\)",
      "choices": [
        "0",
        "1",
        "2",
        "DNE"
      ],
      "answer": 0,
      "hint": "Use the Pythagorean identity.",
      "solution": "\\(1-\\cos^2x=\\sin^2x\\). For nearby nonzero x the expression is \\(\\sin x\\to0\\)."
    },
    {
      "id": "ap08",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "\\(\\displaystyle\\lim_{x\\to0}\\frac{\\tan x}{\\sin x}=\\)",
      "choices": [
        "0",
        "1",
        "2",
        "DNE"
      ],
      "answer": 1,
      "hint": "Write tangent as sine divided by cosine.",
      "solution": "For nearby nonzero x, \\(\\tan x/\\sin x=1/\\cos x\\). Since \\(\\cos x\\to1\\), the limit is 1."
    },
    {
      "id": "ap09",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "\\(\\displaystyle\\lim_{x\\to2}\\frac{x^2+4}{x+2}=\\)",
      "choices": [
        "0",
        "4",
        "DNE",
        "2"
      ],
      "answer": 3,
      "hint": "Check the denominator before doing extra algebra.",
      "solution": "The denominator tends to 4, which is nonzero. Direct substitution gives \\((4+4)/(2+2)=2\\). There is no common factor to cancel."
    },
    {
      "id": "ap10",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Which condition guarantees that replacing f by g preserves the limit as x approaches c?",
      "choices": [
        "f(c) = g(c).",
        "f and g agree at three nearby inputs.",
        "f(x) = g(x) for every sufficiently close x ≠ c in their shared punctured domain.",
        "The graph of f looks close to the graph of g."
      ],
      "answer": 2,
      "hint": "A limit depends on all sufficiently close inputs, not just a point or a few samples.",
      "solution": "Exact agreement on a punctured neighborhood preserves the limiting behavior. Equality at c is neither necessary nor sufficient."
    },
    {
      "id": "ap11",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "\\(\\displaystyle\\lim_{x\\to0}\\frac{\\sqrt{9+x}-3}{x}=\\)",
      "choices": [
        "6",
        "\\(1/6\\)",
        "\\(1/3\\)",
        "0"
      ],
      "answer": 1,
      "hint": "The conjugate creates a factor x.",
      "solution": "For nearby \\(x\\ne0\\), rationalization gives \\(1/(\\sqrt{9+x}+3)\\). Its denominator tends to 6, so the limit is \\(1/6\\)."
    },
    {
      "id": "ap12",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "\\(\\displaystyle\\lim_{x\\to2}\\frac{x^2-4}{x^2-x-2}=\\)",
      "choices": [
        "\\(4/3\\)",
        "\\(3/4\\)",
        "0",
        "DNE"
      ],
      "answer": 0,
      "hint": "Factor the denominator into (x−2)(x+1).",
      "solution": "Cancel \\(x-2\\) for nearby \\(x\\ne2\\), leaving \\((x+2)/(x+1)\\to4/3\\)."
    },
    {
      "id": "ap13",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "\\(\\displaystyle\\lim_{x\\to1}\\frac{1/(x+1)-1/2}{x-1}=\\)",
      "choices": [
        "\\(1/4\\)",
        "\\(-1/2\\)",
        "\\(-1/4\\)",
        "DNE"
      ],
      "answer": 2,
      "hint": "Combine the numerator, then track the sign.",
      "solution": "\\(1/(x+1)-1/2=(1-x)/[2(x+1)]\\). Cancel for \\(x\\ne1\\) to obtain \\(-1/[2(x+1)]\\to-1/4\\)."
    },
    {
      "id": "ap14",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "\\(\\displaystyle\\lim_{x\\to0}\\frac{\\sin(2x)}{\\sin x}=\\)",
      "choices": [
        "2",
        "1",
        "0",
        "DNE"
      ],
      "answer": 0,
      "hint": "Use an exact double-angle identity.",
      "solution": "\\(\\sin(2x)=2\\sin x\\cos x\\). Cancel \\(\\sin x\\) for nearby nonzero x and evaluate \\(2\\cos x\\to2\\)."
    },
    {
      "id": "ap15",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Which line correctly simplifies \\((x^2-4)/(x-2)\\) for \\(x\\ne2\\)?",
      "choices": [
        "\\((x^2-4)/(x-2)=x-2\\)",
        "\\((x^2-4)/(x-2)=x^2-2\\)",
        "\\((x^2-4)/(x-2)=x\\)",
        "\\((x^2-4)/(x-2)=(x-2)(x+2)/(x-2)=x+2\\)"
      ],
      "answer": 3,
      "hint": "Only entire multiplicative factors can be canceled.",
      "solution": "Factor the numerator first: \\(x^2-4=(x-2)(x+2)\\). The common nonzero factor is \\(x-2\\), leaving \\(x+2\\)."
    },
    {
      "id": "ap16",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Let \\(g(x)=(x^2-4)/(x-2)\\) for \\(x\\ne2\\), and \\(g(2)=9\\). Which pair is correct?",
      "choices": [
        "\\(\\lim_{x\\to2}g(x)=9,\\ g(2)=9\\)",
        "\\(\\lim_{x\\to2}g(x)=4,\\ g(2)=9\\)",
        "\\(\\lim_{x\\to2}g(x)=4,\\ g(2)=4\\)",
        "The limit is DNE and g(2) = 9."
      ],
      "answer": 1,
      "hint": "Evaluate the nearby equivalent expression separately from the assigned value.",
      "solution": "For \\(x\\ne2\\), \\(g(x)=x+2\\), whose limit is 4. The separate definition assigns \\(g(2)=9\\)."
    },
    {
      "id": "ch01",
      "type": "mcq",
      "group": "Challenge MCQ 1",
      "prompt": "\\(\\displaystyle\\lim_{x\\to2}\\frac{x^7-2^7}{x-2}=\\)",
      "choices": [
        "128",
        "448",
        "64",
        "896"
      ],
      "answer": 1,
      "hint": "Factor the difference of seventh powers.",
      "solution": "For \\(x\\ne2\\), the quotient is \\(x^6+2x^5+\\cdots+2^6\\). Its seven terms each tend to \\(2^6=64\\), so the limit is 448."
    },
    {
      "id": "ch02",
      "type": "mcq",
      "group": "Challenge MCQ 2",
      "prompt": "For an integer \\(n\\ge2\\) and real a, \\(\\displaystyle\\lim_{x\\to a}\\frac{x^n-a^n}{x-a}=\\)",
      "choices": [
        "\\(a^n\\)",
        "\\(n a^n\\)",
        "\\(n a^{n-1}\\)",
        "DNE whenever a = 0"
      ],
      "answer": 2,
      "hint": "After factoring, count the terms and evaluate each.",
      "solution": "\\(x^n-a^n=(x-a)\\sum_{j=0}^{n-1}x^{n-1-j}a^j\\). Cancel for \\(x\\ne a\\). Each of the n terms tends to \\(a^{n-1}\\), giving \\(n a^{n-1}\\). For a = 0 and n ≥ 2 the result is 0."
    },
    {
      "id": "ch03",
      "type": "mcq",
      "group": "Challenge MCQ 3",
      "prompt": "\\(\\displaystyle\\lim_{x\\to-1}\\frac{x^4+3x^3-3x-1}{x+1}=\\)",
      "choices": [
        "2",
        "0",
        "−2",
        "DNE"
      ],
      "answer": 0,
      "hint": "Include the missing x² coefficient in synthetic division.",
      "solution": "Divide coefficients 1, 3, 0, −3, −1 by the root −1. The quotient is \\(x^3+2x^2-2x-1\\), with remainder 0. At −1 this is \\(-1+2+2-1=2\\)."
    },
    {
      "id": "ch04",
      "type": "mcq",
      "group": "Challenge MCQ 4",
      "prompt": "Let \\(P(x)=x^4-5x^3+3x^2+9x-8\\). What is \\(\\lim_{x\\to3}P(x)/(x-3)\\)?",
      "choices": [
        "0",
        "9",
        "−8",
        "DNE"
      ],
      "answer": 3,
      "hint": "Compute P(3) before claiming x−3 is a factor.",
      "solution": "\\(P(3)=-8\\), so division by \\(x-3\\) has remainder −8. The quotient behaves like \\(-8/(x-3)\\): left limit \\(+\\infty\\), right limit \\(-\\infty\\). The two-sided limit does not exist."
    },
    {
      "id": "ch05",
      "type": "mcq",
      "group": "Challenge MCQ 5",
      "prompt": "\\(\\displaystyle\\lim_{x\\to2}\\frac{x^4-8x^2+16}{(x-2)^2}=\\)",
      "choices": [
        "0",
        "8",
        "16",
        "DNE"
      ],
      "answer": 2,
      "hint": "The numerator is a perfect square.",
      "solution": "\\(x^4-8x^2+16=(x^2-4)^2=(x-2)^2(x+2)^2\\). For \\(x\\ne2\\), cancellation leaves \\((x+2)^2\\to16\\)."
    },
    {
      "id": "ch06",
      "type": "mcq",
      "group": "Challenge MCQ 6",
      "prompt": "\\(\\displaystyle\\lim_{x\\to2}\\frac{x^3-8}{\\sqrt{x+2}-2}=\\)",
      "choices": [
        "12",
        "48",
        "\\(1/48\\)",
        "24"
      ],
      "answer": 1,
      "hint": "Factor the cubic and rationalize the denominator.",
      "solution": "For \\(x\\ne2\\), the expression becomes \\((x^2+2x+4)(\\sqrt{x+2}+2)\\). At 2 this gives \\(12\\cdot4=48\\)."
    },
    {
      "id": "ch07",
      "type": "mcq",
      "group": "Challenge MCQ 7",
      "prompt": "\\(\\displaystyle\\lim_{x\\to8}\\frac{\\sqrt[3]x-2}{x-8}=\\)",
      "choices": [
        "\\(1/4\\)",
        "12",
        "0",
        "\\(1/12\\)"
      ],
      "answer": 3,
      "hint": "Use a³−b³ = (a−b)(a²+ab+b²).",
      "solution": "Let \\(u=\\sqrt[3]x\\). For \\(x\\ne8\\), the quotient is \\(1/(u^2+2u+4)\\to1/12\\)."
    },
    {
      "id": "ch08",
      "type": "mcq",
      "group": "Challenge MCQ 8",
      "prompt": "\\(\\displaystyle\\lim_{x\\to-8}\\frac{\\sqrt[3]x+2}{x+8}=\\)",
      "choices": [
        "\\(1/12\\)",
        "\\(-1/12\\)",
        "12",
        "DNE"
      ],
      "answer": 0,
      "hint": "Use the sum-of-cubes multiplier; real cube roots include negative inputs.",
      "solution": "Let \\(u=\\sqrt[3]x\\). Since \\(u^3+8=(u+2)(u^2-2u+4)\\), the quotient is \\(1/(u^2-2u+4)\\to1/12\\) as \\(u\\to-2\\)."
    },
    {
      "id": "ch09",
      "type": "mcq",
      "group": "Challenge MCQ 9",
      "prompt": "\\(\\displaystyle\\lim_{x\\to0}\\frac{\\sqrt{3+\\sqrt{9+x}}-\\sqrt6}{x}=\\)",
      "choices": [
        "\\(1/(6\\sqrt6)\\)",
        "\\(1/(12\\sqrt6)\\)",
        "\\(1/12\\)",
        "0"
      ],
      "answer": 1,
      "hint": "Rationalize the outer difference, then the inner difference.",
      "solution": "For nearby nonzero x, two rationalizations give \\(1/[(\\sqrt{3+\\sqrt{9+x}}+\\sqrt6)(\\sqrt{9+x}+3)]\\). The denominator tends to \\(2\\sqrt6\\cdot6=12\\sqrt6\\)."
    },
    {
      "id": "ch10",
      "type": "mcq",
      "group": "Challenge MCQ 10",
      "prompt": "\\(\\displaystyle\\lim_{x\\to0}\\frac{\\sqrt{1+x}+\\sqrt{1-x}-2}{x^2}=\\)",
      "choices": [
        "0",
        "\\(1/4\\)",
        "\\(-1/2\\)",
        "\\(-1/4\\)"
      ],
      "answer": 3,
      "hint": "Multiply by the sum of the radicals plus 2, then rationalize √(1−x²)−1.",
      "solution": "Write \\(S=\\sqrt{1+x}+\\sqrt{1-x}\\). Then \\(S^2-4=2(\\sqrt{1-x^2}-1)\\). For nonzero x, the quotient is \\(-2/[(S+2)(\\sqrt{1-x^2}+1)]\\to-1/4\\)."
    },
    {
      "id": "ch11",
      "type": "mcq",
      "group": "Challenge MCQ 11",
      "prompt": "In radians, \\(\\displaystyle\\lim_{x\\to0}\\frac{\\sin(3x)}{\\sin(5x)}=\\). You may use \\(\\lim_{u\\to0}\\sin u/u=1\\).",
      "choices": [
        "\\(3/5\\)",
        "\\(5/3\\)",
        "1",
        "0"
      ],
      "answer": 0,
      "hint": "Create one normalized sine ratio for each angle.",
      "solution": "\\(\\frac{\\sin3x}{\\sin5x}=\\frac35\\frac{\\sin3x}{3x}\\frac{5x}{\\sin5x}\\to3/5\\). The anchor uses radians."
    },
    {
      "id": "ch12",
      "type": "mcq",
      "group": "Challenge MCQ 12",
      "prompt": "In radians, \\(\\displaystyle\\lim_{x\\to0}\\frac{1-\\cos(4x)}{x\\sin(2x)}=\\). You may use the sine anchor.",
      "choices": [
        "2",
        "8",
        "4",
        "0"
      ],
      "answer": 2,
      "hint": "Use 1−cos4x = 2sin²2x.",
      "solution": "For nearby nonzero x, the quotient is \\(2\\sin(2x)/x=4\\sin(2x)/(2x)\\to4\\)."
    },
    {
      "id": "ch13",
      "type": "mcq",
      "group": "Challenge MCQ 13",
      "prompt": "In radians, \\(\\displaystyle\\lim_{x\\to0}\\frac{\\tan(2x)-\\sin(2x)}{x^3}=\\). Use the sine anchor and trigonometric identities.",
      "choices": [
        "2",
        "4",
        "8",
        "0"
      ],
      "answer": 1,
      "hint": "Rewrite tan u−sin u = sin u(1−cos u)/cos u.",
      "solution": "With \\(u=2x\\), the expression is \\(8(\\sin u/u)((1-\\cos u)/u^2)/\\cos u\\). The half-angle identity gives the middle limit \\(1/2\\). Hence \\(8\\cdot1\\cdot(1/2)/1=4\\)."
    },
    {
      "id": "ch14",
      "type": "mcq",
      "group": "Challenge MCQ 14",
      "prompt": "In radians, \\(\\displaystyle\\lim_{x\\to0}\\frac{\\sqrt{1+\\sin(3x)}-1}{x}=\\). Use the sine anchor.",
      "choices": [
        "\\(1/2\\)",
        "3",
        "0",
        "\\(3/2\\)"
      ],
      "answer": 3,
      "hint": "Rationalize, then normalize the remaining sine quotient.",
      "solution": "For nearby nonzero x, the expression is \\(\\frac{\\sin3x}{x}\\frac1{\\sqrt{1+\\sin3x}+1}\\to3/2\\)."
    },
    {
      "id": "ch15",
      "type": "mcq",
      "group": "Challenge MCQ 15",
      "prompt": "Which real pair satisfies \\(\\displaystyle\\lim_{x\\to2}\\frac{x^2+ax+b}{x^2-4}=3\\)?",
      "choices": [
        "\\((a,b)=(8,-20)\\)",
        "\\((a,b)=(4,-12)\\)",
        "\\((a,b)=(-4,4)\\)",
        "\\((a,b)=(8,20)\\)"
      ],
      "answer": 0,
      "hint": "Finiteness gives one equation; the value 3 gives another after cancellation.",
      "solution": "Finiteness requires \\(4+2a+b=0\\). Thus the numerator is \\((x-2)(x+a+2)\\). The limit is \\((a+4)/4=3\\), giving \\(a=8,b=-20\\)."
    },
    {
      "id": "ch16",
      "type": "mcq",
      "group": "Challenge MCQ 16",
      "prompt": "For real a and b, suppose \\(\\lim_{x\\to3}(x+3)/(x^2+ax+b)\\) does not exist as a finite real number. Which is always true?",
      "choices": [
        "\\(ab<27/4\\)",
        "\\(ab=27/4\\)",
        "\\(ab\\le27/4<27/2\\)",
        "\\(ab>27/2\\)"
      ],
      "answer": 2,
      "hint": "The numerator tends to 6. Then complete the square in the product ab.",
      "solution": "A nonzero denominator at 3 would give a finite limit, so \\(b=-9-3a\\). Hence \\(ab=-3a^2-9a=27/4-3(a+3/2)^2\\le27/4<27/2\\). Equality in the first bound occurs at \\(a=-3/2,b=-9/2\\), so strict \\(ab<27/4\\) is not guaranteed."
    }
  ],
  "frqs": [
    {
      "id": "ap-frq1",
      "title": "Factoring and nearby equivalence",
      "group": "AP-style FRQ",
      "calculator": false,
      "context": "Let \\(f(x)=\\frac{x^2-5x+6}{x-2}\\) for \\(x\\ne2\\), and let \\(f(2)=7\\). Show algebra and justify each conclusion.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Find \\(\\lim_{x\\to2}f(x)\\).",
          "rubric": "<ol><li>1 point: Factor \\(x^2-5x+6=(x-2)(x-3)\\).</li><li>1 point: State that \\(f(x)=x-3\\) for \\(x\\ne2\\).</li><li>1 point: Evaluate the limit as \\(-1\\).</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Find \\(\\lim_{x\\to2}\\frac{f(x)+1}{x-2}\\).",
          "rubric": "<ol><li>1 point: For \\(x\\ne2\\), use \\(f(x)+1=x-2\\).</li><li>1 point: Cancel the common nonzero factor to get 1.</li><li>1 point: State that the limit is 1; the assigned center value does not enter.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "A student claims the limit in part (a) is 7. Explain the error and state a precise condition under which replacing a function by a simpler expression preserves a limit.",
          "rubric": "<ol><li>1 point: Identify 7 as the assigned point value, not the nearby limit.</li><li>1 point: State agreement for every sufficiently close non-target input.</li><li>1 point: Explain that limits use those nearby values, so the replacement has the same limit.</li></ol>"
        }
      ]
    },
    {
      "id": "ap-frq2",
      "title": "Radicals and common denominators",
      "group": "AP-style FRQ",
      "calculator": false,
      "context": "Evaluate each limit using an equivalent expression. Record the excluded target and show why the final denominator permits substitution.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "\\(\\lim_{x\\to5}\\frac{\\sqrt{x+4}-3}{x-5}\\).",
          "rubric": "<ol><li>1 point: Multiply by \\((\\sqrt{x+4}+3)/(\\sqrt{x+4}+3)\\).</li><li>1 point: Cancel \\(x-5\\) for \\(x\\ne5\\) to obtain \\(1/(\\sqrt{x+4}+3)\\).</li><li>1 point: Evaluate as \\(1/6\\); the denominator tends to nonzero 6.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "\\(\\lim_{x\\to9}\\frac{x-9}{\\sqrt x-3}\\).",
          "rubric": "<ol><li>1 point: Rationalize with \\(\\sqrt x+3\\).</li><li>1 point: Cancel \\(x-9\\) for nearby \\(x\\ne9\\), leaving \\(\\sqrt x+3\\).</li><li>1 point: Evaluate as 6.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "\\(\\lim_{x\\to2}\\frac{1/x-1/2}{x-2}\\).",
          "rubric": "<ol><li>1 point: Combine the numerator as \\((2-x)/(2x)\\).</li><li>1 point: For nearby \\(x\\ne2\\), obtain \\(-1/(2x)\\).</li><li>1 point: Evaluate as \\(-1/4\\), with nonzero denominator limit 4.</li></ol>"
        }
      ]
    },
    {
      "id": "ap-frq3",
      "title": "Trigonometric identities",
      "group": "AP-style FRQ",
      "calculator": false,
      "context": "Angles are in radians. Use exact trigonometric identities and continuity of sine and cosine; no small-angle anchor is needed.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Find \\(\\lim_{x\\to0}\\frac{1-\\cos^2x}{\\sin x}\\).",
          "rubric": "<ol><li>1 point: Use \\(1-\\cos^2x=\\sin^2x\\).</li><li>1 point: For nearby nonzero x, the quotient is \\(\\sin x\\).</li><li>1 point: Evaluate as 0 by continuity of sine.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Find \\(\\lim_{x\\to0}\\frac{\\tan x}{\\sin x}\\).",
          "rubric": "<ol><li>1 point: Use \\(\\tan x=\\sin x/\\cos x\\).</li><li>1 point: Cancel \\(\\sin x\\) on a sufficiently small punctured neighborhood to get \\(1/\\cos x\\).</li><li>1 point: Evaluate as 1 because the denominator tends to 1.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "Find \\(\\lim_{x\\to0}\\frac{\\sin(2x)}{\\sin x}\\), and explain why a zero denominator at the target does not rule out the limit.",
          "rubric": "<ol><li>1 point: Use \\(\\sin(2x)=2\\sin x\\cos x\\).</li><li>1 point: Obtain \\(2\\cos x\\to2\\) after cancellation away from 0.</li><li>1 point: Explain that the original expression can be undefined at 0 while its nearby values approach 2.</li></ol>"
        }
      ]
    },
    {
      "id": "ch-frq1",
      "title": "Powers and common-root substitution",
      "group": "Challenge FRQ",
      "calculator": false,
      "context": "Challenge & Extra. Use algebra only. For the general result let \\(n\\ge2\\) be an integer and let a be real.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Prove \\(\\lim_{x\\to a}(x^n-a^n)/(x-a)=na^{n-1}\\). Also state the n = 1 result directly.",
          "rubric": "<ol><li>1 point: Write \\(x^n-a^n=(x-a)\\sum_{j=0}^{n-1}x^{n-1-j}a^j\\).</li><li>1 point: Cancel only for x ≠ a and apply the limit laws to the finite polynomial sum.</li><li>1 point: Count n identical limiting terms to get \\(na^{n-1}\\); for n = 1 the quotient is identically 1 away from a, so its limit is 1.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Find \\(\\lim_{x\\to2}(x^5-32)/(x^3-8)\\).",
          "rubric": "<ol><li>1 point: Factor x−2 from both power differences.</li><li>1 point: At 2 the numerator sum is \\(5\\cdot2^4=80\\); the denominator sum is \\(3\\cdot2^2=12\\).</li><li>1 point: Because the reduced denominator tends to nonzero 12, the limit is \\(20/3\\).</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "Use \\(u=x^{1/12}\\) to evaluate \\(\\lim_{x\\to1}(x^{1/4}-x^{1/3})/(x^{1/2}-1)\\).",
          "rubric": "<ol><li>1 point: Convert to \\((u^3-u^4)/(u^6-1)\\), with u → 1.</li><li>1 point: Factor \\(-u^3(u-1)\\) above and \\((u-1)(u^5+u^4+u^3+u^2+u+1)\\) below.</li><li>1 point: Cancel for u ≠ 1 and evaluate as \\(-1/6\\).</li></ol>"
        }
      ]
    },
    {
      "id": "ch-frq2",
      "title": "Synthetic division: verify the remainder",
      "group": "Challenge FRQ",
      "calculator": false,
      "context": "Challenge & Extra. Retain zero coefficients in every synthetic-division row. Let \\(P(x)=x^4+3x^3-3x-1\\) and \\(H(x)=x^4-5x^3+3x^2+9x-8\\).",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Divide P(x) by x + 1 using synthetic division, then find \\(\\lim_{x\\to-1}P(x)/(x+1)\\).",
          "rubric": "<ol><li>1 point: Use −1 with coefficients 1, 3, 0, −3, −1.</li><li>1 point: Obtain quotient \\(x^3+2x^2-2x-1\\) and remainder 0.</li><li>1 point: State equivalence for x ≠ −1 and evaluate the quotient at −1 to get 2.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Divide H(x) by x − 3. Determine both one-sided limits of H(x)/(x−3) at 3 and explain why canceling x−3 is invalid.",
          "rubric": "<ol><li>1 point: Use 3 to obtain quotient \\(x^3-2x^2-3x\\) with remainder −8.</li><li>1 point: Write \\(H(x)/(x-3)=x^3-2x^2-3x-8/(x-3)\\).</li><li>1 point: The left limit is \\(+\\infty\\) and the right limit is \\(-\\infty\\); a nonzero remainder proves x−3 is not a factor.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "Replace only the constant term of H(x) by k. Find k making x − 3 a factor, then evaluate the resulting quotient limit at 3.",
          "rubric": "<ol><li>1 point: Compute \\(H_k(3)=k\\), so k = 0 is necessary.</li><li>1 point: With k = 0 the quotient is \\(x^3-2x^2-3x\\), with remainder 0.</li><li>1 point: Evaluate at 3 to obtain 0; the quotient itself also has a factor x−3.</li></ol>"
        }
      ]
    },
    {
      "id": "ch-frq3",
      "title": "Square and cube roots",
      "group": "Challenge FRQ",
      "calculator": false,
      "context": "Challenge & Extra. Use real roots and exact rationalizing factors. A cube-root difference needs a three-term multiplier, not just a sign change.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Evaluate \\(\\lim_{x\\to0}[\\sqrt{3+\\sqrt{9+x}}-\\sqrt6]/x\\).",
          "rubric": "<ol><li>1 point: Rationalize the outer difference to get \\((\\sqrt{9+x}-3)/[x(\\sqrt{3+\\sqrt{9+x}}+\\sqrt6)]\\).</li><li>1 point: Rationalize the inner difference and cancel x for x ≠ 0.</li><li>1 point: Evaluate the reciprocal product as \\(1/(12\\sqrt6)\\).</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "For real \\(a\\ne0\\), derive \\(\\lim_{x\\to a}(\\sqrt[3]x-\\sqrt[3]a)/(x-a)\\). Then evaluate it at a = −8.",
          "rubric": "<ol><li>1 point: Let \\(u=\\sqrt[3]x,v=\\sqrt[3]a\\); use \\(x-a=(u-v)(u^2+uv+v^2)\\).</li><li>1 point: For x ≠ a the quotient is \\(1/(u^2+uv+v^2)\\).</li><li>1 point: The limit is \\(1/[3(\\sqrt[3]a)^2]\\); at a = −8 it is 1/12. The denominator is nonzero because a ≠ 0.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "Evaluate \\(\\lim_{x\\to0}[\\sqrt{1+x}+\\sqrt{1-x}-2]/x^2\\) without derivatives or series.",
          "rubric": "<ol><li>1 point: Put \\(S=\\sqrt{1+x}+\\sqrt{1-x}\\) and multiply by S + 2 to expose \\(2(\\sqrt{1-x^2}-1)\\).</li><li>1 point: Rationalize again to get \\(-2/[(S+2)(\\sqrt{1-x^2}+1)]\\) for x ≠ 0.</li><li>1 point: Evaluate as −1/4, since the denominator tends to 8.</li></ol>"
        }
      ]
    },
    {
      "id": "ch-frq4",
      "title": "Trigonometric cancellation and a moving target",
      "group": "Challenge FRQ",
      "calculator": false,
      "context": "Challenge & Extra. Angles are in radians. You may use \\(\\lim_{u\\to0}\\sin u/u=1\\), sine/cosine continuity, and trigonometric identities. The proof of the sine anchor belongs with Topic 1.8.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Derive \\(\\lim_{u\\to0}(1-\\cos u)/u^2=1/2\\) from the supplied sine anchor.",
          "rubric": "<ol><li>1 point: Use \\(1-\\cos u=2\\sin^2(u/2)\\).</li><li>1 point: Rewrite the quotient as \\(\\tfrac12[\\sin(u/2)/(u/2)]^2\\).</li><li>1 point: Apply the supplied anchor to obtain 1/2.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Evaluate \\(\\lim_{x\\to0}(\\tan(2x)-\\sin(2x))/x^3\\).",
          "rubric": "<ol><li>1 point: Use \\(\\tan u-\\sin u=\\sin u(1-\\cos u)/\\cos u\\).</li><li>1 point: With u = 2x rewrite as \\(8(\\sin u/u)((1-\\cos u)/u^2)/\\cos u\\).</li><li>1 point: Use part (a) and the anchor to obtain 4.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "For any real a, prove \\(\\lim_{x\\to a}(\\sin x-\\sin a)/(x-a)=\\cos a\\) using the sine-difference identity.",
          "rubric": "<ol><li>1 point: Use \\(\\sin x-\\sin a=2\\cos((x+a)/2)\\sin((x-a)/2)\\).</li><li>1 point: For x ≠ a, obtain \\(\\cos((x+a)/2)\\,[\\sin((x-a)/2)/((x-a)/2)]\\).</li><li>1 point: The factors tend to \\(\\cos a\\) and 1, so the product limit is \\(\\cos a\\).</li></ol>"
        }
      ]
    },
    {
      "id": "ch-frq5",
      "title": "Find the parameters",
      "group": "Challenge FRQ",
      "calculator": false,
      "context": "Challenge & Extra. Prove necessity, solve the conditions, and verify sufficiency by an exact rewrite. In part (c), angles are in radians and the sine anchor is supplied.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Find real a,b for which \\(\\lim_{x\\to2}(x^2+ax+b)/(x^2-4)=3\\).",
          "rubric": "<ol><li>1 point: Finiteness forces \\(4+2a+b=0\\).</li><li>1 point: Factor to obtain \\((x+a+2)/(x+2)\\), giving \\((a+4)/4=3\\).</li><li>1 point: Solve a = 8, b = −20 and verify \\((x^2+8x-20)/(x^2-4)=(x+10)/(x+2)\\to3\\).</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Find real p,q for which \\(\\lim_{x\\to3}(x^3+px+q)/(x-3)^2\\) is finite. Evaluate that limit without differentiating.",
          "rubric": "<ol><li>1 point: The first zero requires \\(27+3p+q=0\\); division leaves \\(x^2+3x+p+9\\).</li><li>1 point: A second zero is necessary, so \\(27+p=0\\); thus p = −27 and q = 54.</li><li>1 point: Verify \\(x^3-27x+54=(x-3)^2(x+6)\\), giving limit 9.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "Find k for which \\(\\lim_{x\\to0}[\\sin(2x)+k\\sin(5x)]/x=0\\), using \\(\\sin u/u\\to1\\).",
          "rubric": "<ol><li>1 point: Normalize as \\(2\\sin(2x)/(2x)+5k\\sin(5x)/(5x)\\).</li><li>1 point: Obtain the condition 2 + 5k = 0.</li><li>1 point: Solve k = −2/5 and substitute into the limiting expression to verify zero.</li></ol>"
        }
      ]
    },
    {
      "id": "ch-frq6",
      "title": "Prove the product bound",
      "group": "Challenge FRQ",
      "calculator": false,
      "context": "Challenge & Extra · the requested inequality. Let a,b be real. Suppose \\(\\displaystyle\\lim_{x\\to3}\\frac{x+3}{x^2+ax+b}\\) does not exist as a finite real number. Prove \\(ab<27/2\\) using the squaring method in parts (a)–(b). Part (c) is an optional extension investigating the sharper bound.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Prove \\(9+3a+b=0\\), then write this as \\(3a+b=-9\\).",
          "rubric": "<ol><li>1 point: The numerator tends to 6.</li><li>1 point: If \\(9+3a+b\\ne0\\), substitution would give the finite real limit \\(6/(9+3a+b)\\), contradicting the premise.</li><li>1 point: Thus \\(9+3a+b=0\\), which rearranges to \\(3a+b=-9\\).</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Square \\(3a+b=-9\\). Use the resulting equation and a strictly positive sum of squares to prove \\(ab<27/2\\).",
          "rubric": "<ol><li>1 point: Squaring gives \\(9a^2+6ab+b^2=81\\).</li><li>1 point: The equation \\(3a+b=-9\\) prevents a and b from both being zero, so \\(81-6ab=9a^2+b^2>0\\).</li><li>1 point: Thus \\(6ab<81\\). Divide by positive 6 to conclude \\(ab<81/6=27/2\\).</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "Optional extension: complete the square to find the sharp upper bound on ab. Is strict \\(ab<27/4\\) always true? Verify the equality pair using both one-sided limits.",
          "rubric": "<ol><li>1 point: Use b = −9−3a to obtain \\(ab=-3a^2-9a=27/4-3(a+3/2)^2\\le27/4\\).</li><li>1 point: Equality occurs at a = −3/2, b = −9/2, so the proposed strict bound is false if this pair satisfies the premise.</li><li>1 point: For this pair the denominator is \\((x-3)(x+3/2)\\), with positive second factor near 3. The left limit is \\(-\\infty\\) and the right limit is \\(+\\infty\\), so the pair does satisfy the premise.</li></ol>"
        }
      ]
    }
  ]
};if(typeof module!=="undefined"&&module.exports)module.exports=data;else root.LimitLessonQuestions=data;})(typeof window!=="undefined"?window:globalThis);
