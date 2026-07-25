# ECHS Practice Studio — Blackboard Bank Imports

This directory documents and supports direct student import of the three supplied Pearson/TestGen Blackboard QTI banks.

## Active scope

Only Blackboard QTI archives are included:

- `CALCT3BC` — 3,309 questions, already present in the Practice Studio.
- `PCALRT5S` — 4,528 Precalculus questions.
- `CAF5S` — 3,101 Precalculus / college-algebra-foundation questions.

The two PDF archives are excluded at the user's request.

## Content policy

The user confirmed publication rights for these sources. Publisher question text, answer choices, keys, feedback, and figures are treated as source-authoritative. The import process performs technical checks only:

- stable and unique IDs;
- valid JSON;
- answer-key references resolve to existing choices;
- image-package paths resolve;
- source pool/chapter metadata is retained;
- generated bundles load in the existing Practice Studio.

No independent mathematical audit is required before student access.

## Duplicate policy

All source questions and all source versions are retained. Duplicate detection may be used only to avoid showing equivalent items twice in one generated practice set; it must never delete source questions.

## Student experience

Imported banks use the existing `question-bank/practice.html` interface and its filters, random-set generator, immediate answer checking, local progress history, dashboard, and source-section filtering.

## Media packaging

For large banks, source images are grouped into chapter-level ZIP packages. The browser loads only the package needed for the visible question through `js/blackboard-assets.js`, avoiding tens of thousands of loose Git objects while preserving the original publisher figures.

## Import order

1. `PCALRT5S`
2. `CAF5S`
3. Combined AP Precalculus course/unit bundles
4. Browser smoke test and catalog count verification
