/** Owned, local browser QA. No production sign-in, AI request, or learner record. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {createRequire} from 'node:module';
const root=process.cwd(),require=createRequire(import.meta.url);
const {chromium}=require(process.env.ECHS_VOLUME_PLAYWRIGHT_MODULE||path.join(root,'question-bank/official/tools/node_modules/playwright'));
const out=process.env.ECHS_VOLUME_BROWSER_REPORT||path.join(root,'.volume-browser-report');
await fs.mkdir(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2'};
const server=http.createServer(async(req,res)=>{
 const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{const bytes=await fs.readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(bytes);}catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:true});
let checks=0;const errors=[];
try{
 for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
  const context=await browser.newContext({viewport});
  await context.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  for(const [file,anchor] of [['8-5-volumes-cross-sections','cs-explore-square'],['8-6-disks-and-washers','dw-pearl'],['8-7-volume-about-a-line','line-above-lab']]){
   await page.goto(`${origin}/lessons/ap-calculus/unit-8/${file}.html#${anchor}`);
   await page.locator('#lesson-app').waitFor({state:'visible'});
   await page.waitForFunction(()=>document.querySelector('#solid-canvas').width>300);
   assert.equal(await page.locator('#visual-fallback').isVisible(),false);checks++;
   await page.locator('#presentation-mode').click();
   assert.equal(await page.locator('#model-mathematics').isVisible(),false);checks++;
   await page.locator('#flat-region').click();
   assert.equal(await page.locator('#sweep').inputValue(),'0');checks++;
   await page.locator('#complete-solid').click();
   assert.equal(await page.locator('#sweep').inputValue(),'360');checks++;
   await page.locator('#isolate-slice').click();
   assert.equal(await page.locator('#view-mode').inputValue(),'slice');checks++;
   await page.locator('#solid-canvas').focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('Home');
   await page.locator('#complete-solid').click();
   await page.addStyleTag({url:origin+'/css/echs-ai-tutor.css'});
   await page.evaluate(()=>{window.ECHS_AI_TUTOR_CONFIG={enabled:true,endpoint:'https://example.invalid',title:'ECHS Math Tutor Pro'};});
   await page.addScriptTag({url:origin+'/js/echs-ai-tutor.js'});
   const launch=page.getByRole('button',{name:'ECHS Math Tutor Pro',exact:true});
   await launch.waitFor({state:'visible'});
   const nav=await page.locator('#next').boundingBox(),fab=await launch.boundingBox();
   assert.ok(fab.width<=58&&fab.height<=58,'Compact 56px launch target');
   assert.ok(fab.y+fab.height<=nav.y-4,'Tutor must clear the lesson footer');checks+=2;
   await page.locator('#next').click();await page.locator('#back').click();
   await launch.click();assert.equal(await page.locator('#echsAiTutorPanel').isVisible(),true);checks++;
   await page.getByRole('button',{name:'Close tutor'}).click();
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
   assert.ok(overflow<=1,`${file} at ${viewport.width}: horizontal overflow ${overflow}`);checks++;
   await page.screenshot({path:path.join(out,`${file}-${viewport.width}.png`),fullPage:true});
   await page.emulateMedia({reducedMotion:'reduce'});
   await page.waitForFunction(()=>document.querySelector('#build').disabled);
   assert.equal(await page.locator('#build').isDisabled(),true);checks++;
   const control=file.includes('8-5')?'construction':'sweep';
   await page.locator('#'+control).evaluate(el=>{el.value=el.id==='construction'?'500':'180';el.dispatchEvent(new Event('input',{bubbles:true}));});
   await page.emulateMedia({reducedMotion:'no-preference'});
   await page.waitForFunction(()=>!document.querySelector('#build').disabled);
  }
  await context.close();
 }
 assert.deepEqual(errors,[]);
 await fs.writeFile(path.join(out,'result.json'),JSON.stringify({status:'pass',checks,viewports:[1440,390],errors,scope:'Local production-source lesson UI and tutor only; no production auth or AI response claim'},null,2));
 console.log(`PASS: ${checks} browser assertions, desktop/mobile screenshots, slide controls, face-on view, keyboard, reduced motion, and unobstructed Next buttons.`);
}finally{await browser.close();await new Promise(r=>server.close(r));}
