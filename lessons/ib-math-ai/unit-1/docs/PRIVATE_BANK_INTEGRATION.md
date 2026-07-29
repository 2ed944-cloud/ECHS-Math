# Private question-bank integration

The Manager-uploaded IB question banks remain in authenticated institutional storage. The public lesson files contain only original ECHS lesson questions and a protected bridge to the platform Practice Studio.

## Visible lesson routing

- Course: `ib-math-ai`
- Unit: `1`
- Visible lessons: `1.1` through `1.8`
- Skill keys: `IBAI.U1.NUMBER`, `IBAI.U1.ALGEBRA`, `IBAI.U1.SEQUENCES`, `IBAI.U1.MATRICES`, `IBAI.U1.MODELING`

Each lesson now provides two practice layers:

1. the lesson's built-in 40-question Practice Studio;
2. an **Open linked IB banks** bridge to the authenticated platform Practice Studio.

The platform first loads questions mapped directly to the visible numeric lesson. It then adds compatible legacy aggregate mappings such as `u1-number`, `u1-sequences`, `u1-algebra`, and `u1-matrices`, rescoping them to the current visible lesson before filtering and adaptive selection. Source-content fingerprints are preserved for deduplication.

## Access and rights boundary

- Students reach the protected banks after completing the lesson or through a teacher assignment.
- Teachers and administrators retain full course access.
- Private prompts, answers, media, provenance, rights metadata, and stable IDs remain outside public GitHub Pages lesson assets.
- Bank labels are neutral student-facing ECHS labels; source identities remain internal for audit.
