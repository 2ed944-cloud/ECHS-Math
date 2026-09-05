/* Original ECHS AP Precalculus Topic 1.1 practice, aligned to the Fall 2026 framework. */
(function(root){const data={
  "revision": "ap-precalculus-topic-1-1-v3",
  "questions": [
    {
      "id": "q01",
      "type": "mcq",
      "group": "Learning check",
      "prompt": "Which condition must a relation satisfy to be a function?",
      "choices": [
        "Every output must have one input.",
        "Its graph must be increasing.",
        "Every input in its domain must have exactly one output.",
        "Its domain must contain every real number."
      ],
      "answer": 2,
      "hint": "Focus on what happens to one input.",
      "solution": "Different inputs may share an output. A function assigns each allowable input exactly one output.",
      "ek": "1.1.A.1",
      "calculator": false
    },
    {
      "id": "q02",
      "type": "number",
      "group": "Learning check",
      "prompt": "Let \\(T(h)=18+3h-h^2\\) for \\(0\\le h\\le4\\). Find \\(T(2)\\).",
      "answer": 20,
      "unit": "output value",
      "hint": "Replace every h by 2.",
      "solution": "\\(T(2)=18+3(2)-2^2=20\\). This is the output associated with input 2.",
      "ek": "1.1.A.2",
      "calculator": false
    },
    {
      "id": "q03",
      "type": "mcq",
      "group": "Learning check",
      "prompt": "<div class=\"table-wrap\"><table><caption>This table defines f completely on its six listed inputs.</caption><tbody><tr><th scope=\"row\">x</th><td>-3</td><td>-1</td><td>0</td><td>2</td><td>4</td><td>6</td></tr><tr><th scope=\"row\">f(x)</th><td>5</td><td>1</td><td>-2</td><td>1</td><td>5</td><td>9</td></tr></tbody></table></div>What is the preimage of 5?",
      "choices": [
        "\\(\\{5\\}\\)",
        "\\(\\{-3,4\\}\\)",
        "\\(\\{1,9\\}\\)",
        "\\(\\{2\\}\\)"
      ],
      "answer": 1,
      "hint": "Find every input paired with output 5.",
      "solution": "\\(f(-3)=f(4)=5\\), so the preimage is \\(\\{-3,4\\}\\).",
      "ek": "1.1.A.2",
      "calculator": false
    },
    {
      "id": "q04",
      "type": "mcq",
      "group": "Learning check",
      "prompt": "Suppose \\(a<b\\) and \\(f(a)>f(b)\\). Which conclusion is guaranteed?",
      "choices": [
        "The function decreases throughout the interval.",
        "The graph is concave down.",
        "The function must have a zero.",
        "The output at b is smaller than the output at a."
      ],
      "answer": 3,
      "hint": "The statement compares two values.",
      "solution": "Only the endpoint comparison is guaranteed. A graph may rise and fall between the two inputs.",
      "ek": "1.1.A.3–4",
      "calculator": false
    },
    {
      "id": "q05",
      "type": "mcq",
      "group": "Learning check",
      "prompt": "An output is falling, but it falls more slowly as the input increases. Which description fits?",
      "choices": [
        "Decreasing and concave up.",
        "Decreasing and concave down.",
        "Increasing and concave up.",
        "Constant."
      ],
      "answer": 0,
      "hint": "Less negative rates are larger rates.",
      "solution": "The output decreases, while its rate of change increases toward zero. The graph is concave up.",
      "ek": "1.1.B.3",
      "calculator": false
    },
    {
      "id": "q06",
      "type": "mcq",
      "group": "Learning check",
      "prompt": "If \\(g(7)=0\\), what is a zero of g, and what is the corresponding x-intercept?",
      "choices": [
        "Zero \\(0\\); intercept \\((0,7)\\).",
        "Zero \\((7,0)\\); intercept \\(7\\).",
        "Zero \\(7\\); intercept \\((7,0)\\).",
        "Zero \\(7\\); intercept \\((0,7)\\)."
      ],
      "answer": 2,
      "hint": "A zero is an input, while an intercept is a point.",
      "solution": "The zero is \\(7\\); the graph contains the point \\((7,0)\\).",
      "ek": "1.1.B.5",
      "calculator": false
    },
    {
      "id": "ap01",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Which set of ordered pairs does NOT define y as a function of x?",
      "choices": [
        "\\(\\{(-1,2),(0,2),(3,5)\\}\\)",
        "\\(\\{(-1,2),(0,3),(-1,5)\\}\\)",
        "\\(\\{(1,-2),(2,-2),(3,-2)\\}\\)",
        "\\(\\{(-3,1),(0,4),(3,1)\\}\\)"
      ],
      "answer": 1,
      "hint": "Look for one input assigned two different outputs.",
      "solution": "In choice B, input −1 is assigned outputs 2 and 5. Shared outputs in the other choices do not prevent a function.",
      "ek": "1.1.A.1",
      "calculator": false
    },
    {
      "id": "ap02",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "The volume \\(V(t)\\), in liters, depends on elapsed time t, in minutes. Which identifies the independent and dependent variables correctly?",
      "choices": [
        "Independent: V(t), liters; dependent: t, minutes.",
        "Independent: liters; dependent: minutes.",
        "Independent: the ordered pair (t,V(t)); dependent: t.",
        "Independent: t, minutes; dependent: V(t), liters."
      ],
      "answer": 3,
      "hint": "The independent variable supplies the input.",
      "solution": "Elapsed time is the input; the volume is the resulting output.",
      "ek": "1.1.A.1",
      "calculator": false
    },
    {
      "id": "ap03",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "<div class=\"table-wrap\"><table><caption>The table defines g completely.</caption><tbody><tr><th scope=\"row\">x</th><td>-2</td><td>0</td><td>3</td><td>5</td></tr><tr><th scope=\"row\">g(x)</th><td>4</td><td>1</td><td>4</td><td>0</td></tr></tbody></table></div>What is the range of g?",
      "choices": [
        "\\(\\{-2,0,3,5\\}\\)",
        "\\([0,4]\\)",
        "\\(\\{0,1,4\\}\\)",
        "\\(\\{0,1,3,4,5\\}\\)"
      ],
      "answer": 2,
      "hint": "List distinct outputs; do not fill in unlisted values.",
      "solution": "The outputs produced are 4, 1, 4 and 0. Thus the range is {0,1,4}. The table defines a finite function, not a connected curve.",
      "ek": "1.1.A.1",
      "calculator": false
    },
    {
      "id": "ap04",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "<div class=\"table-wrap\"><table><caption>This table defines f completely on its six listed inputs.</caption><tbody><tr><th scope=\"row\">x</th><td>-3</td><td>-1</td><td>0</td><td>2</td><td>4</td><td>6</td></tr><tr><th scope=\"row\">f(x)</th><td>5</td><td>1</td><td>-2</td><td>1</td><td>5</td><td>9</td></tr></tbody></table></div>What is the image of 2?",
      "choices": [
        "\\(1\\)",
        "\\(\\{-1,2\\}\\)",
        "\\(5\\)",
        "\\(2\\)"
      ],
      "answer": 0,
      "hint": "Begin with the input 2.",
      "solution": "The table gives \\(f(2)=1\\). The image is one output, not a set of preimages.",
      "ek": "1.1.A.2",
      "calculator": false
    },
    {
      "id": "ap05",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "<div class=\"table-wrap\"><table><caption>This table defines f completely on its six listed inputs.</caption><tbody><tr><th scope=\"row\">x</th><td>-3</td><td>-1</td><td>0</td><td>2</td><td>4</td><td>6</td></tr><tr><th scope=\"row\">f(x)</th><td>5</td><td>1</td><td>-2</td><td>1</td><td>5</td><td>9</td></tr></tbody></table></div>Which statement is correct?",
      "choices": [
        "The preimage of 1 is \\(\\{1\\}\\).",
        "The preimage of 1 is \\(\\{-1,2\\}\\).",
        "The image of 1 is \\(\\{-1,2\\}\\).",
        "The function is invalid because 1 has two preimages."
      ],
      "answer": 1,
      "hint": "Repeated outputs are allowed.",
      "solution": "Both \\(f(-1)=1\\) and \\(f(2)=1\\). Each input still has exactly one output.",
      "ek": "1.1.A.2",
      "calculator": false
    },
    {
      "id": "ap06",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Let \\(f(x)=2(x+3)\\) and \\(g(x)=2x+6\\), both with domain \\(\\mathbb R\\). Which statement justifies \\(f=g\\)?",
      "choices": [
        "They have the same domain and equal outputs at every input in that domain.",
        "Their graphs share one point.",
        "They use the same letter x.",
        "Both have infinitely many input values."
      ],
      "answer": 0,
      "hint": "Check the domain and the entire rule.",
      "solution": "Distribution gives \\(2(x+3)=2x+6\\) for every real x. The domains also agree.",
      "ek": "1.1.A.1",
      "calculator": false
    },
    {
      "id": "ap07",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Let \\(p(x)=x^2\\) on \\(\\mathbb R\\), and let \\(q(x)=x^2\\) on \\(x\\ge0\\). Which statement is correct?",
      "choices": [
        "They are equal because their rules match.",
        "They are equal because their ranges match.",
        "They are unequal because q assigns two outputs to each input.",
        "They are unequal because their domains differ."
      ],
      "answer": 3,
      "hint": "Test whether −2 is an allowable input in each function.",
      "solution": "The input −2 belongs to the domain of p but not q. Equal functions must have the same domain.",
      "ek": "1.1.A.1",
      "calculator": false
    },
    {
      "id": "ap08",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "<figure><div data-tandem-plot=\"reader\"></div><figcaption>Line segments connect the labeled points; the graph defines f on the entire displayed domain.</figcaption></figure>On the interval from x = −4 to x = −3, excluding the endpoints, f is",
      "choices": [
        "positive and increasing.",
        "negative and increasing.",
        "negative and decreasing.",
        "positive and decreasing."
      ],
      "answer": 1,
      "hint": "Read position relative to the x-axis separately from direction.",
      "solution": "The graph is below the x-axis and rises from left to right. Negative outputs can increase.",
      "ek": "1.1.A.3",
      "calculator": false
    },
    {
      "id": "ap09",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "<figure><div data-tandem-plot=\"reader\"></div><figcaption>Line segments connect the labeled points; the graph defines f on the entire displayed domain.</figcaption></figure>On which interval is f decreasing?",
      "choices": [
        "From −2 to 0.",
        "From −4 to −2.",
        "From 0 to 2.",
        "From 2 to 4."
      ],
      "answer": 2,
      "hint": "Follow each segment as x increases.",
      "solution": "Only the segment from (0,2) to (2,−2) falls as the input increases.",
      "ek": "1.1.A.4",
      "calculator": false
    },
    {
      "id": "ap10",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "<figure><div data-tandem-plot=\"reader\"></div><figcaption>Line segments connect the labeled points; the graph defines f on the entire displayed domain.</figcaption></figure>What are all zeros of f?",
      "choices": [
        "\\(\\{-4,0,4\\}\\)",
        "\\(\\{-2,2\\}\\)",
        "\\(\\{-3,1,4\\}\\)",
        "\\(\\{(-3,0),(1,0),(4,0)\\}\\)"
      ],
      "answer": 2,
      "hint": "Report input values where the height is zero.",
      "solution": "The graph meets the x-axis at inputs −3, 1 and 4. Choice D lists intercept points rather than zeros.",
      "ek": "1.1.B.5",
      "calculator": false
    },
    {
      "id": "ap11",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "<figure><div data-tandem-plot=\"reader\"></div><figcaption>Line segments connect the labeled points; the graph defines f on the entire displayed domain.</figcaption></figure>What is the preimage of 2?",
      "choices": [
        "\\(\\{-2,0\\}\\)",
        "\\(\\{2\\}\\)",
        "\\([-4,4]\\)",
        "\\([-2,0]\\)"
      ],
      "answer": 3,
      "hint": "A horizontal segment supplies every input between its endpoints.",
      "solution": "Every x with \\(-2\\le x\\le0\\) yields output 2. Domain endpoints matter for this preimage question; this is not an increasing/decreasing endpoint-notation question.",
      "ek": "1.1.A.2",
      "calculator": false
    },
    {
      "id": "ap12",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "<div class=\"table-wrap\"><table><caption>Selected observations at equally spaced inputs.</caption><tbody><tr><th scope=\"row\">x</th><td>0</td><td>1</td><td>2</td><td>3</td></tr><tr><th scope=\"row\">f(x)</th><td>13</td><td>11</td><td>8</td><td>4</td></tr></tbody></table></div>Which statement is best supported by the observations?",
      "choices": [
        "They suggest a decreasing, concave-down pattern, but do not determine every value between observations.",
        "They prove concavity at every intervening input.",
        "They show an increasing function.",
        "They prove that the function is linear."
      ],
      "answer": 0,
      "hint": "Compare the changes −2, −3 and −4.",
      "solution": "The listed outputs fall by larger amounts over equal input steps, suggesting decreasing, concave-down behavior. The finite observations alone do not fix intervening behavior.",
      "ek": "1.1.B.4",
      "calculator": false
    },
    {
      "id": "ap13",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "A hot drink cools continuously. Its temperature falls quickly at first, then more slowly as it approaches room temperature. Which describes the temperature graph during this process?",
      "choices": [
        "Increasing and concave down.",
        "Decreasing and concave up.",
        "Decreasing and concave down.",
        "Constant and concave up."
      ],
      "answer": 1,
      "hint": "A smaller loss per equal time interval means a less negative rate.",
      "solution": "The temperature falls while the rate of change increases toward zero. The graph is decreasing and concave up.",
      "ek": "1.1.B.3",
      "calculator": false
    },
    {
      "id": "ap14",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "A population increases continuously, but its growth per equal time interval becomes smaller. Which description matches?",
      "choices": [
        "Decreasing and concave up.",
        "Increasing and concave up.",
        "Increasing and concave down.",
        "Decreasing and concave down."
      ],
      "answer": 2,
      "hint": "The output direction stays positive even as growth slows.",
      "solution": "The population increases, while its rate of change decreases. The graph is concave down.",
      "ek": "1.1.B.4",
      "calculator": false
    },
    {
      "id": "ap15",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "<figure><div data-tandem-plot=\"four-negative\"></div><figcaption>Each complete curve is defined for 0 ≤ x ≤ 4.</figcaption></figure>Which graph has negative outputs and is increasing with a decreasing rate of change?",
      "choices": [
        "Graph A",
        "Graph B",
        "Graph C",
        "Graph D"
      ],
      "answer": 1,
      "hint": "Find the rising curve that becomes flatter.",
      "solution": "Graph B lies below zero, rises, and becomes flatter. Its output is increasing and its rate of change is decreasing.",
      "ek": "1.1.B.4",
      "calculator": false
    },
    {
      "id": "ap16",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "A graph is concave up on an interval. Which statement must be true on that interval?",
      "choices": [
        "The output is positive.",
        "The function is increasing.",
        "The graph crosses the x-axis.",
        "The rate of change is increasing."
      ],
      "answer": 3,
      "hint": "Concavity describes how the rate changes.",
      "solution": "Concave up means the rate of change increases. The function may be increasing or decreasing, and its outputs may have either sign.",
      "ek": "1.1.B.3",
      "calculator": false
    },
    {
      "id": "ap17",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "A tank fills steadily for 2 minutes, keeps the same volume for the next 2 minutes, then drains steadily for 2 minutes. Which graph fits?<figure><div data-tandem-plot=\"story-options\"></div><figcaption>All graphs use time on the horizontal axis and water volume on the vertical axis.</figcaption></figure>",
      "choices": [
        "Graph A",
        "Graph B",
        "Graph C",
        "Graph D"
      ],
      "answer": 0,
      "hint": "The required direction sequence is rise → level → fall.",
      "solution": "Graph A alone has an increasing segment, a constant segment and then a decreasing segment in the stated order.",
      "ek": "1.1.B.2",
      "calculator": false
    },
    {
      "id": "ap18",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Two functions have domain \\([0,3]\\) and agree at inputs 0, 1, 2 and 3. What follows?",
      "choices": [
        "They are equal functions.",
        "Equality is not established, because they may differ at other inputs in the domain.",
        "Their graphs must have the same concavity.",
        "Their ranges must be equal."
      ],
      "answer": 1,
      "hint": "There are infinitely many other inputs in this domain.",
      "solution": "Matching four values does not establish agreement at every input. Equal functions require the same outputs throughout the same domain.",
      "ek": "1.1.A.1",
      "calculator": false
    },
    {
      "id": "ap19",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "A function \\(D(t)\\) gives an oven’s temperature minus its target temperature, in degrees Celsius. What does a zero of D represent?",
      "choices": [
        "A time when the oven is at 0°C.",
        "A time when the oven temperature stops changing.",
        "A time when the oven temperature equals its target.",
        "The target temperature itself."
      ],
      "answer": 2,
      "hint": "An output of zero means the temperature difference is zero.",
      "solution": "A zero is a time at which the measured temperature equals the target temperature.",
      "ek": "1.1.B.5",
      "calculator": false
    },
    {
      "id": "ap20",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Let \\(g(x)=(x+2)(x-1)(x-3)\\) with domain \\([-1,4]\\). What are all zeros of g?",
      "choices": [
        "\\(\\{-2,1,3\\}\\)",
        "\\(\\{-1,4\\}\\)",
        "\\(\\{(-2,0),(1,0),(3,0)\\}\\)",
        "\\(\\{1,3\\}\\)"
      ],
      "answer": 3,
      "hint": "Check whether each factor-zero input belongs to the domain.",
      "solution": "Although the expression is zero at −2, that input is excluded. The zeros of the stated function are 1 and 3.",
      "ek": "1.1.B.5",
      "calculator": false
    },
    {
      "id": "ap21",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "A club sells up to 12 tickets. Its revenue is \\(R(n)=15n\\), where n is the number of tickets sold. Which domain is appropriate?",
      "choices": [
        "\\(\\{0,1,2,\\ldots,12\\}\\)",
        "\\([0,12]\\)",
        "\\(\\mathbb R\\)",
        "\\(\\{0,15,30,\\ldots,180\\}\\)"
      ],
      "answer": 0,
      "hint": "Ticket counts are whole numbers.",
      "solution": "The inputs are integer counts from 0 through 12. The final choice lists possible revenues, which form the range.",
      "ek": "1.1.A.1",
      "calculator": false
    },
    {
      "id": "ap22",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "A function f is increasing on the interval from 0 to 6. As its input moves from 5 to 2, what happens to its output?",
      "choices": [
        "It increases.",
        "It decreases.",
        "It stays constant.",
        "It must become negative."
      ],
      "answer": 1,
      "hint": "Increasing describes what happens when the input increases.",
      "solution": "Since \\(2<5\\), increasing behavior gives \\(f(2)<f(5)\\). Moving the input backward from 5 to 2 therefore lowers the output.",
      "ek": "1.1.A.3",
      "calculator": false
    },
    {
      "id": "ap23",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Let \\(f(x)=x^2\\) and \\(g(x)=|x|\\), each with domain \\(\\{-1,0,1\\}\\). Which statement is correct?",
      "choices": [
        "They are unequal because the formulas look different.",
        "They are unequal because f(2) differs from g(2).",
        "They are equal on the stated domain.",
        "They are equal on all real numbers."
      ],
      "answer": 2,
      "hint": "Check every input in the actual domain.",
      "solution": "Both functions have outputs 1, 0, 1 at inputs −1, 0, 1. Input 2 is not in either stated domain.",
      "ek": "1.1.A.1",
      "calculator": false
    },
    {
      "id": "ap24",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Let \\(p(x)=0.08(x+4)(x-1)(x-5)\\). Use a graphing calculator to find \\(p(1.7)\\), rounded to three decimal places.",
      "choices": [
        "\\(1.053\\)",
        "\\(-1.050\\)",
        "\\(-1.053\\)",
        "\\(-3.220\\)"
      ],
      "answer": 2,
      "hint": "Enter the complete expression with parentheses around every factor.",
      "solution": "\\(p(1.7)=0.08(5.7)(0.7)(-3.3)=-1.05336\\), which rounds to −1.053.",
      "ek": "1.1.A.2",
      "calculator": true
    },
    {
      "id": "ch01",
      "type": "mcq",
      "group": "Topic 1.1 challenge MCQ",
      "prompt": "<figure><div data-tandem-plot=\"end-counter\"></div><figcaption>Line segments join the four displayed points.</figcaption></figure>This graph satisfies \\(f(0)=1\\) and \\(f(6)=9\\). Which claim does it disprove?",
      "choices": [
        "A function can have different endpoint outputs.",
        "A larger final output guarantees that a function is increasing throughout the intervening interval.",
        "A function can decrease on part of its domain.",
        "An input can have exactly one output."
      ],
      "answer": 1,
      "hint": "Inspect the segment between x = 2 and x = 4.",
      "solution": "The function ends higher but decreases from x = 2 to x = 4. Endpoint comparison does not establish monotonicity throughout.",
      "ek": "1.1.A.3",
      "calculator": false
    },
    {
      "id": "ch02",
      "type": "mcq",
      "group": "Topic 1.1 challenge MCQ",
      "prompt": "Functions f and g both have domain \\(\\{-1,1\\}\\) and range \\(\\{0,2\\}\\). Given \\(f(-1)=0,\\ f(1)=2,\\ g(-1)=2,\\ g(1)=0\\), which statement is correct?",
      "choices": [
        "They are unequal because their outputs differ at a shared input.",
        "They are equal because their domains and ranges match.",
        "Neither relation is a function.",
        "They become equal if x is renamed t."
      ],
      "answer": 0,
      "hint": "Equal ranges do not identify which input produces each output.",
      "solution": "For example, f(−1) = 0 but g(−1) = 2. Same domain and range are necessary but not sufficient for equality.",
      "ek": "1.1.A.1",
      "calculator": false
    },
    {
      "id": "ch03",
      "type": "mcq",
      "group": "Topic 1.1 challenge MCQ",
      "prompt": "<figure><div data-tandem-plot=\"wave\"></div><figcaption>The line-segment graph defines w on −3 ≤ x ≤ 3.</figcaption></figure>What is the complete preimage of 4?",
      "choices": [
        "\\(\\{4\\}\\)",
        "\\(\\{-3,3\\}\\)",
        "\\(\\{-3,0,3\\}\\)",
        "\\([-3,3]\\)"
      ],
      "answer": 2,
      "hint": "Follow the horizontal line and include the domain endpoints.",
      "solution": "The output is 4 at exactly −3, 0 and 3. Shared outputs do not violate the function condition.",
      "ek": "1.1.A.2",
      "calculator": false
    },
    {
      "id": "ch04",
      "type": "mcq",
      "group": "Topic 1.1 challenge MCQ",
      "prompt": "<figure><div data-tandem-plot=\"evidence\"></div><figcaption>The solid blue and dashed gold graphs both contain the four green sample points.</figcaption></figure>What do the two graphs demonstrate?",
      "choices": [
        "Four increasing sample outputs force every matching graph to increase.",
        "Matching samples force equal functions on the whole interval.",
        "A function must pass the horizontal-line test.",
        "The finite table can be compatible with different behavior between its sampled inputs."
      ],
      "answer": 3,
      "hint": "Compare the gold graph between x = 0.5 and x = 1.5.",
      "solution": "The graphs share the sampled values, but the gold graph decreases between some of them. Finite agreement leaves other inputs unspecified.",
      "ek": "1.1.A.2",
      "calculator": false
    }
  ],
  "frqs": [
    {
      "id": "frq01",
      "title": "FRQ · Battery performance",
      "context": "<div class=\"table-wrap\"><table><caption>Selected measurements of remaining energy E(t), in watt-hours, at time t, in hours.</caption><tbody><tr><th scope=\"row\">t</th><td>0</td><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td></tr><tr><th scope=\"row\">E(t)</th><td>80</td><td>68</td><td>58</td><td>50</td><td>44</td><td>40</td></tr></tbody></table></div>",
      "parts": [
        {
          "label": "(A)",
          "prompt": "Identify the input and output quantities with units. Compare E(1) and E(4) in context.",
          "marks": 2,
          "rubric": "<p><strong>Worked response:</strong> t is time in hours; E(t) is remaining energy in watt-hours. \\(E(1)=68>44=E(4)\\), so 24 more watt-hours remain at hour 1 than at hour 4.</p><ol><li>1 point: Correct quantities and units.</li><li>1 point: Correct comparison with a contextual interpretation.</li></ol>"
        },
        {
          "label": "(B)",
          "prompt": "Describe the output pattern at the listed inputs. Explain how the sizes of the decreases change.",
          "marks": 2,
          "rubric": "<p><strong>Worked response:</strong> The listed energy values decrease. Successive changes are −12, −10, −8, −6 and −4 watt-hours, so the losses become smaller.</p><ol><li>1 point: Decreasing output pattern at the listed inputs.</li><li>1 point: Correct explanation that the decreases become smaller in magnitude.</li></ol>"
        },
        {
          "label": "(C)",
          "prompt": "State the concavity suggested by these equal-time observations. Explain why the table alone does not establish that concavity throughout the interval.",
          "marks": 2,
          "rubric": "<p><strong>Worked response:</strong> The pattern suggests concave up because the changes become less negative. The finite table supplies no values at the intervening times.</p><ol><li>1 point: Concave up with an appropriate explanation.</li><li>1 point: Acknowledge that intervening behavior is not determined by these finite observations.</li></ol>"
        }
      ],
      "totalMarks": 6,
      "calculator": false,
      "calculatorLabel": "No calculator",
      "group": "AP-style topic FRQ"
    },
    {
      "id": "frq02",
      "title": "FRQ · One graph, several questions",
      "context": "<figure><div data-tandem-plot=\"reader\"></div><figcaption>Line segments connect the labeled points; the graph defines f on the entire displayed domain.</figcaption></figure>",
      "parts": [
        {
          "label": "(A)",
          "prompt": "State the domain and range of f.",
          "marks": 2,
          "rubric": "<p><strong>Worked response:</strong> Domain \\([-4,4]\\); range \\([-2,2]\\).</p><ol><li>1 point: Correct complete domain.</li><li>1 point: Correct complete range.</li></ol>"
        },
        {
          "label": "(B)",
          "prompt": "Find the image of 1 and the preimage of 2.",
          "marks": 2,
          "rubric": "<p><strong>Worked response:</strong> \\(f(1)=0\\). The preimage of 2 is \\([-2,0]\\), including all inputs along the horizontal segment.</p><ol><li>1 point: Image 0.</li><li>1 point: Complete preimage interval, not only its endpoints.</li></ol>"
        },
        {
          "label": "(C)",
          "prompt": "State all zeros of f and the intervals on which f is increasing.",
          "marks": 2,
          "rubric": "<p><strong>Worked response:</strong> Zeros: \\(-3,1,4\\). Increasing from −4 to −2 and from 2 to 4.</p><ol><li>1 point: All three zeros as input values.</li><li>1 point: Both increasing intervals. Do not distinguish open and closed interval notation for this monotonicity statement.</li></ol>"
        }
      ],
      "totalMarks": 6,
      "calculator": false,
      "calculatorLabel": "No calculator",
      "group": "AP-style topic FRQ"
    },
    {
      "id": "frq03",
      "title": "FRQ · Construct an oven-temperature graph",
      "context": "An oven begins at 20°C. From 0 to 2 minutes it heats faster and faster. From 2 to 4 minutes its temperature continues to rise, but more slowly. From 4 to 6 minutes it stays at 100°C. Use the <button class=\"btn secondary small\" data-go=\"builder-lab\">context graph builder</button> or sketch on paper; describe your construction below.",
      "parts": [
        {
          "label": "(A)",
          "prompt": "Label both axes with quantities and units, and mark the initial point.",
          "marks": 2,
          "rubric": "<p><strong>Worked response:</strong> Horizontal axis: time t in minutes. Vertical axis: temperature T(t) in °C. Initial point \\((0,20)\\).</p><ol><li>1 point: Correct axes and units.</li><li>1 point: Initial point (0,20).</li></ol>"
        },
        {
          "label": "(B)",
          "prompt": "Construct and describe the first two stages, including direction and concavity. Exact intermediate temperatures are not specified.",
          "marks": 2,
          "rubric": "<p><strong>Worked response:</strong> From 0 to 2 the curve rises and is concave up. From 2 to 4 it continues rising and is concave down. Many vertical scales and joining heights can satisfy the story.</p><ol><li>1 point: First stage increasing and concave up.</li><li>1 point: Second stage increasing and concave down.</li></ol>"
        },
        {
          "label": "(C)",
          "prompt": "Complete the last stage. Explain why a decreasing rate of change from 2 to 4 minutes does not mean that the temperature falls.",
          "marks": 2,
          "rubric": "<p><strong>Worked response:</strong> The graph is horizontal at 100°C from t = 4 to t = 6. During the previous stage, the positive rate becomes smaller, but temperature still rises.</p><ol><li>1 point: Horizontal final stage at 100°C.</li><li>1 point: Distinguish a falling positive rate from a falling output.</li></ol>"
        }
      ],
      "totalMarks": 6,
      "calculator": false,
      "calculatorLabel": "No calculator",
      "group": "AP-style topic FRQ"
    },
    {
      "id": "frq04",
      "title": "FRQ · Calculator-supported function reading",
      "context": "Let \\(p(x)=0.08(x+4)(x-1)(x-5)\\) on \\([-5,6]\\). Use a graphing calculator. A suitable initial window is −5 ≤ x ≤ 6 and −6 ≤ y ≤ 6.",
      "parts": [
        {
          "label": "(A)",
          "prompt": "Find p(−2.4) and p(1.7), each rounded to three decimal places.",
          "marks": 2,
          "rubric": "<p><strong>Worked response:</strong> \\(p(-2.4)=3.22048\\approx3.220\\); \\(p(1.7)=-1.05336\\approx-1.053\\).</p><ol><li>1 point: 3.220 with the required three decimal places.</li><li>1 point: −1.053.</li></ol>"
        },
        {
          "label": "(B)",
          "prompt": "Estimate the input values where the graph changes between increasing and decreasing. Use them to describe its increasing and decreasing intervals within the given domain.",
          "marks": 2,
          "rubric": "<p><strong>Worked response:</strong> The turning inputs are approximately −1.94 and 3.27. The graph increases from −5 to about −1.94 and from about 3.27 to 6, and decreases between the two turning inputs.</p><ol><li>1 point: Both approximate turning inputs.</li><li>1 point: Correct direction intervals; endpoint bracket distinctions are not assessed.</li></ol>"
        },
        {
          "label": "(C)",
          "prompt": "Identify all zeros of p. Explain why the graph can have three zeros and still represent a function.",
          "marks": 2,
          "rubric": "<p><strong>Worked response:</strong> Zeros are −4, 1 and 5. Multiple inputs may yield output 0; each input still has exactly one output.</p><ol><li>1 point: All three zeros.</li><li>1 point: Correct function explanation.</li></ol>"
        }
      ],
      "totalMarks": 6,
      "calculator": true,
      "calculatorLabel": "Graphing calculator required",
      "group": "AP-style topic FRQ"
    },
    {
      "id": "challenge01",
      "title": "Challenge FRQ · Construct from constraints",
      "context": "Construct a continuous function on \\([-2,6]\\) with zeros at −2 and 4. It must increase, then decrease, then increase again. Its first increasing portion must be concave down and its last increasing portion concave up. Output 3 must have at least two preimages.",
      "parts": [
        {
          "label": "(A)",
          "prompt": "Give a sketch or a piecewise rule satisfying the required zeros and direction sequence.",
          "marks": 2,
          "rubric": "<p><strong>Worked response:</strong> One rule is \\(f(x)=4-x^2\\) for \\(-2\\le x\\le0\\); \\(f(x)=4-x\\) for \\(0<x\\le4\\); and \\(f(x)=(x-4)^2\\) for \\(4<x\\le6\\).</p><figure><div data-tandem-plot=\"constraints\"></div><figcaption>One valid construction; many different graphs can meet the conditions.</figcaption></figure><ol><li>1 point: Correct zeros at −2 and 4.</li><li>1 point: A function with the required increase → decrease → increase sequence; joined values agree.</li></ol>"
        },
        {
          "label": "(B)",
          "prompt": "Explain how your graph meets the two concavity conditions.",
          "marks": 2,
          "rubric": "<p><strong>Worked response:</strong> In the displayed construction, the first rising curve becomes flatter, so it is concave down. The last rising curve becomes steeper, so it is concave up.</p><ol><li>1 point: Correct first increasing portion and concavity.</li><li>1 point: Correct last increasing portion and concavity.</li></ol>"
        },
        {
          "label": "(C)",
          "prompt": "Identify at least two preimages of 3 for your function. Explain why multiple preimages are allowed.",
          "marks": 2,
          "rubric": "<p><strong>Worked response:</strong> For the construction above, \\(f(-1)=3\\) and \\(f(1)=3\\). Multiple inputs may share an output; each input still receives exactly one output.</p><ol><li>1 point: Two valid distinct preimages for the student’s own construction.</li><li>1 point: Correct explanation of the function condition.</li></ol>"
        }
      ],
      "totalMarks": 6,
      "calculator": false,
      "calculatorLabel": "No calculator",
      "group": "Topic 1.1 challenge FRQ"
    },
    {
      "id": "challenge02",
      "title": "Challenge FRQ · Match the table, change the behavior",
      "context": "<div class=\"table-wrap\"><table><caption>These are selected values, not a complete specification of a function on [0,3].</caption><tbody><tr><th scope=\"row\">x</th><td>0</td><td>1</td><td>2</td><td>3</td></tr><tr><th scope=\"row\">f(x)</th><td>0</td><td>1</td><td>4</td><td>9</td></tr></tbody></table></div>",
      "parts": [
        {
          "label": "(A)",
          "prompt": "Give one function on [0,3] that matches the table and is increasing.",
          "marks": 2,
          "rubric": "<p><strong>Worked response:</strong> \\(f(x)=x^2\\) on \\([0,3]\\) matches all four values and is increasing on this nonnegative domain.</p><ol><li>1 point: A valid function matching all samples.</li><li>1 point: Correct increasing behavior on the stated domain.</li></ol>"
        },
        {
          "label": "(B)",
          "prompt": "Construct another function matching all four values that is not increasing throughout [0,3]. Explain where it decreases.",
          "marks": 2,
          "rubric": "<p><strong>Worked response:</strong> Connect (0,0), (0.5,3), (1,1), (1.5,−1), (2,4), (2.5,7), and (3,9) with line segments. This defines one output per input and decreases from x = 0.5 to x = 1.5.</p><figure><div data-tandem-plot=\"evidence\"></div><figcaption>The extra vertices give a specific counterexample between the fixed samples.</figcaption></figure><ol><li>1 point: A valid second function through all four required points.</li><li>1 point: Identify an interval where that function decreases.</li></ol>"
        },
        {
          "label": "(C)",
          "prompt": "Explain why these two functions need not be equal, and state what the table does establish.",
          "marks": 2,
          "rubric": "<p><strong>Worked response:</strong> They have the same domain but differ at unlisted inputs, for example x = 0.5. The table establishes exact values at the four listed inputs, not the intervening behavior.</p><ol><li>1 point: A shared input where the constructed functions differ.</li><li>1 point: An appropriately limited statement about the finite table.</li></ol>"
        }
      ],
      "totalMarks": 6,
      "calculator": false,
      "calculatorLabel": "No calculator",
      "group": "Topic 1.1 challenge FRQ"
    }
  ],
  "topic": "1.1",
  "objectives": [
    "1.1.A",
    "1.1.B"
  ]
};if(typeof module!=="undefined"&&module.exports)module.exports=data;else root.TandemQuestions=data;})(typeof window!=="undefined"?window:globalThis);
