(function(){
  'use strict';
  if(String(window.LESSON_DATA?.lesson?.number)!=='2.2')return;

  const C={navy:'#17324d',maroon:'#7a1733',teal:'#177e89',gold:'#d4a72c',grid:'#e6ded5',muted:'#5d6a75'};

  function gradientTriangle(){
    const width=720,height=420;
    const margin={left:68,right:55,top:34,bottom:55};
    const xmin=0,xmax=10,ymin=0,ymax=14;
    const X=x=>margin.left+(x-xmin)/(xmax-xmin)*(width-margin.left-margin.right);
    const Y=y=>height-margin.bottom-(y-ymin)/(ymax-ymin)*(height-margin.top-margin.bottom);
    const p1={x:2,y:3.5};
    const p2={x:8,y:11};
    const midX=(X(p1.x)+X(p2.x))/2;
    const midY=(Y(p1.y)+Y(p2.y))/2;
    let grid='';
    for(let x=0;x<=10;x+=1)grid+=`<line x1="${X(x)}" y1="${margin.top}" x2="${X(x)}" y2="${height-margin.bottom}" stroke="${C.grid}"/>`;
    for(let y=0;y<=14;y+=2)grid+=`<line x1="${margin.left}" y1="${Y(y)}" x2="${width-margin.right}" y2="${Y(y)}" stroke="${C.grid}"/>`;
    return `<svg class="lq5-gradient-precise" viewBox="0 0 ${width} ${height}" role="img" aria-label="Gradient triangle from the point 2 comma 3.5 to the point 8 comma 11, showing change in input 6 and change in output 7.5">
      <rect x="1" y="1" width="718" height="418" rx="26" fill="#fff" stroke="#d8d0c7"/>
      ${grid}
      <line x1="${margin.left}" y1="${Y(0)}" x2="${width-margin.right}" y2="${Y(0)}" stroke="${C.navy}" stroke-width="3"/>
      <line x1="${X(0)}" y1="${height-margin.bottom}" x2="${X(0)}" y2="${margin.top}" stroke="${C.navy}" stroke-width="3"/>
      <line x1="${X(0.7)}" y1="${Y(1.875)}" x2="${X(9.2)}" y2="${Y(12.5)}" stroke="${C.maroon}" stroke-width="7" stroke-linecap="round"/>
      <line x1="${X(p1.x)}" y1="${Y(p1.y)}" x2="${X(p2.x)}" y2="${Y(p1.y)}" stroke="${C.gold}" stroke-width="5" stroke-dasharray="11 8"/>
      <line x1="${X(p2.x)}" y1="${Y(p1.y)}" x2="${X(p2.x)}" y2="${Y(p2.y)}" stroke="${C.gold}" stroke-width="5" stroke-dasharray="11 8"/>
      <circle cx="${X(p1.x)}" cy="${Y(p1.y)}" r="9" fill="${C.teal}" stroke="#fff" stroke-width="4"/>
      <circle cx="${X(p2.x)}" cy="${Y(p2.y)}" r="9" fill="${C.teal}" stroke="#fff" stroke-width="4"/>
      <text x="${midX}" y="${Y(p1.y)+34}" text-anchor="middle" fill="${C.navy}" font-size="15" font-weight="900">change in input = 6</text>
      <text x="${X(p2.x)+34}" y="${midY}" text-anchor="middle" fill="${C.navy}" font-size="15" font-weight="900" transform="rotate(-90 ${X(p2.x)+34} ${midY})">change in output = 7.5</text>
      <text x="${X(p1.x)-10}" y="${Y(p1.y)-16}" text-anchor="end" fill="${C.muted}" font-size="13" font-weight="800">(2, 3.5)</text>
      <text x="${X(p2.x)+12}" y="${Y(p2.y)-14}" fill="${C.muted}" font-size="13" font-weight="800">(8, 11)</text>
    </svg>`;
  }

  function patch(){
    document.querySelectorAll('[data-lq5-visual="gradient-triangle"]').forEach(node=>{
      if(node.dataset.polished==='5.0.2')return;
      node.dataset.polished='5.0.2';
      node.innerHTML=gradientTriangle();
    });
  }

  const app=document.getElementById('app');
  if(app)new MutationObserver(patch).observe(app,{childList:true,subtree:true});
  patch();
})();
