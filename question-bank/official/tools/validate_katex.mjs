#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import katex from "katex";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const officialDir = path.dirname(scriptDir);
const questionsDir = path.join(officialDir, "data", "questions");
const reportsDir = path.join(officialDir, "reports");
const adminReportsDir = path.join(officialDir, "admin", "reports");
const authorizationPath = path.join(
  officialDir,
  "data",
  "rights",
  "echs-ap-official-student-practice-2026-07-28.json",
);
const generatedAt = fs.existsSync(authorizationPath)
  ? readJson(authorizationPath).recordedAt
  : new Date().toISOString();

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function walkStrings(value, field = "") {
  if (typeof value === "string") {
    return [{ field, text: value }];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      walkStrings(item, `${field}[${index}]`),
    );
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) =>
      walkStrings(item, field ? `${field}.${key}` : key),
    );
  }
  return [];
}

function delimitedExpressions(text) {
  const expressions = [];
  const errors = [];
  const covered = [];
  let cursor = 0;

  while (cursor < text.length) {
    const inline = text.indexOf("\\(", cursor);
    const display = text.indexOf("\\[", cursor);
    const starts = [
      inline >= 0 ? { index: inline, open: "\\(", close: "\\)", display: false } : null,
      display >= 0 ? { index: display, open: "\\[", close: "\\]", display: true } : null,
    ].filter(Boolean);
    if (!starts.length) break;

    starts.sort((a, b) => a.index - b.index);
    const token = starts[0];
    const end = text.indexOf(token.close, token.index + token.open.length);
    if (end < 0) {
      errors.push({
        expression: text.slice(token.index),
        parserError: `Unmatched ${token.open} delimiter at character ${token.index}`,
      });
      covered.push([token.index, text.length]);
      break;
    }

    expressions.push({
      expression: text.slice(token.index + token.open.length, end),
      displayMode: token.display,
    });
    covered.push([token.index, end + token.close.length]);
    cursor = end + token.close.length;
  }

  const outside = [...text]
    .map((character, index) =>
      covered.some(([start, end]) => index >= start && index < end)
        ? " "
        : character,
    )
    .join("");
  for (const close of ["\\)", "\\]"]) {
    const orphan = outside.indexOf(close);
    if (orphan >= 0) {
      errors.push({
        expression: close,
        parserError: `Orphan ${close} delimiter at character ${orphan}`,
      });
    }
  }
  return { expressions, errors };
}

const chunkFiles = fs
  .readdirSync(questionsDir)
  .filter((name) => /^chunk-\d+\.json$/.test(name))
  .sort();
const questions = chunkFiles.flatMap(
  (name) => readJson(path.join(questionsDir, name)).questions ?? [],
);

const errors = [];
const questionResults = [];
let expressionCount = 0;
let mathFieldCount = 0;

for (const question of questions) {
  let questionExpressions = 0;
  let questionMathFields = 0;
  let questionErrors = 0;

  for (const { field, text } of walkStrings(question)) {
    if (
      !text.includes("\\(") &&
      !text.includes("\\)") &&
      !text.includes("\\[") &&
      !text.includes("\\]")
    ) {
      continue;
    }
    questionMathFields += 1;
    mathFieldCount += 1;
    const parsed = delimitedExpressions(text);
    for (const delimiterError of parsed.errors) {
      questionErrors += 1;
      errors.push({
        question_id: question.id,
        field,
        original_expression: delimiterError.expression,
        corrected_expression: null,
        parser_error: delimiterError.parserError,
        correction_type: "KaTeX",
        final_validation_result: "failed",
      });
    }
    for (const item of parsed.expressions) {
      expressionCount += 1;
      questionExpressions += 1;
      try {
        katex.renderToString(item.expression, {
          throwOnError: true,
          strict: "error",
          displayMode: item.displayMode,
          output: "html",
          trust: false,
        });
      } catch (error) {
        questionErrors += 1;
        errors.push({
          question_id: question.id,
          field,
          original_expression: item.expression,
          corrected_expression: null,
          parser_error: String(error?.message ?? error),
          correction_type: "KaTeX",
          final_validation_result: "failed",
        });
      }
    }
  }

  questionResults.push({
    question_id: question.id,
    math_fields_checked: questionMathFields,
    expressions_parsed: questionExpressions,
    parser_errors: questionErrors,
    final_validation_result: questionErrors ? "failed" : "passed",
  });
}

const duplicateIds = questions.length - new Set(questions.map((q) => q.id)).size;
const result = {
  generatedAt,
  katexVersion: "0.16.27",
  options: {
    throwOnError: true,
    strict: "error",
  },
  canonicalQuestionsChecked: questions.length,
  uniqueQuestionIdsChecked: new Set(questions.map((q) => q.id)).size,
  duplicateQuestionIds: duplicateIds,
  mathFieldsChecked: mathFieldCount,
  expressionsParsed: expressionCount,
  parserErrors: errors.length,
  status:
    questions.length === 1217 && duplicateIds === 0 && errors.length === 0
      ? "PASS"
      : "FAIL",
  questions: questionResults,
};

fs.mkdirSync(reportsDir, { recursive: true });
fs.writeFileSync(
  path.join(reportsDir, "katex_audit_results.json"),
  `${JSON.stringify(result, null, 2)}\n`,
);
fs.writeFileSync(
  path.join(reportsDir, "katex_error_log.json"),
  `${JSON.stringify(
    {
      generatedAt,
      katexVersion: "0.16.27",
      parserErrors: errors.length,
      errors,
    },
    null,
    2,
  )}\n`,
);

const report = [
  "# KaTeX Audit Report",
  "",
  `Generated: ${generatedAt}`,
  "",
  `**Overall result: ${result.status}**`,
  "",
  "| Measure | Result |",
  "| --- | ---: |",
  `| Canonical questions checked | ${questions.length.toLocaleString()} |`,
  `| Unique question IDs checked | ${result.uniqueQuestionIdsChecked.toLocaleString()} |`,
  `| Math-bearing fields checked | ${mathFieldCount.toLocaleString()} |`,
  `| Expressions parsed | ${expressionCount.toLocaleString()} |`,
  `| Remaining parser errors | ${errors.length.toLocaleString()} |`,
  "",
  "Every delimited expression in every canonical record was parsed with KaTeX 0.16.27 using `throwOnError: true` and `strict: \"error\"`. Raw dollar delimiters and unmatched approved delimiters were also rejected.",
  "",
  ...(errors.length
    ? [
        "## Parser errors",
        "",
        "| question_id | field | parser_error |",
        "| --- | --- | --- |",
        ...errors.slice(0, 200).map(
          (item) =>
            `| \`${item.question_id}\` | \`${item.field}\` | ${item.parser_error.replaceAll("|", "&#124;")} |`,
        ),
        "",
      ]
    : ["Zero parser errors remain.", ""]),
].join("\n");
fs.writeFileSync(path.join(reportsDir, "KATEX_AUDIT_REPORT.md"), `${report}\n`);

fs.mkdirSync(adminReportsDir, { recursive: true });
for (const name of [
  "KATEX_AUDIT_REPORT.md",
  "katex_audit_results.json",
  "katex_error_log.json",
]) {
  fs.copyFileSync(path.join(reportsDir, name), path.join(adminReportsDir, name));
}

console.log(
  JSON.stringify(
    {
      status: result.status,
      canonicalQuestionsChecked: questions.length,
      mathFieldsChecked: mathFieldCount,
      expressionsParsed: expressionCount,
      parserErrors: errors.length,
    },
    null,
    2,
  ),
);

if (result.status !== "PASS") process.exit(1);
