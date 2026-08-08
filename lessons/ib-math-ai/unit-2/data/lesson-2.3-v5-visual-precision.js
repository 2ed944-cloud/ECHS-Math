(function(){
'use strict';
if(String(window.LESSON_DATA?.lesson?.number)!=='2.3')return;
function exactTiCover(){
 const width=760,height=430,m={l:60,r:35,t:28,b:48},xmin=-5,xmax=7,ymin=-10,ymax=12;
 const X=x=>m.l+(x-xmin)/(xmax-xmin)*(width-m.l-m.r),Y=y=>height-m.b-(y-ymin)/(ymax-ymin)*(height-m.t-m.b);
 const curve=(fn,color)=>{let d='';for(let i=0;i<=700;i++){const x=xmin+(xmax-xmin)*i/700,y=fn(x);if(y<ymin-.5||y>ymax+.5)continue;d+=`${d?'L':'M'}${X(x).toFixed(2)} ${Y(y).toFixed(2)}`;}return `<path d="${d}" fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`;};
 let grid='';for(let i=0;i<=10;i++){const x=xmin+i*(xmax-xmin)/10,y=ymin+i*(ymax-ymin)/10;grid+=`<line x1="${X(x)}" y1="${m.t}" x2="${X(x)}" y2="${height-m.b}" stroke="#e7dfd6"/><line x1="${m.l}" y1="${Y(y)}" x2="${width-m.r}" y2="${Y(y)}" stroke="#e7dfd6"/>`;}
 return `<svg class="p23-ti-cover-exact" viewBox="0 0 ${width} ${height}" role="img" aria-label="Exact graphs of the cubic y equals 0.12 times x plus 3 times x minus 1 times x minus 5 and the line y equals 1.2x minus 1"><rect x="1" y="1" width="758" height="428" rx="28" fill="#fff" stroke="#d9d0c6"/>${grid}<line x1="${m.l}" y1="${Y(0)}" x2="${width-m.r}" y2="${Y(0)}" stroke="#17324d" stroke-width="2.5"/><line x1="${X(0)}" y1="${m.t}" x2="${X(0)}" y2="${height-m.b}" stroke="#17324d" stroke-width="2.5"/>${curve(x=>.12*(x+3)*(x-1)*(x-5),'#7a1733')}${curve(x=>1.2*x-1,'#177e89')}<text x="${X(5.2)}" y="${Y(8.8)}" fill="#7a1733" font-size="15" font-weight="900">polynomial model</text><text x="${X(4.4)}" y="${Y(5.1)}" fill="#177e89" font-size="15" font-weight="900">comparison line</text><text x="${X(-4.4)}" y="${Y(-8.4)}" fill="#5d6a75" font-size="13" font-weight="800">Use Intersect near every common point.</text></svg>`;
}
function patch(){document.querySelectorAll('[data-p23-visual="ti84-cover"]').forEach(node=>{if(node.dataset.precision==='5.0.1')return;node.dataset.precision='5.0.1';node.innerHTML=exactTiCover();});}
const app=document.getElementById('app');if(app)new MutationObserver(patch).observe(app,{childList:true,subtree:true});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',patch,{once:true});else patch();
})();
