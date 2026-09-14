import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url);
const arg=name=>{const i=process.argv.indexOf(name);return i<0?null:process.argv[i+1];};
const repo=path.resolve(arg('--repo')||'.'),overlayRoot=arg('--overlay-root')?path.resolve(arg('--overlay-root')):null;
assert.ok(arg('--report-dir'),'Supply a fresh --report-dir');const output=path.resolve(arg('--report-dir'));await mkdir(output,{recursive:false});
const sha=b=>createHash('sha256').update(b).digest('hex');
const pinsBytes=await readFile(new URL('./baseline-pins.json',import.meta.url)),pins=JSON.parse(pinsBytes);
const harnessBytes=await readFile(fileURLToPath(import.meta.url));
const manifestPath=arg('--source-manifest')?path.resolve(arg('--source-manifest')):null;
let manifestBytes=manifestPath?await readFile(manifestPath):null,manifest=manifestBytes?JSON.parse(manifestBytes):null;
if(manifest)assert.deepEqual(manifest.source_files.map(r=>r.path),pins.files.map(r=>r.active_path));
const overlay=new Map(),preservedShared=new Map();
for(const expected of pins.files){
  const source=path.join(overlayRoot||repo,expected.active_path),bytes=await readFile(source);
  if(manifest){const row=manifest.source_files.find(r=>r.path===expected.active_path);assert.equal(bytes.length,row.bytes);assert.equal(sha(bytes),row.sha256);}
  overlay.set(expected.active_path,{bytes,source,kind:overlayRoot?'candidate':'repository-source'});
  if(expected.active_path!==expected.path){const originalSource=path.join(repo,expected.path),originalBytes=await readFile(originalSource);assert.equal(originalBytes.length,expected.bytes);assert.equal(sha(originalBytes),expected.sha256);preservedShared.set(expected.path,{source:originalSource,bytes:originalBytes});}
}
if(!manifest){manifest={source_files:[...overlay.entries()].map(([path,row])=>({path,bytes:row.bytes.length,sha256:sha(row.bytes)}))};manifestBytes=Buffer.from(JSON.stringify(manifest));}
const requireMath=true;
const pages={log:'lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.5_logarithms_ECHS.html',systems:'lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.6_technology_equations_ECHS.html'};
assert.deepEqual(pins.html_routes.map(row=>row.path),Object.values(pages));
for(const relative of Object.values(pages)){
  const bytes=await readFile(path.join(repo,relative)),pin=pins.html_routes.find(row=>row.path===relative);let restored=bytes.toString('utf8');
  assert.equal(pin.replacements.length,3);for(const swap of pin.replacements){const from='src="'+swap.from+'"',to='src="'+swap.to+'"';assert.equal(restored.split(to).length,2);assert.equal(restored.includes(from),false);restored=restored.replace(to,()=>from);}
  const original=Buffer.from(restored,'utf8');assert.equal(original.length,pin.bytes);assert.equal(sha(original),pin.sha256);
  overlay.set(relative,{bytes,source:path.join(repo,relative),kind:'canonical-html-scoped-scripts'});
}
const served=new Map(),requests=[],errors=[],checks=[],screens=[],pageErrors=[],consoleErrors=[],mathProof=[];let browser,context;
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf'};
const server=createServer(async(req,res)=>{try{
  const relative=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname).replace(/^\//,'');
  if(relative==='favicon.ico'){res.writeHead(204);res.end();return;}
  assert.equal(req.method,'GET');assert.ok(!relative.includes('\\'));const full=path.resolve(repo,relative);assert.ok(full.startsWith(repo+path.sep));assert.ok(relative.startsWith('lessons/ib-math-ai/unit-1/'));
  if(!served.has(relative)){const row=overlay.get(relative)||{bytes:await readFile(full),source:full,kind:'unchanged-foundations'};served.set(relative,row);}
  const row=served.get(relative);requests.push({path:relative,status:200});res.writeHead(200,{'Content-Type':mime[path.extname(relative)]||'application/octet-stream','Cache-Control':'no-store'});res.end(row.bytes);
}catch(error){requests.push({path:'rejected-static-request',status:404});res.writeHead(404);res.end('Not found');}});
function bounded(p,ms,label){let t;return Promise.race([p,new Promise((_,reject)=>{t=setTimeout(()=>reject(Error(label)),ms);})]).finally(()=>clearTimeout(t));}
let base,version,coreProof,optionalProof,lineProof,sourceStable=false;
async function check(name,fn){await fn();checks.push({name,status:'PASS'});console.log('PASS '+name);}
const prefix='echs:ib-ai:u1:1.5:';
const stored=(page,key)=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)||'{}'),prefix+key);
const shot=async(page,name)=>{await page.screenshot({path:path.join(output,name),fullPage:true});screens.push(name);};
async function typedMath(locator,label){
  const proof=await locator.evaluate(root=>{const raw=[];const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;while(node=walker.nextNode()){if(!node.parentElement.closest('.katex,script,style,input,textarea')&&/\\[()[\]]/.test(node.nodeValue))raw.push(node.nodeValue);}return {katex:root.querySelectorAll('.katex').length,raw_delimiters:raw.length,errors:root.querySelectorAll('.katex-error').length};});
  assert.ok(proof.katex>0,label+' rendered KaTeX');assert.equal(proof.raw_delimiters,0,label+' raw delimiters');assert.equal(proof.errors,0,label+' parse errors');mathProof.push({label,...proof});
}
const route=async(page,value)=>{await page.evaluate(v=>{location.hash=v;},value);await page.waitForFunction(v=>document.querySelector(`.route-btn[data-route="${v}"]`)?.classList.contains('active'),value);};
try{
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',()=>{server.removeListener('error',reject);resolve();});});base=`http://127.0.0.1:${server.address().port}/`;
  const {chromium}=require(process.env.ECHS_PLAYWRIGHT_MODULE||'playwright');
  browser=await chromium.launch({headless:true,...(process.env.ECHS_CHROMIUM_PATH?{executablePath:process.env.ECHS_CHROMIUM_PATH}:{})});version=browser.version();
  context=await browser.newContext({viewport:{width:1365,height:900},reducedMotion:'reduce'});
  await context.route('**/*',r=>new URL(r.request().url()).origin===new URL(base).origin?r.continue():r.abort());
  const page=await context.newPage();page.on('pageerror',e=>pageErrors.push(String(e)));page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});page.on('dialog',d=>d.accept());
  await page.goto(base+pages.log+'?course=ib-math-ai&lessonKey=synthetic-1.5#quiz',{waitUntil:'load'});await page.locator('[data-quiz-scope="core"]').waitFor();
  await check('native default core has12 questions and zero initial score',async()=>{
    assert.equal(await page.locator('[data-quiz-index]').count(),12);assert.equal(await page.locator('[data-quiz-scope="core"]').getAttribute('aria-pressed'),'true');assert.match(await page.locator('.route-header').innerText(),/0 correct · 0 attempted/);
    assert.deepEqual(await stored(page,'quiz-results'),{});assert.equal(await page.evaluate(()=>window.LESSON_DATA.quiz.length),14);
  });
  await check('checking core Q02 records its exact ID; reveal creates no additional result',async()=>{
    await page.locator('input[name="quiz-choice"][value="0"]').check();await page.locator('#quiz-workspace').fill('Synthetic core reasoning: 12 minus 5 equals7.');await page.locator('#quiz-check').click();
    coreProof=await stored(page,'quiz-results');assert.equal(coreProof['ELV6-1.5-Q02'].correct,true);assert.deepEqual(Object.keys(coreProof),['ELV6-1.5-Q02']);
    await page.locator('#quiz-hint').click();await page.locator('#quiz-solution').click();assert.deepEqual(await stored(page,'quiz-results'),coreProof);
    await page.locator('[data-quiz-scope="core"]').click();assert.match(await page.locator('.route-header').innerText(),/1 correct · 1 attempted/);
  });
  await check('optional scope native keyboard action has independent score and original Q01/Q12 IDs',async()=>{
    await page.locator('[data-quiz-scope="extension"]').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('[data-quiz-index]').count(),2);assert.match(await page.locator('.route-header').innerText(),/0 correct · 0 attempted/);
    await page.locator('#quiz-response').fill('0.0625');await page.locator('#quiz-workspace').fill('Synthetic optional reasoning: fourth inverse square.');await page.locator('#quiz-check').click();
    await page.locator('#quiz-next').click();await page.locator('#quiz-response').fill('2.9');await page.locator('#quiz-check').click();await page.locator('[data-quiz-scope="extension"]').click();
    assert.match(await page.locator('.route-header').innerText(),/2 correct · 2 attempted/);optionalProof=await stored(page,'quiz-results');assert.deepEqual(Object.keys(optionalProof).sort(),['ELV6-1.5-Q01','ELV6-1.5-Q02','ELV6-1.5-Q12']);assert.ok(Object.values(optionalProof).every(x=>x.correct));await shot(page,'optional-desktop.png');
  });
  await check('review totals isolate core1/12 from optional2/2 and return/reload preserve scope and response IDs',async()=>{
    await route(page,'review');const cards=await page.locator('.stat-card').allTextContents();assert.match(cards.find(x=>x.includes('SL core quiz')),/1\/12/);assert.match(cards.find(x=>x.includes('Optional extension')),/2\/2/);await shot(page,'review-desktop.png');
    await route(page,'quiz');assert.equal(await page.locator('[data-quiz-scope="extension"]').getAttribute('aria-pressed'),'true');await page.reload({waitUntil:'load'});await page.locator('#quiz-response').waitFor();assert.equal(await page.locator('#quiz-response').inputValue(),'0.0625');assert.equal(await page.locator('#quiz-workspace').inputValue(),'Synthetic optional reasoning: fourth inverse square.');
    await page.locator('[data-quiz-scope="core"]').click();assert.equal(await page.locator('#quiz-workspace').inputValue(),'Synthetic core reasoning: 12 minus 5 equals7.');assert.equal(await page.locator('input[name="quiz-choice"][value="0"]').isChecked(),true);assert.match(await page.locator('.route-header').innerText(),/1 correct · 1 attempted/);
  });
  await check('restarting core preserves both optional results and responses',async()=>{
    await page.locator('#restart-quiz').click();const result=await stored(page,'quiz-results');assert.deepEqual(Object.keys(result).sort(),['ELV6-1.5-Q01','ELV6-1.5-Q12']);assert.match(await page.locator('.route-header').innerText(),/0 correct · 0 attempted/);await page.locator('[data-quiz-scope="extension"]').click();assert.equal(await page.locator('#quiz-response').inputValue(),'0.0625');assert.match(await page.locator('.route-header').innerText(),/2 correct · 2 attempted/);
  });
  await check('full native GDC layer retains precise optional labels',async()=>{
    await page.locator('.gdc-v7-launch').click();await page.locator('.gdc8-select').waitFor();
    const beforeGDC=await stored(page,'quiz-results');if(requireMath)await typedMath(page.locator('.gdc-v7-workspace'),'v7 owned workspace');
    for(const [value,label] of [['0','optional change-of-base derivation'],['1','optional AHL 1.9 manual method'],['3','Optional extension · AHL 1.9 logarithm laws']]){await page.locator('.gdc8-select').selectOption(value);assert.ok((await page.locator('.gdc8-body').innerText()).includes(label),label);if(requireMath)await typedMath(page.locator('.gdc8-body'),'v8 card '+value);await page.locator('.gdc8-tags').scrollIntoViewIfNeeded();await shot(page,`gdc-label-${value}-desktop.png`);}
    if(requireMath){await page.locator('.gdc8-reveal-output').click();assert.equal(await page.locator('.gdc8-output-value').evaluate(n=>n.hidden),false);await typedMath(page.locator('.gdc8-output-value'),'v8 revealed output');assert.deepEqual(await stored(page,'quiz-results'),beforeGDC);}
    await page.keyboard.press('Escape');
  });
  await check('mobile390 scope controls and review remain reachable without page overflow',async()=>{
    await page.setViewportSize({width:390,height:844});await page.reload({waitUntil:'load'});await page.locator('[data-quiz-scope="core"]').waitFor();
    for(const scope of ['core','extension']){await page.locator(`[data-quiz-scope="${scope}"]`).click();assert.equal(await page.locator(`[data-quiz-scope="${scope}"]`).getAttribute('aria-pressed'),'true');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false);await shot(page,scope+'-mobile.png');}
    await route(page,'review');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false);await shot(page,'review-mobile.png');
  });
  await page.goto(base+pages.systems+'?course=ib-math-ai&lessonKey=synthetic-1.6#learn',{waitUntil:'load'});
  await check('actual1.6 slide-map locates and mounts system classifier',async()=>{
    await page.locator('#open-map').click();await page.locator('.drawer-item').filter({hasText:'Interactive system classifier'}).click();await page.locator('[data-te-lab="system"][data-mounted="1"]').waitFor();
    await page.waitForFunction(()=>{const n=document.querySelector('#slide-drawer');return n.getAttribute('aria-hidden')==='true'&&n.getBoundingClientRect().left>=innerWidth;});
  });
  await check('native keyboard steep line m4,b5 has both correct mathematical endpoints and intersection',async()=>{
    const lab=page.locator('[data-te-lab="system"]');await lab.locator('[data-field="m1"]').focus();await page.keyboard.press('End');await lab.locator('[data-field="b1"]').focus();await page.keyboard.press('End');
    assert.equal(await lab.locator('[data-field="m1"]').inputValue(),'4');assert.equal(await lab.locator('[data-field="b1"]').inputValue(),'5');
    lineProof=await lab.evaluate(root=>{const a=root.querySelector('.line-one').getAttribute('d').match(/[-+]?\d+(?:\.\d+)?(?:e[-+]?\d+)?/gi).map(Number),p=root.querySelector('.intersection');return {path:root.querySelector('.line-one').getAttribute('d'),endpoints:[[(a[0]-42)/486*12-6,(294-a[1])/252*12-6],[(a[2]-42)/486*12-6,(294-a[3])/252*12-6]],intersection:[(Number(p.getAttribute('cx'))-42)/486*12-6,(294-Number(p.getAttribute('cy')))/252*12-6]};});
    const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);near(lineProof.endpoints[0][0],-2.75);near(lineProof.endpoints[0][1],-6);near(lineProof.endpoints[1][0],.25);near(lineProof.endpoints[1][1],6);for(const [x,y] of lineProof.endpoints)near(y,4*x+5);near(lineProof.intersection[0],-.4);near(lineProof.intersection[1],3.4);await lab.locator('.te-lab-display').scrollIntoViewIfNeeded();await shot(page,'line-m4-b5-mobile.png');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false);await page.setViewportSize({width:1365,height:900});await shot(page,'line-m4-b5-desktop.png');
  });
  await check('no native page or console errors and every candidate overlay served',async()=>{assert.deepEqual(pageErrors,[]);assert.deepEqual(consoleErrors,[]);assert.equal(requests.filter(r=>r.status!==200).length,0);for(const p of overlay.keys())assert.ok(served.has(p),p);});
}catch(error){errors.push(String(error.stack||error));process.exitCode=1;}
finally{
  const cleanup={context:false,browser:false,server:false};
  const attempt=async(name,fn)=>{try{await fn();return true;}catch(e){errors.push(name+': '+String(e.stack||e));process.exitCode=1;return false;}};
  cleanup.context=await attempt('context-close',async()=>{if(context)await bounded(context.close(),10000,'context-close-timeout');});
  cleanup.browser=await attempt('browser-close',async()=>{if(browser)await bounded(browser.close(),10000,'browser-close-timeout');});
  cleanup.server=await attempt('server-close',async()=>{if(!server.listening)return;const done=new Promise((r,j)=>server.close(e=>e?j(e):r()));server.closeAllConnections();await bounded(done,5000,'server-close-timeout');});
  await attempt('source-check',async()=>{assert.ok((await readFile(new URL('./baseline-pins.json',import.meta.url))).equals(pinsBytes));assert.ok((await readFile(fileURLToPath(import.meta.url))).equals(harnessBytes));if(manifestPath)assert.equal(sha(await readFile(manifestPath)),sha(manifestBytes));for(const row of [...overlay.values(),...served.values(),...preservedShared.values()])assert.equal(sha(await readFile(row.source)),sha(row.bytes));sourceStable=true;});
  const sourceFiles=[...served.entries()].map(([relative,row])=>({path:relative,kind:row.kind,bytes:row.bytes.length,sha256:sha(row.bytes)}));
  const report={contract:'echs.ib-next.native-peer.v1',status:errors.length?'FAIL':'PASS',browser:version??null,manifest:{bytes:manifestBytes.length,sha256:sha(manifestBytes)},harness:{sha256:sha(harnessBytes)},baselinePins:{sha256:sha(pinsBytes)},scope:`Actual canonical1.5/1.6 HTML with only three verified scoped script substitutions each and ${manifest.source_files.length} pinned source files selected from ${overlayRoot?'an isolated overlay':'the repository'} and unchanged local dependencies. Original legacy UI only: no access-guard injection or authentication scripts, no synthetic account/credentials, no backend; all off-origin browser requests blocked. Browser storage contains only synthetic local test answers.`,checks,mathProof,coreProof,optionalProof,lineProof,sourceFiles,preservedSharedFiles:[...preservedShared.entries()].map(([path,row])=>({path,bytes:row.bytes.length,sha256:sha(row.bytes)})),scopedHTMLInverseVerified:true,sourceStable,cleanup,pageErrors,consoleErrors,errors,screens};
  await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,checks:checks.length,errors,output}));
}
