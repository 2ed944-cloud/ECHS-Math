/* Exact models for the original Topic 1.1 context investigations. No calculus prerequisites. */
(function(root){
  'use strict';
  function car(t,{radius=3,period=10,gap=0,start='near'}={}){
    const angle=2*Math.PI*t/period+(start==='far'?Math.PI:0);
    return {distance:gap+radius*(1-Math.cos(angle)),angle,x:radius*Math.cos(angle),y:radius*Math.sin(angle)};
  }
  function projectile(t,{a=4.9,v=6.2,h=18}={}){return -a*t*t+v*t+h;}
  function flight({a=4.9,v=6.2,h=18}={}){
    const peakTime=Math.max(0,v/(2*a)),impact=(v+Math.sqrt(v*v+4*a*h))/(2*a);
    return {peakTime,peakHeight:projectile(peakTime,{a,v,h}),impact,fallTime:impact-peakTime};
  }
  function cubic(x,{center=1,width=2,sign=-1,scale=3,shift=5}={}){const u=x-center;return sign*(u*u*u-3*width*width*u)/scale+shift;}
  const vessels={
    neck:{title:'Narrowing body, straight narrow neck',segments:[[0,8,100,16],[8,12,16,16]]},
    widening:{title:'Widening body, straight wide neck',segments:[[0,8,16,100],[8,12,100,100]]},
    cylinder:{title:'Constant cross-sectional area',segments:[[0,12,49,49]]},
    hourglass:{title:'Narrows, then widens',segments:[[0,6,81,16],[6,12,16,81]]},
    bulb:{title:'Widens, then narrows to a neck',segments:[[0,4,25,100],[4,9,100,16],[9,12,16,16]]}
  };
  function area(key,h){const s=vessels[key].segments.find(s=>h<=s[1]+1e-9)||vessels[key].segments.at(-1);return s[2]+(s[3]-s[2])*(h-s[0])/(s[1]-s[0]);}
  function volume(key,h=12){let total=0;for(const [lo,hi,a,b] of vessels[key].segments){const z=Math.max(0,Math.min(h,hi)-lo);total+=a*z+(b-a)*z*z/(2*(hi-lo));}return total;}
  function waterHeight(key,t,flow=30){let remaining=Math.max(0,Math.min(volume(key),flow*t));for(const [lo,hi,a,b] of vessels[key].segments){const k=(b-a)/(hi-lo),capacity=(a+b)*(hi-lo)/2;if(remaining<=capacity+1e-9){const z=Math.abs(k)<1e-10?remaining/a:2*remaining/(a+Math.sqrt(Math.max(0,a*a+2*k*remaining)));return Math.min(hi,lo+z);}remaining-=capacity;}return 12;}
  const api={car,projectile,flight,cubic,vessels,area,volume,waterHeight};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.TandemContexts=api;

  /*
   * Forum upgrade for the Topic 1.1 vessel investigation.
   * Four reconstructed vessel silhouettes mirror the A–D choices used in the
   * presenter-supplied AP Classroom prompt, without reproducing the prompt text.
   * The selected vessel fills while a synchronized depth–time trace is drawn.
   */
  if(typeof window==='undefined' || typeof document==='undefined') return;

  const AP_H=12;
  const AP_VESSELS={
    A:{label:'A',title:'Narrows, then widens',points:[[0,2.15],[1.4,1.95],[4.8,1.02],[6.1,.82],[8.4,1.12],[10.7,1.86],[12,2.12]]},
    B:{label:'B',title:'Wide body narrowing to a straight neck',points:[[0,2.35],[1.5,2.25],[4.5,1.78],[7.5,1.05],[8.6,.76],[12,.76]]},
    C:{label:'C',title:'Rounded bulb with a narrow neck',points:[[0,1.18],[1.1,1.35],[2.8,2.15],[5.2,2.62],[7.2,2.35],[9.0,1.48],[10.1,.82],[11.7,.88],[12,1.05]]},
    D:{label:'D',title:'Broad shoulders tapering to a neck',points:[[0,1.55],[1.2,1.62],[3.2,2.15],[5.2,2.72],[6.7,2.55],[8.3,1.55],[9.2,.88],[12,.82]]}
  };
  const apRadius=(key,h)=>{
    const pts=AP_VESSELS[key].points;
    h=Math.max(0,Math.min(AP_H,h));
    for(let i=0;i<pts.length-1;i++){
      const [h0,r0]=pts[i],[h1,r1]=pts[i+1];
      if(h<=h1+1e-9){const u=(h-h0)/(h1-h0);return r0+(r1-r0)*u;}
    }
    return pts.at(-1)[1];
  };
  const AP_N=1200,AP_DH=AP_H/AP_N,AP_TABLE={};
  Object.keys(AP_VESSELS).forEach(key=>{
    const cum=[0];
    for(let i=1;i<=AP_N;i++){
      const h0=(i-1)*AP_DH,h1=i*AP_DH;
      const a0=Math.PI*apRadius(key,h0)**2,a1=Math.PI*apRadius(key,h1)**2;
      cum[i]=cum[i-1]+(a0+a1)*AP_DH/2;
    }
    AP_TABLE[key]=cum;
  });
  const apCapacity=key=>AP_TABLE[key][AP_N];
  const apHeightAtVolume=(key,v)=>{
    const c=AP_TABLE[key];v=Math.max(0,Math.min(c[AP_N],v));
    let lo=0,hi=AP_N;
    while(hi-lo>1){const m=(lo+hi)>>1;if(c[m]<=v)lo=m;else hi=m;}
    const den=c[hi]-c[lo]||1,u=(v-c[lo])/den;
    return (lo+u)*AP_DH;
  };
  const apHeight=(key,t,flow)=>apHeightAtVolume(key,Math.max(0,flow*t));

  function injectStyle(){
    if(document.getElementById('ap-vessel-forum-style'))return;
    const st=document.createElement('style');st.id='ap-vessel-forum-style';st.textContent=`
      .apv-shell{display:grid;gap:16px}.apv-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap}
      .apv-head h3{margin:0;color:#173a5e;font-size:clamp(1.25rem,2vw,1.75rem)}.apv-head p{margin:.35rem 0 0;color:#58697f}
      .apv-choice-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.apv-choice{border:1px solid #cfd7e2;background:#fff;border-radius:14px;padding:9px;min-height:122px;color:#173a5e;transition:.16s}
      .apv-choice[aria-pressed="true"]{border:2px solid #8a2346;box-shadow:0 0 0 3px #8a23461c;background:#fff9fb}.apv-choice b{display:block;font-size:1.05rem;margin-bottom:4px}.apv-choice small{display:block;line-height:1.25;color:#5f6e81}
      .apv-choice svg{width:100%;height:82px}.apv-main{display:grid;grid-template-columns:minmax(250px,.72fr) minmax(360px,1.28fr);gap:18px;align-items:stretch}.apv-card{border:1px solid #dbe2ea;background:#fff;border-radius:16px;padding:14px;box-shadow:0 10px 30px #1c35560a}
      .apv-vessel-wrap{min-height:360px;display:grid;place-items:center}.apv-vessel-svg{width:100%;height:350px}.apv-graph-svg{width:100%;height:350px}.apv-label{font-weight:700;color:#173a5e}.apv-readout{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px}.apv-stat{background:#f5f7fa;border-radius:10px;padding:9px 10px}.apv-stat span{display:block;font-size:.72rem;text-transform:uppercase;letter-spacing:.05em;color:#718095}.apv-stat b{display:block;margin-top:3px;color:#173a5e}
      .apv-controls{display:flex;align-items:flex-end;gap:10px;flex-wrap:wrap}.apv-controls button{border:1px solid #8a2346;background:#8a2346;color:#fff;border-radius:9px;padding:10px 16px;font-weight:700}.apv-controls button.secondary{background:#fff;color:#8a2346}.apv-controls label{min-width:180px;flex:1;font-size:.8rem;color:#52647c}.apv-controls input[type=range]{width:100%;accent-color:#8a2346}.apv-check{display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap;background:#f7f1f4;border-left:4px solid #8a2346;padding:12px 14px;border-radius:10px}.apv-check strong{color:#8a2346}.apv-answer{padding:10px 12px;background:#eef8f4;border:1px solid #b9e0d0;border-radius:10px;color:#205f4e}.apv-answer[hidden]{display:none}.apv-compare-note{font-size:.82rem;color:#66758a;margin:3px 0 0}.apv-legend{display:flex;gap:12px;flex-wrap:wrap;font-size:.78rem;color:#58697f;margin-top:5px}.apv-legend span::before{content:'';display:inline-block;width:16px;height:3px;background:var(--sw);vertical-align:middle;margin-right:5px;border-radius:3px}
      @media(max-width:850px){.apv-main{grid-template-columns:1fr}.apv-choice-grid{grid-template-columns:repeat(2,1fr)}}
    `;document.head.appendChild(st);
  }
  function radiusPath(key,cx,base,scaleY,scaleX){
    const left=[],right=[];
    for(let i=0;i<=120;i++){const h=AP_H*i/120,r=apRadius(key,h);left.push([cx-r*scaleX,base-h*scaleY]);}
    for(let i=120;i>=0;i--){const h=AP_H*i/120,r=apRadius(key,h);right.push([cx+r*scaleX,base-h*scaleY]);}
    const pts=left.concat(right);return pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(2)+' '+p[1].toFixed(2)).join(' ')+' Z';
  }
  function miniShape(key){
    const d=radiusPath(key,50,82,6.0,11.2);
    return `<svg viewBox="0 0 100 90" aria-hidden="true"><path d="${d}" fill="#f5f7fa" stroke="#52647c" stroke-width="2"/></svg>`;
  }
  function graphAxes(x,y,w,h,tMax){
    let s='';for(let i=0;i<=4;i++){const py=y+h-h*i/4;s+=`<line x1="${x}" y1="${py}" x2="${x+w}" y2="${py}" stroke="#e2e7ed"/><text x="${x-8}" y="${py+4}" text-anchor="end" font-size="11" fill="#62738a">${(AP_H*i/4).toFixed(0)}</text>`;}
    for(let i=0;i<=4;i++){const px=x+w*i/4;s+=`<line x1="${px}" y1="${y}" x2="${px}" y2="${y+h}" stroke="#eef1f4"/><text x="${px}" y="${y+h+18}" text-anchor="middle" font-size="11" fill="#62738a">${(tMax*i/4).toFixed(1)}</text>`;}
    s+=`<line x1="${x}" y1="${y+h}" x2="${x+w}" y2="${y+h}" stroke="#173a5e" stroke-width="1.5"/><line x1="${x}" y1="${y}" x2="${x}" y2="${y+h}" stroke="#173a5e" stroke-width="1.5"/><text x="${x+w/2}" y="${y+h+38}" text-anchor="middle" font-size="12" fill="#173a5e">time</text><text x="${x}" y="${y-10}" font-size="12" fill="#173a5e">water depth</text>`;return s;
  }
  function enhanceVesselLab(){
    const host=document.querySelector('[data-context-lab="vessel"]');
    if(!host||host.dataset.apVesselEnhanced==='true')return false;
    injectStyle();host.dataset.apVesselEnhanced='true';
    host.innerHTML=`<div class="apv-shell">
      <div class="apv-head"><div><h3>AP vessel challenge: shape ↔ graph</h3><p>Choose A–D, predict first, then fill the vessel and watch the depth graph grow at the same time.</p></div><span class="tag">Topic 1.1 · interactive comparison</span></div>
      <div class="apv-check"><div><strong>Challenge.</strong> The graph is always increasing. Its first portion is clearly concave up; the next portion is a fairly steady, steep increase. Which vessel best fits?</div><button class="btn secondary" type="button" data-apv-reveal>Reveal reasoning</button><div class="apv-answer" data-apv-answer hidden><strong>Vessel B.</strong> The body narrows as the level rises, so equal added volumes produce larger and larger height changes; in the narrow neck the rise becomes approximately steady and steep.</div></div>
      <div class="apv-choice-grid" role="group" aria-label="Choose a vessel shape">${Object.keys(AP_VESSELS).map(k=>`<button type="button" class="apv-choice" data-apv-key="${k}" aria-pressed="${k==='B'}"><b>Vessel ${k}</b>${miniShape(k)}<small>${AP_VESSELS[k].title}</small></button>`).join('')}</div>
      <div class="apv-main"><div class="apv-card"><div class="apv-vessel-wrap"><svg class="apv-vessel-svg" data-apv-vessel viewBox="0 0 340 380" role="img" aria-label="Selected vessel filling with water"></svg></div><div class="apv-readout"><div class="apv-stat"><span>Selected</span><b data-apv-selected>B</b></div><div class="apv-stat"><span>Depth</span><b data-apv-depth>0.00</b></div><div class="apv-stat"><span>Fill</span><b data-apv-percent>0%</b></div></div></div>
      <div class="apv-card"><svg class="apv-graph-svg" data-apv-graph viewBox="0 0 650 380" role="img" aria-label="Synchronized water depth versus time graph"></svg><div class="apv-legend" data-apv-legend></div><p class="apv-compare-note">Turn on comparison to see the full predicted depth–time curves for all four shapes while the selected trace grows live.</p></div></div>
      <div class="apv-controls"><button type="button" data-apv-play>Play filling</button><button type="button" class="secondary" data-apv-reset>Reset</button><label>Fill position <b data-apv-fill-label>0%</b><input type="range" min="0" max="100" step=".1" value="0" data-apv-fill></label><label>Constant inflow <b data-apv-flow-label>30</b> cm³/s<input type="range" min="18" max="45" step="1" value="30" data-apv-flow></label><label><input type="checkbox" data-apv-compare> Compare all four graphs</label></div>
      <p class="mode-note">Teaching move: ask for a prediction before pressing Play. The animation does not replace the explanation; it makes the relationship between vessel width and graph steepness visible.</p>
    </div>`;
    const $=s=>host.querySelector(`[data-apv-${s}]`),buttons=[...host.querySelectorAll('[data-apv-key]')];let key='B',pct=0,flow=30,playing=false,raf=0,last=0;
    const colors={A:'#6c7d96',B:'#8a2346',C:'#08796e',D:'#b7832f'};
    function fullTime(k){return apCapacity(k)/flow;}
    function renderVessel(){const svg=$('vessel'),base=335,cx=170,sy=24,sx=32,d=radiusPath(key,cx,base,sy,sx),clip='apv-clip-'+key,h=apHeightAtVolume(key,apCapacity(key)*pct/100),top=base-h*sy,r=apRadius(key,h);svg.innerHTML=`<defs><clipPath id="${clip}"><path d="${d}"/></clipPath></defs><path d="${d}" fill="#fbfcfd" stroke="#52647c" stroke-width="3"/><rect x="20" y="${top}" width="300" height="${base-top}" fill="#6eb6d6" opacity=".82" clip-path="url(#${clip})"/>${h>0?`<line x1="${cx-r*sx}" x2="${cx+r*sx}" y1="${top}" y2="${top}" stroke="#08796e" stroke-width="3"/>`:''}<text x="170" y="25" text-anchor="middle" font-size="18" font-weight="700" fill="#173a5e">Vessel ${key}</text><text x="170" y="365" text-anchor="middle" font-size="12" fill="#66758a">${AP_VESSELS[key].title}</text>`;$('selected').textContent=key;$('depth').textContent=h.toFixed(2)+' cm';$('percent').textContent=Math.round(pct)+'%';}
    function curvePoints(k,tMax,partial=1){const pts=[];for(let i=0;i<=240*partial;i++){const u=i/240,t=tMax*u,h=apHeight(k,t,flow);pts.push([55+560*(t/tMax),35+275-275*h/AP_H]);}return pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(2)+' '+p[1].toFixed(2)).join(' ');}
    function renderGraph(){const svg=$('graph'),tMax=Math.max(...Object.keys(AP_VESSELS).map(fullTime)),curT=fullTime(key)*pct/100;let s=graphAxes(55,35,560,275,tMax);if($('compare').checked){for(const k of Object.keys(AP_VESSELS)){s+=`<path d="${curvePoints(k,tMax,1)}" fill="none" stroke="${colors[k]}" stroke-width="2" opacity="${k===key?.6:.22}" stroke-dasharray="${k===key?'':'5 5'}"/>`;}}else{s+=`<path d="${curvePoints(key,tMax,1)}" fill="none" stroke="${colors[key]}" stroke-width="2" opacity=".18" stroke-dasharray="5 5"/>`;}
      const partialPts=[];for(let i=0;i<=Math.max(1,Math.floor(240*pct/100));i++){const u=(pct/100)*(i/Math.max(1,Math.floor(240*pct/100))),t=fullTime(key)*u,h=apHeight(key,t,flow);partialPts.push([55+560*(t/tMax),35+275-275*h/AP_H]);}if(partialPts.length>1)s+=`<path d="${partialPts.map((p,i)=>(i?'L':'M')+p[0].toFixed(2)+' '+p[1].toFixed(2)).join(' ')}" fill="none" stroke="${colors[key]}" stroke-width="4"/>`;const h=apHeightAtVolume(key,apCapacity(key)*pct/100),gx=55+560*(curT/tMax),gy=35+275-275*h/AP_H;s+=`<line x1="${gx}" y1="35" x2="${gx}" y2="310" stroke="#aab5c2" stroke-dasharray="4 4"/><circle cx="${gx}" cy="${gy}" r="6" fill="${colors[key]}" stroke="#fff" stroke-width="2"/>`;svg.innerHTML=s;$('legend').innerHTML=Object.keys(AP_VESSELS).map(k=>`<span style="--sw:${colors[k]}">${k}: ${AP_VESSELS[k].title}</span>`).join('');}
    function render(){renderVessel();renderGraph();$('fill').value=pct;$('fill-label').textContent=Math.round(pct)+'%';$('flow-label').textContent=flow;buttons.forEach(b=>b.setAttribute('aria-pressed',b.dataset.apvKey===key?'true':'false'));$('play').textContent=playing?'Pause':'Play filling';}
    function stop(){playing=false;if(raf)cancelAnimationFrame(raf);raf=0;last=0;render();}
    function frame(ts){if(!playing)return;if(!last)last=ts;const dt=Math.min(.06,(ts-last)/1000);last=ts;pct=Math.min(100,pct+dt*14);render();if(pct>=100){stop();return;}raf=requestAnimationFrame(frame);}
    buttons.forEach(b=>b.addEventListener('click',()=>{stop();key=b.dataset.apvKey;pct=0;render();}));$('play').addEventListener('click',()=>{if(playing){stop();return;}if(pct>=100)pct=0;playing=true;last=0;render();raf=requestAnimationFrame(frame);});$('reset').addEventListener('click',()=>{stop();pct=0;render();});$('fill').addEventListener('input',e=>{stop();pct=+e.target.value;render();});$('flow').addEventListener('input',e=>{stop();flow=+e.target.value;render();});$('compare').addEventListener('change',render);$('reveal').addEventListener('click',()=>{$('answer').hidden=!$('answer').hidden;$('reveal').textContent=$('answer').hidden?'Reveal reasoning':'Hide reasoning';});render();return true;
  }
  window.addEventListener('DOMContentLoaded',()=>{
    let tries=0;const timer=setInterval(()=>{tries++;if(enhanceVesselLab()||tries>20)clearInterval(timer);},80);
  });
})(typeof window!=='undefined'?window:globalThis);
