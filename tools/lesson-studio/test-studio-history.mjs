import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createStudioFixture,studioStorageState,STUDIO_BASE,STUDIO_IDS} from './studio-fixture.mjs';
const require=createRequire(new URL('../../question-bank/official/tools/package.json',import.meta.url));
const {chromium}=require('playwright'),output=fileURLToPath(new URL('../../artifacts/lesson-history/',import.meta.url));
await mkdir(output,{recursive:true});
const checks=[],errors=[],runs=[];let browser,serial=0;
const pass=label=>{checks.push(label);console.log('PASS '+label);};
const saved=page=>page.waitForFunction(()=>document.querySelector('#save-status')?.dataset.state==='saved');
const historyReady=page=>page.waitForFunction(()=>document.querySelector('#history-status')?.textContent.startsWith('History is up to date.')&&!document.querySelector('#close-history')?.disabled);
const historyState=(page,text)=>page.waitForFunction(value=>document.querySelector('#history-status')?.textContent.startsWith(value),text);
const editorReady=page=>page.waitForFunction(()=>!document.querySelector('#workspace').hidden&&!document.querySelector('#workspace').inert);
const calls=(fixture,action)=>fixture.calls.filter(c=>c.action===action);
const url=fixture=>STUDIO_BASE+`lesson-studio.html?class=${STUDIO_IDS.class}&lesson=${fixture.latest().lesson.id}&historyCase=${++serial}`;
async function open({fixture=createStudioFixture({contentV2:true,media:true}),role='teacher',create=true}={}){
  const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block',storageState:studioStorageState(role)});
  await fixture.attach(context);const page=await context.newPage();page.setDefaultTimeout(12000);page.on('pageerror',error=>errors.push(error.message));page.on('dialog',dialog=>dialog.accept());
  const run={fixture,context,page};runs.push(run);await page.goto(create?STUDIO_BASE+'lesson-studio.html?historyCase='+ ++serial:url(fixture));
  if(create){
    await page.waitForFunction(()=>document.querySelector('#class-select').value!==''&&!document.querySelector('#new-lesson').disabled);
    await page.locator('#new-lesson').click();
    for(const [id,value] of Object.entries({'new-title':'Original history lesson','new-objective':'Interpret an original mathematical example.','new-skill':'original-history-focus','new-summary':'Synthetic history fixture.'}))await page.locator('#'+id).fill(value);
    await page.locator('#create-lesson').click();
  }
  await editorReady(page);await saved(page);return run;
}
async function history(page){await page.locator('#version-history').click();await page.locator('#history-dialog').waitFor();await historyReady(page);}
async function select(page,id){const choice=page.locator(`#history-versions [data-version-id="${id}"]`);while(!await choice.count()&&await page.locator('#history-load-more').isVisible()){await page.locator('#history-load-more').click();await historyReady(page);}await choice.click();await historyReady(page);}
async function close(page){await page.locator('#close-history').click();await page.locator('#history-dialog').waitFor({state:'hidden'});await editorReady(page);}
async function approve(page){await page.locator('#approve-lesson-version').click();for(const check of await page.locator('[data-review-check]').all())await check.check();await page.locator('#history-action-comment').fill('Independent synthetic review completed.');await page.locator('#confirm-history-action').click();await historyReady(page);}
async function publish(page){await page.locator('#publish-lesson-version').click();await page.locator('#confirm-history-action').click();await historyReady(page);}
async function restore(page){await page.locator('#restore-lesson-version').click();await page.locator('#confirm-history-action').click();await historyReady(page);}
try{
  browser=await chromium.launch({headless:true,executablePath:process.env.ECHS_CHROMIUM_PATH||undefined});
  const run=await open(),{page,fixture}=run,original=fixture.latest().head;
  await page.locator('#slide-title').focus();await page.locator('#slide-title').dispatchEvent('compositionstart');await page.locator('#slide-title').fill('Composed history entry');
  assert.equal(await page.locator('#version-history').isDisabled(),true);await page.locator('#version-history').dispatchEvent('click');assert.equal(await page.locator('#history-dialog').isHidden(),true);
  await page.locator('#slide-title').dispatchEvent('compositionend');await saved(page);assert.equal(fixture.latest().head.document.slides[0].title,'Composed history entry');
  assert.equal(await page.locator('#version-history').isEnabled(),true);
  pass('history navigation waits for composition to commit and preserves the accepted text before opening');
  await page.locator('#private-notes').fill('PRIVATE_HISTORY_NOTES');await saved(page);
  await page.locator('#slide-title').fill('Changed history title');
  await history(page);assert.equal(fixture.latest().head.document.slides[0].title,'Changed history title');assert.equal(await page.locator('#workspace').evaluate(n=>n.inert),true);
  await select(page,original.id);assert.match(await page.locator('#history-comparison').innerText(),/PRIVATE_HISTORY_NOTES/);assert.match(await page.locator('#history-comparison').innerText(),/Changed history title/);
  await page.locator('#preview-history-version').click();assert.equal((await page.locator('#history-version-preview').innerText()).includes('PRIVATE_HISTORY_NOTES'),false);
  await page.screenshot({path:path.join(output,'studio-history-desktop.png'),fullPage:true});
  pass('opening history flushes accepted edits, locks the editor and compares private staff notes while the saved-version preview excludes them');

  await page.locator('#restore-lesson-version').click();await page.locator(`#history-versions [data-version-id="${fixture.latest().head.id}"]`).click();await historyReady(page);
  assert.equal(await page.locator('#history-confirmation').isHidden(),true);await select(page,original.id);
  const before=fixture.latest().lesson.head_revision;await restore(page);
  assert.equal(fixture.latest().lesson.head_revision,before+1);assert.equal(fixture.latest().head.restored_from_version_id,original.id);assert.equal(fixture.latest().head.private_notes,'');
  assert.deepEqual(fixture.records.get(original.lesson_id).history[0],original);await close(page);assert.equal(await page.locator('#private-notes').inputValue(),'');
  assert.equal(await page.locator('#history-dialog').innerHTML(),'');
  pass('changing version cancels a restore confirmation; restoring appends a new draft, preserves immutable history and reattaches the current editor revision');

  for(let i=0;i<30;i++)fixture.advanceServer(doc=>{doc.slides[0].title=`Original pagination version ${i}`;});
  await history(page);assert.equal(await page.locator('#history-versions li').count(),25);await page.locator('#history-load-more').click();await historyReady(page);
  assert.equal(await page.locator('#history-versions li').count(),fixture.records.get(original.lesson_id).history.length);assert.equal(await page.locator('#history-load-more').isHidden(),true);
  assert.match(calls(fixture,'history').at(-1).query,/before_version=/);await close(page);
  pass('history uses descending pages of25 and loads older immutable versions with an explicit cursor');

  await history(page);await page.locator('#request-lesson-review').click();await historyReady(page);
  assert.equal(fixture.latest().lesson.workflow_state,'review');assert.equal(await page.locator('#approve-lesson-version').isDisabled(),true);await close(page);
  const reviewer=await open({fixture,role:'admin',create:false});await history(reviewer.page);
  assert.equal(await reviewer.page.locator('#approve-lesson-version').isDisabled(),true);await select(reviewer.page,original.id);assert.equal(await reviewer.page.locator('#approve-lesson-version').isDisabled(),true);
  await select(reviewer.page,fixture.latest().head.id);await reviewer.page.locator('#approve-lesson-version').click();
  assert.match(await reviewer.page.locator('#history-confirmation-title').innerText(),new RegExp(`current version ${fixture.latest().head.version_number}`));
  assert.equal(await reviewer.page.locator('[data-review-check]:checked').count(),0);await reviewer.page.locator('#confirm-history-action').click();assert.equal(calls(fixture,'approve').length,0);
  await reviewer.page.locator('#cancel-history-action').click();await approve(reviewer.page);assert.equal(fixture.latest().lesson.workflow_state,'approved');
  pass('only an independent reviewer can approve, with the current saved version selected and five explicit unchecked declarations plus a review comment');

  const publishedHead=fixture.latest().head.id;await publish(reviewer.page);const publicationId=fixture.latest().lesson.active_publication_id;
  assert.ok(publicationId);assert.equal(fixture.latest().lesson.workflow_state,'published');assert.equal(fixture.latest().publications[0].source_version_id,publishedHead);
  assert.equal(Object.hasOwn(fixture.latest().publications[0],'document'),false);await close(reviewer.page);
  await page.goto(url(fixture));await editorReady(page);await page.locator('#slide-title').fill('New draft after publication');await saved(page);
  assert.equal(fixture.latest().lesson.active_publication_id,publicationId);assert.equal(fixture.latest().lesson.workflow_state,'draft');await history(page);await select(page,original.id);await restore(page);
  assert.equal(fixture.latest().lesson.active_publication_id,publicationId);assert.equal(fixture.latest().lesson.approved_version_id,null);
  pass('publication uses the approved head; later edits and historical restores create drafts while retaining the earlier live publication and clearing approval');

  await page.locator('#withdraw-lesson-publication').click();await page.locator('#confirm-history-action').click();assert.equal(calls(fixture,'unpublish').length,0);
  await page.locator('#history-action-comment').fill('Synthetic publication withdrawal.');await page.locator('#confirm-history-action').click();await historyReady(page);
  assert.equal(fixture.latest().lesson.active_publication_id,null);assert.equal(fixture.latest().publications[0].source_version_id,publishedHead);
  assert.match(await page.locator('#history-events').innerText(),/Synthetic publication withdrawal/);await close(page);
  pass('withdrawal requires a reason and records an immutable event for the published source even when the draft head has changed');

  const lost=await open();await history(lost.page);const lostBefore=lost.fixture.latest().lesson.head_revision;
  lost.fixture.failNext('request_review',{network:true,afterCommit:true});await lost.page.locator('#request-lesson-review').click();await historyState(lost.page,'The action result is unknown.');
  assert.equal(calls(lost.fixture,'request_review').length,1);await lost.page.locator('#check-history-state').click();await historyReady(lost.page);
  assert.equal(calls(lost.fixture,'request_review').length,1);assert.equal(lost.fixture.latest().lesson.head_revision,lostBefore+1);await close(lost.page);
  pass('a lost workflow acknowledgement is checked against the server without replaying its POST');

  const lostRestore=await open(),restoreOriginal=lostRestore.fixture.latest().head.id;await lostRestore.page.locator('#slide-title').fill('Before lost restore');await saved(lostRestore.page);await history(lostRestore.page);await select(lostRestore.page,restoreOriginal);
  lostRestore.fixture.failNext('restore',{network:true,afterCommit:true});await lostRestore.page.locator('#restore-lesson-version').click();await lostRestore.page.locator('#confirm-history-action').click();await historyState(lostRestore.page,'The action result is unknown.');
  assert.equal(await lostRestore.page.locator('#history-confirmation').isVisible(),true);await lostRestore.page.locator('#check-history-state').click();await historyReady(lostRestore.page);
  assert.equal(await lostRestore.page.locator('#history-confirmation').isHidden(),true);assert.equal(calls(lostRestore.fixture,'restore').length,1);await close(lostRestore.page);
  pass('confirming a lost restore acknowledgement closes its stale confirmation without replaying the action');

  const retry=await open();await history(retry.page);retry.fixture.failNext('request_review',{network:true});await retry.page.locator('#request-lesson-review').click();await historyState(retry.page,'The action result is unknown.');
  await retry.page.locator('#check-history-state').click();await historyState(retry.page,'The server is unchanged.');assert.equal(calls(retry.fixture,'request_review').length,1);
  const reads=calls(retry.fixture,'get').length;await retry.page.locator('#retry-history-action').click();await historyReady(retry.page);assert.equal(calls(retry.fixture,'request_review').length,2);assert.ok(calls(retry.fixture,'get').length>reads);await close(retry.page);
  pass('an unchanged server permits only an explicit retry preceded by another fresh read');

  const conflict=await open();await conflict.page.locator('#slide-title').fill('Second stored version');await saved(conflict.page);const old=conflict.fixture.records.values().next().value.history[0].id;
  await history(conflict.page);await select(conflict.page,old);await conflict.page.locator('#restore-lesson-version').click();conflict.fixture.advanceServer(doc=>{doc.slides[0].title='Concurrent server version';});
  const conflictRevision=conflict.fixture.latest().lesson.head_revision;await conflict.page.locator('#confirm-history-action').click();await historyState(conflict.page,'The server changed.');
  assert.equal(conflict.fixture.latest().lesson.head_revision,conflictRevision);assert.equal(await conflict.page.locator('#request-lesson-review').isDisabled(),true);
  await conflict.page.locator('#refresh-history').click();await historyReady(conflict.page);await close(conflict.page);assert.equal(await conflict.page.locator('#slide-title').inputValue(),'Concurrent server version');
  pass('a stale confirmation cannot overwrite a concurrent revision; explicit refresh adopts the server draft');

  const selectedConflict=await open();await history(selectedConflict.page);const selectedOld=selectedConflict.fixture.latest().head.id;selectedConflict.fixture.advanceServer();
  await selectedConflict.page.locator(`#history-versions [data-version-id="${selectedOld}"]`).click();await historyState(selectedConflict.page,'The server changed.');
  for(const id of ['request-lesson-review','approve-lesson-version','publish-lesson-version','withdraw-lesson-publication','restore-lesson-version'])assert.equal(await selectedConflict.page.locator('#'+id).isDisabled(),true);
  await selectedConflict.page.locator('#refresh-history').click();await historyReady(selectedConflict.page);await close(selectedConflict.page);
  pass('a revision change discovered during a version read disables all workflow mutations until refresh');

  for(const denialStatus of [403,404]){
  const denied=await open();await denied.page.locator('#private-notes').fill('PRIVATE_REVOKED_HISTORY');await saved(denied.page);await history(denied.page);
  await select(denied.page,denied.fixture.records.values().next().value.history[0].id);assert.match(await denied.page.locator('#history-comparison').innerText(),/PRIVATE_REVOKED_HISTORY/);
  denied.fixture.failNext('history',{status:denialStatus,code:denialStatus===404?'lesson_unavailable':'forbidden'});await denied.page.locator('#refresh-history').click();await denied.page.locator('#studio-gate').waitFor();
  assert.equal(await denied.page.locator('#history-dialog').innerHTML(),'');assert.equal((await denied.page.locator('body').innerText()).includes('PRIVATE_REVOKED_HISTORY'),false);assert.equal(await denied.page.locator('#private-notes').inputValue(),'');
  }
  pass('both authorization403 and whole-lesson scope404 clear the private comparison, close history and clear the background editor');

  const late=await open();await late.page.locator('#private-notes').fill('PRIVATE_LATE_VERSION');await saved(late.page);await history(late.page);const hold=late.fixture.holdNext('version');
  await late.page.locator('#history-versions button').first().click();await hold.started;
  await late.page.evaluate(()=>{localStorage.removeItem('echs_institution_token_v1');window.dispatchEvent(new StorageEvent('storage',{key:'echs_institution_token_v1',newValue:null}));});
  hold.release();await late.page.locator('#studio-gate').waitFor();assert.equal(await late.page.locator('#history-dialog').innerHTML(),'');assert.equal((await late.page.locator('body').innerText()).includes('PRIVATE_LATE_VERSION'),false);
  pass('account invalidation disposes an in-flight private version read and ignores its late response');

  await history(page);await select(page,fixture.latest().head.id);await page.setViewportSize({width:430,height:960});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:path.join(output,'studio-history-mobile.png'),fullPage:true});
  await page.locator('#close-history').focus();await page.keyboard.press('Escape');await page.locator('#history-dialog').waitFor({state:'hidden'});await editorReady(page);
  assert.equal(await page.locator('#version-history').evaluate(n=>n===document.activeElement),true);
  pass('history and semantic comparison fit mobile and native dialog Escape returns focus to the editor entry control');

  for(const item of runs){assert.deepEqual(item.fixture.external,[]);assert.equal(item.fixture.calls.some(c=>/mastery|learning-sync/.test(c.path||'')),false);
    const storage=await item.page.evaluate(()=>JSON.stringify({local:{...localStorage},session:{...sessionStorage}}));for(const marker of ['PRIVATE_HISTORY_NOTES','PRIVATE_REVOKED_HISTORY','PRIVATE_LATE_VERSION','Independent synthetic review completed.','Synthetic publication withdrawal.'])assert.equal(storage.includes(marker),false);
  }
  assert.deepEqual(errors,[]);pass('the history interface stores no private lesson/review data in web storage and issues no external or mastery requests');
}finally{
  await writeFile(path.join(output,'studio-history-browser.json'),JSON.stringify({suite:'ECHS-012 integrated version history',checks,errors,passed:checks.length,expected:16,status:checks.length===16&&!errors.length?'PASS':'FAIL',scope:'Synthetic original lessons, real browser and production client/handler with in-memory RPC fixture. Actual SQL authorization is tested separately.'},null,2)+'\n');
  for(const run of runs)await run.context.close();await browser?.close();
}
