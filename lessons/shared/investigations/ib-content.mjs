// Original public teaching activities, informed by the supplied sequence/finance
// decks' instructional structure. No imported exam items, markschemes or bank records.
const GUIDE = 'https://ibo.org/globalassets/new-structure/university-admission/pdfs/dp-mathematics-applications-and-interpretation-guide-en.pdf';
const CURRICULUM = 'ib-ai-sl-first-assessment-2021';
const source = section => [{title: 'IB Mathematics: applications and interpretation guide — first assessment 2021', url: GUIDE, section}];
const control = (key, label, min, max, step = 1) => ({key, label, min, max, step});
const sequenceControls = [control('first', 'First term', -20, 30), control('difference', 'Common difference', -8, 10), control('index', 'Term index n', 1, 20), control('count', 'Number of terms in the sum', 1, 20)];
const geometricControls = [control('first', 'First term', -12, 12), control('ratio', 'Common ratio', -2, 2, 0.25), control('index', 'Term index n', 1, 12), control('count', 'Number of terms in the sum', 1, 12)];
const financeControls = [control('principal', 'Initial amount (QAR)', 1000, 12000, 500), control('annualRatePercent', 'Nominal annual interest rate (%)', 0, 12, 0.5), control('compoundsPerYear', 'Compounding periods per year', 1, 12), control('years', 'Elapsed whole years', 0, 10)];
const scene = (id, title, kind, model, text, prompts, initial = {}, controls = []) => ({id, title, kind, model, text, prompts, initial, controls});
const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };

export const IB_CONTENT = freeze({
  arithmetic: {
    id: 'ib-arithmetic', title: 'Equal changes, different questions', course: 'IB Mathematics AI SL', topic: '1.2 · Arithmetic sequences and series', curriculum: CURRICULUM,
    sourceRefs: source('SL 1.2; printed page 27'),
    scenes: [
      scene('a-warmup', 'Notice the change', 'warmup', 'arithmetic',
        ['A school art display uses 12 tiles in row 1, 16 in row 2 and 20 in row 3. These are invented classroom data.', 'Predict before changing the controls. The row number begins at 1.'],
        ['What stays the same from one row to the next?', 'Write the next two row sizes. Does that tell you the total number of tiles?'],
        {first: 12, difference: 4, index: 3, count: 3}, sequenceControls),
      scene('a-discover', 'One row or the whole display?', 'discover', 'arithmetic',
        ['Keep the first term and common difference fixed. Change the term index and the number of terms independently.', 'The term column describes one row; the sum column accumulates all rows up to that point.'],
        ['Predict row 8 and the total for rows 1–8. Then check both against the table.', 'Which control changes the selected term? Which changes the selected total?'],
        {first: 12, difference: 4, index: 8, count: 8}, sequenceControls),
      scene('a-notes', 'Count the changes, then add the terms', 'notes', null,
        ['Use uₙ = u₁ + (n − 1)d. From term 1 to term n there are n − 1 equal changes.', 'For the first n terms, Sₙ = n(u₁ + uₙ)/2. Pair the first and last terms to see why their mean is useful.', 'Worked example: u₁ = 12 and d = 4 give u₈ = 12 + 7 × 4 = 40 tiles. S₈ = 8(12 + 40)/2 = 208 tiles. One row and the entire display have different units of interpretation.', 'On a GDC, enter the term rule and generate a table at integer indices. Write u₁, d, the substitution and the quantity you calculated in your response.'],
        ['How many changes connect term 4 to term 11?', 'In Σ from k = 3 to 8, how many terms are included?']),
      scene('a-explain', 'Repair a plausible mistake', 'explain', 'arithmetic',
        ['A learner writes u₈ = 12 + 8 × 4. Use the first row of the table to test the rule before correcting it.', 'Then try a decreasing sequence. Negative difference means equal decreases; it does not justify negative quantities in every context.'],
        ['Explain the off-by-one error without simply quoting a formula.', 'For a tank containing 30 L initially and losing 4 L each minute, why must the model stop before predicting a negative volume? The tank starts at time 0, unlike this term table.'],
        {first: 30, difference: -4, index: 6, count: 6}, sequenceControls),
      scene('a-apply', 'An imperfect pattern', 'apply', null,
        ['Invented weekly club collections are QAR 81, 90, 103 and 111. Their differences are not identical.', 'Use the mean change between the first and last observations to propose an approximate arithmetic model. Keep the observations separate from its predictions.'],
        ['Find an estimated common difference and predict week 7.', 'Compare the predictions at weeks 2 and 3 with the observations. What would make a longer-term prediction unreliable?', 'Sketch the observed discrete points and the model points. A trend is not evidence that every future week must follow the rule.']),
      scene('a-exit', 'Explain a term and a total', 'exit', 'arithmetic',
        ['A fictional reading challenge has 9 pages on day 1 and 3 more pages each day. Record your reasoning before using the model.'],
        ['Find the day-6 reading amount and the total through day 6.', 'Use a shifted sum or subtraction of cumulative sums to find the total for days 3–6.', 'State one assumption behind using this plan for every day.'],
        {first: 9, difference: 3, index: 6, count: 6}, sequenceControls)
    ]
  },
  geometric: {
    id: 'ib-geometric', title: 'Repeated factors and finite totals', course: 'IB Mathematics AI SL', topic: '1.3 · Geometric sequences and series', curriculum: CURRICULUM,
    sourceRefs: source('SL 1.3; printed pages 27–28'),
    scenes: [
      scene('g-warmup', 'Addition or multiplication?', 'warmup', 'geometric',
        ['Compare 5, 8, 11, 14 with 5, 10, 20, 40. A short list alone does not force a unique continuation; here we are testing arithmetic and geometric models.', 'For the geometric model, term 1 is the starting term.'],
        ['Calculate differences and ratios for each list.', 'Predict term 6 of the second model, then predict its first-six total. Why are these different?'],
        {first: 5, ratio: 2, index: 6, count: 6}, geometricControls),
      scene('g-discover', 'What do sign and size change?', 'discover', 'geometric',
        ['Try ratios 1.5, 0.5, −0.5, −1 and 0. Predict the sign pattern and size of the terms before each change.', 'A negative ratio alternates signs for a nonzero first term. It cannot represent a positive account balance or population in this simple model.'],
        ['Which ratios shrink magnitudes? Which reverse signs?', 'At r = 1, why is the finite sum n times the first term?', 'At r = 0, why does the recurrence still work although later quotient tests do not?'],
        {first: 8, ratio: 0.5, index: 6, count: 6}, geometricControls),
      scene('g-notes', 'Build the rule and the finite sum', 'notes', null,
        ['Use uₙ = u₁rⁿ⁻¹. The recurrence uₙ₊₁ = ruₙ also covers a zero ratio. A quotient uₙ₊₁/uₙ requires a nonzero denominator.', 'For r ≠ 1, Sₙ = u₁(1 − rⁿ)/(1 − r). For r = 1, use Sₙ = nu₁.', 'Worked example: u₁ = 6, r = 2. Term 5 is 96, while the first-five total is 6 + 12 + 24 + 48 + 96 = 186.', 'Generate integer-index term and cumulative-sum tables on your GDC. Check the first value and the number of included terms. This activity uses finite sums; an infinite-sum formula is outside this SL slice.'],
        ['Explain why the exponent in the term rule is n − 1 but the finite-sum formula contains rⁿ.', 'For u₁ = 4 and r = −1, predict S₅ and S₆ without calculating every power.']),
      scene('g-explain', 'Two models can fit the same spaced terms', 'explain', null,
        ['A geometric sequence has u₁ = 3 and u₃ = 12. Dividing gives r² = 4, so both r = 2 and r = −2 fit those two observations.', 'The missing second term distinguishes the possibilities. Context may exclude one sign, but the algebra alone does not.'],
        ['Write the first four terms for each possible ratio.', 'Which model could describe repeated positive growth? Explain what extra evidence you used.']),
      scene('g-apply', 'Count rebounds and distance separately', 'apply', 'geometric',
        ['In an idealized model a ball is released from 2 m and each rebound reaches 75% of the previous height. Rebound 1 therefore reaches 1.5 m.', 'The table models rebound heights. Total travelled distance also includes the initial drop and both upward and downward travel between floor contacts.'],
        ['Predict the first four rebound heights.', 'By the fifth floor contact, how many complete rebound up-and-down journeys have occurred?', 'Express the total distance by that contact using a finite sum. State why a real ball eventually breaks this model.'],
        {first: 1.5, ratio: 0.75, index: 4, count: 4}, [control('index', 'Rebound number', 1, 8), control('count', 'Complete rebound journeys', 1, 8)]),
      scene('g-exit', 'A whole-stage decision', 'exit', 'geometric',
        ['An idealized display starts with 40 lights at stage 1 and triples the number at each new stage.'],
        ['Find the first stage with more than 1000 lights. Check that stage and the preceding stage.', 'Find the total through stage 5.', 'Explain why a noninteger calculator solution is not itself a stage number.'],
        {first: 40, ratio: 3, index: 5, count: 5}, [control('index', 'Stage number', 1, 8), control('count', 'Number of stages included', 1, 8)])
    ]
  },
  finance: {
    id: 'ib-finance', title: 'Money, time and purchasing power', course: 'IB Mathematics AI SL', topic: '1.4 · Financial applications', curriculum: CURRICULUM,
    sourceRefs: source('SL 1.4; printed page 28. Regular-payment models belong to SL 1.7.'),
    scenes: [
      scene('f-warmup', 'A percentage acts on an amount', 'warmup', 'finance',
        ['For this invented scenario, QAR 4000 is deposited once. The annual interest rate is 5%, credited annually. There are no later deposits, withdrawals, fees or taxes.', 'Time 0 is the initial deposit; time 1 is after the first year of interest.'],
        ['What multiplier represents a 5% increase? What multiplier represents a 5% decrease?', 'Predict the balances at time 0 and time 1. Is interest the whole final balance?'],
        {principal: 4000, annualRatePercent: 5, compoundsPerYear: 1, years: 1, kind: 'compound', inflationPercent: 0}, [control('years', 'Completed years', 0, 6)]),
      scene('f-discover', 'Simple and compound: predict the gap', 'discover', 'finance',
        ['Compare the compound balance with simple interest on the same original principal. Simple interest adds a fixed amount each year; compound interest also earns interest on earlier interest.', 'The rate is a nominal annual percentage. A year is split into m equal compounding periods: quarterly means m = 4 and monthly means m = 12.'],
        ['Predict whether increasing compounding frequency changes the result when the nominal annual rate is held fixed.', 'Compare m = 1, 4 and 12. Explain what must change in both the periodic rate and number of periods.', 'At zero interest, what should every balance show?'],
        {principal: 6000, annualRatePercent: 6, compoundsPerYear: 4, years: 4, kind: 'compound', inflationPercent: 0}, financeControls),
      scene('f-notes', 'Write the setup before the calculator answer', 'notes', null,
        ['For nominal annual rate r%, m credits per year and t years: FV = PV(1 + r/(100m))ᵐᵗ. Here N = mt counts completed credit periods.', 'Worked example: QAR 5000 at 8% nominal annual interest, compounded quarterly for 2 years, gives 5000(1.02)⁸ = QAR 5858.30 to two decimal places. Interest is QAR 858.30.', 'For a finance solver, record N = 8, annual I% = 8, PV = −5000, PMT = 0, P/Y = C/Y = 4 and solve FV. Opposite signs describe the initial outflow and later receipt; do not divide I% by 4 a second time.', 'Keep full calculator precision until the final answer. The graph and table show completed credit dates, not continuous payment availability.'],
        ['For 18 months with monthly compounding, identify t, m and N.', 'Which entry tells the solver that there are no regular payments?']),
      scene('f-explain', 'A threshold needs two nearby checks', 'explain', 'finance',
        ['An invented QAR 5000 deposit earns 8% nominal annual interest with quarterly credits. The target is at least QAR 6000.', 'A calculator can solve for a fractional number of periods. The first credited balance meeting the target must occur at an integer period.'],
        ['Use the quarter-by-quarter table to locate the first credited balance at or above QAR 6000.', 'Report the previous and selected balances, then convert the chosen number of quarters into years.', 'Would “strictly above” always mean the same thing as “at least”? Explain using a target equal to a credited balance.'],
        {principal: 5000, annualRatePercent: 8, compoundsPerYear: 4, years: 3, kind: 'compound', inflationPercent: 0}, [control('years', 'Completed years shown', 0, 5)]),
      scene('f-depreciation', 'Value remaining is not value lost', 'discover', 'finance',
        ['A fictional piece of school equipment costs QAR 9000 and loses 20% of its remaining value each year. No repairs or market-price changes are included in this model.', 'The annual factor is 0.8. Equal percentage decreases produce smaller monetary losses over time.'],
        ['Predict its value after 3 years and the amount lost since purchase.', 'Compare the monetary loss in year 1 with the loss in year 3.', 'Explain why a fixed 20% loss of the original price would describe a different model.'],
        {principal: 9000, annualRatePercent: 20, compoundsPerYear: 1, years: 3, kind: 'depreciation', inflationPercent: 0}, [control('annualRatePercent', 'Annual depreciation (%)', 0, 50, 5), control('years', 'Completed years', 0, 10)]),
      scene('f-inflation', 'A larger balance can buy less', 'apply', 'finance',
        ['For this invented comparison, QAR 8000 earns 4% annually while a constant annual inflation model uses 6%. No actual market rates are being asserted.', 'Real balance = nominal balance divided by (1 + inflation/100)ᵗ, expressed in purchasing power at time 0. Compare quantities at the same date.'],
        ['Predict whether the nominal and real balances rise or fall before viewing the model.', 'Explain the real annual factor 1.04/1.06. Why is subtracting the percentage rates only an approximation?', 'State one limitation of a constant inflation assumption.'],
        {principal: 8000, annualRatePercent: 4, compoundsPerYear: 1, years: 4, kind: 'compound', inflationPercent: 6}, [control('annualRatePercent', 'Annual investment rate (%)', 0, 10, 0.5), control('inflationPercent', 'Annual inflation (%)', 0, 12, 0.5), control('years', 'Completed years', 0, 10)]),
      scene('f-exit', 'Choose a model and defend the interpretation', 'exit', null,
        ['An invented school fund invests QAR 12000 once at 6% nominal annual interest, compounded monthly, for 2 years. Annual inflation is modelled at 3%.', 'This attachment-guided route covers single initial amounts, compound interest, depreciation and real value. Existing loan and annuity material remains a separate later SL 1.7 teaching block.'],
        ['Write a correctly indexed expression for the nominal balance and identify the monthly rate and period count.', 'Find the interest earned and the balance in time-0 purchasing power. Round monetary answers only at the end.', 'Explain why adding a monthly deposit would require a different model.'])
    ]
  }
});
