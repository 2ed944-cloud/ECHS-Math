# IB Math AI Lesson 0 — Opening Question Validation

Date: 2026-08-29  
Scope: `IB_Math_AI_Lesson_0_First_Day_Diagnostic_ECHS.html`

## Student-facing change

The existing generic `opening-question` screen is replaced with one concrete, interactive IB Math AI decision task and moved immediately after the welcome screen.

### Scenario

Two school shuttle routes were timed over five mornings:

- Route A: 28, 29, 30, 31, 32 minutes
- Route B: 18, 24, 30, 36, 42 minutes

Both routes have a mean travel time of 30 minutes. The shuttle leaves at 7:10 and class begins at 7:45, so a journey longer than 35 minutes is late. Students decide which route should be recommended when reliability matters, explain their reasoning, and identify limitations in the evidence.

## Interactivity

- Four prediction/decision choices with live, non-revealing feedback.
- Selection saved in local storage.
- Teacher-controlled `Reveal the evidence after discussion` button.
- Revealed evidence can be hidden again and its state is saved.
- Written student decision saved through the existing Lesson 0 field system.
- MathJax/KaTeX notation retained through a `String.raw` template.
- Responsive two-column, tablet, and mobile layouts.
- Reduced-motion support.

## Mathematical verification

- Route A mean: `(28+29+30+31+32)/5 = 30`
- Route B mean: `(18+24+30+36+42)/5 = 30`
- Route A range: `32-28 = 4`
- Route B range: `42-18 = 24`
- Route A observed late journeys: `0/5`
- Route B observed late journeys: `2/5`

The stated conclusion is therefore defensible: Route A is the stronger initial recommendation when reliable on-time arrival is the criterion, while the five-day sample remains a limitation that justifies collecting more data.

## Release checks

- JavaScript passes `node --check`.
- Runtime mutation places `opening-question` at slide index 1, immediately after `welcome`.
- Total slide count remains 56; the old generic screen is replaced rather than duplicated.
- CSS braces are balanced.
- HTML loads data and diagnostic files first, then the opening-question override, then the original engine.
- No diagnostic question, choice, answer key, scoring rule, SL/HL logic, result calculation, assessment fact, or completion behavior is modified.
