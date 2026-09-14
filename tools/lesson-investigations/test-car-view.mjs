// Actual component with a deliberately small synthetic DOM and controlled RAF.
// These are lifecycle/model-link checks; real layout/browser accessibility is separate.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mountCar } from '../../lessons/shared/investigations/car-view.mjs';

class Tracked extends EventTarget {
  active = new Map();
  addEventListener(type, callback, options) { super.addEventListener(type, callback, options); if (!this.active.has(type)) this.active.set(type, new Set()); this.active.get(type).add(callback); }
  removeEventListener(type, callback, options) { super.removeEventListener(type, callback, options); this.active.get(type)?.delete(callback); }
  get listenerCount() { return [...this.active.values()].reduce((n, values) => n + values.size, 0); }
}
class Node extends Tracked {
  constructor(doc, tag) { super(); this.ownerDocument = doc; this.tagName = tag; this.children = []; this.attrs = new Map(); this.parentNode = null; this.textContent = ''; }
  setAttribute(key, value) { this.attrs.set(key, String(value)); }
  getAttribute(key) { return this.attrs.get(key) ?? null; }
  append(...nodes) { for (const node of nodes) { node.remove(); node.parentNode = this; this.children.push(node); } }
  replaceChildren(...nodes) { for (const node of [...this.children]) node.remove(); this.append(...nodes); }
  remove() { if (this.parentNode) { this.parentNode.children.splice(this.parentNode.children.indexOf(this), 1); this.parentNode = null; } }
  get isConnected() { return this === this.ownerDocument.body || Boolean(this.parentNode?.isConnected); }
}
function fixture(reduced = false) {
  const doc = new Tracked(); doc.hidden = false; doc.createElement = tag => new Node(doc, tag); doc.createElementNS = (_, tag) => new Node(doc, tag); doc.body = doc.createElement('body');
  const win = new Tracked(), media = new Tracked(); media.matches = reduced; win.matchMedia = () => media;
  const frames = new Map(); let id = 0; win.requestAnimationFrame = fn => { frames.set(++id, fn); return id; }; win.cancelAnimationFrame = token => frames.delete(token);
  const tick = stamp => { const batch = [...frames.values()]; frames.clear(); batch.forEach(fn => fn(stamp)); };
  const root = doc.createElement('div'); doc.body.append(root);
  const walk = node => [node, ...node.children.flatMap(walk)];
  const find = key => walk(root).find(node => node.attrs.has(key));
  const model = { a: -0.5, b: 4, c: 0, start: 0, step: 1, count: 8 };
  return { doc, win, media, frames, tick, root, find, walk, model };
}
const fire = (node, type) => node.dispatchEvent(new Event(type));
const scrub = (f, time) => { const input = f.find('data-car-time'); input.value = String(time); fire(input, 'input'); };
const xCar = f => Number(f.find('data-car-position').getAttribute('transform').match(/translate\(([^ ]+)/)[1]);

test('mount has labelled controls, metre units and no initial RAF', () => {
  const f = fixture(), view = mountCar({ root: f.root, window: f.win, model: f.model });
  assert.equal(f.frames.size, 0); assert.equal(f.find('data-car-time').min, '0'); assert.equal(f.find('data-car-time').max, '8');
  assert.equal(f.find('data-car-time').getAttribute('aria-label'), 'Time in seconds');
  assert.match(f.find('data-car-readout').textContent, /Position 0 m/); assert.equal(f.find('data-car-play').textContent, 'Play');
  view.dispose();
});
test('scrubbing reversal synchronizes car and graph while scale remains fixed', () => {
  const f = fixture(), view = mountCar({ root: f.root, window: f.win, model: f.model });
  const origin = xCar(f); scrub(f, 2); const x2 = xCar(f), y2 = f.find('data-car-graph-point').getAttribute('cy');
  scrub(f, 4); const peak = xCar(f); assert.ok(peak > x2); assert.match(f.find('data-car-readout').textContent, /Stationary/);
  scrub(f, 6); assert.equal(xCar(f), x2); assert.equal(f.find('data-car-graph-point').getAttribute('cy'), y2);
  assert.match(f.find('data-car-readout').textContent, /decreasing/); assert.match(f.find('data-car-position').getAttribute('transform'), /scale\(-1 1\)/);
  scrub(f, 8); assert.equal(xCar(f), origin); assert.equal(f.frames.size, 0);
  const marks = f.walk(f.root).filter(node => node.attrs.has('data-car-time-mark'));
  assert.ok(marks.some(node => node.getAttribute('data-car-time-mark') === '2, 6'));
  view.dispose();
});
test('RAF runs only while playing, stops at interval end and can reset', () => {
  const f = fixture(), view = mountCar({ root: f.root, window: f.win, model: f.model });
  fire(f.find('data-car-play'), 'click'); assert.equal(f.frames.size, 1);
  f.tick(100); f.tick(2100); assert.equal(f.find('data-car-time').value, '2'); assert.equal(f.frames.size, 1);
  f.tick(10100); assert.equal(f.find('data-car-time').value, '8'); assert.equal(f.frames.size, 0); assert.equal(f.find('data-car-play').textContent, 'Play');
  fire(f.find('data-car-reset'), 'click'); assert.equal(f.find('data-car-time').value, '0'); assert.equal(f.frames.size, 0);
  view.dispose();
});
test('pause and manual scrub cancel the owned frame without continuing time', () => {
  const f = fixture(), view = mountCar({ root: f.root, window: f.win, model: f.model });
  fire(f.find('data-car-play'), 'click'); f.tick(0); f.tick(1000); fire(f.find('data-car-play'), 'click');
  assert.equal(f.frames.size, 0); assert.equal(f.find('data-car-time').value, '1');
  fire(f.find('data-car-play'), 'click'); scrub(f, 3); assert.equal(f.frames.size, 0); assert.equal(f.find('data-car-time').value, '3');
  view.dispose();
});
test('visibility and pagehide stop animation without automatic restart', () => {
  const f = fixture(), view = mountCar({ root: f.root, window: f.win, model: f.model });
  fire(f.find('data-car-play'), 'click'); f.doc.hidden = true; fire(f.doc, 'visibilitychange');
  assert.equal(f.frames.size, 0); assert.equal(f.find('data-car-play').disabled, true);
  f.doc.hidden = false; fire(f.doc, 'visibilitychange'); assert.equal(f.frames.size, 0); assert.equal(f.find('data-car-play').disabled, false);
  fire(f.find('data-car-play'), 'click'); fire(f.win, 'pagehide'); assert.equal(f.frames.size, 0);
  view.dispose();
});
test('reduced motion prevents playback while scrub/reset remain usable', () => {
  const f = fixture(true), view = mountCar({ root: f.root, window: f.win, model: f.model });
  assert.equal(f.find('data-car-play').disabled, true); fire(f.find('data-car-play'), 'click'); assert.equal(f.frames.size, 0);
  scrub(f, 4); assert.equal(f.find('data-car-position').getAttribute('data-position'), '8');
  fire(f.find('data-car-reset'), 'click'); assert.equal(f.find('data-car-time').value, '0');
  f.media.matches = false; fire(f.media, 'change'); fire(f.find('data-car-play'), 'click'); assert.equal(f.frames.size, 1);
  f.media.matches = true; fire(f.media, 'change'); assert.equal(f.frames.size, 0); assert.equal(f.find('data-car-play').disabled, true);
  view.dispose();
});
test('update pauses, rebuilds the model and clamps the old time into new interval', () => {
  const f = fixture(), view = mountCar({ root: f.root, window: f.win, model: f.model });
  scrub(f, 7); fire(f.find('data-car-play'), 'click');
  view.update({ a: 0, b: -2, c: 4, start: 0, step: 1, count: 2 });
  assert.equal(f.frames.size, 0); assert.equal(f.find('data-car-time').max, '2'); assert.equal(f.find('data-car-time').value, '2');
  assert.equal(f.find('data-car-position').getAttribute('data-position'), '0'); assert.match(f.find('data-car-readout').textContent, /decreasing/);
  assert.throws(() => view.update({ step: 0 }), RangeError); assert.equal(f.find('data-car-time').max, '2');
  view.dispose();
});
test('dispose cancels frames, removes all owned listeners, preserves sibling and stays idempotent', () => {
  const f = fixture(), sibling = f.doc.createElement('p'); f.root.append(sibling);
  const view = mountCar({ root: f.root, window: f.win, model: f.model });
  const nodes = f.walk(f.root); fire(f.find('data-car-play'), 'click');
  const captured = [...f.frames.values()][0]; view.dispose(); view.dispose(); captured(999);
  assert.equal(f.frames.size, 0); assert.deepEqual(f.root.children, [sibling]);
  assert.equal(f.doc.listenerCount, 0); assert.equal(f.win.listenerCount, 0); assert.equal(f.media.listenerCount, 0);
  nodes.forEach(node => assert.equal(node.listenerCount, 0));
  assert.throws(() => view.update(f.model), /disposed/);
});
