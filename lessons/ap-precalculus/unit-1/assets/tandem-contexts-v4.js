/* Paired geometric diagrams, graphs and accessible controls for Topic 1.1. */
(function(root){
  'use strict';
  const C=root.TandemContexts,G=root.TandemGraphs,M=root.TandemModels;
  const fmt=(n,d=2)=>Math.abs(n)<1e-9?'0':Number(n.toFixed(d)).toString();
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let serial=0;
  function carDiagram(t,p){
    const c=C.car(t,p),sc=105/(p.radius+p.gap+1),r=p.radius*sc,cx=165,cy=150,wall=cx+(p.radius+p.gap)*sc,x=cx+c.x*sc,y=cy-c.y*sc;
    return `<svg class="context-diagram" viewBox="0 0 430 300" role="img" aria-label="Circular track with the car and its perpendicular distance to a straight wall"><title>Top view: car position and shortest wall distance</title><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#61728b" stroke-width="2" stroke-dasharray="7 5"/><line x1="${wall}" x2="${wall}" y1="20" y2="280" stroke="#536178" stroke-width="8"/><text x="${wall+10}" y="30">Wall</text><circle cx="${cx}" cy="${cy}" r="4" fill="#536178"/><line x1="${x}" x2="${wall}" y1="${y}" y2="${y}" stroke="#08796e" stroke-width="3" stroke-dasharray="6 4"/><circle cx="${x}" cy="${y}" r="9" fill="#8a2346" stroke="white" stroke-width="2"/><text x="${Math.max(10,x-43)}" y="${y-17}">Car</text><text x="20" y="288">Dashed segment: shortest distance to wall</text></svg>`;
  }
  function vesselDiagram(key,height=null){
    const id='vessel-clip-'+(++serial),sx=h=>Math.sqrt(C.area(key,h)/Math.PI)*15,sy=h=>273-18*h;
    const hs=Array.from({length:121},(_,i)=>i/10),left=hs.map((h,i)=>(i?'L':'M')+(150-sx(h)).toFixed(3)+' '+sy(h).toFixed(3)).join(' '),right=[...hs].reverse().map(h=>'L'+(150+sx(h)).toFixed(3)+' '+sy(h).toFixed(3)).join(' '),d=left+' '+right+' Z';
    return `<svg class="context-diagram vessel-diagram" viewBox="0 0 350 310" role="img" aria-label="Vessel diagram: ${esc(C.vessels[key].title)}"><title>${esc(C.vessels[key].title)}. Horizontal sections are circular.</title><defs><clipPath id="${id}"><path d="${d}"/></clipPath></defs><path d="${d}" fill="#f4f7fa" stroke="#52647c" stroke-width="3"/>${height===null?'':`<rect x="0" y="${sy(height)}" width="320" height="${18*height}" fill="#83c5df" clip-path="url(#${id})"/><line x1="${150-sx(height)}" x2="${150+sx(height)}" y1="${sy(height)}" y2="${sy(height)}" stroke="#08796e" stroke-width="3"/>`}<line x1="285" x2="285" y1="57" y2="273" stroke="#536178"/>${[0,4,8,12].map(h=>`<text x="293" y="${sy(h)+5}">${h}</text>`).join('')}<text x="260" y="32">Depth (cm)</text><text x="22" y="301">Read the shape from bottom to top.</text></svg>`;
  }
  function cubicPlot(p,x=null){const {center:c,width:w}=p,fn=z=>C.cubic(z,p),low=c-2*w,high=c+2*w,ext=[fn(low),fn(high),fn(c-w),fn(c+w)],mn=Math.min(...ext),mx=Math.max(...ext),pad=(mx-mn)*.12;
    const points=[c-w,c,c+w].map(z=>({x:z,y:fn(z),label:'x = '+fmt(z)}));if(x!==null)points.push({x,y:fn(x),selected:true});
    return G.plot({title:`Graph of f; highlighted interval ${fmt(p.lo)} < x < ${fmt(p.hi)}`,bounds:[low,high,mn-pad,mx+pad],stepX:w/2,stepY:Math.max(1,Math.ceil((mx-mn)/6)),curves:[{fn}],points,shade:[p.lo,p.hi],yLabel:'output f(x)'});
  }
  function graph(kind,p){
    if(kind==='cubic')return cubicPlot(p);
    if(kind==='vessel-options')return '<div class="graph-options">'+p.order.map((k,i)=>'<figure><figcaption>Vessel '+String.fromCharCode(65+i)+'</figcaption>'+vesselDiagram(k)+'</figure>').join('')+'</div>';
    if(kind==='car-options'){
      const total=p.period*p.laps,top=p.gap+2*p.radius;
      return '<div class="graph-options">'+p.order.map((kind,i)=>{
        const fn=t=>{if(kind==='correct')return C.car(t,p).distance;if(kind==='signed')return (p.radius+p.gap)*Math.sin(2*Math.PI*t/p.period);if(kind==='cumulative')return C.car(0,p).distance+2*p.radius*t/p.period;const u=(t/p.period)%1,tri=u<.5?2*u:2*(1-u);return p.gap+2*p.radius*(p.start==='near'?tri:1-tri);};
        // Use the same axes for every candidate, including the accumulated-distance distractor.
        return '<figure><figcaption>Graph '+String.fromCharCode(65+i)+'</figcaption>'+G.plot({title:'Candidate distance graph '+String.fromCharCode(65+i),bounds:[0,total,-(p.radius+p.gap)*1.2,Math.max(top,C.car(0,p).distance+2*p.radius*p.laps)*1.1],stepX:p.period,stepY:Math.max(1,Math.ceil(top/2)),xLabel:'elapsed time (s)',yLabel:'wall distance (m)',curves:[{fn}]})+'</figure>';
      }).join('')+'</div>';
    }
    return '';
  }
  const priorRender=G.render;
  G.render=function(scope){priorRender(scope);scope.querySelectorAll('[data-context-plot]:not([data-plot-ready])').forEach(el=>{el.innerHTML=graph(el.dataset.contextPlot,JSON.parse(el.dataset.spec));el.dataset.plotReady='true';});};
  const priorLabs=root.ECHSTandemLabs;
  root.ECHSTandemLabs=function(api){priorLabs(api);document.querySelectorAll('[data-context-lab]').forEach(host=>{
    const kind=host.dataset.contextLab,id='context-'+kind;let timer=null,attempted=false,method='',carParams;
    const sel=(suffix,label,items)=>`<label for="${id}-${suffix}">${label}<select id="${id}-${suffix}" data-context-setting>${items.map(([v,label])=>`<option value="${v}">${label}</option>`).join('')}</select></label>`;
    const range=(suffix,label,min,max,value,step)=>`<label for="${id}-${suffix}">${label}<input id="${id}-${suffix}" data-context-setting type="range" min="${min}" max="${max}" value="${value}" step="${step}"></label>`;
    const field=(suffix,label)=>`<label for="${id}-${suffix}">${label}<input id="${id}-${suffix}" data-context-prediction type="text" inputmode="decimal" autocomplete="off"></label>`;
    let controls='',questions='';
    if(kind==='car'){
      controls=sel('radius','Track radius (m)',[[3,'3'],[2,'2'],[4,'4'],[5,'5']])+sel('period','Seconds per lap',[[10,'10'],[8,'8'],[12,'12'],[16,'16']])+sel('gap','Nearest distance to wall (m)',[[0,'0'],[1,'1'],[2,'2']])+sel('start','Starting position',[['near','Nearest the wall'],['far','Farthest from the wall']])+sel('laps','Number of laps',[[2,'2'],[3,'3'],[4,'4']])+range('time','Elapsed time (s)',0,20,0,.05)+`<label for="${id}-full"><input id="${id}-full" type="checkbox" data-context-setting> Show the full distance graph</label>`;
      questions=field('max','Predict the greatest wall distance (m)')+field('repeat','Predict the time between consecutive minima (s)');
    }
    if(kind==='vessel'){
      controls=sel('shape','Vessel',Object.entries(C.vessels).map(([k,v])=>[k,v.title]))+sel('flow','Constant inflow (cm³/s)',[[30,'30'],[20,'20'],[40,'40']])+range('fill','Fraction of filling time (%)',0,100,0,1);
      questions=sel('prediction','Predict the depth graph',[['','Choose a description'],['up-linear','Concave up, then a straight rise'],['down-linear','Concave down, then a straight rise'],['linear','A straight rise throughout'],['up-down','Concave up, then concave down'],['down-up-linear','Concave down, then concave up, then straight']]).replace('data-context-setting','data-context-prediction');
    }
    if(kind==='curve'){
      controls=sel('shape','Curve',[[-1,'Curve A'],[1,'Curve B']])+sel('interval','Highlighted interval',[['right','1 < x < 5'],['left','−3 < x < 1']])+range('x','Trace input x',-3,5,1,.1);
      questions=sel('prediction','How does the rate change throughout the highlighted interval?',[['','Choose'],['increasing','Increasing'],['decreasing','Decreasing'],['positive','Always positive'],['negative','Always negative']]).replace('data-context-setting','data-context-prediction');
    }
    if(kind==='ball'){
      controls=sel('model','Height model',[['0','h(t) = −4.9t² + 6.2t + 18'],['1','h(t) = −4.9t² + 8.4t + 21'],['2','h(t) = 24 − 4.9t²']])+range('time','Fraction of flight time (%)',0,100,0,1);
      questions=field('fall','Predict descent duration from maximum height (s), to three decimals');
    }
    host.innerHTML=`<div class="controls">${controls}</div>${kind==='car'?`<div class="actions"><button class="btn" id="${id}-play">Play</button><button class="btn secondary" id="${id}-step">Advance ¼ lap</button><button class="btn secondary" id="${id}-reset">Reset motion</button></div>`:''}<div class="lab-display" id="${id}-display"></div><div class="answer-grid">${questions}</div><div class="actions"><button class="btn" id="${id}-check">Check prediction</button><button class="btn secondary" id="${id}-reveal" aria-controls="${id}-work" aria-expanded="false">Explain the model</button></div><p class="feedback" id="${id}-feedback" role="status"></p><div class="solution" id="${id}-work" hidden></div>`;
    const $=s=>host.querySelector('#'+id+'-'+s),v=s=>$(s).value,num=s=>Number(v(s)),feedback=(s,ok=false)=>api.feedback($('feedback'),s,ok?'good':'');
    function stop(){if(timer!==null)clearTimeout(timer);timer=null;if($('play'))$('play').textContent='Play';}
    function invalidate(){attempted=false;$('work').hidden=true;$('reveal').setAttribute('aria-expanded','false');feedback('');}
    let expected;
    function update(){
      if(kind==='car'){
        const p={radius:num('radius'),period:num('period'),gap:num('gap'),start:v('start')};carParams=p;const total=num('laps')*p.period;$('time').max=total;if(num('time')>total)$('time').value=total;const t=num('time'),d=C.car(t,p).distance;
        $('display').innerHTML=`<div class="context-pair">${carDiagram(t,p)}${G.plot({title:'Wall distance versus elapsed time',bounds:[0,total,0,p.gap+2*p.radius+1],stepX:p.period/2,stepY:Math.max(1,Math.ceil((p.gap+2*p.radius)/4)),xLabel:'elapsed time (s)',yLabel:'wall distance (m)',curves:[{fn:x=>C.car(x,p).distance,to:$('full').checked?total:t}],points:[{x:t,y:d,selected:true}],vertical:t})}</div><p class="readout">Time: ${fmt(t)} s · Wall distance: ${fmt(d)} m · Completed laps: ${Math.floor((t+1e-8)/p.period)}. The car moves at constant speed along the track; its distance from the wall changes unevenly.</p>`;
        expected=[p.gap+2*p.radius,p.period];method=`<p>The nearest distance is ${p.gap} m and the farthest is ${expected[0]} m. One full lap reproduces the same wall distances in the same order, so the repetition time is ${p.period} s. A zero rate of wall-distance change at an extreme does not mean that the car stops.</p><div class="table-wrap"><table><caption>First lap: checkpoints from the chosen start</caption><thead><tr><th scope="col">Elapsed time (s)</th><th scope="col">Wall distance (m)</th></tr></thead><tbody>${[0,.25,.5,.75,1].map(f=>`<tr><td>${fmt(f*p.period)}</td><td>${fmt(C.car(f*p.period,p).distance)}</td></tr>`).join('')}</tbody></table></div>`;
      }
      if(kind==='vessel'){
        const key=v('shape'),flow=num('flow'),end=C.volume(key)/flow,t=end*num('fill')/100,h=C.waterHeight(key,t,flow);
        $('display').innerHTML=`<div class="context-pair">${vesselDiagram(key,h)}${G.plot({title:'Water depth versus time for the selected vessel and constant inflow',bounds:[0,end,0,13],stepX:end/4,stepY:3,xLabel:'time (s)',yLabel:'water depth (cm)',curves:[{fn:x=>C.waterHeight(key,x,flow)}],points:[{x:t,y:h,selected:true}],vertical:t})}</div><p class="readout">Time: ${fmt(t)} s · Depth: ${fmt(h)} cm · Water added: ${fmt(flow*t)} cm³. No leakage; the model ends when the vessel is full.</p>`;
        expected={neck:'up-linear',widening:'down-linear',cylinder:'linear',hourglass:'up-down',bulb:'down-up-linear'}[key];method='<p>For the same added volume, a smaller horizontal cross-sectional area produces a greater depth increase. Narrowing makes the depth graph steepen; widening makes it flatten. A constant-area section gives a straight rising segment. Changing a constant pump setting changes the filling time, not this sequence of bends.</p>';
      }
      if(kind==='curve'){
        const p={center:1,width:2,sign:num('shape'),scale:3,shift:5,lo:v('interval')==='right'?1:-3,hi:v('interval')==='right'?5:1},x=num('x');
        $('display').innerHTML=cubicPlot(p,x)+`<p class="readout">Selected point: (${fmt(x)}, ${fmt(C.cubic(x,p))}). Use the entire highlighted interval to describe the rate, even when the graph changes direction.</p>`;
        expected=(p.sign===1)===(v('interval')==='right')?'increasing':'decreasing';method=`<p>Across the highlighted interval, the curve ${expected==='increasing'?'bends upward: its rate increases from negative through zero to positive':'bends downward: its rate decreases from positive through zero to negative'}. The interval contains a turning point. Thus neither a positive rate throughout nor a negative rate throughout is correct.</p>`;
      }
      if(kind==='ball'){
        const p=[{a:4.9,v:6.2,h:18},{a:4.9,v:8.4,h:21},{a:4.9,v:0,h:24}][num('model')],f=C.flight(p),t=f.impact*num('time')/100;
        $('display').innerHTML=G.plot({title:'Physical height model ending at first ground contact',bounds:[0,f.impact,0,f.peakHeight+3],stepX:f.impact/4,stepY:5,xLabel:'seconds after release',yLabel:'height (m)',curves:[{fn:x=>C.projectile(x,p)}],points:[{x:f.peakTime,y:f.peakHeight,label:'Maximum'},{x:f.impact,y:0,label:'Ground'},{x:t,y:Math.max(0,C.projectile(t,p)),selected:true}]})+`<div class="readout"><p>Time after release: ${fmt(t,3)} s · Height: ${fmt(Math.max(0,C.projectile(t,p)),3)} m.</p><p>Maximum: ${f.peakHeight.toFixed(3)} m at ${f.peakTime.toFixed(6)} s after release. Ground contact: ${f.impact.toFixed(6)} s after release.</p><p>${t<f.peakTime?'The ball is rising.':Math.abs(t-f.peakTime)<1e-9?'The ball is at its maximum height.':'The ball is descending.'} Use the graph’s features to compare the two clocks.</p></div>`;
        expected=f.fallTime;method=`<p>Descent duration = time of ground contact − time of maximum height = ${f.impact.toFixed(6)} − ${f.peakTime.toFixed(6)} ≈ ${f.fallTime.toFixed(3)} s. Keep stored values until rounding. The negative root and the continuation below ground are outside this physical model.</p>`;
      }
      $('work').innerHTML=method;
    }
    host.querySelectorAll('[data-context-setting]').forEach(el=>el.addEventListener(el.type==='range'?'input':'change',()=>{stop();invalidate();if(kind==='car'&&el!==$('time')&&el!==$('full'))$('time').value=0;update();}));
    host.querySelectorAll('[data-context-prediction]').forEach(el=>el.addEventListener(el.tagName==='SELECT'?'change':'input',invalidate));
    $('check').addEventListener('click',()=>{
      const answer=kind==='car'?[M.parseNumber(v('max')),M.parseNumber(v('repeat'))]:kind==='ball'?M.parseNumber(v('fall')):v('prediction');
      if(answer===''||answer===null||(Array.isArray(answer)&&answer.includes(null))){feedback('Complete the prediction before checking.');return;}
      attempted=true;const correct=kind==='car'?answer.every((a,i)=>Math.abs(a-expected[i])<.001):kind==='ball'?Math.abs(answer-expected)<=.00051:answer===expected;
      feedback(correct?'Correct. Explain how the input and output change together.':'Not yet. Trace the model, check the units, and try again.',correct);
    });
    $('reveal').addEventListener('click',()=>{if(!attempted){feedback('Try the prediction before opening the explanation.');return;}$('work').hidden=!$('work').hidden;$('reveal').setAttribute('aria-expanded',String(!$('work').hidden));});
    if(kind==='car'){
      function tick(){if(host.closest('.slide').hidden||document.hidden){stop();return;}const end=Number($('time').max);$('time').value=Math.min(end,num('time')+.1);update();if(num('time')>=end){stop();return;}timer=setTimeout(tick,100);}
      $('play').addEventListener('click',()=>{if(timer!==null){stop();return;}if(num('time')>=Number($('time').max))$('time').value=0;invalidate();$('play').textContent='Pause';timer=setTimeout(tick,100);});
      $('step').addEventListener('click',()=>{stop();invalidate();$('time').value=Math.min(Number($('time').max),num('time')+carParams.period/4);update();});
      $('reset').addEventListener('click',()=>{stop();invalidate();$('time').value=0;update();});
      root.addEventListener('pagehide',stop);document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
    }
    update();
  });};
  root.TandemContextGraphs={graph,carDiagram,vesselDiagram,cubicPlot};
})(window);
