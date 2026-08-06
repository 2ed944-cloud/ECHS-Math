import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const base=process.env.ECHS_PREVIEW_URL||'http://127.0.0.1:4173';
const out=process.env.ECHS_PREVIEW_OUTPUT||'artifacts/ib-ai-1-4-ti84-finance-v6-3';
const financialURL=`${base}/lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.4_financial_models_ECHS.html?scope=all#learn`;
const technologyURL=`${base}/lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.6_technology_equations_ECHS.html#learn`;
const financialKey='echs:ib-ai:u1:1.4:learn-index';
const technologyKey='echs:ib-ai:u1:1.6:learn-index';
await mkdir(out,{recursive:true});

const browser=await chromium.launch({
  executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',
  headless:true,
  args:['--no-sandbox','--disable-dev-shm-usage','--font-render-hinting=none']
});
const report={checks:[],errors:[],screenshots:[]};
const check=(name,pass,details='')=>{report.checks.push({name,pass,details});if(!pass)report.errors.push(`${name}: ${details}`);};

async function makeContext(viewport={width:1920,height:1080}){
  const context=await browser.newContext({viewport,deviceScaleFactor:1,reducedMotion:'reduce',serviceWorkers:'block'});
  await context.route('https://ti84calc.com/ti84calc',route=>route.fulfill({
    status:200,
    contentType:'text/html',
    body:'<!doctype html><html><body style="margin:0;display:grid;place-items:center;height:100vh;background:#f4f4f4;font-family:sans-serif"><div data-qa-ti84 style="width:520px;height:760px;border-radius:28px;background:#111;color:white;display:grid;place-items:center;font-size:34px">TI-84 FINANCE QA</div></body></html>'
  }));
  return context;
}
async function openTitle(page,url,key,title,count){
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(expected=>document.body.dataset.rendered==='1'&&window.LESSON_DATA?.slides?.length===expected,count,{timeout:30000});
  const index=await page.evaluate(wanted=>window.LESSON_DATA.slides.findIndex(slide=>slide.title===wanted),title);
  if(index<0)throw new Error(`Slide not found: ${title}`);
  await page.evaluate(({key,index})=>localStorage.setItem(key,String(index)),{key,index});
  await page.reload({waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(expected=>document.body.dataset.rendered==='1'&&document.getElementById('progress-label')?.textContent?.trim().startsWith(`${expected} /`),index+1,{timeout:30000});
  await page.waitForTimeout(350);
  return index;
}
async function common(page){
  return page.evaluate(()=>({
    bodyOverflow:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth,
    stageOverflow:(document.querySelector('.stage')?.scrollWidth||0)-(document.querySelector('.stage')?.clientWidth||0),
    rawMath:((document.querySelector('#app')?.innerText||'').match(/\\\(|\\\[|\\\)|\\\]/g)||[]).length,
    mathErrors:document.querySelectorAll('[data-math-error="true"],.katex-error,.katex .merror').length
  }));
}

try{
  const context=await makeContext();
  const page=await context.newPage();
  const consoleErrors=[];
  page.on('pageerror',error=>consoleErrors.push(error.message));
  page.on('console',message=>{if(message.type()==='error'&&!/favicon|404/i.test(message.text()))consoleErrors.push(message.text());});

  await openTitle(page,financialURL,financialKey,'Worked example · level monthly loan payment',100);
  await page.waitForSelector('.fin84-inline-launch');
  await page.waitForSelector('.fin84-classroom-launch');
  await page.waitForSelector('.fin84-paired-strip');
  const controls=await page.evaluate(()=>({
    inline:document.querySelector('.fin84-inline-launch')?.textContent.replace(/\s+/g,' ').trim(),
    classroom:document.querySelector('.fin84-classroom-launch')?.textContent.replace(/\s+/g,' ').trim(),
    strip:document.querySelector('.fin84-paired-strip')?.textContent.replace(/\s+/g,' ').trim()
  }));
  check('Financial lesson has TI-84 Simulator and Finance Classroom controls',/TI‑84 Simulator/.test(controls.inline)&&/TI‑84 Finance Classroom/.test(controls.classroom),JSON.stringify(controls));
  check('Loan slide receives the paired F6 classroom launcher',/F6 classroom demo/.test(controls.strip),controls.strip);

  await page.click('.fin84-inline-launch');
  await page.waitForSelector('.fin84-inline-dock.open');
  await page.frameLocator('.fin84-inline-dock iframe').locator('[data-qa-ti84]').waitFor({timeout:15000});
  const dock=await page.evaluate(()=>{
    const app=document.querySelector('.app-shell').getBoundingClientRect();
    const panel=document.querySelector('.fin84-inline-dock').getBoundingClientRect();
    const close=document.querySelector('#fin84-inline-close').getBoundingClientRect();
    const title=document.querySelector('.slide-title')?.getBoundingClientRect();
    return{
      appRight:app.right,panelLeft:panel.left,panelRight:panel.right,panelWidth:panel.width,
      closeLeft:close.left,closeRight:close.right,
      titleVisible:!!title&&title.width>280&&title.top>=app.top,
      iframeSrc:document.querySelector('.fin84-inline-dock iframe')?.src,
      sandbox:document.querySelector('.fin84-inline-dock iframe')?.getAttribute('sandbox')
    };
  });
  check('TI-84 simulator is docked beside the live Financial Applications slide',Math.abs(dock.appRight-dock.panelLeft)<14&&dock.titleVisible,JSON.stringify(dock));
  check('Inline simulator close control is fully visible',dock.closeLeft>=dock.panelLeft&&dock.closeRight<=dock.panelRight,JSON.stringify(dock));
  check('Inline simulator is sandboxed and uses ti84calc',dock.iframeSrc.includes('ti84calc.com/ti84calc')&&dock.sandbox.includes('allow-scripts'),JSON.stringify(dock));
  let state=await common(page);
  check('Financial slide plus inline simulator has no horizontal overflow',state.bodyOverflow<=2&&state.stageOverflow<=2,JSON.stringify(state));
  const inlineShot=path.join(out,'01-financial-slide-with-ti84-beside.png');
  await page.screenshot({path:inlineShot,fullPage:false});report.screenshots.push(inlineShot);
  await page.click('#fin84-inline-close');

  await page.click('.fin84-paired-strip button');
  await page.waitForSelector('.fin84-classroom.open');
  const classroom=await page.evaluate(()=>({
    selected:document.querySelector('#fin84-workflow-select')?.value,
    modes:[...document.querySelectorAll('[data-fin84-mode]')].map(node=>node.textContent.trim()),
    heading:document.querySelector('#fin84-title')?.textContent,
    output:document.querySelector('#fin84-evidence-content')?.innerText.replace(/\s+/g,' ').trim()
  }));
  check('Contextual launcher opens the correct loan workflow',classroom.selected==='loan-payment',JSON.stringify(classroom));
  check('Finance classroom exposes Teacher, Follow and Drill modes',classroom.modes.join('|')==='Teacher demo|Students follow|Exam drill',JSON.stringify(classroom.modes));
  check('Finance classroom presents the verified loan output',classroom.output.includes('1938.163150'),classroom.output);
  const routeText=await page.locator('.fin84-key-sequence').innerText();
  check('Loan workflow begins with APPS Finance TVM Solver',routeText.includes('APPS')&&routeText.includes('Finance')&&routeText.includes('1:TVM Solver'),routeText);
  while(await page.locator('#fin84-ti-next:not([disabled])').count())await page.click('#fin84-ti-next');
  const fullRoute=(await page.locator('.fin84-key-sequence').innerText()).replace(/\s+/g,' ');
  check('Loan workflow teaches ALPHA ENTER SOLVE',fullRoute.includes('ALPHA')&&fullRoute.includes('ENTER (SOLVE)'),fullRoute);
  await page.click('#fin84-load-simulator');
  await page.frameLocator('.fin84-simulator-stage iframe').locator('[data-qa-ti84]').waitFor({timeout:15000});
  const modalState=await page.evaluate(()=>{
    const dialog=document.querySelector('.fin84-dialog').getBoundingClientRect();
    return{width:dialog.width,height:dialog.height,overflow:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth};
  });
  check('Finance classroom fits the desktop viewport',modalState.width<=innerWidth&&modalState.height<=innerHeight&&modalState.overflow<=2,JSON.stringify(modalState));
  const classroomShot=path.join(out,'02-ti84-finance-classroom-loan.png');
  await page.screenshot({path:classroomShot,fullPage:false});report.screenshots.push(classroomShot);
  await page.click('.fin84-head [data-fin84-close]');

  await openTitle(page,financialURL,financialKey,'Worked example · nominal to effective',100);
  await page.waitForSelector('.fin84-paired-strip');
  const effectiveStrip=await page.locator('.fin84-paired-strip').innerText();
  check('Effective-rate slide maps to workflow F1',effectiveStrip.includes('F1 classroom demo'),effectiveStrip);
  await page.click('.fin84-paired-strip button');
  const select=page.locator('#fin84-workflow-select');
  check('Effective-rate workflow selected',await select.inputValue()==='effective-rate',await select.inputValue());
  const effectiveRoute=(await page.locator('.fin84-key-sequence').innerText()).replace(/\s+/g,' ');
  check('Effective-rate workflow uses Finance C:eff(',effectiveRoute.includes('C:eff('),effectiveRoute);
  await page.click('.fin84-head [data-fin84-close]');

  await openTitle(page,financialURL,financialKey,'Worked example · verify balance two ways',100);
  await page.click('.fin84-paired-strip button');
  const balanceSelected=await select.inputValue();
  check('Outstanding-balance slide maps to F7',balanceSelected==='outstanding-balance',balanceSelected);
  while(await page.locator('#fin84-ti-next:not([disabled])').count())await page.click('#fin84-ti-next');
  const balanceRoute=(await page.locator('.fin84-key-sequence').innerText()).replace(/\s+/g,' ');
  check('Balance workflow includes bal, ΣInt and ΣPrn',balanceRoute.includes('9:bal(')&&balanceRoute.includes('A:ΣInt(')&&balanceRoute.includes('0:ΣPrn('),balanceRoute);
  await page.click('.fin84-head [data-fin84-close]');

  await openTitle(page,technologyURL,technologyKey,'Multiplicity changes how a graph meets the axis',73);
  const multiplicity=await page.evaluate(()=>{
    const card=[...document.querySelectorAll('.te63-multiplicity-grid article')].find(node=>node.textContent.includes('Multiplicity 2'));
    const path=card?.querySelector('path.curve');
    const root=card?.querySelector('circle.root');
    const axis=card?.querySelector('line.axis');
    return{d:path?.getAttribute('d'),rootY:root?.getAttribute('cy'),axisY1:axis?.getAttribute('y1'),axisY2:axis?.getAttribute('y2')};
  });
  check('Multiplicity-2 curve vertex touches the marked x-axis root',multiplicity.d==='M48 40 Q181 160 314 40'&&multiplicity.rootY==='100'&&multiplicity.axisY1==='100'&&multiplicity.axisY2==='100',JSON.stringify(multiplicity));
  const multShot=path.join(out,'03-multiplicity-2-touches-axis.png');
  await page.screenshot({path:multShot,fullPage:false});report.screenshots.push(multShot);

  check('No browser console errors',consoleErrors.length===0,consoleErrors.join('\n'));
  await context.close();

  const mobileContext=await makeContext({width:390,height:844});
  const mobile=await mobileContext.newPage();
  await openTitle(mobile,financialURL,financialKey,'Worked example · monthly savings plan',100);
  await mobile.click('.fin84-inline-launch');
  await mobile.waitForSelector('.fin84-inline-dock.open');
  const mobileDock=await common(mobile);
  check('Mobile Financial TI-84 dock has no horizontal overflow',mobileDock.bodyOverflow<=2,JSON.stringify(mobileDock));
  const mobileShot=path.join(out,'04-mobile-financial-ti84-dock.png');
  await mobile.screenshot({path:mobileShot,fullPage:false});report.screenshots.push(mobileShot);
  await mobileContext.close();
}finally{
  await browser.close();
}

await writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({checks:report.checks.length,errors:report.errors.length,screenshots:report.screenshots.length},null,2));
if(report.errors.length){for(const error of report.errors)console.error(`ERROR: ${error}`);process.exit(1);}