import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createStudioFixture,studioStorageState,STUDIO_BASE,STUDIO_IDS} from './studio-fixture.mjs';
const require=createRequire(new URL('../../question-bank/official/tools/package.json',import.meta.url));
const {chromium}=require('playwright');
const output=fileURLToPath(new URL('../../artifacts/lesson-recovery/',import.meta.url));await mkdir(output,{recursive:true});
const checks=[],errors=[],runs=[];let browser,serial=0;
const pass=label=>{checks.push(label);console.log('PASS '+label);};
const state=(page,wanted)=>page.waitForFunction(value=>document.querySelector('#save-status')?.dataset.state===value,wanted);
const saved=page=>state(page,'saved');
const backed=page=>page.waitForFunction(()=>document.querySelector('#backup-status')?.dataset.state==='saved');
const url=run=>STUDIO_BASE+`lesson-studio.html?class=${STUDIO_IDS.class}&lesson=${run.fixture.latest().lesson.id}&recoveryCase=${++serial}`;
async function open({recovery=true,storageFailure=false}={}){
  const fixture=createStudioFixture({contentV2:true,media:true,recovery});
  const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block',storageState:studioStorageState()});
  await fixture.attach(context);
  if(storageFailure)await context.addInitScript(()=>Object.defineProperty(window,'indexedDB',{value:{open(){throw new DOMException('Synthetic quota failure','QuotaExceededError');}}}));
  const page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',error=>errors.push(error.message));page.on('dialog',dialog=>dialog.accept());
  const run={fixture,context,page};runs.push(run);
  await page.goto(STUDIO_BASE+'lesson-studio.html?recoveryCase='+ ++serial);
  await page.waitForFunction(()=>document.querySelector('#class-select').value!==''&&!document.querySelector('#new-lesson').disabled);
  await page.locator('#new-lesson').click();
  for(const [id,value] of Object.entries({'new-title':'Original recovery lesson','new-objective':'Interpret an original mathematical example.','new-skill':'original-recovery-focus','new-summary':'Synthetic authoring recovery fixture.'}))await page.locator('#'+id).fill(value);
  await page.locator('#create-lesson').click();await page.locator('#workspace').waitFor();await saved(page);return run;
}
async function reopen(run,{recover=true}={}){
  await run.page.goto(url(run));
  if(recover){await run.page.locator('#recovery-dialog').waitFor();await run.page.locator('#recovery-list').getByRole('button',{name:'Recover this draft',exact:true}).first().click();}
  await run.page.locator('#workspace').waitFor();await run.page.waitForFunction(()=>!document.querySelector('#workspace').inert);
}
async function offlineEdit(run,title){run.fixture.failNext('save',{network:true});await run.page.locator('#slide-title').fill(title);await state(run.page,'offline');await backed(run.page);}
async function rawStorage(page){return page.evaluate(async()=>{
  const result=[];
  for(const item of await indexedDB.databases()){
    const db=await new Promise((resolve,reject)=>{const req=indexedDB.open(item.name);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
    for(const name of db.objectStoreNames){const rows=await new Promise((resolve,reject)=>{const req=db.transaction(name).objectStore(name).getAll();req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});result.push({database:item.name,store:name,rows});}db.close();
  }
  return JSON.stringify(result);
});}
try{
  browser=await chromium.launch({headless:true,executablePath:process.env.ECHS_CHROMIUM_PATH||undefined});
  const run=await open(),{page,fixture}=run,initial=fixture.latest().head.document.slides[0].title;
  assert.equal(await page.locator('#device-backups').isEnabled(),true);
  await page.locator('#slide-title').fill('History title');await saved(page);await page.locator('#undo-edit').click();await saved(page);
  assert.equal(fixture.latest().head.document.slides[0].title,initial);await page.locator('#redo-edit').click();await saved(page);assert.equal(fixture.latest().head.document.slides[0].title,'History title');
  await page.locator('#private-notes').fill('PRIVATE-RECOVERY-NOTE');await saved(page);await page.locator('#undo-edit').click();await saved(page);assert.equal(fixture.latest().head.private_notes,'');
  await page.locator('#redo-edit').click();await saved(page);assert.equal(fixture.latest().head.private_notes,'PRIVATE-RECOVERY-NOTE');
  assert.equal((await page.locator('#slide-canvas').textContent()).includes('PRIVATE-RECOVERY-NOTE'),false);
  pass('undo and redo survive acknowledged revisions and include private notes without rendering them in the lesson');

  await page.locator('#add-slide').click();await saved(page);assert.equal(fixture.latest().head.document.slides.length,2);
  await page.locator('#undo-edit').click();await saved(page);assert.equal(fixture.latest().head.document.slides.length,1);await page.locator('#redo-edit').click();await saved(page);assert.equal(fixture.latest().head.document.slides.length,2);
  await page.locator('#add-table-block').click();await page.locator('#media-insert-editor [data-media-field=caption]').fill('Recovery table');await page.locator('#media-insert-editor .rich-editor-surface').fill('Original cell');await page.locator('#confirm-media-insert').click();await saved(page);
  await page.locator('#undo-edit').click();await saved(page);assert.equal(fixture.latest().head.document.slides.flatMap(s=>s.blocks).some(b=>b.type==='table'),false);
  await page.locator('#redo-edit').click();await saved(page);assert.equal(fixture.latest().head.document.slides.flatMap(s=>s.blocks).some(b=>b.type==='table'),true);
  pass('structural slide and media insertions undo and redo as complete canonical operations');

  await offlineEdit(run,'OFFLINE-PRIVATE-TITLE');
  const raw=await rawStorage(page);for(const marker of ['OFFLINE-PRIVATE-TITLE','PRIVATE-RECOVERY-NOTE','synthetic-studio-teacher-token','key_base64','private_notes','echs.lesson.checkpoint.v1'])assert.equal(raw.includes(marker),false,marker);
  assert.ok(raw.length>100);await reopen(run);await saved(page);assert.equal(fixture.latest().head.document.slides.some(slide=>slide.title==='OFFLINE-PRIVATE-TITLE'),true);
  assert.ok(fixture.calls.filter(c=>c.action==='recovery_key').length>=2);
  pass('offline edits survive page closure as ciphertext and recover only after fresh staff and lesson checks');

  const lost=await open(),before=lost.fixture.latest().lesson.head_revision;
  lost.fixture.failNext('save',{network:true,afterCommit:true});await lost.page.locator('#slide-title').fill('Acknowledged by server only');await state(lost.page,'offline');
  await lost.page.locator('#slide-title').fill('Newer local edit after lost acknowledgement');await backed(lost.page);await reopen(lost);await saved(lost.page);
  assert.equal(lost.fixture.latest().head.document.slides[0].title,'Newer local edit after lost acknowledgement');assert.equal(lost.fixture.latest().lesson.head_revision,before+2);
  pass('recovery recognizes a lost save acknowledgement and saves only the newer local edit');

  const conflict=await open();await offlineEdit(conflict,'Local conflicting draft');conflict.fixture.advanceServer(doc=>{doc.slides[0].title='Other teacher server revision';});
  const revision=conflict.fixture.latest().lesson.head_revision;await reopen(conflict);await state(conflict.page,'conflict');
  assert.equal(await conflict.page.locator('#slide-title').inputValue(),'Local conflicting draft');assert.equal(conflict.fixture.latest().lesson.head_revision,revision);
  await conflict.page.screenshot({path:path.join(output,'studio-recovered-conflict.png'),fullPage:true});
  await conflict.page.locator('#reload-draft').click();await conflict.page.locator('#discard-edits').click();await saved(conflict.page);
  assert.equal(await conflict.page.locator('#slide-title').inputValue(),'Other teacher server revision');
  pass('a newer server revision blocks recovered autosave, retains the local draft, and requires an explicit discard to reload');

  const tabs=await open();await offlineEdit(tabs,'First tab private draft');
  const second=await tabs.context.newPage();second.on('pageerror',error=>errors.push(error.message));second.on('dialog',dialog=>dialog.accept());await second.goto(url(tabs));await second.locator('#recovery-dialog').waitFor();await second.locator('#keep-server-draft').click();await second.locator('#workspace').waitFor();
  tabs.fixture.failNext('save',{network:true});await second.locator('#slide-title').fill('Second tab private draft');await state(second,'offline');await backed(second);
  const third=await tabs.context.newPage();third.on('pageerror',error=>errors.push(error.message));await third.goto(url(tabs));await third.locator('#recovery-dialog').waitFor();assert.equal(await third.locator('#recovery-list li').count(),2);
  await third.locator('#recovery-list').getByRole('button',{name:'Delete this device backup',exact:true}).first().click();await third.waitForFunction(()=>document.querySelector('#recovery-list').children.length===1);
  await third.locator('#keep-server-draft').click();await third.locator('#workspace').waitFor();
  pass('separate tab branches coexist and explicitly deleting one backup retains the other');

  const denied=await open();await offlineEdit(denied,'REVOKED-PRIVATE-DRAFT');denied.fixture.failNext('recovery_key',{status:403,code:'forbidden'});
  await denied.page.goto(url(denied));await denied.page.waitForFunction(()=>document.querySelector('#studio-app').hidden);
  assert.equal(await denied.page.locator('#recovery-list').textContent(),'');assert.equal((await denied.page.locator('body').textContent()).includes('REVOKED-PRIVATE-DRAFT'),false);
  pass('a denied fresh key request closes the workspace before any encrypted draft is displayed');

  const switched=await open();await offlineEdit(switched,'OLD-ACCOUNT-PRIVATE-DRAFT');
  await switched.page.evaluate(({account,token})=>ECHSInstitution.setSession({account,token,expires_at:'2099-01-01T00:00:00.000Z'},true),{account:switched.fixture.accountFor('other'),token:switched.fixture.tokenFor('other')});
  await switched.page.waitForFunction(()=>document.querySelector('#studio-app').hidden);assert.equal((await switched.page.locator('body').textContent()).includes('OLD-ACCOUNT-PRIVATE-DRAFT'),false);
  assert.equal(await switched.page.locator('#recovery-list').textContent(),'');await switched.page.reload();await switched.page.waitForFunction(()=>!document.querySelector('#studio-app').hidden);
  assert.equal(await switched.page.locator('#workspace').isVisible(),false);assert.equal(await switched.page.locator('#recovery-dialog').isVisible(),false);
  pass('an account switch clears private editor and recovery memory while the successor sees no prior-account draft');

  for(const options of [{recovery:false},{storageFailure:true}]){
    const fallback=await open(options);assert.equal(await fallback.page.locator('#device-backups').isDisabled(),true);
    await fallback.page.locator('#slide-title').fill('Server save still works');await saved(fallback.page);assert.equal(fallback.fixture.latest().head.document.slides[0].title,'Server save still works');
  }
  pass('missing server capability and device-storage failure preserve ordinary authenticated autosave');

  const ime=await open();await ime.page.locator('#slide-title').focus();await ime.page.locator('#slide-title').dispatchEvent('compositionstart');
  await ime.page.locator('#slide-title').fill('Composed final title');assert.equal(await ime.page.locator('#undo-edit').isDisabled(),true);
  await ime.page.locator('#slide-title').dispatchEvent('compositionend');await saved(ime.page);await ime.page.locator('#undo-edit').click();await saved(ime.page);
  assert.equal(ime.fixture.latest().head.document.slides[0].title,initial);
  await ime.page.setViewportSize({width:430,height:960});assert.equal(await ime.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await ime.page.screenshot({path:path.join(output,'studio-recovery-mobile.png'),fullPage:true});
  pass('composition commits one accepted edit and recovery/history controls fit a narrow viewport');

  for(const item of runs){assert.deepEqual(item.fixture.external,[]);assert.equal(item.fixture.calls.some(c=>/mastery|learning-sync/.test(c.path||'')),false);}
  assert.deepEqual(errors,[]);pass('the integrated recovery flow has no browser errors, external destinations, or mastery writes');
}finally{
  await writeFile(path.join(output,'studio-recovery-browser.json'),JSON.stringify({suite:'ECHS-011 integrated draft recovery',checks,errors,passed:checks.length,expected:11,status:checks.length===11&&!errors.length?'PASS':'FAIL'},null,2)+'\n');
  for(const run of runs)await run.context.close();await browser?.close();
}
