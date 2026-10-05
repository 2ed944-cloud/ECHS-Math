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
  /* Reconstructed, idealized interiors from the supplied vessel silhouettes.
   * All use a common illustrative centimetre scale, circular horizontal sections,
   * no wall thickness and no leakage. B uses a straight neck: a drawn rim flare
   * is not treated as extra interior volume. No restricted AP prompt is included.
   */
  const AP_H=10;
  const AP_VESSELS={
    A:{label:"A",title:"Hourglass",points:[[0.0,2.25],[0.5,2.35],[1.0,2.15],[1.5,1.9],[2.0,1.7],[2.5,1.55],[3.0,1.4],[3.5,1.3],[4.0,1.25],[4.5,1.15],[5.0,1.15],[5.5,1.15],[6.0,1.2],[6.5,1.25],[7.0,1.35],[7.5,1.45],[8.0,1.6],[8.5,1.75],[9.0,1.95],[9.5,2.25],[10.0,2.5]]},
    B:{label:"B",title:"Tapering body + straight neck",points:[[0,3.45],[1,3.22],[2.5,2.68],[4,2.05],[5.5,1.35],[6.5,0.98],[7,0.86],[10,0.86]]},
    C:{label:"C",title:"Round bulb + neck",points:[[0.0,1.54988],[0.5,2.20012],[1.0,2.95012],[1.5,3.34987],[2.0,3.6],[2.5,3.75],[3.0,3.75],[3.5,3.75],[4.0,3.70012],[4.5,3.55012],[5.0,3.25013],[5.5,2.7],[6.0,1.95],[6.5,1.45012],[7.0,1.24987],[7.5,1.15012],[8.0,1.09987],[8.5,1.09987],[9.0,1.15012],[9.5,1.24987],[10.0,1.5]]},
    D:{label:"D",title:"Low shoulders + neck",points:[[0,1.665],[0.5,1.80005],[1.0,2.20002],[1.5,2.69989],[2.0,3.09986],[2.5,3.39993],[3.0,3.65005],[3.5,3.7],[4.0,3.49983],[4.5,2.69989],[5.0,1.7501],[5.5,1.19991],[6.0,0.89984],[6.5,0.79994],[7.0,0.70004],[7.5,0.70004],[8.0,0.70004],[8.5,0.70004],[9.0,0.79994],[9.5,0.89984],[10.0,1.10001]]}
  };
  function apRadius(key,h){
    const pts=AP_VESSELS[key].points;h=Math.max(0,Math.min(AP_H,h));
    for(let i=0;i<pts.length-1;i++){
      const [h0,r0]=pts[i],[h1,r1]=pts[i+1];
      if(h<=h1){const u=(h-h0)/(h1-h0);return r0+(r1-r0)*u;}
    }
    return pts.at(-1)[1];
  }
  function apVolume(key,h=AP_H){
    h=Math.max(0,Math.min(AP_H,h));let v=0;
    const pts=AP_VESSELS[key].points;
    for(let i=0;i<pts.length-1;i++){
      const [h0,r0]=pts[i],[h1,r1]=pts[i+1],z=Math.max(0,Math.min(h,h1)-h0),k=(r1-r0)/(h1-h0);
      // Exact integral of pi * (r0 + k*z)^2 on each linear-radius segment.
      v+=Math.PI*(r0*r0*z+r0*k*z*z+k*k*z*z*z/3);
      if(h<=h1)break;
    }
    return v;
  }
  const AP_CAPACITY=Object.fromEntries(Object.keys(AP_VESSELS).map(k=>[k,apVolume(k)]));
  const apCapacity=key=>AP_CAPACITY[key];
  function apHeightAtVolume(key,v){
    if(v<=0)return 0;if(v>=apCapacity(key))return AP_H;
    let lo=0,hi=AP_H;
    for(let i=0;i<45;i++){const mid=(lo+hi)/2;if(apVolume(key,mid)<v)lo=mid;else hi=mid;}
    return (lo+hi)/2;
  }
  function apState(key,time=0,flow=6){
    if(!AP_VESSELS[key])throw new RangeError('Unknown vessel');
    if(!Number.isFinite(time)||time<0||!Number.isFinite(flow)||flow<=0)throw new RangeError('Nonnegative time and positive constant inflow required');
    const capacity=apCapacity(key),fullTime=capacity/flow,t=Math.min(time,fullTime),volume=flow*t,height=apHeightAtVolume(key,volume),radius=apRadius(key,height),section=Math.PI*radius*radius;
    return {key,time:t,flow,height,radius,area:section,rate:flow/section,volume,capacity,fullTime,fraction:volume/capacity,full:time>=fullTime};
  }
  const forumVessels={height:AP_H,profiles:AP_VESSELS,radius:apRadius,volume:apVolume,capacity:apCapacity,heightAtVolume:apHeightAtVolume,state:apState};
  const api={car,projectile,flight,cubic,vessels,area,volume,waterHeight,forumVessels};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.TandemContexts=api;
  if(typeof window==='undefined'||typeof document==='undefined')return;

  function injectStyle(){
    if(document.getElementById('ap-vessel-forum-style'))return;
    const st=document.createElement('style');st.id='ap-vessel-forum-style';st.textContent=`
      .apv-shell{display:grid;gap:16px}.apv-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap}
      .apv-head h3{margin:0;color:#173a5e;font-size:clamp(1.25rem,2vw,1.75rem)}.apv-head p{margin:.35rem 0 0;color:#58697f}
      .apv-choice-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.apv-choice{border:1px solid #cfd7e2;background:#fff;border-radius:14px;padding:9px;min-height:122px;color:#173a5e;transition:.16s}
      .apv-choice[aria-pressed="true"]{border:2px solid #8a2346;box-shadow:0 0 0 3px #8a23461c;background:#fff9fb}.apv-choice b{display:block;font-size:1.05rem;margin-bottom:4px}.apv-choice small{display:block;line-height:1.25;color:#5f6e81}
      .apv-choice svg{width:100%;height:82px}.apv-shell button:focus-visible,.apv-shell input:focus-visible{outline:3px solid #08796e;outline-offset:3px}.apv-main{display:grid;grid-template-columns:minmax(250px,.72fr) minmax(360px,1.28fr);gap:18px;align-items:stretch}.apv-card{border:1px solid #dbe2ea;background:#fff;border-radius:16px;padding:14px;box-shadow:0 10px 30px #1c35560a}
      .apv-vessel-wrap{min-height:360px;display:grid;place-items:center}.apv-vessel-svg{width:100%;height:350px}.apv-graph-svg{width:100%;height:350px}.apv-label{font-weight:700;color:#173a5e}.apv-readout{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px}.apv-stat{background:#f5f7fa;border-radius:10px;padding:9px 10px}.apv-stat span{display:block;font-size:.72rem;text-transform:uppercase;letter-spacing:.05em;color:#718095}.apv-stat b{display:block;margin-top:3px;color:#173a5e}
      .apv-controls{display:flex;align-items:flex-end;gap:10px;flex-wrap:wrap}.apv-controls button{border:1px solid #8a2346;background:#8a2346;color:#fff;border-radius:9px;padding:10px 16px;font-weight:700}.apv-controls button.secondary{background:#fff;color:#8a2346}.apv-controls label{min-width:180px;flex:1;font-size:.8rem;color:#52647c}.apv-controls input[type=range]{width:100%;accent-color:#8a2346}.apv-controls button:disabled{opacity:.55;cursor:not-allowed}.apv-physics{margin-top:12px;padding:10px 12px;border-left:4px solid #08796e;background:#edf7f7;border-radius:8px;color:#194a4a}.apv-physics p{margin:.3rem 0}.apv-check{display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap;background:#f7f1f4;border-left:4px solid #8a2346;padding:12px 14px;border-radius:10px}.apv-check strong{color:#8a2346}.apv-answer{padding:10px 12px;background:#eef8f4;border:1px solid #b9e0d0;border-radius:10px;color:#205f4e}.apv-answer[hidden]{display:none}.apv-compare-note{font-size:.82rem;color:#66758a;margin:3px 0 0}.apv-legend{display:flex;gap:12px;flex-wrap:wrap;font-size:.78rem;color:#58697f;margin-top:5px}.apv-legend span::before{content:'';display:inline-block;width:16px;height:3px;background:var(--sw);vertical-align:middle;margin-right:5px;border-radius:3px}
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
    const d=radiusPath(key,50,82,7.2,7.2);
    return `<svg viewBox="0 0 100 90" aria-hidden="true"><path d="${d}" fill="#f5f7fa" stroke="#52647c" stroke-width="2"/></svg>`;
  }
  function graphAxes(x,y,w,h,tMax){
    let s='';for(let i=0;i<=4;i++){const py=y+h-h*i/4;s+=`<line x1="${x}" y1="${py}" x2="${x+w}" y2="${py}" stroke="#e2e7ed"/><text x="${x-8}" y="${py+4}" text-anchor="end" font-size="11" fill="#62738a">${(AP_H*i/4).toFixed(1)}</text>`;}
    for(let i=0;i<=4;i++){const px=x+w*i/4;s+=`<line x1="${px}" y1="${y}" x2="${px}" y2="${y+h}" stroke="#eef1f4"/><text x="${px}" y="${y+h+18}" text-anchor="middle" font-size="11" fill="#62738a">${(tMax*i/4).toFixed(1)}</text>`;}
    s+=`<line x1="${x}" y1="${y+h}" x2="${x+w}" y2="${y+h}" stroke="#173a5e" stroke-width="1.5"/><line x1="${x}" y1="${y}" x2="${x}" y2="${y+h}" stroke="#173a5e" stroke-width="1.5"/><text x="${x+w/2}" y="${y+h+38}" text-anchor="middle" font-size="12" fill="#173a5e">elapsed time (s)</text><text x="${x}" y="${y-10}" font-size="12" fill="#173a5e">water height (cm)</text>`;return s;
  }
  function enhanceVesselLab(){
    const host=document.querySelector('[data-context-lab="vessel"]');
    if(!host||host.dataset.apVesselEnhanced==='true')return false;
    injectStyle();host.dataset.apVesselEnhanced='true';
    host.innerHTML=`<div class="apv-shell">
      <div class="apv-head"><div><h3>Vessel challenge: shape ↔ graph</h3><p>Choose A–D and predict before pressing Play. Water level and graph point represent the same instant.</p></div><span class="tag">Topic 1.1 · reconstructed model</span></div>
      <div class="apv-check"><div><strong>Challenge.</strong> A constant inflow produces a rising height graph that first steepens, then becomes a fairly steady, steep rise. Which vessel best fits? Explain from bottom to top.</div><button class="btn secondary" type="button" data-apv-reveal aria-expanded="false" aria-controls="apv-reasoning">Reveal reasoning</button><div class="apv-answer" id="apv-reasoning" data-apv-answer hidden><strong>Vessel B.</strong> Its body narrows upward: the same volume added in the same time produces progressively larger height changes. In its narrow, constant-area neck, the rise is steady and steep. The graph is a consequence of the area at each water level.</div></div>
      <div class="apv-choice-grid" role="group" aria-label="Choose a vessel shape">${Object.keys(AP_VESSELS).map(k=>`<button type="button" class="apv-choice" data-apv-key="${k}" aria-pressed="${k==='A'}"><b>Vessel ${k}</b>${miniShape(k)}<small>${AP_VESSELS[k].title}</small></button>`).join('')}</div>
      <div class="apv-main lab-display"><div class="apv-card"><div class="apv-vessel-wrap"><svg class="apv-vessel-svg" data-apv-vessel viewBox="0 0 340 380" role="img" aria-label="Selected vessel filling with water"></svg></div><div class="apv-readout"><div class="apv-stat"><span>Elapsed time</span><b data-apv-time>0.00 s</b></div><div class="apv-stat"><span>Water height</span><b data-apv-depth>0.00 cm</b></div><div class="apv-stat"><span>Volume added</span><b data-apv-volume>0.00 cm³</b></div></div><div class="apv-physics"><p>Cross-sectional area: <b data-apv-area></b></p><p>Height rise while filling: <b data-apv-rate></b></p><p><strong>Wider → slower rise. Narrower → faster rise.</strong></p></div></div>
      <div class="apv-card"><svg class="apv-graph-svg" data-apv-graph viewBox="0 0 650 380" role="img" aria-label="Synchronized water height versus elapsed time graph"></svg><div class="apv-legend" data-apv-legend></div><p class="apv-compare-note">Comparison uses the same height and time scales and the same inflow for all four. Each curve ends when its vessel becomes full.</p></div></div>
      <div class="apv-controls"><button type="button" data-apv-play>Play filling</button><button type="button" class="secondary" data-apv-reset>Reset</button><label>Elapsed time <b data-apv-time-label>0.00 s</b><input type="range" min="0" max="10" step=".01" value="0" data-apv-fill></label><label>Constant inflow <b data-apv-flow-label>6</b> cm³/s<input type="range" min="2" max="15" step="1" value="6" data-apv-flow></label><label><input type="checkbox" data-apv-compare> Compare All Four</label></div>
      <p class="mode-note" data-apv-motion-note>Use the time scrubber to inspect any instant. Changing the pump setting starts a new constant-inflow run.</p>
      <p class="mode-note">Idealized reconstructed interiors, circular horizontal sections, common illustrative centimetre scale, no leakage. Vessel B’s neck is modeled as straight; the drawn rim is omitted. Dimensions are teaching assumptions, not measurements from the AP question.</p>
    </div>`;
    const $=s=>host.querySelector(`[data-apv-${s}]`),buttons=[...host.querySelectorAll('[data-apv-key]')];let key='A',time=0,flow=6,playing=false,raf=0,last=null;
    const colors={A:'#526b96',B:'#8a2346',C:'#08796e',D:'#a66b18'},reducedMotion=typeof root.matchMedia==='function'?root.matchMedia('(prefers-reduced-motion: reduce)'):null;
    const fullTime=k=>apCapacity(k)/flow;
    const readable=n=>n.toFixed(2);
    function renderVessel(s){
      const svg=$('vessel'),base=335,cx=170,sy=28,sx=28,d=radiusPath(key,cx,base,sy,sx),clip='apv-clip-'+key,top=base-s.height*sy,r=s.radius;
      svg.innerHTML=`<title>Vessel ${key}: height ${readable(s.height)} centimetres at ${readable(s.time)} seconds</title><defs><clipPath id="${clip}"><path d="${d}"/></clipPath></defs><path d="${d}" fill="#fbfcfd" stroke="#52647c" stroke-width="3"/><rect x="20" y="${top}" width="300" height="${base-top}" fill="#6eb6d6" opacity=".82" clip-path="url(#${clip})"/><line x1="${cx-r*sx}" x2="${cx+r*sx}" y1="${top}" y2="${top}" stroke="#08796e" stroke-width="4"/><line x1="${cx-r*sx}" x2="${cx+r*sx}" y1="${top}" y2="${top}" stroke="#fff" stroke-width="1" stroke-dasharray="4 3"/><text x="170" y="25" text-anchor="middle" font-size="18" font-weight="700" fill="#173a5e">Vessel ${key}</text><text x="170" y="365" text-anchor="middle" font-size="12" fill="#66758a">${AP_VESSELS[key].title}</text>`;
      svg.dataset.height=s.height;svg.dataset.time=s.time;
      $('time').textContent=readable(s.time)+' s';$('depth').textContent=readable(s.height)+' cm';$('volume').textContent=readable(s.volume)+' cm³';$('area').textContent=readable(s.area)+' cm²';$('rate').textContent=s.full?'Full — model ends':readable(s.rate)+' cm/s';
    }
    function curvePoints(k,tMax,end){
      const pts=[],count=240;
      for(let i=0;i<=count;i++){const t=end*i/count,h=apState(k,t,flow).height;pts.push([55+560*t/tMax,35+275-275*h/AP_H]);}
      return pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(2)+' '+p[1].toFixed(2)).join(' ');
    }
    function renderGraph(s){
      const compare=$('compare').checked,tMax=compare?Math.max(...Object.keys(AP_VESSELS).map(fullTime)):fullTime(key),svg=$('graph');
      let markup=`<title>Water height against time. Vessel ${key} at ${readable(s.time)} seconds and ${readable(s.height)} centimetres.</title>`+graphAxes(55,35,560,275,tMax);
      if(compare)for(const k of Object.keys(AP_VESSELS))markup+=`<path data-apv-prediction="${k}" d="${curvePoints(k,tMax,fullTime(k))}" fill="none" stroke="${colors[k]}" stroke-width="${k===key?3:2}" stroke-dasharray="6 4" opacity=".75"/><text x="${55+560*fullTime(k)/tMax}" y="26" text-anchor="end" font-size="12" font-weight="700" fill="${colors[k]}">${k}</text>`;
      if(s.time>0)markup+=`<path data-apv-trace d="${curvePoints(key,tMax,s.time)}" fill="none" stroke="${colors[key]}" stroke-width="4"/>`;
      const gx=55+560*s.time/tMax,gy=35+275-275*s.height/AP_H;
      markup+=`<line x1="55" y1="${gy}" x2="${gx}" y2="${gy}" stroke="#aab5c2" stroke-dasharray="4 4"/><line x1="${gx}" y1="${gy}" x2="${gx}" y2="310" stroke="#aab5c2" stroke-dasharray="4 4"/><circle data-apv-point cx="${gx}" cy="${gy}" r="6" fill="${colors[key]}" stroke="#fff" stroke-width="2"/>`;
      svg.innerHTML=markup;svg.dataset.height=s.height;svg.dataset.time=s.time;svg.dataset.timeMax=tMax;
      $('legend').innerHTML=compare?Object.keys(AP_VESSELS).map(k=>`<span style="--sw:${colors[k]}">${k}: ${AP_VESSELS[k].title}</span>`).join(''):'';
    }
    function render(){
      const s=apState(key,time,flow);time=s.time;renderVessel(s);renderGraph(s);
      $('fill').max=fullTime(key);$('fill').value=time;$('time-label').textContent=readable(time)+' s / '+readable(fullTime(key))+' s';$('flow-label').textContent=flow;
      buttons.forEach(b=>b.setAttribute('aria-pressed',b.dataset.apvKey===key?'true':'false'));$('play').textContent=playing?'Pause':'Play filling';
      host.dataset.vesselKey=key;host.dataset.vesselTime=time;host.dataset.vesselFlow=flow;host.dataset.vesselPlaying=playing;
    }
    function stop(){playing=false;if(raf)cancelAnimationFrame(raf);raf=0;last=null;render();}
    function frame(ts){
      if(!playing)return;
      const slide=host.closest('.slide');if(document.hidden||host.hidden||slide?.hidden){stop();return;}
      if(last!==null)time=Math.min(fullTime(key),time+Math.max(0,(ts-last)/1000));last=ts;render();
      if(time>=fullTime(key)){stop();return;}raf=requestAnimationFrame(frame);
    }
    buttons.forEach(b=>b.addEventListener('click',()=>{stop();key=b.dataset.apvKey;time=0;$('answer').hidden=true;$('reveal').textContent='Reveal reasoning';$('reveal').setAttribute('aria-expanded','false');render();}));
    $('play').addEventListener('click',()=>{if(reducedMotion?.matches)return;if(playing){stop();return;}if(time>=fullTime(key))time=0;playing=true;last=null;render();raf=requestAnimationFrame(frame);});
    $('reset').addEventListener('click',()=>{stop();time=0;render();});
    $('fill').addEventListener('input',e=>{const next=Number(e.target.value);stop();time=next;render();});
    $('flow').addEventListener('input',e=>{const next=Number(e.target.value);stop();flow=next;time=0;render();});
    $('compare').addEventListener('change',render);
    $('reveal').addEventListener('click',()=>{$('answer').hidden=!$('answer').hidden;$('reveal').textContent=$('answer').hidden?'Reveal reasoning':'Hide reasoning';$('reveal').setAttribute('aria-expanded',String(!$('answer').hidden));});
    function syncMotion(){if(reducedMotion?.matches)stop();$('play').disabled=Boolean(reducedMotion?.matches);$('motion-note').textContent=reducedMotion?.matches?'Reduced motion: use the elapsed-time scrubber. Changing the pump setting starts a new constant-inflow run.':'Use the time scrubber to inspect any instant. Changing the pump setting starts a new constant-inflow run.';}
    reducedMotion?.addEventListener('change',syncMotion);root.addEventListener('pagehide',stop);document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});render();syncMotion();return true;
  }
  window.addEventListener('DOMContentLoaded',()=>{
    let tries=0;const timer=setInterval(()=>{tries++;if(enhanceVesselLab()||tries>20)clearInterval(timer);},80);
  });
})(typeof window!=='undefined'?window:globalThis);
