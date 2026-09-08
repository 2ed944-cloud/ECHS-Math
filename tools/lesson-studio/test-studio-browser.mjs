import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {createStudioFixture,studioStorageState,STUDIO_ORIGIN,STUDIO_BASE,STUDIO_IDS} from './studio-fixture.mjs';

const repository = fileURLToPath(new URL('../../',import.meta.url));
const require = createRequire(new URL('../../question-bank/official/tools/package.json',import.meta.url));
const {chromium} = require('playwright');
const output = process.env.ECHS_STUDIO_EVIDENCE || path.join(repository,'artifacts/lesson-studio');
await mkdir(output,{recursive:true});
const browser = await chromium.launch({headless:true,executablePath:process.env.ECHS_CHROMIUM_PATH || undefined});
const checks = [], contexts = [], browserErrors = [], fixtures = []; let navigation = 0;
const pass = message => {checks.push(message); console.log('PASS ' + message);};
const wait = ms => new Promise(resolve => setTimeout(resolve,ms));
async function requestStarted(hold) {
  let timer;
  try {await Promise.race([hold.started,new Promise((_,reject) => {timer = setTimeout(() => reject(new Error('The expected Studio request did not start.')),12000);})]);}
  finally {clearTimeout(timer);}
}
async function open(role = 'teacher',fixture = createStudioFixture()) {
  fixtures.push(fixture);
  const context = await browser.newContext({viewport:{width:1360,height:960},serviceWorkers:'block',storageState:studioStorageState(role)});
  contexts.push(context); await fixture.attach(context);
  await context.addInitScript(() => {
    window.__studioTestAudit = {learning:[]};
    for (const name of ['echs:learning-attempt','echs:learning-session','echs:lesson-completed']) window.addEventListener(name,() => window.__studioTestAudit.learning.push(name));
    for (const name of ['echs:learning-updated','echs:mastery-authority']) document.addEventListener(name,() => window.__studioTestAudit.learning.push(name));
  });
  const page = await context.newPage(); page.setDefaultTimeout(12000);
  page.on('pageerror',error => browserErrors.push(error.message));
  page.on('dialog',dialog => dialog.accept());
  await page.goto(STUDIO_BASE + 'lesson-studio.html?testCase=' + (++navigation));
  return {context,page,fixture};
}
async function ready(run) {
  await run.page.locator('#studio-app').waitFor({state:'visible'});
  await run.page.locator('#class-select').selectOption(STUDIO_IDS.class);
  await run.page.locator('#new-lesson').waitFor({state:'visible'});
  await run.page.waitForFunction(() => !document.querySelector('#new-lesson').disabled);
}
async function submitCreate(run,topic = 0) {
  await ready(run);
  await run.page.locator('#new-lesson').click();
  await run.page.locator('#new-lesson-dialog').waitFor({state:'visible'});
  await run.page.locator('#catalog-select').selectOption(run.fixture.catalog[topic].access_key);
  await run.page.locator('#new-title').fill('Original Studio browser lesson ' + (topic + 1));
  await run.page.locator('#new-objective').fill('Explain the relationship between a limiting value and a function value.');
  await run.page.locator('#new-skill').fill('fixture:explain-continuity');
  await run.page.locator('#new-summary').fill('Original synthetic lesson for testing the Studio editing controls.');
  await run.page.locator('#create-lesson').click();
}
async function create(run,topic = 0) {
  await submitCreate(run,topic);
  await run.page.locator('#workspace').waitFor({state:'visible'});
  await saved(run.page);
  assert.equal(await run.page.locator('#slide-list button').count(),1);
  return run.fixture.latest();
}
async function saved(page) {
  await page.waitForFunction(() => /^Saved\b/i.test(document.querySelector('#save-status')?.textContent?.trim() || ''),null,{timeout:15000});
}
async function edit(page,selector,value) {
  await page.locator(selector).fill(value); await page.locator(selector).press('Tab');
}
async function saveNow(page) {
  if (await page.locator('#save-now').isEnabled()) await page.locator('#save-now').click();
  await saved(page);
}
async function noPrivateStorage(page,markers = []) {
  const storage = await page.evaluate(() => ({local:Object.fromEntries(Object.entries(localStorage)),session:Object.fromEntries(Object.entries(sessionStorage)),learning:window.__studioTestAudit?.learning || []}));
  for (const key of [...Object.keys(storage.local),...Object.keys(storage.session)]) {
    assert.ok(['echs_institution_account_v1','echs_institution_token_v1','echs_institution_expires_v1'].includes(key),'Unexpected persistent Studio key: ' + key);
  }
  for (const marker of markers) assert.equal(JSON.stringify(storage).includes(marker),false);
  assert.deepEqual(storage.learning,[]);
}
async function cleared(page,markers) {
  await page.waitForFunction(() => document.querySelector('#studio-app')?.hidden === true || !document.querySelector('#studio-app'));
  const text = await page.evaluate(() => document.body.textContent + [...document.querySelectorAll('input,textarea')].map(node => node.value).join('\n'));
  for (const marker of markers) assert.equal(text.includes(marker),false,'Old account content retained in DOM: ' + marker);
  await noPrivateStorage(page,markers);
}
async function sameTabSwitch(run) {
  const account = run.fixture.accountFor('other'), token = run.fixture.tokenFor('other');
  await run.page.evaluate(({account,token}) => {
    ECHSInstitution.setSession({account,token,expires_at:'2099-01-01T00:00:00.000Z'},true);
  },{account,token});
}
try {
  const main = await open(); const created = await create(main);
  assert.equal(created.head.document.publication.status,'draft');
  assert.equal(created.head.document.publication.audience,'institutional');
  assert.equal(main.fixture.calls.filter(call => call.action === 'create').length,1);
  const createRequest = main.fixture.calls.find(call => call.action === 'create').body;
  assert.equal(createRequest.expected_revision,0); assert.equal(createRequest.class_id,STUDIO_IDS.class);
  assert.equal(createRequest.course_version_id,STUDIO_IDS.course);
  assert.equal('organization_id' in createRequest,false);
  pass('teacher authenticates, chooses an authorized class/catalog route and creates a canonical draft through the real lesson API handler');

  const held = main.fixture.holdNext('save');
  await main.page.locator('#slide-title').fill('Autosave first edit');
  await requestStarted(held);
  assert.match(await main.page.locator('#save-status').textContent(),/Saving/i);
  assert.equal(await main.page.evaluate(() => document.activeElement.id),'slide-title');
  await main.page.locator('#slide-title').fill('Newer edit while saving');
  held.release(); await saved(main.page);
  await main.page.waitForFunction(() => document.querySelector('#slide-title').value === 'Newer edit while saving');
  assert.equal(main.fixture.latest().head.document.slides[0].title,'Newer edit while saving');
  assert.ok(main.fixture.calls.filter(call => call.action === 'save').length >= 2);
  pass('focused typing autosaves before blur, exposes saving/saved states and preserves edits made during an earlier save');

  await edit(main.page,'#slide-title','Opening');
  for (let index = 2; index <= 5; index++) {
    await main.page.locator('#add-slide').click();
    await edit(main.page,'#slide-title','Original slide ' + index);
  }
  assert.equal(await main.page.locator('#slide-list button').count(),5);
  await main.page.locator('#slide-list button').nth(1).click();
  await edit(main.page,'#slide-title','Reasoning');
  await main.page.locator('#duplicate-slide').click();
  assert.equal(await main.page.locator('#slide-list button').count(),6);
  await edit(main.page,'#slide-title','Duplicated reasoning');
  await saveNow(main.page);
  const beforeMove = main.fixture.latest().head.document.slides.map(slide => slide.id);
  const duplicateId = main.fixture.latest().head.document.slides.find(slide => slide.title === 'Duplicated reasoning').id;
  const oldIndex = beforeMove.indexOf(duplicateId); assert.ok(oldIndex > 0);
  await main.page.locator('#move-slide-up').click(); await saveNow(main.page);
  assert.equal(main.fixture.latest().head.document.slides.findIndex(slide => slide.id === duplicateId),oldIndex - 1);
  await main.page.locator('#move-slide-down').click(); await saveNow(main.page);
  assert.deepEqual(main.fixture.latest().head.document.slides.map(slide => slide.id),beforeMove);
  await main.page.locator('#delete-slide').click(); assert.equal(await main.page.locator('#slide-list button').count(),5);
  await main.page.locator('#undo-delete').click(); assert.equal(await main.page.locator('#slide-list button').count(),6);
  await main.page.locator('#slide-layout').selectOption('two-column');
  await edit(main.page,'#slide-text','Original browser-authored explanation.');
  await edit(main.page,'#private-notes','Synthetic private teacher note A');
  await saveNow(main.page);
  const finalDocument = main.fixture.latest().head.document;
  assert.equal(new Set(finalDocument.slides.map(slide => slide.id)).size,6);
  const blocks = finalDocument.slides.flatMap(slide => slide.blocks.map(block => block.id));
  assert.equal(new Set(blocks).size,blocks.length);
  assert.equal(JSON.stringify(finalDocument).includes('Synthetic private teacher note A'),false);
  assert.equal(main.fixture.latest().head.private_notes,'Synthetic private teacher note A');
  await noPrivateStorage(main.page,['Synthetic private teacher note A','Original browser-authored explanation.']);
  pass('five-slide authoring, rename, duplicate, reorder, delete/undo and layout/text changes persist with stable unique IDs and separate private notes');

  await main.page.locator('#preview-lesson').click();
  await main.page.locator('#preview-dialog').waitFor({state:'visible'});
  assert.equal((await main.page.locator('#preview-dialog').textContent()).includes('Synthetic private teacher note A'),false);
  await main.page.locator('#close-preview').click();
  await main.page.locator('#add-slide').focus(); await main.page.keyboard.press('Tab');
  assert.notEqual(await main.page.evaluate(() => document.activeElement?.tagName),'BODY');
  await main.page.screenshot({path:path.join(output,'studio-desktop.png'),fullPage:true});
  await main.page.setViewportSize({width:390,height:844});
  assert.ok(await main.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),'Studio must not overflow a mobile viewport.');
  for (const selector of ['#add-slide','#duplicate-slide','#save-now']) {
    const box = await main.page.locator(selector).boundingBox(); assert.ok(box && box.height >= 40,selector + ' touch target');
  }
  await main.page.screenshot({path:path.join(output,'studio-mobile.png'),fullPage:true});
  await noPrivateStorage(main.page,['Synthetic private teacher note A']);
  pass('preview omits private notes; keyboard focus and responsive desktop/mobile layout remain usable without learning evidence');

  await main.page.setViewportSize({width:1360,height:960});
  await main.page.locator('#slide-list button').first().click();
  main.fixture.advanceServer(document => {document.slides[0].title = 'Remote server revision';});
  await edit(main.page,'#slide-title','Local conflicting revision');
  await main.page.waitForFunction(() => /conflict|changed on the server/i.test(document.querySelector('#save-status')?.textContent || ''));
  assert.equal(await main.page.locator('#slide-title').inputValue(),'Local conflicting revision');
  const conflictSaves = main.fixture.calls.filter(call => call.action === 'save').length;
  await wait(1000); assert.equal(main.fixture.calls.filter(call => call.action === 'save').length,conflictSaves);
  await main.page.locator('#reload-draft').click();
  await main.page.locator('#discard-dialog').waitFor({state:'visible'});
  await main.page.locator('#keep-edits').click();
  assert.equal(await main.page.locator('#slide-title').inputValue(),'Local conflicting revision');
  await main.page.locator('#reload-draft').click(); await main.page.locator('#discard-edits').click(); await saved(main.page);
  assert.equal(await main.page.locator('#slide-title').inputValue(),'Remote server revision');
  pass('revision conflict retains local work, stops automatic writes and reloads the server draft only after explicit action');

  main.fixture.failNext('save',{network:true});
  await edit(main.page,'#slide-text','Offline original working text');
  await main.page.waitForFunction(() => /offline|connection/i.test(document.querySelector('#save-status')?.textContent || ''));
  assert.equal(await main.page.locator('#slide-text').inputValue(),'Offline original working text');
  await noPrivateStorage(main.page,['Offline original working text']);
  const beforeRetry = main.fixture.calls.length;
  await main.page.locator('#retry-save').click(); await saved(main.page);
  assert.ok(JSON.stringify(main.fixture.latest().head.document).includes('Offline original working text'));
  const retryActions = main.fixture.calls.slice(beforeRetry).filter(call => call.service === 'lesson').map(call => call.action);
  assert.equal(retryActions[0],'get'); assert.ok(retryActions.includes('save'));
  pass('offline work remains only in memory and explicit retry reads server state before safely saving');

  const lostCreate = await open();
  lostCreate.fixture.failNext('create',{network:true,afterCommit:true});
  await create(lostCreate);
  assert.equal(lostCreate.fixture.calls.filter(call => call.action === 'create').length,1);
  assert.equal(lostCreate.fixture.calls.filter(call => call.action === 'get').length,1);
  assert.equal(lostCreate.fixture.records.size,1); await lostCreate.context.close();
  pass('a lost successful creation acknowledgement is reconciled by reading the same lesson without a duplicate POST');

  for (const committed of [true,false]) {
    const retryCreate = await open();
    retryCreate.fixture.failNext('create',{network:true,afterCommit:committed});
    retryCreate.fixture.failNext('get',{network:true});
    await submitCreate(retryCreate);
    await retryCreate.page.waitForFunction(() => /not yet confirmed/i.test(document.querySelector('#create-error').textContent));
    assert.equal(await retryCreate.page.locator('#new-title').isDisabled(),true);
    assert.equal(await retryCreate.page.locator('#create-lesson').textContent(),'Check saved lesson');
    const firstAttempt = retryCreate.fixture.calls.find(call => call.action === 'create').body.document.lesson_id;
    await retryCreate.page.locator('#cancel-create').click(); await retryCreate.page.locator('#new-lesson').click();
    assert.equal(await retryCreate.page.locator('#new-title').inputValue(),'Original Studio browser lesson 1');
    await noPrivateStorage(retryCreate.page,['Original Studio browser lesson 1']);
    const beforeCheck = retryCreate.fixture.calls.length;
    await retryCreate.page.locator('#create-lesson').click();
    await retryCreate.page.locator('#workspace').waitFor({state:'visible'}); await saved(retryCreate.page);
    const requests = retryCreate.fixture.calls.slice(beforeCheck).filter(call => call.service === 'lesson');
    assert.equal(requests[0].action,'get');
    const creates = retryCreate.fixture.calls.filter(call => call.action === 'create');
    assert.equal(creates.length,committed ? 1 : 2);
    assert.ok(creates.every(call => call.body.document.lesson_id === firstAttempt));
    assert.equal(retryCreate.fixture.records.size,1); await retryCreate.context.close();
  }
  pass('an uncertain creation and failed read retain the same in-memory attempt; explicit retry checks first and resubmits only after a confirmed missing lesson');

  for (const role of ['student','parent','guest']) {
    const run = await open(role);
    await run.page.waitForFunction(() => {
      const gate = document.querySelector('#studio-gate'), app = document.querySelector('#studio-app');
      return !app || (app.hidden && Boolean(gate?.querySelector('a')) && /sign|teacher|admin|account|access|unavailable/i.test(gate.textContent));
    });
    assert.equal(run.fixture.calls.filter(call => call.service === 'lesson').length,0);
    await run.context.close();
  }
  const admin = await open('admin'); await create(admin);
  assert.equal(admin.fixture.latest().head.document.publication.status,'draft'); await admin.context.close();
  pass('student, parent and guest cannot open private authoring; an authorized administrator can create a draft');

  const unpinned = await open('teacher',createStudioFixture({pinned:false}));
  await unpinned.page.locator('#studio-app').waitFor({state:'visible'});
  await unpinned.page.locator('#class-select').selectOption(STUDIO_IDS.class);
  await unpinned.page.waitForFunction(() => /administrator/i.test(document.querySelector('#empty-state')?.textContent || ''));
  assert.equal(await unpinned.page.locator('#new-lesson').isEnabled(),false);
  assert.equal(await unpinned.page.locator('#pin-form').isVisible(),false);
  assert.equal(unpinned.fixture.calls.some(call => call.action === 'pin_course'),false); await unpinned.context.close();
  const pin = await open('admin',createStudioFixture({pinned:false}));
  await pin.page.locator('#studio-app').waitFor({state:'visible'});
  await pin.page.locator('#class-select').selectOption(STUDIO_IDS.class);
  await pin.page.locator('#pin-form').waitFor({state:'visible'});
  await pin.page.locator('#course-version-select').selectOption(STUDIO_IDS.course);
  await pin.page.locator('#pin-reason').fill('Reviewed original fixture class course version.');
  await pin.page.locator('#pin-course').click();
  await pin.page.waitForFunction(() => !document.querySelector('#new-lesson').disabled);
  assert.equal(pin.fixture.calls.filter(call => call.action === 'pin_course').length,1);
  assert.equal(pin.fixture.calls.find(call => call.action === 'pin_course').body.expected_assignment_id,null);
  await create(pin); await pin.context.close();
  pass('an unpinned class blocks teacher creation; an administrator explicitly selects and confirms its course version first');

  const switching = await open(); const firstLesson = await create(switching); await create(switching,1);
  const switchingGet = switching.fixture.holdNext('get');
  const priorSaves = switching.fixture.calls.filter(call => call.action === 'save').length;
  await switching.page.locator(`#lesson-list button[data-lesson-id="${firstLesson.lesson.id}"]`).click();
  await requestStarted(switchingGet);
  assert.equal(await switching.page.locator('#workspace').getAttribute('aria-busy'),'true');
  assert.equal(await switching.page.locator('#workspace').evaluate(element => element.inert),true);
  await switching.page.locator('#slide-title').evaluate(element => element.focus());
  assert.notEqual(await switching.page.evaluate(() => document.activeElement?.id),'slide-title','An old editor must not accept focus during replacement.');
  assert.equal(switching.fixture.calls.filter(call => call.action === 'save').length,priorSaves);
  switchingGet.release();
  await switching.page.waitForFunction(() => document.querySelector('#lesson-heading').textContent === 'Original Studio browser lesson 1' && !document.querySelector('#workspace').inert);
  await switching.context.close();
  pass('a delayed replacement lesson fetch makes the old workspace inert and restores editing only after the new draft is attached');

  for (const mode of ['same-tab','other-tab']) {
    const run = await open(); await create(run);
    const marker = 'Synthetic isolated note ' + mode;
    await edit(run.page,'#private-notes',marker); await saveNow(run.page);
    if (mode === 'same-tab') await sameTabSwitch(run);
    else {
      const peer = await run.context.newPage(); await peer.goto(STUDIO_BASE + '__studio-peer.html');
      const account = run.fixture.accountFor('other'), token = run.fixture.tokenFor('other');
      await peer.evaluate(({account,token}) => {
        localStorage.setItem('echs_institution_account_v1',JSON.stringify(account));
        localStorage.setItem('echs_institution_token_v1',token);
        localStorage.setItem('echs_institution_expires_v1','2099-01-01T00:00:00.000Z');
      },{account,token});
    }
    await cleared(run.page,[marker,'Original Studio browser lesson 1']); await run.context.close();
  }
  pass('real same-tab session changes and native other-tab storage events clear old account content and private notes');

  const stale = await open(); await create(stale);
  const staleSave = stale.fixture.holdNext('save');
  await edit(stale.page,'#private-notes','Synthetic stale-save private marker');
  await requestStarted(staleSave); await sameTabSwitch(stale);
  await cleared(stale.page,['Synthetic stale-save private marker']);
  staleSave.release(); await wait(300);
  await cleared(stale.page,['Synthetic stale-save private marker']); await stale.context.close();
  pass('an already-issued save response cannot repopulate the UI after the account changes');

  const loadingFixture = createStudioFixture(), seed = await open('teacher',loadingFixture); await create(seed); await seed.context.close();
  const loading = await open('teacher',loadingFixture); await ready(loading);
  const staleGet = loadingFixture.holdNext('get');
  await loading.page.locator('#lesson-list button').first().click();
  await requestStarted(staleGet); await sameTabSwitch(loading); await cleared(loading.page,['Original Studio browser lesson 1']);
  staleGet.release(); await wait(300); await cleared(loading.page,['Original Studio browser lesson 1']); await loading.context.close();
  pass('a stale private lesson fetch is ignored after an account change');

  const moved = await open('teacher',loadingFixture); await ready(moved);
  const movedGet = loadingFixture.holdNext('get');
  await moved.page.locator('#lesson-list button').first().click(); await requestStarted(movedGet);
  await moved.page.evaluate(() => history.replaceState(null,'','./lessons/ap-calculus/unit-1/lesson-1-7.html?fixture-route-change=1'));
  await cleared(moved.page,['Original Studio browser lesson 1']);
  movedGet.release(); await wait(300); await cleared(moved.page,['Original Studio browser lesson 1']); await moved.context.close();
  pass('a same-origin route change invalidates the authoring session and rejects a pending private response');

  assert.deepEqual(browserErrors,[]);
  for (const fixture of fixtures) assert.deepEqual(fixture.external,[]);
  pass('the real production page/modules made no external production requests and raised no browser script errors');
  await writeFile(path.join(output,'studio-browser-results.json'),JSON.stringify({status:'passed',generated_at:new Date().toISOString(),checks,
    scope:'Production Lesson Studio page/modules with synthetic accounts and intercepted requests. Real lesson HTTP handler with in-memory fixture RPC; no production calls, database/RLS claim, or real account writes.'},null,2)+'\n');
} catch (error) {
  const diagnostics = [];
  for (const context of contexts) for (const page of context.pages()) {
    diagnostics.push(await page.evaluate(() => ({url:location.href,gate:document.querySelector('#studio-gate')?.textContent,
      library:document.querySelector('#library-status')?.textContent,create:document.querySelector('#create-error')?.textContent,
      save:document.querySelector('#save-status')?.textContent,edit:document.querySelector('#edit-error')?.textContent})).catch(() => ({unavailable:true})));
  }
  console.error(JSON.stringify({browserErrors,diagnostics,requests:fixtures.map(fixture => fixture.calls.map(({body,...call}) => call)),external:fixtures.map(fixture => fixture.external)}));
  throw error;
} finally {
  for (const context of contexts) await context.close().catch(() => {});
  await browser.close();
}
