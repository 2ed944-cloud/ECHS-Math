import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseURL=process.env.ECHS_PREVIEW_URL||'http://127.0.0.1:4173';
const outputDir=process.env.ECHS_PREVIEW_OUTPUT||'artifacts/upload-manager-visual';
await mkdir(outputDir,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const config={enabled:true,api_base:`${baseURL}/functions/v1`,setup_api_base:`${baseURL}/functions/v1`,backend_deployed:true};
const teacher={id:'teacher-qa',display_name:'Mohammad Abu Ghuwaleh',username:'m.abughuwaleh',role:'teacher',organization_name:'ECHS Mathematics'};
const requests=[{id:'11111111-1111-4111-8111-111111111111',upload_kind:'private-bank',original_filename:'echs-bb-at9-private-import.zip',file_size_bytes:29558507,sha256:'a'.repeat(64),status:'completed',progress:100,stage:'Private bank imported and linked to lessons',result:{bank_code:'ECHS-BB-AT9',questions:4945},created_at:new Date().toISOString()}];
const devices=[{key:'desktop',viewport:{width:1440,height:1000},isMobile:false},{key:'mobile',viewport:{width:390,height:844},isMobile:true}];
const report={generatedAt:new Date().toISOString(),pages:[],errors:[]};
for(const device of devices){
  const context=await browser.newContext({viewport:device.viewport,isMobile:device.isMobile,deviceScaleFactor:1,reducedMotion:'reduce',serviceWorkers:'block'});
  const page=await context.newPage();const errors=[];
  page.on('pageerror',error=>errors.push(`Page: ${error.message}`));
  page.on('console',message=>{if(message.type()==='error')errors.push(`Console: ${message.text()}`)});
  await page.addInitScript(account=>{localStorage.setItem('echs_institution_token_v1','upload-manager-visual-token');localStorage.setItem('echs_institution_account_v1',JSON.stringify(account));localStorage.setItem('echs_institution_expires_v1',new Date(Date.now()+3600000).toISOString())},teacher);
  await page.route('**/config/institution.json*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(config)}));
  await page.route('**/functions/v1/account-api/me*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,account:teacher})}));
  await page.route('**/functions/v1/upload-manager-api/requests?limit=20*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,requests})}));
  const entry={device:device.key,errors};
  try{
    const response=await page.goto(`${baseURL}/question-bank/official/admin/upload-manager.html`,{waitUntil:'domcontentloaded',timeout:45000});entry.status=response?.status()??null;
    await page.locator('#requestList .requestItem').waitFor({state:'visible',timeout:15000});
    const text=await page.locator('body').innerText();
    const dimensions=await page.locator('html').evaluate(node=>({width:Math.max(document.body.scrollWidth,node.scrollWidth),viewport:node.clientWidth}));
    if(!text.includes('Private Bank Manager')||!text.includes('Course Release Manager'))errors.push('Both upload modes are not visible');
    if(!text.includes('echs-bb-at9-private-import.zip')||!text.includes('4,945 questions'))errors.push('Upload history did not render');
    await page.locator('[data-upload-kind="course-release"]').click();
    if(!await page.locator('#releaseFields').isVisible())errors.push('Course release fields did not open');
    if(dimensions.width>dimensions.viewport+2)errors.push(`Horizontal overflow ${dimensions.width}px > ${dimensions.viewport}px`);
    if(entry.status&&entry.status>=400)errors.push(`HTTP ${entry.status}`);
    entry.screenshot=path.join(outputDir,`upload-manager-${device.key}.png`);await page.screenshot({path:entry.screenshot,fullPage:true});
  }catch(error){errors.push(error.message)}
  if(errors.length)report.errors.push(...errors.map(error=>`${device.key}: ${error}`));report.pages.push(entry);await context.close();
}
await browser.close();await writeFile(path.join(outputDir,'upload-manager-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(report.errors.length)process.exitCode=1;
