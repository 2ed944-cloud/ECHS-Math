import {chromium} from 'playwright-core';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';

const baseURL=process.env.ECHS_PREVIEW_URL||'http://127.0.0.1:4173';
const outputDir=process.env.ECHS_PREVIEW_OUTPUT||'artifacts/ib-ai-1-6-gdc-v6-1';
const lessonURL=`${baseURL}/lessons/ib-math-ai/unit-1/lessons/IB_AI_SL_1.6_technology_equations_ECHS.html#learn`;
await mkdir(outputDir,{recursive:true});

const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--font-render-hinting=none']});
const report={lessonURL,generatedAt:new Date().toISOString(),checks:[],errors:[],screenshots:[]};
const add=(name,pass,details='')=>{report.checks.push({name,pass,details});if(!pass)report.errors.push(`${name}: ${details}`);};

async function openPage(viewport){
  const context=await browser.newContext({viewport,deviceScaleFactor:1,reducedMotion:'reduce',serviceWorkers:'block'});
  const page=await context.newPage();
  const consoleErrors=[];
  page.on('console',message=>{if(message.type()==='error'&&!/favicon|404/i.test(message.text()))consoleErrors.push(message.text());});
  page.on('pageerror',error=>consoleErrors.push(error.message));
  await page.route('https://ti84calc.com/ti84calc',route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><html><body style="margin:0;font-family:sans-serif;background:#102a43;color:white"><main data-qa-external style="padding:40px"><h1>TI-84 external embed QA</h1><p>Intercepted safely during automated testing.</p></main></body></html>'}));
  await page.goto(lessonURL,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>document.body.dataset.rendered==='1'&&window.LESSON_DATA?.slides?.length===73&&document.getElementById('echs-gdc-launch'),null,{timeout:30000});
  return{context,page,consoleErrors};
}

async function overflow(page,selector){
  return page.evaluate(sel=>{
    const node=document.querySelector(sel);if(!node)return{missing:true};
    return{width:node.clientWidth,scrollWidth:node.scrollWidth,height:node.clientHeight,scrollHeight:node.scrollHeight,horizontal:Math.max(0,node.scrollWidth-node.clientWidth)};
  },selector);
}

try{
  const desktop=await openPage({width:1754,height:877});
  const {page}=desktop;
  add('GDC launch is present',await page.locator('#echs-gdc-launch').isVisible(),'header launcher');
  add('connected GDC route button is present',await page.locator('.gdc-route-resource').isVisible(),'routebar resource button');

  await page.click('#echs-gdc-launch');
  await page.waitForSelector('#echs-gdc-overlay.open');
  add('ECHS GDC opens as an accessible modal',await page.locator('.echs-gdc-dialog[role="dialog"][aria-modal="true"]').count()===1,'modal contract');
  add('four GDC modes are available',await page.locator('.gdc-mode-button').count()===4,`modes ${await page.locator('.gdc-mode-button').count()}`);

  await page.click('#gdc-system-solve');
  const systemText=(await page.locator('#gdc-system-output').innerText()).replace(/\s+/g,' ');
  add('default system solves to x=2 and y=3',/unique solution/i.test(systemText)&&/x=2/.test(systemText)&&/y=3/.test(systemText),systemText);
  const evidence=await page.locator('[data-evidence-field]').evaluateAll(nodes=>Object.fromEntries(nodes.map(node=>[node.dataset.evidenceField,node.value])));
  add('system result populates six-field IB evidence',Object.keys(evidence).length===6&&evidence.entry.includes('Augmented matrix')&&evidence.check.includes('Substitute'),JSON.stringify(evidence));

  await page.click('[data-gdc-mode="polynomial"]');
  await page.click('#gdc-poly-solve');
  const polynomialText=(await page.locator('#gdc-poly-output').innerText()).replace(/\s+/g,' ');
  add('polynomial mode finds the three default roots',/-2/.test(polynomialText)&&/x=1/.test(polynomialText)&&/x=3/.test(polynomialText),polynomialText);

  await page.click('[data-gdc-mode="intersection"]');
  await page.click('#gdc-intersection-solve');
  const intersectionText=(await page.locator('#gdc-intersection-output').innerText()).replace(/\s+/g,' ');
  add('intersection mode independently finds x approximately 4.61013',/4\.6101/.test(intersectionText),intersectionText);

  await page.click('[data-gdc-mode="matrix"]');
  await page.click('[data-matrix-action="det"]');
  const matrixText=(await page.locator('#gdc-matrix-output').innerText()).replace(/\s+/g,' ');
  add('matrix determinant mode returns a finite result',/det\(A\)=/.test(matrixText)&&!/undefined/.test(matrixText),matrixText);

  const gdcOverflow=await overflow(page,'.echs-gdc-dialog');
  add('desktop GDC has no horizontal overflow',gdcOverflow.horizontal<=2,JSON.stringify(gdcOverflow));
  const gdcShot=path.join(outputDir,'desktop-echs-gdc-matrix.png');await page.screenshot({path:gdcShot,fullPage:false});report.screenshots.push(gdcShot);

  await page.click('.gdc-connected-resources');
  await page.waitForSelector('#gdc-external-tools.open');
  const iframe=page.locator('#gdc-embed-stage iframe');
  add('third-party calculator is lazy before learner action',(await iframe.getAttribute('src'))==='about:blank','iframe src before load');
  add('third-party embed is sandboxed',(await iframe.getAttribute('sandbox')||'').includes('allow-scripts')&&(await iframe.getAttribute('referrerpolicy'))==='strict-origin-when-cross-origin',`${await iframe.getAttribute('sandbox')} · ${await iframe.getAttribute('referrerpolicy')}`);
  add('third-party disclaimer is visible',/not an official Texas Instruments product/.test(await page.locator('.gdc-third-party-notice').innerText()),await page.locator('.gdc-third-party-notice').innerText());
  await page.click('#gdc-load-external');
  await page.waitForSelector('#gdc-embed-stage.loaded',{timeout:15000});
  await page.frameLocator('#gdc-embed-stage iframe').locator('[data-qa-external]').waitFor({timeout:10000});
  add('external TI-84 practice loads only after click',await page.frameLocator('#gdc-embed-stage iframe').locator('[data-qa-external]').count()===1,'intercepted external frame loaded');

  await page.click('[data-external-tab="official"]');
  const officialLinks=await page.locator('[data-external-pane="official"] a').evaluateAll(nodes=>nodes.map(node=>({href:node.href,target:node.target,rel:node.rel})));
  add('official TI pane exposes three authoritative links',officialLinks.length===3&&officialLinks.every(link=>link.href.startsWith('https://education.ti.com/')),JSON.stringify(officialLinks));
  add('official links open safely in new tabs',officialLinks.every(link=>link.target==='_blank'&&link.rel.includes('noopener')&&link.rel.includes('noreferrer')),JSON.stringify(officialLinks));
  const externalOverflow=await overflow(page,'.gdc-external-dialog');
  add('desktop connected resources have no horizontal overflow',externalOverflow.horizontal<=2,JSON.stringify(externalOverflow));
  const officialShot=path.join(outputDir,'desktop-official-ti-resources.png');await page.screenshot({path:officialShot,fullPage:false});report.screenshots.push(officialShot);

  await page.click('[data-external-tab="guidance"]');
  add('classroom guidance contains four-stage workflow',await page.locator('.gdc-guidance-grid article').count()===4,`cards ${await page.locator('.gdc-guidance-grid article').count()}`);
  add('desktop page has no console errors',desktop.consoleErrors.length===0,desktop.consoleErrors.join('\n'));
  await desktop.context.close();

  const mobile=await openPage({width:390,height:844});
  await mobile.page.click('#echs-gdc-launch');
  await mobile.page.waitForSelector('#echs-gdc-overlay.open');
  let mobileOverflow=await overflow(mobile.page,'.echs-gdc-dialog');
  add('mobile ECHS GDC fits the viewport',mobileOverflow.horizontal<=2,JSON.stringify(mobileOverflow));
  await mobile.page.click('[data-gdc-mode="systems"]');
  await mobile.page.click('#gdc-system-solve');
  add('mobile system solve remains operable',/unique solution/i.test(await mobile.page.locator('#gdc-system-output').innerText()),await mobile.page.locator('#gdc-system-output').innerText());
  await mobile.page.click('.gdc-connected-resources');
  await mobile.page.waitForSelector('#gdc-external-tools.open');
  mobileOverflow=await overflow(mobile.page,'.gdc-external-dialog');
  add('mobile connected resources fit the viewport',mobileOverflow.horizontal<=2,JSON.stringify(mobileOverflow));
  const mobileShot=path.join(outputDir,'mobile-connected-gdc-tools.png');await mobile.page.screenshot({path:mobileShot,fullPage:false});report.screenshots.push(mobileShot);
  add('mobile page has no console errors',mobile.consoleErrors.length===0,mobile.consoleErrors.join('\n'));
  await mobile.context.close();
}finally{
  await browser.close();
}

await writeFile(path.join(outputDir,'report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({checks:report.checks.length,errors:report.errors.length,screenshots:report.screenshots.length},null,2));
if(report.errors.length){for(const error of report.errors)console.error(`ERROR: ${error}`);process.exit(1);}
