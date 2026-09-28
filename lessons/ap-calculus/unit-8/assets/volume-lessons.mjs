/* Original ECHS learning content. Scene geometry lives in the separate model.
 * Platform lesson numbering is retained; cedTopics records the official mapping.
 * Classroom practice is formative and does not itself award verified mastery.
 */
const tex = String.raw;
const practices = {
  process: 'Implementing Mathematical Processes',
  connect: 'Connecting Representations',
  justify: 'Justification',
  communicate: 'Communication and Notation'
};
const core = {
  schemaVersion: 'echs.volume-lesson.v1',
  scope: 'AP Calculus AB / BC',
  curriculumVersion: 'ap-calculus-2026-27',
  provenance: 'Original ECHS instructional examples and formative practice; no protected AP Classroom questions.',
  evidencePolicy: 'Responses and reveals support formative learning; they do not establish verified mastery.'
};

export const LESSONS = {
  'cross-sections': {
    ...core,
    id: 'cross-sections',
    number: '8.5',
    title: 'Volumes by Cross Sections',
    cedTopics: ['8.7', '8.8'],
    objectives: [
      'Construct a cross-sectional area function from a base region and a stated geometric shape.',
      'Calculate and interpret a solid’s volume using a definite integral with appropriate bounds and units.',
      'Justify how a change in cross-sectional shape or scale changes volume by connecting a 3D model, a table, and an integral.'
    ],
    stages: [
      {
        id: 'cs-intro', title: 'One footprint. Many possible solids.', phase: 'Notice', kind: 'intro',
        body: [
          'A flat base does not tell us how much space a solid occupies. We must also know what is built above every slice of the base.',
          'Our shared base lies between y = x² and y = x for 0 ≤ x ≤ 1. The 3D model lifts a shape above each vertical segment.',
          'Before calculating: would square slices or semicircular slices with the same width build the larger solid?'
        ],
        formulas: [tex`0\le x\le1,\qquad x^2\le y\le x`, tex`w(x)=x-x^2`],
        practices: [practices.connect], representations: ['graphical', 'verbal']
      },
      {
        id: 'cs-explore-square', title: 'Move the slice. Explain what changes.', phase: 'Explore', kind: 'lab',
        scenario: 'cross-x', shape: 'square',
        body: [
          'Move the representative slice from x = 0 to x = 1. Watch its position in the base, its square face, and its area change together.',
          'Pause at x = 0.5. The width is 0.25, so the square area is 0.0625. At both endpoints, the width and area are zero.',
          'Predict where the largest square occurs, then use the model to check. A wider base segment produces a larger face, not a thicker slice.'
        ],
        prompt: 'What two measurements would you multiply to estimate the volume of one thin slice?',
        formulas: [tex`\Delta V\approx A(x)\,\Delta x`],
        practices: [practices.connect, practices.communicate], representations: ['graphical', 'analytical', 'verbal']
      },
      {
        id: 'cs-notes', title: 'From a slice to the whole solid', phase: 'Connect', kind: 'notes',
        body: [
          'A(x) means the area of the face perpendicular to the x-axis. It is not the area of the base region.',
          'A thin slice has approximate volume A(x)Δx. Adding slices and taking the limit gives the exact volume.',
          'Area has square units; thickness has length units; their product has cubic units. If the slices are perpendicular to the y-axis, use A(y) and dy instead.'
        ],
        formulas: [tex`V=\lim_{n\to\infty}\sum_{i=1}^{n}A(x_i^*)\,\Delta x=\int_a^b A(x)\,dx`, tex`[\text{length}^2]\,[\text{length}]=[\text{length}^3]`],
        practices: [practices.connect, practices.communicate], representations: ['analytical', 'verbal']
      },
      {
        id: 'cs-worked', title: 'Build the area function before integrating', phase: 'Model', kind: 'example',
        body: [
          'For square slices, the side length is the vertical distance from y = x² to y = x. Square that distance to obtain the area.',
          'The curves meet at x = 0 and x = 1, which provide the bounds.',
          'The answer is a volume: 1/30 cubic unit. The base area alone would not determine it without the square cross-section rule.'
        ],
        formulas: [tex`A(x)=(x-x^2)^2=x^2-2x^3+x^4`, tex`V=\int_0^1(x-x^2)^2\,dx=\left[\frac{x^3}{3}-\frac{x^4}{2}+\frac{x^5}{5}\right]_0^1=\frac1{30}`],
        practices: [practices.process, practices.communicate], representations: ['analytical', 'verbal'], calculatorPolicy: 'Not required'
      },
      {
        id: 'cs-shape-lab', title: 'Change the shape, keep the footprint', phase: 'Compare', kind: 'lab',
        scenario: 'cross-x', shape: 'semicircle',
        body: [
          'The base segment is now the diameter of a semicircle. Its radius is half the width.',
          'Compare the semicircle with a square at the same slice position. The semicircular face has π/8 times the square’s area, at every position.',
          'Because every corresponding slice has the same area ratio, the complete solids have that same volume ratio. Change the shape control to test other relationships.'
        ],
        formulas: [tex`A(x)=\frac12\pi\left(\frac{w(x)}2\right)^2=\frac\pi8w(x)^2`, tex`V_{\text{semicircle}}=\frac\pi8\left(\frac1{30}\right)=\frac\pi{240}`],
        prompt: 'Explain why a fixed ratio between corresponding face areas gives the same ratio between the complete volumes.',
        practices: [practices.connect, practices.justify], representations: ['graphical', 'analytical', 'verbal']
      },
      {
        id: 'cs-shape-notes', title: 'What does the base segment represent?', phase: 'Clarify', kind: 'notes',
        body: [
          'Let w be the base-segment length. Read the geometric description before choosing an area formula.',
          'The rectangle here has height 2w. Both right-triangle options are isosceles: w is a leg in one option and the hypotenuse in the other.',
          'For the semicircle, w is the diameter. Confusing a diameter with a radius makes this area four times too large.'
        ],
        formulas: [
          tex`A_{\text{square}}=w^2,\qquad A_{\text{rectangle, height }2w}=2w^2`,
          tex`A_{\text{equilateral}}=\frac{\sqrt3}{4}w^2`,
          tex`A_{\text{right isosceles, leg }w}=\frac12w^2,\qquad A_{\text{right isosceles, hypotenuse }w}=\frac14w^2`,
          tex`A_{\text{semicircle, diameter }w}=\frac\pi8w^2`
        ],
        practices: [practices.process, practices.connect], representations: ['analytical', 'verbal']
      },
      {
        id: 'cs-table', title: 'A numerical estimate that becomes an integral', phase: 'Estimate', kind: 'notes',
        body: [
          'Use four equal subintervals and the square face at each midpoint. Each slice has thickness 0.25.',
          'The table entries below are exact. Their sum times 0.25 gives 137/4096 ≈ 0.033447 cubic unit.',
          'The exact volume is 1/30 ≈ 0.033333. More slices reduce the visual gaps and, for this continuous area function, the sums converge to the integral. A finite stack remains an approximation.'
        ],
        formulas: [tex`\begin{array}{c|cccc}x_i^*&1/8&3/8&5/8&7/8\\\hline A(x_i^*)&49/4096&225/4096&225/4096&49/4096\end{array}`, tex`M_4=\frac14\left(\frac{49+225+225+49}{4096}\right)=\frac{137}{4096}`],
        practices: [practices.process, practices.connect], representations: ['numerical', 'analytical', 'graphical'], calculatorPolicy: 'Optional for decimal comparison'
      },
      {
        id: 'cs-misconception', title: '“I integrated the width. Is that the volume?”', phase: 'Diagnose', kind: 'reflection',
        prompt: 'A student calculates ∫₀¹(x − x²) dx = 1/6 and labels it the volume of the square-slice solid. Explain the error using geometry and units.',
        body: ['Write an explanation before revealing the comparison. A correct calculation can still answer the wrong question.'],
        hints: ['What geometric quantity is x − x²?', 'What are the units of width × dx?'],
        solution: ['x − x² is a length, so its integral with respect to x is the area of the flat base, 1/6 square unit. The square face area is (x − x²)², and integrating that area gives 1/30 cubic unit.'],
        solutionFormulas: [tex`\text{Base area}=\int_0^1w(x)\,dx,\qquad \text{Volume}=\int_0^1w(x)^2\,dx`],
        practices: [practices.justify, practices.communicate], representations: ['analytical', 'verbal']
      },
      {
        id: 'cs-mcq-diameter', title: 'Check 1 · Diameter or radius?', phase: 'Practice', kind: 'question',
        prompt: 'A solid has base 0 ≤ x ≤ 2 and 0 ≤ y ≤ 4 − x². Cross sections perpendicular to the x-axis are semicircles whose diameters lie in the base. Which expression gives the volume?',
        choices: ['∫₀² (4 − x²) dx', '(π/4) ∫₀² (4 − x²)² dx', '(π/8) ∫₀² (4 − x²)² dx', '(π/2) ∫₀² (4 − x²)² dx'],
        correct: 2,
        hints: ['The diameter is 4 − x².', 'A semicircle has half the area of a circle; the radius is half the diameter.'],
        solution: ['The radius is (4 − x²)/2. The area of each semicircle is (π/8)(4 − x²)², so integrate this area from 0 to 2. The first expression calculates base area; the last treats the diameter as a radius.'],
        solutionFormulas: [tex`V=\int_0^2\frac12\pi\left(\frac{4-x^2}{2}\right)^2dx=\frac\pi8\int_0^2(4-x^2)^2dx`],
        practices: [practices.process, practices.connect], representations: ['analytical', 'verbal'], calculatorPolicy: 'Not required', original: true
      },
      {
        id: 'cs-mcq-leg', title: 'Check 2 · The same width, a different triangle', phase: 'Practice', kind: 'question',
        prompt: 'Two solids share the same base and slice direction. Every cross section is a right isosceles triangle. In solid L the base segment is a leg; in solid H it is the hypotenuse. How are the volumes related?',
        choices: ['Vᴸ = Vᴴ', 'Vᴸ = 2Vᴴ', 'Vᴸ = √2 Vᴴ', 'Vᴸ = Vᴴ/2'],
        correct: 1,
        hints: ['If the hypotenuse is w, each leg is w/√2.', 'Compare the two face areas before integrating.'],
        solution: ['The area for solid L is w²/2. For solid H it is (1/2)(w/√2)² = w²/4. Each face in L has twice the area of the corresponding face in H, so its volume is twice as large.'],
        solutionFormulas: [tex`A_L(x)=\frac{w(x)^2}{2}=2\left(\frac{w(x)^2}{4}\right)=2A_H(x)`],
        practices: [practices.connect, practices.justify], representations: ['analytical', 'verbal'], calculatorPolicy: 'Not required', original: true
      },
      {
        id: 'cs-frq', title: 'Explain a complete volume model', phase: 'Apply', kind: 'reflection',
        prompt: 'Original AP-style practice · The base is bounded by y = 2x and y = x². Cross sections perpendicular to the x-axis are squares. Give a connected solution to all three parts.',
        parts: ['Find the interval of integration and explain how the bounds are obtained.', 'Write the cross-sectional area function and calculate the exact volume.', 'If every square is replaced by a rectangle with the same base and twice its height, determine the new volume without repeating the integration.'],
        hints: ['Solve x² = 2x for the intersections.', 'Between the intersections, the upper curve is 2x.', 'Compare corresponding cross-sectional areas.'],
        solution: ['The curves meet at x = 0 and x = 2. The square side is 2x − x², so the volume is 16/15 cubic units. Doubling every face area doubles the volume to 32/15 cubic units. State the bounds, geometric area function, integral, and units in your response.'],
        solutionFormulas: [tex`A(x)=(2x-x^2)^2`, tex`V=\int_0^2(2x-x^2)^2dx=\left[\frac{4x^3}{3}-x^4+\frac{x^5}{5}\right]_0^2=\frac{16}{15}`],
        practices: [practices.process, practices.justify, practices.communicate], representations: ['analytical', 'verbal'], calculatorPolicy: 'Not required', original: true
      },
      {
        id: 'cs-qatar-design', title: 'Design extension · An illustrative water-storage module', phase: 'Extend', kind: 'reflection',
        body: [
          'Optional Qatar context: imagine a school engineering team proposing a small water-storage module for a campus garden in Doha. This is a hypothetical geometry model, not a real tank or a claim about water-use data.',
          'Use the shared base x² ≤ y ≤ x for 0 ≤ x ≤ 1, with coordinates in meters. Rectangular cross sections have width w = x − x² and height 2w. Ignore wall thickness.',
          'A full-size version multiplies every length by 3. Predict how capacity changes before calculating.'
        ],
        prompt: 'Find the small module’s capacity in cubic meters and liters. Then justify the full-size capacity. Why would multiplying the volume by 3 be incorrect?',
        hints: ['The rectangular area is 2w².', 'A cubic meter is 1,000 liters.', 'Scaling all three dimensions multiplies volume by the cube of the scale factor.'],
        solution: ['The small module holds 1/15 m³, about 66.7 L. Scaling every length by 3 multiplies capacity by 27, giving 9/5 m³ = 1,800 L. Multiplying only by 3 would account for a change in just one dimension. These are idealized geometric capacities.'],
        solutionFormulas: [tex`V=2\int_0^1(x-x^2)^2dx=\frac1{15}\text{ m}^3`, tex`V_{\text{scaled}}=3^3V=\frac95\text{ m}^3=1800\text{ L}`],
        practices: [practices.process, practices.justify, practices.communicate], representations: ['analytical', 'verbal'], calculatorPolicy: 'Optional', original: true
      },
      {
        id: 'cs-exit', title: 'Exit evidence · Describe the slice', phase: 'Reflect', kind: 'reflection',
        prompt: 'For the shared base, describe the semicircular face at x = 0.5. State its diameter, radius, and area; then write the integral for the whole solid. Explain why neither the slice area nor the base area is the volume.',
        hints: ['At x = 0.5, the width is 0.5 − 0.25.'],
        solution: ['The diameter is 1/4, the radius is 1/8, and the face area is π/128 square unit. The whole volume accumulates the areas of all faces through their thicknesses; it is π/240 cubic unit.'],
        solutionFormulas: [tex`A(1/2)=\frac12\pi\left(\frac18\right)^2=\frac\pi{128}`, tex`V=\frac\pi8\int_0^1(x-x^2)^2dx=\frac\pi{240}`],
        practices: [practices.communicate, practices.connect], representations: ['analytical', 'verbal'], calculatorPolicy: 'Not required', original: true
      },
      {
        id: 'cs-summary', title: 'Your transferable method', phase: 'Consolidate', kind: 'summary',
        body: [
          'Identify the slice direction and the interval through which the slice moves.',
          'Find the segment length in the base. Use the stated shape to turn that length into a face area.',
          'Integrate area with respect to thickness. Check that the units are cubic and the volume is nonnegative.',
          'Use the 3D solid, the 2D base, a numerical stack, and the integral to explain the same construction. A visualization supports your reasoning; your explanation supplies the evidence.'
        ],
        formulas: [tex`\boxed{\text{base segment}\ \longrightarrow\ A(x)\ \longrightarrow\ \int_a^b A(x)\,dx}`]
      }
    ]
  },

  'disks-washers': {
    ...core,
    id: 'disks-washers',
    number: '8.6',
    title: 'Volumes by Disc and Washer Methods',
    cedTopics: ['8.9', '8.11'],
    objectives: [
      'Distinguish a disk from a washer by examining how a filled region meets its axis of rotation.',
      'Construct and evaluate disk or washer integrals about the x-axis and the y-axis using perpendicular slices.',
      'Justify the radii, bounds, and differential by connecting the region, a representative face, and the resulting solid.'
    ],
    stages: [
      {
        id: 'dw-intro', title: 'Rotate a region, reveal a solid', phase: 'Notice', kind: 'intro',
        body: [
          'Imagine rotating a filled 2D region through a full turn. A segment perpendicular to the rotation axis sweeps out a circular face.',
          'If that segment touches the axis, the face is a disk. If it stops short of the axis, the face has a hole: a washer.',
          'The familiar cross-section idea still applies. Only the geometry of A has changed. “Disk” and “disc” refer to the same method.'
        ],
        formulas: [tex`V=\int A\,d(\text{position})`],
        practices: [practices.connect], representations: ['graphical', 'verbal']
      },
      {
        id: 'dw-disk-lab', title: 'From a segment to a disk', phase: 'Explore', kind: 'lab',
        scenario: 'disk-x',
        body: [
          'The filled region is 0 ≤ y ≤ √x for 0 ≤ x ≤ 4. Rotate it about the x-axis.',
          'At x = 1 the disk radius is 1; at x = 4 it is 2. Moving the slice changes the radius but does not change its orientation.',
          'Use the construction and slice controls to connect the flat region to the curved solid. The disk radius is a distance from the axis, not the entire diameter.'
        ],
        formulas: [tex`R(x)=\sqrt{x},\qquad A(x)=\pi x`],
        prompt: 'If the radius doubles, what happens to the face area? Explain using both the model and the formula.',
        practices: [practices.connect, practices.justify], representations: ['graphical', 'analytical', 'verbal']
      },
      {
        id: 'dw-notes', title: 'Choose the thickness before the integral', phase: 'Connect', kind: 'notes',
        body: [
          'Disk and washer faces are perpendicular to the rotation axis.',
          'About the x-axis, use vertical base segments and thickness dx. About the y-axis, use horizontal base segments and thickness dy.',
          'A washer area is the outer disk area minus the inner disk area. A disk is the special case r = 0. Define radii as nonnegative distances.'
        ],
        formulas: [tex`A=\pi(R^2-r^2),\qquad R\ge r\ge0`, tex`V_x=\pi\int_a^b\bigl(R(x)^2-r(x)^2\bigr)\,dx`, tex`V_y=\pi\int_c^d\bigl(R(y)^2-r(y)^2\bigr)\,dy`],
        practices: [practices.process, practices.communicate], representations: ['analytical', 'verbal']
      },
      {
        id: 'dw-disk-example', title: 'A complete disk calculation', phase: 'Model', kind: 'example',
        body: [
          'For the region under y = √x on [0, 4], the x-axis touches every vertical segment, so the inner radius is zero.',
          'Square the radius before integrating. The disk area is πx, not π√x.',
          'If the coordinate lengths are measured in centimeters, the result is 8π cm³, approximately 25.133 cm³.'
        ],
        formulas: [tex`V=\pi\int_0^4(\sqrt{x})^2\,dx=\pi\int_0^4x\,dx=\left[\frac{\pi x^2}{2}\right]_0^4=8\pi`],
        practices: [practices.process, practices.communicate], representations: ['analytical', 'verbal'], calculatorPolicy: 'Optional for decimal value'
      },
      {
        id: 'dw-washer-x-lab', title: 'The hole is part of the mathematics', phase: 'Explore', kind: 'lab',
        scenario: 'washer-x',
        body: [
          'Return to the base between y = x² and y = x on [0, 1]. Rotate the filled region about the x-axis.',
          'A vertical segment begins above the axis, so its rotation leaves a hole. The distance to y = x is the outer radius; the distance to y = x² is the inner radius.',
          'Move the slice and locate both radii in the 2D region and the 3D face. They meet at the endpoints, where the washer area is zero.'
        ],
        formulas: [tex`R(x)=x,\qquad r(x)=x^2,\qquad A(x)=\pi(x^2-x^4)`],
        prompt: 'At x = 0.5, identify the outer radius, inner radius, and the material between them.',
        practices: [practices.connect, practices.communicate], representations: ['graphical', 'analytical', 'verbal']
      },
      {
        id: 'dw-gap-misconception', title: 'Why not π(R − r)²?', phase: 'Diagnose', kind: 'reflection',
        prompt: 'At x = 0.5 the washer has R = 0.5 and r = 0.25. A student uses π(0.5 − 0.25)² for its area. Explain what shape that expression measures and calculate the actual washer area.',
        body: ['The material’s radial width is useful, but it is not the radius of a replacement disk.'],
        hints: ['Subtract the two circular areas.', 'A disk of radius R − r does not have the washer’s hole or outer boundary.'],
        solution: ['π(R − r)² is the area of a disk of radius 0.25, giving π/16. The actual washer area is π(0.5² − 0.25²) = 3π/16. Subtract squared radii; do not square the difference.'],
        solutionFormulas: [tex`\pi(R^2-r^2)=\pi(R-r)(R+r)\ne\pi(R-r)^2\quad(0<r<R)`],
        practices: [practices.justify, practices.connect], representations: ['analytical', 'verbal']
      },
      {
        id: 'dw-washer-example', title: 'Exact volume and a four-slice estimate', phase: 'Model', kind: 'example',
        body: [
          'Integrating the washer area gives the exact volume about the x-axis.',
          'Four equal midpoint slices give M₄ = 567π/4096 ≈ 0.434884 cubic unit. The exact volume is 2π/15 ≈ 0.418879.',
          'The finite stack slightly overestimates this particular volume. Do not infer that all midpoint sums overestimate; that depends on the area function.'
        ],
        formulas: [tex`V=\pi\int_0^1(x^2-x^4)\,dx=\pi\left[\frac{x^3}{3}-\frac{x^5}{5}\right]_0^1=\frac{2\pi}{15}`, tex`M_4=\frac\pi4\sum_{i=1}^4\left[\left(\frac{2i-1}{8}\right)^2-\left(\frac{2i-1}{8}\right)^4\right]=\frac{567\pi}{4096}`],
        practices: [practices.process, practices.connect], representations: ['analytical', 'numerical'], calculatorPolicy: 'Optional for numerical comparison'
      },
      {
        id: 'dw-washer-y-lab', title: 'Rotate the same base about a different axis', phase: 'Compare', kind: 'lab',
        scenario: 'washer-y',
        body: [
          'Rotate the same base about the y-axis. Perpendicular slices are now horizontal, so describe the boundaries as x-functions of y.',
          'The left boundary is x = y; the right boundary is x = √y, for 0 ≤ y ≤ 1. Distances from the y-axis are therefore r = y and R = √y.',
          'This rotation produces a different solid and a different volume. The flat base alone does not determine the volume of revolution.'
        ],
        formulas: [tex`V_y=\pi\int_0^1\bigl((\sqrt y)^2-y^2\bigr)\,dy=\frac\pi6`],
        prompt: 'Point to the segment that becomes a washer. Why must the integral use dy, and why is its outer radius √y?',
        practices: [practices.connect, practices.justify], representations: ['graphical', 'analytical', 'verbal']
      },
      {
        id: 'dw-mcq-y-axis', title: 'Check 1 · Read a horizontal segment', phase: 'Practice', kind: 'question',
        prompt: 'The region 0 ≤ y ≤ 1, y² ≤ x ≤ 2y is revolved about the y-axis. Which integral represents the volume?',
        choices: ['π ∫₀¹ (4y² − y⁴) dy', 'π ∫₀¹ (2y − y²)² dy', 'π ∫₀¹ (y⁴ − 4y²) dy', 'π ∫₀¹ (2y − y²) dy'],
        correct: 0,
        hints: ['For washers about the y-axis, use horizontal segments.', 'Which endpoint is farther from x = 0?'],
        solution: ['R = 2y and r = y² on [0, 1]. Thus A(y) = π[(2y)² − (y²)²] = π(4y² − y⁴). The squared-width choice confuses a washer with a disk.'],
        solutionFormulas: [tex`V=\pi\int_0^1\left[(2y)^2-(y^2)^2\right]dy`],
        practices: [practices.process, practices.connect], representations: ['analytical', 'verbal'], calculatorPolicy: 'Not required', original: true
      },
      {
        id: 'dw-mcq-slice', title: 'Check 2 · What is one slice worth?', phase: 'Practice', kind: 'question',
        prompt: 'A thin washer has outer radius 3 cm, inner radius 1 cm, and thickness Δx cm. Which expression approximates its volume in cubic centimeters?',
        choices: ['4π Δx', '8π', '8π Δx', '2π Δx'],
        correct: 2,
        hints: ['First find the face area.', 'A volume estimate requires a thickness factor.'],
        solution: ['The face area is π(3² − 1²) = 8π cm². Multiplying by the thickness gives 8πΔx cm³. The expression 8π alone describes area, not volume.'],
        solutionFormulas: [tex`\Delta V\approx\pi(3^2-1^2)\,\Delta x=8\pi\,\Delta x`],
        practices: [practices.process, practices.communicate], representations: ['numerical', 'verbal'], calculatorPolicy: 'Not required', original: true
      },
      {
        id: 'dw-frq', title: 'Same region. Two rotations. Defend the comparison.', phase: 'Apply', kind: 'reflection',
        prompt: 'Original AP-style practice · Let R be bounded by y = x² and y = x. A student claims that rotating R about either coordinate axis must give the same volume because its area is unchanged.',
        parts: ['Write and evaluate a washer integral for rotation about the x-axis.', 'Write and evaluate a washer integral for rotation about the y-axis.', 'Use the results and the geometry to evaluate the student’s claim.'],
        hints: ['For the first rotation, use R(x) = x and r(x) = x².', 'For the second, rewrite the boundaries as x = y and x = √y.', 'The same material in the plane can have different distances from different rotation axes.'],
        solution: ['The x-axis rotation has volume 2π/15. The y-axis rotation has volume π/6, which is larger by π/30 cubic unit. The claim is false: the rotation axis determines the radii and therefore the solid. Keeping the flat area unchanged does not keep the volume unchanged.'],
        solutionFormulas: [tex`V_x=\pi\int_0^1(x^2-x^4)dx=\frac{2\pi}{15}`, tex`V_y=\pi\int_0^1(y-y^2)dy=\frac\pi6,\qquad V_y-V_x=\frac\pi{30}`],
        practices: [practices.process, practices.justify, practices.communicate], representations: ['analytical', 'verbal'], calculatorPolicy: 'Not required', original: true
      },
      {
        id: 'dw-disk-y-challenge', title: 'Switch coordinates without changing the idea', phase: 'Extend', kind: 'lab',
        scenario: 'disk-y',
        body: [
          'This is a new region: 0 ≤ x ≤ √y for 0 ≤ y ≤ 4, rotated about the y-axis. It is the coordinate-swapped version of the earlier disk example.',
          'Use a horizontal segment: R(y) = √y and r(y) = 0. Its faces are disks, with area πy.',
          'Compare the orientation with the earlier x-axis solid. A coordinate swap changes the description and orientation but preserves this solid’s size.'
        ],
        prompt: 'Write the volume integral before checking the model’s displayed value. Explain why the result is 8π even though the differential is now dy.',
        formulas: [tex`V=\pi\int_0^4y\,dy=8\pi`],
        practices: [practices.connect, practices.justify], representations: ['graphical', 'analytical', 'verbal']
      },
      {
        id: 'dw-exit', title: 'Exit evidence · A sketch in words', phase: 'Reflect', kind: 'reflection',
        prompt: 'For the region between y = x² and y = x rotated about the x-axis, explain the slice direction, outer radius, inner radius, bounds, and integral. Then explain the single geometric change that would make a washer into a disk.',
        hints: ['Imagine moving the inner endpoint until it reaches the rotation axis.'],
        solution: ['Vertical segments produce faces perpendicular to the x-axis, so use dx on [0, 1]. The outer radius is x and inner radius is x². The integral is π∫₀¹(x² − x⁴) dx. If the segment reaches the axis, the inner radius becomes zero and the hole disappears, leaving a disk.'],
        practices: [practices.communicate, practices.connect], representations: ['analytical', 'verbal'], calculatorPolicy: 'Not required', original: true
      },
      {
        id: 'dw-summary', title: 'The region tells you the radii', phase: 'Consolidate', kind: 'summary',
        body: [
          'Sketch the filled region and the axis, then draw a segment perpendicular to that axis.',
          'Measure both endpoints from the axis. The farther distance is R; the nearer distance is r.',
          'Use π(R² − r²), appropriate bounds, and the differential that matches your slice thickness.',
          'Verify with the 3D cross section: a disk has no hole; a washer does. Check units, nonnegative face areas, and the difference between a finite estimate and the exact integral.'
        ],
        formulas: [tex`\boxed{\text{perpendicular slice}\ \longrightarrow\ \pi(R^2-r^2)\ \longrightarrow\ V}`]
      }
    ]
  },

  'about-a-line': {
    ...core,
    id: 'about-a-line',
    number: '8.7',
    title: 'Volume About a Line',
    cedTopics: ['8.10', '8.12'],
    objectives: [
      'Determine outer and inner radii as distances from a specified horizontal or vertical rotation line.',
      'Construct and evaluate disk or washer integrals about lines other than the coordinate axes.',
      'Justify how moving the rotation axis changes the radii and volume, while distinguishing perpendicular washer slices from an optional parallel-shell extension.'
    ],
    stages: [
      {
        id: 'line-intro', title: 'The axis moved. What must change?', phase: 'Notice', kind: 'intro',
        body: [
          'A function value is a coordinate. A radius is a distance from the rotation axis. These coincide only in some familiar cases.',
          'We will rotate the base between y = x² and y = x about lines outside it, then compare the results.',
          'The central question is always: how far is each boundary from this axis?'
        ],
        formulas: [tex`\operatorname{distance}(y,c)=|y-c|,\qquad \operatorname{distance}(x,c)=|x-c|`],
        practices: [practices.connect, practices.communicate], representations: ['analytical', 'verbal']
      },
      {
        id: 'line-below-lab', title: 'A horizontal axis below the region', phase: 'Explore', kind: 'lab',
        scenario: 'shifted-washer-x', axisOffset: -1,
        body: [
          'Rotate x² ≤ y ≤ x, 0 ≤ x ≤ 1, about y = −1. Keep the representative segment vertical.',
          'The upper boundary y = x is farther from the axis, giving R = x + 1. The lower boundary gives r = x² + 1.',
          'The gap between the two radii still equals x − x², but each circular face occupies a different position and has a different area.'
        ],
        formulas: [tex`R=x-(-1)=x+1,\qquad r=x^2-(-1)=x^2+1`],
        prompt: 'At x = 0.5, identify the distances 1.5 and 1.25 in the model. Which boundary determines the outer radius?',
        practices: [practices.connect, practices.communicate], representations: ['graphical', 'analytical', 'verbal']
      },
      {
        id: 'line-radius-notes', title: 'Farthest and nearest—not always top and bottom', phase: 'Clarify', kind: 'notes',
        body: [
          'For a horizontal rotation line, use vertical segments and dx. For a vertical rotation line, use horizontal segments and dy.',
          'Label the endpoint farther from the line as R and the nearer endpoint as r. When the line moves from below the region to above it, the boundary roles reverse.',
          'The outside-axis models here do not cross the region. If an axis passes through a region, analyze each slice again: the face may be a disk, and the formula or bounds may need to be split.'
        ],
        formulas: [tex`A=\pi(R^2-r^2),\qquad R\ge r\ge0`, tex`\text{horizontal axis}\Rightarrow dx,\qquad \text{vertical axis}\Rightarrow dy\quad\text{(disk/washer slices)}`],
        practices: [practices.justify, practices.communicate], representations: ['analytical', 'verbal']
      },
      {
        id: 'line-below-example', title: 'Keep the shift inside each radius', phase: 'Model', kind: 'example',
        body: [
          'For rotation about y = −1, square each complete distance, including the +1 shift.',
          'The constant squares cancel after subtraction, but the cross terms do not. Moving an axis away changes the volume.',
          'The new volume is 7π/15 cubic unit, compared with 2π/15 about the x-axis.'
        ],
        formulas: [tex`V=\pi\int_0^1\left[(x+1)^2-(x^2+1)^2\right]dx`, tex`=\pi\int_0^1(2x-x^2-x^4)\,dx=\frac{7\pi}{15}`],
        practices: [practices.process, practices.connect], representations: ['analytical', 'verbal'], calculatorPolicy: 'Not required'
      },
      {
        id: 'line-above-lab', title: 'Move the axis above: which radius is outer?', phase: 'Compare', kind: 'lab',
        scenario: 'shifted-washer-x', axisOffset: 2,
        body: [
          'The rotation line is now y = 2, above the same region. The lower curve y = x² is farther from that axis.',
          'The outer radius is therefore 2 − x² and the inner radius is 2 − x. “Upper minus lower” alone cannot tell you which radius is outer.',
          'The resulting volume is 8π/15. Compare both the radii and the resulting solid with rotation about y = −1.'
        ],
        formulas: [tex`R=2-x^2,\qquad r=2-x`, tex`V=\pi\int_0^1\left[(2-x^2)^2-(2-x)^2\right]dx=\frac{8\pi}{15}`],
        prompt: 'At x = 0.5, explain why the distances are 1.75 and 1.5, and why the outer radius comes from the lower curve.',
        practices: [practices.connect, practices.justify], representations: ['graphical', 'analytical', 'verbal']
      },
      {
        id: 'line-vertical-lab', title: 'A vertical line changes the representation', phase: 'Explore', kind: 'lab',
        scenario: 'shifted-washer-y', axisOffset: -1,
        body: [
          'Rotate about x = −1. Rewrite the shared base with horizontal bounds: y ≤ x ≤ √y, for 0 ≤ y ≤ 1.',
          'The outer radius is √y + 1 and the inner radius is y + 1. Horizontal segments give thickness dy.',
          'If the line is instead x = 2, the farther boundary is the left boundary, so R = 2 − y and r = 2 − √y. Both rotations happen to have volume π/2; equality must be justified, not assumed.'
        ],
        formulas: [tex`V_{x=-1}=\pi\int_0^1\left[(\sqrt y+1)^2-(y+1)^2\right]dy=\frac\pi2`, tex`V_{x=2}=\pi\int_0^1\left[(2-y)^2-(2-\sqrt y)^2\right]dy=\frac\pi2`],
        prompt: 'Identify which horizontal endpoint is farthest from x = −1. Then predict which endpoint is farthest from x = 2.',
        practices: [practices.connect, practices.process], representations: ['graphical', 'analytical', 'verbal']
      },
      {
        id: 'line-shifted-disk', title: 'A translated disk still has no hole', phase: 'Connect', kind: 'lab',
        scenario: 'shifted-disk-x', axisOffset: -1,
        body: [
          'This is a different region: −1 ≤ y ≤ −1 + √x for 0 ≤ x ≤ 4, rotated about y = −1.',
          'Every vertical segment reaches the rotation line. Its radius is (−1 + √x) − (−1) = √x, so the faces are disks.',
          'Translating both the region and its axis together preserves their relative distances and preserves volume. Moving only the axis while holding a region fixed generally does not.',
          'For the vertical-line version, rotate −1 ≤ x ≤ −1 + √y, 0 ≤ y ≤ 4, about x = −1. Horizontal segments give radius √y, thickness dy, and the same volume 8π.'
        ],
        formulas: [tex`R(x)=(-1+\sqrt x)-(-1)=\sqrt x,\qquad r(x)=0`, tex`V_{y=-1}=\pi\int_0^4x\,dx=8\pi,\qquad V_{x=-1}=\pi\int_0^4y\,dy=8\pi`],
        prompt: 'Explain why a rotation line away from the coordinate axes can still produce disks rather than washers.',
        practices: [practices.connect, practices.justify], representations: ['graphical', 'analytical', 'verbal']
      },
      {
        id: 'line-gap-misconception', title: '“The radial width stayed the same.”', phase: 'Diagnose', kind: 'reflection',
        prompt: 'The shared region has the same radial width x − x² when rotated about y = 0 or y = −1. A student concludes that the volumes must agree. Explain why this does not follow.',
        hints: ['Factor R² − r².', 'Which factor stays the same, and which factor changes when the axis moves?'],
        solution: ['The washer area is π(R − r)(R + r). Although R − r is unchanged, R + r increases by 2 when the axis moves from y = 0 to y = −1. The added area at each x is 2π(x − x²), so the volume increases by π/3.'],
        solutionFormulas: [tex`V_{y=-1}-V_{y=0}=2\pi\int_0^1(x-x^2)\,dx=\frac\pi3`],
        practices: [practices.justify, practices.connect], representations: ['analytical', 'verbal']
      },
      {
        id: 'line-mcq-above', title: 'Check 1 · The axis is above', phase: 'Practice', kind: 'question',
        prompt: 'The region x² ≤ y ≤ x, 0 ≤ x ≤ 1, is revolved about y = 2. Which pair correctly identifies the outer and inner radii?',
        choices: ['R = 2 − x; r = 2 − x²', 'R = x; r = x²', 'R = x − x²; r = 0', 'R = 2 − x²; r = 2 − x'],
        correct: 3,
        hints: ['Choose a point such as x = 0.5.', 'The lower boundary is farther from an axis above the region.'],
        solution: ['The axis is above both curves. At each x, the distance to the lower curve is 2 − x² and the distance to the upper curve is 2 − x. Because x² ≤ x, the first distance is larger.'],
        solutionFormulas: [tex`2-x^2\ge2-x\ge0\quad(0\le x\le1)`],
        practices: [practices.connect, practices.justify], representations: ['analytical', 'verbal'], calculatorPolicy: 'Not required', original: true
      },
      {
        id: 'line-mcq-vertical', title: 'Check 2 · The axis is to the right', phase: 'Practice', kind: 'question',
        prompt: 'The same region is revolved about x = 2. Which washer integral gives its volume?',
        choices: ['π ∫₀¹ [(2 − √y)² − (2 − y)²] dy', 'π ∫₀¹ [(2 − y)² − (2 − √y)²] dy', 'π ∫₀¹ [(2 − x²)² − (2 − x)²] dx', 'π ∫₀¹ (√y − y)² dy'],
        correct: 1,
        hints: ['A vertical rotation line requires horizontal washer slices.', 'The horizontal segment runs from x = y to x = √y.'],
        solution: ['The farther boundary from x = 2 is x = y, so R = 2 − y. The nearer boundary is x = √y, so r = 2 − √y. The bounds are y = 0 and y = 1. The dx choice instead describes rotation about a horizontal line.'],
        solutionFormulas: [tex`V=\pi\int_0^1\left[(2-y)^2-(2-\sqrt y)^2\right]dy`],
        practices: [practices.process, practices.connect], representations: ['analytical', 'verbal'], calculatorPolicy: 'Not required', original: true
      },
      {
        id: 'line-frq-parameter', title: 'A moving axis: explain the whole family', phase: 'Apply', kind: 'reflection',
        prompt: 'Original AP-style practice · Let a > 0. Rotate the region x² ≤ y ≤ x, 0 ≤ x ≤ 1, about the line y = −a.',
        parts: ['Express R and r in terms of x and a, and write an integral for V(a).', 'Evaluate the integral to express V(a) in terms of a.', 'Determine the change in volume when the axis moves one unit farther downward. Explain why the change is independent of a.'],
        hints: ['The distances are x + a and x² + a.', 'Expand the difference of squares; the a² terms cancel.', 'Compare V(a + 1) with V(a).'],
        solution: ['The radii are R = x + a and r = x² + a. Expanding and integrating gives V(a) = π(2/15 + a/3). Moving the axis one unit farther downward adds π/3 cubic unit. The volume depends linearly on a; the difference of squared radii contains a only in the term 2a(x − x²).'],
        solutionFormulas: [tex`V(a)=\pi\int_0^1\left[(x+a)^2-(x^2+a)^2\right]dx=\pi\left(\frac2{15}+\frac a3\right)`, tex`V(a+1)-V(a)=\frac\pi3`],
        practices: [practices.process, practices.justify, practices.communicate], representations: ['analytical', 'verbal'], calculatorPolicy: 'Not required', original: true
      },
      {
        id: 'line-shell-extension', title: 'Optional extension · The shell view', phase: 'Extend', kind: 'lab',
        scenario: 'shell-y',
        body: [
          'Enrichment: cylindrical shells offer another way to construct the same volume. This extension is separate from the disk/washer methods mapped to CED Topics 8.9–8.12.',
          'For the shared base rotated about the y-axis, a vertical strip is parallel to the axis. It sweeps out a thin shell of radius x, height x − x², and thickness dx.',
          'Compare this construction with the horizontal washers. The slices differ, but the completed solid and exact volume agree. For rotation about the x-axis, horizontal strips give shells instead.'
        ],
        formulas: [tex`\Delta V\approx2\pi(\text{radius})(\text{height})(\text{thickness})`, tex`V_{y\text{-axis}}=2\pi\int_0^1x(x-x^2)\,dx=\frac\pi6`, tex`V_{x\text{-axis}}=2\pi\int_0^1y(\sqrt y-y)\,dy=\frac{2\pi}{15}`],
        prompt: 'Explain the contrast: disk/washer segments are perpendicular to the axis; shell strips are parallel. Which measurements play different roles?',
        practices: [practices.connect, practices.justify], representations: ['graphical', 'analytical', 'verbal'], enrichment: true
      },
      {
        id: 'line-exit', title: 'Exit evidence · Read the axis first', phase: 'Reflect', kind: 'reflection',
        prompt: 'For rotation of the shared base about y = 2, state the slice direction, R, r, bounds, and volume integral. Then explain why translating a region together with its axis preserves volume, while moving only its axis need not.',
        hints: ['Radii measure relative distances, not absolute coordinates.'],
        solution: ['Use vertical segments and dx on [0, 1], with R = 2 − x² and r = 2 − x. Integrate π[(2 − x²)² − (2 − x)²] to obtain 8π/15 cubic unit. A shared translation preserves every radius and slice thickness. Moving only the axis changes the distances and generally changes face areas.'],
        solutionFormulas: [tex`V=\pi\int_0^1\left[(2-x^2)^2-(2-x)^2\right]dx=\frac{8\pi}{15}`],
        practices: [practices.communicate, practices.justify], representations: ['analytical', 'verbal'], calculatorPolicy: 'Not required', original: true
      },
      {
        id: 'line-summary', title: 'Distance, orientation, and accumulated area', phase: 'Consolidate', kind: 'summary',
        body: [
          'Draw the rotation line first. Measure radii from that line, using distances that remain nonnegative.',
          'For disks and washers, choose a perpendicular segment and identify the farthest and nearest endpoints. Use dx for horizontal rotation lines and dy for vertical rotation lines.',
          'Check whether the segment reaches or crosses the axis. The outside-axis formulas from these examples cannot be transferred blindly to an axis through the region.',
          'Use the 3D model to verify your construction, then communicate the integral, reasoning, and cubic units. Shells are an optional parallel-slice extension; the core method remains accumulated cross-sectional area.'
        ],
        formulas: [tex`\boxed{\text{axis}\ \longrightarrow\ \text{distances}\ \longrightarrow\ \pi(R^2-r^2)\ \longrightarrow\ V}`]
      }
    ]
  }
};

export default LESSONS;
