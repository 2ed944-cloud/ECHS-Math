import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';

// The actual institutional loader, asset response verifier and media renderer
// execute in Chrome. Account/release decisions and HTTP responses are synthetic;
// this does not claim production access or PostgreSQL authorization verification.
const repository=fileURLToPath(new URL('../../',import.meta.url));
const require=createRequire(new URL('../../question-bank/official/tools/package.json',import.meta.url));
const {chromium}=require('playwright');
const output=path.join(repository,'artifacts/lesson-media');await mkdir(output,{recursive:true});
const origin='https://echs-fixture.example.test',prefix='/ECHS-Math/';
const fixturePath=prefix+'tools/lesson-runtime/fixtures/institutional-media.html';
const apiOrigin='https://fixture-project.supabase.co',apiRoot=apiOrigin+'/functions/v1/lesson-api';
const original=JSON.parse(await readFile(new URL('./fixtures/published-original.lesson.json',import.meta.url)));
const ids={lesson:original.lesson_id,course:original.course_version_id,account:'8a0f707a-67da-4aeb-b5a0-e242bd7061f7',organization:'cce5bb0f-0b1e-4a7c-8dd2-69eb38e0981f',
  class:'ecfb78c2-2a67-48c0-9f5b-70e9ef4ae30c',publication:'92026edf-32fb-496a-987a-9889e6c64e38',image:'20000000-0000-4000-8000-000000000001',resource:'20000000-0000-4000-8000-000000000002',other:'193264e9-3b2b-468c-9f6c-06d8c84b65e9'};
const token='isolated-institutional-media-session';
const PNG=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAADCAIAAAA2iEnWAAAAFElEQVR4nGOUDJjGwMDAxAAGUAoAEsQBBc88udgAAAAASUVORK5CYII=','base64');
const PDF=Buffer.from('%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\nxref\n0 2\n0000000000 65535 f \n0000000009 00000 n \ntrailer\n<< /Size 2 /Root 1 0 R >>\nstartxref\n45\n%%EOF\n');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const imageMeta={asset_id:ids.image,mime_type:'image/png',byte_length:PNG.length,width:2,height:3,sha256:hash(PNG),state:'ready'};
const pdfMeta={asset_id:ids.resource,mime_type:'application/pdf',byte_length:PDF.length,width:null,height:null,sha256:hash(PDF),state:'ready'};
const image={id:'private-image',type:'image',version:1,content:{asset_id:ids.image,alt:'Original solid blue fixture image.',decorative:false,caption:'An institutional image.',description:'A small original image served only through this isolated authorized byte fixture.'}};
const resource={id:'private-pdf',type:'resource',version:1,content:{asset_id:ids.resource,title:'Institutional reference',description:'Original synthetic PDF bytes.'}};
const video={id:'institutional-video',type:'video',version:1,content:{provider:'youtube',video_id:'abcdefghijk',title:'Original video reference',start_seconds:0,transcript:'Use the graph to compare nearby values.'}};
const html='<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Isolated institutional media delivery</title><link rel="stylesheet" href="../../../css/lesson-document.css"><link rel="stylesheet" href="../../../css/lesson-media.css"><link rel="stylesheet" href="../../../lessons/ib-math-ai/unit-1/assets/css/katex.css"><main id="lesson"><p>Existing lesson remains available.</p></main><button data-finish-lesson>Original finish control</button></html>';
const types={'.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf'};
const checks=[],external=[],unexpected=[],videoRequests=[];let state,serial=0,browser,context;
const pass=label=>{checks.push(label);console.log('PASS '+label);};
const baseHeaders={'access-control-allow-origin':origin,'access-control-allow-headers':'authorization,accept','access-control-allow-methods':'GET,OPTIONS','cache-control':'private, no-store','x-content-type-options':'nosniff'};
function responseDocument() {
  const document=structuredClone(original);document.publication.audience='institutional';
  document.slides[0].blocks.push(structuredClone(image),structuredClone(resource),structuredClone(video));
  if(state.mode==='unknown-reference')document.slides[0].blocks[1].content.asset_id=ids.other;
  return {ok:true,contract:'echs.lesson.store.v1',lesson_id:ids.lesson,class_id:ids.class,publication_id:ids.publication,revision:1,document,
    binding:{account_id:ids.account,organization_id:ids.organization,class_id:ids.class,course_key:'ap-calculus',access_key:'fixture:continuity',route:origin+fixturePath,
      document:{lesson_id:ids.lesson,course_version_id:ids.course,unit_id:document.unit_id,topic_id:document.topic_id,document_version:1,publication_revision:1}}};
}
try {
  browser=await chromium.launch({headless:true,executablePath:process.env.ECHS_CHROMIUM_PATH||undefined});
  context=await browser.newContext({viewport:{width:1180,height:900},serviceWorkers:'block',acceptDownloads:true});
  await context.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.origin==='https://www.youtube-nocookie.com'&&url.pathname==='/embed/abcdefghijk') {
      videoRequests.push(url.href);return route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Isolated video frame</title><p>Original video-provider fixture. No media or third-party requests.</p>'});
    }
    if(url.origin===apiOrigin) {
      if(route.request().method()==='OPTIONS')return route.fulfill({status:204,headers:baseHeaders,body:''});
      const current=state;current.http.push({url:url.href,authorization:route.request().headers().authorization===`Bearer ${token}`,method:route.request().method()});
      if(url.search!==`?class_id=${ids.class}`){unexpected.push(url.href);return route.fulfill({status:400,headers:baseHeaders,contentType:'application/json',body:'{}'});}
      if(url.pathname===`/functions/v1/lesson-api/lessons/${ids.lesson}/published`)return route.fulfill({status:200,headers:baseHeaders,contentType:'application/json',body:JSON.stringify(responseDocument())});
      const match=new RegExp(`^/functions/v1/lesson-api/lessons/${ids.lesson}/assets/([^/]+)(/bytes)?$`).exec(url.pathname);
      if(!match){unexpected.push(url.href);return route.fulfill({status:404,headers:baseHeaders,body:''});}
      const assetId=match[1],isBytes=Boolean(match[2]);
      if(![ids.image,ids.resource].includes(assetId))return route.fulfill({status:404,headers:baseHeaders,contentType:'application/json',body:JSON.stringify({error:{message:'PRIVATE_UNREFERENCED_ASSET'}})});
      const kind=assetId===ids.image?'image':'resource';
      const send=async()=>{
        const headers={...baseHeaders};let status=200,contentType=isBytes?(kind==='image'?'image/png':'application/pdf'):'application/json';
        let metadata=structuredClone(kind==='image'?imageMeta:pdfMeta),body;
        if(!isBytes) {
          if(current.mode==='foreign-asset')metadata.asset_id=ids.other;
          if(current.mode==='wrong-kind')metadata={...pdfMeta,asset_id:ids.image};
          if(current.mode==='external-url')metadata.url='https://attacker.invalid/PRIVATE_ASSET';
          if(current.mode==='metadata-private')metadata.private_notes='PRIVATE_META_CANARY';
          if(current.mode==='metadata-no-cache')delete headers['cache-control'];
          if(current.mode==='metadata-public-cache')headers['cache-control']='public, max-age=60';
          if(current.mode==='metadata-no-mime')contentType='';
          body=JSON.stringify({ok:true,contract:'echs.lesson.store.v1',lesson_id:current.mode==='wrong-lesson'?ids.other:ids.lesson,asset:metadata});
        }else {
          body=Buffer.from(kind==='image'?PNG:PDF);
          if(current.mode==='corrupt')body[body.length-1]^=1;
          if(current.mode==='bytes-no-cache')delete headers['cache-control'];
          if(current.mode==='bytes-public-cache')headers['cache-control']='public, no-store';
          if(current.mode==='bytes-no-mime')contentType='';
          if(current.mode==='bytes-wrong-mime')contentType='text/html';
          if(current.mode==='bytes-too-long')body=Buffer.concat([body,Buffer.from('x')]);
          if(current.mode==='bytes-missing'){status=404;contentType='application/json';body=JSON.stringify({message:'PRIVATE_STORAGE_KEY_CANARY'});}
        }
        if(current.mode===(isBytes?'bytes-redirect':'metadata-redirect')){status=302;headers.location='https://attacker.invalid/PRIVATE_REDIRECT';body='';}
        if(contentType)headers['content-type']=contentType;
        await route.fulfill({status,headers,body});
      };
      if(current.mode===(isBytes?'hold-bytes':'hold-metadata')) {
        return new Promise(resolve=>current.pending.push(async()=>{try{await send();}catch{/* Expected if the old owner already aborted fetch. */}resolve();}));
      }
      return send();
    }
    if(url.origin!==origin||!url.pathname.startsWith(prefix)){external.push(url.href);return route.abort();}
    if(url.pathname===fixturePath)return route.fulfill({status:200,contentType:'text/html',body:html});
    try{
      const file=path.resolve(repository,decodeURIComponent(url.pathname.slice(prefix.length)));
      if(!file.startsWith(path.resolve(repository)+path.sep)||!(await stat(file)).isFile())return route.fulfill({status:404,body:''});
      return route.fulfill({status:200,contentType:types[path.extname(file)]||'application/octet-stream',body:await readFile(file)});
    }catch{return route.fulfill({status:404,body:''});}
  });
  const page=await context.newPage();page.setDefaultTimeout(15000);const errors=[];page.on('pageerror',error=>errors.push(error.message));
  async function open(mode='ok') {
    if(state?.pending.length)await Promise.all(state.pending.splice(0).map(release=>release()));
    state={mode,http:[],pending:[]};
    await page.goto(`${origin}${fixturePath}?course=ap-calculus&unit=0&topic=1.7&accessKey=fixture%3Acontinuity&case=${++serial}#slide=1`,{waitUntil:'domcontentloaded'});
    await page.evaluate(async({ids,token,apiRoot,mode})=>{
      const {mountInstitutionalLesson}=await import('../../../js/lesson-runtime/renderer.mjs');
      const {default:katex}=await import('../node_modules/katex/dist/katex.mjs');
      const f=window.fixture={ready:false,calls:[],aborts:0,created:[],revoked:[],learning:0,storageWrites:0,finish:0,bodyCancelled:0};
      let account={id:ids.account,organization_id:ids.organization,role:'student'},session=token;
      const config={enabled:true,api_base:apiRoot.replace(/\/lesson-api$/,''),site_base:location.origin+'/ECHS-Math/'};
      f.config=config;f.mutate=kind=>{
        if(kind==='account')account={...account,id:ids.other};
        if(kind==='organization')account={...account,organization_id:ids.other};
        if(kind==='token')session='changed-isolated-session';
        if(kind==='route')history.replaceState(null,'','?course=ap-calculus&accessKey=other');
        if(kind==='gate')document.documentElement.dataset.lessonGate='denied';
        if(kind==='config')config.api_base='https://other-project.supabase.co/functions/v1';
        if(kind==='signout')document.dispatchEvent(new Event('echs:institution-signed-out'));
        dispatchEvent(new Event('storage'));
      };
      window.ECHSInstitution={account:()=>account,token:()=>session,config:async()=>config};
      const access={authenticated:true,role:'student',current:account};window.ECHSPortalAccess={ready:Promise.resolve(access),current:access,courseAllowed:course=>course==='ap-calculus'};
      document.documentElement.dataset.lessonGate='allowed';document.documentElement.dataset.echsLessonCourse='ap-calculus';
      window.IntersectionObserver=undefined;
      const nativeSet=Storage.prototype.setItem;Storage.prototype.setItem=function(...args){f.storageWrites++;return nativeSet.apply(this,args);};
      for(const event of ['echs:learning-attempt','echs:learning-session','echs:lesson-completed'])window.addEventListener(event,()=>f.learning++);
      for(const event of ['echs:learning-updated','echs:mastery-authority'])document.addEventListener(event,()=>f.learning++);
      window.ECHSLearning=new Proxy({},{get:()=>()=>{f.learning++;}});
      document.querySelector('[data-finish-lesson]').addEventListener('click',()=>f.finish++);
      const make=URL.createObjectURL.bind(URL),revoke=URL.revokeObjectURL.bind(URL);
      URL.createObjectURL=blob=>{const value=make(blob);f.created.push(value);return value;};URL.revokeObjectURL=value=>{f.revoked.push(value);revoke(value);};
      const nativeFetch=fetch.bind(window);
      window.fetch=async(url,options)=>{
        if(String(url).startsWith(apiRoot)) {
          f.calls.push({url:String(url),method:options.method,authorization:options.headers.Authorization===`Bearer ${token}`,credentials:options.credentials,cache:options.cache,redirect:options.redirect,referrerPolicy:options.referrerPolicy});
          options.signal.addEventListener('abort',()=>f.aborts++,{once:true});
        }
        const response=await nativeFetch(url,options);
        if(String(url).includes('/assets/')){
          if(mode==='foreign-response')Object.defineProperty(response,'url',{value:'https://attacker.invalid/asset'});
          if(mode==='redirected-response')Object.defineProperty(response,'redirected',{value:true});
          if(mode==='stalled-body'&&String(url).includes('/bytes?')) {
            const stalled=new Response(new ReadableStream({cancel(){f.bodyCancelled++;}}),{headers:response.headers});Object.defineProperty(stalled,'url',{value:String(url)});return stalled;
          }
        }
        return response;
      };
      try{f.controller=await mountInstitutionalLesson({root:document.querySelector('#lesson'),lessonId:ids.lesson,classId:ids.class,enabled:true,mathEngine:katex,requestTimeoutMs:3000,accessTimeoutMs:2000,assetTimeoutMs:mode==='stalled-body'?80:3000});}
      catch(error){f.error=error.message;}f.ready=true;
    },{ids,token,apiRoot,mode});
    await page.waitForFunction(()=>fixture.ready);assert.equal(await page.evaluate(()=>fixture.error),undefined,mode);
    assert.equal(await page.evaluate(()=>fixture.controller?.mode),'document',mode);
  }
  const clean=async()=>{
    assert.equal(await page.evaluate(()=>fixture.learning+fixture.storageWrites+fixture.finish+localStorage.length+sessionStorage.length),0);
    assert.equal((await page.locator('#lesson').textContent()).includes('PRIVATE_'),false);
  };
  const loadImage=()=>page.getByRole('button',{name:'Load image',exact:true}).click();
  await open();assert.equal(state.http.length,1);await loadImage();await page.waitForFunction(()=>document.querySelector('img')?.naturalWidth===2);
  const expectedUrls=[`${apiRoot}/lessons/${ids.lesson}/published?class_id=${ids.class}`,`${apiRoot}/lessons/${ids.lesson}/assets/${ids.image}?class_id=${ids.class}`,`${apiRoot}/lessons/${ids.lesson}/assets/${ids.image}/bytes?class_id=${ids.class}`];
  assert.deepEqual(state.http.map(call=>call.url),expectedUrls);
  for(const call of await page.evaluate(()=>fixture.calls)){assert.equal(call.authorization,true);assert.equal(call.method,'GET');assert.equal(call.credentials,'omit');assert.equal(call.cache,'no-store');assert.equal(call.redirect,'error');assert.equal(call.referrerPolicy,'no-referrer');}
  assert.equal(await page.locator('img').getAttribute('alt'),image.content.alt);assert.equal(await page.evaluate(()=>fixture.created.length),1);await clean();
  pass('actual institutional loader fetches current image metadata and SHA-verified bytes through exact class-scoped private endpoints');

  const downloadEvent=page.waitForEvent('download');await page.getByRole('button',{name:'Download PDF',exact:true}).click();const download=await downloadEvent;
  const target=path.join(output,'institutional-synthetic-resource.pdf');await download.saveAs(target);assert.equal(hash(await readFile(target)),hash(PDF));
  assert.deepEqual(state.http.slice(-2).map(call=>call.url),[`${apiRoot}/lessons/${ids.lesson}/assets/${ids.resource}?class_id=${ids.class}`,`${apiRoot}/lessons/${ids.lesson}/assets/${ids.resource}/bytes?class_id=${ids.class}`]);
  await page.waitForFunction(()=>fixture.revoked.includes(fixture.created.at(-1)));await clean();
  pass('explicit institutional PDF download verifies the resource reference and bytes and revokes the download URL');

  for(const mode of ['unknown-reference','foreign-asset','wrong-kind','external-url','metadata-private','wrong-lesson','metadata-no-cache','metadata-public-cache','metadata-no-mime','metadata-redirect','foreign-response','redirected-response']) {
    await open(mode);await loadImage();await page.getByRole('button',{name:'Retry image',exact:true}).waitFor();
    assert.equal(await page.evaluate(()=>fixture.created.length),0,mode);assert.equal(state.http.filter(call=>call.url.includes('/bytes?')).length,0,mode);await clean();
  }
  pass('unreferenced, foreign, private-extra, unsafe-URL and malformed metadata responses fail before any byte request');

  for(const mode of ['corrupt','bytes-no-cache','bytes-public-cache','bytes-no-mime','bytes-wrong-mime','bytes-too-long','bytes-missing','bytes-redirect','stalled-body']) {
    await open(mode);await loadImage();await page.getByRole('button',{name:'Retry image',exact:true}).waitFor();
    assert.equal(await page.evaluate(()=>fixture.created.length),0,mode);assert.equal(await page.locator('img').count(),0,mode);await clean();
    if(mode==='stalled-body')assert.ok(await page.evaluate(()=>fixture.bodyCancelled>0&&fixture.aborts>0));
  }
  pass('corruption, missing privacy/MIME headers, oversized/missing/redirected bodies and stalled streams never become a blob URL');

  for(const phase of ['hold-metadata','hold-bytes'])for(const change of ['account','organization','token','route','gate','config','signout']) {
    await open(phase);await loadImage();
    for(let n=0;n<50&&!state.pending.length;n++)await new Promise(resolve=>setTimeout(resolve,10));assert.equal(state.pending.length,1,`${phase}/${change}`);
    await page.evaluate(change=>fixture.mutate(change),change);await page.waitForFunction(()=>document.querySelector('#lesson').childElementCount===0);
    const releases=state.pending.splice(0);await Promise.all(releases.map(release=>release()));
    await page.evaluate(()=>new Promise(resolve=>setTimeout(resolve,0)));
    assert.equal(await page.evaluate(()=>fixture.created.length),0,`${phase}/${change}`);assert.ok(await page.evaluate(()=>fixture.aborts>0));await clean();
    if(phase==='hold-metadata')assert.equal(state.http.filter(call=>call.url.includes('/bytes?')).length,0);
  }
  pass('account, organization, token, route, gate, configuration and sign-out changes abort pending metadata/bytes and cannot release late assets');

  await open();await loadImage();await page.waitForFunction(()=>document.querySelector('img')?.naturalWidth===2);const oldURL=await page.evaluate(()=>fixture.created[0]);
  await page.evaluate(()=>fixture.mutate('account'));await page.waitForFunction(()=>document.querySelector('#lesson').childElementCount===0);
  assert.equal(await page.evaluate(url=>fixture.revoked.includes(url),oldURL),true);await clean();
  pass('revoking a mounted owner clears private media DOM and revokes an already-created image URL');

  await open();await loadImage();await page.waitForFunction(()=>document.querySelector('img')?.naturalWidth===2);
  assert.equal(videoRequests.length,0);await page.getByRole('button',{name:'Load external video',exact:true}).click();await page.locator('iframe').waitFor();
  await page.evaluate(()=>{fixture.outgoingFrame=document.querySelector('iframe');});
  await page.getByRole('button',{name:'Next',exact:true}).click();assert.equal(await page.evaluate(()=>fixture.controller.slideIndex),1);
  assert.equal(await page.locator('iframe').count(),0);assert.equal(await page.evaluate(()=>fixture.outgoingFrame.getAttribute('src')),null);assert.equal(await page.evaluate(()=>fixture.outgoingFrame.isConnected),false);
  assert.equal(await page.locator('img').count(),1);
  await page.getByRole('button',{name:'Previous',exact:true}).click();assert.equal(await page.evaluate(()=>fixture.controller.slideIndex),0);
  assert.equal(await page.locator('iframe').count(),0);assert.equal(await page.getByRole('button',{name:'Load external video',exact:true}).isEnabled(),true);
  await page.getByRole('button',{name:'Load external video',exact:true}).click();await page.locator('iframe').waitFor();
  await page.getByRole('button',{name:'Next',exact:true}).click();assert.equal(await page.locator('iframe').count(),0);
  await page.getByRole('button',{name:'Previous',exact:true}).click();await clean();
  pass('leaving a slide clears its loaded external iframe source; returning requires new consent and retains image/resource content');
  await page.screenshot({path:path.join(output,'institutional-media-desktop.png'),fullPage:true});await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:path.join(output,'institutional-media-mobile.png'),fullPage:true});
  await page.evaluate(()=>fixture.controller.dispose());assert.equal(await page.evaluate(()=>fixture.created.every(url=>fixture.revoked.includes(url))),true);await clean();
  assert.deepEqual(external,[]);assert.deepEqual(unexpected,[]);assert.deepEqual(errors,[]);
  pass('shared media preserves slide navigation, responsive rendering and complete disposal without mastery or browser-storage writes');
  await writeFile(path.join(output,'institutional-media-results.json'),JSON.stringify({status:'PASS',checks,
    scope:'Actual Chrome institutional loader, media renderer and SHA verification; simulated current school authorization and intercepted HTTP. No production calls, uploads or PostgreSQL authorization claims.',externalRequests:external,unexpectedRequests:unexpected,providerFixtureRequests:videoRequests.length},null,2)+'\n');
}finally{
  if(state?.pending.length)await Promise.all(state.pending.splice(0).map(release=>release()));
  if(context)await context.close();if(browser)await browser.close();
}
