import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';

const root=new URL('../',import.meta.url).pathname;
const port=4173;
const server=spawn('python3',['-m','http.server',String(port),'--directory',root],{stdio:'ignore'});
await new Promise(r=>setTimeout(r,1200));

const files=[
  'IB_AI_SL_1.2_arithmetic_sequences_ECHS.html',
  'IB_AI_SL_1.3_geometric_sequences_ECHS.html',
  'IB_AI_SL_1.4_financial_models_ECHS.html',
  'IB_AI_SL_1.5_logarithms_ECHS.html',
  'IB_AI_SL_1.6_technology_equations_ECHS.html'
];
const devices=[['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]];
const out='artifacts/ib-ai-unit1-gdc-v7';
await fs.mkdir(out,{recursive:true});
let failures=[];

try{
  const browser=await chromium.launch({headless:true});
  for(const [device,viewport] of devices){
    for(const file of files){
      const context=await browser.newContext({viewport});
      const page=await context.newPage();
      const errors=[];
      const localHttpErrors=[];
      const external=[];
      let simulatorOpened=false;
      page.on('pageerror',e=>{if(!simulatorOpened)errors.push(String(e));});
      page.on('console',m=>{if(m.type()==='error'&&!simulatorOpened)errors.push(m.text());});
      page.on('response',r=>{try{const u=new URL(r.url());if(['127.0.0.1','localhost'].includes(u.hostname)&&r.status()>=400)localHttpErrors.push(`${r.status()} ${u.pathname}`);}catch{}});
      page.on('request',r=>{try{const u=new URL(r.url());if(!['127.0.0.1','localhost'].includes(u.hostname)&&!['data:','blob:'].includes(u.protocol))external.push(r.url());}catch{}});
      try{
        await page.goto(`http://127.0.0.1:${port}/lessons/ib-math-ai/unit-1/lessons/${file}#learn`,{waitUntil:'networkidle'});
        await page.waitForSelector('.gdc-v7-launch',{timeout:12000});
        await page.waitForSelector('#u1-ti84-header-launch',{timeout:12000});
        await page.waitForSelector('#u1-ti84-simulator iframe',{timeout:12000});

        const simFrame=page.locator('#u1-ti84-simulator iframe');
        if((await simFrame.getAttribute('src'))!=='about:blank')throw new Error('simulator is not lazy-loaded');
        if(!/ti84calc\.com\/ti84calc/.test(await simFrame.getAttribute('data-src')||''))throw new Error('simulator provider missing');

        await page.locator('.gdc-v7-launch').focus();
        await page.keyboard.press('Enter');
        await page.waitForSelector('.gdc-v7-shell');
        if(await page.locator('.gdc-v7-stage').count()<5)throw new Error('five stages missing');
        const gdcFocus=page.locator('.gdc-v7-shell button:visible,.gdc-v7-shell select:visible,.gdc-v7-shell a:visible');
        const first=gdcFocus.first(),last=gdcFocus.last();
        await first.focus();
        await page.keyboard.press('Shift+Tab');
        if(!(await last.evaluate(el=>el===document.activeElement)))throw new Error('GDC focus trap failed');
        await page.keyboard.press('Escape');
        await page.waitForSelector('.gdc-v7-shell',{state:'detached'});

        const launcher=device==='mobile'?page.locator('#u1-ti84-header-launch'):page.locator('.routebar .u1-ti84-sim-launch');
        simulatorOpened=true;
        await launcher.click();
        await page.waitForSelector('#u1-ti84-simulator.is-open');
        if(!((await simFrame.getAttribute('src'))||'').includes('ti84calc.com/ti84calc'))throw new Error('simulator did not load');
        const simFocus=page.locator('#u1-ti84-simulator button:visible,#u1-ti84-simulator a:visible');
        const simFirst=simFocus.first(),simLast=simFocus.last();
        await simFirst.focus();
        await page.keyboard.press('Shift+Tab');
        if(!(await simLast.evaluate(el=>el===document.activeElement)))throw new Error('simulator focus trap failed');
        await page.keyboard.press('Escape');
        if(await page.locator('#u1-ti84-simulator').evaluate(el=>el.classList.contains('is-open')))throw new Error('simulator did not close with Escape');

        await page.evaluate(()=>{location.hash='#learn';window.dispatchEvent(new HashChangeEvent('hashchange'));});
        await page.waitForTimeout(350);
        const body=await page.locator('body').evaluate(el=>({sw:el.scrollWidth,cw:el.clientWidth,text:el.innerText}));
        if(body.sw>body.cw+3)throw new Error(`horizontal overflow ${body.sw}/${body.cw}`);
        if(!body.text.includes('TI-84')&&!body.text.includes('GDC'))throw new Error('GDC/TI-84 content not discoverable');
        if(!external.some(x=>/ti84calc\.com\/ti84calc/i.test(x)))throw new Error('TI-84 simulator request was not issued');
        if(external.some(x=>/desmos|geogebra/i.test(x)))throw new Error('unexpected calculator provider request');
        if(localHttpErrors.length)throw new Error('local HTTP errors: '+localHttpErrors.join(' | '));
        if(errors.length)throw new Error('pre-simulator console/page errors: '+errors.join(' | '));
        await page.screenshot({path:`${out}/${device}-${file.replace('.html','')}.png`,fullPage:false});
      }catch(e){
        failures.push(`${device} ${file}: ${e.message}`);
      }finally{
        await context.close();
      }
    }
  }
  await browser.close();
}finally{
  server.kill('SIGTERM');
}
if(failures.length){console.error(failures.join('\n'));process.exit(1);}
console.log('Chromium desktop/mobile QA passed for all five lessons with the TI-84 simulator.');
