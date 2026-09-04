/* Original ECHS practice; not College Board exam items. */
(function(root){
const data={
  "questions": [
    {
      "id": "launch",
      "type": "mcq",
      "group": "Opening prediction",
      "prompt": "For every \\(x\\ne2\\), \\(f(x)=x+2\\), but \\(f(2)=7\\). What do the nearby outputs approach as \\(x\\) approaches 2?",
      "choices": [
        "2",
        "4",
        "7",
        "The nearby outputs cannot approach a value."
      ],
      "answer": 1,
      "hint": "Use inputs close to 2 on both sides, such as 1.99 and 2.01.",
      "solution": "The nearby outputs are 3.99 and 4.01. More generally, \\(f(x)-4=x-2\\) for \\(x\\ne2\\), so they approach 4. The assigned value \\(f(2)=7\\) answers a different question."
    },
    {
      "id": "read-target",
      "type": "number",
      "group": "Guided practice",
      "prompt": "In \\(\\lim_{x\\to-3}g(x)=8\\), what is the target input?",
      "answer": -3,
      "unit": "number, DNE or undefined",
      "hint": "Look below the limit symbol.",
      "solution": "The input \\(x\\) approaches \\(-3\\). The number 8 is the limiting output."
    },
    {
      "id": "read-output",
      "type": "number",
      "group": "Guided practice",
      "prompt": "In \\(\\lim_{t\\to5}A(t)=0\\), what value do the outputs approach?",
      "answer": 0,
      "unit": "number, DNE or undefined",
      "hint": "A zero limit is a valid finite limit.",
      "solution": "The outputs \\(A(t)\\) approach 0 as \\(t\\) approaches 5. This does not by itself determine \\(A(5)\\)."
    },
    {
      "id": "missing-limit",
      "type": "number",
      "group": "Guided practice",
      "prompt": "Let \\(g(x)=x+2\\) for \\(x\\ne2\\), with no value assigned at 2. Find \\(\\lim_{x\\to2}g(x)\\).",
      "answer": 4,
      "unit": "number, DNE or undefined",
      "hint": "The missing point does not remove the nearby pattern.",
      "solution": "For non-target inputs, \\(g(x)-4=x-2\\). Thus \\(\\lim_{x\\to2}g(x)=4\\), although \\(g(2)\\) is undefined."
    },
    {
      "id": "missing-value",
      "type": "number",
      "group": "Guided practice",
      "prompt": "For the same function \\(g(x)=x+2\\), defined only when \\(x\\ne2\\), state \\(g(2)\\).",
      "answer": "undefined",
      "unit": "number, DNE or undefined",
      "hint": "Check whether 2 belongs to the stated domain.",
      "solution": "\\(g(2)\\) is undefined because the domain excludes 2. A limit value does not fill in a missing function value."
    },
    {
      "id": "jump-limit",
      "type": "number",
      "group": "Bridge check",
      "prompt": "Given \\(\\lim_{x\\to2^-}p(x)=1\\) and \\(\\lim_{x\\to2^+}p(x)=4\\), state \\(\\lim_{x\\to2}p(x)\\).",
      "answer": "DNE",
      "unit": "number, DNE or undefined",
      "hint": "For this interior target, both sides must approach the same output.",
      "solution": "The left and right limits are unequal, so the two-sided limit does not exist (DNE). Averaging 1 and 4 does not produce a limit."
    },
    {
      "id": "ap01",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Which statement correctly interprets \\(\\lim_{x\\to-4}f(x)=7\\)?",
      "choices": [
        "The value of the function at −4 must be 7.",
        "As the outputs approach −4, the inputs approach 7.",
        "The outputs can be made as close to 7 as desired by taking all non-target inputs sufficiently close to −4.",
        "The function must remain below 7 near −4."
      ],
      "answer": 2,
      "hint": "Separate the target input, the limiting output and the value at the target.",
      "solution": "The statement describes nearby outputs approaching 7 for inputs approaching −4, with \\(x\\ne-4\\). It makes no separate claim about \\(f(-4)\\) or whether nearby outputs are above or below 7."
    },
    {
      "id": "ap02",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "A function satisfies \\(\\lim_{x\\to3}h(x)=5\\) and \\(h(3)=-1\\). Which change, by itself, preserves this limit?",
      "choices": [
        "Change h(3) to 100 and leave every other value unchanged.",
        "Change every output near 3 to 100.",
        "Replace the right-hand nearby outputs by values approaching 100.",
        "Change the input target in the limit to 100."
      ],
      "answer": 0,
      "hint": "The definition excludes the target input itself.",
      "solution": "Changing only \\(h(3)\\) preserves every nearby value used to determine the limit at 3. Each other option changes the nearby behavior or asks about a different target."
    },
    {
      "id": "ap03",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "The outputs \\(P(t)\\), measured in kilopascals, approach 24 as time \\(t\\), in seconds, approaches 6 from either side. Which notation expresses this?",
      "choices": [
        "\\(\\lim_{t\\to24}P(t)=6\\)",
        "\\(P(6)=24\\)",
        "\\(\\lim_{P\\to6}t=24\\)",
        "\\(\\lim_{t\\to6}P(t)=24\\)"
      ],
      "answer": 3,
      "hint": "Time is the input. Pressure is the output.",
      "solution": "The correct statement is \\(\\lim_{t\\to6}P(t)=24\\). The output limit is 24 kilopascals, not a rate in kilopascals per second."
    },
    {
      "id": "ap04",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "For \\(x\\ne1\\), let \\(f(x)=-2\\), and let \\(f(1)=3\\). Which statement is true?",
      "choices": [
        "The limit at 1 is 3.",
        "\\(\\lim_{x\\to1}f(x)=-2\\), even though nearby outputs already equal −2.",
        "The limit does not exist because the outputs do not move.",
        "The limit is 1 because x approaches 1."
      ],
      "answer": 1,
      "hint": "A constant output meets every degree of closeness to that same constant.",
      "solution": "All non-target outputs equal −2, so \\(\\lim_{x\\to1}f(x)=-2\\). “Approaches” allows equality; a limit is not required to stay unreached."
    },
    {
      "id": "ap05",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "A graph agrees with \\(y=x+2\\) for every \\(x\\ne-2\\), has an open circle at \\((-2,0)\\), and a filled point at \\((-2,3)\\). Which pair is correct?",
      "choices": [
        "\\(\\lim_{x\\to-2}f(x)=3,\\ f(-2)=0\\)",
        "\\(\\lim_{x\\to-2}f(x)=\\mathrm{DNE},\\ f(-2)=3\\)",
        "\\(\\lim_{x\\to-2}f(x)=0,\\ f(-2)=3\\)",
        "\\(\\lim_{x\\to-2}f(x)=-2,\\ f(-2)=0\\)"
      ],
      "answer": 2,
      "hint": "The curve describes nearby behavior; the filled point describes the value at the input.",
      "solution": "Nearby points on \\(y=x+2\\) approach height 0 at input −2. The filled point gives \\(f(-2)=3\\). Zero is a finite limit."
    },
    {
      "id": "ap06",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Which sequence of inputs approaches −2 from the right?",
      "choices": [
        "−1, −0.1, −0.01, …",
        "−2.1, −2.01, −2.001, …",
        "2.1, 2.01, 2.001, …",
        "−1.9, −1.99, −1.999, …"
      ],
      "answer": 3,
      "hint": "Right means greater than the target input, even when the target is negative.",
      "solution": "The numbers −1.9, −1.99 and −1.999 are all greater than −2, and their distance from −2 decreases toward 0. The superscript + describes the input side, not the sign of the output."
    },
    {
      "id": "ap07",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Suppose \\(\\lim_{x\\to1^-}r(x)=4\\), \\(\\lim_{x\\to1^+}r(x)=4\\), and \\(r(1)=9\\). What is \\(\\lim_{x\\to1}r(x)\\)?",
      "choices": [
        "4",
        "9",
        "DNE",
        "1"
      ],
      "answer": 0,
      "hint": "Compare the two nearby limiting outputs.",
      "solution": "Both one-sided limits equal 4, so the two-sided limit is 4. The point value 9 does not change the common nearby behavior."
    },
    {
      "id": "ap08",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Suppose \\(\\lim_{x\\to0^-}s(x)=-2\\) and \\(\\lim_{x\\to0^+}s(x)=6\\). Which statement is correct?",
      "choices": [
        "The two-sided limit is 2.",
        "No choice of s(0) makes the two-sided limit exist.",
        "Setting s(0) = 6 makes the two-sided limit 6.",
        "The two-sided limit is 0."
      ],
      "answer": 1,
      "hint": "A single point cannot make unequal nearby limits agree.",
      "solution": "The one-sided limits differ. Changing \\(s(0)\\) cannot alter either one-sided limit, so the two-sided limit remains DNE. Their average 2 has no role."
    },
    {
      "id": "ap09",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "A table gives \\(f(1.9)=4.9\\), \\(f(1.99)=4.99\\), \\(f(2.01)=5.01\\), and \\(f(2.1)=5.1\\). No formula or other information is given. Which conclusion is justified?",
      "choices": [
        "The table proves the limit at 2 is 5.",
        "The table proves f(2) = 5.",
        "The table proves the limit does not exist.",
        "The entries suggest a limit of 5, but finitely many samples alone do not establish all sufficiently nearby behavior."
      ],
      "answer": 3,
      "hint": "Distinguish evidence from a statement about every sufficiently close input.",
      "solution": "These samples support the conjecture \\(\\lim_{x\\to2}f(x)=5\\), but unlisted inputs may behave differently. The table also does not specify \\(f(2)\\)."
    },
    {
      "id": "ap10",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Two functions f and g agree whenever \\(0<|x-2|<0.5\\). If \\(\\lim_{x\\to2}f(x)=4\\), which statement must be true?",
      "choices": [
        "f and g agree for all x.",
        "\\(f(2)=g(2)\\)",
        "\\(\\lim_{x\\to2}g(x)=4\\)",
        "\\(g(2)=4\\)"
      ],
      "answer": 2,
      "hint": "Read the inequality as “within half a unit of 2, but not at 2.”",
      "solution": "The functions have identical values throughout a deleted neighborhood of 2, so their limits at 2 agree. Values at 2 or far from 2 need not agree."
    },
    {
      "id": "ap11",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Which statement is equivalent to \\(\\lim_{x\\to3}f(x)=8\\) when the input variable is simply renamed?",
      "choices": [
        "\\(\\lim_{u\\to8}f(u)=3\\)",
        "\\(\\lim_{u\\to3}f(u)=8\\)",
        "\\(f(3)=8\\)",
        "\\(\\lim_{u\\to3}f(x)=8\\)"
      ],
      "answer": 1,
      "hint": "Rename the input consistently in the arrow and the function argument.",
      "solution": "Changing the dummy input name from x to u everywhere leaves the meaning unchanged: \\(\\lim_{u\\to3}f(u)=8\\). It does not exchange the target and output or introduce a new expression."
    },
    {
      "id": "ap12",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Which situation is consistent with \\(\\lim_{x\\to5}f(x)=0\\)?",
      "choices": [
        "f(5) is undefined, while the nearby outputs approach zero.",
        "f(5) must be zero.",
        "Every output near 5 must be positive.",
        "The nearby inputs must approach zero."
      ],
      "answer": 0,
      "hint": "A limit statement does not require a value at the target.",
      "solution": "A missing value at 5 is compatible with nearby outputs approaching zero. The statement does not require a sign for nearby outputs, and the target input is 5."
    },
    {
      "id": "ap13",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Given \\(\\lim_{t\\to3}T(t)=18\\), with t in minutes and T(t) in degrees Celsius, which interpretation is correct?",
      "choices": [
        "The temperature changes by 18 °C each minute near 3 minutes.",
        "The time approaches 18 minutes as temperature approaches 3 °C.",
        "The temperature approaches 18 °C as time approaches 3 minutes.",
        "The temperature at exactly 3 minutes must equal 18 °C."
      ],
      "answer": 2,
      "hint": "The limit is an output value, not a difference quotient.",
      "solution": "The limit concerns temperature in degrees Celsius. No rate of change or exact value \\(T(3)\\) is specified."
    },
    {
      "id": "ap14",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "Near x = 2, a student observes that outputs approach 4 along inputs 1.9, 1.99, 1.999, … . What additional requirement belongs to the two-sided limit statement at this interior point?",
      "choices": [
        "All sufficiently close non-target inputs must give outputs arbitrarily close to 4, including inputs on the other side.",
        "The function must take the value 4 at x = 2.",
        "The function must be increasing everywhere.",
        "The input must eventually equal 2."
      ],
      "answer": 0,
      "hint": "One sequence does not describe all nearby inputs.",
      "solution": "A finite two-sided limit controls all sufficiently close non-target domain inputs. A single approach sequence cannot establish the full statement; the right side could behave differently."
    },
    {
      "id": "ap15",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "The domain of V is \\([0,10]\\). As positive t approaches 0, V(t) approaches 12. Which notation states exactly this information?",
      "choices": [
        "\\(V(0)=12\\)",
        "\\(\\lim_{t\\to12^+}V(t)=0\\)",
        "\\(\\lim_{t\\to0^-}V(t)=12\\)",
        "\\(\\lim_{t\\to0^+}V(t)=12\\)"
      ],
      "answer": 3,
      "hint": "Positive inputs approach 0 from the right. Do not invent negative-time data.",
      "solution": "\\(\\lim_{t\\to0^+}V(t)=12\\) uses the available positive inputs. The statement supplies neither \\(V(0)\\) nor left-side behavior."
    },
    {
      "id": "ap16",
      "type": "mcq",
      "group": "AP-style MCQ",
      "prompt": "A student says, “Because f(2) = 6, the limit of f(x) as x approaches 2 must be 6.” Which example disproves the claim?",
      "choices": [
        "\\(f(x)=6\\) for every x.",
        "\\(f(x)=1\\) for \\(x\\ne2\\), with \\(f(2)=6\\).",
        "\\(f(x)=x+4\\) for every x.",
        "\\(f(x)=x^2+2\\) for every x."
      ],
      "answer": 1,
      "hint": "A counterexample must satisfy f(2) = 6 and have a different nearby limit.",
      "solution": "In the second example, \\(f(2)=6\\), but all non-target outputs equal 1, so the limit is 1. It satisfies the hypothesis and contradicts the claimed conclusion."
    },
    {
      "id": "exit-limit",
      "type": "number",
      "group": "Exit ticket",
      "prompt": "For every \\(x\\ne-1\\), \\(p(x)=x+1\\); let \\(p(-1)=5\\). State \\(\\lim_{x\\to-1}p(x)\\).",
      "answer": 0,
      "unit": "number, DNE or undefined",
      "hint": "Track nearby outputs as x approaches −1.",
      "solution": "For \\(x\\ne-1\\), \\(p(x)=x+1\\) approaches 0. Thus the limit is 0, even though the point value is 5."
    },
    {
      "id": "exit-meaning",
      "type": "mcq",
      "group": "Exit ticket",
      "prompt": "What does \\(\\lim_{u\\to4}q(u)=9\\) tell you about \\(q(4)\\)?",
      "choices": [
        "q(4) = 9.",
        "q(4) = 4.",
        "q(4) must be undefined.",
        "Its value is not determined by this limit statement alone."
      ],
      "answer": 3,
      "hint": "Consider a filled point placed at different heights or a missing point.",
      "solution": "The function value may equal 9, differ from 9, or be undefined. The given statement fixes nearby behavior, not the value at u = 4."
    }
  ],
  "frqs": [
    {
      "id": "frq-point",
      "title": "One rule nearby, another at the point",
      "calculator": false,
      "context": "<p>Let \\(f(x)=\\begin{cases}x+2&x\\ne2\\\\7&x=2\\end{cases}\\). Work from the complete definition. Explain each answer using nearby values or the assigned point value.</p>",
      "parts": [
        {
          "label": "(a)",
          "prompt": "State the limit of f(x) as x approaches 2, state f(2), and explain why they may differ.",
          "rubric": "<ol><li>1 point: \\(\\lim_{x\\to2}f(x)=4\\).</li><li>1 point: \\(f(2)=7\\).</li><li>1 point: The limit uses non-target inputs following x + 2; the assigned value at 2 is a separate piece of the definition.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "A new function g agrees with f except that g(2) is undefined. State its limit at 2 and its value at 2, with a reason.",
          "rubric": "<ol><li>1 point: \\(\\lim_{x\\to2}g(x)=4\\).</li><li>1 point: \\(g(2)\\) is undefined.</li><li>1 point: All non-target inputs are unchanged, so removing the point leaves the limit unchanged.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "Construct a function h whose limit at 2 is 4 and whose value at 2 is −3. Give a complete rule and justify the limit.",
          "rubric": "<ol><li>1 point: Give a nearby rule approaching 4, for example \\(h(x)=x+2\\) when \\(x\\ne2\\).</li><li>1 point: Assign \\(h(2)=-3\\) explicitly.</li><li>1 point: Explain that nearby outputs of the chosen rule approach 4 from both sides; the isolated assignment does not change that behavior. Other valid constructions earn credit.</li></ol>"
        }
      ]
    },
    {
      "id": "frq-context",
      "title": "A sensor reading and a limit",
      "calculator": false,
      "context": "<p>A temperature model T(t), in degrees Celsius, is defined for \\(0\\le t\\le6\\). Whenever \\(t\\ne3\\), \\(T(t)=15+t\\), but an isolated recording error gives \\(T(3)=40\\). Here t is time in minutes.</p>",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Write a limit statement for the temperature as t approaches 3, and interpret it with both quantities and their units.",
          "rubric": "<ol><li>1 point: \\(\\lim_{t\\to3}T(t)=18\\).</li><li>1 point: Identify the input approaching 3 minutes.</li><li>1 point: Identify the temperature approaching 18 °C, without claiming a rate or requiring T(3) = 18.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Use t = 2.99 and t = 3.01 to support the limit. Explain why these two calculations alone would not prove a limit for an otherwise unknown function.",
          "rubric": "<ol><li>1 point: \\(T(2.99)=17.99\\) and \\(T(3.01)=18.01\\).</li><li>1 point: These outputs are near 18 on opposite sides of 3.</li><li>1 point: Two samples do not cover every sufficiently close input. Here the complete rule supplies the nearby behavior: \\(T(t)-18=t-3\\) for non-target t.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "The error is corrected by replacing T(3) with 18. State what changes and what stays the same. Is 18 a temperature or a temperature rate?",
          "rubric": "<ol><li>1 point: The point value changes from 40 to 18 °C.</li><li>1 point: The limit remains 18 because no nearby non-target values change.</li><li>1 point: 18 is a temperature in °C, not a rate in °C/min.</li></ol>"
        }
      ]
    },
    {
      "id": "frq-sides",
      "title": "Read and reconcile the notation",
      "calculator": false,
      "context": "<p>A function q is defined on both sides of −2 and satisfies \\(\\lim_{x\\to-2^-}q(x)=5\\), \\(\\lim_{x\\to-2^+}q(x)=1\\), and \\(q(-2)=9\\). No additional formula is given.</p>",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Translate the right-hand limit into words. Give two example inputs on the correct side, with the second closer to −2.",
          "rubric": "<ol><li>1 point: Inputs approach −2 through values greater than −2.</li><li>1 point: Outputs q(x) approach 1.</li><li>1 point: Give a valid pair, for example −1.9 then −1.99; both are greater than −2 and the latter is closer.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Determine the two-sided limit at −2. Explain whether changing only q(−2) could alter your conclusion.",
          "rubric": "<ol><li>1 point: The two-sided limit is DNE.</li><li>1 point: The one-sided limits, 5 and 1, disagree.</li><li>1 point: Changing only q(−2) does not change the one-sided behavior, so cannot make the limit exist.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "A different function r has both one-sided limits equal to 5 at −2 and r(−2) = 9. Write its two-sided limit, compare this to its point value, and describe a graph meeting these conditions.",
          "rubric": "<ol><li>1 point: \\(\\lim_{x\\to-2}r(x)=5\\).</li><li>1 point: \\(r(-2)=9\\), so the point value differs from the limit.</li><li>1 point: For example, a horizontal line at height 5 with an open circle at (−2,5) and a filled point at (−2,9). Any correctly described graph with the required nearby behavior earns credit.</li></ol>"
        }
      ]
    }
  ]
};
root.Calculus12Questions=data;if(typeof module!=="undefined"&&module.exports)module.exports=data;
})(typeof window!=="undefined"?window:globalThis);
