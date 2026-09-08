import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { parseYouTubeVideoId } from '../../js/lesson-studio/media-editor.mjs';

const repository = fileURLToPath(new URL('../../', import.meta.url));
const require = createRequire(new URL('../../question-bank/official/tools/package.json', import.meta.url));
const { chromium } = require('playwright');
const output = process.env.ECHS_MEDIA_EDITOR_EVIDENCE || path.join(repository, 'artifacts/lesson-studio');
await mkdir(output, { recursive: true });
const origin = 'https://media-editor-fixture.example.test', checks = [], errors = [], external = [], failedAssets = [];
const pass = label => { checks.push(label); console.log('PASS ' + label); };
const videoId = 'AbCdEf123_-';
for (const url of [`https://www.youtube.com/watch?v=${videoId}`, `https://youtu.be/${videoId}?t=20`, `https://www.youtube.com/embed/${videoId}`, `https://youtube.com/shorts/${videoId}`, `https://www.youtube-nocookie.com/embed/${videoId}`]) assert.equal(parseYouTubeVideoId(url), videoId);
for (const url of ['javascript:alert(1)', `<iframe src="https://youtube.com/embed/${videoId}">`, `https://youtube.com.evil.example/watch?v=${videoId}`, `https://user:pass@youtube.com/watch?v=${videoId}`,
  `http://youtube.com/watch?v=${videoId}`, `https://youtube.com:8443/watch?v=${videoId}`, `https://youtube.com/watch?v=${videoId}&v=${videoId}`, 'https://youtu.be/not-valid', 'https://vimeo.com/12345']) assert.throws(() => parseYouTubeVideoId(url));
pass('only recognized HTTPS YouTube video links produce canonical provider IDs; markup and foreign providers fail');

const module = `import {createMediaEditor} from '/js/lesson-studio/media-editor.mjs';
import katex from '/lessons/ib-math-ai/unit-1/assets/js/katex.js';
window.fixture={ready:true,changes:[],invalids:[],calls:[],queue:[],holds:[],controller:null,
receipt(number=1,mime='image/png'){return {asset_id:'80000000-0000-4000-8000-'+String(number).padStart(12,'0'),mime_type:mime,byte_length:68,width:mime==='application/pdf'?null:1,height:mime==='application/pdf'?null:1,sha256:'a'.repeat(64),state:'ready'}},
mount(type,value=null){this.controller?.dispose();this.changes=[];this.invalids=[];this.calls=[];this.queue=[];this.holds=[];
this.controller=createMediaEditor({root:document.querySelector('#editor'),type,value,mathEngine:katex,onChange:value=>this.changes.push(value),onInvalid:error=>this.invalids.push(error),
uploadAsset:(file,{signal})=>{const entry={name:file.name,type:file.type,size:file.size,signal};this.calls.push(entry);const plan=this.queue.shift();
if(plan==='hold')return new Promise((resolve,reject)=>this.holds.push({resolve,reject}));if(plan?.error)return Promise.reject(new Error(plan.error));
return Promise.resolve(plan?.receipt||this.receipt(this.calls.length,file.type))}});},
get(){return this.controller.getValue()},fails(){try{this.get();return false}catch{return true}}};`;
const browser = await chromium.launch({ headless: true, executablePath: process.env.ECHS_CHROMIUM_PATH || undefined });
const context = await browser.newContext({ viewport: { width: 1250, height: 1000 }, serviceWorkers: 'block' });
const types = { '.mjs': 'text/javascript', '.js': 'text/javascript', '.css': 'text/css', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf' };
await context.route('**/*', async route => {
  const url = new URL(route.request().url()); if (url.origin !== origin) { external.push(url.href); return route.abort(); }
  if (url.pathname === '/__media.html') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Original media editor fixture</title><link rel="stylesheet" href="/css/lesson-studio.css"><link rel="stylesheet" href="/lessons/ib-math-ai/unit-1/assets/css/katex.css"></head><body><main><h1>Original media editor fixture</h1><div id="editor"></div></main><script type="module" src="/__fixture.mjs"></script></body></html>' });
  if (url.pathname === '/__fixture.mjs') return route.fulfill({ contentType: 'text/javascript', body: module });
  const file = path.resolve(repository, '.' + decodeURIComponent(url.pathname)); if (!file.startsWith(path.resolve(repository) + path.sep)) return route.fulfill({ status: 403, body: '' });
  try { return route.fulfill({ contentType: types[path.extname(file)] || 'application/octet-stream', body: await readFile(file) }); } catch { return route.fulfill({ status: 404, body: '' }); }
});
const page = await context.newPage(); page.setDefaultTimeout(10000); page.on('pageerror', error => errors.push(error.message));
page.on('response', response => { if (response.status() >= 400 && /\.(?:css|js|mjs|woff2?|ttf)(?:\?|$)/.test(response.url())) failedAssets.push(response.url()); });
const mount = (type, value = null) => page.evaluate(({ type, value }) => fixture.mount(type, value), { type, value });
const get = () => page.evaluate(() => fixture.get());
const field = key => page.locator(`[data-media-field="${key}"]`);
const action = key => page.locator(`[data-media-action="${key}"]`);
const imageValue = { asset_id: '80000000-0000-4000-8000-000000000001', alt: 'An original teacher-created example graph.', decorative: false, caption: '', description: '' };
const png = { name: 'original-fixture.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a1S8AAAAASUVORK5CYII=', 'base64') };
async function uploadReady(file = png) { await field('file').setInputFiles(file); await page.waitForFunction(() => !document.querySelector('[data-media-action="cancel-upload"]') || document.querySelector('[data-media-action="cancel-upload"]').hidden); }
async function selectAllCell() { await page.locator('.media-editor-cell .rich-editor-surface').evaluate(node => { node.focus(); const range = document.createRange(); range.selectNodeContents(node); const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range); document.dispatchEvent(new Event('selectionchange')); }); }
try {
  await page.goto(origin + '/__media.html'); await page.waitForFunction(() => fixture?.ready);
  await mount('image'); assert.equal(await page.evaluate(() => fixture.changes.length), 0); assert.equal(await page.evaluate(() => fixture.fails()), true);
  await page.evaluate(() => fixture.queue.push('hold')); await field('file').setInputFiles(png); await page.waitForFunction(() => fixture.holds.length === 1);
  await field('alt').fill(imageValue.alt); await field('caption').fill('Original uploaded image.');
  assert.equal(await page.evaluate(() => fixture.fails()), true); assert.equal(await page.evaluate(() => fixture.changes.length), 0);
  await page.evaluate(() => fixture.holds[0].resolve(fixture.receipt())); await page.waitForFunction(() => !fixture.fails());
  assert.deepEqual(await get(), { ...imageValue, caption: 'Original uploaded image.' });
  assert.deepEqual(Object.keys(await get()).sort(), ['alt', 'asset_id', 'caption', 'decorative', 'description']);
  assert.equal(await page.locator('#editor img,#editor iframe,#editor object').count(), 0);
  pass('new image insertion stays invalid until a ready upload and meaningful alternative text exist; only asset reference metadata is serialized');

  await field('decorative').check(); assert.equal((await get()).alt, ''); assert.equal(await field('alt').isDisabled(), true);
  await field('decorative').uncheck(); assert.equal((await get()).alt, imageValue.alt);
  await field('alt').fill(''); assert.equal(await page.evaluate(() => fixture.fails()), true);
  const beforeRecovery = await page.evaluate(() => fixture.changes.length); await field('alt').fill(imageValue.alt);
  assert.equal(await page.evaluate(() => fixture.changes.length), beforeRecovery + 1); assert.equal((await get()).alt, imageValue.alt);
  pass('decorative images require empty alternative text while normal images require meaningful text, and exact-value correction clears invalid state');

  await mount('image', imageValue); await page.evaluate(() => fixture.queue.push('hold', 'hold'));
  await field('file').setInputFiles(png); await page.waitForFunction(() => fixture.holds.length === 1);
  await field('file').setInputFiles({ ...png, name: 'replacement-fixture.png' }); await page.waitForFunction(() => fixture.holds.length === 2);
  assert.equal(await page.evaluate(() => fixture.calls[0].signal.aborted), true);
  await page.evaluate(() => fixture.holds[1].resolve(fixture.receipt(2))); await page.waitForFunction(() => !fixture.fails());
  await page.evaluate(() => fixture.holds[0].resolve(fixture.receipt(3))); await page.waitForTimeout(50);
  assert.equal((await get()).asset_id, '80000000-0000-4000-8000-000000000002');
  pass('replacing a pending file aborts its upload and ignores an older successful response');

  for (const invalidReceipt of ['extra-url', 'wrong-state', 'wrong-mime', 'too-large', 'bad-dimensions', 'getter']) {
    await mount('image', imageValue);
    await page.evaluate(kind => {
      const receipt = fixture.receipt(4);
      if (kind === 'extra-url') receipt.signed_url = 'https://private.example.invalid/asset';
      if (kind === 'wrong-state') receipt.state = 'pending';
      if (kind === 'wrong-mime') receipt.mime_type = 'text/html';
      if (kind === 'too-large') receipt.byte_length = 4 * 1024 * 1024 + 1;
      if (kind === 'bad-dimensions') receipt.width = 4097;
      if (kind === 'getter') Object.defineProperty(receipt, 'asset_id', { enumerable: true, get() { window.receiptGetterExecuted = true; return 'x'; } });
      fixture.queue.push({ receipt });
    }, invalidReceipt);
    await field('file').setInputFiles(png); await page.waitForFunction(() => document.querySelector('.media-editor-upload-status').textContent === 'Upload not confirmed.');
    assert.equal(await page.evaluate(() => fixture.fails()), true); assert.equal(await page.evaluate(() => fixture.changes.length), 0);
    assert.equal(await page.evaluate(() => window.receiptGetterExecuted), undefined);
    await action('cancel-upload').click(); assert.deepEqual(await get(), imageValue);
  }
  pass('upload receipts reject extra URLs, incomplete state, invalid metadata and accessors; explicit cancellation retains the previous asset');

  await mount('image'); await field('file').setInputFiles({ name: 'unsafe.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg></svg>') });
  assert.equal(await page.evaluate(() => fixture.calls.length), 0); assert.equal(await page.evaluate(() => fixture.fails()), true);
  await field('file').setInputFiles({ name: 'oversized.png', mimeType: 'image/png', buffer: Buffer.alloc(4 * 1024 * 1024 + 1) });
  assert.equal(await page.evaluate(() => fixture.calls.length), 0);
  pass('unsupported or oversized files are rejected before the injected upload function is called');

  await mount('resource'); await field('title').fill('Original teacher handout'); await field('description').fill('Read the original worked example and compare the reasoning.');
  await uploadReady({ name: 'original-handout.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.7\nOriginal synthetic fixture only.\n%%EOF') });
  assert.deepEqual(await get(), { asset_id: imageValue.asset_id, title: 'Original teacher handout', description: 'Read the original worked example and compare the reasoning.' });
  assert.equal(await page.evaluate(() => fixture.calls[0].type), 'application/pdf');
  pass('PDF resources require a ready reference, title and meaningful description without persisting file bytes or a download URL');

  await mount('video'); await field('video-url').fill(`https://youtu.be/${videoId}?tracking=discarded`); await field('title').fill('Original video explanation');
  await field('transcript').fill('Teacher-provided transcript of the original explanation.'); await field('start_seconds').fill('12');
  assert.deepEqual(await get(), { provider: 'youtube', video_id: videoId, title: 'Original video explanation', transcript: 'Teacher-provided transcript of the original explanation.', start_seconds: 12 });
  await field('start_seconds').fill('1.5'); assert.equal(await page.evaluate(() => fixture.fails()), true);
  await field('start_seconds').fill('12'); assert.equal((await get()).start_seconds, 12);
  await field('video-url').fill('https://example.org/video'); assert.equal(await page.evaluate(() => fixture.fails()), true);
  assert.equal(await field('video-url').inputValue(), 'https://example.org/video');
  await field('video-url').fill(`https://www.youtube.com/watch?v=${videoId}`); assert.equal((await get()).video_id, videoId);
  assert.equal(await page.locator('#editor iframe').count(), 0);
  pass('video metadata keeps only a recognized provider ID and bounded start time, requires a transcript and retains invalid URL buffers for correction');

  await mount('table'); assert.equal(await page.evaluate(() => fixture.changes.length), 0);
  await field('caption').fill('Original measured values'); await page.getByRole('textbox', { name: 'Column 1 heading', exact: true }).fill('Input');
  await page.getByRole('textbox', { name: 'Column 2 heading', exact: true }).fill('Output');
  const cell = page.locator('.media-editor-cell .rich-editor-surface'); await cell.fill('First value'); await selectAllCell();
  await page.getByRole('button', { name: 'Bold', exact: true }).click();
  assert.deepEqual((await get()).rows[0].cells[0], [{ type: 'text', text: 'First value', marks: ['strong'] }]);
  assert.equal(await page.getByRole('button', { name: 'Bulleted list', exact: true }).count(), 0);
  await cell.evaluate(node => { node.focus(); const range = document.createRange(); range.selectNodeContents(node); range.collapse(false); const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range); document.dispatchEvent(new Event('selectionchange')); });
  await page.getByRole('button', { name: 'Insert mathematics', exact: true }).click();
  const mathDialog = page.getByRole('dialog', { name: 'Inline mathematics', exact: true }); await mathDialog.waitFor({ state: 'visible' });
  await mathDialog.getByRole('button', { name: 'Insert mathematics', exact: true }).click();
  assert.equal((await get()).rows[0].cells[0][1].type, 'math'); assert.equal((await get()).rows[0].cells[0][1].source.mode, 'visual');
  await field('row_header').check(); assert.equal((await get()).row_header, true); assert.equal(await page.locator('.media-editor-table tbody th[scope="row"]').count(), 1);
  pass('table cells use canonical inline formatting and visual mathematics with labeled column headings and optional row headers');

  await action('add-row').click(); await cell.fill('Second row value'); const secondRow = (await get()).rows[1].id;
  await action('row-up').click(); assert.equal((await get()).rows[0].id, secondRow);
  assert.equal(await cell.getAttribute('aria-label'), 'Cell text: Row 1, Input');
  await action('row-down').click(); await action('remove-row').click(); assert.equal((await get()).rows.length, 1);
  await action('add-column').click(); await cell.fill('A later column value');
  await action('undo').click(); let table = await get(); assert.equal(table.rows.length, 2); assert.equal(table.columns.length, 3);
  assert.equal(table.rows.find(row => row.id === secondRow).cells[0][0].text, 'Second row value');
  assert.ok(table.rows[0].cells.some(children => children[0]?.text === 'A later column value'));
  await action('remove-column').click(); const remainingColumnCount = (await get()).columns.length;
  await action('add-row').click(); await action('undo').click(); table = await get();
  assert.equal(table.columns.length, remainingColumnCount + 1); assert.ok(table.rows.every(row => row.cells.length === table.columns.length));
  assert.equal(new Set(table.rows.map(row => row.id)).size, table.rows.length); assert.equal(new Set(table.columns.map(column => column.id)).size, table.columns.length);
  pass('row/column insertion, movement, deletion and undo preserve later edits, exact rectangular dimensions and stable unique IDs');

  await cell.fill(''); assert.equal(await page.evaluate(() => fixture.fails()), true);
  const selectedBefore = await page.locator('.media-editor-table [aria-pressed="true"]').getAttribute('aria-label');
  await page.locator('.media-editor-table [data-media-action="select-cell"]').last().click();
  assert.equal(await page.locator('.media-editor-table [aria-pressed="true"]').getAttribute('aria-label'), selectedBefore);
  await action('add-row').click(); assert.equal(await cell.textContent(), '');
  await cell.fill('Recovered original cell'); assert.equal(await page.evaluate(() => fixture.fails()), false);
  await page.getByRole('textbox', { name: 'Column 1 heading', exact: true }).fill(''); await action('add-row').click();
  await page.getByRole('textbox', { name: 'Column 1 heading', exact: true }).fill('Recovered column heading');
  assert.equal((await get()).columns[0].label, 'Recovered column heading');
  pass('invalid cell or heading buffers block structural changes and recover without losing the selected editor or later heading edits');

  await page.screenshot({ path: path.join(output, 'media-editor-table.png'), fullPage: true });
  const bounded = { caption: 'Bounded original table', columns: Array.from({ length: 12 }, (_, index) => ({ id: `c-${index}`, label: `Column ${index + 1}` })),
    rows: Array.from({ length: 100 }, (_, index) => ({ id: `r-${index}`, cells: Array.from({ length: 12 }, () => [{ type: 'text', text: 'Value' }]) })), row_header: false };
  await mount('table', bounded); assert.equal(await action('add-row').isDisabled(), true); assert.equal(await action('add-column').isDisabled(), true);
  assert.equal((await get()).rows.length, 100); assert.equal((await get()).columns.length, 12);
  pass('table editors enforce the 100-row and 12-column limits without truncating existing content');

  await mount('image', imageValue); await page.evaluate(() => fixture.queue.push('hold')); await field('file').setInputFiles(png); await page.waitForFunction(() => fixture.holds.length === 1);
  await page.evaluate(() => { window.detachedAlt = document.querySelector('[data-media-field="alt"]'); fixture.controller.dispose(); });
  assert.equal(await page.evaluate(() => fixture.calls[0].signal.aborted), true);
  await page.evaluate(() => fixture.holds[0].resolve(fixture.receipt(8))); await page.waitForTimeout(50);
  assert.equal(await page.locator('#editor').textContent(), ''); assert.equal(await page.evaluate(() => detachedAlt.value), '');
  assert.equal(await page.evaluate(() => fixture.changes.length), 0); assert.equal(await page.evaluate(() => fixture.fails()), true);
  assert.deepEqual(await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage) })), { local: [], session: [] });
  assert.deepEqual(errors, []); assert.deepEqual(external, []); assert.deepEqual(failedAssets, []);
  pass('disposal aborts uploads, ignores late ready responses and clears private DOM without storage or external requests');
  await writeFile(path.join(output, 'media-editor-results.json'), JSON.stringify({ status: 'passed', generated_at: new Date().toISOString(), checks,
    scope: 'Actual browser editor modules with original synthetic metadata and injected upload receipt fixtures. No production network, account writes, file decoding, storage or database authorization claim.' }, null, 2) + '\n');
} catch (error) {
  console.error(JSON.stringify({ errors, external, failedAssets, checks, status: await page.locator('.media-editor-status').textContent().catch(() => null), invalids: await page.evaluate(() => fixture?.invalids).catch(() => null) })); throw error;
} finally { await context.close(); await browser.close(); }
