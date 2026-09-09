import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createStudioFixture,studioStorageState,STUDIO_BASE,STUDIO_IDS} from './studio-fixture.mjs';

const require=createRequire(new URL('../../question-bank/official/tools/package.json',import.meta.url));
const {chromium}=require('playwright');
const output=fileURLToPath(new URL('../../artifacts/lesson-presentation/',import.meta.url));await mkdir(output,{recursive:true});
const NOTE='PRIVATE_PRESENTATION_NOTES_MUST_NEVER_RENDER';
const FIRST='Original first revealed explanation',SECOND='Original second slide explanation';
const ASSET='70000000-0000-4000-8000-000000000013';
const PNG=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAADCAIAAAA2iEnWAAAAFElEQVR4nGOUDJjGwMDAxAAGUAoAEsQBBc88udgAAAAASUVORK5CYII=','base64');
const checks=[],errors=[],runs=[];let browser,serial=0,phase='startup',fullscreenObserved='not tested';
const pass=label=>{checks.push(label);console.log('PASS '+label);};
const calls=(fixture,action)=>fixture.calls.filter(item=>item.action===action);
const saved=page=>page.waitForFunction(()=>document.querySelector('#save-status')?.dataset.state==='saved');
const editorReady=page=>page.waitForFunction(()=>!document.querySelector('#workspace')?.hidden&&!document.querySelector('#workspace')?.inert);
const opened=page=>page.waitForFunction(()=>document.querySelector('#presentation-dialog')?.open&&document.querySelector('#presentation-slide'));
const jumpValue=page=>page.locator('#presentation-jump').inputValue();
const presentText=page=>page.locator('#presentation-dialog').innerText();
const url=fixture=>STUDIO_BASE+`lesson-studio.html?class=${STUDIO_IDS.class}&lesson=${fixture.latest().lesson.id}&presentCase=${++serial}`;
async function snapshotBrowser(page){return page.evaluate(()=>({storage:JSON.stringify({local:{...localStorage},session:{...sessionStorage}}),writes:window.__presentationProbe.writes.length}));}
async function open({denyFullscreen=false,video=false}={}){
  const fixture=createStudioFixture({contentV2:true,media:true,recovery:false});
  const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block',storageState:studioStorageState()});
  await context.addInitScript(({denyFullscreen})=>{
    const probe={writes:[],created:[],revoked:[]};window.__presentationProbe=probe;
    for(const name of ['setItem','removeItem','clear']){const original=Storage.prototype[name];Storage.prototype[name]=function(...args){probe.writes.push(name);return original.apply(this,args);};}
    const create=URL.createObjectURL.bind(URL),revoke=URL.revokeObjectURL.bind(URL);
    URL.createObjectURL=value=>{const result=create(value);probe.created.push(result);return result;};URL.revokeObjectURL=value=>{probe.revoked.push(value);return revoke(value);};
    if(denyFullscreen)Element.prototype.requestFullscreen=function(){return Promise.reject(new DOMException('Isolated fullscreen rejection','NotAllowedError'));};
  },{denyFullscreen});
  await fixture.attach(context);const page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',error=>errors.push(error.message));page.on('dialog',dialog=>dialog.accept());
  const run={fixture,context,page,assetRequests:[]};runs.push(run);
  if(video){run.syntheticVideoRequests=[];await context.route('https://www.youtube-nocookie.com/embed/abcdefghijk?*',async route=>{run.syntheticVideoRequests.push(route.request().url());await route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Isolated original video fixture</title><p>Synthetic video frame; no network or real media.</p>'});});}
  page.on('request',request=>{if(request.method()==='GET'&&/\/functions\/v1\/lesson-api\/lessons\/[^/]+\/assets\//.test(request.url()))run.assetRequests.push({path:new URL(request.url()).pathname,authenticated:Boolean(request.headers().authorization?.startsWith('Bearer '))});});
  await page.goto(STUDIO_BASE+'lesson-studio.html?presentCase='+ ++serial);
  await page.waitForFunction(()=>document.querySelector('#class-select')?.value!==''&&!document.querySelector('#new-lesson')?.disabled);
  await page.locator('#new-lesson').click();
  for(const [id,value] of Object.entries({'new-title':'Original classroom presentation','new-objective':'Interpret an original symbolic and numerical example.','new-skill':'original-presentation-focus','new-summary':'Synthetic two-slide presentation fixture.'}))await page.locator('#'+id).fill(value);
  await page.locator('#create-lesson').click();await editorReady(page);await saved(page);
  const lesson=fixture.latest().lesson;
  fixture.assets.set(ASSET,{id:ASSET,asset_id:ASSET,lesson_id:lesson.id,organization_id:lesson.organization_id,class_id:lesson.class_id,uploaded_by:STUDIO_IDS.teacher,state:'ready',original_name:'original-presentation.png',mime_type:'image/png',byte_length:PNG.length,width:2,height:3,sha256:createHash('sha256').update(PNG).digest('hex')});fixture.assetBytes.set(ASSET,Uint8Array.from(PNG));
  fixture.advanceServer(document=>{document.slides=[
    {id:'presentation-first',title:'Original first classroom slide',layout:'single',blocks:[
      {id:'presentation-text',type:'rich-text',version:2,content:{nodes:[{type:'paragraph',children:[{type:'text',text:FIRST}]}]}},
      {id:'presentation-math',type:'math',version:2,content:{source:{mode:'tex',tex:'x^2+1'},spoken:'x squared plus one',display:true}},
      {id:'presentation-table',type:'table',version:1,content:{caption:'Original observation table',columns:[{id:'input',label:'Input'},{id:'output',label:'Value'}],rows:[{id:'sample',cells:[[{type:'text',text:'2'}],[{type:'text',text:'5'}]]}],row_header:true}}
    ]},
    {id:'presentation-second',title:'Original second classroom slide',layout:'single',blocks:[
      {id:'presentation-second-text',type:'rich-text',version:1,content:{paragraphs:[{type:'paragraph',children:[{type:'text',text:SECOND}]}]}},
      {id:'presentation-image',type:'image',version:1,content:{asset_id:ASSET,alt:'An original blue classroom example rectangle.',decorative:false,caption:'Original private classroom image',description:'A synthetic image for authenticated reveal testing.'}}
    ]}
  ];if(video)document.slides[0].blocks.push({id:'presentation-editor-video',type:'video',version:1,content:{provider:'youtube',video_id:'abcdefghijk',title:'Original editor video fixture',start_seconds:0,transcript:'A synthetic video used to verify editor media disposal.'}});});
  await page.goto(url(fixture));await editorReady(page);await saved(page);await page.locator('#private-notes').fill(NOTE);await saved(page);await page.locator('#private-notes').evaluate(node=>node.blur());await editorReady(page);return run;
}
async function present(page){await page.locator('#present-lesson').click();await opened(page);assert.equal((await presentText(page)).includes(NOTE),false);}
async function end(page){await page.locator('#presentation-end').click();await page.locator('#presentation-dialog').waitFor({state:'hidden'});await editorReady(page);assert.equal(await page.locator('#presentation-dialog').innerHTML(),'');}
async function reveal(page){await page.locator('#presentation-reveal').click();}
async function focusSlide(page){await page.locator('#presentation-slide').focus();}
async function choose(page,index){await page.locator('#presentation-jump').selectOption(String(index));await page.waitForFunction(expected=>document.querySelector('#presentation-jump')?.value===String(expected),index);}
async function opaque(page){
  assert.equal(await page.locator('#workspace').evaluate(node=>node.inert),true);
  assert.equal(await page.locator('#presentation-dialog').evaluate(node=>{const rect=node.getBoundingClientRect();return rect.left<=1&&rect.top<=1&&rect.right>=innerWidth-1&&rect.bottom>=innerHeight-1;}),true);
  assert.equal(await page.evaluate(()=>{const dialog=document.querySelector('#presentation-dialog');const c=getComputedStyle(dialog,'::backdrop').backgroundColor;return dialog.open&&c!=='transparent'&&c!=='rgba(0, 0, 0, 0)'&&(!c.startsWith('rgba')||/,\s*1\)$/.test(c));}),true);
  assert.equal((await presentText(page)).includes(NOTE),false);
}
try{
  browser=await chromium.launch({headless:true,executablePath:process.env.ECHS_CHROMIUM_PATH||undefined});
  phase='composition guard';const run=await open(),{page,fixture}=run;
  await page.locator('#slide-title').focus();await page.locator('#slide-title').dispatchEvent('compositionstart');await page.locator('#slide-title').fill('Composed classroom title');
  assert.equal(await page.locator('#present-lesson').isDisabled(),true);await page.locator('#present-lesson').dispatchEvent('click');assert.equal(await page.locator('#presentation-dialog').isHidden(),true);
  await page.locator('#slide-title').dispatchEvent('compositionend');await saved(page);assert.equal(fixture.latest().head.document.slides[0].title,'Composed classroom title');
  pass('presentation waits for IME composition to commit instead of presenting a partial accepted field');

  phase='save before presentation';const heldSave=fixture.holdNext('save');await page.locator('#slide-title').fill('Saved before classroom presentation');
  const entering=page.locator('#present-lesson').click();await heldSave.started;assert.equal(await page.locator('#presentation-dialog').isHidden(),true);heldSave.release();await entering;await opened(page);
  assert.equal(fixture.latest().head.document.slides[0].title,'Saved before classroom presentation');assert.match(await presentText(page),/Saved before classroom presentation/);await opaque(page);
  assert.equal(await jumpValue(page),'0');assert.equal((await presentText(page)).includes(FIRST),false);assert.equal(await page.locator('#presentation-slide .katex').count(),0);assert.equal(await page.locator('#presentation-slide table').count(),0);
  pass('opening presentation waits for the acknowledged save and a fresh read, locks the editor and initially reveals no blocks or private notes');

  const during=await snapshotBrowser(page),callStart=fixture.calls.length,revision=fixture.latest().lesson.head_revision;
  phase='reveal and keyboard';assert.equal(await page.locator('#presentation-previous').isDisabled(),true);await focusSlide(page);await page.keyboard.press('ArrowLeft');assert.equal(await jumpValue(page),'0');
  await page.keyboard.press('Space');assert.match(await presentText(page),new RegExp(FIRST));assert.equal(await page.locator('#presentation-slide .katex').count(),0);
  await reveal(page);assert.ok(await page.locator('#presentation-slide .katex').count());assert.equal(await page.locator('#presentation-slide table').count(),0);await reveal(page);
  assert.equal(await page.locator('#presentation-slide table').count(),1);assert.equal(await page.locator('#presentation-slide th[scope=row]').count(),1);assert.equal(await page.locator('#presentation-reveal').isDisabled(),true);
  await focusSlide(page);await page.keyboard.press('PageDown');assert.equal(await jumpValue(page),'1');assert.equal((await presentText(page)).includes(SECOND),false);assert.equal(await page.locator('#presentation-next').isDisabled(),true);
  await page.keyboard.press('ArrowRight');assert.equal(await jumpValue(page),'1');await reveal(page);assert.match(await presentText(page),new RegExp(SECOND));
  await focusSlide(page);await page.keyboard.press('PageUp');assert.equal(await jumpValue(page),'0');assert.equal(await page.locator('#presentation-slide table').count(),1);
  pass('one-block reveals render actual mathematics and semantic tables; keyboard navigation respects bounds and retains each slide reveal count');

  phase='jump and reset';await choose(page,1);assert.match(await presentText(page),new RegExp(SECOND));await page.locator('#presentation-reset').click();assert.equal((await presentText(page)).includes(SECOND),false);
  await choose(page,0);assert.equal(await page.locator('#presentation-slide table').count(),1);await page.locator('#presentation-reset').click();assert.equal((await presentText(page)).includes(FIRST),false);assert.equal(await page.locator('#presentation-slide .katex, #presentation-slide table').count(),0);
  await page.locator('#presentation-jump').focus();await page.keyboard.press('Space');assert.equal((await presentText(page)).includes(FIRST),false);await page.keyboard.press('Enter');
  assert.equal(await page.locator('#presentation-dialog').evaluate(node=>node.open),true);await opaque(page);
  pass('jump uses explicit slide indexes, reset affects only the current slide, and keyboard interactions with controls never reveal hidden content');

  phase='no presentation persistence';await focusSlide(page);await page.keyboard.press('Control+z');assert.equal(fixture.latest().lesson.head_revision,revision);
  const after=await snapshotBrowser(page);assert.equal(after.storage,during.storage);assert.equal(after.writes,during.writes);
  assert.equal(fixture.calls.slice(callStart).some(item=>item.method==='POST'),false);assert.equal((await presentText(page)).includes(NOTE),false);
  pass('presentation navigation, reveal, reset and keyboard controls produce no draft, workflow, progress, mastery or browser-storage writes');

  phase='fresh editor on end';fixture.advanceServer(document=>{document.slides[0].title='A newer server draft during presentation';});assert.equal((await presentText(page)).includes('A newer server draft during presentation'),false);
  await end(page);assert.equal(await page.locator('#slide-title').inputValue(),'A newer server draft during presentation');assert.equal(await page.locator('#private-notes').inputValue(),NOTE);assert.equal(await page.locator('#present-lesson').evaluate(node=>node===document.activeElement),true);
  pass('the presentation snapshot stays fixed while the server changes; ending reads the latest draft, restores the safe editor and returns focus');

  phase='fresh read before presentation';const fresh=await open();fresh.fixture.advanceServer(document=>{document.slides[0].title='Fresh server title before presenting';});const getBefore=calls(fresh.fixture,'get').length;await present(fresh.page);assert.ok(calls(fresh.fixture,'get').length>getBefore);assert.match(await presentText(fresh.page),/Fresh server title before presenting/);await end(fresh.page);
  pass('a fresh authorized GET determines presentation content even when the editor previously held an older acknowledged draft');

  phase='save failure';const failedSave=await open();failedSave.fixture.failNext('save',{network:true});await failedSave.page.locator('#slide-title').fill('Unacknowledged presentation edit');await failedSave.page.locator('#present-lesson').click();
  await failedSave.page.waitForFunction(()=>['offline','conflict','invalid'].includes(document.querySelector('#save-status')?.dataset.state));assert.equal(await failedSave.page.locator('#presentation-dialog').isHidden(),true);assert.notEqual(failedSave.fixture.latest().head.document.slides[0].title,'Unacknowledged presentation edit');
  pass('an unacknowledged save prevents presentation and retains the edit for ordinary recovery');

  phase='initial GET failure';const failedGet=await open();failedGet.fixture.failNext('get',{status:503,code:'service_unavailable'});await failedGet.page.locator('#present-lesson').click();await editorReady(failedGet.page);assert.equal(await failedGet.page.locator('#presentation-dialog').isHidden(),true);assert.equal(await failedGet.page.locator('#private-notes').inputValue(),NOTE);
  pass('a failed fresh GET prevents presentation while preserving the currently authorized editor');

  phase='initial GET scope denial';for(const status of [403,404]){const refused=await open();refused.fixture.failNext('get',{status,code:status===403?'scope_denied':'not_found'});await refused.page.locator('#present-lesson').click();await refused.page.waitForFunction(()=>document.querySelector('#studio-app').hidden);assert.equal(await refused.page.locator('#presentation-dialog').innerHTML(),'');assert.equal(await refused.page.locator('#private-notes').inputValue(),'');assert.equal(await refused.page.locator('#slide-canvas').textContent(),'');}
  pass('initial fresh GET authorization or whole-lesson scope denial clears all private editor and presentation content');

  phase='loaded editor video cleanup';const videoRun=await open({video:true});const videoResponse=videoRun.page.waitForResponse(response=>response.url().startsWith('https://www.youtube-nocookie.com/embed/abcdefghijk?'));await videoRun.page.locator('#slide-canvas').getByRole('button',{name:'Load external video',exact:true}).click();assert.equal((await videoResponse).status(),200);await videoRun.page.waitForFunction(()=>Boolean(document.querySelector('#slide-canvas iframe')));const oldFrame=await videoRun.page.locator('#slide-canvas iframe').elementHandle();assert.equal(videoRun.syntheticVideoRequests.length,1);await present(videoRun.page);assert.equal(await videoRun.page.locator('#slide-canvas iframe').count(),0);assert.equal(await oldFrame.evaluate(node=>node.isConnected),false);assert.equal(await videoRun.page.locator('#slide-canvas').textContent(),'');assert.equal(await videoRun.page.locator('#presentation-dialog iframe').count(),0);await end(videoRun.page);assert.equal(await videoRun.page.locator('#slide-canvas iframe').count(),0);assert.equal(videoRun.syntheticVideoRequests.length,1);await oldFrame.dispose();
  pass('opening disposes a loaded editor video before presentation; returning rebuilds an unloaded preview without restarting the external frame');

  phase='authenticated media reveal';const media=await open();await present(media.page);const assetBefore=calls(media.fixture,'asset_read').length+calls(media.fixture,'asset_bytes').length;await choose(media.page,1);
  assert.equal(calls(media.fixture,'asset_read').length+calls(media.fixture,'asset_bytes').length,assetBefore);await reveal(media.page);assert.equal(calls(media.fixture,'asset_read').length+calls(media.fixture,'asset_bytes').length,assetBefore);
  await reveal(media.page);await media.page.waitForFunction(()=>document.querySelector('#presentation-slide img')?.naturalWidth===2);assert.ok(calls(media.fixture,'asset_read').length&&calls(media.fixture,'asset_bytes').length);assert.ok(media.assetRequests.every(item=>item.authenticated));assert.equal(await media.page.locator('#presentation-slide img').getAttribute('alt'),'An original blue classroom example rectangle.');
  await media.page.locator('#presentation-reset').click();assert.equal(await media.page.locator('#presentation-slide img').count(),0);assert.ok(await media.page.evaluate(()=>window.__presentationProbe.revoked.length>0));
  pass('private image metadata and verified bytes are requested with school authentication only after its block is revealed; reset disposes the image and blob URL');

  phase='late media reset';await reveal(media.page);const lateBytes=media.fixture.holdNext('asset_bytes');await reveal(media.page);await lateBytes.started;await media.page.locator('#presentation-reset').click();lateBytes.release();await media.page.waitForTimeout(300);assert.equal(await media.page.locator('#presentation-slide img').count(),0);assert.equal((await presentText(media.page)).includes(SECOND),false);
  await reveal(media.page);const navigatingBytes=media.fixture.holdNext('asset_bytes');await reveal(media.page);await navigatingBytes.started;await choose(media.page,0);navigatingBytes.release();await media.page.waitForTimeout(300);assert.equal(await jumpValue(media.page),'0');assert.equal(await media.page.locator('#presentation-slide img').count(),0);
  pass('reset and slide navigation discard late authenticated image responses so hidden or old slide media cannot reappear');

  phase='fullscreen rejection';const denied=await open({denyFullscreen:true});await present(denied.page);await denied.page.locator('#presentation-fullscreen').click();await denied.page.waitForFunction(()=>document.querySelector('#presentation-status')?.textContent.includes('Full screen is unavailable'));
  assert.equal(await denied.page.evaluate(()=>document.fullscreenElement===null),true);await opaque(denied.page);await end(denied.page);
  pass('a rejected fullscreen request keeps the opaque presentation modal open without exposing the private editor');

  phase='native fullscreen and mobile';await choose(media.page,0);await reveal(media.page);await opaque(media.page);await media.page.screenshot({path:path.join(output,'studio-presentation-desktop.png')});
  const supports=await media.page.evaluate(()=>document.fullscreenEnabled&&typeof Element.prototype.requestFullscreen==='function');
  if(supports){await media.page.locator('#presentation-fullscreen').click();await media.page.waitForFunction(()=>Boolean(document.fullscreenElement));fullscreenObserved='native fullscreen entered and exited';assert.equal(await media.page.evaluate(()=>document.querySelector('#presentation-dialog').contains(document.fullscreenElement)),true);await media.page.locator('#presentation-fullscreen').click();await media.page.waitForFunction(()=>document.fullscreenElement===null);await opaque(media.page);}
  else{fullscreenObserved='native fullscreen unavailable on this browser';assert.equal(await media.page.locator('#presentation-dialog').evaluate(node=>node.open),true);}
  await media.page.setViewportSize({width:430,height:960});assert.equal(await media.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await opaque(media.page);await media.page.screenshot({path:path.join(output,'studio-presentation-mobile.png')});await end(media.page);
  pass('native fullscreen exits into the still-opaque modal, and the classroom surface fits desktop and mobile widths');

  phase='late asset account switch';const switched=await open();await present(switched.page);await choose(switched.page,1);await reveal(switched.page);const switchedBytes=switched.fixture.holdNext('asset_bytes');await reveal(switched.page);await switchedBytes.started;
  await switched.page.evaluate(({account,token})=>ECHSInstitution.setSession({account,token,expires_at:'2099-01-01T00:00:00.000Z'},true),{account:switched.fixture.accountFor('other'),token:switched.fixture.tokenFor('other')});
  await switched.page.waitForFunction(()=>document.querySelector('#studio-app').hidden);switchedBytes.release();await switched.page.waitForTimeout(300);assert.equal(await switched.page.locator('#presentation-dialog').innerHTML(),'');assert.equal(await switched.page.locator('#private-notes').inputValue(),'');assert.equal(await switched.page.locator('#slide-canvas').textContent(),'');assert.equal(await switched.page.evaluate(()=>ECHSInstitution.account().id),STUDIO_IDS.other);
  pass('an account switch disposes presentation and pending media, clears private fields and leaves the successor account untouched');

  phase='close GET failure';const failedClose=await open();await present(failedClose.page);failedClose.fixture.failNext('get',{status:503,code:'service_unavailable'});await failedClose.page.locator('#presentation-end').click();await failedClose.page.waitForFunction(()=>document.querySelector('#studio-app').hidden);assert.equal(await failedClose.page.locator('#presentation-dialog').innerHTML(),'');assert.equal(await failedClose.page.locator('#private-notes').inputValue(),'');
  pass('a failed authorization/state refresh after ending never reopens an unchecked private editor');

  for(const item of runs){assert.deepEqual(item.fixture.external,[]);assert.equal(item.fixture.calls.some(call=>/mastery|learning-sync|completion|progress/.test(call.path||'')),false);assert.equal(item.fixture.rpcCalls.some(call=>/publish|approve|restore|review|unpublish/.test(call.action||'')),false);}
  assert.deepEqual(errors,[]);pass('all integrated presentation scenarios stay in isolated original fixtures with no publication, assessment, mastery or external requests');
}catch(error){console.error(JSON.stringify({phase,message:error.message,errors,last:await runs.at(-1)?.page.evaluate(()=>({status:document.querySelector('#library-status')?.textContent,save:document.querySelector('#save-status')?.textContent,canvas:document.querySelector('#slide-canvas')?.innerHTML})).catch(()=>null),calls:runs.at(-1)?.fixture.calls.slice(-4)}));throw error;}finally{
  await writeFile(path.join(output,'studio-presentation-browser.json'),JSON.stringify({suite:'ECHS-013 integrated classroom presentation',checks,errors,passed:checks.length,expected:18,status:checks.length===18&&!errors.length?'PASS':'FAIL',phase,fullscreen_observed:fullscreenObserved,production_calls:false,scope:'Real browser, original institution client, Studio client and HTTP handler with in-memory RPC/asset fixtures and an intercepted synthetic video frame; no production account, database or external network calls.'},null,2)+'\n');
  for(const run of runs)await run.context.close();await browser?.close();
}
