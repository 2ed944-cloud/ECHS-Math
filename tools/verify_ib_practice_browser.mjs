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
if(process.env.ECHS_ROUTE_BRANCH==='1'){
  const routed=[
    ['**/question-bank/practice.html*','question-bank/practice.html','text/html; charset=utf-8'],
    ['**/question-bank/css/practice-scope-access.css*','question-bank/css/practice-scope-access.css','text/css; charset=utf-8'],
    ['**/question-bank/js/bank.js*','question-bank/js/bank.js','application/javascript; charset=utf-8'],
    ['**/question-bank/js/practice-global-bridge.js*','question-bank/js/practice-global-bridge.js','application/javascript; charset=utf-8'],
    ['**/question-bank/js/private-bank-assets.js*','question-bank/js/private-bank-assets.js','application/javascript; charset=utf-8'],
    ['**/question-bank/js/practice-course-isolation.js*','question-bank/js/practice-course-isolation.js','application/javascript; charset=utf-8'],
    ['**/question-bank/js/mapped-private-bank-practice.js*','question-bank/js/mapped-private-bank-practice.js','application/javascript; charset=utf-8'],
    ['**/question-bank/js/ib-exact-lesson-bank-aliases.js*','question-bank/js/ib-exact-lesson-bank-aliases.js','application/javascript; charset=utf-8'],
    ['**/question-bank/js/mapped-practice.js*','question-bank/js/mapped-practice.js','application/javascript; charset=utf-8'],
    ['**/question-bank/js/practice-single-bank.js*','question-bank/js/practice-single-bank.js','application/javascript; charset=utf-8'],
    ['**/question-bank/js/practice-builder.js*','question-bank/js/practice-builder.js','application/javascript; charset=utf-8'],
  ];
  for(const [pattern,path,contentType] of routed){const body=await readFile(path,'utf8');await page.route(pattern,route=>route.fulfill({status:200,contentType,body}));}
  // The branch-only function is deployed after merge. For pull-request browser QA,
  // proxy its staff read requests through the already deployed protected endpoint.
  await page.route('**/functions/v1/practice-bank-api/**',async route=>{
    const url=new URL(route.request().url());
    if(url.pathname.endsWith('/practice-bank-api/questions'))url.pathname=url.pathname.replace('/practice-bank-api/questions','/private-bank-api/student-questions');
    else if(url.pathname.endsWith('/practice-bank-api/media-url'))url.pathname=url.pathname.replace('/practice-bank-api/media-url','/private-bank-api/media-url');
    const response=await route.fetch({url:url.href});
    await route.fulfill({response});
  });
}
const consoleErrors=[],pageErrors=[],apiResponses=[],failedRequests=[];
page.on('console',message=>{if(['error','warning'].includes(message.type()))consoleErrors.push({type:message.type(),text:message.text().slice(0,500)})});
page.on('pageerror',error=>pageErrors.push(String(error?.stack||error).slice(0,1000)));
page.on('requestfailed',request=>failedRequests.push({url:request.url(),error:request.failure()?.errorText||'failed'}));
page.on('response',async response=>{if(!/\/(?:practice-bank-api|private-bank-api)\//.test(response.url()))return;let payload={};try{payload=await response.json()}catch{}apiResponses.push({status:response.status(),url:new URL(response.url()).pathname+new URL(response.url()).search,total:payload?.total??null,returned:Array.isArray(payload?.questions)?payload.questions.length:null,error:payload?.error?.code||null});});
const url=`${base}/question-bank/practice.html?course=ib-math-ai&scope=course&diagnostic=${Date.now()}`;
await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});
const deadline=Date.now()+300000;
let complete=false;
while(Date.now()<deadline){
  const snapshot=await page.evaluate(()=>({loaded:document.querySelector('#heroLoaded')?.textContent||'',state:document.documentElement.dataset.ibCourseBankState||'',count:document.documentElement.dataset.ibCourseBankCount||''}));
  if(Number(String(snapshot.loaded).replace(/[^0-9]/g,''))>0&&snapshot.state==='ready'){complete=true;break;}
  await page.waitForTimeout(5000);
}
const result=await page.evaluate(()=>({href:location.pathname+location.search,title:document.title,bodyClass:document.body?.className||null,role:window.ECHSPortalAccess?.current?.role||null,authenticated:window.ECHSPortalAccess?.current?.authenticated??null,courseKeys:window.ECHSPortalAccess?.current?.courseKeys||[],courseValue:document.querySelector('#course')?.value||null,scopeValue:document.querySelector('#scope')?.value||null,bundleExists:Boolean(document.querySelector('#bundle')),bundleOptions:document.querySelector('#bundle')?.options?.length||0,bundleValue:document.querySelector('#bundle')?.value||null,bundleText:document.querySelector('#bundle')?.selectedOptions?.[0]?.textContent||null,heroLoaded:document.querySelector('#heroLoaded')?.textContent||null,heroBanks:document.querySelector('#heroBanks')?.textContent||null,status:document.querySelector('#status')?.textContent?.replace(/\s+/g,' ').trim()||null,shell:document.querySelector('#shell')?.textContent?.replace(/\s+/g,' ').trim().slice(0,500)||null,bankOptions:[...(document.querySelector('#bank')?.options||[])].map(option=>option.textContent),datasets:{...document.documentElement.dataset},privateScript:[...document.scripts].find(script=>script.src.includes('mapped-private-bank-practice.js'))?.src||null,bridgeScript:[...document.scripts].find(script=>script.src.includes('practice-global-bridge.js'))?.src||null,isolationScript:[...document.scripts].find(script=>script.src.includes('practice-course-isolation.js'))?.src||null,controllerScript:[...document.scripts].find(script=>script.src.includes('mapped-practice.js'))?.src||null,singleBankScript:[...document.scripts].find(script=>script.src.includes('practice-single-bank.js'))?.src||null,bankScript:[...document.scripts].find(script=>/\/bank\.js/.test(script.src))?.src||null,globals:{bank:Boolean(window.ECHSBank),learning:Boolean(window.ECHSLearning),institution:Boolean(window.ECHSInstitution)}}));
await page.screenshot({path:'/tmp/ib-live-practice.png',fullPage:true});
console.log('IB_PRACTICE_BROWSER_QA=');console.log(JSON.stringify({...result,complete,apiResponses,consoleErrors,pageErrors,failedRequests:failedRequests.slice(0,20)},null,2));
await browser.close();
if(result.role!=='teacher'&&result.role!=='admin')throw new Error(`QA session resolved as ${result.role}`);
if(result.courseValue!=='ib-math-ai')throw new Error(`Practice course resolved as ${result.courseValue}`);
if(result.scopeValue!=='course')throw new Error(`Staff course scope resolved as ${result.scopeValue}`);
if(!apiResponses.some(row=>Number(row.total)>0))throw new Error('Browser did not receive the non-empty IB protected bank response');
if(!complete||Number(String(result.heroLoaded||'').replace(/[^0-9]/g,''))<=0)throw new Error('IB private banks did not finish hydrating in the browser');
if(result.datasets.privateBankAdapter!=='ready')throw new Error('Integrated IB private-bank adapter was not installed');
if(result.datasets.practiceCourseIsolation!=='ready')throw new Error('Course-isolation layer was not installed');
if(result.datasets.practiceBankIsolation!=='ready')throw new Error('Single-bank isolation layer was not installed');
if(!result.bankOptions.some(label=>/^IB Mathematics AI Bank \d+$/.test(label)))throw new Error('IB bank choices were not rendered');
if(result.bankOptions.some(label=>/AP Calculus/i.test(label)))throw new Error('AP Calculus bank leaked into IB practice');
