#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import katex from "katex";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const officialDir = path.dirname(scriptDir);
const dataDir = path.join(officialDir, "data");
const reportDir = path.join(officialDir, "admin", "reports");
const generatedAt = new Date().toISOString();

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function walkStrings(value, field = "") {
  if (typeof value === "string") return [{ field, text: value }];
  if (Array.isArray(value)) return value.flatMap((item, index) => walkStrings(item, `${field}[${index}]`));
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) => walkStrings(item, field ? `${field}.${key}` : key));
  }
  return [];
}

function delimitedExpressions(text) {
  const expressions = [];
  const errors = [];
  let cursor = 0;
  while (cursor < text.length) {
    const inline = text.indexOf("\\(", cursor);
    const display = text.indexOf("\\[", cursor);
    const starts = [
      inline >= 0 ? { index: inline, open: "\\(", close: "\\)", display: false } : null,
      display >= 0 ? { index: display, open: "\\[", close: "\\]", display: true } : null,
    ].filter(Boolean).sort((a, b) => a.index - b.index);
    if (!starts.length) break;
    const token = starts[0];
    const end = text.indexOf(token.close, token.index + token.open.length);
    if (end < 0) {
      errors.push(`Unmatched ${token.open} delimiter at character ${token.index}`);
      break;
    }
    expressions.push({ expression: text.slice(token.index + token.open.length, end), displayMode: token.display });
    cursor = end + token.close.length;
  }
  for (const close of ["\\)", "\\]"]) {
    const opens = close === "\\)" ? (text.match(/\\\(/g) ?? []).length : (text.match(/\\\[/g) ?? []).length;
    const closes = text.split(close).length - 1;
    if (opens !== closes) errors.push(`Unbalanced ${close === "\\)" ? "inline" : "display"} delimiters: ${opens} opening, ${closes} closing`);
  }
  return { expressions, errors };
}

function questionIdsFromDirectory(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory)
    .filter((name) => /^chunk-\d+\.json$/.test(name))
    .sort()
    .flatMap((name) => readJson(path.join(directory, name)).questions ?? [])
    .map((row) => row?.id)
    .filter(Boolean);
}

const canonicalIds = new Set([
  ...questionIdsFromDirectory(path.join(dataDir, "questions")),
  ...questionIdsFromDirectory(path.join(officialDir, "admin", "data", "questions")),
]);
const overlayFiles = fs.readdirSync(dataDir)
  .filter((name) => /^admin-audit-overrides(?:-[0-9]{4}(?:-part[0-9]+)?|-1971-1975)?\.json$/.test(name))
  .sort();
const errors = [];
const warnings = [];
const seen = new Map();
let recordCount = 0;
let mathFieldCount = 0;
let expressionCount = 0;

for (const fileName of overlayFiles) {
  const filePath = path.join(dataDir, fileName);
  let payload;
  try {
    payload = readJson(filePath);
  } catch (error) {
    errors.push({ file: fileName, issue: `Invalid JSON: ${String(error?.message ?? error)}` });
    continue;
  }
  if (!Array.isArray(payload.records)) {
    errors.push({ file: fileName, issue: "Top-level records must be an array." });
    continue;
  }
  for (const [index, record] of payload.records.entries()) {
    recordCount += 1;
    const id = String(record?.id ?? "");
    if (!id) {
      errors.push({ file: fileName, record: index, issue: "Record is missing id." });
      continue;
    }
    if (seen.has(id)) errors.push({ file: fileName, id, issue: `Duplicate overlay ID; first seen in ${seen.get(id)}.` });
    else seen.set(id, fileName);
    if (canonicalIds.size && !canonicalIds.has(id)) errors.push({ file: fileName, id, issue: "Overlay ID is not present in canonical/admin question chunks." });
    const expanded = { ...(payload.defaults ?? {}), ...record };
    if (expanded.studentReady === true || expanded.studentEligible === true || expanded.studentAccessible === true) {
      errors.push({ file: fileName, id, issue: "Admin overlay must not promote a restricted record to student access." });
    }
    const labels = (record.parts ?? []).map((part) => String(part?.label ?? ""));
    if (labels.length !== new Set(labels).size) errors.push({ file: fileName, id, issue: "Duplicate part labels within question." });
    for (const { field, text } of walkStrings(record)) {
      if (!/[\\][(\[\])]/.test(text)) continue;
      mathFieldCount += 1;
      const parsed = delimitedExpressions(text);
      for (const issue of parsed.errors) errors.push({ file: fileName, id, field, issue });
      for (const item of parsed.expressions) {
        expressionCount += 1;
        try {
          katex.renderToString(item.expression, { throwOnError: true, strict: "error", displayMode: item.displayMode, output: "html", trust: false });
        } catch (error) {
          errors.push({ file: fileName, id, field, expression: item.expression, issue: String(error?.message ?? error) });
        }
      }
    }
  }
}

if (!overlayFiles.length) warnings.push("No admin overlay files were found.");
if (!canonicalIds.size) warnings.push("Canonical IDs could not be loaded; ID membership checks were skipped.");
const result = {
  generatedAt,
  status: errors.length ? "FAIL" : "PASS",
  overlayFilesChecked: overlayFiles.length,
  overlayRecordsChecked: recordCount,
  uniqueOverlayIds: seen.size,
  canonicalIdsLoaded: canonicalIds.size,
  mathFieldsChecked: mathFieldCount,
  expressionsParsed: expressionCount,
  errors,
  warnings,
};
fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(path.join(reportDir, "ADMIN_OVERLAY_VALIDATION.json"), `${JSON.stringify(result, null, 2)}\n`);
const report = [
  "# Admin Audit Overlay Validation", "", `Generated: ${generatedAt}`, "", `**Result: ${result.status}**`, "",
  "| Measure | Result |", "| --- | ---: |", `| Overlay files checked | ${overlayFiles.length} |`,
  `| Overlay records checked | ${recordCount} |`, `| Unique overlay IDs | ${seen.size} |`,
  `| Canonical IDs loaded | ${canonicalIds.size} |`, `| Math-bearing fields checked | ${mathFieldCount} |`,
  `| KaTeX expressions parsed | ${expressionCount} |`, `| Errors | ${errors.length} |`, "",
  ...(errors.length ? ["## Errors", "", ...errors.slice(0, 300).map((item) => `- \`${item.file}\` ${item.id ? `\`${item.id}\` ` : ""}${item.field ? `\`${item.field}\` ` : ""}${item.issue}`), ""] : ["Zero JSON, duplicate-ID, access-gate, delimiter, or KaTeX parser errors remain.", ""]),
  ...(warnings.length ? ["## Warnings", "", ...warnings.map((item) => `- ${item}`), ""] : []),
].join("\n");
fs.writeFileSync(path.join(reportDir, "ADMIN_OVERLAY_VALIDATION.md"), `${report}\n`);
console.log(JSON.stringify({ status: result.status, overlayFilesChecked: overlayFiles.length, overlayRecordsChecked: recordCount, expressionsParsed: expressionCount, errors: errors.length }, null, 2));
if (errors.length) {
  console.error(JSON.stringify(errors.slice(0, 100), null, 2));
  process.exit(1);
}
