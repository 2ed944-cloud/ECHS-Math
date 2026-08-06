import { chromium } from 'playwright-core';

const base=process.env.ECHS_PREVIEW_URL||'http://127.0.0.1:4173';
const url=`${base}/lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.4_financial_models_ECHS.html?scope=all#learn`;
const key='echs:ib-ai:u1:1.4:learn-index';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const errors=[];
const verify=async viewport=>{
  const context=await browser.newContext({viewport,serviceWorkers:'block'});
  await context.route('https://ti84calc.com/ti84calc',route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><html><body><div data-qa-ti84>TI-84</div></body></html>'}));
  const page=await context.newPage();
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>document.body.dataset.rendered==='1'&&window.LESSON_DATA?.slides?.length===100,null,{timeout:30000});
  const index=await page.evaluate(()=>window.LESSON_DATA.slides.findIndex(slide=>slide.title==='Worked example · level monthly loan payment'));
  await page.evaluate(({key,index})=>localStorage.setItem(key,String(index)),{key,index});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForSelector('.fin84-inline-launch');
  await page.click('.fin84-inline-launch');
  await page.waitForSelector('.fin84-inline-dock.open');
  const geometry=await page.evaluate(()=>{
    const panel=document.querySelector('.fin84-inline-dock').getBoundingClientRect();
    const app=document.querySelector('.app-shell').getBoundingClientRect();
    const guidance=document.querySelector('.fin84-inline-guidance p');
    return{
      viewportWidth:innerWidth,
      panelLeft:panel.left,panelRight:panel.right,panelWidth:panel.width,
      appRight:app.right,
      guidanceOverflow:guidance.scrollWidth-guidance.clientWidth,
      bodyOverflow:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth
    };
  });
  if(viewport.width>820){
    if(Math.abs(geometry.panelRight-geometry.viewportWidth)>1)errors.push(`desktop panel right edge mismatch: ${JSON.stringify(geometry)}`);
    if(Math.abs(geometry.appRight-geometry.panelLeft)>8)errors.push(`desktop slide/dock gap: ${JSON.stringify(geometry)}`);
  }else{
    if(Math.abs(geometry.panelLeft)>1||Math.abs(geometry.panelRight-geometry.viewportWidth)>1||Math.abs(geometry.panelWidth-geometry.viewportWidth)>1)errors.push(`mobile panel does not fill viewport: ${JSON.stringify(geometry)}`);
  }
  if(geometry.guidanceOverflow>1)errors.push(`guidance text overflows: ${JSON.stringify(geometry)}`);
  if(geometry.bodyOverflow>1)errors.push(`page overflows horizontally: ${JSON.stringify(geometry)}`);
  console.log(JSON.stringify({viewport,geometry}));
  await context.close();
};
try{
  await verify({width:1920,height:1080});
  await verify({width:390,height:844});
}finally{
  await browser.close();
}
if(errors.length){for(const error of errors)console.error(`ERROR: ${error}`);process.exit(1);}
console.log('TI-84 Finance edge geometry: PASS');
