import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {createStudioFixture,studioStorageState,STUDIO_BASE,STUDIO_IDS} from './studio-fixture.mjs';
const repository=fileURLToPath(new URL('../../',import.meta.url));
const require=createRequire(new URL('../../question-bank/official/tools/package.json',import.meta.url));
const {chromium}=require('playwright');
const output=path.join(repository,'artifacts/lesson-media');await mkdir(output,{recursive:true});
const checks=[],errors=[],runs=[];let browser,navigation=0;
const pass=label=>{checks.push(label);console.log('PASS '+label);};
const PNG=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAADCAIAAAA2iEnWAAAAFElEQVR4nGOUDJjGwMDAxAAGUAoAEsQBBc88udgAAAAASUVORK5CYII=','base64');
function pdf(){let s='%PDF-1.7\n';const first=s.length;s+='1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';const second=s.length;s+='2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj\n';const xref=s.length;return Buffer.from(s+`xref\n0 3\n0000000000 65535 f \n${String(first).padStart(10,'0')} 00000 n \n${String(second).padStart(10,'0')} 00000 n \ntrailer\n<< /Size 3 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);}
const field=(page,key)=>page.locator('#media-insert-editor [data-media-field="'+key+'"]');
const blocks=run=>run.fixture.latest().head.document.slides[0].blocks;
async function saved(page){await page.waitForFunction(()=>document.querySelector('#save-status')?.textContent.trim()==='Saved');}
async function save(page){if(await page.locator('#save-now').isEnabled())await page.locator('#save-now').click();await saved(page);}
async function open({media=true}={}){
  const fixture=createStudioFixture({contentV2:true,media}),context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block',storageState:studioStorageState(),acceptDownloads:true});
  await fixture.attach(context);const page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',error=>errors.push(error.message));page.on('dialog',dialog=>dialog.accept());
  const run={fixture,context,page};runs.push(run);await page.goto(STUDIO_BASE+'lesson-studio.html?mediaCase='+ ++navigation,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#class-select').value!==''&&!document.querySelector('#new-lesson').disabled);
  await page.locator('#new-lesson').click();await page.locator('#new-title').fill('Original media lesson');await page.locator('#new-objective').fill('Interpret an original teacher example.');
  await page.locator('#new-skill').fill('media-interpretation');await page.locator('#new-summary').fill('Synthetic private media, video and table integration.');await page.locator('#create-lesson').click();await page.locator('#workspace').waitFor();await saved(page);return run;
}
async function reopen(run){const id=run.fixture.latest().lesson.id;await run.page.goto(STUDIO_BASE+`lesson-studio.html?class=${STUDIO_IDS.class}&lesson=${id}&mediaCase=${++navigation}`,{waitUntil:'domcontentloaded'});await run.page.locator('#workspace').waitFor();await saved(run.page);}
async function insert(page){await page.locator('#confirm-media-insert').click();await page.locator('#media-insert-dialog').waitFor({state:'hidden'});await save(page);}
async function upload(page,buffer,mimeType,name){await field(page,'file').setInputFiles({name,mimeType,buffer});await page.waitForFunction(()=>/^(Image|PDF) ready\.$/.test(document.querySelector('#media-insert-editor .media-editor-upload-status')?.textContent||''));}
try{
  browser=await chromium.launch({headless:true,executablePath:process.env.ECHS_CHROMIUM_PATH||undefined});
  const old=await open({media:false});for(const type of ['image','video','table','resource'])assert.equal(await old.page.locator('#add-'+type+'-block').isDisabled(),true);
  assert.equal(await old.page.locator('#add-math-block').isDisabled(),false);pass('separate missing media capability disables all four insertion tools while confirmed v2 mathematics remains available');

  const run=await open(),{page,fixture}=run;
  await page.locator('#add-table-block').click();assert.equal(blocks(run).length,1);await field(page,'caption').fill('Original numerical observations');await field(page,'row_header').check();
  await page.locator('#media-insert-editor [data-media-column-label]').first().fill('Input');await page.locator('#media-insert-editor [data-media-column-label]').nth(1).fill('Observation');
  const cell=page.locator('#media-insert-editor .rich-editor-surface');await cell.fill('Initial sample');await insert(page);
  const table=blocks(run).find(block=>block.type==='table');assert.equal(table.content.caption,'Original numerical observations');assert.equal(table.content.rows[0].cells[0][0].text,'Initial sample');
  assert.equal(await page.locator('#slide-canvas th[scope=row]').count(),1);assert.equal(await page.locator('#slide-canvas caption').textContent(),'Original numerical observations');
  await reopen(run);await page.locator('#block-select').selectOption(table.id);assert.equal(await page.locator('#block-editor [data-media-field=caption]').inputValue(),'Original numerical observations');
  pass('table insertion stays local until confirmed then saves semantic headers and editable cells through the actual Studio handler');

  await page.locator('#add-video-block').click();await field(page,'video-url').fill('https://www.youtube.com/watch?v=abcdefghijk');await field(page,'title').fill('Original graph explanation');
  await page.locator('#confirm-media-insert').click();assert.equal(await page.locator('#media-insert-dialog').isVisible(),true);assert.equal(blocks(run).some(block=>block.type==='video'),false);
  await field(page,'transcript').fill('Read the axes and describe how the graph changes.');await field(page,'start_seconds').fill('12');await insert(page);
  const video=blocks(run).find(block=>block.type==='video');assert.equal(video.content.video_id,'abcdefghijk');assert.equal('url' in video.content,false);assert.equal(await page.locator('iframe').count(),0);assert.deepEqual(fixture.external,[]);
  pass('video requires a transcript, stores only a recognized provider ID and makes no external request before a deliberate load');

  await page.locator('#add-image-block').click();await field(page,'alt').fill('A blue rectangle used as an original test image.');await field(page,'caption').fill('Original private image');
  await upload(page,PNG,'image/png','original-example.png');assert.equal(blocks(run).some(block=>block.type==='image'),false);await insert(page);
  const image=blocks(run).find(block=>block.type==='image'),asset=fixture.assets.get(image.content.asset_id);
  assert.equal(asset.state,'ready');assert.deepEqual(Buffer.from(fixture.assetBytes.get(asset.id)),PNG);assert.equal(Object.keys(image.content).length,5);assert.equal(JSON.stringify(image).includes('supabase'),false);
  await page.locator('#slide-canvas .echsMediaImage').scrollIntoViewIfNeeded();await page.waitForFunction(()=>document.querySelector('#slide-canvas img')?.naturalWidth===2);
  assert.equal(await page.locator('#slide-canvas img').getAttribute('alt'),image.content.alt);assert.equal(await page.locator('#slide-canvas img').getAttribute('width'),'2');
  await reopen(run);await page.locator('#block-select').selectOption(image.id);assert.equal(await page.locator('#block-editor [data-media-field=alt]').inputValue(),image.content.alt);
  pass('a private raster upload is confirmed by the real byte inspector and handler, saves only its asset ID, and reloads with dimensions and alternative text');

  await page.locator('#add-resource-block').click();await field(page,'title').fill('Original reference PDF');await field(page,'description').fill('A synthetic PDF for the downloadable-resource test.');
  const pdfBytes=pdf();await upload(page,pdfBytes,'application/pdf','original-reference.pdf');await insert(page);
  const downloadPromise=page.waitForEvent('download');await page.locator('#slide-canvas').getByRole('button',{name:'Download PDF',exact:true}).click();const download=await downloadPromise;
  assert.equal(download.suggestedFilename(),'lesson-resource-Original-reference-PDF.pdf');assert.deepEqual(await readFile(await download.path()),pdfBytes);
  pass('PDF resources download the authenticated verified bytes under a safe generated filename');

  await page.locator('#preview-lesson').click();await page.locator('#preview-dialog').waitFor();assert.equal(await page.locator('#preview-slides table').count(),1);assert.equal(await page.locator('#preview-slides iframe').count(),0);
  await page.locator('#close-preview').click();assert.equal(await page.locator('#preview-slides').textContent(),'');
  await page.locator('#block-select').selectOption(table.id);await page.locator('#slide-canvas').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(output,'studio-media-desktop.png'),fullPage:true});
  await page.setViewportSize({width:430,height:960});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:path.join(output,'studio-media-mobile.png'),fullPage:true});
  pass('full lesson preview shares the media renderer, closes cleanly, and fits desktop and mobile widths');

  await page.locator('#block-select').selectOption(image.id);fixture.failNext('save',{status:409,code:'revision_conflict'});
  await page.locator('#block-editor [data-media-field=alt]').fill('An updated accessible image description.');await page.waitForFunction(()=>document.querySelector('#save-status').dataset.state==='conflict');
  const replacement=fixture.holdNext('asset_upload');await page.locator('#block-editor [data-media-field=file]').setInputFiles({name:'replacement.png',mimeType:'image/png',buffer:PNG});await replacement.started;
  fixture.failNext('get',{status:503,code:'service_unavailable'});const reload=fixture.holdNext('get');await page.locator('#reload-draft').click();await page.locator('#discard-edits').click();await reload.started;
  assert.equal(await page.locator('#workspace').evaluate(node=>node.inert),true);replacement.release();await page.waitForFunction(()=>document.querySelector('#block-editor .media-editor-upload-status')?.textContent==='Image ready.');
  reload.release();await page.waitForFunction(()=>!document.querySelector('#workspace').inert&&document.querySelector('#save-status').dataset.state==='offline');
  await page.locator('#retry-save').click();await saved(page);const replaced=blocks(run).find(block=>block.id===image.id);
  assert.notEqual(replaced.content.asset_id,image.content.asset_id);assert.equal(replaced.content.alt,'An updated accessible image description.');
  pass('a valid upload completed during a locked failed reload is retained and committed by retry without requiring another field edit');

  await page.locator('#add-image-block').click();await field(page,'alt').fill('An insertion cancelled while its upload is pending.');const hold=fixture.holdNext('asset_upload');
  await field(page,'file').setInputFiles({name:'cancelled.png',mimeType:'image/png',buffer:PNG});await hold.started;await page.locator('#cancel-media-insert').click();hold.release();
  await page.waitForTimeout(300);assert.equal(await page.locator('#media-insert-dialog').isVisible(),false);assert.equal(blocks(run).filter(block=>block.type==='image').length,1);
  assert.equal(await page.locator('#media-insert-editor').textContent(),'');pass('cancelling a pending insertion ignores its late upload receipt without inserting a block or deleting a ready asset');

  const switched=await open();await switched.page.locator('#add-image-block').click();await field(switched.page,'alt').fill('Private insertion marker');
  const switchedHold=switched.fixture.holdNext('asset_upload');await field(switched.page,'file').setInputFiles({name:'private.png',mimeType:'image/png',buffer:PNG});await switchedHold.started;
  await switched.page.evaluate(({account,token})=>ECHSInstitution.setSession({account,token,expires_at:'2099-01-01T00:00:00.000Z'},true),{account:switched.fixture.accountFor('other'),token:switched.fixture.tokenFor('other')});
  await switched.page.waitForFunction(()=>document.querySelector('#studio-app').hidden);switchedHold.release();await switched.page.waitForTimeout(300);
  assert.equal(await switched.page.locator('#media-insert-editor').textContent(),'');assert.equal(await switched.page.locator('#slide-canvas').textContent(),'');assert.equal(blocks(switched).length,1);
  pass('an account switch closes the insertion and preview, rejects late private upload state, and leaves the successor account untouched');

  for(const item of runs){assert.deepEqual(item.fixture.external,[]);assert.equal(item.fixture.calls.some(call=>/mastery|learning-sync/.test(call.path||'')),false);}
  const stored=await page.evaluate(()=>[...Object.keys(localStorage),...Object.keys(sessionStorage)].filter(key=>!key.startsWith('echs_institution_')));assert.deepEqual(stored,[]);assert.deepEqual(errors,[]);
  pass('all browser integration requests stay in the isolated fixture; media produces no mastery calls or private persistent browser data');
  await writeFile(path.join(output,'studio-media-results.json'),JSON.stringify({ok:true,groups:checks.length,checks,browser_errors:errors,scope:'Actual Studio, handler and byte validation with in-memory RPC/Storage fixtures; actual database authorization has a separate PostgreSQL suite.'},null,2)+'\n');
}catch(error){console.error(JSON.stringify({checks,errors,calls:runs.map(run=>run.fixture.calls.slice(-5))}));throw error;}
finally{for(const run of runs)await run.context.close();await browser?.close();}
