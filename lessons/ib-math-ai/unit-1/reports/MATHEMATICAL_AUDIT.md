# Mathematical and Assessment Audit Notes

## Audit method

The release was checked at four levels:

1. **Construction checks:** generated values are calculated from explicit sequence, financial, bounds, logarithmic, polynomial, or linear-system formulae rather than copied from OCR.
2. **Consistency checks:** displayed answers are parsed—including scientific notation—and compared with the numerical targets used by the lesson engine.
3. **Extended-task review:** each context, equation, domain restriction, result, interpretation, and mark total was checked as a complete task.
4. **Rendering checks:** every Learn, Practice, Quiz, and extended-task card was rendered through the actual KaTeX/runtime bundle.

## Corrections resolved before release

- Corrected the maximum number of complete arithmetic rows under a capacity constraint to 23.
- Replaced an inconsistent inverse arithmetic-sequence data set and verified the solution \(u_1=-1\).
- Corrected a geometric-model crossover to the first valid integer stage \(n=9\).
- Corrected a geometric finite-sum condition so that \(r=2\) satisfies both supplied facts.
- Corrected three-variable café and budget contexts so their stated data agree with the reported integer solutions.
- Corrected event-ticket revenue and verified all three counts and the revenue equation.
- Corrected the break-even task’s domain interpretation and profit maximum.
- Reworded financial rounding and remaining-payment questions to match their mathematical outputs.
- Replaced “maximum” by “upper-bound endpoint” where the upper endpoint is excluded.
- Tightened numerical tolerances for small scientific-notation values, rounding units, periodic rates, and small monetary differences.
- Made paired questions self-contained so randomization cannot remove necessary data.

## Final automated assertions

- 416 unique assessment IDs
- 400 unique short-question prompts
- 385 finite numerical targets with validated displayed answers
- no numerical tolerance accepts zero for a non-zero target
- 16 extended tasks with correct mark sums
- 0 KaTeX errors in 808 rendered Learn/Practice/Quiz cards plus all 16 extended tasks

The detailed audit data are stored in `question-audit.json`, `comprehensive-render-audit.json`, and `qa-results.json`.
