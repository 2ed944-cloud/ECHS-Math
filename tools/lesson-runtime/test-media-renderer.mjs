import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';

const repository = fileURLToPath(new URL('../../', import.meta.url));
const require = createRequire(new URL('../../question-bank/official/tools/package.json', import.meta.url));
const { chromium } = require('playwright');
const output = path.join(repository,'artifacts/lesson-media'); await mkdir(output,{recursive:true});
const origin = 'http://127.0.0.1:4173', external = [], blocked = [], errors = [], checks = [];
const types = {'.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf'};
const pass = label => { checks.push(label); console.log('PASS '+label); };
const imageId = '20000000-0000-4000-8000-000000000001', resourceId = '20000000-0000-4000-8000-000000000002';
const image = {id:'image',type:'image',version:1,content:{asset_id:imageId,alt:'A blue curve rises from left to right on labelled axes.',decorative:false,caption:'Original synthetic image for the isolated browser test.',description:'The curve is increasing. Both axes start at zero.'}};
const resource = {id:'resource',type:'resource',version:1,content:{asset_id:resourceId,title:'Original teacher reference',description:'A short PDF resource for this lesson.'}};
const video = {id:'video',type:'video',version:1,content:{provider:'youtube',video_id:'abcdefghijk',title:'Interpreting a graph',start_seconds:12,transcript:'Read the axes first. Compare the height of the graph at nearby inputs.'}};
const text = value => [{type:'text',text:value}];
const table = {id:'table',type:'table',version:1,content:{caption:'Values and reasoning',row_header:true,
  columns:[{id:'input',label:'Input'},{id:'value',label:'Value'},{id:'reason',label:'Reasoning'}],
  rows:[{id:'first',cells:[text('First sample'),[{type:'math',source:{mode:'visual',expression:{kind:'fraction',numerator:{kind:'number',value:'1'},denominator:{kind:'number',value:'2'}}},spoken:'one half'}],[{type:'text',text:'Compare nearby values.',marks:['strong']}]]},
    {id:'second',cells:[text('Second sample'),text('0.6'),[{type:'link',href:'https://apcentral.collegeboard.org/',children:[{type:'text',text:'Reference',marks:['em']}]}]]}]}};
const html = '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Isolated lesson media renderer</title><link rel="stylesheet" href="/css/lesson-document.css"><link rel="stylesheet" href="/css/lesson-media.css"><link rel="stylesheet" href="/lessons/ib-math-ai/unit-1/assets/css/katex.css"><style>body{margin:0;background:#f4f1f2}main{display:grid;gap:1.4rem;max-width:900px;margin:auto;padding:24px;box-sizing:border-box}h1{margin:0;font-size:1.7rem}.test-row{min-width:0}@media(max-width:600px){main{padding:16px}}</style><main class="echsDocument"><h1>Lesson media</h1><div id="host" style="display:grid;gap:1.4rem;min-width:0"></div></main></html>';
let browser, context;
try {
  browser = await chromium.launch({headless:true,executablePath:process.env.ECHS_CHROMIUM_PATH||undefined});
  context = await browser.newContext({viewport:{width:1280,height:1000},serviceWorkers:'block',acceptDownloads:true});
  await context.route('**/*',async route => {
    const url = new URL(route.request().url());
    if(url.origin==='https://www.youtube-nocookie.com') {
      external.push(url.href);
      // Intentional unavailable provider response, not a real YouTube request.
      return route.fulfill({status:503,contentType:'text/html',body:'<!doctype html><title>Unavailable provider fixture</title><p>Video unavailable in this isolated test.</p>'});
    }
    if(url.origin!==origin){blocked.push(url.href);return route.abort();}
    if(url.pathname==='/__media_fixture__')return route.fulfill({status:200,contentType:'text/html',body:html});
    try {
      const file=path.resolve(repository,'.'+decodeURIComponent(url.pathname));
      if(!file.startsWith(path.resolve(repository)+path.sep)||!(await stat(file)).isFile())return route.fulfill({status:404,body:''});
      return route.fulfill({status:200,contentType:types[path.extname(file)]||'application/octet-stream',body:await readFile(file)});
    }catch{return route.fulfill({status:404,body:''});}
  });
  const page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',error=>errors.push(error.message));
  await page.goto(origin+'/__media_fixture__',{waitUntil:'domcontentloaded'});
  await page.evaluate(async({imageId,resourceId})=>{
    const {createMediaRenderer}=await import('/js/lesson-runtime/media-renderer.mjs');
    const {createContentRenderer}=await import('/js/lesson-runtime/content-renderer.mjs');
    const {default:katex}=await import('/tools/lesson-runtime/node_modules/katex/dist/katex.mjs');
    const content=createContentRenderer({document,mathEngine:katex});
    const nativeIO=window.IntersectionObserver,nativeCreate=URL.createObjectURL.bind(URL),nativeRevoke=URL.revokeObjectURL.bind(URL);
    const f=window.fixture={calls:[],created:[],revoked:[],pending:[],controller:null,mode:'ok',attempt:0};
    URL.createObjectURL=blob=>{const url=nativeCreate(blob);f.created.push(url);return url;};
    URL.revokeObjectURL=url=>{f.revoked.push(url);nativeRevoke(url);};
    const canvas=document.createElement('canvas');canvas.width=640;canvas.height=320;
    const g=canvas.getContext('2d');g.fillStyle='#fcfafb';g.fillRect(0,0,640,320);g.strokeStyle='#52616b';g.lineWidth=2;g.beginPath();g.moveTo(55,30);g.lineTo(55,275);g.lineTo(600,275);g.stroke();
    g.font='18px system-ui';g.fillStyle='#202b35';g.fillText('Input',550,302);g.fillText('Value',10,22);g.fillText('0',35,297);
    g.strokeStyle='#276480';g.lineWidth=4;g.beginPath();g.moveTo(55,255);g.bezierCurveTo(240,250,430,90,590,45);g.stroke();
    const picture=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
    const pdf=new Blob(['%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\nxref\n0 2\n0000000000 65535 f \n0000000009 00000 n \ntrailer\n<< /Size 2 /Root 1 0 R >>\nstartxref\n45\n%%EOF\n'],{type:'application/pdf'});
    const hex=async blob=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))].map(n=>n.toString(16).padStart(2,'0')).join('');
    const imageReceipt={metadata:{asset_id:imageId,mime_type:'image/png',byte_length:picture.size,width:640,height:320,sha256:await hex(picture),state:'ready'},blob:picture};
    const pdfReceipt={metadata:{asset_id:resourceId,mime_type:'application/pdf',byte_length:pdf.size,width:null,height:null,sha256:await hex(pdf),state:'ready'},blob:pdf};
    f.pdfHash=pdfReceipt.metadata.sha256;
    f.mount=(blocks,{mode='ok',io=false,spacer=false}={})=>{
      f.controller?.dispose();document.querySelector('#host').replaceChildren();f.mode=mode;f.attempt=0;f.calls=[];f.pending=[];
      window.IntersectionObserver=io?nativeIO:undefined;
      const resolver=async(assetId,{kind,signal})=>{
        f.attempt++;const call={assetId,kind,aborted:signal.aborted};f.calls.push(call);signal.addEventListener('abort',()=>{call.aborted=true;},{once:true});
        const receipt=kind==='image'?imageReceipt:pdfReceipt;
        if(mode==='hold')return new Promise(resolve=>f.pending.push(()=>resolve(receipt)));
        if(mode==='abort')return new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true}));
        if(mode==='fail'||mode==='fail-once'&&f.attempt===1)throw new Error('PRIVATE_STORAGE_PATH /secret CANARY');
        if(mode==='wrong-id')return {...receipt,metadata:{...receipt.metadata,asset_id:resourceId}};
        if(mode==='extra-field')return {...receipt,metadata:{...receipt.metadata,storage_path:'PRIVATE_STORAGE_PATH'}};
        if(mode==='wrong-type')return {...receipt,blob:new Blob(['secret'],{type:'text/html'})};
        if(mode==='invalid-image'){const blob=new Blob([new Uint8Array(32)],{type:'image/png'});return {metadata:{...imageReceipt.metadata,byte_length:blob.size,sha256:await hex(blob)},blob};}
        return receipt;
      };
      f.controller=createMediaRenderer({document,inline:node=>content.rich({nodes:[{type:'paragraph',children:[node]}]},2).firstElementChild.firstChild,
        ...(mode==='missing'?{}:{resolveAsset:resolver})});
      if(spacer){const node=document.createElement('div');node.style.height='3000px';document.querySelector('#host').append(node);}
      blocks.forEach(block=>document.querySelector('#host').append(f.controller.block(block)));
    };
    f.dispose=()=>f.controller?.dispose();
    f.complete=()=>{const pending=[...f.pending];f.pending=[];pending.forEach(resolve=>resolve());};
    f.ready=true;
  },{imageId,resourceId});
  await page.waitForFunction(()=>fixture.ready);
  const mount=(blocks,options={})=>page.evaluate(({blocks,options})=>fixture.mount(blocks,options),{blocks,options});

  await mount([image,resource,video,table]);
  assert.equal(await page.locator('iframe').count(),0);assert.equal(await page.locator('img').count(),0);
  assert.equal(await page.evaluate(()=>fixture.calls.length),0);assert.deepEqual(external,[]);
  assert.equal(await page.getByRole('button',{name:'Load image',exact:true}).count(),1);
  assert.equal(await page.getByRole('button',{name:'Download PDF',exact:true}).count(),1);
  pass('media construction performs no asset request or external embed before visibility/explicit action');

  const grid=page.getByRole('table');assert.equal(await grid.locator('caption').textContent(),table.content.caption);
  assert.equal(await grid.locator('th[scope=col]').count(),3);assert.equal(await grid.locator('th[scope=row]').count(),2);
  assert.equal(await grid.locator('[role=math]').getAttribute('aria-label'),'one half');assert.equal(await grid.locator('math').count(),1);
  assert.equal(await grid.locator('strong').textContent(),'Compare nearby values.');assert.equal(await grid.locator('a em').textContent(),'Reference');
  assert.equal(await grid.locator('a').getAttribute('rel'),'noopener noreferrer');
  assert.equal(await page.evaluate(()=>[...document.querySelectorAll('td,th[scope=row]')].every(cell=>cell.getAttribute('headers').split(' ').every(id=>document.getElementById(id)))),true);
  pass('table has caption, column/row associations, v2 emphasis/link semantics and actual local KaTeX mathematics');

  const load=page.getByRole('button',{name:'Load image',exact:true});await load.focus();await page.keyboard.press('Enter');
  await page.waitForFunction(()=>document.querySelector('img')?.complete&&!document.querySelector('img')?.hidden);
  const img=page.locator('img');assert.equal(await img.getAttribute('alt'),image.content.alt);assert.equal(await img.getAttribute('width'),'640');assert.equal(await img.getAttribute('height'),'320');
  assert.equal(await page.evaluate(()=>fixture.calls[0].kind),'image');assert.equal(await page.evaluate(()=>fixture.created.length),1);
  await page.getByText('Image description',{exact:true}).click();assert.equal(await page.getByText(image.content.description,{exact:true}).isVisible(),true);
  pass('keyboard image load renders verified dimensions, meaningful alt text, caption and expandable description');

  const old=await page.evaluate(()=>fixture.created.at(-1));
  await mount([{...image,content:{...image.content,decorative:true,alt:''}}]);
  assert.equal(await page.evaluate(old=>fixture.revoked.includes(old),old),true);
  await page.getByRole('button',{name:'Load image',exact:true}).click();await page.waitForFunction(()=>document.querySelector('img')?.naturalWidth>0);
  assert.equal(await page.locator('img').getAttribute('alt'),'');assert.equal(await page.locator('img').getAttribute('role'),'presentation');
  pass('replacement revokes the previous URL and decorative images remain absent from meaningful image announcements');

  await mount([image],{mode:'fail-once'});await page.getByRole('button',{name:'Load image',exact:true}).click();
  await page.getByRole('button',{name:'Retry image',exact:true}).waitFor();assert.equal((await page.locator('#host').textContent()).includes('PRIVATE_STORAGE_PATH'),false);
  await page.getByRole('button',{name:'Retry image',exact:true}).click();await page.waitForFunction(()=>document.querySelector('img')?.naturalWidth>0);
  assert.equal(await page.evaluate(()=>fixture.calls.length),2);
  for(const mode of ['missing','wrong-id','extra-field','wrong-type','invalid-image']) {
    await mount([image],{mode});await page.getByRole('button',{name:'Load image',exact:true}).click();await page.getByRole('button',{name:'Retry image',exact:true}).waitFor();
    assert.equal(await page.locator('img').count(),0);assert.equal((await page.locator('#host').textContent()).includes('PRIVATE_STORAGE_PATH'),false);
  }
  pass('missing, failed, mismatched or nondecodable assets show a safe usable retry and preserve descriptions');

  await mount([image],{mode:'abort'});await page.getByRole('button',{name:'Load image',exact:true}).click();await page.waitForFunction(()=>fixture.calls.length===1);await page.evaluate(()=>fixture.dispose());
  assert.equal(await page.evaluate(()=>fixture.calls[0].aborted),true);assert.equal(await page.locator('#host').textContent(),'');
  await mount([image],{mode:'hold'});await page.getByRole('button',{name:'Load image',exact:true}).click();await page.waitForFunction(()=>fixture.pending.length===1);
  const beforeLate=await page.evaluate(()=>fixture.created.length);await page.evaluate(()=>{fixture.dispose();fixture.complete();});
  await page.evaluate(()=>new Promise(resolve=>setTimeout(resolve,0)));assert.equal(await page.evaluate(()=>fixture.created.length),beforeLate);assert.equal(await page.locator('#host').textContent(),'');
  pass('disposal aborts pending resolution, clears private DOM and ignores an uncooperative late receipt without creating a URL');

  await mount([image],{io:true,spacer:true});await page.evaluate(()=>scrollTo(0,0));
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));assert.equal(await page.evaluate(()=>fixture.calls.length),0);
  await page.locator('.echsMediaImage').scrollIntoViewIfNeeded();await page.waitForFunction(()=>document.querySelector('img')?.naturalWidth>0);
  assert.equal(await page.evaluate(()=>fixture.calls.length),1);pass('native IntersectionObserver fetches an image only when its offscreen slide content becomes visible');

  await mount([{...resource,content:{...resource.content,title:'../../CON [report] / reference.pdf'}}]);
  assert.equal(await page.evaluate(()=>fixture.calls.length),0);
  const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Download PDF',exact:true}).click();const download=await downloadPromise;
  assert.match(download.suggestedFilename(),/^lesson-resource-[\p{L}\p{N}_ -]+\.pdf$/u);assert.equal(download.suggestedFilename().includes('..'),false);
  const saved=path.join(output,'synthetic-resource.pdf');await download.saveAs(saved);
  assert.equal(createHash('sha256').update(await readFile(saved)).digest('hex'),await page.evaluate(()=>fixture.pdfHash));
  const downloadUrl=await page.evaluate(()=>fixture.created.at(-1));await page.waitForFunction(url=>fixture.revoked.includes(url),downloadUrl);
  assert.equal(await page.locator('a[download]').count(),0);assert.equal(await page.evaluate(()=>fixture.calls[0].kind),'resource');
  pass('explicit PDF action downloads exact bytes with a safe title-derived filename and revokes its short-lived URL');

  await mount([resource],{mode:'fail-once'});await page.getByRole('button',{name:'Download PDF',exact:true}).click();
  assert.equal(await page.getByText('The PDF is unavailable. Try downloading it again.',{exact:true}).isVisible(),true);
  const retryDownload=page.waitForEvent('download');await page.getByRole('button',{name:'Download PDF',exact:true}).click();await retryDownload;
  await page.evaluate(()=>fixture.dispose());
  assert.equal(await page.evaluate(()=>fixture.created.every(url=>fixture.revoked.includes(url))),true);
  pass('PDF failure remains retryable and disposal revokes every remaining image/download URL');

  await mount([video]);assert.deepEqual(external,[]);await page.getByText('Video transcript',{exact:true}).click();
  assert.equal(await page.getByText(video.content.transcript,{exact:true}).isVisible(),true);assert.equal(await page.locator('iframe').count(),0);
  await page.getByRole('button',{name:'Load external video',exact:true}).focus();await page.keyboard.press('Enter');
  await page.waitForFunction(()=>document.querySelector('iframe')!==null);await page.waitForFunction(()=>document.querySelector('.echsMediaVideo .echsMediaStatus')?.textContent.includes('If the video'));
  assert.equal(external.length,1);assert.equal(external[0],'https://www.youtube-nocookie.com/embed/abcdefghijk?start=12&autoplay=0&playsinline=1&rel=0');
  assert.equal(await page.locator('iframe').getAttribute('referrerpolicy'),'strict-origin');assert.equal(await page.locator('iframe').getAttribute('title'),video.content.title);
  assert.equal(await page.locator('iframe').getAttribute('sandbox'),'allow-scripts allow-same-origin allow-presentation');
  assert.equal((await page.locator('iframe').getAttribute('allow')).includes('autoplay'),false);
  assert.equal(await page.getByRole('link',{name:'Open on YouTube'}).getAttribute('rel'),'noopener noreferrer');
  assert.equal(await page.getByText(video.content.transcript,{exact:true}).isVisible(),true);
  await page.getByRole('button',{name:'Remove external video',exact:true}).click();assert.equal(await page.locator('iframe').count(),0);
  assert.equal(await page.getByRole('button',{name:'Load external video',exact:true}).evaluate(node=>node===document.activeElement),true);
  pass('video requires keyboard/click consent, uses only fixed privacy-enhanced embedding and retains transcript/link fallback when the provider is unavailable');

  await mount([video,{...video,id:'second-video',content:{...video.content,title:'A second video'}},image,resource,table]);
  await page.locator('.echsMediaVideo').nth(0).getByRole('button',{name:'Load external video',exact:true}).click();
  await page.locator('.echsMediaVideo').nth(0).locator('iframe').waitFor();
  await page.locator('.echsMediaVideo').nth(1).getByRole('button',{name:'Load external video',exact:true}).click();
  await page.locator('.echsMediaVideo').nth(1).locator('iframe').waitFor();
  assert.equal(await page.locator('iframe').count(),2);
  await page.evaluate(()=>{fixture.deactivatedFrame=document.querySelector('iframe');fixture.controller.deactivate(document.querySelector('.echsMediaVideo'));});
  assert.equal(await page.locator('.echsMediaVideo').nth(0).locator('iframe').count(),0);assert.equal(await page.locator('.echsMediaVideo').nth(1).locator('iframe').count(),1);
  assert.equal(await page.evaluate(()=>fixture.deactivatedFrame.getAttribute('src')),null);assert.equal(await page.locator('.echsMediaTable').count(),1);assert.equal(await page.locator('.echsMediaResource').count(),1);
  assert.equal(await page.locator('.echsMediaVideo').nth(0).getByRole('button',{name:'Load external video',exact:true}).isEnabled(),true);
  pass('subtree deactivation removes only its video source and preserves other slides, images, tables and resource controls');

  await mount([image,resource,video,table]);await page.getByRole('button',{name:'Load image',exact:true}).click();await page.waitForFunction(()=>document.querySelector('img')?.naturalWidth>0);
  await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(output,'media-desktop.png'),fullPage:true});
  const wide=structuredClone(table);wide.content.columns=Array.from({length:8},(_,i)=>({id:'column-'+i,label:'Column '+(i+1)}));wide.content.rows=[{id:'row',cells:wide.content.columns.map((_,i)=>text('Value '+i))}];
  await mount([image,wide,resource,video]);await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Load image',exact:true}).click();await page.waitForFunction(()=>document.querySelector('img')?.naturalWidth>0);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  const region=page.getByRole('region',{name:wide.content.caption});assert.equal(await region.getAttribute('tabindex'),'0');
  assert.equal(await region.evaluate(node=>node.scrollWidth>node.clientWidth),true);await region.focus();await page.keyboard.press('ArrowRight');
  await page.waitForFunction(()=>document.querySelector('.echsMediaTable').scrollLeft>0);
  await region.evaluate(node=>{node.scrollLeft=0;node.blur();});
  await page.screenshot({path:path.join(output,'media-mobile.png'),fullPage:true});
  pass('desktop/mobile layouts contain wide tables in a labelled keyboard-scrollable region and preserve readable media controls');

  await page.evaluate(()=>fixture.dispose());assert.equal(await page.evaluate(()=>fixture.created.every(url=>fixture.revoked.includes(url))),true);
  assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0);assert.deepEqual(blocked,[]);assert.deepEqual(errors,[]);
  pass('complete cleanup leaves no blob URLs, private DOM, browser storage or unexpected network requests');
  await writeFile(path.join(output,'media-renderer-results.json'),JSON.stringify({status:'PASS',checks,
    scope:'Actual Chrome and local production renderer/KaTeX modules; synthetic authorized asset resolver and unavailable video-provider response. No production requests, uploads or database authorization claims.',externalFixtureRequests:external.length,blockedRequests:blocked},null,2)+'\n');
} finally { if(context)await context.close();if(browser)await browser.close(); }
