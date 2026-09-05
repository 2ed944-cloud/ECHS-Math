/* Exact models for introductory covariation, without calculus prerequisites. */
(function(root){
  'use strict';
  const reader=[[-4,-2],[-2,2],[0,2],[2,-2],[4,0]];
  const wave=[[-3,4],[-1.5,0],[0,4],[1.5,0],[3,4]];
  const evidence=[[0,0],[.5,3],[1,1],[1.5,-1],[2,4],[2.5,7],[3,9]];
  const endCounter=[[0,1],[2,7],[4,3],[6,9]];
  function linear(points,x){
    if(!Number.isFinite(x)||x<points[0][0]||x>points.at(-1)[0])return null;
    for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];if(x<=b[0])return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);}
    return null;
  }
  function preimageLinear(points,y){
    const values=[],intervals=[];
    for(let i=1;i<points.length;i++){
      const [a,u]=points[i-1],[b,v]=points[i];
      if(u===v){if(y===u)intervals.push([a,b]);continue;}
      const x=a+(y-u)*(b-a)/(v-u);if(x>=a-1e-10&&x<=b+1e-10)values.push(Math.max(a,Math.min(b,x)));
    }
    return{values:values.sort((a,b)=>a-b).filter((x,i,arr)=>(i===0||Math.abs(x-arr[i-1])>1e-9)&&!intervals.some(([a,b])=>x>=a&&x<=b)),intervals};
  }
  function preimage(model,y,restricted=false){
    if(model==='wave')return preimageLinear(wave,y).values;
    if(y< -1||y>8)return[];
    const x=Math.sqrt(y+1),values=x===0?[0]:[-x,x];return restricted?values.filter(x=>x>=0):values;
  }
  function reservoir(t){return t<0||t>8?null:t<=3?10+8*t:t<=5?34:34-6*(t-5);}
  const shapes={
    'inc-up':{fn:x=>1+x*x/2,direction:'increasing',concavity:'up',rate:'increasing',words:'rises faster and faster'},
    'inc-down':{fn:x=>1+4*x-x*x/2,direction:'increasing',concavity:'down',rate:'decreasing',words:'rises more slowly'},
    'dec-up':{fn:x=>9-4*x+x*x/2,direction:'decreasing',concavity:'up',rate:'increasing',words:'falls more slowly'},
    'dec-down':{fn:x=>9-x*x/2,direction:'decreasing',concavity:'down',rate:'decreasing',words:'falls faster and faster'}
  };
  const stories={
    heating:{title:'Heating',input:'time t (min)',output:'temperature T(t) (°C)',start:20,step:40,expected:['inc-up','inc-down','constant'],text:'Start at 20°C. From 0 to 2 minutes, temperature rises faster and faster. From 2 to 4 minutes it keeps rising but more slowly. From 4 to 6 minutes it stays constant.'},
    draining:{title:'Draining',input:'time t (min)',output:'water V(t) (L)',start:100,step:40,expected:['dec-up','dec-down','constant'],text:'Start with 100 L. From 0 to 2 minutes the volume falls more slowly. From 2 to 4 minutes it falls faster and faster. From 4 to 6 minutes the volume remains constant.'},
    journey:{title:'Distance from home',input:'time t (min)',output:'distance D(t) (m)',start:0,step:40,expected:['inc-linear','constant','inc-linear'],text:'Start at home. Move steadily farther away for 2 minutes, remain at the same distance for 2 minutes, then move steadily farther away for another 2 minutes.'}
  };
  function stage(key,u){return key==='inc-up'?u*u:key==='inc-down'?2*u-u*u:key==='dec-up'?u*u-2*u:key==='dec-down'?-u*u:key==='inc-linear'?u:key==='dec-linear'?-u:0;}
  function storyValue(keys,t,name='heating'){
    if(t<0||t>6)return null;const s=stories[name];let y=s.start;
    for(let i=0;i<3;i++){const u=Math.max(0,Math.min(1,(t-2*i)/2));y+=s.step*stage(keys[i],u);}
    return y;
  }
  function storyCorrect(keys,name){return keys.length===3&&keys.every((k,i)=>k===stories[name].expected[i]);}
  function polynomial(x){return .08*(x+4)*(x-1)*(x-5);}
  const turns=[(2-Math.sqrt(61))/3,(2+Math.sqrt(61))/3];
  function constrained(x){return x< -2||x>6?null:x<=0?4-x*x:x<=4?4-x:(x-4)**2;}
  function parseNumber(text){
    const s=String(text??'').trim().replace(/−/g,'-');if(s.length>80)return null;
    if(/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(s)){const n=Number(s);return Number.isFinite(n)?n:null;}
    const p=s.split('/');if(p.length===2){const a=parseNumber(p[0]),b=parseNumber(p[1]);if(a!==null&&b!==null&&b!==0&&Number.isFinite(a/b))return a/b;}return null;
  }
  function parseSet(text){
    const s=String(text??'').trim().replace(/−/g,'-');
    if(/^(?:∅|empty|none|\{\s*\})$/i.test(s))return[];
    const pieces=s.replace(/^\{|\}$/g,'').split(',');const values=pieces.map(parseNumber);
    if(values.some(v=>v===null)||pieces.length>10)return null;
    return[...new Set(values)].sort((a,b)=>a-b);
  }
  function sameSet(actual,expected){const a=parseSet(actual);return a!==null&&a.length===expected.length&&a.every((v,i)=>Math.abs(v-expected[i])<1e-6);}
  function checkAnswer(value,q){
    const n=parseNumber(value),correct=n!==null&&Math.abs(n-Number(q.answer))<=(q.tolerance??1e-9);
    return{correct,message:correct?'Correct. Compare the value and its meaning with the worked solution.':n===null?'Enter a complete finite number or fraction.':'Not yet. Check the input, function rule and requested value.'};
  }
  function format(n,d=3){return Number.isFinite(n)?String(Number(n.toFixed(d))):'not in the domain';}
  function navKey(e){return !e.altKey&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&!e.target?.isContentEditable&&!/INPUT|TEXTAREA|SELECT|BUTTON|SUMMARY/.test(e.target?.tagName||'')&&['ArrowLeft','ArrowRight','PageUp','PageDown','Home','End'].includes(e.key);}
  const api={reader,wave,evidence,endCounter,linear,preimageLinear,preimage,reservoir,shapes,stories,stage,storyValue,storyCorrect,polynomial,turns,constrained,parseNumber,parseAnswer:parseNumber,parseSet,sameSet,checkAnswer,format,navKey};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.TandemModels=api;
})(typeof window!=='undefined'?window:globalThis);
