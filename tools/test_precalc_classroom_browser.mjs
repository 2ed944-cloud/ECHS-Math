/** Real production decks/build hooks with synthetic read-only account authority.
 * External requests are blocked. This is not a production account/server test. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {CATALOG,loadLesson} from '../lessons/shared/classroom/precalc-unit1/catalog.mjs';
const repo=process.cwd(),require=createRequire(import.meta.url),{chromium}=require(path.join(repo,'question-bank/official/tools/node_modules/playwright'));
const out=process.env.ECHS_CLASSROOM_BROWSER_REPORT||path.join(repo,'.classroom-browser-report');await fs.mkdir(out,{recursive:true});
const fixture=await fs.mkdtemp(path.join(os.tmpdir(),'echs-classroom-'));
for(const item of CATALOG){const target=path.join(fixture,item.path);await fs.mkdir(path.dirname(target),{recursive:true});await fs.copyFile(path.join(repo,item.path),target);}
const entry=path.join(fixture,'lessons/shared/classroom/precalc-unit1/entry.js');await fs.mkdir(path.dirname(entry),{recursive:true});await fs.copyFile(path.join(repo,'lessons/shared/classroom/precalc-unit1/entry.js'),entry);
execFileSync('python3',['tools/inject_learning_access_guard.py',fixture],{cwd:repo});
execFileSync('python3',['tools/inject_precalc_unit1_classroom.py',fixture],{cwd:repo});
const institution=`(()=>{const q=new URL(location.href).searchParams,role=q.get('qaRole')||'teacher';let owner={kind:'account',organization_id:'synthetic-school',account_id:'synthetic-account',role,status:'active',expires_at:Date.now()+3600000,epoch:1,session_id:'synthetic'};const subscriptions=new Set();window.ECHSInstitution={ownerAuthority:{capture:()=>({...owner}),subscribe:fn=>{subscriptions.add(fn);return()=>subscriptions.delete(fn);}}};window.__qaRevoke=()=>{owner={...owner,epoch:owner.epoch+1};[...subscriptions].forEach(fn=>fn());};})();`;
const portal=`(()=>{const role=new URL(location.href).searchParams.get('qaRole')||'teacher';window.ECHSPortalAccess={ready:Promise.resolve({authenticated:true,role,current:{id:'synthetic-account'}}),courseAllowed:()=>new URL(location.href).searchParams.get('qaAssigned')!=='0'};})();`;
const guard=`document.documentElement.dataset.lessonGate=new URL(location.href).searchParams.get('qaGate')||'allowed';document.documentElement.dataset.echsLessonCourse='ap-precalculus';`;
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2'};
const server=http.createServer(async(req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),relative=pathname.slice(1);
  if(pathname==='/js/institution-client.js'){res.writeHead(200,{'Content-Type':'text/javascript'}).end(institution);return;}
  if(pathname==='/js/portal-access.js'){res.writeHead(200,{'Content-Type':'text/javascript'}).end(portal);return;}
  if(pathname==='/js/lesson-access-guard.js'){res.writeHead(200,{'Content-Type':'text/javascript'}).end(guard);return;}
  const base=CATALOG.some(item=>item.path===relative)?fixture:repo,file=path.resolve(base,relative);
  if(!file.startsWith(base+path.sep)){res.writeHead(403).end();return;}
  try{res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(await fs.readFile(file));}catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:true}),errors=[];let checks=0;
try {
  for(const viewport of [{width:1440,height:1000},{width:1366,height:768},{width:390,height:844}]) {
    const context=await browser.newContext({viewport});await context.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());
    const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
    for(const item of CATALOG) {
      const lesson=await loadLesson(item.topic);
      await page.goto(`${origin}/${item.path}`);await page.locator('#echsClassroom').waitFor({state:'visible'});
      assert.equal(await page.locator('#echsClassroom [data-classroom-slide]').getAttribute('data-classroom-slide'),'welcome');checks++;
      const legacyCount=await page.locator('.deck .slide,.deck-shell .slide').count();assert.ok(legacyCount>30);checks++;
      const storageBefore=await page.evaluate(()=>({local:{...localStorage},session:{...sessionStorage}}));
      if(viewport.width===1440)await page.screenshot({path:path.join(out,`topic-${item.topic}-cover.png`)});
      for(let i=1;i<lesson.slides.length;i++) {
        const slide=lesson.slides[i];await page.getByLabel('Choose a lesson slide').selectOption(String(i));
        assert.equal(await page.locator('#echsClassroom h1').textContent(),slide.title);assert.equal(await page.locator('#echsClassroom [data-math-error]').count(),0);checks+=2;
        const solution=page.locator('#echsClassroom .ec-solution'),reveal=page.locator('#ec-reveal');
        assert.equal(await solution.isVisible(),false);checks++;
        if(slide.kind!=='notes') {
          await reveal.click();assert.equal(await solution.isVisible(),false);checks++;
          if(slide.answer.kind==='choice')await page.locator(`#echsClassroom input[name="ec-choice"][value="${slide.answer.index}"]`).check();
          else await page.locator('#ec-draft').fill(slide.answer.kind==='number'?(slide.id==='table-rate'?'-23/6':String(slide.answer.value)):'My attempt identifies the relevant change, domain and units.');
          if(['choice','number'].includes(slide.answer.kind)){await page.locator('#echsClassroom').getByRole('button',{name:'Check my answer',exact:true}).click();assert.equal(await page.locator('.ec-feedback[data-correct=true]').count(),1);checks++;}
        }
        if(slide.model) {
          await page.locator('#echsClassroom').getByRole('button',{name:'Explore the model',exact:true}).click();
          const host=page.locator('#echsClassroom [data-classroom-model]');await host.locator('input,select').first().waitFor({state:'visible'});
          const control=host.locator('input[type=range]').first();
          if(await control.count()){const before=await host.textContent();await control.evaluate(node=>{const min=Number(node.min),max=Number(node.max);node.value=String(Number(node.value)===max?min:max);node.dispatchEvent(new Event('input',{bubbles:true}));});assert.notEqual(await host.textContent(),before);checks++;}
          if(slide.model.kind==='native') {
            await page.evaluate(()=>{window.__qaPortedNode=document.querySelector('#echsClassroom [data-context-lab]');});
            if(slide.id==='toy-car'){await host.locator('#context-car-step').click();assert.ok(Number(await host.locator('#context-car-time').inputValue())>0);checks++;}
          }
          if(viewport.width===1440||item.topic==='1.1'&&viewport.width===390){await host.scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,`topic-${item.topic}-${slide.id}-${viewport.width}.png`)});}
          assert.equal(await host.isVisible(),true);checks++;
        }
        for(let step=0;step<slide.steps.length;step++)await reveal.click();
        assert.equal(await solution.locator('li').count(),slide.steps.length);assert.equal(await reveal.isDisabled(),true);checks+=2;
        assert.equal(await page.locator('#echsClassroom [data-math-error]').count(),0);assert.equal(await page.locator('#echsClassroom .katex-error').count(),0);checks+=2;
        if(viewport.width===1440&&i===2||viewport.width===390&&i===2&&item.topic==='1.3')await page.screenshot({path:path.join(out,`topic-${item.topic}-worked-${viewport.width}.png`)});
        if(slide.kind!=='notes'&&slide.answer.kind!=='choice') {
          await page.locator('#ec-draft').fill('Revising my setup');assert.equal(await solution.isVisible(),false);checks++;
          if(slide.model){assert.equal(await page.locator('#echsClassroom [data-classroom-model]').isVisible(),false);checks++;}
        }
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${item.topic}/${slide.id}: page overflow at ${viewport.width}`);checks++;
        const footer=await page.locator('#echsClassroom .ec-footer').boundingBox();assert.ok(footer.y+footer.height<=viewport.height+1);checks++;
      }
      await page.locator('#echsClassroom').getByRole('button',{name:'More practice & original lesson',exact:true}).click();
      assert.equal(await page.locator('#echsClassroom').isVisible(),false);assert.equal(await page.locator('.deck .slide,.deck-shell .slide').count(),legacyCount);checks+=2;
      if(item.topic==='1.1'){assert.equal(await page.evaluate(()=>document.querySelector('#filling-vessels-lab [data-context-lab]')===window.__qaPortedNode),true);checks++;}
      await page.getByRole('button',{name:'Return to interactive slides',exact:true}).click();assert.equal(await page.locator('#echsClassroom').isVisible(),true);checks++;
      const storageAfter=await page.evaluate(()=>({local:{...localStorage},session:{...sessionStorage}}));assert.deepEqual(storageAfter,storageBefore,'Classroom must not create grades or learner storage');checks++;
      await page.evaluate(()=>window.__qaRevoke());assert.equal(await page.locator('#echsClassroom').count(),0);assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('ec-classroom-active')),false);checks+=2;
    }
    // Native deep links and explicit forum/practice routes stay in their original mode.
    for(const suffix of ['?classroom=0','?forum=1#toy-car-lab','#slide=3','?mode=studio']) {
      await page.goto(`${origin}/${CATALOG[0].path}${suffix}`);await page.locator('#echsClassroomReturn').waitFor({state:'visible'});assert.equal(await page.locator('#echsClassroom').isVisible(),false);checks++;
    }
    await page.goto(`${origin}/${CATALOG[2].path}?classroom=1#classroom-quadratic-turn`);await page.locator('#ec-draft').waitFor({state:'visible'});
    await page.locator('#ec-draft').fill('16');await page.locator('#ec-draft').focus();await page.keyboard.press('ArrowLeft');assert.equal(await page.locator('#echsClassroom').getAttribute('data-slide-index'),'5');checks++;
    await page.locator('#echsClassroom h1').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#echsClassroom').getAttribute('data-slide-index'),'6');checks++;
    await page.keyboard.press('Space');assert.equal(await page.locator('.ec-solution').isVisible(),true);checks++;
    await page.locator('#echsClassroom h1').focus();await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Space');assert.equal(await page.locator('.ec-solution').isVisible(),false);checks++;
    await page.emulateMedia({reducedMotion:'reduce'});
    await context.close();
  }
  const context=await browser.newContext();await context.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());const page=await context.newPage();
  for(const suffix of ['?qaRole=parent','?qaRole=student&qaAssigned=0','?qaGate=denied']) {
    await page.goto(`${origin}/${CATALOG[1].path}${suffix}`);await page.waitForLoadState('networkidle');assert.equal(await page.locator('#echsClassroom').count(),0);checks++;
  }
  await context.close();assert.deepEqual(errors,[],'Unexpected native/runtime errors');
  await fs.writeFile(path.join(out,'summary.json'),JSON.stringify({lessons:14,slides:204,models:16,viewports:[1440,1366,390],checks,errors,authority:'synthetic; production guard unchanged'},null,2));
  console.log(JSON.stringify({checks,errors,status:'passed'}));
} catch(error) {
  await fs.writeFile(path.join(out,'failure.txt'),error.stack||String(error));throw error;
} finally {await browser.close();await new Promise(resolve=>server.close(resolve));await fs.rm(fixture,{recursive:true,force:true});}
