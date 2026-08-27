import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseURL=process.env.ECHS_PREVIEW_URL||'http://127.0.0.1:4173';
const lessonPath=process.env.ECHS_LESSON_PATH;
const outputDir=process.env.ECHS_PREVIEW_OUTPUT||'artifacts/pathway-lesson-qa';
if(!lessonPath)throw new Error('ECHS_LESSON_PATH is required');
await mkdir(outputDir,{recursive:true});

const browser=await chromium.launch({
  executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',
  headless:true,
  args:['--no-sandbox','--disable-dev-shm-usage','--font-render-hinting=none']
});
const report={lessonPath,generatedAt:new Date().toISOString(),checks:[],errors:[],screenshots:[]};
const check=(name,pass,details='')=>{report.checks.push({name,pass,details});if(!pass)report.errors.push(`${name}: ${details}`);};

async function inspect(viewport,label,screen){
  const context=await browser.newContext({viewport,deviceScaleFactor:1,reducedMotion:'reduce',serviceWorkers:'block'});
  const page=await context.newPage();
  const consoleErrors=[];
  page.on('console',message=>{if(message.type()==='error'&&!/favicon|404/i.test(message.text()))consoleErrors.push(message.text());});
  page.on('pageerror',error=>consoleErrors.push(error.message));
  await page.goto(`${baseURL}/${lessonPath}#s${screen}`,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>document.documentElement.dataset.lessonReady==='true',null,{timeout:20000});
  await page.waitForTimeout(1000);
  const state=await page.evaluate(()=>{
    const visible=el=>{if(!el)return false;const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight;};
    const active=document.querySelector('.slide.active');
    return{
      expected:Number(document.querySelector('meta[name="echs-screen-count"]')?.content||0),
      slides:document.querySelectorAll('.slide').length,
      active:document.querySelectorAll('.slide.active').length,
      bodyOverflow:Math.max(0,document.documentElement.scrollWidth-innerWidth,document.body.scrollWidth-innerWidth),
      activeOverflow:active?Math.max(0,active.scrollWidth-active.clientWidth):999,
      mathErrors:document.querySelectorAll('.katex-error,.katex .merror').length,
      rawMath:[...document.querySelectorAll('.math')].filter(el=>!el.querySelector('.katex')).length,
      topbar:visible(document.querySelector('.topbar')),
      footer:visible(document.querySelector('.footerbar')),
      title:(active?.querySelector('h1,h2')?.textContent||'').trim(),
      ready:document.documentElement.dataset.lessonReady
    };
  });
  check(`${label} screen count`,state.expected>=50&&state.slides===state.expected&&state.active===1,JSON.stringify(state));
  check(`${label} horizontal fit`,state.bodyOverflow<=2&&state.activeOverflow<=2,JSON.stringify(state));
  check(`${label} chrome visible`,state.topbar&&state.footer,JSON.stringify(state));
  check(`${label} math rendered`,state.mathErrors===0&&state.rawMath===0,JSON.stringify(state));
  check(`${label} console clean`,consoleErrors.length===0,consoleErrors.join('\n'));
  const shot=path.join(outputDir,`${label}-screen-${screen}.png`);
  await page.screenshot({path:shot,fullPage:false});report.screenshots.push(shot);
  await context.close();
}

async function inspectInteraction(){
  const context=await browser.newContext({viewport:{width:1280,height:850},deviceScaleFactor:1,reducedMotion:'reduce'});
  const page=await context.newPage();
  await page.goto(`${baseURL}/${lessonPath}#s39`,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>document.documentElement.dataset.lessonReady==='true',null,{timeout:20000});
  const option=page.locator('.slide.active input[type="radio"]').first();
  check('practice control available',await option.isVisible(),'first practice radio');
  await option.check();
  await page.locator('.slide.active [data-check]').click();
  const feedback=(await page.locator('.slide.active .feedback').innerText()).trim();
  check('practice response is interactive',feedback.length>0,feedback);
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(150);
  check('keyboard navigation works',(await page.locator('#counter').innerText()).startsWith('40 /'),'counter after ArrowRight');
  await context.close();
}

try{
  await inspect({width:1440,height:900},'desktop-cover',1);
  await inspect({width:1440,height:900},'desktop-concept',12);
  await inspect({width:390,height:844},'mobile-practice',39);
  await inspect({width:390,height:844},'mobile-exit',62);
  await inspectInteraction();
}finally{
  await browser.close();
}
await writeFile(path.join(outputDir,'report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({checks:report.checks.length,errors:report.errors.length,screenshots:report.screenshots.length},null,2));
if(report.errors.length){for(const error of report.errors)console.error(`ERROR: ${error}`);process.exit(1);}
