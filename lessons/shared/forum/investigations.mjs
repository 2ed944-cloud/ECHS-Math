/* Original classroom prompts. Pure data; no student evidence or account data.
 * Platform lesson numbers are retained separately from official CED topics.
 */
const precalc = 'lessons/ap-precalculus/unit-1/AP_Precalculus_1.1_Change_in_Tandem_ECHS_Refined.html';
const cross = 'lessons/ap-calculus/unit-8/8-5-volumes-cross-sections.html';
const disks = 'lessons/ap-calculus/unit-8/8-6-disks-and-washers.html';
const shifted = 'lessons/ap-calculus/unit-8/8-7-volume-about-a-line.html';
export const WORKSHOP = Object.freeze({
  schemaVersion: 'echs.guided-investigation.v1',
  title: 'Mathematics made visible: complete teacher-led learning',
  date: '6 October 2026',
  evidencePolicy: 'Ungraded classroom reflection. An explanation and an independent task inform the teacher’s next decision; these responses do not award mastery.',
  sources: [
    'https://apcentral.collegeboard.org/media/pdf/ap-precalculus-course-and-exam-description.pdf',
    'https://apcentral.collegeboard.org/media/pdf/ap-calculus-ab-and-bc-course-and-exam-description.pdf'
  ],
  outcomes: [
    'Analyze rigorous interactive lesson design.',
    'Evaluate evidence of understanding and guided AI.',
    'Redesign part of one lesson with meaningful local context.'
  ]
});
export const INVESTIGATIONS = Object.freeze([
  {
    id: 'car', path: precalc, anchor: 'toy-car-lab', label: 'Toy car · motion and graph', minutes: 6, cedTopics: ['1.1'],
    predict: 'A car starts nearest a tangent wall and travels at constant speed around a circular track. Sketch wall distance against time for one lap. Where is the distance greatest? Where does the distance change fastest?',
    explore: ['Start with radius 3 m, lap time 10 s, nearest distance 0 m, and the nearest starting point. Advance one quarter lap at a time.', 'Change only the lap time to 20 s. Predict the effect on the range and steepness before showing the full graph.', 'Return to 10 s, then change only the radius to 6 m. Compare distance at the same fraction of a lap. Finally, test the farthest starting point.'],
    explain: ['Distinguish the car’s constant speed along the track from its changing wall-distance rate.', 'Explain why the graph is horizontal at the nearest and farthest points while the car keeps moving.', 'Use a point, the track geometry, and the graph to explain the same distance.'],
    transfer: 'Close the model. A new track has radius 4 m, its nearest point is 1 m from the wall, and one lap takes 12 s. The car starts farthest from the wall. Give its distances at 0, 3, 6, 9, and 12 seconds; state the range and period. Explain why maximum distance does not mean maximum rate.',
    comparison: ['The distances are 9, 5, 1, 5, and 9 m. The range is [1, 9] m and the period is 12 s.', 'At either distance extreme the wall-distance rate is zero. Its greatest positive rate occurs a quarter lap after the nearest point, rather than at maximum distance. Doubling the lap time halves each corresponding wall-distance rate while leaving the range unchanged.'],
    misconception: 'Constant speed around the track implies a constant rate of change of wall distance.',
    support: 'Draw the shortest segment from the car to the wall at five quarter-lap checkpoints.',
    challenge: 'Explain both parameter changes using d(t) = g + r[1 − cos(2πt/T + φ)]. The formula is optional extension after the qualitative graph.',
    original: true, calculatorPolicy: 'Not required', modelCheck: {radius: 4, period: 12, gap: 1, start: 'far', distances: [9,5,1,5,9]}
  },
  {
    id: 'vase', path: precalc, anchor: 'filling-vessels-lab', label: 'Vase · equal volumes, changing height', minutes: 5, cedTopics: ['1.1'],
    predict: 'A steady tap fills a vessel that narrows upward and then has a straight narrow neck. Sketch water height against time. Compare the height gained during equal time intervals in a wide section and a narrow section.',
    explore: ['Choose Vessel B with constant inflow 6 cm³/s. Scrub through equal increments of elapsed time.', 'Compare the wide body with the straight narrow neck. Then select C or D and notice the initially widening body.', 'Change the inflow while keeping the vessel shape fixed; the model restarts empty for a new constant-inflow run. Compare filling time and the sequence of bends.'],
    explain: ['Equal elapsed times add equal volumes when the inflow is constant.', 'A narrower horizontal cross section needs a larger height gain for the same volume.', 'A straight graph segment corresponds to a constant cross-sectional area under this constant-inflow model.'],
    transfer: 'Close the model. Two straight-sided sections have horizontal areas 40 cm² and 20 cm². Each receives water at 60 cm³/s. Find the height increase in each section during 2 seconds and compare their rates. State the assumptions needed.',
    comparison: ['Each receives 120 cm³. The 40 cm² section rises 3 cm, at 1.5 cm/s; the 20 cm² section rises 6 cm, at 3 cm/s.', 'Use volume = area × height for a constant-area section. Assume constant inflow, no leakage, and that the water remains within each stated section. A steady inflow alone does not imply a straight height graph.'],
    misconception: 'A steady tap makes the water height rise at a constant rate in every vessel.',
    support: 'Sketch two equal-volume slabs and label their different horizontal areas.',
    challenge: 'Explain why the height graph alone cannot determine vessel shape unless the inflow behavior is known.',
    original: true, calculatorPolicy: 'Not required', modelCheck: {areas:[40,20],flow:60,time:2,heights:[3,6]}
  },
  {
    id: 'cross', path: cross, anchor: 'cs-explore-square', label: 'Cross sections · build the area', minutes: 5, cedTopics: ['8.7','8.8'],
    predict: 'The base is between y = x² and y = x on [0, 1]. Compare solids built with square cross sections and semicircles whose diameters are the same base segments. Which solid has the greater volume? Explain before calculating.',
    explore: ['Move the selected slice to x = 0.5. Identify the base width, the face area, and the direction of thickness.', 'Compare Square with Semicircle (diameter). Keep the slice in the same position.', 'Use Flat region, Build solid, and Isolate slice. Switch to Midpoint stack and increase the number of slices.'],
    explain: ['Use upper − lower for the base width, then use the stated shape for the face area.', 'Explain why a semicircle uses half the base width as its radius.', 'Distinguish a finite midpoint approximation from the complete solid’s exact integral.'],
    transfer: 'Close the model. A new base is bounded by y = 2x and y = x². Semicircular cross sections perpendicular to the x-axis have their diameters in the base. Find the bounds, write the volume integral, and calculate the exact volume. At x = 1, identify the diameter and radius.',
    comparison: ['The intersections are x = 0 and x = 2. The diameter is 2x − x², so V = (π/8)∫₀²(2x − x²)² dx = 2π/15 cubic units.', 'At x = 1, the diameter is 1 and the radius is 1/2. The corresponding square-slice volume is 16/15; each semicircular face has π/8 of the square’s area, so its volume has the same ratio.'],
    misconception: 'The integral of the base width gives the volume, or a semicircle’s diameter is its radius.',
    support: 'Write width → radius or side → face area → area × thickness before the integral.',
    challenge: 'Justify the constant volume ratio without evaluating either integral.',
    original: true, calculatorPolicy: 'Not required', modelCheck: {volume:2*Math.PI/15}
  },
  {
    id: 'disk', path: disks, anchor: 'dw-disk-lab', label: 'Disk · rotate a filled region', minutes: 4, cedTopics: ['8.9'],
    predict: 'Rotate the filled region below y = √x on 0 ≤ x ≤ 4 about the x-axis. Does a vertical segment produce a filled disk or a ring? What happens to face area when the radius doubles?',
    explore: ['Choose Flat region, then Build solid. Inspect a partial turn with the Revolution angle slider.', 'Choose Isolate slice and compare the region, spatial slice, and face-on view at x = 1 and x = 4.', 'Reveal the mathematics after identifying the radius and dx. Explain the meaning of each factor.'],
    explain: ['A segment touching the axis sweeps a filled disk with zero inner radius.', 'The area is π times radius squared. A diameter and a radius are different distances.', 'The shown slice has area; multiplying by a small thickness gives an approximate small volume.'],
    transfer: 'Close the model. Rotate 0 ≤ y ≤ √(2x), 0 ≤ x ≤ 3 about the x-axis. State the radius, slice area, thickness, and exact volume. What is the area of the face at x = 2?',
    comparison: ['R(x) = √(2x), A(x) = 2πx, and thickness is dx. V = ∫₀³2πx dx = 9π cubic units.', 'At x = 2, R = 2 and A = 4π square units. Integrating the radius rather than its squared circular area would give the wrong geometric quantity.'],
    misconception: 'Rotating a boundary curve and rotating its filled region produce the same description of the solid.',
    support: 'Trace the segment from the axis to the boundary, then describe every point swept by it.',
    challenge: 'Explain why a 180° construction view does not change the full solid’s displayed integral.',
    original: true, calculatorPolicy: 'Not required', modelCheck: {volume:9*Math.PI,faceArea:4*Math.PI}
  },
  {
    id: 'washer', path: disks, anchor: 'dw-washer-y-lab', label: 'Washer · change the slice direction', minutes: 4, cedTopics: ['8.11'],
    predict: 'Rotate the region between y = x² and y = x, 0 ≤ x ≤ 1, about the y-axis. Which slices are perpendicular to the axis? Identify the farther and nearer boundaries before writing a formula.',
    explore: ['Choose Isolate slice. Move the horizontal slice from y = 0 to y = 1.', 'Use Cutaway to inspect the inner boundary; compare the face-on hole with the 2D region.', 'Identify x = √y and x = y, then reveal the integral and check that the thickness is dy.'],
    explain: ['About the y-axis, perpendicular slices are horizontal and are described in terms of y.', 'The outer radius is √y and the inner radius is y on [0, 1].', 'Subtract the two disk areas: π(R² − r²), rather than squaring R − r.'],
    transfer: 'Close the model. The new base lies between y = x³ and y = x on [0, 1] and rotates about the y-axis. Write the outer and inner radii as functions of y. Set up and evaluate a washer integral.',
    comparison: ['For 0 ≤ y ≤ 1, R(y) = ∛y and r(y) = y. Thus V = π∫₀¹(y^(2/3) − y²) dy = 4π/15 cubic units.', 'Both radii are distances from the y-axis. The horizontal face is perpendicular to that axis, so the differential is dy.'],
    misconception: 'The original formulas can be copied into a y-axis washer integral without changing variables.',
    support: 'Draw one horizontal segment and mark both endpoints as x-values.',
    challenge: 'Compare this new solid with the original: justify the ordering of volumes from corresponding areas.',
    original: true, calculatorPolicy: 'Not required', modelCheck: {volume:4*Math.PI/15}
  },
  {
    id: 'shifted', path: shifted, anchor: 'line-below-lab', label: 'Moved axis · radii are distances', minutes: 5, cedTopics: ['8.10','8.12'],
    predict: 'The base lies between y = x² and y = x on [0, 1]. Rotate it about y = −1. Which curve is farther from the axis? Predict the radii before opening the model. What changes when the axis moves to y = −2?',
    explore: ['Inspect one slice with rotation axis y = −1. Identify the two geometric distances.', 'Change the axis to y = −2 while keeping the base fixed. Compare the radii and the hole.', 'Move the axis above the region to y = 2. Predict which curve now gives the outer radius before inspecting the cutaway.'],
    explain: ['A radius measures distance from the chosen axis; it is not automatically a function value.', 'Below the region, the upper boundary is farther away. Above the region, the lower boundary is farther away.', 'Moving the axis farther away changes both radii. Their difference can stay fixed while their squared-area difference changes.'],
    transfer: 'Close the model. Rotate the same base about y = 2. Give R(x), r(x), and a correctly bounded washer integral; then calculate the exact volume. Explain why x + 2 is not a radius for this axis.',
    comparison: ['R(x) = 2 − x² and r(x) = 2 − x. V = π∫₀¹[(2 − x²)² − (2 − x)²] dx = 8π/15 cubic units.', 'Both distances are measured downward from y = 2. Adding 2 would measure distance to y = −2 instead. The lower curve supplies the larger distance for the axis above the region.'],
    misconception: 'The upper curve always supplies the outer radius.',
    support: 'Write axis height − boundary height for each distance when the axis is above the region.',
    challenge: 'Show why the volume about y = −2 is 4π/5 and compare it with the volume about y = 2.',
    original: true, calculatorPolicy: 'Not required', modelCheck: {axisOffset:2,volume:8*Math.PI/15,belowVolume:4*Math.PI/5}
  },
  {
    id: 'pearl', path: disks, anchor: 'dw-pearl', label: 'Pearling heritage · scale and volume', minutes: 4, cedTopics: ['8.9'],
    predict: 'Model a pearl as a perfect sphere. If its diameter increases by 10%, does its volume increase by 10%? State a prediction and identify the geometric assumption.',
    explore: ['Rotate the right semicircular region about the y-axis. Isolate horizontal disks near a pole and at the equator.', 'Use the full solid and the face-on slice to connect the sphere’s shape with π(1 − y²).', 'Compare the radius, the disk area, and the cubic units in the complete integral.'],
    explain: ['Scaling all lengths changes area by the square of the scale factor and volume by its cube.', 'A diameter increase of 10% means the radius also scales by 1.1.', 'A sphere is an idealized model: real pearls need not be perfectly spherical.'],
    transfer: 'Close the model. A second idealized pearl has radius 20% larger than the first. Find the volume ratio and percentage increase without calculating the two individual volumes. State one limitation of the model.',
    comparison: ['The volume ratio is 1.2³ = 1.728, an increase of 72.8%. For the original 10% diameter question, the ratio is 1.1³ = 1.331, an increase of 33.1%.', 'This compares idealized spherical volumes. It does not model pearl value or assert measured dimensions of real pearls.'],
    misconception: 'A percentage change in length gives the same percentage change in volume.',
    support: 'Write the scale factor once for each of the three length dimensions.',
    challenge: 'Explain why V = π∫₋ᵣʳ(r² − y²) dy = 4πr³/3 also gives the cubic scaling law.',
    original: true, calculatorPolicy: 'Optional for decimal arithmetic', modelCheck: {scale:1.2,ratio:1.728,increase:72.8}, context: 'Qatar heritage; idealized model, illustrative dimensions'
  },
  {
    id: 'water', path: cross, anchor: 'cs-qatar-design', label: 'Water stewardship · design extension', minutes: 4, cedTopics: ['8.7'],
    predict: 'A hypothetical school garden in Doha needs a water-storage module. If every length of a proposed module is multiplied by 3, how does its capacity change? Explain your prediction before inspecting the geometry.',
    explore: ['The base is x² ≤ y ≤ x for 0 ≤ x ≤ 1, with coordinates in meters. Compare rectangular slices of width w and height 2w.', 'Identify area and thickness in the model. Use the integral to find the smaller module’s ideal capacity.', 'Explain the assumptions: ignore wall thickness; this is a hypothetical design rather than measured water-use data.'],
    explain: ['Every length scales by 3, so each slice area scales by 9 and thickness by 3.', 'Capacity has cubic units, and 1 m³ = 1,000 L.', 'A design recommendation needs usable capacity and modeling assumptions, not only a computed integral.'],
    transfer: 'Close the model. A similar module scales every length of the smaller design by 2. The smaller module holds 1/15 m³. Find the new capacity in cubic meters and liters; explain the scale factor.',
    comparison: ['The new capacity is 2³/15 = 8/15 m³, approximately 533.3 L.', 'The volume scales by 8 because both face dimensions and the slice thickness double. These are ideal geometric capacities.'],
    misconception: 'Tripling every dimension triples capacity.',
    support: 'Label three independent length dimensions before forming the scale factor.',
    challenge: 'Explain which extra information is required to recommend a real storage design.',
    original: true, calculatorPolicy: 'Optional', modelCheck: {volume:8/15,liters:8000/15}, context: 'Hypothetical Doha school garden; no empirical statistics'
  },
  {
    id: 'ball', path: precalc, anchor: 'projectile-height-lab', label: 'Optional · height versus rate', minutes: 3, cedTopics: ['1.1'],
    predict: 'A ball rises, reaches a maximum height, and falls. At its greatest height, is its vertical height changing fastest? Sketch height against time and distinguish the height from the graph’s slope.',
    explore: ['Trace the ball’s height graph from release to first ground contact.', 'Compare the maximum height with steeper points on either side. Keep the physical domain in view.', 'Change the model and distinguish time after release from time since the peak.'],
    explain: ['At a smooth maximum, the height graph is horizontal: the vertical rate is zero.', 'The sign of the slope describes rising or falling; its magnitude describes how fast height changes.', 'Times outside the release-to-ground interval are outside the physical model.'],
    transfer: 'Close the model. A ball has height h(t) = 20 + 8t − 4t², in meters, from release until first ground contact. Find the time and height of the peak by completing the square. Explain the vertical rate at the peak without using derivatives.',
    comparison: ['h(t) = 24 − 4(t − 1)². The peak is 24 m at t = 1 s. The horizontal tangent there gives zero vertical rate; equal offsets on either side have equal heights.', 'The model ends at first ground contact, t = 1 + √6 s. A large height is a function value, rather than a large rate.'],
    misconception: 'Maximum height means maximum rate of increase.',
    support: 'Mark height and slope as two separate features on the same sketch.',
    challenge: 'Find the physical domain and compare average rates over [0, 1] and [1, 2].',
    original: true, calculatorPolicy: 'Not required', modelCheck: {peakTime:1,peakHeight:24}
  }
]);

export function lessonURL(entry, root, forum = true) {
  const url = new URL(entry.path, root);
  if (forum) url.searchParams.set('forum', '1');
  url.hash = entry.anchor;
  return url;
}
