# IB Mathematics AI SL: merged Lesson 1.4 + 1.7, release 8.0.0

The previous combined lesson loaded successive content overlays, emphasized TI-84 workflows, and treated inflation and several ordinary SL annuity applications as extensions. This release keeps the user's requested merged structure and provides one coherent, interactive lesson at the existing URL.

## Current syllabus mapping

| Official content | Lesson treatment |
| --- | --- |
| SL 1.4 compound interest | Annual, half-yearly, quarterly and monthly compounding; present and future value; unknown rate and duration; completed-period thresholds |
| SL 1.4 annual depreciation | Retention factors, reverse values, annual versus total loss, replacement thresholds |
| SL 1.4 real investment value | Inflation factors, today's purchasing power, nominal versus real change |
| SL 1.7 amortization using technology | Loan payments, total interest, schedules, outstanding balances, payment composition, term comparisons and a smaller final repayment |
| SL 1.7 annuities using technology | End-of-period regular saving, savings targets and withdrawal funds; solve the appropriate finance variable |

All assessments use end-of-period payments. Compound/annuity formula derivations, beginning-of-period payments, growing annuities and continuous compounding are absent from the active assessment route. Challenges use the same combined SL content with less scaffolding. The syllabus basis is the current first-assessment-2021 course, before the first-assessment-2029 revision.

## Delivered experience

- 67 slides and 12 investigations with labelled graphs and equivalent numerical tables.
- 28 precision-aware formative checks with hints and worked answers.
- 24 original IB-style written tasks: 12 short, 8 extended and 4 challenges; 60 parts, 139 variable method/accuracy/reasoning marks.
- Consistent interpret → model → calculate → verify → communicate method. TI-Nspire CX / CX II Finance Solver guidance covers single sums, loans and annuities, including seven guided input exercises.
- Clear units, nominal/periodic rates, cash-flow viewpoints, END timing and final-answer accuracy. Retain unrounded intermediate values unless a question explicitly specifies fixed payments.
- Attempt-gated markschemes, draft editing that clears old self-scores, account/revision-scoped device storage, pending-edit preservation on account switches, graceful storage denial, keyboard navigation and student printing.
- Existing protected progression and bank routing remain intact. Viewing or self-scoring does not award platform mastery. The legacy SL 1.7 URL preserves both its query and hash while redirecting to the merged lesson.

The canonical active lesson and current print view replace the previous financial resource links. Historical content source files and original notes remain in the repository; their broader material is not injected into the current lesson.

## Validation

The new mathematical tests use independent period-by-period accumulation and amortization to check balances, payments, annuities, real values, written answers and period thresholds. DOM tests exercise every investigation, all seven calculator exercises, all 28 checks and all 60 written parts, including KaTeX rendering, input changes, account isolation, reset and protected continuation. Unit metadata, links and access contracts are checked separately.

CI gates now verify the current runtime rather than requiring superseded TI-84 overlay markers. Post-deployment verification checks the merged commit, protected HTML, all eight release assets byte-for-byte, lesson counts, metadata and the SL 1.7 redirect.

## Primary references

- [IB Mathematics: Applications and Interpretation guide, SL 1.4 and SL 1.7](https://www.woodstockschool.in/wp-content/uploads/2019/10/Mathematics-applications-and-interpretation-guide.pdf)
- [Official IB specimen papers and markschemes](https://ibo.org/globalassets/new-structure/university-admission/pdfs/dp-mathematics-applications-and-interpretation-specimen-papers-en.pdf)
- [TI-Nspire Finance Solver guide](https://education.ti.com/html/webhelp/EG_TINspire/EN_GB/content/m_calculator/ca_financial_calculations.HTML)
- [TI monthly-payment workflow](https://education.ti.com/en/customer-support/knowledge-base/ti-nspire-family/product-usage/22730)

All lesson questions and markschemes are original ECHS classroom material, not official IB assessment content.
