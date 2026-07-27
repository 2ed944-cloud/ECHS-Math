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

## 1. Convert a Blackboard archive

```bash
python question-bank/private-sources/tools/import_blackboard_qti_secure.py \
  /path/to/source.zip \
  --config question-bank/private-sources/config/at9.json \
  --output-root /secure/output
```

Use the matching configuration for each bank: `at9.json`, `ca9.json`, `ca9b.json`, or `acs10.json`.

## 2. Validate complete private packages

```bash
python tools/validate_private_bank_packages.py \
  /secure/output/echs-bb-at9-private-import.zip \
  /secure/output/echs-bb-ca9-private-import.zip \
  /secure/output/echs-bb-ca9b-private-import.zip \
  /secure/output/echs-bb-acs10-private-import.zip \
  --output-dir /secure/output/validation
```

The validator checks counts, ZIP integrity, stable IDs, answer references, media files, AP Precalculus and IB fallbacks, and every fail-closed Trust flag.

## 3. Deploy the private backend foundation

Merge the reviewed foundation PR, then run **Deploy Institutional Backend** with confirmation `DEPLOY`. The workflow creates:

- private package, question, media, and import-run tables;
- a non-public `private-question-banks` storage bucket;
- a Question Trust release trigger;
- the authenticated `private-bank-api` Edge Function.

## 4. Upload one validated package

Run only from a trusted machine with service-role credentials:

```bash
export SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="..."
export ECHS_ORGANIZATION_ID="..."

python tools/upload_private_bank_package.py \
  /secure/output/echs-bb-at9-private-import.zip
```

The upload tool:

1. registers AP Precalculus and IB skill definitions in Mastery 2.0;
2. uploads the private package archive;
3. inserts question payloads in batches;
4. uploads every referenced image as a private storage object;
5. records SHA-256 fingerprints and live deployment counts.

Repeat for all four packages. Use `--dry-run` to verify a package and graph paths without making network changes.

## 5. Lesson alignment and release

- AP Precalculus uses its existing 49-topic lesson catalogue.
- IB Mathematics uses the internal 25-lesson catalogue in `data/ib-math-ai-lesson-catalog.json` while full lesson content is built.
- Automatic mappings are candidates only.
- Uncertain prerequisite material stays in Unit 0 Readiness.
- A question reaches student practice only after exact lesson mapping, independent mathematics review, media review, and rights clearance.

Never commit a generated private package to the public repository or GitHub Pages artifact.
