(function(){
  'use strict';
  const app=document.getElementById('app');
  if(!app||String(window.LESSON_DATA?.lesson?.number)!=='2.1')return;

  function bindMatch(root){
    root.querySelectorAll('[data-fn21-match]').forEach(lab=>{
      if(lab.dataset.bound==='1')return;
      lab.dataset.bound='1';
      const feedback=lab.querySelector('.fn21-feedback');
      lab.querySelectorAll('[data-answer]').forEach(button=>button.addEventListener('click',()=>{
        lab.querySelectorAll('[data-answer]').forEach(node=>node.classList.remove('correct','incorrect'));
        const correct=button.dataset.answer==='1';
        button.classList.add(correct?'correct':'incorrect');
        if(feedback)feedback.textContent=correct?'Correct. The fixed charge is the intercept 12 and the charge per item is the coefficient 3.':'Not yet. Match each number to its contextual role: fixed amount first, rate multiplied by the input.';
      }));
    });
  }
  function bindTrace(root){
    root.querySelectorAll('[data-fn21-trace]').forEach(lab=>{
      if(lab.dataset.bound==='1')return;
      lab.dataset.bound='1';
      const input=lab.querySelector('[data-trace-x]'),output=lab.querySelector('[data-trace-output]'),path=lab.querySelector('[data-trace-path]'),line=lab.querySelector('[data-trace-line]'),point=lab.querySelector('[data-trace-point]');
      const fn=x=>0.12*(x+2)*(x-1)*(x-5),px=x=>45+(x+4)/10*540,py=y=>215-y*7.5;
      if(path){const points=[];for(let x=-4;x<=6.0001;x+=0.05)points.push(`${points.length?'L':'M'}${px(x).toFixed(2)} ${py(fn(x)).toFixed(2)}`);path.setAttribute('d',points.join(' '));}
      const update=()=>{const x=Number(input?.value||0),y=fn(x),xp=px(x),yp=py(y);line?.setAttribute('x1',xp);line?.setAttribute('x2',xp);point?.setAttribute('cx',xp);point?.setAttribute('cy',yp);if(output)output.textContent=`x = ${x.toFixed(1)} · f(x) = ${y.toFixed(3)} · ${y>0?'positive':y<0?'negative':'zero'}`;};
      input?.addEventListener('input',update);update();
    });
  }
  function bindInverse(root){
    root.querySelectorAll('[data-fn21-inverse]').forEach(lab=>{
      if(lab.dataset.bound==='1')return;
      lab.dataset.bound='1';
      const input=lab.querySelector('[data-inverse-x]'),readout=lab.querySelector('[data-inverse-readout]'),original=lab.querySelector('[data-original-point]'),inverse=lab.querySelector('[data-inverse-point]'),diagonal=lab.querySelector('[data-inverse-line]');
      const mapX=value=>180+20*value,mapY=value=>230-20*value;
      if(diagonal){diagonal.setAttribute('x1',mapX(-5));diagonal.setAttribute('y1',mapY(-5));diagonal.setAttribute('x2',mapX(10));diagonal.setAttribute('y2',mapY(10));}
      const update=()=>{const x=Number(input?.value||0),y=2*x+1;original?.setAttribute('cx',mapX(x));original?.setAttribute('cy',mapY(y));inverse?.setAttribute('cx',mapX(y));inverse?.setAttribute('cy',mapY(x));if(readout)readout.textContent=`Original point (${x}, ${y}) · inverse-relation point (${y}, ${x})`;};
      input?.addEventListener('input',update);update();
    });
  }
  function bindAll(){bindMatch(app);bindTrace(app);bindInverse(app);}
  new MutationObserver(()=>requestAnimationFrame(bindAll)).observe(app,{childList:true,subtree:true});
  bindAll();
})();
