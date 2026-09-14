import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const {chromium}=createRequire(import.meta.url)(process.env.ECHS_PLAYWRIGHT_MODULE||'playwright-core');
const baseURL=process.env.ECHS_PREVIEW_URL||'http://127.0.0.1:4173';
const outputDir=process.env.ECHS_PREVIEW_OUTPUT||'artifacts/ib-ai-1-6-ti84-v6-2';
const lessonURL=`${baseURL}/lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.6_technology_equations_ECHS.html#learn`;
const storageKey='echs:ib-ai:u1:1.6:learn-index';
await mkdir(outputDir,{recursive:true});
let browser;const contexts=new Set();
const report={lessonURL,generatedAt:new Date().toISOString(),scope:'Actual consolidated local v7/v8 teaching UI; the separate external simulator is intercepted with a synthetic page, not provider execution.',checks:[],errors:[],screenshots:[],cleanup:{contexts:false,browser:false}};
const add=(name,pass,details='')=>{report.checks.push({name,pass,details});if(!pass)report.errors.push(`${name}: ${details}`);};
function bounded(p,ms,label){let t;return Promise.race([p,new Promise((_,j)=>{t=setTimeout(()=>j(Error(label)),ms);})]).finally(()=>clearTimeout(t));}
async function closeContext(c){await bounded(c.close(),10000,'context-close-timeout');contexts.delete(c);}
async function openPage(viewport){
  const context=await browser.newContext({viewport,deviceScaleFactor:1,reducedMotion:'reduce',serviceWorkers:'block'});contexts.add(context);
  await context.route('**/*',route=>{
    const url=route.request().url();if(url==='https://ti84calc.com/ti84calc')return route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><html><body><main data-qa-ti84>Intercepted simulator transport fixture; no calculator execution.</main></body></html>'});
    return new URL(url).origin===new URL(baseURL).origin?route.continue():route.abort();
  });
  const page=await context.newPage(),consoleErrors=[];page.on('console',m=>{if(m.type()==='error'&&!/favicon|404/i.test(m.text()))consoleErrors.push(m.text());});page.on('pageerror',e=>consoleErrors.push(e.message));
  await page.goto(lessonURL,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>document.body.dataset.rendered==='1'&&window.LESSON_DATA?.slides?.length===81&&document.querySelector('.gdc-v7-launch')&&window.LESSON_DATA.gdcClassroomTrainingV8?.workflowCount===6,null,{timeout:30000});
  return{context,page,consoleErrors};
}
async function overflow(page,selector){return page.evaluate(sel=>{const n=document.querySelector(sel);return n?{width:n.clientWidth,scrollWidth:n.scrollWidth,horizontal:Math.max(0,n.scrollWidth-n.clientWidth)}:{missing:true};},selector);}
async function shown(page){return page.locator('.gdc-v7-modal-grid .gdc-v7-stage.is-shown').count();}
try{
  browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--font-render-hinting=none']});report.browser=browser.version();
  const desktop=await openPage({width:1754,height:877}),page=desktop.page;
  add('local GDC classroom launcher is visible',await page.locator('.gdc-v7-launch').isVisible());
  await page.click('.gdc-v7-launch');await page.waitForSelector('.gdc8-select');
  add('paired classroom coach opens as an accessible modal',await page.locator('.gdc-v7-shell[role="dialog"][aria-modal="true"]').count()===1);
  add('six preserved manual and TI-84 workflows are selectable',await page.locator('.gdc8-select option').count()===6);
  add('three classroom stage modes are available',await page.locator('.gdc-v7-modes [data-mode]').count()===3);
  add('separate simulator is lazy before learner action',await page.locator('.u1-ti84-sim-stage iframe').getAttribute('src')==='about:blank');
  add('teacher mode exposes all five model-to-verification stages',await shown(page)===5);
  await page.click('.gdc-v7-modes [data-mode="follow"]');add('follow mode begins with two stages',await shown(page)===2);
  await page.click('.gdc-v7-reveal');add('classroom stages reveal progressively',await shown(page)===3);
  await page.click('.gdc-v7-modes [data-mode="drill"]');add('drill mode begins with only the model stage',await shown(page)===1);
  for(let i=0;i<4;i++)await page.click('.gdc-v7-reveal');add('drill can reveal through verification',await shown(page)===5);await page.click('.gdc-v7-reveal');add('drill reset restores one stage',await shown(page)===1);
  const workflowIds=await page.evaluate(()=>Object.keys(window.ECHS_TI84_CLASSROOM_WORKFLOWS));
  let complete=true;
  for(let i=0;i<6;i++){
    await page.selectOption('.gdc8-select',String(i));
    const expected=await page.evaluate(id=>{const f=window.ECHS_TI84_CLASSROOM_WORKFLOWS[id];return{manual:f.manualSteps.length,keys:f.tiSteps.length};},workflowIds[i]);
    complete&&=await page.locator('.gdc8-manual li').count()===expected.manual&&await page.locator('.gdc8-ti-steps article').count()===expected.keys;
    complete&&=await page.locator('.gdc8-output-value').evaluate(n=>n.hidden);await page.click('.gdc8-reveal-output');complete&&=await page.locator('.gdc8-output-value').evaluate(n=>!n.hidden)&&await page.locator('.gdc8-output-value .katex').count()>0;
    await page.click('.gdc8-reveal-output');complete&&=await page.locator('.gdc8-output-value').evaluate(n=>n.hidden);
  }
  add('every paired workflow retains complete manual/key routes and reversible rendered-output reveal',complete);
  await page.selectOption('.gdc8-select',String(workflowIds.indexOf('cubic-roots')));const cubic=await page.locator('.gdc8-ti-steps').innerText();
  add('cubic workflow teaches graph Zero with bounds and guess',/Y=/.test(cubic)&&/2:zero/.test(cubic)&&/Left Bound/.test(cubic)&&/Right Bound/.test(cubic)&&/Guess/.test(cubic));
  await page.selectOption('.gdc8-select',String(workflowIds.indexOf('exact-intersections')));const intersection=await page.locator('.gdc8-ti-steps').innerText();
  add('intersection workflow teaches 2nd TRACE Intersect and both curves',/2nd/.test(intersection)&&/TRACE/.test(intersection)&&/5:intersect/.test(intersection)&&/First curve/.test(intersection)&&/Second curve/.test(intersection));
  const box=await overflow(page,'.gdc-v7-shell');add('desktop classroom coach has no horizontal overflow',box.horizontal<=2,JSON.stringify(box));
  const shot=path.join(outputDir,'desktop-ti84-classroom-intersection.png');await page.screenshot({path:shot});report.screenshots.push(shot);
  await page.click('.gdc8-open-sim');await page.waitForSelector('#u1-ti84-simulator.is-open');await page.frameLocator('.u1-ti84-sim-stage iframe').locator('[data-qa-ti84]').waitFor();
  add('simulator transport loads only after explicit action',await page.frameLocator('.u1-ti84-sim-stage iframe').locator('[data-qa-ti84]').count()===1);
  const sandbox=await page.locator('.u1-ti84-sim-stage iframe').getAttribute('sandbox');add('separate simulator remains sandboxed',sandbox?.includes('allow-scripts')&&sandbox?.includes('allow-same-origin'));
  const metadata=await page.evaluate(()=>({coach:window.LESSON_DATA.ti84Classroom.simulator,provider:window.LESSON_DATA.ti84Simulator.provider}));add('local coach and external simulator identities remain distinct',metadata.coach==='local-echs-gdc-v7'&&metadata.provider==='ti84calc.com',JSON.stringify(metadata));
  await page.keyboard.press('Escape');await page.waitForSelector('#u1-ti84-simulator[aria-hidden="true"]');
  const index=await page.evaluate(()=>window.LESSON_DATA.slides.findIndex(s=>s.id==='U1-GDC-V7-1.6-S03'));if(index<0)throw Error('Missing contextual system workflow slide');
  await page.click('#open-map');await page.click(`[data-slide-index="${index}"]`);await page.waitForSelector('.gdc-v7-open[data-workflow="2"]');
  add('actual system workflow slide exposes its contextual launcher',await page.locator('.gdc-v7-open[data-workflow="2"]').isVisible());
  await page.click('.gdc-v7-open[data-workflow="2"]');await page.waitForSelector('.gdc8-select');add('contextual launcher selects the declared system workflow',await page.locator('.gdc-v7-select').inputValue()==='2'&&await page.locator('.gdc8-select').inputValue()==='0');
  add('desktop lesson has no console errors',desktop.consoleErrors.length===0,desktop.consoleErrors.join('\n'));await closeContext(desktop.context);
  const mobile=await openPage({width:390,height:844});await mobile.page.click('.gdc-v7-launch');await mobile.page.waitForSelector('.gdc8-select');const mobileBox=await overflow(mobile.page,'.gdc-v7-shell');add('mobile classroom coach fits the viewport',mobileBox.horizontal<=2,JSON.stringify(mobileBox));
  await mobile.page.selectOption('.gdc8-select',String(workflowIds.indexOf('system-3x3')));await mobile.page.click('.gdc-v7-modes [data-mode="follow"]');add('mobile follow mode and full three-variable manual route remain operable',await shown(mobile.page)===2&&await mobile.page.locator('.gdc8-manual li').count()===4);
  const mobileShot=path.join(outputDir,'mobile-ti84-classroom-system.png');await mobile.page.screenshot({path:mobileShot});report.screenshots.push(mobileShot);add('mobile lesson has no console errors',mobile.consoleErrors.length===0,mobile.consoleErrors.join('\n'));await closeContext(mobile.context);
}catch(error){report.errors.push(String(error.stack||error));}
finally{
  for(const context of [...contexts])try{await closeContext(context);}catch(e){report.errors.push('Context cleanup: '+String(e.message||e));}
  report.cleanup.contexts=contexts.size===0;try{if(browser)await bounded(browser.close(),10000,'browser-close-timeout');report.cleanup.browser=true;}catch(e){report.errors.push('Browser cleanup: '+String(e.message||e));}
  report.status=report.errors.length?'FAIL':'PASS';await writeFile(path.join(outputDir,'report.json'),JSON.stringify(report,null,2));
}
console.log(JSON.stringify({checks:report.checks.length,errors:report.errors.length,screenshots:report.screenshots.length}));if(report.errors.length){for(const error of report.errors)console.error('ERROR: '+error);process.exitCode=1;}
