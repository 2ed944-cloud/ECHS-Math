import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';

const repository=fileURLToPath(new URL('../../',import.meta.url));
const require=createRequire(new URL('../../question-bank/official/tools/package.json',import.meta.url));
const {chromium}=require('playwright'),origin='https://ib13-import-fixture.example.test';
const output=path.join(repository,'artifacts/lesson-import'),checks=[],errors=[],external=[],writes=[],paths=[];
const pass=label=>{checks.push(label);console.log('PASS '+label);};
const source=`import {openIB13ImportDialog} from '/js/lesson-studio/import-dialog.mjs';
import {IB13_REFERENCE} from '/js/lesson-studio/ib13-reference.mjs';
import {createIB13Import} from '/js/lesson-studio/ib13-import-model.mjs';
import {createLessonDraft} from '/js/lesson-studio/draft-model.mjs';
import katex from '/lessons/ib-math-ai/unit-1/assets/js/katex.js';
let api=null,current=true,reentrant=false,guardCalls=0,old=[],results=[],failRender=false;
const engine={version:katex.version,renderToString:(...args)=>katex.renderToString(...args),render:(...args)=>{if(failRender)throw new Error('Synthetic preview-only failure');return katex.render(...args);}};
const ref=IB13_REFERENCE;
function base(){return createLessonDraft({lessonId:'80000000-0000-4000-8000-000000000001',courseVersionId:ref.source.courseVersionId,catalog:{unit_id:ref.source.unitId,topic_id:ref.source.topicId,access_key:ref.source.accessKey,course_key:ref.source.courseKey,route_path:ref.source.path},title:'Original teacher import draft',objective:'Explain geometric sequences.',skill:'teacher:geometric-sequences',summary:'Original teacher review fixture.'});}
function guard(){guardCalls++;if(reentrant){api?.dispose();return false;}return current;}
function open(value=base(),selection){return openIB13ImportDialog({dialog:document.querySelector('#ib13-import-dialog'),baseDocument:value,selectedSlideIds:selection,mathEngine:engine,isCurrent:guard});}
window.fixture={ready:true,
 metadata:{source:ref.source,slides:ref.slides.map(({id,sourceIndex,title,disposition,reason})=>({id,sourceIndex,title,disposition,reason}))},
 mount(selection){current=true;reentrant=false;old.push(api);const value=base(),before=JSON.stringify(value);api=open(value,selection);api.closed.then(value=>results.push({value,frozen:value===null||Object.isFrozen(value)&&Object.isFrozen(value.selectedSlideIds)}));return {keys:Object.keys(api),sourceUnchanged:before===JSON.stringify(value)};},
 invalid(selection,privateField=false){const value=base();if(privateField)value.private_notes='PRIVATE_TEACHER_NOTES';let rejected=false;try{open(value,selection)}catch{rejected=true;}return rejected;},
 denied(){current=false;let rejected=false;try{open()}catch{rejected=true;}current=true;return rejected;},
 rebuild(selection){const result=createIB13Import({baseDocument:base(),selectedSlideIds:selection,mathEngine:katex});return {summary:result.summary,slides:result.document.slides.map(({id,blocks})=>({id,types:blocks.map(b=>b.type)})),publication:result.document.publication};},
 state(){return {guardCalls,results:results.map(item=>({...item})),open:document.querySelector('#ib13-import-dialog').open};},
 revoke(){current=false;},dispose(){api?.dispose();},disposeOld(){old.at(-1)?.dispose();},reentrantDispose(){reentrant=true;api.dispose();},failPreview(value){failRender=value;},
 retain(){this.retained={heading:document.querySelector('#ib13-import-preview h2'),checkbox:document.querySelector('[data-import-select]'),use:document.querySelector('#ib13-import-use'),source:document.querySelector('#ib13-import-source')};},
 retainedState(){const r=this.retained;return {heading:r.heading?.textContent||'',checked:r.checkbox.checked,disabled:r.checkbox.disabled,href:r.source.getAttribute('href'),use:r.use.textContent};},
 late(){this.retained.checkbox.checked=true;this.retained.checkbox.dispatchEvent(new Event('change',{bubbles:true}));this.retained.use.dispatchEvent(new MouseEvent('click',{bubbles:true}));},
 keepPreview(){this.oldPreview=document.querySelector('#ib13-import-preview h2');},previewCleared(){return this.oldPreview?.textContent==='';}
};`;
const browser=await chromium.launch({headless:true,executablePath:process.env.ECHS_CHROMIUM_PATH||undefined});
const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
await context.route('**/*',async route=>{
 const request=route.request(),url=new URL(request.url());paths.push(url.pathname);if(!['GET','HEAD'].includes(request.method()))writes.push({url:url.href,method:request.method()});
 if(url.origin!==origin){external.push(url.href);return route.abort();}
 if(url.pathname==='/fixture.html')return route.fulfill({contentType:'text/html',body:'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>IB import review fixture</title><link rel="stylesheet" href="/css/lesson-import.css"><link rel="stylesheet" href="/lessons/ib-math-ai/unit-1/assets/css/katex.css"></head><body><main><h1>Teacher workspace</h1><p>PRIVATE_TEACHER_NOTES outside the review dialog</p><button id="open">Open review fixture</button><dialog id="ib13-import-dialog"></dialog></main><script type="module" src="/fixture.mjs"></script></body></html>'});
 if(url.pathname==='/fixture.mjs')return route.fulfill({contentType:'text/javascript',body:source});
 const file=path.resolve(repository,'.'+decodeURIComponent(url.pathname));if(!file.startsWith(path.resolve(repository)+path.sep))return route.fulfill({status:403,body:''});
 try{return route.fulfill({contentType:/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.woff2')?'font/woff2':'application/octet-stream',body:await readFile(file)});}catch{return route.fulfill({status:404,body:''});}
});
const page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',error=>errors.push(error.message));
const mount=async selection=>{await page.evaluate(value=>fixture.mount(value),selection);await page.locator('#ib13-import-list').waitFor();};
const rows=()=>page.locator('[data-import-slide-id]'),boxes=()=>page.locator('[data-import-select]');
try{
 await page.goto(origin+'/fixture.html');await page.waitForFunction(()=>window.fixture?.ready);
 const metadata=await page.evaluate(()=>fixture.metadata),eligible=metadata.slides.filter(row=>row.disposition==='native'),references=metadata.slides.filter(row=>row.disposition==='reference');
 assert.equal(metadata.slides.length,78);assert.ok(eligible.length>1);assert.equal(eligible.length+references.length,78);
 await page.locator('#open').focus();const initial=await page.evaluate(()=>fixture.mount());assert.deepEqual(initial.keys,['closed','dispose']);assert.equal(initial.sourceUnchanged,true);
 assert.equal(await page.locator('#ib13-import-dialog').evaluate(node=>node.matches(':modal')),true);assert.equal(await page.locator('#ib13-import-dialog').evaluate(node=>getComputedStyle(node).backgroundColor),'rgb(255, 255, 255)');
 assert.equal(await rows().count(),78);assert.equal(await boxes().count(),eligible.length);assert.equal(await page.locator('[data-import-select]:checked').count(),eligible.length);
 assert.deepEqual(await rows().evaluateAll(nodes=>nodes.map(n=>n.dataset.importSlideId)),metadata.slides.map(row=>row.id));
 assert.deepEqual(await page.locator('.lesson-import-row-title').allTextContents(),metadata.slides.map(row=>row.sourceIndex+'. '+row.title));
 assert.deepEqual(await page.locator('.lesson-import-reason').allTextContents(),metadata.slides.map(row=>row.reason));
 assert.match(await page.locator('#ib13-import-summary').innerText(),new RegExp(eligible.length+' editable slides and '+references.length+' references'));
 assert.equal(await page.locator('#ib13-import-preview h2').count(),1);assert.equal(await page.locator('#ib13-import-dialog').getAttribute('aria-labelledby'),'ib13-import-heading');
 pass('all 78 ordered source indices, titles and reasons remain visible, with every eligible native option selected and only one preview rendered');

 const link=page.locator('#ib13-import-source');assert.equal(await link.getAttribute('href'),origin+'/'+metadata.source.path+'#learn');assert.equal(await link.getAttribute('target'),'_blank');assert.equal(await link.getAttribute('rel'),'noopener noreferrer');
 assert.match(await page.locator('.lesson-import-publication').innerText(),/References must be resolved/);assert.match(await page.locator('#ib13-import-description').innerText(),/Original investigations, questions and calculator activities/);
 assert.equal((await page.locator('#ib13-import-dialog').innerText()).includes('PRIVATE_TEACHER_NOTES'),false);assert.equal(await page.locator('#ib13-import-dialog iframe,#ib13-import-dialog video,#ib13-import-dialog img').count(),0);
 pass('the only original-lesson link is the fixed same-site guarded route; draft publication limits and original interactive behavior are explicit without private notes or media embeds');

 await page.evaluate(()=>fixture.keepPreview());await page.locator('[data-import-preview="'+eligible[1].id+'"]').click();assert.equal(await page.evaluate(()=>fixture.previewCleared()),true);assert.equal(await page.locator('#ib13-import-preview h2').count(),1);
 assert.equal(await page.locator('#ib13-import-preview-heading').innerText(),'Source slide '+eligible[1].sourceIndex+': '+eligible[1].title);
 let mathPreview;for(const row of eligible){await page.locator('[data-import-preview="'+row.id+'"]').click();if(await page.locator('#ib13-import-preview .katex').count()){mathPreview=row;break;}}
 assert.ok(mathPreview);assert.equal(await page.locator('#ib13-import-preview .katex-error').count(),0);
 pass('switching the single native preview clears retained outgoing nodes and renders original canonical mathematics with local KaTeX');

 await page.evaluate(()=>fixture.failPreview(true));await page.locator('[data-import-preview="'+mathPreview.id+'"]').click();assert.equal(await page.locator('#ib13-import-use').isDisabled(),true);assert.match(await page.locator('#ib13-import-error').innerText(),/preview is unavailable/);
 await page.locator('[data-import-select="'+eligible[0].id+'"]').uncheck();assert.equal(await page.locator('#ib13-import-use').isDisabled(),true);assert.match(await page.locator('#ib13-import-error').innerText(),/preview is unavailable/);await page.locator('#ib13-import-use').dispatchEvent('click');assert.equal((await page.evaluate(()=>fixture.state())).open,true);
 await page.locator('[data-import-preview="'+references[0].id+'"]').click();assert.equal(await page.locator('#ib13-import-use').isDisabled(),true);await page.evaluate(()=>fixture.failPreview(false));await page.locator('[data-import-preview="'+mathPreview.id+'"]').click();assert.equal(await page.locator('#ib13-import-use').isEnabled(),true);assert.equal(await page.locator('#ib13-import-error').innerText(),'');await page.locator('#ib13-import-select-all').click();
 pass('a rendering failure keeps confirmation blocked across selection changes and reference views until a native preview succeeds');

 await page.locator('[data-import-preview="'+references[0].id+'"]').click();assert.equal(await page.locator('#ib13-import-preview h2').count(),0);assert.match(await page.locator('#ib13-import-preview-status').innerText(),/Kept as a reference/);assert.ok((await page.locator('#ib13-import-preview').innerText()).includes(references[0].reason));
 assert.equal(await page.locator('#ib13-import-preview input,#ib13-import-preview iframe').count(),0);
 pass('reference previews show the source disposition and reason without running original activities or questions');

 const selected=eligible[0];await page.locator('[data-import-preview="'+selected.id+'"]').click();await page.locator('[data-import-select="'+selected.id+'"]').uncheck();assert.match(await page.locator('#ib13-import-preview-status').innerText(),/Preview only/);
 await page.locator('#ib13-import-clear-selection').click();assert.equal(await page.locator('#ib13-import-use').isDisabled(),true);assert.match(await page.locator('#ib13-import-error').innerText(),/Select at least one/);await page.locator('#ib13-import-use').dispatchEvent('click');assert.equal((await page.evaluate(()=>fixture.state())).open,true);
 await page.locator('[data-import-select="'+selected.id+'"]').focus();await page.keyboard.press('Space');assert.equal(await page.locator('#ib13-import-use').isEnabled(),true);assert.match(await page.locator('#ib13-import-summary').innerText(),/1 editable slide and 77 references/);
 pass('unchecked native content becomes a reference, zero selection cannot confirm, and keyboard selection restores a valid one-slide choice');

 const priorResults=(await page.evaluate(()=>fixture.state())).results.length;await page.locator('#ib13-import-use').click();await page.waitForFunction(count=>fixture.state().results.length>count,priorResults);const outcome=(await page.evaluate(()=>fixture.state())).results.at(-1);
 assert.deepEqual(outcome,{value:{selectedSlideIds:[selected.id]},frozen:true});assert.equal(await page.locator('#ib13-import-dialog').innerHTML(),'');assert.equal(await page.locator('#open').evaluate(node=>document.activeElement===node),true);
 const rebuilt=await page.evaluate(ids=>fixture.rebuild(ids),[selected.id]);assert.equal(rebuilt.slides.length,78);assert.equal(rebuilt.summary.nativeSlides,1);assert.equal(rebuilt.summary.referenceSlides,77);assert.deepEqual(rebuilt.slides.map(row=>row.id),metadata.slides.map(row=>row.id));assert.equal(rebuilt.publication.status,'draft');assert.equal(rebuilt.slides.filter(row=>row.types.includes('legacy-embedded')).length,77);
 pass('confirmation returns only frozen validated source IDs; rebuilding retains every source position and unresolved reference without saving or publishing');

 await mount();const priorHTML=await page.locator('#ib13-import-dialog').innerHTML();for(const invalid of [[],[selected.id,selected.id],['unknown-source-slide'],[references[0].id]])assert.equal(await page.evaluate(ids=>fixture.invalid(ids),invalid),true);
 assert.equal(await page.evaluate(()=>fixture.invalid(undefined,true)),true);assert.equal(await page.locator('#ib13-import-dialog').innerHTML(),priorHTML);assert.equal((await page.evaluate(()=>fixture.state())).open,true);
 pass('invalid, duplicate, foreign and reference-only selections or private document fields reject before replacing an active review');

 await page.locator('#ib13-import-heading').focus();await page.keyboard.press('Tab');assert.equal(await page.locator('#ib13-import-cancel').evaluate(node=>node===document.activeElement),true);await page.keyboard.press('Escape');await page.waitForFunction(()=>!fixture.state().open);assert.equal((await page.evaluate(()=>fixture.state())).results.at(-1).value,null);
 await mount([selected.id]);assert.equal(await page.locator('[data-import-select]:checked').count(),1);await page.locator('#ib13-import-select-all').click();assert.equal(await page.locator('[data-import-select]:checked').count(),eligible.length);await page.locator('#ib13-import-cancel').click();assert.equal((await page.evaluate(()=>fixture.state())).results.at(-1).value,null);
 pass('native Escape and explicit cancellation return no selection, while accessible focus and select-all controls preserve explicit initial choices');

 await mount();await page.evaluate(()=>fixture.retain());await page.evaluate(()=>fixture.revoke());await page.waitForFunction(()=>!fixture.state().open);assert.equal(await page.locator('#ib13-import-dialog').innerHTML(),'');assert.deepEqual(await page.evaluate(()=>fixture.retainedState()),{heading:'',checked:false,disabled:true,href:null,use:''});const revokedCount=(await page.evaluate(()=>fixture.state())).results.length;await page.evaluate(()=>fixture.late());assert.equal((await page.evaluate(()=>fixture.state())).results.length,revokedCount);assert.equal((await page.evaluate(()=>fixture.state())).results.at(-1).value,null);
 pass('account revocation automatically closes the review, clears retained content and source links, and ignores detached late controls');

 await mount();await page.evaluate(()=>fixture.reentrantDispose());assert.equal(await page.locator('#ib13-import-dialog').innerHTML(),'');assert.equal((await page.evaluate(()=>fixture.state())).results.at(-1).value,null);
 assert.equal(await page.evaluate(()=>fixture.denied()),true);assert.equal(await page.locator('#ib13-import-dialog').innerHTML(),'');
 pass('reentrant parent disposal and an initially denied owner fail closed without recursion, private DOM or a selected result');

 await mount();await mount([selected.id]);await page.evaluate(()=>fixture.disposeOld());await page.waitForTimeout(60);assert.equal((await page.evaluate(()=>fixture.state())).open,true);assert.equal(await rows().count(),78);assert.equal(await page.locator('[data-import-select]:checked').count(),1);await page.locator('#ib13-import-cancel').click();
 const stopped=(await page.evaluate(()=>fixture.state())).guardCalls;await page.waitForTimeout(300);assert.equal((await page.evaluate(()=>fixture.state())).guardCalls,stopped);
 pass('replacing an active review ignores an older queued native close event and disposal removes the ownership polling timer');

 await mount();await page.evaluate(()=>document.querySelector('#ib13-import-dialog').close());await page.waitForFunction(()=>document.querySelector('#ib13-import-dialog').innerHTML==='');assert.equal((await page.evaluate(()=>fixture.state())).results.at(-1).value,null);
 await mount();await page.evaluate(()=>{const dialog=document.querySelector('#ib13-import-dialog');window.removedDialog=dialog;dialog.remove();});await page.waitForFunction(()=>window.removedDialog.innerHTML==='');await page.evaluate(()=>document.querySelector('main').append(window.removedDialog));assert.equal((await page.evaluate(()=>fixture.state())).results.at(-1).value,null);
 pass('external native close or removal of the dialog disposes its preview and returns cancellation');

 await mount();await page.locator('[data-import-preview="'+eligible[1].id+'"]').click();await mkdir(output,{recursive:true});await page.screenshot({path:path.join(output,'import-dialog-desktop.png')});
 await page.setViewportSize({width:375,height:812});await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#ib13-import-use').focus();await page.keyboard.press('Tab');await page.locator('#ib13-import-cancel').focus();
 const geometry=await page.evaluate(()=>({width:innerWidth,height:innerHeight,dialog:document.querySelector('#ib13-import-dialog').getBoundingClientRect().toJSON(),controls:['ib13-import-cancel','ib13-import-use','ib13-import-clear-selection','ib13-import-select-all'].map(id=>document.getElementById(id).getBoundingClientRect().toJSON()),outline:getComputedStyle(document.activeElement).outlineStyle,ledger:document.querySelector('.lesson-import-ledger').getBoundingClientRect().toJSON()}));
 assert.ok(geometry.dialog.left>=0&&geometry.dialog.right<=geometry.width+1&&geometry.dialog.top>=0&&geometry.dialog.bottom<=geometry.height+1);assert.ok(geometry.controls.every(r=>r.left>=0&&r.right<=geometry.width+1&&r.width>0&&r.bottom<=geometry.height+1));assert.ok(geometry.ledger.height>=150);assert.equal(geometry.outline,'solid');
 await page.screenshot({path:path.join(output,'import-dialog-mobile.png')});
 pass('the full ledger, one preview and primary controls remain bounded and keyboard accessible on desktop and mobile with reduced motion');

 await page.locator('#ib13-import-cancel').click();assert.equal(await page.locator('#ib13-import-dialog').innerHTML(),'');assert.deepEqual(await page.evaluate(()=>[Object.keys(localStorage),Object.keys(sessionStorage)]),[[],[]]);assert.deepEqual(errors,[]);assert.deepEqual(external,[]);assert.deepEqual(writes,[]);assert.equal(paths.includes('/'+metadata.source.path),false);assert.equal(paths.some(p=>/lesson-api|question-bank|practice/.test(p)),false);
 pass('the review makes no external, original-lesson, question, account or write requests and persists no browser data');
 await writeFile(path.join(output,'import-dialog-browser.json'),JSON.stringify({ok:true,groups:checks.length,checks,native_options:eligible.length,reference_options:references.length,source_slides:metadata.slides.length,browser_errors:errors,external_requests:external,write_requests:writes,scope:'Actual Chromium with local canonical IB13 reference/model and local KaTeX, synthetic unsaved staff document and injected owner guard. No production account/API, question bank, source activity execution, saving, publication or student-route authority is claimed.'},null,2)+'\n');
}finally{await context.close();await browser.close();}
