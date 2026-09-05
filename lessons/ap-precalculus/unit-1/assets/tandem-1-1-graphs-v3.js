(function(root){
  'use strict';
  const M=root.TandemModels,esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));let serial=0;
  function plot({title='Function graph',bounds=[-4,4,-3,5],xLabel='input x',yLabel='output f(x)',curves=[],points=[],horizontal=null,vertical=null,shade=null,stepX=1,stepY=1}={}){
    const id='tandem-clip-'+(++serial),[xmin,xmax,ymin,ymax]=bounds,w=640,h=370,left=64,right=24,top=38,bottom=58;
    const sx=x=>left+(x-xmin)/(xmax-xmin)*(w-left-right),sy=y=>h-bottom-(y-ymin)/(ymax-ymin)*(h-top-bottom);
    let out='<svg class="graph tandem-graph" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="'+esc(title)+'"><title>'+esc(title)+'</title><defs><clipPath id="'+id+'"><rect x="'+left+'" y="'+top+'" width="'+(w-left-right)+'" height="'+(h-top-bottom)+'"/></clipPath></defs>';
    if(shade)out+='<rect x="'+sx(shade[0])+'" y="'+top+'" width="'+(sx(shade[1])-sx(shade[0]))+'" height="'+(h-top-bottom)+'" fill="#f8e8c4"/>';
    for(let i=Math.ceil(xmin/stepX);i<=Math.floor(xmax/stepX);i++){const x=i*stepX;out+='<line class="gridline" x1="'+sx(x)+'" x2="'+sx(x)+'" y1="'+top+'" y2="'+(h-bottom)+'"/><text class="tick" x="'+sx(x)+'" y="'+(h-bottom+23)+'" text-anchor="middle">'+M.format(x)+'</text>';}
    for(let i=Math.ceil(ymin/stepY);i<=Math.floor(ymax/stepY);i++){const y=i*stepY;out+='<line class="gridline" x1="'+left+'" x2="'+(w-right)+'" y1="'+sy(y)+'" y2="'+sy(y)+'"/><text class="tick" x="'+(left-10)+'" y="'+(sy(y)+5)+'" text-anchor="end">'+M.format(y)+'</text>';}
    const xAxis=Math.max(ymin,Math.min(ymax,0)),yAxis=Math.max(xmin,Math.min(xmax,0));
    out+='<line class="axis" x1="'+left+'" x2="'+(w-right)+'" y1="'+sy(xAxis)+'" y2="'+sy(xAxis)+'"/><line class="axis" x1="'+sx(yAxis)+'" x2="'+sx(yAxis)+'" y1="'+top+'" y2="'+(h-bottom)+'"/><text class="axis-label" x="'+left+'" y="20">'+esc(yLabel)+'</text><text class="axis-label" x="'+(w-right)+'" y="'+(h-12)+'" text-anchor="end">'+esc(xLabel)+'</text><g clip-path="url(#'+id+')">';
    if(horizontal!==null)out+='<line class="trace-guide" x1="'+left+'" x2="'+(w-right)+'" y1="'+sy(horizontal)+'" y2="'+sy(horizontal)+'"/>';
    if(vertical!==null)out+='<line class="trace-guide" x1="'+sx(vertical)+'" x2="'+sx(vertical)+'" y1="'+top+'" y2="'+(h-bottom)+'"/>';
    for(const [i,c] of curves.entries()){
      const samples=c.points||Array.from({length:241},(_,j)=>{const x=(c.from??xmin)+j*((c.to??xmax)-(c.from??xmin))/240;return[x,c.fn(x)];});
      let d='',started=false;
      for(const [x,y] of samples){if(y===null||!Number.isFinite(y)){started=false;continue;}d+=(started?'L':'M')+sx(x).toFixed(3)+' '+sy(y).toFixed(3)+' ';started=true;}
      out+='<path class="curve" d="'+d+'" fill="none" stroke="'+(c.color||(i?'#a26714':'#315d8f'))+'" style="stroke:'+(c.color||(i?'#a26714':'#315d8f'))+'" stroke-width="3.5"'+(c.dashed?' stroke-dasharray="8 5"':'')+'/>';
    }
    for(const p of points)out+='<circle class="'+(p.selected?'moving-point':'data-point')+'" cx="'+sx(p.x)+'" cy="'+sy(p.y)+'" r="'+(p.selected?7:5)+'" fill="'+(p.open?'white':p.color||'#08796e')+'" stroke="'+(p.color||'#08796e')+'" stroke-width="2"/>';
    out+='</g>';
    for(const p of points.filter(p=>p.label))out+='<text class="point-label" x="'+Math.min(w-right-55,Math.max(left+4,sx(p.x)+8))+'" y="'+Math.max(top+17,Math.min(h-bottom-6,sy(p.y)-10))+'">'+esc(p.label)+'</text>';
    return out+'</svg>';
  }
  function graph(key){
    if(key==='reader')return plot({title:'Complete piecewise-linear graph of f on −4 ≤ x ≤ 4',curves:[{points:M.reader}],points:M.reader.map(([x,y])=>({x,y,label:'('+x+', '+y+')'}))});
    if(key==='wave')return plot({title:'Complete graph of w on −3 ≤ x ≤ 3; a horizontal line at output 4',bounds:[-3.5,3.5,-1,5],curves:[{points:M.wave}],horizontal:4,points:M.wave.map(([x,y])=>({x,y}))});
    if(key==='reservoir')return plot({title:'Water volume rises, remains constant and then falls',bounds:[0,8,0,40],xLabel:'time t (min)',yLabel:'volume V(t) (L)',stepY:10,curves:[{fn:M.reservoir}],points:[0,3,5,8].map(x=>({x,y:M.reservoir(x)}))});
    if(key==='evidence')return plot({title:'Two different functions pass through the same four sampled points',bounds:[0,3,-2,10],stepY:2,curves:[{fn:x=>x*x},{points:M.evidence,color:'#a26714',dashed:true}],points:[0,1,2,3].map(x=>({x,y:x*x})),xLabel:'input x',yLabel:'output'});
    if(key==='end-counter')return plot({title:'A function begins at (0,1), ends at (6,9), and decreases between x = 2 and x = 4',bounds:[0,6,0,10],stepY:2,curves:[{points:M.endCounter}],points:M.endCounter.map(([x,y])=>({x,y,label:'('+x+', '+y+')'}))});
    if(key==='constraints')return plot({title:'One function satisfying zeros, direction and concavity constraints',bounds:[-2,6,-1,5],curves:[{fn:M.constrained}],horizontal:3,points:[-2,-1,0,1,4,6].map(x=>({x,y:M.constrained(x)}))});
    if(key==='polynomial')return plot({title:'Calculator graph of p(x) = 0.08(x + 4)(x − 1)(x − 5)',bounds:[-5,6,-6,6],stepY:2,curves:[{fn:M.polynomial}],points:[-4,1,5].map(x=>({x,y:0})),yLabel:'p(x)'});
    if(key==='four-negative')return '<div class="graph-options">'+Object.entries(M.shapes).map(([k,s],i)=>'<figure><figcaption>Graph '+String.fromCharCode(65+i)+'</figcaption>'+plot({title:'Graph '+String.fromCharCode(65+i),bounds:[0,4,-10,0],stepY:2,curves:[{fn:x=>s.fn(x)-10}],yLabel:'f(x)'})+'</figure>').join('')+'</div>';
    if(key==='story-options'){
      const configs=[['inc-linear','constant','dec-linear'],['inc-linear','dec-linear','constant'],['dec-linear','constant','inc-linear'],['inc-linear','inc-linear','inc-linear']];
      return '<div class="graph-options">'+configs.map((keys,i)=>'<figure><figcaption>Graph '+String.fromCharCode(65+i)+'</figcaption>'+plot({title:'Water graph '+String.fromCharCode(65+i),bounds:[0,6,0,220],stepY:40,curves:[{fn:x=>60+M.storyValue(keys,x,'heating')}],xLabel:'time (min)',yLabel:'water (L)'})+'</figure>').join('')+'</div>';
    }
    return '';
  }
  function render(scope=document){scope.querySelectorAll('[data-tandem-plot]:not([data-plot-ready])').forEach(el=>{el.innerHTML=graph(el.dataset.tandemPlot);el.dataset.plotReady='true';});}
  root.TandemGraphs={plot,graph,render};
})(window);
