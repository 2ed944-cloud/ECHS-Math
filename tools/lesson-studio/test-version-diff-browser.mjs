import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';

const repository=fileURLToPath(new URL('../../',import.meta.url));
const require=createRequire(new URL('../../question-bank/official/tools/package.json',import.meta.url));
const {chromium}=require('playwright'),origin='https://version-diff-fixture.example.test';
const output=path.join(repository,'artifacts/lesson-history'),checks=[],errors=[],external=[],pass=label=>{checks.push(label);console.log('PASS '+label);};
const source=`import {compareLessonVersions,renderVersionDiff} from '/js/lesson-studio/version-diff.mjs';
import {createLessonDraft} from '/js/lesson-studio/draft-model.mjs';
import katex from '/lessons/ib-math-ai/unit-1/assets/js/katex.js';
const original=()=>createLessonDraft({lessonId:'80000000-0000-4000-8000-000000000001',courseVersionId:'80000000-0000-4000-8000-000000000002',catalog:{unit_id:'legacy:ap:unit:1',topic_id:'legacy:ap:topic:1.7'},title:'Original saved lesson',objective:'Explain the original example.',skill:'teacher:explain',summary:'Original comparison fixture.'});
window.fixture={ready:true,controllers:[],mount({notesOnly=false,includePrivateNotes=false,long=false}={}){
  const before=original(),after=structuredClone(before),privateBefore='PRIVATE_ORIGINAL_NOTES',privateAfter=long?'PRIVATE_'+ 'x'.repeat(10000):'<img src="https://private.invalid/x" onerror="alert(1)"> PRIVATE_UPDATED_NOTES';
  if(!notesOnly){after.title='Updated saved lesson';after.slides[0].blocks.push({id:'math',type:'math',version:1,content:{tex:'x^2',spoken:'x squared',display:true}});
    after.slides[0].blocks.push({id:'video',type:'video',version:1,content:{provider:'youtube',video_id:'AbCdEf123_-',title:'Original lesson video',start_seconds:10,transcript:'Teacher supplied transcript'}});
    after.slides[0].blocks.push({id:'image',type:'image',version:1,content:{asset_id:'80000000-0000-4000-8000-000000000011',alt:'Original teacher graph',decorative:false,caption:'Original graph caption',description:''}});
    after.slides[0].blocks[0].content.paragraphs[0].children[0].text=long?'A'.repeat(4000):'Explain the updated example.';
  }
  const comparison=compareLessonVersions({before:{document:before,private_notes:privateBefore},after:{document:after,private_notes:privateAfter},mathEngine:katex});
  this.comparison=comparison;this.controllers.push(renderVersionDiff({root:document.querySelector('#comparison'),comparison,includePrivateNotes}));return comparison.summary;
},forge(){let calls=0;const forged={get contract(){calls++;return 'echs.lesson.diff.v1'}};let rejected=false;try{renderVersionDiff({root:document.querySelector('#comparison'),comparison:forged,includePrivateNotes:true})}catch{rejected=true}return{rejected,calls}},dispose(){this.controllers.at(-1)?.dispose()}};`;
const browser=await chromium.launch({headless:true,executablePath:process.env.ECHS_CHROMIUM_PATH||undefined});
const context=await browser.newContext({viewport:{width:1200,height:1000},serviceWorkers:'block'});
await context.route('**/*',async route=>{
  const url=new URL(route.request().url());if(url.origin!==origin){external.push(url.href);return route.abort();}
  if(url.pathname==='/fixture.html')return route.fulfill({contentType:'text/html',body:'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Version comparison fixture</title><link rel="stylesheet" href="/css/lesson-studio.css"></head><body><main><h1>Saved lesson versions</h1><h2>Version comparison</h2><div id="comparison"></div><button id="close">Close comparison</button></main><script type="module" src="/fixture.mjs"></script></body></html>'});
  if(url.pathname==='/fixture.mjs')return route.fulfill({contentType:'text/javascript',body:source});
  const file=path.resolve(repository,'.'+decodeURIComponent(url.pathname));if(!file.startsWith(path.resolve(repository)+path.sep))return route.fulfill({status:403,body:''});
  try{return route.fulfill({contentType:/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':'application/octet-stream',body:await readFile(file)});}catch{return route.fulfill({status:404,body:''});}
});
const page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',error=>errors.push(error.message));
try{
  await page.goto(origin+'/fixture.html');await page.waitForFunction(()=>fixture?.ready);
  await page.evaluate(()=>fixture.mount());
  assert.equal(await page.locator('#comparison').getByRole('heading',{name:'Lesson content changed.'}).count(),1);
  assert.match(await page.locator('#comparison').innerText(),/TeX expression: x\^2/);assert.match(await page.locator('#comparison').innerText(),/Teacher supplied transcript/);
  assert.equal(await page.locator('#comparison img,#comparison iframe,#comparison video,#comparison object,#comparison a,#comparison script').count(),0);
  assert.equal((await page.locator('#comparison').innerText()).includes('PRIVATE_'),false);assert.deepEqual(external,[]);
  pass('semantic comparison renders readable mathematical/media descriptions without fetching assets, linking URLs or exposing private notes by default');

  await page.evaluate(()=>fixture.mount({includePrivateNotes:true}));
  assert.equal(await page.getByRole('heading',{name:'Private teacher notes',exact:true}).count(),1);assert.match(await page.locator('.version-diff-private').innerText(),/PRIVATE_UPDATED_NOTES/);
  assert.match(await page.locator('.version-diff-private').innerText(),/<img src=/);assert.equal(await page.locator('#comparison img').count(),0);assert.deepEqual(external,[]);
  assert.ok(await page.locator('dl dt').count()>0);assert.equal(await page.locator('dl dt').count(),await page.locator('dl dd').count());
  pass('explicit staff notes appear in a separate semantic section and hostile note markup remains literal text');

  const retained=await page.locator('#comparison').innerHTML();assert.deepEqual(await page.evaluate(()=>fixture.forge()),{rejected:true,calls:0});assert.equal(await page.locator('#comparison').innerHTML(),retained);
  pass('forged comparison objects are rejected without executing descriptor hooks or replacing an existing authorized view');

  await page.evaluate(()=>fixture.mount({notesOnly:true,long:true}));
  assert.equal(await page.locator('#comparison').innerText(),'No lesson content changes.');assert.equal(await page.locator('.version-diff-private,.version-diff-warning').count(),0);
  pass('notes-only changes and private-note truncation do not leak content or change metadata into the default view');

  await page.evaluate(()=>fixture.mount({includePrivateNotes:true,long:true}));
  assert.match(await page.locator('#comparison').innerText(),/shortened comparison/);assert.match(await page.locator('#comparison').innerText(),/original saved versions remain unchanged/i);
  await page.keyboard.press('Tab');assert.equal(await page.locator('#close').evaluate(node=>node===document.activeElement),true);
  await mkdir(output,{recursive:true});await page.screenshot({path:path.join(output,'version-diff-desktop.png'),fullPage:true});
  await page.setViewportSize({width:375,height:900});
  const overflow=await page.evaluate(()=>({width:innerWidth,body:document.documentElement.scrollWidth,panels:[...document.querySelectorAll('.version-diff-value dd')].map(node=>({left:node.getBoundingClientRect().left,right:node.getBoundingClientRect().right}))}));
  assert.ok(overflow.body<=overflow.width+1,JSON.stringify(overflow));assert.ok(overflow.panels.every(panel=>panel.left>=0&&panel.right<=overflow.width+1));
  await page.screenshot({path:path.join(output,'version-diff-mobile.png'),fullPage:true});
  pass('long values are explicitly shortened; headings and before/after labels remain keyboard accessible and fit a narrow mobile viewport');

  await page.evaluate(()=>{fixture.mount({includePrivateNotes:true});fixture.controllers.at(-2).dispose()});
  assert.equal(await page.locator('.version-diff').count(),1);assert.equal(await page.evaluate(()=>{const previous=document.querySelector('.version-diff');fixture.dispose();return previous.textContent;}),'');assert.equal(await page.locator('#comparison').innerHTML(),'');
  assert.deepEqual(await page.evaluate(()=>[Object.keys(localStorage),Object.keys(sessionStorage)]),[[],[]]);assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  pass('disposal removes private DOM and an older view cannot clear its replacement; no browser storage or external request occurs');
  await writeFile(path.join(output,'version-diff-browser.json'),JSON.stringify({ok:true,groups:checks.length,checks,browser_errors:errors,external_requests:external,scope:'Synthetic original canonical drafts and local KaTeX, actual comparison module and committed CSS; no production history reads, restore writes or account authorization claimed.'},null,2)+'\n');
}finally{await context.close();await browser.close();}
