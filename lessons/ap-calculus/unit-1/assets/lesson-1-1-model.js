/* Original ECHS Topic 1.1 models. Pure functions shared by the lesson and its numerical checks. */
(function(root){
  'use strict';
  const models={
    square:{label:'Position: s(t) = t²',tex:'s(t)=t^2',f:t=>t*t,slope:t=>2*t,secant:(a,b)=>a+b,domain:[0,4],range:[-1,17],at:2,input:'t (seconds)',output:'s (metres)',unit:'m/s'},
    line:{label:'Position: s(t) = 3t + 2',tex:'s(t)=3t+2',f:t=>3*t+2,slope:()=>3,secant:()=>3,domain:[0,4],range:[0,16],at:2,input:'t (seconds)',output:'s (metres)',unit:'m/s'},
    falling:{label:'Position: s(t) = 16 − t²',tex:'s(t)=16-t^2',f:t=>16-t*t,slope:t=>-2*t,secant:(a,b)=>-a-b,domain:[0,4],range:[-1,17],at:2,input:'t (seconds)',output:'s (metres)',unit:'m/s'},
    drop:{label:'Falling distance: s(t) = 16t²',tex:'s(t)=16t^2',f:t=>16*t*t,slope:t=>32*t,secant:(a,b)=>16*(a+b),domain:[0,1.2],range:[0,25],at:.7,input:'t (seconds)',output:'s (feet, downward)',unit:'ft/s'},
    airport:{label:'Airport: V(t) = 92 − 15 sin(t/3)',tex:'V(t)=92-15\\sin(t/3)',f:t=>92-15*Math.sin(t/3),slope:t=>-5*Math.cos(t/3),domain:[0,30],range:[72,112],at:18,input:'t (minutes)',output:'V (vehicles, model)',unit:'vehicles/min'},
    moon:{label:'Moon ball: s(t) = −2.72t² + 26.9t + 6',tex:'s(t)=-2.72t^2+26.9t+6',f:t=>-2.72*t*t+26.9*t+6,slope:t=>-5.44*t+26.9,secant:(a,b)=>26.9-2.72*(a+b),domain:[0,10],range:[0,80],at:7,input:'t (seconds)',output:'s (feet)',unit:'ft/s'},
    pendulum:{label:'Pendulum: d(t) = 20 + 16 cos(πt/3)',tex:'d(t)=20+16\\cos(\\pi t/3)',f:t=>20+16*Math.cos(Math.PI*t/3),slope:t=>-16*Math.PI/3*Math.sin(Math.PI*t/3),domain:[0,6],range:[0,40],at:2.5,input:'t (seconds)',output:'d (feet from wall)',unit:'ft/s'},
    balance:{label:'Savings: P(t) = 500(1.06)ᵗ',tex:'P(t)=500(1.06)^t',f:t=>500*Math.pow(1.06,t),slope:t=>500*Math.pow(1.06,t)*Math.log(1.06),domain:[0,5],range:[480,700],at:1,input:'t (years)',output:'P (dollars, model)',unit:'dollars/year'},
    corner:{label:'Corner: p(t) = |t − 2|',tex:'p(t)=|t-2|',f:t=>Math.abs(t-2),domain:[0,4],range:[-.3,2.5],at:2,input:'t (seconds)',output:'p (metres)',unit:'m/s'},
    cube:{label:'Crossing tangent: f(x) = x³',tex:'f(x)=x^3',f:t=>t*t*t,slope:t=>3*t*t,secant:(a,b)=>a*a+a*b+b*b,domain:[-2,2],range:[-8.5,8.5],at:0,input:'x',output:'f(x)',unit:'output/input'}
  };
  const bikePoints=[[0,0],[2,600],[4,1000],[5,700],[6,900],[8,1300]];
  function bike(t){
    t=Math.max(0,Math.min(8,Number(t)));let distance=0;
    for(let i=1;i<bikePoints.length;i++){
      const [a,pa]=bikePoints[i-1], [b,pb]=bikePoints[i];
      if(t<=b){const position=pa+(pb-pa)*(t-a)/(b-a);return{position,distance:distance+Math.abs(position-pa),time:t};}
      distance+=Math.abs(pb-pa);
    }
  }
  function average(model,a,b){a=Number(a);b=Number(b);if(!Number.isFinite(a)||!Number.isFinite(b)||a===b)return null;return model.secant?model.secant(a,b):(model.f(b)-model.f(a))/(b-a);}
  function nearby(model,c,h){if(!Number.isFinite(c)||!Number.isFinite(h)||h<=0||c-h<model.domain[0]||c+h>model.domain[1])return null;return{h,left:average(model,c-h,c),right:average(model,c,c+h),center:average(model,c-h,c+h),leftValue:model.f(c-h),atValue:model.f(c),rightValue:model.f(c+h)};}
  function parseNumber(value){const s=String(value).trim().replace(/−/g,'-');if(!s)return null;if(/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)\s*\/\s*[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s)){const [a,b]=s.split('/').map(Number);return b!==0?a/b:null;}if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(s))return null;const n=Number(s);return Number.isFinite(n)?n:null;}
  function correctNumber(value,answer,tolerance=.001){const n=parseNumber(value);return n!==null&&Math.abs(n-answer)<=tolerance+1e-10;}
  function format(n,d=3){if(n===null||!Number.isFinite(n))return'undefined';return(Math.abs(n)<.5*Math.pow(10,-d)?0:n).toFixed(d);}
  function navKey(event){return!event.defaultPrevented&&!event.altKey&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.target?.closest?.('input,textarea,select,button,a,summary,[contenteditable="true"],[role="dialog"]')&&['ArrowRight','ArrowLeft','PageDown','PageUp','Home','End'].includes(event.key);}
  const api={models,bikePoints,bike,average,nearby,parseNumber,correctNumber,format,navKey};root.Calculus11=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
