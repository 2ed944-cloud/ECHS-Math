(function(){
'use strict';
const data=window.LESSON_DATA;
if(!data||String(data.lesson?.number)!=='2.1')return;

const COLORS={navy:'#17324d',maroon:'#8a1538',teal:'#177e89',gold:'#d4a72c',grid:'#e8e1d8',paper:'#fffdf9',green:'#1f7a4d'};
const slideByTitle=title=>data.slides.find(slide=>slide.title===title);
const replaceSlide=(title,html)=>{const slide=slideByTitle(title);if(slide)slide.html=html;};
const patchSlide=(title,from,to)=>{const slide=slideByTitle(title);if(slide&&slide.html.includes(from))slide.html=slide.html.replace(from,to);};
function sx(x,{xmin,xmax,w,p}){return p+(x-xmin)/(xmax-xmin)*(w-2*p);}
function sy(y,{ymin,ymax,h,p}){return h-p-(y-ymin)/(ymax-ymin)*(h-2*p);}
function polyline(fn,cfg,steps=180){
  const pts=[];
  for(let i=0;i<=steps;i++){
    const x=cfg.xmin+(cfg.xmax-cfg.xmin)*i/steps;
    const y=fn(x);
    if(Number.isFinite(y)&&y>=cfg.ymin-.5*(cfg.ymax-cfg.ymin)&&y<=cfg.ymax+.5*(cfg.ymax-cfg.ymin))pts.push(`${sx(x,cfg).toFixed(1)},${sy(y,cfg).toFixed(1)}`);
  }
  return pts.join(' ');
}
function axes(cfg){
  const parts=[];
  for(let i=0;i<=8;i++){
    const x=cfg.p+i*(cfg.w-2*cfg.p)/8;
    const y=cfg.p+i*(cfg.h-2*cfg.p)/8;
    parts.push(`<line x1="${x}" y1="${cfg.p}" x2="${x}" y2="${cfg.h-cfg.p}"/>`,`<line x1="${cfg.p}" y1="${y}" x2="${cfg.w-cfg.p}" y2="${y}"/>`);
  }
  const xAxis=cfg.ymin<=0&&cfg.ymax>=0?`<line class="axis" x1="${cfg.p}" y1="${sy(0,cfg)}" x2="${cfg.w-cfg.p}" y2="${sy(0,cfg)}"/>`:'';
  const yAxis=cfg.xmin<=0&&cfg.xmax>=0?`<line class="axis" x1="${sx(0,cfg)}" y1="${cfg.p}" x2="${sx(0,cfg)}" y2="${cfg.h-cfg.p}"/>`:'';
  return `<g class="math-grid">${parts.join('')}</g>${xAxis}${yAxis}`;
}
function plotCard({cfg,curves=[],points=[],guides=[],labels=[]}){
  return `<svg class="v5-math-plot" viewBox="0 0 ${cfg.w} ${cfg.h}" role="img">${axes(cfg)}${guides.join('')}${curves.map(c=>`<polyline points="${polyline(c.fn,cfg,c.steps||180)}" fill="none" stroke="${c.color}" stroke-width="${c.width||6}" stroke-linecap="round" stroke-linejoin="round"${c.dash?` stroke-dasharray="${c.dash}"`:''}/>`).join('')}${points.map(p=>`<circle cx="${sx(p.x,cfg)}" cy="${sy(p.y,cfg)}" r="${p.r||7}" fill="${p.fill||COLORS.gold}"${p.stroke?` stroke="${p.stroke}" stroke-width="3"`:''}/>`).join('')}${labels.map(l=>`<text x="${sx(l.x,cfg)}" y="${sy(l.y,cfg)}" fill="${l.fill||COLORS.navy}" font-size="${l.size||16}" font-weight="900">${l.text}</text>`).join('')}</svg>`;
}

{
  const cfg={xmin:-3,xmax:3,ymin:-3,ymax:5,w:430,h:300,p:42};
  const x0=1,yPar=3,yCirc=Math.sqrt(3);
  const left=plotCard({cfg,curves:[{fn:x=>4-x*x,color:COLORS.teal}],guides:[`<line x1="${sx(x0,cfg)}" y1="${cfg.p}" x2="${sx(x0,cfg)}" y2="${cfg.h-cfg.p}" stroke="${COLORS.gold}" stroke-width="4" stroke-dasharray="10 8"/>`],points:[{x:x0,y:yPar}],labels:[{x:-2.6,y:4.45,text:'y = 4 − x²',fill:COLORS.teal,size:15}]});
  const upper=x=>Math.sqrt(Math.max(0,4-x*x)),lower=x=>-Math.sqrt(Math.max(0,4-x*x));
  const right=plotCard({cfg,curves:[{fn:upper,color:COLORS.maroon},{fn:lower,color:COLORS.maroon}],guides:[`<line x1="${sx(x0,cfg)}" y1="${cfg.p}" x2="${sx(x0,cfg)}" y2="${cfg.h-cfg.p}" stroke="${COLORS.gold}" stroke-width="4" stroke-dasharray="10 8"/>`],points:[{x:x0,y:yCirc},{x:x0,y:-yCirc}],labels:[{x:-2.65,y:4.45,text:'x² + y² = 4',fill:COLORS.maroon,size:15}]});
  replaceSlide('The vertical-line test',`<div class="v5-compare v5-vlt-exact" data-v5-math-graph="vertical-line"><section>${left}<p class="v5-graph-verdict good"><b>At x=1:</b> one intersection, (1,3). This relation gives one y-value for that input.</p></section><section>${right}<p class="v5-graph-verdict bad"><b>At x=1:</b> two intersections, (1,±√3). The circle is not y as a function of x.</p></section></div><div class="v5-note"><b>Vertical-line test:</b> a relation is a function of x only when every vertical line meets it at most once.</div>`);
}

{
  const cfg={xmin:-2,xmax:4,ymin:-1,ymax:7,w:780,h:330,p:48};
  const f=x=>-(x-1)*(x-1)+6;
  const graph=plotCard({cfg,curves:[{fn:f,color:COLORS.maroon}],guides:[`<line x1="${sx(-2,cfg)}" y1="${sy(5,cfg)}" x2="${sx(4,cfg)}" y2="${sy(5,cfg)}" stroke="${COLORS.gold}" stroke-width="4" stroke-dasharray="10 8"/>`,`<line x1="${sx(2,cfg)}" y1="${sy(-1,cfg)}" x2="${sx(2,cfg)}" y2="${sy(5,cfg)}" stroke="${COLORS.teal}" stroke-width="4" stroke-dasharray="10 8"/>`],points:[{x:0,y:5},{x:2,y:5,fill:COLORS.teal}],labels:[{x:-1.7,y:6.55,text:'f(x)=−(x−1)²+6',fill:COLORS.maroon,size:15}]});
  replaceSlide('Read an image and preimages from a graph',`<div class="v5-graph-pair" data-v5-math-graph="image-preimage"><section><h3>Find \\(f(2)\\)</h3><p>Move vertically from \\(x=2\\) to the graph. The point is \\((2,5)\\), so \\(f(2)=5\\).</p></section><section><h3>Solve \\(f(x)=5\\)</h3><p>The horizontal line \\(y=5\\) meets the graph at \\(x=0\\) and \\(x=2\\). These are both preimages of 5.</p></section>${graph}</div>`);
}

patchSlide('TI‑84 graphing evidence','Open TI‑84 Practice Lab','Open TI‑84 Simulator');
patchSlide('Mastery and next step','TI‑84 Practice Lab','TI‑84 Simulator');

{
  const cfg={xmin:-3,xmax:3,ymin:-8,ymax:8,w:620,h:330,p:48};
  const f=x=>x*x*x-4*x-1;
  const root=2.11490754147676;
  const preview=plotCard({cfg,curves:[{fn:f,color:COLORS.navy}],points:[{x:root,y:0,fill:COLORS.gold,r:8}],labels:[{x:1.15,y:6.8,text:'positive zero ≈ 2.115',fill:COLORS.maroon,size:16}]});
  replaceSlide('TI‑84 Zero workflow',`<div class="v5-ti-workflow precision-ti84" data-v5-math-graph="ti84-zero"><section><h3>Question</h3><p>Find the positive zero of \\(Y_1=x^3-4x-1\\) to three decimal places.</p><div class="v5-ti-steps"><kbd>Y=</kbd><i>→</i><kbd>GRAPH</kbd><i>→</i><kbd>2nd</kbd><kbd>TRACE</kbd><i>→</i><b>2:zero</b><i>→</i><span>left bound</span><i>→</i><span>right bound</span><i>→</i><span>guess</span></div><p><b>Expected result:</b> \\(x\\approx2.115\\). Verify by substitution into the original function.</p><button class="v5-ti84-open" type="button" data-open-ti84>Open the TI‑84 Simulator</button></section><section class="v5-plot-card"><span>MATHEMATICAL PREVIEW · NOT A MOCK CALCULATOR SCREEN</span>${preview}</section></div>`);
}
{
  const cfg={xmin:-1,xmax:7,ymin:-6,ymax:12,w:620,h:330,p:48};
  const f=x=>x*x-4*x+1,g=x=>2*x-3;
  const x1=3-Math.sqrt(5),x2=3+Math.sqrt(5),y1=2*x1-3,y2=2*x2-3;
  const preview=plotCard({cfg,curves:[{fn:f,color:COLORS.maroon},{fn:g,color:COLORS.teal,dash:'10 7',width:5}],points:[{x:x1,y:y1,fill:COLORS.gold,r:8},{x:x2,y:y2,fill:COLORS.gold,r:8}],labels:[{x:-.65,y:10.8,text:'Y1=x²−4x+1',fill:COLORS.maroon,size:14},{x:3.9,y:10.8,text:'Y2=2x−3',fill:COLORS.teal,size:14}]});
  replaceSlide('TI‑84 Intersect workflow',`<div class="v5-ti-workflow precision-ti84" data-v5-math-graph="ti84-intersect"><section><h3>Question</h3><p>Solve \\(x^2-4x+1=2x-3\\).</p><div class="v5-ti-steps"><kbd>Y=</kbd><i>→</i><span>enter Y1 and Y2</span><i>→</i><kbd>GRAPH</kbd><i>→</i><kbd>2nd</kbd><kbd>TRACE</kbd><i>→</i><b>5:intersect</b></div><p>Run Intersect near <b>both</b> crossings.</p><p><b>Expected x-values:</b> \\(x=3\\pm\\sqrt5\\approx0.764,5.236\\).</p><button class="v5-ti84-open" type="button" data-open-ti84>Open the TI‑84 Simulator</button></section><section class="v5-plot-card"><span>EXACT GRAPH PREVIEW</span>${preview}</section></div>`);
}
replaceSlide('TABLE and TBLSET for discrete evidence',`<div class="v5-ti-slide precision-ti84"><section><h3>Use TABLE for a discrete threshold</h3><p>For \\(A(n)=18(1.12)^n\\), use \\(\\Delta\\text{Tbl}=1\\) so every permitted integer is checked.</p><div class="v5-ti-steps"><kbd>Y=</kbd><i>→</i><kbd>2nd</kbd><kbd>WINDOW</kbd><i>→</i><span>TblStart=7</span><i>→</i><span>ΔTbl=1</span><i>→</i><kbd>2nd</kbd><kbd>GRAPH</kbd></div><button class="v5-ti84-open" type="button" data-open-ti84>Open the TI‑84 Simulator</button></section><section class="v5-plot-card"><span>CHECK THE ADJACENT INTEGER VALUES</span><table class="v5-table v5-precision-table"><tr><th>n</th><th>A(n)</th><th>Compare with 50</th></tr><tr><td>8</td><td>44.567</td><td>&lt; 50</td></tr><tr><td>9</td><td>49.915</td><td>&lt; 50</td></tr><tr><td>10</td><td>55.905</td><td>&gt; 50</td></tr></table><p>Therefore the first whole number satisfying \\(A(n)&gt;50\\) is \\(n=10\\).</p></section></div>`);
replaceSlide('Enter functions in Y=',`<div class="v5-ti-slide precision-ti84"><section class="v5-plot-card"><span>ENTER THE MODEL, NOT A PICTURE OF IT</span><h3>Example</h3><div class="v5-mathbox"><span>Y1</span><div>\\[Y_1=-0.5(X-6)^2+24\\]</div></div><div class="v5-mathbox"><span>Y2</span><div>\\[Y_2=20\\]</div></div></section><section><div class="v5-ti-steps"><kbd>Y=</kbd><i>→</i><span>enter \\(Y_1\\)</span><i>→</i><span>enter \\(Y_2\\)</span><i>→</i><kbd>GRAPH</kbd></div><ul><li>Use parentheses around translated inputs.</li><li>Clear or turn off old functions.</li><li>Check that each equals sign is active.</li></ul><button class="v5-ti84-open" type="button" data-open-ti84>Open the TI‑84 Simulator</button></section></div>`);

{
  const cfg={xmin:0,xmax:9,ymin:0,ymax:9,w:760,h:430,p:56};
  const f=x=>x<=3?x*x:NaN,inv=x=>Math.sqrt(x),diag=x=>x;
  const preview=plotCard({cfg,curves:[{fn:f,color:COLORS.maroon,width:7},{fn:inv,color:COLORS.teal,width:7},{fn:diag,color:COLORS.gold,width:4,dash:'12 9'}],points:[{x:2,y:4,fill:COLORS.maroon,r:8},{x:4,y:2,fill:COLORS.teal,r:8}],labels:[{x:1.0,y:7.7,text:'f(x)=x², 0≤x≤3',fill:COLORS.maroon,size:15},{x:4.2,y:3.2,text:'f⁻¹(x)=√x',fill:COLORS.teal,size:15},{x:6.7,y:7.45,text:'y=x',fill:'#9a7317',size:16}]});
  replaceSlide('Graphs reflect in y=x',`<div class="v5-inverse-exact" data-v5-math-graph="inverse-reflection">${preview}<div class="v5-note"><b>Coordinate check:</b> the point \\((2,4)\\) on \\(f\\) reflects to \\((4,2)\\) on \\(f^{-1}\\). Reflection in \\(y=x\\) swaps every coordinate pair.</div></div>`);
}

data.precisionRepair={release:'5.1.0',exactGraphSlides:['The vertical-line test','Read an image and preimages from a graph','TI‑84 Zero workflow','TI‑84 Intersect workflow','Graphs reflect in y=x'],sharedTi84Simulator:true};
})();
