# Validation Report

Generated: 2026-07-24T18:26:17+00:00

**Overall result: PASS**

This report validates the gated v5 deployment. Student practice, exams, smart recommendations, and dashboard calculations use only the 352-question student boundary; all 865 remaining records are preserved in the full teacher/admin bank and redacted in the student archive.

## Reconciled release counts

| Measure | Count |
| --- | ---: |
| Canonical questions | 1,217 |
| MCQ | 876 |
| FRQ | 341 |
| Student-ready | 352 |
| Teacher/archive restricted | 865 |
| Correction records | 277 |
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
| 11 | Media validation | **PASS** | 0 | 0 |
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
| B | Local Chromium browser smoke tests | **PASS** | 0 | 0 |

## Detailed evidence

### 1. JSON schema validation

**PASS**

```json
{
  "jsonFilesParsed": 65,
  "canonicalQuestionObjects": 1217
}
```

### 2. ID uniqueness validation

**PASS**

```json
{
  "canonicalIds": 1217,
  "readyIds": 352,
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
  "studentReady": 352,
  "restricted": 865
}
```

### 5. MCQ-choice validation

**PASS**

```json
{
  "readyMCQ": 342,
  "allFiveChoices": 342
}
```

### 6. MCQ-answer validation

**PASS**

```json
{
  "answersInChoiceSet": 342
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
  "readyMathematicallyVerified": 352,
  "correctionLogRecords": 277
}
```

### 10. KaTeX validation

**PASS**

```json
{
  "structurallyCheckedQuestions": 352,
  "mathFields": 4858,
  "expressionsFound": 10778,
  "priorActualParserReport": "KATEX_AUDIT_REPORT.md (KaTeX 0.16.27)"
}
```

### 11. Media validation

**PASS**

```json
{
  "studentMediaReferences": 22,
  "uniqueStudentMediaPaths": 22,
  "actualMediaFiles": 1095
}
```

### 12. Broken-path validation

**PASS**

```json
{
  "htmlFiles": 11,
  "localReferencesChecked": 108,
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
    "ap-calculus-ab": 317,
    "ap-calculus-bc": 5,
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
    "None": 32,
    "1": 34,
    "6": 78,
    "3": 41,
    "2": 49,
    "5": 46,
    "4": 27,
    "8": 36,
    "7": 8,
    "10": 1
  }
}
```

### 16. Topic mapping validation

**PASS**

```json
{
  "uniqueTopicCodes": 70
}
```

### 17. Lesson mapping validation

**PASS**

```json
{
  "lessonIds": 86
}
```

### 18. Student-ready gate validation

**PASS**

```json
{
  "gateFlagsChecked": 2464,
  "studentReady": 352
}
```

### 19. Archive filtering validation

**PASS**

```json
{
  "restrictedArchiveRecords": 865,
  "fullyRedactedRestrictedRecords": 865
}
```

### 20. Practice filtering validation

**PASS**

```json
{
  "studentIndexRecords": 352,
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
  "studentReadyPool": 352
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
  "textFilesScanned": 1224,
  "secretPatternHits": 0
}
```

### 27. Case-sensitivity validation

**PASS**

```json
{
  "caseSensitiveReferencesChecked": 108,
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
  "studentIndex": 352,
  "studentChunks": 352,
  "summaryTotal": 1217,
  "summaryReady": 352,
  "summaryRestricted": 865,
  "correctionRecords": 277
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
  "mode": "release-package",
  "powerShellFilesStaticallyChecked": 9,
  "installerVersion": "5.0.0"
}
```

### B. Local Chromium browser smoke tests

**PASS**

```json
{
  "cases": 12,
  "passed": 12,
  "failed": 0,
  "errors": 0,
  "warnings": 0,
  "results": [
    {
      "name": "Student home and navigation",
      "status": "PASS",
      "detail": {
        "stats": "352 | Student-ready questions | 342 | Verified MCQ | 10 | Verified FRQ | 865 | Restricted archive records"
      }
    },
    {
      "name": "Archive count reconciliation",
      "status": "PASS",
      "detail": {
        "stats": "1,217 | Canonical archive records | 352 | Student Ready | 865 | Teacher/archive only | 331 | Incomplete source"
      }
    },
    {
      "name": "Ready archive record opens verified content",
      "status": "PASS",
      "detail": {
        "id": "APCALC-LEGACY-MCQ-1969-001",
        "detailCharacters": 376
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
        "id": "APCALC-LEGACY-MCQ-1969-001",
        "choices": 5,
        "archiveHref": "archive.html?id=APCALC-LEGACY-MCQ-1969-001"
      }
    },
    {
      "name": "Exact lesson filtering",
      "status": "PASS",
      "detail": {
        "lesson": "APCALC-6.9",
        "choiceButtons": 5
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
        "blueprint": "Unit 6",
        "requested": "5 MCQ + 1 FRQ"
      }
    },
    {
      "name": "Dashboard valid-attempt and lesson attribution",
      "status": "PASS",
      "detail": {
        "lessonAttributionPanel": true
      }
    },
    {
      "name": "Admin Teacher Studio full-record inspection",
      "status": "PASS",
      "detail": {
        "canonicalRecords": 1217,
        "restrictedFullInspection": true
      }
    },
    {
      "name": "Admin import promotion boundary",
      "status": "PASS",
      "detail": {
        "promotionBoundaryVisible": true
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

The final structural pass above rechecked approved delimiters, braces, and environments across the gated records. The detailed `KATEX_AUDIT_REPORT.md` records the prior actual KaTeX 0.16.27 parser run over 10,795 expressions with zero parser errors. External CDN availability is a deployment concern and is not treated as a mathematical-content failure.

## Production-readiness judgment

The repository is production-ready for the gated 352-question student pool. The 865 remaining records are deliberately not certified for student interaction and remain blocking review items only for future promotion, not for this release.
