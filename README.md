# ECHS Mathematics Portal

This repository contains the ECHS lesson portal and the canonical educational
question bank.

## Strict audited question boundary

- Canonical records preserved: **1,217** (**876 MCQ**, **341 FRQ**).
- Public student-ready records: **52** (**42 MCQ**, **10 FRQ**).
- Teacher/archive-restricted records: **1,165**.
- Canonical IDs, source references, provenance, stable routes, and redacted
  archive metadata are preserved.

Only independently verified, exactly lesson-mapped, ECHS-owned records whose
source metadata permits public publication enter practice, exams, smart
practice, or dashboard calculations. Restricted records remain indexed in the
archive but expose no prompt, choices, answer, solution, rubric, or media in the
public student data.

## Validation

```bash
npm ci --prefix question-bank/official/tools
npm run validate:katex --prefix question-bank/official/tools
npm run validate:browser --prefix question-bank/official/tools
python question-bank/official/tools/generate_release_checksums.py
python question-bank/official/tools/validate_release.py
```

The audit reports are in `question-bank/official/reports/`.

## Deployment note

GitHub Pages is a public static host. The student runtime is strictly filtered
and the public archive is redacted, but files committed to this repository are
not protected by an authenticated school-only boundary. A genuinely private
teacher/admin deployment requires an authenticated host.
