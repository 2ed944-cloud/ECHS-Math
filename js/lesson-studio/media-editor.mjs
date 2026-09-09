import { assertBlockContent } from '../lesson-runtime/schema.mjs';
import { createRichTextEditor } from './rich-text-editor.mjs';

const TYPES = ['image', 'video', 'table', 'resource'];
const IMAGE_MIMES = ['image/png', 'image/jpeg', 'image/webp'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const copy = value => JSON.parse(JSON.stringify(value));
const inlineText = text => [{ type: 'text', text }];
const byteLimit = type => (type === 'image' ? 4 : 8) * 1024 * 1024;
let sequence = 0;

export class MediaEditorError extends Error {
  constructor(code, message) { super(message); this.name = 'MediaEditorError'; this.code = code; }
}
const fail = (code, message) => { throw new MediaEditorError(code, message); };

/** Recognized provider URLs only. The lesson stores an ID, never an iframe or URL. */
export function parseYouTubeVideoId(input) {
  if (typeof input !== 'string' || input.length > 2048) fail('video-url', 'Use a complete HTTPS YouTube video link.');
  let url; try { url = new URL(input.trim()); } catch { fail('video-url', 'Use a complete HTTPS YouTube video link.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.port) fail('video-url', 'Use a complete HTTPS YouTube video link.');
  let id;
  if (['youtu.be', 'www.youtu.be'].includes(url.hostname)) id = /^\/([A-Za-z0-9_-]{11})\/?$/.exec(url.pathname)?.[1];
  else if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(url.hostname)) {
    if (url.pathname === '/watch' && url.searchParams.getAll('v').length === 1) id = url.searchParams.get('v');
    else id = /^\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{11})\/?$/.exec(url.pathname)?.[1];
  } else if (['youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(url.hostname)) id = /^\/embed\/([A-Za-z0-9_-]{11})\/?$/.exec(url.pathname)?.[1];
  if (!/^[A-Za-z0-9_-]{11}$/.test(id || '')) fail('video-url', 'Choose a link to a specific YouTube video.');
  return id;
}

function readyAsset(result, type) {
  if (!result || typeof result !== 'object' || Array.isArray(result) || ![Object.prototype, null].includes(Object.getPrototypeOf(result))) fail('upload-result', 'The upload was not confirmed. Try again.');
  const fields = Object.getOwnPropertyDescriptors(result), keys = ['asset_id', 'mime_type', 'byte_length', 'width', 'height', 'sha256', 'state'];
  if (Reflect.ownKeys(fields).length !== keys.length || !keys.every(key => Object.hasOwn(fields, key) && Object.hasOwn(fields[key], 'value') && fields[key].enumerable)) fail('upload-result', 'The upload was not confirmed. Try again.');
  const asset = Object.fromEntries(keys.map(key => [key, fields[key].value]));
  if (typeof asset.asset_id !== 'string' || !UUID.test(asset.asset_id) || asset.state !== 'ready' || typeof asset.sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(asset.sha256) ||
    !Number.isInteger(asset.byte_length) || asset.byte_length <= 0 || asset.byte_length > byteLimit(type)) fail('upload-result', 'The upload was not confirmed. Try again.');
  if (type === 'image') {
    if (!IMAGE_MIMES.includes(asset.mime_type) || !Number.isInteger(asset.width) || !Number.isInteger(asset.height) || asset.width < 1 || asset.height < 1 ||
      asset.width > 4096 || asset.height > 4096 || asset.width * asset.height > 16777216) fail('upload-result', 'Choose a supported image no larger than 4096 by 4096 pixels.');
  } else if (asset.mime_type !== 'application/pdf' || asset.width !== null || asset.height !== null) fail('upload-result', 'Choose a PDF resource.');
  return asset.asset_id;
}

function defaults(type) {
  if (type === 'image') return { asset_id: null, alt: '', decorative: false, caption: '', description: '' };
  if (type === 'resource') return { asset_id: null, title: '', description: '' };
  if (type === 'video') return { provider: 'youtube', video_id: '', title: '', start_seconds: 0, transcript: '' };
  return { caption: 'Data table', columns: [{ id: 'column-1', label: 'Column 1' }, { id: 'column-2', label: 'Column 2' }],
    rows: [{ id: 'row-1', cells: [inlineText('Add value.'), inlineText('Add value.')] }], row_header: false };
}

/** Media metadata editor. Upload transport and current-account authority belong to the host. */
export function createMediaEditor({ root, type, value = null, mathEngine, onChange = () => {}, onInvalid = () => {}, uploadAsset } = {}) {
  if (!root?.ownerDocument || !TYPES.includes(type) || typeof onChange !== 'function' || typeof onInvalid !== 'function' ||
    (uploadAsset !== undefined && typeof uploadAsset !== 'function')) throw new TypeError('A media type, editor root and callbacks are required.');
  if (value !== null) assertBlockContent(type, 1, value, { mathEngine });
  const document = root.ownerDocument, win = document.defaultView, prefix = `media-editor-${++sequence}`;
  let buffer = value === null ? defaults(type) : copy(value), lastValid = value === null ? null : JSON.stringify(value);
  let disposed = false, generation = 0, pendingUpload = null, uploadIssue = null, listeners = [], tableListeners = [], cellEditor = null, cellInvalid = false;
  let selectedRow = buffer.rows?.[0]?.id, selectedColumn = buffer.columns?.[0]?.id, removed = null, altBeforeDecorative = buffer.alt || '';
  let shell, status, fileInput, fileStatus, cancelUploadButton, tableRoot, cellRoot, cellHeading, cellKey = '', tableButtons = {};
  const fields = new Map();
  const element = (tag, text, className) => { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (className) node.className = className; return node; };
  function active() { if (disposed) fail('editor-disposed', 'This editor is closed.'); }
  function listen(node, name, handler, group = listeners) { const wrapped = event => { if (!disposed) handler(event); }; node.addEventListener(name, wrapped); group.push(() => node.removeEventListener(name, wrapped)); }
  function report(error) {
    if (disposed) return;
    const message = error instanceof MediaEditorError ? error.message : 'Complete the required fields and check the content before saving.';
    status.textContent = message; root.dataset.mediaEditorValid = 'false';
    try { onInvalid({ valid: false, errors: [{ path: '', code: error.code || 'invalid-media', message }] }); } catch { /* Host callbacks do not change validity. */ }
  }
  function currentValue() {
    active();
    if (pendingUpload) fail('upload-pending', 'Wait for the upload to finish, or cancel it.');
    if (uploadIssue) throw uploadIssue;
    if (type === 'video') buffer.video_id = parseYouTubeVideoId(fields.get('video-url').value);
    if (type === 'table' && cellEditor) {
      const content = cellEditor.getValue();
      if (content.nodes.length !== 1 || content.nodes[0].type !== 'paragraph') fail('table-cell', 'Keep one paragraph of text or mathematics in each cell.');
      const row = buffer.rows.find(item => item.id === selectedRow), index = buffer.columns.findIndex(item => item.id === selectedColumn);
      row.cells[index] = copy(content.nodes[0].children);
      if (cellInvalid) fail('table-cell', 'Complete the selected cell before continuing.');
    }
    assertBlockContent(type, 1, buffer, { mathEngine }); return copy(buffer);
  }
  function notify() {
    if (disposed) return;
    try {
      const next = currentValue(); lastValid = JSON.stringify(next); status.textContent = ''; root.dataset.mediaEditorValid = 'true'; onChange(copy(next));
    } catch (error) { report(error); }
  }
  function field(parent, key, label, initial, { multiline = false, checkbox = false, maxLength = 4000, inputType = 'text' } = {}) {
    const wrapper = element('div', undefined, 'media-editor-field'), control = element(multiline ? 'textarea' : 'input'), labelNode = element('label', label);
    control.id = `${prefix}-${key}`; control.dataset.mediaField = key; labelNode.htmlFor = control.id;
    if (checkbox) { control.type = 'checkbox'; control.checked = initial; }
    else { if (!multiline) control.type = inputType; control.value = initial ?? ''; control.maxLength = maxLength; }
    wrapper.append(labelNode, control); parent.append(wrapper); fields.set(key, control); return control;
  }
  function metadata(key, label, options = {}) {
    const control = field(shell, key, label, buffer[key], options);
    listen(control, options.checkbox ? 'change' : 'input', () => { buffer[key] = options.checkbox ? control.checked : control.value; notify(); }); return control;
  }
  function button(parent, label, key, action, group = listeners) {
    const control = element('button', label, 'media-editor-button'); control.type = 'button'; control.dataset.mediaAction = key;
    listen(control, 'click', () => { try { action(); } catch (error) { report(error); } }, group); parent.append(control); return control;
  }
  function stopUpload() {
    generation++; pendingUpload?.controller.abort(); pendingUpload = null; uploadIssue = null;
    if (fileInput) fileInput.value = ''; if (cancelUploadButton) cancelUploadButton.hidden = true;
    if (fileStatus) fileStatus.textContent = buffer.asset_id ? 'Current file retained.' : 'Choose a file to upload.';
  }
  async function upload(file) {
    stopUpload(); active();
    if (!(file instanceof win.File) || !file.size || file.size > byteLimit(type) || !(type === 'image' ? IMAGE_MIMES : ['application/pdf']).includes(file.type)) {
      uploadIssue = new MediaEditorError('file-type', type === 'image' ? 'Choose a PNG, JPEG or WebP image up to 4 MiB.' : 'Choose a PDF up to 8 MiB.');
      cancelUploadButton.hidden = false; report(uploadIssue); return;
    }
    if (!uploadAsset) { uploadIssue = new MediaEditorError('upload-unavailable', 'Save the lesson and connect to the school service before uploading.'); cancelUploadButton.hidden = false; report(uploadIssue); return; }
    const controller = new AbortController(), ownGeneration = generation; pendingUpload = { controller }; cancelUploadButton.hidden = false;
    fileStatus.textContent = `Uploading ${file.name}…`; report(new MediaEditorError('upload-pending', 'Wait for the upload to finish, or cancel it.'));
    let timer, abortListener;
    try {
      const interruption = new Promise((_, reject) => {
        abortListener = () => reject(new MediaEditorError('upload-cancelled', 'The upload was cancelled.'));
        controller.signal.addEventListener('abort', abortListener, { once: true });
        timer = win.setTimeout(() => { reject(new MediaEditorError('upload-timeout', 'The upload took too long. Check the connection and try again.')); controller.abort(); }, 60000);
      });
      const receipt = await Promise.race([Promise.resolve().then(() => uploadAsset(file, { signal: controller.signal })), interruption]);
      if (disposed || generation !== ownGeneration || controller.signal.aborted) return;
      const id = readyAsset(receipt, type); buffer.asset_id = id; pendingUpload = null; uploadIssue = null;
      fileStatus.textContent = type === 'image' ? 'Image ready.' : 'PDF ready.'; cancelUploadButton.hidden = true; fileInput.value = ''; notify();
    } catch (error) {
      if (disposed || generation !== ownGeneration) return;
      pendingUpload = null; uploadIssue = error instanceof MediaEditorError ? error : new MediaEditorError('upload-failed', 'The upload was not confirmed. Check the connection and try again.');
      fileStatus.textContent = 'Upload not confirmed.'; report(uploadIssue);
    } finally {
      win.clearTimeout(timer); if (abortListener) controller.signal.removeEventListener('abort', abortListener);
    }
  }
  function uploadControls() {
    fileInput = field(shell, 'file', type === 'image' ? 'Image file' : 'PDF file', '', { inputType: 'file' });
    fileInput.accept = type === 'image' ? IMAGE_MIMES.join(',') : 'application/pdf';
    fileStatus = element('p', buffer.asset_id ? 'Current file ready.' : 'Choose a file to upload.', 'media-editor-upload-status'); fileStatus.setAttribute('role', 'status'); shell.append(fileStatus);
    cancelUploadButton = button(shell, 'Cancel upload', 'cancel-upload', () => { stopUpload(); notify(); }); cancelUploadButton.hidden = true;
    listen(fileInput, 'change', () => { const file = fileInput.files?.[0]; if (file) void upload(file); });
  }
  function nextId(prefix, values) { const used = new Set(values); for (let number = 1; number <= used.size + 1; number++) if (!used.has(`${prefix}-${number}`)) return `${prefix}-${number}`; }
  function selectedCell() { const row = buffer.rows.find(item => item.id === selectedRow), index = buffer.columns.findIndex(item => item.id === selectedColumn); return { row, index }; }
  function commitCell() {
    if (!cellEditor) return;
    const content = cellEditor.getValue();
    if (cellInvalid || content.nodes.length !== 1 || content.nodes[0].type !== 'paragraph') fail('table-cell', 'Complete the selected cell before continuing.');
    const { row, index } = selectedCell(); row.cells[index] = copy(content.nodes[0].children);
  }
  function describeCell(children) {
    return children.map(node => node.type === 'text' ? node.text : node.type === 'math' ? node.spoken : node.children.map(child => child.text).join('')).join('');
  }
  function updateCellButton() {
    const { row, index } = selectedCell(), node = tableRoot.querySelector(`[data-media-row="${row.id}"][data-media-column="${buffer.columns[index].id}"]`);
    if (node) { node.textContent = describeCell(row.cells[index]); node.setAttribute('aria-label', `Edit row ${buffer.rows.indexOf(row) + 1}, ${buffer.columns[index].label}: ${node.textContent}`); }
  }
  function openCell(rowId, columnId) {
    commitCell(); selectedRow = rowId; selectedColumn = columnId; renderCell(); renderSelection();
  }
  function renderSelection() {
    for (const node of tableRoot.querySelectorAll('[data-media-row]')) node.setAttribute('aria-pressed', String(node.dataset.mediaRow === selectedRow && node.dataset.mediaColumn === selectedColumn));
    const rowIndex = buffer.rows.findIndex(row => row.id === selectedRow), columnIndex = buffer.columns.findIndex(column => column.id === selectedColumn);
    tableButtons['remove-row'].disabled = buffer.rows.length === 1; tableButtons['remove-column'].disabled = buffer.columns.length === 1;
    tableButtons['add-row'].disabled = buffer.rows.length >= 100; tableButtons['add-column'].disabled = buffer.columns.length >= 12;
    tableButtons['row-up'].disabled = rowIndex === 0; tableButtons['row-down'].disabled = rowIndex === buffer.rows.length - 1;
    tableButtons['column-left'].disabled = columnIndex === 0; tableButtons['column-right'].disabled = columnIndex === buffer.columns.length - 1;
    tableButtons.undo.disabled = !removed;
  }
  function renderCell() {
    const key = `${selectedRow}/${selectedColumn}`, { row, index } = selectedCell();
    cellHeading.textContent = `Row ${buffer.rows.indexOf(row) + 1}, ${buffer.columns[index].label}`;
    if (key === cellKey && cellEditor) { cellRoot.querySelector('.rich-editor-surface').setAttribute('aria-label', `Cell text: ${cellHeading.textContent}`); return; }
    cellEditor?.dispose(); cellEditor = null; cellInvalid = false; cellKey = key;
    cellEditor = createRichTextEditor({ root: cellRoot, inlineOnly: true, content: { nodes: [{ type: 'paragraph', children: copy(row.cells[index]) }] }, mathEngine,
      onChange: content => {
        if (disposed || cellKey !== key) return;
        try {
          if (content.nodes.length !== 1 || content.nodes[0].type !== 'paragraph') fail('table-cell', 'Keep one paragraph in each table cell.');
          const current = selectedCell(); current.row.cells[current.index] = copy(content.nodes[0].children); cellInvalid = false; updateCellButton(); notify();
        } catch (error) { cellInvalid = true; report(error); }
      }, onInvalid: () => { if (!disposed && cellKey === key) { cellInvalid = true; report(new MediaEditorError('table-cell', 'Complete the selected cell before continuing.')); } } });
    cellRoot.querySelector('.rich-editor-surface').setAttribute('aria-label', `Cell text: ${cellHeading.textContent}`);
  }
  function renderTable() {
    tableListeners.splice(0).forEach(remove => remove());
    const table = element('table', undefined, 'media-editor-table'), caption = element('caption', 'Select a cell to edit its text or mathematics.');
    table.append(caption); const head = element('thead'), headingRow = element('tr');
    buffer.columns.forEach((column, index) => {
      const th = element('th'); th.scope = 'col';
      const input = element('input'); input.type = 'text'; input.value = column.label; input.maxLength = 240; input.dataset.mediaColumnLabel = column.id;
      input.setAttribute('aria-label', `Column ${index + 1} heading`);
      listen(input, 'input', () => {
        column.label = input.value;
        for (const [rowIndex, row] of buffer.rows.entries()) {
          const button = tableRoot.querySelector(`[data-media-row="${row.id}"][data-media-column="${column.id}"]`);
          if (button) button.setAttribute('aria-label', `Edit row ${rowIndex + 1}, ${column.label}: ${describeCell(row.cells[index])}`);
        }
        if (selectedColumn === column.id) renderCell(); notify();
      }, tableListeners);
      th.append(input); headingRow.append(th);
    });
    head.append(headingRow); table.append(head); const body = element('tbody');
    for (const [rowIndex, row] of buffer.rows.entries()) {
      const tr = element('tr');
      row.cells.forEach((cell, columnIndex) => {
        const td = element(buffer.row_header && columnIndex === 0 ? 'th' : 'td'); if (td.tagName === 'TH') td.scope = 'row';
        const control = button(td, describeCell(cell), 'select-cell', () => openCell(row.id, buffer.columns[columnIndex].id), tableListeners);
        control.dataset.mediaRow = row.id; control.dataset.mediaColumn = buffer.columns[columnIndex].id;
        control.setAttribute('aria-label', `Edit row ${rowIndex + 1}, ${buffer.columns[columnIndex].label}: ${describeCell(cell)}`); tr.append(td);
      });
      body.append(tr);
    }
    table.append(body); tableRoot.replaceChildren(table); renderCell(); renderSelection();
  }
  function tableAction(action) {
    commitCell(); const before = copy(buffer), priorRemoved = removed, priorRow = selectedRow, priorColumn = selectedColumn;
    try {
      const rowIndex = buffer.rows.findIndex(row => row.id === selectedRow), columnIndex = buffer.columns.findIndex(column => column.id === selectedColumn);
      if (action === 'add-row') {
        if (buffer.rows.length >= 100) fail('table-limit', 'A table can contain at most 100 rows.');
        const row = { id: nextId('row', buffer.rows.map(row => row.id)), cells: buffer.columns.map(() => inlineText('Add value.')) };
        buffer.rows.splice(rowIndex + 1, 0, row); selectedRow = row.id;
      } else if (action === 'add-column') {
        if (buffer.columns.length >= 12) fail('table-limit', 'A table can contain at most 12 columns.');
        const column = { id: nextId('column', buffer.columns.map(column => column.id)), label: 'New column' };
        buffer.columns.splice(columnIndex + 1, 0, column); buffer.rows.forEach(row => row.cells.splice(columnIndex + 1, 0, inlineText('Add value.'))); selectedColumn = column.id;
      } else if (action === 'remove-row') {
        if (buffer.rows.length === 1) fail('final-row', 'Keep at least one row.');
        removed = { kind: 'row', index: rowIndex, row: copy(buffer.rows[rowIndex]) }; buffer.rows.splice(rowIndex, 1); selectedRow = buffer.rows[Math.min(rowIndex, buffer.rows.length - 1)].id;
      } else if (action === 'remove-column') {
        if (buffer.columns.length === 1) fail('final-column', 'Keep at least one column.');
        removed = { kind: 'column', index: columnIndex, column: copy(buffer.columns[columnIndex]), cells: Object.fromEntries(buffer.rows.map(row => [row.id, copy(row.cells[columnIndex])])) };
        buffer.columns.splice(columnIndex, 1); buffer.rows.forEach(row => row.cells.splice(columnIndex, 1)); selectedColumn = buffer.columns[Math.min(columnIndex, buffer.columns.length - 1)].id;
      } else if (action === 'undo' && removed) {
        if (removed.kind === 'row') {
          if (buffer.rows.length >= 100) fail('table-limit', 'Remove a row before restoring this one.');
          const row = copy(removed.row);
          if (buffer.rows.some(item => item.id === row.id)) row.id = nextId('row', buffer.rows.map(item => item.id));
          // Row recovery maps retained columns by their identity, preserving later structural edits.
          row.cells = buffer.columns.map(column => copy(removed.columns?.[column.id] || inlineText('Add value.')));
          buffer.rows.splice(Math.min(removed.index, buffer.rows.length), 0, row); selectedRow = row.id;
        } else {
          if (buffer.columns.length >= 12) fail('table-limit', 'Remove a column before restoring this one.');
          const column = copy(removed.column), index = Math.min(removed.index, buffer.columns.length);
          if (buffer.columns.some(item => item.id === column.id)) column.id = nextId('column', buffer.columns.map(item => item.id));
          buffer.columns.splice(index, 0, column); buffer.rows.forEach(row => row.cells.splice(index, 0, copy(removed.cells[row.id] || inlineText('Add value.')))); selectedColumn = column.id;
        }
        removed = null;
      } else if (['row-up', 'row-down'].includes(action)) {
        const destination = rowIndex + (action === 'row-up' ? -1 : 1); if (destination < 0 || destination >= buffer.rows.length) return;
        const [row] = buffer.rows.splice(rowIndex, 1); buffer.rows.splice(destination, 0, row);
      } else if (['column-left', 'column-right'].includes(action)) {
        const destination = columnIndex + (action === 'column-left' ? -1 : 1); if (destination < 0 || destination >= buffer.columns.length) return;
        const [column] = buffer.columns.splice(columnIndex, 1); buffer.columns.splice(destination, 0, column);
        buffer.rows.forEach(row => { const [cell] = row.cells.splice(columnIndex, 1); row.cells.splice(destination, 0, cell); });
      }
      if (action === 'remove-row') removed.columns = Object.fromEntries(before.columns.map((column, index) => [column.id, copy(removed.row.cells[index])]));
      assertBlockContent(type, 1, buffer, { mathEngine }); renderTable(); notify();
    } catch (error) { buffer = before; removed = priorRemoved; selectedRow = priorRow; selectedColumn = priorColumn; renderTable(); throw error; }
  }
  function tableControls() {
    metadata('caption', 'Table caption', { maxLength: 240 });
    const rowHeader = field(shell, 'row_header', 'Use first column as row headers', buffer.row_header, { checkbox: true });
    listen(rowHeader, 'change', () => { try { commitCell(); buffer.row_header = rowHeader.checked; renderTable(); notify(); } catch (error) { rowHeader.checked = buffer.row_header; report(error); } });
    const toolbar = element('div', undefined, 'media-editor-table-actions'); shell.append(toolbar);
    for (const [key, label] of [['add-row', 'Add row'], ['add-column', 'Add column'], ['remove-row', 'Remove selected row'], ['remove-column', 'Remove selected column'],
      ['row-up', 'Move row up'], ['row-down', 'Move row down'], ['column-left', 'Move column left'], ['column-right', 'Move column right'], ['undo', 'Undo table deletion']]) tableButtons[key] = button(toolbar, label, key, () => tableAction(key));
    tableRoot = element('div', undefined, 'media-editor-table-scroll'); cellHeading = element('h4'); cellRoot = element('div', undefined, 'media-editor-cell');
    shell.append(tableRoot, cellHeading, cellRoot); renderTable();
  }
  function render() {
    listeners.splice(0).forEach(remove => remove()); tableListeners.splice(0).forEach(remove => remove()); cellEditor?.dispose(); cellEditor = null; cellKey = ''; cellInvalid = false; fields.clear();
    shell = element('div', undefined, 'media-editor'); shell.dataset.mediaType = type; status = element('p', '', 'media-editor-status'); status.setAttribute('role', 'status');
    root.replaceChildren(shell); root.dataset.mediaEditorValid = lastValid === null ? 'false' : 'true';
    if (type === 'table') tableControls();
    else if (type === 'video') {
      const url = field(shell, 'video-url', 'YouTube link', buffer.video_id ? `https://www.youtube.com/watch?v=${buffer.video_id}` : '', { maxLength: 2048, inputType: 'url' }); listen(url, 'input', notify);
      metadata('title', 'Video title', { maxLength: 240 });
      const start = field(shell, 'start_seconds', 'Start at (seconds)', buffer.start_seconds, { inputType: 'number' }); start.min = '0'; start.max = '86400'; start.step = '1';
      listen(start, 'input', () => { buffer.start_seconds = /^\d+$/.test(start.value) ? Number(start.value) : null; notify(); });
      metadata('transcript', 'Transcript', { multiline: true });
    } else {
      uploadControls();
      if (type === 'resource') { metadata('title', 'Resource title', { maxLength: 240 }); metadata('description', 'Resource description', { multiline: true }); }
      else {
        const alt = metadata('alt', 'Alternative text', { multiline: true }); alt.disabled = buffer.decorative;
        const decorative = field(shell, 'decorative', 'Decorative image', buffer.decorative, { checkbox: true });
        listen(decorative, 'change', () => {
          if (decorative.checked) { altBeforeDecorative = alt.value; buffer.alt = ''; } else buffer.alt = altBeforeDecorative;
          buffer.decorative = decorative.checked; alt.disabled = buffer.decorative; alt.value = buffer.alt; notify();
        });
        metadata('caption', 'Caption', { multiline: true }); metadata('description', 'Detailed image description', { multiline: true });
      }
    }
    shell.append(status);
  }
  render();
  return Object.freeze({
    getValue: currentValue,
    setValue(next) {
      active(); assertBlockContent(type, 1, next, { mathEngine });
      if (JSON.stringify(next) === lastValid) return;
      stopUpload(); buffer = copy(next); lastValid = JSON.stringify(next); selectedRow = buffer.rows?.[0]?.id; selectedColumn = buffer.columns?.[0]?.id;
      removed = null; altBeforeDecorative = buffer.alt || ''; render();
    },
    focus() { active(); (shell.querySelector('input:not([disabled]),textarea:not([disabled]),button:not([disabled])') || shell).focus(); },
    dispose() {
      if (disposed) return; stopUpload(); disposed = true; listeners.splice(0).forEach(remove => remove()); tableListeners.splice(0).forEach(remove => remove()); cellEditor?.dispose(); cellEditor = null;
      for (const control of shell.querySelectorAll('input,textarea')) control.value = ''; shell.replaceChildren(); root.replaceChildren(); delete root.dataset.mediaEditorValid;
      buffer = null; lastValid = null; removed = null; selectedRow = selectedColumn = null; fields.clear(); onChange = onInvalid = () => {}; uploadAsset = undefined;
    }
  });
}
