/* Exact arithmetic models and safe numeric entry for IB AI SL 1.2. */
(function(root){'use strict';
 const term=(a,d,n)=>a+(n-1)*d;
 const sum=(a,d,n)=>n*(2*a+(n-1)*d)/2;
 const rangeSum=(a,d,l,h)=>(h-l+1)*(term(a,d,l)+term(a,d,h))/2;
 const recover=(r,ur,s,us)=>{if(r===s)return null;const d=(us-ur)/(s-r);return {a:ur-(r-1)*d,d};};
 const differences=xs=>xs.slice(1).map((x,i)=>x-xs[i]);
 const estimate=xs=>(xs.at(-1)-xs[0])/(xs.length-1);
 const balance=(principal,rate,years)=>principal*(1+rate*years/100);
 function firstCrossing(a,d,target,{cumulative=false,inclusive=false,max=10000}={}){for(let n=1;n<=max;n++){const v=cumulative?sum(a,d,n):term(a,d,n);if(inclusive?v>=target:v>target)return n;}return null;}
 function parseNumber(value){const s=String(value).trim().replace(/−/g,'-');const number='[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:[eE][+-]?\\d+)?';if(new RegExp('^'+number+'$').test(s)){const n=Number(s);return Number.isFinite(n)?n:null;}const f=s.match(new RegExp('^('+number+')\\s*/\\s*('+number+')$'));if(f&&Number(f[2])!==0){const n=Number(f[1])/Number(f[2]);return Number.isFinite(n)?n:null;}return null;}
 function checkAnswer(value,q){const n=parseNumber(value),answer=Number(q.answer);const correct=n!==null&&Math.abs(n-answer)<=1e-9*Math.max(Math.abs(answer),1e-8);return {correct,message:n===null?'Enter a number or an exact fraction, without units in the box.':correct?'Correct. Explain the index, calculation and units in your working.':'Not yet. Check the first term, number of changes, and whether you need a term or a total.'};}
 const navKey=e=>!e.altKey&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&!e.target.closest?.('input,textarea,select,button,a,[contenteditable=true]')&&['ArrowLeft','ArrowRight','PageUp','PageDown','Home','End'].includes(e.key);
 const fmt=x=>Number(Number(x).toPrecision(10)).toString();
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function plot(series,{label='Discrete sequence plot',xLabel='term index',yLabel='term value'}={}){
  const all=series.flatMap(s=>s.points),xs=all.map(p=>p[0]),ys=all.map(p=>p[1]),xmin=Math.min(0,...xs),xmax=Math.max(1,...xs),lo=Math.min(0,...ys),hi=Math.max(1,...ys),pad=(hi-lo)*.08,ymin=lo<0?lo-pad:0,ymax=hi+pad;
  const X=x=>62+(x-xmin)/(xmax-xmin)*450,Y=y=>282-(y-ymin)/(ymax-ymin)*240;
  const line=(x1,y1,x2,y2,c)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}"/>`;
  let body='';for(let i=0;i<=5;i++){const y=ymin+i*(ymax-ymin)/5;body+=line(62,Y(y),512,Y(y),'#dce4ec')+`<text x="54" y="${Y(y)+5}" text-anchor="end">${fmt(Math.round(y*10)/10)}</text>`;}
  for(let i=0;i<=Math.min(10,xmax-xmin);i++){const x=xmin+i*(xmax-xmin)/Math.min(10,xmax-xmin);if(!Number.isInteger(x))continue;body+=`<text x="${X(x)}" y="308" text-anchor="middle">${x}</text>`;}
  body+=line(62,Y(0),512,Y(0),'#52657d')+line(62,42,62,282,'#52657d');
  series.forEach((s,i)=>{body+=s.points.map(([x,y])=>`<circle cx="${X(x)}" cy="${Y(y)}" r="${i?4:6}" fill="${i?'white':'#1269a0'}" stroke="${i?'#861e42':'#1269a0'}" stroke-width="2"><title>${esc(s.name)}: (${fmt(x)}, ${fmt(y)})</title></circle>`).join('');});
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 352" class="arithmetic-plot" role="img" aria-label="${esc(label)}"><title>${esc(label)}</title><rect width="560" height="352" fill="white"/>${body}<text x="285" y="337" text-anchor="middle">${esc(xLabel)}</text><text x="62" y="23">${esc(yLabel)}</text></svg>`;
 }
 const model={term,sum,rangeSum,recover,differences,estimate,balance,firstCrossing,parseNumber,checkAnswer,navKey,fmt,plot};if(typeof module==='object'&&module.exports)module.exports=model;else root.ArithmeticLessonModels=model;
})(typeof window==='undefined'?globalThis:window);
