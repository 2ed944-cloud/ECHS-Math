/* Exact models for the original Topic 1.1 context investigations. No calculus prerequisites. */
(function(root){
  'use strict';
  function car(t,{radius=3,period=10,gap=0,start='near'}={}){
    const angle=2*Math.PI*t/period+(start==='far'?Math.PI:0);
    return {distance:gap+radius*(1-Math.cos(angle)),angle,x:radius*Math.cos(angle),y:radius*Math.sin(angle)};
  }
  function projectile(t,{a=4.9,v=6.2,h=18}={}){return -a*t*t+v*t+h;}
  function flight({a=4.9,v=6.2,h=18}={}){
    const peakTime=Math.max(0,v/(2*a)),impact=(v+Math.sqrt(v*v+4*a*h))/(2*a);
    return {peakTime,peakHeight:projectile(peakTime,{a,v,h}),impact,fallTime:impact-peakTime};
  }
  function cubic(x,{center=1,width=2,sign=-1,scale=3,shift=5}={}){const u=x-center;return sign*(u*u*u-3*width*width*u)/scale+shift;}
  const vessels={
    neck:{title:'Narrowing body, straight narrow neck',segments:[[0,8,100,16],[8,12,16,16]]},
    widening:{title:'Widening body, straight wide neck',segments:[[0,8,16,100],[8,12,100,100]]},
    cylinder:{title:'Constant cross-sectional area',segments:[[0,12,49,49]]},
    hourglass:{title:'Narrows, then widens',segments:[[0,6,81,16],[6,12,16,81]]},
    bulb:{title:'Widens, then narrows to a neck',segments:[[0,4,25,100],[4,9,100,16],[9,12,16,16]]}
  };
  function area(key,h){const s=vessels[key].segments.find(s=>h<=s[1]+1e-9)||vessels[key].segments.at(-1);return s[2]+(s[3]-s[2])*(h-s[0])/(s[1]-s[0]);}
  function volume(key,h=12){let total=0;for(const [lo,hi,a,b] of vessels[key].segments){const z=Math.max(0,Math.min(h,hi)-lo);total+=a*z+(b-a)*z*z/(2*(hi-lo));}return total;}
  function waterHeight(key,t,flow=30){let remaining=Math.max(0,Math.min(volume(key),flow*t));for(const [lo,hi,a,b] of vessels[key].segments){const k=(b-a)/(hi-lo),capacity=(a+b)*(hi-lo)/2;if(remaining<=capacity+1e-9){const z=Math.abs(k)<1e-10?remaining/a:2*remaining/(a+Math.sqrt(Math.max(0,a*a+2*k*remaining)));return Math.min(hi,lo+z);}remaining-=capacity;}return 12;}
  const api={car,projectile,flight,cubic,vessels,area,volume,waterHeight};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.TandemContexts=api;
})(typeof window!=='undefined'?window:globalThis);
