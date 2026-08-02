# Unit 1 Definitive v3 — Reference Redesign Notes

## Design principle

The v3 release strengthens the validated Unit 1 package without replacing stable URLs, canonical lesson data, mastery keys or the shared runtime. Each lesson loads a deterministic enhancement layer after its canonical data and before KaTeX/engine initialization.

## Reference-to-lesson map

| Lesson | Strengthened reference coverage |
|---|---|
| 1.1 Scientific Notation and Orders of Magnitude | number sets, exact/approximate values, normalized scientific notation, operations, units and estimation |
| 1.2 Arithmetic Sequences and Series | sequence/series notation, recursive and explicit rules, sigma notation, finite sums and inverse problems |
| 1.3 Geometric Sequences and Series | negative/fractional ratios, nth terms, finite sums, growth/decay, thresholds and saturation |
| 1.4 Financial Applications of Sequences | simple versus compound interest, periodic/effective rates, depreciation, inflation and decision modelling |
| 1.5 Exponent Laws and Logarithms | integer/negative/rational exponents, common-base equations, logarithmic inversion and change of base |
| 1.6 Approximation, Bounds and Percentage Error | decimal places/significant figures, guard digits, half-open intervals, propagated bounds and relative error |
| 1.7 Loans, Annuities and Amortization | TVM variables, cash-flow signs, annuity future value, loan payment, amortization and strategy comparison |
| 1.8 Technology for Equations and Systems | 2×2 and 3×3 systems, model parameters, roots/intersections, residuals and contextual constraints |

## Files

- eight lesson-specific `data/lesson-1.x-v3.js` overlays — lesson-specific deep dives and new assessment items.
- `data/unit-1-v3-enhancements.js` — deterministic overlay, visual generation and dynamic route-count correction.
- `assets/css/unit1-premium.css` — lesson-specific visual system and responsive overrides.
- `tools/validate_v3_enhancement.py` — structural, assessment and final-count validator.
- `reports/v3-enhancement-audit.json` — machine-readable audit output.

## Stability

The implementation is additive. The baseline 49/40/10/2 data remains untouched and the final runtime result is 61/52/14/3 for each lesson. Existing localStorage completion records, authenticated-bank mappings and lesson URLs are preserved.
