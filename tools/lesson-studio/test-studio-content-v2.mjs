import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {createStudioFixture,studioStorageState,STUDIO_BASE,STUDIO_IDS} from './studio-fixture.mjs';
const repository=fileURLToPath(new URL('../../',import.meta.url));
const require=createRequire(new URL('../../question-bank/official/tools/package.json',import.meta.url));
const {chromium}=require('playwright');
const output=process.env.ECHS_STUDIO_CONTENT_EVIDENCE||path.join(repository,'artifacts/lesson-studio');
const checks=[],errors=[],contexts=[],fixtures=[];let browser,navigation=0;
const pass=label=>{checks.push(label);console.log('PASS '+label);};
const visual=()=>({source:{mode:'visual',expression:{kind:'symbol',name:'x'}},spoken:'x',display:true});
async function saved(page){await page.waitForFunction(()=>document.querySelector('#save-status')?.textContent?.trim()==='Saved',null,{timeout:15000});}
async function save(page){if(await page.locator('#save-now').isEnabled())await page.locator('#save-now').click();await saved(page);}
async function open(fixture=createStudioFixture({contentV2:true})){
  fixtures.push(fixture);const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block',storageState:studioStorageState()});contexts.push(context);await fixture.attach(context);
  const page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',error=>errors.push(error.message));page.on('dialog',dialog=>dialog.accept());
  await page.goto(STUDIO_BASE+'lesson-studio.html?case='+ ++navigation,{waitUntil:'domcontentloaded'});
  await page.locator('#studio-app').waitFor({state:'visible'});await page.waitForFunction(()=>document.querySelector('#class-select').value!==''&&!document.querySelector('#new-lesson').disabled);
  return {page,fixture,context};
}
async function create(run){
  const page=run.page;await page.locator('#new-lesson').click();await page.locator('#new-lesson-dialog').waitFor({state:'visible'});
  await page.locator('#new-title').fill('Original content editor fixture');await page.locator('#new-objective').fill('Explain an original teacher-selected example.');
  await page.locator('#new-skill').fill('teacher:explanation');await page.locator('#new-summary').fill('Synthetic rich text and visual mathematics lesson.');
  await page.locator('#create-lesson').click();await page.locator('#workspace').waitFor({state:'visible'});await saved(page);return run.fixture.latest();
}
async function reopen(run,id=run.fixture.latest().lesson.id){
  await run.page.goto(STUDIO_BASE+`lesson-studio.html?class=${STUDIO_IDS.class}&lesson=${id}&case=${++navigation}`,{waitUntil:'domcontentloaded'});
  await run.page.locator('#workspace').waitFor({state:'visible'});await saved(run.page);
}
const blocks=run=>run.fixture.latest().head.document.slides[0].blocks;
const field=(page,name)=>page.locator(`[data-math-field="${name}"]`);
async function selectText(surface){await surface.evaluate(node=>{node.focus();const range=document.createRange();range.selectNodeContents(node);const selection=getSelection();selection.removeAllRanges();selection.addRange(range);document.dispatchEvent(new Event('selectionchange'));});}
async function endText(surface){await surface.evaluate(node=>{node.focus();const range=document.createRange();range.selectNodeContents(node);range.collapse(false);const selection=getSelection();selection.removeAllRanges();selection.addRange(range);document.dispatchEvent(new Event('selectionchange'));});}
async function cleared(page,marker){await page.waitForFunction(()=>document.querySelector('#studio-app').hidden);assert.equal(await page.locator('#block-editor').textContent(),'');const data=await page.evaluate(()=>document.body.textContent+[...document.querySelectorAll('input,textarea')].map(node=>node.value).join('\n'));assert.equal(data.includes(marker),false);}

try{
  browser=await chromium.launch({headless:true,executablePath:process.env.ECHS_CHROMIUM_PATH||undefined});await mkdir(output,{recursive:true});
  const old=await open(createStudioFixture());await create(old);
  for(const id of ['add-text-block','add-math-block','add-callout-block'])assert.equal(await old.page.locator('#'+id).isDisabled(),true);
  await old.page.locator('#slide-text').fill('Legacy text remains editable without new capabilities.');await save(old.page);
  assert.equal(blocks(old)[0].version,1);assert.equal(blocks(old)[0].content.paragraphs[0].children[0].text,'Legacy text remains editable without new capabilities.');
  pass('missing SQL capability disables new content while existing version-one plain text still saves');

  old.fixture.advanceServer(document=>document.slides[0].blocks.push({id:'stored-v2',type:'math',version:2,content:visual()}));
  const beforeReadOnly=old.fixture.calls.filter(call=>call.action==='save').length;await reopen(old);
  assert.equal(await old.page.locator('#workspace').evaluate(node=>node.inert),true);assert.equal(await old.page.locator('#block-editor').textContent(),'');
  assert.equal(old.fixture.calls.filter(call=>call.action==='save').length,beforeReadOnly);assert.equal(await old.page.locator('#slide-canvas .katex').count(),1);
  pass('stored version-two content remains visible and read-only when server capabilities are missing');

  const main=await open();const initial=await create(main),page=main.page;
  main.fixture.advanceServer(document=>{document.slides[0].blocks[0].content.paragraphs[0].children=[{type:'text',text:'Important original statement',marks:['strong','em']},{type:'math',tex:'x^2',spoken:'x squared'}];});
  await reopen(main,initial.lesson.id);assert.equal(await page.locator('#upgrade-block').isVisible(),true);await page.locator('#upgrade-block').click();await save(page);
  let upgraded=blocks(main)[0];assert.equal(upgraded.version,2);assert.deepEqual(upgraded.content.nodes[0].children[0].marks,['strong','em']);
  assert.deepEqual(upgraded.content.nodes[0].children[1],{type:'math',source:{mode:'tex',tex:'x^2'},spoken:'x squared'});
  assert.equal(await page.locator('#block-editor .rich-editor-surface strong em').count(),1);
  pass('explicit rich-text upgrade preserves original wording, emphasis and inline mathematics');

  await page.locator('#add-math-block').click();await field(page,'expression-kind').waitFor();
  assert.equal(await field(page,'mode').inputValue(),'visual');await field(page,'expression-kind').selectOption('fraction');
  await field(page,'expression-numerator-value').fill('7');await save(page);
  const mathId=await page.locator('#block-select').inputValue();let mathBlock=blocks(main).find(block=>block.id===mathId);
  assert.equal(mathBlock.version,2);assert.equal(mathBlock.content.source.expression.numerator.value,'7');assert.equal('tex' in mathBlock.content.source,false);
  await reopen(main);await page.locator('#block-select').selectOption(mathId);assert.equal(await field(page,'expression-numerator-value').inputValue(),'7');
  pass('visual math is saved through the real handler and reopens as editable structured fields');

  await page.locator('#add-text-block').click();const richId=await page.locator('#block-select').inputValue();const surface=page.locator('#block-editor .rich-editor-surface');
  await surface.fill('First teaching point');await selectText(surface);await page.getByRole('button',{name:'Bold',exact:true}).click();
  await page.getByRole('button',{name:'Bulleted list',exact:true}).click();await save(page);
  let rich=blocks(main).find(block=>block.id===richId);assert.equal(rich.content.nodes[0].type,'list');assert.equal(rich.content.nodes[0].style,'unordered');assert.ok(rich.content.nodes[0].items[0].children[0].marks.includes('strong'));
  await page.getByRole('button',{name:'Numbered list',exact:true}).click();await save(page);assert.equal(blocks(main).find(block=>block.id===richId).content.nodes[0].style,'ordered');
  await page.getByRole('button',{name:'Paragraph',exact:true}).click();await selectText(surface);await page.getByRole('button',{name:'Italic',exact:true}).click();
  await page.getByRole('button',{name:'Add link',exact:true}).click();await page.getByRole('textbox',{name:'Web address',exact:true}).fill('https://example.org/original-teaching-resource');
  await page.getByRole('button',{name:'Apply link',exact:true}).click();await save(page);
  rich=blocks(main).find(block=>block.id===richId);assert.equal(rich.content.nodes[0].children[0].type,'link');assert.equal(rich.content.nodes[0].children[0].href,'https://example.org/original-teaching-resource');
  assert.ok(rich.content.nodes[0].children[0].children[0].marks.includes('em'));
  pass('rich text paragraph, list, emphasis and validated-link controls persist semantic nodes');

  await endText(surface);await page.getByRole('button',{name:'Insert mathematics',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Inline mathematics',exact:true});await dialog.waitFor({state:'visible'});
  await dialog.locator('[data-math-field="expression-kind"]').selectOption('power');await dialog.locator('[data-math-field="expression-exponent-value"]').fill('3');
  await dialog.getByRole('button',{name:'Insert mathematics',exact:true}).click();await save(page);
  rich=blocks(main).find(block=>block.id===richId);assert.ok(rich.content.nodes.some(node=>node.children?.some(child=>child.type==='math'&&child.source.mode==='visual'&&child.source.expression.exponent.value==='3')));
  assert.equal(await surface.locator('.rich-editor-inline-math').count(),1);
  pass('inline visual mathematics inserts from the real dialog and survives canonical autosave');

  await page.locator('#add-callout-block').click();const calloutId=await page.locator('#block-select').inputValue();
  await page.locator('#callout-kind').selectOption('definition');await page.locator('#callout-title').fill('Original teacher definition');await page.locator('#block-editor .rich-editor-surface').fill('A definition written for this synthetic lesson.');await save(page);
  const callout=blocks(main).find(block=>block.id===calloutId);assert.equal(callout.content.kind,'definition');assert.equal(callout.content.title,'Original teacher definition');
  await reopen(main);await page.locator('#block-select').selectOption(calloutId);assert.equal(await page.locator('#callout-title').inputValue(),'Original teacher definition');
  pass('callout style, title and rich body round-trip through the same draft session');

  const initialOrder=blocks(main).map(block=>block.id);await page.locator('#move-block-up').click();await save(page);
  assert.equal(blocks(main).findIndex(block=>block.id===calloutId),initialOrder.indexOf(calloutId)-1);await page.locator('#delete-block').click();await save(page);
  assert.equal(blocks(main).some(block=>block.id===calloutId),false);await page.locator('#add-text-block').click();await save(page);await page.locator('#undo-delete-block').click();await save(page);
  const restored=blocks(main).find(block=>block.type==='callout');assert.equal(restored.content.title,callout.content.title);assert.equal(new Set(blocks(main).map(block=>block.id)).size,blocks(main).length);
  assert.notEqual(restored.id,calloutId);pass('block reorder, delete, later insertion and undo preserve content with unique IDs');

  await page.locator('#block-select').selectOption(mathId);await field(page,'expression-numerator-value').fill('');
  const selected=await page.locator('#block-select').inputValue(),savedBeforeInvalid=main.fixture.calls.filter(call=>call.action==='save').length;
  assert.equal(await page.locator('#save-now').isDisabled(),true);await page.locator('#preview-lesson').click();assert.equal(await page.locator('#preview-dialog').isVisible(),false);
  await page.locator('#block-select').selectOption(richId);assert.equal(await page.locator('#block-select').inputValue(),selected);
  await page.locator('#add-slide').click();assert.equal(await page.locator('#slide-list button').count(),1);assert.equal(await field(page,'expression-numerator-value').inputValue(),'');
  await page.waitForTimeout(1100);assert.equal(main.fixture.calls.filter(call=>call.action==='save').length,savedBeforeInvalid);
  await field(page,'expression-numerator-value').fill('8');await save(page);assert.equal(blocks(main).find(block=>block.id===mathId).content.source.expression.numerator.value,'8');
  pass('invalid visual fields block save, preview and navigation without losing their buffer');

  main.fixture.failNext('save',{status:409,code:'revision_conflict'});await field(page,'expression-numerator-value').fill('9');
  await page.waitForFunction(()=>document.querySelector('#save-status')?.dataset.state==='conflict');
  await field(page,'expression-numerator-value').fill('');main.fixture.failNext('get',{status:503,code:'service_unavailable'});
  const priorGets=main.fixture.calls.filter(call=>call.action==='get').length;
  await page.locator('#reload-draft').click();await page.locator('#discard-dialog').waitFor({state:'visible'});await page.locator('#discard-edits').click();
  await page.waitForFunction(()=>document.querySelector('#save-status')?.dataset.state==='offline'&&!document.querySelector('#workspace').inert);
  assert.equal(main.fixture.calls.filter(call=>call.action==='get').length,priorGets+1);assert.equal(await field(page,'expression-numerator-value').inputValue(),'');
  assert.equal(await page.locator('#block-editor').getAttribute('data-math-editor-valid'),'false');assert.equal(await page.locator('#save-now').isDisabled(),true);
  await page.locator('#preview-lesson').click();assert.equal(await page.locator('#preview-dialog').isVisible(),false);
  await field(page,'expression-numerator-value').fill('9');await page.locator('#retry-save').click();await saved(page);
  assert.equal(blocks(main).find(block=>block.id===mathId).content.source.expression.numerator.value,'9');
  pass('failed reload after a conflict retains invalid raw math fields until a successful explicit recovery');

  const switching=await open(),firstSwitchLesson=await create(switching),secondSwitchLesson=await create(switching);
  await switching.page.locator('#upgrade-block').click();await save(switching.page);
  const switchHold=switching.fixture.holdNext('save');
  await switching.page.locator('.rich-editor-surface').fill('A valid edit saved before changing lessons.');
  await switching.page.locator(`#lesson-list button[data-lesson-id="${firstSwitchLesson.lesson.id}"]`).click();
  let switchTimer;
  try{await Promise.race([switchHold.started,new Promise((_,reject)=>{switchTimer=setTimeout(()=>reject(new Error('Navigation flush did not start.')),15000);})]);}finally{clearTimeout(switchTimer);}
  assert.equal(await switching.page.locator('#workspace').evaluate(node=>node.inert),true);
  assert.equal(await switching.page.locator('#workspace').getAttribute('aria-busy'),'true');
  await switching.page.locator('.rich-editor-surface').evaluate(node=>node.focus());
  assert.equal(await switching.page.locator('.rich-editor-surface').evaluate(node=>node===node.ownerDocument.activeElement),false);
  assert.equal(await switching.page.locator('#class-select').isDisabled(),true);
  assert.equal(await switching.page.locator('#new-lesson').isDisabled(),true);
  switchHold.release();
  await switching.page.waitForFunction(id=>document.querySelector('#lesson-list button[aria-pressed="true"]')?.dataset.lessonId===id&&!document.querySelector('#workspace').inert,firstSwitchLesson.lesson.id);
  const switchedRecord=switching.fixture.records.get(secondSwitchLesson.lesson.id);
  assert.equal(switchedRecord.head.document.slides[0].blocks[0].content.nodes[0].children[0].text,'A valid edit saved before changing lessons.');
  pass('changing lessons locks the current editor throughout a pending save so unfinished raw text cannot be lost during the transition');

  await page.locator('#preview-lesson').click();await page.locator('#preview-dialog').waitFor({state:'visible'});assert.ok(await page.locator('#preview-slides .katex').count()>=2);await page.locator('#close-preview').click();
  await page.screenshot({path:path.join(output,'studio-content-v2-desktop.png'),fullPage:true});
  await page.setViewportSize({width:430,height:960});await page.screenshot({path:path.join(output,'studio-content-v2-mobile.png'),fullPage:true});
  pass('the real Studio and shared lesson preview render rich and visual content on desktop and mobile');

  const hold=main.fixture.holdNext('save'),marker='Private math description must clear';await field(page,'spoken').fill(marker);
  let timer;try{await Promise.race([hold.started,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Expected autosave did not start')),15000);})]);}finally{clearTimeout(timer);}
  await page.evaluate(({account,token})=>ECHSInstitution.setSession({account,token,expires_at:'2099-01-01T00:00:00.000Z'},true),{account:main.fixture.accountFor('other'),token:main.fixture.tokenFor('other')});
  await cleared(page,marker);hold.release();await page.waitForTimeout(250);await cleared(page,marker);
  pass('an account switch disposes private editor DOM before a held save response returns');

  const routeRun=await open();await create(routeRun);await routeRun.page.locator('#add-math-block').click();await field(routeRun.page,'spoken').fill('Private route-bound description');await save(routeRun.page);
  await routeRun.page.evaluate(()=>history.pushState(null,'',location.pathname+'?changed-route=1'));await cleared(routeRun.page,'Private route-bound description');
  pass('a same-tab route change invalidates the authoring owner and clears the editor');

  for(const fixture of fixtures)assert.deepEqual(fixture.external,[]);assert.deepEqual(errors,[]);
  await writeFile(path.join(output,'studio-content-v2-results.json'),JSON.stringify({ok:true,groups:checks.length,checks,browser_errors:errors,
    scope:'Actual local Studio modules, handler and canonical/KaTeX validation with isolated in-memory RPC fixtures; no production network and no database/RLS claim.'},null,2)+'\n');
}catch(error){console.error(JSON.stringify({checks,browser_errors:errors,fixtureCalls:fixtures.map(fixture=>fixture.calls.slice(-4))}));throw error;}
finally{for(const context of contexts)await context.close();await browser?.close();}
