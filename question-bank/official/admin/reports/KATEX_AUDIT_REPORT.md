# KaTeX Audit Report

Generated: 2026-07-28T01:45:40.667Z

**Overall result: PASS**

| Measure | Result |
| --- | ---: |
| Canonical questions checked | 1,217 |
| Unique question IDs checked | 1,217 |
| Math-bearing fields checked | 6,686 |
| Expressions parsed | 14,337 |
| Remaining parser errors | 0 |

Every delimited expression in every canonical record was parsed with KaTeX 0.16.27 using `throwOnError: true` and `strict: "error"`. Raw dollar delimiters and unmatched approved delimiters were also rejected.

Zero parser errors remain.

