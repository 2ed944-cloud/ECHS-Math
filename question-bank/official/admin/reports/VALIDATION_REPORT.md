# Validation Report

Generated: 2026-07-28T03:26:45+00:00

**Overall result: FAIL**

This report validates the strict public release boundary. Student practice, exams, smart recommendations, and dashboard calculations use only the 722 independently verified public records; all 495 remaining records are preserved in the canonical teacher/admin bank and redacted in the public archive.

## Reconciled release counts

| Measure | Count |
| --- | ---: |
| Canonical questions | 1,217 |
| MCQ | 876 |
| FRQ | 341 |
| Student-ready | 722 |
| Teacher/archive restricted | 495 |
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
| 11 | Media validation | **PASS** | 0 | 343 |
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
| 35 | Browser smoke testing | **FAIL** | 2 | 0 |
| B | Local Chromium browser smoke tests | **PASS** | 0 | 0 |

## Detailed evidence

### 1. JSON schema validation

**PASS**

```json
{
  "jsonFilesParsed": 315,
  "canonicalQuestionObjects": 1217
}
```

### 2. ID uniqueness validation

**PASS**

```json
{
  "canonicalIds": 1217,
  "readyIds": 722,
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
  "studentReady": 722,
  "restricted": 495
}
```

### 5. MCQ-choice validation

**PASS**

```json
{
  "readyMCQ": 661,
  "allFiveChoices": 661
}
```

### 6. MCQ-answer validation

**PASS**

```json
{
  "answersInChoiceSet": 661
}
```

### 7. FRQ-part validation

**PASS**

```json
{
  "readyFRQ": 61,
  "partCount": 168
}
```

### 8. FRQ-point validation

**PASS**

```json
{
  "totalFRQPoints": 561
}
```

### 9. Mathematical verification validation

**PASS**

```json
{
  "readyMathematicallyVerified": 722,
  "correctionLogRecords": 633
}
```

### 10. KaTeX validation

**PASS**

```json
{
  "structurallyCheckedQuestions": 1217,
  "mathFields": 9905,
  "expressionsFound": 23773,
  "actualParserExpressions": 23773,
  "actualParserErrors": 0,
  "actualParserReport": "KATEX_AUDIT_REPORT.md (KaTeX 0.16.27)"
}
```

### 11. Media validation

**PASS**

```json
{
  "canonicalMediaReferences": 1871,
  "uniqueCanonicalMediaPaths": 1395,
  "actualMediaFiles": 1868
}
```

Warnings:
- APCALC-AB-FRQ-1970-02: media entry without path
- APCALC-AB-FRQ-1970-02: media entry without path
- APCALC-AB-FRQ-1974-01: media entry without path
- APCALC-AB-FRQ-1974-03: media entry without path
- APCALC-AB-FRQ-1976-04: media entry without path
- APCALC-AB-FRQ-1976-07: media entry without path
- APCALC-AB-FRQ-1977-04: media entry without path
- APCALC-AB-FRQ-1977-05: media entry without path
- APCALC-AB-FRQ-1978-01: media entry without path
- APCALC-AB-FRQ-1978-02: media entry without path
- APCALC-AB-FRQ-1978-03: media entry without path
- APCALC-AB-FRQ-1978-04: media entry without path
- APCALC-AB-FRQ-1978-05: media entry without path
- APCALC-AB-FRQ-1978-06: media entry without path
- APCALC-AB-FRQ-1978-07: media entry without path
- APCALC-AB-FRQ-1979-01: media entry without path
- APCALC-AB-FRQ-1979-02: media entry without path
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
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1997-084-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1997-086-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1969-008-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1973-031-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1985-001-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1973-040-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1969-038-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1993-032-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1998-085-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1969-001-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1969-029-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1993-008-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1969-040-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1985-011-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1969-015-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1993-019-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-ab-mcq-1969-1998/apcalc-legacy-mcq-1985-033-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1985-023-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1998-015-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1997-024-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1988-024-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1973-004-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1969-035-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1997-085-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1969-024-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1969-011-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1997-005-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1998-090-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1969-020-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1997-010-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1988-037-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1985-019-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1969-041-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1993-002-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1973-016-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1998-003-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1985-026-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1973-034-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1997-077-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1998-010-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1973-012-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1993-016-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1985-007-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1969-012-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1988-026-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1973-018-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1998-026-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1985-004-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1988-043-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1997-089-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1997-078-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1998-006-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1985-010-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1985-027-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1998-019-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1985-037-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1985-033-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1997-088-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1993-038-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1997-025-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1985-036-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1998-022-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1988-011-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1969-009-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1973-010-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1973-030-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1985-024-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1997-022-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1998-025-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1998-024-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1969-022-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1988-007-source-crop.svg

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
  "exactPromptDuplicateGroups": 9,
  "largestGroup": 3
}
```

Warnings:
- 9 exact normalized prompt group(s) retained with distinct permanent IDs/source contexts.

### 14. Course mapping validation

**PASS**

```json
{
  "mappedCourses": {
    "ap-calculus-ab": 378,
    "ap-calculus-bc": 314,
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
    "None": 34,
    "1": 52,
    "6": 165,
    "3": 76,
    "2": 78,
    "5": 99,
    "4": 58,
    "8": 74,
    "7": 29,
    "10": 32,
    "9": 25
  }
}
```

### 16. Topic mapping validation

**PASS**

```json
{
  "uniqueTopicCodes": 137
}
```

### 17. Lesson mapping validation

**PASS**

```json
{
  "lessonIds": 124
}
```

### 18. Student-ready gate validation

**PASS**

```json
{
  "gateFlagsChecked": 5054,
  "studentReady": 722,
  "publicPublicationApproved": 722
}
```

### 19. Archive filtering validation

**PASS**

```json
{
  "restrictedArchiveRecords": 495,
  "fullyRedactedRestrictedRecords": 495
}
```

### 20. Practice filtering validation

**PASS**

```json
{
  "studentIndexRecords": 722,
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
  "studentReadyPool": 722
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
  "textFilesScanned": 2463,
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
  "studentIndex": 722,
  "studentChunks": 722,
  "summaryTotal": 1217,
  "summaryReady": 722,
  "summaryRestricted": 495,
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
  "filesChecked": 91
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

**FAIL**

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

Errors:
- Browser smoke student-ready count is stale.
- Browser smoke restricted count is stale.

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

The final structural pass rechecked approved delimiters, braces, and environments across all 1,217 canonical records. The detailed `KATEX_AUDIT_REPORT.md` records the actual KaTeX 0.16.27 parser run over 23,773 expressions with zero parser errors. External CDN availability is a deployment concern and is not treated as a mathematical-content failure.

## Production-readiness judgment

The release is not production-ready until the failures above are corrected.
