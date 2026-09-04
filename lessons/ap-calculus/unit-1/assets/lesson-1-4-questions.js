/* Original ECHS classroom practice; not official exam items. */
(function(root){const data={
  "questions": [
    {
      "id": "launch",
      "type": "mcq",
      "group": "Opening prediction",
      "prompt": "<div class=\"table-wrap\"><table class=\"paired-table\"><caption>Nearby values; read each side toward the target</caption><thead><tr><th scope=\"col\">x from left</th><th scope=\"col\">f(x)</th><th scope=\"col\">x from right</th><th scope=\"col\">f(x)</th></tr></thead><tbody><tr><td>1.9</td><td>3.9</td><td>2.1</td><td>4.1</td></tr><tr><td>1.99</td><td>3.99</td><td>2.01</td><td>4.01</td></tr><tr><td>1.999</td><td>3.999</td><td>2.001</td><td>4.001</td></tr></tbody></table></div>The function is separately assigned f(2) = 9. What two-sided limit estimate does the table suggest?",
      "choices": [
        "2",
        "4",
        "9",
        "No estimate because f(2) is different."
      ],
      "answer": 1,
      "hint": "Follow the left and right output columns toward the target.",
      "solution": "Both sides suggest output 4. The value assigned at x = 2 does not replace the nearby trend. These finite samples suggest an estimate."
    },
    {
      "id": "design-check",
      "type": "mcq",
      "group": "Guided practice",
      "prompt": "Which input is closest to −3 while remaining strictly to its left?",
      "choices": [
        "−3.1",
        "−2.999",
        "−3",
        "−3.001"
      ],
      "answer": 3,
      "hint": "Compare signed position and distance from −3.",
      "solution": "−3.001 is less than −3 and only 0.001 away. The target itself is excluded, and −2.999 lies on the right."
    },
    {
      "id": "table-left",
      "type": "number",
      "group": "Guided practice",
      "prompt": "Using the displayed paired table around 0, estimate \\(\\lim_{x\\to0^-}f(x)\\).",
      "answer": 2,
      "hint": "Read only the output column paired with inputs less than 0.",
      "solution": "The left outputs 1.9, 1.99 and 1.999 suggest 2.",
      "unit": "number, DNE, undefined or ±infinity",
      "tolerance": 1e-06
    },
    {
      "id": "table-right",
      "type": "number",
      "group": "Guided practice",
      "prompt": "Using the same table, estimate \\(\\lim_{x\\to0^+}f(x)\\).",
      "answer": 2,
      "hint": "Use positive inputs decreasing toward 0.",
      "solution": "The right outputs 2.1, 2.01 and 2.001 suggest 2.",
      "unit": "number, DNE, undefined or ±infinity",
      "tolerance": 1e-06
    },
    {
      "id": "table-point",
      "type": "number",
      "group": "Guided practice",
      "prompt": "For this function, f(0) is separately given as 9. State f(0).",
      "answer": 9,
      "hint": "Use the assigned value for the exact target.",
      "solution": "The stated value is f(0) = 9. The nearby table suggests a limit of 2, which is a different fact.",
      "unit": "number, DNE, undefined or ±infinity",
      "tolerance": 1e-06
    },
    {
      "id": "sides-check",
      "type": "number",
      "group": "Guided practice",
      "prompt": "<div class=\"table-wrap\"><table class=\"paired-table\"><caption>Nearby values; read each side toward the target</caption><thead><tr><th scope=\"col\">x from left</th><th scope=\"col\">f(x)</th><th scope=\"col\">x from right</th><th scope=\"col\">f(x)</th></tr></thead><tbody><tr><td>1.9</td><td>1.9</td><td>2.1</td><td>5.1</td></tr><tr><td>1.99</td><td>1.99</td><td>2.01</td><td>5.01</td></tr><tr><td>1.999</td><td>1.999</td><td>2.001</td><td>5.001</td></tr></tbody></table></div>What does the evidence suggest for the two-sided limit at 2? Use DNE if the two trends disagree.",
      "answer": "DNE",
      "hint": "The left outputs approach 2 and the right outputs approach 5.",
      "solution": "The table suggests different one-sided limits, 2 and 5, so it does not support a common two-sided finite limit.",
      "unit": "number, DNE, undefined or ±infinity",
      "tolerance": 1e-06
    },
    {
      "id": "ap01",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "<div class=\"table-wrap\"><table class=\"paired-table\"><caption>Nearby values; read each side toward the target</caption><thead><tr><th scope=\"col\">x from left</th><th scope=\"col\">f(x)</th><th scope=\"col\">x from right</th><th scope=\"col\">f(x)</th></tr></thead><tbody><tr><td>1.9</td><td>3.9</td><td>2.1</td><td>4.1</td></tr><tr><td>1.99</td><td>3.99</td><td>2.01</td><td>4.01</td></tr><tr><td>1.999</td><td>3.999</td><td>2.001</td><td>4.001</td></tr></tbody></table></div>Which estimate of the two-sided limit at x = 2 is best supported?",
      "choices": [
        "2",
        "9",
        "4",
        "0"
      ],
      "answer": 2,
      "hint": "Compare the destinations of both output columns.",
      "solution": "The left outputs rise toward 4 and the right outputs fall toward 4. The common numerical estimate is 4."
    },
    {
      "id": "ap02",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "<div class=\"table-wrap\"><table class=\"paired-table\"><caption>Nearby values; read each side toward the target</caption><thead><tr><th scope=\"col\">x from left</th><th scope=\"col\">f(x)</th><th scope=\"col\">x from right</th><th scope=\"col\">f(x)</th></tr></thead><tbody><tr><td>1.9</td><td>3.9</td><td>2.1</td><td>4.1</td></tr><tr><td>1.99</td><td>3.99</td><td>2.01</td><td>4.01</td></tr><tr><td>1.999</td><td>3.999</td><td>2.001</td><td>4.001</td></tr></tbody></table></div>If the function is separately assigned f(2) = 9, which pair gives the estimated limit and the actual point value?",
      "choices": [
        "(4, 9)",
        "(9, 4)",
        "(2, 4)",
        "(DNE, 9)"
      ],
      "answer": 0,
      "hint": "Separate the table trend from the exact given point value.",
      "solution": "The table suggests limit 4; the given assignment makes f(2) = 9. They can differ."
    },
    {
      "id": "ap03",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "<div class=\"table-wrap\"><table class=\"paired-table\"><caption>Nearby values; read each side toward the target</caption><thead><tr><th scope=\"col\">x from left</th><th scope=\"col\">f(x)</th><th scope=\"col\">x from right</th><th scope=\"col\">f(x)</th></tr></thead><tbody><tr><td>-3.1</td><td>-1.1</td><td>-2.9</td><td>-0.9</td></tr><tr><td>-3.01</td><td>-1.01</td><td>-2.99</td><td>-0.99</td></tr><tr><td>-3.001</td><td>-1.001</td><td>-2.999</td><td>-0.999</td></tr></tbody></table></div>Which estimate is supported as x approaches −3?",
      "choices": [
        "−3",
        "0",
        "1",
        "−1"
      ],
      "answer": 3,
      "hint": "The input target is −3; the limiting output is read from the f(x) columns.",
      "solution": "Both output columns suggest −1. Negative targets and negative limits are different coordinates."
    },
    {
      "id": "ap04",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "<div class=\"table-wrap\"><table class=\"paired-table\"><caption>Nearby values; read each side toward the target</caption><thead><tr><th scope=\"col\">x from left</th><th scope=\"col\">f(x)</th><th scope=\"col\">x from right</th><th scope=\"col\">f(x)</th></tr></thead><tbody><tr><td>1.9</td><td>1.9</td><td>2.1</td><td>5.1</td></tr><tr><td>1.99</td><td>1.99</td><td>2.01</td><td>5.01</td></tr><tr><td>1.999</td><td>1.999</td><td>2.001</td><td>5.001</td></tr></tbody></table></div>Which conclusion is best supported by the data at x = 2?",
      "choices": [
        "The limit is 3.5.",
        "The one-sided trends suggest no common two-sided limit.",
        "The limit is 5 because the right side appears last.",
        "The limit is 2 because the input approaches 2."
      ],
      "answer": 1,
      "hint": "Do not average two different limiting trends.",
      "solution": "The left side suggests 2 and the right side suggests 5. Their mismatch suggests DNE; averaging them is not a limit rule."
    },
    {
      "id": "ap05",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "<div class=\"table-wrap\"><table class=\"paired-table\"><caption>Only positive inputs are supplied</caption><thead><tr><th scope=\"col\">x</th><th scope=\"col\">f(x)</th></tr></thead><tbody><tr><td>0.1</td><td>2.1</td></tr><tr><td>0.01</td><td>2.01</td></tr><tr><td>0.001</td><td>2.001</td></tr></tbody></table></div>What can be estimated from the supplied side?",
      "choices": [
        "The left-hand limit at 0 is 2.",
        "The two-sided limit must be 2.",
        "The right-hand limit at 0 is approximately 2.",
        "The value f(0) is 2."
      ],
      "answer": 2,
      "hint": "Every listed input is greater than 0.",
      "solution": "The right-hand data suggest 2. No left-side behavior or value at 0 is supplied, so those cannot be inferred from this table alone."
    },
    {
      "id": "ap06",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "<div class=\"table-wrap\"><table class=\"paired-table\"><caption>Nearby values; read each side toward the target</caption><thead><tr><th scope=\"col\">x from left</th><th scope=\"col\">f(x)</th><th scope=\"col\">x from right</th><th scope=\"col\">f(x)</th></tr></thead><tbody><tr><td>-0.1</td><td>0.01</td><td>0.1</td><td>0.01</td></tr><tr><td>-0.01</td><td>0.0001</td><td>0.01</td><td>0.0001</td></tr><tr><td>-0.001</td><td>1e-06</td><td>0.001</td><td>1e-06</td></tr></tbody></table></div>Which finite limit estimate is supported at 0?",
      "choices": [
        "1",
        "DNE",
        "The limit must be positive because every entry is positive.",
        "0"
      ],
      "answer": 3,
      "hint": "Positive values can approach zero.",
      "solution": "Both output columns decrease toward zero. The entries do not need to become exactly zero for the limit estimate to be zero."
    },
    {
      "id": "ap07",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "<div class=\"table-wrap\"><table class=\"paired-table\"><caption>Nearby values; read each side toward the target</caption><thead><tr><th scope=\"col\">x from left</th><th scope=\"col\">f(x)</th><th scope=\"col\">x from right</th><th scope=\"col\">f(x)</th></tr></thead><tbody><tr><td>4.9</td><td>-2</td><td>5.1</td><td>-2</td></tr><tr><td>4.99</td><td>-2</td><td>5.01</td><td>-2</td></tr><tr><td>4.999</td><td>-2</td><td>5.001</td><td>-2</td></tr></tbody></table></div>Which estimate is supported as x approaches 5?",
      "choices": [
        "−2",
        "5",
        "0",
        "DNE because the outputs do not change."
      ],
      "answer": 0,
      "hint": "Outputs already equal to one value are compatible with approaching it.",
      "solution": "The constant nearby entries suggest a limit of −2. A limit does not require the values to keep changing."
    },
    {
      "id": "ap08",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "<div class=\"table-wrap\"><table class=\"paired-table\"><caption>Nearby values; read each side toward the target</caption><thead><tr><th scope=\"col\">x from left</th><th scope=\"col\">f(x)</th><th scope=\"col\">x from right</th><th scope=\"col\">f(x)</th></tr></thead><tbody><tr><td>-1</td><td>99</td><td>1</td><td>99</td></tr><tr><td>-0.1</td><td>99.9</td><td>0.1</td><td>99.9</td></tr><tr><td>-0.01</td><td>99.99</td><td>0.01</td><td>99.99</td></tr></tbody></table></div>Which behavior does this pattern most strongly suggest near 0?",
      "choices": [
        "Unbounded growth to infinity.",
        "Approach to the finite value 100.",
        "Approach to 0.",
        "Opposite one-sided limits."
      ],
      "answer": 1,
      "hint": "Increasing outputs can still approach a finite ceiling.",
      "solution": "The entries approach 100 from below on both sides. Increasing values alone do not justify an infinite-limit conclusion."
    },
    {
      "id": "ap09",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "<div class=\"table-wrap\"><table class=\"paired-table\"><caption>Nearby values; read each side toward the target</caption><thead><tr><th scope=\"col\">x from left</th><th scope=\"col\">f(x)</th><th scope=\"col\">x from right</th><th scope=\"col\">f(x)</th></tr></thead><tbody><tr><td>-0.1</td><td>100</td><td>0.1</td><td>100</td></tr><tr><td>-0.01</td><td>10000</td><td>0.01</td><td>10000</td></tr><tr><td>-0.001</td><td>1000000</td><td>0.001</td><td>1000000</td></tr></tbody></table></div>Which description best fits the numerical pattern at 0?",
      "choices": [
        "A finite limit of one million is proved.",
        "A finite limit of zero is suggested.",
        "The left and right sides have opposite signs.",
        "Both sides suggest unbounded positive growth, rather than a finite real limit."
      ],
      "answer": 3,
      "hint": "The most recent large value is not automatically the limiting value.",
      "solution": "The entries suggest positive growth without bound. The notation \\(+\\infty\\) describes that trend; it is not a finite answer, and a finite table alone is not a proof."
    },
    {
      "id": "ap10",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "<div class=\"table-wrap\"><table class=\"paired-table\"><caption>Nearby values; read each side toward the target</caption><thead><tr><th scope=\"col\">x from left</th><th scope=\"col\">f(x)</th><th scope=\"col\">x from right</th><th scope=\"col\">f(x)</th></tr></thead><tbody><tr><td>-0.1</td><td>-10</td><td>0.1</td><td>10</td></tr><tr><td>-0.01</td><td>-100</td><td>0.01</td><td>100</td></tr><tr><td>-0.001</td><td>-1000</td><td>0.001</td><td>1000</td></tr></tbody></table></div>Which interpretation is best supported at 0?",
      "choices": [
        "The two-sided limit is 0 because the signs balance.",
        "Both sides approach positive infinity.",
        "The sides suggest opposite unbounded behaviors, so no common two-sided limit.",
        "The limit is 1000."
      ],
      "answer": 2,
      "hint": "Read the sign as well as the magnitude on each side.",
      "solution": "The left side suggests \\(-\\infty\\), while the right suggests \\(+\\infty\\). Averaging opposite sampled values does not establish a limit."
    },
    {
      "id": "ap11",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "<div class=\"table-wrap\"><table class=\"paired-table\"><caption>Outputs rounded to two decimal places</caption><thead><tr><th scope=\"col\">x from left</th><th scope=\"col\">f(x)</th><th scope=\"col\">x from right</th><th scope=\"col\">f(x)</th></tr></thead><tbody><tr><td>-0.0001</td><td>1.00</td><td>0.0001</td><td>1.00</td></tr><tr><td>-1e-05</td><td>1.00</td><td>1e-05</td><td>1.00</td></tr></tbody></table></div>Which conclusion is justified?",
      "choices": [
        "The limit is proved to equal exactly 1.",
        "More output precision is needed to check whether rounding hides different nearby trends.",
        "The function must be constant.",
        "The function must be defined at 0."
      ],
      "answer": 1,
      "hint": "A displayed 1.00 can represent many different underlying numbers.",
      "solution": "Rounded equality is not exact equality. Increase output precision and inspect additional valid nearby inputs before claiming agreement."
    },
    {
      "id": "ap12",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Which pair of lists correctly approaches −2 from both sides, getting closer in each list?",
      "choices": [
        "Left: −2.1, −2.01, −2.001; right: −1.9, −1.99, −1.999.",
        "Left: −1.9, −1.99, −1.999; right: −2.1, −2.01, −2.001.",
        "Left: −2.001, −2.01, −2.1; right: −1.999, −1.99, −1.9.",
        "Left: −2, −2, −2; right: −2, −2, −2."
      ],
      "answer": 0,
      "hint": "Left means less than the target; shrinking distance matters too.",
      "solution": "The first pair stays on the correct sides and reduces distances 0.1, 0.01 and 0.001. The target is never substituted into either approach list."
    },
    {
      "id": "ap13",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "<div class=\"table-wrap\"><table class=\"paired-table\"><caption>\\(f(x)=\\sin(x)/x\\), radians; outputs rounded to six decimals</caption><thead><tr><th scope=\"col\">x from left</th><th scope=\"col\">f(x)</th><th scope=\"col\">x from right</th><th scope=\"col\">f(x)</th></tr></thead><tbody><tr><td>-0.1</td><td>0.998334</td><td>0.1</td><td>0.998334</td></tr><tr><td>-0.01</td><td>0.999983</td><td>0.01</td><td>0.999983</td></tr><tr><td>-0.001</td><td>1.000000</td><td>0.001</td><td>1.000000</td></tr></tbody></table></div>Which limit estimate is supported at 0?",
      "choices": [
        "0",
        "0.017453",
        "1",
        "Undefined because the quotient at 0 is 0/0."
      ],
      "answer": 2,
      "hint": "The row at the target is unnecessary for this nearby estimate.",
      "solution": "The outputs from both sides suggest 1. The value at x = 0 is undefined, but nearby values can still have a finite limit. Radian mode matters for this expression."
    },
    {
      "id": "ap14",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "<div class=\"table-wrap\"><table class=\"paired-table\"><caption>\\(f(x)=(2^x-1)/x\\); six-decimal outputs</caption><thead><tr><th scope=\"col\">x from left</th><th scope=\"col\">f(x)</th><th scope=\"col\">x from right</th><th scope=\"col\">f(x)</th></tr></thead><tbody><tr><td>-0.1</td><td>0.669670</td><td>0.1</td><td>0.717735</td></tr><tr><td>-0.01</td><td>0.690750</td><td>0.01</td><td>0.695555</td></tr><tr><td>-0.001</td><td>0.692907</td><td>0.001</td><td>0.693387</td></tr></tbody></table></div>Which estimate to three decimal places is best supported?",
      "choices": [
        "0.693",
        "0.700",
        "1.000",
        "2.000"
      ],
      "answer": 0,
      "hint": "Compare the closest entries from both sides, and round only the final estimate.",
      "solution": "The closest values are approximately 0.692907 and 0.693387. They suggest a common limit around 0.693 to three decimal places. An algebraic derivation is not required in this numerical-estimation task."
    },
    {
      "id": "ap15",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "<div class=\"table-wrap\"><table class=\"paired-table\"><caption>Nearby values; read each side toward the target</caption><thead><tr><th scope=\"col\">x from left</th><th scope=\"col\">f(x)</th><th scope=\"col\">x from right</th><th scope=\"col\">f(x)</th></tr></thead><tbody><tr><td>1.9</td><td>3.9</td><td>2.1</td><td>4.1</td></tr><tr><td>1.99</td><td>3.99</td><td>2.01</td><td>4.01</td></tr><tr><td>1.999</td><td>3.999</td><td>2.001</td><td>4.001</td></tr></tbody></table></div>No complete rule is given. Which statement is the most careful conclusion?",
      "choices": [
        "The table proves a limit of 4 for every possible function matching these entries.",
        "The table determines f(2).",
        "The function cannot have a limit.",
        "The entries support an estimate of 4, but unlisted inputs could behave differently."
      ],
      "answer": 3,
      "hint": "A finite table cannot show every sufficiently close input.",
      "solution": "These samples provide numerical evidence, not a complete description of the function near the target. Different functions can agree at all listed entries and differ at unlisted inputs."
    },
    {
      "id": "ap16",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "You are using a calculator to estimate \\(\\lim_{x\\to2}(x^2-4)/(x-2)\\). Which procedure is appropriate?",
      "choices": [
        "Use only x = 2 and take the error message as the limit.",
        "Sample valid inputs on both sides of 2, keep enough digits, and compare their trends.",
        "Set every undefined quotient equal to zero.",
        "Use only x = 20, 200 and 2000."
      ],
      "answer": 1,
      "hint": "The task concerns nearby inputs, not the exact target or very large inputs.",
      "solution": "Use inputs such as 1.9, 1.99, 1.999 and 2.1, 2.01, 2.001. The quotient is undefined at 2, but its nearby outputs suggest 4."
    },
    {
      "id": "exit-estimate",
      "type": "number",
      "group": "Exit ticket",
      "prompt": "<div class=\"table-wrap\"><table class=\"paired-table\"><caption>Nearby values; read each side toward the target</caption><thead><tr><th scope=\"col\">x from left</th><th scope=\"col\">f(x)</th><th scope=\"col\">x from right</th><th scope=\"col\">f(x)</th></tr></thead><tbody><tr><td>1.9</td><td>1.4</td><td>2.1</td><td>1.6</td></tr><tr><td>1.99</td><td>1.49</td><td>2.01</td><td>1.51</td></tr><tr><td>1.999</td><td>1.499</td><td>2.001</td><td>1.501</td></tr></tbody></table></div>Estimate the two-sided limit as x approaches 2.",
      "answer": 1.5,
      "hint": "Compare the destinations of the left and right outputs.",
      "solution": "The left outputs increase toward 1.5 and the right outputs decrease toward 1.5, suggesting a common limit of 1.5.",
      "unit": "number, DNE, undefined or ±infinity",
      "tolerance": 1e-06
    },
    {
      "id": "exit-evidence",
      "type": "mcq",
      "group": "Exit ticket",
      "prompt": "Why should a numerical limit conclusion be worded carefully when only finitely many samples are known?",
      "choices": [
        "Because finite tables never contain useful information.",
        "Because the target must appear in every table.",
        "Because a limit must equal the last sampled value.",
        "Because unlisted inputs closer to the target may behave differently."
      ],
      "answer": 3,
      "hint": "Recall what a limit statement says about all sufficiently close inputs.",
      "solution": "A finite table supports a conjecture or estimate, but does not control every unlisted nearby input. A complete nearby rule or additional reasoning can establish a limit."
    }
  ],
  "frqs": [
    {
      "id": "frq-volume",
      "title": "A volume near a target time",
      "calculator": false,
      "context": "<div class=\"table-wrap\"><table class=\"paired-table\"><caption>t in minutes; V(t) in litres</caption><thead><tr><th scope=\"col\">t from left</th><th scope=\"col\">V(t)</th><th scope=\"col\">t from right</th><th scope=\"col\">V(t)</th></tr></thead><tbody><tr><td>2.9</td><td>11.8</td><td>3.1</td><td>12.2</td></tr><tr><td>2.99</td><td>11.98</td><td>3.01</td><td>12.02</td></tr><tr><td>2.999</td><td>11.998</td><td>3.001</td><td>12.002</td></tr></tbody></table></div><p>The exact point value is separately given as V(3) = 20 litres. No complete nearby formula is supplied.</p>",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Estimate \\(\\lim_{t\\to3}V(t)\\), justify it from both sides, and interpret it in context.",
          "rubric": "<ol><li>1 point: A two-sided limit estimate of 12.</li><li>1 point: The left outputs approach 12 from below and the right outputs approach 12 from above.</li><li>1 point: As time approaches 3 minutes, the volume is estimated to approach 12 litres; the units are litres, not litres per minute.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "State V(3), compare it with the estimated limit, and explain whether this difference alone invalidates the estimate.",
          "rubric": "<ol><li>1 point: V(3) = 20 litres.</li><li>1 point: The point value 20 differs from the estimated nearby limit 12.</li><li>1 point: This alone does not invalidate a limit estimate because the limit uses non-target inputs.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "Does this finite table prove the exact limit? Explain and describe information that could establish the nearby behavior.",
          "rubric": "<ol><li>1 point: No: it supports an estimate, not a proof for an otherwise unknown function.</li><li>1 point: There may be different behavior at unlisted inputs arbitrarily close to 3.</li><li>1 point: A complete nearby model, or a valid argument controlling all sufficiently close non-target inputs, could establish the limit.</li></ol>"
        }
      ]
    },
    {
      "id": "frq-trends",
      "title": "Three numerical trends",
      "calculator": false,
      "context": "<div class=\"table-wrap\"><table class=\"paired-table\"><caption>Each output cell lists left / right at the stated input distance</caption><thead><tr><th scope=\"col\">Inputs</th><th scope=\"col\">f: left / right</th><th scope=\"col\">g: left / right</th><th scope=\"col\">h: left / right</th></tr></thead><tbody><tr><td>2 ± 0.1</td><td>1.9 / 5.1</td><td>0.01 / 0.01</td><td>100 / 100</td></tr><tr><td>2 ± 0.01</td><td>1.99 / 5.01</td><td>0.0001 / 0.0001</td><td>10000 / 10000</td></tr><tr><td>2 ± 0.001</td><td>1.999 / 5.001</td><td>0.000001 / 0.000001</td><td>1000000 / 1000000</td></tr></tbody></table></div><p>Use the evidence to estimate behavior at x = 2. No values at x = 2 are given.</p>",
      "parts": [
        {
          "label": "(a)",
          "prompt": "For f, estimate each one-sided limit and state the two-sided conclusion suggested by the table.",
          "rubric": "<ol><li>1 point: Left-hand estimate: 2.</li><li>1 point: Right-hand estimate: 5.</li><li>1 point: The table suggests no common two-sided limit, since the one-sided estimates differ.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "For g, estimate the two-sided limit and explain what the table does and does not say about g(2).",
          "rubric": "<ol><li>1 point: The two-sided limit estimate is 0.</li><li>1 point: Both output columns shrink toward 0 even though the listed values are positive.</li><li>1 point: The actual value g(2) is not determined by the table.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "For h, describe the apparent behavior on both sides and state whether the table suggests a finite real limit.",
          "rubric": "<ol><li>1 point: The positive values increase rapidly on both sides as the input distance shrinks.</li><li>1 point: The pattern suggests \\(+\\infty\\), meaning unbounded positive growth.</li><li>1 point: It does not suggest a finite real limit; the last large table entry is not the limit, and finite data alone do not prove unboundedness.</li></ol>"
        }
      ]
    },
    {
      "id": "frq-precision",
      "title": "Precision and the limits of sampling",
      "calculator": false,
      "context": "<div class=\"table-wrap\"><table class=\"paired-table\"><caption>Six-decimal outputs; compare what happens if only two decimals are shown</caption><thead><tr><th scope=\"col\">x from left</th><th scope=\"col\">f(x)</th><th scope=\"col\">x from right</th><th scope=\"col\">f(x)</th></tr></thead><tbody><tr><td>-0.0001</td><td>0.999900</td><td>0.0001</td><td>1.000500</td></tr><tr><td>-1e-05</td><td>0.999990</td><td>1e-05</td><td>1.000410</td></tr><tr><td>-1e-06</td><td>0.999999</td><td>1e-06</td><td>1.000401</td></tr></tbody></table></div><p>For a separate sampling challenge in part (c), suppose only inputs −0.1, −0.01, 0.01 and 0.1 are listed for the rule p(x) = 1 + x.</p>",
      "parts": [
        {
          "label": "(a)",
          "prompt": "What would every displayed output round to at two decimal places? Explain why that display could be misleading.",
          "rubric": "<ol><li>1 point: Each output would display as 1.00.</li><li>1 point: Rounding can erase differences between the output values.</li><li>1 point: Identical rounded entries do not establish identical one-sided limits.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "From the six-decimal table, estimate both one-sided limits and the two-sided conclusion.",
          "rubric": "<ol><li>1 point: Left-hand estimate: 1.</li><li>1 point: Right-hand estimate: 1.0004.</li><li>1 point: The different one-sided trends suggest that the two-sided limit does not exist.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "Construct a function q matching p at the four listed inputs, but having limit 8 at zero. Explain why your construction works.",
          "rubric": "<ol><li>1 point: Define q(x) = 1 + x at exactly the four listed inputs.</li><li>1 point: Define q(x) = 8 at every other input, or provide an equivalent complete rule.</li><li>1 point: Every input with 0 < |x| < 0.01 is unlisted, so q equals 8 throughout that nearby region and has limit 8 at zero.</li></ol>"
        }
      ]
    }
  ]
};root.LimitLessonQuestions=data;if(typeof module!=="undefined"&&module.exports)module.exports=data;})(typeof window!=="undefined"?window:globalThis);
