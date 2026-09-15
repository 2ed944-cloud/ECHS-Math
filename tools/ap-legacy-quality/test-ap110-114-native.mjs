import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const arg=name=>{const i=process.argv.indexOf(name);return i<0?null:process.argv[i+1];};
assert.ok(arg('--repo')&&arg('--report-dir'),'Supply --repo and a fresh --report-dir.');
const candidate=path.resolve(arg('--repo')),output=path.resolve(arg('--report-dir'));
const pinPath=path.join(path.dirname(fileURLToPath(import.meta.url)),'ap110-114-native-source-pins.json');
await mkdir(output,{recursive:false});
const driver=process.env.ECHS_PLAYWRIGHT_MODULE||'playwright';
const {chromium}=createRequire(import.meta.url)(driver);
const sha=b=>createHash('sha256').update(b).digest('hex');
const bytes=await readFile(pinPath);
const manifest=JSON.parse(bytes),sources=new Map(),before=[];
for(const row of manifest.files){const raw=await readFile(path.join(candidate,row.path));assert.equal(raw.length,row.bytes);assert.equal(sha(raw),row.sha256);sources.set('/'+row.path,raw);before.push({path:row.path,bytes:raw.length,sha256:sha(raw)});}
assert.equal(manifest.files.length,5);assert.equal(new Set(manifest.files.map(r=>r.path)).size,5);
const self=await readFile(fileURLToPath(import.meta.url));
const report={contract:'echs.ap110-114.native-renderers.v1',scope:'Native browser rendering exact isolated AP1.10-1.14 candidate HTML over owned loopback HTTP. Real canvas pixels and forwarded native arc observation; no production auth, backend, remote calculator or publication.',platform:process.platform,status:'RUNNING',source_before:before,harness:{bytes:self.length,sha256:sha(self)},manifest_sha256:sha(bytes),playwright:JSON.parse(await readFile(createRequire(import.meta.url).resolve(driver+'/package.json'),'utf8')).version,checks:[],screenshots:[],page_errors:[],console_errors:[],requests:[],blocked_off_origin:0,cleanup:{contexts:false,browser:false,server:false},source_unchanged:false};
assert.ok(/^\d+\.\d+\.\d+$/.test(report.playwright));
const contexts=new Set(),sockets=new Set();let browser,server,origin,step='setup';
const bounded=(task,ms,label)=>{let timer;return Promise.race([task,new Promise((_,j)=>{timer=setTimeout(()=>j(Error(label)),ms);})]).finally(()=>clearTimeout(timer));};
const check=(name,data={})=>report.checks.push({name,pass:true,...data});
const frame=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
async function screenshot(page,card,name){const canvas=card.locator('canvas');await canvas.scrollIntoViewIfNeeded();await frame(page);for(const [suffix,capture]of [['',dest=>page.screenshot({path:dest,timeout:15000})],['-canvas',dest=>canvas.screenshot({path:dest,timeout:15000})]]){const dest=path.join(output,name+suffix+'.png');await capture(dest);const raw=await readFile(dest);report.screenshots.push({path:path.basename(dest),bytes:raw.length,sha256:sha(raw)});}}
function slideFor(raw,kind){const source=raw.toString('utf8'),index=source.indexOf('<article class="interaction-card" data-interaction="'+kind+'"');assert.ok(index>0);const sections=[...source.slice(0,index).matchAll(/<section class="slide[^>]*data-slide-number="(\d+)"/g)];return Number(sections.at(-1)[1]);}
async function reveal(page,kind){const card=page.locator(`[data-interaction="${kind}"]`);await card.waitFor({state:'visible'});const button=card.locator('.lesson-reveal-button');await button.focus();await button.press('Enter');assert.equal(await button.getAttribute('aria-expanded'),'true');await frame(page);assert.equal(await card.locator('.lesson-reveal').getAttribute('hidden'),null);return card;}
const read=card=>card.locator('.interaction-readout').innerText();
async function setRange(page,card,key,value){const control=card.locator(`[data-control="${key}"]`);const props=await control.evaluate(el=>({min:Number(el.min),step:Number(el.step),max:Number(el.max)}));assert.ok(value>=props.min&&value<=props.max);const n=(value-props.min)/props.step;assert.equal(n,Math.round(n));await control.focus();await control.press('Home');for(let i=0;i<n;i++)await control.press('ArrowRight');assert.equal(Number(await control.inputValue()),value);await frame(page);assert.doesNotMatch(await read(card),/NaN|Infinity|undefined/);}
async function defaults(card){return {text:await read(card),controls:await card.locator('[data-control]').evaluateAll(els=>els.map(el=>({key:el.dataset.control,value:el.value}))) };}
async function reset(page,card,initial){const button=card.locator('[data-reset-interaction]');await button.focus();await button.press('Enter');await frame(page);assert.deepEqual(await defaults(card),initial);}
async function pixel(page,kind,point,bounds,color){const canvas=page.locator(`[data-interaction="${kind}"] canvas`);await canvas.scrollIntoViewIfNeeded();await frame(page);return canvas.evaluate((canvas,{point,bounds,color})=>{const r=canvas.getBoundingClientRect(),d=devicePixelRatio,w=r.width,h=parseFloat(getComputedStyle(canvas).height),x=48+(point[0]-bounds[0])/(bounds[1]-bounds[0])*(w-68),y=24+(bounds[3]-point[1])/(bounds[3]-bounds[2])*(h-62);const ix=Math.round(x*d),iy=Math.round(y*d);let hits=0;const rgba=canvas.getContext('2d').getImageData(Math.max(0,ix-4),Math.max(0,iy-4),9,9).data;for(let i=0;i<rgba.length;i+=4)if(Math.abs(rgba[i]-color[0])<10&&Math.abs(rgba[i+1]-color[1])<10&&Math.abs(rgba[i+2]-color[2])<10)hits++;const screenX=r.left+x,screenY=r.top+y;return{x,y,width:w,height:h,hits,inside:x>48&&x<w-20&&y>24&&y<h-38,viewport_visible:screenX>0&&screenX<innerWidth&&screenY>0&&screenY<innerHeight&&document.elementFromPoint(screenX,screenY)===canvas};},{point,bounds,color});}
async function titleFits(card,title){return card.locator('canvas').evaluate((canvas,title)=>{const context=canvas.getContext('2d'),font=context.font,width=context.measureText(title).width,available=canvas.getBoundingClientRect().width-68;return{title,font,width,available,fits:width<=available,retired_title_width:context.measureText('Point mapping under g(x)=a f(b(x−1))+2').width};},title);}
async function counts(card){return card.locator('canvas').evaluate(c=>{const data=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let green=0;for(let i=0;i<data.length;i+=4)if(Math.abs(data[i]-11)<5&&Math.abs(data[i+1]-118)<5&&Math.abs(data[i+2]-99)<5)green++;return{green};});}
async function open(context,row,kind,label){const page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>report.page_errors.push({label,message:e.message}));page.on('console',m=>{if(m.type()==='error')report.console_errors.push({label,message:m.text()});});const url=origin+'/'+row.path+'#slide-'+slideFor(sources.get('/'+row.path),kind);step=label+':navigation';const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});assert.equal(response.status(),200);assert.ok((await response.body()).equals(sources.get('/'+row.path))); await page.waitForFunction(k=>document.querySelector(`[data-interaction="${k}"]`)?.closest('section.slide')?.getAttribute('aria-hidden')==='false',kind);const card=await reveal(page,kind);assert.ok((await read(card)).length>20);const body=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));assert.ok(body.scroll<=body.width+1,JSON.stringify(body));check(label+': native route, keyboard reveal and viewport',{width:body.width});return{page,card};}
async function closePage(page){await bounded(page.close(),5000,'page-close-timeout');}
// Observe only target arc/vertical-stroke coordinates; every call is forwarded natively.
function observeArcs(){
 const records={},strokes={},points=new WeakMap();window.__apLegacyArcs=records;window.__apLegacyVertical=strokes;const proto=CanvasRenderingContext2D.prototype;
 for(const method of ['clearRect','arc','beginPath','moveTo','lineTo','stroke']){const original=proto[method];proto[method]=function(...args){
  const result=Reflect.apply(original,this,args),kind=this.canvas.closest('[data-interaction]')?.dataset.interaction;if(!['holes','longdivision'].includes(kind))return result;
  if(method==='clearRect'){records[kind]=[];strokes[kind]=[];points.set(this,[]);}
  else if(method==='arc'){const list=records[kind]??=[];if(list.length<16)list.push({x:args[0],y:args[1],radius:args[2]});}
  else if(method==='beginPath')points.set(this,[]);
  else if(method==='moveTo'||method==='lineTo'){const list=points.get(this)??[];if(list.length<3)list.push({x:args[0],y:args[1]});points.set(this,list);}
  else if(method==='stroke'){const list=points.get(this)??[],out=strokes[kind]??=[];if(list.length===2&&list[0].x===list[1].x&&this.strokeStyle==='#c4932e'&&out.length<16)out.push({points:list.slice(),width:this.lineWidth,dash:this.getLineDash()});}
  return result;
 };}
}
async function openMarker(page,kind,point,bounds){
 const location=await pixel(page,kind,point,bounds,[255,255,255]);
 assert.ok(location.inside&&location.viewport_visible&&location.hits>20,JSON.stringify(location));
 const measure=await page.locator(`[data-interaction="${kind}"] canvas`).evaluate((canvas,{location,kind})=>{
  const ctx=canvas.getContext('2d'),x=Math.round(location.x),y=Math.round(location.y),image=ctx.getImageData(x-10,y-10,21,21).data;
  let ring=0;for(let j=0;j<21;j++)for(let i=0;i<21;i++){const radius=Math.hypot(i-10,j-10),k=(j*21+i)*4;if(radius>=5&&radius<=9&&Math.abs(image[k]-111)<10&&Math.abs(image[k+1]-23)<10&&Math.abs(image[k+2]-56)<10)ring++;}
  return{ring,center:[...ctx.getImageData(x,y,1,1).data],arcs:window.__apLegacyArcs[kind]};
 },{location,kind});
 assert.ok(measure.ring>40,JSON.stringify(measure));assert.deepEqual(measure.center,[255,255,255,255]);assert.equal(measure.arcs.length,1);assert.ok(Math.abs(measure.arcs[0].x-location.x)<1e-6&&Math.abs(measure.arcs[0].y-location.y)<1e-6);assert.equal(measure.arcs[0].radius,7);
 return{...location,...measure};
}
async function verticalGold(card,x,bounds,range){return card.locator('canvas').evaluate((canvas,{x,bounds,range})=>{
 const w=canvas.getBoundingClientRect().width,h=parseFloat(getComputedStyle(canvas).height),column=Math.round(48+(x-bounds[0])/(bounds[1]-bounds[0])*(w-68));
 const ys=range.map(y=>Math.round(24+(bounds[3]-y)/(bounds[3]-bounds[2])*(h-62))).sort((a,b)=>a-b),data=canvas.getContext('2d').getImageData(column-1,ys[0],3,ys[1]-ys[0]+1).data;let count=0;
 for(let i=0;i<data.length;i+=4)if(Math.abs(data[i]-196)<10&&Math.abs(data[i+1]-147)<10&&Math.abs(data[i+2]-46)<10)count++;return count;
 },{x,bounds,range});}
async function verticalProof(card,kind,x,bounds,present){
 const canvas=card.locator('canvas');await canvas.scrollIntoViewIfNeeded();
 const proof=await canvas.evaluate((canvas,{kind,x,bounds})=>{
  const rect=canvas.getBoundingClientRect(),w=rect.width,h=parseFloat(getComputedStyle(canvas).height),px=48+(x-bounds[0])/(bounds[1]-bounds[0])*(w-68),bottom=h-38,top=24;
  // Plot.asymV draws upward from ymin to ymax, width2 with a [7,6] dash.
  // The first dash midpoint is 3.5 CSS pixels above the plot bottom.
  const py=bottom-3.5,data=canvas.getContext('2d').getImageData(Math.round(px)-1,Math.round(py)-1,3,3).data;let gold=0;
  for(let i=0;i<data.length;i+=4)if(Math.abs(data[i]-196)<10&&Math.abs(data[i+1]-147)<10&&Math.abs(data[i+2]-46)<10)gold++;
  const sx=rect.left+px,sy=rect.top+py;
  return{px,bottom,top,first_dash_midpoint_y:py,gold,strokes:window.__apLegacyVertical[kind]??[],viewport_visible:sx>0&&sx<innerWidth&&sy>0&&sy<innerHeight&&document.elementFromPoint(sx,sy)===canvas};
 },{kind,x,bounds});
 assert.ok(proof.viewport_visible,JSON.stringify(proof));
 if(present){assert.equal(proof.strokes.length,1);const stroke=proof.strokes[0];assert.equal(stroke.width,2);assert.deepEqual(stroke.dash,[7,6]);assert.ok(Math.abs(stroke.points[0].x-proof.px)<1e-6&&Math.abs(stroke.points[1].x-proof.px)<1e-6);assert.ok(Math.abs(stroke.points[0].y-proof.bottom)<1e-6&&Math.abs(stroke.points[1].y-proof.top)<1e-6);assert.ok(proof.gold>0,JSON.stringify(proof));}
 else{assert.deepEqual(proof.strokes,[]);assert.equal(proof.gold,0);}
 return proof;
}
try{
 server=createServer((req,res)=>{const url=new URL(req.url,'http://127.0.0.1');if(req.method==='GET'&&url.pathname==='/favicon.ico'){res.writeHead(204);res.end();return;}const raw=sources.get(url.pathname);if(req.method!=='GET'||!raw){res.writeHead(404);res.end('Not found');return;}report.requests.push(url.pathname);res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(raw);});
 server.on('connection',socket=>{sockets.add(socket);socket.once('close',()=>sockets.delete(socket));});
 await bounded(new Promise((r,j)=>{server.once('error',j);server.listen(0,'127.0.0.1',r);}),5000,'server-listen-timeout');origin=`http://127.0.0.1:${server.address().port}`;
 browser=await chromium.launch({headless:true,timeout:20000,...(process.env.ECHS_CHROMIUM_PATH?{executablePath:process.env.ECHS_CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage','--no-proxy-server']});report.browser=browser.version();
 for(const [device,viewport]of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]){
  const context=await browser.newContext({viewport,deviceScaleFactor:1,reducedMotion:'reduce',serviceWorkers:'block'});contexts.add(context);await context.addInitScript(observeArcs);await context.route('**/*',route=>{if(new URL(route.request().url()).origin===origin)return route.continue();report.blocked_off_origin++;return route.abort();});
  {
   const {page,card}=await open(context,manifest.files[0],'transform',device+' transform'),initial=await defaults(card);step=device+':transform';assert.match(initial.text,/vertex/i);
   await setRange(page,card,'b',0);assert.match(await read(card),/b=0|constant/i);assert.match(await read(card),/no unique vertex/i);assert.doesNotMatch(await read(card),/horizontal scale is/);check(device+': b=0 constant has no inverse-scale or unique-vertex claim');await screenshot(page,card,device+'-transform-b0');
   await reset(page,card,initial);await setRange(page,card,'a',0);assert.match(await read(card),/a=0/);assert.match(await read(card),/no unique vertex/i);check(device+': a=0 collapses and reset restores exact defaults');await reset(page,card,initial);await closePage(page);
  }
  {
   const {page,card}=await open(context,manifest.files[0],'transformpoints',device+' point map'),initial=await defaults(card);step=device+':point-map';await setRange(page,card,'a',2);await setRange(page,card,'b',.25);await setRange(page,card,'u',3);assert.match(await read(card),/\(13, 20\)/);assert.ok((await read(card)).endsWith('Model: g(x)=a f(b(x−1))+2.'));const title=await titleFits(card,'Parent point and image');assert.ok(title.fits,JSON.stringify(title));if(device==='mobile')assert.ok(title.retired_title_width>title.available);check(device+': concise point-map canvas title fits with full formula in separate readout',{title});const point=await pixel(page,'transformpoints',[13,20],[-5,14,-8,22],[111,23,56]);assert.ok(point.inside&&point.viewport_visible&&point.hits>10,JSON.stringify(point));check(device+': actual native burgundy marker at (13,20) inside expanded canvas',{pixel:point});await screenshot(page,card,device+'-point-13-20');
   await setRange(page,card,'b',0);assert.match(await read(card),/no real input as a solution/);assert.match(await read(card),/no unique image point/);await setRange(page,card,'u',0);assert.match(await read(card),/every real input as a solution/);check(device+': b=0 point mapping distinguishes no inputs from every input');const zeroTitle=await titleFits(card,'Constant output: g(x)=2');assert.ok(zeroTitle.fits,JSON.stringify(zeroTitle));check(device+': zero-b point-map title fits native canvas',{title:zeroTitle});await screenshot(page,card,device+'-point-zero-b');
   await setRange(page,card,'b',1);await setRange(page,card,'u',3);await setRange(page,card,'a',0);assert.match(await read(card),/collapses all outputs to 2/);check(device+': a=0 point mapping reports output collapse');await reset(page,card,initial);check(device+': point-map keyboard reset preserves original defaults');await closePage(page);
  }
  {
   const {page,card}=await open(context,manifest.files[1],'modelselect',device+' model selection'),initial=await defaults(card);step=device+':model-selection';const select=card.locator('[data-control="data"]');assert.equal(await select.locator('option[value="2"]').innerText(),'Rational saturation');assert.equal(await select.locator('option').filter({hasText:'Cubic-like'}).count(),0);await select.focus();await select.press('End');await select.press('Enter');await frame(page);assert.equal(await select.inputValue(),'2');assert.match(await read(card),/rational saturation/);const p=await pixel(page,'modelselect',[3,40],[-1,13,-5,90],[111,23,56]);assert.ok(p.inside&&p.viewport_visible&&p.hits>0,JSON.stringify(p));check(device+': keyboard-selected saturation label matches native curve 80x/(x+3)',{pixel:p});await screenshot(page,card,device+'-rational-saturation');await reset(page,card,initial);check(device+': model selection reset restores original preset');await closePage(page);
  }
  {
   const {page,card}=await open(context,manifest.files[2],'modelconstruct',device+' polynomial construction'),initial=await defaults(card);step=device+':zero-polynomial';assert.ok((await counts(card)).green>10);await setRange(page,card,'scale',0);assert.match(await read(card),/every real input is a zero/);assert.match(await read(card),/degree and leading coefficient are not defined/);assert.equal((await counts(card)).green,0);check(device+': zero polynomial has no isolated-root markers or false degree');await screenshot(page,card,device+'-zero-polynomial');await reset(page,card,initial);assert.ok((await counts(card)).green>10);check(device+': polynomial reset restores original two native root markers');await closePage(page);
  }
  {
   const {page,card}=await open(context,manifest.files[2],'rationalconstruct',device+' rational construction'),initial=await defaults(card);step=device+':zero-rational';await setRange(page,card,'L',0);assert.match(await read(card),/x≠−2|x≠-2/);assert.match(await read(card),/hole at \((?:−|-)2, 0\), not a vertical asymptote/);assert.match(await read(card),/does not specify an isolated zero/);const hole=await pixel(page,'rationalconstruct',[-2,0],[-6,6,-10,10],[255,255,255]);const va=await pixel(page,'rationalconstruct',[-2,5],[-6,6,-10,10],[196,147,46]);assert.ok(hole.viewport_visible&&hole.hits>20&&va.hits===0);check(device+': L=0 retains native open excluded point and removes vertical asymptote',{hole_pixels:hole.hits,vertical_asymptote_pixels:va.hits});await screenshot(page,card,device+'-zero-rational');await setRange(page,card,'z',-2);assert.match(await read(card),/retained exclusion/);assert.match(await read(card),/not a vertical asymptote/);check(device+': L=0 root/pole collision retains exclusion');await reset(page,card,initial);assert.match(await read(card),/vertical asymptote x=/);check(device+': rational reset restores original nonzero model');await closePage(page);
  }
  {
   const {page,card}=await open(context,manifest.files[3],'holes',device+' movable hole'),initial=await defaults(card);step=device+':movable-hole';
   for(const [c,y,bounds]of [[1.75,-11,[-5,6,-12,8]],[2.25,13,[-5,6,-8,14]]]){
    await setRange(page,card,'c',c);assert.ok((await read(card)).includes(`(${c}, ${y})`));
    const marker=await openMarker(page,'holes',[c,y],bounds);check(device+`: actual open hole (${c},${y}) fits expanded viewport`,{marker});await screenshot(page,card,device+`-hole-${y<0?'negative11':'positive13'}`);
   }
   await setRange(page,card,'c',2);assert.match(await read(card),/vertical asymptote remains rather than a finite hole/);assert.deepEqual(await page.evaluate(()=>window.__apLegacyArcs.holes),[]);
   const vertical=await verticalProof(card,'holes',2,[-5,6,-8,8],true);check(device+': c=2 collision retains native vertical asymptote and no hole',{vertical});await screenshot(page,card,device+'-hole-collision2');
   await reset(page,card,initial);check(device+': movable-hole keyboard reset restores exact defaults');await closePage(page);
  }
  {
   const {page,card}=await open(context,manifest.files[4],'longdivision',device+' quotient remainder'),initial=await defaults(card);step=device+':zero-remainder';
   await setRange(page,card,'rem',0);assert.match(await read(card),/x≠2/);assert.match(await read(card),/hole at \(2,3\), not a vertical asymptote/);
   const marker=await openMarker(page,'longdivision',[2,3],[-6,7,-9,10]);const absence=await verticalProof(card,'longdivision',2,[-6,7,-9,10],false);assert.equal(await verticalGold(card,2,[-6,7,-9,10],[6,9]),0);
   // Deliberate native drawing fault: the absence check must reject a false VA.
   await card.locator('canvas').evaluate((canvas,proof)=>{const c=canvas.getContext('2d');c.save();c.strokeStyle='#c4932e';c.lineWidth=2;c.setLineDash([7,6]);c.beginPath();c.moveTo(proof.px,proof.bottom);c.lineTo(proof.px,proof.top);c.stroke();c.restore();},absence);
   await assert.rejects(()=>verticalProof(card,'longdivision',2,[-6,7,-9,10],false));
   await setRange(page,card,'rem',.5);await setRange(page,card,'rem',0);await openMarker(page,'longdivision',[2,3],[-6,7,-9,10]);await verticalProof(card,'longdivision',2,[-6,7,-9,10],false);
   check(device+': zero remainder preserves native open hole (2,3) without vertical asymptote',{marker,absence,false_va_control_rejected:true});await screenshot(page,card,device+'-zero-remainder');
   await setRange(page,card,'rem',-.5);assert.deepEqual(await page.evaluate(()=>window.__apLegacyArcs.longdivision),[]);assert.match(await read(card),/remainder term approaches 0/);const vertical=await verticalProof(card,'longdivision',2,[-6,7,-9,10],true);check(device+': nonzero remainder restores vertical asymptote without a hole',{vertical});
   await reset(page,card,initial);check(device+': quotient-remainder keyboard reset restores exact defaults');await closePage(page);
  }
  await bounded(context.close(),10000,'context-close-timeout');contexts.delete(context);
 }
 assert.equal(report.page_errors.length,0);assert.equal(report.console_errors.length,0);assert.deepEqual([...new Set(report.requests)].sort(),[...sources.keys()].sort());assert.equal(report.checks.length,58);check('All five exact routes served; no page or console errors');report.status='PASS';
}catch(error){report.status='FAIL';report.failure={stage:step,name:error.name,message:error.message};process.exitCode=1;}
finally{
 for(const context of [...contexts])try{await bounded(context.close(),10000,'context-close-timeout');contexts.delete(context);}catch(e){(report.cleanup_errors??=[]).push(e.message);}
 report.cleanup.contexts=contexts.size===0;
 try{if(browser)await bounded(browser.close(),10000,'browser-close-timeout');report.cleanup.browser=true;}catch(e){(report.cleanup_errors??=[]).push(e.message);}
 try{if(server?.listening){const closed=new Promise((r,j)=>server.close(e=>e?j(e):r()));server.closeAllConnections();await bounded(closed,5000,'server-close-timeout');}report.cleanup.server=!server?.listening;}catch(e){(report.cleanup_errors??=[]).push(e.message);}
 await new Promise(resolve=>setImmediate(resolve));report.cleanup.sockets_empty=sockets.size===0;
 report.source_unchanged=(await Promise.all(before.map(async row=>sha(await readFile(path.join(candidate,row.path)))===row.sha256))).every(Boolean)&&sha(await readFile(fileURLToPath(import.meta.url)))===report.harness.sha256&&sha(await readFile(pinPath))===report.manifest_sha256;
 if(!report.source_unchanged||!Object.values(report.cleanup).every(Boolean)||report.cleanup_errors?.length){report.status='FAIL';process.exitCode=1;}
 await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,checks:report.checks.length,screenshots:report.screenshots.length,failure:report.failure,cleanup:report.cleanup,source_unchanged:report.source_unchanged,output},null,2));
}
