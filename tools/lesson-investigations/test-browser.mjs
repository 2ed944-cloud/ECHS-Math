import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile,mkdtemp,rm,readdir,stat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {INVESTIGATION_HOSTS} from '../../lessons/shared/investigations/host-manifest.mjs';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.ECHS_PLAYWRIGHT_MODULE||'playwright');
const overlayRoot=path.resolve(fileURLToPath(new URL('../../',import.meta.url)));
const root=process.env.ECHS_INVESTIGATION_BASE_ROOT?path.resolve(process.env.ECHS_INVESTIGATION_BASE_ROOT):overlayRoot;
const tempRoot=process.env.ECHS_INVESTIGATION_TEMP_ROOT?path.resolve(process.env.ECHS_INVESTIGATION_TEMP_ROOT):tmpdir();
const expectedScenes={'ap-rates':5,arithmetic:6,geometric:6,finance:7,'ap-polynomial-rates':4,'ap-polynomial-zeros':4,'ap-polynomial-tails':4,'ap-rational-tails':4,'ap-rational-zeros':4,'ap-rational-poles':4,'ap-rational-holes':4,'ap-equivalent-forms':5};
const sourceFiles=new Map(),servedSources=new Map(),contexts=new Set(),sockets=new Set();
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
async function sourceFile(relative){
  const candidate=path.resolve(overlayRoot,relative);assert.ok(candidate.startsWith(overlayRoot+path.sep));
  try{if((await stat(candidate)).isFile())return candidate;}catch(error){if(error.code!=='ENOENT')throw error;}
  const original=path.resolve(root,relative);assert.ok(original.startsWith(root+path.sep));return original;
}
async function sourceRead(relative){const file=await sourceFile(relative),bytes=await readFile(file);return {file,bytes};}
const output=process.env.ECHS_INVESTIGATION_REPORT_DIR?path.resolve(process.env.ECHS_INVESTIGATION_REPORT_DIR):path.join(root,'.baseline-results/investigations-browser');
await mkdir(path.dirname(output),{recursive:true});await mkdir(output,{recursive:false});
let fixture,fixturePreparation,sourceHashesBefore=[],stagedHTMLHashes=[],preservation,guardedSourceHashes=[];
async function sourceSnapshot(){
  preservation=JSON.parse((await sourceRead('tools/lesson-investigations/source-preservation.json')).bytes);
  const names=[...new Set([...(await readdir(path.join(root,'lessons/shared/investigations'))),...(await readdir(path.join(overlayRoot,'lessons/shared/investigations')))])];
  const paths=[...new Set([...names.filter(p=>/\.(mjs|css)$/.test(p)).map(p=>'lessons/shared/investigations/'+p),...preservation.lesson_sources.map(row=>row.path),...preservation.protected_calculus_sources.map(row=>row.path),'docs/codex/AP_CALCULUS_U2_U5_SOURCE_BASELINE.json','tools/inject_learning_access_guard.py','tools/inject_lesson_investigations.py','tools/lesson-investigations/source-preservation.json','tools/lesson-investigations/test-browser.mjs'])].sort();
  return Promise.all(paths.map(async p=>{const {file,bytes}=await sourceRead(p);if(!sourceFiles.has(p))sourceFiles.set(p,{file,bytes});return {path:p,origin:file===path.resolve(overlayRoot,p)?'overlay':'base',bytes:bytes.length,sha256:digest(bytes)};}));
}
async function stagedSnapshot(){
    return Promise.all(INVESTIGATION_HOSTS.map(async s=>{const bytes=await readFile(path.join(fixture,'stage',s.path));return {path:s.path,bytes:bytes.length,sha256:digest(bytes)};}));
}
function bounded(promise,milliseconds,label){
  let timer;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(label)),milliseconds);})]).finally(()=>clearTimeout(timer));
}
// Run the two production transforms; authority is supplied separately by the
// explicitly synthetic browser fixture below, never by a production account.
function prepareFixture(){return JSON.parse(execFileSync(process.env.ECHS_PYTHON||'python',['-c',`
import pathlib,sys
source=pathlib.Path(sys.argv[1]); stage=pathlib.Path(sys.argv[2]); modules=pathlib.Path(sys.argv[3])
sys.path.insert(0,str(modules/'tools'))
import inject_learning_access_guard as guard
import inject_lesson_investigations as investigations
import json
for relative in investigations.ROUTES:
    target=stage/relative
    target.parent.mkdir(parents=True,exist_ok=True)
    target.write_bytes((source/relative).read_bytes())
    assert guard.inject_lesson(stage,target)
print(json.dumps(investigations.run(stage,source)))
`,path.join(fixture,'input'),path.join(fixture,'stage'),overlayRoot],{encoding:'utf8',timeout:60000}));}
const authorityStubs=new Set(['js/institution-client.js','js/portal-access.js','js/lesson-access-guard.js','js/ib-lesson-platform-integration.js']);
const errors=[],results=[],screens=[];let browser,animation;
const mime={'.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
  try{
    const rel=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname).replace(/^\//,'');
    const filename=path.resolve(root,rel);
    if(!filename.startsWith(root+path.sep))throw Error('outside root');
    const spec=INVESTIGATION_HOSTS.find(s=>s.path===rel);
    if(authorityStubs.has(rel)){res.writeHead(200,{'Content-Type':'text/javascript','Cache-Control':'no-store'});res.end('// Synthetic authority is installed by the test bootstrap.');return;}
    let bytes;
    if(spec)bytes=await readFile(path.join(fixture,'stage',rel));
    else if(sourceFiles.has(rel))bytes=sourceFiles.get(rel).bytes;
    else{const source=await sourceRead(rel);bytes=source.bytes;if(!servedSources.has(rel))servedSources.set(rel,{file:source.file,bytes});}
    if(spec){
      const bootstrap=`<script>
      (()=>{let epoch=1; const listeners=new Set(); const owner=()=>({kind:'account',organization_id:'synthetic-org',account_id:'synthetic-teacher',role:'teacher',status:'active',expires_at:Date.now()+3600000,epoch,session_id:'synthetic-session'});const expiry=Date.now()+3600000;const capture=()=>({...owner(),expires_at:expiry});
      window.ECHSInstitution={account:()=>({id:'synthetic-teacher',role:'teacher'}),token:()=> 'synthetic-only',ownerAuthority:{capture,verify:s=>s.epoch===epoch,subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn);}}};
      const access={authenticated:true,role:'teacher',current:{id:'synthetic-teacher'}};window.ECHSPortalAccess={ready:Promise.resolve(access),courseAllowed:()=>true};
      document.documentElement.dataset.lessonGate='allowed';document.documentElement.dataset.echsLessonCourse=${JSON.stringify(spec.course)};
      window.__investigationTest={events:[],revoke(){epoch++;for(const fn of listeners)fn(capture());}};
      for(const type of ['echs:learning-attempt','echs:learning-session','echs:learning-updated','echs:lesson-completed'])window.addEventListener(type,()=>window.__investigationTest.events.push(type));})();</script>`;
      bytes=Buffer.from(bytes.toString('utf8').replace(/<head>/i,`<head>${bootstrap}`));
    }
    res.writeHead(200,{'Content-Type':mime[path.extname(filename)]||'application/octet-stream','Cache-Control':'no-store'});res.end(bytes);
  }catch{res.writeHead(404);res.end('Not found');}
});
server.on('connection',socket=>{sockets.add(socket);socket.once('close',()=>sockets.delete(socket));});
let base;
const storage=page=>page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)]))));
const checkRangeReadouts=async(page,label)=>{
  const pairs=await page.locator('.ei-main .ei-control input[type=range]').evaluateAll(nodes=>nodes.map(n=>({id:n.id,value:Number(n.value),readout:Number(n.parentElement.querySelector('output')?.textContent.replaceAll(',',''))})));
  for(const row of pairs)assert.equal(row.readout,row.value,`${label}: native slider and readout disagree for ${row.id}`);
};
const lessonDataHash=async page=>digest(Buffer.from(await page.evaluate(()=>JSON.stringify(window.LESSON_DATA??null))));
async function rangeTo(page,selector,value){const input=page.locator(selector);await input.focus();await input.press('Home');const {min,step}=await input.evaluate(node=>({min:Number(node.min),step:Number(node.step)}));const count=(value-min)/step;assert.ok(Number.isInteger(count)&&count>=0);for(let i=0;i<count;i++)await input.press('ArrowRight');assert.equal(Number(await input.inputValue()),value);}
async function verifyNewModel(page){
  if(await page.locator('.ei-rational-view').count()){
    const section=page.locator('.ei-rational-view'),scale=section.locator('[data-rational-control="scale"]');
    if(await scale.count()){
      await rangeTo(page,'[data-rational-control="scale"]',0);
      assert.equal(await section.locator('[data-rational-pole]').count(),0);assert.ok(await section.locator('[data-rational-hole]').count()>0);
      assert.match(await section.innerText(),/zero polynomial has no degree/);
      const exclusions=await section.locator('[data-rational-table="exclusions"] tbody tr').evaluateAll(rows=>rows.map(row=>[...row.children].map(cell=>cell.textContent)));
      assert.ok(exclusions.every(row=>row[1]==='hole'&&row[2]==='undefined'&&row[3]==='0'&&row[4]==='0'));
      await section.getByRole('button',{name:'Reset explorer',exact:true}).click();
    }
    assert.equal(await section.locator('[data-rational-error]').isVisible(),false);
  }
  if(await page.locator('.ei-equivalence-view').count()){
    const section=page.locator('.ei-equivalence-view');
    if(await section.locator('[data-equivalence-control="r"]').count()){
      await rangeTo(page,'[data-equivalence-control="r"]',0);assert.equal(await section.locator('[data-equivalence-pole]').count(),0);assert.equal(await section.locator('[data-equivalence-hole]').count(),1);
      const hole=await section.locator('[data-equivalence-table="exclusion"] tbody tr').innerText();assert.match(hole,/hole\s+undefined/);
      await rangeTo(page,'[data-equivalence-control="a"]',0);await rangeTo(page,'[data-equivalence-control="b"]',0);
      assert.match(await section.locator('[data-equivalence-degrees]').innerText(),/Numerator degree: undefined \(zero polynomial\).*Quotient degree: undefined \(zero polynomial\)/);
    }else{
      await rangeTo(page,'[data-equivalence-control="a"]',.25);await rangeTo(page,'[data-equivalence-control="b"]',.25);await rangeTo(page,'[data-equivalence-control="n"]',8);
      assert.equal(await section.locator('[data-equivalence-table="terms"] tbody tr').count(),9);
      assert.equal(await section.locator('[data-equivalence-table="terms"] tbody tr').first().locator('td').last().innerText(),'0.0000152587890625');
      await rangeTo(page,'[data-equivalence-control="a"]',0);await rangeTo(page,'[data-equivalence-control="b"]',0);assert.match(await section.locator('[data-equivalence-degree]').innerText(),/undefined \(zero polynomial\)/);
    }
    await section.getByRole('button',{name:'Reset explorer',exact:true}).click();assert.equal(await section.locator('[data-equivalence-error]').isVisible(),false);
  }
}
try{
  sourceHashesBefore=await sourceSnapshot();
  assert.equal(INVESTIGATION_HOSTS.length,12);assert.deepEqual(INVESTIGATION_HOSTS.map(row=>row.key),Object.keys(expectedScenes));
  const rows=[...preservation.lesson_sources,...preservation.protected_calculus_sources];assert.equal(rows.length,81);
  for(const row of rows){const original=sourceFiles.get(row.path).bytes;assert.equal(original.length,row.bytes);assert.equal(digest(original),row.sha256);}
  guardedSourceHashes=rows.map(({path,bytes,sha256})=>({path,bytes,sha256}));
  if(root!==overlayRoot){const prior=JSON.parse(await readFile(path.join(root,'tools/lesson-investigations/source-preservation.json')));assert.deepEqual(preservation.lesson_sources.slice(0,7),prior.lesson_sources);assert.deepEqual(preservation.protected_calculus_sources,prior.protected_calculus_sources);
    for(const name of ['ap-rates-content.mjs','ap-polynomial-content.mjs','ib-content.mjs','host.mjs'])assert.ok(sourceFiles.get('lessons/shared/investigations/'+name).bytes.equals(await readFile(path.join(root,'lessons/shared/investigations',name))));}
  await mkdir(tempRoot,{recursive:true});fixture=await mkdtemp(path.join(tempRoot,'ei-native-'));
  for(const row of rows){const target=path.join(fixture,'input',row.path);await mkdir(path.dirname(target),{recursive:true});await writeFile(target,sourceFiles.get(row.path).bytes);}
  fixturePreparation=prepareFixture();assert.equal(fixturePreparation.routes,12);assert.equal(fixturePreparation.source_pins,81);assert.equal(fixturePreparation.changed,12);
  stagedHTMLHashes=await stagedSnapshot();
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',()=>{server.removeListener('error',reject);resolve();});});
  base=`http://127.0.0.1:${server.address().port}/`;
  browser=await chromium.launch({headless:true,timeout:20000,args:['--no-proxy-server'],...(process.env.ECHS_CHROMIUM_PATH?{executablePath:process.env.ECHS_CHROMIUM_PATH}:{})});
  for(const spec of INVESTIGATION_HOSTS){
    console.log(`Checking ${spec.key} in the native browser`);
    const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce',serviceWorkers:'block'});contexts.add(context);
    await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(base).origin?route.continue():route.abort());
    const page=await context.newPage();const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
    await page.goto(new URL(spec.path+`?course=${spec.course}&lessonKey=synthetic&accessKey=synthetic#slide=2`,base).href,{waitUntil:'load'});
    const launch=page.getByRole('button',{name:'Explore this idea',exact:true});await launch.waitFor();
    // Arithmetic/finance core schedules its existing initial-slide save at 300 ms.
    // Establish the baseline after that source-owned write, before any lab action.
    await page.waitForTimeout(400);
    const originalURL=page.url(),sections=await page.locator('.slide').count(),beforeStorage=await storage(page);
    const legacyState=await page.evaluate(()=>Array.from(document.querySelectorAll('.slide')).map(n=>[n.id,n.className,n.hidden,n.getAttribute('aria-hidden')]));
    const beforeLessonData=await lessonDataHash(page);
    const beforeEvents=await page.evaluate(()=>window.__investigationTest.events.length);
    await launch.click();await page.locator('.ei-shell').waitFor();assert.equal(await page.locator('dialog').evaluate(n=>n.open),true);
    assert.ok(await page.locator('dialog').evaluate(n=>n.contains(document.activeElement)),'Focus moves into the investigation');
    const activityButtons=page.locator('.ei-nav button'),count=await activityButtons.count();
    assert.equal(count,expectedScenes[spec.key]);
    const firstShot=`${spec.key}-desktop.png`;await page.screenshot({path:path.join(output,firstShot)});screens.push(firstShot);
    let rangeChanges=0;
    for(let i=0;i<count;i++){
      await activityButtons.nth(i).click();assert.equal(await page.locator('.ei-nav button[aria-current="step"]').count(),1);
      assert.ok(await page.locator('.ei-main h2').innerText());
      assert.equal(await page.locator('.ei-main').evaluate(n=>n.scrollWidth>n.clientWidth+2),false,`${spec.key}/${i} desktop overflow`);
      const ranges=page.locator('.ei-main input[type=range]');
      await checkRangeReadouts(page,`${spec.key}/${i} initial`);
      for(let r=0;r<await ranges.count();r++){
        const control=ranges.nth(r);await control.focus();await control.press('Home');await control.press('End');rangeChanges+=2;
        assert.equal(await page.locator('.ei-main').getByText('These inputs do not define a valid model.',{exact:false}).count(),0);
      }
      const resets=page.getByRole('button',{name:/Reset model|Reset finance|Reset explorer/});if(await resets.count())await resets.first().click();
      await checkRangeReadouts(page,`${spec.key}/${i} reset`);
      await verifyNewModel(page);
      await page.evaluate(()=>{const section=document.querySelector('.ei-rational-view,.ei-equivalence-view'),input=section?.querySelector('input');window.__detachedInvestigationProbe=section&&input?{section,input,html:section.innerHTML}:null;});
      await activityButtons.nth(i).click();
      assert.equal(await page.evaluate(()=>{const value=window.__detachedInvestigationProbe;delete window.__detachedInvestigationProbe;if(!value)return true;value.input.value=value.input.max;value.input.dispatchEvent(new Event('input',{bubbles:true}));return !value.section.isConnected&&value.section.innerHTML===value.html;}),true,'Previous model was disposed, including detached control listeners');
      const shot=`${spec.key}-activity-${i+1}-desktop.png`;await page.screenshot({path:path.join(output,shot)});screens.push(shot);
    }
    assert.equal(await page.locator('.slide').count(),sections);assert.equal(page.url(),originalURL,'Deep link unchanged');
    assert.deepEqual(await page.evaluate(()=>Array.from(document.querySelectorAll('.slide')).map(n=>[n.id,n.className,n.hidden,n.getAttribute('aria-hidden')])),legacyState,'Underlying deck state unchanged');
    assert.equal(await lessonDataHash(page),beforeLessonData,'All original LESSON_DATA remains exact');
    assert.equal(await page.evaluate(()=>window.__investigationTest.events.length),beforeEvents,'No mastery/attempt event');
    assert.equal(await storage(page),beforeStorage,'No new learner persistence');
    await page.setViewportSize({width:390,height:844});
    for(let i=0;i<count;i++){
      await activityButtons.nth(i).click();
      for(const region of await page.locator('.ei-main .ei-graph-scroll').all()){
        assert.ok(await region.getAttribute('aria-label'),'Scrollable graph has a name');
        assert.equal(await region.getAttribute('tabindex'),'0','Graph can receive keyboard focus');
        assert.ok(await region.locator('svg').evaluate(n=>n.getBoundingClientRect().width>=599),'Graph labels retain their native readable scale');
        await region.focus();await region.press('End');await region.press('Home');
      }
      const shot=`${spec.key}-activity-${i+1}-mobile.png`;await page.screenshot({path:path.join(output,shot)});screens.push(shot);
      const overflow=await page.locator('.ei-main').evaluate(n=>{const edge=n.getBoundingClientRect().right;return {width:n.clientWidth,scroll:n.scrollWidth,nodes:[...n.querySelectorAll('*')].filter(e=>e.getBoundingClientRect().right>edge+2&&!e.closest('.ei-table-scroll')).slice(0,12).map(e=>({tag:e.tagName,cls:e.getAttribute('class'),right:e.getBoundingClientRect().right,width:e.getBoundingClientRect().width}))};});
      assert.equal(overflow.scroll>overflow.width+2,false,`${spec.key}/${i} mobile overflow ${JSON.stringify(overflow)}`);
      assert.equal(await page.locator('dialog').evaluate(n=>n.scrollWidth>n.clientWidth+2),false,'Modal fits phone');
    }
    await activityButtons.nth(spec.key==='ap-rates'?3:0).click();const mobile=`${spec.key}-mobile.png`;await page.screenshot({path:path.join(output,mobile)});screens.push(mobile);
    await page.getByRole('button',{name:'Return to lesson',exact:true}).click();assert.equal(await page.locator('dialog').evaluate(n=>n.open),false);
    assert.equal(page.url(),originalURL);assert.equal(await storage(page),beforeStorage);assert.equal(await lessonDataHash(page),beforeLessonData);assert.equal(await page.evaluate(()=>window.__investigationTest.events.length),beforeEvents);
    assert.equal(await launch.evaluate(n=>n===document.activeElement),true,'Return focus');
    await launch.click();await page.locator('.ei-shell').waitFor();await page.keyboard.press('Escape');assert.equal(await page.locator('dialog').evaluate(n=>n.open),false);
    await launch.click();await page.locator('.ei-shell').waitFor();await page.evaluate(()=>window.__investigationTest.revoke());await page.locator('.ei-host').waitFor({state:'detached'});assert.equal(await page.locator('.ei-shell').count(),0);
    // Report all script errors; independent legacy errors are not silently swallowed.
    assert.deepEqual(pageErrors,[],`${spec.key} browser errors`);
    results.push({key:spec.key,activities:count,rangeChanges,desktop:true,mobile:true,legacyStatePreserved:true,lessonDataHash:beforeLessonData,URLPreserved:true,noPersistence:true,noEvidenceEvents:true,modelDisposal:true,ownerRevocation:true});
    console.log(`PASS ${spec.key}: ${count} activities, ${rangeChanges} range changes, mobile and owner lifecycle`);await bounded(context.close(),10000,'context-close-timeout');contexts.delete(context);
  }
  assert.equal(results.reduce((sum,row)=>sum+row.activities,0),57);assert.equal(results.slice(0,7).reduce((sum,row)=>sum+row.activities,0),36);
  const motionContext=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'no-preference'});
  contexts.add(motionContext);
  await motionContext.route('**/*',route=>new URL(route.request().url()).origin===new URL(base).origin?route.continue():route.abort());
  const motionPage=await motionContext.newPage(),motionErrors=[];motionPage.on('pageerror',e=>motionErrors.push(String(e)));
  await motionPage.goto(new URL(INVESTIGATION_HOSTS[0].path,base).href,{waitUntil:'load'});
  await motionPage.getByRole('button',{name:'Explore this idea',exact:true}).click();
  await motionPage.locator('.ei-nav button').nth(1).click();
  const car=motionPage.locator('.ei-car-view');
  await car.getByRole('button',{name:'Play',exact:true}).click();
  await motionPage.waitForFunction(()=>Number(document.querySelector('[data-car-time]')?.value)>.3);
  await car.getByRole('button',{name:'Pause',exact:true}).click();
  const paused=await car.locator('[data-car-time]').inputValue();
  const position=Number(await car.locator('[data-car-position]').getAttribute('data-position'));
  assert.ok(Math.abs(position-2*Number(paused))<=.051,'Native animated position agrees with p(t)=2t and the rounded time slider');
  await motionPage.waitForTimeout(150);assert.equal(await car.locator('[data-car-time]').inputValue(),paused,'Paused time stays fixed');
  await car.getByRole('button',{name:'Reset',exact:true}).click();assert.equal(await car.locator('[data-car-time]').inputValue(),'0');
  await car.getByRole('button',{name:'Play',exact:true}).click();
  await motionPage.emulateMedia({reducedMotion:'reduce'});
  await car.getByRole('button',{name:'Play',exact:true}).waitFor();
  assert.equal(await car.getByRole('button',{name:'Play',exact:true}).isDisabled(),true,'Preference change pauses and disables animation');
  await car.locator('[data-car-time]').focus();await car.locator('[data-car-time]').press('End');
  assert.equal(await car.locator('[data-car-time]').inputValue(),'8','Reduced-motion manual control remains usable');
  await motionPage.screenshot({path:path.join(output,'ap-car-native-playback.png')});screens.push('ap-car-native-playback.png');
  await motionPage.getByRole('button',{name:'Return to lesson',exact:true}).click();
  assert.equal(await motionPage.locator('.ei-car-view').count(),0);assert.deepEqual(motionErrors,[]);
  animation={played:true,positionAgreed:true,paused:true,reset:true,dynamicReducedMotion:true,manualScrub:true,disposed:true};
  await bounded(motionContext.close(),10000,'motion-context-close-timeout');contexts.delete(motionContext);console.log('PASS native car animation and dynamic reduced motion');
}catch(e){errors.push(String(e.stack||e));process.exitCode=1;}
finally{
  let version=null,sourceHashes=[],sourceStable=false,stagedStable=false;
  const cleanup={contexts:false,browser:false,server:false,sockets:false,fixture:false};
  const attempt=async(name,fn)=>{try{await fn();return true;}catch(e){errors.push(`${name}: ${String(e.stack||e)}`);process.exitCode=1;return false;}};
  await attempt('browser-version',async()=>{version=browser?browser.version():null;});
  for(const context of [...contexts])if(await attempt('context-cleanup',async()=>{await bounded(context.close(),10000,'context-close-timeout');}))contexts.delete(context);
  cleanup.contexts=contexts.size===0;
  cleanup.browser=await attempt('browser-cleanup',async()=>{if(browser)await bounded(browser.close(),10000,'browser-close-timeout');});
  cleanup.server=await attempt('server-cleanup',async()=>{
    if(!server.listening)return;
    const socketCloses=[...sockets].map(socket=>new Promise(resolve=>socket.once('close',resolve))),closed=new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
    server.closeAllConnections();for(const socket of sockets)socket.destroy();await bounded(Promise.all([closed,...socketCloses]),5000,'server-close-timeout');
  });
  cleanup.sockets=sockets.size===0;
  await attempt('source-verification',async()=>{sourceHashes=await sourceSnapshot();assert.ok(sourceHashesBefore.length>0,'Initial source snapshot must exist');assert.deepEqual(sourceHashes,sourceHashesBefore,'Source bytes changed during browser execution');sourceStable=true;});
  await attempt('staged-verification',async()=>{assert.equal(stagedHTMLHashes.length,INVESTIGATION_HOSTS.length,'All staged HTML files must have been prepared');assert.deepEqual(await stagedSnapshot(),stagedHTMLHashes,'Staged HTML changed during browser execution');stagedStable=true;});
  await attempt('input-and-served-verification',async()=>{for(const row of guardedSourceHashes){const bytes=await readFile(path.join(fixture,'input',row.path));assert.equal(bytes.length,row.bytes);assert.equal(digest(bytes),row.sha256);}for(const {file,bytes}of servedSources.values())assert.ok((await readFile(file)).equals(bytes),'Served legacy dependency changed during execution');});
  cleanup.fixture=await attempt('fixture-cleanup',async()=>{
    if(!fixture)return;
    assert.equal(path.dirname(path.resolve(fixture)),path.resolve(tempRoot));assert.ok(path.basename(fixture).startsWith('ei-native-'));
    await rm(fixture,{recursive:true,force:true});
  });
  if(!Object.values(cleanup).every(Boolean)){errors.push('One or more owned cleanup boundaries did not close.');process.exitCode=1;}
  await writeFile(path.join(output,'browser-report.json'),JSON.stringify({schema:'echs.investigation-browser.v2',browser:version,scope:'Real headless browser against twelve routes staged with actual access-guard and investigation build transforms over exact candidate/base composition. Four authority scripts are explicitly stubbed for synthetic portal/owner state; no production authentication/backend claim. Source equality covers listed source files and 81 guarded inputs; additional legacy dependencies are captured on first serve and checked after execution. Staged hashes precede the separately declared synthetic bootstrap.',fixturePreparation:fixturePreparation??null,authorityStubs:[...authorityStubs],sourceHashesBefore,sourceHashes,sourceStable,guardedSourceHashes,stagedHTMLHashes,stagedStable,servedSources:[...servedSources].map(([path,{bytes}])=>({path,bytes:bytes.length,sha256:digest(bytes)})),cleanup,results,animation,screens,errors},null,2));
  console.log(JSON.stringify({passed:results.length,errors,screenshots:screens.length,output}));
}
