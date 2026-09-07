/* Original ECHS AP Calculus AB lesson content. */
(function(root){const data={
  "number": "1.7",
  "title": "Selecting Procedures for Determining Limits",
  "subtitle": "Diagnose the expression. Choose a valid strategy. Justify the limit.",
  "objective": "Select and carry out a limit procedure that fits the expression or representation, explaining why it is valid.",
  "lo": "LIM-1.C, LIM-1.D, LIM-1.E (synthesis)",
  "ek": "Cumulative limit knowledge from Topics 1.2–1.6",
  "skill": "1.C",
  "goals": [
    "Diagnose direct substitution without treating 0/0 as an answer.",
    "Choose factoring, conjugates, fraction combination, identities, or one-sided analysis from the structure.",
    "Explain why a rewrite away from the target preserves a limit.",
    "Separate a graph or table prediction from an analytical justification."
  ],
  "ideas": [
    {
      "title": "Start with structure and substitution",
      "body": "<p>First identify the target input and the function's form. For a polynomial, direct substitution gives the limit. For a quotient of continuous expressions, substitution is valid when the denominator tends to a nonzero value. For example, \\(\\lim_{x\\to2}(x^2+1)/(x+3)=5/5=1\\).</p><p>If substitution produces \\(0/0\\), you have found an <em>indeterminate form</em>, not a value. This is a signal to look for a rewrite. A function can be undefined at the target while its nearby values approach a finite number. Do not conclude zero, one, or DNE from \\(0/0\\) alone.</p>"
    },
    {
      "title": "Let the expression choose the rewrite",
      "body": "<p>For polynomial differences, look for factors. A radical difference often suggests a conjugate. A difference of fractions suggests a common denominator before cancellation. A trigonometric expression may simplify with an identity such as \\(1-\\cos^2x=\\sin^2x\\).</p><p>Choose a transformation that exposes the factor causing \\(0/0\\). In \\((\\sqrt{x+7}-3)/(x-2)\\), the conjugate produces \\(x-2\\); simply expanding a square root does not. Cancel only common <em>factors</em>, never terms across addition. After rewriting, check that the new expression permits evaluation. A strategy is successful when its conditions hold, not just when the algebra looks shorter.</p>"
    },
    {
      "title": "A valid rewrite agrees near the target",
      "body": "<p>Suppose \\(f(x)=g(x)\\) for every sufficiently close input with \\(x\\ne a\\). Then their limits as \\(x\\to a\\) agree, whether or not their values at \\(a\\) agree. For example, \\((x^2-4)/(x-2)=x+2\\) for \\(x\\ne2\\). The quotient has no value at \\(2\\), but the limit is \\(4\\).</p><p>A complete explanation states the condition \\(x\\ne a\\), gives the equivalent expression, and evaluates its limit using an appropriate law. Defining the missing function value is a separate question. One matching table entry or one matching point on a graph does not establish equivalence in a neighborhood.</p>"
    },
    {
      "title": "Know when to split the approach",
      "body": "<p>Absolute values and piecewise formulas may behave differently on opposite sides of a target. To evaluate \\(\\lim_{x\\to a}|x-a|/(x-a)\\), use \\(|x-a|=a-x\\) on the left and \\(|x-a|=x-a\\) on the right. The resulting one-sided limits are \\(-1\\) and \\(1\\), so no two-sided limit exists.</p><p>Graphs and tables help identify a promising strategy, but a finite table cannot prove that a limit exists. Use the given graph's local branches, a formula valid throughout a neighborhood, or a theorem to justify a conclusion. When the question asks for a procedure, explain why that procedure applies before reporting a number.</p>"
    }
  ],
  "workedExamples": [
    {
      "title": "Choose a conjugate, then justify the cancellation",
      "body": "<p>Evaluate \\(\\lim_{x\\to2}\\frac{\\sqrt{2x+5}-3}{x-2}\\). Substitution gives \\(0/0\\), so the quotient law cannot yet be used. The numerator is a radical difference, making its conjugate the useful choice.</p><p>For \\(x\\ne2\\) near \\(2\\), \\(\\frac{\\sqrt{2x+5}-3}{x-2}=\\frac{2x+5-9}{(x-2)(\\sqrt{2x+5}+3)}=\\frac{2}{\\sqrt{2x+5}+3}\\).</p><p>The rewritten denominator tends to \\(6\\), which is nonzero. Therefore the limit is \\(2/6=1/3\\). The original quotient remains undefined at \\(2\\); equality away from the target is all the limit argument needs. Multiplying only the numerator by the conjugate would change the function and would not justify this answer.</p>"
    },
    {
      "title": "Select different methods for superficially similar forms",
      "body": "<p>Compare \\(A=\\lim_{x\\to1}\\frac{x^2-1}{x-1}\\) and \\(B=\\lim_{x\\to1}\\frac{|x-1|}{x-1}\\). Both produce \\(0/0\\) under substitution. That shared form does not imply a shared answer.</p><p>For \\(A\\), factor \\(x^2-1=(x-1)(x+1)\\). Away from \\(1\\), the quotient is \\(x+1\\), so \\(A=2\\). For \\(B\\), split the absolute value: the quotient is \\(-1\\) when \\(x<1\\) and \\(1\\) when \\(x>1\\). Since the one-sided limits differ, \\(B\\) does not exist.</p><p>The choice of method comes from the numerator's structure. The first expression has a common algebraic factor; the second has a sign change. “Both give zero over zero” is a diagnosis that begins the reasoning, not a conclusion that ends it.</p>"
    }
  ],
  "questions": [
    {
      "topic": "1.7",
      "lo": "LIM-1.C, LIM-1.D, LIM-1.E (synthesis)",
      "skill": "1.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "g1",
      "type": "mcq",
      "group": "Guided check",
      "prompt": "Which procedure most directly evaluates \\(\\lim_{x\\to3}\\frac{x^2+2}{x+1}\\)?",
      "choices": [
        "Substitute directly because the denominator tends to a nonzero value.",
        "Cancel an x from numerator and denominator.",
        "Declare DNE because this is a quotient.",
        "Rationalize the numerator."
      ],
      "answer": 0,
      "hint": "Check the denominator at the target.",
      "solution": "The denominator tends to \\(4\\ne0\\). Direct substitution gives \\(11/4\\); no algebraic repair is needed.",
      "representation": "analytical"
    },
    {
      "topic": "1.7",
      "lo": "LIM-1.C, LIM-1.D, LIM-1.E (synthesis)",
      "skill": "1.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "g2",
      "type": "number",
      "group": "Guided check",
      "prompt": "Choose a valid rewrite and evaluate \\(\\lim_{x\\to-3}\\frac{x^2+x-6}{x+3}\\).",
      "answer": -5,
      "unit": "exact value",
      "hint": "Factor the quadratic before cancellation.",
      "solution": "The numerator is \\((x+3)(x-2)\\). For \\(x\\ne-3\\), cancel \\(x+3\\), leaving \\(x-2\\to-5\\).",
      "representation": "analytical"
    },
    {
      "topic": "1.7",
      "lo": "LIM-1.C, LIM-1.D, LIM-1.E (synthesis)",
      "skill": "1.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "g3",
      "type": "mcq",
      "group": "Guided check",
      "prompt": "Substitution produces \\(0/0\\) in \\(\\lim_{x\\to4}\\frac{\\sqrt{x+5}-3}{x-4}\\). Which next step preserves the quotient's nearby values?",
      "choices": [
        "Replace the numerator by \\(x+5-9\\) without changing the denominator.",
        "Multiply numerator and denominator by \\(\\sqrt{x+5}+3\\).",
        "Cancel the 3 against the 4.",
        "Set the limit equal to \\(0/0=1\\)."
      ],
      "answer": 1,
      "hint": "A conjugate must be applied to both numerator and denominator.",
      "solution": "Multiplying by \\((\\sqrt{x+5}+3)/(\\sqrt{x+5}+3)=1\\) exposes \\(x-4\\). After cancellation, the quotient tends to \\(1/6\\).",
      "representation": "analytical"
    },
    {
      "topic": "1.7",
      "lo": "LIM-1.C, LIM-1.D, LIM-1.E (synthesis)",
      "skill": "1.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "g4",
      "type": "number",
      "group": "Guided check",
      "prompt": "Evaluate \\(\\lim_{x\\to2}\\frac{|x-2|}{x-2}\\). Enter DNE if no two-sided limit exists.",
      "answer": "DNE",
      "unit": "exact value",
      "hint": "Use a separate formula for the absolute value on each side.",
      "solution": "For \\(x<2\\), the quotient equals \\(-1\\); for \\(x>2\\), it equals \\(1\\). Unequal one-sided limits imply DNE.",
      "representation": "analytical"
    },
    {
      "topic": "1.7",
      "lo": "LIM-1.C, LIM-1.D, LIM-1.E (synthesis)",
      "skill": "1.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "ap1",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Which procedure is most useful first for \\(\\lim_{x\\to2}\\frac{1/x-1/2}{x-2}\\)?",
      "choices": [
        "Combine the numerator fractions using a common denominator.",
        "Cancel x from each occurrence.",
        "Apply the quotient law immediately.",
        "Replace 1/x by x."
      ],
      "answer": 0,
      "hint": "The numerator contains a difference of reciprocals.",
      "solution": "Combine \\(1/x-1/2=(2-x)/(2x)\\). The full quotient becomes \\(-1/(2x)\\) for \\(x\\ne2\\), and the limit is \\(-1/4\\).",
      "representation": "analytical"
    },
    {
      "topic": "1.7",
      "lo": "LIM-1.C, LIM-1.D, LIM-1.E (synthesis)",
      "skill": "1.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "ap2",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "\\(\\lim_{x\\to5}\\frac{\\sqrt{x+4}-3}{x-5}=\\)",
      "choices": [
        "\\(6\\)",
        "\\(1/3\\)",
        "DNE",
        "\\(1/6\\)"
      ],
      "answer": 3,
      "hint": "Use the conjugate of the numerator.",
      "solution": "Rationalizing gives \\(1/(\\sqrt{x+4}+3)\\) for \\(x\\ne5\\). Its denominator tends to \\(6\\), so the limit is \\(1/6\\).",
      "representation": "analytical"
    },
    {
      "topic": "1.7",
      "lo": "LIM-1.C, LIM-1.D, LIM-1.E (synthesis)",
      "skill": "1.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "ap3",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "\\(\\lim_{x\\to0}\\frac{1-\\cos^2x}{\\sin x}=\\)",
      "choices": [
        "\\(1\\)",
        "DNE",
        "\\(0\\)",
        "\\(-1\\)"
      ],
      "answer": 2,
      "hint": "Use \\(1-\\cos^2x=\\sin^2x\\).",
      "solution": "For sufficiently small \\(x\\ne0\\), the quotient equals \\(\\sin x\\). Continuity of sine gives the limit \\(0\\).",
      "representation": "analytical"
    },
    {
      "topic": "1.7",
      "lo": "LIM-1.C, LIM-1.D, LIM-1.E (synthesis)",
      "skill": "1.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "ap4",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Let \\(f(x)=(x^2-9)/(x-3)\\) for \\(x\\ne3\\), and let \\(f(3)=10\\). Which statement correctly justifies \\(\\lim_{x\\to3}f(x)\\)?",
      "choices": [
        "The limit is \\(10\\) because \\(f(3)=10\\).",
        "The limit is \\(6\\) because \\(f(x)=x+3\\) for every nearby \\(x\\ne3\\).",
        "The limit does not exist because the formulas assign different values at 3.",
        "The limit is \\(0\\) because the numerator tends to zero."
      ],
      "answer": 1,
      "hint": "A limit uses nearby values, not the assigned center value.",
      "solution": "Away from \\(3\\), the factored quotient equals \\(x+3\\), which tends to \\(6\\). The isolated value \\(f(3)=10\\) does not alter that approach.",
      "representation": "analytical"
    },
    {
      "topic": "1.7",
      "lo": "LIM-1.C, LIM-1.D, LIM-1.E (synthesis)",
      "skill": "1.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "ap5",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "For \\(x\\ne-1\\), \\(p(x)=(x^2+3x+2)/(x+1)\\). Which expression has the same nearby values and can be evaluated at the target to find \\(\\lim_{x\\to-1}p(x)\\)?",
      "choices": [
        "\\(x+2\\)",
        "\\(x+3\\)",
        "\\(x^2+3x+1\\)",
        "\\(x-2\\)"
      ],
      "answer": 0,
      "hint": "Factor the numerator as a product.",
      "solution": "Because \\(x^2+3x+2=(x+1)(x+2)\\), the quotient equals \\(x+2\\) for \\(x\\ne-1\\). Its limit is \\(1\\).",
      "representation": "analytical"
    },
    {
      "topic": "1.7",
      "lo": "LIM-1.C, LIM-1.D, LIM-1.E (synthesis)",
      "skill": "1.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "ap6",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "The complete local graph of \\(h\\) is shown. What is \\(\\lim_{x\\to1}\\frac{h(x)-2}{x-1}\\)?",
      "choices": [
        "\\(0\\)",
        "\\(2\\)",
        "DNE",
        "\\(1\\)"
      ],
      "answer": 3,
      "hint": "Read the equation of the straight branches near x = 1.",
      "solution": "Both branches lie on \\(h(x)=x+1\\) for \\(x\\ne1\\) near \\(1\\). Thus the quotient is \\((x-1)/(x-1)=1\\). The isolated point \\(h(1)=4\\) is irrelevant.",
      "representation": "graphical",
      "visual": {
        "xMin": -1,
        "xMax": 3,
        "yMin": -1,
        "yMax": 5,
        "paths": [
          [
            [
              -1,
              0
            ],
            [
              0,
              1
            ],
            [
              1,
              2
            ]
          ],
          [
            [
              1,
              2
            ],
            [
              2,
              3
            ],
            [
              3,
              4
            ]
          ]
        ],
        "open": [
          [
            1,
            2
          ]
        ],
        "closed": [
          [
            1,
            4
          ]
        ],
        "caption": "Straight line y = x + 1 with an open point at (1, 2) and a filled point at (1, 4)."
      }
    },
    {
      "topic": "1.7",
      "lo": "LIM-1.C, LIM-1.D, LIM-1.E (synthesis)",
      "skill": "1.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "ap7",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "A student says \\(\\lim_{x\\to0}\\frac{|x|}{x}=1\\) because \\(|x|=x\\). What is the essential correction?",
      "choices": [
        "\\(|x|=x\\) only when \\(x\\ge0\\); the left-hand quotient is \\(-1\\), so the two-sided limit does not exist.",
        "No correction: cancellation is valid on both sides.",
        "The quotient equals zero on the left.",
        "The function must be assigned a value at zero before its limit can be studied."
      ],
      "answer": 0,
      "hint": "Check the identity separately for negative inputs.",
      "solution": "For \\(x<0\\), \\(|x|=-x\\), giving \\(-1\\); for \\(x>0\\), the quotient is \\(1\\). A two-sided limit requires agreement.",
      "representation": "analytical"
    },
    {
      "topic": "1.7",
      "lo": "LIM-1.C, LIM-1.D, LIM-1.E (synthesis)",
      "skill": "1.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "ap8",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "The table lists selected values of f near x = 2. No formula or continuity assumption is given. Which conclusion is justified?<table><caption>Selected nearby values</caption><thead><tr><th scope=\"col\">x</th><th scope=\"col\">f(x)</th></tr></thead><tbody><tr><th scope=\"row\">1.9</th><td>6.9</td></tr><tr><th scope=\"row\">1.99</th><td>6.99</td></tr><tr><th scope=\"row\">2.01</th><td>7.01</td></tr><tr><th scope=\"row\">2.1</th><td>7.1</td></tr></tbody></table>",
      "choices": [
        "The table proves \\(\\lim_{x\\to2}f(x)=7\\).",
        "The table proves \\(f(2)=7\\).",
        "The table suggests a limit of \\(7\\), but finitely many samples do not establish all nearby behavior.",
        "The limit cannot exist because the table does not include x = 2."
      ],
      "answer": 2,
      "hint": "Distinguish a numerical prediction from a proof.",
      "solution": "Unsampled inputs can behave differently while preserving every listed value. A finite table supports a conjecture; a neighborhood-level condition or appropriate theorem is needed for a proof.",
      "representation": "tabular"
    },
    {
      "topic": "1.7",
      "lo": "LIM-1.C, LIM-1.D, LIM-1.E (synthesis)",
      "skill": "1.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "ap9",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "\\(\\lim_{x\\to2}\\frac{x^2-4}{x^2-3x+2}=\\)",
      "choices": [
        "\\(-4\\)",
        "\\(4\\)",
        "\\(0\\)",
        "DNE"
      ],
      "answer": 1,
      "hint": "Factor both polynomials and cancel only a common factor.",
      "solution": "The quotient is \\((x-2)(x+2)/[(x-2)(x-1)]\\). For nearby \\(x\\ne2\\), reduce to \\((x+2)/(x-1)\\to4\\).",
      "representation": "analytical"
    },
    {
      "topic": "1.7",
      "lo": "LIM-1.C, LIM-1.D, LIM-1.E (synthesis)",
      "skill": "1.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "ap10",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Which procedure evaluates \\(\\lim_{x\\to0}\\frac{\\tan x}{\\sin x}\\) using an elementary identity?",
      "choices": [
        "Replace \\(\\tan x\\) by \\(\\sin x\\cos x\\).",
        "Cancel the angles and obtain \\(\\tan 1\\).",
        "Declare the limit to be zero from the numerator's limit.",
        "Use \\(\\tan x=\\sin x/\\cos x\\), cancel \\(\\sin x\\) away from zero, then evaluate \\(1/\\cos x\\)."
      ],
      "answer": 3,
      "hint": "Write tangent as a quotient of sine and cosine.",
      "solution": "On a sufficiently small punctured neighborhood of \\(0\\), the quotient equals \\(1/\\cos x\\). Since \\(\\cos x\\to1\\), the limit is \\(1\\).",
      "representation": "analytical"
    },
    {
      "topic": "1.7",
      "lo": "LIM-1.C, LIM-1.D, LIM-1.E (synthesis)",
      "skill": "1.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "ap11",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "For \\(x<2\\), let \\(f(x)=x+1\\); for \\(x>2\\), let \\(f(x)=7-x\\). Which procedure correctly determines \\(\\lim_{x\\to2}f(x)\\)?",
      "choices": [
        "Average the two formula values to get 4.",
        "Use only the formula on the right because x increases toward 2.",
        "Compare the left limit 3 and the right limit 5; their disagreement gives DNE.",
        "Set f(2) = 4 and conclude the limit is 4."
      ],
      "answer": 2,
      "hint": "Each formula governs a different direction of approach.",
      "solution": "The left branch tends to \\(3\\), while the right branch tends to \\(5\\). Their average is not a limit, and no choice of \\(f(2)\\) makes the one-sided limits agree.",
      "representation": "analytical"
    },
    {
      "topic": "1.7",
      "lo": "LIM-1.C, LIM-1.D, LIM-1.E (synthesis)",
      "skill": "1.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "ap12",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Which pair of limits can both be evaluated by direct substitution with no preliminary rewrite?",
      "choices": [
        "\\(\\lim_{x\\to1}(x^2+3)\\) and \\(\\lim_{x\\to2}(x+1)/(x+4)\\)",
        "\\(\\lim_{x\\to1}(x^2-1)/(x-1)\\) and \\(\\lim_{x\\to2}(x+1)/(x+4)\\)",
        "\\(\\lim_{x\\to0}|x|/x\\) and \\(\\lim_{x\\to1}(x^2+3)\\)",
        "\\(\\lim_{x\\to3}(\\sqrt{x+6}-3)/(x-3)\\) and \\(\\lim_{x\\to1}(x^2+3)\\)"
      ],
      "answer": 0,
      "hint": "Check whether the displayed denominator is nonzero at the target.",
      "solution": "The polynomial has limit \\(4\\), and the quotient has denominator limit \\(6\\ne0\\), giving \\(1/2\\). Each other pair includes an expression yielding \\(0/0\\) that needs further analysis.",
      "representation": "analytical"
    }
  ],
  "frqs": [
    {
      "topic": "1.7",
      "lo": "LIM-1.C, LIM-1.D, LIM-1.E (synthesis)",
      "skill": "1.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "frq1",
      "representation": "analytical",
      "context": "Define \\(F(x)=\\frac{x^2-4}{x-2}\\) for \\(x\\ne2\\), with \\(F(2)=9\\). Separately, let \\(R(x)=\\frac{\\sqrt{x+7}-3}{x-2}\\) for \\(x\\ne2\\). Choose and justify procedures using algebra and limit laws.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Find \\(\\lim_{x\\to2}F(x)\\). State why your chosen procedure applies.",
          "rubric": "<ol><li>1 point: Factor the numerator as \\((x-2)(x+2)\\), identifying a common factor.</li><li>1 point: State \\(F(x)=x+2\\) for nearby \\(x\\ne2\\).</li><li>1 point: Use the polynomial limit to obtain \\(4\\).</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Find \\(\\lim_{x\\to2}R(x)\\), explaining why direct substitution into the original quotient is insufficient.",
          "rubric": "<ol><li>1 point: Identify \\(0/0\\) as indeterminate and choose the conjugate \\(\\sqrt{x+7}+3\\).</li><li>1 point: Multiply both numerator and denominator and cancel \\(x-2\\) for \\(x\\ne2\\), obtaining \\(1/(\\sqrt{x+7}+3)\\).</li><li>1 point: Evaluate as \\(1/6\\), noting the rewritten denominator tends to nonzero \\(6\\).</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "A student claims that replacing \\(F(2)=9\\) with \\(F(2)=4\\) changes the limit in part (a). Explain why the claim is false.",
          "rubric": "<ol><li>1 point: Identify the change as affecting only the single input \\(2\\).</li><li>1 point: State that both versions equal \\(x+2\\) on every sufficiently close input other than \\(2\\).</li><li>1 point: Conclude that both limits remain \\(4\\); the point value and the limiting value are different quantities.</li></ol>"
        }
      ]
    },
    {
      "topic": "1.7",
      "lo": "LIM-1.C, LIM-1.D, LIM-1.E (synthesis)",
      "skill": "1.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "frq2",
      "representation": "analytical and verbal",
      "context": "Consider \\(A(x)=\\frac{1/(x+1)-1/3}{x-2}\\) and \\(B(x)=\\frac{|x-2|}{x-2}\\), both for \\(x\\ne2\\) near \\(2\\). Each expression yields \\(0/0\\) under substitution.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Find \\(\\lim_{x\\to2}A(x)\\) using a suitable algebraic strategy.",
          "rubric": "<ol><li>1 point: Combine the numerator as \\((2-x)/[3(x+1)]\\).</li><li>1 point: For \\(x\\ne2\\), reduce the full quotient to \\(-1/[3(x+1)]\\).</li><li>1 point: Use the nonzero denominator limit to obtain \\(-1/9\\).</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Find the two one-sided limits of \\(B\\) at \\(2\\) and determine whether the two-sided limit exists.",
          "rubric": "<ol><li>1 point: For \\(x<2\\), use \\(|x-2|=2-x\\) and obtain left limit \\(-1\\).</li><li>1 point: For \\(x>2\\), use \\(|x-2|=x-2\\) and obtain right limit \\(1\\).</li><li>1 point: Conclude that the two-sided limit does not exist because the one-sided limits differ.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "Explain why the shared substitution form does not justify using the same procedure or assigning the same limit to A and B.",
          "rubric": "<ol><li>1 point: Identify \\(0/0\\) as an indeterminate diagnostic, not a numerical answer.</li><li>1 point: Connect A's reciprocal difference to a common-denominator rewrite valid on both sides.</li><li>1 point: Connect B's absolute value to different side formulas and explain that the resulting side limits determine existence.</li></ol>"
        }
      ]
    }
  ]
};
if(typeof module==='object'&&module.exports)module.exports=data;root.Unit1Lesson=data;
})(typeof window!=='undefined'?window:globalThis);
