import {evaluatePolynomial} from './state.mjs';
const NS='http://www.w3.org/2000/svg';
export function drawGraph(doc,spec,{label='Graph of the given polynomial',secants=[]}={}) {
  const svg=doc.createElementNS(NS,'svg');svg.setAttribute('viewBox','0 0 640 320');
  svg.setAttribute('role','img');svg.setAttribute('aria-label',label);svg.classList.add('ec-graph');
  const add=(tag,attributes,text)=>{const node=doc.createElementNS(NS,tag);for(const [key,value]of Object.entries(attributes))node.setAttribute(key,String(value));if(text!==undefined)node.textContent=text;svg.append(node);return node;};
  add('title',{},label);add('desc',{},`Declared input interval ${spec.domain.join(' to ')}; vertical window ${spec.range.join(' to ')}. A sample value table accompanies this graph.`);
  const [xmin,xmax]=spec.domain,[ymin,ymax]=spec.range;
  const X=x=>48+(x-xmin)/(xmax-xmin)*564,Y=y=>282-(y-ymin)/(ymax-ymin)*258;
  const defs=doc.createElementNS(NS,'defs'),clip=doc.createElementNS(NS,'clipPath');
  // Each slide contains one graph. Local unique clip names also work in simulations.
  const id='ec-clip-'+drawGraph.next++;clip.id=id;
  const rect=doc.createElementNS(NS,'rect');for(const [key,value]of Object.entries({x:48,y:24,width:564,height:258}))rect.setAttribute(key,String(value));clip.append(rect);defs.append(clip);svg.append(defs);
  for(let i=0;i<=4;i++) {
    const x=xmin+(xmax-xmin)*i/4,y=ymin+(ymax-ymin)*i/4;
    add('line',{x1:X(x),x2:X(x),y1:24,y2:282,stroke:'#d9e5ee'});
    add('line',{x1:48,x2:612,y1:Y(y),y2:Y(y),stroke:'#d9e5ee'});
    add('text',{x:X(x),y:302,'text-anchor':'middle'},format(x));
    add('text',{x:41,y:Y(y)+5,'text-anchor':'end'},format(y));
  }
  if(xmin<=0&&xmax>=0)add('line',{x1:X(0),x2:X(0),y1:24,y2:282,stroke:'#203754','stroke-width':1.6});
  if(ymin<=0&&ymax>=0)add('line',{x1:48,x2:612,y1:Y(0),y2:Y(0),stroke:'#203754','stroke-width':1.6});
  const points=Array.from({length:241},(_,i)=>{const x=xmin+(xmax-xmin)*i/240;return`${i?'L':'M'}${X(x)},${Y(evaluatePolynomial(spec.coefficients,x))}`;}).join(' ');
  add('path',{d:points,fill:'none',stroke:'#8b1538','stroke-width':3,'clip-path':`url(#${id})`});
  for(const {left,right}of secants) {
    const y1=evaluatePolynomial(spec.coefficients,left),y2=evaluatePolynomial(spec.coefficients,right);
    add('line',{x1:X(left),y1:Y(y1),x2:X(right),y2:Y(y2),stroke:'#067765','stroke-width':3,'stroke-dasharray':'7 4','clip-path':`url(#${id})`});
    for(const [x,y]of [[left,y1],[right,y2]])add('circle',{cx:X(x),cy:Y(y),r:5,fill:'#067765','clip-path':`url(#${id})`});
  }
  add('text',{x:615,y:315},'x');add('text',{x:10,y:18},'y');
  return svg;
}
drawGraph.next=0;
export const format=value=>Number(value.toFixed(5)).toString().replace('-','−');
export function valueTable(doc,headers,rows,caption) {
  const wrap=doc.createElement('div');wrap.className='ec-table-wrap';
  const table=doc.createElement('table'),cap=doc.createElement('caption');cap.textContent=caption;table.append(cap);
  const head=doc.createElement('thead'),tr=doc.createElement('tr');
  headers.forEach(text=>{const th=doc.createElement('th');th.scope='col';th.textContent=text;tr.append(th);});head.append(tr);table.append(head);
  const body=doc.createElement('tbody');for(const values of rows){const row=doc.createElement('tr');values.forEach(value=>{const td=doc.createElement('td');td.textContent=typeof value==='number'?format(value):value;row.append(td);});body.append(row);}table.append(body);wrap.append(table);return wrap;
}
