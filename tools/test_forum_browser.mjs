/** Owned local production-source QA. Blocks external requests and writes no learner record. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {createRequire} from 'node:module';
import {INVESTIGATIONS} from '../lessons/shared/forum/investigations.mjs';
const root=process.cwd(),require=createRequire(import.meta.url);
const {chromium}=require(process.env.ECHS_VOLUME_PLAYWRIGHT_MODULE||path.join(root,'question-bank/official/tools/node_modules/playwright'));
const out=process.env.ECHS_FORUM_BROWSER_REPORT||path.join(root,'.forum-browser-report');await fs.mkdir(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2'};
const server=http.createServer(async(req,res)=>{
  const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  try{res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(await fs.readFile(file));}catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:true,...(process.env.ECHS_CHROMIUM_PATH?{executablePath:process.env.ECHS_CHROMIUM_PATH}:{})});
let checks=0;const errors=[];
try {
  for(const viewport of [{width:1440,height:1000},{width:1366,height:768},{width:390,height:844}]) {
    const context=await browser.newContext({viewport});await context.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    for(const entry of INVESTIGATIONS) {
      await page.goto(`${origin}/${entry.path}?forum=1#${entry.anchor}`);
      const panel=page.locator(`[data-guided-entry="${entry.id}"]`);await panel.waitFor({state:'visible'});
      const owner=entry.path.includes('ap-calculus')?page.locator('#lessonStage'):page.locator('#'+entry.anchor);
      const model=entry.path.includes('ap-calculus')?page.locator('#workspace'):page.locator('#'+entry.anchor+' [data-context-lab]');
      assert.equal(await owner.getAttribute('data-guided-phase'),'predict');assert.equal(await model.isVisible(),false);checks+=2;
      await panel.getByRole('button',{name:'Explore the model',exact:true}).click();assert.equal(await model.isVisible(),false);checks++;
      await panel.getByLabel('My prediction and reason').fill('My sketch predicts a change in shape, based on the linked geometry.');
      await panel.getByRole('button',{name:'Explore the model',exact:true}).click();assert.equal(await model.isVisible(),true);checks++;
      if(entry.path.includes('ap-calculus')) {
        await page.waitForFunction(()=>document.querySelector('#solid-canvas').width>300);
        assert.equal(await page.locator('#visual-fallback').isVisible(),false);checks++;
        await page.locator('#isolate-slice').click();await page.locator('#solid-canvas').focus();await page.keyboard.press('ArrowRight');
      }
      if(entry.id==='car') {
        await page.locator('#context-car-period').selectOption('20');await page.locator('#context-car-radius').selectOption('6');
        await page.locator('#context-car-step').click();assert.equal(await page.locator('#context-car-time').inputValue(),'5');checks++;
        await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('#context-car-play').isDisabled(),true);checks++;
        await page.locator('#context-car-step').click();assert.equal(await page.locator('#context-car-time').inputValue(),'10');checks++;
        await page.emulateMedia({reducedMotion:'no-preference'});assert.equal(await page.locator('#context-car-play').isDisabled(),false);checks++;
      }
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),`${entry.id}: overflow at ${viewport.width}`);checks++;
      await page.screenshot({path:path.join(out,`${entry.id}-explore-${viewport.width}.png`),fullPage:true});
      await panel.getByRole('button',{name:'Explain what changed',exact:true}).click();
      await panel.getByLabel('Explain what changed, and what stayed the same').fill('I connect the model with an area or a rate and state the relevant units.');
      await panel.getByRole('button',{name:'Try independent transfer',exact:true}).click();assert.equal(await model.isVisible(),false);checks++;
      await panel.getByRole('button',{name:'Compare with worked reasoning',exact:true}).click();assert.equal(await panel.locator('.ew-comparison').isVisible(),false);checks++;
      await panel.getByLabel('Independent setup and explanation').fill('Here is my independent geometric setup and explanation.');
      await panel.getByRole('button',{name:'Compare with worked reasoning',exact:true}).click();assert.equal(await panel.locator('.ew-comparison').isVisible(),true);checks++;
      await panel.getByLabel('Independent setup and explanation').fill('I am revising my independent setup.');assert.equal(await panel.locator('.ew-comparison').isVisible(),false);checks++;
      await page.screenshot({path:path.join(out,`${entry.id}-transfer-${viewport.width}.png`),fullPage:true});
      await panel.getByRole('button',{name:'Full lesson',exact:true}).click();assert.equal(await model.isVisible(),true);checks++;
      if(entry.path.includes('ap-calculus')) {
        await page.locator('#next').click();await page.locator('#back').click();await panel.waitFor({state:'visible'});
        await page.waitForFunction(()=>document.querySelector('#solid-canvas').width>300);assert.equal(await page.locator('#visual-fallback').isVisible(),false);checks++;
      }
      const footer=await page.locator(entry.path.includes('ap-calculus')?'.lesson-footer':'.footer').boundingBox();
      assert.ok(footer.y>=0 && footer.y+footer.height<=viewport.height+1,`${entry.id}: native navigation visible`);checks++;
    }
    // Ordinary lesson mode starts collapsed and restores the same model after guidance.
    const entry=INVESTIGATIONS[0];await page.goto(`${origin}/${entry.path}#${entry.anchor}`);
    const panel=page.locator('[data-guided-entry="car"]');await panel.waitFor({state:'visible'});
    assert.equal(await page.locator('#toy-car-lab [data-context-lab]').isVisible(),true);checks++;
    await panel.getByRole('button',{name:'Start guided investigation',exact:true}).click();
    assert.equal(await page.locator('#toy-car-lab [data-context-lab]').isVisible(),false);checks++;
    await panel.getByRole('button',{name:'I shared my reasoning aloud',exact:true}).click();
    await panel.getByRole('button',{name:'Explore the model',exact:true}).click();
    assert.equal(await page.locator('#toy-car-lab [data-context-lab]').isVisible(),true);checks++;
    await page.locator('.ew-route>summary').click();assert.equal(await page.locator('.ew-route-menu a').count(),9);checks++;
    await page.keyboard.press('Escape');assert.equal(await page.locator('.ew-route').getAttribute('open'),null);checks++;
    await context.close();
  }
  assert.deepEqual(errors,[]);await fs.writeFile(path.join(out,'result.json'),JSON.stringify({status:'pass',checks,viewports:[1440,1366,390],errors,scope:'Original production-source lesson UI; no production account, AI request, mastery record or learning-impact claim'},null,2));
  console.log(`PASS: ${checks} browser assertions across nine investigations and three screen sizes; screenshots, reduced motion, keyboard, gating, transfer, route, renderer recovery and full-lesson restoration.`);
} finally {await browser.close();await new Promise(r=>server.close(r));}
