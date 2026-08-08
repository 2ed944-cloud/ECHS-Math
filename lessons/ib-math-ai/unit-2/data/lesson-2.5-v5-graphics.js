(function(){
  'use strict';
  if(String(window.LESSON_DATA?.lesson?.number)!=='2.5')return;
  const C={maroon:'#7a1733',navy:'#17324d',teal:'#177e89',gold:'#d4a72c',ink:'#17212b',muted:'#5d6a75',line:'#d7d0c7',paper:'#fffdf9',green:'#2f855a',red:'#b8324b',blue:'#2b6cb0'};
  let uid=0;
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const fmt=value=>Math.abs(value)<1e-10?'0':Number.isInteger(value)?String(value):String(Number(value.toFixed(2)));
  const niceStep=span=>span<=8?1:span<=16?2:span<=35?5:span<=80?10:20;
  const ticks=(min,max,step)=>{const values=[];let start=Math.ceil(min/step)*step;for(let v=start;v<=max+step*1e-8;v+=step)values.push(Number(v.toFixed(10)));return values;};

  function pathFor(fn,from,to,sx,sy,samples=520){
    let d='',drawing=false,lastY=null;
    for(let i=0;i<=samples;i++){
      const x=from+(to-from)*i/samples;let y;
      try{y=fn(x);}catch{y=NaN;}
      const valid=Number.isFinite(y)&&Math.abs(y)<1e6;
      if(!valid){drawing=false;lastY=null;continue;}
      const px=sx(x),py=sy(y);
      if(lastY!==null&&Math.abs(py-lastY)>220){drawing=false;}
      d+=`${drawing?'L':'M'}${px.toFixed(2)} ${py.toFixed(2)} `;drawing=true;lastY=py;
    }
    return d.trim();
  }

  function plotSVG(config){
    const id=`tci5-clip-${++uid}`;
    const W=760,H=430,L=70,R=28,T=28,B=58;
    const pw=W-L-R,ph=H-T-B;
    const sx=x=>L+(x-config.xMin)/(config.xMax-config.xMin)*pw;
    const sy=y=>T+(config.yMax-y)/(config.yMax-config.yMin)*ph;
    const xStep=config.xStep||niceStep(config.xMax-config.xMin);
    const yStep=config.yStep||niceStep(config.yMax-config.yMin);
    const xTicks=ticks(config.xMin,config.xMax,xStep),yTicks=ticks(config.yMin,config.yMax,yStep);
    const grid=[...xTicks.map(x=>`<line x1="${sx(x)}" y1="${T}" x2="${sx(x)}" y2="${H-B}"/>`),...yTicks.map(y=>`<line x1="${L}" y1="${sy(y)}" x2="${W-R}" y2="${sy(y)}"/>`)].join('');
    const xAxis=config.yMin<=0&&config.yMax>=0?sy(0):H-B;
    const yAxis=config.xMin<=0&&config.xMax>=0?sx(0):L;
    const tickLabels=[...xTicks.filter(x=>Math.abs(x)>1e-10).map(x=>`<text x="${sx(x)}" y="${Math.min(H-17,xAxis+22)}" text-anchor="middle">${fmt(x)}</text>`),...yTicks.filter(y=>Math.abs(y)>1e-10).map(y=>`<text x="${Math.max(15,yAxis-12)}" y="${sy(y)+5}" text-anchor="end">${fmt(y)}</text>`)].join('');
    const asym=(config.asymptotes||[]).map(a=>a.type==='v'
      ?`<line x1="${sx(a.value)}" y1="${T}" x2="${sx(a.value)}" y2="${H-B}" stroke="${a.color||C.gold}" stroke-width="2.5" stroke-dasharray="9 7"/><text x="${sx(a.value)+7}" y="${T+18}" fill="${a.color||C.gold}">${esc(a.label||`x=${fmt(a.value)}`)}</text>`
      :`<line x1="${L}" y1="${sy(a.value)}" x2="${W-R}" y2="${sy(a.value)}" stroke="${a.color||C.gold}" stroke-width="2.5" stroke-dasharray="9 7"/><text x="${W-R-6}" y="${sy(a.value)-8}" text-anchor="end" fill="${a.color||C.gold}">${esc(a.label||`y=${fmt(a.value)}`)}</text>`).join('');
    const curves=(config.curves||[]).map(curve=>{
      const intervals=curve.intervals||[[curve.from??config.xMin,curve.to??config.xMax]];
      const d=intervals.map(interval=>pathFor(curve.fn,interval[0],interval[1],sx,sy,curve.samples||520)).join(' ');
      return `<path d="${d}" fill="none" stroke="${curve.color||C.maroon}" stroke-width="${curve.width||4}" stroke-linecap="round" stroke-linejoin="round" ${curve.dash?`stroke-dasharray="${curve.dash}"`:''}/>`;
    }).join('');
    const segments=(config.segments||[]).map(s=>`<line x1="${sx(s.x1)}" y1="${sy(s.y1)}" x2="${sx(s.x2)}" y2="${sy(s.y2)}" stroke="${s.color||C.teal}" stroke-width="${s.width||3}" ${s.dash?`stroke-dasharray="${s.dash}"`:''}/>`).join('');
    const points=(config.points||[]).map(p=>`<g><circle cx="${sx(p.x)}" cy="${sy(p.y)}" r="${p.r||5.5}" fill="${p.fill||C.paper}" stroke="${p.color||C.navy}" stroke-width="3"/><text x="${sx(p.x)+(p.dx??9)}" y="${sy(p.y)+(p.dy??-9)}" fill="${p.color||C.navy}" font-weight="800">${esc(p.label||'')}</text></g>`).join('');
    const annotations=(config.annotations||[]).map(a=>`<text x="${sx(a.x)}" y="${sy(a.y)}" fill="${a.color||C.ink}" font-weight="${a.bold?'800':'600'}" text-anchor="${a.anchor||'start'}">${esc(a.text)}</text>`).join('');
    const legend=(config.curves||[]).filter(c=>c.label).map((curve,index)=>`<g transform="translate(${L+index*176},${H-20})"><line x1="0" y1="0" x2="28" y2="0" stroke="${curve.color||C.maroon}" stroke-width="4" ${curve.dash?`stroke-dasharray="${curve.dash}"`:''}/><text x="36" y="5" fill="${C.ink}" font-weight="700">${esc(curve.label)}</text></g>`).join('');
    return `<svg class="tci5-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(config.label||config.title||'Function graph')}"><title>${esc(config.title||'Function graph')}</title><desc>${esc(config.description||'Coordinate graph with labelled axes and exact model features.')}</desc><defs><clipPath id="${id}"><rect x="${L}" y="${T}" width="${pw}" height="${ph}" rx="8"/></clipPath><marker id="${id}-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="${C.navy}"/></marker></defs><rect x="1" y="1" width="758" height="428" rx="22" fill="${C.paper}" stroke="${C.line}"/><g class="tci5-grid" stroke="${C.line}" stroke-width="1">${grid}</g><g stroke="${C.navy}" stroke-width="2.5"><line x1="${L}" y1="${xAxis}" x2="${W-R}" y2="${xAxis}" marker-end="url(#${id}-arrow)"/><line x1="${yAxis}" y1="${H-B}" x2="${yAxis}" y2="${T}" marker-end="url(#${id}-arrow)"/></g><g class="tci5-tick-labels" fill="${C.muted}">${tickLabels}<text x="${W-R-4}" y="${xAxis-9}" text-anchor="end" font-weight="800">x</text><text x="${yAxis+10}" y="${T+14}" font-weight="800">y</text></g><g clip-path="url(#${id})">${asym}${segments}${curves}${points}${annotations}</g>${legend}</svg>`;
  }

  function flowSVG(title,nodes,footer='',accent=C.teal){
    const W=760,H=360,pad=42;const count=nodes.length;const gap=26;const boxW=(W-2*pad-gap*(count-1))/count;const y=112,h=120;const markerId=`flow-arrow-${++uid}`;
    const boxes=nodes.map((node,i)=>{const x=pad+i*(boxW+gap);return `<g><rect x="${x}" y="${y}" width="${boxW}" height="${h}" rx="20" fill="${node.fill||'#ffffff'}" stroke="${node.color||accent}" stroke-width="3"/><text x="${x+boxW/2}" y="${y+36}" text-anchor="middle" fill="${node.color||accent}" font-size="13" font-weight="900">${esc(node.kicker||'STAGE')}</text><text x="${x+boxW/2}" y="${y+70}" text-anchor="middle" fill="${C.navy}" font-size="20" font-weight="900">${esc(node.title)}</text><text x="${x+boxW/2}" y="${y+97}" text-anchor="middle" fill="${C.muted}" font-size="14">${esc(node.text||'')}</text></g>`;}).join('');
    const arrows=nodes.slice(0,-1).map((_,i)=>{const x1=pad+(i+1)*boxW+i*gap+5;const x2=x1+gap-10;return `<line x1="${x1}" y1="${y+h/2}" x2="${x2}" y2="${y+h/2}" stroke="${C.navy}" stroke-width="3" marker-end="url(#${markerId})"/>`;}).join('');
    return `<svg class="tci5-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title><defs><marker id="${markerId}" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="${C.navy}"/></marker></defs><rect x="1" y="1" width="758" height="358" rx="24" fill="${C.paper}" stroke="${C.line}"/><text x="${W/2}" y="48" text-anchor="middle" fill="${C.navy}" font-size="25" font-weight="900">${esc(title)}</text>${boxes}${arrows}${footer?`<text x="${W/2}" y="305" text-anchor="middle" fill="${C.ink}" font-size="16" font-weight="700">${esc(footer)}</text>`:''}</svg>`;
  }

  function mapSVG(title,left,right,top='',bottom='',accent=C.maroon){
    const id=`map-arrow-${++uid}`;
    return `<svg class="tci5-svg" viewBox="0 0 760 360" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title><defs><marker id="${id}" markerWidth="9" markerHeight="9" refX="7" refY="3.5" orient="auto"><path d="M0,0 L0,7 L8,3.5 z" fill="${accent}"/></marker></defs><rect x="1" y="1" width="758" height="358" rx="24" fill="${C.paper}" stroke="${C.line}"/><text x="380" y="48" text-anchor="middle" fill="${C.navy}" font-size="25" font-weight="900">${esc(title)}</text>${top?`<text x="380" y="82" text-anchor="middle" fill="${C.muted}" font-size="15">${esc(top)}</text>`:''}<rect x="68" y="120" width="250" height="116" rx="22" fill="#fff" stroke="${C.teal}" stroke-width="3"/><rect x="442" y="120" width="250" height="116" rx="22" fill="#fff" stroke="${accent}" stroke-width="3"/><text x="193" y="170" text-anchor="middle" fill="${C.navy}" font-size="23" font-weight="900">${esc(left.title)}</text><text x="193" y="202" text-anchor="middle" fill="${C.muted}" font-size="16">${esc(left.text||'')}</text><text x="567" y="170" text-anchor="middle" fill="${C.navy}" font-size="23" font-weight="900">${esc(right.title)}</text><text x="567" y="202" text-anchor="middle" fill="${C.muted}" font-size="16">${esc(right.text||'')}</text><line x1="330" y1="178" x2="427" y2="178" stroke="${accent}" stroke-width="4" marker-end="url(#${id})"/><text x="378" y="158" text-anchor="middle" fill="${accent}" font-weight="900">${esc(left.arrow||'map')}</text>${bottom?`<text x="380" y="304" text-anchor="middle" fill="${C.ink}" font-size="17" font-weight="700">${esc(bottom)}</text>`:''}</svg>`;
  }

  function sectionSVG(letter,title,labels,accent){
    const items=labels.map((label,i)=>{const angle=-Math.PI/2+2*Math.PI*i/labels.length;const x=380+145*Math.cos(angle),y=205+105*Math.sin(angle);return `<g><circle cx="${x}" cy="${y}" r="42" fill="#fff" stroke="${accent}" stroke-width="3"/><text x="${x}" y="${y+5}" text-anchor="middle" fill="${C.navy}" font-size="13" font-weight="900">${esc(label)}</text><line x1="${380+62*Math.cos(angle)}" y1="${205+45*Math.sin(angle)}" x2="${x-44*Math.cos(angle)}" y2="${y-44*Math.sin(angle)}" stroke="${C.line}" stroke-width="3"/></g>`;}).join('');
    return `<svg class="tci5-svg" viewBox="0 0 760 390" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title><rect x="1" y="1" width="758" height="388" rx="24" fill="${C.paper}" stroke="${C.line}"/><circle cx="380" cy="205" r="74" fill="${accent}"/><text x="380" y="197" text-anchor="middle" fill="#fff" font-size="43" font-weight="1000">${esc(letter)}</text><text x="380" y="228" text-anchor="middle" fill="#fff" font-size="15" font-weight="800">${esc(title)}</text>${items}</svg>`;
  }


  function inverseTableSVG(){
    const rows=[[1,4],[2,7],[5,11]];const rowY=i=>142+i*48;
    const table=(x,title,swap=false,color=C.teal)=>`<g><rect x="${x}" y="82" width="244" height="220" rx="20" fill="#fff" stroke="${color}" stroke-width="3"/><text x="${x+122}" y="116" text-anchor="middle" fill="${color}" font-size="18" font-weight="900">${title}</text><line x1="${x+20}" y1="130" x2="${x+224}" y2="130" stroke="${C.line}"/><line x1="${x+122}" y1="130" x2="${x+122}" y2="286" stroke="${C.line}"/><text x="${x+70}" y="151" text-anchor="middle" fill="${C.navy}" font-weight="900">input</text><text x="${x+174}" y="151" text-anchor="middle" fill="${C.navy}" font-weight="900">output</text>${rows.map((pair,i)=>{const a=swap?pair[1]:pair[0],b=swap?pair[0]:pair[1],y=rowY(i)+33;return `<text x="${x+70}" y="${y}" text-anchor="middle" fill="${C.ink}" font-size="17">${a}</text><text x="${x+174}" y="${y}" text-anchor="middle" fill="${C.ink}" font-size="17">${b}</text>`;}).join('')}</g>`;
    const markerId=`inverse-table-arrow-${++uid}`;
    return `<svg class="tci5-svg" viewBox="0 0 760 390" role="img" aria-label="A function table and its inverse table with coordinates swapped"><title>Swap input and output columns to form an inverse table</title><defs><marker id="${markerId}" markerWidth="9" markerHeight="9" refX="7" refY="3.5" orient="auto"><path d="M0,0 L0,7 L8,3.5 z" fill="${C.gold}"/></marker></defs><rect x="1" y="1" width="758" height="388" rx="24" fill="${C.paper}" stroke="${C.line}"/><text x="380" y="46" text-anchor="middle" fill="${C.navy}" font-size="24" font-weight="900">Swap coordinates to obtain the inverse</text>${table(58,'f',false,C.maroon)}${table(458,'f⁻¹',true,C.teal)}<line x1="322" y1="194" x2="438" y2="194" stroke="${C.gold}" stroke-width="4" marker-end="url(#${markerId})"/><text x="380" y="176" text-anchor="middle" fill="${C.gold}" font-weight="900">swap columns</text><text x="380" y="338" text-anchor="middle" fill="${C.ink}" font-size="16" font-weight="700">(2,7) on f becomes (7,2) on f⁻¹</text></svg>`;
  }

  const graphFactories={
    cover:()=>plotSVG({title:'Transformations and inverse reflection',label:'A transformed quadratic and a linear inverse pair',xMin:-5,xMax:7,yMin:-6,yMax:9,xStep:2,yStep:3,curves:[{fn:x=>0.35*(x+1)**2-2,color:C.maroon,label:'base f'},{fn:x=>-0.7*(2*(x-1)+1)**2+5,color:C.teal,label:'transformed g'},{fn:x=>2*x-3,color:C.gold,label:'linear f'},{fn:x=>(x+3)/2,color:C.blue,label:'inverse'}],segments:[{x1:-5,y1:-5,x2:7,y2:7,color:C.navy,width:2,dash:'8 7'}],points:[{x:3,y:3,label:'(3,3)',color:C.gold}]}),
    'translation-graph':()=>plotSVG({title:'Translation of y=x²',xMin:-5,xMax:7,yMin:-5,yMax:12,xStep:2,yStep:2,curves:[{fn:x=>x*x,color:C.maroon,label:'f(x)=x²'},{fn:x=>(x-2)**2-3,color:C.teal,label:'g(x)=(x−2)²−3'}],points:[{x:0,y:0,label:'(0,0)',color:C.maroon},{x:2,y:-3,label:'(2,−3)',color:C.teal},{x:2,y:4,label:'(2,4)',color:C.maroon},{x:4,y:1,label:'(4,1)',color:C.teal}]}),
    'translated-rational':()=>plotSVG({title:'Translated rational graph',xMin:-7,xMax:5,yMin:-8,yMax:8,xStep:2,yStep:2,curves:[{fn:x=>1/(x-1)+2,color:C.maroon,label:'f(x)',intervals:[[-7,0.98],[1.02,5]]},{fn:x=>1/(x+2)-2,color:C.teal,label:'g(x)',intervals:[[-7,-2.02],[-1.98,5]]}],asymptotes:[{type:'v',value:1,color:C.maroon,label:'x=1'},{type:'h',value:2,color:C.maroon,label:'y=2'},{type:'v',value:-2,color:C.teal,label:'x=−2'},{type:'h',value:-2,color:C.teal,label:'y=−2'}]}),
    'translation-absolute':()=>plotSVG({title:'Translation of the absolute-value graph',xMin:-8,xMax:4,yMin:-1,yMax:10,xStep:2,yStep:2,curves:[{fn:x=>Math.abs(x),color:C.maroon,label:'|x|'},{fn:x=>Math.abs(x+4)+2,color:C.teal,label:'|x+4|+2'}],points:[{x:0,y:0,label:'base vertex',color:C.maroon},{x:-4,y:2,label:'image vertex',color:C.teal}]}),
    'reflection-graph':()=>{const f=x=>0.32*(x+2)**2-2+0.25*x;return plotSVG({title:'Input and output reflections',xMin:-7,xMax:7,yMin:-8,yMax:9,xStep:2,yStep:2,curves:[{fn:f,color:C.maroon,label:'f(x)'},{fn:x=>-f(x),color:C.teal,label:'−f(x)'},{fn:x=>f(-x),color:C.gold,label:'f(−x)'}]});},
    'double-reflection':()=>plotSVG({title:'Two reflections of an exponential graph',xMin:-4,xMax:4,yMin:-8,yMax:8,xStep:1,yStep:2,curves:[{fn:x=>Math.exp(x),color:C.maroon,label:'eˣ'},{fn:x=>-Math.exp(-x),color:C.teal,label:'−e⁻ˣ'}],asymptotes:[{type:'h',value:0,color:C.gold,label:'y=0'}],points:[{x:0,y:1,label:'(0,1)',color:C.maroon},{x:0,y:-1,label:'(0,−1)',color:C.teal}]}),
    'scale-graph':()=>{const f=x=>x*x-2*x;return plotSVG({title:'Vertical and horizontal scaling of x²−2x',xMin:-2,xMax:5,yMin:-4,yMax:13,xStep:1,yStep:2,curves:[{fn:f,color:C.maroon,label:'f(x)'},{fn:x=>2*f(x),color:C.teal,label:'2f(x)'},{fn:x=>f(2*x),color:C.gold,label:'f(2x)'},{fn:x=>f(x/2),color:C.blue,label:'f(x/2)'}],points:[{x:2,y:0,label:'base zero 2',color:C.maroon},{x:1,y:0,label:'compressed zero 1',color:C.gold},{x:4,y:0,label:'stretched zero 4',color:C.blue}]});},
    'combined-graph':()=>plotSVG({title:'Combined transformation of √x',xMin:-1,xMax:10,yMin:-4,yMax:6,xStep:1,yStep:1,curves:[{fn:x=>x>=0?Math.sqrt(x):NaN,color:C.maroon,label:'f(x)=√x',intervals:[[0,10]]},{fn:x=>x>=1?-2*Math.sqrt(3*(x-1))+4:NaN,color:C.teal,label:'g(x)',intervals:[[1,10]]}],points:[{x:0,y:0,label:'(0,0)',color:C.maroon},{x:1,y:4,label:'(1,4)',color:C.teal},{x:4/3,y:2,label:'(4/3,2)',color:C.teal},{x:7/3,y:0,label:'(7/3,0)',color:C.teal},{x:4,y:-2,label:'(4,−2)',color:C.teal}]}),
    'asymptote-transform':()=>{const f=x=>1/(x-1)+2;const g=x=>-2*f(0.5*(x+2))+5;return plotSVG({title:'Asymptotes under a combined transformation',xMin:-6,xMax:6,yMin:-8,yMax:8,xStep:2,yStep:2,curves:[{fn:f,color:C.maroon,label:'base f',intervals:[[-6,0.98],[1.02,6]]},{fn:g,color:C.teal,label:'image g',intervals:[[-6,-0.02],[0.02,6]]}],asymptotes:[{type:'v',value:1,color:C.maroon,label:'base x=1'},{type:'h',value:2,color:C.maroon,label:'base y=2'},{type:'v',value:0,color:C.teal,label:'image x=0'},{type:'h',value:1,color:C.teal,label:'image y=1'}]});},
    'lab-preview':()=>{const f=x=>0.5*x*x-2;const g=x=>-1.5*f(2*(x-1))+4;return plotSVG({title:'Transformation laboratory preview',xMin:-5,xMax:6,yMin:-8,yMax:10,xStep:1,yStep:2,curves:[{fn:f,color:C.maroon,label:'base f'},{fn:g,color:C.teal,label:'sample g'}],points:[{x:0,y:-2,label:'base vertex',color:C.maroon},{x:1,y:7,label:'image vertex',color:C.teal}]});},
    'horizontal-line-test':()=>plotSVG({title:'Horizontal line test for y=x²',xMin:-4,xMax:4,yMin:-1,yMax:9,xStep:1,yStep:1,curves:[{fn:x=>x*x,color:C.maroon,label:'y=x²'}],segments:[{x1:-4,y1:4,x2:4,y2:4,color:C.gold,width:3,dash:'8 6'}],points:[{x:-2,y:4,label:'(−2,4)',color:C.red},{x:2,y:4,label:'(2,4)',color:C.red}],annotations:[{x:3.8,y:4.3,text:'y=4',color:C.gold,anchor:'end',bold:true}]}),
    'inverse-table':()=>inverseTableSVG(),
    'inverse-linear':()=>plotSVG({title:'A linear function and its inverse',xMin:-5,xMax:8,yMin:-7,yMax:8,xStep:1,yStep:2,curves:[{fn:x=>2*x-3,color:C.maroon,label:'f(x)=2x−3'},{fn:x=>(x+3)/2,color:C.teal,label:'f⁻¹(x)'},{fn:x=>x,color:C.navy,label:'y=x',dash:'8 6',width:2.5}],points:[{x:0,y:-3,label:'(0,−3)',color:C.maroon},{x:-3,y:0,label:'(−3,0)',color:C.teal},{x:2,y:1,label:'(2,1)',color:C.maroon},{x:1,y:2,label:'(1,2)',color:C.teal},{x:3,y:3,label:'fixed',color:C.gold}]}),
    'inverse-quadratic':()=>plotSVG({title:'Restricted quadratic and square-root inverse',xMin:0,xMax:7,yMin:0,yMax:7,xStep:1,yStep:1,curves:[{fn:x=>x>=2?(x-2)**2+1:NaN,color:C.maroon,label:'f, x≥2',intervals:[[2,Math.sqrt(6)+2]]},{fn:x=>x>=1?2+Math.sqrt(x-1):NaN,color:C.teal,label:'f⁻¹, x≥1',intervals:[[1,7]]},{fn:x=>x,color:C.navy,label:'y=x',dash:'8 6',width:2.5}],points:[{x:2,y:1,label:'(2,1)',color:C.maroon},{x:1,y:2,label:'(1,2)',color:C.teal},{x:3,y:2,label:'(3,2)',color:C.maroon},{x:2,y:3,label:'(2,3)',color:C.teal},{x:4,y:5,label:'(4,5)',color:C.maroon},{x:5,y:4,label:'(5,4)',color:C.teal}]}),
    'inverse-reciprocal':()=>plotSVG({title:'Inverse function versus reciprocal',xMin:-5,xMax:5,yMin:-5,yMax:5,xStep:1,yStep:1,curves:[{fn:x=>2*x,color:C.maroon,label:'f(x)=2x'},{fn:x=>x/2,color:C.teal,label:'f⁻¹(x)=x/2'},{fn:x=>1/(2*x),color:C.gold,label:'1/f(x)',intervals:[[-5,-0.08],[0.08,5]]}],asymptotes:[{type:'v',value:0,color:C.gold,label:'x=0'},{type:'h',value:0,color:C.gold,label:'y=0'}]}),
    'rational-inverse-verify':()=>plotSVG({title:'Rational function and inverse',xMin:-6,xMax:6,yMin:-6,yMax:6,xStep:2,yStep:2,curves:[{fn:x=>(x-1)/(x+2),color:C.maroon,label:'f(x)',intervals:[[-6,-2.04],[-1.96,6]]},{fn:x=>(1+2*x)/(1-x),color:C.teal,label:'f⁻¹(x)',intervals:[[-6,0.96],[1.04,6]]},{fn:x=>x,color:C.navy,label:'y=x',dash:'8 6',width:2.3}],asymptotes:[{type:'v',value:-2,color:C.maroon,label:'x=−2'},{type:'h',value:1,color:C.maroon,label:'y=1'},{type:'v',value:1,color:C.teal,label:'x=1'},{type:'h',value:-2,color:C.teal,label:'y=−2'}]}),
    'sensor-case':()=>plotSVG({title:'Finite-domain sensor and inverse',xMin:-30,xMax:145,yMin:-30,yMax:145,xStep:25,yStep:25,curves:[{fn:x=>1.6*x+12,color:C.maroon,label:'S(T)',intervals:[[-20,80]]},{fn:x=>(x-12)/1.6,color:C.teal,label:'S⁻¹(x)',intervals:[[-20,140]]},{fn:x=>x,color:C.navy,label:'y=x',dash:'8 6',width:2.3}],points:[{x:-20,y:-20,label:'(−20,−20)',color:C.gold},{x:80,y:140,label:'(80,140)',color:C.maroon},{x:140,y:80,label:'(140,80)',color:C.teal}]}),
    'temperature-inverse':()=>flowSVG('Temperature conversion and reversal',[{kicker:'INPUT',title:'C °C',text:'Celsius'},{kicker:'FORWARD',title:'1.8C+32',text:'convert'},{kicker:'OUTPUT',title:'F °F',text:'Fahrenheit'}],'Reverse: subtract 32, then divide by 1.8',C.maroon),
    'sensor-linear-inverse':()=>flowSVG('Pressure–voltage calibration',[{kicker:'PRESSURE',title:'p kPa',text:'0 to 250'},{kicker:'SENSOR',title:'0.04p+0.6',text:'forward'},{kicker:'VOLTAGE',title:'V volts',text:'0.6 to 10.6'}],'Inverse input is voltage; inverse output is pressure.',C.teal)
  };

  const flowFactories={
    'reversible-process':()=>flowSVG('A reversible calibration',[{kicker:'PHYSICAL INPUT',title:'Temperature',text:'°C'},{kicker:'FORWARD MODEL',title:'S(T)',text:'signal'},{kicker:'OBSERVED OUTPUT',title:'Reading',text:'units'}],'The inverse must return one valid temperature for each attainable reading.',C.teal),
    'inverse-process':()=>flowSVG('Undo operations in reverse order',[{kicker:'INPUT',title:'x',text:'start'},{kicker:'STEP 1',title:'× 3',text:'forward'},{kicker:'STEP 2',title:'+ 8',text:'output'}],'Reverse route: −8 first, then ÷3.',C.maroon),
    'composition-flow':()=>flowSVG('Composition f ∘ g',[{kicker:'INPUT',title:'x',text:'domain of g'},{kicker:'FIRST',title:'g(x)',text:'inner output'},{kicker:'SECOND',title:'f(g(x))',text:'final output'}],'The output of g must lie in the domain of f.',C.teal),
    'pricing-pipeline':()=>flowSVG('Discount → fee → tax',[{kicker:'LISTED PRICE',title:'x',text:'QAR'},{kicker:'DISCOUNT',title:'0.88x',text:'12% off'},{kicker:'DELIVERY',title:'+18',text:'fixed fee'},{kicker:'TAX',title:'×1.05',text:'final'}],'P(x)=1.05(0.88x+18)=0.924x+18.9',C.gold),
    'inverse-composite':()=>flowSVG('Reverse a composite process',[{kicker:'FINAL',title:'P(x)',text:'observed'},{kicker:'UNDO TAX',title:'÷1.05',text:'first reverse'},{kicker:'UNDO FEE',title:'−18',text:'second reverse'},{kicker:'UNDO DISCOUNT',title:'÷0.88',text:'original x'}],'The last forward stage is undone first.',C.maroon),
    'process-design':()=>flowSVG('Measurement pipeline',[{kicker:'RAW',title:'x cm',text:'input'},{kicker:'CONVERT',title:'÷100',text:'metres'},{kicker:'CALIBRATE',title:'×1.03',text:'scale'},{kicker:'OFFSET',title:'−0.2',text:'reported'}],'P(x)=0.0103x−0.2',C.teal),
    'inverse-composition-identities':()=>flowSVG('Forward then reverse',[{kicker:'START',title:'x',text:'allowed input'},{kicker:'FORWARD',title:'f(x)',text:'output'},{kicker:'REVERSE',title:'f⁻¹(f(x))',text:'x'}],'Both composition directions must return the identity on valid domains.',C.green)
  };

  const sectionFactories={
    'block-a':()=>sectionSVG('A','Single transformations',['translate','reflect','scale','map'],C.maroon),
    'block-b':()=>sectionSVG('B','Combined transformations',['parameters','features','domain','lab'],C.teal),
    'block-c':()=>sectionSVG('C','Inverse functions',['one-to-one','reflect','restrict','verify'],C.gold),
    'block-d':()=>sectionSVG('D','Composition',['order','domain','process','reverse'],C.blue),
    'block-e':()=>sectionSVG('E','TI‑84 and IB',['predict','enter','evidence','verify'],C.green)
  };

  const mapSpecs={
    'notation-map':['Inverse function',{title:'f⁻¹(x)',text:'reverse mapping',arrow:'not equal to'},{title:'1/f(x)',text:'reciprocal output'},'Different operations, domains and graph structures.'],
    'master-transform':['Master coordinate map',{title:'(u,v)',text:'point on y=f(x)',arrow:'T'},{title:'(h+u/b, k+av)',text:'point on y=g(x)'},'Inside controls x; outside controls y.'],
    'point-map-derivation':['Derive the image coordinate',{title:'b(x−h)=u',text:'match inputs',arrow:'solve'},{title:'x=h+u/b',text:'new x-coordinate'},'Then transform the output: y=k+av.'],
    'vertical-translation':['Vertical translation',{title:'(u,v)',text:'base point',arrow:'+k to y'},{title:'(u,v+k)',text:'image point'},'x-coordinates remain fixed.'],
    'horizontal-translation':['Horizontal translation',{title:'(u,v)',text:'base point',arrow:'+h to x'},{title:'(u+h,v)',text:'image point'},'Solve x−h=u to explain the sign.'],
    'reflection-rules':['Input versus output reflection',{title:'−f(x)',text:'change y sign',arrow:'x-axis'},{title:'f(−x)',text:'change x sign'},'The negative sign acts on a different coordinate.'],
    'reflection-points':['Reflect a point',{title:'(3,−5)',text:'on f',arrow:'output sign'},{title:'(3,5)',text:'on −f'},'Input reflection would instead produce (−3,−5).'],
    'reflection-affine':['Reflect then shift output',{title:'(−4,7)',text:'base point',arrow:'x→−x; y→2−y'},{title:'(4,−5)',text:'image point'},'Track each coordinate separately.'],
    'vertical-scale':['Vertical scale',{title:'(u,v)',text:'base point',arrow:'×a on y'},{title:'(u,av)',text:'image point'},'Zeros remain fixed; y-distances scale.'],
    'horizontal-scale':['Horizontal scale',{title:'(u,v)',text:'base point',arrow:'÷b on x'},{title:'(u/b,v)',text:'image point'},'The horizontal factor is reciprocal.'],
    'scale-point':['Scale and reflect',{title:'(6,−2)',text:'base',arrow:'x÷2; y×(−3)'},{title:'(3,6)',text:'image'},'Horizontal compression 1/2; vertical stretch 3 and x-axis reflection.'],
    'scale-audit':['Negative inside scale',{title:'(−8,5)',text:'base',arrow:'x÷(−1/4); y÷2'},{title:'(32,2.5)',text:'image'},'y-axis reflection and horizontal stretch by 4.'],
    'reciprocal-error':['Correct horizontal reasoning',{title:'3x=u',text:'match input',arrow:'solve'},{title:'x=u/3',text:'new coordinate'},'f(3x) compresses horizontally by 1/3.'],
    'combined-map':['Forward and reverse maps',{title:'(u,v)',text:'base',arrow:'forward'},{title:'(h+u/b,k+av)',text:'image'},'Reverse with (b(x−h),(y−k)/a).'],
    'grouping-order':['Parentheses change the shift',{title:'3(x−1)',text:'h=1',arrow:'compare'},{title:'3x−1',text:'h=1/3'},'Rewrite the inside as b(x−h).'],
    'combined-point-example':['Combined point map',{title:'(6,−2)',text:'base',arrow:'b=2,h=4,a=−3,k=5'},{title:'(7,11)',text:'image'},'Verify by evaluating g(7).'],
    'combined-point-turn':['Combined challenge',{title:'(−9,4)',text:'base',arrow:'b=−3,h=−1,a=2,k=−7'},{title:'(2,1)',text:'image'},'Negative b adds a y-axis reflection.'],
    'feature-map-turn':['Feature map',{title:'(−2,5)',text:'turning point',arrow:'(1−u/2,3v+4)'},{title:'(2,19)',text:'image'},'The same map moves asymptotes and endpoints.'],
    'domain-range-transform':['Transform interval endpoints',{title:'u≥0',text:'base domain',arrow:'x=3−u/2'},{title:'x≤3',text:'image domain'},'Negative horizontal factors reverse direction.'],
    'reverse-transform-map':['Recover the base point',{title:'(7,11)',text:'image',arrow:'reverse map'},{title:'(6,−2)',text:'base'},'u=2(7−4); v=(11−5)/(−3).'],
    'order-error':['Solve the inside equation',{title:'3(x−1)=u',text:'not “×3”',arrow:'solve'},{title:'x=1+u/3',text:'correct x map'},'Outside: y=2v+4.'],
    'inverse-relation-function':['Relation versus function',{title:'swap (x,y)',text:'always creates relation',arrow:'unique?'},{title:'inverse function',text:'only if one-to-one'},'Use the horizontal line test.'],
    'horizontal-line-principle':['Horizontal line test',{title:'one output y=c',text:'horizontal line',arrow:'count crossings'},{title:'at most one',text:'unique preimage'},'More than one crossing means no inverse function on that domain.'],
    'inverse-reflection-principle':['Reflect in y=x',{title:'(a,b)',text:'on f',arrow:'swap'},{title:'(b,a)',text:'on f⁻¹'},'Fixed points satisfy f(x)=x.'],
    'inverse-algebra-steps':['Algebraic inversion',{title:'y=f(x)',text:'forward relation',arrow:'swap and solve'},{title:'y=f⁻¹(x)',text:'reverse rule'},'Finish by stating domain and range.'],
    'domain-range-swap':['Sets swap under inversion',{title:'f:D→R',text:'forward',arrow:'inverse'},{title:'f⁻¹:R→D',text:'reverse'},'Units swap with the variables.'],
    'quadratic-restriction':['Choose one branch',{title:'x≥2',text:'right branch',arrow:'inverse'},{title:'2+√(x−1)',text:'positive root'},'The original restriction selects the sign.'],
    'quadratic-branch-worked':['Restricted downward quadratic',{title:'t≥4',text:'descending branch',arrow:'swap and solve'},{title:'4+√(9−x)',text:'inverse'},'Inverse domain is the original range.'],
    'quadratic-branch-turn':['Left branch inverse',{title:'x≤−3',text:'original restriction',arrow:'select sign'},{title:'−3−√(x+2)',text:'inverse'},'Inverse outputs must remain at most −3.'],
    'inverse-units':['Units reverse roles',{title:'time (s)',text:'input to d',arrow:'d'},{title:'distance (m)',text:'input to d⁻¹'},'d⁻¹ returns time in seconds.'],
    'practical-inverse':['Measurement reversal',{title:'true output',text:'continuous',arrow:'round/noise'},{title:'reported output',text:'many-to-one'},'Practical inversion may return an interval or estimate.'],
    'composition-order':['Order matters',{title:'f∘g',text:'g then f',arrow:'not equal'},{title:'g∘f',text:'f then g'},'Intermediate values—and meanings—differ.'],
    'composition-worked':['Evaluate in order',{title:'2',text:'start',arrow:'g then f'},{title:'17',text:'(f∘g)(2)'},'Reverse order gives 27.'],
    'composition-formula':['Substitute the whole output',{title:'g(x)=2x+5',text:'inner',arrow:'into f(u)=√(u−1)'},{title:'√(2x+4)',text:'composite'},'Then impose 2x+4≥0.'],
    'composite-domain':['Composite domain',{title:'x∈Dg',text:'first condition',arrow:'and'},{title:'g(x)∈Df',text:'second condition'},'Both conditions are compulsory.']
  };

  function visualFor(id){
    if(graphFactories[id])return graphFactories[id]();
    if(flowFactories[id])return flowFactories[id]();
    if(sectionFactories[id])return sectionFactories[id]();
    if(mapSpecs[id]){const [title,left,right,bottom]=mapSpecs[id];return mapSVG(title,left,right,'',bottom,id.includes('inverse')?C.teal:C.maroon);}
    return mapSVG('Mathematical structure',{title:'input',text:'track domain',arrow:'rule'},{title:'output',text:'track range'},'','Verify the transformation or reversal independently.',C.teal);
  }

  function renderAll(root=document){
    root.querySelectorAll?.('[data-tci5-visual]:not([data-tci5-rendered])').forEach(node=>{
      const id=node.dataset.tci5Visual;node.innerHTML=visualFor(id);node.dataset.tci5Rendered='1';
    });
  }
  function init(){renderAll();const app=document.getElementById('app');if(app)new MutationObserver(()=>renderAll(app)).observe(app,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.ECHS_TCI5_GRAPHICS={renderAll,plotSVG,visualFor,visualIds:[...new Set([...Object.keys(graphFactories),...Object.keys(flowFactories),...Object.keys(sectionFactories),...Object.keys(mapSpecs)])],release:'5.0.0',purposeBuilt:true};
})();
