import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const base = process.env.ECHS_PREVIEW_URL || 'http://127.0.0.1:4173';
const out = process.env.ECHS_PREVIEW_OUTPUT || 'artifacts/ib-ai-4-12-v2';
const url = `${base}/lessons/ib-math-ai/unit-4/lessons/IB_AI_SL_4.12_inferential_statistics_hypotheses_significance_ECHS.html`;
await mkdir(out, { recursive: true });
const report = { checks: [], errors: [] };
const check = (name, pass, details = '') => {
  report.checks.push({ name, pass, details });
  if (!pass) report.errors.push(`${name}: ${details}`);
};
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage']
});

async function open(viewport) {
  const context = await browser.newContext({ viewport, serviceWorkers: 'block', reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && !/favicon|404/i.test(message.text())) errors.push(message.text());
  });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForFunction(() => document.body.dataset.rendered === '1' && LESSON_DATA?.lesson?.number === '4.12');
  return { context, page, errors };
}
async function gotoSlide(page, id) {
  const index = await page.evaluate(target => LESSON_DATA.slides.findIndex(slide => slide.id === target), id);
  if (index < 0) throw new Error(`Unknown slide ${id}`);
  await page.evaluate(i => localStorage.setItem('echs:ib-ai:u4:4.12:slide', String(i)), index);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(i => document.body.dataset.rendered === '1' && document.getElementById('progress-label')?.textContent?.startsWith(`${i + 1} /`), index);
}
async function clean(page) {
  return page.evaluate(() => {
    const stage = document.querySelector('.stage');
    const text = document.getElementById('app')?.innerText || '';
    const raw = ['\\(', '\\)', '\\[', '\\]'].reduce((n, token) => n + text.split(token).length - 1, 0);
    const badSvg = [...document.querySelectorAll('svg *')].some(el =>
      ['d','points','x','y','x1','x2','y1','y2','cx','cy','width','height','viewBox']
        .some(name => /(NaN|undefined|Infinity)/.test(el.getAttribute(name) || ''))
    );
    return {
      body: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
      stage: stage ? Math.max(0, stage.scrollWidth - stage.clientWidth) : 0,
      raw,
      math: document.querySelectorAll('[data-math-error="1"],[data-math-error="true"],.katex-error,.katex .merror').length,
      badSvg,
      loading: document.querySelectorAll('.lab-loading').length
    };
  });
}

try {
  const desktop = await open({ width: 1920, height: 1080 });
  const { page } = desktop;
  const counts = await page.evaluate(() => ({
    version: LESSON_DATA.version,
    slides: LESSON_DATA.slides.length,
    practice: LESSON_DATA.practice.length,
    exam: LESSON_DATA.exam.length,
    quiz: LESSON_DATA.quiz.length,
    levels: Object.fromEntries(['Foundation','Application','Reasoning','Challenge','HOT'].map(level => [level, LESSON_DATA.practice.filter(q => q.level === level).length]))
  }));
  check('release architecture', counts.version === '2.0.0' && counts.slides === 50 && counts.practice === 80 && counts.exam === 3 && counts.quiz === 10, JSON.stringify(counts));
  check('balanced practice', Object.values(counts.levels).every(value => value === 16), JSON.stringify(counts.levels));

  const ids = await page.evaluate(() => LESSON_DATA.slides.map(slide => slide.id));
  for (let i = 0; i < ids.length; i += 1) {
    if (i) {
      await page.click('#next-slide');
      await page.waitForFunction(n => document.getElementById('progress-label')?.textContent?.startsWith(`${n} /`), i + 1);
    }
    if (ids[i].endsWith('-lab')) await page.waitForSelector('.l412-lab-ui');
    const s = await clean(page);
    check(`slide ${i + 1} · ${ids[i]}`, s.body <= 2 && s.stage <= 2 && s.raw === 0 && s.math === 0 && !s.badSvg && s.loading === 0, JSON.stringify(s));
  }

  await gotoSlide(page, 'sampling-lab');
  const sampling = page.locator('[data-l412-lab="sampling"]');
  const before = await sampling.locator('[data-result]').innerText();
  await sampling.locator('[data-n]').fill('160');
  const after = await sampling.locator('[data-result]').innerText();
  check('sampling laboratory updates', before !== after && after.includes('n=160'), after);

  await gotoSlide(page, 'test-selector-lab');
  const selector = page.locator('[data-l412-lab="selector"]');
  await selector.locator('[data-response]').selectOption('categorical');
  await selector.locator('[data-structure]').selectOption('two-categorical');
  await selector.locator('[data-target]').selectOption('association');
  check('test selector identifies independence', (await selector.locator('[data-result]').innerText()).includes('Chi-square test for independence'));

  await gotoSlide(page, 'ti84-classroom');
  await page.click('[data-l412-ti-open="t-test"]');
  await page.waitForSelector('#l412-ti-dock.open');
  const dock = await page.evaluate(() => {
    const d = document.querySelector('#l412-ti-dock').getBoundingClientRect();
    const stage = document.querySelector('.stage').getBoundingClientRect();
    return { left: d.left, right: d.right, width: d.width, viewport: innerWidth, stageRight: stage.right, backdrops: document.querySelectorAll('.backdrop.show').length };
  });
  check('TI-84 docks beside lesson', dock.width >= 430 && dock.width <= 601 && dock.stageRight <= dock.left + 2 && Math.abs(dock.right - dock.viewport) <= 2 && dock.backdrops === 0, JSON.stringify(dock));
  for (const workflow of ['t-test','chi-ind','chi-gof']) {
    await page.click(`[data-ti-workflow="${workflow}"]`);
    check(`TI-84 workflow ${workflow}`, (await page.locator('.l412-ti-context').innerText()).length > 20);
  }
  await page.click('.l412-ti-close');

  for (const [route, selectorText] of [['practice','.question-shell'],['exam','.exam-task'],['quiz','.quiz-setup'],['mastery','.mastery-panel']]) {
    await page.click(`[data-route="${route}"]`);
    await page.waitForSelector(selectorText);
    const s = await clean(page);
    check(`${route} route renders`, s.body <= 2 && s.math === 0, JSON.stringify(s));
  }
  check('desktop console clean', desktop.errors.length === 0, desktop.errors.join('\n'));
  await desktop.context.close();

  const compact = await open({ width: 1366, height: 768 });
  await gotoSlide(compact.page, 'tails-visual');
  const compactState = await clean(compact.page);
  check('1366×768 viewport', compactState.body <= 2 && compactState.stage <= 2 && compactState.math === 0, JSON.stringify(compactState));
  check('compact console clean', compact.errors.length === 0, compact.errors.join('\n'));
  await compact.context.close();

  const mobile = await open({ width: 390, height: 844 });
  await mobile.page.evaluate(() => ECHS_L412_TI84.open('t-test'));
  await mobile.page.waitForSelector('#l412-ti-dock.open');
  const mobileDock = await mobile.page.evaluate(() => {
    const d = document.querySelector('#l412-ti-dock').getBoundingClientRect();
    return { left: d.left, right: d.right, width: d.width, viewport: innerWidth, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
  });
  check('mobile TI-84 fills viewport', Math.abs(mobileDock.left) <= 2 && Math.abs(mobileDock.right - mobileDock.viewport) <= 2 && Math.abs(mobileDock.width - mobileDock.viewport) <= 2 && mobileDock.overflow <= 2, JSON.stringify(mobileDock));
  check('mobile console clean', mobile.errors.length === 0, mobile.errors.join('\n'));
  await mobile.context.close();
} finally {
  await browser.close();
}

await writeFile(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ checks: report.checks.length, errors: report.errors.length }, null, 2));
if (report.errors.length) {
  report.errors.forEach(error => console.error(`ERROR: ${error}`));
  process.exit(1);
}
