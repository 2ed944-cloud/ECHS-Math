'use strict';
window.ECHSTandemLabs=function({M,G,esc,feedback,renderMath,mathHTML}){
  function option(v,label){return '<option value="'+esc(v)+'">'+esc(label)+'</option>';}
  function select(id,label,values,setting=true){return '<label for="'+id+'">'+label+'<select id="'+id+'" '+(setting?'data-setting':'data-prediction')+'>'+values.map(v=>option(v[0],v[1])).join('')+'</select></label>';}
  function range(id,label,min,max,value,step){return '<label for="'+id+'">'+label+'<input id="'+id+'" data-setting type="range" min="'+min+'" max="'+max+'" value="'+value+'" step="'+step+'"></label>';}
  function field(id,label){return '<label for="'+id+'">'+label+'<input id="'+id+'" data-prediction type="text" autocomplete="off"></label>';}
  function table(rows,caption,heads){return '<div class="table-wrap"><table><caption>'+caption+'</caption><thead><tr>'+heads.map(h=>'<th scope="col">'+h+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(c=>'<td>'+c+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';}
  const directionChoices=[['','Choose'],['increasing','Increasing'],['decreasing','Decreasing'],['constant','Constant']];
  const shapeChoices=[['inc-linear','Steady rise'],['inc-up','Rise faster'],['inc-down','Rise more slowly'],['dec-linear','Steady fall'],['dec-up','Fall more slowly'],['dec-down','Fall faster'],['constant','Stay constant']];
  document.querySelectorAll('[data-tandem-lab]').forEach(host=>{
    const name=host.dataset.tandemLab,id='lab-'+name;let controls='',predictions='',check,work='';
    if(name==='reservoir'){controls=range(id+'-time','Time t, in minutes',0,8,1,.25);predictions=field(id+'-answer','Read V(t) from the graph, in liters');}
    if(name==='relation'){controls=[[-1,0],[0,1],[2,2]].map(([input,i])=>select(id+'-map'+i,'Output assigned to input '+input,[[1,'1'],[3,'3'],[5,'5'],['both','Both 1 and 3']])).join('');predictions=select(id+'-answer','Does this relation define a function?',[['','Choose'],['yes','Yes'],['no','No']],false);}
    if(name==='preimage'){controls=select(id+'-model','Choose a complete graph',[['quadratic','f(x) = x² − 1, domain [−3,3]'],['restricted','f(x) = x² − 1, domain [0,3]'],['wave','Piecewise-linear w, domain [−3,3]']])+select(id+'-level','Target output L',[[-2,'−2'],[-1,'−1'],[0,'0'],[2,'2'],[3,'3'],[4,'4'],[8,'8'],[9,'9']]);predictions=field(id+'-answer','Complete preimage: comma-separated inputs, or empty');}
    if(name==='direction'){controls=select(id+'-segment','Highlighted input interval',[[0,'From −4 to −2'],[1,'From −2 to 0'],[2,'From 0 to 2'],[3,'From 2 to 4']])+range(id+'-x','Trace an input x',-4,4,-3.5,.25);predictions=select(id+'-answer','Direction on the highlighted interval',directionChoices,false)+select(id+'-sign','Sign of the selected output',[['','Choose'],['positive','Positive'],['zero','Zero'],['negative','Negative']],false);}
    if(name==='concavity'){controls=select(id+'-shape','Choose a curve',Object.keys(M.shapes).map((key,i)=>[key,'Curve '+String.fromCharCode(65+i)]));predictions=select(id+'-direction','Output direction',directionChoices.slice(0,3),false)+select(id+'-concavity','Concavity',[['','Choose'],['up','Concave up'],['down','Concave down']],false)+select(id+'-rate','How does the rate of change vary?',[['','Choose'],['increasing','It increases'],['decreasing','It decreases']],false);}
    if(name==='builder'){controls=select(id+'-story','Context',Object.entries(M.stories).map(([key,s])=>[key,s.title]))+[0,1,2].map(i=>select(id+'-stage'+i,'Stage '+(i+1)+' · '+2*i+' to '+2*(i+1)+' minutes',shapeChoices)).join('');predictions='<p>Build the graph by choosing each stage. Then check its agreement with the story. Different exact heights can fit a qualitative description.</p>';}
    if(name==='evidence'){controls=select(id+'-view','Evidence to display',[['samples','Only the four samples'],['blue','One increasing graph'],['gold','Another matching graph'],['both','Compare both graphs']]);predictions=select(id+'-answer','Does the finite table alone establish increasing behavior at every intervening input?',[['','Choose'],['yes','Yes'],['no','No']],false);}
    if(name==='calculator'){controls=range(id+'-x','Input x',-5,6,1.7,.1)+select(id+'-window','Display window',[['full','Full stated domain: −5 ≤ x ≤ 6'],['cropped','Cropped display: −2 ≤ x ≤ 4']]);predictions=field(id+'-answer','Compute p(x); give at least three decimal places');}
    host.innerHTML='<div class="controls">'+controls+'</div><div class="lab-display" id="'+id+'-display"></div><div class="answer-grid">'+predictions+'</div><div class="actions"><button class="btn" id="'+id+'-check">Check reasoning</button><button class="btn secondary" id="'+id+'-reveal" aria-controls="'+id+'-work" aria-expanded="false">Compare the method</button></div><p class="feedback" id="'+id+'-feedback" role="status"></p><div class="solution" id="'+id+'-work" hidden></div>';
    const $=suffix=>host.querySelector('#'+id+'-'+suffix),v=s=>$(s).value;
    function update(){
      let display='';
      if(name==='reservoir'){
        const t=Number(v('time')),y=M.reservoir(t);
        display=G.plot({title:'Reservoir volume at t = '+t+' minutes',bounds:[0,8,0,40],stepY:10,xLabel:'time t (min)',yLabel:'volume V(t) (L)',curves:[{fn:M.reservoir}],vertical:t,points:[{x:t,y,selected:true,label:'('+t+', '+M.format(y)+')'}]})+'<p class="readout" aria-live="polite">Selected input: '+t+' minutes. The highlighted point gives the paired volume.</p>'+table([0,3,5,8].map(x=>[x,M.reservoir(x)]),'Key values in the complete piecewise-linear model',['Time (min)','Volume (L)']);
        check=()=>M.checkAnswer(v('answer'),{answer:y});
        work='<p>At time '+t+' minutes, V(t) = '+M.format(y)+' L. The volume increases until minute 3, remains 34 L through minute 5, then decreases. Moving the input moves its paired output.</p>';
      }
      if(name==='relation'){
        const inputs=[-1,0,2],outputs=[v('map0'),v('map1'),v('map2')],valid=!outputs.includes('both');
        let svg='<svg class="mapping-graph" viewBox="0 0 620 250" role="img" aria-label="Input-output mapping; each row starts with one input"><title>Input-output mapping</title><text x="80" y="25">Inputs</text><text x="470" y="25">Outputs</text>';
        inputs.forEach((x,i)=>svg+='<circle cx="100" cy="'+(65+70*i)+'" r="22"/><text x="100" y="'+(71+70*i)+'" text-anchor="middle">'+x+'</text>');
        [1,3,5].forEach((y,i)=>svg+='<circle cx="500" cy="'+(65+70*i)+'" r="22"/><text x="500" y="'+(71+70*i)+'" text-anchor="middle">'+y+'</text>');
        outputs.forEach((y,i)=>(y==='both'?[1,3]:[Number(y)]).forEach(z=>{const end=65+70*[1,3,5].indexOf(z);svg+='<path d="M 125 '+(65+70*i)+' C 270 '+(65+70*i)+', 350 '+end+', 473 '+end+'" fill="none" stroke="#315d8f" stroke-width="3"/><path d="M 463 '+(end-5)+' L 473 '+end+' L 463 '+(end+5)+'" fill="none" stroke="#315d8f" stroke-width="3"/>';}));
        display=svg+'</svg><p>Try assigning all inputs the same output. Then assign two outputs to just one input.</p>';
        check=()=>({correct:v('answer')===(valid?'yes':'no'),message:'Inspect whether any one input has two output arrows.'});
        const range=[...new Set(outputs.map(Number))].sort((a,b)=>a-b);
        work=valid?'<p>This is a function: each input has exactly one output. Its domain is {−1,0,2} and its range is {'+range.join(', ')+'}. Repeated outputs are allowed.</p>':'<p>This relation is not a function because at least one input has both outputs 1 and 3. The number of arrows leaving an input is what matters.</p>';
      }
      if(name==='preimage'){
        const model=v('model'),level=Number(v('level')),roots=M.preimage(model==='wave'?'wave':'quadratic',level,model==='restricted'),low=model==='restricted'?0:-3;
        const curve=model==='wave'?{points:M.wave}:{fn:x=>x*x-1,from:low,to:3};
        display=G.plot({title:'Preimage of '+level+' on the stated complete domain',bounds:[-3.5,3.5,-3,10],stepY:2,curves:[curve],horizontal:level,points:roots.map(x=>({x,y:level,selected:true})),yLabel:model==='wave'?'w(x)':'f(x)'})+'<p class="readout">Read every input where the graph meets the horizontal line y = '+level+'. '+(model==='restricted'?'The domain is restricted to [0,3].':'The domain is [−3,3].')+'</p><p>Decimal approximations to six decimal places are sufficient for irrational inputs.</p>';
        check=()=>({correct:M.sameSet(v('answer'),roots),message:'Check all intersections and the stated domain. Enter the input values, not the target output.'});
        work='<p>The preimage is '+(roots.length?'{'+roots.map(x=>M.format(x,6)).join(', ')+'}':'empty')+'. '+(model==='wave'?'Read the line-segment intersections.':'Solve x² − 1 = '+level+' within the domain, keeping each allowable input.')+' One input still has only one output even when this set has several members.</p>';
      }
      if(name==='direction'){
        const i=Number(v('segment')),x=Number(v('x')),y=M.linear(M.reader,x),dir=['increasing','constant','decreasing','increasing'][i],sign=y===0?'zero':y>0?'positive':'negative';
        display=G.plot({title:'Direction on a highlighted interval and sign at a selected input',curves:[{points:M.reader}],shade:[M.reader[i][0],M.reader[i+1][0]],points:[{x,y,selected:true,label:'('+M.format(x)+', '+M.format(y)+')'}]})+'<p class="readout">The highlighted interval is from '+M.reader[i][0]+' to '+M.reader[i+1][0]+'. The selected input is '+x+'.</p><p>Answer direction for the interval, and sign for the selected point. These are different questions.</p>';
        check=()=>({correct:v('answer')===dir&&v('sign')===sign,message:'Read the highlighted segment from left to right; then compare the selected point with the x-axis.'});
        work='<p>The function is '+dir+' on the highlighted interval. At x = '+x+', the output '+M.format(y)+' is '+sign+'. A negative output may belong to an increasing function.</p>';
      }
      if(name==='concavity'){
        const shape=M.shapes[v('shape')],rows=Array.from({length:5},(_,x)=>[x,shape.fn(x),x?M.format(shape.fn(x)-shape.fn(x-1)):'—']);
        display=G.plot({title:'Curve '+String.fromCharCode(65+Object.keys(M.shapes).indexOf(v('shape'))),bounds:[0,4,0,10],stepY:2,curves:[{fn:shape.fn}],points:[0,1,2,3,4].map(x=>({x,y:shape.fn(x)}))})+table(rows,'Equal input steps; compare output changes qualitatively',['Input','Output','Change since previous input']);
        check=()=>({correct:v('direction')===shape.direction&&v('concavity')===shape.concavity&&v('rate')===shape.rate,message:'Separate output direction from the way the rate of change varies.'});
        work='<p>The output '+shape.words+'. The function is '+shape.direction+' and the graph is concave '+shape.concavity+'. Its rate of change is '+shape.rate+'. For a falling output, a less negative rate means the rate is increasing.</p>';
      }
      if(name==='builder'){
        const story=v('story'),s=M.stories[story],keys=[v('stage0'),v('stage1'),v('stage2')],values=Array.from({length:121},(_,i)=>M.storyValue(keys,i/20,story));
        const low=Math.min(0,...values),high=Math.max(s.start+40,...values)+20;
        display='<p class="story-prompt">'+esc(s.text)+'</p>'+G.plot({title:'Your constructed graph for '+s.title,bounds:[0,6,Math.floor(low/20)*20,Math.ceil(high/20)*20],stepY:40,xLabel:s.input,yLabel:s.output,curves:[{fn:t=>M.storyValue(keys,t,story)}]})+'<p>Each nonconstant stage in this builder changes the output by 40 units. The stage shapes determine whether your construction matches the qualitative story.</p>';
        check=()=>({correct:M.storyCorrect(keys,story),message:'Check each stage against the story: direction first, then whether it becomes steeper or flatter.'});
        work='<p>One valid sequence is '+s.expected.map(k=>shapeChoices.find(([v])=>v===k)[1]).join(' → ')+'.</p>'+G.plot({title:'One valid model for '+s.title,bounds:[0,6,0,160],stepY:40,xLabel:s.input,yLabel:s.output,curves:[{fn:t=>M.storyValue(s.expected,t,story)}]})+'<p>The axes represent quantities, not a picture of the physical object. An alternative graph is valid if it satisfies the given values and all qualitative stages.</p>';
      }
      if(name==='evidence'){
        const view=v('view'),curves=[];if(view==='blue'||view==='both')curves.push({fn:x=>x*x});if(view==='gold'||view==='both')curves.push({points:M.evidence,color:'#a26714',dashed:true});
        display=G.plot({title:'Finite observations and optional matching graphs',bounds:[0,3,-2,10],stepY:2,curves,points:[0,1,2,3].map(x=>({x,y:x*x}))})+table([0,1,2,3].map(x=>[x,x*x]),'Only these four sampled values are given',['Input x','Output f(x)'])+'<p>Blue: one increasing possibility. Dashed gold: a different possibility through the same four points. Change the display to compare.</p>';
        check=()=>({correct:v('answer')==='no',message:'The table fixes the listed values; examine a graph that changes direction between them.'});
        work='<p>No. Both graphs match every listed value, but the gold graph decreases from x = 0.5 to x = 1.5. The samples establish their own values, not the behavior at all unlisted inputs.</p>';
      }
      if(name==='calculator'){
        const x=Number(v('x')),y=M.polynomial(x),cropped=v('window')==='cropped',bounds=cropped?[-2,4,-6,6]:[-5,6,-6,6];
        display=mathHTML('<p>Graph \\(p(x)=0.08(x+4)(x-1)(x-5)\\), with stated domain \\([-5,6]\\).</p>')+G.plot({title:'Calculator-style display of p, input '+x,bounds,stepY:2,curves:[{fn:M.polynomial,from:-5,to:6}],points:[{x,y,selected:true}],yLabel:'p(x)'})+'<p class="readout">Selected input: '+x+'. '+(x<bounds[0]||x>bounds[1]?'This input is outside the display window but remains in the stated domain.':'The marker lies in the current display window.')+'</p><p>On your GDC, enter the complete expression, set the displayed window, and use a value or trace command. A cropped window does not change the function’s domain.</p>';
        check=()=>M.checkAnswer(v('answer'),{answer:y,tolerance:.00051});
        work='<p>p('+x+') = '+M.format(y,6)+', which is '+y.toFixed(3)+' to three decimal places. In a full-domain graph the turning inputs are approximately −1.94 and 3.27; zeros are −4, 1 and 5.</p><p>Use graph-reading language for estimated features. Retain the full stored value until rounding a final answer.</p>';
      }
      $('display').innerHTML=display;$('work').innerHTML=mathHTML(work);$('work').hidden=true;$('reveal').setAttribute('aria-expanded','false');
      host.querySelectorAll('[data-prediction]').forEach(n=>n.value='');feedback($('feedback'),'');renderMath(host);
    }
    host.querySelectorAll('[data-setting]').forEach(n=>n.addEventListener(n.type==='range'?'input':'change',update));
    host.querySelectorAll('[data-prediction]').forEach(n=>n.addEventListener('input',()=>{feedback($('feedback'),'Response changed. Check again when ready.');$('work').hidden=true;$('reveal').setAttribute('aria-expanded','false');}));
    $('check').addEventListener('click',()=>{const result=check();feedback($('feedback'),result.correct?'Correct. Compare the method and explain the evidence.':result.message,result.correct?'good':'error');});
    $('reveal').addEventListener('click',()=>{$('work').hidden=!$('work').hidden;$('reveal').setAttribute('aria-expanded',String(!$('work').hidden));});
    update();
  });
};
