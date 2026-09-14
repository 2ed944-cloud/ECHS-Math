/** Original public teaching material. No AP Classroom item, image or scoring key. */
const deepFreeze = value => {
  if (value && typeof value === 'object') { Object.values(value).forEach(deepFreeze); Object.freeze(value); }
  return value;
};
export const AP_RATES_CONTENT = deepFreeze({
  version: 'echs.lesson-investigation.v1', id: 'ap-precalculus-1.3-rates',
  title: 'A moving car and its changing rates', course: 'AP Precalculus', topic: '1.3',
  curriculum: { version: 'ap-precalculus-2026-27', assessedOnExam: true,
    learningObjectives: ['1.3.A', '1.3.B'], essentialKnowledge: ['1.3.A.1', '1.3.A.2', '1.3.A.3', '1.3.B.1', '1.3.B.2', '1.3.B.3'], practices: ['2.A', '2.B', '3.B', '3.C'] },
  pin: { kind: 'reviewed-existing-lesson-before-addition', path: 'lessons/ap-precalculus/unit-1/AP_Precalculus_1.3_Rates_of_Change_in_Linear_and_Quadratic_Functions_ECHS_Refined.html', sha256: 'cb5cf641ed313e811fbdd36433ffe9c33de5cf747c14cf9bb324ace7d4760406' },
  sourceRefs: [
    { title: 'AP Precalculus CED, effective Fall 2026, Topic 1.3', url: 'https://apcentral.collegeboard.org/media/pdf/ap-precalculus-course-and-exam-description.pdf', checked: '2026-09-14' },
    { title: 'Fall 2026 clarifications, EK 1.3.A.3', url: 'https://apcentral.collegeboard.org/media/pdf/ap-precalculus-ced-clarification-and-guidance.pdf', checked: '2026-09-14' }
  ],
  provenance: { type: 'original-teaching-examples', restrictedMaterialCopied: false, awardsMastery: false, calculatorPolicy: 'calculator_optional' },
  scenes: [
    { id: 'interval-recall', title: 'Two endpoints describe a net change', kind: 'warmup', model: 'sampleRates',
      text: [
        'A toy car moves along a straight marked track. Its position p is measured in metres from a fixed origin; t is elapsed time in seconds. Position can decrease or be negative. It is not the total distance travelled.',
        'For this first run, p(t)=3t+2 on 0≤t≤4. Compare position change with position change per second. The average rate is the slope of the secant through the two endpoint graph points.'
      ],
      prompts: ['Predict the position change on [0,2] and [2,4].', 'Would the average rate change if you used [1,4]? Explain why the denominator matters.'],
      worked: ['The position changes by 6 m on each two-second interval, giving 3 m/s. On [1,4] it changes by 9 m in 3 s, again 3 m/s.'],
      initial: { a: 0, b: 3, c: 2, start: 0, step: 1, count: 4 }, controls: [] },
    { id: 'car-motion', title: 'Watch equal time intervals on the track', kind: 'motion', model: 'sampleRates', motionModel: 'motionAt',
      text: [
        'This is a declared synthetic model: p(t)=at²+bt+c. Begin with a=0 to compare equal-time positions under constant motion. Then change a while keeping the time intervals equal.',
        'With a negative a and a positive b, the car can move forward, stop and reverse. A negative interval rate means a net position change toward smaller coordinates. An interval crossing the turn can have zero average even though the car moves.'
      ],
      prompts: ['Before playing, predict whether equal-time position gaps will stay equal, grow or shrink.', 'Set a=−0.5, b=4 and c=0. Compare [0,2], [2,4], [4,6] and [6,8]. Describe direction separately from the trend in rates.', 'Compare the positions at t=2 and t=6. Why does their zero interval average not mean the car remained still?'],
      worked: ['For p(t)=−0.5t²+4t, the four two-second rates are 3, 1, −1 and −3 m/s. Rates decrease throughout; position increases until t=4 and decreases afterward. The car is at 6 m at both t=2 and t=6, but reaches 8 m between them.'],
      initial: { a: 0, b: 2, c: 0, start: 0, step: 1, count: 8 },
      controls: [
        { key: 'a', label: 'Quadratic coefficient a (m/s²)', min: -1, max: 1, step: 0.25 },
        { key: 'b', label: 'Linear coefficient b (m/s)', min: -4, max: 4, step: 0.5 },
        { key: 'c', label: 'Starting position c (m)', min: -4, max: 4, step: 1 }
      ] },
    { id: 'difference-table', title: 'One table, four different calculations', kind: 'differences', model: 'sampleRates',
      text: [
        'Keep the input step h the same across each table. Read the outputs first; then compare raw output changes with average rates. Raw changes have output units, while rates have output units per input unit.',
        'For q(x)=ax²+bx+c, the rate on [x,x+h] is 2ax+ah+b. Raw second differences equal 2ah²; changes between consecutive interval rates equal 2ah. Dividing that rate change by h gives 2a. These quantities must not be given the same label.',
        'Change the starting input to examine decreasing outputs with increasing rates, or increasing outputs with decreasing rates. For example, rates −7, −5, −3 are increasing: they become less negative even though their magnitudes decrease. The sign of an average and the trend in averages answer different questions.'
      ],
      prompts: ['For q(x)=x²−4x+1, predict the rate pattern before revealing the table.', 'Change h from 1 to 2. Which difference quantity doubles, which quadruples, and which stays unchanged?', 'Move the starting input to −2 with h=0.5. How can outputs decrease while the rates increase?'],
      worked: ['At x=0,2,4,6,8, the outputs are 1,−3,1,13,33. Raw changes are −4,4,12,20; rates are −2,2,6,10; raw second differences are 8; rate changes are 4; rate change per input unit is 2. This conclusion uses the stated quadratic rule.'],
      initial: { a: 1, b: -4, c: 1, start: 0, step: 1, count: 4 },
      controls: [
        { key: 'a', label: 'Quadratic coefficient a', min: -2, max: 2, step: 0.5 },
        { key: 'b', label: 'Linear coefficient b', min: -6, max: 6, step: 1 },
        { key: 'start', label: 'First input', min: -3, max: 3, step: 0.5 },
        { key: 'step', label: 'Equal input step h', min: 0.25, max: 2, step: 0.25 }
      ] },
    { id: 'transfer', title: 'State what the evidence supports', kind: 'transfer', model: 'sampleRates',
      text: [
        'The simulations use a stated linear or quadratic rule, so its behavior between samples is known. A table on its own has less information: many different functions can pass through the same finitely many points.',
        'For a quadratic, increasing interval rates indicate concave-up behavior and decreasing interval rates indicate concave-down behavior. Positive versus negative rates describe a separate issue. For an unspecified function, sampled rates alone do not prove the shape between every pair of sampled points.',
        'Write a claim, show the relevant numerical evidence and interpret the units. These original transfer prompts are teaching practice, not a scored mastery assessment.'
      ],
      prompts: [
        'A sensor gives outputs 4,7,10,13 at inputs 0,2,4,6. Give the average rate on each interval. State both a plausible model and the limit of what these samples establish.',
        'For a stated quadratic sampled every 3 s, successive interval rates are 7,1,−5 m/s. Find the rate change per interval and per second. Describe concavity without saying the car moves in one direction throughout.',
        'Outputs 2,4,8,16,32 occur at equally spaced inputs. Do increasing rates alone justify a quadratic model? Explain using the next layer of differences.',
        'For f(x)=x², compare the quotient from left=1 to right=3 with the reversed endpoints. Which signs change and which value stays the same?'
      ],
      worked: [
        'The sensor’s sampled rates are 1.5 output units per input unit; a linear model fits those points, but the finite table does not uniquely determine the function elsewhere.',
        'The rates change by −6 m/s per interval, or −2 m/s² per input second. Under the stated quadratic model, the graph is concave down. The rates change sign, so a claim of one direction throughout would be wrong.',
        'The output changes are 2,4,8,16 and their changes are 2,4,8, which are not constant. These five samples do not fit a linear or quadratic rule exactly.',
        'Reversing both endpoint orders changes both numerator and denominator signs; both quotients are 4. Reversing only one subtraction would give the wrong sign.'
      ], initial: { a: 1, b: 0, c: 0, start: 0, step: 1, count: 4 }, controls: [] }
  ]
});
export default AP_RATES_CONTENT;
