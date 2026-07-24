# Final Artifact Integrity Audit

Generated: 2026-07-24T19:54:53+00:00

Status: **PASS**

- Package version: **5.0.1**
- Manifest-covered files (excluding `FILE_MANIFEST.json` and `SHA256SUMS.txt` by design): **1,224**
- Planned checksum entries (all files except `SHA256SUMS.txt`, including `FILE_MANIFEST.json`): **1,225**
- Uncompressed bytes before the generated manifest/checksum files: **296,188,445**
- Largest package file: `payload/question-bank/official/data/student/archive-index.json` (**2,139,437 bytes**)
- Files larger than 95 MiB: **0**
- JSON files in the completed package, including `FILE_MANIFEST.json`: **65**
- SVG media files present: **1,095**
- PowerShell scripts covered by the installer parser preflight: **9**
- Canonical questions audited: **1,217 / 1,217**
- Student-ready / restricted: **352 / 865**
- Structural/data/deployment validations: **31 passed**
- Local Chromium smoke tests: **12 / 12 passed**
- Critical data/application validation errors: **0**
- Informational warnings: **1** (six intentionally retained duplicate placeholder-prompt groups with distinct permanent IDs/source contexts)
- Broken local paths: **0**
- Duplicate question IDs: **0**
- Missing student media references: **0**
- Student navigation links to teacher tools: **0**
- Restricted answer/solution/rubric leaks in the student archive: **0**
- Ambiguous PowerShell `$Variable:` interpolation regression hits: **0**
- Pre-install host PowerShell parser pass: **enabled before validation, backup, or copying**

`FILE_MANIFEST.json` records each covered file's path, byte count, and SHA-256 digest. `SHA256SUMS.txt` provides conventional checksum lines for all package files except itself.

## 5.0.1 installer correction

The package was regenerated after repairing the Windows PowerShell parser defect described in `INSTALLER_HOTFIX_5.0.1.md`. The audit data totals, student-ready boundary, mathematical content, mappings, media, and visual design are unchanged.
