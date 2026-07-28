# KaTeX Audit Report

Generated: 2026-07-28T03:16:30.686Z

**Overall result: PASS**

| Measure | Result |
| --- | ---: |
| Canonical questions checked | 1,217 |
| Unique question IDs checked | 1,217 |
| Math-bearing fields checked | 9,905 |
| Expressions parsed | 23,773 |
| Remaining parser errors | 0 |

Every delimited expression in every canonical record was parsed with KaTeX 0.16.27 using `throwOnError: true` and `strict: "error"`. Raw dollar delimiters and unmatched approved delimiters were also rejected.

Zero parser errors remain.

