/* Original, reviewed ECHS Topic 1.2 classroom sequence. Fixed-template data; no student records. */
(function(root){const plan={
  "version": "echs.rates-classroom.v1",
  "revision": "4.2.0",
  "framework": "College Board AP Precalculus CED effective Fall 2026",
  "source": "https://apcentral.collegeboard.org/media/pdf/ap-precalculus-course-and-exam-description.pdf#page=38",
  "teacher": "Mr. Mohammad Abu Ghuwaleh",
  "questions": [
    {
      "id": "ct00",
      "type": "mcq",
      "group": "Your turn",
      "prompt": "Two garden tanks each gain 90 liters. Tank A takes 3 minutes; tank B takes 6 minutes. Which comparison is correct?",
      "choices": [
        "A gains water twice as fast on average as B.",
        "B gains water twice as fast on average as A.",
        "Their average rates are equal because both gain 90 liters.",
        "The tank with the greater initial volume must fill faster."
      ],
      "answer": 0,
      "hint": "Compare how much is gained per minute, not just the total amount.",
      "solution": "A: \\(90/3=30\\) L/min. B: \\(90/6=15\\) L/min. The same change can occur at different rates.",
      "ek": "1.2.A.1",
      "calculator": false,
      "origin": "Original ECHS classroom question; independently verified 2026-09-09"
    },
    {
      "id": "ct01",
      "type": "mcq",
      "group": "Your turn",
      "prompt": "Selected values of W are shown. On which listed interval is its average rate of change greatest?<div class=\"table-wrap\"><table class=\"rate-table\"><thead><tr><th scope=\"col\">t</th><th scope=\"col\">W(t)</th></tr></thead><tbody><tr><td>0</td><td>40</td></tr><tr><td>2</td><td>58</td></tr><tr><td>5</td><td>82</td></tr><tr><td>9</td><td>102</td></tr></tbody></table></div>",
      "choices": [
        "[0,9]",
        "[0,2]",
        "[2,5]",
        "[5,9]"
      ],
      "answer": 1,
      "hint": "Each output change must be divided by its own interval width.",
      "solution": "The four rates are \\(62/9,9,8,5\\). The greatest is 9 on [0,2]. A greater raw increase need not mean a greater rate.",
      "ek": "1.2.A.1",
      "calculator": false,
      "origin": "Original ECHS classroom question; independently verified 2026-09-09"
    },
    {
      "id": "ct02",
      "type": "mcq",
      "group": "Your turn",
      "prompt": "The function f is smooth near x=2 and x=5. Use the small intervals represented by the table to estimate the respective rates at those points.<div class=\"table-wrap\"><table class=\"rate-table\"><thead><tr><th scope=\"col\">x</th><th scope=\"col\">f(x)</th></tr></thead><tbody><tr><td>1.9</td><td>7.1</td></tr><tr><td>2.1</td><td>7.9</td></tr><tr><td>4.8</td><td>20.5</td></tr><tr><td>5.2</td><td>24.5</td></tr></tbody></table></div>",
      "choices": [
        "0.8 and 4",
        "4 and 20",
        "8 and 10",
        "4 and 10"
      ],
      "answer": 3,
      "hint": "The first interval has width 0.2; the second has width 0.4.",
      "solution": "Near 2: \\((7.9-7.1)/(2.1-1.9)=4\\). Near 5: \\((24.5-20.5)/(5.2-4.8)=10\\). These are local estimates from the stated intervals.",
      "ek": "1.2.A.2–3",
      "calculator": false,
      "origin": "Original ECHS classroom question; independently verified 2026-09-09"
    },
    {
      "id": "ct03",
      "type": "mcq",
      "group": "Your turn",
      "prompt": "The smooth function g is decreasing. Use nearby values to compare the rates at x=3 and x=7.<div class=\"table-wrap\"><table class=\"rate-table\"><thead><tr><th scope=\"col\">x</th><th scope=\"col\">g(x)</th></tr></thead><tbody><tr><td>2.9</td><td>61.2</td></tr><tr><td>3.1</td><td>59.2</td></tr><tr><td>6.9</td><td>31.1</td></tr><tr><td>7.1</td><td>30.7</td></tr></tbody></table></div>",
      "choices": [
        "The signed rate is greater at 3, and the decrease is faster at 3.",
        "The signed rate is greater at 7, and the decrease is faster at 3.",
        "The signed rate is greater at 3, and the decrease is faster at 7.",
        "The signed rate is greater at 7, and the decrease is faster at 7."
      ],
      "answer": 1,
      "hint": "Compare signed numbers and absolute values separately.",
      "solution": "The estimates are \\(-10\\) and \\(-2\\). Since \\(-2>-10\\), the signed rate is greater at 7. Since \\(|-10|>|-2|\\), the decrease is faster near 3.",
      "ek": "1.2.A.3 / 1.2.B.3",
      "calculator": false,
      "origin": "Original ECHS classroom question; independently verified 2026-09-09"
    },
    {
      "id": "ct04",
      "type": "mcq",
      "group": "Your turn",
      "prompt": "A function q satisfies q(1)=8 and q(7)=8. Which statement must be true?",
      "choices": [
        "q is constant on [1,7].",
        "q decreases and then increases on [1,7].",
        "The average rate of q on [1,7] is zero.",
        "The rate of q at x=4 is zero."
      ],
      "answer": 2,
      "hint": "What does the endpoint information actually determine?",
      "solution": "The average is \\((8-8)/(7-1)=0\\). Equal endpoint values alone do not establish interior behavior or a rate at a particular point.",
      "ek": "1.2.A.1",
      "calculator": false,
      "origin": "Original ECHS classroom question; independently verified 2026-09-09"
    },
    {
      "id": "ct05",
      "type": "mcq",
      "group": "Your turn",
      "prompt": "For \\(f(x)=x^3-2x+5\\), f(1.9)=8.059 and f(2.1)=10.061. Use [1.9,2.1] to approximate the rate of change at x=2.",
      "choices": [
        "2.002",
        "10",
        "10.01",
        "20.02"
      ],
      "answer": 2,
      "hint": "Use both displayed function values and the width 0.2.",
      "solution": "\\((10.061-8.059)/(2.1-1.9)=2.002/0.2=10.01\\). This is the exact average on the stated interval and an estimate of the rate at 2.",
      "ek": "1.2.A.2",
      "calculator": false,
      "origin": "Original ECHS classroom question; independently verified 2026-09-09"
    },
    {
      "id": "ct06",
      "type": "mcq",
      "group": "Your turn",
      "prompt": "The graph consists of the straight segments joining (2,14), (5,−1), and (8,2). What is the average rate of change on [2,8]?<div data-classroom-plot=\"segments\"></div>",
      "choices": [
        "−2",
        "−5",
        "2",
        "3"
      ],
      "answer": 0,
      "hint": "Use the two endpoints of the entire requested interval.",
      "solution": "\\((2-14)/(8-2)=-12/6=-2\\). The turning behavior inside the interval does not change this endpoint quotient.",
      "ek": "1.2.A.1",
      "calculator": false,
      "origin": "Original ECHS classroom question; independently verified 2026-09-09"
    },
    {
      "id": "ct07",
      "type": "mcq",
      "group": "Your turn",
      "prompt": "A school printing model C(n) gives the cost, in QAR, for n booklets. C(50)=245 and C(80)=335. Which statement correctly interprets the average rate on [50,80]?",
      "choices": [
        "Cost increases by 90 QAR per extra booklet.",
        "An extra 30 booklets adds 3 QAR in total.",
        "The total cost of each booklet is 3 QAR.",
        "Cost increases by 3 QAR per extra booklet, on average, from 50 to 80 booklets."
      ],
      "answer": 3,
      "hint": "The units come from cost change divided by number of booklets.",
      "solution": "\\((335-245)/(80-50)=90/30=3\\) QAR per booklet. This describes average additional cost over the specified interval, not total cost divided by quantity.",
      "ek": "1.2.A.1 / 1.2.B.1",
      "calculator": false,
      "origin": "Original ECHS classroom question; independently verified 2026-09-09"
    },
    {
      "id": "ct08",
      "type": "mcq",
      "group": "Your turn",
      "prompt": "A function f satisfies f(2)=−3. Its average rate of change on [2,6] is 4. What is f(6)?",
      "choices": [
        "1",
        "9",
        "13",
        "19"
      ],
      "answer": 2,
      "hint": "Recover the net output change before finding the final output.",
      "solution": "\\(f(6)-(-3)=4(6-2)=16\\), so \\(f(6)=13\\).",
      "ek": "1.2.A.1",
      "calculator": false,
      "origin": "Original ECHS classroom question; independently verified 2026-09-09"
    },
    {
      "id": "idea01",
      "type": "mcq",
      "group": "AP-style check",
      "prompt": "The smooth graph has a horizontal local maximum at P and changes from concave down to concave up at R. At which labeled point is the signed rate least?<div data-idea-plot=\"bend\"></div>",
      "choices": [
        "P",
        "Q",
        "R",
        "S"
      ],
      "answer": 2,
      "hint": "The least signed rate is the most negative rate, not the smallest output.",
      "solution": "R is on the steepest falling part. Before R the nearby signed rates decrease; after R they increase. P has zero rate, Q has a negative rate closer to zero, and S has positive rate.",
      "ek": "1.2.A.3 / 1.1 graphical bridge",
      "calculator": false,
      "origin": "Original ECHS task covering supplied-booklet ideas; independently verified 2026-09-09"
    },
    {
      "id": "idea02",
      "type": "mcq",
      "group": "AP-style check",
      "prompt": "Near the marked point A, the graph rises but becomes less steep as x increases. Which description is correct?<div data-idea-plot=\"rising-down\"></div>",
      "choices": [
        "Negative rate and concave down",
        "Negative rate and concave up",
        "Positive rate and concave down",
        "Positive rate and concave up"
      ],
      "answer": 2,
      "hint": "Decide the sign from rising/falling, then decide concavity from how the signed slopes change.",
      "solution": "The outputs rise, so the local rate is positive. Nearby signed rates get smaller, so the graph is concave down. Increasing does not automatically mean concave up.",
      "ek": "1.2.B.2 / 1.1 graphical bridge",
      "calculator": false,
      "origin": "Original ECHS task covering supplied-booklet ideas; independently verified 2026-09-09"
    },
    {
      "id": "idea03",
      "type": "mcq",
      "group": "AP-style check",
      "prompt": "Each graph is defined on [0,4]. Which has a negative average rate on that interval?<div data-idea-plot=\"endpoint-options\"></div>",
      "choices": [
        "Graph A",
        "Graph B",
        "Graph C",
        "Graph D"
      ],
      "answer": 1,
      "hint": "Only the outputs at x=0 and x=4 determine this interval average.",
      "solution": "Graph B has endpoint outputs 7 and 3, giving (3−7)/4=−1. The averages for A, C and D are 1, 0 and 2. Whether the curve crosses the x-axis is irrelevant.",
      "ek": "1.2.A.1",
      "calculator": false,
      "origin": "Original ECHS task covering supplied-booklet ideas; independently verified 2026-09-09"
    },
    {
      "id": "idea04",
      "type": "mcq",
      "group": "AP-style check",
      "prompt": "Two lift sensors record height changes over five successive 4-second intervals. Sensor A records +14, −6, +8, −3, +5 meters; sensor B records +5, +1, +2, +4, +6 meters. Compare their average rates over the 20 seconds.",
      "choices": [
        "A has the greater average rate.",
        "B has the greater average rate.",
        "Both average rates are 0.9 m/s.",
        "Initial heights are required."
      ],
      "answer": 2,
      "hint": "Add signed changes, then divide by total elapsed time.",
      "solution": "Each net change is 18 m. Each average rate is 18/20=0.9 m/s. Initial height is unnecessary because it cancels in the net change. Adding absolute changes would answer a different question.",
      "ek": "1.2.A.1",
      "calculator": false,
      "origin": "Original ECHS task covering supplied-booklet ideas; independently verified 2026-09-09"
    },
    {
      "id": "idea05",
      "type": "mcq",
      "group": "AP-style check",
      "prompt": "A function has average rates 7, −4, 3 and 5 on [0,2], [2,5], [5,9] and [9,12], respectively. On which interval is the net increase greatest?",
      "choices": [
        "[0,2]",
        "[2,5]",
        "[5,9]",
        "[9,12]"
      ],
      "answer": 3,
      "hint": "Multiply each average rate by its own input width.",
      "solution": "The net changes are 14, −12, 12 and 15. The largest positive change is 15 on [9,12], even though its average rate is not the largest.",
      "ek": "1.2.A.1",
      "calculator": false,
      "origin": "Original ECHS task covering supplied-booklet ideas; independently verified 2026-09-09"
    },
    {
      "id": "idea06",
      "type": "mcq",
      "group": "AP-style check",
      "prompt": "The graph is made of the displayed straight segments. On which listed interval is the average rate least?<div data-idea-plot=\"intervals\"></div>",
      "choices": [
        "[−4,−3]",
        "[−2,−1]",
        "[0,1]",
        "[2,4]"
      ],
      "answer": 0,
      "hint": "Read both endpoints and divide by the input width; compare signed answers.",
      "solution": "The rates are (0−3)/1=−3, (4−5)/1=−1, (−1−0)/1=−1 and (2−1)/2=0.5. The least is −3 on [−4,−3].",
      "ek": "1.2.A.1",
      "calculator": false,
      "origin": "Original ECHS task covering supplied-booklet ideas; independently verified 2026-09-09"
    },
    {
      "id": "idea07",
      "type": "mcq",
      "group": "AP-style check",
      "prompt": "The function p is given by \\(p(x)=x^2+4x+5=(x+2)^2+1\\). Which statement is true?",
      "choices": [
        "Its average rate is positive on every interval because p(x)>0.",
        "Its average rate is negative on intervals entirely to the left of −2 and positive on intervals entirely to the right of −2.",
        "Its average rate is positive to the left of −2 and negative to the right.",
        "Its average rate is zero on every interval that crosses −2."
      ],
      "answer": 1,
      "hint": "Locate the vertex and distinguish function values from rates.",
      "solution": "The upward-opening graph has its minimum at x=−2. It falls to the left and rises to the right. Crossing the vertex does not guarantee zero average: the endpoint outputs must be equal. No differentiation is needed.",
      "ek": "1.2.B.1–3 / prerequisite quadratic graph",
      "calculator": false,
      "origin": "Original ECHS task covering supplied-booklet ideas; independently verified 2026-09-09"
    },
    {
      "id": "idea08",
      "type": "mcq",
      "group": "AP-style check",
      "prompt": "The graph models the remaining water in a tank. Which statement is supported?<div data-idea-plot=\"drainage\"></div>",
      "choices": [
        "The water alternately decreases and increases.",
        "The water always decreases, but its rate of decrease varies.",
        "The water decreases at one constant rate.",
        "The water amount increases whenever the graph is concave up."
      ],
      "answer": 1,
      "hint": "Follow the graph from left to right; changing steepness is different from changing direction.",
      "solution": "The output falls throughout, so the water always decreases. Its steepness changes, so the rate is not constant. A decreasing graph can be concave up while its rate remains negative.",
      "ek": "1.2.B.1 / 1.1 graphical bridge",
      "calculator": false,
      "origin": "Original ECHS task covering supplied-booklet ideas; independently verified 2026-09-09"
    },
    {
      "id": "idea09",
      "type": "mcq",
      "group": "AP-style check",
      "prompt": "The graph models greenhouse temperature over 12 weeks. Of the labeled points, where is the signed rate greatest?<div data-idea-plot=\"cycle\"></div>",
      "choices": [
        "P, at week 1",
        "Q, at week 3",
        "R, at week 6",
        "S, at week 9"
      ],
      "answer": 0,
      "hint": "Look for the strongest upward change, not the highest temperature.",
      "solution": "P is rising and has positive rate. Q and S are smooth turning points with zero rate. R is falling and has negative rate. Q has the highest temperature, but P has the greatest signed rate among these points.",
      "ek": "1.2.A.3",
      "calculator": false,
      "origin": "Original ECHS task covering supplied-booklet ideas; independently verified 2026-09-09"
    },
    {
      "id": "idea10",
      "type": "mcq",
      "group": "AP-style check",
      "prompt": "On every subinterval of (4,8), f has negative average rate and g has positive average rate. Which conclusion about h=f+g must be true?",
      "choices": [
        "h is increasing.",
        "h is decreasing.",
        "h is constant.",
        "The signs alone do not determine h; its behavior depends on the relative changes."
      ],
      "answer": 3,
      "hint": "On the same interval, the two average rates add.",
      "solution": "Negative plus positive may be negative, zero or positive. For instance −2+1=−1, −2+2=0, and −2+4=2. Their relative sizes may also vary, producing mixed behavior.",
      "ek": "1.2.A.1 / 1.2.B.1–3",
      "calculator": false,
      "origin": "Original ECHS task covering supplied-booklet ideas; independently verified 2026-09-09"
    },
    {
      "id": "idea11",
      "type": "mcq",
      "group": "AP-style check",
      "prompt": "On every subinterval of [0,4), both f and g have a negative average rate. What must be true of h=f+g on [0,4)?",
      "choices": [
        "h is strictly decreasing.",
        "h is constant.",
        "h is increasing.",
        "Its behavior cannot be determined."
      ],
      "answer": 0,
      "hint": "Choose any a<b in the interval and add the two negative changes.",
      "solution": "For every a<b, f(b)−f(a)<0 and g(b)−g(a)<0. Hence h(b)−h(a)<0, so h is strictly decreasing. The words “every subinterval” supply stronger evidence than one overall average.",
      "ek": "1.2.B.1–3",
      "calculator": false,
      "origin": "Original ECHS task covering supplied-booklet ideas; independently verified 2026-09-09"
    },
    {
      "id": "idea12",
      "type": "mcq",
      "group": "AP-style check",
      "prompt": "A function has average rate 2 on [0,1] and average rate 8 on [1,4]. What is its average rate on [0,4]?",
      "choices": [
        "5",
        "6.5",
        "10",
        "26"
      ],
      "answer": 1,
      "hint": "Combine net changes before dividing by total width.",
      "solution": "The changes are 2×1=2 and 8×3=24. The full average is (2+24)/4=6.5. Simply averaging 2 and 8 ignores the unequal widths.",
      "ek": "1.2.A.1",
      "calculator": false,
      "origin": "Original ECHS task covering supplied-booklet ideas; independently verified 2026-09-09"
    }
  ],
  "slides": [
    {
      "id": "warm-up",
      "title": "Warm-up · Same change, different rate",
      "objective": "Think independently, compare with a partner, then explain your choice.",
      "phase": "Warm-up",
      "minutes": 4,
      "blocks": [
        {
          "type": "questions",
          "ids": [
            "ct00"
          ]
        },
        {
          "type": "reflection",
          "prompt": "Explain your answer using the words “liters per minute.”"
        }
      ]
    },
    {
      "id": "your-turn-1",
      "title": "Your turn · Graphs and context",
      "objective": "Work independently. Write the quotient before choosing an answer.",
      "phase": "Your turn",
      "minutes": 6,
      "blocks": [
        {
          "type": "questions",
          "ids": [
            "ct06",
            "ct07"
          ]
        }
      ]
    },
    {
      "id": "your-turn-2",
      "title": "Your turn · Compare and reconstruct",
      "objective": "Use the interval width carefully; then work backwards from a rate.",
      "phase": "Your turn",
      "minutes": 6,
      "blocks": [
        {
          "type": "questions",
          "ids": [
            "ct01",
            "ct08"
          ]
        }
      ]
    },
    {
      "id": "your-turn-3",
      "title": "Your turn · What must be true?",
      "objective": "Separate an endpoint conclusion from a claim about the whole function.",
      "phase": "Your turn",
      "minutes": 3,
      "blocks": [
        {
          "type": "questions",
          "ids": [
            "ct04"
          ]
        },
        {
          "type": "reflection",
          "prompt": "Give an example of a nonconstant function with equal endpoint outputs. Explain why its average rate is zero."
        }
      ]
    },
    {
      "id": "your-turn-4",
      "title": "Your turn · An interval estimates a point",
      "objective": "Use the supplied values. No differentiation is needed.",
      "phase": "Your turn",
      "minutes": 4,
      "blocks": [
        {
          "type": "questions",
          "ids": [
            "ct05"
          ]
        },
        {
          "type": "reflection",
          "prompt": "Why should 10.01 be described as an estimate of a point-rate?"
        }
      ]
    },
    {
      "id": "your-turn-5",
      "title": "Your turn · Compare nearby rates",
      "objective": "Support both comparisons with numerical evidence.",
      "phase": "Your turn",
      "minutes": 7,
      "blocks": [
        {
          "type": "questions",
          "ids": [
            "ct02",
            "ct03"
          ]
        }
      ]
    },
    {
      "id": "endpoint-evidence",
      "title": "Key idea · A negative average is an endpoint statement",
      "objective": "Read the requested interval before judging the shape of the whole graph.",
      "phase": "Explain and connect",
      "minutes": 5,
      "blocks": [
        {
          "type": "explanation",
          "paragraphs": [
            "For a<b, the denominator b−a is positive. Therefore the sign of the average rate is exactly the sign of f(b)−f(a). A final output below the initial output gives a negative average, even if the function rises during part of the interval."
          ]
        },
        {
          "type": "key-notes",
          "items": [
            "Do not use whether the graph is above or below the x-axis to decide the rate sign.",
            "A negative average on one interval does not prove the function decreases throughout.",
            "Zero average means equal endpoint outputs; it does not mean the function is constant."
          ]
        },
        {
          "type": "worked",
          "prompt": "If f(−2)=9 and f(4)=3, interpret the average rate on [−2,4].",
          "steps": [
            "The output change is 3−9=−6. The input change is 4−(−2)=6.",
            "The average is −6/6=−1 output unit per input unit. This fixes the endpoint change, not every interior change."
          ]
        }
      ]
    },
    {
      "id": "net-change-notes",
      "title": "Key idea · Add the signed changes",
      "objective": "Recover a whole-interval average even when initial outputs are unknown.",
      "phase": "Explain and connect",
      "minutes": 5,
      "blocks": [
        {
          "type": "explanation",
          "paragraphs": [
            "Successive output changes combine by addition. Intermediate values cancel: the final total is f(b)−f(a). Add the signed changes, then divide by the total elapsed time."
          ]
        },
        {
          "type": "table",
          "headers": [
            "Interval (s)",
            "Lift A change (m)",
            "Lift B change (m)"
          ],
          "rows": [
            [
              "0–4",
              14,
              5
            ],
            [
              "4–8",
              -6,
              1
            ],
            [
              "8–12",
              8,
              2
            ],
            [
              "12–16",
              -3,
              4
            ],
            [
              "16–20",
              5,
              6
            ]
          ],
          "caption": "Illustrative changes recorded by two lift sensors"
        },
        {
          "type": "worked",
          "prompt": "Compare the two average height-change rates over 20 seconds.",
          "steps": [
            "A: 14−6+8−3+5=18 m. B: 5+1+2+4+6=18 m.",
            "Both average rates are 18/20=0.9 m/s."
          ]
        },
        {
          "type": "key-notes",
          "items": [
            "Starting heights are unnecessary when all signed changes are known.",
            "Do not add absolute changes for a net height-change rate.",
            "Divide by total time, not by the number of intervals."
          ]
        }
      ]
    },
    {
      "id": "net-change-lab",
      "title": "Activity 3A · Build a change ledger",
      "objective": "Select an ending time, predict each net change, and compare the rates.",
      "phase": "Activity 3A",
      "minutes": 6,
      "blocks": [
        {
          "type": "idea-lab",
          "key": "ledger"
        }
      ]
    },
    {
      "id": "amount-from-rate",
      "title": "Key idea · Greatest increase or greatest rate?",
      "objective": "The question decides whether to compare amounts or quotients.",
      "phase": "Explain and connect",
      "minutes": 5,
      "blocks": [
        {
          "type": "explanation",
          "paragraphs": [
            "An average rate tells you the net change per input unit. To recover the total net change, multiply the rate by the interval width: \\(\\Delta f=r(b-a)\\). “Increases the most” asks for the largest positive net change."
          ]
        },
        {
          "type": "table",
          "headers": [
            "Interval",
            "Average rate",
            "Width",
            "Net change"
          ],
          "rows": [
            [
              "[0,2]",
              7,
              2,
              14
            ],
            [
              "[2,5]",
              -4,
              3,
              -12
            ],
            [
              "[5,9]",
              3,
              4,
              12
            ],
            [
              "[9,12]",
              5,
              3,
              15
            ]
          ],
          "caption": "The greatest rate and greatest increase need not occur on the same interval"
        },
        {
          "type": "worked",
          "prompt": "Compare [0,2] with [9,12].",
          "steps": [
            "The first interval has the greater rate: 7>5.",
            "The last interval has the greater increase: 5×3=15>7×2=14."
          ]
        },
        {
          "type": "key-notes",
          "items": [
            "“Greatest rate”: compare r. “Greatest increase”: compare r×width.",
            "“Greatest decrease” asks for the largest magnitude of a negative net change.",
            "To combine interval rates, compute total signed change ÷ total width. Do not use an unweighted mean unless the widths are equal."
          ]
        },
        {
          "type": "key-notes",
          "items": [
            "To recover an output: \\(f(b)=f(a)+r(b-a)\\). For example, if f(2)=7 and r=−3 on [2,6], then f(6)=7+(−3)(4)=−5."
          ]
        }
      ]
    },
    {
      "id": "weighted-rate-lab",
      "title": "Activity 3B · Let interval width do its work",
      "objective": "Predict the net changes and the overall average, then test your reasoning.",
      "phase": "Activity 3B",
      "minutes": 5,
      "blocks": [
        {
          "type": "idea-lab",
          "key": "widths"
        }
      ]
    },
    {
      "id": "interval-comparisons",
      "title": "Worked example · Find the least average from a graph",
      "objective": "Calculate a separate quotient for each candidate interval.",
      "phase": "Explain and connect",
      "minutes": 5,
      "blocks": [
        {
          "type": "graph",
          "key": "intervals"
        },
        {
          "type": "worked",
          "prompt": "Compare the average rates on [−4,−3], [−2,−1], [0,1] and [2,4].",
          "steps": [
            "Read the endpoint outputs from the plotted coordinates. The output changes are −3, −1, −1 and +1.",
            "Divide by widths 1, 1, 1 and 2: the average rates are −3, −1, −1 and 0.5.",
            "The least signed average is −3 on [−4,−3]."
          ]
        },
        {
          "type": "key-notes",
          "items": [
            "Least means most negative when negative values are available.",
            "Use the endpoints of each stated interval; interior turns do not enter its quotient.",
            "Read graph scales and interval widths carefully."
          ]
        }
      ]
    },
    {
      "id": "quadratic-signs",
      "title": "Key idea · Read rate signs around a vertex",
      "objective": "Use familiar quadratic graphs to explain changes without calculus.",
      "phase": "Explain and connect",
      "minutes": 5,
      "blocks": [
        {
          "type": "explanation",
          "paragraphs": [
            "For \\(p(x)=x^2+4x+5=(x+2)^2+1\\), the graph opens upward and has vertex (−2,1). It decreases to the left of x=−2 and increases to the right. This controls the average-rate sign on every interval wholly on one side."
          ]
        },
        {
          "type": "graph",
          "key": "quadratic"
        },
        {
          "type": "worked",
          "prompt": "Check three intervals using the formula.",
          "steps": [
            "On [−5,−3]: p(−5)=10 and p(−3)=2, so the average is (2−10)/2=−4.",
            "On [−1,2]: p(−1)=2 and p(2)=17, so the average is (17−2)/3=5.",
            "On [−4,0]: both outputs are 5, so the average is 0."
          ]
        },
        {
          "type": "key-notes",
          "items": [
            "Positive function values do not imply positive rates.",
            "An interval that crosses the vertex can have negative, zero or positive average rate; compare its endpoint values.",
            "At a smooth turning point the local rate is zero, but an interval spanning it need not have zero average."
          ]
        }
      ]
    },
    {
      "id": "shape-language",
      "title": "Key idea · Direction and concavity are different questions",
      "objective": "Connect the graphical concavity language from Topic 1.1 to rate comparisons in Topic 1.2.",
      "phase": "Explain and connect",
      "minutes": 5,
      "blocks": [
        {
          "type": "explanation",
          "paragraphs": [
            "First ask whether the outputs rise or fall as the input increases. Then ask whether the signed rates get larger or smaller. Concavity describes this second comparison."
          ]
        },
        {
          "type": "table",
          "headers": [
            "Function behavior",
            "Signed local rate",
            "Nearby signed rates",
            "Concavity"
          ],
          "rows": [
            [
              "Increasing faster",
              "Positive",
              "Increasing",
              "Up"
            ],
            [
              "Increasing more slowly",
              "Positive",
              "Decreasing",
              "Down"
            ],
            [
              "Decreasing more slowly",
              "Negative",
              "Increasing (less negative)",
              "Up"
            ],
            [
              "Decreasing faster",
              "Negative",
              "Decreasing (more negative)",
              "Down"
            ]
          ],
          "caption": "Four combinations: direction does not determine concavity"
        },
        {
          "type": "key-notes",
          "items": [
            "For example, −6, −4, −2 are increasing signed rates even though the function is decreasing.",
            "Concave up does not mean positive output or increasing function.",
            "At a smooth inflection point, concavity changes; the rate need not be zero. Compare the signed rates on each side."
          ]
        },
        {
          "type": "worked",
          "prompt": "Nearby signed rates are about −1, −3 and −5 as x increases. Describe the function.",
          "steps": [
            "The negative signs indicate falling outputs.",
            "The rates become more negative: the function decreases faster and the graph is concave down."
          ]
        }
      ]
    },
    {
      "id": "shape-lab",
      "title": "Activity 6A · Match direction and concavity",
      "objective": "Switch curves and compare nearby rates before classifying the shape.",
      "phase": "Activity 6A",
      "minutes": 7,
      "blocks": [
        {
          "type": "idea-lab",
          "key": "shape"
        }
      ]
    },
    {
      "id": "least-local-rate",
      "title": "Key idea · Least rate is not the lowest point",
      "objective": "Compare how quickly the graph falls near each labeled point.",
      "phase": "Explain and connect",
      "minutes": 5,
      "blocks": [
        {
          "type": "graph",
          "key": "bend"
        },
        {
          "type": "explanation",
          "paragraphs": [
            "The curve is smooth. P is a horizontal local maximum; R is where the graph changes from concave down to concave up. Near R, the graph is falling most steeply. Its signed rate is therefore least among the labeled points, even though S has a lower output."
          ]
        },
        {
          "type": "worked",
          "prompt": "Compare P, Q, R and S from the local shape.",
          "steps": [
            "P has a horizontal local rate of 0. Q and R have negative rates, with R more negative. S has positive rate.",
            "The least signed rate is at R. The greatest magnitude is a separate comparison that considers steepness in either direction."
          ]
        },
        {
          "type": "key-notes",
          "items": [
            "Compare signed rates on a number line: −5<−2<0<3.",
            "Do not rank rates by graph height.",
            "An inflection point is not automatically where a rate is least; the surrounding change in concavity matters."
          ]
        }
      ]
    },
    {
      "id": "varying-decrease",
      "title": "Key idea · Always decreasing, changing at different rates",
      "objective": "Explain direction and speed of change separately in a context.",
      "phase": "Explain and connect",
      "minutes": 5,
      "blocks": [
        {
          "type": "graph",
          "key": "drainage"
        },
        {
          "type": "explanation",
          "paragraphs": [
            "The modeled water amount falls throughout the displayed time interval. Some parts are steep and other parts flatter. The quantity always decreases, but its rate of decrease varies. The model is illustrative, not measured school data."
          ]
        },
        {
          "type": "worked",
          "prompt": "Compare the rate near t=2 using [1.9,2.1] with the rate near t=6 using [5.9,6.1].",
          "steps": [
            "The nearby averages are about −14.49 L/min and −6.25 L/min. Both are negative.",
            "The decrease is faster near t=2 because its rate has greater magnitude. Near t=6 the signed rate is greater because it is less negative."
          ]
        },
        {
          "type": "key-notes",
          "items": [
            "A change in concavity does not require a change from decreasing to increasing.",
            "A flat-looking portion can still have a small negative rate.",
            "Describe amount, direction, and rate of change in separate statements."
          ]
        }
      ]
    },
    {
      "id": "greatest-local-rate",
      "title": "Key idea · Greatest rate is not the highest value",
      "objective": "Identify where a contextual graph rises most strongly among the given points.",
      "phase": "Explain and connect",
      "minutes": 5,
      "blocks": [
        {
          "type": "graph",
          "key": "cycle"
        },
        {
          "type": "explanation",
          "paragraphs": [
            "This illustrative greenhouse-temperature graph is read as a graph; no trigonometric formula is required. Compare P at week 1, Q at week 3, R at week 6 and S at week 9."
          ]
        },
        {
          "type": "worked",
          "prompt": "Which labeled point has the greatest signed rate?",
          "steps": [
            "P is rising, so its rate is positive. Q and S are smooth turning points with zero rate. R is falling, so its rate is negative.",
            "P has the greatest signed rate among these four points. Q has the greatest temperature, which is a different question."
          ]
        },
        {
          "type": "key-notes",
          "items": [
            "“At week 1” asks about a point; use nearby behavior. “From week 1 to week 3” asks for an interval average.",
            "Greatest signed rate favors the strongest upward change. Greatest magnitude can occur during a steep decrease.",
            "Compare rates at the given points, not necessarily the steepest point anywhere on the curve."
          ]
        }
      ]
    },
    {
      "id": "sum-rates-notes",
      "title": "Key idea · Rates of a sum on the same interval",
      "objective": "Use changes to decide what must be true, rather than guessing a new graph.",
      "phase": "Explain and connect",
      "minutes": 5,
      "blocks": [
        {
          "type": "explanation",
          "paragraphs": [
            "If h(x)=f(x)+g(x), then h(b)−h(a)=[f(b)−f(a)]+[g(b)−g(a)]. Dividing by the same nonzero input change gives \\(r_h=r_f+r_g\\) on that interval."
          ]
        },
        {
          "type": "table",
          "headers": [
            "Rate of f",
            "Rate of g",
            "Conclusion for sum on the same interval"
          ],
          "rows": [
            [
              "Negative",
              "Negative",
              "Negative"
            ],
            [
              "Positive",
              "Positive",
              "Positive"
            ],
            [
              "Negative",
              "Positive",
              "Depends on relative size: negative, zero or positive"
            ]
          ],
          "caption": "Combine rates only when they refer to the same input interval"
        },
        {
          "type": "worked",
          "prompt": "Suppose f has rate −2 and g has rate 1, 2 or 4 on a shared interval.",
          "steps": [
            "The corresponding rates of h are −1, 0 and 2.",
            "Opposite signs alone are insufficient. Exact cancellation is possible."
          ]
        },
        {
          "type": "key-notes",
          "items": [
            "Negative average on every subinterval means strictly decreasing: for any a<b, the output change is negative.",
            "Negative average on one whole interval is much weaker.",
            "If relative changes vary, the sum can change direction. On a whole region it may increase, decrease, remain constant, or have mixed behavior."
          ]
        }
      ]
    },
    {
      "id": "sum-rates-lab",
      "title": "Activity 7A · Can two trends determine their sum?",
      "objective": "Keep one function decreasing and change the increasing contribution.",
      "phase": "Activity 7A",
      "minutes": 7,
      "blocks": [
        {
          "type": "idea-lab",
          "key": "sum"
        }
      ]
    },
    {
      "id": "key-notes-checklist",
      "title": "Key notes · Choose the right comparison",
      "objective": "Use this checklist before every graph, table or context question.",
      "phase": "Key notes",
      "minutes": 3,
      "blocks": [
        {
          "type": "table",
          "headers": [
            "Question wording",
            "What to compare"
          ],
          "rows": [
            [
              "Function value at a point",
              "Graph height / output"
            ],
            [
              "Net change over [a,b]",
              "f(b)−f(a)"
            ],
            [
              "Average rate over [a,b]",
              "[f(b)−f(a)]/(b−a)"
            ],
            [
              "Greatest increase",
              "Largest positive rate × width"
            ],
            [
              "Rate at a point",
              "Nearby graph behavior or small-interval estimate"
            ],
            [
              "Least signed rate",
              "Smallest signed value; most negative when negative values occur"
            ],
            [
              "Fastest decrease",
              "Greatest magnitude among negative rates"
            ],
            [
              "Concavity",
              "Whether signed nearby rates increase or decrease"
            ],
            [
              "Rate of f+g",
              "Sum of their rates on the same interval"
            ]
          ],
          "caption": "A compact reference for all supplied question ideas"
        },
        {
          "type": "key-notes",
          "items": [
            "State the interval, direction and units in a contextual interpretation.",
            "Keep full precision until the final calculator result.",
            "Use only what the evidence establishes; distinguish “could be true” from “must be true.”"
          ]
        }
      ]
    },
    {
      "id": "ideas-your-turn-1",
      "title": "Your turn · Read the graph evidence",
      "objective": "Work independently. Show the comparison that justifies your choice.",
      "phase": "Your turn",
      "minutes": 6,
      "blocks": [
        {
          "type": "questions",
          "ids": [
            "idea03",
            "idea06"
          ]
        }
      ]
    },
    {
      "id": "ideas-your-turn-2",
      "title": "Your turn · Compare changes and rates",
      "objective": "Work independently. Show the comparison that justifies your choice.",
      "phase": "Your turn",
      "minutes": 6,
      "blocks": [
        {
          "type": "questions",
          "ids": [
            "idea04",
            "idea05"
          ]
        }
      ]
    },
    {
      "id": "ideas-your-turn-3",
      "title": "Your turn · Use formulas and interval widths",
      "objective": "Work independently. Show the comparison that justifies your choice.",
      "phase": "Your turn",
      "minutes": 6,
      "blocks": [
        {
          "type": "questions",
          "ids": [
            "idea07",
            "idea12"
          ]
        }
      ]
    },
    {
      "id": "ideas-your-turn-4",
      "title": "Your turn · Describe local shape",
      "objective": "Work independently. Show the comparison that justifies your choice.",
      "phase": "Your turn",
      "minutes": 6,
      "blocks": [
        {
          "type": "questions",
          "ids": [
            "idea01",
            "idea02"
          ]
        }
      ]
    },
    {
      "id": "ideas-your-turn-5",
      "title": "Your turn · Explain a changing quantity",
      "objective": "Work independently. Show the comparison that justifies your choice.",
      "phase": "Your turn",
      "minutes": 6,
      "blocks": [
        {
          "type": "questions",
          "ids": [
            "idea08",
            "idea09"
          ]
        }
      ]
    },
    {
      "id": "ideas-your-turn-6",
      "title": "Your turn · What must be true?",
      "objective": "Work independently. Show the comparison that justifies your choice.",
      "phase": "Your turn",
      "minutes": 6,
      "blocks": [
        {
          "type": "questions",
          "ids": [
            "idea10",
            "idea11"
          ]
        }
      ]
    }
  ],
  "updates": {
    "tank-lab": {
      "title": "Activity 1 · From an amount to a rate",
      "phase": "Activity 1",
      "minutes": 8,
      "mission": [
        "Predict whether the rate is positive or negative from minute 5 to minute 8.",
        "Set a=5 and b=8. Calculate the volume change and average rate, then check your reasoning.",
        "Compare [0,2] with [2,5]. Explain why similar volume changes can give different rates."
      ],
      "reflection": "From minute 5 to minute 8, the volume changed by ___ L, an average of ___ L/min. This tells us ___."
    },
    "quotient": {
      "title": "Make it precise · Change divided by change",
      "phase": "Consolidate",
      "minutes": 3
    },
    "secant-lab": {
      "title": "Activity 2 · Move the endpoints",
      "phase": "Activity 2",
      "minutes": 8,
      "mission": [
        "Start with q(x)=x²−3x+2, a=1 and b=4. Predict the sign of the average rate.",
        "Use the coordinates and the dashed comparison line to find output change ÷ input change.",
        "Try a=−1 and b=0. What changes? Can the outputs be positive while the rate is negative?"
      ],
      "reflection": "The dashed line shows ___. The curve between the endpoints may ___."
    },
    "graph-rate": {
      "title": "Worked example · Read the endpoint coordinates",
      "phase": "Worked example",
      "minutes": 3
    },
    "unequal-lab": {
      "title": "Extra investigation · Compare unequal intervals",
      "phase": "More practice",
      "minutes": 5,
      "mission": [
        "Compare the two output changes. Make an initial prediction.",
        "Calculate each average rate using its own input change.",
        "Select cooling. Which signed rate is greater? Which cooling rate has the greater magnitude?"
      ]
    },
    "zero-lab": {
      "title": "Activity 3 · What do endpoints tell us?",
      "phase": "Activity 3",
      "minutes": 7,
      "mission": [
        "Predict the average rate for the rise-then-fall graph.",
        "Switch between all three graphs. Compare their endpoint values and their interior values.",
        "Write a statement that is true for all three graphs and one that is not."
      ]
    },
    "day-one-exit": {
      "title": "Checkpoint · Explain an average rate",
      "phase": "Session 1 checkpoint",
      "minutes": 3
    },
    "local-idea": {
      "title": "Session 2 · How quickly is it changing near this point?",
      "phase": "Retrieve and connect",
      "minutes": 3
    },
    "local-worked": {
      "title": "Worked example · Use nearby values",
      "phase": "Worked example",
      "minutes": 4
    },
    "local-lab": {
      "title": "Activity 6 · Estimate a rate near a point",
      "phase": "Activity 6",
      "minutes": 9,
      "mission": [
        "Set c=2 and h=0.5. Calculate the left, right and centered averages.",
        "Reduce h to 0.1 and then 0.01. How do the three estimates compare?",
        "Explain why the centered interval has width 2h and why these calculations support a rate near 4."
      ],
      "reflection": "As the intervals get smaller, the nearby averages ___. This supports an estimated rate of ___ at x=2."
    },
    "compare-lab": {
      "title": "Activity 7 · Compare two nearby rates",
      "phase": "Activity 7",
      "minutes": 7,
      "mission": [
        "Use the same half-width near A and B. Predict which local-rate estimate is greater.",
        "Check using the centered quotients. Then reduce h and compare again.",
        "Choose the falling model. Distinguish “greater signed rate” from “faster decrease.”"
      ]
    },
    "calculator-lab": {
      "title": "Activity 9 · Calculate and interpret",
      "phase": "Activity 9",
      "minutes": 6,
      "mission": [
        "Use the interval [1.2,4.7] and keep the full calculator values.",
        "Switch to the small interval near t=2. Decide whether the question asks for an interval average or a point estimate.",
        "Report to three decimal places with units and explain the negative sign."
      ]
    },
    "frq01": {
      "title": "Student workshop · Put the reasoning together",
      "phase": "Independent FRQ",
      "minutes": 9
    },
    "exit": {
      "title": "Exit ticket · State what the evidence supports",
      "phase": "Exit ticket",
      "minutes": 3
    },
    "finish": {
      "title": "Review your evidence and choose your next practice",
      "phase": "Review",
      "minutes": 2
    },
    "roadmap": {
      "title": "Review your work and choose more practice",
      "phase": "Review",
      "minutes": 2
    },
    "corner-lab": {
      "title": "Optional extension · When a centered estimate misleads",
      "phase": "Optional extension",
      "minutes": 0
    },
    "challenge-mcq-1": {
      "phase": "Optional extension"
    },
    "challenge-mcq-3": {
      "phase": "Optional extension"
    },
    "challenge-mcq-5": {
      "phase": "Optional extension"
    },
    "challenge01": {
      "phase": "Optional extension"
    },
    "challenge02": {
      "phase": "Optional extension"
    },
    "net-change-notes": {
      "title": "Activity 4 · Add the signed changes",
      "phase": "Activity 4",
      "minutes": 8
    },
    "amount-from-rate": {
      "title": "Activity 5 · Greatest rate or greatest increase?",
      "phase": "Activity 5",
      "minutes": 8
    },
    "shape-language": {
      "title": "Activity 8 · Direction and concavity",
      "phase": "Activity 8",
      "minutes": 8
    },
    "sum-rates-notes": {
      "title": "Activity 10 · Combine rates on the same interval",
      "phase": "Activity 10",
      "minutes": 8
    }
  },
  "order": [
    "warm-up",
    "tank-lab",
    "secant-lab",
    "your-turn-1",
    "zero-lab",
    "interval-comparisons",
    "ideas-your-turn-1",
    "your-turn-3",
    "net-change-notes",
    "amount-from-rate",
    "ideas-your-turn-2",
    "your-turn-2",
    "quadratic-signs",
    "ideas-your-turn-3",
    "local-lab",
    "your-turn-4",
    "compare-lab",
    "your-turn-5",
    "shape-language",
    "least-local-rate",
    "ideas-your-turn-4",
    "varying-decrease",
    "greatest-local-rate",
    "ideas-your-turn-5",
    "calculator-lab",
    "sum-rates-notes",
    "ideas-your-turn-6",
    "frq01",
    "exit",
    "roadmap"
  ],
  "session1": [
    "warm-up",
    "tank-lab",
    "secant-lab",
    "your-turn-1",
    "zero-lab",
    "interval-comparisons",
    "ideas-your-turn-1",
    "your-turn-3"
  ],
  "session2": [
    "net-change-notes",
    "amount-from-rate",
    "ideas-your-turn-2",
    "your-turn-2",
    "quadratic-signs",
    "ideas-your-turn-3"
  ],
  "navigation": [
    [
      "warm-up",
      "Warm-up"
    ],
    [
      "tank-lab",
      "Rates and graphs"
    ],
    [
      "net-change-notes",
      "Changes and intervals"
    ],
    [
      "local-lab",
      "Nearby rates and shape"
    ],
    [
      "sum-rates-notes",
      "Combine and apply"
    ],
    [
      "roadmap",
      "Review and practice"
    ]
  ],
  "chapters": [
    {
      "start": "warm-up",
      "label": "Warm-up"
    },
    {
      "start": "tank-lab",
      "label": "Rates and graphs"
    },
    {
      "start": "net-change-notes",
      "label": "Changes and intervals"
    },
    {
      "start": "local-lab",
      "label": "Nearby rates and shape"
    },
    {
      "start": "sum-rates-notes",
      "label": "Combine and apply"
    },
    {
      "start": "roadmap",
      "label": "Review and practice"
    }
  ],
  "session3": [
    "local-lab",
    "your-turn-4",
    "compare-lab",
    "your-turn-5",
    "shape-language",
    "least-local-rate",
    "ideas-your-turn-4",
    "varying-decrease",
    "greatest-local-rate",
    "ideas-your-turn-5",
    "calculator-lab"
  ],
  "session4": [
    "sum-rates-notes",
    "ideas-your-turn-6",
    "frq01",
    "exit",
    "roadmap"
  ],
  "coverage": [
    {
      "idea": "Least signed local rate and inflection evidence",
      "main": [
        1
      ],
      "other": [],
      "explanation": "least-local-rate",
      "practice": [
        "idea01"
      ]
    },
    {
      "idea": "Rate sign and concavity at a point",
      "main": [
        2
      ],
      "other": [],
      "explanation": "shape-language",
      "activity": "shape-language",
      "practice": [
        "idea02"
      ]
    },
    {
      "idea": "Choose graph from average-rate sign",
      "main": [
        3
      ],
      "other": [],
      "explanation": "zero-lab",
      "practice": [
        "idea03"
      ]
    },
    {
      "idea": "Aggregate successive signed changes",
      "main": [
        4
      ],
      "other": [
        6
      ],
      "explanation": "net-change-notes",
      "activity": "net-change-notes",
      "practice": [
        "idea04"
      ]
    },
    {
      "idea": "Greatest increase from rate and interval width",
      "main": [
        5
      ],
      "other": [
        1
      ],
      "explanation": "amount-from-rate",
      "activity": "amount-from-rate",
      "practice": [
        "idea05",
        "idea12"
      ]
    },
    {
      "idea": "Least interval average from a graph",
      "main": [
        6
      ],
      "other": [
        2
      ],
      "explanation": "interval-comparisons",
      "practice": [
        "idea06"
      ]
    },
    {
      "idea": "Quadratic rate signs from vertex",
      "main": [
        7
      ],
      "other": [
        3
      ],
      "explanation": "quadratic-signs",
      "practice": [
        "idea07"
      ]
    },
    {
      "idea": "Always decreasing with varying rate",
      "main": [
        8
      ],
      "other": [],
      "explanation": "varying-decrease",
      "practice": [
        "idea08"
      ]
    },
    {
      "idea": "Greatest local rate in a context graph",
      "main": [
        9
      ],
      "other": [
        4
      ],
      "explanation": "greatest-local-rate",
      "practice": [
        "idea09"
      ]
    },
    {
      "idea": "Rates of sums and every-subinterval reasoning",
      "main": [
        10
      ],
      "other": [
        5
      ],
      "explanation": "sum-rates-notes",
      "activity": "sum-rates-notes",
      "practice": [
        "idea10",
        "idea11"
      ]
    }
  ],
  "merges": [
    {
      "from": "quotient",
      "to": "tank-lab",
      "mode": "replace"
    },
    {
      "from": "graph-rate",
      "to": "secant-lab",
      "mode": "replace"
    },
    {
      "from": "endpoint-evidence",
      "to": "zero-lab",
      "mode": "notes"
    },
    {
      "from": "net-change-lab",
      "to": "net-change-notes",
      "mode": "activity"
    },
    {
      "from": "weighted-rate-lab",
      "to": "amount-from-rate",
      "mode": "activity"
    },
    {
      "from": "day-one-exit",
      "to": "your-turn-3",
      "mode": "checkpoint"
    },
    {
      "from": "local-idea",
      "to": "local-lab",
      "mode": "replace"
    },
    {
      "from": "local-worked",
      "to": "local-lab",
      "mode": "replace"
    },
    {
      "from": "shape-lab",
      "to": "shape-language",
      "mode": "activity"
    },
    {
      "from": "sum-rates-lab",
      "to": "sum-rates-notes",
      "mode": "activity"
    },
    {
      "from": "finish",
      "to": "roadmap",
      "mode": "review"
    },
    {
      "from": "start",
      "to": "warm-up",
      "mode": "replace"
    },
    {
      "from": "interpret-sign",
      "to": "zero-lab",
      "mode": "replace"
    },
    {
      "from": "formula-example",
      "to": "secant-lab",
      "mode": "replace"
    },
    {
      "from": "reconstruct",
      "to": "amount-from-rate",
      "mode": "replace"
    }
  ],
  "moveQuestions": [
    {
      "from": "quotient",
      "to": "amount-rate"
    },
    {
      "from": "local-worked",
      "to": "signed-magnitude"
    }
  ],
  "teachingNotes": {
    "tank-lab": [
      {
        "type": "explanation",
        "paragraphs": [
          "A function value tells you an amount. Net change compares two amounts. Average rate tells you the net change for each unit of input."
        ]
      },
      {
        "type": "key-notes",
        "items": [
          "On an interval with distinct endpoints: \\(r=\\frac{f(b)-f(a)}{b-a}\\). Subtract final minus initial in both places.",
          "Units are output units per input unit. A rate of 30 L/min would give the same net change as adding 30 L each minute; the actual rate may vary."
        ]
      },
      {
        "type": "worked",
        "prompt": "A tank holds 820 L at minute 2 and 910 L at minute 5. Find and interpret the average rate.",
        "steps": [
          "Net change: 910−820=90 L. Time change: 5−2=3 min.",
          "Average rate: 90/3=30 L/min. From minute 2 to minute 5, volume increased by an average of 30 liters per minute."
        ]
      }
    ],
    "secant-lab": [
      {
        "type": "explanation",
        "paragraphs": [
          "A secant line joins two points on a graph. Its slope is the average rate on their input interval."
        ]
      },
      {
        "type": "key-notes",
        "items": [
          "Read the axis scales and both endpoint coordinates. Use endpoint change even if the curve turns between them.",
          "From a formula, evaluate each entire output first. The average of the two outputs is not a rate."
        ]
      },
      {
        "type": "worked",
        "prompt": "For \\(q(x)=x^2-3x+2\\), compare the points with inputs 1 and 4.",
        "steps": [
          "\\(q(1)=0\\) and \\(q(4)=6\\).",
          "The secant slope is \\(\\frac{6-0}{4-1}=2\\) output units per input unit.",
          "Now move the endpoints in the activity and explain how the quotient changes."
        ]
      }
    ],
    "local-lab": [
      {
        "type": "explanation",
        "paragraphs": [
          "An interval average is exact for the chosen endpoints. Using a small interval to describe a point gives an estimate of the rate there, when that rate exists."
        ]
      },
      {
        "type": "key-notes",
        "items": [
          "Left [c−h,c] and right [c,c+h] have width h. Centered [c−h,c+h] has width 2h; keep h positive.",
          "Use accurate values, compare both sides, and try smaller widths. Agreement supports a point-rate estimate."
        ]
      },
      {
        "type": "worked",
        "prompt": "Given f(1.9)=3.61, f(2)=4 and f(2.1)=4.41, estimate the rate near x=2.",
        "steps": [
          "Left: (4−3.61)/0.1=3.9. Right: (4.41−4)/0.1=4.1.",
          "Centered: (4.41−3.61)/0.2=4. These nearby averages support a rate of approximately 4 at x=2."
        ]
      }
    ],
    "compare-lab": [
      {
        "type": "explanation",
        "paragraphs": [
          "Compare how quickly the outputs change near each point. A larger function value does not establish a larger rate."
        ]
      },
      {
        "type": "key-notes",
        "items": [
          "Choose small intervals close to each point and compare more than one width. Use the actual width in each quotient.",
          "For signed rates, −2 is greater than −5. For the speed of a decrease, −5 has the greater magnitude."
        ]
      },
      {
        "type": "worked",
        "prompt": "Two nearby estimates are −8 and −3 liters per minute.",
        "steps": [
          "Both quantities are decreasing. The greater signed rate is −3 L/min.",
          "The faster decrease is 8 L/min in magnitude, corresponding to the signed rate −8 L/min."
        ]
      }
    ],
    "calculator-lab": [
      {
        "type": "explanation",
        "paragraphs": [
          "Use the calculator to evaluate endpoint values accurately, then use the same average-rate definition."
        ]
      },
      {
        "type": "key-notes",
        "items": [
          "Enter (final output − initial output) ÷ (final input − initial input), with parentheses around each difference.",
          "Keep full stored values until the final answer. Round as requested and include output units per input unit.",
          "A quotient over a small interval is an estimate when the question asks about a point. State approximately and interpret the sign."
        ]
      }
    ]
  },
  "stagedActivities": [
    "tank-lab",
    "secant-lab",
    "zero-lab",
    "net-change-notes",
    "amount-from-rate",
    "local-lab",
    "compare-lab",
    "shape-language",
    "calculator-lab",
    "sum-rates-notes"
  ],
  "questionNotes": {
    "ct00": [
      "Compare change per minute: divide each volume change by its own elapsed time.",
      "Prepare a sentence naming the quantity and its units."
    ],
    "q01": [
      "Read the quantity requested: net change means final output minus initial output.",
      "A change uses output units. A rate uses output units per input unit."
    ],
    "q02": [
      "Use \\(r=\\frac{f(b)-f(a)}{b-a}\\). Match the endpoint order in numerator and denominator.",
      "State the interval, direction and output units per input unit."
    ],
    "q03": [
      "Use \\(r=\\frac{f(b)-f(a)}{b-a}\\). Match the endpoint order in numerator and denominator.",
      "State the interval, direction and output units per input unit."
    ],
    "q04": [
      "Use \\(r=\\frac{f(b)-f(a)}{b-a}\\). Match the endpoint order in numerator and denominator.",
      "State the interval, direction and output units per input unit."
    ],
    "ap01": [
      "Use \\(r=\\frac{f(b)-f(a)}{b-a}\\). Match the endpoint order in numerator and denominator.",
      "State the interval, direction and output units per input unit."
    ],
    "ap02": [
      "Use \\(r=\\frac{f(b)-f(a)}{b-a}\\). Match the endpoint order in numerator and denominator.",
      "State the interval, direction and output units per input unit."
    ],
    "ap06": [
      "Use \\(r=\\frac{f(b)-f(a)}{b-a}\\). Match the endpoint order in numerator and denominator.",
      "State the interval, direction and output units per input unit."
    ],
    "ap07": [
      "Use \\(r=\\frac{f(b)-f(a)}{b-a}\\). Match the endpoint order in numerator and denominator.",
      "State the interval, direction and output units per input unit."
    ],
    "ct07": [
      "Use \\(r=\\frac{f(b)-f(a)}{b-a}\\). Match the endpoint order in numerator and denominator.",
      "State the interval, direction and output units per input unit."
    ],
    "q05": [
      "For a<b, the denominator is positive, so compare f(b) with f(a).",
      "An interval average fixes the endpoint change. It does not determine every interior movement."
    ],
    "ap05": [
      "For a<b, the denominator is positive, so compare f(b) with f(a).",
      "An interval average fixes the endpoint change. It does not determine every interior movement."
    ],
    "ap15": [
      "For a<b, the denominator is positive, so compare f(b) with f(a).",
      "An interval average fixes the endpoint change. It does not determine every interior movement."
    ],
    "ap19": [
      "For a<b, the denominator is positive, so compare f(b) with f(a).",
      "An interval average fixes the endpoint change. It does not determine every interior movement."
    ],
    "ap20": [
      "For a<b, the denominator is positive, so compare f(b) with f(a).",
      "An interval average fixes the endpoint change. It does not determine every interior movement."
    ],
    "ap21": [
      "For a<b, the denominator is positive, so compare f(b) with f(a).",
      "An interval average fixes the endpoint change. It does not determine every interior movement."
    ],
    "ct04": [
      "For a<b, the denominator is positive, so compare f(b) with f(a).",
      "An interval average fixes the endpoint change. It does not determine every interior movement."
    ],
    "idea03": [
      "For a<b, the denominator is positive, so compare f(b) with f(a).",
      "An interval average fixes the endpoint change. It does not determine every interior movement."
    ],
    "ct01": [
      "First find net change: \\(\\Delta f=r(b-a)\\). Add it to the starting output if a final output is requested.",
      "Compare rates using their own widths; compare increases using signed changes."
    ],
    "ct08": [
      "First find net change: \\(\\Delta f=r(b-a)\\). Add it to the starting output if a final output is requested.",
      "Compare rates using their own widths; compare increases using signed changes."
    ],
    "ap08": [
      "First find net change: \\(\\Delta f=r(b-a)\\). Add it to the starting output if a final output is requested.",
      "Compare rates using their own widths; compare increases using signed changes."
    ],
    "ap10": [
      "First find net change: \\(\\Delta f=r(b-a)\\). Add it to the starting output if a final output is requested.",
      "Compare rates using their own widths; compare increases using signed changes."
    ],
    "ap16": [
      "First find net change: \\(\\Delta f=r(b-a)\\). Add it to the starting output if a final output is requested.",
      "Compare rates using their own widths; compare increases using signed changes."
    ],
    "ch01": [
      "First find net change: \\(\\Delta f=r(b-a)\\). Add it to the starting output if a final output is requested.",
      "Compare rates using their own widths; compare increases using signed changes."
    ],
    "q06": [
      "Use values close to the point. A centered interval [c−h,c+h] has width 2h.",
      "Compare quotients, not output heights. Use approximately when describing a point-rate estimate."
    ],
    "ct02": [
      "Use values close to the point. A centered interval [c−h,c+h] has width 2h.",
      "Compare quotients, not output heights. Use approximately when describing a point-rate estimate."
    ],
    "ct05": [
      "Use values close to the point. A centered interval [c−h,c+h] has width 2h.",
      "Compare quotients, not output heights. Use approximately when describing a point-rate estimate."
    ],
    "ap09": [
      "Use values close to the point. A centered interval [c−h,c+h] has width 2h.",
      "Compare quotients, not output heights. Use approximately when describing a point-rate estimate."
    ],
    "ap12": [
      "Use values close to the point. A centered interval [c−h,c+h] has width 2h.",
      "Compare quotients, not output heights. Use approximately when describing a point-rate estimate."
    ],
    "ap13": [
      "Use values close to the point. A centered interval [c−h,c+h] has width 2h.",
      "Compare quotients, not output heights. Use approximately when describing a point-rate estimate."
    ],
    "ap14": [
      "Use values close to the point. A centered interval [c−h,c+h] has width 2h.",
      "Compare quotients, not output heights. Use approximately when describing a point-rate estimate."
    ],
    "q07": [
      "Order signed rates on a number line: a less negative number is greater.",
      "For a faster decrease, compare magnitudes of the negative rates. Graph height answers a different question."
    ],
    "ct03": [
      "Order signed rates on a number line: a less negative number is greater.",
      "For a faster decrease, compare magnitudes of the negative rates. Graph height answers a different question."
    ],
    "idea01": [
      "Order signed rates on a number line: a less negative number is greater.",
      "For a faster decrease, compare magnitudes of the negative rates. Graph height answers a different question."
    ],
    "idea08": [
      "Order signed rates on a number line: a less negative number is greater.",
      "For a faster decrease, compare magnitudes of the negative rates. Graph height answers a different question."
    ],
    "idea09": [
      "Order signed rates on a number line: a less negative number is greater.",
      "For a faster decrease, compare magnitudes of the negative rates. Graph height answers a different question."
    ],
    "ap11": [
      "Order signed rates on a number line: a less negative number is greater.",
      "For a faster decrease, compare magnitudes of the negative rates. Graph height answers a different question."
    ],
    "q08": [
      "Compute from the values the question supplies. Rounded outputs may conceal a small change.",
      "Keep full calculator precision until the final rounding; distinguish an interval average from a point estimate."
    ],
    "ap22": [
      "Compute from the values the question supplies. Rounded outputs may conceal a small change.",
      "Keep full calculator precision until the final rounding; distinguish an interval average from a point estimate."
    ],
    "ap23": [
      "Compute from the values the question supplies. Rounded outputs may conceal a small change.",
      "Keep full calculator precision until the final rounding; distinguish an interval average from a point estimate."
    ],
    "ap24": [
      "Compute from the values the question supplies. Rounded outputs may conceal a small change.",
      "Keep full calculator precision until the final rounding; distinguish an interval average from a point estimate."
    ],
    "ct06": [
      "Read each pair of endpoint coordinates and the axis scales.",
      "For each stated interval, divide signed output change by its own width. Least means the smallest signed value."
    ],
    "idea06": [
      "Read each pair of endpoint coordinates and the axis scales.",
      "For each stated interval, divide signed output change by its own width. Least means the smallest signed value."
    ],
    "ap03": [
      "Read each pair of endpoint coordinates and the axis scales.",
      "For each stated interval, divide signed output change by its own width. Least means the smallest signed value."
    ],
    "ap04": [
      "Evaluate the complete formula at each endpoint before subtracting.",
      "Divide the output difference by the input difference. Averaging the outputs is a different calculation."
    ],
    "ap18": [
      "Read each pair of endpoint coordinates and the axis scales.",
      "For each stated interval, divide signed output change by its own width. Least means the smallest signed value."
    ],
    "idea04": [
      "Add the signed changes to obtain net change; upward and downward changes can cancel.",
      "Divide by total elapsed time. Initial amounts are unnecessary when all changes are given."
    ],
    "idea05": [
      "Greatest rate compares r. Greatest increase compares r × interval width.",
      "For a combined average, add signed changes and divide by total width."
    ],
    "idea12": [
      "Greatest rate compares r. Greatest increase compares r × interval width.",
      "For a combined average, add signed changes and divide by total width."
    ],
    "ap17": [
      "Greatest rate compares r. Greatest increase compares r × interval width.",
      "For a combined average, add signed changes and divide by total width."
    ],
    "ch06": [
      "Greatest rate compares r. Greatest increase compares r × interval width.",
      "For a combined average, add signed changes and divide by total width."
    ],
    "idea07": [
      "Locate the vertex and decide whether the interval stays on one side.",
      "If an interval crosses the vertex, compare its endpoint outputs; crossing alone does not determine the rate sign."
    ],
    "idea02": [
      "First describe rising or falling outputs; then compare nearby signed rates.",
      "Increasing signed rates mean concave up; decreasing signed rates mean concave down. A negative rate can increase."
    ],
    "idea10": [
      "Add rates only when they refer to the same input interval. Opposite signs require a comparison of sizes.",
      "An average-rate sign on every subinterval supports a monotonicity claim. One whole-interval average is weaker."
    ],
    "idea11": [
      "Add rates only when they refer to the same input interval. Opposite signs require a comparison of sizes.",
      "An average-rate sign on every subinterval supports a monotonicity claim. One whole-interval average is weaker."
    ],
    "ch02": [
      "Write the average-rate quotient before simplifying. Substitute each complete endpoint expression.",
      "Keep the inputs distinct and cancel factors only when the stated domain permits it."
    ],
    "ch03": [
      "Write the average-rate quotient before simplifying. Substitute each complete endpoint expression.",
      "Keep the inputs distinct and cancel factors only when the stated domain permits it."
    ],
    "ch04": [
      "Compare left, right and centered nearby averages.",
      "A centered value alone need not establish a rate at a corner; inspect whether the two sides support a common value."
    ],
    "ch05": [
      "An interval average uses its endpoint outputs, including which points belong to the graph.",
      "Interior discontinuities require separate local evidence; endpoint change alone does not locate them."
    ]
  },
  "writtenNotes": [
    "Show the endpoint quotient \\(\\frac{f(b)-f(a)}{b-a}\\), or an equivalent calculation, when a rate is requested.",
    "Support comparisons with values or graph evidence. For a point rate, explain why the interval is nearby.",
    "Use units and the requested precision; state only what the evidence supports."
  ],
  "presentation": {
    "classroomSlides": 30,
    "totalSlides": 67,
    "optionalSlides": 37,
    "questionDisplay": "one-at-a-time",
    "bodyText": "24–28 px on classroom screens"
  }
};
if(typeof module!=="undefined"&&module.exports)module.exports=plan;else root.RatesClassroomPlan=plan;})(typeof window!=="undefined"?window:globalThis);
