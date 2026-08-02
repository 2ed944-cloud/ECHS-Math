import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import fs from 'node:fs';
import path from 'node:path';

const base=process.env.ECHS_PREVIEW_URL||'http://127.0.0.1:4173';
const output=process.env.ECHS_PREVIEW_OUTPUT||'artifacts/ib-ai-unit2-v3-chromium';
const catalog=JSON.parse(fs.readFileSync('data/ib-math-ai-unit-2-delivery-catalog.json','utf8'));
await mkdir(output,{recursive:true});
const executablePath=process.env.CHROME_PATH||'/usr/bin/google-chrome';
const browser=await chromium.launch({executablePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const devices=[{key:'desktop',viewport:{width:1440,height:1000},isMobile:false},{key:'mobile',viewport:{width:390,height:844},isMobile:true}];
const report={generatedAt:new Date().toISOString(),release:'3.0.0',learnScreensChecked:0,routeChecks:0,lessons:[],errors:[]};
const sample=new Set(['2.1','2.14','2.17','2.18','2.19']);

for(const device of devices){
  const context=await browser.newContext({viewport:device.viewport,isMobile:device.isMobile,deviceScaleFactor:1,reducedMotion:'reduce',serviceWorkers:'block'});
  for(const lesson of catalog.lessons){
    const url=`${base}/lessons/ib-math-ai/unit-2/lessons/${lesson.file}`;
    const page=await context.newPage(),consoleErrors=[],pageErrors=[],failed=[];
    page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});
    page.on('pageerror',e=>pageErrors.push(e.message));
    page.on('requestfailed',r=>failed.push(`${r.url()} :: ${r.failure()?.errorText||'failed'}`));
    const entry={device:device.key,number:lesson.number,url,screens:0,routes:[],consoleErrors,pageErrors,failedRequests:failed};
    try{
      const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
      if(!response||response.status()>=400)throw new Error(`HTTP ${response?.status()}`);
      await page.waitForFunction(()=>document.body.dataset.rendered==='1',null,{timeout:30000});
      for(let index=0;index<36;index++){
        const state=await page.evaluate(()=>({label:document.getElementById('progress-label')?.textContent?.trim(),title:document.querySelector('.stage h1,.stage h2')?.textContent?.trim(),mathErrors:document.querySelectorAll('.katex-error,[data-math-error="true"]').length,overflow:Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)>document.documentElement.clientWidth+2}));
        report.learnScreensChecked++;entry.screens++;
        if(state.label!==`${index+1} / 36`)report.errors.push(`${lesson.number}/${device.key}/screen-${index+1}: progress label ${state.label||'missing'}`);
        if(!state.title)report.errors.push(`${lesson.number}/${device.key}/screen-${index+1}: no visible heading`);
        if(state.mathErrors)report.errors.push(`${lesson.number}/${device.key}/screen-${index+1}: ${state.mathErrors} KaTeX errors`);
        if(state.overflow)report.errors.push(`${lesson.number}/${device.key}/screen-${index+1}: horizontal overflow`);
        if(index<35)await page.locator('#next-slide').click();
      }
      const routes=[['practice','.question-shell'],['exam','.exam-task'],['quiz','.question-shell'],['review','.review-grid']];
      for(const [route,selector] of routes){
        await page.locator(`[data-route="${route}"]`).click();await page.locator(selector).first().waitFor({state:'attached',timeout:10000});
        const state=await page.evaluate(()=>({mathErrors:document.querySelectorAll('.katex-error,[data-math-error="true"]').length,overflow:Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)>document.documentElement.clientWidth+2}));
        report.routeChecks++;entry.routes.push(route);if(state.mathErrors)report.errors.push(`${lesson.number}/${device.key}/${route}: KaTeX errors`);if(state.overflow)report.errors.push(`${lesson.number}/${device.key}/${route}: horizontal overflow`);
      }
      if(sample.has(lesson.number)&&device.key==='desktop'){await page.locator('[data-route="learn"]').click();await page.screenshot({path:path.join(output,`lesson-${lesson.number}.png`),fullPage:false})}
      const relevantConsole=consoleErrors.filter(x=>!/favicon|fonts\.gstatic/i.test(x));if(relevantConsole.length)report.errors.push(`${lesson.number}/${device.key}: console ${relevantConsole.join(' | ')}`);
      if(pageErrors.length)report.errors.push(`${lesson.number}/${device.key}: page ${pageErrors.join(' | ')}`);
      const relevantFailed=failed.filter(x=>!/fonts\.googleapis|fonts\.gstatic/i.test(x));if(relevantFailed.length)report.errors.push(`${lesson.number}/${device.key}: requests ${relevantFailed.join(' | ')}`);
    }catch(error){entry.captureError=error.message;report.errors.push(`${lesson.number}/${device.key}: ${error.message}`)}
    report.lessons.push(entry);await page.close();
  }
  await context.close();
}
await browser.close();
await writeFile(path.join(output,'browser-qa.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({learnScreensChecked:report.learnScreensChecked,routeChecks:report.routeChecks,lessonDeviceRuns:report.lessons.length,errors:report.errors},null,2));
if(report.learnScreensChecked!==1368)report.errors.push(`expected 1368 screen checks, got ${report.learnScreensChecked}`);
if(report.routeChecks!==152)report.errors.push(`expected 152 route checks, got ${report.routeChecks}`);
if(report.errors.length)process.exitCode=1;
