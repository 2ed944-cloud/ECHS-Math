(function(){
  'use strict';
  if(String(window.LESSON_DATA?.lesson?.number)!=='2.2')return;
  const C={navy:'#17324d',maroon:'#7a1733',teal:'#177e89',gold:'#d4a72c',grid:'#e6ded5',muted:'#5d6a75'};
  function exactGraph({xmin,xmax,ymin,ymax,curves,points,labels,label}){
    const w=720,h=420,m={l:58,r:28,t:28,b:48};const X=x=>m.l+(x-xmin)/(xmax-xmin)*(w-m.l-m.r);const Y=y=>h-m.b-(y-ymin)/(ymax-ymin)*(h-m.t-m.b);
    let grid='';for(let x=Math.ceil(xmin);x<=xmax;x+=1)grid+=`<line x1="${X(x)}" y1="${m.t}" x2="${X(x)}" y2="${h-m.b}" stroke="${C.grid}"/>`;for(let y=Math.ceil(ymin/2)*2;y<=ymax;y+=2)grid+=`<line x1="${m.l}" y1="${Y(y)}" x2="${w-m.r}" y2="${Y(y)}" stroke="${C.grid}"/>`;
    let paths='';curves.forEach(curve=>{let d='';for(let i=0;i<=260;i++){const x=xmin+(xmax-xmin)*i/260,y=curve.fn(x);d+=`${i?'L':'M'}${X(x).toFixed(2)} ${Y(y).toFixed(2)} `;}paths+=`<path d="${d}" fill="none" stroke="${curve.color}" stroke-width="7" stroke-linecap="round"/>`;});
    let extras='';points.forEach(p=>extras+=`<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="9" fill="${C.gold}" stroke="#fff" stroke-width="4"/><text x="${X(p.x)+10}" y="${Y(p.y)-12}" fill="${C.navy}" font-size="14" font-weight="850">${p.label}</text>`);labels.forEach(t=>extras+=`<text x="${X(t.x)}" y="${Y(t.y)}" fill="${t.color}" font-size="15" font-weight="900">${t.text}</text>`);
    return `<svg viewBox="0 0 720 420" role="img" aria-label="${label}"><rect x="1" y="1" width="718" height="418" rx="25" fill="#fff" stroke="#d8d0c7"/>${grid}${xmin<=0&&xmax>=0?`<line x1="${X(0)}" y1="${m.t}" x2="${X(0)}" y2="${h-m.b}" stroke="${C.navy}" stroke-width="3"/>`:''}${ymin<=0&&ymax>=0?`<line x1="${m.l}" y1="${Y(0)}" x2="${w-m.r}" y2="${Y(0)}" stroke="${C.navy}" stroke-width="3"/>`:''}${paths}${extras}</svg>`;
  }
  const cover=()=>{const x=6.32474432449077,y=1.5*x+1;return exactGraph({xmin:-2,xmax:10,ymin:-5,ymax:20,curves:[{fn:x=>1.5*x+1,color:C.teal},{fn:x=>-.65*(x-4)**2+14,color:C.maroon}],points:[{x,y,label:'intersection'}],labels:[{x:7.2,y:13.3,text:'constant rate',color:C.teal},{x:2.3,y:15.2,text:'changing rate',color:C.maroon}],label:'A line and a parabola with an accurately plotted intersection'});};
  const lines=()=>{const x=5/1.7,y=.8*x+2;return exactGraph({xmin:-5,xmax:8,ymin:-6,ymax:12,curves:[{fn:x=>.8*x+2,color:C.teal},{fn:x=>-.9*x+7,color:C.maroon}],points:[{x,y,label:'common point'}],labels:[],label:'Two lines with an accurately plotted common point'});};
  function patch(){document.querySelectorAll('[data-lq5-visual="cover-models"]').forEach(node=>{node.innerHTML=cover();node.dataset.precision='5.0.1';});document.querySelectorAll('[data-lq5-visual="section-lines"]').forEach(node=>{node.innerHTML=lines();node.dataset.precision='5.0.1';});}
  const app=document.getElementById('app');if(app)new MutationObserver(patch).observe(app,{childList:true,subtree:true});patch();
})();
