/* Exact data-driven plots. Separate branches preserve open endpoints and jumps. */
(function(root){
  'use strict';
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const evaluate=(coefficients,x)=>coefficients.reduce((y,a)=>y*x+a,0);
  let serial=0;
  function svg(g){
    const W=560,H=370,L=55,R=22,T=34,B=53,[x0,x1]=g.domain,[y0,y1]=g.range;
    const X=x=>L+(x-x0)/(x1-x0)*(W-L-R),Y=y=>T+(y1-y)/(y1-y0)*(H-T-B),id='checkpoint-plot-'+(++serial);
    const line=(x1,y1,x2,y2,color,width=1)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}"/>`;
    const label=(x,y,s,anchor='middle')=>`<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Arial,sans-serif" font-size="16" fill="#162d48">${esc(s)}</text>`;
    const ticks=(a,b,step)=>{const out=[];for(let v=Math.ceil(a/step)*step;v<=b+1e-9;v+=step)out.push(v);return out;};
    const yStep=y1-y0>12?Math.ceil((y1-y0)/6):1;
    let grid='';
    for(const x of ticks(x0,x1,g.step||1))grid+=line(X(x),T,X(x),H-B,'#dce4ec')+label(X(x),H-B+24,x);
    for(const y of ticks(y0,y1,yStep))grid+=line(L,Y(y),W-R,Y(y),'#dce4ec')+label(L-10,Y(y)+5,y,'end');
    const curves=g.branches.map(b=>{const points=b.points||Array.from({length:161},(_,i)=>{const x=b.domain[0]+i*(b.domain[1]-b.domain[0])/160;return[x,evaluate(b.coefficients,x)];});return `<polyline points="${points.map(([x,y])=>`${X(x).toFixed(3)},${Y(y).toFixed(3)}`).join(' ')}" fill="none" stroke="#1269a0" stroke-width="3.2"/>`;}).join('');
    const marks=g.marks.map(m=>`<circle cx="${X(m.x)}" cy="${Y(m.y)}" r="5.5" fill="${m.open?'white':'#861e42'}" stroke="${m.open?'#1269a0':'#861e42'}" stroke-width="2.2"/>`).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" class="checkpoint-graph" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="${id}-title"><title id="${id}-title">${esc(g.label)}</title><rect width="${W}" height="${H}" fill="white"/><defs><clipPath id="${id}"><rect x="${L-7}" y="${T-7}" width="${W-L-R+14}" height="${H-T-B+14}"/></clipPath></defs>${grid}<g clip-path="url(#${id})">${line(L,Y(Math.max(y0,Math.min(y1,0))),W-R,Y(Math.max(y0,Math.min(y1,0))),'#627991',1.8)}${line(X(Math.max(x0,Math.min(x1,0))),T,X(Math.max(x0,Math.min(x1,0))),H-B,'#627991',1.8)}${curves}${marks}</g>${label(L,20,g.yLabel,'start')}${label((L+W-R)/2,H-9,g.xLabel)}</svg>`;
  }
  const api={svg,evaluate};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.ECHSMidunitGraphs=api;
})(typeof window==='undefined'?globalThis:window);
