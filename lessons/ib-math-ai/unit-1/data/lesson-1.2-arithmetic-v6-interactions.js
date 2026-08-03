(() => {
  'use strict';

  const app=document.getElementById('app');
  const katex=window.katex;
  if(!app||!katex)return;

  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const format=value=>{
    if(!Number.isFinite(value))return '—';
    if(Math.abs(value)<1e-10)return '0';
    return Number(value.toFixed(8)).toLocaleString('en-US',{maximumFractionDigits:8});
  };
  const renderTex=(node,expression,displayMode=false)=>{
    if(!node)return;
    try{
      node.innerHTML=katex.renderToString(expression,{displayMode,throwOnError:false,strict:'ignore',trust:false});
    }catch{
      node.textContent=expression;
    }
  };
  const numberList=raw=>(String(raw||'').match(/[-+]?\d*\.?\d+(?:e[-+]?\d+)?/gi)||[]).map(Number);
  const renderInlineMath=(node,source)=>{
    if(!node)return;
    const text=String(source??'');
    const pattern=/\\\(([\s\S]*?)\\\)/g;
    const fragment=document.createDocumentFragment();
    let match,last=0;
    while((match=pattern.exec(text))!==null){
      if(match.index>last)fragment.append(document.createTextNode(text.slice(last,match.index)));
      const holder=document.createElement('span');
      holder.className='as-generated-math';
      renderTex(holder,match[1]);
      fragment.append(holder);
      last=pattern.lastIndex;
    }
    if(last<text.length)fragment.append(document.createTextNode(text.slice(last)));
    node.replaceChildren(fragment);
  };

  function initExplorer(root){
    root.querySelectorAll('[data-as-explorer]').forEach(explorer=>{
      if(explorer.dataset.enhanced==='1')return;
      explorer.dataset.enhanced='1';
      const aInput=explorer.querySelector('[data-as-a]');
      const dInput=explorer.querySelector('[data-as-d]');
      const countInput=explorer.querySelector('[data-as-count]');
      const updateButton=explorer.querySelector('[data-as-update]');
      const ruleNode=explorer.querySelector('[data-as-rule]');
      const sumNode=explorer.querySelector('[data-as-sum]');
      const termsNode=explorer.querySelector('[data-as-terms]');
      const differencesNode=explorer.querySelector('[data-as-differences]');
      const graphNode=explorer.querySelector('[data-as-graph]');

      const update=()=>{
        const a=Number(aInput?.value);
        const d=Number(dInput?.value);
        const count=clamp(Math.round(Number(countInput?.value)||6),2,12);
        if(!Number.isFinite(a)||!Number.isFinite(d))return;
        if(countInput)countInput.value=String(count);
        const terms=Array.from({length:count},(_,index)=>a+index*d);
        const sum=terms.reduce((total,value)=>total+value,0);
        renderTex(ruleNode,`u_n=${format(a)}+(n-1)(${format(d)})`,false);
        renderTex(sumNode,`S_{${count}}=${format(sum)}`,false);

        if(termsNode){
          termsNode.innerHTML=terms.map((value,index)=>(
            `<div><small>u<sub>${index+1}</sub></small><b>${format(value)}</b></div>`
          )).join('');
        }
        if(differencesNode){
          differencesNode.innerHTML=terms.slice(1).map((value,index)=>(
            `<span>${format(value)} − ${format(terms[index])} = <b>${format(d)}</b></span>`
          )).join('');
        }
        if(graphNode){
          const min=Math.min(...terms);
          const max=Math.max(...terms);
          const range=Math.max(1,max-min);
          graphNode.innerHTML='<span class="as-live-x-axis"></span><span class="as-live-y-axis"></span>'+
            terms.map((value,index)=>{
              const x=count===1?50:10+(80*index/(count-1));
              const y=82-(64*(value-min)/range);
              return `<i style="--gx:${x}%;--gy:${y}%"><b>${index+1}</b><small>${format(value)}</small></i>`;
            }).join('');
        }
      };

      updateButton?.addEventListener('click',update);
      [aInput,dInput,countInput].forEach(input=>input?.addEventListener('change',update));
      update();
    });
  }

  function initSigmaBuilder(root){
    root.querySelectorAll('[data-sigma-builder]').forEach(builder=>{
      if(builder.dataset.enhanced==='1')return;
      builder.dataset.enhanced='1';
      const upper=builder.querySelector('[data-sigma-upper]');
      const lower=builder.querySelector('[data-sigma-lower]');
      const expression=builder.querySelector('[data-sigma-expression]');
      const count=builder.querySelector('.as-sigma-count');
      const presets=[
        {variable:'r',low:1,high:6,expression:'2r+1'},
        {variable:'r',low:4,high:12,expression:'3r-2'},
        {variable:'k',low:10,high:20,expression:'5-k'}
      ];
      const controls=document.createElement('div');
      controls.className='as-sigma-presets';
      controls.setAttribute('aria-label','Sigma notation examples');
      controls.innerHTML=presets.map((_,index)=>`<button type="button" data-sigma-preset="${index}">Example ${index+1}</button>`).join('');
      builder.append(controls);

      const show=index=>{
        const preset=presets[index];
        renderTex(upper,String(preset.high));
        renderTex(lower,`${preset.variable}=${preset.low}`);
        renderTex(expression,`(${preset.expression})`);
        renderTex(count,`\text{number of terms}=${preset.high}-${preset.low}+1=${preset.high-preset.low+1}`,true);
        controls.querySelectorAll('button').forEach((button,buttonIndex)=>button.setAttribute('aria-pressed',String(buttonIndex===index)));
      };
      controls.querySelectorAll('[data-sigma-preset]').forEach(button=>button.addEventListener('click',()=>show(Number(button.dataset.sigmaPreset))));
      show(0);
    });
  }

  const generatorFactories={
    structure(){
      const a=Math.floor(Math.random()*31)-15;
      let d=Math.floor(Math.random()*13)-6;
      if(d===0)d=4;
      const terms=Array.from({length:5},(_,index)=>a+index*d);
      return{
        title:'Structure',
        prompt:`The first five terms are \(${terms.join(', ')}\). Find the common difference.`,
        expected:[d],
        answer:`d=${d}`,
        reasoning:`Subtract any consecutive pair. Every difference equals ${d}, so the sequence is arithmetic.`
      };
    },
    term(){
      const a=Math.floor(Math.random()*25)-8;
      let d=Math.floor(Math.random()*11)-5;
      if(d===0)d=3;
      const n=Math.floor(Math.random()*25)+8;
      const value=a+(n-1)*d;
      return{
        title:'Nth term',
        prompt:`An arithmetic sequence has \(u_1=${a}\) and \(d=${d}\). Find \(u_{${n}}\).`,
        expected:[value],
        answer:`u_{${n}}=${value}`,
        reasoning:`Use \(u_n=u_1+(n-1)d\): \(${a}+(${n}-1)(${d})=${value}\).`
      };
    },
    sum(){
      const a=Math.floor(Math.random()*20)+1;
      let d=Math.floor(Math.random()*8)-2;
      if(d===0)d=4;
      const n=Math.floor(Math.random()*18)+8;
      const last=a+(n-1)*d;
      const sum=n*(a+last)/2;
      return{
        title:'Series sum',
        prompt:`For \(u_1=${a}\), \(d=${d}\), calculate \(S_{${n}}\).`,
        expected:[sum],
        answer:`S_{${n}}=${sum}`,
        reasoning:`First find \(u_{${n}}=${last}\). Then \(S_{${n}}=\frac{${n}}2(${a}+${last})=${sum}\).`
      };
    },
    inverse(){
      const a=Math.floor(Math.random()*24)-6;
      let d=Math.floor(Math.random()*10)-4;
      if(d===0)d=5;
      const p=Math.floor(Math.random()*4)+3;
      const q=p+Math.floor(Math.random()*7)+4;
      const up=a+(p-1)*d;
      const uq=a+(q-1)*d;
      return{
        title:'Inverse problem',
        prompt:`An arithmetic sequence has \(u_{${p}}=${up}\) and \(u_{${q}}=${uq}\). Find \(u_1\) and \(d\). Enter the two values as \(u_1,d\).`,
        expected:[a,d],
        answer:`u_1=${a},\quad d=${d}`,
        reasoning:`The index gap is ${q-p}, so \(d=(${uq}-${up})/${q-p}=${d}\). Then \(u_1=${up}-(${p}-1)(${d})=${a}\).`
      };
    }
  };

  function initGenerator(root){
    root.querySelectorAll('[data-as-generator]').forEach(generator=>{
      if(generator.dataset.enhanced==='1')return;
      generator.dataset.enhanced='1';
      const tabs=[...generator.querySelectorAll('[data-as-gen-mode]')];
      const topic=generator.querySelector('[data-as-gen-topic]');
      const counter=generator.querySelector('[data-as-gen-counter]');
      const question=generator.querySelector('[data-as-gen-question]');
      const answer=generator.querySelector('[data-as-gen-answer]');
      const check=generator.querySelector('[data-as-gen-check]');
      const fresh=generator.querySelector('[data-as-gen-new]');
      const reasoningButton=generator.querySelector('[data-as-gen-solution]');
      const feedback=generator.querySelector('[data-as-gen-feedback]');
      const solution=generator.querySelector('[data-as-gen-solution-box]');
      let mode='structure';
      let current=null;
      let questionNumber=0;

      const newQuestion=()=>{
        current=generatorFactories[mode]();
        questionNumber+=1;
        if(topic)topic.textContent=current.title;
        if(counter)counter.textContent=`Question ${questionNumber}`;
        if(question){
          const paragraph=document.createElement('p');
          renderInlineMath(paragraph,current.prompt);
          question.replaceChildren(paragraph);
        }
        if(answer){
          answer.value='';
          answer.placeholder=current.expected.length===2?'Example: 7, 4':'Enter a numerical response';
          answer.focus({preventScroll:true});
        }
        if(feedback){feedback.className='as-generator-feedback';feedback.textContent='';}
        if(solution){solution.hidden=true;solution.innerHTML='';}
        if(reasoningButton)reasoningButton.textContent='Show reasoning';
      };

      const checkAnswer=()=>{
        if(!current||!answer||!feedback)return;
        const values=numberList(answer.value);
        const correct=values.length>=current.expected.length&&current.expected.every((value,index)=>Math.abs(values[index]-value)<=1e-8);
        feedback.className=`as-generator-feedback ${correct?'is-correct':'is-incorrect'}`;
        feedback.textContent=correct?'Correct. The arithmetic structure and value agree.':'Not yet. Recheck the index gap, number of jumps, or sum formula.';
      };

      const toggleReasoning=()=>{
        if(!current||!solution||!reasoningButton)return;
        const open=solution.hidden;
        solution.hidden=!open;
        if(open){
          solution.innerHTML='<b>Answer</b><div class="as-generated-answer"></div><p></p>';
          renderTex(solution.querySelector('.as-generated-answer'),current.answer,true);
          renderInlineMath(solution.querySelector('p'),current.reasoning);
        }
        reasoningButton.textContent=open?'Hide reasoning':'Show reasoning';
      };

      tabs.forEach(tab=>tab.addEventListener('click',()=>{
        mode=tab.dataset.asGenMode;
        tabs.forEach(button=>button.setAttribute('aria-selected',String(button===tab)));
        newQuestion();
      }));
      fresh?.addEventListener('click',newQuestion);
      check?.addEventListener('click',checkAnswer);
      reasoningButton?.addEventListener('click',toggleReasoning);
      answer?.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();checkAnswer();}});
      newQuestion();
    });
  }

  function initialize(root=app){
    initExplorer(root);
    initSigmaBuilder(root);
    initGenerator(root);
  }

  let scheduled=false;
  const schedule=()=>{
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;initialize(app);});
  };
  new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
  addEventListener('hashchange',schedule);
  schedule();
})();
