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
    },
    {
      "id": "q25",
      "family": "piecewise-analytic",
      "title": "Approach a pump’s switching time",
      "topic": "1.5",
      "batch": "batch-2",
      "prompt": "A pump’s flow setting is modeled by \\(R(t)=\\begin{cases}2t+1,&t<3,\\\\12-t,&t>3.\\end{cases}\\) What is \\(\\lim_{t\\to3^-}R(t)\\)?",
      "choices": [
        "9",
        "7",
        "The limit does not exist.",
        "6"
      ],
      "answer": 1,
      "hint": "For a left-hand limit at 3, use the rule that applies when t < 3.",
      "solution": "For inputs just below 3, \\(R(t)=2t+1\\). Therefore \\(\\lim_{t\\to3^-}R(t)=2(3)+1=7\\). The other branch approaches 9, but that does not affect this left-hand limit. No value at exactly 3 is required.",
      "check": {
        "target": 3,
        "side": "left",
        "leftCoefficients": [
          2,
          1
        ],
        "rightCoefficients": [
          -1,
          12
        ],
        "at": null,
        "result": 7
      }
    },
    {
      "id": "q26",
      "family": "piecewise-analytic",
      "title": "A calibration rule from the right",
      "topic": "1.5",
      "batch": "batch-2",
      "prompt": "A device uses \\(H(x)=\\begin{cases}x^2+1,&x<-2,\\\\12,&x=-2,\\\\3x+10,&x>-2.\\end{cases}\\) Find \\(\\lim_{x\\to-2^+}H(x)\\).",
      "choices": [
        "12",
        "5",
        "4",
        "The limit does not exist."
      ],
      "answer": 2,
      "hint": "Inputs approaching −2 from the right are greater than −2.",
      "solution": "The relevant rule is \\(3x+10\\). Its limit at −2 is \\(3(-2)+10=4\\). The value \\(H(-2)=12\\) and the left-hand limit 5 are different pieces of information; neither replaces the right-hand limit.",
      "check": {
        "target": -2,
        "side": "right",
        "leftCoefficients": [
          1,
          0,
          1
        ],
        "rightCoefficients": [
          3,
          10
        ],
        "at": 12,
        "result": 4
      }
    },
    {
      "id": "q27",
      "family": "graph-limit-laws",
      "title": "Combine two graphical limits",
      "topic": "1.5",
      "batch": "batch-2",
      "prompt": "The graphs show \\(f\\) and \\(g\\). Find \\(\\displaystyle\\lim_{x\\to2}\\frac{f(x)+3}{g(x)}\\).",
      "choices": [
        "1",
        "\\(\\frac54\\)",
        "2",
        "The limit does not exist."
      ],
      "answer": 2,
      "hint": "Read the approaching value of each graph. Then check that the denominator’s limit is nonzero.",
      "solution": "The hole shows \\(\\lim_{x\\to2}f(x)=5\\), while the line gives \\(\\lim_{x\\to2}g(x)=4\\). Since 4 is nonzero, the quotient law gives \\((5+3)/4=2\\). Using the filled value \\(f(2)=1\\) would give the distractor 1.",
      "graphs": [
        {
          "label": "Graph of f: a parabola has a hole at (2,5) and a filled point at (2,1).",
          "domain": [
            -1,
            4
          ],
          "range": [
            0,
            10
          ],
          "branches": [
            {
              "domain": [
                -1,
                2
              ],
              "coefficients": [
                0.5,
                -1,
                5
              ]
            },
            {
              "domain": [
                2,
                4
              ],
              "coefficients": [
                0.5,
                -1,
                5
              ]
            }
          ],
          "marks": [
            {
              "x": 2,
              "y": 5,
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
          "label": "Graph of g: the line g(x) = x + 2 passes through the filled point (2,4).",
          "domain": [
            -1,
            4
          ],
          "range": [
            0,
            7
          ],
          "branches": [
            {
              "domain": [
                -1,
                4
              ],
              "coefficients": [
                1,
                2
              ]
            }
          ],
          "marks": [
            {
              "x": 2,
              "y": 4,
              "open": false
            }
          ],
          "xLabel": "x",
          "yLabel": "g(x)",
          "step": 1
        }
      ],
      "check": {
        "target": 2,
        "fLimit": 5,
        "gLimit": 4,
        "scale": 1,
        "offset": 3,
        "result": 2
      }
    },
    {
      "id": "q28",
      "family": "graph-limit-laws",
      "title": "A negative denominator limit",
      "topic": "1.5",
      "batch": "batch-2",
      "prompt": "Using the two graphs, evaluate \\(\\displaystyle\\lim_{x\\to-1}\\frac{2f(x)-1}{g(x)}\\).",
      "choices": [
        "−1",
        "\\(-\\frac{11}{3}\\)",
        "\\(-\\frac23\\)",
        "The limit does not exist."
      ],
      "answer": 0,
      "hint": "A denominator approaching a negative number is allowed. It must be nonzero.",
      "solution": "The nearby values give \\(\\lim_{x\\to-1}f(x)=2\\) and \\(\\lim_{x\\to-1}g(x)=-3\\). Thus the limit is \\((2\\cdot2-1)/(-3)=-1\\). The point value \\(f(-1)=6\\) would incorrectly produce \\(-11/3\\).",
      "graphs": [
        {
          "label": "Graph of f: a parabola has a hole at (-1,2) and a filled point at (-1,6).",
          "domain": [
            -3,
            1
          ],
          "range": [
            0,
            8
          ],
          "branches": [
            {
              "domain": [
                -3,
                -1
              ],
              "coefficients": [
                0.5,
                1,
                2.5
              ]
            },
            {
              "domain": [
                -1,
                1
              ],
              "coefficients": [
                0.5,
                1,
                2.5
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
              "y": 6,
              "open": false
            }
          ],
          "xLabel": "x",
          "yLabel": "f(x)",
          "step": 1
        },
        {
          "label": "Graph of g: the line g(x) = -x - 4 passes through (-1,-3).",
          "domain": [
            -3,
            1
          ],
          "range": [
            -6,
            1
          ],
          "branches": [
            {
              "domain": [
                -3,
                1
              ],
              "coefficients": [
                -1,
                -4
              ]
            }
          ],
          "marks": [
            {
              "x": -1,
              "y": -3,
              "open": false
            }
          ],
          "xLabel": "x",
          "yLabel": "g(x)",
          "step": 1
        }
      ],
      "check": {
        "target": -1,
        "fLimit": 2,
        "gLimit": -3,
        "scale": 2,
        "offset": -1,
        "result": -1
      }
    },
    {
      "id": "q29",
      "family": "direct-substitution",
      "title": "A sensor’s response near zero",
      "topic": "1.5",
      "batch": "batch-2",
      "prompt": "A sensor response is modeled near zero by \\(S(t)=\\dfrac{2\\cos t+5e^{2t}}{4e^t}\\). Angles are in radians. Find \\(\\lim_{t\\to0}S(t)\\).",
      "choices": [
        "\\(\\frac54\\)",
        "\\(\\frac74\\)",
        "\\(\\frac78\\)",
        "The limit does not exist."
      ],
      "answer": 1,
      "hint": "At t = 0, cosine and every displayed exponential equal 1.",
      "solution": "Cosine and exponential functions permit direct substitution here. The denominator approaches \\(4e^0=4\\ne0\\), so \\(\\lim_{t\\to0}S(t)=(2\\cdot1+5\\cdot1)/(4\\cdot1)=7/4\\). There is no indeterminate form.",
      "check": {
        "target": 0,
        "cosCoefficient": 2,
        "cosFrequency": 1,
        "expCoefficient": 5,
        "numeratorExpRate": 2,
        "denominatorCoefficient": 4,
        "denominatorExpRate": 1,
        "result": 1.75
      }
    },
    {
      "id": "q30",
      "family": "direct-substitution",
      "title": "A compensation factor",
      "topic": "1.5",
      "batch": "batch-2",
      "prompt": "A compensation factor is \\(K(x)=\\dfrac{3\\cos(2x)-2e^x}{5e^{-x}}\\), with angles in radians. Evaluate \\(\\lim_{x\\to0}K(x)\\).",
      "choices": [
        "1",
        "5",
        "\\(-\\frac15\\)",
        "\\(\\frac15\\)"
      ],
      "answer": 3,
      "hint": "Substitute before choosing an algebraic manipulation.",
      "solution": "At zero, the numerator approaches \\(3-2=1\\), and the denominator approaches \\(5\\ne0\\). Therefore the quotient approaches \\(1/5\\). The negative exponent does not make \\(e^0\\) negative.",
      "check": {
        "target": 0,
        "cosCoefficient": 3,
        "cosFrequency": 2,
        "expCoefficient": -2,
        "numeratorExpRate": 1,
        "denominatorCoefficient": 5,
        "denominatorExpRate": -1,
        "result": 0.2
      }
    },
    {
      "id": "q31",
      "family": "radical-equivalence",
      "title": "Replace a removable radical quotient",
      "topic": "1.6",
      "batch": "batch-2",
      "prompt": "For \\(F(x)=\\dfrac{x-16}{\\sqrt{x}-4}\\), which expression is equivalent to \\(\\lim_{x\\to16}F(x)\\) and can be evaluated by direct substitution?",
      "choices": [
        "\\(\\lim_{x\\to16}(\\sqrt{x}-4)\\)",
        "\\(\\lim_{x\\to16}(\\sqrt{x}+4)\\)",
        "\\(\\lim_{x\\to16}\\frac{x^2-256}{x-16}\\)",
        "\\(\\dfrac{\\lim_{x\\to16}(x-16)}{\\lim_{x\\to16}(\\sqrt{x}-4)}\\)"
      ],
      "answer": 1,
      "hint": "Use the difference of squares: x − 16 = (√x − 4)(√x + 4).",
      "solution": "For nearby \\(x\\ne16\\), cancel the common factor \\(\\sqrt{x}-4\\), giving \\(F(x)=\\sqrt{x}+4\\). Hence the equivalent limit is \\(\\lim_{x\\to16}(\\sqrt{x}+4)=8\\). The quotient of the separate limits is \\(0/0\\), so the quotient law does not justify the last choice.",
      "check": {
        "target": 16,
        "mode": "radical-denominator",
        "result": 8
      }
    },
    {
      "id": "q32",
      "family": "radical-equivalence",
      "title": "A radical in the numerator",
      "topic": "1.6",
      "batch": "batch-2",
      "prompt": "Which expression rewrites \\(\\displaystyle\\lim_{x\\to16}\\frac{\\sqrt{x+9}-5}{x-16}\\) so that direct substitution is valid?",
      "choices": [
        "\\(\\lim_{x\\to16}\\frac{1}{\\sqrt{x+9}-5}\\)",
        "\\(\\lim_{x\\to16}(\\sqrt{x+9}+5)\\)",
        "\\(\\lim_{x\\to16}\\frac{1}{\\sqrt{x+9}+5}\\)",
        "\\(\\dfrac{\\lim_{x\\to16}(\\sqrt{x+9}-5)}{\\lim_{x\\to16}(x-16)}\\)"
      ],
      "answer": 2,
      "hint": "Multiply the numerator and denominator by the numerator’s conjugate.",
      "solution": "For nearby \\(x\\ne16\\), rationalization gives \\(\\frac{\\sqrt{x+9}-5}{x-16}=\\frac{(x+9)-25}{(x-16)(\\sqrt{x+9}+5)}=\\frac1{\\sqrt{x+9}+5}\\). The denominator now approaches 10, so the limit is \\(1/10\\). The rewritten expression agrees nearby, although the original is undefined at 16.",
      "check": {
        "target": 16,
        "mode": "radical-numerator",
        "result": 0.1
      }
    },
    {
      "id": "q33",
      "family": "factor-zero",
      "title": "Cancel the common factor first",
      "topic": "1.6",
      "batch": "batch-2",
      "prompt": "Find \\(\\displaystyle\\lim_{x\\to0}\\frac{5x^6+4x^3-18x}{2x^5+6x}\\).",
      "choices": [
        "\\(\\frac52\\)",
        "0",
        "−3",
        "The limit does not exist."
      ],
      "answer": 2,
      "hint": "Every term has a factor of x. The limit is at zero, so leading coefficients do not determine it.",
      "solution": "For \\(x\\ne0\\), divide numerator and denominator by x: \\(\\frac{5x^5+4x^2-18}{2x^4+6}\\). Substitution now gives \\(-18/6=-3\\). The initial form \\(0/0\\) signals a needed rewrite; it does not mean the limit is zero or nonexistent.",
      "check": {
        "target": 0,
        "numerator": [
          5,
          0,
          0,
          4,
          0,
          -18,
          0
        ],
        "denominator": [
          2,
          0,
          0,
          0,
          6,
          0
        ],
        "cancelPower": 1,
        "result": -3
      }
    },
    {
      "id": "q34",
      "family": "factor-zero",
      "title": "Cancel the full shared power",
      "topic": "1.6",
      "batch": "batch-2",
      "prompt": "Evaluate \\(\\displaystyle\\lim_{x\\to0}\\frac{12x^4-7x^2}{3x^5+2x^2}\\).",
      "choices": [
        "\\(-\\frac72\\)",
        "4",
        "0",
        "The limit does not exist."
      ],
      "answer": 0,
      "hint": "Both numerator and denominator have a factor of x².",
      "solution": "For \\(x\\ne0\\), the quotient equals \\(\\frac{12x^2-7}{3x^3+2}\\). Its denominator approaches 2, so direct substitution gives \\(-7/2\\). Cancelling only one factor of x would leave another removable common factor.",
      "check": {
        "target": 0,
        "numerator": [
          12,
          0,
          -7,
          0,
          0
        ],
        "denominator": [
          3,
          0,
          0,
          2,
          0,
          0
        ],
        "cancelPower": 2,
        "result": -3.5
      }
    },
    {
      "id": "q35",
      "family": "trig-equivalence",
      "title": "Rewrite with a trigonometric identity",
      "topic": "1.6",
      "batch": "batch-2",
      "prompt": "Which expression is equivalent to \\(\\displaystyle\\lim_{x\\to0}\\frac{\\cos(2x)-1}{\\sin^2(2x)}\\) and has a nonzero denominator at the target?",
      "choices": [
        "\\(\\lim_{x\\to0}\\frac{1}{1+\\cos(2x)}\\)",
        "\\(\\lim_{x\\to0}\\frac{-1}{1+\\cos(2x)}\\)",
        "\\(\\lim_{x\\to0}\\cot(2x)\\)",
        "\\(\\lim_{x\\to0}\\bigl(\\cos(2x)-1\\bigr)\\)"
      ],
      "answer": 1,
      "hint": "Factor sin²(2x) as (1 − cos(2x))(1 + cos(2x)).",
      "solution": "Use \\(\\cos(2x)-1=-(1-\\cos(2x))\\) and \\(\\sin^2(2x)=(1-\\cos(2x))(1+\\cos(2x))\\). At sufficiently close nonzero inputs, cancellation gives \\(-1/(1+\\cos(2x))\\). Its limit is \\(-1/2\\). This uses an exact identity and direct substitution.",
      "check": {
        "target": 0,
        "mode": "cosine-difference",
        "frequency": 2,
        "result": -0.5
      }
    },
    {
      "id": "q36",
      "family": "trig-equivalence",
      "title": "Choose the correct sign",
      "topic": "1.6",
      "batch": "batch-2",
      "prompt": "Which expression rewrites \\(\\displaystyle\\lim_{x\\to-\\pi/6}\\frac{1+\\sin(3x)}{\\cos^2(3x)}\\) so that it can be evaluated directly?",
      "choices": [
        "\\(\\lim_{x\\to-\\pi/6}\\frac{-1}{1-\\sin(3x)}\\)",
        "\\(\\lim_{x\\to-\\pi/6}\\frac{1}{1+\\sin(3x)}\\)",
        "\\(\\lim_{x\\to-\\pi/6}\\sec^2(3x)\\)",
        "\\(\\lim_{x\\to-\\pi/6}\\frac{1}{1-\\sin(3x)}\\)"
      ],
      "answer": 3,
      "hint": "Factor cos²(3x) as (1 − sin(3x))(1 + sin(3x)).",
      "solution": "For sufficiently close inputs other than the target, cancel \\(1+\\sin(3x)\\), leaving \\(1/(1-\\sin(3x))\\). Since \\(\\sin(-\\pi/2)=-1\\), the remaining denominator approaches 2 and the limit is \\(1/2\\). The exact identity makes direct substitution valid.",
      "check": {
        "target": -0.5235987755982988,
        "mode": "sine-sum",
        "frequency": 3,
        "result": 0.5
      }
    },
    {
      "id": "q37",
      "family": "complex-fraction",
      "title": "Combine the fractions",
      "topic": "1.6",
      "batch": "batch-2",
      "prompt": "Which limit has the same value as \\(\\displaystyle\\lim_{x\\to3}\\frac{1/x-1/3}{x-3}\\) and follows from a valid algebraic rewrite?",
      "choices": [
        "\\(\\lim_{x\\to3}\\frac{-1}{x}\\)",
        "\\(\\lim_{x\\to3}\\frac{1}{3x}\\)",
        "\\(\\lim_{x\\to3}\\frac{-1}{3x}\\)",
        "\\(\\dfrac{\\lim_{x\\to3}(1/x-1/3)}{\\lim_{x\\to3}(x-3)}\\)"
      ],
      "answer": 2,
      "hint": "Write 1/x − 1/3 over the common denominator 3x.",
      "solution": "For \\(x\\ne0,3\\), \\(1/x-1/3=(3-x)/(3x)=-(x-3)/(3x)\\). After cancelling \\(x-3\\), the quotient becomes \\(-1/(3x)\\). Therefore its limit is \\(-1/9\\). Writing a quotient of zero limits is not a valid application of the quotient law.",
      "check": {
        "target": 3,
        "numeratorConstant": 1,
        "shift": 0,
        "subtract": 0.3333333333333333,
        "result": -0.1111111111111111
      }
    },
    {
      "id": "q38",
      "family": "complex-fraction",
      "title": "A shifted reciprocal model",
      "topic": "1.6",
      "batch": "batch-2",
      "prompt": "A comparison model is \\(M(t)=\\dfrac{2/(t+1)-1/2}{t-3}\\). Which expression is equivalent to \\(\\lim_{t\\to3}M(t)\\) and can be evaluated directly?",
      "choices": [
        "\\(\\lim_{t\\to3}\\frac{-1}{2(t+1)}\\)",
        "\\(\\lim_{t\\to3}\\frac{2}{t+1}\\)",
        "\\(\\lim_{t\\to3}\\frac{1}{2(t+1)}\\)",
        "\\(\\lim_{t\\to3}\\left(\\frac{2}{t+1}-\\frac12\\right)\\)"
      ],
      "answer": 0,
      "hint": "The numerator becomes (3 − t)/(2(t + 1)) after combining fractions.",
      "solution": "For \\(t\\ne-1,3\\), \\(\\frac{2}{t+1}-\\frac12=\\frac{4-(t+1)}{2(t+1)}=-\\frac{t-3}{2(t+1)}\\). Divide by \\(t-3\\) to obtain \\(-1/[2(t+1)]\\). Its limit at 3 is \\(-1/8\\).",
      "check": {
        "target": 3,
        "numeratorConstant": 2,
        "shift": 1,
        "subtract": 0.5,
        "result": -0.125
      }
    },
    {
      "id": "q39",
      "family": "recover-limit",
      "title": "Recover the numerator’s limit",
      "topic": "1.5",
      "batch": "batch-2",
      "prompt": "Functions \\(f\\) and \\(g\\) satisfy \\(\\lim_{x\\to-2}g(x)=-4\\) and \\(\\lim_{x\\to-2}\\frac{f(x)}{g(x)}=\\frac32\\). What is \\(\\lim_{x\\to-2}f(x)\\)?",
      "choices": [
        "\\(-\\frac83\\)",
        "\\(-\\frac52\\)",
        "6",
        "−6"
      ],
      "answer": 3,
      "hint": "Rewrite f as the product (f/g)g near the target.",
      "solution": "Since \\(g(x)\\) approaches the nonzero number −4, it is nonzero sufficiently near −2. Write \\(f(x)=[f(x)/g(x)]g(x)\\). The product law then gives \\(\\lim_{x\\to-2}f(x)=(3/2)(-4)=-6\\). This argument also establishes that the limit of f exists.",
      "check": {
        "target": -2,
        "gLimit": -4,
        "ratioLimit": 1.5,
        "scale": 1,
        "offset": 0,
        "result": -6
      }
    },
    {
      "id": "q40",
      "family": "recover-limit",
      "title": "Recover a transformed limit",
      "topic": "1.5",
      "batch": "batch-2",
      "prompt": "It is known that \\(\\lim_{x\\to3}g(x)=5\\) and \\(\\lim_{x\\to3}\\frac{2f(x)+1}{g(x)}=4\\). Determine \\(\\lim_{x\\to3}f(x)\\).",
      "choices": [
        "\\(\\frac{19}{2}\\)",
        "10",
        "\\(\\frac45\\)",
        "The limit cannot be determined."
      ],
      "answer": 0,
      "hint": "First recover the limit of 2f(x) + 1, then undo the transformation.",
      "solution": "Near 3, the nonzero limit of g permits \\(f(x)=\\tfrac12\\left[g(x)\\frac{2f(x)+1}{g(x)}-1\\right]\\). Apply the product and difference laws to get \\(\\lim_{x\\to3}f(x)=\\tfrac12(5\\cdot4-1)=19/2\\).",
      "check": {
        "target": 3,
        "gLimit": 5,
        "ratioLimit": 4,
        "scale": 2,
        "offset": 1,
        "result": 9.5
      }
    },
    {
      "id": "q41",
      "family": "absolute-value",
      "title": "A directional signal",
      "topic": "1.6",
      "batch": "batch-2",
      "prompt": "A directional signal is modeled by \\(D(x)=\\begin{cases}\\dfrac{2(x-3)}{|x-3|},&x\\ne3,\\\\7,&x=3.\\end{cases}\\) Find \\(\\lim_{x\\to3}D(x)\\).",
      "choices": [
        "−2",
        "7",
        "2",
        "The limit does not exist."
      ],
      "answer": 3,
      "hint": "On each side of 3, replace |x − 3| with the appropriate signed expression.",
      "solution": "For \\(x<3\\), \\(|x-3|=-(x-3)\\), so \\(D(x)=-2\\). For \\(x>3\\), \\(|x-3|=x-3\\), so \\(D(x)=2\\). The one-sided limits disagree, so the two-sided limit does not exist. The assigned value 7 does not change the nearby behavior.",
      "check": {
        "target": 3,
        "offset": 0,
        "scale": 2,
        "at": 7,
        "left": -2,
        "right": 2,
        "result": "DNE"
      }
    },
    {
      "id": "q42",
      "family": "absolute-value",
      "title": "A shifted switching signal",
      "topic": "1.6",
      "batch": "batch-2",
      "prompt": "A switching signal is \\(P(t)=\\begin{cases}4-\\dfrac{t+1}{|t+1|},&t\\ne-1,\\\\9,&t=-1.\\end{cases}\\) What is \\(\\lim_{t\\to-1}P(t)\\)?",
      "choices": [
        "5",
        "The limit does not exist.",
        "3",
        "9"
      ],
      "answer": 1,
      "hint": "The ratio (t + 1)/|t + 1| equals −1 on the left and +1 on the right.",
      "solution": "The left-hand limit is \\(4-(-1)=5\\), while the right-hand limit is \\(4-1=3\\). Since these differ, the two-sided limit does not exist. Neither their average nor \\(P(-1)=9\\) gives the requested limit.",
      "check": {
        "target": -1,
        "offset": 4,
        "scale": -1,
        "at": 9,
        "left": 5,
        "right": 3,
        "result": "DNE"
      }
    },
    {
      "id": "q43",
      "family": "composite-limit",
      "title": "Apply a rule twice",
      "topic": "1.5",
      "batch": "batch-2",
      "prompt": "Let \\(f(x)=\\begin{cases}-x^2+4x+1,&x<1,\\\\6,&x=1,\\\\5-x,&x>1.\\end{cases}\\) A portion of its graph is shown. Find \\(\\displaystyle\\lim_{x\\to1}f(f(x))\\).",
      "choices": [
        "6",
        "−1",
        "4",
        "1"
      ],
      "answer": 3,
      "hint": "First find the limit of the inner f(x). Then choose the outer rule for inputs near that approaching value.",
      "solution": "Both inner branches approach 4: \\(-1+4+1=4\\) and \\(5-1=4\\). For x sufficiently close to 1, the inner output is greater than 1, so the outer function uses its rule \\(f(u)=5-u\\). Thus \\(f(f(x))=5-f(x)\\) nearby and the limit is \\(5-4=1\\). The isolated value \\(f(1)=6\\) does not control the inner limit; \\(f(f(1))=-1\\) is a different quantity.",
      "graph": {
        "label": "A piecewise graph: the left parabola and right line share a hole at (1,4); the filled value is (1,6). The right line passes through (4,1).",
        "domain": [
          0,
          6
        ],
        "range": [
          -2,
          7
        ],
        "branches": [
          {
            "domain": [
              0,
              1
            ],
            "coefficients": [
              -1,
              4,
              1
            ]
          },
          {
            "domain": [
              1,
              6
            ],
            "coefficients": [
              -1,
              5
            ]
          }
        ],
        "marks": [
          {
            "x": 1,
            "y": 4,
            "open": true
          },
          {
            "x": 1,
            "y": 6,
            "open": false
          },
          {
            "x": 4,
            "y": 1,
            "open": false
          }
        ],
        "xLabel": "x",
        "yLabel": "f(x)",
        "step": 1
      },
      "check": {
        "target": 1,
        "leftCoefficients": [
          -1,
          4,
          1
        ],
        "rightCoefficients": [
          -1,
          5
        ],
        "at": 6,
        "innerLimit": 4,
        "outerSide": "right",
        "result": 1
      }
    },
    {
      "id": "q44",
      "family": "composite-limit",
      "title": "Track the inner output",
      "topic": "1.5",
      "batch": "batch-2",
      "prompt": "An adjustment rule is \\(f(x)=\\begin{cases}2x+4,&x<-1,\\\\8,&x=-1,\\\\x^2+1,&x>-1.\\end{cases}\\) When the rule is applied twice, what is \\(\\displaystyle\\lim_{x\\to-1}f(f(x))\\)?",
      "choices": [
        "2",
        "5",
        "8",
        "65"
      ],
      "answer": 1,
      "hint": "The outer function receives numbers close to the inner limit, not numbers close to −1.",
      "solution": "The inner limit is 2 from both sides: \\(2(-1)+4=2\\) and \\((-1)^2+1=2\\). Nearby inner outputs therefore exceed −1, where the outer rule is \\(f(u)=u^2+1\\). The power and sum laws give \\(\\lim_{x\\to-1}f(f(x))=2^2+1=5\\). Using the point value instead would give \\(f(f(-1))=f(8)=65\\), which is not the requested limit.",
      "graph": {
        "label": "A piecewise graph: the left line and right parabola share a hole at (-1,2); the filled value is (-1,8). The parabola passes through (2,5).",
        "domain": [
          -3,
          2.5
        ],
        "range": [
          -3,
          9
        ],
        "branches": [
          {
            "domain": [
              -3,
              -1
            ],
            "coefficients": [
              2,
              4
            ]
          },
          {
            "domain": [
              -1,
              2.5
            ],
            "coefficients": [
              1,
              0,
              1
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
            "y": 8,
            "open": false
          },
          {
            "x": 2,
            "y": 5,
            "open": false
          }
        ],
        "xLabel": "x",
        "yLabel": "f(x)",
        "step": 1
      },
      "check": {
        "target": -1,
        "leftCoefficients": [
          2,
          4
        ],
        "rightCoefficients": [
          1,
          0,
          1
        ],
        "at": 8,
        "innerLimit": 2,
        "outerSide": "right",
        "result": 5
      }
    },
    {
      "id": "q45",
      "family": "tangent-secant",
      "title": "Water collected during a storm",
      "prompt": "A rainwater tank contains \\(V(t)\\) liters, \\(t\\) hours after monitoring begins. The curve and its tangent at \\(t=4\\) are shown. Which expression gives the best estimate of the instantaneous rate of change there?",
      "choices": [
        "\\(V(4)\\)",
        "\\(\\frac{V(4)-V(0)}{4-0}\\)",
        "\\(\\frac{V(5)-V(3)}{5-3}\\)",
        "\\(\\frac{V(4.1)-V(3.9)}{4.1-3.9}\\)"
      ],
      "answer": 3,
      "hint": "An instantaneous rate is a tangent slope. Compare it with a secant through two nearby points on opposite sides of the time of interest.",
      "solution": "The nearest pair of times bracketing \\(4\\) is \\(3.9\\) and \\(4.1\\). The best estimate is \\(\\frac{V(4.1)-V(3.9)}{4.1-3.9}\\), measured in L/h. This quotient measures change in the quantity per unit time. The wider intervals describe average rates over longer periods, and \\(V(4)\\) is an amount, not a rate.",
      "topic": "1.1",
      "batch": "batch-3",
      "graph": {
        "label": "V(t) rises on 0 to 8. The solid blue curve is the quantity; the dashed maroon line is tangent at t=4.",
        "domain": [
          0,
          8
        ],
        "range": [
          0,
          300
        ],
        "branches": [
          {
            "domain": [
              0,
              8
            ],
            "coefficients": [
              0.5,
              0,
              0,
              20
            ]
          },
          {
            "domain": [
              2,
              6
            ],
            "coefficients": [
              24.0,
              -44.0
            ],
            "kind": "tangent"
          }
        ],
        "marks": [
          {
            "x": 4,
            "y": 52.0,
            "open": false
          }
        ],
        "xLabel": "t",
        "yLabel": "V(t)",
        "step": 1
      },
      "graphCaption": "Solid blue: V(t). Dashed maroon: tangent at t = 4.",
      "check": {
        "coefficients": [
          0.5,
          0,
          0,
          20
        ],
        "target": 4,
        "candidates": [
          {
            "kind": "value"
          },
          {
            "kind": "secant",
            "interval": [
              0,
              4
            ]
          },
          {
            "kind": "secant",
            "interval": [
              3,
              5
            ]
          },
          {
            "kind": "secant",
            "interval": [
              3.9,
              4.1
            ]
          }
        ],
        "tangentSlope": 24.0
      }
    },
    {
      "id": "q46",
      "family": "tangent-secant",
      "title": "Energy used by a greenhouse",
      "prompt": "A greenhouse has used \\(E(t)\\) kilowatt-hours, \\(t\\) hours after midnight. The curve and its tangent at \\(t=6\\) are shown. Which expression gives the best estimate of the instantaneous rate of change there?",
      "choices": [
        "\\(\\frac{E(6)-E(0)}{6-0}\\)",
        "\\(\\frac{E(6.2)-E(5.8)}{6.2-5.8}\\)",
        "\\(E(6)\\)",
        "\\(\\frac{E(7)-E(5)}{7-5}\\)"
      ],
      "answer": 1,
      "hint": "An instantaneous rate is a tangent slope. Compare it with a secant through two nearby points on opposite sides of the time of interest.",
      "solution": "The nearest pair of times bracketing \\(6\\) is \\(5.8\\) and \\(6.2\\). The best estimate is \\(\\frac{E(6.2)-E(5.8)}{6.2-5.8}\\), measured in kWh/h. This quotient measures change in the quantity per unit time. The wider intervals describe average rates over longer periods, and \\(E(6)\\) is an amount, not a rate.",
      "topic": "1.1",
      "batch": "batch-3",
      "graph": {
        "label": "E(t) rises on 0 to 10. The solid blue curve is the quantity; the dashed maroon line is tangent at t=6.",
        "domain": [
          0,
          10
        ],
        "range": [
          0,
          400
        ],
        "branches": [
          {
            "domain": [
              0,
              10
            ],
            "coefficients": [
              0.2,
              0,
              10,
              40
            ]
          },
          {
            "domain": [
              4,
              8
            ],
            "coefficients": [
              31.6,
              -46.400000000000006
            ],
            "kind": "tangent"
          }
        ],
        "marks": [
          {
            "x": 6,
            "y": 143.20000000000002,
            "open": false
          }
        ],
        "xLabel": "t",
        "yLabel": "E(t)",
        "step": 1
      },
      "graphCaption": "Solid blue: E(t). Dashed maroon: tangent at t = 6.",
      "check": {
        "coefficients": [
          0.2,
          0,
          10,
          40
        ],
        "target": 6,
        "candidates": [
          {
            "kind": "secant",
            "interval": [
              0,
              6
            ]
          },
          {
            "kind": "secant",
            "interval": [
              5.8,
              6.2
            ]
          },
          {
            "kind": "value"
          },
          {
            "kind": "secant",
            "interval": [
              5,
              7
            ]
          }
        ],
        "tangentSlope": 31.6
      }
    },
    {
      "id": "q47",
      "family": "tangent-secant",
      "title": "Pages indexed in an archive",
      "prompt": "An archive has indexed \\(N(t)\\) pages, \\(t\\) minutes after an indexing task begins. The curve and its tangent at \\(t=3\\) are shown. Which expression gives the best estimate of the instantaneous rate of change there?",
      "choices": [
        "\\(\\frac{N(3.05)-N(2.95)}{3.05-2.95}\\)",
        "\\(\\frac{N(4)-N(2)}{4-2}\\)",
        "\\(\\frac{N(3)-N(0)}{3-0}\\)",
        "\\(N(3)\\)"
      ],
      "answer": 0,
      "hint": "An instantaneous rate is a tangent slope. Compare it with a secant through two nearby points on opposite sides of the time of interest.",
      "solution": "The nearest pair of times bracketing \\(3\\) is \\(2.95\\) and \\(3.05\\). The best estimate is \\(\\frac{N(3.05)-N(2.95)}{3.05-2.95}\\), measured in pages/min. This quotient measures change in the quantity per unit time. The wider intervals describe average rates over longer periods, and \\(N(3)\\) is an amount, not a rate.",
      "topic": "1.1",
      "batch": "batch-3",
      "graph": {
        "label": "N(t) rises on 0 to 6. The solid blue curve is the quantity; the dashed maroon line is tangent at t=3.",
        "domain": [
          0,
          6
        ],
        "range": [
          0,
          500
        ],
        "branches": [
          {
            "domain": [
              0,
              6
            ],
            "coefficients": [
              2,
              0,
              0,
              50
            ]
          },
          {
            "domain": [
              1,
              5
            ],
            "coefficients": [
              54,
              -58
            ],
            "kind": "tangent"
          }
        ],
        "marks": [
          {
            "x": 3,
            "y": 104,
            "open": false
          }
        ],
        "xLabel": "t",
        "yLabel": "N(t)",
        "step": 1
      },
      "graphCaption": "Solid blue: N(t). Dashed maroon: tangent at t = 3.",
      "check": {
        "coefficients": [
          2,
          0,
          0,
          50
        ],
        "target": 3,
        "candidates": [
          {
            "kind": "secant",
            "interval": [
              2.95,
              3.05
            ]
          },
          {
            "kind": "secant",
            "interval": [
              2,
              4
            ]
          },
          {
            "kind": "secant",
            "interval": [
              0,
              3
            ]
          },
          {
            "kind": "value"
          }
        ],
        "tangentSlope": 54
      }
    },
    {
      "id": "q48",
      "family": "tangent-secant",
      "title": "Admissions scanned at a museum",
      "prompt": "A museum has scanned \\(C(t)\\) admissions, \\(t\\) minutes after opening. The curve and its tangent at \\(t=5\\) are shown. Which expression gives the best estimate of the instantaneous rate of change there?",
      "choices": [
        "\\(\\frac{C(6)-C(4)}{6-4}\\)",
        "\\(C(5)\\)",
        "\\(\\frac{C(5.1)-C(4.9)}{5.1-4.9}\\)",
        "\\(\\frac{C(5)-C(0)}{5-0}\\)"
      ],
      "answer": 2,
      "hint": "An instantaneous rate is a tangent slope. Compare it with a secant through two nearby points on opposite sides of the time of interest.",
      "solution": "The nearest pair of times bracketing \\(5\\) is \\(4.9\\) and \\(5.1\\). The best estimate is \\(\\frac{C(5.1)-C(4.9)}{5.1-4.9}\\), measured in admissions/min. This quotient measures change in the quantity per unit time. The wider intervals describe average rates over longer periods, and \\(C(5)\\) is an amount, not a rate.",
      "topic": "1.1",
      "batch": "batch-3",
      "graph": {
        "label": "C(t) rises on 0 to 10. The solid blue curve is the quantity; the dashed maroon line is tangent at t=5.",
        "domain": [
          0,
          10
        ],
        "range": [
          0,
          1000
        ],
        "branches": [
          {
            "domain": [
              0,
              10
            ],
            "coefficients": [
              -0.25,
              12,
              0,
              20
            ]
          },
          {
            "domain": [
              3,
              7
            ],
            "coefficients": [
              101.25,
              -217.5
            ],
            "kind": "tangent"
          }
        ],
        "marks": [
          {
            "x": 5,
            "y": 288.75,
            "open": false
          }
        ],
        "xLabel": "t",
        "yLabel": "C(t)",
        "step": 1
      },
      "graphCaption": "Solid blue: C(t). Dashed maroon: tangent at t = 5.",
      "check": {
        "coefficients": [
          -0.25,
          12,
          0,
          20
        ],
        "target": 5,
        "candidates": [
          {
            "kind": "secant",
            "interval": [
              4,
              6
            ]
          },
          {
            "kind": "value"
          },
          {
            "kind": "secant",
            "interval": [
              4.9,
              5.1
            ]
          },
          {
            "kind": "secant",
            "interval": [
              0,
              5
            ]
          }
        ],
        "tangentSlope": 101.25
      }
    },
    {
      "id": "q49",
      "family": "segment-speed",
      "title": "An inspection robot on a rail",
      "prompt": "An inspection robot moves along a straight rail. Its position \\(x(t)\\) is measured in meters and time in seconds. The graph consists of line segments. What is the speed at \\(t=3\\) seconds?",
      "choices": [
        "\\(0\\) m/s",
        "\\(12\\) m/s",
        "\\(6\\) m/s",
        "\\(-6\\) m/s"
      ],
      "answer": 2,
      "hint": "Locate the straight segment containing the requested time. Its slope is velocity; speed is the absolute value of that slope.",
      "solution": "The requested time lies on the segment joining \\((0,18)\\) and \\((5,48)\\). Its slope is \\(\\frac{48-18}{5-0}=6.0\\) m/s. Speed is the magnitude, \\(|6.0|=6.0\\) m/s. Dividing the position by the time ignores the starting position; a negative velocity still gives a positive speed.",
      "topic": "1.1",
      "batch": "batch-3",
      "graph": {
        "label": "Position versus time is piecewise linear through [[0, 18], [5, 48], [8, 48], [12, 24]].",
        "domain": [
          0,
          12
        ],
        "range": [
          0,
          50
        ],
        "branches": [
          {
            "points": [
              [
                0,
                18
              ],
              [
                5,
                48
              ],
              [
                8,
                48
              ],
              [
                12,
                24
              ]
            ]
          }
        ],
        "marks": [],
        "xLabel": "t (s)",
        "yLabel": "position",
        "step": 2
      },
      "graphCaption": "Height or position is on the vertical axis; time in seconds is on the horizontal axis.",
      "check": {
        "target": 3,
        "speed": 6.0,
        "values": [
          0,
          12,
          6,
          -6
        ]
      }
    },
    {
      "id": "q50",
      "family": "segment-speed",
      "title": "A stage curtain changes height",
      "prompt": "A stage curtain moves vertically. Its height \\(h(t)\\) is measured in feet and time in seconds. The graph consists of line segments. What is the speed at \\(t=4\\) seconds?",
      "choices": [
        "\\(0\\) ft/s",
        "\\(3.5\\) ft/s",
        "\\(4\\) ft/s",
        "\\(2.5\\) ft/s"
      ],
      "answer": 3,
      "hint": "Locate the straight segment containing the requested time. Its slope is velocity; speed is the absolute value of that slope.",
      "solution": "The requested time lies on the segment joining \\((0,4)\\) and \\((6,19)\\). Its slope is \\(\\frac{19-4}{6-0}=2.5\\) ft/s. Speed is the magnitude, \\(|2.5|=2.5\\) ft/s. Dividing the position by the time ignores the starting position; a negative velocity still gives a positive speed.",
      "topic": "1.1",
      "batch": "batch-3",
      "graph": {
        "label": "Position versus time is piecewise linear through [[0, 4], [6, 19], [9, 19], [12, 7]].",
        "domain": [
          0,
          12
        ],
        "range": [
          0,
          20
        ],
        "branches": [
          {
            "points": [
              [
                0,
                4
              ],
              [
                6,
                19
              ],
              [
                9,
                19
              ],
              [
                12,
                7
              ]
            ]
          }
        ],
        "marks": [],
        "xLabel": "t (s)",
        "yLabel": "position",
        "step": 2
      },
      "graphCaption": "Height or position is on the vertical axis; time in seconds is on the horizontal axis.",
      "check": {
        "target": 4,
        "speed": 2.5,
        "values": [
          0,
          3.5,
          4,
          2.5
        ]
      }
    },
    {
      "id": "q51",
      "family": "segment-speed",
      "title": "A cart returns toward a station",
      "prompt": "A cart travels along a straight track. Its signed position \\(x(t)\\) is measured in meters relative to a station, and time in seconds. The graph consists of line segments. What is the speed at \\(t=2\\) seconds?",
      "choices": [
        "\\(0\\) m/s",
        "\\(-7\\) m/s",
        "\\(7\\) m/s",
        "\\(14\\) m/s"
      ],
      "answer": 2,
      "hint": "Locate the straight segment containing the requested time. Its slope is velocity; speed is the absolute value of that slope.",
      "solution": "The requested time lies on the segment joining \\((0,42)\\) and \\((4,14)\\). Its slope is \\(\\frac{14-42}{4-0}=-7.0\\) m/s. Speed is the magnitude, \\(|-7.0|=7.0\\) m/s. Dividing the position by the time ignores the starting position; a negative velocity still gives a positive speed.",
      "topic": "1.1",
      "batch": "batch-3",
      "graph": {
        "label": "Position versus time is piecewise linear through [[0, 42], [4, 14], [7, 14], [10, 35]].",
        "domain": [
          0,
          10
        ],
        "range": [
          0,
          50
        ],
        "branches": [
          {
            "points": [
              [
                0,
                42
              ],
              [
                4,
                14
              ],
              [
                7,
                14
              ],
              [
                10,
                35
              ]
            ]
          }
        ],
        "marks": [],
        "xLabel": "t (s)",
        "yLabel": "position",
        "step": 2
      },
      "graphCaption": "Height or position is on the vertical axis; time in seconds is on the horizontal axis.",
      "check": {
        "target": 2,
        "speed": 7.0,
        "values": [
          0,
          -7,
          7,
          14
        ]
      }
    },
    {
      "id": "q52",
      "family": "segment-speed",
      "title": "A platform lowers a load",
      "prompt": "A lifting platform moves vertically. Its height \\(h(t)\\) is measured in meters and time in seconds. The graph consists of line segments. What is the speed at \\(t=6\\) seconds?",
      "choices": [
        "\\(-1.5\\) m/s",
        "\\(1.5\\) m/s",
        "\\(3.5\\) m/s",
        "\\(4\\) m/s"
      ],
      "answer": 1,
      "hint": "Locate the straight segment containing the requested time. Its slope is velocity; speed is the absolute value of that slope.",
      "solution": "The requested time lies on the segment joining \\((0,30)\\) and \\((8,18)\\). Its slope is \\(\\frac{18-30}{8-0}=-1.5\\) m/s. Speed is the magnitude, \\(|-1.5|=1.5\\) m/s. Dividing the position by the time ignores the starting position; a negative velocity still gives a positive speed.",
      "topic": "1.1",
      "batch": "batch-3",
      "graph": {
        "label": "Position versus time is piecewise linear through [[0, 30], [8, 18], [10, 18], [12, 26]].",
        "domain": [
          0,
          12
        ],
        "range": [
          0,
          30
        ],
        "branches": [
          {
            "points": [
              [
                0,
                30
              ],
              [
                8,
                18
              ],
              [
                10,
                18
              ],
              [
                12,
                26
              ]
            ]
          }
        ],
        "marks": [],
        "xLabel": "t (s)",
        "yLabel": "position",
        "step": 2
      },
      "graphCaption": "Height or position is on the vertical axis; time in seconds is on the horizontal axis.",
      "check": {
        "target": 6,
        "speed": 1.5,
        "values": [
          -1.5,
          1.5,
          3.5,
          4
        ]
      }
    },
    {
      "id": "q53",
      "family": "quadratic-secant",
      "title": "A shuttle approaches a terminal",
      "prompt": "A shuttle moves along a straight guideway. Its position \\(s(t)\\) in meters is a nonlinear quadratic function of time \\(t\\) in seconds. For \\(0\\le t\\le 14\\), which expression gives the best estimate of velocity at \\(t=5\\)?",
      "choices": [
        "\\(s(5)\\)",
        "\\(\\frac{s(5)}{5}\\)",
        "\\(\\frac{s(9)-s(3)}{9-3}\\)",
        "\\(\\frac{s(6)-s(4)}{6-4}\\)"
      ],
      "answer": 3,
      "hint": "Use change in position divided by change in time. For a quadratic, the secant through equally spaced times on either side gives the tangent slope at the midpoint.",
      "solution": "The interval from \\(4\\) to \\(6\\) is centered at \\(5\\), so \\(\\frac{s(6)-s(4)}{6-4}\\) gives the velocity in position units per second. In fact this centered quotient is exact for a quadratic. The other secant is centered at \\(6.0\\), and the remaining choices are a position or a quotient that does not subtract the starting position.",
      "topic": "1.1",
      "batch": "batch-3",
      "check": {
        "target": 5,
        "coefficients": [
          2,
          3,
          5
        ],
        "candidates": [
          {
            "kind": "value"
          },
          {
            "kind": "ratio"
          },
          {
            "kind": "secant",
            "interval": [
              3,
              9
            ]
          },
          {
            "kind": "secant",
            "interval": [
              4,
              6
            ]
          }
        ]
      }
    },
    {
      "id": "q54",
      "family": "quadratic-secant",
      "title": "A robotic arm slides along a bench",
      "prompt": "The horizontal position \\(p(t)\\) of a robotic arm, in centimeters, is a nonlinear quadratic function of time \\(t\\) in seconds. For \\(0\\le t\\le 16\\), which expression gives the best estimate of velocity at \\(t=9\\)?",
      "choices": [
        "\\(\\frac{p(9.5)-p(8.5)}{9.5-8.5}\\)",
        "\\(p(9)\\)",
        "\\(\\frac{p(13)-p(3)}{13-3}\\)",
        "\\(\\frac{p(9)}{9}\\)"
      ],
      "answer": 0,
      "hint": "Use change in position divided by change in time. For a quadratic, the secant through equally spaced times on either side gives the tangent slope at the midpoint.",
      "solution": "The interval from \\(8.5\\) to \\(9.5\\) is centered at \\(9\\), so \\(\\frac{p(9.5)-p(8.5)}{9.5-8.5}\\) gives the velocity in position units per second. In fact this centered quotient is exact for a quadratic. The other secant is centered at \\(8.0\\), and the remaining choices are a position or a quotient that does not subtract the starting position.",
      "topic": "1.1",
      "batch": "batch-3",
      "check": {
        "target": 9,
        "coefficients": [
          2,
          3,
          5
        ],
        "candidates": [
          {
            "kind": "secant",
            "interval": [
              8.5,
              9.5
            ]
          },
          {
            "kind": "value"
          },
          {
            "kind": "secant",
            "interval": [
              3,
              13
            ]
          },
          {
            "kind": "ratio"
          }
        ]
      }
    },
    {
      "id": "q55",
      "family": "quadratic-secant",
      "title": "Two valid measurements of velocity",
      "prompt": "A test vehicle has a nonlinear quadratic position model \\(s(t)\\). For a quadratic, a secant slope equals the tangent slope at the midpoint of its time interval. Which statement correctly identifies expressions for the velocity at \\(t=6\\)? Let \\(A=\\frac{s(8)-s(4)}{8-4}\\) and \\(B=\\frac{s(7)-s(5)}{7-5}\\).",
      "choices": [
        "Only A is exact.",
        "Only B is exact.",
        "Both A and B are exact.",
        "Neither A nor B is exact."
      ],
      "answer": 2,
      "hint": "Find the midpoint of each interval. A shorter interval is not automatically more accurate when the model is quadratic.",
      "solution": "Both intervals have midpoint \\(6\\): \\((8+4)/2=6\\) and \\((7+5)/2=6\\). Therefore both slopes equal the instantaneous velocity at that time. For \\(s(t)=at^2+bt+c\\), direct expansion gives \\(\\frac{s(t+h)-s(t-h)}{2h}=2at+b\\), independently of the nonzero spacing \\(h\\). Choosing only the narrower interval would miss this exact equality.",
      "topic": "1.1",
      "batch": "batch-3",
      "check": {
        "target": 6,
        "coefficients": [
          2,
          3,
          5
        ],
        "intervals": [
          [
            4,
            8
          ],
          [
            5,
            7
          ]
        ],
        "mode": "both"
      }
    },
    {
      "id": "q56",
      "family": "quadratic-secant",
      "title": "Centered versus merely close",
      "prompt": "A camera dolly has a nonlinear quadratic position model \\(d(t)\\). For this model, a secant slope equals the tangent slope at its interval midpoint. Which quotient gives the exact velocity at \\(t=7\\) seconds?",
      "choices": [
        "\\(\\frac{d(7.3)-d(6.9)}{7.3-6.9}\\)",
        "\\(\\frac{d(12)-d(2)}{12-2}\\)",
        "\\(\\frac{d(7)-d(6)}{7-6}\\)",
        "\\(\\frac{d(7)}7\\)"
      ],
      "answer": 1,
      "hint": "Check the midpoint of each interval, even when its endpoints look very close to the target time.",
      "solution": "The interval \\([2,12]\\) has midpoint \\((2+12)/2=7\\), so \\(\\frac{d(12)-d(2)}{12-2}\\) gives the exact velocity. The closer interval \\([6.9,7.3]\\) has midpoint \\(7.1\\) and therefore gives the velocity at a different time. The interval \\([6,7]\\) has midpoint \\(6.5\\). For a nonlinear quadratic, different midpoints have different tangent slopes.",
      "topic": "1.1",
      "batch": "batch-3",
      "check": {
        "target": 7,
        "coefficients": [
          2,
          3,
          5
        ],
        "candidates": [
          {
            "kind": "secant",
            "interval": [
              6.9,
              7.3
            ]
          },
          {
            "kind": "secant",
            "interval": [
              2,
              12
            ]
          },
          {
            "kind": "secant",
            "interval": [
              6,
              7
            ]
          },
          {
            "kind": "ratio"
          }
        ]
      }
    }
  ],
  "scopeReview": {
    "batch": "batch-2",
    "allowedTopics": [
      "1.1",
      "1.2",
      "1.3",
      "1.4",
      "1.5",
      "1.6"
    ],
    "includedReferenceTypes": 10,
    "addedQuestionIds": [
      "q25",
      "q26",
      "q27",
      "q28",
      "q29",
      "q30",
      "q31",
      "q32",
      "q33",
      "q34",
      "q35",
      "q36",
      "q37",
      "q38",
      "q39",
      "q40",
      "q41",
      "q42",
      "q43",
      "q44"
    ],
    "excludedReferenceTypes": [
      {
        "reference": "Second set, questions 4–6",
        "topic": "1.8",
        "reason": "Squeeze theorem: statement, algebraic bounds, and graph selection."
      },
      {
        "reference": "Second set, question 7",
        "topic": "1.9",
        "reason": "Matching a numerical table to alternative graphs across representations."
      }
    ],
    "framework": "https://apcentral.collegeboard.org/media/pdf/ap-calculus-ab-and-bc-course-and-exam-description.pdf",
    "notes": "Composite limits belong to Topic 1.5, LIM-1.D.2. Stable existing question IDs and storage revision are preserved."
  },
  "frqs": [
    {
      "id": "frq01",
      "title": "Calibration signals near a reset",
      "batch": "batch-3",
      "prompt": "Two calibration signals f and g are measured in volts. The input x is time in seconds relative to a reference event. Use the graph of f and the table for g. Assume g has a finite limit and an instantaneous rate of change at \\(x=0\\). Show your reasoning; plain-text notation such as lim x->0 is accepted.",
      "graph": {
        "label": "Graph of f: the left and right limits at 0 are 3. At 1 the left branch ends at a filled point (1,2) and the right branch starts at an open point (1,0). Both branches approach an open point (2,1), with a separate filled point (2,4). The branches meet at (4,-1). There is an open point (-2,2) and a filled point (-2,5).",
        "domain": [
          -4,
          7
        ],
        "range": [
          -3,
          7
        ],
        "branches": [
          {
            "domain": [
              -4,
              -2
            ],
            "coefficients": [
              1,
              4
            ]
          },
          {
            "domain": [
              -2,
              0
            ],
            "coefficients": [
              0.5,
              3
            ]
          },
          {
            "domain": [
              0,
              1
            ],
            "coefficients": [
              -1,
              3
            ]
          },
          {
            "domain": [
              1,
              2
            ],
            "coefficients": [
              1,
              -1
            ]
          },
          {
            "domain": [
              2,
              4
            ],
            "coefficients": [
              -1,
              3
            ]
          },
          {
            "domain": [
              4,
              7
            ],
            "coefficients": [
              0.5,
              -4,
              7
            ]
          }
        ],
        "marks": [
          {
            "x": -2,
            "y": 2,
            "open": true
          },
          {
            "x": -2,
            "y": 5,
            "open": false
          },
          {
            "x": 1,
            "y": 2,
            "open": false
          },
          {
            "x": 1,
            "y": 0,
            "open": true
          },
          {
            "x": 2,
            "y": 1,
            "open": true
          },
          {
            "x": 2,
            "y": 4,
            "open": false
          }
        ],
        "xLabel": "x (s)",
        "yLabel": "f(x)",
        "step": 1
      },
      "table": {
        "caption": "Selected values of g near x = 0; outputs in volts",
        "headers": [
          "x (s)",
          "-0.2",
          "-0.02",
          "-0.002",
          "0.002",
          "0.02",
          "0.2"
        ],
        "rows": [
          [
            "g(x) (V)",
            "4.88",
            "4.988",
            "4.9988",
            "5.0012",
            "5.012",
            "5.12"
          ]
        ]
      },
      "parts": [
        {
          "id": "a",
          "topic": "1.5",
          "prompt": "Use the graph and table to estimate \\(\\lim_{x\\to 0}(f(x)-g(x))\\). Show the separate limiting values and the limit law used.",
          "hint": "Read the value approached by f from both sides, estimate the value approached by g, then combine them using the indicated operation.",
          "solution": "\\(\\lim_{x\\to 0}f(x)=3\\) from the graph. The table suggests \\(\\lim_{x\\to 0}g(x)\\approx 5\\). The difference law gives \\(\\lim_{x\\to 0}(f(x)-g(x))\\approx 3-5=-2\\). This is an estimate based on sampled values of g, not a proof of its exact limit.",
          "rubric": [
            "1 point: correctly identifies the graphical limit of f and the estimated limit of g.",
            "1 point: applies the appropriate limit law and reports the resulting estimate."
          ]
        },
        {
          "id": "b",
          "topic": "1.3",
          "prompt": "For each of \\(a=1\\), \\(a=2\\), \\(a=4\\), find \\(\\lim_{x\\to a}f(x)\\) or explain why it does not exist. Give one-sided limits when needed.",
          "hint": "Trace each branch toward the target without jumping to an isolated filled point. A two-sided limit exists only if the two one-sided limits agree.",
          "solution": "\\(\\lim_{x\\to 1^-}f(x)=2\\) and \\(\\lim_{x\\to 1^+}f(x)=0\\) are unequal, so the two-sided limit there does not exist. At \\(a=2\\), both sides approach \\(1\\), so the limit is \\(1\\), regardless of the separate filled point. At \\(a=4\\), both sides approach \\(-1\\), so the limit is \\(-1\\).",
          "rubric": [
            "1 point: states both correct one-sided limits at the first target.",
            "1 point: concludes that the first two-sided limit does not exist because those values differ.",
            "1 point: gives the limit at the second target with agreement from both sides.",
            "1 point: gives the limit at the third target with agreement from both sides."
          ]
        },
        {
          "id": "c",
          "topic": "1.1",
          "prompt": "Write a difference quotient using the table that best estimates the instantaneous rate of change of g at \\(x=0\\). Evaluate it and include units.",
          "hint": "Use the nearest sampled inputs on opposite sides of the target. Divide the change in voltage by the change in time.",
          "solution": "The nearest inputs bracketing \\(0\\) are \\(-0.002\\) and \\(0.002\\). Use \\(\\frac{g(0.002)-g(-0.002)}{0.002-(-0.002)}\\) = \\(\\frac{5.0012-4.9988}{0.002-(-0.002)}=0.6\\) volts per second. This is a local secant estimate of the instantaneous rate; the finite table does not establish the exact rate.",
          "rubric": [
            "1 point: writes the correct difference quotient using the closest bracketing inputs.",
            "1 point: evaluates the quotient correctly and gives volts per second."
          ]
        }
      ],
      "check": {
        "target": 0,
        "fLimit": 3,
        "gEstimate": 5,
        "scale": 1,
        "operation": "difference",
        "result": -2,
        "targets": [
          1,
          2,
          4
        ],
        "oneSided": [
          2,
          0
        ],
        "limits": [
          null,
          1,
          -1
        ],
        "rate": 0.6
      }
    },
    {
      "id": "frq02",
      "title": "Comparing two sensor outputs",
      "batch": "batch-3",
      "prompt": "Two calibration signals f and g are measured in volts. The input x is time in seconds relative to a reference event. Use the graph of f and the table for g. Assume g has a finite limit and an instantaneous rate of change at \\(x=1\\). Show your reasoning; plain-text notation such as lim x->0 is accepted.",
      "graph": {
        "label": "Graph of f: both sides approach -1 at x=1. At x=2 the left limit is 0 and the right limit is 2. Both sides approach the open point (3,1), with a filled point (3,-2). The branches meet at (5,3). There is an open point (-1,0) and a filled point (-1,-3).",
        "domain": [
          -3,
          8
        ],
        "range": [
          -5,
          5
        ],
        "branches": [
          {
            "domain": [
              -3,
              -1
            ],
            "coefficients": [
              -1,
              -1
            ]
          },
          {
            "domain": [
              -1,
              1
            ],
            "coefficients": [
              -0.5,
              -0.5
            ]
          },
          {
            "domain": [
              1,
              2
            ],
            "coefficients": [
              1,
              -2
            ]
          },
          {
            "domain": [
              2,
              3
            ],
            "coefficients": [
              -1,
              4
            ]
          },
          {
            "domain": [
              3,
              5
            ],
            "coefficients": [
              1,
              -2
            ]
          },
          {
            "domain": [
              5,
              8
            ],
            "coefficients": [
              -0.5,
              5.0,
              -9.5
            ]
          }
        ],
        "marks": [
          {
            "x": -1,
            "y": 0,
            "open": true
          },
          {
            "x": -1,
            "y": -3,
            "open": false
          },
          {
            "x": 2,
            "y": 0,
            "open": false
          },
          {
            "x": 2,
            "y": 2,
            "open": true
          },
          {
            "x": 3,
            "y": 1,
            "open": true
          },
          {
            "x": 3,
            "y": -2,
            "open": false
          }
        ],
        "xLabel": "x (s)",
        "yLabel": "f(x)",
        "step": 1
      },
      "table": {
        "caption": "Selected values of g near x = 1; outputs in volts",
        "headers": [
          "x (s)",
          "0.8",
          "0.98",
          "0.998",
          "1.002",
          "1.02",
          "1.2"
        ],
        "rows": [
          [
            "g(x) (V)",
            "4.28",
            "4.028",
            "4.0028",
            "3.9972",
            "3.972",
            "3.72"
          ]
        ]
      },
      "parts": [
        {
          "id": "a",
          "topic": "1.5",
          "prompt": "Use the graph and table to estimate \\(\\lim_{x\\to 1}(2f(x)+g(x))\\). Show the separate limiting values and the limit law used.",
          "hint": "Read the value approached by f from both sides, estimate the value approached by g, then combine them using the indicated operation.",
          "solution": "\\(\\lim_{x\\to 1}f(x)=-1\\) from the graph. The table suggests \\(\\lim_{x\\to 1}g(x)\\approx 4\\). The constant-multiple and sum law gives \\(\\lim_{x\\to 1}(2f(x)+g(x))\\approx 2(-1)+4=2\\). This is an estimate based on sampled values of g, not a proof of its exact limit.",
          "rubric": [
            "1 point: correctly identifies the graphical limit of f and the estimated limit of g.",
            "1 point: applies the appropriate limit law and reports the resulting estimate."
          ]
        },
        {
          "id": "b",
          "topic": "1.3",
          "prompt": "For each of \\(a=2\\), \\(a=3\\), \\(a=5\\), find \\(\\lim_{x\\to a}f(x)\\) or explain why it does not exist. Give one-sided limits when needed.",
          "hint": "Trace each branch toward the target without jumping to an isolated filled point. A two-sided limit exists only if the two one-sided limits agree.",
          "solution": "\\(\\lim_{x\\to 2^-}f(x)=0\\) and \\(\\lim_{x\\to 2^+}f(x)=2\\) are unequal, so the two-sided limit there does not exist. At \\(a=3\\), both sides approach \\(1\\), so the limit is \\(1\\), regardless of the separate filled point. At \\(a=5\\), both sides approach \\(3\\), so the limit is \\(3\\).",
          "rubric": [
            "1 point: states both correct one-sided limits at the first target.",
            "1 point: concludes that the first two-sided limit does not exist because those values differ.",
            "1 point: gives the limit at the second target with agreement from both sides.",
            "1 point: gives the limit at the third target with agreement from both sides."
          ]
        },
        {
          "id": "c",
          "topic": "1.1",
          "prompt": "Write a difference quotient using the table that best estimates the instantaneous rate of change of g at \\(x=1\\). Evaluate it and include units.",
          "hint": "Use the nearest sampled inputs on opposite sides of the target. Divide the change in voltage by the change in time.",
          "solution": "The nearest inputs bracketing \\(1\\) are \\(0.998\\) and \\(1.002\\). Use \\(\\frac{g(1.002)-g(0.998)}{1.002-0.998}\\) = \\(\\frac{3.9972-4.0028}{1.002-0.998}=-1.4\\) volts per second. This is a local secant estimate of the instantaneous rate; the finite table does not establish the exact rate.",
          "rubric": [
            "1 point: writes the correct difference quotient using the closest bracketing inputs.",
            "1 point: evaluates the quotient correctly and gives volts per second."
          ]
        }
      ],
      "check": {
        "target": 1,
        "fLimit": -1,
        "gEstimate": 4,
        "scale": 2,
        "operation": "sum",
        "result": 2,
        "targets": [
          2,
          3,
          5
        ],
        "oneSided": [
          0,
          2
        ],
        "limits": [
          null,
          1,
          3
        ],
        "rate": -1.4
      }
    }
  ],
  "scopeReviewBatch3": {
    "batch": "batch-3",
    "allowedTopics": [
      "1.1",
      "1.2",
      "1.3",
      "1.4",
      "1.5",
      "1.6"
    ],
    "addedQuestionIds": [
      "q45",
      "q46",
      "q47",
      "q48",
      "q49",
      "q50",
      "q51",
      "q52",
      "q53",
      "q54",
      "q55",
      "q56"
    ],
    "addedFrqIds": [
      "frq01",
      "frq02"
    ],
    "excludedReferenceTypes": [
      {
        "reference": "Third set, question 9",
        "topic": "1.9",
        "reason": "Combining the table and graph of one function as the primary skill."
      },
      {
        "reference": "Third set, written response part (b), x=6",
        "topic": "1.14",
        "reason": "Infinite limits and vertical asymptotes."
      },
      {
        "reference": "Third set, written response part (c)",
        "topic": "1.11",
        "reason": "Determining continuity at a point."
      }
    ],
    "notes": "Retained written-response limit laws (1.5), finite graphical limits (1.3), and local difference quotients (1.1). The table supplies numerical estimates, not proof. Repaired the source quadratic question at t=6: both centered intervals yield the exact velocity, so choosing only the shorter interval would be ambiguous.",
    "framework": "https://apcentral.collegeboard.org/media/pdf/ap-calculus-ab-and-bc-course-and-exam-description.pdf"
  }
};
  if(typeof module==="object"&&module.exports)module.exports=data;
  else root.ECHSMidunitQuestions=data;
})(typeof window==="undefined"?globalThis:window);
