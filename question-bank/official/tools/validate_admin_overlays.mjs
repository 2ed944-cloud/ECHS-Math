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

function normaliseOverlayText(value) {
  return typeof value === "string" ? value.replace(/\\n/g, "\n") : value;
}

function isObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function mergeObjects(base, patch) {
  const out = isObject(base) ? { ...base } : {};
  for (const [key, value] of Object.entries(patch ?? {})) {
    out[key] = isObject(value) ? mergeObjects(out[key], value) : value;
  }
  return out;
}

function walkStrings(value, field = "") {
  if (typeof value === "string") return [{ field, text: normaliseOverlayText(value) }];
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
    expressions.push({ expression: text.slice(token.index + token.open.length, end).trim(), displayMode: token.display });
    cursor = end + token.close.length;
  }
  for (const close of ["\\)", "\\]"]) {
    const opens = close === "\\)" ? (text.match(/\\\(/g) ?? []).length : (text.match(/\\\[/g) ?? []).length;
    const closes = text.split(close).length - 1;
    if (opens !== closes) errors.push(`Unbalanced ${close === "\\)" ? "inline" : "display"} delimiters: ${opens} opening, ${closes} closing`);
  }
  return { expressions, errors };
}

function questionsFromDirectory(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory)
    .filter((name) => /^chunk-\d+\.json$/.test(name))
    .sort()
    .flatMap((name) => readJson(path.join(directory, name)).questions ?? []);
}

function canonicalAnswerChoices(value) {
  return new Set(String(value ?? "").toUpperCase().match(/[A-E]/g) ?? []);
}

const canonicalQuestions = [
  ...questionsFromDirectory(path.join(dataDir, "questions")),
  ...questionsFromDirectory(path.join(officialDir, "admin", "data", "questions")),
];
const canonicalById = new Map(
  canonicalQuestions
    .filter((row) => row?.id)
    .map((row) => [String(row.id), row]),
);
const canonicalIds = new Set([
  ...canonicalById.keys(),
]);
const errors = [];
const warnings = [];
const overlayFiles = fs.readdirSync(dataDir)
  .filter((name) => /^admin-audit-overrides(?:-[0-9]{4}(?:-part[0-9]+)?|-1971-1975)?\.json$/.test(name))
  .sort();
const filesToCheck = overlayFiles.map((fileName) => ({
  fileName,
  filePath: path.join(dataDir, fileName),
  manualRepair: false,
  expectedCount: null,
}));
const manualRepairManifestPath = path.join(dataDir, "manual-repairs", "issue-3", "manifest.json");
let manualRepairBatchCount = 0;
if (fs.existsSync(manualRepairManifestPath)) {
  try {
    const manifest = readJson(manualRepairManifestPath);
    if (!Array.isArray(manifest?.batches)) {
      errors.push({ file: "manual-repairs/issue-3/manifest.json", issue: "Top-level batches must be an array." });
    } else {
      const manifestDir = path.dirname(manualRepairManifestPath);
      for (const [index, batch] of manifest.batches.entries()) {
        manualRepairBatchCount += 1;
        const relativeFile = String(batch?.file ?? "");
        const candidate = path.resolve(manifestDir, relativeFile);
        if (!relativeFile) {
          errors.push({ file: "manual-repairs/issue-3/manifest.json", record: index, issue: "Batch is missing file." });
          continue;
        }
        if (candidate !== manifestDir && !candidate.startsWith(`${manifestDir}${path.sep}`)) {
          errors.push({ file: "manual-repairs/issue-3/manifest.json", record: index, issue: `Batch file escapes the manifest directory: ${relativeFile}` });
          continue;
        }
        if (!fs.existsSync(candidate)) {
          errors.push({ file: "manual-repairs/issue-3/manifest.json", record: index, issue: `Batch file does not exist: ${relativeFile}` });
          continue;
        }
        filesToCheck.push({
          fileName: `manual-repairs/issue-3/${relativeFile}`,
          filePath: candidate,
          manualRepair: true,
          expectedCount: Number(batch?.questionCount),
        });
      }
    }
  } catch (error) {
    errors.push({ file: "manual-repairs/issue-3/manifest.json", issue: `Invalid JSON: ${String(error?.message ?? error)}` });
  }
} else {
  warnings.push("Issue 3 manual repair manifest was not found.");
}
const seen = new Map();
let recordCount = 0;
let manualRepairRecordCount = 0;
let mathFieldCount = 0;
let expressionCount = 0;

for (const fileSpec of filesToCheck) {
  const { fileName, filePath, manualRepair, expectedCount } = fileSpec;
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
  if (manualRepair && Number.isFinite(expectedCount) && payload.records.length !== expectedCount) {
    errors.push({ file: fileName, issue: `Manifest expects ${expectedCount} records but batch contains ${payload.records.length}.` });
  }
  if (manualRepair && !Array.isArray(payload?.sourceComparison?.pagesCompared)) {
    errors.push({ file: fileName, issue: "Manual repair batch must record sourceComparison.pagesCompared." });
  }
  for (const [index, record] of payload.records.entries()) {
    recordCount += 1;
    if (manualRepair) manualRepairRecordCount += 1;
    const id = String(record?.id ?? "");
    if (!id) {
      errors.push({ file: fileName, record: index, issue: "Record is missing id." });
      continue;
    }
    if (seen.has(id)) errors.push({ file: fileName, id, issue: `Duplicate overlay ID; first seen in ${seen.get(id)}.` });
    else seen.set(id, fileName);
    if (canonicalIds.size && !canonicalIds.has(id)) errors.push({ file: fileName, id, issue: "Overlay ID is not present in canonical/admin question chunks." });
    const expanded = mergeObjects(payload.defaults ?? {}, record);
    if (
      expanded.studentReady === true
      || expanded.studentEligible === true
      || expanded.studentAccessible === true
      || expanded.quality?.studentReadyGatePassed === true
    ) {
      errors.push({ file: fileName, id, issue: "Admin overlay must not promote a restricted record to student access." });
    }
    if (manualRepair) {
      const canonical = canonicalById.get(id);
      if (!String(expanded.prompt ?? "").trim()) errors.push({ file: fileName, id, issue: "Manual repair is missing a complete prompt." });
      if (!Array.isArray(expanded.choices) || expanded.choices.length !== 5) {
        errors.push({ file: fileName, id, issue: "Manual MCQ repair must contain exactly five answer choices." });
      } else {
        const choiceLabels = expanded.choices.map((choice) => String(choice?.label ?? "").toUpperCase());
        if (choiceLabels.join("") !== "ABCDE") errors.push({ file: fileName, id, issue: "Manual MCQ choice labels must be A through E in order." });
      }
      if (!/^[A-E]$/.test(String(expanded.answer ?? "").toUpperCase())) errors.push({ file: fileName, id, issue: "Manual MCQ repair must contain an A–E answer." });
      const canonicalChoices = canonicalAnswerChoices(canonical?.answer);
      if (canonicalChoices.size && !canonicalChoices.has(String(expanded.answer).toUpperCase())) {
        errors.push({ file: fileName, id, issue: `Manual repair answer ${expanded.answer} does not agree with canonical source key ${canonical.answer}.` });
      }
      const canonicalSourcePages = (canonical?.source?.sourcePages ?? []).map(String);
      if (!String(expanded.audit?.sourcePage ?? "").split(/[;,]/).map((value) => value.trim()).some((value) => canonicalSourcePages.includes(value))) {
        errors.push({ file: fileName, id, issue: `Manual repair source page does not match canonical provenance pages: ${canonicalSourcePages.join(", ")}.` });
      }
      if (!String(expanded.workedSolution ?? "").trim()) errors.push({ file: fileName, id, issue: "Manual repair is missing a worked solution." });
      if (!Array.isArray(expanded.commonMistakes) || expanded.commonMistakes.length < 1) errors.push({ file: fileName, id, issue: "Manual repair must document at least one common mistake." });
      if (!String(expanded.verificationStatus ?? "").includes("independently-verified")) errors.push({ file: fileName, id, issue: "Manual repair must record independent verification." });
      if (!Number.isInteger(expanded.classification?.primaryUnit)) errors.push({ file: fileName, id, issue: "Manual repair is missing an integer primaryUnit mapping." });
      if (!String(expanded.classification?.primaryTopic ?? "").trim()) errors.push({ file: fileName, id, issue: "Manual repair is missing primaryTopic mapping." });
      if (!String(expanded.classification?.topicCode ?? "").trim()) errors.push({ file: fileName, id, issue: "Manual repair is missing topicCode mapping." });
      if (!Array.isArray(expanded.classification?.lessonIds) || !expanded.classification.lessonIds.length) errors.push({ file: fileName, id, issue: "Manual repair is missing lessonIds mapping." });
      if (!expanded.quality?.transcriptionVerified || !expanded.quality?.answerVerified || !expanded.quality?.mathematicalVerificationPassed || !expanded.quality?.katexVerified || !expanded.quality?.mappingVerified) {
        errors.push({ file: fileName, id, issue: "Manual repair verification flags are incomplete." });
      }
      if (expanded.audit?.calculatorStatus !== "verified-no-calculator") errors.push({ file: fileName, id, issue: "Manual repair calculator status is not verified." });
      if (!Array.isArray(expanded.media) || !expanded.media.length) {
        errors.push({ file: fileName, id, issue: "Manual repair must link verified source media." });
      } else {
        for (const media of expanded.media) {
          const mediaPath = String(media?.path ?? "");
          const resolvedMediaPath = path.resolve(officialDir, mediaPath);
          if (!mediaPath || (resolvedMediaPath !== officialDir && !resolvedMediaPath.startsWith(`${officialDir}${path.sep}`))) {
            errors.push({ file: fileName, id, issue: `Invalid media path: ${mediaPath || "(missing)"}` });
          } else if (!fs.existsSync(resolvedMediaPath)) {
            errors.push({ file: fileName, id, issue: `Media file does not exist: ${mediaPath}` });
          } else if (path.extname(resolvedMediaPath).toLowerCase() === ".svg") {
            const svg = fs.readFileSync(resolvedMediaPath, "utf8");
            const href = svg.match(/<image\b[^>]*\bhref=["']([^"']+)["']/i)?.[1];
            if (href) {
              const linkedAsset = path.resolve(path.dirname(resolvedMediaPath), href);
              if (!fs.existsSync(linkedAsset)) {
                errors.push({ file: fileName, id, issue: `SVG media links a missing source asset: ${href}` });
              }
              const linkedPage = href.match(/page-0*([0-9]+)\.png$/i)?.[1];
              const auditedPages = String(expanded.audit?.sourcePage ?? "").split(/[;,]/).map((value) => Number(value.trim()));
              if (linkedPage && !auditedPages.includes(Number(linkedPage))) {
                errors.push({ file: fileName, id, issue: `SVG source page ${linkedPage} does not match audited source page ${expanded.audit?.sourcePage}.` });
              }
            }
          }
          if (!String(media?.alt ?? "").trim()) errors.push({ file: fileName, id, issue: `Media is missing alt text: ${mediaPath || "(missing path)"}` });
        }
      }
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

if (!filesToCheck.length) warnings.push("No admin overlay or manual repair files were found.");
if (!canonicalIds.size) warnings.push("Canonical IDs could not be loaded; ID membership checks were skipped.");
const result = {
  generatedAt,
  status: errors.length ? "FAIL" : "PASS",
  overlayFilesChecked: filesToCheck.length,
  manualRepairBatchesChecked: manualRepairBatchCount,
  overlayRecordsChecked: recordCount,
  manualRepairRecordsChecked: manualRepairRecordCount,
  uniqueOverlayIds: seen.size,
  canonicalIdsLoaded: canonicalIds.size,
  mathFieldsChecked: mathFieldCount,
  expressionsParsed: expressionCount,
  normalisation: "escaped-newlines-to-runtime-newlines",
  errors,
  warnings,
};
fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(path.join(reportDir, "ADMIN_OVERLAY_VALIDATION.json"), `${JSON.stringify(result, null, 2)}\n`);
const report = [
  "# Admin Audit Overlay Validation", "", `Generated: ${generatedAt}`, "", `**Result: ${result.status}**`, "",
  "| Measure | Result |", "| --- | ---: |", `| Overlay files checked | ${filesToCheck.length} |`,
  `| Manual repair batches checked | ${manualRepairBatchCount} |`,
  `| Overlay records checked | ${recordCount} |`, `| Unique overlay IDs | ${seen.size} |`,
  `| Canonical IDs loaded | ${canonicalIds.size} |`, `| Math-bearing fields checked | ${mathFieldCount} |`,
  `| KaTeX expressions parsed | ${expressionCount} |`, `| Errors | ${errors.length} |`, "",
  "Escaped overlay newlines are normalised exactly as they are in Teacher Studio before KaTeX parsing.", "",
  ...(errors.length ? ["## Errors", "", ...errors.slice(0, 300).map((item) => `- \`${item.file}\` ${item.id ? `\`${item.id}\` ` : ""}${item.field ? `\`${item.field}\` ` : ""}${item.issue}`), ""] : ["Zero JSON, duplicate-ID, access-gate, delimiter, or KaTeX parser errors remain.", ""]),
  ...(warnings.length ? ["## Warnings", "", ...warnings.map((item) => `- ${item}`), ""] : []),
].join("\n");
fs.writeFileSync(path.join(reportDir, "ADMIN_OVERLAY_VALIDATION.md"), `${report.replace(/\n+$/, "")}\n`);
console.log(JSON.stringify({ status: result.status, overlayFilesChecked: filesToCheck.length, manualRepairBatchesChecked: manualRepairBatchCount, overlayRecordsChecked: recordCount, manualRepairRecordsChecked: manualRepairRecordCount, expressionsParsed: expressionCount, errors: errors.length }, null, 2));
if (errors.length) {
  console.error(JSON.stringify(errors.slice(0, 100), null, 2));
  process.exit(1);
}
