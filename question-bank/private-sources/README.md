# ECHS Direct-Linked Private Blackboard Banks

This directory contains **public-safe integration code and inventory metadata only**. Publisher question text, choices, source images, and archives remain outside GitHub and GitHub Pages.

## Inventory

- 4 Blackboard QTI packages
- 1,484 source pools
- 15,671 questions
- 38,593 media files/references
- 15,671 stable unique ECHS IDs

## Student-facing names

| Internal code | AP Precalculus | IB Mathematics |
| --- | --- | --- |
| `ECHS-BB-AT9` | AP Precalculus Bank 1 | IB Mathematics Bank 1 |
| `ECHS-BB-CA9` | AP Precalculus Bank 2 | IB Mathematics Bank 2 |
| `ECHS-BB-CA9B` | AP Precalculus Bank 3 | IB Mathematics Bank 3 |
| `ECHS-BB-ACS10` | AP Precalculus Bank 4 | IB Mathematics Bank 4 |

Publisher metadata remains internal provenance.

## Direct-use policy

The importer produces:

- `publisher_key_direct`
- `student_visible=true`
- `student_accessible=true`
- `student_ready=true`
- `mapping_verified=true`
- `manual_question_trust_required=false`
- `verification_basis=publisher-answer-key`
- private school-authenticated rights
- one AP Precalculus lesson and one IB Mathematics lesson per question

Manual Question Trust review is **not required** for these four banks. The platform must display:

> Source-key practice · not independently audited.

Publisher answer keys are used directly. The system does not claim independent mathematical verification, and publisher-direct attempts remain distinguishable from `student_ready_verified` evidence in Mastery 2.0.

## Readiness lessons

Questions without a stronger direct source match are still attached to a formal lesson:

- AP Precalculus `0.1` — Readiness
- IB Mathematics `u0-readiness`

No question remains unmapped.

## 1. Convert an archive

```bash
python question-bank/private-sources/tools/import_blackboard_qti_secure.py \
  /path/to/source.zip \
  --config question-bank/private-sources/config/at9.json \
  --output-root /secure/output
```

Use the matching configuration: `at9.json`, `ca9.json`, `ca9b.json`, or `acs10.json`.

## 2. Validate all packages

```bash
python tools/validate_private_bank_packages.py \
  /secure/output/echs-bb-at9-private-import.zip \
  /secure/output/echs-bb-ca9-private-import.zip \
  /secure/output/echs-bb-ca9b-private-import.zip \
  /secure/output/echs-bb-acs10-private-import.zip \
  --output-dir /secure/output/validation
```

The validator checks ZIP integrity, counts, stable IDs, answer references, direct lesson mappings, media completeness, authenticated rights, and the publisher-key disclosure contract.

## 3. Deploy the backend

After merge, run **Deploy Institutional Backend** with `DEPLOY`. It creates:

- private package, question, media, and import-run tables;
- a non-public `private-question-banks` bucket;
- the publisher-key direct-use database guard;
- the authenticated `private-bank-api`;
- the Mastery attempt trust bridge.

## 4. Upload the regenerated packages

From a trusted machine:

```bash
export SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="..."
export ECHS_ORGANIZATION_ID="..."

python tools/upload_private_bank_package.py \
  /secure/output/echs-bb-at9-private-import.zip
```

Repeat for all four packages. The uploader rejects obsolete packages that still require manual Question Trust.

## 5. Student practice

When a signed-in student opens Focused Practice for an unlocked AP Precalculus or IB lesson:

1. the standard lesson bundle loads;
2. `private-bank-api/student-questions` returns only directly mapped questions for that course and lesson;
3. private images receive short-lived signed URLs;
4. attempts retain the exact skill and `publisher_key_direct` tier;
5. Mastery records publisher-key evidence without representing it as independently audited evidence.

Never commit generated private packages to the public repository or GitHub Pages artifact.
