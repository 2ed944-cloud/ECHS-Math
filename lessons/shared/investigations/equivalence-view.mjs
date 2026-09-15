import {quotientRemainder, quotientAt, sampleQuotient, binomialRow} from './ap-equivalence-model.mjs';
import {svgNode, table, format, scrollableGraph} from './visuals.mjs';

/**
 * mountEquivalence({root,window,scene}) -> {update(completeInput),dispose}.
 * model:'equivalence'; family:'quotient-remainder' ({a,b,c,r}) or 'binomial'
 * ({a,b,n}). The view uses quarter-grid coefficients [-4,4], n integer 1..8.
 * Optional controls select a bounded subset. Algebra/table strings retain exact
 * quarter-grid coefficients; numeric rational evaluations remain approximations.
 * No persistence, expression evaluation, network, timers or assessment authority.
 */
const families = Object.freeze({
  'quotient-remainder':Object.freeze({a:[-4,4,.25],b:[-4,4,.25],c:[-4,4,.25],r:[-4,4,.25]}),
  binomial:Object.freeze({a:[-4,4,.25],b:[-4,4,.25],n:[1,8,1]}),
});
const invalid = () => new RangeError('Invalid equivalence view configuration.');
const own = (value,key) => Object.hasOwn(value,key);
let nextMount = 0;
function record(value) {
  try {
    if (!value || typeof value !== 'object' || ![Object.prototype,null].includes(Object.getPrototypeOf(value))) throw invalid();
    const result = {}, descriptors = Object.getOwnPropertyDescriptors(value);
    for (const key of Reflect.ownKeys(descriptors)) {
      const descriptor = descriptors[key];
      if (typeof key !== 'string' || !own(descriptor,'value') || !descriptor.enumerable) throw invalid();
      Object.defineProperty(result,key,{value:descriptor.value,enumerable:true});
    }
    return result;
  } catch { throw invalid(); }
}
function captureInput(value, fields) {
  const raw=record(value), keys=Object.keys(fields), input={};
  if(Object.keys(raw).length!==keys.length||keys.some(key=>!own(raw,key)))throw invalid();
  for(const [key,[min,max,unit]] of Object.entries(fields)) {
    const value=raw[key];
    if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max||!Number.isInteger(value/unit))throw invalid();
    input[key]=value===0?0:value;
  }
  return Object.freeze(input);
}
function captureScene(value) {
  const raw=record(value);
  if(raw.model!=='equivalence'||typeof raw.family!=='string'||!own(families,raw.family))throw invalid();
  const fields=families[raw.family],initial=captureInput(raw.initial,fields),controls=[],seen=new Set();
  const array=raw.controls===undefined?[]:raw.controls;
  try {
    if(!Array.isArray(array)||Object.getPrototypeOf(array)!==Array.prototype)throw invalid();
    const descriptors=Object.getOwnPropertyDescriptors(array),length=descriptors.length.value;
    if(length>Object.keys(fields).length||Reflect.ownKeys(descriptors).length!==length+1)throw invalid();
    for(let i=0;i<length;i++) {
      const descriptor=descriptors[String(i)];
      if(!descriptor||!own(descriptor,'value')||!descriptor.enumerable)throw invalid();
      const control=record(descriptor.value);
      if(Object.keys(control).sort().join('|')!=='key|label|max|min|step'||typeof control.key!=='string'||
        !own(fields,control.key)||seen.has(control.key)||typeof control.label!=='string'||!control.label.trim()||control.label.length>120)throw invalid();
      const [min,max,unit]=fields[control.key];
      if(![control.min,control.max,control.step].every(value=>typeof value==='number'&&Number.isFinite(value)&&Number.isInteger(value/unit))||
        control.min<min||control.max>max||control.min>=control.max||control.step<=0||control.step>control.max-control.min||
        !Number.isInteger((control.max-control.min)/control.step)||initial[control.key]<control.min||initial[control.key]>control.max||
        !Number.isInteger((initial[control.key]-control.min)/control.step))throw invalid();
      seen.add(control.key);controls.push(Object.freeze({...control}));
    }
  } catch { throw invalid(); }
  return {family:raw.family,fields,initial,controls:Object.freeze(controls)};
}
const exact=value=>String(value===0?0:value);
const exponent=value=>String(value).replace(/[0-9]/g,digit=>'⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(digit)]);
const degree=model=>model.zeroPolynomial?'undefined (zero polynomial)':String(model.degree);
function polynomial(coefficients) {
  const terms=[];
  coefficients.forEach((coefficient,i)=>{
    if(coefficient===0)return;
    const power=coefficients.length-1-i,magnitude=Math.abs(coefficient);
    const body=(power&&magnitude===1?'':exact(magnitude))+(power?'x'+(power===1?'':exponent(power)):'');
    terms.push((terms.length?(coefficient<0?' − ':' + '):(coefficient<0?'−':''))+body);
  });
  return terms.join('')||'0';
}
const divisor=c=>`(x − (${exact(c)}))`;
const limit=value=>value.kind==='finite'?exact(value.value):value.kind==='positive-infinity'?'+∞':'−∞';

function drawing(doc,state,id) {
  const title='Quotient and remainder: function and quotient trend';
  const samples=sampleQuotient(state.input,{start:-5,step:10/128,count:128});
  const trend=x=>state.input.a*x+state.input.b;
  let ymin=Math.min(-8,trend(-5),trend(5)),ymax=Math.max(8,trend(-5),trend(5));
  if(state.exclusion.kind==='hole'){ymin=Math.min(ymin,state.exclusion.y);ymax=Math.max(ymax,state.exclusion.y);}
  const margin=(ymax-ymin)*.08;ymin-=margin;ymax+=margin;
  const x=value=>70+(value+5)*50,y=value=>282-(value-ymin)/(ymax-ymin)*240;
  const svg=svgNode(doc,'svg',{viewBox:'0 0 600 340',role:'img','aria-label':title,class:'ei-graph',
    'data-equivalence-plot':'','data-xmin':-5,'data-xmax':5,'data-ymin':ymin,'data-ymax':ymax});
  svg.append(svgNode(doc,'title',{},title));
  for(let i=0;i<=4;i++) {
    const xx=-5+2.5*i,yy=ymin+(ymax-ymin)*i/4;
    svg.append(svgNode(doc,'line',{x1:70,y1:y(yy),x2:570,y2:y(yy),stroke:'#dce3e4'}),
      svgNode(doc,'text',{x:62,y:y(yy)+4,'text-anchor':'end',class:'ei-axis-text'},format(yy,2)),
      svgNode(doc,'text',{x:x(xx),y:305,'text-anchor':'middle',class:'ei-axis-text'},format(xx,2)));
  }
  svg.append(svgNode(doc,'path',{d:`M70 ${y(0)}H570M${x(0)} 42V282`,fill:'none',stroke:'#344b50'}),
    svgNode(doc,'text',{x:320,y:333,'text-anchor':'middle',class:'ei-axis-label'},'Real input x'),
    svgNode(doc,'text',{x:72,y:20,class:'ei-axis-label'},'R(x), Q(x)'));
  const defs=svgNode(doc,'defs'),clip=svgNode(doc,'clipPath',{id:`ei-equivalence-clip-${id}`});
  clip.append(svgNode(doc,'rect',{x:70,y:42,width:500,height:240}));defs.append(clip);svg.append(defs);
  const curves=svgNode(doc,'g',{'clip-path':`url(#ei-equivalence-clip-${id})`});
  if(state.exclusion.kind==='pole')curves.append(svgNode(doc,'line',{x1:x(state.input.c),x2:x(state.input.c),y1:42,y2:282,
    stroke:'#b68a27','stroke-dasharray':'7 5','data-equivalence-pole':state.input.c}));
  for(const segment of samples.segments) {
    let run=[];
    const finish=()=>{
      if(run.length>1)curves.append(svgNode(doc,'polyline',{points:run.map(point=>`${x(point.x)},${y(point.y)}`).join(' '),
        fill:'none',stroke:'#8a1738','stroke-width':3,'data-equivalence-branch':''}));
      else if(run.length===1)curves.append(svgNode(doc,'circle',{cx:x(run[0].x),cy:y(run[0].y),r:2,fill:'#8a1738','data-equivalence-sample-point':''}));
      run=[];
    };
    for(const point of segment){if(point.y>=ymin&&point.y<=ymax)run.push(point);else finish();}finish();
  }
  curves.append(svgNode(doc,'line',{x1:70,x2:570,y1:y(trend(-5)),y2:y(trend(5)),stroke:'#087d7b',
    'stroke-width':2,'stroke-dasharray':'7 5','data-equivalence-trend':''}));
  svg.append(curves);
  if(state.exclusion.kind==='hole') {
    const circle=svgNode(doc,'circle',{cx:x(state.input.c),cy:y(state.exclusion.y),r:6,fill:'#fff',stroke:'#8a1738','stroke-width':2.5,
      'data-equivalence-hole':state.input.c,'data-hole-y':state.exclusion.y});
    circle.append(svgNode(doc,'title',{},`Excluded hole (${exact(state.input.c)}, ${exact(state.exclusion.y)}); R is undefined here`));svg.append(circle);
  }
  const figure=scrollableGraph(doc,svg,title),legend=doc.createElement('p');legend.className='ei-note';
  legend.textContent='Solid burgundy: sampled R. Dashed green: quotient Q, which includes every real input. Hollow circle: excluded hole in R. Dashed gold: vertical asymptote of R.';
  figure.append(legend);
  return {figure,ymin,ymax};
}

export function mountEquivalence({root,window:win,scene}) {
  const doc=root?.ownerDocument;
  if(!doc||typeof root.append!=='function'||!win)throw new TypeError('Equivalence view requires a DOM root and window.');
  const captured=captureScene(scene),id=++nextMount,listeners=[],controls=[];
  let current=captured.initial,disposed=false;
  const node=(tag,cls,text)=>{const value=doc.createElement(tag);if(cls)value.className=cls;if(text!==undefined)value.textContent=text;return value;};
  const section=node('section','ei-equivalence-view');section.style.minWidth='0';section.setAttribute('aria-label',captured.family==='binomial'?'Binomial expansion explorer':'Quotient and remainder explorer');
  const form=node('div','ei-controls'),display=node('div','ei-equivalence-results');display.style.minWidth='0';
  const status=node('p','ei-note');status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.setAttribute('data-equivalence-status','');
  const error=node('p','ei-note');error.setAttribute('role','alert');error.setAttribute('data-equivalence-error','');error.hidden=true;
  const listen=(target,event,fn)=>{target.addEventListener(event,fn);listeners.push(()=>target.removeEventListener(event,fn));};
  const note=(parent,text)=>parent.append(node('p','ei-note',text));
  const readout=(parent,key,text)=>{const value=node('p','ei-readout',text);value.style.overflowWrap='anywhere';value.setAttribute(`data-equivalence-${key}`,'');parent.append(value);};
  const addTable=(parent,key,headers,rows,caption)=>{
    const wrapper=table(doc,headers,rows.map(row=>row.map(value=>typeof value==='number'?exact(value):value)),caption);
    wrapper.setAttribute('data-equivalence-table',key);wrapper.setAttribute('role','region');wrapper.tabIndex=0;
    wrapper.setAttribute('aria-label',`${caption} — scrollable table`);parent.append(wrapper);
  };
  function renderQuotient(state,out) {
    const {a,b,c,r}=state.input,quotient=polynomial(state.quotient.coefficients),denominator=divisor(c);
    readout(out,'expanded',`Expanded numerator P(x) = ${polynomial(state.numerator.coefficients)}.`);
    readout(out,'identity',`Division identity: P(x) = ${denominator} × (${quotient}) + (${exact(r)}).`);
    readout(out,'formula',`R(x) = (${polynomial(state.numerator.coefficients)}) / ${denominator} = (${quotient}) + (${exact(r)}) / ${denominator}, for x ≠ ${exact(c)}.`);
    readout(out,'domain',`Original domain: all real x except ${exact(c)}. R(${exact(c)}) is undefined.`);
    readout(out,'degrees',`Numerator degree: ${degree(state.numerator)}. Quotient degree: ${degree(state.quotient)}.`);
    const trendKind=a===0?'horizontal':'slant';
    readout(out,'difference',`Q(x) = ${quotient}. For x ≠ ${exact(c)}, R(x) − Q(x) = (${exact(r)}) / ${denominator} → 0 as x → −∞ or +∞.`);
    note(out,r===0?`R coincides with the ${trendKind} quotient trend on its original domain, with a hole at (${exact(c)}, ${exact(state.exclusion.y)}). Q still includes that input.`:
      `The ${trendKind} quotient trend is an asymptote because the additive difference tends to zero. This conclusion does not divide by Q(x).`);
    if(state.zeroEverywhereOnDomain)note(out,'The numerator is the zero polynomial, whose degree is undefined. R is zero at every original-domain input; the missing input is still excluded.');
    const plot=drawing(doc,state,id);out.append(plot.figure);
    note(out,`Finite drawing window: x in [−5, 5], vertical values in [${exact(plot.ymin)}, ${exact(plot.ymax)}]. The bounds contain the quotient trend and any finite hole. Out-of-window function samples are omitted, never clamped; paths break at every original exclusion, even between sampled inputs.`);
    addTable(out,'exclusion',['Excluded x','Kind','R(x)','Left-hand limit','Right-hand limit'],[[c,state.exclusion.kind,'undefined',limit(state.exclusion.leftLimit),limit(state.exclusion.rightLimit)]],'The original denominator exclusion survives cancellation');
    const xs=[...new Set([...Array.from({length:11},(_,i)=>i-5),c])].sort((left,right)=>left-right);
    addTable(out,'samples',['x','R(x)','Q(x)','R(x) − Q(x)','Domain status'],xs.map(x=>{
      const row=quotientAt(state.input,x);return [x,row.y===null?'undefined':row.y,row.quotientY,row.remainderY===null?'undefined':row.remainderY,row.kind==='defined'?'in original domain':`excluded ${row.kind}`];
    }),'Integer inputs plus the excluded input; spacing is not necessarily equal');
    note(out,'The coefficient strings retain the exact quarter-grid algebra. Rational table values are decimal approximations; finite samples do not establish global identities or limits.');
  }
  function renderBinomial(state,out) {
    const base=polynomial([state.input.a,state.input.b]);
    readout(out,'binomial',`(${base})${exponent(state.input.n)} = ${polynomial(state.coefficients)}.`);
    readout(out,'degree',`Actual polynomial degree: ${degree(state)}.`);
    readout(out,'pascal',`Pascal row n = ${state.input.n}: ${state.choose.join(', ')}.`);
    addTable(out,'terms',['k','Choose n,k','a power','b power','x power','Coefficient factors','Coefficient'],state.terms.map(term=>[
      term.k,term.choose,term.aPower,term.bPower,term.xPower,
      `${term.choose} × (${exact(state.input.a)})${exponent(term.aPower)} × (${exact(state.input.b)})${exponent(term.bPower)}`,term.coefficient,
    ]),'Every binomial term is retained, including zero coefficients');
    note(out,'For term k, the coefficient is choose(n,k) × a^(n−k) × b^k, multiplying x^(n−k). Exponent zero supplies the multiplicative identity in this expansion. The requested n stays visible even when the actual polynomial degree falls.');
    addTable(out,'binomial-values',['x','(ax + b)^n','Expanded polynomial'],[0,1,2].map(x=>[
      x,(state.input.a*x+state.input.b)**state.input.n,state.coefficients.reduce((value,coefficient)=>value*x+coefficient,0),
    ]),'Three output checks support the algebra; they do not prove an identity');
    note(out,'Pascal entries alone are not the final coefficients: the a and b powers, including their signs, also matter. The expansion uses the binomial theorem, not interpolation from the three displayed values.');
  }
  function update(value) {
    if(disposed)throw new Error('Equivalence view is disposed.');
    const input=captureInput(value,captured.fields);
    for(const control of captured.controls)if(input[control.key]<control.min||input[control.key]>control.max||!Number.isInteger((input[control.key]-control.min)/control.step))throw invalid();
    const output=node('div','ei-equivalence-output');output.style.minWidth='0';
    if(captured.family==='binomial')renderBinomial(binomialRow(input),output);else renderQuotient(quotientRemainder(input),output);
    display.replaceChildren(output);current=input;
    for(const control of controls){control.input.value=exact(input[control.key]);control.output.value=exact(input[control.key]);control.output.textContent=exact(input[control.key]);}
    error.hidden=true;error.textContent='';status.textContent=captured.family==='binomial'?'Expansion, power terms, degree and output checks updated.':'Graph, division identity, original domain and value table updated.';
  }
  for(const control of captured.controls) {
    const wrap=node('label','ei-control'),label=node('span','',control.label),input=node('input'),value=node('output');
    input.type='range';input.id=`ei-equivalence-${id}-${control.key}`;input.min=exact(control.min);input.max=exact(control.max);input.step=exact(control.step);
    input.setAttribute('data-equivalence-control',control.key);label.id=input.id+'-label';input.setAttribute('aria-labelledby',label.id);value.setAttribute('for',input.id);
    wrap.append(label,input,value);form.append(wrap);controls.push({key:control.key,input,output:value});
    listen(input,'input',()=>{
      try{if(!input.value.trim())throw invalid();update({...current,[control.key]:Number(input.value)});}
      catch{input.value=exact(current[control.key]);error.textContent='This selection is outside the declared model controls.';error.hidden=false;}
    });
  }
  const reset=node('button','ei-button','Reset explorer');reset.type='button';reset.setAttribute('data-equivalence-reset','');listen(reset,'click',()=>update(captured.initial));
  form.append(reset);section.append(form,error,status,display);update(captured.initial);root.append(section);
  return Object.freeze({update,dispose(){if(disposed)return;disposed=true;listeners.splice(0).forEach(remove=>remove());section.remove();}});
}
