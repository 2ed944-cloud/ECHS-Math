/* Real Chromium acceptance of the projected fixture and production worker.
 * Every account/API response is synthetic. External traffic is blocked. Reports
 * contain counts/status only; screenshots contain no question/answer payloads.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {chromium} from '../question-bank/official/tools/node_modules/playwright/index.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const fixture=path.resolve(process.argv[2]||'artifacts/public-question-boundary/site');
const output=path.resolve(process.env.ECHS_PUBLIC_BROWSER_OUTPUT||'artifacts/public-question-boundary/browser');
const OFFICIAL='/question-bank/official';
const read=async relative=>JSON.parse(await fs.readFile(path.join(fixture,relative),'utf8'));
const index=await read('question-bank/official/data/student/question-index.json');
const archive=await read('question-bank/official/data/student/archive-index.json');
const ready=index.find(r=>r.type==='mcq'&&r.lessons?.length);
const restricted=archive.find(r=>r.studentReady!==true);
const manifest=await read('question-bank/official/data/student/publication-boundary.json');
assert.equal(index.length,1104);assert.equal(archive.length,1217);
await fs.mkdir(output,{recursive:true});
const results=[], errors=[], requests=[], networkEvents=[];
let currentCase='startup';
let origin, browser;
const account={id:'00000000-0000-4000-8000-000000000011',organization_id:'00000000-0000-4000-8000-000000000012',role:'teacher',display_name:'Synthetic Review Teacher',username:'synthetic-review'};
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'};
const server=http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,origin||'http://127.0.0.1');
    networkEvents.push({kind:'server-request',case:currentCase,path:url.pathname,time:Date.now()});
    const send=(code,body,type='application/json',cache='no-store')=>{res.writeHead(code,{'content-type':type,'cache-control':cache});res.end(body)};
    if(url.pathname==='/config/institution.json')return send(200,JSON.stringify({enabled:true,api_base:origin+'/__test_api'}));
    if(url.pathname==='/__test_api/account-api/me')return send(200,JSON.stringify({ok:true,account}));
    if(url.pathname.startsWith('/__test_api/'))return send(400,JSON.stringify({ok:false,error:{message:'Unexpected synthetic API request'}}));
    let name=decodeURIComponent(url.pathname).replace(/^\/+/, '');
    if(!name||name.endsWith('/'))name+='index.html';
    const file=path.resolve(fixture,name);
    if(!file.startsWith(fixture+path.sep))return send(404,'');
    const body=await fs.readFile(file);send(200,body,types[path.extname(file)]||'application/octet-stream','public,max-age=0');
  }catch{res.writeHead(404,{'cache-control':'no-store'});res.end('Not found')}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
origin=`http://127.0.0.1:${server.address().port}`;
async function run(name,action){currentCase=name;try{await action();results.push({name,status:'PASS'});console.log('PASS '+name)}catch(error){results.push({name,status:'FAIL',error:String(error.message)});console.log('FAIL '+name+': '+error.message)}}
async function context(signedIn=true,viewport={width:1365,height:900}){
  const ctx=await browser.newContext({viewport,reducedMotion:'reduce'});
  // Continue local requests and fulfill the declared pinned math dependency.
  // No external network response is needed for this isolated acceptance test.
  await ctx.route('**/*',async r=>{
    const url=new URL(r.request().url());
    if(url.origin===origin)return r.continue();
    const katexPrefix='https://cdn.jsdelivr.net/npm/katex@0.16.27/dist/';
    if(url.href.startsWith(katexPrefix)){
      const base=path.join(root,'question-bank/official/tools/node_modules/katex/dist');
      const file=path.resolve(base,url.pathname.split('/dist/')[1]);
      if(file.startsWith(base+path.sep))try{return await r.fulfill({status:200,body:await fs.readFile(file),contentType:types[path.extname(file)]||'application/octet-stream'})}catch{}
    }
    if(url.origin==='https://fonts.googleapis.com')return r.fulfill({status:200,contentType:'text/css',body:'/* Deterministic system-font fallback in isolated QA. */'});
    return r.abort();
  });
  if(signedIn)await ctx.addInitScript(a=>{
    sessionStorage.setItem('echs_institution_token_v1','synthetic-token-not-production');
    sessionStorage.setItem('echs_institution_account_v1',JSON.stringify(a));
    sessionStorage.setItem('echs_institution_expires_v1',new Date(Date.now()+3600000).toISOString());
  },account);
  const page=await ctx.newPage();page.setDefaultTimeout(15000);
  page.on('pageerror',e=>errors.push(String(e.message)));
  page.on('request',r=>{const u=new URL(r.url());requests.push(u.pathname);networkEvents.push({kind:'browser-request',case:currentCase,origin:u.origin,path:u.pathname,time:Date.now()})});
  page.on('requestfailed',r=>networkEvents.push({kind:'browser-failed',case:currentCase,path:new URL(r.url()).pathname,error:r.failure()?.errorText,time:Date.now()}));
  page.on('domcontentloaded',()=>networkEvents.push({kind:'domcontentloaded',case:currentCase,time:Date.now()}));
  return {ctx,page};
}
try{
  // This fixture is loopback-only. Host proxy initialization stalled the first
  // navigation even for script-free HTML in a separate controlled experiment.
  browser=await chromium.launch({headless:true,executablePath:process.env.ECHS_CHROMIUM_PATH||undefined,args:['--no-proxy-server']});
  const {ctx,page}=await context();
  await run('Guarded projected home retains1104 approved records',async()=>{
    await page.goto(origin+OFFICIAL+'/index.html',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.querySelector('#stats')?.textContent.replaceAll(',','').includes('1104'));
    await page.waitForFunction(()=>document.documentElement.dataset.platformRole==='teacher');
    assert.equal(await page.getAttribute('body','data-require-account'),'student teacher admin');
    await page.screenshot({path:path.join(output,'public-home-desktop.png')});
  });
  await run('Restricted archive UI remains metadata-only',async()=>{
    await page.goto(origin+OFFICIAL+'/archive.html?id='+encodeURIComponent(restricted.id),{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.querySelector('#archiveDetail')?.textContent.includes('not yet student-ready'));
    assert.equal(await page.locator('#archiveDetail .questionCard').count(),0);
    assert.equal(await page.locator('#archiveDetail').getByText('Open verified practice').count(),0);
    await page.screenshot({path:path.join(output,'restricted-archive-metadata.png')});
  });
  await run('Approved direct question remains interactive',async()=>{
    await page.goto(origin+OFFICIAL+'/practice.html?id='+encodeURIComponent(ready.id)+'&autostart=1',{waitUntil:'domcontentloaded'});
    await page.locator('.questionCard').waitFor();
    assert.ok([4,5].includes(await page.locator('.choice').count()));
    await page.locator('.choice').first().focus();
    assert.equal(await page.locator('.choice').first().evaluate(e=>e===document.activeElement),true);
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('.choice.selected').count(),1);
    await page.locator('#checkBtn').click();
    await page.locator('#feedback.show').waitFor();
    assert.equal(await page.locator('.choice.correct').count(),1);
  });
  await run('Teacher stable URL reviews only1104 approved records',async()=>{
    await page.goto(origin+OFFICIAL+'/teacher.html',{waitUntil:'domcontentloaded'});await page.waitForURL(/\/admin\/teacher\.html$/,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.querySelector('#reviewCount')?.textContent.replaceAll(',','').includes('1104'));
    assert.equal(await page.evaluate(()=>window.ECHS_ADMIN_MODE),false);
    assert.equal(await page.evaluate(()=>window.ECHS_DATA_ROOT),'../data/student');
    await page.locator('#public-review-boundary').waitFor();
    await page.screenshot({path:path.join(output,'teacher-public-review-desktop.png')});
  });
  await run('Import URL normalizes a synthetic batch without promotion',async()=>{
    await page.goto(origin+OFFICIAL+'/import.html',{waitUntil:'domcontentloaded'});await page.waitForURL(/\/admin\/import\.html$/,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>typeof I!=='undefined'&&typeof I.file.onchange==='function');
    await page.locator('#batchFile').setInputFiles({name:'synthetic-boundary.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify([{id:'SYNTHETIC-BOUNDARY-ONLY',course:'AP Calculus AB',type:'mcq',prompt:'Synthetic arithmetic: 1 + 1.',choices:[{id:'A',text:'2'},{id:'B',text:'3'}],studentReady:true,quality:{studentReadyGatePassed:true,productionStatus:'student-ready'}}]))});
    await page.waitForFunction(()=>document.querySelector('#importStatus')?.textContent.includes('Teacher-only: 1'));
    const status=await page.evaluate(()=>({ready:normalized.questions[0].studentReady,gate:normalized.questions[0].quality.studentReadyGatePassed,production:normalized.questions[0].quality.productionStatus}));
    assert.notEqual(status.ready,true);assert.equal(status.gate,false);assert.equal(status.production,'teacher-archive-only');
    await page.setViewportSize({width:390,height:844});
    await page.screenshot({path:path.join(output,'import-public-boundary-mobile.png')});
  });
  await run('Raw official data and denied media return404 without source fallback',async()=>{
    for(const p of ['/data/question-index.json','/data/questions/chunk-000.json','/admin/data/questions/chunk-000.json','/data/student/unreviewed.json','/media/unreviewed.png']){
      assert.equal((await ctx.request.get(origin+OFFICIAL+p)).status(),404,p);
    }
  });
  await ctx.close();
  await run('Existing signed-out guard still redirects teacher entry',async()=>{
    const {ctx,page}=await context(false);
    try{await page.goto(origin+OFFICIAL+'/admin/teacher.html',{waitUntil:'domcontentloaded'});await page.waitForURL(/\/login\.html\?next=/,{waitUntil:'domcontentloaded'})}finally{await ctx.close()}
  });
  await run('Actual service worker purges old raw and same-URL archive caches',async()=>{
    const {ctx,page}=await context();
    try{
      await page.goto(origin+OFFICIAL+'/index.html',{waitUntil:'domcontentloaded'});
      await page.evaluate(async()=>{
        const cache=await caches.open('historical-import-cache');
        for(const p of ['/question-bank/official/data/student/archive-index.json','/question-bank/official/data/student/archive-questions/chunk-000.json','/question-bank/official/data/student/raw-private-canary.json','/question-bank/official/admin/teacher.html','/question-bank/official/admin/import.html'])await cache.put(p,new Response('SYNTHETIC-OLD-PRIVATE-CANARY'));
        await navigator.serviceWorker.register('/sw.js');
        await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(new Error('Worker did not activate from the required fixture shell')),12000))]);
      });
      await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
      const old=await page.evaluate(async()=>Promise.all((await(await caches.open('historical-import-cache')).keys()).map(r=>r.url)));
      assert.deepEqual(old,[]);
      const result=await page.evaluate(async()=>{
        const r=await fetch('/question-bank/official/data/student/archive-index.json');const rows=await r.json();
        return {count:rows.length,restricted:rows.filter(r=>r.studentReady!==true).length};
      });
      assert.deepEqual(result,{count:1217,restricted:113});
      const media=OFFICIAL+'/'+manifest.media[0];
      assert.equal(await page.evaluate(async p=>(await fetch(p)).status,media),200);
      await ctx.setOffline(true);
      const offline=await page.evaluate(async({media})=>{
        const safe=await(await fetch('/question-bank/official/data/student/archive-index.json')).json();
        let denied=false;try{const r=await fetch('/question-bank/official/data/student/raw-private-canary.json');denied=!r.ok}catch{denied=true}
        return {count:safe.length,denied,media:(await fetch(media)).status,unsafeField:safe.some(r=>'machineExtractedText' in r||'commonMistakes' in r)};
      },{media});
      assert.deepEqual(offline,{count:1217,denied:true,media:200,unsafeField:false});
    }finally{await ctx.close()}
  });
}finally{
  await browser?.close();await new Promise(resolve=>server.close(resolve));
  const report={contract:'echs.public-question-browser.v1',cases:results.length,passed:results.filter(r=>r.status==='PASS').length,failed:results.filter(r=>r.status==='FAIL').length,results,pageErrors:errors,productionCalls:0,externalRequestsBlocked:true,privateQuestionBodiesInReport:false,scope:'Selected projected UI/auth modules with synthetic teacher transport and actual Chromium service worker; not production tenant acceptance.'};
  await fs.writeFile(path.join(output,'results.json'),JSON.stringify(report,null,2)+'\n');
  await fs.writeFile(path.join(output,'network-metadata.json'),JSON.stringify(networkEvents,null,2)+'\n');
  console.log(JSON.stringify({cases:report.cases,passed:report.passed,failed:report.failed,pageErrors:errors.length}));
  if(report.failed||errors.length)process.exitCode=1;
}
