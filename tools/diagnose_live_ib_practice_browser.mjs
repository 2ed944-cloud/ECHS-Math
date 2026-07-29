import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright-core';

const session=JSON.parse(await readFile(process.env.ECHS_DIAG_SESSION_FILE,'utf8'));
const base=(process.env.ECHS_LIVE_URL||'https://2ed944-cloud.github.io/ECHS-Math').replace(/\/$/,'');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
await context.addInitScript(payload=>{
  localStorage.setItem('echs_institution_token_v1',payload.token);
  localStorage.setItem('echs_institution_account_v1',JSON.stringify(payload.account));
  localStorage.setItem('echs_institution_expires_v1',payload.expires_at);
},session);
const page=await context.newPage();
const consoleErrors=[],pageErrors=[],apiResponses=[];
page.on('console',message=>{if(['error','warning'].includes(message.type()))consoleErrors.push({type:message.type(),text:message.text().slice(0,500)})});
page.on('pageerror',error=>pageErrors.push(String(error?.stack||error).slice(0,1000)));
page.on('response',async response=>{
  if(!response.url().includes('/private-bank-api/'))return;
  let payload={};try{payload=await response.json()}catch{}
  apiResponses.push({status:response.status(),url:new URL(response.url()).pathname+new URL(response.url()).search,total:payload?.total??null,returned:Array.isArray(payload?.questions)?payload.questions.length:null,error:payload?.error?.code||null});
});
const url=`${base}/question-bank/practice.html?course=ib-math-ai&diagnostic=${Date.now()}`;
await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});
await page.waitForSelector('#bundle option',{state:'attached',timeout:60000});
await page.waitForTimeout(12000);
const result=await page.evaluate(()=>({
  href:location.pathname+location.search,
  role:window.ECHSPortalAccess?.current?.role||null,
  authenticated:window.ECHSPortalAccess?.current?.authenticated??null,
  courseKeys:window.ECHSPortalAccess?.current?.courseKeys||[],
  bundleValue:document.querySelector('#bundle')?.value||null,
  bundleText:document.querySelector('#bundle')?.selectedOptions?.[0]?.textContent||null,
  heroLoaded:document.querySelector('#heroLoaded')?.textContent||null,
  heroBanks:document.querySelector('#heroBanks')?.textContent||null,
  status:document.querySelector('#status')?.textContent?.replace(/\s+/g,' ').trim()||null,
  bankOptions:[...(document.querySelector('#bank')?.options||[])].map(option=>option.textContent),
  datasets:{...document.documentElement.dataset},
  privateScript:[...document.scripts].find(script=>script.src.includes('private-bank-practice.js'))?.src||null,
  bankScript:[...document.scripts].find(script=>/\/bank\.js/.test(script.src))?.src||null,
  serviceWorker:document.documentElement.dataset.serviceWorker||null,
}));
await page.screenshot({path:'/tmp/ib-live-practice.png',fullPage:true});
console.log('LIVE_IB_BROWSER_DIAGNOSTIC=');
console.log(JSON.stringify({...result,apiResponses,consoleErrors,pageErrors},null,2));
await browser.close();
if(result.role!=='teacher'&&result.role!=='admin')throw new Error(`Diagnostic session resolved as ${result.role}`);
if(!apiResponses.some(row=>Number(row.total)>0))throw new Error('Browser did not receive the non-empty IB private-bank API response');
if(Number(String(result.heroLoaded||'').replace(/[^0-9]/g,''))<=0)throw new Error('Browser received the IB API response but rendered zero questions');
