import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const arg=key=>{const i=process.argv.indexOf(key);return i<0?null:process.argv[i+1];};
assert.ok(arg('--repo')&&arg('--report-dir'),'Supply --repo and a fresh --report-dir.');
const repo=path.resolve(arg('--repo')),out=path.resolve(arg('--report-dir'));
await mkdir(out,{recursive:false});
const sha=bytes=>createHash('sha256').update(bytes).digest('hex'),prefix='lessons/shared/investigations/';
const bounded=(promise,ms,label)=>{let timer;return Promise.race([promise,new Promise((_,reject)=>timer=setTimeout(()=>reject(Error(label)),ms))]).finally(()=>clearTimeout(timer));};
const report={schema:'echs.ap-modeling.native-views.v1',status:'RUNNING',scope:'Actual isolated modeling modules and retained CSS over owned loopback HTTP, with native Chrome DOM/SVG/keyboard/layout. Three original discover scenes. No lesson host, account, backend, mastery, publication, fitted-regression or interactive3D claim.',checks:[],screenshots:[],requests:[],page_errors:[],console_errors:[],blocked_off_origin:0,source_before:[],source_after:[],cleanup:{contexts:false,browser:false,server:false,sockets:false},cleanup_errors:[]};
const pins=new Map(),sources=new Map(),contexts=new Set(),sockets=new Set();let browser,server,origin,stage='prepare',failure;
const check=(name,data={})=>{report.checks.push({name,pass:true,...data});console.log('PASS '+name);};
const frame=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
async function capture(page,name) {const filename=name+'.png';await page.screenshot({path:path.join(out,filename)});const raw=await readFile(path.join(out,filename));report.screenshots.push({name:filename,bytes:raw.length,sha256:sha(raw)});}
async function changeRange(page,key,value) {
  const input=page.locator(`[data-modeling-control="${key}"]`),limits=await input.evaluate(n=>({min:Number(n.min),max:Number(n.max),step:Number(n.step)}));
  assert.ok(value>=limits.min&&value<=limits.max&&Number.isInteger((value-limits.min)/limits.step));await input.focus();await input.press('Home');
  for(let i=0;i<(value-limits.min)/limits.step;i++)await input.press('ArrowRight');assert.equal(Number(await input.inputValue()),value);await frame(page);
  assert.equal(await page.locator('[data-modeling-error]').isVisible(),false);
}
async function changeSelect(page,key,value) {
  const select=page.locator(`[data-modeling-control="${key}"]`);await select.focus();await select.press(value===0?'Home':'End');await select.press('Enter');assert.equal(Number(await select.inputValue()),value);await frame(page);
}
async function reset(page) {const button=page.getByRole('button',{name:'Reset explorer',exact:true});await button.focus();await button.press('Enter');await frame(page);}
async function choose(page,family) {await page.locator('#family').selectOption(family);await page.waitForFunction(f=>document.querySelector('.ei-modeling-view')?.dataset.modelingFamily===f,family);await frame(page);}
async function invariant(page,family) {
  const value=await page.locator('.ei-modeling-view').evaluate(section=>({family:section.dataset.modelingFamily,width:innerWidth,documentWidth:document.documentElement.scrollWidth,mainWidth:document.querySelector('main').clientWidth,mainScroll:document.querySelector('main').scrollWidth,headerWidth:document.querySelector('header').clientWidth,headerScroll:document.querySelector('header').scrollWidth,mainLeft:document.querySelector('main').getBoundingClientRect().left,
    controls:[...section.querySelectorAll('[data-modeling-control]')].map(input=>({key:input.dataset.modelingControl,value:Number(input.value),output:Number(section.querySelector(`output[for="${input.id}"]`).textContent),label:document.getElementById(input.getAttribute('aria-labelledby'))?.textContent})),
    plots:[...section.querySelectorAll('svg')].map(svg=>({key:svg.dataset.modelingPlot??svg.dataset.modelingDiagram,width:svg.getBoundingClientRect().width,title:svg.querySelector('title')?.textContent,bad:/NaN|Infinity/.test(svg.outerHTML),region:svg.parentElement.getAttribute('role'),regionLabel:svg.parentElement.getAttribute('aria-label'),tabIndex:svg.parentElement.tabIndex})),
    tables:[...section.querySelectorAll('[data-modeling-table]')].map(w=>({caption:w.querySelector('caption')?.textContent,focusable:w.tabIndex===0,headScopes:[...w.querySelectorAll('thead th')].map(th=>th.getAttribute('scope'))})),
    status:section.querySelector('[data-modeling-status]').textContent,alertHidden:section.querySelector('[data-modeling-error]').hidden}));
  assert.equal(value.family,family);assert.ok(value.documentWidth<=value.width+1&&value.mainScroll<=value.mainWidth+1&&value.mainWidth<=value.width&&value.headerWidth<=value.width&&value.headerScroll<=value.headerWidth+1&&value.mainLeft>=-1);assert.ok(value.status&&value.alertHidden);
  for(const c of value.controls){assert.ok(c.label);assert.equal(c.output,c.value);}for(const p of value.plots){assert.ok(p.width>=599&&p.title&&!p.bad);assert.equal(p.region,'region');assert.ok(p.regionLabel&&p.tabIndex===0);}for(const t of value.tables){assert.ok(t.caption&&t.focusable);assert.ok(t.headScopes.every(scope=>scope==='col'));}
  return value;
}
async function visible(page,selector) {
  const target=page.locator(selector).first();await target.scrollIntoViewIfNeeded();await frame(page);
  const result=await target.evaluate(node=>{const b=node.getBoundingClientRect(),cx=(b.left+b.right)/2,cy=(b.top+b.bottom)/2,hit=document.elementFromPoint(cx,cy),region=node.closest('.ei-graph-scroll'),r=region.getBoundingClientRect();return{width:b.width,height:b.height,x:cx,y:cy,inside:cx>=0&&cy>=0&&cx<innerWidth&&cy<innerHeight&&cx>=r.left&&cx<=r.right&&cy>=r.top&&cy<=r.bottom,hit:hit===node||node.contains(hit),fill:getComputedStyle(node).fill};});
  assert.ok(result.width>0&&result.height>0&&result.inside&&result.hit,JSON.stringify(result));return result;
}
async function plotMath(page,family) {
  const result=await page.locator('.ei-modeling-view').evaluate(section=>{
    const input=Object.fromEntries([...section.querySelectorAll('[data-modeling-control]')].map(n=>[n.dataset.modelingControl,Number(n.value)]));
    const plots=[...section.querySelectorAll('[data-modeling-plot]')].map(svg=>{
      const xmin=Number(svg.dataset.xmin),xmax=Number(svg.dataset.xmax),ymin=Number(svg.dataset.ymin),ymax=Number(svg.dataset.ymax),decode=([x,y])=>({x:xmin+(x-70)/500*(xmax-xmin),y:ymin+(282-y)/240*(ymax-ymin)});
      return{key:svg.dataset.modelingPlot,lines:[...svg.querySelectorAll('[data-modeling-series]')].map(n=>({key:n.dataset.modelingSeries,points:n.getAttribute('points').split(/\s+/).map(p=>decode(p.split(',').map(Number)))})),dots:[...svg.querySelectorAll('[data-modeling-point]')].map(n=>({key:n.dataset.modelingPoint,...decode([Number(n.getAttribute('cx')),Number(n.getAttribute('cy'))])})),zero:svg.querySelector('[data-modeling-zero-line]')?decode([70,Number(svg.querySelector('[data-modeling-zero-line]').getAttribute('y1'))]).y:null};});return{input,plots};
  });
  const close=(a,b)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<1e-7*Math.max(1,Math.abs(b)),`${a} != ${b}`),v=result.input;
  if(family==='transform')for(const line of result.plots[0].lines)for(const p of line.points){const u=line.key==='parent'?p.x:(v.reverseInput?-1:1)*v.horizontalMagnitude*(p.x-v.h);close(p.y,line.key==='parent'?u*u+u:v.a*(u*u+u)+v.k);}
  if(family==='selection')for(const plot of result.plots){if(plot.key==='selection-data')for(const line of plot.lines)for(const p of line.points)close(p.y,line.key==='linear'?4*p.x-1:p.x*p.x+1);else{close(plot.zero,0);assert.equal(plot.dots.length,5);for(const p of plot.dots){const x=Math.round(p.x),observation=[1,2,5+v.delta,10,17][x];close(p.x,x);close(p.y,observation-(v.candidate?x*x+1:4*x-1));}}}
  if(family==='construction')for(const p of result.plots[0].lines[0].points)close(p.y,180*p.x-56*p.x*p.x+4*p.x**3);
  return result;
}
try {
  for(const name of ['ap-transform-model.mjs','ap-model-selection-model.mjs','ap-model-construction-model.mjs','transform-view.mjs','model-selection-view.mjs','model-construction-view.mjs','modeling-view-helpers.mjs','modeling-view.mjs','ap-modeling-content.mjs','visuals.mjs','vase-model.mjs','investigations.css']) {
    const file=path.join(repo,prefix+name),raw=await readFile(file);pins.set(file,raw);sources.set('/'+prefix+name,{raw,type:name.endsWith('.css')?'text/css':'text/javascript'});
  }
  const self=fileURLToPath(import.meta.url);pins.set(self,await readFile(self));report.source_before=[...pins].map(([file,raw])=>({path:file,bytes:raw.length,sha256:sha(raw)}));
  const fixture=Buffer.from(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Original modeling fixture</title><style>.ei-shell{grid-template-columns:minmax(0,1fr)}.ei-header>*{min-width:0}.ei-header label{max-width:65%}.ei-header select{width:100%;min-width:0}</style><link rel="stylesheet" href="/${prefix}investigations.css"></head><body><dialog open class="ei-dialog"><div class="ei-shell"><header class="ei-header"><h1>Original modeling investigations</h1><label>Family <select id="family"></select></label></header><main class="ei-main" id="root"></main><footer class="ei-footer"><p>Isolated teaching fixture; no account or assessment connection</p></footer></div></dialog><script type="module" src="/fixture.mjs"></script></body></html>`);
  const script=Buffer.from(`import {AP_MODELING_CONTENT as content} from '/${prefix}ap-modeling-content.mjs';import {mountModeling} from '/${prefix}modeling-view.mjs';
const scenes=Object.values(content).flatMap(x=>x.scenes).filter(x=>x.model==='modeling'),select=document.querySelector('#family'),root=document.querySelector('#root');let handle,detached;
for(const scene of scenes){const option=document.createElement('option');option.value=scene.family;option.textContent=scene.title;select.append(option);}function show(){detached=root.querySelector('.ei-modeling-view');handle?.dispose();root.replaceChildren();const scene=scenes.find(s=>s.family===select.value),title=document.createElement('h2');title.textContent=scene.title;root.append(title);const intro=document.createElement('div');intro.className='ei-intro';for(const value of scene.text){const p=document.createElement('p');p.textContent=value;intro.append(p);}root.append(intro);const card=document.createElement('div');card.className='ei-card';root.append(card);handle=mountModeling({root:card,window,scene});}select.addEventListener('change',show);show();
window.modelingFixture={detached(){const input=detached?.querySelector('[data-modeling-control]');if(!input)return false;input.value='999';const old=detached.innerHTML,current=root.innerHTML;input.dispatchEvent(new Event(input.tagName==='SELECT'?'change':'input'));return old===detached.innerHTML&&current===root.innerHTML;},dispose(){select.removeEventListener('change',show);handle?.dispose();delete window.fixtureReady;}};window.fixtureReady=true;`);
  sources.set('/fixture.html',{raw:fixture,type:'text/html'});sources.set('/fixture.mjs',{raw:script,type:'text/javascript'});report.fixture=[['html',fixture],['module',script]].map(([name,raw])=>({name,bytes:raw.length,sha256:sha(raw)}));
  server=createServer((req,res)=>{const u=new URL(req.url,'http://127.0.0.1');if(req.method==='GET'&&u.pathname==='/favicon.ico'){res.writeHead(204);res.end();return;}const value=sources.get(u.pathname);if(req.method!=='GET'||u.search||!value){res.writeHead(404);res.end();return;}report.requests.push(u.pathname);res.writeHead(200,{'Content-Type':value.type+'; charset=utf-8','Cache-Control':'no-store'});res.end(value.raw);});
  server.on('connection',socket=>{sockets.add(socket);socket.once('close',()=>sockets.delete(socket));});
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});origin=`http://127.0.0.1:${server.address().port}`;
  const require=createRequire(import.meta.url),{chromium}=require(process.env.ECHS_PLAYWRIGHT_MODULE||'playwright');stage='launch';
  browser=await chromium.launch({headless:true,...(process.env.ECHS_CHROMIUM_PATH?{executablePath:process.env.ECHS_CHROMIUM_PATH}:{})});report.browser=browser.version();
  for(const viewport of [{width:1365,height:900},{width:390,height:844}]) {
    const device=String(viewport.width),context=await browser.newContext({viewport,reducedMotion:'reduce'});contexts.add(context);const page=await context.newPage();
    page.on('pageerror',error=>report.page_errors.push(error.message));page.on('console',msg=>{if(msg.type()==='error')report.console_errors.push(msg.text());});
    await page.route('**/*',route=>{if(new URL(route.request().url()).origin===origin)return route.continue();report.blocked_off_origin++;return route.abort();});
    const replies=[];page.on('response',response=>{const url=new URL(response.url());if(sources.has(url.pathname))replies.push((async()=>assert.deepEqual(await response.body(),sources.get(url.pathname).raw))());});
    stage=device+':load';await page.goto(origin+'/fixture.html');await page.waitForFunction(()=>window.fixtureReady===true);await frame(page);
    for(const family of ['transform','selection','construction']) {
      stage=device+':'+family;await choose(page,family);await invariant(page,family);await plotMath(page,family);check(device+' '+family+': exact content, labelled controls, numeric readouts, SVG and bounded document');
      const table=page.locator('[data-modeling-table]').first();await table.focus();assert.equal(await table.evaluate(n=>document.activeElement===n),true);check(device+' '+family+': native table region receives keyboard focus');
      await page.locator('.ei-controls').scrollIntoViewIfNeeded();await capture(page,device+'-'+family+'-controls');
      if(family==='transform') {
        await changeSelect(page,'reverseInput',0);await changeSelect(page,'reverseInput',1);await changeRange(page,'u',3);await plotMath(page,family);const feature=await visible(page,'[data-modeling-feature="image"]');check(device+' transform: native reversal, selected endpoint and image diamond visible',feature);await capture(page,device+'-transform-selected-image');
        await changeRange(page,'a',0);assert.match(await page.locator('[data-transform-interpretation]').innerText(),/not an invertible dilation/);await plotMath(page,family);check(device+' transform: zero-output-scale retains restricted input domain');
        await reset(page);assert.match(await page.locator('[data-transform-selected]').innerText(),/\(8, -3\)/);check(device+' transform: keyboard reset restores warmup correspondence');
      } else if(family==='selection') {
        await changeSelect(page,'candidate',0);await changeRange(page,'delta',4);await plotMath(page,family);assert.match(await page.locator('[data-selection-error-summary]').innerText(),/SSE = 14 cm²/);assert.match(await page.locator('[data-selection-error-summary]').innerText(),/L has the smaller SSE/);check(device+' selection: keyboard perturbation reverses fixed-candidate error ranking');
        const negative=await visible(page,'[data-modeling-plot="selection-residuals"] [data-modeling-point="residuals"]:nth-of-type(2)');check(device+' selection: actual residual point is visible inside its scrolling panel',negative);await capture(page,device+'-selection-residuals');
        await changeSelect(page,'candidate',1);await changeRange(page,'delta',0);await plotMath(page,family);const zero=await visible(page,'[data-modeling-point="residuals"]');check(device+' selection: zero residuals stay visible on their baseline',zero);await reset(page);
      } else {
        for(const t of [.25,4.75]) {await changeRange(page,'t',t);await plotMath(page,family);await invariant(page,family);const cut=page.locator('[data-modeling-diagram="net"] [data-box-cut]').first();await cut.scrollIntoViewIfNeeded();const bounds=await cut.boundingBox();assert.ok(bounds.width>=4.9&&bounds.height>=4.9);const selected=await visible(page,'[data-modeling-feature="selected-box"]');check(device+` construction: cut ${t} has visible net and selected volume`,selected);await capture(page,device+'-box-volume-'+String(t).replace('.','-'));}
        await reset(page);const hole=await visible(page,'[data-modeling-feature="excluded-boundary"]');assert.equal(hole.fill,'rgb(255, 255, 255)');check(device+' construction: nonusable domain endpoint is an actual hollow marker',hole);
        await page.locator('[data-modeling-diagram="isometric"]').scrollIntoViewIfNeeded();await page.locator('[data-modeling-diagram="isometric"]').evaluate(svg=>{const faces=[...svg.querySelectorAll('[data-box-face]')].map(n=>n.getBBox()),left=Math.min(...faces.map(b=>b.x)),right=Math.max(...faces.map(b=>b.x+b.width)),region=svg.parentElement;region.scrollLeft=Math.max(0,(left+right-region.clientWidth)/2);});assert.equal(await page.locator('[data-box-face]').count(),5);await capture(page,device+'-box-dimension-diagram');check(device+' construction: bounded five-face diagram retains open top and dimension labels');
      }
      await invariant(page,family);const graph=page.locator('.ei-graph-scroll').first();await graph.focus();assert.equal(await graph.evaluate(n=>document.activeElement===n),true);if(viewport.width===390){await graph.evaluate(n=>{n.scrollLeft=0;});const before=await graph.evaluate(n=>n.scrollLeft);await graph.press('ArrowRight');await page.waitForTimeout(120);assert.ok(await graph.evaluate((n,prior)=>n.scrollWidth>n.clientWidth&&n.scrollLeft>prior,before));}check(device+' '+family+': graph region supports native keyboard access and mobile scrolling');
      const next=family==='construction'?'transform':'construction';await choose(page,next);assert.equal(await page.evaluate(()=>window.modelingFixture.detached()),true);check(device+' '+family+': disposed controls cannot change retained or successor output');
    }
    await page.evaluate(()=>window.modelingFixture.dispose());assert.equal(await page.locator('.ei-modeling-view').count(),0);await Promise.all(replies);check(device+': all served source responses exact and explicit fixture disposal complete');
    await bounded(context.close(),5000,'context-close');contexts.delete(context);
  }
  assert.equal(report.blocked_off_origin,0);assert.deepEqual(report.page_errors,[]);assert.deepEqual(report.console_errors,[]);report.status='PASS';
} catch(error) {failure=error;report.status='FAIL';report.failure={stage,type:error.name,message:error.message};}
finally {
  for(const context of contexts)try{await bounded(context.close(),5000,'context-close-final');contexts.delete(context);}catch(error){report.cleanup_errors.push(error.message);}
  report.cleanup.contexts=contexts.size===0;
  try{if(browser)await bounded(browser.close(),5000,'browser-close');report.cleanup.browser=true;}catch(error){report.cleanup_errors.push(error.message);}
  try{if(server?.listening){const closed=new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));const pending=[...sockets].map(socket=>new Promise(resolve=>{socket.once('close',resolve);socket.destroy();}));await bounded(Promise.all([closed,...pending]),5000,'server-close');}report.cleanup.server=true;report.cleanup.sockets=sockets.size===0;}catch(error){report.cleanup_errors.push(error.message);}
  try{for(const [file,before]of pins){const raw=await readFile(file);assert.deepEqual(raw,before);report.source_after.push({path:file,bytes:raw.length,sha256:sha(raw)});}report.source_unchanged=true;}catch(error){report.cleanup_errors.push('source-drift: '+error.message);}
  if(report.cleanup_errors.length||Object.values(report.cleanup).some(value=>!value)||!report.source_unchanged)report.status='FAIL';
  await writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,checks:report.checks.length,screenshots:report.screenshots.length,failure:report.failure,cleanup:report.cleanup,cleanup_errors:report.cleanup_errors,source_unchanged:report.source_unchanged,output:out}));
}
if(failure||report.status!=='PASS')process.exitCode=1;
