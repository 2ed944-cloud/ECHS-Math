# AP Precalculus Units 1-2 Resource Package

This package upgrades the current 29 AP Precalculus lesson cards in the ECHS Mathematics portal.

## Public student resources

- 29 full-color Notes PDFs
- 29 full-color Worksheets, each with 32 prompts organized as Readiness, Core, Medium, Hard, Difficult, Challenge/HOT, 6 AP-style MCQs, and 2 AP-style FRQs
- Topic-specific Flipped Math video page links
- `data/ap-precalculus-resources-update.js`, which replaces the three redundant lesson-module chips with Video, Notes, Worksheet, and Interactive Lesson chips

## Private teacher resources

- 29 full-color answer keys with scoring notes
- Editable XeLaTeX source for notes, worksheets, and answer keys

## Installation

1. Copy `notes`, `worksheets`, `assets`, and `data/ap-precalculus-resources-update.js` into the repository root.
2. Add the script tag shown in `INDEX-UPDATE-INSTRUCTION.txt` after `data/ap-precalculus-update.js`.
3. Do not publish `teacher-answer-keys` unless access is private.
4. Commit and push. GitHub Pages will serve the new resource links.

## Editable LaTeX

Compile any `.tex` file with XeLaTeX or `latexmk -xelatex`. Each source folder includes `echs_logo.png` for easy one-folder compilation.

## Scope

This release covers every lesson currently present in Units 1-2 of the portal: 14 Unit 1 lessons and 15 Unit 2 lessons. It does not claim to cover future Unit 3 or optional Unit 4 lesson cards that are not yet in the current portal update file.

All questions are original ECHS materials. Pearson and Holt were used for conceptual coverage and progression; textbook exercises were not reproduced.
