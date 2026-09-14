import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const {chromium}=createRequire(import.meta.url)(process.env.ECHS_PLAYWRIGHT_MODULE||'playwright-core');

const baseURL=process.env.ECHS_PREVIEW_URL||'http://127.0.0.1:4173';
const outputDir=process.env.ECHS_PREVIEW_OUTPUT||'artifacts/ib-ai-1-6-v6';
const lessonURL=`${baseURL}/lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.6_technology_equations_ECHS.html#learn`;
const storageKey='echs:ib-ai:u1:1.6:learn-index';
await mkdir(outputDir,{recursive:true});
let browser;
const contexts=new Set();
const expected={slides:81,practice:106,quiz:14,exam:8,baseSlides:73,basePractice:96,baseExam:5,gdcSlides:8,gdcPractice:10,gdcExam:3};
const report={lessonURL,generatedAt:new Date().toISOString(),checks:[],errors:[],slides:[],screenshots:[],composition:[],cleanup:{contexts:false,browser:false}};
const add=(name,pass,details='')=>{report.checks.push({name,pass,details});if(!pass)report.errors.push(`${name}: ${details}`);};

function bounded(promise,ms,label){let timer;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(label)),ms);})]).finally(()=>clearTimeout(timer));}
async function closeContext(context){await bounded(context.close(),10000,'context-close-timeout');contexts.delete(context);}

async function contextPage(viewport){
  const context=await browser.newContext({viewport,deviceScaleFactor:1,reducedMotion:'reduce',serviceWorkers:'block'});
  contexts.add(context);
  await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(baseURL).origin?route.continue():route.abort());
  const page=await context.newPage();
  const consoleErrors=[];
  page.on('console',message=>{if(message.type()==='error'&&!/favicon|404/i.test(message.text()))consoleErrors.push(message.text());});
  page.on('pageerror',error=>consoleErrors.push(error.message));
  await page.goto(lessonURL,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>document.body.dataset.rendered==='1'&&window.LESSON_DATA?.__gdcV7Applied===true,null,{timeout:30000});
  const composition=await page.evaluate(()=>{const d=window.LESSON_DATA,prefix='U1-GDC-V7-1.6-';const count=(rows,kind)=>rows.filter(row=>String(row.id||'').startsWith(prefix+kind)).length;return{slides:d.slides.length,practice:d.practice.length,quiz:d.quiz.length,exam:d.exam.length,baseSlides:d.slides.length-count(d.slides,'S'),basePractice:d.practice.length-count(d.practice,'P'),baseExam:d.exam.length-count(d.exam,'T'),gdcSlides:count(d.slides,'S'),gdcPractice:count(d.practice,'P'),gdcExam:count(d.exam,'T')};});
  report.composition.push(composition);
  if(!Object.keys(expected).every(key=>composition[key]===expected[key]))throw new Error('Unexpected composed lesson counts: '+JSON.stringify(composition));
  return{context,page,consoleErrors};
}

async function gotoTitle(page,title){
  const index=await page.evaluate(wanted=>window.LESSON_DATA.slides.findIndex(slide=>slide.title===wanted),title);
  if(index<0)throw new Error(`Missing slide: ${title}`);
  await page.evaluate(({key,index})=>{
    localStorage.setItem(key,String(index));
    if(location.hash!=='#learn')location.hash='#learn';
  },{key:storageKey,index});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(expected=>document.body.dataset.rendered==='1'&&document.getElementById('progress-label')?.textContent?.trim().startsWith(`${expected} /`),index+1,{timeout:30000});
  await page.waitForTimeout(180);
  await page.evaluate(()=>{const stage=document.querySelector('.stage');if(stage)stage.scrollTop=0;});
  return index;
}

async function state(page){
  return page.evaluate(()=>{
    const box=selector=>{const r=document.querySelector(selector)?.getBoundingClientRect();return r?{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}:null;};
    const stage=document.querySelector('.stage');
    const app=document.getElementById('app');
    const text=app?.innerText||'';
    return{
      bodyOverflow:Math.max(0,document.documentElement.scrollWidth-innerWidth,document.body.scrollWidth-innerWidth),
      stageOverflow:stage?Math.max(0,stage.scrollWidth-stage.clientWidth):0,
      verticalScroll:stage?Math.max(0,stage.scrollHeight-stage.clientHeight):0,
      rawMath:(text.match(/\\\(|\\\[|\\\)|\\\]/g)||[]).length,
      mathErrors:document.querySelectorAll('[data-math-error="true"],.katex-error,.katex .merror').length,
      title:document.querySelector('.slide-title')?.textContent?.trim()||window.LESSON_DATA?.slides?.[Number((document.getElementById('progress-label')?.textContent||'1').split('/')[0])-1]?.title||'',
      progress:document.getElementById('progress-label')?.textContent?.trim()||'',
      topbar:box('.topbar'),routebar:box('.routebar'),app:box('.app-shell')
    };
  });
}

try{
  browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--font-render-hinting=none']});
  report.browser=browser.version();
  const desktop=await contextPage({width:1754,height:877});
  await desktop.page.evaluate(key=>localStorage.setItem(key,'0'),storageKey);
  await desktop.page.reload({waitUntil:'domcontentloaded'});
  await desktop.page.waitForFunction(()=>document.body.dataset.rendered==='1'&&document.getElementById('progress-label')?.textContent?.trim().startsWith('1 /'),null,{timeout:30000});
  for(let index=0;index<expected.slides;index++){
    await desktop.page.waitForTimeout(35);
    const current=await state(desktop.page);
    report.slides.push({index:index+1,...current});
    if(current.bodyOverflow>2||current.stageOverflow>2||current.rawMath||current.mathErrors)report.errors.push(`Slide ${index+1} ${current.title}: ${JSON.stringify(current)}`);
    if(index<expected.slides-1){
      await desktop.page.click('#next-slide');
      await desktop.page.waitForFunction(expected=>document.getElementById('progress-label')?.textContent?.trim().startsWith(`${expected} /`),index+2,{timeout:10000});
    }
  }
  add('all 81 composed Learn screens render (73 base + 8 GDC)',report.slides.length===expected.slides,`${report.slides.length}`);
  add('all Learn screens avoid horizontal overflow',report.slides.every(item=>item.bodyOverflow<=2&&item.stageOverflow<=2),'checked desktop 1754×877');
  add('all Learn-screen mathematics renders',report.slides.every(item=>item.rawMath===0&&item.mathErrors===0),'no raw delimiters or KaTeX errors');

  const captures=[
    ['1.6 · Technology for Equations and Systems','cover'],
    ['Interactive system classifier','system-classifier'],
    ['Coefficient order is part of the mathematics','coefficient-order'],
    ['Residual laboratory · measure how well a candidate fits','residual-lab'],
    ['Interactive polynomial-root explorer','polynomial-lab'],
    ['Guard digits and rounding order','guard-digits']
  ];
  for(const [title,name] of captures){await gotoTitle(desktop.page,title);const file=path.join(outputDir,`desktop-${name}.png`);await desktop.page.screenshot({path:file,fullPage:false});report.screenshots.push(file);}

  await gotoTitle(desktop.page,'Interactive system classifier');
  await desktop.page.waitForSelector('#te-system-lab[data-mounted="1"] .te-lab-result');
  const systemBefore=await desktop.page.locator('#te-system-lab .te-lab-result').innerText();
  await desktop.page.click('#te-system-lab [data-preset="none"]');
  const systemAfter=await desktop.page.locator('#te-system-lab .te-lab-result').innerText();
  add('system classifier initializes and changes classification',/Unique solution/.test(systemBefore)&&/Inconsistent system/.test(systemAfter),`${systemBefore} -> ${systemAfter}`);

  await gotoTitle(desktop.page,'Residual laboratory · measure how well a candidate fits');
  await desktop.page.waitForSelector('#te-residual-lab[data-mounted="1"] .te-residual-output');
  await desktop.page.click('#te-residual-lab [data-rpreset="wrong"]');
  const residualClass=await desktop.page.locator('#te-residual-lab .te-residual-output').getAttribute('class');
  add('residual laboratory diagnoses an incorrect candidate',residualClass?.includes('wrong')||false,residualClass||'');

  await gotoTitle(desktop.page,'Interactive polynomial-root explorer');
  await desktop.page.waitForSelector('#te-polynomial-lab[data-mounted="1"] .te-poly-note');
  await desktop.page.click('#te-polynomial-lab [data-ppreset="double"]');
  const polyText=await desktop.page.locator('#te-polynomial-lab .te-poly-note').innerText();
  add('polynomial explorer reports multiplicity',/multiplicity 2/.test(polyText),polyText);

  await desktop.page.evaluate(()=>{
    document.documentElement.dataset.lessonAccessLayout='bar';
    document.documentElement.style.setProperty('--echs-access-bar-height','64px');
    document.body.classList.add('hasEchsLessonAccessBar');
    const bar=document.createElement('div');bar.id='qa-access-bar';Object.assign(bar.style,{position:'fixed',inset:'0 0 auto 0',height:'64px',zIndex:'9999',background:'#102a43'});document.body.prepend(bar);
  });
  await desktop.page.waitForTimeout(100);
  const geometry=await state(desktop.page);
  add('authenticated topbar begins below Learning Pathway bar',geometry.topbar?.top>=63,JSON.stringify(geometry));
  add('routebar begins below topbar',geometry.routebar&&geometry.topbar&&geometry.routebar.top>=geometry.topbar.bottom-1,JSON.stringify(geometry));
  add('lesson viewport begins below routebar',geometry.app&&geometry.routebar&&geometry.app.top>=geometry.routebar.bottom-1,JSON.stringify(geometry));
  add('desktop page has no console errors',desktop.consoleErrors.length===0,desktop.consoleErrors.join('\n'));
  await closeContext(desktop.context);

  const mobile=await contextPage({width:390,height:844});
  for(const title of ['Interactive system classifier','Interactive polynomial-root explorer']){
    await gotoTitle(mobile.page,title);const current=await state(mobile.page);add(`mobile ${title} avoids horizontal overflow`,current.bodyOverflow<=2&&current.stageOverflow<=2,JSON.stringify(current));
  }
  const mobileShot=path.join(outputDir,'mobile-polynomial-lab.png');await mobile.page.screenshot({path:mobileShot,fullPage:false});report.screenshots.push(mobileShot);
  add('mobile page has no console errors',mobile.consoleErrors.length===0,mobile.consoleErrors.join('\n'));
  await closeContext(mobile.context);

  const routes=await contextPage({width:1440,height:900});
  await routes.page.click('[data-route="practice"]');await routes.page.waitForSelector('.question-shell');
  let routeState=await state(routes.page);add('Practice Studio exposes 106 questions (96 base + 10 GDC)',/106 original questions/.test(await routes.page.locator('.route-header p').innerText()),await routes.page.locator('.route-header p').innerText());add('Practice route avoids horizontal overflow',routeState.bodyOverflow<=2&&routeState.stageOverflow<=2,JSON.stringify(routeState));
  await routes.page.click('[data-route="quiz"]');await routes.page.waitForSelector('.question-shell');add('Timed Quiz exposes 14 independent questions',/14-question checkpoint/.test(await routes.page.locator('.route-header h1').innerText()),await routes.page.locator('.route-header h1').innerText());
  await routes.page.click('[data-route="exam"]');await routes.page.waitForSelector('.exam-task');add('IB Tasks route exposes eight tasks (5 base + 3 GDC)',(await routes.page.locator('.exam-task').count())===expected.exam,`task cards ${await routes.page.locator('.exam-task').count()}`);
  add('assessment routes have no console errors',routes.consoleErrors.length===0,routes.consoleErrors.join('\n'));
  await closeContext(routes.context);
}catch(error){
  report.errors.push('Browser QA failed: '+String(error.stack||error));
}finally{
  for(const context of [...contexts]){try{await closeContext(context);}catch(error){report.errors.push('Context cleanup failed: '+String(error.message||error));}}
  report.cleanup.contexts=contexts.size===0;
  try{if(browser)await bounded(browser.close(),10000,'browser-close-timeout');report.cleanup.browser=true;}catch(error){report.errors.push('Browser cleanup failed: '+String(error.message||error));}
  report.status=report.errors.length?'FAIL':'PASS';
  await writeFile(path.join(outputDir,'report.json'),JSON.stringify(report,null,2));
}
console.log(JSON.stringify({checks:report.checks.length,errors:report.errors.length,slides:report.slides.length,screenshots:report.screenshots.length},null,2));
if(report.errors.length){for(const error of report.errors)console.error(`ERROR: ${error}`);process.exitCode=1;}
