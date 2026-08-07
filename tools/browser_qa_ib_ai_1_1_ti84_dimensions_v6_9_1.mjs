import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const base=process.env.ECHS_PREVIEW_URL||'http://127.0.0.1:4173';
const out=process.env.ECHS_PREVIEW_OUTPUT||'artifacts/ib-ai-1-1-ti84-v6-9-1';
const lessonURL=`${base}/lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.1_standard_form_ECHS.html?scope=core#learn`;
await mkdir(out,{recursive:true});

const browser=await chromium.launch({
  executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',
  headless:true,
  args:['--no-sandbox','--disable-dev-shm-usage','--font-render-hinting=none']
});
const report={checks:[],errors:[],screenshots:[]};
const check=(name,pass,details='')=>{report.checks.push({name,pass,details});if(!pass)report.errors.push(`${name}: ${details}`);};

async function contextFor(viewport){
  const context=await browser.newContext({viewport,deviceScaleFactor:1,reducedMotion:'reduce',serviceWorkers:'block'});
  await context.route('https://ti84calc.com/ti84calc',route=>route.fulfill({
    status:200,
    contentType:'text/html',
    body:`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;min-width:0;height:100vh;overflow:auto;background:#f4f4f4;display:flex;justify-content:center;align-items:flex-start;font-family:sans-serif"><div data-qa-ti84 style="box-sizing:border-box;width:min(430px,92vw);height:760px;margin:12px auto;border:12px solid #111;border-radius:28px;background:#202225;color:white;display:grid;place-items:center;font-size:28px">TI-84 PLUS CE QA</div></body></html>`
  }));
  return context;
}

async function waitLesson(page){
  await page.goto(lessonURL,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>document.body.dataset.rendered==='1'&&document.querySelector('#l11-real84-header-launch'),null,{timeout:30000});
  await page.waitForTimeout(300);
}

try{
  const desktopContext=await contextFor({width:1600,height:900});
  const page=await desktopContext.newPage();
  const consoleErrors=[];
  page.on('pageerror',error=>consoleErrors.push(error.message));
  page.on('console',message=>{if(message.type()==='error'&&!/favicon|404/i.test(message.text()))consoleErrors.push(message.text());});
  await waitLesson(page);

  /* Reproduce the authenticated-pathway condition from the reported screenshot:
     a routebar can still have a large DOM rectangle even though it is not the
     visible strip directly under the lesson header. The dock must ignore it. */
  await page.evaluate(()=>{
    const route=document.querySelector('.routebar');
    if(!route)return;
    Object.assign(route.style,{display:'flex',visibility:'visible',opacity:'1',position:'fixed',top:'560px',left:'0',right:'0',height:'54px',zIndex:'1'});
    window.dispatchEvent(new Event('resize'));
  });
  await page.waitForTimeout(120);
  await page.click('#l11-real84-header-launch');
  await page.waitForSelector('.ti84-inline-dock.open');
  await page.frameLocator('.ti84-inline-dock iframe').locator('[data-qa-ti84]').waitFor({timeout:15000});

  const desktop=await page.evaluate(()=>{
    const topbar=document.querySelector('.topbar').getBoundingClientRect();
    const route=document.querySelector('.routebar').getBoundingClientRect();
    const dock=document.querySelector('.ti84-inline-dock').getBoundingClientRect();
    const shell=document.querySelector('.ti84-inline-frame-shell');
    const shellRect=shell.getBoundingClientRect();
    const frame=document.querySelector('.ti84-inline-frame-shell iframe').getBoundingClientRect();
    const app=document.querySelector('.app-shell').getBoundingClientRect();
    const footer=document.querySelector('.footer').getBoundingClientRect();
    return{
      viewport:{width:innerWidth,height:innerHeight},
      topbarBottom:topbar.bottom,
      artificialRouteTop:route.top,
      artificialRouteBottom:route.bottom,
      dock:{top:dock.top,left:dock.left,right:dock.right,width:dock.width,height:dock.height},
      shell:{width:shellRect.width,height:shellRect.height,clientWidth:shell.clientWidth,scrollWidth:shell.scrollWidth,clientHeight:shell.clientHeight,scrollHeight:shell.scrollHeight,overflow:getComputedStyle(shell).overflow},
      frame:{width:frame.width,height:frame.height,minHeight:getComputedStyle(document.querySelector('.ti84-inline-frame-shell iframe')).minHeight},
      appRight:app.right,
      footerRight:footer.right,
      bodyOverflow:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth
    };
  });
  check('Dock ignores a non-adjacent hidden-route rectangle',desktop.dock.top<=desktop.topbarBottom+8,JSON.stringify(desktop));
  check('Desktop dock begins high enough to show a usable calculator viewport',desktop.dock.height>=560,JSON.stringify(desktop.dock));
  check('Desktop dock is wide enough for a clear physical TI-84',desktop.dock.width>=540&&desktop.dock.width<=650,JSON.stringify(desktop.dock));
  check('Simulator shell has no horizontal scrolling',desktop.shell.scrollWidth-desktop.shell.clientWidth<=2&&desktop.shell.overflow==='hidden',JSON.stringify(desktop.shell));
  check('Iframe fills the available simulator viewport',Math.abs(desktop.frame.width-desktop.shell.width)<=2&&Math.abs(desktop.frame.height-desktop.shell.height)<=2&&desktop.frame.minHeight==='0px',JSON.stringify({shell:desktop.shell,frame:desktop.frame}));
  check('Slide and footer stop at the dock edge',Math.abs(desktop.appRight-desktop.dock.left)<=3&&Math.abs(desktop.footerRight-desktop.dock.left)<=3,JSON.stringify(desktop));
  check('Whole page has no horizontal overflow',desktop.bodyOverflow<=2,JSON.stringify(desktop));

  const calculatorBox=await page.frameLocator('.ti84-inline-dock iframe').locator('[data-qa-ti84]').boundingBox();
  const dockBox=await page.locator('.ti84-inline-dock').boundingBox();
  check('Mock physical calculator is fully visible horizontally inside the dock',!!calculatorBox&&!!dockBox&&calculatorBox.x>=dockBox.x&&calculatorBox.x+calculatorBox.width<=dockBox.x+dockBox.width,JSON.stringify({calculatorBox,dockBox}));

  const desktopShot=path.join(out,'lesson-1-1-ti84-side-dock-1600x900.png');
  await page.screenshot({path:desktopShot,fullPage:false});
  report.screenshots.push(desktopShot);
  check('No desktop browser console errors',consoleErrors.length===0,consoleErrors.join('\n'));
  await desktopContext.close();

  const mobileContext=await contextFor({width:390,height:844});
  const mobile=await mobileContext.newPage();
  await waitLesson(mobile);
  await mobile.click('#l11-real84-header-launch');
  await mobile.waitForSelector('.ti84-inline-dock.open');
  const mobileMetrics=await mobile.evaluate(()=>{
    const dock=document.querySelector('.ti84-inline-dock').getBoundingClientRect();
    return{
      dock:{top:dock.top,left:dock.left,width:dock.width,height:dock.height},
      bodyOverflow:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth,
      viewport:{width:innerWidth,height:innerHeight}
    };
  });
  check('Small screens use the full-screen TI-84 view',Math.abs(mobileMetrics.dock.left)<=1&&Math.abs(mobileMetrics.dock.top)<=1&&Math.abs(mobileMetrics.dock.width-mobileMetrics.viewport.width)<=2&&Math.abs(mobileMetrics.dock.height-mobileMetrics.viewport.height)<=2,JSON.stringify(mobileMetrics));
  check('Mobile TI-84 view has no page-level horizontal overflow',mobileMetrics.bodyOverflow<=2,JSON.stringify(mobileMetrics));
  const mobileShot=path.join(out,'lesson-1-1-ti84-mobile-390x844.png');
  await mobile.screenshot({path:mobileShot,fullPage:false});
  report.screenshots.push(mobileShot);
  await mobileContext.close();
}finally{
  await browser.close();
}

await writeFile(path.join(out,'lesson-1-1-ti84-dimensions-report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({checks:report.checks.length,errors:report.errors.length,screenshots:report.screenshots.length},null,2));
if(report.errors.length){for(const error of report.errors)console.error(`ERROR: ${error}`);process.exit(1);}
