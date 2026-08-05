import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseURL=process.env.ECHS_PREVIEW_URL||'http://127.0.0.1:4173';
const outputDir=process.env.ECHS_PREVIEW_OUTPUT||'artifacts/ib-ai-1-5-v6-0-2';
const lessonURL=`${baseURL}/lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.5_logarithms_ECHS.html#learn`;
const storageKey='echs:ib-ai:u1:1.5:learn-index';
await mkdir(outputDir,{recursive:true});

const browser=await chromium.launch({
  executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',
  headless:true,
  args:['--no-sandbox','--disable-dev-shm-usage','--font-render-hinting=none']
});
const report={lessonURL,generatedAt:new Date().toISOString(),checks:[],errors:[],screenshots:[]};
const addCheck=(name,pass,details='')=>{report.checks.push({name,pass,details});if(!pass)report.errors.push(`${name}: ${details}`);};
const overlaps=(a,b)=>a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1;

async function openAtTitle(title,viewport,{accessBar=false}={}){
  const context=await browser.newContext({viewport,deviceScaleFactor:1,reducedMotion:'reduce',serviceWorkers:'block'});
  const page=await context.newPage();
  const consoleErrors=[];
  page.on('console',message=>{if(message.type()==='error'&&!/favicon|404/i.test(message.text()))consoleErrors.push(message.text());});
  page.on('pageerror',error=>consoleErrors.push(error.message));
  await page.goto(lessonURL,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>document.body.dataset.rendered==='1'&&window.LESSON_DATA?.slides?.length===73,null,{timeout:30000});
  const index=await page.evaluate(wanted=>window.LESSON_DATA.slides.findIndex(slide=>slide.title===wanted),title);
  if(index<0)throw new Error(`Slide not found: ${title}`);
  await page.evaluate(({key,index})=>localStorage.setItem(key,String(index)),{key:storageKey,index});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(expected=>document.body.dataset.rendered==='1'&&document.getElementById('progress-label')?.textContent?.trim().startsWith(`${expected} /`),index+1,{timeout:30000});
  if(accessBar){
    await page.evaluate(()=>{
      document.documentElement.dataset.lessonAccessLayout='bar';
      document.documentElement.style.setProperty('--echs-access-bar-height','64px');
      document.body.classList.add('hasEchsLessonAccessBar');
      const bar=document.createElement('div');
      bar.id='qa-access-bar';
      Object.assign(bar.style,{position:'fixed',inset:'0 0 auto 0',height:'64px',zIndex:'9999',background:'#102a43'});
      document.body.prepend(bar);
    });
  }
  await page.waitForTimeout(350);
  await page.evaluate(()=>{const stage=document.querySelector('.stage');if(stage)stage.scrollTop=0;});
  return{context,page,index,consoleErrors};
}

async function commonState(page){
  return page.evaluate(()=>{
    const box=selector=>{const rect=document.querySelector(selector)?.getBoundingClientRect();return rect?{left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom,width:rect.width,height:rect.height}:null;};
    return{
      bodyOverflow:Math.max(0,document.documentElement.scrollWidth-innerWidth,document.body.scrollWidth-innerWidth),
      stageOverflow:Math.max(0,(document.querySelector('.stage')?.scrollWidth||0)-(document.querySelector('.stage')?.clientWidth||0)),
      rawMath:((document.getElementById('app')?.innerText||'').match(/\\\(|\\\[|\\\)|\\\]/g)||[]).length,
      mathErrors:document.querySelectorAll('[data-math-error="true"],.katex-error,.katex .merror').length,
      topbar:box('.topbar'),routebar:box('.routebar'),app:box('.app-shell'),title:box('.slide-title'),
      progress:document.getElementById('progress-label')?.textContent?.trim()||''
    };
  });
}

try{
  {
    const {context,page,consoleErrors}=await openAtTitle('A logarithm answers “what exponent?”',{width:1754,height:877},{accessBar:true});
    const state=await commonState(page);
    const visual=await page.evaluate(()=>({
      visual:Boolean(document.querySelector('.el-log-definition-visual-v602')),
      equation:(document.querySelector('.el-log-equation-v602')?.innerText||'').replace(/\s+/g,' ').trim(),
      roles:[...document.querySelectorAll('.el-log-role-grid-v602 article')].map(node=>{const r=node.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom};}),
      inverse:Boolean(document.querySelector('.el-log-inverse-strip-v602'))
    }));
    addCheck('logarithm visual rendered',visual.visual&&visual.inverse,JSON.stringify(visual));
    addCheck('logarithm equation is correctly typeset',/log/.test(visual.equation)&&visual.roles.length===3,visual.equation);
    addCheck('logarithm role cards do not overlap',visual.roles.every((a,i)=>visual.roles.slice(i+1).every(b=>!overlaps(a,b))),JSON.stringify(visual.roles));
    addCheck('authenticated topbar begins below access bar',state.topbar&&state.topbar.top>=63,JSON.stringify(state));
    addCheck('routebar begins below topbar',state.routebar&&state.topbar&&state.routebar.top>=state.topbar.bottom-1,JSON.stringify(state));
    addCheck('lesson app begins below routebar',state.app&&state.routebar&&state.app.top>=state.routebar.bottom-1,JSON.stringify(state));
    addCheck('logarithm slide has no horizontal overflow',state.bodyOverflow<=2&&state.stageOverflow<=2,JSON.stringify(state));
    addCheck('logarithm slide math rendered cleanly',state.rawMath===0&&state.mathErrors===0,JSON.stringify(state));
    addCheck('logarithm slide has no console errors',consoleErrors.length===0,consoleErrors.join('\n'));
    const shot=path.join(outputDir,'desktop-logarithm-definition.png');await page.screenshot({path:shot,fullPage:false});report.screenshots.push(shot);
    await context.close();
  }
  {
    const {context,page,consoleErrors}=await openAtTitle('Continuous crossing versus recorded period',{width:1754,height:877},{accessBar:true});
    const state=await commonState(page);
    const visual=await page.evaluate(()=>({
      visual:Boolean(document.querySelector('.el-threshold-journey-v602')),
      cards:[...document.querySelectorAll('.el-threshold-journey-v602 article')].map(node=>{const r=node.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,text:node.innerText.replace(/\s+/g,' ').trim()};}),
      text:(document.querySelector('.el-threshold-v602')?.innerText||'').replace(/\s+/g,' ').trim(),
      stageScroll:Math.max(0,(document.querySelector('.stage')?.scrollHeight||0)-(document.querySelector('.stage')?.clientHeight||0))
    }));
    addCheck('threshold journey rendered',visual.visual&&visual.cards.length===3,JSON.stringify(visual));
    addCheck('threshold cards do not overlap',visual.cards.every((a,i)=>visual.cards.slice(i+1).every(b=>!overlaps(a,b))),JSON.stringify(visual.cards));
    addCheck('threshold values were independently corrected',visual.text.includes('2747')&&visual.text.includes('3132')&&visual.text.includes('11.67'),visual.text);
    addCheck('threshold slide has no horizontal overflow',state.bodyOverflow<=2&&state.stageOverflow<=2,JSON.stringify(state));
    addCheck('threshold slide math rendered cleanly',state.rawMath===0&&state.mathErrors===0,JSON.stringify(state));
    addCheck('threshold title remains visible below chrome',state.title&&state.app&&state.title.top>=state.app.top,JSON.stringify(state));
    addCheck('threshold slide uses compact classroom scroll',visual.stageScroll<260,`vertical scroll ${visual.stageScroll}px`);
    addCheck('threshold slide has no console errors',consoleErrors.length===0,consoleErrors.join('\n'));
    const shot=path.join(outputDir,'desktop-threshold-journey.png');await page.screenshot({path:shot,fullPage:false});report.screenshots.push(shot);
    await context.close();
  }
  {
    const {context,page,consoleErrors}=await openAtTitle('Continuous crossing versus recorded period',{width:390,height:844});
    const state=await commonState(page);
    const cards=await page.evaluate(()=>[...document.querySelectorAll('.el-threshold-journey-v602 article')].map(node=>{const r=node.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom};}));
    addCheck('mobile threshold cards stack without overlap',cards.length===3&&cards.every((a,i)=>cards.slice(i+1).every(b=>!overlaps(a,b))),JSON.stringify(cards));
    addCheck('mobile threshold has no horizontal overflow',state.bodyOverflow<=2&&state.stageOverflow<=2,JSON.stringify(state));
    addCheck('mobile threshold has no console errors',consoleErrors.length===0,consoleErrors.join('\n'));
    const shot=path.join(outputDir,'mobile-threshold-journey.png');await page.screenshot({path:shot,fullPage:false});report.screenshots.push(shot);
    await context.close();
  }
}finally{
  await browser.close();
}

await writeFile(path.join(outputDir,'report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({checks:report.checks.length,errors:report.errors.length,screenshots:report.screenshots.length},null,2));
if(report.errors.length){for(const error of report.errors)console.error(`ERROR: ${error}`);process.exit(1);}
