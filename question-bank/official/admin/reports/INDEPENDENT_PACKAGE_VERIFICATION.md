# Independent Package Verification

Overall: **PASS**

| Check | Result | Detail |
|---|---|---|
| JSON schema and parse validation | PASS | 0 error(s) |
| ID uniqueness validation | PASS | 1217 admin records; 1217 unique IDs |
| Canonical count reconciliation | PASS | admin=1217, student=1217, baseline=1217 |
| Source-reference validation | PASS | 0 record(s) lack source metadata |
| Question completeness validation | PASS | 0 record(s) lack disposition; 0 ready record(s) incomplete |
| MCQ-choice validation | PASS | 43 ready MCQ; 0 structural failure(s) |
| MCQ-answer validation | PASS | 0 ready MCQ key failure(s) |
| FRQ-part validation | PASS | 10 ready FRQ; 0 part failure(s) |
| FRQ-point validation | PASS | 0 point-total mismatch(es) |
| Mathematical verification validation | PASS | 0 ready record failure(s) |
| KaTeX validation | PASS | 14338 expression(s); 0 failure(s) |
| Media validation | PASS | 1073 SVG(s) parsed; 0 ready failure(s) |
| Broken-path validation | PASS | 0 referenced media file(s) missing |
| Duplicate detection | PASS | 0 duplicate prompt group(s) in certified pool |
| Course mapping validation | PASS | 0 ready mapping failure(s) |
| Unit mapping validation | PASS | 0 ready mapping failure(s) |
| Topic mapping validation | PASS | 0 ready mapping failure(s) |
| Lesson mapping validation | PASS | 0 ready mapping failure(s) |
| Student-ready gate validation | PASS | 53 certified record(s); 0 gate failure(s) |
| Archive filtering validation | PASS | 0 non-ready answer leak(s); runtime guard=True |
| Practice filtering validation | PASS | Student-ready and exact topic/lesson scope are required |
| Exam filtering validation | PASS | Exam pool is initialized from student-ready rows only |
| Dashboard attribution validation | PASS | Dashboard excludes attempts for non-ready IDs |
| Teacher-navigation separation validation | PASS | leaks=none |
| Student-navigation validation | PASS | incomplete nav=none |
| GitHub path validation | PASS | Expected payload overlay and exact lesson URL integration are present |
| Secret-pattern scan | PASS | 0 potential secret(s) |
| Case-sensitivity validation | PASS | 0 collision(s) |
| JavaScript syntax validation | PASS | 0 error(s) |
| Local HTML link validation | PASS | 0 broken link(s) |
| Student index/chunk reconciliation | PASS | index=1217, id-map=1217, chunks=1217 |
| One audit record per canonical question | PASS | 1217 audit row(s) |
| Required report validation | PASS | missing=none |
| Public/private rights boundary | PASS | public=53; forbidden paths=0; ineligible records=0 |
| Public index/chunk reconciliation | PASS | chunks=53, index=53, id-map=53 |

## Reconciled metrics

- Canonical questions: 1,217
- Student ready: 53
- Archive/teacher only: 1,164
- Questions corrected: 96
- Correction entries: 340
- Public-safe questions: 53
- KaTeX expressions parsed: 14,338
- KaTeX failures: 0

This verifier independently reloads the emitted artifacts and checks the student/admin boundary, public-rights boundary, runtime guards, source and mapping metadata, media paths, syntax, links, IDs, counts, and audit coverage.
