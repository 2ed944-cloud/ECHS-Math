(() => {
  'use strict';
  const app=document.getElementById('app');
  const katex=window.katex;
  if(!app||!katex)return;
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const money=value=>Number.isFinite(value)?`QAR ${Number(value.toFixed(2)).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`:'—';
  const number=value=>Number.isFinite(value)?Number(value.toFixed(7)).toLocaleString('en-US',{maximumFractionDigits:7}):'—';
  const fvOrd=(R,i,n)=>Math.abs(i)<1e-14?R*n:R*((1+i)**n-1)/i;
  const fvDue=(R,i,n)=>fvOrd(R,i,n)*(1+i);
  const pmt=(PV,i,n)=>Math.abs(i)<1e-14?PV/n:PV*i/(1-(1+i)**(-n));
  const renderTex=(node,expression,displayMode=false)=>{if(!node)return;try{node.innerHTML=katex.renderToString(expression,{displayMode,throwOnError:false,strict:'ignore',trust:false});}catch{node.textContent=expression;}};
  const renderInline=(node,source)=>{
    if(!node)return;
    const text=String(source??''),pattern=/\\\(([\s\S]*?)\\\)/g,fragment=document.createDocumentFragment();let match,last=0;
    while((match=pattern.exec(text))!==null){if(match.index>last)fragment.append(document.createTextNode(text.slice(last,match.index)));const holder=document.createElement('span');holder.className='fin-generated-math';renderTex(holder,match[1]);fragment.append(holder);last=pattern.lastIndex;}
    if(last<text.length)fragment.append(document.createTextNode(text.slice(last)));node.replaceChildren(fragment);
  };
  const numericResponse=raw=>{const match=String(raw||'').replaceAll(',','').match(/[-+]?\d*\.?\d+(?:e[-+]?\d+)?/i);return match?Number(match[0]):NaN;};

  function initCompound(root){
    root.querySelectorAll('[data-fin-compound-explorer]').forEach(explorer=>{
      if(explorer.dataset.enhanced==='1')return;explorer.dataset.enhanced='1';
      const get=name=>explorer.querySelector(`[data-fin-${name}]`);
      const P=get('principal'),rate=get('rate'),frequency=get('frequency'),years=get('years'),inflation=get('inflation');
      const periodic=get('periodic'),ear=get('ear'),fv=get('fv'),real=get('real'),chart=get('compound-chart');
      const update=()=>{
        const principal=Math.max(0,Number(P?.value)||0),j=(Number(rate?.value)||0)/100,m=clamp(Math.round(Number(frequency?.value)||1),1,365),t=Math.max(0,Number(years?.value)||0),f=(Number(inflation?.value)||0)/100;
        if(frequency)frequency.value=String(m);
        const i=j/m,N=m*t,value=principal*(1+i)**N,eff=(1+i)**m-1,realValue=value/(1+f)**t;
        if(periodic)periodic.innerHTML=`<b>Periodic rate</b><span>${number(i*100)}%</span>`;
        if(ear)ear.innerHTML=`<b>Effective annual</b><span>${number(eff*100)}%</span>`;
        if(fv)fv.innerHTML=`<b>Future value</b><span>${money(value)}</span>`;
        if(real)real.innerHTML=`<b>Real value</b><span>${money(realValue)}</span>`;
        if(chart){
          const points=Math.max(2,Math.min(13,Math.ceil(t)+1)),values=Array.from({length:points},(_,index)=>{const yr=t*index/(points-1);return{yr,value:principal*(1+i)**(m*yr),real:principal*(1+i)**(m*yr)/(1+f)**yr};});
          const max=Math.max(...values.map(item=>item.value),1),min=Math.min(...values.map(item=>item.real),0),range=Math.max(1,max-min);
          chart.innerHTML='<span class="fin-live-x-axis"></span><span class="fin-live-y-axis"></span>'+values.map((item,index)=>{const x=8+84*index/(values.length-1),y=84-68*(item.value-min)/range,yr=Number(item.yr.toFixed(1));return `<i style="--fx:${x}%;--fy:${y}%"><b>${yr}y</b><small>${money(item.value)}</small></i>`;}).join('')+'<div class="fin-live-legend"><span>nominal balance</span><span>real value calculated above</span></div>';
        }
      };
      get('compound-update')?.addEventListener('click',update);[P,rate,frequency,years,inflation].forEach(input=>input?.addEventListener('change',update));update();
    });
  }

  function initCashFlow(root){
    root.querySelectorAll('[data-fin-cashflow-explorer]').forEach(explorer=>{
      if(explorer.dataset.enhanced==='1')return;explorer.dataset.enhanced='1';
      const tabs=[...explorer.querySelectorAll('[data-fin-mode]')],get=name=>explorer.querySelector(`[data-fin-cf-${name}]`);
      const principal=get('principal'),rate=get('rate'),payment=get('payment'),months=get('months'),timing=get('timing');
      const result=get('result'),contrib=get('contrib'),interest=get('interest'),status=get('status'),schedule=get('schedule');
      let mode='savings';
      const update=()=>{
        const P=Math.max(0,Number(principal?.value)||0),j=(Number(rate?.value)||0)/100,i=j/12,R=Math.max(0,Number(payment?.value)||0),n=clamp(Math.round(Number(months?.value)||1),1,360),when=timing?.value||'end';
        if(months)months.value=String(n);
        if(mode==='savings'){
          const stream=when==='begin'?fvDue(R,i,n):fvOrd(R,i,n),value=P*(1+i)**n+stream,total=P+R*n,growth=value-total;
          if(result)result.innerHTML=`<b>Final balance</b><span>${money(value)}</span>`;
          if(contrib)contrib.innerHTML=`<b>Contributions</b><span>${money(total)}</span>`;
          if(interest)interest.innerHTML=`<b>Interest</b><span>${money(growth)}</span>`;
          if(status)status.innerHTML=`<b>Timing</b><span>${when==='begin'?'annuity due':'ordinary annuity'}</span>`;
          let balance=P,rows=[];
          for(let k=1;k<=n;k+=1){if(when==='begin')balance+=R;const earned=balance*i;balance+=earned;if(when==='end')balance+=R;if(k<=4||k===n)rows.push({k,earned,balance});}
          if(schedule)schedule.innerHTML='<div><span>period</span><span>interest</span><span>closing balance</span></div>'+rows.map(row=>`<div><b>${row.k}${row.k===n&&n>4?' (final)':''}</b><span>${money(row.earned)}</span><span>${money(row.balance)}</span></div>`).join('');
        }else{
          if(timing)timing.value='end';
          let B=P,totalInterest=0,totalPaid=0,rows=[];
          for(let k=1;k<=n&&B>0.005;k+=1){const earned=B*i,actual=Math.min(R,B+earned),principalPaid=actual-earned;B=Math.max(0,B-principalPaid);totalInterest+=earned;totalPaid+=actual;if(k<=4||k===n||B===0)rows.push({k,earned,actual,B});}
          const required=pmt(P,i,n),negativeAmortization=R<=P*i&&P>0;
          if(result)result.innerHTML=`<b>Balance after ${n}</b><span>${money(B)}</span>`;
          if(contrib)contrib.innerHTML=`<b>Total paid</b><span>${money(totalPaid)}</span>`;
          if(interest)interest.innerHTML=`<b>Interest charged</b><span>${money(totalInterest)}</span>`;
          if(status)status.innerHTML=`<b>Required level payment</b><span>${money(required)}${negativeAmortization?' · payment too low':''}</span>`;
          if(schedule)schedule.innerHTML='<div><span>period</span><span>interest</span><span>payment</span><span>closing balance</span></div>'+rows.map(row=>`<div><b>${row.k}${row.k===n&&n>4?' (final shown)':''}</b><span>${money(row.earned)}</span><span>${money(row.actual)}</span><span>${money(row.B)}</span></div>`).join('');
        }
      };
      tabs.forEach(tab=>tab.addEventListener('click',()=>{mode=tab.dataset.finMode;tabs.forEach(node=>node.setAttribute('aria-selected',String(node===tab)));if(timing)timing.disabled=mode==='loan';update();}));
      get('update')?.addEventListener('click',update);[principal,rate,payment,months,timing].forEach(input=>input?.addEventListener('change',update));update();
    });
  }

  const factories={
    interest(){const P=[5000,8000,12000,15000][Math.floor(Math.random()*4)],j=[.036,.042,.048,.055][Math.floor(Math.random()*4)],m=[1,4,12][Math.floor(Math.random()*3)],t=[3,4,5,6][Math.floor(Math.random()*4)],value=P*(1+j/m)**(m*t);return{title:'Compound interest',prompt:`Find the value of QAR \(${P}\) after \(${t}\) years at \(${j*100}\%\) nominal interest compounded \(${m}\) times per year.`,value,answer:money(value),reasoning:`Use \(A=P(1+j/m)^{mt}\): \(${P}(1+${j}/${m})^{${m*t}}=${value.toFixed(2)}\).`};},
    annuity(){const R=[250,400,600,900][Math.floor(Math.random()*4)],j=[.042,.048,.054,.06][Math.floor(Math.random()*4)],n=[48,60,72,84][Math.floor(Math.random()*4)],value=fvOrd(R,j/12,n);return{title:'Ordinary annuity',prompt:`QAR \(${R}\) is deposited at each month-end for \(${n}\) months at \(${j*100}\%\) nominal compounded monthly. Find the future value.`,value,answer:money(value),reasoning:`Use \(FV=R[(1+i)^n-1]/i\) with \(i=${j}/12\), giving \(${value.toFixed(2)}\).`};},
    loan(){const PV=[30000,50000,75000,100000][Math.floor(Math.random()*4)],j=[.045,.05,.054,.06][Math.floor(Math.random()*4)],n=[36,48,60,72][Math.floor(Math.random()*4)],value=pmt(PV,j/12,n);return{title:'Loan payment',prompt:`Find the monthly payment on QAR \(${PV}\) over \(${n}\) months at \(${j*100}\%\) nominal compounded monthly.`,value,answer:money(value),reasoning:`Use \(R=PV\,i/[1-(1+i)^{-n}]\) with \(i=${j}/12\), giving \(${value.toFixed(2)}\).`};},
    amortization(){const B=[20000,40000,60000,80000][Math.floor(Math.random()*4)],i=[.0035,.004,.0045,.005][Math.floor(Math.random()*4)],R=[600,900,1200,1600][Math.floor(Math.random()*4)],interest=B*i,principal=R-interest,value=B-principal;return{title:'Amortization',prompt:`A loan opens the period at QAR \(${B}\), with rate \(${i}\) and payment QAR \(${R}\). Find the closing balance.`,value,answer:money(value),reasoning:`Interest is \(${interest.toFixed(2)}\); principal is \(${principal.toFixed(2)}\); closing balance is \(${value.toFixed(2)}\).`};}
  };

  function initGenerator(root){
    root.querySelectorAll('[data-fin-generator]').forEach(generator=>{
      if(generator.dataset.enhanced==='1')return;generator.dataset.enhanced='1';
      const tabs=[...generator.querySelectorAll('[data-fin-gen-mode]')],topic=generator.querySelector('[data-fin-gen-topic]'),counter=generator.querySelector('[data-fin-gen-counter]'),question=generator.querySelector('[data-fin-gen-question]'),answer=generator.querySelector('[data-fin-gen-answer]'),check=generator.querySelector('[data-fin-gen-check]'),fresh=generator.querySelector('[data-fin-gen-new]'),reasoningButton=generator.querySelector('[data-fin-gen-solution]'),feedback=generator.querySelector('[data-fin-gen-feedback]'),solution=generator.querySelector('[data-fin-gen-solution-box]');
      let mode='interest',current=null,index=0;
      const next=()=>{current=factories[mode]();index+=1;if(topic)topic.textContent=current.title;if(counter)counter.textContent=`Question ${index}`;if(question){const p=document.createElement('p');renderInline(p,current.prompt);question.replaceChildren(p);}if(answer){answer.value='';answer.focus({preventScroll:true});}if(feedback){feedback.className='fin-generator-feedback';feedback.textContent='';}if(solution){solution.hidden=true;solution.innerHTML='';}if(reasoningButton)reasoningButton.textContent='Show reasoning';};
      const assess=()=>{if(!current||!answer||!feedback)return;const entered=numericResponse(answer.value),ok=Number.isFinite(entered)&&Math.abs(entered-current.value)<=Math.max(.02,Math.abs(current.value)*2e-5);feedback.className=`fin-generator-feedback ${ok?'is-correct':'is-incorrect'}`;feedback.textContent=ok?'Correct. The period convention and value agree.':'Not yet. Recheck timing, periodic rate, number of periods and rounding.';};
      const toggle=()=>{if(!current||!solution||!reasoningButton)return;const open=solution.hidden;solution.hidden=!open;if(open){solution.innerHTML='<b>Answer</b><div class="fin-generated-answer"></div><p></p>';solution.querySelector('.fin-generated-answer').textContent=current.answer;renderInline(solution.querySelector('p'),current.reasoning);}reasoningButton.textContent=open?'Hide reasoning':'Show reasoning';};
      tabs.forEach(tab=>tab.addEventListener('click',()=>{mode=tab.dataset.finGenMode;tabs.forEach(node=>node.setAttribute('aria-selected',String(node===tab)));next();}));fresh?.addEventListener('click',next);check?.addEventListener('click',assess);reasoningButton?.addEventListener('click',toggle);answer?.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();assess();}});next();
    });
  }

  function initialize(root=app){initCompound(root);initCashFlow(root);initGenerator(root);}
  let scheduled=false;const schedule=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;initialize(app);});};
  new MutationObserver(schedule).observe(app,{childList:true,subtree:true});addEventListener('hashchange',schedule);schedule();
})();
