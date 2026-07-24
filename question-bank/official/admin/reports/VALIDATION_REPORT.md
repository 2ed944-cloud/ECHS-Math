# Validation Report

Generated: 2026-07-24T13:55:59+00:00

Overall: **PASS**

| Validation | Result | Detail |
|---|---|---|
| Canonical count reconciliation | PASS | 1217 records |
| Unique IDs | PASS | No duplicate canonical IDs |
| One audit row per record | PASS | 1217 audit rows |
| KaTeX strict parse | PASS | 14338 expressions; 0 failures |
| Student-ready media references | PASS | 0 student-ready issue(s); 113 archive review blocker(s) |
| Student-ready gate | PASS | 53 independently verified records |
| Answer withholding | PASS | 0 non-ready records expose answer data |
| Student navigation separation | PASS | Teacher links found in: none |
| Practice pool filter | PASS | Practice initializes from student-ready rows only |
| Exam pool filter | PASS | Exam simulator initializes from student-ready rows only |
| Exact lesson URL integration | PASS | Portal patch sends exact topicCode and lesson |
| Dashboard attribution filter | PASS | Dashboard ignores archive-only attempts |
| JavaScript syntax | PASS | All JS parsed |
| JSON parse | PASS | All JSON parsed |
| Secret-pattern scan | PASS | No token/private-key pattern found |

Review-required archive records are expected and are not release-critical because they are excluded from practice, exams, smart recommendations, scoring, and dashboard attribution.
