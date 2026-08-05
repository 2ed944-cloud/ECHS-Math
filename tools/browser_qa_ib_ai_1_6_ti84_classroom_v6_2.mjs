import {chromium} from 'playwright-core';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';

const baseURL=process.env.ECHS_PREVIEW_URL||'http://127.0.0.1:4173';
const outputDir=process.env.ECHS_PREVIEW_OUTPUT||'artifacts/ib-ai-1-6-ti84-v6-2';
const lessonURL=`${baseURL}/lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.6_technology_equations_ECHS.html#learn`;
const storageKey='echs:ib-ai:u1:1.6:learn-index';
await mkdir(outputDir,{recursive:true});

const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--font-render-hinting=none']});
const report={lessonURL,generatedAt:new Date().toISOString(),checks:[],errors:[],screenshots:[]};
const add=(name,pass,details='')=>{report.checks.push({name,pass,details});if(!pass)report.errors.push(`${name}: ${details}`);};

async function openPage(viewport){
  const context=await browser.newContext({viewport,deviceScaleFactor:1,reducedMotion:'reduce',serviceWorkers:'block'});
  const page=await context.newPage();
  const consoleErrors=[];
  page.on('console',message=>{if(message.type()==='error'&&!/favicon|404/i.test(message.text()))consoleErrors.push(message.text());});
  page.on('pageerror',error=>consoleErrors.push(error.message));
  await page.route('https://ti84calc.com/**',route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><html><body style="margin:0;background:#102a43;color:white;font-family:sans-serif"><main data-qa-ti84 style="padding:36px"><h1>TI-84 classroom simulator QA</h1><p>External request intercepted during automated testing.</p></main></body></html>'}));
  await page.goto(lessonURL,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>document.body.dataset.rendered==='1'&&window.LESSON_DATA?.slides?.length===73&&document.querySelector('.ti84-classroom-launch'),null,{timeout:30000});
  return{context,page,consoleErrors};
}

async function overflow(page,selector){
  return page.evaluate(sel=>{const node=document.querySelector(sel);if(!node)return{missing:true};return{width:node.clientWidth,scrollWidth:node.scrollWidth,height:node.clientHeight,scrollHeight:node.scrollHeight,horizontal:Math.max(0,node.scrollWidth-node.clientWidth)};},selector);
}

try{
  const desktop=await openPage({width:1754,height:877});
  const page=desktop.page;
  add('TI-84 Classroom route launcher is visible',await page.locator('.ti84-classroom-launch').isVisible(),'routebar launcher');
  await page.click('.ti84-classroom-launch');
  await page.waitForSelector('#ti84-classroom-coach.open');
  add('paired classroom coach opens as an accessible modal',await page.locator('.ti84-coach-dialog[role="dialog"][aria-modal="true"]').count()===1,'modal contract');
  add('six paired manual and TI-84 workflows are selectable',(await page.locator('#ti84-workflow-select option').count())===6,`options ${await page.locator('#ti84-workflow-select option').count()}`);
  add('three classroom modes are available',(await page.locator('[data-ti84-mode]').count())===3,`modes ${await page.locator('[data-ti84-mode]').count()}`);
  add('simulator is lazy before learner action',(await page.locator('.ti84-simulator-stage iframe').getAttribute('src'))==='about:blank','initial iframe source');

  let revealed=await page.locator('.ti84-manual-steps article.revealed').count();
  add('teacher demo begins with one manual step',revealed===1,`revealed ${revealed}`);
  await page.click('#ti84-manual-next');
  revealed=await page.locator('.ti84-manual-steps article.revealed').count();
  add('teacher can reveal the manual solution progressively',revealed===2,`revealed ${revealed}`);
  const firstInstruction=await page.locator('.ti84-current-instruction h3').innerText();
  await page.click('#ti84-ti-next');
  const secondInstruction=await page.locator('.ti84-current-instruction h3').innerText();
  add('TI-84 key route advances one projected step at a time',firstInstruction!==secondInstruction,`${firstInstruction} -> ${secondInstruction}`);

  await page.click('[data-ti84-mode="follow"]');
  const followRevealed=await page.locator('.ti84-manual-steps article.revealed').count();
  add('students-follow mode exposes the complete manual route',followRevealed===4,`revealed ${followRevealed}`);
  await page.click('[data-ti84-mode="drill"]');
  add('exam-drill mode hides the model output',/Hidden until the drill is complete/.test(await page.locator('#ti84-evidence-content').innerText()),await page.locator('#ti84-evidence-content').innerText());
  await page.click('#ti84-reveal-answer');
  add('exam-drill output can be revealed for self-check',/unique solution/i.test(await page.locator('#ti84-evidence-content').innerText()),await page.locator('#ti84-evidence-content').innerText());

  await page.selectOption('#ti84-workflow-select','cubic-roots');
  const cubicKeys=(await page.locator('.ti84-key-sequence').innerText()).replace(/\s+/g,' ');
  add('cubic workflow teaches the graph-zero route',cubicKeys.includes('Y=')&&cubicKeys.includes('2:zero')&&cubicKeys.includes('ZOOM'),cubicKeys);
  await page.selectOption('#ti84-workflow-select','exact-intersections');
  const intersectionKeys=(await page.locator('.ti84-key-sequence').innerText()).replace(/\s+/g,' ');
  add('intersection workflow teaches 2nd TRACE Intersect',intersectionKeys.includes('2nd')&&intersectionKeys.includes('TRACE')&&intersectionKeys.includes('5:intersect'),intersectionKeys);

  await page.click('#ti84-load-simulator');
  await page.waitForSelector('#ti84-simulator-stage.loaded',{timeout:15000});
  await page.frameLocator('.ti84-simulator-stage iframe').locator('[data-qa-ti84]').waitFor({timeout:10000});
  add('ti84calc simulator loads only after explicit action',await page.frameLocator('.ti84-simulator-stage iframe').locator('[data-qa-ti84]').count()===1,'intercepted simulator loaded');
  const simulatorSandbox=await page.locator('.ti84-simulator-stage iframe').getAttribute('sandbox');
  add('embedded simulator remains sandboxed',simulatorSandbox?.includes('allow-scripts')&&simulatorSandbox?.includes('allow-same-origin'),simulatorSandbox||'');
  const desktopOverflow=await overflow(page,'.ti84-coach-dialog');
  add('desktop classroom coach has no horizontal overflow',desktopOverflow.horizontal<=2,JSON.stringify(desktopOverflow));
  const desktopShot=path.join(outputDir,'desktop-ti84-classroom-intersection.png');await page.screenshot({path:desktopShot,fullPage:false});report.screenshots.push(desktopShot);

  await page.click('.ti84-coach-head [data-ti84-close]');
  const mappedTitle='Worked example · solve and verify a 2×2 system';
  const mappedIndex=await page.evaluate(title=>window.LESSON_DATA.slides.findIndex(slide=>slide.title===title),mappedTitle);
  await page.evaluate(({key,index})=>localStorage.setItem(key,String(index)),{key:storageKey,index:mappedIndex});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(expected=>document.body.dataset.rendered==='1'&&document.getElementById('progress-label')?.textContent?.trim().startsWith(`${expected} /`),mappedIndex+1,{timeout:30000});
  await page.waitForSelector('.ti84-paired-strip');
  add('relevant lesson example receives a paired practice launcher',/Manual method \+ physical TI‑84 workflow/.test(await page.locator('.ti84-paired-strip').innerText()),await page.locator('.ti84-paired-strip').innerText());
  await page.click('.ti84-paired-strip button');
  await page.waitForSelector('#ti84-classroom-coach.open');
  add('contextual launcher opens the matching 2×2 workflow',(await page.locator('#ti84-workflow-select').inputValue())==='system-2x2',await page.locator('#ti84-workflow-select').inputValue());
  add('desktop lesson has no console errors',desktop.consoleErrors.length===0,desktop.consoleErrors.join('\n'));
  await desktop.context.close();

  const mobile=await openPage({width:390,height:844});
  await mobile.page.click('.ti84-classroom-launch');
  await mobile.page.waitForSelector('#ti84-classroom-coach.open');
  const mobileOverflow=await overflow(mobile.page,'.ti84-coach-dialog');
  add('mobile classroom coach fits the viewport',mobileOverflow.horizontal<=2,JSON.stringify(mobileOverflow));
  await mobile.page.selectOption('#ti84-workflow-select','system-3x3');
  await mobile.page.click('[data-ti84-mode="follow"]');
  add('mobile students-follow mode remains operable',(await mobile.page.locator('.ti84-manual-steps article.revealed').count())===4,`revealed ${await mobile.page.locator('.ti84-manual-steps article.revealed').count()}`);
  const mobileShot=path.join(outputDir,'mobile-ti84-classroom-system.png');await mobile.page.screenshot({path:mobileShot,fullPage:false});report.screenshots.push(mobileShot);
  add('mobile lesson has no console errors',mobile.consoleErrors.length===0,mobile.consoleErrors.join('\n'));
  await mobile.context.close();
}finally{
  await browser.close();
}

await writeFile(path.join(outputDir,'report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({checks:report.checks.length,errors:report.errors.length,screenshots:report.screenshots.length},null,2));
if(report.errors.length){for(const error of report.errors)console.error(`ERROR: ${error}`);process.exit(1);}
