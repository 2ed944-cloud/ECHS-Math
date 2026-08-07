import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseURL=process.env.ECHS_PREVIEW_URL||'http://127.0.0.1:4173';
const outputDir=path.join(process.env.ECHS_PREVIEW_OUTPUT||'artifacts/phase3-visual','lesson-2.1-v5');
const lessonURL=`${baseURL}/lessons/ib-math-ai/unit-2/lessons/IB_AI_SL_2.1_functions_domain_range_representations_ECHS.html`;
const storageKey='echs:ib-ai:u2:2.1:learn-index';
await mkdir(outputDir,{recursive:true});

const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--font-render-hinting=none']});
const report={generatedAt:new Date().toISOString(),lessonURL,expected:{slides:88,practice:96,quiz:18,exam:6},desktopSlides:[],mobileSlides:[],routes:[],errors:[],warnings:[],screenshots:[]};
const shots=new Set(['Functions, Domain, Range, and Representations','Launch investigation · solar canopy data audit','Three mapping patterns','The vertical-line test','Read an image and preimages from a graph','Function notation, images, and preimages','Project a graph onto the axes','A complete feature reading','TI‑84 graphing evidence','TI‑84 Zero workflow','TI‑84 Intersect workflow','TABLE and TBLSET for discrete evidence','Graphs reflect in y=x','Worked IB-style synthesis · cooling model']);
const mobile=new Set(['Functions, Domain, Range, and Representations','Launch investigation · solar canopy data audit','Three mapping patterns','The vertical-line test','Function notation, images, and preimages','Read an image and preimages from a graph','Number lines make endpoint ownership visible','A complete feature reading','TI‑84 Zero workflow','TI‑84 Intersect workflow','Graphs reflect in y=x','Mastery and next step']);
const slug=v=>String(v).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80);
const consoleOkay=t=>!/favicon|ERR_BLOCKED_BY_CLIENT|Failed to load resource.*404/i.test(t);

async function open(viewport,label,hash='#learn'){
 const context=await browser.newContext({viewport,deviceScaleFactor:1,reducedMotion:'reduce',serviceWorkers:'block'});
 const page=await context.newPage();
 await page.route('https://ti84calc.com/**',route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>TI-84 simulator QA shell</title><p>TI-84 Plus CE</p>'}));
 const consoleErrors=[],pageErrors=[],failed=[];
 page.on('console',m=>{if(m.type()==='error'&&consoleOkay(m.text()))consoleErrors.push(m.text())});
 page.on('pageerror',e=>pageErrors.push(e.message));
 page.on('requestfailed',r=>failed.push(`${r.method()} ${r.url()} :: ${r.failure()?.errorText||'failed'}`));
 const response=await page.goto(`${lessonURL}${hash}`,{waitUntil:'domcontentloaded',timeout:45000});
 if(!response||response.status()>=400)report.errors.push(`${label}: HTTP ${response?.status()??'none'}`);
 await page.waitForFunction(()=>document.body.dataset.rendered==='1'&&window.LESSON_DATA?.version==='5.0.0',null,{timeout:30000});
 await page.waitForTimeout(400);
 return{context,page,consoleErrors,pageErrors,failed};
}
function append(label,s){report.errors.push(...s.consoleErrors.map(x=>`${label} console: ${x}`),...s.pageErrors.map(x=>`${label} pageerror: ${x}`));report.warnings.push(...s.failed.map(x=>`${label} request: ${x}`));}
async function state(page){return page.evaluate(()=>{
 const app=document.getElementById('app'),stage=document.querySelector('.stage'),title=document.querySelector('.slide-title')||document.querySelector('.v5-cover h1'),r=title?.getBoundingClientRect(),progress=document.getElementById('progress-label')?.textContent?.trim()||'',i=Math.max(0,Number(progress.match(/^\d+/)?.[0]||1)-1),slide=window.LESSON_DATA?.slides?.[i],text=(app?.innerText||'').replace(/\s+/g,' ').trim();
 return{title:slide?.title||'',progress,textLength:text.length,rawMath:(text.match(/\\\(|\\\[|\\\)|\\\]/g)||[]).length,mathErrors:document.querySelectorAll('[data-math-error="true"],.katex-error,.katex .merror').length,bodyOverflow:Math.max(0,document.documentElement.scrollWidth-innerWidth,document.body.scrollWidth-innerWidth),stageOverflowX:stage?Math.max(0,stage.scrollWidth-stage.clientWidth):0,stageOverflowY:stage?Math.max(0,stage.scrollHeight-stage.clientHeight):0,titleClipped:Boolean(r&&(r.left<-2||r.right>innerWidth+2||r.top<-2)),mathGraph:document.querySelector('[data-v5-math-graph]')?.getAttribute('data-v5-math-graph')||'',fakeCalculatorScreens:document.querySelectorAll('.v5-ti-screen.graph').length};
});}
function record(x,index,device){
 (device==='desktop'?report.desktopSlides:report.mobileSlides).push({slide:index+1,...x});
 const l=`${device} slide ${index+1} (${x.title})`;
 if(x.textLength<28)report.errors.push(`${l}: blank`);
 if(x.rawMath)report.errors.push(`${l}: ${x.rawMath} raw delimiters`);
 if(x.mathErrors)report.errors.push(`${l}: ${x.mathErrors} KaTeX errors`);
 if(x.bodyOverflow>3)report.errors.push(`${l}: body overflow ${x.bodyOverflow}`);
 if(x.stageOverflowX>3)report.errors.push(`${l}: stage overflow ${x.stageOverflowX}`);
 if(x.titleClipped)report.errors.push(`${l}: title clipped`);
 if(device==='desktop'&&x.stageOverflowY>720)report.warnings.push(`${l}: vertical scroll ${x.stageOverflowY}`);
}
async function exercise(page,item){
 if(item.title==='Launch investigation · solar canopy data audit'){
  await page.locator('[data-audit="split"]').click();
  if(!/Strong first step/.test(await page.locator('.v5-audit-widget p').innerText()))report.errors.push('Audit interaction failed');
 }
 if(item.title==='The vertical-line test'){
  const exact=await page.locator('[data-v5-math-graph="vertical-line"]').innerText();
  if(!exact.includes('(1,3)')||!exact.includes('(1,±√3)'))report.errors.push('Vertical-line exact graph labels failed');
  await page.locator('[data-v5-vlt-lab] input').fill('0');
  if(!/intersections = 2/.test(await page.locator('[data-v5-vlt-lab] p').innerText()))report.errors.push('Vertical-line lab failed');
 }
 if(item.title==='Read an image and preimages from a graph'){
  const text=await page.locator('[data-v5-math-graph="image-preimage"]').innerText();
  if(!/f\(2\)=5/.test(text)||!text.includes('x=0')||!text.includes('x=2'))report.errors.push('Image/preimage exact graph failed');
 }
 if(item.title==='Function notation, images, and preimages'){
  const contrast=await page.locator('.v5-block-open h2').evaluate(node=>getComputedStyle(node).color);
  const rgb=(contrast.match(/\d+/g)||[]).slice(0,3).map(Number);
  if(rgb.length!==3||Math.min(...rgb)<220)report.errors.push(`block contrast failed: ${contrast}`);
 }
 if(item.title==='TI‑84 Zero workflow'){
  if(item.mathGraph!=='ti84-zero'||item.fakeCalculatorScreens)report.errors.push('TI-84 Zero precision graph failed');
  const text=await page.locator('[data-v5-math-graph="ti84-zero"]').innerText();if(!text.includes('2.115'))report.errors.push('TI-84 Zero value missing');
 }
 if(item.title==='TI‑84 Intersect workflow'){
  if(item.mathGraph!=='ti84-intersect'||item.fakeCalculatorScreens)report.errors.push('TI-84 Intersect precision graph failed');
  const text=await page.locator('[data-v5-math-graph="ti84-intersect"]').innerText();if(!text.includes('0.764,5.236'))report.errors.push('TI-84 Intersect values missing');
 }
 if(item.title==='Graphs reflect in y=x'){
  if(item.mathGraph!=='inverse-reflection')report.errors.push('Inverse reflection exact graph failed');
  const text=await page.locator('[data-v5-math-graph="inverse-reflection"]').innerText();if(!text.includes('(2,4)')||!text.includes('(4,2)'))report.errors.push('Inverse reflection coordinate check failed');
  await page.locator('[data-v5-inverse-lab] input').fill('3');
  const t=await page.locator('[data-v5-inverse-lab] p').innerText();if(!/\(3, 7\)/.test(t)||!/\(7, 3\)/.test(t))report.errors.push('Inverse reflection lab failed');
 }
}

async function desktop(){
 const s=await open({width:1440,height:1000},'desktop');const{page,context}=s;
 const counts=await page.evaluate(()=>({slides:LESSON_DATA.slides.length,practice:LESSON_DATA.practice.length,quiz:LESSON_DATA.quiz.length,exam:LESSON_DATA.exam.length,levels:LESSON_DATA.practice.reduce((o,q)=>(o[q.level]=(o[q.level]||0)+1,o),{}),repair:LESSON_DATA.precisionRepair}));
 if(counts.slides!==report.expected.slides||counts.practice!==report.expected.practice||counts.quiz!==report.expected.quiz||counts.exam!==report.expected.exam)report.errors.push(`Counts ${JSON.stringify(counts)}`);
 if(counts.levels.Challenge!==24)report.errors.push(`Challenge count ${counts.levels.Challenge}`);
 if(counts.repair?.release!=='5.1.0'||counts.repair?.sharedTi84Simulator!==true)report.errors.push(`Precision repair metadata ${JSON.stringify(counts.repair)}`);
 for(let i=0;i<88;i++){
  await page.waitForFunction(n=>document.getElementById('progress-label')?.textContent?.trim().startsWith(`${n} /`),i+1);
  await page.waitForTimeout(35);const x=await state(page);record(x,i,'desktop');await exercise(page,x);
  if(shots.has(x.title)){const f=path.join(outputDir,`desktop-${String(i+1).padStart(3,'0')}-${slug(x.title)}.png`);await page.screenshot({path:f,fullPage:false});report.screenshots.push(f)}
  if(i<87)await page.locator('#next-slide').click();
 }
 const launcher=page.locator('.u1-ti84-sim-launch');
 if(await launcher.count()!==1)report.errors.push('Shared TI-84 simulator failed: launcher count');
 else{
  await launcher.click();await page.locator('#u1-ti84-simulator').waitFor({state:'visible',timeout:5000});
  const sim=await page.evaluate(()=>({src:document.querySelector('#u1-ti84-simulator iframe')?.dataset.src||'',meta:LESSON_DATA.ti84Simulator||null,oldDock:Boolean(document.querySelector('#v5-ti84-dock')),label:document.querySelector('.u1-ti84-sim-launch b')?.textContent||''}));
  if(sim.src!=='https://ti84calc.com/ti84calc'||sim.meta?.model!=='TI-84 Plus CE'||sim.meta?.provider!=='ti84calc.com'||!sim.meta?.lessons?.includes('2.1')||sim.oldDock||sim.label!=='TI‑84 Simulator')report.errors.push(`Shared TI-84 simulator failed: ${JSON.stringify(sim)}`);
  const f=path.join(outputDir,'desktop-shared-ti84-simulator.png');await page.screenshot({path:f,fullPage:false});report.screenshots.push(f);await page.locator('.u1-ti84-sim-close').click();
 }
 append('desktop',s);await context.close();
}
async function go(page,index){await page.evaluate(({k,i})=>{localStorage.setItem(k,String(i));location.hash='#learn';location.reload()},{k:storageKey,i:index});await page.waitForFunction(n=>document.body.dataset.rendered==='1'&&document.getElementById('progress-label')?.textContent?.trim().startsWith(`${n} /`),index+1,{timeout:30000});await page.waitForTimeout(250);}
async function mobileAudit(){
 const s=await open({width:390,height:844},'mobile');const{page,context}=s;
 const selected=await page.evaluate(t=>LESSON_DATA.slides.map((s,i)=>({title:s.title,index:i})).filter(x=>t.includes(x.title)),[...mobile]);
 if(selected.length!==mobile.size)report.errors.push(`Mobile selection ${selected.length}/${mobile.size}`);
 for(const item of selected){await go(page,item.index);const x=await state(page);record(x,item.index,'mobile');await exercise(page,x);const f=path.join(outputDir,`mobile-${String(item.index+1).padStart(3,'0')}-${slug(item.title)}.png`);await page.screenshot({path:f,fullPage:false});report.screenshots.push(f)}
 append('mobile',s);await context.close();
}
async function route(hash,ready,count,name,viewport={width:1440,height:1000}){
 const s=await open(viewport,name,hash);const{page,context}=s;await page.locator(ready).first().waitFor({state:'attached',timeout:20000});await page.waitForTimeout(350);
 const x=await page.evaluate(()=>({practice:LESSON_DATA.practice.length,quiz:LESSON_DATA.quiz.length,exam:LESSON_DATA.exam.length,raw:((document.getElementById('app')?.innerText||'').match(/\\\(|\\\[|\\\)|\\\]/g)||[]).length,math:document.querySelectorAll('[data-math-error="true"],.katex-error,.katex .merror').length,overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth,document.body.scrollWidth-innerWidth),filters:[...document.querySelectorAll('[data-filter]')].map(n=>n.textContent.trim()),cards:document.querySelectorAll('.exam-task').length}));
 report.routes.push({hash,...x});const actual=hash==='#practice'?x.practice:hash==='#quiz'?x.quiz:x.exam;if(actual!==count)report.errors.push(`${name}: ${actual}/${count}`);if(x.raw||x.math)report.errors.push(`${name}: raw ${x.raw} math ${x.math}`);if(x.overflow>3)report.errors.push(`${name}: overflow ${x.overflow}`);
 if(hash==='#practice'){
  for(const l of ['All · 96','Foundation · 24','Application · 24','Reasoning · 24','Challenge · 24'])if(!x.filters.includes(l))report.errors.push(`${name}: missing ${l}`);
  await page.locator('[data-filter="Challenge"]').click();await page.waitForTimeout(180);
  const challenge=await page.evaluate(()=>({prompt:document.querySelector('.question-prompt')?.textContent?.replace(/\s+/g,' ').trim()||'',tag:document.querySelector('.question-head')?.textContent?.replace(/\s+/g,' ').trim()||''}));
  if(challenge.prompt.length<35||/^C\d+$/i.test(challenge.prompt)||!challenge.tag.includes('Challenge'))report.errors.push(`Challenge prompt failed: ${JSON.stringify(challenge)}`);
  const cf=path.join(outputDir,'desktop-practice-challenge.png');await page.screenshot({path:cf,fullPage:false});report.screenshots.push(cf);
 }
 if(hash==='#exam'&&x.cards!==6)report.errors.push(`${name}: task cards ${x.cards}`);
 const f=path.join(outputDir,`${name}.png`);await page.screenshot({path:f,fullPage:false});report.screenshots.push(f);append(name,s);await context.close();
}

try{
 await desktop();
 await mobileAudit();
 await route('#practice','.question-shell',96,'desktop-practice');
 await route('#quiz','.question-shell',18,'desktop-quiz');
 await route('#exam','.exam-task',6,'desktop-exam');
 await route('#exam','.exam-task',6,'mobile-exam',{width:390,height:844});
}finally{await browser.close()}
report.errors=[...new Set(report.errors)];report.warnings=[...new Set(report.warnings)];
await writeFile(path.join(outputDir,'report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({slidesDesktop:report.desktopSlides.length,slidesMobile:report.mobileSlides.length,routes:report.routes.length,screenshots:report.screenshots.length,warnings:report.warnings.length,errors:report.errors.length},null,2));
if(report.errors.length){for(const e of report.errors)console.error(`ERROR: ${e}`);process.exitCode=1;}
