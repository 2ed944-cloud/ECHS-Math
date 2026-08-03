# IB AI SL 1.1 v5.0.0 — Rebuild QA

## Scope

Files rebuilt:

- `lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.1_standard_form_ECHS.html`
- `lessons/ib-math-ai/unit-1/data/lesson-1.1-v5-01.js` through `lesson-1.1-v5-04.js` (content overlay; the stable assessment data file remains intact)
- `lessons/ib-math-ai/unit-1/assets/css/lesson-1.1-v5-01.css` through `lesson-1.1-v5-04.css`
- `lessons/ib-math-ai/unit-1/data/lesson-1.1-runtime.js`
- `data/ib-math-ai-unit-1-delivery-catalog.json`

## Instructional result

- Learn route reduced from 61 screens to 36 purposeful screens.
- The sequence now follows: opening problem → definition → modelled examples → immediate student transfer → cumulative application → IB-style assessment → synthesis → exit ticket.
- Removed generic route, vocabulary, reflection, administrative and repeated explanation screens.
- Removed all lesson-specific inline SVG illustrations; mathematical meaning is communicated through stable HTML/CSS diagrams and equations.
- Existing 52 Practice Studio questions, 14 timed-quiz questions and 3 extended tasks are retained.

## Technical checks

- `node --check` passed for the runtime and all four lesson overlay JavaScript files.
- Lesson data parsed successfully: 36 slides, 52 practice questions, 14 quiz questions and 3 extended tasks.
- All slide titles are unique.
- Required engine IDs exist exactly once in the HTML.
- Math delimiters and aligned environments are balanced.
- Inline SVG count: 0.
- Layout audit at 1440×900: 0 horizontal-overflow failures across all 36 screens.
- Layout audit at 390×844: 0 horizontal-overflow failures across all 36 screens.
- Five desktop screens require small internal vertical scrolling; long mobile screens scroll within the lesson stage rather than the page body.

## Mathematical spot checks

- Standard-form definition and normalization condition.
- Positive and negative exponent conversion.
- Multiplication, division, powers, addition and subtraction.
- Distinction between decade and nearest-power order-of-magnitude conventions.
- Length/area/volume conversion factors.
- Satellite-storage application and 8-mark sensor-network task.
