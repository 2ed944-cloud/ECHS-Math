import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseURL=process.env.ECHS_PREVIEW_URL||'http://127.0.0.1:4173';
const rootOutput=process.env.ECHS_PREVIEW_OUTPUT||'artifacts/phase3-visual';
const outputDir=path.join(rootOutput,'lesson-2.1-v4');
const lessonURL=`${baseURL}/lessons/ib-math-ai/unit-2/lessons/IB_AI_SL_2.1_functions_domain_range_representations_ECHS.html`;
const storageKey='echs:ib-ai:u2:2.1:learn-index';
await mkdir(outputDir,{recursive:true});

const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--font-render-hinting=none']});
const report={generatedAt:new Date().toISOString(),lessonURL,expected:{slides:72,practice:80,quiz:16,exam:6},desktopSlides:[],mobileSlides:[],routes:[],errors:[],warnings:[],screenshots:[]};
const screenshotTitles=new Set(['Functions, Domain, Range, and Representations','Airport parking: one time, one charge','Three mapping patterns','The vertical-line test','Images and preimages ask opposite questions','Open and closed endpoints','Turning points can control the range','Read a complete feature set','TI-84 workflow · Intersect','Swap coordinates to form the inverse relation','A complete function analysis']);
const mobileTitles=new Set(['Functions, Domain, Range, and Representations','Airport parking: one time, one charge','Three mapping patterns','The vertical-line test','Read images and preimages from a graph','Equivalent notations','Read endpoints from a graph','Read a complete feature set','TI-84 workflow · Zero','TI-84 workflow · Intersect','Interactive reflection','A complete function analysis']);
const slug=value=>String(value).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,78);
const filterConsole=text=>!/favicon|ERR_BLOCKED_BY_CLIENT|Failed to load resource.*404/i.test(text);

async function openLesson(viewport,label,hash='#learn'){
  const context=await browser.newContext({viewport,deviceScaleFactor:1,reducedMotion:'reduce',serviceWorkers:'block'});
  const page=await context.newPage();
  const consoleErrors=[],pageErrors=[],failedRequests=[];
  page.on('console',message=>{if(message.type()==='error'&&filterConsole(message.text()))consoleErrors.push(message.text());});
  page.on('pageerror',error=>pageErrors.push(error.message));
  page.on('requestfailed',request=>failedRequests.push(`${request.method()} ${request.url()} :: ${request.failure()?.errorText||'failed'}`));
  const response=await page.goto(`${lessonURL}${hash}`,{waitUntil:'domcontentloaded',timeout:45000});
  if(!response||response.status()>=400)report.errors.push(`${label}: request returned ${response?.status()??'no response'}`);
  await page.waitForFunction(()=>document.body.dataset.rendered==='1'&&window.LESSON_DATA?.lesson?.number==='2.1',null,{timeout:30000});
  await page.waitForTimeout(350);
  return{context,page,consoleErrors,pageErrors,failedRequests};
}
function appendErrors(label,session){
  report.errors.push(...session.consoleErrors.map(error=>`${label} console: ${error}`));
  report.errors.push(...session.pageErrors.map(error=>`${label} pageerror: ${error}`));
  report.warnings.push(...session.failedRequests.map(error=>`${label} request: ${error}`));
}
async function state(page){
  return page.evaluate(()=>{
    const app=document.getElementById('app');
    const stage=document.querySelector('.stage');
    const title=document.querySelector('.slide-title')||document.querySelector('.fn4-cover h1');
    const rect=title?.getBoundingClientRect();
    const progress=document.getElementById('progress-label')?.textContent?.trim()||'';
    const index=Math.max(0,Number(progress.match(/^\d+/)?.[0]||1)-1);
    const slide=window.LESSON_DATA?.slides?.[index];
    const text=(app?.innerText||'').replace(/\s+/g,' ').trim();
    const placeholders=[...document.querySelectorAll('[data-fn4-visual]')];
    return{
      index,title:slide?.title||'',progress,textLength:text.length,
      rawMath:(text.match(/\\\(|\\\[|\\\)|\\\]/g)||[]).length,
      mathErrors:document.querySelectorAll('[data-math-error="true"],.katex-error,.katex .merror').length,
      bodyOverflow:Math.max(0,document.documentElement.scrollWidth-innerWidth,document.body.scrollWidth-innerWidth),
      stageOverflowX:stage?Math.max(0,stage.scrollWidth-stage.clientWidth):0,
      stageOverflowY:stage?Math.max(0,stage.scrollHeight-stage.clientHeight):0,
      titleClipped:Boolean(rect&&(rect.left<-2||rect.right>innerWidth+2||rect.top<-2)),
      placeholders:placeholders.length,
      renderedVisuals:placeholders.filter(node=>node.querySelector('svg')).length,
      inverse:Boolean(document.querySelector('[data-fn4-inverse]'))
    };
  });
}
function record(item,slideIndex,device){
  const entry={slide:slideIndex+1,...item};(device==='desktop'?report.desktopSlides:report.mobileSlides).push(entry);
  const label=`${device} slide ${slideIndex+1} (${item.title||'untitled'})`;
  if(item.textLength<28)report.errors.push(`${label}: content is blank`);
  if(item.rawMath)report.errors.push(`${label}: ${item.rawMath} raw math delimiters`);
  if(item.mathErrors)report.errors.push(`${label}: ${item.mathErrors} KaTeX errors`);
  if(item.bodyOverflow>3)report.errors.push(`${label}: document overflow ${item.bodyOverflow}px`);
  if(item.stageOverflowX>3)report.errors.push(`${label}: stage overflow ${item.stageOverflowX}px`);
  if(item.titleClipped)report.errors.push(`${label}: title clipped`);
  if(item.renderedVisuals!==item.placeholders)report.errors.push(`${label}: ${item.renderedVisuals}/${item.placeholders} visuals rendered`);
  if(device==='desktop'&&item.stageOverflowY>650)report.warnings.push(`${label}: ${item.stageOverflowY}px vertical scrolling`);
}
async function exercise(page,item){
  if(item.inverse){
    await page.locator('[data-fn4-inverse-x]').fill('3');
    await page.waitForTimeout(80);
    const text=await page.locator('[data-fn4-inverse-readout]').innerText();
    if(!/\(3, 7\)/.test(text)||!/\(7, 3\)/.test(text))report.errors.push('Inverse-reflection interaction did not swap coordinates.');
  }
}

async function auditDesktop(){
  const session=await openLesson({width:1440,height:1000},'desktop');
  const{page,context}=session;
  const counts=await page.evaluate(()=>({slides:window.LESSON_DATA.slides.length,practice:window.LESSON_DATA.practice.length,quiz:window.LESSON_DATA.quiz.length,exam:window.LESSON_DATA.exam.length}));
  if(JSON.stringify(counts)!==JSON.stringify(report.expected))report.errors.push(`Loaded counts ${JSON.stringify(counts)}`);
  for(let index=0;index<72;index+=1){
    await page.waitForFunction(expected=>document.getElementById('progress-label')?.textContent?.trim().startsWith(`${expected} /`),index+1,{timeout:10000});
    await page.waitForTimeout(35);
    const item=await state(page);record(item,index,'desktop');await exercise(page,item);
    if(screenshotTitles.has(item.title)){const target=path.join(outputDir,`desktop-${String(index+1).padStart(3,'0')}-${slug(item.title)}.png`);await page.screenshot({path:target,fullPage:false});report.screenshots.push(target);}
    if(index<71){await page.locator('#next-slide').click();await page.waitForFunction(expected=>document.getElementById('progress-label')?.textContent?.trim().startsWith(`${expected} /`),index+2,{timeout:10000});}
  }
  appendErrors('desktop',session);await context.close();
}
async function goTo(page,index){
  await page.evaluate(({key,index})=>{localStorage.setItem(key,String(index));location.hash='#learn';location.reload();},{key:storageKey,index});
  await page.waitForFunction(expected=>document.body.dataset.rendered==='1'&&document.getElementById('progress-label')?.textContent?.trim().startsWith(`${expected} /`),index+1,{timeout:30000});
  await page.waitForTimeout(220);
}
async function auditMobile(){
  const session=await openLesson({width:390,height:844},'mobile');const{page,context}=session;
  const selected=await page.evaluate(titles=>window.LESSON_DATA.slides.map((slide,index)=>({index,title:slide.title})).filter(item=>titles.includes(item.title)),[...mobileTitles]);
  if(selected.length!==mobileTitles.size)report.errors.push(`Mobile selected ${selected.length}/${mobileTitles.size} screens`);
  for(const item of selected){await goTo(page,item.index);const current=await state(page);record(current,item.index,'mobile');await exercise(page,current);const target=path.join(outputDir,`mobile-${String(item.index+1).padStart(3,'0')}-${slug(item.title)}.png`);await page.screenshot({path:target,fullPage:false});report.screenshots.push(target);}
  appendErrors('mobile',session);await context.close();
}
async function auditRoute(hash,ready,expectedCount,name,viewport={width:1440,height:1000}){
  const session=await openLesson(viewport,name,hash);const{page,context}=session;
  await page.locator(ready).first().waitFor({state:'attached',timeout:20000});await page.waitForTimeout(300);
  const route=await page.evaluate(()=>({hash:location.hash,practice:window.LESSON_DATA.practice.length,quiz:window.LESSON_DATA.quiz.length,exam:window.LESSON_DATA.exam.length,rawMath:((document.getElementById('app')?.innerText||'').match(/\\\(|\\\[|\\\)|\\\]/g)||[]).length,mathErrors:document.querySelectorAll('[data-math-error="true"],.katex-error,.katex .merror').length,overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth,document.body.scrollWidth-innerWidth),taskCards:document.querySelectorAll('.exam-task').length,filters:[...document.querySelectorAll('[data-filter]')].map(node=>node.textContent.trim())}));
  report.routes.push(route);
  const actual=hash==='#practice'?route.practice:hash==='#quiz'?route.quiz:route.exam;
  if(actual!==expectedCount)report.errors.push(`${name}: expected ${expectedCount}, found ${actual}`);
  if(route.rawMath||route.mathErrors)report.errors.push(`${name}: raw math ${route.rawMath}, KaTeX errors ${route.mathErrors}`);
  if(route.overflow>3)report.errors.push(`${name}: overflow ${route.overflow}px`);
  if(hash==='#practice'){for(const label of ['All · 80','Foundation · 20','Application · 20','Reasoning · 20','Challenge · 20'])if(!route.filters.includes(label))report.errors.push(`${name}: missing ${label}`);}
  if(hash==='#exam'&&route.taskCards!==6)report.errors.push(`${name}: expected 6 task cards, found ${route.taskCards}`);
  const target=path.join(outputDir,`${name}.png`);await page.screenshot({path:target,fullPage:false});report.screenshots.push(target);appendErrors(name,session);await context.close();
}

try{
  await auditDesktop();
  await auditMobile();
  await auditRoute('#practice','.question-shell',80,'desktop-practice');
  await auditRoute('#quiz','.question-shell',16,'desktop-quiz');
  await auditRoute('#exam','.exam-task',6,'desktop-exam');
  await auditRoute('#exam','.exam-task',6,'mobile-exam',{width:390,height:844});
}finally{await browser.close();}
report.errors=[...new Set(report.errors)];report.warnings=[...new Set(report.warnings)];
await writeFile(path.join(outputDir,'report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({slidesDesktop:report.desktopSlides.length,slidesMobile:report.mobileSlides.length,routes:report.routes.length,screenshots:report.screenshots.length,warnings:report.warnings.length,errors:report.errors.length},null,2));
if(report.errors.length){for(const error of report.errors)console.error(`ERROR: ${error}`);process.exitCode=1;}
