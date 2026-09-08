import assert from 'node:assert/strict';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {mountInstitutionalLesson} from '../../js/lesson-runtime/renderer.mjs';

const root = fileURLToPath(new URL('../../',import.meta.url));
const require = createRequire(new URL('../../question-bank/official/tools/package.json',import.meta.url));
const {chromium} = require('playwright');
const output = process.env.ECHS_INSTITUTIONAL_LOADER_EVIDENCE || path.join(root,'artifacts/lesson-runtime');
await mkdir(output,{recursive:true});
const fixtureOrigin = 'https://echs-fixture.example.test';
const prefix = '/ECHS-Math/';
const base = fixtureOrigin + prefix + 'tools/lesson-runtime/fixtures/institutional-loader.html';
const types = {'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.json':'application/json','.css':'text/css','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf'};
const browser = await chromium.launch({headless:true,executablePath:process.env.ECHS_CHROMIUM_PATH || undefined});
const context = await browser.newContext({viewport:{width:1280,height:900}});
const externalRequests = [];
await context.route('**/*',async route => {
  const url = new URL(route.request().url());
  if (url.origin !== fixtureOrigin || !url.pathname.startsWith(prefix)) {externalRequests.push(url.href); return route.abort();}
  const file = path.resolve(root,decodeURIComponent(url.pathname.slice(prefix.length)));
  if (!file.startsWith(path.resolve(root) + path.sep)) return route.fulfill({status:403,body:''});
  try {await route.fulfill({status:200,contentType:types[path.extname(file)] || 'application/octet-stream',body:await readFile(file)});}
  catch {await route.fulfill({status:404,body:''});}
});
const page = await context.newPage(); page.setDefaultTimeout(10000);
const errors = []; page.on('pageerror',error => errors.push(error.message));
const checks = []; const pass = label => {checks.push(label); console.log('PASS ' + label);};
let navigation = 0;
async function open(scenario = 'allowed', suffix = '') {
  // A different query forces a fresh document: repeating an identical hash URL
  // can be a same-document navigation and retain a previous scenario's state.
  await page.goto(base + '?course=ap-calculus&unit=0&topic=1.7&accessKey=fixture%3Acontinuity&lessonKey=opaque%2Fkey&scenario=' + scenario + '&testCase=' + (++navigation) + suffix + '#slide=2');
  await page.waitForFunction(() => window.fixture?.ready);
}
const state = () => page.evaluate(() => ({error:fixture.error,mode:fixture.controller?.mode,index:fixture.controller?.slideIndex,
  configCalls:fixture.configCalls,apiCalls:fixture.apiCalls,abortCalls:fixture.abortCalls,bodyCancelled:fixture.bodyCancelled,
  finish:fixture.finishCalls,learning:fixture.learningCalls,storageWrites:fixture.storageWrites,stored:localStorage.length+sessionStorage.length,
  text:document.querySelector('#lesson').textContent,href:location.href}));
async function rejects(scenario, {network = true} = {}) {
  await open(scenario);
  const value = await state();
  assert.ok(value.error,scenario); assert.equal(value.mode,undefined,scenario);
  assert.equal(await page.locator('.echsDocument').count(),0,scenario);
  assert.ok(value.text.includes('Existing lesson'),scenario);
  assert.equal(value.text.includes('PRIVATE-FIXTURE-MARKER'),false,scenario);
  assert.equal(value.storageWrites,0,scenario); assert.equal(value.stored,0,scenario); assert.equal(value.learning,0,scenario);
  if (!network) assert.equal(value.apiCalls.length,0,scenario);
}
try {
  for (const flag of [false,undefined,'true',1]) {
    const win = {location:{href:'https://example.test/original?accessKey=x%2Fy#opaque'},get ECHSInstitution(){throw new Error('Feature off must not read account/config.');}};
    const controller = await mountInstitutionalLesson({enabled:flag,window:win});
    assert.equal(controller.mode,'legacy'); assert.equal(controller.href,win.location.href);
  }
  await open('disabled');
  let value = await state();
  assert.equal(value.mode,'legacy'); assert.equal(value.configCalls,0); assert.equal(value.apiCalls.length,0); assert.ok(value.text.includes('Existing lesson'));
  assert.ok(value.href.endsWith('#slide=2')); assert.equal(value.storageWrites,0);
  pass('feature off performs no account/config/API access, DOM replacement or URL change');

  await open(); value = await state();
  assert.equal(value.mode,'document'); assert.equal(value.index,1); assert.equal(value.configCalls,1); assert.equal(value.apiCalls.length,1);
  const request = value.apiCalls[0];
  assert.equal(request.url,'https://fixture-project.supabase.co/functions/v1/lesson-api/lessons/b0b4cd8b-e110-45fd-948f-d3ee06c843a1/published?class_id=ecfb78c2-2a67-48c0-9f5b-70e9ef4ae30c');
  assert.equal(request.authorization,true); assert.equal(request.method,'GET'); assert.equal(request.credentials,'omit');
  assert.equal(request.cache,'no-store'); assert.equal(request.redirect,'error'); assert.equal(request.referrerPolicy,'no-referrer');
  assert.ok(await page.locator('.katex-mathml math').count() > 0);
  assert.equal(await page.locator('[role="math"]').first().getAttribute('aria-label'),'x equals a');
  await page.screenshot({path:path.join(output,'institutional-loader-desktop.png'),fullPage:true});
  pass('loader fetches only the configured exact Supabase endpoint with bearer session, no cookies/cache/redirects');
  await page.getByRole('button',{name:'Next',exact:true}).click(); assert.equal((await state()).index,2);
  await page.keyboard.press('Home'); assert.equal((await state()).index,0);
  await page.keyboard.press('ArrowRight'); assert.equal((await state()).index,1);
  assert.equal(await page.evaluate(() => document.activeElement.id),'echs-slide-continuity-statement');
  assert.ok((await state()).href.includes('lessonKey=opaque%2Fkey'));
  await page.getByRole('button',{name:'Continue to lesson practice'}).click();
  value = await state(); assert.equal(value.finish,1); assert.equal(value.learning,0); assert.equal(value.storageWrites,0); assert.equal(value.stored,0);
  pass('institutional math, keyboard, focus and original finish control preserve query and make no learning/storage writes');
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({path:path.join(output,'institutional-loader-mobile.png'),fullPage:true});
  await page.setViewportSize({width:1280,height:900});
  pass('institutional content retains the shared responsive layout');

  await rejects('public-entry',{network:false}); pass('existing public mount remains unable to accept institutional documents');
  for (const scenario of ['guest','missing-token','parent','denied','unassigned','access-timeout','config-timeout','disabled-config','string-enabled-config','config-error',
    'bad-api-origin','bad-api-http','bad-api-path','bad-api-query','bad-api-credentials','bad-api-lookalike','config-token-race','config-account-race','config-route-race']) {
    await rejects(scenario,{network:false});
  }
  pass('missing access, bounded account/config waits, invalid configuration and account/token/route races fail before document fetch');
  for (const scenario of ['fetch-token-race','fetch-account-race','fetch-organization-race','fetch-route-race','fetch-config-race','fetch-gate-race',
    'fetch-role-race','fetch-signout-race','fetch-course-race','body-token-race']) await rejects(scenario);
  pass('session, organization, role, release, course, route and configuration changes during fetch/body read preserve legacy content');
  for (const scenario of ['http-denied','network-failure','redirected','response-foreign-url','bad-mime','invalid-json','oversized-body','oversized-header','fetch-timeout','caller-abort','body-timeout']) {
    await rejects(scenario);
    if (['fetch-timeout','caller-abort','body-timeout'].includes(scenario)) assert.ok((await state()).abortCalls > 0,scenario);
    if (scenario === 'body-timeout') assert.ok((await state()).bodyCancelled > 0);
  }
  pass('denied/network/redirect/malformed/oversized responses, caller cancellation and stalled body reads fail closed with bounded abort');
  for (const scenario of ['bad-contract','false-ok','foreign-account','foreign-organization','foreign-class','foreign-envelope-class','foreign-lesson','foreign-document',
    'foreign-version','wrong-revision','wrong-identity-revision','wrong-publication','foreign-route','foreign-origin','route-query','route-hash','route-empty-query','route-empty-hash','wrong-access-key','wrong-course','bad-site']) await rejects(scenario);
  await open('allowed','&accessKey=fixture%3Acontinuity');
  assert.ok((await state()).error); assert.equal(await page.locator('.echsDocument').count(),0);
  pass('strict envelope and account/org/class/document/version/revision/route/access binding reject cross-scope or ambiguous delivery');
  for (const scenario of ['draft','public','teacher','unknown-document-field','unknown-envelope-field','unknown-binding-field','unknown-identity-field','invalid-math','unsafe-markup','legacy-reference']) await rejects(scenario);
  pass('draft/private/public/history/extra-field payloads, invalid math, markup and unverified legacy blocks never enter the student DOM');
  for (const kind of ['token','account','organization','route','gate','role','signout','course','config']) {
    await open(); assert.equal(await page.locator('.echsDocument').count(),1,kind);
    await page.evaluate(kind => {fixture.mutate(kind); dispatchEvent(new Event('storage'));},kind);
    await page.waitForFunction(() => document.querySelector('#lesson').childElementCount === 0);
    value = await state(); assert.equal(value.storageWrites,0); assert.equal(value.learning,0);
  }
  pass('post-mount account/org/token/route/access/config changes clear institutional content');
  await open();
  await page.evaluate(async () => {
    fixture.oldController = fixture.controller;
    fixture.account({id:fixture.ids.other,organization_id:fixture.ids.organization,role:'student'});
    fixture.token('new-local-fixture-token');
    ECHSPortalAccess.current.current = ECHSInstitution.account();
    fixture.responseData.binding.account_id = fixture.ids.other;
    fixture.controller = await fixture.remount();
    dispatchEvent(new Event('storage'));
    fixture.oldController.dispose();
  });
  assert.equal(await page.locator('.echsDocument').count(),1);
  await page.evaluate(() => fixture.controller.goTo(0));
  await page.keyboard.press('Home');
  assert.equal((await state()).index,0);
  assert.equal((await state()).storageWrites,0);
  pass('remount disposes the prior instance and stale events/dispose calls cannot clear the new account view');
  assert.deepEqual(externalRequests,[]); assert.deepEqual(errors,[]);
  pass('all network responses are local fixtures; no browser errors or production requests');
  await writeFile(path.join(output,'institutional-loader-results.json'),JSON.stringify({status:'passed',checks,scope:'Original test fixture; simulated existing access decision and intercepted authenticated API responses. No production requests, account writes or student records.'},null,2)+'\n');
} finally {await context.close(); await browser.close();}
