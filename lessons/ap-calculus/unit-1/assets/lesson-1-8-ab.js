/* Original ECHS AP Calculus AB lesson content. */
(function(root){const data={
  "number": "1.8",
  "title": "Determining Limits Using the Squeeze Theorem",
  "subtitle": "Check the inequalities and the bounding limits before drawing a conclusion.",
  "objective": "Determine a limit by verifying a valid local bound and a common limit for the two bounding functions.",
  "lo": "LIM-1.E",
  "ek": "LIM-1.E.2",
  "skill": "3.C",
  "goals": [
    "State the local inequality and common-limit hypotheses of the squeeze theorem.",
    "Construct bounds for bounded factors multiplied by a quantity tending to zero.",
    "Recognize when given bounds are inconclusive or apply from only one side.",
    "Use radians and standard trigonometric limits with correct scaling."
  ],
  "ideas": [
    {
      "title": "Two hypotheses make a squeeze argument",
      "body": "<p>Suppose \\(a(x)\\le f(x)\\le b(x)\\) for every sufficiently close input to \\(c\\), except possibly \\(c\\) itself. If \\(\\lim_{x\\to c}a(x)=\\lim_{x\\to c}b(x)=L\\), then the squeeze theorem gives \\(\\lim_{x\\to c}f(x)=L\\). The two outer functions trap the middle function into the same limiting height.</p><p>A complete argument names the bounds, establishes the local inequality, and computes the <em>same</em> finite limit for both outer functions. Their actual values at \\(c\\) do not matter. A one-sided neighborhood gives a one-sided conclusion. To claim a two-sided limit, your bounds must cover both directions, or you must justify both one-sided limits separately.</p>"
    },
    {
      "title": "Build useful bounds from absolute values",
      "body": "<p>Since \\(-1\\le\\sin u\\le1\\), multiplying by \\(x^2\\ge0\\) gives \\(-x^2\\le x^2\\sin(1/x)\\le x^2\\) for \\(x\\ne0\\). Both bounds tend to \\(0\\), so the product has limit \\(0\\), even though \\(\\sin(1/x)\\) itself keeps oscillating.</p><p>Absolute values avoid sign mistakes. If \\(|r(x)|\\le M\\), then \\(|x\\,r(x)|\\le M|x|\\), giving \\(-M|x|\\le xr(x)\\le M|x|\\). Do not multiply an inequality by an expression of unknown sign without checking whether the order reverses. An error bound \\(|f(x)-L|\\le k|x-c|\\) is already a squeeze: the error shrinks to zero as \\(x\\to c\\).</p>"
    },
    {
      "title": "Know exactly when the evidence is inconclusive",
      "body": "<p>If the lower and upper bounds approach different numbers, those bounds alone do not determine the middle function's limit. For example, \\(1\\le f(x)\\le3\\) permits the constant functions \\(1\\), \\(2\\), and \\(3\\), and it also permits oscillation with no limit. Different outer limits do not prove that the middle limit fails to exist.</p><p>A matching value at the target is not a matching limit. Likewise, inequalities verified at a finite list of sampled inputs do not establish an inequality throughout a neighborhood. Check the stated domain, direction of approach, and whether both functions really are bounds before applying the theorem. Better bounds may succeed when the first pair does not.</p>"
    },
    {
      "title": "Squeeze explains the basic trigonometric anchor",
      "body": "<p>Angles must be in radians. Unit-circle area comparisons give \\(\\sin x\\le x\\le\\tan x\\) for \\(0<x<\\pi/2\\). Rearranging gives \\(\\cos x\\le\\sin x/x\\le1\\). Because the outer limits are \\(1\\), the right-hand limit is \\(1\\). The ratio \\(\\sin x/x\\) is even, so the left-hand limit agrees: \\(\\lim_{x\\to0}\\sin x/x=1\\).</p><p>Match the angle to the denominator: \\(\\sin(5x)/(2x)=(5/2)[\\sin(5x)/(5x)]\\to5/2\\). With the identity \\(1-\\cos x=\\sin^2x/(1+\\cos x)\\), write \\((1-\\cos x)/x=(\\sin x/x)\\,[\\sin x/(1+\\cos x)]\\to0\\). State the identities and limit laws; \\(0/0\\) by itself does not supply either result.</p>"
    }
  ],
  "workedExamples": [
    {
      "title": "A shifted squeeze with an undefined or reassigned center",
      "body": "<p>Suppose \\(f\\) is defined for \\(0<|x-2|<1\\) and satisfies \\(5-3(x-2)^2\\le f(x)\\le5+|x-2|\\). Find \\(\\lim_{x\\to2}f(x)\\).</p><p>The premise gives the inequality for every input in a two-sided punctured neighborhood. The lower bound tends to \\(5-3(0)^2=5\\); the upper bound tends to \\(5+0=5\\). Therefore the squeeze theorem gives \\(\\lim_{x\\to2}f(x)=5\\).</p><p>The theorem does not require knowing a formula for \\(f\\), its monotonicity, or its value at \\(2\\). Defining \\(f(2)=20\\) would preserve the limit. Replacing the upper bound with the constant \\(8\\) would make this particular pair of bounds inconclusive, because their limits would then be \\(5\\) and \\(8\\).</p>"
    },
    {
      "title": "An oscillating factor can still produce a settled limit",
      "body": "<p>Find \\(\\lim_{x\\to0}[3+x\\cos(1/x)]\\). It is not valid to multiply the limit of \\(x\\) by a nonexistent limit of \\(\\cos(1/x)\\). Instead, use the bound \\(|\\cos(1/x)|\\le1\\).</p><p>It follows that \\(|x\\cos(1/x)|\\le|x|\\), so \\(3-|x|\\le3+x\\cos(1/x)\\le3+|x|\\). Both bounding functions tend to \\(3\\); therefore the desired limit is \\(3\\).</p><p>The absolute value matters: writing \\(-x\\le x\\cos(1/x)\\le x\\) would be invalid for negative \\(x\\), because the proposed lower bound would exceed the upper bound. The correct bounds handle both sides at once and prove the result despite infinitely many oscillations.</p>"
    }
  ],
  "questions": [
    {
      "topic": "1.8",
      "lo": "LIM-1.E",
      "skill": "3.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "g1",
      "type": "mcq",
      "group": "Guided check",
      "prompt": "For all \\(x\\) sufficiently close to \\(2\\), except \\(2\\), \\(a(x)\\le f(x)\\le b(x)\\). What additional information allows the squeeze theorem to prove \\(\\lim_{x\\to2}f(x)=5\\)?",
      "choices": [
        "\\(a(2)=b(2)=5\\).",
        "\\(\\lim_{x\\to2}a(x)=\\lim_{x\\to2}b(x)=5\\).",
        "\\(f(2)=5\\).",
        "Both bounds have some finite limit, possibly different."
      ],
      "answer": 1,
      "hint": "The hypotheses concern nearby limits, not assigned point values.",
      "solution": "The outer functions must both tend to \\(5\\), and the given local inequality must hold. Equal values at \\(x=2\\) alone do not establish this.",
      "representation": "analytical"
    },
    {
      "topic": "1.8",
      "lo": "LIM-1.E",
      "skill": "3.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "g2",
      "type": "number",
      "group": "Guided check",
      "prompt": "For \\(0<|x|<1\\), \\(6-2x^2\\le f(x)\\le6+3x^2\\). Find \\(\\lim_{x\\to0}f(x)\\).",
      "answer": 6,
      "unit": "exact value",
      "hint": "Compute each bounding limit.",
      "solution": "The lower and upper limits are both \\(6\\). The squeeze theorem gives \\(\\lim_{x\\to0}f(x)=6\\).",
      "representation": "analytical"
    },
    {
      "topic": "1.8",
      "lo": "LIM-1.E",
      "skill": "3.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "g3",
      "type": "mcq",
      "group": "Guided check",
      "prompt": "For \\(x\\ne0\\) near zero, \\(1\\le h(x)\\le4\\). Which conclusion follows from these bounds alone?",
      "choices": [
        "\\(\\lim_{x\\to0}h(x)=5/2\\).",
        "The limit cannot exist.",
        "\\(\\lim_{x\\to0}h(x)=1\\).",
        "The bounds do not determine whether h has a limit or what that limit is."
      ],
      "answer": 3,
      "hint": "Try two constant functions satisfying the same bounds.",
      "solution": "The functions \\(h(x)=1\\) and \\(h(x)=4\\) satisfy the bounds but have different limits. Also \\(h(x)=5/2+\\sin(1/x)\\) satisfies them and has no limit. The bounds alone are inconclusive.",
      "representation": "analytical"
    },
    {
      "topic": "1.8",
      "lo": "LIM-1.E",
      "skill": "3.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "g4",
      "type": "number",
      "group": "Guided check",
      "prompt": "Evaluate \\(\\lim_{x\\to0}x^2\\cos(1/x)\\).",
      "answer": 0,
      "unit": "exact value",
      "hint": "Trap cosine between −1 and 1.",
      "solution": "Since \\(x^2\\ge0\\), \\(-x^2\\le x^2\\cos(1/x)\\le x^2\\). Both bounds tend to \\(0\\), giving a limit of \\(0\\).",
      "representation": "analytical"
    },
    {
      "topic": "1.8",
      "lo": "LIM-1.E",
      "skill": "3.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "ap1",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "For every \\(x\\ne1\\) near \\(1\\), \\(4-2(x-1)^2\\le f(x)\\le4+3|x-1|\\). Then \\(\\lim_{x\\to1}[2f(x)-3]=\\)",
      "choices": [
        "\\(1\\)",
        "\\(4\\)",
        "\\(5\\)",
        "\\(8\\)"
      ],
      "answer": 2,
      "hint": "First squeeze f, then apply the linear limit laws.",
      "solution": "Both bounds on \\(f\\) tend to \\(4\\), so \\(f(x)\\to4\\). Consequently \\(2f(x)-3\\to8-3=5\\).",
      "representation": "analytical"
    },
    {
      "topic": "1.8",
      "lo": "LIM-1.E",
      "skill": "3.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "ap2",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Which valid two-sided bound proves \\(\\lim_{x\\to0}x\\sin(1/x)=0\\)?",
      "choices": [
        "\\(-|x|\\le x\\sin(1/x)\\le|x|\\)",
        "\\(-x\\le x\\sin(1/x)\\le x\\) for all \\(x\\ne0\\)",
        "\\(0\\le x\\sin(1/x)\\le x^2\\)",
        "\\(-1\\le x\\sin(1/x)\\le1\\), whose outer limits both equal zero"
      ],
      "answer": 0,
      "hint": "Use a bound that stays correctly ordered for negative x.",
      "solution": "The absolute bound \\(|x\\sin(1/x)|\\le|x|\\) is valid on both sides, and \\(\\pm|x|\\to0\\). The \\(\\pm x\\) order fails on the negative side; the constant bounds do not have zero limits.",
      "representation": "analytical"
    },
    {
      "topic": "1.8",
      "lo": "LIM-1.E",
      "skill": "3.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "ap3",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Suppose \\(a(x)\\le f(x)\\le b(x)\\) near \\(3\\). The table gives established limits, not sampled function values. Which statement must be true?<table><caption>Known bounding-function limits</caption><thead><tr><th scope=\"col\">Function</th><th scope=\"col\">Limit as x approaches 3</th></tr></thead><tbody><tr><th scope=\"row\">a</th><td>2</td></tr><tr><th scope=\"row\">b</th><td>5</td></tr></tbody></table>",
      "choices": [
        "\\(\\lim_{x\\to3}f(x)=7/2\\).",
        "The limit of f does not exist.",
        "The limit of f equals one of the bounding limits.",
        "These bounds alone cannot determine a unique limit of f."
      ],
      "answer": 3,
      "hint": "The squeeze theorem needs matching outer limits.",
      "solution": "Any constant between \\(2\\) and \\(5\\) can occur as a middle function when the bounds are the constants \\(2\\) and \\(5\\). Thus no unique value or nonexistence conclusion follows from the stated bounds.",
      "representation": "tabular and analytical"
    },
    {
      "topic": "1.8",
      "lo": "LIM-1.E",
      "skill": "3.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "ap4",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Assume \\(|f(x)+2|\\le5|x-4|\\) for \\(0<|x-4|<1\\). What is \\(\\lim_{x\\to4}f(x)\\)?",
      "choices": [
        "\\(2\\)",
        "\\(-2\\)",
        "\\(0\\)",
        "Cannot be determined"
      ],
      "answer": 1,
      "hint": "The quantity inside the absolute value measures distance from which number?",
      "solution": "Rewrite as \\(-2-5|x-4|\\le f(x)\\le-2+5|x-4|\\). Both outer functions tend to \\(-2\\), so \\(f(x)\\to-2\\).",
      "representation": "analytical"
    },
    {
      "topic": "1.8",
      "lo": "LIM-1.E",
      "skill": "3.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "ap5",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "The two continuous bounding curves \\(a\\) and \\(b\\) are graphed, and \\(a(x)\\le f(x)\\le b(x)\\) for all nearby \\(x\\ne0\\). What is \\(\\lim_{x\\to0}f(x)\\)?",
      "choices": [
        "\\(0\\)",
        "\\(1\\)",
        "\\(2\\)",
        "The limit cannot be inferred without f(0)."
      ],
      "answer": 2,
      "hint": "Read the common height approached by both bounds at x = 0.",
      "solution": "Both graphed bounds approach \\(2\\) as \\(x\\to0\\). The given inequality holds throughout a punctured neighborhood, so the squeeze theorem gives \\(2\\), independently of \\(f(0)\\).",
      "representation": "graphical",
      "visual": {
        "xMin": -1.5,
        "xMax": 1.5,
        "yMin": -1,
        "yMax": 5,
        "paths": [
          [
            [
              -1.5,
              -0.25
            ],
            [
              -1.45,
              -0.10250000000000004
            ],
            [
              -1.4,
              0.04000000000000026
            ],
            [
              -1.35,
              0.17749999999999977
            ],
            [
              -1.3,
              0.30999999999999983
            ],
            [
              -1.25,
              0.4375
            ],
            [
              -1.2,
              0.56
            ],
            [
              -1.15,
              0.6775000000000002
            ],
            [
              -1.1,
              0.7899999999999998
            ],
            [
              -1.05,
              0.8975
            ],
            [
              -1,
              1
            ],
            [
              -0.95,
              1.0975000000000001
            ],
            [
              -0.9,
              1.19
            ],
            [
              -0.85,
              1.2775
            ],
            [
              -0.8,
              1.3599999999999999
            ],
            [
              -0.75,
              1.4375
            ],
            [
              -0.7,
              1.51
            ],
            [
              -0.65,
              1.5775
            ],
            [
              -0.6,
              1.6400000000000001
            ],
            [
              -0.55,
              1.6975
            ],
            [
              -0.5,
              1.75
            ],
            [
              -0.44999999999999996,
              1.7975
            ],
            [
              -0.3999999999999999,
              1.84
            ],
            [
              -0.3500000000000001,
              1.8775
            ],
            [
              -0.30000000000000004,
              1.91
            ],
            [
              -0.25,
              1.9375
            ],
            [
              -0.19999999999999996,
              1.96
            ],
            [
              -0.1499999999999999,
              1.9775
            ],
            [
              -0.10000000000000009,
              1.99
            ],
            [
              -0.050000000000000044,
              1.9975
            ],
            [
              0,
              2
            ],
            [
              0.050000000000000044,
              1.9975
            ],
            [
              0.10000000000000009,
              1.99
            ],
            [
              0.1499999999999999,
              1.9775
            ],
            [
              0.19999999999999996,
              1.96
            ],
            [
              0.25,
              1.9375
            ],
            [
              0.30000000000000004,
              1.91
            ],
            [
              0.3500000000000001,
              1.8775
            ],
            [
              0.3999999999999999,
              1.84
            ],
            [
              0.44999999999999996,
              1.7975
            ],
            [
              0.5,
              1.75
            ],
            [
              0.5499999999999998,
              1.6975000000000002
            ],
            [
              0.6000000000000001,
              1.64
            ],
            [
              0.6499999999999999,
              1.5775000000000001
            ],
            [
              0.7000000000000002,
              1.5099999999999998
            ],
            [
              0.75,
              1.4375
            ],
            [
              0.7999999999999998,
              1.3600000000000003
            ],
            [
              0.8500000000000001,
              1.2774999999999999
            ],
            [
              0.8999999999999999,
              1.1900000000000002
            ],
            [
              0.9500000000000002,
              1.0974999999999997
            ],
            [
              1,
              1
            ],
            [
              1.0499999999999998,
              0.8975000000000004
            ],
            [
              1.1,
              0.7899999999999998
            ],
            [
              1.15,
              0.6775000000000002
            ],
            [
              1.2000000000000002,
              0.5599999999999996
            ],
            [
              1.25,
              0.4375
            ],
            [
              1.2999999999999998,
              0.3100000000000005
            ],
            [
              1.35,
              0.17749999999999977
            ],
            [
              1.4,
              0.04000000000000026
            ],
            [
              1.4500000000000002,
              -0.10250000000000048
            ],
            [
              1.5,
              -0.25
            ]
          ],
          [
            [
              -1.5,
              4.25
            ],
            [
              -1.45,
              4.1025
            ],
            [
              -1.4,
              3.96
            ],
            [
              -1.35,
              3.8225000000000002
            ],
            [
              -1.3,
              3.6900000000000004
            ],
            [
              -1.25,
              3.5625
            ],
            [
              -1.2,
              3.44
            ],
            [
              -1.15,
              3.3225
            ],
            [
              -1.1,
              3.21
            ],
            [
              -1.05,
              3.1025
            ],
            [
              -1,
              3
            ],
            [
              -0.95,
              2.9025
            ],
            [
              -0.9,
              2.81
            ],
            [
              -0.85,
              2.7225
            ],
            [
              -0.8,
              2.64
            ],
            [
              -0.75,
              2.5625
            ],
            [
              -0.7,
              2.4899999999999998
            ],
            [
              -0.65,
              2.4225
            ],
            [
              -0.6,
              2.36
            ],
            [
              -0.55,
              2.3025
            ],
            [
              -0.5,
              2.25
            ],
            [
              -0.44999999999999996,
              2.2025
            ],
            [
              -0.3999999999999999,
              2.16
            ],
            [
              -0.3500000000000001,
              2.1225
            ],
            [
              -0.30000000000000004,
              2.09
            ],
            [
              -0.25,
              2.0625
            ],
            [
              -0.19999999999999996,
              2.04
            ],
            [
              -0.1499999999999999,
              2.0225
            ],
            [
              -0.10000000000000009,
              2.0100000000000002
            ],
            [
              -0.050000000000000044,
              2.0025
            ],
            [
              0,
              2
            ],
            [
              0.050000000000000044,
              2.0025
            ],
            [
              0.10000000000000009,
              2.0100000000000002
            ],
            [
              0.1499999999999999,
              2.0225
            ],
            [
              0.19999999999999996,
              2.04
            ],
            [
              0.25,
              2.0625
            ],
            [
              0.30000000000000004,
              2.09
            ],
            [
              0.3500000000000001,
              2.1225
            ],
            [
              0.3999999999999999,
              2.16
            ],
            [
              0.44999999999999996,
              2.2025
            ],
            [
              0.5,
              2.25
            ],
            [
              0.5499999999999998,
              2.3024999999999998
            ],
            [
              0.6000000000000001,
              2.3600000000000003
            ],
            [
              0.6499999999999999,
              2.4225
            ],
            [
              0.7000000000000002,
              2.49
            ],
            [
              0.75,
              2.5625
            ],
            [
              0.7999999999999998,
              2.6399999999999997
            ],
            [
              0.8500000000000001,
              2.7225
            ],
            [
              0.8999999999999999,
              2.8099999999999996
            ],
            [
              0.9500000000000002,
              2.9025000000000003
            ],
            [
              1,
              3
            ],
            [
              1.0499999999999998,
              3.1024999999999996
            ],
            [
              1.1,
              3.21
            ],
            [
              1.15,
              3.3225
            ],
            [
              1.2000000000000002,
              3.4400000000000004
            ],
            [
              1.25,
              3.5625
            ],
            [
              1.2999999999999998,
              3.6899999999999995
            ],
            [
              1.35,
              3.8225000000000002
            ],
            [
              1.4,
              3.96
            ],
            [
              1.4500000000000002,
              4.102500000000001
            ],
            [
              1.5,
              4.25
            ]
          ]
        ],
        "open": [],
        "closed": [
          [
            0,
            2
          ]
        ],
        "caption": "Lower bound a(x) = 2 − x² and upper bound b(x) = 2 + x². Both are continuous and meet at (0, 2)."
      }
    },
    {
      "topic": "1.8",
      "lo": "LIM-1.E",
      "skill": "3.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "ap6",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "For \\(-1<x<0\\), \\(7-x^2\\le f(x)\\le7+x^2\\). No information is given for \\(x>0\\). Which conclusion is guaranteed?",
      "choices": [
        "\\(\\lim_{x\\to0^-}f(x)=7\\)",
        "\\(\\lim_{x\\to0}f(x)=7\\)",
        "\\(f(0)=7\\)",
        "\\(\\lim_{x\\to0^+}f(x)=7\\)"
      ],
      "answer": 0,
      "hint": "The stated inequalities hold only on the left.",
      "solution": "On the left, both bounds approach \\(7\\), so the left-hand squeeze gives \\(7\\). The right side and the point value remain unrestricted.",
      "representation": "analytical"
    },
    {
      "topic": "1.8",
      "lo": "LIM-1.E",
      "skill": "3.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "ap7",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Angles are in radians. \\(\\lim_{x\\to0}\\frac{\\sin(5x)}{2x}=\\)",
      "choices": [
        "\\(2/5\\)",
        "\\(5/2\\)",
        "\\(1\\)",
        "\\(0\\)"
      ],
      "answer": 1,
      "hint": "Introduce 5x in the denominator of the sine ratio.",
      "solution": "Write \\(\\sin(5x)/(2x)=(5/2)[\\sin(5x)/(5x)]\\). The bracket tends to \\(1\\), so the limit is \\(5/2\\).",
      "representation": "analytical"
    },
    {
      "topic": "1.8",
      "lo": "LIM-1.E",
      "skill": "3.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "ap8",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Angles are in radians. \\(\\lim_{x\\to0}\\frac{1-\\cos x}{x}=\\)",
      "choices": [
        "\\(1\\)",
        "\\(-1\\)",
        "DNE",
        "\\(0\\)"
      ],
      "answer": 3,
      "hint": "Use \\(1-\\cos x=\\sin^2x/(1+\\cos x)\\).",
      "solution": "The quotient becomes \\((\\sin x/x)\\,[\\sin x/(1+\\cos x)]\\). Its factors tend to \\(1\\) and \\(0/2\\), so the product tends to \\(0\\).",
      "representation": "analytical"
    },
    {
      "topic": "1.8",
      "lo": "LIM-1.E",
      "skill": "3.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "ap9",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "A student verifies \\(3-x^2\\le f(x)\\le3+x^2\\) only at \\(x=\\pm0.1,\\pm0.01,\\pm0.001\\), then invokes squeeze. Which missing condition is essential?",
      "choices": [
        "f must be a polynomial.",
        "f must have a value at zero.",
        "The inequalities must hold for every sufficiently close nonzero input, not only the sampled inputs.",
        "The upper and lower bounds must be constant."
      ],
      "answer": 2,
      "hint": "The theorem controls a neighborhood, not a finite list.",
      "solution": "A finite sample leaves other nearby values unconstrained. A valid squeeze requires the inequalities throughout a punctured neighborhood and matching outer limits.",
      "representation": "tabular"
    },
    {
      "topic": "1.8",
      "lo": "LIM-1.E",
      "skill": "3.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "ap10",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Let \\(r(x)\\) satisfy \\(-4\\le r(x)\\le6\\) for all \\(x\\ne2\\) near \\(2\\). What is \\(\\lim_{x\\to2}(x-2)^2r(x)\\)?",
      "choices": [
        "\\(0\\)",
        "\\(2\\)",
        "DNE because r need not have a limit.",
        "Cannot be determined without r(2)."
      ],
      "answer": 0,
      "hint": "Multiply the bounds by the nonnegative square.",
      "solution": "The product is bounded below by \\(-4(x-2)^2\\) and above by \\(6(x-2)^2\\). Both tend to zero, so the product limit is \\(0\\). No limit for \\(r\\) is required.",
      "representation": "analytical"
    },
    {
      "topic": "1.8",
      "lo": "LIM-1.E",
      "skill": "3.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "ap11",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "For \\(0<|x|<1\\), \\(a(x)=1-x^2\\le f(x)\\le1+x^2=b(x)\\), but \\(a(0)=4\\) and \\(b(0)=-3\\) are assigned separately. Which conclusion is correct?",
      "choices": [
        "Squeeze fails because a(0) exceeds b(0).",
        "\\(\\lim_{x\\to0}f(x)=1\\), because the bounds and their limits apply away from zero.",
        "\\(\\lim_{x\\to0}f(x)=1/2\\), the average assigned value.",
        "The two-sided limit cannot exist."
      ],
      "answer": 1,
      "hint": "The target itself is excluded from the required inequality.",
      "solution": "For all nonzero nearby inputs the bounds are valid and both tend to \\(1\\). Their reassigned values at zero do not affect those limits or the squeeze conclusion.",
      "representation": "analytical"
    },
    {
      "topic": "1.8",
      "lo": "LIM-1.E",
      "skill": "3.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "ap12",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Suppose \\(|g(x)-3|\\le(x-1)^2\\) for \\(0<|x-1|<1\\). What must be true about \\(\\lim_{x\\to1}\\frac{g(x)-3}{x-1}\\)?",
      "choices": [
        "It equals \\(3\\).",
        "It does not exist because the denominator tends to zero.",
        "It cannot be determined from the bound.",
        "It equals \\(0\\)."
      ],
      "answer": 3,
      "hint": "Bound the absolute value of the entire quotient.",
      "solution": "For \\(x\\ne1\\), \\(\\left|(g(x)-3)/(x-1)\\right|\\le(x-1)^2/|x-1|=|x-1|\\). Squeezing between \\(\\pm|x-1|\\) gives the limit \\(0\\).",
      "representation": "analytical"
    }
  ],
  "frqs": [
    {
      "topic": "1.8",
      "lo": "LIM-1.E",
      "skill": "3.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "frq1",
      "representation": "analytical and verbal",
      "context": "For all \\(x\\) satisfying \\(0<|x-1|<1\\), a function \\(f\\) obeys \\(2-3(x-1)^2\\le f(x)\\le2+|x-1|\\). Its assigned value is \\(f(1)=8\\).",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Determine \\(\\lim_{x\\to1}f(x)\\). Justify every hypothesis you use.",
          "rubric": "<ol><li>1 point: State that the given inequality holds for every input in a two-sided punctured neighborhood of \\(1\\).</li><li>1 point: Compute both bounding limits as \\(2\\).</li><li>1 point: Apply the squeeze theorem to conclude \\(\\lim_{x\\to1}f(x)=2\\).</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Find \\(\\lim_{x\\to1}[f(x)^2-3f(x)]\\), and explain why \\(f(1)=8\\) does not enter the calculation.",
          "rubric": "<ol><li>1 point: Use part (a) and the power law to obtain \\(f(x)^2\\to4\\).</li><li>1 point: Apply the linear combination law to obtain \\(4-6=-2\\).</li><li>1 point: Explain that an isolated assigned value does not change nearby limiting behavior.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "If the only available bounds were \\(2-3(x-1)^2\\le f(x)\\le5+(x-1)^2\\), would they determine a unique limit? Justify using two examples of middle functions.",
          "rubric": "<ol><li>1 point: Compute the lower and upper limits as \\(2\\) and \\(5\\), so squeeze does not identify one value.</li><li>1 point: Give one valid example such as \\(f(x)=2\\), which satisfies both bounds near \\(1\\) and tends to \\(2\\).</li><li>1 point: Give a second example such as \\(f(x)=5\\), satisfying the same bounds but tending to \\(5\\); conclude the limit is not uniquely determined.</li></ol>"
        }
      ]
    },
    {
      "topic": "1.8",
      "lo": "LIM-1.E",
      "skill": "3.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "frq2",
      "representation": "analytical",
      "context": "For \\(x\\ne0\\), let \\(p(x)=x\\sin(1/x)\\). All trigonometric angles in this question are measured in radians.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Prove \\(\\lim_{x\\to0}p(x)=0\\) by a valid two-sided squeeze.",
          "rubric": "<ol><li>1 point: Use \\(|\\sin(1/x)|\\le1\\) to obtain \\(|p(x)|\\le|x|\\).</li><li>1 point: State the ordered bounds \\(-|x|\\le p(x)\\le|x|\\) and show both approach \\(0\\).</li><li>1 point: Apply squeeze to conclude the two-sided limit is \\(0\\).</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Using \\(\\lim_{u\\to0}\\sin u/u=1\\), evaluate \\(\\lim_{x\\to0}\\frac{\\sin(4x)}{3x}\\). Show the scaling.",
          "rubric": "<ol><li>1 point: Rewrite the quotient as \\((4/3)[\\sin(4x)/(4x)]\\) for \\(x\\ne0\\).</li><li>1 point: Note \\(u=4x\\to0\\), so the bracket tends to \\(1\\).</li><li>1 point: Conclude the limit is \\(4/3\\).</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "A student tries to prove part (a) with \\(-x\\le p(x)\\le x\\) for every nearby \\(x\\ne0\\). Explain the defect and supply a corrected bound for negative inputs.",
          "rubric": "<ol><li>1 point: Observe that for \\(x<0\\), the proposed lower bound \\(-x\\) is greater than the proposed upper bound \\(x\\).</li><li>1 point: Explain that multiplication of \\(-1\\le\\sin(1/x)\\le1\\) by negative \\(x\\) reverses the inequalities.</li><li>1 point: Give the correct negative-input bound \\(x\\le p(x)\\le-x\\), equivalent to \\(-|x|\\le p(x)\\le|x|\\).</li></ol>"
        }
      ]
    }
  ]
};
if(typeof module==='object'&&module.exports)module.exports=data;root.Unit1Lesson=data;
})(typeof window!=='undefined'?window:globalThis);
