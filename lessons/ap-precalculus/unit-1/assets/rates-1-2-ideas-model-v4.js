/* Pure mathematical models for the supplied-idea coverage. All scenarios are illustrative. */
(function(root){
  'use strict';
  const shapes={
    risingUp:{name:'Increasing, concave up',fn:x=>x*x+2,sign:'positive',bend:'up',bounds:[0,4,0,22]},
    risingDown:{name:'Increasing, concave down',fn:x=>20-(4-x)**2,sign:'positive',bend:'down',bounds:[0,4,0,22]},
    fallingUp:{name:'Decreasing, concave up',fn:x=>(4-x)**2+2,sign:'negative',bend:'up',bounds:[0,4,0,22]},
    fallingDown:{name:'Decreasing, concave down',fn:x=>20-x*x,sign:'negative',bend:'down',bounds:[0,4,0,22]}
  };
  const bend=x=>.15*x**3-1.8*x+8;
  const cycle=t=>26+6*Math.sin(Math.PI*t/6);
  const drainage=t=>340-12*t+6*Math.sin(t);
  const graphPoints=[[-4,3],[-3,0],[-2,5],[-1,4],[0,0],[1,-1],[2,1],[3,3],[4,2]];
  const ledgers={A:[14,-6,8,-3,5],B:[5,1,2,4,6]};
  const intervals=[[0,2,7],[2,5,-4],[5,9,3],[9,12,5]];
  const net=(list,count=list.length)=>list.slice(0,count).reduce((a,b)=>a+b,0);
  const cumulative=list=>list.reduce((a,v)=>[...a,a[a.length-1]+v],[0]);
  const amount=([a,b,r])=>(b-a)*r;
  const combinedRate=rows=>rows.reduce((s,r)=>s+amount(r),0)/rows.reduce((s,[a,b])=>s+b-a,0);
  const f=x=>-2*x;
  const g=(x,k)=>x<=4?-x:k==='varying'?-4+(x-4)**2:-4+Number(k)*(x-4);
  const sum=(x,k)=>f(x)+g(x,k);
  const sumBehavior=k=>k==='varying'?'mixed':Number(k)<2?'decreasing':Number(k)>2?'increasing':'constant';
  const api={shapes,bend,cycle,drainage,graphPoints,ledgers,intervals,net,cumulative,amount,combinedRate,f,g,sum,sumBehavior};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.RatesIdeaModels=api;
})(typeof window!=='undefined'?window:globalThis);
