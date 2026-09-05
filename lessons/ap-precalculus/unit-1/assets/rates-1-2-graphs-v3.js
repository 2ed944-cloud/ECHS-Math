(function(root){
  'use strict';
  const M=root.RatesModels,esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));let serial=0;
  function plot({title='Function graph',bounds=[-4,4,-3,5],xLabel='input x',yLabel='output f(x)',curves=[],points=[],horizontal=null,vertical=null,shade=null,stepX=1,stepY=1}={}){
    const id='rates-clip-'+(++serial),[xmin,xmax,ymin,ymax]=bounds,w=640,h=370,left=64,right=24,top=38,bottom=58;
    const sx=x=>left+(x-xmin)/(xmax-xmin)*(w-left-right),sy=y=>h-bottom-(y-ymin)/(ymax-ymin)*(h-top-bottom);
    let out='<svg class="graph rates-graph" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="'+esc(title)+'"><title>'+esc(title)+'</title><defs><clipPath id="'+id+'"><rect x="'+left+'" y="'+top+'" width="'+(w-left-right)+'" height="'+(h-top-bottom)+'"/></clipPath></defs>';
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
  function lineThrough(fn,a,b){return {points:[[a,fn(a)],[b,fn(b)]],color:'#a26714',dashed:true};}
  function graph(key){
    if(key==='reader')return plot({title:'Complete piecewise-linear graph of f',bounds:[-2,6,-4,6],curves:[{points:M.reader}],points:M.reader.map(([x,y])=>({x,y,label:'('+x+', '+y+')'}))});
    if(key==='tank')return plot({title:'Selected tank measurements and a constant-rate comparison from minute 0 to minute 5',bounds:[0,8,650,950],stepY:50,xLabel:'time t (min)',yLabel:'water V(t) (L)',curves:[{points:[[0,720],[5,910]],color:'#a26714',dashed:true}],points:M.tank.map(([x,y])=>({x,y,label:'('+x+', '+y+')'}))});
    if(key==='secant')return plot({title:'q(x) = x² − 3x + 2 and the straight comparison from x = 1 to x = 4',bounds:[-1,5,-2,14],stepY:2,curves:[{fn:M.functions.quadratic.fn},lineThrough(M.functions.quadratic.fn,1,4)],points:[1,4].map(x=>({x,y:M.functions.quadratic.fn(x),label:'('+x+', '+M.functions.quadratic.fn(x)+')'})),yLabel:'q(x)'});
    if(key==='shared')return plot({title:'Different functions with the same endpoints and average rate on [0,4]',bounds:[0,4,0,16],stepY:2,curves:[{fn:x=>M.shared('line',x)},{fn:x=>M.shared('curve',x),color:'#a26714',dashed:true}],points:[{x:0,y:1,label:'(0,1)'},{x:4,y:9,label:'(4,9)'}]});
    if(key==='corner')return plot({title:'A corner at (2,1); the left side falls and the right side rises',bounds:[0,4,0,4],curves:[{points:[[0,3],[2,1],[4,3]]}],points:[{x:2,y:1,label:'(2,1)'}]});
    if(key==='jump')return plot({title:'j(x) = x for x below 2, and x + 4 for x at least 2, on [0,4]',bounds:[0,4,0,9],curves:[{points:[[0,0],[2,2]]},{points:[[2,6],[4,8]],color:'#315d8f'}],points:[{x:0,y:0},{x:2,y:2,open:true,label:'open (2,2)'},{x:2,y:6,label:'(2,6)'},{x:4,y:8,label:'(4,8)'}],yLabel:'j(x)'});
    if(key==='rate-sign-options'){
      const functions=[x=>-5+x,x=>8-x,x=>2+x*(4-x),x=>-1-x];
      return '<div class="graph-options">'+functions.map((fn,i)=>'<figure><figcaption>Graph '+String.fromCharCode(65+i)+'</figcaption>'+plot({title:'Graph '+String.fromCharCode(65+i)+' on [0,4]',bounds:[0,4,-6,10],stepY:2,curves:[{fn}],points:[0,4].map(x=>({x,y:fn(x)}))})+'</figure>').join('')+'</div>';
    }
    return '';
  }
  function render(scope=document){scope.querySelectorAll('[data-rates-plot]:not([data-plot-ready])').forEach(el=>{el.innerHTML=graph(el.dataset.ratesPlot);el.dataset.plotReady='true';});}
  root.RatesGraphs={plot,graph,render,lineThrough};
})(window);
