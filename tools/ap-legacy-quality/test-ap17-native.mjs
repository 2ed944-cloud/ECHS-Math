import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const require = createRequire(import.meta.url);
const arg = name => { const i = process.argv.indexOf(name); return i < 0 ? null : process.argv[i + 1]; };
const here = path.dirname(fileURLToPath(import.meta.url));
assert.ok(arg('--repo') && arg('--report-dir'), 'Supply --repo and a fresh --report-dir.');
const repo = path.resolve(arg('--repo')), output = path.resolve(arg('--report-dir'));
await mkdir(output, {recursive:false});
const sha = raw => createHash('sha256').update(raw).digest('hex');
const metaPath = path.join(here, 'ap17-source-preservation.json');
const metaBytes = await readFile(metaPath), meta = JSON.parse(metaBytes);
const sourcePath = path.join(repo, meta.path);
const candidate = await readFile(sourcePath);
assert.equal(sha(candidate), meta.candidate_sha256); assert.equal(candidate.length, meta.candidate_bytes);
const harnessPath = fileURLToPath(import.meta.url), harnessBytes = await readFile(harnessPath);
const checkedSources = new Map([[metaPath, metaBytes], [sourcePath, candidate], [harnessPath, harnessBytes]]);
const requests = [], blocked = [], errors = [], pageErrors = [], consoleErrors = [], proofs = [], checks = [], screenshots = [];
const setup = {nodeLoopback:false, nodeBodySha256:null, browserDelivery:'exact pinned HTML route.fulfill; browser HTTP transport not proven', fulfilled:[], routeRequests:[], browserRequests:[], browserRequestFailures:[]};
const sockets = new Set(), contexts = new Set();
let browser, origin, browserVersion, sourceStable = false;
const cleanup = {contexts_closed:false, browser_closed:false, server_closed:false, sockets_remaining:null};
const server = createServer((request, response) => {
  const pathname = new URL(request.url, 'http://127.0.0.1').pathname;
  if (request.method === 'GET' && pathname === '/' + meta.path) {
    requests.push({path:meta.path, status:200});
    response.writeHead(200, {'Content-Type':'text/html; charset=utf-8', 'Cache-Control':'no-store'}); response.end(candidate);
  } else if (request.method === 'GET' && pathname === '/favicon.ico') { response.writeHead(204); response.end(); }
  else { requests.push({path:'rejected', status:404}); response.writeHead(404); response.end('Not found'); }
});
server.on('connection', socket => { sockets.add(socket); socket.once('close', () => sockets.delete(socket)); });
function bounded(promise, ms, label) { let timer; return Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(Error(label)), ms); })]).finally(() => clearTimeout(timer)); }
async function check(name, fn) { await bounded(fn(), 30000, name + ' deadline'); checks.push({name, status:'PASS'}); console.log('PASS ' + name); }
async function attempt(name, fn) { try { await fn(); } catch (error) { errors.push({stage:name, message:String(error.message || error)}); } }

// Transparent observation: every canvas method still invokes its actual native method.
// Capture only the two target canvases; reset records on clearRect for the latest redraw.
function observeCanvas() {
  const data = {}, contexts = new WeakMap();
  const proto = CanvasRenderingContext2D.prototype;
  const target = ctx => {
    const key = ctx.canvas?.dataset?.staticVisual;
    return ['rationalendworked', 'rationalendstudent'].includes(key) ? key : null;
  };
  for (const name of ['clearRect', 'beginPath', 'moveTo', 'lineTo', 'stroke', 'fillText']) {
    const original = proto[name];
    proto[name] = function(...args) {
      const result = Reflect.apply(original, this, args), key = target(this);
      if (!key) return result;
      if (name === 'clearRect') { data[key] = {strokes:[], texts:[]}; contexts.set(this, []); }
      const record = data[key] ||= {strokes:[], texts:[]};
      if (name === 'beginPath') contexts.set(this, []);
      else if (name === 'moveTo' || name === 'lineTo') {
        const points = contexts.get(this) || [];
        if (points.length < 3000) points.push({op:name, x:args[0], y:args[1]});
        contexts.set(this, points);
      } else if (name === 'stroke' && record.strokes.length < 80) record.strokes.push({color:this.strokeStyle, dash:this.getLineDash(), points:(contexts.get(this) || []).slice()});
      else if (name === 'fillText' && record.texts.length < 128) record.texts.push({text:String(args[0]), x:args[1], y:args[2]});
      return result;
    };
  }
  window.__ap17CanvasObservation = data;
}
const cases = [
  {slide:21, key:'rationalendworked', caption:'unit-figure-caption-17', tex:'R(x)=(-4x^5+x)/(2x^5-7)', poles:[(7/2)**(1/5)], f:x=>(-4*x**5+x)/(2*x**5-7)},
  {slide:22, key:'rationalendstudent', caption:'unit-figure-caption-18', tex:'R(x)=\\dfrac{6x^4-x+2}{-3x^4+5}', poles:[-((5/3)**(1/4)), (5/3)**(1/4)], f:x=>(6*x**4-x+2)/(-3*x**4+5)},
];
try {
  await bounded(new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', () => { server.removeListener('error', reject); resolve(); }); }), 3000, 'server listen');
  origin = `http://127.0.0.1:${server.address().port}`;
  const preflight = await bounded(fetch(origin + '/' + meta.path).then(async response => { assert.equal(response.status, 200); return Buffer.from(await response.arrayBuffer()); }), 3000, 'node loopback preflight');
  assert.ok(preflight.equals(candidate)); setup.nodeLoopback = true; setup.nodeBodySha256 = sha(preflight);
  const {chromium} = require(process.env.ECHS_PLAYWRIGHT_MODULE || 'playwright');
  browser = await chromium.launch({headless:true, timeout:20000, ...(process.env.ECHS_CHROMIUM_PATH ? {executablePath:process.env.ECHS_CHROMIUM_PATH} : {})});
  browserVersion = browser.version();
  for (const viewport of [{width:1365, height:900}, {width:390, height:844}]) {
    const context = await browser.newContext({viewport, deviceScaleFactor:1, reducedMotion:'reduce', serviceWorkers:'block'});
    contexts.add(context);
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      if(setup.routeRequests.length<32)setup.routeRequests.push({pathname:url.pathname, sameOrigin:url.origin===origin});
      if (url.origin === origin && url.pathname === '/' + meta.path && route.request().method() === 'GET') { setup.fulfilled.push({path:meta.path,sha256:sha(candidate)}); return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:candidate}); }
      if (url.origin === origin && url.pathname === '/favicon.ico') return route.fulfill({status:204,body:''});
      blocked.push({scheme:url.protocol, origin:url.origin}); return route.abort();
    });
    await context.addInitScript(observeCanvas);
    const page = await context.newPage(); page.setDefaultTimeout(10000);
    page.on('request', request => { if(setup.browserRequests.length<32)setup.browserRequests.push({pathname:new URL(request.url()).pathname,method:request.method()}); });
    page.on('requestfailed', request => { if(setup.browserRequestFailures.length<32)setup.browserRequestFailures.push({pathname:new URL(request.url()).pathname,error:request.failure()?.errorText}); });
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    const response = await page.goto(origin + '/' + meta.path + '#slide-21', {waitUntil:'load', timeout:20000});
    assert.ok((await response.body()).equals(candidate), 'native browser received exact candidate source bytes');
    for (const row of cases) await check(`native ${viewport.width}px slide ${row.slide} reveal, formula and canvas`, async () => {
      if (row.slide === 22) await page.locator('#nextBtn').click();
      const slide = page.locator(`section.slide[data-slide-number="${row.slide}"]`);
      await page.waitForFunction(number => document.querySelector(`section.slide[data-slide-number="${number}"]`)?.classList.contains('active'), row.slide);
      assert.equal(await slide.getAttribute('aria-hidden'), 'false');
      assert.equal(await page.locator('#slideCounter').innerText(), `${row.slide} / 56`);
      const canvas = slide.locator(`canvas[data-static-visual="${row.key}"]`);
      assert.equal(await canvas.getAttribute('aria-describedby'), row.caption);
      assert.ok((await canvas.getAttribute('aria-label')).includes(row.tex));
      assert.ok(await slide.locator('[data-tex]').evaluateAll((nodes, tex) => nodes.some(node => node.dataset.tex === tex), row.tex));
      assert.equal(await canvas.isVisible(), false);
      const reveal = slide.locator('.visual-reveal > button.lesson-reveal-button');
      await reveal.click(); await canvas.waitFor({state:'visible'}); await canvas.scrollIntoViewIfNeeded();
      await page.waitForFunction(key => window.__ap17CanvasObservation[key]?.texts.some(row => row.text === 'y = -2'), row.key);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const measured = await canvas.evaluate((node, key) => {
        const rect = node.getBoundingClientRect(), h = parseFloat(getComputedStyle(node).height), w = rect.width;
        const expectedY = 24 + (4 - (-2)) / 11 * (h - 24 - 38);
        const ctx = node.getContext('2d'), image = ctx.getImageData(0, 0, node.width, node.height);
        let goldColumns = 0, nonwhite = 0;
        for (let x = 48; x < w - 20; x++) {
          let gold = false;
          for (let y = Math.floor(expectedY) - 2; y <= Math.ceil(expectedY) + 2; y++) {
            const i = (y * image.width + x) * 4;
            if (Math.abs(image.data[i]-196)<15 && Math.abs(image.data[i+1]-147)<15 && Math.abs(image.data[i+2]-46)<15 && image.data[i+3] > 200) gold = true;
          }
          if (gold) goldColumns++;
        }
        for (let i = 0; i < image.data.length; i += 4) if (image.data[i+3] > 0 && (image.data[i] < 245 || image.data[i+1] < 245 || image.data[i+2] < 245)) nonwhite++;
        return {w,h,width:node.width,height:node.height, expectedY,goldColumns,nonwhite,
          renderer:node.dataset.visualRenderer, bounds:{left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom},
          bodyOverflow:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth,
          capture:window.__ap17CanvasObservation[key]};
      }, row.key);
      assert.equal(measured.renderer, 'interaction'); assert.ok(measured.w > 150 && measured.h > 200);
      assert.ok(measured.bodyOverflow <= 2); assert.ok(measured.bounds.left >= -1 && measured.bounds.right <= viewport.width + 1);
      assert.ok(measured.goldColumns > (measured.w - 68) * .25, 'native pixels form a gold horizontal asymptote at y=-2');
      assert.ok(measured.nonwhite > 500);
      const horizontal = measured.capture.strokes.filter(stroke => stroke.color === '#c4932e' && stroke.points.length === 2 && Math.abs(stroke.points[0].y - stroke.points[1].y) < 1e-7);
      assert.equal(horizontal.length, 1); assert.deepEqual(horizontal[0].dash, [7,6]);
      assert.ok(horizontal[0].points.every(point => Math.abs(point.y - measured.expectedY) < 1e-7));
      const curves = measured.capture.strokes.filter(stroke => stroke.color === '#6f1738'); assert.equal(curves.length, row.poles.length + 1);
      let graphPoints = 0;
      for (const curve of curves) {
        const decoded = curve.points.map(point => ({x:-6 + (point.x - 48) / (measured.w - 68) * 12, y:4 - (point.y - 24) / (measured.h - 62) * 11}));
        assert.ok(decoded.length > 10);
        for (const point of decoded) { assert.ok(Math.abs(point.y - row.f(point.x)) < 1e-8); assert.ok(point.y >= -7 - 1e-8 && point.y <= 4 + 1e-8); graphPoints++; }
        for (const pole of row.poles) assert.ok(!(Math.min(...decoded.map(point => point.x)) < pole && Math.max(...decoded.map(point => point.x)) > pole));
      }
      proofs.push({viewport,slide:row.slide,key:row.key,caption:row.caption,formula:row.tex,w:measured.w,h:measured.h,
        nativeGraphPoints:graphPoints,goldColumns:measured.goldColumns,horizontalCanvasY:measured.expectedY,
        horizontalAsymptote:-2,bodyOverflow:measured.bodyOverflow,renderer:measured.renderer});
      const stem = `${viewport.width}-slide-${row.slide}`;
      for (const [locator, name] of [[page, stem+'.png'], [canvas, stem+'-canvas.png']]) { await locator.screenshot({path:path.join(output,name)}); screenshots.push(name); }
      await reveal.click(); assert.equal(await canvas.isVisible(), false); assert.equal(await reveal.getAttribute('aria-expanded'), 'false');
    });
    await bounded(context.close(), 5000, 'context close'); contexts.delete(context);
  }
  await check('off-origin isolation and no browser errors', async () => {
    assert.deepEqual(pageErrors, []); assert.deepEqual(consoleErrors, []); assert.deepEqual(blocked, []);
    assert.equal(requests.filter(row => row.path === meta.path).length, 1); assert.ok(requests.every(row => row.status === 200)); assert.equal(setup.fulfilled.length, 2);
  });
} catch (error) { errors.push({stage:'native', message:String(error.stack || error)}); }
finally {
  await attempt('contexts', async () => { const failures = []; for (const context of contexts) { try { await bounded(context.close(), 5000, 'context cleanup'); contexts.delete(context); } catch (error) { failures.push(error); } } cleanup.contexts_closed = contexts.size === 0; if (failures.length) throw failures[0]; });
  await attempt('browser', async () => { if (browser) await bounded(browser.close(), 10000, 'browser cleanup'); cleanup.browser_closed = !browser?.isConnected(); });
  await attempt('server', async () => { const done = new Promise((resolve,reject) => server.close(error => error ? reject(error) : resolve())); server.closeAllConnections(); for (const socket of sockets) socket.destroy(); await bounded(done, 3000, 'server cleanup'); cleanup.server_closed = !server.listening; });
  await new Promise(resolve => setImmediate(resolve)); cleanup.sockets_remaining = sockets.size;
  await attempt('sources', async () => { for (const [file, bytes] of checkedSources) assert.ok((await readFile(file)).equals(bytes), file); sourceStable = true; });
  if (!cleanup.contexts_closed || !cleanup.browser_closed || !cleanup.server_closed || cleanup.sockets_remaining !== 0) errors.push({stage:'cleanup',message:'Incomplete owned cleanup.'});
  const report = {contract:'echs.ap17.native-figures.v1',status:errors.length?'FAIL':'PASS',browser:browserVersion || null,
    scope:'Actual canonical standalone AP1.7 lesson with an exact candidate HTML route.fulfill overlay, native canvas draw/pixel observation and desktop/mobile reveal controls. Transparent canvas method forwarding; no mocked drawing, account, auth, remote service or active source changes. Browser HTTP transport is not established; this test intentionally uses exact source bytes as its document fixture. Source inverse preservation is checked by test-ap17-figures.mjs with its pinned baseline.',
    source:{path:meta.path,original_sha256:meta.original_sha256,candidate_sha256:sha(candidate)},harness_sha256:sha(harnessBytes),preservation_sha256:sha(metaBytes),
    setup,checks,proofs,requests,blocked,pageErrors,consoleErrors,sourceStable,cleanup,screenshots,errors};
  await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({status:report.status,checks:checks.length,proofs:proofs.length,errors}));
  if (errors.length) process.exitCode = 1;
}
