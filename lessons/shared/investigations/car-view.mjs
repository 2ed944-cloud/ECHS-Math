import { sampleRates, motionAt } from './ap-rates-model.mjs';
import { svgNode, format, scrollableGraph } from './visuals.mjs';

/**
 * Mount a view of declared directed position p(t)=at²+bt+c, in metres and seconds.
 * update(model) pauses, preserves/clamps time and recomputes the whole-model scale.
 * dispose() is idempotent and removes only this component's nodes and listeners.
 * No storage, assessment, timer loop or auto-play. One RAF exists only while playing.
 */
export function mountCar({ root, window: win, model }) {
  const doc = root?.ownerDocument;
  if (!doc || typeof root.append !== 'function' || !win) throw new TypeError('Car view requires a DOM root and window.');
  let sampled = sampleRates(model), input = sampled.input, time = input.start;
  let frameId = null, lastStamp = null, playing = false, disposed = false;
  let car, point, cursor, mapPosition, mapTime, mapHeight;
  const listeners = [];
  const media = typeof win.matchMedia === 'function' ? win.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const element = (tag, className, text) => {
    const node = doc.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node;
  };
  const host = element('section', 'ei-car-view');
  host.setAttribute('aria-label', 'Car position investigation');
  const description = element('p', '', 'A fixed origin marks zero metres. Dots on the track mark the car’s positions at equal time intervals; they are not equal-distance markers.');
  const drawings = element('div', 'ei-grid'), controls = element('div', 'ei-controls');
  const scrubLabel = element('label', '', 'Time (s) '), scrub = element('input');
  scrub.type = 'range'; scrub.setAttribute('aria-label', 'Time in seconds'); scrub.setAttribute('data-car-time', ''); scrubLabel.append(scrub);
  const play = element('button', '', 'Play'), reset = element('button', '', 'Reset');
  play.type = reset.type = 'button'; play.setAttribute('data-car-play', ''); reset.setAttribute('data-car-reset', '');
  play.setAttribute('aria-pressed', 'false');
  const readout = element('p', 'ei-readout'); readout.setAttribute('data-car-readout', '');
  const status = element('p', 'ei-car-status'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  controls.append(scrubLabel, play, reset); host.append(description, drawings, controls, readout, status); root.append(host);
  const end = () => input.start + input.step * input.count;
  const reduced = () => Boolean(media?.matches);
  const unavailable = () => reduced() || doc.hidden === true || typeof win.requestAnimationFrame !== 'function';
  function on(target, event, callback) {
    target.addEventListener(event, callback); listeners.push(() => target.removeEventListener(event, callback));
  }
  function pause(message) {
    playing = false; lastStamp = null;
    if (frameId !== null) { win.cancelAnimationFrame(frameId); frameId = null; }
    play.textContent = 'Play'; play.setAttribute('aria-pressed', 'false');
    if (message) status.textContent = message;
  }
  function accessibilityState() {
    play.disabled = unavailable();
    if (reduced()) status.textContent = 'Reduced motion is enabled. Use the time slider or Reset to compare positions.';
  }
  function renderTime() {
    const state = motionAt({ a: input.a, b: input.b, c: input.c, t: time });
    const facing = state.direction === 'decreasing' ? -1 : 1;
    car.setAttribute('transform', `translate(${mapPosition(state.position)} 77) scale(${facing} 1)`);
    car.setAttribute('aria-label', `Car at ${format(state.position)} metres`);
    car.setAttribute('data-position', String(state.position));
    point.setAttribute('cx', mapTime(time)); point.setAttribute('cy', mapHeight(state.position));
    cursor.setAttribute('x1', mapTime(time)); cursor.setAttribute('x2', mapTime(time));
    scrub.value = String(time);
    const direction = state.direction === 'stationary' ? 'Stationary at this instant.' : state.direction === 'increasing' ? 'Position is increasing.' : 'Position is decreasing.';
    readout.textContent = `Time ${format(time)} s · Position ${format(state.position)} m. ${direction}`;
    scrub.setAttribute('aria-valuetext', `${format(time)} seconds; position ${format(state.position)} metres; ${direction}`);
  }
  function renderModel() {
    drawings.replaceChildren();
    const values = sampled.rows.map(row => row.y);
    if (sampled.turningPoint) values.push(sampled.turningPoint.y);
    let low = Math.min(0, ...values), high = Math.max(0, ...values);
    if (low === high) { low -= 1; high += 1; }
    const pad = (high - low) * 0.1; low -= pad; high += pad;
    mapPosition = p => 55 + (p - low) / (high - low) * 490;
    mapTime = t => 65 + (t - input.start) / (end() - input.start) * 480;
    mapHeight = p => 275 - (p - low) / (high - low) * 225;
    const track = svgNode(doc, 'svg', { viewBox: '0 0 600 190', role: 'img', 'aria-label': 'Straight track showing directed position in metres', class: 'ei-graph ei-car-track' });
    track.append(svgNode(doc, 'title', {}, 'Car position on a fixed metre scale'),
      svgNode(doc, 'line', { x1: 55, x2: 545, y1: 90, y2: 90, stroke: '#344b50', 'stroke-width': 3 }));
    for (let i = 0; i <= 4; i++) {
      const p = low + (high - low) * i / 4;
      track.append(svgNode(doc, 'line', { x1: mapPosition(p), x2: mapPosition(p), y1: 86, y2: 97, stroke: '#344b50' }),
        svgNode(doc, 'text', { x: mapPosition(p), y: 156, 'text-anchor': 'middle', class: 'ei-axis-text' }, format(p, 2)));
    }
    track.append(svgNode(doc, 'line', { x1: mapPosition(0), x2: mapPosition(0), y1: 35, y2: 98, stroke: '#536178', 'stroke-dasharray': '4 4' }),
      svgNode(doc, 'text', { x: mapPosition(0), y: 27, 'text-anchor': 'middle', class: 'ei-axis-text' }, 'Origin: 0 m'),
      svgNode(doc, 'text', { x: 300, y: 184, 'text-anchor': 'middle', class: 'ei-axis-label' }, 'Position (m)'));
    const coincident = new Map();
    sampled.rows.forEach(row => { const key = row.y.toPrecision(12); if (!coincident.has(key)) coincident.set(key, { position: row.y, times: [] }); coincident.get(key).times.push(row.x); });
    [...coincident.values()].forEach((mark, i) => {
      const times = mark.times.map(t => format(t)).join(', '), caption = mark.times.length > 3 ? 'All sample times' : `${times} s`;
      const dot = svgNode(doc, 'circle', { cx: mapPosition(mark.position), cy: 90, r: 4, fill: '#087d7b', 'data-car-time-mark': times });
      dot.append(svgNode(doc, 'title', {}, `Position ${format(mark.position)} m at times ${times} s`));
      track.append(dot, svgNode(doc, 'text', { x: mapPosition(mark.position), y: 112 + (i % 2) * 16, 'text-anchor': 'middle', class: 'ei-axis-text' }, caption));
    });
    car = svgNode(doc, 'g', { 'data-car-position': '', role: 'img' });
    car.append(svgNode(doc, 'rect', { x: -17, y: -6, width: 34, height: 12, rx: 3, fill: '#8a1738' }),
      svgNode(doc, 'rect', { x: -8, y: -15, width: 17, height: 10, rx: 3, fill: '#8a1738' }),
      svgNode(doc, 'path', { d: 'M-4 -12H6L9 -7H-4Z', fill: '#d9eef0' }),
      svgNode(doc, 'circle', { cx: -10, cy: 7, r: 4, fill: '#273e44' }), svgNode(doc, 'circle', { cx: 10, cy: 7, r: 4, fill: '#273e44' }));
    track.append(car);
    const plot = svgNode(doc, 'svg', { viewBox: '0 0 600 340', role: 'img', 'aria-label': 'Position versus time graph with the current car position highlighted', class: 'ei-graph ei-car-plot' });
    plot.append(svgNode(doc, 'title', {}, 'Position–time graph of the declared model'));
    for (let i = 0; i <= 4; i++) {
      const t = input.start + (end() - input.start) * i / 4, p = low + (high - low) * i / 4;
      plot.append(svgNode(doc, 'line', { x1: 65, x2: 545, y1: mapHeight(p), y2: mapHeight(p), stroke: '#dce3e4' }),
        svgNode(doc, 'text', { x: 57, y: mapHeight(p) + 4, 'text-anchor': 'end', class: 'ei-axis-text' }, format(p, 2)),
        svgNode(doc, 'text', { x: mapTime(t), y: 300, 'text-anchor': 'middle', class: 'ei-axis-text' }, format(t, 2)));
    }
    const curve = Array.from({ length: 81 }, (_, i) => { const t = input.start + (end() - input.start) * i / 80; return { x: t, y: motionAt({ a: input.a, b: input.b, c: input.c, t }).position }; });
    if (sampled.turningPoint) curve.push(sampled.turningPoint);
    curve.sort((a, b) => a.x - b.x);
    plot.append(svgNode(doc, 'path', { d: 'M65 45V275H545', fill: 'none', stroke: '#344b50' }),
      svgNode(doc, 'polyline', { points: curve.map(row => `${mapTime(row.x)},${mapHeight(row.y)}`).join(' '), fill: 'none', stroke: '#8a1738', 'stroke-width': 3 }),
      svgNode(doc, 'text', { x: 65, y: 20, class: 'ei-axis-label' }, 'Position (m)'),
      svgNode(doc, 'text', { x: 300, y: 333, 'text-anchor': 'middle', class: 'ei-axis-label' }, 'Time (s)'));
    sampled.rows.forEach(row => plot.append(svgNode(doc, 'circle', { cx: mapTime(row.x), cy: mapHeight(row.y), r: 4, fill: '#087d7b', stroke: '#fff', 'stroke-width': 1 })));
    cursor = svgNode(doc, 'line', { y1: 45, y2: 275, stroke: '#536178', 'stroke-dasharray': '4 4' });
    point = svgNode(doc, 'circle', { r: 7, fill: '#e6a637', stroke: '#273e44', 'stroke-width': 2, 'data-car-graph-point': '' });
    plot.append(cursor, point); drawings.append(scrollableGraph(doc,track,'Car position on the track'),scrollableGraph(doc,plot,'Car position over time'));
    scrub.min = String(input.start); scrub.max = String(end()); scrub.step = String(Math.min(0.05, input.step / 20));
    renderTime(); accessibilityState();
  }
  function frame(stamp) {
    frameId = null;
    if (disposed || !playing) return;
    if (unavailable() || host.isConnected === false) { pause('Animation paused.'); return; }
    if (lastStamp !== null) time = Math.min(end(), time + Math.max(0, stamp - lastStamp) / 1000);
    lastStamp = stamp; renderTime();
    if (time >= end()) { pause('End of the modeled time interval.'); return; }
    frameId = win.requestAnimationFrame(frame);
  }
  on(play, 'click', () => {
    if (disposed) return;
    if (playing) { pause('Animation paused.'); return; }
    if (unavailable()) { accessibilityState(); return; }
    if (time >= end()) time = input.start;
    playing = true; lastStamp = null; play.textContent = 'Pause'; play.setAttribute('aria-pressed', 'true'); status.textContent = 'Playing. The slider can pause and set any time.';
    renderTime(); frameId = win.requestAnimationFrame(frame);
  });
  on(scrub, 'input', () => {
    if (disposed) return;
    pause(); const value = Number(scrub.value);
    if (Number.isFinite(value)) time = Math.min(end(), Math.max(input.start, value));
    renderTime(); status.textContent = reduced() ? 'Reduced motion: time selected manually.' : 'Time selected manually.';
  });
  on(reset, 'click', () => { if (!disposed) { pause(); time = input.start; renderTime(); status.textContent = 'Returned to the first modeled time.'; } });
  on(doc, 'visibilitychange', () => { if (doc.hidden) pause('Animation paused because the page is hidden.'); accessibilityState(); });
  on(win, 'pagehide', () => pause('Animation paused.'));
  const motionChange = () => { if (reduced()) pause(); accessibilityState(); };
  if (typeof media?.addEventListener === 'function') on(media, 'change', motionChange);
  else if (typeof media?.addListener === 'function') { media.addListener(motionChange); listeners.push(() => media.removeListener(motionChange)); }
  renderModel();
  return Object.freeze({
    update(next) {
      if (disposed) throw new Error('Car view is disposed.');
      const valid = sampleRates(next); pause(); sampled = valid; input = valid.input;
      time = Math.max(input.start, Math.min(end(), time)); renderModel();
    },
    dispose() {
      if (disposed) return;
      disposed = true; pause(); listeners.splice(0).forEach(remove => remove()); host.remove();
    }
  });
}
