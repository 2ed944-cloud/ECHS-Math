import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseURL=process.env.ECHS_PREVIEW_URL||'http://127.0.0.1:4173';
const rootOutput=process.env.ECHS_PREVIEW_OUTPUT||'artifacts/phase3-visual';
const outputDir=path.join(rootOutput,'lesson-1.4-financial-v6');
const lessonPath='/lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.4_financial_models_ECHS.html';
const lessonURL=`${baseURL}${lessonPath}`;
const storageKey='echs:ib-ai:u1:1.4:learn-index';
await mkdir(outputDir,{recursive:true});

const browser=await chromium.launch({
  executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',
  headless:true,
  args:['--no-sandbox','--disable-dev-shm-usage','--font-render-hinting=none']
});
const report={
  generatedAt:new Date().toISOString(),lessonURL,
  expected:{slides:100,practice:120,quiz:16,exam:6},
  desktopSlides:[],mobileSlides:[],routes:[],errors:[],warnings:[],screenshots:[]
};

const screenshotTitles=new Set([
  '1.4 · Financial Applications',
  'A cash-flow timeline prevents most finance errors',
  'The general compound-interest model',
  'Ordinary annuity timeline',
  'TVM variables encode a cash-flow equation',
  'Amortization is a balance recurrence',
  'A schedule is evidence, not decoration',
  'Interactive compound-interest explorer',
  'Interactive annuity and loan explorer',
  'Integrated IB-style financial decision'
]);
const mobileTitles=new Set([
  '1.4 · Financial Applications',
  'A cash-flow timeline prevents most finance errors',
  'Synchronize rate, payment and time units',
  'Ordinary annuity timeline',
  'TVM variables encode a cash-flow equation',
  'A schedule is evidence, not decoration',
  'Interactive compound-interest explorer',
  'Interactive annuity and loan explorer',
  'Integrated IB-style financial decision',
  'Independent exit ticket'
]);

function slug(value){return String(value).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80);}
function filteredConsoleError(text){
  return !/favicon|ERR_BLOCKED_BY_CLIENT|Failed to load resource.*404/i.test(text);
}

async function openLesson(viewport,label){
  const context=await browser.newContext({viewport,deviceScaleFactor:1,reducedMotion:'reduce',serviceWorkers:'block'});
  const page=await context.newPage();
  const consoleErrors=[],pageErrors=[],failedRequests=[];
  page.on('console',message=>{if(message.type()==='error'&&filteredConsoleError(message.text()))consoleErrors.push(message.text());});
  page.on('pageerror',error=>pageErrors.push(error.message));
  page.on('requestfailed',request=>failedRequests.push(`${request.method()} ${request.url()} :: ${request.failure()?.errorText||'failed'}`));
  await page.addInitScript(()=>{try{localStorage.clear();sessionStorage.clear();}catch{}});
  const response=await page.goto(`${lessonURL}#learn`,{waitUntil:'domcontentloaded',timeout:45000});
  if(!response||response.status()>=400)report.errors.push(`${label}: lesson request returned ${response?.status()??'no response'}`);
  await page.waitForFunction(()=>document.body.dataset.rendered==='1'&&window.LESSON_DATA?.slides?.length===100,null,{timeout:30000});
  await page.waitForTimeout(450);
  return{context,page,consoleErrors,pageErrors,failedRequests};
}

async function currentSlideState(page){
  return page.evaluate(()=>{
    const app=document.getElementById('app');
    const stage=document.querySelector('.stage');
    const stageInner=document.querySelector('.stage-inner');
    const title=document.querySelector('.slide-title')||document.querySelector('.fin-cover h1');
    const titleRect=title?.getBoundingClientRect();
    const progress=document.getElementById('progress-label')?.textContent?.trim()||'';
    const text=app?.innerText?.replace(/\s+/g,' ').trim()||'';
    const rawMath=(text.match(/\\\(|\\\[|\\\)|\\\]/g)||[]).length;
    const mathErrors=document.querySelectorAll('[data-math-error="true"],.katex-error,.katex .merror').length;
    const bodyOverflow=Math.max(0,document.documentElement.scrollWidth-innerWidth,document.body.scrollWidth-innerWidth);
    const stageOverflowX=stage?Math.max(0,stage.scrollWidth-stage.clientWidth):0;
    const stageOverflowY=stage?Math.max(0,stage.scrollHeight-stage.clientHeight):0;
    const titleClipped=Boolean(titleRect&&(titleRect.left<-2||titleRect.right>innerWidth+2||titleRect.top<-2));
    const empty=text.length<28;
    const titleText=(document.querySelector('.slide-title')?.textContent||document.querySelector('.fin-cover h1')?.textContent||'').replace(/\s+/g,' ').trim();
    const interactive={
      compound:Boolean(document.querySelector('[data-fin-compound-explorer]')),
      cashflow:Boolean(document.querySelector('[data-fin-cashflow-explorer]')),
      generator:Boolean(document.querySelector('[data-fin-generator]'))
    };
    return{title:titleText,progress,rawMath,mathErrors,bodyOverflow,stageOverflowX,stageOverflowY,titleClipped,empty,textLength:text.length,stageInnerWidth:Math.round(stageInner?.getBoundingClientRect().width||0),interactive};
  });
}

function recordSlide(state,index,device){
  const entry={index:index+1,...state};
  (device==='desktop'?report.desktopSlides:report.mobileSlides).push(entry);
  const label=`${device} slide ${index+1} (${state.title||'untitled'})`;
  if(state.empty)report.errors.push(`${label}: rendered content is blank`);
  if(state.mathErrors)report.errors.push(`${label}: ${state.mathErrors} KaTeX rendering error node(s)`);
  if(state.rawMath)report.errors.push(`${label}: ${state.rawMath} raw math delimiter(s) remain visible`);
  if(state.bodyOverflow>3)report.errors.push(`${label}: document overflows horizontally by ${state.bodyOverflow}px`);
  if(state.stageOverflowX>3)report.errors.push(`${label}: lesson stage overflows horizontally by ${state.stageOverflowX}px`);
  if(state.titleClipped)report.errors.push(`${label}: title is clipped outside the viewport`);
  if(device==='desktop'&&state.stageOverflowY>500)report.warnings.push(`${label}: requires ${state.stageOverflowY}px of vertical stage scrolling`);
}

async function exerciseSlideInteractions(page,state){
  if(state.interactive.compound){
    await page.locator('[data-fin-rate]').fill('6.25');
    await page.locator('[data-fin-frequency]').fill('4');
    await page.locator('[data-fin-years]').fill('7');
    await page.locator('[data-fin-compound-update]').click();
    await page.waitForTimeout(120);
    const values=await page.locator('.fin-explorer-summary').first().innerText();
    if(!/Periodic rate|Effective annual|Future value|Real value/.test(values))report.errors.push('Compound explorer did not update all four outputs');
  }
  if(state.interactive.cashflow){
    await page.locator('[data-fin-mode="loan"]').click();
    await page.locator('[data-fin-cf-payment]').fill('1200');
    await page.locator('[data-fin-cf-update]').click();
    await page.waitForTimeout(120);
    const values=await page.locator('.fin-explorer-summary').first().innerText();
    if(!/Balance after|Total paid|Interest charged|Required level payment/.test(values))report.errors.push('Loan explorer did not render balance and payment evidence');
  }
  if(state.interactive.generator){
    await page.locator('[data-fin-gen-new]').click();
    await page.locator('[data-fin-gen-solution]').click();
    await page.waitForTimeout(100);
    const hidden=await page.locator('[data-fin-gen-solution-box]').getAttribute('hidden');
    if(hidden!==null)report.errors.push('Generative Financial Studio did not reveal reasoning');
  }
}

async function auditAllDesktopSlides(){
  const session=await openLesson({width:1440,height:1000},'desktop');
  const {page,context,consoleErrors,pageErrors,failedRequests}=session;
  for(let index=0;index<100;index+=1){
    await page.waitForFunction(expected=>document.getElementById('progress-label')?.textContent?.trim().startsWith(`${expected} /`),index+1,{timeout:10000});
    await page.waitForTimeout(35);
    const state=await currentSlideState(page);
    recordSlide(state,index,'desktop');
    await exerciseSlideInteractions(page,state);
    if(screenshotTitles.has(state.title)){
      const target=path.join(outputDir,`desktop-${String(index+1).padStart(3,'0')}-${slug(state.title)}.png`);
      await page.screenshot({path:target,fullPage:false});
      report.screenshots.push(target);
    }
    if(index<99){
      await page.evaluate(()=>document.getElementById('next-slide')?.click());
      await page.waitForFunction(expected=>document.getElementById('progress-label')?.textContent?.trim().startsWith(`${expected} /`),index+2,{timeout:10000});
    }
  }
  if(consoleErrors.length)report.errors.push(...consoleErrors.map(error=>`desktop console: ${error}`));
  if(pageErrors.length)report.errors.push(...pageErrors.map(error=>`desktop pageerror: ${error}`));
  if(failedRequests.length)report.warnings.push(...failedRequests.map(error=>`desktop request: ${error}`));
  await context.close();
}

async function goToSlide(page,index){
  await page.evaluate(({key,index})=>{localStorage.setItem(key,String(index));location.hash='#learn';location.reload();},{key:storageKey,index});
  await page.waitForFunction(expected=>document.body.dataset.rendered==='1'&&document.getElementById('progress-label')?.textContent?.trim().startsWith(`${expected} /`),index+1,{timeout:30000});
  await page.waitForTimeout(280);
}

async function auditSelectedMobileSlides(){
  const session=await openLesson({width:390,height:844},'mobile');
  const {page,context,consoleErrors,pageErrors,failedRequests}=session;
  const slides=await page.evaluate(()=>window.LESSON_DATA.slides.map((slide,index)=>({index,title:slide.title})));
  const selected=slides.filter(slide=>mobileTitles.has(slide.title));
  if(selected.length!==mobileTitles.size)report.errors.push(`Mobile QA selected ${selected.length} of ${mobileTitles.size} expected high-risk slides`);
  for(const item of selected){
    await goToSlide(page,item.index);
    const state=await currentSlideState(page);
    recordSlide(state,item.index,'mobile');
    await exerciseSlideInteractions(page,state);
    const target=path.join(outputDir,`mobile-${String(item.index+1).padStart(3,'0')}-${slug(item.title)}.png`);
    await page.screenshot({path:target,fullPage:false});
    report.screenshots.push(target);
  }
  if(consoleErrors.length)report.errors.push(...consoleErrors.map(error=>`mobile console: ${error}`));
  if(pageErrors.length)report.errors.push(...pageErrors.map(error=>`mobile pageerror: ${error}`));
  if(failedRequests.length)report.warnings.push(...failedRequests.map(error=>`mobile request: ${error}`));
  await context.close();
}

async function auditRoute(hash,viewport,device,ready,screenshotName){
  const context=await browser.newContext({viewport,deviceScaleFactor:1,reducedMotion:'reduce',serviceWorkers:'block'});
  const page=await context.newPage();
  const consoleErrors=[],pageErrors=[];
  page.on('console',message=>{if(message.type()==='error'&&filteredConsoleError(message.text()))consoleErrors.push(message.text());});
  page.on('pageerror',error=>pageErrors.push(error.message));
  await page.addInitScript(()=>{try{localStorage.clear();sessionStorage.clear();}catch{}});
  await page.goto(`${lessonURL}${hash}`,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>document.body.dataset.rendered==='1'&&window.LESSON_DATA?.lesson?.number==='1.4',null,{timeout:30000});
  await page.locator(ready).first().waitFor({state:'attached',timeout:20000});
  await page.waitForTimeout(500);
  const routeState=await page.evaluate(()=>({
    hash:location.hash,
    bodyOverflow:Math.max(0,document.documentElement.scrollWidth-innerWidth,document.body.scrollWidth-innerWidth),
    rawMath:((document.getElementById('app')?.innerText||'').match(/\\\(|\\\[|\\\)|\\\]/g)||[]).length,
    mathErrors:document.querySelectorAll('[data-math-error="true"],.katex-error,.katex .merror').length,
    routeText:(document.querySelector('.route-page')?.innerText||'').replace(/\s+/g,' ').trim(),
    taskTabs:document.querySelectorAll('.exam-task-tabs button').length,
    partTabs:document.querySelectorAll('.exam-part-tabs button').length,
    visibleTaskCards:[...document.querySelectorAll('.exam-task-card')].filter(node=>getComputedStyle(node).display!=='none').length,
    visibleParts:[...document.querySelectorAll('.exam-part')].filter(node=>getComputedStyle(node).display!=='none').length,
    practiceFilters:[...document.querySelectorAll('[data-filter]')].map(node=>node.textContent.trim())
  }));
  const entry={device,hash,...routeState};report.routes.push(entry);
  if(routeState.bodyOverflow>3)report.errors.push(`${device} ${hash}: document overflows horizontally by ${routeState.bodyOverflow}px`);
  if(routeState.rawMath)report.errors.push(`${device} ${hash}: ${routeState.rawMath} raw math delimiter(s) remain visible`);
  if(routeState.mathErrors)report.errors.push(`${device} ${hash}: ${routeState.mathErrors} KaTeX error node(s)`);
  if(hash==='#practice'){
    if(!routeState.routeText.includes('120 original questions'))report.errors.push(`${device} practice: dynamic 120-question summary is missing`);
    for(const expected of ['All · 120','Foundation · 30','Application · 30','Reasoning · 30','Challenge · 30'])if(!routeState.practiceFilters.includes(expected))report.errors.push(`${device} practice: filter ${expected} is missing`);
  }
  if(hash==='#quiz'&&!routeState.routeText.includes('16-question checkpoint'))report.errors.push(`${device} quiz: dynamic 16-question heading is missing`);
  if(hash==='#exam'){
    if(routeState.taskTabs!==6)report.errors.push(`${device} exam: expected 6 task tabs, found ${routeState.taskTabs}`);
    if(routeState.visibleTaskCards!==1)report.errors.push(`${device} exam: expected one visible task, found ${routeState.visibleTaskCards}`);
    if(routeState.visibleParts!==1)report.errors.push(`${device} exam: expected one visible response part, found ${routeState.visibleParts}`);
    if(routeState.partTabs<5)report.errors.push(`${device} exam: focused part navigation is incomplete`);
  }
  if(consoleErrors.length)report.errors.push(...consoleErrors.map(error=>`${device} ${hash} console: ${error}`));
  if(pageErrors.length)report.errors.push(...pageErrors.map(error=>`${device} ${hash} pageerror: ${error}`));
  const target=path.join(outputDir,screenshotName);await page.screenshot({path:target,fullPage:false});report.screenshots.push(target);
  await context.close();
}

try{
  await auditAllDesktopSlides();
  await auditSelectedMobileSlides();
  await auditRoute('#practice',{width:1440,height:1000},'desktop','.question-shell','desktop-practice.png');
  await auditRoute('#exam',{width:1440,height:1000},'desktop','.exam-task-tabs','desktop-exam.png');
  await auditRoute('#quiz',{width:1440,height:1000},'desktop','.question-shell','desktop-quiz.png');
  await auditRoute('#exam',{width:390,height:844},'mobile','.exam-task-tabs','mobile-exam.png');
}finally{
  await browser.close();
}

const uniqueErrors=[...new Set(report.errors)];
const uniqueWarnings=[...new Set(report.warnings)];
report.errors=uniqueErrors;report.warnings=uniqueWarnings;
await writeFile(path.join(outputDir,'report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({slidesDesktop:report.desktopSlides.length,slidesMobile:report.mobileSlides.length,routes:report.routes.length,screenshots:report.screenshots.length,warnings:report.warnings.length,errors:report.errors.length},null,2));
if(report.errors.length){
  for(const error of report.errors)console.error(`ERROR: ${error}`);
  process.exitCode=1;
}
