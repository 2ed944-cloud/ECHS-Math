/* Original ECHS AP-style questions. User references inform skills; all new items are independently authored. */
(function(root){const data={
  "revision": "ap-precalculus-topic-1-1-v4",
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
    },
    {
      "id": "ex01",
      "type": "mcq",
      "group": "Rate tables",
      "prompt": "<div class=\"table-wrap\"><table><caption>Rate of change of f throughout each interval</caption><thead><tr><th scope=\"col\">Input interval</th><th scope=\"col\">-5 &lt; x &lt; -2</th><th scope=\"col\">-2 &lt; x &lt; 1</th><th scope=\"col\">1 &lt; x &lt; 4</th><th scope=\"col\">4 &lt; x &lt; 7</th></tr></thead><tbody><tr><th scope=\"row\">Rate behavior</th><td>Increasing</td><td>Positive and constant</td><td>Decreasing</td><td>Negative and constant</td></tr></tbody></table></div><p>On which interval is the graph of f concave down?</p>",
      "choices": [
        "-5 &lt; x &lt; -2",
        "-2 &lt; x &lt; 1",
        "1 &lt; x &lt; 4",
        "4 &lt; x &lt; 7"
      ],
      "answer": 2,
      "hint": "Ignore the sign initially. Ask whether the rate itself increases or decreases.",
      "solution": "The rate is decreasing on 1 &lt; x &lt; 4, so the graph is concave down. A constant rate gives a straight segment. The sign of the rate describes output direction, not concavity.",
      "ek": "1.1.B.3–4",
      "calculator": false,
      "family": "Rate tables",
      "audit": {
        "bounds": [
          -5,
          -2,
          1,
          4,
          7
        ],
        "behaviors": [
          "Increasing",
          "Positive and constant",
          "Decreasing",
          "Negative and constant"
        ],
        "target": "down",
        "originalAnswer": 2
      }
    },
    {
      "id": "ex02",
      "type": "mcq",
      "group": "Rate tables",
      "prompt": "<div class=\"table-wrap\"><table><caption>Rate of change of f throughout each interval</caption><thead><tr><th scope=\"col\">Input interval</th><th scope=\"col\">2 &lt; x &lt; 5</th><th scope=\"col\">5 &lt; x &lt; 8</th><th scope=\"col\">8 &lt; x &lt; 11</th><th scope=\"col\">11 &lt; x &lt; 14</th></tr></thead><tbody><tr><th scope=\"row\">Rate behavior</th><td>Negative and constant</td><td>Decreasing</td><td>Positive and constant</td><td>Increasing</td></tr></tbody></table></div><p>On which interval is the graph of f concave up?</p>",
      "choices": [
        "11 &lt; x &lt; 14",
        "2 &lt; x &lt; 5",
        "5 &lt; x &lt; 8",
        "8 &lt; x &lt; 11"
      ],
      "answer": 0,
      "hint": "Ignore the sign initially. Ask whether the rate itself increases or decreases.",
      "solution": "The rate is increasing on 11 &lt; x &lt; 14, so the graph is concave up. A constant rate gives a straight segment. The sign of the rate describes output direction, not concavity.",
      "ek": "1.1.B.3–4",
      "calculator": false,
      "family": "Rate tables",
      "audit": {
        "bounds": [
          2,
          5,
          8,
          11,
          14
        ],
        "behaviors": [
          "Negative and constant",
          "Decreasing",
          "Positive and constant",
          "Increasing"
        ],
        "target": "up",
        "originalAnswer": 3
      }
    },
    {
      "id": "ex03",
      "type": "mcq",
      "group": "Rate tables",
      "prompt": "<div class=\"table-wrap\"><table><caption>Rate of change of f throughout each interval</caption><thead><tr><th scope=\"col\">Input interval</th><th scope=\"col\">-8 &lt; x &lt; -4</th><th scope=\"col\">-4 &lt; x &lt; 0</th><th scope=\"col\">0 &lt; x &lt; 4</th><th scope=\"col\">4 &lt; x &lt; 8</th></tr></thead><tbody><tr><th scope=\"row\">Rate behavior</th><td>Positive and constant</td><td>Increasing</td><td>Negative and constant</td><td>Decreasing</td></tr></tbody></table></div><p>On which interval is the graph of f concave down?</p>",
      "choices": [
        "0 &lt; x &lt; 4",
        "4 &lt; x &lt; 8",
        "-8 &lt; x &lt; -4",
        "-4 &lt; x &lt; 0"
      ],
      "answer": 1,
      "hint": "Ignore the sign initially. Ask whether the rate itself increases or decreases.",
      "solution": "The rate is decreasing on 4 &lt; x &lt; 8, so the graph is concave down. A constant rate gives a straight segment. The sign of the rate describes output direction, not concavity.",
      "ek": "1.1.B.3–4",
      "calculator": false,
      "family": "Rate tables",
      "audit": {
        "bounds": [
          -8,
          -4,
          0,
          4,
          8
        ],
        "behaviors": [
          "Positive and constant",
          "Increasing",
          "Negative and constant",
          "Decreasing"
        ],
        "target": "down",
        "originalAnswer": 3
      }
    },
    {
      "id": "ex04",
      "type": "mcq",
      "group": "Rate tables",
      "prompt": "<div class=\"table-wrap\"><table><caption>Rate of change of f throughout each interval</caption><thead><tr><th scope=\"col\">Input interval</th><th scope=\"col\">1 &lt; x &lt; 3</th><th scope=\"col\">3 &lt; x &lt; 5</th><th scope=\"col\">5 &lt; x &lt; 7</th><th scope=\"col\">7 &lt; x &lt; 9</th></tr></thead><tbody><tr><th scope=\"row\">Rate behavior</th><td>Decreasing</td><td>Negative and constant</td><td>Increasing</td><td>Positive and constant</td></tr></tbody></table></div><p>On which interval is the graph of f concave up?</p>",
      "choices": [
        "3 &lt; x &lt; 5",
        "5 &lt; x &lt; 7",
        "7 &lt; x &lt; 9",
        "1 &lt; x &lt; 3"
      ],
      "answer": 1,
      "hint": "Ignore the sign initially. Ask whether the rate itself increases or decreases.",
      "solution": "The rate is increasing on 5 &lt; x &lt; 7, so the graph is concave up. A constant rate gives a straight segment. The sign of the rate describes output direction, not concavity.",
      "ek": "1.1.B.3–4",
      "calculator": false,
      "family": "Rate tables",
      "audit": {
        "bounds": [
          1,
          3,
          5,
          7,
          9
        ],
        "behaviors": [
          "Decreasing",
          "Negative and constant",
          "Increasing",
          "Positive and constant"
        ],
        "target": "up",
        "originalAnswer": 2
      }
    },
    {
      "id": "ex05",
      "type": "mcq",
      "group": "Rate tables",
      "prompt": "<div class=\"table-wrap\"><table><caption>Rate of change of f throughout each interval</caption><thead><tr><th scope=\"col\">Input interval</th><th scope=\"col\">-6 &lt; x &lt; -3</th><th scope=\"col\">-3 &lt; x &lt; 0</th><th scope=\"col\">0 &lt; x &lt; 3</th><th scope=\"col\">3 &lt; x &lt; 6</th></tr></thead><tbody><tr><th scope=\"row\">Rate behavior</th><td>Negative and increasing</td><td>Negative and constant</td><td>Positive and decreasing</td><td>Positive and constant</td></tr></tbody></table></div><p>On which interval is the graph of f concave up?</p>",
      "choices": [
        "-6 &lt; x &lt; -3",
        "-3 &lt; x &lt; 0",
        "0 &lt; x &lt; 3",
        "3 &lt; x &lt; 6"
      ],
      "answer": 0,
      "hint": "Ignore the sign initially. Ask whether the rate itself increases or decreases.",
      "solution": "The rate is increasing on -6 &lt; x &lt; -3, so the graph is concave up. A constant rate gives a straight segment. The sign of the rate describes output direction, not concavity.",
      "ek": "1.1.B.3–4",
      "calculator": false,
      "family": "Rate tables",
      "audit": {
        "bounds": [
          -6,
          -3,
          0,
          3,
          6
        ],
        "behaviors": [
          "Negative and increasing",
          "Negative and constant",
          "Positive and decreasing",
          "Positive and constant"
        ],
        "target": "up",
        "originalAnswer": 0
      }
    },
    {
      "id": "ex06",
      "type": "mcq",
      "group": "Rate tables",
      "prompt": "<div class=\"table-wrap\"><table><caption>Rate of change of f throughout each interval</caption><thead><tr><th scope=\"col\">Input interval</th><th scope=\"col\">0 &lt; x &lt; 4</th><th scope=\"col\">4 &lt; x &lt; 8</th><th scope=\"col\">8 &lt; x &lt; 12</th><th scope=\"col\">12 &lt; x &lt; 16</th></tr></thead><tbody><tr><th scope=\"row\">Rate behavior</th><td>Negative and decreasing</td><td>Positive and constant</td><td>Negative and constant</td><td>Positive and increasing</td></tr></tbody></table></div><p>On which interval is the graph of f concave down?</p>",
      "choices": [
        "12 &lt; x &lt; 16",
        "0 &lt; x &lt; 4",
        "4 &lt; x &lt; 8",
        "8 &lt; x &lt; 12"
      ],
      "answer": 1,
      "hint": "Ignore the sign initially. Ask whether the rate itself increases or decreases.",
      "solution": "The rate is decreasing on 0 &lt; x &lt; 4, so the graph is concave down. A constant rate gives a straight segment. The sign of the rate describes output direction, not concavity.",
      "ek": "1.1.B.3–4",
      "calculator": false,
      "family": "Rate tables",
      "audit": {
        "bounds": [
          0,
          4,
          8,
          12,
          16
        ],
        "behaviors": [
          "Negative and decreasing",
          "Positive and constant",
          "Negative and constant",
          "Positive and increasing"
        ],
        "target": "down",
        "originalAnswer": 0
      }
    },
    {
      "id": "ex07",
      "type": "mcq",
      "group": "Rate tables",
      "prompt": "<p>Throughout −7 &lt; x &lt; −1, a function has a negative, constant rate of change. Which description is correct?</p>",
      "choices": [
        "Increasing and concave up",
        "Constant output",
        "Decreasing and linear",
        "Decreasing and concave down"
      ],
      "answer": 2,
      "hint": "A constant rate is not necessarily a zero rate.",
      "solution": "A negative rate makes f decrease. Because the rate stays constant, the graph is a straight descending segment; it has no upward or downward bend.",
      "ek": "1.1.B.3–4",
      "calculator": false,
      "family": "Rate tables"
    },
    {
      "id": "ex08",
      "type": "mcq",
      "group": "Rate tables",
      "prompt": "<p>A table reports only that the rate of change increases throughout 4 &lt; x &lt; 10. Which statement must be true?</p>",
      "choices": [
        "The output is positive.",
        "The output increases throughout the interval.",
        "The rate is positive throughout the interval.",
        "The graph is concave up."
      ],
      "answer": 3,
      "hint": "An increasing rate might still be negative.",
      "solution": "Concavity follows from how the rate changes. Rates such as −9, −5 and −2 increase while remaining negative. The sign of f and the direction of f are not determined.",
      "ek": "1.1.B.3–4",
      "calculator": false,
      "family": "Rate tables"
    },
    {
      "id": "ex09",
      "type": "mcq",
      "group": "Direction and concavity",
      "prompt": "<div class=\"table-wrap\"><table><caption>Rate of change of f throughout each interval</caption><thead><tr><th scope=\"col\">Input interval</th><th scope=\"col\">-9 &lt; x &lt; -6</th><th scope=\"col\">-6 &lt; x &lt; -3</th><th scope=\"col\">-3 &lt; x &lt; 0</th><th scope=\"col\">0 &lt; x &lt; 3</th></tr></thead><tbody><tr><th scope=\"row\">Rate behavior</th><td>Positive and increasing</td><td>Negative and increasing</td><td>Positive and decreasing</td><td>Negative and decreasing</td></tr></tbody></table></div><p>Which statement describes f on -6 &lt; x &lt; -3?</p>",
      "choices": [
        "f is increasing, and its graph is concave up.",
        "f is increasing, and its graph is concave down.",
        "f is decreasing, and its graph is concave up.",
        "f is decreasing, and its graph is concave down."
      ],
      "answer": 2,
      "hint": "Read the description twice: the sign tells direction; increasing/decreasing tells concavity.",
      "solution": "The rate is negative and increasing. Its sign means f is decreasing. The change in the rate means the graph is concave up.",
      "ek": "1.1.B.3–4",
      "calculator": false,
      "family": "Direction and concavity",
      "audit": {
        "behavior": "Negative and increasing",
        "direction": "decreasing",
        "concavity": "up"
      }
    },
    {
      "id": "ex10",
      "type": "mcq",
      "group": "Direction and concavity",
      "prompt": "<div class=\"table-wrap\"><table><caption>Rate of change of f throughout each interval</caption><thead><tr><th scope=\"col\">Input interval</th><th scope=\"col\">-7 &lt; x &lt; -4</th><th scope=\"col\">-4 &lt; x &lt; -1</th><th scope=\"col\">-1 &lt; x &lt; 2</th><th scope=\"col\">2 &lt; x &lt; 5</th></tr></thead><tbody><tr><th scope=\"row\">Rate behavior</th><td>Negative and increasing</td><td>Positive and decreasing</td><td>Negative and decreasing</td><td>Positive and increasing</td></tr></tbody></table></div><p>Which statement describes f on 2 &lt; x &lt; 5?</p>",
      "choices": [
        "f is decreasing, and its graph is concave down.",
        "f is increasing, and its graph is concave up.",
        "f is increasing, and its graph is concave down.",
        "f is decreasing, and its graph is concave up."
      ],
      "answer": 1,
      "hint": "Read the description twice: the sign tells direction; increasing/decreasing tells concavity.",
      "solution": "The rate is positive and increasing. Its sign means f is increasing. The change in the rate means the graph is concave up.",
      "ek": "1.1.B.3–4",
      "calculator": false,
      "family": "Direction and concavity",
      "audit": {
        "behavior": "Positive and increasing",
        "direction": "increasing",
        "concavity": "up"
      }
    },
    {
      "id": "ex11",
      "type": "mcq",
      "group": "Direction and concavity",
      "prompt": "<div class=\"table-wrap\"><table><caption>Rate of change of f throughout each interval</caption><thead><tr><th scope=\"col\">Input interval</th><th scope=\"col\">-5 &lt; x &lt; -2</th><th scope=\"col\">-2 &lt; x &lt; 1</th><th scope=\"col\">1 &lt; x &lt; 4</th><th scope=\"col\">4 &lt; x &lt; 7</th></tr></thead><tbody><tr><th scope=\"row\">Rate behavior</th><td>Positive and decreasing</td><td>Negative and decreasing</td><td>Positive and increasing</td><td>Negative and increasing</td></tr></tbody></table></div><p>Which statement describes f on -2 &lt; x &lt; 1?</p>",
      "choices": [
        "f is decreasing, and its graph is concave up.",
        "f is decreasing, and its graph is concave down.",
        "f is increasing, and its graph is concave up.",
        "f is increasing, and its graph is concave down."
      ],
      "answer": 1,
      "hint": "Read the description twice: the sign tells direction; increasing/decreasing tells concavity.",
      "solution": "The rate is negative and decreasing. Its sign means f is decreasing. The change in the rate means the graph is concave down.",
      "ek": "1.1.B.3–4",
      "calculator": false,
      "family": "Direction and concavity",
      "audit": {
        "behavior": "Negative and decreasing",
        "direction": "decreasing",
        "concavity": "down"
      }
    },
    {
      "id": "ex12",
      "type": "mcq",
      "group": "Direction and concavity",
      "prompt": "<div class=\"table-wrap\"><table><caption>Rate of change of f throughout each interval</caption><thead><tr><th scope=\"col\">Input interval</th><th scope=\"col\">-3 &lt; x &lt; 0</th><th scope=\"col\">0 &lt; x &lt; 3</th><th scope=\"col\">3 &lt; x &lt; 6</th><th scope=\"col\">6 &lt; x &lt; 9</th></tr></thead><tbody><tr><th scope=\"row\">Rate behavior</th><td>Negative and decreasing</td><td>Positive and increasing</td><td>Negative and increasing</td><td>Positive and decreasing</td></tr></tbody></table></div><p>Which statement describes f on 6 &lt; x &lt; 9?</p>",
      "choices": [
        "f is increasing, and its graph is concave down.",
        "f is decreasing, and its graph is concave up.",
        "f is decreasing, and its graph is concave down.",
        "f is increasing, and its graph is concave up."
      ],
      "answer": 0,
      "hint": "Read the description twice: the sign tells direction; increasing/decreasing tells concavity.",
      "solution": "The rate is positive and decreasing. Its sign means f is increasing. The change in the rate means the graph is concave down.",
      "ek": "1.1.B.3–4",
      "calculator": false,
      "family": "Direction and concavity",
      "audit": {
        "behavior": "Positive and decreasing",
        "direction": "increasing",
        "concavity": "down"
      }
    },
    {
      "id": "ex13",
      "type": "mcq",
      "group": "Direction and concavity",
      "prompt": "<div class=\"table-wrap\"><table><caption>Rate of change of f throughout each interval</caption><thead><tr><th scope=\"col\">Input interval</th><th scope=\"col\">-1 &lt; x &lt; 2</th><th scope=\"col\">2 &lt; x &lt; 5</th><th scope=\"col\">5 &lt; x &lt; 8</th><th scope=\"col\">8 &lt; x &lt; 11</th></tr></thead><tbody><tr><th scope=\"row\">Rate behavior</th><td>Positive and increasing</td><td>Negative and increasing</td><td>Positive and decreasing</td><td>Negative and decreasing</td></tr></tbody></table></div><p>Which statement describes f on 2 &lt; x &lt; 5?</p>",
      "choices": [
        "f is increasing, and its graph is concave up.",
        "f is increasing, and its graph is concave down.",
        "f is decreasing, and its graph is concave up.",
        "f is decreasing, and its graph is concave down."
      ],
      "answer": 2,
      "hint": "Read the description twice: the sign tells direction; increasing/decreasing tells concavity.",
      "solution": "The rate is negative and increasing. Its sign means f is decreasing. The change in the rate means the graph is concave up.",
      "ek": "1.1.B.3–4",
      "calculator": false,
      "family": "Direction and concavity",
      "audit": {
        "behavior": "Negative and increasing",
        "direction": "decreasing",
        "concavity": "up"
      }
    },
    {
      "id": "ex14",
      "type": "mcq",
      "group": "Direction and concavity",
      "prompt": "<div class=\"table-wrap\"><table><caption>Rate of change of f throughout each interval</caption><thead><tr><th scope=\"col\">Input interval</th><th scope=\"col\">1 &lt; x &lt; 4</th><th scope=\"col\">4 &lt; x &lt; 7</th><th scope=\"col\">7 &lt; x &lt; 10</th><th scope=\"col\">10 &lt; x &lt; 13</th></tr></thead><tbody><tr><th scope=\"row\">Rate behavior</th><td>Negative and increasing</td><td>Positive and decreasing</td><td>Negative and decreasing</td><td>Positive and increasing</td></tr></tbody></table></div><p>Which statement describes f on 10 &lt; x &lt; 13?</p>",
      "choices": [
        "f is decreasing, and its graph is concave down.",
        "f is increasing, and its graph is concave up.",
        "f is increasing, and its graph is concave down.",
        "f is decreasing, and its graph is concave up."
      ],
      "answer": 1,
      "hint": "Read the description twice: the sign tells direction; increasing/decreasing tells concavity.",
      "solution": "The rate is positive and increasing. Its sign means f is increasing. The change in the rate means the graph is concave up.",
      "ek": "1.1.B.3–4",
      "calculator": false,
      "family": "Direction and concavity",
      "audit": {
        "behavior": "Positive and increasing",
        "direction": "increasing",
        "concavity": "up"
      }
    },
    {
      "id": "ex15",
      "type": "mcq",
      "group": "Direction and concavity",
      "prompt": "<p>A sensor reading is below zero. Over 6 &lt; t &lt; 12, it falls, but each equal time step produces a smaller drop. Which description fits the reading?</p>",
      "choices": [
        "f is decreasing, and its graph is concave up.",
        "f is decreasing, and its graph is concave down.",
        "f is increasing, and its graph is concave up.",
        "f is increasing, and its graph is concave down."
      ],
      "answer": 0,
      "hint": "Compare the signed changes: for example −8, then −5, then −2.",
      "solution": "The reading decreases. Its negative changes become less negative, so the rate increases and the graph is concave up. A negative reading is separate information about its height on the graph.",
      "ek": "1.1.B.3–4",
      "calculator": false,
      "family": "Direction and concavity"
    },
    {
      "id": "ex16",
      "type": "mcq",
      "group": "Direction and concavity",
      "prompt": "<p>A student says, “The graph bends downward, so the function must decrease.” Which is a counterexample?</p>",
      "choices": [
        "A function whose negative rate decreases from −3 to −9",
        "A constant function with output 9",
        "A function whose positive rate increases from 3 to 9",
        "A function whose positive rate decreases from 9 to 3"
      ],
      "answer": 3,
      "hint": "Find a graph that rises while flattening.",
      "solution": "A positive but decreasing rate produces increasing outputs and concave-down behavior. Thus downward concavity alone does not imply decreasing outputs.",
      "ek": "1.1.B.3–4",
      "calculator": false,
      "family": "Direction and concavity"
    },
    {
      "id": "ex17",
      "type": "mcq",
      "group": "Rate from a graph",
      "prompt": "<div data-context-plot=\"cubic\" data-spec=\"{&quot;center&quot;:1,&quot;width&quot;:2,&quot;sign&quot;:-1,&quot;scale&quot;:2,&quot;shift&quot;:4,&quot;lo&quot;:1,&quot;hi&quot;:5}\"></div><p>The highlighted interval is 1 &lt; x &lt; 5. Which statement is true throughout that interval?</p>",
      "choices": [
        "The rate of change is positive.",
        "The rate of change is negative.",
        "The rate of change is increasing.",
        "The rate of change is decreasing."
      ],
      "answer": 3,
      "hint": "Read the steepness from left to right. Include the portion after the turning point.",
      "solution": "The graph is concave down throughout the highlighted interval, so the rate of change is decreasing. The interval contains a turning point, so the rate changes sign; it is not positive throughout or negative throughout.",
      "ek": "1.1.B.3–4",
      "calculator": false,
      "family": "Rate from a graph",
      "audit": {
        "center": 1,
        "width": 2,
        "sign": -1,
        "scale": 2,
        "shift": 4,
        "lo": 1,
        "hi": 5
      }
    },
    {
      "id": "ex18",
      "type": "mcq",
      "group": "Rate from a graph",
      "prompt": "<div data-context-plot=\"cubic\" data-spec=\"{&quot;center&quot;:-2,&quot;width&quot;:2,&quot;sign&quot;:1,&quot;scale&quot;:2,&quot;shift&quot;:5,&quot;lo&quot;:-6,&quot;hi&quot;:-2}\"></div><p>The highlighted interval is -6 &lt; x &lt; -2. Which statement is true throughout that interval?</p>",
      "choices": [
        "The rate of change is decreasing.",
        "The rate of change is positive.",
        "The rate of change is negative.",
        "The rate of change is increasing."
      ],
      "answer": 0,
      "hint": "Read the steepness from left to right. Include the portion after the turning point.",
      "solution": "The graph is concave down throughout the highlighted interval, so the rate of change is decreasing. The interval contains a turning point, so the rate changes sign; it is not positive throughout or negative throughout.",
      "ek": "1.1.B.3–4",
      "calculator": false,
      "family": "Rate from a graph",
      "audit": {
        "center": -2,
        "width": 2,
        "sign": 1,
        "scale": 2,
        "shift": 5,
        "lo": -6,
        "hi": -2
      }
    },
    {
      "id": "ex19",
      "type": "mcq",
      "group": "Rate from a graph",
      "prompt": "<div data-context-plot=\"cubic\" data-spec=\"{&quot;center&quot;:3,&quot;width&quot;:1.5,&quot;sign&quot;:-1,&quot;scale&quot;:1.5,&quot;shift&quot;:6,&quot;lo&quot;:0.0,&quot;hi&quot;:3}\"></div><p>The highlighted interval is 0 &lt; x &lt; 3. Which statement is true throughout that interval?</p>",
      "choices": [
        "The rate of change is increasing.",
        "The rate of change is decreasing.",
        "The rate of change is positive.",
        "The rate of change is negative."
      ],
      "answer": 0,
      "hint": "Read the steepness from left to right. Include the portion after the turning point.",
      "solution": "The graph is concave up throughout the highlighted interval, so the rate of change is increasing. The interval contains a turning point, so the rate changes sign; it is not positive throughout or negative throughout.",
      "ek": "1.1.B.3–4",
      "calculator": false,
      "family": "Rate from a graph",
      "audit": {
        "center": 3,
        "width": 1.5,
        "sign": -1,
        "scale": 1.5,
        "shift": 6,
        "lo": 0.0,
        "hi": 3
      }
    },
    {
      "id": "ex20",
      "type": "mcq",
      "group": "Rate from a graph",
      "prompt": "<div data-context-plot=\"cubic\" data-spec=\"{&quot;center&quot;:0,&quot;width&quot;:3,&quot;sign&quot;:1,&quot;scale&quot;:3,&quot;shift&quot;:7,&quot;lo&quot;:0,&quot;hi&quot;:6}\"></div><p>The highlighted interval is 0 &lt; x &lt; 6. Which statement is true throughout that interval?</p>",
      "choices": [
        "The rate of change is negative.",
        "The rate of change is increasing.",
        "The rate of change is decreasing.",
        "The rate of change is positive."
      ],
      "answer": 1,
      "hint": "Read the steepness from left to right. Include the portion after the turning point.",
      "solution": "The graph is concave up throughout the highlighted interval, so the rate of change is increasing. The interval contains a turning point, so the rate changes sign; it is not positive throughout or negative throughout.",
      "ek": "1.1.B.3–4",
      "calculator": false,
      "family": "Rate from a graph",
      "audit": {
        "center": 0,
        "width": 3,
        "sign": 1,
        "scale": 3,
        "shift": 7,
        "lo": 0,
        "hi": 6
      }
    },
    {
      "id": "ex21",
      "type": "mcq",
      "group": "Rate from a graph",
      "prompt": "<div data-context-plot=\"cubic\" data-spec=\"{&quot;center&quot;:-1,&quot;width&quot;:2,&quot;sign&quot;:-1,&quot;scale&quot;:2,&quot;shift&quot;:8,&quot;lo&quot;:-1,&quot;hi&quot;:3}\"></div><p>The highlighted interval is -1 &lt; x &lt; 3. Which statement is true throughout that interval?</p>",
      "choices": [
        "The rate of change is positive.",
        "The rate of change is negative.",
        "The rate of change is increasing.",
        "The rate of change is decreasing."
      ],
      "answer": 3,
      "hint": "Read the steepness from left to right. Include the portion after the turning point.",
      "solution": "The graph is concave down throughout the highlighted interval, so the rate of change is decreasing. The interval contains a turning point, so the rate changes sign; it is not positive throughout or negative throughout.",
      "ek": "1.1.B.3–4",
      "calculator": false,
      "family": "Rate from a graph",
      "audit": {
        "center": -1,
        "width": 2,
        "sign": -1,
        "scale": 2,
        "shift": 8,
        "lo": -1,
        "hi": 3
      }
    },
    {
      "id": "ex22",
      "type": "mcq",
      "group": "Rate from a graph",
      "prompt": "<div data-context-plot=\"cubic\" data-spec=\"{&quot;center&quot;:2,&quot;width&quot;:2,&quot;sign&quot;:1,&quot;scale&quot;:2,&quot;shift&quot;:9,&quot;lo&quot;:-2,&quot;hi&quot;:2}\"></div><p>The highlighted interval is -2 &lt; x &lt; 2. Which statement is true throughout that interval?</p>",
      "choices": [
        "The rate of change is decreasing.",
        "The rate of change is positive.",
        "The rate of change is negative.",
        "The rate of change is increasing."
      ],
      "answer": 0,
      "hint": "Read the steepness from left to right. Include the portion after the turning point.",
      "solution": "The graph is concave down throughout the highlighted interval, so the rate of change is decreasing. The interval contains a turning point, so the rate changes sign; it is not positive throughout or negative throughout.",
      "ek": "1.1.B.3–4",
      "calculator": false,
      "family": "Rate from a graph",
      "audit": {
        "center": 2,
        "width": 2,
        "sign": 1,
        "scale": 2,
        "shift": 9,
        "lo": -2,
        "hi": 2
      }
    },
    {
      "id": "ex23",
      "type": "mcq",
      "group": "Rate from a graph",
      "prompt": "<div data-context-plot=\"cubic\" data-spec=\"{&quot;center&quot;:2,&quot;width&quot;:2,&quot;sign&quot;:-1,&quot;scale&quot;:2,&quot;shift&quot;:6,&quot;lo&quot;:0,&quot;hi&quot;:4}\"></div><p>Between the marked local minimum at x = 0 and local maximum at x = 4, which description is correct?</p>",
      "choices": [
        "f increases throughout; its rate is constant.",
        "f increases throughout; its rate decreases throughout.",
        "f increases throughout; its rate first increases, then decreases.",
        "f decreases throughout; its rate first increases, then decreases."
      ],
      "answer": 2,
      "hint": "Direction can stay the same while the bend changes.",
      "solution": "The graph rises from the local minimum to the local maximum. It steepens up to x = 2 and flattens after x = 2, so the rate first increases and then decreases.",
      "ek": "1.1.B.3–4",
      "calculator": false,
      "family": "Rate from a graph",
      "audit": {
        "center": 2,
        "width": 2,
        "sign": -1,
        "scale": 2,
        "shift": 6,
        "lo": 0,
        "hi": 4
      }
    },
    {
      "id": "ex24",
      "type": "mcq",
      "group": "Rate from a graph",
      "prompt": "<div data-context-plot=\"cubic\" data-spec=\"{&quot;center&quot;:-1,&quot;width&quot;:2,&quot;sign&quot;:1,&quot;scale&quot;:2,&quot;shift&quot;:-3,&quot;lo&quot;:-1,&quot;hi&quot;:3}\"></div><p>A student says the rate must decrease wherever f decreases. Which feature refutes the claim?</p>",
      "choices": [
        "From x = −1 to x = 1, f decreases at a constant rate.",
        "Every point with a negative output has a negative rate.",
        "At a turning point the output must be zero.",
        "From x = −1 to x = 1, f decreases while the graph flattens and the rate increases."
      ],
      "answer": 3,
      "hint": "A descending graph can become less steep.",
      "solution": "From −1 to 1 the curve descends but becomes flatter toward its minimum. The rate is negative and increasing toward zero.",
      "ek": "1.1.B.3–4",
      "calculator": false,
      "family": "Rate from a graph",
      "audit": {
        "center": -1,
        "width": 2,
        "sign": 1,
        "scale": 2,
        "shift": -3,
        "lo": -1,
        "hi": 3
      }
    },
    {
      "id": "ex25",
      "type": "mcq",
      "group": "Circular motion",
      "prompt": "<p>A toy car moves at constant speed around a circular track of radius 2 m. One lap takes 8 s. The nearest point of the track is 0 m from a straight wall. The car starts at the nearest point and completes 2 laps without stopping.</p><p>Which graph represents the shortest distance from the car to the wall, in meters, versus elapsed time, in seconds?</p><div data-context-plot=\"car-options\" data-spec=\"{&quot;radius&quot;:2,&quot;period&quot;:8,&quot;gap&quot;:0,&quot;start&quot;:&quot;near&quot;,&quot;laps&quot;:2,&quot;order&quot;:[&quot;correct&quot;,&quot;signed&quot;,&quot;cumulative&quot;,&quot;triangle&quot;]}\"></div>",
      "choices": [
        "Graph A",
        "Graph B",
        "Graph C",
        "Graph D"
      ],
      "answer": 0,
      "hint": "Check the initial distance, nonnegative distance, number of repetitions and smooth turning behavior.",
      "solution": "Graph A. The distance repeats once per lap, ranges from 0 to 4 m and begins at 0 m. Each of the 2 smooth cycles takes 8 s. Total distance traveled would accumulate; distance to a fixed wall returns to its starting value.",
      "ek": "1.1.B.1–2",
      "calculator": false,
      "family": "Circular motion",
      "audit": {
        "radius": 2,
        "period": 8,
        "gap": 0,
        "start": "near",
        "laps": 2,
        "order": [
          "correct",
          "signed",
          "cumulative",
          "triangle"
        ]
      }
    },
    {
      "id": "ex26",
      "type": "mcq",
      "group": "Circular motion",
      "prompt": "<p>A toy car moves at constant speed around a circular track of radius 4 m. One lap takes 12 s. The nearest point of the track is 1 m from a straight wall. The car starts at the nearest point and completes 3 laps without stopping.</p><p>Which graph represents the shortest distance from the car to the wall, in meters, versus elapsed time, in seconds?</p><div data-context-plot=\"car-options\" data-spec=\"{&quot;radius&quot;:4,&quot;period&quot;:12,&quot;gap&quot;:1,&quot;start&quot;:&quot;near&quot;,&quot;laps&quot;:3,&quot;order&quot;:[&quot;triangle&quot;,&quot;correct&quot;,&quot;signed&quot;,&quot;cumulative&quot;]}\"></div>",
      "choices": [
        "Graph A",
        "Graph B",
        "Graph C",
        "Graph D"
      ],
      "answer": 1,
      "hint": "Check the initial distance, nonnegative distance, number of repetitions and smooth turning behavior.",
      "solution": "Graph B. The distance repeats once per lap, ranges from 1 to 9 m and begins at 1 m. Each of the 3 smooth cycles takes 12 s. Total distance traveled would accumulate; distance to a fixed wall returns to its starting value.",
      "ek": "1.1.B.1–2",
      "calculator": false,
      "family": "Circular motion",
      "audit": {
        "radius": 4,
        "period": 12,
        "gap": 1,
        "start": "near",
        "laps": 3,
        "order": [
          "triangle",
          "correct",
          "signed",
          "cumulative"
        ]
      }
    },
    {
      "id": "ex27",
      "type": "mcq",
      "group": "Circular motion",
      "prompt": "<p>A toy car moves at constant speed around a circular track of radius 3 m. One lap takes 10 s. The nearest point of the track is 2 m from a straight wall. The car starts at the farthest point and completes 2 laps without stopping.</p><p>Which graph represents the shortest distance from the car to the wall, in meters, versus elapsed time, in seconds?</p><div data-context-plot=\"car-options\" data-spec=\"{&quot;radius&quot;:3,&quot;period&quot;:10,&quot;gap&quot;:2,&quot;start&quot;:&quot;far&quot;,&quot;laps&quot;:2,&quot;order&quot;:[&quot;cumulative&quot;,&quot;triangle&quot;,&quot;correct&quot;,&quot;signed&quot;]}\"></div>",
      "choices": [
        "Graph A",
        "Graph B",
        "Graph C",
        "Graph D"
      ],
      "answer": 2,
      "hint": "Check the initial distance, nonnegative distance, number of repetitions and smooth turning behavior.",
      "solution": "Graph C. The distance repeats once per lap, ranges from 2 to 8 m and begins at 8 m. Each of the 2 smooth cycles takes 10 s. Total distance traveled would accumulate; distance to a fixed wall returns to its starting value.",
      "ek": "1.1.B.1–2",
      "calculator": false,
      "family": "Circular motion",
      "audit": {
        "radius": 3,
        "period": 10,
        "gap": 2,
        "start": "far",
        "laps": 2,
        "order": [
          "cumulative",
          "triangle",
          "correct",
          "signed"
        ]
      }
    },
    {
      "id": "ex28",
      "type": "mcq",
      "group": "Circular motion",
      "prompt": "<p>A toy car moves at constant speed around a circular track of radius 5 m. One lap takes 16 s. The nearest point of the track is 0 m from a straight wall. The car starts at the farthest point and completes 4 laps without stopping.</p><p>Which graph represents the shortest distance from the car to the wall, in meters, versus elapsed time, in seconds?</p><div data-context-plot=\"car-options\" data-spec=\"{&quot;radius&quot;:5,&quot;period&quot;:16,&quot;gap&quot;:0,&quot;start&quot;:&quot;far&quot;,&quot;laps&quot;:4,&quot;order&quot;:[&quot;signed&quot;,&quot;cumulative&quot;,&quot;triangle&quot;,&quot;correct&quot;]}\"></div>",
      "choices": [
        "Graph A",
        "Graph B",
        "Graph C",
        "Graph D"
      ],
      "answer": 3,
      "hint": "Check the initial distance, nonnegative distance, number of repetitions and smooth turning behavior.",
      "solution": "Graph D. The distance repeats once per lap, ranges from 0 to 10 m and begins at 10 m. Each of the 4 smooth cycles takes 16 s. Total distance traveled would accumulate; distance to a fixed wall returns to its starting value.",
      "ek": "1.1.B.1–2",
      "calculator": false,
      "family": "Circular motion",
      "audit": {
        "radius": 5,
        "period": 16,
        "gap": 0,
        "start": "far",
        "laps": 4,
        "order": [
          "signed",
          "cumulative",
          "triangle",
          "correct"
        ]
      }
    },
    {
      "id": "ex29",
      "type": "mcq",
      "group": "Circular motion",
      "prompt": "<p>A car moves at constant speed around a circular track of radius 3.5 m, starting at the closest point to a wall 1.5 m from the track. One lap takes 14 s. Which pair gives its smallest and largest wall distances?</p>",
      "choices": [
        "1.5 m and 8.5 m",
        "0 m and 7 m",
        "1.5 m and 5 m",
        "0 m and 8.5 m"
      ],
      "answer": 0,
      "hint": "The maximum adds the full diameter to the gap.",
      "solution": "The closest distance is the gap, 1.5 m. The farthest is 1.5 + 2(3.5) = 8.5 m.",
      "ek": "1.1.B.1–2",
      "calculator": false,
      "family": "Circular motion"
    },
    {
      "id": "ex30",
      "type": "mcq",
      "group": "Circular motion",
      "prompt": "<p>A car completes each circular lap in 20 s at constant speed. It starts nearest to a straight wall. During which interval in the first lap is its wall distance decreasing?</p>",
      "choices": [
        "5 &lt; t &lt; 15",
        "10 &lt; t &lt; 20",
        "0 &lt; t &lt; 10",
        "0 &lt; t &lt; 20"
      ],
      "answer": 1,
      "hint": "The opposite side is reached after half a lap.",
      "solution": "Distance increases on the outward half, 0 to 10 s, then decreases on the returning half, 10 to 20 s.",
      "ek": "1.1.A.3–4",
      "calculator": false,
      "family": "Circular motion"
    },
    {
      "id": "ex31",
      "type": "mcq",
      "group": "Circular motion",
      "prompt": "<p>A car starts nearest a wall on a circular track of radius 2.5 m, with a gap of 0.8 m. A lap takes 12 s at constant speed. What is its distance from the wall after 9 s?</p>",
      "choices": [
        "5.8 m",
        "2.5 m",
        "3.3 m",
        "0.8 m"
      ],
      "answer": 2,
      "hint": "At three quarters of a lap the car is horizontally level with the center of the track.",
      "solution": "At one quarter and three quarters of a lap, the perpendicular distance is gap + radius = 0.8 + 2.5 = 3.3 m.",
      "ek": "1.1.A.2",
      "calculator": false,
      "family": "Circular motion"
    },
    {
      "id": "ex32",
      "type": "mcq",
      "group": "Circular motion",
      "prompt": "<p>The radius of a circular track and its gap from a wall remain fixed. A car now travels at twice its previous constant speed. What changes in its wall-distance graph?</p>",
      "choices": [
        "The maximum distance doubles; the repetition time stays the same.",
        "Both the minimum and maximum distances halve.",
        "The time between successive minima doubles.",
        "The time between successive minima is halved; minimum and maximum distances stay the same."
      ],
      "answer": 3,
      "hint": "Separate horizontal timing from vertical distance.",
      "solution": "The car covers the same track in half the time. Geometry fixes the distances, so only the time scale changes.",
      "ek": "1.1.B.1–2",
      "calculator": false,
      "family": "Circular motion"
    },
    {
      "id": "ex33",
      "type": "mcq",
      "group": "Filling vessels",
      "prompt": "<p>Water enters an empty vessel at a constant 24 cm³/s, with no leakage. Depth increases at an increasing rate until 8 cm, then rises steadily and steeply through a narrow upper section. Which cross-sectional diagram is consistent with this depth–time graph?</p><div data-context-plot=\"vessel-options\" data-spec=\"{&quot;order&quot;:[&quot;neck&quot;,&quot;widening&quot;,&quot;cylinder&quot;,&quot;hourglass&quot;]}\"></div>",
      "choices": [
        "Vessel A",
        "Vessel B",
        "Vessel C",
        "Vessel D"
      ],
      "answer": 0,
      "hint": "The same added volume makes a greater rise in a narrower horizontal cross-section. Read each vessel from the bottom upward.",
      "solution": "Vessel A. At constant volume inflow, narrowing makes depth rise faster, widening makes it rise more slowly, and constant area makes depth rise steadily. Match those stages from the bottom upward.",
      "ek": "1.1.B.1–4",
      "calculator": false,
      "family": "Filling vessels",
      "audit": {
        "target": "neck",
        "order": [
          "neck",
          "widening",
          "cylinder",
          "hourglass"
        ]
      }
    },
    {
      "id": "ex34",
      "type": "mcq",
      "group": "Filling vessels",
      "prompt": "<p>Water enters an empty vessel at a constant 30 cm³/s, with no leakage. Depth increases at a decreasing rate until 8 cm, then rises steadily through a wide upper section. Which cross-sectional diagram is consistent with this depth–time graph?</p><div data-context-plot=\"vessel-options\" data-spec=\"{&quot;order&quot;:[&quot;hourglass&quot;,&quot;neck&quot;,&quot;widening&quot;,&quot;cylinder&quot;]}\"></div>",
      "choices": [
        "Vessel A",
        "Vessel B",
        "Vessel C",
        "Vessel D"
      ],
      "answer": 2,
      "hint": "The same added volume makes a greater rise in a narrower horizontal cross-section. Read each vessel from the bottom upward.",
      "solution": "Vessel C. At constant volume inflow, narrowing makes depth rise faster, widening makes it rise more slowly, and constant area makes depth rise steadily. Match those stages from the bottom upward.",
      "ek": "1.1.B.1–4",
      "calculator": false,
      "family": "Filling vessels",
      "audit": {
        "target": "widening",
        "order": [
          "hourglass",
          "neck",
          "widening",
          "cylinder"
        ]
      }
    },
    {
      "id": "ex35",
      "type": "mcq",
      "group": "Filling vessels",
      "prompt": "<p>Water enters an empty vessel at a constant 36 cm³/s, with no leakage. Depth increases at the same rate throughout filling. Which cross-sectional diagram is consistent with this depth–time graph?</p><div data-context-plot=\"vessel-options\" data-spec=\"{&quot;order&quot;:[&quot;cylinder&quot;,&quot;hourglass&quot;,&quot;neck&quot;,&quot;widening&quot;]}\"></div>",
      "choices": [
        "Vessel A",
        "Vessel B",
        "Vessel C",
        "Vessel D"
      ],
      "answer": 0,
      "hint": "The same added volume makes a greater rise in a narrower horizontal cross-section. Read each vessel from the bottom upward.",
      "solution": "Vessel A. At constant volume inflow, narrowing makes depth rise faster, widening makes it rise more slowly, and constant area makes depth rise steadily. Match those stages from the bottom upward.",
      "ek": "1.1.B.1–4",
      "calculator": false,
      "family": "Filling vessels",
      "audit": {
        "target": "cylinder",
        "order": [
          "cylinder",
          "hourglass",
          "neck",
          "widening"
        ]
      }
    },
    {
      "id": "ex36",
      "type": "mcq",
      "group": "Filling vessels",
      "prompt": "<p>Water enters an empty vessel at a constant 42 cm³/s, with no leakage. Depth first rises at an increasing rate, then at a decreasing rate. Which cross-sectional diagram is consistent with this depth–time graph?</p><div data-context-plot=\"vessel-options\" data-spec=\"{&quot;order&quot;:[&quot;widening&quot;,&quot;cylinder&quot;,&quot;hourglass&quot;,&quot;neck&quot;]}\"></div>",
      "choices": [
        "Vessel A",
        "Vessel B",
        "Vessel C",
        "Vessel D"
      ],
      "answer": 2,
      "hint": "The same added volume makes a greater rise in a narrower horizontal cross-section. Read each vessel from the bottom upward.",
      "solution": "Vessel C. At constant volume inflow, narrowing makes depth rise faster, widening makes it rise more slowly, and constant area makes depth rise steadily. Match those stages from the bottom upward.",
      "ek": "1.1.B.1–4",
      "calculator": false,
      "family": "Filling vessels",
      "audit": {
        "target": "hourglass",
        "order": [
          "widening",
          "cylinder",
          "hourglass",
          "neck"
        ]
      }
    },
    {
      "id": "ex37",
      "type": "mcq",
      "group": "Filling vessels",
      "prompt": "<p>Water enters at 36 cm³/s. Two straight sections of a vessel have horizontal cross-sectional areas 12 cm² and 48 cm². For the same small added volume, which statement compares the depth increases?</p>",
      "choices": [
        "The depth increase in the 12 cm² section is four times that in the 48 cm² section.",
        "The depth increases are equal.",
        "The depth increase in the 48 cm² section is four times that in the 12 cm² section.",
        "The depth increase in the 12 cm² section is twice that in the 48 cm² section."
      ],
      "answer": 0,
      "hint": "For a straight section, added volume = area × depth increase.",
      "solution": "The same added volume spread over one quarter of the area produces four times the height increase. For example, 48 cm³ raises depth by 4 cm in the narrow section and by 1 cm in the wide section.",
      "ek": "1.1.B.1–2",
      "calculator": false,
      "family": "Filling vessels"
    },
    {
      "id": "ex38",
      "type": "mcq",
      "group": "Filling vessels",
      "prompt": "<p>A vessel narrows upward and then has a straight narrow neck. Water enters at constant volume per second. A student draws a depth–time graph shaped like the vessel’s outline. Which correction is appropriate?</p>",
      "choices": [
        "Draw the height constant until water enters the neck.",
        "Draw a rising concave-up portion followed by a steep straight rise.",
        "Draw a decreasing concave-up portion followed by a flat line.",
        "Draw a rising concave-down portion followed by a flat line."
      ],
      "answer": 1,
      "hint": "The graph records depth against time, not width against height.",
      "solution": "Water keeps accumulating, so depth keeps increasing. Narrower sections produce a faster rise; the constant-area neck produces a constant positive rate.",
      "ek": "1.1.B.1–4",
      "calculator": false,
      "family": "Filling vessels"
    },
    {
      "id": "ex39",
      "type": "mcq",
      "group": "Filling vessels",
      "prompt": "<p>A tank’s depth–time graph bends upward while water enters. The inflow is not known to be constant. What can be concluded about the tank?</p>",
      "choices": [
        "The tank must widen upward.",
        "The tank must have constant cross-sectional area.",
        "The graph alone does not establish that the tank narrows upward.",
        "The tank must narrow upward."
      ],
      "answer": 2,
      "hint": "A changing pump setting can also change how fast the level rises.",
      "solution": "Concave-up depth means depth rises at an increasing rate. That may result from increasing inflow, narrowing cross-sections, or both. The constant-inflow assumption is needed to infer shape.",
      "ek": "1.1.B.1–4",
      "calculator": false,
      "family": "Filling vessels"
    },
    {
      "id": "ex40",
      "type": "mcq",
      "group": "Filling vessels",
      "prompt": "<p>A vessel has constant horizontal cross-sectional area. Its inflow changes instantly from 20 cm³/s to 40 cm³/s at t = 6 s and then stays constant. Which depth–time graph is appropriate?</p>",
      "choices": [
        "A vertical jump in depth at t = 6",
        "A decreasing graph after t = 6",
        "A smooth concave-up graph throughout both time intervals",
        "A continuous increasing graph with a steeper straight segment after t = 6"
      ],
      "answer": 3,
      "hint": "The water level cannot jump when no volume is added instantaneously.",
      "solution": "Each constant inflow gives a constant positive depth rate. Doubling inflow doubles the steepness after 6 s, but the level remains continuous at the change.",
      "ek": "1.1.B.1–2",
      "calculator": false,
      "family": "Filling vessels"
    },
    {
      "id": "ex41",
      "type": "mcq",
      "group": "Projectile height",
      "prompt": "<p>A ball is thrown upward from a balcony. Its height above the ground is modeled by \\(h(t)=-4.9t^2+6.2t+18\\), where t is seconds after release and h(t) is meters. Use the model only until the first ground contact. Which description is correct? Round to three decimal places.</p>",
      "choices": [
        "The height first increases to 19.961 m, then decreases. The ball reaches the ground 2.018 s after reaching its maximum height.",
        "The ball starts at its maximum height of 18.000 m and hits the ground 2.651 s after release.",
        "The height first increases to 19.961 m, then decreases. The ball reaches the ground 2.651 s after reaching its maximum height.",
        "The height first increases to 19.961 m, then decreases. The ball reaches the ground 2.018 s after release."
      ],
      "answer": 0,
      "hint": "Use maximum and zero on a graphing calculator. Then subtract the time of maximum height from the time of ground contact.",
      "solution": "The graph’s maximum occurs at t ≈ 0.632653 s with height ≈ 19.961224 m. The positive zero is t ≈ 2.650999 s after release. The descent lasts 2.650999 − 0.632653 ≈ 2.018 s. Keep full calculator values until the final rounding.",
      "ek": "1.1.A.2; 1.1.B.5",
      "calculator": true,
      "family": "Projectile height",
      "audit": {
        "a": 4.9,
        "v": 6.2,
        "h": 18,
        "peak": 0.6326530612244897,
        "height": 19.961224489795917,
        "impact": 2.650998741139558,
        "fall": 2.0183456799150683
      }
    },
    {
      "id": "ex42",
      "type": "mcq",
      "group": "Projectile height",
      "prompt": "<p>A ball is thrown upward from a balcony. Its height above the ground is modeled by \\(h(t)=-4.9t^2+8.4t+21\\), where t is seconds after release and h(t) is meters. Use the model only until the first ground contact. Which description is correct? Round to three decimal places.</p>",
      "choices": [
        "The height first increases to 24.600 m, then decreases. The ball reaches the ground 2.241 s after release.",
        "The height first increases to 24.600 m, then decreases. The ball reaches the ground 2.241 s after reaching its maximum height.",
        "The ball starts at its maximum height of 21.000 m and hits the ground 3.098 s after release.",
        "The height first increases to 24.600 m, then decreases. The ball reaches the ground 3.098 s after reaching its maximum height."
      ],
      "answer": 1,
      "hint": "Use maximum and zero on a graphing calculator. Then subtract the time of maximum height from the time of ground contact.",
      "solution": "The graph’s maximum occurs at t ≈ 0.857143 s with height ≈ 24.600000 m. The positive zero is t ≈ 3.097770 s after release. The descent lasts 3.097770 − 0.857143 ≈ 2.241 s. Keep full calculator values until the final rounding.",
      "ek": "1.1.A.2; 1.1.B.5",
      "calculator": true,
      "family": "Projectile height",
      "audit": {
        "a": 4.9,
        "v": 8.4,
        "h": 21,
        "peak": 0.8571428571428571,
        "height": 24.6,
        "impact": 3.0977695916225887,
        "fall": 2.2406267344797315
      }
    },
    {
      "id": "ex43",
      "type": "mcq",
      "group": "Projectile height",
      "prompt": "<p>A ball is thrown upward from a balcony. Its height above the ground is modeled by \\(h(t)=-4.9t^2+4.8t+13\\), where t is seconds after release and h(t) is meters. Use the model only until the first ground contact. Which description is correct? Round to three decimal places.</p>",
      "choices": [
        "The height first increases to 14.176 m, then decreases. The ball reaches the ground 2.191 s after reaching its maximum height.",
        "The height first increases to 14.176 m, then decreases. The ball reaches the ground 1.701 s after release.",
        "The height first increases to 14.176 m, then decreases. The ball reaches the ground 1.701 s after reaching its maximum height.",
        "The ball starts at its maximum height of 13.000 m and hits the ground 2.191 s after release."
      ],
      "answer": 2,
      "hint": "Use maximum and zero on a graphing calculator. Then subtract the time of maximum height from the time of ground contact.",
      "solution": "The graph’s maximum occurs at t ≈ 0.489796 s with height ≈ 14.175510 m. The positive zero is t ≈ 2.190667 s after release. The descent lasts 2.190667 − 0.489796 ≈ 1.701 s. Keep full calculator values until the final rounding.",
      "ek": "1.1.A.2; 1.1.B.5",
      "calculator": true,
      "family": "Projectile height",
      "audit": {
        "a": 4.9,
        "v": 4.8,
        "h": 13,
        "peak": 0.48979591836734687,
        "height": 14.175510204081633,
        "impact": 2.1906666560011945,
        "fall": 1.7008707376338477
      }
    },
    {
      "id": "ex44",
      "type": "mcq",
      "group": "Projectile height",
      "prompt": "<p>A ball is thrown upward from a balcony. Its height above the ground is modeled by \\(h(t)=-4.9t^2+7.6t+16\\), where t is seconds after release and h(t) is meters. Use the model only until the first ground contact. Which description is correct? Round to three decimal places.</p>",
      "choices": [
        "The ball starts at its maximum height of 16.000 m and hits the ground 2.742 s after release.",
        "The height first increases to 18.947 m, then decreases. The ball reaches the ground 2.742 s after reaching its maximum height.",
        "The height first increases to 18.947 m, then decreases. The ball reaches the ground 1.966 s after release.",
        "The height first increases to 18.947 m, then decreases. The ball reaches the ground 1.966 s after reaching its maximum height."
      ],
      "answer": 3,
      "hint": "Use maximum and zero on a graphing calculator. Then subtract the time of maximum height from the time of ground contact.",
      "solution": "The graph’s maximum occurs at t ≈ 0.775510 s with height ≈ 18.946939 m. The positive zero is t ≈ 2.741908 s after release. The descent lasts 2.741908 − 0.775510 ≈ 1.966 s. Keep full calculator values until the final rounding.",
      "ek": "1.1.A.2; 1.1.B.5",
      "calculator": true,
      "family": "Projectile height",
      "audit": {
        "a": 4.9,
        "v": 7.6,
        "h": 16,
        "peak": 0.7755102040816325,
        "height": 18.946938775510205,
        "impact": 2.7419084849707596,
        "fall": 1.966398280889127
      }
    },
    {
      "id": "ex45",
      "type": "mcq",
      "group": "Projectile height",
      "prompt": "<p>A calculator shows that a ball reaches maximum height 0.735 s after release and hits the ground 3.218 s after release. How long is the descent from maximum height to the ground?</p>",
      "choices": [
        "2.483 s",
        "3.218 s",
        "3.953 s",
        "0.735 s"
      ],
      "answer": 0,
      "hint": "Both displayed times are measured from the same starting event.",
      "solution": "The descent duration is 3.218 − 0.735 = 2.483 s. The ground-contact time is a timestamp after release, not the duration after the peak.",
      "ek": "1.1.A.2",
      "calculator": false,
      "family": "Projectile height"
    },
    {
      "id": "ex46",
      "type": "mcq",
      "group": "Projectile height",
      "prompt": "<p>A ball is released from rest above the ground. Its height is \\(h(t)=24-4.9t^2\\), for t from release until ground contact. Which statement is correct?</p>",
      "choices": [
        "Its rate of change is constant because 4.9 is constant.",
        "Its maximum height is 24 m at release; it then decreases with concave-down behavior.",
        "It first rises above 24 m, then decreases.",
        "Its graph is concave up because height stays positive before impact."
      ],
      "answer": 1,
      "hint": "A downward-opening height graph may start at its highest point.",
      "solution": "For positive time, subtracting 4.9t² makes the height decrease. Equal time steps produce larger drops, so its rate decreases and the graph is concave down.",
      "ek": "1.1.A.3–4; 1.1.B.4",
      "calculator": false,
      "family": "Projectile height"
    },
    {
      "id": "ex47",
      "type": "mcq",
      "group": "Projectile height",
      "prompt": "<p>A ball’s physical height model is used for 0 ≤ t ≤ 2.7. It reaches a maximum of 19.6 m at t = 0.6 and reaches the ground at t = 2.7. What is the range of this physical model?</p>",
      "choices": [
        "[0.6, 2.7] seconds",
        "All real numbers less than or equal to 19.6 meters",
        "[0, 19.6] meters",
        "[0, 2.7] seconds"
      ],
      "answer": 2,
      "hint": "The range consists of heights actually reached before the model ends.",
      "solution": "The lowest physical height is 0 m and the greatest is 19.6 m; continuity includes all intervening heights. Negative values on the continued parabola lie outside this physical model.",
      "ek": "1.1.A.1",
      "calculator": false,
      "family": "Projectile height"
    },
    {
      "id": "ex48",
      "type": "mcq",
      "group": "Projectile height",
      "prompt": "<p>A ball rises to a maximum and then falls. Its height–time graph is concave down throughout the flight. Which statement describes its rate of change?</p>",
      "choices": [
        "The rate is negative throughout because the graph is concave down.",
        "The rate first increases, then decreases.",
        "The rate is zero throughout because the ball returns toward the ground.",
        "The rate decreases throughout, changing from positive to zero to negative."
      ],
      "answer": 3,
      "hint": "The direction of the height and the direction of its rate are different questions.",
      "solution": "The positive rate during ascent becomes smaller, reaches zero at the maximum, and then becomes more negative during descent. Thus it decreases through both stages.",
      "ek": "1.1.B.4",
      "calculator": false,
      "family": "Projectile height"
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
