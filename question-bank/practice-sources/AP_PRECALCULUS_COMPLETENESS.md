# AP Precalculus Practice-Bank Completeness Audit

## Expected publisher banks

| Bank | Expected questions |
|---|---:|
| `PCALRT5S` | 4,528 |
| `CAF5S` | 3,101 |
| **Expected new AP Precalculus / foundation total** | **7,629** |

## Current GitHub state at branch creation

The merged repository catalog exposes only the three-question `PCALRT5S` pilot:

- `question-bank/data/blackboard-addon.json` reports `question_count: 3` for `PCALRT5S`.
- It points to `question-bank/data/imported/pcalrt5s/chapter_01_pilot.json`.
- No full `PCALRT5S` chapter catalog is registered.
- No `CAF5S` bank is registered.

Therefore the AP Precalculus publisher banks are **not yet complete in GitHub**, even though the local conversion previously reported 7,629 valid questions. The failed command-line run copied the payload locally but stopped before Git staged, committed, and pushed it; PR #6 was then merged with the pilot catalog only.

## Required completion gate

The bank is complete only when all of the following pass:

1. `PCALRT5S.question_count >= 4528`.
2. `CAF5S.question_count >= 3101`.
3. Both banks appear in `blackboard_banks`.
4. All generated chapter JSON files referenced by the addon catalog exist.
5. AP Precalculus course bundles represent Units 1–4.
6. Every question ID is unique.
7. Every `correct_choice_id` resolves to a choice in the same item.
8. Every packaged image reference resolves to a member of the referenced media ZIP.
9. The Practice Studio can load each AP Precalculus unit without a fetch error.

## UI protection added

`practice.html` now runs `js/precalculus-bank-audit.js`. The page displays **Complete** only when both source-bank counts meet the expected totals. It otherwise displays **Incomplete**, preventing the interface from implying that the full banks are live when only the pilot is present.

## Next repository action

Re-upload the generated payload to a fresh branch based on current `main`, commit it, and open a new pull request. Do not reuse the deleted/merged PR #6 branch. After the full payload is present, update `blackboard-addon.json` from pilot entries to the complete bank and course-unit catalog, then run the technical validator.
