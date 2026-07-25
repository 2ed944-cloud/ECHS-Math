# Audit Batch — 1969 AP Calculus AB Free-Response Questions

Generated: 2026-07-25T04:45:00+00:00

## Scope and production boundary

This batch repairs the **effective teacher/admin records** for the seven 1969 AP Calculus AB free-response questions through the existing audited overlay. It does not rebuild or rewrite the stable canonical chunks.

Preserved without change:

- all seven existing question IDs;
- canonical and student chunk organization;
- source and provenance metadata;
- source-page and question-crop SVG paths;
- rights status (`permission-required`, school-internal, no public publication approval);
- the intentionally redacted/indexed-only student archive projection.

Files changed in this batch are limited to the existing 1969 admin audit overlay and this audit report.

## Source comparison method

The canonical records identify pages 3–5 of `ap_calculus_free_response_1969_2010(5).pdf` as the source. Each transcription was compared directly with the repository's source-page and question-region SVG facsimiles rendered from those PDF pages. The SVGs preserve the source glyphs and expose per-glyph text data; OCR was not treated as authoritative.

This direct comparison is material for Question 3: the source facsimile displays

\[
e^{-1}\le x<e,
\]

not a closed interval at the right endpoint. The corrected overlay therefore preserves the half-open domain and an open point at \(x=e\).

## Question-by-question repairs

| Question | Source page(s) | Repairs and verification | Effective access |
|---|---:|---|---|
| `APCALC-AB-FRQ-1969-01` | 3 | Verified all 16 Yes/No classifications; replaced the generic whole-question placeholder with a complete parity, injectivity, periodicity, and continuity solution; added a compact alternative table; corrected source-page and crop alt text. | Teacher/archive-only |
| `APCALC-AB-FRQ-1969-02` | 3 | Recomputed \(v(t)=12t(t-2)^2\) and \(a(t)=12(3t-2)(t-2)\); distinguished rest from direction change; verified \(v(2/3)=128/9\); added a sign-chart alternative; corrected the reused Question 1 source-page alt text. | Teacher/archive-only |
| `APCALC-AB-FRQ-1969-03` | 3–4 | Corrected the domain to \([e^{-1},e)\); removed the excluded endpoint from the extrema comparison; corrected concavity intervals, graph instructions, and open-endpoint description; independently derived the average value \(2/(e-1)\); added full and alternative solutions plus precise facsimile alt text. | Teacher/archive-only |
| `APCALC-AB-FRQ-1969-04` | 4 | Independently verified population extrema and the minimum population-rate value; replaced the placeholder solution with complete derivative and endpoint analysis; corrected source media alt text. | Teacher/archive-only |
| `APCALC-AB-FRQ-1969-05` | 4 | Independently verified area \(4/3\) and volume \(8\pi/3\); supplied a complete washer solution and shell-method cross-check; corrected source media alt text. | Teacher/archive-only |
| `APCALC-AB-FRQ-1969-06` | 4–5 | Derived the parabolic and cosine models, verified areas \(4bh/3\) and \(4bh/\pi\), and confirmed the parabolic window has greater area; added a normalized-variable alternative and corrected all relevant page/crop alt text. | Teacher/archive-only |
| `APCALC-AB-FRQ-1969-07` | 5 | Derived the tangent intercept \(Q=(r-\coth r,0)\), verified the distance \(PQ=|\coth r|\) including the necessary absolute value for negative \(r\), and proved the limiting distance is 1; added a non-hyperbolic alternative and corrected source media alt text. | Teacher/archive-only |

## Audit-state reconciliation

The prior report and overlay marked these records as verified, but the effective records still inherited generic whole-question solution placeholders and several duplicated or inaccurate media descriptions. Question 3 also retained an endpoint-analysis answer inconsistent with its corrected half-open domain.

This batch reconciles the verification claims with the actual effective content. Every record now includes:

- a source-compared transcription state;
- valid KaTeX-delimited mathematics;
- a complete worked solution;
- an alternative solution when it adds a useful check or method;
- independently verified answers;
- question-specific accessible media descriptions;
- honest teacher/archive-only audit and release fields.

## Mathematical checks

- Question 1: all parity, invertibility, periodicity, and continuity entries checked independently.
- Question 2: derivatives, rest times, sign changes, and first zero-acceleration velocity recomputed.
- Question 3: extrema, excluded-endpoint behavior, concavity, inflection point, sketch features, integral, and average value recomputed.
- Question 4: critical points, endpoint values, and rate minimum recomputed.
- Question 5: area and volume recomputed by washers and cross-checked by shells.
- Question 6: both equations and areas derived from the stated width and height and compared exactly.
- Question 7: tangent equation, intercept, absolute distance, and limit derived independently.

## Validation

The repository pull-request workflow is required to run both validation layers against the complete branch state:

```text
npm run validate:overlays --prefix question-bank/official/tools
python question-bank/official/tools/validate_release.py
```

The overlay validator checks JSON structure, canonical-ID membership, duplicate overlay IDs, student-access gates, duplicate part labels, balanced math delimiters, and strict KaTeX parsing. The full release validator checks the broader canonical/admin/student release invariants and media references.

## Publication gate

All seven records remain excluded from public student practice. Their source metadata is `permission-required`, access is school-internal, and public-publication approval is not established. This batch repairs teacher/admin content and audit integrity; it does not change the rights boundary or promote any record to the public student pool.
