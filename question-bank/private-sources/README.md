# ECHS Private Question Banks

The private-bank registry is intentionally empty after the July 2026 Calculus-only reset. AP Precalculus, IB Mathematics AI, Algebra 2, and Grade 9 question banks were removed because their questions were not reliably aligned with the course content.

Course lessons and learning materials remain in the platform. A course appears in Focused Practice again only after a newly curated bank is uploaded through the Teacher Upload Manager.

## Required routing contract

Every new package must:

- declare exactly one target course;
- give every question exactly one verified mapping;
- identify a valid unit number, lesson key, lesson title, and skill key;
- match the course selected by the teacher before upload;
- remain private and available only to authenticated school accounts.

The Manager and server-side importer reject the entire package before import if any question crosses a course boundary or has an incomplete route.

## Upload and validation

Use the Teacher Upload Manager for normal uploads. For a trusted command-line workflow, always provide the expected course:

```bash
python tools/upload_private_bank_package_verified_fast.py \
  /secure/output/curated-bank-private-import.zip \
  --organization-id ORGANIZATION_ID \
  --expected-course ap-precalculus
```

Validate a package before upload:

```bash
python tools/validate_private_bank_packages.py \
  /secure/output/curated-bank-private-import.zip \
  --output-dir /secure/output/validation
```

Generated packages, question text, answer keys, and publisher media must never be committed to this public repository.
