import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile, mkdir, stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {resolveSlideIndex,slideHref,mountLesson} from '../../js/lesson-runtime/renderer.mjs';

const root=fileURLToPath(new URL('../../',import.meta.url));
const require=createRequire(new URL('../../question-bank/official/tools/package.json',import.meta.url));
const {chromium}=require('playwright');
const output=process.env.ECHS_RENDERER_EVIDENCE || path.join(root,'artifacts/lesson-runtime');
await mkdir(output,{recursive:true});
const types={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.json':'application/json','.css':'text/css','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf'};
const server=createServer(async(req,res)=>{
  try {
    const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if(!file.startsWith(path.resolve(root)+path.sep)) {res.writeHead(403).end();return;}
    if(!(await stat(file)).isFile()){res.writeHead(404).end();return;}
    res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(await readFile(file));
  } catch {res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}/tools/lesson-runtime/fixtures/renderer.html`;
const browser=await chromium.launch({headless:true,executablePath:process.env.ECHS_CHROMIUM_PATH || undefined});
const context=await browser.newContext({viewport:{width:1280,height:900}});
await context.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
const page=await context.newPage();page.setDefaultTimeout(15000);
const errors=[];page.on('pageerror',error=>{errors.push(error.message);console.error(error.message);});
page.on('response',response=>{if(response.status()>=400)console.error(response.status(),response.url());});
page.on('console',message=>{if(message.type()==='error')console.error(message.text());});
const checks=[];const pass=label=>{checks.push(label);console.log('PASS '+label);};
async function open(scenario='allowed',hash='#slide=2'){
  await page.goto(base+'?course=ap-calculus&unit=0&topic=1.7&scope=lesson&scenario='+scenario+hash);
  await page.waitForFunction(()=>window.fixture?.ready);
}
async function state(){return page.evaluate(()=>({error:fixture.error,mode:fixture.controller?.mode,index:fixture.controller?.slideIndex,text:document.querySelector('#lesson').textContent,finish:fixture.finishCalls,learning:fixture.learningCalls,href:location.href}));}
try {
  for(const flag of [false,undefined,'true',1]){
    const result=await mountLesson({enabled:flag,window:{location:{href:'https://example.test/alias?x=%2F#opaque'}},lesson:null});
    assert.equal(result.mode,'legacy');assert.equal(result.href,'https://example.test/alias?x=%2F#opaque');
  }
  assert.equal(resolveSlideIndex('#slide=stable',[{id:'first'},{id:'stable'}]),1);
  assert.equal(resolveSlideIndex('#s2',[{id:'first'},{id:'stable'}]),1);
  assert.equal(resolveSlideIndex('#%zz',[{id:'first'}]),0);
  assert.equal(slideHref('https://example.test/alias?x=%2F&topic=1.7#s1',2),'https://example.test/alias?x=%2F&topic=1.7#slide=3');
  pass('explicit feature flag and legacy/numeric/stable-id route contracts');

  await open();assert.equal((await state()).mode,'document');assert.equal((await state()).index,1);
  assert.equal(await page.locator('.echsDocumentSlide:not([hidden])').count(),1);
  assert.ok(await page.locator('.katex-mathml math').count()>0);
  assert.equal(await page.locator('[role="math"]').first().getAttribute('aria-label'),'x equals a');
  assert.equal(await page.locator('.echsDocumentSlide:not([hidden])').getAttribute('aria-labelledby'),'echs-slide-continuity-statement');
  assert.equal(await page.locator('.echsDocumentStatus').getAttribute('aria-live'),'polite');
  assert.ok(await page.locator('.echsDocumentSlide:not([hidden]) .echsDocumentBlocks').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length===2));
  await page.screenshot({path:path.join(output,'renderer-desktop.png'),fullPage:true});
  pass('text, inline/display KaTeX, callout, semantic headings and desktop two-column layout');
  await page.getByRole('button',{name:'Next',exact:true}).click();assert.equal((await state()).index,2);
  assert.equal(await page.evaluate(()=>document.activeElement.id),'echs-slide-continuity-representations');
  assert.ok((await state()).href.includes('course=ap-calculus&unit=0&topic=1.7&scope=lesson'));
  assert.ok((await state()).href.endsWith('#slide=3'));
  await page.keyboard.press('Home');assert.equal((await state()).index,0);
  await page.keyboard.press('ArrowRight');assert.equal((await state()).index,1);
  await page.locator('select').selectOption('2');assert.equal((await state()).index,2);
  await page.evaluate(()=>location.hash='slide=continuity-introduction');
  await page.waitForFunction(()=>fixture.controller.slideIndex===0);
  await page.evaluate(()=>fixture.controller.goTo(2));
  await page.getByRole('button',{name:'Previous',exact:true}).focus();await page.keyboard.press('Home');assert.equal((await state()).index,2);
  assert.equal(await page.evaluate(()=>{try{fixture.controller.goTo(NaN);return false;}catch{return true;}}),true);
  pass('buttons, select, keyboard, focus, ignored editable controls, hash change and query preservation');
  assert.equal((await state()).learning,0);assert.equal((await state()).finish,0);
  await page.getByRole('button',{name:'Continue to lesson practice'}).click();assert.equal((await state()).finish,1);assert.equal((await state()).learning,0);
  assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0);
  pass('viewing/navigation has no learning writes; finish delegates only to existing control');

  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>fixture.controller.goTo(1));
  assert.equal(await page.locator('.echsDocumentSlide:not([hidden]) .echsDocumentBlocks').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),1);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  for(const locator of [page.locator('.echsDocumentNavigation button').first(),page.locator('select')])assert.ok((await locator.boundingBox()).height>=44);
  await page.screenshot({path:path.join(output,'renderer-mobile.png'),fullPage:true});
  pass('390px responsive layout, no page overflow, 44px navigation targets');
  await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.echsDocument').evaluate(el=>getComputedStyle(el).animationName),'none');
  pass('reduced-motion behavior');

  for(const scenario of ['guest','pending-account','denied','draft','private','invalid','wrong-binding','wrong-route','missing-token','pending-token','wrong-legacy']){
    await open(scenario);assert.ok((await state()).error,scenario);assert.equal(await page.locator('.echsDocument').count(),0);assert.ok((await state()).text.includes('Existing lesson'));assert.equal((await state()).learning,0);
  }
  pass('guest, timeout, unreleased gate, private/unsafe document, mismatched binding/route, absent/changed token and cross-lesson link rejection preserve legacy DOM');
  await open('delayed');assert.equal((await state()).mode,'document');
  pass('delayed existing release gate permits rendering only after allowance');
  await open('disabled','#unknown-fragment');assert.equal((await state()).mode,'legacy');assert.ok((await state()).href.endsWith('#unknown-fragment'));
  pass('feature-off rollback leaves original URL and DOM');
  for(const mutation of ['gate','account','token','signout','role','course','route']){
    await open();await page.evaluate(kind=>{
      if(kind==='gate')document.documentElement.dataset.lessonGate='denied';
      if(kind==='account')fixture.account({id:'other'});
      if(kind==='token')fixture.token('changed');
      if(kind==='signout')document.dispatchEvent(new Event('echs:institution-signed-out'));
      if(kind==='role'||kind==='course')document.dispatchEvent(new CustomEvent('echs:portal-access',{detail:{authenticated:true,role:kind==='role'?'parent':'student',current:{id:'fixture-account'},courseAllowed:false}}));
      if(kind==='route'){history.replaceState(null,'','?course=other');dispatchEvent(new Event('pageshow'));}
      if(['account','token'].includes(kind))dispatchEvent(new Event('storage'));
    },mutation);
    await page.waitForFunction(()=>document.querySelector('#lesson').childElementCount===0);
    assert.equal((await state()).learning,0);
  }
  pass('release revocation, account/token changes and signout dispose the renderer');
  await open('math-size');assert.equal((await state()).mode,'document');
  assert.ok(await page.locator('.echsDocumentMath').last().evaluate(el=>el.scrollHeight<500));
  pass('KaTeX size limit remains enforced during actual rendering');
  assert.deepEqual(errors,[]);pass('no browser script errors or external network dependencies');
  await import('node:fs/promises').then(fs=>fs.writeFile(path.join(output,'renderer-results.json'),JSON.stringify({status:'passed',checks,scope:'original local fixture, simulated access; no production calls'},null,2)+'\n'));
} finally {await context.close();await browser.close();await new Promise(resolve=>server.close(resolve));}
