# Blackboard Practice Studio Import Status

## Live in the current production catalog

- `CALCT3BC`: 3,309 questions.

## Connected on this branch

- Practice Studio loads an optional Blackboard addon catalog.
- A new **Blackboard Bank** browse mode is available.
- Publisher bank titles appear in the Bank filter.
- Blackboard figures can be loaded lazily from chapter ZIP packages.
- AP Precalculus attempts are recorded under the correct course.
- The first three `PCALRT5S` questions are connected as a live student pilot.

## Full converted payload

- `PCALRT5S`: 4,528 questions across 16 chapter files.
- `CAF5S`: 3,101 questions across 11 chapter files.
- Total new questions: 7,629.
- Total Blackboard questions after installation: 10,938.
- All 7,629 generated question IDs are unique.
- 17,514 question/choice image references resolve to their chapter media packages.
- All answer-key choice references resolve.

The complete generated payload is installed separately because the GitHub connector can write repository text changes but cannot directly upload the generated binary media ZIP packages from the conversation runtime.
