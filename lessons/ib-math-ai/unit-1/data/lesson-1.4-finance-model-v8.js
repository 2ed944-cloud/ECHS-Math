/* SL 1.4 + SL 1.7 financial models, validated domain and precision-aware answers. */
(function(root){
  'use strict';
  function clean(value){return String(value??'').trim().replace(/−/g,'-');}
  function decimal(value){
    const text=clean(value);if(text.length>80)return null;
    const m=text.match(/^([+-]?)(\d+(?:\.\d*)?|\.\d+)(?:[eE]([+-]?\d+))?$/);
    if(!m||Math.abs(Number(m[3]||0))>300)return null;
    const n=Number(text);if(!Number.isFinite(n))return null;
    const bits=m[2].split('.'),digits=(bits[0]+(bits[1]||'')).replace(/^0+/,'')||'0';
    return{number:n,sign:m[1]==='-'?-1:1,digits,exp:Number(m[3]||0)-(bits[1]||'').length,mantissa:m[2]};
  }
  function scientific(value){
    const m=clean(value).match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*(?:×|x|\*)\s*10\s*\^\s*\{?([+-]?\d+)\}?$/i);
    if(!m)return null;const d=decimal(m[1]+'e'+m[2]);return d?{...d,coefficient:Number(m[1]),coefficientText:m[1],power:Number(m[2])}:null;
  }
  function parseNumber(value){
    const text=clean(value),d=decimal(text)||scientific(text);if(d)return d.number;
    const parts=text.split('/');if(parts.length!==2)return null;
    const a=decimal(parts[0]),b=decimal(parts[1]);if(!a||!b||b.number===0)return null;
    const v=a.number/b.number;return Number.isFinite(v)?v:null;
  }
  function decimalPlaces(text){const d=decimal(text);if(!d||/[eE]/.test(text))return null;return (d.mantissa.split('.')[1]||'').length;}
  function significantFigures(text){
    const s=scientific(text);if(s)return significantFigures(s.coefficientText);
    const d=decimal(text);if(!d||d.number===0)return null;
    let digits=d.mantissa.replace('.','').replace(/^0+/,'');
    if(!d.mantissa.includes('.'))digits=digits.replace(/0+$/,'');
    return digits.length;
  }
  function roundPlaces(value,places){
    const d=decimal(value);if(!d||!Number.isInteger(places)||Math.abs(places)>300)return null;
    const shift=d.exp+places;let integer=BigInt(d.digits);
    if(shift>=0)integer*=10n**BigInt(shift);
    else{const div=10n**BigInt(-shift),remainder=integer%div;integer=integer/div+(2n*remainder>=div?1n:0n);}
    let out=integer.toString();if(places>0){out=out.padStart(places+1,'0');out=out.slice(0,-places)+'.'+out.slice(-places);}else if(places<0)out+='0'.repeat(-places);
    return(d.sign<0&&integer!==0n?'-':'')+out;
  }
  function roundSF(value,figures){
    const d=decimal(value);if(!d||d.number===0||!Number.isInteger(figures)||figures<1||figures>12)return null;
    const exponent=d.digits.length-1+d.exp;
    let places=figures-1-exponent,rounded=roundPlaces(value,places),r=decimal(rounded);
    if(r&&r.number!==0&&r.digits.length-1+r.exp>exponent)rounded=roundPlaces(value,places-1);
    return rounded;
  }
  function checkAnswer(value,q){
    const n=parseNumber(value),expected=typeof q.answer==='number'?q.answer:parseNumber(q.answer);
    if(n===null)return{correct:false,message:'Enter a complete number, fraction, or scientific form such as 3.2 x 10^5.'};
    if(Math.abs(n-expected)>Math.abs(expected)*1e-10)return{correct:false,message:'Check the calculation and the requested accuracy.'};
    if(q.format==='scientific'){
      const s=scientific(value);if(!s||Math.abs(s.coefficient)<1||Math.abs(s.coefficient)>=10)return{correct:false,message:'The value is correct. Write normalized mathematical form a x 10^k with 1 ≤ a < 10 for these positive quantities.'};
    }
    if(q.format==='ordinary'&&decimalPlaces(value)===null)return{correct:false,message:'The value is correct. Write it as an ordinary decimal number, without a power of ten or a fraction.'};
    if(q.dp!==undefined&&decimalPlaces(value)!==q.dp)return{correct:false,message:'The value is correct. Show exactly '+q.dp+' decimal places, including any required trailing zeros.'};
    if(q.sf!==undefined&&significantFigures(value)!==q.sf)return{correct:false,message:'The value is correct. Show exactly '+q.sf+' significant figures; use scientific form if integer zeros are ambiguous.'};
    return{correct:true,message:'Correct. The value and requested notation agree.'};
  }
  function correctAnswer(value,answer,tolerance=1e-9){const n=parseNumber(value);return n!==null&&Math.abs(n-answer)<=tolerance;}

  function format(v,d=6){return Number.isFinite(v)?String(Number(v.toPrecision(d))):'undefined';}
  function navKey(e){return !e.altKey&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&!/INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target?.tagName||'')&&['ArrowLeft','ArrowRight','PageUp','PageDown','Home','End'].includes(e.key);}
  const valid=(p,r,k,t)=>[p,r,k,t].every(Number.isFinite)&&p>0&&[1,2,4,12].includes(k)&&t>=0&&1+r/(100*k)>0;
  function compound(p,r,k,t){return valid(p,r,k,t)?p*(1+r/(100*k))**(k*t):null;}
  function present(f,r,k,t){const factor=compound(1,r,k,t);return Number.isFinite(f)&&f>0&&factor!==null?f/factor:null;}
  function rate(p,f,k,t){return valid(p,0,k,t)&&Number.isFinite(f)&&f>0&&t>0?100*k*((f/p)**(1/(k*t))-1):null;}
  function periods(p,f,r,k){const factor=compound(1,r,k,1/k);return factor&&factor!==1&&f>0&&p>0?Math.log(f/p)/Math.log(factor):null;}
  function firstPeriod(p,f,r,k,strict=false){
    const n=periods(p,f,r,k);if(n===null||r<=0)return null;
    const hit=j=>{const v=compound(p,r,k,j/k),eps=1e-11*Math.max(p,f);return strict?v>f+eps:v>=f-eps;};
    let j=Math.max(0,Math.ceil(n-1e-10));if(!Number.isFinite(j)||j>100000)return null;
    while(!hit(j))j++;while(j>0&&hit(j-1))j--;return j;
  }
  function depreciation(p,d,t){return [p,d,t].every(Number.isFinite)&&p>0&&d>=0&&d<100&&t>=0?p*(1-d/100)**t:null;}
  function realValue(p,r,k,t,inflation){const f=compound(p,r,k,t);return f!==null&&Number.isFinite(inflation)&&inflation>-100?f/(1+inflation/100)**t:null;}

  function annuityFactor(ratePercent,k,n){const i=ratePercent/(100*k);return i===0?n:Math.expm1(n*Math.log1p(i))/i;}
  function annuityFV(payment,r,k,n){return payment*annuityFactor(r,k,n);}
  function loanPayment(principal,r,k,n){const i=r/(100*k);return i===0?principal/n:principal*i/(-Math.expm1(-n*Math.log1p(i)));}
  function balance(principal,payment,r,k,n){return principal*(1+r/(100*k))**n-payment*annuityFactor(r,k,n);}
  function schedule(principal,payment,r,k,n){let b=principal;const rows=[];for(let j=1;j<=n&&b>1e-8;j++){const interest=b*r/(100*k),paid=Math.min(payment,b+interest),capital=paid-interest;b=Math.max(0,b-capital);rows.push({period:j,interest,payment:paid,principal:capital,balance:b});}return rows;}
  function solver({N,I,PV,PMT,FV,PpY,CpY},unknown){
    if(![1,2,4,12].includes(PpY)||PpY!==CpY)return {error:'Match PpY and CpY to the payment and compounding frequency for these tasks.'};
    const data={N,I,PV,PMT,FV};if(Object.entries(data).some(([k,v])=>k!==unknown&&!Number.isFinite(v)))return {error:'Enter every known value.'};
    if(unknown!=='N'&&N<=0)return {error:'N must be a positive number of periods.'};
    if(unknown!=='I'&&1+I/(100*CpY)<=0)return {error:'The periodic growth factor must be positive.'};
    const factor=(rate,n)=>Math.exp(n*Math.log1p(rate/(100*CpY)));
    let answer;
    if(unknown==='FV')answer=-PV*factor(I,N)-PMT*annuityFactor(I,CpY,N);
    if(unknown==='PV')answer=(-FV-PMT*annuityFactor(I,CpY,N))/factor(I,N);
    if(unknown==='PMT')answer=(-FV-PV*factor(I,N))/annuityFactor(I,CpY,N);
    if(unknown==='N'){
      const i=I/(100*CpY);
      answer=i===0?(PMT===0?NaN:-(PV+FV)/PMT):Math.log((PMT/i-FV)/(PV+PMT/i))/Math.log1p(i);
    }
    if(unknown==='I'){
      if(PMT===0)answer=100*CpY*((-FV/PV)**(1/N)-1);
      else{let lo=0,hi=100;const f=r=>PV*factor(r,N)+PMT*annuityFactor(r,CpY,N)+FV;let a=f(lo),b=f(hi);if(a*b>0)return {error:'No rate is bracketed from 0% to 100%; check the setup.'};for(let j=0;j<100;j++){const mid=(lo+hi)/2,c=f(mid);if(a*c<=0){hi=mid;b=c;}else{lo=mid;a=c;}}answer=(lo+hi)/2;}
    }
    return Number.isFinite(answer)&&!(unknown==='N'&&answer<0)?{answer}:{error:'These values do not give a finite solution. Check cash-flow signs and the unknown.'};
  }
  const api={decimal,parseNumber,parseAnswer:parseNumber,decimalPlaces,significantFigures,roundPlaces,roundSF,checkAnswer,correctAnswer,format,navKey,compound,present,rate,periods,firstPeriod,depreciation,realValue,annuityFactor,annuityFV,loanPayment,balance,schedule,solver};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.FinanceLessonModels=api;
})(typeof window!=='undefined'?window:globalThis);
