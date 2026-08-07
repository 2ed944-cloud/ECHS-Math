import {chromium} from 'playwright-core';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';

const base=process.env.ECHS_PREVIEW_URL||'http://127.0.0.1:4173';
const out=process.env.ECHS_PREVIEW_OUTPUT||'artifacts/ib-ai-2-2-v5';
const lesson=`${base}/lessons/ib-math-ai/unit-2/lessons/IB_AI_SL_2.2_linear_quadratic_models_ECHS.html`;
const storageKey='echs:ib-ai:u2:2.2:learn-index';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--font-render-hinting=none']});
const report={checks:[],errors:[],screenshots:[]};
const check=(name,pass,details='')=>{report.checks.push({name,pass,details});if(!pass)report.errors.push(`${name}: ${details}`);};

async function open(viewport){
  const context=await browser.newContext({viewport,deviceScaleFactor:1,serviceWorkers:'block',reducedMotion:'reduce'});
  const page=await context.newPage();const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error'&&!/favicon|404/i.test(message.text()))errors.push(message.text());});
  await page.route('https://ti84calc.com/**',route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><html><body style="font-family:system-ui;background:#eef2f5"><main style="margin:20px auto;width:420px;background:#222b31;padding:25px;border-radius:24px;color:white"><h1>TI-84 Plus CE fixture</h1><div style="height:300px;background:#cfe0b7;color:#122217;padding:20px">Y= · GRAPH · CALC · TABLE</div></main></body></html>'}));
  await page.goto(lesson,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>document.body.dataset.rendered==='1'&&window.LESSON_DATA?.slides?.length===80,null,{timeout:30000});
  await page.waitForTimeout(220);
  return{context,page,errors};
}
async function state(page){return page.evaluate(()=>({
  bodyOverflow:Math.max(0,document.documentElement.scrollWidth-innerWidth,document.body.scrollWidth-innerWidth),
  stageOverflow:Math.max(0,(document.querySelector('.stage')?.scrollWidth||0)-(document.querySelector('.stage')?.clientWidth||0)),
  raw:((document.getElementById('app')?.innerText||'').match(/\\\(|\\\[|\\\)|\\\]/g)||[]).length,
  mathErrors:document.querySelectorAll('[data-math-error="true"],.katex-error,.katex .merror').length,
  placeholders:document.querySelectorAll('.lq5-visual-placeholder').length,
  progress:document.getElementById('progress-label')?.textContent?.trim()||''
}));}
async function gotoTitle(page,wanted){
  const index=await page.evaluate(target=>{const normalize=value=>String(value||'').replace(/[\\()[\]]/g,'').replace(/\s+/g,' ').trim().toLowerCase();return window.LESSON_DATA.slides.findIndex(slide=>normalize(slide.title).includes(normalize(target)));},wanted);
  if(index<0)throw new Error(`Slide not found: ${wanted}`);
  await page.evaluate(({key,index})=>localStorage.setItem(key,String(index)),{key:storageKey,index});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(expected=>document.body.dataset.rendered==='1'&&document.getElementById('progress-label')?.textContent?.startsWith(`${expected} /`),index+1,{timeout:30000});
  await page.waitForTimeout(140);return index;
}
try{
  const desktop=await open({width:1920,height:1080});const {page}=desktop;
  const counts=await page.evaluate(()=>({slides:LESSON_DATA.slides.length,practice:LESSON_DATA.practice.length,quiz:LESSON_DATA.quiz.length,exam:LESSON_DATA.exam.length,release:LESSON_DATA.version}));
  check('release and counts',JSON.stringify(counts)===JSON.stringify({slides:80,practice:80,quiz:16,exam:6,release:'5.0.0'}),JSON.stringify(counts));
  for(let index=0;index<80;index++){
    if(index){await page.click('#next-slide');await page.waitForFunction(expected=>document.getElementById('progress-label')?.textContent?.startsWith(`${expected} /`),index+1,{timeout:10000});await page.waitForTimeout(45);}
    const s=await state(page);check(`Learn screen ${index+1}`,s.bodyOverflow<=2&&s.stageOverflow<=2&&s.raw===0&&s.mathErrors===0&&s.placeholders===0,JSON.stringify(s));
  }
  for(const [title,file] of [['Gradient is a rate with units','01-gradient.png'],['Standard, factored and vertex forms','02-forms.png'],['Construct from roots and a point','03-arch.png'],['Quadratic formula','04-formula.png'],['Paper 2 synthesis: fountain model','05-fountain.png']]){
    await gotoTitle(page,title);const shot=path.join(out,file);await page.screenshot({path:shot});report.screenshots.push(shot);const s=await state(page);check(`${title} clean`,s.raw===0&&s.mathErrors===0&&s.bodyOverflow<=2&&s.placeholders===0,JSON.stringify(s));
  }
  await gotoTitle(page,'The roles of m and c');await page.locator('[data-linear-m]').evaluate(element=>{element.value='-3';element.dispatchEvent(new Event('input',{bubbles:true}));});await page.locator('[data-linear-c]').evaluate(element=>{element.value='5';element.dispatchEvent(new Event('input',{bubbles:true}));});check('linear laboratory updates',(await page.locator('[data-linear-equation]').innerText()).includes('-3'),await page.locator('[data-linear-equation]').innerText());
  await gotoTitle(page,'Move the vertex and curvature');await page.locator('[data-quadratic-a]').evaluate(element=>{element.value='-2';element.dispatchEvent(new Event('input',{bubbles:true}));});check('quadratic laboratory draws',await page.locator('[data-quadratic-svg] path').count()>0,'quadratic path count');
  await gotoTitle(page,'Compare difference structures');await page.click('[data-model-set="quadratic"]');check('difference laboratory explains quadratic',(await page.locator('[data-model-verdict]').innerText()).includes('second difference'),await page.locator('[data-model-verdict]').innerText());
  await gotoTitle(page,'Inspect a residual pattern');await page.click('[data-residual-set="curve"]');check('residual laboratory diagnoses curvature',(await page.locator('[data-residual-verdict]').innerText()).includes('curvature'),await page.locator('[data-residual-verdict]').innerText());

  await gotoTitle(page,'Find a zero');
  await page.click('[data-lq5-ti-workflow="zero"]');
  await page.waitForSelector('#lq5-ti-overlay.open');
  const workflowRoute=await page.evaluate(()=>window.ECHS_LQ5_TI84.workflows.zero.keys.join(' '));
  check('TI-84 Zero route is exact',workflowRoute.includes('2:zero')&&workflowRoute.includes('Left Bound')&&workflowRoute.includes('Right Bound')&&workflowRoute.includes('Guess'),workflowRoute);
  await page.click('[data-coach-mode="follow"]');
  check('Students Follow mode works',await page.locator('[data-coach-mode="follow"].active').count()===1,'mode');
  await page.click('[data-coach-close]');

  await page.click('#lq5-ti-simulator');
  await page.waitForSelector('#lq5-ti-dock.open iframe[src]',{state:'attached'});
  await page.waitForFunction(()=>document.querySelector('#lq5-ti-dock iframe')?.classList.contains('ready'),null,{timeout:6000});
  const geometry=await page.evaluate(()=>{const app=document.querySelector('.app-shell').getBoundingClientRect(),dock=document.querySelector('#lq5-ti-dock').getBoundingClientRect(),frame=document.querySelector('#lq5-ti-dock iframe');return{appRight:app.right,dockLeft:dock.left,dockRight:dock.right,width:innerWidth,src:frame.getAttribute('src'),ready:frame.classList.contains('ready')};});
  check('TI-84 simulator docks beside slide',Math.abs(geometry.appRight-geometry.dockLeft)<=2&&Math.abs(geometry.dockRight-geometry.width)<=2&&geometry.src==='https://ti84calc.com/ti84calc'&&geometry.ready,JSON.stringify(geometry));
  const dockShot=path.join(out,'06-ti84-beside-slide.png');await page.screenshot({path:dockShot});report.screenshots.push(dockShot);await page.click('[data-ti-close]');

  await page.click('[data-route="practice"]');await page.waitForSelector('.route-page');let route=await state(page);check('Practice route renders cleanly',route.raw===0&&route.mathErrors===0&&route.bodyOverflow<=2,JSON.stringify(route));check('Practice route contains 80 questions',(await page.locator('.route-page').innerText()).includes('80 original questions'),await page.locator('.route-page').innerText());
  await page.click('[data-route="quiz"]');await page.waitForSelector('.route-page');route=await state(page);check('Quiz route renders cleanly',route.raw===0&&route.mathErrors===0&&route.bodyOverflow<=2,JSON.stringify(route));
  await page.click('[data-route="exam"]');await page.waitForSelector('.route-page');route=await state(page);check('IB Tasks route renders cleanly',route.raw===0&&route.mathErrors===0&&route.bodyOverflow<=2,JSON.stringify(route));
  check('desktop console errors',desktop.errors.length===0,desktop.errors.join('\n'));await desktop.context.close();

  const short=await open({width:1600,height:850});await gotoTitle(short.page,'Standard, factored and vertex forms');const shortState=await state(short.page);check('short classroom viewport',shortState.bodyOverflow<=2&&shortState.raw===0&&shortState.mathErrors===0,JSON.stringify(shortState));const shortShot=path.join(out,'07-short-viewport-forms.png');await short.page.screenshot({path:shortShot});report.screenshots.push(shortShot);check('short viewport console errors',short.errors.length===0,short.errors.join('\n'));await short.context.close();

  const mobile=await open({width:390,height:844});
  await mobile.page.click('#lq5-ti-simulator');
  await mobile.page.waitForSelector('#lq5-ti-dock.open iframe[src]',{state:'attached'});
  await mobile.page.waitForFunction(()=>document.querySelector('#lq5-ti-dock iframe')?.classList.contains('ready'),null,{timeout:6000});
  const mobileGeometry=await mobile.page.evaluate(()=>{const dock=document.querySelector('#lq5-ti-dock').getBoundingClientRect();return{left:dock.left,right:dock.right,width:dock.width,viewport:innerWidth,overflow:document.documentElement.scrollWidth-innerWidth};});
  check('mobile TI-84 fills viewport',Math.abs(mobileGeometry.left)<=1&&Math.abs(mobileGeometry.right-mobileGeometry.viewport)<=1&&Math.abs(mobileGeometry.width-mobileGeometry.viewport)<=1&&mobileGeometry.overflow<=2,JSON.stringify(mobileGeometry));
  const mobileShot=path.join(out,'08-mobile-ti84.png');await mobile.page.screenshot({path:mobileShot});report.screenshots.push(mobileShot);check('mobile console errors',mobile.errors.length===0,mobile.errors.join('\n'));await mobile.context.close();
}finally{await browser.close();}
await writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({checks:report.checks.length,errors:report.errors.length,screenshots:report.screenshots.length},null,2));if(report.errors.length){report.errors.forEach(error=>console.error(`ERROR: ${error}`));process.exit(1);}
