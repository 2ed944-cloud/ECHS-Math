# ECHS Private Blackboard Bank Foundation

This directory contains **public-safe integration code and inventory metadata only**. It does not contain publisher question text, answer choices, source images, or source archives.

## Audited private inventory

- 4 Blackboard QTI packages
- 1,484 source pools
- 15,671 questions
- 38,593 media files/references
- 15,671 stable ECHS IDs

## Student-facing aliases

| Source package | AP Precalculus display | IB Mathematics display |
| --- | --- | --- |
| `ECHS-BB-AT9` | AP Precalculus Bank 1 | IB Mathematics Bank 1 |
| `ECHS-BB-CA9` | AP Precalculus Bank 2 | IB Mathematics Bank 2 |
| `ECHS-BB-CA9B` | AP Precalculus Bank 3 | IB Mathematics Bank 3 |
| `ECHS-BB-ACS10` | AP Precalculus Bank 4 | IB Mathematics Bank 4 |

Publisher metadata is retained inside private package provenance and is never used as a student-facing title.

## Trust boundary

The secure importer always produces:

- `teacher_review_required`
- `student_visible=false`
- `student_accessible=false`
- `student_ready=false`
- restricted instructor-resource rights
- unverified lesson mappings

Publisher answer keys are source evidence, not independent mathematical verification. The Question Trust release gate remains mandatory before student use or Mastery 2.0 evidence.

## Import

```bash
python question-bank/private-sources/tools/import_blackboard_qti_secure.py \
  /path/to/source.zip \
  --config question-bank/private-sources/config/at9.json \
  --output-root /secure/output
```

The output must be uploaded to private storage. Never commit a generated private package to the public repository or GitHub Pages artifact.
