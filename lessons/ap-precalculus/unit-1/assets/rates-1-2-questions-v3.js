/* Original ECHS AP Precalculus Topic 1.2 practice. */
(function(root){const data={
  "revision": "ap-precalculus-topic-1-2-v3",
  "questions": [
    {
      "id": "q01",
      "type": "number",
      "group": "Learning check",
      "prompt": "A tank contains 820 L at minute 2 and 910 L at minute 5. Find the net change in volume from minute 2 to minute 5.",
      "answer": 90,
      "unit": "L",
      "hint": "Subtract final volume minus initial volume.",
      "solution": "\\(910-820=90\\) L. This is an amount of change, not a rate.",
      "ek": "1.2.A.1",
      "calculator": false
    },
    {
      "id": "q02",
      "type": "number",
      "group": "Learning check",
      "prompt": "Using the same tank values, find the average rate of change in volume on [2,5].",
      "answer": 30,
      "unit": "L/min",
      "hint": "Divide the volume change by the elapsed time.",
      "solution": "\\(\\frac{910-820}{5-2}=\\frac{90}{3}=30\\) L/min.",
      "ek": "1.2.A.1",
      "calculator": false
    },
    {
      "id": "q03",
      "type": "mcq",
      "group": "Learning check",
      "prompt": "If C(q) is cost in QAR and q is a number of items, what are the units of the average rate of C with respect to q?",
      "choices": [
        "Items per QAR.",
        "QAR.",
        "QAR per item.",
        "QAR multiplied by items."
      ],
      "answer": 2,
      "hint": "Read the quotient from numerator to denominator.",
      "solution": "The units are output units per input unit: QAR per item.",
      "ek": "1.2.B.1",
      "calculator": false
    },
    {
      "id": "q04",
      "type": "mcq",
      "group": "Learning check",
      "prompt": "For two distinct inputs a and b, which statement about \\(\\frac{f(b)-f(a)}{b-a}\\) is correct?",
      "choices": [
        "Reversing only the numerator keeps its value.",
        "Reversing both numerator and denominator keeps its value.",
        "It is the average of f(a) and f(b).",
        "It is always positive."
      ],
      "answer": 1,
      "hint": "Track both changes in sign.",
      "solution": "Reversing both subtractions multiplies numerator and denominator by −1. Their ratio is unchanged.",
      "ek": "1.2.A.1",
      "calculator": false
    },
    {
      "id": "q05",
      "type": "mcq",
      "group": "Learning check",
      "prompt": "The average rate of a function on [1,5] is zero. What must be true?",
      "choices": [
        "The function is constant on [1,5].",
        "All output values equal zero.",
        "Every rate at a point equals zero.",
        "The outputs f(1) and f(5) are equal."
      ],
      "answer": 3,
      "hint": "A zero quotient with a nonzero denominator has zero numerator.",
      "solution": "\\(f(5)-f(1)=0\\), so the endpoint outputs agree. Interior behavior is not determined.",
      "ek": "1.2.A.1",
      "calculator": false
    },
    {
      "id": "q06",
      "type": "number",
      "group": "Learning check",
      "prompt": "<div class=\"table-wrap\"><table><caption>Selected nearby values.</caption><tbody><tr><th scope=\"row\">x</th><td>1.9</td><td>2</td><td>2.1</td></tr><tr><th scope=\"row\">f(x)</th><td>3.61</td><td>4</td><td>4.41</td></tr></tbody></table></div>Find the average rate on [1.9,2.1] to use as an estimate near x = 2.",
      "answer": 4,
      "unit": "output units per input unit",
      "hint": "Use both endpoints and the full interval width 0.2.",
      "solution": "\\(\\frac{4.41-3.61}{2.1-1.9}=4\\). This small-interval average supports a local estimate, not a proof of an exact point rate.",
      "ek": "1.2.A.2",
      "calculator": false
    },
    {
      "id": "q07",
      "type": "mcq",
      "group": "Learning check",
      "prompt": "Two estimated rates are −5 and −2. Which statement is correct?",
      "choices": [
        "−2 is the greater signed rate; −5 has greater magnitude.",
        "−5 is the greater signed rate.",
        "−2 has greater magnitude.",
        "Both rates describe increasing output as input increases."
      ],
      "answer": 0,
      "hint": "Place the rates on a number line, then compare their absolute values.",
      "solution": "−2 > −5, while |−5| > |−2|. A more negative rate corresponds to a faster decrease per input unit.",
      "ek": "1.2.B.3",
      "calculator": false
    },
    {
      "id": "q08",
      "type": "number",
      "group": "Learning check",
      "prompt": "<div class=\"table-wrap\"><table><caption>Displayed outputs have been rounded to one decimal place.</caption><tbody><tr><th scope=\"row\">x</th><td>1.99</td><td>2.01</td></tr><tr><th scope=\"row\">f(x)</th><td>5.1</td><td>5.1</td></tr></tbody></table></div>Compute the average rate from these displayed values.",
      "answer": 0,
      "unit": "output units per input unit",
      "hint": "Compute the quotient from the displayed numbers; do not infer an exact point rate.",
      "solution": "\\((5.1-5.1)/0.02=0\\). Rounding may conceal a small actual output change.",
      "ek": "1.2.A.2",
      "calculator": false
    },
    {
      "id": "ap01",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "<div class=\"table-wrap\"><table><caption>Selected measurements of tank volume.</caption><tbody><tr><th scope=\"row\">t (min)</th><td>0</td><td>2</td><td>5</td><td>8</td></tr><tr><th scope=\"row\">V(t) (L)</th><td>720</td><td>820</td><td>910</td><td>850</td></tr></tbody></table></div>What is the average rate of change of V on [2,5]?",
      "choices": [
        "\\(90\\)",
        "\\(30\\)",
        "\\(18\\)",
        "\\(1/30\\)"
      ],
      "answer": 1,
      "hint": "Use only the endpoints of the requested interval.",
      "solution": "\\((910-820)/(5-2)=30\\) L/min.",
      "ek": "1.2.A.1",
      "calculator": false
    },
    {
      "id": "ap02",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "The average rate of tank volume from minute 5 to minute 8 is −20 L/min. Which interpretation is justified?",
      "choices": [
        "The tank contained −20 L at minute 8.",
        "The volume decreased by exactly 20 L during each of the three minutes.",
        "The volume fell by 20 L in total.",
        "The volume decreased by 60 L overall, an average decrease of 20 L per minute."
      ],
      "answer": 3,
      "hint": "Multiply the average rate by the interval length.",
      "solution": "The net change is (−20)(8−5) = −60 L. The average does not specify each minute’s change.",
      "ek": "1.2.B.1",
      "calculator": false
    },
    {
      "id": "ap03",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "<figure><div data-rates-plot=\"reader\"></div><figcaption>Line segments connect the labeled points and define f on the entire domain [−2,6].</figcaption></figure>What is the average rate of f on [0,4]?",
      "choices": [
        "\\(1\\)",
        "\\(-4\\)",
        "\\(-1\\)",
        "\\(0\\)"
      ],
      "answer": 2,
      "hint": "Read f(0) and f(4) before forming the quotient.",
      "solution": "\\(\\frac{f(4)-f(0)}{4-0}=\\frac{-3-1}{4}=-1\\).",
      "ek": "1.2.A.1",
      "calculator": false
    },
    {
      "id": "ap04",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Let \\(q(x)=x^2-3x+2\\). Find its average rate of change on [1,4].",
      "choices": [
        "\\(2\\)",
        "\\(6\\)",
        "\\(3\\)",
        "\\(7\\)"
      ],
      "answer": 0,
      "hint": "Evaluate the function at 1 and 4 first.",
      "solution": "\\(q(1)=0,\\ q(4)=6\\), so the average rate is \\((6-0)/(4-1)=2\\).",
      "ek": "1.2.A.1",
      "calculator": false
    },
    {
      "id": "ap05",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "For a function f, \\(\\frac{f(5)-f(1)}{5-1}=0\\). Which conclusion follows?",
      "choices": [
        "The graph is horizontal throughout [1,5].",
        "f(5) = f(1).",
        "f(3) = 0.",
        "The rate at x = 3 is zero."
      ],
      "answer": 1,
      "hint": "This is a statement about the two endpoint values.",
      "solution": "The denominator is 4, so f(5)−f(1)=0. The equation does not determine the intervening graph.",
      "ek": "1.2.A.1",
      "calculator": false
    },
    {
      "id": "ap06",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "A plant’s height H(t), in centimeters, is recorded t days after planting. What does an average rate of 1.4 on [2,7] mean?",
      "choices": [
        "From day 2 to day 7, height increased by an average of 1.4 cm per day.",
        "The plant was 1.4 cm tall on day 7.",
        "The plant grew for 1.4 days.",
        "The height grew at exactly 1.4 cm per day at every moment."
      ],
      "answer": 0,
      "hint": "Include both the interval and output units per input unit.",
      "solution": "The net height increase was (1.4)(7−2)=7 cm over those five days. The daily and local rates need not be constant.",
      "ek": "1.2.B.1",
      "calculator": false
    },
    {
      "id": "ap07",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Given \\(f(-3)=7\\) and \\(f(-1)=-1\\), which expression correctly computes the average rate on [−3,−1]?",
      "choices": [
        "\\(\\frac{7-(-1)}{-1-(-3)}\\)",
        "\\(\\frac{-1-7}{-3-(-1)}\\)",
        "\\(\\frac{7+(-1)}{2}\\)",
        "\\(\\frac{7-(-1)}{-3-(-1)}\\)"
      ],
      "answer": 3,
      "hint": "The order of the output subtraction must match the input subtraction.",
      "solution": "The fourth expression reverses both endpoint orders and equals \\(8/(-2)=-4\\).",
      "ek": "1.2.A.1",
      "calculator": false
    },
    {
      "id": "ap08",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "A function satisfies \\(f(2)=7\\). Its average rate of change on [2,6] is −3. Find f(6).",
      "choices": [
        "\\(19\\)",
        "\\(-5\\)",
        "\\(4\\)",
        "\\(-12\\)"
      ],
      "answer": 1,
      "hint": "Recover net change by multiplying the average rate by the interval width.",
      "solution": "\\(f(6)-7=(-3)(6-2)=-12\\), so \\(f(6)=-5\\).",
      "ek": "1.2.A.1",
      "calculator": false
    },
    {
      "id": "ap09",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "<div class=\"table-wrap\"><table><caption>Values near point A, x = 1.</caption><tbody><tr><th scope=\"row\">x</th><td>0.99</td><td>1</td><td>1.01</td></tr><tr><th scope=\"row\">f(x)</th><td>99.97</td><td>100</td><td>100.03</td></tr></tbody></table></div><div class=\"table-wrap\"><table><caption>Values near point B, x = 3.</caption><tbody><tr><th scope=\"row\">x</th><td>2.99</td><td>3</td><td>3.01</td></tr><tr><th scope=\"row\">f(x)</th><td>9.94</td><td>10</td><td>10.06</td></tr></tbody></table></div>Which comparison is supported by the average rates over the displayed small intervals?",
      "choices": [
        "A has the greater rate because its output is larger.",
        "The estimated rates are equal.",
        "B has the greater estimated rate, despite its smaller output.",
        "A has a negative estimated rate."
      ],
      "answer": 2,
      "hint": "Compare 0.06/0.02 with 0.12/0.02.",
      "solution": "The estimates are \\(3\\) at A and \\(6\\) at B. Output height and rate are different quantities.",
      "ek": "1.2.A.3",
      "calculator": false
    },
    {
      "id": "ap10",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "During interval I, an output rises by 30 units over an input increase of 2. During interval II, it rises by 36 units over an input increase of 3. Which interval has the greater average rate?",
      "choices": [
        "II, because 36 > 30.",
        "They have the same rate.",
        "I, because 15 > 12.",
        "There is insufficient information to compare the average rates."
      ],
      "answer": 2,
      "hint": "Compare changes per input unit, not the raw output changes.",
      "solution": "The average rates are 30/2=15 and 36/3=12, respectively.",
      "ek": "1.2.B.1",
      "calculator": false
    },
    {
      "id": "ap11",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Two cooling processes have local rate estimates −7°C/min and −2°C/min. Which statement is correct?",
      "choices": [
        "−7 is greater than −2.",
        "−2 describes faster cooling in magnitude.",
        "Both temperatures are necessarily negative.",
        "−2 is the greater signed rate, while −7 describes faster cooling in magnitude."
      ],
      "answer": 3,
      "hint": "Separate output sign, rate sign, and rate magnitude.",
      "solution": "On the number line −2 > −7, but 7 > 2. These rates say nothing about whether the temperatures themselves are negative.",
      "ek": "1.2.B.3",
      "calculator": false
    },
    {
      "id": "ap12",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "<div class=\"table-wrap\"><table><caption>Selected values near x = 2.</caption><tbody><tr><th scope=\"row\">x</th><td>1.9</td><td>2</td><td>2.1</td></tr><tr><th scope=\"row\">f(x)</th><td>7.61</td><td>8</td><td>8.41</td></tr></tbody></table></div>Using the average over [1.9,2.1], estimate the rate at x = 2.",
      "choices": [
        "\\(4\\)",
        "\\(8\\)",
        "\\(0.8\\)",
        "\\(0.4\\)"
      ],
      "answer": 0,
      "hint": "Use output change 0.8 over input change 0.2.",
      "solution": "\\((8.41-7.61)/(2.1-1.9)=4\\). Write “approximately 4” for the rate at the point.",
      "ek": "1.2.A.2",
      "calculator": false
    },
    {
      "id": "ap13",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "A function has a well-behaved graph near x = 3 and can be evaluated accurately. Which interval is the most suitable of those listed for estimating its rate at x = 3?",
      "choices": [
        "[0,6]",
        "[2.99,3.01]",
        "[2,2.1]",
        "[3.9,4.1]"
      ],
      "answer": 1,
      "hint": "Choose a small interval containing the point of interest.",
      "solution": "[2.99,3.01] contains 3 and is the narrowest nearby interval listed. Verify numerical precision and behavior when interpreting an estimate.",
      "ek": "1.2.A.2",
      "calculator": false
    },
    {
      "id": "ap14",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "As intervals around A become narrower, their average rates are 2.8, 2.95 and 2.995. Around B, the corresponding averages are 5.2, 5.05 and 5.005. Which conclusion is best supported?",
      "choices": [
        "The rate at A is greater.",
        "Both rates are exactly 4.",
        "The rate near B is about 5 and exceeds the rate near A, about 3.",
        "These finite values prove the exact rates are 3 and 5."
      ],
      "answer": 2,
      "hint": "Use the narrowing-interval trend while keeping the conclusion approximate.",
      "solution": "The estimates suggest about 3 at A and about 5 at B. A finite list alone is not proof of exact local values.",
      "ek": "1.2.A.3",
      "calculator": false
    },
    {
      "id": "ap15",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "<figure><div data-rates-plot=\"rate-sign-options\"></div><figcaption>All four graphs are defined on [0,4].</figcaption></figure>Which graph has negative outputs throughout the interval and a positive average rate on [0,4]?",
      "choices": [
        "Graph A",
        "Graph B",
        "Graph C",
        "Graph D"
      ],
      "answer": 0,
      "hint": "Compare the endpoint heights and their positions relative to the horizontal axis.",
      "solution": "Graph A rises from −5 to −1, giving average rate (−1−(−5))/4=1, while both endpoints and all intervening outputs are negative.",
      "ek": "1.2.B.2",
      "calculator": false
    },
    {
      "id": "ap16",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "On an interval, changes in two quantities satisfy \\(\\Delta y=3\\Delta x\\). If \\(\\Delta x=-0.2\\), what is \\(\\Delta y\\)?",
      "choices": [
        "\\(0.6\\)",
        "\\(3.2\\)",
        "\\(-3.2\\)",
        "\\(-0.6\\)"
      ],
      "answer": 3,
      "hint": "A positive ratio means both changes have the same sign.",
      "solution": "\\(\\Delta y=3(-0.2)=-0.6\\). When the input moves downward, the output moves downward too.",
      "ek": "1.2.B.2",
      "calculator": false
    },
    {
      "id": "ap17",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "The average rate of f on [0,2] is 5, and on [2,8] it is 1. What is the average rate on [0,8]?",
      "choices": [
        "\\(3\\)",
        "\\(2\\)",
        "\\(6\\)",
        "\\(16\\)"
      ],
      "answer": 1,
      "hint": "Add output changes, accounting for each interval’s width.",
      "solution": "Total output change is \\(5(2)+1(6)=16\\), so the full-interval average is \\(16/8=2\\).",
      "ek": "1.2.A.1",
      "calculator": false
    },
    {
      "id": "ap18",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "<figure><div data-rates-plot=\"reader\"></div><figcaption>Line segments connect the labeled points and define f on the entire domain [−2,6].</figcaption></figure>On which of the following intervals is the average rate greatest?",
      "choices": [
        "[−2,2]",
        "[0,4]",
        "[2,6]",
        "[4,6]"
      ],
      "answer": 3,
      "hint": "Compute each endpoint quotient; do not compare only final outputs.",
      "solution": "The respective average rates are \\(0,-1,-1,2\\). The largest is 2 on [4,6].",
      "ek": "1.2.A.1",
      "calculator": false
    },
    {
      "id": "ap19",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "<figure><div data-rates-plot=\"shared\"></div><figcaption>Solid blue and dashed gold graphs share (0,1) and (4,9).</figcaption></figure>Which statement must be true?",
      "choices": [
        "The functions agree at every input.",
        "Their rates at every point agree.",
        "They have the same average rate on [0,4].",
        "Both have constant rate 2 everywhere."
      ],
      "answer": 2,
      "hint": "Only the endpoint values enter this average.",
      "solution": "Both have average rate \\((9-1)/(4-0)=2\\), although their interior values and local behavior differ.",
      "ek": "1.2.A.1",
      "calculator": false
    },
    {
      "id": "ap20",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Why is the average-rate quotient on [a,a] undefined?",
      "choices": [
        "Its denominator is zero.",
        "Every function has zero output at a.",
        "Its value must be zero.",
        "Its value must be negative."
      ],
      "answer": 0,
      "hint": "Check the input change.",
      "solution": "The input change is \\(a-a=0\\); the quotient cannot represent an average rate over an interval of zero width.",
      "ek": "1.2.A.1",
      "calculator": false
    },
    {
      "id": "ap21",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "The average rate of f on [0,4] is positive. Which statement is guaranteed?",
      "choices": [
        "The function increases throughout [0,4].",
        "f(4) > f(0).",
        "The output is positive throughout [0,4].",
        "The rate at x = 2 is positive."
      ],
      "answer": 1,
      "hint": "Use the positive denominator 4.",
      "solution": "A positive quotient implies positive net output change. The statement does not establish every-point behavior.",
      "ek": "1.2.B.2",
      "calculator": false
    },
    {
      "id": "ap22",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Nearby outputs are rounded before a rate is computed over a very short interval. Which practice best reduces avoidable numerical error?",
      "choices": [
        "Always use the smallest possible interval, even if the displayed outputs coincide.",
        "Round each endpoint to one decimal place.",
        "Retain full stored endpoint values and round the final quotient.",
        "Replace the output difference with the sum."
      ],
      "answer": 2,
      "hint": "Small input differences can amplify the effect of rounding the numerator.",
      "solution": "Keep full stored values for the subtraction and division. Smaller intervals alone do not guarantee better estimates from rounded data.",
      "ek": "1.2.A.2",
      "calculator": false
    },
    {
      "id": "ap23",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Let \\(R(t)=\\frac{120}{t+1}\\), for \\(0\\le t\\le8\\). Use a graphing calculator to find the average rate of R on [1.2,4.7], to three decimal places.",
      "choices": [
        "\\(-9.569\\)",
        "\\(-33.493\\)",
        "\\(9.569\\)",
        "\\(-12.000\\)"
      ],
      "answer": 0,
      "hint": "Evaluate each endpoint without rounding; then divide the difference by 3.5.",
      "solution": "\\(\\frac{120/5.7-120/2.2}{4.7-1.2}\\approx-9.569\\).",
      "ek": "1.2.A.1",
      "calculator": true
    },
    {
      "id": "ap24",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "For \\(R(t)=\\frac{120}{t+1}\\), estimate the rate at t = 2 using the average over [1.99,2.01]. Give three decimal places.",
      "choices": [
        "\\(-26.667\\)",
        "\\(13.333\\)",
        "\\(-13.333\\)",
        "\\(-0.267\\)"
      ],
      "answer": 2,
      "hint": "The denominator is 0.02, not 0.01.",
      "solution": "\\(\\frac{120/3.01-120/2.99}{2.01-1.99}\\approx-13.333\\). This quotient estimates the rate at t = 2.",
      "ek": "1.2.A.2",
      "calculator": true
    },
    {
      "id": "ch01",
      "type": "mcq",
      "group": "Topic 1.2 challenge MCQ",
      "prompt": "Given \\(f(1)=5\\), the average rates are 4 on [1,3] and −2 on [3,6]. Find f(6).",
      "choices": [
        "\\(9\\)",
        "\\(7\\)",
        "\\(1\\)",
        "\\(13\\)"
      ],
      "answer": 1,
      "hint": "Reconstruct each output change before adding.",
      "solution": "\\(f(3)=5+4(2)=13\\); then \\(f(6)=13-2(3)=7\\).",
      "ek": "1.2.A.1",
      "calculator": false
    },
    {
      "id": "ch02",
      "type": "mcq",
      "group": "Topic 1.2 challenge MCQ",
      "prompt": "For \\(f(x)=mx^2-x\\), the average rate on [1,3] is 11. Find m.",
      "choices": [
        "\\(3\\)",
        "\\(5\\)",
        "\\(11\\)",
        "\\(12\\)"
      ],
      "answer": 0,
      "hint": "Substitute both endpoints into the definition.",
      "solution": "\\(\\frac{(9m-3)-(m-1)}{2}=4m-1=11\\), so \\(m=3\\).",
      "ek": "1.2.A.1",
      "calculator": false
    },
    {
      "id": "ch03",
      "type": "mcq",
      "group": "Topic 1.2 challenge MCQ",
      "prompt": "Let \\(q(x)=x^2-3x+2\\). For \\(h>0\\), which expression equals its average rate on [a,a+h]?",
      "choices": [
        "\\(2a-3\\)",
        "\\(h(2a+h-3)\\)",
        "\\(2a+h-3\\)",
        "\\(a+h-3\\)"
      ],
      "answer": 2,
      "hint": "Expand q(a+h), subtract the entire q(a), then divide by h.",
      "solution": "\\(q(a+h)-q(a)=h(2a+h-3)\\). Since \\(h>0\\), division gives \\(2a+h-3\\). This remains an interval average.",
      "ek": "1.2.A.1",
      "calculator": false
    },
    {
      "id": "ch04",
      "type": "mcq",
      "group": "Topic 1.2 challenge MCQ",
      "prompt": "<figure><div data-rates-plot=\"corner\"></div><figcaption>The graph is f(x) = |x−2|+1.</figcaption></figure>Near x = 2, left averages are −1, right averages are 1, and centered averages are 0. What is justified?",
      "choices": [
        "The rate at 2 is 0 because all centered averages are 0.",
        "The rate at 2 is 1 because the right averages are 1.",
        "The rate at 2 is −1 because the left averages are −1.",
        "A common local rate is not supported; the centered average hides the corner."
      ],
      "answer": 3,
      "hint": "A balanced interval can conceal different behavior on its two halves.",
      "solution": "The left and right average rates remain −1 and 1 as the intervals shrink. The centered value alone does not establish a rate at the corner.",
      "ek": "1.2.A.2",
      "calculator": false
    },
    {
      "id": "ch05",
      "type": "mcq",
      "group": "Topic 1.2 challenge MCQ",
      "prompt": "<figure><div data-rates-plot=\"jump\"></div><figcaption>The open point is excluded; the filled point gives j(2).</figcaption></figure>What is the average rate of j on [0,4], and what does it tell us about the jump at x = 2?",
      "choices": [
        "The average is 2; it summarizes endpoints and does not describe the local jump.",
        "The average is undefined because the graph jumps.",
        "The average is 1, so the rate is 1 everywhere.",
        "The average is 4, equal to the jump size."
      ],
      "answer": 0,
      "hint": "Both endpoints are defined even though the interior graph has a jump.",
      "solution": "\\((j(4)-j(0))/(4-0)=(8-0)/4=2\\). A finite whole-interval average does not settle the local behavior at an interior jump.",
      "ek": "1.2.A.1",
      "calculator": false
    },
    {
      "id": "ch06",
      "type": "mcq",
      "group": "Topic 1.2 challenge MCQ",
      "prompt": "The average rate on [0,1] is 8 and on [1,5] it is −2. What must be true?",
      "choices": [
        "The full-interval average is 3.",
        "The function is constant on [0,5].",
        "The output at 5 exceeds the output at 0.",
        "The full-interval average is 0 and f(5)=f(0)."
      ],
      "answer": 3,
      "hint": "The second average applies over four input units.",
      "solution": "Net output change is \\(8(1)-2(4)=0\\), so the full average is \\(0/5=0\\). Constant interior behavior does not follow.",
      "ek": "1.2.A.1",
      "calculator": false
    }
  ],
  "frqs": [
    {
      "id": "frq01",
      "title": "FRQ · Tank monitoring",
      "context": "<div class=\"table-wrap\"><table><caption>Selected measurements of tank volume.</caption><tbody><tr><th scope=\"row\">t (min)</th><td>0</td><td>2</td><td>5</td><td>8</td></tr><tr><th scope=\"row\">V(t) (L)</th><td>720</td><td>820</td><td>910</td><td>850</td></tr></tbody></table></div>",
      "parts": [
        {
          "label": "(A)",
          "prompt": "Find the average rate on [0,2] and interpret it with units.",
          "marks": 2,
          "rubric": "<p><strong>Worked response:</strong> \\((820-720)/(2-0)=50\\) L/min. Volume rose by an average of 50 L per minute from minute 0 to minute 2.</p><ol><li>1 point: Correct average rate 50.</li><li>1 point: Correct units and interval interpretation.</li></ol>"
        },
        {
          "label": "(B)",
          "prompt": "Find the average rate on [2,5] and on [0,5]. Explain why the ordinary mean of the two short-interval rates is not the full-interval rate.",
          "marks": 2,
          "rubric": "<p><strong>Worked response:</strong> The rates are \\(30\\) and \\((910-720)/5=38\\) L/min. The component intervals last 2 and 3 minutes, so \\((50+30)/2=40\\) weights them incorrectly.</p><ol><li>1 point: Both requested average rates: 30 and 38.</li><li>1 point: Explain the unequal durations, or reconstruct total change as 50(2)+30(3).</li></ol>"
        },
        {
          "label": "(C)",
          "prompt": "Use the average rate −20 L/min on [5,8] and V(5)=910 to recover V(8). Does this average prove that volume fell during every part of [5,8]? Explain.",
          "marks": 2,
          "rubric": "<p><strong>Worked response:</strong> \\(V(8)=910+(-20)(8-5)=850\\) L. No: an interval average records net endpoint change, not every intervening movement.</p><ol><li>1 point: Correct reconstruction of 850 L.</li><li>1 point: Correct limitation of the average, with explanation.</li></ol>"
        }
      ],
      "totalMarks": 6,
      "calculator": false,
      "calculatorLabel": "No calculator",
      "group": "AP-style topic FRQ"
    },
    {
      "id": "frq02",
      "title": "FRQ · Rates from one complete graph",
      "context": "<figure><div data-rates-plot=\"reader\"></div><figcaption>Line segments connect the labeled points and define f on the entire domain [−2,6].</figcaption></figure>",
      "parts": [
        {
          "label": "(A)",
          "prompt": "Find the average rate of f on [−2,4]. Show the endpoint quotient.",
          "marks": 2,
          "rubric": "<p><strong>Worked response:</strong> \\(\\frac{-3-5}{4-(-2)}=-\\frac{8}{6}=-\\frac43\\).</p><ol><li>1 point: Correct endpoint quotient.</li><li>1 point: Correct value −4/3.</li></ol>"
        },
        {
          "label": "(B)",
          "prompt": "Find the average rate on [−2,2]. Explain why this does not imply that f is constant there.",
          "marks": 2,
          "rubric": "<p><strong>Worked response:</strong> The average is \\((5-5)/4=0\\), but \\(f(0)=1\\), unlike the endpoint values 5.</p><ol><li>1 point: Correct average 0.</li><li>1 point: Use the graph or a specific intermediate value to show nonconstant behavior.</li></ol>"
        },
        {
          "label": "(C)",
          "prompt": "Use short intervals around x = 1 and x = 3 to compare their local rates. State which signed rate is greater and where the magnitude of change is greater.",
          "marks": 2,
          "rubric": "<p><strong>Worked response:</strong> For example, the averages on [0.9,1.1] and [2.9,3.1] are 2 and −4. The signed rate at 1 is greater; the magnitude is greater at 3. Each neighborhood is a straight segment.</p><ol><li>1 point: Correct local rates 2 and −4 supported by nearby segments or quotients.</li><li>1 point: Correct signed comparison and magnitude comparison.</li></ol>"
        }
      ],
      "totalMarks": 6,
      "calculator": false,
      "calculatorLabel": "No calculator",
      "group": "AP-style topic FRQ"
    },
    {
      "id": "frq03",
      "title": "FRQ · Compare nearby rates",
      "context": "<div class=\"table-wrap\"><table><caption>Exact selected values near two inputs of F. Each interval has endpoints c−h and c+h.</caption><thead><tr><th>c</th><th>h</th><th>F(c−h)</th><th>F(c)</th><th>F(c+h)</th></tr></thead><tbody><tr><td>1</td><td>0.1</td><td>0.729</td><td>1</td><td>1.331</td></tr><tr><td>1</td><td>0.01</td><td>0.970299</td><td>1</td><td>1.030301</td></tr><tr><td>2</td><td>0.1</td><td>6.859</td><td>8</td><td>9.261</td></tr><tr><td>2</td><td>0.01</td><td>7.880599</td><td>8</td><td>8.120601</td></tr></tbody></table></div>",
      "parts": [
        {
          "label": "(A)",
          "prompt": "Using h = 0.1, find the centered average rate near c = 1 and near c = 2.",
          "marks": 2,
          "rubric": "<p><strong>Worked response:</strong> The quotients are \\((1.331-0.729)/0.2=3.01\\) and \\((9.261-6.859)/0.2=12.01\\).</p><ol><li>1 point: Correct average 3.01 near 1.</li><li>1 point: Correct average 12.01 near 2.</li></ol>"
        },
        {
          "label": "(B)",
          "prompt": "Repeat with h = 0.01. Use both interval widths to estimate and compare the rates at the two points.",
          "marks": 2,
          "rubric": "<p><strong>Worked response:</strong> The averages are \\(3.0001\\) and \\(12.0001\\). The rates are suggested to be about 3 and 12; the second point has the greater rate.</p><ol><li>1 point: Both narrower-interval averages.</li><li>1 point: Approximate point rates and their comparison supported by the data.</li></ol>"
        },
        {
          "label": "(C)",
          "prompt": "A student says the finite table proves the exact local rates are 3 and 12. Evaluate the claim and explain why the interval width is 2h, not h.",
          "marks": 2,
          "rubric": "<p><strong>Worked response:</strong> The data support approximations but a finite table does not prove exact local values. The width is \\((c+h)-(c-h)=2h\\).</p><ol><li>1 point: Distinguish a supported approximation from an exact proof.</li><li>1 point: Correct explanation of the full interval width.</li></ol>"
        }
      ],
      "totalMarks": 6,
      "calculator": true,
      "calculatorLabel": "Graphing calculator required",
      "group": "AP-style topic FRQ"
    },
    {
      "id": "frq04",
      "title": "FRQ · Calculator and contextual interpretation",
      "context": "A draining tank is modeled by \\(R(t)=120/(t+1)\\), for \\(0\\le t\\le8\\). Here t is time in minutes and R(t) is remaining water in liters. Use a graphing calculator and retain full stored values until your final answers.",
      "parts": [
        {
          "label": "(A)",
          "prompt": "Find the average rate of R on [1.2,4.7], to three decimal places, and interpret it.",
          "marks": 2,
          "rubric": "<p><strong>Worked response:</strong> \\(\\frac{120/5.7-120/2.2}{4.7-1.2}\\approx-9.569\\) L/min. The volume decreases by an average of about 9.569 L per minute over that interval.</p><ol><li>1 point: Correct average −9.569.</li><li>1 point: Correct signed contextual interpretation and units.</li></ol>"
        },
        {
          "label": "(B)",
          "prompt": "Estimate the rates at t = 2 and t = 5 using [1.99,2.01] and [4.99,5.01], respectively. Give three decimal places.",
          "marks": 2,
          "rubric": "<p><strong>Worked response:</strong> The estimates are \\(-13.333\\) L/min at 2 and \\(-3.333\\) L/min at 5, each from its specified centered quotient.</p><ol><li>1 point: Correct estimate −13.333 at 2.</li><li>1 point: Correct estimate −3.333 at 5.</li></ol>"
        },
        {
          "label": "(C)",
          "prompt": "At which time is the signed rate greater? At which time is the tank draining faster? Justify both answers.",
          "marks": 2,
          "rubric": "<p><strong>Worked response:</strong> The signed rate is greater at t = 5 because −3.333 > −13.333. Draining is faster at t = 2 because 13.333 > 3.333 in magnitude.</p><ol><li>1 point: Correct signed-rate comparison with evidence.</li><li>1 point: Correct draining-speed comparison using magnitudes.</li></ol>"
        }
      ],
      "totalMarks": 6,
      "calculator": true,
      "calculatorLabel": "Graphing calculator required",
      "group": "AP-style topic FRQ"
    },
    {
      "id": "challenge01",
      "title": "Challenge FRQ · Reconstruct a constant-rate comparison",
      "context": "Let \\(f(x)=kx^2-x\\) on [1,3]. Its average rate over this interval is 11.",
      "parts": [
        {
          "label": "(A)",
          "prompt": "Find k, showing the average-rate equation.",
          "marks": 2,
          "rubric": "<p><strong>Worked response:</strong> \\(\\frac{(9k-3)-(k-1)}{3-1}=4k-1=11\\), so \\(k=3\\).</p><ol><li>1 point: Correct equation from the definition.</li><li>1 point: Correct parameter k = 3.</li></ol>"
        },
        {
          "label": "(B)",
          "prompt": "Construct a constant-rate model L(x) that matches f at both endpoints of [1,3].",
          "marks": 2,
          "rubric": "<p><strong>Worked response:</strong> Now \\(f(1)=2\\) and \\(f(3)=24\\). A suitable model is \\(L(x)=2+11(x-1)=11x-9\\), whose output changes by the same 22 units over the interval.</p><ol><li>1 point: Correct endpoint values and required constant rate 11.</li><li>1 point: A valid matching model, such as L(x)=11x−9.</li></ol>"
        },
        {
          "label": "(C)",
          "prompt": "Compare f(2) and L(2). Explain what this demonstrates about equal average rates.",
          "marks": 2,
          "rubric": "<p><strong>Worked response:</strong> \\(f(2)=10\\) but \\(L(2)=13\\). Equal endpoint averages do not require equal intermediate values or identical behavior throughout the interval.</p><ol><li>1 point: Correct intermediate values 10 and 13.</li><li>1 point: Correct conclusion with reference to the shared endpoints and differing interior values.</li></ol>"
        }
      ],
      "totalMarks": 6,
      "calculator": false,
      "calculatorLabel": "No calculator",
      "group": "Topic 1.2 challenge FRQ"
    },
    {
      "id": "challenge02",
      "title": "Challenge FRQ · A centered average can hide a corner",
      "context": "Consider \\(F(x)=|x-2|+1\\) and \\(H(x)=(x-2)^2+1\\), both on [0,4]. Investigate their rates near x = 2 using only finite average rates.",
      "parts": [
        {
          "label": "(A)",
          "prompt": "For F, find the average rates on [1.9,2] and [2,2.1].",
          "marks": 2,
          "rubric": "<p><strong>Worked response:</strong> The left rate is \\((1-1.1)/0.1=-1\\) and the right rate is \\((1.1-1)/0.1=1\\).</p><ol><li>1 point: Correct left average −1.</li><li>1 point: Correct right average 1.</li></ol>"
        },
        {
          "label": "(B)",
          "prompt": "Find F’s average rate on [2−h,2+h] for 0<h≤1. Explain why that average alone is misleading as a point-rate estimate.",
          "marks": 2,
          "rubric": "<p><strong>Worked response:</strong> The endpoint outputs both equal \\(1+h\\), so the centered average is 0. Left and right averages remain −1 and 1, so this centered value hides incompatible local behavior.</p><ol><li>1 point: Centered average 0, justified by the endpoints.</li><li>1 point: Explain why the two sides do not support a common local rate.</li></ol>"
        },
        {
          "label": "(C)",
          "prompt": "For H, the average rates on [2−h,2] and [2,2+h] are −h and h. Compare the evidence for H and F as h takes the values 0.1, 0.01 and 0.001.",
          "marks": 2,
          "rubric": "<p><strong>Worked response:</strong> For H the pairs are (−0.1,0.1), (−0.01,0.01), (−0.001,0.001), supporting a local rate about 0. For F the pair remains (−1,1), so there is no common finite rate at the corner.</p><ol><li>1 point: Use H’s shrinking left/right values to support an estimate about 0.</li><li>1 point: Contrast with F’s persistently different left/right averages.</li></ol>"
        }
      ],
      "totalMarks": 6,
      "calculator": false,
      "calculatorLabel": "No calculator",
      "group": "Topic 1.2 challenge FRQ"
    }
  ]
};
if(typeof module!=="undefined"&&module.exports)module.exports=data;else root.RatesQuestions=data;})(typeof window!=="undefined"?window:globalThis);
