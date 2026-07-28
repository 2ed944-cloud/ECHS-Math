# Validation Report

Generated: 2026-07-28T03:49:13+00:00

**Overall result: FAIL**

This report validates the strict public release boundary. Student practice, exams, smart recommendations, and dashboard calculations use only the 896 independently verified public records; all 321 remaining records are preserved in the canonical teacher/admin bank and redacted in the public archive.

## Reconciled release counts

| Measure | Count |
| --- | ---: |
| Canonical questions | 1,217 |
| MCQ | 876 |
| FRQ | 341 |
| Student-ready | 896 |
| Teacher/archive restricted | 321 |
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
| 11 | Media validation | **PASS** | 0 | 315 |
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
  "jsonFilesParsed": 318,
  "canonicalQuestionObjects": 1217
}
```

### 2. ID uniqueness validation

**PASS**

```json
{
  "canonicalIds": 1217,
  "readyIds": 896,
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
  "studentReady": 896,
  "restricted": 321
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
  "readyFRQ": 235,
  "partCount": 731
}
```

### 8. FRQ-point validation

**PASS**

```json
{
  "totalFRQPoints": 2266
}
```

### 9. Mathematical verification validation

**PASS**

```json
{
  "readyMathematicallyVerified": 896,
  "correctionLogRecords": 633
}
```

### 10. KaTeX validation

**PASS**

```json
{
  "structurallyCheckedQuestions": 1217,
  "mathFields": 9080,
  "expressionsFound": 23088,
  "actualParserExpressions": 23088,
  "actualParserErrors": 0,
  "actualParserReport": "KATEX_AUDIT_REPORT.md (KaTeX 0.16.27)"
}
```

### 11. Media validation

**PASS**

```json
{
  "canonicalMediaReferences": 1899,
  "uniqueCanonicalMediaPaths": 1411,
  "actualMediaFiles": 1868
}
```

Warnings:
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1985-010-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1985-028-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1969-041-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1988-005-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1993-040-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1997-025-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1973-012-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1998-080-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1998-090-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1997-014-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1985-015-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1998-028-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1988-030-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-ab-mcq-1969-1998/apcalc-legacy-mcq-1997-088-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1988-045-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1969-013-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1969-039-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1985-033-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1998-092-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1969-012-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1969-034-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1973-037-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1985-020-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1997-002-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1973-044-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1973-045-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1969-027-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1998-023-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1985-022-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1998-012-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1998-006-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1973-005-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1998-027-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1993-013-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1998-019-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1997-017-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1998-009-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1969-026-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1985-032-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1988-037-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1988-043-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1998-091-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1988-019-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1985-001-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1988-024-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1997-085-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1998-084-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1997-084-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1998-089-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1993-011-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1969-019-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1985-006-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1973-034-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1969-016-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1993-038-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1988-039-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1988-003-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1969-043-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1973-032-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1993-042-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1969-032-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1998-088-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1973-010-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1998-011-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1973-024-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1985-016-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1997-078-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1998-022-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1985-009-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1985-045-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1998-018-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1969-011-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1969-017-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1973-041-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-ab-mcq-1969-1998/apcalc-legacy-mcq-1985-033-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1988-044-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1993-022-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1969-022-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1985-041-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1973-031-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1988-016-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1998-082-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1988-032-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1997-079-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1993-008-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1988-041-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1969-002-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1993-020-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1973-014-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1997-004-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1985-030-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1969-029-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1985-017-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1998-016-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1988-029-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1997-082-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1998-087-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1998-086-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1969-038-source-crop.svg
- Media reference absent from student manifest: media/question-crops/legacy-bc-mcq-1969-1998/apcalc-legacy-bc-mcq-1993-004-source-crop.svg

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
    "ap-calculus-ab": 552,
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
    "None": 35,
    "1": 57,
    "6": 175,
    "3": 96,
    "2": 95,
    "5": 140,
    "4": 90,
    "8": 114,
    "7": 36,
    "10": 32,
    "9": 26
  }
}
```

### 16. Topic mapping validation

**PASS**

```json
{
  "uniqueTopicCodes": 168
}
```

### 17. Lesson mapping validation

**PASS**

```json
{
  "lessonIds": 134
}
```

### 18. Student-ready gate validation

**PASS**

```json
{
  "gateFlagsChecked": 6272,
  "studentReady": 896,
  "publicPublicationApproved": 896
}
```

### 19. Archive filtering validation

**PASS**

```json
{
  "restrictedArchiveRecords": 321,
  "fullyRedactedRestrictedRecords": 321
}
```

### 20. Practice filtering validation

**PASS**

```json
{
  "studentIndexRecords": 896,
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
  "studentReadyPool": 896
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
  "textFilesScanned": 2468,
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
  "studentIndex": 896,
  "studentChunks": 896,
  "summaryTotal": 1217,
  "summaryReady": 896,
  "summaryRestricted": 321,
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
  "filesChecked": 94
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

The final structural pass rechecked approved delimiters, braces, and environments across all 1,217 canonical records. The detailed `KATEX_AUDIT_REPORT.md` records the actual KaTeX 0.16.27 parser run over 23,088 expressions with zero parser errors. External CDN availability is a deployment concern and is not treated as a mathematical-content failure.

## Production-readiness judgment

The release is not production-ready until the failures above are corrected.
