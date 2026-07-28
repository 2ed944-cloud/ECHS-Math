# Validation Report

Generated: 2026-07-28T01:46:00+00:00

**Overall result: PASS WITH RESTRICTIONS**

This report validates the strict public release boundary. Student practice, exams, smart recommendations, and dashboard calculations use only the 52 independently verified public records; all 1165 remaining records are preserved in the canonical teacher/admin bank and redacted in the public archive.

## Reconciled release counts

| Measure | Count |
| --- | ---: |
| Canonical questions | 1,217 |
| MCQ | 876 |
| FRQ | 341 |
| Student-ready | 52 |
| Teacher/archive restricted | 1,165 |
| Correction records | 633 |
| Browser smoke cases | 12 |

## Validation matrix

| # | Validation | Result | Errors | Warnings |
| ---: | --- | --- | ---: | ---: |
| 1 | JSON schema validation | **PASS** | 0 | 0 |
| 2 | ID uniqueness validation | **PASS** | 0 | 0 |
| 3 | Source-reference validation | **PASS** | 0 | 0 |
| 4 | Question completeness validation | **PASS** | 0 | 0 |
| 5 | MCQ-choice validation | **PASS** | 0 | 0 |
| 6 | MCQ-answer validation | **PASS** | 0 | 0 |
| 7 | FRQ-part validation | **PASS** | 0 | 0 |
| 8 | FRQ-point validation | **PASS** | 0 | 0 |
| 9 | Mathematical verification validation | **PASS** | 0 | 0 |
| 10 | KaTeX validation | **PASS** | 0 | 0 |
| 11 | Media validation | **PASS** | 0 | 91 |
| 12 | Broken-path validation | **PASS** | 0 | 0 |
| 13 | Duplicate detection | **PASS** | 0 | 1 |
| 14 | Course mapping validation | **PASS** | 0 | 0 |
| 15 | Unit mapping validation | **PASS** | 0 | 0 |
| 16 | Topic mapping validation | **PASS** | 0 | 0 |
| 17 | Lesson mapping validation | **PASS** | 0 | 0 |
| 18 | Student-ready gate validation | **PASS** | 0 | 0 |
| 19 | Archive filtering validation | **PASS** | 0 | 0 |
| 20 | Practice filtering validation | **PASS** | 0 | 0 |
| 21 | Exam filtering validation | **PASS** | 0 | 0 |
| 22 | Dashboard attribution validation | **PASS** | 0 | 0 |
| 23 | Teacher-navigation separation validation | **PASS** | 0 | 0 |
| 24 | Student-navigation validation | **PASS** | 0 | 0 |
| 25 | GitHub path validation | **PASS** | 0 | 0 |
| 26 | Secret-pattern scan | **PASS** | 0 | 0 |
| 27 | Case-sensitivity validation | **PASS** | 0 | 0 |
| 28 | Count reconciliation | **PASS** | 0 | 0 |
| 29 | Portal lesson-link exact-filter validation | **PASS** | 0 | 0 |
| 30 | Administrative import hardening | **PASS** | 0 | 0 |
| 31 | Deployment tooling validation | **PASS** | 0 | 0 |
| 32 | Manifest validation | **PASS** | 0 | 0 |
| 33 | Checksum validation | **PASS** | 0 | 0 |
| 34 | Required report validation | **PASS** | 0 | 0 |
| 35 | Browser smoke testing | **PASS** | 0 | 0 |
| B | Local Chromium browser smoke tests | **PASS** | 0 | 0 |

## Detailed evidence

### 1. JSON schema validation

**PASS**

```json
{
  "jsonFilesParsed": 303,
  "canonicalQuestionObjects": 1217
}
```

### 2. ID uniqueness validation

**PASS**

```json
{
  "canonicalIds": 1217,
  "readyIds": 52,
  "archiveIds": 1217
}
```

### 3. Source-reference validation

**PASS**

```json
{
  "recordsWithPageReferences": 1164,
  "echsOriginalWithoutPage": 53,
  "warnings": 0
}
```

### 4. Question completeness validation

**PASS**

```json
{
  "studentReady": 52,
  "restricted": 1165
}
```

### 5. MCQ-choice validation

**PASS**

```json
{
  "readyMCQ": 42,
  "allFiveChoices": 42
}
```

### 6. MCQ-answer validation

**PASS**

```json
{
  "answersInChoiceSet": 42
}
```

### 7. FRQ-part validation

**PASS**

```json
{
  "readyFRQ": 10,
  "partCount": 29
}
```

### 8. FRQ-point validation

**PASS**

```json
{
  "totalFRQPoints": 56
}
```

### 9. Mathematical verification validation

**PASS**

```json
{
  "readyMathematicallyVerified": 52,
  "correctionLogRecords": 633
}
```

### 10. KaTeX validation

**PASS**

```json
{
  "structurallyCheckedQuestions": 1217,
  "mathFields": 6686,
  "expressionsFound": 14337,
  "actualParserExpressions": 14337,
  "actualParserErrors": 0,
  "actualParserReport": "KATEX_AUDIT_REPORT.md (KaTeX 0.16.27)"
}
```

### 11. Media validation

**PASS**

```json
{
  "canonicalMediaReferences": 1583,
  "uniqueCanonicalMediaPaths": 1095,
  "actualMediaFiles": 1868
}
```

Warnings:
- APCALC-AB-FRQ-1969-01: media entry without path
- APCALC-AB-FRQ-1969-03: media entry without path
- APCALC-AB-FRQ-1969-05: media entry without path
- APCALC-AB-FRQ-1969-06: media entry without path
- APCALC-AB-FRQ-1969-06: media entry without path
- APCALC-AB-FRQ-1969-07: media entry without path
- APCALC-AB-FRQ-1969-07: media entry without path
- APCALC-AB-FRQ-1970-01: media entry without path
- APCALC-AB-FRQ-1970-02: media entry without path
- APCALC-AB-FRQ-1970-02: media entry without path
- APCALC-AB-FRQ-1970-03: media entry without path
- APCALC-AB-FRQ-1970-04: media entry without path
- APCALC-AB-FRQ-1970-06: media entry without path
- APCALC-AB-FRQ-1970-06: media entry without path
- APCALC-AB-FRQ-1970-07: media entry without path
- APCALC-AB-FRQ-1971-01: media entry without path
- APCALC-AB-FRQ-1971-02: media entry without path
- APCALC-AB-FRQ-1971-03: media entry without path
- APCALC-AB-FRQ-1971-04: media entry without path
- APCALC-AB-FRQ-1971-05: media entry without path
- APCALC-AB-FRQ-1971-06: media entry without path
- APCALC-AB-FRQ-1971-07: media entry without path
- APCALC-AB-FRQ-1972-01: media entry without path
- APCALC-AB-FRQ-1972-02: media entry without path
- APCALC-AB-FRQ-1972-03: media entry without path
- APCALC-AB-FRQ-1972-04: media entry without path
- APCALC-AB-FRQ-1972-05: media entry without path
- APCALC-AB-FRQ-1972-06: media entry without path
- APCALC-AB-FRQ-1972-07: media entry without path
- APCALC-AB-FRQ-1973-01: media entry without path
- APCALC-AB-FRQ-1973-02: media entry without path
- APCALC-AB-FRQ-1973-03: media entry without path
- APCALC-AB-FRQ-1973-04: media entry without path
- APCALC-AB-FRQ-1973-05: media entry without path
- APCALC-AB-FRQ-1973-06: media entry without path
- APCALC-AB-FRQ-1973-07: media entry without path
- APCALC-AB-FRQ-1974-01: media entry without path
- APCALC-AB-FRQ-1974-02: media entry without path
- APCALC-AB-FRQ-1974-03: media entry without path
- APCALC-AB-FRQ-1974-04: media entry without path
- APCALC-AB-FRQ-1974-05: media entry without path
- APCALC-AB-FRQ-1974-06: media entry without path
- APCALC-AB-FRQ-1974-07: media entry without path
- APCALC-AB-FRQ-1975-01: media entry without path
- APCALC-AB-FRQ-1975-02: media entry without path
- APCALC-AB-FRQ-1975-03: media entry without path
- APCALC-AB-FRQ-1975-04: media entry without path
- APCALC-AB-FRQ-1975-05: media entry without path
- APCALC-AB-FRQ-1975-06: media entry without path
- APCALC-AB-FRQ-1975-07: media entry without path
- APCALC-AB-FRQ-1976-01: media entry without path
- APCALC-AB-FRQ-1976-02: media entry without path
- APCALC-AB-FRQ-1976-03: media entry without path
- APCALC-AB-FRQ-1976-04: media entry without path
- APCALC-AB-FRQ-1976-05: media entry without path
- APCALC-AB-FRQ-1976-06: media entry without path
- APCALC-AB-FRQ-1976-07: media entry without path
- APCALC-AB-FRQ-1977-01: media entry without path
- APCALC-AB-FRQ-1977-02: media entry without path
- APCALC-AB-FRQ-1977-03: media entry without path
- APCALC-AB-FRQ-1977-04: media entry without path
- APCALC-AB-FRQ-1977-05: media entry without path
- APCALC-AB-FRQ-1977-06: media entry without path
- APCALC-AB-FRQ-1977-07: media entry without path
- APCALC-AB-FRQ-1978-01: media entry without path
- APCALC-AB-FRQ-1978-02: media entry without path
- APCALC-AB-FRQ-1978-03: media entry without path
- APCALC-AB-FRQ-1978-04: media entry without path
- APCALC-AB-FRQ-1978-05: media entry without path
- APCALC-AB-FRQ-1978-06: media entry without path
- APCALC-AB-FRQ-1978-07: media entry without path
- APCALC-AB-FRQ-1979-01: media entry without path
- APCALC-AB-FRQ-1979-02: media entry without path
- APCALC-AB-FRQ-1979-03: media entry without path
- APCALC-AB-FRQ-1979-04: media entry without path
- APCALC-AB-FRQ-1979-05: media entry without path
- APCALC-AB-FRQ-1979-06: media entry without path
- APCALC-AB-FRQ-1979-07: media entry without path
- APCALC-AB-FRQ-1980-01: media entry without path
- APCALC-AB-FRQ-1980-02: media entry without path
- APCALC-AB-FRQ-1980-03: media entry without path
- APCALC-AB-FRQ-1980-04: media entry without path
- APCALC-AB-FRQ-1980-05: media entry without path
- APCALC-AB-FRQ-1980-06: media entry without path
- APCALC-AB-FRQ-1980-07: media entry without path
- APCALC-LEGACY-MCQ-1985-033: media entry without path
- APCALC-LEGACY-MCQ-1993-040: media entry without path
- APCALC-LEGACY-MCQ-1997-011: media entry without path
- APCALC-LEGACY-MCQ-1997-088: media entry without path
- APCALC-LEGACY-MCQ-1998-009: media entry without path
- APCALC-LEGACY-MCQ-1998-023: media entry without path

### 12. Broken-path validation

**PASS**

```json
{
  "htmlFiles": 14,
  "localReferencesChecked": 131,
  "javascriptFilesSyntaxChecked": 8
}
```

### 13. Duplicate detection

**PASS**

```json
{
  "exactPromptDuplicateGroups": 6,
  "largestGroup": 3
}
```

Warnings:
- 6 exact normalized prompt group(s) retained with distinct permanent IDs/source contexts.

### 14. Course mapping validation

**PASS**

```json
{
  "mappedCourses": {
    "ap-calculus-ab": 22,
    "ap-precalculus": 19,
    "grade-9-pre-precalculus": 11
  }
}
```

### 15. Unit mapping validation

**PASS**

```json
{
  "units": {
    "6": 4,
    "4": 6,
    "5": 5,
    "7": 2,
    "1": 12,
    "2": 12,
    "3": 8,
    "8": 3
  }
}
```

### 16. Topic mapping validation

**PASS**

```json
{
  "uniqueTopicCodes": 39
}
```

### 17. Lesson mapping validation

**PASS**

```json
{
  "lessonIds": 48
}
```

### 18. Student-ready gate validation

**PASS**

```json
{
  "gateFlagsChecked": 364,
  "studentReady": 52,
  "publicPublicationApproved": 52
}
```

### 19. Archive filtering validation

**PASS**

```json
{
  "restrictedArchiveRecords": 1165,
  "fullyRedactedRestrictedRecords": 1165
}
```

### 20. Practice filtering validation

**PASS**

```json
{
  "studentIndexRecords": 52,
  "exactFilterParameters": [
    "course",
    "unit",
    "topicCode",
    "lesson",
    "learningObjective",
    "skill"
  ]
}
```

### 21. Exam filtering validation

**PASS**

```json
{
  "examSource": "student question-index only",
  "studentReadyPool": 52
}
```

### 22. Dashboard attribution validation

**PASS**

```json
{
  "attemptScope": "valid student-ready IDs only"
}
```

### 23. Teacher-navigation separation validation

**PASS**

```json
{
  "studentPagesChecked": [
    "index.html",
    "archive.html",
    "practice.html",
    "exam.html",
    "dashboard.html"
  ],
  "adminRoute": "question-bank/official/admin/",
  "staticAuthenticationLimitationDocumented": true
}
```

### 24. Student-navigation validation

**PASS**

```json
{
  "requiredNavigation": [
    "Home",
    "Official Archive",
    "Tutor Practice",
    "Exam Simulator",
    "Dashboard",
    "ECHS Portal"
  ]
}
```

### 25. GitHub path validation

**PASS**

```json
{
  "filesOver95MiB": 0,
  "caseInsensitiveCollisions": 0
}
```

### 26. Secret-pattern scan

**PASS**

```json
{
  "textFilesScanned": 2444,
  "secretPatternHits": 0
}
```

### 27. Case-sensitivity validation

**PASS**

```json
{
  "caseSensitiveReferencesChecked": 131,
  "errors": 0
}
```

### 28. Count reconciliation

**PASS**

```json
{
  "canonicalIndex": 1217,
  "canonicalChunks": 1217,
  "archiveIndex": 1217,
  "archiveChunks": 1217,
  "auditRows": 1217,
  "studentIndex": 52,
  "studentChunks": 52,
  "summaryTotal": 1217,
  "summaryReady": 52,
  "summaryRestricted": 1165,
  "correctionRecords": 633
}
```

### 29. Portal lesson-link exact-filter validation

**PASS**

```json
{
  "parametersEmitted": [
    "course",
    "unit",
    "topicCode",
    "lesson",
    "autostart"
  ],
  "fallback": "none"
}
```

### 30. Administrative import hardening

**PASS**

```json
{
  "importPromotionAllowed": false,
  "adminToolCopies": 3
}
```

### 31. Deployment tooling validation

**PASS**

```json
{
  "mode": "deployed-repository",
  "powerShellFilesStaticallyChecked": 6,
  "installerVersion": "not-applicable",
  "ambiguousVariableColonCheck": true
}
```

### 32. Manifest validation

**PASS**

```json
{
  "webManifest": "manifest.json",
  "name": "ECHS Mathematics Learning Platform",
  "icons": 2
}
```

### 33. Checksum validation

**PASS**

```json
{
  "algorithm": "SHA-256",
  "filesChecked": 86
}
```

### 34. Required report validation

**PASS**

```json
{
  "requiredReports": 13,
  "present": 13
}
```

### 35. Browser smoke testing

**PASS**

```json
{
  "generatedAt": "2026-07-24T21:34:03.075Z",
  "canonicalCount": 1217,
  "studentReadyCount": 52,
  "restrictedCount": 1165,
  "cases": 12,
  "passed": 12,
  "failed": 0,
  "errors": 0,
  "warnings": 0,
  "pageErrors": [],
  "results": [
    {
      "name": "Student home and navigation",
      "status": "PASS",
      "detail": {
        "stats": "52 | Student-ready questions | 42 | Verified MCQ | 10 | Verified FRQ | 1,165 | Restricted archive records",
        "labels": [
          "Home",
          "Official Archive",
          "Tutor Practice",
          "Exam Simulator",
          "Dashboard",
          "ECHS Portal"
        ]
      }
    },
    {
      "name": "Archive count reconciliation",
      "status": "PASS",
      "detail": {
        "stats": "1,217 | Canonical archive records | 52 | Student Ready | 1,165 | Teacher/archive only | 328 | Incomplete source"
      }
    },
    {
      "name": "Ready archive record opens verified content",
      "status": "PASS",
      "detail": {
        "id": "ECHS-APCALC-ORIGINAL-CALC-U1-001",
        "detailCharacters": 438
      }
    },
    {
      "name": "Restricted archive record remains redacted",
      "status": "PASS",
      "detail": {
        "id": "APCALC-AB-FRQ-1969-01",
        "redacted": true
      }
    },
    {
      "name": "Direct ready-question practice",
      "status": "PASS",
      "detail": {
        "id": "ECHS-APCALC-ORIGINAL-CALC-U1-001",
        "choices": 5,
        "archiveHref": "archive.html?id=ECHS-APCALC-ORIGINAL-CALC-U1-001"
      }
    },
    {
      "name": "Exact lesson filtering",
      "status": "PASS",
      "detail": {
        "lesson": "APCALC-1.6",
        "loadedId": "ECHS-APCALC-ORIGINAL-CALC-U1-001",
        "eligibleQuestions": 1
      }
    },
    {
      "name": "Exact lesson zero-result honesty",
      "status": "PASS",
      "detail": {
        "noFallback": true
      }
    },
    {
      "name": "Student-ready-only exam build",
      "status": "PASS",
      "detail": {
        "records": 52,
        "allReady": true
      }
    },
    {
      "name": "Dashboard valid-attempt boundary",
      "status": "PASS",
      "detail": {
        "validIds": 52,
        "allReady": true,
        "lessonPanel": true
      }
    },
    {
      "name": "Admin Teacher Studio full-record inspection",
      "status": "PASS",
      "detail": {
        "canonicalRecords": 1217
      }
    },
    {
      "name": "Admin import promotion boundary",
      "status": "PASS",
      "detail": {
        "boundaryVisible": true
      }
    },
    {
      "name": "Stable teacher URL redirect",
      "status": "PASS",
      "detail": {
        "target": "admin/teacher.html"
      }
    }
  ]
}
```

### B. Local Chromium browser smoke tests

**PASS**

```json
{
  "generatedAt": "2026-07-24T21:34:03.075Z",
  "canonicalCount": 1217,
  "studentReadyCount": 52,
  "restrictedCount": 1165,
  "cases": 12,
  "passed": 12,
  "failed": 0,
  "errors": 0,
  "warnings": 0,
  "pageErrors": [],
  "results": [
    {
      "name": "Student home and navigation",
      "status": "PASS",
      "detail": {
        "stats": "52 | Student-ready questions | 42 | Verified MCQ | 10 | Verified FRQ | 1,165 | Restricted archive records",
        "labels": [
          "Home",
          "Official Archive",
          "Tutor Practice",
          "Exam Simulator",
          "Dashboard",
          "ECHS Portal"
        ]
      }
    },
    {
      "name": "Archive count reconciliation",
      "status": "PASS",
      "detail": {
        "stats": "1,217 | Canonical archive records | 52 | Student Ready | 1,165 | Teacher/archive only | 328 | Incomplete source"
      }
    },
    {
      "name": "Ready archive record opens verified content",
      "status": "PASS",
      "detail": {
        "id": "ECHS-APCALC-ORIGINAL-CALC-U1-001",
        "detailCharacters": 438
      }
    },
    {
      "name": "Restricted archive record remains redacted",
      "status": "PASS",
      "detail": {
        "id": "APCALC-AB-FRQ-1969-01",
        "redacted": true
      }
    },
    {
      "name": "Direct ready-question practice",
      "status": "PASS",
      "detail": {
        "id": "ECHS-APCALC-ORIGINAL-CALC-U1-001",
        "choices": 5,
        "archiveHref": "archive.html?id=ECHS-APCALC-ORIGINAL-CALC-U1-001"
      }
    },
    {
      "name": "Exact lesson filtering",
      "status": "PASS",
      "detail": {
        "lesson": "APCALC-1.6",
        "loadedId": "ECHS-APCALC-ORIGINAL-CALC-U1-001",
        "eligibleQuestions": 1
      }
    },
    {
      "name": "Exact lesson zero-result honesty",
      "status": "PASS",
      "detail": {
        "noFallback": true
      }
    },
    {
      "name": "Student-ready-only exam build",
      "status": "PASS",
      "detail": {
        "records": 52,
        "allReady": true
      }
    },
    {
      "name": "Dashboard valid-attempt boundary",
      "status": "PASS",
      "detail": {
        "validIds": 52,
        "allReady": true,
        "lessonPanel": true
      }
    },
    {
      "name": "Admin Teacher Studio full-record inspection",
      "status": "PASS",
      "detail": {
        "canonicalRecords": 1217
      }
    },
    {
      "name": "Admin import promotion boundary",
      "status": "PASS",
      "detail": {
        "boundaryVisible": true
      }
    },
    {
      "name": "Stable teacher URL redirect",
      "status": "PASS",
      "detail": {
        "target": "admin/teacher.html"
      }
    }
  ]
}
```

## KaTeX verification note

The final structural pass rechecked approved delimiters, braces, and environments across all 1,217 canonical records. The detailed `KATEX_AUDIT_REPORT.md` records the actual KaTeX 0.16.27 parser run over 14,337 expressions with zero parser errors. External CDN availability is a deployment concern and is not treated as a mathematical-content failure.

## Production-readiness judgment

The repository passes for the strictly gated 52-question public student pool. The 1165 remaining records are deliberately not certified for student interaction and remain blocking review items for future promotion. Static GitHub Pages does not provide an authenticated boundary for the canonical/admin files, so a genuinely private teacher deployment still requires an authenticated host.
