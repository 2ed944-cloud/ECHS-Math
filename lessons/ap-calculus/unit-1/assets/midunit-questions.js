/* Original ECHS checkpoint questions. Append new stable IDs; preserve existing IDs and revision when extending. */
(function(root){
  const data = {
  "revision": "midunit-v1",
  "title": "Middle Unit Important Checking Questions",
  "questions": [
    {
      "id": "q01",
      "family": "polynomial",
      "title": "Count positive inputs",
      "prompt": "A calibration model is given by \\(C(x)=0.1x^4-0.7x^3+0.5x^2+3.1x+1\\). For how many distinct positive values of \\(b\\) is \\(\\lim_{x\\to b}C(x)=4\\)?",
      "choices": [
        "One",
        "Two",
        "Three",
        "Four"
      ],
      "answer": 2,
      "hint": "A polynomial is continuous. Look for intersections of its graph with the horizontal line y = 4.",
      "solution": "Continuity gives \\(\\lim_{x\\to b}C(x)=C(b)\\). Solve \\(C(b)-4=0\\). In fact, \\(C(x)-4=0.1(x+2)(x-1)(x-3)(x-5)\\). The roots are −2, 1, 3, and 5, so there are <strong>three</strong> distinct positive inputs. A graphing calculator may be used to find the intersections; the factorization verifies the count.",
      "calculator": true,
      "check": {
        "coefficients": [
          0.1,
          -0.7,
          0.5,
          3.1,
          1
        ],
        "target": 4,
        "roots": [
          -2,
          1,
          3,
          5
        ],
        "count": 3
      }
    },
    {
      "id": "q02",
      "family": "polynomial",
      "title": "A second calibration model",
      "prompt": "A test instrument has response \\(R(x)=0.25x^4-0.5x^3-3.25x^2+3.5x+12\\). How many distinct positive values of \\(a\\) satisfy \\(\\lim_{x\\to a}R(x)=6\\)?",
      "choices": [
        "One",
        "Three",
        "Four",
        "Two"
      ],
      "answer": 3,
      "hint": "Count positive input values, not all intersections.",
      "solution": "The polynomial is continuous, so solve \\(R(a)=6\\). The exact factorization is \\(R(x)-6=0.25(x+3)(x+1)(x-2)(x-4)\\). Its four roots are −3, −1, 2, and 4. Only <strong>two</strong> are positive.",
      "calculator": true,
      "check": {
        "coefficients": [
          0.25,
          -0.5,
          -3.25,
          3.5,
          12
        ],
        "target": 6,
        "roots": [
          -3,
          -1,
          2,
          4
        ],
        "count": 2
      }
    },
    {
      "id": "q03",
      "family": "flat-motion",
      "title": "Warehouse shuttle",
      "prompt": "The graph gives a warehouse shuttle’s position \\(s(t)\\), in meters, along a straight rail. Time is measured in seconds. What is its speed at \\(t=7\\)?",
      "choices": [
        "\\(24/7\\) m/s",
        "6 m/s",
        "0 m/s",
        "24 m/s"
      ],
      "answer": 2,
      "hint": "Inspect the segment containing t = 7. Speed depends on the steepness of a position graph.",
      "solution": "From \\(t=4\\) to \\(t=9\\), the position stays at 24 meters. The slope is \\((24-24)/(9-4)=0\\), so the shuttle’s speed is <strong>0 m/s</strong>. A positive position does not imply motion.",
      "graph": {
        "label": "Shuttle position: straight segments through (0,0), (4,24), (9,24), and (12,45).",
        "domain": [
          0,
          12
        ],
        "range": [
          0,
          48
        ],
        "branches": [
          {
            "points": [
              [
                0,
                0
              ],
              [
                4,
                24
              ],
              [
                9,
                24
              ],
              [
                12,
                45
              ]
            ]
          }
        ],
        "marks": [],
        "xLabel": "Time t (s)",
        "yLabel": "Position s (m)",
        "step": 2
      },
      "check": {
        "time": 7,
        "interval": [
          4,
          9
        ],
        "positions": [
          24,
          24
        ],
        "speed": 0
      }
    },
    {
      "id": "q04",
      "family": "flat-motion",
      "title": "Stage lift pauses",
      "prompt": "A stage lift’s height \\(h(t)\\), in meters above a floor, is shown. Time is in seconds. What is the lift’s speed at \\(t=5\\)?",
      "choices": [
        "14 m/s",
        "2.8 m/s",
        "4 m/s",
        "0 m/s"
      ],
      "answer": 3,
      "hint": "A horizontal segment represents unchanged height.",
      "solution": "The lift remains at 14 meters throughout \\(3<t<8\\). Its slope there is zero, so its speed at 5 seconds is <strong>0 m/s</strong>. Dividing 14 by 5 does not give the speed at that instant.",
      "graph": {
        "label": "Lift height: straight segments through (0,2), (3,14), (8,14), and (10,22).",
        "domain": [
          0,
          10
        ],
        "range": [
          0,
          24
        ],
        "branches": [
          {
            "points": [
              [
                0,
                2
              ],
              [
                3,
                14
              ],
              [
                8,
                14
              ],
              [
                10,
                22
              ]
            ]
          }
        ],
        "marks": [],
        "xLabel": "Time t (s)",
        "yLabel": "Height h (m)",
        "step": 2
      },
      "check": {
        "time": 5,
        "interval": [
          3,
          8
        ],
        "positions": [
          14,
          14
        ],
        "speed": 0
      }
    },
    {
      "id": "q05",
      "family": "table-speed",
      "title": "Autonomous boat",
      "prompt": "An autonomous boat moves forward along a straight channel. The table records its distance \\(d(t)\\) from the dock. Estimate speed at each listed answer time using the two surrounding measurements. At which answer time is the estimated speed greatest?",
      "choices": [
        "\\(t=6\\) s",
        "\\(t=8\\) s",
        "\\(t=2\\) s",
        "\\(t=4\\) s"
      ],
      "answer": 1,
      "hint": "For each candidate time, divide the distance change between its two neighboring measurements by their time difference.",
      "solution": "The centered estimates at 2, 4, 6, and 8 seconds are \\((18-0)/4=4.5\\), \\((42-4)/4=9.5\\), \\((80-18)/4=15.5\\), and \\((132-42)/4=22.5\\) m/s. The greatest estimate is at <strong>t = 8 seconds</strong>. These are estimates from sampled data, not exact instantaneous speeds.",
      "table": {
        "caption": "Boat measurements",
        "headers": [
          "t (s)",
          "0",
          "2",
          "4",
          "6",
          "8",
          "10",
          "12"
        ],
        "rows": [
          [
            "d(t) (m)",
            "0",
            "4",
            "18",
            "42",
            "80",
            "132",
            "198"
          ]
        ]
      },
      "check": {
        "times": [
          0,
          2,
          4,
          6,
          8,
          10,
          12
        ],
        "positions": [
          0,
          4,
          18,
          42,
          80,
          132,
          198
        ],
        "candidates": [
          2,
          4,
          6,
          8
        ],
        "best": 8
      }
    },
    {
      "id": "q06",
      "family": "table-speed",
      "title": "Conveyor package",
      "prompt": "A package travels forward along a conveyor. Selected positions \\(p(t)\\) are shown. Use the measurements immediately before and after each answer time to estimate its speed. Which answer time has the greatest estimate?",
      "choices": [
        "\\(t=20\\) s",
        "\\(t=5\\) s",
        "\\(t=15\\) s",
        "\\(t=10\\) s"
      ],
      "answer": 0,
      "hint": "All centered time intervals have length 10 seconds. Compare the corresponding position changes.",
      "solution": "The estimates at 5, 10, 15, and 20 seconds are \\((55-0)/10=5.5\\), \\((120-15)/10=10.5\\), \\((210-55)/10=15.5\\), and \\((325-120)/10=20.5\\) cm/s. The largest is at <strong>t = 20 seconds</strong>. The question compares these local estimates, not the positions themselves.",
      "table": {
        "caption": "Conveyor measurements",
        "headers": [
          "t (s)",
          "0",
          "5",
          "10",
          "15",
          "20",
          "25",
          "30"
        ],
        "rows": [
          [
            "p(t) (cm)",
            "0",
            "15",
            "55",
            "120",
            "210",
            "325",
            "465"
          ]
        ]
      },
      "check": {
        "times": [
          0,
          5,
          10,
          15,
          20,
          25,
          30
        ],
        "positions": [
          0,
          15,
          55,
          120,
          210,
          325,
          465
        ],
        "candidates": [
          5,
          10,
          15,
          20
        ],
        "best": 20
      }
    },
    {
      "id": "q07",
      "family": "linear-speed",
      "title": "Drone on a straight route",
      "prompt": "A drone moves east. Its position \\(p(t)\\), in meters, is a linear function of time in seconds for \\(0<t<40\\). Which quantity gives its speed at \\(t=12\\)?",
      "choices": [
        "\\(p(12)\\)",
        "\\(p(12)/12\\)",
        "\\(p(13)-p(11)\\)",
        "The slope of the graph of \\(p\\) against \\(t\\)"
      ],
      "answer": 3,
      "hint": "A linear position graph has a constant slope. The drone is moving in the positive direction.",
      "solution": "For a linear position function \\(p(t)=mt+b\\), moving east means \\(m>0\\). Speed is the positive slope \\(m\\), in m/s. The value \\(p(12)\\) is a position, \\(p(12)/12\\) may include an initial-position offset, and \\(p(13)-p(11)=2m\\) omits division by the 2-second interval."
    },
    {
      "id": "q08",
      "family": "linear-speed",
      "title": "Printer carriage",
      "prompt": "A printer carriage moves right with a linear position function \\(s(t)\\), measured in millimeters, for \\(0<t<60\\) seconds. Which expression equals its speed at \\(t=18\\)?",
      "choices": [
        "\\(s(18)\\)",
        "\\(\\dfrac{s(20)-s(16)}{4}\\)",
        "\\(\\dfrac{s(18)}{18}\\)",
        "\\(s(20)-s(16)\\)"
      ],
      "answer": 1,
      "hint": "For linear motion, every secant slope equals the instantaneous slope.",
      "solution": "Because \\(s(t)=mt+b\\) with \\(m>0\\), \\(\\frac{s(20)-s(16)}{20-16}=m\\). The 4-second denominator gives the correct units, mm/s, and the exact constant speed at 18 seconds."
    },
    {
      "id": "q09",
      "family": "notation-formula",
      "title": "Small response time",
      "prompt": "For \\(t\\ne0\\), a response model is \\(r(t)=\\dfrac{e^{3t}-1}{t}\\). It is known that \\(r(t)\\) can be made arbitrarily close to 3 by taking \\(t\\) sufficiently close to 0, with \\(t\\ne0\\). Which equation expresses this statement?",
      "choices": [
        "\\(r(0)=3\\)",
        "\\(\\lim_{t\\to3}r(t)=0\\)",
        "\\(\\lim_{t\\to0}r(t)=3\\)",
        "\\(r\\!\\left(\\lim_{t\\to0}t\\right)=3\\)"
      ],
      "answer": 2,
      "hint": "The input approaches 0; the output approaches 3.",
      "solution": "The statement is exactly \\(\\lim_{t\\to0}r(t)=3\\). The displayed formula does not define \\(r(0)\\), and the limit does not require a value at 0. The fourth choice would evaluate the undefined \\(r(0)\\). No exponential-limit calculation is needed because the nearby behavior is supplied."
    },
    {
      "id": "q10",
      "family": "notation-formula",
      "title": "Camera calibration",
      "prompt": "For a nonzero adjustment \\(x\\), a camera calibration factor is \\(k(x)=\\dfrac{\\sqrt{16+x}-4}{x}\\). Its outputs approach \\(1/8\\) as \\(x\\) approaches 0 from either side. Which equation records this behavior?",
      "choices": [
        "\\(\\lim_{x\\to0}k(x)=\\dfrac18\\)",
        "\\(k(0)=\\dfrac18\\)",
        "\\(\\lim_{x\\to1/8}k(x)=0\\)",
        "\\(\\lim_{x\\to0}k(x)=0\\)"
      ],
      "answer": 0,
      "hint": "Write the target input under the limit symbol and the approaching output on the right.",
      "solution": "The correct notation is \\(\\lim_{x\\to0}k(x)=1/8\\). The original expression is undefined at 0. As a check using Topic 1.6, for nearby \\(x\\ne0\\), rationalization gives \\(k(x)=1/(\\sqrt{16+x}+4)\\), which tends to \\(1/8\\)."
    },
    {
      "id": "q11",
      "family": "notation-verbal",
      "title": "Reservoir sensor",
      "prompt": "A sensor’s reading \\(T(h)\\) approaches 9 as the water depth \\(h\\) approaches 2 from either side, excluding \\(h=2\\). Which statement must be true?",
      "choices": [
        "\\(T(2)=9\\)",
        "\\(\\lim_{h\\to2}T(h)=9\\)",
        "\\(T(9)=2\\)",
        "\\(\\lim_{h\\to9}T(h)=2\\)"
      ],
      "answer": 1,
      "hint": "Separate the behavior near an input from the value at that input.",
      "solution": "The information states \\(\\lim_{h\\to2}T(h)=9\\). It does not specify \\(T(2)\\); that value could be 9, another number, or undefined. The input and output cannot be interchanged."
    },
    {
      "id": "q12",
      "family": "notation-verbal",
      "title": "Motor error reading",
      "prompt": "As a motor’s control setting \\(v\\) gets arbitrarily close to 6 from either side, its error reading \\(E(v)\\) approaches −3. Which statement is guaranteed?",
      "choices": [
        "\\(E(6)=-3\\)",
        "\\(\\lim_{v\\to-3}E(v)=6\\)",
        "\\(E(-3)=6\\)",
        "\\(\\lim_{v\\to6}E(v)=-3\\)"
      ],
      "answer": 3,
      "hint": "The limit concerns nearby error readings, regardless of the reading exactly at the target.",
      "solution": "The guaranteed statement is \\(\\lim_{v\\to6}E(v)=-3\\). No continuity or particular value at \\(v=6\\) was given, so \\(E(6)=-3\\) need not hold."
    },
    {
      "id": "q13",
      "family": "choose-graph",
      "title": "Follow both sides",
      "prompt": "Which graph could represent a function satisfying \\(\\lim_{x\\to2}f(x)=4\\)?",
      "choices": [
        "Graph A",
        "Graph B",
        "Graph C",
        "Graph D"
      ],
      "answer": 2,
      "hint": "Follow each curve toward x = 2 from the left and the right. A separate filled point gives f(2).",
      "solution": "In <strong>Graph C</strong>, both branches approach the open point \\((2,4)\\). The filled point at \\((2,1)\\) means \\(f(2)=1\\), which does not change the limit. Graph A has unequal one-sided limits; B has limit 3; D has limit 1.",
      "choiceGraphs": [
        {
          "label": "A: left branch approaches (2,3); right branch begins at the filled point (2,4).",
          "domain": [
            -1,
            5
          ],
          "range": [
            -1,
            7
          ],
          "branches": [
            {
              "domain": [
                -1,
                2
              ],
              "coefficients": [
                0.5,
                2
              ]
            },
            {
              "domain": [
                2,
                5
              ],
              "coefficients": [
                -0.5,
                5
              ]
            }
          ],
          "marks": [
            {
              "x": 2,
              "y": 3,
              "open": true
            },
            {
              "x": 2,
              "y": 4,
              "open": false
            }
          ],
          "xLabel": "x",
          "yLabel": "f(x)",
          "step": 1
        },
        {
          "label": "B: a downward curve has a hole at (2,3) and a filled point at (2,4).",
          "domain": [
            -1,
            5
          ],
          "range": [
            -1,
            7
          ],
          "branches": [
            {
              "domain": [
                -1,
                2
              ],
              "coefficients": [
                -0.25,
                1,
                2
              ]
            },
            {
              "domain": [
                2,
                5
              ],
              "coefficients": [
                -0.25,
                1,
                2
              ]
            }
          ],
          "marks": [
            {
              "x": 2,
              "y": 3,
              "open": true
            },
            {
              "x": 2,
              "y": 4,
              "open": false
            }
          ],
          "xLabel": "x",
          "yLabel": "f(x)",
          "step": 1
        },
        {
          "label": "C: a downward curve has a hole at (2,4) and a filled point at (2,1).",
          "domain": [
            -1,
            5
          ],
          "range": [
            -1,
            7
          ],
          "branches": [
            {
              "domain": [
                -1,
                2
              ],
              "coefficients": [
                -0.3,
                1.2,
                2.8
              ]
            },
            {
              "domain": [
                2,
                5
              ],
              "coefficients": [
                -0.3,
                1.2,
                2.8
              ]
            }
          ],
          "marks": [
            {
              "x": 2,
              "y": 4,
              "open": true
            },
            {
              "x": 2,
              "y": 1,
              "open": false
            }
          ],
          "xLabel": "x",
          "yLabel": "f(x)",
          "step": 1
        },
        {
          "label": "D: an upward parabola has its filled vertex at (2,1).",
          "domain": [
            -1,
            5
          ],
          "range": [
            -1,
            7
          ],
          "branches": [
            {
              "domain": [
                -1,
                5
              ],
              "coefficients": [
                0.5,
                -2,
                3
              ]
            }
          ],
          "marks": [
            {
              "x": 2,
              "y": 1,
              "open": false
            }
          ],
          "xLabel": "x",
          "yLabel": "f(x)",
          "step": 1
        }
      ],
      "check": {
        "target": 2,
        "left": [
          3,
          3,
          4,
          1
        ],
        "right": [
          4,
          3,
          4,
          1
        ],
        "limit": 4
      }
    },
    {
      "id": "q14",
      "family": "choose-graph",
      "title": "A value can differ from a limit",
      "prompt": "Which graph could represent \\(\\lim_{x\\to-1}f(x)=2\\)?",
      "choices": [
        "Graph A",
        "Graph B",
        "Graph C",
        "Graph D"
      ],
      "answer": 0,
      "hint": "An open circle can mark the approaching value even when the actual function value is elsewhere.",
      "solution": "<strong>Graph A</strong> approaches 2 from both sides of −1, although \\(f(-1)=4\\). Graph B approaches 2 and 3 from opposite sides; C approaches 4; D approaches 1.",
      "choiceGraphs": [
        {
          "label": "A: a downward curve has a hole at (-1,2) and a filled point at (-1,4).",
          "domain": [
            -4,
            2
          ],
          "range": [
            -1,
            6
          ],
          "branches": [
            {
              "domain": [
                -4,
                -1
              ],
              "coefficients": [
                -0.2,
                -0.4,
                1.8
              ]
            },
            {
              "domain": [
                -1,
                2
              ],
              "coefficients": [
                -0.2,
                -0.4,
                1.8
              ]
            }
          ],
          "marks": [
            {
              "x": -1,
              "y": 2,
              "open": true
            },
            {
              "x": -1,
              "y": 4,
              "open": false
            }
          ],
          "xLabel": "x",
          "yLabel": "f(x)",
          "step": 1
        },
        {
          "label": "B: left branch approaches (-1,2); right branch approaches (-1,3), with the latter point filled.",
          "domain": [
            -4,
            2
          ],
          "range": [
            -1,
            6
          ],
          "branches": [
            {
              "domain": [
                -4,
                -1
              ],
              "coefficients": [
                0.4,
                2.4
              ]
            },
            {
              "domain": [
                -1,
                2
              ],
              "coefficients": [
                -0.3,
                2.7
              ]
            }
          ],
          "marks": [
            {
              "x": -1,
              "y": 2,
              "open": true
            },
            {
              "x": -1,
              "y": 3,
              "open": false
            }
          ],
          "xLabel": "x",
          "yLabel": "f(x)",
          "step": 1
        },
        {
          "label": "C: a downward curve has a hole at (-1,4) and a filled point at (-1,2).",
          "domain": [
            -4,
            2
          ],
          "range": [
            -1,
            6
          ],
          "branches": [
            {
              "domain": [
                -4,
                -1
              ],
              "coefficients": [
                -0.3,
                -0.6,
                3.7
              ]
            },
            {
              "domain": [
                -1,
                2
              ],
              "coefficients": [
                -0.3,
                -0.6,
                3.7
              ]
            }
          ],
          "marks": [
            {
              "x": -1,
              "y": 4,
              "open": true
            },
            {
              "x": -1,
              "y": 2,
              "open": false
            }
          ],
          "xLabel": "x",
          "yLabel": "f(x)",
          "step": 1
        },
        {
          "label": "D: an upward parabola has its filled vertex at (-1,1).",
          "domain": [
            -4,
            2
          ],
          "range": [
            -1,
            6
          ],
          "branches": [
            {
              "domain": [
                -4,
                2
              ],
              "coefficients": [
                0.4,
                0.8,
                1.4
              ]
            }
          ],
          "marks": [
            {
              "x": -1,
              "y": 1,
              "open": false
            }
          ],
          "xLabel": "x",
          "yLabel": "f(x)",
          "step": 1
        }
      ],
      "check": {
        "target": -1,
        "left": [
          2,
          2,
          4,
          1
        ],
        "right": [
          2,
          3,
          4,
          1
        ],
        "limit": 2
      }
    },
    {
      "id": "q15",
      "family": "one-sided-graph",
      "title": "Three different readings",
      "prompt": "For the graph shown, which expression equals 3?",
      "choices": [
        "\\(f(2)\\)",
        "\\(\\lim_{x\\to2^+}f(x)\\)",
        "\\(\\lim_{x\\to2}f(x)\\)",
        "\\(\\lim_{x\\to2^-}f(x)\\)"
      ],
      "answer": 3,
      "hint": "The superscript − means approach using inputs smaller than 2.",
      "solution": "The left branch approaches the open point \\((2,3)\\), so \\(\\lim_{x\\to2^-}f(x)=3\\). The filled point gives \\(f(2)=5\\), while the right-hand limit is 7. Since 3 and 7 differ, the two-sided limit does not exist.",
      "graph": {
        "label": "Left branch ends with a hole at (2,3); a filled point is at (2,5); right branch starts with a hole at (2,7).",
        "domain": [
          -1,
          6
        ],
        "range": [
          0,
          8
        ],
        "branches": [
          {
            "domain": [
              -1,
              2
            ],
            "coefficients": [
              0.75,
              1.5
            ]
          },
          {
            "domain": [
              2,
              6
            ],
            "coefficients": [
              -0.4,
              1.6,
              5.4
            ]
          }
        ],
        "marks": [
          {
            "x": 2,
            "y": 3,
            "open": true
          },
          {
            "x": 2,
            "y": 5,
            "open": false
          },
          {
            "x": 2,
            "y": 7,
            "open": true
          }
        ],
        "xLabel": "x",
        "yLabel": "f(x)",
        "step": 1
      },
      "check": {
        "target": 2,
        "left": 3,
        "right": 7,
        "at": 5,
        "result": 3
      }
    },
    {
      "id": "q16",
      "family": "one-sided-graph",
      "title": "Approach from greater inputs",
      "prompt": "Which expression equals −2 for the function shown?",
      "choices": [
        "\\(f(-1)\\)",
        "\\(\\lim_{x\\to-1^+}f(x)\\)",
        "\\(\\lim_{x\\to-1^-}f(x)\\)",
        "\\(\\lim_{x\\to-1}f(x)\\)"
      ],
      "answer": 1,
      "hint": "Approaching −1 from the right uses numbers greater than −1, such as −0.9.",
      "solution": "The right branch approaches the open point \\((-1,-2)\\), so \\(\\lim_{x\\to-1^+}f(x)=-2\\). Meanwhile, the left-hand limit is 5 and \\(f(-1)=2\\). The two-sided limit does not exist.",
      "graph": {
        "label": "Left branch approaches an open point (-1,5); the filled value is (-1,2); the right branch approaches an open point (-1,-2).",
        "domain": [
          -4,
          3
        ],
        "range": [
          -3,
          7
        ],
        "branches": [
          {
            "domain": [
              -4,
              -1
            ],
            "coefficients": [
              0.5,
              5.5
            ]
          },
          {
            "domain": [
              -1,
              3
            ],
            "coefficients": [
              0.25,
              0.5,
              -1.75
            ]
          }
        ],
        "marks": [
          {
            "x": -1,
            "y": 5,
            "open": true
          },
          {
            "x": -1,
            "y": 2,
            "open": false
          },
          {
            "x": -1,
            "y": -2,
            "open": true
          }
        ],
        "xLabel": "x",
        "yLabel": "f(x)",
        "step": 1
      },
      "check": {
        "target": -1,
        "left": 5,
        "right": -2,
        "at": 2,
        "result": -2
      }
    },
    {
      "id": "q17",
      "family": "jump-limit",
      "title": "A jump is not an average",
      "prompt": "What is \\(\\lim_{x\\to4}f(x)\\) for the displayed graph?",
      "choices": [
        "The limit does not exist.",
        "1",
        "3",
        "5"
      ],
      "answer": 0,
      "hint": "A two-sided limit exists only if the two one-sided limits agree.",
      "solution": "The left-hand limit is 1 and the right-hand limit is 5. They are unequal, so the <strong>two-sided limit does not exist</strong>. Averaging them to get 3 is not a limit rule, and the filled value \\(f(4)=1\\) does not repair the jump.",
      "graph": {
        "label": "Left branch meets the filled point (4,1); right branch begins with a hole at (4,5).",
        "domain": [
          0,
          8
        ],
        "range": [
          0,
          7
        ],
        "branches": [
          {
            "domain": [
              0,
              4
            ],
            "coefficients": [
              0.2,
              -1.6,
              4.2
            ]
          },
          {
            "domain": [
              4,
              8
            ],
            "coefficients": [
              -0.2,
              2.4,
              -1.4
            ]
          }
        ],
        "marks": [
          {
            "x": 4,
            "y": 1,
            "open": false
          },
          {
            "x": 4,
            "y": 5,
            "open": true
          }
        ],
        "xLabel": "x",
        "yLabel": "f(x)",
        "step": 1
      },
      "check": {
        "target": 4,
        "left": 1,
        "right": 5,
        "at": 1,
        "result": "DNE"
      }
    },
    {
      "id": "q18",
      "family": "jump-limit",
      "title": "Ignore the isolated point",
      "prompt": "For the graph shown, determine \\(\\lim_{x\\to-2}f(x)\\).",
      "choices": [
        "4",
        "3",
        "The limit does not exist.",
        "−1"
      ],
      "answer": 2,
      "hint": "Read the approaching heights of the two branches, not the isolated filled point.",
      "solution": "As \\(x\\to-2^-\\), the output approaches 4. As \\(x\\to-2^+\\), it approaches −1. These disagree, so the <strong>two-sided limit does not exist</strong>. The isolated value \\(f(-2)=3\\) is a separate fact.",
      "graph": {
        "label": "At x = -2, the left branch has a hole at height 4, the right branch has a hole at height -1, and a filled point has height 3.",
        "domain": [
          -5,
          2
        ],
        "range": [
          -2,
          6
        ],
        "branches": [
          {
            "domain": [
              -5,
              -2
            ],
            "coefficients": [
              0.3,
              4.6
            ]
          },
          {
            "domain": [
              -2,
              2
            ],
            "coefficients": [
              0.2,
              0.8,
              -0.2
            ]
          }
        ],
        "marks": [
          {
            "x": -2,
            "y": 4,
            "open": true
          },
          {
            "x": -2,
            "y": -1,
            "open": true
          },
          {
            "x": -2,
            "y": 3,
            "open": false
          }
        ],
        "xLabel": "x",
        "yLabel": "f(x)",
        "step": 1
      },
      "check": {
        "target": -2,
        "left": 4,
        "right": -1,
        "at": 3,
        "result": "DNE"
      }
    },
    {
      "id": "q19",
      "family": "table-estimate",
      "title": "Estimate a calibration limit",
      "prompt": "The table samples a continuous calibration function \\(F\\). Which value is the best approximation to \\(\\lim_{x\\to2}F(x)\\) suggested by these data?",
      "choices": [
        "2",
        "7",
        "0",
        "The limit does not exist."
      ],
      "answer": 1,
      "hint": "Compare outputs at inputs closest to 2 on both sides.",
      "solution": "The values 6.9984 and 7.0016 lie closest to the target input and bracket 7. Both sides suggest a limit of approximately <strong>7</strong>. The input target 2 is not the output limit. Continuity guarantees a limit here; the table supplies an estimate of its value.",
      "table": {
        "caption": "Continuous calibration data",
        "headers": [
          "x",
          "1.9",
          "1.99",
          "1.999",
          "2.001",
          "2.01",
          "2.1"
        ],
        "rows": [
          [
            "F(x)",
            "6.84",
            "6.984",
            "6.9984",
            "7.0016",
            "7.016",
            "7.16"
          ]
        ]
      },
      "check": {
        "target": 2,
        "estimate": 7
      }
    },
    {
      "id": "q20",
      "family": "table-estimate",
      "title": "Continuous response data",
      "prompt": "Selected values of a continuous response function \\(G\\) are shown. What is the best table-based approximation to \\(\\lim_{x\\to-3}G(x)\\)?",
      "choices": [
        "−3",
        "0",
        "The limit does not exist.",
        "2"
      ],
      "answer": 3,
      "hint": "Order negative inputs carefully: −3.001 is left of −3 and −2.999 is right of −3.",
      "solution": "Approaching −3 from the left, the sampled outputs approach 2 from below. From the right they approach 2 from above. The best approximation is <strong>2</strong>. This is a numerical estimate based on the data, not a proof of an exact value.",
      "table": {
        "caption": "Continuous response measurements",
        "headers": [
          "x",
          "−3.1",
          "−3.01",
          "−3.001",
          "−2.999",
          "−2.99",
          "−2.9"
        ],
        "rows": [
          [
            "G(x)",
            "1.85",
            "1.985",
            "1.9985",
            "2.0015",
            "2.015",
            "2.15"
          ]
        ]
      },
      "check": {
        "target": -3,
        "estimate": 2
      }
    },
    {
      "id": "q21",
      "family": "one-sided-table",
      "title": "One side settles",
      "prompt": "Which limiting behavior is best supported by the sampled values in the table?",
      "choices": [
        "\\(\\lim_{x\\to5^+}f(x)=9\\)",
        "\\(\\lim_{x\\to5}f(x)=9\\)",
        "\\(\\lim_{x\\to5^-}f(x)=9\\)",
        "\\(\\lim_{x\\to9^+}f(x)=5\\)"
      ],
      "answer": 0,
      "hint": "Read the columns with x > 5 in order toward 5.",
      "solution": "The right-side samples get closer to 9 as the inputs get closer to 5. They support \\(\\lim_{x\\to5^+}f(x)=9\\). The left-side samples alternate sign with increasing magnitude and do not support a limit of 9. A finite table supports an estimate; by itself it does not prove the behavior at every sufficiently close input.",
      "table": {
        "caption": "Samples near 5",
        "headers": [
          "x",
          "4.9",
          "4.99",
          "4.999",
          "4.9999",
          "5.0001",
          "5.001",
          "5.01",
          "5.1"
        ],
        "rows": [
          [
            "f(x)",
            "2",
            "−8",
            "32",
            "−128",
            "8.9999",
            "8.999",
            "8.99",
            "8.9"
          ]
        ]
      },
      "check": {
        "target": 5,
        "side": "right",
        "estimate": 9
      }
    },
    {
      "id": "q22",
      "family": "one-sided-table",
      "title": "Read the left approach",
      "prompt": "Which conclusion is best supported by the table’s trend near \\(x=-2\\)?",
      "choices": [
        "\\(\\lim_{x\\to-2^+}g(x)=4\\)",
        "\\(\\lim_{x\\to-2}g(x)=4\\)",
        "\\(\\lim_{x\\to-2^-}g(x)=4\\)",
        "\\(\\lim_{x\\to4}g(x)=-2\\)"
      ],
      "answer": 2,
      "hint": "Inputs such as −2.1 and −2.001 are on the left of −2.",
      "solution": "The left-side outputs 3.9, 3.99, 3.999, and 3.9999 suggest an approach to 4, so the supported conclusion is \\(\\lim_{x\\to-2^-}g(x)=4\\). On the right, values alternate and grow in magnitude as inputs get closer to −2. The finite samples do not prove an exact limit.",
      "table": {
        "caption": "Samples near −2",
        "headers": [
          "x",
          "−2.1",
          "−2.01",
          "−2.001",
          "−2.0001",
          "−1.9999",
          "−1.999",
          "−1.99",
          "−1.9"
        ],
        "rows": [
          [
            "g(x)",
            "3.9",
            "3.99",
            "3.999",
            "3.9999",
            "189",
            "−63",
            "21",
            "−7"
          ]
        ]
      },
      "check": {
        "target": -2,
        "side": "left",
        "estimate": 4
      }
    },
    {
      "id": "q23",
      "family": "finite-evidence",
      "title": "Estimate versus certainty",
      "prompt": "Only the listed values of \\(f\\) are known; no formula, continuity, or other behavior is specified. Which statement about \\(\\lim_{x\\to3}f(x)\\) must be true?",
      "choices": [
        "The limit cannot be definitively determined from this finite table alone.",
        "\\(\\lim_{x\\to3}f(x)=9\\)",
        "\\(\\lim_{x\\to3}f(x)=1\\)",
        "The limit does not exist."
      ],
      "answer": 0,
      "hint": "Could the function behave differently inside the unsampled gap around 3?",
      "solution": "The samples suggest 9, but they do not determine a limit with certainty. Between the closest samples (2.999 and 3.001), a function could approach 9, approach another number, or oscillate without settling, while matching every listed value. Also, \\(f(3)=1\\) does not determine the limit. Thus <strong>the finite table alone is insufficient</strong>.",
      "table": {
        "caption": "Only these values are given",
        "headers": [
          "x",
          "2.9",
          "2.99",
          "2.999",
          "3",
          "3.001",
          "3.01",
          "3.1"
        ],
        "rows": [
          [
            "f(x)",
            "8.8",
            "8.94",
            "8.98",
            "1",
            "9.02",
            "9.06",
            "9.2"
          ]
        ]
      },
      "check": {
        "target": 3,
        "suggested": 9,
        "at": 1,
        "result": "insufficient"
      }
    },
    {
      "id": "q24",
      "family": "finite-evidence",
      "title": "What can measurements prove?",
      "prompt": "The table contains all the information given about \\(g\\). Which conclusion about \\(\\lim_{x\\to-2}g(x)\\) is justified with certainty?",
      "choices": [
        "The limit equals \\(g(-2)=8\\).",
        "Its value and existence cannot be definitively determined from the finite table alone.",
        "The limit is exactly 5.",
        "The limit does not exist."
      ],
      "answer": 1,
      "hint": "A trend suggests a value; a statement that must hold needs stronger information.",
      "solution": "The nearby values suggest 5, and the table establishes \\(g(-2)=8\\). Neither fact determines the limit. One function matching the samples can approach 5, another can approach a different value within the unsampled interval, and another can oscillate there. <strong>No particular limit or nonexistence is forced by the table.</strong>",
      "table": {
        "caption": "Finite measurements near −2",
        "headers": [
          "x",
          "−2.1",
          "−2.01",
          "−2.001",
          "−2",
          "−1.999",
          "−1.99",
          "−1.9"
        ],
        "rows": [
          [
            "g(x)",
            "4.7",
            "4.93",
            "4.99",
            "8",
            "5.01",
            "5.07",
            "5.3"
          ]
        ]
      },
      "check": {
        "target": -2,
        "suggested": 5,
        "at": 8,
        "result": "insufficient"
      }
    }
  ]
};
  if(typeof module==="object"&&module.exports)module.exports=data;
  else root.ECHSMidunitQuestions=data;
})(typeof window==="undefined"?globalThis:window);
