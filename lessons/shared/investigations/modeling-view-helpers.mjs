import {svgNode,table,format,scrollableGraph} from './visuals.mjs';

// Shared only by the three stateless modeling views. The retained helpers stay exact.
export const invalid=()=>new RangeError('Invalid modeling view configuration.');
const own=(value,key)=>Object.hasOwn(value,key);
export function record(value) {
  try {
    if(!value||typeof value!=='object'||![Object.prototype,null].includes(Object.getPrototypeOf(value)))throw invalid();
    const descriptors=Object.getOwnPropertyDescriptors(value),result={};
    for(const key of Reflect.ownKeys(descriptors)) {
      const d=descriptors[key];
      if(typeof key!=='string'||!own(d,'value')||!d.enumerable)throw invalid();
      Object.defineProperty(result,key,{value:d.value,enumerable:true});
    }
    return result;
  } catch {throw invalid();}
}
export function numeric(value,places=5) {
  if(typeof value!=='number'||!Number.isFinite(value))throw invalid();
  if(value===0)return '0';
  return Number(value.toFixed(places))===0?value.toExponential(3):format(value,places);
}
export function element(doc,tag,text,cls) {
  const node=doc.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=String(text);return node;
}
export function text(doc,text,attribute,cls='ei-note') {
  const p=element(doc,'p',text,cls);if(attribute)p.setAttribute(attribute,'');return p;
}
export function dataTable(doc,headers,rows,caption,key) {
  const node=table(doc,headers,rows.map(row=>row.map(value=>typeof value==='number'?numeric(value):value)),caption);
  node.tabIndex=0;node.setAttribute('role','region');node.setAttribute('aria-label',caption+' — scrollable table');
  node.setAttribute('data-modeling-table',key);node.style.maxWidth='100%';return node;
}
function captureInput(value,fields) {
  const input=record(value),keys=Object.keys(fields),out={};
  if(Object.keys(input).length!==keys.length||keys.some(key=>!own(input,key)))throw invalid();
  for(const [key,[min,max,step]]of Object.entries(fields)) {
    const n=input[key];
    if(typeof n!=='number'||!Number.isFinite(n)||n<min||n>max||!Number.isInteger((n-min)/step))throw invalid();
    out[key]=n===0?0:n;
  }
  return Object.freeze(out);
}
function captureScene(value,family,fields) {
  const source=record(value);if(source.model!=='modeling'||source.family!==family)throw invalid();
  const initial=captureInput(source.initial,fields),controls=[],seen=new Set();
  try {
    const array=source.controls===undefined?[]:source.controls;
    if(!Array.isArray(array)||Object.getPrototypeOf(array)!==Array.prototype)throw invalid();
    const ds=Object.getOwnPropertyDescriptors(array),length=ds.length.value;
    if(length>Object.keys(fields).length||Reflect.ownKeys(ds).length!==length+1)throw invalid();
    for(let i=0;i<length;i++) {
      const d=ds[String(i)];if(!d||!own(d,'value')||!d.enumerable)throw invalid();
      const c=record(d.value);
      if(Object.keys(c).sort().join('|')!=='key|label|max|min|step'||typeof c.key!=='string'||!own(fields,c.key)||seen.has(c.key)||
        typeof c.label!=='string'||!c.label.trim()||c.label.length>120)throw invalid();
      const [min,max,step]=fields[c.key];
      if(![c.min,c.max,c.step].every(n=>typeof n==='number'&&Number.isFinite(n))||c.min<min||c.max>max||c.min>=c.max||
        c.step<step||!Number.isInteger(c.step/step)||!Number.isInteger((c.min-min)/step)||!Number.isInteger((c.max-min)/step)||
        !Number.isInteger((c.max-c.min)/c.step)||initial[c.key]<c.min||initial[c.key]>c.max||!Number.isInteger((initial[c.key]-c.min)/c.step))throw invalid();
      seen.add(c.key);controls.push(Object.freeze({...c}));
    }
  } catch {throw invalid();}
  return {initial,controls:Object.freeze(controls)};
}
let mounts=0;
export function mountControls({root,window:win,scene,family,fields,title,render,selects={}}) {
  const doc=root?.ownerDocument;if(!doc||typeof root.append!=='function'||!win)throw new TypeError('Modeling view requires a DOM root and window.');
  const captured=captureScene(scene,family,fields),id=++mounts,bindings=[],listeners=[];
  let current=captured.initial,disposed=false;
  const section=element(doc,'section',undefined,'ei-modeling-view');section.setAttribute('data-modeling-family',family);section.setAttribute('aria-label',title);section.style.minWidth='0';
  const form=element(doc,'div',undefined,'ei-controls'),display=element(doc,'div');display.style.minWidth='0';display.setAttribute('data-modeling-results','');
  const status=text(doc,'','data-modeling-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const error=text(doc,'','data-modeling-error');error.setAttribute('role','alert');error.hidden=true;
  const initialOutput=render(doc,current,id); // Validate and build everything before the caller DOM is touched.
  function commit(value) {
    if(disposed)throw new Error('Modeling view is disposed.');
    const next=captureInput(value,fields);
    for(const c of captured.controls)if(next[c.key]<c.min||next[c.key]>c.max||!Number.isInteger((next[c.key]-c.min)/c.step))throw invalid();
    const output=render(doc,next,id);display.replaceChildren(output.node);current=next;
    for(const {input,readout,key}of bindings){input.value=String(next[key]);readout.value=numeric(next[key]);readout.textContent=readout.value;}
    status.textContent=output.summary;error.hidden=true;error.textContent='';
  }
  const listen=(node,type,fn)=>{node.addEventListener(type,fn);listeners.push(()=>node.removeEventListener(type,fn));};
  for(const c of captured.controls) {
    const wrap=element(doc,'div',undefined,'ei-control'),label=element(doc,'label',c.label),input=element(doc,own(selects,c.key)?'select':'input'),readout=element(doc,'output');
    input.id=`ei-modeling-${id}-${c.key}`;label.id=input.id+'-label';label.htmlFor=input.id;label.setAttribute('for',input.id);input.setAttribute('aria-labelledby',label.id);
    input.setAttribute('data-modeling-control',c.key);readout.setAttribute('for',input.id);
    if(own(selects,c.key)) {
      for(const [value,label]of selects[c.key])if(value>=c.min&&value<=c.max&&(value-c.min)%c.step===0){const option=element(doc,'option',label);option.value=String(value);input.append(option);}
    } else {input.type='range';input.min=String(c.min);input.max=String(c.max);input.step=String(c.step);}
    input.value=String(current[c.key]);readout.value=numeric(current[c.key]);readout.textContent=readout.value;
    bindings.push({input,readout,key:c.key});
    const change=()=>{try{const raw=input.value;if(typeof raw!=='string'||!raw.trim())throw invalid();commit({...current,[c.key]:Number(raw)});}catch{error.textContent='Choose a supported control value.';error.hidden=false;}};
    listen(input,own(selects,c.key)?'change':'input',change);wrap.append(label,input,readout);form.append(wrap);
  }
  const reset=element(doc,'button','Reset explorer');reset.type='button';reset.setAttribute('data-modeling-reset','');listen(reset,'click',()=>commit(captured.initial));
  const actions=element(doc,'div',undefined,'ei-actions');actions.append(reset);
  display.append(initialOutput.node);status.textContent=initialOutput.summary;section.append(form,actions,error,status,display);
  try {root.append(section);} catch(error){listeners.forEach(remove=>remove());throw error;}
  return Object.freeze({update:commit,dispose(){if(disposed)return;disposed=true;for(const remove of listeners)remove();section.remove();}});
}

/** Finite continuous series only; features are included in bounds before projection. */
export function plot(doc,{key,title,xLabel,yLabel,series,features=[],includeZero=true}) {
  const points=[...series.flatMap(s=>s.points),...features];
  if(!points.length||points.length>1000||points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))throw invalid();
  let xmin=Math.min(...points.map(p=>p.x)),xmax=Math.max(...points.map(p=>p.x));
  let ymin=Math.min(...points.map(p=>p.y)),ymax=Math.max(...points.map(p=>p.y));
  if(includeZero){ymin=Math.min(ymin,0);ymax=Math.max(ymax,0);}
  if(xmin===xmax){xmin-=1;xmax+=1;}if(ymin===ymax){ymin-=1;ymax+=1;}
  const xp=(xmax-xmin)*.06,yp=(ymax-ymin)*.1;xmin-=xp;xmax+=xp;ymin-=yp;ymax+=yp;
  const x=n=>70+(n-xmin)/(xmax-xmin)*500,y=n=>282-(n-ymin)/(ymax-ymin)*240;
  const svg=svgNode(doc,'svg',{viewBox:'0 0 600 340',class:'ei-graph',role:'img','aria-label':title,'data-modeling-plot':key,'data-xmin':xmin,'data-xmax':xmax,'data-ymin':ymin,'data-ymax':ymax});
  svg.append(svgNode(doc,'title',{},title));
  for(let i=0;i<=4;i++) {const xx=xmin+(xmax-xmin)*i/4,yy=ymin+(ymax-ymin)*i/4;svg.append(svgNode(doc,'line',{x1:70,x2:570,y1:y(yy),y2:y(yy),stroke:'#dce3e4'}),svgNode(doc,'text',{x:62,y:y(yy)+4,'text-anchor':'end',class:'ei-axis-text'},numeric(yy,2)),svgNode(doc,'text',{x:x(xx),y:305,'text-anchor':'middle',class:'ei-axis-text'},numeric(xx,2)));}
  svg.append(svgNode(doc,'path',{d:'M70 42V282H570',stroke:'#344b50',fill:'none'}),svgNode(doc,'text',{x:320,y:333,'text-anchor':'middle',class:'ei-axis-label'},xLabel),svgNode(doc,'text',{x:72,y:20,class:'ei-axis-label'},yLabel));
  if(ymin<=0&&ymax>=0)svg.append(svgNode(doc,'line',{x1:70,x2:570,y1:y(0),y2:y(0),stroke:'#344b50','stroke-width':1.5,'data-modeling-zero-line':''}));
  series.forEach((s,index)=>{
    const color=['#8a1738','#087d7b','#6e50a2'][index%3],dash=index===1?'7 4':index===2?'2 4':undefined;
    if(s.connect!==false)svg.append(svgNode(doc,'polyline',{points:s.points.map(p=>`${x(p.x)},${y(p.y)}`).join(' '),fill:'none',stroke:color,'stroke-width':s.emphasis?4:2.5,...(dash?{'stroke-dasharray':dash}:{}),'data-modeling-series':s.key}));
    if(s.dots)for(const p of s.points){if(s.stems)svg.append(svgNode(doc,'line',{x1:x(p.x),x2:x(p.x),y1:y(0),y2:y(p.y),stroke:color,'data-modeling-stem':s.key}));svg.append(svgNode(doc,'circle',{cx:x(p.x),cy:y(p.y),r:5,fill:color,stroke:'#fff','stroke-width':1,'data-modeling-point':s.key,'data-x':p.x,'data-y':p.y}));}
  });
  for(const p of features) {const node=svgNode(doc,p.diamond?'polygon':'circle',p.diamond?{points:`${x(p.x)},${y(p.y)-7} ${x(p.x)+7},${y(p.y)} ${x(p.x)},${y(p.y)+7} ${x(p.x)-7},${y(p.y)}`}:{cx:x(p.x),cy:y(p.y),r:6});
    for(const [attr,value]of Object.entries({fill:p.open?'#fff':'#b06016',stroke:'#173f45','stroke-width':2,'data-modeling-feature':p.key,'data-x':p.x,'data-y':p.y}))node.setAttribute(attr,String(value));
    node.append(svgNode(doc,'title',{},p.label));svg.append(node);
  }
  const figure=scrollableGraph(doc,svg,title),legend=element(doc,'ul',undefined,'ei-legend');legend.setAttribute('aria-label','Graph series and features');
  series.forEach((s,i)=>legend.append(element(doc,'li',`${i+1}. ${s.label}${s.connect!==false?i===0?' (solid)':i===1?' (dashed)':' (dotted)':' (points)'}`)));
  features.forEach(p=>legend.append(element(doc,'li',`${p.open?'Hollow circle':p.diamond?'Diamond':'Filled circle'}: ${p.label}`)));figure.append(legend);return figure;
}
