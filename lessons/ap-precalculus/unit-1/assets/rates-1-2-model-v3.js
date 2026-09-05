/* Exact models for Topic 1.2; student work uses finite average rates. */
(function(root){
  'use strict';
  const tank=[[0,720],[2,820],[5,910],[8,850]],reader=[[-2,5],[0,1],[2,5],[4,-3],[6,1]];
  function linear(points,x){
    if(!Number.isFinite(x)||x<points[0][0]||x>points.at(-1)[0])return null;
    for(let i=1;i<points.length;i++){const [a,u]=points[i-1],[b,v]=points[i];if(x<=b)return u+(v-u)*(x-a)/(b-a);}return null;
  }
  function average(fn,a,b){
    if(!Number.isFinite(a)||!Number.isFinite(b)||a===b)return null;
    const u=fn(a),v=fn(b);if(!Number.isFinite(u)||!Number.isFinite(v))return null;
    const result=(v-u)/(b-a);return Number.isFinite(result)?result:null;
  }
  function nearby(fn,c,h){return !Number.isFinite(h)||h<=0?null:{left:average(fn,c-h,c),right:average(fn,c,c+h),center:average(fn,c-h,c+h)};}
  const functions={
    quadratic:{name:'q(x) = x² − 3x + 2',fn:x=>x*x-3*x+2,domain:[-1,5],bounds:[-1,5,-2,14]},
    falling:{name:'L(x) = 12 − 2x',fn:x=>12-2*x,domain:[-1,5],bounds:[-1,5,-2,16]}
  };
  const zeroModels={flat:x=>5,hump:x=>5+3*x*(4-x),valley:x=>5-x*(4-x)};
  const comparisons={
    tank:{title:'Water added in two intervals',output:'L',input:'min',a:[100,2],b:[90,3]},
    people:{title:'Population increases',output:'people',input:'years',a:[100,4],b:[120,6]},
    cooling:{title:'Two cooling intervals',output:'°C',input:'min',a:[-8,2],b:[-9,3]}
  };
  const compareModels={
    cube:{name:'F(x) = x³',fn:x=>x*x*x,a:1,b:2,bounds:[0,3,0,28]},
    falling:{name:'H(x) = 40 − x²',fn:x=>40-x*x,a:1,b:3,bounds:[0,4,20,42]}
  };
  function shared(which,x){return which==='line'?2*x+1:2*x+1+2*x*(4-x);}
  function corner(x){return Math.abs(x-2)+1;}
  function smooth(x){return (x-2)**2+1;}
  function jump(x){return x<2?x:x+4;}
  function remaining(t){return !Number.isFinite(t)||t<0||t>8?null:120/(t+1);}
  const calculatorCases=[
    {label:'Average on [1.2,4.7]',a:1.2,b:4.7,point:null},
    {label:'Near t = 2, width 0.2',a:1.9,b:2.1,point:2},
    {label:'Near t = 2, width 0.02',a:1.99,b:2.01,point:2},
    {label:'Near t = 5, width 0.02',a:4.99,b:5.01,point:5}
  ];
  function precision(h,dp){const a=2-h,b=2+h,u=5+.04*a,v=5+.04*b,shownA=Number(u.toFixed(dp)),shownB=Number(v.toFixed(dp));return{a,b,u,v,shownA,shownB,rate:(shownB-shownA)/(b-a),fullRate:.04};}
  function reconstruct(initial,segments){return segments.reduce((value,s)=>value+s.rate*s.width,initial);}
  function parseNumber(text){
    const s=String(text??'').trim().replace(/−/g,'-');if(s.length>80)return null;
    if(/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(s)){const n=Number(s);return Number.isFinite(n)?n:null;}
    const p=s.split('/');if(p.length===2){const a=parseNumber(p[0]),b=parseNumber(p[1]);if(a!==null&&b!==null&&b!==0&&Number.isFinite(a/b))return a/b;}return null;
  }
  function checkAnswer(value,q){const n=parseNumber(value),correct=n!==null&&Math.abs(n-Number(q.answer))<=(q.tolerance??1e-8);return{correct,message:correct?'Correct. Compare your quotient, units and interpretation with the worked solution.':n===null?'Enter a complete finite number or fraction.':'Not yet. Check the endpoint values, input change and order of subtraction.'};}
  function format(n,dp=6){return Number.isFinite(n)?String(Number(n.toFixed(dp))):'undefined';}
  function navKey(e){return !e.altKey&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&!e.target?.isContentEditable&&!/INPUT|TEXTAREA|SELECT|BUTTON|SUMMARY/.test(e.target?.tagName||'')&&['ArrowLeft','ArrowRight','PageUp','PageDown','Home','End'].includes(e.key);}
  const api={tank,reader,linear,average,nearby,functions,zeroModels,comparisons,compareModels,shared,corner,smooth,jump,remaining,calculatorCases,precision,reconstruct,parseNumber,checkAnswer,format,navKey};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.RatesModels=api;
})(typeof window!=='undefined'?window:globalThis);
