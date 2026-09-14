import { cubicRates, zeroStructure, polynomialTails } from './ap-polynomial-model.mjs';
import { graph, table, format, svgNode, scrollableGraph } from './visuals.mjs';

/**
 * Candidate-only polynomial explorer. scene has model:'polynomial', family,
 * initial (the complete family input), and controls [{key,label,min,max,step}].
 * update(completeInput) validates before changing the current model or DOM.
 * The scene/control definitions are captured at mount; Reset restores initial.
 * All analytic claims come from the pure family model. Horner samples below only
 * draw its declared coefficients; connecting finite samples is an approximation.
 * No arbitrary expressions, root solver, assessment, persistence, timers or fetch.
 */
const families = Object.freeze({ 'cubic-rates': cubicRates, 'zero-structure': zeroStructure, tails: polynomialTails });
let mountId = 0;
const invalid = () => new RangeError('Invalid polynomial view configuration.');
const evaluate = (coefficients, x) => coefficients.reduceRight((value, coefficient) => value * x + coefficient, 0);
const interval = (left, right) => `(${left === null ? '−∞' : format(left)}, ${right === null ? '∞' : format(right)})`;
const sourceName = source => ({ 'left-endpoint':'included left endpoint', 'right-endpoint':'included right endpoint', 'interior-turn':'interior turning point' })[source];
const infinity = sign => sign === 'positive-infinity' ? '+∞' : '−∞';

function dataRecord(value) {
  if (!value || typeof value !== 'object' || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) throw invalid();
  const descriptors = Object.getOwnPropertyDescriptors(value), result = {};
  for (const key of Reflect.ownKeys(descriptors)) {
    const d = descriptors[key];
    if (typeof key !== 'string' || !Object.hasOwn(d, 'value') || !d.enumerable) throw invalid();
    Object.defineProperty(result, key, { value:d.value, enumerable:true });
  }
  return result;
}

function captureScene(scene) {
  const value = dataRecord(scene);
  if (value.model !== 'polynomial' || typeof value.family !== 'string' || !Object.hasOwn(families, value.family)) throw invalid();
  const make = families[value.family], initial = make(dataRecord(value.initial));
  const keys = Object.keys(initial.input).sort();
  if (Object.keys(value.initial).sort().join('|') !== keys.join('|')) throw invalid();
  if (!Array.isArray(value.controls) || value.controls.length > 6) throw invalid();
  const seen = new Set();
  const controls = value.controls.map(raw => {
    const c = dataRecord(raw);
    if (Object.keys(c).sort().join('|') !== 'key|label|max|min|step' || !keys.includes(c.key) || seen.has(c.key) ||
        typeof c.label !== 'string' || !c.label.trim() || c.label.length > 120 ||
        ![c.min,c.max,c.step].every(Number.isFinite) || c.min >= c.max || c.step <= 0 || c.step > c.max-c.min ||
        c.min < -100000 || c.max > 100000 || initial.input[c.key] < c.min || initial.input[c.key] > c.max) throw invalid();
    if (['m','n'].includes(c.key) && ![c.min,c.max,c.step].every(Number.isInteger)) throw invalid();
    seen.add(c.key); return Object.freeze({ ...c });
  });
  return { family:value.family, make, initial, keys, controls };
}

function sampled(state, left, right, extra = []) {
  const xs = Array.from({length:97}, (_,i) => i === 96 ? right : left+(right-left)*i/96);
  for (const x of extra) if (x >= left && x <= right) xs.push(x);
  return [...new Set(xs)].sort((a,b) => a-b).map(x => ({ x, y:evaluate(state.coefficients,x) }));
}

function polynomialText(coefficients) {
  const pieces = [];
  for (let power = coefficients.length-1; power >= 0; power--) {
    const c = coefficients[power]; if (c === 0) continue;
    const magnitude = Math.abs(c), term = power === 0 ? format(magnitude) : `${magnitude === 1 ? '' : format(magnitude)}x${power === 1 ? '' : `^${power}`}`;
    pieces.push(`${pieces.length ? c < 0 ? ' − ' : ' + ' : c < 0 ? '−' : ''}${term}`);
  }
  return pieces.join('') || '0';
}

function zeroText(zero) {
  if (zero.imaginary === 0) return format(zero.real);
  return `${format(zero.real)} ${zero.imaginary < 0 ? '−' : '+'} ${format(Math.abs(zero.imaginary))}i`;
}

// Equal unit scales and actual axes through the origin; this is not an x–p(x) graph.
function complexPlane(doc, zeros) {
  const title = 'Complex plane: declared zeros (real and imaginary parts)';
  const svg = svgNode(doc,'svg',{viewBox:'0 0 600 340',role:'img','aria-label':title,class:'ei-graph','data-polynomial-complex-plane':''});
  svg.append(svgNode(doc,'title',{},title));
  const x = value => 300+24*value, y = value => 160-24*value;
  for (let tick = -5; tick <= 5; tick++) {
    svg.append(svgNode(doc,'line',{x1:x(tick),y1:y(-5),x2:x(tick),y2:y(5),stroke:'#dce3e4'}),svgNode(doc,'line',{x1:x(-5),y1:y(tick),x2:x(5),y2:y(tick),stroke:'#dce3e4'}));
    if (tick % 2 === 0) svg.append(svgNode(doc,'text',{x:x(tick),y:300,'text-anchor':'middle',class:'ei-axis-text'},String(tick)),svgNode(doc,'text',{x:168,y:y(tick)+4,'text-anchor':'end',class:'ei-axis-text'},String(tick)));
  }
  svg.append(svgNode(doc,'path',{d:`M${x(-5)} ${y(0)}H${x(5)}M${x(0)} ${y(-5)}V${y(5)}`,fill:'none',stroke:'#344b50','stroke-width':2}),
    svgNode(doc,'text',{x:300,y:333,'text-anchor':'middle',class:'ei-axis-label'},'Real part'),svgNode(doc,'text',{x:180,y:20,class:'ei-axis-label'},'Imaginary part'));
  for (const z of zeros) {
    const point = svgNode(doc,'circle',{cx:x(z.real),cy:y(z.imaginary),r:6,fill:z.imaginary === 0 ? '#8a1738' : '#087d7b',stroke:'#fff','stroke-width':1.5,'data-real':z.real,'data-imaginary':z.imaginary,'data-multiplicity':z.multiplicity});
    point.append(svgNode(doc,'title',{},`${zeroText(z)}, multiplicity ${z.multiplicity}`));svg.append(point);
  }
  return scrollableGraph(doc,svg,title);
}

export function mountPolynomial({ root, window: win, scene }) {
  const doc = root?.ownerDocument;
  if (!doc || typeof root.append !== 'function' || !win) throw new TypeError('Polynomial view requires a DOM root and window.');
  const captured = captureScene(scene);
  let state = captured.initial, disposed = false;
  const id = ++mountId, listeners = [], inputs = [];
  const node = (tag, cls, text) => {
    const result = doc.createElement(tag); if (cls) result.className = cls; if (text !== undefined) result.textContent = text; return result;
  };
  const section = node('section','ei-polynomial-view');section.setAttribute('aria-label','Polynomial explorer');
  section.setAttribute('data-polynomial-family',captured.family);
  const controls = node('div','ei-controls'), display = node('div','ei-polynomial-results');
  const status = node('p','ei-note');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  status.setAttribute('data-polynomial-status','');
  const error = node('p','ei-note');error.setAttribute('role','alert');error.setAttribute('data-polynomial-error','');error.hidden = true;
  const listen = (target,type,callback) => { target.addEventListener(type,callback);listeners.push(() => target.removeEventListener(type,callback)); };
  const addTable = (parent, headers, rows, caption, key) => {
    const result = table(doc,headers,rows,caption);result.setAttribute('data-polynomial-table',key);parent.append(result);
  };
  const note = (parent,text) => parent.append(node('p','ei-note',text));
  const heading = (parent,text) => parent.append(node('h4','',text));

  function render(next) {
    const out = node('div','ei-polynomial-output'), { input } = next;
    const formula = node('p','ei-readout',`p(x) = ${polynomialText(next.coefficients)}`);formula.setAttribute('data-polynomial-formula','');out.append(formula);
    note(out,`Declared degree ${next.degree}; leading coefficient ${format(next.leadingCoefficient)}. Graphs are connected finite samples of this formula; feature claims use its algebraic structure.`);
    if (captured.family === 'cubic-rates') {
      const points = sampled(next,input.left,input.right,[...next.turningPoints.map(p=>p.x),0,input.from,input.to]);
      const plot = graph(doc,{title:`Cubic on the restricted domain [${format(input.left)}, ${format(input.right)}]`,xLabel:'x',yLabel:'p(x)',series:[
        {label:'Declared cubic',points,dots:false},
        {label:'Secant endpoints and connecting segment',points:next.secant.endpoints},
        {label:'Restricted local extrema, including endpoints',points:next.restricted.localExtrema,connect:false},
      ]});plot.setAttribute('data-polynomial-real-graph','');out.append(plot);
      const rate = node('p','ei-readout',`From x = ${format(input.from)} to x = ${format(input.to)}: Δx = ${format(next.secant.width)}, Δp = ${format(next.secant.change)}, average rate = ${format(next.secant.rate)}.`);
      rate.setAttribute('data-polynomial-secant','');out.append(rate);
      note(out,'The average rate is a[(from)² + (from)(to) + (to)² − 3k]. Reversing both endpoints reverses both differences and keeps their quotient.');
      addTable(out,['x','p(x)'],points.filter((p,i)=>i % 12 === 0 || p.x === input.from || p.x === input.to || p.x === input.right).map(p=>[p.x,p.y]),'Cubic sample table; secant endpoints included','samples');
      heading(out,'Restricted-domain extrema');
      addTable(out,['x','p(x)','Local classification','Compared within this domain'],next.restricted.localExtrema.map(p=>[p.x,p.y,p.kind,sourceName(p.source)]),'Included endpoints use one-sided comparisons','extrema');
      note(out,`Global minimum ${format(next.restricted.globalMinimum.value)} at x = ${next.restricted.globalMinimum.points.map(x=>format(x)).join(', ')}. Global maximum ${format(next.restricted.globalMaximum.value)} at x = ${next.restricted.globalMaximum.points.map(x=>format(x)).join(', ')}.`);
      heading(out,'Behavior on the full real domain');
      addTable(out,['Open interval','Behavior'],next.monotonicIntervals.map(p=>[interval(p.left,p.right),p.behavior]),'Increasing and decreasing intervals','monotonic');
      addTable(out,['Open interval','Concavity'],next.concavityIntervals.map(p=>[interval(p.left,p.right),p.concavity]),'Concavity from the declared cubic family','concavity');
      note(out,`Inflection at (0, 0)${next.inflection.stationary ? '; stationary, but not a turning point' : ''}. ${next.turningPoints.length} turning points on the full real domain.`);
    } else if (captured.family === 'zero-structure') {
      note(out,`Factor form: ${format(input.a)}(x − (${format(input.r)}))^${input.m}[(x − (${format(input.u)}))² + ${format(input.v)}²].`);
      const points = sampled(next,-5,5,next.realZeros.map(p=>p.x));
      const plot = graph(doc,{title:'Real-input polynomial graph on [−5, 5]',xLabel:'Real input x',yLabel:'p(x)',series:[
        {label:'Declared polynomial',points,dots:false},
        {label:'Real zeros only',points:next.realZeros.map(z=>({x:z.x,y:0})),connect:false},
      ]});plot.setAttribute('data-polynomial-real-graph','');out.append(plot);
      addTable(out,['x','p(x)'],points.filter((p,i)=>i % 12 === 0 || next.realZeros.some(z=>z.x === p.x) || p.x === 5).map(p=>[p.x,p.y]),'Real-input sample table; real zeros included','samples');
      heading(out,'Zero ledger');
      addTable(out,['Zero','Multiplicity','Real graph'],next.zeroLedger.map(z=>[zeroText(z),z.multiplicity,z.imaginary !== 0 ? 'not a real x-intercept' : next.realZeros.find(r=>r.x === z.real).behavior]),'Zeros counted with multiplicity','zeros');
      note(out,`Real multiplicity ${next.realZeroMultiplicity} + nonreal multiplicity ${next.nonrealZeroMultiplicity} = degree ${next.degree}. Symmetry: ${next.symmetry}. A multiplicity labels repeated factors, not extra plotted dots.`);
      addTable(out,['Open interval','Sign of p(x)'],next.signIntervals.map(p=>[interval(p.left,p.right),p.sign === 1 ? 'positive' : 'negative']),'Sign intervals exclude the real zeros','signs');
      heading(out,'Complex plane');out.append(complexPlane(doc,next.zeroLedger));
      note(out,'The complex plane plots each zero by its real and imaginary parts with equal unit scales. A nonreal zero is not a point on the real-input graph. At v = 0, the conjugate pair meets on the real axis and its multiplicity is combined. No turning-point count is inferred from this sample plot.');
    } else {
      const points = sampled(next,-input.window,input.window,next.comparisonRows.map(p=>p.x));
      const leading = points.map(p=>({x:p.x,y:input.a*p.x**input.n}));
      const plot = graph(doc,{title:`Finite comparison window [−${format(input.window)}, ${format(input.window)}]`,xLabel:'x',yLabel:'Polynomial value',series:[
        {label:'Full polynomial p(x)',points,dots:false},{label:`Leading term ${format(input.a)}x^${input.n}`,points:leading,dots:false},
      ]});plot.setAttribute('data-polynomial-real-graph','');out.append(plot);
      addTable(out,['x','p(x)','Leading term','Ratio p / leading','Signed relative gap','Absolute gap'],next.comparisonRows.map(p=>[p.x,p.full,p.leading,p.ratio,p.relativeDifference,p.absoluteDifference]),'Same nonzero inputs compare both formulas','tails');
      note(out,'Ratio = p(x)/(ax^n). Signed relative gap = [p(x) − ax^n]/(ax^n). Absolute gap = |p(x) − ax^n|. These are different quantities; the denominator is nonzero at every listed input.');
      note(out,next.comparison);
      note(out,`For x ≠ 0, p(x)/(ax^n) = 1 + (${format(input.b)}/${format(input.a)})/x + (${format(input.c)}/${format(input.a)})/x^${input.n}. The two extra terms approach 0; the finite graph window alone does not establish this limit.`);
    }
    const tail = node('p','ei-readout',`Algebraic end behavior: as x → −∞, p(x) → ${infinity(next.tails.left)}; as x → +∞, p(x) → ${infinity(next.tails.right)}.`);
    tail.setAttribute('data-polynomial-tails','');out.append(tail);
    note(out,'Displayed numbers are rounded for reading; classifications and comparisons use the model’s unrounded values.');
    return out;
  }

  function validateInput(value) {
    const raw = dataRecord(value);
    if (Object.keys(raw).sort().join('|') !== captured.keys.join('|')) throw invalid();
    const next = captured.make(raw);
    for (const c of captured.controls) if (next.input[c.key] < c.min || next.input[c.key] > c.max) throw invalid();
    return next;
  }
  function update(value) {
    if (disposed) throw new Error('Polynomial view is disposed.');
    const next = validateInput(value), rendered = render(next);
    state = next;display.replaceChildren(rendered);
    for (const row of inputs) { row.input.value = String(next.input[row.key]);row.output.textContent = format(next.input[row.key]); }
    error.hidden = true;error.textContent = '';status.textContent = 'Graph, tables and feature labels updated from the same declared polynomial.';
  }
  for (const c of captured.controls) {
    const wrap = node('div','ei-control'), input = node('input'), label = node('label','',c.label), output = node('output');
    input.type = 'range';input.id = `ei-polynomial-${id}-${c.key}`;input.min = String(c.min);input.max = String(c.max);input.step = String(c.step);
    input.setAttribute('data-polynomial-control',c.key);label.setAttribute('for',input.id);output.setAttribute('for',input.id);wrap.append(label,input,output);controls.append(wrap);
    inputs.push({key:c.key,input,output});
    listen(input,'input',() => {
      if (disposed) return;
      try {
        if (input.value.trim() === '') throw invalid();
        update({...state.input,[c.key]:Number(input.value)});
      } catch {
        input.value = String(state.input[c.key]);error.textContent = 'That setting is outside this model’s valid range. The previous graph and values are retained.';error.hidden = false;
      }
    });
  }
  const reset = node('button','ei-secondary','Reset model');reset.type = 'button';reset.setAttribute('data-polynomial-reset','');
  listen(reset,'click',() => { if (!disposed) update(captured.initial.input); });controls.append(reset);
  // Mount only after validation/rendering succeeds; dispose owns no ancestor or sibling.
  update(state.input);section.append(controls,error,status,display);root.append(section);
  return Object.freeze({update,dispose() {
    if (disposed) return;disposed = true;for (const remove of listeners) remove();section.remove();
  }});
}
