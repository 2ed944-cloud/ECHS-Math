import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseURL=process.env.ECHS_PREVIEW_URL||'http://127.0.0.1:4173';
const rootOutput=process.env.ECHS_PREVIEW_OUTPUT||'artifacts/phase3-visual';
const outputDir=path.join(rootOutput,'lesson-1.4-financial-v6-2');
const lessonPath='/lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.4_financial_models_ECHS.html';
await mkdir(outputDir,{recursive:true});

const scopes={
  core:{query:'',expected:{slides:31,practice:40,quiz:10,exam:3},storageKey:'echs:ib-ai:u1:1.4:learn-index'},
  extension:{query:'?scope=extension',expected:{slides:71,practice:80,quiz:12,exam:6},storageKey:'echs:ib-ai:u1:1.4:extension:learn-index'}
};
const report={generatedAt:new Date().toISOString(),lessonPath,scopes:{},errors:[],warnings:[],screenshots:[]};
const browser=await chromium.launch({
  executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',
  headless:true,
  args:['--no-sandbox','--disable-dev-shm-usage','--font-render-hinting=none']
});

function filteredConsoleError(text){return !/favicon|ERR_BLOCKED_BY_CLIENT|Failed to load resource.*404/i.test(text);}
function slug(value){return String(value).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,76);}
function lessonURL(scope,hash='#learn'){
  const query=scopes[scope].query;
  return `${baseURL}${lessonPath}${query}${hash}`;
}

async function openLesson(scope,viewport,label,hash='#learn'){
  const context=await browser.newContext({viewport,deviceScaleFactor:1,reducedMotion:'reduce',serviceWorkers:'block',bypassCSP:true});
  const page=await context.newPage();
  const consoleErrors=[],pageErrors=[],failedRequests=[];
  page.on('console',message=>{if(message.type()==='error'&&filteredConsoleError(message.text()))consoleErrors.push(message.text());});
  page.on('pageerror',error=>pageErrors.push(error.message));
  page.on('requestfailed',request=>failedRequests.push(`${request.method()} ${request.url()} :: ${request.failure()?.errorText||'failed'}`));
  const response=await page.goto(lessonURL(scope,hash),{waitUntil:'domcontentloaded',timeout:45000});
  if(!response||response.status()>=400)report.errors.push(`${label}: lesson request returned ${response?.status()??'no response'}`);
  await page.waitForFunction(({scope,count})=>document.body.dataset.rendered==='1'&&window.LESSON_DATA?.financialScope===scope&&window.LESSON_DATA?.slides?.length===count,{scope,count:scopes[scope].expected.slides},{timeout:30000});
  await page.waitForTimeout(400);
  return{context,page,consoleErrors,pageErrors,failedRequests};
}

async function currentSlideState(page){
  return page.evaluate(()=>{
    const app=document.getElementById('app');
    const stage=document.querySelector('.stage');
    const titleNode=document.querySelector('.slide-title')||document.querySelector('.fin-cover h1');
    const titleRect=titleNode?.getBoundingClientRect();
    const progress=document.getElementById('progress-label')?.textContent?.trim()||'';
    const index=Math.max(0,(Number(progress.match(/^\d+/)?.[0]||1)-1));
    const slide=window.LESSON_DATA?.slides?.[index]||{};
    const text=app?.innerText?.replace(/\s+/g,' ').trim()||'';
    return{
      index,title:slide.title||'',block:slide.teachingBlock||'',classification:slide.classification||'',progress,
      rawMath:(text.match(/\\\(|\\\[|\\\)|\\\]/g)||[]).length,
      mathErrors:document.querySelectorAll('[data-math-error="true"],.katex-error,.katex .merror').length,
      bodyOverflow:Math.max(0,document.documentElement.scrollWidth-innerWidth,document.body.scrollWidth-innerWidth),
      stageOverflowX:stage?Math.max(0,stage.scrollWidth-stage.clientWidth):0,
      stageOverflowY:stage?Math.max(0,stage.scrollHeight-stage.clientHeight):0,
      titleClipped:Boolean(titleRect&&(titleRect.left<-2||titleRect.right>innerWidth+2||titleRect.top<-2)),
      empty:text.length<28,textLength:text.length,
      blockBoundary:Boolean(slide.blockBoundary),
      interactive:{compound:Boolean(document.querySelector('[data-fin-compound-explorer],[data-core-fin-explorer]')),cashflow:Boolean(document.querySelector('[data-fin-cashflow-explorer]')),generator:Boolean(document.querySelector('[data-fin-generator],[data-core-generator]'))}
    };
  });
}

function recordSlide(scope,device,state){
  const item={number:state.index+1,...state};
  report.scopes[scope][device].push(item);
  const label=`${scope} ${device} slide ${state.index+1} (${state.title||'untitled'})`;
  if(state.empty)report.errors.push(`${label}: rendered content is blank`);
  if(state.mathErrors)report.errors.push(`${label}: ${state.mathErrors} KaTeX rendering error node(s)`);
  if(state.rawMath)report.errors.push(`${label}: ${state.rawMath} raw math delimiter(s) remain visible`);
  if(state.bodyOverflow>3)report.errors.push(`${label}: document overflows horizontally by ${state.bodyOverflow}px`);
  if(state.stageOverflowX>3)report.errors.push(`${label}: lesson stage overflows horizontally by ${state.stageOverflowX}px`);
  if(state.titleClipped)report.errors.push(`${label}: title is clipped outside the viewport`);
  if(device==='desktop'&&state.stageOverflowY>600)report.warnings.push(`${label}: requires ${state.stageOverflowY}px of vertical stage scrolling`);
  if(!/^1\.4[A-G]$/.test(state.block))report.errors.push(`${label}: teaching block metadata is missing`);
  if(!['Core','Practice','Extension','Revision'].includes(state.classification))report.errors.push(`${label}: classification metadata is missing`);
}

async function exerciseInteractions(page,scope,state){
  if(state.interactive.compound){
    const prefix=scope==='core'?'core':'fin';
    await page.locator(`[data-${prefix}-rate]`).fill('6.25');
    await page.locator(`[data-${prefix}-frequency]`).fill('4');
    await page.locator(`[data-${prefix}-years]`).fill('7');
    await page.locator(scope==='core'?'[data-core-update]':'[data-fin-compound-update]').click();
    await page.waitForTimeout(120);
    const values=await page.locator('.fin-explorer-summary').first().innerText();
    const expected=scope==='core'?/Periodic rate[\s\S]*Future value/:/Periodic rate[\s\S]*Effective annual[\s\S]*Future value[\s\S]*Real value/;
    if(!expected.test(values))report.errors.push(`${scope}: compound explorer did not update required outputs`);
  }
  if(state.interactive.cashflow){
    await page.locator('[data-fin-mode="loan"]').click();
    await page.locator('[data-fin-cf-payment]').fill('1200');
    await page.locator('[data-fin-cf-update]').click();
    await page.waitForTimeout(120);
    const values=await page.locator('.fin-explorer-summary').first().innerText();
    if(!/Balance after|Total paid|Interest charged|Required level payment/.test(values))report.errors.push('Extension loan explorer did not render balance and payment evidence');
  }
  if(state.interactive.generator){
    const core=scope==='core';
    await page.locator(core?'[data-core-gen-new]':'[data-fin-gen-new]').click();
    await page.locator(core?'[data-core-gen-solution]':'[data-fin-gen-solution]').click();
    await page.waitForTimeout(100);
    if(await page.locator(core?'[data-core-gen-solution-box]':'[data-fin-gen-solution-box]').getAttribute('hidden')!==null)report.errors.push(`${scope}: Financial Studio did not reveal reasoning`);
  }
}

async function auditSlides(scope,viewport,device,selectedOnly=false){
  const session=await openLesson(scope,viewport,`${scope}-${device}`);
  const {page,context,consoleErrors,pageErrors,failedRequests}=session;
  const total=scopes[scope].expected.slides;
  let indices=[...Array(total).keys()];
  if(selectedOnly){
    const anchors=scope==='core'?[0,6,12,20,21,27,28,29,30]:[0,20,23,42,48,57,64,67,70];
    indices=anchors.filter(index=>index<total);
  }
  for(const index of indices){
    if(selectedOnly){
      await page.evaluate(({key,index})=>{localStorage.setItem(key,String(index));location.reload();},{key:scopes[scope].storageKey,index});
      await page.waitForFunction(({scope,number})=>document.body.dataset.rendered==='1'&&window.LESSON_DATA?.financialScope===scope&&document.getElementById('progress-label')?.textContent?.trim().startsWith(`${number} /`),{scope,number:index+1},{timeout:30000});
      await page.waitForTimeout(200);
    }
    const state=await currentSlideState(page);
    recordSlide(scope,device,state);
    await exerciseInteractions(page,scope,state);
    const highRisk=selectedOnly||state.blockBoundary||state.interactive.compound||state.interactive.cashflow||state.interactive.generator||state.title==='1.4 · Financial Applications';
    if(highRisk){
      const target=path.join(outputDir,`${scope}-${device}-${String(index+1).padStart(3,'0')}-${slug(state.title)}.png`);
      await page.screenshot({path:target,fullPage:false});report.screenshots.push(target);
    }
    if(!selectedOnly&&index<total-1){
      await page.evaluate(()=>document.getElementById('next-slide')?.click());
      await page.waitForFunction(number=>document.getElementById('progress-label')?.textContent?.trim().startsWith(`${number} /`),index+2,{timeout:10000});
    }
  }
  if(consoleErrors.length)report.errors.push(...consoleErrors.map(error=>`${scope} ${device} console: ${error}`));
  if(pageErrors.length)report.errors.push(...pageErrors.map(error=>`${scope} ${device} pageerror: ${error}`));
  if(failedRequests.length)report.warnings.push(...failedRequests.map(error=>`${scope} ${device} request: ${error}`));
  await context.close();
}

async function auditRoute(scope,hash,viewport,device,ready){
  const session=await openLesson(scope,viewport,`${scope}-${device}-${hash}`,hash);
  const {page,context,consoleErrors,pageErrors}=session;
  await page.locator(ready).first().waitFor({state:'attached',timeout:20000});
  await page.waitForTimeout(350);
  const state=await page.evaluate(()=>({
    routeText:(document.querySelector('.route-page')?.innerText||'').replace(/\s+/g,' ').trim(),
    bodyOverflow:Math.max(0,document.documentElement.scrollWidth-innerWidth,document.body.scrollWidth-innerWidth),
    rawMath:((document.getElementById('app')?.innerText||'').match(/\\\(|\\\[|\\\)|\\\]/g)||[]).length,
    mathErrors:document.querySelectorAll('[data-math-error="true"],.katex-error,.katex .merror').length,
    taskTabs:document.querySelectorAll('.exam-task-tabs button').length,
    visibleTaskCards:[...document.querySelectorAll('.exam-task')].filter(node=>getComputedStyle(node).display!=='none').length,
    visibleParts:[...document.querySelectorAll('.exam-part')].filter(node=>getComputedStyle(node).display!=='none').length,
    practiceFilters:[...document.querySelectorAll('[data-filter]')].map(node=>node.textContent.trim()),
    scopeButton:document.getElementById('financial-scope-toggle')?.textContent?.trim()||''
  }));
  report.scopes[scope].routes.push({device,hash,...state});
  const expected=scopes[scope].expected;
  if(state.bodyOverflow>3)report.errors.push(`${scope} ${device} ${hash}: horizontal overflow ${state.bodyOverflow}px`);
  if(state.rawMath)report.errors.push(`${scope} ${device} ${hash}: ${state.rawMath} raw math delimiters`);
  if(state.mathErrors)report.errors.push(`${scope} ${device} ${hash}: ${state.mathErrors} KaTeX error nodes`);
  if(hash==='#practice'){
    if(!state.routeText.includes(`${expected.practice} questions`))report.errors.push(`${scope} practice: dynamic question count is missing`);
    const levels=scope==='core'?{All:40,Foundation:20,Application:7,Reasoning:8,Challenge:5}:{All:80,Foundation:10,Application:23,Reasoning:22,Challenge:25};
    for(const [level,count] of Object.entries(levels))if(!state.practiceFilters.includes(`${level} · ${count}`))report.errors.push(`${scope} practice: ${level} · ${count} filter missing`);
  }
  if(hash==='#quiz'&&!state.routeText.includes(`${expected.quiz}-question checkpoint`))report.errors.push(`${scope} quiz heading is stale`);
  if(hash==='#exam'){
    if(state.taskTabs!==expected.exam)report.errors.push(`${scope} exam: expected ${expected.exam} task tabs, found ${state.taskTabs}`);
    if(state.visibleTaskCards!==1)report.errors.push(`${scope} exam: expected one visible task, found ${state.visibleTaskCards}`);
    if(state.visibleParts!==1)report.errors.push(`${scope} exam: expected one visible part, found ${state.visibleParts}`);
  }
  if(scope==='core'&&!/Optional applications/.test(state.scopeButton))report.errors.push('Core scope toggle label is missing');
  if(scope==='extension'&&!/Return to IB SL Core/.test(state.scopeButton))report.errors.push('Extension scope toggle label is missing');
  if(consoleErrors.length)report.errors.push(...consoleErrors.map(error=>`${scope} ${device} ${hash} console: ${error}`));
  if(pageErrors.length)report.errors.push(...pageErrors.map(error=>`${scope} ${device} ${hash} pageerror: ${error}`));
  const target=path.join(outputDir,`${scope}-${device}-${hash.slice(1)}.png`);await page.screenshot({path:target,fullPage:false});report.screenshots.push(target);
  await context.close();
}

try{
  for(const scope of Object.keys(scopes))report.scopes[scope]={expected:scopes[scope].expected,desktop:[],mobile:[],routes:[]};
  await auditSlides('core',{width:1440,height:1000},'desktop');
  await auditSlides('extension',{width:1440,height:1000},'desktop');
  await auditSlides('core',{width:390,height:844},'mobile',true);
  await auditSlides('extension',{width:390,height:844},'mobile',true);
  for(const scope of Object.keys(scopes)){
    await auditRoute(scope,'#practice',{width:1440,height:1000},'desktop','.question-shell');
    await auditRoute(scope,'#quiz',{width:1440,height:1000},'desktop','.question-shell');
    await auditRoute(scope,'#exam',{width:1440,height:1000},'desktop','.exam-task-tabs');
    await auditRoute(scope,'#exam',{width:390,height:844},'mobile','.exam-task-tabs');
  }
}finally{await browser.close();}

report.errors=[...new Set(report.errors)];report.warnings=[...new Set(report.warnings)];
await writeFile(path.join(outputDir,'report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({coreDesktop:report.scopes.core.desktop.length,extensionDesktop:report.scopes.extension.desktop.length,coreMobile:report.scopes.core.mobile.length,extensionMobile:report.scopes.extension.mobile.length,routes:report.scopes.core.routes.length+report.scopes.extension.routes.length,screenshots:report.screenshots.length,warnings:report.warnings.length,errors:report.errors.length},null,2));
if(report.errors.length){for(const error of report.errors)console.error(`ERROR: ${error}`);process.exitCode=1;}
