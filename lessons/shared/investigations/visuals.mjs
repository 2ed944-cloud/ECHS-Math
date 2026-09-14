import {vesselMesh,projectPoint} from './vase-model.mjs';
const NS='http://www.w3.org/2000/svg';
export function svgNode(doc,tag,attrs={},text) {
  const node=doc.createElementNS(NS,tag);
  for(const [key,value] of Object.entries(attrs))node.setAttribute(key,String(value));
  if(text!==undefined)node.textContent=text;return node;
}
export function format(value,places=3) {
  if(!Number.isFinite(value))return 'undefined';
  if(value!==0&&(Math.abs(value)>=1e7||Math.abs(value)<1e-4))return value.toExponential(3);
  return Number(value.toFixed(places)).toLocaleString('en-US',{maximumFractionDigits:places});
}
export function scrollableGraph(doc,svg,title) {
  const figure=doc.createElement('div');figure.className='ei-plot';
  const region=doc.createElement('div');region.className='ei-graph-scroll';region.tabIndex=0;region.setAttribute('role','region');region.setAttribute('aria-label',`${title} — scrollable graph`);
  const hint=doc.createElement('p');hint.className='ei-graph-hint';hint.textContent='Swipe across the graph, or focus it and use the arrow keys, to see its full width.';
  region.append(svg);figure.append(hint,region);return figure;
}
export function graph(doc,{series,xLabel,yLabel,title}) {
  const root=svgNode(doc,'svg',{viewBox:'0 0 600 340',role:'img','aria-label':title,class:'ei-graph'});
  root.append(svgNode(doc,'title',{},title));
  const points=series.flatMap(s=>s.points).filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y));
  if(!points.length)return root;
  let xmin=Math.min(...points.map(p=>p.x)),xmax=Math.max(...points.map(p=>p.x));
  let ymin=Math.min(0,...points.map(p=>p.y)),ymax=Math.max(0,...points.map(p=>p.y));
  if(xmax===xmin){xmin-=1;xmax+=1;}if(ymax===ymin){ymin-=1;ymax+=1;}
  const pad=(ymax-ymin)*.08;ymin-=pad;ymax+=pad;
  const x=v=>70+(v-xmin)/(xmax-xmin)*500,y=v=>282-(v-ymin)/(ymax-ymin)*240;
  for(let i=0;i<=4;i++) {
    const xx=xmin+(xmax-xmin)*i/4,yy=ymin+(ymax-ymin)*i/4;
    root.append(svgNode(doc,'line',{x1:70,y1:y(yy),x2:570,y2:y(yy),stroke:'#dce3e4'}),svgNode(doc,'text',{x:62,y:y(yy)+4,'text-anchor':'end',class:'ei-axis-text'},format(yy,2)),svgNode(doc,'text',{x:x(xx),y:305,'text-anchor':'middle',class:'ei-axis-text'},format(xx,2)));
  }
  root.append(svgNode(doc,'path',{d:'M70 38V282H570',stroke:'#344b50',fill:'none'}),svgNode(doc,'text',{x:320,y:333,'text-anchor':'middle',class:'ei-axis-label'},xLabel),svgNode(doc,'text',{x:72,y:20,class:'ei-axis-label'},yLabel));
  series.forEach((s,i)=>{
    const color=['#8a1738','#087d7b','#6e50a2'][i%3];
    if(s.connect!==false)root.append(svgNode(doc,'polyline',{points:s.points.map(p=>`${x(p.x)},${y(p.y)}`).join(' '),fill:'none',stroke:color,'stroke-width':3,'stroke-dasharray':i===1?'7 4':'none'}));
    if(s.dots!==false)for(const p of s.points)root.append(svgNode(doc,'circle',{cx:x(p.x),cy:y(p.y),r:4,fill:color,stroke:'#fff','stroke-width':1.5}));
  });
  const figure=scrollableGraph(doc,root,title),legend=doc.createElement('ul');legend.className='ei-legend';legend.setAttribute('aria-label','Graph series');
  series.forEach((s,i)=>{const item=doc.createElement('li');item.textContent=`${i+1}. ${s.label}`;item.style.color=['#8a1738','#087d7b','#6e50a2'][i%3];legend.append(item);});figure.append(legend);return figure;
}
export function table(doc,headers,rows,caption) {
  const wrap=doc.createElement('div');wrap.className='ei-table-scroll';
  const node=doc.createElement('table'),cap=doc.createElement('caption');cap.textContent=caption;node.append(cap);
  const head=doc.createElement('thead'),hr=doc.createElement('tr');
  headers.forEach(v=>{const th=doc.createElement('th');th.scope='col';th.textContent=v;hr.append(th);});head.append(hr);node.append(head);
  const body=doc.createElement('tbody');rows.forEach(row=>{const tr=doc.createElement('tr');row.forEach((v,i)=>{const cell=doc.createElement(i===0?'th':'td');if(i===0)cell.scope='row';cell.textContent=typeof v==='number'?format(v):String(v);tr.append(cell);});body.append(tr);});node.append(body);wrap.append(node);return wrap;
}
export function vesselDrawing(doc,state,camera={azimuth:35,elevation:18},cutaway=true) {
  const root=svgNode(doc,'svg',{viewBox:'0 0 380 380',role:'img','aria-label':`Three-dimensional ${state.shape} vessel. Water height ${format(state.height)} cm; volume ${format(state.volume)} cubic centimetres.`,class:'ei-vessel'});
  root.append(svgNode(doc,'title',{},'Spatial vessel model with a horizontal water surface and height axis'));
  const project=p=>projectPoint(p,camera),faces=[];
  function surface(height,water) {
    if(height===0)return;
    const rings=vesselMesh(state.shape,{height,levels:8,segments:24});
    for(let j=0;j<rings.length-1;j++)for(let i=0;i<24;i++) {
      if(!water&&cutaway&&i>=3&&i<9)continue;
      const ps=[rings[j][i],rings[j][(i+1)%24],rings[j+1][(i+1)%24],rings[j+1][i]].map(project);
      faces.push({ps,depth:ps.reduce((a,p)=>a+p.depth,0)/4,water});
    }
    if(water) {const ps=rings.at(-1).map(project);faces.push({ps,depth:ps.reduce((a,p)=>a+p.depth,0)/ps.length,water:true,top:true});}
  }
  surface(12,false);surface(state.height,true);
  for(const face of faces.sort((a,b)=>a.depth-b.depth))root.append(svgNode(doc,'polygon',{points:face.ps.map(p=>`${p.x},${p.y}`).join(' '),fill:face.water?'#169cbd':'#ddb7be','fill-opacity':face.top?.7:face.water?.28:.08,stroke:face.water?'#197e98':'#8a1738','stroke-opacity':face.water?.13:.32,'stroke-width':.65}));
  const p0=project({x:0,y:0,z:0}),p1=project({x:0,y:12,z:0}),water=project({x:0,y:state.height,z:0});
  root.append(svgNode(doc,'line',{x1:p0.x,y1:p0.y,x2:p1.x,y2:p1.y,stroke:'#273e44','stroke-dasharray':'4 4'}));
  for(const h of [0,3,6,9,12]){const p=project({x:0,y:h,z:0});root.append(svgNode(doc,'text',{x:p.x-10,y:p.y+4,'text-anchor':'end',class:'ei-axis-text'},String(h)));}
  root.append(svgNode(doc,'text',{x:p1.x,y:p1.y-16,'text-anchor':'middle',class:'ei-axis-label'},'height / cm'),svgNode(doc,'circle',{cx:water.x,cy:water.y,r:4,fill:'#083c51'}),svgNode(doc,'text',{x:190,y:370,'text-anchor':'middle',class:'ei-axis-label'},cutaway?'Cutaway exposes the water surface':'Complete vessel surface'));
  return root;
}
