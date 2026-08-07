(function(){
  'use strict';
  const app=document.getElementById('app');
  if(!app||String(window.LESSON_DATA?.lesson?.number)!=='2.1')return;
  let scheduled=false;
  const mapX=value=>210+24*value;
  const mapY=value=>270-18*value;
  function bind(root){
    root.querySelectorAll('[data-cover-next]').forEach(button=>{
      if(button.dataset.bound==='1')return;
      button.dataset.bound='1';
      button.addEventListener('click',()=>document.getElementById('next-slide')?.click());
    });
    root.querySelectorAll('.route-jump[data-go]').forEach(button=>{
      if(button.dataset.bound==='1')return;
      button.dataset.bound='1';
      button.addEventListener('click',()=>document.querySelector(`.route-btn[data-route="${button.dataset.go}"]`)?.click());
    });
    root.querySelectorAll('[data-fn4-inverse]').forEach(lab=>{
      if(lab.dataset.bound==='1')return;
      lab.dataset.bound='1';
      const input=lab.querySelector('[data-fn4-inverse-x],[data-inverse-x]');
      const readout=lab.querySelector('[data-fn4-inverse-readout]');
      const original=lab.querySelector('[data-fn4-original]');
      const inverse=lab.querySelector('[data-fn4-inverse-point]');
      const update=()=>{
        const x=Number(input?.value||0);
        const y=2*x+1;
        original?.setAttribute('cx',mapX(x));
        original?.setAttribute('cy',mapY(y));
        inverse?.setAttribute('cx',mapX(y));
        inverse?.setAttribute('cy',mapY(x));
        if(readout)readout.textContent=`Original point (${x}, ${y}) · reflected point (${y}, ${x})`;
      };
      input?.addEventListener('input',update);
      update();
    });
  }
  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;bind(app);});
  }
  new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
  bind(app);
})();
