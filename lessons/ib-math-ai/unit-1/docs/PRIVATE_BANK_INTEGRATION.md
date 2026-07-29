# Private question-bank integration

The attached manager-ready banks were used to identify coverage and lesson routing, not to copy private prompts into public lesson HTML.

## Mapping contract

- Course: `ib-math-ai`
- Unit: `1`
- Lesson: one of `1.1` through `1.8`
- Skill keys preserved: `IBAI.U1.NUMBER`, `IBAI.U1.ALGEBRA`, `IBAI.U1.SEQUENCES`, `IBAI.U1.MATRICES`, `IBAI.U1.MODELING`

Each lesson data file contains a `bankBridge` object. The final Learn slide opens the authenticated platform practice page with course, unit and lesson query parameters.

## Rights boundary

- Embedded lesson questions: original ECHS questions.
- Attached private-bank prompts: remain in authenticated school access.
- Stable bank IDs, provenance, rights metadata and canonical chunks: not modified.
- Public lesson package: contains no private source PDF, facsimile or bank JSON.
