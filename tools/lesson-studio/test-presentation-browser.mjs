import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';

const repository=fileURLToPath(new URL('../../',import.meta.url));
const require=createRequire(new URL('../../question-bank/official/tools/package.json',import.meta.url));
const {chromium}=require('playwright'),origin='https://presentation-fixture.example.test';
const output=path.join(repository,'artifacts/lesson-presentation'),checks=[],errors=[],external=[];
const pass=label=>{checks.push(label);console.log('PASS '+label);};
const source=`import {openLessonPresentation} from '/js/lesson-studio/presentation.mjs';
import {createLessonDraft} from '/js/lesson-studio/draft-model.mjs';
import katex from '/lessons/ib-math-ai/unit-1/assets/js/katex.js';
const png=Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAIAAAADCAIAAAA2iEnWAAAAFElEQVR4nGOUDJjGwMDAxAAGUAoAEsQBBc88udgAAAAASUVORK5CYII='),character=>character.charCodeAt(0));
const asset='80000000-0000-4000-8000-000000000011';
const math={source:{mode:'visual',expression:{kind:'symbol',name:'x'}},spoken:'x',display:true};
const rich=text=>({nodes:[{type:'paragraph',children:[{type:'text',text}]}]});
function original(){
 const lesson=createLessonDraft({lessonId:'80000000-0000-4000-8000-000000000001',courseVersionId:'80000000-0000-4000-8000-000000000002',catalog:{unit_id:'legacy:ap:unit:1',topic_id:'legacy:ap:topic:1.7'},title:'Original classroom presentation',objective:'Explain the original example.',skill:'teacher:explain',summary:'Original teacher presentation fixture.'});
 lesson.slides=[
  {id:'slide-1',title:'Reason about the example',layout:'two-column',blocks:[
   {id:'text',type:'rich-text',version:2,content:{nodes:[{type:'paragraph',children:[{type:'text',text:'First revealed explanation. ',marks:['strong']},{type:'math',source:math.source,spoken:'x'},{type:'text',text:' connects to the graph.'}]}]}},
   {id:'math',type:'math',version:2,content:math},
   {id:'table',type:'table',version:1,content:{caption:'Original numerical observations',columns:[{id:'input',label:'Input'},{id:'result',label:'Result'}],rows:[{id:'r1',cells:[[{type:'text',text:'1'}],[{type:'text',text:'2'}]]}],row_header:true}}
  ]},
  {id:'slide-2',title:'Explore the illustration',layout:'single',blocks:[
   {id:'image',type:'image',version:1,content:{asset_id:asset,alt:'Original teacher illustration',decorative:false,caption:'Original private image',description:'A small blue teaching rectangle.'}},
   {id:'video',type:'video',version:1,content:{provider:'youtube',video_id:'AbCdEf123_-',title:'Original graph explanation',start_seconds:12,transcript:'Read the axes and describe the graph.'}},
   {id:'resource',type:'resource',version:1,content:{asset_id:'80000000-0000-4000-8000-000000000012',title:'Original reference',description:'The original teacher reference PDF.'}},
   {id:'callout',type:'callout',version:2,content:{kind:'note',title:'Explain your reasoning',body:rich('Connect the numerical observation with the graph.')}}
  ]},
  {id:'slide-3',title:'An earlier lesson reference',layout:'single',blocks:[{id:'legacy',type:'legacy-embedded',version:1,content:{source:'lessons/ap-calculus/unit-1/1-1-can-change-occur-at-an-instant.html',anchor:'intro',sha256:'a'.repeat(64),summary:'Original earlier lesson explanation.'}}]}
 ];return lesson;
}
const createURL=URL.createObjectURL.bind(URL),revokeURL=URL.revokeObjectURL.bind(URL),urls=new Set(),revoked=[];
URL.createObjectURL=blob=>{const url=createURL(blob);urls.add(url);return url;};
URL.revokeObjectURL=url=>{urls.delete(url);revoked.push(url);revokeURL(url);};
let current=true,api=null,hold=false,held=[],requests=[],closedCount=0,old=[],reenter=false;
async function resolver(id,{kind,signal}){
 const row={id,kind,aborted:signal.aborted};requests.push(row);signal.addEventListener('abort',()=>{row.aborted=true;},{once:true});
 if(hold)await new Promise(resolve=>held.push(resolve));
 const digest=await crypto.subtle.digest('SHA-256',png),hash=[...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,'0')).join('');
 return {metadata:{asset_id:id,mime_type:'image/png',byte_length:png.byteLength,width:2,height:3,sha256:hash,state:'ready'},blob:new Blob([png],{type:'image/png'})};
}
window.fixture={ready:true,original,requests,urls,revoked,
 mount(){current=true;reenter=false;const input=original();old.push(api);api=openLessonPresentation({dialog:document.querySelector('#presentation-dialog'),document:input,mathEngine:katex,isCurrent:()=>{if(reenter){api?.dispose();return false;}return current;},resolveAsset:resolver});api.closed.then(()=>closedCount++);return {serialized:JSON.stringify(input),keys:Object.keys(api)};},
 invalid(){const value=original();value.private_notes='PRIVATE_TEACHER_NOTES';let rejected=false;try{openLessonPresentation({dialog:document.querySelector('#presentation-dialog'),document:value,mathEngine:katex,isCurrent:()=>current})}catch{rejected=true}return rejected;},
 revoke(){current=false;},dispose(){api?.dispose();},disposeOld(){old.at(-1)?.dispose();},reentrantDispose(){reenter=true;api.dispose();},
 state(){return{requests:requests.map(x=>({...x})),urls:[...urls],revoked:[...revoked],closedCount,pending:api?.hasPending()||false,open:document.querySelector('#presentation-dialog').open};},
 hold(value){hold=value;},release(){for(const resolve of held.splice(0))resolve();},
 failFullscreen(){Object.defineProperty(document.querySelector('.lesson-presentation-surface'),'requestFullscreen',{value:()=>Promise.reject(new Error('Synthetic fullscreen denial'))});},
 lateFullscreen(){const surface=document.querySelector('.lesson-presentation-surface');let complete;Object.defineProperty(surface,'requestFullscreen',{value:()=>new Promise(resolve=>{complete=resolve})});this.finishFullscreen=()=>{Object.defineProperty(document,'fullscreenElement',{configurable:true,get:()=>surface});Object.defineProperty(document,'exitFullscreen',{configurable:true,value:()=>{Object.defineProperty(document,'fullscreenElement',{configurable:true,get:()=>null});this.exitCalls=(this.exitCalls||0)+1;return Promise.resolve();}});complete();};},
 exitCalls:0
};`;
const browser=await chromium.launch({headless:true,executablePath:process.env.ECHS_CHROMIUM_PATH||undefined});
const context=await browser.newContext({viewport:{width:1440,height:960},serviceWorkers:'block'});
await context.route('**/*',async route=>{
 const url=new URL(route.request().url());
 if(url.origin!==origin){external.push(url.href);return route.abort();}
 if(url.pathname==='/fixture.html')return route.fulfill({contentType:'text/html',body:'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Presentation fixture</title><link rel="stylesheet" href="/css/lesson-presentation.css"><link rel="stylesheet" href="/lessons/ib-math-ai/unit-1/assets/css/katex.css"></head><body><main><h1>Teacher workspace</h1><p id="private-background">PRIVATE_TEACHER_NOTES behind opaque modal</p><button id="open">Open presentation fixture</button><dialog id="presentation-dialog"></dialog></main><script type="module" src="/fixture.mjs"></script></body></html>'});
 if(url.pathname==='/fixture.mjs')return route.fulfill({contentType:'text/javascript',body:source});
 const file=path.resolve(repository,'.'+decodeURIComponent(url.pathname));if(!file.startsWith(path.resolve(repository)+path.sep))return route.fulfill({status:403,body:''});
 try{return route.fulfill({contentType:/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.woff2')?'font/woff2':'application/octet-stream',body:await readFile(file)});}catch{return route.fulfill({status:404,body:''});}
});
const page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',error=>errors.push(error.message));
const mount=async()=>{await page.evaluate(()=>fixture.mount());await page.locator('#presentation-slide').waitFor();};
const reveal=async count=>{for(let i=0;i<count;i++)await page.locator('#presentation-reveal').click();};
const jump=async index=>page.locator('#presentation-jump').selectOption(String(index));
try{
 await page.goto(origin+'/fixture.html');await page.waitForFunction(()=>window.fixture?.ready);
 const initial=await page.evaluate(()=>fixture.mount());assert.deepEqual(initial.keys,['closed','dispose','hasPending']);
 assert.equal(await page.locator('#presentation-dialog').evaluate(node=>node.matches(':modal')),true);
 assert.equal(await page.locator('#presentation-dialog').evaluate(node=>getComputedStyle(node).backgroundColor),'rgb(255, 255, 255)');
 assert.equal(await page.locator('#presentation-slide .lesson-presentation-block').count(),0);assert.equal(await page.locator('#presentation-slide').getAttribute('tabindex'),'0');
 assert.equal((await page.locator('#presentation-dialog').innerText()).includes('PRIVATE_TEACHER_NOTES'),false);
 assert.deepEqual((await page.evaluate(()=>fixture.state())).requests,[]);assert.equal(await page.evaluate(()=>document.fullscreenElement===null),true);
 pass('opening uses an opaque native modal, reveals no blocks or private notes, and never requests fullscreen or assets automatically');

 await page.locator('#presentation-slide').focus();await page.keyboard.press('Space');
 assert.equal(await page.locator('[data-block-id=text]').count(),1);assert.equal(await page.locator('[data-block-id=text] strong').count(),1);assert.equal(await page.locator('[data-block-id=text] [role=math]').count(),1);
 assert.equal(await page.locator('[data-block-id=math],[data-block-id=table]').count(),0);
 await reveal(2);assert.equal(await page.locator('#presentation-reveal').isDisabled(),true);assert.equal(await page.locator('th[scope=row]').textContent(),'1');
 assert.ok(await page.locator('.katex-display').count()>0);assert.equal(await page.locator('#presentation-status').textContent(),'Slide 1 of 3 · 3 of 3 blocks revealed.');
 await page.locator('.echsMediaTable').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#presentation-jump').inputValue(),'0');
 pass('Space reveals one validated block at a time and preserves rich formatting, inline/display mathematics and semantic table headers');

 await page.locator('#presentation-slide').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#presentation-jump').inputValue(),'1');
 assert.equal(await page.locator('.lesson-presentation-block').count(),0);await page.keyboard.press('PageDown');assert.equal(await page.locator('#presentation-jump').inputValue(),'2');
 await page.keyboard.press('PageUp');await page.keyboard.press('ArrowLeft');assert.equal(await page.locator('.lesson-presentation-block').count(),3);
 await page.locator('#presentation-reset').click();assert.equal(await page.locator('.lesson-presentation-block').count(),0);
 await jump(2);await reveal(1);assert.match(await page.locator('#presentation-slide').innerText(),/Legacy lesson reference: Original earlier lesson explanation/);assert.equal(await page.locator('#presentation-slide a').count(),0);
 pass('arrow/page navigation, direct jump and per-slide reveal memory work; reset clears the current slide and legacy references remain inert text');

 await jump(0);await page.locator('#presentation-jump').focus();
 await page.locator('#presentation-jump').dispatchEvent('keydown',{key:' ',bubbles:true});assert.equal(await page.locator('.lesson-presentation-block').count(),0);
 await page.locator('#presentation-slide').dispatchEvent('keydown',{key:' ',isComposing:true,bubbles:true});assert.equal(await page.locator('.lesson-presentation-block').count(),0);
 await page.locator('#presentation-slide').dispatchEvent('keydown',{key:' ',repeat:true,bubbles:true});assert.equal(await page.locator('.lesson-presentation-block').count(),0);
 pass('presentation shortcuts ignore native form controls, IME composition and repeated keydown events');

 const retained=await page.locator('#presentation-dialog').innerHTML();assert.equal(await page.evaluate(()=>fixture.invalid()),true);assert.equal(await page.locator('#presentation-dialog').innerHTML(),retained);
 await page.evaluate(()=>{fixture.mount();fixture.disposeOld();});await page.waitForTimeout(50);assert.equal(await page.locator('#presentation-dialog').evaluate(node=>node.open),true);
 pass('invalid document fields fail before replacing the view and stale disposal/native close events cannot remove a replacement presentation');

 await page.locator('#presentation-fullscreen').click();
 await page.waitForFunction(()=>document.fullscreenElement===document.querySelector('.lesson-presentation-surface'));
 assert.equal(await page.evaluate(()=>document.fullscreenElement.tagName),'SECTION');assert.equal(await page.locator('#presentation-fullscreen').getAttribute('aria-pressed'),'true');
 await page.evaluate(()=>document.exitFullscreen());await page.waitForFunction(()=>document.fullscreenElement===null);
 assert.equal(await page.locator('#presentation-dialog').evaluate(node=>node.open),true);assert.match(await page.locator('#presentation-status').textContent(),/Presentation remains open/);
 await page.locator('#presentation-fullscreen').click();await page.waitForFunction(()=>document.fullscreenElement===document.querySelector('.lesson-presentation-surface'));
 await page.keyboard.press('Escape');await page.waitForFunction(()=>document.fullscreenElement===null);
 assert.equal(await page.locator('#presentation-dialog').evaluate(node=>node.open),true);
 pass('a separate user gesture enters actual browser fullscreen on the inner surface, and actual fullscreen exit keeps the opaque modal open');

 await page.evaluate(()=>fixture.failFullscreen());await page.locator('#presentation-fullscreen').click();
 await page.waitForFunction(()=>document.querySelector('#presentation-status').textContent.includes('Full screen is unavailable. Presentation remains open.'));
 assert.equal(await page.locator('#presentation-dialog').evaluate(node=>node.open),true);assert.equal(await page.locator('#presentation-fullscreen').isEnabled(),true);
 pass('fullscreen rejection retains functional presentation controls and an explicit modal fallback');

 await jump(1);assert.equal((await page.evaluate(()=>fixture.state())).requests.length,0);await reveal(1);
 await page.waitForFunction(()=>document.querySelector('#presentation-slide img')?.naturalWidth===2);
 assert.equal(await page.locator('#presentation-slide img').getAttribute('alt'),'Original teacher illustration');assert.equal((await page.evaluate(()=>fixture.state())).urls.length,1);
 await reveal(1);assert.equal(await page.locator('iframe').count(),0);assert.deepEqual(external,[]);
 await page.getByRole('button',{name:'Load external video',exact:true}).click();await page.waitForFunction(()=>document.querySelector('iframe'));
 assert.equal(await page.locator('iframe').getAttribute('src'),'https://www.youtube-nocookie.com/embed/AbCdEf123_-?start=12&autoplay=0&playsinline=1&rel=0');
 await page.locator('#presentation-slide').focus();await page.keyboard.press('ArrowRight');
 assert.equal(await page.locator('iframe,img').count(),0);assert.equal((await page.evaluate(()=>fixture.state())).urls.length,0);
 pass('media is instantiated only after reveal; external video waits for its own consent control, and slide navigation unloads frames and revokes image URLs');

 await jump(1);await page.waitForFunction(()=>document.querySelector('#presentation-slide img')?.naturalWidth===2);await reveal(2);
 assert.equal(await page.getByRole('button',{name:'Download PDF',exact:true}).count(),1);assert.match(await page.locator('#presentation-slide').innerText(),/Connect the numerical observation with the graph/);
 await page.locator('#presentation-reset').click();assert.equal(await page.locator('iframe,img,.lesson-presentation-block').count(),0);assert.equal((await page.evaluate(()=>fixture.state())).urls.length,0);
 pass('revealed resources and callouts use the shared renderer, while reset disposes every visible media block without loading unrevealed resources');

 await page.evaluate(()=>fixture.hold(true));await reveal(1);await page.waitForFunction(()=>fixture.state().pending);
 const previousRequests=(await page.evaluate(()=>fixture.state())).requests.length;await jump(0);assert.equal((await page.evaluate(()=>fixture.state())).requests.at(-1).aborted,true);
 await page.evaluate(()=>{fixture.release();fixture.hold(false);});await page.waitForFunction(()=>!fixture.state().pending);
 assert.equal(await page.locator('img').count(),0);assert.equal((await page.evaluate(()=>fixture.state())).urls.length,0);assert.equal((await page.evaluate(()=>fixture.state())).requests.length,previousRequests);
 pass('navigation aborts an in-flight asset; an uncooperative late resolver cannot attach a stale image or create a blob URL');

 await page.evaluate(()=>fixture.mount());await jump(1);await page.evaluate(()=>fixture.hold(true));await reveal(1);await page.waitForFunction(()=>fixture.state().pending);
 await page.evaluate(()=>fixture.revoke());await page.waitForFunction(()=>!document.querySelector('#presentation-dialog').open);
 assert.equal(await page.locator('#presentation-dialog').innerHTML(),'');assert.equal((await page.evaluate(()=>fixture.state())).requests.at(-1).aborted,true);
 await page.evaluate(()=>{fixture.release();fixture.hold(false);});await page.waitForTimeout(50);assert.equal((await page.evaluate(()=>fixture.state())).urls.length,0);
 pass('current-account loss disposes within the bounded guard interval, clears private DOM and rejects a late authorized-byte response');

 await mount();await page.evaluate(()=>fixture.reentrantDispose());assert.equal(await page.locator('#presentation-dialog').innerHTML(),'');assert.equal((await page.evaluate(()=>fixture.state())).pending,false);
 pass('an ownership callback that re-enters disposal terminates safely without recursion or retained presentation content');

 await mount();await page.evaluate(()=>fixture.lateFullscreen());await page.locator('#presentation-fullscreen').click();
 await page.evaluate(()=>fixture.revoke());await page.waitForFunction(()=>!document.querySelector('#presentation-dialog').open);await page.evaluate(()=>fixture.finishFullscreen());
 await page.waitForFunction(()=>fixture.exitCalls===1);assert.equal(await page.evaluate(()=>document.fullscreenElement===null),true);assert.equal(await page.locator('#presentation-dialog').innerHTML(),'');
 pass('a fullscreen request completing after account disposal immediately exits its owned target and cannot revive cleared presentation content');

 await mount();await reveal(3);await mkdir(output,{recursive:true});await page.screenshot({path:path.join(output,'presentation-desktop.png')});
 await page.setViewportSize({width:375,height:812});await page.emulateMedia({reducedMotion:'reduce'});await page.keyboard.press('Tab');await page.locator('#presentation-slide').focus();
 const bounds=await page.evaluate(()=>({width:innerWidth,dialog:document.querySelector('#presentation-dialog').getBoundingClientRect().toJSON(),body:document.documentElement.scrollWidth,controls:[...document.querySelectorAll('.lesson-presentation-controls button,.lesson-presentation-controls select')].map(n=>n.getBoundingClientRect().toJSON()),outline:getComputedStyle(document.querySelector('#presentation-slide')).outlineStyle}));
 assert.ok(bounds.body<=bounds.width+1);assert.ok(bounds.dialog.right<=bounds.width+1);assert.ok(bounds.controls.every(r=>r.left>=0&&r.right<=bounds.width+1&&r.width>0));assert.equal(bounds.outline,'solid');
 await page.screenshot({path:path.join(output,'presentation-mobile.png')});
 pass('large mathematics, before-content heading and visible keyboard focus remain usable on desktop/mobile with no horizontal control overflow or motion requirement');

 const closedBefore=(await page.evaluate(()=>fixture.state())).closedCount;await page.locator('#presentation-end').click();await page.waitForFunction(count=>fixture.state().closedCount>count,closedBefore);
 assert.equal(await page.locator('#presentation-dialog').innerHTML(),'');assert.deepEqual(await page.evaluate(()=>[Object.keys(localStorage),Object.keys(sessionStorage)]),[[],[]]);
 assert.deepEqual(errors,[]);assert.ok(external.every(url=>url.startsWith('https://www.youtube-nocookie.com/embed/AbCdEf123_-?')));
 pass('ending resolves the closed promise, clears presentation content and writes no browser storage or mastery request');
 await writeFile(path.join(output,'presentation-browser.json'),JSON.stringify({ok:true,groups:checks.length,checks,browser_errors:errors,external_requests:external,scope:'Synthetic original canonical drafts with local KaTeX in actual Chromium. Native fullscreen success/exit exercised; denial and late-owner races explicitly stubbed. Image receipts are injected; no production account/data/API or student-route authority is claimed.'},null,2)+'\n');
}finally{await context.close();await browser.close();}
