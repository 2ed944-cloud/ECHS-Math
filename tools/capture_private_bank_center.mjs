import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseURL=process.env.ECHS_PREVIEW_URL||'http://127.0.0.1:4173';
const outputDir=process.env.ECHS_PREVIEW_OUTPUT||'artifacts/private-bank-visual';
await mkdir(outputDir,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const config={enabled:true,api_base:`${baseURL}/functions/v1`,setup_api_base:`${baseURL}/functions/v1`,backend_deployed:true,platform_name:'ECHS Mathematics',institution_name:'Education City High School',session_storage:'local'};
const teacher={id:'teacher-qa',display_name:'Mohammad Abu Ghuwaleh',username:'m.abughuwaleh',role:'teacher',organization_name:'ECHS Mathematics',can_manage_accounts:true};
const livePackages=['ECHS-BB-AT9','ECHS-BB-CA9','ECHS-BB-CA9B','ECHS-BB-ACS10'].map((bank_code,index)=>({bank_code,deployment_state:'complete-private-upload',question_count:[4945,3604,2837,4285][index],pool_count:[355,253,282,594][index],media_count:[13439,8767,7415,8972][index]}));
const devices=[{key:'desktop',viewport:{width:1440,height:1000},isMobile:false},{key:'mobile',viewport:{width:390,height:844},isMobile:true}];
const report={generatedAt:new Date().toISOString(),pages:[],errors:[]};
for(const device of devices){
  const context=await browser.newContext({viewport:device.viewport,isMobile:device.isMobile,deviceScaleFactor:1,reducedMotion:'reduce',serviceWorkers:'block'});
  const page=await context.newPage();const consoleErrors=[],pageErrors=[];
  page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text())});
  page.on('pageerror',error=>pageErrors.push(error.message));
  await page.addInitScript(account=>{localStorage.setItem('echs_institution_token_v1','private-bank-visual-token');localStorage.setItem('echs_institution_account_v1',JSON.stringify(account));localStorage.setItem('echs_institution_expires_v1',new Date(Date.now()+3600000).toISOString())},teacher);
  await page.route('**/config/institution.json*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(config)}));
  await page.route('**/functions/v1/account-api/me*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,account:teacher})}));
  await page.route('**/functions/v1/private-bank-api/packages*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,private:true,packages:livePackages})}));
  const entry={device:device.key,errors:[]};
  try{
    const response=await page.goto(`${baseURL}/question-bank/official/admin/private-bank-center.html`,{waitUntil:'domcontentloaded',timeout:45000});
    entry.status=response?.status()??null;
    await page.locator('#bankStatus').waitFor({state:'attached',timeout:15000});
    await page.waitForFunction(()=>document.getElementById('bankStatus')?.textContent?.includes('Private backend connected'),null,{timeout:15000});
    const state=await page.evaluate(()=>({
      banks:document.querySelectorAll('#bankGrid .bankCard').length,
      complete:document.querySelectorAll('#bankGrid .bankState').length,
      questionTotal:document.getElementById('questionTotal')?.textContent,
      poolTotal:document.getElementById('poolTotal')?.textContent,
      mediaTotal:document.getElementById('mediaTotal')?.textContent,
      apLessons:document.getElementById('apLessons')?.textContent,
      apReadiness:document.getElementById('apReadiness')?.textContent,
      apVerified:document.getElementById('apVerified')?.textContent,
      ibLessons:document.getElementById('ibLessons')?.textContent,
      ibReadiness:document.getElementById('ibReadiness')?.textContent,
      ibVerified:document.getElementById('ibVerified')?.textContent,
      alignmentCards:document.querySelectorAll('.alignmentCard').length,
      text:document.body.innerText,
      width:Math.max(document.body.scrollWidth,document.documentElement.scrollWidth),
      viewport:document.documentElement.clientWidth,
    }));
    Object.assign(entry,state);
    if(state.banks!==4)entry.errors.push(`Expected four bank cards, found ${state.banks}`);
    if(state.complete!==4||!state.text.includes('complete private upload'))entry.errors.push('Live package states did not render');
    if(state.questionTotal!=='15,671'||state.poolTotal!=='1,484'||state.mediaTotal!=='38,593')entry.errors.push('Private inventory totals did not render');
    if(state.alignmentCards!==2||state.apLessons!=='49'||state.apReadiness!=='5,754'||state.apVerified!=='0')entry.errors.push('AP Precalculus alignment metrics did not render correctly');
    if(state.ibLessons!=='25'||state.ibReadiness!=='164'||state.ibVerified!=='0')entry.errors.push('IB Mathematics alignment metrics did not render correctly');
    if(!state.text.includes('Candidate counts can overlap')||!state.text.includes('content build required'))entry.errors.push('Candidate-versus-verified mapping warning is missing');
    for(const alias of ['AP Precalculus Bank 1','AP Precalculus Bank 4','IB Mathematics Bank 1','IB Mathematics Bank 4'])if(!state.text.includes(alias))entry.errors.push(`Missing alias ${alias}`);
    for(const publisher of ['Pearson','Blitzer','Addison-Wesley','ISBN'])if(state.text.includes(publisher))entry.errors.push(`Publisher-facing text leaked: ${publisher}`);
    if(state.width>state.viewport+2)entry.errors.push(`Horizontal overflow ${state.width}px > ${state.viewport}px`);
    if(entry.status&&entry.status>=400)entry.errors.push(`HTTP ${entry.status}`);
    if(consoleErrors.length)entry.errors.push(`Console: ${consoleErrors.join(' | ')}`);
    if(pageErrors.length)entry.errors.push(`Page: ${pageErrors.join(' | ')}`);
    entry.screenshot=path.join(outputDir,`private-bank-center-${device.key}.png`);
    await page.screenshot({path:entry.screenshot,fullPage:true});
  }catch(error){entry.errors.push(error.message)}
  if(entry.errors.length)report.errors.push(...entry.errors.map(error=>`${device.key}: ${error}`));
  report.pages.push(entry);await context.close();
}
await browser.close();
await writeFile(path.join(outputDir,'private-bank-center-report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
if(report.errors.length)process.exitCode=1;
