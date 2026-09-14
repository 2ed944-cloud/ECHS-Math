import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import path from 'node:path';

const require=createRequire(import.meta.url);
const {chromium}=require(process.env.ECHS_PLAYWRIGHT_MODULE||'playwright-core');

const baseURL=process.env.ECHS_PREVIEW_URL||'http://127.0.0.1:4173';
const outputDir=process.env.ECHS_PREVIEW_OUTPUT||'artifacts/ib-ai-1-5-v6-0-2';
const lessonURL=`${baseURL}/lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.5_logarithms_ECHS.html#learn`;
const storageKey='echs:ib-ai:u1:1.5:learn-index';
await mkdir(outputDir,{recursive:true});

let browser,baseRows;
const contexts=new Set(),sourceBytes=new Map();
const report={lessonURL,generatedAt:new Date().toISOString(),scope:'Local legacy lesson UI; access bar is a synthetic geometry fixture, not authentication evidence.',checks:[],errors:[],screenshots:[],cleanup:{contexts:true,browser:false},sourceStable:false};
const addCheck=(name,pass,details='')=>{report.checks.push({name,pass,details});if(!pass)report.errors.push(`${name}: ${details}`);};
const overlaps=(a,b)=>a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1;
const bounded=async(promise,ms,label)=>{let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(label)),ms);})]);}finally{clearTimeout(timer);}};
async function closeContext(context){await bounded(context.close(),5000,'context cleanup timeout');contexts.delete(context);}
async function readSource(relative){const url=new URL(relative,new URL('../',import.meta.url)),bytes=await readFile(url);sourceBytes.set(url.href,{relative,bytes});return bytes.toString('utf8');}
async function checkBaseLayer(){
  const context=vm.createContext({window:{},console});
  for(const name of ['lesson-1.5.js','lesson-1.5-exponents-logarithms-definitive-v6.js','lesson-1.5-product-law-visual-v6-0-1.js','lesson-1.5-visual-clarity-v6-0-2.js']){
    vm.runInContext(await readSource(`lessons/ib-math-ai/unit-1/data/${name}`),context,{filename:name,timeout:1000});
  }
  baseRows=JSON.parse(JSON.stringify(Object.fromEntries(['slides','practice','quiz','exam'].map(key=>[key,context.window.LESSON_DATA[key]]))));
  assert.deepEqual(Object.fromEntries(Object.entries(baseRows).map(([key,rows])=>[key,rows.length])),{slides:73,practice:96,quiz:14,exam:5});
  const html=await readSource('lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.5_logarithms_ECHS.html');
  for(const relative of ['assets/js/engine-lesson-quality-v1.js','data/unit-1-gdc-integration-lesson-quality-v1.js','data/unit-1-gdc-classroom-training-lesson-quality-v1.js']){
    assert.equal(html.split(`../${relative}`).length-1,1,`Expected one scoped script: ${relative}`);
    await readSource(`lessons/ib-math-ai/unit-1/${relative}`);
  }
  await readSource('tools/browser_qa_ib_ai_1_5_visual_v6_0_2.mjs');
  report.baseLayerCounts={slides:73,practice:96,quiz:14,exam:5};
}

async function openAtTitle(title,viewport,{accessBar=false}={}){
  const context=await browser.newContext({viewport,deviceScaleFactor:1,reducedMotion:'reduce',serviceWorkers:'block'});
  contexts.add(context);
  await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(baseURL).origin?route.continue():route.abort('blockedbyclient'));
  const page=await context.newPage();
  const consoleErrors=[];
  page.on('console',message=>{if(message.type()==='error'&&!/favicon|404/i.test(message.text()))consoleErrors.push(message.text());});
  page.on('pageerror',error=>consoleErrors.push(error.message));
  await page.goto(lessonURL,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>document.body.dataset.rendered==='1'&&Array.isArray(window.LESSON_DATA?.slides),null,{timeout:30000});
  const composition=await page.evaluate(base=>{
    const data=window.LESSON_DATA,keys=['slides','practice','quiz','exam'];
    return {counts:Object.fromEntries(keys.map(key=>[key,data[key]?.length])),basePreserved:keys.every(key=>JSON.stringify(data[key]?.slice(0,base[key].length))===JSON.stringify(base[key])),added:Object.fromEntries(keys.map(key=>[key,data[key]?.slice(base[key].length).map(row=>row.id)]))};
  },baseRows);
  assert.deepEqual(composition.counts,{slides:78,practice:103,quiz:14,exam:6});
  assert.equal(composition.basePreserved,true,'Original 73-screen layer and assessment rows must remain intact');
  const ids=(kind,count)=>Array.from({length:count},(_,i)=>`U1-GDC-V7-1.5-${kind}${String(i+1).padStart(2,'0')}`);
  assert.deepEqual(composition.added,{slides:ids('S',5),practice:ids('P',7),quiz:[],exam:ids('T',1)});
  report.composedCounts=composition.counts;
  addCheck('73-screen base and exact GDC additions are preserved',true,JSON.stringify(composition.counts));
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
  await checkBaseLayer();
  browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--font-render-hinting=none']});
  report.browser=browser.version();
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
    addCheck('topbar begins below simulated access bar',state.topbar&&state.topbar.top>=63,JSON.stringify(state));
    addCheck('routebar begins below topbar',state.routebar&&state.topbar&&state.routebar.top>=state.topbar.bottom-1,JSON.stringify(state));
    addCheck('lesson app begins below routebar',state.app&&state.routebar&&state.app.top>=state.routebar.bottom-1,JSON.stringify(state));
    addCheck('logarithm slide has no horizontal overflow',state.bodyOverflow<=2&&state.stageOverflow<=2,JSON.stringify(state));
    addCheck('logarithm slide math rendered cleanly',state.rawMath===0&&state.mathErrors===0,JSON.stringify(state));
    addCheck('logarithm slide has no console errors',consoleErrors.length===0,consoleErrors.join('\n'));
    const shot=path.join(outputDir,'desktop-logarithm-definition.png');await page.screenshot({path:shot,fullPage:false});report.screenshots.push(shot);
    await closeContext(context);
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
    await closeContext(context);
  }
  {
    const {context,page,consoleErrors}=await openAtTitle('Continuous crossing versus recorded period',{width:390,height:844});
    const state=await commonState(page);
    const cards=await page.evaluate(()=>[...document.querySelectorAll('.el-threshold-journey-v602 article')].map(node=>{const r=node.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom};}));
    addCheck('mobile threshold cards stack without overlap',cards.length===3&&cards.every((a,i)=>cards.slice(i+1).every(b=>!overlaps(a,b))),JSON.stringify(cards));
    addCheck('mobile threshold has no horizontal overflow',state.bodyOverflow<=2&&state.stageOverflow<=2,JSON.stringify(state));
    addCheck('mobile threshold has no console errors',consoleErrors.length===0,consoleErrors.join('\n'));
    const shot=path.join(outputDir,'mobile-threshold-journey.png');await page.screenshot({path:shot,fullPage:false});report.screenshots.push(shot);
    await closeContext(context);
  }
}catch(error){
  report.errors.push(`Browser QA failed: ${error.message}`);
  for(const context of contexts){
    for(const page of context.pages()){
      try{const shot=path.join(outputDir,`failure-${report.screenshots.length+1}.png`);await page.screenshot({path:shot,timeout:2000});report.screenshots.push(shot);}catch{}
    }
  }
}finally{
  for(const context of [...contexts]){try{await closeContext(context);}catch(error){report.cleanup.contexts=false;report.errors.push(`Context cleanup failed: ${error.message}`);}}
  try{if(browser)await bounded(browser.close(),5000,'browser cleanup timeout');report.cleanup.browser=true;}catch(error){report.errors.push(`Browser cleanup failed: ${error.message}`);}
  try{for(const [url,{bytes}] of sourceBytes)assert.ok((await readFile(new URL(url))).equals(bytes),'QA source changed during execution');report.sourceStable=true;}catch(error){report.errors.push(error.message);}
  report.sourceFiles=[...sourceBytes.values()].map(({relative,bytes})=>({path:relative,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')}));
  report.status=report.errors.length?'FAIL':'PASS';
  await writeFile(path.join(outputDir,'report.json'),JSON.stringify(report,null,2));
}

console.log(JSON.stringify({checks:report.checks.length,errors:report.errors.length,screenshots:report.screenshots.length},null,2));
if(report.errors.length){for(const error of report.errors)console.error(`ERROR: ${error}`);process.exit(1);}
