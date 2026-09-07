/* Original ECHS AP Calculus AB lesson content. */
(function(root){const data={
  "number": "1.9",
  "title": "Connecting Multiple Representations of Limits",
  "subtitle": "Translate between formulas, graphs, tables, and precise mathematical language.",
  "objective": "Connect equivalent limit information across analytical, graphical, numerical, and verbal representations while distinguishing evidence from a justified conclusion.",
  "lo": "LIM-1.B, LIM-1.C, LIM-1.D, LIM-1.E (synthesis)",
  "ek": "Cumulative limit representations and limit laws",
  "skill": "2.C",
  "goals": [
    "Read one-sided and two-sided limits from a complete local graph.",
    "Translate verbal approach statements into precise limit notation.",
    "Use tables to estimate limits and identify what finite data cannot prove.",
    "Connect an algebraic rewrite to a graph's hole and nearby values.",
    "Apply limit laws using limiting values, while checking denominator and composition conditions."
  ],
  "ideas": [
    {
      "title": "Keep input, output, and direction separate",
      "body": "<p>The statement \\(\\lim_{x\\to a^-}f(x)=L\\) means that when the <em>input</em> approaches \\(a\\) through values smaller than \\(a\\), the <em>output</em> approaches \\(L\\). The superscript minus belongs to the input direction; it does not mean the output is negative. A two-sided limit exists when both one-sided limits exist and agree.</p><p>Translate a verbal statement in three steps: identify the approaching input, identify its direction, then identify the approaching output. “As time approaches \\(4\\) seconds from later times, the reading approaches \\(12\\)” becomes \\(\\lim_{t\\to4^+}R(t)=12\\). It says nothing by itself about the reading at exactly \\(4\\).</p>"
    },
    {
      "title": "Read the branches of a graph before its filled point",
      "body": "<p>To find a left-hand limit on a complete local graph, follow the branch toward the target from smaller x-values and read the height it approaches. Repeat from the right. An open point may mark that approached height. A filled point identifies the assigned function value; it need not identify either limit.</p><p>A line \\(y=x+3\\) with a hole at \\((1,4)\\) and a filled point at \\((1,-1)\\) represents a function with \\(\\lim_{x\\to1}f(x)=4\\) but \\(f(1)=-1\\). A graph with left height \\(2\\) and right height \\(5\\) has no two-sided limit, regardless of its filled point. Describe the direction and height explicitly so the reasoning survives translation into symbols.</p>"
    },
    {
      "title": "Tables estimate behavior; formulas can justify it",
      "body": "<p>Read a table by finding inputs close to the target on <em>both</em> sides, then tracking their outputs. Do not average a left trend and a different right trend to invent a limit. Do not confuse a row at the target with a limiting value. When only finitely many samples are given, describe the result as an estimate or a suggested trend.</p><p>A formula valid throughout a neighborhood can establish what the table suggests. If \\(f(x)=(x^2-9)/(x-3)\\) for \\(x\\ne3\\), cancellation gives \\(f(x)=x+3\\) nearby, proving a limit of \\(6\\). A finite table alone leaves unsampled values free to behave differently; additional assumptions must be stated before turning a numerical pattern into a theorem-level conclusion.</p>"
    },
    {
      "title": "Translate operations as well as individual limits",
      "body": "<p>If the given information establishes \\(f(x)\\to A\\) and \\(g(x)\\to B\\), then \\(2f(x)-g(x)\\to2A-B\\). For a quotient, check \\(B\\ne0\\) before applying the quotient law. Use the <em>limiting values</em> in these operations, not isolated values such as \\(f(a)\\).</p><p>For a composition, track the inner input: as \\(x\\to0^+\\), the input \\(-x\\) approaches \\(0\\) from the left, so \\(f(-x)\\) uses the left branch of \\(f\\). If \\(g(x)\\to b\\), replacing \\(\\lim f(g(x))\\) by \\(f(b)\\) requires suitable continuity of the outer function at \\(b\\). An inner function can repeatedly hit the exceptional point; the existence of \\(\\lim_{u\\to b}f(u)\\) alone does not justify every composition.</p>"
    }
  ],
  "workedExamples": [
    {
      "title": "One function, four consistent descriptions",
      "body": "<p>Let \\(f(x)=(x^2-9)/(x-3)\\) for \\(x\\ne3\\), and \\(f(3)=1\\). Algebraically, factoring gives \\(f(x)=x+3\\) for every nearby \\(x\\ne3\\). Therefore \\(\\lim_{x\\to3}f(x)=6\\).</p><p>Graphically, this is the line \\(y=x+3\\) with a hole at \\((3,6)\\) and a filled point at \\((3,1)\\). Numerically, inputs \\(2.9,2.99,3.01,3.1\\) give outputs \\(5.9,5.99,6.01,6.1\\). Verbally, nearby outputs approach \\(6\\) from either direction even though the assigned output at \\(3\\) is \\(1\\).</p><p>The representations agree on the limit. The algebra establishes the full nearby behavior; the small table illustrates it. Substituting the filled-point value into a limit expression would answer a different question.</p>"
    },
    {
      "title": "A graph and a formula establish a limit-law calculation",
      "body": "<p>Suppose the complete local graph of \\(f\\) approaches height \\(4\\) from each side of \\(x=1\\), while its filled point is \\((1,-2)\\). Let \\(g(x)=x^2+1\\). Find \\(\\lim_{x\\to1}\\frac{2f(x)+g(x)}{g(x)}\\).</p><p>The graph establishes \\(\\lim_{x\\to1}f(x)=4\\), and the polynomial formula gives \\(\\lim_{x\\to1}g(x)=2\\). The numerator tends to \\(2(4)+2=10\\). Since the denominator limit is \\(2\\ne0\\), the quotient law applies and gives \\(10/2=5\\).</p><p>The assigned value \\(f(1)=-2\\) does not enter. If the denominator limit were zero, substitution into the quotient law would not be valid; another argument would be required.</p>"
    }
  ],
  "questions": [
    {
      "topic": "1.9",
      "lo": "LIM-1.B, LIM-1.C, LIM-1.D, LIM-1.E (synthesis)",
      "skill": "2.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "g1",
      "type": "number",
      "group": "Guided check",
      "prompt": "Based on the nearby values in the table, estimate \\(\\lim_{x\\to2}f(x)\\).<table><caption>Samples around x = 2</caption><thead><tr><th scope=\"col\">x</th><th scope=\"col\">f(x)</th></tr></thead><tbody><tr><th scope=\"row\">1.9</th><td>4.9</td></tr><tr><th scope=\"row\">1.99</th><td>4.99</td></tr><tr><th scope=\"row\">1.999</th><td>4.999</td></tr><tr><th scope=\"row\">2</th><td>9</td></tr><tr><th scope=\"row\">2.001</th><td>5.001</td></tr><tr><th scope=\"row\">2.01</th><td>5.01</td></tr><tr><th scope=\"row\">2.1</th><td>5.1</td></tr></tbody></table>",
      "answer": 5,
      "unit": "estimated limit",
      "hint": "Follow the nearby outputs on both sides; keep the x = 2 row separate.",
      "solution": "The nearby outputs suggest \\(5\\) from both sides, whereas \\(f(2)=9\\). The best estimate is \\(5\\); this finite table alone is not a proof of the limit.",
      "representation": "tabular"
    },
    {
      "topic": "1.9",
      "lo": "LIM-1.B, LIM-1.C, LIM-1.D, LIM-1.E (synthesis)",
      "skill": "2.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "g2",
      "type": "mcq",
      "group": "Guided check",
      "prompt": "Which notation expresses: as x approaches −2 through values smaller than −2, the output f(x) approaches 3?",
      "choices": [
        "\\(\\lim_{x\\to-2^+}f(x)=3\\)",
        "\\(f(-2)=3\\)",
        "\\(\\lim_{x\\to-2^-}f(x)=3\\)",
        "\\(\\lim_{x\\to3^-}f(x)=-2\\)"
      ],
      "answer": 2,
      "hint": "The minus superscript describes inputs to the left of the target.",
      "solution": "Inputs smaller than \\(-2\\) approach from the left, represented by \\(x\\to-2^-\\). The approaching output is \\(3\\).",
      "representation": "verbal"
    },
    {
      "topic": "1.9",
      "lo": "LIM-1.B, LIM-1.C, LIM-1.D, LIM-1.E (synthesis)",
      "skill": "2.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "g3",
      "type": "number",
      "group": "Guided check",
      "prompt": "Use the complete local graph to determine \\(\\lim_{x\\to0}f(x)\\). Enter DNE if no two-sided limit exists.",
      "answer": "DNE",
      "unit": "exact value",
      "hint": "Read the left and right approach heights separately.",
      "solution": "The graph gives a left limit of \\(2\\) and a right limit of \\(-1\\). Their disagreement makes the two-sided limit DNE, regardless of \\(f(0)=3\\).",
      "representation": "graphical",
      "visual": {
        "xMin": -2,
        "xMax": 2,
        "yMin": -3,
        "yMax": 5,
        "paths": [
          [
            [
              -2,
              0
            ],
            [
              -1,
              1
            ],
            [
              0,
              2
            ]
          ],
          [
            [
              0,
              -1
            ],
            [
              1,
              0
            ],
            [
              2,
              1
            ]
          ]
        ],
        "open": [
          [
            0,
            2
          ],
          [
            0,
            -1
          ]
        ],
        "closed": [
          [
            0,
            3
          ]
        ],
        "caption": "The left branch y = x + 2 approaches (0, 2); the right branch y = x − 1 approaches (0, −1). Both endpoints are open. The filled point is (0, 3)."
      }
    },
    {
      "topic": "1.9",
      "lo": "LIM-1.B, LIM-1.C, LIM-1.D, LIM-1.E (synthesis)",
      "skill": "2.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "g4",
      "type": "number",
      "group": "Guided check",
      "prompt": "Using the same complete local graph, find \\(f(0)\\).",
      "answer": 3,
      "unit": "exact value",
      "hint": "This asks for the function value at the input, not an approach value.",
      "solution": "The filled point at \\((0,3)\\) gives \\(f(0)=3\\). The open endpoints represent branch approach heights, not assigned values.",
      "representation": "graphical",
      "visual": {
        "xMin": -2,
        "xMax": 2,
        "yMin": -3,
        "yMax": 5,
        "paths": [
          [
            [
              -2,
              0
            ],
            [
              -1,
              1
            ],
            [
              0,
              2
            ]
          ],
          [
            [
              0,
              -1
            ],
            [
              1,
              0
            ],
            [
              2,
              1
            ]
          ]
        ],
        "open": [
          [
            0,
            2
          ],
          [
            0,
            -1
          ]
        ],
        "closed": [
          [
            0,
            3
          ]
        ],
        "caption": "The left branch y = x + 2 approaches (0, 2); the right branch y = x − 1 approaches (0, −1). Both endpoints are open. The filled point is (0, 3)."
      }
    },
    {
      "topic": "1.9",
      "lo": "LIM-1.B, LIM-1.C, LIM-1.D, LIM-1.E (synthesis)",
      "skill": "2.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "ap1",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "For the complete local graph of \\(f\\) shown, \\(\\lim_{x\\to1}[2f(x)-3]=\\)",
      "choices": [
        "\\(-5\\)",
        "\\(4\\)",
        "\\(5\\)",
        "DNE"
      ],
      "answer": 2,
      "hint": "Use the height approached by both branches, then apply the linear operation.",
      "solution": "Both branches approach \\(4\\), so \\(2f(x)-3\\to2(4)-3=5\\). Using the filled value \\(-1\\) would incorrectly produce \\(-5\\).",
      "representation": "graphical",
      "visual": {
        "xMin": -1,
        "xMax": 3,
        "yMin": -2,
        "yMax": 7,
        "paths": [
          [
            [
              -1,
              2
            ],
            [
              0,
              3
            ],
            [
              1,
              4
            ]
          ],
          [
            [
              1,
              4
            ],
            [
              2,
              5
            ],
            [
              3,
              6
            ]
          ]
        ],
        "open": [
          [
            1,
            4
          ]
        ],
        "closed": [
          [
            1,
            -1
          ]
        ],
        "caption": "The straight line y = x + 3 near x = 1 has an open point at (1, 4); the filled point is (1, −1)."
      }
    },
    {
      "topic": "1.9",
      "lo": "LIM-1.B, LIM-1.C, LIM-1.D, LIM-1.E (synthesis)",
      "skill": "2.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "ap2",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "For the complete local graph shown, \\(\\lim_{x\\to0^+}f(-x)=\\)",
      "choices": [
        "\\(2\\)",
        "\\(-1\\)",
        "\\(3\\)",
        "DNE"
      ],
      "answer": 0,
      "hint": "When x is positive and near zero, what side of zero contains −x?",
      "solution": "As \\(x\\to0^+\\), \\(-x\\to0^-\\). Therefore the left branch of \\(f\\) determines the limit, which is \\(2\\).",
      "representation": "graphical",
      "visual": {
        "xMin": -2,
        "xMax": 2,
        "yMin": -3,
        "yMax": 5,
        "paths": [
          [
            [
              -2,
              0
            ],
            [
              -1,
              1
            ],
            [
              0,
              2
            ]
          ],
          [
            [
              0,
              -1
            ],
            [
              1,
              0
            ],
            [
              2,
              1
            ]
          ]
        ],
        "open": [
          [
            0,
            2
          ],
          [
            0,
            -1
          ]
        ],
        "closed": [
          [
            0,
            3
          ]
        ],
        "caption": "The left branch y = x + 2 approaches (0, 2); the right branch y = x − 1 approaches (0, −1). Both endpoints are open. The filled point is (0, 3)."
      }
    },
    {
      "topic": "1.9",
      "lo": "LIM-1.B, LIM-1.C, LIM-1.D, LIM-1.E (synthesis)",
      "skill": "2.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "ap3",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Using the trends in the table, which is the best numerical estimate of \\(\\lim_{x\\to3}\\frac{f(x)}{g(x)}\\)?<table><caption>Nearby samples</caption><thead><tr><th scope=\"col\">x</th><th scope=\"col\">f(x)</th><th scope=\"col\">g(x)</th></tr></thead><tbody><tr><th scope=\"row\">2.9</th><td>1.97</td><td>4.04</td></tr><tr><th scope=\"row\">2.99</th><td>1.997</td><td>4.004</td></tr><tr><th scope=\"row\">2.999</th><td>1.9997</td><td>4.0004</td></tr><tr><th scope=\"row\">3.001</th><td>2.0003</td><td>3.9996</td></tr><tr><th scope=\"row\">3.01</th><td>2.003</td><td>3.996</td></tr><tr><th scope=\"row\">3.1</th><td>2.03</td><td>3.96</td></tr></tbody></table>",
      "choices": [
        "\\(2\\)",
        "\\(8\\)",
        "\\(0\\)",
        "\\(1/2\\)"
      ],
      "answer": 3,
      "hint": "Estimate each output trend before estimating the ratio.",
      "solution": "The entries suggest \\(f(x)\\to2\\) and \\(g(x)\\to4\\), giving a ratio estimate \\(1/2\\). Because the table is finite, this is an estimate; if those component limits are established, the quotient law confirms it since \\(4\\ne0\\).",
      "representation": "tabular"
    },
    {
      "topic": "1.9",
      "lo": "LIM-1.B, LIM-1.C, LIM-1.D, LIM-1.E (synthesis)",
      "skill": "2.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "ap4",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Which statement best describes the evidence in this table?<table><caption>Samples around x = 1</caption><thead><tr><th scope=\"col\">x</th><th scope=\"col\">h(x)</th></tr></thead><tbody><tr><th scope=\"row\">0.9</th><td>4.9</td></tr><tr><th scope=\"row\">0.99</th><td>4.99</td></tr><tr><th scope=\"row\">0.999</th><td>4.999</td></tr><tr><th scope=\"row\">1</th><td>0</td></tr><tr><th scope=\"row\">1.001</th><td>8.001</td></tr><tr><th scope=\"row\">1.01</th><td>8.01</td></tr><tr><th scope=\"row\">1.1</th><td>8.1</td></tr></tbody></table>",
      "choices": [
        "The table proves the two-sided limit is 0.",
        "The entries suggest a left limit of 5 and a right limit of 8, so they suggest no two-sided limit.",
        "The best two-sided estimate is 6.5, the average of the side trends.",
        "The entry h(1) = 0 prevents either one-sided limit from existing."
      ],
      "answer": 1,
      "hint": "Compare the two approach trends without averaging them.",
      "solution": "The left data approach \\(5\\) and the right data approach \\(8\\). This suggests unequal one-sided limits and hence no two-sided limit, but a finite table by itself is not a proof. The assigned point value is separate.",
      "representation": "tabular"
    },
    {
      "topic": "1.9",
      "lo": "LIM-1.B, LIM-1.C, LIM-1.D, LIM-1.E (synthesis)",
      "skill": "2.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "ap5",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "A function's local graph is the line \\(y=2x-1\\), with an open point at \\((1,1)\\) and a filled point at \\((1,4)\\). Which formula represents this graph near \\(x=1\\)?",
      "choices": [
        "\\(f(x)=2x-1\\) for every \\(x\\), including \\(x=1\\).",
        "\\(f(x)=\\frac{x^2-1}{x-1}\\) for \\(x\\ne1\\), and \\(f(1)=4\\).",
        "\\(f(x)=\\frac{2x^2-3x+1}{x-1}\\) for \\(x\\ne1\\), and \\(f(1)=4\\).",
        "\\(f(x)=\\frac{2x^2-3x+1}{x-1}\\) for \\(x\\ne1\\), and \\(f(1)=1\\)."
      ],
      "answer": 2,
      "hint": "Factor the numerator in the candidate quotient.",
      "solution": "Since \\(2x^2-3x+1=(x-1)(2x-1)\\), the third formula equals \\(2x-1\\) away from \\(1\\) and assigns the separate filled value \\(4\\) at \\(1\\).",
      "representation": "verbal and analytical"
    },
    {
      "topic": "1.9",
      "lo": "LIM-1.B, LIM-1.C, LIM-1.D, LIM-1.E (synthesis)",
      "skill": "2.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "ap6",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "A sensor reading \\(R(t)\\) approaches \\(12\\) as time approaches \\(4\\) seconds through times later than \\(4\\). Which statement is an exact translation?",
      "choices": [
        "\\(\\lim_{t\\to4^+}R(t)=12\\)",
        "\\(\\lim_{t\\to4^-}R(t)=12\\)",
        "\\(R(4)=12\\)",
        "\\(\\lim_{t\\to12^+}R(t)=4\\)"
      ],
      "answer": 0,
      "hint": "Later times are larger input values.",
      "solution": "Approaching \\(4\\) through later times means \\(t>4\\), so the approach is \\(4^+\\). The output tends to \\(12\\), and the statement does not assign \\(R(4)\\).",
      "representation": "verbal"
    },
    {
      "topic": "1.9",
      "lo": "LIM-1.B, LIM-1.C, LIM-1.D, LIM-1.E (synthesis)",
      "skill": "2.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "ap7",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "The complete local graph of \\(f\\) shows \\(\\lim_{x\\to2}f(x)=3\\) and \\(f(2)=-4\\). Let \\(g(x)=x+2\\). Then \\(\\lim_{x\\to2}[f(x)g(x)]=\\)",
      "choices": [
        "\\(-16\\)",
        "\\(-1\\)",
        "\\(7\\)",
        "\\(12\\)"
      ],
      "answer": 3,
      "hint": "Multiply the limiting outputs, not the assigned point values.",
      "solution": "The graph establishes a limit of \\(3\\) for \\(f\\); the formula gives a limit of \\(4\\) for \\(g\\). The product law gives \\(3\\cdot4=12\\).",
      "representation": "graphical and analytical"
    },
    {
      "topic": "1.9",
      "lo": "LIM-1.B, LIM-1.C, LIM-1.D, LIM-1.E (synthesis)",
      "skill": "2.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "ap8",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "It is known that \\(\\lim_{x\\to1}f(x)=0\\) and \\(\\lim_{x\\to1}g(x)=0\\), with \\(g(x)\\ne0\\) for \\(x\\ne1\\) near \\(1\\). What can be concluded about \\(\\lim_{x\\to1}f(x)/g(x)\\) from this information alone?",
      "choices": [
        "It is 0.",
        "Its value and existence cannot be determined from these two limits alone.",
        "It is 1.",
        "It does not exist."
      ],
      "answer": 1,
      "hint": "Compare f = g with f = (x − 1)² and g = x − 1.",
      "solution": "Taking \\(f=g=x-1\\) gives ratio limit \\(1\\), while \\(f=(x-1)^2\\), \\(g=x-1\\) gives \\(0\\). Other choices can give nonexistence. The quotient law requires a nonzero denominator limit.",
      "representation": "analytical"
    },
    {
      "topic": "1.9",
      "lo": "LIM-1.B, LIM-1.C, LIM-1.D, LIM-1.E (synthesis)",
      "skill": "2.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "ap9",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "A finite table of \\(f\\) at inputs near \\(2\\) suggests outputs approaching \\(5\\). Which additional fact would prove \\(\\lim_{x\\to2}f(x)=5\\)?",
      "choices": [
        "One more nearby table entry equals \\(5\\).",
        "The point value \\(f(2)\\) is defined.",
        "For every sufficiently close \\(x\\ne2\\), \\(f(x)=x+3\\).",
        "The listed outputs are all less than \\(10\\)."
      ],
      "answer": 2,
      "hint": "Look for information covering an entire punctured neighborhood.",
      "solution": "Agreement with \\(x+3\\) at every sufficiently close nontarget input gives the same limit as that polynomial, namely \\(5\\). Finite additional samples, bounded samples, or a point value do not establish the limit.",
      "representation": "tabular and analytical"
    },
    {
      "topic": "1.9",
      "lo": "LIM-1.B, LIM-1.C, LIM-1.D, LIM-1.E (synthesis)",
      "skill": "2.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "ap10",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Let \\(f(x)=\\frac{x^2-4}{x-2}\\) for \\(x\\ne2\\), and let \\(f(2)=7\\). Which graph description is correct?",
      "choices": [
        "The line \\(y=x+2\\), with a hole at \\((2,4)\\) and a filled point at \\((2,7)\\).",
        "The line \\(y=x+2\\), with a filled point at \\((2,4)\\) and a hole at \\((2,7)\\).",
        "A graph with a vertical asymptote at \\(x=2\\).",
        "The line \\(y=x-2\\), with a filled point at \\((2,7)\\)."
      ],
      "answer": 0,
      "hint": "Factor the difference of squares and keep the assigned point separate.",
      "solution": "Away from \\(2\\), the quotient equals \\(x+2\\). Its missing line point is \\((2,4)\\), and the specified function value creates the filled point \\((2,7)\\).",
      "representation": "analytical and graphical"
    },
    {
      "topic": "1.9",
      "lo": "LIM-1.B, LIM-1.C, LIM-1.D, LIM-1.E (synthesis)",
      "skill": "2.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "ap11",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "As \\(x\\to1\\), \\(g(x)\\to4\\). The function \\(f\\) is continuous at \\(4\\), and \\(f(4)=-2\\). What is \\(\\lim_{x\\to1}f(g(x))\\)?",
      "choices": [
        "\\(4\\)",
        "Cannot be determined.",
        "\\(1\\)",
        "\\(-2\\)"
      ],
      "answer": 3,
      "hint": "Continuity connects the outer value to nearby outer outputs.",
      "solution": "Continuity of \\(f\\) at the inner limiting input \\(4\\) permits substitution into the outer function: \\(f(g(x))\\to f(4)=-2\\).",
      "representation": "verbal and analytical"
    },
    {
      "topic": "1.9",
      "lo": "LIM-1.B, LIM-1.C, LIM-1.D, LIM-1.E (synthesis)",
      "skill": "2.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "ap12",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "The table is generated by \\(f(x)=\\frac{x^2-1}{x-1}\\) for \\(x\\ne1\\), with \\(f(1)=6\\). Which interpretation correctly connects the table to the formula?<table><caption>Values of f</caption><thead><tr><th scope=\"col\">x</th><th scope=\"col\">f(x)</th></tr></thead><tbody><tr><th scope=\"row\">0.9</th><td>1.9</td></tr><tr><th scope=\"row\">0.99</th><td>1.99</td></tr><tr><th scope=\"row\">1</th><td>6</td></tr><tr><th scope=\"row\">1.01</th><td>2.01</td></tr><tr><th scope=\"row\">1.1</th><td>2.1</td></tr></tbody></table>",
      "choices": [
        "The limit is 6 because the middle table entry is exact.",
        "The table suggests \\(2\\), and the identity \\(f(x)=x+1\\) for nearby \\(x\\ne1\\) proves the limit is \\(2\\).",
        "The limit is the average of all five output entries.",
        "The limit does not exist because the center entry interrupts the trend."
      ],
      "answer": 1,
      "hint": "Use the algebraic identity to support the table's trend.",
      "solution": "Factoring gives \\((x^2-1)/(x-1)=x+1\\) for \\(x\\ne1\\). That establishes the nearby behavior and the limit \\(2\\); the center value \\(6\\) is independent.",
      "representation": "tabular and analytical"
    }
  ],
  "frqs": [
    {
      "topic": "1.9",
      "lo": "LIM-1.B, LIM-1.C, LIM-1.D, LIM-1.E (synthesis)",
      "skill": "2.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "frq1",
      "representation": "tabular, analytical, and graphical",
      "context": "For \\(x\\ne2\\), \\(F(x)=\\frac{x^2+x-6}{x-2}\\), and \\(F(2)=-1\\). Selected values are shown.<table><caption>Selected values of F</caption><thead><tr><th scope=\"col\">x</th><th scope=\"col\">F(x)</th></tr></thead><tbody><tr><th scope=\"row\">1.9</th><td>4.9</td></tr><tr><th scope=\"row\">1.99</th><td>4.99</td></tr><tr><th scope=\"row\">2</th><td>−1</td></tr><tr><th scope=\"row\">2.01</th><td>5.01</td></tr><tr><th scope=\"row\">2.1</th><td>5.1</td></tr></tbody></table>",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Using the table, state the suggested left-hand and right-hand limits at \\(2\\), and distinguish them from \\(F(2)\\).",
          "rubric": "<ol><li>1 point: Read the left-side trend as suggesting \\(5\\).</li><li>1 point: Read the right-side trend as suggesting \\(5\\).</li><li>1 point: Identify \\(F(2)=-1\\) as the assigned point value, distinct from either approach trend.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Use the formula to prove \\(\\lim_{x\\to2}F(x)\\), and explain what the algebra adds to the finite table.",
          "rubric": "<ol><li>1 point: Factor \\(x^2+x-6=(x-2)(x+3)\\).</li><li>1 point: For every nearby \\(x\\ne2\\), cancel to obtain \\(F(x)=x+3\\), whose limit is \\(5\\).</li><li>1 point: Explain that the identity controls every sufficiently close nontarget input, whereas a finite table only samples selected inputs.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "Describe or sketch the complete local graph near \\(x=2\\), including open and filled points. Use that description to explain the limiting value.",
          "rubric": "<ol><li>1 point: Give the nearby straight line \\(y=x+3\\).</li><li>1 point: Place an open point at \\((2,5)\\) and a filled point at \\((2,-1)\\).</li><li>1 point: Explain that both branches approach height \\(5\\), establishing agreement with part (b), regardless of the filled point.</li></ol>"
        }
      ]
    },
    {
      "topic": "1.9",
      "lo": "LIM-1.B, LIM-1.C, LIM-1.D, LIM-1.E (synthesis)",
      "skill": "2.C",
      "calculator": false,
      "source": "Original ECHS item",
      "id": "frq2",
      "representation": "graphical, tabular, and analytical",
      "context": "The complete local graph of \\(f\\) consists of \\(y=x+2\\) for \\(x<0\\), \\(y=x-1\\) for \\(x>0\\), and the filled point \\((0,3)\\). Thus its branch endpoints \\((0,2)\\) and \\((0,-1)\\) are open. A second function \\(g\\) is continuous at \\(t=2\\), and its values below include \\(g(2)=4\\).<table><caption>Selected values of g</caption><thead><tr><th scope=\"col\">t</th><th scope=\"col\">g(t)</th></tr></thead><tbody><tr><th scope=\"row\">1.9</th><td>3.98</td></tr><tr><th scope=\"row\">1.99</th><td>3.998</td></tr><tr><th scope=\"row\">2</th><td>4</td></tr><tr><th scope=\"row\">2.01</th><td>4.002</td></tr><tr><th scope=\"row\">2.1</th><td>4.02</td></tr></tbody></table>",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Determine \\(\\lim_{t\\to2}g(t)\\). Identify the assumption that justifies the exact conclusion rather than only a numerical estimate.",
          "rubric": "<ol><li>1 point: Identify \\(g(2)=4\\) from the table.</li><li>1 point: Use the stated continuity at \\(2\\) to set the limit equal to the function value.</li><li>1 point: Conclude the exact limit is \\(4\\), explaining that the finite nearby samples alone would only suggest it.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Find \\(\\lim_{t\\to2^-}f(t-2)\\) and \\(\\lim_{t\\to2^+}f(t-2)\\). Does \\(\\lim_{t\\to2}f(t-2)\\) exist?",
          "rubric": "<ol><li>1 point: As \\(t\\to2^-\\), \\(t-2\\to0^-\\), so the left branch gives limit \\(2\\).</li><li>1 point: As \\(t\\to2^+\\), \\(t-2\\to0^+\\), so the right branch gives limit \\(-1\\).</li><li>1 point: Conclude the two-sided limit does not exist because \\(2\\ne-1\\).</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "Determine \\(\\lim_{t\\to2}\\frac{f(t-2)^2-f(t-2)}{g(t)}\\). Justify by comparing the two sides rather than assuming \\(f(t-2)\\) has a two-sided limit.",
          "rubric": "<ol><li>1 point: From the left, compute \\((2^2-2)/4=1/2\\), using the nonzero denominator limit \\(4\\).</li><li>1 point: From the right, compute \\(((-1)^2-(-1))/4=1/2\\), again using the nonzero denominator limit.</li><li>1 point: Conclude that the desired two-sided limit is \\(1/2\\) because its own one-sided limits agree, even though the inner expression in part (b) has no two-sided limit.</li></ol>"
        }
      ]
    }
  ]
};
if(typeof module==='object'&&module.exports)module.exports=data;root.Unit1Lesson=data;
})(typeof window!=='undefined'?window:globalThis);
