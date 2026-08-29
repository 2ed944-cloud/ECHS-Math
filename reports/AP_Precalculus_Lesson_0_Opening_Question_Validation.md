# AP Precalculus Lesson 0 — Opening Question Validation

Date: 2026-08-29  
Scope: AP Precalculus Lesson 0 only

## Student-facing addition

A new opening screen is inserted immediately after the teacher welcome and before the Math Passport:

**Opening Question · When does multiplying beat adding?**

Two school clubs begin with 100 followers:

- Additive model: `A(w) = 100 + 50w`
- Multiplicative model: `B(w) = 100(1.20)^w`

Students see that after week 1 the additive model leads, then predict which model is larger after week 10. They choose one of four positions, receive a reasoning prompt, and explain which representation—table, graph, equation, or context—would best test the claim.

## Mathematical verification

- `A(1) = 100 + 50 = 150`
- `B(1) = 100(1.20) = 120`
- `A(10) = 100 + 50(10) = 600`
- `B(10) = 100(1.20)^10 ≈ 619.174`

Therefore the multiplicative model overtakes the additive model by week 10. The slide deliberately asks for a prediction and evidence rather than revealing the answer during the opening discussion.

## Course relevance

The question previews central AP Precalculus habits without requiring prior AP content:

- comparing function families;
- additive versus multiplicative change;
- interpreting models in context;
- moving among graphical, numerical, analytical, and verbal representations;
- defending a prediction with mathematical evidence.

## Interaction and presentation checks

- The screen is inserted at position 2.
- AP Precalculus Lesson 0 increases from 34 to 35 screens.
- The first diagnostic-question screen moves from 11 to 12.
- The opening prediction is saved locally.
- The written explanation uses the existing saved-field system.
- Prediction controls use `aria-pressed` and a live feedback region.
- Math expressions use existing MathJax/KaTeX rendering.
- The layout has desktop, tablet, mobile, and reduced-motion rules.
- Existing diagnostic questions, answer keys, scoring, results, course facts, fullscreen controls, logo, and completion logic are unchanged.
- AP Calculus Lesson 0 is unchanged.
