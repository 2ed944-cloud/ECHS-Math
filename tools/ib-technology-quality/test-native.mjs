import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const arg=name=>{const i=process.argv.indexOf(name);return i<0?null:process.argv[i+1];};
assert.ok(arg('--repo')&&arg('--report-dir'),'Supply --repo and a fresh --report-dir');
const repo=path.resolve(arg('--repo')),overlay=arg('--overlay-root')?path.resolve(arg('--overlay-root')):repo,output=path.resolve(arg('--report-dir'));await mkdir(output,{recursive:false});
const relative='lessons/ib-math-ai/unit-1/data/lesson-1.6-technology-v6-interactions.js';
const html='lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.6_technology_equations_ECHS.html';
const sha=b=>createHash('sha256').update(b).digest('hex');
const harnessBytes=await readFile(fileURLToPath(import.meta.url)),baselineBytes=await readFile(new URL('./baseline-pins.json',import.meta.url)),baseline=JSON.parse(baselineBytes);
const saved=new Map(),served=new Map(),checks=[],errors=[],screens=[],pageErrors=[],consoleErrors=[],requests=[];
let browser,context,version=null,sourceStable=false,dataBefore,dataAfter,assessmentBefore,assessmentAfter,storageBefore,storageAfter,base;
const source=path.join(overlay,relative),sourceBytes=await readFile(source);
for(const row of baseline.native_context){const filename=path.join(repo,row.path),bytes=await readFile(filename);assert.equal(sha(bytes),row.sha256);saved.set(filename,bytes);}
saved.set(source,sourceBytes);saved.set(path.join(repo,html),await readFile(path.join(repo,html)));
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf'};
const server=createServer(async(req,res)=>{try{
  const p=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname).replace(/^\//,'');
  if(p==='favicon.ico'){res.writeHead(204);res.end();return;}
  assert.equal(req.method,'GET');assert.ok(!p.includes('\\'));assert.ok(p.startsWith('lessons/ib-math-ai/unit-1/'));
  const target=path.resolve(repo,p);assert.ok(target.startsWith(repo+path.sep));
  if(!served.has(p)){
    const file=p===relative?source:target,bytes=saved.get(file)||await readFile(file);saved.set(file,bytes);served.set(p,{file,bytes,kind:p===relative?'candidate-overlay':'unchanged-active'});
  }
  const row=served.get(p);requests.push({path:p,status:200});res.writeHead(200,{'Content-Type':mime[path.extname(p)]||'application/octet-stream','Cache-Control':'no-store'});res.end(row.bytes);
}catch{requests.push({path:'rejected-static-request',status:404});res.writeHead(404);res.end('Not found');}});
function bounded(p,ms,label){let t;return Promise.race([p,new Promise((_,reject)=>{t=setTimeout(()=>reject(Error(label)),ms);})]).finally(()=>clearTimeout(t));}
async function check(name,fn){await fn();checks.push({name,status:'PASS'});console.log('PASS '+name);}
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7*Math.max(1,Math.abs(b)),`${a} != ${b}`);
async function plotProof(lab,roots){
  const curve=await lab.locator('.poly-curve').getAttribute('d'),points=[...curve.matchAll(/[ML] ([^ ]+) ([^ ]+)/g)].map(m=>[Number(m[1]),Number(m[2])]);
  assert.equal(points.length,221);const p=x=>roots.reduce((y,r)=>y*(x-r),1),scale=(168-points[0][1])/p(-5);
  assert.ok(scale>0&&Number.isFinite(scale));
  for(const [x,y] of points){assert.ok(Number.isFinite(x)&&Number.isFinite(y)&&y>42&&y<294);near((168-y)/scale,p((x-42)/486*10-5));}
  assert.equal(await lab.locator('.root-points circle').count(),new Set(roots).size);
  return {roots,samples:points.length,first:points[0],last:points.at(-1),commonScale:scale};
}
const plotResults=[];
try{
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',()=>{server.removeListener('error',reject);resolve();});});base=`http://127.0.0.1:${server.address().port}/`;
  const {chromium}=require(process.env.ECHS_PLAYWRIGHT_MODULE||'playwright');browser=await chromium.launch({headless:true,...(process.env.ECHS_CHROMIUM_PATH?{executablePath:process.env.ECHS_CHROMIUM_PATH}:{})});version=browser.version();
  context=await browser.newContext({viewport:{width:1365,height:900},reducedMotion:'reduce'});
  await context.route('**/*',r=>new URL(r.request().url()).origin===new URL(base).origin?r.continue():r.abort());
  const page=await context.newPage();page.on('pageerror',e=>pageErrors.push(String(e)));page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});
  await page.goto(base+html+'?course=ib-math-ai&lessonKey=synthetic-technology#learn',{waitUntil:'load'});await page.locator('#open-map').waitFor();
  dataBefore=sha(await page.evaluate(()=>JSON.stringify(window.LESSON_DATA)));assessmentBefore=await page.evaluate(()=>({practice:window.LESSON_DATA.practice.map(x=>x.id),quiz:window.LESSON_DATA.quiz.map(x=>x.id),exam:window.LESSON_DATA.exam.map(x=>x.id)}));
  const assessmentStorage=()=>page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).filter(k=>/result|answer|response|score|mastery/i.test(k)).sort().map(k=>[k,localStorage.getItem(k)])));
  storageBefore=await assessmentStorage();
  await page.evaluate(()=>{window.__technologyTestEvents=[];for(const t of ['echs:learning-attempt','echs:learning-session','echs:lesson-completed','echs:learning-updated'])window.addEventListener(t,()=>window.__technologyTestEvents.push(t));});
  const go=async title=>{await page.locator('#open-map').click();await page.locator('.drawer-item').filter({hasText:title}).click();await page.waitForFunction(()=>{const n=document.querySelector('#slide-drawer');return n.getAttribute('aria-hidden')==='true'&&n.getBoundingClientRect().left>=innerWidth;});};
  const shot=async(name,lab)=>{await lab.scrollIntoViewIfNeeded();await page.screenshot({path:path.join(output,name)});screens.push(name);};
  await check('Native Triple preset retains221 true cubic samples and no false flat tail',async()=>{
    await go('Interactive polynomial-root explorer');const lab=page.locator('[data-te-lab="polynomial"][data-mounted="1"]');await lab.waitFor();await lab.locator('[data-ppreset="triple"]').click();plotResults.push(await plotProof(lab,[1,1,1]));await shot('triple-desktop.png',lab);
  });
  await check('Keyboard Home and End root controls preserve each sample and multiplicity',async()=>{
    const lab=page.locator('[data-te-lab="polynomial"]');for(const key of ['End','Home']){for(const range of await lab.locator('[data-root]').all()){await range.focus();await range.press(key);}plotResults.push(await plotProof(lab,key==='End'?[4,4,4]:[-4,-4,-4]));}
    await shot('extreme-desktop.png',lab);
  });
  await check('Blank native numeric fields show validation without inventing zero residuals',async()=>{
    await go('Residual laboratory · measure how well a candidate fits');const lab=page.locator('[data-te-lab="residual"][data-mounted="1"]');await lab.waitFor();for(const input of await lab.locator('input').all())await input.fill('');
    assert.equal(await lab.locator('.te-residual-output.invalid').count(),1);assert.equal(await lab.locator('.te-residual-output b').count(),0);assert.match(await lab.locator('.te-residual-output').innerText(),/Enter finite/);
  });
  await check('Real zero is accepted and native sanitization or overflow remains invalid',async()=>{
    const lab=page.locator('[data-te-lab="residual"]');for(const input of await lab.locator('input').all())await input.fill('0');assert.deepEqual(await lab.locator('.te-residual-output b').allTextContents(),['-4','-13','13']);
    await lab.locator('[data-residual="x"]').evaluate(n=>{n.value='NaN';n.dispatchEvent(new Event('input',{bubbles:true}));});assert.equal(await lab.locator('[data-residual="x"]').inputValue(),'');assert.equal(await lab.locator('.te-residual-output b').count(),0);
    for(const input of await lab.locator('input').all())await input.fill('1e308');assert.equal(await lab.locator('.te-residual-output.invalid').count(),1);assert.equal(await lab.locator('.te-residual-output b').count(),0);
  });
  await check('Original presets recover from invalid feedback through native keyboard activation',async()=>{
    const lab=page.locator('[data-te-lab="residual"]');for(const [preset,kind] of [['exact','exact'],['rounded','close'],['wrong','wrong']]){const button=lab.locator(`[data-rpreset="${preset}"]`);await button.focus();await button.press('Enter');assert.equal(await lab.locator(`.te-residual-output.${kind}`).count(),1);assert.equal(await lab.locator('.te-residual-output b').count(),3);}await shot('residual-desktop.png',lab);
  });
  await check('Mobile390 and navigation remount preserve usable graphs and validation',async()=>{
    await page.setViewportSize({width:390,height:844});await go('Interactive polynomial-root explorer');const poly=page.locator('[data-te-lab="polynomial"]');await poly.locator('[data-ppreset="triple"]').click();plotResults.push(await plotProof(poly,[1,1,1]));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false);await shot('triple-mobile.png',poly);
    await go('Residual laboratory · measure how well a candidate fits');const lab=page.locator('[data-te-lab="residual"]');await lab.locator('[data-residual="x"]').fill('');assert.equal(await lab.locator('.te-residual-output.invalid').count(),1);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false);await shot('residual-mobile.png',lab);
  });
  await check('LESSON_DATA question IDs and assessment state stay unchanged with no console errors',async()=>{
    dataAfter=sha(await page.evaluate(()=>JSON.stringify(window.LESSON_DATA)));assessmentAfter=await page.evaluate(()=>({practice:window.LESSON_DATA.practice.map(x=>x.id),quiz:window.LESSON_DATA.quiz.map(x=>x.id),exam:window.LESSON_DATA.exam.map(x=>x.id)}));storageAfter=await assessmentStorage();
    assert.equal(dataAfter,dataBefore);assert.deepEqual(assessmentAfter,assessmentBefore);assert.deepEqual(storageAfter,storageBefore);assert.deepEqual(await page.evaluate(()=>window.__technologyTestEvents),[]);assert.deepEqual(pageErrors,[]);assert.deepEqual(consoleErrors,[]);assert.equal(requests.filter(r=>r.status!==200).length,0);assert.ok(served.has(relative));
  });
}catch(error){errors.push(String(error.stack||error));process.exitCode=1;}
finally{
  const cleanup={context:false,browser:false,server:false};
  const attempt=async(name,fn)=>{try{await fn();return true;}catch(error){errors.push(`${name}: ${String(error.stack||error)}`);process.exitCode=1;return false;}};
  cleanup.context=await attempt('context-close',async()=>{if(context)await bounded(context.close(),10000,'context-close-timeout');});
  cleanup.browser=await attempt('browser-close',async()=>{if(browser)await bounded(browser.close(),10000,'browser-close-timeout');});
  cleanup.server=await attempt('server-close',async()=>{if(server.listening){const done=new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()));server.closeAllConnections();await bounded(done,5000,'server-close-timeout');}});
  await attempt('source-equality',async()=>{for(const [file,bytes] of saved)assert.ok((await readFile(file)).equals(bytes));assert.ok((await readFile(new URL('./baseline-pins.json',import.meta.url))).equals(baselineBytes));assert.ok((await readFile(fileURLToPath(import.meta.url))).equals(harnessBytes));sourceStable=true;});
  const report={schema:'echs.ib-technology.native.v1',status:errors.length?'FAIL':'PASS',browser:version,scope:'Actual unchanged canonical1.6 HTML and existing scripts with one measured interaction source; canonical entry and three scoped engine/GDC dependencies match their recorded PR384 context. Legacy lesson UI only; no access-guard/authentication scripts or real account; off-origin requests blocked; no backend. Navigation state may change, assessment state must not.',checks,plotResults,lessonDataHashes:{before:dataBefore,after:dataAfter},assessmentCounts:assessmentBefore?Object.fromEntries(Object.entries(assessmentBefore).map(([k,v])=>[k,v.length])):null,assessmentStateUnchanged:storageBefore!==undefined&&JSON.stringify(storageBefore)===JSON.stringify(storageAfter),harness_sha256:sha(harnessBytes),baseline_sha256:sha(baselineBytes),source_sha256:sha(sourceBytes),sourceStable,sourceFiles:[...served].map(([path,row])=>({path,kind:row.kind,bytes:row.bytes.length,sha256:sha(row.bytes)})),cleanup,pageErrors,consoleErrors,errors,screens};
  await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,checks:checks.length,errors,output}));
}
