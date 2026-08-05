(function(){
  'use strict';
  const data=window.LESSON_DATA;if(!data||String(data.lesson?.number)!=='1.4')return;
  const scope=data.financialScope||'core';

  function money(value){return `QAR ${Number(value.toFixed(2)).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`;}
  function numeric(value){const match=String(value||'').replaceAll(',','').match(/[-+]?\d*\.?\d+(?:e[-+]?\d+)?/i);return match?Number(match[0]):NaN;}
  function switchScope(target){
    const url=new URL(location.href);
    if(target==='extension')url.searchParams.set('scope','extension');else url.searchParams.delete('scope');
    url.hash='#learn';location.assign(url.toString());
  }
  function initScopeToggle(){
    const button=document.getElementById('financial-scope-toggle');
    if(button&&button.dataset.bound!=='1'){
      button.dataset.bound='1';button.textContent=scope==='core'?'Optional applications →':'← Return to IB SL Core';
      button.addEventListener('click',()=>switchScope(scope==='core'?'extension':'core'));
    }
    document.querySelectorAll('[data-fin-open-extension]').forEach(button=>{if(button.dataset.bound==='1')return;button.dataset.bound='1';button.addEventListener('click',()=>switchScope('extension'));});
  }
  function initCoreExplorer(root=document){
    root.querySelectorAll('[data-core-fin-explorer]').forEach(explorer=>{
      if(explorer.dataset.enhanced==='1')return;explorer.dataset.enhanced='1';
      const find=name=>explorer.querySelector(`[data-core-${name}]`),P=find('principal'),rate=find('rate'),frequency=find('frequency'),years=find('years'),periodic=find('periodic'),fv=find('fv'),chart=find('chart');
      const update=()=>{
        const principal=Math.max(0,Number(P?.value)||0),j=(Number(rate?.value)||0)/100,m=Math.max(1,Math.round(Number(frequency?.value)||1)),t=Math.max(0,Number(years?.value)||0),i=j/m,N=m*t,value=principal*(1+i)**N;
        if(frequency)frequency.value=String(m);
        if(periodic)periodic.innerHTML=`<b>Periodic rate</b><span>${Number((i*100).toFixed(6))}% · ${N} periods</span>`;
        if(fv)fv.innerHTML=`<b>Future value</b><span>${money(value)}</span>`;
        if(chart){const count=Math.max(2,Math.min(11,Math.ceil(t)+1)),values=Array.from({length:count},(_,k)=>{const yr=t*k/(count-1);return{yr,value:principal*(1+i)**(m*yr)};}),max=Math.max(...values.map(item=>item.value),1);chart.innerHTML='<span class="fin-live-x-axis"></span><span class="fin-live-y-axis"></span>'+values.map((item,k)=>`<i style="--fx:${8+84*k/(values.length-1)}%;--fy:${84-68*item.value/max}%"><b>${Number(item.yr.toFixed(1))}y</b><small>${money(item.value)}</small></i>`).join('')+'<div class="fin-live-legend"><span>compound balance</span></div>';}
      };
      find('update')?.addEventListener('click',update);[P,rate,frequency,years].forEach(input=>input?.addEventListener('change',update));update();
    });
  }
  function initCoreGenerator(root=document){
    root.querySelectorAll('[data-core-generator]').forEach(generator=>{
      if(generator.dataset.enhanced==='1')return;generator.dataset.enhanced='1';
      const tabs=[...generator.querySelectorAll('[data-core-gen-mode]')],get=name=>generator.querySelector(`[data-core-gen-${name}]`),topic=get('topic'),counter=get('counter'),question=get('question'),answer=get('answer'),feedback=get('feedback'),solution=get('solution-box');let mode='interest',current,index=0;
      const make=()=>{if(mode==='depreciation'){const P=[24000,48000,84000][Math.floor(Math.random()*3)],d=[.08,.12,.15][Math.floor(Math.random()*3)],n=[3,4,5][Math.floor(Math.random()*3)],value=P*(1-d)**n;return{title:'Annual depreciation',prompt:`An asset worth QAR ${P.toLocaleString()} depreciates by ${d*100}% each year. Find its value after ${n} years.`,value,reason:`Use V=P(1-d)^n: ${P}(1-${d})^${n}=${value.toFixed(2)}.`};}const P=[5000,8000,12000][Math.floor(Math.random()*3)],j=[.036,.048,.06][Math.floor(Math.random()*3)],m=[1,4,12][Math.floor(Math.random()*3)],t=[3,4,5][Math.floor(Math.random()*3)],value=P*(1+j/m)**(m*t);return{title:'Compound interest',prompt:`QAR ${P.toLocaleString()} is invested for ${t} years at ${j*100}% nominal interest compounded ${m} time${m===1?'':'s'} per year. Find the final value.`,value,reason:`Use A=P(1+j/m)^(mt): ${P}(1+${j}/${m})^${m*t}=${value.toFixed(2)}.`};};
      const next=()=>{current=make();index++;if(topic)topic.textContent=current.title;if(counter)counter.textContent=`Question ${index}`;if(question)question.textContent=current.prompt;if(answer)answer.value='';if(feedback){feedback.className='fin-generator-feedback';feedback.textContent='';}if(solution){solution.hidden=true;solution.textContent='';}};
      tabs.forEach(tab=>tab.addEventListener('click',()=>{mode=tab.dataset.coreGenMode;tabs.forEach(node=>node.setAttribute('aria-selected',String(node===tab)));next();}));get('new')?.addEventListener('click',next);get('check')?.addEventListener('click',()=>{const entered=numeric(answer?.value),ok=Number.isFinite(entered)&&Math.abs(entered-current.value)<=Math.max(.02,current.value*2e-5);feedback.className=`fin-generator-feedback ${ok?'is-correct':'is-incorrect'}`;feedback.textContent=ok?'Correct.':'Recheck the percentage factor, periodic rate and number of periods.';});get('solution')?.addEventListener('click',()=>{solution.hidden=!solution.hidden;if(!solution.hidden)solution.textContent=`${money(current.value)}. ${current.reason}`;});next();
    });
  }
  function patchRoute(){
    initScopeToggle();initCoreExplorer(document);initCoreGenerator(document);
    const route=document.querySelector('.route-page');if(!route)return;
    const section=route.querySelector('.slide-section')?.textContent||'';
    if(section==='Practice Studio'){
      const paragraph=route.querySelector('.route-header p');if(paragraph)paragraph.textContent=`${data.practice.length} questions are organized by level for this learning path. Work is saved locally on this device.`;
      route.querySelectorAll('[data-filter]').forEach(button=>{const level=button.dataset.filter,count=level==='All'?data.practice.length:data.practice.filter(q=>q.level===level).length;button.textContent=`${level} · ${count}`;});
    }
    if(section==='Independent quiz'){const heading=route.querySelector('.route-header h1');if(heading)heading.textContent=`${data.quiz.length}-question checkpoint`;}
    if(section==='IB-style assessment'){const paragraph=route.querySelector('.route-header p');if(paragraph)paragraph.textContent=`${data.exam.length} extended-response task${data.exam.length===1?'':'s'} for this learning path. Use command terms, show technology transparently and interpret every contextual result.`;}
    if(section==='Mastery review'){const next=[...route.querySelectorAll('.unit-docs p')].at(-1);if(next&&/extended-response tasks/.test(next.textContent))next.textContent=next.textContent.replace(/the two extended-response tasks/,`${data.exam.length===1?'the':'one of the'} ${data.exam.length} extended-response task${data.exam.length===1?'':'s'}`);}
  }
  const app=document.getElementById('app');if(app)new MutationObserver(patchRoute).observe(app,{childList:true,subtree:true});
  addEventListener('DOMContentLoaded',patchRoute);setTimeout(patchRoute,0);
})();
