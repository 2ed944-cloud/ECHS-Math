import {factorLedger, rationalAt, sampleRational} from './ap-rational-model.mjs';
import {svgNode, table, format as retainedFormat, scrollableGraph} from './visuals.mjs';

/**
 * mountRational({root,window,scene}) -> {update(completeFlatInput),dispose}.
 * model:'rational', family:'linear-factors'; eight exact initial fields below.
 * Optional controls [{key,label,min,max,step}] select a subset of those fields.
 * Root/scale inputs use the quarter grid; multiplicities use integer steps.
 * Only original finite-family algebra provides features. Graphs join bounded
 * samples and split at every original denominator exclusion and viewport exit.
 * No expression evaluation, persistence, mastery, network, timer or animation.
 */
const fields = Object.freeze({
  scale:[-4,4,.25], numeratorRoot:[-4,4,.25], numeratorMultiplicity:[1,3,1],
  denominatorRoot:[-4,4,.25], denominatorMultiplicity:[1,3,1], commonRoot:[-4,4,.25],
  commonNumeratorMultiplicity:[0,3,1], commonDenominatorMultiplicity:[0,3,1],
});
const keys = Object.keys(fields);
const invalid = () => new RangeError('Invalid rational view configuration.');
let nextMount = 0;
const own = (v,k) => Object.hasOwn(v,k);
const format = (value,places=3) => {
  const text=retainedFormat(value,places);
  return Number.isFinite(value)&&value!==0&&Number(text.replaceAll(',',''))===0?value.toExponential(3):text;
};
function record(value) {
  try {
    if (!value || typeof value !== 'object' || ![Object.prototype,null].includes(Object.getPrototypeOf(value))) throw invalid();
    const result = {}, descriptors = Object.getOwnPropertyDescriptors(value);
    for (const key of Reflect.ownKeys(descriptors)) {
      const d = descriptors[key];
      if (typeof key !== 'string' || !own(d,'value') || !d.enumerable) throw invalid();
      Object.defineProperty(result,key,{value:d.value,enumerable:true});
    }
    return result;
  } catch { throw invalid(); }
}
function captureInput(value) {
  const raw = record(value);
  if (Object.keys(raw).length !== keys.length || keys.some(key => !own(raw,key))) throw invalid();
  const input = {};
  for (const [key,[min,max,unit]] of Object.entries(fields)) {
    const n = raw[key];
    if (typeof n !== 'number' || !Number.isFinite(n) || n < min || n > max || !Number.isInteger(n/unit)) throw invalid();
    input[key] = n === 0 ? 0 : n;
  }
  return Object.freeze(input);
}
function make(input) {
  const numerator = [{root:input.numeratorRoot,multiplicity:input.numeratorMultiplicity}];
  const denominator = [{root:input.denominatorRoot,multiplicity:input.denominatorMultiplicity}];
  if (input.commonNumeratorMultiplicity) numerator.push({root:input.commonRoot,multiplicity:input.commonNumeratorMultiplicity});
  if (input.commonDenominatorMultiplicity) denominator.push({root:input.commonRoot,multiplicity:input.commonDenominatorMultiplicity});
  return factorLedger({scale:input.scale,numerator,denominator});
}
function captureScene(scene) {
  const raw = record(scene);
  if (raw.model !== 'rational' || raw.family !== 'linear-factors') throw invalid();
  const initial = captureInput(raw.initial), seen = new Set(), controls = [];
  const array = raw.controls === undefined ? [] : raw.controls;
  try {
    if (!Array.isArray(array) || Object.getPrototypeOf(array) !== Array.prototype) throw invalid();
    const ds = Object.getOwnPropertyDescriptors(array), length = ds.length.value;
    if (length > keys.length || Reflect.ownKeys(ds).length !== length + 1) throw invalid();
    for (let i=0;i<length;i++) {
      const d = ds[String(i)]; if (!d || !own(d,'value') || !d.enumerable) throw invalid();
      const c = record(d.value);
      if (Object.keys(c).sort().join('|') !== 'key|label|max|min|step' || !own(fields,c.key) || seen.has(c.key) ||
          typeof c.label !== 'string' || !c.label.trim() || c.label.length > 120) throw invalid();
      const [lo,hi,unit] = fields[c.key];
      if (![c.min,c.max,c.step].every(n => typeof n === 'number' && Number.isFinite(n) && Number.isInteger(n/unit)) ||
          c.min < lo || c.max > hi || c.min >= c.max || c.step <= 0 || c.step > c.max-c.min ||
          !Number.isInteger((c.max-c.min)/c.step) || initial[c.key] < c.min || initial[c.key] > c.max ||
          !Number.isInteger((initial[c.key]-c.min)/c.step)) throw invalid();
      seen.add(c.key); controls.push(Object.freeze({...c}));
    }
  } catch { throw invalid(); }
  return {initial,controls:Object.freeze(controls)};
}
const interval = (left,right) => `(${left===null?'−∞':format(left)}, ${right===null?'+∞':format(right)})`;
const limit = value => value.kind === 'finite' ? format(value.value) : value.kind === 'positive-infinity' ? '+∞' : '−∞';
const product = factors => factors.map(row => `(x − (${format(row.root)}))${row.multiplicity===1?'':`^${row.multiplicity}`}`).join(' × ') || '1';

function drawing(doc, state, id) {
  const title = 'Declared rational function: finite drawing window';
  const samples = sampleRational(state.input,{start:-5,step:10/128,count:128});
  const holes = state.exclusions.filter(row => row.kind==='hole');
  let ymin=-8,ymax=8;
  for (const hole of holes) { const margin=Math.max(1,Math.abs(hole.y)*.05); ymin=Math.min(ymin,hole.y-margin);ymax=Math.max(ymax,hole.y+margin); }
  const featureMargin=(ymax-ymin)*.04;ymin-=featureMargin;ymax+=featureMargin;
  const x = v => 70+(v+5)/10*500, y = v => 282-(v-ymin)/(ymax-ymin)*240;
  const svg = svgNode(doc,'svg',{viewBox:'0 0 600 340',role:'img','aria-label':title,class:'ei-graph',
    'data-rational-plot':'','data-xmin':-5,'data-xmax':5,'data-ymin':ymin,'data-ymax':ymax});
  svg.append(svgNode(doc,'title',{},title));
  for(let i=0;i<=4;i++) {
    const xx=-5+10*i/4,yy=ymin+(ymax-ymin)*i/4;
    svg.append(svgNode(doc,'line',{x1:70,y1:y(yy),x2:570,y2:y(yy),stroke:'#dce3e4'}),
      svgNode(doc,'text',{x:62,y:y(yy)+4,'text-anchor':'end',class:'ei-axis-text'},format(yy,2)),
      svgNode(doc,'text',{x:x(xx),y:305,'text-anchor':'middle',class:'ei-axis-text'},format(xx,2)));
  }
  svg.append(svgNode(doc,'path',{d:`M70 ${y(0)}H570M${x(0)} 42V282`,fill:'none',stroke:'#344b50'}),
    svgNode(doc,'text',{x:320,y:333,'text-anchor':'middle',class:'ei-axis-label'},'Real input x'),
    svgNode(doc,'text',{x:72,y:20,class:'ei-axis-label'},'R(x)'));
  const defs=svgNode(doc,'defs'),clip=svgNode(doc,'clipPath',{id:`ei-rational-clip-${id}`});
  clip.append(svgNode(doc,'rect',{x:70,y:42,width:500,height:240}));defs.append(clip);svg.append(defs);
  const curves=svgNode(doc,'g',{'clip-path':`url(#ei-rational-clip-${id})`});
  for(const pole of state.exclusions.filter(row=>row.kind==='pole')) {
    const line=svgNode(doc,'line',{x1:x(pole.x),x2:x(pole.x),y1:42,y2:282,stroke:'#b68a27','stroke-dasharray':'7 5','data-rational-pole':pole.x});
    line.append(svgNode(doc,'title',{},`Vertical asymptote x = ${format(pole.x)}`));curves.append(line);
  }
  if(state.tails.horizontalAsymptote!==null) curves.append(svgNode(doc,'line',{x1:70,x2:570,y1:y(state.tails.horizontalAsymptote),y2:y(state.tails.horizontalAsymptote),stroke:'#087d7b','stroke-dasharray':'5 4','data-rational-horizontal':state.tails.horizontalAsymptote}));
  for(const segment of samples.segments) {
    let run=[];
    const finish=()=>{
      if(run.length>1)curves.append(svgNode(doc,'polyline',{points:run.map(p=>`${x(p.x)},${y(p.y)}`).join(' '),fill:'none',stroke:'#8a1738','stroke-width':3,'data-rational-branch':''}));
      else if(run.length===1)curves.append(svgNode(doc,'circle',{cx:x(run[0].x),cy:y(run[0].y),r:2,fill:'#8a1738','data-rational-sample-point':''}));
      run=[];
    };
    for(const point of segment) { if(point.y>=ymin&&point.y<=ymax)run.push(point);else finish(); }
    finish();
  }
  svg.append(curves);
  for(const zero of state.zeros) {
    const dot=svgNode(doc,'circle',{cx:x(zero.x),cy:y(0),r:4,fill:'#087d7b','data-rational-zero':zero.x});
    dot.append(svgNode(doc,'title',{},`Valid zero x = ${format(zero.x)}, multiplicity ${zero.multiplicity}`));svg.append(dot);
  }
  for(const hole of holes) {
    const dot=svgNode(doc,'circle',{cx:x(hole.x),cy:y(hole.y),r:6,fill:'#fff',stroke:'#8a1738','stroke-width':2.5,
      'data-rational-hole':hole.x,'data-hole-y':hole.y});
    dot.append(svgNode(doc,'title',{},`Excluded hole (${format(hole.x)}, ${format(hole.y)}); R is undefined here`));svg.append(dot);
  }
  const figure=scrollableGraph(doc,svg,title);figure.setAttribute('data-rational-graph','');
  const legend=doc.createElement('p');legend.className='ei-note';legend.textContent='Burgundy: sampled function. Hollow circles: excluded holes. Green dots: valid zeros. Dashed lines: algebraic asymptotes.';figure.append(legend);
  return {figure,ymin,ymax};
}

export function mountRational({root,window:win,scene}) {
  const doc=root?.ownerDocument;
  if(!doc||typeof root.append!=='function'||!win)throw new TypeError('Rational view requires a DOM root and window.');
  const captured=captureScene(scene),id=++nextMount,listeners=[],controls=[];
  let current=captured.initial,disposed=false;
  const node=(tag,cls,text)=>{const n=doc.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  const section=node('section','ei-rational-view');section.setAttribute('aria-label','Rational function explorer');
  const form=node('div','ei-controls'),display=node('div','ei-rational-results');
  const status=node('p','ei-note');status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.setAttribute('data-rational-status','');
  const error=node('p','ei-note');error.setAttribute('role','alert');error.setAttribute('data-rational-error','');error.hidden=true;
  const listen=(target,event,fn)=>{target.addEventListener(event,fn);listeners.push(()=>target.removeEventListener(event,fn));};
  const note=(parent,text)=>parent.append(node('p','ei-note',text));
  const addTable=(parent,headers,rows,caption,key)=>{const t=table(doc,headers,rows.map(row=>row.map(value=>typeof value==='number'?format(value):value)),caption);t.setAttribute('data-rational-table',key);parent.append(t);};
  function render(state) {
    const out=node('div','ei-rational-output');
    const formula=node('p','ei-readout',`R(x) = ${format(state.input.scale)} × [${product(state.input.numerator)}] / [${product(state.input.denominator)}]`);
    formula.setAttribute('data-rational-formula','');out.append(formula);
    const domain=node('p','ei-readout',`Original domain: all real x except ${state.exclusions.map(row=>format(row.x)).join(', ')}.`);domain.setAttribute('data-rational-domain','');out.append(domain);
    if(state.zeroEverywhereOnDomain)note(out,'Zero scale: R(x)=0 at every original-domain input. Every retained input is a zero; the displayed factors do not specify a finite list of isolated zeros. Original denominator exclusions remain holes.');
    const plot=drawing(doc,state,id);out.append(plot.figure);
    note(out,`Finite drawing window: x in [−5, 5], R(x) in [${format(plot.ymin)}, ${format(plot.ymax)}]. Vertical bounds include every finite hole. Read the axis scale when a hole has a large ordinate. Values outside this window are omitted, never clamped.`);
    note(out,'Graph segments join finite samples of the declared rule. They break at every original denominator exclusion, including exclusions between sampled inputs. These samples do not identify a unique arbitrary function or prove global behavior.');
    addTable(out,['Input','Numerator multiplicity','Denominator multiplicity','Cancelled','Remaining numerator','Remaining denominator'],state.factors.map(row=>[row.x,row.numeratorMultiplicity,row.denominatorMultiplicity,row.cancelledMultiplicity,row.remainingNumeratorMultiplicity,row.remainingDenominatorMultiplicity]),'Original factors and exact cancellation','factors');
    addTable(out,['Excluded x','Kind','R(x)','Left-hand limit','Right-hand limit'],state.exclusions.map(row=>[row.x,row.kind,'undefined',limit(row.leftLimit),limit(row.rightLimit)]),'Original denominator exclusions survive cancellation','exclusions');
    addTable(out,['Valid zero','Multiplicity','Axis behavior'],state.zeros.map(row=>[row.x,row.multiplicity,row.crosses?'crosses':'touches; no sign change']),'Valid x-intercepts only; holes are excluded','zeros');
    addTable(out,['Open interval','Sign of R(x)'],state.signIntervals.map(row=>[interval(row.left,row.right),row.sign===0?'zero':row.sign>0?'positive':'negative']),'Signs follow the declared factor parity','signs');
    const tail=node('p','ei-readout',`Algebraic tails: as x → −∞, R(x) → ${limit(state.tails.left)}; as x → +∞, R(x) → ${limit(state.tails.right)}.`);tail.setAttribute('data-rational-tails','');out.append(tail);
    if(state.zeroEverywhereOnDomain)note(out,'The zero polynomial has no degree. The factor ledger counts formal products only.');
    else note(out,`Original numerator/denominator product degrees ${state.originalDegrees.numerator}/${state.originalDegrees.denominator}; after cancellation ${state.reducedDegrees.numerator}/${state.reducedDegrees.denominator}. Leading-term comparison is ${format(state.tails.leadingTerm.coefficient)}x^(${state.tails.leadingTerm.exponent}). This is an algebraic comparison, not a polynomial-division result.`);
    const xs=[...new Set([...Array.from({length:11},(_,i)=>i-5),...state.exclusions.map(row=>row.x)])].sort((a,b)=>a-b);
    addTable(out,['x','R(x)','Domain status'],xs.map(x=>{const row=rationalAt(state.input,x);return[x,row.y===null?'undefined':row.y,row.kind==='defined'?'in original domain':`excluded ${row.kind}`];}),'Integer samples plus every excluded input; this combined table is not equally spaced','samples');
    note(out,'Displayed numbers are rounded; classifications use unrounded model values. A finite hole ordinate is a limit, not the function value at the excluded input.');
    return out;
  }
  function update(value) {
    if(disposed)throw new Error('Rational view is disposed.');
    const input=captureInput(value);
    for(const c of captured.controls)if(input[c.key]<c.min||input[c.key]>c.max||!Number.isInteger((input[c.key]-c.min)/c.step))throw invalid();
    const state=make(input),output=render(state);
    display.replaceChildren(output);current=input;
    for(const c of controls){c.input.value=String(input[c.key]);c.output.value=String(input[c.key]);c.output.textContent=format(input[c.key]);}
    error.hidden=true;error.textContent='';status.textContent='Graph, original-domain ledger, signs and sample table updated.';
  }
  for(const c of captured.controls) {
    const wrap=node('label','ei-control'),label=node('span','',c.label),input=node('input'),value=node('output');
    input.type='range';input.id=`ei-rational-${id}-${c.key}`;input.min=String(c.min);input.max=String(c.max);input.step=String(c.step);input.setAttribute('data-rational-control',c.key);
    label.setAttribute('id',input.id+'-label');input.setAttribute('aria-labelledby',label.id);value.setAttribute('for',input.id);wrap.append(label,input,value);form.append(wrap);
    controls.push({key:c.key,input,output:value});
    listen(input,'input',()=>{try{update({...current,[c.key]:Number(input.value)});}catch{input.value=String(current[c.key]);error.textContent='This selection is outside the declared model controls.';error.hidden=false;}});
  }
  const reset=node('button','ei-button','Reset explorer');reset.type='button';reset.setAttribute('data-rational-reset','');listen(reset,'click',()=>update(captured.initial));
  form.append(reset);section.append(form,error,status,display);
  update(captured.initial);root.append(section);
  return Object.freeze({update,dispose(){if(disposed)return;disposed=true;listeners.splice(0).forEach(remove=>remove());section.remove();}});
}
