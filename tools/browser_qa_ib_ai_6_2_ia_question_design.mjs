import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseURL=process.env.ECHS_PREVIEW_URL||'http://127.0.0.1:4173';
const outputDir=path.join(process.env.ECHS_PREVIEW_OUTPUT||'artifacts/ib-ai-unit6-2','lesson-6.2');
const lessonURL=`${baseURL}/lessons/ib-math-ai/unit-6/lessons/IB_AI_SL_6.2_ia_question_design_ECHS.html`;
// The shared Unit 6 engine currently preserves its historical storage namespace.
const storageKey='echs:ib-ai:u2:6.2:learn-index';
await mkdir(outputDir,{recursive:true});

const browser=await chromium.launch({
  executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',
  headless:true,
  args:['--no-sandbox','--disable-dev-shm-usage','--font-render-hinting=none']
});
const expected={slides:57,practice:64,quiz:14,exam:4};
const report={generatedAt:new Date().toISOString(),lessonURL,expected,counts:null,desktopSlides:[],mobileSlides:[],routes:[],errors:[],warnings:[],screenshots:[]};
const desktopShots=new Set([
  'IA Question Design',
  'Launch · three questions about the same topic',
  'Anatomy of a precise research question',
  'The focus funnel',
  'Checkpoint A · the 90-second question audit',
  'The scope triangle · mathematics, data, and time must fit',
  'Build a connected mathematics map',
  'Choose comparison measures that answer the actual question',
  'TI‑84 prototype · enter lists and see the structure',
  'TI‑84 prototype · compare models and store the equations',
  'Interactive model laboratory · test whether the question has mathematical signal',
  'Interactive research-question builder',
  'The one-page proposal canvas',
  'Final synthesis · question-design release check'
]);
const mobileShots=new Set([
  'IA Question Design',
  'Anatomy of a precise research question',
  'Checkpoint A · the 90-second question audit',
  'The scope triangle · mathematics, data, and time must fit',
  'Choose comparison measures that answer the actual question',
  'There is no magic sample size',
  'TI‑84 prototype · compare models and store the equations',
  'Interactive model laboratory · test whether the question has mathematical signal',
  'Interactive research-question builder',
  'The one-page proposal canvas',
  'Final synthesis · question-design release check'
]);
const slug=value=>String(value).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80);
const consoleOkay=text=>!/favicon|ERR_BLOCKED_BY_CLIENT|Failed to load resource.*404/i.test(text);

async function open(viewport,label,hash='#learn'){
  const context=await browser.newContext({viewport,deviceScaleFactor:1,reducedMotion:'reduce',serviceWorkers:'block'});
  const page=await context.newPage();
  await page.route('https://ti84calc.com/**',route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>TI-84 simulator QA shell</title><p>TI-84 Plus CE</p>'}));
  const consoleErrors=[],pageErrors=[],failed=[];
  page.on('console',message=>{if(message.type()==='error'&&consoleOkay(message.text()))consoleErrors.push(message.text());});
  page.on('pageerror',error=>pageErrors.push(error.message));
  page.on('requestfailed',request=>failed.push(`${request.method()} ${request.url()} :: ${request.failure()?.errorText||'failed'}`));
  const response=await page.goto(`${lessonURL}${hash}`,{waitUntil:'domcontentloaded',timeout:45000});
  if(!response||response.status()>=400)report.errors.push(`${label}: HTTP ${response?.status()??'none'}`);
  await page.waitForFunction(()=>document.body.dataset.rendered==='1'&&window.LESSON_DATA?.version==='6.2.0',null,{timeout:30000});
  await page.waitForTimeout(350);
  return{context,page,consoleErrors,pageErrors,failed};
}
function appendDiagnostics(label,session){
  report.errors.push(...session.consoleErrors.map(item=>`${label} console: ${item}`),...session.pageErrors.map(item=>`${label} pageerror: ${item}`));
  report.warnings.push(...session.failed.map(item=>`${label} request: ${item}`));
}
async function slideState(page,index){
  return page.evaluate(index=>{
    const app=document.getElementById('app');
    const stage=document.querySelector('.stage');
    const slide=window.LESSON_DATA?.slides?.[index];
    const text=(app?.innerText||'').replace(/\s+/g,' ').trim();
    const title=document.querySelector('.slide-title')||document.querySelector('.u62-cover h1');
    const rect=title?.getBoundingClientRect();
    return{
      title:slide?.title||'',
      textLength:text.length,
      rawMath:(text.match(/\\\(|\\\[|\\\)|\\\]/g)||[]).length,
      mathErrors:document.querySelectorAll('[data-math-error="true"],.katex-error,.katex .merror').length,
      bodyOverflow:Math.max(0,document.documentElement.scrollWidth-innerWidth,document.body.scrollWidth-innerWidth),
      stageOverflowX:stage?Math.max(0,stage.scrollWidth-stage.clientWidth):0,
      stageScrollY:stage?Math.max(0,stage.scrollHeight-stage.clientHeight):0,
      titleClipped:Boolean(rect&&(rect.left<-2||rect.right>innerWidth+2)),
      svgCount:app?.querySelectorAll('svg').length||0,
      buttonCount:app?.querySelectorAll('button').length||0
    };
  },index);
}
function recordSlide(state,index,device){
  (device==='desktop'?report.desktopSlides:report.mobileSlides).push({slide:index+1,...state});
  const label=`${device} slide ${index+1} (${state.title})`;
  if(state.textLength<28)report.errors.push(`${label}: content appears blank`);
  if(state.rawMath)report.errors.push(`${label}: ${state.rawMath} raw math delimiters remain`);
  if(state.mathErrors)report.errors.push(`${label}: ${state.mathErrors} KaTeX errors`);
  if(state.bodyOverflow>3)report.errors.push(`${label}: body horizontal overflow ${state.bodyOverflow}px`);
  if(state.stageOverflowX>3)report.errors.push(`${label}: stage horizontal overflow ${state.stageOverflowX}px`);
  if(state.titleClipped)report.errors.push(`${label}: title is clipped horizontally`);
  if(device==='desktop'&&state.stageScrollY>1100)report.warnings.push(`${label}: unusually tall content ${state.stageScrollY}px`);
}
async function exerciseSlide(page,state){
  if(state.title==='Checkpoint A · the 90-second question audit'){
    await page.locator('[data-u62-audit-rq]').fill('To what extent can a quadratic model describe a bounded relationship according to validation MAE?');
    for(const box of await page.locator('[data-u62-audit-item]').all())await box.check();
    await page.locator('[data-u62-audit-run]').click();
    const text=await page.locator('[data-u62-audit-output]').innerText();
    if(!/12\s*\/\s*12/.test(text)||!/Promising question/i.test(text))report.errors.push(`Question audit interaction failed: ${text}`);
  }
  if(state.title==='Checkpoint B · build the architecture before the title'){
    await page.locator('[data-u62-scope-run]').click();
    const text=await page.locator('[data-u62-scope-output]').innerText();
    if(!/10\/10/.test(text)||!/Strong architecture signal/i.test(text))report.errors.push(`Scope audit interaction failed: ${text}`);
  }
  if(state.title==='Interactive model laboratory · test whether the question has mathematical signal'){
    await page.locator('[data-u62-model-run]').click();
    const text=await page.locator('[data-u62-model-output]').innerText();
    if(!/Linear:/.test(text)||!/Quadratic:/.test(text)||!/4\.471429/.test(text)||!/0\.52619/.test(text))report.errors.push(`Model laboratory output failed: ${text}`);
    if(await page.locator('[data-u62-model-plot] svg').count()!==1)report.errors.push('Model laboratory SVG plot was not rendered.');
  }
  if(state.title==='Interactive research-question builder'){
    await page.locator('[data-u62-builder-run]').click();
    const text=await page.locator('[data-u62-builder-output]').innerText();
    if(!/^Within /.test(text)||!/validation MAE/i.test(text))report.errors.push(`Research-question builder failed: ${text}`);
  }
  if(state.title==='TI‑84 prototype · enter lists and see the structure'){
    await page.locator('[data-open-ti84]').first().click();
    await page.locator('#u1-ti84-simulator').waitFor({state:'visible',timeout:5000});
    const simulator=await page.evaluate(()=>({
      src:document.querySelector('#u1-ti84-simulator iframe')?.dataset.src||'',
      model:window.LESSON_DATA?.ti84Simulator?.model||'',
      provider:window.LESSON_DATA?.ti84Simulator?.provider||'',
      lesson:window.LESSON_DATA?.ti84Simulator?.lessons||[]
    }));
    if(simulator.src!=='https://ti84calc.com/ti84calc'||simulator.model!=='TI-84 Plus CE'||simulator.provider!=='ti84calc.com'||!simulator.lesson.includes('6.2'))report.errors.push(`TI-84 simulator metadata failed: ${JSON.stringify(simulator)}`);
    const file=path.join(outputDir,'desktop-ti84-simulator.png');
    await page.screenshot({path:file,fullPage:false});report.screenshots.push(file);
    await page.locator('.u1-ti84-sim-close').click();
  }
  if(state.title==='Final synthesis · question-design release check'){
    if(await page.locator('.u62-final-checks input').count()!==10)report.errors.push('Final release checklist must contain exactly 10 checks.');
    if(await page.locator('#mark-lesson-complete').count()!==1)report.errors.push('Lesson completion control is missing.');
  }
}

async function desktopAudit(){
  const session=await open({width:1440,height:1000},'desktop');
  const{page,context}=session;
  report.counts=await page.evaluate(()=>({
    slides:LESSON_DATA.slides.length,
    practice:LESSON_DATA.practice.length,
    quiz:LESSON_DATA.quiz.length,
    exam:LESSON_DATA.exam.length,
    blocks:LESSON_DATA.slides.reduce((out,slide)=>(out[slide.block]=(out[slide.block]||0)+1,out),{}),
    levels:LESSON_DATA.practice.reduce((out,q)=>(out[q.level]=(out[q.level]||0)+1,out),{}),
    release:LESSON_DATA.questionDesignAudit?.release||'',
    simulator:LESSON_DATA.ti84Simulator||null
  }));
  if(JSON.stringify([report.counts.slides,report.counts.practice,report.counts.quiz,report.counts.exam])!==JSON.stringify([expected.slides,expected.practice,expected.quiz,expected.exam]))report.errors.push(`Lesson counts failed: ${JSON.stringify(report.counts)}`);
  if(JSON.stringify(report.counts.blocks)!==JSON.stringify({A:14,B:14,C:14,D:15}))report.errors.push(`Teaching block distribution failed: ${JSON.stringify(report.counts.blocks)}`);
  if(JSON.stringify(report.counts.levels)!==JSON.stringify({Foundation:16,Application:16,Reasoning:16,Challenge:16}))report.errors.push(`Practice distribution failed: ${JSON.stringify(report.counts.levels)}`);
  if(report.counts.release!=='6.2.0')report.errors.push(`Question-design release metadata failed: ${report.counts.release}`);
  for(let index=0;index<expected.slides;index++){
    await page.waitForFunction(number=>document.getElementById('progress-label')?.textContent?.trim().startsWith(`${number} /`),index+1,{timeout:15000});
    await page.waitForTimeout(45);
    const state=await slideState(page,index);
    recordSlide(state,index,'desktop');
    await exerciseSlide(page,state);
    if(desktopShots.has(state.title)){
      const file=path.join(outputDir,`desktop-${String(index+1).padStart(3,'0')}-${slug(state.title)}.png`);
      await page.screenshot({path:file,fullPage:false});report.screenshots.push(file);
    }
    if(index<expected.slides-1)await page.locator('#next-slide').click();
  }
  appendDiagnostics('desktop',session);
  await context.close();
}

async function mobileAudit(){
  const session=await open({width:390,height:844},'mobile');
  const{page,context}=session;
  const selected=await page.evaluate(titles=>LESSON_DATA.slides.map((slide,index)=>({title:slide.title,index})).filter(item=>titles.includes(item.title)),[...mobileShots]);
  if(selected.length!==mobileShots.size)report.errors.push(`Mobile screen selection failed: ${selected.length}/${mobileShots.size}`);
  for(const item of selected){
    await page.evaluate(({key,index})=>{localStorage.setItem(key,String(index));location.hash='#learn';location.reload();},{key:storageKey,index:item.index});
    await page.waitForFunction(number=>document.body.dataset.rendered==='1'&&document.getElementById('progress-label')?.textContent?.trim().startsWith(`${number} /`),item.index+1,{timeout:30000});
    await page.waitForTimeout(250);
    const state=await slideState(page,item.index);
    recordSlide(state,item.index,'mobile');
    await exerciseSlide(page,state);
    const file=path.join(outputDir,`mobile-${String(item.index+1).padStart(3,'0')}-${slug(item.title)}.png`);
    await page.screenshot({path:file,fullPage:false});report.screenshots.push(file);
  }
  appendDiagnostics('mobile',session);
  await context.close();
}

async function routeAudit(hash,selector,count,label,viewport={width:1440,height:1000}){
  const session=await open(viewport,label,hash);
  const{page,context}=session;
  await page.locator(selector).first().waitFor({state:'attached',timeout:20000});
  await page.waitForTimeout(250);
  const state=await page.evaluate(()=>({
    rawMath:((document.getElementById('app')?.innerText||'').match(/\\\(|\\\[|\\\)|\\\]/g)||[]).length,
    mathErrors:document.querySelectorAll('[data-math-error="true"],.katex-error,.katex .merror').length,
    overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth,document.body.scrollWidth-innerWidth),
    practice:LESSON_DATA.practice.length,
    quiz:LESSON_DATA.quiz.length,
    exam:LESSON_DATA.exam.length,
    filters:[...document.querySelectorAll('[data-filter]')].map(node=>node.textContent.trim()),
    cards:document.querySelectorAll('.exam-task').length
  }));
  report.routes.push({hash,label,...state});
  const actual=hash==='#practice'?state.practice:hash==='#quiz'?state.quiz:state.exam;
  if(actual!==count)report.errors.push(`${label}: route count ${actual}/${count}`);
  if(state.rawMath||state.mathErrors)report.errors.push(`${label}: raw math ${state.rawMath}, KaTeX errors ${state.mathErrors}`);
  if(state.overflow>3)report.errors.push(`${label}: horizontal overflow ${state.overflow}px`);
  if(hash==='#practice'){
    for(const expectedLabel of ['All · 64','Foundation · 16','Application · 16','Reasoning · 16','Challenge · 16'])if(!state.filters.includes(expectedLabel))report.errors.push(`${label}: missing filter ${expectedLabel}`);
    await page.locator('[data-filter="Challenge"]').click();await page.waitForTimeout(120);
    const prompt=(await page.locator('.question-prompt').innerText()).replace(/\s+/g,' ').trim();
    if(prompt.length<40)report.errors.push(`${label}: challenge prompt is unexpectedly short`);
  }
  if(hash==='#exam'&&state.cards!==4)report.errors.push(`${label}: extended task cards ${state.cards}/4`);
  const file=path.join(outputDir,`${label}.png`);await page.screenshot({path:file,fullPage:false});report.screenshots.push(file);
  appendDiagnostics(label,session);
  await context.close();
}

try{
  await desktopAudit();
  await mobileAudit();
  await routeAudit('#practice','.question-shell',64,'desktop-practice');
  await routeAudit('#quiz','.question-shell',14,'desktop-quiz');
  await routeAudit('#exam','.exam-task',4,'desktop-exam');
  await routeAudit('#exam','.exam-task',4,'mobile-exam',{width:390,height:844});
  await routeAudit('#review','.route-page',4,'desktop-mastery');
}finally{
  await browser.close();
}
report.errors=[...new Set(report.errors)];
report.warnings=[...new Set(report.warnings)];
await writeFile(path.join(outputDir,'report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({desktopSlides:report.desktopSlides.length,mobileSlides:report.mobileSlides.length,routes:report.routes.length,screenshots:report.screenshots.length,warnings:report.warnings.length,errors:report.errors.length},null,2));
if(report.errors.length){for(const error of report.errors)console.error(`ERROR: ${error}`);process.exitCode=1;}
