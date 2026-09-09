import { assertLessonBlock } from './schema.mjs';
import { assertLessonAssetMetadata } from './asset-contract.mjs';

let nextRenderer = 0;
/** Content DOM only. The host validates mathematics and authorizes the document.
 * resolveAsset must recheck the current account/route, verify SHA-256, and return
 * authenticated bytes. This module never grants access or persists blob URLs.
 */
export function createMediaRenderer({ document: doc, inline, resolveAsset } = {}) {
  if (!doc?.createElement || typeof inline !== 'function' || (resolveAsset !== undefined && typeof resolveAsset !== 'function')) throw new TypeError('A document and inline renderer are required.');
  const win = doc.defaultView || globalThis;
  const prefix = `echs-media-${++nextRenderer}-`;
  const entries = new Set(); let disposed = false, sequence = 0;
  const element = (tag, text, className) => { const node = doc.createElement(tag); if (text !== undefined) node.textContent = text; if (className) node.className = className; return node; };
  function entry(node) {
    const cleanup = new Set(), urls = new Set(), timers = new Set();
    const item = { node, active: true, request: null, generation: 0,
      on(target, event, listener) { target.addEventListener(event, listener); cleanup.add(() => target.removeEventListener(event, listener)); },
      later(callback, delay) { const timer = win.setTimeout(() => { timers.delete(timer); if (item.active) callback(); }, delay); timers.add(timer); return timer; },
      clearTimer(timer) { win.clearTimeout(timer); timers.delete(timer); },
      url(blob) { const url = win.URL.createObjectURL(blob); urls.add(url); return url; },
      revoke(url) { if (urls.delete(url)) win.URL.revokeObjectURL(url); },
      dispose() {
        if (!item.active) return; item.active = false; item.generation++; item.request?.abort(); item.request = null;
        for (const callback of cleanup) callback(); cleanup.clear();
        for (const timer of timers) win.clearTimeout(timer); timers.clear();
        for (const url of [...urls]) item.revoke(url);
        for (const media of node.querySelectorAll('iframe,img,a[download]')) media.removeAttribute('src'), media.removeAttribute('href');
        node.replaceChildren(); entries.delete(item);
      }
    };
    entries.add(item); return item;
  }
  function receipt(value, assetId, kind) {
    if (!value || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) throw new Error('Invalid asset receipt.');
    const descriptors = Object.getOwnPropertyDescriptors(value);
    if (Reflect.ownKeys(descriptors).length !== 2 || !['metadata','blob'].every(key => descriptors[key]?.enumerable && Object.hasOwn(descriptors[key], 'value'))) throw new Error('Invalid asset receipt.');
    const metadata = assertLessonAssetMetadata(descriptors.metadata.value, { assetId, kind });
    const blob = descriptors.blob.value;
    if (!(blob instanceof win.Blob) || blob.type !== metadata.mime_type || blob.size !== metadata.byte_length) throw new Error('Invalid asset bytes.');
    return { metadata, blob };
  }
  async function resolve(item, assetId, kind) {
    item.request?.abort(); const controller = new win.AbortController(); item.request = controller; const generation = ++item.generation;
    if (typeof resolveAsset !== 'function') throw new Error('Asset resolution is unavailable.');
    const value = await resolveAsset(assetId, { kind, signal: controller.signal });
    if (disposed || !item.active || controller.signal.aborted || item.generation !== generation) return null;
    return receipt(value, assetId, kind);
  }
  function description(content, root, label) {
    if (!content) return;
    const details = element('details', undefined, 'echsMediaDescription');
    details.append(element('summary', label), element('p', content)); root.append(details);
  }
  function image(content, id) {
    const root = element('figure', undefined, 'echsMedia echsMediaImage'); const item = entry(root);
    const slot = element('div', undefined, 'echsMediaImageSlot');
    const status = element('p', 'Load the image when you are ready.', 'echsMediaStatus'); status.setAttribute('role','status'); status.setAttribute('aria-live','polite');
    const button = element('button', 'Load image', 'echsMediaButton'); button.type = 'button';
    root.append(slot, status, button);
    if (content.caption) { const caption = element('figcaption', content.caption); caption.id = id + '-caption'; root.append(caption); }
    description(content.description, root, 'Image description');
    let pending = false, loaded = false, activeImage = null, activeUrl = null, decodeTimer, observer;
    const clearImage = () => {
      if (decodeTimer !== undefined) item.clearTimer(decodeTimer);
      if (activeImage) { activeImage.onload = null; activeImage.onerror = null; activeImage.removeAttribute('src'); activeImage.remove(); activeImage = null; }
      if (activeUrl) { item.revoke(activeUrl); activeUrl = null; }
    };
    const failed = () => {
      if (!item.active) return; clearImage(); pending = false; loaded = false;
      root.removeAttribute('aria-busy'); status.textContent = 'The image is unavailable. Try again or use its description.';
      button.textContent = 'Retry image'; button.disabled = false; button.hidden = false;
    };
    const load = async () => {
      if (!item.active || pending || loaded) return;
      observer?.disconnect(); pending = true; button.disabled = true; status.textContent = 'Loading image…'; root.setAttribute('aria-busy','true');
      try {
        const result = await resolve(item, content.asset_id, 'image'); if (!result) return;
        clearImage(); const img = element('img'); activeImage = img;
        img.alt = content.alt; if (content.decorative) img.setAttribute('role','presentation');
        img.width = result.metadata.width; img.height = result.metadata.height; img.decoding = 'async'; img.hidden = true;
        img.onload = () => {
          if (!item.active || activeImage !== img) return;
          item.clearTimer(decodeTimer); img.hidden = false; loaded = true; pending = false;
          root.removeAttribute('aria-busy'); status.textContent = ''; button.hidden = true; button.disabled = false;
        };
        img.onerror = () => { if (item.active && activeImage === img) failed(); };
        activeUrl = item.url(result.blob); slot.replaceChildren(img);
        decodeTimer = item.later(failed, 15000); img.src = activeUrl;
      } catch { failed(); }
    };
    item.on(button, 'click', load);
    if (typeof win.IntersectionObserver === 'function') {
      observer = new win.IntersectionObserver(records => { if (records.some(record => record.isIntersecting)) void load(); }, { threshold: 0.01 });
      observer.observe(root);
    }
    const originalDispose = item.dispose;
    item.dispose = () => { observer?.disconnect(); clearImage(); originalDispose(); };
    return root;
  }
  function resource(content, id) {
    const root = element('section', undefined, 'echsMedia echsMediaResource'); const item = entry(root);
    const heading = element('h3', content.title); heading.id = id + '-title'; root.setAttribute('aria-labelledby',heading.id);
    const status = element('p', '', 'echsMediaStatus'); status.setAttribute('role','status'); status.setAttribute('aria-live','polite');
    const button = element('button', 'Download PDF', 'echsMediaButton'); button.type = 'button';
    root.append(heading, element('p', content.description), button, status);
    let pending = false, activeUrl = null;
    item.on(button,'click', async () => {
      if (!item.active || pending) return; pending = true; button.disabled = true; status.textContent = 'Preparing PDF…';
      try {
        const result = await resolve(item, content.asset_id, 'resource'); if (!result) return;
        if (activeUrl) item.revoke(activeUrl);
        const url = item.url(result.blob); activeUrl = url;
        const name = content.title.normalize('NFKC').replace(/[^\p{L}\p{N}\s_-]/gu,'').trim().replace(/\s+/g,'-').slice(0,80) || 'resource';
        const link = element('a'); link.href = url; link.download = `lesson-resource-${name}.pdf`; link.hidden = true;
        // Anchor downloads expose no page-level completion event. Revoke after
        // a short initiation lease, and immediately on replacement/disposal.
        item.later(() => { item.revoke(url); if (activeUrl === url) activeUrl = null; }, 1000);
        root.append(link); try { link.click(); } finally { link.remove(); }
        status.textContent = 'PDF download requested.';
      } catch { if (item.active) status.textContent = 'The PDF is unavailable. Try downloading it again.'; }
      finally { if (item.active) { pending = false; button.disabled = false; } }
    });
    return root;
  }
  function table(content, id) {
    const root = element('div', undefined, 'echsMedia echsMediaTable'); entry(root);
    root.tabIndex = 0; root.setAttribute('role','region'); root.setAttribute('aria-labelledby',id + '-caption');
    const grid = element('table'); const caption = element('caption', content.caption); caption.id = id + '-caption';
    const head = element('thead'), titles = element('tr'), body = element('tbody');
    content.columns.forEach((column, index) => { const cell = element('th',column.label); cell.scope = 'col'; cell.id = `${id}-col-${index}`; titles.append(cell); });
    head.append(titles);
    content.rows.forEach((row,rowIndex) => {
      const line = element('tr'), rowId = `${id}-row-${rowIndex}`;
      row.cells.forEach((children,columnIndex) => {
        const isHeader = content.row_header && columnIndex === 0, cell = element(isHeader ? 'th' : 'td');
        if (isHeader) { cell.scope = 'row'; cell.id = rowId; }
        cell.setAttribute('headers',`${id}-col-${columnIndex}${content.row_header && !isHeader ? ' ' + rowId : ''}`);
        for (const child of children) cell.append(inline(child)); line.append(cell);
      });
      body.append(line);
    });
    grid.append(caption, head, body); root.append(grid); return root;
  }
  function video(content, id) {
    const root = element('section', undefined, 'echsMedia echsMediaVideo'); const item = entry(root);
    const title = element('h3',content.title); title.id = id + '-title'; root.setAttribute('aria-labelledby',title.id);
    const note = element('p','Loading this video connects to YouTube. You can read the transcript without loading it.');
    const slot = element('div',undefined,'echsMediaVideoSlot');
    const controls = element('div',undefined,'echsMediaControls');
    const button = element('button','Load external video','echsMediaButton'); button.type = 'button';
    const unload = element('button','Remove external video','echsMediaButton'); unload.type = 'button'; unload.hidden = true;
    const fallback = element('a','Open on YouTube'); fallback.href = `https://www.youtube.com/watch?v=${content.video_id}&t=${content.start_seconds}s`; fallback.target = '_blank'; fallback.rel = 'noopener noreferrer'; fallback.referrerPolicy = 'no-referrer';
    const status = element('p','','echsMediaStatus'); status.setAttribute('role','status'); status.setAttribute('aria-live','polite');
    controls.append(button,unload,fallback); root.append(title,note,slot,controls,status); description(content.transcript,root,'Video transcript');
    let frame = null, loadTimer;
    const remove = () => {
      if (loadTimer !== undefined) item.clearTimer(loadTimer);
      if (frame) { frame.onload = null; frame.onerror = null; frame.removeAttribute('src'); frame.remove(); frame = null; }
      slot.replaceChildren(); button.disabled = false; button.textContent = 'Load external video'; unload.hidden = true;
    };
    item.on(button,'click', () => {
      if (!item.active) return; remove();
      const iframe = element('iframe'); frame = iframe;
      iframe.title = content.title; iframe.referrerPolicy = 'strict-origin';
      iframe.setAttribute('sandbox','allow-scripts allow-same-origin allow-presentation');
      iframe.setAttribute('allow','encrypted-media; picture-in-picture; fullscreen'); iframe.allowFullscreen = true;
      iframe.onload = () => { if (item.active && frame === iframe) { item.clearTimer(loadTimer); status.textContent = 'If the video cannot play, open it on YouTube or use the transcript.'; } };
      const failed = () => { if (item.active && frame === iframe) { status.textContent = 'The external video is unavailable. Use the transcript or try again.'; button.disabled = false; button.textContent = 'Retry external video'; } };
      iframe.onerror = failed;
      iframe.src = `https://www.youtube-nocookie.com/embed/${content.video_id}?start=${content.start_seconds}&autoplay=0&playsinline=1&rel=0`;
      status.textContent = 'Loading external video…'; button.disabled = true; unload.hidden = false; slot.append(iframe); loadTimer = item.later(failed,15000);
    });
    item.on(unload,'click', () => { remove(); status.textContent = 'External video removed.'; button.focus(); });
    item.deactivate = () => { if (item.active && frame) { remove(); status.textContent = 'External video removed.'; } };
    const originalDispose = item.dispose; item.dispose = () => { remove(); originalDispose(); };
    return root;
  }
  return Object.freeze({
    block(value) {
      if (disposed) throw new Error('This media renderer has been disposed.');
      assertLessonBlock(value);
      if (value.version !== 1 || !['image','video','table','resource'].includes(value.type)) throw new Error('Unsupported media block.');
      const content = structuredClone(value.content), id = prefix + (++sequence);
      return ({ image, resource, table, video })[value.type](content,id);
    },
    deactivate(target) {
      if (disposed || !target?.contains) return;
      for (const item of entries) if (target === item.node || target.contains(item.node)) item.deactivate?.();
    },
    dispose() { if (disposed) return; disposed = true; for (const item of [...entries]) item.dispose(); }
  });
}
