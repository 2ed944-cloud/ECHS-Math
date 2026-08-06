import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseURL=process.env.ECHS_PREVIEW_URL||'http://127.0.0.1:4173';
const rootOutput=process.env.ECHS_PREVIEW_OUTPUT||'artifacts/phase3-visual';
const outputDir=path.join(rootOutput,'lesson-2.1-definitive-v3');
const lessonPath='/lessons/ib-math-ai/unit-2/lessons/IB_AI_SL_2.1_functions_domain_range_representations_ECHS.html';
const lessonURL=`${baseURL}${lessonPath}`;
const allURL=`${lessonURL}?scope=all`;
const storageKey='echs:ib-ai:u2:2.1:learn-index';
await mkdir(outputDir,{recursive:true});

const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--font-render-hinting=none']});
const report={generatedAt:new Date().toISOString(),lessonURL,allURL,expected:{stored:{slides:79,practice:80,quiz:14,exam:4},core:{slides:67,practice:72,quiz:12,exam:3}},core:null,desktopSlides:[],mobileSlides:[],routes:[],errors:[],warnings:[],screenshots:[]};
const screenshotTitles=new Set(['Functions, Domain, Range, and Representations','Mapping diagrams expose the rule','The vertical-line test','2.1B · Function notation, images and preimages','Number lines encode inclusion','Local and global extrema','Interactive feature trace','2.1E · Technology, inverse reflection and modelling','Interactive inverse-point reflection','Mastery evidence and next routes']);
const mobileTitles=new Set(['Functions, Domain, Range, and Representations','Mapping diagrams expose the rule','The vertical-line test','The recommended IB SL route','Number lines encode inclusion','Read endpoints directly from a graph','Local and global extrema','Interactive feature trace','Interactive domain-and-range laboratory','Interactive inverse-point reflection']);
const slug=value=>String(value).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,75);
const filteredConsoleError=text=>!/favicon|ERR_BLOCKED_BY_CLIENT|Failed to load resource.*404/i.test(text);

async function openLesson(viewport,label,{allContent=false,hash='#learn'}={}){
  const context=await browser.newContext({viewport,deviceScaleFactor:1,reducedMotion:'reduce',serviceWorkers:'block'});
  const page=await context.newPage();
  const consoleErrors=[],pageErrors=[],failedRequests=[];
  page.on('console',message=>{if(message.type()==='error'&&filteredConsoleError(message.text()))consoleErrors.push(message.text());});
  page.on('pageerror',error=>pageErrors.push(error.message));
  page.on('requestfailed',request=>failedRequests.push(`${request.method()} ${request.url()} :: ${request.failure()?.errorText||'failed'}`));
  const response=await page.goto(`${allContent?allURL:lessonURL}${hash}`,{waitUntil:'domcontentloaded',timeout:45000});
  if(!response||response.status()>=400)report.errors.push(`${label}: lesson returned ${response?.status()??'no response'}`);
  await page.waitForFunction(()=>document.body.dataset.rendered==='1'&&window.LESSON_DATA?.lesson?.number==='2.1',null,{timeout:30000});
  await page.waitForTimeout(350);
  return{context,page,consoleErrors,pageErrors,failedRequests};
}

function appendSessionErrors(label,session){
  if(session.consoleErrors.length)report.errors.push(...session.consoleErrors.map(error=>`${label} console: ${error}`));
  if(session.pageErrors.length)report.errors.push(...session.pageErrors.map(error=>`${label} pageerror: ${error}`));
  if(session.failedRequests.length)report.warnings.push(...session.failedRequests.map(error=>`${label} request: ${error}`));
}

async function currentSlideState(page){
  return page.evaluate(()=>{
    const app=document.getElementById('app'),stage=document.querySelector('.stage'),inner=document.querySelector('.stage-inner'),title=document.querySelector('.slide-title')||document.querySelector('.fn21-cover h1'),rect=title?.getBoundingClientRect(),progress=document.getElementById('progress-label')?.textContent?.trim()||'',canonical=Math.max(0,Number(progress.match(/^\d+/)?.[0]||1)-1),slide=window.LESSON_DATA?.slides?.[canonical],text=app?.innerText?.replace(/\s+/g,' ').trim()||'';
    return{title:slide?.title||'',scope:slide?.scope||'',progress,rawMath:(text.match(/\\\(|\\\[|\\\)|\\\]/g)||[]).length,mathErrors:document.querySelectorAll('[data-math-error="true"],.katex-error,.katex .merror').length,bodyOverflow:Math.max(0,document.documentElement.scrollWidth-innerWidth,document.body.scrollWidth-innerWidth),stageOverflowX:stage?Math.max(0,stage.scrollWidth-stage.clientWidth):0,stageOverflowY:stage?Math.max(0,stage.scrollHeight-stage.clientHeight):0,titleClipped:Boolean(rect&&(rect.left<-2||rect.right>innerWidth+2||rect.top<-2)),empty:text.length<28,textLength:text.length,stageInnerWidth:Math.round(inner?.getBoundingClientRect().width||0),interactive:{match:Boolean(document.querySelector('[data-fn21-match]')),trace:Boolean(document.querySelector('[data-fn21-trace]')),inverse:Boolean(document.querySelector('[data-fn21-inverse]')),lab:Boolean(document.querySelector('#lesson-lab[data-lab="2.1"]'))}};
  });
}

function recordSlide(state,index,device){
  const entry={index:index+1,...state};(device==='desktop'?report.desktopSlides:report.mobileSlides).push(entry);const label=`${device} slide ${index+1} (${state.title||'untitled'})`;
  if(state.empty)report.errors.push(`${label}: blank content`);if(state.mathErrors)report.errors.push(`${label}: ${state.mathErrors} KaTeX error node(s)`);if(state.rawMath)report.errors.push(`${label}: ${state.rawMath} raw math delimiter(s)`);if(state.bodyOverflow>3)report.errors.push(`${label}: document overflow ${state.bodyOverflow}px`);if(state.stageOverflowX>3)report.errors.push(`${label}: stage overflow ${state.stageOverflowX}px`);if(state.titleClipped)report.errors.push(`${label}: title clipped`);if(device==='desktop'&&state.stageOverflowY>620)report.warnings.push(`${label}: ${state.stageOverflowY}px vertical stage scrolling`);
}

async function exerciseInteractions(page,state){
  if(state.interactive.match){await page.locator('[data-fn21-match] [data-answer="1"]').click();const text=await page.locator('[data-fn21-match] .fn21-feedback').innerText();if(!/Correct/.test(text))report.errors.push('Representation-match interaction did not validate the correct model.');}
  if(state.interactive.trace){await page.locator('[data-trace-x]').fill('4');await page.waitForTimeout(80);const text=await page.locator('[data-trace-output]').innerText();if(!/x = 4\.0/.test(text)||!/f\(x\)/.test(text))report.errors.push('Feature-trace interaction did not update.');}
  if(state.interactive.inverse){await page.locator('[data-inverse-x]').fill('3');await page.waitForTimeout(80);const text=await page.locator('[data-inverse-readout]').innerText();if(!/\(3, 7\)/.test(text)||!/\(7, 3\)/.test(text))report.errors.push('Inverse-reflection interaction did not swap the coordinates.');}
  if(state.interactive.lab){await page.locator('[data-lab-field="a"]').fill('2');await page.locator('[data-lab-field="b"]').fill('8');await page.locator('[data-lab-field="m"]').fill('-1.5');await page.locator('#run-lab').click();await page.waitForTimeout(100);const text=await page.locator('#lab-output').innerText();if(!/Domain \[2, 8\]/.test(text)||!/range/.test(text))report.errors.push('Restricted-domain laboratory did not calculate domain and range evidence.');}
}

async function auditCore(){
  const session=await openLesson({width:1440,height:1000},'core');const{page,context}=session;
  await page.locator('#open-map').click();await page.waitForTimeout(140);
  const state=await page.evaluate(()=>{const d=window.LESSON_DATA,buttons=[...document.querySelectorAll('#drawer-list [data-slide-index]')];return{activeScope:d.lesson.active_scope,defaultScope:d.lesson.default_scope,scopeCounts:d.lesson.scope_counts,practice:d.practice.length,quiz:d.quiz.length,exam:d.exam.length,storedSlides:d.scopeCollections.slides.length,storedPractice:d.scopeCollections.practice.length,storedQuiz:d.scopeCollections.quiz.length,storedExam:d.scopeCollections.exam.length,visibleMap:buttons.filter(button=>!button.hidden).length,hiddenMap:buttons.filter(button=>button.hidden).length,toggle:document.querySelector('#fn21-scope-toggle .tool-label')?.textContent?.trim()||'',learnLabel:document.querySelector('[data-route="learn"]')?.textContent?.trim()||'',progress:document.getElementById('progress-label')?.textContent?.trim()||'',overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth,document.body.scrollWidth-innerWidth)};});
  report.core=state;const e=report.expected;
  if(state.activeScope!=='core'||state.defaultScope!=='core')report.errors.push(`Core scope is ${state.activeScope}/${state.defaultScope}`);if(state.scopeCounts?.learn?.core!==e.core.slides)report.errors.push(`Core Learn count is ${state.scopeCounts?.learn?.core}`);if(state.practice!==e.core.practice||state.quiz!==e.core.quiz||state.exam!==e.core.exam)report.errors.push(`Core assessment counts are ${state.practice}/${state.quiz}/${state.exam}`);if(state.storedSlides!==e.stored.slides||state.storedPractice!==e.stored.practice||state.storedQuiz!==e.stored.quiz||state.storedExam!==e.stored.exam)report.errors.push('Stored all-content collections changed.');if(state.visibleMap!==e.core.slides||state.hiddenMap!==e.stored.slides-e.core.slides)report.errors.push(`Core map has ${state.visibleMap} visible and ${state.hiddenMap} hidden.`);if(state.toggle!=='IB SL Core'||!state.learnLabel.includes('IB SL Core'))report.errors.push('Core scope labels are missing.');if(!state.progress.includes(`/ ${e.core.slides} · IB SL Core`))report.errors.push(`Core progress is ${state.progress}`);if(state.overflow>3)report.errors.push(`Core route overflow ${state.overflow}px`);
  const target=path.join(outputDir,'desktop-core-scope.png');await page.screenshot({path:target,fullPage:false});report.screenshots.push(target);appendSessionErrors('core',session);await context.close();
}

async function auditAllDesktopSlides(){
  const session=await openLesson({width:1440,height:1000},'desktop-all',{allContent:true});const{page,context}=session;
  await page.waitForFunction(()=>window.LESSON_DATA.lesson.active_scope==='all'&&window.LESSON_DATA.slides.length===79,null,{timeout:10000});
  for(let index=0;index<79;index+=1){await page.waitForFunction(expected=>document.getElementById('progress-label')?.textContent?.trim().startsWith(`${expected} /`),index+1,{timeout:10000});await page.waitForTimeout(30);const state=await currentSlideState(page);recordSlide(state,index,'desktop');await exerciseInteractions(page,state);if(screenshotTitles.has(state.title)){const target=path.join(outputDir,`desktop-${String(index+1).padStart(3,'0')}-${slug(state.title)}.png`);await page.screenshot({path:target,fullPage:false});report.screenshots.push(target);}if(index<78){await page.locator('#next-slide').click();await page.waitForFunction(expected=>document.getElementById('progress-label')?.textContent?.trim().startsWith(`${expected} /`),index+2,{timeout:10000});}}
  appendSessionErrors('desktop-all',session);await context.close();
}

async function goToSlide(page,index){await page.evaluate(({key,index})=>{localStorage.setItem(key,String(index));location.hash='#learn';location.reload();},{key:storageKey,index});await page.waitForFunction(expected=>document.body.dataset.rendered==='1'&&document.getElementById('progress-label')?.textContent?.trim().startsWith(`${expected} /`),index+1,{timeout:30000});await page.waitForTimeout(220);}
async function auditMobile(){
  const session=await openLesson({width:390,height:844},'mobile-all',{allContent:true});const{page,context}=session;const selected=await page.evaluate(titles=>window.LESSON_DATA.slides.map((slide,index)=>({index,title:slide.title})).filter(item=>titles.includes(item.title)),[...mobileTitles]);if(selected.length!==mobileTitles.size)report.errors.push(`Mobile selected ${selected.length}/${mobileTitles.size} slides.`);for(const item of selected){await goToSlide(page,item.index);const state=await currentSlideState(page);recordSlide(state,item.index,'mobile');await exerciseInteractions(page,state);const target=path.join(outputDir,`mobile-${String(item.index+1).padStart(3,'0')}-${slug(item.title)}.png`);await page.screenshot({path:target,fullPage:false});report.screenshots.push(target);}appendSessionErrors('mobile-all',session);await context.close();
}

async function auditRoute({allContent,hash,viewport,device,ready,screenshotName}){
  const session=await openLesson(viewport,`${device}-${allContent?'all':'core'}-${hash}`,{allContent,hash});const{page,context}=session;await page.locator(ready).first().waitFor({state:'attached',timeout:20000});await page.waitForTimeout(350);const state=await page.evaluate(()=>({activeScope:window.LESSON_DATA.lesson.active_scope,practice:window.LESSON_DATA.practice.length,quiz:window.LESSON_DATA.quiz.length,exam:window.LESSON_DATA.exam.length,routeText:(document.querySelector('.route-page')?.innerText||'').replace(/\s+/g,' ').trim(),filters:[...document.querySelectorAll('[data-filter]')].map(node=>node.textContent.trim()),tasks:document.querySelectorAll('.exam-task').length,parts:document.querySelectorAll('.exam-part').length,rawMath:((document.getElementById('app')?.innerText||'').match(/\\\(|\\\[|\\\)|\\\]/g)||[]).length,mathErrors:document.querySelectorAll('[data-math-error="true"],.katex-error,.katex .merror').length,overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth,document.body.scrollWidth-innerWidth)}));report.routes.push({device,allContent,hash,...state});const expected=allContent?report.expected.stored:report.expected.core;if(state.activeScope!==(allContent?'all':'core'))report.errors.push(`${device} ${hash}: wrong scope ${state.activeScope}`);if(state.rawMath||state.mathErrors)report.errors.push(`${device} ${hash}: raw math ${state.rawMath}, errors ${state.mathErrors}`);if(state.overflow>3)report.errors.push(`${device} ${hash}: overflow ${state.overflow}px`);if(hash==='#practice'){if(state.practice!==expected.practice)report.errors.push(`${device} practice count ${state.practice}`);const expectedFilters=allContent?['All · 80','Foundation · 20','Application · 20','Reasoning · 20','Challenge · 20']:['All · 72','Foundation · 20','Application · 19','Reasoning · 20','Challenge · 13'];for(const item of expectedFilters)if(!state.filters.includes(item))report.errors.push(`${device} practice missing ${item}`);}if(hash==='#quiz'&&(state.quiz!==expected.quiz||!state.routeText.includes(`${expected.quiz}-question`)))report.errors.push(`${device} quiz count/heading is incorrect.`);if(hash==='#exam'&&(state.exam!==expected.exam||state.tasks!==expected.exam))report.errors.push(`${device} exam count is ${state.exam}/${state.tasks}`);const target=path.join(outputDir,screenshotName);await page.screenshot({path:target,fullPage:false});report.screenshots.push(target);appendSessionErrors(`${device}-${hash}`,session);await context.close();
}

try{
  await auditCore();await auditAllDesktopSlides();await auditMobile();
  await auditRoute({allContent:false,hash:'#practice',viewport:{width:1440,height:1000},device:'desktop-core',ready:'.question-shell',screenshotName:'desktop-core-practice.png'});
  await auditRoute({allContent:false,hash:'#exam',viewport:{width:1440,height:1000},device:'desktop-core',ready:'.exam-task',screenshotName:'desktop-core-exam.png'});
  await auditRoute({allContent:false,hash:'#quiz',viewport:{width:1440,height:1000},device:'desktop-core',ready:'.question-shell',screenshotName:'desktop-core-quiz.png'});
  await auditRoute({allContent:true,hash:'#practice',viewport:{width:1440,height:1000},device:'desktop-all',ready:'.question-shell',screenshotName:'desktop-all-practice.png'});
  await auditRoute({allContent:true,hash:'#exam',viewport:{width:1440,height:1000},device:'desktop-all',ready:'.exam-task',screenshotName:'desktop-all-exam.png'});
  await auditRoute({allContent:true,hash:'#quiz',viewport:{width:1440,height:1000},device:'desktop-all',ready:'.question-shell',screenshotName:'desktop-all-quiz.png'});
  await auditRoute({allContent:false,hash:'#exam',viewport:{width:390,height:844},device:'mobile-core',ready:'.exam-task',screenshotName:'mobile-core-exam.png'});
}finally{await browser.close();}
report.errors=[...new Set(report.errors)];report.warnings=[...new Set(report.warnings)];await writeFile(path.join(outputDir,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({core:report.core,slidesDesktop:report.desktopSlides.length,slidesMobile:report.mobileSlides.length,routes:report.routes.length,screenshots:report.screenshots.length,warnings:report.warnings.length,errors:report.errors.length},null,2));if(report.errors.length){for(const error of report.errors)console.error(`ERROR: ${error}`);process.exitCode=1;}
