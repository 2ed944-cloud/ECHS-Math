/* Fixed mathematical investigations: no remote calculator dependency. */
window.ECHSPrecisionLabs=function(ctx){
  'use strict';
  const {M,esc,feedback,renderMath,mathHTML}=ctx;
  const presets={
    normalize:[
      {label:'A tiny measurement',value:'0.0000725',answer:7.25e-5,tex:'7.25\\times10^{-5}',explain:'The coefficient is 7.25. A power of −5 makes the result smaller, matching 0.0000725.'},
      {label:'A large data file',value:'5240000',answer:5240000,tex:'5.24\\times10^6',explain:'Move the decimal point six places left to make 5.24, then compensate with 10⁶.'},
      {label:'A coefficient that needs normalizing',value:'48 × 10^−4',answer:.0048,tex:'4.8\\times10^{-3}',explain:'Dividing 48 by 10 requires increasing the exponent by 1 to preserve the value.'}
    ],
    operations:[
      {label:'Multiply',tex:'(6.4\\times10^5)(3\\times10^{-3})',answer:1920,result:'1.92\\times10^3',explain:'Multiply coefficients: 19.2. Add exponents: 2. Normalize 19.2 × 10² to 1.92 × 10³.'},
      {label:'Divide',tex:'\\frac{8.4\\times10^{-5}}{2\\times10^3}',answer:4.2e-8,result:'4.2\\times10^{-8}',explain:'Divide coefficients and subtract exponents: −5 − 3 = −8.'},
      {label:'Add',tex:'4.2\\times10^6+7.5\\times10^5',answer:4.95e6,result:'4.95\\times10^6',explain:'First write 7.5 × 10⁵ as 0.75 × 10⁶. Then add 4.2 + 0.75. Do not add exponents.'},
      {label:'Subtract',tex:'5.6\\times10^4-8\\times10^3',answer:48000,result:'4.8\\times10^4',explain:'Use the same power: (5.6 − 0.8) × 10⁴.'}
    ],
    rounding:[
      {label:'Leading zeros and a retained zero',value:'0.005070',mode:'sf',digits:3},
      {label:'Decimal places with trailing zeros',value:'6.2048',mode:'dp',digits:2},
      {label:'A carry changes the first significant place',value:'0.009996',mode:'sf',digits:3},
      {label:'A halfway decimal',value:'2.675',mode:'dp',digits:2}
    ],
    bounds:[
      {label:'8.4 cm, nearest 0.1 cm',value:8.4,unit:.1,units:'cm'},
      {label:'3.60 kg, three significant figures',value:3.60,unit:.01,units:'kg'},
      {label:'750 mL, nearest 10 mL',value:750,unit:10,units:'mL'}
    ],
    error:[
      {label:'Underestimate: 78.6 g versus exact 80 g',approx:78.6,exact:80},
      {label:'Overestimate: 81.4 g versus exact 80 g',approx:81.4,exact:80},
      {label:'Different reference: 78.6 versus exact 81.4',approx:78.6,exact:81.4}
    ],
    calculator:[
      {label:'Scientific quotient',entry:'(4.8*10^7)/(1.2*10^3)',answer:40000,result:'4\\times10^4',steps:['Open a Calculator page. Enter the entire numerator and denominator in parentheses.','Use the multiplication and power keys to enter 10 raised to each exponent. Press the right arrow to leave an exponent template.','Press Enter, or Ctrl + Enter for a decimal approximation. Interpret 40000 as 4 × 10⁴ in your written response.']},
      {label:'Keep the exact fraction',entry:'(7/12)*360',answer:210,result:'210',steps:['Enter the fraction in parentheses before multiplying.','Press Enter. Auto mode may preserve exact fractions; Ctrl + Enter requests a decimal approximation.','Record 210. Do not replace 7/12 with 0.58 before multiplying.']},
      {label:'Percentage error',entry:'abs(78.6-80)/abs(80)*100',answer:1.75,result:'1.75\\%',steps:['Use the Catalog for abs( if needed, or type the function in a Calculator page.','Put the reference (exact) value 80 in the denominator. Enter the full expression as shown.','Press Ctrl + Enter. Record 1.75% and identify 80 g as the reference value.']}
    ]
  };
  function option(value,label){return '<option value="'+esc(value)+'">'+esc(label)+'</option>';}
  function select(id,label,choices){return '<label for="'+id+'">'+label+'<select id="'+id+'" data-setting>'+choices.map((v,i)=>option(i,v.label)).join('')+'</select></label>';}
  function input(id,label){return '<label for="'+id+'">'+label+'<input id="'+id+'" data-prediction type="text" autocomplete="off"></label>';}
  function line(low,high,lowClosed,point){
    const mid=(low+high)/2,fmt=v=>M.format(v,10),x=point===undefined?null:100+400*(point-low)/(high-low);
    return '<svg class="interval-graph" viewBox="0 0 600 155" role="img" aria-label="'+esc((lowClosed?'Closed':'Open')+' lower endpoint '+fmt(low)+', open upper endpoint '+fmt(high)+(point===undefined?'':', selected value '+fmt(point)))+'"><line x1="35" y1="70" x2="565" y2="70" stroke="#768399" stroke-width="2"/><line x1="100" y1="70" x2="500" y2="70" stroke="#315d8f" stroke-width="7"/><circle cx="100" cy="70" r="8" fill="'+(lowClosed?'#315d8f':'white')+'" stroke="#315d8f" stroke-width="3"/><circle cx="500" cy="70" r="8" fill="white" stroke="#315d8f" stroke-width="3"/><text x="100" y="112" text-anchor="middle">'+fmt(low)+'</text><text x="300" y="140" text-anchor="middle">Endpoint values shown to 10 significant figures</text><text x="500" y="112" text-anchor="middle">'+fmt(high)+'</text>'+(x===null?'':'<path d="M '+x+' 30 v 24" stroke="#08796e" stroke-width="4"/><text x="300" y="22" text-anchor="middle">Selected: '+fmt(point)+'</text>')+'</svg>';
  }
  document.querySelectorAll('[data-lab]').forEach(host=>{
    const name=host.dataset.lab,id='lab-'+name;
    let controls='',prompt='',answerSpec,explanation='';
    if(presets[name])controls=select(id+'-model','Choose a case',presets[name]);
    if(name==='bounds')controls+='<label for="'+id+'-sample">Test a point across the interval<input data-setting id="'+id+'-sample" type="range" min="-10" max="110" step="1" value="50"></label>';
    if(name==='calculated')controls='<label for="'+id+'-op">Combine A and B<select data-setting id="'+id+'-op">'+[['sum','A + B'],['difference','A − B'],['product','AB'],['quotient','A / B']].map(v=>option(...v)).join('')+'</select></label>';
    if(name==='guard')controls='<label for="'+id+'-digits">Round 7/12 at this intermediate step<select data-setting id="'+id+'-digits">'+[1,2,3,4,6].map(v=>option(v,v+' decimal places')).join('')+'</select></label>';
    host.innerHTML='<div class="controls">'+controls+'</div><div class="lab-display" id="'+id+'-display" aria-live="polite"></div><div class="answer-grid">'+input(id+'-answer','Your prediction <span id="'+id+'-request"></span>')+((name==='bounds'||name==='calculated')?input(id+'-upper','Upper boundary'):'')+'</div><div class="actions"><button class="btn" id="'+id+'-check">Check prediction</button><button class="btn secondary" id="'+id+'-explain" aria-expanded="false" aria-controls="'+id+'-work">Show method</button></div><p class="feedback" id="'+id+'-feedback" role="status"></p><div class="solution" id="'+id+'-work" hidden></div>';
    const get=s=>host.querySelector('#'+id+'-'+s),selected=()=>presets[name][Number(get('model').value)||0];
    function update(){
      let display='',upper;
      if(name==='normalize'){const p=selected();display='<p>Write this value in normalized scientific notation.</p><div class="big-number">'+esc(p.value)+'</div>';answerSpec={answer:p.answer,format:'scientific'};prompt='· scientific notation';explanation=mathHTML('<p>\\('+p.tex+'\\)</p><p>'+p.explain+'</p>');}
      if(name==='operations'){const p=selected();display=mathHTML('<div class="formula">\\('+p.tex+'\\)</div><p>Treat the stated numbers as exact for this calculation.</p>');answerSpec={answer:p.answer,format:'scientific'};prompt='· scientific notation';explanation=mathHTML('<p>'+p.explain+'</p><p>\\('+p.result+'\\)</p>');}
      if(name==='rounding'){
        const p=selected(),result=p.mode==='sf'?M.roundSF(p.value,p.digits):M.roundPlaces(p.value,p.digits);
        let sig=0,started=false;
        const digits=[...p.value].map(c=>{if(c!=='.'&&(c!=='0'||started)){started=true;sig++;}return '<span class="'+(c==='.'?'decimal-point':!started?'leading-zero':'significant-digit')+'">'+c+'</span>';}).join('');
        display='<p>Round to '+p.digits+' '+(p.mode==='sf'?'significant figures':'decimal places')+'.</p><div class="big-number digit-model" aria-label="'+p.value+'">'+digits+'</div><p class="digit-legend">Gray leading zeros locate the decimal point. Colored digits count from the first nonzero digit, including later zeros.</p>';
        answerSpec={answer:Number(result),[p.mode]:p.digits};prompt='· '+p.digits+' '+p.mode;
        explanation='<p>The required result is <strong>'+result+'</strong>. Retain the requested places, inspect the next digit, and round once. Preserve zeros needed to show the requested accuracy.</p>'+(p.value==='0.009996'?mathHTML('<p>The carry changes the first significant place. Both 0.0100 and \\(1.00\\times10^{-2}\\) show three significant figures.</p>'):'');
      }
      if(name==='guard'){
        const digits=Number(get('digits').value),rounded=M.roundPlaces(String(7/12),digits),approx=Number(rounded)*360;
        display=mathHTML('<div class="formula">\\(\\frac7{12}\\times360\\)</div>')+'<p>Compare keeping the fraction with replacing it by '+rounded+' first.</p><div class="metrics"><div class="metric"><span>Prematurely rounded result</span><strong>'+M.format(approx,10)+'</strong></div><div class="metric"><span>Intermediate decimal places</span><strong>'+digits+'</strong></div></div>';
        answerSpec={answer:210};prompt='· result keeping the exact fraction';explanation='<p>Keep (7/12) × 360 together: the exact result is 210. Rounding the fraction first gives '+M.format(approx,10)+', an absolute error of '+M.format(Math.abs(approx-210),8)+'. Use the calculator’s stored value and round the final answer.</p>';
      }
      if(name==='bounds'){
        const p=selected(),b=M.bounds(p.value,p.unit),point=b.low+(b.high-b.low)*Number(get('sample').value)/100,inside=point>=b.low-1e-12&&point<b.high-1e-12;
        display=line(b.low,b.high,true,point)+'<p>'+esc(p.label)+'. The rounding unit is '+p.unit+' '+p.units+'.</p><p class="notice">The selected value '+(inside?'is inside':'is outside')+' the error interval. A filled endpoint is included; an open endpoint is excluded.</p>';
        answerSpec={answer:b.low};upper=b.high;prompt='· lower boundary';
        explanation='<p>Subtract and add half the rounding unit: '+p.value+' ± '+M.format(p.unit/2)+'. Therefore '+M.format(b.low)+' ≤ true value &lt; '+M.format(b.high)+' '+p.units+'. The upper endpoint would round to the next reported value.</p>';
      }
      if(name==='calculated'){
        const op=get('op').value||'sum',a=M.bounds(5.2,.1),b=M.bounds(3.7,.1),r=M.calculatedBounds(a,b,op);
        display=mathHTML('<p>\\(5.15\\le A<5.25\\) and \\(3.65\\le B<3.75\\). Both quantities are positive.</p>')+'<p>Predict the lower and upper boundaries for the selected calculation. Use fractions if convenient.</p>';
        answerSpec={answer:r.low};upper=r.high;prompt='· lower boundary';
        const operations={sum:['5.15 + 3.65','5.25 + 3.75'],difference:['5.15 − 3.75','5.25 − 3.65'],product:['5.15 × 3.65','5.25 × 3.75'],quotient:['5.15 / 3.75','5.25 / 3.65']};
        explanation='<p>Lower boundary: '+operations[op][0]+'. Upper boundary: '+operations[op][1]+'.</p>'+line(r.low,r.high,r.lowClosed)+'<p>The lower endpoint is '+(r.lowClosed?'included: both lower inputs can occur.':'excluded: attaining it would require an excluded upper input.')+' The upper endpoint is excluded.</p><p>Boundary decimals in this diagram are approximations; retain the exact endpoint expressions in a strict inequality.</p>';
      }
      if(name==='error'){const p=selected(),error=M.percentageError(p.approx,p.exact);display='<div class="metrics"><div class="metric"><span>Approximate value</span><strong>'+p.approx+'</strong></div><div class="metric"><span>Exact reference value</span><strong>'+p.exact+'</strong></div></div><p>Give the percentage error to three significant figures.</p>';answerSpec={answer:Number(M.roundSF(String(error),3)),sf:3};prompt='· percentage (do not type %)';explanation=mathHTML('<p>\\(\\frac{|'+p.approx+'-'+p.exact+'|}{|'+p.exact+'|}\\times100\\%\\approx '+M.roundSF(String(error),3)+'\\%\\).</p>')+'<p>The absolute value makes percentage error nonnegative. The denominator is the reference value, so changing the reference can change the percentage.</p>';}
      if(name==='calculator'){const p=selected();display='<p class="tag">TI-Nspire CX / CX II · guided practice</p><p>Enter this in a Calculator page:</p><code class="calculator-entry">'+esc(p.entry)+'</code><p>This coach checks fixed examples. Use your TI-Nspire to carry out the keystrokes.</p>';answerSpec={answer:p.answer};prompt='· calculator result';explanation='<ol>'+p.steps.map(s=>'<li>'+s+'</li>').join('')+'</ol>'+mathHTML('<p>Written answer: \\('+p.result+'\\).</p>');}
      answerSpec.upper=upper;get('display').innerHTML=display;get('request').textContent=prompt;get('work').innerHTML=explanation;get('work').hidden=true;get('explain').setAttribute('aria-expanded','false');get('answer').value='';if(get('upper'))get('upper').value='';feedback(get('feedback'),'');renderMath(host);
    }
    host.querySelectorAll('[data-setting]').forEach(el=>el.addEventListener(el.type==='range'?'input':'change',update));
    host.querySelectorAll('[data-prediction]').forEach(el=>el.addEventListener('input',()=>feedback(get('feedback'),'Prediction changed. Check again when ready.')));
    get('check').addEventListener('click',()=>{
      let result=M.checkAnswer(get('answer').value,answerSpec);
      if(result.correct&&answerSpec.upper!==undefined)result=M.checkAnswer(get('upper').value,{answer:answerSpec.upper});
      feedback(get('feedback'),result.correct?'Correct. Open the method and explain the reasoning.':result.message,result.correct?'good':'error');
    });
    get('explain').addEventListener('click',()=>{get('work').hidden=!get('work').hidden;get('explain').setAttribute('aria-expanded',String(!get('work').hidden));});
    update();
  });
};
