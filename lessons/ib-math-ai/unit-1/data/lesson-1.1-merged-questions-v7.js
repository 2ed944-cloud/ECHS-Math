/* Original ECHS AI SL classroom assessments; variable IB-style method, accuracy and reasoning marks. */
(function(root){const data={
  "revision": "ib-ai-sl-1-1-1-6-v7",
  "questions": [
    {
      "id": "q01",
      "type": "number",
      "group": "Learning check",
      "prompt": "Write \\(0.0000725\\) in the form \\(a\\times10^k\\), where \\(1\\le a<10\\) and \\(k\\in\\mathbb Z\\).",
      "answer": "7.25e-5",
      "unit": "write the requested form",
      "hint": "The coefficient should be between 1 and 10.",
      "solution": "\\(0.0000725=7.25\\times10^{-5}\\). The negative exponent represents a small positive number.",
      "format": "scientific"
    },
    {
      "id": "q02",
      "type": "number",
      "group": "Learning check",
      "prompt": "Write \\(3.08\\times10^6\\) as an ordinary number.",
      "answer": 3080000,
      "unit": "write the requested form",
      "hint": "Multiply the coefficient by one million.",
      "solution": "\\(3.08\\times10^6=3\\,080\\,000\\)."
    },
    {
      "id": "q03",
      "type": "number",
      "group": "Learning check",
      "prompt": "Calculate \\((6.4\\times10^5)(3\\times10^{-3})\\). Give your answer in normalized scientific form.",
      "answer": 1920,
      "unit": "write the requested form",
      "hint": "Multiply the coefficients, add the exponents, then normalize.",
      "solution": "\\((6.4\\times10^5)(3\\times10^{-3})=19.2\\times10^2=1.92\\times10^3\\).",
      "format": "scientific"
    },
    {
      "id": "q04",
      "type": "number",
      "group": "Learning check",
      "prompt": "Calculate \\(4.2\\times10^6+7.5\\times10^5\\). Give your answer in normalized scientific form.",
      "answer": 4950000,
      "unit": "write the requested form",
      "hint": "Rewrite both terms using the same power of ten.",
      "solution": "\\(4.2\\times10^6+0.75\\times10^6=4.95\\times10^6\\).",
      "format": "scientific"
    },
    {
      "id": "q05",
      "type": "number",
      "group": "Learning check",
      "prompt": "Round \\(6.2048\\) to 2 decimal places.",
      "answer": "6.20",
      "unit": "write the requested form",
      "hint": "Keep the hundredths digit and inspect the thousandths digit.",
      "solution": "The third decimal digit is 4, so \\(6.2048\\approx6.20\\) to 2 d.p. Keep the final zero.",
      "dp": 2
    },
    {
      "id": "q06",
      "type": "number",
      "group": "Learning check",
      "prompt": "Round \\(0.004506\\) to 3 significant figures.",
      "answer": "0.00451",
      "unit": "write the requested form",
      "hint": "Start counting at the first 4. The next digit after the retained 0 is 6.",
      "solution": "The retained digits are 4, 5, 0; the next digit is 6. Thus \\(0.004506\\approx0.00451\\) to 3 s.f.",
      "sf": 3
    },
    {
      "id": "q07",
      "type": "number",
      "group": "Learning check",
      "prompt": "State the number of significant figures in the measured value \\(0.005070\\).",
      "answer": 4,
      "unit": "write the requested form",
      "hint": "Leading zeros locate the decimal point; zeros from the first nonzero digit onward are significant here.",
      "solution": "The significant digits are 5, 0, 7, 0. There are 4 significant figures."
    },
    {
      "id": "q08",
      "type": "number",
      "group": "Learning check",
      "prompt": "A length is reported as \\(8.4\\) cm to the nearest \\(0.1\\) cm. Write down its lower bound in cm.",
      "answer": 8.35,
      "unit": "cm",
      "hint": "Subtract half of 0.1.",
      "solution": "\\(8.4-0.05=8.35\\). The complete interval is \\(8.35\\le L<8.45\\)."
    },
    {
      "id": "q09",
      "type": "number",
      "group": "Learning check",
      "prompt": "A mass is \\(3.60\\) kg correct to 3 significant figures. Write down its upper-bound endpoint in kg.",
      "answer": 3.605,
      "unit": "kg",
      "hint": "The last reported digit is in the hundredths place.",
      "solution": "The rounding unit is \\(0.01\\) kg, so \\(3.595\\le m<3.605\\). The upper endpoint is excluded."
    },
    {
      "id": "q10",
      "type": "number",
      "group": "Learning check",
      "prompt": "An exact reference mass is \\(250\\) g. A balance displays \\(244\\) g. Calculate the percentage error.",
      "answer": 2.4,
      "unit": "%",
      "hint": "Divide the absolute error by the exact reference value.",
      "solution": "\\(\\frac{|244-250|}{250}\\times100=2.4\\%\\). The denominator is 250, not 244."
    },
    {
      "id": "q11",
      "type": "number",
      "group": "Learning check",
      "prompt": "Estimate \\(\\frac{19.8\\times0.049}{0.102}\\) by rounding each input to 1 significant figure first.",
      "answer": 10,
      "unit": "write the requested form",
      "hint": "Use 20, 0.05, and 0.1.",
      "solution": "\\(\\frac{20\\times0.05}{0.1}=10\\). This is an estimate, not the unrounded calculation."
    },
    {
      "id": "q12",
      "type": "number",
      "group": "Learning check",
      "prompt": "Calculate \\(\\frac{7}{12}\\times360\\), retaining the unrounded fraction until the end.",
      "answer": 210,
      "unit": "write the requested form",
      "hint": "Keep 7/12 stored; do not replace it with 0.58.",
      "solution": "\\(\\frac{7}{12}\\times360=210\\) exactly. Using \\(0.58\\times360\\) would give the inaccurate intermediate-rounding result 208.8."
    }
  ],
  "frqs": [
    {
      "id": "s01",
      "title": "A sensor and a storage file",
      "context": "A sensor records a length of \\(0.0000368\\) m. Its data file occupies \\(5.24\\times10^6\\) bytes.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Write the length in the form \\(a\\times10^k\\), where \\(1\\le a<10\\) and \\(k\\in\\mathbb Z\\).",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> \\(3.68\\times10^{-5}\\text{ m}\\).</p><ol><li>A1: coefficient \\(3.68\\).</li><li>A1: exponent \\(-5\\), with correct scientific notation and unit.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Write the file size as an ordinary number of bytes.",
          "marks": 1,
          "rubric": "<p><strong>Worked answer:</strong> \\(5\\,240\\,000\\) bytes.</p><ol><li>A1: 5 240 000 bytes.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "The length is rounded to 2 significant figures. Write this rounded length in scientific notation.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> \\(3.7\\times10^{-5}\\text{ m}\\).</p><ol><li>A1: correctly round 3.68 to 3.7.</li><li>A1: retain the exponent \\(-5\\) and the requested form.</li></ol>"
        }
      ],
      "group": "IB-style short response",
      "calculator": true,
      "calculatorLabel": "GDC available · efficient by hand",
      "totalMarks": 5
    },
    {
      "id": "s02",
      "title": "Scientific notation operations",
      "context": "Treat the numbers in this question as exact.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Calculate \\((7.2\\times10^8)(4.5\\times10^{-3})\\). Give your answer in scientific notation.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> \\(32.4\\times10^5=3.24\\times10^6\\).</p><ol><li>M1: multiply coefficients and add exponents.</li><li>A1: \\(3.24\\times10^6\\).</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Calculate \\(\\frac{8.4\\times10^{-5}}{2.0\\times10^3}\\). Give your answer in scientific notation.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> \\(4.2\\times10^{-8}\\).</p><ol><li>M1: divide coefficients and subtract the denominator exponent.</li><li>A1: \\(4.2\\times10^{-8}\\).</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "Calculate \\(5.6\\times10^4-8.0\\times10^3\\). Give your answer in scientific notation.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> \\((5.6-0.8)\\times10^4=4.8\\times10^4\\).</p><ol><li>M1: use a common power of ten.</li><li>A1: \\(4.8\\times10^4\\).</li></ol>"
        }
      ],
      "group": "IB-style short response",
      "calculator": true,
      "calculatorLabel": "GDC available · efficient by hand",
      "totalMarks": 6
    },
    {
      "id": "s03",
      "title": "Scale and a meaningful estimate",
      "context": "A classroom model uses a total mass \\(M=4.86\\times10^{-3}\\) g and mass per particle \\(m=1.62\\times10^{-9}\\) g.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Calculate the number of particles \\(N=M/m\\).",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> \\(N=\\frac{4.86\\times10^{-3}}{1.62\\times10^{-9}}=3.00\\times10^6\\).</p><ol><li>M1: correct ratio with matching units.</li><li>A1: \\(3.00\\times10^6\\), or the exact value \\(3\\,000\\,000\\).</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Estimate N by rounding each mass to 1 significant figure before dividing.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> \\(\\frac{5\\times10^{-3}}{2\\times10^{-9}}=2.5\\times10^6\\).</p><ol><li>M1: use the stated rounded masses.</li><li>A1: \\(2.5\\times10^6\\).</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "Explain why the estimate supports the scale of the calculated answer.",
          "marks": 1,
          "rubric": "<p><strong>Worked answer:</strong> Both answers are a few million particles; the estimate supports an exponent of 6, though it is less precise.</p><ol><li>R1: compare the scale in context rather than claiming the values are equal.</li></ol>"
        }
      ],
      "group": "IB-style short response",
      "calculator": true,
      "calculatorLabel": "GDC available · useful for checking",
      "totalMarks": 5
    },
    {
      "id": "s04",
      "title": "Reporting accuracy",
      "context": "A calculation gives the value \\(0.0062749\\). A measured distance is recorded as \\(12.40\\) m.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Write the calculated value correct to 4 decimal places.",
          "marks": 1,
          "rubric": "<p><strong>Worked answer:</strong> \\(0.0063\\).</p><ol><li>A1: 0.0063.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Write the calculated value correct to 3 significant figures.",
          "marks": 1,
          "rubric": "<p><strong>Worked answer:</strong> \\(0.00627\\).</p><ol><li>A1: 0.00627.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "State the number of significant figures in \\(12.40\\), and explain what the final zero communicates.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> There are 4 significant figures. The final zero records precision to the hundredths of a metre.</p><ol><li>A1: 4 significant figures.</li><li>R1: explain the stated hundredths precision; 12.4 communicates less precision.</li></ol>"
        }
      ],
      "group": "IB-style short response",
      "calculator": true,
      "calculatorLabel": "GDC available · efficient by hand",
      "totalMarks": 4
    },
    {
      "id": "s05",
      "title": "Read and draw an error interval",
      "context": "A bottle volume is reported as \\(750\\) ml to the nearest \\(10\\) ml. Let \\(V\\) be its true volume.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Write down the lower and upper-bound endpoints of V.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> Lower \\(745\\) ml; upper endpoint \\(755\\) ml.</p><ol><li>A1: 745 ml.</li><li>A1: 755 ml.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Write the interval for V using inequalities. In your working, sketch it on a number line with the endpoints labeled.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> \\(745\\le V<755\\); filled circle at 745, open circle at 755, shaded interval between.</p><ol><li>A1: correct inequality signs and endpoints.</li><li>R1: sketch correctly represents the included lower and excluded upper endpoint.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "State whether a true volume of 755 ml is consistent with the report. Give a reason.",
          "marks": 1,
          "rubric": "<p><strong>Worked answer:</strong> No. Under the stated round-half-up convention, 755 ml rounds to 760 ml.</p><ol><li>R1: identify the excluded endpoint and its rounding result.</li></ol>"
        }
      ],
      "group": "IB-style short response",
      "calculator": true,
      "calculatorLabel": "GDC available · efficient by hand",
      "totalMarks": 5
    },
    {
      "id": "s06",
      "title": "A balance calibration",
      "context": "A calibration mass has exact reference value \\(80.0\\) g. A balance displays \\(78.6\\) g.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Calculate the absolute error in grams.",
          "marks": 1,
          "rubric": "<p><strong>Worked answer:</strong> \\(|78.6-80.0|=1.4\\text{ g}\\).</p><ol><li>A1: 1.4 g.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Calculate the percentage error, giving your answer to 3 significant figures.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> \\(\\frac{1.4}{80.0}\\times100=1.75\\%\\).</p><ol><li>M1: divide by the exact value 80.0 and multiply by 100.</li><li>A1: \\(1.75\\%\\).</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "The balance is acceptable when the percentage error is at most 2%. State whether it is acceptable, giving a reason.",
          "marks": 1,
          "rubric": "<p><strong>Worked answer:</strong> Yes, because 1.75% ≤ 2%.</p><ol><li>R1: correct comparison and contextual conclusion.</li></ol>"
        }
      ],
      "group": "IB-style short response",
      "calculator": true,
      "calculatorLabel": "GDC available · recommended for calculation",
      "totalMarks": 4
    },
    {
      "id": "s07",
      "title": "Bounds in a rectangle",
      "context": "A rectangle has length \\(L=8.4\\) cm and width \\(W=3.2\\) cm, each measured to the nearest \\(0.1\\) cm. Its area is \\(A=LW\\).",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Write the error interval for each measurement.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> \\(8.35\\le L<8.45\\), \\(3.15\\le W<3.25\\).</p><ol><li>A1: correct interval for L.</li><li>A1: correct interval for W.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Calculate the lower bound and upper-bound endpoint for the area. Give the endpoint calculations without rounding.",
          "marks": 3,
          "rubric": "<p><strong>Worked answer:</strong> \\(8.35(3.15)=26.3025\\); \\(8.45(3.25)=27.4625\\), in \\(\\text{cm}^2\\).</p><ol><li>M1: multiply the two lower endpoints and the two upper endpoints.</li><li>A1: \\(26.3025\\text{ cm}^2\\).</li><li>A1: \\(27.4625\\text{ cm}^2\\).</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "A label states that the area is definitely greater than 27 cm². Explain whether the measurements justify this statement.",
          "marks": 1,
          "rubric": "<p><strong>Worked answer:</strong> No. Possible areas include values below 27 cm² because the lower bound is 26.3025 cm².</p><ol><li>R1: use the lower bound to reject the guarantee.</li></ol>"
        }
      ],
      "group": "IB-style short response",
      "calculator": true,
      "calculatorLabel": "GDC available · recommended for endpoint products",
      "totalMarks": 6
    },
    {
      "id": "s08",
      "title": "Use stored precision",
      "context": "A model gives a share \\(p=\\frac{7}{12}\\) of a total of 360 units.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Calculate the share using the unrounded value of p.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> \\(\\frac7{12}\\times360=210\\) units.</p><ol><li>M1: correct unrounded expression.</li><li>A1: 210 units.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "A student rounds p to 2 decimal places before multiplying. Calculate the result of this method.",
          "marks": 1,
          "rubric": "<p><strong>Worked answer:</strong> \\(0.58(360)=208.8\\) units.</p><ol><li>A1: 208.8 units.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "Find the percentage error of 208.8 relative to the exact model result. Give your answer to 3 significant figures.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> \\(\\frac{|208.8-210|}{210}\\times100=0.571428\\ldots\\%\\approx0.571\\%\\).</p><ol><li>M1: correct error fraction using 210 as the reference.</li><li>A1: \\(0.571\\%\\).</li></ol>"
        }
      ],
      "group": "IB-style short response",
      "calculator": true,
      "calculatorLabel": "GDC available · recommended; retain the stored result",
      "totalMarks": 5
    },
    {
      "id": "e01",
      "title": "Water use in a school",
      "context": "For a classroom model, a school has exactly 1250 students. The reported water use is \\(6.40\\times10^4\\) litres per school day, correct to 3 significant figures.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Write the reported daily water use as an ordinary number. State its rounding unit.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> \\(64\\,000\\) litres; rounding unit 100 litres.</p><ol><li>A1: 64 000 litres.</li><li>A1: 100 litres, from the third significant digit.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Using the reported daily value, calculate water use per student per school day. Give your answer to 3 significant figures.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> \\(64\\,000/1250=51.2\\) litres.</p><ol><li>M1: divide total use by the exact student count.</li><li>A1: 51.2 litres per student per school day.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "Write an inequality for the true daily water use V.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> \\(63\\,950\\le V<64\\,050\\) litres.</p><ol><li>A1: correct endpoints.</li><li>A1: lower inclusive and upper exclusive.</li></ol>"
        },
        {
          "label": "(d)",
          "prompt": "Find the lower bound and upper-bound endpoint for the daily use per student, without rounding.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> \\(63\\,950/1250=51.16\\); \\(64\\,050/1250=51.24\\) litres.</p><ol><li>M1: divide each bound by the exact positive student count.</li><li>A1: 51.16 and 51.24 litres.</li></ol>"
        },
        {
          "label": "(e)",
          "prompt": "Explain why 51.200000 litres per student would suggest unsupported measurement precision.",
          "marks": 1,
          "rubric": "<p><strong>Worked answer:</strong> The input total is rounded to the nearest 100 litres. Extra displayed decimal places do not make that measurement more accurate.</p><ol><li>R1: connect the reported precision to the uncertain original measurement.</li></ol>"
        }
      ],
      "group": "IB-style extended response",
      "calculator": true,
      "calculatorLabel": "GDC available · recommended",
      "totalMarks": 9
    },
    {
      "id": "e02",
      "title": "Speed from rounded measurements",
      "context": "A trolley travels a distance \\(d=12.4\\) m in a time \\(t=3.2\\) s. Both measurements are rounded to the nearest \\(0.1\\) of their units. Average speed is \\(v=d/t\\).",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Calculate the speed from the reported measurements, to 3 significant figures.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> \\(12.4/3.2=3.875\\approx3.88\\text{ m s}^{-1}\\).</p><ol><li>M1: correct ratio.</li><li>A1: \\(3.88\\text{ m s}^{-1}\\).</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Write the error intervals for d and t.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> \\(12.35\\le d<12.45\\), \\(3.15\\le t<3.25\\).</p><ol><li>A1: interval for distance.</li><li>A1: interval for time.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "Find the lower and upper-bound endpoints for v. Give their exact fractional expressions and decimal approximations.",
          "marks": 4,
          "rubric": "<p><strong>Worked answer:</strong> \\(v_{\\rm low}=12.35/3.25=3.8\\); \\(v_{\\rm high}=12.45/3.15=83/21=3.952380\\ldots\\). Thus \\(3.8<v<83/21\\).</p><ol><li>M1: smallest numerator over largest denominator for the lower endpoint.</li><li>A1: \\(3.8\\), approached but not attained because \\(t<3.25\\).</li><li>M1: largest numerator over smallest denominator for the upper endpoint.</li><li>A1: \\(83/21\\), approached but not attained because \\(d<12.45\\).</li></ol>"
        },
        {
          "label": "(d)",
          "prompt": "Can the measurements guarantee that the average speed was below 4 m/s? Explain.",
          "marks": 1,
          "rubric": "<p><strong>Worked answer:</strong> Yes. Every possible speed is less than 83/21 m/s, which is less than 4 m/s.</p><ol><li>R1: use the upper bound and make the correct contextual conclusion.</li></ol>"
        }
      ],
      "group": "IB-style extended response",
      "calculator": true,
      "calculatorLabel": "GDC available · recommended",
      "totalMarks": 9
    },
    {
      "id": "e03",
      "title": "A circular sign and percentage error",
      "context": "A circular sign has measured radius \\(r=2.50\\) m, correct to 3 significant figures. Use \\(A=\\pi r^2\\). A supplier quotes an approximate area of \\(19.5\\text{ m}^2\\). For the percentage-error calculation only, use the nominal model value \\(A_0=\\pi(2.50)^2\\) as the exact reference.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Calculate A₀ to 3 significant figures. Keep its unrounded value for later parts.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> \\(A_0=6.25\\pi=19.634954\\ldots\\approx19.6\\text{ m}^2\\).</p><ol><li>M1: correct area substitution.</li><li>A1: \\(19.6\\text{ m}^2\\) to 3 s.f.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Calculate the percentage error of the supplier’s quote relative to A₀, to 3 significant figures.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> \\(\\frac{|19.5-6.25\\pi|}{6.25\\pi}\\times100=0.687315\\ldots\\%\\approx0.687\\%\\).</p><ol><li>M1: use the unrounded reference \\(6.25\\pi\\).</li><li>A1: \\(0.687\\%\\).</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "Write the error interval for the radius and calculate the area-bound endpoints. Give the endpoints in exact form.",
          "marks": 3,
          "rubric": "<p><strong>Worked answer:</strong> \\(2.495\\le r<2.505\\), so \\(6.225025\\pi\\le A<6.275025\\pi\\text{ m}^2\\).</p><ol><li>A1: correct radius interval.</li><li>M1: square each positive radius endpoint and multiply by π.</li><li>A1: correct area endpoints and inequality.</li></ol>"
        },
        {
          "label": "(d)",
          "prompt": "Explain why A₀ is a model reference rather than a known exact measurement of the real area.",
          "marks": 1,
          "rubric": "<p><strong>Worked answer:</strong> The radius was rounded; its true value can vary within the interval. Therefore the physical area need not equal the nominal model value.</p><ol><li>R1: connect input rounding to uncertainty in the real area.</li></ol>"
        }
      ],
      "group": "IB-style extended response",
      "calculator": true,
      "calculatorLabel": "GDC available · recommended; use the π key",
      "totalMarks": 8
    },
    {
      "id": "c01",
      "title": "A rounding carry",
      "context": "A sensor gives \\(0.009996\\) m before rounding.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Write this value to 3 significant figures, using scientific notation.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> \\(1.00\\times10^{-2}\\text{ m}\\).</p><ol><li>M1: rounding 9.996 to 3 s.f. carries to 10.0.</li><li>A1: normalize to \\(1.00\\times10^{-2}\\), preserving 3 s.f.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "A student writes 0.01 m. Explain what is missing from that report.",
          "marks": 1,
          "rubric": "<p><strong>Worked answer:</strong> The value is numerically equal, but the two required trailing significant zeros have not been communicated.</p><ol><li>R1: distinguish numerical value from the requested precision.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "A different instrument rounds lengths to the nearest 0.0001 m and reports 0.0100 m. Write the error interval for this report.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> \\(0.00995\\le x<0.01005\\text{ m}\\).</p><ol><li>M1: rounding unit \\(0.0001\\), half-unit \\(0.00005\\).</li><li>A1: correct endpoints and inequality.</li></ol>"
        }
      ],
      "group": "Relevant SL challenge",
      "calculator": true,
      "calculatorLabel": "GDC available · efficient by hand",
      "totalMarks": 5
    },
    {
      "id": "c02",
      "title": "Subtracting rounded measurements",
      "context": "Two positive lengths are reported as \\(a=5.2\\) cm and \\(b=3.7\\) cm, each to the nearest \\(0.1\\) cm. Let \\(D=a-b\\).",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Write the error intervals for a and b.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> \\(5.15\\le a<5.25\\), \\(3.65\\le b<3.75\\).</p><ol><li>A1: interval for a.</li><li>A1: interval for b.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Find the lower and upper-bound endpoints for D. Explain your choice of endpoints.",
          "marks": 3,
          "rubric": "<p><strong>Worked answer:</strong> \\(D_{\\rm low}=5.15-3.75=1.40\\), \\(D_{\\rm high}=5.25-3.65=1.60\\). Hence \\(1.40<D<1.60\\).</p><ol><li>M1: smallest a minus largest b for the lower endpoint; largest a minus smallest b for the upper endpoint.</li><li>A1: correct endpoints.</li><li>R1: neither endpoint is attained because each requires an excluded upper endpoint.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "Explain why subtracting the lower bounds does not give the lower bound for D.",
          "marks": 1,
          "rubric": "<p><strong>Worked answer:</strong> Subtracting a larger b makes D smaller; the lower bound must therefore use b’s upper endpoint.</p><ol><li>R1: correct directional reasoning.</li></ol>"
        }
      ],
      "group": "Relevant SL challenge",
      "calculator": true,
      "calculatorLabel": "GDC available · efficient by hand",
      "totalMarks": 6
    },
    {
      "id": "c03",
      "title": "Equal decimal answers, different information",
      "context": "Two instruments report a mass as \\(4.6\\) g and \\(4.60\\) g respectively. Each instrument rounds to the last displayed decimal place.",
      "parts": [
        {
          "label": "(a)",
          "prompt": "Write the error interval for each report.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> \\(4.55\\le m<4.65\\) for 4.6; \\(4.595\\le m<4.605\\) for 4.60.</p><ol><li>A1: first interval.</li><li>A1: second interval.</li></ol>"
        },
        {
          "label": "(b)",
          "prompt": "Compare the widths of the two intervals.",
          "marks": 2,
          "rubric": "<p><strong>Worked answer:</strong> Widths are 0.10 g and 0.010 g. The first is 10 times the second.</p><ol><li>M1: calculate both widths.</li><li>A1: correct factor of 10.</li></ol>"
        },
        {
          "label": "(c)",
          "prompt": "Does the finer reported precision establish that the second instrument is more accurate? Explain.",
          "marks": 1,
          "rubric": "<p><strong>Worked answer:</strong> No. Both central readings are numerically 4.6 g, so they are equally close to any given true mass. Finer reported precision alone does not establish a more accurate instrument; evaluating accuracy needs a trustworthy reference.</p><ol><li>R1: correctly distinguish precision from accuracy.</li></ol>"
        }
      ],
      "group": "Relevant SL challenge",
      "calculator": true,
      "calculatorLabel": "GDC available · efficient by hand",
      "totalMarks": 5
    }
  ],
  "sections": [
    "SL 1.1",
    "SL 1.6"
  ]
};if(typeof module!=="undefined"&&module.exports)module.exports=data;else root.PrecisionLessonQuestions=data;})(typeof window!=="undefined"?window:globalThis);
