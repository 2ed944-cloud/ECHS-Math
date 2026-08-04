(() => {
  'use strict';
  const app=document.getElementById('app');
  const katex=window.katex;
  if(!app||!katex)return;

  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const format=value=>{
    if(!Number.isFinite(value))return '—';
    if(Math.abs(value)<1e-11)return '0';
    const abs=Math.abs(value);
    if(abs>=1e7||(abs>0&&abs<1e-5))return value.toExponential(4).replace(/\.0+(?=e)/,'');
    return Number(value.toFixed(7)).toLocaleString('en-US',{maximumFractionDigits:7});
  };
  const sum=(a,r,n)=>r===1?a*n:a*(1-r**n)/(1-r);
  const renderTex=(node,expression,displayMode=false)=>{
    if(!node)return;
    try{node.innerHTML=katex.renderToString(expression,{displayMode,throwOnError:false,strict:'ignore',trust:false});}
    catch{node.textContent=expression;}
  };
  const renderInlineMath=(node,source)=>{
    if(!node)return;
    const text=String(source??'');
    const pattern=/\\\(([\s\S]*?)\\\)/g;
    const fragment=document.createDocumentFragment();
    let match,last=0;
    while((match=pattern.exec(text))!==null){
      if(match.index>last)fragment.append(document.createTextNode(text.slice(last,match.index)));
      const holder=document.createElement('span');
      holder.className='gs-generated-math';
      renderTex(holder,match[1]);
      fragment.append(holder);
      last=pattern.lastIndex;
    }
    if(last<text.length)fragment.append(document.createTextNode(text.slice(last)));
    node.replaceChildren(fragment);
  };
  const numbers=raw=>(String(raw||'').match(/[-+]?\d*\.?\d+(?:e[-+]?\d+)?/gi)||[]).map(Number);
  const behaviour=r=>{
    if(r>1)return 'positive growth';
    if(r>0&&r<1)return 'positive decay';
    if(r===1)return 'constant';
    if(r===0)return 'first term, then zeros';
    if(r===-1)return 'alternating constant magnitude';
    if(r<0&&Math.abs(r)<1)return 'alternating decay';
    return 'alternating growth';
  };

  function initExplorer(root){
    root.querySelectorAll('[data-gs-explorer]').forEach(explorer=>{
      if(explorer.dataset.enhanced==='1')return;
      explorer.dataset.enhanced='1';
      const aInput=explorer.querySelector('[data-gs-a]');
      const rInput=explorer.querySelector('[data-gs-r]');
      const countInput=explorer.querySelector('[data-gs-count]');
      const button=explorer.querySelector('[data-gs-update]');
      const rule=explorer.querySelector('[data-gs-rule]');
      const sumNode=explorer.querySelector('[data-gs-sum]');
      const behaviourNode=explorer.querySelector('[data-gs-behaviour]');
      const termsNode=explorer.querySelector('[data-gs-terms]');
      const ratiosNode=explorer.querySelector('[data-gs-ratios]');
      const graphNode=explorer.querySelector('[data-gs-graph]');

      const update=()=>{
        const a=Number(aInput?.value);
        const r=Number(rInput?.value);
        const count=clamp(Math.round(Number(countInput?.value)||6),2,12);
        if(!Number.isFinite(a)||!Number.isFinite(r))return;
        if(countInput)countInput.value=String(count);
        const terms=Array.from({length:count},(_,index)=>a*r**index);
        renderTex(rule,`u_n=${format(a)}(${format(r)})^{n-1}`);
        renderTex(sumNode,`S_{${count}}=${format(sum(a,r,count))}`);
        if(behaviourNode)behaviourNode.textContent=behaviour(r);
        if(termsNode)termsNode.innerHTML=terms.map((value,index)=>`<div><small>u<sub>${index+1}</sub></small><b>${format(value)}</b></div>`).join('');
        if(ratiosNode){
          ratiosNode.innerHTML=terms.slice(1).map((value,index)=>{
            const previous=terms[index];
            const label=Math.abs(previous)<1e-12?'ratio undefined after zero':`${format(value)} ÷ ${format(previous)} = ${format(r)}`;
            return `<span>${label}</span>`;
          }).join('');
        }
        if(graphNode){
          const min=Math.min(0,...terms),max=Math.max(0,...terms),range=Math.max(1,max-min);
          graphNode.innerHTML='<span class="gs-live-x-axis"></span><span class="gs-live-y-axis"></span>'+
            terms.map((value,index)=>{
              const x=count===1?50:10+80*index/(count-1);
              const y=82-64*(value-min)/range;
              return `<i style="--gx:${x}%;--gy:${y}%"><b>${index+1}</b><small>${format(value)}</small></i>`;
            }).join('');
        }
      };
      button?.addEventListener('click',update);
      [aInput,rInput,countInput].forEach(input=>input?.addEventListener('change',update));
      update();
    });
  }

  function initSigma(root){
    root.querySelectorAll('[data-gs-sigma]').forEach(builder=>{
      if(builder.dataset.enhanced==='1')return;
      builder.dataset.enhanced='1';
      const upper=builder.querySelector('[data-gs-sigma-upper]');
      const lower=builder.querySelector('[data-gs-sigma-lower]');
      const expression=builder.querySelector('[data-gs-sigma-expression]');
      const count=builder.querySelector('.gs-sigma-count');
      const presets=[
        {variable:'k',low:1,high:8,expression:'5(2)^{k-1}'},
        {variable:'r',low:3,high:9,expression:'4(1.5)^{r-1}'},
        {variable:'j',low:0,high:5,expression:'12(-0.5)^j'}
      ];
      const controls=document.createElement('div');
      controls.className='gs-sigma-presets';
      controls.innerHTML=presets.map((_,index)=>`<button type="button" data-gs-sigma-preset="${index}">Example ${index+1}</button>`).join('');
      builder.append(controls);
      const show=index=>{
        const preset=presets[index];
        renderTex(upper,String(preset.high));
        renderTex(lower,`${preset.variable}=${preset.low}`);
        renderTex(expression,preset.expression);
        renderTex(count,`\text{number of terms}=${preset.high}-${preset.low}+1=${preset.high-preset.low+1}`,true);
        controls.querySelectorAll('button').forEach((node,i)=>node.setAttribute('aria-pressed',String(i===index)));
      };
      controls.querySelectorAll('[data-gs-sigma-preset]').forEach(button=>button.addEventListener('click',()=>show(Number(button.dataset.gsSigmaPreset))));
      show(0);
    });
  }

  const factories={
    structure(){
      const a=[2,3,4,5,6,8,10][Math.floor(Math.random()*7)];
      const r=[-3,-2,-0.5,0.4,0.5,1.5,2,3][Math.floor(Math.random()*8)];
      const terms=Array.from({length:4},(_,index)=>a*r**index);
      return{title:'Structure',prompt:`The first four terms are \(${terms.map(format).join(', ')}\). Find the common ratio.`,expected:[r],answer:`r=${format(r)}`,reasoning:`Divide a term by its predecessor. Every quotient equals \(${format(r)}\).`};
    },
    term(){
      const a=[2,3,5,8,12,16][Math.floor(Math.random()*6)];
      const r=[-2,-0.5,0.5,1.25,1.5,2][Math.floor(Math.random()*6)];
      const n=Math.floor(Math.random()*6)+5;
      const value=a*r**(n-1);
      return{title:'Nth term',prompt:`A geometric sequence has \(u_1=${a}\) and \(r=${r}\). Find \(u_{${n}}\).`,expected:[value],answer:`u_{${n}}=${format(value)}`,reasoning:`Use \(u_n=u_1r^{n-1}\): \(${a}(${r})^{${n-1}}=${format(value)}\).`};
    },
    sum(){
      const a=[2,3,4,5,8,12][Math.floor(Math.random()*6)];
      const r=[-0.5,0.5,1.5,2,3][Math.floor(Math.random()*5)];
      const n=Math.floor(Math.random()*5)+4;
      const value=sum(a,r,n);
      return{title:'Finite sum',prompt:`Calculate \(S_{${n}}\) for \(u_1=${a}\) and \(r=${r}\).`,expected:[value],answer:`S_{${n}}=${format(value)}`,reasoning:`Use \(S_n=u_1\frac{1-r^n}{1-r}\): the value is \(${format(value)}\).`};
    },
    threshold(){
      const a=[50,80,100,200,400][Math.floor(Math.random()*5)];
      const r=[1.08,1.12,1.2,1.25][Math.floor(Math.random()*4)];
      const target=a*[2.5,3,4,5][Math.floor(Math.random()*4)];
      let n=1;
      while(a*r**(n-1)<=target&&n<100)n+=1;
      return{title:'Threshold',prompt:`Find the first \(n\) for which \(${a}(${r})^{n-1}>${format(target)}\).`,expected:[n],answer:`n=${n}`,reasoning:`The adjacent values are \(u_{${n-1}}=${format(a*r**(n-2))}\) and \(u_{${n}}=${format(a*r**(n-1))}\), so \(${n}\) is the first valid integer stage.`};
    }
  };

  function initGenerator(root){
    root.querySelectorAll('[data-gs-generator]').forEach(generator=>{
      if(generator.dataset.enhanced==='1')return;
      generator.dataset.enhanced='1';
      const tabs=[...generator.querySelectorAll('[data-gs-gen-mode]')];
      const topic=generator.querySelector('[data-gs-gen-topic]');
      const counter=generator.querySelector('[data-gs-gen-counter]');
      const question=generator.querySelector('[data-gs-gen-question]');
      const answer=generator.querySelector('[data-gs-gen-answer]');
      const check=generator.querySelector('[data-gs-gen-check]');
      const fresh=generator.querySelector('[data-gs-gen-new]');
      const reasoningButton=generator.querySelector('[data-gs-gen-solution]');
      const feedback=generator.querySelector('[data-gs-gen-feedback]');
      const solution=generator.querySelector('[data-gs-gen-solution-box]');
      let mode='structure',current=null,number=0;
      const newQuestion=()=>{
        current=factories[mode]();number+=1;
        if(topic)topic.textContent=current.title;
        if(counter)counter.textContent=`Question ${number}`;
        if(question){const p=document.createElement('p');renderInlineMath(p,current.prompt);question.replaceChildren(p);}
        if(answer){answer.value='';answer.placeholder='Enter a numerical response';answer.focus({preventScroll:true});}
        if(feedback){feedback.className='gs-generator-feedback';feedback.textContent='';}
        if(solution){solution.hidden=true;solution.innerHTML='';}
        if(reasoningButton)reasoningButton.textContent='Show reasoning';
      };
      const checkAnswer=()=>{
        if(!current||!answer||!feedback)return;
        const values=numbers(answer.value);
        const correct=values.length&&Math.abs(values[0]-current.expected[0])<=Math.max(1e-8,Math.abs(current.expected[0])*1e-7);
        feedback.className=`gs-generator-feedback ${correct?'is-correct':'is-incorrect'}`;
        feedback.textContent=correct?'Correct. The ratio, exponent and value agree.':'Not yet. Recheck the multiplier, exponent, term count or adjacent stage.';
      };
      const toggle=()=>{
        if(!current||!solution||!reasoningButton)return;
        const open=solution.hidden;solution.hidden=!open;
        if(open){solution.innerHTML='<b>Answer</b><div class="gs-generated-answer"></div><p></p>';renderTex(solution.querySelector('.gs-generated-answer'),current.answer,true);renderInlineMath(solution.querySelector('p'),current.reasoning);}
        reasoningButton.textContent=open?'Hide reasoning':'Show reasoning';
      };
      tabs.forEach(tab=>tab.addEventListener('click',()=>{mode=tab.dataset.gsGenMode;tabs.forEach(node=>node.setAttribute('aria-selected',String(node===tab)));newQuestion();}));
      fresh?.addEventListener('click',newQuestion);
      check?.addEventListener('click',checkAnswer);
      reasoningButton?.addEventListener('click',toggle);
      answer?.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();checkAnswer();}});
      newQuestion();
    });
  }

  function initialize(root=app){initExplorer(root);initSigma(root);initGenerator(root);}
  let scheduled=false;
  const schedule=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;initialize(app);});};
  new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
  addEventListener('hashchange',schedule);
  schedule();
})();
