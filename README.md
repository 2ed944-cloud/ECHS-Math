# ECHS Mathematics Portal

This repository contains the ECHS lesson portal and the canonical educational
question bank.

Course-specific practice banks uploaded through the Private Bank Manager live
in private Supabase Storage and database tables. They are intentionally not
counted as missing when the public GitHub catalogue is audited, and they must
not be removed merely because they do not appear in the Pages source tree.

## Strict audited question boundary

- Canonical records preserved: **1,217** (**876 MCQ**, **341 FRQ**).
- Public student-ready records: **1,104** (**776 MCQ**, **328 FRQ**).
- Teacher/archive-restricted records: **113**.
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
