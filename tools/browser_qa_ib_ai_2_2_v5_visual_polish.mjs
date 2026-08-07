import {chromium} from 'playwright-core';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';

const base=process.env.ECHS_PREVIEW_URL||'http://127.0.0.1:4173';
const out=process.env.ECHS_PREVIEW_OUTPUT||'artifacts/ib-ai-2-2-v5-polish';
const lesson=`${base}/lessons/ib-math-ai/unit-2/lessons/IB_AI_SL_2.2_linear_quadratic_models_ECHS.html`;
const key='echs:ib-ai:u2:2.2:learn-index';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const report={checks:[],errors:[],screenshots:[]};
const check=(name,pass,details='')=>{report.checks.push({name,pass,details});if(!pass)report.errors.push(`${name}: ${details}`);};
const context=await browser.newContext({viewport:{width:1600,height:900},deviceScaleFactor:1,serviceWorkers:'block',reducedMotion:'reduce'});
const page=await context.newPage();
const consoleErrors=[];
page.on('pageerror',error=>consoleErrors.push(error.message));
page.on('console',message=>{if(message.type()==='error'&&!/favicon|404/i.test(message.text()))consoleErrors.push(message.text());});

async function openTitle(title){
  await page.goto(lesson,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>document.body.dataset.rendered==='1'&&window.LESSON_DATA?.slides?.length===80,null,{timeout:30000});
  const index=await page.evaluate(wanted=>window.LESSON_DATA.slides.findIndex(slide=>slide.title===wanted),title);
  if(index<0)throw new Error(`Slide not found: ${title}`);
  await page.evaluate(({key,index})=>localStorage.setItem(key,String(index)),{key,index});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(expected=>document.body.dataset.rendered==='1'&&document.getElementById('progress-label')?.textContent?.startsWith(`${expected} /`),index+1,{timeout:30000});
  await page.waitForTimeout(250);
}

try{
  await openTitle('Gradient is a rate with units');
  const gradient=await page.evaluate(()=>{
    const svg=document.querySelector('.lq5-gradient-precise');
    if(!svg)return{exists:false};
    const bounds=svg.getBoundingClientRect();
    const texts=[...svg.querySelectorAll('text')].map(node=>{const rect=node.getBoundingClientRect();return{text:node.textContent,left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom};});
    const inside=texts.every(rect=>rect.left>=bounds.left-1&&rect.right<=bounds.right+1&&rect.top>=bounds.top-1&&rect.bottom<=bounds.bottom+1);
    return{exists:true,inside,bounds:{left:bounds.left,right:bounds.right,top:bounds.top,bottom:bounds.bottom},texts};
  });
  check('precise gradient graphic rendered',gradient.exists,JSON.stringify(gradient));
  check('all gradient labels remain inside graphic',gradient.inside,JSON.stringify(gradient));
  check('gradient labels state exact changes',gradient.texts?.some(item=>item.text.includes('change in input = 6'))&&gradient.texts?.some(item=>item.text.includes('change in output = 7.5')),JSON.stringify(gradient.texts));
  const gradientShot=path.join(out,'gradient-precise.png');await page.screenshot({path:gradientShot});report.screenshots.push(gradientShot);

  await openTitle('Quadratic formula');
  const formula=await page.evaluate(()=>{
    const map=document.querySelector('.lq5-formula-map');
    const formulaNode=map?.querySelector('.formula');
    if(!map||!formulaNode)return{exists:false};
    const parent=map.getBoundingClientRect(),child=formulaNode.getBoundingClientRect();
    const cards=[...map.querySelectorAll(':scope > div')].map(node=>{const rect=node.getBoundingClientRect();return{left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom,text:node.innerText};});
    return{exists:true,inside:child.left>=parent.left-1&&child.right<=parent.right+1&&child.top>=parent.top-1&&child.bottom<=parent.bottom+1,parent:{left:parent.left,right:parent.right,top:parent.top,bottom:parent.bottom},child:{left:child.left,right:child.right,top:child.top,bottom:child.bottom},cards};
  });
  check('quadratic formula map rendered',formula.exists,JSON.stringify(formula));
  check('quadratic formula remains inside its map',formula.inside,JSON.stringify(formula));
  check('coefficient cards remain in the map',formula.cards?.length===4&&formula.cards.slice(0,3).every(card=>card.left>=formula.parent.left-1&&card.right<=formula.parent.right+1),JSON.stringify(formula.cards));
  const formulaShot=path.join(out,'quadratic-formula-polished.png');await page.screenshot({path:formulaShot});report.screenshots.push(formulaShot);

  check('visual-polish console is clean',consoleErrors.length===0,consoleErrors.join('\n'));
}finally{
  await context.close();
  await browser.close();
}

await writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({checks:report.checks.length,errors:report.errors.length,screenshots:report.screenshots.length},null,2));
if(report.errors.length){report.errors.forEach(error=>console.error(`ERROR: ${error}`));process.exit(1);}
