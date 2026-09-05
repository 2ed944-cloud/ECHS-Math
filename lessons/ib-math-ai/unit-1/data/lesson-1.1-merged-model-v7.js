/* Decimal-aware checks for the combined AI SL 1.1 + 1.6 lesson. */
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
    if(q.dp!==undefined&&decimalPlaces(value)!==q.dp)return{correct:false,message:'The value is correct. Show exactly '+q.dp+' decimal places, including any required trailing zeros.'};
    if(q.sf!==undefined&&significantFigures(value)!==q.sf)return{correct:false,message:'The value is correct. Show exactly '+q.sf+' significant figures; use scientific form if integer zeros are ambiguous.'};
    return{correct:true,message:'Correct. The value and requested notation agree.'};
  }
  function correctAnswer(value,answer,tolerance=1e-9){const n=parseNumber(value);return n!==null&&Math.abs(n-answer)<=tolerance;}
  function bounds(value,unit){if(!Number.isFinite(value)||!Number.isFinite(unit)||unit<=0)return null;return{low:value-unit/2,high:value+unit/2,unit};}
  function percentageError(approx,exact){if(![approx,exact].every(Number.isFinite)||exact===0)return null;return Math.abs(approx-exact)/Math.abs(exact)*100;}
  function calculatedBounds(a,b,operation){
    if(!a||!b||a.low<=0||b.low<=0)return null;
    if(operation==='sum')return{low:a.low+b.low,high:a.high+b.high,lowClosed:true};
    if(operation==='difference')return{low:a.low-b.high,high:a.high-b.low,lowClosed:false};
    if(operation==='product')return{low:a.low*b.low,high:a.high*b.high,lowClosed:true};
    if(operation==='quotient')return{low:a.low/b.high,high:a.high/b.low,lowClosed:false};
    return null;
  }
  function format(v,d=6){if(!Number.isFinite(v))return 'undefined';return String(Number(v.toPrecision(d)));}
  function navKey(e){return !e.altKey&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&!/INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target?.tagName||'')&&['ArrowLeft','ArrowRight','PageUp','PageDown','Home','End'].includes(e.key);}
  const api={decimal,scientific,parseNumber,parseAnswer:parseNumber,decimalPlaces,significantFigures,roundPlaces,roundSF,checkAnswer,correctAnswer,bounds,percentageError,calculatedBounds,format,navKey};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PrecisionLessonModels=api;
})(typeof window!=='undefined'?window:globalThis);
