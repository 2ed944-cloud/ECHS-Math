/* Original ECHS classroom practice; not official exam items. */
(function(root){const data={
  "questions": [
    {
      "id": "launch",
      "type": "mcq",
      "group": "Opening prediction",
      "prompt": "<figure><div data-plot=\"hole\"></div><figcaption>Read the numbered axes and the open and filled points. The drawing shows the stated branch behavior.</figcaption></figure>Estimate \\(\\lim_{x\\to1}f(x)\\).",
      "choices": [
        "1",
        "3",
        "6",
        "DNE"
      ],
      "answer": 1,
      "hint": "Trace the curve toward x = 1 from both sides; the filled point answers f(1).",
      "solution": "Both branches approach height 3, so \\(\\lim_{x\\to1}f(x)=3\\). The point value is 6."
    },
    {
      "id": "read-left",
      "type": "number",
      "group": "Guided practice",
      "prompt": "For the displayed graph, state \\(\\lim_{x\\to1^-}f(x)\\).",
      "answer": 3,
      "hint": "Use the branch for a limit and the filled point for a function value.",
      "solution": "The left and right branches both approach 3, while the filled point gives \\(f(1)=6\\). Thus the two-sided limit is 3 and the point value is 6.",
      "unit": "number, DNE, undefined or ±infinity",
      "tolerance": 1e-06
    },
    {
      "id": "read-right",
      "type": "number",
      "group": "Guided practice",
      "prompt": "State \\(\\lim_{x\\to1^+}f(x)\\).",
      "answer": 3,
      "hint": "Use the branch for a limit and the filled point for a function value.",
      "solution": "The left and right branches both approach 3, while the filled point gives \\(f(1)=6\\). Thus the two-sided limit is 3 and the point value is 6.",
      "unit": "number, DNE, undefined or ±infinity",
      "tolerance": 1e-06
    },
    {
      "id": "read-both",
      "type": "number",
      "group": "Guided practice",
      "prompt": "State \\(\\lim_{x\\to1}f(x)\\).",
      "answer": 3,
      "hint": "Use the branch for a limit and the filled point for a function value.",
      "solution": "The left and right branches both approach 3, while the filled point gives \\(f(1)=6\\). Thus the two-sided limit is 3 and the point value is 6.",
      "unit": "number, DNE, undefined or ±infinity",
      "tolerance": 1e-06
    },
    {
      "id": "read-point",
      "type": "number",
      "group": "Guided practice",
      "prompt": "State \\(f(1)\\).",
      "answer": 6,
      "hint": "Use the branch for a limit and the filled point for a function value.",
      "solution": "The left and right branches both approach 3, while the filled point gives \\(f(1)=6\\). Thus the two-sided limit is 3 and the point value is 6.",
      "unit": "number, DNE, undefined or ±infinity",
      "tolerance": 1e-06
    },
    {
      "id": "endpoint-check",
      "type": "number",
      "group": "Guided practice",
      "prompt": "<figure><div data-plot=\"endpoint\"></div><figcaption>Read the numbered axes and the open and filled points. The drawing shows the stated branch behavior.</figcaption></figure>State \\(\\lim_{x\\to0^+}f(x)\\).",
      "answer": 0,
      "hint": "Follow the available branch through positive inputs toward 0.",
      "solution": "The right-hand branch approaches height 0. No negative-input branch is given, so do not infer a left-hand limit.",
      "unit": "number, DNE, undefined or ±infinity",
      "tolerance": 1e-06
    },
    {
      "id": "ap01",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "<figure><div data-plot=\"hole\"></div><figcaption>Read the numbered axes and the open and filled points. The drawing shows the stated branch behavior.</figcaption></figure>Which pair correctly gives \\(\\lim_{x\\to1}f(x)\\) and \\(f(1)\\), in that order?",
      "choices": [
        "(6, 3)",
        "(1, 6)",
        "(3, 6)",
        "(DNE, 6)"
      ],
      "answer": 2,
      "hint": "Read the approaching curve separately from the filled point.",
      "solution": "Both branches approach 3; the filled point is at height 6. An open circle does not force the limit to fail."
    },
    {
      "id": "ap02",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "<figure><div data-plot=\"missing\"></div><figcaption>Read the numbered axes and the open and filled points. The drawing shows the stated branch behavior.</figcaption></figure>Which statement describes the graph at \\(x=-1\\)?",
      "choices": [
        "The limit is 2 and f(−1) is undefined.",
        "The limit is undefined because there is a hole.",
        "The limit is −1 and f(−1) is 2.",
        "The limit and the point value are both 2."
      ],
      "answer": 0,
      "hint": "A hole removes the value at the target, but leaves the nearby branches.",
      "solution": "Both sides approach 2. There is no filled point at x = −1, so \\(f(-1)\\) is undefined."
    },
    {
      "id": "ap03",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "<figure><div data-plot=\"jump\"></div><figcaption>Read the numbered axes and the open and filled points. The drawing shows the stated branch behavior.</figcaption></figure>What is \\(\\lim_{x\\to2^+}f(x)\\)?",
      "choices": [
        "1",
        "2",
        "3",
        "4"
      ],
      "answer": 3,
      "hint": "Approach x = 2 through inputs greater than 2.",
      "solution": "The right-hand branch approaches height 4. The other branch and the assigned point have different roles."
    },
    {
      "id": "ap04",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "<figure><div data-plot=\"jump\"></div><figcaption>Read the numbered axes and the open and filled points. The drawing shows the stated branch behavior.</figcaption></figure>What is \\(\\lim_{x\\to2}f(x)\\)?",
      "choices": [
        "2.5",
        "DNE",
        "3",
        "4"
      ],
      "answer": 1,
      "hint": "Compare the two one-sided limits; do not average them.",
      "solution": "The one-sided limits are 1 and 4. Because they disagree, the two-sided limit does not exist. Neither the average 2.5 nor f(2) = 3 fixes that mismatch."
    },
    {
      "id": "ap05",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "<figure><div data-plot=\"negative\"></div><figcaption>Read the numbered axes and the open and filled points. The drawing shows the stated branch behavior.</figcaption></figure>What is \\(\\lim_{x\\to-2^-}f(x)\\)?",
      "choices": [
        "−2",
        "3",
        "−1",
        "DNE"
      ],
      "answer": 2,
      "hint": "Left means x is less than −2; read the output height.",
      "solution": "As x approaches −2 from below, the branch approaches height −1. The target coordinate −2 is an input, not the limit."
    },
    {
      "id": "ap06",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "<figure><div data-plot=\"smooth\"></div><figcaption>Read the numbered axes and the open and filled points. The drawing shows the stated branch behavior.</figcaption></figure>Which is the best estimate of \\(\\lim_{x\\to1}f(x)\\)?",
      "choices": [
        "0",
        "2",
        "DNE",
        "1"
      ],
      "answer": 3,
      "hint": "Read the height of the curve approached from each side.",
      "solution": "The parabola approaches height 1 from both sides of x = 1. The point value also happens to equal 1."
    },
    {
      "id": "ap07",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "<figure><div data-plot=\"corner\"></div><figcaption>Read the numbered axes and the open and filled points. The drawing shows the stated branch behavior.</figcaption></figure>Which conclusion follows from the graph?",
      "choices": [
        "The limit at 0 is 0; the corner does not prevent the heights from agreeing.",
        "The limit is DNE because the graph changes direction.",
        "The limit at 0 is 1 because the branches have slopes of magnitude 1.",
        "The left and right limits have opposite signs."
      ],
      "answer": 0,
      "hint": "A limit concerns output heights, not whether the curve has a corner.",
      "solution": "Both branches approach height 0. Different local slopes do not make the function-value limit fail."
    },
    {
      "id": "ap08",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "<figure><div data-plot=\"reciprocal\"></div><figcaption>Read the numbered axes and the open and filled points. The drawing shows the stated branch behavior.</figcaption></figure>Which pair describes the left- and right-hand behavior at 0?",
      "choices": [
        "\\((+\\infty,-\\infty)\\)",
        "\\((-\\infty,+\\infty)\\)",
        "\\((0,0)\\)",
        "\\((+\\infty,+\\infty)\\)"
      ],
      "answer": 1,
      "hint": "Track the sign of each branch as it exits the viewing window.",
      "solution": "The left branch decreases without bound and the right branch increases without bound. Write \\(\\lim_{x\\to0^-}f(x)=-\\infty\\) and \\(\\lim_{x\\to0^+}f(x)=+\\infty\\). There is no finite two-sided limit."
    },
    {
      "id": "ap09",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "<figure><div data-plot=\"positiveInfinity\"></div><figcaption>Read the numbered axes and the open and filled points. The drawing shows the stated branch behavior.</figcaption></figure>Which statement best describes the behavior near 0?",
      "choices": [
        "The finite limit is 10 because the curve exits the window there.",
        "The limit is 0 because x approaches 0.",
        "The left and right branches have opposite signs.",
        "Both branches increase without bound; there is no finite real limit."
      ],
      "answer": 3,
      "hint": "The top edge of a graphing window is not a maximum value of the function.",
      "solution": "The notation \\(\\lim_{x\\to0}f(x)=+\\infty\\) describes unbounded growth on both sides. Infinity is not a finite output or a value assigned at x = 0."
    },
    {
      "id": "ap10",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "<figure><div data-plot=\"negativeInfinity\"></div><figcaption>Read the numbered axes and the open and filled points. The drawing shows the stated branch behavior.</figcaption></figure>What describes \\(f(x)\\) as \\(x\\to0^+\\)?",
      "choices": [
        "It approaches 0.",
        "It increases without bound.",
        "It decreases without bound.",
        "It approaches −10 exactly."
      ],
      "answer": 2,
      "hint": "Follow the right branch downward beyond the plotted frame.",
      "solution": "The right-hand behavior is \\(-\\infty\\): values become negative with arbitrarily large magnitude. The lower edge of the window is not the limit."
    },
    {
      "id": "ap11",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "<figure><div data-plot=\"oscillation\"></div><figcaption>The model is sin(1/x). It continues to reach 1 and −1 arbitrarily close to 0; the shaded central strip is not resolved.</figcaption></figure>Why is there no limit at 0?",
      "choices": [
        "The function is missing a point at 0.",
        "Its outputs keep reaching two separated heights arbitrarily close to 0.",
        "Any oscillating function has no limit.",
        "The graph crosses the x-axis."
      ],
      "answer": 1,
      "hint": "The persistence of the amplitude matters.",
      "solution": "The outputs continue to reach 1 and −1 close to 0 and do not settle near one height. Missing a point or crossing an axis alone would not rule out a limit."
    },
    {
      "id": "ap12",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "<figure><div data-plot=\"damping\"></div><figcaption>The model is x sin(1/x). Its graph remains between y = −|x| and y = |x|.</figcaption></figure>Which estimate is supported as x approaches 0?",
      "choices": [
        "0",
        "1",
        "−1",
        "DNE solely because it oscillates."
      ],
      "answer": 0,
      "hint": "Look at the shrinking output envelope, not just the repeated wiggles.",
      "solution": "The heights are trapped between \\(-|x|\\) and \\(|x|\\), which both approach 0. The oscillation shrinks toward a common output of 0."
    },
    {
      "id": "ap13",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "<figure><div data-plot=\"clinic:-2\"></div><figcaption>Read the numbered axes and the open and filled points. The drawing shows the stated branch behavior.</figcaption></figure>At x = −2, which pair gives the two-sided limit and the point value?",
      "choices": [
        "(4, 2)",
        "(DNE, 4)",
        "(2, 4)",
        "(−2, 2)"
      ],
      "answer": 2,
      "hint": "Use both nearby branches at the selected target.",
      "solution": "Both branches approach height 2, while the filled point gives f(−2) = 4."
    },
    {
      "id": "ap14",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "<figure><div data-plot=\"clinic:1\"></div><figcaption>Read the numbered axes and the open and filled points. The drawing shows the stated branch behavior.</figcaption></figure>What is the two-sided limit at x = 1?",
      "choices": [
        "DNE",
        "3",
        "1",
        "−1"
      ],
      "answer": 0,
      "hint": "The left branch approaches 1; inspect the branch to the right.",
      "solution": "The left-hand limit is 1 and the right-hand limit is −1. Their disagreement makes the two-sided limit DNE, regardless of f(1) = 3."
    },
    {
      "id": "ap15",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "<figure><div data-plot=\"closeJump\"></div><figcaption>Read the numbered axes and the open and filled points. The drawing shows the stated branch behavior.</figcaption></figure>On a wide vertical scale, two branch endpoints appear to meet. What is the most reliable next step?",
      "choices": [
        "Declare the limit to be 2 because the pixels overlap.",
        "Set the point value to 2 to force agreement.",
        "Average the two endpoint heights.",
        "Inspect a narrower vertical scale and more precise coordinate information."
      ],
      "answer": 3,
      "hint": "A screen has finite resolution.",
      "solution": "A wide scale can hide a small mismatch. A closer view shows endpoint heights 2 and 2.04, which do not agree. Zoom helps inspect evidence, while a complete model supplies exact behavior."
    },
    {
      "id": "ap16",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "<figure><div data-plot=\"endpoint\"></div><figcaption>Read the numbered axes and the open and filled points. The drawing shows the stated branch behavior.</figcaption></figure>Which statement uses only the available domain information?",
      "choices": [
        "The left-hand limit at 0 is 0.",
        "The right-hand limit at 0 is 0.",
        "Negative inputs have negative outputs.",
        "The graph continues through negative x."
      ],
      "answer": 1,
      "hint": "Only nonnegative inputs belong to the displayed model.",
      "solution": "Approach through positive inputs: \\(\\lim_{x\\to0^+}f(x)=0\\). There is no supplied branch for x < 0."
    },
    {
      "id": "exit-limit",
      "type": "number",
      "group": "Exit ticket",
      "prompt": "<figure><div data-plot=\"negative\"></div><figcaption>Read the numbered axes and the open and filled points. The drawing shows the stated branch behavior.</figcaption></figure>State \\(\\lim_{x\\to-2}f(x)\\).",
      "answer": -1,
      "hint": "Trace both sides toward the open circle.",
      "solution": "Both sides approach −1, so the limit is −1. The point value 3 is separate.",
      "unit": "number, DNE, undefined or ±infinity",
      "tolerance": 1e-06
    },
    {
      "id": "exit-reason",
      "type": "mcq",
      "group": "Exit ticket",
      "prompt": "A graph has a corner at c, but both branches approach the same finite height L. What follows?",
      "choices": [
        "The limit is DNE.",
        "The limit must be zero.",
        "The function value must be undefined.",
        "The limit is L; the corner alone does not prevent it."
      ],
      "answer": 3,
      "hint": "Limits of function values concern heights, not slopes.",
      "solution": "The common nearby height determines the finite limit. A corner does not make the two sides disagree."
    }
  ],
  "frqs": [
    {
      "id": "frq-clinic",
      "title": "Read one graph at three targets",
      "calculator": false,
      "context": "<figure><div data-plot=\"clinic:-2\"></div><figcaption>Read the numbered axes and the open and filled points. The drawing shows the stated branch behavior.</figcaption></figure><p>Use the graph, with its marked points and continuous branches between the marked inputs. Give reasons from the left and right.</p>",
      "parts": [
        {
          "label": "(a)",
          "prompt": "State \\(\\lim_{x\\to-2}f(x)\\), state f(−2), and explain the distinction.",
          "rubric": "<ol><li>1 point: The limit at −2 is 2.</li><li>1 point: The point value f(−2) is 4.</li><li>1 point: Both approaching branches end at height 2, while the filled point at the target has height 4.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "State the left-hand, right-hand and two-sided limits at x = 1.",
          "rubric": "<ol><li>1 point: \\(\\lim_{x\\to1^-}f(x)=1\\).</li><li>1 point: \\(\\lim_{x\\to1^+}f(x)=-1\\).</li><li>1 point: The two-sided limit is DNE because the two one-sided limits disagree.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "Estimate the limit at x = 0. Explain why its corner differs from the behavior at x = 1.",
          "rubric": "<ol><li>1 point: The limit at 0 is 0.</li><li>1 point: Both branches approach height 0, even though their directions differ.</li><li>1 point: At x = 1, the branch heights approach different values. A corner in the graph and a mismatch in limiting heights are different features.</li></ol>"
        }
      ]
    },
    {
      "id": "frq-failures",
      "title": "Three reasons to inspect nearby behavior",
      "calculator": false,
      "context": "<p>Consider these three models near x = 0. The arrows and captions describe behavior beyond the finite plotting window.</p><figure><div data-plot=\"reciprocal\"></div><figcaption>Read the numbered axes and the open and filled points. The drawing shows the stated branch behavior.</figcaption></figure><figure><div data-plot=\"positiveInfinity\"></div><figcaption>Read the numbered axes and the open and filled points. The drawing shows the stated branch behavior.</figcaption></figure><figure><div data-plot=\"oscillation\"></div><figcaption>The model continues to reach 1 and −1 arbitrarily close to 0.</figcaption></figure>",
      "parts": [
        {
          "label": "(a)",
          "prompt": "For the first graph, state both one-sided behaviors and explain the two-sided conclusion.",
          "rubric": "<ol><li>1 point: Left side: \\(-\\infty\\).</li><li>1 point: Right side: \\(+\\infty\\).</li><li>1 point: The two-sided limit does not exist; the sides have opposite unbounded behavior.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "For the second graph, describe both sides using limit notation and say whether the limit is a finite real number.",
          "rubric": "<ol><li>1 point: Both sides increase without bound.</li><li>1 point: \\(\\lim_{x\\to0}f(x)=+\\infty\\) describes that behavior.</li><li>1 point: There is no finite real limit; infinity describes unbounded growth, not a finite point value.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "For the third graph, explain why a limit fails and whether assigning a value at zero would repair it.",
          "rubric": "<ol><li>1 point: The outputs keep reaching separated heights 1 and −1 arbitrarily close to 0.</li><li>1 point: Therefore they do not approach one limiting output; the limit is DNE.</li><li>1 point: Changing only the value at 0 does not change the persistent nearby oscillation.</li></ol>"
        }
      ]
    },
    {
      "id": "frq-window",
      "title": "A viewing window can hide a mismatch",
      "calculator": false,
      "context": "<figure><div data-plot=\"closeJump\"></div><figcaption>Read the numbered axes and the open and filled points. The drawing shows the stated branch behavior.</figcaption></figure><p>A more precise inspection gives a left endpoint height of 2 and a right endpoint height of 2.04 at x = 0. The point value is 2.</p>",
      "parts": [
        {
          "label": "(a)",
          "prompt": "A student uses only the wide view and claims that both branches meet. Explain why this visual impression is insufficient and how to investigate it.",
          "rubric": "<ol><li>1 point: A finite-resolution graph with a wide vertical range can hide a small vertical separation.</li><li>1 point: Use a tighter vertical window around the endpoint heights.</li><li>1 point: Inspect more precise coordinates or the complete nearby model before claiming exact agreement.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Using the precise endpoint information, state both one-sided limits and the two-sided limit.",
          "rubric": "<ol><li>1 point: The left-hand limit is 2.</li><li>1 point: The right-hand limit is 2.04.</li><li>1 point: The two-sided limit is DNE because 2 and 2.04 differ.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "Construct a different graph with both one-sided limits equal to 2 at zero and a function value of 5. Describe or define it completely.",
          "rubric": "<ol><li>1 point: Give nearby branches approaching height 2, for example a horizontal line y = 2 for x ≠ 0.</li><li>1 point: Place an open circle at (0,2) and a filled point at (0,5), or give the equivalent piecewise rule.</li><li>1 point: Explain that the common nearby height gives limit 2, independently of the point value 5.</li></ol>"
        }
      ]
    }
  ]
};root.LimitLessonQuestions=data;if(typeof module!=="undefined"&&module.exports)module.exports=data;})(typeof window!=="undefined"?window:globalThis);
