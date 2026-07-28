#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const officialDir = path.dirname(scriptDir);
const repositoryDir = path.resolve(officialDir, "..", "..");
const reportsDir = path.join(officialDir, "reports");
const studentDir = path.join(officialDir, "data", "student");
const authorizationPath = path.join(
  officialDir,
  "data",
  "rights",
  "echs-ap-official-student-practice-2026-07-28.json",
);
const generatedAt = fs.existsSync(authorizationPath)
  ? readJson(authorizationPath).recordedAt
  : new Date().toISOString();
const port = Number(process.env.ECHS_SMOKE_PORT || 8765);
const smokeGroup = process.env.ECHS_SMOKE_GROUP || "all";
const baseUrl = `http://127.0.0.1:${port}/question-bank/official`;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

const studentIndex = readJson(path.join(studentDir, "question-index.json"));
const archiveIndex = readJson(path.join(studentDir, "archive-index.json"));
const readyMcq = studentIndex.find(
  (row) => row.type === "mcq" && (row.lessons ?? []).length,
);
const restricted = archiveIndex.find((row) => row.studentReady !== true);
const expected = {
  canonical: archiveIndex.length,
  ready: studentIndex.length,
  restricted: archiveIndex.length - studentIndex.length,
};

const server = spawn(
  "python3",
  ["-m", "http.server", String(port), "--bind", "127.0.0.1"],
  {
    cwd: repositoryDir,
    stdio: "ignore",
  },
);

async function waitForServer() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/index.html`);
      if (response.ok) return;
    } catch {
      // The server may still be starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Local HTTP server did not become ready.");
}

const executablePath = process.env.ECHS_CHROMIUM_PATH || undefined;
const chromiumLibraryPath = process.env.ECHS_CHROMIUM_LIB_PATH;
const fontConfigPath = process.env.ECHS_FONTCONFIG_PATH;
let browser;
let page;
let launchOptions;
const results = [];
const pageErrors = [];
const caseGroups = new Map([
  ["Student home and navigation", "1"],
  ["Archive count reconciliation", "1"],
  ["Ready archive record opens verified content", "1"],
  ["Restricted archive record remains redacted", "1"],
  ["Direct ready-question practice", "1"],
  ["Exact lesson filtering", "1"],
  ["Exact lesson zero-result honesty", "1"],
  ["Student-ready-only exam build", "2"],
  ["Dashboard valid-attempt boundary", "2"],
  ["Admin Teacher Studio full-record inspection", "3"],
  ["Admin import promotion boundary", "3"],
  ["Stable teacher URL redirect", "3"],
]);

async function runCase(name, action) {
  if (smokeGroup !== "all" && caseGroups.get(name) !== smokeGroup) return;
  try {
    const detail = await action();
    results.push({ name, status: "PASS", detail });
    console.log(`PASS ${name}`);
  } catch (error) {
    results.push({
      name,
      status: "FAIL",
      detail: { error: String(error?.stack ?? error) },
    });
    console.log(`FAIL ${name}: ${String(error?.message ?? error)}`);
  }
}

async function restartBrowser() {
  await browser?.close();
  browser = await chromium.launch(launchOptions);
  page = await browser.newPage();
  page.setDefaultTimeout(8_000);
  page.setDefaultNavigationTimeout(8_000);
  page.on("pageerror", (error) => pageErrors.push(String(error)));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (route) => route.abort());
}

try {
  await waitForServer();
  const browserHome = "/tmp/echs-browser-home";
  const browserCache = "/tmp/echs-browser-cache";
  fs.mkdirSync(browserHome, { recursive: true });
  fs.mkdirSync(browserCache, { recursive: true });
  launchOptions = {
    executablePath,
    headless: true,
    env: {
      ...process.env,
      HOME: browserHome,
      XDG_CACHE_HOME: browserCache,
      ...(chromiumLibraryPath
        ? { LD_LIBRARY_PATH: chromiumLibraryPath }
        : {}),
      ...(fontConfigPath ? { FONTCONFIG_PATH: fontConfigPath } : {}),
    },
    args: [
      "--ash-no-nudges",
      "--disable-domain-reliability",
      "--disable-print-preview",
      "--disk-cache-size=33554432",
      "--no-default-browser-check",
      "--no-pings",
      "--single-process",
      "--font-render-hinting=none",
      "--disable-features=AudioServiceOutOfProcess,IsolateOrigins,site-per-process",
      "--enable-features=SharedArrayBuffer",
      "--disable-gpu",
      "--disable-software-rasterizer",
      "--allow-running-insecure-content",
      "--disable-setuid-sandbox",
      "--disable-site-isolation-trials",
      "--disable-web-security",
      "--no-sandbox",
      "--no-zygote",
      "--disable-dev-shm-usage",
    ],
  };
  await restartBrowser();

  await runCase("Student home and navigation", async () => {
    await page.goto(`${baseUrl}/index.html`);
    await page.waitForFunction(
      (ready) =>
        document.querySelector("#stats")?.textContent?.includes(String(ready)),
      expected.ready,
    );
    const text = await page.locator("#stats").innerText();
    for (const value of [
      expected.ready,
      expected.restricted,
      studentIndex.filter((row) => row.type === "mcq").length,
      studentIndex.filter((row) => row.type === "frq").length,
    ]) {
      if (!text.replaceAll(",", "").includes(String(value))) {
        throw new Error(`Home statistics omit ${value}: ${text}`);
      }
    }
    const labels = await page.locator("nav .navLink").allTextContents();
    return { stats: text.replaceAll("\n", " | "), labels };
  });

  await runCase("Archive count reconciliation", async () => {
    await page.goto(`${baseUrl}/archive.html`);
    await page.waitForFunction(
      (canonical) =>
        document
          .querySelector("#archiveStats")
          ?.textContent?.includes(canonical.toLocaleString()),
      expected.canonical,
    );
    const text = await page.locator("#archiveStats").innerText();
    for (const value of [expected.canonical, expected.ready, expected.restricted]) {
      if (!text.replaceAll(",", "").includes(String(value))) {
        throw new Error(`Archive statistics omit ${value}: ${text}`);
      }
    }
    return { stats: text.replaceAll("\n", " | ") };
  });

  await runCase("Ready archive record opens verified content", async () => {
    await page.goto(
      `${baseUrl}/archive.html?id=${encodeURIComponent(readyMcq.id)}`,
    );
    await page.locator("#archiveDetail:not(.hidden)").waitFor();
    const detail = await page.locator("#archiveDetail").innerText();
    if (!detail.includes("Open verified practice")) {
      throw new Error("Ready archive record has no verified-practice action.");
    }
    return { id: readyMcq.id, detailCharacters: detail.length };
  });

  await runCase("Restricted archive record remains redacted", async () => {
    await page.goto(
      `${baseUrl}/archive.html?id=${encodeURIComponent(restricted.id)}`,
    );
    await page.locator("#archiveDetail:not(.hidden)").waitFor();
    const detail = await page.locator("#archiveDetail").innerText();
    if (!detail.includes("not yet student-ready")) {
      throw new Error("Restricted archive record did not render the redaction.");
    }
    if (detail.includes("Open verified practice")) {
      throw new Error("Restricted archive record exposes a practice action.");
    }
    return { id: restricted.id, redacted: true };
  });

  await runCase("Direct ready-question practice", async () => {
    await page.goto(
      `${baseUrl}/practice.html?id=${encodeURIComponent(readyMcq.id)}&autostart=1`,
    );
    await page.locator(".questionCard").waitFor();
    const choices = await page.locator(".choice").count();
    if (choices !== 5) throw new Error(`Expected 5 choices, found ${choices}.`);
    const archiveHref = await page
      .getByRole("link", { name: "Archive record" })
      .getAttribute("href");
    return { id: readyMcq.id, choices, archiveHref };
  });

  await runCase("Exact lesson filtering", async () => {
    const lesson = readyMcq.lessons[0];
    await page.goto(
      `${baseUrl}/practice.html?lesson=${encodeURIComponent(lesson)}`,
    );
    await page.locator("#filterStatus .pill.teal").waitFor();
    await page.locator("#sessionMode").selectOption("ordered");
    await page.locator("#start").click();
    await page.locator(".questionCard").waitFor();
    const loadedId = await page.evaluate(() => {
      const href = document
        .querySelector('a[href^="archive.html?id="]')
        ?.getAttribute("href");
      return href ? new URL(href, location.href).searchParams.get("id") : null;
    });
    const allowed = studentIndex
      .filter((row) => (row.lessons ?? []).includes(lesson))
      .map((row) => row.id);
    if (!allowed.includes(loadedId)) {
      throw new Error(`Loaded ${loadedId} outside exact lesson ${lesson}.`);
    }
    return { lesson, loadedId, eligibleQuestions: allowed.length };
  });

  await runCase("Exact lesson zero-result honesty", async () => {
    await page.goto(
      `${baseUrl}/practice.html?lesson=NO-SUCH-LESSON&autostart=1`,
    );
    await page
      .locator("#shell")
      .getByText("will not substitute unrelated unit questions")
      .waitFor();
    return { noFallback: true };
  });

  await runCase("Student-ready-only exam build", async () => {
    await page.goto(`${baseUrl}/exam.html`);
    await page.locator("#examInfo .pill").first().waitFor();
    const pool = await page.evaluate(async () => {
      const rows = await (
        await fetch("data/student/question-index.json")
      ).json();
      return {
        records: rows.length,
        allReady: rows.every((row) => row.studentReady === true),
      };
    });
    if (pool.records !== expected.ready) {
      throw new Error(`Exam fetched ${pool.records} rows, expected ${expected.ready}.`);
    }
    if (!pool.allReady) throw new Error("Exam source contains a restricted row.");
    return pool;
  });

  await runCase("Dashboard valid-attempt boundary", async () => {
    await page.goto(`${baseUrl}/dashboard.html`);
    await page.locator("#dashStats .stat").first().waitFor();
    const boundary = await page.evaluate(async () => {
      const rows = await (
        await fetch("data/student/question-index.json")
      ).json();
      return {
        validIds: rows.length,
        allReady: rows.every((row) => row.studentReady === true),
        lessonPanel: Boolean(document.querySelector("#lessonBars")),
      };
    });
    if (boundary.validIds !== expected.ready) {
      throw new Error(
        `Dashboard fetched ${boundary.validIds} rows, expected ${expected.ready}.`,
      );
    }
    if (!boundary.allReady || !boundary.lessonPanel) {
      throw new Error("Dashboard student boundary or lesson attribution is missing.");
    }
    return boundary;
  });

  await runCase("Admin Teacher Studio full-record inspection", async () => {
    await page.goto(`${baseUrl}/admin/teacher.html`);
    const records = await page.evaluate(async () => {
      const rows = await (await fetch("../data/question-index.json")).json();
      return rows.length;
    });
    if (records !== expected.canonical) {
      throw new Error(
        `Admin fetched ${records} rows, expected ${expected.canonical}.`,
      );
    }
    return { canonicalRecords: records };
  });

  await runCase("Admin import promotion boundary", async () => {
    await page.goto(`${baseUrl}/admin/import.html`);
    const body = await page.locator("body").innerText();
    if (
      !/review|student-ready gate|promotion/i.test(body) ||
      !/teacher|admin/i.test(body)
    ) {
      throw new Error("Import page does not state its review/promotion boundary.");
    }
    return { boundaryVisible: true };
  });

  await runCase("Stable teacher URL redirect", async () => {
    await page.goto(`${baseUrl}/teacher.html`);
    await page.waitForURL(/\/admin\/teacher\.html$/);
    return { target: "admin/teacher.html" };
  });
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}

const priorPath = path.join(reportsDir, "browser_smoke_results.json");
const prior =
  smokeGroup !== "all" && smokeGroup !== "1" && fs.existsSync(priorPath)
    ? readJson(priorPath)
    : { results: [], pageErrors: [] };
const merged = new Map(
  [...(prior.results ?? []), ...results].map((row) => [row.name, row]),
);
const mergedResults = [...caseGroups.keys()]
  .filter((name) => merged.has(name))
  .map((name) => merged.get(name));
const mergedPageErrors = [...(prior.pageErrors ?? []), ...pageErrors];
const failed = mergedResults.filter((row) => row.status === "FAIL").length;
const output = {
  generatedAt,
  canonicalCount: expected.canonical,
  studentReadyCount: expected.ready,
  restrictedCount: expected.restricted,
  cases: mergedResults.length,
  passed: mergedResults.length - failed,
  failed,
  errors: failed,
  warnings: mergedPageErrors.length,
  pageErrors: mergedPageErrors,
  results: mergedResults,
};
fs.writeFileSync(
  path.join(reportsDir, "browser_smoke_results.json"),
  `${JSON.stringify(output, null, 2)}\n`,
);
console.log(JSON.stringify(output, null, 2));
if (failed) process.exit(1);
