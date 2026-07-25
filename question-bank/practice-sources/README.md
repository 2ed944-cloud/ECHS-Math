# ECHS Practice-Bank Ingestion

This area registers publisher-supplied instructional banks and provides a controlled local ingestion pipeline.

## Important rights boundary

The source archives are instructor/publisher materials supplied by the user. The repository is public, so raw archives, extracted source images, and proprietary question text must **not** be committed here unless explicit publication rights are documented.

The tools therefore create `teacher-only-staging` records. A question can enter the public/student practice bank only after all of the following:

1. rights/publication clearance or replacement with an independently authored derivative;
2. source-faithful transcription review;
3. mathematical answer verification;
4. KaTeX conversion and validation;
5. media accessibility and path verification;
6. AP course/unit/topic/lesson classification;
7. exact and near-duplicate review;
8. full practice-bank validation.

## Registered sources

The registry currently covers three Blackboard packages with **10,938 source items**, **1,168 pool files**, and **32,109 image assets**, plus **33 PDF files** for later manual extraction.

See `source-registry.json` for source-level counts and restrictions.

## Local import example

```bash
python question-bank/practice-sources/tools/import_blackboard_qti.py \
  "/secure-sources/_irc_files_312625_9780134770529_TG_calcearlytrans_BB (1).zip" \
  --source-id PEARSON-CALC-EARLY-TRANS-BB-9780134770529 \
  --output .private-practice-staging/calculus-early-trans.json \
  --media-output .private-practice-staging/media/calculus-early-trans
```

Use `--limit 20` for the first review batch.

## Duplicate detection

```bash
python question-bank/practice-sources/tools/dedupe_practice_bank.py \
  .private-practice-staging/*.json \
  --output .private-practice-staging/reports/duplicates.json
```

No record is deleted automatically. Duplicate groups retain all source references until a reviewer selects the practice-bank canonical record.

## Staging validation

```bash
python question-bank/practice-sources/tools/validate_practice_staging.py \
  .private-practice-staging/*.json
```

## Recommended batch order

1. Calculus Early Transcendentals Blackboard bank.
2. Precalculus Blackboard bank A103000235993.
3. Calculus Blackboard bank A103000239115.
4. Remediated chapter PDFs.
5. Single Precalculus test-item PDF.

Use batches of 20 straightforward MCQs or 5–10 figure-heavy/constructed-response items. Each reviewed batch should have its own branch and draft pull request. Do not merge raw staging records into the official College Board bank.
