# Issue 3 manual repairs

This directory contains small, auditable Teacher Studio repair batches for
GitHub Issue #3.

Each batch:

- patches existing canonical IDs without regenerating IDs or deleting provenance;
- records a source-facsimile comparison and an independent mathematical check;
- supplies a complete stem, five choices for MCQs, a worked solution, KaTeX,
  media, calculator status, and AP unit/topic mapping;
- remains teacher/archive-only when publication rights are not established; and
- is loaded through `manifest.json` by the admin-only audit overlay.

The validator treats the manifest as the batch allowlist and rejects missing
canonical IDs, duplicate IDs, incomplete MCQs, missing worked solutions,
invalid KaTeX, missing media files, incomplete mappings, or any attempt to
promote a restricted repair to student access.

Completed chronological batches:

- Batch 001: 1969 AP Calculus BC Section I, 45 MCQs, source pages 16–25.
- Batch 002: 1973 AP Calculus BC Section I, 45 MCQs, source pages 35–43.
- Batch 003: 1985 AP Calculus BC Section I, 45 MCQs, source pages 53–62.
- Batch 004: 1988 AP Calculus BC Section I, 45 MCQs, source pages 73–83.
- Batch 005: 1993 AP Calculus BC Section I, 45 MCQs, source pages 95–105.
- Batch 006: 1997 AP Calculus BC Section I, 40 indexed-only MCQs (questions 1–25 and 76–90), source pages 119–130.
