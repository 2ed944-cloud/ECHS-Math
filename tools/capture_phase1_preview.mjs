import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseURL=process.env.ECHS_PREVIEW_URL||'http://127.0.0.1:4173';
const outputDir=process.env.ECHS_PREVIEW_OUTPUT||'artifacts/phase2-visual';
await mkdir(outputDir,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const routes=[
  {key:'home',path:'/index.html',ready:'#courses'},
  {key:'learning-home',path:'/question-bank/index.html',ready:'#homePlan'},
  {key:'adaptive-practice',path:'/question-bank/practice.html?mode=adaptive',ready:'#start',delay:6500},
  {key:'test-generator',path:'/question-bank/exam.html',ready:'#start',delay:6500},
  {key:'student-dashboard',path:'/question-bank/dashboard.html',ready:'#dailyPlan'},
  {key:'mistake-bank',path:'/question-bank/mistakes.html',ready:'#reviewList'},
  {key:'teacher-dashboard',path:'/question-bank/teacher.html',ready:'#classList'},
  {key:'parent-report',path:'/question-bank/parent.html',ready:'#familyPlan'},
  {key:'privacy',path:'/privacy.html',ready:'main'},
  {key:'accessibility',path:'/accessibility.html',ready:'main'}
];
const devices=[
  {key:'desktop',viewport:{width:1440,height:1000},isMobile:false},
  {key:'mobile',viewport:{width:390,height:844},isMobile:true}
];
const report={generatedAt:new Date().toISOString(),baseURL,pages:[],errors:[]};
for(const device of devices){
  const context=await browser.newContext({viewport:device.viewport,isMobile:device.isMobile,deviceScaleFactor:1,reducedMotion:'reduce'});
  for(const route of routes){
    const page=await context.newPage(),consoleErrors=[],pageErrors=[],failedRequests=[];
    page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text());});
    page.on('pageerror',error=>pageErrors.push(error.message));
    page.on('requestfailed',request=>failedRequests.push(`${request.method()} ${request.url()} :: ${request.failure()?.errorText||'failed'}`));
    const url=`${baseURL}${route.path}`,entry={device:device.key,route:route.key,url,consoleErrors,pageErrors,failedRequests};
    try{
      const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});entry.status=response?.status()??null;
      await page.locator(route.ready).first().waitFor({state:'attached',timeout:30000});
      await page.waitForTimeout(route.delay||1800);
      entry.title=await page.title();entry.h1=await page.locator('h1').first().textContent().catch(()=>null);
      entry.bodyWidth=await page.evaluate(()=>document.body.scrollWidth);entry.viewportWidth=device.viewport.width;entry.horizontalOverflow=entry.bodyWidth>device.viewport.width+2;
      entry.theme=await page.evaluate(()=>document.documentElement.dataset.theme||'light');
      const screenshot=path.join(outputDir,`${route.key}-${device.key}.png`);await page.screenshot({path:screenshot,fullPage:true});entry.screenshot=screenshot;
      if(entry.status&&entry.status>=400)report.errors.push(`${route.key}/${device.key}: HTTP ${entry.status}`);
      if(entry.horizontalOverflow)report.errors.push(`${route.key}/${device.key}: horizontal overflow ${entry.bodyWidth}px > ${device.viewport.width}px`);
      if(pageErrors.length)report.errors.push(`${route.key}/${device.key}: ${pageErrors.join(' | ')}`);
      const relevant=consoleErrors.filter(message=>!/favicon|Failed to load resource.*fonts\.gstatic|net::ERR_BLOCKED_BY_CLIENT/i.test(message));
      if(relevant.length)report.errors.push(`${route.key}/${device.key}: console ${relevant.join(' | ')}`);
      const relevantFailures=failedRequests.filter(message=>!/fonts\.googleapis|fonts\.gstatic/i.test(message));
      if(relevantFailures.length)report.errors.push(`${route.key}/${device.key}: requests ${relevantFailures.join(' | ')}`);
    }catch(error){entry.captureError=error.message;report.errors.push(`${route.key}/${device.key}: capture failed: ${error.message}`);}
    finally{report.pages.push(entry);await page.close();}
  }
  await context.close();
}
await browser.close();
await writeFile(path.join(outputDir,'report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
if(report.errors.length)process.exitCode=1;