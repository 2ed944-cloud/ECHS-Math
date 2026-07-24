# Final Artifact Integrity Audit

Generated: 2026-07-24T18:27:18+00:00

Status: **PASS**

- Package version: **5.0.0**
- Manifest-covered files (excluding `FILE_MANIFEST.json` and `SHA256SUMS.txt` by design): **1,223**
- Planned checksum entries (all files except `SHA256SUMS.txt`, including `FILE_MANIFEST.json`): **1,224**
- Uncompressed bytes before the generated manifest/checksum files: **296,183,319**
- Largest package file: `payload/question-bank/official/data/student/archive-index.json` (**2,139,437 bytes**)
- Files larger than 95 MiB: **0**
- JSON files parsed by the final validator: **65 before manifest generation**
- SVG media files present: **1,095**
- Canonical questions audited: **1,217 / 1,217**
- Student-ready / restricted: **352 / 865**
- Structural/data/deployment validations: **31 passed**
- Local Chromium smoke tests: **12 / 12 passed**
- Critical validation errors: **0**
- Informational warnings: **1** (six intentionally retained duplicate placeholder-prompt groups with distinct permanent IDs/source contexts)
- Broken local paths: **0**
- Duplicate question IDs: **0**
- Missing student media references: **0**
- Student navigation links to teacher tools: **0**
- Restricted answer/solution/rubric leaks in the student archive: **0**

`FILE_MANIFEST.json` records each covered file's path, byte count, and SHA-256 digest. `SHA256SUMS.txt` provides conventional checksum lines for all package files except itself.
