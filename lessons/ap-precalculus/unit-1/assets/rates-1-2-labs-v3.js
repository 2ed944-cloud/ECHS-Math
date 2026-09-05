'use strict';
window.ECHSRatesLabs=function({M,G,esc,feedback,renderMath,mathHTML}){
  const option=(v,label)=>'<option value="'+esc(v)+'">'+esc(label)+'</option>';
  const select=(id,label,values,setting=true)=>'<label for="'+id+'">'+label+'<select id="'+id+'" '+(setting?'data-setting':'data-prediction')+'>'+values.map(v=>option(v[0],v[1])).join('')+'</select></label>';
  const field=(id,label)=>'<label for="'+id+'">'+label+'<input id="'+id+'" data-prediction type="text" autocomplete="off"></label>';
  const range=(id,label,min,max,value,step)=>'<label for="'+id+'">'+label+'<input id="'+id+'" data-setting type="range" min="'+min+'" max="'+max+'" value="'+value+'" step="'+step+'"></label>';
  const table=(rows,caption,heads)=>'<div class="table-wrap"><table class="rate-table"><caption>'+caption+'</caption><thead><tr>'+heads.map(h=>'<th scope="col">'+h+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(v=>'<td>'+v+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
  const widths=[[1,'1'],[.5,'0.5'],[.1,'0.1'],[.01,'0.01']];
  const rankChoices=[['','Choose'],['A','Point / interval A'],['B','Point / interval B']];
  document.querySelectorAll('[data-rates-lab]').forEach(host=>{
    const name=host.dataset.ratesLab,id='lab-'+name;let controls='',predictions='',check=()=>({correct:false,message:'Enter your response.'}),work='';
    if(name==='tank'){controls=select(id+'-a','Initial input a (min)',M.tank.map(([t])=>[t,t]))+select(id+'-b','Final input b (min)',[2,5,8,0].map(t=>[t,t]));predictions=field(id+'-change','Net volume change from a to b (L)')+field(id+'-answer','Average rate (L/min)');}
    if(name==='secant'){controls=select(id+'-model','Choose the function',Object.entries(M.functions).map(([k,f])=>[k,f.name]))+range(id+'-a','First input a',-1,5,1,.25)+range(id+'-b','Second input b',-1,5,4,.25);predictions=field(id+'-answer','Average rate between the two inputs');}
    if(name==='zero'){controls=select(id+'-model','Graph on [0,4]',[['flat','Flat'],['hump','Rise then fall'],['valley','Fall then rise']]);predictions=field(id+'-answer','Average rate on [0,4]')+select(id+'-constant','Is this particular graph constant?',[['','Choose'],['yes','Yes'],['no','No']],false);}
    if(name==='unequal'){controls=select(id+'-model','Compare two intervals',Object.entries(M.comparisons).map(([k,c])=>[k,c.title]));predictions=field(id+'-aRate','Average rate over interval A')+field(id+'-bRate','Average rate over interval B')+select(id+'-answer','Which signed average rate is greater?',rankChoices,false);}
    if(name==='local'){controls=select(id+'-c','Point of interest c',[[1,'1'],[2,'2'],[3,'3']])+select(id+'-h','Distance h to each neighbor',widths);predictions=field(id+'-left','Average on [c−h,c]')+field(id+'-right','Average on [c,c+h]')+field(id+'-answer','Average on [c−h,c+h]');}
    if(name==='compare'){controls=select(id+'-model','Function and two points',Object.entries(M.compareModels).map(([k,f])=>[k,f.name]))+select(id+'-h','Half-width h',widths.slice(1));predictions=field(id+'-aRate','Centered average near point A')+field(id+'-bRate','Centered average near point B')+select(id+'-answer','Which signed local-rate estimate is greater?',rankChoices,false)+select(id+'-magnitude','Which estimate has greater magnitude?',rankChoices,false);}
    if(name==='shared'){controls=select(id+'-c','Compare near this input',[[1,'1'],[3,'3']])+select(id+'-h','Half-width h',widths.slice(1));predictions=field(id+'-answer','Whole-interval average on [0,4], for either graph')+select(id+'-greater','Which centered local-rate estimate is greater?',[['','Choose'],['line','Solid blue L'],['curve','Dashed gold F']],false);}
    if(name==='corner'){controls=select(id+'-model','Inspect local behavior',[['corner','F(x) = |x−2|+1'],['smooth','H(x) = (x−2)²+1']])+select(id+'-h','Distance h from x = 2',widths);predictions=field(id+'-left','Left average on [2−h,2]')+field(id+'-right','Right average on [2,2+h]')+select(id+'-answer','Do shrinking intervals support a common finite rate at x = 2?',[['','Choose'],['yes','Yes'],['no','No']],false);}
    if(name==='calculator'){controls=select(id+'-model','Choose a calculation',M.calculatorCases.map((c,i)=>[i,c.label]));predictions=field(id+'-answer','Average rate over the stated interval (3 decimal places or more)');}
    if(name==='precision'){controls=select(id+'-h','Half-width h',widths)+select(id+'-dp','Displayed decimal places',[[1,'1'],[2,'2'],[4,'4'],[6,'6']]);predictions=field(id+'-answer','Average rate computed from the rounded displayed outputs')+select(id+'-claim','If the displayed quotient is zero, does that alone prove a zero rate for the underlying function?',[['','Choose'],['yes','Yes'],['no','No']],false);}
    host.innerHTML='<div class="controls">'+controls+'</div><div class="lab-display" id="'+id+'-display"></div><div class="answer-grid">'+predictions+'</div><div class="actions"><button class="btn" id="'+id+'-check">Check reasoning</button><button class="btn secondary" id="'+id+'-reveal" aria-controls="'+id+'-work" aria-expanded="false">Compare the method</button></div><p class="feedback" id="'+id+'-feedback" role="status"></p><div class="solution" id="'+id+'-work" hidden></div>';
    const $=suffix=>host.querySelector('#'+id+'-'+suffix),v=s=>$(s).value,n=s=>Number(v(s));
    const numeric=(key,value,tolerance=1e-7)=>M.checkAnswer(v(key),{answer:value,tolerance}).correct;
    function update(){
      let display='',invalid=false;
      if(name==='tank'){
        const a=n('a'),b=n('b'),u=M.linear(M.tank,a),w=M.linear(M.tank,b),rate=M.average(x=>M.linear(M.tank,x),a,b);
        invalid=a===b;
        display=table(M.tank,'Selected measured values; no intervening values are specified.',['Time (min)','Volume (L)'])+G.plot({title:'Selected measurements and endpoint comparison',bounds:[0,8,650,950],stepY:50,xLabel:'time (min)',yLabel:'volume (L)',curves:invalid?[]:[{points:[[a,u],[b,w]],color:'#a26714',dashed:true}],points:M.tank.map(([x,y])=>({x,y,selected:x===a||x===b}))})+'<p class="readout">a = '+a+', V(a) = '+u+'; b = '+b+', V(b) = '+w+'. The dashed line is a constant-rate comparison, not a claim about the unmeasured tank volume.</p>';
        check=()=>({correct:numeric('change',w-u)&&numeric('answer',rate),message:'Compute final minus initial volume and divide by b − a. Keep the subtraction order consistent.'});
        work='<p>Output change = '+M.format(w-u)+' L; input change = '+M.format(b-a)+' min; average rate = '+M.format(rate)+' L/min. Reversing both endpoint orders reverses both changes and preserves the average rate.</p>';
      }
      if(name==='secant'){
        const f=M.functions[v('model')],a=n('a'),b=n('b'),rate=M.average(f.fn,a,b);invalid=a===b;
        display=G.plot({title:f.name+' with a comparison line',bounds:f.bounds,stepY:2,curves:[{fn:f.fn},...(invalid?[]:[G.lineThrough(f.fn,a,b),{points:[[a,f.fn(a)],[b,f.fn(a)],[b,f.fn(b)]],color:'#08796e',dashed:true}])],points:invalid?[{x:a,y:f.fn(a),selected:true,label:'A = B ('+a+', '+M.format(f.fn(a))+')'}]:[{x:a,y:f.fn(a),selected:true,label:'A ('+a+', '+M.format(f.fn(a))+')'},{x:b,y:f.fn(b),selected:true,label:'B ('+b+', '+M.format(f.fn(b))+')'}]})+'<p class="readout">a = '+a+', b = '+b+'. Blue: function. Dashed gold: endpoint comparison. Dashed green: input and output changes.</p>';
        check=()=>M.checkAnswer(v('answer'),{answer:rate});
        work='<p>The output change is '+M.format(f.fn(b)-f.fn(a))+' and the input change is '+M.format(b-a)+'. Their ratio is '+M.format(rate)+'. This is the slope of the straight comparison through the two graph points, also called a secant line.</p>';
      }
      if(name==='zero'){
        const model=v('model'),fn=M.zeroModels[model];
        display=G.plot({title:'Equal endpoint outputs with '+model+' behavior',bounds:[0,4,0,18],stepY:3,curves:[{fn}],points:[{x:0,y:5,label:'(0,5)'},{x:4,y:5,label:'(4,5)'}]});
        check=()=>({correct:numeric('answer',0)&&v('constant')===(model==='flat'?'yes':'no'),message:'Use the endpoint quotient, then inspect the entire graph separately.'});
        work='<p>The average is (5 − 5)/4 = 0 for all three graphs. '+(model==='flat'?'This graph is constant because every output is 5.':'This graph is not constant: its middle output is '+fn(2)+', different from 5.')+' Equal endpoint outputs alone do not determine interior behavior.</p>';
      }
      if(name==='unequal'){
        const c=M.comparisons[v('model')],a=c.a[0]/c.a[1],b=c.b[0]/c.b[1];
        display=table([['A',c.a[0],c.a[1]],['B',c.b[0],c.b[1]]],c.title,['Interval','Output change ('+c.output+')','Input change ('+c.input+')'])+'<p>Each requested rate has units '+c.output+' per '+c.input+'. The intervals have different lengths.</p>';
        check=()=>({correct:numeric('aRate',a)&&numeric('bRate',b)&&v('answer')===(a>b?'A':'B'),message:'Divide each output change by its own input change. Compare signed values on the number line.'});
        work='<p>Rate A = '+c.a[0]+'/'+c.a[1]+' = '+a+'; rate B = '+c.b[0]+'/'+c.b[1]+' = '+b+'. '+(a>b?'A':'B')+' has the greater signed average rate. Comparing raw output changes alone would ignore the different interval lengths.</p>';
      }
      if(name==='local'){
        const c=n('c'),h=n('h'),fn=x=>x*x,pair=M.nearby(fn,c,h);
        display=G.plot({title:'Nearby intervals for f(x) = x² at c = '+c,bounds:[c-1,c+1,Math.max(0,(c-1)**2-1),(c+1)**2+1],stepY:2,curves:[{fn},G.lineThrough(fn,c-h,c),{...G.lineThrough(fn,c,c+h),color:'#08796e'}],points:[c-h,c,c+h].map(x=>({x,y:fn(x),selected:x===c}))})+table([c-h,c,c+h].map(x=>[M.format(x),M.format(fn(x))]),'Function f(x) = x²; values are exact at these decimal inputs.',['Input x','Output f(x)'])+'<p class="readout">c = '+c+'; h = '+h+'. Each side has width h; the whole centered interval has width 2h = '+M.format(2*h)+'.</p>';
        check=()=>({correct:numeric('left',pair.left)&&numeric('right',pair.right)&&numeric('answer',pair.center),message:'Use the correct endpoint pairs: left and right widths are h; centered width is 2h.'});
        work='<p>The left, right and centered averages are '+[pair.left,pair.right,pair.center].map(x=>M.format(x)).join(', ')+'. Try smaller h and compare both sides. These values support a rate near '+M.format(2*c)+' at x = '+c+'. The centered quotient is an interval calculation; it is not by itself proof of a point rate.</p>';
      }
      if(name==='compare'){
        const f=M.compareModels[v('model')],h=n('h'),a=M.nearby(f.fn,f.a,h),b=M.nearby(f.fn,f.b,h),winner=a.center>b.center?'A':'B',mag=Math.abs(a.center)>Math.abs(b.center)?'A':'B';
        display='<p>'+esc(f.name)+'. Point A has input '+f.a+'; point B has input '+f.b+'. Use the same half-width h = '+h+'.</p>'+G.plot({title:'Compare rates at inputs '+f.a+' and '+f.b,bounds:f.bounds,stepY:5,curves:[{fn:f.fn},G.lineThrough(f.fn,f.a-h,f.a+h),{...G.lineThrough(f.fn,f.b-h,f.b+h),color:'#08796e'}],points:[f.a,f.b].map(x=>({x,y:f.fn(x),selected:true,label:'('+x+', '+M.format(f.fn(x))+')'}))})+table([['A',M.format(f.a-h),M.format(f.fn(f.a-h)),M.format(f.a+h),M.format(f.fn(f.a+h))],['B',M.format(f.b-h),M.format(f.fn(f.b-h)),M.format(f.b+h),M.format(f.fn(f.b+h))]],'Endpoint values for equal-width nearby intervals',['Point','Left input','Left output','Right input','Right output']);
        check=()=>({correct:numeric('aRate',a.center)&&numeric('bRate',b.center)&&v('answer')===winner&&v('magnitude')===mag,message:'Compute each centered quotient, then compare its signed value and absolute value separately.'});
        work='<p>Centered estimates: A = '+M.format(a.center)+', B = '+M.format(b.center)+'. '+winner+' has the greater signed rate; '+mag+' has the greater magnitude. Left/right pairs are ('+M.format(a.left)+', '+M.format(a.right)+') at A and ('+M.format(b.left)+', '+M.format(b.right)+') at B. Narrow the intervals to see whether the estimates remain consistent.</p>';
      }
      if(name==='shared'){
        const c=n('c'),h=n('h'),a=M.nearby(x=>M.shared('line',x),c,h).center,b=M.nearby(x=>M.shared('curve',x),c,h).center;
        display=G.graph('shared')+'<p class="rates-legend"><span class="blue">Solid blue: L(x) = 2x + 1</span><span class="gold">Dashed gold: F(x) = 2x + 1 + 2x(4−x)</span></p>'+table([['L',M.format(M.shared('line',c-h)),M.format(M.shared('line',c+h))],['F',M.format(M.shared('curve',c-h)),M.format(M.shared('curve',c+h))]],'Nearby endpoint outputs at x = '+M.format(c-h)+' and x = '+M.format(c+h),['Function','Left output','Right output']);
        check=()=>({correct:numeric('answer',2)&&v('greater')===(a>b?'line':'curve'),message:'Both whole-interval averages use (0,1) and (4,9). Compare the separate nearby quotients at the selected input.'});
        work='<p>Both full averages equal 2. Near x = '+c+', the centered averages are '+M.format(a)+' for L and '+M.format(b)+' for F. Matching a whole-interval average does not require matching local behavior.</p>';
      }
      if(name==='corner'){
        const model=v('model'),fn=model==='corner'?M.corner:M.smooth,h=n('h'),rates=M.nearby(fn,2,h);
        display=G.plot({title:model==='corner'?'A corner at x = 2':'A smooth turn at x = 2',bounds:[1,3,.5,2.5],stepX:.5,stepY:.5,curves:[{fn},G.lineThrough(fn,2-h,2+h)],points:[2-h,2,2+h].map(x=>({x,y:fn(x),selected:x===2}))})+table([2-h,2,2+h].map(x=>[M.format(x),M.format(fn(x))]),'Compare both sides before using a centered average',['Input','Output'])+'<p class="readout">The centered average on [2−h,2+h] is '+M.format(rates.center)+'. Does that tell the whole story? Try several smaller h values.</p>';
        check=()=>({correct:numeric('left',rates.left)&&numeric('right',rates.right)&&v('answer')===(model==='smooth'?'yes':'no'),message:'Compare the two side averages as h decreases; a centered quotient can hide disagreement.'});
        work='<p>The side averages are '+M.format(rates.left)+' and '+M.format(rates.right)+'. '+(model==='corner'?'They remain −1 and 1 for every chosen h. There is no common finite rate at this corner. The centered value 0 cancels two different behaviors.':'The side averages are −h and h. Both get closer to 0 as h decreases, supporting a local estimate about 0.')+' No derivative formula is needed for these comparisons.</p>';
      }
      if(name==='calculator'){
        const c=M.calculatorCases[n('model')],rate=M.average(M.remaining,c.a,c.b);
        display=mathHTML('<p>Use \\(R(t)=120/(t+1)\\), with domain \\([0,8]\\), time in minutes and remaining water in liters.</p>')+G.plot({title:'Remaining water and selected comparison interval',bounds:[0,8,0,130],stepY:20,xLabel:'time t (min)',yLabel:'remaining R(t) (L)',curves:[{fn:M.remaining},G.lineThrough(M.remaining,c.a,c.b)],points:[c.a,c.b].map(x=>({x,y:M.remaining(x),selected:true}))})+'<p class="readout">Calculate [R('+c.b+') − R('+c.a+')] / ('+c.b+' − '+c.a+'). '+(c.point===null?'Report an average over this whole interval.':'Use this small-interval average to estimate the rate at t = '+c.point+'.')+'</p><ol><li>Enter the function with the denominator (t+1) grouped.</li><li>Use a table or value command at both specified inputs.</li><li>Store the full endpoint values; group the whole numerator and denominator in the quotient.</li><li>Round the final result and include L/min.</li></ol>';
        check=()=>M.checkAnswer(v('answer'),{answer:rate,tolerance:.00051});
        work='<p>R('+c.a+') = '+M.format(M.remaining(c.a),9)+'… and R('+c.b+') = '+M.format(M.remaining(c.b),9)+'…. The average rate is '+rate.toFixed(3)+' L/min to three decimal places. '+(c.point===null?'This is an interval average.':'It is used here as an approximate point rate.')+' A negative value means the remaining volume falls as time increases.</p>';
      }
      if(name==='precision'){
        const h=n('h'),dp=n('dp'),p=M.precision(h,dp);
        display=mathHTML('<p>The underlying model is \\(K(x)=5+0.04x\\). Compare the effect of interval width and displayed precision near x = 2.</p>')+table([[M.format(p.a),p.shownA.toFixed(dp)],[M.format(p.b),p.shownB.toFixed(dp)]],'Use these rounded displayed outputs in your first calculation.',['Input','Displayed output'])+'<p class="readout">Input width = '+M.format(2*h)+'. Display precision = '+dp+' decimal place'+(dp===1?'':'s')+'. Changing the display does not change the underlying function.</p>';
        check=()=>({correct:numeric('answer',p.rate,1e-6)&&v('claim')==='no',message:'Compute from the rounded displayed outputs, then consider what rounding may have concealed.'});
        work='<p>The displayed quotient is '+M.format(p.rate)+'. Full stored outputs are '+M.format(p.u,9)+' and '+M.format(p.v,9)+', giving 0.04. A small denominator can magnify rounding effects; if the rounded outputs coincide, the displayed quotient may be zero even when the actual change is not.</p>';
      }
      if(invalid){display+='<p class="notice" role="status">Choose two distinct inputs. A zero-width interval has no defined average-rate quotient.</p>';work='<p>The denominator b − a is zero. Choose distinct inputs before calculating an average rate.</p>';}
      $('check').disabled=invalid;$('display').innerHTML=display;$('work').innerHTML=mathHTML(work);$('work').hidden=true;$('reveal').setAttribute('aria-expanded','false');
      host.querySelectorAll('[data-prediction]').forEach(n=>n.value='');feedback($('feedback'),'');renderMath(host);
    }
    host.querySelectorAll('[data-setting]').forEach(n=>n.addEventListener(n.type==='range'?'input':'change',update));
    host.querySelectorAll('[data-prediction]').forEach(n=>n.addEventListener('input',()=>{feedback($('feedback'),'Response changed. Check again when ready.');$('work').hidden=true;$('reveal').setAttribute('aria-expanded','false');}));
    $('check').addEventListener('click',()=>{if($('check').disabled)return;const r=check();feedback($('feedback'),r.correct?'Correct. Compare the method and explain the evidence.':r.message,r.correct?'good':'error');});
    $('reveal').addEventListener('click',()=>{$('work').hidden=!$('work').hidden;$('reveal').setAttribute('aria-expanded',String(!$('work').hidden));});
    update();
  });
};
