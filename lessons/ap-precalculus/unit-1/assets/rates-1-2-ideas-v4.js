/* Fixed, accessible graphs and investigations for the ten supplied question ideas. */
(function(){
  'use strict';
  const M=window.RatesIdeaModels,R=window.RatesModels,G=window.RatesGraphs;
  if(!M||!R||!G)return;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=(n,dp=4)=>R.format(n,dp);
  const table=(headers,rows,caption)=>'<div class="table-wrap"><table class="rate-table"><caption>'+esc(caption)+'</caption><thead><tr>'+headers.map(h=>'<th scope="col">'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(v=>'<td>'+esc(v)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
  const points=(xs,fn,labels)=>xs.map((x,i)=>({x,y:fn(x),label:labels?.[i]??`(${x}, ${fmt(fn(x),2)})`}));
  function graph(key){
    if(key==='bend')return G.plot({title:'Smooth curve: P is a local maximum, R changes from concave down to concave up; Q is falling and S is rising.',bounds:[-3,3.5,4,12],stepX:1,stepY:2,curves:[{fn:M.bend}],points:points([-2,-1,0,2.5],M.bend,['P','Q','R','S'])});
    if(key==='rising-down')return G.plot({title:'Rising graph that becomes flatter near A at x=2',bounds:[0,4,0,22],stepY:4,curves:[{fn:M.shapes.risingDown.fn}],points:points([2],M.shapes.risingDown.fn,['A'])});
    if(key==='endpoint-options')return '<div class="graph-options">'+[
      {fn:x=>-3+x},{points:[[0,7],[2,12],[4,3]]},{fn:x=>4+x*(4-x)},{fn:x=>-6+2*x}
    ].map((curve,i)=>'<figure><figcaption>Graph '+String.fromCharCode(65+i)+'</figcaption>'+G.plot({title:'Graph '+String.fromCharCode(65+i)+' on [0,4]',bounds:[0,4,-8,14],stepY:4,curves:[curve],points:(curve.points?[curve.points[0],curve.points.at(-1)]:[0,4].map(x=>[x,curve.fn(x)])).map(([x,y])=>({x,y,label:`(${x}, ${y})`}))})+'</figure>').join('')+'</div>';
    if(key==='intervals')return G.plot({title:'Complete piecewise-linear graph with labeled coordinates for interval comparisons',bounds:[-4.5,4.5,-2,6],stepY:1,curves:[{points:M.graphPoints}],points:M.graphPoints.map(([x,y])=>({x,y,label:`(${x}, ${y})`}))});
    if(key==='quadratic'){const fn=x=>(x+2)**2+1;return G.plot({title:'p(x)=(x+2)²+1, decreasing left of vertex (−2,1) and increasing to its right',bounds:[-6,2,0,19],stepY:3,curves:[{fn}],points:points([-4,-2,0],fn)});}
    if(key==='drainage')return G.plot({title:'Illustrative remaining water always decreases while steepness varies',bounds:[0,12,180,350],stepX:2,stepY:40,xLabel:'time t (min)',yLabel:'remaining water (L)',curves:[{fn:M.drainage}],points:points([2,6],M.drainage,['t=2','t=6'])});
    if(key==='cycle')return G.plot({title:'Illustrative greenhouse temperature: P rising, Q maximum, R falling, S minimum',bounds:[0,12,18,34],stepX:1,stepY:4,xLabel:'time (weeks)',yLabel:'temperature (°C)',curves:[{fn:M.cycle}],points:points([1,3,6,9],M.cycle,['P','Q','R','S'])});
    throw Error('Unknown idea graph: '+key);
  }
  const select=(id,label,options)=>`<label for="${id}">${label}<select id="${id}" data-setting>${options.map(([v,t])=>`<option value="${v}">${esc(t)}</option>`).join('')}</select></label>`;
  const number=(id,label)=>`<label for="${id}">${label}<input id="${id}" data-response type="text" inputmode="text" autocomplete="off"></label>`;
  const choice=(id,label,options)=>select(id,label,[['','Choose'],...options]).replace('data-setting','data-response');
  function mount(host){
    const name=host.dataset.ideaLab,id='idea-'+name;let controls='',answers='';
    if(name==='ledger'){controls=select(id+'-count','Ending time',[[1,'4 s'],[2,'8 s'],[3,'12 s'],[4,'16 s'],[5,'20 s']]);answers=number(id+'-a','Net change of A (m)')+number(id+'-b','Net change of B (m)')+number(id+'-rate','Average rate of A (m/s; exact or 4 decimal places)')+choice(id+'-compare','Which signed average rate is greater?',[['A','A'],['B','B'],['equal','Equal']]);}
    if(name==='widths'){controls=select(id+'-interval','Focus interval',M.intervals.map(([a,b],i)=>[i,`[${a},${b}]`]));answers=number(id+'-amount','Net change on the focus interval')+number(id+'-overall','Average rate over [0,12] (exact or 3 decimal places)')+choice(id+'-most','Which interval has the greatest net increase?',M.intervals.map(([a,b],i)=>[String(i),`[${a},${b}]`]));}
    if(name==='shape'){controls=select(id+'-model','Curve',Object.keys(M.shapes).map((k,i)=>[k,'Curve '+String.fromCharCode(65+i)]))+select(id+'-c','Point of interest',[[1,'x=1'],[2,'x=2'],[3,'x=3']]);answers=choice(id+'-sign','Sign of the local rate',[['positive','Positive'],['negative','Negative']])+choice(id+'-bend','Concavity near the point',[['up','Concave up'],['down','Concave down']])+number(id+'-left','Average on [c−0.1,c]')+number(id+'-right','Average on [c,c+0.1]');}
    if(name==='sum'){controls=select(id+'-model','Increasing part of g for x>4',[['1','Slow increase'],['2','Matching increase'],['4','Strong increase'],['varying','Increase with changing rate']]);answers=number(id+'-f','Average rate of f on [5,7]')+number(id+'-g','Average rate of g on [5,7]')+number(id+'-h','Average rate of h=f+g on [5,7]')+choice(id+'-behavior','Behavior of h throughout (4,8)',[['decreasing','Decreasing'],['constant','Constant'],['increasing','Increasing'],['mixed','Decreases and then increases']]);}
    host.innerHTML=`<div class="controls">${controls}</div><div class="lab-display" id="${id}-display"></div><div class="answer-grid">${answers}</div><div class="actions"><button class="btn" id="${id}-check" type="button">Check reasoning</button><button class="btn secondary" id="${id}-reveal" type="button" aria-controls="${id}-work" aria-expanded="false">Show the explanation</button><button class="btn outline" id="${id}-reset" type="button">Reset investigation</button></div><p class="feedback" id="${id}-feedback" role="status" aria-live="polite"></p><div class="solution" id="${id}-work" hidden></div>`;
    const $=suffix=>host.querySelector('#'+id+'-'+suffix),value=key=>$(key).value;
    const defaults=[...host.querySelectorAll('[data-setting]')].map(el=>[el,el.value]);let check,explanation;
    const numeric=(key,n,tolerance=1e-7)=>R.checkAnswer(value(key),{answer:n,tolerance}).correct;
    function update(){
      let display='';
      if(name==='ledger'){
        const count=Number(value('count')),time=4*count,a=M.net(M.ledgers.A,count),b=M.net(M.ledgers.B,count);
        display=table(['Time interval (s)','A: signed change (m)','B: signed change (m)'],Array.from({length:count},(_,i)=>[`${4*i}–${4*i+4}`,M.ledgers.A[i],M.ledgers.B[i]]),'Illustrative sensor changes; starting heights are not specified.')+G.plot({title:'Cumulative height change relative to each initial height, using the selected records',bounds:[0,20,0,20],stepX:4,stepY:4,xLabel:'time (s)',yLabel:'net change from start (m)',curves:[{points:M.cumulative(M.ledgers.A.slice(0,count)).map((y,i)=>[i*4,y])},{points:M.cumulative(M.ledgers.B.slice(0,count)).map((y,i)=>[i*4,y]),dashed:true}]})+'<p>Solid blue: A. Dashed gold: B. Lines join recorded relative changes; the unmeasured motion between records is unspecified.</p>';
        check=()=>numeric('a',a)&&numeric('b',b)&&numeric('rate',a/time,.000051)&&value('compare')===(a>b?'A':a<b?'B':'equal');explanation=`A changes by ${a} m and B by ${b} m over ${time} s. Their averages are ${fmt(a/time)} and ${fmt(b/time)} m/s. Add signed changes and divide by the same total elapsed time.`;
      }
      if(name==='widths'){
        const row=M.intervals[Number(value('interval'))],change=M.amount(row),overall=M.combinedRate(M.intervals);
        display=table(['Interval','Input width','Average rate'],M.intervals.map(([a,b,r])=>[`[${a},${b}]`,b-a,r]),'Convert each interval average into a signed output change.')+`<p class="readout">Focus interval: [${row[0]},${row[1]}]. Recover its net change, then compare the four increases and combine the intervals.</p>`;
        check=()=>numeric('amount',change)&&numeric('overall',overall,.00051)&&value('most')==='3';explanation=`The focus change is ${row[2]} × ${row[1]-row[0]} = ${change}. The four signed changes are 14, −12, 12, 15. The greatest increase is 15 on [9,12]. The combined rate is (14−12+12+15)/12 = 29/12 ≈ 2.417.`;
      }
      if(name==='shape'){
        const model=M.shapes[value('model')],c=Number(value('c')),r=R.nearby(model.fn,c,.1);
        display=G.plot({title:'Read the direction and changing steepness near x='+c,bounds:model.bounds,stepY:4,curves:[{fn:model.fn},G.lineThrough(model.fn,c-.1,c),{...G.lineThrough(model.fn,c,c+.1),color:'#08796e'}],points:[{x:c,y:model.fn(c),label:'A'}]})+table(['x','f(x)'],[c-.1,c,c+.1].map(x=>[fmt(x),fmt(model.fn(x))]),'Nearby values: both one-sided intervals have width 0.1.');
        check=()=>value('sign')===model.sign&&value('bend')===model.bend&&numeric('left',r.left)&&numeric('right',r.right);explanation=`The left and right averages are ${fmt(r.left)} and ${fmt(r.right)}. The local rate is ${model.sign}; the signed averages are ${model.bend==='up'?'increasing':'decreasing'} as x increases. The graph is concave ${model.bend}.`;
      }
      if(name==='sum'){
        const k=value('model'),g=x=>M.g(x,k),h=x=>M.sum(x,k),rf=R.average(M.f,5,7),rg=R.average(g,5,7),rh=R.average(h,5,7);
        display='<p>Let f(x)=−2x. For x≤4, g(x)=−x. For x>4, '+(k==='varying'?'g(x)=−4+(x−4)².':`g(x)=−4+${k}(x−4).`)+ ' Compare the two functions and h=f+g.</p>'+G.plot({title:'f decreases; g decreases before x=4 and increases after x=4; h is their sum',bounds:[0,8,-20,14],stepX:1,stepY:5,curves:[{fn:M.f},{fn:g,dashed:true},{fn:h,color:'#861e42'}]})+'<p>Blue: f. Dashed gold: g. Maroon: h=f+g.</p>'+table(['x','f(x)','g(x)','h(x)'],[4,5,6,7,8].map(x=>[x,M.f(x),g(x),h(x)]),'Endpoint values for the common interval [5,7].')+'<p class="notice">A single average on [5,7] need not describe behavior throughout (4,8). Inspect the whole graph for the final choice.</p>';
        check=()=>numeric('f',rf)&&numeric('g',rg)&&numeric('h',rh)&&value('behavior')===M.sumBehavior(k);explanation=`The rates on [5,7] are ${rf}, ${rg}, and ${rh}; ${rf}+${rg}=${rh}. On (4,8), h is ${M.sumBehavior(k)==='mixed'?'decreasing until x=5, then increasing':M.sumBehavior(k)}. Before x=4 both functions decrease, so their sum decreases. Opposing signs alone do not decide the sum; exact cancellation can make it constant.`;
      }
      $('display').innerHTML=display;$('work').textContent=explanation;$('work').hidden=true;$('reveal').setAttribute('aria-expanded','false');$('feedback').textContent='';host.querySelectorAll('[data-response]').forEach(el=>el.value='');
    }
    host.querySelectorAll('[data-setting]').forEach(el=>el.addEventListener('change',update));
    host.querySelectorAll('[data-response]').forEach(el=>el.addEventListener('input',()=>{$('feedback').textContent='Response changed. Check again when ready.';$('work').hidden=true;$('reveal').setAttribute('aria-expanded','false');}));
    $('check').addEventListener('click',()=>{const correct=check();$('feedback').textContent=correct?'Correct. Explain how the signs and interval widths support your conclusion.':'Not yet. Check the signed changes, interval widths and the exact comparison requested.';$('feedback').className='feedback '+(correct?'good':'error');});
    $('reveal').addEventListener('click',()=>{$('work').hidden=!$('work').hidden;$('reveal').setAttribute('aria-expanded',String(!$('work').hidden));});
    $('reset').addEventListener('click',()=>{defaults.forEach(([el,v])=>el.value=v);update();});update();
  }
  window.RatesIdeas={graph,init(){document.querySelectorAll('[data-idea-plot]').forEach(el=>el.innerHTML=graph(el.dataset.ideaPlot));document.querySelectorAll('[data-idea-lab]').forEach(mount);}};
})();
