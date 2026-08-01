import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseURL=process.env.ECHS_PREVIEW_URL||'http://127.0.0.1:4173';
const outputDir=process.env.ECHS_PREVIEW_OUTPUT||'artifacts/private-bank-visual';
await mkdir(outputDir,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const config={enabled:true,api_base:`${baseURL}/functions/v1`,setup_api_base:`${baseURL}/functions/v1`,backend_deployed:true,platform_name:'ECHS Mathematics',institution_name:'Education City High School',session_storage:'local'};
const teacher={id:'teacher-qa',display_name:'Mohammad Abu Ghuwaleh',username:'m.abughuwaleh',role:'teacher',organization_name:'ECHS Mathematics',can_manage_accounts:true};
const calculusPackage={bank_code:'CALC-BANK-01',bank_slug:'ap-calculus-bank-1',display_aliases:{student:'AP Calculus Bank 1',teacher:'AP Calculus Bank 1'},deployment_state:'complete-direct-upload',question_count:3019,pool_count:46,media_count:3366,trust_default:'publisher_key_direct',manifest:{target_courses:['ap-calculus'],questions:3019,pools:46,mapping_counts:{'ap-calculus:U0':822},question_types:{essay:3019}}};
const livePackages=[calculusPackage];
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
  await page.route('**/functions/v1/private-bank-api/student-questions*',route=>{
    const url=new URL(route.request().url()),unit=url.searchParams.get('unit');
    const total=unit==='0'?3:5913;
    route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,private:true,total,questions:[]})});
  });
  const entry={device:device.key,errors:[]};
  try{
    const response=await page.goto(`${baseURL}/question-bank/official/admin/private-bank-center.html`,{waitUntil:'domcontentloaded',timeout:45000});entry.status=response?.status()??null;
    const statusLocator=page.locator('#bankStatus');
    await statusLocator.waitFor({state:'visible',timeout:15000});
    await page.locator('html[data-non-calculus-packages="0"]').waitFor({state:'attached',timeout:15000});
    await page.locator('#bankStatus').filter({hasText:'No non-calculus package mapping remains.'}).waitFor({state:'visible',timeout:15000});
    const state=await page.evaluate(()=>({banks:document.querySelectorAll('#bankGrid .bankCard').length,complete:document.querySelectorAll('#bankGrid .bankState').length,questionTotal:document.getElementById('questionTotal')?.textContent,poolTotal:document.getElementById('poolTotal')?.textContent,mediaTotal:document.getElementById('mediaTotal')?.textContent,calcBanks:document.getElementById('calcBanks')?.textContent,calcReadiness:document.getElementById('calcReadiness')?.textContent,calcVerified:document.getElementById('calcVerified')?.textContent,alignmentCards:document.querySelectorAll('.alignmentCard').length,cleanupDisabled:document.getElementById('keepCalculusOnly')?.disabled,dangerHidden:document.getElementById('cleanupDangerZone')?.classList.contains('hidden'),nonCalculusPackages:document.documentElement.dataset.nonCalculusPackages,text:document.body.innerText,width:Math.max(document.body.scrollWidth,document.documentElement.scrollWidth),viewport:document.documentElement.clientWidth}));
    Object.assign(entry,state);
    if(state.banks!==1)entry.errors.push(`Expected one AP Calculus bank card, found ${state.banks}`);
    if(state.complete!==1||!state.text.includes('complete direct upload'))entry.errors.push('AP Calculus live package state did not render');
    if(state.questionTotal!=='3,019'||state.poolTotal!=='46'||state.mediaTotal!=='3,366')entry.errors.push('AP Calculus inventory totals did not render');
    if(state.alignmentCards!==3||!state.text.includes('AP Precalculus')||!state.text.includes('IB Mathematics AI'))entry.errors.push('Calculus-only course boundary cards did not render');
    if(state.calcBanks!=='1'||state.calcReadiness!=='822'||state.calcVerified!=='3,019')entry.errors.push('AP Calculus private-bank metrics did not render');
    if(state.nonCalculusPackages!=='0'||state.cleanupDisabled!==true||state.dangerHidden!==true)entry.errors.push('Completed calculus-only cleanup state or teacher-only safety boundary did not render');
    if(!state.text.includes('Publisher-key direct')||!state.text.includes('not independently audited'))entry.errors.push('Direct-use disclosure is missing');
    if(!state.text.includes('AP Calculus Bank 1'))entry.errors.push('Missing AP Calculus bank alias');
    for(const legacyAlias of ['AP Precalculus Bank 1','IB Mathematics Bank 1'])if(state.text.includes(legacyAlias))entry.errors.push(`Removed bank alias leaked: ${legacyAlias}`);
    for(const publisher of ['Pearson','Blitzer','Addison-Wesley','ISBN'])if(state.text.includes(publisher))entry.errors.push(`Publisher-facing text leaked: ${publisher}`);
    if(state.width>state.viewport+2)entry.errors.push(`Horizontal overflow ${state.width}px > ${state.viewport}px`);
    if(entry.status&&entry.status>=400)entry.errors.push(`HTTP ${entry.status}`);if(consoleErrors.length)entry.errors.push(`Console: ${consoleErrors.join(' | ')}`);if(pageErrors.length)entry.errors.push(`Page: ${pageErrors.join(' | ')}`);
    entry.screenshot=path.join(outputDir,`private-bank-center-${device.key}.png`);await page.screenshot({path:entry.screenshot,fullPage:true});
  }catch(error){entry.errors.push(error.message)}
  if(entry.errors.length)report.errors.push(...entry.errors.map(error=>`${device.key}: ${error}`));report.pages.push(entry);await context.close();
}
await browser.close();await writeFile(path.join(outputDir,'private-bank-center-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(report.errors.length)process.exitCode=1;
