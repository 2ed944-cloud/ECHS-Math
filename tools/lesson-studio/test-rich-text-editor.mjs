import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const repository = fileURLToPath(new URL('../../', import.meta.url));
const require = createRequire(new URL('../../question-bank/official/tools/package.json', import.meta.url));
const { chromium } = require('playwright');
const output = process.env.ECHS_RICH_TEXT_EVIDENCE || path.join(repository, 'artifacts/lesson-studio');
await mkdir(output, { recursive: true });
const origin = 'https://rich-editor-fixture.example.test';
const types = { '.mjs': 'text/javascript', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf' };
const module = `import {createRichTextEditor} from '/js/lesson-studio/rich-text-editor.mjs';
import katex from '/lessons/ib-math-ai/unit-1/assets/js/katex.js';
const root=document.querySelector('#editor');
window.fixture={changes:[],invalids:[],controller:null,ready:true,mount(content,options={}){
this.controller?.dispose();this.changes=[];this.invalids=[];
this.controller=createRichTextEditor({root,content,mathEngine:katex,onChange:next=>this.changes.push(next),onInvalid:error=>this.invalids.push(error),...options});
},get(){return this.controller.getValue();},fails(){try{this.get();return false}catch{return true}}};`;
const browser = await chromium.launch({ headless: true, executablePath: process.env.ECHS_CHROMIUM_PATH || undefined });
const context = await browser.newContext({ viewport: { width: 1200, height: 1000 }, serviceWorkers: 'block' });
const external = [], errors = [], failedAssets = [], checks = [];
await context.route('**/*', async route => {
  const url = new URL(route.request().url());
  if (url.origin !== origin) { external.push(url.href); return route.abort(); }
  if (url.pathname === '/__rich-editor.html') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Original rich text fixture</title><link rel="stylesheet" href="/css/lesson-studio.css"><link rel="stylesheet" href="/lessons/ib-math-ai/unit-1/assets/css/katex.css"></head><body><main><h1>Original rich text fixture</h1><div id="editor"></div></main><script type="module" src="/__rich-fixture.mjs"></script></body></html>' });
  if (url.pathname === '/__rich-fixture.mjs') return route.fulfill({ contentType: 'text/javascript', body: module });
  const file = path.resolve(repository, '.' + decodeURIComponent(url.pathname));
  if (!file.startsWith(path.resolve(repository) + path.sep)) return route.fulfill({ status: 403, body: '' });
  try { return route.fulfill({ contentType: types[path.extname(file)] || 'application/octet-stream', body: await readFile(file) }); }
  catch { return route.fulfill({ status: 404, body: '' }); }
});
const page = await context.newPage(); page.setDefaultTimeout(10000); page.on('pageerror', error => errors.push(error.message));
page.on('response', response => { if (response.status() >= 400 && /\.(?:css|js|mjs|woff2?|ttf)(?:\?|$)/.test(response.url())) failedAssets.push(response.url()); });
const plain = (...texts) => ({ nodes: texts.map(text => ({ type: 'paragraph', children: [{ type: 'text', text }] })) });
const pass = message => { checks.push(message); console.log('PASS ' + message); };
const mount = content => page.evaluate(content => fixture.mount(content), content);
const get = () => page.evaluate(() => fixture.get());
const toolbar = label => page.locator('.rich-editor-toolbar').getByRole('button', { name: label, exact: true });
async function select(start, end, first = 0, last = first) {
  await page.evaluate(({ start, end, first, last }) => {
    const rows = [...document.querySelectorAll('.rich-editor-surface > p,.rich-editor-surface > ol > li,.rich-editor-surface > ul > li')];
    function point(row, offset) {
      const walker = document.createTreeWalker(rows[row], NodeFilter.SHOW_TEXT); let node;
      while ((node = walker.nextNode())) { if (offset <= node.length) return [node, offset]; offset -= node.length; }
      throw new Error('Fixture selection is outside the text.');
    }
    const [a, x] = point(first, start), [b, y] = point(last, end), range = document.createRange();
    range.setStart(a, x); range.setEnd(b, y); const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range);
    document.querySelector('.rich-editor-surface').focus(); document.dispatchEvent(new Event('selectionchange'));
  }, { start, end, first, last });
}
try {
  await page.goto(origin + '/__rich-editor.html'); await page.waitForFunction(() => fixture?.ready);
  await mount(plain('Alpha beta gamma.'));
  assert.deepEqual(await get(), plain('Alpha beta gamma.')); assert.equal(await page.evaluate(() => fixture.changes.length), 0);
  await select(0, 5); await toolbar('Bold').click();
  assert.deepEqual((await get()).nodes[0].children, [{ type: 'text', text: 'Alpha', marks: ['strong'] }, { type: 'text', text: ' beta gamma.' }]);
  await page.waitForFunction(() => document.querySelector('.rich-editor-toolbar button').getAttribute('aria-pressed') === 'true');
  await select(6, 10); await toolbar('Italic').click();
  assert.deepEqual((await get()).nodes[0].children[2], { type: 'text', text: 'beta', marks: ['em'] });
  await select(0, 5); await page.keyboard.press('Control+b');
  assert.equal((await get()).nodes[0].children[0].marks, undefined);
  pass('selected text formatting and keyboard toggles preserve unselected text and selection boundaries without initial callbacks');

  await mount(plain('First original point.', 'Second original point.'));
  await select(0, 22, 0, 1); await toolbar('Numbered list').click();
  assert.equal((await get()).nodes[0].type, 'list'); assert.equal((await get()).nodes[0].items.length, 2);
  await toolbar('Bulleted list').click(); assert.equal((await get()).nodes[0].style, 'unordered');
  await toolbar('Paragraph').click(); assert.deepEqual(await get(), plain('First original point.', 'Second original point.'));
  pass('paragraphs and ordered/unordered lists round-trip across a multi-paragraph selection');

  await mount(plain('First paragraph.')); await select(16, 16); await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(() => fixture.fails()), true);
  await page.keyboard.type('A second original paragraph.');
  assert.deepEqual(await get(), plain('First paragraph.', 'A second original paragraph.'));
  await toolbar('Bold').focus(); await page.keyboard.press('ArrowRight');
  assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Italic');
  pass('native paragraph entry recovers after its temporary empty buffer and toolbar arrow keys retain keyboard access');

  await page.evaluate(content => fixture.mount(content, { inlineOnly: true }), plain('Cell value'));
  for (const label of ['Paragraph', 'Bulleted list', 'Numbered list']) assert.equal(await toolbar(label).count(), 0);
  await select(10, 10); await page.keyboard.press('Enter'); await page.keyboard.type('continued');
  assert.deepEqual(await get(), plain('Cell value\ncontinued'));
  assert.equal(await page.evaluate(() => { try { fixture.controller.setValue({ nodes: [{ type: 'list', style: 'ordered', items: [{ type: 'list-item', children: [{ type: 'text', text: 'Wrong shape' }] }] }] }); return false; } catch { return true; } }), true);
  pass('optional inline-only mode hides block structure controls and keeps cell line breaks inside one paragraph');

  await mount(plain('Alpha beta gamma.')); await select(0, 5); await toolbar('Add link').click();
  assert.equal(await page.locator('.rich-editor-surface').evaluate(element => element.inert), true);
  assert.equal(await page.locator('.rich-editor-surface').getAttribute('contenteditable'), 'false');
  await page.locator('.rich-editor-surface').evaluate(element => element.focus());
  assert.notEqual(await page.evaluate(() => document.activeElement.className), 'rich-editor-surface');
  await page.getByLabel('Web address', { exact: true }).fill('javascript:alert(1)'); await page.getByRole('button', { name: 'Apply link', exact: true }).click();
  assert.equal(await page.evaluate(() => fixture.fails()), true); assert.equal(await page.locator('.rich-editor-surface a').count(), 0);
  await page.getByRole('button', { name: 'Cancel link', exact: true }).click();
  assert.equal(await page.locator('.rich-editor-surface').evaluate(element => element.inert), false);
  await select(0, 5); await toolbar('Add link').click();
  await page.getByLabel('Web address', { exact: true }).fill('https://example.org/resource?unit=1#reasoning');
  await page.getByRole('button', { name: 'Apply link', exact: true }).click();
  assert.deepEqual((await get()).nodes[0].children[0], { type: 'link', href: 'https://example.org/resource?unit=1#reasoning', children: [{ type: 'text', text: 'Alpha' }] });
  await page.locator('.rich-editor-surface a').click(); assert.equal(page.url(), origin + '/__rich-editor.html');
  await select(0, 5); await toolbar('Remove link').click(); assert.deepEqual(await get(), plain('Alpha beta gamma.'));
  pass('links require a safe HTTPS address, retain selected text and never navigate from the editing surface');

  await mount(plain('Alpha beta gamma.')); await select(6, 10); await toolbar('Add link').click();
  await page.getByLabel('Web address', { exact: true }).fill('https://example.org/selected-word');
  await page.locator('.rich-editor-surface').evaluate(element => element.focus());
  assert.equal(await page.getByLabel('Web address', { exact: true }).evaluate(element => element === element.ownerDocument.activeElement), true);
  await page.getByRole('button', { name: 'Apply link', exact: true }).click();
  assert.deepEqual((await get()).nodes[0].children, [{ type: 'text', text: 'Alpha ' },
    { type: 'link', href: 'https://example.org/selected-word', children: [{ type: 'text', text: 'beta' }] }, { type: 'text', text: ' gamma.' }]);
  assert.equal(await page.locator('.rich-editor-surface').getAttribute('contenteditable'), 'true');
  pass('a pending link freezes the editing surface and preserves its exact selected range while the address field stays usable');

  await mount(plain('Alpha beta gamma.'));
  await select(5, 5);
  await page.locator('.rich-editor-surface').evaluate(element => {
    const data = new DataTransfer(); data.setData('text/plain', ' original paste'); data.setData('text/html', '<img src="https://foreign.invalid/pixel" onerror="window.executed=true">');
    element.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: data }));
  });
  assert.equal((await get()).nodes[0].children[0].text, 'Alpha original paste beta gamma.');
  assert.equal(await page.locator('.rich-editor-surface img,.rich-editor-surface script').count(), 0);
  assert.equal(await page.evaluate(() => window.executed), undefined);
  pass('paste inserts only clipboard plain text and discards HTML, handlers and remote media');

  await page.locator('.rich-editor-surface').fill('<script>literal unsafe markup</script>');
  assert.equal(await page.evaluate(() => fixture.fails()), true);
  assert.match(await page.locator('.rich-editor-surface').textContent(), /literal unsafe markup/);
  const invalidCount = await page.evaluate(() => fixture.invalids.length); assert.ok(invalidCount > 0);
  await page.locator('.rich-editor-surface').fill('Corrected original explanation.');
  assert.deepEqual(await get(), plain('Corrected original explanation.'));
  assert.equal(await page.locator('.rich-editor-surface').getAttribute('aria-invalid'), null);
  pass('invalid raw text remains recoverable in the DOM, blocks getValue and clears its error only after correction');

  const originalRecovery = plain('Original valid explanation.'); await mount(originalRecovery);
  await page.locator('.rich-editor-surface').fill('');
  assert.equal(await page.evaluate(() => fixture.fails()), true);
  assert.equal(await page.evaluate(() => fixture.changes.length), 0);
  assert.ok(await page.evaluate(() => fixture.invalids.length > 0));
  await page.locator('.rich-editor-surface').fill('Original valid explanation.');
  assert.deepEqual(await get(), originalRecovery);
  assert.deepEqual(await page.evaluate(() => fixture.changes), [originalRecovery]);
  assert.equal(await page.locator('.rich-editor-surface').getAttribute('aria-invalid'), null);
  pass('restoring exactly the previous valid content emits one recovery callback so a parent can clear its invalid state');

  const beforeComposition = await page.evaluate(() => fixture.changes.length);
  await page.locator('.rich-editor-surface').evaluate(element => {
    element.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    element.textContent = 'النهاية المستمرة';
    element.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertCompositionText', isComposing: true, data: 'النهاية المستمرة' }));
  });
  assert.equal(await page.evaluate(() => fixture.changes.length), beforeComposition); assert.equal(await page.evaluate(() => fixture.fails()), true);
  await page.locator('.rich-editor-surface').dispatchEvent('compositionend');
  assert.equal(await page.evaluate(() => fixture.changes.length), beforeComposition + 1);
  assert.deepEqual(await get(), plain('النهاية المستمرة'));
  pass('IME composition retains the working buffer and emits one valid change after composition finishes');

  const math = { type: 'math', source: { mode: 'tex', tex: '\\frac{x^2-1}{x-1}' }, spoken: 'x squared minus one over x minus one' };
  await mount({ nodes: [{ type: 'paragraph', children: [{ type: 'text', text: 'Observe ' }, math, { type: 'text', text: ' near one.' }] }] });
  assert.equal(await page.locator('.rich-editor-inline-math .katex').count(), 1);
  await select(0, 7); await toolbar('Bold').click();
  assert.deepEqual((await get()).nodes[0].children.find(node => node.type === 'math'), math);
  assert.equal(await page.locator('.rich-editor-inline-math').getAttribute('contenteditable'), 'false');
  pass('formatting preserves exact inline mathematics and its spoken description as a noneditable atom');

  await mount(plain('Observe the expression.')); await select(8, 8); await toolbar('Insert mathematics').click();
  assert.equal(await page.evaluate(() => fixture.fails()), true);
  const dialog = page.locator('.rich-editor-math-dialog'); await dialog.waitFor({ state: 'visible' });
  assert.equal(await dialog.locator('[data-math-field="mode"]').inputValue(), 'visual');
  assert.equal(await dialog.getByLabel('Display as a separate equation', { exact: true }).count(), 0);
  await dialog.getByRole('button', { name: 'Insert mathematics', exact: true }).click();
  const inserted = (await get()).nodes[0].children.find(node => node.type === 'math');
  assert.deepEqual(inserted, { type: 'math', source: { mode: 'visual', expression: { kind: 'symbol', name: 'x' } }, spoken: 'x' });
  assert.equal(Object.hasOwn(inserted, 'display'), false, 'Inline math has no block-only display setting.');
  await page.locator('.rich-editor-inline-math').focus(); await page.keyboard.press('Enter');
  await dialog.waitFor({ state: 'visible' }); await dialog.locator('[data-math-field="expression-name"]').selectOption('y');
  assert.equal(await dialog.locator('[data-math-field="display"]').count(), 0);
  await dialog.getByRole('button', { name: 'Insert mathematics', exact: true }).click();
  assert.equal((await get()).nodes[0].children.find(node => node.type === 'math').source.expression.name, 'y');
  assert.equal((await get()).nodes[0].children.find(node => node.type === 'math').spoken, 'y');
  pass('inline visual mathematics inserts at the saved caret and can be edited by keyboard with synchronized speech');

  await select(0, 7); await toolbar('Bold').click();
  const previous = await get(); await page.evaluate(content => fixture.controller.setValue(content), previous);
  assert.equal(await page.evaluate(() => getSelection().toString()), 'Observe');
  await page.screenshot({ path: path.join(output, 'rich-text-editor.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  pass('setting unchanged content preserves selection and formatting controls remain within the mobile viewport');

  const beforeDispose = await page.evaluate(() => fixture.changes.length);
  await page.evaluate(() => { window.detachedEditorSurface = document.querySelector('.rich-editor-surface'); fixture.controller.dispose(); detachedEditorSurface.dispatchEvent(new Event('input', { bubbles: true })); });
  assert.equal(await page.locator('#editor').textContent(), '');
  assert.equal(await page.evaluate(() => detachedEditorSurface.textContent), '');
  assert.equal(await page.evaluate(() => fixture.changes.length), beforeDispose);
  assert.equal(await page.evaluate(() => fixture.fails()), true);
  assert.deepEqual(await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage) })), { local: [], session: [] });
  assert.deepEqual(external, []); assert.deepEqual(errors, []); assert.deepEqual(failedAssets, []);
  pass('disposal clears private DOM, detached buffers and listeners without storage, external requests or script errors');
  await writeFile(path.join(output, 'rich-text-editor-results.json'), JSON.stringify({ status: 'passed', generated_at: new Date().toISOString(), checks,
    scope: 'Real browser component tests of production modules with synthetic original text; all requests intercepted. No production account, database or publication writes.' }, null, 2) + '\n');
} catch (error) {
  console.error(JSON.stringify({ errors, external, status: await page.locator('.rich-editor-status').textContent().catch(() => null),
    invalids: await page.evaluate(() => fixture?.invalids).catch(() => null) })); throw error;
} finally { await context.close(); await browser.close(); }
