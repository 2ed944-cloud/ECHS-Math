import { assertBlockContent, isSafeLessonHref, LessonDocumentError } from '../lesson-runtime/schema.mjs';
import { compileMathSource } from '../lesson-runtime/math-expression.mjs';
import { createMathEditor } from './math-editor.mjs';

const clone = value => JSON.parse(JSON.stringify(value));
const issue = (code, message) => new LessonDocumentError([{ path: '', code, message }]);
const marksFor = marks => ['strong', 'em'].filter(mark => marks.includes(mark));
const textNode = (text, marks = []) => ({ type: 'text', text, ...(marks.length ? { marks: marksFor(marks) } : {}) });
const inlineLength = node => node.type === 'math' ? 1 : node.type === 'link' ? node.children.reduce((sum, child) => sum + child.text.length, 0) : node.text.length;
const rowLength = row => row.children.reduce((sum, node) => sum + inlineLength(node), 0);
function compact(children) {
  const result = [];
  for (const source of children) {
    const node = clone(source), previous = result.at(-1);
    if (node.type === 'text' && node.text.length === 0) continue;
    if (node.type === 'text') {
      node.marks = marksFor(node.marks || []); if (!node.marks.length) delete node.marks;
      if (previous?.type === 'text' && JSON.stringify(previous.marks) === JSON.stringify(node.marks) && previous.text.length + node.text.length <= 4000) {
        previous.text += node.text; continue;
      }
    }
    result.push(node);
  }
  return result;
}
function rowsFrom(content) {
  return content.nodes.flatMap(node => node.type === 'paragraph' ? [{ style: 'paragraph', children: clone(node.children) }]
    : node.items.map(item => ({ style: node.style, children: clone(item.children) })));
}
function contentFrom(rows) {
  const nodes = [];
  for (const row of rows) {
    const children = compact(row.children), previous = nodes.at(-1);
    if (row.style === 'paragraph') nodes.push({ type: 'paragraph', children });
    else if (previous?.type === 'list' && previous.style === row.style) previous.items.push({ type: 'list-item', children });
    else nodes.push({ type: 'list', style: row.style, items: [{ type: 'list-item', children }] });
  }
  return { nodes };
}
function sliceInline(node, start, end) {
  if (end <= start) return [];
  if (node.type === 'math') return start === 0 && end >= 1 ? [clone(node)] : [];
  if (node.type === 'text') return [textNode(node.text.slice(start, end), node.marks || [])];
  return [{ type: 'link', href: node.href, children: sliceChildren(node.children, start, end) }];
}
function sliceChildren(children, start, end) {
  const sliced = []; let at = 0;
  for (const node of children) {
    const length = inlineLength(node);
    sliced.push(...sliceInline(node, Math.max(0, start - at), Math.min(length, end - at))); at += length;
  }
  return compact(sliced);
}
function mapSelected(rows, selection, change) {
  let at = 0;
  return rows.map(row => {
    const length = rowLength(row), start = Math.max(0, selection.start - at), end = Math.min(length, selection.end - at); at += length + 1;
    if (end <= start) return clone(row);
    const selected = sliceChildren(row.children, start, end);
    return { ...row, children: compact([...sliceChildren(row.children, 0, start), ...change(selected), ...sliceChildren(row.children, end, length)]) };
  });
}
function textLeaves(nodes) { return nodes.flatMap(node => node.type === 'link' ? node.children : node.type === 'text' ? [node] : []); }
function withMark(nodes, mark, enabled) {
  return nodes.map(node => node.type === 'math' ? clone(node) : node.type === 'link'
    ? { ...node, children: withMark(node.children, mark, enabled) }
    : textNode(node.text, enabled ? [...(node.marks || []), mark] : (node.marks || []).filter(item => item !== mark)));
}

/** Framework-neutral, controlled rich text. The DOM is an editing buffer, never persisted HTML. */
export function createRichTextEditor({ root, content, mathEngine, onChange = () => {}, onInvalid = () => {}, inlineOnly = false } = {}) {
  if (!root?.ownerDocument || typeof onChange !== 'function' || typeof onInvalid !== 'function') throw new TypeError('An editor root and callbacks are required.');
  if (typeof inlineOnly !== 'boolean') throw new TypeError('Inline-only mode must be a boolean.');
  function checked(next) {
    assertBlockContent('rich-text', 2, next, { mathEngine });
    if (inlineOnly && (next.nodes.length !== 1 || next.nodes[0].type !== 'paragraph')) throw issue('inline-content', 'A table cell contains one text paragraph with optional formatting and mathematics.');
  }
  checked(content);
  const document = root.ownerDocument, window = document.defaultView, listeners = [];
  let value = clone(content), invalid = null, disposed = false, composing = false, pending = false, savedSelection = { start: 0, end: 0 };
  let atoms = new WeakMap(), paddingBreaks = new WeakSet(), mathEditor = null, dialogRange = null;
  const markButtons = {};
  const element = (tag, className, label) => {
    const node = document.createElement(tag); if (className) node.className = className; if (label) node.textContent = label; return node;
  };
  const shell = element('div', 'rich-editor'), toolbar = element('div', 'rich-editor-toolbar');
  toolbar.setAttribute('role', 'toolbar'); toolbar.setAttribute('aria-label', 'Text formatting');
  const surface = element('div', 'rich-editor-surface'); surface.contentEditable = 'true'; surface.setAttribute('role', 'textbox');
  surface.setAttribute('aria-label', 'Rich text'); surface.setAttribute('aria-multiline', 'true'); surface.spellcheck = true;
  const status = element('p', 'rich-editor-status'); status.setAttribute('role', 'status');
  const linkPanel = element('div', 'rich-editor-link'); linkPanel.hidden = true;
  const linkLabel = element('label', '', 'Web address'), linkInput = element('input'); linkInput.type = 'url'; linkInput.placeholder = 'https://example.org/resource';
  linkLabel.append(linkInput); linkPanel.append(linkLabel);
  const mathDialog = element('dialog', 'rich-editor-math-dialog'), mathHeading = element('h3', '', 'Inline mathematics'), mathRoot = element('div', 'rich-editor-math');
  mathDialog.setAttribute('aria-label', 'Inline mathematics'); mathDialog.append(mathHeading, mathRoot);
  shell.append(toolbar, surface, status, linkPanel, mathDialog); root.replaceChildren(shell);
  function listen(target, name, handler) { target.addEventListener(name, handler); listeners.push(() => target.removeEventListener(name, handler)); }
  function active() { if (disposed) throw issue('editor-disposed', 'This editor is closed.'); }
  function setPending(next) {
    pending = next; surface.inert = next; surface.contentEditable = next ? 'false' : 'true';
    surface.setAttribute('aria-readonly', String(next));
    for (const control of toolbar.querySelectorAll('button')) control.disabled = next;
  }
  function report(error) {
    invalid = error?.errors ? error : issue('invalid-rich-text', 'Check the text, links and mathematics before saving.');
    surface.setAttribute('aria-invalid', 'true'); status.textContent = invalid.errors[0]?.message || 'Check this content.';
    onInvalid({ valid: false, errors: invalid.errors.map(({ path, code, message }) => ({ path, code, message })) });
  }
  function valid(next, notify = true) {
    checked(next);
    value = clone(next); invalid = null; surface.removeAttribute('aria-invalid'); status.textContent = '';
    if (notify) onChange(clone(value));
  }
  function button(parent, label, action) {
    const node = element('button', 'rich-editor-button', label); node.type = 'button';
    listen(node, 'mousedown', event => { if (event.button === 0) event.preventDefault(); });
    listen(node, 'click', () => { if (!disposed) { try { action(); } catch (error) { report(error); } } });
    parent.append(node); return node;
  }
  function appendInline(parent, node) {
    if (node.type === 'text') {
      let target = parent;
      for (const mark of node.marks || []) { const wrapper = element(mark === 'strong' ? 'strong' : 'em'); target.append(wrapper); target = wrapper; }
      target.append(document.createTextNode(node.text)); return;
    }
    if (node.type === 'link') {
      const link = element('a'); link.href = node.href; link.rel = 'noopener noreferrer'; node.children.forEach(child => appendInline(link, child)); parent.append(link); return;
    }
    const atom = element('span', 'rich-editor-inline-math'); atom.contentEditable = 'false'; atom.tabIndex = 0;
    atom.setAttribute('role', 'button'); atom.setAttribute('aria-label', `Edit mathematics: ${node.spoken}`); atoms.set(atom, clone(node));
    const tex = compileMathSource(node.source);
    mathEngine.render(tex, atom, { displayMode: false, throwOnError: true, trust: false, strict: 'error', maxExpand: 100, maxSize: 10, macros: {} });
    parent.append(atom);
  }
  function render(next) {
    atoms = new WeakMap(); paddingBreaks = new WeakSet(); const fragment = document.createDocumentFragment();
    for (const node of next.nodes) {
      if (node.type === 'paragraph') { const paragraph = element('p'); node.children.forEach(child => appendInline(paragraph, child)); fragment.append(paragraph); }
      else {
        const list = element(node.style === 'ordered' ? 'ol' : 'ul');
        for (const item of node.items) { const li = element('li'); item.children.forEach(child => appendInline(li, child)); list.append(li); }
        fragment.append(list);
      }
    }
    surface.replaceChildren(fragment);
    if (inlineOnly) ensureTerminalLine();
  }
  function ensureTerminalLine() {
    if (!inlineOnly) return;
    const row = surface.querySelector('p') || surface;
    for (const child of row.querySelectorAll('br')) if (paddingBreaks.has(child)) child.remove();
    if (row.textContent.endsWith('\n')) { const br = element('br'); paddingBreaks.add(br); row.append(br); }
  }
  /** Read only controlled nodes. Unknown markup is rejected, never interpreted or exported. */
  function read() {
    const rows = [], positions = []; let at = 0, inspected = 0;
    function inline(node, marks = []) {
      if (++inspected > 15000) throw issue('editor-size', 'This block contains too much content.');
      if (node.nodeType === 3) { const text = node.data; positions.push({ node, start: at, length: text.length }); at += text.length; return text.length ? [textNode(text, marks)] : []; }
      if (node.nodeType !== 1) throw issue('unsupported-markup', 'Use plain text, formatting, lists, links or mathematics.');
      if (paddingBreaks.has(node)) return [];
      if (atoms.has(node)) { positions.push({ node, start: at++, length: 1, atom: true }); return [clone(atoms.get(node))]; }
      const tag = node.tagName;
      if (tag === 'BR') { positions.push({ node, start: at++, length: 1, atom: true }); return [textNode('\n', marks)]; }
      if (tag === 'A') {
        const children = [...node.childNodes].flatMap(child => inline(child, marks));
        if (children.some(child => child.type !== 'text')) throw issue('invalid-link', 'Links may contain text only.');
        return [{ type: 'link', href: node.getAttribute('href'), children: compact(children) }];
      }
      if (!['STRONG', 'B', 'EM', 'I', 'SPAN'].includes(tag)) throw issue('unsupported-markup', 'Use plain text, formatting, lists, links or mathematics.');
      const nextMarks = ['STRONG', 'B'].includes(tag) ? [...marks, 'strong'] : ['EM', 'I'].includes(tag) ? [...marks, 'em'] : marks;
      return [...node.childNodes].flatMap(child => inline(child, nextMarks));
    }
    function row(style, nodes) { const children = nodes.flatMap(node => inline(node)); rows.push({ style, children: compact(children) }); at++; }
    let loose = [];
    const flush = () => { if (loose.length) { row('paragraph', loose); loose = []; } };
    for (const node of surface.childNodes) {
      if (node.nodeType === 1 && ['P', 'DIV'].includes(node.tagName)) { flush(); row('paragraph', [...node.childNodes]); }
      else if (node.nodeType === 1 && ['OL', 'UL'].includes(node.tagName)) {
        flush();
        for (const item of node.childNodes) {
          if (item.nodeType === 3 && !item.data.trim()) continue;
          if (item.nodeType !== 1 || item.tagName !== 'LI') throw issue('invalid-list', 'A list must contain text items.');
          row(node.tagName === 'OL' ? 'ordered' : 'unordered', [...item.childNodes]);
        }
      } else loose.push(node);
    }
    flush(); return { content: contentFrom(rows), rows, positions, length: Math.max(0, at - 1) };
  }
  function offsetFor(container, offset, buffer) {
    const caret = document.createRange(); caret.setStart(container, offset); caret.collapse(true);
    let last = 0;
    for (const item of buffer.positions) {
      if (item.node === container && !item.atom) return item.start + Math.min(offset, item.length);
      const range = document.createRange(); range.selectNode(item.node);
      if (caret.compareBoundaryPoints(window.Range.START_TO_START, range) <= 0) return item.start;
      if (caret.compareBoundaryPoints(window.Range.END_TO_END, range) < 0) return item.start;
      last = item.start + item.length;
    }
    return Math.min(buffer.length, last);
  }
  function capture(buffer = read()) {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return savedSelection;
    const range = selection.getRangeAt(0);
    if (!surface.contains(range.startContainer) || !surface.contains(range.endContainer)) return savedSelection;
    savedSelection = { start: offsetFor(range.startContainer, range.startOffset, buffer), end: offsetFor(range.endContainer, range.endOffset, buffer) };
    const leaves = [];
    if (savedSelection.start !== savedSelection.end) mapSelected(buffer.rows, savedSelection, children => { leaves.push(...textLeaves(children)); return children; });
    for (const [mark, control] of Object.entries(markButtons)) control.setAttribute('aria-pressed', String(leaves.length > 0 && leaves.every(node => node.marks?.includes(mark))));
    return { ...savedSelection };
  }
  function restore(selection) {
    const buffer = read(), range = document.createRange();
    function point(offset) {
      for (const item of buffer.positions) {
        if (offset <= item.start + item.length) {
          if (!item.atom) return [item.node, Math.max(0, offset - item.start)];
          const parent = item.node.parentNode, index = [...parent.childNodes].indexOf(item.node);
          return [parent, index + (offset > item.start ? 1 : 0)];
        }
      }
      return [surface, surface.childNodes.length];
    }
    const [startNode, startOffset] = point(selection.start), [endNode, endOffset] = point(selection.end);
    range.setStart(startNode, startOffset); range.setEnd(endNode, endOffset); surface.focus();
    const current = window.getSelection(); current.removeAllRanges(); current.addRange(range); savedSelection = { ...selection };
  }
  function currentBuffer() {
    active(); if (composing || pending) throw issue('unfinished-edit', 'Finish or cancel the current edit before saving.');
    const buffer = read(); checked(buffer.content); return buffer;
  }
  function commit(next, selection) {
    checked(next); render(next); restore(selection); valid(next);
  }
  function processInput() {
    if (disposed || composing || pending) return;
    try { ensureTerminalLine(); const buffer = read(); capture(buffer); valid(buffer.content); } catch (error) { report(error); }
  }
  function selectedText(action) {
    const buffer = currentBuffer(), selection = capture(buffer);
    if (selection.start === selection.end) { status.textContent = 'Select some text first.'; return; }
    action(buffer, selection);
  }
  function format(mark) {
    selectedText((buffer, selection) => {
      const leaves = []; mapSelected(buffer.rows, selection, children => { leaves.push(...textLeaves(children)); return children; });
      const enable = !leaves.length || !leaves.every(node => node.marks?.includes(mark));
      commit(contentFrom(mapSelected(buffer.rows, selection, children => withMark(children, mark, enable))), selection);
    });
  }
  function styleRows(style) {
    const buffer = currentBuffer(), selection = capture(buffer); let at = 0;
    const rows = buffer.rows.map(row => {
      const length = rowLength(row), selected = selection.start === selection.end ? selection.start >= at && selection.start <= at + length
        : selection.end > at && selection.start <= at + length;
      at += length + 1; return { ...row, style: selected ? style : row.style };
    });
    commit(contentFrom(rows), selection);
  }
  markButtons.strong = button(toolbar, 'Bold', () => format('strong'));
  markButtons.em = button(toolbar, 'Italic', () => format('em'));
  for (const control of Object.values(markButtons)) control.setAttribute('aria-pressed', 'false');
  if (!inlineOnly) {
    button(toolbar, 'Paragraph', () => styleRows('paragraph'));
    button(toolbar, 'Bulleted list', () => styleRows('unordered'));
    button(toolbar, 'Numbered list', () => styleRows('ordered'));
  }
  button(toolbar, 'Add link', () => selectedText((buffer, selection) => {
    dialogRange = selection; setPending(true); linkPanel.hidden = false; linkInput.value = ''; linkInput.focus();
    report(issue('unfinished-link', 'Enter a safe web address, or cancel the link.'));
  }));
  button(toolbar, 'Remove link', () => selectedText((buffer, selection) => commit(contentFrom(mapSelected(buffer.rows, selection,
    children => children.flatMap(node => node.type === 'link' ? clone(node.children) : [node]))), selection)));
  button(linkPanel, 'Apply link', () => {
    if (!isSafeLessonHref(linkInput.value)) throw issue('unsafe-link', 'Use a complete HTTPS web address without a login or port number.');
    const buffer = read(), selection = dialogRange;
    const next = contentFrom(mapSelected(buffer.rows, selection, children => {
      if (children.some(node => node.type === 'math')) throw issue('invalid-link', 'Select text without mathematics for this link.');
      return [{ type: 'link', href: linkInput.value, children: compact(textLeaves(children)) }];
    }));
    checked(next); setPending(false); linkPanel.hidden = true; linkInput.value = ''; dialogRange = null;
    commit(next, selection);
  });
  function cancelPending() {
    setPending(false); linkPanel.hidden = true; linkInput.value = ''; mathEditor?.dispose(); mathEditor = null;
    if (mathDialog.open) mathDialog.close(); const selection = dialogRange || savedSelection; dialogRange = null;
    try { valid(read().content); restore(selection); } catch (error) { report(error); }
  }
  button(linkPanel, 'Cancel link', cancelPending);
  function spliceInline(buffer, selection, nodes) {
    let at = 0, startIndex = 0, endIndex = buffer.rows.length - 1, start = 0, end = rowLength(buffer.rows.at(-1));
    for (let index = 0; index < buffer.rows.length; index++) {
      const length = rowLength(buffer.rows[index]);
      if (selection.start >= at && selection.start <= at + length) { startIndex = index; start = selection.start - at; }
      if (selection.end >= at && selection.end <= at + length) { endIndex = index; end = selection.end - at; }
      at += length + 1;
    }
    const rows = clone(buffer.rows), before = rows[startIndex], after = rows[endIndex];
    rows.splice(startIndex, endIndex - startIndex + 1, { style: before.style, children: compact([
      ...sliceChildren(before.children, 0, start), ...nodes, ...sliceChildren(after.children, end, rowLength(after))]) });
    return contentFrom(rows);
  }
  function openMath(existing, selection) {
    const buffer = currentBuffer(); dialogRange = selection || capture(buffer); setPending(true);
    mathEditor = createMathEditor({ root: mathRoot, value: existing ? { source: clone(existing.source), spoken: existing.spoken, display: false }
      : { source: { mode: 'visual', expression: { kind: 'symbol', name: 'x' } }, spoken: 'x', display: false }, mathEngine, allowDisplayMode: false,
      onInvalid: errors => report(issue('unfinished-math', errors.errors?.[0]?.message || 'Finish the mathematics before inserting it.')) });
    mathDialog.showModal(); mathEditor.focus(); report(issue('unfinished-math', 'Insert or cancel the mathematics before saving.'));
  }
  button(toolbar, 'Insert mathematics', () => openMath());
  button(mathDialog, 'Insert mathematics', () => {
    const math = mathEditor.getValue(), selection = dialogRange, buffer = read();
    const next = spliceInline(buffer, selection, [{ type: 'math', source: clone(math.source), spoken: math.spoken }]);
    checked(next); setPending(false); mathEditor.dispose(); mathEditor = null;
    mathDialog.close(); dialogRange = null; commit(next, { start: selection.start + 1, end: selection.start + 1 });
  });
  button(mathDialog, 'Cancel mathematics', cancelPending);
  listen(mathDialog, 'cancel', event => { event.preventDefault(); cancelPending(); });
  function editAtom(target) {
    const atom = target?.closest?.('.rich-editor-inline-math'); if (!atom || !atoms.has(atom)) return false;
    const buffer = currentBuffer(), item = buffer.positions.find(entry => entry.node === atom);
    openMath(atoms.get(atom), { start: item.start, end: item.start + 1 }); return true;
  }
  listen(surface, 'click', event => { if (event.target.closest?.('a')) event.preventDefault(); try { editAtom(event.target); } catch (error) { report(error); } });
  listen(surface, 'keydown', event => {
    if ((event.key === 'Enter' || event.key === ' ') && event.target.closest?.('.rich-editor-inline-math')) { event.preventDefault(); try { editAtom(event.target); } catch (error) { report(error); } }
    if ((event.ctrlKey || event.metaKey) && ['b', 'i'].includes(event.key.toLowerCase())) { event.preventDefault(); try { format(event.key.toLowerCase() === 'b' ? 'strong' : 'em'); } catch (error) { report(error); } }
  });
  listen(surface, 'input', processInput);
  listen(toolbar, 'keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const controls = [...toolbar.querySelectorAll('button')], index = controls.indexOf(document.activeElement);
    if (index < 0) return; event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? controls.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + controls.length) % controls.length;
    controls[next].focus();
  });
  listen(surface, 'compositionstart', () => { composing = true; report(issue('unfinished-composition', 'Finish entering this text before saving.')); });
  listen(surface, 'compositionend', () => { composing = false; processInput(); });
  function insertPlainText(text) {
    if (disposed || pending) return;
    if (!text) return;
    if (text.length > 200000) { report(issue('editor-size', 'Paste a smaller amount of text.')); return; }
    try {
      restore(capture()); const selection = window.getSelection(), range = selection.getRangeAt(0), node = document.createTextNode(text);
      range.deleteContents(); range.insertNode(node); ensureTerminalLine(); range.setStart(node, node.length); range.collapse(true); selection.removeAllRanges(); selection.addRange(range); processInput();
    } catch (error) { report(error); }
  }
  function pastePlain(event) {
    event.preventDefault();
    insertPlainText(event.clipboardData?.getData('text/plain') ?? event.dataTransfer?.getData('text/plain') ?? '');
  }
  listen(surface, 'beforeinput', event => {
    if (inlineOnly && !event.isComposing && ['insertParagraph', 'insertLineBreak'].includes(event.inputType)) { event.preventDefault(); insertPlainText('\n'); }
  });
  listen(surface, 'paste', pastePlain); listen(surface, 'drop', pastePlain);
  listen(document, 'selectionchange', () => { if (!disposed && !pending) { try { capture(); } catch {} } });
  render(value);
  return Object.freeze({
    getValue() { const buffer = currentBuffer(); if (invalid) throw invalid; return clone(buffer.content); },
    setValue(next) {
      active(); checked(next);
      if (JSON.stringify(next) === JSON.stringify(value)) return;
      if (composing || pending) throw issue('unfinished-edit', 'Finish or cancel the current edit first.');
      render(next); valid(next, false); savedSelection = { start: 0, end: 0 };
    },
    focus() { active(); surface.focus(); },
    dispose() {
      if (disposed) return; disposed = true; listeners.splice(0).forEach(remove => remove()); mathEditor?.dispose(); mathEditor = null;
      if (mathDialog.open) mathDialog.close(); root.replaceChildren(); value = null; invalid = null; atoms = new WeakMap(); paddingBreaks = new WeakSet();
      savedSelection = null; dialogRange = null; linkInput.value = ''; surface.replaceChildren(); mathRoot.replaceChildren();
    }
  });
}
